# Process Lifecycle

## Introduction

This guide provides a comprehensive understanding of the Node.js process lifecycle. You'll learn about exit codes, process events, graceful shutdown strategies, and how to manage your application's startup and teardown properly.

---

## What is Process Lifecycle?

### Definition

Process lifecycle refers to the **complete journey** of your Node.js application from startup to shutdown, including all events and states in between.

```
┌─────────────────────────────────────┐
│     Process Lifecycle Stages        │
│                                     │
│  1. Startup                         │
│     ↓                               │
│  2. Initialization                  │
│     ↓                               │
│  3. Running                         │
│     ↓                               │
│  4. Shutdown Signal                 │
│     ↓                               │
│  5. Cleanup                         │
│     ↓                               │
│  6. Exit                            │
└─────────────────────────────────────┘
```

### Why It Matters

Proper lifecycle management ensures:
- **Clean startup** - Initialize resources properly
- **Graceful shutdown** - Close connections before exit
- **Meaningful exit codes** - Indicate success or failure
- **Error handling** - Respond to unexpected situations
- **Resource cleanup** - Prevent leaks and corruption

---

## Real-World Analogies

### Analogy 1: Restaurant Operations

**Your process is a restaurant:**

- **Startup** → Opening in the morning (turn on lights, prep kitchen)
- **Running** → Serving customers all day
- **Shutdown Signal** → Closing time announced
- **Cleanup** → Finish serving, clean tables, lock up
- **Exit** → Everyone leaves, lights off

You don't just abandon the restaurant - you close properly.

### Analogy 2: Airplane Flight

**Your process is an airplane:**

- **Startup** → Pre-flight checks, engines on
- **Running** → Flight in progress
- **Shutdown Signal** → Approach airport
- **Cleanup** → Land safely, taxi to gate
- **Exit** → Engines off, passengers disembark

Exit codes = success (safe landing) or failure (emergency).

### Analogy 3: Phone Call

**Your process is a phone call:**

- **Startup** → Dialing and connecting
- **Running** → Conversation
- **Shutdown Signal** → "I need to go"
- **Cleanup** → "Goodbye", final words
- **Exit** → Hang up

Graceful vs. abrupt disconnection.

---

## Process Events

Node.js processes emit several important events during their lifecycle.

### The Event Timeline

```javascript
// 1. Process starts
// (No event - process is running)

// 2. Exit initiated
process.on('beforeExit', (code) => {
  // Process about to exit
  // CAN schedule async work here
  console.log('beforeExit:', code);
});

// 3. Event loop empty (but not exiting)
process.on('beforeExit', (code) => {
  // Runs when event loop is empty
  // If you schedule work, process continues
});

// 4. Actually exiting
process.on('exit', (code) => {
  // Process is exiting RIGHT NOW
  // CANNOT schedule async work
  // Only synchronous cleanup
  console.log('exit:', code);
});

// Errors
process.on('uncaughtException', (err, origin) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
});

// Warnings
process.on('warning', (warning) => {
  console.warn('Warning:', warning);
});

// Signals (Unix/Linux)
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
});

process.on('SIGINT', () => {
  console.log('SIGINT received (Ctrl+C)');
});
```

---

## Exit Events in Detail

### `beforeExit` Event

Emitted when the event loop is empty and there's no more work to do.

```javascript
process.on('beforeExit', (code) => {
  console.log('beforeExit event, code:', code);

  // CAN schedule async work
  setTimeout(() => {
    console.log('Async work from beforeExit');
  }, 100);

  // This will keep the process alive!
});

console.log('Starting...');
// Output:
// Starting...
// beforeExit event, code: 0
// Async work from beforeExit
// beforeExit event, code: 0  (again!)
```

**Key characteristics:**
- Can schedule async work
- Process will continue if work is scheduled
- Won't fire if `process.exit()` called explicitly
- Code is always 0 or process.exitCode

### `exit` Event

Emitted when the process is about to exit.

```javascript
process.on('exit', (code) => {
  console.log('Process exiting with code:', code);

  // ONLY synchronous code
  console.log('Cleanup done');

  // CANNOT schedule async work
  setTimeout(() => {
    console.log('This will NEVER run');
  }, 100);
});

console.log('Starting...');
// Output:
// Starting...
// Process exiting with code: 0
// Cleanup done
```

**Key characteristics:**
- Only synchronous code works
- Cannot prevent exit
- Always fires before process terminates
- Last chance for cleanup

### Comparison: beforeExit vs exit

