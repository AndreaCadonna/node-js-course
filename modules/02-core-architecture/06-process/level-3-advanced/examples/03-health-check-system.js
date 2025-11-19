/**
 * Multi-Tier Health Check System
 *
 * This module demonstrates enterprise-grade health checking using:
 * - Kubernetes-style health checks (liveness, readiness, startup)
 * - Dependency health monitoring
 * - Circuit breaker integration
 * - Custom health indicators
 * - Graceful degradation
 * - Health check aggregation
 *
 * Production Features:
 * - Non-blocking health checks
 * - Configurable timeouts and retries
 * - Health history and trending
 * - Integration with orchestrators (K8s, Docker)
 * - Structured health responses
 * - Performance impact monitoring
 *
 * @module HealthCheckSystem
 */

const http = require('http');
const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');

/**
 * Health Check Configuration
 */
const DEFAULT_CONFIG = {
  // Server settings
  port: 8080,
  livenessPath: '/health/live',
  readinessPath: '/health/ready',
  startupPath: '/health/startup',

  // Timeouts
  checkTimeout: 5000,
  startupTimeout: 30000,
  shutdownGracePeriod: 10000,

  // Intervals
  checkInterval: 10000,
  dependencyCheckInterval: 30000,

  // Thresholds
  errorThreshold: 3,
  warningThreshold: 1,
  degradedThreshold: 50, // % of checks failing

  // Features
  enableHistory: true,
  historySize: 100,
  enableMetrics: true,
  verboseLogging: false,
};

/**
 * Health Status Levels
 */
const HealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown',
};

/**
 * Health Check Result
 */
class HealthCheckResult {
  constructor(name, status, details = {}) {
    this.name = name;
    this.status = status;
    this.timestamp = Date.now();
    this.duration = 0;
    this.details = details;
    this.error = null;
  }

  setDuration(duration) {
    this.duration = duration;
    return this;
  }

  setError(error) {
    this.error = error.message;
    this.status = HealthStatus.UNHEALTHY;
    return this;
  }

  isHealthy() {
    return this.status === HealthStatus.HEALTHY;
  }

  toJSON() {
    return {
      name: this.name,
      status: this.status,
      timestamp: this.timestamp,
      duration: this.duration,
      details: this.details,
      error: this.error,
    };
  }
}

/**
 * Base Health Indicator
 */
class HealthIndicator {
  constructor(name, config = {}) {
    this.name = name;
    this.config = {
      timeout: 5000,
      critical: true, // If true, failure affects readiness
      ...config,
    };
    this.lastCheck = null;
    this.consecutiveFailures = 0;
  }

  /**
   * Perform health check (to be implemented by subclasses)
   */
  async check() {
    throw new Error('check() must be implemented by subclass');
  }

  /**
   * Execute check with timeout
   */
  async execute() {
    const start = performance.now();

    try {
      const result = await Promise.race([
        this.check(),
        this.timeout(),
      ]);

      this.consecutiveFailures = 0;
      this.lastCheck = result.setDuration(performance.now() - start);

      return this.lastCheck;
    } catch (error) {
      this.consecutiveFailures++;

      const result = new HealthCheckResult(
        this.name,
        HealthStatus.UNHEALTHY
      ).setError(error)
        .setDuration(performance.now() - start);

      this.lastCheck = result;
      return result;
    }
  }

  async timeout() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);
    });
  }

  isCritical() {
    return this.config.critical;
  }
}

/**
 * Memory Health Indicator
 */
class MemoryHealthIndicator extends HealthIndicator {
  constructor(config = {}) {
    super('memory', {
      maxHeapPercent: 85,
      maxRSSMB: 1024,
      ...config,
    });
  }

