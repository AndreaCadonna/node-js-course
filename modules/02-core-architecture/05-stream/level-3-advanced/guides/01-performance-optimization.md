# Performance Optimization for Streams

## Introduction

This guide covers advanced performance optimization techniques for Node.js streams. You'll learn how to profile streams, optimize memory usage, maximize throughput, and build production-grade high-performance streaming applications.

By the end, you'll be able to identify bottlenecks, implement optimizations, and build streams that can handle millions of items efficiently.

---

## Understanding Stream Performance

### Performance Metrics

When optimizing streams, focus on these key metrics:

```javascript
const metrics = {
  throughput: 'items/second or MB/s',
  latency: 'time from input to output',
  memory: 'heap usage and GC pressure',
  cpu: 'CPU utilization',
  backpressure: 'how often backpressure occurs'
};
```

### The Performance Triangle

```
        Throughput
           /\
          /  \
         /    \
        /      \
       /        \
      /          \
     /            \
    /______________\
  Memory          CPU

You can optimize for 2, but rarely all 3
```

**Key Trade-offs:**
1. Higher throughput = more memory/CPU
2. Lower memory = reduced throughput
3. Lower CPU = slower processing

---

## Profiling Streams

### Basic Performance Monitoring

```javascript
const { Transform } = require('stream');

class MonitoredTransform extends Transform {
  constructor(name, options) {
    super(options);
    this.name = name;
    this.chunks = 0;
    this.bytes = 0;
    this.startTime = Date.now();
    this.lastReport = this.startTime;
  }

  _transform(chunk, encoding, callback) {
    this.chunks++;
    this.bytes += chunk.length;

    // Report every second
    const now = Date.now();
    if (now - this.lastReport >= 1000) {
      const elapsed = (now - this.startTime) / 1000;
      const throughput = this.bytes / elapsed / 1024 / 1024; // MB/s
      const chunksPerSec = this.chunks / elapsed;

      console.log(`[${this.name}] ${throughput.toFixed(2)} MB/s, ${chunksPerSec.toFixed(0)} chunks/s`);
      this.lastReport = now;
    }

    callback(null, chunk);
  }

  _flush(callback) {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const throughput = this.bytes / elapsed / 1024 / 1024;

    console.log(`\n[${this.name}] Final Stats:`);
    console.log(`  Duration: ${elapsed.toFixed(2)}s`);
    console.log(`  Total: ${(this.bytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Throughput: ${throughput.toFixed(2)} MB/s`);
    console.log(`  Chunks: ${this.chunks}`);

    callback();
  }
}
```

### Memory Profiling

```javascript
class MemoryMonitor extends Transform {
  constructor(options) {
    super(options);
    this.interval = setInterval(() => this.reportMemory(), 1000);
  }

  reportMemory() {
    const usage = process.memoryUsage();
    console.log('Memory:', {
      heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`
    });
  }

  _transform(chunk, encoding, callback) {
    callback(null, chunk);
  }

  _flush(callback) {
    clearInterval(this.interval);
    callback();
  }
}
```

### CPU Profiling

```javascript
// Use Node.js built-in profiler
// Run: node --prof app.js
// Process: node --prof-process isolate-*.log > processed.txt

// Or use clinic.js
// npm install -g clinic
// clinic doctor -- node app.js
// clinic flame -- node app.js

// Manual CPU monitoring
class CPUMonitor extends Transform {
  constructor(options) {
    super(options);
    this.startUsage = process.cpuUsage();
    this.startTime = Date.now();
  }

  _transform(chunk, encoding, callback) {
    callback(null, chunk);
  }

  _flush(callback) {
    const usage = process.cpuUsage(this.startUsage);
    const elapsed = (Date.now() - this.startTime) * 1000; // microseconds

    console.log('\nCPU Usage:');
    console.log(`  User: ${(usage.user / elapsed * 100).toFixed(2)}%`);
    console.log(`  System: ${(usage.system / elapsed * 100).toFixed(2)}%`);

    callback();
  }
}
```

---

## Memory Optimization

### Choosing the Right highWaterMark

```javascript
// Default values
const defaults = {
  binary: 16 * 1024,      // 16 KB
  objectMode: 16          // 16 objects
};

// Small files - use smaller buffer
const smallFileStream = fs.createReadStream('small.txt', {
  highWaterMark: 1024 // 1 KB
});

// Large files - use larger buffer for throughput
const largeFileStream = fs.createReadStream('large.txt', {
  highWaterMark: 256 * 1024 // 256 KB
});

// Network streams - balance latency and throughput
const networkStream = net.connect({
  highWaterMark: 64 * 1024 // 64 KB
});

