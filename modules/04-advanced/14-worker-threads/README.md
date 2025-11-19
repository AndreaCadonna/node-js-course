# Module 14: Worker Threads

Master parallel processing and multi-threading in Node.js using Worker Threads.

## Why This Module Matters

Worker Threads provide true parallelism in Node.js by running JavaScript code in separate threads. Unlike the event loop which handles I/O concurrency, worker threads enable CPU-intensive tasks to run in parallel without blocking the main thread. Understanding worker threads is essential for building high-performance Node.js applications that can fully utilize multi-core processors.

**Real-world applications:**
- CPU-intensive computations (data processing, image manipulation)
- Parallel data processing and transformations
- Video/audio encoding and transcoding
- Heavy cryptographic operations
- Machine learning inference
- Large dataset analysis
- Concurrent file processing
- Scientific computing
- Real-time data aggregation
- Background job processing

---

## What You'll Learn

By completing this module, you'll master:

### Technical Skills
- Creating and managing worker threads
- Communication between main thread and workers
- Transferring data efficiently (structured clone, transferable objects)
- Managing thread pools
- Handling worker lifecycle
- Error handling in worker threads
- Resource management and cleanup
- Performance optimization
- Thread synchronization with SharedArrayBuffer

### Practical Applications
- Build CPU-intensive applications without blocking
- Implement parallel data processing pipelines
- Create efficient worker pools
- Optimize performance for multi-core systems
- Handle background tasks effectively
- Prevent UI freezing in applications
- Scale computational workloads
- Debug multi-threaded applications

---

## Module Structure

This module is divided into three progressive levels:

### [Level 1: Basics](./level-1-basics/README.md)
**Time**: 2-3 hours

Learn the fundamentals of worker threads:
- Understanding worker threads vs other concurrency models
- Creating and terminating workers
- Basic communication with `postMessage()` and `on('message')`
- Understanding `workerData` for initialization
- Worker lifecycle and events
- Basic error handling
- Simple parallel computations
- Worker thread limitations

**You'll be able to:**
- Create basic worker threads
- Send and receive messages
- Pass initial data to workers
- Handle worker errors
- Understand when to use workers
- Run CPU-intensive tasks in parallel
- Manage worker lifecycle
- Build simple multi-threaded programs

### [Level 2: Intermediate](./level-2-intermediate/README.md)
**Time**: 3-4 hours

Advanced worker thread patterns and optimization:
- Worker pools and thread reuse
- Efficient data transfer strategies
- Transferable objects (ArrayBuffer, MessagePort)
- MessageChannel for advanced communication
- Resource limits and monitoring
- Worker thread debugging
- Performance profiling
- Real-world patterns and architectures
- Task queuing and distribution

**You'll be able to:**
- Implement efficient worker pools
- Optimize data transfer performance
- Use transferable objects
- Create complex communication patterns
- Monitor worker resource usage
- Debug worker thread issues
- Profile multi-threaded performance
- Build production-ready worker systems

### [Level 3: Advanced](./level-3-advanced/README.md)
**Time**: 4-6 hours

Production-grade worker thread architectures:
- SharedArrayBuffer and Atomics
- Thread synchronization patterns
- Advanced worker pool architectures
- Dynamic worker scaling
- Backpressure and flow control
- Memory management optimization
- Worker thread security considerations
- Integration with streams and async iterators
- Performance tuning and benchmarking
- Production deployment strategies

**You'll be able to:**
- Build sophisticated multi-threaded systems
- Implement thread synchronization
- Create auto-scaling worker pools
- Optimize memory usage
- Handle complex coordination patterns
- Secure worker thread implementations
- Integrate workers with other Node.js features
- Deploy production worker thread systems

---

## Prerequisites

- **Module 4: Events** (required - workers use EventEmitter)
- **Module 5: Stream** (recommended - for advanced patterns)
- **Module 6: Process** (recommended - understanding resource usage)
- Good understanding of JavaScript
- Knowledge of asynchronous programming (Promises, async/await)
- Basic understanding of concurrency concepts
- Node.js v12+ installed (v14+ recommended)

---

## Learning Path

### Recommended Approach

1. **Understand** the difference between event loop concurrency and true parallelism
2. **Start** with Level 1 and progress sequentially
3. **Experiment** with the examples - run them and observe CPU usage
4. **Complete** exercises before checking solutions
5. **Benchmark** your solutions to understand performance implications
6. **Build** real projects using worker threads

### Alternative Approaches

