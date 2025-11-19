# Graceful Shutdown Strategies in Node.js

## Introduction

Graceful shutdown is the process of terminating an application in a controlled manner, ensuring all resources are properly cleaned up, in-flight operations are completed, and data integrity is maintained. This comprehensive guide explores proven strategies for implementing graceful shutdowns in Node.js applications, from simple web servers to complex distributed systems.

By the end of this guide, you'll understand how to build applications that shut down cleanly, prevent data loss, maintain service availability during deployments, and integrate seamlessly with modern orchestration platforms.

---

## What Problem Does Graceful Shutdown Solve?

### The Challenge

When applications terminate abruptly without proper cleanup:

**Data Problems:**
- Database transactions are left incomplete
- Files are corrupted or partially written
- Message queue acknowledgments are lost
- Cache state becomes inconsistent
- User sessions are lost

**Service Problems:**
- Active HTTP requests return errors
- WebSocket connections drop without warning
- gRPC streams are interrupted
- Database connection pools leak
- File descriptors remain open

**Operational Problems:**
- Load balancers route traffic to dead instances
- Deployment rollbacks fail
- Health checks show false positives
- Monitoring systems miss the shutdown
- Logs are lost before being flushed

**Without graceful shutdown:**
```javascript
// Server just stops abruptly
http.createServer(handler).listen(3000);

// When process is killed:
// - Active requests get connection reset errors
// - Database writes are incomplete
// - Files are left in inconsistent state
// - Metrics are not flushed
// - Users see 502/503 errors
```

### The Solution

Implement a comprehensive graceful shutdown strategy:

```javascript
// Graceful shutdown flow
async function gracefulShutdown() {
  // 1. Stop accepting new connections
  // 2. Wait for in-flight requests to complete
  // 3. Close database connections
  // 4. Flush logs and metrics
  // 5. Exit cleanly
}

process.on('SIGTERM', gracefulShutdown);
```

---

## Real-World Analogies

### Analogy 1: Restaurant Closing Time

**Your Node.js application is like a restaurant:**

1. **Stop accepting new customers** → Stop accepting new HTTP connections
2. **Finish serving current customers** → Complete in-flight requests
3. **Clear the tables** → Close database connections
4. **Clean the kitchen** → Flush logs and metrics
5. **Count the cash register** → Save application state
6. **Turn off the lights** → Exit process

### Analogy 2: Airplane Landing

**Graceful shutdown is like landing an airplane:**

1. **Announce landing** → Signal shutdown initiated
2. **Refuse boarding** → Stop accepting new connections
3. **Secure cabin** → Prevent new operations
4. **Complete descent** → Finish in-flight work
5. **Touch down smoothly** → Close resources gracefully
6. **Taxi to gate** → Final cleanup
7. **Disembark passengers** → Release all resources
8. **Park and power down** → Process exit

### Analogy 3: Theater Performance

**Your application is like a theater show:**

- **House lights dim** → Health check fails (signal to load balancer)
- **Stop selling tickets** → Stop accepting new requests
- **Show continues** → Complete current requests
- **Final bow** → Cleanup resources
- **Audience exits** → Close all connections
- **Lights off** → Process terminates

---

## Mental Model: Shutdown Phases

### Visualization

```
Time →

┌─────────────────────────────────────────────────────────────┐
│ Phase 1: SIGNAL RECEIVED                                    │
│ • SIGTERM/SIGINT arrives                                    │
│ • Set shutdown flag                                         │
│ • Log shutdown initiated                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: HEALTH CHECK FAILURE                               │
│ • Mark instance as unhealthy                                │
│ • /health endpoint returns 503                              │
│ • Load balancer stops routing new traffic                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: STOP ACCEPTING NEW WORK                            │
│ • Server.close() - stop accepting connections               │
│ • Queue.pause() - stop consuming messages                   │
│ • Cron.stop() - stop scheduled jobs                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: DRAIN IN-FLIGHT WORK                               │
│ • Wait for active HTTP requests                             │
│ • Complete active database transactions                     │
│ • Finish processing current messages                        │
│ • Timeout after grace period                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 5: CLOSE CONNECTIONS                                  │
│ • Close database connection pools                           │
│ • Disconnect from Redis/caches                              │
│ • Close message queue connections                           │
│ • Close WebSocket connections                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 6: FLUSH BUFFERS                                      │
│ • Flush log buffers                                         │
│ • Send remaining metrics                                    │
│ • Save application state                                    │
│ • Sync file descriptors                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 7: FINAL CLEANUP                                      │
│ • Cancel timers and intervals                               │
│ • Remove event listeners                                    │
│ • Release memory                                            │
│ • Log shutdown complete                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
                  process.exit(0)
```

