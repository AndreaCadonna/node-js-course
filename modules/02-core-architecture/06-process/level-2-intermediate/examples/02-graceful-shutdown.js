/**
 * 02-graceful-shutdown.js
 *
 * Complete Graceful Shutdown Pattern
 *
 * This example demonstrates production-ready graceful shutdown patterns including:
 * - HTTP/HTTPS server shutdown
 * - Database connection cleanup
 * - Timeout management
 * - In-flight request handling
 * - Resource cleanup coordination
 * - Health check integration
 * - Shutdown state management
 *
 * Graceful shutdown ensures that:
 * 1. No new requests are accepted
 * 2. In-flight requests complete (within timeout)
 * 3. Connections are properly closed
 * 4. Resources are cleaned up
 * 5. Process exits cleanly
 *
 * This is critical for:
 * - Zero-downtime deployments
 * - Load balancer coordination
 * - Data consistency
 * - Resource leak prevention
 * - Clean rollbacks
 *
 * @module graceful-shutdown
 * @level intermediate
 */

'use strict';

const http = require('http');
const { EventEmitter } = require('events');

// =============================================================================
// 1. Basic HTTP Server Graceful Shutdown
// =============================================================================

console.log('\n=== 1. Basic HTTP Server Graceful Shutdown ===\n');

class GracefulHttpServer {
  constructor(port = 3000) {
    this.port = port;
    this.server = null;
    this.connections = new Set();
    this.isShuttingDown = false;
    this.shutdownTimeout = 30000; // 30 seconds
  }

  /**
   * Create and start the HTTP server
   */
  start() {
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    // Track all connections
    this.server.on('connection', (socket) => {
      this.connections.add(socket);
      console.log(`[Server] New connection (total: ${this.connections.size})`);

      socket.on('close', () => {
        this.connections.delete(socket);
        console.log(`[Server] Connection closed (remaining: ${this.connections.size})`);
      });
    });

    this.server.listen(this.port, () => {
      console.log(`[Server] Listening on port ${this.port}`);
      console.log(`[Server] PID: ${process.pid}`);
      console.log(`[Server] Try: curl http://localhost:${this.port}/`);
    });
  }

  /**
   * Handle incoming HTTP request
   */
  handleRequest(req, res) {
    // Reject new requests during shutdown
    if (this.isShuttingDown) {
      console.log(`[Server] Rejecting request during shutdown: ${req.url}`);
      res.writeHead(503, { 'Connection': 'close' });
      res.end('Service Unavailable - Server is shutting down\n');
      return;
    }

    console.log(`[Server] Handling request: ${req.method} ${req.url}`);

    // Simulate some work
    const workTime = Math.random() * 2000 + 1000; // 1-3 seconds

    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`Request completed after ${Math.floor(workTime)}ms\n`);
      console.log(`[Server] Request completed: ${req.url}`);
    }, workTime);
  }

  /**
   * Gracefully shutdown the server
   */
  async shutdown() {
    console.log('\n[Server] Initiating graceful shutdown...');
    this.isShuttingDown = true;

    // Stop accepting new connections
    return new Promise((resolve, reject) => {
      const shutdownTimer = setTimeout(() => {
        console.log('[Server] Shutdown timeout reached, forcing close');
        this.forceShutdown();
        reject(new Error('Shutdown timeout'));
      }, this.shutdownTimeout);

      this.server.close((err) => {
        clearTimeout(shutdownTimer);

        if (err) {
          console.error('[Server] Error during shutdown:', err.message);
          reject(err);
        } else {
          console.log('[Server] Server closed successfully');
          console.log(`[Server] ${this.connections.size} connection(s) remained`);
          resolve();
        }
      });

      console.log(`[Server] Waiting for ${this.connections.size} connection(s) to close...`);
    });
  }

  /**
   * Force shutdown by destroying all connections
   */
  forceShutdown() {
    console.log(`[Server] Force closing ${this.connections.size} connection(s)`);

    for (const socket of this.connections) {
      socket.destroy();
    }

    this.connections.clear();
  }
}

// Create server instance
const httpServer = new GracefulHttpServer(3001);
httpServer.start();

// Setup signal handlers for graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n[SIGTERM] Received');
  try {
    await httpServer.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('[SIGTERM] Shutdown failed:', error.message);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('\n[SIGINT] Received');
  try {
    await httpServer.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('[SIGINT] Shutdown failed:', error.message);
    process.exit(1);
  }
});

// =============================================================================
// 2. Complete Graceful Shutdown with Multiple Services
// =============================================================================

console.log('\n=== 2. Complete Graceful Shutdown with Multiple Services ===\n');

