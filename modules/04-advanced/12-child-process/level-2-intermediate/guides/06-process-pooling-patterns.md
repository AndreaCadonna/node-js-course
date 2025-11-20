# Process Pooling Patterns

Master worker pool patterns for efficient concurrent processing and resource management.

## Table of Contents
- [Introduction](#introduction)
- [Why Process Pools?](#why-process-pools)
- [Basic Pool Patterns](#basic-pool-patterns)
- [Load Balancing Strategies](#load-balancing-strategies)
- [Auto-Scaling](#auto-scaling)
- [Error Recovery](#error-recovery)
- [Resource Management](#resource-management)
- [Advanced Patterns](#advanced-patterns)
- [Best Practices](#best-practices)

---

## Introduction

A process pool maintains a set of worker processes that can execute tasks concurrently. Instead of creating a new process for each task, you reuse existing workers.

### Benefits

- **Resource Efficiency**: Reuse processes instead of creating new ones
- **Controlled Concurrency**: Limit simultaneous operations
- **Better Performance**: Avoid process creation overhead
- **Resource Limits**: Control memory and CPU usage
- **Error Isolation**: Worker crashes don't affect the pool

---

## Why Process Pools?

### Without Pool (Naive Approach)

```javascript
// BAD - creates new process for each task
async function processTasks(tasks) {
  for (const task of tasks) {
    const worker = fork('worker.js');
    worker.send(task);

    await new Promise(resolve => {
      worker.on('message', () => {
        worker.kill();
        resolve();
      });
    });
  }
}

// Problems:
// - Process creation overhead for each task
// - Unlimited concurrency (memory issues)
// - No worker reuse
```

### With Pool

```javascript
// GOOD - reuse workers
class WorkerPool {
  constructor(size) {
    this.workers = Array.from({ length: size }, () =>
      fork('worker.js')
    );
  }

  async execute(task) {
    const worker = this.getAvailableWorker();
    return this.sendTask(worker, task);
  }
}

// Benefits:
// - Workers created once
// - Controlled concurrency
// - Efficient resource usage
```

---

## Basic Pool Patterns

### Round-Robin Pool

Distributes tasks evenly across workers:

```javascript
class RoundRobinPool {
  constructor(workerScript, size) {
    this.workers = Array.from({ length: size }, () =>
      fork(workerScript)
    );
    this.currentIndex = 0;
  }

  getNextWorker() {
    const worker = this.workers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.workers.length;
    return worker;
  }

  execute(task) {
    const worker = this.getNextWorker();
    return new Promise((resolve, reject) => {
      const handler = (result) => {
        worker.off('message', handler);
        resolve(result);
      };

      worker.on('message', handler);
      worker.send(task);

      // Timeout
      setTimeout(() => {
        worker.off('message', handler);
        reject(new Error('Task timeout'));
      }, 30000);
    });
  }

  destroy() {
    this.workers.forEach(w => w.kill());
  }
}

// Usage
const pool = new RoundRobinPool('worker.js', 4);

const tasks = [1, 2, 3, 4, 5, 6, 7, 8];
const results = await Promise.all(
  tasks.map(task => pool.execute({ task }))
);
```

### Queue-Based Pool

Workers pull tasks when available:

```javascript
class QueuedPool {
  constructor(workerScript, size) {
    this.workers = [];
    this.queue = [];

    for (let i = 0; i < size; i++) {
      const worker = {
        process: fork(workerScript),
        busy: false
      };

      worker.process.on('message', (result) => {
        this.handleResult(worker, result);
      });

      this.workers.push(worker);
    }
  }

  execute(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  processQueue() {
    const available = this.workers.find(w => !w.busy);

    if (available && this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift();

      available.busy = true;
      available.currentResolve = resolve;
      available.currentReject = reject;

      available.process.send(task);
    }
  }

  handleResult(worker, result) {
    worker.busy = false;
    if (worker.currentResolve) {
      worker.currentResolve(result);
      worker.currentResolve = null;
    }
    this.processQueue();
  }

  getStats() {
    return {
      total: this.workers.length,
      busy: this.workers.filter(w => w.busy).length,
      idle: this.workers.filter(w => !w.busy).length,
      queued: this.queue.length
    };
  }

  destroy() {
    this.workers.forEach(w => w.process.kill());
  }
}
```

---

## Load Balancing Strategies

### Least-Busy Strategy

Choose worker with fewest active tasks:

```javascript
class LeastBusyPool {
  constructor(workerScript, size) {
    this.workers = Array.from({ length: size }, () => ({
      process: fork(workerScript),
      activeTasks: 0
    }));

    this.workers.forEach(worker => {
      worker.process.on('message', () => {
        worker.activeTasks--;
        this.processQueue();
      });
    });

    this.queue = [];
  }

  getLeastBusyWorker() {
    return this.workers.reduce((least, current) =>
      current.activeTasks < least.activeTasks ? current : least
    );
  }

  execute(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  processQueue() {
    while (this.queue.length > 0) {
      const worker = this.getLeastBusyWorker();
      const { task, resolve } = this.queue.shift();

      worker.activeTasks++;
      worker.process.send(task);

      worker.process.once('message', (result) => {
        resolve(result);
      });
    }
  }
}
```

### Priority Queue Strategy

Higher priority tasks execute first:

```javascript
class PriorityPool {
  constructor(workerScript, size) {
    this.workers = Array.from({ length: size }, () => ({
      process: fork(workerScript),
      busy: false
    }));

    this.queue = []; // Array of { priority, task, resolve, reject }

    this.workers.forEach(worker => {
      worker.process.on('message', (result) => {
        this.handleResult(worker, result);
      });
    });
  }

  execute(task, priority = 0) {
    return new Promise((resolve, reject) => {
      // Insert based on priority (higher = sooner)
      const item = { priority, task, resolve, reject };

      let inserted = false;
      for (let i = 0; i < this.queue.length; i++) {
        if (priority > this.queue[i].priority) {
          this.queue.splice(i, 0, item);
          inserted = true;
          break;
        }
      }

      if (!inserted) {
        this.queue.push(item);
      }

      this.processQueue();
    });
  }

  processQueue() {
    const available = this.workers.find(w => !w.busy);

    if (available && this.queue.length > 0) {
      // Take highest priority (first in queue)
      const { task, resolve } = this.queue.shift();

      available.busy = true;
      available.currentResolve = resolve;
      available.process.send(task);
    }
  }

  handleResult(worker, result) {
    worker.busy = false;
    if (worker.currentResolve) {
      worker.currentResolve(result);
      worker.currentResolve = null;
    }
    this.processQueue();
  }
}

// Usage
const pool = new PriorityPool('worker.js', 4);

await pool.execute({ data: 'low' }, 1);     // Low priority
await pool.execute({ data: 'high' }, 10);   // High priority
await pool.execute({ data: 'normal' }, 5);  // Normal priority
// Executes in order: high, normal, low
```

---

## Auto-Scaling

### Dynamic Pool Sizing

```javascript
class AutoScalingPool {
  constructor(workerScript, options = {}) {
    this.workerScript = workerScript;
    this.minSize = options.minSize || 2;
    this.maxSize = options.maxSize || 10;
    this.scaleUpThreshold = options.scaleUpThreshold || 0.8;
    this.scaleDownThreshold = options.scaleDownThreshold || 0.2;

    this.workers = [];
    this.queue = [];

    // Start with minimum workers
    for (let i = 0; i < this.minSize; i++) {
      this.addWorker();
    }

    // Check scaling every 5 seconds
    this.scalingInterval = setInterval(() => {
      this.checkScaling();
    }, 5000);
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
    console.log(`Scaled up to ${this.workers.length} workers`);

    return worker;
  }

  removeWorker() {
    const idle = this.workers.find(w => !w.busy);
    if (idle && this.workers.length > this.minSize) {
      const index = this.workers.indexOf(idle);
      this.workers.splice(index, 1);
      idle.process.kill();
      console.log(`Scaled down to ${this.workers.length} workers`);
      return true;
    }
    return false;
  }

  checkScaling() {
    const busyCount = this.workers.filter(w => w.busy).length;
    const utilization = busyCount / this.workers.length;

    // Scale up if high utilization or queue building
    if ((utilization > this.scaleUpThreshold || this.queue.length > 0) &&
        this.workers.length < this.maxSize) {
      this.addWorker();
    }

    // Scale down if low utilization
    if (utilization < this.scaleDownThreshold &&
        this.queue.length === 0) {
      this.removeWorker();
    }
  }

  execute(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  processQueue() {
    const available = this.workers.find(w => !w.busy);

    if (available && this.queue.length > 0) {
      const { task, resolve } = this.queue.shift();

      available.busy = true;
      available.currentResolve = resolve;
      available.process.send(task);
    }
  }

  handleResult(worker, result) {
    worker.busy = false;
    worker.tasksCompleted++;

    if (worker.currentResolve) {
      worker.currentResolve(result);
      worker.currentResolve = null;
    }

    this.processQueue();
  }

  destroy() {
    clearInterval(this.scalingInterval);
    this.workers.forEach(w => w.process.kill());
  }
}
```

---

## Error Recovery

### Worker Replacement

```javascript
class ResilientPool {
  constructor(workerScript, size) {
    this.workerScript = workerScript;
    this.size = size;
    this.workers = [];
    this.queue = [];
    this.stats = {
      tasksCompleted: 0,
      tasksFailed: 0,
      workersReplaced: 0
    };

    for (let i = 0; i < size; i++) {
      this.addWorker();
    }
  }

  addWorker() {
    const worker = {
      process: fork(this.workerScript),
      busy: false,
      currentTask: null
    };

    // Handle successful completion
    worker.process.on('message', (result) => {
      this.handleSuccess(worker, result);
    });

    // Handle worker crash
    worker.process.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        this.handleCrash(worker, code);
      }
    });

    this.workers.push(worker);
    return worker;
  }

  handleSuccess(worker, result) {
    worker.busy = false;
    this.stats.tasksCompleted++;

    if (worker.currentTask) {
      worker.currentTask.resolve(result);
      worker.currentTask = null;
    }

    this.processQueue();
  }

  handleCrash(worker, code) {
    console.error(`Worker crashed with code ${code}`);
    this.stats.tasksFailed++;
    this.stats.workersReplaced++;

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
    this.processQueue();
  }

  execute(task, retries = 3) {
    return new Promise((resolve, reject) => {
      const taskWithRetry = {
        task,
        resolve,
        reject,
        retriesLeft: retries
      };

      this.queue.push(taskWithRetry);
      this.processQueue();
    });
  }

  processQueue() {
    const available = this.workers.find(w => !w.busy);

    if (available && this.queue.length > 0) {
      const taskItem = this.queue.shift();

      available.busy = true;
      available.currentTask = {
        resolve: taskItem.resolve,
        reject: (err) => {
          // Retry logic
          if (taskItem.retriesLeft > 0) {
            console.log(`Retrying task (${taskItem.retriesLeft} retries left)`);
            taskItem.retriesLeft--;
            this.queue.unshift(taskItem); // Re-queue at front
            this.processQueue();
          } else {
            taskItem.reject(err);
          }
        }
      };

      available.process.send(taskItem.task);
    }
  }

  getStats() {
    return {
      ...this.stats,
      workers: this.workers.length,
      queueDepth: this.queue.length,
      busyWorkers: this.workers.filter(w => w.busy).length
    };
  }

  destroy() {
    this.workers.forEach(w => w.process.kill());
  }
}
```

---

## Resource Management

### Memory-Aware Pool

```javascript
class MemoryAwarePool {
  constructor(workerScript, options = {}) {
    this.workerScript = workerScript;
    this.maxWorkers = options.maxWorkers || 10;
    this.maxMemoryPerWorker = options.maxMemoryPerWorker || 512 * 1024 * 1024; // 512MB
    this.workers = [];
    this.queue = [];

    // Monitor memory every 10 seconds
    this.monitorInterval = setInterval(() => {
      this.checkMemory();
    }, 10000);
  }

  async checkMemory() {
    for (const worker of this.workers) {
      try {
        // Request memory usage from worker
        const memUsage = await this.getWorkerMemory(worker);

        if (memUsage > this.maxMemoryPerWorker) {
          console.log(`Worker ${worker.process.pid} exceeded memory limit, recycling...`);
          await this.recycleWorker(worker);
        }
      } catch (err) {
        console.error('Memory check failed:', err);
      }
    }
  }

  getWorkerMemory(worker) {
    return new Promise((resolve) => {
      const handler = (msg) => {
        if (msg.type === 'memory-usage') {
          worker.process.off('message', handler);
          resolve(msg.heapUsed);
        }
      };

      worker.process.on('message', handler);
      worker.process.send({ type: 'memory-check' });

      setTimeout(() => {
        worker.process.off('message', handler);
        resolve(0);
      }, 1000);
    });
  }

  async recycleWorker(worker) {
    // Wait for current task to finish
    if (worker.busy) {
      await new Promise(resolve => {
        worker.recycleResolve = resolve;
      });
    }

    // Remove and kill
    const index = this.workers.indexOf(worker);
    this.workers.splice(index, 1);
    worker.process.kill();

    // Add replacement
    this.addWorker();
  }

  addWorker() {
    const worker = {
      process: fork(this.workerScript),
      busy: false
    };

    worker.process.on('message', (result) => {
      this.handleResult(worker, result);
    });

    this.workers.push(worker);
  }

  handleResult(worker, result) {
    worker.busy = false;

    if (worker.currentResolve) {
      worker.currentResolve(result);
      worker.currentResolve = null;
    }

    if (worker.recycleResolve) {
      worker.recycleResolve();
      worker.recycleResolve = null;
    }

    this.processQueue();
  }

  destroy() {
    clearInterval(this.monitorInterval);
    this.workers.forEach(w => w.process.kill());
  }
}

// worker.js needs to respond to memory checks:
// process.on('message', (msg) => {
//   if (msg.type === 'memory-check') {
//     const usage = process.memoryUsage();
//     process.send({
//       type: 'memory-usage',
//       heapUsed: usage.heapUsed
//     });
//   }
// });
```

---

## Advanced Patterns

### Dedicated Worker Pools

```javascript
class SpecializedPoolManager {
  constructor() {
    this.pools = {
      cpu: new WorkerPool('cpu-worker.js', 4),
      io: new WorkerPool('io-worker.js', 8),
      memory: new WorkerPool('memory-worker.js', 2)
    };
  }

  async execute(task) {
    const pool = this.pools[task.type] || this.pools.cpu;
    return pool.execute(task);
  }

  destroy() {
    Object.values(this.pools).forEach(pool => pool.destroy());
  }
}

// Usage
const manager = new SpecializedPoolManager();

await manager.execute({ type: 'cpu', data: heavyComputation });
await manager.execute({ type: 'io', data: fileOperation });
await manager.execute({ type: 'memory', data: largeDataProcessing });
```

### Warm Pool (Keep-Alive)

```javascript
class WarmPool {
  constructor(workerScript, size, keepAliveTime = 60000) {
    this.workerScript = workerScript;
    this.size = size;
    this.keepAliveTime = keepAliveTime;
    this.workers = [];

    this.initialize();
  }

  initialize() {
    for (let i = 0; i < this.size; i++) {
      this.addWorker();
    }

    // Send keep-alive messages
    this.keepAliveInterval = setInterval(() => {
      this.sendKeepAlive();
    }, this.keepAliveTime / 2);
  }

  addWorker() {
    const worker = {
      process: fork(this.workerScript),
      lastActivity: Date.now(),
      busy: false
    };

    worker.process.on('message', () => {
      worker.lastActivity = Date.now();
    });

    this.workers.push(worker);
  }

  sendKeepAlive() {
    this.workers.forEach(worker => {
      if (!worker.busy) {
        worker.process.send({ type: 'keep-alive' });
      }
    });
  }

  destroy() {
    clearInterval(this.keepAliveInterval);
    this.workers.forEach(w => w.process.kill());
  }
}
```

---

## Best Practices

### 1. Size Pool Appropriately

```javascript
const os = require('os');

// CPU-bound tasks: number of CPU cores
const cpuPool = new WorkerPool('cpu-worker.js', os.cpus().length);

// I/O-bound tasks: higher count
const ioPool = new WorkerPool('io-worker.js', os.cpus().length * 2);

// Memory-intensive: lower count
const memoryPool = new WorkerPool('memory-worker.js', Math.max(2, os.cpus().length / 2));
```

### 2. Implement Health Checks

```javascript
class HealthyPool {
  async checkHealth() {
    const health = await Promise.all(
      this.workers.map(w => this.checkWorker(w))
    );

    const unhealthy = health.filter(h => !h.healthy);
    unhealthy.forEach(h => this.recycleWorker(h.worker));
  }

  async checkWorker(worker) {
    try {
      const response = await this.sendHealthCheck(worker);
      return { worker, healthy: response.ok };
    } catch (err) {
      return { worker, healthy: false };
    }
  }
}
```

### 3. Monitor Pool Metrics

```javascript
class MonitoredPool {
  constructor(workerScript, size) {
    this.metrics = {
      tasksTotal: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      averageTaskTime: 0,
      peakQueueDepth: 0
    };

    // Update metrics
    setInterval(() => {
      this.metrics.peakQueueDepth = Math.max(
        this.metrics.peakQueueDepth,
        this.queue.length
      );
    }, 1000);
  }

  getMetrics() {
    return {
      ...this.metrics,
      currentQueueDepth: this.queue.length,
      utilization: this.workers.filter(w => w.busy).length / this.workers.length
    };
  }
}
```

### 4. Graceful Shutdown

```javascript
class GracefulPool {
  async shutdown(timeout = 30000) {
    console.log('Starting pool shutdown...');

    // Stop accepting new tasks
    this.accepting = false;

    // Wait for queue to drain
    const waitStart = Date.now();
    while (this.queue.length > 0 && Date.now() - waitStart < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Wait for workers to finish
    const busyWorkers = this.workers.filter(w => w.busy);
    await Promise.race([
      Promise.all(busyWorkers.map(w => this.waitForWorker(w))),
      new Promise(resolve => setTimeout(resolve, timeout))
    ]);

    // Kill all workers
    this.workers.forEach(w => w.process.kill());

    console.log('Pool shutdown complete');
  }
}
```

---

## Summary

Key takeaways:
- Process pools reuse workers for efficiency
- Choose strategy based on workload (round-robin, queue, priority)
- Implement auto-scaling for variable loads
- Replace crashed workers automatically
- Monitor resource usage (memory, CPU)
- Size pools based on task type (CPU vs I/O)
- Implement health checks and metrics
- Support graceful shutdown
- Use specialized pools for different task types

Process pooling is essential for building high-performance, scalable applications!
