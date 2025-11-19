/**
 * 08-stream-utilities.js
 * =======================
 * Demonstrates Node.js stream utility functions
 *
 * Key Concepts:
 * - pipeline() for robust composition
 * - finished() for cleanup
 * - Readable.from() for easy creation
 * - stream.compose() for reusable pipelines
 * - Promise-based stream handling
 *
 * Run: node 08-stream-utilities.js
 */

const { Readable, Writable, Transform, pipeline, finished } = require('stream');
const { promisify } = require('util');
const pipelinePromise = promisify(pipeline);
const finishedPromise = promisify(finished);

console.log('=== Stream Utilities Examples ===\n');

// =============================================================================
// Example 1: pipeline() for Error Handling
// =============================================================================

console.log('--- Example 1: pipeline() for Error Handling ---\n');

class FailingTransform extends Transform {
  constructor(failAt, options) {
    super(options);
    this.failAt = failAt;
    this.count = 0;
  }

  _transform(chunk, encoding, callback) {
    this.count++;

    if (this.count === this.failAt) {
      callback(new Error(`Failed at chunk ${this.count}`));
    } else {
      this.push(chunk);
      callback();
    }
  }
}

// Without pipeline - errors not handled well
const source1 = Readable.from(['a', 'b', 'c', 'd', 'e']);
const transform1 = new FailingTransform(3);
const dest1 = new Writable({
  write(chunk, encoding, callback) {
    callback();
  }
});

source1.pipe(transform1).pipe(dest1);

transform1.on('error', (err) => {
  console.log('  ❌ Transform error (not propagated):', err.message);
  console.log('  Problem: Source and dest don\'t know about error!\n');
  example1b();
});

function example1b() {
  console.log('With pipeline() - proper error handling:\n');

  const source2 = Readable.from(['a', 'b', 'c', 'd', 'e']);
  const transform2 = new FailingTransform(3);
  const dest2 = new Writable({
    write(chunk, encoding, callback) {
      console.log(`  Processed: ${chunk}`);
      callback();
    }
  });

  pipeline(
    source2,
    transform2,
    dest2,
    (err) => {
      if (err) {
        console.log(`  ✓ Pipeline error caught: ${err.message}`);
        console.log('  All streams properly cleaned up\n');
      }
      example2();
    }
  );
}

// =============================================================================
// Example 2: finished() for Cleanup
// =============================================================================

async function example2() {
  console.log('--- Example 2: finished() for Cleanup ---\n');

  const stream = Readable.from(['line 1\n', 'line 2\n', 'line 3\n']);

  // Set up cleanup
  finished(stream, (err) => {
    if (err) {
      console.log('  Stream ended with error:', err.message);
    } else {
      console.log('  ✓ Stream ended successfully');
    }

    console.log('  Cleanup: Closing connections, releasing resources\n');
  });

  // Consume stream
  stream.on('data', (chunk) => {
    process.stdout.write(`  ${chunk}`);
  });

  stream.on('end', () => {
    setTimeout(example3, 100);
  });
}

// =============================================================================
// Example 3: Readable.from() for Easy Creation
// =============================================================================

function example3() {
  console.log('--- Example 3: Readable.from() ---\n');

  // From array
  const fromArray = Readable.from([1, 2, 3, 4, 5]);
  console.log('  From array:');

  fromArray.on('data', (chunk) => {
    console.log(`    ${chunk}`);
  });

  fromArray.on('end', () => {
    console.log();
    example3b();
  });
}

function example3b() {
  // From async generator
  async function* generate() {
    for (let i = 1; i <= 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      yield `Generated ${i}`;
    }
  }

  const fromGenerator = Readable.from(generate());
  console.log('  From async generator:');

  fromGenerator.on('data', (chunk) => {
    console.log(`    ${chunk}`);
  });

  fromGenerator.on('end', () => {
    console.log();
    example3c();
  });
}

function example3c() {
  // From iterable
  const iterable = {
    [Symbol.iterator]() {
      let i = 0;
      return {
        next() {
          if (i < 5) {
            return { value: `Item ${++i}`, done: false };
          }
          return { done: true };
        }
      };
    }
  };

  const fromIterable = Readable.from(iterable);
  console.log('  From iterable:');

  fromIterable.on('data', (chunk) => {
    console.log(`    ${chunk}`);
  });

  fromIterable.on('end', () => {
    console.log('\n✓ Readable.from() examples complete\n');
    example4();
  });
}

// =============================================================================
// Example 4: Promise-based pipeline()
// =============================================================================

async function example4() {
  console.log('--- Example 4: Promise-based pipeline() ---\n');

  const source = Readable.from(['Hello', 'World', 'from', 'Node.js']);

  const upper = new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk.toString().toUpperCase() + '\n');
    }
  });

  const logger = new Writable({
    write(chunk, encoding, callback) {
      process.stdout.write(`  ${chunk}`);
      callback();
    }
  });

  try {
    await pipelinePromise(source, upper, logger);
    console.log('✓ Promise pipeline completed\n');
  } catch (err) {
    console.error('Pipeline error:', err.message);
  }

  example5();
}

// =============================================================================
// Example 5: stream.compose() for Reusable Pipelines
// =============================================================================

