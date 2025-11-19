# Understanding Backpressure

## Introduction

Backpressure is one of the most important concepts in streaming. It's the mechanism that prevents fast producers from overwhelming slow consumers, ensuring your application doesn't run out of memory or crash under load.

This guide explains how backpressure works internally, how to detect it, how to handle it properly, and how to tune performance with the `highWaterMark` setting.

---

## What Is Backpressure?

### The Problem: Speed Mismatch

Imagine this scenario:

```javascript
// Fast producer: Reads 100 MB/s from disk
const fastSource = fs.createReadStream('huge-file.dat');

// Slow consumer: Writes 1 MB/s to network
const slowDestination = networkSocket;

// What happens?
fastSource.pipe(slowDestination);
```

**Without backpressure:**
- Source reads 100 MB
- Destination processes 1 MB
- 99 MB accumulates in memory
- Memory usage explodes
- Application crashes

**With backpressure:**
- Source reads fast initially
- Buffer fills up
- Stream signals "pause"
- Source stops reading
- Destination catches up
- Stream signals "resume"
- Source continues reading

---

## The Water Tank Analogy

Think of streams as connected water tanks:

```
┌─────────────────┐
│   Fast Faucet   │  ← Producer (100 L/min)
│     (Source)    │
└────────┬────────┘
         │
         ↓
┌────────────────────┐
│   Storage Tank     │  ← Buffer (50 L capacity)
│   ████████░░░░     │     (highWaterMark)
└────────┬───────────┘
         │
         ↓
┌────────────────────┐
│   Slow Drain       │  ← Consumer (10 L/min)
│  (Destination)     │
└────────────────────┘
```

**What happens:**
1. Faucet fills tank faster than drain empties it
2. Tank fills to capacity (highWaterMark)
3. **Backpressure activated**: faucet shuts off
4. Drain continues emptying tank
5. Tank level drops below threshold
6. **Backpressure released**: faucet turns back on

This prevents overflow (memory crash).

---

## How Backpressure Works Internally

### The Buffer and highWaterMark

Every stream has an internal buffer:

```javascript
const stream = new Readable({
  highWaterMark: 16384  // 16 KB (default)
});
```

**highWaterMark = Buffer size limit**

```
Buffer State:

Empty          Low             High           Full
├──────────────┼───────────────┼──────────────┤
0              8KB             16KB          ...

                              ↑
                        highWaterMark
```

### State Transitions

```javascript
// Writable stream states
const writable = fs.createWriteStream('output.txt');

// State 1: Below highWaterMark
let canWrite = writable.write('data'); // returns true
console.log(canWrite); // true - can write more

// State 2: Above highWaterMark
for (let i = 0; i < 10000; i++) {
  canWrite = writable.write('x'.repeat(1000));
}
console.log(canWrite); // false - buffer full!

// State 3: Buffer draining
writable.once('drain', () => {
  console.log('Buffer drained, can write again');
  // Now safe to write more
});
```

---

## Detecting Backpressure

### Method 1: Check write() Return Value

```javascript
const writable = fs.createWriteStream('output.txt');

const canContinue = writable.write('some data');

if (!canContinue) {
  console.log('❌ Backpressure! Buffer is full');

  writable.once('drain', () => {
    console.log('✅ Backpressure released');
  });
} else {
  console.log('✅ Can write more');
}
```

### Method 2: Monitor Buffer Size

```javascript
const { Writable } = require('stream');

class MonitoredWritable extends Writable {
  _write(chunk, encoding, callback) {
    // Check internal buffer
    const bufferSize = this.writableLength;
    const waterMark = this.writableHighWaterMark;
    const percentFull = (bufferSize / waterMark) * 100;

    console.log(`Buffer: ${bufferSize}/${waterMark} (${percentFull.toFixed(1)}% full)`);

    setTimeout(callback, 100); // Simulate slow processing
  }
}

const stream = new MonitoredWritable();

for (let i = 0; i < 20; i++) {
  const ok = stream.write(`Chunk ${i}\n`);
  console.log(`Write ${i}: ${ok ? 'OK' : 'BACKPRESSURE'}`);
}
```

### Method 3: Listen to Events

