# Creating Your First Worker

## The Worker Class

Worker threads are created using the `Worker` class from the `worker_threads` module:

```javascript
const { Worker } = require('worker_threads');

// Create a worker that runs code from a file
const worker = new Worker('./my-worker.js');
```

## Basic Worker Creation

### Step 1: Create the Main File

**main.js:**
```javascript
const { Worker } = require('worker_threads');

console.log('Main thread: Starting');

// Create a worker
const worker = new Worker('./worker.js');

console.log('Main thread: Worker created');

// Listen for messages from worker
worker.on('message', (message) => {
  console.log('Main thread: Received message:', message);
});

console.log('Main thread: Setup complete');
```

### Step 2: Create the Worker File

**worker.js:**
```javascript
const { parentPort } = require('worker_threads');

console.log('Worker thread: Starting');

// Send a message to the main thread
parentPort.postMessage('Hello from worker!');

console.log('Worker thread: Message sent');
```

### Step 3: Run It

```bash
$ node main.js
Main thread: Starting
Main thread: Worker created
Main thread: Setup complete
Worker thread: Starting
Worker thread: Message sent
Main thread: Received message: Hello from worker!
```

## Worker Constructor Options

The Worker constructor accepts several options:

```javascript
const worker = new Worker('./worker.js', {
  // Pass initial data to the worker
  workerData: { config: 'value' },

  // Environment variables for the worker
  env: process.env,

  // stdin: true allows worker to read from stdin
  stdin: true,

  // stdout: true redirects worker stdout to parent
  stdout: true,

  // stderr: true redirects worker stderr to parent
  stderr: true,

  // Track unmanaged file descriptors
  trackUnmanagedFds: true
});
```

### Most Common Options

```javascript
const { Worker } = require('worker_threads');

// Typical usage: passing initialization data
const worker = new Worker('./worker.js', {
  workerData: {
    task: 'process',
    input: [1, 2, 3, 4, 5],
    config: { timeout: 5000 }
  }
});
```

## Worker File vs Eval Mode

### Method 1: Worker from File (Recommended)

```javascript
// Most common and recommended approach
const worker = new Worker('./worker.js');
```

**Advantages:**
- Clear separation of concerns
- Easy to debug
- Can be reused
- Familiar file structure

### Method 2: Worker from String (eval mode)

```javascript
// Execute code from a string
const worker = new Worker(`
  const { parentPort } = require('worker_threads');
  parentPort.postMessage('Hello from inline worker!');
`, { eval: true });
```

**Advantages:**
- No separate file needed
- Dynamic code generation

**Disadvantages:**
- Harder to debug
- Security concerns
- Not recommended for production

## Worker Module Imports

### CommonJS (require)

```javascript
// worker.js
const { parentPort } = require('worker_threads');
const fs = require('fs');
const path = require('path');

// Use modules normally
```

### ES Modules (import)

```javascript
// worker.mjs (or worker.js with "type": "module" in package.json)
import { parentPort } from 'worker_threads';
import fs from 'fs';

// Use ES modules
```

## Basic Worker Patterns

### Pattern 1: One-Time Computation

```javascript
// main.js
const { Worker } = require('worker_threads');

function runWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./compute.js', {
      workerData: data
    });

    worker.on('message', (result) => {
      resolve(result);
      worker.terminate(); // Clean up
    });

    worker.on('error', reject);

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

// Usage
const result = await runWorker({ numbers: [1, 2, 3, 4, 5] });
console.log('Result:', result);
```

### Pattern 2: Long-Running Worker

```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker('./processor.js');

// Send multiple tasks to the same worker
worker.postMessage({ task: 'task1', data: 'data1' });
worker.postMessage({ task: 'task2', data: 'data2' });
worker.postMessage({ task: 'task3', data: 'data3' });

worker.on('message', (result) => {
  console.log('Task completed:', result);
});

// Later, when done with worker
process.on('exit', () => {
  worker.terminate();
});
```

### Pattern 3: Request-Response

