/**
 * 08-signal-handling.js
 * ======================
 * Demonstrates handling operating system signals in Node.js
 *
 * Key Concepts:
 * - Understanding Unix/POSIX signals
 * - Handling SIGINT (Ctrl+C)
 * - Handling SIGTERM (termination request)
 * - Graceful shutdown patterns
 * - Signal event listeners
 * - Platform differences (Windows vs Unix)
 *
 * Run: node 08-signal-handling.js
 * Test: Press Ctrl+C to send SIGINT
 * Test: kill -SIGTERM <pid> (in another terminal)
 * Test: kill -SIGHUP <pid> (in another terminal)
 */

console.log('=== Signal Handling Example ===\n');

// =============================================================================
// UNDERSTANDING SIGNALS
// =============================================================================

console.log('--- Understanding Signals ---\n');

console.log('Common Unix/POSIX Signals:\n');

console.log('SIGINT (2):');
console.log('  • Interrupt signal (Ctrl+C)');
console.log('  • Default: Terminate process');
console.log('  • Can be caught and handled\n');

console.log('SIGTERM (15):');
console.log('  • Termination signal');
console.log('  • Default: Terminate process');
console.log('  • Can be caught and handled');
console.log('  • Used by process managers (systemd, pm2, etc.)\n');

console.log('SIGKILL (9):');
console.log('  • Kill signal');
console.log('  • Default: Terminate immediately');
console.log('  • CANNOT be caught or ignored\n');

console.log('SIGHUP (1):');
console.log('  • Hangup signal');
console.log('  • Originally: terminal disconnected');
console.log('  • Often used to reload configuration\n');

console.log('Other signals:');
console.log('  • SIGQUIT (3): Quit with core dump');
console.log('  • SIGUSR1 (10): User-defined signal 1');
console.log('  • SIGUSR2 (12): User-defined signal 2');
console.log('  • SIGALRM (14): Alarm timer');
console.log();

// =============================================================================
// BASIC SIGNAL HANDLING
// =============================================================================

console.log('--- Basic Signal Handling ---\n');

// Track if we're shutting down to prevent multiple shutdowns
let isShuttingDown = false;

// SIGINT: Usually from Ctrl+C
process.on('SIGINT', () => {
  console.log('\n[SIGINT] Received interrupt signal (Ctrl+C)');

  if (isShuttingDown) {
    console.log('[SIGINT] Already shutting down, forcing exit...');
    process.exit(1);
  }

  isShuttingDown = true;
  console.log('[SIGINT] Starting graceful shutdown...');

  // Perform cleanup
  performCleanup('SIGINT');
});

// SIGTERM: Graceful shutdown request from system or process manager
process.on('SIGTERM', () => {
  console.log('\n[SIGTERM] Received termination signal');

  if (isShuttingDown) {
    console.log('[SIGTERM] Already shutting down...');
    return;
  }

  isShuttingDown = true;
  console.log('[SIGTERM] Starting graceful shutdown...');

  // Perform cleanup
  performCleanup('SIGTERM');
});

// SIGHUP: Often used to reload configuration
process.on('SIGHUP', () => {
  console.log('\n[SIGHUP] Received hangup signal');
  console.log('[SIGHUP] Reloading configuration...');
  reloadConfiguration();
});

console.log('Signal handlers registered:');
console.log('  ✓ SIGINT (Ctrl+C)');
console.log('  ✓ SIGTERM (termination)');
console.log('  ✓ SIGHUP (reload config)');
console.log();

// =============================================================================
// GRACEFUL SHUTDOWN PATTERN
// =============================================================================

console.log('--- Graceful Shutdown Pattern ---\n');

// Simulated server/resources
const server = {
  active: true,
  connections: 5,
  close: function () {
    console.log('  [Server] Stopping server...');
    this.active = false;
    this.connections = 0;
  },
};

const database = {
  connected: true,
  queries: 2,
  close: async function () {
    console.log('  [Database] Closing database connections...');
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = false;
        this.queries = 0;
        console.log('  [Database] Closed');
        resolve();
      }, 500);
    });
  },
};

const cache = {
  connected: true,
  disconnect: async function () {
    console.log('  [Cache] Disconnecting from cache...');
    return new Promise((resolve) => {
      setTimeout(() => {
        this.connected = false;
        console.log('  [Cache] Disconnected');
        resolve();
      }, 300);
    });
  },
};

/**
 * Graceful cleanup function
 */
