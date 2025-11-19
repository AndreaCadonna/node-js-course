# Level 3: Process Advanced

Master production-grade process management, optimization, and enterprise-level deployment patterns.

## Overview

This level covers advanced process management topics essential for building and maintaining production-grade Node.js applications at scale. You'll learn how to detect and prevent memory leaks, profile CPU usage, implement sophisticated health checks, secure processes, debug production issues, achieve zero-downtime deployments, and optimize performance. By the end of this level, you'll be able to design, deploy, and maintain enterprise-level Node.js applications with confidence.

**Time to complete:** 5-7 hours

---

## Learning Objectives

By completing this level, you will:

- [ ] Detect and prevent memory leaks in production applications
- [ ] Profile CPU usage and optimize performance bottlenecks
- [ ] Implement comprehensive health checks and monitoring systems
- [ ] Apply process security best practices and hardening techniques
- [ ] Debug production issues using advanced techniques
- [ ] Implement zero-downtime deployment strategies
- [ ] Build sophisticated inter-process communication patterns
- [ ] Optimize process performance for production workloads
- [ ] Handle complex failure scenarios and edge cases
- [ ] Design resilient, self-healing process architectures

---

## Prerequisites

- Completed Level 1: Process Basics
- Completed Level 2: Process Intermediate
- Strong proficiency with async/await and Promises
- Understanding of operating system concepts
- Experience with production deployments
- Familiarity with debugging and profiling tools
- Knowledge of security principles

---

## Topics Covered

### 1. Memory Leak Detection & Prevention
- Heap snapshot analysis and comparison
- Memory profiling with V8 tools
- Common memory leak patterns
- Detecting closure-based leaks
- Event listener leak detection
- Buffer and stream memory issues
- Weak references and garbage collection
- Automated leak detection systems

### 2. CPU Profiling & Optimization
- CPU profiling with Inspector protocol
- Flame graph analysis
- Hot path identification
- V8 optimization hints and deoptimization
- Event loop performance tuning
- Async operation optimization
- Worker thread delegation strategies
- JIT compilation patterns

### 3. Advanced Health Checks & Monitoring
- Multi-tier health check systems
- Liveness vs readiness probes
- Custom health metrics and SLIs
- Distributed tracing integration
- Application Performance Monitoring (APM)
- Real-time alerting systems
- Health check orchestration
- Circuit breaker integration

### 4. Process Security Considerations
- Process isolation and sandboxing
- Privilege dropping and least privilege
- Security event monitoring
- Resource limit enforcement
- Secure environment variable handling
- Defense against process attacks
- Audit logging for compliance
- Security headers and hardening

### 5. Production Debugging Techniques
- Remote debugging strategies
- Post-mortem debugging with core dumps
- Production profiling techniques
- Distributed tracing and correlation IDs
- Advanced logging patterns
- Debug symbol management
- Performance regression detection
- Root cause analysis workflows

### 6. Zero-Downtime Deployments
- Rolling update strategies
- Blue-green deployment patterns
- Canary release implementations
- Connection draining protocols
- State transfer and session handling
- Health check integration with load balancers
- Rollback strategies
- Feature flag coordination

### 7. Advanced IPC Patterns
- Message queue integration
- Shared memory patterns
- Socket-based IPC
- Lock-free communication
- Process pool management
- Distributed state synchronization
- Fault-tolerant messaging
- Performance optimization

### 8. Performance Tuning & Optimization
- V8 garbage collection tuning
- Memory allocation strategies
- CPU affinity and scheduling
- I/O optimization techniques
- Caching strategies
- Connection pooling
- Batch processing patterns
- Resource quotas and limits

---

## Conceptual Guides

Deep dive into advanced production process management:

### Essential Reading

1. **[Memory Leak Detection and Prevention](./guides/01-memory-leak-detection.md)** (40 min)
   - Understanding heap memory management
   - Tools for leak detection
   - Common leak patterns and fixes
   - Automated monitoring strategies

2. **[CPU Profiling and Optimization](./guides/02-cpu-profiling.md)** (35 min)
   - Profiling methodologies
   - Reading flame graphs
   - V8 optimization strategies
   - Performance tuning techniques

3. **[Production Health Checks](./guides/03-production-health-checks.md)** (30 min)
   - Designing health check systems
   - Kubernetes-style probes
   - Custom health metrics
   - Integration with monitoring

4. **[Process Security Hardening](./guides/04-process-security.md)** (35 min)
   - Security best practices
   - Isolation techniques
   - Attack surface reduction
   - Compliance considerations

5. **[Zero-Downtime Deployments](./guides/05-zero-downtime-deployments.md)** (40 min)
   - Deployment strategies
   - State management
   - Connection handling
   - Rollback procedures

---

## Learning Path

### Recommended Approach

```
Week 1: Memory & CPU Optimization
├─ Day 1: Read guide 1, study examples 1-2, exercise 1
├─ Day 2: Practice leak detection on real apps
└─ Day 3: Read guide 2, study examples 3-4, exercise 2

Week 2: Health Checks & Security
├─ Day 4: Read guide 3, study examples 5-6, exercise 3
├─ Day 5: Read guide 4, implement security hardening
└─ Day 6: Complete exercise 4

Week 3: Deployments & Advanced Patterns
├─ Day 7: Read guide 5, study examples 7-8
├─ Day 8: Complete exercise 5, mini-project
└─ Day 9: Build production deployment system
```

### Quick Start (Experienced Developers)

1. Review all guides (focus on guides 1, 2, and 5)
2. Study examples 1, 3, 5, 7, 8
3. Complete exercises 2, 4, 5
4. Build production-ready process management system

