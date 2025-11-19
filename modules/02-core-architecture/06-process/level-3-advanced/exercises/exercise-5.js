/**
 * Exercise 5: Zero-Downtime Deployment System
 * ============================================
 *
 * Difficulty: Very Hard
 *
 * Task:
 * Build a complete zero-downtime deployment orchestration system that manages
 * rolling deployments, health checks, traffic draining, and automatic rollback.
 * This system should handle real production deployment scenarios.
 *
 * Requirements:
 * 1. Implement rolling deployment strategy
 * 2. Coordinate multiple worker processes
 * 3. Perform health checks before switching traffic
 * 4. Implement connection draining
 * 5. Support multiple deployment strategies (rolling, blue-green, canary)
 * 6. Automatic rollback on failure
 * 7. Zero-downtime guarantee with overlap period
 * 8. Deployment progress tracking and reporting
 * 9. Pre-deployment and post-deployment hooks
 * 10. Deployment state persistence and recovery
 *
 * Learning Goals:
 * - Zero-downtime deployment patterns
 * - Process orchestration
 * - Rolling update strategies
 * - Health check integration
 * - Production deployment best practices
 * - Rollback and recovery mechanisms
 *
 * Test:
 * 1. Run deployment system
 * 2. Trigger rolling deployment
 * 3. Observe zero-downtime behavior
 * 4. Test failure scenarios
 * 5. Verify automatic rollback
 *
 * Run: node exercise-5.js
 */

const cluster = require('cluster');
const http = require('http');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Worker settings
  NUM_WORKERS: 4,
  WORKER_PORT_START: 3000,

  // Deployment settings
  DEPLOYMENT_STRATEGY: 'rolling',  // 'rolling' | 'blue-green' | 'canary'
  ROLLING_UPDATE_DELAY: 5000,      // 5 seconds between worker updates
  OVERLAP_PERIOD: 10000,            // 10 seconds overlap (old + new)

  // Health check settings
  HEALTH_CHECK_INTERVAL: 2000,     // 2 seconds
  HEALTH_CHECK_TIMEOUT: 5000,      // 5 seconds timeout
  MIN_HEALTHY_CHECKS: 3,           // Require 3 consecutive healthy checks

  // Drain settings
  DRAIN_TIMEOUT: 30000,            // 30 seconds max drain time
  GRACEFUL_SHUTDOWN_TIMEOUT: 10000,

  // Rollback settings
  AUTO_ROLLBACK: true,
  MAX_FAILURES_BEFORE_ROLLBACK: 2,

  // State persistence
  STATE_FILE: './deployment-state.json',
};

// ============================================================================
// Deployment States
// ============================================================================

