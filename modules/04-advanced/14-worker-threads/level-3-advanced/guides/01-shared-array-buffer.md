# SharedArrayBuffer - Shared Memory Between Threads

## What is SharedArrayBuffer?

`SharedArrayBuffer` creates a fixed-length raw binary data buffer that can be **shared between multiple threads**. Unlike regular messages which are cloned, SharedArrayBuffer allows true shared memory access.

## Why Shared Memory?

### Problem: Message Passing Overhead

```javascript
// Regular messaging: Data is cloned
worker.postMessage(largeArray); // Expensive copy operation

// Even with transferables: Ownership moves
worker.postMessage(buffer, [buffer]); // Can't access buffer anymore
```

### Solution: Shared Memory

```javascript
// Shared memory: All threads access same memory
const sharedBuffer = new SharedArrayBuffer(1024);
worker.postMessage(sharedBuffer); // No copy, still accessible

// Both main and worker can read/write same memory
```

## Creating SharedArrayBuffer

```javascript
// Create 1024 bytes of shared memory
const sab = new SharedArrayBuffer(1024);

console.log(sab.byteLength); // 1024

// Create typed array view
const int32View = new Int32Array(sab);

// Set values
int32View[0] = 42;
int32View[1] = 100;
```

## Sharing with Workers

### Main Thread

```javascript
const { Worker } = require('worker_threads');

// Create shared buffer
const sharedBuffer = new SharedArrayBuffer(16); // 16 bytes
const sharedArray = new Int32Array(sharedBuffer); // 4 x 32-bit integers

// Initialize values
sharedArray[0] = 0; // Counter
sharedArray[1] = 100; // Shared data

// Share with worker
const worker = new Worker('./worker.js');
worker.postMessage(sharedBuffer);

// Both main and worker can access
setInterval(() => {
  console.log('Main thread sees counter:', sharedArray[0]);
}, 1000);
```

### Worker Thread

```javascript
const { parentPort } = require('worker_threads');

parentPort.on('message', (sharedBuffer) => {
  // Create view of shared memory
  const sharedArray = new Int32Array(sharedBuffer);

  // Increment counter every second
  setInterval(() => {
    sharedArray[0]++; // Both threads see this change!
    console.log('Worker incremented counter to:', sharedArray[0]);
  }, 500);
});
```

## The Race Condition Problem

### Without Atomics (UNSAFE)

```javascript
// Multiple workers incrementing shared counter
// Worker 1 and Worker 2 run this code:

let value = sharedArray[0];  // Both read 0
value = value + 1;            // Both compute 1
sharedArray[0] = value;       // Both write 1

// Expected: 2, Actual: 1 (race condition!)
```

### With Atomics (SAFE)

```javascript
// Atomic operation (indivisible)
Atomics.add(sharedArray, 0, 1);

// Always correct, no race conditions
```

## Atomics - Thread-Safe Operations

Atomics provide thread-safe operations on shared memory.

### Basic Atomic Operations

```javascript
const sab = new SharedArrayBuffer(16);
const int32 = new Int32Array(sab);

// 1. Atomic Load
const value = Atomics.load(int32, 0);
console.log(value);

// 2. Atomic Store
Atomics.store(int32, 0, 42);

// 3. Atomic Add
const oldValue = Atomics.add(int32, 0, 5);
// int32[0] is now 47, returns 42

// 4. Atomic Sub
Atomics.sub(int32, 0, 10);
// int32[0] is now 37

// 5. Atomic Exchange
const previous = Atomics.exchange(int32, 0, 100);
// int32[0] is now 100, returns 37

// 6. Atomic Compare-Exchange
const result = Atomics.compareExchange(int32, 0, 100, 200);
// If int32[0] === 100, set it to 200, return 100
// Otherwise, don't change, return current value
```

### Complete Example: Thread-Safe Counter

