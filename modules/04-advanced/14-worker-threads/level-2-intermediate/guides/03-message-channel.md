# MessageChannel - Advanced Communication Patterns

## What is MessageChannel?

`MessageChannel` creates a pair of connected ports (`port1` and `port2`) that can communicate with each other. This enables direct worker-to-worker communication and advanced messaging patterns.

## Basic MessageChannel Usage

### Creating a Channel

```javascript
const { MessageChannel } = require('worker_threads');

const { port1, port2 } = new MessageChannel();

// port1 and port2 are connected
port1.postMessage('hello');
port2.on('message', (msg) => {
  console.log('port2 received:', msg); // 'hello'
});
```

### How It Works

```
┌─────────┐                    ┌─────────┐
│  port1  │◄──────────────────►│  port2  │
└─────────┘    bidirectional   └─────────┘
```

## Worker-to-Worker Communication

### Problem: Workers Can't Communicate Directly

```javascript
// ❌ Workers can only talk to main thread
// Worker 1 → Main → Worker 2 (slow, inefficient)
```

### Solution: MessageChannel

```javascript
// ✅ Workers communicate directly via MessageChannel
// Worker 1 → Worker 2 (fast, efficient)
```

### Implementation

**main.js:**
```javascript
const { Worker, MessageChannel } = require('worker_threads');

// Create two workers
const worker1 = new Worker('./worker1.js');
const worker2 = new Worker('./worker2.js');

// Create a communication channel
const { port1, port2 } = new MessageChannel();

// Send port1 to worker1 (transferable!)
worker1.postMessage({ port: port1 }, [port1]);

// Send port2 to worker2
worker2.postMessage({ port: port2 }, [port2]);

console.log('Workers connected via MessageChannel');
// Now workers can communicate directly without main thread
```

**worker1.js:**
```javascript
const { parentPort } = require('worker_threads');

parentPort.on('message', ({ port }) => {
  console.log('Worker 1: Received port, setting up communication');

  // Send messages to worker 2 via port
  port.postMessage('Hello from Worker 1');

  // Receive messages from worker 2
  port.on('message', (msg) => {
    console.log('Worker 1 received:', msg);
  });
});
```

**worker2.js:**
```javascript
const { parentPort } = require('worker_threads');

parentPort.on('message', ({ port }) => {
  console.log('Worker 2: Received port, setting up communication');

  // Receive messages from worker 1
  port.on('message', (msg) => {
    console.log('Worker 2 received:', msg);

    // Reply to worker 1
    port.postMessage('Hello from Worker 2');
  });
});
```

## Use Cases

### Use Case 1: Pipeline Processing

Each worker processes data and passes to next worker:

```javascript
// main.js - Create processing pipeline
const { Worker, MessageChannel } = require('worker_threads');

const worker1 = new Worker('./filter-worker.js');
const worker2 = new Worker('./transform-worker.js');
const worker3 = new Worker('./aggregate-worker.js');

// Connect worker1 → worker2
const { port1: w1Out, port2: w2In } = new MessageChannel();
worker1.postMessage({ output: w1Out }, [w1Out]);
worker2.postMessage({ input: w2In }, [w2In]);

// Connect worker2 → worker3
const { port1: w2Out, port2: w3In } = new MessageChannel();
worker2.postMessage({ output: w2Out }, [w2Out]);
worker3.postMessage({ input: w3In }, [w3In]);

// Send data to first worker
worker1.postMessage({ data: largeDataset });

// Receive final result from last worker
worker3.on('message', (result) => {
  console.log('Pipeline complete:', result);
});
```

**filter-worker.js:**
```javascript
const { parentPort } = require('worker_threads');

let outputPort;

parentPort.on('message', (msg) => {
  if (msg.output) {
    outputPort = msg.output;
  } else if (msg.data) {
    // Filter data
    const filtered = msg.data.filter(item => item.value > 100);

    // Send to next worker
    outputPort.postMessage(filtered);
  }
});
```

