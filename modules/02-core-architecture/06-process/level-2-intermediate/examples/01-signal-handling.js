/**
 * 01-signal-handling.js
 *
 * Comprehensive Signal Handling in Node.js
 *
 * This example demonstrates production-ready signal handling patterns including:
 * - SIGTERM, SIGINT, SIGHUP handling
 * - Platform-specific signal differences
 * - Signal coordination and state management
 * - Multiple signal handler registration
 * - Safe signal handling practices
 * - Signal propagation to child processes
 *
 * Signals are a standard mechanism for inter-process communication in Unix-like systems.
 * In Node.js, proper signal handling is crucial for graceful application shutdown,
 * resource cleanup, and responding to system events.
 *
 * Common Signals:
 * - SIGTERM: Polite termination request (default kill signal)
 * - SIGINT: Interrupt from keyboard (Ctrl+C)
 * - SIGHUP: Hangup signal (terminal closed, often used for reload)
 * - SIGUSR1: User-defined signal 1 (Node.js uses for debugger)
 * - SIGUSR2: User-defined signal 2 (can be used for custom behavior)
 * - SIGKILL: Force kill (cannot be caught or ignored)
 * - SIGSTOP: Force stop (cannot be caught or ignored)
 *
 * Platform Differences:
 * - Windows has limited signal support (mainly SIGINT, SIGBREAK, SIGTERM)
 * - Unix/Linux/macOS support full POSIX signal set
 * - Signal numbers differ between platforms
 *
 * @module signal-handling
 * @level intermediate
 */

'use strict';

const { EventEmitter } = require('events');

// =============================================================================
// 1. Basic Signal Handler with State Management
// =============================================================================

console.log('\n=== 1. Basic Signal Handler with State Management ===\n');

class SignalManager extends EventEmitter {
  constructor() {
    super();
    this.signalReceived = false;
    this.shutdownInProgress = false;
    this.handlers = new Map();
    this.signalHistory = [];
  }

  /**
   * Register a handler for a specific signal
   * @param {string} signal - The signal name (e.g., 'SIGTERM')
   * @param {Function} handler - Handler function
   * @param {string} name - Handler name for tracking
   */
  registerHandler(signal, handler, name = 'anonymous') {
    if (!this.handlers.has(signal)) {
      this.handlers.set(signal, []);

      // Create the Node.js signal listener
      const listener = (signal) => {
        this.handleSignal(signal);
      };

      process.on(signal, listener);
    }

    this.handlers.get(signal).push({ name, handler });
    console.log(`[SignalManager] Registered handler "${name}" for ${signal}`);
  }

  /**
   * Handle incoming signal
   */
  async handleSignal(signal) {
    const timestamp = new Date().toISOString();

    // Record signal in history
    this.signalHistory.push({ signal, timestamp });

    console.log(`\n[SignalManager] Received ${signal} at ${timestamp}`);

    // Prevent multiple simultaneous shutdowns
    if (this.shutdownInProgress) {
      console.log(`[SignalManager] Shutdown already in progress, ignoring ${signal}`);
      return;
    }

    this.signalReceived = true;
    this.shutdownInProgress = true;

    // Execute all registered handlers for this signal
    const handlers = this.handlers.get(signal) || [];

    console.log(`[SignalManager] Executing ${handlers.length} handler(s) for ${signal}`);

    for (const { name, handler } of handlers) {
      try {
        console.log(`[SignalManager] Running handler: ${name}`);
        await handler(signal);
        console.log(`[SignalManager] Handler "${name}" completed successfully`);
      } catch (error) {
        console.error(`[SignalManager] Handler "${name}" failed:`, error.message);
      }
    }

    // Emit event for external listeners
    this.emit('signal', signal);
  }

  /**
   * Get signal handling statistics
   */
  getStats() {
    return {
      signalsReceived: this.signalHistory.length,
      history: this.signalHistory,
      registeredHandlers: Array.from(this.handlers.entries()).map(([signal, handlers]) => ({
        signal,
        handlerCount: handlers.length,
        handlerNames: handlers.map(h => h.name)
      }))
    };
  }
}