```javascript
// main.js
const { Worker } = require('worker_threads');

const sharedBuffer = new SharedArrayBuffer(4);
const counter = new Int32Array(sharedBuffer);

// Initialize counter
Atomics.store(counter, 0, 0);

// Create 4 workers
const workers = [];
for (let i = 0; i < 4; i++) {
  const worker = new Worker('./counter-worker.js', {
    workerData: { sharedBuffer, increments: 10000 }
  });
  workers.push(worker);
}

// Wait for all workers to finish
Promise.all(workers.map(w => {
  return new Promise(resolve => w.on('exit', resolve));
})).then(() => {
  const finalValue = Atomics.load(counter, 0);
  console.log('Expected:', 4 * 10000);
  console.log('Actual:', finalValue);
  console.log('Match:', finalValue === 40000 ? '✓' : '✗');
});
```

```javascript
// counter-worker.js
const { workerData } = require('worker_threads');

const { sharedBuffer, increments } = workerData;
const counter = new Int32Array(sharedBuffer);

// Increment counter atomically
for (let i = 0; i < increments; i++) {
  Atomics.add(counter, 0, 1);
}

console.log(`Worker completed ${increments} increments`);
```

## Wait and Notify

`Atomics.wait()` and `Atomics.notify()` enable thread synchronization.

### Atomics.wait()

Blocks until notified or timeout:

```javascript
// Worker waits for signal
const result = Atomics.wait(int32Array, index, expectedValue, timeout);

// Returns:
// 'ok' - Was notified
// 'not-equal' - Value doesn't match expected
// 'timed-out' - Timeout reached
```

### Atomics.notify()

Wakes up waiting threads:

```javascript
// Wake up N waiting workers
const count = Atomics.notify(int32Array, index, count);
// Returns: Number of workers woken
```

### Example: Producer-Consumer

```javascript
// main.js - Producer
const { Worker } = require('worker_threads');

const sharedBuffer = new SharedArrayBuffer(8);
const int32 = new Int32Array(sharedBuffer);

// int32[0] = data value
// int32[1] = ready flag (0 = not ready, 1 = ready)

const worker = new Worker('./consumer-worker.js');
worker.postMessage(sharedBuffer);

// Produce data
setTimeout(() => {
  console.log('Producer: Creating data');

  // Set data
  Atomics.store(int32, 0, 42);

  // Set ready flag
  Atomics.store(int32, 1, 1);

  // Wake up consumer
  Atomics.notify(int32, 1, 1);
  console.log('Producer: Notified consumer');
}, 2000);
```

```javascript
// consumer-worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', (sharedBuffer) => {
  const int32 = new Int32Array(sharedBuffer);

  console.log('Consumer: Waiting for data');

  // Wait for ready flag to be 1
  const result = Atomics.wait(int32, 1, 0); // Wait while value is 0

  if (result === 'ok') {
    const data = Atomics.load(int32, 0);
    console.log('Consumer: Received data:', data);
  }
});
```

## Practical Use Cases

### Use Case 1: Shared State Management

```javascript
// Shared configuration between workers
const configBuffer = new SharedArrayBuffer(1024);
const config = new Uint32Array(configBuffer);

// Layout:
// config[0] = max workers
// config[1] = batch size
// config[2] = timeout
// config[3] = active workers count

Atomics.store(config, 0, 4);      // max workers
Atomics.store(config, 1, 100);    // batch size
Atomics.store(config, 2, 5000);   // timeout

// Workers read config
workers.forEach(w => w.postMessage(configBuffer));

// Update config from main thread
Atomics.store(config, 1, 200); // Change batch size
// All workers see new value immediately
```

### Use Case 2: Progress Tracking