---

## Examples

Production-ready code demonstrating advanced patterns:

1. **[01-memory-leak-detection.js](./examples/01-memory-leak-detection.js)**
   - Heap snapshot automation
   - Memory trend analysis
   - Leak pattern detection
   - Automated alerting

2. **[02-cpu-profiling.js](./examples/02-cpu-profiling.js)**
   - Inspector protocol profiling
   - Flame graph generation
   - Hot path optimization
   - Performance regression detection

3. **[03-advanced-health-checks.js](./examples/03-advanced-health-checks.js)**
   - Multi-tier health system
   - Liveness and readiness probes
   - Custom metrics collection
   - Integration with orchestrators

4. **[04-process-security.js](./examples/04-process-security.js)**
   - Privilege dropping
   - Resource limit enforcement
   - Security event monitoring
   - Sandboxing techniques

5. **[05-production-debugging.js](./examples/05-production-debugging.js)**
   - Remote debugging setup
   - Core dump analysis
   - Distributed tracing
   - Advanced logging patterns

6. **[06-zero-downtime-deploy.js](./examples/06-zero-downtime-deploy.js)**
   - Rolling update implementation
   - Connection draining
   - State transfer
   - Health-aware load balancing

7. **[07-advanced-ipc.js](./examples/07-advanced-ipc.js)**
   - High-performance IPC
   - Message queue patterns
   - Process pool management
   - Fault-tolerant communication

8. **[08-performance-optimization.js](./examples/08-performance-optimization.js)**
   - Comprehensive optimization
   - GC tuning
   - Resource management
   - Production benchmarking

---

## Exercises

Challenging exercises for production mastery:

### Exercise 1: Memory Leak Detection System
**Difficulty:** Hard
**File:** [exercises/exercise-1.js](./exercises/exercise-1.js)

Build a memory leak detection system that:
- Takes periodic heap snapshots
- Analyzes memory trends and patterns
- Detects growing retainer paths
- Alerts on suspicious growth
- Generates diagnostic reports
- Provides remediation suggestions

**Skills practiced:**
- Heap snapshot analysis
- Memory profiling
- Pattern recognition
- Automated monitoring
- Alert systems

---

### Exercise 2: CPU Profiling Dashboard
**Difficulty:** Hard
**File:** [exercises/exercise-2.js](./exercises/exercise-2.js)

Create a CPU profiling system that:
- Profiles running processes on demand
- Generates flame graphs
- Identifies performance bottlenecks
- Tracks performance over time
- Detects performance regressions
- Provides optimization recommendations

**Skills practiced:**
- CPU profiling
- Performance analysis
- Data visualization
- Regression detection
- Optimization strategies

---

### Exercise 3: Production Health Monitor
**Difficulty:** Very Hard
**File:** [exercises/exercise-3.js](./exercises/exercise-3.js)

Implement a comprehensive health monitoring system that:
- Provides liveness and readiness endpoints
- Tracks custom application metrics
- Integrates with distributed tracing
- Implements circuit breakers
- Coordinates graceful degradation
- Reports to APM systems
- Handles partial failures

**Skills practiced:**
- Advanced health checks
- Distributed systems
- Fault tolerance
- APM integration
- Metrics collection

---

### Exercise 4: Secure Process Manager
**Difficulty:** Hard
**File:** [exercises/exercise-4.js](./exercises/exercise-4.js)

Build a secure process management system that:
- Enforces resource limits
- Implements privilege dropping
- Monitors security events
- Provides audit logging
- Handles sensitive data securely
- Implements sandboxing
- Detects and prevents attacks

**Skills practiced:**
- Security hardening
- Resource management
- Audit logging
- Attack prevention
- Compliance

---

### Exercise 5: Zero-Downtime Deployment System
**Difficulty:** Very Hard
**File:** [exercises/exercise-5.js](./exercises/exercise-5.js)

Create a zero-downtime deployment orchestrator that:
- Implements rolling updates
- Drains connections gracefully
- Transfers state between processes
- Coordinates with load balancers
- Implements health-based promotion
- Handles rollback scenarios
- Provides deployment metrics

**Skills practiced:**
- Deployment strategies
- State management
- Load balancer integration
- Rollback handling
- Production orchestration

---

## Solutions

Complete solutions with multiple implementation approaches:

- [Solution 1](./solutions/exercise-1-solution.js) - Memory leak detection system
- [Solution 2](./solutions/exercise-2-solution.js) - CPU profiling dashboard
- [Solution 3](./solutions/exercise-3-solution.js) - Production health monitor
- [Solution 4](./solutions/exercise-4-solution.js) - Secure process manager
- [Solution 5](./solutions/exercise-5-solution.js) - Zero-downtime deployment system

---

## Key Concepts Summary

### Memory Leak Detection

