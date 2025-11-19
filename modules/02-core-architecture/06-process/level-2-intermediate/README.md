# Level 2: Process Intermediate

Master advanced process management and production-ready application patterns.

## Overview

This level takes you beyond basic process interaction to production-ready patterns for process management. You'll learn how to handle signals properly, implement graceful shutdown sequences, monitor resource usage, handle critical errors, and communicate between processes. By the end of this level, you'll be able to build robust, production-grade Node.js applications that handle edge cases and failures gracefully.

**Time to complete:** 4-5 hours

---

## Learning Objectives

By completing this level, you will:

- [ ] Handle OS signals (SIGTERM, SIGINT, SIGHUP) properly
- [ ] Implement graceful shutdown patterns with cleanup
- [ ] Monitor process resources and set up alerts
- [ ] Handle uncaughtException and unhandledRejection safely
- [ ] Work with process warnings and deprecations
- [ ] Implement performance monitoring and profiling
- [ ] Manage advanced exit scenarios and cleanup
- [ ] Implement basic inter-process communication (IPC)
- [ ] Build production-ready error handling strategies
- [ ] Create resilient long-running processes

---

## Prerequisites

- Completed Level 1: Process Basics
- Understanding of JavaScript Promises and async/await
- Familiarity with EventEmitter patterns
- Basic understanding of operating system concepts
- Experience with error handling in JavaScript

---

## Topics Covered

### 1. Signal Handling
- Understanding POSIX signals
- SIGTERM vs SIGINT vs SIGHUP
- Handling custom signals (SIGUSR1, SIGUSR2)
- Signal propagation in process trees
- Platform differences (Windows vs Unix)
- Preventing signal handler conflicts

### 2. Graceful Shutdown
- Multi-phase shutdown sequences
- Connection draining patterns
- Cleanup timeouts and force-kill
- Database connection cleanup
- File handle management
- In-flight request handling

### 3. Resource Monitoring
- CPU usage tracking
- Memory usage patterns and alerts
- Event loop lag detection
- Active handle monitoring
- File descriptor tracking
- Custom health check endpoints

### 4. Critical Error Handling
- uncaughtException vs unhandledRejection
- Error recovery strategies
- Crash reporting and logging
- Process restart patterns
- Safe error boundaries
- Production error handling

### 5. Process Warnings
- Understanding process warnings
- Deprecation warnings
- Custom warning emissions
- Warning event handling
- MaxListenersExceeded warnings
- Memory leak detection warnings

### 6. Performance Monitoring
- CPU profiling techniques
- Memory profiling and heap dumps
- Event loop monitoring
- Async resource tracking
- Performance marks and measures
- Production profiling strategies

### 7. Advanced Exit Handling
- Exit code strategies
- Cleanup coordination
- Exit event guarantees
- beforeExit vs exit timing
- Preventing premature exit
- Exit handler ordering

### 8. Inter-Process Communication
- IPC channel basics
- Message passing patterns
- Process coordination
- Parent-child communication
- Shared state strategies
- IPC security considerations

---

## Conceptual Guides

Deep dive into intermediate process management concepts:

### Essential Reading

1. **[Signal Handling in Node.js](./guides/01-signal-handling.md)** (30 min)
   - POSIX signals explained
   - Signal handling best practices
   - Platform-specific considerations
   - Production signal strategies

2. **[Graceful Shutdown Patterns](./guides/02-graceful-shutdown.md)** (35 min)
   - Why graceful shutdown matters
   - Multi-phase shutdown sequences
   - Connection draining techniques
   - Timeout and force-kill patterns

3. **[Resource Monitoring](./guides/03-resource-monitoring.md)** (30 min)
   - CPU and memory monitoring
   - Event loop lag detection
   - Alert thresholds and strategies
   - Production monitoring setup

4. **[Error Event Handling](./guides/04-error-event-handling.md)** (35 min)
   - uncaughtException deep dive
   - unhandledRejection handling
   - Error recovery vs restart
   - Safe error boundaries

5. **[Process Warnings and Debugging](./guides/05-process-warnings.md)** (25 min)
   - Understanding process warnings
   - Custom warnings
   - Memory leak detection
   - Production debugging strategies

---

## Learning Path

### Recommended Approach

