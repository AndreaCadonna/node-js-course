/**
 * Exercise 3: Error Recovery System
 * ==================================
 *
 * Difficulty: Hard
 *
 * Task:
 * Create a robust error handling and recovery system that catches uncaught
 * exceptions and unhandled promise rejections, attempts recovery strategies,
 * and logs errors before gracefully shutting down if recovery fails.
 *
 * Requirements:
 * 1. Handle uncaughtException events
 * 2. Handle unhandledRejection events
 * 3. Implement error classification (recoverable vs fatal)
 * 4. Implement recovery strategies for different error types
 * 5. Track error frequency and prevent crash loops
 * 6. Log errors with full context
 * 7. Gracefully shutdown on fatal errors
 * 8. Send notifications/alerts for critical errors
 *
 * Learning Goals:
 * - Understanding uncaughtException and unhandledRejection
 * - Implementing error recovery patterns
 * - Differentiating between recoverable and fatal errors
 * - Using process.exit() with appropriate exit codes
 * - Preventing crash loops with error tracking
 * - Proper error logging and reporting
 *
 * Run: node exercise-3.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  maxErrorsPerMinute: 5,        // Max errors before forced shutdown
  errorResetInterval: 60000,    // Reset error count after 1 minute
  logFile: path.join(__dirname, 'error.log'),
  shutdownDelay: 1000          // Delay before shutdown (cleanup time)
};

// State
let errorCount = 0;
let errorResetTimer;
let isShuttingDown = false;

/**
 * TODO 1: Implement error logger
 *
 * Steps:
 * 1. Format error with timestamp, type, message, and stack
 * 2. Log to console with colors/formatting
 * 3. Append to log file (create if doesn't exist)
 * 4. Handle file write errors gracefully
 *
 * Log format:
 * [TIMESTAMP] ERROR_TYPE: message
 * Stack: ...
 * Context: ...
 * ───────────────────────────────────────
 */
function logError(errorType, error, context = {}) {
  const timestamp = new Date().toISOString();
  const message = error.message || String(error);
  const stack = error.stack || 'No stack trace available';

  // TODO: Format log entry
  // const logEntry = `
  // [${timestamp}] ${errorType}
  // Message: ${message}
  // Stack: ${stack}
  // Context: ${JSON.stringify(context, null, 2)}
  // ${'─'.repeat(60)}
  // `;

  // TODO: Log to console
  // console.error(`\n🔴 ${errorType}: ${message}`);
  // if (context.recoverable !== undefined) {
  //   console.error(`   Recoverable: ${context.recoverable ? '✅ Yes' : '❌ No'}`);
  // }

  // TODO: Write to log file
  // try {
  //   fs.appendFileSync(CONFIG.logFile, logEntry, 'utf8');
  // } catch (err) {
  //   console.error('❌ Failed to write to log file:', err.message);
  // }
}

/**
 * TODO 2: Implement error classification
 *
 * Classify errors into recoverable and fatal categories:
 *
 * Recoverable errors:
 * - Network timeouts (ETIMEDOUT, ECONNREFUSED)
 * - Temporary file access issues (ENOENT, EACCES)
 * - Parse errors (SyntaxError for data)
 * - Resource not found (404-style errors)
 *
 * Fatal errors:
 * - Out of memory (JavaScript heap out of memory)
 * - Stack overflow
 * - Core system failures
 * - Database connection failures after retries
 *
 * Return: { recoverable: boolean, strategy: string }
 */
function classifyError(error) {
  const message = error.message || String(error);
  const code = error.code;

  // TODO: Check for recoverable network errors
  // if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'ECONNRESET') {
  //   return { recoverable: true, strategy: 'retry' };
  // }

  // TODO: Check for recoverable file errors
  // if (code === 'ENOENT' || code === 'EACCES') {
  //   return { recoverable: true, strategy: 'skip' };
  // }

  // TODO: Check for fatal memory errors
  // if (message.includes('heap out of memory') || message.includes('FATAL ERROR')) {
  //   return { recoverable: false, strategy: 'shutdown' };
  // }

  // TODO: Check for fatal stack overflow
  // if (message.includes('Maximum call stack')) {
  //   return { recoverable: false, strategy: 'shutdown' };
  // }

  // TODO: Default to recoverable with logging
  // return { recoverable: true, strategy: 'log' };
}