```javascript
const v8 = require('v8');
const fs = require('fs');

class MemoryLeakDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 50; // MB growth
    this.interval = options.interval || 60000; // 1 minute
    this.snapshots = [];
    this.baselineHeap = null;
  }

  start() {
    this.timer = setInterval(() => {
      this.checkMemory();
    }, this.interval);
  }

  checkMemory() {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;

    if (!this.baselineHeap) {
      this.baselineHeap = heapUsedMB;
      return;
    }

    const growth = heapUsedMB - this.baselineHeap;

    if (growth > this.threshold) {
      console.warn(`Memory leak detected: ${growth.toFixed(2)} MB growth`);
      this.takeHeapSnapshot();
      this.analyzeGrowth();
    }

    this.recordSnapshot(heapUsedMB);
  }

  takeHeapSnapshot() {
    const filename = `heap-${Date.now()}.heapsnapshot`;
    v8.writeHeapSnapshot(filename);
    console.log(`Heap snapshot saved: ${filename}`);
    return filename;
  }

  recordSnapshot(heapSize) {
    this.snapshots.push({
      timestamp: Date.now(),
      heapSize
    });

    // Keep last 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }
  }

  analyzeGrowth() {
    if (this.snapshots.length < 10) return;

    const recent = this.snapshots.slice(-10);
    const trend = recent.reduce((sum, s, i, arr) => {
      if (i === 0) return 0;
      return sum + (s.heapSize - arr[i - 1].heapSize);
    }, 0) / 9;

    if (trend > 5) {
      console.error(`Consistent memory growth detected: ${trend.toFixed(2)} MB/interval`);
    }
  }

  stop() {
    clearInterval(this.timer);
  }
}

// Usage
const detector = new MemoryLeakDetector({
  threshold: 100,
  interval: 30000
});
detector.start();
```

### CPU Profiling

```javascript
const { Session } = require('inspector');
const fs = require('fs');

class CPUProfiler {
  constructor() {
    this.session = new Session();
    this.session.connect();
    this.profiling = false;
  }

  async startProfiling() {
    if (this.profiling) {
      throw new Error('Profiling already in progress');
    }

    return new Promise((resolve, reject) => {
      this.session.post('Profiler.enable', (err) => {
        if (err) return reject(err);

        this.session.post('Profiler.start', (err) => {
          if (err) return reject(err);
          this.profiling = true;
          console.log('CPU profiling started');
          resolve();
        });
      });
    });
  }

  async stopProfiling(filename = 'profile.cpuprofile') {
    if (!this.profiling) {
      throw new Error('No profiling in progress');
    }

    return new Promise((resolve, reject) => {
      this.session.post('Profiler.stop', (err, { profile }) => {
        if (err) return reject(err);

        fs.writeFileSync(filename, JSON.stringify(profile));
        this.profiling = false;
        console.log(`CPU profile saved to ${filename}`);

        this.session.post('Profiler.disable');
        resolve(filename);
      });
    });
  }

  async profile(duration = 10000) {
    await this.startProfiling();

    return new Promise((resolve) => {
      setTimeout(async () => {
        const filename = await this.stopProfiling();
        resolve(filename);
      }, duration);
    });
  }
}

// Usage
const profiler = new CPUProfiler();

// Profile for 10 seconds
profiler.profile(10000).then(filename => {
  console.log(`Profile complete: ${filename}`);
  // Analyze with: node --prof-process ${filename}
});
```

### Advanced Health Checks

```javascript
class HealthCheckSystem {
  constructor() {
    this.checks = new Map();
    this.status = 'healthy';
    this.lastCheck = null;
  }

  registerCheck(name, checkFn, options = {}) {
    this.checks.set(name, {
      fn: checkFn,
      critical: options.critical || false,
      timeout: options.timeout || 5000,
      interval: options.interval || 30000
    });
  }

  async runCheck(name, check) {
    const start = Date.now();

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), check.timeout)
      );

      const result = await Promise.race([
        check.fn(),
        timeoutPromise
      ]);

      return {
        name,
        status: result ? 'healthy' : 'unhealthy',
        duration: Date.now() - start,
        critical: check.critical,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        error: error.message,
        duration: Date.now() - start,
        critical: check.critical,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkHealth() {
    const results = await Promise.all(
      Array.from(this.checks.entries()).map(([name, check]) =>
        this.runCheck(name, check)
      )
    );

    const unhealthyCritical = results.filter(
      r => r.status === 'unhealthy' && r.critical
    );

    const unhealthy = results.filter(r => r.status === 'unhealthy');

    this.status = unhealthyCritical.length > 0 ? 'critical' :
                  unhealthy.length > 0 ? 'degraded' : 'healthy';

    this.lastCheck = {
      status: this.status,
      checks: results,
      timestamp: new Date().toISOString()
    };

    return this.lastCheck;
  }

  // Liveness probe - is the process alive?
  async liveness() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  // Readiness probe - can it handle traffic?
  async readiness() {
    const health = await this.checkHealth();
    return {
      ready: health.status !== 'critical',
      status: health.status,
      timestamp: new Date().toISOString()
    };
  }
}

// Usage
const health = new HealthCheckSystem();

// Register checks
health.registerCheck('database', async () => {
  return await db.ping();
}, { critical: true, timeout: 3000 });

health.registerCheck('cache', async () => {
  return await cache.ping();
}, { critical: false });

health.registerCheck('memory', async () => {
  const usage = process.memoryUsage();
  const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
  return heapUsedPercent < 90;
}, { critical: true });

// HTTP endpoints
app.get('/health/live', async (req, res) => {
  const result = await health.liveness();
  res.json(result);
});

app.get('/health/ready', async (req, res) => {
  const result = await health.readiness();
  res.status(result.ready ? 200 : 503).json(result);
});

app.get('/health', async (req, res) => {
  const result = await health.checkHealth();
  const statusCode = result.status === 'healthy' ? 200 :
                      result.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(result);
});
```

### Zero-Downtime Deployment