// Create signal manager instance
const signalManager = new SignalManager();

// Register example handlers
signalManager.registerHandler('SIGTERM', async (signal) => {
  console.log(`  └─ Cleanup handler for ${signal}: Closing connections...`);
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`  └─ Connections closed`);
}, 'cleanup-connections');

signalManager.registerHandler('SIGTERM', async (signal) => {
  console.log(`  └─ Database handler for ${signal}: Flushing data...`);
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log(`  └─ Data flushed`);
}, 'flush-database');

console.log('Signal manager initialized with handlers');
console.log('Try: kill -SIGTERM', process.pid);

// =============================================================================
// 2. Platform-Aware Signal Handling
// =============================================================================

console.log('\n=== 2. Platform-Aware Signal Handling ===\n');

class PlatformSignalHandler {
  constructor() {
    this.platform = process.platform;
    this.isWindows = this.platform === 'win32';
    this.supportedSignals = this.getSupportedSignals();
  }

  /**
   * Get list of signals supported on current platform
   */
  getSupportedSignals() {
    if (this.isWindows) {
      // Windows supports limited signals
      return ['SIGINT', 'SIGTERM', 'SIGBREAK'];
    } else {
      // Unix-like systems support full POSIX signal set
      return [
        'SIGTERM', 'SIGINT', 'SIGHUP', 'SIGQUIT',
        'SIGUSR1', 'SIGUSR2', 'SIGPIPE', 'SIGALRM'
      ];
    }
  }

  /**
   * Setup signal handlers based on platform capabilities
   */
  setupHandlers() {
    console.log(`Platform: ${this.platform}`);
    console.log(`Supported signals: ${this.supportedSignals.join(', ')}\n`);

    for (const signal of this.supportedSignals) {
      try {
        process.on(signal, () => {
          console.log(`[${signal}] Received on ${this.platform}`);
          this.handlePlatformSignal(signal);
        });
        console.log(`✓ Handler registered for ${signal}`);
      } catch (error) {
        console.log(`✗ Failed to register ${signal}: ${error.message}`);
      }
    }
  }

  /**
   * Handle signal with platform-specific behavior
   */
  handlePlatformSignal(signal) {
    const handlers = {
      'SIGTERM': () => this.handleTermination(signal),
      'SIGINT': () => this.handleInterrupt(signal),
      'SIGHUP': () => this.handleHangup(signal),
      'SIGUSR1': () => this.handleUser1(signal),
      'SIGUSR2': () => this.handleUser2(signal),
      'SIGBREAK': () => this.handleBreak(signal)
    };

    const handler = handlers[signal];
    if (handler) {
      handler();
    }
  }

  handleTermination(signal) {
    console.log(`  └─ Termination requested via ${signal}`);
    console.log(`  └─ Initiating graceful shutdown...`);
  }

  handleInterrupt(signal) {
    console.log(`  └─ Interrupt received via ${signal} (Ctrl+C)`);
    console.log(`  └─ User requested shutdown`);
  }

  handleHangup(signal) {
    console.log(`  └─ Hangup signal received via ${signal}`);
    console.log(`  └─ Typically used to reload configuration`);
    console.log(`  └─ (Not available on Windows)`);
  }

  handleUser1(signal) {
    console.log(`  └─ SIGUSR1 received - Node.js debugger signal`);
    console.log(`  └─ By default, starts debugger`);
  }

  handleUser2(signal) {
    console.log(`  └─ SIGUSR2 received - Custom application signal`);
    console.log(`  └─ Can be used for custom behavior (e.g., heap dump)`);
  }

  handleBreak(signal) {
    console.log(`  └─ SIGBREAK received (Windows Ctrl+Break)`);
    console.log(`  └─ Windows-specific signal`);
  }
}

const platformHandler = new PlatformSignalHandler();
platformHandler.setupHandlers();

// =============================================================================
// 3. Signal Coordination Pattern
// =============================================================================

