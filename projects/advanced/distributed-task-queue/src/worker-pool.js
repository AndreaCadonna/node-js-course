/**
 * Worker Pool
 * Manages a pool of worker threads for task processing
 */

const { Worker } = require('worker_threads');
const { EventEmitter } = require('events');
const path = require('path');
const os = require('os');

class WorkerPool extends EventEmitter {
  constructor(options = {}) {
    super();

    this.workerScript = options.workerScript || path.join(__dirname, 'task-worker.js');
    this.poolSize = options.poolSize || os.cpus().length;
    this.taskHandlers = options.taskHandlers || new Map();

    this.workers = new Map();
    this.availableWorkers = new Set();
    this.busyWorkers = new Map(); // workerId -> taskId
    this.workerStats = new Map(); // workerId -> stats

    this.initialized = false;
  }

  /**
   * Initialize worker pool
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // Create workers
    for (let i = 0; i < this.poolSize; i++) {
      await this.createWorker();
    }

    this.initialized = true;
    this.emit('initialized', { poolSize: this.poolSize });
  }

  /**
   * Create a new worker
   */
  async createWorker() {
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const worker = new Worker(this.workerScript, {
      workerData: {
        workerId,
        taskHandlers: this.getHandlerPaths()
      }
    });

    // Worker stats
    this.workerStats.set(workerId, {
      tasksCompleted: 0,
      tasksFailed: 0,
      totalExecutionTime: 0,
      createdAt: Date.now(),
      restarts: 0
    });

    // Handle worker messages
    worker.on('message', (message) => {
      this.handleWorkerMessage(workerId, message);
    });

    // Handle worker errors
    worker.on('error', (error) => {
      this.emit('worker:error', { workerId, error });
      this.handleWorkerError(workerId, error);
    });

    // Handle worker exit
    worker.on('exit', (code) => {
      this.handleWorkerExit(workerId, code);
    });

    this.workers.set(workerId, worker);
    this.availableWorkers.add(workerId);

    this.emit('worker:created', { workerId });

    return workerId;
  }

  /**
   * Get handler file paths for worker
   */
  getHandlerPaths() {
    const paths = {};
    for (const [type, handlerPath] of this.taskHandlers) {
      paths[type] = handlerPath;
    }
    return paths;
  }

