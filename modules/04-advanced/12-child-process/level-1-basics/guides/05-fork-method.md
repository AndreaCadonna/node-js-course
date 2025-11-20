# The fork() Method

## Introduction

This guide explains `child_process.fork()`, the specialized method for creating Node.js child processes with Inter-Process Communication (IPC).

---

## What is fork()?

### Definition

`fork()` is a special case of `spawn()` designed specifically for spawning new Node.js processes with a built-in communication channel.

```javascript
const { fork } = require('child_process');

// Create a child Node.js process
const child = fork('worker.js');

// Send message to child
child.send({ task: 'process', data: [1, 2, 3] });

// Receive message from child
child.on('message', (result) => {
  console.log('Child sent:', result);
});
```

### Why fork() Exists

**The problem:** You need to run CPU-intensive JavaScript code without blocking the main event loop.

**The solution:** fork() creates a separate Node.js process that can run in parallel.

---

## fork() vs Other Methods

| Feature | fork() | spawn() | exec() |
|---------|--------|---------|--------|
| Creates | Node.js process | Any process | Shell command |
| IPC channel | Yes (built-in) | No | No |
| Can send objects | Yes | No | No |
| Best for | Node.js parallel tasks | System commands | Quick commands |
| Communication | Messages | Streams | Buffered output |

---

## How fork() Works

### Process Flow

```
┌────────────────────────────────────┐
│  Parent Process (main.js)          │
│                                    │
│  const child = fork('worker.js')  │
└──────────────┬─────────────────────┘
               │ fork()
               │
        ┌──────▼──────┐
        │             │
        ↓             ↓
┌─────────────┐  ┌─────────────┐
│   Parent    │  │   Child     │
│  Process    │  │  Process    │
│             │  │             │
│  PID: 1234  │  │  PID: 1235  │
│             │  │             │
│  main.js    │  │  worker.js  │
└──────┬──────┘  └──────┬──────┘
       │                 │
       │  IPC Channel    │
       │ ←────────────→  │
       │                 │
       │ send({...})     │
       │ ─────────────→  │
       │                 │
       │ on('message')   │
       │ ←─────────────  │
       └─────────────────┘
```

---

## Basic Usage

### Parent Process (main.js)

```javascript
const { fork } = require('child_process');

// Fork a child process
const child = fork('./worker.js');

// Send data to child
child.send({
  type: 'task',
  data: { numbers: [1, 2, 3, 4, 5] }
});

// Listen for messages from child
child.on('message', (message) => {
  console.log('Received from child:', message);

  if (message.type === 'result') {
    console.log('Result:', message.data);
  }
});

// Listen for exit
child.on('exit', (code) => {
  console.log(`Child exited with code ${code}`);
});

// Handle errors
child.on('error', (error) => {
  console.error('Child process error:', error);
});
```

### Child Process (worker.js)

```javascript
// Receive messages from parent
process.on('message', (message) => {
  console.log('Child received:', message);

  if (message.type === 'task') {
    // Process the data
    const result = processData(message.data);

    // Send result back to parent
    process.send({
      type: 'result',
      data: result
    });

    // Exit when done
    process.exit(0);
  }
});

function processData(data) {
  // Do something with data
  const sum = data.numbers.reduce((a, b) => a + b, 0);
  return { sum };
}

// Notify parent that worker is ready
process.send({ type: 'ready' });
```

---

## Signature and Options

```javascript
child_process.fork(modulePath[, args][, options])
```

### Parameters

- `modulePath` (string): Path to Node.js script to run
- `args` (array): Command-line arguments for the child
- `options` (object): Configuration options

### Options

```javascript
const options = {
  // Working directory
  cwd: '/path/to/dir',

  // Environment variables
  env: { ...process.env, CUSTOM: 'value' },

  // Node.js executable path
  execPath: '/usr/bin/node',

  // Arguments for Node.js itself
  execArgv: ['--max-old-space-size=4096'],

  // Enable/configure IPC
  silent: false,  // false = child inherits parent's stdio

  // stdio configuration
  stdio: ['pipe', 'pipe', 'pipe', 'ipc'],  // IPC always included

  // Detach child from parent
  detached: false,

  // User ID (Unix)
  uid: 1000,

  // Group ID (Unix)
  gid: 1000
};

const child = fork('worker.js', [], options);
```

