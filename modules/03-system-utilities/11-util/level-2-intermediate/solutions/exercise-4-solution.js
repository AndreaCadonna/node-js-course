/**
 * Solution: Exercise 4 - Debug Logging System
 * =============================================
 *
 * This solution demonstrates building a production-ready debug logging system
 * using util.debuglog(). Key features:
 * - Zero overhead when disabled
 * - Hierarchical namespaces
 * - Multiple severity levels
 * - Performance tracking
 * - Conditional logging
 */

const util = require('util');
const { performance } = require('perf_hooks');

// =============================================================================
// SOLUTION: DebugLogger with severity levels
// =============================================================================

class DebugLogger {
  constructor(namespace, options = {}) {
    this.namespace = namespace;
    this.options = options;

    // Create base debug log
    this.debugLog = util.debuglog(namespace);

    // Create debuglogs for different severity levels
    this.levels = {
      trace: util.debuglog(`${namespace}:trace`),
      debug: util.debuglog(`${namespace}:debug`),
      info: util.debuglog(`${namespace}:info`),
      warn: util.debuglog(`${namespace}:warn`),
      error: util.debuglog(`${namespace}:error`),
    };

    // Performance tracking
    this.stats = {
      calls: 0,
      skipped: 0,
    };

    // Timers
    this.timers = new Map();
  }

  /**
   * Trace level logging (most verbose)
   */
  trace(message, ...args) {
    this.stats.calls++;

    if (!this.levels.trace.enabled) {
      this.stats.skipped++;
      return;
    }

    this.levels.trace(message, ...args);
  }

  /**
   * Debug level logging
   */
  debug(message, ...args) {
    this.stats.calls++;

    if (!this.levels.debug.enabled) {
      this.stats.skipped++;
      return;
    }

    this.levels.debug(message, ...args);
  }

  /**
   * Info level logging
   */
  info(message, ...args) {
    this.stats.calls++;

    if (!this.levels.info.enabled) {
      this.stats.skipped++;
      return;
    }

    this.levels.info(message, ...args);
  }

  /**
   * Warn level logging
   */
  warn(message, ...args) {
    this.stats.calls++;

    if (!this.levels.warn.enabled) {
      this.stats.skipped++;
      return;
    }

    this.levels.warn(message, ...args);
  }

  /**
   * Error level logging
   */
  error(message, ...args) {
    this.stats.calls++;

    if (!this.levels.error.enabled) {
      this.stats.skipped++;
      return;
    }

    this.levels.error(message, ...args);
  }

  /**
   * Conditional logging with expensive operations
   * Only computes data if logging is enabled
   */
  debugExpensive(message, expensiveDataFn) {
    this.stats.calls++;

    if (!this.levels.debug.enabled) {
      this.stats.skipped++;
      return;
    }

    // Only compute expensive data if debug is enabled
    const data = expensiveDataFn();
    this.levels.debug(message, data);
  }

  /**
   * Start timing an operation
   */
  time(label) {
    if (!this.levels.debug.enabled) {
      return;
    }

    this.timers.set(label, performance.now());
    this.levels.debug(`Timer started: ${label}`);
  }

