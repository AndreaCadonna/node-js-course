# Advanced IPC Patterns

Master advanced inter-process communication techniques including handle passing, shared memory concepts, and high-performance messaging patterns.

## Table of Contents
- [Introduction](#introduction)
- [Handle Passing](#handle-passing)
- [Zero-Copy Communication](#zero-copy-communication)
- [Protocol Design](#protocol-design)
- [Message Patterns](#message-patterns)
- [Performance Optimization](#performance-optimization)
- [Best Practices](#best-practices)

---

## Introduction

### Beyond Basic IPC

Basic IPC uses `process.send()` for message passing. Advanced patterns include:

- **Handle passing** - Share TCP/HTTP servers across processes
- **Shared handles** - Multiple processes handle connections
- **Binary protocols** - Efficient data serialization
- **Streaming** - Transfer large datasets
- **Pub-sub** - One-to-many messaging
- **Request-response** - RPC-style communication

### Why Advanced IPC?

**Benefits:**
- **Performance** - Reduce overhead, increase throughput
- **Scalability** - Handle more connections
- **Efficiency** - Zero-downtime deploys
- **Flexibility** - Support complex patterns

---

## Handle Passing

### What is Handle Passing?

Handle passing allows sending server handles (TCP, HTTP) to child processes, enabling multiple processes to accept connections on the same port.

### TCP Server Handle Passing

```javascript
// Parent process
const { fork } = require('child_process');
const net = require('net');

// Create workers
const workers = [];
for (let i = 0; i < 4; i++) {
  const worker = fork('worker.js');
  workers.push(worker);
}

// Create server
const server = net.createServer();

server.listen(8000, () => {
  console.log('Server listening on port 8000');

  // Pass server handle to each worker
  workers.forEach(worker => {
    worker.send('server', server);
  });

  // Close server in parent (workers will handle connections)
  server.close();
});
```

```javascript
// worker.js
const net = require('net');

process.on('message', (msg, handle) => {
  if (msg === 'server') {
    // Worker now handles connections
    handle.on('connection', (socket) => {
      console.log(`Worker ${process.pid} handling connection`);
      socket.write(`Handled by ${process.pid}\n`);
      socket.pipe(socket);
    });
  }
});
```

### HTTP Server Handle Passing

```javascript
// Parent
const http = require('http');
const { fork } = require('child_process');

const workers = [];
for (let i = 0; i < 4; i++) {
  workers.push(fork('http-worker.js'));
}

const server = net.createServer();
server.listen(3000, () => {
  workers.forEach(worker => {
    worker.send('server', server._handle);
  });
  server.close();
});
```

```javascript
// http-worker.js
const http = require('http');

process.on('message', (msg, handle) => {
  if (msg === 'server') {
    const server = http.createServer((req, res) => {
      res.end(`Handled by worker ${process.pid}`);
    });

    server.listen(handle);
  }
});
```

### How It Works

```
┌─────────────┐
│   Parent    │
│  (Server)   │
└──────┬──────┘
       │
       │ Pass handle
       ├────────┬────────┬────────┐
       │        │        │        │
   ┌───▼───┐┌──▼───┐┌──▼───┐┌──▼───┐
   │Worker1││Worker2││Worker3││Worker4│
   └───────┘└──────┘└──────┘└──────┘
       │        │        │        │
       └────────┴────────┴────────┘
                  │
            ┌─────▼─────┐
            │ OS Kernel │  ← Load balances
            │ (Socket)  │     connections
            └───────────┘
```

**Key Points:**
- OS kernel distributes connections
- No application-level load balancing needed
- Near-perfect distribution
- Zero-downtime possible

---

## Zero-Copy Communication

### Binary Data Transfer

Use Buffers for efficient data transfer:

```javascript
// Sender
const data = Buffer.from('large binary data');
childProcess.send({
  type: 'binary',
  data: data // Sent without copying
});

// Receiver
process.on('message', (msg) => {
  if (msg.type === 'binary') {
    // msg.data is a Buffer
    processBuffer(msg.data);
  }
});
```

### Shared Memory (Conceptual)

Node.js doesn't have true shared memory, but you can:

**1. Use SharedArrayBuffer (experimental)**
```javascript
const { Worker } = require('worker_threads');

// Create shared memory
const sharedBuffer = new SharedArrayBuffer(1024);
const sharedArray = new Int32Array(sharedBuffer);

// Pass to worker
const worker = new Worker('./worker.js', {
  workerData: { sharedBuffer }
});

// Both parent and worker can access sharedArray
```

**2. Use Memory-Mapped Files**
```javascript
const mmap = require('mmap-io');
const fs = require('fs');

// Create/open file
const fd = fs.openSync('shared.dat', 'r+');

// Map to memory
const buffer = mmap.map(
  size,
  mmap.PROT_READ | mmap.PROT_WRITE,
  mmap.MAP_SHARED,
  fd
);

// Share across processes (both can access file)
```

**3. Use External Systems**
```javascript
// Redis for shared state
const redis = require('redis');
const client = redis.createClient();

// All processes connect to same Redis
await client.set('shared:data', value);
const data = await client.get('shared:data');
```

---

## Protocol Design

### Message Structure

Design efficient message protocols:

```javascript
// Simple JSON protocol
const message = {
  id: generateId(),
  type: 'request',
  method: 'compute',
  data: { value: 42 },
  timestamp: Date.now()
};

childProcess.send(message);
```

### Binary Protocol

More efficient for high-throughput:

```javascript
// Define protocol
// [4 bytes: message length]
// [1 byte: message type]
// [N bytes: payload]

function encodeMessage(type, payload) {
  const payloadBuffer = Buffer.from(JSON.stringify(payload));
  const length = 1 + payloadBuffer.length;

  const buffer = Buffer.allocUnsafe(4 + length);
  buffer.writeUInt32BE(length, 0);
  buffer.writeUInt8(type, 4);
  payloadBuffer.copy(buffer, 5);

  return buffer;
}

function decodeMessage(buffer) {
  const length = buffer.readUInt32BE(0);
  const type = buffer.readUInt8(4);
  const payload = JSON.parse(buffer.slice(5, 4 + length));

  return { type, payload };
}
```

### Message Types

Define clear message types:

```javascript
const MessageType = {
  // Requests
  TASK: 1,
  HEALTH_CHECK: 2,
  SHUTDOWN: 3,

  // Responses
  TASK_RESULT: 10,
  TASK_ERROR: 11,
  HEALTH_RESPONSE: 12,

  // Events
  WORKER_READY: 20,
  WORKER_BUSY: 21,
  METRIC_UPDATE: 22
};
```

---

## Message Patterns

### 1. Request-Response Pattern

```javascript
class RPCChannel {
  constructor(process) {
    this.process = process;
    this.pendingRequests = new Map();
    this.requestId = 0;

    this.process.on('message', (msg) => {
      if (msg.type === 'response') {
        const pending = this.pendingRequests.get(msg.id);
        if (pending) {
          if (msg.error) {
            pending.reject(new Error(msg.error));
          } else {
            pending.resolve(msg.result);
          }
          this.pendingRequests.delete(msg.id);
        }
      }
    });
  }

  async request(method, data, timeout = 5000) {
    const id = ++this.requestId;

    return new Promise((resolve, reject) => {
      // Store pending request
      this.pendingRequests.set(id, { resolve, reject });

      // Send request
      this.process.send({
        type: 'request',
        id,
        method,
        data
      });

      // Timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, timeout);
    });
  }
}

// Usage
const rpc = new RPCChannel(worker);
const result = await rpc.request('compute', { value: 42 });
```

### 2. Publish-Subscribe Pattern

```javascript
class PubSubBroker {
  constructor() {
    this.subscribers = new Map(); // topic -> Set of workers
    this.workers = new Set();
  }

  addWorker(worker) {
    this.workers.add(worker);

    worker.on('message', (msg) => {
      if (msg.type === 'subscribe') {
        this.subscribe(worker, msg.topic);
      } else if (msg.type === 'unsubscribe') {
        this.unsubscribe(worker, msg.topic);
      }
    });
  }

  subscribe(worker, topic) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic).add(worker);
  }

  unsubscribe(worker, topic) {
    if (this.subscribers.has(topic)) {
      this.subscribers.get(topic).delete(worker);
    }
  }

  publish(topic, data) {
    const subscribers = this.subscribers.get(topic);
    if (subscribers) {
      subscribers.forEach(worker => {
        worker.send({
          type: 'message',
          topic,
          data
        });
      });
    }
  }
}
```

### 3. Streaming Pattern

```javascript
class StreamChannel {
  constructor(worker) {
    this.worker = worker;
    this.streams = new Map();
  }

  createStream(streamId) {
    const stream = new EventEmitter();
    this.streams.set(streamId, stream);

    return stream;
  }

  handleMessage(msg) {
    if (msg.type === 'stream_data') {
      const stream = this.streams.get(msg.streamId);
      if (stream) {
        stream.emit('data', msg.data);
      }
    } else if (msg.type === 'stream_end') {
      const stream = this.streams.get(msg.streamId);
      if (stream) {
        stream.emit('end');
        this.streams.delete(msg.streamId);
      }
    }
  }

  sendStream(streamId, data) {
    this.worker.send({
      type: 'stream_data',
      streamId,
      data
    });
  }

  endStream(streamId) {
    this.worker.send({
      type: 'stream_end',
      streamId
    });
  }
}
```

---

## Performance Optimization

### 1. Message Batching

Reduce IPC overhead by batching:

```javascript
class MessageBatcher {
  constructor(worker, options = {}) {
    this.worker = worker;
    this.batchSize = options.batchSize || 100;
    this.flushInterval = options.flushInterval || 10;
    this.buffer = [];
    this.timer = null;
  }

  send(message) {
    this.buffer.push(message);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  flush() {
    if (this.buffer.length === 0) return;

    this.worker.send({
      type: 'batch',
      messages: this.buffer
    });

    this.buffer = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
```

### 2. Serialization Optimization

Choose efficient serialization:

```javascript
// JSON - Good for simple objects
const data = { id: 1, value: 'test' };
worker.send(JSON.parse(JSON.stringify(data)));

// msgpack - More efficient binary format
const msgpack = require('msgpack');
const packed = msgpack.pack(data);
worker.send({ type: 'binary', data: packed });

// Protocol Buffers - Schema-based, very efficient
const protobuf = require('protobufjs');
const Message = protobuf.loadSync('message.proto').lookupType('Message');
const buffer = Message.encode(data).finish();
worker.send({ type: 'protobuf', data: buffer });
```

### 3. Connection Pooling

Reuse connections:

```javascript
class ConnectionPool {
  constructor(size, createFn) {
    this.pool = [];
    this.available = [];

    for (let i = 0; i < size; i++) {
      const conn = createFn(i);
      this.pool.push(conn);
      this.available.push(conn);
    }
  }

  acquire() {
    if (this.available.length === 0) {
      return null;
    }
    return this.available.pop();
  }

  release(conn) {
    if (!this.available.includes(conn)) {
      this.available.push(conn);
    }
  }

  async execute(fn) {
    const conn = this.acquire();
    if (!conn) {
      throw new Error('No connections available');
    }

    try {
      return await fn(conn);
    } finally {
      this.release(conn);
    }
  }
}
```

---

## Best Practices

### Do's ✅

1. **Use handle passing for servers** - Better than proxying
2. **Design clear protocols** - Define message structure
3. **Implement timeouts** - For all request-response
4. **Batch when possible** - Reduce IPC overhead
5. **Use binary for large data** - Buffers over JSON
6. **Version your protocols** - Allow evolution
7. **Handle backpressure** - Don't overwhelm workers

### Don'ts ❌

1. **Don't send functions** - Can't serialize
2. **Don't ignore errors** - Handle send failures
3. **Don't send huge objects** - Split or stream
4. **Don't forget cleanup** - Remove listeners
5. **Don't block on IPC** - Use async patterns
6. **Don't ignore versions** - Protocol compatibility

### Message Size Limits

```javascript
// Check message size
function checkMessageSize(msg) {
  const size = Buffer.byteLength(JSON.stringify(msg));
  const maxSize = 128 * 1024 * 1024; // 128MB

  if (size > maxSize) {
    throw new Error(`Message too large: ${size} bytes`);
  }
}

// Split large messages
function* splitMessage(data, chunkSize = 1024 * 1024) {
  for (let i = 0; i < data.length; i += chunkSize) {
    yield data.slice(i, i + chunkSize);
  }
}
```

---

## Summary

Advanced IPC enables:

1. **Handle Passing** - Share servers across processes
2. **Efficient Protocols** - Binary, batching, compression
3. **Rich Patterns** - Request-response, pub-sub, streaming
4. **High Performance** - Zero-copy, pooling, optimization

Master these patterns for building high-performance distributed systems.

---

**Next**: Read [Process Monitoring](03-process-monitoring.md) to learn about metrics collection and health checks.
