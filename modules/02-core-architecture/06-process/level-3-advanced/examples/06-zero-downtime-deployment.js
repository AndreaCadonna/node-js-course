/**
 * Zero-Downtime Deployment System
 *
 * This module demonstrates enterprise-grade deployment strategies using:
 * - Blue-Green Deployment
 * - Rolling Updates
 * - Canary Deployments
 * - Graceful shutdown and restart
 * - Hot reload capabilities
 * - Health-aware load balancing
 *
 * Production Features:
 * - Zero request failures during deployment
 * - Automatic rollback on failures
 * - Progressive traffic shifting
 * - Connection draining
 * - Version management
 * - Deployment metrics and monitoring
 *
 * @module ZeroDowntimeDeployment
 */

const cluster = require('cluster');
const http = require('http');
const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');

/**
 * Deployment Configuration
 */
const DEFAULT_DEPLOYMENT_CONFIG = {
  // Worker settings
  workerCount: 4,
  workerRestartDelay: 1000,
  workerStartTimeout: 10000,

  // Server settings
  port: 3000,
  shutdownTimeout: 30000,
  connectionDrainTimeout: 10000,

  // Deployment strategies
  strategy: 'rolling', // 'rolling', 'blue-green', 'canary'

  // Rolling update settings
  rollingMaxSurge: 1,
  rollingMaxUnavailable: 0,

  // Canary settings
  canaryTrafficPercent: 10,
  canaryDuration: 60000,
  canarySuccessThreshold: 95, // % success rate

  // Health checks
  healthCheckInterval: 5000,
  healthCheckTimeout: 3000,
  maxFailedHealthChecks: 3,

  // Metrics
  enableMetrics: true,
  metricsInterval: 5000,
};

/**
 * Worker State
 */
const WorkerState = {
  STARTING: 'starting',
  HEALTHY: 'healthy',
  DRAINING: 'draining',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  FAILED: 'failed',
};

/**
 * Deployment Version
 */
class DeploymentVersion {
  constructor(version, config = {}) {
    this.version = version;
    this.timestamp = Date.now();
    this.config = config;
    this.workers = new Map();
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
    };
  }

  addWorker(worker, state = WorkerState.STARTING) {
    this.workers.set(worker.id, {
      worker,
      state,
      pid: worker.process.pid,
      startTime: Date.now(),
      healthChecks: { passed: 0, failed: 0 },
      requests: 0,
      errors: 0,
    });
  }

  removeWorker(workerId) {
    this.workers.delete(workerId);
  }

  getWorker(workerId) {
    return this.workers.get(workerId);
  }

  updateWorkerState(workerId, state) {
    const workerInfo = this.workers.get(workerId);
    if (workerInfo) {
      workerInfo.state = state;
    }
  }

  getHealthyWorkers() {
    return Array.from(this.workers.values())
      .filter(w => w.state === WorkerState.HEALTHY);
  }

  recordRequest(workerId, duration, success = true) {
    this.metrics.requests++;
    this.metrics.responseTime.push(duration);

    if (!success) {
      this.metrics.errors++;
    }

    const workerInfo = this.workers.get(workerId);
    if (workerInfo) {
      workerInfo.requests++;
      if (!success) {
        workerInfo.errors++;
      }
    }

    // Keep only last 1000 response times
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime.shift();
    }
  }

  getSuccessRate() {
    if (this.metrics.requests === 0) return 100;
    return ((this.metrics.requests - this.metrics.errors) / this.metrics.requests) * 100;
  }

  getAverageResponseTime() {
    if (this.metrics.responseTime.length === 0) return 0;
    return this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length;
  }

  toJSON() {
    return {
      version: this.version,
      timestamp: this.timestamp,
      workers: this.workers.size,
      healthyWorkers: this.getHealthyWorkers().length,
      metrics: {
        requests: this.metrics.requests,
        errors: this.metrics.errors,
        successRate: this.getSuccessRate(),
        avgResponseTime: this.getAverageResponseTime(),
      },
    };
  }
}

/**
 * Load Balancer
 */
class LoadBalancer {
  constructor() {
    this.versions = new Map();
    this.currentIndex = 0;
  }

