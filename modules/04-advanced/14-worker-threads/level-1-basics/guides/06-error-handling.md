# Error Handling in Workers

## Why Error Handling Matters

Worker threads run in isolated contexts. Unhandled errors in workers can crash the worker thread, potentially losing work and resources. Proper error handling ensures robust, production-ready applications.

## Types of Errors in Workers

### 1. Worker Creation Errors

Errors that occur when creating the worker:

```javascript
const { Worker } = require('worker_threads');

try {
  const worker = new Worker('./nonexistent.js');
} catch (err) {
  console.error('Failed to create worker:', err.message);
  // Error: Cannot find module './nonexistent.js'
}
```

### 2. Worker Initialization Errors

Errors in the worker file's top-level code:

```javascript
// worker.js
const { parentPort } = require('worker_threads');

// This error occurs during worker startup
throw new Error('Initialization failed!');

// This code never runs
parentPort.postMessage('hello');
```

```javascript
// main.js
const worker = new Worker('./worker.js');

worker.on('error', (err) => {
  console.error('Worker initialization error:', err.message);
});
```

### 3. Runtime Errors

Errors during message processing:

```javascript
// worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', (data) => {
  // Runtime error
  const result = JSON.parse(data); // Might throw
  parentPort.postMessage(result);
});
```

### 4. Unhandled Promise Rejections

```javascript
// worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', async (data) => {
  // Unhandled rejection
  await Promise.reject(new Error('Async error'));
  // This crashes the worker
});
```

## The 'error' Event

### Basic Error Handling

```javascript
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js');

worker.on('error', (err) => {
  console.error('Worker error occurred:');
  console.error('  Type:', err.constructor.name);
  console.error('  Message:', err.message);
  console.error('  Stack:', err.stack);
});

worker.on('exit', (code) => {
  if (code !== 0) {
    console.error('Worker exited with error code:', code);
  }
});
```

### Error Information

```javascript
worker.on('error', (err) => {
  // Standard Error properties
  console.log('Name:', err.name);
  console.log('Message:', err.message);
  console.log('Stack:', err.stack);

  // Sometimes additional properties
  if (err.code) {
    console.log('Error code:', err.code);
  }
});
```

## Handling Errors in the Worker

### Try-Catch for Synchronous Code

```javascript
// worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', (data) => {
  try {
    // Risky operation
    const result = processData(data);
    parentPort.postMessage({ success: true, result });

  } catch (err) {
    // Send error back to main thread
    parentPort.postMessage({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});

function processData(data) {
  if (!data) {
    throw new Error('Data is required');
  }
  // Process data
  return data.toUpperCase(); // Might throw if data is not a string
}
```

### Try-Catch for Async Code

```javascript
// worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', async (data) => {
  try {
    // Async operation
    const result = await processDataAsync(data);
    parentPort.postMessage({ success: true, result });

  } catch (err) {
    parentPort.postMessage({
      success: false,
      error: err.message
    });
  }
});

async function processDataAsync(data) {
  // Might throw or reject
  const response = await fetch(data.url);
  return response.json();
}
```

## Process-Level Error Handlers

### Uncaught Exception Handler

```javascript
// worker.js
const { parentPort } = require('worker_threads');

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in worker:', err);

  // Notify main thread
  parentPort.postMessage({
    type: 'FATAL_ERROR',
    error: err.message,
    stack: err.stack
  });

  // Exit with error code
  process.exit(1);
});

parentPort.on('message', (data) => {
  // Even if this throws an uncaught error,
  // it will be caught by the uncaughtException handler
  riskyOperation(data);
});
```

### Unhandled Rejection Handler

```javascript
// worker.js
const { parentPort } = require('worker_threads');

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection in worker:', reason);

  parentPort.postMessage({
    type: 'FATAL_ERROR',
    error: String(reason)
  });

  process.exit(1);
});

parentPort.on('message', async (data) => {
  // Even if this promise rejects without .catch(),
  // it will be caught by unhandledRejection handler
  await riskyAsyncOperation(data);
});
```

## Error Recovery Patterns

### Pattern 1: Retry Logic