---

## Basic Graceful Shutdown Strategies

### Strategy 1: HTTP Server Shutdown

```javascript
// http-server-shutdown.js
const http = require('http');

class GracefulServer {
  constructor() {
    this.server = null;
    this.connections = new Set();
    this.shuttingDown = false;
  }

  start() {
    this.server = http.createServer((req, res) => {
      // Check if shutting down
      if (this.shuttingDown) {
        res.setHeader('Connection', 'close');
        res.statusCode = 503;
        res.end('Server is shutting down');
        return;
      }

      this.handleRequest(req, res);
    });

    // Track connections
    this.server.on('connection', (conn) => {
      this.connections.add(conn);

      conn.on('close', () => {
        this.connections.delete(conn);
      });
    });

    this.server.listen(3000, () => {
      console.log('Server listening on port 3000');
    });

    this.setupShutdownHandlers();
  }

  setupShutdownHandlers() {
    ['SIGTERM', 'SIGINT'].forEach(signal => {
      process.on(signal, () => {
        console.log(`${signal} received`);
        this.gracefulShutdown();
      });
    });
  }

  async gracefulShutdown() {
    if (this.shuttingDown) {
      console.log('Shutdown already in progress');
      return;
    }

    this.shuttingDown = true;
    console.log('Starting graceful shutdown');

    // Stop accepting new connections
    this.server.close(() => {
      console.log('Server stopped accepting connections');
    });

    // Wait for existing connections to close (with timeout)
    await this.waitForConnections(10000);

    console.log('Graceful shutdown complete');
    process.exit(0);
  }

  async waitForConnections(timeout) {
    const startTime = Date.now();

    while (this.connections.size > 0) {
      if (Date.now() - startTime > timeout) {
        console.warn(
          `Timeout: ${this.connections.size} connections still active`
        );

        // Force close remaining connections
        this.connections.forEach(conn => conn.destroy());
        break;
      }

      console.log(`Waiting for ${this.connections.size} connections`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  handleRequest(req, res) {
    // Your request handling logic
    res.end('Hello World');
  }
}

const server = new GracefulServer();
server.start();
```

**When to use:**
- Simple HTTP/HTTPS servers
- REST APIs
- Basic web applications

**Limitations:**
- Doesn't handle long-polling or streaming requests well
- No database cleanup
- No metric flushing

### Strategy 2: Express Server with Connection Draining

```javascript
// express-graceful-shutdown.js
const express = require('express');

class ExpressGracefulServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.activeRequests = new Map();
    this.shuttingDown = false;
    this.requestIdCounter = 0;
  }

  setup() {
    // Track active requests
    this.app.use((req, res, next) => {
      if (this.shuttingDown) {
        res.status(503).send('Server shutting down');
        return;
      }

      const requestId = ++this.requestIdCounter;
      this.activeRequests.set(requestId, { req, res, startTime: Date.now() });

      const cleanup = () => {
        this.activeRequests.delete(requestId);
      };

      res.on('finish', cleanup);
      res.on('close', cleanup);

      next();
    });

    // Your routes
    this.app.get('/', (req, res) => {
      res.send('Hello World');
    });

    this.app.get('/slow', async (req, res) => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      res.send('Slow response');
    });
  }

  start() {
    this.setup();

    this.server = this.app.listen(3000, () => {
      console.log('Express server listening on port 3000');
    });

    this.setupShutdownHandlers();
  }

  setupShutdownHandlers() {
    ['SIGTERM', 'SIGINT'].forEach(signal => {
      process.on(signal, () => this.gracefulShutdown());
    });
  }

  async gracefulShutdown() {
    if (this.shuttingDown) return;
    this.shuttingDown = true;

    console.log('Starting graceful shutdown');

    // Stop accepting new connections
    this.server.close(() => {
      console.log('Server closed');
    });

    // Wait for active requests
    await this.drainRequests(15000);

    console.log('All requests completed');
    process.exit(0);
  }

  async drainRequests(timeout) {
    const startTime = Date.now();

    while (this.activeRequests.size > 0) {
      if (Date.now() - startTime > timeout) {
        console.warn(
          `Timeout: ${this.activeRequests.size} requests still active`
        );

        // Log which requests are still pending
        this.activeRequests.forEach((req, id) => {
          const duration = Date.now() - req.startTime;
          console.warn(`Request ${id}: ${req.req.url} (${duration}ms)`);
        });

        break;
      }

      console.log(`Waiting for ${this.activeRequests.size} requests`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  getStatus() {
    return {
      shuttingDown: this.shuttingDown,
      activeRequests: this.activeRequests.size,
      requests: Array.from(this.activeRequests.entries()).map(([id, req]) => ({
        id,
        url: req.req.url,
        duration: Date.now() - req.startTime,
      })),
    };
  }
}

const server = new ExpressGracefulServer();
server.start();
```