```
Week 1: Signal Handling & Shutdown
├─ Day 1: Read guide 1, study examples 1-2, exercise 1
├─ Day 2: Read guide 2, study examples 3-4, exercise 2
└─ Day 3: Practice graceful shutdown in real app

Week 2: Monitoring & Error Handling
├─ Day 4: Read guide 3, study examples 5-6, exercise 3
├─ Day 5: Read guide 4, study examples 7-8, exercise 4
└─ Day 6: Read guide 5, complete exercise 5, mini-project
```

### Quick Start (Experienced Developers)

1. Review all guides (focus on guides 2 and 4)
2. Study examples 2, 4, 6, 8
3. Complete exercises 3-5
4. Build production-ready process management system

---

## Examples

Production-ready code examples demonstrating intermediate concepts:

1. **[01-signal-basics.js](./examples/01-signal-basics.js)**
   - Handling SIGTERM and SIGINT
   - Signal handler registration
   - Platform-specific handling
   - Signal cleanup patterns

2. **[02-graceful-shutdown.js](./examples/02-graceful-shutdown.js)**
   - Multi-phase shutdown sequence
   - Connection draining
   - Cleanup timeout handling
   - HTTP server graceful shutdown

3. **[03-resource-monitoring.js](./examples/03-resource-monitoring.js)**
   - CPU and memory monitoring
   - Event loop lag detection
   - Resource alert system
   - Health check implementation

4. **[04-uncaught-exception.js](./examples/04-uncaught-exception.js)**
   - Safe uncaughtException handling
   - Error logging and reporting
   - Graceful degradation
   - Process restart coordination

5. **[05-unhandled-rejection.js](./examples/05-unhandled-rejection.js)**
   - Handling unhandledRejection
   - Promise error tracking
   - Rejection logging
   - Recovery strategies

6. **[06-process-warnings.js](./examples/06-process-warnings.js)**
   - Capturing process warnings
   - Custom warning emission
   - Warning aggregation
   - Production warning handling

7. **[07-performance-monitoring.js](./examples/07-performance-monitoring.js)**
   - CPU profiling setup
   - Memory heap analysis
   - Performance metrics collection
   - Event loop monitoring

8. **[08-ipc-basics.js](./examples/08-ipc-basics.js)**
   - Inter-process communication
   - Message passing patterns
   - Process coordination
   - IPC error handling

---

## Exercises

Challenging exercises to test your intermediate skills:

### Exercise 1: Production Signal Handler
**Difficulty:** Medium
**File:** [exercises/exercise-1.js](./exercises/exercise-1.js)

Implement a production-grade signal handler that:
- Handles SIGTERM, SIGINT, and SIGHUP
- Implements multi-phase shutdown
- Drains connections before exit
- Forces exit after timeout
- Logs shutdown progress

**Skills practiced:**
- Signal handling
- Graceful shutdown
- Timeout management
- Cleanup coordination

---

### Exercise 2: Resource Monitor with Alerts
**Difficulty:** Medium
**File:** [exercises/exercise-2.js](./exercises/exercise-2.js)

Create a resource monitoring system that:
- Tracks CPU, memory, and event loop lag
- Emits alerts when thresholds exceeded
- Provides health check endpoint
- Logs resource snapshots
- Implements configurable alert rules

**Skills practiced:**
- Resource monitoring
- Alert systems
- Health checks
- Performance tracking

---

### Exercise 3: Error Recovery System
**Difficulty:** Medium-Hard
**File:** [exercises/exercise-3.js](./exercises/exercise-3.js)

Build an error recovery system that:
- Handles uncaughtException safely
- Manages unhandledRejection
- Logs errors with context
- Implements graceful degradation
- Coordinates process restart

**Skills practiced:**
- Critical error handling
- Error logging and reporting
- Recovery strategies
- Process coordination

---

### Exercise 4: Process Health Manager
**Difficulty:** Hard
**File:** [exercises/exercise-4.js](./exercises/exercise-4.js)

Implement a comprehensive health manager that:
- Monitors multiple health metrics
- Detects memory leaks
- Tracks event loop blocking
- Manages graceful shutdown
- Provides detailed health reports

**Skills practiced:**
- Advanced monitoring
- Leak detection
- Performance analysis
- Production debugging

---

### Exercise 5: Multi-Process Coordinator
**Difficulty:** Hard
**File:** [exercises/exercise-5.js](./exercises/exercise-5.js)

