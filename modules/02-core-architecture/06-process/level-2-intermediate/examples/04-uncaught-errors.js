/**
 * 04-uncaught-errors.js
 *
 * Handling Uncaught Exceptions and Unhandled Rejections
 *
 * This example demonstrates production-ready error handling patterns including:
 * - uncaughtException handling
 * - unhandledRejection handling
 * - Error recovery strategies
 * - Safe shutdown after errors
 * - Error logging and reporting
 * - Stack trace preservation
 * - Domain error isolation (legacy)
 * - Modern error boundaries
 *
 * Critical Concepts:
 * - Uncaught exceptions leave the application in an undefined state
 * - After uncaught exception, process should gracefully shutdown
 * - Unhandled rejections indicate programming errors
 * - Always log errors before exiting
 * - Use monitoring to track error frequency
 *
 * Best Practices:
 * - Log error details comprehensively
 * - Notify monitoring systems
 * - Attempt graceful shutdown
 * - Force exit after timeout
 * - Use process managers for restart
 *
 * @module uncaught-errors
 * @level intermediate
 */

'use strict';

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

// =============================================================================
// 1. Basic Uncaught Exception Handling
// =============================================================================

console.log('\n=== 1. Basic Uncaught Exception Handling ===\n');

// Store original listeners
const originalUncaughtHandlers = process.listeners('uncaughtException');
const originalRejectionHandlers = process.listeners('unhandledRejection');

// Remove default handlers for demonstration
process.removeAllListeners('uncaughtException');
process.removeAllListeners('unhandledRejection');

class UncaughtExceptionHandler {
  constructor() {
    this.errors = [];
    this.setupHandlers();
  }

  /**
   * Setup uncaught exception handler
   */
  setupHandlers() {
    process.on('uncaughtException', (error, origin) => {
      this.handleUncaughtException(error, origin);
    });

    console.log('[UncaughtHandler] Uncaught exception handler installed');
  }

  /**
   * Handle uncaught exception
   */
  handleUncaughtException(error, origin) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      type: 'uncaughtException',
      origin,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    };

    this.errors.push(errorInfo);

    console.error('\n═══════════════════════════════════════════════');
    console.error('UNCAUGHT EXCEPTION');
    console.error('═══════════════════════════════════════════════');
    console.error(`Time: ${errorInfo.timestamp}`);
    console.error(`Origin: ${origin}`);
    console.error(`Error: ${error.name}: ${error.message}`);
    console.error('\nStack Trace:');
    console.error(error.stack);
    console.error('═══════════════════════════════════════════════\n');

    // Log to file
    this.logToFile(errorInfo);

    console.error('[UncaughtHandler] Application state is now unreliable');
    console.error('[UncaughtHandler] Initiating graceful shutdown...');

    // In production, attempt graceful shutdown
    // For this demo, we continue to show other examples
    console.error('[UncaughtHandler] (Demo mode: continuing execution)\n');
  }

  /**
   * Log error to file
   */
  logToFile(errorInfo) {
    try {
      const logPath = path.join('/tmp', 'uncaught-errors.log');
      const logEntry = JSON.stringify(errorInfo, null, 2) + '\n\n';

      fs.appendFileSync(logPath, logEntry);
      console.error(`[UncaughtHandler] Error logged to: ${logPath}`);
    } catch (err) {
      console.error('[UncaughtHandler] Failed to log error to file:', err.message);
    }
  }

  /**
   * Get error history
   */
  getErrors() {
    return this.errors;
  }
}

const uncaughtHandler = new UncaughtExceptionHandler();

// Example: Trigger uncaught exception (commented out to not crash)
// setTimeout(() => {
//   throw new Error('This is an uncaught exception');
// }, 1000);

console.log('[Demo] Uncaught exception handler ready');
console.log('[Demo] (Uncomment code to trigger uncaught exception)\n');

// =============================================================================
// 2. Unhandled Promise Rejection Handling
// =============================================================================

console.log('\n=== 2. Unhandled Promise Rejection Handling ===\n');

class UnhandledRejectionHandler {
  constructor() {
    this.rejections = new Map();
    this.setupHandlers();
  }

