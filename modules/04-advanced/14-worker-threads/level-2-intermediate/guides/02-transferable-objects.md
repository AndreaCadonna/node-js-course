# Transferable Objects - Zero-Copy Data Transfer

## The Problem with Structured Clone

By default, `postMessage()` **clones** data using the structured clone algorithm. For large data, this is slow and memory-intensive.

### Example: Cloning Large Data

```javascript
// Create 100MB buffer
const buffer = new ArrayBuffer(100 * 1024 * 1024);

// Sending this clones the entire 100MB!
worker.postMessage(buffer);
// - Takes time to serialize
// - Takes time to deserialize
// - Uses 200MB total (original + copy)
// - Slow for large data
```

**Performance impact:**
- 100MB clone: ~50-100ms
- 1GB clone: ~500-1000ms
- Memory usage doubles

## The Solution: Transferable Objects

**Transferable objects** can be transferred instead of cloned. The ownership moves from sender to receiver with **zero copying**.

```javascript
// Create 100MB buffer
const buffer = new ArrayBuffer(100 * 1024 * 1024);

// Transfer ownership (zero-copy)
worker.postMessage(buffer, [buffer]);
// - Nearly instant (O(1))
// - No serialization
// - No extra memory
// - Original becomes unusable
```

**Performance impact:**
- 100MB transfer: <1ms
- 1GB transfer: <1ms
- Memory usage stays the same

## How Transferables Work

### Before Transfer (Main Thread)

```javascript
const buffer = new ArrayBuffer(1024);
console.log(buffer.byteLength); // 1024

worker.postMessage(buffer, [buffer]);
//                         ↑
//                    Transfer list
```

### After Transfer

```javascript
// Main thread
console.log(buffer.byteLength); // 0 (neutered/detached)
// Buffer is now unusable in main thread

// Worker thread
parentPort.on('message', (buffer) => {
  console.log(buffer.byteLength); // 1024
  // Worker now owns the buffer
});
```

## Transferable Object Types

### 1. ArrayBuffer

Most common transferable type:

```javascript
const buffer = new ArrayBuffer(1024 * 1024);
worker.postMessage(buffer, [buffer]);
```

### 2. MessagePort

For advanced communication patterns:

```javascript
const { MessageChannel } = require('worker_threads');

const { port1, port2 } = new MessageChannel();

// Transfer port2 to worker
worker.postMessage({ port: port2 }, [port2]);

// Now can communicate directly via port1
port1.postMessage('Direct message to worker');
```

### 3. Typed Arrays' Buffers

```javascript
const uint8 = new Uint8Array(1024);

// Transfer the underlying buffer
worker.postMessage(uint8.buffer, [uint8.buffer]);
```

### 4. Other Transferables (Node.js specific)

```javascript
// ReadableStream, WritableStream, TransformStream
// (Available in newer Node.js versions)
```

## Using Transferables Effectively

### Pattern 1: Large Binary Data Processing

```javascript
// main.js
const fs = require('fs');
const { Worker } = require('worker_threads');

// Read large file into buffer
const fileData = fs.readFileSync('large-file.bin');
const buffer = fileData.buffer;

console.log('Sending', buffer.byteLength, 'bytes');

const worker = new Worker('./process-worker.js');

// Transfer buffer to worker (zero-copy)
worker.postMessage({ buffer }, [buffer]);

worker.on('message', ({ buffer: processedBuffer }) => {
  // Received processed buffer back
  console.log('Received', processedBuffer.byteLength, 'bytes');

  // Save processed data
  const uint8 = new Uint8Array(processedBuffer);
  fs.writeFileSync('processed.bin', uint8);

  worker.terminate();
});
```

```javascript
// process-worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', ({ buffer }) => {
  // Process the buffer
  const view = new Uint8Array(buffer);

  // Transform data
  for (let i = 0; i < view.length; i++) {
    view[i] = view[i] ^ 0xFF; // Bitwise NOT
  }

  // Transfer processed buffer back
  parentPort.postMessage({ buffer }, [buffer]);
});
```

