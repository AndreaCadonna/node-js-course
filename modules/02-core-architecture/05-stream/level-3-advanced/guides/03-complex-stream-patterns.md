# Complex Stream Patterns

## Introduction

This guide explores advanced streaming patterns used in production systems: multiplexing, demultiplexing, fan-out, fan-in, stream coordination, and more. You'll learn how to build sophisticated stream architectures that handle complex data flows.

By the end, you'll be able to design and implement multi-stream systems that process data from multiple sources and distribute to multiple destinations efficiently.

---

## Multiplexing and Demultiplexing

### Understanding Multiplexing

**Multiplexing**: Combining multiple streams into one stream.

```
Stream A ──┐
Stream B ──┼──> Multiplexed Stream
Stream C ──┘
```

```javascript
const { PassThrough, Readable } = require('stream');

class Multiplexer extends PassThrough {
  constructor(options) {
    super(options);
    this.sources = [];
    this.activeSources = 0;
  }

  addSource(stream) {
    this.sources.push(stream);
    this.activeSources++;

    stream.on('data', (chunk) => {
      // Add source identifier to chunk
      const tagged = {
        sourceId: this.sources.indexOf(stream),
        data: chunk
      };
      this.write(JSON.stringify(tagged) + '\n');
    });

    stream.on('end', () => {
      this.activeSources--;
      if (this.activeSources === 0) {
        this.end(); // All sources done
      }
    });

    stream.on('error', (err) => {
      this.destroy(err);
    });
  }
}

// Usage
const mux = new Multiplexer();

const stream1 = Readable.from(['a1', 'a2', 'a3']);
const stream2 = Readable.from(['b1', 'b2', 'b3']);
const stream3 = Readable.from(['c1', 'c2', 'c3']);

mux.addSource(stream1);
mux.addSource(stream2);
mux.addSource(stream3);

mux.on('data', (chunk) => {
  console.log('Multiplexed:', chunk.toString());
});
```

### Demultiplexing

**Demultiplexing**: Splitting one stream into multiple streams based on criteria.

```
                     ┌──> Stream A
Multiplexed Stream ──┼──> Stream B
                     └──> Stream C
```

```javascript
const { Transform, PassThrough } = require('stream');

class Demultiplexer extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.outputs = new Map();
  }

  getOutputStream(id) {
    if (!this.outputs.has(id)) {
      this.outputs.set(id, new PassThrough({ objectMode: true }));
    }
    return this.outputs.get(id);
  }

  _transform(chunk, encoding, callback) {
    try {
      const message = JSON.parse(chunk);
      const output = this.getOutputStream(message.sourceId);
      output.write(message.data);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    // End all output streams
    for (const output of this.outputs.values()) {
      output.end();
    }
    callback();
  }
}

// Usage
const demux = new Demultiplexer();

// Create output streams
const streamA = demux.getOutputStream(0);
const streamB = demux.getOutputStream(1);
const streamC = demux.getOutputStream(2);

streamA.on('data', (data) => console.log('Stream A:', data));
streamB.on('data', (data) => console.log('Stream B:', data));
streamC.on('data', (data) => console.log('Stream C:', data));

// Feed multiplexed data
multiplexedStream.pipe(demux);
```

---

## Fan-Out Pattern

### Broadcasting to Multiple Destinations

Send each chunk to multiple consumers:

```
              ┌──> Consumer 1
Source Stream ┼──> Consumer 2
              └──> Consumer 3
```

```javascript
const { PassThrough } = require('stream');

class FanOut extends PassThrough {
  constructor(options) {
    super(options);
    this.destinations = [];
  }

  addDestination(stream) {
    this.destinations.push(stream);

    // Handle backpressure from slowest consumer
    stream.on('drain', () => {
      this.emit('drain');
    });

    return this;
  }

  _write(chunk, encoding, callback) {
    let pending = this.destinations.length;

    if (pending === 0) {
      callback();
      return;
    }

    let hasBackpressure = false;

    this.destinations.forEach((dest) => {
      const canWrite = dest.write(chunk, encoding, () => {
        pending--;
        if (pending === 0) {
          callback();
        }
      });

      if (!canWrite) {
        hasBackpressure = true;
      }
    });

    // If any destination has backpressure, signal it
    if (hasBackpressure) {
      return false;
    }
  }

  _final(callback) {
    // End all destinations
    this.destinations.forEach(dest => dest.end());
    callback();
  }
}

// Usage
const fanOut = new FanOut();

const dest1 = fs.createWriteStream('output1.txt');
const dest2 = fs.createWriteStream('output2.txt');
const dest3 = fs.createWriteStream('output3.txt');

fanOut.addDestination(dest1);
fanOut.addDestination(dest2);
fanOut.addDestination(dest3);

source.pipe(fanOut);
```

