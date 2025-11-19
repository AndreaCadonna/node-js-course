/**
 * 07-process-events.js
 * =====================
 * Demonstrates process lifecycle events in Node.js
 *
 * Key Concepts:
 * - Understanding process lifecycle
 * - Handling 'exit' event (no async operations allowed)
 * - Handling 'beforeExit' event (async operations allowed)
 * - Understanding when each event fires
 * - Cleanup and shutdown logic
 *
 * Run: node 07-process-events.js
 * Run with early exit: node 07-process-events.js exit
 * Run with event loop work: node 07-process-events.js async
 */

console.log('=== Process Events Example ===\n');

// =============================================================================
// PROCESS LIFECYCLE EVENTS
// =============================================================================

console.log('--- Process Lifecycle Events ---\n');

console.log('Main Process Events:');
console.log('  1. Script execution starts');
console.log('  2. beforeExit - Fires when event loop is empty');
console.log('     (Can schedule more async work)');
console.log('  3. exit - Fires right before process exits');
console.log('     (Cannot schedule more async work)');
console.log('  4. Process terminates\n');

// =============================================================================
// THE 'EXIT' EVENT
// =============================================================================

console.log('--- The "exit" Event ---\n');

// The 'exit' event fires when:
// 1. process.exit() is called explicitly
// 2. The event loop has no more work to do
// 3. The process is being killed

process.on('exit', (code) => {
  // IMPORTANT: Only synchronous operations work here!
  // No async operations (setTimeout, promises, etc.) will execute
  console.log(`\n[exit event] Process is about to exit with code: ${code}`);
  console.log('[exit event] Performing final synchronous cleanup...');

  // This will NOT work (async operation)
  setTimeout(() => {
    console.log('[exit event] This will NEVER print (async not allowed)');
  }, 0);

  // This WILL work (synchronous operation)
  const cleanupTime = Date.now();
  console.log(`[exit event] Cleanup completed at ${cleanupTime}`);
  console.log('[exit event] Goodbye!');
});

console.log('Registered "exit" event handler');
console.log('(Will fire when process exits)\n');

// =============================================================================
// THE 'BEFOREEXIT' EVENT
// =============================================================================

console.log('--- The "beforeExit" Event ---\n');

let beforeExitCount = 0;

// The 'beforeExit' event fires when:
// - The event loop has no more work to do
// - BUT before the 'exit' event
// - Unlike 'exit', you CAN schedule async work here

process.on('beforeExit', (code) => {
  beforeExitCount++;

  console.log(`\n[beforeExit event #${beforeExitCount}] Event loop is empty`);
  console.log(`[beforeExit event #${beforeExitCount}] Exit code: ${code}`);

  // You CAN schedule async work in beforeExit
  // But be careful not to create infinite loops!
  if (beforeExitCount === 1) {
    console.log('[beforeExit event #1] Scheduling async cleanup...');

    // This WILL work (async operations allowed)
    setTimeout(() => {
      console.log('[beforeExit async] Async cleanup completed!');
      // After this completes, event loop is empty again
      // beforeExit will fire one more time
    }, 100);
  } else {
    console.log('[beforeExit event #2] No more async work to schedule');
    console.log('[beforeExit event #2] Process will now exit');
  }
});

console.log('Registered "beforeExit" event handler');
console.log('(Will fire when event loop becomes empty)\n');

// =============================================================================
// KEY DIFFERENCES: EXIT VS BEFOREEXIT
// =============================================================================

console.log('--- Key Differences ---\n');

console.log('beforeExit vs exit:\n');

console.log('beforeExit:');
console.log('  • Fires when event loop is empty');
console.log('  • Can schedule async operations');
console.log('  • May fire multiple times');
console.log('  • Does NOT fire if process.exit() is called');
console.log('  • Does NOT fire on fatal errors\n');

console.log('exit:');
console.log('  • Fires right before process terminates');
console.log('  • Cannot schedule async operations');
console.log('  • Fires only once');
console.log('  • Always fires (even with process.exit())');
console.log('  • Fires on fatal errors\n');

// =============================================================================
// PRACTICAL EXAMPLE: CLEANUP LOGIC
// =============================================================================

console.log('--- Practical Cleanup Example ---\n');

// Simulated resources that need cleanup
const resources = {
  database: { connected: true, name: 'Database' },
  cache: { connected: true, name: 'Cache' },
  files: { open: 3, name: 'Open Files' },
};

// Async cleanup function
async function cleanupResource(resource) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`  Cleaned up: ${resource.name}`);
      resolve();
    }, 50);
  });
}

// Register cleanup on beforeExit (supports async)
process.on('beforeExit', async (code) => {
  if (beforeExitCount <= 2) return; // Skip first two beforeExit calls from earlier

  console.log('\n[Cleanup] Starting resource cleanup...');

  // Async cleanup is allowed here!
  await cleanupResource(resources.database);
  await cleanupResource(resources.cache);

  console.log('[Cleanup] Async cleanup complete');
});

// Register final logging on exit (sync only)
process.on('exit', (code) => {
  // Note: We already have an exit handler above
  // This shows you can have multiple handlers
  console.log(`[Final Log] All resources cleaned up`);
  console.log(`[Final Log] Exit code: ${code}`);
});

console.log('Registered cleanup handlers');
console.log('(Will execute on process exit)\n');

// =============================================================================
// WHEN EVENTS DON'T FIRE
// =============================================================================

console.log('--- When Events Don\'t Fire ---\n');

