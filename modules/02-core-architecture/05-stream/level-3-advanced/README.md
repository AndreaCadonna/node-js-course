# Level 3: Stream Advanced

Master production-ready streaming patterns and advanced optimization techniques.

## Overview

This level covers advanced streaming topics essential for building production-grade applications. You'll learn how to optimize stream performance, handle complex error scenarios, implement sophisticated transformations, test stream implementations, and apply security best practices. By the end of this level, you'll be able to design and maintain enterprise-level streaming systems.

**Time to complete:** 4-6 hours

---

## Learning Objectives

By completing this level, you will:

- [ ] Optimize stream performance for production workloads
- [ ] Profile and debug memory issues in streams
- [ ] Implement advanced error handling and recovery strategies
- [ ] Create complex multi-stream coordination patterns
- [ ] Write comprehensive tests for stream implementations
- [ ] Apply security best practices to streaming applications
- [ ] Implement stream pooling and resource management
- [ ] Build resilient, fault-tolerant stream architectures
- [ ] Handle edge cases and corner scenarios
- [ ] Design scalable streaming systems

---

## Prerequisites

- Completed Level 1 & 2 of Stream module
- Strong JavaScript/Node.js proficiency
- Understanding of performance profiling
- Experience with testing frameworks
- Knowledge of security principles

---

## Topics Covered

### 1. Performance Optimization
- Benchmarking stream performance
- Memory profiling and optimization
- Buffer size tuning
- Reducing allocations
- CPU vs I/O bound optimization
- Parallelization strategies

### 2. Advanced Error Handling
- Error recovery strategies
- Retry logic with backoff
- Circuit breaker pattern
- Graceful degradation
- Error aggregation
- Dead letter queues

### 3. Complex Stream Patterns
- Stream multiplexing/demultiplexing
- Fan-out/fan-in patterns
- Stream pooling and reuse
- Conditional routing
- Stream state machines
- Dynamic pipeline composition

### 4. Testing Streams
- Unit testing custom streams
- Integration testing pipelines
- Mocking stream sources
- Testing backpressure behavior
- Performance regression testing
- Property-based testing

### 5. Security Considerations
- Input validation in streams
- Preventing DoS attacks
- Resource limits and quotas
- Sanitizing streamed data
- Secure file handling
- Crypto stream usage

---

## Conceptual Guides

Advanced concepts for production streams:

### Essential Reading

1. **[Performance Optimization](./guides/01-performance-optimization.md)** (30 min)
   - Profiling stream applications
   - Memory optimization techniques
   - CPU optimization strategies
   - Benchmarking methodologies

2. **[Advanced Error Handling](./guides/02-advanced-error-handling.md)** (25 min)
   - Recovery strategies
   - Retry patterns
   - Circuit breakers
   - Graceful degradation

3. **[Complex Stream Patterns](./guides/03-complex-stream-patterns.md)** (30 min)
   - Multiplexing/demultiplexing
   - Fan-out and fan-in
   - Stream coordination
   - Dynamic pipelines

4. **[Testing Stream Applications](./guides/04-testing-streams.md)** (25 min)
   - Unit testing strategies
   - Integration testing
   - Mocking and stubbing
   - Performance testing

5. **[Security Best Practices](./guides/05-security-best-practices.md)** (20 min)
   - Input validation
   - Resource limits
   - DoS prevention
   - Secure patterns

---

## Examples

Production-ready code examples:

1. **[01-performance-profiling.js](./examples/01-performance-profiling.js)**
   - Memory profiling
   - CPU profiling
   - Performance benchmarking
   - Optimization techniques

2. **[02-error-recovery.js](./examples/02-error-recovery.js)**
   - Retry with exponential backoff
   - Circuit breaker implementation
   - Graceful degradation
   - Error aggregation

3. **[03-stream-multiplexing.js](./examples/03-stream-multiplexing.js)**
   - Multiplexing multiple sources
   - Demultiplexing to destinations
   - Message routing
   - Channel management

4. **[04-fan-out-fan-in.js](./examples/04-fan-out-fan-in.js)**
   - Fan-out pattern
   - Fan-in pattern
   - Parallel processing
   - Result aggregation

5. **[05-stream-pooling.js](./examples/05-stream-pooling.js)**
   - Connection pooling
   - Stream reuse
   - Resource management
   - Lifecycle management

6. **[06-testing-streams.js](./examples/06-testing-streams.js)**
   - Unit test examples
   - Mock streams
   - Test utilities
   - Assertion helpers

7. **[07-security-patterns.js](./examples/07-security-patterns.js)**
   - Input validation
   - Rate limiting
   - Resource quotas
   - Secure file handling

8. **[08-production-pipeline.js](./examples/08-production-pipeline.js)**
   - Complete production example
   - Monitoring and metrics
   - Logging and debugging
   - Health checks

---

## Exercises

Advanced challenges for mastery:

