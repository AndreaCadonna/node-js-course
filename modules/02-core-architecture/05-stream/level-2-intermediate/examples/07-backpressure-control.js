/**
 * 07-backpressure-control.js
 * ===========================
 * Demonstrates manual backpressure management and monitoring
 *
 * Key Concepts:
 * - Detecting backpressure
 * - Respecting write() return value
 * - Monitoring buffer levels
 * - Tuning highWaterMark
 * - Performance implications
 *
 * Run: node 07-backpressure-control.js
 */

const { Readable, Writable, Transform } = require('stream');

console.log('=== Backpressure Control Examples ===\n');

// =============================================================================
// Example 1: Detecting Backpressure
// =============================================================================

console.log('--- Example 1: Detecting Backpressure ---\n');

class SlowWriter extends Writable {
  constructor(delay = 100, options) {
    super(options);
    this.delay = delay;
    this.chunkCount = 0;
  }

  _write(chunk, encoding, callback) {
    this.chunkCount++;

    // Simulate slow processing
    setTimeout(() => {
      console.log(`  Processed chunk ${this.chunkCount}`);
      callback();
    }, this.delay);
  }
}

const slowWriter = new SlowWriter(100, { highWaterMark: 16 * 3 }); // Small buffer

let backpressureCount = 0;

for (let i = 1; i <= 20; i++) {
  const canContinue = slowWriter.write(`Chunk ${i}\n`);

  if (!canContinue) {
    backpressureCount++;
    console.log(`  ⚠️  Backpressure at chunk ${i}! (Buffer full)`);
  }
}

slowWriter.on('drain', () => {
  console.log('  ✅ Drain event - buffer cleared\n');
});

slowWriter.end();

slowWriter.on('finish', () => {
  console.log(`✓ Backpressure occurred ${backpressureCount} times\n`);
  example2();
});

// =============================================================================
// Example 2: Respecting Backpressure
// =============================================================================

function example2() {
  console.log('--- Example 2: Respecting Backpressure ---\n');

  const writer = new SlowWriter(50);

  let i = 0;
  const maxItems = 20;

  function writeNext() {
    let canContinue = true;

    while (i < maxItems && canContinue) {
      i++;

      const data = `Item ${i}\n`;

      if (i === maxItems) {
        // Last item
        writer.write(data, () => {
          console.log('  Last item written');
        });
      } else {
        // Check backpressure
        canContinue = writer.write(data);

        if (!canContinue) {
          console.log(`  ⚠️  Pausing at item ${i} (backpressure)`);
        }
      }
    }

    if (i < maxItems) {
      // Wait for drain
      writer.once('drain', () => {
        console.log('  ✅ Resuming (drain event)');
        writeNext();
      });
    } else {
      writer.end();
    }
  }

  writeNext();

  writer.on('finish', () => {
    console.log(`\n✓ Wrote ${maxItems} items with backpressure control\n`);
    example3();
  });
}

// =============================================================================
// Example 3: Monitoring Buffer Levels
// =============================================================================

function example3() {
  console.log('--- Example 3: Monitoring Buffer Levels ---\n');

  class MonitoredWritable extends Writable {
    _write(chunk, encoding, callback) {
      // Check buffer state
      const bufferSize = this.writableLength;
      const highWaterMark = this.writableHighWaterMark;
      const percentFull = (bufferSize / highWaterMark * 100).toFixed(1);

      console.log(`  Buffer: ${bufferSize}/${highWaterMark} bytes (${percentFull}% full)`);

      // Simulate processing
      setTimeout(callback, 50);
    }
  }

  const monitored = new MonitoredWritable({ highWaterMark: 1024 });

  for (let i = 1; i <= 10; i++) {
    const data = 'x'.repeat(200); // 200 bytes
    console.log(`Writing chunk ${i}...`);
    monitored.write(data);
  }

  monitored.end();

  monitored.on('finish', () => {
    console.log('\n✓ Monitoring complete\n');
    example4();
  });
}

// =============================================================================
// Example 4: Tuning highWaterMark
// =============================================================================

function example4() {
  console.log('--- Example 4: Tuning highWaterMark ---\n');

  function testHighWaterMark(hwm, label) {
    return new Promise((resolve) => {
      const writer = new SlowWriter(10, { highWaterMark: hwm });

      let backpressureCount = 0;
      const startTime = Date.now();

      for (let i = 1; i <= 100; i++) {
        const ok = writer.write('x'.repeat(100));
        if (!ok) backpressureCount++;
      }

      writer.end();

      writer.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`  ${label}:`);
        console.log(`    highWaterMark: ${hwm} bytes`);
        console.log(`    Backpressure events: ${backpressureCount}`);
        console.log(`    Duration: ${duration}ms`);
        console.log();
        resolve();
      });
    });
  }

  (async () => {
    await testHighWaterMark(1024, 'Small buffer');
    await testHighWaterMark(16384, 'Default buffer');
    await testHighWaterMark(65536, 'Large buffer');

    console.log('✓ Tuning comparison complete\n');
    example5();
  })();
}

