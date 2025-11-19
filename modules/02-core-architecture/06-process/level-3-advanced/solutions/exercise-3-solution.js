/**
 * SOLUTION: Exercise 3 - Production Health Monitor
 * =================================================
 *
 * Comprehensive production health monitoring with multi-tier checks,
 * circuit breakers, auto-recovery, and HTTP health endpoints.
 *
 * FEATURES:
 * - Liveness, readiness, and startup probes
 * - Circuit breaker pattern for dependencies
 * - Automatic recovery with exponential backoff
 * - Health score calculation
 * - HTTP endpoints for K8s integration
 */

const http = require('http');
const EventEmitter = require('events');

const CONFIG = {
  LIVENESS_INTERVAL: 10000,
  READINESS_INTERVAL: 5000,
  DEPENDENCY_CHECK_INTERVAL: 30000,
  CIRCUIT_FAILURE_THRESHOLD: 5,
  CIRCUIT_SUCCESS_THRESHOLD: 3,
  CIRCUIT_TIMEOUT: 60000,
  MAX_RECOVERY_ATTEMPTS: 3,
  RECOVERY_BACKOFF_MS: 5000,
  WEIGHTS: { memory: 0.2, cpu: 0.15, eventLoop: 0.15, dependencies: 0.5 },
  HEALTH_PORT: 3000,
};

const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

class CircuitBreaker extends EventEmitter {
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

  async execute(fn) {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.CIRCUIT_TIMEOUT) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
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
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.CIRCUIT_SUCCESS_THRESHOLD) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  onFailure() {
    this.lastFailureTime = Date.now();
    this.successCount = 0;
    this.failureCount++;

    if (this.failureCount >= this.config.CIRCUIT_FAILURE_THRESHOLD) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;

    this.stateHistory.push({
      from: oldState,
      to: newState,
      timestamp: Date.now()
    });

    if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
    }

    console.log(`⚡ Circuit breaker [${this.name}]: ${oldState} -> ${newState}`);
    this.emit('stateChange', { from: oldState, to: newState, name: this.name });
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

class HealthCheckDependency {
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
    try {
      await this.circuitBreaker.execute(async () => {
        await this.checkFn();
      });

      this.isHealthy = true;
      this.lastError = null;
      this.recoveryAttempts = 0;
      this.recordHealth(true);
      return { healthy: true, name: this.name };
    } catch (error) {
      this.isHealthy = false;
      this.lastError = error.message;
      this.recordHealth(false);
      return { healthy: false, name: this.name, error: error.message };
    } finally {
      this.lastCheckTime = Date.now();
    }
  }

  recordHealth(healthy) {
    this.healthHistory.push({
      timestamp: Date.now(),
      healthy
    });

    if (this.healthHistory.length > 100) {
      this.healthHistory.shift();
    }
  }

  async attemptRecovery() {
    if (this.recoveryAttempts >= this.config.MAX_RECOVERY_ATTEMPTS) {
      console.log(`⚠️  Max recovery attempts reached for ${this.name}`);
      return false;
    }

    this.recoveryAttempts++;
    const backoff = this.config.RECOVERY_BACKOFF_MS * Math.pow(2, this.recoveryAttempts - 1);

    console.log(`🔄 Attempting recovery for ${this.name} (attempt ${this.recoveryAttempts}/${this.config.MAX_RECOVERY_ATTEMPTS})`);
    await new Promise(resolve => setTimeout(resolve, backoff));

    const result = await this.check();
    return result.healthy;
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
    if (this.healthHistory.length === 0) return 100;

    const healthyChecks = this.healthHistory.filter(h => h.healthy).length;
    return (healthyChecks / this.healthHistory.length) * 100;
  }
}

class ProductionHealthMonitor extends EventEmitter {
  constructor(config = CONFIG) {
    super();
    this.config = config;
    this.dependencies = new Map();
    this.isMonitoring = false;
    this.server = null;
    this.startTime = Date.now();
    this.readinessTimer = null;

    this.stats = {
      totalHealthChecks: 0,
      failedChecks: 0,
      recoveryAttempts: 0,
      successfulRecoveries: 0
    };
  }

  registerDependency(name, checkFn) {
    const dependency = new HealthCheckDependency(name, checkFn, this.config);

    dependency.circuitBreaker.on('stateChange', ({ from, to, name }) => {
      this.emit('circuitStateChange', { dependency: name, from, to });

      // Attempt recovery when circuit opens
      if (to === CircuitState.OPEN) {
        setTimeout(async () => {
          this.stats.recoveryAttempts++;
          const recovered = await dependency.attemptRecovery();
          if (recovered) {
            this.stats.successfulRecoveries++;
            console.log(`✅ Successfully recovered ${name}`);
          }
        }, 1000);
      }
    });

    this.dependencies.set(name, dependency);
    console.log(`✅ Registered dependency: ${name}`);
  }

