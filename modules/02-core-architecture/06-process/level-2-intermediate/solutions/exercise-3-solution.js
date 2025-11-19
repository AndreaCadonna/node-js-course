/**
 * SOLUTION: Exercise 3 - Error Recovery System
 * ==============================================
 *
 * This solution demonstrates production-grade error handling with classification,
 * recovery strategies, rate limiting, and graceful shutdown. It handles both
 * uncaught exceptions and unhandled promise rejections.
 *
 * KEY CONCEPTS DEMONSTRATED:
 * - uncaughtException and unhandledRejection handlers
 * - Error classification (recoverable vs fatal)
 * - Recovery strategy patterns
 * - Error rate limiting to prevent crash loops
 * - Comprehensive error logging
 * - Alert system for critical errors
 * - Graceful shutdown on fatal errors
 *
 * PRODUCTION FEATURES:
 * - Error classification by type and code
 * - Multiple recovery strategies
 * - Rate limiting with automatic reset
 * - File-based error logging
 * - Alert notifications
 * - Detailed error context
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  maxErrorsPerMinute: 5,         // Max errors before forced shutdown
  errorResetInterval: 60000,     // Reset error count after 1 minute
  logFile: path.join(__dirname, 'error.log'),
  shutdownDelay: 1000           // Delay before shutdown (cleanup time)
};

// ============================================================================
// State Management
// ============================================================================

let errorCount = 0;
let errorResetTimer = null;
let isShuttingDown = false;

// ============================================================================
// Error Logging
// ============================================================================

/**
 * Logs error to console and file with full context
 *
 * @param {string} errorType - Type of error (UNCAUGHT_EXCEPTION, UNHANDLED_REJECTION)
 * @param {Error} error - The error object
 * @param {Object} context - Additional context (recoverable, strategy, etc.)
 */
function logError(errorType, error, context = {}) {
  const timestamp = new Date().toISOString();
  const message = error.message || String(error);
  const stack = error.stack || 'No stack trace available';

  // Format log entry
  const logEntry = `
[$timestamp}] ${errorType}
Message: ${message}
Code: ${error.code || 'N/A'}
Stack: ${stack}
Context: ${JSON.stringify(context, null, 2)}
Process: PID=${process.pid}, Uptime=${process.uptime().toFixed(2)}s
${'─'.repeat(60)}
`;

  // Log to console
  console.error(`\n🔴 ${errorType}: ${message}`);
  console.error(`   Code: ${error.code || 'N/A'}`);
  if (context.recoverable !== undefined) {
    console.error(`   Recoverable: ${context.recoverable ? '✅ Yes' : '❌ No'}`);
  }
  if (context.strategy) {
    console.error(`   Strategy: ${context.strategy}`);
  }

  // Write to log file
  try {
    fs.appendFileSync(CONFIG.logFile, logEntry, 'utf8');
    console.error(`   📝 Logged to: ${CONFIG.logFile}`);
  } catch (err) {
    console.error(`   ❌ Failed to write to log file: ${err.message}`);
  }
}

// ============================================================================
// Error Classification
// ============================================================================

/**
 * Classifies errors into recoverable and fatal categories
 *
 * Recoverable errors:
 * - Network timeouts (ETIMEDOUT, ECONNREFUSED, ECONNRESET)
 * - Temporary file access issues (ENOENT, EACCES)
 * - Parse errors (SyntaxError for data)
 * - Resource not found (404-style errors)
 *
 * Fatal errors:
 * - Out of memory (heap exhausted)
 * - Stack overflow
 * - Core system failures
 * - Critical runtime errors
 *
 * @param {Error} error - The error to classify
 * @returns {Object} Classification with recoverable flag and strategy
 */
function classifyError(error) {
  const message = error.message || String(error);
  const code = error.code;

  // Network errors - usually recoverable
  if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'ECONNRESET') {
    return {
      recoverable: true,
      strategy: 'retry',
      reason: 'Network error - can retry operation'
    };
  }

  // File system errors - often recoverable
  if (code === 'ENOENT') {
    return {
      recoverable: true,
      strategy: 'skip',
      reason: 'File not found - can skip operation'
    };
  }

  if (code === 'EACCES') {
    return {
      recoverable: true,
      strategy: 'skip',
      reason: 'Permission denied - can skip operation'
    };
  }

  // Memory errors - fatal
  if (message.includes('heap out of memory') ||
      message.includes('FATAL ERROR') ||
      message.includes('allocation failed')) {
    return {
      recoverable: false,
      strategy: 'shutdown',
      reason: 'Out of memory - must restart'
    };
  }

  // Stack overflow - fatal
  if (message.includes('Maximum call stack') ||
      message.includes('stack overflow')) {
    return {
      recoverable: false,
      strategy: 'shutdown',
      reason: 'Stack overflow - must restart'
    };
  }

  // Database connection errors - potentially fatal after retries
  if (message.includes('database') || message.includes('connection pool')) {
    return {
      recoverable: true,
      strategy: 'retry',
      reason: 'Database error - can retry'
    };
  }

  // Default to recoverable with logging
  return {
    recoverable: true,
    strategy: 'log',
    reason: 'Unknown error - logging and continuing'
  };
}