### Strategy 3: Multi-Resource Cleanup

```javascript
// multi-resource-shutdown.js
class ApplicationShutdown {
  constructor(dependencies) {
    this.server = dependencies.server;
    this.database = dependencies.database;
    this.redis = dependencies.redis;
    this.queue = dependencies.queue;
    this.logger = dependencies.logger;

    this.shuttingDown = false;
    this.setupHandlers();
  }

  setupHandlers() {
    ['SIGTERM', 'SIGINT'].forEach(signal => {
      process.on(signal, () => this.gracefulShutdown(signal));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (err) => {
      console.error('Uncaught exception:', err);
      await this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', async (reason) => {
      console.error('Unhandled rejection:', reason);
      await this.gracefulShutdown('unhandledRejection');
    });
  }

  async gracefulShutdown(reason) {
    if (this.shuttingDown) return;
    this.shuttingDown = true;

    console.log(`Graceful shutdown initiated (${reason})`);
    const startTime = Date.now();

    try {
      // Phase 1: Stop accepting new work
      await this.stopAcceptingWork();

      // Phase 2: Complete in-flight work
      await this.completeInflightWork();

      // Phase 3: Close connections
      await this.closeConnections();

      // Phase 4: Flush buffers
      await this.flushBuffers();

      const duration = Date.now() - startTime;
      console.log(`Shutdown completed successfully in ${duration}ms`);
      process.exit(0);
    } catch (error) {
      console.error('Shutdown error:', error);
      process.exit(1);
    }
  }

  async stopAcceptingWork() {
    console.log('Phase 1: Stopping new work');

    // Stop HTTP server from accepting connections
    await new Promise((resolve) => {
      this.server.close(resolve);
    });

    // Stop consuming from queue
    if (this.queue) {
      await this.queue.pause();
    }

    console.log('Stopped accepting new work');
  }

  async completeInflightWork() {
    console.log('Phase 2: Completing in-flight work');

    // Wait for active requests (implementation specific)
    await this.waitForActiveRequests(10000);

    // Wait for queue messages being processed
    if (this.queue) {
      await this.queue.waitForIdle(10000);
    }

    console.log('In-flight work completed');
  }

  async closeConnections() {
    console.log('Phase 3: Closing connections');

    const closePromises = [];

    // Close database connections
    if (this.database) {
      closePromises.push(
        this.database.end().catch(err => {
          console.error('Database close error:', err);
        })
      );
    }

    // Close Redis connections
    if (this.redis) {
      closePromises.push(
        this.redis.quit().catch(err => {
          console.error('Redis close error:', err);
        })
      );
    }

    // Close queue connections
    if (this.queue) {
      closePromises.push(
        this.queue.close().catch(err => {
          console.error('Queue close error:', err);
        })
      );
    }

    await Promise.all(closePromises);
    console.log('All connections closed');
  }

  async flushBuffers() {
    console.log('Phase 4: Flushing buffers');

    if (this.logger) {
      await this.logger.flush();
    }

    // Flush stdout/stderr
    await new Promise(resolve => process.stdout.write('', resolve));
    await new Promise(resolve => process.stderr.write('', resolve));

    console.log('Buffers flushed');
  }

  async waitForActiveRequests(timeout) {
    // Implementation depends on your request tracking
    // See ExpressGracefulServer example
  }
}

// Usage
const app = new ApplicationShutdown({
  server: httpServer,
  database: dbConnection,
  redis: redisClient,
  queue: messageQueue,
  logger: logger,
});
```

---

## Advanced Graceful Shutdown Strategies

### Strategy 4: State Persistence Shutdown

