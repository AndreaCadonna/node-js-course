# Level 3: Advanced Child Process Management

Master advanced patterns for building production-ready process management systems.

## Learning Objectives

By completing this level, you will:

- ✅ Build robust process managers with pooling and supervision
- ✅ Implement advanced IPC patterns with handle passing
- ✅ Create self-healing process supervision systems
- ✅ Apply security best practices for command execution
- ✅ Optimize performance with process pooling and caching
- ✅ Design distributed task processing systems
- ✅ Monitor processes with metrics and health checks
- ✅ Handle edge cases and failure scenarios gracefully

---

## Prerequisites

- Completion of Level 1 (Basics) and Level 2 (Intermediate)
- Strong understanding of:
  - All child process methods
  - IPC and message passing
  - Stream handling
  - Event-driven programming
  - Promises and async/await
- Experience with:
  - Production Node.js applications
  - Error handling patterns
  - System design concepts

---

## What You'll Learn

### Core Topics

1. **Building Process Managers**
   - Process pooling architecture
   - Resource allocation strategies
   - Queue management
   - Load balancing

2. **Advanced IPC Patterns**
   - Handle passing (TCP, server, socket)
   - Shared memory concepts
   - Request-response patterns
   - Pub-sub architectures

3. **Process Supervision**
   - Auto-restart mechanisms
   - Health checking
   - Circuit breakers
   - Graceful degradation

4. **Security Considerations**
   - Command injection prevention
   - Sandboxing strategies
   - Resource limits
   - Privilege separation

5. **Performance Optimization**
   - Process pooling
   - Caching strategies
   - Resource management
   - Bottleneck identification

6. **Production Patterns**
   - Monitoring and metrics
   - Logging strategies
   - Error recovery
   - Deployment considerations

---

## Time Commitment

**Estimated time**: 4-6 hours
- Reading guides: 90-120 minutes
- Studying examples: 60-90 minutes
- Exercises: 90-120 minutes
- Experimentation: 60-90 minutes

---

## Conceptual Guides

Master these advanced concepts before diving into implementation:

### Essential Reading

1. **[Building Process Managers](guides/01-building-process-managers.md)** (20 min)
   - Architecture patterns
   - Resource management
   - Queue strategies
   - Load balancing

2. **[Advanced IPC Patterns](guides/02-advanced-ipc-patterns.md)** (18 min)
   - Handle passing techniques
   - Zero-copy communication
   - Protocol design
   - Performance optimization

3. **[Process Monitoring](guides/03-process-monitoring.md)** (15 min)
   - Metrics collection
   - Health checks
   - Alerting strategies
   - Dashboard design

4. **[Security Considerations](guides/04-security-considerations.md)** (18 min)
   - Threat model
   - Defense in depth
   - Sandboxing
   - Audit logging

5. **[Performance Optimization](guides/05-performance-optimization.md)** (15 min)
   - Profiling techniques
   - Resource pooling
   - Caching strategies
   - Scaling patterns

6. **[Production Patterns](guides/06-production-patterns.md)** (20 min)
   - Deployment strategies
   - Monitoring setup
   - Error recovery
   - Maintenance procedures

---

## Key Concepts

### Process Pool Manager

```javascript
class ProcessPool {
  constructor(size, workerPath) {
    this.size = size;
    this.workerPath = workerPath;
    this.workers = [];
    this.queue = [];
    this.init();
  }

  init() {
    for (let i = 0; i < this.size; i++) {
      this.createWorker();
    }
  }

  createWorker() {
    const worker = fork(this.workerPath);
    worker.available = true;

    worker.on('message', (result) => {
      this.handleResult(worker, result);
    });

    worker.on('exit', (code) => {
      this.handleWorkerExit(worker, code);
    });

    this.workers.push(worker);
    return worker;
  }

  async execute(task) {
    return new Promise((resolve, reject) => {
      const job = { task, resolve, reject };
      const worker = this.getAvailableWorker();

      if (worker) {
        this.runJob(worker, job);
      } else {
        this.queue.push(job);
      }
    });
  }

  getAvailableWorker() {
    return this.workers.find(w => w.available && w.connected);
  }

  runJob(worker, job) {
    worker.available = false;
    worker.currentJob = job;
    worker.send(job.task);
  }

  handleResult(worker, result) {
    if (worker.currentJob) {
      worker.currentJob.resolve(result);
      worker.currentJob = null;
    }

    worker.available = true;
    this.processQueue();
  }

  processQueue() {
    while (this.queue.length > 0) {
      const worker = this.getAvailableWorker();
      if (!worker) break;

      const job = this.queue.shift();
      this.runJob(worker, job);
    }
  }

  handleWorkerExit(worker, code) {
    const index = this.workers.indexOf(worker);
    if (index !== -1) {
      this.workers.splice(index, 1);
      this.createWorker(); // Auto-restart
    }
  }

  async shutdown() {
    await Promise.all(
      this.workers.map(w => this.shutdownWorker(w))
    );
  }

  shutdownWorker(worker) {
    return new Promise((resolve) => {
      worker.on('exit', resolve);
      worker.kill('SIGTERM');
    });
  }
}
```

