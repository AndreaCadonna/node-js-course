#!/usr/bin/env node

/**
 * Real-time File Monitor - Main Entry Point
 *
 * Usage:
 *   node index.js [paths...]
 *   node index.js --config config.json
 */

const fs = require('fs');
const path = require('path');
const FileMonitor = require('./src/monitor');
const MonitorServer = require('./src/server');

// Default configuration
const defaultConfig = {
  port: 3000,
  host: 'localhost',
  paths: [],
  recursive: true,
  ignoreHidden: true,
  ignorePaths: ['node_modules', '.git', '.DS_Store'],
  debounceTime: 100,
  maxHistory: 1000
};

/**
 * Load configuration from file
 */
function loadConfig(configPath) {
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Failed to load config from ${configPath}:`, err.message);
    process.exit(1);
  }
}

/**
 * Display help message
 */
function showHelp() {
  console.log(`
Real-time File Monitor - Watch files and directories for changes

Usage:
  node index.js [paths...]           Watch specified paths
  node index.js --config <file>      Load configuration from file
  node index.js --help               Show this help message

Environment Variables:
  PORT                               Server port (default: 3000)
  HOST                               Server host (default: localhost)

Examples:
  node index.js ./src ./public
  node index.js --config config/monitor.json
  PORT=8080 node index.js ./watched

Features:
  - Watch multiple files and directories
  - Real-time change notifications
  - Configurable filters (extensions, patterns, size)
  - Web dashboard with live updates
  - Change history and statistics
  - Graceful shutdown on SIGINT/SIGTERM

Once running, open your browser to http://localhost:3000
  `);
}

/**
 * Main application
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  // Load configuration
  let config = { ...defaultConfig };

  if (args.includes('--config')) {
    const configIndex = args.indexOf('--config');
    const configPath = args[configIndex + 1];

    if (!configPath) {
      console.error('Error: --config requires a file path');
      process.exit(1);
    }

    const fileConfig = loadConfig(configPath);
    config = { ...config, ...fileConfig };
  } else {
    // Use paths from command line
    const paths = args.filter(arg => !arg.startsWith('--'));
    if (paths.length > 0) {
      config.paths = paths;
    }
  }

  // Apply environment variables
  config.port = process.env.PORT || config.port;
  config.host = process.env.HOST || config.host;

  console.log('Real-time File Monitor');
  console.log('======================\n');

  // Create monitor
  const monitor = new FileMonitor(config);

  // Setup monitor event listeners
  monitor.on('watching', (data) => {
    console.log(`[WATCHING] ${data.path} (${data.type})`);
  });

  monitor.on('change', (change) => {
    console.log(`[${change.type.toUpperCase()}] ${change.path}`);
  });

  monitor.on('error', (error) => {
    console.error(`[ERROR] ${error.path}: ${error.error?.message || error.message}`);
  });

  // Create and start server
  const server = new MonitorServer(monitor, {
    port: config.port,
    host: config.host
  });

  try {
    const address = await server.start();
    console.log(`Dashboard started at ${address}\n`);

    // Watch initial paths
    if (config.paths && config.paths.length > 0) {
      console.log('Watching paths:');
      for (const targetPath of config.paths) {
        try {
          monitor.watch(targetPath);
        } catch (err) {
          console.error(`Failed to watch ${targetPath}:`, err.message);
        }
      }
      console.log('');
    } else {
      console.log('No paths specified. Add paths via the web interface.\n');
    }

    console.log('Monitor is running. Press Ctrl+C to stop\n');

  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`Error: Port ${config.port} is already in use`);
      console.error('Try using a different port: PORT=8080 node index.js');
    } else {
      console.error('Failed to start:', err.message);
    }
    process.exit(1);
  }

  // Graceful shutdown
  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n\nReceived ${signal}. Shutting down gracefully...`);

    // Stop server
    await server.stop();
    console.log('Server stopped');

    // Close monitor
    await monitor.shutdown();
    console.log('Monitor closed');

    // Display final statistics
    const stats = monitor.getStats();
    console.log('\nFinal Statistics:');
    console.log(`  Total changes: ${stats.totalChanges}`);
    console.log(`  Filtered: ${stats.filteredChanges}`);
    console.log(`  Uptime: ${Math.floor(stats.uptime)}s`);

    console.log('\nGoodbye!');
    process.exit(0);
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle uncaught errors
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    shutdown('unhandledRejection');
  });
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { FileMonitor, MonitorServer };
