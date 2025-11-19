/**
 * 05-stderr-logging.js
 * =====================
 * Demonstrates using stderr for errors, warnings, and diagnostic output
 *
 * Key Concepts:
 * - Understanding stderr vs stdout
 * - When to use stderr vs stdout
 * - Writing to stderr
 * - Separating normal output from errors
 * - Best practices for logging
 *
 * Run: node 05-stderr-logging.js
 * Run with redirection: node 05-stderr-logging.js > output.txt 2> errors.txt
 * Run suppressing errors: node 05-stderr-logging.js 2> /dev/null
 */

console.log('=== Standard Error (stderr) Example ===\n');

// =============================================================================
// UNDERSTANDING STDOUT VS STDERR
// =============================================================================

console.log('--- Understanding stdout vs stderr ---\n');

// stdout: For normal program output (data, results)
// stderr: For errors, warnings, and diagnostic messages

console.log('Stream properties:');
console.log(`  stdout is Writable: ${process.stdout.writable}`);
console.log(`  stderr is Writable: ${process.stderr.writable}`);
console.log(`  stdout is TTY: ${process.stdout.isTTY}`);
console.log(`  stderr is TTY: ${process.stderr.isTTY}`);
console.log();

// Key difference: They are separate streams that can be redirected independently
process.stdout.write('This goes to stdout\n');
process.stderr.write('This goes to stderr\n');
console.log();

// =============================================================================
// WRITING TO STDERR
// =============================================================================

console.log('--- Writing to stderr ---\n');

// Method 1: console.error() - Writes to stderr with newline
console.error('Using console.error()');

// Method 2: console.warn() - Also writes to stderr
console.warn('Using console.warn()');

// Method 3: process.stderr.write() - Direct write, no auto newline
process.stderr.write('Using process.stderr.write()\n');

console.log('(All three lines above went to stderr, not stdout)');
console.log();

// =============================================================================
// WHEN TO USE STDERR
// =============================================================================

console.log('--- When to use stderr ---\n');

// 1. ERROR MESSAGES
function demonstrateError() {
  try {
    throw new Error('Something went wrong');
  } catch (error) {
    // Errors should go to stderr
    console.error('ERROR:', error.message);
  }
}

console.log('1. Error messages:');
demonstrateError();
console.log();

// 2. WARNING MESSAGES
function demonstrateWarning() {
  const deprecatedFeature = true;
  if (deprecatedFeature) {
    console.warn('WARNING: This feature is deprecated and will be removed in v2.0');
  }
}

console.log('2. Warning messages:');
demonstrateWarning();
console.log();

// 3. DIAGNOSTIC/DEBUG INFORMATION
function demonstrateDiagnostics() {
  const DEBUG = process.env.DEBUG === 'true';

  if (DEBUG) {
    console.error('[DEBUG] Processing item 1...');
    console.error('[DEBUG] Database query took 45ms');
    console.error('[DEBUG] Cache hit ratio: 87%');
  }

  // Actual program output goes to stdout
  console.log('Result: Success');
}

console.log('3. Diagnostic information:');
demonstrateDiagnostics();
console.log();

// 4. PROGRESS INDICATORS
function demonstrateProgress() {
  console.error('Processing files...');
  console.log('file1.txt'); // Actual output
  console.error('  [1/3] file1.txt processed');

  console.log('file2.txt'); // Actual output
  console.error('  [2/3] file2.txt processed');

  console.log('file3.txt'); // Actual output
  console.error('  [3/3] file3.txt processed');
  console.error('Done!');
}

console.log('4. Progress indicators:');
demonstrateProgress();
console.log();

// =============================================================================
// PRACTICAL LOGGING UTILITY
// =============================================================================

console.log('--- Practical Logging Utility ---\n');

/**
 * Simple logger that uses appropriate streams
 */
class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info'; // debug, info, warn, error
    this.timestamp = options.timestamp !== false;
    this.colors = options.colors && process.stderr.isTTY;
  }

  // ANSI color codes (only work in terminals)
  static COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m',
  };

  _shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  _format(level, message) {
    let formatted = '';

    if (this.timestamp) {
      const now = new Date().toISOString();
      formatted += `[${now}] `;
    }

    formatted += `[${level.toUpperCase()}] ${message}`;

    return formatted;
  }

  _colorize(text, color) {
    if (!this.colors) return text;
    return `${Logger.COLORS[color]}${text}${Logger.COLORS.reset}`;
  }

  debug(message) {
    if (!this._shouldLog('debug')) return;
    const formatted = this._format('debug', message);
    console.error(this._colorize(formatted, 'gray'));
  }

  info(message) {
    if (!this._shouldLog('info')) return;
    const formatted = this._format('info', message);
    console.log(formatted); // Info can go to stdout
  }

  warn(message) {
    if (!this._shouldLog('warn')) return;
    const formatted = this._format('warn', message);
    console.error(this._colorize(formatted, 'yellow'));
  }

  error(message) {
    if (!this._shouldLog('error')) return;
    const formatted = this._format('error', message);
    console.error(this._colorize(formatted, 'red'));
  }
}

// Example usage
const logger = new Logger({ level: 'debug', colors: true });