```javascript
// Track progress across multiple workers
const progressBuffer = new SharedArrayBuffer(16);
const progress = new Uint32Array(progressBuffer);

// progress[0] = total items
// progress[1] = completed items
// progress[2] = failed items

Atomics.store(progress, 0, 10000); // Total

workers.forEach(w => w.postMessage(progressBuffer));

// Workers update progress
// Atomics.add(progress, 1, 1); // Increment completed

// Monitor progress
setInterval(() => {
  const total = Atomics.load(progress, 0);
  const completed = Atomics.load(progress, 1);
  const failed = Atomics.load(progress, 2);

  console.log(`Progress: ${completed}/${total} (${failed} failed)`);
}, 1000);
```

### Use Case 3: Lock Implementation

```javascript
class SpinLock {
  constructor(sharedBuffer, index = 0) {
    this.int32 = new Int32Array(sharedBuffer);
    this.index = index;
    // 0 = unlocked, 1 = locked
  }

  lock() {
    while (true) {
      // Try to acquire lock
      const old = Atomics.compareExchange(this.int32, this.index, 0, 1);

      if (old === 0) {
        // Successfully acquired lock
        return;
      }

      // Lock is held, spin-wait
      // (In production, use Atomics.wait instead)
    }
  }

  unlock() {
    Atomics.store(this.int32, this.index, 0);
  }

  tryLock() {
    const old = Atomics.compareExchange(this.int32, this.index, 0, 1);
    return old === 0; // true if acquired
  }
}

// Usage
const lockBuffer = new SharedArrayBuffer(4);
const lock = new SpinLock(lockBuffer);

lock.lock();
try {
  // Critical section
  sharedArray[0]++;
} finally {
  lock.unlock();
}
```

## Common Pitfalls

### ❌ Pitfall 1: Non-Atomic Operations

```javascript
// ❌ WRONG: Not atomic
sharedArray[0]++;

// ✅ CORRECT: Atomic
Atomics.add(sharedArray, 0, 1);
```

### ❌ Pitfall 2: Using with Non-Integer Types

```javascript
// ❌ WRONG: Float64Array not supported
const float64 = new Float64Array(sab);
Atomics.add(float64, 0, 1.5); // Error!

// ✅ CORRECT: Use Int32Array or similar
const int32 = new Int32Array(sab);
Atomics.add(int32, 0, 1);
```

### ❌ Pitfall 3: Assuming Memory Ordering

```javascript
// ❌ Compiler/CPU may reorder these
sharedArray[0] = 42;
sharedArray[1] = 1; // Ready flag

// ✅ Use Atomics for memory barriers
Atomics.store(sharedArray, 0, 42);
Atomics.store(sharedArray, 1, 1);
```

## Best Practices

### 1. Always Use Atomics for Shared Data

```javascript
// ✅ Good: Atomic operations
Atomics.load(sharedArray, 0);
Atomics.store(sharedArray, 0, value);
Atomics.add(sharedArray, 0, 1);
```

### 2. Document Shared Memory Layout

```javascript
/**
 * Shared Memory Layout:
 * [0] - Lock (0=unlocked, 1=locked)
 * [1] - Counter
 * [2] - Status (0=idle, 1=working, 2=done)
 * [3-7] - Reserved
 */
const sharedArray = new Int32Array(sharedBuffer);
```

### 3. Use Appropriate Data Types

```javascript
// For counters, flags: Int32Array
// For large numbers: BigInt64Array
// For bytes: Uint8Array
```

### 4. Minimize Shared State

```javascript
// Only share what's necessary
// Use message passing for complex data
// Use SharedArrayBuffer for performance-critical shared state
```

## Key Takeaways

1. **SharedArrayBuffer enables true shared memory** - Multiple threads access same memory
2. **Atomics prevent race conditions** - Thread-safe operations
3. **Wait/Notify for synchronization** - Block and wake threads
4. **Use for performance-critical shared state** - Not for all communication
5. **Document memory layout** - Critical for correctness
6. **Always use Atomics** - Regular operations not thread-safe

## Next Steps

Learn about [synchronization patterns](./02-synchronization-patterns.md) for advanced thread coordination.