### Important Options Explained

#### silent
```javascript
// silent: false (default) - child inherits parent's stdio
const child = fork('worker.js', [], { silent: false });
// Console.log in child appears in parent's console

// silent: true - child has separate stdio
const child = fork('worker.js', [], { silent: true });
// Child's console.log goes to child.stdout
child.stdout.on('data', (data) => {
  console.log('Child logged:', data.toString());
});
```

#### execArgv
```javascript
// Pass Node.js flags to child
const child = fork('worker.js', [], {
  execArgv: [
    '--max-old-space-size=4096',  // Increase memory
    '--inspect=9230'               // Enable debugger
  ]
});
```

---

## Communication Patterns

### Pattern 1: Request-Response

```javascript
// Parent
function sendRequest(taskType, data) {
  return new Promise((resolve, reject) => {
    const requestId = Date.now();

    child.send({
      id: requestId,
      type: 'request',
      task: taskType,
      data
    });

    function handler(message) {
      if (message.id === requestId && message.type === 'response') {
        child.off('message', handler);
        resolve(message.result);
      }
    }

    child.on('message', handler);
  });
}

// Usage
const result = await sendRequest('calculate', { x: 10, y: 20 });
```

```javascript
// Child (worker.js)
process.on('message', (message) => {
  if (message.type === 'request') {
    // Process request
    let result;

    switch (message.task) {
      case 'calculate':
        result = message.data.x + message.data.y;
        break;
    }

    // Send response
    process.send({
      id: message.id,
      type: 'response',
      result
    });
  }
});
```

### Pattern 2: Streaming Results

```javascript
// Parent
const child = fork('stream-worker.js');

child.on('message', (message) => {
  if (message.type === 'progress') {
    console.log(`Progress: ${message.percent}%`);
  } else if (message.type === 'result') {
    console.log('Final result:', message.data);
  }
});

child.send({ type: 'start', items: 100 });
```

```javascript
// Child (stream-worker.js)
process.on('message', (message) => {
  if (message.type === 'start') {
    const total = message.items;

    for (let i = 0; i < total; i++) {
      // Process item
      processItem(i);

      // Report progress
      const percent = Math.round((i + 1) / total * 100);
      process.send({
        type: 'progress',
        percent,
        current: i + 1,
        total
      });
    }

    // Send final result
    process.send({
      type: 'result',
      data: { processed: total }
    });
  }
});
```

### Pattern 3: Worker Pool

```javascript
class WorkerPool {
  constructor(workerPath, poolSize = 4) {
    this.workers = [];
    this.queue = [];

    // Create workers
    for (let i = 0; i < poolSize; i++) {
      this.workers.push({
        child: fork(workerPath),
        busy: false
      });

      // Listen to messages
      this.workers[i].child.on('message', (message) => {
        if (message.type === 'done') {
          this.workers[i].busy = false;
          this.processQueue();
        }
      });
    }
  }

  execute(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  processQueue() {
    // Find available worker
    const worker = this.workers.find(w => !w.busy);

    if (!worker || this.queue.length === 0) {
      return;
    }

    // Get next task
    const { task, resolve } = this.queue.shift();

    // Mark worker as busy
    worker.busy = true;

    // Set up one-time listener for result
    function resultHandler(message) {
      if (message.type === 'result') {
        worker.child.off('message', resultHandler);
        resolve(message.data);
      }
    }

    worker.child.on('message', resultHandler);

    // Send task to worker
    worker.child.send(task);
  }

  shutdown() {
    this.workers.forEach(w => w.child.kill());
  }
}

// Usage
const pool = new WorkerPool('./worker.js', 4);
const results = await Promise.all([
  pool.execute({ type: 'task', data: 1 }),
  pool.execute({ type: 'task', data: 2 }),
  pool.execute({ type: 'task', data: 3 })
]);
pool.shutdown();
```

---

## CPU-Intensive Task Example

### Parent (main.js)