console.log('beforeExit does NOT fire when:');
console.log('  • process.exit() is called explicitly');
console.log('  • process is killed with SIGKILL');
console.log('  • Fatal error occurs (uncaught exception)\n');

console.log('Example scenarios:\n');

const mode = process.argv[2];

if (mode === 'exit') {
  console.log('Calling process.exit() explicitly...');
  console.log('(beforeExit will NOT fire, but exit will)');

  setTimeout(() => {
    console.log('\nExiting with process.exit(0)...');
    process.exit(0); // beforeExit won't fire
  }, 500);
} else if (mode === 'async') {
  console.log('Scheduling async work...');
  console.log('(beforeExit WILL fire when async work completes)');

  setTimeout(() => {
    console.log('\nAsync work completed');
    console.log('Event loop is now empty');
    // beforeExit will fire
  }, 500);
} else {
  console.log('No async work scheduled');
  console.log('(beforeExit will fire immediately)');
  // Script ends, beforeExit fires
}

// =============================================================================
// MULTIPLE EVENT HANDLERS
// =============================================================================

console.log('\n--- Multiple Event Handlers ---\n');

console.log('You can register multiple handlers for the same event:');

// First handler
process.on('exit', () => {
  console.log('[exit handler 1] Closing log files...');
});

// Second handler
process.on('exit', () => {
  console.log('[exit handler 2] Saving state...');
});

// Third handler
process.on('exit', () => {
  console.log('[exit handler 3] Final goodbye!');
});

console.log('Registered 3 exit handlers (they run in registration order)\n');

// =============================================================================
// MONITORING PROCESS EVENTS
// =============================================================================

console.log('--- All Process Events ---\n');

console.log('Other useful process events:');
console.log('  • uncaughtException - Unhandled exception');
console.log('  • unhandledRejection - Unhandled promise rejection');
console.log('  • warning - Process warnings');
console.log('  • SIGINT - Ctrl+C pressed');
console.log('  • SIGTERM - Termination signal');
console.log('  (We\'ll cover signals in the next example)\n');

// =============================================================================
// EXECUTION FLOW DEMONSTRATION
// =============================================================================

console.log('--- Execution Flow ---\n');

console.log('Current execution point: Main script body');
console.log('Watch the order of events as the script exits...');
console.log('Expected order:');
console.log('  1. This message');
console.log('  2. [beforeExit event #1] (if no mode specified)');
console.log('  3. [beforeExit async] (if scheduling async work)');
console.log('  4. [beforeExit event #2]');
console.log('  5. [exit event]');
console.log('  6. [exit handler 1, 2, 3]');
console.log('  7. Process terminates');

console.log('\n=== Key Takeaways ===');
console.log('• beforeExit fires when event loop is empty (async allowed)');
console.log('• exit fires right before process terminates (sync only)');
console.log('• beforeExit can fire multiple times, exit fires once');
console.log('• Use beforeExit for async cleanup (close connections, etc.)');
console.log('• Use exit for final synchronous logging');
console.log('• process.exit() skips beforeExit but still fires exit');

console.log('\n[Main Script] Execution complete, waiting for events...');

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * BEST PRACTICES:
 *
 * 1. Use beforeExit for async cleanup:
 *    process.on('beforeExit', async (code) => {
 *      await db.close();
 *      await cache.disconnect();
 *    });
 *
 * 2. Use exit for final synchronous tasks:
 *    process.on('exit', (code) => {
 *      console.log(`Exiting with code: ${code}`);
 *      // Write to sync log file
 *      fs.writeFileSync('exit.log', `Exited: ${Date.now()}`);
 *    });
 *
 * 3. Avoid infinite loops in beforeExit:
 *    let cleanupDone = false;
 *    process.on('beforeExit', () => {
 *      if (!cleanupDone) {
 *        cleanupDone = true;
 *        // Schedule async work ONCE
 *        setTimeout(() => { ... }, 0);
 *      }
 *    });
 *
 * 4. Handle both beforeExit and exit:
 *    let cleanupComplete = false;
 *
 *    process.on('beforeExit', async () => {
 *      await performCleanup();
 *      cleanupComplete = true;
 *    });
 *
 *    process.on('exit', () => {
 *      if (!cleanupComplete) {
 *        // Sync fallback cleanup
 *      }
 *    });
 *
 * 5. Don't rely solely on beforeExit:
 *    beforeExit doesn't fire on process.exit() or fatal errors.
 *    Also handle signal events (SIGTERM, SIGINT) for cleanup.
 *
 * 6. Testing exit behavior:
 *    const { spawn } = require('child_process');
 *    const child = spawn('node', ['script.js']);
 *
 *    child.on('exit', (code, signal) => {
 *      console.log(`Child exited with code ${code}`);
 *    });
 *
 * COMMON PATTERNS:
 *
 * Graceful shutdown:
 * ```js
 * let isShuttingDown = false;
 *
 * async function gracefulShutdown() {
 *   if (isShuttingDown) return;
 *   isShuttingDown = true;
 *
 *   console.log('Starting graceful shutdown...');
 *
 *   // Stop accepting new work
 *   server.close();
 *
 *   // Wait for existing work to complete
 *   await Promise.all(activeRequests);
 *
 *   // Close external connections
 *   await db.close();
 *   await redis.quit();
 *
 *   console.log('Graceful shutdown complete');
 *   process.exit(0);
 * }
 *
 * process.on('beforeExit', gracefulShutdown);
 * process.on('SIGTERM', gracefulShutdown);
 * process.on('SIGINT', gracefulShutdown);
 * ```
 */