```javascript
const http = require('http');

class GracefulServer {
  constructor(app, options = {}) {
    this.app = app;
    this.server = null;
    this.connections = new Set();
    this.isShuttingDown = false;
    this.shutdownTimeout = options.shutdownTimeout || 30000;
    this.drainTimeout = options.drainTimeout || 10000;
  }

  start(port) {
    this.server = http.createServer(this.app);

    // Track connections
    this.server.on('connection', (connection) => {
      this.connections.add(connection);

      connection.on('close', () => {
        this.connections.delete(connection);
      });
    });

    // Middleware to reject requests during shutdown
    this.app.use((req, res, next) => {
      if (this.isShuttingDown) {
        res.setHeader('Connection', 'close');
        return res.status(503).json({
          error: 'Server is shutting down'
        });
      }
      next();
    });

    this.server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

    this.setupSignalHandlers();
  }

  setupSignalHandlers() {
    // Graceful shutdown on SIGTERM (Kubernetes, Docker)
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));

    // Graceful shutdown on SIGINT (Ctrl+C)
    process.on('SIGINT', () => this.shutdown('SIGINT'));

    // Graceful restart on SIGUSR2 (nodemon, pm2)
    process.on('SIGUSR2', () => this.shutdown('SIGUSR2'));
  }

  async shutdown(signal) {
    if (this.isShuttingDown) {
      console.log('Shutdown already in progress');
      return;
    }

    console.log(`Received ${signal}, starting graceful shutdown...`);
    this.isShuttingDown = true;

    // Set overall shutdown timeout
    const forceExitTimeout = setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      // Phase 1: Stop accepting new connections
      await this.stopAcceptingConnections();

      // Phase 2: Drain existing connections
      await this.drainConnections();

      // Phase 3: Close server
      await this.closeServer();

      // Phase 4: Cleanup resources
      await this.cleanup();

      clearTimeout(forceExitTimeout);
      console.log('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      clearTimeout(forceExitTimeout);
      process.exit(1);
    }
  }

  stopAcceptingConnections() {
    return new Promise((resolve) => {
      console.log('Stopping new connections...');
      this.server.close(() => {
        console.log('Server stopped accepting connections');
        resolve();
      });
    });
  }

  async drainConnections() {
    console.log(`Draining ${this.connections.size} active connections...`);

    const drainStart = Date.now();

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - drainStart;

        if (this.connections.size === 0) {
          console.log('All connections drained');
          clearInterval(checkInterval);
          resolve();
        } else if (elapsed > this.drainTimeout) {
          console.warn(`Drain timeout, ${this.connections.size} connections remaining`);
          // Force close remaining connections
          this.connections.forEach(conn => conn.destroy());
          clearInterval(checkInterval);
          resolve();
        } else {
          console.log(`Waiting for ${this.connections.size} connections...`);
        }
      }, 1000);
    });
  }

  closeServer() {
    return new Promise((resolve) => {
      console.log('Closing server...');
      this.server.close(() => {
        console.log('Server closed');
        resolve();
      });
    });
  }

  async cleanup() {
    console.log('Cleaning up resources...');

    // Close database connections
    if (global.db) {
      await global.db.close();
      console.log('Database closed');
    }

    // Close cache connections
    if (global.cache) {
      await global.cache.quit();
      console.log('Cache closed');
    }

    // Any other cleanup
    console.log('Cleanup complete');
  }

  healthCheck() {
    return {
      healthy: !this.isShuttingDown,
      connections: this.connections.size,
      uptime: process.uptime()
    };
  }
}

// Usage
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  const health = server.healthCheck();
  res.status(health.healthy ? 200 : 503).json(health);
});

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

const server = new GracefulServer(app, {
  shutdownTimeout: 30000,
  drainTimeout: 10000
});

server.start(3000);
```

---

## Advanced Patterns

### Pattern 1: Self-Healing Process

```javascript
class SelfHealingProcess {
  constructor(options = {}) {
    this.healthThreshold = options.healthThreshold || 3;
    this.failureCount = 0;
    this.restartCount = 0;
    this.maxRestarts = options.maxRestarts || 5;
    this.restartDelay = options.restartDelay || 5000;
  }

  monitor() {
    setInterval(async () => {
      const isHealthy = await this.checkHealth();

      if (!isHealthy) {
        this.failureCount++;
        console.warn(`Health check failed (${this.failureCount}/${this.healthThreshold})`);

        if (this.failureCount >= this.healthThreshold) {
          await this.selfHeal();
        }
      } else {
        this.failureCount = 0;
      }
    }, 10000);
  }

  async checkHealth() {
    try {
      // Check critical systems
      const memoryOk = this.checkMemory();
      const eventLoopOk = await this.checkEventLoop();
      const dependenciesOk = await this.checkDependencies();

      return memoryOk && eventLoopOk && dependenciesOk;
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }

  checkMemory() {
    const usage = process.memoryUsage();
    const heapPercent = (usage.heapUsed / usage.heapTotal) * 100;
    return heapPercent < 90;
  }

  async checkEventLoop() {
    const start = Date.now();
    return new Promise((resolve) => {
      setImmediate(() => {
        const lag = Date.now() - start;
        resolve(lag < 100);
      });
    });
  }

  async checkDependencies() {
    // Check database, cache, etc.
    return true;
  }

  async selfHeal() {
    console.error('Initiating self-healing...');

    if (this.restartCount >= this.maxRestarts) {
      console.error('Max restart limit reached, exiting');
      process.exit(1);
    }

    this.restartCount++;
    this.failureCount = 0;

    // Attempt recovery
    await this.attemptRecovery();

    // If recovery fails, restart process
    setTimeout(() => {
      console.log('Restarting process...');
      process.exit(1); // Let process manager restart
    }, this.restartDelay);
  }

  async attemptRecovery() {
    try {
      // Try to recover without restart
      console.log('Attempting recovery...');

      // Clear caches
      if (global.cache) {
        await global.cache.flushall();
      }

      // Reconnect to database
      if (global.db) {
        await global.db.reconnect();
      }

      console.log('Recovery complete');
    } catch (error) {
      console.error('Recovery failed:', error);
    }
  }
}
```