Create a multi-process coordination system that:
- Spawns and manages worker processes
- Implements IPC communication
- Handles worker failures and restarts
- Coordinates graceful shutdown
- Load balances across workers

**Skills practiced:**
- Inter-process communication
- Process lifecycle management
- Fault tolerance
- Distributed coordination

---

## Solutions

Complete solutions with multiple implementation approaches:

- [Solution 1](./solutions/exercise-1-solution.js) - Production signal handler
- [Solution 2](./solutions/exercise-2-solution.js) - Resource monitor with alerts
- [Solution 3](./solutions/exercise-3-solution.js) - Error recovery system
- [Solution 4](./solutions/exercise-4-solution.js) - Process health manager
- [Solution 5](./solutions/exercise-5-solution.js) - Multi-process coordinator

---

## Key Concepts Summary

### Signal Handling

```javascript
// Production-ready signal handler
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}, shutting down gracefully...`);

  // Phase 1: Stop accepting new connections
  server.close(() => {
    console.log('Server closed');

    // Phase 2: Close database connections
    db.close(() => {
      console.log('Database closed');
      process.exit(0);
    });
  });

  // Force exit after timeout
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### Resource Monitoring

```javascript
// Monitor process resources
function monitorResources() {
  const usage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  // Memory check
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  if (heapUsedMB > 500) {
    console.warn(`High memory usage: ${heapUsedMB.toFixed(2)} MB`);
  }

  // Event loop lag check
  const start = Date.now();
  setImmediate(() => {
    const lag = Date.now() - start;
    if (lag > 100) {
      console.warn(`Event loop lag: ${lag}ms`);
    }
  });
}

setInterval(monitorResources, 10000);
```

### Error Event Handling

```javascript
// Handle uncaught exceptions
process.on('uncaughtException', (error, origin) => {
  console.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
    origin
  });

  // Log to error tracking service
  logError(error);

  // Graceful shutdown
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', {
    reason,
    promise
  });

  // Log and continue (or exit based on severity)
  logError(reason);
});
```

### Process Warnings

```javascript
// Listen for process warnings
process.on('warning', (warning) => {
  console.warn('Process Warning:', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  });

  // Take action based on warning type
  if (warning.name === 'MaxListenersExceededWarning') {
    console.error('Possible EventEmitter memory leak detected');
  }
});

// Emit custom warnings
process.emitWarning('Custom warning message', {
  code: 'MY_WARNING',
  detail: 'Additional warning details'
});
```

---

## Common Pitfalls

### Pitfall 1: Not Handling Async Cleanup

```javascript
// ❌ Wrong - doesn't wait for async cleanup
process.on('SIGTERM', () => {
  db.close(); // Async, but we don't wait
  process.exit(0); // Exits immediately!
});

// ✅ Correct - wait for async cleanup
process.on('SIGTERM', async () => {
  try {
    await db.close();
    await cache.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
});
```

### Pitfall 2: Ignoring Shutdown Timeout

```javascript
// ❌ Wrong - might hang forever
process.on('SIGTERM', async () => {
  await server.close(); // Might never resolve
  process.exit(0);
});

// ✅ Correct - force exit after timeout
process.on('SIGTERM', async () => {
  const timeout = setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 30000);

  try {
    await server.close();
    clearTimeout(timeout);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
});
```

### Pitfall 3: Continuing After uncaughtException

```javascript
// ❌ Wrong - process is in unknown state
process.on('uncaughtException', (error) => {
  console.error(error);
  // Process continues - dangerous!
});

// ✅ Correct - log and exit gracefully
process.on('uncaughtException', (error) => {
  console.error('Fatal error:', error);
  logError(error);

  // Attempt graceful shutdown
  gracefulShutdown('uncaughtException');
});
```

### Pitfall 4: Not Monitoring Event Loop Lag

```javascript
// ❌ Wrong - blocking operation without monitoring
app.get('/heavy', (req, res) => {
  const result = heavyComputation(); // Blocks event loop
  res.json(result);
});

// ✅ Correct - monitor and alert on lag
function checkEventLoopLag() {
  const start = Date.now();
  setImmediate(() => {
    const lag = Date.now() - start;
    if (lag > 50) {
      console.warn(`Event loop lag detected: ${lag}ms`);
      metrics.recordLag(lag);
    }
  });
}

setInterval(checkEventLoopLag, 1000);
```

