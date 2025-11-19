/**
 * 04-writable-to-database.js
 * ===========================
 * Demonstrates writing stream data to a database with batching and transactions
 *
 * Key Concepts:
 * - Database bulk inserts
 * - Transaction handling
 * - Error recovery
 * - Performance optimization
 *
 * Run: node 04-writable-to-database.js
 */

const { Writable, Readable } = require('stream');
const { pipeline } = require('stream/promises');

console.log('=== Database Writer Stream Examples ===\n');

// Simulated database
class MockDatabase {
  constructor() {
    this.records = [];
    this.transactions = 0;
  }

  async insert(records) {
    // Simulate database insert with delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Database connection lost');
    }

    this.records.push(...records);
    this.transactions++;
  }

  getStats() {
    return {
      totalRecords: this.records.length,
      transactions: this.transactions
    };
  }

  clear() {
    this.records = [];
    this.transactions = 0;
  }
}

const db = new MockDatabase();

// =============================================================================
// Example 1: Basic Database Writer
// =============================================================================

class DatabaseWriter extends Writable {
  constructor(tableName, options) {
    super({ objectMode: true, ...options });
    this.tableName = tableName;
    this.recordCount = 0;
  }

  async _write(record, encoding, callback) {
    try {
      await db.insert([record]);
      this.recordCount++;
      console.log(`  Inserted record ${this.recordCount}: ${record.name}`);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _final(callback) {
    console.log(`\n✓ Inserted ${this.recordCount} records into ${this.tableName}\n`);
    callback();
  }
}

console.log('--- Example 1: Basic Database Writer ---\n');

const writer1 = new DatabaseWriter('users');

const data1 = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' }
];

data1.forEach(record => writer1.write(record));
writer1.end();

writer1.on('finish', () => {
  console.log('Stats:', db.getStats());
  db.clear();
  example2();
});

// =============================================================================
// Example 2: Batching Database Writer
// =============================================================================

class BatchDatabaseWriter extends Writable {
  constructor(tableName, batchSize = 100, options) {
    super({ objectMode: true, ...options });
    this.tableName = tableName;
    this.batchSize = batchSize;
    this.batch = [];
    this.totalRecords = 0;
  }

  async _write(record, encoding, callback) {
    this.batch.push(record);

    if (this.batch.length >= this.batchSize) {
      try {
        await this.flushBatch();
        callback();
      } catch (err) {
        callback(err);
      }
    } else {
      callback();
    }
  }

  async _final(callback) {
    try {
      await this.flushBatch();
      console.log(`\n✓ Total records inserted: ${this.totalRecords}\n`);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  async flushBatch() {
    if (this.batch.length === 0) return;

    console.log(`  Inserting batch of ${this.batch.length} records...`);

    await db.insert(this.batch);
    this.totalRecords += this.batch.length;
    this.batch = [];
  }
}

async function example2() {
  console.log('--- Example 2: Batching Database Writer ---\n');
  console.log('Batch size: 5\n');

  const writer = new BatchDatabaseWriter('users', 5);

  // Generate more records
  for (let i = 1; i <= 12; i++) {
    writer.write({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`
    });
  }

  writer.end();

  writer.on('finish', () => {
    console.log('Stats:', db.getStats());
    db.clear();
    example3();
  });
}

// =============================================================================
// Example 3: Database Writer with Retry
// =============================================================================

class ResilientDatabaseWriter extends Writable {
  constructor(tableName, batchSize = 50, maxRetries = 3, options) {
    super({ objectMode: true, ...options });
    this.tableName = tableName;
    this.batchSize = batchSize;
    this.maxRetries = maxRetries;
    this.batch = [];
    this.totalRecords = 0;
    this.failedBatches = 0;
  }

  async _write(record, encoding, callback) {
    this.batch.push(record);

    if (this.batch.length >= this.batchSize) {
      try {
        await this.flushBatchWithRetry();
        callback();
      } catch (err) {
        callback(err);
      }
    } else {
      callback();
    }
  }

  async _final(callback) {
    try {
      await this.flushBatchWithRetry();
      console.log(`\n✓ Total records: ${this.totalRecords}`);
      console.log(`✓ Failed batches recovered: ${this.failedBatches}\n`);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  async flushBatchWithRetry(attempt = 0) {
    if (this.batch.length === 0) return;

    try {
      await db.insert(this.batch);
      this.totalRecords += this.batch.length;
      console.log(`  ✓ Inserted batch of ${this.batch.length} records`);
      this.batch = [];
    } catch (err) {
      if (attempt >= this.maxRetries) {
        console.error(`  ✗ Batch failed after ${this.maxRetries} retries`);
        throw err;
      }

      this.failedBatches++;
      const delay = 1000 * Math.pow(2, attempt);
      console.log(`  ⚠ Retry ${attempt + 1}/${this.maxRetries} after ${delay}ms`);

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.flushBatchWithRetry(attempt + 1);
    }
  }
}

async function example3() {
  console.log('--- Example 3: Database Writer with Retry ---\n');

  const writer = new ResilientDatabaseWriter('users', 10);

  for (let i = 1; i <= 25; i++) {
    writer.write({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`
    });
  }

  writer.end();

  writer.on('finish', () => {
    console.log('Stats:', db.getStats());
    db.clear();
    example4();
  });

  writer.on('error', (err) => {
    console.error('Fatal error:', err.message);
    db.clear();
    example4();
  });
}

// =============================================================================
// Example 4: Complete Pipeline with Transform
// =============================================================================

const { Transform } = require('stream');

class DataValidator extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.validated = 0;
    this.rejected = 0;
  }