```javascript
// worker.js
const { parentPort } = require('worker_threads');

async function processWithRetry(data, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await processData(data);
      return { success: true, result };

    } catch (err) {
      lastError = err;
      console.error(`Attempt ${attempt} failed:`, err.message);

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  // All retries failed
  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError.message}`
  };
}

parentPort.on('message', async (data) => {
  const result = await processWithRetry(data);
  parentPort.postMessage(result);
});
```

### Pattern 2: Graceful Degradation

```javascript
// worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', async (data) => {
  try {
    // Try optimal processing
    const result = await complexProcessing(data);
    parentPort.postMessage({ success: true, result });

  } catch (err) {
    console.warn('Complex processing failed, using fallback');

    try {
      // Fall back to simpler processing
      const result = await simpleProcessing(data);
      parentPort.postMessage({
        success: true,
        result,
        warning: 'Used fallback method'
      });

    } catch (fallbackErr) {
      // Even fallback failed
      parentPort.postMessage({
        success: false,
        error: `Both methods failed: ${err.message}, ${fallbackErr.message}`
      });
    }
  }
});
```

### Pattern 3: Worker Restart on Crash

```javascript
// main.js
const { Worker } = require('worker_threads');

class ResilientWorker {
  constructor(file, maxRestarts = 3) {
    this.file = file;
    this.maxRestarts = maxRestarts;
    this.restartCount = 0;
    this.createWorker();
  }

  createWorker() {
    this.worker = new Worker(this.file);

    this.worker.on('error', (err) => {
      console.error('Worker error:', err.message);
      this.handleCrash();
    });

    this.worker.on('exit', (code) => {
      if (code !== 0) {
        console.error('Worker crashed with code:', code);
        this.handleCrash();
      }
    });

    this.worker.on('message', (msg) => {
      // Reset restart count on successful message
      this.restartCount = 0;
      this.handleMessage(msg);
    });
  }

  handleCrash() {
    this.restartCount++;

    if (this.restartCount <= this.maxRestarts) {
      console.log(`Restarting worker (attempt ${this.restartCount})...`);
      setTimeout(() => this.createWorker(), 1000);
    } else {
      console.error('Max restart attempts reached, giving up');
      this.handleFatalError();
    }
  }

  handleMessage(msg) {
    // Override in subclass
  }

  handleFatalError() {
    // Override in subclass
  }

  postMessage(msg) {
    if (this.worker) {
      this.worker.postMessage(msg);
    }
  }

  terminate() {
    if (this.worker) {
      return this.worker.terminate();
    }
  }
}

// Usage
const resilientWorker = new ResilientWorker('./worker.js');
resilientWorker.handleMessage = (msg) => {
  console.log('Received:', msg);
};
```

## Error Reporting to Main Thread

### Standardized Error Messages

```javascript
// worker.js
const { parentPort } = require('worker_threads');

function sendError(error, context = {}) {
  parentPort.postMessage({
    type: 'ERROR',
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code
    },
    context,
    timestamp: new Date().toISOString()
  });
}

function sendSuccess(result, context = {}) {
  parentPort.postMessage({
    type: 'SUCCESS',
    result,
    context,
    timestamp: new Date().toISOString()
  });
}

parentPort.on('message', async ({ taskId, data }) => {
  try {
    const result = await processData(data);
    sendSuccess(result, { taskId });

  } catch (err) {
    sendError(err, { taskId, data });
  }
});
```

### Handling Errors in Main Thread

```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js');

worker.on('message', (msg) => {
  if (msg.type === 'ERROR') {
    console.error('Worker error:', msg.error.message);
    console.error('Context:', msg.context);
    console.error('Stack:', msg.error.stack);

    // Handle error appropriately
    handleWorkerError(msg);

  } else if (msg.type === 'SUCCESS') {
    console.log('Worker success:', msg.result);
    handleWorkerSuccess(msg);
  }
});

worker.on('error', (err) => {
  console.error('Fatal worker error:', err);
  // Worker crashed, might need to restart
});
```

## Validation and Defensive Programming

### Input Validation

```javascript
// worker.js
const { parentPort } = require('worker_threads');