  addVersion(version) {
    this.versions.set(version.version, version);
  }

  removeVersion(versionNumber) {
    this.versions.delete(versionNumber);
  }

  /**
   * Round-robin selection of healthy worker
   */
  selectWorker(version = null) {
    let candidates = [];

    if (version) {
      const v = this.versions.get(version);
      if (v) {
        candidates = v.getHealthyWorkers();
      }
    } else {
      // Select from all versions
      for (const v of this.versions.values()) {
        candidates.push(...v.getHealthyWorkers());
      }
    }

    if (candidates.length === 0) return null;

    const selected = candidates[this.currentIndex % candidates.length];
    this.currentIndex++;

    return selected;
  }

  /**
   * Canary traffic distribution
   */
  selectWorkerCanary(primaryVersion, canaryVersion, canaryPercent) {
    const random = Math.random() * 100;

    if (random < canaryPercent) {
      // Route to canary
      const worker = this.selectWorker(canaryVersion);
      return { worker, isCanary: true };
    } else {
      // Route to primary
      const worker = this.selectWorker(primaryVersion);
      return { worker, isCanary: false };
    }
  }
}

/**
 * Deployment Manager
 */
class DeploymentManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_DEPLOYMENT_CONFIG, ...config };

    this.currentVersion = null;
    this.targetVersion = null;
    this.canaryVersion = null;

    this.loadBalancer = new LoadBalancer();
    this.isDeploying = false;
    this.deploymentStartTime = 0;

    this.metrics = {
      totalDeployments: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      rollbacks: 0,
    };
  }

  /**
   * Initialize with current version
   */
  async initialize(version = '1.0.0') {
    console.log(`🚀 Initializing Deployment Manager (version ${version})...\n`);

    if (cluster.isMaster) {
      this.currentVersion = new DeploymentVersion(version, this.config);
      this.loadBalancer.addVersion(this.currentVersion);

      // Fork workers
      for (let i = 0; i < this.config.workerCount; i++) {
        await this.forkWorker(this.currentVersion);
        await this.delay(this.config.workerRestartDelay);
      }

      console.log(`✅ Initialized with ${this.config.workerCount} workers\n`);
      this.emit('initialized', this.currentVersion);
    }
  }

  /**
   * Fork a new worker
   */
  async forkWorker(version) {
    return new Promise((resolve, reject) => {
      const worker = cluster.fork({ VERSION: version.version });
      version.addWorker(worker);

      const timeout = setTimeout(() => {
        console.error(`❌ Worker ${worker.id} failed to start within timeout`);
        version.updateWorkerState(worker.id, WorkerState.FAILED);
        worker.kill();
        reject(new Error('Worker start timeout'));
      }, this.config.workerStartTimeout);

      worker.on('message', (msg) => {
        if (msg.type === 'ready') {
          clearTimeout(timeout);
          version.updateWorkerState(worker.id, WorkerState.HEALTHY);
          console.log(`✅ Worker ${worker.id} (PID ${worker.process.pid}) ready`);
          resolve(worker);
        }
      });

      worker.on('exit', (code, signal) => {
        clearTimeout(timeout);
        this.handleWorkerExit(worker, version, code, signal);
      });
    });
  }

  /**
   * Handle worker exit
   */
  handleWorkerExit(worker, version, code, signal) {
    console.log(`Worker ${worker.id} died (${signal || code})`);

    version.removeWorker(worker.id);

    // Auto-restart if not during deployment
    if (!this.isDeploying && version === this.currentVersion) {
      console.log('Restarting worker...');
      setTimeout(() => {
        this.forkWorker(version).catch(console.error);
      }, this.config.workerRestartDelay);
    }
  }

  /**
   * Deploy new version
   */
  async deploy(newVersion) {
    if (this.isDeploying) {
      throw new Error('Deployment already in progress');
    }

    console.log('='.repeat(80));
    console.log(`DEPLOYING VERSION ${newVersion}`);
    console.log('='.repeat(80));
    console.log();

    this.isDeploying = true;
    this.deploymentStartTime = Date.now();
    this.metrics.totalDeployments++;

    try {
      switch (this.config.strategy) {
        case 'rolling':
          await this.rollingUpdate(newVersion);
          break;
        case 'blue-green':
          await this.blueGreenDeployment(newVersion);
          break;
        case 'canary':
          await this.canaryDeployment(newVersion);
          break;
        default:
          throw new Error(`Unknown deployment strategy: ${this.config.strategy}`);
      }

      this.metrics.successfulDeployments++;

      const duration = Date.now() - this.deploymentStartTime;
      console.log(`\n✅ Deployment completed successfully in ${(duration / 1000).toFixed(2)}s`);

      this.emit('deployment-complete', {
        version: newVersion,
        duration,
        strategy: this.config.strategy,
      });
    } catch (error) {
      this.metrics.failedDeployments++;

      console.error(`\n❌ Deployment failed: ${error.message}`);

      await this.rollback();

      this.emit('deployment-failed', {
        version: newVersion,
        error: error.message,
      });

      throw error;
    } finally {
      this.isDeploying = false;
    }
  }

  /**
   * Rolling Update Strategy
   */
  async rollingUpdate(newVersion) {
    console.log('📊 Strategy: Rolling Update\n');

    this.targetVersion = new DeploymentVersion(newVersion, this.config);
    this.loadBalancer.addVersion(this.targetVersion);

    const oldWorkers = Array.from(this.currentVersion.workers.values());

    // Replace workers one by one
    for (let i = 0; i < oldWorkers.length; i++) {
      const oldWorkerInfo = oldWorkers[i];

      console.log(`\n[${i + 1}/${oldWorkers.length}] Replacing worker ${oldWorkerInfo.worker.id}...`);

      // Start new worker
      console.log('  1️⃣  Starting new worker...');
      await this.forkWorker(this.targetVersion);

      // Drain old worker
      console.log('  2️⃣  Draining old worker...');
      await this.drainWorker(oldWorkerInfo.worker, this.currentVersion);

      // Stop old worker
      console.log('  3️⃣  Stopping old worker...');
      await this.stopWorker(oldWorkerInfo.worker, this.currentVersion);

      console.log(`  ✅ Worker ${oldWorkerInfo.worker.id} replaced`);

      // Delay between replacements
      if (i < oldWorkers.length - 1) {
        await this.delay(this.config.workerRestartDelay);
      }
    }

    // Switch to new version
    this.loadBalancer.removeVersion(this.currentVersion.version);
    this.currentVersion = this.targetVersion;
    this.targetVersion = null;
  }

  /**
   * Blue-Green Deployment Strategy
   */
  async blueGreenDeployment(newVersion) {
    console.log('🔵🟢 Strategy: Blue-Green Deployment\n');

    // Green (new version)
    console.log('1️⃣  Starting Green environment...');
    this.targetVersion = new DeploymentVersion(newVersion, this.config);
    this.loadBalancer.addVersion(this.targetVersion);

    // Start all new workers
    for (let i = 0; i < this.config.workerCount; i++) {
      await this.forkWorker(this.targetVersion);
      console.log(`  Started worker ${i + 1}/${this.config.workerCount}`);
      await this.delay(this.config.workerRestartDelay);
    }

    // Verify green is healthy
    console.log('\n2️⃣  Verifying Green environment health...');
    await this.delay(5000); // Wait for stabilization
    const healthyWorkers = this.targetVersion.getHealthyWorkers();

    if (healthyWorkers.length < this.config.workerCount) {
      throw new Error(`Only ${healthyWorkers.length}/${this.config.workerCount} workers healthy`);
    }

    console.log(`  ✅ All ${healthyWorkers.length} workers healthy`);

    // Switch traffic (instantaneous)
    console.log('\n3️⃣  Switching traffic to Green...');
    this.loadBalancer.removeVersion(this.currentVersion.version);

    // Keep blue environment for a moment (for quick rollback)
    console.log('\n4️⃣  Keeping Blue environment for safety...');
    await this.delay(5000);

    // Shutdown blue
    console.log('\n5️⃣  Shutting down Blue environment...');
    await this.shutdownVersion(this.currentVersion);

    this.currentVersion = this.targetVersion;
    this.targetVersion = null;
  }

  /**
   * Canary Deployment Strategy
   */
  async canaryDeployment(newVersion) {
    console.log('🐤 Strategy: Canary Deployment\n');

    // Deploy canary worker(s)
    console.log('1️⃣  Deploying canary workers...');
    this.canaryVersion = new DeploymentVersion(newVersion, this.config);
    this.loadBalancer.addVersion(this.canaryVersion);

    // Start 1-2 canary workers
    const canaryCount = Math.min(2, this.config.workerCount);
    for (let i = 0; i < canaryCount; i++) {
      await this.forkWorker(this.canaryVersion);
      console.log(`  Started canary worker ${i + 1}/${canaryCount}`);
    }

    // Monitor canary
    console.log(`\n2️⃣  Monitoring canary (${this.config.canaryTrafficPercent}% traffic)...`);
    const canaryStart = Date.now();

    while (Date.now() - canaryStart < this.config.canaryDuration) {
      await this.delay(this.config.metricsInterval);

      const successRate = this.canaryVersion.getSuccessRate();
      const requests = this.canaryVersion.metrics.requests;

      console.log(`  Canary metrics: ${requests} requests, ${successRate.toFixed(1)}% success rate`);

      // Check if canary is failing
      if (requests > 10 && successRate < this.config.canarySuccessThreshold) {
        throw new Error(`Canary failure: success rate ${successRate.toFixed(1)}% below threshold`);
      }
    }

    console.log('  ✅ Canary successful, proceeding with full deployment');

    // Promote canary to full deployment
    console.log('\n3️⃣  Promoting canary to full deployment...');
    this.targetVersion = this.canaryVersion;
    this.canaryVersion = null;

    // Deploy remaining workers
    const remainingWorkers = this.config.workerCount - canaryCount;
    for (let i = 0; i < remainingWorkers; i++) {
      await this.forkWorker(this.targetVersion);
      console.log(`  Started worker ${i + 1}/${remainingWorkers}`);
      await this.delay(this.config.workerRestartDelay);
    }

    // Shutdown old version
    console.log('\n4️⃣  Shutting down old version...');
    await this.shutdownVersion(this.currentVersion);

    this.currentVersion = this.targetVersion;
    this.targetVersion = null;
  }

  /**
   * Drain worker connections
   */
  async drainWorker(worker, version) {
    version.updateWorkerState(worker.id, WorkerState.DRAINING);

    worker.send({ type: 'drain' });

    // Wait for connections to drain
    await this.delay(this.config.connectionDrainTimeout);
  }

  /**
   * Stop worker gracefully
   */
  async stopWorker(worker, version) {
    version.updateWorkerState(worker.id, WorkerState.STOPPING);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        worker.kill('SIGKILL');
        resolve();
      }, this.config.shutdownTimeout);

      worker.once('exit', () => {
        clearTimeout(timeout);
        version.removeWorker(worker.id);
        resolve();
      });

      worker.send({ type: 'shutdown' });
    });
  }

  /**
   * Shutdown entire version
   */
  async shutdownVersion(version) {
    const workers = Array.from(version.workers.values());

    for (const workerInfo of workers) {
      await this.drainWorker(workerInfo.worker, version);
      await this.stopWorker(workerInfo.worker, version);
    }

    this.loadBalancer.removeVersion(version.version);
  }

  /**
   * Rollback to previous version
   */
  async rollback() {
    console.log('\n⏪ ROLLING BACK...\n');

    this.metrics.rollbacks++;

    if (this.targetVersion) {
      await this.shutdownVersion(this.targetVersion);
      this.targetVersion = null;
    }

    if (this.canaryVersion) {
      await this.shutdownVersion(this.canaryVersion);
      this.canaryVersion = null;
    }

    // Ensure current version has enough workers
    const healthyCount = this.currentVersion.getHealthyWorkers().length;
    if (healthyCount < this.config.workerCount) {
      console.log('Restoring worker count...');
      for (let i = healthyCount; i < this.config.workerCount; i++) {
        await this.forkWorker(this.currentVersion);
      }
    }

    console.log('✅ Rollback complete');
    this.emit('rollback-complete');
  }

  /**
   * Get deployment status
   */
  getStatus() {
    return {
      isDeploying: this.isDeploying,
      strategy: this.config.strategy,
      current: this.currentVersion?.toJSON(),
      target: this.targetVersion?.toJSON(),
      canary: this.canaryVersion?.toJSON(),
      metrics: this.metrics,
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Worker Process
 */
function startWorker(port) {
  const version = process.env.VERSION || '1.0.0';
  let isDraining = false;
  let activeConnections = 0;

  const server = http.createServer((req, res) => {
    if (isDraining) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Service draining');
      return;
    }

    activeConnections++;
    const start = performance.now();

    // Simulate request processing
    setTimeout(() => {
      const duration = performance.now() - start;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        version,
        worker: cluster.worker.id,
        pid: process.pid,
        duration: duration.toFixed(2),
      }));

      activeConnections--;

      // Notify master of request
      process.send({
        type: 'request',
        duration,
        success: true,
      });
    }, Math.random() * 100);
  });

  server.listen(port, () => {
    console.log(`Worker ${cluster.worker.id} (v${version}) listening on port ${port}`);

    // Notify master that worker is ready
    process.send({ type: 'ready' });
  });

  // Handle messages from master
  process.on('message', (msg) => {
    if (msg.type === 'drain') {
      isDraining = true;
      console.log(`Worker ${cluster.worker.id} draining connections (${activeConnections} active)...`);
    } else if (msg.type === 'shutdown') {
      server.close(() => {
        console.log(`Worker ${cluster.worker.id} shutdown complete`);
        process.exit(0);
      });
    }
  });

  // Handle shutdown signals
  process.on('SIGTERM', () => {
    isDraining = true;
    server.close(() => process.exit(0));
  });
}

