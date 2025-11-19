/**
 * Level 3 Example 2: Producer-Consumer Pattern with Atomics
 *
 * Demonstrates:
 * - SharedArrayBuffer for shared state
 * - Atomics.wait() and Atomics.notify()
 * - Thread synchronization
 * - Producer-consumer pattern
 * - Circular buffer implementation
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Shared buffer layout:
// [0] = write index
// [1] = read index
// [2] = count
// [3] = buffer size
// [4-N] = data buffer

const BUFFER_SIZE = 10;
const HEADER_SIZE = 4;
const TOTAL_SIZE = HEADER_SIZE + BUFFER_SIZE;

if (isMainThread) {
  console.log('=== Producer-Consumer with SharedArrayBuffer ===\n');

  // Create shared buffer
  const sharedBuffer = new SharedArrayBuffer(TOTAL_SIZE * 4); // 4 bytes per int32
  const sharedArray = new Int32Array(sharedBuffer);

  // Initialize header
  Atomics.store(sharedArray, 0, 0);            // write index
  Atomics.store(sharedArray, 1, 0);            // read index
  Atomics.store(sharedArray, 2, 0);            // count
  Atomics.store(sharedArray, 3, BUFFER_SIZE);  // buffer size

  console.log(`Created circular buffer with size ${BUFFER_SIZE}\n`);

  // Create producer workers
  const producer1 = new Worker(__filename, {
    workerData: { role: 'producer', id: 1, sharedBuffer }
  });

  const producer2 = new Worker(__filename, {
    workerData: { role: 'producer', id: 2, sharedBuffer }
  });

  // Create consumer worker
  const consumer = new Worker(__filename, {
    workerData: { role: 'consumer', id: 1, sharedBuffer }
  });

  // Monitor buffer state
  const monitor = setInterval(() => {
    const count = Atomics.load(sharedArray, 2);
    const writeIdx = Atomics.load(sharedArray, 0);
    const readIdx = Atomics.load(sharedArray, 1);

    console.log(`[Monitor] Buffer: ${count}/${BUFFER_SIZE} items (write=${writeIdx}, read=${readIdx})`);
  }, 2000);

  // Cleanup after 15 seconds
  setTimeout(() => {
    clearInterval(monitor);
    console.log('\n=== Shutting down ===');

    producer1.terminate();
    producer2.terminate();
    consumer.terminate();

    console.log('All workers terminated');
  }, 15000);

} else {
  // === WORKER THREAD CODE ===
  const { role, id, sharedBuffer } = workerData;
  const sharedArray = new Int32Array(sharedBuffer);

  if (role === 'producer') {
    // PRODUCER: Generates items and puts them in buffer
    let itemNumber = id * 1000; // Different ranges for each producer

    setInterval(() => {
      // Check if buffer is full
      const count = Atomics.load(sharedArray, 2);
      const bufferSize = Atomics.load(sharedArray, 3);

      if (count >= bufferSize) {
        console.log(`[Producer ${id}] Buffer full, waiting...`);
        return;
      }

      // Get write index
      const writeIdx = Atomics.load(sharedArray, 0);
      const dataIdx = HEADER_SIZE + writeIdx;

      // Write item
      const item = itemNumber++;
      Atomics.store(sharedArray, dataIdx, item);

      // Update write index (circular)
      Atomics.store(sharedArray, 0, (writeIdx + 1) % bufferSize);

      // Increment count
      Atomics.add(sharedArray, 2, 1);

      console.log(`[Producer ${id}] Produced item ${item} at index ${writeIdx}`);

      // Notify consumer that data is available
      Atomics.notify(sharedArray, 2);

    }, 500 + Math.random() * 500); // Random production rate

  } else if (role === 'consumer') {
    // CONSUMER: Consumes items from buffer
    function consume() {
      // Check if buffer is empty
      let count = Atomics.load(sharedArray, 2);

      if (count === 0) {
        console.log(`[Consumer ${id}] Buffer empty, waiting...`);

        // Wait for items (with timeout)
        const result = Atomics.wait(sharedArray, 2, 0, 1000);

        if (result === 'timed-out') {
          // No items, try again
          setTimeout(consume, 100);
          return;
        }

        // Reload count after wait
        count = Atomics.load(sharedArray, 2);

        if (count === 0) {
          // Still empty
          setTimeout(consume, 100);
          return;
        }
      }

      // Get read index
      const readIdx = Atomics.load(sharedArray, 1);
      const bufferSize = Atomics.load(sharedArray, 3);
      const dataIdx = HEADER_SIZE + readIdx;

      // Read item
      const item = Atomics.load(sharedArray, dataIdx);

      // Update read index (circular)
      Atomics.store(sharedArray, 1, (readIdx + 1) % bufferSize);

      // Decrement count
      Atomics.sub(sharedArray, 2, 1);

      console.log(`[Consumer ${id}] Consumed item ${item} from index ${readIdx}`);

      // Process item (simulate work)
      const processTime = 300 + Math.random() * 400;
      setTimeout(consume, processTime);
    }

    // Start consuming
    consume();
  }
}

/**
 * KEY CONCEPTS DEMONSTRATED:
 *
 * 1. Circular Buffer: Efficiently reuse fixed memory
 * 2. Atomics.wait(): Block until data available
 * 3. Atomics.notify(): Wake up waiting threads
 * 4. Thread-safe operations: All buffer operations are atomic
 * 5. Producer-Consumer pattern: Classic concurrency pattern
 *
 * NOTES:
 * - This is a simplified version
 * - Production code should handle edge cases better
 * - Consider using proper locks for complex operations
 * - Monitor for deadlocks and starvation
 */
