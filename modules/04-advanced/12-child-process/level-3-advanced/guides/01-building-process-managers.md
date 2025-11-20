# Building Process Managers

Learn how to design and implement production-ready process managers that handle worker pools, task distribution, and fault tolerance.

## Table of Contents
- [Introduction](#introduction)
- [Architecture Patterns](#architecture-patterns)
- [Worker Pool Design](#worker-pool-design)
- [Task Queue Management](#task-queue-management)
- [Resource Management](#resource-management)
- [Fault Tolerance](#fault-tolerance)
- [Load Balancing](#load-balancing)
- [Monitoring and Metrics](#monitoring-and-metrics)
- [Production Considerations](#production-considerations)

---

## Introduction

### What is a Process Manager?

A process manager is a system that:
- **Manages** multiple worker processes
- **Distributes** tasks across workers
- **Monitors** worker health and performance
- **Recovers** from failures automatically
- **Optimizes** resource utilization
- **Scales** based on demand

### Why Build a Process Manager?

**Use Cases:**
1. **Parallel Processing** - CPU-intensive computations
2. **Task Queues** - Background job processing
3. **Web Servers** - Handling concurrent requests
4. **Build Systems** - Parallel compilation/testing
5. **Data Processing** - ETL pipelines

**Benefits:**
- Utilize multiple CPU cores
- Isolate failures
- Scale workloads
- Improve reliability
- Monitor performance

---

## Architecture Patterns

### 1. Fixed Pool Pattern

Simple pool with fixed number of workers.

```
┌──────────────┐
│   Manager    │
└──────┬───────┘
       │
   ┌───┴────┬────┬────┐
   │        │    │    │
┌──▼──┐  ┌─▼─┐ ┌▼─┐ ┌▼─┐
│ W1  │  │W2 │ │W3│ │W4│
└─────┘  └───┘ └──┘ └──┘
```

**Pros:**
- Simple to implement
- Predictable resource usage
- Easy to reason about

**Cons:**
- Doesn't adapt to load
- May waste resources
- May be overwhelmed

### 2. Dynamic Pool Pattern

Pool that scales based on demand.

```
┌──────────────────┐
│   Manager        │
│  (Autoscaler)    │
└────────┬─────────┘
         │
    ┌────┴──────┬──────┐
    │           │      │
 ┌──▼──┐     ┌─▼─┐   ┌▼─┐
 │ W1  │     │W2 │   │..│  ← Scales up/down
 └─────┘     └───┘   └──┘
```

**Pros:**
- Adapts to load
- Efficient resource usage
- Handles spikes

**Cons:**
- More complex
- Startup latency
- Requires tuning

### 3. Specialized Workers Pattern

Different worker types for different tasks.

```
┌──────────────┐
│   Manager    │
└──────┬───────┘
       │
   ┌───┴────┬────────┐
   │        │        │
┌──▼──┐  ┌─▼─┐   ┌──▼──┐
│CPU  │  │I/O│   │Mixed│
│Work │  │   │   │     │
└─────┘  └───┘   └─────┘
```

**Pros:**
- Optimized for workload
- Better resource allocation
- Improved performance

**Cons:**
- Complex routing
- Harder to balance
- More management overhead

---

## Worker Pool Design

### Core Components

```javascript
class WorkerPool {
  constructor(options) {
    this.workerPath = options.workerPath;
    this.poolSize = options.poolSize;

    // Worker tracking
    this.workers = [];
    this.available = [];
    this.busy = [];

    // Metrics
    this.stats = {
      created: 0,
      destroyed: 0,
      tasksProcessed: 0
    };
  }

  async initialize() {
    for (let i = 0; i < this.poolSize; i++) {
      await this.createWorker(i);
    }
  }

  createWorker(id) {
    const worker = fork(this.workerPath);

    const workerInfo = {
      id,
      worker,
      state: 'idle',
      tasksProcessed: 0,
      errors: 0,
      createdAt: Date.now()
    };

    this.setupWorkerHandlers(workerInfo);
    this.workers.push(workerInfo);
    this.available.push(workerInfo);

    return workerInfo;
  }

  setupWorkerHandlers(workerInfo) {
    const { worker } = workerInfo;

    worker.on('message', (msg) => {
      this.handleMessage(workerInfo, msg);
    });

    worker.on('error', (error) => {
      this.handleError(workerInfo, error);
    });

    worker.on('exit', (code, signal) => {
      this.handleExit(workerInfo, code, signal);
    });
  }
}
```

### Worker States

Track worker lifecycle:

```javascript
const WorkerState = {
  IDLE: 'idle',           // Ready for work
  BUSY: 'busy',           // Processing task
  STARTING: 'starting',   // Initializing
  STOPPING: 'stopping',   // Shutting down
  UNHEALTHY: 'unhealthy', // Failed health check
  DEAD: 'dead'            // Exited
};
```

### Worker Selection Strategies

**1. Round Robin**
```javascript
selectWorker() {
  if (this.available.length === 0) return null;

  const worker = this.available[this.nextIndex];
  this.nextIndex = (this.nextIndex + 1) % this.available.length;

  return worker;
}
```

**2. Least Busy**
```javascript
selectWorker() {
  if (this.available.length === 0) return null;

  return this.available.reduce((min, worker) =>
    worker.tasksProcessed < min.tasksProcessed ? worker : min
  );
}
```

**3. Random**
```javascript
selectWorker() {
  if (this.available.length === 0) return null;

  const index = Math.floor(Math.random() * this.available.length);
  return this.available[index];
}
```

---

## Task Queue Management

### Priority Queues

Implement multi-level priority:

```javascript
class PriorityTaskQueue {
  constructor() {
    this.queues = {
      critical: [],
      high: [],
      normal: [],
      low: []
    };
  }

  enqueue(task, priority = 'normal') {
    if (!this.queues[priority]) {
      throw new Error(`Invalid priority: ${priority}`);
    }

    this.queues[priority].push(task);
  }

  dequeue() {
    // Check queues in priority order
    for (const priority of ['critical', 'high', 'normal', 'low']) {
      if (this.queues[priority].length > 0) {
        return this.queues[priority].shift();
      }
    }
    return null;
  }

  size() {
    return Object.values(this.queues)
      .reduce((sum, queue) => sum + queue.length, 0);
  }

  getQueueSizes() {
    return Object.fromEntries(
      Object.entries(this.queues)
        .map(([priority, queue]) => [priority, queue.length])
    );
  }
}
```

### Task Assignment

```javascript
async assignTask(task) {
  const worker = this.selectAvailableWorker();

  if (!worker) {
    // No workers available, queue it
    this.taskQueue.enqueue(task, task.priority);
    return;
  }

  // Mark worker as busy
  this.markWorkerBusy(worker);

  // Assign task
  worker.currentTask = task;
  worker.worker.send({
    type: 'task',
    taskId: task.id,
    data: task.data
  });

  // Set timeout if configured
  if (task.timeout) {
    worker.taskTimeout = setTimeout(() => {
      this.handleTaskTimeout(worker, task);
    }, task.timeout);
  }
}
```

### Backpressure Handling

Prevent queue overflow:

```javascript
class ManagedQueue {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.queue = [];
  }

  enqueue(item) {
    if (this.queue.length >= this.maxSize) {
      throw new Error('Queue is full');
    }
    this.queue.push(item);
  }

  // Alternative: Block until space available
  async enqueueWait(item, timeout = 30000) {
    const start = Date.now();

    while (this.queue.length >= this.maxSize) {
      if (Date.now() - start > timeout) {
        throw new Error('Enqueue timeout');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.queue.push(item);
  }
}
```

---

## Resource Management

### Memory Management

Monitor and limit memory usage:

```javascript
class ResourceMonitor {
  constructor(limits) {
    this.limits = limits;
    this.interval = setInterval(() => {
      this.checkResources();
    }, 5000);
  }

  checkResources() {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;

    if (heapUsedMB > this.limits.maxMemoryMB) {
      console.warn(`Memory limit exceeded: ${heapUsedMB}MB`);
      this.emit('memory_limit_exceeded', { heapUsedMB });

      // Take action: reject new tasks, scale down, etc.
      this.handleMemoryPressure();
    }
  }

  handleMemoryPressure() {
    // Force garbage collection if exposed
    if (global.gc) {
      global.gc();
    }

    // Reduce pool size
    this.reduceWorkerCount();

    // Clear caches
    this.clearCaches();
  }
}
```

### CPU Throttling

Prevent CPU exhaustion:

```javascript
class CPUThrottler {
  constructor(maxCPUPercent = 80) {
    this.maxCPUPercent = maxCPUPercent;
    this.lastCPUUsage = process.cpuUsage();
    this.lastCheck = Date.now();
  }

  async checkCPU() {
    const currentUsage = process.cpuUsage(this.lastCPUUsage);
    const timeDiff = Date.now() - this.lastCheck;

    const cpuPercent = (currentUsage.user + currentUsage.system) /
                       (timeDiff * 1000) * 100;

    this.lastCPUUsage = process.cpuUsage();
    this.lastCheck = Date.now();

    return cpuPercent;
  }

  shouldThrottle() {
    const cpuPercent = this.checkCPU();
    return cpuPercent > this.maxCPUPercent;
  }
}
```

---

## Fault Tolerance

### Auto-Restart Strategy

```javascript
class WorkerSupervisor {
  constructor(options) {
    this.maxRestarts = options.maxRestarts || 3;
    this.restartWindow = options.restartWindow || 60000;
    this.workerRestarts = new Map();
  }

  async handleWorkerCrash(worker) {
    const restarts = this.workerRestarts.get(worker.id) || [];
    const now = Date.now();

    // Clean old restart records
    const recentRestarts = restarts.filter(
      time => now - time < this.restartWindow
    );

    if (recentRestarts.length >= this.maxRestarts) {
      console.error(`Worker ${worker.id} exceeded max restarts`);
      this.emit('worker_failed', { workerId: worker.id });
      return false;
    }

    // Record restart
    recentRestarts.push(now);
    this.workerRestarts.set(worker.id, recentRestarts);

    // Restart with backoff
    const backoff = this.calculateBackoff(recentRestarts.length);
    await this.delay(backoff);

    this.createWorker(worker.id);
    return true;
  }

  calculateBackoff(attempt) {
    return Math.min(1000 * Math.pow(2, attempt - 1), 30000);
  }
}
```

### Circuit Breaker Pattern

Prevent cascading failures:

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.nextRetry = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextRetry) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextRetry = Date.now() + this.resetTimeout;
    }
  }
}
```

---

## Load Balancing

### Strategies

**1. Weighted Round Robin**
```javascript
class WeightedRoundRobin {
  constructor(workers) {
    this.workers = workers;
    this.currentIndex = 0;
    this.currentWeight = 0;
  }

  select() {
    while (true) {
      this.currentIndex = (this.currentIndex + 1) % this.workers.length;

      if (this.currentIndex === 0) {
        this.currentWeight = this.currentWeight - this.gcd();
        if (this.currentWeight <= 0) {
          this.currentWeight = this.maxWeight();
        }
      }

      if (this.workers[this.currentIndex].weight >= this.currentWeight) {
        return this.workers[this.currentIndex];
      }
    }
  }

  maxWeight() {
    return Math.max(...this.workers.map(w => w.weight));
  }

  gcd() {
    // Calculate GCD of all weights
    return this.workers
      .map(w => w.weight)
      .reduce((a, b) => this.gcdTwo(a, b));
  }

  gcdTwo(a, b) {
    return b === 0 ? a : this.gcdTwo(b, a % b);
  }
}
```

**2. Least Connections**
```javascript
class LeastConnections {
  select(workers) {
    return workers.reduce((min, worker) =>
      worker.activeConnections < min.activeConnections ? worker : min
    );
  }
}
```

---

## Monitoring and Metrics

### Metrics Collection

```javascript
class MetricsCollector {
  constructor() {
    this.metrics = {
      tasksStarted: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      totalProcessingTime: 0,
      workers: {
        total: 0,
        available: 0,
        busy: 0,
        unhealthy: 0
      }
    };
  }

  recordTaskStart() {
    this.metrics.tasksStarted++;
  }

  recordTaskComplete(duration) {
    this.metrics.tasksCompleted++;
    this.metrics.totalProcessingTime += duration;
  }

  recordTaskFailure() {
    this.metrics.tasksFailed++;
  }

  getMetrics() {
    const completed = this.metrics.tasksCompleted;
    const avgTime = completed > 0
      ? this.metrics.totalProcessingTime / completed
      : 0;

    return {
      ...this.metrics,
      averageProcessingTime: avgTime,
      successRate: this.metrics.tasksStarted > 0
        ? (completed / this.metrics.tasksStarted) * 100
        : 0
    };
  }
}
```

---

## Production Considerations

### 1. Graceful Shutdown

```javascript
async shutdown(timeout = 30000) {
  console.log('Initiating graceful shutdown...');

  // Stop accepting new tasks
  this.accepting = false;

  // Wait for current tasks to complete
  const deadline = Date.now() + timeout;
  while (this.hasPendingTasks() && Date.now() < deadline) {
    await this.delay(100);
  }

  // Force shutdown remaining tasks
  if (this.hasPendingTasks()) {
    console.warn('Force terminating pending tasks');
    this.terminateAllTasks();
  }

  // Shutdown workers
  await Promise.all(
    this.workers.map(w => this.shutdownWorker(w))
  );

  // Cleanup resources
  this.cleanup();
}
```

### 2. Error Handling

```javascript
handleError(error, context) {
  // Log with context
  console.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    context
  });

  // Emit error event
  this.emit('error', { error, context });

  // Take corrective action
  if (error.code === 'ECONNRESET') {
    this.restartWorker(context.workerId);
  }

  // Update metrics
  this.metrics.recordError(error.code);
}
```

### 3. Health Checks

```javascript
async performHealthCheck(worker) {
  const timeout = 3000;

  try {
    await Promise.race([
      this.pingWorker(worker),
      this.delay(timeout).then(() => {
        throw new Error('Health check timeout');
      })
    ]);

    worker.healthChecksFailed = 0;
    return true;
  } catch (error) {
    worker.healthChecksFailed++;

    if (worker.healthChecksFailed >= 3) {
      this.markUnhealthy(worker);
      this.restartWorker(worker);
    }

    return false;
  }
}
```

---

## Best Practices

### Do's ✅

1. **Always handle worker crashes** - Implement auto-restart
2. **Monitor health** - Regular health checks
3. **Limit resources** - Set memory/CPU limits
4. **Track metrics** - Monitor performance
5. **Test failure scenarios** - Verify fault tolerance
6. **Graceful shutdown** - Clean termination
7. **Log everything** - Comprehensive logging

### Don'ts ❌

1. **Don't ignore errors** - Handle all failure modes
2. **Don't leak resources** - Clean up properly
3. **Don't hardcode limits** - Make configurable
4. **Don't skip testing** - Test edge cases
5. **Don't ignore backpressure** - Limit queue size
6. **Don't over-optimize early** - Measure first

---

## Summary

Building a robust process manager requires:

1. **Architecture** - Choose appropriate pattern
2. **Worker Management** - Pool, lifecycle, states
3. **Task Distribution** - Queuing, priority, assignment
4. **Resource Control** - Memory, CPU limits
5. **Fault Tolerance** - Auto-restart, circuit breakers
6. **Load Balancing** - Efficient distribution
7. **Monitoring** - Metrics and health checks
8. **Production Ready** - Shutdown, errors, logging

Master these concepts to build production-grade process managers that are reliable, efficient, and scalable.

---

**Next**: Read [Advanced IPC Patterns](02-advanced-ipc-patterns.md) to learn about handle passing and zero-copy communication.