```javascript
// beforeExit: Can extend process life
process.on('beforeExit', (code) => {
  console.log('beforeExit:', code);
  // Can do async work
  fs.writeFile('log.txt', 'done', () => {
    console.log('Async write complete');
  });
  // Process waits for this
});

// exit: Last moment, sync only
process.on('exit', (code) => {
  console.log('exit:', code);
  // Only sync work
  fs.writeFileSync('log.txt', 'done');
  console.log('Sync write complete');
  // Process exits immediately after
});
```

---

## Exit Codes

### What Are Exit Codes?

Exit codes are **numbers** that indicate how your process terminated:
- `0` = Success
- `non-zero` = Error

```javascript
// Exit with success
process.exit(0);

// Exit with error
process.exit(1);

// Different error codes
process.exit(2);  // Custom error code
```

### Standard Exit Codes

```javascript
// Success
const EXIT_SUCCESS = 0;

// Generic error
const EXIT_FAILURE = 1;

// Common error codes (by convention)
const EXIT_CODE = {
  SUCCESS: 0,
  GENERIC_ERROR: 1,
  MISUSE: 2,              // Command misused
  CANNOT_EXECUTE: 126,     // Permission problem
  COMMAND_NOT_FOUND: 127,  // Command not found
  INVALID_EXIT: 128,       // Invalid exit argument
  SIGINT: 130,            // Ctrl+C (128 + 2)
  SIGTERM: 143,           // Terminated (128 + 15)
};

// Usage
if (args.length === 0) {
  console.error('Error: Missing arguments');
  process.exit(EXIT_CODE.MISUSE);
}
```

### Setting Exit Code

Two ways to set the exit code:

```javascript
// Method 1: process.exit(code)
// Immediately exits
if (error) {
  console.error('Fatal error');
  process.exit(1);
}

// Method 2: process.exitCode
// Sets code but doesn't exit immediately
if (error) {
  console.error('Error occurred');
  process.exitCode = 1;
  // Process continues, exits naturally with code 1
}
```

### Why Two Methods?

```javascript
// process.exit() - Immediate, abrupt
process.exit(1);
console.log('Never runs');

// process.exitCode - Graceful
process.exitCode = 1;
console.log('This runs');
// Async work completes
setTimeout(() => {
  console.log('This also runs');
}, 100);
// Then exits with code 1
```

### Exit Code Best Practices

```javascript
// Define exit codes as constants
const EXIT_CODE = {
  SUCCESS: 0,
  INVALID_ARGS: 1,
  FILE_NOT_FOUND: 2,
  PERMISSION_DENIED: 3,
  NETWORK_ERROR: 4,
  DATABASE_ERROR: 5,
};

function main() {
  try {
    // Your application logic
    const result = run();

    if (!result) {
      process.exitCode = EXIT_CODE.INVALID_ARGS;
      return;
    }

    // Success
    process.exitCode = EXIT_CODE.SUCCESS;
  } catch (err) {
    console.error('Error:', err.message);

    // Set appropriate exit code based on error
    if (err.code === 'ENOENT') {
      process.exitCode = EXIT_CODE.FILE_NOT_FOUND;
    } else if (err.code === 'EACCES') {
      process.exitCode = EXIT_CODE.PERMISSION_DENIED;
    } else {
      process.exitCode = EXIT_CODE.GENERIC_ERROR;
    }
  }
}

main();
```

---

## Signal Handling

### What Are Signals?

Signals are **notifications** sent to your process by the operating system or other processes.

```javascript
// Common signals
SIGINT   // Interrupt (Ctrl+C)
SIGTERM  // Termination request
SIGQUIT  // Quit (Ctrl+\)
SIGKILL  // Force kill (cannot catch)
SIGHUP   // Hangup (terminal closed)
SIGUSR1  // User-defined signal 1
SIGUSR2  // User-defined signal 2
```

### Handling Signals

```javascript
// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('Received SIGINT');
  process.exit(0);
});

// Handle SIGTERM (graceful shutdown)
process.on('SIGTERM', () => {
  console.log('Received SIGTERM');
  gracefulShutdown();
});

// Multiple handlers
process.on('SIGINT', handler1);
process.on('SIGINT', handler2);
// Both run
```

### Platform Differences

```javascript
// Signals work on Unix/Linux/Mac
if (process.platform !== 'win32') {
  process.on('SIGTERM', handleShutdown);
  process.on('SIGHUP', handleReload);
}

// Windows has limited signal support
// SIGINT and SIGBREAK work
process.on('SIGINT', handleShutdown);  // Works on Windows
process.on('SIGBREAK', handleShutdown); // Windows Ctrl+Break
```

