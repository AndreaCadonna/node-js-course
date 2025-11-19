# Signal Handling Patterns in Node.js

## Introduction

Signal handling is a critical aspect of building production-ready Node.js applications. Signals are the operating system's way of communicating with your process, enabling graceful shutdowns, configuration reloads, and proper resource cleanup. This comprehensive guide explores production-grade signal handling patterns, from basic concepts to advanced multi-service orchestration.

By the end of this guide, you'll understand how to build robust applications that respond gracefully to system signals, handle edge cases, and maintain data integrity during shutdown scenarios.

---

## What Problem Does Signal Handling Solve?

### The Challenge

In production environments, your Node.js application needs to:
- Respond to deployment systems (Kubernetes, Docker, systemd)
- Handle graceful shutdowns during updates
- Clean up resources (database connections, file handles, network sockets)
- Complete in-flight requests before terminating
- Prevent data corruption during shutdown
- Respond to administrator commands (reload config, dump state)
- Coordinate with process managers and orchestrators

**Without proper signal handling:**
```javascript
// Application just runs without any signal handlers
const server = http.createServer(handler);
server.listen(3000);

// Problem: When Docker sends SIGTERM:
// - Server immediately kills all connections
// - In-flight requests are lost
// - Database transactions are incomplete
// - File writes are corrupted
// - Resources leak
```

### The Solution

Implement comprehensive signal handling to gracefully manage process lifecycle:

```javascript
// Graceful shutdown with signal handling
const signals = ['SIGTERM', 'SIGINT', 'SIGHUP'];

signals.forEach(signal => {
  process.on(signal, async () => {
    console.log(`Received ${signal}, starting graceful shutdown`);
    await gracefulShutdown();
  });
});

async function gracefulShutdown() {
  // Stop accepting new requests
  server.close();

  // Complete in-flight requests
  await waitForRequests();

  // Close database connections
  await db.close();

  // Exit cleanly
  process.exit(0);
}
```

---

## Understanding Unix Signals

### What Are Signals?

Signals are **asynchronous notifications** sent to a process by the operating system or other processes. Think of them as text messages from the OS to your application.

### Real-World Analogy: The Production Stage Manager

**Your Node.js app is like a theater performance:**

