# Process Lifecycle

Understanding the complete lifecycle of child processes, from creation to termination.

## Table of Contents
- [Introduction](#introduction)
- [Lifecycle Stages](#lifecycle-stages)
- [Process Events](#process-events)
- [State Management](#state-management)
- [Resource Management](#resource-management)
- [Cleanup Patterns](#cleanup-patterns)
- [Restart Strategies](#restart-strategies)
- [Best Practices](#best-practices)

---

## Introduction

Every child process goes through a predictable lifecycle. Understanding this lifecycle is crucial for proper resource management and error handling.

### The Lifecycle

```
Creation → Running → Terminating → Exited
    ↓         ↓           ↓          ↓
  spawn    working    cleanup    cleanup
   fork     IPC       signals    resources
  exec    streams    disconnect
```

---

## Lifecycle Stages

### 1. Creation Stage

The process is spawned or forked:

```javascript
const { spawn, fork } = require('child_process');

// spawn() - starts the process
const child1 = spawn('node', ['worker.js']);

// fork() - specialized spawn for Node.js
const child2 = fork('worker.js');

// exec() - runs shell command
const child3 = exec('ls -la');
```

**Events during creation:**
- `spawn` - Process has been spawned (spawn only)
- `error` - Failed to spawn

```javascript
child.on('spawn', () => {
  console.log('Process spawned successfully');
  console.log('PID:', child.pid);
});

child.on('error', (err) => {
  console.error('Failed to spawn:', err);
});
```

### 2. Running Stage

The process is active and working:

```javascript
// Process is running
console.log('PID:', child.pid);
console.log('Connected:', child.connected); // for fork()
console.log('Killed:', child.killed);

// Working with the process
child.send({ task: 'process' }); // fork() only
child.stdin.write('data\n');     // spawn/exec

// Receiving output
child.stdout.on('data', (data) => {
  console.log('Output:', data.toString());
});
```

**Events during running:**
- `message` - IPC message received (fork only)
- `data` - Stream data events

### 3. Terminating Stage

The process is shutting down:

```javascript
// Graceful termination
child.kill('SIGTERM');

// Or force kill
child.kill('SIGKILL');

// For forked processes, disconnect IPC first
if (child.connected) {
  child.disconnect();
}
```

**Events during termination:**
- `disconnect` - IPC channel closed (fork only)
- `close` - All stdio streams closed
- `exit` - Process has exited

### 4. Exited Stage

The process has terminated:

```javascript
child.on('exit', (code, signal) => {
  console.log(`Process exited: code=${code}, signal=${signal}`);
});

child.on('close', (code, signal) => {
  console.log('All streams closed');
  // Process is completely done
});
```

---

## Process Events

### Complete Event Timeline

```javascript
const { spawn } = require('child_process');

const child = spawn('node', ['worker.js']);

// 1. Spawn event (spawn only)
child.on('spawn', () => {
  console.log('[1] spawn: Process started');
});

// 2. Error event (if spawn fails)
child.on('error', (err) => {
  console.error('[2] error: Failed to spawn:', err);
});

// 3. Message events (fork only)
child.on('message', (msg) => {
  console.log('[3] message:', msg);
});

// 4. Disconnect event (fork only)
child.on('disconnect', () => {
  console.log('[4] disconnect: IPC channel closed');
});

// 5. Exit event (process terminated)
child.on('exit', (code, signal) => {
  console.log(`[5] exit: code=${code}, signal=${signal}`);
});

// 6. Close event (all streams closed)
child.on('close', (code, signal) => {
  console.log(`[6] close: code=${code}, signal=${signal}`);
  console.log('Process lifecycle complete');
});
```

### Event Order Examples

#### Normal Exit

```
1. spawn
2. [process runs]
3. exit (code=0)
4. close (code=0)
```

#### Killed Process

```
1. spawn
2. [process runs]
3. [kill() called]
4. exit (signal='SIGTERM')
5. close (signal='SIGTERM')
```

#### Forked Process Normal Exit

```
1. spawn
2. [IPC communication]
3. disconnect
4. exit (code=0)
5. close (code=0)
```

#### Spawn Failure

```
1. error (ENOENT)
2. close (code=null)
```

---

## State Management

### Tracking Process State

```javascript
class ManagedProcess {
  constructor(command, args) {
    this.state = 'created';
    this.process = null;
    this.command = command;
    this.args = args;
    this.exitCode = null;
    this.signal = null;
  }

  start() {
    if (this.state !== 'created' && this.state !== 'stopped') {
      throw new Error(`Cannot start from state: ${this.state}`);
    }

    this.state = 'starting';
    this.process = spawn(this.command, this.args);

    this.process.on('spawn', () => {
      this.state = 'running';
      console.log('Process running');
    });

    this.process.on('error', (err) => {
      this.state = 'error';
      console.error('Process error:', err);
    });

    this.process.on('exit', (code, signal) => {
      this.state = 'exited';
      this.exitCode = code;
      this.signal = signal;
    });

    this.process.on('close', () => {
      this.state = 'stopped';
      console.log('Process stopped');
    });
  }

  stop() {
    if (this.state === 'running') {
      this.state = 'stopping';
      this.process.kill('SIGTERM');
    }
  }

  isRunning() {
    return this.state === 'running';
  }
}

// Usage
const proc = new ManagedProcess('node', ['worker.js']);
proc.start();

setTimeout(() => {
  if (proc.isRunning()) {
    proc.stop();
  }
}, 5000);
```

### Process State Machine

```javascript
class ProcessStateMachine {
  constructor() {
    this.state = 'idle';
    this.transitions = {
      idle: ['starting'],
      starting: ['running', 'failed'],
      running: ['stopping', 'crashed'],
      stopping: ['stopped'],
      crashed: ['idle'],
      failed: ['idle'],
      stopped: ['idle']
    };
  }

  transition(newState) {
    const allowed = this.transitions[this.state];

    if (!allowed || !allowed.includes(newState)) {
      throw new Error(
        `Invalid transition: ${this.state} -> ${newState}`
      );
    }

    console.log(`State: ${this.state} -> ${newState}`);
    this.state = newState;
  }

  canTransitionTo(newState) {
    const allowed = this.transitions[this.state];
    return allowed && allowed.includes(newState);
  }
}

// Usage
const sm = new ProcessStateMachine();
sm.transition('starting'); // OK
sm.transition('running');  // OK
// sm.transition('idle');  // Error! Invalid transition
```

---

## Resource Management

### Tracking Resources

```javascript
class ResourceTracker {
  constructor(process) {
    this.process = process;
    this.resources = {
      pid: process.pid,
      startTime: Date.now(),
      memoryPeak: 0,
      messagesReceived: 0,
      messagesSent: 0
    };

    this.monitorInterval = setInterval(() => {
      this.updateMetrics();
    }, 1000);

    process.on('message', () => {
      this.resources.messagesReceived++;
    });

    process.on('close', () => {
      this.cleanup();
    });
  }

  updateMetrics() {
    // In production, use process.memoryUsage() from worker
    const uptime = Date.now() - this.resources.startTime;
    this.resources.uptime = uptime;
  }

  cleanup() {
    clearInterval(this.monitorInterval);
    console.log('Resource usage:', this.resources);
  }

  send(message) {
    this.process.send(message);
    this.resources.messagesSent++;
  }
}
```

### File Descriptor Management

```javascript
const { spawn } = require('child_process');
const fs = require('fs');

// Good: explicitly manage file descriptors
const logFile = fs.createWriteStream('output.log');

const child = spawn('command', [], {
  stdio: ['ignore', logFile, logFile]
});

child.on('close', () => {
  // Close file descriptors
  logFile.end();
});

// Also works with pipes
child.stdout.pipe(logFile);

child.on('exit', () => {
  child.stdout.unpipe(logFile);
  logFile.end();
});
```

---

## Cleanup Patterns

### Basic Cleanup

```javascript
function createProcess(command, args) {
  const child = spawn(command, args);
  const resources = [];

  // Register cleanup function
  const cleanup = () => {
    console.log('Cleaning up...');

    // Close streams
    if (child.stdin && !child.stdin.destroyed) {
      child.stdin.destroy();
    }

    // Clear intervals/timeouts
    resources.forEach(resource => {
      if (resource.type === 'interval') {
        clearInterval(resource.id);
      } else if (resource.type === 'timeout') {
        clearTimeout(resource.id);
      }
    });

    // Kill if still running
    if (!child.killed) {
      child.kill();
    }
  };

  // Run cleanup on exit
  child.on('close', cleanup);

  // Also cleanup on process exit
  process.on('exit', cleanup);

  return { child, cleanup };
}
```

### Graceful Shutdown

```javascript
class GracefulProcess {
  constructor(command, args) {
    this.process = spawn(command, args);
    this.isShuttingDown = false;
    this.cleanupHandlers = [];
  }

  onCleanup(handler) {
    this.cleanupHandlers.push(handler);
  }

  async shutdown(timeout = 5000) {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log('Starting graceful shutdown...');

    // Run cleanup handlers
    for (const handler of this.cleanupHandlers) {
      try {
        await handler();
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }

    // Try graceful termination
    this.process.kill('SIGTERM');

    // Force kill after timeout
    return new Promise((resolve) => {
      const forceKillTimer = setTimeout(() => {
        if (!this.process.killed) {
          console.log('Force killing process');
          this.process.kill('SIGKILL');
        }
      }, timeout);

      this.process.on('close', () => {
        clearTimeout(forceKillTimer);
        console.log('Shutdown complete');
        resolve();
      });
    });
  }
}

// Usage
const proc = new GracefulProcess('node', ['worker.js']);

// Register cleanup handlers
proc.onCleanup(async () => {
  console.log('Saving state...');
  // Save state to database
});

proc.onCleanup(async () => {
  console.log('Closing connections...');
  // Close database connections
});

// Shutdown on SIGTERM
process.on('SIGTERM', async () => {
  await proc.shutdown();
  process.exit(0);
});
```

---

## Restart Strategies

### Simple Restart

```javascript
class RestartableProcess {
  constructor(command, args, options = {}) {
    this.command = command;
    this.args = args;
    this.options = options;
    this.restarts = 0;
    this.maxRestarts = options.maxRestarts || 5;
    this.process = null;
  }

  start() {
    this.process = spawn(this.command, this.args);

    this.process.on('exit', (code) => {
      if (code !== 0 && this.restarts < this.maxRestarts) {
        console.log(`Process crashed, restarting (${this.restarts + 1}/${this.maxRestarts})`);
        this.restarts++;
        setTimeout(() => this.start(), 1000);
      } else if (this.restarts >= this.maxRestarts) {
        console.error('Max restarts reached');
      }
    });
  }

  stop() {
    this.maxRestarts = 0; // Prevent restart
    if (this.process) {
      this.process.kill();
    }
  }
}
```

### Exponential Backoff Restart

```javascript
class SmartRestartProcess {
  constructor(command, args) {
    this.command = command;
    this.args = args;
    this.process = null;
    this.attempts = 0;
    this.baseDelay = 1000;
    this.maxDelay = 60000;
  }

  start() {
    this.process = spawn(this.command, this.args);

    this.process.on('spawn', () => {
      // Reset on successful start
      this.attempts = 0;
    });

    this.process.on('exit', (code) => {
      if (code !== 0) {
        this.restart();
      }
    });
  }

  restart() {
    this.attempts++;
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.attempts - 1),
      this.maxDelay
    );

    console.log(`Restarting in ${delay}ms (attempt ${this.attempts})`);

    setTimeout(() => {
      this.start();
    }, delay);
  }

  stop() {
    this.attempts = Infinity; // Prevent restart
    if (this.process) {
      this.process.kill();
    }
  }
}
```

---

## Best Practices

### 1. Always Handle All Events

```javascript
// GOOD - comprehensive event handling
child.on('spawn', onSpawn);
child.on('error', onError);
child.on('exit', onExit);
child.on('close', onClose);

// BAD - missing handlers
child.on('close', onClose);
// No error handler = potential crash
```

### 2. Clean Up Resources

```javascript
// GOOD
process.on('exit', () => {
  if (child && !child.killed) {
    child.kill();
  }
});

// BAD - orphaned processes
// No cleanup = child continues after parent exits
```

### 3. Use Proper State Tracking

```javascript
// GOOD
const state = {
  starting: false,
  running: false,
  stopping: false
};

// Check state before operations
if (state.running && !state.stopping) {
  child.kill();
}

// BAD
child.kill(); // What if already killed?
```

### 4. Implement Timeouts

```javascript
// GOOD
const timeout = setTimeout(() => {
  if (!child.killed) {
    child.kill('SIGKILL');
  }
}, 10000);

child.on('close', () => {
  clearTimeout(timeout);
});

// BAD - no timeout
child.kill('SIGTERM');
// Might wait forever if process hangs
```

### 5. Handle Both exit and close

```javascript
// GOOD - different purposes
child.on('exit', (code, signal) => {
  // Process exited, but streams might still be open
  console.log('Exit code:', code);
});

child.on('close', (code, signal) => {
  // Everything is done, safe to cleanup
  cleanup();
});

// AVOID - using only one
child.on('exit', () => {
  cleanup(); // Might run before streams are closed!
});
```

---

## Summary

Key takeaways:
- Processes go through predictable lifecycle stages
- Each stage has associated events
- Track process state to manage operations correctly
- Clean up resources properly to avoid leaks
- Implement graceful shutdown with timeout fallback
- Use restart strategies for resilient processes
- Handle all lifecycle events, not just some
- Distinguish between exit (process ended) and close (all done)

Understanding the process lifecycle is essential for building robust, production-ready systems!
