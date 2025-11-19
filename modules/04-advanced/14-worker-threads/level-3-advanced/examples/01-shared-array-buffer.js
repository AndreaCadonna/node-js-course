/**
 * Level 3 Example 1: SharedArrayBuffer and Atomics
 *
 * Demonstrates:
 * - Shared memory between threads
 * - Atomic operations
 * - Thread-safe counter
 * - Race condition prevention
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  console.log('=== SharedArrayBuffer Example ===\n');

  // Create shared memory (4 bytes for one Int32)
  const sharedBuffer = new SharedArrayBuffer(4);
  const sharedArray = new Int32Array(sharedBuffer);

  // Initialize counter to 0
  sharedArray[0] = 0;

  console.log('Initial counter value:', sharedArray[0]);
  console.log('Creating 4 workers that will increment counter...\n');

  const workers = [];
  const incrementsPerWorker = 1000;

  // Create 4 workers that all access the same shared memory
  for (let i = 0; i < 4; i++) {
    const worker = new Worker(__filename, {
      workerData: {
        workerId: i,
        sharedBuffer,
        increments: incrementsPerWorker
      }
    });

    workers.push(worker);

    worker.on('message', (msg) => {
      console.log(`Worker ${i}: ${msg}`);
    });
  }

  // Wait for all workers to complete
  Promise.all(workers.map(w => {
    return new Promise(resolve => {
      w.on('exit', resolve);
    });
  })).then(() => {
    const finalValue = Atomics.load(sharedArray, 0);
    const expectedValue = 4 * incrementsPerWorker;

    console.log('\n=== Results ===');
    console.log('Expected value:', expectedValue);
    console.log('Actual value:', finalValue);
    console.log('Match:', finalValue === expectedValue ? '✓' : '✗');

    console.log('\nWithout Atomics, you would likely see a different value');
    console.log('due to race conditions!');
  });

} else {
  const { workerId, sharedBuffer, increments } = workerData;

  // Access the same shared memory
  const sharedArray = new Int32Array(sharedBuffer);

  console.log(`Worker ${workerId}: Starting ${increments} increments`);

  // Increment the shared counter atomically
  for (let i = 0; i < increments; i++) {
    // Atomic add: thread-safe increment
    Atomics.add(sharedArray, 0, 1);

    // Compare with non-atomic (would cause race conditions):
    // sharedArray[0]++;  // ❌ NOT THREAD-SAFE
  }

  const currentValue = Atomics.load(sharedArray, 0);
  parentPort.postMessage(`Completed ${increments} increments. Current value: ${currentValue}`);
}

/**
 * KEY CONCEPTS:
 *
 * SharedArrayBuffer:
 * - Memory shared between threads
 * - All threads can read/write same memory
 * - Enables true shared state
 *
 * Atomics:
 * - Atomic operations (indivisible)
 * - Prevent race conditions
 * - Thread-safe operations
 *
 * Common Atomic operations:
 * - Atomics.add(array, index, value)
 * - Atomics.sub(array, index, value)
 * - Atomics.load(array, index)
 * - Atomics.store(array, index, value)
 * - Atomics.compareExchange(array, index, expected, replacement)
 * - Atomics.wait(array, index, value, timeout)
 * - Atomics.notify(array, index, count)
 */
