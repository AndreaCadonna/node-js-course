/**
 * Exercise 3 Solution: Formatted Logger
 *
 * This solution demonstrates:
 * - Building a production-ready logger with util.format
 * - Using util.inspect for object formatting
 * - Implementing log levels with colors
 * - Adding timestamps and metadata
 * - Creating a flexible logging system
 */

const util = require('util');
const fs = require('fs');
const path = require('path');

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

/**
 * Log levels with priorities
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

/**
 * Step 1: Create comprehensive Logger class
 */
class Logger {
  constructor(options = {}) {
    this.name = options.name || 'App';
    this.level = options.level || LOG_LEVELS.INFO;
    this.showTimestamp = options.showTimestamp !== false; // default true
    this.colorize = options.colorize !== false; // default true
    this.logFile = options.logFile || null;
  }

  /**
   * Step 2: Format timestamp
   */
  _getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
  }

  /**
   * Step 3: Format log level with color
   */
  _formatLevel(level, color) {
    const levelStr = level.padEnd(5);
    if (this.colorize) {
      return `${color}${levelStr}${COLORS.reset}`;
    }
    return levelStr;
  }

  /**
   * Step 4: Format complete message
   */
  _formatMessage(level, color, ...args) {
    let parts = [];

    // Add timestamp
    if (this.showTimestamp) {
      const timestamp = this._getTimestamp();
      if (this.colorize) {
        parts.push(`${COLORS.gray}[${timestamp}]${COLORS.reset}`);
      } else {
        parts.push(`[${timestamp}]`);
      }
    }

    // Add log level
    parts.push(this._formatLevel(level, color));

    // Add logger name
    if (this.name) {
      if (this.colorize) {
        parts.push(`${COLORS.cyan}[${this.name}]${COLORS.reset}`);
      } else {
        parts.push(`[${this.name}]`);
      }
    }

    // Format the message using util.format
    // This handles %s, %d, %j, %o, etc.
    const message = util.format(...args);
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Write to log file if configured
   */
  _writeToFile(message) {
    if (this.logFile) {
      // Remove color codes for file output
      const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, '');
      fs.appendFileSync(this.logFile, cleanMessage + '\n', 'utf8');
    }
  }

  /**
   * Core logging method
   */
  _log(level, levelValue, color, ...args) {
    if (levelValue < this.level) {
      return; // Skip if below minimum level
    }

    const message = this._formatMessage(level, color, ...args);
    console.log(message);
    this._writeToFile(message);
  }

  /**
   * Step 5: Implement log level methods
   */

  debug(...args) {
    this._log('DEBUG', LOG_LEVELS.DEBUG, COLORS.cyan, ...args);
  }

  info(...args) {
    this._log('INFO', LOG_LEVELS.INFO, COLORS.green, ...args);
  }

  warn(...args) {
    this._log('WARN', LOG_LEVELS.WARN, COLORS.yellow, ...args);
  }

  error(...args) {
    this._log('ERROR', LOG_LEVELS.ERROR, COLORS.red, ...args);
  }

  /**
   * Step 6: Pretty print objects
   */
  object(label, obj, options = {}) {
    const level = options.level || 'INFO';
    const color = options.color || COLORS.blue;

    const inspectOptions = {
      depth: options.depth || null,
      colors: this.colorize,
      compact: options.compact !== undefined ? options.compact : false,
      ...options.inspectOptions
    };

    const inspected = util.inspect(obj, inspectOptions);
    const message = `${label}:\n${inspected}`;

    this._log(level, LOG_LEVELS[level], color, message);
  }

  /**
   * Log with custom format
   */
  format(format, ...args) {
    const formatted = util.format(format, ...args);
    this.info(formatted);
  }

  /**
   * Create a child logger with additional context
   */
  child(name) {
    return new Logger({
      name: `${this.name}:${name}`,
      level: this.level,
      showTimestamp: this.showTimestamp,
      colorize: this.colorize,
      logFile: this.logFile
    });
  }

  /**
   * Set minimum log level
   */
  setLevel(level) {
    if (typeof level === 'string') {
      this.level = LOG_LEVELS[level.toUpperCase()];
    } else {
      this.level = level;
    }
  }
}

/**
 * Step 7: Test the logger
 */
function testLogger() {
  console.log('=== Testing Logger ===\n');

  const logger = new Logger({
    name: 'MyApp',
    level: LOG_LEVELS.DEBUG
  });

  // Test 1: String formatting
  logger.info('User %s logged in', 'john_doe');
  logger.info('Server started on port %d', 3000);

  // Test 2: Multiple arguments
  logger.warn('High memory usage:', 85, '%');

  // Test 3: Objects
  logger.error('Failed to connect:', {
    host: 'localhost',
    port: 3000,
    error: 'ECONNREFUSED'
  });

  // Test 4: Debug info
  logger.debug('Debug info: %o', {
    state: 'active',
    connections: 42,
    uptime: 3600
  });

  // Test 5: Format specifiers
  logger.info('JSON: %j', { name: 'test', value: 123 });
  logger.info('Object: %o', { nested: { data: 'value' } });

  // Test 6: Pretty print object
  logger.object('User Data', {
    id: 1,
    name: 'John Doe',
    profile: {
      email: 'john@example.com',
      settings: {
        theme: 'dark',
        notifications: true
      }
    }
  });
}

/**
 * Test log levels
 */
