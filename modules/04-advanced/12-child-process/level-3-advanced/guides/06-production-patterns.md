# Production Patterns

Learn best practices for deploying, operating, and maintaining process managers in production environments.

## Table of Contents
- [Deployment Strategies](#deployment-strategies)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [Monitoring](#monitoring)
- [Zero-Downtime Updates](#zero-downtime-updates)
- [Operational Procedures](#operational-procedures)

---

## Deployment Strategies

### Blue-Green Deployment

```javascript
class BlueGreenDeployment {
  constructor() {
    this.activePool = null;
    this.standbyPool = null;
  }

  async deploy(newWorkerPath) {
    // Create new pool (green)
    console.log('Creating standby pool...');
    this.standbyPool = new ProcessPool({
      workerPath: newWorkerPath,
      size: 4
    });

    await this.standbyPool.initialize();

    // Warm up standby pool
    await this.warmup(this.standbyPool);

    // Health check standby pool
    const healthy = await this.healthCheck(this.standbyPool);
    if (!healthy) {
      await this.standbyPool.shutdown();
      throw new Error('Standby pool unhealthy');
    }

    // Switch traffic (blue -> green)
    console.log('Switching to new pool...');
    const oldPool = this.activePool;
    this.activePool = this.standbyPool;
    this.standbyPool = null;

    // Gracefully shutdown old pool
    if (oldPool) {
      await oldPool.shutdown();
    }

    console.log('Deployment complete');
  }

  async warmup(pool) {
    // Send warmup requests
    const warmupTasks = Array(10).fill(0).map((_, i) => ({
      type: 'warmup',
      value: i
    }));

    await Promise.all(
      warmupTasks.map(task => pool.execute(task))
    );
  }

  async healthCheck(pool) {
    try {
      const results = await Promise.all(
        pool.workers.map(w => this.checkWorker(w))
      );
      return results.every(r => r === true);
    } catch (error) {
      return false;
    }
  }
}
```

### Rolling Deployment

```javascript
class RollingDeployment {
  async deploy(pool, newWorkerPath) {
    const workers = [...pool.workers];

    // Replace workers one at a time
    for (const oldWorker of workers) {
      console.log(`Replacing worker ${oldWorker.id}...`);

      // Create new worker
      const newWorker = await pool.createWorker(oldWorker.id, newWorkerPath);

      // Wait for new worker to be ready
      await this.waitForReady(newWorker);

      // Gracefully shutdown old worker
      await this.shutdownWorker(oldWorker);

      // Wait before next replacement
      await this.delay(5000);
    }

    console.log('Rolling deployment complete');
  }

  async waitForReady(worker) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker startup timeout'));
      }, 30000);

      const handler = (msg) => {
        if (msg.type === 'ready') {
          clearTimeout(timeout);
          worker.removeListener('message', handler);
          resolve();
        }
      };

      worker.on('message', handler);
    });
  }

  async shutdownWorker(worker) {
    // Send shutdown signal
    worker.send({ type: 'shutdown' });

    // Wait for graceful exit
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        worker.kill('SIGKILL');
        resolve();
      }, 10000);

      worker.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Error Handling

### Comprehensive Error Strategy

```javascript
class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.errorLog = [];
  }

  handleError(error, context) {
    // Log error with full context
    this.logError(error, context);

    // Track error frequency
    this.trackError(error);

    // Classify error
    const severity = this.classifyError(error);

    // Take appropriate action
    switch (severity) {
      case 'critical':
        this.handleCritical(error, context);
        break;
      case 'error':
        this.handleError(error, context);
        break;
      case 'warning':
        this.handleWarning(error, context);
        break;
    }

    // Emit error event
    this.emit('error', { error, context, severity });
  }

  classifyError(error) {
    if (error.code === 'ECONNRESET') return 'warning';
    if (error.code === 'ETIMEDOUT') return 'warning';
    if (error.message.includes('out of memory')) return 'critical';
    if (error.code === 'ENOSPC') return 'critical';
    return 'error';
  }

  handleCritical(error, context) {
    // Critical errors require immediate attention
    console.error('CRITICAL ERROR:', error.message);

    // Alert administrators
    this.sendAlert('critical', error, context);

    // Attempt recovery
    this.attemptRecovery(error, context);
  }

  logError(error, context) {
    const entry = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      context
    };

    this.errorLog.push(entry);

    // Write to error log file
    const fs = require('fs');
    fs.appendFileSync(
      'errors.log',
      JSON.stringify(entry) + '\n'
    );
  }

  trackError(error) {
    const key = `${error.code}:${error.message}`;
    const count = (this.errorCounts.get(key) || 0) + 1;
    this.errorCounts.set(key, count);

    // Alert if error frequency too high
    if (count > 10) {
      console.warn(`High error frequency: ${key} (${count} times)`);
    }
  }
}
```

### Circuit Breaker for Resilience

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = 'CLOSED';
    this.failures = 0;
    this.nextRetry = null;
    this.stats = {
      successes: 0,
      failures: 0,
      timeouts: 0,
      circuitOpened: 0
    };
  }

  async execute(fn, timeout = 5000) {
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextRetry) {
        this.state = 'HALF_OPEN';
        console.log('Circuit breaker: HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        this.timeoutPromise(timeout)
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.stats.successes++;

    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      console.log('Circuit breaker: CLOSED');
    }
  }

  onFailure(error) {
    this.failures++;
    this.stats.failures++;

    if (error.message === 'Timeout') {
      this.stats.timeouts++;
    }

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextRetry = Date.now() + this.resetTimeout;
      this.stats.circuitOpened++;
      console.log('Circuit breaker: OPEN');
    }
  }

  timeoutPromise(ms) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    );
  }

  getStats() {
    return {
      ...this.stats,
      state: this.state,
      failures: this.failures
    };
  }
}
```

