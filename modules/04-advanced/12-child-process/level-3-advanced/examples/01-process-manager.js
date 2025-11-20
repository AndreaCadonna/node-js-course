/**
 * Example 1: Building a Process Manager
 *
 * Demonstrates how to build a production-ready process manager with:
 * - Worker pool management
 * - Queue processing
 * - Auto-restart on failure
 * - Resource cleanup
 * - Performance monitoring
 */

const { fork } = require('child_process');
const { EventEmitter } = require('events');

console.log('=== Process Manager Example ===\n');

/**
 * ProcessManager - A robust process pool manager
 */
class ProcessManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.workerPath = options.workerPath;
    this.poolSize = options.poolSize || 4;
    this.maxRestarts = options.maxRestarts || 3;
    this.workers = [];
    this.queue = [];
    this.taskCounter = 0;
    this.stats = {
      tasksCompleted: 0,
      tasksFailed: 0,
      workersRestarted: 0,
      totalTasks: 0
    };
  }

  /**
   * Initialize the worker pool
   */
  async initialize() {
    console.log(`Initializing pool with ${this.poolSize} workers...`);

    for (let i = 0; i < this.poolSize; i++) {
      await this.createWorker(i);
    }

    console.log(`Pool initialized with ${this.workers.length} workers\n`);
    this.emit('ready');
  }

  /**
   * Create a new worker
   */
  async createWorker(id) {
    const worker = fork(this.workerPath, [], {
      env: { ...process.env, WORKER_ID: id }
    });

    const workerInfo = {
      id,
      worker,
      available: true,
      currentTask: null,
      tasksCompleted: 0,
      tasksFailed: 0,
      restarts: 0,
      startTime: Date.now()
    };

    // Handle messages from worker
    worker.on('message', (msg) => {
      this.handleWorkerMessage(workerInfo, msg);
    });

    // Handle worker errors
    worker.on('error', (error) => {
      console.error(`Worker ${id} error:`, error.message);
      this.handleWorkerError(workerInfo, error);
    });

    // Handle worker exit
    worker.on('exit', (code, signal) => {
      this.handleWorkerExit(workerInfo, code, signal);
    });

    this.workers.push(workerInfo);
    console.log(`Worker ${id} created`);

    return workerInfo;
  }

  /**
   * Handle messages from workers
   */
  handleWorkerMessage(workerInfo, msg) {
    if (msg.type === 'task_complete') {
      const { taskId, result } = msg;

      if (workerInfo.currentTask && workerInfo.currentTask.id === taskId) {
        workerInfo.tasksCompleted++;
        this.stats.tasksCompleted++;

        // Resolve the task promise
        workerInfo.currentTask.resolve(result);
        workerInfo.currentTask = null;
        workerInfo.available = true;

        // Process next task in queue
        this.processQueue();
      }
    } else if (msg.type === 'task_error') {
      const { taskId, error } = msg;

      if (workerInfo.currentTask && workerInfo.currentTask.id === taskId) {
        workerInfo.tasksFailed++;
        this.stats.tasksFailed++;

        // Reject the task promise
        workerInfo.currentTask.reject(new Error(error));
        workerInfo.currentTask = null;
        workerInfo.available = true;

        // Process next task in queue
        this.processQueue();
      }
    } else if (msg.type === 'log') {
      console.log(`[Worker ${workerInfo.id}] ${msg.message}`);
    }
  }

  /**
   * Handle worker errors
   */
  handleWorkerError(workerInfo, error) {
    this.emit('worker_error', { workerId: workerInfo.id, error });

    // Fail current task if any
    if (workerInfo.currentTask) {
      workerInfo.currentTask.reject(error);
      workerInfo.currentTask = null;
    }

    workerInfo.available = true;
  }

  /**
   * Handle worker exit
   */
  async handleWorkerExit(workerInfo, code, signal) {
    console.log(`Worker ${workerInfo.id} exited with code ${code}, signal ${signal}`);

    // Remove from workers array
    const index = this.workers.indexOf(workerInfo);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }

    // Fail current task if any
    if (workerInfo.currentTask) {
      workerInfo.currentTask.reject(
        new Error(`Worker exited with code ${code}`)
      );
    }

    // Restart worker if under restart limit
    if (code !== 0 && workerInfo.restarts < this.maxRestarts) {
      console.log(`Restarting worker ${workerInfo.id} (attempt ${workerInfo.restarts + 1})`);
      this.stats.workersRestarted++;

      const newWorkerInfo = await this.createWorker(workerInfo.id);
      newWorkerInfo.restarts = workerInfo.restarts + 1;
    } else if (workerInfo.restarts >= this.maxRestarts) {
      console.error(`Worker ${workerInfo.id} exceeded max restarts`);
      this.emit('worker_failed', { workerId: workerInfo.id });
    }
  }

  /**
   * Execute a task
   */
  async executeTask(task) {
    return new Promise((resolve, reject) => {
      const taskId = ++this.taskCounter;
      this.stats.totalTasks++;

      const taskInfo = {
        id: taskId,
        task,
        resolve,
        reject,
        createdAt: Date.now()
      };

      // Try to assign to available worker
      const worker = this.getAvailableWorker();

      if (worker) {
        this.assignTask(worker, taskInfo);
      } else {
        // Queue the task
        this.queue.push(taskInfo);
        console.log(`Task ${taskId} queued (queue size: ${this.queue.length})`);
      }
    });
  }

  /**
   * Get an available worker
   */
  getAvailableWorker() {
    return this.workers.find(
      w => w.available && w.worker.connected
    );
  }

  /**
   * Assign a task to a worker
   */
  assignTask(workerInfo, taskInfo) {
    workerInfo.available = false;
    workerInfo.currentTask = taskInfo;

    console.log(`Assigning task ${taskInfo.id} to worker ${workerInfo.id}`);

    workerInfo.worker.send({
      type: 'task',
      taskId: taskInfo.id,
      data: taskInfo.task
    });
  }

  /**
   * Process the queue
   */
  processQueue() {
    while (this.queue.length > 0) {
      const worker = this.getAvailableWorker();
      if (!worker) break;

      const taskInfo = this.queue.shift();
      this.assignTask(worker, taskInfo);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.poolSize,
      activeWorkers: this.workers.length,
      availableWorkers: this.workers.filter(w => w.available).length,
      queueSize: this.queue.length,
      workers: this.workers.map(w => ({
        id: w.id,
        available: w.available,
        tasksCompleted: w.tasksCompleted,
        tasksFailed: w.tasksFailed,
        restarts: w.restarts,
        uptime: Date.now() - w.startTime,
        currentTask: w.currentTask ? w.currentTask.id : null
      }))
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('\nShutting down process manager...');

    // Clear the queue
    this.queue.forEach(task => {
      task.reject(new Error('Manager shutting down'));
    });
    this.queue = [];

    // Shutdown all workers
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
        }, 5000);

        workerInfo.worker.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });

        workerInfo.worker.send({ type: 'shutdown' });
        workerInfo.worker.kill('SIGTERM');
      });
    });

    await Promise.all(shutdownPromises);
    console.log('All workers shut down');
  }
}