### Pattern 2: Distributed Process Coordination

```javascript
const EventEmitter = require('events');

class ProcessCoordinator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.processes = new Map();
    this.messageQueue = [];
    this.isLeader = false;
  }

  registerProcess(id, process) {
    this.processes.set(id, {
      process,
      status: 'active',
      lastHeartbeat: Date.now(),
      messageQueue: []
    });

    this.setupProcessHandlers(id, process);
  }

  setupProcessHandlers(id, proc) {
    // Handle messages from process
    proc.on('message', (message) => {
      this.handleMessage(id, message);
    });

    // Handle process exit
    proc.on('exit', (code) => {
      this.handleProcessExit(id, code);
    });

    // Send heartbeat
    setInterval(() => {
      proc.send({ type: 'heartbeat' });
    }, 5000);
  }

  handleMessage(processId, message) {
    switch (message.type) {
      case 'heartbeat_response':
        this.updateHeartbeat(processId);
        break;

      case 'broadcast':
        this.broadcast(message.data, processId);
        break;

      case 'request':
        this.handleRequest(processId, message);
        break;

      default:
        this.emit('message', { processId, message });
    }
  }

  updateHeartbeat(processId) {
    const proc = this.processes.get(processId);
    if (proc) {
      proc.lastHeartbeat = Date.now();
      proc.status = 'active';
    }
  }

  broadcast(data, excludeId = null) {
    this.processes.forEach((proc, id) => {
      if (id !== excludeId && proc.status === 'active') {
        proc.process.send({
          type: 'broadcast',
          data
        });
      }
    });
  }

  handleProcessExit(processId, code) {
    console.log(`Process ${processId} exited with code ${code}`);

    const proc = this.processes.get(processId);
    if (proc) {
      proc.status = 'exited';
      this.emit('process_exit', { processId, code });

      // Restart if needed
      if (code !== 0) {
        this.restartProcess(processId);
      }
    }
  }

  async restartProcess(processId) {
    console.log(`Restarting process ${processId}...`);

    const proc = this.processes.get(processId);
    if (!proc) return;

    // Spawn new process
    const newProcess = await this.spawnProcess();
    this.registerProcess(processId, newProcess);

    console.log(`Process ${processId} restarted`);
  }

  async gracefulShutdown() {
    console.log('Coordinating graceful shutdown...');

    // Notify all processes
    this.broadcast({ type: 'shutdown' });

    // Wait for processes to exit gracefully
    const shutdownPromises = Array.from(this.processes.entries()).map(
      ([id, proc]) => this.waitForProcessExit(id, proc, 30000)
    );

    await Promise.all(shutdownPromises);

    console.log('All processes shut down');
  }

  waitForProcessExit(id, proc, timeout) {
    return new Promise((resolve) => {
      const timeoutHandle = setTimeout(() => {
        console.warn(`Process ${id} timeout, force killing`);
        proc.process.kill('SIGKILL');
        resolve();
      }, timeout);

      proc.process.on('exit', () => {
        clearTimeout(timeoutHandle);
        resolve();
      });
    });
  }
}
```

### Pattern 3: Performance Budget Enforcer

```javascript
class PerformanceBudget {
  constructor(budgets) {
    this.budgets = budgets;
    this.metrics = new Map();
    this.violations = [];
  }

  enforce() {
    setInterval(() => {
      this.checkBudgets();
    }, this.budgets.interval || 10000);
  }

  checkBudgets() {
    const current = this.collectMetrics();

    Object.entries(this.budgets).forEach(([metric, budget]) => {
      if (metric === 'interval') return;

      const value = current[metric];
      if (value > budget.max) {
        this.handleViolation(metric, value, budget.max);
      }
    });
  }

  collectMetrics() {
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage();

    return {
      heapUsedMB: memory.heapUsed / 1024 / 1024,
      rss: memory.rss / 1024 / 1024,
      eventLoopLag: this.measureEventLoopLag(),
      cpuPercent: this.calculateCPUPercent(cpu)
    };
  }

  measureEventLoopLag() {
    const start = Date.now();
    let lag = 0;

    setImmediate(() => {
      lag = Date.now() - start;
    });

    return lag;
  }

  calculateCPUPercent(cpuUsage) {
    // Simplified CPU calculation
    return (cpuUsage.user + cpuUsage.system) / 1000000;
  }

  handleViolation(metric, value, budget) {
    const violation = {
      metric,
      value,
      budget,
      timestamp: Date.now()
    };

    this.violations.push(violation);

    console.error(`Performance budget violated: ${metric} = ${value} (budget: ${budget})`);

    // Take action based on severity
    if (this.budgets[metric].critical) {
      this.takeCriticalAction(violation);
    }
  }

  takeCriticalAction(violation) {
    // Alert monitoring systems
    this.alertMonitoring(violation);

    // Optionally restart process
    if (this.budgets.autoRestart) {
      console.error('Critical budget violation, restarting process');
      process.exit(1);
    }
  }

  alertMonitoring(violation) {
    // Send to monitoring system
    console.error('ALERT:', JSON.stringify(violation));
  }
}

// Usage
const budget = new PerformanceBudget({
  heapUsedMB: { max: 512, critical: true },
  rss: { max: 1024, critical: true },
  eventLoopLag: { max: 100, critical: false },
  cpuPercent: { max: 80, critical: false },
  interval: 10000,
  autoRestart: true
});

budget.enforce();
```

---

## Real-World Case Studies

### Case Study 1: E-commerce Platform Memory Leak

**Problem:**
- Production application experiencing gradual memory growth
- Process crashes after 24-48 hours
- Customer checkout failures during crashes

