/**
 * Example 3: Process Supervision and Auto-Restart
 *
 * Demonstrates how to build a robust process supervisor with:
 * - Automatic restart on failure
 * - Health checking
 * - Circuit breaker pattern
 * - Graceful degradation
 * - Exponential backoff
 */

const { fork } = require('child_process');
const { EventEmitter } = require('events');

console.log('=== Process Supervision Example ===\n');

/**
 * ProcessSupervisor - Monitors and manages a single worker process
 */
class ProcessSupervisor extends EventEmitter {
  constructor(workerPath, options = {}) {
    super();
    this.workerPath = workerPath;
    this.options = {
      maxRestarts: options.maxRestarts || 5,
      restartWindow: options.restartWindow || 60000, // 1 minute
      healthCheckInterval: options.healthCheckInterval || 5000,
      healthCheckTimeout: options.healthCheckTimeout || 3000,
      minUptime: options.minUptime || 1000, // Minimum uptime before reset counter
      backoffMultiplier: options.backoffMultiplier || 2,
      maxBackoff: options.maxBackoff || 30000,
      ...options
    };

    this.worker = null;
    this.restarts = [];
    this.startTime = null;
    this.healthCheckTimer = null;
    this.state = 'stopped'; // stopped, starting, running, stopping, failed
  }

  /**
   * Start the supervised worker
   */
  start() {
    if (this.state !== 'stopped' && this.state !== 'failed') {
      console.log('Worker already running or starting');
      return;
    }

    console.log('Starting supervised worker...');
    this.state = 'starting';
    this.createWorker();
  }

  /**
   * Create and configure the worker
   */
  createWorker() {
    this.worker = fork(this.workerPath, [], {
      env: {
        ...process.env,
        SUPERVISED: 'true',
        START_TIME: Date.now()
      }
    });

    this.startTime = Date.now();

    // Setup event handlers
    this.setupEventHandlers();

    // Start health checks
    this.startHealthChecks();

    console.log(`Worker started with PID ${this.worker.pid}`);
    this.emit('started', { pid: this.worker.pid });
  }

  /**
   * Setup worker event handlers
   */
  setupEventHandlers() {
    // Handle messages
    this.worker.on('message', (msg) => {
      this.handleMessage(msg);
    });

    // Handle errors
    this.worker.on('error', (error) => {
      console.error('Worker error:', error.message);
      this.emit('error', error);
    });

    // Handle exit
    this.worker.on('exit', (code, signal) => {
      this.handleExit(code, signal);
    });
  }

  /**
   * Handle messages from worker
   */
  handleMessage(msg) {
    if (msg.type === 'health_check_response') {
      // Health check passed
      if (this.state === 'starting') {
        this.state = 'running';
        console.log('Worker is healthy and running');
        this.emit('running');
      }
    } else if (msg.type === 'ready') {
      console.log('Worker is ready');
      this.state = 'running';
      this.emit('ready');
    } else {
      this.emit('message', msg);
    }
  }

  /**
   * Handle worker exit
   */
  handleExit(code, signal) {
    const uptime = Date.now() - this.startTime;

    console.log(`Worker exited after ${uptime}ms with code ${code}, signal ${signal}`);

    this.stopHealthChecks();

    // Track restart attempt
    this.restarts.push({
      timestamp: Date.now(),
      code,
      signal,
      uptime
    });

    // Clean old restart records outside the window
    this.cleanRestartHistory();

    // Decide whether to restart
    if (this.state === 'stopping') {
      console.log('Worker stopped as requested');
      this.state = 'stopped';
      this.emit('stopped');
      return;
    }

    if (this.shouldRestart()) {
      const delay = this.calculateBackoff();
      console.log(`Restarting worker in ${delay}ms...`);

      setTimeout(() => {
        this.createWorker();
      }, delay);
    } else {
      console.error('Max restart limit reached. Worker failed permanently.');
      this.state = 'failed';
      this.emit('failed', {
        reason: 'max_restarts_exceeded',
        restarts: this.restarts.length
      });
    }

    // Reset restart counter if worker ran for minimum uptime
    if (uptime >= this.options.minUptime) {
      console.log('Worker achieved minimum uptime, resetting restart counter');
      // Keep only recent restart
      this.restarts = this.restarts.slice(-1);
    }
  }

  /**
   * Clean restart history outside the restart window
   */
  cleanRestartHistory() {
    const cutoff = Date.now() - this.options.restartWindow;
    this.restarts = this.restarts.filter(r => r.timestamp > cutoff);
  }