### Pattern 2: Image Processing

```javascript
// main.js - Image processor
const { Worker } = require('worker_threads');
const { createCanvas, loadImage } = require('canvas');

async function processImage(imagePath) {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Get the underlying buffer
  const buffer = imageData.data.buffer;

  const worker = new Worker('./image-worker.js');

  return new Promise((resolve, reject) => {
    worker.on('message', ({ buffer: processedBuffer }) => {
      // Put processed data back
      const processedData = new Uint8ClampedArray(processedBuffer);
      const newImageData = new ImageData(
        processedData,
        canvas.width,
        canvas.height
      );

      ctx.putImageData(newImageData, 0, 0);

      resolve(canvas.toBuffer());
      worker.terminate();
    });

    worker.on('error', reject);

    // Transfer image data buffer
    worker.postMessage({
      buffer,
      width: canvas.width,
      height: canvas.height
    }, [buffer]);
  });
}
```

```javascript
// image-worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', ({ buffer, width, height }) => {
  const pixels = new Uint8ClampedArray(buffer);

  // Apply grayscale filter
  for (let i = 0; i < pixels.length; i += 4) {
    const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    pixels[i] = avg;     // R
    pixels[i + 1] = avg; // G
    pixels[i + 2] = avg; // B
    // pixels[i + 3] is alpha, keep unchanged
  }

  // Transfer back
  parentPort.postMessage({ buffer }, [buffer]);
});
```

### Pattern 3: Ping-Pong Buffer Pattern

For continuous back-and-forth processing:

```javascript
// main.js
const { Worker } = require('worker_threads');

const buffer = new ArrayBuffer(1024);
const view = new Uint32Array(buffer);
view[0] = 0; // Counter

const worker = new Worker('./ping-pong-worker.js');

let count = 0;
const maxCount = 10;

worker.on('message', ({ buffer: returnedBuffer }) => {
  count++;

  const returnedView = new Uint32Array(returnedBuffer);
  console.log(`Main received counter: ${returnedView[0]}`);

  if (count < maxCount) {
    // Send back to worker
    worker.postMessage({ buffer: returnedBuffer }, [returnedBuffer]);
  } else {
    worker.terminate();
  }
});

// Start the ping-pong
worker.postMessage({ buffer }, [buffer]);
```

```javascript
// ping-pong-worker.js
const { parentPort } = require('worker_threads');

parentPort.on('message', ({ buffer }) => {
  const view = new Uint32Array(buffer);

  // Increment counter
  view[0]++;

  console.log(`Worker sending counter: ${view[0]}`);

  // Send back
  parentPort.postMessage({ buffer }, [buffer]);
});
```

## Performance Comparison

### Benchmark: Clone vs Transfer

```javascript
const { Worker } = require('worker_threads');
const { performance } = require('perf_hooks');

async function benchmarkClone(sizeMB) {
  const buffer = new ArrayBuffer(sizeMB * 1024 * 1024);
  const worker = new Worker('./echo-worker.js');

  const start = performance.now();

  worker.postMessage(buffer); // Clone

  await new Promise(resolve => {
    worker.on('message', () => {
      const end = performance.now();
      console.log(`Clone ${sizeMB}MB: ${(end - start).toFixed(2)}ms`);
      worker.terminate();
      resolve();
    });
  });
}

async function benchmarkTransfer(sizeMB) {
  const buffer = new ArrayBuffer(sizeMB * 1024 * 1024);
  const worker = new Worker('./echo-worker.js');

  const start = performance.now();

  worker.postMessage(buffer, [buffer]); // Transfer

  await new Promise(resolve => {
    worker.on('message', () => {
      const end = performance.now();
      console.log(`Transfer ${sizeMB}MB: ${(end - start).toFixed(2)}ms`);
      worker.terminate();
      resolve();
    });
  });
}

async function runBenchmarks() {
  for (const size of [1, 10, 50, 100]) {
    await benchmarkClone(size);
    await benchmarkTransfer(size);
    console.log('');
  }
}

runBenchmarks();

// Typical results:
// Clone 1MB: 2.45ms      Transfer 1MB: 0.12ms
// Clone 10MB: 24.32ms    Transfer 10MB: 0.15ms
// Clone 50MB: 121.54ms   Transfer 50MB: 0.18ms
// Clone 100MB: 243.67ms  Transfer 100MB: 0.21ms
```