// ============================================================================
// Recovery Strategies
// ============================================================================

/**
 * Attempts to recover from error based on classification
 *
 * Strategies:
 * - retry: Log error, allow operation to be retried
 * - skip: Log error, skip the failed operation
 * - log: Just log the error and continue
 * - shutdown: Log error and initiate graceful shutdown
 *
 * @param {Error} error - The error object
 * @param {Object} classification - Error classification with strategy
 * @returns {boolean} True if recovered, false if shutdown needed
 */
function attemptRecovery(error, classification) {
  const { strategy, reason } = classification;

  console.log(`\n♻️  Recovery Strategy: ${strategy.toUpperCase()}`);
  console.log(`   Reason: ${reason}`);

  switch (strategy) {
    case 'retry':
      console.log('   → Error logged, operation can be retried');
      console.log('   → Application continues normally');
      return true;

    case 'skip':
      console.log('   → Error logged, operation skipped');
      console.log('   → Application continues without failed operation');
      return true;

    case 'log':
      console.log('   → Error logged, continuing execution');
      console.log('   → Monitor for recurring issues');
      return true;

    case 'shutdown':
      console.log('   → Fatal error detected');
      console.log('   → Initiating graceful shutdown...');
      return false;

    default:
      console.log('   → Unknown strategy, defaulting to log');
      return true;
  }
}

// ============================================================================
// Error Rate Limiting
// ============================================================================

/**
 * Tracks error frequency to prevent crash loops
 *
 * If too many errors occur in a short time, force shutdown:
 * - Prevents infinite error loops
 * - Protects system resources
 * - Requires manual intervention
 *
 * @returns {boolean} True if error rate is acceptable, false if exceeded
 */
function checkErrorRate() {
  errorCount++;

  console.log(`\n📊 Error Count: ${errorCount} (last ${CONFIG.errorResetInterval / 1000}s)`);

  // Check if error rate exceeded
  if (errorCount >= CONFIG.maxErrorsPerMinute) {
    console.error(`\n${'⚠️ '.repeat(30)}`);
    console.error('⚠️  ERROR RATE EXCEEDED');
    console.error('⚠️ '.repeat(30));
    console.error(`   Errors: ${errorCount} in ${CONFIG.errorResetInterval / 1000}s`);
    console.error(`   Threshold: ${CONFIG.maxErrorsPerMinute}`);
    console.error(`   Action: Forcing shutdown to prevent crash loop`);
    console.error('⚠️ '.repeat(30));
    return false;
  }

  // Set up reset timer (only once)
  if (!errorResetTimer) {
    errorResetTimer = setTimeout(() => {
      console.log(`\n📊 Error count reset (was ${errorCount})`);
      errorCount = 0;
      errorResetTimer = null;
    }, CONFIG.errorResetInterval);

    // Allow process to exit if needed
    errorResetTimer.unref();
  }

  return true;
}

// ============================================================================
// Alert System
// ============================================================================

/**
 * Sends alerts for critical errors
 *
 * In production, this would:
 * - Send to Sentry, DataDog, or similar monitoring service
 * - Trigger PagerDuty/OpsGenie for fatal errors
 * - Send Slack/Teams notifications
 * - Log to centralized logging service
 *
 * @param {string} errorType - Type of error
 * @param {Error} error - The error object
 * @param {Object} classification - Error classification
 */