### Conditional Fan-Out

Route to different destinations based on content:

```javascript
class ConditionalFanOut extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.routes = new Map();
  }

  addRoute(predicate, destination) {
    this.routes.set(predicate, destination);
    return this;
  }

  _transform(item, encoding, callback) {
    let routed = false;

    for (const [predicate, destination] of this.routes) {
      if (predicate(item)) {
        destination.write(item);
        routed = true;
      }
    }

    if (!routed) {
      // Default: pass through
      this.push(item);
    }

    callback();
  }

  _flush(callback) {
    // End all destinations
    for (const destination of this.routes.values()) {
      destination.end();
    }
    callback();
  }
}

// Usage
const router = new ConditionalFanOut();

const evenStream = new PassThrough({ objectMode: true });
const oddStream = new PassThrough({ objectMode: true });
const largeStream = new PassThrough({ objectMode: true });

router
  .addRoute((n) => n % 2 === 0, evenStream)
  .addRoute((n) => n % 2 === 1, oddStream)
  .addRoute((n) => n > 100, largeStream);

evenStream.on('data', (n) => console.log('Even:', n));
oddStream.on('data', (n) => console.log('Odd:', n));
largeStream.on('data', (n) => console.log('Large:', n));
```

---

## Fan-In Pattern

### Merging Multiple Sources

Combine multiple streams into one:

```
Source 1 ──┐
Source 2 ──┼──> Merged Stream
Source 3 ──┘
```

```javascript
const { PassThrough } = require('stream');

class FanIn extends PassThrough {
  constructor(options) {
    super(options);
    this.sources = [];
    this.activeSources = 0;
    this.ended = false;
  }

  addSource(stream) {
    this.sources.push(stream);
    this.activeSources++;

    stream.on('data', (chunk) => {
      if (!this.ended) {
        this.write(chunk);
      }
    });

    stream.on('end', () => {
      this.activeSources--;
      this.checkIfDone();
    });

    stream.on('error', (err) => {
      this.destroy(err);
    });

    return this;
  }

  checkIfDone() {
    if (this.activeSources === 0 && !this.ended) {
      this.ended = true;
      this.end();
    }
  }
}

// Usage
const fanIn = new FanIn();

const source1 = fs.createReadStream('file1.txt');
const source2 = fs.createReadStream('file2.txt');
const source3 = fs.createReadStream('file3.txt');

fanIn.addSource(source1);
fanIn.addSource(source2);
fanIn.addSource(source3);

fanIn.pipe(process.stdout);
```

### Priority-Based Fan-In

Merge streams with priority:

```javascript
class PriorityFanIn extends PassThrough {
  constructor(options) {
    super(options);
    this.queues = new Map(); // priority -> queue
    this.activeSources = 0;
    this.processing = false;
  }

  addSource(stream, priority = 0) {
    this.activeSources++;

    stream.on('data', (chunk) => {
      this.enqueue(chunk, priority);
      this.processQueues();
    });

    stream.on('end', () => {
      this.activeSources--;
      this.processQueues();
    });

    return this;
  }

  enqueue(chunk, priority) {
    if (!this.queues.has(priority)) {
      this.queues.set(priority, []);
    }
    this.queues.get(priority).push(chunk);
  }

  processQueues() {
    if (this.processing) return;
    this.processing = true;

    // Process highest priority first
    const priorities = Array.from(this.queues.keys()).sort((a, b) => b - a);

    for (const priority of priorities) {
      const queue = this.queues.get(priority);

      while (queue.length > 0) {
        const chunk = queue.shift();
        if (!this.write(chunk)) {
          // Backpressure
          this.processing = false;
          return;
        }
      }
    }

    this.processing = false;

    // Check if all sources done
    if (this.activeSources === 0) {
      this.end();
    }
  }
}
```

---

## Stream Coordination

### Parallel Processing with Coordination

```javascript
class ParallelCoordinator {
  constructor(numWorkers) {
    this.numWorkers = numWorkers;
    this.workers = [];
    this.results = [];
  }

  async process(sourceStream, workerFactory) {
    // Create workers
    for (let i = 0; i < this.numWorkers; i++) {
      const worker = workerFactory(i);
      this.workers.push(worker);

      worker.on('data', (result) => {
        this.results.push(result);
      });
    }

    // Distribute work round-robin
    let workerIndex = 0;

    for await (const chunk of sourceStream) {
      const worker = this.workers[workerIndex];
      worker.write(chunk);

      workerIndex = (workerIndex + 1) % this.numWorkers;
    }

    // End all workers
    this.workers.forEach(w => w.end());

    // Wait for all to finish
    await Promise.all(
      this.workers.map(w => new Promise(resolve => w.on('finish', resolve)))
    );

    return this.results;
  }
}

// Usage
const coordinator = new ParallelCoordinator(4);

const results = await coordinator.process(
  sourceStream,
  (workerId) => new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      // Process chunk
      const result = processChunk(chunk, workerId);
      callback(null, result);
    }
  })
);
```

