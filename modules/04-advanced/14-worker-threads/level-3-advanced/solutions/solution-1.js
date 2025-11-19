/**
 * Solution 1: Thread-Safe Counter with SharedArrayBuffer
 *
 * This solution demonstrates:
 * - Creating SharedArrayBuffer
 * - Using Atomics for thread-safe operations
 * - Coordinating multiple workers
 * - Verifying correctness
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  console.log('=== Thread-Safe Counter Solution ===\n');

  // Create shared buffer (4 bytes for one Int32)
  const sharedBuffer = new SharedArrayBuffer(4);
  const sharedArray = new Int32Array(sharedBuffer);

  // Initialize counter to 0
  Atomics.store(sharedArray, 0, 0);

  console.log('Initial counter:', Atomics.load(sharedArray, 0));
  console.log('Creating 4 workers...\n');

  const workerCount = 4;
  const incrementsPerWorker = 10000;
  const workers = [];

  // Create workers
  for (let i = 0; i < workerCount; i++) {
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

    worker.on('error', (err) => {
      console.error(`Worker ${i} error:`, err);
    });
  }

  // Wait for all workers to complete
  Promise.all(workers.map(w => {
    return new Promise((resolve) => {
      w.on('exit', (code) => {
        resolve(code);
      });
    });
  })).then(() => {
    const finalValue = Atomics.load(sharedArray, 0);
    const expectedValue = workerCount * incrementsPerWorker;

    console.log('\n=== Results ===');
    console.log('Expected value:', expectedValue);
    console.log('Final counter:', finalValue);
    console.log('Match:', finalValue === expectedValue ? '✓' : '✗');

    if (finalValue !== expectedValue) {
      console.error('ERROR: Race condition detected!');
      console.error('This should not happen with Atomics');
    } else {
      console.log('Success! Counter is thread-safe.');
    }
  });

} else {
  // === WORKER THREAD CODE ===
  const { workerId, sharedBuffer, increments } = workerData;

  // Create view of shared memory
  const sharedArray = new Int32Array(sharedBuffer);

  console.log(`Worker ${workerId}: Starting ${increments} increments`);

  // Perform atomic increments
  for (let i = 0; i < increments; i++) {
    // Atomic add: thread-safe increment
    Atomics.add(sharedArray, 0, 1);

    // Optional: Show progress
    if (i > 0 && i % 2000 === 0) {
      const currentValue = Atomics.load(sharedArray, 0);
      console.log(`Worker ${workerId}: ${i}/${increments} (counter now at ${currentValue})`);
    }
  }

  const finalValue = Atomics.load(sharedArray, 0);
  parentPort.postMessage(`completed ${increments} increments (counter now at ${finalValue})`);
}

/**
 * KEY POINTS:
 *
 * 1. SharedArrayBuffer creates shared memory
 * 2. Atomics.add() ensures thread-safe increment
 * 3. Without Atomics, you would see race conditions
 * 4. All workers can read/write same memory location
 * 5. Final value is always correct with Atomics
 *
 * ALTERNATIVE APPROACHES:
 *
 * 1. Use compareExchange for more control:
 *    while (true) {
 *      const old = Atomics.load(sharedArray, 0);
 *      const exchanged = Atomics.compareExchange(sharedArray, 0, old, old + 1);
 *      if (exchanged === old) break;
 *    }
 *
 * 2. Track per-worker stats in separate indices:
 *    const buffer = new SharedArrayBuffer(workerCount * 4);
 *    Atomics.add(sharedArray, workerId, 1); // Each worker has its own counter
 *
 * 3. Use wait/notify for coordination:
 *    Atomics.wait(sharedArray, 1, 0); // Wait for signal
 *    Atomics.notify(sharedArray, 1); // Wake up workers
 */