class DatabaseConnection extends EventEmitter {
  constructor(name = 'primary') {
    super();
    this.name = name;
    this.connected = false;
    this.activeQueries = new Set();
  }

  async connect() {
    console.log(`[Database:${this.name}] Connecting...`);
    await this.simulateAsync(500);
    this.connected = true;
    console.log(`[Database:${this.name}] Connected`);
    this.emit('connected');
  }

  async query(sql) {
    if (!this.connected) {
      throw new Error('Not connected');
    }

    const queryId = Math.random().toString(36).substr(2, 9);
    this.activeQueries.add(queryId);

    console.log(`[Database:${this.name}] Query ${queryId} started`);

    try {
      await this.simulateAsync(Math.random() * 1000 + 500);
      console.log(`[Database:${this.name}] Query ${queryId} completed`);
      return { queryId, result: 'success' };
    } finally {
      this.activeQueries.delete(queryId);
    }
  }

  async disconnect() {
    console.log(`[Database:${this.name}] Disconnecting...`);
    console.log(`[Database:${this.name}] Waiting for ${this.activeQueries.size} active queries...`);

    // Wait for active queries
    while (this.activeQueries.size > 0) {
      await this.simulateAsync(100);
    }

    this.connected = false;
    console.log(`[Database:${this.name}] Disconnected`);
    this.emit('disconnected');
  }

  simulateAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class CacheService extends EventEmitter {
  constructor() {
    super();
    this.cache = new Map();
    this.dirty = false;
  }

  set(key, value) {
    this.cache.set(key, value);
    this.dirty = true;
    console.log(`[Cache] Set: ${key} = ${value}`);
  }

  get(key) {
    return this.cache.get(key);
  }

  async flush() {
    if (!this.dirty) {
      console.log('[Cache] No changes to flush');
      return;
    }

    console.log(`[Cache] Flushing ${this.cache.size} entries...`);
    await this.simulateAsync(300);
    this.dirty = false;
    console.log('[Cache] Flush complete');
    this.emit('flushed');
  }

  simulateAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class GracefulShutdownManager {
  constructor() {
    this.state = 'running';
    this.services = new Map();
    this.shutdownTimeout = 30000;
    this.shutdownOrder = [];
  }

  /**
   * Register a service for managed shutdown
   */
  registerService(name, service, shutdownFn, priority = 0) {
    this.services.set(name, { service, shutdownFn, priority });
    this.shutdownOrder = Array.from(this.services.entries())
      .sort(([, a], [, b]) => b.priority - a.priority)
      .map(([name]) => name);

    console.log(`[ShutdownManager] Registered service: ${name} (priority: ${priority})`);
  }

  /**
   * Setup signal handlers
   */
  setupSignalHandlers() {
    const signals = ['SIGTERM', 'SIGINT'];

    for (const signal of signals) {
      process.on(signal, () => {
        this.initiateShutdown(signal);
      });
    }

    console.log(`[ShutdownManager] Signal handlers registered: ${signals.join(', ')}`);
  }

  /**
   * Initiate graceful shutdown
   */
  async initiateShutdown(signal) {
    if (this.state !== 'running') {
      console.log(`\n[${signal}] Already shutting down, forcing exit...`);
      process.exit(1);
    }

    console.log(`\n[${signal}] Initiating graceful shutdown...`);
    console.log(`[ShutdownManager] Current state: ${this.state}`);
    console.log(`[ShutdownManager] Services to shutdown: ${this.shutdownOrder.length}`);

    this.state = 'shutting_down';

    const shutdownTimer = setTimeout(() => {
      console.error('\n[ShutdownManager] Shutdown timeout exceeded!');
      console.error('[ShutdownManager] Forcing exit...');
      process.exit(1);
    }, this.shutdownTimeout);

    // Don't keep process alive for timeout
    shutdownTimer.unref();

    try {
      await this.shutdownServices();
      console.log('\n[ShutdownManager] All services shutdown successfully');
      clearTimeout(shutdownTimer);
      this.state = 'stopped';
      process.exit(0);
    } catch (error) {
      console.error('\n[ShutdownManager] Shutdown failed:', error.message);
      clearTimeout(shutdownTimer);
      process.exit(1);
    }
  }

  /**
   * Shutdown all services in priority order
   */
  async shutdownServices() {
    console.log(`\n[ShutdownManager] Shutting down services in order:`);

    for (const name of this.shutdownOrder) {
      const { service, shutdownFn, priority } = this.services.get(name);

      console.log(`\n  → Shutting down: ${name} (priority: ${priority})`);
      const startTime = Date.now();

      try {
        await shutdownFn.call(service);
        const duration = Date.now() - startTime;
        console.log(`    ✓ ${name} shutdown completed in ${duration}ms`);
      } catch (error) {
        console.error(`    ✗ ${name} shutdown failed: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      state: this.state,
      services: Array.from(this.services.entries()).map(([name, { priority }]) => ({
        name,
        priority
      })),
      shutdownOrder: this.shutdownOrder
    };
  }
}

// Create services
const primaryDb = new DatabaseConnection('primary');
const replicaDb = new DatabaseConnection('replica');
const cache = new CacheService();

// Create shutdown manager
const shutdownManager = new GracefulShutdownManager();

// Register services with priorities
shutdownManager.registerService('http-server', httpServer, httpServer.shutdown, 100);
shutdownManager.registerService('cache', cache, cache.flush, 80);
shutdownManager.registerService('primary-db', primaryDb, primaryDb.disconnect, 70);
shutdownManager.registerService('replica-db', replicaDb, replicaDb.disconnect, 60);

// Setup signal handlers
shutdownManager.setupSignalHandlers();

// Initialize services
(async () => {
  await primaryDb.connect();
  await replicaDb.connect();
  cache.set('key1', 'value1');
  cache.set('key2', 'value2');

  console.log('\n[Application] All services initialized');
  console.log('[Application] Shutdown manager status:', JSON.stringify(shutdownManager.getStatus(), null, 2));
})();

// =============================================================================
// 3. Advanced Shutdown with Health Checks
// =============================================================================

console.log('\n=== 3. Advanced Shutdown with Health Checks ===\n');

class HealthCheckServer {
  constructor(port = 8080) {
    this.port = port;
    this.server = null;
    this.healthy = true;
    this.ready = true;
  }

  start() {
    this.server = http.createServer((req, res) => {
      if (req.url === '/health') {
        this.handleHealth(req, res);
      } else if (req.url === '/ready') {
        this.handleReady(req, res);
      } else {
        res.writeHead(404);
        res.end('Not Found\n');
      }
    });

    this.server.listen(this.port, () => {
      console.log(`[HealthCheck] Server listening on port ${this.port}`);
      console.log(`[HealthCheck] Health endpoint: http://localhost:${this.port}/health`);
      console.log(`[HealthCheck] Ready endpoint: http://localhost:${this.port}/ready`);
    });
  }

  handleHealth(req, res) {
    const status = this.healthy ? 200 : 503;
    const health = {
      status: this.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));

    console.log(`[HealthCheck] Health check: ${health.status}`);
  }

  handleReady(req, res) {
    const status = this.ready ? 200 : 503;
    const readiness = {
      status: this.ready ? 'ready' : 'not ready',
      timestamp: new Date().toISOString()
    };

    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readiness, null, 2));

    console.log(`[HealthCheck] Readiness check: ${readiness.status}`);
  }

