/**
 * 03-custom-writable.js
 * ======================
 * Demonstrates creating custom Writable streams with batching
 *
 * Key Concepts:
 * - Extending the Writable class
 * - Implementing _write() method
 * - Using _final() for cleanup
 * - Batching for efficiency
 * - Callback management
 *
 * Run: node 03-custom-writable.js
 */

const { Writable, Readable } = require('stream');
const fs = require('fs');
const path = require('path');

console.log('=== Custom Writable Stream Examples ===\n');

// =============================================================================
// Example 1: Simple Logger Stream
// =============================================================================

class LoggerStream extends Writable {
  constructor(options) {
    super(options);
    this.lineCount = 0;
  }

  _write(chunk, encoding, callback) {
    this.lineCount++;
    const timestamp = new Date().toISOString();
    const message = chunk.toString().trim();

    console.log(`[${timestamp}] Line ${this.lineCount}: ${message}`);

    // MUST call callback when done
    callback();
  }

  _final(callback) {
    console.log(`\n✓ Logged ${this.lineCount} lines\n`);
    callback();
  }
}

console.log('--- Example 1: Simple Logger Stream ---\n');

const logger = new LoggerStream();

logger.write('First message\n');
logger.write('Second message\n');
logger.write('Third message\n');
logger.end('Final message\n');

logger.on('finish', () => {
  example2();
});

// =============================================================================
// Example 2: Batching Writable Stream
// =============================================================================

class BatchWriter extends Writable {
  constructor(batchSize, options) {
    super({ objectMode: true, ...options });
    this.batchSize = batchSize;
    this.batch = [];
    this.batchCount = 0;
  }

  _write(item, encoding, callback) {
    // Add to batch
    this.batch.push(item);

    if (this.batch.length >= this.batchSize) {
      // Batch full - process it
      this.processBatch((err) => {
        callback(err);
      });
    } else {
      // Batch not full - continue
      callback();
    }
  }

  _final(callback) {
    // Process remaining items
    if (this.batch.length > 0) {
      this.processBatch(callback);
    } else {
      callback();
    }
  }

  processBatch(callback) {
    this.batchCount++;
    console.log(`  Batch #${this.batchCount}: Processing ${this.batch.length} items`);

    // Simulate batch processing (e.g., bulk database insert)
    setTimeout(() => {
      console.log(`    Items: ${this.batch.map(i => i.id).join(', ')}`);
      this.batch = [];
      callback();
    }, 100);
  }
}

function example2() {
  console.log('--- Example 2: Batching Writable Stream ---\n');
  console.log('Batch size: 5\n');

  const batcher = new BatchWriter(5);

  // Write 12 items
  for (let i = 1; i <= 12; i++) {
    batcher.write({ id: i, value: `Item ${i}` });
  }

  batcher.end();

  batcher.on('finish', () => {
    console.log('\n✓ All batches processed\n');
    example3();
  });
}

// =============================================================================
// Example 3: File Writer with Buffering
// =============================================================================

class BufferedFileWriter extends Writable {
  constructor(filePath, options) {
    super(options);
    this.filePath = filePath;
    this.buffer = [];
    this.bufferSize = 10;
    this.bytesWritten = 0;
    this.fd = null;
  }