```javascript
// main.js
const { Worker } = require('worker_threads');

class WorkerService {
  constructor() {
    this.worker = new Worker('./service.js');
    this.callbacks = new Map();
    this.messageId = 0;

    this.worker.on('message', ({ id, result, error }) => {
      const callback = this.callbacks.get(id);
      if (callback) {
        this.callbacks.delete(id);
        if (error) {
          callback.reject(error);
        } else {
          callback.resolve(result);
        }
      }
    });
  }

  async execute(data) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      this.callbacks.set(id, { resolve, reject });
      this.worker.postMessage({ id, data });
    });
  }

  terminate() {
    return this.worker.terminate();
  }
}

// Usage
const service = new WorkerService();
const result1 = await service.execute({ task: 'compute', value: 42 });
const result2 = await service.execute({ task: 'process', value: 100 });
await service.terminate();
```

## Worker File Location

### Relative Paths

```javascript
// Relative to current file
const worker = new Worker('./worker.js');
const worker = new Worker('./workers/processor.js');
const worker = new Worker('../shared/worker.js');
```

### Absolute Paths

```javascript
const path = require('path');

// Using __dirname for absolute path
const worker = new Worker(path.join(__dirname, 'worker.js'));

// Or use require.resolve
const worker = new Worker(require.resolve('./worker.js'));
```

### URL-based Paths (ES Modules)

```javascript
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const worker = new Worker(path.join(__dirname, 'worker.js'));
```

## Common Creation Patterns

### Creating Multiple Workers

```javascript
const { Worker } = require('worker_threads');

// Create a pool of workers
const workers = [];
const numWorkers = 4;

for (let i = 0; i < numWorkers; i++) {
  const worker = new Worker('./worker.js', {
    workerData: { workerId: i }
  });
  workers.push(worker);
}

console.log(`Created ${workers.length} workers`);
```

### Conditional Worker Creation

```javascript
const { Worker } = require('worker_threads');
const os = require('os');

// Create workers based on CPU cores
const numCPUs = os.cpus().length;
const numWorkers = Math.max(1, numCPUs - 1); // Leave one core for main thread

const workers = Array.from({ length: numWorkers }, (_, i) => {
  return new Worker('./worker.js', {
    workerData: { id: i }
  });
});
```

### Worker with Timeout

```javascript
function createWorkerWithTimeout(workerFile, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFile);

    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error('Worker timeout'));
    }, timeout);

    worker.on('message', (result) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    });

    worker.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// Usage
try {
  const result = await createWorkerWithTimeout('./worker.js', 3000);
  console.log('Result:', result);
} catch (err) {
  console.error('Worker failed:', err.message);
}
```

## Checking Worker Thread Context

Determine if code is running in main thread or worker:

```javascript
const { isMainThread, Worker, parentPort } = require('worker_threads');

if (isMainThread) {
  // This code runs in the main thread
  console.log('Running in main thread');
  const worker = new Worker(__filename); // Run this same file as worker

} else {
  // This code runs in the worker thread
  console.log('Running in worker thread');
  parentPort.postMessage('Hello from worker!');
}
```

This pattern allows a single file to contain both main and worker code.

## Best Practices

### 1. Always Handle Errors

```javascript
const worker = new Worker('./worker.js');

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

worker.on('exit', (code) => {
  if (code !== 0) {
    console.error('Worker exited with error code:', code);
  }
});
```

### 2. Terminate Workers When Done

```javascript
worker.on('message', (result) => {
  console.log('Result:', result);
  worker.terminate(); // Clean up resources
});
```

### 3. Use Absolute Paths for Reliability

```javascript
const path = require('path');
const worker = new Worker(path.join(__dirname, 'worker.js'));
```

### 4. Pass Configuration via workerData

```javascript
const worker = new Worker('./worker.js', {
  workerData: {
    config: loadConfig(),
    environment: process.env.NODE_ENV
  }
});
```

## Key Takeaways

1. **Workers are created with the Worker class** from `worker_threads`
2. **Workers typically run code from separate files** using file paths
3. **Options allow passing initial data and configuration** via workerData
4. **Always handle worker events** (error, exit, message)
5. **Terminate workers** when they're no longer needed
6. **Use isMainThread** to create hybrid main/worker files

## Next Steps

Now that you can create workers, learn about [message passing](./03-message-passing.md) to communicate between threads.