### Barrier Synchronization

Wait for multiple streams to reach the same point:

```javascript
class Barrier {
  constructor(count) {
    this.count = count;
    this.waiting = 0;
    this.callbacks = [];
  }

  async wait() {
    return new Promise((resolve) => {
      this.callbacks.push(resolve);
      this.waiting++;

      if (this.waiting === this.count) {
        // All arrived - release all
        this.callbacks.forEach(cb => cb());
        this.callbacks = [];
        this.waiting = 0;
      }
    });
  }
}

// Usage with streams
class BarrierTransform extends Transform {
  constructor(barrier, options) {
    super(options);
    this.barrier = barrier;
  }

  async _transform(chunk, encoding, callback) {
    // Process chunk
    const result = this.processChunk(chunk);

    // Wait at barrier
    await this.barrier.wait();

    callback(null, result);
  }

  processChunk(chunk) {
    return chunk;
  }
}

// Create synchronized streams
const barrier = new Barrier(3);

const stream1 = source1.pipe(new BarrierTransform(barrier));
const stream2 = source2.pipe(new BarrierTransform(barrier));
const stream3 = source3.pipe(new BarrierTransform(barrier));
```

---

## Stream Pooling

### Connection Pool Pattern

```javascript
class StreamPool {
  constructor(factory, poolSize) {
    this.factory = factory;
    this.poolSize = poolSize;
    this.available = [];
    this.inUse = new Set();
  }

  async acquire() {
    // Try to get available stream
    if (this.available.length > 0) {
      const stream = this.available.pop();
      this.inUse.add(stream);
      return stream;
    }

    // Create new if under limit
    if (this.inUse.size < this.poolSize) {
      const stream = await this.factory();
      this.inUse.add(stream);
      return stream;
    }

    // Wait for one to become available
    return new Promise((resolve) => {
      const checkAvailable = () => {
        if (this.available.length > 0) {
          const stream = this.available.pop();
          this.inUse.add(stream);
          resolve(stream);
        } else {
          setTimeout(checkAvailable, 10);
        }
      };
      checkAvailable();
    });
  }

  release(stream) {
    this.inUse.delete(stream);
    this.available.push(stream);
  }

  async drain() {
    // Wait for all to be released
    while (this.inUse.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Destroy all
    this.available.forEach(stream => stream.destroy());
    this.available = [];
  }
}

// Usage
const pool = new StreamPool(
  () => net.connect({ host: 'example.com', port: 80 }),
  10 // max 10 connections
);

async function processWithPool(data) {
  const stream = await pool.acquire();

  try {
    await writeToStream(stream, data);
  } finally {
    pool.release(stream);
  }
}
```

---

## Stream Orchestration

### Workflow Pattern

Chain multiple operations with branching:

```javascript
class StreamWorkflow {
  constructor() {
    this.steps = [];
  }

  addStep(name, transform) {
    this.steps.push({ name, transform });
    return this;
  }

  addConditionalStep(name, condition, transform) {
    this.steps.push({ name, condition, transform });
    return this;
  }

  createPipeline() {
    const { pipeline } = require('stream');
    const steps = [];

    for (const step of this.steps) {
      if (step.condition) {
        // Conditional transform
        steps.push(new Transform({
          objectMode: true,
          transform(chunk, encoding, callback) {
            if (step.condition(chunk)) {
              step.transform._transform.call(this, chunk, encoding, callback);
            } else {
              callback(null, chunk);
            }
          }
        }));
      } else {
        steps.push(step.transform);
      }
    }

    return (...args) => pipeline(...steps, ...args);
  }
}

// Usage
const workflow = new StreamWorkflow()
  .addStep('parse', new ParseTransform())
  .addConditionalStep(
    'validate',
    (item) => item.requiresValidation,
    new ValidateTransform()
  )
  .addStep('enrich', new EnrichTransform())
  .addConditionalStep(
    'filter',
    (item) => item.score > 0.5,
    new FilterTransform()
  )
  .addStep('format', new FormatTransform());

const runPipeline = workflow.createPipeline();

runPipeline(
  sourceStream,
  destinationStream,
  (err) => {
    if (err) console.error('Workflow failed:', err);
  }
);
```

