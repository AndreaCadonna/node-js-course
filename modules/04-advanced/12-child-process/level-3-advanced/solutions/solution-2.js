/**
 * Solution 2: Task Queue System
 *
 * Distributed task queue with persistence, scheduling, autoscaling,
 * caching, retry logic, and dead letter queue.
 *
 * See exercise-2.js for full requirements.
 * This solution demonstrates key patterns and complete implementation.
 */

const { fork } = require('child_process');
const { EventEmitter } = require('events');
const fs = require('fs').promises;

class TaskQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.workerPath = options.workerPath;
    this.minWorkers = options.minWorkers || 2;
    this.maxWorkers = options.maxWorkers || 10;
    this.queueFile = options.queueFile || './task-queue.json';
    this.cacheMaxAge = options.cacheMaxAge || 60000;
    this.maxRetries = options.maxRetries || 3;
    this.baseRetryDelay = options.baseRetryDelay || 1000;

    this.workers = [];
    this.pendingTasks = [];
    this.scheduledTasks = [];
    this.deadLetterQueue = [];
    this.cache = new Map();
    this.taskCounter = 0;
    this.saveDebounceTimer = null;
  }

  async initialize() {
    await this.loadQueue();

    for (let i = 0; i < this.minWorkers; i++) {
      await this.addWorker();
    }

    setInterval(() => this.processScheduled(), 1000);
    setInterval(() => this.autoScale(), 5000);

    this.emit('ready');
  }

  async loadQueue() {
    try {
      const data = await fs.readFile(this.queueFile, 'utf8');
      const state = JSON.parse(data);
      this.pendingTasks = state.pending || [];
      this.scheduledTasks = state.scheduled || [];
      this.deadLetterQueue = state.deadLetter || [];
      this.taskCounter = state.taskCounter || 0;
    } catch (error) {
      // File doesn't exist yet
    }
  }

  async saveQueue() {
    clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = setTimeout(async () => {
      const state = {
        pending: this.pendingTasks,
        scheduled: this.scheduledTasks,
        deadLetter: this.deadLetterQueue,
        taskCounter: this.taskCounter
      };

      const tmpFile = this.queueFile + '.tmp';
      await fs.writeFile(tmpFile, JSON.stringify(state, null, 2));
      await fs.rename(tmpFile, this.queueFile);
    }, 100);
  }

  async addTask(taskData, options = {}) {
    const taskId = `task-${++this.taskCounter}`;

    const task = {
      id: taskId,
      data: taskData,
      priority: options.priority || 'normal',
      scheduledFor: options.scheduledFor,
      retries: 0,
      createdAt: Date.now()
    };

    if (task.scheduledFor && task.scheduledFor > Date.now()) {
      this.scheduledTasks.push(task);
    } else {
      this.pendingTasks.push(task);
      this.processPending();
    }

    await this.saveQueue();
    this.emit('task_added', { taskId });

    return taskId;
  }

  processScheduled() {
    const now = Date.now();
    const ready = [];

    this.scheduledTasks = this.scheduledTasks.filter(task => {
      if (task.scheduledFor <= now) {
        ready.push(task);
        return false;
      }
      return true;
    });

    if (ready.length > 0) {
      this.pendingTasks.push(...ready);
      this.processPending();
      this.saveQueue();
    }
  }

  async processPending() {
    while (this.pendingTasks.length > 0) {
      const worker = this.getAvailableWorker();
      if (!worker) break;

      const task = this.pendingTasks.shift();
      const cacheKey = JSON.stringify(task.data);
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
        this.emit('cache_hit', { taskId: task.id });
        continue;
      }

      worker.busy = true;
      worker.worker.send({ type: 'task', taskId: task.id, data: task.data });

      const handler = async (msg) => {
        if (msg.taskId === task.id) {
          worker.worker.removeListener('message', handler);
          worker.busy = false;

          if (msg.type === 'task_result') {
            this.cache.set(cacheKey, { result: msg.result, timestamp: Date.now() });
            this.emit('task_complete', { taskId: task.id });
          } else if (msg.type === 'task_error') {
            await this.retryTask(task, msg.error);
          }

          this.saveQueue();
          this.processPending();
        }
      };

      worker.worker.on('message', handler);
    }
  }

  async retryTask(task, error) {
    task.retries++;

    if (task.retries < this.maxRetries) {
      const delay = this.calculateRetryDelay(task.retries);
      task.scheduledFor = Date.now() + delay;
      this.scheduledTasks.push(task);
      this.emit('task_retry', { taskId: task.id, attempt: task.retries });
    } else {
      await this.moveToDeadLetterQueue(task, error);
    }
  }

  calculateRetryDelay(attempt) {
    const exponential = this.baseRetryDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * this.baseRetryDelay;
    return Math.min(exponential + jitter, 30000);
  }

  async moveToDeadLetterQueue(task, error) {
    this.deadLetterQueue.push({
      ...task,
      error,
      failedAt: Date.now()
    });
    this.emit('task_failed', { taskId: task.id });
    await this.saveQueue();
  }

  async addWorker() {
    if (this.workers.length >= this.maxWorkers) return;

    const worker = fork(this.workerPath);
    this.workers.push({ worker, busy: false });
    this.emit('worker_added', { count: this.workers.length });
  }

  async removeWorker() {
    if (this.workers.length <= this.minWorkers) return;

    const worker = this.workers.find(w => !w.busy);
    if (worker) {
      worker.worker.kill();
      this.workers = this.workers.filter(w => w !== worker);
      this.emit('worker_removed', { count: this.workers.length });
    }
  }

  autoScale() {
    const load = this.pendingTasks.length / (this.workers.length || 1);

    if (load > 3 && this.workers.length < this.maxWorkers) {
      this.addWorker();
    } else if (load < 1 && this.workers.length > this.minWorkers) {
      this.removeWorker();
    }
  }

  getAvailableWorker() {
    return this.workers.find(w => !w.busy && w.worker.connected);
  }

  getStats() {
    return {
      pending: this.pendingTasks.length,
      scheduled: this.scheduledTasks.length,
      deadLetter: this.deadLetterQueue.length,
      workers: this.workers.length,
      cacheSize: this.cache.size
    };
  }

  async shutdown() {
    await this.saveQueue();
    this.workers.forEach(w => w.worker.kill());
  }
}

module.exports = { TaskQueue };

/* This is a complete implementation showing all key features.
 * For production use, add:
 * - Better error handling
 * - Worker health checks
 * - Metrics collection
 * - More sophisticated autoscaling
 */
