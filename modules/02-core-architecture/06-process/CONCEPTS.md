# Process Concepts

This document explains the fundamental concepts behind the Node.js process object. Understanding these concepts is essential for building production-ready applications that can properly manage their lifecycle, resources, and interactions with the operating system.

---

## Table of Contents

1. [What Is the Process Object?](#what-is-the-process-object)
2. [Why Process Management Matters](#why-process-management-matters)
3. [Environment Variables](#environment-variables)
4. [Command-Line Arguments](#command-line-arguments)
5. [Standard Streams](#standard-streams)
6. [Process Signals](#process-signals)
7. [Exit Codes](#exit-codes)
8. [Process Events](#process-events)
9. [Resource Monitoring](#resource-monitoring)
10. [Graceful Shutdown](#graceful-shutdown)
11. [Error Handling](#error-handling)
12. [Common Mental Models](#common-mental-models)

---

## What Is the Process Object?

### Definition

The **process** object is a global object in Node.js that provides information about and control over the current Node.js process. It's an instance of EventEmitter and provides various properties, methods, and events for process management.

### The Core Idea

Think of the process object as the control panel for your Node.js application:
- It tells you about the environment your code is running in
- It lets you read configuration from environment variables
- It handles signals from the operating system
- It provides information about resource usage
- It allows you to control how your application exits

### Real-World Analogy

**Process Object is like a Car's Dashboard:**
```
Just like a car dashboard shows:
- Speed (current performance)
- Fuel level (memory usage)
- Temperature (CPU usage)
- Warning lights (errors and warnings)
- Controls (steering, pedals = exit, signals)

The process object shows and controls your application.
```

### Key Characteristics

```javascript
// 1. It's a global - no require needed
console.log(process.version); // Works immediately

// 2. It's an EventEmitter
process.on('exit', () => {
  console.log('Process is exiting');
});

// 3. It provides system information
console.log(process.platform); // 'linux', 'darwin', 'win32'
console.log(process.arch);     // 'x64', 'arm', etc.

// 4. It allows interaction with the OS
process.exit(0); // Exit the process
```

---

## Why Process Management Matters

### 1. Configuration Without Code Changes

**Problem:** Different environments (dev, staging, prod) need different settings.

**Solution:** Environment variables via `process.env`.

```javascript
// Same code works everywhere
const config = {
  port: process.env.PORT || 3000,
  database: process.env.DATABASE_URL,
  apiKey: process.env.API_KEY
};

// Development: PORT=3000 node app.js
// Production: PORT=8080 node app.js
```

### 2. Graceful Shutdown

**Problem:** Abrupt termination can lose data or corrupt state.

**Solution:** Handle shutdown signals properly.

```javascript
// Save state before exiting
process.on('SIGTERM', async () => {
  await saveDataToDatabase();
  await closeConnections();
  process.exit(0);
});
```

### 3. Resource Monitoring

**Problem:** Need to know if application is using too much memory or CPU.

**Solution:** Monitor process resources.

```javascript
// Check memory usage
const usage = process.memoryUsage();
if (usage.heapUsed > MAX_MEMORY) {
  console.warn('Memory usage too high!');
  triggerGarbageCollection();
}
```

### 4. Error Recovery

**Problem:** Unhandled errors can crash the entire application.

**Solution:** Catch and handle process-level errors.

```javascript
// Prevent unexpected crashes
process.on('uncaughtException', (err) => {
  console.error('Fatal error:', err);
  // Cleanup and restart
  process.exit(1);
});
```

---

## Environment Variables

### What Are Environment Variables?

Environment variables are key-value pairs provided by the operating system to configure applications without changing code.

### How They Work

```
┌──────────────────┐
│  Operating System │
│  FOO=bar         │
│  PORT=3000       │
└────────┬─────────┘
         │ Environment
         ↓
┌────────────────────┐
│  Node.js Process   │
│  process.env.FOO   │ → "bar"
│  process.env.PORT  │ → "3000"
└────────────────────┘
```

### Common Use Cases

```javascript
// 1. Configuration
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;

// 2. Environment Detection
const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';

// 3. Feature Flags
const enableNewFeature = process.env.ENABLE_NEW_FEATURE === 'true';

// 4. Secrets (API keys, tokens)
const apiKey = process.env.API_KEY;
const secret = process.env.JWT_SECRET;
```

### Setting Environment Variables

```bash
# Linux/macOS - inline
PORT=3000 node app.js

# Linux/macOS - export
export PORT=3000
node app.js

# Windows - set
set PORT=3000
node app.js

# Using .env file (with dotenv package)
# .env file:
PORT=3000
DATABASE_URL=postgres://localhost/mydb

# Load with:
require('dotenv').config();
console.log(process.env.PORT); // "3000"
```

### Best Practices

```javascript
// ✅ Provide defaults
const port = process.env.PORT || 3000;

// ✅ Validate required variables
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

// ✅ Parse types correctly
const maxConnections = parseInt(process.env.MAX_CONNECTIONS || '10', 10);
const enableCache = process.env.ENABLE_CACHE === 'true';

// ❌ Don't commit secrets
// Use .env files and add .env to .gitignore
```

---

## Command-Line Arguments

### What Are Command-Line Arguments?

Arguments passed to your program when it's executed from the command line.

### process.argv Structure

```javascript
// Command: node app.js --port 3000 --verbose
console.log(process.argv);
/* Output:
[
  '/usr/local/bin/node',           // [0] Node executable path
  '/home/user/app.js',              // [1] Script path
  '--port',                         // [2] First argument
  '3000',                           // [3] Second argument
  '--verbose'                       // [4] Third argument
]
*/

// Get only user arguments
const args = process.argv.slice(2);
console.log(args); // ['--port', '3000', '--verbose']
```

### Parsing Arguments

```javascript
// Simple parsing
function parseArgs(args) {
  const parsed = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];
      parsed[key] = value;
      i++; // Skip next item
    }
  }

  return parsed;
}

// node app.js --port 3000 --host localhost
const options = parseArgs(process.argv.slice(2));
console.log(options); // { port: '3000', host: 'localhost' }
```

### Common Patterns

```javascript
// 1. Help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node app.js [options]');
  console.log('Options:');
  console.log('  --port <number>  Server port (default: 3000)');
  console.log('  --help, -h       Show this help message');
  process.exit(0);
}

// 2. Version flag
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log('v1.0.0');
  process.exit(0);
}

// 3. Boolean flags
const verbose = process.argv.includes('--verbose');
const debug = process.argv.includes('--debug');
```

---

## Standard Streams

### The Three Standard Streams

Node.js provides three streams for input/output:

```javascript
// 1. stdin (Standard Input) - Readable stream
process.stdin.on('data', (data) => {
  console.log('Received:', data.toString());
});

// 2. stdout (Standard Output) - Writable stream
process.stdout.write('Hello, World!\n');

// 3. stderr (Standard Error) - Writable stream
process.stderr.write('Error occurred!\n');
```

### Stream Characteristics

```
┌─────────────────┐
│  Your Terminal  │
└────────┬────────┘
         │
    ┌────┼────┐
    ↓    ↓    ↓
  stdin stdout stderr
    ↓    ↓    ↓
┌────────────────────┐
│  Node.js Process   │
└────────────────────┘
```

### Common Use Cases

```javascript
// 1. Reading from stdin (interactive input)
process.stdin.setEncoding('utf8');
process.stdin.on('data', (input) => {
  const text = input.trim();
  if (text === 'exit') {
    process.exit(0);
  }
  console.log('You said:', text);
});

// 2. Writing to stdout (normal output)
console.log('Info'); // Uses stdout
process.stdout.write('Direct write\n');

// 3. Writing to stderr (errors and warnings)
console.error('Error!'); // Uses stderr
process.stderr.write('Warning!\n');

// 4. Piping (UNIX pipes)
// cat file.txt | node filter.js | sort
process.stdin
  .pipe(transformStream)
  .pipe(process.stdout);
```

### Why Three Streams?

```bash
# Separate output from errors
node app.js > output.txt 2> errors.txt

# Only errors to file
node app.js 2> errors.txt

# Suppress errors
node app.js 2> /dev/null

# Chain programs
echo "hello" | node uppercase.js | node reverse.js
```

---

## Process Signals

### What Are Signals?

Signals are asynchronous notifications sent to processes by the operating system or other processes.

### Common Signals

| Signal    | Trigger              | Default Action | Use Case                |
|-----------|---------------------|----------------|-------------------------|
| SIGINT    | Ctrl+C              | Terminate      | User interruption       |
| SIGTERM   | kill command        | Terminate      | Graceful shutdown       |
| SIGKILL   | kill -9             | Force kill     | Cannot be caught        |
| SIGHUP    | Terminal closed     | Terminate      | Reload configuration    |
| SIGUSR1   | User-defined        | Terminate      | Custom actions          |
| SIGUSR2   | User-defined        | Terminate      | Custom actions          |

### Signal Handling

```javascript
// Handle SIGTERM (graceful shutdown)
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');

  // Cleanup operations
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\nSIGINT received, exiting...');
  process.exit(0);
});

// Handle SIGHUP (reload config)
process.on('SIGHUP', () => {
  console.log('SIGHUP received, reloading config');
  reloadConfiguration();
});
```

### Signal Flow

```
┌──────────────┐
│   Terminal   │  (User presses Ctrl+C)
└──────┬───────┘
       │ SIGINT
       ↓
┌────────────────────┐
│  Operating System  │  (Sends signal to process)
└──────┬─────────────┘
       │ SIGINT
       ↓
┌────────────────────┐
│  Node.js Process   │  (Receives signal)
│                    │
│  process.on('SIGINT', handler)
└────────────────────┘
```

### Graceful Shutdown Pattern

```javascript
const shutdown = (signal) => {
  console.log(`${signal} received. Starting graceful shutdown...`);

  // 1. Stop accepting new requests
  server.close((err) => {
    if (err) {
      console.error('Error closing server:', err);
      process.exit(1);
    }

    console.log('Server closed');

    // 2. Close database connections
    database.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
        process.exit(1);
      }

      console.log('Database closed');
      process.exit(0);
    });
  });

  // 3. Force exit after timeout
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Register signal handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

---

## Exit Codes

### What Are Exit Codes?

Exit codes (status codes) indicate how a process terminated. They're used by shells and orchestrators to determine if a process succeeded or failed.

### Common Exit Codes

| Code | Meaning                  | Use Case                           |
|------|--------------------------|-------------------------------------|
| 0    | Success                  | Normal, successful termination      |
| 1    | General error            | Catch-all for general errors        |
| 2    | Misuse                   | Invalid command-line arguments      |
| 3-125| Custom errors            | Application-specific errors         |
| 126  | Cannot execute           | Permission problem                  |
| 127  | Command not found        | Invalid command                     |
| 128+n| Fatal signal             | Process killed by signal n          |
| 130  | Ctrl+C (128+2)           | Terminated by SIGINT                |

### Using Exit Codes

```javascript
// Success
process.exit(0);

// General failure
process.exit(1);

// Custom error codes
const EXIT_CODES = {
  SUCCESS: 0,
  CONFIG_ERROR: 2,
  DATABASE_ERROR: 3,
  NETWORK_ERROR: 4,
  VALIDATION_ERROR: 5
};

// Validate config
if (!config.apiKey) {
  console.error('API key not found');
  process.exit(EXIT_CODES.CONFIG_ERROR);
}

// Check database connection
try {
  await connectToDatabase();
} catch (err) {
  console.error('Database connection failed:', err);
  process.exit(EXIT_CODES.DATABASE_ERROR);
}
```

### Shell Usage

```bash
# Check exit code in shell
node app.js
echo $? # Prints exit code (0 = success)

# Conditional execution based on exit code
node build.js && node test.js && node deploy.js

# Run only if previous failed
node test.js || echo "Tests failed!"

# Docker/Kubernetes health checks
HEALTHCHECK CMD node health-check.js || exit 1
```

### Process.exitCode vs process.exit()

```javascript
// Method 1: process.exit() - immediate
process.exit(1); // Exits immediately

// Method 2: process.exitCode - deferred
process.exitCode = 1; // Sets code, continues execution
// Process exits naturally with code 1

// Why use exitCode?
process.on('exit', (code) => {
  console.log('Exiting with code:', code);
  // Can do sync cleanup here
});

process.exitCode = 1; // Exit event still fires
// process.exit(1); // Exit event might not fire in time
```

---

## Process Events

### Event Lifecycle

```javascript
// 1. Process starts
console.log('Process started');

// 2. beforeExit - event loop is empty
process.on('beforeExit', (code) => {
  console.log('Process beforeExit with code:', code);
  // Can schedule async work here
});

// 3. exit - process is about to exit
process.on('exit', (code) => {
  console.log('Process exit with code:', code);
  // Only sync code here - event loop is stopped
});

// 4. Process ends
```

### Important Events

```javascript
// 1. uncaughtException - unhandled error
process.on('uncaughtException', (err, origin) => {
  console.error('Uncaught Exception:', err);
  console.error('Exception origin:', origin);
  // Cleanup and exit
  process.exit(1);
});

// 2. unhandledRejection - promise rejected without .catch()
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Handle the error
});

// 3. warning - process warning
process.on('warning', (warning) => {
  console.warn('Warning:', warning.name);
  console.warn('Message:', warning.message);
  console.warn('Stack:', warning.stack);
});

// 4. message - IPC message (from parent process)
process.on('message', (message) => {
  console.log('Received message:', message);
});
```

### Event Order Example

```javascript
console.log('1. Start');

process.on('exit', () => {
  console.log('4. exit event');
});

process.on('beforeExit', () => {
  console.log('3. beforeExit event');
});

setTimeout(() => {
  console.log('2. Timeout callback');
}, 0);

// Output:
// 1. Start
// 2. Timeout callback
// 3. beforeExit event
// 4. exit event
```

---

## Resource Monitoring

### Memory Usage

```javascript
const usage = process.memoryUsage();

console.log('Memory Usage:');
console.log('  RSS:', usage.rss);           // Resident Set Size - total memory
console.log('  Heap Total:', usage.heapTotal); // V8 heap allocated
console.log('  Heap Used:', usage.heapUsed);   // V8 heap used
console.log('  External:', usage.external);    // C++ objects bound to JS
console.log('  Array Buffers:', usage.arrayBuffers); // ArrayBuffer/SharedArrayBuffer

// Convert to MB
const toMB = (bytes) => Math.round(bytes / 1024 / 1024 * 100) / 100;

console.log(`\nHeap Used: ${toMB(usage.heapUsed)} MB`);
console.log(`Total Memory: ${toMB(usage.rss)} MB`);
```

### CPU Usage

```javascript
const startUsage = process.cpuUsage();

// Do some work
doHeavyComputation();

const usage = process.cpuUsage(startUsage);

console.log('CPU Usage:');
console.log('  User:', usage.user);   // Microseconds in user mode
console.log('  System:', usage.system); // Microseconds in system mode

// Convert to seconds
const userSeconds = usage.user / 1000000;
const systemSeconds = usage.system / 1000000;
console.log(`Total CPU time: ${userSeconds + systemSeconds}s`);
```

### Uptime

```javascript
// How long the process has been running
const uptime = process.uptime();

console.log(`Process uptime: ${uptime} seconds`);
console.log(`Process uptime: ${Math.floor(uptime / 60)} minutes`);

// Format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${mins}m ${secs}s`;
}

console.log(`Uptime: ${formatUptime(process.uptime())}`);
```

### Process Information

```javascript
// Basic info
console.log('Process ID:', process.pid);
console.log('Parent PID:', process.ppid);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Node Version:', process.version);
console.log('V8 Version:', process.versions.v8);

// Current directory
console.log('Current Directory:', process.cwd());

// Change directory
process.chdir('/tmp');
console.log('New Directory:', process.cwd());

// User info (Unix only)
console.log('User ID:', process.getuid?.());
console.log('Group ID:', process.getgid?.());
```

---

## Graceful Shutdown

### Why Graceful Shutdown?

**Without graceful shutdown:**
- Active requests are dropped
- Database transactions are interrupted
- Files may be corrupted
- Connections left open
- Data loss occurs

**With graceful shutdown:**
- Complete active requests
- Close connections cleanly
- Save state
- Log shutdown reason
- Exit with proper code

### Implementation Pattern

```javascript
class Application {
  constructor() {
    this.isShuttingDown = false;
    this.server = null;
    this.database = null;
  }

  async start() {
    // Start services
    this.database = await connectToDatabase();
    this.server = createServer();

    // Register shutdown handlers
    this.registerShutdownHandlers();

    this.server.listen(3000);
    console.log('Application started');
  }

  registerShutdownHandlers() {
    // Handle termination signals
    const shutdown = (signal) => this.gracefulShutdown(signal);

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', async (err) => {
      console.error('Uncaught Exception:', err);
      await this.gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', async (reason) => {
      console.error('Unhandled Rejection:', reason);
      await this.gracefulShutdown('unhandledRejection');
    });
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) {
      console.log('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    // Set a timeout for forced shutdown
    const forceExitTimer = setTimeout(() => {
      console.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 30000); // 30 second timeout

    try {
      // 1. Stop accepting new connections
      if (this.server) {
        console.log('Closing server...');
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        console.log('Server closed');
      }

      // 2. Close database connections
      if (this.database) {
        console.log('Closing database...');
        await this.database.close();
        console.log('Database closed');
      }

      // 3. Other cleanup tasks
      console.log('Cleanup completed');

      clearTimeout(forceExitTimer);
      console.log('Graceful shutdown completed');
      process.exit(0);

    } catch (err) {
      console.error('Error during shutdown:', err);
      clearTimeout(forceExitTimer);
      process.exit(1);
    }
  }
}

// Usage
const app = new Application();
app.start().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
```

---

## Error Handling

### Three Levels of Error Handling

```javascript
// 1. Try-Catch (Synchronous Errors)
try {
  const data = JSON.parse(invalidJson);
} catch (err) {
  console.error('Parse error:', err);
}

// 2. Promise Rejections (Asynchronous Errors)
asyncFunction()
  .catch((err) => {
    console.error('Async error:', err);
  });

// 3. Process-Level (Uncaught Errors)
process.on('uncaughtException', (err) => {
  console.error('Uncaught error:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});
```

### Best Practices

```javascript
// ✅ DO: Always handle process-level errors
process.on('uncaughtException', (err, origin) => {
  logger.error('Uncaught Exception', { err, origin });
  // Attempt graceful shutdown
  shutdown();
});

// ✅ DO: Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

// ✅ DO: Log errors before exiting
process.on('exit', (code) => {
  logger.info('Process exit', { code });
});

// ❌ DON'T: Continue running after uncaught exception
process.on('uncaughtException', (err) => {
  console.error(err);
  // Still running - DANGEROUS! State may be corrupted
});

// ❌ DON'T: Ignore warnings
// DO: Log warnings
process.on('warning', (warning) => {
  logger.warn('Process warning', { warning });
});
```

---

## Common Mental Models

### Model 1: Control Panel

```
Process Object = Car Dashboard

- Speedometer = CPU usage
- Fuel gauge = Memory usage
- Odometer = Uptime
- Warning lights = Events
- Ignition = Start/Stop (exit)
- Controls = Methods (chdir, kill, etc.)
```

### Model 2: Operating System Interface

```
┌────────────────────┐
│ Operating System   │
│  - Signals         │
│  - Environment     │
│  - Streams         │
└─────────┬──────────┘
          │ Interface
          ↓
┌────────────────────┐
│  process object    │
│  - .env            │
│  - .on('SIGTERM')  │
│  - .stdin/stdout   │
└────────────────────┘
          │
          ↓
┌────────────────────┐
│  Your Application  │
└────────────────────┘
```

### Model 3: Lifecycle Manager

```
Start → Run → Signals → Cleanup → Exit

1. Start: Load config from env
2. Run: Execute application code
3. Signals: Respond to OS signals
4. Cleanup: Close connections, save state
5. Exit: Terminate with exit code
```

---

## Summary

### Key Takeaways

1. **Global Object** - process is available everywhere, no require needed
2. **Configuration** - Use process.env for environment-based config
3. **Arguments** - Use process.argv to parse command-line arguments
4. **Signals** - Handle SIGTERM, SIGINT for graceful shutdown
5. **Exit Codes** - Use proper codes (0 = success, non-zero = error)
6. **Events** - Handle uncaughtException and unhandledRejection
7. **Streams** - stdin, stdout, stderr for I/O
8. **Monitoring** - Track memory, CPU, uptime
9. **Graceful Shutdown** - Always cleanup before exiting
10. **Error Handling** - Multiple levels of error handling

### When to Use Process Object

**Use process when:**
- Reading configuration from environment
- Building CLI tools
- Handling graceful shutdown
- Monitoring resource usage
- Managing application lifecycle
- Handling signals and errors
- Getting system information

**Essential for:**
- Production applications
- Docker containers
- Kubernetes deployments
- CLI tools
- Long-running services
- System integration

---

## Next Steps

Now that you understand the concepts, proceed to:
1. [Level 1: Basics](./level-1-basics/README.md) - Start with practical examples
2. Practice with examples and exercises
3. Build your own process-aware applications
4. Return to this document when you need conceptual clarity