**Investigation:**
```javascript
// Step 1: Enable heap snapshots
const v8 = require('v8');

setInterval(() => {
  const snapshot = v8.writeHeapSnapshot();
  console.log(`Snapshot: ${snapshot}`);
}, 3600000); // Every hour

// Step 2: Analyze with Chrome DevTools
// - Load snapshots in Chrome DevTools
// - Compare consecutive snapshots
// - Identify growing object counts

// Step 3: Found the issue
// Event listeners not being removed from shopping cart events
```

**Root Cause:**
```javascript
// ❌ Leaking code
class ShoppingCart extends EventEmitter {
  constructor() {
    super();
    this.items = [];
  }

  addItem(item) {
    this.items.push(item);

    // Listener never removed!
    this.on('checkout', () => {
      console.log('Processing', item);
    });
  }
}
```

**Solution:**
```javascript
// ✅ Fixed code
class ShoppingCart extends EventEmitter {
  constructor() {
    super();
    this.items = [];
    this.itemHandlers = new Map();
  }

  addItem(item) {
    this.items.push(item);

    const handler = () => {
      console.log('Processing', item);
    };

    this.itemHandlers.set(item.id, handler);
    this.once('checkout', handler); // Use 'once'
  }

  removeItem(itemId) {
    const index = this.items.findIndex(i => i.id === itemId);
    if (index >= 0) {
      this.items.splice(index, 1);
    }

    const handler = this.itemHandlers.get(itemId);
    if (handler) {
      this.off('checkout', handler);
      this.itemHandlers.delete(itemId);
    }
  }
}
```

**Results:**
- Memory usage stable at ~200MB
- No crashes in 30+ days
- 99.99% uptime achieved

---

### Case Study 2: API Server CPU Bottleneck

**Problem:**
- API response times degrading during peak hours
- CPU usage spiking to 100%
- Customer complaints about slow checkout

**Investigation:**
```javascript
// Step 1: CPU Profiling
const profiler = new CPUProfiler();

app.use((req, res, next) => {
  if (req.headers['x-profile'] === 'true') {
    profiler.startProfiling();

    res.on('finish', async () => {
      await profiler.stopProfiling(`profile-${Date.now()}.cpuprofile`);
    });
  }
  next();
});

// Step 2: Analyze flame graphs
// - Loaded profiles in Chrome DevTools
// - Identified hot path in price calculation
// - 80% of CPU in currency conversion
```

**Root Cause:**
```javascript
// ❌ Inefficient code
function calculatePrice(item) {
  // Called for every item on every request
  const exchangeRates = fetchExchangeRates(); // Synchronous API call!

  return item.basePrice * exchangeRates[item.currency];
}
```

**Solution:**
```javascript
// ✅ Optimized code
class PriceCalculator {
  constructor() {
    this.exchangeRates = {};
    this.lastUpdate = 0;
    this.updateInterval = 300000; // 5 minutes
  }

  async updateRates() {
    const now = Date.now();
    if (now - this.lastUpdate > this.updateInterval) {
      this.exchangeRates = await fetchExchangeRates();
      this.lastUpdate = now;
    }
  }

  calculatePrice(item) {
    // Fast lookup from cache
    return item.basePrice * (this.exchangeRates[item.currency] || 1);
  }
}

// Update rates in background
const calculator = new PriceCalculator();
setInterval(() => calculator.updateRates(), 300000);
```

**Results:**
- Response time reduced from 2000ms to 50ms
- CPU usage dropped from 100% to 20%
- Throughput increased 5x

---

### Case Study 3: Deployment Downtime

**Problem:**
- 30-60 seconds of downtime during deployments
- In-flight requests failing with connection errors
- Customer transaction losses

**Investigation:**
- Kubernetes killing pods immediately
- No graceful shutdown implementation
- Active connections dropped

**Solution:**
```javascript
// Implement zero-downtime deployment
const server = new GracefulServer(app, {
  shutdownTimeout: 30000,
  drainTimeout: 15000
});

server.start(3000);

// Update Kubernetes deployment
/*
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: api
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 10"]
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
      terminationGracePeriodSeconds: 40
*/
```

**Results:**
- Zero-downtime deployments achieved
- No more failed transactions
- Customer satisfaction improved
- Can deploy 10+ times per day safely

---

## Production Checklist

### Pre-Production

Memory Management:
- [ ] Implement heap snapshot automation
- [ ] Set up memory leak detection
- [ ] Configure memory alerts (heap > 80%)
- [ ] Test under sustained load
- [ ] Profile memory usage patterns
- [ ] Set appropriate `--max-old-space-size`

Performance:
- [ ] Profile CPU under realistic load
- [ ] Identify and optimize hot paths
- [ ] Implement caching strategies
- [ ] Configure GC appropriately
- [ ] Set performance budgets
- [ ] Test event loop lag under load

Health & Monitoring:
- [ ] Implement liveness probe
- [ ] Implement readiness probe
- [ ] Set up custom health metrics
- [ ] Integrate with APM system
- [ ] Configure alerting thresholds
- [ ] Test health checks under failure

Security:
- [ ] Drop privileges after startup
- [ ] Implement resource limits
- [ ] Enable security audit logging
- [ ] Validate all inputs
- [ ] Implement rate limiting
- [ ] Secure environment variables
- [ ] Review security headers

Deployment:
- [ ] Implement graceful shutdown
- [ ] Configure shutdown timeouts
- [ ] Test connection draining
- [ ] Implement health-based routing
- [ ] Test rollback procedures
- [ ] Document deployment process
- [ ] Set up deployment metrics

