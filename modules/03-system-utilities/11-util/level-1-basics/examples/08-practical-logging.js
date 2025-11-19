/**
 * Example 8: Practical Logging System
 *
 * Combine multiple util functions to build a practical logging system.
 * This demonstrates real-world usage of util.format(), util.inspect(),
 * and TextEncoder for a production-ready logger.
 *
 * Key Concepts:
 * - Combining util functions
 * - Building reusable utilities
 * - Formatting log messages
 * - Handling different data types
 */

const util = require('util');
const fs = require('fs');
const path = require('path');

// ===== EXAMPLE 1: Simple Logger =====
console.log('=== Example 1: Simple Logger ===\n');

function simpleLog(level, message) {
  const timestamp = new Date().toISOString();
  const formatted = util.format('[%s] %s: %s', timestamp, level, message);
  console.log(formatted);
  return formatted;
}

simpleLog('INFO', 'Application started');
simpleLog('WARN', 'Low memory detected');
simpleLog('ERROR', 'Connection failed');

// ===== EXAMPLE 2: Logger with Arguments =====
console.log('\n=== Example 2: Logger with Template Arguments ===\n');

function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const formattedMessage = util.format(message, ...args);
  const output = util.format('[%s] %s: %s', timestamp, level, formattedMessage);
  console.log(output);
  return output;
}

log('INFO', 'Server started on port %d', 3000);
log('INFO', 'User %s logged in from %s', 'alice', '192.168.1.1');
log('ERROR', 'Failed to connect to %s after %d attempts', 'database', 3);

// ===== EXAMPLE 3: Logger with Object Inspection =====
console.log('\n=== Example 3: Logger with Object Support ===\n');

function advancedLog(level, message, data) {
  const timestamp = new Date().toISOString();

  // Format the message
  let output = util.format('[%s] %s: %s', timestamp, level, message);

  // If data is provided, inspect it
  if (data !== undefined) {
    const inspected = util.inspect(data, {
      depth: 3,
      colors: true,
      compact: false
    });
    output += '\n' + inspected;
  }

  console.log(output);
  return output;
}

advancedLog('INFO', 'Request received', {
  method: 'GET',
  url: '/api/users',
  headers: { 'user-agent': 'Mozilla/5.0' }
});

advancedLog('ERROR', 'Database error', {
  code: 'ECONNREFUSED',
  host: 'localhost',
  port: 5432,
  stack: 'Error: Connection refused...'
});

// ===== EXAMPLE 4: Logger Class =====
console.log('\n=== Example 4: Logger Class ===\n');

class Logger {
  constructor(name) {
    this.name = name;
  }

  _log(level, message, data) {
    const timestamp = new Date().toISOString();
    let output = util.format('[%s] [%s] %s: %s',
      timestamp,
      this.name,
      level,
      message
    );

    if (data !== undefined) {
      if (typeof data === 'object') {
        output += '\n' + util.inspect(data, {
          depth: 5,
          colors: true,
          compact: false
        });
      } else {
        output += ' ' + String(data);
      }
    }

    return output;
  }

  info(message, data) {
    console.log(this._log('INFO', message, data));
  }

  warn(message, data) {
    console.log(this._log('WARN', message, data));
  }

  error(message, data) {
    console.error(this._log('ERROR', message, data));
  }

  debug(message, data) {
    console.log(this._log('DEBUG', message, data));
  }
}

const appLogger = new Logger('MyApp');

appLogger.info('Application initialized');
appLogger.warn('Memory usage high', { used: '450MB', total: '512MB' });
appLogger.error('Request failed', new Error('Timeout'));
appLogger.debug('Processing data', { items: 150, duration: '2.3s' });

// ===== EXAMPLE 5: Logger with File Output =====
console.log('\n=== Example 5: Logger with File Output ===\n');

class FileLogger extends Logger {
  constructor(name, logFile) {
    super(name);
    this.logFile = logFile;
  }

  _log(level, message, data) {
    const output = super._log(level, message, data);

    // Write to file (remove colors for file)
    const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
    fs.appendFileSync(this.logFile, cleanOutput + '\n');

    return output;
  }
}

const logFile = path.join(__dirname, 'app.log');

// Clean up old log file
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

const fileLogger = new FileLogger('FileApp', logFile);

fileLogger.info('Starting application');
fileLogger.info('Configuration loaded', {
  env: 'production',
  port: 8080
});
fileLogger.warn('Rate limit approaching', {
  current: 950,
  limit: 1000
});

console.log('\n✓ Logs written to', logFile);

// Read and display the log file
if (fs.existsSync(logFile)) {
  console.log('\nLog file contents:');
  console.log('─'.repeat(60));
  console.log(fs.readFileSync(logFile, 'utf8'));
  console.log('─'.repeat(60));

  // Clean up
  fs.unlinkSync(logFile);
  console.log('\n✓ Log file cleaned up');
}

