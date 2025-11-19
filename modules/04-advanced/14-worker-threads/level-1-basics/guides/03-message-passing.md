# Message Passing Basics

## How Worker Communication Works

Worker threads communicate with the main thread through **message passing**. This is the primary way to send data and results between threads.

## The Message Passing API

### From Main Thread to Worker

```javascript
// main.js
const { Worker } = require('worker_threads');
const worker = new Worker('./worker.js');

// Send a message to the worker
worker.postMessage('Hello worker!');
worker.postMessage({ task: 'compute', value: 42 });
worker.postMessage([1, 2, 3, 4, 5]);
```

### From Worker to Main Thread

```javascript
// worker.js
const { parentPort } = require('worker_threads');

// Send a message to the main thread
parentPort.postMessage('Hello main thread!');
parentPort.postMessage({ result: 42 });
parentPort.postMessage([5, 4, 3, 2, 1]);
```

## Complete Two-Way Communication

### Example: Echo Server

**main.js:**
```javascript
const { Worker } = require('worker_threads');

const worker = new Worker('./echo-worker.js');

// Listen for messages from worker
worker.on('message', (message) => {
  console.log('Received from worker:', message);
});

// Send messages to worker
worker.postMessage('Hello');
worker.postMessage('World');
worker.postMessage({ data: 'Object' });
```

**echo-worker.js:**
```javascript
const { parentPort } = require('worker_threads');

// Listen for messages from main thread
parentPort.on('message', (message) => {
  console.log('Worker received:', message);

  // Echo it back
  parentPort.postMessage(`Echo: ${JSON.stringify(message)}`);
});
```

## Data Serialization (Structured Clone)

### What Can Be Sent?

Messages are serialized using the **structured clone algorithm**:

```javascript
// ✅ These work
worker.postMessage('string');
worker.postMessage(42);
worker.postMessage(true);
worker.postMessage(null);
worker.postMessage([1, 2, 3]);
worker.postMessage({ a: 1, b: 2 });
worker.postMessage(new Date());
worker.postMessage(/regex/);
worker.postMessage(new Map([['key', 'value']]));
worker.postMessage(new Set([1, 2, 3]));
worker.postMessage(new ArrayBuffer(8));
worker.postMessage(new Uint8Array([1, 2, 3]));
```

### What Cannot Be Sent?

```javascript
// ❌ These don't work
worker.postMessage(function() {}); // Functions
worker.postMessage(Symbol('symbol')); // Symbols
worker.postMessage(worker); // Worker instances
worker.postMessage(process); // Process objects

// ❌ Objects with methods lose their methods
class MyClass {
  constructor(value) {
    this.value = value;
  }
  getValue() {
    return this.value;
  }
}

const obj = new MyClass(42);
worker.postMessage(obj);
// Worker receives: { value: 42 } (no getValue method!)
```

## Message Patterns

### Pattern 1: Simple Task Execution

```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker('./calculator.js');

worker.postMessage({ operation: 'add', a: 5, b: 3 });

worker.on('message', (result) => {
  console.log('Result:', result); // 8
  worker.terminate();
});
```

```javascript
// calculator.js
const { parentPort } = require('worker_threads');

parentPort.on('message', ({ operation, a, b }) => {
  let result;

  switch (operation) {
    case 'add':
      result = a + b;
      break;
    case 'subtract':
      result = a - b;
      break;
    case 'multiply':
      result = a * b;
      break;
    case 'divide':
      result = a / b;
      break;
  }

  parentPort.postMessage(result);
});
```

### Pattern 2: Stream of Messages

```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker('./processor.js');

// Send multiple tasks
for (let i = 0; i < 10; i++) {
  worker.postMessage({ id: i, value: i * 2 });
}

// Receive results as they complete
worker.on('message', (result) => {
  console.log('Completed:', result);
});
```

```javascript
// processor.js
const { parentPort } = require('worker_threads');

parentPort.on('message', ({ id, value }) => {
  // Simulate processing
  const result = value * value;

  // Send result back
  parentPort.postMessage({ id, result });
});
```

### Pattern 3: Request-Response with IDs

```javascript
// main.js
const { Worker } = require('worker_threads');

class WorkerClient {
  constructor(workerFile) {
    this.worker = new Worker(workerFile);
    this.nextId = 0;
    this.pending = new Map();

    this.worker.on('message', ({ id, result, error }) => {
      const { resolve, reject } = this.pending.get(id);
      this.pending.delete(id);

      if (error) {
        reject(new Error(error));
      } else {
        resolve(result);
      }
    });
  }

  async request(data) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, data });
    });
  }
}

// Usage
const client = new WorkerClient('./worker.js');
const result1 = await client.request({ task: 'fibonacci', n: 10 });
const result2 = await client.request({ task: 'factorial', n: 5 });
```

### Pattern 4: Progress Updates

```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker('./long-task.js');

worker.postMessage({ task: 'process', items: 100 });

worker.on('message', (message) => {
  if (message.type === 'progress') {
    console.log(`Progress: ${message.percent}%`);
  } else if (message.type === 'complete') {
    console.log('Task completed:', message.result);
    worker.terminate();
  }
});
```

