# Testing Streams

## Introduction

This guide covers comprehensive testing strategies for Node.js streams. You'll learn how to write unit tests, integration tests, property-based tests, and how to test error conditions, backpressure, and edge cases.

By the end, you'll be able to build robust, well-tested streaming applications with confidence.

---

## Testing Fundamentals

### Why Test Streams?

Streams are complex and have many failure modes:

```javascript
// Things that can go wrong:
const failures = {
  data: 'Wrong data transformation',
  errors: 'Unhandled errors',
  backpressure: 'Memory leaks from ignored backpressure',
  cleanup: 'Resource leaks (file handles, sockets)',
  edge: 'Empty streams, single item, huge items',
  timing: 'Race conditions, async issues',
  state: 'Incorrect stream state transitions'
};
```

**Testing helps ensure:**
1. Correct data transformation
2. Proper error handling
3. No resource leaks
4. Good performance
5. Edge case handling

---

## Unit Testing Streams

### Basic Stream Testing

```javascript
const { Readable, Transform, Writable } = require('stream');
const assert = require('assert');

describe('MyTransform', () => {
  it('should transform data correctly', (done) => {
    const transform = new MyTransform();
    const input = ['a', 'b', 'c'];
    const expected = ['A', 'B', 'C'];
    const output = [];

    transform.on('data', (chunk) => {
      output.push(chunk.toString());
    });

    transform.on('end', () => {
      assert.deepEqual(output, expected);
      done();
    });

    transform.on('error', done);

    // Write input
    input.forEach(item => transform.write(item));
    transform.end();
  });
});
```

### Using async/await

```javascript
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

async function testStream(transform, input, expected) {
  const source = Readable.from(input);
  const output = [];

  const collector = new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      output.push(chunk);
      callback();
    }
  });

  await pipelineAsync(source, transform, collector);

  assert.deepEqual(output, expected);
}

// Usage
describe('MyTransform', () => {
  it('should transform correctly', async () => {
    const transform = new MyTransform();
    await testStream(transform, [1, 2, 3], [2, 4, 6]);
  });
});
```

### Testing with for await

```javascript
async function testStreamAsync(stream, expected) {
  const output = [];

  for await (const chunk of stream) {
    output.push(chunk);
  }

  assert.deepEqual(output, expected);
}

// Usage
it('should produce correct output', async () => {
  const stream = new MyReadable();
  await testStreamAsync(stream, [1, 2, 3, 4, 5]);
});
```

---

## Testing Error Handling

### Testing Error Emission

```javascript
describe('Error handling', () => {
  it('should emit error on invalid input', (done) => {
    const transform = new MyTransform();

    transform.on('error', (err) => {
      assert.ok(err);
      assert.equal(err.message, 'Invalid input');
      done();
    });

    transform.write('invalid');
  });

  it('should handle async errors', async () => {
    const transform = new MyAsyncTransform();

    // Use assert.rejects for async errors
    await assert.rejects(
      async () => {
        transform.write('bad data');
        await new Promise((resolve, reject) => {
          transform.on('error', reject);
          transform.on('finish', resolve);
          transform.end();
        });
      },
      {
        name: 'Error',
        message: 'Processing failed'
      }
    );
  });
});
```

### Testing Error Propagation

```javascript
const { pipeline } = require('stream');

describe('Pipeline error propagation', () => {
  it('should propagate errors through pipeline', (done) => {
    const source = new Readable({
      read() {
        this.push('data');
        this.push(null);
      }
    });

    const faultyTransform = new Transform({
      transform(chunk, encoding, callback) {
        callback(new Error('Transform error'));
      }
    });

    const destination = new Writable({
      write(chunk, encoding, callback) {
        callback();
      }
    });

    pipeline(source, faultyTransform, destination, (err) => {
      assert.ok(err);
      assert.equal(err.message, 'Transform error');
      done();
    });
  });
});
```

### Testing Error Recovery

```javascript
describe('Error recovery', () => {
  it('should retry on transient errors', async () => {
    let attempts = 0;

    const flakyTransform = new Transform({
      objectMode: true,
      async transform(chunk, encoding, callback) {
        attempts++;

        if (attempts < 3) {
          callback(new Error('Transient error'));
        } else {
          callback(null, chunk);
        }
      }
    });

    const retryTransform = new RetryTransform(flakyTransform, 3);

    const input = [1];
    const output = await testStream(retryTransform, input, input);

    assert.equal(attempts, 3);
  });
});
```

