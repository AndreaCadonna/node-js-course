# Worker Lifecycle Events

## Understanding the Worker Lifecycle

A worker thread goes through several stages from creation to termination. Understanding these stages and their associated events is crucial for proper resource management.

## Worker Lifecycle Stages

```
┌─────────────┐
│   Created   │ → Worker constructor called
└──────┬──────┘
       ↓
┌─────────────┐
│   Online    │ → Worker is running and ready ('online' event)
└──────┬──────┘
       ↓
┌─────────────┐
│  Running    │ → Worker executes code, sends/receives messages
└──────┬──────┘
       ↓
┌─────────────┐
│   Exiting   │ → Worker terminating ('exit' event)
└──────┬──────┘
       ↓
┌─────────────┐
│ Terminated  │ → Worker fully stopped
└─────────────┘
```

## Worker Events

### The Four Main Events

```javascript
const { Worker } = require('worker_threads');
const worker = new Worker('./worker.js');

// 1. 'online' - Worker is running
worker.on('online', () => {
  console.log('Worker is online and ready');
});

// 2. 'message' - Worker sent a message
worker.on('message', (msg) => {
  console.log('Message from worker:', msg);
});

// 3. 'error' - Worker encountered an error
worker.on('error', (err) => {
  console.error('Worker error:', err);
});

// 4. 'exit' - Worker has exited
worker.on('exit', (code) => {
  console.log('Worker exited with code:', code);
});
```

## The 'online' Event

### When It Fires

The `online` event fires when the worker thread has successfully started and is ready to execute code.

```javascript
const { Worker } = require('worker_threads');

const startTime = Date.now();

const worker = new Worker('./worker.js');

worker.on('online', () => {
  const elapsed = Date.now() - startTime;
  console.log(`Worker came online after ${elapsed}ms`);
  // Now safe to communicate with worker
});
```

### Use Cases

```javascript
// Wait for worker to be ready before sending tasks
const { Worker } = require('worker_threads');

function createReadyWorker(file) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(file);

    worker.on('online', () => {
      resolve(worker);
    });

    worker.on('error', (err) => {
      reject(err);
    });
  });
}

// Usage
const worker = await createReadyWorker('./worker.js');
worker.postMessage({ task: 'process' }); // Worker is definitely ready
```

## The 'message' Event

### Receiving Messages

```javascript
worker.on('message', (message) => {
  console.log('Received:', message);

  // Handle different message types
  if (message.type === 'progress') {
    updateProgressBar(message.percent);
  } else if (message.type === 'result') {
    handleResult(message.data);
  } else if (message.type === 'error') {
    handleError(message.error);
  }
});
```

### Multiple Messages

```javascript
const { Worker } = require('worker_threads');
const worker = new Worker('./worker.js');

let messageCount = 0;

worker.on('message', (msg) => {
  messageCount++;
  console.log(`Message ${messageCount}:`, msg);
});

// worker.js sends multiple messages
// Each one triggers the 'message' event
```

## The 'error' Event

### When It Fires

The `error` event fires when:
1. An uncaught exception occurs in the worker
2. The worker code has a fatal error
3. Worker initialization fails

```javascript
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js');

worker.on('error', (err) => {
  console.error('Worker error:');
  console.error('  Message:', err.message);
  console.error('  Stack:', err.stack);

  // Handle the error
  // Worker will exit after error event
});
```

### Error Scenarios

**Scenario 1: Uncaught Exception**
```javascript
// worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', (data) => {
  // Uncaught error
  throw new Error('Something went wrong!');
  // This triggers 'error' event in main thread
});
```

**Scenario 2: Missing Module**
```javascript
// worker.js
require('non-existent-module');
// Worker fails to start, 'error' event fires
```

**Scenario 3: Invalid Worker File**
```javascript
// main.js
const worker = new Worker('./does-not-exist.js');
// 'error' event fires immediately
```

### Error Handling Pattern

```javascript
const { Worker } = require('worker_threads');

function createWorkerWithErrorHandling(file, workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(file, { workerData });

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Worker startup timeout'));
    }, 5000);

    worker.on('online', () => {
      clearTimeout(timeout);
      resolve(worker);
    });

    worker.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    worker.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`Worker exited with code ${code}`));
      }
    });
  });
}

// Usage
try {
  const worker = await createWorkerWithErrorHandling('./worker.js', {});
  // Worker is ready and error-handled
} catch (err) {
  console.error('Failed to create worker:', err);
}
```

## The 'exit' Event

### Exit Codes

```javascript
worker.on('exit', (code) => {
  if (code === 0) {
    console.log('Worker exited successfully');
  } else {
    console.error('Worker exited with error code:', code);
  }
});
```

**Common exit codes:**
- `0` - Normal exit
- `1` - General error
- `>1` - Specific error codes

### Exit Scenarios

**Scenario 1: Normal Exit**
```javascript
// worker.js
const { parentPort } = require('worker_threads');

// Do some work
parentPort.postMessage('Done!');

// Exit normally
process.exit(0);
// Or just let the file end
```

**Scenario 2: Error Exit**
```javascript
// worker.js
if (errorCondition) {
  process.exit(1);
}
```

**Scenario 3: Terminated by Main Thread**
```javascript
// main.js
worker.terminate();
// Causes 'exit' event with code 1
```