```javascript
// long-task.js
const { parentPort } = require('worker_threads');

parentPort.on('message', ({ task, items }) => {
  for (let i = 0; i < items; i++) {
    // Do work
    processItem(i);

    // Send progress update
    if (i % 10 === 0) {
      parentPort.postMessage({
        type: 'progress',
        percent: Math.round((i / items) * 100)
      });
    }
  }

  // Send completion
  parentPort.postMessage({
    type: 'complete',
    result: `Processed ${items} items`
  });
});

function processItem(i) {
  // Simulate work
  let sum = 0;
  for (let j = 0; j < 1000000; j++) {
    sum += j;
  }
}
```

## Data is Cloned, Not Shared

### Understanding the Clone

```javascript
// main.js
const data = { count: 0, items: [1, 2, 3] };

worker.postMessage(data);

// Modify data in main thread
data.count = 100;
data.items.push(4);

console.log('Main thread data:', data);
// { count: 100, items: [1, 2, 3, 4] }
```

```javascript
// worker.js
parentPort.on('message', (data) => {
  console.log('Worker received:', data);
  // { count: 0, items: [1, 2, 3] }

  // Worker has its own copy
  data.count = 50;
  data.items.push(5);

  console.log('Worker data:', data);
  // { count: 50, items: [1, 2, 3, 5] }
});
```

### Performance Implications

```javascript
// Cloning large objects has a cost
const largeArray = new Array(1000000).fill(42);

const start = Date.now();
worker.postMessage(largeArray);
const end = Date.now();

console.log(`Cloning took ${end - start}ms`);
// Could be 10-100ms for large data
```

**Optimization:** Use transferable objects for large data (Level 2 topic).

## Message Event Handling

### Single Message Handler

```javascript
// worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', (message) => {
  console.log('Received:', message);
});
```

### Multiple Message Handlers

```javascript
// worker.js
const { parentPort } = require('worker_threads');

// All handlers receive the same message
parentPort.on('message', (message) => {
  console.log('Handler 1:', message);
});

parentPort.on('message', (message) => {
  console.log('Handler 2:', message);
});

// Both handlers execute for each message
```

### Once Listener

```javascript
// worker.js
const { parentPort } = require('worker_threads');

// Listen for only the first message
parentPort.once('message', (message) => {
  console.log('First message:', message);
  // This handler won't run for subsequent messages
});
```

## Error Handling in Messages

### Sending Errors Back

```javascript
// worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', (data) => {
  try {
    const result = riskyOperation(data);
    parentPort.postMessage({ success: true, result });
  } catch (error) {
    parentPort.postMessage({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});
```

### Receiving Errors

```javascript
// main.js
worker.on('message', (response) => {
  if (response.success) {
    console.log('Success:', response.result);
  } else {
    console.error('Error:', response.error);
    console.error('Stack:', response.stack);
  }
});
```

## Common Pitfalls

### ❌ Forgetting to Listen for Messages

```javascript
// ❌ WRONG - No listener
const worker = new Worker('./worker.js');
worker.postMessage('data');
// Worker sends response, but no one is listening!

// ✅ CORRECT
worker.on('message', (result) => {
  console.log('Got result:', result);
});
```

### ❌ Sending Functions

```javascript
// ❌ WRONG - Functions can't be cloned
worker.postMessage({
  data: 'value',
  callback: () => console.log('done') // Won't work!
});

// ✅ CORRECT - Send data only
worker.postMessage({ data: 'value' });
```

### ❌ Expecting Shared State

```javascript
// ❌ WRONG - Expecting shared object
const config = { mode: 'fast' };
worker.postMessage(config);
config.mode = 'slow';
// Worker still sees 'fast' because it has a copy

// ✅ CORRECT - Send updates explicitly
worker.postMessage({ mode: 'slow' });
```

## Best Practices

### 1. Use Clear Message Formats

```javascript
// Good: Structured messages with type
worker.postMessage({
  type: 'PROCESS_DATA',
  payload: { data: [1, 2, 3] },
  requestId: 123
});
```

### 2. Handle All Message Types

```javascript
parentPort.on('message', (message) => {
  switch (message.type) {
    case 'TASK_1':
      handleTask1(message.payload);
      break;
    case 'TASK_2':
      handleTask2(message.payload);
      break;
    default:
      console.warn('Unknown message type:', message.type);
  }
});
```

### 3. Validate Messages

```javascript
parentPort.on('message', (message) => {
  if (!message || typeof message !== 'object') {
    parentPort.postMessage({ error: 'Invalid message format' });
    return;
  }

  if (!message.type || !message.payload) {
    parentPort.postMessage({ error: 'Missing required fields' });
    return;
  }

  // Process valid message
  processMessage(message);
});
```

## Key Takeaways

1. **postMessage() sends data** from main thread or worker
2. **on('message') receives data** in worker or main thread
3. **Data is cloned**, not shared (by default)
4. **Structured clone algorithm** determines what can be sent
5. **Functions cannot be sent** between threads
6. **Use message patterns** for organized communication
7. **Always validate messages** for robustness

## Next Steps

Learn about [passing initial data with workerData](./04-worker-data.md) for worker configuration.