---

## Testing Backpressure

### Detecting Backpressure Issues

```javascript
describe('Backpressure', () => {
  it('should respect backpressure', (done) => {
    let backpressureDetected = false;

    const slowConsumer = new Writable({
      highWaterMark: 1, // Small buffer
      write(chunk, encoding, callback) {
        // Slow consumption
        setTimeout(callback, 100);
      }
    });

    const fastProducer = new Readable({
      read() {
        for (let i = 0; i < 100; i++) {
          const canContinue = this.push(`chunk ${i}\n`);

          if (!canContinue) {
            backpressureDetected = true;
            break;
          }
        }
      }
    });

    slowConsumer.on('finish', () => {
      assert.ok(backpressureDetected, 'Backpressure should be detected');
      done();
    });

    fastProducer.pipe(slowConsumer);
  });
});
```

### Testing Memory Usage

```javascript
describe('Memory efficiency', () => {
  it('should not leak memory under backpressure', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    const largeDataStream = new Readable({
      read() {
        // Generate large chunks
        for (let i = 0; i < 1000; i++) {
          if (!this.push(Buffer.alloc(1024 * 1024))) {
            // Backpressure - stop generating
            break;
          }
        }
      }
    });

    const slowProcessor = new Transform({
      async transform(chunk, encoding, callback) {
        await new Promise(resolve => setTimeout(resolve, 10));
        callback(null, chunk);
      }
    });

    await pipelineAsync(
      largeDataStream,
      slowProcessor,
      new Writable({ write(chunk, encoding, cb) { cb(); } })
    );

    global.gc(); // Force GC if --expose-gc flag used

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;

    // Memory growth should be reasonable
    assert.ok(memoryGrowth < 100 * 1024 * 1024, 'Memory leak detected');
  });
});
```

---

## Testing Edge Cases

### Empty Streams

```javascript
describe('Edge cases', () => {
  it('should handle empty stream', async () => {
    const transform = new MyTransform();
    const empty = Readable.from([]);

    const output = [];
    for await (const chunk of empty.pipe(transform)) {
      output.push(chunk);
    }

    assert.equal(output.length, 0);
  });

  it('should emit end event for empty stream', (done) => {
    const transform = new MyTransform();

    transform.on('end', () => {
      done();
    });

    transform.end(); // No data written
  });
});
```

### Single Item

```javascript
describe('Single item', () => {
  it('should handle single chunk', async () => {
    const transform = new MyTransform();
    await testStream(transform, ['single'], ['SINGLE']);
  });
});
```

### Large Items

```javascript
describe('Large items', () => {
  it('should handle very large chunks', async () => {
    const largeChunk = Buffer.alloc(10 * 1024 * 1024); // 10 MB
    const transform = new MyTransform();

    const output = [];
    transform.on('data', chunk => output.push(chunk));

    transform.write(largeChunk);
    transform.end();

    await new Promise(resolve => transform.on('end', resolve));

    assert.equal(output.length, 1);
    assert.equal(output[0].length, largeChunk.length);
  });
});
```

### Rapid Start/Stop

```javascript
describe('Start/Stop', () => {
  it('should handle immediate destruction', (done) => {
    const stream = new MyReadable();

    stream.on('close', () => {
      done();
    });

    stream.destroy(); // Destroy immediately
  });

  it('should handle pause/resume cycles', (done) => {
    const source = Readable.from([1, 2, 3, 4, 5]);
    const chunks = [];

    source.on('data', (chunk) => {
      chunks.push(chunk);

      // Pause after each chunk
      source.pause();

      setTimeout(() => {
        source.resume();
      }, 10);
    });

    source.on('end', () => {
      assert.equal(chunks.length, 5);
      done();
    });
  });
});
```

---

## Integration Testing

### Testing Complete Pipelines

```javascript
describe('Full pipeline', () => {
  it('should process file end-to-end', async () => {
    const fs = require('fs');
    const { promisify } = require('util');

    const readFile = promisify(fs.readFile);

    // Create test input file
    fs.writeFileSync('/tmp/test-input.txt', 'test data');

    await pipelineAsync(
      fs.createReadStream('/tmp/test-input.txt'),
      new MyTransform(),
      fs.createWriteStream('/tmp/test-output.txt')
    );

    const output = await readFile('/tmp/test-output.txt', 'utf8');
    assert.equal(output, 'TEST DATA');

    // Cleanup
    fs.unlinkSync('/tmp/test-input.txt');
    fs.unlinkSync('/tmp/test-output.txt');
  });
});
```

