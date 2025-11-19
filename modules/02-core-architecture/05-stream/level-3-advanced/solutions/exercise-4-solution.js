/**
 * Solution: Exercise 4 - Stream Testing Framework
 * =================================================
 * Comprehensive testing utilities for streams
 */

const { Transform, Readable, Writable } = require('stream');
const assert = require('assert');

class StreamTestFramework {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log(`Running ${this.tests.length} tests...\n`);

    for (const test of this.tests) {
      const startTime = Date.now();
      try {
        await test.testFn(this);
        const duration = Date.now() - startTime;
        this.results.push({ name: test.name, passed: true, duration });
        console.log(`✓ ${test.name} (${duration}ms)`);
      } catch (err) {
        const duration = Date.now() - startTime;
        this.results.push({ name: test.name, passed: false, duration, error: err.message });
        console.log(`✗ ${test.name} (${duration}ms)`);
        console.log(`  Error: ${err.message}`);
      }
    }

    this.generateReport();
  }

  async collectStream(stream) {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return chunks;
  }

  async expectError(stream, expectedMessage) {
    try {
      for await (const _ of stream) {}
      throw new Error('Expected stream to error');
    } catch (err) {
      if (err.message === 'Expected stream to error') throw err;
      if (expectedMessage && err.message !== expectedMessage) {
        throw new Error(`Expected "${expectedMessage}" but got "${err.message}"`);
      }
    }
  }

  async measureThroughput(stream, dataGenerator) {
    const startTime = Date.now();
    let count = 0;

    for await (const _ of stream) {
      count++;
    }

    const duration = (Date.now() - startTime) / 1000;
    return count / duration;
  }

  createMockReadable(data, options = {}) {
    return Readable.from(data);
  }

  createMockWritable(options = {}) {
    const data = [];
    const writable = new Writable({
      objectMode: true,
      write(chunk, encoding, callback) {
        data.push(chunk);
        callback();
      }
    });
    writable.getData = () => data;
    return writable;
  }

  async assertStreamOutput(stream, expected) {
    const output = await this.collectStream(stream);
    assert.deepEqual(output, expected);
  }

  async assertStreamError(stream, errorMessage) {
    await this.expectError(stream, errorMessage);
  }

  async assertThroughput(stream, dataGenerator, minThroughput) {
    const throughput = await this.measureThroughput(stream, dataGenerator);
    assert.ok(throughput >= minThroughput, `Throughput ${throughput} < ${minThroughput}`);
  }

  generateReport() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n=== Test Results ===');
    console.log(`Total: ${this.tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Duration: ${totalDuration}ms`);

    if (failed === 0) {
      console.log('\n✓ All tests passed!');
    }
  }
}

// Example tests
class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    callback(null, chunk.toString().toUpperCase());
  }
}

async function runTests() {
  const framework = new StreamTestFramework();

  framework.test('Should transform to uppercase', async (helpers) => {
    const input = Readable.from(['hello', 'world']);
    const transform = new UpperCaseTransform();
    const output = await helpers.collectStream(input.pipe(transform));
    assert.deepEqual(output, ['HELLO', 'WORLD']);
  });

  framework.test('Should handle empty stream', async (helpers) => {
    const input = Readable.from([]);
    const transform = new UpperCaseTransform();
    const output = await helpers.collectStream(input.pipe(transform));
    assert.equal(output.length, 0);
  });

  await framework.run();
}

runTests();