### Exercise 1: High-Performance Log Processor
**Difficulty:** Hard
**File:** [exercises/exercise-1.js](./exercises/exercise-1.js)

Build a log processing system that:
- Processes 1M+ log lines efficiently
- Parses, filters, and aggregates
- Optimizes memory usage
- Benchmarks performance
- Handles errors gracefully

---

### Exercise 2: Resilient API Stream Client
**Difficulty:** Hard
**File:** [exercises/exercise-2.js](./exercises/exercise-2.js)

Create an API client that:
- Streams paginated results
- Implements retry with backoff
- Handles rate limiting
- Recovers from network errors
- Reports health metrics

---

### Exercise 3: Multi-Source Data Aggregator
**Difficulty:** Very Hard
**File:** [exercises/exercise-3.js](./exercises/exercise-3.js)

Build an aggregator that:
- Reads from multiple sources (files, APIs, databases)
- Merges streams intelligently
- Handles different data rates
- Coordinates completion
- Provides progress tracking

---

### Exercise 4: Stream Testing Framework
**Difficulty:** Hard
**File:** [exercises/exercise-4.js](./exercises/exercise-4.js)

Create testing utilities that:
- Generate test streams
- Mock sources and destinations
- Test backpressure handling
- Verify error propagation
- Measure performance

---

### Exercise 5: Production ETL Pipeline
**Difficulty:** Very Hard
**File:** [exercises/exercise-5.js](./exercises/exercise-5.js)

Build a complete ETL system:
- Extract from multiple sources
- Transform with validation
- Load to multiple destinations
- Handle all error scenarios
- Provide monitoring and metrics
- Support hot reconfiguration

---

## Solutions

Comprehensive solutions with production patterns:

- [Solution 1](./solutions/exercise-1-solution.js) - High-performance log processor
- [Solution 2](./solutions/exercise-2-solution.js) - Resilient API client
- [Solution 3](./solutions/exercise-3-solution.js) - Multi-source aggregator
- [Solution 4](./solutions/exercise-4-solution.js) - Testing framework
- [Solution 5](./solutions/exercise-5-solution.js) - Production ETL pipeline

---

## Key Concepts Summary

### Performance Optimization

```javascript
// Tune buffer sizes for workload
const optimized = new MyStream({
  highWaterMark: 256 * 1024, // Larger for throughput
  // vs 16 * 1024 for lower memory
});

// Reduce allocations
class EfficientTransform extends Transform {
  constructor() {
    super();
    this.buffer = Buffer.allocUnsafe(65536); // Reuse buffer
  }

  _transform(chunk, encoding, callback) {
    // Reuse buffer instead of allocating
    callback();
  }
}
```

### Error Recovery

```javascript
async function streamWithRetry(source, dest, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pipeline(source, dest);
      return; // Success
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await delay(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

### Stream Testing

```javascript
const { Readable } = require('stream');

// Create test stream
function createTestStream(data) {
  return Readable.from(data);
}

// Test custom transform
async function testTransform() {
  const input = createTestStream(['a', 'b', 'c']);
  const transform = new UppercaseTransform();
  const output = [];

  transform.on('data', chunk => output.push(chunk));

  await pipeline(input, transform);

  assert.deepEqual(output, ['A', 'B', 'C']);
}
```

---

## Production Patterns

### Pattern 1: Monitored Pipeline

```javascript
function createMonitoredPipeline(stages, metrics) {
  return stages.map(stage => {
    return stage
      .on('data', () => metrics.increment('chunks'))
      .on('error', err => metrics.error(err))
      .on('end', () => metrics.timing('duration'));
  });
}
```

### Pattern 2: Graceful Shutdown

```javascript
class GracefulStream extends Transform {
  constructor() {
    super();
    this.draining = false;

    process.on('SIGTERM', () => {
      this.draining = true;
      this.end();
    });
  }

  _transform(chunk, encoding, callback) {
    if (this.draining) {
      return callback();
    }
    // Process normally
    callback();
  }
}
```

### Pattern 3: Resource Limits

```javascript
class LimitedStream extends Transform {
  constructor(maxBytes) {
    super();
    this.bytesProcessed = 0;
    this.maxBytes = maxBytes;
  }

  _transform(chunk, encoding, callback) {
    this.bytesProcessed += chunk.length;

    if (this.bytesProcessed > this.maxBytes) {
      return callback(new Error('Size limit exceeded'));
    }

    this.push(chunk);
    callback();
  }
}
```

---

## Performance Benchmarks

### Measuring Throughput

```javascript
const { performance } = require('perf_hooks');

async function benchmark(stream, dataSize) {
  const start = performance.now();
  let bytes = 0;

  stream.on('data', chunk => {
    bytes += chunk.length;
  });

  await finished(stream);

  const duration = performance.now() - start;
  const throughput = (bytes / duration) * 1000; // bytes/sec

  console.log(`Throughput: ${throughput} bytes/sec`);
}
```

### Memory Profiling

```javascript
const v8 = require('v8');