### Handle Passing

```javascript
// Parent process
const { fork } = require('child_process');
const net = require('net');

const worker = fork('./worker.js');

const server = net.createServer((socket) => {
  // Pass socket handle to worker
  worker.send('socket', socket);
});

server.listen(8000);

// Worker process
process.on('message', (msg, socket) => {
  if (msg === 'socket' && socket) {
    // Handle the socket in worker
    socket.end('Handled by worker\n');
  }
});
```

### Process Supervision

```javascript
class ProcessSupervisor {
  constructor(workerPath, options = {}) {
    this.workerPath = workerPath;
    this.maxRestarts = options.maxRestarts || 5;
    this.restartDelay = options.restartDelay || 1000;
    this.healthCheckInterval = options.healthCheckInterval || 5000;
    this.worker = null;
    this.restarts = 0;
    this.lastRestart = 0;
  }

  start() {
    this.createWorker();
    this.startHealthCheck();
  }

  createWorker() {
    this.worker = fork(this.workerPath);

    this.worker.on('exit', (code, signal) => {
      this.handleExit(code, signal);
    });

    this.worker.on('error', (error) => {
      this.handleError(error);
    });

    // Reset restart counter if worker runs for a while
    setTimeout(() => {
      this.restarts = 0;
    }, 60000); // 1 minute
  }

  handleExit(code, signal) {
    if (code !== 0) {
      console.error(`Worker exited with code ${code}, signal ${signal}`);
      this.restart();
    }
  }

  handleError(error) {
    console.error('Worker error:', error);
  }

  restart() {
    const now = Date.now();

    // Check if we're restarting too frequently
    if (now - this.lastRestart < this.restartDelay) {
      this.restarts++;
    } else {
      this.restarts = 1;
    }

    if (this.restarts > this.maxRestarts) {
      console.error('Max restarts reached. Giving up.');
      return;
    }

    this.lastRestart = now;

    setTimeout(() => {
      console.log(`Restarting worker (attempt ${this.restarts})`);
      this.createWorker();
    }, this.restartDelay * this.restarts);
  }

  startHealthCheck() {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);
  }

  async performHealthCheck() {
    if (!this.worker || !this.worker.connected) {
      this.restart();
      return;
    }

    const timeout = setTimeout(() => {
      console.error('Health check timeout');
      this.worker.kill();
    }, 3000);

    this.worker.send({ type: 'health_check' });

    const handler = (msg) => {
      if (msg.type === 'health_check_response') {
        clearTimeout(timeout);
        this.worker.removeListener('message', handler);
      }
    };

    this.worker.on('message', handler);
  }

  shutdown() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    if (this.worker) {
      this.worker.kill('SIGTERM');
    }
  }
}
```

---

## Quick Start

### Advanced Process Manager

```javascript
const { fork } = require('child_process');

class AdvancedProcessManager {
  constructor(config) {
    this.workers = new Map();
    this.config = config;
  }

  async spawn(name, script, options = {}) {
    const worker = fork(script, options.args || [], {
      env: { ...process.env, ...options.env },
      cwd: options.cwd,
      silent: false
    });

    const workerInfo = {
      worker,
      name,
      script,
      startTime: Date.now(),
      restarts: 0,
      messages: 0,
      errors: 0
    };

    worker.on('message', (msg) => {
      workerInfo.messages++;
      this.handleMessage(name, msg);
    });

    worker.on('error', (error) => {
      workerInfo.errors++;
      this.handleError(name, error);
    });

    worker.on('exit', (code, signal) => {
      this.handleExit(name, code, signal);
    });

    this.workers.set(name, workerInfo);
    return worker;
  }

  handleMessage(name, msg) {
    console.log(`[${name}] Message:`, msg);
  }

  handleError(name, error) {
    console.error(`[${name}] Error:`, error);
  }

  async handleExit(name, code, signal) {
    const info = this.workers.get(name);
    if (!info) return;

    if (code !== 0 && info.restarts < 3) {
      console.log(`[${name}] Restarting (attempt ${info.restarts + 1})`);
      info.restarts++;
      await this.spawn(name, info.script);
    } else {
      this.workers.delete(name);
    }
  }

  send(name, message) {
    const info = this.workers.get(name);
    if (info && info.worker.connected) {
      info.worker.send(message);
    }
  }

  getStats() {
    const stats = {};
    for (const [name, info] of this.workers) {
      stats[name] = {
        uptime: Date.now() - info.startTime,
        restarts: info.restarts,
        messages: info.messages,
        errors: info.errors,
        connected: info.worker.connected
      };
    }
    return stats;
  }

  async shutdown() {
    const promises = [];
    for (const [name, info] of this.workers) {
      promises.push(
        new Promise((resolve) => {
          info.worker.on('exit', resolve);
          info.worker.kill('SIGTERM');
        })
      );
    }
    await Promise.all(promises);
    this.workers.clear();
  }
}
```