- **SIGTERM** → Stage manager: "Show's over, please wrap up gracefully"
- **SIGINT** → Audience member pressing Ctrl+C: "I want to leave now"
- **SIGKILL** → Fire alarm: "Everyone out NOW!" (can't be caught)
- **SIGHUP** → Director: "Reload your script, there are changes"
- **SIGUSR1** → Technical director: "Show me your stats" (custom handler)
- **SIGUSR2** → Stage manager: "Switch to different mode"

### Common Signals Reference

```javascript
// Termination Signals
SIGTERM  // Graceful termination request (default for `kill`)
SIGINT   // Interrupt from terminal (Ctrl+C)
SIGQUIT  // Quit from terminal (Ctrl+\), creates core dump
SIGKILL  // Force kill (cannot be caught or ignored)

// Hangup Signal
SIGHUP   // Terminal hangup (reload config by convention)

// User-Defined Signals
SIGUSR1  // User-defined signal 1 (often: heap dump, profiling)
SIGUSR2  // User-defined signal 2 (custom actions)

// Stop/Continue Signals
SIGSTOP  // Stop process (cannot be caught)
SIGCONT  // Continue if stopped
SIGTSTP  // Stop from terminal (Ctrl+Z)

// Other Signals
SIGPIPE  // Broken pipe (write to closed socket)
SIGCHLD  // Child process terminated
SIGALRM  // Timer expired
```

### Signal Behavior in Node.js

```javascript
// Node.js signal handling characteristics
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  // Node.js default: exit(0) if no handler
  // With handler: YOU control behavior
});

// Multiple signals, same handler
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, handleShutdown);
});

// Signals that CANNOT be caught
// SIGKILL - Force kill
// SIGSTOP - Force stop
// These immediately terminate the process
```

---

## Mental Model: Signal Handling Architecture

### Visualization

```
┌─────────────────────────────────────────────────┐
│                Operating System                 │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Signal Sources                          │  │
│  │  • Container orchestrator (SIGTERM)      │  │
│  │  • Terminal (SIGINT from Ctrl+C)         │  │
│  │  • Administrator (kill command)          │  │
│  │  • Process manager (SIGHUP)              │  │
│  └──────────┬───────────────────────────────┘  │
│             │                                   │
│             ↓ (Signal Delivery)                 │
│  ┌──────────────────────────────────────────┐  │
│  │     Node.js Process                      │  │
│  │                                          │  │
│  │  ┌────────────────────────────────────┐ │  │
│  │  │  Event Loop                        │ │  │
│  │  │  (Processing async operations)     │ │  │
│  │  └────────┬───────────────────────────┘ │  │
│  │           │                              │  │
│  │           ↓ (Signal arrives)             │  │
│  │  ┌────────────────────────────────────┐ │  │
│  │  │  Signal Event Handler              │ │  │
│  │  │  process.on('SIGTERM', ...)        │ │  │
│  │  └────────┬───────────────────────────┘ │  │
│  │           │                              │  │
│  │           ↓                              │  │
│  │  ┌────────────────────────────────────┐ │  │
│  │  │  Graceful Shutdown Logic           │ │  │
│  │  │  • Stop accepting connections      │ │  │
│  │  │  • Complete in-flight requests     │ │  │
│  │  │  • Close database connections      │ │  │
│  │  │  • Flush logs                      │ │  │
│  │  │  • Release resources               │ │  │
│  │  └────────┬───────────────────────────┘ │  │
│  │           │                              │  │
│  │           ↓                              │  │
│  │      process.exit(0)                    │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### How Signal Flow Works

1. **Signal Source** sends signal to process (e.g., `kill -TERM 1234`)
2. **OS** delivers signal to Node.js process
3. **Node.js** queues signal event in event loop
4. **Event handler** executes on next tick
5. **Cleanup logic** runs asynchronously
6. **Process exits** when cleanup completes

---

## Basic Signal Handling Patterns

### Pattern 1: Single Signal Handler

```javascript
// Basic SIGTERM handler for graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});
```

**When to use:**
- Simple applications with single server
- Development environments
- Learning and prototyping

**Limitations:**
- Doesn't handle multiple signals
- No database cleanup
- No request draining

### Pattern 2: Multi-Signal Handler

```javascript
// Handle multiple termination signals
const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGQUIT'];

SHUTDOWN_SIGNALS.forEach(signal => {
  process.on(signal, () => {
    console.log(`${signal} received, starting shutdown`);
    gracefulShutdown(signal);
  });
});

function gracefulShutdown(signal) {
  console.log(`Shutting down due to ${signal}`);

  // Prevent multiple simultaneous shutdowns
  if (shuttingDown) {
    console.log('Shutdown already in progress');
    return;
  }
  shuttingDown = true;

  // Your cleanup logic here
  server.close(() => {
    process.exit(0);
  });
}

let shuttingDown = false;
```

**When to use:**
- Production applications
- Container deployments (Docker, Kubernetes)
- Applications with process managers

**Benefits:**
- Handles terminal interrupts (SIGINT)
- Handles container termination (SIGTERM)
- Prevents duplicate shutdown attempts

### Pattern 3: Async Cleanup Handler

```javascript
// Handle asynchronous cleanup operations
const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT'];

SHUTDOWN_SIGNALS.forEach(signal => {
  process.on(signal, async () => {
    console.log(`${signal} received`);
    await gracefulShutdown();
  });
});

async function gracefulShutdown() {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log('Starting graceful shutdown');

  try {
    // Close HTTP server (stop accepting new connections)
    await new Promise((resolve) => {
      server.close(resolve);
    });
    console.log('HTTP server closed');

    // Wait for in-flight requests to complete
    await waitForActiveRequests();
    console.log('All requests completed');

    // Close database connections
    await database.disconnect();
    console.log('Database disconnected');

    // Close Redis connections
    await redis.quit();
    console.log('Redis connection closed');

    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

let shuttingDown = false;
```

**When to use:**
- Applications with async cleanup (database, cache, queues)
- Microservices
- Production environments

**Benefits:**
- Properly awaits async operations
- Cleans up multiple resources in sequence
- Error handling during shutdown

---

## Production-Grade Signal Handling

### Pattern 4: Comprehensive Shutdown Manager

```javascript
// shutdown-manager.js
class ShutdownManager {
  constructor(options = {}) {
    this.shuttingDown = false;
    this.shutdownTimeout = options.timeout || 30000; // 30 seconds default
    this.cleanupTasks = [];
    this.signals = options.signals || ['SIGTERM', 'SIGINT', 'SIGQUIT'];

    this.setupSignalHandlers();
  }

  // Register a cleanup task
  register(name, cleanupFn, options = {}) {
    this.cleanupTasks.push({
      name,
      cleanup: cleanupFn,
      timeout: options.timeout || 5000,
      critical: options.critical !== false, // Critical by default
    });
  }

  // Setup signal handlers
  setupSignalHandlers() {
    this.signals.forEach(signal => {
      process.on(signal, () => {
        console.log(`Received ${signal}`);
        this.shutdown(signal);
      });
    });
  }

  // Main shutdown method
  async shutdown(reason) {
    if (this.shuttingDown) {
      console.log('Shutdown already in progress');
      return;
    }

    this.shuttingDown = true;
    const startTime = Date.now();

    console.log(`Starting graceful shutdown (reason: ${reason})`);

    // Set a hard timeout for entire shutdown
    const forceExitTimer = setTimeout(() => {
      console.error(`Shutdown timeout after ${this.shutdownTimeout}ms, forcing exit`);
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      // Run cleanup tasks in reverse order (LIFO - Last In, First Out)
      const tasks = [...this.cleanupTasks].reverse();

      for (const task of tasks) {
        try {
          console.log(`Cleaning up: ${task.name}`);

          // Run cleanup with timeout
          await this.runWithTimeout(
            task.cleanup(),
            task.timeout,
            task.name
          );

          console.log(`✓ ${task.name} completed`);
        } catch (error) {
          console.error(`✗ ${task.name} failed:`, error.message);

          // If critical task fails, consider it a failed shutdown
          if (task.critical) {
            throw error;
          }
        }
      }

      const duration = Date.now() - startTime;
      console.log(`Graceful shutdown completed in ${duration}ms`);

      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (error) {
      console.error('Shutdown failed:', error);
      clearTimeout(forceExitTimer);
      process.exit(1);
    }
  }

  // Run a promise with timeout
  async runWithTimeout(promise, timeout, taskName) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${taskName} timeout after ${timeout}ms`));
        }, timeout);
      }),
    ]);
  }
}

// Usage example
const shutdownManager = new ShutdownManager({
  timeout: 30000,
  signals: ['SIGTERM', 'SIGINT', 'SIGQUIT'],
});

// Register cleanup tasks
shutdownManager.register('http-server', async () => {
  await new Promise(resolve => server.close(resolve));
}, { timeout: 10000, critical: true });

shutdownManager.register('database', async () => {
  await db.disconnect();
}, { timeout: 5000, critical: true });

shutdownManager.register('redis', async () => {
  await redis.quit();
}, { timeout: 3000, critical: false });

shutdownManager.register('flush-logs', async () => {
  await logger.flush();
}, { timeout: 2000, critical: false });

module.exports = shutdownManager;
```

**Features:**
- Task registration with priorities
- Individual task timeouts
- Global shutdown timeout
- Critical vs non-critical tasks
- Reverse order execution (LIFO)
- Comprehensive error handling

### Pattern 5: Request Draining

```javascript
// request-tracker.js
class RequestTracker {
  constructor() {
    this.activeRequests = new Set();
    this.acceptingRequests = true;
  }

  // Middleware to track requests
  middleware() {
    return (req, res, next) => {
      if (!this.acceptingRequests) {
        // Send 503 Service Unavailable
        res.status(503).send('Server is shutting down');
        return;
      }

      const requestId = `${Date.now()}-${Math.random()}`;
      this.activeRequests.add(requestId);

      // Remove from tracking when response finishes
      const cleanup = () => {
        this.activeRequests.delete(requestId);
      };

      res.on('finish', cleanup);
      res.on('close', cleanup);

      next();
    };
  }

  // Stop accepting new requests
  stopAccepting() {
    this.acceptingRequests = false;
  }

  // Wait for all active requests to complete
  async waitForCompletion(timeout = 10000) {
    const startTime = Date.now();

    while (this.activeRequests.size > 0) {
      if (Date.now() - startTime > timeout) {
        throw new Error(
          `Timeout: ${this.activeRequests.size} requests still active`
        );
      }

      console.log(`Waiting for ${this.activeRequests.size} active requests`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('All requests completed');
  }

  // Get current status
  getStatus() {
    return {
      activeRequests: this.activeRequests.size,
      acceptingRequests: this.acceptingRequests,
    };
  }
}

// Usage with Express
const tracker = new RequestTracker();

app.use(tracker.middleware());

// In shutdown handler
shutdownManager.register('drain-requests', async () => {
  tracker.stopAccepting();
  await tracker.waitForCompletion(10000);
}, { timeout: 12000, critical: true });
```

### Pattern 6: Health Check Integration

```javascript
// health-check.js
class HealthCheck {
  constructor() {
    this.status = 'healthy';
    this.shutdownInitiated = false;
  }

  // Mark as shutting down
  initiateShutdown() {
    this.shutdownInitiated = true;
    this.status = 'shutting-down';
  }

  // Express middleware
  middleware() {
    return (req, res) => {
      if (this.shutdownInitiated) {
        // Tell load balancer to remove this instance
        res.status(503).json({
          status: 'shutting-down',
          message: 'Server is shutting down',
        });
      } else {
        res.status(200).json({
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        });
      }
    };
  }
}

const healthCheck = new HealthCheck();

app.get('/health', healthCheck.middleware());

// Integrate with shutdown
process.on('SIGTERM', async () => {
  // Immediately mark as unhealthy
  healthCheck.initiateShutdown();

  // Wait for load balancer to detect (typically 5-10 seconds)
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Now proceed with shutdown
  await gracefulShutdown();
});
```

---

## Advanced Signal Handling Patterns

### Pattern 7: Configuration Reload on SIGHUP

```javascript
// config-manager.js
class ConfigManager {
  constructor(configPath) {
    this.configPath = configPath;
    this.config = this.loadConfig();
    this.watchers = new Set();

    // Reload config on SIGHUP
    process.on('SIGHUP', () => {
      console.log('SIGHUP received, reloading configuration');
      this.reload();
    });
  }

  loadConfig() {
    try {
      // Clear require cache to force reload
      delete require.cache[require.resolve(this.configPath)];
      return require(this.configPath);
    } catch (error) {
      console.error('Failed to load config:', error);
      return null;
    }
  }

  reload() {
    const oldConfig = this.config;
    const newConfig = this.loadConfig();

    if (!newConfig) {
      console.error('Config reload failed, keeping old config');
      return false;
    }

    this.config = newConfig;

    // Notify watchers of config change
    this.watchers.forEach(callback => {
      try {
        callback(newConfig, oldConfig);
      } catch (error) {
        console.error('Config watcher error:', error);
      }
    });

    console.log('Configuration reloaded successfully');
    return true;
  }

  watch(callback) {
    this.watchers.add(callback);
  }

  get() {
    return this.config;
  }
}

// Usage
const config = new ConfigManager('./config.js');

// Watch for config changes
config.watch((newConfig, oldConfig) => {
  console.log('Log level changed:', newConfig.logLevel);
  logger.setLevel(newConfig.logLevel);
});

// Reload manually or send: kill -HUP <pid>
```

### Pattern 8: Heap Dump on SIGUSR2

```javascript
// diagnostics-handler.js
const v8 = require('v8');
const fs = require('fs');
const path = require('path');

class DiagnosticsHandler {
  constructor(options = {}) {
    this.dumpDir = options.dumpDir || './dumps';
    this.ensureDumpDir();
    this.setupSignalHandlers();
  }

  ensureDumpDir() {
    if (!fs.existsSync(this.dumpDir)) {
      fs.mkdirSync(this.dumpDir, { recursive: true });
    }
  }

  setupSignalHandlers() {
    // SIGUSR1 - Memory snapshot
    process.on('SIGUSR1', () => {
      console.log('SIGUSR1 received, creating heap snapshot');
      this.createHeapSnapshot();
    });

    // SIGUSR2 - Process info dump
    process.on('SIGUSR2', () => {
      console.log('SIGUSR2 received, dumping process info');
      this.dumpProcessInfo();
    });
  }

  createHeapSnapshot() {
    try {
      const filename = `heap-${Date.now()}.heapsnapshot`;
      const filepath = path.join(this.dumpDir, filename);

      const snapshot = v8.writeHeapSnapshot(filepath);

      const stats = fs.statSync(snapshot);
      console.log(`Heap snapshot created: ${snapshot}`);
      console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      return snapshot;
    } catch (error) {
      console.error('Failed to create heap snapshot:', error);
    }
  }

  dumpProcessInfo() {
    try {
      const filename = `process-info-${Date.now()}.json`;
      const filepath = path.join(this.dumpDir, filename);

      const info = {
        timestamp: new Date().toISOString(),
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        versions: process.versions,
        platform: process.platform,
        arch: process.arch,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          // Add other relevant env vars
        },
      };

      fs.writeFileSync(filepath, JSON.stringify(info, null, 2));
      console.log(`Process info dumped: ${filepath}`);

      return filepath;
    } catch (error) {
      console.error('Failed to dump process info:', error);
    }
  }
}

// Usage
const diagnostics = new DiagnosticsHandler({
  dumpDir: './diagnostics',
});

// Trigger with:
// kill -USR1 <pid>  # Create heap snapshot
// kill -USR2 <pid>  # Dump process info
```

### Pattern 9: Graceful Restart (Zero Downtime)

```javascript
// cluster-graceful-restart.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numWorkers = os.cpus().length;
  const workers = new Map();

  // Fork workers
  for (let i = 0; i < numWorkers; i++) {
    forkWorker();
  }

  function forkWorker() {
    const worker = cluster.fork();
    workers.set(worker.process.pid, worker);

    worker.on('exit', (code, signal) => {
      workers.delete(worker.process.pid);
      console.log(`Worker ${worker.process.pid} died`);

      // Restart worker unless shutting down
      if (!shuttingDown) {
        forkWorker();
      }
    });
  }

  // Graceful restart on SIGUSR2
  process.on('SIGUSR2', () => {
    console.log('SIGUSR2 received, performing rolling restart');
    rollingRestart();
  });

  async function rollingRestart() {
    console.log('Starting rolling restart of workers');

    const workerArray = Array.from(workers.values());

    // Restart workers one at a time
    for (const worker of workerArray) {
      console.log(`Restarting worker ${worker.process.pid}`);

      // Fork new worker
      const newWorker = forkWorker();

      // Wait for new worker to be ready
      await new Promise(resolve => {
        newWorker.once('listening', resolve);
      });

      // Gracefully shutdown old worker
      worker.send('shutdown');

      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Force kill if still alive
      if (!worker.isDead()) {
        worker.kill('SIGTERM');
      }
    }

    console.log('Rolling restart completed');
  }

  // Handle shutdown
  let shuttingDown = false;

  process.on('SIGTERM', async () => {
    shuttingDown = true;
    console.log('Master received SIGTERM, shutting down workers');

    // Send shutdown to all workers
    workers.forEach(worker => {
      worker.send('shutdown');
    });

    // Wait for workers to exit
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Force kill any remaining workers
    workers.forEach(worker => {
      if (!worker.isDead()) {
        worker.kill('SIGTERM');
      }
    });

    process.exit(0);
  });

} else {
  // Worker process
  const server = require('./app');

  // Listen for shutdown message from master
  process.on('message', async (msg) => {
    if (msg === 'shutdown') {
      console.log(`Worker ${process.pid} shutting down`);
      await gracefulShutdown();
    }
  });

  async function gracefulShutdown() {
    // Stop accepting new connections
    server.close(() => {
      console.log(`Worker ${process.pid} server closed`);
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown');
      process.exit(1);
    }, 10000);
  }
}
```

---

## Container and Orchestrator Patterns

### Pattern 10: Kubernetes-Friendly Shutdown

```javascript
// kubernetes-shutdown.js
class KubernetesShutdownHandler {
  constructor(options = {}) {
    this.preStopDelay = options.preStopDelay || 5000;
    this.shutdownTimeout = options.shutdownTimeout || 30000;
    this.healthCheck = options.healthCheck;

    this.setupHandlers();
  }

  setupHandlers() {
    // Kubernetes sends SIGTERM
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received from Kubernetes');
      await this.handleKubernetesShutdown();
    });
  }

  async handleKubernetesShutdown() {
    console.log('Starting Kubernetes-aware shutdown');

    // Step 1: Immediately fail health checks
    if (this.healthCheck) {
      this.healthCheck.setUnhealthy();
      console.log('Health check set to unhealthy');
    }

    // Step 2: Wait for Kubernetes to remove pod from endpoints
    // This gives time for:
    // - kube-proxy to update iptables rules
    // - Ingress controllers to stop routing traffic
    // - Service mesh to update routing
    console.log(`Waiting ${this.preStopDelay}ms for Kubernetes endpoint removal`);
    await this.sleep(this.preStopDelay);

    // Step 3: Stop accepting new connections
    console.log('Stopping new connection acceptance');
    // Your server.close() or similar

    // Step 4: Drain existing connections
    console.log('Draining existing connections');
    await this.drainConnections();

    // Step 5: Cleanup resources
    console.log('Cleaning up resources');
    await this.cleanup();

    console.log('Kubernetes shutdown completed');
    process.exit(0);
  }

  async drainConnections() {
    // Implementation depends on your server framework
    // See RequestTracker pattern above
  }

  async cleanup() {
    // Close databases, caches, etc.
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage in Kubernetes
const k8sHandler = new KubernetesShutdownHandler({
  preStopDelay: 10000,  // Wait 10s for endpoint removal
  shutdownTimeout: 30000, // Total shutdown timeout
  healthCheck: healthCheck,
});

// In your Kubernetes deployment:
/*
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 5"]
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 5
    readinessProbe:
      httpGet:
        path: /ready
        port: 3000
      periodSeconds: 2
  terminationGracePeriodSeconds: 30
*/
```

### Pattern 11: Docker-Aware Signal Handling

```javascript
// docker-shutdown.js
class DockerShutdownHandler {
  constructor() {
    this.setupDockerHandlers();
  }

  setupDockerHandlers() {
    // Docker sends SIGTERM by default
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received from Docker');
      await this.gracefulShutdown();
    });

    // Also handle Ctrl+C in docker run -it
    process.on('SIGINT', async () => {
      console.log('SIGINT received (Ctrl+C)');
      await this.gracefulShutdown();
    });
  }

  async gracefulShutdown() {
    console.log('Docker graceful shutdown initiated');

    // Docker gives 10 seconds by default before SIGKILL
    // Configure with: docker stop --time=30 <container>

    try {
      // Close server
      await this.closeServer();

      // Close connections
      await this.closeConnections();

      // Flush logs (important for Docker logs)
      await this.flushLogs();

      console.log('Shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Shutdown error:', error);
      process.exit(1);
    }
  }

  async closeServer() {
    // Implementation
  }

  async closeConnections() {
    // Implementation
  }

  async flushLogs() {
    // Ensure all console.log/error are flushed
    await new Promise(resolve => {
      process.stdout.write('', resolve);
    });
    await new Promise(resolve => {
      process.stderr.write('', resolve);
    });
  }
}

// Dockerfile best practices for signals:
/*
FROM node:18-alpine

# Use exec form to ensure Node.js receives signals
CMD ["node", "server.js"]

# NOT: CMD node server.js  (shell form - signals go to shell)

# For better control:
STOPSIGNAL SIGTERM
*/
```

---

## Testing Signal Handlers

### Pattern 12: Signal Handler Testing

```javascript
// __tests__/signal-handlers.test.js
const { spawn } = require('child_process');
const path = require('path');

describe('Signal Handlers', () => {
  let serverProcess;

  afterEach(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGKILL');
    }
  });

  test('gracefully shuts down on SIGTERM', async () => {
    // Start server
    serverProcess = spawn('node', [path.join(__dirname, '../server.js')]);

    let output = '';
    serverProcess.stdout.on('data', data => {
      output += data.toString();
    });

    // Wait for server to start
    await waitForOutput(serverProcess, 'Server listening');

    // Send SIGTERM
    serverProcess.kill('SIGTERM');

    // Wait for graceful shutdown
    const exitCode = await waitForExit(serverProcess);

    expect(exitCode).toBe(0);
    expect(output).toContain('Graceful shutdown');
    expect(output).toContain('Server closed');
  }, 10000);

  test('completes in-flight requests before shutdown', async () => {
    serverProcess = spawn('node', [path.join(__dirname, '../server.js')]);

    await waitForOutput(serverProcess, 'Server listening');

    // Start a long request
    const request = fetch('http://localhost:3000/slow');

    // Immediately send SIGTERM
    setTimeout(() => serverProcess.kill('SIGTERM'), 100);

    // Request should complete
    const response = await request;
    expect(response.status).toBe(200);
  }, 10000);

  test('times out if shutdown takes too long', async () => {
    serverProcess = spawn('node', [
      path.join(__dirname, '../server-hanging.js'),
    ]);

    await waitForOutput(serverProcess, 'Server listening');

    const startTime = Date.now();
    serverProcess.kill('SIGTERM');

    const exitCode = await waitForExit(serverProcess);
    const duration = Date.now() - startTime;

    expect(exitCode).toBe(1);
    expect(duration).toBeLessThan(15000); // Should timeout at 10s
  }, 20000);

  test('reloads config on SIGHUP', async () => {
    serverProcess = spawn('node', [path.join(__dirname, '../server.js')]);

    let output = '';
    serverProcess.stdout.on('data', data => {
      output += data.toString();
    });

    await waitForOutput(serverProcess, 'Server listening');

    // Send SIGHUP
    serverProcess.kill('SIGHUP');

    // Wait for reload message
    await waitForOutput(serverProcess, 'Configuration reloaded');

    expect(output).toContain('SIGHUP received');
  }, 10000);
});

function waitForOutput(process, text, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for: ${text}`));
    }, timeout);

    const handler = (data) => {
      if (data.toString().includes(text)) {
        clearTimeout(timer);
        process.stdout.off('data', handler);
        resolve();
      }
    };

    process.stdout.on('data', handler);
  });
}