  async _construct(callback) {
    // Called before any _write() calls
    try {
      this.fd = fs.openSync(this.filePath, 'w');
      console.log(`  Opened file: ${this.filePath}`);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _write(chunk, encoding, callback) {
    this.buffer.push(chunk);

    if (this.buffer.length >= this.bufferSize) {
      this.flush((err) => {
        callback(err);
      });
    } else {
      callback();
    }
  }

  _final(callback) {
    // Flush remaining buffer
    this.flush((err) => {
      if (err) return callback(err);

      // Close file
      if (this.fd !== null) {
        fs.closeSync(this.fd);
        console.log(`  Closed file. Total bytes: ${this.bytesWritten}`);
      }

      callback();
    });
  }

  flush(callback) {
    if (this.buffer.length === 0) {
      return callback();
    }

    const data = Buffer.concat(this.buffer);
    this.buffer = [];

    try {
      fs.writeSync(this.fd, data);
      this.bytesWritten += data.length;
      console.log(`  Flushed ${data.length} bytes (total: ${this.bytesWritten})`);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

function example3() {
  console.log('--- Example 3: Buffered File Writer ---\n');

  const filePath = path.join(__dirname, 'output.txt');
  const writer = new BufferedFileWriter(filePath);

  // Write multiple chunks
  for (let i = 1; i <= 25; i++) {
    writer.write(`Line ${i}\n`);
  }

  writer.end();

  writer.on('finish', () => {
    console.log(`\n✓ File written: ${filePath}\n`);

    // Clean up
    fs.unlinkSync(filePath);
    console.log('✓ Cleaned up test file\n');

    example4();
  });

  writer.on('error', (err) => {
    console.error('Write error:', err.message);
  });
}

// =============================================================================
// Example 4: Transform-like Writer (Formatter)
// =============================================================================

class JSONLWriter extends Writable {
  constructor(outputStream, options) {
    super({ objectMode: true, ...options });
    this.output = outputStream;
    this.count = 0;
  }

  _write(obj, encoding, callback) {
    try {
      // Convert object to JSON Line format
      const line = JSON.stringify(obj) + '\n';

      this.output.write(line, (err) => {
        if (!err) {
          this.count++;
        }
        callback(err);
      });
    } catch (err) {
      callback(err);
    }
  }

  _final(callback) {
    console.log(`  Wrote ${this.count} JSON lines`);
    this.output.end(callback);
  }
}

function example4() {
  console.log('--- Example 4: JSON Lines Writer ---\n');

  const filePath = path.join(__dirname, 'output.jsonl');
  const fileStream = fs.createWriteStream(filePath);
  const jsonlWriter = new JSONLWriter(fileStream);

  const records = [
    { id: 1, name: 'Alice', role: 'Admin' },
    { id: 2, name: 'Bob', role: 'User' },
    { id: 3, name: 'Charlie', role: 'User' }
  ];

  records.forEach(record => jsonlWriter.write(record));
  jsonlWriter.end();

  jsonlWriter.on('finish', () => {
    // Read back and display
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('\nOutput file contents:');
    console.log(content);

    // Clean up
    fs.unlinkSync(filePath);
    console.log('✓ Cleaned up test file\n');

    example5();
  });
}

// =============================================================================
// Example 5: Multi-Destination Writer
// =============================================================================

class MultiWriter extends Writable {
  constructor(destinations, options) {
    super(options);
    this.destinations = destinations;
  }

  _write(chunk, encoding, callback) {
    let pending = this.destinations.length;
    let error = null;

    if (pending === 0) {
      return callback();
    }

    // Write to all destinations
    this.destinations.forEach((dest) => {
      dest.write(chunk, encoding, (err) => {
        if (err && !error) {
          error = err;
        }

        pending--;

        if (pending === 0) {
          callback(error);
        }
      });
    });
  }

  _final(callback) {
    let pending = this.destinations.length;
    let error = null;

    if (pending === 0) {
      return callback();
    }

    // End all destinations
    this.destinations.forEach((dest) => {
      dest.end((err) => {
        if (err && !error) {
          error = err;
        }

        pending--;

        if (pending === 0) {
          callback(error);
        }
      });
    });
  }
}

function example5() {
  console.log('--- Example 5: Multi-Destination Writer ---\n');

  const file1 = path.join(__dirname, 'output1.txt');
  const file2 = path.join(__dirname, 'output2.txt');

  const dest1 = fs.createWriteStream(file1);
  const dest2 = fs.createWriteStream(file2);

  const multi = new MultiWriter([dest1, dest2]);

  console.log('Writing to multiple destinations...\n');

  multi.write('Line 1\n');
  multi.write('Line 2\n');
  multi.write('Line 3\n');
  multi.end();

  multi.on('finish', () => {
    console.log('Output 1:', fs.readFileSync(file1, 'utf8'));
    console.log('Output 2:', fs.readFileSync(file2, 'utf8'));

    // Clean up
    fs.unlinkSync(file1);
    fs.unlinkSync(file2);
    console.log('✓ Cleaned up test files\n');

    showSummary();
  });
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('=== Summary ===\n');
  console.log('Key Points:');
  console.log('1. Always call callback() in _write()');
  console.log('2. Use _final() for cleanup and flushing');
  console.log('3. Batching improves performance');
  console.log('4. Use _construct() for initialization');
  console.log('5. Handle errors by passing to callback');
  console.log('6. objectMode for JavaScript objects');
  console.log('7. Can write to multiple destinations');
  console.log('\nBest Practices:');
  console.log('• Always call callback exactly once');
  console.log('• Flush buffers in _final()');
  console.log('• Handle both sync and async errors');
  console.log('• Close resources in _final()');
  console.log('• Use batching for efficiency');
  console.log('\n✓ All examples completed!\n');
}

/**
 * COMMON PITFALLS:
 *
 * 1. Not calling callback:
 *    - Stream will freeze
 *    - No more data will be processed
 *
 * 2. Calling callback multiple times:
 *    - Will cause errors
 *    - Corrupts stream state
 *
 * 3. Forgetting _final():
 *    - Buffered data might be lost
 *    - Resources might not close
 *
 * 4. Not handling errors:
 *    - Pass errors to callback(err)
 *    - Don't throw in _write()
 *
 * PERFORMANCE TIPS:
 *
 * 1. Batch operations when possible
 * 2. Buffer small writes
 * 3. Use async I/O
 * 4. Tune highWaterMark
 * 5. Minimize object creation
 */