function testLogLevels() {
  console.log('\n=== Testing Log Levels ===\n');

  const logger = new Logger({ name: 'LevelTest' });

  console.log('--- Default level (INFO) ---');
  logger.debug('This will not be shown');
  logger.info('This will be shown');
  logger.warn('This will be shown');
  logger.error('This will be shown');

  console.log('\n--- Set level to WARN ---');
  logger.setLevel('WARN');
  logger.debug('This will not be shown');
  logger.info('This will not be shown');
  logger.warn('This will be shown');
  logger.error('This will be shown');
}

/**
 * Test child loggers
 */
function testChildLoggers() {
  console.log('\n=== Testing Child Loggers ===\n');

  const mainLogger = new Logger({ name: 'Main' });
  const dbLogger = mainLogger.child('Database');
  const apiLogger = mainLogger.child('API');

  mainLogger.info('Application started');
  dbLogger.info('Connected to database');
  apiLogger.info('API server listening');
  dbLogger.warn('Slow query detected');
  apiLogger.error('Request failed');
}

/**
 * Test all format specifiers
 */
function testFormatSpecifiers() {
  console.log('\n=== Testing Format Specifiers ===\n');

  const logger = new Logger({ name: 'Format' });

  logger.info('%s - String formatting', 'Test');
  logger.info('%d - Number formatting', 42);
  logger.info('%i - Integer formatting', 42.7);
  logger.info('%f - Float formatting', 3.14159);
  logger.info('%j - JSON formatting', { a: 1, b: 2 });
  logger.info('%o - Object formatting', { nested: { value: 'test' } });
  logger.info('%O - Object with options', { data: [1, 2, 3] });
  logger.info('%% - Percent sign');

  // Multiple specifiers
  logger.info('User %s has %d points (%.2f%% complete)', 'Alice', 850, 85.5);
}

/**
 * BONUS: Test file logging
 */
function testFileLogging() {
  console.log('\n=== Testing File Logging ===\n');

  const logFile = path.join(__dirname, 'app.log');

  // Clear old log file
  if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile);
  }

  const logger = new Logger({
    name: 'FileLogger',
    logFile
  });

  logger.info('This will be written to file');
  logger.warn('Warning message');
  logger.error('Error message');

  // Read and display log file
  const logContents = fs.readFileSync(logFile, 'utf8');
  console.log('Log file contents:');
  console.log('─'.repeat(50));
  console.log(logContents);
  console.log('─'.repeat(50));

  // Cleanup
  fs.unlinkSync(logFile);
  console.log('Log file deleted');
}

/**
 * BONUS: Production example
 */
function productionExample() {
  console.log('\n=== Production Example ===\n');

  const logger = new Logger({
    name: 'WebServer',
    level: LOG_LEVELS.INFO
  });

  // Simulate web server logs
  logger.info('Server starting...');
  logger.info('Loading configuration from %s', './config.json');
  logger.info('Connecting to database at %s:%d', 'localhost', 5432);
  logger.info('Database connected successfully');

  logger.object('Configuration', {
    port: 3000,
    environment: 'production',
    database: {
      host: 'localhost',
      pool: { min: 2, max: 10 }
    }
  });

  logger.info('Server listening on port %d', 3000);
  logger.info('Request: %s %s', 'GET', '/api/users');
  logger.warn('Slow response time: %dms', 1250);
  logger.error('Database query failed: %s', 'Connection timeout');

  // Error with stack trace
  try {
    throw new Error('Something went wrong');
  } catch (err) {
    logger.error('Exception caught:', err.stack);
  }
}

/**
 * Main execution
 */
function runAllTests() {
  testLogger();
  testLogLevels();
  testChildLoggers();
  testFormatSpecifiers();
  testFileLogging();
  productionExample();
}

// Run the tests
runAllTests();

/**
 * KEY LEARNING POINTS:
 *
 * 1. util.format Specifiers:
 *    - %s: String
 *    - %d, %i: Number/Integer
 *    - %f: Float
 *    - %j: JSON.stringify
 *    - %o: util.inspect with options
 *    - %O: util.inspect with multiple lines
 *    - %%: Literal percent sign
 *
 * 2. Logger Design:
 *    - Different log levels (debug, info, warn, error)
 *    - Timestamps for traceability
 *    - Colors for visual scanning
 *    - File output for persistence
 *
 * 3. ANSI Colors:
 *    - \x1b[XXm for color codes
 *    - \x1b[0m to reset
 *    - Remove for file output
 *
 * 4. Best Practices:
 *    - Use appropriate log levels
 *    - Include context (timestamps, logger name)
 *    - Format objects with util.inspect
 *    - Support both console and file output
 *
 * 5. Production Considerations:
 *    - Log rotation for large files
 *    - Minimum log levels for performance
 *    - Structured logging (JSON format)
 *    - Remote logging services
 */

/**
 * COMMON MISTAKES TO AVOID:
 *
 * ❌ Logging sensitive data:
 *    logger.info('User credentials:', password);
 *
 * ✅ Sanitize sensitive data:
 *    logger.info('User credentials: [REDACTED]');
 *
 * ❌ No log levels:
 *    console.log('everything');
 *
 * ✅ Use appropriate levels:
 *    logger.debug(), logger.info(), logger.error()
 *
 * ❌ Logging in tight loops:
 *    for (let i = 0; i < 1000000; i++) logger.debug(i);
 *
 * ✅ Sample or aggregate:
 *    if (i % 1000 === 0) logger.debug('Progress:', i);
 */

/**
 * GOING FURTHER:
 *
 * Try these challenges:
 * 1. Add log rotation (max file size, archive old logs)
 * 2. Implement structured JSON logging
 * 3. Add remote logging (send to logging service)
 * 4. Create log analysis tools
 * 5. Implement log sampling for high-volume scenarios
 */
