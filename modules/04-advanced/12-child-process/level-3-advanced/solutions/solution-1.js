/**
 * Solution 1: Process Manager
 *
 * Complete implementation of a production-ready process manager
 * with worker pooling, priority queues, health monitoring, and
 * comprehensive metrics.
 */

const { fork } = require('child_process');
const { EventEmitter } = require('events');

/**
 * Priority Queue - Manages tasks by priority
 */
class PriorityQueue {
  constructor() {
    this.queues = {
      high: [],
      normal: [],
      low: []
    };
  }

  enqueue(item, priority = 'normal') {
    if (!this.queues[priority]) {
      throw new Error(`Invalid priority: ${priority}`);
    }
    this.queues[priority].push(item);
  }

  dequeue() {
    // Check queues in priority order
    if (this.queues.high.length > 0) return this.queues.high.shift();
    if (this.queues.normal.length > 0) return this.queues.normal.shift();
    if (this.queues.low.length > 0) return this.queues.low.shift();
    return null;
  }

  size() {
    return this.queues.high.length + this.queues.normal.length + this.queues.low.length;
  }

  getSizes() {
    return {
      high: this.queues.high.length,
      normal: this.queues.normal.length,
      low: this.queues.low.length,
      total: this.size()
    };
  }
}

/**
 * ProcessManager - Production-ready process pool manager
 */
class ProcessManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.workerPath = options.workerPath;
    this.poolSize = options.poolSize || 4;
    this.healthCheckInterval = options.healthCheckInterval || 5000;
    this.maxRestarts = options.maxRestarts || 3;
    this.shutdownTimeout = options.shutdownTimeout || 5000;

    this.workers = [];
    this.taskQueue = new PriorityQueue();
    this.taskCounter = 0;
    this.healthCheckTimer = null;
    this.accepting = true;

    this.metrics = {
      tasksSubmitted: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      totalProcessingTime: 0,
      workersRestarted: 0
    };
  }

  async initialize() {
    console.log(`Initializing pool with ${this.poolSize} workers...`);

    for (let i = 0; i < this.poolSize; i++) {
      await this.createWorker(i);
    }

    this.startHealthChecks();
    this.emit('ready');

    console.log('Process manager ready');
  }

  createWorker(id) {
    const worker = fork(this.workerPath);

    const workerInfo = {
      id,
      worker,
      available: true,
      currentTask: null,
      tasksCompleted: 0,
      tasksFailed: 0,
      restarts: 0,
      healthChecksFailed: 0,
      createdAt: Date.now()
    };

    // Message handler
    worker.on('message', (msg) => {
      this.handleMessage(workerInfo, msg);
    });

    // Error handler
    worker.on('error', (error) => {
      console.error(`Worker ${id} error:`, error.message);
      this.emit('worker_error', { workerId: id, error });
    });

    // Exit handler
    worker.on('exit', (code, signal) => {
      this.handleExit(workerInfo, code, signal);
    });

    this.workers.push(workerInfo);
    console.log(`Worker ${id} created (PID: ${worker.pid})`);

    return workerInfo;
  }

  handleMessage(workerInfo, msg) {
    if (msg.type === 'task_complete') {
      const { taskId, result } = msg;

      if (workerInfo.currentTask && workerInfo.currentTask.id === taskId) {
        const duration = Date.now() - workerInfo.currentTask.startTime;

        workerInfo.tasksCompleted++;
        this.metrics.tasksCompleted++;
        this.metrics.totalProcessingTime += duration;

        workerInfo.currentTask.resolve(result);
        workerInfo.currentTask = null;
        workerInfo.available = true;

        this.processQueue();
      }
    } else if (msg.type === 'task_error') {
      const { taskId, error } = msg;

      if (workerInfo.currentTask && workerInfo.currentTask.id === taskId) {
        workerInfo.tasksFailed++;
        this.metrics.tasksFailed++;

        workerInfo.currentTask.reject(new Error(error));
        workerInfo.currentTask = null;
        workerInfo.available = true;

        this.processQueue();
      }
    } else if (msg.type === 'health_check_response') {
      workerInfo.healthChecksFailed = 0;
    }
  }

  async handleExit(workerInfo, code, signal) {
    console.log(`Worker ${workerInfo.id} exited (code: ${code}, signal: ${signal})`);

    // Remove from workers
    const index = this.workers.indexOf(workerInfo);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }

    // Fail current task
    if (workerInfo.currentTask) {
      workerInfo.currentTask.reject(new Error(`Worker crashed`));
    }

    // Restart if under limit
    if (code !== 0 && workerInfo.restarts < this.maxRestarts) {
      console.log(`Restarting worker ${workerInfo.id} (attempt ${workerInfo.restarts + 1})`);
      this.metrics.workersRestarted++;

      const backoff = Math.min(1000 * Math.pow(2, workerInfo.restarts), 30000);
      await this.delay(backoff);

      const newWorker = this.createWorker(workerInfo.id);
      newWorker.restarts = workerInfo.restarts + 1;
    } else if (workerInfo.restarts >= this.maxRestarts) {
      console.error(`Worker ${workerInfo.id} exceeded max restarts`);
      this.emit('worker_failed', { workerId: workerInfo.id });
    }
  }

  async execute(task, priority = 'normal') {
    if (!this.accepting) {
      throw new Error('Not accepting new tasks');
    }

    return new Promise((resolve, reject) => {
      const taskId = ++this.taskCounter;
      this.metrics.tasksSubmitted++;

      const taskInfo = {
        id: taskId,
        data: task,
        priority,
        resolve,
        reject,
        startTime: Date.now()
      };

      const worker = this.getAvailableWorker();

      if (worker) {
        this.assignTask(worker, taskInfo);
      } else {
        this.taskQueue.enqueue(taskInfo, priority);
      }
    });
  }

  getAvailableWorker() {
    return this.workers.find(w => w.available && w.worker.connected);
  }

  assignTask(workerInfo, taskInfo) {
    workerInfo.available = false;
    workerInfo.currentTask = taskInfo;

    workerInfo.worker.send({
      type: 'task',
      taskId: taskInfo.id,
      data: taskInfo.data
    });
  }

  processQueue() {
    while (this.taskQueue.size() > 0) {
      const worker = this.getAvailableWorker();
      if (!worker) break;

      const taskInfo = this.taskQueue.dequeue();
      if (taskInfo) {
        this.assignTask(worker, taskInfo);
      }
    }
  }

  startHealthChecks() {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  async performHealthChecks() {
    for (const workerInfo of this.workers) {
      if (!workerInfo.worker.connected) {
        console.warn(`Worker ${workerInfo.id} disconnected`);
        continue;
      }

      const healthy = await this.healthCheck(workerInfo);

      if (!healthy) {
        workerInfo.healthChecksFailed++;

        if (workerInfo.healthChecksFailed >= 3) {
          console.error(`Worker ${workerInfo.id} failed health checks`);
          workerInfo.worker.kill('SIGTERM');
        }
      }
    }
  }

  async healthCheck(workerInfo) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 3000);

      const handler = (msg) => {
        if (msg.type === 'health_check_response') {
          clearTimeout(timeout);
          workerInfo.worker.removeListener('message', handler);
          resolve(true);
        }
      };

      workerInfo.worker.on('message', handler);
      workerInfo.worker.send({ type: 'health_check' });
    });
  }

  getStats() {
    const avgTime = this.metrics.tasksCompleted > 0
      ? this.metrics.totalProcessingTime / this.metrics.tasksCompleted
      : 0;

    return {
      pool: {
        size: this.poolSize,
        activeWorkers: this.workers.length,
        availableWorkers: this.workers.filter(w => w.available).length
      },
      queue: this.taskQueue.getSizes(),
      metrics: {
        ...this.metrics,
        averageProcessingTime: Math.round(avgTime)
      },
      workers: this.workers.map(w => ({
        id: w.id,
        available: w.available,
        tasksCompleted: w.tasksCompleted,
        tasksFailed: w.tasksFailed,
        restarts: w.restarts,
        uptime: Date.now() - w.createdAt
      }))
    };
  }

  async shutdown() {
    console.log('Shutting down process manager...');

    this.accepting = false;

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Reject queued tasks
    while (this.taskQueue.size() > 0) {
      const task = this.taskQueue.dequeue();
      if (task) {
        task.reject(new Error('Manager shutting down'));
      }
    }

    // Shutdown workers
    const shutdownPromises = this.workers.map(workerInfo => {
      return new Promise((resolve) => {
        if (!workerInfo.worker.connected) {
          resolve();
          return;
        }

        const timeout = setTimeout(() => {
          console.log(`Force killing worker ${workerInfo.id}`);
          workerInfo.worker.kill('SIGKILL');
          resolve();
        }, this.shutdownTimeout);

        workerInfo.worker.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });

        workerInfo.worker.send({ type: 'shutdown' });
        workerInfo.worker.kill('SIGTERM');
      });
    });

    await Promise.all(shutdownPromises);
    console.log('Shutdown complete');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Example worker implementation