// Object streams - depends on object size
const objectStream = new Transform({
  objectMode: true,
  highWaterMark: 100 // 100 objects
});
```

**Guidelines for highWaterMark:**

1. **Small objects** (< 1 KB): Use higher count (100-1000)
2. **Medium objects** (1-100 KB): Use moderate count (16-100)
3. **Large objects** (> 100 KB): Use lower count (1-16)
4. **Slow consumers**: Use smaller buffer to reduce memory
5. **Fast consumers**: Use larger buffer for throughput

### Avoiding Memory Leaks

```javascript
// ❌ WRONG - storing all data in memory
class LeakyTransform extends Transform {
  constructor(options) {
    super(options);
    this.allData = []; // Memory leak!
  }

  _transform(chunk, encoding, callback) {
    this.allData.push(chunk); // Growing unbounded
    callback(null, chunk);
  }
}

// ✅ CORRECT - process and release
class EfficientTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // Process chunk
    const processed = this.process(chunk);

    // Pass it on - don't store
    callback(null, processed);

    // chunk can now be garbage collected
  }
}

// ✅ CORRECT - bounded cache
class BoundedCacheTransform extends Transform {
  constructor(cacheSize, options) {
    super(options);
    this.cache = [];
    this.cacheSize = cacheSize;
  }

  _transform(chunk, encoding, callback) {
    // Add to cache
    this.cache.push(chunk);

    // Limit cache size
    if (this.cache.length > this.cacheSize) {
      this.cache.shift(); // Remove oldest
    }

    callback(null, chunk);
  }
}
```

### Buffer Management

```javascript
// Efficient buffer handling
class BufferOptimizedTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // ❌ WRONG - creates new buffer every time
    const wrong = Buffer.concat([Buffer.from('prefix'), chunk]);

    // ✅ BETTER - reuse buffers when possible
    if (!this.prefix) {
      this.prefix = Buffer.from('prefix');
    }
    const better = Buffer.concat([this.prefix, chunk]);

    // ✅ BEST - allocate once, write multiple times
    if (!this.buffer) {
      this.buffer = Buffer.allocUnsafe(1024);
      this.prefix.copy(this.buffer, 0);
    }

    // Write chunk after prefix
    chunk.copy(this.buffer, this.prefix.length);

    // Slice to exact size
    const result = this.buffer.slice(0, this.prefix.length + chunk.length);

    callback(null, result);
  }
}
```

---

## Throughput Optimization

### Batching

```javascript
// Process multiple items at once
class BatchTransform extends Transform {
  constructor(batchSize, options) {
    super({ objectMode: true, ...options });
    this.batchSize = batchSize;
    this.batch = [];
  }

  _transform(item, encoding, callback) {
    this.batch.push(item);

    if (this.batch.length >= this.batchSize) {
      // Process batch
      const processed = this.processBatch(this.batch);

      // Emit processed items
      for (const result of processed) {
        this.push(result);
      }

      // Clear batch
      this.batch = [];
    }

    callback();
  }

  _flush(callback) {
    // Process remaining items
    if (this.batch.length > 0) {
      const processed = this.processBatch(this.batch);
      for (const result of processed) {
        this.push(result);
      }
    }
    callback();
  }

  processBatch(items) {
    // Process all items together - more efficient than one-by-one
    return items.map(item => this.processItem(item));
  }

  processItem(item) {
    return item; // Implement your processing
  }
}
```

### Parallel Processing

```javascript
const { Transform } = require('stream');
const { Worker } = require('worker_threads');

class ParallelTransform extends Transform {
  constructor(workerScript, numWorkers, options) {
    super({ objectMode: true, ...options });

    this.workers = [];
    this.queue = [];
    this.pending = 0;

    // Create worker pool
    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(workerScript);
      worker.on('message', (result) => this.handleResult(result));
      this.workers.push(worker);
    }
  }

  _transform(item, encoding, callback) {
    this.queue.push({ item, callback });
    this.processQueue();
  }

  processQueue() {
    while (this.queue.length > 0 && this.pending < this.workers.length) {
      const { item, callback } = this.queue.shift();

      // Find available worker
      const worker = this.workers[this.pending % this.workers.length];

      worker.postMessage({ id: this.pending++, item });
      callback(); // Don't wait for result
    }
  }

  handleResult(result) {
    this.push(result.data);
    this.pending--;
    this.processQueue();
  }

  _flush(callback) {
    // Wait for all pending work
    const checkDone = () => {
      if (this.pending === 0 && this.queue.length === 0) {
        // Terminate workers
        this.workers.forEach(w => w.terminate());
        callback();
      } else {
        setTimeout(checkDone, 10);
      }
    };
    checkDone();
  }
}
```

### Async Iterator Optimization

```javascript
// ❌ SLOWER - awaiting each item
async function slowProcess(stream) {
  for await (const chunk of stream) {
    await processChunk(chunk); // Sequential
  }
}

