/**
 * 06-testing-streams.js
 * ======================
 * Demonstrates comprehensive stream testing strategies
 *
 * Key Concepts:
 * - Unit testing streams
 * - Integration testing
 * - Error testing
 * - Backpressure testing
 * - Performance testing
 * - Test helpers and utilities
 *
 * Run: node 06-testing-streams.js
 * Note: This example uses built-in assert, not a test framework
 */

const { Transform, Readable, Writable, pipeline } = require('stream');
const assert = require('assert');

console.log('=== Stream Testing Examples ===\n');

// =============================================================================
// Test Helpers
// =============================================================================

// Helper: Collect all stream data
async function collectStream(stream) {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return chunks;
}

// Helper: Count stream items
async function countStream(stream) {
  let count = 0;

  for await (const _ of stream) {
    count++;
  }

  return count;
}

// Helper: Stream from array
function streamFrom(array) {
  return Readable.from(array);
}

// Helper: Expect stream error
async function expectStreamError(stream, expectedMessage) {
  try {
    for await (const _ of stream) {
      // Drain stream
    }
    throw new Error('Expected stream to error but it succeeded');
  } catch (err) {
    if (err.message === 'Expected stream to error but it succeeded') {
      throw err;
    }
    if (expectedMessage && err.message !== expectedMessage) {
      throw new Error(`Expected error "${expectedMessage}" but got "${err.message}"`);
    }
    // Error as expected
  }
}

// =============================================================================
// Example 1: Basic Functionality Testing
// =============================================================================

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  }
}

async function example1() {
  console.log('--- Example 1: Basic Functionality Testing ---\n');

  // Test 1: Transform correctness
  console.log('Test 1: Should transform to uppercase');
  const input = ['hello', 'world'];
  const expected = ['HELLO', 'WORLD'];

  const transform = new UpperCaseTransform();
  const output = await collectStream(streamFrom(input).pipe(transform));

  assert.deepEqual(output, expected);
  console.log('  ✓ Transform produces correct output');

  // Test 2: Empty stream
  console.log('\nTest 2: Should handle empty stream');
  const emptyTransform = new UpperCaseTransform();
  const emptyOutput = await collectStream(streamFrom([]).pipe(emptyTransform));

  assert.equal(emptyOutput.length, 0);
  console.log('  ✓ Handles empty stream correctly');

  // Test 3: Single item
  console.log('\nTest 3: Should handle single item');
  const singleTransform = new UpperCaseTransform();
  const singleOutput = await collectStream(streamFrom(['test']).pipe(singleTransform));

  assert.deepEqual(singleOutput, ['TEST']);
  console.log('  ✓ Handles single item correctly');

  console.log('\n✓ Example 1 complete\n');
  example2();
}

// =============================================================================
// Example 2: Error Handling Testing
// =============================================================================

class ValidatingTransform extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
  }

  _transform(item, encoding, callback) {
    if (!item || typeof item.value !== 'number') {
      callback(new Error('Invalid item: value must be a number'));
      return;
    }

    if (item.value < 0) {
      callback(new Error('Invalid item: value must be positive'));
      return;
    }

    callback(null, item);
  }
}

async function example2() {
  console.log('--- Example 2: Error Handling Testing ---\n');

  // Test 1: Valid data passes through
  console.log('Test 1: Should pass valid data');
  const validData = [{ value: 1 }, { value: 2 }, { value: 3 }];
  const validTransform = new ValidatingTransform();
  const validOutput = await collectStream(streamFrom(validData).pipe(validTransform));

  assert.equal(validOutput.length, 3);
  console.log('  ✓ Valid data passes through');

  // Test 2: Invalid data triggers error
  console.log('\nTest 2: Should reject invalid data');
  const invalidData = [{ value: 'not a number' }];
  const invalidTransform = new ValidatingTransform();

  await expectStreamError(
    streamFrom(invalidData).pipe(invalidTransform),
    'Invalid item: value must be a number'
  );
  console.log('  ✓ Rejects invalid data with correct error');

  // Test 3: Negative values trigger error
  console.log('\nTest 3: Should reject negative values');
  const negativeData = [{ value: -5 }];
  const negativeTransform = new ValidatingTransform();

  await expectStreamError(
    streamFrom(negativeData).pipe(negativeTransform),
    'Invalid item: value must be positive'
  );
  console.log('  ✓ Rejects negative values');

  console.log('\n✓ Example 2 complete\n');
  example3();
}

// =============================================================================
// Example 3: Backpressure Testing
// =============================================================================

class BackpressureTestTransform extends Transform {
  constructor(options) {
    super(options);
    this.backpressureCount = 0;
    this.pushCount = 0;
  }

  _transform(chunk, encoding, callback) {
    this.pushCount++;

    const canContinue = this.push(chunk);

    if (!canContinue) {
      this.backpressureCount++;
    }

    callback();
  }

  getStats() {
    return {
      pushCount: this.pushCount,
      backpressureCount: this.backpressureCount,
      backpressureRate: (this.backpressureCount / this.pushCount * 100).toFixed(2) + '%'
    };
  }
}

