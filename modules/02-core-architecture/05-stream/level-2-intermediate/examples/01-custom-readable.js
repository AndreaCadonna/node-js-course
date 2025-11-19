/**
 * 01-custom-readable.js
 * =====================
 * Demonstrates creating custom Readable streams by extending the Readable class
 *
 * Key Concepts:
 * - Extending the Readable class
 * - Implementing the _read() method
 * - Pushing data with push()
 * - Signaling end of stream with push(null)
 * - Handling backpressure
 *
 * Run: node 01-custom-readable.js
 */

const { Readable } = require('stream');

console.log('=== Custom Readable Stream Examples ===\n');

// =============================================================================
// Example 1: Simple Number Generator Stream
// =============================================================================

class NumberStream extends Readable {
  constructor(start, end, options) {
    super(options);
    this.current = start;
    this.end = end;
  }

  _read(size) {
    // Called when stream needs data
    // size is a hint (usually highWaterMark value)

    if (this.current <= this.end) {
      // Generate next number
      const data = `${this.current}\n`;

      // Push data into the stream
      this.push(data);

      this.current++;
    } else {
      // No more data - signal end of stream
      this.push(null);
    }
  }
}

console.log('--- Example 1: Number Generator ---\n');

const numbers = new NumberStream(1, 10);

numbers.on('data', (chunk) => {
  process.stdout.write(`Received: ${chunk}`);
});

numbers.on('end', () => {
  console.log('\n✓ Number stream ended\n');
  example2();
});

// =============================================================================
// Example 2: Random Data Generator with Backpressure
// =============================================================================

class RandomDataStream extends Readable {
  constructor(count, options) {
    super(options);
    this.count = count;
    this.generated = 0;
  }

  _read(size) {
    if (this.generated >= this.count) {
      this.push(null);
      return;
    }

    // Generate random data
    const data = Math.random().toString(36).substring(7) + '\n';

    // Push and check backpressure
    const canContinue = this.push(data);

    this.generated++;

    if (!canContinue) {
      console.log(`  [Backpressure at ${this.generated}/${this.count}]`);
      // Stream will call _read() again when buffer is drained
    }
  }
}

function example2() {
  console.log('--- Example 2: Random Data with Backpressure ---\n');

  const random = new RandomDataStream(100, {
    highWaterMark: 16 // Small buffer to demonstrate backpressure
  });

  let chunks = 0;

  random.on('data', (chunk) => {
    chunks++;
    if (chunks % 10 === 0) {
      process.stdout.write(`  Chunk ${chunks}: ${chunk}`);
    }
  });

  random.on('end', () => {
    console.log(`\n✓ Generated ${chunks} chunks\n`);
    example3();
  });
}

// =============================================================================
// Example 3: Database-like Stream (Async Data)
// =============================================================================

class AsyncDataStream extends Readable {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.page = 0;
    this.pageSize = 5;
    this.totalPages = 3;
  }

  async _read() {
    if (this.page >= this.totalPages) {
      this.push(null);
      return;
    }

    try {
      // Simulate async database query
      const records = await this.fetchPage(this.page);

      // Push each record
      for (const record of records) {
        if (!this.push(record)) {
          // Backpressure - stop pushing
          break;
        }
      }

      this.page++;
    } catch (err) {
      this.destroy(err);
    }
  }

  fetchPage(page) {
    return new Promise((resolve) => {
      // Simulate network/database delay
      setTimeout(() => {
        const records = [];
        const start = page * this.pageSize;

        for (let i = 0; i < this.pageSize; i++) {
          records.push({
            id: start + i + 1,
            name: `Record ${start + i + 1}`,
            timestamp: Date.now()
          });
        }

        console.log(`  Fetched page ${page + 1}/${this.totalPages} (${records.length} records)`);
        resolve(records);
      }, 100);
    });
  }
}

function example3() {
  console.log('--- Example 3: Async Database Stream ---\n');

  const dbStream = new AsyncDataStream();

  let count = 0;

  dbStream.on('data', (record) => {
    count++;
    if (count % 3 === 0) {
      console.log(`  Record: ${JSON.stringify(record)}`);
    }
  });

  dbStream.on('end', () => {
    console.log(`\n✓ Streamed ${count} records from database\n`);
    example4();
  });

  dbStream.on('error', (err) => {
    console.error('Stream error:', err.message);
  });
}

// =============================================================================
// Example 4: Infinite Stream (Controlled by Consumer)
// =============================================================================

class InfiniteRandomStream extends Readable {
  constructor(options) {
    super(options);
  }

