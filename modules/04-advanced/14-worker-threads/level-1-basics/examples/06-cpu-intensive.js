/**
 * Example 6: CPU-Intensive Tasks
 *
 * Demonstrates:
 * - Offloading CPU-intensive work to workers
 * - Performance comparison: single-threaded vs worker
 * - Main thread responsiveness
 * - Real-world use case for workers
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { performance } = require('perf_hooks');

// CPU-intensive function: Calculate nth Fibonacci number (slow recursive version)
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

if (isMainThread) {
  // === MAIN THREAD CODE ===
  console.log('=== Example 6: CPU-Intensive Task Performance ===\n');

  const fibNumber = 40; // This will take a few seconds

  console.log(`Calculating Fibonacci(${fibNumber})...\n`);

  // Test 1: Single-threaded (blocks main thread)
  console.log('Test 1: Single-threaded calculation');
  console.log('---------------------------------------');

  const start1 = performance.now();

  // Simulate main thread doing work
  let counter = 0;
  const interval1 = setInterval(() => {
    counter++;
    console.log(`Main thread tick ${counter} (should be blocked)`);
  }, 100);

  // Calculate on main thread (this blocks!)
  console.log('Main thread: Starting calculation (this will block)...');
  const result1 = fibonacci(fibNumber);
  const end1 = performance.now();

  clearInterval(interval1);

  console.log(`Main thread: Result = ${result1}`);
  console.log(`Main thread: Time = ${(end1 - start1).toFixed(2)}ms`);
  console.log(`Main thread: Ticks during calculation = ${counter} (should be 0 or 1)`);
  console.log('');

  // Test 2: Worker thread (main thread stays responsive)
  console.log('\nTest 2: Worker thread calculation');
  console.log('---------------------------------------');

  const start2 = performance.now();

  // Simulate main thread doing work
  counter = 0;
  const interval2 = setInterval(() => {
    counter++;
    console.log(`Main thread tick ${counter} (should continue)`);
  }, 100);

  // Calculate in worker (main thread not blocked!)
  console.log('Main thread: Creating worker for calculation...');

  const worker = new Worker(__filename, {
    workerData: { n: fibNumber }
  });

  worker.on('message', (result) => {
    const end2 = performance.now();

    clearInterval(interval2);

    console.log(`\nMain thread: Received result from worker = ${result}`);
    console.log(`Main thread: Time = ${(end2 - start2).toFixed(2)}ms`);
    console.log(`Main thread: Ticks during calculation = ${counter} (should be many)`);

    console.log('\n=== Comparison ===');
    console.log(`Single-threaded: ${(end1 - start1).toFixed(2)}ms, ${0} ticks`);
    console.log(`Worker thread: ${(end2 - start2).toFixed(2)}ms, ${counter} ticks`);
    console.log('\nNote: Worker allows main thread to stay responsive!');

    worker.terminate();
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
    clearInterval(interval2);
  });

  console.log('Main thread: Worker created, main thread continues...');

} else {
  // === WORKER THREAD CODE ===
  const { n } = workerData;

  console.log(`Worker: Calculating fibonacci(${n})...`);

  // Perform the CPU-intensive calculation
  const result = fibonacci(n);

  console.log(`Worker: Calculation complete`);

  // Send result back to main thread
  parentPort.postMessage(result);
}