```javascript
// stateful-shutdown.js
const fs = require('fs').promises;

class StatefulShutdown {
  constructor(stateFile = './app-state.json') {
    this.stateFile = stateFile;
    this.state = {
      activeJobs: new Map(),
      pendingOperations: new Map(),
      userSessions: new Map(),
    };

    this.setupHandlers();
  }

  async gracefulShutdown() {
    console.log('Starting stateful shutdown');

    try {
      // 1. Stop accepting new work
      await this.stopNewWork();

      // 2. Save current state
      await this.saveState();

      // 3. Complete or defer work
      await this.handleInFlightWork();

      // 4. Cleanup
      await this.cleanup();

      console.log('Stateful shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Shutdown error:', error);
      await this.emergencySaveState();
      process.exit(1);
    }
  }

  async saveState() {
    console.log('Saving application state');

    const state = {
      timestamp: new Date().toISOString(),
      activeJobs: Array.from(this.state.activeJobs.entries()),
      pendingOperations: Array.from(this.state.pendingOperations.entries()),
      userSessions: Array.from(this.state.userSessions.entries()),
    };

    await fs.writeFile(
      this.stateFile,
      JSON.stringify(state, null, 2),
      'utf8'
    );

    console.log(`State saved to ${this.stateFile}`);
  }

  async loadState() {
    try {
      const data = await fs.readFile(this.stateFile, 'utf8');
      const state = JSON.parse(data);

      this.state.activeJobs = new Map(state.activeJobs);
      this.state.pendingOperations = new Map(state.pendingOperations);
      this.state.userSessions = new Map(state.userSessions);

      console.log('State restored from', this.stateFile);
      return true;
    } catch (error) {
      console.log('No previous state found');
      return false;
    }
  }

  async handleInFlightWork() {
    console.log('Handling in-flight work');

    // For each active job, decide: complete or defer
    for (const [jobId, job] of this.state.activeJobs) {
      const remaining = job.estimatedTime - job.elapsed;

      if (remaining < 5000) {
        // Complete if less than 5 seconds remaining
        await this.completeJob(jobId);
      } else {
        // Defer if more than 5 seconds
        await this.deferJob(jobId);
      }
    }
  }

  async completeJob(jobId) {
    console.log(`Completing job ${jobId}`);
    const job = this.state.activeJobs.get(jobId);
    // Complete the job
    await job.complete();
    this.state.activeJobs.delete(jobId);
  }

  async deferJob(jobId) {
    console.log(`Deferring job ${jobId}`);
    const job = this.state.activeJobs.get(jobId);
    // Return job to queue for next instance
    await this.queue.push(job);
    this.state.activeJobs.delete(jobId);
  }

  async emergencySaveState() {
    try {
      const emergencyFile = `${this.stateFile}.emergency`;
      await this.saveState();
      console.log(`Emergency state saved to ${emergencyFile}`);
    } catch (error) {
      console.error('Emergency save failed:', error);
    }
  }

  setupHandlers() {
    ['SIGTERM', 'SIGINT'].forEach(signal => {
      process.on(signal, () => this.gracefulShutdown());
    });
  }

  async stopNewWork() {
    // Implementation
  }

  async cleanup() {
    // Implementation
  }
}
```

### Strategy 5: Coordinated Cluster Shutdown