function waitForExit(process, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Process did not exit'));
    }, timeout);

    process.on('exit', (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });
}
```

---

## Best Practices

### 1. Always Handle Multiple Signals

```javascript
// GOOD: Handle all relevant signals
const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGQUIT'];
SHUTDOWN_SIGNALS.forEach(signal => {
  process.on(signal, handleShutdown);
});

// BAD: Only handle one signal
process.on('SIGTERM', handleShutdown);
```

### 2. Implement Shutdown Timeouts

```javascript
// GOOD: Timeout prevents hanging
async function gracefulShutdown() {
  const timeout = setTimeout(() => {
    console.error('Shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000);

  await cleanup();
  clearTimeout(timeout);
  process.exit(0);
}

// BAD: No timeout, might hang forever
async function gracefulShutdown() {
  await cleanup(); // Could hang
  process.exit(0);
}
```

### 3. Prevent Multiple Shutdown Attempts

```javascript
// GOOD: Guard against duplicate shutdowns
let shuttingDown = false;

async function gracefulShutdown() {
  if (shuttingDown) {
    console.log('Shutdown in progress');
    return;
  }
  shuttingDown = true;
  // ... shutdown logic
}

// BAD: No guard, could run multiple times
async function gracefulShutdown() {
  // ... shutdown logic
}
```

### 4. Fail Health Checks Immediately

```javascript
// GOOD: Fail health checks first
process.on('SIGTERM', async () => {
  healthCheck.setUnhealthy(); // Immediate
  await sleep(5000);           // Let LB react
  await gracefulShutdown();
});

// BAD: Keep reporting healthy during shutdown
process.on('SIGTERM', async () => {
  await gracefulShutdown();
});
```

### 5. Log Signal Events

```javascript
// GOOD: Log all signal events
process.on('SIGTERM', () => {
  logger.info('SIGTERM received', {
    pid: process.pid,
    uptime: process.uptime(),
  });
  gracefulShutdown();
});

// BAD: Silent handling
process.on('SIGTERM', gracefulShutdown);
```

### 6. Clean Up in Reverse Order

```javascript
// GOOD: Cleanup in reverse order (LIFO)
async function gracefulShutdown() {
  await cache.close();     // Close cache first
  await database.close();  // Then database
  await server.close();    // Finally server
}

// BAD: Random order
async function gracefulShutdown() {
  await server.close();
  await cache.close();
  await database.close();
}
```

---

## Common Pitfalls

### Pitfall 1: Not Handling Signals in Containers

```javascript
// PROBLEM: Container killed ungracefully
// No signal handlers

// SOLUTION: Always handle SIGTERM in containers
process.on('SIGTERM', gracefulShutdown);
```

### Pitfall 2: Using Shell Form in Dockerfile

```dockerfile
# PROBLEM: Signals don't reach Node.js
CMD node server.js

# SOLUTION: Use exec form
CMD ["node", "server.js"]
```

### Pitfall 3: Forgetting PID 1 Issues

```javascript
// In containers, if Node.js is PID 1:
// - Must handle zombie process reaping
// - Must handle signal forwarding

// SOLUTION: Use tini or dumb-init
/*
FROM node:18-alpine
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
*/
```

### Pitfall 4: Not Waiting for Async Operations

```javascript
// PROBLEM: Exits before cleanup completes
process.on('SIGTERM', () => {
  database.close(); // Async, but not awaited
  process.exit(0);  // Exits immediately!
});

// SOLUTION: Await async operations
process.on('SIGTERM', async () => {
  await database.close();
  process.exit(0);
});
```

### Pitfall 5: Ignoring Exit Codes

```javascript
// PROBLEM: Always exits with 0
process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0); // Even if cleanup failed
});

