# Worker Pools - Efficient Task Management

## What is a Worker Pool?

A worker pool is a collection of reusable worker threads that process tasks from a queue. Instead of creating a new worker for each task (expensive), the pool reuses workers, improving performance and resource efficiency.

## Why Use Worker Pools?

### Problem: Creating Workers is Expensive

```javascript
// ❌ Bad: Creating a new worker for each task
async function processTask(data) {
  const worker = new Worker('./worker.js');
  // Worker creation takes 10-50ms
  const result = await runWorker(worker, data);
  await worker.terminate();
  return result;
}

// Processing 100 tasks = 1000-5000ms just for worker creation!
```

### Solution: Reuse Workers in a Pool

```javascript
// ✅ Good: Reuse workers from a pool
const pool = new WorkerPool('./worker.js', 4);

async function processTask(data) {
  // Worker already created, instant assignment
  const result = await pool.execute(data);
  return result;
}

// Processing 100 tasks = minimal overhead!
```

## Basic Worker Pool Architecture

```
┌─────────────────────────────────────┐
│         Main Thread                 │
│                                     │
│  ┌──────────────────────────────┐  │
│  │      Task Queue              │  │
│  │  [Task 5] [Task 6] [Task 7] │  │
│  └──────────────────────────────┘  │
│              ↓                      │
│  ┌──────────────────────────────┐  │
│  │      Worker Pool             │  │
│  │  ┌────────┐ ┌────────┐      │  │
│  │  │Worker 1│ │Worker 2│ ...  │  │
│  │  │[Task 1]│ │[Task 2]│      │  │
│  │  └────────┘ └────────┘      │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Implementing a Basic Worker Pool

### Step 1: Pool Structure

```javascript
class WorkerPool {
  constructor(workerScript, poolSize = 4) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];        // Array of worker objects
    this.taskQueue = [];      // Queue of pending tasks
    this.nextWorkerId = 0;
  }
}
```

### Step 2: Initialize Workers

```javascript
createPool() {
  for (let i = 0; i < this.poolSize; i++) {
    const workerInfo = {
      id: i,
      worker: new Worker(this.workerScript),
      busy: false,
      currentTask: null
    };

    // Set up message handler
    workerInfo.worker.on('message', (result) => {
      this.handleWorkerMessage(workerInfo, result);
    });

    // Set up error handler
    workerInfo.worker.on('error', (err) => {
      this.handleWorkerError(workerInfo, err);
    });

    this.workers.push(workerInfo);
  }
}
```

### Step 3: Execute Tasks

```javascript
async execute(data) {
  return new Promise((resolve, reject) => {
    const task = {
      id: this.nextTaskId++,
      data,
      resolve,
      reject,
      timestamp: Date.now()
    };

    // Try to find an available worker
    const availableWorker = this.workers.find(w => !w.busy);

    if (availableWorker) {
      // Execute immediately
      this.assignTask(availableWorker, task);
    } else {
      // Queue for later
      this.taskQueue.push(task);
    }
  });
}
```

### Step 4: Handle Worker Messages

```javascript
handleWorkerMessage(workerInfo, result) {
  const task = workerInfo.currentTask;

  if (task) {
    // Task completed successfully
    task.resolve(result);
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
```

## Complete Worker Pool Implementation

```javascript
const { Worker } = require('worker_threads');

class WorkerPool {
  constructor(workerScript, poolSize = 4) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];
    this.taskQueue = [];
    this.nextTaskId = 0;
    this.stats = {
      tasksCompleted: 0,
      tasksErrored: 0,
      totalProcessingTime: 0
    };

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

      workerInfo.worker.on('message', (result) => {
        this.handleWorkerMessage(workerInfo, result);
      });

      workerInfo.worker.on('error', (err) => {
        this.handleWorkerError(workerInfo, err);
      });

      workerInfo.worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker ${i} exited with code ${code}`);
        }
      });

      this.workers.push(workerInfo);
    }
  }

  async execute(data) {
    return new Promise((resolve, reject) => {
      const task = {
        id: this.nextTaskId++,
        data,
        resolve,
        reject,
        timestamp: Date.now()
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
      const processingTime = Date.now() - task.timestamp;

      this.stats.tasksCompleted++;
      this.stats.totalProcessingTime += processingTime;
      workerInfo.tasksCompleted++;

      task.resolve(result);
    }

    workerInfo.busy = false;
    workerInfo.currentTask = null;

    // Process next task
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift();
      this.assignTask(workerInfo, nextTask);
    }
  }

  handleWorkerError(workerInfo, error) {
    const task = workerInfo.currentTask;

    if (task) {
      this.stats.tasksErrored++;
      task.reject(error);
    }

    workerInfo.busy = false;
    workerInfo.currentTask = null;

    // Process next task
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
        ? this.stats.totalProcessingTime / this.stats.tasksCompleted
        : 0,
      workerStats: this.workers.map(w => ({
        id: w.id,
        busy: w.busy,
        tasksCompleted: w.tasksCompleted
      }))
    };
  }

  async terminate() {
    await Promise.all(this.workers.map(w => w.worker.terminate()));
  }
}
```

## Pool Sizing Strategies

### Strategy 1: CPU-Based Sizing

```javascript
const os = require('os');

// One worker per CPU core
const poolSize = os.cpus().length;

// Or leave one core for main thread
const poolSize = Math.max(1, os.cpus().length - 1);
```

### Strategy 2: Workload-Based Sizing

```javascript
// For CPU-intensive tasks
const poolSize = os.cpus().length;

// For mixed I/O and CPU tasks
const poolSize = os.cpus().length * 2;

// For very short tasks with overhead
const poolSize = Math.max(2, Math.floor(os.cpus().length / 2));
```

### Strategy 3: Dynamic Sizing

```javascript
class DynamicWorkerPool extends WorkerPool {
  constructor(workerScript, minSize = 2, maxSize = 8) {
    super(workerScript, minSize);
    this.minSize = minSize;
    this.maxSize = maxSize;
  }

  async execute(data) {
    // If queue is building up, add workers
    if (this.taskQueue.length > this.poolSize * 2 &&
        this.poolSize < this.maxSize) {
      this.addWorker();
    }

    return super.execute(data);
  }

  addWorker() {
    // Implementation to add worker dynamically
  }

  removeWorker() {
    // Implementation to remove idle worker
  }
}
```

## Advanced Features

### Feature 1: Task Priority

```javascript
class PriorityWorkerPool extends WorkerPool {
  execute(data, priority = 0) {
    return new Promise((resolve, reject) => {
      const task = {
        id: this.nextTaskId++,
        data,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      };

      const availableWorker = this.workers.find(w => !w.busy);

      if (availableWorker) {
        this.assignTask(availableWorker, task);
      } else {
        // Insert based on priority
        const insertIndex = this.taskQueue.findIndex(
          t => t.priority < priority
        );

        if (insertIndex === -1) {
          this.taskQueue.push(task);
        } else {
          this.taskQueue.splice(insertIndex, 0, task);
        }
      }
    });
  }
}
```

### Feature 2: Task Timeout

```javascript
execute(data, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Task timeout'));
      // Remove from queue if still queued
      const index = this.taskQueue.findIndex(t => t.id === task.id);
      if (index !== -1) {
        this.taskQueue.splice(index, 1);
      }
    }, timeout);

    const task = {
      id: this.nextTaskId++,
      data,
      resolve: (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      },
      reject: (err) => {
        clearTimeout(timeoutId);
        reject(err);
      },
      timestamp: Date.now()
    };

    // ... rest of execute logic
  });
}
```

### Feature 3: Health Monitoring

```javascript
startHealthMonitoring(interval = 5000) {
  this.healthInterval = setInterval(() => {
    const stats = this.getStats();

    console.log('Pool Health:');
    console.log(`  Workers: ${stats.busyWorkers}/${stats.poolSize} busy`);
    console.log(`  Queue: ${stats.queueLength} tasks waiting`);
    console.log(`  Completed: ${stats.tasksCompleted} tasks`);
    console.log(`  Avg time: ${stats.avgProcessingTime.toFixed(2)}ms`);

    // Alert if queue is growing
    if (stats.queueLength > stats.poolSize * 5) {
      console.warn('WARNING: Task queue is backing up!');
    }
  }, interval);
}

stopHealthMonitoring() {
  if (this.healthInterval) {
    clearInterval(this.healthInterval);
  }
}
```

## Best Practices

### 1. Choose Appropriate Pool Size

```javascript
// ✅ Good: Based on workload type
const cpuIntensivePoolSize = os.cpus().length;
const mixedWorkloadPoolSize = os.cpus().length * 2;
```

### 2. Handle Worker Failures

```javascript
handleWorkerError(workerInfo, error) {
  console.error(`Worker ${workerInfo.id} error:`, error);

  // Restart worker if it crashed
  if (error.fatal) {
    this.restartWorker(workerInfo);
  }

  // Continue with other tasks
  if (workerInfo.currentTask) {
    workerInfo.currentTask.reject(error);
  }

  this.processNextTask(workerInfo);
}
```

### 3. Graceful Shutdown

```javascript
async shutdown() {
  // Stop accepting new tasks
  this.accepting = false;

  // Wait for current tasks to complete
  while (this.workers.some(w => w.busy)) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Terminate workers
  await this.terminate();
}
```

### 4. Monitor Performance

```javascript
// Track metrics
const pool = new WorkerPool('./worker.js', 4);

setInterval(() => {
  const stats = pool.getStats();
  logMetrics(stats);
}, 10000);
```

## Key Takeaways

1. **Worker pools reuse workers** - Eliminates creation overhead
2. **Task queue manages overflow** - Queues tasks when all workers busy
3. **Pool sizing matters** - Based on CPU cores and workload type
4. **Monitor pool health** - Track queue length and processing times
5. **Handle failures gracefully** - Worker errors shouldn't crash the pool
6. **Consider advanced features** - Priorities, timeouts, dynamic sizing

## Next Steps

Learn about [transferable objects](./02-transferable-objects.md) for efficient data transfer in worker pools.
