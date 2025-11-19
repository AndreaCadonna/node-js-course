/**
 * Exercise 3: Production Health Monitor
 * ======================================
 *
 * Difficulty: Very Hard
 *
 * Task:
 * Build a comprehensive production health monitoring system with multi-tier
 * health checks, circuit breakers, automated recovery, and detailed reporting.
 * This system should handle real-world production scenarios including database
 * connections, external APIs, and system resources.
 *
 * Requirements:
 * 1. Implement multi-tier health check system (liveness, readiness, startup)
 * 2. Monitor multiple dependencies (database, cache, external APIs)
 * 3. Implement circuit breaker pattern for failing dependencies
 * 4. Track health check history and trends
 * 5. Automatic recovery attempts with exponential backoff
 * 6. Generate detailed health reports with recommendations
 * 7. Expose health endpoints (HTTP /health, /ready, /live)
 * 8. Implement health score calculation
 * 9. Support custom health check plugins
 * 10. Handle cascading failures gracefully
 *
 * Learning Goals:
 * - Production health check patterns
 * - Circuit breaker implementation
 * - Dependency monitoring strategies
 * - Auto-recovery mechanisms
 * - Kubernetes readiness/liveness probes
 * - Distributed system health patterns
 *
 * Test:
 * 1. Run health monitor
 * 2. Simulate dependency failures
 * 3. Observe circuit breaker activation
 * 4. Test auto-recovery
 * 5. Review health reports
 *
 * Run: node exercise-3.js
 */

const http = require('http');
const EventEmitter = require('events');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Health check intervals
  LIVENESS_INTERVAL: 10000,      // 10 seconds
  READINESS_INTERVAL: 5000,       // 5 seconds
  DEPENDENCY_CHECK_INTERVAL: 30000, // 30 seconds

  // Circuit breaker settings
  CIRCUIT_FAILURE_THRESHOLD: 5,   // Failures before opening circuit
  CIRCUIT_SUCCESS_THRESHOLD: 3,   // Successes to close circuit
  CIRCUIT_TIMEOUT: 60000,         // 60 seconds in open state

  // Recovery settings
  MAX_RECOVERY_ATTEMPTS: 3,
  RECOVERY_BACKOFF_MS: 5000,      // Base backoff time

  // Health score weights
  WEIGHTS: {
    memory: 0.2,
    cpu: 0.15,
    eventLoop: 0.15,
    dependencies: 0.5
  },

  // HTTP server
  HEALTH_PORT: 3000,
};

// ============================================================================
// Circuit Breaker States
// ============================================================================

const CircuitState = {
  CLOSED: 'CLOSED',       // Normal operation
  OPEN: 'OPEN',           // Failing, rejecting requests
  HALF_OPEN: 'HALF_OPEN'  // Testing if recovered
};

// ============================================================================
// Circuit Breaker
// ============================================================================

class CircuitBreaker extends EventEmitter {
  /**
   * TODO 1: Implement Circuit Breaker
   *
   * The circuit breaker should:
   * - Track consecutive failures and successes
   * - Transition between CLOSED -> OPEN -> HALF_OPEN -> CLOSED
   * - Emit events on state changes
   * - Implement timeout before moving to HALF_OPEN
   * - Reset failure count on success
   *
   * States:
   * - CLOSED: Allow all requests, count failures
   * - OPEN: Reject all requests, set timeout
   * - HALF_OPEN: Allow one test request
   */
  constructor(name, config) {
    super();
    this.name = name;
    this.config = config;
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.stateHistory = [];
  }

  /**
   * TODO: Implement execute method
   *
   * Execute a function through the circuit breaker:
   * - If OPEN: reject immediately
   * - If HALF_OPEN: allow one attempt
   * - If CLOSED: execute normally
   * - Track successes/failures
   * - Transition states appropriately
   */
  async execute(fn) {
    // TODO: Implement circuit breaker logic
    // if (this.state === CircuitState.OPEN) {
    //   // Check if timeout has passed
    //   if (Date.now() - this.lastFailureTime > this.config.CIRCUIT_TIMEOUT) {
    //     this.transitionTo(CircuitState.HALF_OPEN);
    //   } else {
    //     throw new Error(`Circuit breaker is OPEN for ${this.name}`);
    //   }
    // }

    // try {
    //   const result = await fn();
    //   this.onSuccess();
    //   return result;
    // } catch (error) {
    //   this.onFailure();
    //   throw error;
    // }
  }

