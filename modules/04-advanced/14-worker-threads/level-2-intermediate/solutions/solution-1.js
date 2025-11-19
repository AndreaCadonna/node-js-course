/**
 * Solution 1: Production-Ready Worker Pool
 *
 * This solution demonstrates:
 * - Complete worker pool implementation
 * - Task queue management
 * - Promise-based API
 * - Statistics tracking
 * - Error handling
 */

const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  class WorkerPool {
    constructor(workerScript, poolSize = 4) {
      this.workerScript = workerScript;
      this.poolSize = poolSize;
      this.workers = [];
      this.taskQueue = [];
      this.nextTaskId = 0;

      // Statistics
      this.stats = {
        tasksCompleted: 0,
        tasksErrored: 0,
        totalProcessingTime: 0
      };

      // Create worker pool
      this.createPool();
    }

    createPool() {
      for (let i = 0; i < this.poolSize; i++) {
        const workerInfo = {
          id: i,
          worker: new Worker(this.workerScript),
          busy: false,
          currentTask: null,
          tasksCompleted: 0
        };

        // Handle worker messages
        workerInfo.worker.on('message', (result) => {
          this.handleWorkerMessage(workerInfo, result);
        });

        // Handle worker errors
        workerInfo.worker.on('error', (err) => {
          this.handleWorkerError(workerInfo, err);
        });

        // Handle worker exit
        workerInfo.worker.on('exit', (code) => {
          if (code !== 0) {
            console.error(`Worker ${i} exited with code ${code}`);
          }
        });

        this.workers.push(workerInfo);
      }

      console.log(`Worker pool created with ${this.poolSize} workers`);
    }

    async execute(data) {
      return new Promise((resolve, reject) => {
        const task = {
          id: this.nextTaskId++,
          data,
          resolve,
          reject,
          startTime: Date.now()
        };

        // Try to find available worker
        const availableWorker = this.workers.find(w => !w.busy);

        if (availableWorker) {
          // Execute immediately
          this.assignTask(availableWorker, task);
        } else {
          // Queue for later
          this.taskQueue.push(task);
          console.log(`Task ${task.id} queued. Queue length: ${this.taskQueue.length}`);
        }
      });
    }

    assignTask(workerInfo, task) {
      workerInfo.busy = true;
      workerInfo.currentTask = task;

      console.log(`Worker ${workerInfo.id} executing task ${task.id}`);
      workerInfo.worker.postMessage(task.data);
    }

    handleWorkerMessage(workerInfo, result) {
      const task = workerInfo.currentTask;

      if (task) {
        const processingTime = Date.now() - task.startTime;

        // Update statistics
        this.stats.tasksCompleted++;
        this.stats.totalProcessingTime += processingTime;
        workerInfo.tasksCompleted++;

        console.log(`Worker ${workerInfo.id} completed task ${task.id} in ${processingTime}ms`);

        // Resolve the promise
        task.resolve(result);
      }

      // Mark worker as available
      workerInfo.busy = false;
      workerInfo.currentTask = null;

      // Process next queued task
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift();
        console.log(`Assigning queued task ${nextTask.id} to worker ${workerInfo.id}`);
        this.assignTask(workerInfo, nextTask);
      }
    }

    handleWorkerError(workerInfo, error) {
      const task = workerInfo.currentTask;

      if (task) {
        this.stats.tasksErrored++;

        console.error(`Worker ${workerInfo.id} error on task ${task.id}:`, error.message);

        // Reject the promise
        task.reject(error);
      }

      // Mark worker as available
      workerInfo.busy = false;
      workerInfo.currentTask = null;

      // Process next queued task
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift();
        this.assignTask(workerInfo, nextTask);
      }
    }

    getStats() {
      return {
        poolSize: this.poolSize,
        busyWorkers: this.workers.filter(w => w.busy).length,
        availableWorkers: this.workers.filter(w => !w.busy).length,
        queueLength: this.taskQueue.length,
        tasksCompleted: this.stats.tasksCompleted,
        tasksErrored: this.stats.tasksErrored,
        avgProcessingTime: this.stats.tasksCompleted > 0
          ? (this.stats.totalProcessingTime / this.stats.tasksCompleted).toFixed(2) + 'ms'
          : '0ms',
        workerStats: this.workers.map(w => ({
          id: w.id,
          busy: w.busy,
          tasksCompleted: w.tasksCompleted
        }))
      };
    }

    async terminate() {
      console.log('\nTerminating worker pool...');

      // Wait for all tasks to complete
      while (this.workers.some(w => w.busy)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Terminate all workers
      await Promise.all(
        this.workers.map(w => w.worker.terminate())
      );

      console.log('Worker pool terminated');
    }
  }

  // Test code
  async function test() {
    console.log('=== Worker Pool Solution ===\n');

    const pool = new WorkerPool(__filename, 4);

    console.log('Starting 20 tasks with 4 workers...\n');

    // Create 20 tasks with different inputs
    const tasks = Array.from({ length: 20 }, (_, i) => i + 30);

    const startTime = Date.now();

    const results = await Promise.all(
      tasks.map(n => pool.execute(n))
    );

    const endTime = Date.now();

    console.log('\n=== Results ===');
    console.log('All tasks completed!');
    console.log(`Total time: ${endTime - startTime}ms`);
    console.log('Sample results:', results.slice(0, 5));

    console.log('\n=== Pool Statistics ===');
    const stats = pool.getStats();
    console.log(JSON.stringify(stats, null, 2));

    await pool.terminate();
  }

  test().catch(console.error);

} else {
  // Worker code
  parentPort.on('message', (n) => {
    function fibonacci(num) {
      if (num <= 1) return num;
      return fibonacci(num - 1) + fibonacci(num - 2);
    }

    const result = fibonacci(n);
    parentPort.postMessage(result);
  });
}

/**
 * ALTERNATIVE APPROACHES:
 *
 * 1. Add task timeout:
 *    execute(data, timeout = 30000) {
 *      return Promise.race([
 *        this.executeTask(data),
 *        new Promise((_, reject) =>
 *          setTimeout(() => reject(new Error('Timeout')), timeout)
 *        )
 *      ]);
 *    }
 *
 * 2. Priority queue:
 *    this.taskQueue.sort((a, b) => b.priority - a.priority);
 *
 * 3. Dynamic scaling:
 *    if (this.taskQueue.length > threshold && this.workers.length < maxSize) {
 *      this.addWorker();
 *    }
 */