Error Handling:
- [ ] Handle uncaughtException
- [ ] Handle unhandledRejection
- [ ] Implement error reporting
- [ ] Set up error alerts
- [ ] Test error recovery
- [ ] Document exit codes

### Production Operations

- [ ] Monitor memory trends daily
- [ ] Review performance metrics weekly
- [ ] Analyze CPU profiles monthly
- [ ] Test failover procedures quarterly
- [ ] Review security logs weekly
- [ ] Update dependencies monthly
- [ ] Conduct load tests quarterly
- [ ] Review and update runbooks

---

## Common Production Pitfalls

### Pitfall 1: Ignoring Memory Trends

```javascript
// ❌ Wrong - no memory monitoring
function processData(data) {
  cache.set(data.id, data); // Cache grows forever!
}

// ✅ Correct - bounded cache with monitoring
const LRU = require('lru-cache');

const cache = new LRU({
  max: 1000,
  maxAge: 3600000,
  updateAgeOnGet: true
});

// Monitor cache size
setInterval(() => {
  const size = cache.length;
  if (size > 800) {
    console.warn(`Cache size: ${size}/1000`);
  }
}, 60000);
```

### Pitfall 2: Synchronous Operations in Hot Path

```javascript
// ❌ Wrong - blocking operation
app.get('/users/:id', (req, res) => {
  const data = fs.readFileSync(`./users/${req.params.id}.json`);
  res.json(JSON.parse(data));
});

// ✅ Correct - async with caching
const userCache = new LRU({ max: 100 });

app.get('/users/:id', async (req, res) => {
  const cached = userCache.get(req.params.id);
  if (cached) return res.json(cached);

  const data = await fs.promises.readFile(`./users/${req.params.id}.json`);
  const user = JSON.parse(data);
  userCache.set(req.params.id, user);
  res.json(user);
});
```

### Pitfall 3: Not Testing Graceful Shutdown

```javascript
// ❌ Wrong - untested shutdown
process.on('SIGTERM', () => {
  db.close(); // Hope it works!
  process.exit(0);
});

// ✅ Correct - tested, comprehensive shutdown
async function gracefulShutdown(signal) {
  console.log(`Received ${signal}`);

  try {
    // Stop accepting connections
    await new Promise(resolve => server.close(resolve));

    // Wait for in-flight requests (with timeout)
    await Promise.race([
      waitForActiveRequests(),
      timeout(10000)
    ]);

    // Close connections
    await db.close();
    await cache.quit();

    console.log('Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Shutdown error:', error);
    process.exit(1);
  }
}

// Test graceful shutdown
if (process.env.NODE_ENV === 'test') {
  describe('Graceful Shutdown', () => {
    it('should close all connections', async () => {
      // Send SIGTERM
      process.emit('SIGTERM');

      // Wait and verify
      await delay(100);
      assert(server.listening === false);
      assert(db.isConnected === false);
    });
  });
}
```

### Pitfall 4: Missing Health Check Dependencies

```javascript
// ❌ Wrong - incomplete health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ✅ Correct - comprehensive checks
app.get('/health', async (req, res) => {
  const checks = await Promise.all([
    checkDatabase(),
    checkCache(),
    checkMessageQueue(),
    checkDiskSpace(),
    checkMemory()
  ]);

  const allHealthy = checks.every(c => c.healthy);

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
});
```

### Pitfall 5: Over-Optimizing Prematurely

```javascript
// ❌ Wrong - complex optimization without measuring
const memoized = new Map();
function calculate(input) {
  const key = JSON.stringify(input);
  if (memoized.has(key)) return memoized.get(key);

  const result = /* simple calculation */;
  memoized.set(key, result);
  return result;
}

// ✅ Correct - measure first, then optimize
const { performance } = require('perf_hooks');

function calculate(input) {
  const start = performance.now();
  const result = /* calculation */;
  const duration = performance.now() - start;

  if (duration > 10) {
    console.warn(`Slow calculation: ${duration}ms`);
  }

  return result;
}

// Only add caching if measurements show it's needed
```

---

## Practice Projects

### Project 1: Enterprise Health Monitoring System

Build a comprehensive monitoring system that:
- Monitors multiple Node.js services
- Collects custom application metrics
- Implements liveness and readiness probes
- Integrates with Prometheus/Grafana
- Provides real-time dashboards
- Alerts on anomalies
- Tracks SLIs/SLOs

**Difficulty:** Very Hard
**Duration:** 2-3 days

---

### Project 2: Zero-Downtime Deployment Orchestrator

Create a deployment system that:
- Orchestrates rolling updates
- Implements blue-green deployments
- Supports canary releases
- Handles state transfer
- Integrates with load balancers
- Provides automated rollback
- Tracks deployment metrics

**Difficulty:** Very Hard
**Duration:** 3-4 days

---

### Project 3: Production Debugger Toolkit

Build debugging tools that:
- Capture heap snapshots on demand
- Generate CPU profiles remotely
- Analyze memory leaks automatically
- Track performance regressions
- Correlate logs with traces
- Generate diagnostic reports
- Provide remediation suggestions

**Difficulty:** Hard
**Duration:** 2-3 days

---

### Project 4: Self-Healing Process Manager

Create a process manager that:
- Monitors process health continuously
- Detects and diagnoses issues
- Attempts automatic recovery
- Restarts on critical failures
- Implements circuit breakers
- Coordinates distributed processes
- Provides observability

**Difficulty:** Very Hard
**Duration:** 3-4 days

---

## Testing Strategies

### Load Testing