**transform-worker.js:**
```javascript
const { parentPort } = require('worker_threads');

let inputPort, outputPort;

parentPort.on('message', (msg) => {
  if (msg.input) {
    inputPort = msg.input;
    inputPort.on('message', (data) => {
      // Transform data
      const transformed = data.map(item => ({
        ...item,
        value: item.value * 2
      }));

      // Send to next worker
      outputPort.postMessage(transformed);
    });
  }

  if (msg.output) {
    outputPort = msg.output;
  }
});
```

### Use Case 2: Broadcast Channel

Main thread broadcasts to all workers:

```javascript
// main.js - Broadcast to all workers
const { Worker, MessageChannel } = require('worker_threads');

class BroadcastChannel {
  constructor(workerCount = 4) {
    this.workers = [];
    this.ports = [];

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker('./listener-worker.js');
      const { port1, port2 } = new MessageChannel();

      worker.postMessage({ port: port2, id: i }, [port2]);

      this.workers.push(worker);
      this.ports.push(port1);
    }
  }

  broadcast(message) {
    this.ports.forEach(port => {
      port.postMessage(message);
    });
  }

  sendTo(workerId, message) {
    this.ports[workerId].postMessage(message);
  }
}

const broadcast = new BroadcastChannel(4);

// Send to all workers
broadcast.broadcast({ type: 'UPDATE', data: 'new config' });

// Send to specific worker
broadcast.sendTo(0, { type: 'TASK', data: 'special task' });
```

### Use Case 3: Request-Response Pattern

Main thread sends requests to workers via dedicated channels:

```javascript
// main.js
const { Worker, MessageChannel } = require('worker_threads');

class WorkerRPC {
  constructor(workerFile) {
    this.worker = new Worker(workerFile);
    this.nextRequestId = 0;
    this.pendingRequests = new Map();
  }

  async call(method, params) {
    return new Promise((resolve, reject) => {
      const requestId = this.nextRequestId++;

      // Create dedicated channel for this request
      const { port1, port2 } = new MessageChannel();

      // Listen for response on our port
      port1.on('message', (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.result);
        }
        port1.close();
      });

      // Send request with response port
      this.worker.postMessage({
        requestId,
        method,
        params,
        responsePort: port2
      }, [port2]);

      // Timeout handling
      setTimeout(() => {
        if (port1.listenerCount('message') > 0) {
          port1.close();
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }
}

// Usage
const rpc = new WorkerRPC('./rpc-worker.js');

const result1 = await rpc.call('fibonacci', { n: 10 });
const result2 = await rpc.call('factorial', { n: 5 });
```

**rpc-worker.js:**
```javascript
const { parentPort } = require('worker_threads');

const methods = {
  fibonacci(n) {
    if (n <= 1) return n;
    return methods.fibonacci(n - 1) + methods.fibonacci(n - 2);
  },

  factorial(n) {
    if (n <= 1) return 1;
    return n * methods.factorial(n - 1);
  }
};

parentPort.on('message', ({ requestId, method, params, responsePort }) => {
  try {
    const result = methods[method](params.n);
    responsePort.postMessage({ requestId, result });
  } catch (error) {
    responsePort.postMessage({ requestId, error: error.message });
  }
});
```

## Advanced Patterns

### Pattern 1: Round-Robin Load Balancer

```javascript
class RoundRobinPool {
  constructor(workerFile, workerCount = 4) {
    this.workers = [];
    this.currentWorker = 0;

    for (let i = 0; i < workerCount; i++) {
      this.workers.push(new Worker(workerFile));
    }
  }

  async execute(task) {
    return new Promise((resolve, reject) => {
      const { port1, port2 } = new MessageChannel();

      // Listen for result
      port1.on('message', resolve);
      port1.on('messageerror', reject);

      // Send task to next worker in rotation
      const worker = this.workers[this.currentWorker];
      worker.postMessage({ task, responsePort: port2 }, [port2]);

      // Move to next worker
      this.currentWorker = (this.currentWorker + 1) % this.workers.length;
    });
  }
}
```