// =============================================================================
// Example 5: Async Producer with Backpressure
// =============================================================================

async function example5() {
  console.log('--- Example 5: Async Producer with Backpressure ---\n');

  const writer = new SlowWriter(20);

  async function produceData() {
    for (let i = 1; i <= 30; i++) {
      const data = `Data ${i}\n`;

      const canContinue = writer.write(data);

      if (!canContinue) {
        console.log(`  ⏸️  Pausing at item ${i}`);

        // Wait for drain
        await new Promise((resolve) => {
          writer.once('drain', resolve);
        });

        console.log(`  ▶️  Resuming after drain`);
      }
    }

    writer.end();
  }

  await produceData();

  writer.on('finish', () => {
    console.log('\n✓ Async production complete\n');
    example6();
  });
}

// =============================================================================
// Example 6: Backpressure in Pipelines
// =============================================================================

function example6() {
  console.log('--- Example 6: Backpressure in Pipelines ---\n');

  class FastReadable extends Readable {
    constructor(count, options) {
      super(options);
      this.count = count;
      this.current = 0;
    }

    _read() {
      if (this.current >= this.count) {
        this.push(null);
        return;
      }

      // Push multiple chunks per _read()
      for (let i = 0; i < 5 && this.current < this.count; i++) {
        this.current++;
        const ok = this.push(`Data ${this.current}\n`);

        if (!ok) {
          console.log(`  🔴 Readable: Backpressure at ${this.current}`);
          break; // Respect backpressure
        }
      }
    }
  }

  class MonitoredTransform extends Transform {
    constructor(delay, options) {
      super(options);
      this.delay = delay;
      this.count = 0;
    }

    _transform(chunk, encoding, callback) {
      this.count++;

      setTimeout(() => {
        const bufferSize = this.readableLength;
        const hwm = this.readableHighWaterMark;

        if (bufferSize > hwm * 0.8) {
          console.log(`  🟡 Transform: Buffer ${bufferSize}/${hwm} (high)`);
        }

        this.push(chunk);
        callback();
      }, this.delay);
    }
  }

  const source = new FastReadable(50);
  const transform = new MonitoredTransform(20);
  const dest = new SlowWriter(30);

  source.pipe(transform).pipe(dest);

  dest.on('finish', () => {
    console.log('\n✓ Pipeline with backpressure complete\n');
    showSummary();
  });
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('=== Summary ===\n');
  console.log('Key Points:');
  console.log('1. write() returns false when buffer is full');
  console.log('2. Wait for "drain" event before continuing');
  console.log('3. Monitor writableLength vs highWaterMark');
  console.log('4. Backpressure propagates through pipelines');
  console.log('5. Tune highWaterMark based on chunk size');
  console.log('6. Use async/await to handle backpressure cleanly');
  console.log('\nBest Practices:');
  console.log('✓ Always check write() return value');
  console.log('✓ Use pipeline() for automatic backpressure');
  console.log('✓ Monitor buffer levels in production');
  console.log('✓ Tune highWaterMark for your use case');
  console.log('✓ Test with slow consumers');
  console.log('\n✓ All examples completed!\n');
}

/**
 * BACKPRESSURE PATTERNS:
 *
 * 1. Check and Wait:
 *    const ok = stream.write(data);
 *    if (!ok) await new Promise(r => stream.once('drain', r));
 *
 * 2. Recursive with Drain:
 *    function writeNext() {
 *      const ok = stream.write(data);
 *      if (!ok) stream.once('drain', writeNext);
 *      else writeNext();
 *    }
 *
 * 3. Using pipeline():
 *    pipeline(source, transform, dest); // Automatic!
 *
 * TUNING GUIDELINES:
 *
 * Small highWaterMark (1-8 KB):
 * - Pros: Lower memory, more responsive
 * - Cons: More syscalls, higher CPU
 * - Use: Many concurrent streams, limited memory
 *
 * Large highWaterMark (64-256 KB):
 * - Pros: Better throughput, fewer syscalls
 * - Cons: Higher memory usage
 * - Use: Large files, fast I/O, few streams
 *
 * DEBUGGING TIPS:
 *
 * 1. Log buffer levels:
 *    console.log('Buffer:', stream.writableLength);
 *
 * 2. Count backpressure events:
 *    if (!stream.write(data)) backpressureCount++;
 *
 * 3. Measure throughput:
 *    const bytesPerSec = totalBytes / (elapsed / 1000);
 *
 * 4. Profile with --inspect:
 *    node --inspect 07-backpressure-control.js
 */