async function example3() {
  console.log('--- Example 3: Backpressure Testing ---\n');

  // Test: Backpressure with slow consumer
  console.log('Test: Should detect backpressure with slow consumer');

  const transform = new BackpressureTestTransform({ highWaterMark: 16 });

  // Fast producer
  const producer = new Readable({
    read() {
      for (let i = 0; i < 1000; i++) {
        if (!this.push(Buffer.alloc(1024))) {
          break;
        }
      }
      this.push(null);
    }
  });

  // Slow consumer
  const consumer = new Writable({
    highWaterMark: 16,
    write(chunk, encoding, callback) {
      setImmediate(callback);
    }
  });

  await new Promise((resolve, reject) => {
    pipeline(producer, transform, consumer, (err) => {
      if (err) {
        reject(err);
      } else {
        const stats = transform.getStats();

        console.log('\n  Backpressure statistics:');
        console.log(`    Push count: ${stats.pushCount}`);
        console.log(`    Backpressure events: ${stats.backpressureCount}`);
        console.log(`    Backpressure rate: ${stats.backpressureRate}`);

        assert.ok(stats.backpressureCount > 0, 'Should detect backpressure');
        console.log('\n  ✓ Backpressure detected correctly');

        resolve();
      }
    });
  });

  console.log('\n✓ Example 3 complete\n');
  example4();
}

// =============================================================================
// Example 4: Performance Testing
// =============================================================================

async function benchmark(name, streamFactory, iterations = 3) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();

    await new Promise((resolve, reject) => {
      const stream = streamFactory();
      stream.on('end', resolve);
      stream.on('error', reject);
      stream.resume();
    });

    times.push(Date.now() - start);
  }

  const avg = times.reduce((a, b) => a + b) / times.length;

  return { name, avg, times };
}

async function example4() {
  console.log('--- Example 4: Performance Testing ---\n');

  console.log('Benchmarking different buffer sizes:\n');

  // Test different highWaterMark values
  const results = [];

  results.push(await benchmark('Small Buffer (1KB)', () => {
    return new Readable({
      highWaterMark: 1024,
      read() {
        for (let i = 0; i < 1000; i++) {
          if (!this.push(Buffer.alloc(1024))) break;
        }
        this.push(null);
      }
    });
  }));

  results.push(await benchmark('Large Buffer (64KB)', () => {
    return new Readable({
      highWaterMark: 64 * 1024,
      read() {
        for (let i = 0; i < 1000; i++) {
          if (!this.push(Buffer.alloc(1024))) break;
        }
        this.push(null);
      }
    });
  }));

  // Display results
  console.log('Results:');
  results.forEach(result => {
    console.log(`  ${result.name}: ${result.avg.toFixed(2)}ms`);
  });

  // Compare
  const faster = results[0].avg < results[1].avg ? results[0] : results[1];
  const slower = results[0].avg < results[1].avg ? results[1] : results[0];
  const improvement = ((slower.avg - faster.avg) / slower.avg * 100).toFixed(2);

  console.log(`\n  ${faster.name} is ${improvement}% faster`);

  console.log('\n✓ Example 4 complete\n');
  example5();
}

// =============================================================================
// Example 5: Integration Testing
// =============================================================================

class Pipeline {
  static create() {
    const parse = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        try {
          const data = JSON.parse(chunk);
          callback(null, data);
        } catch (err) {
          callback(err);
        }
      }
    });

    const validate = new Transform({
      objectMode: true,
      transform(item, encoding, callback) {
        if (item.value >= 0) {
          callback(null, item);
        } else {
          callback(new Error('Invalid value'));
        }
      }
    });

    const format = new Transform({
      objectMode: true,
      transform(item, encoding, callback) {
        callback(null, `ID: ${item.id}, Value: ${item.value}\n`);
      }
    });

    return { parse, validate, format };
  }
}

async function example5() {
  console.log('--- Example 5: Integration Testing ---\n');

  // Test: Full pipeline
  console.log('Test: Should process valid data through pipeline');

  const { parse, validate, format } = Pipeline.create();

  const input = [
    JSON.stringify({ id: 1, value: 10 }),
    JSON.stringify({ id: 2, value: 20 }),
    JSON.stringify({ id: 3, value: 30 })
  ];

  const expected = [
    'ID: 1, Value: 10\n',
    'ID: 2, Value: 20\n',
    'ID: 3, Value: 30\n'
  ];

  const output = await collectStream(
    streamFrom(input).pipe(parse).pipe(validate).pipe(format)
  );

  assert.deepEqual(output, expected);
  console.log('  ✓ Pipeline processes data correctly');

  // Test: Pipeline error handling
  console.log('\nTest: Should handle errors in pipeline');

  const { parse: parse2, validate: validate2, format: format2 } = Pipeline.create();

  const invalidInput = [JSON.stringify({ id: 1, value: -5 })];

  await expectStreamError(
    streamFrom(invalidInput).pipe(parse2).pipe(validate2).pipe(format2),
    'Invalid value'
  );
  console.log('  ✓ Pipeline handles errors correctly');

  console.log('\n✓ Example 5 complete\n');
  showSummary();
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('=== Stream Testing Summary ===\n');
  console.log('Testing Strategies:');
  console.log('1. Functionality - Test correct data transformation');
  console.log('2. Error Handling - Verify errors are caught and handled');
  console.log('3. Backpressure - Ensure flow control works');
  console.log('4. Performance - Benchmark and optimize');
  console.log('5. Integration - Test complete pipelines');
  console.log('\nTest Helpers:');
  console.log('- collectStream() - Gather all output');
  console.log('- countStream() - Count items');
  console.log('- streamFrom() - Create test input');
  console.log('- expectStreamError() - Verify errors');
  console.log('\nBest Practices:');
  console.log('- Test happy path and error cases');
  console.log('- Test edge cases (empty, single item, large data)');
  console.log('- Verify backpressure handling');
  console.log('- Benchmark performance improvements');
  console.log('- Test complete pipelines, not just units');
  console.log('\n✓ All testing examples completed!\n');
}

// Start examples
example1();
