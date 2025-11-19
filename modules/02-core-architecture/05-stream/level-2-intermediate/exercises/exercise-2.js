/**
 * Exercise 2: Database Writer Stream
 * ===================================
 *
 * Difficulty: Medium
 *
 * Task:
 * Create a Writable stream that accepts data objects and writes them to a "database"
 * (simulated with a file) with the following features:
 * - Batches writes for efficiency
 * - Commits batches when batch size is reached
 * - Handles errors with retry logic
 * - Reports statistics on completion
 *
 * Requirements:
 * 1. Create a DatabaseWriterStream class extending Writable
 * 2. Use object mode
 * 3. Batch records (default batch size: 100)
 * 4. Flush batch when:
 *    - Batch size reached
 *    - Stream ends (_final)
 * 5. Implement retry logic (max 3 retries)
 * 6. Track statistics: total records, batches, errors
 * 7. Emit 'batch' event when batch is written
 *
 * Run: node exercise-2.js
 */

const { Writable, Readable } = require('stream');
const fs = require('fs');
const path = require('path');

// =============================================================================
// TODO: Implement DatabaseWriterStream class
// =============================================================================

class DatabaseWriterStream extends Writable {
  constructor(filePath, batchSize = 100, options) {
    // TODO: Call super with object mode
    super({ objectMode: true, ...options });

    // TODO: Initialize instance variables
    // - this.filePath
    // - this.batchSize
    // - this.batch = []
    // - this.stats = { totalRecords: 0, batches: 0, retries: 0, errors: 0 }
    // - this.maxRetries = 3
  }

  async _write(record, encoding, callback) {
    // TODO: Implement write logic
    // 1. Add record to batch
    // 2. If batch is full, flush it
    // 3. Call callback when done
  }

  async _final(callback) {
    // TODO: Implement cleanup logic
    // 1. Flush any remaining records
    // 2. Log final statistics
    // 3. Call callback when done
  }

  async flushBatch(attempt = 0) {
    // TODO: Implement batch flushing with retry
    // 1. Check if batch is empty, return if so
    // 2. Try to write batch to file
    // 3. If error occurs and attempt < maxRetries, retry with exponential backoff
    // 4. Update statistics
    // 5. Emit 'batch' event
    // 6. Clear the batch
  }

  async writeBatchToFile(batch) {
    // TODO: Simulate database write
    // 1. Convert batch to JSON
    // 2. Append to file
    // 3. Simulate random failures (10% chance) for testing retry logic
    // 4. Add delay to simulate network/disk I/O
  }
}

// =============================================================================
// Test Cases
// =============================================================================

async function test1() {
  console.log('Test 1: Basic Writing (10 records)\n');

  const filePath = path.join(__dirname, 'test-db-1.jsonl');

  // Clean up any existing file
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const writer = new DatabaseWriterStream(filePath, 5); // Small batch for testing

  // TODO: Listen to 'batch' event and log when batches are written

  // Write test data
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

    // Show file contents
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('File contents:');
    console.log(content);

    // Clean up
    fs.unlinkSync(filePath);

    test2();
  });

  writer.on('error', (err) => {
    console.error('Write error:', err.message);
  });
}

async function test2() {
  console.log('\n\nTest 2: Large Dataset (250 records)\n');

  const filePath = path.join(__dirname, 'test-db-2.jsonl');

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const writer = new DatabaseWriterStream(filePath, 100);

  let written = 0;

  // TODO: Generate and write 250 records
  // TODO: Track progress
  // TODO: Show final statistics

  // Clean up when done
}

async function test3() {
  console.log('\n\nTest 3: Complete Pipeline\n');

  // TODO: Create a complete pipeline that:
  // 1. Generates data with a Readable stream
  // 2. Transforms/validates data
  // 3. Writes to database with DatabaseWriterStream
  // 4. Uses pipeline() for proper error handling
}

// Start tests
test1();

// =============================================================================
// Expected Output Example:
// =============================================================================

/**
 * Test 1: Basic Writing (10 records)
 *
 * 📦 Batch 1: Writing 5 records...
 * ✓ Batch 1 written successfully
 *
 * 📦 Batch 2: Writing 5 records...
 * ✓ Batch 2 written successfully
 *
 * ✓ Test 1 complete
 *
 * File contents:
 * [{"id":1,"name":"User 1","email":"user1@example.com",...}, ...]
 * [{"id":6,"name":"User 6","email":"user6@example.com",...}, ...]
 *
 *
 * Test 2: Large Dataset (250 records)
 *
 * 📦 Batch 1: Writing 100 records...
 * ✓ Batch 1 written successfully
 *
 * 📦 Batch 2: Writing 100 records...
 * ⚠ Batch 2 failed, retrying... (attempt 1/3)
 * ✓ Batch 2 written successfully
 *
 * ... etc
 *
 * Final Statistics:
 *   Total records: 250
 *   Batches written: 3
 *   Retries: 2
 *   Errors: 0
 */

// =============================================================================
// Hints:
// =============================================================================

/**
 * Hint 1: Batching logic
 * _write(record, encoding, callback) {
 *   this.batch.push(record);
 *   if (this.batch.length >= this.batchSize) {
 *     this.flushBatch()
 *       .then(() => callback())
 *       .catch(err => callback(err));
 *   } else {
 *     callback();
 *   }
 * }
 *
 * Hint 2: Writing to file
 * const data = JSON.stringify(batch) + '\n';
 * fs.appendFileSync(this.filePath, data);
 *
 * Hint 3: Retry logic with exponential backoff
 * const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s, ...
 * await new Promise(resolve => setTimeout(resolve, delay));
 *
 * Hint 4: Simulating failures
 * if (Math.random() < 0.1) {
 *   throw new Error('Simulated database error');
 * }
 *
 * Hint 5: Statistics tracking
 * Track in _write, flushBatch, and _final
 * Emit or log in _final
 */
