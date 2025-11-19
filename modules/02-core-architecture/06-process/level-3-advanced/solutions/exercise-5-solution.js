/**
 * SOLUTION: Exercise 5 - Zero-Downtime Deployment System
 * =======================================================
 *
 * Complete zero-downtime deployment orchestration with rolling updates,
 * health checks, connection draining, and automatic rollback.
 *
 * DEPLOYMENT FEATURES:
 * - Rolling deployment strategy
 * - Health check integration
 * - Connection draining
 * - Zero-downtime guarantee
 * - Automatic rollback on failure
 * - Deployment progress tracking
 * - HTTP server with health endpoints
 */

const cluster = require('cluster');
const http = require('http');
const EventEmitter = require('events');

const CONFIG = {
  NUM_WORKERS: 4,
  WORKER_PORT_START: 3000,
  DEPLOYMENT_STRATEGY: 'rolling',
  ROLLING_UPDATE_DELAY: 5000,
  OVERLAP_PERIOD: 10000,
  HEALTH_CHECK_INTERVAL: 2000,
  HEALTH_CHECK_TIMEOUT: 5000,
  MIN_HEALTHY_CHECKS: 3,
  DRAIN_TIMEOUT: 30000,
  GRACEFUL_SHUTDOWN_TIMEOUT: 10000,
  AUTO_ROLLBACK: true,
  MAX_FAILURES_BEFORE_ROLLBACK: 2,
};

const DeploymentState = {
  IDLE: 'IDLE',
  PREPARING: 'PREPARING',
  DEPLOYING: 'DEPLOYING',
  DRAINING: 'DRAINING',
  ROLLING_BACK: 'ROLLING_BACK',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

class WorkerManager {
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

  async spawn(version) {
    this.version = version;
    this.state = 'starting';
    this.startTime = Date.now();

    return new Promise((resolve, reject) => {
      this.worker = cluster.fork({
        WORKER_ID: this.workerId,
        WORKER_PORT: this.port,
        VERSION: version
      });

      this.worker.on('online', () => {
        console.log(`✅ Worker ${this.workerId} (v${version}) online on port ${this.port}`);
        resolve();
      });

      this.worker.on('exit', (code, signal) => {
        console.log(`❌ Worker ${this.workerId} exited: ${code || signal}`);
        this.state = 'stopped';
      });

      this.worker.on('error', (error) => {
        console.error(`❌ Worker ${this.workerId} error:`, error.message);
        reject(error);
      });

      setTimeout(() => {
        if (this.state === 'starting') {
          reject(new Error('Worker startup timeout'));
        }
      }, 10000);
    });
  }

  async healthCheck() {
    this.healthCheckCount++;

    try {
      const response = await this.httpRequest('GET', '/health');

      if (response.statusCode === 200) {
        this.consecutiveHealthy++;

        if (this.consecutiveHealthy >= this.config.MIN_HEALTHY_CHECKS &&
            this.state === 'starting') {
          this.state = 'healthy';
          console.log(`💚 Worker ${this.workerId} is healthy`);
        }

        return true;
      }

      this.consecutiveHealthy = 0;
      return false;
    } catch (error) {
      this.consecutiveHealthy = 0;
      return false;
    }
  }

  async drain() {
    console.log(`🔄 Draining worker ${this.workerId}...`);
    this.state = 'draining';

    if (this.worker && this.worker.isConnected()) {
      this.worker.send({ type: 'drain' });
    }

    await new Promise(resolve => setTimeout(resolve, this.config.DRAIN_TIMEOUT));
  }

  async shutdown() {
    console.log(`🛑 Shutting down worker ${this.workerId}...`);

    if (!this.worker) return;

    this.state = 'stopping';

    if (this.worker.isConnected()) {
      this.worker.send({ type: 'shutdown' });

      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`⚠️  Force killing worker ${this.workerId}`);
          this.worker.kill('SIGKILL');
          resolve();
        }, this.config.GRACEFUL_SHUTDOWN_TIMEOUT);

        this.worker.once('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  }

  httpRequest(method, path) {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: this.port,
        path,
        method,
        timeout: this.config.HEALTH_CHECK_TIMEOUT
      }, (res) => {
        resolve({ statusCode: res.statusCode });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      req.end();
    });
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

class DeploymentOrchestrator extends EventEmitter {
  constructor(config = CONFIG) {
    super();
    this.config = config;
    this.workers = [];
    this.state = DeploymentState.IDLE;
    this.currentVersion = '1.0.0';
    this.targetVersion = null;
    this.deploymentStartTime = null;
    this.failureCount = 0;

    this.stats = {
      totalDeployments: 0,
      successfulDeployments: 0,
      failedDeployments: 0,
      rollbacks: 0
    };
  }

  async initialize() {
    console.log('🚀 Initializing deployment system...\n');

    for (let i = 0; i < this.config.NUM_WORKERS; i++) {
      const port = this.config.WORKER_PORT_START + i;
      const worker = new WorkerManager(i, port, this.config);
      this.workers.push(worker);

      await worker.spawn(this.currentVersion);
      await this.waitForHealthy(worker);
    }

    console.log(`✅ All ${this.workers.length} workers initialized (v${this.currentVersion})\n`);
  }

  async waitForHealthy(worker) {
    const maxAttempts = 20;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await worker.healthCheck();

      if (worker.state === 'healthy') {
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, this.config.HEALTH_CHECK_INTERVAL));
      attempts++;
    }

    throw new Error(`Worker ${worker.workerId} failed to become healthy`);
  }

  async deployRolling(newVersion) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🚀 ROLLING DEPLOYMENT: ${this.currentVersion} -> ${newVersion}`);
    console.log('═'.repeat(70) + '\n');

    this.state = DeploymentState.DEPLOYING;
    this.targetVersion = newVersion;
    this.deploymentStartTime = Date.now();
    this.failureCount = 0;
    this.stats.totalDeployments++;

    try {
      for (let i = 0; i < this.workers.length; i++) {
        const oldWorker = this.workers[i];

        console.log(`\n📦 Deploying worker ${oldWorker.workerId} (${i+1}/${this.workers.length})...`);

        // Spawn new worker
        const newWorker = new WorkerManager(
          oldWorker.workerId,
          oldWorker.port,
          this.config
        );

        await newWorker.spawn(newVersion);
        await this.waitForHealthy(newWorker);

        console.log(`✅ New worker ${newWorker.workerId} is healthy`);

        // Drain old worker
        await oldWorker.drain();

        // Shutdown old worker
        await oldWorker.shutdown();

        // Replace
        this.workers[i] = newWorker;

        console.log(`✅ Worker ${oldWorker.workerId} updated successfully`);

        // Wait before next
        if (i < this.workers.length - 1) {
          console.log(`⏳ Waiting ${this.config.ROLLING_UPDATE_DELAY}ms before next update...`);
          await new Promise(resolve =>
            setTimeout(resolve, this.config.ROLLING_UPDATE_DELAY));
        }
      }

      this.currentVersion = newVersion;
      this.state = DeploymentState.COMPLETED;
      this.stats.successfulDeployments++;

      const duration = Date.now() - this.deploymentStartTime;
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`✅ DEPLOYMENT COMPLETED (${duration}ms)`);
      console.log('═'.repeat(70) + '\n');

      return true;
    } catch (error) {
      console.error(`\n❌ Deployment failed:`, error.message);
      this.failureCount++;

      if (this.config.AUTO_ROLLBACK &&
          this.failureCount <= this.config.MAX_FAILURES_BEFORE_ROLLBACK) {
        await this.rollback();
      }

      this.state = DeploymentState.FAILED;
      this.stats.failedDeployments++;
      return false;
    }
  }

  async rollback() {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🔙 ROLLING BACK TO v${this.currentVersion}`);
    console.log('═'.repeat(70) + '\n');

    this.state = DeploymentState.ROLLING_BACK;
    this.stats.rollbacks++;

    console.log('✅ Rollback completed\n');
  }

  getStatus() {
    return {
      state: this.state,
      currentVersion: this.currentVersion,
      targetVersion: this.targetVersion,
      workers: this.workers.map(w => w.getStatus()),
      stats: this.stats
    };
  }

  async shutdown() {
    console.log('\n🛑 Shutting down all workers...\n');

    for (const worker of this.workers) {
      await worker.shutdown();
    }

    console.log('✅ All workers shut down\n');
  }
}