// ✅ FASTER - parallel processing with bounded concurrency
async function fastProcess(stream, concurrency = 10) {
  const promises = new Set();

  for await (const chunk of stream) {
    const promise = processChunk(chunk)
      .then(() => promises.delete(promise));

    promises.add(promise);

    // Limit concurrency
    if (promises.size >= concurrency) {
      await Promise.race(promises);
    }
  }

  // Wait for remaining
  await Promise.all(promises);
}
```

---

## CPU Optimization

### Avoiding Blocking Operations

```javascript
// ❌ WRONG - blocking CPU-intensive work
class BlockingTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // Expensive operation blocks event loop
    const result = this.expensiveCPUWork(chunk);
    callback(null, result);
  }

  expensiveCPUWork(data) {
    // Imagine this takes 100ms
    let result = data;
    for (let i = 0; i < 1000000; i++) {
      result = crypto.createHash('sha256').update(result).digest();
    }
    return result;
  }
}

// ✅ CORRECT - offload to worker thread
const { Worker } = require('worker_threads');

class NonBlockingTransform extends Transform {
  constructor(options) {
    super(options);
    this.worker = new Worker('./cpu-worker.js');
  }

  _transform(chunk, encoding, callback) {
    // Offload to worker
    this.worker.postMessage(chunk);

    this.worker.once('message', (result) => {
      callback(null, result);
    });
  }

  _flush(callback) {
    this.worker.terminate();
    callback();
  }
}

// cpu-worker.js
const { parentPort } = require('worker_threads');
const crypto = require('crypto');

parentPort.on('message', (data) => {
  const result = expensiveCPUWork(data);
  parentPort.postMessage(result);
});
```

### Debouncing and Throttling

```javascript
// Throttle: Limit frequency
class ThrottledTransform extends Transform {
  constructor(intervalMs, options) {
    super(options);
    this.interval = intervalMs;
    this.lastEmit = 0;
  }

  _transform(chunk, encoding, callback) {
    const now = Date.now();

    if (now - this.lastEmit >= this.interval) {
      this.push(chunk);
      this.lastEmit = now;
    }
    // Drop chunk if too soon

    callback();
  }
}

// Debounce: Wait for quiet period
class DebouncedTransform extends Transform {
  constructor(waitMs, options) {
    super(options);
    this.wait = waitMs;
    this.lastChunk = null;
    this.timer = null;
  }

  _transform(chunk, encoding, callback) {
    this.lastChunk = chunk;

    // Clear existing timer
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // Set new timer
    this.timer = setTimeout(() => {
      this.push(this.lastChunk);
      this.lastChunk = null;
    }, this.wait);

    callback();
  }

  _flush(callback) {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (this.lastChunk) {
      this.push(this.lastChunk);
    }
    callback();
  }
}
```

---

## Backpressure Optimization

### Measuring Backpressure

```javascript
class BackpressureMonitor extends Transform {
  constructor(options) {
    super(options);
    this.backpressureEvents = 0;
    this.totalWrites = 0;
  }

  _transform(chunk, encoding, callback) {
    this.totalWrites++;

    const canWrite = this.push(chunk);

    if (!canWrite) {
      this.backpressureEvents++;
    }

    callback();
  }

  _flush(callback) {
    const backpressureRate = this.backpressureEvents / this.totalWrites;

    console.log('\nBackpressure Stats:');
    console.log(`  Events: ${this.backpressureEvents}`);
    console.log(`  Total writes: ${this.totalWrites}`);
    console.log(`  Rate: ${(backpressureRate * 100).toFixed(2)}%`);

    // High backpressure rate suggests:
    // - Consumer is slower than producer
    // - Consider smaller highWaterMark
    // - Or optimize consumer

    callback();
  }
}
```

### Optimal Flow Control

```javascript
// Perfect balance between producer and consumer
class AdaptiveTransform extends Transform {
  constructor(options) {
    super(options);
    this.backpressureCount = 0;
    this.totalPushes = 0;
    this.adjustmentInterval = 100;
  }

  _transform(chunk, encoding, callback) {
    const processed = this.process(chunk);

    this.totalPushes++;
    const canContinue = this.push(processed);

    if (!canContinue) {
      this.backpressureCount++;
    }

    // Adapt to backpressure
    if (this.totalPushes % this.adjustmentInterval === 0) {
      const rate = this.backpressureCount / this.totalPushes;

      if (rate > 0.5) {
        // Too much backpressure - slow down
        setImmediate(() => callback());
      } else if (rate < 0.1) {
        // Low backpressure - can go faster
        callback();
      } else {
        // Good balance
        callback();
      }
    } else {
      callback();
    }
  }

