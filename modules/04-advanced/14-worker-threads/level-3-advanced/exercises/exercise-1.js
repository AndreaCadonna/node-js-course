/**
 * Exercise 1: Implement a Thread-Safe Counter with SharedArrayBuffer
 *
 * TASK:
 * Create a thread-safe counter that multiple workers can increment
 * simultaneously without race conditions.
 *
 * REQUIREMENTS:
 * 1. Create a SharedArrayBuffer for the counter
 * 2. Create 4 workers that each increment the counter 10,000 times
 * 3. Use Atomics to ensure thread safety
 * 4. Verify final count is exactly 40,000
 *
 * BONUS:
 * - Add a decrement operation
 * - Track per-worker statistics
 * - Implement a reset function
 * - Add thread-safe min/max tracking
 *
 * EXPECTED OUTPUT:
 * Initial counter: 0
 * Worker 0: incrementing...
 * Worker 1: incrementing...
 * Worker 2: incrementing...
 * Worker 3: incrementing...
 * Worker 0: completed 10000 increments
 * Worker 1: completed 10000 increments
 * Worker 2: completed 10000 increments
 * Worker 3: completed 10000 increments
 * Final counter: 40000
 * Success: ✓
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  console.log('=== Thread-Safe Counter Exercise ===\n');

  // TODO: Implement thread-safe counter
  // 1. Create SharedArrayBuffer
  // 2. Create 4 workers with workerData
  // 3. Wait for all workers to complete
  // 4. Verify final count

  // Your code here...

} else {
  // TODO: Implement worker logic
  // 1. Get shared buffer from workerData
  // 2. Create Int32Array view
  // 3. Increment counter 10,000 times using Atomics
  // 4. Report completion

  // Your code here...
}
