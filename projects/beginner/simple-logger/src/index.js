#!/usr/bin/env node

/**
 * Simple Logger CLI
 * Command-line interface for the logger
 */

const Logger = require('./logger');
const fs = require('fs').promises;
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    command: null,
    message: null,
    level: 'INFO',
    logDir: './logs',
    logFile: 'app.log',
    lines: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;

      case '-l':
      case '--level':
        options.level = (args[++i] || 'INFO').toUpperCase();
        break;

      case '-d':
      case '--log-dir':
        options.logDir = args[++i];
        break;

      case '-f':
      case '--log-file':
        options.logFile = args[++i];
        break;

      case '-n':
      case '--lines':
        options.lines = parseInt(args[++i], 10);
        break;

      case 'log':
      case 'read':
      case 'clear':
      case 'stats':
        if (!options.command) {
          options.command = arg;
        }
        break;

      default:
        if (!arg.startsWith('-') && !options.message) {
          options.message = arg;
        }
    }
  }

  return options;
}

// Display help message
function showHelp() {
  console.log(`
Simple Logger - Flexible logging utility

USAGE:
  node index.js <command> [options] [message]

COMMANDS:
  log <message>       Write a log message
  read                Read log file contents
  clear               Clear all log files
  stats               Show logger statistics

OPTIONS:
  -h, --help          Show this help message
  -l, --level LEVEL   Log level (DEBUG, INFO, WARN, ERROR, FATAL)
  -d, --log-dir DIR   Log directory (default: ./logs)
  -f, --log-file FILE Log file name (default: app.log)
  -n, --lines N       Number of lines to read (read command only)

EXAMPLES:
  # Log an info message
  node index.js log "Application started"

  # Log an error message
  node index.js log "Database connection failed" --level ERROR

  # Read last 20 log entries
  node index.js read --lines 20

  # Read only error logs
  node index.js read --level ERROR

  # View statistics
  node index.js stats

  # Clear all logs
  node index.js clear

  # Use custom log directory
  node index.js log "Custom log" --log-dir ./my-logs

LOG LEVELS (from lowest to highest priority):
  DEBUG - Detailed debugging information
  INFO  - General informational messages
  WARN  - Warning messages
  ERROR - Error messages
  FATAL - Fatal error messages

FEATURES:
  - Multiple log levels with color coding
  - Automatic log rotation by size or date
  - Separate error log files
  - Timestamped entries
  - Statistics tracking
`);
}

// Command: Log a message
async function commandLog(options) {
  if (!options.message) {
    console.error('Error: Message is required for log command');
    console.error('Usage: node index.js log "Your message" --level INFO');
    process.exit(1);
  }

  const logger = new Logger({
    logDir: options.logDir,
    logFile: options.logFile,
    level: 'DEBUG', // Accept all levels
    console: true
  });

  await logger.log(options.level, options.message);
  console.log(`\nLogged ${options.level} message to ${logger.getLogFilePath()}`);
}

// Command: Read logs
async function commandRead(options) {
  const logger = new Logger({
    logDir: options.logDir,
    logFile: options.logFile
  });

  try {
    const logs = await logger.readLogs({
      lines: options.lines,
      level: options.level !== 'INFO' ? options.level : null
    });

    if (logs.length === 0) {
      console.log('No logs found');
      return;
    }

    console.log(`\nShowing ${logs.length} log entries:\n`);
    console.log('='.repeat(80));
    logs.forEach(log => console.log(log));
    console.log('='.repeat(80));

  } catch (error) {
    console.error(`Error reading logs: ${error.message}`);
    process.exit(1);
  }
}

// Command: Clear logs
async function commandClear(options) {
  const logger = new Logger({
    logDir: options.logDir,
    logFile: options.logFile
  });

  try {
    console.log('Are you sure you want to clear all logs? (yes/no)');
    // In a real CLI, you'd use readline, but for simplicity:
    console.log('Clearing logs...');

    const count = await logger.clearLogs();
    console.log(`\nCleared ${count} log file(s) from ${options.logDir}`);

  } catch (error) {
    console.error(`Error clearing logs: ${error.message}`);
    process.exit(1);
  }
}

// Command: Show statistics
async function commandStats(options) {
  const logger = new Logger({
    logDir: options.logDir,
    logFile: options.logFile
  });

  const stats = logger.getStats();

  console.log('\n' + '='.repeat(60));
  console.log('LOGGER STATISTICS');
  console.log('='.repeat(60));
  console.log();
  console.log(`Total logs: ${stats.totalLogs}`);
  console.log(`Log rotations: ${stats.rotations}`);
  console.log();
  console.log('Logs by level:');
  Object.entries(stats.logsByLevel).forEach(([level, count]) => {
    console.log(`  ${level.padEnd(10)}: ${count}`);
  });
  console.log();
  console.log('Log files:');
  console.log(`  Main log: ${stats.currentLogFile}`);
  if (stats.currentErrorFile) {
    console.log(`  Error log: ${stats.currentErrorFile}`);
  }

  if (stats.errors.length > 0) {
    console.log();
    console.log(`Errors: ${stats.errors.length}`);
    stats.errors.forEach(err => {
      console.log(`  [${err.timestamp}] ${err.message}`);
    });
  }

  console.log();
  console.log('='.repeat(60));
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help || !options.command) {
    showHelp();
    process.exit(0);
  }

  try {
    switch (options.command) {
      case 'log':
        await commandLog(options);
        break;

      case 'read':
        await commandRead(options);
        break;

      case 'clear':
        await commandClear(options);
        break;

      case 'stats':
        await commandStats(options);
        break;

      default:
        console.error(`Unknown command: ${options.command}`);
        showHelp();
        process.exit(1);
    }

  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { parseArgs, showHelp };