  async livenessCheck() {
    const start = Date.now();
    await new Promise(resolve => setImmediate(resolve));
    const lag = Date.now() - start;

    return {
      alive: lag < 1000,
      lag,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  async readinessCheck() {
    const checks = [];

    for (const [name, dep] of this.dependencies) {
      const result = await dep.check();
      checks.push(result);
      this.stats.totalHealthChecks++;
      if (!result.healthy) {
        this.stats.failedChecks++;
      }
    }

    const allHealthy = checks.every(c => c.healthy);

    return {
      ready: allHealthy,
      dependencies: checks,
      timestamp: new Date().toISOString()
    };
  }

  calculateHealthScore() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const memoryScore = Math.max(0, 100 - (heapUsedMB / 10));

    let dependencyScore = 100;
    if (this.dependencies.size > 0) {
      const healthyDeps = Array.from(this.dependencies.values())
        .filter(d => d.isHealthy).length;
      dependencyScore = (healthyDeps / this.dependencies.size) * 100;
    }

    const totalScore =
      (memoryScore * this.config.WEIGHTS.memory) +
      (dependencyScore * this.config.WEIGHTS.dependencies) +
      (80 * this.config.WEIGHTS.cpu) +
      (80 * this.config.WEIGHTS.eventLoop);

    return Math.round(totalScore);
  }

  generateHealthReport() {
    const score = this.calculateHealthScore();
    const depStatuses = Array.from(this.dependencies.values())
      .map(d => d.getStatus());

    return {
      score,
      status: score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'unhealthy',
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      dependencies: depStatuses,
      statistics: this.stats,
      timestamp: new Date().toISOString()
    };
  }

  startHealthServer() {
    this.server = http.createServer(async (req, res) => {
      res.setHeader('Content-Type', 'application/json');

      if (req.url === '/health' || req.url === '/healthz') {
        const report = this.generateHealthReport();
        const statusCode = report.score >= 50 ? 200 : 503;
        res.writeHead(statusCode);
        res.end(JSON.stringify(report, null, 2));
      } else if (req.url === '/ready' || req.url === '/readyz') {
        const readiness = await this.readinessCheck();
        const statusCode = readiness.ready ? 200 : 503;
        res.writeHead(statusCode);
        res.end(JSON.stringify(readiness, null, 2));
      } else if (req.url === '/live' || req.url === '/livez') {
        const liveness = await this.livenessCheck();
        const statusCode = liveness.alive ? 200 : 503;
        res.writeHead(statusCode);
        res.end(JSON.stringify(liveness, null, 2));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    this.server.listen(this.config.HEALTH_PORT, () => {
      console.log(`🏥 Health server listening on port ${this.config.HEALTH_PORT}`);
      console.log(`   GET /health  - Overall health report`);
      console.log(`   GET /ready   - Readiness probe`);
      console.log(`   GET /live    - Liveness probe\n`);
    });
  }

  start() {
    if (this.isMonitoring) {
      console.log('Monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🏥 Production Health Monitor Started\n');

    this.startHealthServer();

    this.readinessTimer = setInterval(async () => {
      const result = await this.readinessCheck();
      const icon = result.ready ? '✅' : '❌';
      console.log(`${icon} Readiness check: ${result.ready ? 'READY' : 'NOT READY'}`);
    }, this.config.READINESS_INTERVAL);
  }

  stop() {
    if (!this.isMonitoring) return;

    clearInterval(this.readinessTimer);

    if (this.server) {
      this.server.close();
    }

    const report = this.generateHealthReport();
    console.log('\n📊 Final Health Report:');
    console.log(JSON.stringify(report, null, 2));

    this.isMonitoring = false;
    console.log('🛑 Health monitoring stopped');
  }
}

// Mock dependencies
function createMockDependencies() {
  return {
    database: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (Math.random() < 0.1) throw new Error('Database connection failed');
    },

    cache: async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      if (Math.random() < 0.05) throw new Error('Cache unavailable');
    },

    externalAPI: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      if (Math.random() < 0.2) throw new Error('External API timeout');
    }
  };
}

// Main
function main() {
  console.log('═'.repeat(70));
  console.log('PRODUCTION HEALTH MONITOR');
  console.log('═'.repeat(70));
  console.log();

  const monitor = new ProductionHealthMonitor();

  const deps = createMockDependencies();
  monitor.registerDependency('database', deps.database);
  monitor.registerDependency('cache', deps.cache);
  monitor.registerDependency('external-api', deps.externalAPI);

  monitor.start();

  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...');
    monitor.stop();
    process.exit(0);
  });

  console.log('💡 Try: curl http://localhost:3000/health');
  console.log('💡 Press Ctrl+C to stop\n');
}

main();
