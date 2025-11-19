# Level 1: Worker Threads Basics

Learn the fundamentals of creating and using worker threads in Node.js.

## Learning Objectives

By completing this level, you will:

- ✅ Understand what worker threads are and why they exist
- ✅ Know the difference between worker threads and other concurrency models
- ✅ Create and terminate worker threads
- ✅ Send and receive messages between threads
- ✅ Pass initial data using workerData
- ✅ Handle worker lifecycle events
- ✅ Implement basic error handling
- ✅ Understand when to use worker threads

---

## Prerequisites

- Basic JavaScript knowledge
- Understanding of asynchronous programming (callbacks, promises)
- Node.js v12+ installed
- Basic command-line familiarity

---

## What You'll Learn

### Core Topics

1. **Worker Thread Fundamentals**
   - What are worker threads?
   - Threads vs processes vs event loop
   - The V8 isolate concept
   - When to use workers

2. **Creating Workers**
   - The Worker class
   - Worker constructor options
   - Worker file vs eval mode
   - Worker initialization

3. **Communication Basics**
   - Message passing with postMessage()
   - Listening with on('message')
   - parentPort in worker threads
   - Data serialization (structured clone)

4. **Worker Data**
   - Passing initial data with workerData
   - Accessing workerData in workers
   - Use cases for initialization data

5. **Worker Lifecycle**
   - Worker events (message, error, exit, online)
   - Terminating workers
   - Exit codes
   - Cleanup and resource management

6. **Error Handling**
   - Handling worker errors
   - Uncaught exceptions in workers
   - Error propagation
   - Graceful error handling

---

## Time Commitment

**Estimated time**: 2-3 hours
- Reading guides: 45-60 minutes
- Studying examples: 30-45 minutes
- Exercises: 45-60 minutes

---

## Conceptual Guides

Before diving into code, read these guides to build conceptual understanding:

### Essential Reading

1. **[Understanding Worker Threads](guides/01-understanding-worker-threads.md)** (12 min)
   - What worker threads are
   - Comparison with other concurrency models
   - Use cases and limitations

2. **[Creating Your First Worker](guides/02-creating-workers.md)** (10 min)
   - Worker class and constructor
   - Creating workers from files
   - Basic worker setup

3. **[Message Passing Basics](guides/03-message-passing.md)** (12 min)
   - How message passing works
   - Using postMessage and on('message')
   - Data serialization

4. **[Worker Data Initialization](guides/04-worker-data.md)** (8 min)
   - Passing initial configuration
   - Accessing workerData
   - Best practices

5. **[Worker Lifecycle Events](guides/05-worker-lifecycle.md)** (10 min)
   - Understanding worker events
   - Proper termination
   - Resource cleanup

6. **[Error Handling in Workers](guides/06-error-handling.md)** (8 min)
   - Catching worker errors
   - Error event handling
   - Recovery strategies

---

## Key Concepts

### What are Worker Threads?

Worker threads allow JavaScript code to run in parallel on separate threads:

```javascript
const { Worker } = require('worker_threads');

// Main thread creates a worker
const worker = new Worker('./my-worker.js');

// Main thread continues executing while worker runs in parallel
console.log('Main thread is not blocked!');
```

### Basic Communication Pattern

Main thread and worker communicate via messages:

```javascript
// main.js
const { Worker } = require('worker_threads');
const worker = new Worker('./worker.js');

// Send message to worker
worker.postMessage('Hello worker!');

// Receive message from worker
worker.on('message', (msg) => {
  console.log('Worker replied:', msg);
});

// worker.js
const { parentPort } = require('worker_threads');

// Receive message from main thread
parentPort.on('message', (msg) => {
  console.log('Main thread said:', msg);

  // Send reply back
  parentPort.postMessage('Hello main thread!');
});
```

### Passing Initial Data

Use workerData to pass configuration when creating a worker:

```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js', {
  workerData: { name: 'Task1', config: { timeout: 5000 } }
});

// worker.js
const { workerData } = require('worker_threads');

console.log('Worker name:', workerData.name);
console.log('Timeout:', workerData.config.timeout);
```

### Worker Lifecycle

Workers emit events throughout their lifecycle:

```javascript
const { Worker } = require('worker_threads');
const worker = new Worker('./worker.js');

// Worker is ready and running
worker.on('online', () => {
  console.log('Worker is online');
});

// Worker sent a message
worker.on('message', (msg) => {
  console.log('Message:', msg);
});

// Worker encountered an error
worker.on('error', (err) => {
  console.error('Worker error:', err);
});

// Worker exited
worker.on('exit', (code) => {
  console.log('Worker exited with code:', code);
});
```

---

## Quick Start

### Your First Worker Thread

Create two files:

**main.js:**
```javascript
const { Worker } = require('worker_threads');

console.log('Main thread starting...');

const worker = new Worker('./worker.js');

worker.on('message', (msg) => {
  console.log('Received from worker:', msg);
});

worker.postMessage('Hello from main!');
```

**worker.js:**
```javascript
const { parentPort } = require('worker_threads');

console.log('Worker thread starting...');

parentPort.on('message', (msg) => {
  console.log('Received from main:', msg);
  parentPort.postMessage('Hello from worker!');
});
```

Run it:
```bash
node main.js
```

---

## Common Pitfalls

### ❌ Pitfall 1: Using Workers for I/O