```javascript
// Use autocannon or similar
const autocannon = require('autocannon');

async function loadTest() {
  const result = await autocannon({
    url: 'http://localhost:3000',
    connections: 100,
    duration: 60,
    pipelining: 10
  });

  console.log(result);

  // Check performance metrics
  assert(result.requests.average > 1000, 'Throughput too low');
  assert(result.latency.p99 < 100, 'P99 latency too high');
}
```

### Memory Leak Testing

```javascript
// Monitor memory during extended operation
async function memoryLeakTest() {
  const baseline = process.memoryUsage().heapUsed;

  // Run operations
  for (let i = 0; i < 10000; i++) {
    await performOperation();
  }

  // Force GC if available
  if (global.gc) {
    global.gc();
  }

  await new Promise(resolve => setTimeout(resolve, 1000));

  const final = process.memoryUsage().heapUsed;
  const growth = (final - baseline) / 1024 / 1024;

  assert(growth < 10, `Memory leak detected: ${growth.toFixed(2)} MB`);
}

// Run with: node --expose-gc test.js
```

### Shutdown Testing

```javascript
// Test graceful shutdown
async function shutdownTest() {
  const { spawn } = require('child_process');

  const proc = spawn('node', ['server.js']);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send SIGTERM
  proc.kill('SIGTERM');

  // Wait for graceful exit
  const exitCode = await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      proc.kill('SIGKILL');
      resolve(-1);
    }, 5000);

    proc.on('exit', (code) => {
      clearTimeout(timeout);
      resolve(code);
    });
  });

  assert.strictEqual(exitCode, 0, 'Process did not exit gracefully');
}
```

---

## Performance Metrics

### Key Metrics to Track

```javascript
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      latency: [],
      memory: [],
      cpu: [],
      eventLoopLag: []
    };
  }

  recordRequest(duration) {
    this.metrics.requests++;
    this.metrics.latency.push(duration);
    this.trimArray(this.metrics.latency, 1000);
  }

  recordError() {
    this.metrics.errors++;
  }

  collectSystemMetrics() {
    setInterval(() => {
      const memory = process.memoryUsage();
      const cpu = process.cpuUsage();

      this.metrics.memory.push({
        timestamp: Date.now(),
        heapUsed: memory.heapUsed,
        rss: memory.rss
      });

      this.metrics.cpu.push({
        timestamp: Date.now(),
        user: cpu.user,
        system: cpu.system
      });

      this.trimArray(this.metrics.memory, 100);
      this.trimArray(this.metrics.cpu, 100);

      this.measureEventLoopLag();
    }, 10000);
  }

  measureEventLoopLag() {
    const start = Date.now();
    setImmediate(() => {
      const lag = Date.now() - start;
      this.metrics.eventLoopLag.push({
        timestamp: Date.now(),
        lag
      });
      this.trimArray(this.metrics.eventLoopLag, 100);
    });
  }

  trimArray(arr, maxLength) {
    while (arr.length > maxLength) {
      arr.shift();
    }
  }

  getStats() {
    return {
      requests: {
        total: this.metrics.requests,
        errorsPercentage: (this.metrics.errors / this.metrics.requests) * 100
      },
      latency: {
        p50: this.percentile(this.metrics.latency, 50),
        p95: this.percentile(this.metrics.latency, 95),
        p99: this.percentile(this.metrics.latency, 99)
      },
      memory: {
        current: this.metrics.memory[this.metrics.memory.length - 1],
        trend: this.calculateTrend(this.metrics.memory, 'heapUsed')
      },
      eventLoopLag: {
        current: this.metrics.eventLoopLag[this.metrics.eventLoopLag.length - 1],
        average: this.average(this.metrics.eventLoopLag, 'lag')
      }
    };
  }

  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  average(arr, key) {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((acc, item) => acc + item[key], 0);
    return sum / arr.length;
  }

  calculateTrend(arr, key) {
    if (arr.length < 2) return 0;
    const first = arr[0][key];
    const last = arr[arr.length - 1][key];
    return ((last - first) / first) * 100;
  }
}
```

---

## Success Criteria

You've mastered advanced process management if you can:

- [ ] Detect and fix memory leaks in production
- [ ] Profile and optimize CPU-intensive operations
- [ ] Build comprehensive health monitoring systems
- [ ] Implement secure, hardened processes
- [ ] Debug production issues efficiently
- [ ] Deploy with zero downtime
- [ ] Build fault-tolerant IPC systems
- [ ] Optimize for production workloads
- [ ] Design self-healing architectures
- [ ] Handle all failure scenarios gracefully

---

## Additional Resources

### Official Documentation
- [Node.js Performance Guide](https://nodejs.org/en/docs/guides/simple-profiling/)
- [V8 Memory Management](https://v8.dev/blog/trash-talk)
- [Inspector Protocol](https://nodejs.org/api/inspector.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Tools
- Chrome DevTools for heap analysis
- Clinic.js for performance profiling
- 0x for flame graphs
- autocannon for load testing
- pm2 for process management

### Related Modules
- Level 1: Process Basics
- Level 2: Process Intermediate
- Module 7: Child Process
- Module 8: Cluster
- Module 9: Worker Threads

---

## Next Steps

After completing this level:

1. Apply these patterns to production applications
2. Set up comprehensive monitoring for your services
3. Implement zero-downtime deployments
4. Contribute to open-source process management tools
5. Mentor others on production Node.js practices
6. Explore advanced topics like:
   - Multi-region deployments
   - Chaos engineering
   - Advanced observability
   - Site Reliability Engineering (SRE)

---

**Congratulations!** You've mastered advanced process management in Node.js. You now have the knowledge and skills to build, deploy, and maintain production-grade applications at scale!