**Fast Track** (If you're experienced with multi-threading):
- Skim Level 1 concepts
- Focus on Node.js-specific APIs in Level 2
- Deep dive into Level 3 advanced patterns

**Deep Dive** (If you want complete mastery):
- Read all guides thoroughly
- Complete all exercises
- Build additional projects
- Study performance characteristics
- Experiment with different architectures

---

## Key Concepts

### What are Worker Threads?

Worker threads enable true parallel execution of JavaScript code:

```javascript
const { Worker } = require('worker_threads');

// Create a worker that runs worker.js
const worker = new Worker('./worker.js');

// Send data to worker
worker.postMessage({ task: 'process', data: [1, 2, 3] });

// Receive results from worker
worker.on('message', (result) => {
  console.log('Result from worker:', result);
});
```

### Basic Communication

Workers communicate via message passing:

```javascript
// main.js
const { Worker } = require('worker_threads');
const worker = new Worker('./worker.js');

worker.postMessage('Hello from main thread');

worker.on('message', (msg) => {
  console.log('Worker says:', msg);
});

// worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', (msg) => {
  console.log('Main thread says:', msg);
  parentPort.postMessage('Hello from worker');
});
```

### Worker Data Initialization

Pass initial data when creating a worker:

```javascript
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js', {
  workerData: {
    config: { threads: 4 },
    input: 'initial data'
  }
});

// worker.js
const { workerData } = require('worker_threads');
console.log('Worker received:', workerData);
```

---

## Practical Examples

### Example 1: CPU-Intensive Calculation

```javascript
// main.js - Offload heavy computation to worker
const { Worker } = require('worker_threads');

function calculateInWorker(numbers) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./cpu-worker.js', {
      workerData: numbers
    });

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

// Main thread stays responsive while worker computes
console.log('Starting calculation...');
calculateInWorker([1, 2, 3, 4, 5])
  .then(result => console.log('Result:', result));
console.log('Main thread continues executing...');

// cpu-worker.js
const { workerData, parentPort } = require('worker_threads');

// Simulate CPU-intensive work
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const results = workerData.map(n => fibonacci(n));
parentPort.postMessage(results);
```

### Example 2: Worker Pool

```javascript
const { Worker } = require('worker_threads');

class WorkerPool {
  constructor(workerScript, poolSize = 4) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];
    this.queue = [];

    // Create worker pool
    for (let i = 0; i < poolSize; i++) {
      this.workers.push({
        worker: new Worker(workerScript),
        busy: false
      });
    }
  }

  async execute(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };

      // Try to find available worker
      const availableWorker = this.workers.find(w => !w.busy);

      if (availableWorker) {
        this.runTask(availableWorker, task);
      } else {
        // Queue task if all workers busy
        this.queue.push(task);
      }
    });
  }

  runTask(workerObj, task) {
    workerObj.busy = true;

    const messageHandler = (result) => {
      task.resolve(result);
      cleanup();
    };

    const errorHandler = (error) => {
      task.reject(error);
      cleanup();
    };

    const cleanup = () => {
      workerObj.worker.off('message', messageHandler);
      workerObj.worker.off('error', errorHandler);
      workerObj.busy = false;

      // Process next queued task
      if (this.queue.length > 0) {
        this.runTask(workerObj, this.queue.shift());
      }
    };

    workerObj.worker.on('message', messageHandler);
    workerObj.worker.on('error', errorHandler);
    workerObj.worker.postMessage(task.data);
  }

  async terminate() {
    await Promise.all(
      this.workers.map(w => w.worker.terminate())
    );
  }
}

// Usage
const pool = new WorkerPool('./task-worker.js', 4);

// Execute tasks in parallel using pool
Promise.all([
  pool.execute({ task: 1 }),
  pool.execute({ task: 2 }),
  pool.execute({ task: 3 }),
  pool.execute({ task: 4 }),
  pool.execute({ task: 5 })
]).then(results => {
  console.log('All tasks completed:', results);
  return pool.terminate();
});
```

### Example 3: Transferable Objects

```javascript
// Efficient transfer of large data without copying
const { Worker } = require('worker_threads');

// Create large buffer
const buffer = new ArrayBuffer(1024 * 1024 * 100); // 100MB
const view = new Uint8Array(buffer);
view.fill(42);

console.log('Buffer size:', buffer.byteLength);

const worker = new Worker('./process-buffer.js');

// Transfer ownership of buffer to worker (zero-copy)
worker.postMessage({ buffer }, [buffer]);

// buffer is now unusable in main thread
console.log('Buffer transferred, byteLength:', buffer.byteLength); // 0

worker.on('message', (result) => {
  console.log('Worker processed buffer:', result);
  worker.terminate();
});

// process-buffer.js
const { parentPort } = require('worker_threads');

parentPort.on('message', ({ buffer }) => {
  const view = new Uint8Array(buffer);

  // Process the buffer
  const sum = view.reduce((acc, val) => acc + val, 0);

  parentPort.postMessage({ sum, size: buffer.byteLength });
});
```

---

## Common Pitfalls

### ❌ Using Workers for I/O Operations

```javascript
// Wrong - workers for I/O is inefficient
const worker = new Worker('./read-file-worker.js');

// Correct - use async I/O on main thread
const fs = require('fs').promises;
await fs.readFile('file.txt');
```

### ❌ Creating Too Many Workers

```javascript
// Wrong - creating worker for each task
data.forEach(item => {
  const worker = new Worker('./worker.js');
  worker.postMessage(item);
});

// Correct - use a worker pool
const pool = new WorkerPool('./worker.js', 4);
await Promise.all(data.map(item => pool.execute(item)));
```

### ❌ Not Handling Worker Errors

```javascript
// Wrong - no error handling
const worker = new Worker('./worker.js');
worker.postMessage(data);

// Correct - handle all worker events
worker.on('error', (err) => console.error('Worker error:', err));
worker.on('exit', (code) => {
  if (code !== 0) {
    console.error('Worker exited with code:', code);
  }
});
```

### ❌ Forgetting to Terminate Workers

```javascript
// Wrong - workers keep running
const worker = new Worker('./worker.js');
worker.postMessage(data);

// Correct - terminate when done
worker.on('message', (result) => {
  console.log(result);
  worker.terminate();
});
```

---

## Module Contents

### Documentation
- **Level READMEs** - Specific guidance for each level
- **Comprehensive guides** - Deep dives into worker thread concepts

### Code Examples
- **18+ examples** - Practical demonstrations across all levels
- **Fully commented** - Learn from reading the code
- **Runnable** - Execute them to see workers in action

### Exercises
- **15 exercises** - Hands-on practice problems
- **Progressive difficulty** - Build skills gradually
- **Complete solutions** - Check your work

### Conceptual Guides
- **In-depth guides** - Deep understanding of worker threads
- **Level 1**: Fundamentals and basic usage
- **Level 2**: Patterns and optimization
- **Level 3**: Advanced architectures and production use

---

## Getting Started

### Quick Start

1. **Check Node.js version**:
   ```bash
   node --version  # Should be v12 or higher
   ```

2. **Start Level 1**:
   ```bash
   cd level-1-basics
   cat README.md
   ```

3. **Run your first example**:
   ```bash
   node examples/01-basic-worker.js
   ```

4. **Monitor CPU usage**:
   - Open system monitor while running examples
   - Observe multiple cores being utilized

---

## Success Criteria

You'll know you've mastered this module when you can:

- [ ] Create and manage worker threads
- [ ] Implement efficient worker-main communication
- [ ] Build and use worker pools
- [ ] Transfer data efficiently using transferable objects
- [ ] Handle worker errors and lifecycle events
- [ ] Profile and optimize worker thread performance
- [ ] Understand when to use (and not use) workers
- [ ] Build production-ready multi-threaded applications
- [ ] Debug worker thread issues
- [ ] Implement thread synchronization patterns

---

## Performance Considerations

### When to Use Worker Threads

✅ **Good use cases:**
- CPU-intensive calculations (fibonacci, prime numbers, etc.)
- Image/video processing
- Data compression/decompression
- Cryptographic operations
- Large dataset transformations
- Scientific computing

❌ **Poor use cases:**
- File I/O operations
- Network requests
- Database queries
- Simple data transformations
- Short-lived tasks with setup overhead

### Benchmarking

Always benchmark to verify workers improve performance:

```javascript
const { performance } = require('perf_hooks');

// Measure single-threaded performance
const start1 = performance.now();
const result1 = cpuIntensiveTask(data);
const time1 = performance.now() - start1;

// Measure multi-threaded performance
const start2 = performance.now();
const result2 = await workerPoolTask(data);
const time2 = performance.now() - start2;

console.log(`Single-threaded: ${time1}ms`);
console.log(`Multi-threaded: ${time2}ms`);
console.log(`Speedup: ${(time1/time2).toFixed(2)}x`);
```

---

## Additional Resources

### Official Documentation
- [Node.js Worker Threads Documentation](https://nodejs.org/api/worker_threads.html)
- [Web Workers Specification](https://html.spec.whatwg.org/multipage/workers.html)

### Practice Projects
After completing this module, try building:
1. **Image Processor** - Parallel image transformations
2. **Data Pipeline** - Multi-stage parallel processing
3. **Background Job System** - Task queue with worker pool
4. **Ray Tracer** - Parallel rendering engine
5. **Hash Cracker** - Parallel password testing (educational)

### Related Modules
- **Module 4: Events** - Workers use EventEmitter
- **Module 6: Process** - Understanding resources
- **Module 13: Cluster** - Alternative parallelism model
- **Module 12: Child Process** - Different isolation model

---

## Questions or Issues?

- Review the examples for practical demonstrations
- Study the guides for deep understanding
- Complete exercises before checking solutions
- Experiment with different worker configurations
- Benchmark to understand performance characteristics

---

## Let's Begin!

Start your journey with [Level 1: Basics](./level-1-basics/README.md) and discover the power of true parallelism in Node.js.

Remember: Worker threads are powerful but not always the answer. Master when and how to use them, and you'll build faster, more responsive Node.js applications!