  markUnhealthy() {
    console.log('[HealthCheck] Marking as unhealthy');
    this.healthy = false;
  }

  markNotReady() {
    console.log('[HealthCheck] Marking as not ready');
    this.ready = false;
  }

  async shutdown() {
    console.log('[HealthCheck] Shutting down health check server');
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('[HealthCheck] Health check server closed');
        resolve();
      });
    });
  }
}

const healthCheck = new HealthCheckServer(8081);
healthCheck.start();

// =============================================================================
// 4. Shutdown with In-Flight Request Tracking
// =============================================================================

console.log('\n=== 4. Shutdown with In-Flight Request Tracking ===\n');

class RequestTracker {
  constructor() {
    this.requests = new Map();
    this.requestCounter = 0;
  }

  /**
   * Track a new request
   */
  startRequest(req) {
    const requestId = ++this.requestCounter;
    const request = {
      id: requestId,
      method: req.method,
      url: req.url,
      startTime: Date.now()
    };

    this.requests.set(requestId, request);
    console.log(`[RequestTracker] Started request #${requestId}: ${req.method} ${req.url}`);
    console.log(`[RequestTracker] Active requests: ${this.requests.size}`);

    return requestId;
  }

  /**
   * Mark request as complete
   */
  endRequest(requestId) {
    const request = this.requests.get(requestId);
    if (request) {
      const duration = Date.now() - request.startTime;
      console.log(`[RequestTracker] Completed request #${requestId} in ${duration}ms`);
      this.requests.delete(requestId);
      console.log(`[RequestTracker] Active requests: ${this.requests.size}`);
    }
  }