### Signal Best Practices

```javascript
// Handle common signals for graceful shutdown
const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

signals.forEach(signal => {
  process.on(signal, () => {
    console.log(`Received ${signal}`);
    gracefulShutdown();
  });
});

async function gracefulShutdown() {
  console.log('Starting graceful shutdown...');

  try {
    // Close servers
    await closeServer();

    // Close database connections
    await closeDatabase();

    // Finish pending work
    await finishPendingWork();

    console.log('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}
```

---

## Error Events

### `uncaughtException` Event

Catches unhandled synchronous errors:

```javascript
process.on('uncaughtException', (err, origin) => {
  console.error('Uncaught Exception:');
  console.error('Error:', err);
  console.error('Origin:', origin);

  // Log error
  fs.writeFileSync('error.log', err.stack);

  // Exit (recommended)
  process.exit(1);
});

// This error will be caught
throw new Error('Oops!');
```

**Warning:** After an uncaught exception, the application is in an **undefined state**. Best practice is to log and exit.

```javascript
// DANGEROUS: Continuing after uncaught exception
process.on('uncaughtException', (err) => {
  console.error('Error:', err);
  // Continue running (RISKY!)
});

// SAFER: Log and exit
process.on('uncaughtException', (err) => {
  console.error('Fatal error:', err);

  // Log to monitoring service
  logger.fatal(err);

  // Exit
  process.exit(1);
});
```

### `unhandledRejection` Event

Catches unhandled promise rejections:

```javascript
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:');
  console.error('Promise:', promise);
  console.error('Reason:', reason);

  // Log and potentially exit
  process.exit(1);
});

// This rejection will be caught
Promise.reject(new Error('Rejected!'));

// Or async function without try/catch
async function riskyOperation() {
  throw new Error('Async error');
}
riskyOperation(); // No .catch() - will be caught by handler
```

### Future-Proof Error Handling

```javascript
// Node.js will eventually make unhandled rejections fatal
// Set this to be future-proof
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);

  // Treat as fatal
  process.exit(1);
});

// Or use this flag (Node.js 15+)
// node --unhandled-rejections=strict app.js
```

---

## Graceful Shutdown

### Why Graceful Shutdown?

Without graceful shutdown:
- Database connections left open
- Files not closed
- Pending requests dropped
- Data corruption possible
- Resources leaked

With graceful shutdown:
- Close connections properly
- Finish pending work
- Save state
- Clean exit

### Basic Graceful Shutdown