console.log('\n=== 3. Signal Coordination Pattern ===\n');

class SignalCoordinator {
  constructor() {
    this.state = 'running';
    this.shutdownTimeout = 30000; // 30 seconds
    this.shutdownTimer = null;
    this.cleanupTasks = [];
  }

  /**
   * Add a cleanup task to be executed on shutdown
   */
  addCleanupTask(name, task, priority = 0) {
    this.cleanupTasks.push({ name, task, priority });
    // Sort by priority (higher priority runs first)
    this.cleanupTasks.sort((a, b) => b.priority - a.priority);
    console.log(`Added cleanup task: ${name} (priority: ${priority})`);
  }

  /**
   * Setup signal handling with coordination
   */
  setup() {
    // Handle termination signals
    const terminationSignals = ['SIGTERM', 'SIGINT'];

    for (const signal of terminationSignals) {
      process.on(signal, () => {
        this.initiateShutdown(signal);
      });
    }

    // Handle reload signal (Unix only)
    if (process.platform !== 'win32') {
      process.on('SIGHUP', () => {
        this.handleReload();
      });
    }

    console.log('Signal coordinator setup complete');
    console.log(`Registered for: ${terminationSignals.join(', ')}`);
    if (process.platform !== 'win32') {
      console.log('Also registered for: SIGHUP (reload)');
    }
  }

  /**
   * Initiate coordinated shutdown
   */
  async initiateShutdown(signal) {
    if (this.state !== 'running') {
      console.log(`\n[${signal}] Already shutting down, forcing exit...`);
      process.exit(1);
    }

    console.log(`\n[${signal}] Initiating coordinated shutdown...`);
    this.state = 'shutting_down';

    // Set shutdown timeout
    this.shutdownTimer = setTimeout(() => {
      console.error('\n[TIMEOUT] Shutdown timeout exceeded, forcing exit!');
      process.exit(1);
    }, this.shutdownTimeout);

    // Don't keep process alive for timeout
    this.shutdownTimer.unref();

    try {
      await this.executeCleanupTasks();
      console.log('\n[SUCCESS] Graceful shutdown completed');
      clearTimeout(this.shutdownTimer);
      process.exit(0);
    } catch (error) {
      console.error('\n[ERROR] Shutdown failed:', error.message);
      clearTimeout(this.shutdownTimer);
      process.exit(1);
    }
  }