### Pitfall 5: Ignoring unhandledRejection

```javascript
// ❌ Wrong - silent promise failures
async function fetchData() {
  throw new Error('Fetch failed');
}

fetchData(); // Promise rejection ignored!

// ✅ Correct - handle rejections globally
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  logError(reason);

  // Optionally exit for critical errors
  if (isCritical(reason)) {
    gracefulShutdown('unhandledRejection');
  }
});
```

---

## Practice Projects

Apply your intermediate process management skills:

### Project 1: Production Web Server
Build a production-ready HTTP server that:
- Handles all signals gracefully
- Drains connections on shutdown
- Monitors resource usage
- Logs errors to external service
- Implements health checks
- Handles worker process crashes

### Project 2: Long-Running Job Processor
Create a background job processor that:
- Processes jobs from a queue
- Monitors memory and CPU usage
- Handles graceful shutdown mid-job
- Implements job timeout handling
- Reports progress via IPC
- Recovers from errors gracefully

### Project 3: Process Supervisor
Build a process supervisor that:
- Spawns and monitors child processes
- Restarts crashed processes
- Implements exponential backoff
- Coordinates multi-process shutdown
- Collects and aggregates logs
- Provides process health dashboard

### Project 4: Microservice Health Monitor
Create a health monitoring service that:
- Monitors multiple service instances
- Detects memory leaks
- Tracks event loop performance
- Implements circuit breaker patterns
- Coordinates rolling restarts
- Provides real-time health metrics

---

## Performance Considerations

### Memory Leak Detection

```javascript
// Track heap size over time
let lastHeapUsed = 0;
const heapHistory = [];

function checkMemoryLeak() {
  const { heapUsed } = process.memoryUsage();
  const heapUsedMB = heapUsed / 1024 / 1024;

  heapHistory.push(heapUsedMB);
  if (heapHistory.length > 10) heapHistory.shift();

  // Check for consistent growth
  const trend = heapHistory.reduce((sum, val) => sum + val, 0) / heapHistory.length;
  if (heapUsedMB > trend * 1.5 && heapUsedMB > 100) {
    console.warn(`Possible memory leak detected: ${heapUsedMB.toFixed(2)} MB`);

    // Optionally trigger heap dump
    // require('heapdump').writeSnapshot();
  }

  lastHeapUsed = heapUsed;
}

setInterval(checkMemoryLeak, 60000);
```

### CPU Usage Tracking

```javascript
// Track CPU usage
let lastCpuUsage = process.cpuUsage();

function checkCpuUsage() {
  const cpuUsage = process.cpuUsage(lastCpuUsage);
  const totalUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

  console.log(`CPU Usage: ${totalUsage.toFixed(2)}s`);

  if (totalUsage > 5) {
    console.warn('High CPU usage detected');
  }

  lastCpuUsage = process.cpuUsage();
}

setInterval(checkCpuUsage, 10000);
```

### Event Loop Monitoring

```javascript
// Comprehensive event loop monitoring
class EventLoopMonitor {
  constructor(options = {}) {
    this.threshold = options.threshold || 50; // ms
    this.interval = options.interval || 1000; // ms
    this.samples = [];
    this.maxSamples = 60;
  }

  start() {
    this.timer = setInterval(() => {
      const start = Date.now();

      setImmediate(() => {
        const lag = Date.now() - start;
        this.samples.push(lag);

        if (this.samples.length > this.maxSamples) {
          this.samples.shift();
        }

        if (lag > this.threshold) {
          const avg = this.getAverageLag();
          console.warn(`Event loop lag: ${lag}ms (avg: ${avg.toFixed(2)}ms)`);
        }
      });
    }, this.interval);
  }

  getAverageLag() {
    return this.samples.reduce((sum, val) => sum + val, 0) / this.samples.length;
  }

  stop() {
    clearInterval(this.timer);
  }
}

const monitor = new EventLoopMonitor({ threshold: 100 });
monitor.start();
```

---

## Testing Your Knowledge

### Self-Check Questions

