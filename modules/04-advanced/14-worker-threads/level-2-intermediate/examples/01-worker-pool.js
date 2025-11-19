/**
 * Level 2 Example 1: Worker Pool Implementation
 *
 * Demonstrates:
 * - Creating a reusable worker pool
 * - Task queuing and distribution
 * - Worker reuse for efficiency
 * - Proper resource management
 */

const { Worker } = require('worker_threads');
const path = require('path');

class WorkerPool {
  constructor(workerScript, poolSize = 4) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];
    this.taskQueue = [];
    this.activeTasksCount = 0;

    // Create worker pool
    this.createPool();
  }

  createPool() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = {
        id: i,
        worker: new Worker(this.workerScript),
        busy: false
      };

      worker.worker.on('message', (result) => {
        this.handleWorkerMessage(worker, result);
      });

      worker.worker.on('error', (err) => {
        console.error(`Worker ${i} error:`, err);
      });

      this.workers.push(worker);
    }

    console.log(`Worker pool created with ${this.poolSize} workers`);
  }

  async execute(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject, id: Date.now() };

      const availableWorker = this.workers.find(w => !w.busy);

      if (availableWorker) {
        this.runTask(availableWorker, task);
      } else {
        // Queue task if all workers busy
        this.taskQueue.push(task);
        console.log(`Task queued. Queue length: ${this.taskQueue.length}`);
      }
    });
  }

  runTask(workerObj, task) {
    workerObj.busy = true;
    workerObj.currentTask = task;
    this.activeTasksCount++;

    console.log(`Worker ${workerObj.id} processing task ${task.id}`);
    workerObj.worker.postMessage(task.data);
  }

  handleWorkerMessage(workerObj, result) {
    const task = workerObj.currentTask;

    if (task) {
      console.log(`Worker ${workerObj.id} completed task ${task.id}`);
      task.resolve(result);
    }

    workerObj.busy = false;
    workerObj.currentTask = null;
    this.activeTasksCount--;

    // Process next queued task
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift();
      this.runTask(workerObj, nextTask);
    }
  }

  async terminate() {
    console.log('Terminating worker pool...');
    await Promise.all(this.workers.map(w => w.worker.terminate()));
    console.log('Worker pool terminated');
  }

  getStats() {
    return {
      poolSize: this.poolSize,
      busyWorkers: this.workers.filter(w => w.busy).length,
      queueLength: this.taskQueue.length,
      activeTasks: this.activeTasksCount
    };
  }
}

// Example usage
if (require.main === module) {
  const { Worker, isMainThread, parentPort } = require('worker_threads');

  if (isMainThread) {
    console.log('=== Worker Pool Example ===\n');

    // Create a simple worker script inline for demo
    const workerCode = `
      const { parentPort } = require('worker_threads');
      parentPort.on('message', (n) => {
        // Simulate CPU work
        let result = 0;
        for (let i = 0; i < 1000000 * n; i++) {
          result += Math.sqrt(i);
        }
        parentPort.postMessage({ input: n, result });
      });
    `;

    const fs = require('fs');
    const tmpWorker = path.join(__dirname, 'tmp-pool-worker.js');
    fs.writeFileSync(tmpWorker, workerCode);

    const pool = new WorkerPool(tmpWorker, 3);

    // Execute multiple tasks
    async function runDemo() {
      const tasks = [1, 2, 3, 4, 5, 6, 7, 8];

      console.log(`Executing ${tasks.length} tasks with ${pool.poolSize} workers\n`);

      const results = await Promise.all(
        tasks.map(task => pool.execute(task))
      );

      console.log('\nAll tasks completed!');
      console.log('Results:', results);

      console.log('\nFinal stats:', pool.getStats());

      await pool.terminate();

      // Cleanup
      fs.unlinkSync(tmpWorker);
    }

    runDemo().catch(console.error);
  }
}

module.exports = WorkerPool;
