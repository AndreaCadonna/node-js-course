/**
 * 07-advanced-exit.js
 *
 * Advanced Process Exit Handling
 *
 * This example demonstrates advanced exit patterns including:
 * - beforeExit vs exit event differences
 * - Exit code management
 * - Cleanup coordination
 * - Exit prevention strategies
 * - Multiple exit handler coordination
 * - Async cleanup in beforeExit
 * - Exit event listener management
 * - Process lifecycle tracking
 *
 * Critical Differences:
 * - beforeExit: Emitted when event loop is empty but process hasn't exited
 * - exit: Emitted when process is about to exit (sync only)
 * - beforeExit can schedule async work and keep process alive
 * - exit cannot schedule async work
 *
 * Exit Scenarios:
 * - Normal completion (code 0)
 * - Error exit (code 1)
 * - Signal termination (code 128 + signal number)
 * - Explicit process.exit()
 * - Uncaught exception
 *
 * @module advanced-exit
 * @level intermediate
 */

'use strict';

const { EventEmitter } = require('events');

// =============================================================================
// 1. Understanding beforeExit vs exit
// =============================================================================

console.log('\n=== 1. Understanding beforeExit vs exit ===\n');

class ExitEventDemonstrator {
  constructor() {
    this.beforeExitCount = 0;
    this.exitCount = 0;
    this.setupListeners();
  }

  /**
   * Setup exit event listeners
   */
  setupListeners() {
    // beforeExit is emitted when the event loop is empty
    process.on('beforeExit', (code) => {
      this.beforeExitCount++;

      console.log('\n[beforeExit Event]');
      console.log(`  Event count: ${this.beforeExitCount}`);
      console.log(`  Exit code: ${code}`);
      console.log(`  Event loop: ${this.beforeExitCount === 1 ? 'empty' : 'has pending work'}`);
      console.log(`  Can schedule async work: YES`);

      // Demonstrate: beforeExit can schedule async work
      if (this.beforeExitCount === 1) {
        console.log('  Scheduling async work to keep process alive...');

        setTimeout(() => {
          console.log('\n[Async Work] Completed work scheduled in beforeExit');
          console.log('[Async Work] Now event loop will be empty again');
          // This will trigger beforeExit again
        }, 1000);
      }
    });

    // exit is emitted when the process is about to exit
    process.on('exit', (code) => {
      this.exitCount++;

      console.log('\n[exit Event]');
      console.log(`  Event count: ${this.exitCount}`);
      console.log(`  Exit code: ${code}`);
      console.log(`  Can schedule async work: NO (will be ignored)`);
      console.log(`  Only synchronous cleanup allowed`);

      // Demonstrate: async work is ignored in exit
      setTimeout(() => {
        console.log('This will NEVER be printed');
      }, 100);

      console.log('\n[exit Event] Process is now exiting...\n');
    });

    console.log('[ExitEventDemo] Event listeners installed');
  }

  /**
   * Get event counts
   */
  getCounts() {
    return {
      beforeExit: this.beforeExitCount,
      exit: this.exitCount
    };
  }
}

const exitDemo = new ExitEventDemonstrator();

// =============================================================================
// 2. Exit Code Management
// =============================================================================

console.log('\n=== 2. Exit Code Management ===\n');

class ExitCodeManager {
  constructor() {
    this.exitReasons = new Map([
      [0, 'Success'],
      [1, 'General Error'],
      [2, 'Misuse of Shell Command'],
      [3, 'Configuration Error'],
      [4, 'Database Error'],
      [5, 'Network Error'],
      [126, 'Command Cannot Execute'],
      [127, 'Command Not Found'],
      [128, 'Invalid Exit Argument'],
      [130, 'Terminated by Ctrl+C (SIGINT)'],
      [137, 'Terminated by SIGKILL'],
      [143, 'Terminated by SIGTERM']
    ]);

    this.customExitCodes = new Map();
  }

  /**
   * Register custom exit code
   */
  registerExitCode(code, reason) {
    if (code < 0 || code > 255) {
      throw new Error('Exit code must be between 0 and 255');
    }

    this.customExitCodes.set(code, reason);
    console.log(`[ExitCodeManager] Registered exit code ${code}: ${reason}`);
  }

  /**
   * Get exit code reason
   */
  getExitReason(code) {
    return this.customExitCodes.get(code) || this.exitReasons.get(code) || 'Unknown';
  }

