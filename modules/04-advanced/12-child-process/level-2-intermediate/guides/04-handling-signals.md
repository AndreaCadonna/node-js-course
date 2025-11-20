# Handling Signals

Master Unix/POSIX signal handling for proper process control and graceful shutdown.

## Table of Contents
- [Introduction](#introduction)
- [Understanding Signals](#understanding-signals)
- [Common Signals](#common-signals)
- [Sending Signals](#sending-signals)
- [Receiving Signals](#receiving-signals)
- [Graceful Shutdown](#graceful-shutdown)
- [Signal Propagation](#signal-propagation)
- [Best Practices](#best-practices)

---

## Introduction

Signals are a form of inter-process communication in Unix-like systems. They're used to notify processes of events, request termination, or trigger specific actions.

### Why Signals Matter

- **Process Control**: Start, stop, pause processes
- **Graceful Shutdown**: Clean up before terminating
- **Resource Management**: Handle system events
- **Coordination**: Synchronize multiple processes

---

## Understanding Signals

### What Are Signals?

Signals are asynchronous notifications sent to processes. When a process receives a signal, it can:
1. **Ignore** the signal
2. **Handle** it with a custom function
3. **Use default** behavior (often termination)

### Signal Numbers vs Names

```javascript
// Signals can be referenced by name or number
child.kill('SIGTERM');  // Name (preferred)
child.kill(15);         // Number (avoid)

// Common signals:
// SIGTERM = 15 (graceful termination)
// SIGKILL = 9  (force kill)
// SIGINT  = 2  (interrupt, Ctrl+C)
```

### Signal Categories

1. **Termination Signals**: Request process to exit
   - SIGTERM, SIGINT, SIGQUIT, SIGKILL

2. **Control Signals**: Pause/resume process
   - SIGSTOP, SIGCONT

3. **Information Signals**: Request status
   - SIGHUP, SIGUSR1, SIGUSR2

4. **Error Signals**: Indicate errors
   - SIGSEGV, SIGILL, SIGFPE

---

## Common Signals

### SIGTERM (15)

**Graceful termination request**

```javascript
// Default behavior: process terminates
// Can be caught and handled

child.kill('SIGTERM');

// In child process:
process.on('SIGTERM', () => {
  console.log('SIGTERM received, cleaning up...');
  // Perform cleanup
  process.exit(0);
});
```

**Use when:**
- Requesting graceful shutdown
- Allowing cleanup operations
- Normal termination flow

### SIGKILL (9)

**Force kill (cannot be caught)**

```javascript
// Cannot be caught or ignored
// Process terminates immediately

child.kill('SIGKILL');

// This will NOT work:
process.on('SIGKILL', () => {
  // Never called!
});
```

**Use when:**
- Process is unresponsive
- SIGTERM timeout exceeded
- Emergency termination needed

### SIGINT (2)

**Interrupt (Ctrl+C)**

```javascript
// Sent when user presses Ctrl+C
// Default: terminate process
// Can be caught

process.on('SIGINT', () => {
  console.log('Interrupted, shutting down...');
  cleanup();
  process.exit(0);
});
```

**Use when:**
- User interrupts program
- Interactive termination
- Development/debugging

### SIGHUP (1)

**Hang up (terminal closed)**

```javascript
// Traditionally sent when terminal closes
// Modern use: reload configuration

process.on('SIGHUP', () => {
  console.log('Reloading configuration...');
  reloadConfig();
});
```

**Use when:**
- Reloading configuration
- Re-opening log files
- Refreshing resources

### SIGUSR1 and SIGUSR2

**User-defined signals**

```javascript
// Custom signals for application-specific purposes

process.on('SIGUSR1', () => {
  console.log('SIGUSR1: Toggling debug mode');
  toggleDebug();
});

process.on('SIGUSR2', () => {
  console.log('SIGUSR2: Printing statistics');
  printStats();
});
```

**Use when:**
- Custom application behavior
- Debugging triggers
- Status reporting

---

## Sending Signals

### Sending to Child Processes

```javascript
const { spawn } = require('child_process');

const child = spawn('long-running-process');

// Send SIGTERM
child.kill('SIGTERM');

// Send SIGKILL
child.kill('SIGKILL');

// Send custom signal
child.kill('SIGUSR1');

// Check if signal was sent
const sent = child.kill('SIGTERM');
if (!sent) {
  console.log('Process already exited');
}
```

### Sending with process.kill()

```javascript
// Send signal to any process by PID
const pid = child.pid;

try {
  // Send SIGTERM to PID
  process.kill(pid, 'SIGTERM');
  console.log(`Sent SIGTERM to ${pid}`);
} catch (err) {
  if (err.code === 'ESRCH') {
    console.log('Process does not exist');
  } else {
    console.error('Error sending signal:', err);
  }
}

// Check if process exists (signal 0)
try {
  process.kill(pid, 0);
  console.log('Process is running');
} catch (err) {
  console.log('Process not found');
}
```

### Broadcasting Signals

```javascript
class ProcessGroup {
  constructor() {
    this.processes = [];
  }

  add(process) {
    this.processes.push(process);
  }

  killAll(signal = 'SIGTERM') {
    console.log(`Sending ${signal} to ${this.processes.length} processes`);

    this.processes.forEach((proc, index) => {
      try {
        proc.kill(signal);
        console.log(`  [${index}] Signal sent to PID ${proc.pid}`);
      } catch (err) {
        console.error(`  [${index}] Error: ${err.message}`);
      }
    });
  }

  async killAllGracefully(timeout = 5000) {
    // Try SIGTERM first
    this.killAll('SIGTERM');

    // Wait for processes to exit
    await new Promise(resolve => setTimeout(resolve, timeout));

    // Force kill any remaining
    this.processes.forEach(proc => {
      if (!proc.killed) {
        console.log(`Force killing PID ${proc.pid}`);
        proc.kill('SIGKILL');
      }
    });
  }
}

// Usage
const group = new ProcessGroup();
group.add(spawn('worker1'));
group.add(spawn('worker2'));
group.add(spawn('worker3'));

// Graceful shutdown
await group.killAllGracefully();
```

---

## Receiving Signals

### Handling Signals in Parent

```javascript
const child = spawn('worker');

// Parent receives signals too
process.on('SIGTERM', () => {
  console.log('[Parent] SIGTERM received');

  // Propagate to child
  child.kill('SIGTERM');

  // Wait for child to exit
  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
    process.exit(0);
  }, 5000);
});

process.on('SIGINT', () => {
  console.log('[Parent] SIGINT (Ctrl+C) received');
  child.kill('SIGINT');
  process.exit(0);
});
```

### Handling Signals in Child

```javascript
// worker.js
let isShuttingDown = false;

process.on('SIGTERM', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('SIGTERM received, starting shutdown...');

  try {
    // Cleanup operations
    await closeDatabase();
    await flushLogs();
    await saveState();

    console.log('Cleanup complete');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup error:', err);
    process.exit(1);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  process.exit(0);
});

// Prevent multiple SIGTERM handlers
let sigintCount = 0;
process.on('SIGINT', () => {
  sigintCount++;
  if (sigintCount === 1) {
    console.log('Graceful shutdown... (press Ctrl+C again to force)');
    gracefulShutdown();
  } else {
    console.log('Force exit');
    process.exit(1);
  }
});
```

---

## Graceful Shutdown

### Basic Pattern

```javascript
class GracefulShutdown {
  constructor() {
    this.isShuttingDown = false;
    this.cleanupTasks = [];
  }

  register(task) {
    this.cleanupTasks.push(task);
  }

  async shutdown() {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log('Starting graceful shutdown...');

    // Run all cleanup tasks
    for (const task of this.cleanupTasks) {
      try {
        await task();
      } catch (err) {
        console.error('Cleanup task failed:', err);
      }
    }

    console.log('Shutdown complete');
    process.exit(0);
  }

  setupSignalHandlers() {
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }
}

// Usage
const shutdown = new GracefulShutdown();

shutdown.register(async () => {
  console.log('Closing server...');
  await server.close();
});

shutdown.register(async () => {
  console.log('Closing database...');
  await db.close();
});

shutdown.setupSignalHandlers();
```

### With Timeout

```javascript
async function gracefulShutdown(child, timeout = 5000) {
  console.log('Requesting graceful shutdown...');

  // Send SIGTERM
  child.kill('SIGTERM');

  // Set up force-kill timeout
  const forceKillTimer = setTimeout(() => {
    if (!child.killed) {
      console.log('Timeout exceeded, force killing...');
      child.kill('SIGKILL');
    }
  }, timeout);

  // Wait for exit
  return new Promise((resolve) => {
    child.on('exit', (code, signal) => {
      clearTimeout(forceKillTimer);
      console.log(`Process exited: code=${code}, signal=${signal}`);
      resolve({ code, signal });
    });
  });
}

// Usage
await gracefulShutdown(child, 10000);
```

### Multi-Phase Shutdown

```javascript
class MultiPhaseShutdown {
  async shutdown(child) {
    console.log('Phase 1: Requesting graceful shutdown');
    child.kill('SIGTERM');

    // Wait 5 seconds
    await this.waitOrKill(child, 5000, 'SIGTERM');

    console.log('Phase 2: Sending SIGINT');
    if (!child.killed) {
      child.kill('SIGINT');
      await this.waitOrKill(child, 3000, 'SIGINT');
    }

    console.log('Phase 3: Force kill');
    if (!child.killed) {
      child.kill('SIGKILL');
      await this.waitForExit(child);
    }

    console.log('Shutdown complete');
  }

  waitOrKill(child, timeout, signal) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        if (!child.killed) {
          console.log(`Timeout after ${signal}, escalating...`);
        }
        resolve();
      }, timeout);

      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  waitForExit(child) {
    return new Promise((resolve) => {
      child.once('exit', resolve);
    });
  }
}
```

---

## Signal Propagation

### Propagating to Process Group

```javascript
class ProcessTreeManager {
  constructor() {
    this.children = [];
  }

  spawn(command, args) {
    const child = spawn(command, args, {
      // Create new process group
      detached: true
    });

    this.children.push(child);
    return child;
  }

  propagateSignal(signal) {
    console.log(`Propagating ${signal} to ${this.children.length} processes`);

    this.children.forEach(child => {
      try {
        if (child.pid && !child.killed) {
          // Send to entire process group
          process.kill(-child.pid, signal);
        }
      } catch (err) {
        console.error(`Error sending signal to ${child.pid}:`, err);
      }
    });
  }

  async shutdownAll() {
    // SIGTERM to all
    this.propagateSignal('SIGTERM');

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    // SIGKILL to survivors
    this.children.forEach(child => {
      if (!child.killed) {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch (err) {
          // Process might have exited
        }
      }
    });
  }
}
```

### Coordinated Shutdown

```javascript
class CoordinatedShutdown {
  constructor(processes) {
    this.processes = processes;
  }

  async shutdown() {
    console.log('Step 1: Stop accepting new work');
    this.processes.forEach(p => p.send({ command: 'stop-accept' }));
    await this.wait(1000);

    console.log('Step 2: Finish current work');
    this.processes.forEach(p => p.send({ command: 'finish-work' }));
    await this.wait(5000);

    console.log('Step 3: Send SIGTERM');
    this.processes.forEach(p => p.kill('SIGTERM'));
    await this.wait(3000);

    console.log('Step 4: Force kill remaining');
    this.processes.forEach(p => {
      if (!p.killed) {
        p.kill('SIGKILL');
      }
    });

    console.log('Shutdown complete');
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## Best Practices

### 1. Always Handle SIGTERM

```javascript
// GOOD
process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

// BAD - no handler means default behavior (immediate exit)
```

### 2. Implement Timeout for Force Kill

```javascript
// GOOD
child.kill('SIGTERM');
setTimeout(() => {
  if (!child.killed) {
    child.kill('SIGKILL');
  }
}, 5000);

// BAD - might wait forever
child.kill('SIGTERM');
```

### 3. Prevent Signal Handler Races

```javascript
// GOOD
let shutdownInProgress = false;

process.on('SIGTERM', async () => {
  if (shutdownInProgress) return;
  shutdownInProgress = true;
  await shutdown();
});

// BAD - multiple signals could trigger multiple shutdowns
process.on('SIGTERM', async () => {
  await shutdown(); // Could be called multiple times
});
```

### 4. Propagate Signals to Children

```javascript
// GOOD
process.on('SIGTERM', () => {
  children.forEach(c => c.kill('SIGTERM'));
  // Wait for children, then exit
});

// BAD - orphans child processes
process.on('SIGTERM', () => {
  process.exit(0); // Children continue running
});
```

### 5. Use Appropriate Signals

```javascript
// GOOD
child.kill('SIGTERM');  // Try graceful first
// ... wait ...
child.kill('SIGKILL');  // Force if needed

// BAD
child.kill('SIGKILL');  // No chance for cleanup
```

### 6. Handle SIGINT for Development

```javascript
// GOOD - allows Ctrl+C during development
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', async () => {
    console.log('Dev mode: Ctrl+C shutdown');
    await cleanup();
    process.exit(0);
  });
}
```

---

## Summary

Key takeaways:
- SIGTERM requests graceful shutdown (can be caught)
- SIGKILL forces immediate termination (cannot be caught)
- Always implement timeout for force-kill escalation
- Propagate signals to child processes
- Prevent multiple shutdown attempts with flags
- Use signal 0 to check if process exists
- Coordinate shutdown across process groups
- Handle both SIGTERM and SIGINT in applications

Signal handling is essential for building production-ready, well-behaved processes!