  /**
   * Setup rejection handlers
   */
  setupHandlers() {
    process.on('unhandledRejection', (reason, promise) => {
      this.handleUnhandledRejection(reason, promise);
    });

    process.on('rejectionHandled', (promise) => {
      this.handleRejectionHandled(promise);
    });

    console.log('[RejectionHandler] Unhandled rejection handlers installed');
  }

  /**
   * Handle unhandled promise rejection
   */
  handleUnhandledRejection(reason, promise) {
    const rejectionInfo = {
      timestamp: new Date().toISOString(),
      type: 'unhandledRejection',
      reason: this.formatReason(reason),
      process: {
        pid: process.pid,
        uptime: process.uptime()
      }
    };

    // Store for potential late handling
    this.rejections.set(promise, rejectionInfo);

    console.error('\n───────────────────────────────────────────────');
    console.error('UNHANDLED PROMISE REJECTION');
    console.error('───────────────────────────────────────────────');
    console.error(`Time: ${rejectionInfo.timestamp}`);
    console.error(`Reason: ${rejectionInfo.reason.message}`);

    if (rejectionInfo.reason.stack) {
      console.error('\nStack Trace:');
      console.error(rejectionInfo.reason.stack);
    }

    console.error('───────────────────────────────────────────────\n');

    console.error('[RejectionHandler] This indicates a programming error');
    console.error('[RejectionHandler] Promises should always have .catch() handlers');
    console.error('[RejectionHandler] (Demo mode: continuing execution)\n');

    // Log to file
    this.logToFile(rejectionInfo);
  }

  /**
   * Handle late promise rejection handling
   */
  handleRejectionHandled(promise) {
    const rejectionInfo = this.rejections.get(promise);

    if (rejectionInfo) {
      console.log('\n[RejectionHandler] Promise rejection was handled (late)');
      console.log(`[RejectionHandler] Original rejection at: ${rejectionInfo.timestamp}`);
      console.log('[RejectionHandler] This is acceptable but indicates delayed error handling\n');

      this.rejections.delete(promise);
    }
  }

  /**
   * Format rejection reason
   */
  formatReason(reason) {
    if (reason instanceof Error) {
      return {
        name: reason.name,
        message: reason.message,
        stack: reason.stack
      };
    }

    return {
      type: typeof reason,
      message: String(reason),
      value: reason
    };
  }

  /**
   * Log rejection to file
   */
  logToFile(rejectionInfo) {
    try {
      const logPath = path.join('/tmp', 'unhandled-rejections.log');
      const logEntry = JSON.stringify(rejectionInfo, null, 2) + '\n\n';

      fs.appendFileSync(logPath, logEntry);
      console.error(`[RejectionHandler] Rejection logged to: ${logPath}`);
    } catch (err) {
      console.error('[RejectionHandler] Failed to log rejection:', err.message);
    }
  }

  /**
   * Get active rejections
   */
  getActiveRejections() {
    return Array.from(this.rejections.values());
  }
}

const rejectionHandler = new UnhandledRejectionHandler();

// Example: Trigger unhandled rejection (safe for demo)
setTimeout(() => {
  Promise.reject(new Error('This is an unhandled rejection (demo)'))
    .catch(err => {
      console.log('[Demo] Caught the rejection for safety');
    });
}, 2000);

console.log('[Demo] Unhandled rejection handler ready\n');

// =============================================================================
// 3. Graceful Shutdown After Error
// =============================================================================

console.log('\n=== 3. Graceful Shutdown After Error ===\n');

class ErrorShutdownManager {
  constructor() {
    this.shutdownInProgress = false;
    this.shutdownTimeout = 10000;
    this.forceExitTimeout = 5000;
    this.cleanupTasks = [];
  }

  /**
   * Register cleanup task
   */
  registerCleanup(name, task) {
    this.cleanupTasks.push({ name, task });
    console.log(`[ErrorShutdown] Registered cleanup task: ${name}`);
  }