```javascript
const { fork } = require('child_process');

async function calculatePrimes(max) {
  return new Promise((resolve, reject) => {
    const child = fork('./prime-worker.js');

    child.send({ max });

    child.on('message', (message) => {
      if (message.type === 'result') {
        child.kill();
        resolve(message.primes);
      } else if (message.type === 'progress') {
        console.log(`Progress: ${message.percent}%`);
      }
    });

    child.on('error', reject);
  });
}

// Main thread remains responsive
console.log('Calculating primes...');
const primes = await calculatePrimes(1000000);
console.log(`Found ${primes.length} primes`);
```

### Worker (prime-worker.js)

```javascript
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

process.on('message', (message) => {
  const max = message.max;
  const primes = [];

  for (let i = 2; i < max; i++) {
    if (isPrime(i)) {
      primes.push(i);
    }

    // Report progress every 10%
    if (i % Math.floor(max / 10) === 0) {
      process.send({
        type: 'progress',
        percent: Math.round(i / max * 100)
      });
    }
  }

  // Send result
  process.send({
    type: 'result',
    primes
  });

  process.exit(0);
});
```

---

## Best Practices

### 1. Always Handle Messages
```javascript
// Good: Handle all message types
child.on('message', (message) => {
  switch (message.type) {
    case 'result':
      handleResult(message);
      break;
    case 'error':
      handleError(message);
      break;
    case 'progress':
      handleProgress(message);
      break;
    default:
      console.warn('Unknown message type:', message.type);
  }
});
```

### 2. Clean Up on Exit
```javascript
// Set up cleanup
function cleanup() {
  child.kill();
}

process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
```

### 3. Handle Worker Crashes
```javascript
const child = fork('worker.js');

child.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`Worker crashed with code ${code}`);

    // Restart worker
    setTimeout(() => {
      const newChild = fork('worker.js');
      // Set up handlers again
    }, 1000);
  }
});
```

### 4. Use Structured Messages
```javascript
// Good: Structured messages
const MESSAGE_TYPES = {
  REQUEST: 'request',
  RESPONSE: 'response',
  ERROR: 'error',
  PROGRESS: 'progress'
};

child.send({
  type: MESSAGE_TYPES.REQUEST,
  id: generateId(),
  data: payload
});
```

### 5. Limit Worker Count
```javascript
const os = require('os');

// Don't exceed CPU count
const maxWorkers = os.cpus().length;
const pool = new WorkerPool('worker.js', maxWorkers);
```

---

## Common Pitfalls

### Pitfall 1: Forgetting to Exit
```javascript
// Child process never exits!
// Bad:
process.on('message', (message) => {
  const result = doWork(message);
  process.send({ result });
  // Missing: process.exit(0)
});

// Good:
process.on('message', (message) => {
  const result = doWork(message);
  process.send({ result });
  process.exit(0);
});
```

### Pitfall 2: Not Handling Errors
```javascript
// Bad: No error handling
const child = fork('worker.js');

// Good: Handle errors
const child = fork('worker.js');
child.on('error', (error) => {
  console.error('Worker error:', error);
});
```

### Pitfall 3: Memory Leaks
```javascript
// Bad: Workers never cleaned up
for (let i = 0; i < 1000; i++) {
  fork('worker.js'); // Creates 1000 processes!
}

// Good: Reuse workers
const worker = fork('worker.js');
for (let i = 0; i < 1000; i++) {
  worker.send({ task: i });
}
```

---

## Summary

### When to Use fork()

✅ **Perfect for:**
- CPU-intensive JavaScript code
- Parallel Node.js processing
- Worker pools
- Background tasks in Node.js
- Multi-core utilization

❌ **Not for:**
- System commands (use spawn/exec)
- Simple tasks (overhead too high)
- Shared memory needs (use worker_threads)

### Quick Reference

```javascript
// Create worker
const child = fork('worker.js');

// Send message
child.send({ type: 'task', data: value });

// Receive messages
child.on('message', (message) => {
  console.log('Received:', message);
});

// Cleanup
child.kill();
```

### Next Steps

- [Choosing the Right Method](./06-choosing-the-right-method.md)

---

Continue to [Choosing the Right Method Guide](./06-choosing-the-right-method.md)!