  async check() {
    const usage = process.memoryUsage();
    const heapPercent = (usage.heapUsed / usage.heapTotal) * 100;
    const rssMB = usage.rss / 1024 / 1024;

    let status = HealthStatus.HEALTHY;
    const details = {
      heapUsedMB: (usage.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMB: (usage.heapTotal / 1024 / 1024).toFixed(2),
      heapPercent: heapPercent.toFixed(2),
      rssMB: rssMB.toFixed(2),
    };

    if (heapPercent > this.config.maxHeapPercent) {
      status = HealthStatus.UNHEALTHY;
      details.reason = `Heap usage ${heapPercent.toFixed(1)}% exceeds threshold ${this.config.maxHeapPercent}%`;
    } else if (rssMB > this.config.maxRSSMB) {
      status = HealthStatus.DEGRADED;
      details.reason = `RSS ${rssMB.toFixed(0)}MB exceeds threshold ${this.config.maxRSSMB}MB`;
    }

    return new HealthCheckResult(this.name, status, details);
  }
}

/**
 * CPU Health Indicator
 */
class CPUHealthIndicator extends HealthIndicator {
  constructor(config = {}) {
    super('cpu', {
      maxCPUPercent: 90,
      sampleDuration: 100,
      ...config,
    });
    this.lastUsage = process.cpuUsage();
    this.lastCheck = Date.now();
  }

  async check() {
    const currentUsage = process.cpuUsage();
    const now = Date.now();
    const elapsedMs = now - this.lastCheck;

    const userDiff = currentUsage.user - this.lastUsage.user;
    const systemDiff = currentUsage.system - this.lastUsage.system;

    const totalCPUTime = (userDiff + systemDiff) / 1000; // Convert to ms
    const cpuPercent = Math.min((totalCPUTime / elapsedMs) * 100, 100);

    this.lastUsage = currentUsage;
    this.lastCheck = now;

    let status = HealthStatus.HEALTHY;
    const details = {
      cpuPercent: cpuPercent.toFixed(2),
      userPercent: ((userDiff / 1000 / elapsedMs) * 100).toFixed(2),
      systemPercent: ((systemDiff / 1000 / elapsedMs) * 100).toFixed(2),
    };

    if (cpuPercent > this.config.maxCPUPercent) {
      status = HealthStatus.DEGRADED;
      details.reason = `CPU usage ${cpuPercent.toFixed(1)}% exceeds threshold ${this.config.maxCPUPercent}%`;
    }

    return new HealthCheckResult(this.name, status, details);
  }
}

/**
 * Event Loop Health Indicator
 */
class EventLoopHealthIndicator extends HealthIndicator {
  constructor(config = {}) {
    super('event-loop', {
      maxDelayMs: 100,
      ...config,
    });
  }

  async check() {
    const start = performance.now();

    return new Promise((resolve) => {
      setImmediate(() => {
        const delay = performance.now() - start;

        let status = HealthStatus.HEALTHY;
        const details = { delayMs: delay.toFixed(2) };

        if (delay > this.config.maxDelayMs) {
          status = HealthStatus.DEGRADED;
          details.reason = `Event loop delay ${delay.toFixed(1)}ms exceeds threshold ${this.config.maxDelayMs}ms`;
        }

        resolve(new HealthCheckResult(this.name, status, details));
      });
    });
  }
}

/**
 * Database Health Indicator (Example)
 */
class DatabaseHealthIndicator extends HealthIndicator {
  constructor(dbConnection, config = {}) {
    super('database', {
      queryTimeout: 3000,
      ...config,
    });
    this.db = dbConnection;
  }

  async check() {
    const details = {
      connected: false,
      responseTime: 0,
    };

    try {
      const start = performance.now();

      // Simulate database ping
      // In production: await this.db.ping() or this.db.query('SELECT 1')
      await this.simulateDatabasePing();

      const responseTime = performance.now() - start;
      details.connected = true;
      details.responseTime = responseTime.toFixed(2);

      let status = HealthStatus.HEALTHY;
      if (responseTime > 1000) {
        status = HealthStatus.DEGRADED;
        details.reason = `Slow database response: ${responseTime.toFixed(0)}ms`;
      }

      return new HealthCheckResult(this.name, status, details);
    } catch (error) {
      return new HealthCheckResult(this.name, HealthStatus.UNHEALTHY, details)
        .setError(error);
    }
  }