  _read() {
    // Generate random number forever
    const data = Math.random().toFixed(4) + '\n';
    this.push(data);

    // Never push null - stream is infinite!
    // Consumer must destroy() the stream to stop it
  }
}

function example4() {
  console.log('--- Example 4: Infinite Stream (Consumer Controlled) ---\n');

  const infinite = new InfiniteRandomStream();

  let count = 0;
  const maxCount = 20;

  infinite.on('data', (chunk) => {
    count++;
    if (count <= 5 || count === maxCount) {
      process.stdout.write(`  Random #${count}: ${chunk}`);
    } else if (count === 6) {
      console.log('  ...');
    }

    // Consumer decides when to stop
    if (count >= maxCount) {
      infinite.destroy();
    }
  });

  infinite.on('close', () => {
    console.log(`\n✓ Stopped infinite stream after ${count} items\n`);
    example5();
  });
}

// =============================================================================
// Example 5: Custom Stream with Statistics
// =============================================================================

class StatisticsStream extends Readable {
  constructor(data, options) {
    super(options);
    this.data = data;
    this.index = 0;
    this.stats = {
      bytesGenerated: 0,
      chunksGenerated: 0,
      startTime: Date.now()
    };
  }

  _read() {
    if (this.index < this.data.length) {
      const chunk = this.data[this.index];
      this.push(chunk);

      // Update statistics
      this.stats.bytesGenerated += chunk.length;
      this.stats.chunksGenerated++;

      this.index++;
    } else {
      // Emit statistics before ending
      this.stats.duration = Date.now() - this.stats.startTime;
      this.emit('statistics', this.stats);

      this.push(null);
    }
  }
}

function example5() {
  console.log('--- Example 5: Stream with Statistics ---\n');

  const data = [
    'First line\n',
    'Second line\n',
    'Third line\n',
    'Fourth line\n',
    'Fifth line\n'
  ];

  const statsStream = new StatisticsStream(data);

  statsStream.on('data', (chunk) => {
    process.stdout.write(`  ${chunk}`);
  });

  statsStream.on('statistics', (stats) => {
    console.log('\n📊 Statistics:');
    console.log(`   Chunks: ${stats.chunksGenerated}`);
    console.log(`   Bytes: ${stats.bytesGenerated}`);
    console.log(`   Duration: ${stats.duration}ms`);
  });

  statsStream.on('end', () => {
    console.log('\n✓ Statistics stream completed\n');
    example6();
  });
}

// =============================================================================
// Example 6: Readable.from() Helper (Modern Approach)
// =============================================================================

function example6() {
  console.log('--- Example 6: Using Readable.from() ---\n');

  // Modern way to create readable from iterable
  const data = ['Line 1\n', 'Line 2\n', 'Line 3\n'];
  const stream = Readable.from(data);

  stream.on('data', (chunk) => {
    process.stdout.write(`  ${chunk}`);
  });

  stream.on('end', () => {
    console.log('✓ Readable.from() stream ended\n');
    showSummary();
  });
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('=== Summary ===\n');
  console.log('Key Points:');
  console.log('1. Extend Readable class and implement _read()');
  console.log('2. Use push() to send data to consumers');
  console.log('3. Use push(null) to signal end of stream');
  console.log('4. Check push() return value for backpressure');
  console.log('5. Use async/await in _read() for async operations');
  console.log('6. Use Readable.from() for simple cases');
  console.log('7. Emit custom events for metadata');
  console.log('8. Consumer controls infinite streams with destroy()');
  console.log('\n✓ All examples completed!\n');
}

// =============================================================================
// Additional Notes
// =============================================================================

/**
 * WHEN TO CREATE CUSTOM READABLE STREAMS:
 *
 * 1. Reading from databases with pagination
 * 2. Generating test data
 * 3. Streaming from REST APIs
 * 4. Custom data sources (sensors, queues, etc)
 * 5. Transforming sync iterables to streams
 *
 * BEST PRACTICES:
 *
 * 1. Always call push(null) when done (unless infinite)
 * 2. Never call push() after pushing null
 * 3. Check push() return value for backpressure
 * 4. Use destroy(err) for errors
 * 5. Don't call _read() yourself - let stream manage it
 * 6. Use objectMode for structured data
 * 7. Consider using Readable.from() for simple cases
 *
 * PERFORMANCE TIPS:
 *
 * 1. Adjust highWaterMark based on chunk size
 * 2. Don't push too much in one _read() call
 * 3. Use async _read() for I/O operations
 * 4. Batch operations when possible
 */