  /**
   * Exit with code and reason
   */
  exit(code, reason) {
    console.log(`\n[ExitCodeManager] Exiting with code ${code}: ${reason || this.getExitReason(code)}`);
    process.exitCode = code;

    // Note: Not actually calling process.exit() for demo purposes
    // In production: process.exit(code);
  }

  /**
   * Setup exit handler to log exit reason
   */
  setupExitHandler() {
    process.on('exit', (code) => {
      const reason = this.getExitReason(code);
      console.log(`[ExitCodeManager] Process exiting: ${code} - ${reason}`);
    });

    console.log('[ExitCodeManager] Exit handler installed');
  }

  /**
   * Get all exit codes
   */
  getAllExitCodes() {
    const all = new Map([...this.exitReasons, ...this.customExitCodes]);
    return Object.fromEntries(all);
  }
}

const exitCodeManager = new ExitCodeManager();

// Register custom exit codes
exitCodeManager.registerExitCode(10, 'Authentication Failed');
exitCodeManager.registerExitCode(11, 'Authorization Failed');
exitCodeManager.registerExitCode(12, 'Resource Not Found');
exitCodeManager.registerExitCode(13, 'Rate Limit Exceeded');

exitCodeManager.setupExitHandler();

console.log('\n[ExitCodeManager] Exit codes:');
console.log(JSON.stringify(exitCodeManager.getAllExitCodes(), null, 2));
console.log();

// =============================================================================
// 3. Cleanup Coordination
// =============================================================================

console.log('\n=== 3. Cleanup Coordination ===\n');

class CleanupCoordinator extends EventEmitter {
  constructor() {
    super();
    this.cleanupHandlers = [];
    this.beforeExitHandlers = [];
    this.exitHandlers = [];
    this.cleanupComplete = false;
  }

  /**
   * Register cleanup handler for beforeExit (can be async)
   */
  registerBeforeExit(name, handler, priority = 0) {
    this.beforeExitHandlers.push({ name, handler, priority });
    this.beforeExitHandlers.sort((a, b) => b.priority - a.priority);

    console.log(`[CleanupCoordinator] Registered beforeExit handler: ${name} (priority: ${priority})`);
  }

  /**
   * Register cleanup handler for exit (must be sync)
   */
  registerExit(name, handler, priority = 0) {
    this.exitHandlers.push({ name, handler, priority });
    this.exitHandlers.sort((a, b) => b.priority - a.priority);

    console.log(`[CleanupCoordinator] Registered exit handler: ${name} (priority: ${priority})`);
  }

  /**
   * Setup coordination
   */
  setup() {
    // Handle beforeExit - can schedule async work
    process.on('beforeExit', async (code) => {
      if (this.cleanupComplete) {
        console.log('\n[CleanupCoordinator] beforeExit: Cleanup already complete');
        return;
      }

      console.log('\n[CleanupCoordinator] beforeExit: Starting async cleanup...');
      console.log(`[CleanupCoordinator] Handlers: ${this.beforeExitHandlers.length}`);

      for (const { name, handler, priority } of this.beforeExitHandlers) {
        try {
          console.log(`\n  → Running beforeExit handler: ${name} (priority: ${priority})`);
          await handler();
          console.log(`    ✓ ${name} completed`);
        } catch (error) {
          console.error(`    ✗ ${name} failed: ${error.message}`);
        }
      }

      this.cleanupComplete = true;
      console.log('\n[CleanupCoordinator] beforeExit: Async cleanup complete');

      this.emit('beforeExitComplete');
    });

    // Handle exit - sync only
    process.on('exit', (code) => {
      console.log('\n[CleanupCoordinator] exit: Starting sync cleanup...');
      console.log(`[CleanupCoordinator] Handlers: ${this.exitHandlers.length}`);

      for (const { name, handler, priority } of this.exitHandlers) {
        try {
          console.log(`\n  → Running exit handler: ${name} (priority: ${priority})`);
          handler();
          console.log(`    ✓ ${name} completed`);
        } catch (error) {
          console.error(`    ✗ ${name} failed: ${error.message}`);
        }
      }

      console.log('\n[CleanupCoordinator] exit: Sync cleanup complete');

      this.emit('exitComplete', code);
    });

    console.log('[CleanupCoordinator] Coordination setup complete\n');
  }
}

