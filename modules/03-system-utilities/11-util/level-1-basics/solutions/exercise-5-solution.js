/**
 * Exercise 5 Solution: Module Migration - Callback to Promises
 *
 * This solution demonstrates:
 * - Migrating legacy callback-based code to modern Promises
 * - Using util.promisify for automatic conversion
 * - Handling complex callback patterns
 * - Maintaining backward compatibility
 * - Comparing old vs new patterns
 */

const util = require('util');

/**
 * PART 1: LEGACY MODULE (Callback-based)
 * This represents old code that needs to be modernized
 */

class LegacyDatabase {
  constructor() {
    this.data = new Map();
    this.connected = false;
  }

  /**
   * Connect to database (callback version)
   */
  connect(callback) {
    console.log('  [Legacy] Connecting...');

    setTimeout(() => {
      this.connected = true;
      console.log('  [Legacy] Connected');
      callback(null);
    }, 100);
  }

  /**
   * Insert data (callback version)
   */
  insert(key, value, callback) {
    setTimeout(() => {
      if (!this.connected) {
        return callback(new Error('Not connected to database'));
      }

      if (this.data.has(key)) {
        return callback(new Error(`Key '${key}' already exists`));
      }

      this.data.set(key, value);
      console.log(`  [Legacy] Inserted: ${key}`);
      callback(null, { key, value, created: true });
    }, 50);
  }

  /**
   * Find data (callback version)
   */
  find(key, callback) {
    setTimeout(() => {
      if (!this.connected) {
        return callback(new Error('Not connected to database'));
      }

      const value = this.data.get(key);
      if (!value) {
        return callback(null, null); // Not found, but not an error
      }

      console.log(`  [Legacy] Found: ${key}`);
      callback(null, value);
    }, 50);
  }

  /**
   * Update data (callback version)
   */
  update(key, value, callback) {
    setTimeout(() => {
      if (!this.connected) {
        return callback(new Error('Not connected to database'));
      }

      if (!this.data.has(key)) {
        return callback(new Error(`Key '${key}' not found`));
      }

      this.data.set(key, value);
      console.log(`  [Legacy] Updated: ${key}`);
      callback(null, { key, value, updated: true });
    }, 50);
  }

  /**
   * Delete data (callback version)
   */
  delete(key, callback) {
    setTimeout(() => {
      if (!this.connected) {
        return callback(new Error('Not connected to database'));
      }

      const existed = this.data.delete(key);
      if (!existed) {
        return callback(new Error(`Key '${key}' not found`));
      }

      console.log(`  [Legacy] Deleted: ${key}`);
      callback(null, true);
    }, 50);
  }

  /**
   * Find all (callback version)
   */
  findAll(callback) {
    setTimeout(() => {
      if (!this.connected) {
        return callback(new Error('Not connected to database'));
      }

      const results = Array.from(this.data.entries()).map(([key, value]) => ({
        key,
        value
      }));

      console.log(`  [Legacy] Found ${results.length} records`);
      callback(null, results);
    }, 50);
  }

  /**
   * Disconnect (callback version)
   */
  disconnect(callback) {
    setTimeout(() => {
      this.connected = false;
      this.data.clear();
      console.log('  [Legacy] Disconnected');
      callback(null);
    }, 50);
  }
}

/**
 * PART 2: MODERN MODULE (Promise-based)
 * This is the migrated version using Promises
 */

class ModernDatabase {
  constructor() {
    this.legacy = new LegacyDatabase();

    // Promisify all legacy methods
    // IMPORTANT: Use .bind() to preserve 'this' context
    this.connect = util.promisify(this.legacy.connect.bind(this.legacy));
    this.insert = util.promisify(this.legacy.insert.bind(this.legacy));
    this.find = util.promisify(this.legacy.find.bind(this.legacy));
    this.update = util.promisify(this.legacy.update.bind(this.legacy));
    this.delete = util.promisify(this.legacy.delete.bind(this.legacy));
    this.findAll = util.promisify(this.legacy.findAll.bind(this.legacy));
    this.disconnect = util.promisify(this.legacy.disconnect.bind(this.legacy));
  }

  /**
   * Initialize database (connect + setup)
   */
  async initialize() {
    console.log('  [Modern] Initializing...');
    await this.connect();
    console.log('  [Modern] Initialized successfully');
  }

  /**
   * Save - Update if exists, insert if not
   */
  async save(key, value) {
    try {
      // Try to update first
      return await this.update(key, value);
    } catch (err) {
      // If not found, insert
      if (err.message.includes('not found')) {
        return await this.insert(key, value);
      }
      throw err;
    }
  }

  /**
   * Get all data as object
   */
  async getAll() {
    const results = await this.findAll();
    const obj = {};
    results.forEach(({ key, value }) => {
      obj[key] = value;
    });
    return obj;
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    const result = await this.find(key);
    return result !== null;
  }

  /**
   * Cleanup - Delete all and disconnect
   */
  async cleanup() {
    console.log('  [Modern] Cleaning up...');
    await this.disconnect();
    console.log('  [Modern] Cleanup complete');
  }