function takeHeapSnapshot(label) {
  const snapshot = v8.writeHeapSnapshot(`${label}.heapsnapshot`);
  console.log(`Snapshot saved: ${snapshot}`);
}

// Before
takeHeapSnapshot('before');

// Run stream processing
await processLargeFile();

// After
takeHeapSnapshot('after');
```

---

## Security Best Practices

### Input Validation

```javascript
class ValidatedTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // Validate size
    if (chunk.length > this.maxChunkSize) {
      return callback(new Error('Chunk too large'));
    }

    // Validate content
    if (!this.isValidContent(chunk)) {
      return callback(new Error('Invalid content'));
    }

    this.push(chunk);
    callback();
  }
}
```

### Rate Limiting

```javascript
class RateLimitedStream extends Transform {
  constructor(requestsPerSecond) {
    super({ objectMode: true });
    this.rps = requestsPerSecond;
    this.tokens = requestsPerSecond;
    this.lastRefill = Date.now();
  }

  _transform(obj, encoding, callback) {
    this.refillTokens();

    if (this.tokens < 1) {
      const delay = (1 / this.rps) * 1000;
      setTimeout(() => {
        this.tokens = 1;
        this.push(obj);
        callback();
      }, delay);
    } else {
      this.tokens--;
      this.push(obj);
      callback();
    }
  }

  refillTokens() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const newTokens = (elapsed / 1000) * this.rps;
    this.tokens = Math.min(this.rps, this.tokens + newTokens);
    this.lastRefill = now;
  }
}
```

---

## Testing Strategies

### Unit Testing

```javascript
const assert = require('assert');

describe('UppercaseTransform', () => {
  it('should convert to uppercase', async () => {
    const transform = new UppercaseTransform();
    const input = Readable.from(['hello']);
    const output = [];

    transform.on('data', chunk => output.push(chunk.toString()));

    await pipeline(input, transform);

    assert.strictEqual(output[0], 'HELLO');
  });
});
```

### Integration Testing

```javascript
describe('CSV Pipeline', () => {
  it('should process CSV end-to-end', async () => {
    const input = fs.createReadStream('test.csv');
    const parser = new CSVParser();
    const transform = new DataTransform();
    const output = fs.createWriteStream('output.json');

    await pipeline(input, parser, transform, output);

    const result = JSON.parse(fs.readFileSync('output.json'));
    assert.strictEqual(result.length, 100);
  });
});
```

---

## Common Advanced Pitfalls

### Pitfall 1: Memory Leaks from Buffers

```javascript
// ❌ Wrong - buffers accumulate
class LeakyTransform extends Transform {
  constructor() {
    super();
    this.buffers = []; // Never cleared!
  }

  _transform(chunk, encoding, callback) {
    this.buffers.push(chunk);
    callback();
  }
}

// ✅ Correct - manage memory
class SafeTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // Process immediately, don't accumulate
    this.push(this.process(chunk));
    callback();
  }
}
```

### Pitfall 2: Blocking Event Loop

```javascript
// ❌ Wrong - CPU intensive blocking
_transform(chunk, encoding, callback) {
  const result = expensiveSync Operation(chunk);
  this.push(result);
  callback();
}

// ✅ Correct - async or worker threads
async _transform(chunk, encoding, callback) {
  const result = await processInWorker(chunk);
  this.push(result);
  callback();
}
```

---

## Practice Projects

### Project 1: Distributed Log Aggregator
- Collect logs from multiple servers
- Parse and normalize
- Filter and route
- Store with backpressure handling
- Real-time dashboard

### Project 2: Real-Time ETL System
- Extract from multiple sources
- Transform with validation
- Load to data warehouse
- Error handling and recovery
- Monitoring and alerting

### Project 3: Video Processing Pipeline
- Stream video chunks
- Transcode formats
- Generate thumbnails
- Store to object storage
- Progress tracking

---

## Success Criteria

You've mastered advanced streams if you can:

- [ ] Optimize streams for production workloads
- [ ] Debug complex memory and performance issues
- [ ] Build resilient, fault-tolerant streaming systems
- [ ] Write comprehensive tests for stream code
- [ ] Apply security best practices
- [ ] Design scalable stream architectures
- [ ] Handle all edge cases and error scenarios
- [ ] Monitor and maintain production streams

---

## Additional Resources

- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Stream Testing Patterns](https://github.com/nodejs/node/tree/master/test/parallel)
- [Production Node.js Guide](https://nodejs.org/en/docs/guides/)

---

## Next Steps

After mastering this level:
1. Build production streaming applications
2. Contribute to open-source streaming libraries
3. Explore other core modules (HTTP, Crypto, Worker Threads)
4. Apply streams in distributed systems

---

**Congratulations!** You've completed the Stream module. You now have the knowledge to build production-grade streaming applications in Node.js!