### Cleanup on Exit

```javascript
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js');

worker.on('exit', (code) => {
  console.log('Worker exited with code:', code);

  // Cleanup resources
  cleanupWorkerResources();

  // Maybe restart worker if it crashed
  if (code !== 0) {
    console.log('Restarting worker...');
    createNewWorker();
  }
});
```

## Complete Lifecycle Example

```javascript
// main.js
const { Worker } = require('worker_threads');

class ManagedWorker {
  constructor(file, workerData = {}) {
    this.file = file;
    this.workerData = workerData;
    this.worker = null;
    this.isReady = false;
    this.listeners = new Map();

    this.start();
  }

  start() {
    console.log('Creating worker...');
    this.worker = new Worker(this.file, {
      workerData: this.workerData
    });

    this.worker.on('online', () => {
      console.log('Worker online');
      this.isReady = true;
      this.emit('ready');
    });

    this.worker.on('message', (msg) => {
      console.log('Worker message:', msg);
      this.emit('message', msg);
    });

    this.worker.on('error', (err) => {
      console.error('Worker error:', err);
      this.isReady = false;
      this.emit('error', err);
    });

    this.worker.on('exit', (code) => {
      console.log('Worker exit:', code);
      this.isReady = false;
      this.emit('exit', code);

      // Auto-restart on crash
      if (code !== 0) {
        console.log('Worker crashed, restarting...');
        setTimeout(() => this.start(), 1000);
      }
    });
  }

  postMessage(msg) {
    if (!this.isReady) {
      throw new Error('Worker not ready');
    }
    this.worker.postMessage(msg);
  }

  terminate() {
    if (this.worker) {
      return this.worker.terminate();
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }
}

// Usage
const managed = new ManagedWorker('./worker.js', { id: 1 });

managed.on('ready', () => {
  console.log('Worker is ready!');
  managed.postMessage({ task: 'start' });
});

managed.on('message', (msg) => {
  console.log('Got message:', msg);
});

managed.on('error', (err) => {
  console.error('Error occurred:', err);
});

managed.on('exit', (code) => {
  console.log('Worker exited:', code);
});
```

## Terminating Workers

### Graceful Termination

```javascript
// main.js
const { Worker } = require('worker_threads');
const worker = new Worker('./worker.js');

// Request graceful shutdown
worker.postMessage({ type: 'SHUTDOWN' });

// Wait for acknowledgment
worker.on('message', (msg) => {
  if (msg.type === 'SHUTDOWN_COMPLETE') {
    worker.terminate();
  }
});

// Timeout fallback
setTimeout(() => {
  console.log('Force terminating worker');
  worker.terminate();
}, 5000);
```

```javascript
// worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', async (msg) => {
  if (msg.type === 'SHUTDOWN') {
    // Cleanup
    await closeConnections();
    await saveState();

    // Acknowledge
    parentPort.postMessage({ type: 'SHUTDOWN_COMPLETE' });

    // Exit gracefully
    process.exit(0);
  }
});
```

### Forced Termination

```javascript
// Immediately terminate worker
const exitCode = await worker.terminate();
console.log('Worker terminated with code:', exitCode);
// Worker cannot prevent this
```

## Process Exit Handling

### Cleanup on Main Process Exit

```javascript
const { Worker } = require('worker_threads');

const workers = [];

// Create workers
for (let i = 0; i < 4; i++) {
  workers.push(new Worker('./worker.js'));
}

// Cleanup on process exit
async function cleanup() {
  console.log('Shutting down workers...');

  await Promise.all(
    workers.map(worker => worker.terminate())
  );

  console.log('All workers terminated');
}

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});
```

## Best Practices

### 1. Always Handle All Events

```javascript
// ✅ Good: Handle all important events
const worker = new Worker('./worker.js');

worker.on('online', () => { /* worker ready */ });
worker.on('message', (msg) => { /* handle message */ });
worker.on('error', (err) => { /* handle error */ });
worker.on('exit', (code) => { /* cleanup */ });
```

### 2. Implement Timeouts

```javascript
// ✅ Good: Timeout for worker operations
const timeout = setTimeout(() => {
  console.error('Worker timeout');
  worker.terminate();
}, 10000);

worker.on('message', (result) => {
  clearTimeout(timeout);
  processResult(result);
});
```

### 3. Clean Up Resources

```javascript
// ✅ Good: Terminate when done
worker.on('message', (result) => {
  processResult(result);
  worker.terminate(); // Free resources
});
```

### 4. Handle Crashes Appropriately

```javascript
// ✅ Good: Decide whether to restart
worker.on('exit', (code) => {
  if (code !== 0) {
    if (shouldRestart(code)) {
      restartWorker();
    } else {
      reportFatalError(code);
    }
  }
});
```

## Key Takeaways

1. **Four main events** - online, message, error, exit
2. **'online' signals readiness** - worker is ready to receive messages
3. **'error' indicates problems** - uncaught exceptions, initialization failures
4. **'exit' fires on termination** - check exit code for success/failure
5. **Always handle all events** - prevents resource leaks and undefined behavior
6. **Implement cleanup** - terminate workers when done
7. **Use timeouts** - prevent hanging workers

## Next Steps

Learn about [error handling in workers](./06-error-handling.md) for robust worker thread applications.