---

## Common Patterns

### 1. Process Pool with Circuit Breaker

```javascript
class ResilientProcessPool {
  constructor(size, workerPath) {
    this.pool = new ProcessPool(size, workerPath);
    this.failures = 0;
    this.failureThreshold = 5;
    this.resetTimeout = 30000; // 30 seconds
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(task) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await this.pool.execute(task);
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
      console.log('Circuit breaker closed');
    }
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      console.log('Circuit breaker opened');

      setTimeout(() => {
        this.state = 'HALF_OPEN';
        this.failures = 0;
        console.log('Circuit breaker half-open');
      }, this.resetTimeout);
    }
  }
}
```

### 2. Distributed Task Queue

```javascript
class DistributedTaskQueue {
  constructor(workerCount) {
    this.workers = [];
    this.queue = [];
    this.results = new Map();

    for (let i = 0; i < workerCount; i++) {
      this.createWorker(i);
    }
  }

  createWorker(id) {
    const worker = fork('./task-worker.js');
    worker.id = id;
    worker.busy = false;

    worker.on('message', ({ taskId, result, error }) => {
      if (error) {
        this.results.get(taskId).reject(new Error(error));
      } else {
        this.results.get(taskId).resolve(result);
      }
      this.results.delete(taskId);
      worker.busy = false;
      this.processQueue();
    });

    this.workers.push(worker);
  }

  async addTask(task) {
    const taskId = `${Date.now()}-${Math.random()}`;

    return new Promise((resolve, reject) => {
      this.results.set(taskId, { resolve, reject });
      this.queue.push({ taskId, task });
      this.processQueue();
    });
  }

  processQueue() {
    while (this.queue.length > 0) {
      const worker = this.workers.find(w => !w.busy && w.connected);
      if (!worker) break;

      const job = this.queue.shift();
      worker.busy = true;
      worker.send(job);
    }
  }
}
```

---

## Examples

Explore these advanced examples to see patterns in action:

### Example Files

1. **[Process Manager](examples/01-process-manager.js)**
   - Complete process pool implementation
   - Worker lifecycle management
   - Queue processing
   - Resource cleanup

2. **[Advanced IPC](examples/02-advanced-ipc.js)**
   - Handle passing demonstration
   - TCP server sharing
   - Socket distribution
   - Performance comparison

3. **[Process Supervision](examples/03-process-supervision.js)**
   - Auto-restart mechanism
   - Health checking
   - Circuit breaker pattern
   - Graceful recovery

4. **[Security Best Practices](examples/04-security-best-practices.js)**
   - Command sanitization
   - Resource limits
   - Sandboxing strategies
   - Audit logging

5. **[Performance Optimization](examples/05-performance-optimization.js)**
   - Process pooling
   - Caching strategies
   - Resource monitoring
   - Bottleneck identification

6. **[Distributed Tasks](examples/06-distributed-tasks.js)**
   - Task distribution
   - Load balancing
   - Result aggregation
   - Fault tolerance

---

## Exercises

Apply your knowledge with these challenging exercises:

### Exercise 1: Build a Process Manager
Create a production-ready process manager with:
- Worker pool management
- Auto-restart on failure
- Health monitoring
- Graceful shutdown

**Skills practiced:**
- Architecture design
- Resource management
- Error recovery
- Testing strategies

### Exercise 2: Task Queue System
Implement a distributed task queue with:
- Priority queuing
- Task persistence
- Worker scaling
- Result caching

**Skills practiced:**
- Queue management
- Distributed systems
- Data persistence
- Performance optimization