async function example5() {
  console.log('--- Example 5: Composing Streams (Node 16.9+) ---\n');

  // Note: stream.compose() requires Node.js 16.9+
  // Showing pattern with manual composition

  function createUpperCaseTransform() {
    return new Transform({
      transform(chunk, encoding, callback) {
        callback(null, chunk.toString().toUpperCase());
      }
    });
  }

  function createPrefixTransform(prefix) {
    return new Transform({
      transform(chunk, encoding, callback) {
        callback(null, prefix + chunk);
      }
    });
  }

  // Compose transforms
  const source = Readable.from(['hello\n', 'world\n']);

  await pipelinePromise(
    source,
    createUpperCaseTransform(),
    createPrefixTransform('>>> '),
    process.stdout
  );

  console.log('✓ Composed pipeline complete\n');
  example6();
}

// =============================================================================
// Example 6: Combining Utilities
// =============================================================================

async function example6() {
  console.log('--- Example 6: Combining Utilities ---\n');

  // Create a complete data processing pipeline

  async function* generateData() {
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 20));
      yield { id: i, value: Math.random() * 100 };
    }
  }

  const filter = new Transform({
    objectMode: true,
    transform(obj, encoding, callback) {
      if (obj.value > 50) {
        callback(null, obj);
      } else {
        callback();
      }
    }
  });

  const formatter = new Transform({
    objectMode: true,
    writableObjectMode: true,
    readableObjectMode: false,
    transform(obj, encoding, callback) {
      const line = `ID: ${obj.id}, Value: ${obj.value.toFixed(2)}\n`;
      callback(null, line);
    }
  });

  const collector = new Writable({
    write(chunk, encoding, callback) {
      process.stdout.write(`  ${chunk}`);
      callback();
    }
  });

  // Set up cleanup
  finishedPromise(collector).then(() => {
    console.log('\n✓ Stream finished, resources released\n');
    example7();
  });

  // Run pipeline
  try {
    await pipelinePromise(
      Readable.from(generateData()),
      filter,
      formatter,
      collector
    );
  } catch (err) {
    console.error('Pipeline error:', err.message);
  }
}

// =============================================================================
// Example 7: Error Recovery Pattern
// =============================================================================

async function example7() {
  console.log('--- Example 7: Error Recovery Pattern ---\n');

  async function runPipelineWithRetry(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`  Attempt ${attempt}...`);

        const source = Readable.from(['data1', 'data2', 'data3']);

        // Transform that might fail
        const transform = new Transform({
          transform(chunk, encoding, callback) {
            // Simulate random failure
            if (Math.random() < 0.5) {
              callback(new Error('Random failure'));
            } else {
              callback(null, chunk.toString().toUpperCase() + '\n');
            }
          }
        });

        const dest = new Writable({
          write(chunk, encoding, callback) {
            process.stdout.write(`    ${chunk}`);
            callback();
          }
        });

        await pipelinePromise(source, transform, dest);

        console.log('  ✓ Pipeline succeeded\n');
        return;
      } catch (err) {
        console.log(`  ✗ Attempt ${attempt} failed: ${err.message}`);

        if (attempt === maxRetries) {
          console.log('  ✗ All retries exhausted\n');
          throw err;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  try {
    await runPipelineWithRetry();
  } catch (err) {
    console.log('Final error:', err.message);
  }

  showSummary();
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('\n=== Summary ===\n');
  console.log('Utility Functions:');
  console.log('1. pipeline() - Robust stream composition');
  console.log('   • Automatic error handling');
  console.log('   • Proper cleanup on errors');
  console.log('   • Callback or Promise-based');
  console.log();
  console.log('2. finished() - Stream completion detection');
  console.log('   • Know when stream is done');
  console.log('   • Clean up resources');
  console.log('   • Handle errors');
  console.log();
  console.log('3. Readable.from() - Easy stream creation');
  console.log('   • From arrays');
  console.log('   • From iterables');
  console.log('   • From async generators');
  console.log();
  console.log('Best Practices:');
  console.log('✓ Use pipeline() instead of pipe()');
  console.log('✓ Use finished() for cleanup logic');
  console.log('✓ Use Readable.from() for simple cases');
  console.log('✓ Prefer Promise-based APIs');
  console.log('✓ Always handle pipeline errors');
  console.log('\n✓ All examples completed!\n');
}

/**
 * UTILITY COMPARISON:
 *
 * pipe() vs pipeline():
 * ❌ pipe() - Manual error handling required
 * ✅ pipeline() - Automatic error handling
 *
 * Example:
 * // pipe() - Error prone
 * source.pipe(transform).pipe(dest);
 * source.on('error', handler);
 * transform.on('error', handler);
 * dest.on('error', handler);
 *
 * // pipeline() - Better
 * pipeline(source, transform, dest, (err) => {
 *   if (err) console.error(err);
 * });
 *
 * PROMISE PATTERNS:
 *
 * 1. promisify pipeline:
 *    const pipeline = promisify(require('stream').pipeline);
 *    await pipeline(source, transform, dest);
 *
 * 2. promisify finished:
 *    const finished = promisify(require('stream').finished);
 *    await finished(stream);
 *
 * 3. for await...of:
 *    for await (const chunk of stream) {
 *      console.log(chunk);
 *    }
 *
 * PRODUCTION TIPS:
 *
 * 1. Always use pipeline() in production
 * 2. Add retry logic for resilience
 * 3. Use finished() for cleanup
 * 4. Monitor pipeline performance
 * 5. Log errors with context
 */
