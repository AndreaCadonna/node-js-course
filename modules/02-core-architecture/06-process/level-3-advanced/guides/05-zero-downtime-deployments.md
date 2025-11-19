# Zero-Downtime Deployments

## Table of Contents
- [Introduction](#introduction)
- [Deployment Strategies](#deployment-strategies)
- [Graceful Shutdown](#graceful-shutdown)
- [Rolling Updates](#rolling-updates)
- [Blue-Green Deployments](#blue-green-deployments)
- [Canary Deployments](#canary-deployments)
- [Database Migrations](#database-migrations)
- [Load Balancer Integration](#load-balancer-integration)
- [Kubernetes Deployments](#kubernetes-deployments)
- [Case Studies](#case-studies)
- [Best Practices](#best-practices)
- [Anti-Patterns](#anti-patterns)

## Introduction

Zero-downtime deployments are essential for maintaining high availability while continuously delivering updates. Proper implementation ensures users experience no interruption during deployments.

### Why Zero-Downtime Matters

```javascript
/**
 * Understanding deployment downtime impact
 */

class DeploymentImpactAnalysis {
  /**
   * Calculate downtime cost
   */
  static calculateDowntimeCost(options = {}) {
    const {
      requestsPerSecond = 1000,
      averageRevenuePerRequest = 0.50,
      downtimeSeconds = 60
    } = options;

    const lostRequests = requestsPerSecond * downtimeSeconds;
    const lostRevenue = lostRequests * averageRevenuePerRequest;
    const customerImpact = lostRequests;

    return {
      downtime: {
        seconds: downtimeSeconds,
        minutes: (downtimeSeconds / 60).toFixed(2)
      },
      impact: {
        lostRequests,
        lostRevenue: `$${lostRevenue.toFixed(2)}`,
        affectedCustomers: customerImpact
      },
      annual: {
        deploymentsPerYear: 365, // Daily deployments
        annualDowntime: `${(downtimeSeconds * 365 / 3600).toFixed(2)} hours`,
        annualRevenueLoss: `$${(lostRevenue * 365).toFixed(2)}`
      }
    };
  }

  /**
   * Compare deployment strategies
   */
  static compareStrategies() {
    const strategies = [
      {
        name: 'Traditional (Stop-Start)',
        downtime: 60,
        complexity: 'Low',
        risk: 'High'
      },
      {
        name: 'Rolling Update',
        downtime: 0,
        complexity: 'Medium',
        risk: 'Low'
      },
      {
        name: 'Blue-Green',
        downtime: 0,
        complexity: 'Medium',
        risk: 'Very Low'
      },
      {
        name: 'Canary',
        downtime: 0,
        complexity: 'High',
        risk: 'Very Low'
      }
    ];

    return strategies.map(strategy => ({
      ...strategy,
      impact: this.calculateDowntimeCost({ downtimeSeconds: strategy.downtime })
    }));
  }
}

// Example usage
if (require.main === module) {
  console.log('=== Downtime Impact Analysis ===\n');

  const impact = DeploymentImpactAnalysis.calculateDowntimeCost({
    requestsPerSecond: 1000,
    averageRevenuePerRequest: 0.50,
    downtimeSeconds: 60
  });

  console.log(JSON.stringify(impact, null, 2));

  console.log('\n=== Deployment Strategy Comparison ===\n');
  const comparison = DeploymentImpactAnalysis.compareStrategies();
  comparison.forEach(strategy => {
    console.log(`${strategy.name}:`);
    console.log(`  Downtime: ${strategy.downtime}s`);
    console.log(`  Complexity: ${strategy.complexity}`);
    console.log(`  Risk: ${strategy.risk}`);
    console.log();
  });
}
```

## Deployment Strategies

### Strategy Overview

```javascript
/**
 * Deployment strategy implementations
 */

class DeploymentStrategies {
  /**
   * Rolling Update Strategy
   *
   * Gradually replace old instances with new ones
   * - No downtime
   * - Both versions run simultaneously
   * - Progressive rollout
   */
  static getRollingUpdateSpec() {
    return {
      name: 'Rolling Update',
      characteristics: {
        downtime: 'None',
        versionsSimultaneous: 2,
        rollbackSpeed: 'Medium',
        resourceRequirement: 'Medium'
      },
      steps: [
        '1. Start new instance',
        '2. Wait for health checks',
        '3. Add to load balancer',
        '4. Remove old instance',
        '5. Repeat for remaining instances'
      ],
      advantages: [
        'No downtime',
        'Gradual rollout',
        'No extra infrastructure needed',
        'Easy rollback'
      ],
      disadvantages: [
        'Two versions running simultaneously',
        'Longer deployment time',
        'Requires backward compatibility'
      ],
      bestFor: [
        'Stateless applications',
        'Frequent deployments',
        'Cost-conscious scenarios'
      ]
    };
  }

  /**
   * Blue-Green Deployment Strategy
   *
   * Maintain two identical environments, switch traffic instantly
   */
  static getBlueGreenSpec() {
    return {
      name: 'Blue-Green Deployment',
      characteristics: {
        downtime: 'None',
        versionsSimultaneous: 2,
        rollbackSpeed: 'Instant',
        resourceRequirement: 'High (2x)'
      },
      steps: [
        '1. Deploy to green environment',
        '2. Run tests on green',
        '3. Switch traffic to green',
        '4. Monitor for issues',
        '5. Keep blue as fallback'
      ],
      advantages: [
        'Instant cutover',
        'Instant rollback',
        'Full testing before cutover',
        'Zero-downtime deployments'
      ],
      disadvantages: [
        'Requires double infrastructure',
        'Database migrations complex',
        'Cost implications'
      ],
      bestFor: [
        'Critical applications',
        'When instant rollback needed',
        'When cost allows 2x infrastructure'
      ]
    };
  }

  /**
   * Canary Deployment Strategy
   *
   * Gradually route traffic to new version
   */
  static getCanarySpec() {
    return {
      name: 'Canary Deployment',
      characteristics: {
        downtime: 'None',
        versionsSimultaneous: 2,
        rollbackSpeed: 'Fast',
        resourceRequirement: 'Medium'
      },
      steps: [
        '1. Deploy new version to subset',
        '2. Route small percentage of traffic',
        '3. Monitor metrics closely',
        '4. Gradually increase traffic',
        '5. Complete rollout or rollback'
      ],
      advantages: [
        'Early problem detection',
        'Limited blast radius',
        'Progressive validation',
        'Real user testing'
      ],
      disadvantages: [
        'Complex traffic routing',
        'Requires good monitoring',
        'Longer deployment time'
      ],
      bestFor: [
        'High-risk changes',
        'Testing at scale',
        'Progressive rollouts'
      ]
    };
  }

  /**
   * Print strategy comparison
   */
  static printComparison() {
    const strategies = [
      this.getRollingUpdateSpec(),
      this.getBlueGreenSpec(),
      this.getCanarySpec()
    ];

    console.log('=== Deployment Strategy Comparison ===\n');

    strategies.forEach(strategy => {
      console.log(`${strategy.name}`);
      console.log('-'.repeat(strategy.name.length));
      console.log('\nCharacteristics:');
      Object.entries(strategy.characteristics).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      console.log('\nAdvantages:');
      strategy.advantages.forEach(adv => console.log(`  + ${adv}`));
      console.log('\nDisadvantages:');
      strategy.disadvantages.forEach(dis => console.log(`  - ${dis}`));
      console.log('\nBest for:');
      strategy.bestFor.forEach(use => console.log(`  • ${use}`));
      console.log('\n');
    });
  }
}

if (require.main === module) {
  DeploymentStrategies.printComparison();
}
```

## Graceful Shutdown

### Comprehensive Graceful Shutdown

```javascript
/**
 * Production-grade graceful shutdown implementation
 */

const http = require('http');

class GracefulShutdown {
  constructor(server, options = {}) {
    this.server = server;
    this.isShuttingDown = false;
    this.connections = new Set();
    this.config = {
      shutdownTimeout: options.shutdownTimeout || 30000,
      healthCheckDelay: options.healthCheckDelay || 5000,
      forceShutdownDelay: options.forceShutdownDelay || 35000,
      signals: options.signals || ['SIGTERM', 'SIGINT']
    };

    this.setupConnectionTracking();
    this.setupSignalHandlers();
  }

  /**
   * Track all connections
   */
  setupConnectionTracking() {
    this.server.on('connection', (conn) => {
      this.connections.add(conn);

      conn.on('close', () => {
        this.connections.delete(conn);
      });
    });
  }

  /**
   * Setup signal handlers
   */
  setupSignalHandlers() {
    this.config.signals.forEach(signal => {
      process.on(signal, () => {
        console.log(`Received ${signal}, starting graceful shutdown...`);
        this.shutdown();
      });
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      this.shutdown(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      this.shutdown(1);
    });
  }

  /**
   * Mark as unhealthy for load balancer
   */
  markUnhealthy() {
    this.isShuttingDown = true;
    console.log('Marked as unhealthy, waiting for health check propagation...');
  }

  /**
   * Stop accepting new connections
   */
  stopAcceptingConnections() {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('Server stopped accepting new connections');
        resolve();
      });
    });
  }

  /**
   * Wait for existing connections to complete
   */
  async waitForConnections() {
    const startTime = Date.now();
    const checkInterval = 1000;

    while (this.connections.size > 0) {
      const elapsed = Date.now() - startTime;

      if (elapsed >= this.config.shutdownTimeout) {
        console.warn(`Shutdown timeout reached with ${this.connections.size} active connections`);
        break;
      }

      console.log(`Waiting for ${this.connections.size} connections to complete...`);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    if (this.connections.size === 0) {
      console.log('All connections closed gracefully');
    }
  }

  /**
   * Force close remaining connections
   */
  forceCloseConnections() {
    if (this.connections.size > 0) {
      console.warn(`Force closing ${this.connections.size} remaining connections`);

      for (const conn of this.connections) {
        conn.destroy();
      }

      this.connections.clear();
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('Running cleanup tasks...');

    // Close database connections
    if (global.dbPool) {
      await global.dbPool.end();
      console.log('Database connections closed');
    }

    // Close Redis connections
    if (global.redisClient) {
      await global.redisClient.quit();
      console.log('Redis connections closed');
    }

    // Flush logs
    if (global.logger && global.logger.flush) {
      await global.logger.flush();
      console.log('Logs flushed');
    }

    console.log('Cleanup completed');
  }

  /**
   * Main shutdown sequence
   */
  async shutdown(exitCode = 0) {
    if (this.isShuttingDown) {
      console.log('Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;

    // Set force shutdown timeout
    const forceShutdownTimer = setTimeout(() => {
      console.error('Force shutdown timeout reached, exiting immediately');
      process.exit(1);
    }, this.config.forceShutdownDelay);

    try {
      // Step 1: Mark as unhealthy
      this.markUnhealthy();

      // Step 2: Wait for health check propagation
      await new Promise(resolve =>
        setTimeout(resolve, this.config.healthCheckDelay)
      );

      // Step 3: Stop accepting new connections
      await this.stopAcceptingConnections();

      // Step 4: Wait for existing connections
      await this.waitForConnections();

      // Step 5: Force close any remaining connections
      this.forceCloseConnections();

      // Step 6: Cleanup resources
      await this.cleanup();

      clearTimeout(forceShutdownTimer);

      console.log('Graceful shutdown completed successfully');
      process.exit(exitCode);

    } catch (error) {
      console.error('Error during shutdown:', error);
      clearTimeout(forceShutdownTimer);
      process.exit(1);
    }
  }

  /**
   * Health check middleware
   */
  healthCheckMiddleware() {
    return (req, res) => {
      if (this.isShuttingDown) {
        res.status(503).json({
          status: 'unhealthy',
          reason: 'shutting down'
        });
      } else {
        res.status(200).json({
          status: 'healthy'
        });
      }
    };
  }
}

// Example Express application with graceful shutdown
if (require.main === module) {
  const express = require('express');
  const app = express();

  // Routes
  app.get('/', (req, res) => {
    res.send('Hello World');
  });

  app.get('/slow', (req, res) => {
    // Simulate slow endpoint
    setTimeout(() => {
      res.send('Slow response');
    }, 10000);
  });

  // Start server
  const server = http.createServer(app);
  const gracefulShutdown = new GracefulShutdown(server, {
    shutdownTimeout: 30000,
    healthCheckDelay: 10000
  });

  // Add health check endpoint
  app.get('/health', gracefulShutdown.healthCheckMiddleware());

  server.listen(3000, () => {
    console.log('Server running on port 3000');
    console.log('Send SIGTERM to trigger graceful shutdown');
  });
}
```

### Connection Draining

```javascript
/**
 * Advanced connection draining
 */

class ConnectionDrainer {
  constructor(server, options = {}) {
    this.server = server;
    this.connections = new Map();
    this.isDraining = false;
    this.drainTimeout = options.drainTimeout || 30000;

    this.setupTracking();
  }

  /**
   * Track all requests
   */
  setupTracking() {
    this.server.on('request', (req, res) => {
      const connectionId = `${Date.now()}-${Math.random()}`;

      // Track request
      this.connections.set(connectionId, {
        req,
        res,
        startTime: Date.now(),
        url: req.url,
        method: req.method
      });

      // Remove on finish
      res.on('finish', () => {
        this.connections.delete(connectionId);
      });

      // Remove on error
      res.on('error', () => {
        this.connections.delete(connectionId);
      });

      // If draining, send Connection: close header
      if (this.isDraining) {
        res.setHeader('Connection', 'close');
      }
    });
  }

  /**
   * Start draining connections
   */
  async drain() {
    this.isDraining = true;
    console.log(`Starting connection drain (${this.connections.size} active)`);

    const startTime = Date.now();

    while (this.connections.size > 0) {
      const elapsed = Date.now() - startTime;

      if (elapsed >= this.drainTimeout) {
        console.warn(`Drain timeout, ${this.connections.size} requests still active`);
        this.logActiveConnections();
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Draining... ${this.connections.size} requests remaining`);
    }

    if (this.connections.size === 0) {
      console.log('All connections drained successfully');
    }
  }

  /**
   * Log active connections for debugging
   */
  logActiveConnections() {
    console.log('Active connections:');
    for (const [id, conn] of this.connections) {
      const duration = Date.now() - conn.startTime;
      console.log(`  ${conn.method} ${conn.url} (${duration}ms)`);
    }
  }

  /**
   * Force close remaining connections
   */
  forceClose() {
    console.log(`Force closing ${this.connections.size} connections`);

    for (const [id, conn] of this.connections) {
      if (!conn.res.finished) {
        conn.res.end();
      }
    }

    this.connections.clear();
  }
}

// Usage with graceful shutdown
class GracefulShutdownWithDraining {
  constructor(server, options = {}) {
    this.server = server;
    this.drainer = new ConnectionDrainer(server, options);
    this.gracefulShutdown = new GracefulShutdown(server, options);
  }

  async shutdown() {
    // Start draining
    await this.drainer.drain();

    // Force close any remaining
    this.drainer.forceClose();

    // Continue with graceful shutdown
    await this.gracefulShutdown.cleanup();

    process.exit(0);
  }
}
```

## Rolling Updates

### Rolling Update Implementation

```javascript
/**
 * Rolling update orchestration
 */

class RollingUpdate {
  constructor(options = {}) {
    this.instances = options.instances || [];
    this.batchSize = options.batchSize || 1;
    this.healthCheckDelay = options.healthCheckDelay || 30000;
    this.healthCheckRetries = options.healthCheckRetries || 5;
    this.rollbackOnFailure = options.rollbackOnFailure !== false;
  }

  /**
   * Execute rolling update
   */
  async execute(newVersion) {
    console.log(`Starting rolling update to version ${newVersion}`);
    console.log(`Instances: ${this.instances.length}`);
    console.log(`Batch size: ${this.batchSize}`);

    const batches = this.createBatches();
    const oldVersion = this.instances[0].version;

    try {
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\nProcessing batch ${i + 1}/${batches.length}`);

        await this.updateBatch(batch, newVersion);
      }

      console.log('\nRolling update completed successfully');
      return { success: true, version: newVersion };

    } catch (error) {
      console.error('Rolling update failed:', error.message);

      if (this.rollbackOnFailure) {
        console.log('Rolling back to previous version...');
        await this.rollback(oldVersion);
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Create batches of instances
   */
  createBatches() {
    const batches = [];

    for (let i = 0; i < this.instances.length; i += this.batchSize) {
      batches.push(this.instances.slice(i, i + this.batchSize));
    }

    return batches;
  }

  /**
   * Update a batch of instances
   */
  async updateBatch(batch, newVersion) {
    console.log(`Updating ${batch.length} instances...`);

    for (const instance of batch) {
      await this.updateInstance(instance, newVersion);
    }

    // Wait for health check propagation
    console.log('Waiting for health check propagation...');
    await new Promise(resolve => setTimeout(resolve, this.healthCheckDelay));

    // Verify all instances in batch are healthy
    await this.verifyBatch(batch);
  }

  /**
   * Update single instance
   */
  async updateInstance(instance, newVersion) {
    console.log(`  Updating instance ${instance.id}...`);

    // Remove from load balancer
    await this.removeFromLoadBalancer(instance);
    console.log(`    Removed from load balancer`);

    // Wait for connection drain
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Deploy new version
    await this.deploy(instance, newVersion);
    console.log(`    Deployed version ${newVersion}`);

    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Health check
    await this.healthCheck(instance);
    console.log(`    Health check passed`);

    // Add to load balancer
    await this.addToLoadBalancer(instance);
    console.log(`    Added to load balancer`);

    instance.version = newVersion;
  }

  /**
   * Verify batch health
   */
  async verifyBatch(batch) {
    console.log('Verifying batch health...');

    for (const instance of batch) {
      let retries = 0;
      let healthy = false;

      while (retries < this.healthCheckRetries && !healthy) {
        try {
          await this.healthCheck(instance);
          healthy = true;
        } catch (error) {
          retries++;
          console.log(`  Instance ${instance.id} health check failed (attempt ${retries})`);

          if (retries < this.healthCheckRetries) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }

      if (!healthy) {
        throw new Error(`Instance ${instance.id} failed health checks`);
      }
    }

    console.log('Batch verification completed');
  }

  /**
   * Health check instance
   */
  async healthCheck(instance) {
    // Simulate health check
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 95% success rate
        if (Math.random() > 0.05) {
          resolve();
        } else {
          reject(new Error('Health check failed'));
        }
      }, 1000);
    });
  }

  /**
   * Deploy to instance
   */
  async deploy(instance, version) {
    // Simulate deployment
    return new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Load balancer operations
   */
  async removeFromLoadBalancer(instance) {
    // Simulate LB removal
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  async addToLoadBalancer(instance) {
    // Simulate LB addition
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Rollback to previous version
   */
  async rollback(version) {
    console.log(`Rolling back to version ${version}...`);

    for (const instance of this.instances) {
      if (instance.version !== version) {
        await this.updateInstance(instance, version);
      }
    }

    console.log('Rollback completed');
  }
}

// Example usage
if (require.main === module) {
  const instances = Array.from({ length: 6 }, (_, i) => ({
    id: `instance-${i + 1}`,
    version: '1.0.0',
    host: `10.0.0.${i + 1}`
  }));

  const rollingUpdate = new RollingUpdate({
    instances,
    batchSize: 2,
    healthCheckDelay: 10000,
    healthCheckRetries: 3,
    rollbackOnFailure: true
  });

  rollingUpdate.execute('2.0.0')
    .then(result => {
      console.log('\nResult:', result);
    })
    .catch(error => {
      console.error('Update failed:', error);
    });
}
```

## Blue-Green Deployments

### Blue-Green Implementation

```javascript
/**
 * Blue-Green deployment implementation
 */

class BlueGreenDeployment {
  constructor(options = {}) {
    this.environments = {
      blue: options.blue || { version: '1.0.0', instances: [] },
      green: options.green || { version: null, instances: [] }
    };

    this.activeEnvironment = 'blue';
    this.loadBalancer = options.loadBalancer;
  }

  /**
   * Execute blue-green deployment
   */
  async deploy(newVersion) {
    console.log('=== Blue-Green Deployment ===');
    console.log(`Current: ${this.activeEnvironment} (${this.getCurrentVersion()})`);
    console.log(`New version: ${newVersion}\n`);

    const targetEnv = this.activeEnvironment === 'blue' ? 'green' : 'blue';

    try {
      // Step 1: Deploy to inactive environment
      console.log(`Step 1: Deploying to ${targetEnv} environment...`);
      await this.deployToEnvironment(targetEnv, newVersion);

      // Step 2: Run smoke tests
      console.log('\nStep 2: Running smoke tests...');
      await this.runSmokeTests(targetEnv);

      // Step 3: Warm up
      console.log('\nStep 3: Warming up application...');
      await this.warmup(targetEnv);

      // Step 4: Final validation
      console.log('\nStep 4: Final validation...');
      await this.validateEnvironment(targetEnv);

      // Step 5: Switch traffic
      console.log('\nStep 5: Switching traffic...');
      await this.switchTraffic(targetEnv);

      // Step 6: Monitor
      console.log('\nStep 6: Monitoring new environment...');
      await this.monitor(targetEnv);

      console.log('\n=== Deployment Successful ===');
      console.log(`Active environment: ${targetEnv}`);
      console.log(`Version: ${newVersion}`);

      return {
        success: true,
        previousEnvironment: this.activeEnvironment,
        newEnvironment: targetEnv,
        version: newVersion
      };

    } catch (error) {
      console.error('\n=== Deployment Failed ===');
      console.error('Error:', error.message);

      // Rollback if traffic was switched
      if (this.activeEnvironment === targetEnv) {
        console.log('\nRolling back traffic...');
        const rollbackEnv = targetEnv === 'blue' ? 'green' : 'blue';
        await this.switchTraffic(rollbackEnv);
      }

      return {
        success: false,
        error: error.message,
        activeEnvironment: this.activeEnvironment
      };
    }
  }

  /**
   * Deploy to specific environment
   */
  async deployToEnvironment(env, version) {
    const environment = this.environments[env];

    console.log(`  Deploying version ${version} to ${env}...`);

    // Simulate deployment to all instances
    for (const instance of environment.instances) {
      console.log(`    Deploying to ${instance.id}...`);
      await this.deployToInstance(instance, version);
    }

    environment.version = version;
    console.log(`  ${env} environment updated to version ${version}`);
  }

  /**
   * Deploy to single instance
   */
  async deployToInstance(instance, version) {
    // Simulate deployment
    return new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Run smoke tests
   */
  async runSmokeTests(env) {
    const tests = [
      'Health check',
      'Database connectivity',
      'Cache connectivity',
      'External API connectivity',
      'Core functionality'
    ];

    for (const test of tests) {
      console.log(`  Running: ${test}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 98% success rate
      if (Math.random() > 0.98) {
        throw new Error(`Smoke test failed: ${test}`);
      }

      console.log(`    ✓ Passed`);
    }

    console.log('  All smoke tests passed');
  }

  /**
   * Warm up application (cache, connections, etc.)
   */
  async warmup(env) {
    const warmupTasks = [
      'Loading cache',
      'Establishing database connections',
      'Connecting to external services',
      'Pre-compiling templates'
    ];

    for (const task of warmupTasks) {
      console.log(`  ${task}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('  Warmup completed');
  }

  /**
   * Validate environment
   */
  async validateEnvironment(env) {
    console.log('  Validating environment...');

    const validations = [
      'Configuration',
      'Dependencies',
      'Resources',
      'Permissions'
    ];

    for (const validation of validations) {
      console.log(`    Checking ${validation}...`);
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`      ✓ Valid`);
    }

    console.log('  Environment validated');
  }

  /**
   * Switch load balancer traffic
   */
  async switchTraffic(targetEnv) {
    console.log(`  Switching traffic from ${this.activeEnvironment} to ${targetEnv}...`);

    // Update load balancer
    await new Promise(resolve => setTimeout(resolve, 2000));

    this.activeEnvironment = targetEnv;
    console.log('  Traffic switched successfully');
  }

  /**
   * Monitor new environment
   */
  async monitor(env, duration = 30000) {
    const startTime = Date.now();
    const checkInterval = 5000;

    console.log(`  Monitoring for ${duration / 1000} seconds...`);

    while (Date.now() - startTime < duration) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));

      // Check metrics
      const metrics = await this.getMetrics(env);

      console.log(`    Error rate: ${metrics.errorRate}%`);
      console.log(`    Response time: ${metrics.responseTime}ms`);

      if (metrics.errorRate > 1.0) {
        throw new Error(`High error rate detected: ${metrics.errorRate}%`);
      }

      if (metrics.responseTime > 1000) {
        throw new Error(`High response time detected: ${metrics.responseTime}ms`);
      }
    }

    console.log('  Monitoring completed - no issues detected');
  }

  /**
   * Get metrics from environment
   */
  async getMetrics(env) {
    // Simulate metrics
    return {
      errorRate: Math.random() * 0.5,
      responseTime: 100 + Math.random() * 100,
      throughput: 1000 + Math.random() * 200
    };
  }

  /**
   * Get current version
   */
  getCurrentVersion() {
    return this.environments[this.activeEnvironment].version;
  }

  /**
   * Instant rollback
   */
  async rollback() {
    const previousEnv = this.activeEnvironment === 'blue' ? 'green' : 'blue';

    console.log(`Rolling back to ${previousEnv}...`);
    await this.switchTraffic(previousEnv);
    console.log('Rollback completed');

    return {
      success: true,
      activeEnvironment: previousEnv,
      version: this.environments[previousEnv].version
    };
  }
}

// Example usage
if (require.main === module) {
  const deployment = new BlueGreenDeployment({
    blue: {
      version: '1.0.0',
      instances: [
        { id: 'blue-1', host: '10.0.1.1' },
        { id: 'blue-2', host: '10.0.1.2' },
        { id: 'blue-3', host: '10.0.1.3' }
      ]
    },
    green: {
      version: null,
      instances: [
        { id: 'green-1', host: '10.0.2.1' },
        { id: 'green-2', host: '10.0.2.2' },
        { id: 'green-3', host: '10.0.2.3' }
      ]
    }
  });

  deployment.deploy('2.0.0')
    .then(result => {
      console.log('\nDeployment result:', result);
    })
    .catch(error => {
      console.error('Deployment error:', error);
    });
}
```

## Canary Deployments

### Canary Implementation

```javascript
/**
 * Canary deployment with progressive rollout
 */

class CanaryDeployment {
  constructor(options = {}) {
    this.instances = options.instances || [];
    this.stages = options.stages || [
      { percentage: 5, duration: 300000 },   // 5% for 5 minutes
      { percentage: 25, duration: 600000 },  // 25% for 10 minutes
      { percentage: 50, duration: 600000 },  // 50% for 10 minutes
      { percentage: 100, duration: 0 }       // 100%
    ];
    this.metrics = options.metrics || ['errorRate', 'responseTime', 'cpuUsage'];
    this.thresholds = options.thresholds || {
      errorRate: 1.0,      // 1%
      responseTime: 1000,  // 1000ms
      cpuUsage: 80         // 80%
    };
  }

  /**
   * Execute canary deployment
   */
  async deploy(newVersion) {
    console.log('=== Canary Deployment ===');
    console.log(`Deploying version: ${newVersion}`);
    console.log(`Stages: ${this.stages.length}\n`);

    const canaryInstances = this.selectCanaryInstances();

    try {
      // Deploy to canary instances
      console.log('Step 1: Deploying to canary instances...');
      await this.deployToCanary(canaryInstances, newVersion);

      // Progressive rollout
      for (let i = 0; i < this.stages.length; i++) {
        const stage = this.stages[i];
        console.log(`\nStage ${i + 1}: ${stage.percentage}% traffic`);

        await this.executeStage(stage, canaryInstances);
      }

      // Complete rollout
      console.log('\nStep 3: Completing rollout...');
      await this.completeRollout(newVersion);

      console.log('\n=== Canary Deployment Successful ===');
      return { success: true, version: newVersion };

    } catch (error) {
      console.error('\n=== Canary Deployment Failed ===');
      console.error('Error:', error.message);

      // Rollback
      console.log('\nRolling back...');
      await this.rollback(canaryInstances);

      return { success: false, error: error.message };
    }
  }

  /**
   * Select canary instances
   */
  selectCanaryInstances(percentage = 10) {
    const count = Math.ceil(this.instances.length * (percentage / 100));
    return this.instances.slice(0, count);
  }

  /**
   * Deploy to canary instances
   */
  async deployToCanary(canaryInstances, version) {
    for (const instance of canaryInstances) {
      console.log(`  Deploying to ${instance.id}...`);
      await this.deployToInstance(instance, version);
      instance.version = version;
      instance.isCanary = true;
    }

    console.log(`  Deployed to ${canaryInstances.length} canary instances`);
  }

  /**
   * Execute single stage
   */
  async executeStage(stage, canaryInstances) {
    // Route traffic
    console.log(`  Routing ${stage.percentage}% traffic to canary...`);
    await this.updateTrafficSplit(stage.percentage);

    if (stage.duration > 0) {
      // Monitor during stage
      console.log(`  Monitoring for ${stage.duration / 1000} seconds...`);
      await this.monitorStage(stage.duration, canaryInstances);
    }
  }

  /**
   * Monitor stage for issues
   */
  async monitorStage(duration, canaryInstances) {
    const startTime = Date.now();
    const checkInterval = 30000; // 30 seconds

    while (Date.now() - startTime < duration) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));

      // Get metrics
      const canaryMetrics = await this.getCanaryMetrics(canaryInstances);
      const baselineMetrics = await this.getBaselineMetrics();

      console.log('    Canary metrics:', canaryMetrics);
      console.log('    Baseline metrics:', baselineMetrics);

      // Compare and validate
      this.validateMetrics(canaryMetrics, baselineMetrics);

      const elapsed = Date.now() - startTime;
      const remaining = duration - elapsed;
      console.log(`    ${Math.ceil(remaining / 1000)}s remaining...`);
    }

    console.log('  Stage monitoring completed successfully');
  }

  /**
   * Validate metrics against thresholds
   */
  validateMetrics(canaryMetrics, baselineMetrics) {
    // Check absolute thresholds
    for (const [metric, threshold] of Object.entries(this.thresholds)) {
      if (canaryMetrics[metric] > threshold) {
        throw new Error(
          `Canary ${metric} exceeded threshold: ${canaryMetrics[metric]} > ${threshold}`
        );
      }
    }

    // Check relative to baseline (20% increase allowed)
    for (const metric of this.metrics) {
      const canaryValue = canaryMetrics[metric];
      const baselineValue = baselineMetrics[metric];
      const increase = ((canaryValue - baselineValue) / baselineValue) * 100;

      if (increase > 20) {
        throw new Error(
          `Canary ${metric} increased by ${increase.toFixed(2)}% compared to baseline`
        );
      }
    }
  }

  /**
   * Get canary metrics
   */
  async getCanaryMetrics(canaryInstances) {
    // Simulate metrics
    return {
      errorRate: Math.random() * 0.5,
      responseTime: 100 + Math.random() * 50,
      cpuUsage: 40 + Math.random() * 10
    };
  }

  /**
   * Get baseline metrics
   */
  async getBaselineMetrics() {
    // Simulate metrics
    return {
      errorRate: Math.random() * 0.3,
      responseTime: 100 + Math.random() * 30,
      cpuUsage: 40 + Math.random() * 5
    };
  }

  /**
   * Update traffic split
   */
  async updateTrafficSplit(percentage) {
    // Simulate traffic routing update
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Complete rollout to all instances
   */
  async completeRollout(version) {
    const remainingInstances = this.instances.filter(i => !i.isCanary);

    for (const instance of remainingInstances) {
      console.log(`  Deploying to ${instance.id}...`);
      await this.deployToInstance(instance, version);
      instance.version = version;
    }

    // Route 100% traffic
    await this.updateTrafficSplit(100);

    console.log('  Rollout completed to all instances');
  }

  /**
   * Deploy to instance
   */
  async deployToInstance(instance, version) {
    // Simulate deployment
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Rollback canary
   */
  async rollback(canaryInstances) {
    console.log('  Routing traffic away from canary...');
    await this.updateTrafficSplit(0);

    const previousVersion = this.instances.find(i => !i.isCanary).version;

    for (const instance of canaryInstances) {
      console.log(`  Rolling back ${instance.id}...`);
      await this.deployToInstance(instance, previousVersion);
      instance.version = previousVersion;
      instance.isCanary = false;
    }

    console.log('  Rollback completed');
  }
}

// Example usage
if (require.main === module) {
  const instances = Array.from({ length: 10 }, (_, i) => ({
    id: `instance-${i + 1}`,
    version: '1.0.0',
    host: `10.0.0.${i + 1}`,
    isCanary: false
  }));

  const canary = new CanaryDeployment({
    instances,
    stages: [
      { percentage: 10, duration: 60000 },   // 10% for 1 minute
      { percentage: 50, duration: 120000 },  // 50% for 2 minutes
      { percentage: 100, duration: 0 }       // 100%
    ],
    thresholds: {
      errorRate: 1.0,
      responseTime: 1000,
      cpuUsage: 80
    }
  });

  canary.deploy('2.0.0')
    .then(result => {
      console.log('\nDeployment result:', result);
    })
    .catch(error => {
      console.error('Deployment error:', error);
    });
}
```

## Database Migrations

### Safe Migration Strategy

```javascript
/**
 * Zero-downtime database migrations
 */

class ZeroDowntimeMigration {
  constructor(db, options = {}) {
    this.db = db;
    this.lockTimeout = options.lockTimeout || 5000;
    this.retryAttempts = options.retryAttempts || 3;
  }

  /**
   * Expand-Contract pattern for schema changes
   *
   * Phase 1 (Expand): Add new column/table alongside old
   * Phase 2 (Migrate): Dual-write to both old and new
   * Phase 3 (Contract): Remove old column/table
   */
  async executeExpandContractMigration() {
    console.log('=== Expand-Contract Migration ===\n');

    try {
      // Phase 1: Expand
      console.log('Phase 1: Expand');
      await this.expandPhase();

      // Deploy new code (writes to both old and new)
      console.log('\nDeploy application version that dual-writes');
      console.log('Wait for all instances to update...');

      // Phase 2: Backfill
      console.log('\nPhase 2: Backfill data');
      await this.backfillPhase();

      // Deploy newer code (reads from new, writes to both)
      console.log('\nDeploy application version that reads from new');
      console.log('Wait for all instances to update...');

      // Phase 3: Contract
      console.log('\nPhase 3: Contract (remove old)');
      await this.contractPhase();

      console.log('\n=== Migration Completed Successfully ===');

    } catch (error) {
      console.error('\n=== Migration Failed ===');
      console.error('Error:', error.message);
      throw error;
    }
  }

  /**
   * Expand phase - Add new schema elements
   */
  async expandPhase() {
    // Example: Renaming a column
    console.log('  Adding new column...');

    await this.executeWithLock(`
      ALTER TABLE users
      ADD COLUMN email_address VARCHAR(255);
    `);

    console.log('  New column added');

    // Add index for performance
    console.log('  Adding index concurrently...');

    await this.db.query(`
      CREATE INDEX CONCURRENTLY idx_users_email_address
      ON users(email_address);
    `);

    console.log('  Index created');
  }

  /**
   * Backfill phase - Copy data from old to new
   */
  async backfillPhase() {
    console.log('  Starting data backfill...');

    const batchSize = 1000;
    let processed = 0;

    while (true) {
      const result = await this.db.query(`
        UPDATE users
        SET email_address = email
        WHERE email_address IS NULL
        LIMIT ${batchSize};
      `);

      processed += result.rowCount;

      if (result.rowCount === 0) {
        break;
      }

      console.log(`    Processed ${processed} rows...`);

      // Small delay to avoid overloading database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`  Backfill completed (${processed} rows)`);
  }

  /**
   * Contract phase - Remove old schema elements
   */
  async contractPhase() {
    console.log('  Removing old column...');

    await this.executeWithLock(`
      ALTER TABLE users
      DROP COLUMN email;
    `);

    console.log('  Old column removed');
  }

  /**
   * Execute query with lock timeout
   */
  async executeWithLock(query) {
    await this.db.query(`SET lock_timeout = '${this.lockTimeout}ms'`);

    let attempt = 0;

    while (attempt < this.retryAttempts) {
      try {
        await this.db.query(query);
        return;
      } catch (error) {
        attempt++;

        if (error.message.includes('lock timeout')) {
          console.log(`    Lock timeout, retrying (${attempt}/${this.retryAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          throw error;
        }
      }
    }

    throw new Error('Failed after max retry attempts');
  }

  /**
   * Example: Adding a new table
   */
  async addTableMigration() {
    console.log('=== Adding New Table (Zero-Downtime) ===\n');

    // Create new table
    console.log('Step 1: Create new table...');
    await this.db.query(`
      CREATE TABLE user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        bio TEXT,
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Add indexes concurrently
    console.log('Step 2: Add indexes...');
    await this.db.query(`
      CREATE INDEX CONCURRENTLY idx_user_profiles_user_id
      ON user_profiles(user_id);
    `);

    console.log('Step 3: Deploy application code');
    console.log('  New table ready for use');
  }

  /**
   * Example: Removing a column (safe way)
   */
  async removeColumnMigration() {
    console.log('=== Removing Column (Zero-Downtime) ===\n');

    // Step 1: Deploy code that doesn't use the column
    console.log('Step 1: Deploy code that ignores column');
    console.log('  Wait for all instances to update...\n');

    // Step 2: Remove column (should be fast now)
    console.log('Step 2: Remove column...');
    await this.db.query(`
      ALTER TABLE users
      DROP COLUMN deprecated_field;
    `);

    console.log('Column removed successfully');
  }
}

// Example migration script
if (require.main === module) {
  // Mock database
  const db = {
    query: async (sql) => {
      console.log(`    Executing: ${sql.trim().split('\n')[0]}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { rowCount: Math.floor(Math.random() * 100) };
    }
  };

  const migration = new ZeroDowntimeMigration(db, {
    lockTimeout: 5000,
    retryAttempts: 3
  });

  migration.executeExpandContractMigration()
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
```

## Kubernetes Deployments

### Kubernetes Deployment Configuration

```javascript
/**
 * Kubernetes deployment strategies
 */

class KubernetesDeployment {
  /**
   * Generate rolling update deployment
   */
  static generateRollingUpdateYAML(appName, version) {
    return `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}
  labels:
    app: ${appName}
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1     # Max pods unavailable during update
      maxSurge: 1           # Max pods above desired count

  selector:
    matchLabels:
      app: ${appName}

  template:
    metadata:
      labels:
        app: ${appName}
        version: ${version}
    spec:
      containers:
      - name: ${appName}
        image: ${appName}:${version}
        ports:
        - containerPort: 3000

        # Resource limits
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

        # Liveness probe
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        # Readiness probe
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3

        # Startup probe
        startupProbe:
          httpGet:
            path: /health/startup
            port: 3000
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 30

        # Graceful shutdown
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]

      # Termination grace period
      terminationGracePeriodSeconds: 30
`.trim();
  }

  /**
   * Generate blue-green deployment
   */
  static generateBlueGreenYAML(appName, version, color) {
    return `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}-${color}
  labels:
    app: ${appName}
    color: ${color}
spec:
  replicas: 3

  selector:
    matchLabels:
      app: ${appName}
      color: ${color}

  template:
    metadata:
      labels:
        app: ${appName}
        color: ${color}
        version: ${version}
    spec:
      containers:
      - name: ${appName}
        image: ${appName}:${version}
        ports:
        - containerPort: 3000

---
apiVersion: v1
kind: Service
metadata:
  name: ${appName}
spec:
  selector:
    app: ${appName}
    color: blue  # Switch to 'green' to cutover
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
`.trim();
  }

  /**
   * Generate canary deployment with Istio
   */
  static generateCanaryWithIstio(appName, stableVersion, canaryVersion) {
    return `
# Stable deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}-stable
spec:
  replicas: 9
  selector:
    matchLabels:
      app: ${appName}
      version: stable
  template:
    metadata:
      labels:
        app: ${appName}
        version: stable
    spec:
      containers:
      - name: ${appName}
        image: ${appName}:${stableVersion}
        ports:
        - containerPort: 3000

---
# Canary deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}-canary
spec:
  replicas: 1  # 10% traffic
  selector:
    matchLabels:
      app: ${appName}
      version: canary
  template:
    metadata:
      labels:
        app: ${appName}
        version: canary
    spec:
      containers:
      - name: ${appName}
        image: ${appName}:${canaryVersion}
        ports:
        - containerPort: 3000

---
# Service
apiVersion: v1
kind: Service
metadata:
  name: ${appName}
spec:
  selector:
    app: ${appName}
  ports:
  - port: 80
    targetPort: 3000

---
# Istio VirtualService (traffic splitting)
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ${appName}
spec:
  hosts:
  - ${appName}
  http:
  - match:
    - headers:
        x-version:
          exact: canary
    route:
    - destination:
        host: ${appName}
        subset: canary
  - route:
    - destination:
        host: ${appName}
        subset: stable
      weight: 90
    - destination:
        host: ${appName}
        subset: canary
      weight: 10

---
# Istio DestinationRule
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: ${appName}
spec:
  host: ${appName}
  subsets:
  - name: stable
    labels:
      version: stable
  - name: canary
    labels:
      version: canary
`.trim();
  }
}

// Print examples
if (require.main === module) {
  console.log('=== Rolling Update Deployment ===\n');
  console.log(KubernetesDeployment.generateRollingUpdateYAML('my-app', '2.0.0'));

  console.log('\n\n=== Blue-Green Deployment ===\n');
  console.log(KubernetesDeployment.generateBlueGreenYAML('my-app', '2.0.0', 'blue'));

  console.log('\n\n=== Canary Deployment with Istio ===\n');
  console.log(KubernetesDeployment.generateCanaryWithIstio('my-app', '1.0.0', '2.0.0'));
}
```

## Case Studies

### Case Study: E-commerce Platform Deployment

```javascript
/**
 * CASE STUDY: E-commerce Zero-Downtime Deployment
 *
 * Company: Large e-commerce platform
 * Traffic: 10,000 requests/second
 * Deployment frequency: Multiple per day
 * Challenge: Black Friday (peak traffic)
 *
 * Problem: Traditional deployments caused 2-minute downtime
 * Cost: $50,000 in lost revenue per deployment
 * Solution: Implemented blue-green with canary
 *
 * Results:
 * - Zero downtime during deployments
 * - Deployed 5 times during Black Friday
 * - Zero incidents
 * - Saved estimated $250,000 in potential lost revenue
 */

const caseStudy = {
  before: {
    strategy: 'Stop-start deployment',
    downtime: 120, // seconds
    deploymentsPerDay: 2,
    incidentRate: 0.1, // 10%
    revenuePerSecond: 500,
    costPerDeployment: 60000
  },

  after: {
    strategy: 'Blue-green with canary',
    downtime: 0,
    deploymentsPerDay: 5,
    incidentRate: 0.01, // 1%
    revenuePerSecond: 500,
    costPerDeployment: 0
  },

  calculateImpact() {
    const daysBefore = 120 / this.before.downtime;
    const daysAfter = 0;

    const revenueLossBefore = this.before.deploymentsPerDay *
      this.before.downtime *
      this.before.revenuePerSecond *
      365;

    const revenueLossAfter = 0;

    const incidentCostBefore = this.before.deploymentsPerDay *
      this.before.incidentRate *
      this.before.costPerDeployment *
      365;

    const incidentCostAfter = this.after.deploymentsPerDay *
      this.after.incidentRate *
      this.after.costPerDeployment *
      365;

    return {
      annualRevenueSaved: revenueLossBefore - revenueLossAfter,
      annualIncidentCostSaved: incidentCostBefore - incidentCostAfter,
      totalSaved: (revenueLossBefore - revenueLossAfter) +
                  (incidentCostBefore - incidentCostAfter),
      deploymentFrequencyIncrease: (
        (this.after.deploymentsPerDay - this.before.deploymentsPerDay) /
        this.before.deploymentsPerDay * 100
      ).toFixed(0) + '%'
    };
  }
};

console.log('Case Study Impact Analysis:');
console.log(JSON.stringify(caseStudy.calculateImpact(), null, 2));
```

## Best Practices

```javascript
/**
 * Zero-Downtime Deployment Best Practices
 */

const DEPLOYMENT_BEST_PRACTICES = {
  planning: [
    'Choose appropriate strategy for your use case',
    'Test deployment process in staging',
    'Have rollback plan ready',
    'Document deployment process',
    'Set up monitoring and alerts',
    'Define success criteria',
    'Schedule deployments during low traffic',
    'Communicate with team'
  ],

  implementation: [
    'Implement health checks',
    'Use graceful shutdown',
    'Implement connection draining',
    'Set appropriate timeouts',
    'Use feature flags for risky changes',
    'Version APIs properly',
    'Handle database migrations separately',
    'Test backwards compatibility'
  ],

  monitoring: [
    'Monitor error rates',
    'Track response times',
    'Watch resource utilization',
    'Check logs for errors',
    'Monitor business metrics',
    'Set up alerting',
    'Use distributed tracing',
    'Have dashboard ready'
  ],

  rollback: [
    'Have automated rollback',
    'Test rollback procedure',
    'Keep previous version ready',
    'Document rollback steps',
    'Monitor during rollback',
    'Communicate rollback status',
    'Post-mortem after rollback',
    'Update runbooks'
  ]
};

console.log('Zero-Downtime Deployment Best Practices:\n');
Object.entries(DEPLOYMENT_BEST_PRACTICES).forEach(([category, practices]) => {
  console.log(`${category.toUpperCase()}:`);
  practices.forEach(practice => console.log(`  - ${practice}`));
  console.log();
});
```

## Anti-Patterns

```javascript
/**
 * Deployment Anti-Patterns to Avoid
 */

// ANTI-PATTERN 1: No health checks
// BAD: Deploy and immediately route traffic

// GOOD: Wait for health checks before routing traffic

// ANTI-PATTERN 2: No graceful shutdown
// BAD: Kill process immediately on SIGTERM

// GOOD: Drain connections, cleanup, then exit

// ANTI-PATTERN 3: Database migrations during deployment
// BAD: Run breaking migrations with code deployment

// GOOD: Use expand-contract pattern

// ANTI-PATTERN 4: No rollback plan
// BAD: Deploy and hope for the best

// GOOD: Have automated rollback ready

// ANTI-PATTERN 5: Testing in production
// BAD: Deploy directly to production without testing

// GOOD: Test in staging, use canary deployments
```

## Conclusion

Zero-downtime deployments require careful planning and implementation:

1. **Choose Right Strategy** - Rolling, blue-green, or canary
2. **Implement Health Checks** - Proper liveness and readiness
3. **Graceful Shutdown** - Drain connections cleanly
4. **Handle Migrations** - Use expand-contract pattern
5. **Monitor Closely** - Track metrics during deployment

**Key Takeaways:**
- Zero downtime is achievable with proper implementation
- Health checks are critical
- Graceful shutdown is essential
- Database migrations need special handling
- Always have rollback plan
- Monitor during deployments
- Test deployment process
- Automate everything possible

**Remember:**
- Deployments should be boring
- If deployment is risky, you're doing it wrong
- Automate the deployment process
- Practice deployments regularly
- Monitor business metrics, not just technical ones