// ===== EXAMPLE 6: Structured Logger (JSON) =====
console.log('\n=== Example 6: Structured Logger (JSON) ===\n');

class StructuredLogger {
  constructor(name) {
    this.name = name;
  }

  log(level, message, metadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      logger: this.name,
      level: level,
      message: message,
      ...metadata
    };

    // Pretty print for console
    console.log(util.inspect(entry, {
      depth: null,
      colors: true,
      compact: false
    }));

    return entry;
  }

  info(message, metadata) {
    return this.log('INFO', message, metadata);
  }

  error(message, metadata) {
    return this.log('ERROR', message, metadata);
  }
}

const structuredLogger = new StructuredLogger('API');

structuredLogger.info('Request processed', {
  requestId: 'req-123',
  method: 'POST',
  path: '/api/users',
  duration: 45,
  statusCode: 201
});

structuredLogger.error('Validation failed', {
  requestId: 'req-124',
  errors: [
    { field: 'email', message: 'Invalid format' },
    { field: 'age', message: 'Must be positive' }
  ]
});

// ===== EXAMPLE 7: Logger with Filtering =====
console.log('\n=== Example 7: Logger with Level Filtering ===\n');

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class FilteredLogger {
  constructor(name, minLevel = 'INFO') {
    this.name = name;
    this.minLevel = LOG_LEVELS[minLevel];
  }

  shouldLog(level) {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  log(level, message, ...args) {
    if (!this.shouldLog(level)) {
      return; // Skip logging
    }

    const timestamp = new Date().toISOString();
    const formatted = util.format(message, ...args);
    console.log(util.format('[%s] [%s] %s: %s',
      timestamp,
      this.name,
      level,
      formatted
    ));
  }

  debug(message, ...args) {
    this.log('DEBUG', message, ...args);
  }

  info(message, ...args) {
    this.log('INFO', message, ...args);
  }

  warn(message, ...args) {
    this.log('WARN', message, ...args);
  }

  error(message, ...args) {
    this.log('ERROR', message, ...args);
  }
}

// Create logger with INFO level
const infoLogger = new FilteredLogger('App', 'INFO');

console.log('Logger with INFO level (DEBUG hidden):');
infoLogger.debug('This will not appear');  // Hidden
infoLogger.info('This appears');           // Shown
infoLogger.warn('This appears');           // Shown
infoLogger.error('This appears');          // Shown

// Create logger with ERROR level
console.log('\nLogger with ERROR level (only errors):');
const errorLogger = new FilteredLogger('CriticalApp', 'ERROR');
errorLogger.info('This will not appear');   // Hidden
errorLogger.warn('This will not appear');   // Hidden
errorLogger.error('This appears');          // Shown

// ===== EXAMPLE 8: Performance Comparison =====
console.log('\n=== Example 8: Performance Considerations ===\n');

const iterations = 10000;

// Test 1: Simple string concatenation
console.time('String concatenation');
for (let i = 0; i < iterations; i++) {
  const msg = '[' + new Date().toISOString() + '] INFO: ' + 'Test message ' + i;
}
console.timeEnd('String concatenation');

// Test 2: Template literals
console.time('Template literals');
for (let i = 0; i < iterations; i++) {
  const msg = `[${new Date().toISOString()}] INFO: Test message ${i}`;
}
console.timeEnd('Template literals');

// Test 3: util.format
console.time('util.format');
for (let i = 0; i < iterations; i++) {
  const msg = util.format('[%s] INFO: Test message %d', new Date().toISOString(), i);
}
console.timeEnd('util.format');

console.log('\n✓ All methods are fast for typical logging needs');

/**
 * Important Notes:
 *
 * 1. Logger Design Patterns:
 *    - Timestamp: Always include for debugging
 *    - Level: INFO, WARN, ERROR, DEBUG
 *    - Context: Logger name/component
 *    - Data: Structured data with inspect()
 *
 * 2. Combining Util Functions:
 *    - util.format() for message templates
 *    - util.inspect() for objects
 *    - TextEncoder for file output
 *    - Types for validation
 *
 * 3. Production Considerations:
 *    - Log levels for filtering
 *    - File rotation for size management
 *    - Structured logs (JSON) for parsing
 *    - Remove ANSI colors for files
 *    - Performance testing
 *
 * 4. Best Practices:
 *    - Don't log sensitive data (passwords, tokens)
 *    - Use appropriate log levels
 *    - Include context (requestId, userId)
 *    - Make logs searchable
 *    - Consider log aggregation services
 */

/**
 * Try This:
 *
 * 1. Add log rotation (max file size)
 * 2. Create a logger that sends to multiple outputs
 * 3. Build a log parser that reads structured logs
 * 4. Add performance metrics to the logger
 * 5. Create a logger that sends logs to a remote service
 */