## Common Pitfalls

### ❌ Pitfall 1: Accessing Transferred Buffer

```javascript
const buffer = new ArrayBuffer(1024);
worker.postMessage(buffer, [buffer]);

// ❌ Error: buffer is neutered/detached
console.log(buffer.byteLength); // 0
const view = new Uint8Array(buffer); // Still works
view[0] = 42; // ❌ Error: Cannot perform operations on detached buffer
```

### ❌ Pitfall 2: Forgetting Transfer List

```javascript
const buffer = new ArrayBuffer(1024);

// ❌ Wrong: No transfer list
worker.postMessage({ data: buffer }); // Buffer is cloned

// ✅ Correct: Include in transfer list
worker.postMessage({ data: buffer }, [buffer]); // Buffer is transferred
```

### ❌ Pitfall 3: Transferring Non-Transferables

```javascript
const obj = { data: [1, 2, 3] };

// ❌ Error: obj is not transferable
worker.postMessage(obj, [obj]); // Throws error

// ✅ Only transferable objects in the list
const buffer = new ArrayBuffer(8);
worker.postMessage({ buffer, obj }, [buffer]); // Works: only buffer transferred
```

### ❌ Pitfall 4: Transfer Without Awareness

```javascript
function sendData(worker, buffer) {
  worker.postMessage(buffer, [buffer]);
  // Caller doesn't know buffer is now unusable!
}

const myBuffer = new ArrayBuffer(1024);
sendData(worker, myBuffer);

// ❌ Buffer is now detached
console.log(myBuffer.byteLength); // 0
```

## Best Practices

### 1. Document Transferred Ownership

```javascript
/**
 * Process buffer in worker
 * @param {ArrayBuffer} buffer - Will be transferred (becomes unusable)
 * @returns {Promise<ArrayBuffer>} Processed buffer
 */
async function processBuffer(buffer) {
  return new Promise((resolve) => {
    worker.postMessage({ buffer }, [buffer]);
    worker.on('message', ({ buffer }) => resolve(buffer));
  });
}
```

### 2. Create Copy If Needed Later

```javascript
const originalBuffer = new ArrayBuffer(1024);

// Create copy if you need to keep the original
const bufferCopy = originalBuffer.slice(0);

// Transfer the copy
worker.postMessage(bufferCopy, [bufferCopy]);

// Original still usable
console.log(originalBuffer.byteLength); // 1024
```

### 3. Use for Large Data Only

```javascript
const TRANSFER_THRESHOLD = 1024 * 1024; // 1MB

function sendToWorker(data) {
  if (data instanceof ArrayBuffer && data.byteLength > TRANSFER_THRESHOLD) {
    // Large data: transfer
    worker.postMessage({ data }, [data]);
  } else {
    // Small data: clone
    worker.postMessage({ data });
  }
}
```

### 4. Validate Before Transfer

```javascript
function transferBuffer(buffer) {
  if (!(buffer instanceof ArrayBuffer)) {
    throw new TypeError('Expected ArrayBuffer');
  }

  if (buffer.byteLength === 0) {
    throw new Error('Cannot transfer detached buffer');
  }

  worker.postMessage({ buffer }, [buffer]);
}
```

## Key Takeaways

1. **Transferables move ownership** - Zero-copy transfer
2. **Original becomes unusable** - Detached after transfer
3. **Massively faster for large data** - O(1) vs O(n)
4. **Limited types** - ArrayBuffer, MessagePort, etc.
5. **Explicit transfer list** - Must specify what to transfer
6. **Best for large binary data** - Images, audio, video, large datasets

## Next Steps

Learn about [MessageChannel](./03-message-channel.md) for advanced communication patterns between workers.