  /**
   * Execute all cleanup tasks in priority order
   */
  async executeCleanupTasks() {
    console.log(`\nExecuting ${this.cleanupTasks.length} cleanup tasks...`);

    for (const { name, task, priority } of this.cleanupTasks) {
      console.log(`\n  → Running: ${name} (priority: ${priority})`);
      const startTime = Date.now();

      try {
        await task();
        const duration = Date.now() - startTime;
        console.log(`    ✓ Completed in ${duration}ms`);
      } catch (error) {
        console.error(`    ✗ Failed: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Handle reload signal
   */
  handleReload() {
    console.log('\n[SIGHUP] Reload signal received');
    console.log('  → Reloading configuration...');
    console.log('  → Reopening log files...');
    console.log('  → Refreshing connections...');
    console.log('  ✓ Reload complete (application continues running)');
  }
}

const coordinator = new SignalCoordinator();

// Add example cleanup tasks
coordinator.addCleanupTask('close-server', async () => {
  console.log('    • Stopping HTTP server...');
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('    • Server stopped');
}, 100);

coordinator.addCleanupTask('disconnect-database', async () => {
  console.log('    • Closing database connections...');
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('    • Database disconnected');
}, 90);

coordinator.addCleanupTask('flush-logs', async () => {
  console.log('    • Flushing log buffers...');
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log('    • Logs flushed');
}, 80);

coordinator.addCleanupTask('cleanup-temp', async () => {
  console.log('    • Cleaning temporary files...');
  await new Promise(resolve => setTimeout(resolve, 150));
  console.log('    • Temp files cleaned');
}, 70);

coordinator.setup();

// =============================================================================
// 4. Signal Multiplexer Pattern
// =============================================================================

console.log('\n=== 4. Signal Multiplexer Pattern ===\n');

class SignalMultiplexer {
  constructor() {
    this.listeners = new Map();
    this.signalCounts = new Map();
    this.startTime = Date.now();
  }

  /**
   * Subscribe to signal events
   */
  on(signal, callback) {
    if (!this.listeners.has(signal)) {
      this.listeners.set(signal, new Set());
      this.signalCounts.set(signal, 0);

      // Register actual process signal handler
      process.on(signal, () => {
        this.dispatch(signal);
      });
    }

    this.listeners.get(signal).add(callback);
    return () => this.off(signal, callback);
  }

  /**
   * Unsubscribe from signal events
   */
  off(signal, callback) {
    const callbacks = this.listeners.get(signal);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Dispatch signal to all listeners
   */
  dispatch(signal) {
    const count = this.signalCounts.get(signal) + 1;
    this.signalCounts.set(signal, count);

    const runtime = Date.now() - this.startTime;
    const callbacks = this.listeners.get(signal);

    console.log(`\n[Multiplexer] ${signal} received (count: ${count}, runtime: ${runtime}ms)`);
    console.log(`[Multiplexer] Dispatching to ${callbacks ? callbacks.size : 0} listener(s)`);

    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback({ signal, count, runtime });
        } catch (error) {
          console.error(`[Multiplexer] Listener error:`, error.message);
        }
      }
    }
  }

  /**
   * Get signal statistics
   */
  getStats() {
    return {
      uptime: Date.now() - this.startTime,
      signals: Array.from(this.signalCounts.entries()).map(([signal, count]) => ({
        signal,
        count,
        listenerCount: this.listeners.get(signal)?.size || 0
      }))
    };
  }
}

const multiplexer = new SignalMultiplexer();

// Subscribe multiple listeners
multiplexer.on('SIGTERM', ({ signal, count, runtime }) => {
  console.log(`  [Listener 1] Handling ${signal} #${count}`);
});

multiplexer.on('SIGTERM', ({ signal, count, runtime }) => {
  console.log(`  [Listener 2] Handling ${signal} #${count}`);
});

multiplexer.on('SIGINT', ({ signal, count, runtime }) => {
  console.log(`  [Listener 3] Handling ${signal} #${count} at ${runtime}ms`);
});

console.log('Signal multiplexer configured with multiple listeners');

// =============================================================================
// 5. Advanced Signal Patterns
// =============================================================================

console.log('\n=== 5. Advanced Signal Patterns ===\n');

class AdvancedSignalHandler {
  constructor() {
    this.signalQueue = [];
    this.processing = false;
    this.debounceTimers = new Map();
  }

  /**
   * Handle signal with debouncing
   * Prevents rapid-fire signal handling
   */
  setupDebouncedHandler(signal, handler, delay = 1000) {
    process.on(signal, () => {
      console.log(`\n[Debounced] ${signal} received, debouncing for ${delay}ms...`);

      // Clear existing timer
      if (this.debounceTimers.has(signal)) {
        clearTimeout(this.debounceTimers.get(signal));
      }

      // Set new timer
      const timer = setTimeout(() => {
        console.log(`[Debounced] ${signal} debounce period elapsed, executing handler`);
        handler(signal);
        this.debounceTimers.delete(signal);
      }, delay);

      this.debounceTimers.set(signal, timer);
    });
  }

  /**
   * Queue signals for sequential processing
   */
  setupQueuedHandler(signal, handler) {
    process.on(signal, async () => {
      console.log(`\n[Queued] ${signal} added to queue`);
      this.signalQueue.push({ signal, handler, timestamp: Date.now() });

      if (!this.processing) {
        await this.processQueue();
      }
    });
  }

  /**
   * Process queued signals
   */
  async processQueue() {
    this.processing = true;
    console.log(`\n[Queue] Processing ${this.signalQueue.length} queued signal(s)`);

    while (this.signalQueue.length > 0) {
      const { signal, handler, timestamp } = this.signalQueue.shift();
      const age = Date.now() - timestamp;

      console.log(`\n[Queue] Processing ${signal} (queued for ${age}ms)`);

      try {
        await handler(signal);
        console.log(`[Queue] ${signal} handled successfully`);
      } catch (error) {
        console.error(`[Queue] Error handling ${signal}:`, error.message);
      }
    }

    this.processing = false;
    console.log(`\n[Queue] All signals processed`);
  }
}

const advancedHandler = new AdvancedSignalHandler();

// Example: Debounced SIGUSR1 handler (Unix only)
if (process.platform !== 'win32') {
  advancedHandler.setupDebouncedHandler('SIGUSR1', (signal) => {
    console.log(`  └─ Executing debounced ${signal} handler`);
    console.log(`  └─ Generating heap snapshot...`);
  }, 2000);

  console.log('Debounced SIGUSR1 handler registered (Unix only)');
  console.log('Try rapidly: kill -SIGUSR1', process.pid);
}

// =============================================================================
// Summary and Best Practices
// =============================================================================

console.log('\n=== Signal Handling Best Practices ===\n');

console.log(`
Signal Handling Guidelines:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Always Handle Critical Signals:
   • SIGTERM: Graceful termination (default kill signal)
   • SIGINT: Keyboard interrupt (Ctrl+C)
   • Handle both for proper shutdown behavior

2. Platform Awareness:
   • Check process.platform before using Unix-only signals
   • Windows supports: SIGINT, SIGTERM, SIGBREAK
   • Unix supports: Full POSIX signal set

3. Prevent Multiple Shutdowns:
   • Use flags to prevent re-entrant shutdown
   • Handle rapid signal delivery gracefully
   • Force exit on second signal if needed

4. Shutdown Timeout:
   • Always set a maximum shutdown time
   • Force exit if cleanup takes too long
   • Use unref() to not block exit

5. Cleanup Priority:
   • Stop accepting new work first
   • Finish in-flight requests
   • Close connections
   • Flush buffers
   • Clean up resources

6. Signal Coordination:
   • Execute cleanup tasks in order
   • Handle errors during cleanup
   • Log all steps for debugging

7. Testing:
   • Test with: kill -SIGTERM <pid>
   • Test forced shutdown: kill -SIGKILL <pid>
   • Test on target platforms

8. Special Signals:
   • SIGUSR1: Reserved by Node.js for debugger
   • SIGUSR2: Available for custom use
   • SIGHUP: Often used for reload
   • SIGPIPE: Broken pipe (handle or ignore)

9. Cannot Catch:
   • SIGKILL: Force kill (instant termination)
   • SIGSTOP: Force stop (cannot override)

10. Production Patterns:
    • Log signal receipt with timestamp
    • Emit metrics on shutdown
    • Coordinate with process manager
    • Handle cascading failures

Statistics:
─────────────
Signal Manager: ${JSON.stringify(signalManager.getStats(), null, 2)}

Current Process:
  PID: ${process.pid}
  Platform: ${process.platform}
  Node Version: ${process.version}
  Uptime: ${Math.floor(process.uptime())}s

Test Commands (Unix):
  kill -SIGTERM ${process.pid}  # Graceful termination
  kill -SIGINT ${process.pid}   # Interrupt
  kill -SIGHUP ${process.pid}   # Hangup/reload
  kill -SIGUSR2 ${process.pid}  # User-defined
  kill -9 ${process.pid}        # Force kill (SIGKILL)

Test Commands (Windows):
  taskkill /PID ${process.pid}  # Termination
  Ctrl+C in terminal           # SIGINT
`);

// Keep process alive for signal testing
console.log('\nProcess running. Send signals to test handlers.');
console.log('Press Ctrl+C or send SIGTERM to trigger graceful shutdown.\n');

// Prevent immediate exit
setInterval(() => {
  // Keep alive
}, 5000);