```javascript
// ❌ WRONG - Workers don't help with I/O
const worker = new Worker('./read-file-worker.js');
// File I/O is already non-blocking in Node.js

// ✅ CORRECT - Use async I/O on main thread
const fs = require('fs').promises;
const data = await fs.readFile('file.txt');
```

### ❌ Pitfall 2: Forgetting to Handle Errors

```javascript
// ❌ WRONG - No error handling
const worker = new Worker('./worker.js');
worker.postMessage(data);

// ✅ CORRECT - Handle errors
const worker = new Worker('./worker.js');
worker.on('error', (err) => {
  console.error('Worker error:', err);
});
worker.on('exit', (code) => {
  if (code !== 0) {
    console.error('Worker failed with exit code:', code);
  }
});
worker.postMessage(data);
```

### ❌ Pitfall 3: Not Terminating Workers

```javascript
// ❌ WRONG - Worker keeps running
const worker = new Worker('./worker.js');
worker.postMessage(data);
worker.on('message', (result) => {
  console.log(result);
  // Worker still running!
});

// ✅ CORRECT - Terminate when done
worker.on('message', (result) => {
  console.log(result);
  worker.terminate();
});
```

### ❌ Pitfall 4: Expecting Shared Memory (by default)

```javascript
// ❌ WRONG - Objects are cloned, not shared
const data = { count: 0 };
worker.postMessage(data);
data.count = 5;
// Worker receives { count: 0 }, not { count: 5 }

// ✅ CORRECT - Understand data is cloned
const data = { count: 0 };
worker.postMessage(data);
// Worker gets its own copy
```

---

## Exercises

After reading the guides, test your knowledge with these exercises:

### Exercise 1: Basic Worker Creation
Create a worker that performs a simple calculation.

**Skills practiced:**
- Creating workers from files
- Basic message passing
- Worker termination

### Exercise 2: Worker with Initial Data
Create a worker that uses workerData for configuration.

**Skills practiced:**
- Using workerData
- Worker initialization
- Configuration patterns

### Exercise 3: Two-Way Communication
Implement a ping-pong message exchange.

**Skills practiced:**
- Bidirectional messaging
- Message handling
- Event-driven patterns

### Exercise 4: Error Handling
Create a worker that handles errors gracefully.

**Skills practiced:**
- Error event handling
- Graceful error recovery
- Exit code management

### Exercise 5: CPU-Intensive Task
Offload a CPU-intensive calculation to a worker.

**Skills practiced:**
- Identifying CPU-intensive work
- Parallel processing
- Performance comparison
- Real-world application

---

## Learning Path

### Recommended Sequence

1. **Read Conceptual Guides** (60 minutes)
   - Start with [Understanding Worker Threads](guides/01-understanding-worker-threads.md)
   - Read all 6 guides in order
   - Take notes on key concepts

2. **Study Examples** (45 minutes)
   - Run each example
   - Read the code and comments
   - Modify examples and observe changes
   - Monitor CPU usage while running

3. **Complete Exercises** (60 minutes)
   - Work through each exercise
   - Don't look at solutions immediately
   - Try multiple approaches
   - Compare single vs multi-threaded performance

4. **Review Solutions** (20 minutes)
   - Compare with your solutions
   - Understand alternative approaches
   - Note best practices

---

## Success Criteria

You've mastered Level 1 when you can:

- [ ] Explain what worker threads are and when to use them
- [ ] Create workers from JavaScript files
- [ ] Send messages to workers using postMessage()
- [ ] Receive messages in workers using parentPort
- [ ] Pass initial data with workerData
- [ ] Handle worker lifecycle events (online, exit, error)
- [ ] Implement proper error handling
- [ ] Terminate workers correctly
- [ ] Understand the difference between workers and event loop
- [ ] Identify when workers help vs hurt performance

---

## What's Next?

After completing Level 1, you'll be ready for:

### Level 2: Intermediate Worker Threads
- Worker pools for task reuse
- Efficient data transfer with transferable objects
- MessageChannel for advanced communication
- Resource monitoring and limits
- Performance profiling
- Production patterns

---

## Additional Practice

Want more practice? Try these mini-projects:

1. **Fibonacci Calculator**
   - Create a worker that calculates fibonacci numbers
   - Compare performance with single-threaded version
   - Handle large numbers

2. **Prime Number Finder**
   - Worker that finds prime numbers in a range
   - Send results back as they're found
   - Allow cancellation

3. **Password Strength Checker**
   - CPU-intensive password validation
   - Multiple validation rules
   - Non-blocking UI simulation

4. **Data Processor**
   - Worker that processes array of data
   - Transform each element
   - Return processed results

---

## Resources

### Official Documentation
- [Node.js Worker Threads Documentation](https://nodejs.org/api/worker_threads.html)
- [Worker Thread Tutorial](https://nodejs.org/api/worker_threads.html#worker-threads)

### Tools
- **Node.js REPL**: Quick testing (`node`)
- **System Monitor**: Watch CPU usage across cores
- **--inspect flag**: Debug workers (`node --inspect`)

---

## Questions or Stuck?

- Re-read the relevant guide
- Run the example code
- Check the common pitfalls section
- Experiment with variations
- Review the solutions after attempting exercises

---

## Let's Begin!

Start with **[Understanding Worker Threads](guides/01-understanding-worker-threads.md)** and work your way through the guides. Take your time to understand each concept before moving on.

Remember: Worker threads enable true parallelism but aren't always the answer. Understanding when and how to use them is key!