1. What's the difference between SIGTERM and SIGINT?
2. Why is it important to set a timeout during graceful shutdown?
3. What happens after an uncaughtException event?
4. When should you exit the process vs. continue running?
5. How do you detect event loop blocking?
6. What's the difference between 'exit' and 'beforeExit' events?
7. Why are unhandledRejection events critical?
8. How can you detect memory leaks in a running process?
9. What are process warnings and when are they emitted?
10. How does IPC work between parent and child processes?

### Practical Check

You've mastered this level if you can:

- [ ] Implement production-ready signal handlers
- [ ] Build graceful shutdown with timeout handling
- [ ] Monitor and alert on resource usage
- [ ] Handle critical errors safely
- [ ] Detect and diagnose memory leaks
- [ ] Implement multi-process coordination
- [ ] Build resilient long-running processes
- [ ] Debug production process issues

---

## Production Checklist

Before deploying to production, ensure you:

- [ ] Handle SIGTERM and SIGINT for graceful shutdown
- [ ] Implement shutdown timeout (force exit after 30s)
- [ ] Drain all connections before exit
- [ ] Close database connections properly
- [ ] Handle uncaughtException and unhandledRejection
- [ ] Monitor memory usage and set alerts
- [ ] Track event loop lag
- [ ] Log all errors to external service
- [ ] Implement health check endpoint
- [ ] Set up process monitoring/alerting
- [ ] Test shutdown behavior under load
- [ ] Document exit codes and their meanings

---

## Debugging Strategies

### Memory Issues

```javascript
// Enable memory debugging
node --inspect --max-old-space-size=4096 app.js

// Take heap snapshots
const v8 = require('v8');
const fs = require('fs');

function takeHeapSnapshot() {
  const filename = `heap-${Date.now()}.heapsnapshot`;
  const snapshot = v8.writeHeapSnapshot(filename);
  console.log(`Heap snapshot written to ${snapshot}`);
}

// Trigger on high memory
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    takeHeapSnapshot();
  }
});
```

### CPU Profiling

```javascript
// Profile CPU usage
const { Session } = require('inspector');
const fs = require('fs');

const session = new Session();
session.connect();

function startProfiling() {
  session.post('Profiler.enable', () => {
    session.post('Profiler.start', () => {
      console.log('CPU profiling started');
    });
  });
}

function stopProfiling() {
  session.post('Profiler.stop', (err, { profile }) => {
    if (!err) {
      fs.writeFileSync('profile.cpuprofile', JSON.stringify(profile));
      console.log('CPU profile saved');
    }
  });
}
```

---

## Additional Resources

### Official Documentation
- [Node.js Process API](https://nodejs.org/api/process.html)
- [Process Events](https://nodejs.org/api/process.html#process_process_events)
- [Signal Events](https://nodejs.org/api/process.html#process_signal_events)

### Related Topics
- Level 1: Process Basics (review if needed)
- Level 3: Advanced Process Management (next challenge)
- Module 7: Child Process (spawning and managing child processes)
- Module 8: Cluster (multi-process patterns)

### Recommended Reading
- [Graceful Shutdown Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Error Handling in Node.js](https://nodejs.org/en/docs/guides/error-handling/)

---

## Next Steps

After completing this level:

1. Review all examples and solutions thoroughly
2. Build at least one practice project end-to-end
3. Test graceful shutdown in real applications
4. Move to [Level 3: Advanced](../level-3-advanced/README.md)
5. Or apply process management patterns in production

---

## Common Production Patterns

### Cluster Pattern with Graceful Shutdown

```javascript
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numWorkers = os.cpus().length;

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart worker
  });

  // Graceful shutdown of all workers
  process.on('SIGTERM', () => {
    console.log('Master received SIGTERM, shutting down workers...');

    for (const id in cluster.workers) {
      cluster.workers[id].process.kill('SIGTERM');
    }

    setTimeout(() => {
      console.log('Force killing remaining workers');
      process.exit(0);
    }, 30000);
  });
} else {
  // Worker process
  require('./app.js');
}
```

### Health Check with Resource Metrics

```javascript
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    pid: process.pid
  };

  // Check if resources are within acceptable limits
  const heapUsedMB = health.memory.heapUsed / 1024 / 1024;
  if (heapUsedMB > 500) {
    health.status = 'degraded';
    health.issues = ['high_memory_usage'];
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

---

Ready to master production process management? Start with the [first guide](./guides/01-signal-handling.md)!
