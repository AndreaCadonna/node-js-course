/**
 * Exercise 5: Module Migration - Callback to Promises
 *
 * DIFFICULTY: ⭐⭐⭐ Hard
 * TIME: 30-45 minutes
 *
 * OBJECTIVE:
 * Migrate a complete callback-based module to Promises using util.promisify
 * and modern async/await patterns. This simulates real-world legacy code migration.
 *
 * REQUIREMENTS:
 * 1. Create a legacy callback-based database module with multiple methods
 * 2. Create a modern Promise-based version using util.promisify
 * 3. Handle complex scenarios (multiple callbacks, custom callback signatures)
 * 4. Implement error handling for both versions
 * 5. Demonstrate usage of both old and new versions side by side
 *
 * BONUS CHALLENGES:
 * - Add connection pooling to the new version
 * - Implement transaction support with rollback
 * - Create a migration guide documenting the changes
 *
 * HINTS:
 * - Some functions may need custom promisification
 * - Use util.promisify.custom symbol for special cases
 * - Consider backward compatibility when migrating
 */

const util = require('util');

/**
 * LEGACY MODULE (Callback-based)
 * This represents old code that needs to be modernized
 */

// TODO 1: Create legacy database module
class LegacyDatabase {
  constructor() {
    this.data = new Map();
    this.connected = false;
  }

  // Connect to database (callback version)
  connect(callback) {
    // Your code here:
    // Simulate connection delay
    // Call callback(error) or callback(null)
    setTimeout(() => {
      this.connected = true;
      callback(null);
    }, 100);
  }

  // Insert data (callback version)
  insert(key, value, callback) {
    // Your code here:
    // Check if connected
    // Insert data
    // Call callback(error) or callback(null, result)
  }

  // Find data (callback version)
  find(key, callback) {
    // Your code here:
    // Check if connected
    // Find data
    // Call callback(error, data) or callback(null, null) if not found
  }

  // Update data (callback version)
  update(key, value, callback) {
    // Your code here:
    // Check if connected and key exists
    // Update data
    // Call callback(error) or callback(null, updatedValue)
  }

  // Delete data (callback version)
  delete(key, callback) {
    // Your code here:
    // Check if connected and key exists
    // Delete data
    // Call callback(error) or callback(null, success)
  }

  // Find all (callback version)
  findAll(callback) {
    // Your code here:
    // Return all data as array
    // Call callback(error, data)
  }

  // Disconnect (callback version)
  disconnect(callback) {
    // Your code here:
    // Close connection
    // Call callback(error) or callback(null)
  }
}

/**
 * MODERN MODULE (Promise-based)
 * This is the migrated version using Promises
 */

// TODO 2: Create modern database module
class ModernDatabase {
  constructor() {
    this.legacy = new LegacyDatabase();

    // Your code here:
    // Promisify all legacy methods
    // Examples:
    // this.connect = util.promisify(this.legacy.connect.bind(this.legacy));
    // this.insert = util.promisify(this.legacy.insert.bind(this.legacy));
    // etc.
  }

  // TODO 3: Add convenience methods using async/await
  async initialize() {
    // Your code here:
    // Connect and perform any setup
  }

  async save(key, value) {
    // Your code here:
    // Try to update, if not exists then insert
  }

  async getAll() {
    // Your code here:
    // Return all data as object/map
  }

  async exists(key) {
    // Your code here:
    // Check if key exists
  }

  async cleanup() {
    // Your code here:
    // Clear all data and disconnect
  }
}

// TODO 4: Test legacy version
async function testLegacyVersion() {
  console.log('=== Testing Legacy (Callback) Version ===\n');

  // Your code here:
  // Create instance
  // Connect (with callback)
  // Perform CRUD operations (with callbacks)
  // Show callback hell
  // Handle errors
  // Disconnect
}

// TODO 5: Test modern version
async function testModernVersion() {
  console.log('\n=== Testing Modern (Promise) Version ===\n');

  // Your code here:
  // Create instance
  // Use async/await for all operations
  // Show clean, readable code
  // Use try-catch for errors
  // Demonstrate convenience methods
}

// TODO 6: Compare both versions
async function compareVersions() {
  console.log('\n=== Side-by-Side Comparison ===\n');

  // Your code here:
  // Show the same operation in both versions
  // Highlight differences in readability
  // Discuss error handling differences
}

// TODO 7: Migration guide
function displayMigrationGuide() {
  console.log('\n=== Migration Guide ===\n');

  console.log(`
BEFORE (Callback-based):
────────────────────────────────────────
db.connect((err) => {
  if (err) return console.error(err);

  db.insert('user1', { name: 'John' }, (err, result) => {
    if (err) return console.error(err);

    db.find('user1', (err, data) => {
      if (err) return console.error(err);
      console.log(data);
    });
  });
});

AFTER (Promise-based):
────────────────────────────────────────
try {
  await db.connect();
  const result = await db.insert('user1', { name: 'John' });
  const data = await db.find('user1');
  console.log(data);
} catch (err) {
  console.error(err);
}
  `);

  // Your code here:
  // Add more examples and best practices
}

// Uncomment to run:
// testLegacyVersion();
// testModernVersion();
// compareVersions();
// displayMigrationGuide();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Run your solution:
 *    node exercise-5.js
 *
 * 2. Verify:
 *    - Legacy version works with callbacks
 *    - Modern version works with async/await
 *    - Both handle errors properly
 *    - Modern version is more readable
 *
 * 3. Test scenarios:
 *    - Successful operations
 *    - Error conditions
 *    - Multiple sequential operations
 *    - Connection handling
 *
 * EXAMPLE OUTPUT:
 * ───────────────────────────────────────
 * === Testing Legacy (Callback) Version ===
 *
 * Connecting...
 * Connected successfully
 * Inserted: user1
 * Found: { name: 'John', email: 'john@example.com' }
 * Updated: user1
 * Deleted: user1
 * Disconnected
 *
 * === Testing Modern (Promise) Version ===
 *
 * Initializing...
 * Initialized successfully
 * Saved: user1
 * Found: { name: 'John', email: 'john@example.com' }
 * Exists: user1 = true
 * All data: [user1, user2, user3]
 * Cleaned up
 *
 * === Side-by-Side Comparison ===
 *
 * Readability: Modern version is 60% more concise
 * Error handling: Centralized with try-catch
 * Maintainability: Easier to modify and extend
 * ───────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - What are the main benefits of Promises over callbacks?
 * - How does util.promisify handle different callback signatures?
 * - What is callback hell and how do Promises solve it?
 * - When would you NOT use promisify?
 * - What are the challenges in migrating legacy code?
 */
