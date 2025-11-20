/**
 * SOLUTION 3: Process Pool Implementation
 *
 * This solution demonstrates:
 * - Worker pool management
 * - Task queuing
 * - Load distribution
 * - Worker crash detection and replacement
 * - Resource cleanup
 */

const { fork } = require('child_process');

class WorkerPool {
  constructor(workerScript, size) {
    this.workerScript = workerScript;
    this.size = size;
    this.workers = [];
    this.taskQueue = [];
    this.stats = {
      tasksCompleted: 0,
      tasksFailed: 0,
      workersCreated: 0,
      workersReplaced: 0
    };

    // Initialize workers
    for (let i = 0; i < size; i++) {
      this.addWorker();
    }
  }

  /**
   * Create a new worker
   */
  createWorker() {
    const process = fork(this.workerScript);

    const worker = {
      process,
      busy: false,
      currentTask: null
    };

    this.stats.workersCreated++;

    // Handle successful completion
    process.on('message', (result) => {
      this.handleSuccess(worker, result);
    });

    // Handle worker crash
    process.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        this.handleCrash(worker, code);
      }
    });

    return worker;
  }

  /**
   * Add a worker to the pool
   */
  addWorker() {
    const worker = this.createWorker();
    this.workers.push(worker);
    return worker;
  }

  /**
   * Handle task success
   */
  handleSuccess(worker, result) {
    worker.busy = false;
    this.stats.tasksCompleted++;

    if (worker.currentTask) {
      worker.currentTask.resolve(result);
      worker.currentTask = null;
    }

    this.processQueue();
  }

  /**
   * Handle worker crash
   */
  handleCrash(worker, code) {
    console.error(`Worker crashed with code ${code}`);
    this.stats.tasksFailed++;

    // Reject current task
    if (worker.currentTask) {
      worker.currentTask.reject(new Error(`Worker crashed: ${code}`));
      worker.currentTask = null;
    }

    // Remove crashed worker
    const index = this.workers.indexOf(worker);
    if (index > -1) {
      this.workers.splice(index, 1);
    }

    // Replace with new worker
    this.addWorker();
    this.stats.workersReplaced++;

    this.processQueue();
  }

  /**
   * Execute a task
   */
  execute(task) {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process queued tasks
   */
  processQueue() {
    // Find idle worker
    const availableWorker = this.workers.find(w => !w.busy);

    if (availableWorker && this.taskQueue.length > 0) {
      const taskItem = this.taskQueue.shift();

      availableWorker.busy = true;
      availableWorker.currentTask = taskItem;
      availableWorker.process.send(taskItem.task);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.workers.length,
      queueDepth: this.taskQueue.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      idleWorkers: this.workers.filter(w => !w.busy).length
    };
  }

  /**
   * Shutdown the pool gracefully
   */
  async shutdown() {
    // Wait for queue to empty
    while (this.taskQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Wait for all workers to become idle
    while (this.workers.some(w => w.busy)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Kill all workers
    this.workers.forEach(w => {
      if (!w.process.killed) {
        w.process.kill();
      }
    });

    this.workers = [];
  }
}

module.exports = WorkerPool;

// Demo if run directly
if (require.main === module) {
  const fs = require('fs');

  // Create demo worker
  const demoWorkerPath = '/tmp/demo-pool-worker.js';
  fs.writeFileSync(demoWorkerPath, `
process.on('message', (task) => {
  const { id, duration } = task;

  setTimeout(() => {
    process.send({
      id,
      result: \`Task \${id} completed\`,
      worker: process.pid
    });
  }, duration || 100);
});
  `);

  async function demo() {
    console.log('=== Solution 3 Demo ===\n');

    console.log('Creating pool with 3 workers...');
    const pool = new WorkerPool(demoWorkerPath, 3);

    console.log('\nExecuting 6 tasks...');
    const tasks = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      duration: 200
    }));

    const startTime = Date.now();
    const results = await Promise.all(
      tasks.map(task => pool.execute(task))
    );
    const duration = Date.now() - startTime;

    console.log(`\nCompleted ${results.length} tasks in ${duration}ms`);
    console.log('Statistics:', pool.getStats());

    await pool.shutdown();
    fs.unlinkSync(demoWorkerPath);

    console.log('\n=== Demo Complete ===');
  }

  demo().catch(console.error);
}
