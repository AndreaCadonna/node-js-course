/**
 * Exercise 4: Debug Logging System
 *
 * DIFFICULTY: ⭐⭐⭐ Hard
 * TIME: 35-40 minutes
 *
 * OBJECTIVE:
 * Build a comprehensive debug logging system using util.debuglog() with
 * namespaces, severity levels, and production-safe conditional logging.
 * This is crucial for debugging production applications efficiently.
 *
 * REQUIREMENTS:
 * 1. Create hierarchical debug namespaces (app:db:query, app:http:request)
 * 2. Implement severity levels (trace, debug, info, warn, error)
 * 3. Add conditional logging that checks .enabled property
 * 4. Build performance-aware logging (avoid expensive operations when disabled)
 * 5. Create a central logger factory
 *
 * BONUS CHALLENGES:
 * - Add timestamp and formatting to debug output
 * - Create log filtering by namespace patterns
 * - Implement log collection and analysis
 * - Add structured logging support
 *
 * HINTS:
 * - Use util.debuglog() for each namespace
 * - Check debugLog.enabled before expensive operations
 * - Use format specifiers (%s, %d, %O) in debug messages
 * - Create factory function to generate loggers
 */

const util = require('util');

// TODO 1: Create DebugLogger class
class DebugLogger {
  constructor(namespace, options = {}) {
    this.namespace = namespace;
    this.options = options;

    // TODO: Create util.debuglog for this namespace
    this.debugLog = null; // Replace with util.debuglog(namespace)

    // TODO: Create debuglogs for different severity levels
    this.levels = {
      trace: null, // util.debuglog(namespace + ':trace')
      debug: null, // util.debuglog(namespace + ':debug')
      info: null, // util.debuglog(namespace + ':info')
      warn: null, // util.debuglog(namespace + ':warn')
      error: null, // util.debuglog(namespace + ':error')
    };

    // Performance tracking
    this.stats = {
      calls: 0,
      skipped: 0, // Calls skipped when disabled
    };
  }

  // TODO: Implement trace level logging
  trace(message, ...args) {
    // Your code here:
    // 1. Check if enabled
    // 2. Format message with util.formatWithOptions
    // 3. Call debuglog
    // 4. Update stats
  }

  // TODO: Implement debug level logging
  debug(message, ...args) {
    // Your code here
  }

  // TODO: Implement info level logging
  info(message, ...args) {
    // Your code here
  }

  // TODO: Implement warn level logging
  warn(message, ...args) {
    // Your code here
  }

  // TODO: Implement error level logging
  error(message, ...args) {
    // Your code here
  }

  // TODO: Implement conditional logging with expensive operations
  // Only compute data if logging is enabled
  debugExpensive(message, expensiveDataFn) {
    // Your code here:
    // 1. Check if debug is enabled
    // 2. If yes, call expensiveDataFn() and log
    // 3. If no, skip and update skipped count
  }

  // TODO: Time an operation
  time(label) {
    // Your code here:
    // 1. Store start time if enabled
    // 2. Return handle or label
  }

  timeEnd(label) {
    // Your code here:
    // 1. Calculate duration if enabled
    // 2. Log duration
    // 3. Clean up timer
  }

  // TODO: Get logger statistics
  getStats() {
    // Your code here:
    // Return stats including enabled status
  }
}

// TODO 2: Create LoggerFactory
class LoggerFactory {
  constructor() {
    this.loggers = new Map();
    this.globalOptions = {
      colors: true,
      depth: 3,
      compact: false,
    };
  }

  // TODO: Create or get logger for namespace
  getLogger(namespace) {
    // Your code here:
    // 1. Check if logger exists
    // 2. Create if doesn't exist
    // 3. Return logger
  }

  // TODO: Create hierarchical logger
  // Example: getLogger('app:db:query')
  // Should create loggers for 'app', 'app:db', 'app:db:query'
  createHierarchy(namespace) {
    // Your code here:
    // 1. Split namespace by ':'
    // 2. Create logger for each level
    // 3. Return leaf logger
  }