  onSuccess() {
    // TODO: Handle success
    // this.failureCount = 0;
    //
    // if (this.state === CircuitState.HALF_OPEN) {
    //   this.successCount++;
    //   if (this.successCount >= this.config.CIRCUIT_SUCCESS_THRESHOLD) {
    //     this.transitionTo(CircuitState.CLOSED);
    //   }
    // }
  }

  onFailure() {
    // TODO: Handle failure
    // this.lastFailureTime = Date.now();
    // this.successCount = 0;
    // this.failureCount++;
    //
    // if (this.failureCount >= this.config.CIRCUIT_FAILURE_THRESHOLD) {
    //   this.transitionTo(CircuitState.OPEN);
    // }
  }

  transitionTo(newState) {
    // TODO: Transition state
    // const oldState = this.state;
    // this.state = newState;
    //
    // this.stateHistory.push({
    //   from: oldState,
    //   to: newState,
    //   timestamp: Date.now()
    // });
    //
    // if (newState === CircuitState.CLOSED) {
    //   this.failureCount = 0;
    //   this.successCount = 0;
    // }
    //
    // this.emit('stateChange', { from: oldState, to: newState, name: this.name });
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// ============================================================================
// Health Check Dependency
// ============================================================================

class HealthCheckDependency {
  /**
   * TODO 2: Implement Health Check Dependency
   *
   * Each dependency should have:
   * - Name and type (database, api, cache, etc.)
   * - Health check function
   * - Circuit breaker
   * - Recovery strategy
   * - Health history
   */
  constructor(name, checkFn, config) {
    this.name = name;
    this.checkFn = checkFn;
    this.config = config;
    this.circuitBreaker = new CircuitBreaker(name, config);
    this.isHealthy = true;
    this.lastCheckTime = null;
    this.lastError = null;
    this.healthHistory = [];
    this.recoveryAttempts = 0;
  }

  async check() {
    // TODO: Implement health check with circuit breaker
    // try {
    //   await this.circuitBreaker.execute(async () => {
    //     await this.checkFn();
    //   });
    //
    //   this.isHealthy = true;
    //   this.lastError = null;
    //   this.recoveryAttempts = 0;
    //   this.recordHealth(true);
    //   return { healthy: true, name: this.name };
    // } catch (error) {
    //   this.isHealthy = false;
    //   this.lastError = error.message;
    //   this.recordHealth(false);
    //   return { healthy: false, name: this.name, error: error.message };
    // } finally {
    //   this.lastCheckTime = Date.now();
    // }
  }

  recordHealth(healthy) {
    // TODO: Record health history
    // this.healthHistory.push({
    //   timestamp: Date.now(),
    //   healthy
    // });
    //
    // if (this.healthHistory.length > 100) {
    //   this.healthHistory.shift();
    // }
  }

  async attemptRecovery() {
    // TODO: Implement recovery with exponential backoff
    // if (this.recoveryAttempts >= this.config.MAX_RECOVERY_ATTEMPTS) {
    //   console.log(`⚠️  Max recovery attempts reached for ${this.name}`);
    //   return false;
    // }
    //
    // this.recoveryAttempts++;
    // const backoff = this.config.RECOVERY_BACKOFF_MS * Math.pow(2, this.recoveryAttempts - 1);
    //
    // console.log(`🔄 Attempting recovery for ${this.name} (attempt ${this.recoveryAttempts}/${this.config.MAX_RECOVERY_ATTEMPTS})`);
    // await new Promise(resolve => setTimeout(resolve, backoff));
    //
    // const result = await this.check();
    // return result.healthy;
  }

  getStatus() {
    return {
      name: this.name,
      healthy: this.isHealthy,
      lastCheckTime: this.lastCheckTime,
      lastError: this.lastError,
      circuitBreaker: this.circuitBreaker.getStatus(),
      recoveryAttempts: this.recoveryAttempts,
      uptime: this.calculateUptime()
    };
  }

  calculateUptime() {
    // TODO: Calculate uptime percentage
    // if (this.healthHistory.length === 0) return 100;
    //
    // const healthyChecks = this.healthHistory.filter(h => h.healthy).length;
    // return (healthyChecks / this.healthHistory.length) * 100;
  }
}

// ============================================================================
// Production Health Monitor
// ============================================================================

class ProductionHealthMonitor extends EventEmitter {
  /**
   * TODO 3: Implement Production Health Monitor
   *
   * The monitor should:
   * - Manage multiple dependencies
   * - Run periodic health checks (liveness, readiness)
   * - Calculate overall health score
   * - Trigger recovery for failed dependencies
   * - Provide detailed health reports
   * - Expose HTTP endpoints
   */
  constructor(config = CONFIG) {
    super();
    this.config = config;
    this.dependencies = new Map();
    this.isMonitoring = false;
    this.server = null;
    this.startTime = Date.now();

    // Timers
    this.livenessTimer = null;
    this.readinessTimer = null;
    this.dependencyTimer = null;

    // Statistics
    this.stats = {
      totalHealthChecks: 0,
      failedChecks: 0,
      recoveryAttempts: 0,
      successfulRecoveries: 0
    };
  }

  /**
   * TODO 4: Register dependency
   */
  registerDependency(name, checkFn) {
    // TODO: Register a new dependency
    // const dependency = new HealthCheckDependency(name, checkFn, this.config);
    //
    // // Listen to circuit breaker events
    // dependency.circuitBreaker.on('stateChange', ({ from, to, name }) => {
    //   console.log(`⚡ Circuit breaker for ${name}: ${from} -> ${to}`);
    //   this.emit('circuitStateChange', { dependency: name, from, to });
    // });
    //
    // this.dependencies.set(name, dependency);
    // console.log(`✅ Registered dependency: ${name}`);
  }

  /**
   * TODO 5: Liveness check
   *
   * Liveness probe - is the app alive?
   * - Check if process is responsive
   * - Check event loop is not blocked
   * - Return simple alive/dead status
   */
  async livenessCheck() {
    // TODO: Implement liveness check
    // const start = Date.now();
    // await new Promise(resolve => setImmediate(resolve));
    // const lag = Date.now() - start;
    //
    // return {
    //   alive: lag < 1000, // Event loop not severely blocked
    //   lag,
    //   uptime: process.uptime()
    // };
  }

  /**
   * TODO 6: Readiness check
   *
   * Readiness probe - can the app serve traffic?
   * - Check all critical dependencies
   * - Check resource availability
   * - Return ready/not-ready status
   */
  async readinessCheck() {
    // TODO: Implement readiness check
    // const checks = [];
    //
    // // Check all dependencies
    // for (const [name, dep] of this.dependencies) {
    //   const result = await dep.check();
    //   checks.push(result);
    // }
    //
    // const allHealthy = checks.every(c => c.healthy);
    //
    // return {
    //   ready: allHealthy,
    //   dependencies: checks,
    //   timestamp: Date.now()
    // };
  }

  /**
   * TODO 7: Calculate health score
   *
   * Calculate overall health score (0-100):
   * - Memory usage score
   * - CPU usage score
   * - Event loop lag score
   * - Dependencies health score
   * - Apply weights and return total
   */
  calculateHealthScore() {
    // TODO: Calculate health score
    // const memUsage = process.memoryUsage();
    // const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    // const memoryScore = Math.max(0, 100 - (heapUsedMB / 10)); // Penalty for high memory
    //
    // // Dependency score
    // let dependencyScore = 100;
    // if (this.dependencies.size > 0) {
    //   const healthyDeps = Array.from(this.dependencies.values())
    //     .filter(d => d.isHealthy).length;
    //   dependencyScore = (healthyDeps / this.dependencies.size) * 100;
    // }
    //
    // // Weighted total
    // const totalScore =
    //   (memoryScore * this.config.WEIGHTS.memory) +
    //   (dependencyScore * this.config.WEIGHTS.dependencies) +
    //   (80 * this.config.WEIGHTS.cpu) + // Simplified
    //   (80 * this.config.WEIGHTS.eventLoop); // Simplified
    //
    // return Math.round(totalScore);
  }

  /**
   * TODO 8: Generate health report
   */
  generateHealthReport() {
    // TODO: Generate comprehensive health report
    // const score = this.calculateHealthScore();
    // const depStatuses = Array.from(this.dependencies.values())
    //   .map(d => d.getStatus());
    //
    // return {
    //   score,
    //   status: score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'unhealthy',
    //   uptime: process.uptime(),
    //   memory: process.memoryUsage(),
    //   dependencies: depStatuses,
    //   statistics: this.stats,
    //   timestamp: new Date().toISOString()
    // };
  }

  /**
   * TODO 9: Start HTTP server for health endpoints
   */
  startHealthServer() {
    // TODO: Create HTTP server with health endpoints
    // this.server = http.createServer(async (req, res) => {
    //   res.setHeader('Content-Type', 'application/json');
    //
    //   if (req.url === '/health' || req.url === '/healthz') {
    //     const report = this.generateHealthReport();
    //     const statusCode = report.score >= 50 ? 200 : 503;
    //     res.writeHead(statusCode);
    //     res.end(JSON.stringify(report, null, 2));
    //   } else if (req.url === '/ready' || req.url === '/readyz') {
    //     const readiness = await this.readinessCheck();
    //     const statusCode = readiness.ready ? 200 : 503;
    //     res.writeHead(statusCode);
    //     res.end(JSON.stringify(readiness, null, 2));
    //   } else if (req.url === '/live' || req.url === '/livez') {
    //     const liveness = await this.livenessCheck();
    //     const statusCode = liveness.alive ? 200 : 503;
    //     res.writeHead(statusCode);
    //     res.end(JSON.stringify(liveness, null, 2));
    //   } else {
    //     res.writeHead(404);
    //     res.end(JSON.stringify({ error: 'Not found' }));
    //   }
    // });
    //
    // this.server.listen(this.config.HEALTH_PORT, () => {
    //   console.log(`🏥 Health server listening on port ${this.config.HEALTH_PORT}`);
    //   console.log(`   GET /health  - Overall health report`);
    //   console.log(`   GET /ready   - Readiness probe`);
    //   console.log(`   GET /live    - Liveness probe`);
    // });
  }

  /**
   * TODO 10: Start monitoring
   */
  start() {
    // TODO: Start all monitoring timers
    // if (this.isMonitoring) {
    //   console.log('Monitoring already active');
    //   return;
    // }
    //
    // this.isMonitoring = true;
    // console.log('🏥 Production Health Monitor Started\n');
    //
    // // Start health server
    // this.startHealthServer();
    //
    // // Start periodic checks
    // this.readinessTimer = setInterval(async () => {
    //   await this.readinessCheck();
    // }, this.config.READINESS_INTERVAL);
  }

  /**
   * TODO 11: Stop monitoring
   */
  stop() {
    // TODO: Stop monitoring and cleanup
    // if (!this.isMonitoring) return;
    //
    // clearInterval(this.livenessTimer);
    // clearInterval(this.readinessTimer);
    // clearInterval(this.dependencyTimer);
    //
    // if (this.server) {
    //   this.server.close();
    // }
    //
    // this.isMonitoring = false;
    // console.log('🛑 Health monitoring stopped');
  }
}

// ============================================================================
// Mock Dependencies for Testing
// ============================================================================

/**
 * TODO 12: Create mock dependencies for testing
 */
function createMockDependencies() {
  // TODO: Create mock database, cache, and API dependencies
  // return {
  //   database: async () => {
  //     // Simulate database check (randomly fails)
  //     await new Promise(resolve => setTimeout(resolve, 100));
  //     if (Math.random() < 0.1) throw new Error('Database connection failed');
  //   },
  //
  //   cache: async () => {
  //     // Simulate cache check
  //     await new Promise(resolve => setTimeout(resolve, 50));
  //     if (Math.random() < 0.05) throw new Error('Cache unavailable');
  //   },
  //
  //   externalAPI: async () => {
  //     // Simulate external API check (more likely to fail)
  //     await new Promise(resolve => setTimeout(resolve, 200));
  //     if (Math.random() < 0.2) throw new Error('External API timeout');
  //   }
  // };
}

// ============================================================================
// Main Execution
// ============================================================================

function main() {
  console.log('═'.repeat(70));
  console.log('PRODUCTION HEALTH MONITOR');
  console.log('═'.repeat(70));
  console.log();

  // TODO: Create monitor and register dependencies
  // const monitor = new ProductionHealthMonitor();
  //
  // const deps = createMockDependencies();
  // monitor.registerDependency('database', deps.database);
  // monitor.registerDependency('cache', deps.cache);
  // monitor.registerDependency('external-api', deps.externalAPI);
  //
  // monitor.start();

  // TODO: Handle shutdown
  // process.on('SIGINT', () => {
  //   console.log('\n\n🛑 Shutting down...');
  //   const report = monitor.generateHealthReport();
  //   console.log('\nFinal Health Report:');
  //   console.log(JSON.stringify(report, null, 2));
  //   monitor.stop();
  //   process.exit(0);
  // });

  console.log('💡 Press Ctrl+C to stop\n');
}

// TODO: Uncomment to run
// main();