/**
 * TODO 3: Implement recovery strategies
 *
 * Execute recovery based on strategy:
 * - 'retry': Log and continue (will retry operation)
 * - 'skip': Log and skip the operation
 * - 'log': Just log the error
 * - 'shutdown': Log and initiate graceful shutdown
 *
 * Return: boolean indicating if recovery was successful
 */
function attemptRecovery(error, classification) {
  const { strategy } = classification;

  console.log(`\n♻️  Attempting recovery with strategy: ${strategy.toUpperCase()}`);

  // TODO: Implement retry strategy
  // if (strategy === 'retry') {
  //   console.log('   → Error logged, operation can be retried');
  //   return true;
  // }

  // TODO: Implement skip strategy
  // if (strategy === 'skip') {
  //   console.log('   → Error logged, operation skipped');
  //   return true;
  // }

  // TODO: Implement log strategy
  // if (strategy === 'log') {
  //   console.log('   → Error logged, continuing execution');
  //   return true;
  // }

  // TODO: Implement shutdown strategy
  // if (strategy === 'shutdown') {
  //   console.log('   → Fatal error detected, initiating shutdown...');
  //   return false;
  // }

  // return false;
}

/**
 * TODO 4: Implement error rate limiting
 *
 * Track error frequency to prevent crash loops:
 * 1. Increment error count
 * 2. Check if exceeds threshold
 * 3. If threshold exceeded, force shutdown
 * 4. Reset counter after interval
 *
 * Return: boolean indicating if error rate is acceptable
 */
function checkErrorRate() {
  errorCount++;

  // TODO: Check if error rate exceeded
  // if (errorCount >= CONFIG.maxErrorsPerMinute) {
  //   console.error(`\n⚠️  ERROR RATE EXCEEDED: ${errorCount} errors in last minute`);
  //   console.error('   Forcing shutdown to prevent crash loop...');
  //   return false;
  // }

  // TODO: Set up reset timer (only once)
  // if (!errorResetTimer) {
  //   errorResetTimer = setTimeout(() => {
  //     console.log(`\n📊 Error count reset (was ${errorCount})`);
  //     errorCount = 0;
  //     errorResetTimer = null;
  //   }, CONFIG.errorResetInterval);
  //
  //   // Allow process to exit if needed
  //   errorResetTimer.unref();
  // }

  // return true;
}

/**
 * TODO 5: Implement notification system
 *
 * Send alerts for critical errors:
 * 1. Log alert to console
 * 2. In production: send to monitoring service (Sentry, DataDog, etc.)
 * 3. In production: send email/SMS for fatal errors
 * 4. Log notification status
 */
function sendAlert(errorType, error, classification) {
  console.log('\n📢 ALERT: Critical error detected');
  console.log(`   Type: ${errorType}`);
  console.log(`   Message: ${error.message}`);
  console.log(`   Recoverable: ${classification.recoverable ? 'Yes' : 'No'}`);
  console.log(`   Strategy: ${classification.strategy}`);

  // TODO: In production, integrate with monitoring services
  // Example: Sentry.captureException(error);
  // Example: sendEmailAlert(errorType, error);

  console.log('   ✅ Alert logged (production: would notify monitoring service)');
}

/**
 * TODO 6: Implement graceful shutdown
 *
 * Steps:
 * 1. Set shutting down flag
 * 2. Clear any timers
 * 3. Close open resources (databases, servers, etc.)
 * 4. Log shutdown reason
 * 5. Exit with appropriate code
 *
 * Exit codes:
 * - 0: Clean exit
 * - 1: Uncaught exception
 * - 2: Unhandled rejection
 * - 3: Error rate exceeded
 */