  // TODO: Get all loggers
  getAllLoggers() {
    // Your code here
  }

  // TODO: Get statistics for all loggers
  getAllStats() {
    // Your code here
  }
}

// TODO 3: Create application logger system
class ApplicationLogger {
  constructor(appName) {
    this.appName = appName;
    this.factory = new LoggerFactory();

    // TODO: Create loggers for different subsystems
    this.db = null; // this.factory.getLogger(appName + ':db')
    this.http = null; // this.factory.getLogger(appName + ':http')
    this.cache = null; // this.factory.getLogger(appName + ':cache')
    this.auth = null; // this.factory.getLogger(appName + ':auth')
  }

  // TODO: Create subsystem-specific loggers
  createSubsystemLogger(subsystem) {
    // Your code here:
    // Return logger for appName:subsystem
  }

  // TODO: Log across all subsystems
  logAll(level, message, data) {
    // Your code here:
    // Log to all subsystem loggers
  }

  // TODO: Get report of logging activity
  getReport() {
    // Your code here:
    // Return statistics from all loggers
  }
}

// TODO 4: Create Database class with debug logging
class Database {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.queryCount = 0;
  }

  async connect() {
    this.logger.debug('Connecting to database: %s', this.config.host);

    // TODO: Use debugExpensive for connection details
    // Only serialize config if debugging is enabled

    await new Promise(resolve => setTimeout(resolve, 100));

    this.logger.info('Database connected successfully');
  }

  async query(sql, params = []) {
    this.queryCount++;

    // TODO: Log query start with trace level
    this.logger.time('query');

    this.logger.debug('Executing query: %s', sql);

    // TODO: Only log params if debug is enabled
    this.logger.debugExpensive('Query params: %O', () => params);

    await new Promise(resolve => setTimeout(resolve, 50));

    this.logger.timeEnd('query');

    this.logger.trace('Query %d completed', this.queryCount);

    return { rows: [], rowCount: 0 };
  }
}

// TODO 5: Create HTTP Server class with debug logging
class HTTPServer {
  constructor(logger) {
    this.logger = logger;
    this.requestCount = 0;
  }

  async handleRequest(req) {
    this.requestCount++;

    const requestId = this.requestCount;

    // TODO: Create request-specific logger
    const requestLogger = null; // Create logger for this request

    requestLogger.debug('Request %d: %s %s', requestId, req.method, req.path);

    // TODO: Use time/timeEnd for request duration

    // TODO: Log request headers only if trace is enabled

    await new Promise(resolve => setTimeout(resolve, 100));

    requestLogger.info('Request %d completed', requestId);

    return { status: 200, body: 'OK' };
  }
}

// TODO 6: Test the debug logging system
async function testDebugLoggingSystem() {
  console.log('=== Testing Debug Logging System ===\n');
  console.log('Enable with: NODE_DEBUG=myapp:* node exercise-4.js\n');

  // TODO: Create application logger
  const appLogger = new ApplicationLogger('myapp');

  // TODO: Test database logging
  console.log('Testing Database Logging:');
  const db = new Database(
    { host: 'localhost', port: 5432, database: 'myapp' },
    appLogger.db
  );

  await db.connect();
  await db.query('SELECT * FROM users WHERE id = ?', [123]);
  await db.query('SELECT * FROM posts WHERE user_id = ?', [123]);

  // TODO: Test HTTP server logging
  console.log('\nTesting HTTP Server Logging:');
  const server = new HTTPServer(appLogger.http);

  await server.handleRequest({ method: 'GET', path: '/api/users' });
  await server.handleRequest({ method: 'POST', path: '/api/users' });

  // TODO: Test cache logging
  console.log('\nTesting Cache Logging:');
  appLogger.cache.debug('Cache key: %s', 'user:123');
  appLogger.cache.info('Cache hit');

  // TODO: Test expensive logging
  console.log('\nTesting Expensive Logging:');
  appLogger.db.debugExpensive('Expensive data: %O', () => {
    console.log('  Computing expensive data...');
    return { huge: 'object', with: 'lots', of: 'data' };
  });

  // TODO: Get and print statistics
  console.log('\n=== Logging Statistics ===');
  // const report = appLogger.getReport();
  // console.log(report);
}