---

## Logging

### Structured Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'process-manager',
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console for development
    new winston.transports.Console({
      format: winston.format.simple()
    }),

    // File for production
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'combined.log'
    })
  ]
});

// Usage
logger.info('Worker started', {
  workerId: 1,
  pid: worker.pid,
  poolSize: 4
});

logger.error('Task failed', {
  taskId: 123,
  error: error.message,
  stack: error.stack,
  workerId: worker.id
});
```

### Log Correlation

```javascript
class CorrelatedLogger {
  constructor(baseLogger) {
    this.baseLogger = baseLogger;
  }

  child(correlationId) {
    return {
      info: (msg, meta = {}) => {
        this.baseLogger.info(msg, {
          ...meta,
          correlationId
        });
      },
      error: (msg, meta = {}) => {
        this.baseLogger.error(msg, {
          ...meta,
          correlationId
        });
      },
      warn: (msg, meta = {}) => {
        this.baseLogger.warn(msg, {
          ...meta,
          correlationId
        });
      }
    };
  }

  generateCorrelationId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage
const correlationId = logger.generateCorrelationId();
const taskLogger = logger.child(correlationId);

taskLogger.info('Task started', { taskId: 123 });
taskLogger.info('Task processing', { progress: 50 });
taskLogger.info('Task completed', { result: 'success' });
```

---

## Monitoring

### Health Endpoints

```javascript
const http = require('http');

class HealthServer {
  constructor(manager, port = 8080) {
    this.manager = manager;
    this.port = port;
    this.server = null;
  }