```javascript
const writable = fs.createWriteStream('output.txt');

// Backpressure activated
writable.on('drain', () => {
  console.log('drain - Buffer emptied, ready for more');
});

// Other useful events
writable.on('finish', () => {
  console.log('finish - All data written');
});

writable.on('error', (err) => {
  console.error('error -', err.message);
});
```

---

## Handling Backpressure Correctly

### ❌ Wrong: Ignoring Backpressure

```javascript
// BAD: Ignores backpressure signals
function badProducer(writable) {
  for (let i = 0; i < 1000000; i++) {
    writable.write(`Line ${i}\n`); // Ignoring return value!
  }
  writable.end();
}

// Result: Memory explosion!
```

### ✅ Correct: Respecting Backpressure

```javascript
// GOOD: Respects backpressure
function goodProducer(writable) {
  let i = 0;
  const max = 1000000;

  function writeNext() {
    let ok = true;

    // Write while buffer accepts data
    while (i < max && ok) {
      const data = `Line ${i}\n`;
      i++;

      if (i === max) {
        // Last chunk
        writable.write(data, writeNext);
      } else {
        // Check if can continue
        ok = writable.write(data);
      }
    }

    if (i < max) {
      // Buffer full - wait for drain
      writable.once('drain', writeNext);
    } else {
      // All done
      writable.end();
    }
  }

  writeNext();
}

// Result: Constant memory usage
```

### Pattern: Async Iterator (Modern Approach)

```javascript
async function modernProducer(writable) {
  for (let i = 0; i < 1000000; i++) {
    const canContinue = writable.write(`Line ${i}\n`);

    if (!canContinue) {
      // Wait for drain
      await new Promise(resolve => {
        writable.once('drain', resolve);
      });
    }
  }

  writable.end();
}
```

---

## Backpressure in Pipelines

### Using pipe() (Automatic)

```javascript
// pipe() handles backpressure automatically!
source
  .pipe(transform)
  .pipe(destination);

// Internally:
// 1. destination signals backpressure
// 2. transform pauses reading from source
// 3. source pauses reading from its source
// 4. Backpressure propagates upstream
// 5. When destination drains, process reverses
```

### Using pipeline() (Better)

```javascript
const { pipeline } = require('stream');

pipeline(
  source,
  transform,
  destination,
  (err) => {
    if (err) {
      console.error('Pipeline failed:', err);
    } else {
      console.log('Pipeline succeeded');
    }
  }
);

// Advantages:
// - Automatic backpressure
// - Proper error handling
// - Cleanup on errors
// - Recommended for production
```

### Manual Pipeline (Understanding)

```javascript
// How pipe() works internally
function manualPipe(readable, writable) {
  readable.on('data', (chunk) => {
    const canContinue = writable.write(chunk);

    if (!canContinue) {
      // Backpressure - pause reading
      readable.pause();

      writable.once('drain', () => {
        // Resume reading
        readable.resume();
      });
    }
  });

  readable.on('end', () => {
    writable.end();
  });

  readable.on('error', (err) => {
    writable.destroy(err);
  });
}
```

---

## Tuning highWaterMark

### What Is the Right Size?

```javascript
// Default values
const readable = new Readable({
  highWaterMark: 16 * 1024  // 16 KB (binary mode)
});

const readableObjects = new Readable({
  objectMode: true,
  highWaterMark: 16  // 16 objects (object mode)
});
```

### Tuning Guidelines

**Small highWaterMark (1-8 KB):**
- **Pros:** Lower memory usage
- **Cons:** More system calls, higher CPU usage
- **Use when:** Memory constrained, many concurrent streams

**Large highWaterMark (64-256 KB):**
- **Pros:** Fewer system calls, better throughput
- **Cons:** Higher memory usage
- **Use when:** Large files, fast I/O, fewer concurrent streams

**Example:**

```javascript
// Memory-optimized (many small files)
const stream1 = fs.createReadStream('file.txt', {
  highWaterMark: 4 * 1024  // 4 KB
});

// Throughput-optimized (large file)
const stream2 = fs.createReadStream('huge.bin', {
  highWaterMark: 128 * 1024  // 128 KB
});

// Object streams (number of objects, not bytes)
const stream3 = new Transform({
  objectMode: true,
  highWaterMark: 100  // Buffer 100 objects
});
```