const cleanupCoordinator = new CleanupCoordinator();

// Register beforeExit handlers (can be async)
cleanupCoordinator.registerBeforeExit('flush-cache', async () => {
  console.log('    • Flushing cache to disk...');
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log('    • Cache flushed');
}, 100);

cleanupCoordinator.registerBeforeExit('close-connections', async () => {
  console.log('    • Closing network connections...');
  await new Promise(resolve => setTimeout(resolve, 150));
  console.log('    • Connections closed');
}, 90);

// Register exit handlers (must be sync)
cleanupCoordinator.registerExit('flush-logs', () => {
  console.log('    • Flushing final logs');
  // Sync operation only
}, 100);

cleanupCoordinator.registerExit('print-stats', () => {
  console.log('    • Process stats:');
  console.log(`      - Uptime: ${Math.floor(process.uptime())}s`);
  console.log(`      - Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
}, 50);

cleanupCoordinator.setup();

// =============================================================================
// 4. Exit Prevention Strategies
// =============================================================================

console.log('\n=== 4. Exit Prevention Strategies ===\n');

class ExitPreventor {
  constructor() {
    this.preventExit = false;
    this.pendingWork = new Set();
    this.workCounter = 0;
  }

  /**
   * Register pending work
   */
  registerWork(name) {
    const workId = ++this.workCounter;
    const work = { id: workId, name, startTime: Date.now() };

    this.pendingWork.add(work);

    console.log(`[ExitPreventor] Registered work: ${name} (ID: ${workId})`);
    console.log(`[ExitPreventor] Pending work count: ${this.pendingWork.size}`);

    return workId;
  }

  /**
   * Complete pending work
   */
  completeWork(workId) {
    const work = Array.from(this.pendingWork).find(w => w.id === workId);

    if (work) {
      const duration = Date.now() - work.startTime;
      this.pendingWork.delete(work);

      console.log(`[ExitPreventor] Completed work: ${work.name} (${duration}ms)`);
      console.log(`[ExitPreventor] Pending work count: ${this.pendingWork.size}`);
    }
  }

  /**
   * Setup beforeExit to prevent exit if work pending
   */
  setupPreventExit() {
    process.on('beforeExit', (code) => {
      if (this.pendingWork.size > 0) {
        console.log('\n[ExitPreventor] beforeExit: Work still pending, preventing exit');
        console.log(`[ExitPreventor] Pending: ${this.pendingWork.size} item(s)`);

        for (const work of this.pendingWork) {
          const age = Date.now() - work.startTime;
          console.log(`  - ${work.name} (${age}ms)`);
        }

        // Schedule a check to keep event loop alive
        setTimeout(() => {
          console.log('[ExitPreventor] Keepalive check...');
        }, 100);
      } else {
        console.log('\n[ExitPreventor] beforeExit: No pending work, allowing exit');
      }
    });

    console.log('[ExitPreventor] Exit prevention setup complete');
  }

  /**
   * Get pending work summary
   */
  getPendingWork() {
    return Array.from(this.pendingWork).map(work => ({
      id: work.id,
      name: work.name,
      age: Date.now() - work.startTime
    }));
  }
}

const exitPreventor = new ExitPreventor();
exitPreventor.setupPreventExit();

// Example: Register and complete work
setTimeout(() => {
  const workId = exitPreventor.registerWork('database-sync');

  setTimeout(() => {
    exitPreventor.completeWork(workId);
  }, 2000);
}, 3000);

// =============================================================================
// 5. Process Lifecycle Tracker
// =============================================================================

console.log('\n=== 5. Process Lifecycle Tracker ===\n');

class ProcessLifecycleTracker extends EventEmitter {
  constructor() {
    super();
    this.state = 'initializing';
    this.lifecycle = [];
    this.startTime = Date.now();
  }

  /**
   * Record lifecycle event
   */
  recordEvent(event, data = {}) {
    const record = {
      event,
      state: this.state,
      timestamp: Date.now(),
      uptime: process.uptime(),
      ...data
    };

    this.lifecycle.push(record);
    this.emit('lifecycle', record);

    console.log(`[Lifecycle] ${event.toUpperCase()}`);
    console.log(`  State: ${this.state}`);
    console.log(`  Uptime: ${Math.floor(record.uptime)}s`);

    if (Object.keys(data).length > 0) {
      console.log(`  Data:`, data);
    }

    console.log();
  }

  /**
   * Change state
   */
  changeState(newState) {
    const oldState = this.state;
    this.state = newState;

    this.recordEvent('state-change', {
      from: oldState,
      to: newState
    });
  }

  /**
   * Setup lifecycle tracking
   */
  setup() {
    this.recordEvent('process-start');
    this.changeState('running');

    // Track beforeExit
    process.on('beforeExit', (code) => {
      this.recordEvent('before-exit', { code });
      this.changeState('before-exit');
    });

    // Track exit
    process.on('exit', (code) => {
      this.recordEvent('exit', { code });
      this.changeState('exiting');

      // Print lifecycle summary
      this.printSummary();
    });

    // Track signals
    const signals = ['SIGTERM', 'SIGINT'];
    for (const signal of signals) {
      process.on(signal, () => {
        this.recordEvent('signal-received', { signal });
      });
    }

    console.log('[Lifecycle] Tracking initialized\n');
  }

  /**
   * Print lifecycle summary
   */
  printSummary() {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║  PROCESS LIFECYCLE SUMMARY                        ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log(`Total runtime: ${Math.floor((Date.now() - this.startTime) / 1000)}s`);
    console.log(`Total events: ${this.lifecycle.length}\n`);

    console.log('Timeline:');
    for (const record of this.lifecycle) {
      const time = new Date(record.timestamp).toISOString();
      console.log(`  [${time}] ${record.event} (${record.state})`);

      if (record.code !== undefined) {
        console.log(`    Exit code: ${record.code}`);
      }
      if (record.signal) {
        console.log(`    Signal: ${record.signal}`);
      }
      if (record.from && record.to) {
        console.log(`    State: ${record.from} → ${record.to}`);
      }
    }

    console.log();
  }

  /**
   * Get lifecycle data
   */
  getLifecycle() {
    return this.lifecycle;
  }
}

const lifecycleTracker = new ProcessLifecycleTracker();
lifecycleTracker.setup();

// Track application milestones
setTimeout(() => {
  lifecycleTracker.recordEvent('services-initialized');
}, 1000);

setTimeout(() => {
  lifecycleTracker.recordEvent('ready-to-serve');
}, 2000);

// =============================================================================
// 6. Advanced Exit Handler Pattern
// =============================================================================

console.log('\n=== 6. Advanced Exit Handler Pattern ===\n');

class AdvancedExitHandler {
  constructor() {
    this.exitCallbacks = new Map();
    this.exitInProgress = false;
    this.exitPromise = null;
  }

  /**
   * Register exit callback
   */
  onExit(name, callback, options = {}) {
    this.exitCallbacks.set(name, {
      callback,
      once: options.once !== false,
      priority: options.priority || 0,
      phase: options.phase || 'beforeExit' // 'beforeExit' or 'exit'
    });

    console.log(`[AdvancedExit] Registered: ${name} (phase: ${options.phase || 'beforeExit'})`);
  }

  /**
   * Setup exit handling
   */
  setup() {
    // Handle beforeExit
    process.on('beforeExit', async (code) => {
      const handlers = Array.from(this.exitCallbacks.entries())
        .filter(([, config]) => config.phase === 'beforeExit')
        .sort(([, a], [, b]) => b.priority - a.priority);

      console.log(`\n[AdvancedExit] beforeExit phase (${handlers.length} handlers)`);

      for (const [name, config] of handlers) {
        try {
          console.log(`  → ${name}`);
          await config.callback(code);

          if (config.once) {
            this.exitCallbacks.delete(name);
          }
        } catch (error) {
          console.error(`  ✗ ${name} error:`, error.message);
        }
      }
    });

    // Handle exit
    process.on('exit', (code) => {
      const handlers = Array.from(this.exitCallbacks.entries())
        .filter(([, config]) => config.phase === 'exit')
        .sort(([, a], [, b]) => b.priority - a.priority);

      console.log(`\n[AdvancedExit] exit phase (${handlers.length} handlers)`);

      for (const [name, config] of handlers) {
        try {
          console.log(`  → ${name}`);
          config.callback(code);

          if (config.once) {
            this.exitCallbacks.delete(name);
          }
        } catch (error) {
          console.error(`  ✗ ${name} error:`, error.message);
        }
      }
    });

    console.log('[AdvancedExit] Exit handling configured\n');
  }
}

const advancedExit = new AdvancedExitHandler();

// Register various exit handlers
advancedExit.onExit('cleanup-temp-files', async (code) => {
  console.log('    Cleaning temporary files...');
  await new Promise(resolve => setTimeout(resolve, 100));
}, { phase: 'beforeExit', priority: 100 });

advancedExit.onExit('send-metrics', async (code) => {
  console.log('    Sending final metrics...');
  await new Promise(resolve => setTimeout(resolve, 50));
}, { phase: 'beforeExit', priority: 50 });

advancedExit.onExit('log-exit', (code) => {
  console.log(`    Logging exit with code ${code}`);
}, { phase: 'exit', priority: 100 });

advancedExit.setup();

// =============================================================================
// Summary and Best Practices
// =============================================================================

console.log('\n=== Advanced Exit Handling Best Practices ===\n');

console.log(`
Exit Handling Guidelines:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. beforeExit Event:
   • Emitted when event loop is empty
   • CAN schedule async work
   • Can keep process alive
   • Called multiple times if async work scheduled
   • Use for async cleanup
   • Not emitted for explicit process.exit()

2. exit Event:
   • Emitted when process is about to exit
   • CANNOT schedule async work
   • Called exactly once
   • Only synchronous code allowed
   • Use for final logging
   • Emitted for all exit scenarios

3. Exit Code Conventions:
   • 0: Success
   • 1: General error
   • 2-127: Application-specific errors
   • 128+: Signal termination (128 + signal number)
   • Use process.exitCode instead of process.exit()

4. Cleanup Strategies:
   beforeExit (async allowed):
   • Close connections
   • Flush caches
   • Send final metrics
   • Save state

   exit (sync only):
   • Final logging
   • Print summary
   • Release handles
   • No async operations

5. Exit Prevention:
   • Use beforeExit to detect pending work
   • Schedule keepalive timers if needed
   • Track in-flight operations
   • Complete work before exit
   • Set maximum wait time

6. Handler Coordination:
   • Use priority for execution order
   • High priority = runs first
   • Group by phase (beforeExit/exit)
   • Handle errors gracefully
   • Allow individual failures

7. Lifecycle Tracking:
   • Record all significant events
   • Track state transitions
   • Log to persistent storage
   • Include timestamps
   • Generate exit summary

8. Process Exit Methods:
   • process.exit(code) - Immediate exit
   • process.exitCode = code - Set exit code, exit naturally
   • throw error - Exits with code 1
   • Signals - Exit with 128 + signal number

9. Testing Exit Handlers:
   • Test beforeExit with empty event loop
   • Test exit with process.exit()
   • Test with signals
   • Verify cleanup execution
   • Check exit codes

10. Production Patterns:
    • Always set process.exitCode
    • Log exit reason and code
    • Send metrics before exit
    • Coordinate with process manager
    • Handle timeouts in cleanup

Exit Scenarios:
───────────────
Normal exit:
  1. Event loop becomes empty
  2. beforeExit emitted
  3. If no new async work, exit emitted
  4. Process exits with code 0

Error exit:
  1. Uncaught exception or rejection
  2. exit emitted with code 1
  3. Process exits immediately

Signal exit:
  1. Signal received (SIGTERM, SIGINT, etc.)
  2. Signal handler executes
  3. exit emitted
  4. Process exits

Explicit exit:
  1. process.exit(code) called
  2. beforeExit NOT emitted
  3. exit emitted with code
  4. Process exits immediately

Current Process:
────────────────
PID: ${process.pid}
Exit Code: ${process.exitCode || 0}
Uptime: ${Math.floor(process.uptime())}s

Registered Handlers:
• beforeExit: ${cleanupCoordinator.beforeExitHandlers.length}
• exit: ${cleanupCoordinator.exitHandlers.length}

The process will demonstrate exit events when it naturally completes.
Try: kill ${process.pid} or Ctrl+C to see exit handling in action.
`);

console.log('\nExit handlers configured. Process will continue running...\n');

// Keep process alive for a while to demonstrate
const keepAlive = setInterval(() => {
  // Just keep alive
}, 5000);

// After some time, allow natural exit
setTimeout(() => {
  console.log('[Demo] Clearing keepalive timer to allow natural exit...');
  clearInterval(keepAlive);
  console.log('[Demo] Event loop will become empty, triggering beforeExit...\n');
}, 15000);