  /**
   * Batch insert
   */
  async insertMany(items) {
    const results = [];
    for (const { key, value } of items) {
      const result = await this.insert(key, value);
      results.push(result);
    }
    return results;
  }

  /**
   * Find multiple keys
   */
  async findMany(keys) {
    const promises = keys.map(key => this.find(key));
    return await Promise.all(promises);
  }
}

/**
 * PART 3: TESTING
 */

/**
 * Test 1: Legacy version (callback hell)
 */
async function testLegacyVersion() {
  console.log('=== Testing Legacy (Callback) Version ===\n');

  const db = new LegacyDatabase();

  // Callback hell example
  db.connect((err) => {
    if (err) {
      console.error('Connection error:', err);
      return;
    }

    db.insert('user1', { name: 'John Doe', email: 'john@example.com' }, (err, result) => {
      if (err) {
        console.error('Insert error:', err);
        return;
      }

      console.log('  Inserted:', result);

      db.find('user1', (err, data) => {
        if (err) {
          console.error('Find error:', err);
          return;
        }

        console.log('  Found:', data);

        db.update('user1', { name: 'John Doe', email: 'john.doe@example.com' }, (err, result) => {
          if (err) {
            console.error('Update error:', err);
            return;
          }

          console.log('  Updated:', result);

          db.delete('user1', (err) => {
            if (err) {
              console.error('Delete error:', err);
              return;
            }

            console.log('  Deleted successfully');

            db.disconnect((err) => {
              if (err) {
                console.error('Disconnect error:', err);
                return;
              }

              console.log('  Test complete\n');
            });
          });
        });
      });
    });
  });

  // Wait for async operations
  await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Test 2: Modern version (clean async/await)
 */
async function testModernVersion() {
  console.log('=== Testing Modern (Promise) Version ===\n');

  const db = new ModernDatabase();

  try {
    // Connect
    await db.initialize();

    // Insert
    const inserted = await db.insert('user1', {
      name: 'John Doe',
      email: 'john@example.com'
    });
    console.log('  Inserted:', inserted);

    // Find
    const found = await db.find('user1');
    console.log('  Found:', found);

    // Update
    const updated = await db.update('user1', {
      name: 'John Doe',
      email: 'john.doe@example.com'
    });
    console.log('  Updated:', updated);

    // Save (upsert)
    await db.save('user2', { name: 'Jane Doe' });
    console.log('  Saved user2');

    // Check exists
    const exists = await db.exists('user1');
    console.log('  User1 exists:', exists);

    // Get all
    const all = await db.getAll();
    console.log('  All data:', all);

    // Delete
    await db.delete('user1');
    console.log('  Deleted user1');

    // Cleanup
    await db.cleanup();
    console.log('  Test complete\n');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

/**
 * Test 3: Side-by-side comparison
 */
async function compareVersions() {
  console.log('=== Side-by-Side Comparison ===\n');

  console.log('LEGACY (Callback-based):');
  console.log('─'.repeat(50));
  console.log(`
db.connect((err) => {
  if (err) return console.error(err);

  db.insert('key', value, (err, result) => {
    if (err) return console.error(err);

    db.find('key', (err, data) => {
      if (err) return console.error(err);
      console.log(data);

      db.disconnect((err) => {
        if (err) return console.error(err);
      });
    });
  });
});
  `);

  console.log('MODERN (Promise-based):');
  console.log('─'.repeat(50));
  console.log(`
try {
  await db.connect();
  const result = await db.insert('key', value);
  const data = await db.find('key');
  console.log(data);
  await db.disconnect();
} catch (err) {
  console.error(err);
}
  `);

  console.log('BENEFITS:');
  console.log('─'.repeat(50));
  console.log('✓ 60% fewer lines of code');
  console.log('✓ No nested callbacks (no callback hell)');
  console.log('✓ Centralized error handling with try-catch');
  console.log('✓ Easier to read and maintain');
  console.log('✓ Can use Promise.all for parallel operations');
  console.log('✓ Better debugging with stack traces');
  console.log();
}

/**
 * Test 4: Error handling comparison
 */
async function testErrorHandling() {
  console.log('=== Error Handling Comparison ===\n');

  // Legacy error handling
  console.log('--- Legacy: Multiple error checks ---');
  const legacyDb = new LegacyDatabase();

  legacyDb.find('nonexistent', (err, data) => {
    if (err) {
      console.log('  ✗ Error in callback:', err.message);
      return;
    }
    console.log('  Data:', data);
  });

  await new Promise(resolve => setTimeout(resolve, 100));

  // Modern error handling
  console.log('\n--- Modern: Single try-catch ---');
  const modernDb = new ModernDatabase();

  try {
    await modernDb.connect();
    const data = await modernDb.find('nonexistent');
    console.log('  Data:', data); // null (not found, but not error)

    // This will throw an error
    await modernDb.delete('nonexistent');
  } catch (err) {
    console.log('  ✓ Error caught in try-catch:', err.message);
  } finally {
    await modernDb.disconnect();
  }
}

/**
 * Test 5: Advanced patterns
 */
async function testAdvancedPatterns() {
  console.log('\n=== Advanced Patterns ===\n');

  const db = new ModernDatabase();

  try {
    await db.initialize();

    // Parallel operations with Promise.all
    console.log('--- Parallel Inserts ---');
    await Promise.all([
      db.insert('user1', { name: 'Alice' }),
      db.insert('user2', { name: 'Bob' }),
      db.insert('user3', { name: 'Charlie' })
    ]);
    console.log('  ✓ Inserted 3 users in parallel');

    // Sequential operations
    console.log('\n--- Sequential Operations ---');
    const users = ['user1', 'user2', 'user3'];
    for (const key of users) {
      const user = await db.find(key);
      console.log(`  Found ${key}:`, user);
    }

    // Batch operations
    console.log('\n--- Batch Operations ---');
    const items = [
      { key: 'product1', value: { name: 'Laptop' } },
      { key: 'product2', value: { name: 'Phone' } }
    ];
    await db.insertMany(items);
    console.log('  ✓ Batch inserted 2 products');

    // Find multiple
    const products = await db.findMany(['product1', 'product2']);
    console.log('  Found products:', products);

    await db.cleanup();

  } catch (err) {
    console.error('Error:', err.message);
  }
}

/**
 * Migration guide
 */
function displayMigrationGuide() {
  console.log('\n=== Migration Guide ===\n');

  console.log('STEP 1: Promisify methods');
  console.log('─'.repeat(50));
  console.log(`
const util = require('util');

// Before
class LegacyDB {
  query(sql, callback) { ... }
}

// After
class ModernDB {
  constructor() {
    this.legacy = new LegacyDB();
    this.query = util.promisify(
      this.legacy.query.bind(this.legacy)
    );
  }
}
  `);

  console.log('STEP 2: Add async/await');
  console.log('─'.repeat(50));
  console.log(`
// Before
function getUser(id, callback) {
  db.query('SELECT * FROM users WHERE id = ?', [id], callback);
}

// After
async function getUser(id) {
  return await db.query('SELECT * FROM users WHERE id = ?', [id]);
}
  `);

  console.log('STEP 3: Handle errors');
  console.log('─'.repeat(50));
  console.log(`
// Before
getUser(1, (err, user) => {
  if (err) return handleError(err);
  processUser(user, (err) => {
    if (err) return handleError(err);
    done();
  });
});

// After
try {
  const user = await getUser(1);
  await processUser(user);
  done();
} catch (err) {
  handleError(err);
}
  `);

  console.log('BEST PRACTICES:');
  console.log('─'.repeat(50));
  console.log('1. Promisify at module level, not per call');
  console.log('2. Always bind context when promisifying methods');
  console.log('3. Use try-catch for error handling');
  console.log('4. Maintain backward compatibility if needed');
  console.log('5. Test both success and error paths');
  console.log('6. Consider using Promise.all for parallel ops');
  console.log();
}

/**
 * Main execution
 */
async function runAllTests() {
  await testLegacyVersion();
  await testModernVersion();
  compareVersions();
  await testErrorHandling();
  await testAdvancedPatterns();
  displayMigrationGuide();
}

// Run the tests
runAllTests();

/**
 * KEY LEARNING POINTS:
 *
 * 1. Callback Hell Problem:
 *    - Deeply nested callbacks
 *    - Hard to read and maintain
 *    - Error handling scattered
 *    - Difficult to debug
 *
 * 2. Promise Benefits:
 *    - Flat structure with async/await
 *    - Centralized error handling
 *    - Easier composition
 *    - Better debugging
 *
 * 3. util.promisify:
 *    - Converts (err, result) callbacks to Promises
 *    - Must bind context for methods
 *    - Works with standard Node.js callbacks
 *    - Can use custom symbol for special cases
 *
 * 4. Migration Strategy:
 *    - Promisify existing methods
 *    - Add convenience methods
 *    - Maintain backward compatibility
 *    - Test thoroughly
 *
 * 5. Advanced Patterns:
 *    - Promise.all for parallel ops
 *    - Sequential with for/await
 *    - Error handling with try-catch
 *    - Cleanup with finally
 */

/**
 * COMMON MISTAKES TO AVOID:
 *
 * ❌ Forgetting to bind context:
 *    util.promisify(obj.method) // Loses 'this'
 *
 * ✅ Always bind:
 *    util.promisify(obj.method.bind(obj))
 *
 * ❌ Not handling errors:
 *    await riskyOperation(); // Will crash
 *
 * ✅ Use try-catch:
 *    try { await riskyOperation(); } catch (err) { ... }
 *
 * ❌ Promisifying non-standard callbacks:
 *    callback(result) // No error parameter
 *
 * ✅ Use custom promisification
 *
 * ❌ Breaking backward compatibility:
 *    Remove all callback methods
 *
 * ✅ Support both patterns during transition
 */

/**
 * GOING FURTHER:
 *
 * Try these challenges:
 * 1. Add transaction support with rollback
 * 2. Implement connection pooling
 * 3. Add caching layer
 * 4. Create migration script for entire codebase
 * 5. Build backward-compatible dual API (callbacks + promises)
 * 6. Add retry logic for failed operations
 * 7. Implement query builder with promises
 */