// TODO 7: Create helper to test with different NODE_DEBUG settings
function demonstrateUsage() {
  console.log(`
Debug Logging System Usage:

Enable all debug logs:
  NODE_DEBUG=myapp:* node exercise-4.js

Enable specific subsystem:
  NODE_DEBUG=myapp:db node exercise-4.js

Enable multiple subsystems:
  NODE_DEBUG=myapp:db,myapp:http node exercise-4.js

Enable specific levels:
  NODE_DEBUG=myapp:db:debug node exercise-4.js
  NODE_DEBUG=myapp:*:error node exercise-4.js

Benefits:
- Zero overhead when disabled
- Selective enabling by namespace
- Hierarchical organization
- Performance tracking
  `);
}

// Uncomment to run:
// testDebugLoggingSystem();
// demonstrateUsage();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Run without debug:
 *    node exercise-4.js
 *    Should see minimal output, no debug logs
 *
 * 2. Run with all debug:
 *    NODE_DEBUG=myapp:* node exercise-4.js
 *    Should see all debug logs
 *
 * 3. Run with specific subsystem:
 *    NODE_DEBUG=myapp:db node exercise-4.js
 *    Should see only database logs
 *
 * 4. Test cases to verify:
 *    ✓ Logs appear only when enabled
 *    ✓ Different severity levels work
 *    ✓ Expensive operations skipped when disabled
 *    ✓ Timing functions work
 *    ✓ Statistics are tracked
 *    ✓ Hierarchical namespaces work
 *
 * EXAMPLE OUTPUT:
 * ───────────────────────────────────────
 * Without NODE_DEBUG:
 * === Testing Debug Logging System ===
 *
 * Testing Database Logging:
 * Testing HTTP Server Logging:
 * Testing Cache Logging:
 *
 * === Logging Statistics ===
 * Total loggers: 4
 * All loggers disabled
 *
 * With NODE_DEBUG=myapp:db:
 * === Testing Debug Logging System ===
 *
 * Testing Database Logging:
 * MYAPP:DB 12345: Connecting to database: localhost
 * MYAPP:DB 12345: Database connected successfully
 * MYAPP:DB 12345: Executing query: SELECT * FROM users WHERE id = ?
 * MYAPP:DB 12345: Query params: [ 123 ]
 * MYAPP:DB 12345: Query completed in 52ms
 *
 * === Logging Statistics ===
 * myapp:db - 5 logs, enabled
 * myapp:http - 0 logs, disabled
 * myapp:cache - 0 logs, disabled
 * ───────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - How does util.debuglog() achieve zero overhead?
 * - When should you check .enabled vs just logging?
 * - How do hierarchical namespaces help organization?
 * - What's the benefit of severity levels?
 * - How do you debug production issues with debuglog?
 */

/**
 * BONUS IMPLEMENTATION IDEAS:
 *
 * 1. Log Filtering:
 *    logger.addFilter((message) => message.includes('error'))
 *    Only log messages matching filter
 *
 * 2. Structured Logging:
 *    logger.info('User login', { userId: 123, ip: '1.2.3.4' })
 *    Output as JSON for log aggregation
 *
 * 3. Log Sampling:
 *    logger.sample(0.1).debug('Only log 10% of messages')
 *    Reduce log volume in high-traffic scenarios
 *
 * 4. Performance Budget:
 *    logger.maxDuration(100) // Warn if logging takes > 100ms
 *    Detect expensive logging operations
 */
