/**
 * Queue Manager
 * Manages task queue with file-based persistence
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const Task = require('./task');

class QueueManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.queueDir = options.queueDir || path.join(process.cwd(), 'queue');
    this.tasks = new Map(); // In-memory task storage
    this.tasksByStatus = {
      [Task.STATUS.PENDING]: new Set(),
      [Task.STATUS.PROCESSING]: new Set(),
      [Task.STATUS.COMPLETED]: new Set(),
      [Task.STATUS.FAILED]: new Set(),
      [Task.STATUS.RETRYING]: new Set()
    };

    this.persistenceInterval = options.persistenceInterval || 5000; // 5 seconds
    this.autoCleanup = options.autoCleanup !== false;
    this.cleanupAge = options.cleanupAge || 24 * 60 * 60 * 1000; // 24 hours
    this.persistenceTimer = null;
    this.cleanupTimer = null;

    this.initialized = false;
  }

  /**
   * Initialize queue manager
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // Create queue directory
    await fs.promises.mkdir(this.queueDir, { recursive: true });

    // Load existing tasks
    await this.loadTasks();

    // Start periodic persistence
    this.startPersistence();

    // Start auto cleanup if enabled
    if (this.autoCleanup) {
      this.startCleanup();
    }

    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Add task to queue
   */
  async addTask(taskData) {
    const task = new Task(taskData);

    this.tasks.set(task.id, task);
    this.tasksByStatus[task.status].add(task.id);

    await this.persistTask(task);

    this.emit('task:added', task);

    return task;
  }

  /**
   * Get task by ID
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  /**
   * Get next pending task (highest priority, oldest first)
   */
  getNextTask() {
    const pendingTasks = Array.from(this.tasksByStatus[Task.STATUS.PENDING])
      .map(id => this.tasks.get(id))
      .filter(task => task !== undefined);

    if (pendingTasks.length === 0) {
      return null;
    }

    // Sort by priority (descending) then by creation time (ascending)
    pendingTasks.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.createdAt - b.createdAt;
    });

    return pendingTasks[0];
  }

  /**
   * Get tasks ready for retry
   */
  getRetryableTasks() {
    const now = Date.now();
    const retryingTasks = Array.from(this.tasksByStatus[Task.STATUS.RETRYING])
      .map(id => this.tasks.get(id))
      .filter(task => {
        if (!task) return false;
        const retryDelay = task.getRetryDelay();
        const timeSinceUpdate = now - task.updatedAt;
        return timeSinceUpdate >= retryDelay;
      });

    return retryingTasks;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId, newStatus) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const oldStatus = task.status;

    // Remove from old status set
    this.tasksByStatus[oldStatus].delete(taskId);

    // Update status
    task.status = newStatus;
    task.updatedAt = Date.now();

    // Add to new status set
    this.tasksByStatus[newStatus].add(taskId);

    await this.persistTask(task);

    this.emit('task:status-changed', { task, oldStatus, newStatus });
  }

  /**
   * Update task progress
   */
  async updateTaskProgress(taskId, progress) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.updateProgress(progress);

    this.emit('task:progress', { task, progress });
  }

  /**
   * Mark task as started
   */
  async startTask(taskId, workerId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.start(workerId);
    await this.updateTaskStatus(taskId, Task.STATUS.PROCESSING);

    this.emit('task:started', task);

    return task;
  }

  /**
   * Mark task as completed
   */
  async completeTask(taskId, result) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.complete(result);
    await this.updateTaskStatus(taskId, Task.STATUS.COMPLETED);

    this.emit('task:completed', task);
  }

  /**
   * Mark task as failed
   */
  async failTask(taskId, error) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.fail(error);

    const newStatus = task.canRetry() ? Task.STATUS.RETRYING : Task.STATUS.FAILED;
    await this.updateTaskStatus(taskId, newStatus);

    this.emit('task:failed', { task, willRetry: task.canRetry() });
  }

  /**
   * Retry a task
   */
  async retryTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== Task.STATUS.RETRYING) {
      throw new Error(`Task ${taskId} is not in retrying status`);
    }

    await this.updateTaskStatus(taskId, Task.STATUS.PENDING);

    this.emit('task:retry', task);
  }

  /**
   * Check for timed out tasks
   */
  async checkTimeouts() {
    const processingTasks = Array.from(this.tasksByStatus[Task.STATUS.PROCESSING])
      .map(id => this.tasks.get(id))
      .filter(task => task && task.hasTimedOut());

    for (const task of processingTasks) {
      await this.failTask(task.id, new Error('Task timeout'));
      this.emit('task:timeout', task);
    }

    return processingTasks.length;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const stats = {
      total: this.tasks.size,
      byStatus: {},
      avgWaitingTime: 0,
      avgExecutionTime: 0
    };

    // Count by status
    for (const [status, taskIds] of Object.entries(this.tasksByStatus)) {
      stats.byStatus[status] = taskIds.size;
    }

    // Calculate averages
    const completedTasks = Array.from(this.tasksByStatus[Task.STATUS.COMPLETED])
      .map(id => this.tasks.get(id))
      .filter(task => task !== undefined);

    if (completedTasks.length > 0) {
      const totalWaitingTime = completedTasks.reduce((sum, task) => sum + task.getWaitingTime(), 0);
      const totalExecutionTime = completedTasks.reduce((sum, task) => sum + task.getExecutionTime(), 0);

      stats.avgWaitingTime = Math.round(totalWaitingTime / completedTasks.length);
      stats.avgExecutionTime = Math.round(totalExecutionTime / completedTasks.length);
    }

    return stats;
  }

  /**
   * Persist task to disk
   */
  async persistTask(task) {
    const taskFile = path.join(this.queueDir, `${task.id}.json`);
    const data = JSON.stringify(task.toJSON(), null, 2);
    await fs.promises.writeFile(taskFile, data, 'utf8');
  }

  /**
   * Load all tasks from disk
   */
  async loadTasks() {
    try {
      const files = await fs.promises.readdir(this.queueDir);
      const taskFiles = files.filter(f => f.endsWith('.json'));

      for (const file of taskFiles) {
        try {
          const taskPath = path.join(this.queueDir, file);
          const data = await fs.promises.readFile(taskPath, 'utf8');
          const taskData = JSON.parse(data);
          const task = Task.fromJSON(taskData);

          this.tasks.set(task.id, task);
          this.tasksByStatus[task.status].add(task.id);
        } catch (error) {
          console.error(`Failed to load task from ${file}:`, error);
        }
      }

      this.emit('tasks:loaded', { count: this.tasks.size });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Start periodic persistence
   */
  startPersistence() {
    this.persistenceTimer = setInterval(async () => {
      try {
        await this.persistAll();
      } catch (error) {
        this.emit('error', error);
      }
    }, this.persistenceInterval);
  }

  /**
   * Persist all tasks
   */
  async persistAll() {
    const tasks = Array.from(this.tasks.values());
    await Promise.all(tasks.map(task => this.persistTask(task)));
    this.emit('tasks:persisted', { count: tasks.length });
  }

  /**
   * Start auto cleanup
   */
  startCleanup() {
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        this.emit('error', error);
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Clean up old completed/failed tasks
   */
  async cleanup() {
    const now = Date.now();
    const toRemove = [];

    for (const [taskId, task] of this.tasks) {
      if (
        (task.status === Task.STATUS.COMPLETED || task.status === Task.STATUS.FAILED) &&
        task.completedAt &&
        now - task.completedAt > this.cleanupAge
      ) {
        toRemove.push(taskId);
      }
    }

    for (const taskId of toRemove) {
      const task = this.tasks.get(taskId);
      this.tasks.delete(taskId);
      this.tasksByStatus[task.status].delete(taskId);

      // Remove file
      const taskFile = path.join(this.queueDir, `${taskId}.json`);
      try {
        await fs.promises.unlink(taskFile);
      } catch (error) {
        // Ignore if file doesn't exist
      }
    }

    this.emit('tasks:cleaned', { count: toRemove.length });
    return toRemove.length;
  }

  /**
   * Shutdown queue manager
   */
  async shutdown() {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Final persistence
    await this.persistAll();

    this.emit('shutdown');
  }
}

module.exports = QueueManager;
