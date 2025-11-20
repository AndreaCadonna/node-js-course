# Inter-Process Communication (IPC)

Master advanced patterns for communication between parent and child processes using Node.js IPC.

## Table of Contents
- [Introduction](#introduction)
- [IPC Fundamentals](#ipc-fundamentals)
- [Message Patterns](#message-patterns)
- [Request-Response Pattern](#request-response-pattern)
- [Broadcasting](#broadcasting)
- [Message Queuing](#message-queuing)
- [Heartbeat Patterns](#heartbeat-patterns)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Introduction

Inter-Process Communication (IPC) allows parent and child processes to exchange messages. When you use `fork()`, Node.js sets up an IPC channel automatically.

### Why Use IPC?

- **Structured Communication**: Send and receive JavaScript objects
- **Bidirectional**: Both parent and child can initiate messages
- **Event-Driven**: Built on Node.js event system
- **Type Safety**: Automatically serializes/deserializes data

---

## IPC Fundamentals

### Basic IPC Setup

```javascript
// parent.js
const { fork } = require('child_process');

const child = fork('./worker.js');

// Send message to child
child.send({ type: 'task', data: 'process this' });

// Receive message from child
child.on('message', (msg) => {
  console.log('From child:', msg);
});
```

```javascript
// worker.js
process.on('message', (msg) => {
  console.log('From parent:', msg);

  // Send reply
  process.send({ type: 'result', data: 'processed!' });
});
```

### Message Flow

```
Parent Process              Child Process
--------------              -------------
     |                           |
     |-- send() -------------->  | on('message')
     |                           |
     |  on('message') <-------- | send()
     |                           |
```

### What Can Be Sent?

IPC uses `JSON.stringify()` internally, so you can send:

```javascript
// Primitives
child.send(42);
child.send('hello');
child.send(true);

// Objects
child.send({ name: 'task', data: [1, 2, 3] });

// Arrays
child.send(['item1', 'item2', 'item3']);

// But NOT:
// - Functions
// - Circular references
// - Special objects (Date objects work, but functions don't)
```

---

## Message Patterns

### 1. Simple Notification

Parent notifies child without expecting response:

```javascript
// Parent
child.send({ type: 'notification', message: 'Server started' });

// Child
process.on('message', (msg) => {
  if (msg.type === 'notification') {
    console.log('Notification:', msg.message);
  }
});
```

### 2. Command Pattern

Parent sends commands, child executes:

```javascript
// Parent
child.send({ command: 'start' });
child.send({ command: 'process', data: [...] });
child.send({ command: 'stop' });

// Child
process.on('message', (msg) => {
  switch (msg.command) {
    case 'start':
      startProcessing();
      break;
    case 'process':
      processData(msg.data);
      break;
    case 'stop':
      stopProcessing();
      break;
  }
});
```

### 3. Data Streaming Pattern

Continuous data flow:

```javascript
// Parent
for (let i = 0; i < 1000; i++) {
  child.send({ type: 'data', chunk: i });
}
child.send({ type: 'end' });

// Child
let chunks = [];
process.on('message', (msg) => {
  if (msg.type === 'data') {
    chunks.push(msg.chunk);
  } else if (msg.type === 'end') {
    processAllChunks(chunks);
  }
});
```

---

## Request-Response Pattern

### Basic Implementation

```javascript
// Parent
class WorkerClient {
  constructor(workerPath) {
    this.worker = fork(workerPath);
    this.pending = new Map();
    this.nextId = 1;

    this.worker.on('message', (msg) => {
      const { id, result, error } = msg;
      const pending = this.pending.get(id);

      if (pending) {
        this.pending.delete(id);
        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve(result);
        }
      }
    });
  }

  request(data) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.worker.send({ id, data });

      // Timeout
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 5000);
    });
  }
}

// Usage
const client = new WorkerClient('./worker.js');

async function main() {
  try {
    const result = await client.request({ task: 'compute', n: 100 });
    console.log('Result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}
```

```javascript
// worker.js
process.on('message', (msg) => {
  const { id, data } = msg;

  try {
    const result = performTask(data);
    process.send({ id, result });
  } catch (error) {
    process.send({ id, error: error.message });
  }
});

function performTask(data) {
  // Do work
  return data.n * 2;
}
```

### With TypeScript-like Typing

```javascript
// Define message types
const MessageTypes = {
  CALCULATE: 'calculate',
  FETCH_DATA: 'fetch_data',
  PROCESS: 'process'
};

// Parent
async function calculate(a, b) {
  return client.request({
    type: MessageTypes.CALCULATE,
    operation: 'add',
    values: [a, b]
  });
}

// Worker
process.on('message', (msg) => {
  const { id, type, ...data } = msg;

  let result;
  switch (type) {
    case MessageTypes.CALCULATE:
      result = data.values.reduce((a, b) => a + b, 0);
      break;
    case MessageTypes.FETCH_DATA:
      result = fetchData(data.url);
      break;
    case MessageTypes.PROCESS:
      result = processData(data.input);
      break;
  }

  process.send({ id, result });
});
```

---

## Broadcasting

### Broadcasting to Multiple Workers

```javascript
class WorkerPool {
  constructor(workerPath, count) {
    this.workers = Array.from({ length: count }, () =>
      fork(workerPath)
    );
  }

  broadcast(message) {
    this.workers.forEach(worker => {
      worker.send(message);
    });
  }

  onMessage(callback) {
    this.workers.forEach((worker, index) => {
      worker.on('message', (msg) => {
        callback(msg, index, worker);
      });
    });
  }
}

// Usage
const pool = new WorkerPool('./worker.js', 4);

// Send to all workers
pool.broadcast({ type: 'config', data: { debug: true } });

// Collect responses
pool.onMessage((msg, workerIndex) => {
  console.log(`Worker ${workerIndex}:`, msg);
});
```

### Selective Broadcasting

```javascript
class SmartPool {
  constructor(workerPath, count) {
    this.workers = Array.from({ length: count }, (_, i) => ({
      id: i,
      process: fork(workerPath),
      roles: new Set()
    }));
  }

  assignRole(workerId, role) {
    const worker = this.workers.find(w => w.id === workerId);
    if (worker) {
      worker.roles.add(role);
    }
  }

  broadcastToRole(role, message) {
    this.workers
      .filter(w => w.roles.has(role))
      .forEach(w => w.process.send(message));
  }
}

// Usage
const pool = new SmartPool('./worker.js', 4);

pool.assignRole(0, 'processor');
pool.assignRole(1, 'processor');
pool.assignRole(2, 'logger');
pool.assignRole(3, 'logger');

// Only send to processors
pool.broadcastToRole('processor', { task: 'process' });

// Only send to loggers
pool.broadcastToRole('logger', { log: 'event occurred' });
```

---

## Message Queuing

### Queue-Based Task Distribution

```javascript
class TaskQueue {
  constructor(workerPath, poolSize) {
    this.workers = [];
    this.queue = [];

    for (let i = 0; i < poolSize; i++) {
      const worker = {
        process: fork(workerPath),
        busy: false,
        currentTask: null
      };

      worker.process.on('message', (msg) => {
        this.handleResult(worker, msg);
      });

      this.workers.push(worker);
    }
  }

  enqueue(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task,
        resolve,
        reject,
        timestamp: Date.now()
      });
      this.processQueue();
    });
  }

  processQueue() {
    const availableWorker = this.workers.find(w => !w.busy);

    if (availableWorker && this.queue.length > 0) {
      const item = this.queue.shift();
      const waitTime = Date.now() - item.timestamp;

      availableWorker.busy = true;
      availableWorker.currentTask = item;
      availableWorker.process.send({
        ...item.task,
        waitTime
      });
    }
  }

  handleResult(worker, result) {
    worker.busy = false;
    if (worker.currentTask) {
      worker.currentTask.resolve(result);
      worker.currentTask = null;
    }
    this.processQueue();
  }

  getQueueDepth() {
    return this.queue.length;
  }

  getActiveCount() {
    return this.workers.filter(w => w.busy).length;
  }
}

// Usage
const queue = new TaskQueue('./worker.js', 3);

// Enqueue many tasks
for (let i = 0; i < 100; i++) {
  queue.enqueue({ id: i, data: `task-${i}` })
    .then(result => console.log(`Task ${i} completed:`, result));
}

// Monitor queue
setInterval(() => {
  console.log(`Queue: ${queue.getQueueDepth()}, Active: ${queue.getActiveCount()}`);
}, 1000);
```

---

## Heartbeat Patterns

### Basic Heartbeat

```javascript
// Parent
class MonitoredWorker {
  constructor(workerPath) {
    this.worker = fork(workerPath);
    this.lastHeartbeat = Date.now();
    this.heartbeatInterval = null;

    this.worker.on('message', (msg) => {
      if (msg.type === 'heartbeat') {
        this.lastHeartbeat = Date.now();
      }
    });

    this.startMonitoring();
  }

  startMonitoring() {
    // Request heartbeat every 2 seconds
    this.heartbeatInterval = setInterval(() => {
      this.worker.send({ type: 'heartbeat-request' });

      // Check if worker is responsive
      const timeSinceLastBeat = Date.now() - this.lastHeartbeat;
      if (timeSinceLastBeat > 5000) {
        console.error('Worker unresponsive!');
        this.restart();
      }
    }, 2000);
  }

  restart() {
    clearInterval(this.heartbeatInterval);
    this.worker.kill();
    // Create new worker...
  }
}

// Worker
process.on('message', (msg) => {
  if (msg.type === 'heartbeat-request') {
    process.send({ type: 'heartbeat', timestamp: Date.now() });
  }
});
```

### Health Check Pattern

```javascript
// Parent
class HealthMonitor {
  constructor(worker) {
    this.worker = worker;
    this.metrics = {
      memory: 0,
      cpu: 0,
      taskCount: 0,
      errors: 0
    };
  }

  async checkHealth() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ healthy: false, reason: 'timeout' });
      }, 3000);

      this.worker.send({ type: 'health-check' });

      const handler = (msg) => {
        if (msg.type === 'health-status') {
          clearTimeout(timeout);
          this.worker.off('message', handler);
          this.metrics = msg.metrics;
          resolve({ healthy: msg.healthy, metrics: msg.metrics });
        }
      };

      this.worker.on('message', handler);
    });
  }
}

// Worker
let taskCount = 0;
let errorCount = 0;

process.on('message', (msg) => {
  if (msg.type === 'health-check') {
    const memUsage = process.memoryUsage();

    process.send({
      type: 'health-status',
      healthy: errorCount < 10 && memUsage.heapUsed < 500 * 1024 * 1024,
      metrics: {
        memory: memUsage.heapUsed,
        taskCount,
        errors: errorCount,
        uptime: process.uptime()
      }
    });
  }
});
```

---

## Error Handling

### Handling IPC Errors

```javascript
const child = fork('./worker.js');

// Handle disconnect
child.on('disconnect', () => {
  console.log('IPC channel disconnected');
});

// Handle worker errors
child.on('error', (err) => {
  console.error('Worker error:', err);
});

// Handle worker exit
child.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`Worker crashed: code=${code}, signal=${signal}`);
  }
});

// Send with error handling
function safeSend(worker, message) {
  try {
    if (worker.connected) {
      worker.send(message);
      return true;
    } else {
      console.error('Worker not connected');
      return false;
    }
  } catch (err) {
    console.error('Failed to send message:', err);
    return false;
  }
}
```

### Validating Messages

```javascript
// Worker with validation
process.on('message', (msg) => {
  // Validate message structure
  if (!msg || typeof msg !== 'object') {
    process.send({
      error: 'Invalid message format',
      received: typeof msg
    });
    return;
  }

  // Validate required fields
  if (!msg.type) {
    process.send({
      error: 'Missing message type'
    });
    return;
  }

  // Process valid message
  handleMessage(msg);
});
```

---

## Best Practices

### 1. Use Message Types

```javascript
// GOOD - clear message types
const MSG_TYPES = {
  TASK: 'task',
  RESULT: 'result',
  ERROR: 'error',
  HEARTBEAT: 'heartbeat'
};

child.send({ type: MSG_TYPES.TASK, data: {...} });

// AVOID - unstructured messages
child.send({ doSomething: true, withThis: data });
```

### 2. Always Include Message IDs

```javascript
// GOOD - can correlate requests and responses
child.send({
  id: generateId(),
  type: 'request',
  data: {...}
});

// AVOID - hard to match responses to requests
child.send({ data: {...} });
```

### 3. Implement Timeouts

```javascript
function sendWithTimeout(worker, message, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout'));
    }, timeout);

    worker.send(message);

    worker.once('message', (response) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}
```

### 4. Handle Disconnection

```javascript
child.on('disconnect', () => {
  // Clear pending requests
  pendingRequests.forEach((req) => {
    req.reject(new Error('Worker disconnected'));
  });
  pendingRequests.clear();
});
```

### 5. Version Your Protocol

```javascript
const MESSAGE_PROTOCOL_VERSION = '1.0';

child.send({
  version: MESSAGE_PROTOCOL_VERSION,
  type: 'task',
  data: {...}
});

// Worker validates version
process.on('message', (msg) => {
  if (msg.version !== MESSAGE_PROTOCOL_VERSION) {
    console.error('Protocol version mismatch');
    return;
  }
  // Process message
});
```

---

## Summary

Key takeaways:
- IPC enables structured communication between processes
- Use message types and IDs for clear protocols
- Implement request-response for async operations
- Use broadcasting for worker pool coordination
- Message queues help manage load distribution
- Heartbeats monitor worker health
- Always validate messages and handle errors
- Version your message protocol for compatibility

IPC is the foundation for building sophisticated multi-process architectures in Node.js!
