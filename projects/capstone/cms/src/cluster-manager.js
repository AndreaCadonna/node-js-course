#!/usr/bin/env node

/**
 * Cluster Manager - Horizontal Scaling
 * Uses cluster module to spawn workers for better performance
 *
 * Modules used: cluster, os, process
 */

const cluster = require('cluster');
const os = require('os');
const path = require('path');
const fs = require('fs');

class ClusterManager {
  constructor(config) {
    this.config = config;
    this.workers = new Map();
    this.isShuttingDown = false;
  }

  start() {
    const numWorkers = this.config.workers || os.cpus().length;

    console.log(`Master process ${process.pid} starting`);
    console.log(`Spawning ${numWorkers} workers`);

    // Spawn workers
    for (let i = 0; i < numWorkers; i++) {
      this.spawnWorker(i);
    }

    // Handle worker events
    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died (${signal || code})`);
      this.workers.delete(worker.id);

      // Respawn if not shutting down
      if (!this.isShuttingDown) {
        console.log('Spawning replacement worker');
        this.spawnWorker(worker.id);
      }
    });

    cluster.on('online', (worker) => {
      console.log(`Worker ${worker.process.pid} is online`);
    });

    cluster.on('listening', (worker, address) => {
      console.log(`Worker ${worker.process.pid} listening on ${address.address}:${address.port}`);
    });

    // Setup graceful shutdown
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));

    // Monitor workers
    this.startMonitoring();
  }

  spawnWorker(workerId) {
    const worker = cluster.fork({
      WORKER_ID: workerId
    });

    this.workers.set(worker.id, {
      worker,
      workerId,
      startTime: Date.now(),
      requests: 0
    });

    // Handle worker messages
    worker.on('message', (msg) => {
      this.handleWorkerMessage(worker, msg);
    });

    return worker;
  }

  handleWorkerMessage(worker, msg) {
    switch (msg.type) {
      case 'request':
        const info = this.workers.get(worker.id);
        if (info) {
          info.requests++;
        }
        break;

      case 'error':
        console.error(`Worker ${worker.process.pid} error:`, msg.error);
        break;

      case 'metrics':
        this.handleWorkerMetrics(worker, msg.data);
        break;
    }
  }

  handleWorkerMetrics(worker, metrics) {
    const info = this.workers.get(worker.id);
    if (info) {
      info.metrics = metrics;
    }
  }

  startMonitoring() {
    // Log cluster status every minute
    setInterval(() => {
      const status = this.getClusterStatus();
      console.log('Cluster Status:', JSON.stringify(status, null, 2));
    }, 60000);

    // Check worker health every 30 seconds
    setInterval(() => {
      for (const [id, info] of this.workers) {
        if (!info.worker.isConnected()) {
          console.warn(`Worker ${info.worker.process.pid} is disconnected`);
        }
      }
    }, 30000);
  }

  getClusterStatus() {
    const workers = [];
    for (const [id, info] of this.workers) {
      workers.push({
        id: info.workerId,
        pid: info.worker.process.pid,
        uptime: Date.now() - info.startTime,
        requests: info.requests,
        connected: info.worker.isConnected()
      });
    }

    return {
      master: process.pid,
      workers: workers.length,
      workerDetails: workers
    };
  }

  async shutdown(signal) {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log(`Master received ${signal}, shutting down cluster`);

    // Disconnect all workers
    for (const [id, info] of this.workers) {
      info.worker.send({ type: 'shutdown' });
      info.worker.disconnect();
    }

    // Wait for workers to exit
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (this.workers.size === 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Force exit after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('Force shutdown - killing remaining workers');
        for (const [id, info] of this.workers) {
          info.worker.kill();
        }
        resolve();
      }, 10000);
    });

    console.log('All workers shut down');
    process.exit(0);
  }
}

// Main execution
if (require.main === module) {
  const configPath = path.join(__dirname, '../config/default.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  if (cluster.isMaster) {
    const manager = new ClusterManager(config);
    manager.start();
  } else {
    // Worker process - start server
    const CMSServer = require('./server');
    const server = new CMSServer(config);

    server.start().catch(error => {
      console.error('Worker failed to start:', error);
      process.exit(1);
    });

    // Handle shutdown message from master
    process.on('message', (msg) => {
      if (msg.type === 'shutdown') {
        server.shutdown('master');
      }
    });
  }
}

module.exports = ClusterManager;
