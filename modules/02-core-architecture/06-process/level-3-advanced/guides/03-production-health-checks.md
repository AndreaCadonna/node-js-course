# Production Health Checks

## Table of Contents
- [Introduction](#introduction)
- [Health Check Fundamentals](#health-check-fundamentals)
- [Multi-Tier Health Checks](#multi-tier-health-checks)
- [Kubernetes Integration](#kubernetes-integration)
- [Load Balancer Integration](#load-balancer-integration)
- [Monitoring Integration](#monitoring-integration)
- [Case Studies](#case-studies)
- [Best Practices](#best-practices)
- [Anti-Patterns](#anti-patterns)

## Introduction

Health checks are critical for maintaining high availability in production systems. They enable load balancers, orchestrators, and monitoring systems to make informed decisions about routing traffic and managing instances.

### Why Health Checks Matter

```javascript
/**
 * Understanding Health Check Impact
 *
 * Health checks enable:
 * - Automatic failover
 * - Rolling deployments
 * - Load balancing decisions
 * - Autoscaling triggers
 * - Incident detection
 */

class HealthCheckImpact {
  /**
   * Without proper health checks
   */
  static demonstrateWithoutHealthChecks() {
    console.log('=== Without Health Checks ===');
    console.log('Problems:');
    console.log('  - Traffic sent to unhealthy instances');
    console.log('  - Failed deployments go undetected');
    console.log('  - Cascading failures');
    console.log('  - Extended downtime');
    console.log('  - Manual intervention required');
    console.log();
  }

  /**
   * With proper health checks
   */
  static demonstrateWithHealthChecks() {
    console.log('=== With Health Checks ===');
    console.log('Benefits:');
    console.log('  - Automatic removal of unhealthy instances');
    console.log('  - Zero-downtime deployments');
    console.log('  - Fast failure detection');
    console.log('  - Automatic recovery');
    console.log('  - Reduced MTTR (Mean Time To Recovery)');
    console.log();
  }
}

if (require.main === module) {
  HealthCheckImpact.demonstrateWithoutHealthChecks();
  HealthCheckImpact.demonstrateWithHealthChecks();
}
```

## Health Check Fundamentals

### Basic Health Check Implementation

```javascript
/**
 * Fundamental health check implementation
 */

const express = require('express');

class BasicHealthCheck {
  constructor() {
    this.startTime = Date.now();
    this.isShuttingDown = false;
  }

  /**
   * Simple health endpoint
   */
  getSimpleHandler() {
    return (req, res) => {
      if (this.isShuttingDown) {
        return res.status(503).json({
          status: 'unhealthy',
          reason: 'shutting down'
        });
      }

      res.status(200).json({
        status: 'healthy',
        uptime: Date.now() - this.startTime
      });
    };
  }

  /**
   * Mark as shutting down (for graceful shutdown)
   */
  markShuttingDown() {
    this.isShuttingDown = true;
  }
}

// Usage
const app = express();
const healthCheck = new BasicHealthCheck();

app.get('/health', healthCheck.getSimpleHandler());

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, marking as unhealthy');
  healthCheck.markShuttingDown();

  // Give load balancer time to stop routing traffic
  setTimeout(() => {
    console.log('Shutting down');
    process.exit(0);
  }, 10000);
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log('Server with basic health check running on port 3000');
  });
}
```

### Advanced Health Check

```javascript
/**
 * Comprehensive health check with dependency checks
 */

class AdvancedHealthCheck {
  constructor(options = {}) {
    this.startTime = Date.now();
    this.isShuttingDown = false;
    this.dependencies = new Map();
    this.cache = {
      result: null,
      timestamp: 0,
      ttl: options.cacheTTL || 5000 // Cache for 5 seconds
    };
  }

  /**
   * Register a dependency to check
   */
  registerDependency(name, checkFn, options = {}) {
    this.dependencies.set(name, {
      name,
      checkFn,
      critical: options.critical !== false, // Critical by default
      timeout: options.timeout || 5000,
      lastCheck: null,
      lastStatus: null
    });
  }

  /**
   * Check a single dependency
   */
  async checkDependency(dependency) {
    const startTime = Date.now();

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), dependency.timeout)
      );

      const checkPromise = dependency.checkFn();

      await Promise.race([checkPromise, timeoutPromise]);

      const duration = Date.now() - startTime;

      dependency.lastCheck = Date.now();
      dependency.lastStatus = 'healthy';

      return {
        name: dependency.name,
        status: 'healthy',
        duration,
        critical: dependency.critical
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      dependency.lastCheck = Date.now();
      dependency.lastStatus = 'unhealthy';

      return {
        name: dependency.name,
        status: 'unhealthy',
        error: error.message,
        duration,
        critical: dependency.critical
      };
    }
  }

  /**
   * Check all dependencies
   */
  async checkAllDependencies() {
    const checks = Array.from(this.dependencies.values()).map(dep =>
      this.checkDependency(dep)
    );

    return await Promise.all(checks);
  }

  /**
   * Get health status
   */
  async getHealth() {
    // Return cached result if still valid
    const now = Date.now();
    if (this.cache.result && (now - this.cache.timestamp) < this.cache.ttl) {
      return this.cache.result;
    }

    // Check if shutting down
    if (this.isShuttingDown) {
      return {
        status: 'unhealthy',
        reason: 'shutting down',
        timestamp: new Date().toISOString()
      };
    }

    // Check all dependencies
    const checks = await this.checkAllDependencies();

    // Determine overall status
    const criticalFailure = checks.find(
      check => check.critical && check.status === 'unhealthy'
    );

    const status = criticalFailure ? 'unhealthy' : 'healthy';

    const result = {
      status,
      uptime: now - this.startTime,
      timestamp: new Date().toISOString(),
      checks: checks.reduce((acc, check) => {
        acc[check.name] = {
          status: check.status,
          duration: check.duration,
          ...(check.error && { error: check.error })
        };
        return acc;
      }, {})
    };

    // Cache result
    this.cache.result = result;
    this.cache.timestamp = now;

    return result;
  }

  /**
   * Express middleware
   */
  middleware() {
    return async (req, res) => {
      try {
        const health = await this.getHealth();
        const statusCode = health.status === 'healthy' ? 200 : 503;

        res.status(statusCode).json(health);
      } catch (error) {
        console.error('Health check error:', error);
        res.status(503).json({
          status: 'unhealthy',
          error: 'Health check failed',
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Mark as shutting down
   */
  markShuttingDown() {
    this.isShuttingDown = true;
    this.cache.result = null; // Clear cache
  }
}

// Usage example
async function setupHealthCheck() {
  const healthCheck = new AdvancedHealthCheck({ cacheTTL: 5000 });

  // Register database check
  healthCheck.registerDependency('database', async () => {
    // Simulate database check
    const db = await getDatabase();
    await db.ping();
  }, { critical: true, timeout: 3000 });

  // Register Redis check
  healthCheck.registerDependency('redis', async () => {
    const redis = await getRedis();
    await redis.ping();
  }, { critical: true, timeout: 2000 });

  // Register external API check
  healthCheck.registerDependency('externalAPI', async () => {
    const response = await fetch('https://api.example.com/health');
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
  }, { critical: false, timeout: 5000 });

  return healthCheck;
}

// Mock dependencies
async function getDatabase() {
  return { ping: async () => {} };
}

async function getRedis() {
  return { ping: async () => {} };
}

if (require.main === module) {
  setupHealthCheck().then(healthCheck => {
    const app = express();

    app.get('/health', healthCheck.middleware());

    app.listen(3000, () => {
      console.log('Server with advanced health check running on port 3000');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      healthCheck.markShuttingDown();

      setTimeout(() => {
        process.exit(0);
      }, 10000);
    });
  });
}
```

## Multi-Tier Health Checks

### Liveness vs Readiness vs Startup

```javascript
/**
 * Multi-tier health checks for different purposes
 *
 * - Liveness: Is the application alive?
 * - Readiness: Is the application ready to receive traffic?
 * - Startup: Has the application finished starting up?
 */

class MultiTierHealthCheck {
  constructor() {
    this.startTime = Date.now();
    this.isStarted = false;
    this.isReady = false;
    this.isShuttingDown = false;
    this.dependencies = new Map();
    this.initializationTasks = [];
  }

  /**
   * Liveness probe
   *
   * Answers: Is the process alive and functioning?
   * Use case: Detect deadlocks, infinite loops, corrupted state
   * Failure action: Restart the container
   */
  async checkLiveness() {
    if (this.isShuttingDown) {
      return {
        status: 'unhealthy',
        reason: 'shutting down'
      };
    }

    // Basic checks
    const checks = {
      eventLoop: await this.checkEventLoop(),
      memory: this.checkMemory()
    };

    const isHealthy = Object.values(checks).every(check => check.healthy);

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Readiness probe
   *
   * Answers: Is the application ready to serve traffic?
   * Use case: Check dependencies, warm up caches
   * Failure action: Stop routing traffic (but don't restart)
   */
  async checkReadiness() {
    if (this.isShuttingDown) {
      return {
        status: 'not ready',
        reason: 'shutting down'
      };
    }

    if (!this.isStarted) {
      return {
        status: 'not ready',
        reason: 'not started'
      };
    }

    // Check all critical dependencies
    const dependencyChecks = await this.checkDependencies();
    const dependenciesHealthy = dependencyChecks.every(check =>
      !check.critical || check.status === 'healthy'
    );

    this.isReady = dependenciesHealthy;

    return {
      status: this.isReady ? 'ready' : 'not ready',
      dependencies: dependencyChecks,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Startup probe
   *
   * Answers: Has the application finished starting?
   * Use case: Slow-starting applications
   * Failure action: Restart if startup takes too long
   */
  async checkStartup() {
    if (this.isStarted) {
      return {
        status: 'started',
        startupTime: Date.now() - this.startTime
      };
    }

    // Check initialization tasks
    const pending = this.initializationTasks.filter(task => !task.completed);

    if (pending.length === 0) {
      this.isStarted = true;
      return {
        status: 'started',
        startupTime: Date.now() - this.startTime
      };
    }

    return {
      status: 'starting',
      pendingTasks: pending.map(task => task.name),
      progress: `${this.initializationTasks.length - pending.length}/${this.initializationTasks.length}`,
      elapsed: Date.now() - this.startTime
    };
  }

  /**
   * Check event loop health
   */
  async checkEventLoop() {
    const { monitorEventLoopDelay } = require('perf_hooks');
    const histogram = monitorEventLoopDelay({ resolution: 10 });

    histogram.enable();

    await new Promise(resolve => setTimeout(resolve, 100));

    const p99 = histogram.percentile(99);
    histogram.disable();

    const healthy = p99 < 100000000; // 100ms

    return {
      healthy,
      p99: p99 / 1000000, // Convert to ms
      threshold: 100
    };
  }

  /**
   * Check memory usage
   */
  checkMemory() {
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;

    return {
      healthy: heapUsedPercent < 90,
      heapUsedPercent: heapUsedPercent.toFixed(2),
      heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(2) + ' MB'
    };
  }

  /**
   * Check dependencies
   */
  async checkDependencies() {
    const checks = [];

    for (const [name, dependency] of this.dependencies) {
      try {
        await Promise.race([
          dependency.checkFn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), dependency.timeout)
          )
        ]);

        checks.push({
          name,
          status: 'healthy',
          critical: dependency.critical
        });
      } catch (error) {
        checks.push({
          name,
          status: 'unhealthy',
          error: error.message,
          critical: dependency.critical
        });
      }
    }

    return checks;
  }

  /**
   * Register dependency
   */
  registerDependency(name, checkFn, options = {}) {
    this.dependencies.set(name, {
      checkFn,
      critical: options.critical !== false,
      timeout: options.timeout || 5000
    });
  }

  /**
   * Register initialization task
   */
  registerInitTask(name, taskFn) {
    const task = {
      name,
      taskFn,
      completed: false
    };

    this.initializationTasks.push(task);

    // Execute task
    taskFn().then(() => {
      task.completed = true;
      console.log(`Initialization task completed: ${name}`);
    }).catch(error => {
      console.error(`Initialization task failed: ${name}`, error);
    });
  }

  /**
   * Express middleware for all probes
   */
  middleware() {
    const router = express.Router();

    router.get('/health/live', async (req, res) => {
      const health = await this.checkLiveness();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    });

    router.get('/health/ready', async (req, res) => {
      const health = await this.checkReadiness();
      const statusCode = health.status === 'ready' ? 200 : 503;
      res.status(statusCode).json(health);
    });

    router.get('/health/startup', async (req, res) => {
      const health = await this.checkStartup();
      const statusCode = health.status === 'started' ? 200 : 503;
      res.status(statusCode).json(health);
    });

    return router;
  }

  markShuttingDown() {
    this.isShuttingDown = true;
    this.isReady = false;
  }
}

// Usage example
async function setupMultiTierHealthCheck() {
  const healthCheck = new MultiTierHealthCheck();

  // Register initialization tasks
  healthCheck.registerInitTask('loadConfig', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Config loaded');
  });

  healthCheck.registerInitTask('connectDatabase', async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Database connected');
  });

  healthCheck.registerInitTask('warmCache', async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Cache warmed');
  });

  // Register dependencies
  healthCheck.registerDependency('database', async () => {
    // Check database
  }, { critical: true });

  healthCheck.registerDependency('redis', async () => {
    // Check Redis
  }, { critical: true });

  return healthCheck;
}

if (require.main === module) {
  setupMultiTierHealthCheck().then(healthCheck => {
    const app = express();

    app.use(healthCheck.middleware());

    app.listen(3000, () => {
      console.log('Server with multi-tier health checks running on port 3000');
      console.log('  Liveness:  /health/live');
      console.log('  Readiness: /health/ready');
      console.log('  Startup:   /health/startup');
    });

    process.on('SIGTERM', () => {
      healthCheck.markShuttingDown();
      setTimeout(() => process.exit(0), 10000);
    });
  });
}
```

## Kubernetes Integration

### Kubernetes Health Check Configuration

```javascript
/**
 * Kubernetes-compatible health checks
 */

class KubernetesHealthCheck {
  constructor() {
    this.startTime = Date.now();
    this.isShuttingDown = false;
    this.isReady = false;
    this.dependencies = new Map();

    // Kubernetes-specific settings
    this.startupProbeConfig = {
      initialDelaySeconds: 0,
      periodSeconds: 10,
      timeoutSeconds: 5,
      failureThreshold: 30, // 5 minutes max startup time
      successThreshold: 1
    };

    this.livenessProbeConfig = {
      initialDelaySeconds: 30,
      periodSeconds: 10,
      timeoutSeconds: 5,
      failureThreshold: 3,
      successThreshold: 1
    };

    this.readinessProbeConfig = {
      initialDelaySeconds: 0,
      periodSeconds: 5,
      timeoutSeconds: 3,
      failureThreshold: 3,
      successThreshold: 1
    };
  }

  /**
   * Generate Kubernetes YAML configuration
   */
  generateKubernetesYAML(serviceName, port = 3000) {
    return `
apiVersion: v1
kind: Pod
metadata:
  name: ${serviceName}
  labels:
    app: ${serviceName}
spec:
  containers:
  - name: ${serviceName}
    image: ${serviceName}:latest
    ports:
    - containerPort: ${port}

    # Startup Probe
    # Used for slow-starting containers
    # Prevents liveness/readiness probes from running until startup succeeds
    startupProbe:
      httpGet:
        path: /health/startup
        port: ${port}
        scheme: HTTP
      initialDelaySeconds: ${this.startupProbeConfig.initialDelaySeconds}
      periodSeconds: ${this.startupProbeConfig.periodSeconds}
      timeoutSeconds: ${this.startupProbeConfig.timeoutSeconds}
      failureThreshold: ${this.startupProbeConfig.failureThreshold}
      successThreshold: ${this.startupProbeConfig.successThreshold}

    # Liveness Probe
    # Kubernetes will restart the container if this fails
    livenessProbe:
      httpGet:
        path: /health/live
        port: ${port}
        scheme: HTTP
      initialDelaySeconds: ${this.livenessProbeConfig.initialDelaySeconds}
      periodSeconds: ${this.livenessProbeConfig.periodSeconds}
      timeoutSeconds: ${this.livenessProbeConfig.timeoutSeconds}
      failureThreshold: ${this.livenessProbeConfig.failureThreshold}
      successThreshold: ${this.livenessProbeConfig.successThreshold}

    # Readiness Probe
    # Kubernetes will stop sending traffic if this fails
    readinessProbe:
      httpGet:
        path: /health/ready
        port: ${port}
        scheme: HTTP
      initialDelaySeconds: ${this.readinessProbeConfig.initialDelaySeconds}
      periodSeconds: ${this.readinessProbeConfig.periodSeconds}
      timeoutSeconds: ${this.readinessProbeConfig.timeoutSeconds}
      failureThreshold: ${this.readinessProbeConfig.failureThreshold}
      successThreshold: ${this.readinessProbeConfig.successThreshold}

    # Resource limits
    resources:
      requests:
        memory: "256Mi"
        cpu: "250m"
      limits:
        memory: "512Mi"
        cpu: "500m"

    # Graceful shutdown
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 15"]
`.trim();
  }

  /**
   * Generate Helm values.yaml
   */
  generateHelmValues(serviceName) {
    return `
# Health Check Configuration
healthCheck:
  startupProbe:
    enabled: true
    path: /health/startup
    initialDelaySeconds: ${this.startupProbeConfig.initialDelaySeconds}
    periodSeconds: ${this.startupProbeConfig.periodSeconds}
    timeoutSeconds: ${this.startupProbeConfig.timeoutSeconds}
    failureThreshold: ${this.startupProbeConfig.failureThreshold}
    successThreshold: ${this.startupProbeConfig.successThreshold}

  livenessProbe:
    enabled: true
    path: /health/live
    initialDelaySeconds: ${this.livenessProbeConfig.initialDelaySeconds}
    periodSeconds: ${this.livenessProbeConfig.periodSeconds}
    timeoutSeconds: ${this.livenessProbeConfig.timeoutSeconds}
    failureThreshold: ${this.livenessProbeConfig.failureThreshold}
    successThreshold: ${this.livenessProbeConfig.successThreshold}

  readinessProbe:
    enabled: true
    path: /health/ready
    initialDelaySeconds: ${this.readinessProbeConfig.initialDelaySeconds}
    periodSeconds: ${this.readinessProbeConfig.periodSeconds}
    timeoutSeconds: ${this.readinessProbeConfig.timeoutSeconds}
    failureThreshold: ${this.readinessProbeConfig.failureThreshold}
    successThreshold: ${this.readinessProbeConfig.successThreshold}

# Graceful shutdown
terminationGracePeriodSeconds: 30
`.trim();
  }

  /**
   * Print configuration
   */
  printConfiguration(serviceName = 'my-service') {
    console.log('=== Kubernetes Health Check Configuration ===\n');
    console.log(this.generateKubernetesYAML(serviceName));
    console.log('\n=== Helm Values ===\n');
    console.log(this.generateHelmValues(serviceName));
  }
}

if (require.main === module) {
  const k8sHealth = new KubernetesHealthCheck();
  k8sHealth.printConfiguration('my-node-app');
}
```

## Load Balancer Integration

### AWS ALB Health Checks

```javascript
/**
 * AWS Application Load Balancer health checks
 */

class ALBHealthCheck {
  constructor() {
    this.startTime = Date.now();
    this.isHealthy = false;
    this.warmupPeriod = 60000; // 60 seconds
  }

  /**
   * ALB health check endpoint
   */
  middleware() {
    return (req, res) => {
      // Check if still warming up
      const uptime = Date.now() - this.startTime;
      if (uptime < this.warmupPeriod) {
        return res.status(503).json({
          status: 'warming up',
          progress: `${uptime}/${this.warmupPeriod}ms`
        });
      }

      // Perform health checks
      const checks = {
        memory: this.checkMemory(),
        eventLoop: this.checkEventLoop()
      };

      const healthy = Object.values(checks).every(check => check.healthy);

      if (healthy) {
        res.status(200).send('OK');
      } else {
        res.status(503).json({
          status: 'unhealthy',
          checks
        });
      }
    };
  }

  checkMemory() {
    const usage = process.memoryUsage();
    const heapPercent = (usage.heapUsed / usage.heapTotal) * 100;
    return {
      healthy: heapPercent < 90,
      heapPercent
    };
  }

  checkEventLoop() {
    // Simplified check
    return { healthy: true };
  }

  /**
   * Generate Terraform configuration for ALB
   */
  static generateTerraform(serviceName) {
    return `
resource "aws_lb_target_group" "${serviceName}" {
  name     = "${serviceName}-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name = "${serviceName}-target-group"
  }
}
`.trim();
  }
}

if (require.main === module) {
  console.log(ALBHealthCheck.generateTerraform('my-node-app'));
}
```

## Monitoring Integration

### Prometheus Metrics

```javascript
/**
 * Health check metrics for Prometheus
 */

const client = require('prom-client');

class HealthCheckMetrics {
  constructor() {
    this.register = new client.Registry();

    // Add default metrics
    client.collectDefaultMetrics({ register: this.register });

    // Health check metrics
    this.healthCheckDuration = new client.Histogram({
      name: 'health_check_duration_seconds',
      help: 'Duration of health check in seconds',
      labelNames: ['check_type', 'dependency'],
      registers: [this.register]
    });

    this.healthCheckStatus = new client.Gauge({
      name: 'health_check_status',
      help: 'Health check status (1 = healthy, 0 = unhealthy)',
      labelNames: ['check_type', 'dependency'],
      registers: [this.register]
    });

    this.healthCheckErrors = new client.Counter({
      name: 'health_check_errors_total',
      help: 'Total number of health check errors',
      labelNames: ['check_type', 'dependency', 'error'],
      registers: [this.register]
    });

    this.applicationUptime = new client.Gauge({
      name: 'application_uptime_seconds',
      help: 'Application uptime in seconds',
      registers: [this.register]
    });

    this.startTime = Date.now();
  }

  /**
   * Record health check
   */
  async recordHealthCheck(checkType, dependency, checkFn) {
    const timer = this.healthCheckDuration.startTimer({
      check_type: checkType,
      dependency
    });

    try {
      await checkFn();

      this.healthCheckStatus.set(
        { check_type: checkType, dependency },
        1
      );

      timer();
      return { status: 'healthy' };
    } catch (error) {
      this.healthCheckStatus.set(
        { check_type: checkType, dependency },
        0
      );

      this.healthCheckErrors.inc({
        check_type: checkType,
        dependency,
        error: error.message
      });

      timer();
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Update application uptime
   */
  updateUptime() {
    const uptime = (Date.now() - this.startTime) / 1000;
    this.applicationUptime.set(uptime);
  }

  /**
   * Metrics endpoint middleware
   */
  metricsMiddleware() {
    return async (req, res) => {
      this.updateUptime();

      res.set('Content-Type', this.register.contentType);
      res.end(await this.register.metrics());
    };
  }
}

// Usage
const app = express();
const metrics = new HealthCheckMetrics();

app.get('/metrics', metrics.metricsMiddleware());

app.get('/health', async (req, res) => {
  // Check database
  const dbCheck = await metrics.recordHealthCheck(
    'readiness',
    'database',
    async () => {
      // Database check logic
    }
  );

  // Check Redis
  const redisCheck = await metrics.recordHealthCheck(
    'readiness',
    'redis',
    async () => {
      // Redis check logic
    }
  );

  const healthy = dbCheck.status === 'healthy' && redisCheck.status === 'healthy';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks: { database: dbCheck, redis: redisCheck }
  });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log('Server with Prometheus metrics running on port 3000');
  });
}
```

## Case Studies

### Case Study 1: Zero-Downtime Deployment Issue

```javascript
/**
 * CASE STUDY: Failed Zero-Downtime Deployment
 *
 * Problem: Deployments causing 502 errors despite health checks
 * Root Cause: Health check returned 200 before app was actually ready
 * Impact: 2-3 minute error spike during each deployment
 * Solution: Implemented proper readiness checks with dependency validation
 */

// BEFORE: Premature health check success
class HealthCheckBefore {
  constructor() {
    this.server = null;
  }

  getHandler() {
    return (req, res) => {
      // Returns 200 as soon as server starts listening
      res.status(200).send('OK');
    };
  }
}

// AFTER: Proper readiness check
class HealthCheckAfter {
  constructor() {
    this.server = null;
    this.isReady = false;
    this.dependencies = [];
  }

  async initialize() {
    // Wait for all dependencies
    await Promise.all([
      this.connectDatabase(),
      this.connectRedis(),
      this.warmCache()
    ]);

    this.isReady = true;
    console.log('Application ready to serve traffic');
  }

  async connectDatabase() {
    // Wait for database connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Database connected');
  }

  async connectRedis() {
    // Wait for Redis connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Redis connected');
  }

  async warmCache() {
    // Warm up cache
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Cache warmed');
  }

  getHandler() {
    return (req, res) => {
      if (!this.isReady) {
        return res.status(503).json({
          status: 'not ready',
          message: 'Still initializing'
        });
      }

      // Verify dependencies are still healthy
      // (in production, do actual checks)
      res.status(200).json({
        status: 'ready',
        message: 'Ready to serve traffic'
      });
    };
  }
}

/**
 * Results:
 * - Zero 502 errors during deployment
 * - Clean traffic cutover
 * - 30 second longer startup, but no errors
 * - Successful zero-downtime deployments
 */
```

### Case Study 2: Cascading Failure Prevention

```javascript
/**
 * CASE STUDY: Preventing Cascading Failures
 *
 * Problem: One degraded instance caused load balancer to mark all instances unhealthy
 * Root Cause: Health check too sensitive, failed on slow external API
 * Impact: Complete service outage
 * Solution: Separate critical and non-critical dependency checks
 */

// BEFORE: All dependencies treated equally
class HealthCheckSensitive {
  async checkHealth() {
    const checks = await Promise.all([
      this.checkDatabase(),      // Critical
      this.checkRedis(),         // Critical
      this.checkExternalAPI()    // Non-critical!
    ]);

    const allHealthy = checks.every(check => check.healthy);

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks
    };
  }

  async checkExternalAPI() {
    try {
      const response = await fetch('https://external-api.com/health', {
        timeout: 1000
      });
      return { healthy: response.ok };
    } catch (error) {
      return { healthy: false }; // Marks entire instance unhealthy!
    }
  }
}

// AFTER: Critical vs non-critical dependencies
class HealthCheckResilient {
  async checkHealth() {
    const criticalChecks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis()
    ]);

    const nonCriticalChecks = await Promise.all([
      this.checkExternalAPI()
    ]);

    const criticalHealthy = criticalChecks.every(check => check.healthy);

    return {
      status: criticalHealthy ? 'healthy' : 'unhealthy',
      critical: criticalChecks,
      nonCritical: nonCriticalChecks
    };
  }

  async checkExternalAPI() {
    try {
      const response = await fetch('https://external-api.com/health', {
        timeout: 5000 // Longer timeout
      });
      return {
        name: 'externalAPI',
        healthy: response.ok,
        critical: false
      };
    } catch (error) {
      // Log but don't fail health check
      console.warn('External API check failed:', error.message);
      return {
        name: 'externalAPI',
        healthy: false,
        critical: false,
        error: error.message
      };
    }
  }
}

/**
 * Results:
 * - No more cascading failures
 * - Service remains available during external API issues
 * - Better visibility into dependency health
 * - Reduced false positives
 */
```

## Best Practices

```javascript
/**
 * Health Check Best Practices
 */

const HEALTH_CHECK_BEST_PRACTICES = {
  design: [
    'Separate liveness, readiness, and startup probes',
    'Keep health checks lightweight',
    'Cache health check results',
    'Use appropriate timeouts',
    'Distinguish critical vs non-critical dependencies',
    'Return proper HTTP status codes',
    'Include diagnostic information',
    'Version your health check endpoints'
  ],

  implementation: [
    'Check actual dependencies, not just server status',
    'Implement graceful shutdown',
    'Handle probe failures gracefully',
    'Use circuit breakers for external dependencies',
    'Implement exponential backoff for retries',
    'Log health check failures',
    'Monitor health check duration',
    'Test health checks in staging'
  ],

  kubernetes: [
    'Use all three probe types appropriately',
    'Set reasonable failureThreshold values',
    'Allow adequate startup time',
    'Configure graceful shutdown period',
    'Use preStop hooks',
    'Test probe configurations',
    'Monitor probe failures',
    'Document probe behavior'
  ],

  monitoring: [
    'Track health check latency',
    'Monitor success/failure rates',
    'Alert on health check failures',
    'Expose health metrics',
    'Log dependency check results',
    'Track probe-induced restarts',
    'Monitor deployment success rate',
    'Use distributed tracing'
  ]
};

// Print best practices
console.log('Health Check Best Practices:\n');
Object.entries(HEALTH_CHECK_BEST_PRACTICES).forEach(([category, practices]) => {
  console.log(`${category.toUpperCase()}:`);
  practices.forEach(practice => {
    console.log(`  - ${practice}`);
  });
  console.log();
});
```

## Anti-Patterns

```javascript
/**
 * Common Health Check Anti-Patterns
 */

// ANTI-PATTERN 1: Always returning 200
// BAD
app.get('/health', (req, res) => {
  res.status(200).send('OK'); // Doesn't check anything!
});

// GOOD
app.get('/health', async (req, res) => {
  const healthy = await checkDependencies();
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'healthy' : 'unhealthy' });
});

// ANTI-PATTERN 2: Expensive health checks
// BAD
app.get('/health', async (req, res) => {
  // Performs full table scan on every check!
  const count = await db.query('SELECT COUNT(*) FROM users');
  res.status(200).json({ users: count });
});

// GOOD
app.get('/health', async (req, res) => {
  // Simple ping
  await db.ping();
  res.status(200).send('OK');
});

// ANTI-PATTERN 3: No caching
// BAD
app.get('/health', async (req, res) => {
  // Checks all dependencies on every request
  const db = await checkDatabase();
  const redis = await checkRedis();
  res.status(200).json({ db, redis });
});

// GOOD
const cache = { result: null, timestamp: 0, ttl: 5000 };
app.get('/health', async (req, res) => {
  if (cache.result && (Date.now() - cache.timestamp) < cache.ttl) {
    return res.status(200).json(cache.result);
  }

  const result = await checkDependencies();
  cache.result = result;
  cache.timestamp = Date.now();

  res.status(200).json(result);
});

// ANTI-PATTERN 4: No graceful shutdown
// BAD
process.on('SIGTERM', () => {
  process.exit(0); // Immediate exit!
});

// GOOD
let isShuttingDown = false;

app.get('/health', (req, res) => {
  if (isShuttingDown) {
    return res.status(503).send('Shutting down');
  }
  res.status(200).send('OK');
});

process.on('SIGTERM', () => {
  isShuttingDown = true;
  setTimeout(() => process.exit(0), 10000);
});

// ANTI-PATTERN 5: No timeout on dependency checks
// BAD
async function checkDatabase() {
  // Could hang forever
  await db.query('SELECT 1');
}

// GOOD
async function checkDatabase() {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 5000)
  );

  await Promise.race([
    db.query('SELECT 1'),
    timeout
  ]);
}
```

## Conclusion

Production health checks are essential for:

1. **High Availability** - Enable automatic failover
2. **Zero-Downtime Deployments** - Safe traffic cutover
3. **Fast Recovery** - Quick detection and remediation
4. **Observability** - Visibility into system health
5. **Resilience** - Prevent cascading failures

**Key Takeaways:**
- Implement all three probe types (liveness, readiness, startup)
- Distinguish critical from non-critical dependencies
- Cache health check results appropriately
- Implement graceful shutdown
- Monitor health check metrics
- Test health checks thoroughly
- Use appropriate timeouts and thresholds
- Document health check behavior

**Remember:**
- Health checks should be fast and lightweight
- Return proper HTTP status codes
- Include diagnostic information
- Test in staging before production
- Monitor probe-induced restarts
- Plan for graceful degradation