function createTestWorker() {
  const fs = require('fs');
  const path = require('path');

  const workerCode = `
let taskCount = 0;

process.on('message', async (msg) => {
  if (msg.type === 'task') {
    taskCount++;
    try {
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, msg.data.duration || 100));

      process.send({
        type: 'task_complete',
        taskId: msg.taskId,
        result: {
          processed: msg.data,
          worker: process.pid,
          taskNumber: taskCount
        }
      });
    } catch (error) {
      process.send({
        type: 'task_error',
        taskId: msg.taskId,
        error: error.message
      });
    }
  } else if (msg.type === 'health_check') {
    process.send({ type: 'health_check_response' });
  } else if (msg.type === 'shutdown') {
    console.log('Worker shutting down gracefully');
    process.exit(0);
  }
});

console.log(\`Worker \${process.pid} ready\`);
`;

  const workerPath = path.join(__dirname, 'test-worker-solution-1.js');
  fs.writeFileSync(workerPath, workerCode);
  return workerPath;
}

// Test
async function test() {
  console.log('=== Process Manager Solution Test ===\n');

  const workerPath = createTestWorker();

  const manager = new ProcessManager({
    workerPath,
    poolSize: 3,
    maxRestarts: 2
  });

  await manager.initialize();

  // Submit tasks with different priorities
  const tasks = [
    manager.execute({ value: 1, duration: 150 }, 'low'),
    manager.execute({ value: 2, duration: 100 }, 'high'),
    manager.execute({ value: 3, duration: 120 }, 'normal'),
    manager.execute({ value: 4, duration: 100 }, 'high'),
    manager.execute({ value: 5, duration: 130 }, 'normal')
  ];

  const results = await Promise.all(tasks);
  console.log(`\n✓ Completed ${results.length} tasks\n`);

  // Show stats
  const stats = manager.getStats();
  console.log('Statistics:', JSON.stringify(stats, null, 2));

  await manager.shutdown();

  // Cleanup
  require('fs').unlinkSync(workerPath);

  console.log('\n=== Test Complete ===');
}

if (require.main === module) {
  test().catch(console.error);
}

module.exports = { ProcessManager, PriorityQueue };