  /**
   * Handle error and initiate shutdown
   */
  async handleErrorAndShutdown(error, errorType) {
    if (this.shutdownInProgress) {
      console.error('[ErrorShutdown] Shutdown already in progress, forcing exit');
      process.exit(1);
    }

    this.shutdownInProgress = true;

    console.error('\n╔═══════════════════════════════════════════════╗');
    console.error('║  FATAL ERROR - INITIATING SHUTDOWN            ║');
    console.error('╚═══════════════════════════════════════════════╝\n');

    console.error(`Error Type: ${errorType}`);
    console.error(`Error: ${error.message}\n`);

    // Set force exit timeout
    const forceTimer = setTimeout(() => {
      console.error('[ErrorShutdown] Force exit timeout reached');
      process.exit(1);
    }, this.shutdownTimeout + this.forceExitTimeout);

    forceTimer.unref();

    try {
      // Execute cleanup tasks
      console.error('[ErrorShutdown] Executing cleanup tasks...\n');

      for (const { name, task } of this.cleanupTasks) {
        try {
          console.error(`[ErrorShutdown] Running: ${name}`);
          await this.runWithTimeout(task, this.shutdownTimeout / this.cleanupTasks.length);
          console.error(`[ErrorShutdown] ✓ ${name} completed`);
        } catch (err) {
          console.error(`[ErrorShutdown] ✗ ${name} failed: ${err.message}`);
        }
      }

      console.error('\n[ErrorShutdown] Cleanup completed');
      clearTimeout(forceTimer);
      process.exit(1);
    } catch (err) {
      console.error('[ErrorShutdown] Cleanup failed:', err.message);
      clearTimeout(forceTimer);
      process.exit(1);
    }
  }

  /**
   * Run task with timeout
   */
  runWithTimeout(task, timeout) {
    return Promise.race([
      task(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Task timeout')), timeout)
      )
    ]);
  }
}

const shutdownManager = new ErrorShutdownManager();

// Register cleanup tasks
shutdownManager.registerCleanup('close-connections', async () => {
  console.error('  • Closing active connections...');
  await new Promise(resolve => setTimeout(resolve, 500));
});

shutdownManager.registerCleanup('flush-logs', async () => {
  console.error('  • Flushing log buffers...');
  await new Promise(resolve => setTimeout(resolve, 300));
});

shutdownManager.registerCleanup('notify-monitoring', async () => {
  console.error('  • Notifying monitoring systems...');
  await new Promise(resolve => setTimeout(resolve, 200));
});

console.log('[ErrorShutdown] Shutdown manager configured\n');

// =============================================================================
// 4. Error Context Preservation
// =============================================================================

console.log('\n=== 4. Error Context Preservation ===\n');

class ErrorContextCollector {
  constructor() {
    this.context = {
      application: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        startTime: new Date().toISOString()
      },
      process: {},
      system: {}
    };
  }

  /**
   * Collect comprehensive error context
   */
  collectContext(error) {
    const context = {
      ...this.context,
      timestamp: new Date().toISOString(),
      error: this.serializeError(error),
      process: {
        pid: process.pid,
        ppid: process.ppid,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime(),
        cwd: process.cwd(),
        execPath: process.execPath,
        argv: process.argv,
        env: this.filterEnv(process.env),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      system: {
        hostname: require('os').hostname(),
        type: require('os').type(),
        release: require('os').release(),
        cpus: require('os').cpus().length,
        totalmem: require('os').totalmem(),
        freemem: require('os').freemem(),
        loadavg: require('os').loadavg()
      }
    };

    return context;
  }

  /**
   * Serialize error with all properties
   */
  serializeError(error) {
    if (!(error instanceof Error)) {
      return {
        type: typeof error,
        value: String(error)
      };
    }

    const serialized = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };

    // Include custom properties
    for (const key of Object.keys(error)) {
      if (!serialized[key]) {
        serialized[key] = error[key];
      }
    }

    return serialized;
  }

  /**
   * Filter sensitive environment variables
   */
  filterEnv(env) {
    const filtered = {};
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'api'];

    for (const [key, value] of Object.entries(env)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(s => lowerKey.includes(s));

      filtered[key] = isSensitive ? '[REDACTED]' : value;
    }

    return filtered;
  }

  /**
   * Create error report
   */
  createReport(error, errorType) {
    const context = this.collectContext(error);

    return {
      ...context,
      errorType,
      report: {
        severity: 'fatal',
        category: errorType,
        timestamp: new Date().toISOString()
      }
    };
  }
}

