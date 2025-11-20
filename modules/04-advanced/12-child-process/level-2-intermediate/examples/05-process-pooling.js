/**
 * EXAMPLE 5: Process Pooling
 *
 * This example demonstrates:
 * - Implementing a worker pool
 * - Load balancing across workers
 * - Resource management and limits
 * - Auto-scaling based on load
 * - Error recovery and worker replacement
 */

const { fork } = require('child_process');
const fs = require('fs');
const os = require('os');

console.log('=== Process Pooling Examples ===\n');

// Create worker scripts
const workerScripts = {
  cpu: '/tmp/cpu-worker.js',
  slow: '/tmp/slow-worker.js',
  unreliable: '/tmp/unreliable-worker.js'
};

// CPU-intensive worker
fs.writeFileSync(workerScripts.cpu, `
process.on('message', (msg) => {
  const { id, number } = msg;

  // CPU-intensive task: calculate fibonacci
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }

  const result = fibonacci(number);
  process.send({ id, result, worker: process.pid });
});
`);

// Slow worker (simulates I/O)
fs.writeFileSync(workerScripts.slow, `
process.on('message', (msg) => {
  const { id, duration } = msg;

  setTimeout(() => {
    process.send({
      id,
      completed: true,
      worker: process.pid,
      duration
    });
  }, duration);
});
`);

// Unreliable worker (random failures)
fs.writeFileSync(workerScripts.unreliable, `
let taskCount = 0;

process.on('message', (msg) => {
  taskCount++;

  // 30% chance of crash
  if (Math.random() < 0.3) {
    console.log(\`   [Worker \${process.pid}] Simulating crash on task \${taskCount}\`);
    process.exit(1);
  }

  setTimeout(() => {
    process.send({
      id: msg.id,
      result: 'success',
      worker: process.pid,
      taskCount
    });
  }, 100);
});
`);

// Example 1: Basic Worker Pool
function basicWorkerPool() {
  console.log('1. Basic Worker Pool');
  console.log('   Fixed-size pool with round-robin distribution\n');

  class WorkerPool {
    constructor(workerScript, size) {
      this.workers = [];
      this.currentWorker = 0;

      for (let i = 0; i < size; i++) {
        const worker = fork(workerScript);
        this.workers.push(worker);
      }

      console.log(`   Created pool with ${size} workers`);
    }

    getNextWorker() {
      const worker = this.workers[this.currentWorker];
      this.currentWorker = (this.currentWorker + 1) % this.workers.length;
      return worker;
    }

    sendTask(task) {
      const worker = this.getNextWorker();
      worker.send(task);
      return worker;
    }

    destroy() {
      this.workers.forEach(w => w.kill());
    }
  }

  const pool = new WorkerPool(workerScripts.cpu, 3);
  const tasks = [30, 31, 32, 33, 34, 35];
  let completed = 0;

  tasks.forEach((number, index) => {
    const worker = pool.sendTask({ id: index, number });

    worker.once('message', (result) => {
      console.log(`   Task ${result.id}: fibonacci(${number}) = ${result.result} [Worker ${result.worker}]`);
      completed++;

      if (completed === tasks.length) {
        console.log(`\n   All ${tasks.length} tasks completed`);
        pool.destroy();
        example2();
      }
    });
  });
}