### Testing with Mock Streams

```javascript
class MockReadable extends Readable {
  constructor(data, options) {
    super(options);
    this.data = data;
    this.index = 0;
  }

  _read() {
    if (this.index < this.data.length) {
      this.push(this.data[this.index++]);
    } else {
      this.push(null);
    }
  }
}

class MockWritable extends Writable {
  constructor(options) {
    super(options);
    this.data = [];
  }

  _write(chunk, encoding, callback) {
    this.data.push(chunk);
    callback();
  }

  getData() {
    return this.data;
  }
}

// Usage
describe('Pipeline with mocks', () => {
  it('should process data correctly', async () => {
    const source = new MockReadable(['a', 'b', 'c']);
    const destination = new MockWritable();
    const transform = new MyTransform();

    await pipelineAsync(source, transform, destination);

    const output = destination.getData();
    assert.deepEqual(output, ['A', 'B', 'C']);
  });
});
```

---

## Property-Based Testing

### Using fast-check

```javascript
const fc = require('fast-check');

describe('Property-based tests', () => {
  it('should preserve data count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string()),
        async (input) => {
          const transform = new MyTransform();
          const output = [];

          for await (const chunk of Readable.from(input).pipe(transform)) {
            output.push(chunk);
          }

          assert.equal(output.length, input.length);
        }
      )
    );
  });

  it('should be deterministic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer()),
        async (input) => {
          const run1 = await testStream(new MyTransform(), input);
          const run2 = await testStream(new MyTransform(), input);

          assert.deepEqual(run1, run2);
        }
      )
    );
  });
});
```

---

## Performance Testing

### Benchmarking Streams

```javascript
const { performance } = require('perf_hooks');

describe('Performance', () => {
  it('should process 1M items in reasonable time', async () => {
    const itemCount = 1000000;
    const source = Readable.from(
      (function* () {
        for (let i = 0; i < itemCount; i++) {
          yield i;
        }
      })()
    );

    const transform = new MyTransform();
    let processed = 0;

    const destination = new Writable({
      objectMode: true,
      write(chunk, encoding, callback) {
        processed++;
        callback();
      }
    });

    const start = performance.now();

    await pipelineAsync(source, transform, destination);

    const duration = performance.now() - start;
    const throughput = itemCount / duration * 1000;

    console.log(`Processed ${itemCount} items in ${duration.toFixed(2)}ms`);
    console.log(`Throughput: ${throughput.toFixed(0)} items/sec`);

    assert.ok(throughput > 10000, 'Throughput too low');
  });
});
```

### Memory Profiling

```javascript
describe('Memory profile', () => {
  it('should maintain stable memory usage', async () => {
    const measurements = [];

    const source = Readable.from(
      (function* () {
        for (let i = 0; i < 100000; i++) {
          yield Buffer.alloc(1024);
        }
      })()
    );

    const transform = new MyTransform();

    const destination = new Writable({
      write(chunk, encoding, callback) {
        if (Math.random() < 0.01) {
          measurements.push(process.memoryUsage().heapUsed);
        }
        callback();
      }
    });

    await pipelineAsync(source, transform, destination);

    // Check memory didn't grow unbounded
    const avgMemory = measurements.reduce((a, b) => a + b) / measurements.length;
    const maxMemory = Math.max(...measurements);

    const memoryGrowth = (maxMemory - measurements[0]) / measurements[0];

    assert.ok(memoryGrowth < 2, 'Memory grew too much (> 2x)');
  });
});
```

---

## Testing Best Practices

### Test Helper Functions

```javascript
// Helper: Collect stream output
async function collectStream(stream) {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return chunks;
}

// Helper: Stream from array
function streamFrom(array) {
  return Readable.from(array);
}

// Helper: Count stream items
async function countStream(stream) {
  let count = 0;

  for await (const _ of stream) {
    count++;
  }

  return count;
}

// Helper: Verify stream error
async function expectStreamError(stream, errorMessage) {
  try {
    for await (const _ of stream) {
      // Drain stream
    }
    throw new Error('Expected stream to error');
  } catch (err) {
    assert.equal(err.message, errorMessage);
  }
}

// Usage
describe('Using helpers', () => {
  it('should transform correctly', async () => {
    const transform = new MyTransform();
    const input = streamFrom([1, 2, 3]);
    const output = await collectStream(input.pipe(transform));

    assert.deepEqual(output, [2, 4, 6]);
  });

  it('should handle errors', async () => {
    const stream = new FaultyStream();
    await expectStreamError(stream, 'Processing failed');
  });
});
```

