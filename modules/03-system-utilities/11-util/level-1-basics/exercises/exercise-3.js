/**
 * Exercise 3: Formatted Logger
 *
 * DIFFICULTY: ⭐⭐ Intermediate
 * TIME: 20-30 minutes
 *
 * OBJECTIVE:
 * Build a comprehensive logging utility using util.format and util.inspect
 * to create formatted, colorized, and structured log messages.
 *
 * REQUIREMENTS:
 * 1. Create a Logger class with methods: info, warn, error, debug
 * 2. Use util.format for string formatting with placeholders
 * 3. Add timestamp to each log message
 * 4. Colorize log levels using util.inspect colors
 * 5. Pretty-print objects with util.inspect
 *
 * BONUS CHALLENGES:
 * - Add log levels filtering (only show logs above certain level)
 * - Implement log file writing alongside console output
 * - Add stack trace for error logs
 *
 * HINTS:
 * - util.format supports %s (string), %d (number), %j (JSON), %o (object)
 * - Use util.inspect for objects to get colored output
 * - ANSI color codes: \x1b[32m (green), \x1b[33m (yellow), \x1b[31m (red)
 */

const util = require('util');

// TODO 1: Create Logger class
class Logger {
  constructor(options = {}) {
    // Your code here:
    // Initialize logger with options like:
    // - name: logger name
    // - level: minimum log level to display
    // - timestamp: whether to show timestamps
  }

  // TODO 2: Format timestamp
  _getTimestamp() {
    // Your code here:
    // Return formatted timestamp string
    // Example: [2024-11-19 10:30:45]
  }

  // TODO 3: Format log message
  _formatMessage(level, color, ...args) {
    // Your code here:
    // 1. Get timestamp
    // 2. Format level with color
    // 3. Use util.format to format the message arguments
    // 4. Return complete formatted string
  }

  // TODO 4: Implement log methods
  info(...args) {
    // Your code here:
    // Log info level (green)
  }

  warn(...args) {
    // Your code here:
    // Log warn level (yellow)
  }

  error(...args) {
    // Your code here:
    // Log error level (red)
  }

  debug(...args) {
    // Your code here:
    // Log debug level (cyan)
  }

  // TODO 5: Pretty print objects
  object(label, obj) {
    // Your code here:
    // Use util.inspect to pretty-print the object
    // Include label and formatted object
  }
}

// TODO 6: Test the logger
function testLogger() {
  console.log('=== Testing Logger ===\n');

  // Your code here:
  // 1. Create logger instance
  // 2. Test info with string formatting
  // 3. Test warn with multiple arguments
  // 4. Test error with object
  // 5. Test debug with mixed types
  // 6. Test object method with complex object

  // Example tests:
  // logger.info('User %s logged in', 'john_doe');
  // logger.warn('High memory usage: %d%%', 85);
  // logger.error('Failed to connect:', { host: 'localhost', port: 3000 });
  // logger.debug('Debug info: %o', { state: 'active', count: 5 });
}

// Uncomment to run:
// testLogger();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Run your solution:
 *    node exercise-3.js
 *
 * 2. Verify:
 *    - Each log level has appropriate color
 *    - Timestamps are displayed correctly
 *    - Objects are pretty-printed
 *    - String formatting works with placeholders
 *
 * 3. Test different scenarios:
 *    - Log simple strings
 *    - Log with format specifiers (%s, %d, %o)
 *    - Log complex objects
 *    - Log errors with stack traces
 *
 * EXAMPLE OUTPUT:
 * ───────────────────────────────────────
 * === Testing Logger ===
 *
 * [2024-11-19 10:30:45] INFO: User john_doe logged in
 * [2024-11-19 10:30:45] WARN: High memory usage: 85%
 * [2024-11-19 10:30:45] ERROR: Failed to connect: { host: 'localhost', port: 3000 }
 * [2024-11-19 10:30:45] DEBUG: Debug info: { state: 'active', count: 5 }
 *
 * [2024-11-19 10:30:45] OBJECT: User Data
 * {
 *   id: 1,
 *   name: 'John Doe',
 *   profile: {
 *     email: 'john@example.com',
 *     settings: { theme: 'dark' }
 *   }
 * }
 * ───────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - What format specifiers does util.format support?
 * - How do ANSI color codes work?
 * - When should you use %j vs %o for objects?
 * - How can loggers improve debugging?
 */