// Example 2: Load-Balanced Pool
function example2() {
  console.log('\n2. Load-Balanced Worker Pool');
  console.log('   Assigns tasks to available workers\n');

  class LoadBalancedPool {
    constructor(workerScript, size) {
      this.workers = [];
      this.taskQueue = [];

      for (let i = 0; i < size; i++) {
        const worker = {
          process: fork(workerScript),
          busy: false,
          tasksCompleted: 0
        };

        worker.process.on('message', (result) => {
          this.handleResult(worker, result);
        });

        this.workers.push(worker);
      }

      console.log(`   Pool created with ${size} workers`);
    }

    execute(task) {
      return new Promise((resolve) => {
        this.taskQueue.push({ task, resolve });
        this.processQueue();
      });
    }

    processQueue() {
      const availableWorker = this.workers.find(w => !w.busy);

      if (availableWorker && this.taskQueue.length > 0) {
        const { task, resolve } = this.taskQueue.shift();
        availableWorker.busy = true;
        availableWorker.currentResolve = resolve;
        availableWorker.process.send(task);
      }
    }

    handleResult(worker, result) {
      worker.busy = false;
      worker.tasksCompleted++;
      worker.currentResolve(result);
      this.processQueue();
    }

    getStats() {
      return this.workers.map((w, i) => ({
        worker: i,
        pid: w.process.pid,
        busy: w.busy,
        completed: w.tasksCompleted
      }));
    }

    destroy() {
      this.workers.forEach(w => w.process.kill());
    }
  }

  const pool = new LoadBalancedPool(workerScripts.slow, 2);
  const tasks = [
    { id: 1, duration: 500 },
    { id: 2, duration: 200 },
    { id: 3, duration: 300 },
    { id: 4, duration: 100 },
    { id: 5, duration: 400 }
  ];

  console.log('   Submitting tasks with varying durations...\n');

  Promise.all(tasks.map(task => pool.execute(task)))
    .then(results => {
      results.forEach(r => {
        console.log(`   Task ${r.id} completed by worker ${r.worker} (${r.duration}ms)`);
      });

      console.log('\n   Worker Statistics:');
      pool.getStats().forEach(stat => {
        console.log(`   Worker ${stat.worker} (PID ${stat.pid}): ${stat.completed} tasks`);
      });

      pool.destroy();
      example3();
    });
}

// Example 3: Auto-Scaling Pool
function example3() {
  console.log('\n3. Auto-Scaling Worker Pool');
  console.log('   Dynamically adjusts pool size based on load\n');

  class AutoScalingPool {
    constructor(workerScript, minSize = 2, maxSize = 6) {
      this.workerScript = workerScript;
      this.workers = [];
      this.minSize = minSize;
      this.maxSize = maxSize;
      this.taskQueue = [];

      // Start with minimum workers
      for (let i = 0; i < minSize; i++) {
        this.addWorker();
      }

      console.log(`   Started with ${minSize} workers (max: ${maxSize})`);
    }

    addWorker() {
      const worker = {
        process: fork(this.workerScript),
        busy: false,
        tasksCompleted: 0
      };

      worker.process.on('message', (result) => {
        this.handleResult(worker, result);
      });

      this.workers.push(worker);
      return worker;
    }

    scaleUp() {
      if (this.workers.length < this.maxSize) {
        this.addWorker();
        console.log(`   Scaled UP to ${this.workers.length} workers`);
        return true;
      }
      return false;
    }

    scaleDown() {
      if (this.workers.length > this.minSize) {
        const idleWorker = this.workers.find(w => !w.busy);
        if (idleWorker) {
          const index = this.workers.indexOf(idleWorker);
          this.workers.splice(index, 1);
          idleWorker.process.kill();
          console.log(`   Scaled DOWN to ${this.workers.length} workers`);
          return true;
        }
      }
      return false;
    }

    execute(task) {
      return new Promise((resolve) => {
        this.taskQueue.push({ task, resolve });

        // Scale up if queue is building
        if (this.taskQueue.length > this.workers.length) {
          this.scaleUp();
        }

        this.processQueue();
      });
    }

    processQueue() {
      const availableWorker = this.workers.find(w => !w.busy);

      if (availableWorker && this.taskQueue.length > 0) {
        const { task, resolve } = this.taskQueue.shift();
        availableWorker.busy = true;
        availableWorker.currentResolve = resolve;
        availableWorker.process.send(task);
      }
    }

    handleResult(worker, result) {
      worker.busy = false;
      worker.tasksCompleted++;
      worker.currentResolve(result);
      this.processQueue();

      // Scale down if mostly idle
      const busyCount = this.workers.filter(w => w.busy).length;
      if (busyCount === 0 && this.taskQueue.length === 0) {
        setTimeout(() => this.scaleDown(), 100);
      }
    }

    destroy() {
      this.workers.forEach(w => w.process.kill());
    }
  }

  const pool = new AutoScalingPool(workerScripts.slow, 2, 4);

  // Burst of tasks
  const burst1 = Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    duration: 300
  }));

  console.log('   Sending burst of 8 tasks...\n');

  Promise.all(burst1.map(t => pool.execute(t)))
    .then(() => {
      console.log('\n   First burst complete');
      console.log('   Waiting for scale-down...\n');

      // Wait for scale down, then send smaller batch
      setTimeout(() => {
        const burst2 = Array.from({ length: 3 }, (_, i) => ({
          id: i + 9,
          duration: 200
        }));

        Promise.all(burst2.map(t => pool.execute(t)))
          .then(() => {
            console.log('\n   Second burst complete');
            pool.destroy();
            example4();
          });
      }, 500);
    });
}

