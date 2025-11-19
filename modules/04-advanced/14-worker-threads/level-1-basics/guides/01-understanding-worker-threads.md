# Understanding Worker Threads

## What are Worker Threads?

Worker Threads are a Node.js feature that enables **true parallel execution** of JavaScript code by running it on separate threads. This is fundamentally different from Node.js's traditional concurrency model.

## The Node.js Concurrency Model

### Event Loop (Traditional Node.js)

Node.js traditionally handles concurrency through the **event loop**:

```javascript
// All of this runs on a SINGLE thread
const fs = require('fs').promises;

async function processFiles() {
  const file1 = await fs.readFile('file1.txt'); // I/O operation
  const file2 = await fs.readFile('file2.txt'); // I/O operation
  const file3 = await fs.readFile('file3.txt'); // I/O operation
}
```

**How it works:**
- Single JavaScript thread
- I/O operations delegated to the OS
- Callbacks execute when I/O completes
- Great for I/O-bound applications
- **NOT** true parallelism

### Worker Threads (True Parallelism)

Worker threads provide **actual parallel execution**:

```javascript
const { Worker } = require('worker_threads');

// Create 4 workers running in parallel on different CPU cores
const workers = [];
for (let i = 0; i < 4; i++) {
  workers.push(new Worker('./cpu-intensive.js'));
}
```

**How it works:**
- Multiple JavaScript threads
- Each thread has its own V8 instance (isolate)
- Truly parallel execution on multiple CPU cores
- Great for CPU-bound applications
- **IS** true parallelism

## When to Use Worker Threads

### ✅ Good Use Cases (CPU-Intensive)

1. **Mathematical Computations**
   ```javascript
   // Calculating fibonacci, prime numbers, etc.
   // Worker can compute while main thread stays responsive
   ```

2. **Data Processing**
   ```javascript
   // Processing large datasets
   // Transforming, filtering, aggregating data
   ```

3. **Image/Video Processing**
   ```javascript
   // Resizing, filtering, encoding
   // Parallel processing of frames or chunks
   ```

4. **Cryptographic Operations**
   ```javascript
   // Hashing, encryption, key generation
   // CPU-intensive security operations
   ```

5. **Compression/Decompression**
   ```javascript
   // ZIP, GZIP, image compression
   // Parallel compression of multiple files
   ```

### ❌ Poor Use Cases (I/O-Intensive)

1. **File I/O**
   ```javascript
   // ❌ Don't use workers for file reading
   // Event loop already handles this efficiently
   ```

2. **Network Requests**
   ```javascript
   // ❌ Don't use workers for HTTP requests
   // Async I/O is already non-blocking
   ```

3. **Database Queries**
   ```javascript
   // ❌ Don't use workers for DB operations
   // Connection pools handle concurrency
   ```

## Worker Threads vs Other Models

### Worker Threads vs Event Loop

| Aspect | Event Loop | Worker Threads |
|--------|-----------|----------------|
| Execution | Single thread | Multiple threads |
| Parallelism | Concurrent (not parallel) | True parallel |
| Best for | I/O operations | CPU operations |
| Memory | Shared memory space | Isolated memory |
| Communication | Direct function calls | Message passing |
| Overhead | Very low | Higher (thread creation) |

### Worker Threads vs Child Processes

| Aspect | Worker Threads | Child Processes |
|--------|----------------|-----------------|
| Isolation | Same process | Separate process |
| Memory | Can share memory | Cannot share memory |
| Startup time | Fast | Slower |
| Communication | Fast (same process) | Slower (IPC) |
| Resource usage | Lower | Higher |
| Crash impact | May affect main process | Isolated |

### Worker Threads vs Cluster

| Aspect | Worker Threads | Cluster |
|--------|----------------|---------|
| Purpose | CPU parallelism | Load balancing |
| Threads vs Processes | Threads | Processes |
| Use case | Computations | Network servers |
| Shared resources | Can share memory | Cannot share memory |
| Overhead | Lower | Higher |

## The V8 Isolate Concept

Each worker thread runs in its own **V8 isolate**:

```javascript
// main.js
let count = 0;

const { Worker } = require('worker_threads');
const worker = new Worker('./worker.js');

count = 10;

// worker.js
console.log(count); // ❌ Error: count is not defined
// Worker has its own separate JavaScript environment
```

**Key points:**
- Workers don't share variables with main thread
- Each worker has its own global scope
- Communication happens via message passing
- This isolation provides safety and prevents race conditions

## Performance Considerations

### Overhead of Creating Workers

```javascript
const { Worker } = require('worker_threads');
const { performance } = require('perf_hooks');

// Creating a worker has overhead
const start = performance.now();
const worker = new Worker('./worker.js');
const end = performance.now();

console.log(`Worker creation took: ${end - start}ms`);
// Usually 10-50ms depending on system
```

### When Workers Help Performance

```javascript
// Task takes 1000ms on one core
// With 4 workers on 4 cores: ~250ms
// Speedup: 4x (ideal)

// In reality: 3-3.5x due to overhead
```

### When Workers Hurt Performance

```javascript
// Task takes 10ms
// Worker creation: 20ms
// Communication: 5ms
// Total: 35ms (slower than single-threaded 10ms!)
```

**Rule of thumb:** Workers should process tasks that take longer than the creation/communication overhead.

## Memory Model

### Separate Memory by Default

```javascript
// main.js
const data = { value: 42 };
worker.postMessage(data);

data.value = 100; // Change in main thread

// Worker receives: { value: 42 }
// Data is CLONED, not shared
```

### Optional Shared Memory

```javascript
// Advanced: SharedArrayBuffer for shared memory
const buffer = new SharedArrayBuffer(1024);
worker.postMessage(buffer);

// Both threads can access same memory
// Requires careful synchronization (Level 3 topic)
```

## Real-World Example

```javascript
// Without workers: UI freezes during computation
function heavyComputation(data) {
  // 5 seconds of CPU work
  return processComplexAlgorithm(data);
}

const result = heavyComputation(largeDataset);
// UI frozen for 5 seconds ❌

// With workers: UI stays responsive
const { Worker } = require('worker_threads');

function heavyComputation(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./compute.js');
    worker.postMessage(data);
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

const result = await heavyComputation(largeDataset);
// UI responsive throughout ✅
```

## Key Takeaways

1. **Worker threads enable true parallelism** - Multiple cores working simultaneously
2. **Use for CPU-intensive tasks** - Not for I/O operations
3. **Each worker is isolated** - Own memory, own V8 instance
4. **Communication via messages** - No shared variables
5. **Has overhead** - Only beneficial for substantial computations
6. **Complements event loop** - Different tools for different jobs

## Next Steps

Now that you understand what worker threads are, learn how to [create your first worker](./02-creating-workers.md).
