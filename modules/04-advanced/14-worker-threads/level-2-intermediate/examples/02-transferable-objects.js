/**
 * Level 2 Example 2: Transferable Objects
 *
 * Demonstrates:
 * - Zero-copy transfer with ArrayBuffer
 * - Performance comparison: clone vs transfer
 * - Transferable object types
 * - Use cases for transferables
 */

const { Worker, isMainThread, parentPort } = require('worker_threads');
const { performance } = require('perf_hooks');

if (isMainThread) {
  console.log('=== Transferable Objects Example ===\n');

  const dataSizeMB = 50;
  const dataSize = dataSizeMB * 1024 * 1024;

  // Test 1: Regular message (clones data)
  console.log(`Test 1: Clone (regular postMessage) - ${dataSizeMB}MB`);
  console.log('-----------------------------------');

  const buffer1 = new ArrayBuffer(dataSize);
  const view1 = new Uint8Array(buffer1);
  view1.fill(42);

  console.log('Buffer size before:', buffer1.byteLength, 'bytes');

  const worker1 = new Worker(__filename, { workerData: { mode: 'clone' } });

  const start1 = performance.now();
  worker1.postMessage(buffer1); // Clone (copy)
  const end1 = performance.now();

  console.log('Transfer time:', (end1 - start1).toFixed(2), 'ms');
  console.log('Buffer size after:', buffer1.byteLength, 'bytes (still accessible)');

  worker1.on('message', () => {
    worker1.terminate();
    runTest2();
  });

  function runTest2() {
    console.log(`\nTest 2: Transfer (transferable) - ${dataSizeMB}MB`);
    console.log('-----------------------------------');

    const buffer2 = new ArrayBuffer(dataSize);
    const view2 = new Uint8Array(buffer2);
    view2.fill(42);

    console.log('Buffer size before:', buffer2.byteLength, 'bytes');

    const worker2 = new Worker(__filename, { workerData: { mode: 'transfer' } });

    const start2 = performance.now();
    // Transfer ownership (zero-copy)
    worker2.postMessage(buffer2, [buffer2]);
    const end2 = performance.now();

    console.log('Transfer time:', (end2 - start2).toFixed(2), 'ms');
    console.log('Buffer size after:', buffer2.byteLength, 'bytes (transferred, unusable)');

    worker2.on('message', () => {
      worker2.terminate();

      console.log('\n=== Comparison ===');
      console.log(`Clone: ${(end1 - start1).toFixed(2)}ms`);
      console.log(`Transfer: ${(end2 - start2).toFixed(2)}ms`);
      console.log(`Speedup: ${((end1 - start1) / (end2 - start2)).toFixed(2)}x faster`);
      console.log('\nTransfer is near-instant regardless of data size!');
    });
  }

} else {
  const { workerData } = require('worker_threads');

  parentPort.on('message', (buffer) => {
    console.log(`Worker (${workerData.mode}): Received buffer, size:`, buffer.byteLength);

    // Process the buffer
    const view = new Uint8Array(buffer);
    const sum = view.reduce((acc, val) => acc + val, 0);

    console.log(`Worker: Processed buffer, sum: ${sum}`);

    parentPort.postMessage('done');
  });
}

/**
 * KEY POINTS:
 *
 * 1. Transferable objects are moved, not copied
 * 2. Original becomes unusable (byteLength = 0)
 * 3. Transfer is O(1), clone is O(n)
 * 4. Use for large binary data
 *
 * Transferable types:
 * - ArrayBuffer
 * - MessagePort
 * - ReadableStream
 * - WritableStream
 * - TransformStream
 */