/**
 * Demo worker script (would normally be in a separate file)
 * This is what would be in worker.js
 */
function createDemoWorker() {
  // Create a temporary worker file
  const fs = require('fs');
  const path = require('path');

  const workerCode = `
// Worker process
const workerId = process.env.WORKER_ID;

process.on('message', async (msg) => {
  if (msg.type === 'task') {
    try {
      // Simulate task processing
      const { taskId, data } = msg;

      process.send({
        type: 'log',
        message: \`Processing task \${taskId}: \${data.operation}\`
      });

      // Simulate work
      await new Promise(resolve => setTimeout(resolve, data.duration || 100));

      // Simulate result
      const result = {
        operation: data.operation,
        input: data.value,
        output: data.value * 2,
        processedBy: workerId,
        timestamp: Date.now()
      };

      process.send({
        type: 'task_complete',
        taskId,
        result
      });
    } catch (error) {
      process.send({
        type: 'task_error',
        taskId: msg.taskId,
        error: error.message
      });
    }
  } else if (msg.type === 'shutdown') {
    console.log(\`Worker \${workerId} shutting down gracefully\`);
    process.exit(0);
  }
});

console.log(\`Worker \${workerId} ready\`);
`;

  const workerPath = path.join(__dirname, 'temp-worker.js');
  fs.writeFileSync(workerPath, workerCode);
  return workerPath;
}

/**
 * Demo
 */
async function demo() {
  // Create temporary worker file
  const workerPath = createDemoWorker();

  // Create process manager
  const manager = new ProcessManager({
    workerPath,
    poolSize: 3,
    maxRestarts: 3
  });

  // Listen to events
  manager.on('ready', () => {
    console.log('Process manager ready!\n');
  });

  manager.on('worker_error', ({ workerId, error }) => {
    console.error(`Worker ${workerId} encountered error:`, error.message);
  });

  manager.on('worker_failed', ({ workerId }) => {
    console.error(`Worker ${workerId} failed permanently`);
  });

  // Initialize
  await manager.initialize();

  console.log('=== Executing Tasks ===\n');

  // Execute multiple tasks
  const tasks = [];
  for (let i = 1; i <= 10; i++) {
    tasks.push(
      manager.executeTask({
        operation: `Task ${i}`,
        value: i,
        duration: Math.random() * 500 + 100
      })
    );
  }

  // Wait for all tasks to complete
  console.log(`\nWaiting for ${tasks.length} tasks to complete...\n`);

  try {
    const results = await Promise.all(tasks);
    console.log('\n=== All Tasks Completed ===\n');
    results.forEach((result, index) => {
      console.log(`Task ${index + 1}: ${result.input} → ${result.output} (worker ${result.processedBy})`);
    });
  } catch (error) {
    console.error('Task execution failed:', error.message);
  }

  // Show statistics
  console.log('\n=== Pool Statistics ===\n');
  const stats = manager.getStats();
  console.log('Overall Stats:');
  console.log(`  Total Tasks: ${stats.totalTasks}`);
  console.log(`  Completed: ${stats.tasksCompleted}`);
  console.log(`  Failed: ${stats.tasksFailed}`);
  console.log(`  Workers Restarted: ${stats.workersRestarted}`);
  console.log(`  Queue Size: ${stats.queueSize}`);
  console.log(`  Active Workers: ${stats.activeWorkers}/${stats.poolSize}`);
  console.log(`  Available Workers: ${stats.availableWorkers}`);

  console.log('\nWorker Details:');
  stats.workers.forEach(worker => {
    console.log(`  Worker ${worker.id}:`);
    console.log(`    Tasks Completed: ${worker.tasksCompleted}`);
    console.log(`    Tasks Failed: ${worker.tasksFailed}`);
    console.log(`    Restarts: ${worker.restarts}`);
    console.log(`    Uptime: ${worker.uptime}ms`);
    console.log(`    Available: ${worker.available}`);
  });

  // Shutdown
  await manager.shutdown();

  // Cleanup temp worker file
  require('fs').unlinkSync(workerPath);

  console.log('\n=== Demo Complete ===');
}

// Run demo
if (require.main === module) {
  demo().catch(console.error);
}

module.exports = { ProcessManager };