async function performCleanup(signal) {
  console.log(`\n[Cleanup] Initiating cleanup for ${signal}...`);

  // 1. Stop accepting new work
  console.log('[Cleanup] Step 1: Stopping new connections...');
  server.close();

  // 2. Wait for existing work to complete
  console.log('[Cleanup] Step 2: Waiting for existing operations...');
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 3. Close external connections
  console.log('[Cleanup] Step 3: Closing external connections...');
  try {
    await Promise.all([database.close(), cache.disconnect()]);
  } catch (error) {
    console.error('[Cleanup] Error during cleanup:', error.message);
  }

  // 4. Exit
  console.log('[Cleanup] Cleanup complete. Exiting...\n');
  process.exit(0);
}

/**
 * Configuration reload function
 */
function reloadConfiguration() {
  console.log('[Config] Reading configuration file...');

  setTimeout(() => {
    console.log('[Config] Configuration reloaded successfully');
    console.log('[Config] Applying new settings...');

    // In real application, you would:
    // - Re-read config file
    // - Validate configuration
    // - Apply new settings
    // - Log changes

    console.log('[Config] Application updated without restart\n');
  }, 500);
}

console.log('Graceful shutdown pattern implemented:');
console.log('  1. Stop accepting new work');
console.log('  2. Wait for existing operations');
console.log('  3. Close external connections');
console.log('  4. Exit cleanly');
console.log();

// =============================================================================
// HANDLING MULTIPLE SIGNALS
// =============================================================================

console.log('--- Handling Multiple Signals ---\n');

// List of signals to handle
const shutdownSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

// Consolidated shutdown handler
function createShutdownHandler(signal) {
  return () => {
    console.log(`\n[Shutdown] Received ${signal}`);

    if (isShuttingDown) {
      console.log('[Shutdown] Shutdown already in progress');
      if (signal === 'SIGINT') {
        // Allow force quit on second Ctrl+C
        console.log('[Shutdown] Forcing immediate exit...');
        process.exit(1);
      }
      return;
    }

    performCleanup(signal);
  };
}

// Note: Handlers are already registered above, this shows the pattern
console.log('Multiple signals can trigger the same shutdown logic');
console.log(`Handling signals: ${shutdownSignals.join(', ')}`);
console.log();

// =============================================================================
// PLATFORM DIFFERENCES
// =============================================================================

console.log('--- Platform Differences ---\n');

console.log(`Current platform: ${process.platform}`);
console.log();

if (process.platform === 'win32') {
  console.log('Windows Notes:');
  console.log('  • Windows has limited signal support');
  console.log('  • SIGINT is partially supported (Ctrl+C)');
  console.log('  • SIGTERM is not supported on Windows');
  console.log('  • SIGKILL is not supported on Windows');
  console.log('  • SIGBREAK is supported (Ctrl+Break)');
  console.log('  • Use process managers for proper signal handling');
} else {
  console.log('Unix/Linux/macOS Notes:');
  console.log('  • Full POSIX signal support');
  console.log('  • All standard signals available');
  console.log('  • Can send signals with kill command');
  console.log('  • Example: kill -SIGTERM <pid>');
}
console.log();

// =============================================================================
// SENDING SIGNALS
// =============================================================================

console.log('--- Sending Signals to This Process ---\n');

console.log(`Process ID: ${process.pid}`);
console.log();
console.log('To test signal handling, open another terminal and run:');
console.log();

if (process.platform !== 'win32') {
  console.log('Send SIGTERM:');
  console.log(`  kill -SIGTERM ${process.pid}`);
  console.log('  or');
  console.log(`  kill ${process.pid}  (SIGTERM is default)`);
  console.log();

  console.log('Send SIGHUP:');
  console.log(`  kill -SIGHUP ${process.pid}`);
  console.log();

  console.log('Send SIGKILL (immediate, unhandled):');
  console.log(`  kill -9 ${process.pid}`);
  console.log('  (Warning: No cleanup will occur!)');
  console.log();
}

console.log('Press Ctrl+C to send SIGINT to this process');
console.log();

// =============================================================================
// PRACTICAL EXAMPLE: WEB SERVER SHUTDOWN
// =============================================================================

console.log('--- Web Server Shutdown Example ---\n');

/**
 * Simulated web server with graceful shutdown
 */
class WebServer {
  constructor() {
    this.activeConnections = new Set();
    this.isShuttingDown = false;
  }

  start() {
    console.log('[Server] Server started');

    // Simulate some active connections
    const conn1 = { id: 1, closeGracefully: async () => {
      console.log('    [Connection 1] Closing...');
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('    [Connection 1] Closed');
    }};
    const conn2 = { id: 2, closeGracefully: async () => {
      console.log('    [Connection 2] Closing...');
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('    [Connection 2] Closed');
    }};

    this.activeConnections.add(conn1);
    this.activeConnections.add(conn2);

    console.log(`[Server] ${this.activeConnections.size} active connections`);
  }

  async shutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log('[Server] Beginning graceful shutdown...');
    console.log(`[Server] Closing ${this.activeConnections.size} active connections...`);

