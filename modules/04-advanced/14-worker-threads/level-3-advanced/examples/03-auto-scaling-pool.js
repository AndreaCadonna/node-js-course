/**
 * Level 3 Example 3: Auto-Scaling Worker Pool
 *
 * Demonstrates:
 * - Dynamic worker pool that scales based on load
 * - Monitoring queue depth and throughput
 * - Adding workers when overloaded
 * - Removing workers when idle
 * - Production-ready pool management
 */

const { Worker } = require('worker_threads');
const os = require('os');
const { performance } = require('perf_hooks');

class AutoScalingWorkerPool {
  constructor(workerScript, config = {}) {
    this.workerScript = workerScript;

    // Configuration
    this.minWorkers = config.minWorkers || 2;
    this.maxWorkers = config.maxWorkers || os.cpus().length;
    this.scaleUpThreshold = config.scaleUpThreshold || 5; // Queue length
    this.scaleDownThreshold = config.scaleDownThreshold || 0; // Idle workers
    this.scaleUpDelay = config.scaleUpDelay || 1000; // ms
    this.scaleDownDelay = config.scaleDownDelay || 5000; // ms

    // State
    this.workers = [];
    this.taskQueue = [];
    this.nextWorkerId = 0;
    this.nextTaskId = 0;

    // Statistics
    this.stats = {
      tasksCompleted: 0,
      tasksErrored: 0,
      totalProcessingTime: 0,
      scaleUpCount: 0,
      scaleDownCount: 0
    };

    // Monitoring
    this.lastScaleUp = 0;
    this.lastScaleDown = 0;

    // Initialize pool
    this.initialize();
    this.startMonitoring();
  }

  initialize() {
    console.log(`Initializing pool with ${this.minWorkers} workers`);
    for (let i = 0; i < this.minWorkers; i++) {
      this.addWorker();
    }
  }

  addWorker() {
    if (this.workers.length >= this.maxWorkers) {
      console.log('Cannot add worker: max limit reached');
      return null;
    }

    const workerId = this.nextWorkerId++;

    const workerInfo = {
      id: workerId,
      worker: new Worker(this.workerScript),
      busy: false,
      currentTask: null,
      tasksCompleted: 0,
      createdAt: Date.now()
    };

    workerInfo.worker.on('message', (result) => {
      this.handleWorkerMessage(workerInfo, result);
    });

    workerInfo.worker.on('error', (err) => {
      this.handleWorkerError(workerInfo, err);
    });

    this.workers.push(workerInfo);

    console.log(`✓ Added worker ${workerId} (total: ${this.workers.length})`);

    // Process queued tasks
    this.processQueue();

    return workerInfo;
  }

  async removeWorker() {
    if (this.workers.length <= this.minWorkers) {
      return false;
    }

    // Find idle worker
    const idleWorker = this.workers.find(w => !w.busy);

    if (!idleWorker) {
      return false;
    }

    console.log(`✓ Removing idle worker ${idleWorker.id} (total: ${this.workers.length - 1})`);

    // Remove from pool
    const index = this.workers.indexOf(idleWorker);
    this.workers.splice(index, 1);

    // Terminate worker
    await idleWorker.worker.terminate();

    return true;
  }

  startMonitoring() {
    // Check pool health and scale as needed
    this.monitorInterval = setInterval(() => {
      this.checkScaling();
      this.logStats();
    }, 1000);
  }

  checkScaling() {
    const now = Date.now();
    const busyWorkers = this.workers.filter(w => w.busy).length;
    const idleWorkers = this.workers.length - busyWorkers;
    const queueLength = this.taskQueue.length;

    // Scale up if queue is backing up
    if (queueLength > this.scaleUpThreshold &&
        this.workers.length < this.maxWorkers &&
        now - this.lastScaleUp > this.scaleUpDelay) {

      console.log(`\n⬆️  Scaling UP: Queue=${queueLength}, Workers=${this.workers.length}`);
      this.addWorker();
      this.stats.scaleUpCount++;
      this.lastScaleUp = now;
    }

    // Scale down if too many idle workers
    if (idleWorkers > this.scaleDownThreshold &&
        this.workers.length > this.minWorkers &&
        queueLength === 0 &&
        now - this.lastScaleDown > this.scaleDownDelay) {

      console.log(`\n⬇️  Scaling DOWN: Idle=${idleWorkers}, Workers=${this.workers.length}`);
      this.removeWorker();
      this.stats.scaleDownCount++;
      this.lastScaleDown = now;
    }
  }