function validateInput(data) {
  if (!data) {
    throw new Error('Data is required');
  }

  if (typeof data !== 'object') {
    throw new Error('Data must be an object');
  }

  if (!data.type) {
    throw new Error('Data.type is required');
  }

  if (!Array.isArray(data.items)) {
    throw new Error('Data.items must be an array');
  }

  return true;
}

parentPort.on('message', (data) => {
  try {
    validateInput(data);
    const result = processData(data);
    parentPort.postMessage({ success: true, result });

  } catch (err) {
    parentPort.postMessage({
      success: false,
      error: err.message,
      type: 'VALIDATION_ERROR'
    });
  }
});
```

### Resource Limits

```javascript
// worker.js
const { parentPort } = require('worker_threads');

const MAX_ARRAY_SIZE = 1000000;
const MAX_PROCESSING_TIME = 30000; // 30 seconds

parentPort.on('message', async (data) => {
  // Check size limits
  if (data.items.length > MAX_ARRAY_SIZE) {
    parentPort.postMessage({
      success: false,
      error: `Array too large: ${data.items.length} > ${MAX_ARRAY_SIZE}`
    });
    return;
  }

  // Implement timeout
  const timeout = setTimeout(() => {
    parentPort.postMessage({
      success: false,
      error: 'Processing timeout exceeded'
    });
    process.exit(1);
  }, MAX_PROCESSING_TIME);

  try {
    const result = await processData(data);
    clearTimeout(timeout);
    parentPort.postMessage({ success: true, result });

  } catch (err) {
    clearTimeout(timeout);
    parentPort.postMessage({
      success: false,
      error: err.message
    });
  }
});
```

## Debugging Worker Errors

### Enhanced Error Information

```javascript
// worker.js
const { parentPort, workerData } = require('worker_threads');

function createDetailedError(err, context = {}) {
  return {
    error: {
      message: err.message,
      name: err.name,
      stack: err.stack,
      code: err.code
    },
    worker: {
      id: workerData.id,
      file: __filename
    },
    context,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    },
    timestamp: new Date().toISOString()
  };
}

parentPort.on('message', (data) => {
  try {
    const result = processData(data);
    parentPort.postMessage({ success: true, result });

  } catch (err) {
    const detailedError = createDetailedError(err, { input: data });
    parentPort.postMessage({ success: false, ...detailedError });
  }
});
```

## Best Practices

### 1. Always Handle Worker Errors

```javascript
// ✅ Good
const worker = new Worker('./worker.js');
worker.on('error', (err) => {
  console.error('Worker error:', err);
});
worker.on('exit', (code) => {
  if (code !== 0) {
    console.error('Worker exited with error');
  }
});
```

### 2. Use Try-Catch in Workers

```javascript
// ✅ Good
parentPort.on('message', async (data) => {
  try {
    const result = await processData(data);
    parentPort.postMessage({ success: true, result });
  } catch (err) {
    parentPort.postMessage({ success: false, error: err.message });
  }
});
```

### 3. Handle Process-Level Errors

```javascript
// ✅ Good
process.on('uncaughtException', handleUncaughtError);
process.on('unhandledRejection', handleUnhandledRejection);
```

### 4. Send Structured Error Messages

```javascript
// ✅ Good - structured error format
parentPort.postMessage({
  type: 'ERROR',
  error: { message: err.message, stack: err.stack },
  context: { taskId: 123 }
});
```

### 5. Implement Timeouts

```javascript
// ✅ Good - prevent infinite processing
const timeout = setTimeout(() => {
  worker.terminate();
  handleTimeout();
}, 30000);
```

## Key Takeaways

1. **Multiple error sources** - creation, initialization, runtime, promises
2. **Use the 'error' event** - catches uncaught errors in workers
3. **Try-catch in workers** - handle expected errors gracefully
4. **Process-level handlers** - safety net for uncaught errors
5. **Send errors to main thread** - structured error reporting
6. **Implement retry logic** - for transient failures
7. **Validate inputs** - defensive programming prevents errors
8. **Use timeouts** - prevent runaway workers

## Next Steps

You've completed all Level 1 guides! Now practice with the [examples](../examples/) and [exercises](../exercises/) to solidify your understanding.