```javascript
// shutdown.js
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log('Shutdown already in progress');
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}, starting graceful shutdown`);

  try {
    // 1. Stop accepting new work
    console.log('Stopping server...');
    await stopAcceptingRequests();

    // 2. Finish existing work
    console.log('Finishing pending work...');
    await finishPendingWork();

    // 3. Close connections
    console.log('Closing connections...');
    await closeConnections();

    console.log('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

// Handle signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### Complete Example: HTTP Server

```javascript
// server.js
const http = require('http');

const server = http.createServer((req, res) => {
  // Simulate async work
  setTimeout(() => {
    res.writeHead(200);
    res.end('Hello World\n');
  }, 100);
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

// Track active connections
const connections = new Set();

server.on('connection', (conn) => {
  connections.add(conn);

  conn.on('close', () => {
    connections.remove(conn);
  });
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  // Stop accepting new connections
  server.close(() => {
    console.log('Server closed');
  });

  // Close idle connections
  connections.forEach(conn => {
    // If no request is active, destroy the connection
    if (!conn._httpMessage) {
      conn.destroy();
    }
  });

  // Wait for existing requests to finish
  const timeout = setTimeout(() => {
    console.error('Shutdown timeout, forcing exit');
    connections.forEach(conn => conn.destroy());
    process.exit(1);
  }, 10000); // 10 second timeout

  // Wait for server to fully close
  await new Promise((resolve) => {
    server.on('close', resolve);
  });

  clearTimeout(timeout);
  console.log('Graceful shutdown complete');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### Shutdown with Multiple Resources

```javascript
// app.js
class Application {
  constructor() {
    this.server = null;
    this.database = null;
    this.redis = null;
    this.isShuttingDown = false;
  }

  async start() {
    // Initialize resources
    this.database = await connectDatabase();
    this.redis = await connectRedis();
    this.server = await startServer();

    console.log('Application started');

    // Setup shutdown handlers
    this.setupShutdownHandlers();
  }

  setupShutdownHandlers() {
    const signals = ['SIGTERM', 'SIGINT'];

    signals.forEach(signal => {
      process.on(signal, () => {
        console.log(`Received ${signal}`);
        this.shutdown();
      });
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      this.shutdown(1);
    });

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
      this.shutdown(1);
    });
  }

  async shutdown(exitCode = 0) {
    if (this.isShuttingDown) {
      console.log('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    console.log('Starting graceful shutdown...');

    // Set timeout for forced shutdown
    const forceTimeout = setTimeout(() => {
      console.error('Shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, 30000); // 30 seconds

    try {
      // Close in reverse order of initialization
      if (this.server) {
        console.log('Closing HTTP server...');
        await this.closeServer();
      }

      if (this.redis) {
        console.log('Closing Redis connection...');
        await this.redis.quit();
      }

      if (this.database) {
        console.log('Closing database connection...');
        await this.database.close();
      }

      clearTimeout(forceTimeout);
      console.log('Graceful shutdown complete');
      process.exit(exitCode);
    } catch (err) {
      console.error('Error during shutdown:', err);
      clearTimeout(forceTimeout);
      process.exit(1);
    }
  }

  closeServer() {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Start application
const app = new Application();
app.start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
```

---

## Best Practices

### 1. Always Handle Shutdown Signals

```javascript
// GOOD: Handle common signals
['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(signal => {
  process.on(signal, gracefulShutdown);
});

// BAD: No signal handling (ungraceful exit)
// (no handlers)
```

### 2. Set Appropriate Exit Codes

```javascript
// GOOD: Meaningful exit codes
if (error) {
  console.error(error);
  process.exit(1); // Indicates error
}

// BAD: Always exit 0
process.exit(0); // Looks like success even with errors
```

### 3. Use Timeouts for Shutdown

```javascript
// GOOD: Prevent hanging
async function shutdown() {
  const timeout = setTimeout(() => {
    console.error('Shutdown timeout, forcing exit');
    process.exit(1);
  }, 10000);

  await cleanup();
  clearTimeout(timeout);
  process.exit(0);
}

// BAD: Could hang forever
async function shutdown() {
  await cleanup(); // What if this never resolves?
  process.exit(0);
}
```

### 4. Cleanup in Reverse Order

```javascript
// GOOD: Close in reverse order of opening
async function startup() {
  const db = await connectDatabase();
  const cache = await connectCache();
  const server = await startServer();
  return { db, cache, server };
}

async function shutdown({ server, cache, db }) {
  await server.close();   // Close last opened first
  await cache.quit();
  await db.close();
}

// Ensures dependencies close before their dependents
```

### 5. Handle Errors During Shutdown

```javascript
// GOOD: Handle errors gracefully
async function shutdown() {
  try {
    await server.close();
  } catch (err) {
    console.error('Error closing server:', err);
  }

  try {
    await db.close();
  } catch (err) {
    console.error('Error closing database:', err);
  }

  process.exit(0);
}

// BAD: One error stops all cleanup
async function shutdown() {
  await server.close();  // If this throws, db never closes
  await db.close();
  process.exit(0);
}
```

### 6. Log Lifecycle Events

```javascript
// GOOD: Log important events
console.log('Application starting...');

process.on('SIGTERM', () => {
  console.log('SIGTERM received, starting shutdown');
});

process.on('exit', (code) => {
  console.log(`Process exiting with code ${code}`);
});

// Helps with debugging and monitoring
```

---

## Common Pitfalls

### Pitfall 1: Not Handling Signals

```javascript
// PROBLEM: Process killed abruptly
// No signal handlers - Ctrl+C kills immediately

// SOLUTION: Handle signals
process.on('SIGINT', () => {
  console.log('Shutting down gracefully');
  cleanup();
  process.exit(0);
});
```

### Pitfall 2: Async Work in 'exit' Event

```javascript
// PROBLEM: Async work ignored
process.on('exit', () => {
  // This NEVER completes
  setTimeout(() => {
    console.log('Never runs');
  }, 100);
});

// SOLUTION: Use 'beforeExit' for async work
process.on('beforeExit', async () => {
  await cleanup(); // This works
});
```

### Pitfall 3: Forgetting process.exit()

```javascript
// PROBLEM: Process hangs
process.on('SIGTERM', async () => {
  await cleanup();
  // Forgot process.exit() - process might not exit!
});

// SOLUTION: Always call process.exit()
process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0); // Actually exit
});
```

### Pitfall 4: No Shutdown Timeout

```javascript
// PROBLEM: Hangs during shutdown
async function shutdown() {
  await someOperation(); // What if this never resolves?
  process.exit(0);
}

// SOLUTION: Add timeout
async function shutdown() {
  const timeout = setTimeout(() => {
    console.error('Forced exit');
    process.exit(1);
  }, 10000);

  await someOperation();
  clearTimeout(timeout);
  process.exit(0);
}
```

### Pitfall 5: Continuing After uncaughtException

```javascript
// PROBLEM: Undefined state
process.on('uncaughtException', (err) => {
  console.error(err);
  // Continue running (DANGEROUS!)
});

// SOLUTION: Log and exit
process.on('uncaughtException', (err) => {
  console.error('Fatal error:', err);
  process.exit(1); // Exit after logging
});
```

---

## Testing Lifecycle Events

### Testing Exit Codes

```javascript
// test-exit.js
const { spawn } = require('child_process');

function testExitCode(script, expectedCode) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [script]);

    child.on('exit', (code) => {
      if (code === expectedCode) {
        console.log(`✓ Exit code ${code} as expected`);
        resolve();
      } else {
        console.error(`✗ Expected ${expectedCode}, got ${code}`);
        reject();
      }
    });
  });
}