  /**
   * Determine if worker should be restarted
   */
  shouldRestart() {
    return this.restarts.length < this.options.maxRestarts;
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateBackoff() {
    const attempt = this.restarts.length;
    const delay = Math.min(
      1000 * Math.pow(this.options.backoffMultiplier, attempt - 1),
      this.options.maxBackoff
    );
    return delay;
  }

  /**
   * Start health check monitoring
   */
  startHealthChecks() {
    this.stopHealthChecks();

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.options.healthCheckInterval);
  }

  /**
   * Stop health check monitoring
   */
  stopHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Perform a health check
   */
  performHealthCheck() {
    if (!this.worker || !this.worker.connected) {
      console.error('Health check failed: worker not connected');
      this.emit('health_check_failed', { reason: 'not_connected' });
      return;
    }

    let responded = false;

    const timeout = setTimeout(() => {
      if (!responded) {
        console.error('Health check timeout');
        this.emit('health_check_failed', { reason: 'timeout' });
        this.worker.kill('SIGTERM');
      }
    }, this.options.healthCheckTimeout);

    const responseHandler = (msg) => {
      if (msg.type === 'health_check_response') {
        responded = true;
        clearTimeout(timeout);
        this.worker.removeListener('message', responseHandler);
        this.emit('health_check_passed');
      }
    };

    this.worker.on('message', responseHandler);
    this.worker.send({ type: 'health_check' });
  }

  /**
   * Send a message to the worker
   */
  send(message) {
    if (this.worker && this.worker.connected) {
      this.worker.send(message);
      return true;
    }
    return false;
  }

  /**
   * Get supervisor statistics
   */
  getStats() {
    return {
      state: this.state,
      pid: this.worker ? this.worker.pid : null,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
      restarts: this.restarts.length,
      recentRestarts: this.restarts.map(r => ({
        timestamp: new Date(r.timestamp).toISOString(),
        code: r.code,
        signal: r.signal,
        uptime: r.uptime
      }))
    };
  }

  /**
   * Stop the worker gracefully
   */
  async stop() {
    if (this.state === 'stopped') {
      return;
    }

    console.log('Stopping worker gracefully...');
    this.state = 'stopping';
    this.stopHealthChecks();

    if (!this.worker || !this.worker.connected) {
      this.state = 'stopped';
      return;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('Graceful shutdown timeout, forcing kill');
        this.worker.kill('SIGKILL');
      }, 5000);

      this.worker.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.worker.send({ type: 'shutdown' });
      this.worker.kill('SIGTERM');
    });
  }
}

/**
 * SupervisorGroup - Manages multiple supervised processes
 */
class SupervisorGroup extends EventEmitter {
  constructor() {
    super();
    this.supervisors = new Map();
  }

  /**
   * Add a supervised process
   */
  supervise(name, workerPath, options = {}) {
    if (this.supervisors.has(name)) {
      throw new Error(`Supervisor ${name} already exists`);
    }

    const supervisor = new ProcessSupervisor(workerPath, options);

    // Forward events
    supervisor.on('started', (data) => {
      this.emit('worker_started', { name, ...data });
    });

    supervisor.on('stopped', () => {
      this.emit('worker_stopped', { name });
    });

    supervisor.on('failed', (data) => {
      this.emit('worker_failed', { name, ...data });
    });

    supervisor.on('health_check_failed', (data) => {
      this.emit('health_check_failed', { name, ...data });
    });

    this.supervisors.set(name, supervisor);
    return supervisor;
  }

  /**
   * Start a supervised process
   */
  start(name) {
    const supervisor = this.supervisors.get(name);
    if (!supervisor) {
      throw new Error(`Supervisor ${name} not found`);
    }
    supervisor.start();
  }

  /**
   * Start all supervised processes
   */
  startAll() {
    for (const [name, supervisor] of this.supervisors) {
      console.log(`Starting ${name}...`);
      supervisor.start();
    }
  }

  /**
   * Stop a supervised process
   */
  async stop(name) {
    const supervisor = this.supervisors.get(name);
    if (!supervisor) {
      throw new Error(`Supervisor ${name} not found`);
    }
    await supervisor.stop();
  }

  /**
   * Stop all supervised processes
   */
  async stopAll() {
    const promises = [];
    for (const [name, supervisor] of this.supervisors) {
      console.log(`Stopping ${name}...`);
      promises.push(supervisor.stop());
    }
    await Promise.all(promises);
  }

  /**
   * Get status of all workers
   */
  getStatus() {
    const status = {};
    for (const [name, supervisor] of this.supervisors) {
      status[name] = supervisor.getStats();
    }
    return status;
  }
}