---

## Measuring Backpressure Impact

### Monitoring Tool

```javascript
const { Transform } = require('stream');

class BackpressureMonitor extends Transform {
  constructor(name, options) {
    super(options);
    this.name = name;
    this.chunks = 0;
    this.paused = 0;
    this.startTime = Date.now();
  }

  _transform(chunk, encoding, callback) {
    this.chunks++;

    // Log buffer state
    const bufferSize = this.readableLength;
    const waterMark = this.readableHighWaterMark;
    const pct = ((bufferSize / waterMark) * 100).toFixed(1);

    console.log(`[${this.name}] Chunk ${this.chunks} | Buffer: ${pct}%`);

    // Simulate processing time
    setTimeout(() => {
      this.push(chunk);
      callback();
    }, 10);
  }

  _final(callback) {
    const elapsed = Date.now() - this.startTime;
    const rate = (this.chunks / (elapsed / 1000)).toFixed(2);

    console.log(`[${this.name}] Done: ${this.chunks} chunks in ${elapsed}ms (${rate} chunks/sec)`);
    callback();
  }
}

// Usage
const { pipeline } = require('stream');

pipeline(
  fs.createReadStream('input.txt'),
  new BackpressureMonitor('Monitor1'),
  fs.createWriteStream('output.txt'),
  (err) => {
    if (err) console.error(err);
  }
);
```

---

## Common Backpressure Scenarios

### Scenario 1: Fast Read, Slow Write

```javascript
// Reading from SSD: 500 MB/s
const fastRead = fs.createReadStream('local-file.bin', {
  highWaterMark: 64 * 1024
});

// Writing to network: 10 MB/s
const slowWrite = networkSocket;

// Solution: pipe() handles it
fastRead.pipe(slowWrite);

// What happens:
// 1. Read buffer fills quickly
// 2. Write buffer fills
// 3. Backpressure propagates to read
// 4. Read pauses until write catches up
```

### Scenario 2: Multiple Producers, One Consumer

```javascript
const { Writable } = require('stream');

class MergeWriter extends Writable {
  _write(chunk, encoding, callback) {
    // Slow processing
    setTimeout(() => {
      console.log(chunk.toString());
      callback();
    }, 100);
  }
}

const writer = new MergeWriter();

// Multiple sources writing to one destination
const source1 = fs.createReadStream('file1.txt');
const source2 = fs.createReadStream('file2.txt');

// Both respect backpressure independently
source1.pipe(writer, { end: false });
source2.pipe(writer, { end: false });

// Close writer when both done
Promise.all([
  new Promise(resolve => source1.on('end', resolve)),
  new Promise(resolve => source2.on('end', resolve))
]).then(() => writer.end());
```

### Scenario 3: Transform Bottleneck

```javascript
// Fast source → Slow transform → Fast destination
const { Transform } = require('stream');

class SlowTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // CPU-intensive operation
    setTimeout(() => {
      this.push(chunk.toString().toUpperCase());
      callback();
    }, 50); // Simulates slow processing
  }
}

pipeline(
  fs.createReadStream('input.txt'),   // Fast
  new SlowTransform(),                 // Slow (bottleneck)
  fs.createWriteStream('output.txt'), // Fast
  (err) => {
    if (err) console.error(err);
  }
);

// Backpressure propagates from transform to read stream
```

---

## Advanced: Custom Backpressure Logic

### Implementing Custom Flow Control

```javascript
const { Readable } = require('stream');

class SmartReadable extends Readable {
  constructor(options) {
    super(options);
    this.counter = 0;
    this.paused = false;
  }

  _read(size) {
    if (this.paused) return;

    // Generate data
    while (this.counter < 100) {
      const chunk = `Chunk ${this.counter}\n`;
      const canContinue = this.push(chunk);

      this.counter++;

      if (!canContinue) {
        // Backpressure detected
        console.log(`Pausing at chunk ${this.counter}`);
        this.paused = true;
        return; // Stop producing
      }
    }

    // All done
    this.push(null);
  }

  _destroy(err, callback) {
    // Cleanup
    callback(err);
  }
}
```