```javascript
// cluster-shutdown.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  // Master process
  class MasterShutdown {
    constructor() {
      this.workers = new Map();
      this.shuttingDown = false;
      this.setupHandlers();
      this.forkWorkers();
    }

    forkWorkers() {
      const numWorkers = os.cpus().length;

      for (let i = 0; i < numWorkers; i++) {
        this.forkWorker();
      }
    }

    forkWorker() {
      const worker = cluster.fork();

      this.workers.set(worker.id, {
        worker,
        status: 'running',
        startTime: Date.now(),
      });

      worker.on('message', (msg) => {
        this.handleWorkerMessage(worker.id, msg);
      });

      worker.on('exit', (code, signal) => {
        console.log(`Worker ${worker.id} exited (${code}/${signal})`);
        this.workers.delete(worker.id);

        // Restart unless shutting down
        if (!this.shuttingDown) {
          this.forkWorker();
        }
      });
    }

    handleWorkerMessage(workerId, msg) {
      if (msg.type === 'shutdown-complete') {
        const workerInfo = this.workers.get(workerId);
        if (workerInfo) {
          workerInfo.status = 'shutdown-complete';
        }
      }
    }

    setupHandlers() {
      ['SIGTERM', 'SIGINT'].forEach(signal => {
        process.on(signal, () => this.gracefulShutdown(signal));
      });
    }

    async gracefulShutdown(signal) {
      if (this.shuttingDown) return;
      this.shuttingDown = true;

      console.log(`Master received ${signal}, shutting down workers`);

      // Send shutdown signal to all workers
      this.workers.forEach(({ worker }) => {
        worker.send({ type: 'shutdown' });
      });

      // Wait for workers to shutdown
      await this.waitForWorkers(15000);

      // Force kill any remaining workers
      this.workers.forEach(({ worker }) => {
        if (!worker.isDead()) {
          console.warn(`Force killing worker ${worker.id}`);
          worker.kill('SIGKILL');
        }
      });

      console.log('Master shutdown complete');
      process.exit(0);
    }

    async waitForWorkers(timeout) {
      const startTime = Date.now();

      while (this.workers.size > 0) {
        if (Date.now() - startTime > timeout) {
          console.warn(`Timeout: ${this.workers.size} workers still running`);
          break;
        }

        console.log(`Waiting for ${this.workers.size} workers`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  new MasterShutdown();

} else {
  // Worker process
  class WorkerShutdown {
    constructor() {
      this.server = null;
      this.setupHandlers();
      this.startServer();
    }

    setupHandlers() {
      // Handle shutdown message from master
      process.on('message', async (msg) => {
        if (msg.type === 'shutdown') {
          await this.gracefulShutdown();
        }
      });

      // Also handle signals directly
      ['SIGTERM', 'SIGINT'].forEach(signal => {
        process.on(signal, () => this.gracefulShutdown());
      });
    }

    startServer() {
      const http = require('http');
      this.server = http.createServer((req, res) => {
        res.end(`Worker ${process.pid}`);
      });

      this.server.listen(3000, () => {
        console.log(`Worker ${process.pid} started`);
      });
    }

    async gracefulShutdown() {
      console.log(`Worker ${process.pid} shutting down`);

      // Close server
      await new Promise((resolve) => {
        this.server.close(resolve);
      });

      // Notify master
      process.send({ type: 'shutdown-complete' });

      console.log(`Worker ${process.pid} shutdown complete`);
      process.exit(0);
    }
  }

  new WorkerShutdown();
}
```

### Strategy 6: Database Transaction Handling

```javascript
// transaction-aware-shutdown.js
class TransactionAwareShutdown {
  constructor(database) {
    this.database = database;
    this.activeTransactions = new Map();
    this.shuttingDown = false;
    this.setupHandlers();
  }

  setupHandlers() {
    ['SIGTERM', 'SIGINT'].forEach(signal => {
      process.on(signal, () => this.gracefulShutdown());
    });
  }

  // Track transaction lifecycle
  async beginTransaction(txId) {
    if (this.shuttingDown) {
      throw new Error('Cannot start transaction during shutdown');
    }

    const tx = await this.database.transaction();

    this.activeTransactions.set(txId, {
      transaction: tx,
      startTime: Date.now(),
      operations: [],
    });

    return tx;
  }

  async commitTransaction(txId) {
    const txInfo = this.activeTransactions.get(txId);
    if (!txInfo) {
      throw new Error(`Transaction ${txId} not found`);
    }

    await txInfo.transaction.commit();
    this.activeTransactions.delete(txId);
  }

  async rollbackTransaction(txId) {
    const txInfo = this.activeTransactions.get(txId);
    if (!txInfo) return;

    await txInfo.transaction.rollback();
    this.activeTransactions.delete(txId);
  }

  async gracefulShutdown() {
    if (this.shuttingDown) return;
    this.shuttingDown = true;

    console.log('Starting transaction-aware shutdown');

    // 1. Prevent new transactions
    console.log('Preventing new transactions');

    // 2. Wait for active transactions
    await this.waitForTransactions(30000);

    // 3. Rollback any remaining transactions
    await this.rollbackRemainingTransactions();

    // 4. Close database
    await this.database.end();

    console.log('Transaction-aware shutdown complete');
    process.exit(0);
  }

  async waitForTransactions(timeout) {
    const startTime = Date.now();

    while (this.activeTransactions.size > 0) {
      if (Date.now() - startTime > timeout) {
        console.warn(
          `Timeout: ${this.activeTransactions.size} transactions still active`
        );
        break;
      }

      console.log(`Waiting for ${this.activeTransactions.size} transactions`);

      // Log long-running transactions
      this.activeTransactions.forEach((tx, id) => {
        const duration = Date.now() - tx.startTime;
        if (duration > 10000) {
          console.warn(`Long transaction ${id}: ${duration}ms`);
        }
      });

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  async rollbackRemainingTransactions() {
    console.log('Rolling back remaining transactions');

    const rollbacks = Array.from(this.activeTransactions.entries()).map(
      async ([txId, txInfo]) => {
        try {
          console.log(`Rolling back transaction ${txId}`);
          await txInfo.transaction.rollback();
        } catch (error) {
          console.error(`Rollback failed for ${txId}:`, error);
        }
      }
    );

    await Promise.all(rollbacks);
    this.activeTransactions.clear();
  }

  getStatus() {
    return {
      shuttingDown: this.shuttingDown,
      activeTransactions: this.activeTransactions.size,
      transactions: Array.from(this.activeTransactions.entries()).map(
        ([id, tx]) => ({
          id,
          duration: Date.now() - tx.startTime,
          operations: tx.operations.length,
        })
      ),
    };
  }
}

// Usage
const shutdown = new TransactionAwareShutdown(database);

// In your code
async function updateUser(userId, data) {
  const txId = `tx-${Date.now()}`;
  const tx = await shutdown.beginTransaction(txId);

  try {
    await tx.query('UPDATE users SET ...', [userId, data]);
    await shutdown.commitTransaction(txId);
  } catch (error) {
    await shutdown.rollbackTransaction(txId);
    throw error;
  }
}
```