  process(chunk) {
    return chunk; // Implement your processing
  }
}
```

---

## Real-World Optimization Patterns

### Pattern 1: High-Throughput File Processing

```javascript
const fs = require('fs');
const { Transform } = require('stream');

// Optimized for processing large files quickly
fs.createReadStream('large-file.txt', {
  highWaterMark: 256 * 1024  // 256 KB chunks for throughput
})
  .pipe(new Transform({
    transform(chunk, encoding, callback) {
      // Process chunk
      const result = this.fastProcess(chunk);
      callback(null, result);
    },
    fastProcess(chunk) {
      // Use buffer operations - faster than string
      return chunk; // Your processing
    }
  }))
  .pipe(fs.createWriteStream('output.txt', {
    highWaterMark: 256 * 1024
  }));
```

### Pattern 2: Low-Latency Real-Time Processing

```javascript
// Optimized for minimal latency
const realtimeStream = new Transform({
  highWaterMark: 1,  // Process immediately
  transform(chunk, encoding, callback) {
    // Process and emit ASAP
    const result = this.process(chunk);
    callback(null, result);
  }
});
```

### Pattern 3: Memory-Constrained Environment

```javascript
// Optimized for minimal memory usage
const memoryEfficientStream = new Transform({
  highWaterMark: 1024,  // Small buffer
  transform(chunk, encoding, callback) {
    // Process in place when possible
    for (let i = 0; i < chunk.length; i++) {
      chunk[i] = chunk[i] ^ 0xFF; // XOR in place
    }
    callback(null, chunk);
  }
});
```

---

## Performance Testing

### Benchmark Setup

```javascript
const { performance } = require('perf_hooks');

async function benchmark(name, streamFactory, iterations = 5) {
  console.log(`\nBenchmarking: ${name}`);

  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    // Run stream to completion
    await new Promise((resolve, reject) => {
      const stream = streamFactory();
      stream.on('end', resolve);
      stream.on('error', reject);
      stream.resume(); // Drain stream
    });

    const duration = performance.now() - start;
    times.push(duration);
    console.log(`  Run ${i + 1}: ${duration.toFixed(2)}ms`);
  }

  const avg = times.reduce((a, b) => a + b) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(`  Average: ${avg.toFixed(2)}ms`);
  console.log(`  Min: ${min.toFixed(2)}ms`);
  console.log(`  Max: ${max.toFixed(2)}ms`);

  return { avg, min, max, times };
}

// Usage
benchmark('String Transform', () => {
  return createStringTransformStream();
}, 10);

benchmark('Buffer Transform', () => {
  return createBufferTransformStream();
}, 10);
```

---

## Summary

### Performance Optimization Checklist

- [ ] **Profile first** - measure before optimizing
- [ ] **Choose appropriate highWaterMark** for your use case
- [ ] **Avoid memory leaks** - don't store unbounded data
- [ ] **Use batching** for better throughput
- [ ] **Offload CPU work** to worker threads
- [ ] **Monitor backpressure** and adjust accordingly
- [ ] **Prefer buffers** over strings when possible
- [ ] **Test performance** with realistic data
- [ ] **Consider trade-offs** between throughput, memory, and CPU

### Key Metrics to Track

1. **Throughput**: MB/s or items/s
2. **Latency**: Time from input to output
3. **Memory**: Heap usage and GC frequency
4. **CPU**: Usage percentage
5. **Backpressure**: Frequency and duration

### Common Performance Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| Memory leak | Growing heap | Remove unbounded storage |
| Slow throughput | Low MB/s | Increase highWaterMark, batch |
| High latency | Delayed output | Reduce highWaterMark |
| CPU blocked | Event loop lag | Use worker threads |
| Excessive GC | Frequent pauses | Reuse buffers, reduce allocations |

### Next Steps

1. Study [Advanced Error Handling](./02-advanced-error-handling.md)
2. Review [performance profiling example](../examples/01-performance-profiling.js)
3. Practice with [optimization exercises](../exercises/exercise-1.js)

---

## Quick Reference

```javascript
// Monitor performance
class PerformanceMonitor extends Transform {
  constructor(name, options) {
    super(options);
    this.name = name;
    this.startTime = Date.now();
    this.bytes = 0;
    this.chunks = 0;
  }

  _transform(chunk, encoding, callback) {
    this.bytes += chunk.length;
    this.chunks++;
    callback(null, chunk);
  }

  _flush(callback) {
    const duration = (Date.now() - this.startTime) / 1000;
    const throughput = this.bytes / duration / 1024 / 1024;

    console.log(`${this.name}: ${throughput.toFixed(2)} MB/s`);
    callback();
  }
}
```

Ready for error handling? Continue to [Advanced Error Handling](./02-advanced-error-handling.md)!