function gracefulShutdown(reason, exitCode = 1) {
  if (isShuttingDown) {
    console.log('⚠️  Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;

  console.log(`\n${'═'.repeat(60)}`);
  console.log('🛑 INITIATING GRACEFUL SHUTDOWN');
  console.log(`${'═'.repeat(60)}`);
  console.log(`Reason: ${reason}`);
  console.log(`Exit Code: ${exitCode}`);
  console.log(`Process Uptime: ${process.uptime().toFixed(2)}s`);
  console.log(`Total Errors: ${errorCount}`);

  // TODO: Clear timers
  // if (errorResetTimer) {
  //   clearTimeout(errorResetTimer);
  // }

  // TODO: Close resources (databases, servers, file handles)
  // Example: database.close();
  // Example: server.close();

  console.log('\n📋 Cleanup tasks completed');

  // TODO: Delay shutdown to allow cleanup
  // setTimeout(() => {
  //   console.log('👋 Process exiting...\n');
  //   process.exit(exitCode);
  // }, CONFIG.shutdownDelay);
}

/**
 * TODO 7: Implement uncaughtException handler
 *
 * Steps:
 * 1. Log the error
 * 2. Classify the error
 * 3. Check error rate
 * 4. Send alert
 * 5. Attempt recovery or shutdown
 */
function handleUncaughtException(error) {
  console.log('\n' + '═'.repeat(60));
  console.log('⚠️  UNCAUGHT EXCEPTION DETECTED');
  console.log('═'.repeat(60));

  // TODO: Log error
  // logError('UNCAUGHT_EXCEPTION', error);

  // TODO: Classify error
  // const classification = classifyError(error);
  // console.log(`\n🔍 Error Classification:`);
  // console.log(`   Recoverable: ${classification.recoverable}`);
  // console.log(`   Strategy: ${classification.strategy}`);

  // TODO: Check error rate
  // const rateOk = checkErrorRate();
  // if (!rateOk) {
  //   gracefulShutdown('Error rate exceeded', 3);
  //   return;
  // }

  // TODO: Send alert
  // sendAlert('UNCAUGHT_EXCEPTION', error, classification);

  // TODO: Attempt recovery
  // const recovered = attemptRecovery(error, classification);
  // if (!recovered) {
  //   gracefulShutdown('Fatal uncaught exception', 1);
  // } else {
  //   console.log('\n✅ Recovery successful - process continuing\n');
  // }
}

/**
 * TODO 8: Implement unhandledRejection handler
 *
 * Steps:
 * 1. Log the rejection
 * 2. Classify the error
 * 3. Check error rate
 * 4. Send alert
 * 5. Attempt recovery or shutdown
 *
 * Note: Promise rejections often indicate programming errors
 */
function handleUnhandledRejection(reason, promise) {
  console.log('\n' + '═'.repeat(60));
  console.log('⚠️  UNHANDLED PROMISE REJECTION');
  console.log('═'.repeat(60));

  // TODO: Convert reason to Error if it isn't one
  // const error = reason instanceof Error ? reason : new Error(String(reason));

  // TODO: Log error
  // logError('UNHANDLED_REJECTION', error, { promise: 'Promise object' });

  // TODO: Classify error
  // const classification = classifyError(error);
  // console.log(`\n🔍 Error Classification:`);
  // console.log(`   Recoverable: ${classification.recoverable}`);
  // console.log(`   Strategy: ${classification.strategy}`);

  // TODO: Check error rate
  // const rateOk = checkErrorRate();
  // if (!rateOk) {
  //   gracefulShutdown('Error rate exceeded', 3);
  //   return;
  // }

  // TODO: Send alert
  // sendAlert('UNHANDLED_REJECTION', error, classification);

  // TODO: Attempt recovery
  // const recovered = attemptRecovery(error, classification);
  // if (!recovered) {
  //   gracefulShutdown('Fatal unhandled rejection', 2);
  // } else {
  //   console.log('\n✅ Recovery successful - process continuing\n');
  // }
}

/**
 * TODO 9: Set up error handlers
 */
function setupErrorHandlers() {
  console.log('🛡️  Setting up error recovery system...\n');

  // TODO: Set up uncaughtException handler
  // process.on('uncaughtException', handleUncaughtException);

  // TODO: Set up unhandledRejection handler
  // process.on('unhandledRejection', handleUnhandledRejection);

  // TODO: Set up SIGINT handler for clean exit
  // process.on('SIGINT', () => {
  //   console.log('\n\n🛑 Received SIGINT (Ctrl+C)');
  //   gracefulShutdown('User interrupt', 0);
  // });

  console.log('✅ Error handlers registered');
  console.log(`📝 Errors will be logged to: ${CONFIG.logFile}`);
  console.log(`⚡ Max errors per minute: ${CONFIG.maxErrorsPerMinute}\n`);
}

// =============================================================================
// Test Scenarios
// =============================================================================

/**
 * Test different error scenarios
 */
function runTests() {
  console.log('🧪 Error Recovery System - Test Mode\n');
  console.log('This will trigger various error scenarios to test recovery\n');

  // Test 1: Recoverable error (simulated network timeout)
  setTimeout(() => {
    console.log('\n📌 TEST 1: Simulating recoverable network error...');
    const error = new Error('Network timeout');
    error.code = 'ETIMEDOUT';
    throw error;
  }, 2000);

  // Test 2: Recoverable error (file not found)
  setTimeout(() => {
    console.log('\n📌 TEST 2: Simulating recoverable file error...');
    const error = new Error('File not found');
    error.code = 'ENOENT';
    throw error;
  }, 4000);

  // Test 3: Unhandled promise rejection
  setTimeout(() => {
    console.log('\n📌 TEST 3: Simulating unhandled promise rejection...');
    Promise.reject(new Error('Database connection failed'));
  }, 6000);

  // Test 4: Multiple errors (test rate limiting)
  setTimeout(() => {
    console.log('\n📌 TEST 4: Simulating multiple rapid errors...');
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const error = new Error(`Rapid error ${i + 1}`);
        error.code = 'ECONNREFUSED';
        throw error;
      }, i * 500);
    }
  }, 8000);

  // Test 5: Fatal error (after other tests)
  setTimeout(() => {
    console.log('\n📌 TEST 5: Simulating fatal error...');
    const error = new Error('FATAL ERROR: Heap out of memory');
    throw error;
  }, 12000);
}

