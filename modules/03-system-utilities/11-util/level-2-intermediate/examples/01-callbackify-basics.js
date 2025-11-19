/**
 * Example 1: util.callbackify() Basics
 *
 * Learn how to convert promise-based functions back to callback-based ones
 * using util.callbackify(). This is the reverse of promisify and is useful
 * for maintaining backward compatibility when modernizing APIs.
 *
 * Key Concepts:
 * - Converting async functions to callback style
 * - Maintaining backward compatibility
 * - Error handling in callbackified functions
 * - When and why to use callbackify
 */

const util = require('util');

// ===== EXAMPLE 1: Basic Callbackify =====
console.log('=== Example 1: Basic Callbackify ===\n');

// Modern promise-based function
async function fetchUserData(userId) {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));

  if (!userId) {
    throw new Error('User ID is required');
  }

  return {
    id: userId,
    name: 'Alice',
    email: 'alice@example.com'
  };
}

// Convert to callback style for backward compatibility
const fetchUserDataCallback = util.callbackify(fetchUserData);

// Now it can be used with callbacks
fetchUserDataCallback(1, (err, data) => {
  if (err) {
    console.error('❌ Callback Error:', err.message);
    return;
  }
  console.log('✓ Callback Result:', data);
});

// Original promise version still works
fetchUserData(2).then(data => {
  console.log('✓ Promise Result:', data);
});

// ===== EXAMPLE 2: Error Handling =====
console.log('\n=== Example 2: Error Handling ===\n');

async function divideNumbers(a, b) {
  await new Promise(resolve => setTimeout(resolve, 50));

  if (b === 0) {
    throw new Error('Division by zero');
  }

  return a / b;
}

const divideCallback = util.callbackify(divideNumbers);

// Success case
divideCallback(10, 2, (err, result) => {
  if (err) {
    console.error('Error:', err.message);
    return;
  }
  console.log('✓ 10 / 2 =', result);
});

// Error case - rejection becomes callback error
divideCallback(10, 0, (err, result) => {
  if (err) {
    console.error('✓ Error caught:', err.message);
    return;
  }
  console.log('Result:', result);
});

// ===== EXAMPLE 3: Multiple Arguments =====
console.log('\n=== Example 3: Functions with Multiple Arguments ===\n');

async function calculateStats(numbers) {
  await new Promise(resolve => setTimeout(resolve, 50));

  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new Error('Invalid input: expected non-empty array');
  }

  const sum = numbers.reduce((a, b) => a + b, 0);
  const avg = sum / numbers.length;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  // Return object with multiple values
  return { sum, avg, min, max };
}

const calculateStatsCallback = util.callbackify(calculateStats);

calculateStatsCallback([1, 2, 3, 4, 5], (err, stats) => {
  if (err) {
    console.error('Error:', err.message);
    return;
  }
  console.log('✓ Statistics:', stats);
  console.log('  Sum:', stats.sum);
  console.log('  Average:', stats.avg);
  console.log('  Min:', stats.min);
  console.log('  Max:', stats.max);
});

// ===== EXAMPLE 4: Dual API Pattern =====
console.log('\n=== Example 4: Dual API Support ===\n');

// Modern implementation with promises
async function readConfig(filename) {
  await new Promise(resolve => setTimeout(resolve, 50));

  // Simulate reading config
  return {
    filename,
    data: {
      port: 3000,
      host: 'localhost'
    }
  };
}

// Attach callback version as a property
readConfig.callback = util.callbackify(readConfig);

// Users can choose their preferred style
console.log('Promise style:');
readConfig('config.json').then(config => {
  console.log('✓ Config loaded:', config.data);
});

console.log('\nCallback style:');
readConfig.callback('config.json', (err, config) => {
  if (err) {
    console.error('Error:', err.message);
    return;
  }
  console.log('✓ Config loaded:', config.data);
});

// ===== EXAMPLE 5: Real-World Database Scenario =====
console.log('\n=== Example 5: Database API Migration ===\n');

// New promise-based implementation
class Database {
  async query(sql, params = []) {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 100));

    if (!sql) {
      throw new Error('SQL query is required');
    }

    // Simulate results
    return {
      rows: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
      rowCount: 2
    };
  }

  async insert(table, data) {
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      id: Math.floor(Math.random() * 1000),
      ...data
    };
  }
}

// Create both versions for backward compatibility
const db = new Database();

// Modern promise API
const queryPromise = db.query.bind(db);
const insertPromise = db.insert.bind(db);

// Legacy callback API
const queryCallback = util.callbackify(db.query.bind(db));
const insertCallback = util.callbackify(db.insert.bind(db));

// Export both
module.exports = {
  // Modern API
  query: queryPromise,
  insert: insertPromise,

  // Legacy API (deprecated but still supported)
  queryCallback,
  insertCallback
};

// Test both APIs
console.log('Using promise API:');
queryPromise('SELECT * FROM users').then(result => {
  console.log('✓ Found', result.rowCount, 'users');
});

console.log('\nUsing callback API (legacy):');
queryCallback('SELECT * FROM users', [], (err, result) => {
  if (err) {
    console.error('Error:', err.message);
    return;
  }
  console.log('✓ Found', result.rowCount, 'users');
});

/**
 * Important Notes:
 *
 * 1. When to Use Callbackify:
 *    ✅ Maintaining backward compatibility during API migration
 *    ✅ Supporting legacy code that expects callbacks
 *    ✅ Gradual transition from callbacks to promises
 *    ❌ Not for new APIs (choose one style)
 *    ❌ Not for performance-critical code (adds overhead)
 *
 * 2. How It Works:
 *    - Wraps the async function
 *    - Promise resolution → callback(null, result)
 *    - Promise rejection → callback(error)
 *    - Follows Node.js callback convention
 *
 * 3. Error Handling:
 *    - Promise rejections become callback errors
 *    - Always check error parameter first
 *    - Error is always first argument (null on success)
 *
 * 4. Best Practices:
 *    - Create callbackified version once, not in loops
 *    - Use .bind() to preserve context
 *    - Document that callback version is for legacy support
 *    - Consider deprecating callback version eventually
 *
 * 5. Dual API Pattern:
 *    - Implement in promises (modern)
 *    - Export callback version separately
 *    - Mark callback version as legacy
 *    - Plan deprecation timeline
 */

/**
 * Try This:
 *
 * 1. Create an async function that returns user profile and callbackify it
 * 2. Implement a dual API for file operations
 * 3. Compare performance between promise and callbackified versions
 * 4. Build a migration guide for users moving from callbacks to promises
 * 5. Handle edge cases like undefined return values
 */