// Test scripts
testExitCode('success.js', 0);
testExitCode('error.js', 1);
```

### Testing Signal Handling

```javascript
// test-signal.js
const { spawn } = require('child_process');

function testSignal(script, signal) {
  return new Promise((resolve) => {
    const child = spawn('node', [script]);

    setTimeout(() => {
      child.kill(signal);
    }, 1000);

    child.on('exit', (code, sig) => {
      console.log(`Process exited with code ${code}, signal ${sig}`);
      resolve();
    });
  });
}

testSignal('server.js', 'SIGTERM');
testSignal('server.js', 'SIGINT');
```

---

## Summary

### Key Takeaways

1. **Events** - beforeExit (async OK), exit (sync only)
2. **Exit codes** - 0 for success, non-zero for errors
3. **Signals** - Handle SIGTERM, SIGINT for graceful shutdown
4. **Cleanup** - Always clean up resources before exit
5. **Timeouts** - Prevent hanging during shutdown
6. **Error handling** - Catch uncaught exceptions and rejections

### Lifecycle Checklist

```javascript
// ✅ Complete lifecycle management

// 1. Signal handlers
['SIGTERM', 'SIGINT'].forEach(signal => {
  process.on(signal, gracefulShutdown);
});

// 2. Error handlers
process.on('uncaughtException', (err) => {
  logger.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(reason);
  process.exit(1);
});

// 3. Graceful shutdown
async function gracefulShutdown() {
  const timeout = setTimeout(() => {
    process.exit(1);
  }, 10000);

  await cleanup();
  clearTimeout(timeout);
  process.exit(0);
}

// 4. Exit event
process.on('exit', (code) => {
  logger.info(`Exiting with code ${code}`);
});
```

---

## Quick Reference

```javascript
// Exit
process.exit(0)           // Exit immediately with code
process.exitCode = 1      // Set code, exit naturally

// Events
process.on('beforeExit', fn)           // Async OK
process.on('exit', fn)                 // Sync only
process.on('uncaughtException', fn)    // Unhandled errors
process.on('unhandledRejection', fn)   // Unhandled promises

// Signals
process.on('SIGTERM', fn)  // Graceful shutdown
process.on('SIGINT', fn)   // Ctrl+C
process.on('SIGQUIT', fn)  // Ctrl+\

// Exit codes
0    // Success
1    // Generic error
2    // Misuse
130  // SIGINT (128 + 2)
143  // SIGTERM (128 + 15)

// Graceful shutdown pattern
async function shutdown() {
  const timeout = setTimeout(() => process.exit(1), 10000);
  await cleanup();
  clearTimeout(timeout);
  process.exit(0);
}
```

You've completed the Process Lifecycle guide! You now understand how to manage the complete lifecycle of Node.js applications, from startup to graceful shutdown.

## Further Learning

To deepen your understanding:
1. Practice implementing graceful shutdown in your applications
2. Test different signal handling scenarios
3. Experiment with exit codes in different error conditions
4. Build CLI tools that properly handle lifecycle events
5. Study production-grade applications to see real-world patterns