  /**
   * End timing and log duration
   */
  timeEnd(label) {
    if (!this.levels.debug.enabled) {
      return;
    }

    const startTime = this.timers.get(label);
    if (startTime === undefined) {
      this.levels.warn(`No timer found for: ${label}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);
    this.levels.debug(`Timer ended: ${label} (${duration.toFixed(2)}ms)`);
  }

  /**
   * Get logger statistics
   */
  getStats() {
    return {
      namespace: this.namespace,
      calls: this.stats.calls,
      skipped: this.stats.skipped,
      logged: this.stats.calls - this.stats.skipped,
      enabled: this.debugLog.enabled,
      levels: {
        trace: this.levels.trace.enabled,
        debug: this.levels.debug.enabled,
        info: this.levels.info.enabled,
        warn: this.levels.warn.enabled,
        error: this.levels.error.enabled,
      }
    };
  }
}

// =============================================================================
// SOLUTION: LoggerFactory for managing multiple loggers
// =============================================================================

class LoggerFactory {
  constructor() {
    this.loggers = new Map();
    this.globalOptions = {
      colors: true,
      depth: 3,
      compact: false,
    };
  }

  /**
   * Get or create logger for namespace
   */
  getLogger(namespace) {
    if (this.loggers.has(namespace)) {
      return this.loggers.get(namespace);
    }

    const logger = new DebugLogger(namespace, this.globalOptions);
    this.loggers.set(namespace, logger);
    return logger;
  }

  /**
   * Create hierarchical logger
   * Example: 'app:db:query' creates loggers for 'app', 'app:db', 'app:db:query'
   */
  createHierarchy(namespace) {
    const parts = namespace.split(':');
    const loggers = [];

    for (let i = 0; i < parts.length; i++) {
      const ns = parts.slice(0, i + 1).join(':');
      loggers.push(this.getLogger(ns));
    }

    // Return leaf logger
    return loggers[loggers.length - 1];
  }

  /**
   * Get all loggers
   */
  getAllLoggers() {
    return Array.from(this.loggers.values());
  }

  /**
   * Get statistics for all loggers
   */
  getAllStats() {
    const stats = {
      totalLoggers: this.loggers.size,
      enabledLoggers: 0,
      totalCalls: 0,
      totalSkipped: 0,
      loggers: []
    };

    for (const logger of this.loggers.values()) {
      const loggerStats = logger.getStats();
      stats.loggers.push(loggerStats);
      stats.totalCalls += loggerStats.calls;
      stats.totalSkipped += loggerStats.skipped;
      if (loggerStats.enabled) {
        stats.enabledLoggers++;
      }
    }

    return stats;
  }
}

// =============================================================================
// SOLUTION: ApplicationLogger for subsystem organization
// =============================================================================

class ApplicationLogger {
  constructor(appName) {
    this.appName = appName;
    this.factory = new LoggerFactory();

    // Create loggers for different subsystems
    this.db = this.factory.getLogger(`${appName}:db`);
    this.http = this.factory.getLogger(`${appName}:http`);
    this.cache = this.factory.getLogger(`${appName}:cache`);
    this.auth = this.factory.getLogger(`${appName}:auth`);
  }

  /**
   * Create logger for custom subsystem
   */
  createSubsystemLogger(subsystem) {
    return this.factory.getLogger(`${this.appName}:${subsystem}`);
  }

  /**
   * Log to all subsystems
   */
  logAll(level, message, data) {
    const loggers = [this.db, this.http, this.cache, this.auth];

    for (const logger of loggers) {
      if (logger[level]) {
        logger[level](message, data);
      }
    }
  }

  /**
   * Get report of logging activity
   */
  getReport() {
    return this.factory.getAllStats();
  }
}

// =============================================================================
// SOLUTION: Database class with debug logging
// =============================================================================

class Database {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.queryCount = 0;
  }

  async connect() {
    this.logger.debug('Connecting to database: %s:%d', this.config.host, this.config.port);

    // Use debugExpensive for connection details
    // Only serialize config if debugging is enabled
    this.logger.debugExpensive('Connection config: %O', () => {
      console.log('    [Computing expensive config serialization...]');
      return {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        password: '[HIDDEN]'
      };
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    this.logger.info('Database connected successfully');
  }

  async query(sql, params = []) {
    this.queryCount++;

    // Log query start with trace level
    this.logger.trace('Query %d starting', this.queryCount);

    this.logger.time(`query-${this.queryCount}`);

    this.logger.debug('Executing query: %s', sql);

    // Only log params if debug is enabled
    this.logger.debugExpensive('Query params', () => {
      console.log('    [Computing query params serialization...]');
      return params;
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    this.logger.timeEnd(`query-${this.queryCount}`);

    this.logger.trace('Query %d completed', this.queryCount);

    return { rows: [], rowCount: 0 };
  }
}

// =============================================================================
// SOLUTION: HTTPServer class with debug logging
// =============================================================================

class HTTPServer {
  constructor(logger) {
    this.logger = logger;
    this.requestCount = 0;
  }

  async handleRequest(req) {
    this.requestCount++;
    const requestId = this.requestCount;

    // Create request-specific logger (hierarchical)
    const factory = new LoggerFactory();
    const requestLogger = factory.getLogger(`${this.logger.namespace}:req${requestId}`);

    requestLogger.debug('Request %d: %s %s', requestId, req.method, req.path);

    // Time request duration
    requestLogger.time('request');

    // Log request headers only if trace is enabled
    requestLogger.debugExpensive('Request headers', () => {
      return req.headers || { 'content-type': 'application/json' };
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    requestLogger.timeEnd('request');
    requestLogger.info('Request %d completed', requestId);

    return { status: 200, body: 'OK' };
  }
}

// =============================================================================
// TEST CASES
// =============================================================================

async function testDebugLoggingSystem() {
  console.log('=== Testing Debug Logging System ===\n');
  console.log('Enable with: NODE_DEBUG=myapp:* node exercise-4-solution.js\n');
  console.log('Or specific: NODE_DEBUG=myapp:db node exercise-4-solution.js\n');

  // Create application logger
  const appLogger = new ApplicationLogger('myapp');

  // Test database logging
  console.log('Testing Database Logging:');
  const db = new Database(
    { host: 'localhost', port: 5432, database: 'myapp' },
    appLogger.db
  );

  await db.connect();
  await db.query('SELECT * FROM users WHERE id = ?', [123]);
  await db.query('SELECT * FROM posts WHERE user_id = ?', [123]);

  // Test HTTP server logging
  console.log('\nTesting HTTP Server Logging:');
  const server = new HTTPServer(appLogger.http);

  await server.handleRequest({
    method: 'GET',
    path: '/api/users',
    headers: { authorization: 'Bearer token123' }
  });
  await server.handleRequest({
    method: 'POST',
    path: '/api/users',
    headers: { 'content-type': 'application/json' }
  });

  // Test cache logging
  console.log('\nTesting Cache Logging:');
  appLogger.cache.debug('Cache lookup: %s', 'user:123');
  appLogger.cache.info('Cache hit');
  appLogger.cache.warn('Cache size approaching limit');

  // Test expensive logging
  console.log('\nTesting Expensive Logging (computation only runs if enabled):');
  appLogger.db.debugExpensive('Expensive data: %O', () => {
    console.log('  [This message appears only if myapp:db:debug is enabled]');
    return { huge: 'object', with: 'lots', of: 'data' };
  });

  // Get and print statistics
  console.log('\n=== Logging Statistics ===\n');
  const report = appLogger.getReport();

  console.log(`Total loggers: ${report.totalLoggers}`);
  console.log(`Enabled loggers: ${report.enabledLoggers}`);
  console.log(`Total calls: ${report.totalCalls}`);
  console.log(`Skipped (disabled): ${report.totalSkipped}`);
  console.log(`Actually logged: ${report.totalCalls - report.totalSkipped}\n`);

  console.log('Per-logger stats:');
  report.loggers.forEach(stats => {
    console.log(`  ${stats.namespace}:`);
    console.log(`    Calls: ${stats.calls}`);
    console.log(`    Logged: ${stats.logged}`);
    console.log(`    Skipped: ${stats.skipped}`);
    console.log(`    Enabled: ${stats.enabled}`);
  });
}

function demonstrateUsage() {
  console.log(`
═══════════════════════════════════════════════════════════════
Debug Logging System Usage Guide
═══════════════════════════════════════════════════════════════

Enable all debug logs:
  NODE_DEBUG=myapp:* node exercise-4-solution.js

Enable specific subsystem:
  NODE_DEBUG=myapp:db node exercise-4-solution.js

Enable multiple subsystems:
  NODE_DEBUG=myapp:db,myapp:http node exercise-4-solution.js

Enable specific levels:
  NODE_DEBUG=myapp:db:debug node exercise-4-solution.js
  NODE_DEBUG=myapp:*:error node exercise-4-solution.js

Enable with wildcards:
  NODE_DEBUG=myapp:* node exercise-4-solution.js
  NODE_DEBUG=*:debug node exercise-4-solution.js

═══════════════════════════════════════════════════════════════
Benefits:
═══════════════════════════════════════════════════════════════

✓ ZERO OVERHEAD when disabled
  - No performance impact in production
  - Expensive operations are skipped entirely
  - No string formatting when not needed

✓ SELECTIVE ENABLING
  - Enable only what you need to debug
  - Hierarchical organization
  - Pattern matching with wildcards

✓ PRODUCTION-SAFE
  - Always safe to have debug calls in code
  - Enable debugging in production if needed
  - No code changes required

✓ PERFORMANCE TRACKING
  - Statistics on log usage
  - Timing operations
  - Skipped call tracking

═══════════════════════════════════════════════════════════════
  `);
}

if (require.main === module) {
  testDebugLoggingSystem().then(() => {
    console.log('\n');
    demonstrateUsage();
  });
}

module.exports = {
  DebugLogger,
  LoggerFactory,
  ApplicationLogger,
  Database,
  HTTPServer
};

// =============================================================================
// KEY LEARNING POINTS
// =============================================================================

/**
 * 1. UTIL.DEBUGLOG() IS ZERO-COST WHEN DISABLED
 *    The .enabled property lets you check if logging is active before
 *    doing expensive operations. This makes debug logging production-safe.
 *
 * 2. HIERARCHICAL NAMESPACES FOR ORGANIZATION
 *    Use colons to create hierarchy: app:db:query, app:http:request
 *    This allows selective enabling: NODE_DEBUG=app:db enables all db logs
 *
 * 3. CHECK .enabled BEFORE EXPENSIVE OPERATIONS
 *    Always check debugLog.enabled before:
 *    - Serializing large objects
 *    - Computing statistics
 *    - Formatting complex data
 *    This ensures zero overhead when disabled
 *
 * 4. SEVERITY LEVELS WITH SEPARATE NAMESPACES
 *    Create separate debuglogs for trace, debug, info, warn, error
 *    Allows filtering: NODE_DEBUG=app:*:error shows only errors
 *
 * 5. COMBINE WITH util.formatWithOptions
 *    Use format specifiers (%s, %d, %O) for efficient formatting
 *    Formatting only happens when logging is enabled
 *
 * 6. TRACK STATISTICS
 *    Monitor how often logging is called vs actually logged
 *    Helps optimize hot paths and understand usage
 *
 * 7. PRODUCTION DEBUGGING
 *    Debug logging is perfect for production:
 *    - Enable only when needed
 *    - No code changes required
 *    - Zero overhead when disabled
 *    - Can debug live issues
 */

// =============================================================================
// COMMON MISTAKES
// =============================================================================

/**
 * MISTAKE 1: Not checking .enabled before expensive operations
 * ❌ BAD:
 */
function bad1(debugLog, data) {
  const serialized = JSON.stringify(data); // Always runs!
  debugLog('Data: %s', serialized);
}
/**
 * ✅ GOOD:
 */
function good1(debugLog, data) {
  if (debugLog.enabled) {
    const serialized = JSON.stringify(data);
    debugLog('Data: %s', serialized);
  }
}

/**
 * MISTAKE 2: Creating debuglog inside hot paths
 * ❌ BAD:
 */
function bad2() {
  for (let i = 0; i < 1000; i++) {
    const debugLog = util.debuglog('myapp'); // Created 1000 times!
    debugLog('Iteration %d', i);
  }
}
/**
 * ✅ GOOD:
 */
const debugLog = util.debuglog('myapp'); // Created once
function good2() {
  for (let i = 0; i < 1000; i++) {
    debugLog('Iteration %d', i);
  }
}

/**
 * MISTAKE 3: Using console.log instead of debuglog
 * ❌ BAD:
 */
function bad3() {
  console.log('Debug info'); // Always outputs, can't be disabled
}
/**
 * ✅ GOOD:
 */
const debugLog = util.debuglog('myapp');
function good3() {
  debugLog('Debug info'); // Only outputs when NODE_DEBUG=myapp
}

// =============================================================================
// GOING FURTHER - Advanced Challenges
// =============================================================================

/**
 * CHALLENGE 1: Structured Logging
 * Add structured logging support:
 *
 * logger.structured('user.login', {
 *   userId: 123,
 *   ip: '1.2.3.4',
 *   timestamp: Date.now()
 * });
 *
 * Output as JSON for log aggregation systems (Elasticsearch, etc.)
 */

/**
 * CHALLENGE 2: Log Sampling
 * Implement sampling to reduce log volume:
 *
 * logger.sample(0.1).debug('High-volume log');
 * // Only logs 10% of calls
 *
 * Useful for high-traffic scenarios where logging everything is too expensive
 */

/**
 * CHALLENGE 3: Context Propagation
 * Add request/transaction context:
 *
 * logger.withContext({ requestId: '123' }, () => {
 *   logger.debug('Inside request'); // Includes requestId
 *   asyncOperation();
 * });
 *
 * All logs within context automatically include contextual data
 */

/**
 * CHALLENGE 4: Log Filtering
 * Add dynamic filtering:
 *
 * logger.addFilter((message) => {
 *   return !message.includes('sensitive');
 * });
 *
 * Filter logs based on content, preventing leaks
 */

/**
 * CHALLENGE 5: Performance Budgets
 * Track and warn on expensive logging:
 *
 * logger.maxDuration(100); // Warn if logging takes > 100ms
 * logger.debug(() => {
 *   return expensiveOperation(); // Timed automatically
 * });
 */