// =============================================================================
// Main
// =============================================================================

function main() {
  console.log('═'.repeat(60));
  console.log('ERROR RECOVERY SYSTEM');
  console.log('═'.repeat(60));
  console.log();

  // TODO: Set up error handlers
  // setupErrorHandlers();

  // TODO: Run tests (comment out for production)
  // runTests();

  console.log('💡 System is running. Error handlers are active.');
  console.log('🛑 Press Ctrl+C to exit gracefully\n');

  // Keep process running
  setInterval(() => {
    // Heartbeat
  }, 10000);
}

// Start the system
// TODO: Uncomment when ready to test
// main();

// =============================================================================
// Expected Output:
// =============================================================================

/**
 * When recoverable error occurs:
 * ═══════════════════════════════════════════════════════════
 * ⚠️  UNCAUGHT EXCEPTION DETECTED
 * ═══════════════════════════════════════════════════════════
 * 🔴 UNCAUGHT_EXCEPTION: Network timeout
 *    Recoverable: ✅ Yes
 *
 * 🔍 Error Classification:
 *    Recoverable: true
 *    Strategy: retry
 *
 * 📢 ALERT: Critical error detected
 *    ...
 *
 * ♻️  Attempting recovery with strategy: RETRY
 *    → Error logged, operation can be retried
 *
 * ✅ Recovery successful - process continuing
 *
 * When fatal error occurs:
 * ⚠️  UNCAUGHT EXCEPTION DETECTED
 * ...
 * Strategy: shutdown
 *
 * ♻️  Attempting recovery with strategy: SHUTDOWN
 *    → Fatal error detected, initiating shutdown...
 *
 * ═══════════════════════════════════════════════════════════
 * 🛑 INITIATING GRACEFUL SHUTDOWN
 * ═══════════════════════════════════════════════════════════
 * Reason: Fatal uncaught exception
 * Exit Code: 1
 * ...
 */

// =============================================================================
// Hints:
// =============================================================================

/**
 * Hint 1: Error classification
 * Check error.code for system errors:
 * - ETIMEDOUT, ECONNREFUSED, ECONNRESET: Network errors
 * - ENOENT, EACCES: File errors
 *
 * Check error.message for runtime errors:
 * - "heap out of memory": Fatal memory error
 * - "Maximum call stack": Stack overflow
 *
 * Hint 2: Graceful shutdown
 * Always set isShuttingDown flag first to prevent multiple shutdowns.
 * Use setTimeout to allow cleanup operations to complete.
 *
 * Hint 3: Error rate limiting
 * Use a counter and timer:
 * - Increment on each error
 * - Reset after interval
 * - Force shutdown if exceeded
 *
 * Hint 4: File logging
 * Use fs.appendFileSync() for synchronous logging (important in error handlers).
 * Handle logging errors with try/catch.
 *
 * Hint 5: Process event handlers
 * process.on('uncaughtException', handler);
 * process.on('unhandledRejection', handler);
 * These should be set up early in your application.
 */

// =============================================================================
// Production Considerations:
// =============================================================================

/**
 * 1. Logging: Use a proper logging library (winston, pino)
 * 2. Monitoring: Integrate with Sentry, DataDog, or similar
 * 3. Alerts: Configure email/SMS for fatal errors
 * 4. Persistence: Store error history in database
 * 5. Recovery: Implement retry with exponential backoff
 * 6. Testing: Test error scenarios in staging environment
 * 7. Documentation: Document error codes and recovery strategies
 */