  /**
   * Get active requests
   */
  getActiveRequests() {
    return Array.from(this.requests.values()).map(req => ({
      ...req,
      duration: Date.now() - req.startTime
    }));
  }

  /**
   * Wait for all requests to complete
   */
  async waitForCompletion(timeout = 30000) {
    console.log(`[RequestTracker] Waiting for ${this.requests.size} request(s) to complete...`);

    const startTime = Date.now();

    while (this.requests.size > 0) {
      if (Date.now() - startTime > timeout) {
        console.log('[RequestTracker] Timeout waiting for requests');
        console.log('[RequestTracker] Remaining requests:', this.getActiveRequests());
        throw new Error('Timeout waiting for in-flight requests');
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('[RequestTracker] All requests completed');
  }
}

const requestTracker = new RequestTracker();

// =============================================================================
// 5. Complete Production-Ready Shutdown Pattern
// =============================================================================

console.log('\n=== 5. Complete Production-Ready Shutdown Pattern ===\n');

class ProductionShutdownManager {
  constructor() {
    this.state = 'starting';
    this.shutdownPhases = [
      { name: 'pre-shutdown', handlers: [] },
      { name: 'stop-accepting', handlers: [] },
      { name: 'drain-requests', handlers: [] },
      { name: 'close-connections', handlers: [] },
      { name: 'cleanup-resources', handlers: [] },
      { name: 'final-flush', handlers: [] }
    ];
    this.shutdownTimeout = 30000;
    this.forceShutdownTimeout = 5000;
  }

  /**
   * Register a handler for a specific shutdown phase
   */
  registerPhaseHandler(phase, name, handler) {
    const phaseObj = this.shutdownPhases.find(p => p.name === phase);
    if (!phaseObj) {
      throw new Error(`Invalid phase: ${phase}`);
    }

    phaseObj.handlers.push({ name, handler });
    console.log(`[ProductionShutdown] Registered "${name}" for phase "${phase}"`);
  }

  /**
   * Initialize the application
   */
  async initialize() {
    console.log('[ProductionShutdown] Initializing application...');
    this.state = 'initializing';

    // Simulate initialization
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.state = 'running';
    console.log('[ProductionShutdown] Application initialized and running');
  }

  /**
   * Setup signal handlers
   */
  setupSignals() {
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));

    console.log('[ProductionShutdown] Signal handlers configured');
  }

  /**
   * Execute graceful shutdown
   */
  async shutdown(signal) {
    if (this.state !== 'running') {
      console.log(`\n[${signal}] Already shutting down, forcing exit...`);
      this.forceShutdown();
      return;
    }

    console.log(`\n[${signal}] ========================================`);
    console.log(`[${signal}] GRACEFUL SHUTDOWN INITIATED`);
    console.log(`[${signal}] ========================================\n`);

    this.state = 'shutting_down';

    // Set hard timeout
    const hardTimeout = setTimeout(() => {
      console.error('\n[TIMEOUT] Hard shutdown timeout reached!');
      this.forceShutdown();
    }, this.shutdownTimeout + this.forceShutdownTimeout);

    hardTimeout.unref();

    try {
      // Execute all shutdown phases
      for (const phase of this.shutdownPhases) {
        await this.executePhase(phase);
      }

      console.log('\n========================================');
      console.log('GRACEFUL SHUTDOWN COMPLETED');
      console.log('========================================\n');

      clearTimeout(hardTimeout);
      this.state = 'stopped';
      process.exit(0);
    } catch (error) {
      console.error('\n[ERROR] Shutdown failed:', error.message);
      this.forceShutdown();
    }
  }

  /**
   * Execute a shutdown phase
   */
  async executePhase(phase) {
    console.log(`\n[Phase: ${phase.name}]`);
    console.log(`  Handlers: ${phase.handlers.length}`);

    for (const { name, handler } of phase.handlers) {
      console.log(`\n  → Executing: ${name}`);
      const startTime = Date.now();

      try {
        await handler();
        const duration = Date.now() - startTime;
        console.log(`    ✓ Completed in ${duration}ms`);
      } catch (error) {
        console.error(`    ✗ Failed: ${error.message}`);
        throw error;
      }
    }

    console.log(`\n  Phase "${phase.name}" completed`);
  }

  /**
   * Force immediate shutdown
   */
  forceShutdown() {
    console.error('\n[FORCE] Forcing immediate shutdown!');
    process.exit(1);
  }
}

const prodShutdown = new ProductionShutdownManager();

// Register handlers for each phase
prodShutdown.registerPhaseHandler('pre-shutdown', 'mark-unhealthy', async () => {
  console.log('    • Marking service as unhealthy for load balancer');
  healthCheck.markUnhealthy();
  await new Promise(resolve => setTimeout(resolve, 200));
});