### Pattern 2: Pub/Sub System

```javascript
class PubSub {
  constructor() {
    this.subscribers = new Map();
  }

  subscribe(topic, worker) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }

    const { port1, port2 } = new MessageChannel();

    // Send port to worker
    worker.postMessage({ subscribe: topic, port: port2 }, [port2]);

    // Store port for publishing
    this.subscribers.get(topic).push(port1);

    return () => this.unsubscribe(topic, port1);
  }

  publish(topic, message) {
    const ports = this.subscribers.get(topic) || [];
    ports.forEach(port => {
      port.postMessage(message);
    });
  }

  unsubscribe(topic, port) {
    const ports = this.subscribers.get(topic) || [];
    const index = ports.indexOf(port);
    if (index !== -1) {
      ports.splice(index, 1);
      port.close();
    }
  }
}

// Usage
const pubsub = new PubSub();

const worker1 = new Worker('./subscriber-worker.js');
const worker2 = new Worker('./subscriber-worker.js');

pubsub.subscribe('updates', worker1);
pubsub.subscribe('updates', worker2);

// Both workers receive this
pubsub.publish('updates', { data: 'new data' });
```

## Port Management

### Opening and Closing Ports

```javascript
const { MessageChannel } = require('worker_threads');

const { port1, port2 } = new MessageChannel();

// Ports start in an open state

// Close a port
port1.close();

// Check if port is closed (ports don't have a .closed property)
// Must track manually
let port1Closed = false;

port1.on('close', () => {
  port1Closed = true;
  console.log('Port1 closed');
});

port1.close();
```

### Handling Port Errors

```javascript
port1.on('messageerror', (err) => {
  console.error('Message deserialization error:', err);
});

port1.on('close', () => {
  console.log('Port closed');
});
```

### Starting Ports

```javascript
// Ports don't automatically start receiving messages
const { port1, port2 } = new MessageChannel();

port1.on('message', (msg) => {
  console.log(msg);
});

// Must call start() to begin receiving
port1.start();

port2.postMessage('hello');
```

## Best Practices

### 1. Transfer Ports Once

```javascript
// ✅ Good: Transfer port ownership
worker.postMessage({ port }, [port]);

// ❌ Bad: Reusing transferred port
worker.postMessage({ port }, [port]);
port.postMessage('test'); // Error: port is transferred
```

### 2. Clean Up Ports

```javascript
// ✅ Good: Close ports when done
function usePort(port) {
  try {
    port.postMessage(data);
  } finally {
    port.close();
  }
}
```

### 3. Handle Port Lifecycle

```javascript
class ManagedPort {
  constructor(port) {
    this.port = port;
    this.closed = false;

    port.on('close', () => {
      this.closed = true;
    });
  }

  postMessage(msg) {
    if (this.closed) {
      throw new Error('Port is closed');
    }
    this.port.postMessage(msg);
  }

  close() {
    if (!this.closed) {
      this.port.close();
      this.closed = true;
    }
  }
}
```

### 4. Document Port Ownership

```javascript
/**
 * Connects worker to processing pipeline
 * @param {Worker} worker
 * @param {MessagePort} inputPort - Ownership transferred to worker
 * @param {MessagePort} outputPort - Ownership transferred to worker
 */
function connectWorker(worker, inputPort, outputPort) {
  worker.postMessage({
    input: inputPort,
    output: outputPort
  }, [inputPort, outputPort]);
}
```

## Key Takeaways

1. **MessageChannel creates paired ports** - Bidirectional communication
2. **Enables worker-to-worker communication** - Bypass main thread
3. **Ports are transferable** - Can be sent to workers
4. **Useful for complex patterns** - Pipelines, pub/sub, RPC
5. **Must manage lifecycle** - Close ports when done
6. **Each port is single-use** - Transfer once

## Next Steps

Learn about [performance monitoring](./04-performance-monitoring.md) to optimize your worker thread applications.