### Exercise 3: Process Monitor with Stats
Build a monitoring system with:
- Real-time metrics
- Performance tracking
- Alert system
- Dashboard data

**Skills practiced:**
- Metrics collection
- Data aggregation
- Monitoring patterns
- Visualization prep

### Exercise 4: Secure Command Executor
Create a secure command execution system with:
- Input validation
- Command whitelisting
- Resource limits
- Audit logging

**Skills practiced:**
- Security patterns
- Validation techniques
- Resource control
- Compliance

### Exercise 5: Distributed Processing System
Design a distributed processing framework with:
- Work distribution
- Load balancing
- Fault tolerance
- Result aggregation

**Skills practiced:**
- System design
- Distributed computing
- Fault tolerance
- Scalability

---

## Learning Path

### Recommended Sequence

1. **Read All Guides** (90-120 minutes)
   - Start with [Building Process Managers](guides/01-building-process-managers.md)
   - Read each guide thoroughly
   - Take detailed notes
   - Sketch architectures

2. **Study Examples** (60-90 minutes)
   - Run each example
   - Modify configurations
   - Test edge cases
   - Measure performance

3. **Complete Exercises** (90-120 minutes)
   - Design before coding
   - Implement incrementally
   - Test thoroughly
   - Document decisions

4. **Review Solutions** (30-45 minutes)
   - Compare approaches
   - Understand trade-offs
   - Note best practices
   - Identify improvements

---

## Success Criteria

You've mastered Level 3 when you can:

- [ ] Design and implement process pool managers
- [ ] Use advanced IPC patterns including handle passing
- [ ] Build self-healing supervision systems
- [ ] Apply security best practices consistently
- [ ] Optimize process performance effectively
- [ ] Create distributed task processing systems
- [ ] Monitor processes with comprehensive metrics
- [ ] Handle complex failure scenarios gracefully
- [ ] Make informed architectural decisions
- [ ] Deploy to production with confidence

---

## Real-World Applications

These skills prepare you for:

1. **Building Process Managers**
   - PM2-like tools
   - Container orchestrators
   - Job schedulers
   - Service supervisors

2. **Distributed Systems**
   - Task queues
   - Worker pools
   - Load balancers
   - Data processors

3. **DevOps Tools**
   - Deployment systems
   - Monitoring tools
   - Log aggregators
   - Health checkers

4. **High-Performance Systems**
   - Video processing
   - Image manipulation
   - Data transformation
   - Batch processing

---

## Best Practices Summary

### Process Management
- Always supervise workers
- Implement health checks
- Handle all exit scenarios
- Clean up resources properly

### IPC
- Design clear protocols
- Handle message ordering
- Implement timeouts
- Validate all messages

### Security
- Validate all inputs
- Use whitelisting
- Apply resource limits
- Log security events

### Performance
- Pool and reuse processes
- Monitor resource usage
- Cache when appropriate
- Profile regularly

### Production
- Monitor everything
- Log comprehensively
- Handle all errors
- Test failure scenarios

---

## Additional Practice

Build these advanced projects:

1. **PM2 Clone**
   - Process manager
   - Cluster mode
   - Log management
   - Web dashboard

2. **Task Processor**
   - Queue system
   - Worker pool
   - Result storage
   - API interface

3. **Monitoring System**
   - Process metrics
   - Health checks
   - Alert system
   - Visualization

4. **Distributed System**
   - Work distribution
   - Load balancing
   - Failure recovery
   - Result aggregation

---

## Resources

### Official Documentation
- [Node.js child_process Documentation](https://nodejs.org/api/child_process.html)
- [Node.js Cluster Documentation](https://nodejs.org/api/cluster.html)
- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)

### Tools & Libraries
- **PM2**: Production process manager
- **BullMQ**: Distributed queue system
- **PM2-metrics**: Process monitoring
- **node-worker-pool**: Process pooling

### Further Reading
- "Node.js Design Patterns" by Mario Casciaro
- "Distributed Systems" by Andrew Tanenbaum
- Node.js Performance Optimization docs

---

## Questions or Stuck?

- Review the [CONCEPTS.md](../CONCEPTS.md) for deep dives
- Study the examples carefully
- Test in isolation first
- Monitor with logging
- Profile performance
- Review solutions for patterns

---

## Ready to Begin?

Start with **[Building Process Managers](guides/01-building-process-managers.md)** and work through each guide methodically. These are advanced topics that require careful study and practice.

Remember: Production systems require careful design, thorough testing, and robust error handling. Take the time to understand each pattern deeply before moving to the next!