  /**
   * Execute task on available worker
   */
  async executeTask(task) {
    if (this.availableWorkers.size === 0) {
      throw new Error('No available workers');
    }

    const workerId = this.getNextWorker();
    const worker = this.workers.get(workerId);

    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    // Mark worker as busy
    this.availableWorkers.delete(workerId);
    this.busyWorkers.set(workerId, task.id);

    // Send task to worker
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Task execution timeout'));
      }, task.timeout);

      // Store promise handlers for worker response
      worker._taskResolve = (result) => {
        clearTimeout(timeout);
        resolve(result);
      };

      worker._taskReject = (error) => {
        clearTimeout(timeout);
        reject(error);
      };

      // Send task to worker
      worker.postMessage({
        type: 'execute',
        task: {
          id: task.id,
          type: task.type,
          payload: task.payload,
          timeout: task.timeout
        }
      });
    });
  }

  /**
   * Get next available worker (round-robin)
   */
  getNextWorker() {
    const workers = Array.from(this.availableWorkers);
    return workers[0];
  }

  /**
   * Handle worker message
   */
  handleWorkerMessage(workerId, message) {
    const worker = this.workers.get(workerId);

    switch (message.type) {
      case 'ready':
        this.emit('worker:ready', { workerId });
        break;

      case 'progress':
        this.emit('task:progress', {
          workerId,
          taskId: message.taskId,
          progress: message.progress
        });
        break;

      case 'success':
        this.handleTaskSuccess(workerId, message);
        break;

      case 'error':
        this.handleTaskError(workerId, message);
        break;

      case 'log':
        this.emit('worker:log', {
          workerId,
          level: message.level,
          message: message.message
        });
        break;

      default:
        console.warn(`Unknown message type from worker ${workerId}:`, message.type);
    }
  }

  /**
   * Handle task success
   */
  handleTaskSuccess(workerId, message) {
    const worker = this.workers.get(workerId);
    const taskId = this.busyWorkers.get(workerId);

    // Update stats
    const stats = this.workerStats.get(workerId);
    stats.tasksCompleted++;
    stats.totalExecutionTime += message.executionTime || 0;

    // Mark worker as available
    this.busyWorkers.delete(workerId);
    this.availableWorkers.add(workerId);

    // Resolve promise
    if (worker._taskResolve) {
      worker._taskResolve(message.result);
      delete worker._taskResolve;
      delete worker._taskReject;
    }

    this.emit('task:completed', {
      workerId,
      taskId,
      result: message.result,
      executionTime: message.executionTime
    });
  }

  /**
   * Handle task error
   */
  handleTaskError(workerId, message) {
    const worker = this.workers.get(workerId);
    const taskId = this.busyWorkers.get(workerId);

    // Update stats
    const stats = this.workerStats.get(workerId);
    stats.tasksFailed++;

    // Mark worker as available
    this.busyWorkers.delete(workerId);
    this.availableWorkers.add(workerId);

    // Reject promise
    if (worker._taskReject) {
      const error = new Error(message.error || 'Task execution failed');
      error.stack = message.stack;
      worker._taskReject(error);
      delete worker._taskResolve;
      delete worker._taskReject;
    }

    this.emit('task:failed', {
      workerId,
      taskId,
      error: message.error,
      stack: message.stack
    });
  }

  /**
   * Handle worker error
   */
  async handleWorkerError(workerId, error) {
    console.error(`Worker ${workerId} error:`, error);

    // If worker was processing a task, fail it
    const taskId = this.busyWorkers.get(workerId);
    if (taskId) {
      this.emit('task:failed', {
        workerId,
        taskId,
        error: error.message
      });
    }

    // Remove and restart worker
    await this.removeWorker(workerId);
    await this.createWorker();
  }

  /**
   * Handle worker exit
   */
  async handleWorkerExit(workerId, code) {
    if (code !== 0) {
      console.error(`Worker ${workerId} exited with code ${code}`);
    }

    this.emit('worker:exit', { workerId, code });

    // If worker was processing a task, fail it
    const taskId = this.busyWorkers.get(workerId);
    if (taskId) {
      this.emit('task:failed', {
        workerId,
        taskId,
        error: `Worker exited with code ${code}`
      });
    }

    // Remove and restart worker if pool is still active
    if (this.initialized) {
      await this.removeWorker(workerId);

      // Restart worker with delay
      const stats = this.workerStats.get(workerId);
      if (stats) {
        stats.restarts++;
      }

      setTimeout(async () => {
        if (this.initialized) {
          await this.createWorker();
        }
      }, 1000);
    }
  }

  /**
   * Remove worker from pool
   */
  async removeWorker(workerId) {
    const worker = this.workers.get(workerId);

    if (worker) {
      try {
        await worker.terminate();
      } catch (error) {
        console.error(`Error terminating worker ${workerId}:`, error);
      }
    }

    this.workers.delete(workerId);
    this.availableWorkers.delete(workerId);
    this.busyWorkers.delete(workerId);

    this.emit('worker:removed', { workerId });
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const stats = {
      poolSize: this.poolSize,
      activeWorkers: this.workers.size,
      availableWorkers: this.availableWorkers.size,
      busyWorkers: this.busyWorkers.size,
      workers: []
    };

    for (const [workerId, workerStats] of this.workerStats) {
      const isAvailable = this.availableWorkers.has(workerId);
      const currentTask = this.busyWorkers.get(workerId);

      stats.workers.push({
        id: workerId,
        status: isAvailable ? 'available' : 'busy',
        currentTask: currentTask || null,
        tasksCompleted: workerStats.tasksCompleted,
        tasksFailed: workerStats.tasksFailed,
        avgExecutionTime:
          workerStats.tasksCompleted > 0
            ? Math.round(workerStats.totalExecutionTime / workerStats.tasksCompleted)
            : 0,
        uptime: Date.now() - workerStats.createdAt,
        restarts: workerStats.restarts
      });
    }

    return stats;
  }

  /**
   * Get number of available workers
   */
  getAvailableCount() {
    return this.availableWorkers.size;
  }

  /**
   * Check if pool has available workers
   */
  hasAvailableWorkers() {
    return this.availableWorkers.size > 0;
  }

  /**
   * Shutdown worker pool
   */
  async shutdown() {
    this.initialized = false;

    // Terminate all workers
    const terminatePromises = Array.from(this.workers.keys()).map(workerId =>
      this.removeWorker(workerId)
    );

    await Promise.all(terminatePromises);

    this.emit('shutdown');
  }
}

module.exports = WorkerPool;