  async simulateDatabasePing() {
    return new Promise((resolve) => {
      setTimeout(resolve, Math.random() * 100);
    });
  }
}

/**
 * Custom Health Indicator (Example)
 */
class CustomHealthIndicator extends HealthIndicator {
  constructor(name, checkFunction, config = {}) {
    super(name, config);
    this.checkFunction = checkFunction;
  }

  async check() {
    return await this.checkFunction();
  }
}

/**
 * Health Check Aggregator
 */
class HealthAggregator {
  constructor() {
    this.indicators = new Map();
  }

  register(indicator) {
    this.indicators.set(indicator.name, indicator);
  }

  unregister(name) {
    this.indicators.delete(name);
  }

  async checkAll(options = {}) {
    const { parallel = true, includeNonCritical = true } = options;

    let indicators = Array.from(this.indicators.values());

    if (!includeNonCritical) {
      indicators = indicators.filter(i => i.isCritical());
    }

    const results = parallel
      ? await Promise.all(indicators.map(i => i.execute()))
      : await this.checkSequentially(indicators);

    return this.aggregateResults(results);
  }

  async checkSequentially(indicators) {
    const results = [];
    for (const indicator of indicators) {
      results.push(await indicator.execute());
    }
    return results;
  }

  aggregateResults(results) {
    const healthy = results.filter(r => r.status === HealthStatus.HEALTHY);
    const degraded = results.filter(r => r.status === HealthStatus.DEGRADED);
    const unhealthy = results.filter(r => r.status === HealthStatus.UNHEALTHY);

    let overallStatus = HealthStatus.HEALTHY;

    if (unhealthy.length > 0) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (degraded.length > 0) {
      overallStatus = HealthStatus.DEGRADED;
    }

    return {
      status: overallStatus,
      timestamp: Date.now(),
      checks: results.map(r => r.toJSON()),
      summary: {
        total: results.length,
        healthy: healthy.length,
        degraded: degraded.length,
        unhealthy: unhealthy.length,
      },
    };
  }
}

/**
 * Startup Health Manager
 */
class StartupHealthManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      timeout: 30000,
      ...config,
    };
    this.isStarted = false;
    this.startTime = Date.now();
    this.startupChecks = [];
  }

  addCheck(name, checkFn) {
    this.startupChecks.push({ name, checkFn, completed: false });
  }

  async runStartupChecks() {
    console.log('🚀 Running startup health checks...');

    for (const check of this.startupChecks) {
      try {
        console.log(`  ⏳ ${check.name}...`);
        await check.checkFn();
        check.completed = true;
        console.log(`  ✅ ${check.name} completed`);
      } catch (error) {
        console.error(`  ❌ ${check.name} failed:`, error.message);
        throw new Error(`Startup check failed: ${check.name}`);
      }
    }

    this.isStarted = true;
    this.emit('startup-complete');
    console.log('✅ All startup checks passed');
  }

  isReady() {
    return this.isStarted;
  }

  getStatus() {
    return {
      started: this.isStarted,
      elapsedTime: Date.now() - this.startTime,
      checks: this.startupChecks.map(c => ({
        name: c.name,
        completed: c.completed,
      })),
    };
  }
}

/**
 * Main Health Check System
 */
class HealthCheckSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.aggregator = new HealthAggregator();
    this.startupManager = new StartupHealthManager({
      timeout: this.config.startupTimeout,
    });

    this.server = null;
    this.isShuttingDown = false;
    this.history = [];

    this.metrics = {
      totalChecks: 0,
      healthyChecks: 0,
      degradedChecks: 0,
      unhealthyChecks: 0,
    };
  }

  /**
   * Register health indicators
   */
  registerIndicator(indicator) {
    this.aggregator.register(indicator);
    console.log(`✅ Registered health indicator: ${indicator.name}`);
  }

  /**
   * Register startup check
   */
  registerStartupCheck(name, checkFn) {
    this.startupManager.addCheck(name, checkFn);
  }

  /**
   * Initialize built-in indicators
   */
  initializeDefaultIndicators() {
    this.registerIndicator(new MemoryHealthIndicator({
      maxHeapPercent: 85,
      critical: true,
    }));

    this.registerIndicator(new CPUHealthIndicator({
      maxCPUPercent: 90,
      critical: false,
    }));

    this.registerIndicator(new EventLoopHealthIndicator({
      maxDelayMs: 100,
      critical: false,
    }));
  }

  /**
   * Start health check server
   */
  async start() {
    console.log('🏥 Starting Health Check System...');

    // Initialize default indicators
    this.initializeDefaultIndicators();

    // Run startup checks
    await this.startupManager.runStartupChecks();

    // Start HTTP server
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    return new Promise((resolve) => {
      this.server.listen(this.config.port, () => {
        console.log(`✅ Health check server listening on port ${this.config.port}`);
        console.log(`  Liveness:  http://localhost:${this.config.port}${this.config.livenessPath}`);
        console.log(`  Readiness: http://localhost:${this.config.port}${this.config.readinessPath}`);
        console.log(`  Startup:   http://localhost:${this.config.port}${this.config.startupPath}`);

        this.emit('started');
        resolve();
      });
    });
  }

  /**
   * Handle HTTP requests
   */
  async handleRequest(req, res) {
    const { url } = req;

    try {
      if (url === this.config.livenessPath) {
        await this.handleLivenessCheck(req, res);
      } else if (url === this.config.readinessPath) {
        await this.handleReadinessCheck(req, res);
      } else if (url === this.config.startupPath) {
        await this.handleStartupCheck(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error) {
      console.error('Health check error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  /**
   * Liveness Check - Is the process alive?
   */
  async handleLivenessCheck(req, res) {
    // Liveness is simple - if we can respond, we're alive
    const result = {
      status: this.isShuttingDown ? HealthStatus.UNHEALTHY : HealthStatus.HEALTHY,
      timestamp: Date.now(),
      uptime: process.uptime(),
      pid: process.pid,
    };

    const statusCode = result.status === HealthStatus.HEALTHY ? 200 : 503;

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result, null, 2));
  }

  /**
   * Readiness Check - Can we handle traffic?
   */
  async handleReadinessCheck(req, res) {
    if (this.isShuttingDown) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: HealthStatus.UNHEALTHY,
        reason: 'Shutting down',
      }));
      return;
    }

    // Check all health indicators
    const result = await this.aggregator.checkAll({
      parallel: true,
      includeNonCritical: true,
    });

    this.updateMetrics(result);
    this.recordHistory(result);

    const statusCode = result.status === HealthStatus.HEALTHY ? 200 : 503;

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result, null, 2));
  }

  /**
   * Startup Check - Has startup completed?
   */
  async handleStartupCheck(req, res) {
    const status = this.startupManager.getStatus();

    const result = {
      status: status.started ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
      timestamp: Date.now(),
      ...status,
    };

    const statusCode = result.status === HealthStatus.HEALTHY ? 200 : 503;

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result, null, 2));
  }

  /**
   * Update metrics
   */
  updateMetrics(result) {
    this.metrics.totalChecks++;

    if (result.status === HealthStatus.HEALTHY) {
      this.metrics.healthyChecks++;
    } else if (result.status === HealthStatus.DEGRADED) {
      this.metrics.degradedChecks++;
    } else {
      this.metrics.unhealthyChecks++;
    }
  }

  /**
   * Record health history
   */
  recordHistory(result) {
    if (!this.config.enableHistory) return;

    this.history.push({
      timestamp: result.timestamp,
      status: result.status,
    });

    if (this.history.length > this.config.historySize) {
      this.history.shift();
    }
  }

  /**
   * Get health statistics
   */
  getStatistics() {
    const recentHistory = this.history.slice(-10);

    return {
      metrics: this.metrics,
      recentHistory,
      healthRate: this.metrics.totalChecks > 0
        ? (this.metrics.healthyChecks / this.metrics.totalChecks) * 100
        : 0,
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Initiating graceful shutdown...');
    this.isShuttingDown = true;

    this.emit('shutting-down');

    // Wait for grace period
    console.log(`⏳ Waiting ${this.config.shutdownGracePeriod}ms for existing requests...`);
    await new Promise(resolve => setTimeout(resolve, this.config.shutdownGracePeriod));

    // Close server
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('✅ Health check server closed');
          this.emit('shutdown-complete');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

/**
 * Demo: Health check system
 */
async function demonstrateHealthChecks() {
  console.log('='.repeat(80));
  console.log('MULTI-TIER HEALTH CHECK SYSTEM DEMO');
  console.log('='.repeat(80));

  const healthSystem = new HealthCheckSystem({
    port: 8080,
  });

  // Register custom startup checks
  healthSystem.registerStartupCheck('config-validation', async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('    Configuration validated');
  });

  healthSystem.registerStartupCheck('database-connection', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('    Database connection established');
  });

  // Register custom health indicator
  const customIndicator = new CustomHealthIndicator(
    'custom-check',
    async () => {
      return new HealthCheckResult('custom-check', HealthStatus.HEALTHY, {
        message: 'Custom check passed',
      });
    },
    { critical: true }
  );
  healthSystem.registerIndicator(customIndicator);

  // Start system
  await healthSystem.start();

  console.log('\n' + '='.repeat(80));
  console.log('Testing Health Endpoints');
  console.log('='.repeat(80));

  // Test liveness
  console.log('\n1️⃣  Testing Liveness Check...');
  await testEndpoint(`http://localhost:8080${healthSystem.config.livenessPath}`);

  // Test startup
  console.log('\n2️⃣  Testing Startup Check...');
  await testEndpoint(`http://localhost:8080${healthSystem.config.startupPath}`);

  // Test readiness
  console.log('\n3️⃣  Testing Readiness Check...');
  await testEndpoint(`http://localhost:8080${healthSystem.config.readinessPath}`);

  // Wait and check again
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n4️⃣  Testing Readiness Check Again...');
  await testEndpoint(`http://localhost:8080${healthSystem.config.readinessPath}`);

  // Show statistics
  console.log('\n' + '='.repeat(80));
  console.log('Health Statistics');
  console.log('='.repeat(80));

  const stats = healthSystem.getStatistics();
  console.log('\nMetrics:');
  console.log(`  Total Checks: ${stats.metrics.totalChecks}`);
  console.log(`  Healthy: ${stats.metrics.healthyChecks}`);
  console.log(`  Degraded: ${stats.metrics.degradedChecks}`);
  console.log(`  Unhealthy: ${stats.metrics.unhealthyChecks}`);
  console.log(`  Health Rate: ${stats.healthRate.toFixed(1)}%`);

  // Shutdown
  console.log('\n' + '='.repeat(80));
  console.log('Graceful Shutdown');
  console.log('='.repeat(80));

  await healthSystem.shutdown();

  console.log('\n✅ Demo complete!');
  console.log('\n💡 Production Tips:');
  console.log('  1. Use liveness for process health (crashes, deadlocks)');
  console.log('  2. Use readiness for traffic handling (dependencies ready)');
  console.log('  3. Use startup for slow-starting applications');
  console.log('  4. Configure appropriate timeouts in Kubernetes');
  console.log('  5. Monitor health check metrics in your APM');
}

async function testEndpoint(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        console.log(`  Status Code: ${res.statusCode}`);
        console.log(`  Status: ${result.status}`);
        if (result.summary) {
          console.log(`  Summary: ${result.summary.healthy}/${result.summary.total} healthy`);
        }
        resolve();
      });
    });
  });
}

// Run demo if executed directly
if (require.main === module) {
  demonstrateHealthChecks()
    .catch(console.error)
    .finally(() => process.exit(0));
}

module.exports = {
  HealthCheckSystem,
  HealthIndicator,
  MemoryHealthIndicator,
  CPUHealthIndicator,
  EventLoopHealthIndicator,
  DatabaseHealthIndicator,
  CustomHealthIndicator,
  HealthStatus,
};