const contextCollector = new ErrorContextCollector();

// Example error report
const exampleError = new Error('Example error for context collection');
const report = contextCollector.createReport(exampleError, 'example');

console.log('[ErrorContext] Example error report:');
console.log(JSON.stringify(report, null, 2));
console.log();

// =============================================================================
// 5. Production Error Handler
// =============================================================================

console.log('\n=== 5. Production Error Handler ===\n');

class ProductionErrorHandler extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      exitOnUncaughtException: true,
      exitOnUnhandledRejection: false,
      logToFile: true,
      logPath: '/tmp/errors',
      shutdownTimeout: 10000,
      ...options
    };

    this.contextCollector = new ErrorContextCollector();
    this.shutdownManager = new ErrorShutdownManager();
    this.errorCount = {
      uncaughtException: 0,
      unhandledRejection: 0
    };
  }

  /**
   * Initialize error handlers
   */
  initialize() {
    console.log('[ProductionError] Initializing production error handlers');
    console.log('[ProductionError] Configuration:', JSON.stringify(this.options, null, 2));

    // Setup uncaught exception handler
    process.on('uncaughtException', (error, origin) => {
      this.handleUncaughtException(error, origin);
    });

    // Setup unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      this.handleUnhandledRejection(reason, promise);
    });

    // Setup rejection handled
    process.on('rejectionHandled', (promise) => {
      console.log('[ProductionError] Late promise rejection handling detected');
    });

    console.log('[ProductionError] Error handlers initialized\n');
  }

  /**
   * Handle uncaught exception
   */
  async handleUncaughtException(error, origin) {
    this.errorCount.uncaughtException++;

    console.error('\n' + '═'.repeat(60));
    console.error('UNCAUGHT EXCEPTION - FATAL ERROR');
    console.error('═'.repeat(60));

    // Collect context
    const report = this.contextCollector.createReport(error, 'uncaughtException');
    report.origin = origin;
    report.errorCount = this.errorCount;

    // Log error
    this.logError(report);

    // Emit error event
    this.emit('error', report);

    // Notify external systems
    await this.notifyExternalSystems(report);

    if (this.options.exitOnUncaughtException) {
      console.error('[ProductionError] Initiating shutdown due to uncaught exception');
      await this.shutdownManager.handleErrorAndShutdown(error, 'uncaughtException');
    } else {
      console.error('[ProductionError] Continuing execution (not recommended)');
      console.error('═'.repeat(60) + '\n');
    }
  }

  /**
   * Handle unhandled rejection
   */
  async handleUnhandledRejection(reason, promise) {
    this.errorCount.unhandledRejection++;

    console.error('\n' + '─'.repeat(60));
    console.error('UNHANDLED PROMISE REJECTION');
    console.error('─'.repeat(60));

    // Convert reason to error
    const error = reason instanceof Error ? reason : new Error(String(reason));

    // Collect context
    const report = this.contextCollector.createReport(error, 'unhandledRejection');
    report.promise = String(promise);
    report.errorCount = this.errorCount;

    // Log error
    this.logError(report);

    // Emit error event
    this.emit('error', report);

    // Notify external systems
    await this.notifyExternalSystems(report);

    if (this.options.exitOnUnhandledRejection) {
      console.error('[ProductionError] Initiating shutdown due to unhandled rejection');
      await this.shutdownManager.handleErrorAndShutdown(error, 'unhandledRejection');
    } else {
      console.error('[ProductionError] Continuing execution');
      console.error('─'.repeat(60) + '\n');
    }
  }

  /**
   * Log error to file and console
   */
  logError(report) {
    // Console output
    console.error(`Time: ${report.timestamp}`);
    console.error(`Type: ${report.errorType}`);
    console.error(`Error: ${report.error.name}: ${report.error.message}`);
    console.error('\nStack Trace:');
    console.error(report.error.stack);

    if (this.options.logToFile) {
      try {
        const filename = `error-${Date.now()}.json`;
        const filepath = path.join(this.options.logPath, filename);

        // Ensure directory exists
        if (!fs.existsSync(this.options.logPath)) {
          fs.mkdirSync(this.options.logPath, { recursive: true });
        }

        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        console.error(`\n[ProductionError] Error report saved: ${filepath}`);
      } catch (err) {
        console.error('[ProductionError] Failed to save error report:', err.message);
      }
    }
  }

  /**
   * Notify external monitoring systems
   */
  async notifyExternalSystems(report) {
    console.error('[ProductionError] Notifying external systems...');

    // In production, send to:
    // - Error tracking (Sentry, Rollbar, etc.)
    // - Logging services (CloudWatch, Stackdriver, etc.)
    // - Alerting (PagerDuty, Opsgenie, etc.)

    try {
      // Simulate notification
      await new Promise(resolve => setTimeout(resolve, 100));
      console.error('[ProductionError] External systems notified');
    } catch (err) {
      console.error('[ProductionError] Failed to notify external systems:', err.message);
    }
  }

  /**
   * Get error statistics
   */
  getStats() {
    return {
      ...this.errorCount,
      total: this.errorCount.uncaughtException + this.errorCount.unhandledRejection
    };
  }
}