  _transform(record, encoding, callback) {
    // Validate record
    if (this.isValid(record)) {
      this.validated++;
      this.push(record);
    } else {
      this.rejected++;
      console.log(`  ⚠ Rejected invalid record: ${JSON.stringify(record)}`);
    }

    callback();
  }

  isValid(record) {
    return (
      record &&
      typeof record.id === 'number' &&
      typeof record.name === 'string' &&
      record.name.length > 0 &&
      typeof record.email === 'string' &&
      record.email.includes('@')
    );
  }

  _flush(callback) {
    console.log(`\nValidation: ${this.validated} valid, ${this.rejected} rejected\n`);
    callback();
  }
}

class RecordEnricher extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
  }

  _transform(record, encoding, callback) {
    // Enrich record
    const enriched = {
      ...record,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    this.push(enriched);
    callback();
  }
}

async function example4() {
  console.log('--- Example 4: Complete ETL Pipeline ---\n');

  // Source data generator
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

      // Some records are invalid for demonstration
      const record = this.current % 7 === 0
        ? { id: this.current } // Missing required fields
        : {
            id: this.current,
            name: `User ${this.current}`,
            email: `user${this.current}@example.com`
          };

      this.push(record);
    }
  }

  try {
    await pipeline(
      new DataGenerator(20),
      new DataValidator(),
      new RecordEnricher(),
      new BatchDatabaseWriter('users', 5)
    );

    console.log('\n✓ Pipeline completed successfully');
    console.log('Final stats:', db.getStats());
    db.clear();
    showSummary();
  } catch (err) {
    console.error('Pipeline error:', err.message);
    showSummary();
  }
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('\n=== Summary ===\n');
  console.log('Key Patterns:');
  console.log('1. Batch inserts for performance (10-100x faster)');
  console.log('2. Implement retry logic for resilience');
  console.log('3. Use transactions for data integrity');
  console.log('4. Validate before inserting');
  console.log('5. Enrich data in pipeline');
  console.log('6. Use pipeline() for error handling');
  console.log('\nPerformance Tips:');
  console.log('• Batch size: 50-1000 records');
  console.log('• Use prepared statements');
  console.log('• Disable indexes during bulk insert');
  console.log('• Use connection pooling');
  console.log('• Monitor memory usage');
  console.log('\n✓ All examples completed!\n');
}

/**
 * PRODUCTION CONSIDERATIONS:
 *
 * 1. Connection Management:
 *    - Use connection pooling
 *    - Handle connection failures
 *    - Implement reconnection logic
 *
 * 2. Transaction Handling:
 *    - Use transactions for batches
 *    - Rollback on errors
 *    - Implement savepoints
 *
 * 3. Error Handling:
 *    - Retry transient errors
 *    - Log failed records
 *    - Dead letter queue for failures
 *
 * 4. Performance:
 *    - Tune batch size
 *    - Use bulk insert APIs
 *    - Disable constraints temporarily
 *    - Monitor query performance
 *
 * 5. Monitoring:
 *    - Track insert rate
 *    - Monitor database load
 *    - Alert on failures
 */