    // Close all connections gracefully
    await Promise.all(
      Array.from(this.activeConnections).map((conn) => conn.closeGracefully())
    );

    this.activeConnections.clear();
    console.log('[Server] All connections closed');
    console.log('[Server] Server shutdown complete');
  }
}

// Create and start simulated server
const webServer = new WebServer();
webServer.start();
console.log();

// =============================================================================
// TIMEOUT PATTERN
// =============================================================================

console.log('--- Shutdown Timeout Pattern ---\n');

console.log('Best practice: Set a timeout for graceful shutdown');
console.log('If cleanup takes too long, force exit\n');

const SHUTDOWN_TIMEOUT = 10000; // 10 seconds

async function shutdownWithTimeout(signal) {
  console.log(`[Shutdown] Received ${signal}, starting graceful shutdown...`);

  // Set a timeout to force exit if cleanup takes too long
  const forceExitTimer = setTimeout(() => {
    console.error('[Shutdown] Timeout reached, forcing exit!');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  try {
    // Perform cleanup
    await webServer.shutdown();

    // Clear timeout if cleanup completes in time
    clearTimeout(forceExitTimer);

    console.log('[Shutdown] Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('[Shutdown] Error during shutdown:', error.message);
    process.exit(1);
  }
}

console.log(`Shutdown timeout set to ${SHUTDOWN_TIMEOUT}ms`);
console.log('(Prevents hanging during cleanup)');
console.log();

// =============================================================================
// KEEPING PROCESS ALIVE
// =============================================================================

console.log('--- Keeping Process Alive ---\n');

console.log('This process will stay alive until you send a signal.');
console.log('The event loop is kept alive by this interval:');
console.log();

// Keep the process alive so you can test signal handling
const keepAliveInterval = setInterval(() => {
  const uptime = process.uptime().toFixed(1);
  const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

  // Use \r to overwrite the same line
  process.stdout.write(
    `[Running] Uptime: ${uptime}s | Memory: ${memory}MB | ` +
      `Connections: ${server.connections} | ` +
      `Press Ctrl+C to exit\r`
  );
}, 1000);

// Clear interval during cleanup
process.on('exit', () => {
  clearInterval(keepAliveInterval);
  console.log('\n[Exit] Process terminated');
});

console.log('=== Key Takeaways ===');
console.log('• SIGINT (Ctrl+C) - User interrupt, should trigger cleanup');
console.log('• SIGTERM - Graceful shutdown request from system');
console.log('• SIGKILL - Cannot be caught, kills immediately');
console.log('• SIGHUP - Often used to reload configuration');
console.log('• Always implement graceful shutdown for production apps');
console.log('• Set timeout to prevent hanging during shutdown');
console.log('• Handle second Ctrl+C to force immediate exit');

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * PRODUCTION-READY SIGNAL HANDLING:
 *
 * ```js
 * const gracefulShutdown = require('http-graceful-shutdown');
 *
 * const server = app.listen(3000);
 *
 * gracefulShutdown(server, {
 *   signals: 'SIGINT SIGTERM',
 *   timeout: 10000,
 *   development: false,
 *   onShutdown: async () => {
 *     console.log('Cleaning up...');
 *     await db.close();
 *     await cache.disconnect();
 *   },
 *   finally: () => {
 *     console.log('Server closed');
 *   }
 * });
 * ```
 *
 * PROCESS MANAGERS:
 *
 * 1. PM2:
 *    - Handles signals automatically
 *    - Provides graceful reload (zero-downtime)
 *    - pm2 start app.js --kill-timeout 10000
 *
 * 2. systemd:
 *    - Sends SIGTERM on stop
 *    - Configure TimeoutStopSec
 *    - Sends SIGKILL after timeout
 *
 * 3. Docker:
 *    - SIGTERM on stop
 *    - SIGKILL after 10s (configurable)
 *    - Use STOPSIGNAL in Dockerfile
 *
 * DEBUGGING SIGNALS:
 *
 * Log all signals:
 * ```js
 * const signals = [
 *   'SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT',
 *   'SIGUSR1', 'SIGUSR2', 'SIGBREAK'
 * ];
 *
 * signals.forEach(signal => {
 *   process.on(signal, () => {
 *     console.log(`Received ${signal}`);
 *   });
 * });
 * ```
 *
 * TESTING SIGNAL HANDLING:
 *
 * ```js
 * const { spawn } = require('child_process');
 *
 * const child = spawn('node', ['app.js']);
 *
 * setTimeout(() => {
 *   console.log('Sending SIGTERM...');
 *   child.kill('SIGTERM');
 * }, 2000);
 *
 * child.on('exit', (code, signal) => {
 *   console.log(`Child exited with code ${code}, signal ${signal}`);
 * });
 * ```
 */