  start() {
    this.server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${this.port}`);

      switch (url.pathname) {
        case '/health':
          this.handleHealth(req, res);
          break;
        case '/metrics':
          this.handleMetrics(req, res);
          break;
        case '/ready':
          this.handleReady(req, res);
          break;
        default:
          res.writeHead(404);
          res.end('Not Found');
      }
    });

    this.server.listen(this.port);
    console.log(`Health server listening on port ${this.port}`);
  }

  handleHealth(req, res) {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health));
  }

  handleMetrics(req, res) {
    const metrics = this.manager.getMetrics();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(metrics, null, 2));
  }

  handleReady(req, res) {
    const ready = this.manager.isReady();

    if (ready) {
      res.writeHead(200);
      res.end('OK');
    } else {
      res.writeHead(503);
      res.end('Not Ready');
    }
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}
```

---

## Zero-Downtime Updates

### Graceful Worker Replacement

```javascript
class GracefulUpdater {
  async updateWorker(pool, oldWorker, newWorkerPath) {
    // Create new worker
    const newWorker = await pool.createWorker(
      oldWorker.id,
      newWorkerPath
    );

    // Wait for new worker to be ready
    await this.waitReady(newWorker);

    // Stop sending new tasks to old worker
    oldWorker.accepting = false;

    // Wait for old worker to finish current tasks
    await this.waitIdle(oldWorker, 30000);

    // Gracefully shutdown old worker
    await this.shutdown(oldWorker);

    // Start using new worker
    newWorker.accepting = true;

    return newWorker;
  }

  async waitReady(worker) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker ready timeout'));
      }, 30000);

      const handler = (msg) => {
        if (msg.type === 'ready') {
          clearTimeout(timeout);
          worker.removeListener('message', handler);
          resolve();
        }
      };

      worker.on('message', handler);
    });
  }

  async waitIdle(worker, timeout) {
    const start = Date.now();

    while (worker.currentTask !== null) {
      if (Date.now() - start > timeout) {
        throw new Error('Wait idle timeout');
      }
      await this.delay(100);
    }
  }

  async shutdown(worker) {
    worker.send({ type: 'shutdown' });

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        worker.kill('SIGKILL');
        resolve();
      }, 5000);

      worker.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Operational Procedures

### Startup Checklist

```javascript
class StartupProcedure {
  async execute() {
    console.log('=== Starting Process Manager ===');

    // 1. Check environment
    await this.checkEnvironment();

    // 2. Load configuration
    const config = await this.loadConfiguration();

    // 3. Initialize logging
    await this.initializeLogging(config);

    // 4. Create process manager
    const manager = new ProcessManager(config);

    // 5. Initialize worker pool
    await manager.initialize();

    // 6. Start health monitoring
    await this.startHealthMonitoring(manager);

    // 7. Start health server
    await this.startHealthServer(manager);

    // 8. Register signal handlers
    this.registerSignalHandlers(manager);

    console.log('=== Startup Complete ===');

    return manager;
  }

  async checkEnvironment() {
    const required = ['NODE_ENV', 'WORKER_SCRIPT'];

    for (const varName of required) {
      if (!process.env[varName]) {
        throw new Error(`Missing environment variable: ${varName}`);
      }
    }
  }

  registerSignalHandlers(manager) {
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await manager.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      await manager.shutdown();
      process.exit(0);
    });
  }
}
```

### Shutdown Procedure

```javascript
class ShutdownProcedure {
  async execute(manager) {
    console.log('=== Graceful Shutdown ===');

    // 1. Stop accepting new tasks
    manager.stopAcceptingTasks();

    // 2. Wait for pending tasks (with timeout)
    await this.waitForPendingTasks(manager, 30000);

    // 3. Shutdown workers
    await manager.shutdownWorkers();

    // 4. Stop health monitoring
    manager.stopHealthMonitoring();

    // 5. Close health server
    manager.healthServer.stop();

    // 6. Flush logs
    await this.flushLogs();

    // 7. Clean up resources
    await this.cleanup(manager);

    console.log('=== Shutdown Complete ===');
  }

  async waitForPendingTasks(manager, timeout) {
    const start = Date.now();

    while (manager.hasPendingTasks()) {
      if (Date.now() - start > timeout) {
        console.warn('Shutdown timeout, forcing termination');
        return;
      }

      await this.delay(100);
    }
  }

  async flushLogs() {
    // Ensure all logs are written
    if (logger.close) {
      await new Promise(resolve => logger.close(resolve));
    }
  }
}
```

---

## Best Practices Summary

### Production Checklist

- [ ] **Graceful Shutdown** - Handle SIGTERM/SIGINT
- [ ] **Health Endpoints** - /health, /ready, /metrics
- [ ] **Structured Logging** - JSON format with correlation IDs
- [ ] **Error Handling** - Classify and handle appropriately
- [ ] **Circuit Breakers** - Prevent cascading failures
- [ ] **Monitoring** - Comprehensive metrics
- [ ] **Zero-Downtime Deploys** - Rolling or blue-green
- [ ] **Resource Limits** - Memory, CPU, time limits
- [ ] **Security** - Input validation, sandboxing
- [ ] **Documentation** - Runbooks and procedures

### Deployment Strategy Matrix

| Strategy | Downtime | Risk | Complexity | Rollback |
|----------|----------|------|------------|----------|
| Blue-Green | None | Low | Medium | Fast |
| Rolling | None | Medium | Low | Slow |
| Canary | None | Low | High | Fast |
| Recreate | Yes | High | Low | Slow |

---

**Congratulations!** You've completed the advanced child process guides. You now have the knowledge to build production-ready process management systems.