function sendAlert(errorType, error, classification) {
  console.log('\n' + '📢'.repeat(30));
  console.log('📢 CRITICAL ERROR ALERT');
  console.log('📢'.repeat(30));
  console.log(`   Type: ${errorType}`);
  console.log(`   Message: ${error.message}`);
  console.log(`   Code: ${error.code || 'N/A'}`);
  console.log(`   Recoverable: ${classification.recoverable ? 'Yes' : 'No'}`);
  console.log(`   Strategy: ${classification.strategy}`);
  console.log(`   Reason: ${classification.reason}`);
  console.log(`   Process: PID ${process.pid}`);
  console.log(`   Uptime: ${process.uptime().toFixed(2)}s`);
  console.log('📢'.repeat(30));

  // In production: integrate with monitoring services
  // Example: Sentry.captureException(error, { tags: { type: errorType } });
  // Example: sendToSlack({ error, type: errorType, classification });
  // Example: if (!classification.recoverable) sendToPagerDuty(error);

  console.log('\n   ✅ Alert logged (production: would notify monitoring services)');
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Performs graceful shutdown
 *
 * Steps:
 * 1. Set shutting down flag
 * 2. Clear any timers
 * 3. Close open resources (databases, servers, etc.)
 * 4. Log shutdown reason and statistics
 * 5. Exit with appropriate code
 *
 * Exit codes:
 * - 0: Clean exit
 * - 1: Uncaught exception
 * - 2: Unhandled rejection
 * - 3: Error rate exceeded
 *
 * @param {string} reason - Reason for shutdown
 * @param {number} exitCode - Process exit code
 */
function gracefulShutdown(reason, exitCode = 1) {
  if (isShuttingDown) {
    console.log('⚠️  Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;

  console.log(`\n${'═'.repeat(60)}`);
  console.log('🛑 INITIATING GRACEFUL SHUTDOWN');
  console.log('═'.repeat(60));
  console.log(`Reason: ${reason}`);
  console.log(`Exit Code: ${exitCode}`);
  console.log(`Process PID: ${process.pid}`);
  console.log(`Process Uptime: ${process.uptime().toFixed(2)}s`);
  console.log(`Total Errors: ${errorCount}`);
  console.log('═'.repeat(60));

  // Clear timers
  if (errorResetTimer) {
    clearTimeout(errorResetTimer);
  }

  // Close resources
  console.log('\n📋 Cleanup Tasks:');
  console.log('   ✅ Timers cleared');
  console.log('   ✅ Error logs flushed');

  // In production: close databases, servers, etc.
  // Example: await database.close();
  // Example: await server.close();
  // Example: await redis.quit();

  console.log('\n📝 Shutdown Summary:');
  console.log(`   Start Time: ${new Date(Date.now() - process.uptime() * 1000).toISOString()}`);
  console.log(`   End Time: ${new Date().toISOString()}`);
  console.log(`   Duration: ${process.uptime().toFixed(2)}s`);
  console.log(`   Error Log: ${CONFIG.logFile}`);

  // Delay shutdown to allow cleanup
  setTimeout(() => {
    console.log('\n👋 Process exiting...\n');
    process.exit(exitCode);
  }, CONFIG.shutdownDelay);
}

// ============================================================================
// Error Handlers
// ============================================================================

/**
 * Handles uncaught exceptions
 *
 * Process:
 * 1. Log error with full context
 * 2. Classify error (recoverable vs fatal)
 * 3. Check error rate
 * 4. Send alert
 * 5. Attempt recovery or shutdown
 *
 * @param {Error} error - The uncaught exception
 */
function handleUncaughtException(error) {
  console.log('\n' + '═'.repeat(60));
  console.log('⚠️  UNCAUGHT EXCEPTION DETECTED');
  console.log('═'.repeat(60));

  // Log error
  const classification = classifyError(error);
  logError('UNCAUGHT_EXCEPTION', error, {
    recoverable: classification.recoverable,
    strategy: classification.strategy,
    reason: classification.reason
  });

  // Display classification
  console.log(`\n🔍 Error Classification:`);
  console.log(`   Recoverable: ${classification.recoverable}`);
  console.log(`   Strategy: ${classification.strategy}`);
  console.log(`   Reason: ${classification.reason}`);

  // Check error rate
  const rateOk = checkErrorRate();
  if (!rateOk) {
    gracefulShutdown('Error rate exceeded', 3);
    return;
  }

  // Send alert
  sendAlert('UNCAUGHT_EXCEPTION', error, classification);

  // Attempt recovery
  const recovered = attemptRecovery(error, classification);
  if (!recovered) {
    gracefulShutdown('Fatal uncaught exception', 1);
  } else {
    console.log('\n✅ Recovery successful - process continuing\n');
  }
}

/**
 * Handles unhandled promise rejections
 *
 * Process is similar to uncaught exceptions:
 * 1. Convert reason to Error if needed
 * 2. Log, classify, check rate
 * 3. Send alert
 * 4. Attempt recovery or shutdown
 *
 * @param {any} reason - The rejection reason
 * @param {Promise} promise - The promise that was rejected
 */
function handleUnhandledRejection(reason, promise) {
  console.log('\n' + '═'.repeat(60));
  console.log('⚠️  UNHANDLED PROMISE REJECTION');
  console.log('═'.repeat(60));

  // Convert reason to Error if it isn't one
  const error = reason instanceof Error ? reason : new Error(String(reason));

  // Log error
  const classification = classifyError(error);
  logError('UNHANDLED_REJECTION', error, {
    recoverable: classification.recoverable,
    strategy: classification.strategy,
    reason: classification.reason,
    promise: 'Promise object (not serializable)'
  });

  // Display classification
  console.log(`\n🔍 Error Classification:`);
  console.log(`   Recoverable: ${classification.recoverable}`);
  console.log(`   Strategy: ${classification.strategy}`);
  console.log(`   Reason: ${classification.reason}`);

  // Check error rate
  const rateOk = checkErrorRate();
  if (!rateOk) {
    gracefulShutdown('Error rate exceeded', 3);
    return;
  }

  // Send alert
  sendAlert('UNHANDLED_REJECTION', error, classification);

  // Attempt recovery
  const recovered = attemptRecovery(error, classification);
  if (!recovered) {
    gracefulShutdown('Fatal unhandled rejection', 2);
  } else {
    console.log('\n✅ Recovery successful - process continuing\n');
  }
}

// ============================================================================
// Setup
// ============================================================================

/**
 * Sets up all error handlers
 */
function setupErrorHandlers() {
  console.log('🛡️  Setting up error recovery system...\n');

  // Handle uncaught exceptions
  process.on('uncaughtException', handleUncaughtException);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', handleUnhandledRejection);

  // Handle clean exits (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Received SIGINT (Ctrl+C)');
    gracefulShutdown('User interrupt', 0);
  });

  console.log('✅ Error handlers registered');
  console.log(`📝 Errors will be logged to: ${CONFIG.logFile}`);
  console.log(`⚡ Max errors per minute: ${CONFIG.maxErrorsPerMinute}`);
  console.log(`⏱️  Error count reset interval: ${CONFIG.errorResetInterval / 1000}s\n`);
}

// ============================================================================
// Test Scenarios
// ============================================================================

/**
 * Runs test scenarios to demonstrate error recovery
 */
function runTests() {
  console.log('🧪 Running Error Recovery Tests\n');
  console.log('This will trigger various errors to test recovery\n');

  // Test 1: Recoverable network error
  setTimeout(() => {
    console.log('\n📌 TEST 1: Network timeout error (recoverable)');
    const error = new Error('Network timeout');
    error.code = 'ETIMEDOUT';
    throw error;
  }, 2000);

  // Test 2: Recoverable file error
  setTimeout(() => {
    console.log('\n📌 TEST 2: File not found error (recoverable)');
    const error = new Error('File not found');
    error.code = 'ENOENT';
    throw error;
  }, 4000);

  // Test 3: Unhandled promise rejection
  setTimeout(() => {
    console.log('\n📌 TEST 3: Unhandled promise rejection');
    Promise.reject(new Error('Database connection failed'));
  }, 6000);

  // Test 4: Multiple rapid errors
  setTimeout(() => {
    console.log('\n📌 TEST 4: Multiple rapid errors (rate limiting)');
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const error = new Error(`Rapid error ${i + 1}`);
        error.code = 'ECONNREFUSED';
        throw error;
      }, i * 500);
    }
  }, 8000);

  // Test 5: Fatal error (triggers shutdown)
  setTimeout(() => {
    console.log('\n📌 TEST 5: Fatal error (should trigger shutdown)');
    const error = new Error('FATAL ERROR: Heap out of memory');
    throw error;
  }, 12000);
}

// ============================================================================
// Main
// ============================================================================

function main() {
  console.log('═'.repeat(60));
  console.log('ERROR RECOVERY SYSTEM');
  console.log('═'.repeat(60));
  console.log();

  // Set up error handlers
  setupErrorHandlers();

  // Run tests
  runTests();

  console.log('💡 System is running. Error handlers are active.');
  console.log('🛑 Press Ctrl+C to exit gracefully\n');

  // Keep process running
  setInterval(() => {
    // Heartbeat
  }, 10000);
}

// Start the system
main();

/**
 * LEARNING NOTES:
 *
 * 1. Always set up error handlers early in application lifecycle
 * 2. Classify errors to determine appropriate response
 * 3. Implement rate limiting to prevent crash loops
 * 4. Log errors with full context for debugging
 * 5. Use graceful shutdown for fatal errors
 * 6. Test error scenarios in development
 * 7. Integrate with monitoring services in production
 */