prodShutdown.registerPhaseHandler('stop-accepting', 'stop-http-server', async () => {
  console.log('    • Stopping HTTP server from accepting new connections');
  healthCheck.markNotReady();
  await new Promise(resolve => setTimeout(resolve, 200));
});

prodShutdown.registerPhaseHandler('drain-requests', 'wait-for-requests', async () => {
  console.log('    • Waiting for in-flight requests to complete');
  await requestTracker.waitForCompletion(5000).catch(err => {
    console.log('    • Some requests did not complete, continuing...');
  });
});

prodShutdown.registerPhaseHandler('close-connections', 'close-http', async () => {
  console.log('    • Closing HTTP server');
  await httpServer.shutdown().catch(err => console.log('    • HTTP server already closed'));
});

prodShutdown.registerPhaseHandler('close-connections', 'disconnect-databases', async () => {
  console.log('    • Disconnecting from databases');
  if (primaryDb.connected) await primaryDb.disconnect();
  if (replicaDb.connected) await replicaDb.disconnect();
});

prodShutdown.registerPhaseHandler('cleanup-resources', 'flush-cache', async () => {
  console.log('    • Flushing cache to persistent storage');
  await cache.flush();
});

prodShutdown.registerPhaseHandler('final-flush', 'flush-logs', async () => {
  console.log('    • Flushing log buffers');
  await new Promise(resolve => setTimeout(resolve, 100));
});

prodShutdown.registerPhaseHandler('final-flush', 'emit-metrics', async () => {
  console.log('    • Emitting final metrics');
  console.log('    • Uptime:', Math.floor(process.uptime()), 'seconds');
  console.log('    • Memory:', JSON.stringify(process.memoryUsage()));
});

// Initialize and setup
(async () => {
  await prodShutdown.initialize();
  prodShutdown.setupSignals();
})();

// =============================================================================
// Summary and Testing Guide
// =============================================================================

console.log('\n=== Graceful Shutdown Summary ===\n');

console.log(`
Graceful Shutdown Best Practices:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Shutdown Phases (in order):
   a) Pre-Shutdown:
      • Mark service as unhealthy in load balancer
      • Stop accepting new requests
      • Wait for load balancer to drain traffic

   b) Drain Phase:
      • Wait for in-flight requests to complete
      • Set maximum drain timeout
      • Track active operations

   c) Close Connections:
      • Close HTTP servers
      • Disconnect databases
      • Close message queues

   d) Cleanup Resources:
      • Flush caches
      • Write buffers to disk
      • Clean temporary files

   e) Final Actions:
      • Flush logs
      • Emit shutdown metrics
      • Notify monitoring systems

2. Timeout Strategy:
   • Graceful timeout: 30 seconds
   • Force shutdown: 5 seconds after graceful
   • Per-phase timeouts for granular control

3. Health Checks:
   • /health: Overall health status
   • /ready: Ready to accept traffic
   • Mark unhealthy before shutdown
   • Keep health endpoint up during drain

4. Request Tracking:
   • Track all in-flight requests
   • Wait for completion with timeout
   • Log long-running requests
   • Force close if needed

5. Multiple Services:
   • Shutdown in correct order
   • Handle dependencies
   • Independent error handling
   • Parallel shutdown when possible

6. Testing:
   • Test with active requests
   • Test timeout scenarios
   • Test forced shutdown
   • Test cascading failures

7. Production Considerations:
   • Coordinate with load balancers
   • Emit metrics on shutdown
   • Log all shutdown steps
   • Handle multiple signals

8. Common Pitfalls:
   • Not setting timeouts (hangs forever)
   • Wrong shutdown order (data loss)
   • Not tracking in-flight requests
   • Not coordinating with load balancer

Running Services:
─────────────────
  HTTP Server: Port ${httpServer.port}
  Health Check: Port ${healthCheck.port}
  Process ID: ${process.pid}

Test Commands:
─────────────
  # Send graceful shutdown signal
  kill -SIGTERM ${process.pid}

  # Test with curl during shutdown
  while true; do curl http://localhost:${httpServer.port}; sleep 1; done

  # Check health status
  curl http://localhost:${healthCheck.port}/health
  curl http://localhost:${healthCheck.port}/ready

  # Send multiple signals (tests force shutdown)
  kill -SIGTERM ${process.pid} && sleep 1 && kill -SIGTERM ${process.pid}
`);

console.log('\nAll services running. Send SIGTERM or press Ctrl+C for graceful shutdown.\n');
