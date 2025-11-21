#!/usr/bin/env node
/**
 * System Monitor & Alert Service
 *
 * Entry point with cluster support
 */

const cluster = require('cluster');
const os = require('os');
const path = require('path');
const fs = require('fs');

const SystemMonitor = require('./src/monitor');
const AlertManager = require('./src/alert-manager');
const MonitorServer = require('./src/server');

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  cluster: args.includes('--cluster'),
  workers: parseInt(args.find(arg => arg.startsWith('--workers='))?.split('=')[1]) || os.cpus().length,
  port: parseInt(args.find(arg => arg.startsWith('--port='))?.split('=')[1]) || 3000,
  interval: parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 5000,
  config: args.find(arg => arg.startsWith('--config='))?.split('=')[1],
  help: args.includes('--help') || args.includes('-h')
};

if (options.help) {
  console.log(`
System Monitor & Alert Service

Usage:
  node index.js [options]

Options:
  --cluster           Run in cluster mode (multiple processes)
  --workers=N         Number of worker processes (default: CPU count)
  --port=PORT         Server port (default: 3000)
  --interval=MS       Monitoring interval in milliseconds (default: 5000)
  --config=FILE       Load configuration from JSON file
  --help, -h          Show this help message

Examples:
  # Single process
  node index.js

  # Cluster mode with 4 workers
  node index.js --cluster --workers=4

  # Custom port and interval
  node index.js --port=8080 --interval=10000

  # With config file
  node index.js --config=./config/production.json

API Authentication:
  Use the Bearer token shown on startup:
  curl -H "Authorization: Bearer <API_KEY>" http://localhost:3000/api/metrics

API Endpoints:
  GET  /                    - Dashboard
  GET  /health              - Health check
  GET  /api/metrics         - Current and historical metrics
  GET  /api/stats           - Statistics
  GET  /api/alerts          - Alert history
  GET  /api/events          - Server-Sent Events (real-time updates)
`);
  process.exit(0);
}

// Load configuration from file if specified
let config = {};
if (options.config) {
  try {
    const configPath = path.resolve(options.config);
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('[Config] Loaded from', configPath);
  } catch (err) {
    console.error('[Config] Failed to load:', err.message);
    process.exit(1);
  }
}

// Merge configuration
const finalConfig = {
  monitor: {
    interval: options.interval,
    maxHistorySize: config.maxHistorySize || 1000,
    ...config.monitor
  },
  alerts: {
    thresholds: config.thresholds || {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      disk: { warning: 85, critical: 95 }
    },
    webhooks: config.webhooks || [],
    cooldownPeriod: config.cooldownPeriod || 300000,
    ...config.alerts
  },
  server: {
    port: options.port,
    enableAuth: config.enableAuth !== false,
    apiKey: config.apiKey,
    ...config.server
  }
};

/**
 * Run in cluster mode
 */
function runCluster() {
  if (cluster.isMaster) {
    console.log(`[Cluster] Master ${process.pid} is running`);
    console.log(`[Cluster] Forking ${options.workers} workers...`);

    // Fork workers
    for (let i = 0; i < options.workers; i++) {
      cluster.fork();
    }

    // Handle worker events
    cluster.on('exit', (worker, code, signal) => {
      console.log(`[Cluster] Worker ${worker.process.pid} died (${signal || code})`);
      console.log('[Cluster] Forking replacement worker...');
      cluster.fork();
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[Cluster] SIGTERM received, shutting down gracefully...');

      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }

      setTimeout(() => {
        process.exit(0);
      }, 5000);
    });

  } else {
    // Worker process
    runWorker();
  }
}

/**
 * Run single worker
 */
async function runWorker() {
  const workerId = cluster.worker ? cluster.worker.id : 'single';
  console.log(`[Worker ${workerId}] Starting (PID: ${process.pid})...`);

  try {
    // Create monitor
    const monitor = new SystemMonitor(finalConfig.monitor);

    // Create alert manager
    const alertManager = new AlertManager(finalConfig.alerts);

    // Create server
    const server = new MonitorServer(monitor, alertManager, finalConfig.server);

    // Connect components
    monitor.on('metrics', (metrics) => {
      alertManager.checkMetrics(metrics);
    });

    // Start monitoring
    await monitor.start();

    // Start server
    await server.start();

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n[Worker ${workerId}] ${signal} received, shutting down gracefully...`);

      try {
        await server.stop();
        await monitor.stop();
        console.log(`[Worker ${workerId}] Shutdown complete`);
        process.exit(0);
      } catch (err) {
        console.error(`[Worker ${workerId}] Shutdown error:`, err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    console.log(`[Worker ${workerId}] Ready!`);
    console.log(`[Worker ${workerId}] Dashboard: http://localhost:${finalConfig.server.port}`);
    console.log(`[Worker ${workerId}] API Key: ${server.apiKey}`);

  } catch (err) {
    console.error(`[Worker ${workerId}] Fatal error:`, err);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
if (options.cluster) {
  runCluster();
} else {
  runWorker();
}