/**
 * Demo
 */
async function demo() {
  // Create temporary worker files
  const fs = require('fs');
  const path = require('path');

  // Unstable worker (crashes sometimes)
  const unstableWorkerCode = `
let healthCheckCount = 0;

process.on('message', (msg) => {
  if (msg.type === 'health_check') {
    healthCheckCount++;
    console.log(\`Health check #\${healthCheckCount}\`);

    process.send({
      type: 'health_check_response',
      timestamp: Date.now(),
      checks: healthCheckCount
    });

    // Simulate occasional crash
    if (Math.random() < 0.15) {
      console.log('Simulating crash!');
      setTimeout(() => process.exit(1), 100);
    }
  } else if (msg.type === 'shutdown') {
    console.log('Shutting down gracefully');
    process.exit(0);
  }
});

// Send ready signal
setTimeout(() => {
  process.send({ type: 'ready' });
}, 100);

console.log('Unstable worker started');
`;

  // Stable worker
  const stableWorkerCode = `
let healthCheckCount = 0;

process.on('message', (msg) => {
  if (msg.type === 'health_check') {
    healthCheckCount++;
    process.send({
      type: 'health_check_response',
      timestamp: Date.now(),
      checks: healthCheckCount
    });
  } else if (msg.type === 'shutdown') {
    console.log('Stable worker shutting down');
    process.exit(0);
  }
});

setTimeout(() => {
  process.send({ type: 'ready' });
}, 100);

console.log('Stable worker started');
`;

  const unstableWorkerPath = path.join(__dirname, 'temp-unstable-worker.js');
  const stableWorkerPath = path.join(__dirname, 'temp-stable-worker.js');

  fs.writeFileSync(unstableWorkerPath, unstableWorkerCode);
  fs.writeFileSync(stableWorkerPath, stableWorkerCode);

  // Create supervisor group
  const group = new SupervisorGroup();

  // Setup event logging
  group.on('worker_started', ({ name, pid }) => {
    console.log(`✓ [${name}] Started with PID ${pid}`);
  });

  group.on('worker_stopped', ({ name }) => {
    console.log(`✓ [${name}] Stopped`);
  });

  group.on('worker_failed', ({ name, reason, restarts }) => {
    console.error(`✗ [${name}] Failed: ${reason} (${restarts} restarts)`);
  });

  group.on('health_check_failed', ({ name, reason }) => {
    console.error(`✗ [${name}] Health check failed: ${reason}`);
  });

  // Add supervised workers
  console.log('Setting up supervised workers...\n');

  group.supervise('unstable-worker', unstableWorkerPath, {
    maxRestarts: 5,
    restartWindow: 30000,
    healthCheckInterval: 2000,
    healthCheckTimeout: 1000,
    minUptime: 3000
  });

  group.supervise('stable-worker', stableWorkerPath, {
    maxRestarts: 3,
    healthCheckInterval: 3000
  });

  // Start all workers
  console.log('Starting all workers...\n');
  group.startAll();

  // Let them run for a while
  await new Promise(resolve => setTimeout(resolve, 20000));

  // Show status
  console.log('\n=== Supervisor Status ===\n');
  const status = group.getStatus();

  for (const [name, stats] of Object.entries(status)) {
    console.log(`${name}:`);
    console.log(`  State: ${stats.state}`);
    console.log(`  PID: ${stats.pid || 'N/A'}`);
    console.log(`  Uptime: ${stats.uptime}ms`);
    console.log(`  Total Restarts: ${stats.restarts}`);
    if (stats.recentRestarts.length > 0) {
      console.log('  Recent Restarts:');
      stats.recentRestarts.forEach((restart, i) => {
        console.log(`    ${i + 1}. Code: ${restart.code}, Uptime: ${restart.uptime}ms`);
      });
    }
    console.log('');
  }

  // Stop all workers
  console.log('Stopping all workers...\n');
  await group.stopAll();

  // Cleanup
  fs.unlinkSync(unstableWorkerPath);
  fs.unlinkSync(stableWorkerPath);

  console.log('\n=== Demo Complete ===\n');
  console.log('Key Features Demonstrated:');
  console.log('✓ Automatic restart on failure');
  console.log('✓ Health check monitoring');
  console.log('✓ Exponential backoff for restarts');
  console.log('✓ Restart limits and windows');
  console.log('✓ Graceful shutdown');
  console.log('✓ Managing multiple supervised processes');
}

// Run demo
if (require.main === module) {
  demo().catch(console.error);
}

module.exports = { ProcessSupervisor, SupervisorGroup };
