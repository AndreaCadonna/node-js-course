/**
 * Exercise 2: File-Based Key-Value Database
 *
 * DIFFICULTY: ⭐⭐⭐ Advanced
 * TIME: 35-45 minutes
 *
 * OBJECTIVE:
 * Build a simple but efficient key-value database that stores data in files
 * using file descriptors for precise control and performance.
 *
 * REQUIREMENTS:
 * 1. Store key-value pairs in a single data file
 * 2. Use fixed-size records for efficient random access
 * 3. Implement: set(key, value), get(key), delete(key), list()
 * 4. Maintain an index file for quick lookups
 * 5. Handle concurrent access with file locking
 * 6. Support transactions (commit/rollback)
 * 7. Implement compaction to reclaim deleted space
 * 8. Persist data durably (fsync)
 *
 * RECORD FORMAT:
 * - Record size: 1024 bytes
 * - Layout: [status:1][key:255][value:768]
 * - Status: 0 = deleted, 1 = active
 *
 * INDEX FORMAT:
 * - Map of key → file position
 * - Stored as JSON
 * - Loaded on startup
 *
 * EXAMPLE USAGE:
 * const db = new FileDB('./data');
 * await db.open();
 *
 * await db.set('user:1', '{"name":"Alice","age":30}');
 * const value = await db.get('user:1');
 * await db.delete('user:1');
 * const keys = await db.list();
 *
 * await db.compact(); // Remove deleted records
 * await db.close();
 *
 * BONUS CHALLENGES:
 * - Add TTL (time-to-live) for keys
 * - Implement range queries
 * - Add secondary indexes
 * - Support batch operations
 * - Implement write-ahead logging (WAL)
 * - Add compression for values
 * - Multi-version concurrency control (MVCC)
 * - Replication to secondary file
 *
 * HINTS:
 * - Use fs.open() with file descriptors
 * - Calculate position: recordNumber * RECORD_SIZE
 * - Use Buffer for fixed-size records
 * - Implement FileLock class for concurrency
 * - Use rename for atomic index updates
 */

const fs = require('fs').promises;
const path = require('path');

const RECORD_SIZE = 1024;
const KEY_SIZE = 255;
const VALUE_SIZE = 768;

// TODO: Implement your solution here

/**
 * File-based key-value database
 */
class FileDB {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.dataFile = path.join(dataDir, 'data.db');
    this.indexFile = path.join(dataDir, 'index.json');
    this.lockFile = path.join(dataDir, 'db.lock');

    this.fd = null;
    this.index = new Map(); // key → position
    this.nextPosition = 0;
    this.lock = null;
  }

  async open() {
    // TODO:
    // 1. Create data directory
    // 2. Acquire lock
    // 3. Open data file
    // 4. Load index
    // 5. Calculate next position
  }

  async close() {
    // TODO:
    // 1. Save index
    // 2. Close file descriptor
    // 3. Release lock
  }

  async set(key, value) {
    // TODO:
    // 1. Validate key and value sizes
    // 2. Create record buffer
    // 3. Write to file
    // 4. Update index
    // 5. Sync to disk
  }

  async get(key) {
    // TODO:
    // 1. Look up position in index
    // 2. Read record from file
    // 3. Parse and return value
  }

  async delete(key) {
    // TODO:
    // 1. Find record position
    // 2. Mark as deleted (set status to 0)
    // 3. Update index
  }

  async list() {
    // TODO: Return all active keys
  }

  async compact() {
    // TODO:
    // 1. Create temporary file
    // 2. Copy active records
    // 3. Atomically replace old file
    // 4. Rebuild index
  }

  // Helper methods

  createRecord(key, value, status = 1) {
    // TODO: Create fixed-size record buffer
  }

  parseRecord(buffer) {
    // TODO: Parse buffer into { status, key, value }
  }

  async loadIndex() {
    // TODO: Load index from file
  }

  async saveIndex() {
    // TODO: Save index atomically
  }

  async acquireLock() {
    // TODO: Implement file-based locking
  }

  async releaseLock() {
    // TODO: Release lock
  }
}

/**
 * Transaction support
 */
class Transaction {
  constructor(db) {
    this.db = db;
    this.operations = [];
    this.committed = false;
  }

  async set(key, value) {
    // TODO: Queue operation
  }

  async commit() {
    // TODO: Execute all operations
  }

  async rollback() {
    // TODO: Discard operations
  }
}

/**
 * Testing and demonstration
 */
async function testDatabase() {
  console.log('File-Based Database Test\n');
  console.log('='.repeat(50));

  const dbPath = path.join(__dirname, 'test-db');
  const db = new FileDB(dbPath);

  try {
    // Test basic operations
    console.log('\n1. Basic Operations');
    console.log('-'.repeat(50));

    await db.open();
    console.log('✓ Database opened');

    await db.set('user:1', '{"name":"Alice","age":30}');
    await db.set('user:2', '{"name":"Bob","age":25}');
    await db.set('config', '{"theme":"dark","lang":"en"}');

    console.log('✓ Records written');

    const user1 = await db.get('user:1');
    console.log(`User 1: ${user1}`);

    const keys = await db.list();
    console.log(`Keys: ${keys.join(', ')}`);

    await db.delete('user:2');
    console.log('✓ Record deleted');

    // Test compaction
    console.log('\n2. Compaction');
    console.log('-'.repeat(50));

    await db.compact();
    console.log('✓ Database compacted');

    await db.close();
    console.log('✓ Database closed');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

// testDatabase();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Basic test:
 *    node exercise-2.js
 *
 * 2. Stress test:
 *    - Insert 10,000 records
 *    - Delete 5,000 records
 *    - Compact database
 *    - Verify remaining 5,000 records
 *
 * 3. Concurrent test:
 *    - Run multiple processes
 *    - Each tries to acquire lock
 *    - Verify only one succeeds
 *
 * 4. Crash recovery:
 *    - Write records
 *    - Kill process
 *    - Restart and verify data
 */

/**
 * RECORD BUFFER EXAMPLE:
 *
 * function createRecord(key, value, status = 1) {
 *   const buffer = Buffer.alloc(RECORD_SIZE);
 *
 *   buffer.writeUInt8(status, 0);
 *   buffer.write(key, 1, KEY_SIZE, 'utf8');
 *   buffer.write(value, 1 + KEY_SIZE, VALUE_SIZE, 'utf8');
 *
 *   return buffer;
 * }
 */

/**
 * FILE DESCRIPTOR READ EXAMPLE:
 *
 * const buffer = Buffer.alloc(RECORD_SIZE);
 * const position = recordNumber * RECORD_SIZE;
 *
 * await fd.read(buffer, 0, RECORD_SIZE, position);
 * const record = parseRecord(buffer);
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - Why use fixed-size records?
 * - How does random access work with file descriptors?
 * - What are the trade-offs of file-based vs in-memory databases?
 * - How do you ensure data durability?
 * - Why is compaction necessary?
 */