---

## Debugging Backpressure Issues

### Symptoms of Backpressure Problems

**1. Memory Leak:**
```javascript
// Symptom: Memory grows unbounded
// Cause: Ignoring backpressure
// Fix: Check write() return value
```

**2. Slow Performance:**
```javascript
// Symptom: Stream is slower than expected
// Cause: highWaterMark too small
// Fix: Increase highWaterMark
```

**3. Blocking/Freezing:**
```javascript
// Symptom: Stream stops processing
// Cause: Callback not called in _write()
// Fix: Always call callback
```

### Debugging Tools

```javascript
// 1. Monitor buffer levels
console.log('Readable buffer:', stream.readableLength);
console.log('Writable buffer:', stream.writableLength);

// 2. Track write() return values
let backpressureCount = 0;
const ok = stream.write(data);
if (!ok) backpressureCount++;

// 3. Listen to all events
stream.on('drain', () => console.log('DRAIN'));
stream.on('data', () => console.log('DATA'));
stream.on('end', () => console.log('END'));
stream.on('finish', () => console.log('FINISH'));
stream.on('error', (err) => console.log('ERROR', err));
```

---

## Best Practices

### ✅ Do:

1. **Always check write() return value**
   ```javascript
   const ok = stream.write(data);
   if (!ok) {
     await new Promise(resolve => stream.once('drain', resolve));
   }
   ```

2. **Use pipeline() for automatic backpressure**
   ```javascript
   pipeline(source, transform, destination, callback);
   ```

3. **Tune highWaterMark for your use case**
   ```javascript
   const stream = new Readable({ highWaterMark: 64 * 1024 });
   ```

4. **Monitor buffer levels in production**
   ```javascript
   setInterval(() => {
     console.log('Buffer:', stream.writableLength);
   }, 1000);
   ```

### ❌ Don't:

1. **Ignore write() return value**
   ```javascript
   // BAD
   stream.write(data); // Ignoring return value
   ```

2. **Write synchronously in a loop**
   ```javascript
   // BAD
   for (let i = 0; i < 1000000; i++) {
     stream.write(data); // Memory explosion!
   }
   ```

3. **Use extremely large highWaterMark**
   ```javascript
   // BAD
   const stream = new Readable({ highWaterMark: 100 * 1024 * 1024 }); // 100 MB!
   ```

---

## Summary

### Key Takeaways

1. **Backpressure prevents memory overflow** by slowing fast producers
2. **highWaterMark** controls buffer size
3. **write() returns false** when buffer is full
4. **'drain' event** signals buffer has space again
5. **pipe()/pipeline()** handle backpressure automatically
6. **Tune highWaterMark** based on your use case
7. **Monitor buffer levels** to detect issues

### Decision Tree

```
Is my stream using too much memory?
├─ YES → Check if ignoring write() return value
│        → Reduce highWaterMark
│        → Use pipeline() instead of manual piping
│
└─ NO → Is performance slow?
        ├─ YES → Increase highWaterMark
        │        → Profile bottleneck
        │
        └─ NO → Everything is working! ✅
```

### Next Steps

1. Learn [Object Mode Streams](./05-object-mode-streams.md)
2. Study [backpressure examples](../examples/07-backpressure-control.js)
3. Practice with [rate limiter exercise](../exercises/exercise-4.js)

---

## Quick Reference

```javascript
// Producing data with backpressure handling
async function produce(writable) {
  for (const data of dataSource) {
    const ok = writable.write(data);

    if (!ok) {
      // Wait for drain
      await new Promise(resolve => {
        writable.once('drain', resolve);
      });
    }
  }
  writable.end();
}

// Monitoring backpressure
const bufferSize = stream.writableLength;
const waterMark = stream.writableHighWaterMark;
const backpressure = bufferSize >= waterMark;

// Using pipeline (recommended)
const { pipeline } = require('stream');
pipeline(source, transform, destination, (err) => {
  if (err) console.error('Pipeline error:', err);
});
```

Ready to work with object streams? Continue to [Object Mode Streams](./05-object-mode-streams.md)!
