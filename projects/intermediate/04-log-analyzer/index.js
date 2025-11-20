#!/usr/bin/env node

/**
 * Log Analyzer - Main Entry Point
 *
 * Usage:
 *   node index.js <logfile>
 *   node index.js --help
 */

const fs = require('fs');
const path = require('path');
const LogAnalyzer = require('./src/analyzer');
const DashboardServer = require('./src/dashboard');

// Default configuration
const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  alertPatterns: [
    {
      name: '5xx Server Errors',
      statusRange: [500, 599]
    },
    {
      name: '4xx Client Errors',
      statusRange: [400, 499]
    },
    {
      name: 'ERROR Level',
      level: 'ERROR'
    },
    {
      name: 'Database Error',
      regex: 'database|mysql|postgres|mongo'
    },
    {
      name: 'Authentication Failed',
      regex: 'authentication failed|unauthorized|forbidden'
    }
  ]
};

/**
 * Display help message
 */
function showHelp() {
  console.log(`
Log Analyzer - Real-time log file analysis with web dashboard

Usage:
  node index.js <logfile>        Analyze a log file
  node index.js --help           Show this help message

Options:
  PORT=3000                      Set dashboard port (default: 3000)
  HOST=localhost                 Set dashboard host (default: localhost)

Examples:
  node index.js logs/access.log
  PORT=8080 node index.js logs/app.log

Features:
  - Streams large log files efficiently
  - Parses multiple log formats (Apache, JSON, application logs)
  - Real-time analysis and statistics
  - Web dashboard with live updates
  - Configurable alerts on patterns
  - HTTP status code analysis
  - IP address tracking
  - Error tracking and reporting

Once running, open your browser to http://localhost:3000
  `);
}

/**
 * Main application
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const logFile = args[0];

  // Validate log file
  if (!fs.existsSync(logFile)) {
    console.error(`Error: Log file not found: ${logFile}`);
    process.exit(1);
  }

  const stats = fs.statSync(logFile);
  if (!stats.isFile()) {
    console.error(`Error: Not a file: ${logFile}`);
    process.exit(1);
  }

  console.log('Log Analyzer');
  console.log('============\n');
  console.log(`Log file: ${logFile}`);
  console.log(`File size: ${formatBytes(stats.size)}\n`);

  // Create analyzer
  const analyzer = new LogAnalyzer({
    alertPatterns: config.alertPatterns
  });

  // Setup analyzer event listeners
  analyzer.on('alert', (alert) => {
    console.log(`[ALERT] ${alert.pattern}`);
  });

  analyzer.on('error', (error) => {
    console.error(`[ERROR] ${error.message}`);
  });

  analyzer.on('complete', (stats) => {
    console.log('\nAnalysis Complete!');
    console.log(`Total lines: ${stats.totalLines.toLocaleString()}`);
    console.log(`Errors: ${stats.errorCount.toLocaleString()}`);
    console.log(`Error rate: ${stats.errorRate}`);
    console.log(`Duration: ${stats.duration.toFixed(2)}s`);
    console.log(`Speed: ${stats.linesPerSecond} lines/sec`);
  });

  // Create and start dashboard
  const dashboard = new DashboardServer(analyzer, {
    port: config.port,
    host: config.host
  });

  try {
    const address = await dashboard.start();
    console.log(`Dashboard started at ${address}\n`);
    console.log('Analyzing log file...\n');

    // Start analysis
    await analyzer.analyzeFile(logFile);

    console.log('\nAnalysis complete. Dashboard still running...');
    console.log('Press Ctrl+C to exit\n');

  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down...');
    await dashboard.stop();
    console.log('Goodbye!');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await dashboard.stop();
    process.exit(0);
  });
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { LogAnalyzer, DashboardServer };