---

## Container and Orchestrator Strategies

### Strategy 7: Kubernetes Graceful Shutdown

```javascript
// kubernetes-aware-shutdown.js
const express = require('express');

class KubernetesGracefulShutdown {
  constructor(options = {}) {
    this.app = express();
    this.server = null;

    // Kubernetes configuration
    this.terminationGracePeriod = options.terminationGracePeriod || 30; // seconds
    this.preStopHookDelay = options.preStopHookDelay || 5; // seconds
    this.drainTimeout = options.drainTimeout || 20; // seconds

    this.ready = false;
    this.healthy = true;
    this.shuttingDown = false;

    this.setupRoutes();
    this.setupHandlers();
  }

  setupRoutes() {
    // Liveness probe - is the app running?
    this.app.get('/healthz', (req, res) => {
      if (this.healthy) {
        res.status(200).json({ status: 'healthy' });
      } else {
        res.status(503).json({ status: 'unhealthy' });
      }
    });

    // Readiness probe - can the app accept traffic?
    this.app.get('/ready', (req, res) => {
      if (this.ready && !this.shuttingDown) {
        res.status(200).json({ status: 'ready' });
      } else {
        res.status(503).json({ status: 'not ready' });
      }
    });

    // Your application routes
    this.app.get('/', (req, res) => {
      res.send('Hello from Kubernetes!');
    });
  }

  setupHandlers() {
    process.on('SIGTERM', () => this.gracefulShutdown());
  }

  async start() {
    this.server = this.app.listen(3000, () => {
      console.log('Server started on port 3000');
      this.ready = true;
      this.healthy = true;
    });
  }

  async gracefulShutdown() {
    if (this.shuttingDown) return;
    this.shuttingDown = true;

    console.log('Kubernetes graceful shutdown initiated');
    const startTime = Date.now();

    try {
      // Step 1: Fail readiness probe immediately
      // This tells Kubernetes to stop sending new traffic
      this.ready = false;
      console.log('Readiness probe failed');

      // Step 2: Wait for Kubernetes to update endpoints
      // During this time:
      // - kube-proxy updates iptables rules
      // - Ingress controllers stop routing traffic
      // - Service mesh updates routing tables
      console.log(`Waiting ${this.preStopHookDelay}s for endpoint removal`);
      await this.sleep(this.preStopHookDelay * 1000);

      // Step 3: Stop accepting new connections
      console.log('Closing server');
      await new Promise((resolve) => {
        this.server.close(resolve);
      });

      // Step 4: Drain existing connections
      console.log('Draining connections');
      await this.drainConnections(this.drainTimeout * 1000);

      // Step 5: Cleanup resources
      console.log('Cleaning up resources');
      await this.cleanup();

      const duration = (Date.now() - startTime) / 1000;
      console.log(`Shutdown completed in ${duration}s`);
      process.exit(0);

    } catch (error) {
      console.error('Shutdown error:', error);
      process.exit(1);
    }
  }

  async drainConnections(timeout) {
    // Implementation depends on your tracking mechanism
    const startTime = Date.now();

    while (this.hasActiveConnections()) {
      if (Date.now() - startTime > timeout) {
        console.warn('Drain timeout reached');
        break;
      }

      await this.sleep(100);
    }
  }

  hasActiveConnections() {
    // Implement connection tracking
    return false;
  }

  async cleanup() {
    // Close databases, caches, etc.
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const app = new KubernetesGracefulShutdown({
  terminationGracePeriod: 30,
  preStopHookDelay: 10,
  drainTimeout: 15,
});

app.start();

// Kubernetes Pod specification:
/*
apiVersion: v1
kind: Pod
metadata:
  name: node-app
spec:
  containers:
  - name: app
    image: node-app:latest
    ports:
    - containerPort: 3000

    # Liveness probe - restart if unhealthy
    livenessProbe:
      httpGet:
        path: /healthz
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
      failureThreshold: 3

    # Readiness probe - remove from service if not ready
    readinessProbe:
      httpGet:
        path: /ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 2
      failureThreshold: 1

    # Optional: preStop hook
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 5"]

  # Give pod 30 seconds to shutdown
  terminationGracePeriodSeconds: 30
*/
```

