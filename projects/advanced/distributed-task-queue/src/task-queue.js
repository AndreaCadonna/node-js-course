/**
 * Task Queue
 * Main orchestrator for distributed task processing
 */

const { EventEmitter } = require('events');
const QueueManager = require('./queue-manager');
const WorkerPool = require('./worker-pool');
const Task = require('./task');

class TaskQueue extends EventEmitter {
  constructor(options = {}) {
    super();

    this.queueManager = new QueueManager({
      queueDir: options.queueDir,
      persistenceInterval: options.persistenceInterval,
      autoCleanup: options.autoCleanup,
      cleanupAge: options.cleanupAge
    });

    this.workerPool = new WorkerPool({
      workerScript: options.workerScript,
      poolSize: options.poolSize,
      taskHandlers: options.taskHandlers || new Map()
    });

    this.processingInterval = options.processingInterval || 100; // 100ms
    this.processingTimer = null;
    this.retryCheckInterval = options.retryCheckInterval || 5000; // 5 seconds
    this.retryTimer = null;
    this.timeoutCheckInterval = options.timeoutCheckInterval || 10000; // 10 seconds
    this.timeoutTimer = null;

    this.running = false;
    this.shutdownRequested = false;

    // Setup event forwarding
    this.setupEventForwarding();
  }

  /**
   * Setup event forwarding from queue manager and worker pool
   */
  setupEventForwarding() {
    // Forward queue manager events
    this.queueManager.on('task:added', (task) => this.emit('task:added', task));
    this.queueManager.on('task:started', (task) => this.emit('task:started', task));
    this.queueManager.on('task:completed', (task) => this.emit('task:completed', task));
    this.queueManager.on('task:failed', (data) => this.emit('task:failed', data));
    this.queueManager.on('task:retry', (task) => this.emit('task:retry', task));
    this.queueManager.on('task:timeout', (task) => this.emit('task:timeout', task));
    this.queueManager.on('task:progress', (data) => this.emit('task:progress', data));

    // Forward worker pool events
    this.workerPool.on('worker:created', (data) => this.emit('worker:created', data));
    this.workerPool.on('worker:error', (data) => this.emit('worker:error', data));
    this.workerPool.on('worker:exit', (data) => this.emit('worker:exit', data));

    // Handle task completion from worker pool
    this.workerPool.on('task:completed', async (data) => {
      try {
        await this.queueManager.completeTask(data.taskId, data.result);
      } catch (error) {
        this.emit('error', error);
      }
    });

    // Handle task failure from worker pool
    this.workerPool.on('task:failed', async (data) => {
      try {
        const error = new Error(data.error);
        await this.queueManager.failTask(data.taskId, error);
      } catch (error) {
        this.emit('error', error);
      }
    });

    // Handle task progress from worker pool
    this.workerPool.on('task:progress', async (data) => {
      try {
        await this.queueManager.updateTaskProgress(data.taskId, data.progress);
      } catch (error) {
        this.emit('error', error);
      }
    });
  }

  /**
   * Initialize task queue
   */
  async initialize() {
    await this.queueManager.initialize();
    await this.workerPool.initialize();

    this.emit('initialized');
  }

  /**
   * Add task to queue
   */
  async addTask(taskData) {
    return await this.queueManager.addTask(taskData);
  }

  /**
   * Get task by ID
   */
  getTask(taskId) {
    return this.queueManager.getTask(taskId);
  }

  /**
   * Start processing tasks
   */
  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.shutdownRequested = false;

    // Start task processing loop
    this.processingTimer = setInterval(() => {
      this.processTasks().catch(error => this.emit('error', error));
    }, this.processingInterval);

    // Start retry check loop
    this.retryTimer = setInterval(() => {
      this.checkRetries().catch(error => this.emit('error', error));
    }, this.retryCheckInterval);

    // Start timeout check loop
    this.timeoutTimer = setInterval(() => {
      this.checkTimeouts().catch(error => this.emit('error', error));
    }, this.timeoutCheckInterval);

    this.emit('started');
  }

  /**
   * Stop processing tasks
   */
  stop() {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }

    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }

    if (this.timeoutTimer) {
      clearInterval(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    this.emit('stopped');
  }

  /**
   * Process pending tasks
   */
  async processTasks() {
    if (!this.running || this.shutdownRequested) {
      return;
    }

    // Process tasks while workers are available
    while (this.workerPool.hasAvailableWorkers()) {
      const task = this.queueManager.getNextTask();

      if (!task) {
        break; // No more pending tasks
      }

      try {
        // Mark task as started
        await this.queueManager.startTask(task.id, 'pool');

        // Execute task on worker
        this.workerPool.executeTask(task).catch(error => {
          // Error already handled by worker pool events
        });
      } catch (error) {
        this.emit('error', error);
      }
    }
  }

  /**
   * Check and retry failed tasks
   */
  async checkRetries() {
    if (!this.running || this.shutdownRequested) {
      return;
    }

    const retryableTasks = this.queueManager.getRetryableTasks();

    for (const task of retryableTasks) {
      try {
        await this.queueManager.retryTask(task.id);
      } catch (error) {
        this.emit('error', error);
      }
    }
  }

  /**
   * Check for timed out tasks
   */
  async checkTimeouts() {
    if (!this.running || this.shutdownRequested) {
      return;
    }

    try {
      const timedOutCount = await this.queueManager.checkTimeouts();
      if (timedOutCount > 0) {
        this.emit('timeouts:checked', { count: timedOutCount });
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const queueStats = this.queueManager.getStats();
    const workerStats = this.workerPool.getStats();

    return {
      queue: queueStats,
      workers: workerStats,
      running: this.running
    };
  }

  /**
   * Wait for all tasks to complete
   */
  async waitForCompletion(timeout = 0) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        const stats = this.queueManager.getStats();
        const hasActiveTasks =
          stats.byStatus[Task.STATUS.PENDING] > 0 ||
          stats.byStatus[Task.STATUS.PROCESSING] > 0 ||
          stats.byStatus[Task.STATUS.RETRYING] > 0;

        if (!hasActiveTasks) {
          resolve();
          return;
        }

        if (timeout > 0 && Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for tasks to complete'));
          return;
        }

        setTimeout(checkCompletion, 100);
      };

      checkCompletion();
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown(options = {}) {
    const { timeout = 30000, force = false } = options;

    this.shutdownRequested = true;
    this.emit('shutdown:requested');

    // Stop accepting new tasks
    this.stop();

    if (!force) {
      try {
        // Wait for active tasks to complete
        await this.waitForCompletion(timeout);
      } catch (error) {
        this.emit('error', error);
      }
    }

    // Shutdown worker pool
    await this.workerPool.shutdown();

    // Shutdown queue manager
    await this.queueManager.shutdown();

    this.emit('shutdown:complete');
  }
}

module.exports = TaskQueue;