const DeploymentState = {
  IDLE: 'IDLE',
  PREPARING: 'PREPARING',
  DEPLOYING: 'DEPLOYING',
  DRAINING: 'DRAINING',
  ROLLING_BACK: 'ROLLING_BACK',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

// ============================================================================
// Worker Manager
// ============================================================================

class WorkerManager {
  /**
   * TODO 1: Implement Worker Manager
   *
   * Manage individual worker processes:
   * - Track worker state (starting, healthy, draining, stopping)
   * - Perform health checks
   * - Handle graceful shutdown
   * - Monitor for crashes
   */
  constructor(workerId, port, config) {
    this.workerId = workerId;
    this.port = port;
    this.config = config;
    this.worker = null;
    this.state = 'stopped';
    this.healthCheckCount = 0;
    this.consecutiveHealthy = 0;
    this.version = null;
    this.startTime = null;
  }

  /**
   * TODO: Spawn worker process
   */
  async spawn(version) {
    // TODO: Spawn worker using cluster.fork()
    // this.version = version;
    // this.state = 'starting';
    // this.startTime = Date.now();
    //
    // return new Promise((resolve, reject) => {
    //   this.worker = cluster.fork({
    //     WORKER_ID: this.workerId,
    //     WORKER_PORT: this.port,
    //     VERSION: version
    //   });
    //
    //   this.worker.on('online', () => {
    //     console.log(`✅ Worker ${this.workerId} (v${version}) online on port ${this.port}`);
    //     resolve();
    //   });
    //
    //   this.worker.on('exit', (code, signal) => {
    //     console.log(`❌ Worker ${this.workerId} exited: ${code || signal}`);
    //     this.state = 'stopped';
    //   });
    //
    //   this.worker.on('error', (error) => {
    //     console.error(`❌ Worker ${this.workerId} error:`, error.message);
    //     reject(error);
    //   });
    //
    //   // Timeout
    //   setTimeout(() => {
    //     if (this.state === 'starting') {
    //       reject(new Error('Worker startup timeout'));
    //     }
    //   }, 10000);
    // });
  }

  /**
   * TODO: Perform health check
   */
  async healthCheck() {
    // TODO: Check if worker is healthy
    // this.healthCheckCount++;
    //
    // try {
    //   const response = await this.httpRequest('GET', '/health');
    //
    //   if (response.statusCode === 200) {
    //     this.consecutiveHealthy++;
    //
    //     if (this.consecutiveHealthy >= this.config.MIN_HEALTHY_CHECKS &&
    //         this.state === 'starting') {
    //       this.state = 'healthy';
    //       console.log(`💚 Worker ${this.workerId} is healthy`);
    //     }
    //
    //     return true;
    //   }
    //
    //   this.consecutiveHealthy = 0;
    //   return false;
    // } catch (error) {
    //   this.consecutiveHealthy = 0;
    //   return false;
    // }
  }

  /**
   * TODO: Drain connections
   */
  async drain() {
    // TODO: Drain active connections
    // console.log(`🔄 Draining worker ${this.workerId}...`);
    // this.state = 'draining';
    //
    // // Signal worker to stop accepting new connections
    // if (this.worker && this.worker.isConnected()) {
    //   this.worker.send({ type: 'drain' });
    // }
    //
    // // Wait for connections to close
    // await new Promise(resolve => setTimeout(resolve, this.config.DRAIN_TIMEOUT));
  }

  /**
   * TODO: Gracefully shutdown worker
   */
  async shutdown() {
    // TODO: Shutdown worker gracefully
    // console.log(`🛑 Shutting down worker ${this.workerId}...`);
    //
    // if (!this.worker) return;
    //
    // this.state = 'stopping';
    //
    // // Graceful shutdown
    // if (this.worker.isConnected()) {
    //   this.worker.send({ type: 'shutdown' });
    //
    //   // Wait for graceful shutdown
    //   await new Promise((resolve) => {
    //     const timeout = setTimeout(() => {
    //       console.log(`⚠️  Force killing worker ${this.workerId}`);
    //       this.worker.kill('SIGKILL');
    //       resolve();
    //     }, this.config.GRACEFUL_SHUTDOWN_TIMEOUT);
    //
    //     this.worker.once('exit', () => {
    //       clearTimeout(timeout);
    //       resolve();
    //     });
    //   });
    // }
  }

  httpRequest(method, path) {
    // TODO: Make HTTP request to worker
    // return new Promise((resolve, reject) => {
    //   const req = http.request({
    //     hostname: 'localhost',
    //     port: this.port,
    //     path,
    //     method,
    //     timeout: this.config.HEALTH_CHECK_TIMEOUT
    //   }, (res) => {
    //     resolve({ statusCode: res.statusCode });
    //   });
    //
    //   req.on('error', reject);
    //   req.on('timeout', () => {
    //     req.destroy();
    //     reject(new Error('Timeout'));
    //   });
    //
    //   req.end();
    // });
  }

  getStatus() {
    return {
      workerId: this.workerId,
      port: this.port,
      state: this.state,
      version: this.version,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      healthChecks: this.healthCheckCount,
      consecutiveHealthy: this.consecutiveHealthy
    };
  }
}

// ============================================================================
// Deployment Orchestrator
// ============================================================================

class DeploymentOrchestrator extends EventEmitter {
  /**
   * TODO 2: Implement Deployment Orchestrator
   *
   * Orchestrate the entire deployment:
   * - Manage multiple workers
   * - Coordinate rolling updates
   * - Monitor deployment progress
   * - Handle rollbacks
   * - Track deployment state
   */
  constructor(config = CONFIG) {
    super();
    this.config = config;
    this.workers = [];
    this.state = DeploymentState.IDLE;
    this.currentVersion = '1.0.0';
    this.targetVersion = null;
    this.deploymentStartTime = null;
    this.failureCount = 0;

    // Statistics
    this.stats = {
      totalDeployments: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      rollbacks: 0
    };
  }

  /**
   * TODO 3: Initialize workers
   */
  async initialize() {
    // TODO: Initialize all workers with current version
    // console.log('🚀 Initializing deployment system...\n');
    //
    // for (let i = 0; i < this.config.NUM_WORKERS; i++) {
    //   const port = this.config.WORKER_PORT_START + i;
    //   const worker = new WorkerManager(i, port, this.config);
    //   this.workers.push(worker);
    //
    //   await worker.spawn(this.currentVersion);
    //
    //   // Wait for health check
    //   await this.waitForHealthy(worker);
    // }
    //
    // console.log(`✅ All ${this.workers.length} workers initialized (v${this.currentVersion})\n`);
  }

  /**
   * TODO 4: Wait for worker to become healthy
   */
  async waitForHealthy(worker) {
    // TODO: Poll health check until healthy
    // const maxAttempts = 20;
    // let attempts = 0;
    //
    // while (attempts < maxAttempts) {
    //   const healthy = await worker.healthCheck();
    //
    //   if (worker.state === 'healthy') {
    //     return true;
    //   }
    //
    //   await new Promise(resolve => setTimeout(resolve, this.config.HEALTH_CHECK_INTERVAL));
    //   attempts++;
    // }
    //
    // throw new Error(`Worker ${worker.workerId} failed to become healthy`);
  }

  /**
   * TODO 5: Deploy new version with rolling strategy
   */
  async deployRolling(newVersion) {
    // TODO: Implement rolling deployment
    // console.log(`\n${'═'.repeat(70)}`);
    // console.log(`🚀 ROLLING DEPLOYMENT: ${this.currentVersion} -> ${newVersion}`);
    // console.log('═'.repeat(70) + '\n');
    //
    // this.state = DeploymentState.DEPLOYING;
    // this.targetVersion = newVersion;
    // this.deploymentStartTime = Date.now();
    // this.failureCount = 0;
    //
    // try {
    //   // Deploy workers one by one
    //   for (let i = 0; i < this.workers.length; i++) {
    //     const worker = this.workers[i];
    //
    //     console.log(`\n📦 Deploying worker ${worker.workerId} (${i+1}/${this.workers.length})...`);
    //
    //     // Spawn new worker with new version
    //     const newPort = worker.port + 100; // Temporary port for new version
    //     const newWorker = new WorkerManager(worker.workerId, newPort, this.config);
    //
    //     await newWorker.spawn(newVersion);
    //     await this.waitForHealthy(newWorker);
    //
    //     console.log(`✅ New worker ${newWorker.workerId} is healthy`);
    //
    //     // Drain old worker
    //     await worker.drain();
    //
    //     // Shutdown old worker
    //     await worker.shutdown();
    //
    //     // Replace with new worker
    //     this.workers[i] = newWorker;
    //
    //     console.log(`✅ Worker ${worker.workerId} updated successfully`);
    //
    //     // Wait before next worker
    //     if (i < this.workers.length - 1) {
    //       console.log(`⏳ Waiting ${this.config.ROLLING_UPDATE_DELAY}ms before next update...`);
    //       await new Promise(resolve =>
    //         setTimeout(resolve, this.config.ROLLING_UPDATE_DELAY));
    //     }
    //   }
    //
    //   this.currentVersion = newVersion;
    //   this.state = DeploymentState.COMPLETED;
    //   this.stats.successfulDeployments++;
    //
    //   const duration = Date.now() - this.deploymentStartTime;
    //   console.log(`\n${'═'.repeat(70)}`);
    //   console.log(`✅ DEPLOYMENT COMPLETED (${duration}ms)`);
    //   console.log('═'.repeat(70) + '\n');
    //
    //   return true;
    // } catch (error) {
    //   console.error(`\n❌ Deployment failed:`, error.message);
    //   this.failureCount++;
    //
    //   if (this.config.AUTO_ROLLBACK &&
    //       this.failureCount <= this.config.MAX_FAILURES_BEFORE_ROLLBACK) {
    //     await this.rollback();
    //   }
    //
    //   this.state = DeploymentState.FAILED;
    //   this.stats.failedDeployments++;
    //   return false;
    // }
  }

  /**
   * TODO 6: Rollback to previous version
   */
  async rollback() {
    // TODO: Rollback to previous version
    // console.log(`\n${'═'.repeat(70)}`);
    // console.log(`🔙 ROLLING BACK TO v${this.currentVersion}`);
    // console.log('═'.repeat(70) + '\n');
    //
    // this.state = DeploymentState.ROLLING_BACK;
    // this.stats.rollbacks++;
    //
    // // Similar to rolling deployment but back to current version
    // // Implementation would mirror deployRolling
    //
    // console.log('✅ Rollback completed\n');
  }

  /**
   * TODO 7: Get deployment status
   */
  getStatus() {
    // TODO: Return deployment status
    // return {
    //   state: this.state,
    //   currentVersion: this.currentVersion,
    //   targetVersion: this.targetVersion,
    //   workers: this.workers.map(w => w.getStatus()),
    //   stats: this.stats,
    //   uptime: this.deploymentStartTime ?
    //     Date.now() - this.deploymentStartTime : 0
    // };
  }

  /**
   * TODO 8: Save deployment state
   */
  saveState() {
    // TODO: Persist deployment state
    // const state = {
    //   currentVersion: this.currentVersion,
    //   timestamp: new Date().toISOString(),
    //   stats: this.stats
    // };
    //
    // fs.writeFileSync(this.config.STATE_FILE, JSON.stringify(state, null, 2));
  }

  /**
   * TODO 9: Load deployment state
   */
  loadState() {
    // TODO: Load persisted state
    // try {
    //   if (fs.existsSync(this.config.STATE_FILE)) {
    //     const state = JSON.parse(fs.readFileSync(this.config.STATE_FILE, 'utf8'));
    //     this.currentVersion = state.currentVersion;
    //     this.stats = state.stats || this.stats;
    //     console.log(`📂 Loaded state: v${this.currentVersion}`);
    //   }
    // } catch (error) {
    //   console.error('⚠️  Failed to load state:', error.message);
    // }
  }

  /**
   * TODO 10: Shutdown all workers
   */
  async shutdown() {
    // TODO: Gracefully shutdown all workers
    // console.log('\n🛑 Shutting down all workers...\n');
    //
    // for (const worker of this.workers) {
    //   await worker.shutdown();
    // }
    //
    // this.saveState();
    // console.log('✅ All workers shut down\n');
  }
}

// ============================================================================
// Worker Process (Child)
// ============================================================================

/**
 * TODO 11: Implement worker process logic
 *
 * This runs in the forked worker:
 * - Create HTTP server
 * - Handle requests
 * - Respond to health checks
 * - Handle drain signal
 * - Implement graceful shutdown
 */
function runWorker() {
  // TODO: Implement worker process
  // const workerId = process.env.WORKER_ID;
  // const port = process.env.WORKER_PORT;
  // const version = process.env.VERSION;
  //
  // let isDraining = false;
  // let activeConnections = 0;
  //
  // const server = http.createServer((req, res) => {
  //   activeConnections++;
  //
  //   if (isDraining) {
  //     res.writeHead(503, { 'Connection': 'close' });
  //     res.end('Service unavailable - draining');
  //     activeConnections--;
  //     return;
  //   }
  //
  //   if (req.url === '/health') {
  //     res.writeHead(200);
  //     res.end(JSON.stringify({
  //       healthy: true,
  //       version,
  //       workerId,
  //       uptime: process.uptime()
  //     }));
  //   } else {
  //     res.writeHead(200);
  //     res.end(`Worker ${workerId} v${version} - ${new Date().toISOString()}`);
  //   }
  //
  //   activeConnections--;
  // });
  //
  // server.listen(port, () => {
  //   console.log(`Worker ${workerId} v${version} listening on port ${port}`);
  // });
  //
  // // Handle IPC messages
  // process.on('message', (msg) => {
  //   if (msg.type === 'drain') {
  //     isDraining = true;
  //     server.close();
  //   } else if (msg.type === 'shutdown') {
  //     server.close(() => {
  //       process.exit(0);
  //     });
  //   }
  // });
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  if (cluster.isMaster) {
    // Master process
    console.log('═'.repeat(70));
    console.log('ZERO-DOWNTIME DEPLOYMENT SYSTEM');
    console.log('═'.repeat(70));
    console.log();

    // TODO: Create orchestrator and initialize
    // const orchestrator = new DeploymentOrchestrator();
    // orchestrator.loadState();
    //
    // await orchestrator.initialize();

    // TODO: Simulate deployment after 10 seconds
    // setTimeout(async () => {
    //   await orchestrator.deployRolling('2.0.0');
    //
    //   // Another deployment
    //   setTimeout(async () => {
    //     await orchestrator.deployRolling('3.0.0');
    //   }, 20000);
    // }, 10000);

    // TODO: Handle shutdown
    // process.on('SIGINT', async () => {
    //   console.log('\n\n🛑 Shutting down deployment system...');
    //   await orchestrator.shutdown();
    //   process.exit(0);
    // });

    console.log('💡 Press Ctrl+C to shutdown\n');
  } else {
    // Worker process
    // runWorker();
  }
}

// TODO: Uncomment to run
// main();

/**
 * DEPLOYMENT STRATEGIES:
 *
 * 1. Rolling Deployment (Implemented):
 *    - Update workers one at a time
 *    - Maintains service availability
 *    - Slower but safest
 *
 * 2. Blue-Green Deployment:
 *    - Spin up complete new set of workers
 *    - Switch traffic all at once
 *    - Quick rollback capability
 *
 * 3. Canary Deployment:
 *    - Deploy to small subset first
 *    - Monitor metrics
 *    - Gradually increase traffic
 *
 * PRODUCTION CONSIDERATIONS:
 *
 * 1. Load Balancer Integration:
 *    - Deregister workers before draining
 *    - Use health checks for traffic routing
 *
 * 2. Database Migrations:
 *    - Run migrations before deployment
 *    - Ensure backward compatibility
 *    - Use feature flags for new features
 *
 * 3. Monitoring:
 *    - Track error rates during deployment
 *    - Monitor response times
 *    - Alert on anomalies
 *
 * 4. Testing:
 *    - Smoke tests after each worker update
 *    - Integration tests before deployment
 *    - Automated rollback triggers
 */