---

## Advanced Patterns

### Stream Tee (Split and Duplicate)

```javascript
class StreamTee extends Transform {
  constructor(streams, options) {
    super(options);
    this.outputs = streams;
  }

  _transform(chunk, encoding, callback) {
    // Write to all outputs
    this.outputs.forEach(output => {
      output.write(chunk);
    });

    // Also pass through
    this.push(chunk);

    callback();
  }

  _flush(callback) {
    this.outputs.forEach(output => output.end());
    callback();
  }
}

// Usage: write to file while also processing
const tee = new StreamTee([
  fs.createWriteStream('backup.txt'),
  fs.createWriteStream('log.txt')
]);

source
  .pipe(tee)
  .pipe(processTransform)
  .pipe(destination);
```

### Stream Join (Combine by Key)

```javascript
class StreamJoin extends Transform {
  constructor(keyExtractor, options) {
    super({ objectMode: true, ...options });
    this.keyExtractor = keyExtractor;
    this.leftCache = new Map();
    this.rightCache = new Map();
  }

  addLeft(stream) {
    stream.on('data', (item) => {
      const key = this.keyExtractor(item);
      this.leftCache.set(key, item);
      this.tryJoin(key);
    });
  }

  addRight(stream) {
    stream.on('data', (item) => {
      const key = this.keyExtractor(item);
      this.rightCache.set(key, item);
      this.tryJoin(key);
    });
  }

  tryJoin(key) {
    if (this.leftCache.has(key) && this.rightCache.has(key)) {
      const left = this.leftCache.get(key);
      const right = this.rightCache.get(key);

      this.push({ ...left, ...right });

      // Clean up
      this.leftCache.delete(key);
      this.rightCache.delete(key);
    }
  }
}
```

### Sliding Window

```javascript
class SlidingWindow extends Transform {
  constructor(windowSize, options) {
    super({ objectMode: true, ...options });
    this.windowSize = windowSize;
    this.window = [];
  }

  _transform(item, encoding, callback) {
    this.window.push(item);

    if (this.window.length > this.windowSize) {
      this.window.shift();
    }

    if (this.window.length === this.windowSize) {
      // Emit window
      this.push([...this.window]);
    }

    callback();
  }

  _flush(callback) {
    // Emit remaining partial windows
    while (this.window.length > 0) {
      this.push([...this.window]);
      this.window.shift();
    }
    callback();
  }
}

// Usage: Moving average
const window = new SlidingWindow(5);
const average = new Transform({
  objectMode: true,
  transform(items, encoding, callback) {
    const avg = items.reduce((a, b) => a + b, 0) / items.length;
    callback(null, avg);
  }
});

numbers.pipe(window).pipe(average);
```

---

## Summary

### Complex Pattern Catalog

| Pattern | Purpose | Use Case |
|---------|---------|----------|
| Multiplexing | Combine streams | Multiple sources → one destination |
| Demultiplexing | Split streams | One source → multiple destinations |
| Fan-Out | Broadcast | Same data to multiple consumers |
| Fan-In | Merge | Multiple sources → combined output |
| Pooling | Resource reuse | Limited connections/resources |
| Coordination | Synchronize | Parallel processing with dependencies |
| Workflow | Orchestrate | Complex multi-step processing |
| Tee | Duplicate | Process and save simultaneously |
| Join | Combine by key | Merge related data streams |
| Sliding Window | Time-based | Moving calculations |

### Best Practices

1. **Handle backpressure** across all branches
2. **Clean up resources** when streams end
3. **Propagate errors** properly
4. **Monitor performance** of complex pipelines
5. **Test edge cases** (empty streams, errors, backpressure)
6. **Document flow** for maintainability
7. **Use object mode** for complex routing
8. **Consider memory** with buffering patterns

### Next Steps

1. Study [Testing Streams](./04-testing-streams.md)
2. Review [multiplexing example](../examples/03-stream-multiplexing.js)
3. Practice with [multi-source aggregator exercise](../exercises/exercise-3.js)

---

## Quick Reference

```javascript
// Fan-Out
const fanOut = new FanOut();
fanOut.addDestination(dest1).addDestination(dest2);

// Fan-In
const fanIn = new FanIn();
fanIn.addSource(src1).addSource(src2);

// Multiplexing
const mux = new Multiplexer();
mux.addSource(stream1);
mux.addSource(stream2);

// Stream Pool
const pool = new StreamPool(factory, 10);
const stream = await pool.acquire();
pool.release(stream);
```

Ready to test streams? Continue to [Testing Streams](./04-testing-streams.md)!