### Strategy 8: Zero-Downtime Rolling Updates

```javascript
// zero-downtime-update.js
class ZeroDowntimeShutdown {
  constructor() {
    this.connections = new Set();
    this.requests = new Map();
    this.acceptingConnections = true;
    this.setupHandlers();
  }

  setupHandlers() {
    process.on('SIGTERM', () => this.rollingUpdate());
  }

  async rollingUpdate() {
    console.log('Starting zero-downtime rolling update');

    // Phase 1: Stop accepting NEW connections
    // But keep existing connections alive
    this.acceptingConnections = false;
    console.log('Stopped accepting new connections');

    // Phase 2: Wait for new instances to be ready
    // (Kubernetes will start them before stopping this one)
    await this.sleep(10000);

    // Phase 3: Drain existing connections gracefully
    await this.drainExistingConnections(20000);

    // Phase 4: Force close any remaining connections
    this.closeRemainingConnections();

    // Phase 5: Final cleanup
    await this.cleanup();

    console.log('Rolling update complete');
    process.exit(0);
  }

  middleware() {
    return (req, res, next) => {
      if (!this.acceptingConnections) {
        // Send Connection: close header to tell client not to reuse
        res.setHeader('Connection', 'close');

        // Optionally send 503 for new connections
        if (this.shouldRejectNew(req)) {
          res.status(503).send('Service temporarily unavailable');
          return;
        }
      }

      const requestId = this.generateRequestId();
      this.requests.set(requestId, {
        req,
        res,
        startTime: Date.now(),
      });

      const cleanup = () => {
        this.requests.delete(requestId);
      };

      res.on('finish', cleanup);
      res.on('close', cleanup);

      next();
    };
  }

  shouldRejectNew(req) {
    // Allow health check requests even during shutdown
    if (req.path === '/healthz' || req.path === '/ready') {
      return false;
    }

    // Reject other new requests
    return true;
  }

  async drainExistingConnections(timeout) {
    const startTime = Date.now();

    console.log(`Draining ${this.requests.size} active requests`);

    while (this.requests.size > 0) {
      if (Date.now() - startTime > timeout) {
        console.warn(`Drain timeout: ${this.requests.size} requests remaining`);
        break;
      }

      // Log progress every 2 seconds
      if ((Date.now() - startTime) % 2000 < 100) {
        console.log(`Still waiting for ${this.requests.size} requests`);
      }

      await this.sleep(100);
    }

    console.log('Connection drain complete');
  }

  closeRemainingConnections() {
    if (this.requests.size > 0) {
      console.log(`Force closing ${this.requests.size} connections`);

      this.requests.forEach(({ res }) => {
        try {
          res.socket.destroy();
        } catch (error) {
          console.error('Error closing connection:', error);
        }
      });

      this.requests.clear();
    }
  }

  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async cleanup() {
    // Additional cleanup
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Best Practices

### 1. Implement Health Checks

```javascript
// GOOD: Separate liveness and readiness
app.get('/healthz', (req, res) => {
  // Liveness - is process alive?
  res.status(200).json({ status: 'alive' });
});

app.get('/ready', (req, res) => {
  // Readiness - can accept traffic?
  if (shuttingDown || !databaseConnected) {
    res.status(503).json({ status: 'not ready' });
  } else {
    res.status(200).json({ status: 'ready' });
  }
});

// BAD: Single health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
```

### 2. Set Appropriate Timeouts

```javascript
// GOOD: Coordinated timeouts
const SHUTDOWN_TIMEOUT = 30000;  // 30s total
const DRAIN_TIMEOUT = 20000;     // 20s for drain
const CLEANUP_TIMEOUT = 8000;    // 8s for cleanup