const productionHandler = new ProductionErrorHandler({
  exitOnUncaughtException: false, // Keep running for demo
  exitOnUnhandledRejection: false,
  logToFile: true,
  logPath: '/tmp/node-errors'
});

productionHandler.initialize();

// Listen for errors
productionHandler.on('error', (report) => {
  console.log('[ErrorListener] Error event received:', report.errorType);
});

// =============================================================================
// Summary and Best Practices
// =============================================================================

console.log('\n=== Error Handling Best Practices ===\n');

console.log(`
Uncaught Error Handling Guidelines:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Uncaught Exceptions:
   • ALWAYS handle with process.on('uncaughtException')
   • Log comprehensive error context
   • Exit process after logging (state is undefined)
   • Use process manager (PM2, systemd) for restart
   • Never continue execution in production

2. Unhandled Rejections:
   • ALWAYS handle with process.on('unhandledRejection')
   • Indicates missing .catch() handlers
   • Consider exiting (will be default in future Node.js)
   • Fix by adding proper error handling
   • Use --unhandled-rejections=strict flag

3. Error Context:
   • Timestamp and error details
   • Process information (PID, uptime, memory)
   • System information (hostname, OS)
   • Environment (filtered for secrets)
   • Stack traces (full, not truncated)

4. Logging Strategy:
   • Write to stderr immediately
   • Save to persistent storage
   • Include structured data (JSON)
   • Rotate log files
   • Set appropriate retention

5. Notification:
   • Alert monitoring systems
   • Send to error tracking services
   • Page on-call engineers
   • Include error frequency
   • Provide actionable context

6. Graceful Shutdown:
   • Stop accepting new work
   • Complete in-flight operations
   • Close connections properly
   • Flush buffers
   • Exit with non-zero code

7. Shutdown Timeouts:
   • Graceful timeout: 10-30 seconds
   • Force exit: 5 seconds after graceful
   • Per-task timeouts
   • Always force exit eventually

8. Process Management:
   • Use PM2, systemd, or similar
   • Configure max restarts
   • Implement backoff strategy
   • Monitor restart frequency
   • Alert on crash loops

9. Prevention:
   • Use try/catch in async functions
   • Always add .catch() to promises
   • Use async/await with try/catch
   • Validate inputs
   • Handle all error cases

10. Testing:
    • Test error scenarios
    • Verify logging works
    • Check shutdown behavior
    • Test monitoring integration
    • Simulate failures

Error Statistics:
─────────────────
${JSON.stringify(productionHandler.getStats(), null, 2)}

Configuration:
──────────────
Exit on uncaught exception: ${productionHandler.options.exitOnUncaughtException}
Exit on unhandled rejection: ${productionHandler.options.exitOnUnhandledRejection}
Log to file: ${productionHandler.options.logToFile}
Log path: ${productionHandler.options.logPath}

Try triggering errors to see the handlers in action.
In production, configure to exit on errors and use a process manager.
`);

console.log('\nError handlers active. Process will log any uncaught errors.\n');

// Keep process alive
setInterval(() => {
  // Keep alive
}, 5000);