// SOLUTION: Set appropriate exit code
process.on('SIGTERM', async () => {
  try {
    await cleanup();
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
});
```

---

## Real-World Use Cases

### Use Case 1: Microservice with gRPC and HTTP

```javascript
// microservice.js
const grpc = require('@grpc/grpc-js');
const express = require('express');

class Microservice {
  constructor() {
    this.httpServer = null;
    this.grpcServer = null;
    this.shuttingDown = false;
  }

  async start() {
    // Start HTTP server
    const app = express();
    this.httpServer = app.listen(3000);

    // Start gRPC server
    this.grpcServer = new grpc.Server();
    this.grpcServer.bindAsync(
      '0.0.0.0:50051',
      grpc.ServerCredentials.createInsecure(),
      () => this.grpcServer.start()
    );

    this.setupShutdownHandlers();
  }

  setupShutdownHandlers() {
    const signals = ['SIGTERM', 'SIGINT'];
    signals.forEach(signal => {
      process.on(signal, () => this.shutdown(signal));
    });
  }

  async shutdown(signal) {
    if (this.shuttingDown) return;
    this.shuttingDown = true;

    console.log(`Received ${signal}, shutting down`);

    // 1. Fail health checks
    this.healthy = false;

    // 2. Wait for load balancer
    await this.sleep(5000);

    // 3. Stop accepting new connections
    await this.stopAcceptingConnections();

    // 4. Drain existing connections
    await this.drainConnections();

    // 5. Shutdown gRPC server
    await this.shutdownGrpc();

    // 6. Shutdown HTTP server
    await this.shutdownHttp();

    console.log('Shutdown complete');
    process.exit(0);
  }

  async stopAcceptingConnections() {
    // Stop accepting new HTTP requests
    this.httpServer.close();

    // Stop accepting new gRPC requests
    this.grpcServer.tryShutdown(() => {
      console.log('gRPC server stopped accepting');
    });
  }

  async drainConnections() {
    // Wait for active requests
    let attempts = 0;
    while (this.hasActiveConnections() && attempts < 50) {
      await this.sleep(200);
      attempts++;
    }
  }

  async shutdownGrpc() {
    return new Promise((resolve) => {
      this.grpcServer.forceShutdown();
      resolve();
    });
  }

  async shutdownHttp() {
    return new Promise((resolve) => {
      this.httpServer.close(resolve);
    });
  }

  hasActiveConnections() {
    // Check for active connections
    return false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const service = new Microservice();
service.start();
```

### Use Case 2: Background Job Processor

```javascript
// job-processor.js
class JobProcessor {
  constructor(queue) {
    this.queue = queue;
    this.activeJobs = new Set();
    this.accepting = true;

    this.setupShutdownHandlers();
  }

  setupShutdownHandlers() {
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  async start() {
    while (this.accepting) {
      try {
        const job = await this.queue.pop();
        if (job) {
          this.processJob(job);
        }
      } catch (error) {
        console.error('Queue error:', error);
      }
    }
  }

  async processJob(job) {
    const jobId = job.id;
    this.activeJobs.add(jobId);

    try {
      await job.execute();
      await this.queue.ack(jobId);
    } catch (error) {
      console.error(`Job ${jobId} failed:`, error);
      await this.queue.nack(jobId);
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  async gracefulShutdown() {
    console.log('Shutting down job processor');

    // 1. Stop accepting new jobs
    this.accepting = false;

    // 2. Wait for active jobs (with timeout)
    const maxWait = 30000;
    const startTime = Date.now();

    while (this.activeJobs.size > 0) {
      if (Date.now() - startTime > maxWait) {
        console.error(
          `Timeout: ${this.activeJobs.size} jobs still running`
        );
        break;
      }

      console.log(`Waiting for ${this.activeJobs.size} active jobs`);
      await this.sleep(1000);
    }

    // 3. Disconnect from queue
    await this.queue.disconnect();

    console.log('Job processor shutdown complete');
    process.exit(0);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Performance Considerations

### 1. Shutdown Performance

```javascript
// Measure shutdown performance
const shutdownStart = Date.now();

process.on('SIGTERM', async () => {
  console.log('Shutdown started');

  await gracefulShutdown();

  const duration = Date.now() - shutdownStart;
  console.log(`Shutdown completed in ${duration}ms`);

  // Alert if shutdown is too slow
  if (duration > 10000) {
    console.warn('Shutdown took longer than 10 seconds');
  }

  process.exit(0);
});
```

### 2. Parallel Cleanup

```javascript
// GOOD: Cleanup independent resources in parallel
async function gracefulShutdown() {
  await Promise.all([
    cache.close(),
    logger.flush(),
    metrics.flush(),
  ]);

  // Then dependent resources
  await database.close();
  await server.close();
}

// BAD: Sequential cleanup when parallel is safe
async function gracefulShutdown() {
  await cache.close();
  await logger.flush();
  await metrics.flush();
  await database.close();
  await server.close();
}
```

---

## Summary

### Key Takeaways

1. **Handle Multiple Signals** - SIGTERM, SIGINT, SIGQUIT
2. **Implement Timeouts** - Prevent hanging shutdowns
3. **Drain Connections** - Complete in-flight requests
4. **Cleanup Resources** - Close databases, caches, files
5. **Fail Health Checks** - Tell load balancers immediately
6. **Use Appropriate Exit Codes** - 0 for success, non-zero for errors
7. **Test Signal Handlers** - Ensure they work as expected
8. **Container-Aware** - Handle Docker and Kubernetes specifics

### Signal Handling Checklist

- [ ] Handle SIGTERM and SIGINT
- [ ] Implement shutdown timeout
- [ ] Prevent duplicate shutdown attempts
- [ ] Stop accepting new connections
- [ ] Drain existing connections
- [ ] Close database connections
- [ ] Close cache connections
- [ ] Flush logs and metrics
- [ ] Fail health checks immediately
- [ ] Set appropriate exit codes
- [ ] Test shutdown behavior
- [ ] Document shutdown behavior

### Next Steps

1. Implement basic signal handlers in your applications
2. Test shutdown behavior in development
3. Add health check integration
4. Test in container environments
5. Monitor shutdown metrics in production
6. Proceed to [Graceful Shutdown Strategies](./02-graceful-shutdown-strategies.md)

---

## Quick Reference

```javascript
// Basic signal handling
process.on('SIGTERM', async () => {
  await gracefulShutdown();
  process.exit(0);
});

// Multiple signals
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, handleShutdown);
});

// With timeout
const timeout = setTimeout(() => {
  process.exit(1);
}, 10000);

await cleanup();
clearTimeout(timeout);
process.exit(0);

// With guard
let shuttingDown = false;
if (shuttingDown) return;
shuttingDown = true;

// Configuration reload
process.on('SIGHUP', () => {
  config.reload();
});

// Diagnostics
process.on('SIGUSR2', () => {
  createHeapSnapshot();
});
```

Ready to master graceful shutdown strategies? Continue to [Graceful Shutdown Strategies Guide](./02-graceful-shutdown-strategies.md)!
