/**
 * Solution: Exercise 2 - Database Writer Stream
 * ===============================================
 * Complete solution with batching, retry logic, and statistics
 */

const { Writable, Readable } = require('stream');
const { pipeline } = require('stream/promises');
const fs = require('fs');
const path = require('path');

class DatabaseWriterStream extends Writable {
  constructor(filePath, batchSize = 100, options) {
    super({ objectMode: true, ...options });

    this.filePath = filePath;
    this.batchSize = batchSize;
    this.batch = [];
    this.stats = {
      totalRecords: 0,
      batches: 0,
      retries: 0,
      errors: 0
    };
    this.maxRetries = 3;
  }

  async _write(record, encoding, callback) {
    try {
      this.batch.push(record);

      if (this.batch.length >= this.batchSize) {
        await this.flushBatch();
      }

      callback();
    } catch (err) {
      callback(err);
    }
  }

  async _final(callback) {
    try {
      await this.flushBatch();

      console.log('\nFinal Statistics:');
      console.log(`  Total records: ${this.stats.totalRecords}`);
      console.log(`  Batches written: ${this.stats.batches}`);
      console.log(`  Retries: ${this.stats.retries}`);
      console.log(`  Errors: ${this.stats.errors}`);

      callback();
    } catch (err) {
      callback(err);
    }
  }

  async flushBatch(attempt = 0) {
    if (this.batch.length === 0) return;

    const currentBatch = [...this.batch];
    const batchNumber = this.stats.batches + 1;

    try {
      console.log(`📦 Batch ${batchNumber}: Writing ${currentBatch.length} records...`);

      await this.writeBatchToFile(currentBatch);

      this.stats.batches++;
      this.stats.totalRecords += currentBatch.length;
      this.batch = [];

      console.log(`✓ Batch ${batchNumber} written successfully`);

      this.emit('batch', {
        number: batchNumber,
        count: currentBatch.length,
        total: this.stats.totalRecords
      });
    } catch (err) {
      if (attempt < this.maxRetries) {
        this.stats.retries++;
        const delay = 1000 * Math.pow(2, attempt);

        console.log(`⚠ Batch ${batchNumber} failed, retrying in ${delay}ms... (attempt ${attempt + 1}/${this.maxRetries})`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.flushBatch(attempt + 1);
      } else {
        this.stats.errors++;
        throw new Error(`Batch ${batchNumber} failed after ${this.maxRetries} retries: ${err.message}`);
      }
    }
  }

  async writeBatchToFile(batch) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random failures (10% chance)
        if (Math.random() < 0.1) {
          reject(new Error('Simulated database error'));
          return;
        }

        try {
          const data = JSON.stringify(batch) + '\n';
          fs.appendFileSync(this.filePath, data);
          resolve();
        } catch (err) {
          reject(err);
        }
      }, 50);
    });
  }
}

// =============================================================================
// Tests
// =============================================================================

async function test1() {
  console.log('Test 1: Basic Writing (10 records)\n');

  const filePath = path.join(__dirname, 'test-db-1.jsonl');

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const writer = new DatabaseWriterStream(filePath, 5);

  writer.on('batch', (info) => {
    console.log(`  Progress: ${info.total} records written`);
  });

  for (let i = 1; i <= 10; i++) {
    writer.write({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      timestamp: Date.now()
    });
  }

  writer.end();

  writer.on('finish', () => {
    console.log('\n✓ Test 1 complete\n');

    const content = fs.readFileSync(filePath, 'utf8');
    console.log('File contents preview:');
    console.log(content.split('\n')[0].substring(0, 100) + '...\n');

    fs.unlinkSync(filePath);
    test2();
  });
}

async function test2() {
  console.log('Test 2: Large Dataset (250 records)\n');

  const filePath = path.join(__dirname, 'test-db-2.jsonl');

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const writer = new DatabaseWriterStream(filePath, 100);

  for (let i = 1; i <= 250; i++) {
    writer.write({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`
    });
  }

  writer.end();

  writer.on('finish', () => {
    console.log('\n✓ Test 2 complete\n');
    fs.unlinkSync(filePath);
    test3();
  });
}

async function test3() {
  console.log('Test 3: Complete Pipeline\n');

  const filePath = path.join(__dirname, 'test-db-3.jsonl');

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  class DataGenerator extends Readable {
    constructor(count, options) {
      super({ objectMode: true, ...options });
      this.count = count;
      this.current = 0;
    }

    _read() {
      if (this.current >= this.count) {
        this.push(null);
        return;
      }

      this.current++;
      this.push({
        id: this.current,
        name: `User ${this.current}`,
        email: `user${this.current}@example.com`
      });
    }
  }

  try {
    await pipeline(
      new DataGenerator(50),
      new DatabaseWriterStream(filePath, 10)
    );

    console.log('\n✓ Pipeline complete\n');
    fs.unlinkSync(filePath);
    console.log('=== All tests passed! ===\n');
  } catch (err) {
    console.error('Pipeline error:', err.message);
  }
}

test1();

/**
 * KEY IMPLEMENTATION DETAILS:
 *
 * 1. Batching:
 *    - Accumulate records in this.batch array
 *    - Flush when batch size reached
 *    - Flush remaining in _final()
 *
 * 2. Retry Logic:
 *    - Try up to maxRetries times
 *    - Exponential backoff: 1s, 2s, 4s, 8s
 *    - Track retry count in statistics
 *
 * 3. Error Handling:
 *    - Catch errors in _write() and pass to callback
 *    - Retry on failure
 *    - Fail after max retries exceeded
 *
 * 4. Statistics:
 *    - Track total records, batches, retries, errors
 *    - Report in _final()
 *    - Emit 'batch' event for progress tracking
 *
 * 5. File Operations:
 *    - Append to file (don't overwrite)
 *    - Write as JSON lines format
 *    - Simulate async I/O with Promise
 */