### Fixtures and Factories

```javascript
// Test data factory
class StreamTestFactory {
  static createNumberStream(count) {
    return Readable.from(
      (function* () {
        for (let i = 0; i < count; i++) {
          yield i;
        }
      })()
    );
  }

  static createErrorStream(errorAfter) {
    let count = 0;

    return new Readable({
      read() {
        if (count++ < errorAfter) {
          this.push(`chunk ${count}`);
        } else {
          this.destroy(new Error('Test error'));
        }
      }
    });
  }

  static createSlowStream(data, delayMs) {
    let index = 0;

    return new Readable({
      async read() {
        if (index < data.length) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          this.push(data[index++]);
        } else {
          this.push(null);
        }
      }
    });
  }
}

// Usage
describe('Using factory', () => {
  it('should handle 1000 numbers', async () => {
    const stream = StreamTestFactory.createNumberStream(1000);
    const count = await countStream(stream);
    assert.equal(count, 1000);
  });

  it('should handle errors gracefully', async () => {
    const stream = StreamTestFactory.createErrorStream(5);
    await expectStreamError(stream, 'Test error');
  });
});
```

---

## Testing Checklist

### What to Test

- [ ] **Basic functionality** - correct transformation
- [ ] **Error handling** - errors are caught and handled
- [ ] **Error propagation** - errors flow through pipeline
- [ ] **Backpressure** - respects flow control
- [ ] **Empty input** - handles empty streams
- [ ] **Single item** - works with one chunk
- [ ] **Large items** - handles big chunks
- [ ] **Memory usage** - no leaks under load
- [ ] **Performance** - meets throughput requirements
- [ ] **State transitions** - handles pause/resume/destroy
- [ ] **Cleanup** - resources are released
- [ ] **Edge cases** - boundary conditions

### Test Organization

```javascript
describe('MyStream', () => {
  describe('Functionality', () => {
    it('should transform data correctly');
    it('should preserve data count');
    it('should handle different data types');
  });

  describe('Error Handling', () => {
    it('should emit errors on invalid input');
    it('should propagate errors in pipeline');
    it('should cleanup on error');
  });

  describe('Performance', () => {
    it('should handle backpressure');
    it('should not leak memory');
    it('should meet throughput requirements');
  });

  describe('Edge Cases', () => {
    it('should handle empty stream');
    it('should handle single item');
    it('should handle large items');
  });
});
```

---

## Summary

### Testing Strategy

1. **Unit tests** - test streams in isolation
2. **Integration tests** - test complete pipelines
3. **Property tests** - verify invariants
4. **Performance tests** - measure throughput and memory
5. **Edge case tests** - handle boundaries

### Key Testing Patterns

| Pattern | Purpose | Example |
|---------|---------|---------|
| Mock streams | Controlled input/output | MockReadable, MockWritable |
| Collect helper | Gather output | `await collectStream(stream)` |
| Error injection | Test error handling | `createErrorStream(5)` |
| Async testing | Handle promises | `async/await`, `for await` |
| Property-based | Find edge cases | fast-check |

### Next Steps

1. Study [Security Best Practices](./05-security-best-practices.md)
2. Review [testing example](../examples/06-testing-streams.js)
3. Practice with [testing framework exercise](../exercises/exercise-4.js)

---

## Quick Reference

```javascript
// Basic test pattern
it('should work', async () => {
  const input = [1, 2, 3];
  const expected = [2, 4, 6];
  const stream = new MyTransform();

  const output = [];
  for await (const chunk of Readable.from(input).pipe(stream)) {
    output.push(chunk);
  }

  assert.deepEqual(output, expected);
});

// Error testing
it('should handle errors', async () => {
  await assert.rejects(
    () => processStream(badInput),
    { message: 'Expected error' }
  );
});

// Pipeline testing
it('should pipeline correctly', async () => {
  await pipeline(source, transform, dest);
  assert.equal(dest.getData(), expectedData);
});
```

Ready for security? Continue to [Security Best Practices](./05-security-best-practices.md)!