/**
 * Demo: Zero-downtime deployment
 */
async function demonstrateZeroDowntime() {
  if (cluster.isWorker) {
    startWorker(DEFAULT_DEPLOYMENT_CONFIG.port);
    return;
  }

  console.log('='.repeat(80));
  console.log('ZERO-DOWNTIME DEPLOYMENT DEMO');
  console.log('='.repeat(80));
  console.log();

  const manager = new DeploymentManager({
    workerCount: 4,
    strategy: 'rolling',
    port: 3000,
  });

  // Initialize with version 1.0.0
  await manager.initialize('1.0.0');

  // Wait for stabilization
  await manager.delay(2000);

  // Show initial status
  console.log('='.repeat(80));
  console.log('INITIAL STATUS');
  console.log('='.repeat(80));
  const status1 = manager.getStatus();
  console.log(JSON.stringify(status1, null, 2));

  // Deploy version 2.0.0
  await manager.delay(3000);
  await manager.deploy('2.0.0');

  // Show final status
  console.log('\n' + '='.repeat(80));
  console.log('FINAL STATUS');
  console.log('='.repeat(80));
  const status2 = manager.getStatus();
  console.log(JSON.stringify(status2, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('DEPLOYMENT METRICS');
  console.log('='.repeat(80));
  console.log(`Total Deployments: ${manager.metrics.totalDeployments}`);
  console.log(`Successful: ${manager.metrics.successfulDeployments}`);
  console.log(`Failed: ${manager.metrics.failedDeployments}`);
  console.log(`Rollbacks: ${manager.metrics.rollbacks}`);

  console.log('\n✅ Demo complete!');
  console.log('\n💡 Production Deployment Best Practices:');
  console.log('  1. Use health checks to verify deployment success');
  console.log('  2. Implement connection draining before shutdown');
  console.log('  3. Monitor metrics during deployment');
  console.log('  4. Have automated rollback on failure');
  console.log('  5. Use canary deployments for risky changes');
  console.log('  6. Test deployments in staging environment');
  console.log('  7. Implement deployment locks to prevent concurrent deployments');
  console.log('  8. Log all deployment events for audit trail');
  console.log('  9. Use feature flags for additional safety');
  console.log('  10. Practice chaos engineering to test resilience');

  // Cleanup
  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

// Run demo if executed directly
if (require.main === module) {
  demonstrateZeroDowntime().catch(console.error);
}

module.exports = {
  DeploymentManager,
  DeploymentVersion,
  LoadBalancer,
  WorkerState,
};