  async execute(data) {
    return new Promise((resolve, reject) => {
      const task = {
        id: this.nextTaskId++,
        data,
        resolve,
        reject,
        startTime: performance.now()
      };

      const availableWorker = this.workers.find(w => !w.busy);

      if (availableWorker) {
        this.assignTask(availableWorker, task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  assignTask(workerInfo, task) {
    workerInfo.busy = true;
    workerInfo.currentTask = task;
    workerInfo.worker.postMessage(task.data);
  }

  handleWorkerMessage(workerInfo, result) {
    const task = workerInfo.currentTask;

    if (task) {
      const processingTime = performance.now() - task.startTime;

      this.stats.tasksCompleted++;
      this.stats.totalProcessingTime += processingTime;
      workerInfo.tasksCompleted++;

      task.resolve(result);
    }

    workerInfo.busy = false;
    workerInfo.currentTask = null;

    this.processQueue();
  }

  handleWorkerError(workerInfo, error) {
    const task = workerInfo.currentTask;

    if (task) {
      this.stats.tasksErrored++;
      task.reject(error);
    }

    workerInfo.busy = false;
    workerInfo.currentTask = null;

    this.processQueue();
  }

  processQueue() {
    while (this.taskQueue.length > 0) {
      const availableWorker = this.workers.find(w => !w.busy);

      if (!availableWorker) {
        break;
      }

      const task = this.taskQueue.shift();
      this.assignTask(availableWorker, task);
    }
  }

  logStats() {
    const busyWorkers = this.workers.filter(w => w.busy).length;

    console.log(`Workers: ${busyWorkers}/${this.workers.length} busy | Queue: ${this.taskQueue.length} | Completed: ${this.stats.tasksCompleted}`);
  }

  getStats() {
    return {
      ...this.stats,
      workers: this.workers.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      queueLength: this.taskQueue.length,
      avgProcessingTime: this.stats.tasksCompleted > 0
        ? (this.stats.totalProcessingTime / this.stats.tasksCompleted).toFixed(2)
        : 0
    };
  }

  async terminate() {
    clearInterval(this.monitorInterval);
    await Promise.all(this.workers.map(w => w.worker.terminate()));
    this.workers = [];
  }
}

// Test the auto-scaling pool
if (require.main === module) {
  const { Worker, isMainThread, parentPort } = require('worker_threads');

  if (isMainThread) {
    console.log('=== Auto-Scaling Worker Pool ===\n');

    // Create temp worker file
    const fs = require('fs');
    const path = require('path');
    const workerCode = `
      const { parentPort } = require('worker_threads');
      parentPort.on('message', (n) => {
        // Simulate CPU work
        let result = 0;
        for (let i = 0; i < n * 1000000; i++) {
          result += Math.sqrt(i);
        }
        parentPort.postMessage({ n, result: result.toFixed(2) });
      });
    `;

    const tmpWorker = path.join(__dirname, 'tmp-scaling-worker.js');
    fs.writeFileSync(tmpWorker, workerCode);

    const pool = new AutoScalingWorkerPool(tmpWorker, {
      minWorkers: 2,
      maxWorkers: 8,
      scaleUpThreshold: 3,
      scaleDownThreshold: 1
    });

    async function simulateLoad() {
      console.log('\n--- Phase 1: Light load (2 tasks/sec) ---\n');

      for (let i = 0; i < 10; i++) {
        pool.execute(5);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('\n--- Phase 2: Heavy load (10 tasks/sec) ---\n');

      const heavyTasks = [];
      for (let i = 0; i < 30; i++) {
        heavyTasks.push(pool.execute(10));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await Promise.all(heavyTasks);

      console.log('\n--- Phase 3: Cool down ---\n');

      await new Promise(resolve => setTimeout(resolve, 10000));

      console.log('\n=== Final Statistics ===');
      console.log(JSON.stringify(pool.getStats(), null, 2));

      await pool.terminate();

      // Cleanup
      fs.unlinkSync(tmpWorker);
    }

    simulateLoad().catch(console.error);
  }
}

module.exports = AutoScalingWorkerPool;