// BAD: No timeouts
await drainConnections(); // Could hang forever
```

### 3. Log Shutdown Progress

```javascript
// GOOD: Detailed logging
async function gracefulShutdown() {
  console.log('Shutdown started', { timestamp: new Date().toISOString() });
  console.log('Phase 1: Stopping new connections');
  await stopNew();
  console.log('Phase 2: Draining connections');
  await drain();
  console.log('Phase 3: Cleanup complete');
  console.log('Shutdown finished');
}

// BAD: Silent shutdown
async function gracefulShutdown() {
  await stopNew();
  await drain();
  process.exit(0);
}
```

### 4. Handle Shutdown Errors

```javascript
// GOOD: Error handling
async function gracefulShutdown() {
  try {
    await cleanup();
    process.exit(0);
  } catch (error) {
    console.error('Shutdown error:', error);
    await emergencyCleanup();
    process.exit(1);
  }
}

// BAD: No error handling
async function gracefulShutdown() {
  await cleanup();
  process.exit(0);
}
```

### 5. Test Shutdown Behavior

```javascript
// Integration test for shutdown
test('gracefully shuts down', async () => {
  const server = startServer();

  // Start a long request
  const request = fetch('http://localhost:3000/slow');

  // Send SIGTERM
  process.kill(server.pid, 'SIGTERM');

  // Request should complete
  const response = await request;
  expect(response.status).toBe(200);

  // Server should exit cleanly
  const { code } = await waitForExit(server);
  expect(code).toBe(0);
});
```

---

## Common Pitfalls

### Pitfall 1: Not Waiting for Async Operations

```javascript
// PROBLEM
process.on('SIGTERM', () => {
  database.close(); // Async but not awaited
  process.exit(0);  // Exits immediately!
});

// SOLUTION
process.on('SIGTERM', async () => {
  await database.close();
  process.exit(0);
});
```

### Pitfall 2: No Shutdown Timeout

```javascript
// PROBLEM: Could hang forever
await waitForRequests();

// SOLUTION: Always have timeout
await waitForRequests(10000);
```

### Pitfall 3: Killing Active Connections Too Soon

```javascript
// PROBLEM: Kills connections immediately
server.close();
process.exit(0);

// SOLUTION: Wait for connections to finish
server.close();
await waitForConnections(10000);
process.exit(0);
```

### Pitfall 4: Not Coordinating with Load Balancer

```javascript
// PROBLEM: LB still sends traffic
server.close();

// SOLUTION: Fail health check first
healthCheck.fail();
await sleep(10000); // Wait for LB
server.close();
```

---

## Summary

### Key Strategies

1. **HTTP Server Shutdown** - Basic server.close() pattern
2. **Connection Draining** - Wait for active requests
3. **Multi-Resource Cleanup** - Database, cache, queues
4. **State Persistence** - Save state before shutdown
5. **Cluster Coordination** - Master-worker shutdown
6. **Transaction Handling** - Complete or rollback transactions
7. **Kubernetes Integration** - Probes and grace periods
8. **Zero-Downtime Updates** - Rolling updates without drops

### Shutdown Checklist

- [ ] Handle SIGTERM and SIGINT signals
- [ ] Implement shutdown timeout
- [ ] Prevent duplicate shutdown attempts
- [ ] Fail health/readiness checks immediately
- [ ] Stop accepting new connections
- [ ] Wait for load balancer endpoint removal
- [ ] Drain existing connections (with timeout)
- [ ] Complete or rollback database transactions
- [ ] Close database connection pools
- [ ] Close cache connections
- [ ] Flush logs and metrics
- [ ] Save application state if needed
- [ ] Set appropriate exit code
- [ ] Test shutdown in all environments

### Next Steps

1. Implement basic graceful shutdown
2. Add request/connection tracking
3. Integrate with your infrastructure
4. Test with load testing tools
5. Monitor shutdown metrics
6. Proceed to [Resource Monitoring Guide](./03-resource-monitoring.md)

---

## Quick Reference

```javascript
// Basic pattern
process.on('SIGTERM', async () => {
  // 1. Stop new work
  server.close();

  // 2. Complete existing work
  await waitForRequests(10000);

  // 3. Close connections
  await db.end();
  await redis.quit();

  // 4. Flush buffers
  await logger.flush();

  // 5. Exit
  process.exit(0);
});

// With timeout
const timeout = setTimeout(() => {
  console.error('Shutdown timeout');
  process.exit(1);
}, 30000);

await gracefulShutdown();
clearTimeout(timeout);

// Kubernetes-friendly
readinessProbe.fail();
await sleep(10000);
await shutdown();
```

Ready to monitor your application's resources? Continue to [Resource Monitoring Guide](./03-resource-monitoring.md)!