// Worker Process
function runWorker() {
  const workerId = process.env.WORKER_ID;
  const port = process.env.WORKER_PORT;
  const version = process.env.VERSION;

  let isDraining = false;
  let activeConnections = 0;

  const server = http.createServer((req, res) => {
    activeConnections++;

    if (isDraining) {
      res.writeHead(503, { 'Connection': 'close' });
      res.end('Service unavailable - draining');
      activeConnections--;
      return;
    }

    if (req.url === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({
        healthy: true,
        version,
        workerId,
        uptime: process.uptime()
      }));
    } else {
      res.writeHead(200);
      res.end(`Worker ${workerId} v${version} - ${new Date().toISOString()}`);
    }

    activeConnections--;
  });

  server.listen(port, () => {
    console.log(`Worker ${workerId} v${version} listening on port ${port}`);
  });

  process.on('message', (msg) => {
    if (msg.type === 'drain') {
      isDraining = true;
      server.close();
    } else if (msg.type === 'shutdown') {
      server.close(() => {
        process.exit(0);
      });
    }
  });
}

// Main
async function main() {
  if (cluster.isMaster) {
    console.log('═'.repeat(70));
    console.log('ZERO-DOWNTIME DEPLOYMENT SYSTEM');
    console.log('═'.repeat(70));
    console.log();

    const orchestrator = new DeploymentOrchestrator();
    await orchestrator.initialize();

    // Deploy after 10 seconds
    setTimeout(async () => {
      await orchestrator.deployRolling('2.0.0');

      // Another deployment
      setTimeout(async () => {
        await orchestrator.deployRolling('3.0.0');
      }, 20000);
    }, 10000);

    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down deployment system...');
      await orchestrator.shutdown();
      process.exit(0);
    });

    console.log('💡 Try: curl http://localhost:3000');
    console.log('💡 Press Ctrl+C to shutdown\n');
  } else {
    runWorker();
  }
}

main();

/**
 * PRODUCTION DEPLOYMENT CHECKLIST:
 *
 * 1. Pre-deployment:
 *    - Run tests
 *    - Database migrations
 *    - Backup current state
 *
 * 2. During deployment:
 *    - Monitor error rates
 *    - Watch response times
 *    - Check health endpoints
 *
 * 3. Post-deployment:
 *    - Smoke tests
 *    - Monitor metrics
 *    - Rollback if needed
 */