console.log('Logger example:');
logger.debug('Connecting to database...');
logger.info('Server started on port 3000');
logger.warn('High memory usage detected');
logger.error('Failed to connect to API');
console.log();

// =============================================================================
// SEPARATING OUTPUT AND LOGS
// =============================================================================

console.log('--- Separating Output and Logs ---\n');

/**
 * Example: A program that generates data and logs progress
 */
function generateReport() {
  console.error('Starting report generation...');

  // Simulate data generation
  const data = [
    { id: 1, name: 'Alice', score: 95 },
    { id: 2, name: 'Bob', score: 87 },
    { id: 3, name: 'Charlie', score: 92 },
  ];

  console.error('Processing 3 records...');

  // Output actual data to stdout (can be piped or redirected)
  data.forEach((record, index) => {
    console.error(`  Processing record ${index + 1}/${data.length}...`);
    console.log(JSON.stringify(record)); // Data goes to stdout
  });

  console.error('Report generation complete!');
}

console.log('Report generation example:');
console.log('(Data goes to stdout, logs go to stderr)');
console.log();
generateReport();
console.log();

// =============================================================================
// ERROR HANDLING PATTERNS
// =============================================================================

console.log('--- Error Handling Patterns ---\n');

/**
 * Pattern 1: Logging errors before re-throwing
 */
function processFileWithLogging(filename) {
  try {
    // Simulate file processing
    if (!filename) {
      throw new Error('Filename is required');
    }
    console.log(`Processed: ${filename}`);
  } catch (error) {
    console.error(`ERROR: Failed to process file: ${error.message}`);
    throw error; // Re-throw for caller to handle
  }
}

console.log('1. Logging before re-throwing:');
try {
  processFileWithLogging('');
} catch (error) {
  // Error already logged
}
console.log();

/**
 * Pattern 2: Graceful degradation with warnings
 */
function loadConfigWithDefaults(configPath) {
  let config = {};

  try {
    // Simulate config loading
    throw new Error('Config file not found');
  } catch (error) {
    console.warn(`WARN: ${error.message}. Using default configuration.`);
    config = { port: 3000, host: 'localhost' }; // Defaults
  }

  return config;
}

console.log('2. Graceful degradation:');
const config = loadConfigWithDefaults('/nonexistent/config.json');
console.log('Config loaded:', config);
console.log();

/**
 * Pattern 3: Structured error logging
 */
function logStructuredError(error, context = {}) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    ...context,
  };

  console.error(JSON.stringify(errorInfo, null, 2));
}

console.log('3. Structured error logging:');
try {
  throw new Error('Database connection failed');
} catch (error) {
  logStructuredError(error, {
    component: 'database',
    operation: 'connect',
    retryCount: 3,
  });
}
console.log();

console.log('=== Key Takeaways ===');
console.log('• Use stdout for program output (data, results)');
console.log('• Use stderr for errors, warnings, and diagnostics');
console.log('• console.log() writes to stdout');
console.log('• console.error() and console.warn() write to stderr');
console.log('• Separate streams allow independent redirection');
console.log('• Logs on stderr won\'t pollute data piped from stdout');

console.log('\n=== Try These Commands ===');
console.log('1. Separate stdout and stderr:');
console.log('   node 05-stderr-logging.js > output.txt 2> errors.txt');
console.log('');
console.log('2. Only capture output (data):');
console.log('   node 05-stderr-logging.js > output.txt');
console.log('   (You\'ll still see errors in terminal)');
console.log('');
console.log('3. Only capture errors:');
console.log('   node 05-stderr-logging.js 2> errors.txt');
console.log('   (You\'ll still see output in terminal)');
console.log('');
console.log('4. Suppress error messages:');
console.log('   node 05-stderr-logging.js 2> /dev/null');
console.log('   (On Windows: 2> NUL)');
console.log('');
console.log('5. Combine stdout and stderr:');
console.log('   node 05-stderr-logging.js > combined.txt 2>&1');

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * BEST PRACTICES:
 *
 * 1. Use stdout for data:
 *    - Program results
 *    - Data to be processed by other programs
 *    - JSON output from APIs
 *    - Query results
 *
 * 2. Use stderr for:
 *    - Error messages
 *    - Warning messages
 *    - Debug logs
 *    - Progress indicators
 *    - Status messages
 *    - Diagnostic information
 *
 * 3. Logging levels:
 *    - ERROR: Something failed, requires attention
 *    - WARN: Something unexpected, but program continues
 *    - INFO: General informational messages
 *    - DEBUG: Detailed diagnostic information
 *
 * 4. Structured logging:
 *    console.error(JSON.stringify({
 *      level: 'error',
 *      timestamp: new Date().toISOString(),
 *      message: 'Operation failed',
 *      context: { userId: 123, operation: 'payment' }
 *    }));
 *
 * 5. Logging libraries:
 *    - winston: Full-featured logging library
 *    - pino: High-performance JSON logger
 *    - bunyan: JSON logging library
 *    - debug: Lightweight debugging utility
 *
 * 6. Production logging:
 *    - Log to files or log management systems
 *    - Use log rotation (winston-daily-rotate-file)
 *    - Include context (request IDs, user IDs)
 *    - Never log sensitive data (passwords, tokens)
 *    - Use appropriate log levels
 *    - Consider structured (JSON) logging for parsing
 */