// Example 4: Pool with Error Recovery
function example4() {
  console.log('\n4. Worker Pool with Error Recovery');
  console.log('   Automatically replaces crashed workers\n');

  class ResilientPool {
    constructor(workerScript, size) {
      this.workerScript = workerScript;
      this.size = size;
      this.workers = [];
      this.taskQueue = [];
      this.stats = { created: 0, crashed: 0, completed: 0 };

      for (let i = 0; i < size; i++) {
        this.addWorker();
      }

      console.log(`   Created resilient pool with ${size} workers`);
    }

    addWorker() {
      const worker = {
        process: fork(this.workerScript),
        busy: false,
        currentTask: null
      };

      this.stats.created++;

      worker.process.on('message', (result) => {
        this.stats.completed++;
        this.handleResult(worker, result);
      });

      worker.process.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.log(`   [Pool] Worker ${worker.process.pid} crashed! Replacing...`);
          this.stats.crashed++;

          // Requeue the task if there was one
          if (worker.currentTask) {
            this.taskQueue.unshift(worker.currentTask);
          }

          // Remove crashed worker
          const index = this.workers.indexOf(worker);
          if (index > -1) {
            this.workers.splice(index, 1);
          }

          // Replace with new worker
          this.addWorker();
          this.processQueue();
        }
      });

      this.workers.push(worker);
    }

    execute(task) {
      return new Promise((resolve) => {
        this.taskQueue.push({ task, resolve });
        this.processQueue();
      });
    }

    processQueue() {
      const availableWorker = this.workers.find(w => !w.busy);

      if (availableWorker && this.taskQueue.length > 0) {
        const item = this.taskQueue.shift();
        availableWorker.busy = true;
        availableWorker.currentTask = item;
        availableWorker.process.send(item.task);
      }
    }

    handleResult(worker, result) {
      worker.busy = false;
      if (worker.currentTask) {
        worker.currentTask.resolve(result);
        worker.currentTask = null;
      }
      this.processQueue();
    }

    destroy() {
      this.workers.forEach(w => w.process.kill());
    }
  }

  const pool = new ResilientPool(workerScripts.unreliable, 2);
  const tasks = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));

  console.log('   Sending 10 tasks to unreliable workers...\n');

  Promise.all(tasks.map(t => pool.execute(t)))
    .then(results => {
      console.log(`\n   All tasks completed successfully!`);
      console.log(`   Stats: Created=${pool.stats.created}, Crashed=${pool.stats.crashed}, Completed=${pool.stats.completed}`);
      pool.destroy();
      console.log('\n=== All Examples Completed ===');
      console.log('\nKey Concepts:');
      console.log('- Round-robin vs load-balanced distribution');
      console.log('- Auto-scaling based on queue depth');
      console.log('- Error recovery and worker replacement');
      console.log('- Resource limits and pool sizing');
    });
}

// Start the examples
basicWorkerPool();
