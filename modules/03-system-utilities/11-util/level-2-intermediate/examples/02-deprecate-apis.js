/**
 * Example 2: API Deprecation with util.deprecate()
 *
 * Learn how to deprecate functions and APIs professionally using util.deprecate().
 * This is essential for evolving APIs while maintaining backward compatibility
 * and guiding users to new implementations.
 *
 * Key Concepts:
 * - Wrapping functions with deprecation warnings
 * - Creating helpful deprecation messages
 * - Using deprecation codes
 * - Planning migration paths
 */

const util = require('util');

// ===== EXAMPLE 1: Basic Deprecation =====
console.log('=== Example 1: Basic Deprecation ===\n');

// Old implementation
function oldCalculate(a, b) {
  return a + b;
}

// New improved implementation
function calculate(a, b, operation = 'add') {
  switch (operation) {
    case 'add': return a + b;
    case 'subtract': return a - b;
    case 'multiply': return a * b;
    case 'divide': return a / b;
    default: throw new Error('Invalid operation');
  }
}

// Deprecate the old function
const deprecatedCalculate = util.deprecate(
  oldCalculate,
  'oldCalculate() is deprecated. Use calculate(a, b, "add") instead.'
);

// Assign it to the old name
const oldCalculateExport = deprecatedCalculate;

console.log('Calling deprecated function:');
const result1 = oldCalculateExport(5, 3);
console.log('Result:', result1);
// Shows warning: (node:12345) DeprecationWarning: oldCalculate() is deprecated...

console.log('\nCalling new function:');
const result2 = calculate(5, 3, 'multiply');
console.log('Result:', result2);
// No warning

// ===== EXAMPLE 2: Deprecation with Codes =====
console.log('\n=== Example 2: Deprecation with Codes ===\n');

// Old API
function getUserByName(name) {
  return { id: 1, name };
}

// New API
function getUserById(id) {
  return { id, name: 'User' + id };
}

// Deprecate with code for tracking
const deprecatedGetUserByName = util.deprecate(
  getUserByName,
  'getUserByName() is deprecated. Use getUserById() instead.',
  'DEP0001' // Deprecation code for documentation
);

console.log('Using deprecated API:');
const user = deprecatedGetUserByName('Alice');
console.log('User:', user);
// Shows: [DEP0001] DeprecationWarning: getUserByName() is deprecated...

// ===== EXAMPLE 3: Deprecating Function Parameters =====
console.log('\n=== Example 3: Deprecating Function Parameters ===\n');

// Function that had signature changes
function processData(data, options) {
  // Old: options.sync (deprecated)
  // New: options.async

  if (options && 'sync' in options) {
    const warnSync = util.deprecate(
      () => {},
      'options.sync is deprecated. Use options.async = false instead.',
      'DEP0002'
    );
    warnSync();

    // Convert old to new
    options.async = !options.sync;
  }

  const mode = options?.async !== false ? 'async' : 'sync';
  console.log(`Processing data in ${mode} mode`);

  return { processed: true, data };
}

// Old usage (triggers warning)
console.log('Old way (deprecated):');
processData({ value: 123 }, { sync: true });

// New usage (no warning)
console.log('\nNew way:');
processData({ value: 123 }, { async: false });

// ===== EXAMPLE 4: Deprecating Class Methods =====
console.log('\n=== Example 4: Deprecating Class Methods ===\n');

class DataStore {
  constructor() {
    this.data = new Map();
  }

  // Old method
  save(key, value) {
    this.data.set(key, value);
    return true;
  }

  // New method with validation
  set(key, value) {
    if (!key) throw new Error('Key is required');
    this.data.set(key, value);
    return this;
  }

  get(key) {
    return this.data.get(key);
  }
}

// Deprecate the save method
DataStore.prototype.save = util.deprecate(
  DataStore.prototype.save,
  'DataStore.save() is deprecated. Use DataStore.set() instead.',
  'DEP0003'
);

const store = new DataStore();

console.log('Using deprecated method:');
store.save('name', 'Alice');
// Shows deprecation warning

console.log('\nUsing new method:');
store.set('age', 30);
// No warning

console.log('Retrieved:', store.get('name'), store.get('age'));

// ===== EXAMPLE 5: Gradual Deprecation Strategy =====
console.log('\n=== Example 5: Gradual Deprecation Strategy ===\n');

// Version 1.0: Original API
function connectV1(host, port) {
  return { host, port, version: '1.0' };
}

// Version 2.0: Improved API (takes options object)
function connectV2(options) {
  return {
    host: options.host || 'localhost',
    port: options.port || 3000,
    ssl: options.ssl || false,
    version: '2.0'
  };
}

// Phase 1: Deprecate old signature but keep it working
function connect(hostOrOptions, port) {
  // Check if using old signature
  if (typeof hostOrOptions === 'string') {
    const warnOldSignature = util.deprecate(
      () => {},
      'connect(host, port) is deprecated. Use connect({ host, port }) instead.',
      'DEP0004'
    );
    warnOldSignature();

    // Convert to new format
    return connectV2({ host: hostOrOptions, port });
  }

  // New signature
  return connectV2(hostOrOptions);
}

console.log('Old signature (deprecated):');
const conn1 = connect('example.com', 8080);
console.log('Connection:', conn1);

console.log('\nNew signature:');
const conn2 = connect({ host: 'example.com', port: 8080, ssl: true });
console.log('Connection:', conn2);

// ===== EXAMPLE 6: Environment-Based Deprecation =====
console.log('\n=== Example 6: Environment-Based Deprecation ===\n');

// Custom deprecation that respects environment
function customDeprecate(fn, message, code) {
  // In production, only log once
  if (process.env.NODE_ENV === 'production') {
    let warned = false;
    return function(...args) {
      if (!warned) {
        console.warn(`[${code}] DeprecationWarning:`, message);
        warned = true;
      }
      return fn.apply(this, args);
    };
  }

  // In development, use standard deprecate
  return util.deprecate(fn, message, code);
}

// Old logging function
function oldLog(message) {
  console.log('[LOG]', message);
}

const deprecatedLog = customDeprecate(
  oldLog,
  'oldLog() is deprecated. Use console.log() directly.',
  'DEP0005'
);

console.log('Calling deprecated logger multiple times:');
deprecatedLog('First call');  // Shows warning
deprecatedLog('Second call'); // In production, won't warn again
deprecatedLog('Third call');  // In production, won't warn again

// ===== EXAMPLE 7: Deprecation with Migration Guide =====
console.log('\n=== Example 7: Deprecation with Migration Guide ===\n');

// Old configuration format
function loadOldConfig(path) {
  return {
    server: { host: 'localhost', port: 3000 },
    database: { host: 'localhost', port: 5432 }
  };
}

// New configuration format
function loadConfig(path) {
  return {
    services: {
      server: { host: 'localhost', port: 3000 },
      database: { host: 'localhost', port: 5432 }
    }
  };
}

// Detailed deprecation message
const deprecatedLoadConfig = util.deprecate(
  loadOldConfig,
  `loadOldConfig() is deprecated and will be removed in v3.0.0.

Migration guide:
  Old: const config = loadOldConfig(path);
       console.log(config.server);

  New: const config = loadConfig(path);
       console.log(config.services.server);

See: https://github.com/example/migration-guide.md`,
  'DEP0006'
);

console.log('Loading config with deprecated API:');
const config = deprecatedLoadConfig('config.json');
console.log('Config loaded');

/**
 * Important Notes:
 *
 * 1. Deprecation Best Practices:
 *    ✅ Provide clear alternative in message
 *    ✅ Use deprecation codes for tracking
 *    ✅ Include version when it will be removed
 *    ✅ Provide migration guide
 *    ✅ Give users time to migrate (multiple major versions)
 *    ❌ Don't deprecate without alternative
 *    ❌ Don't remove without warning period
 *
 * 2. Deprecation Messages Should Include:
 *    - What is deprecated
 *    - What to use instead
 *    - When it will be removed
 *    - Link to migration guide
 *
 * 3. Deprecation Codes:
 *    - Use consistent format (DEP0001, DEP0002, etc.)
 *    - Document all codes
 *    - Track in changelog
 *    - Reference in migration guides
 *
 * 4. Timing:
 *    - Phase 1: Add new API (v1.5)
 *    - Phase 2: Deprecate old API (v2.0)
 *    - Phase 3: Remove old API (v3.0)
 *    - Minimum 1 major version between deprecation and removal
 *
 * 5. Testing:
 *    - Test both old and new APIs
 *    - Verify warnings appear
 *    - Check migration paths work
 *    - Use --no-deprecation flag in tests if needed
 */

/**
 * Try This:
 *
 * 1. Deprecate a function parameter while keeping it functional
 * 2. Create a deprecation that suggests multiple alternatives
 * 3. Build a deprecation tracking system
 * 4. Implement staged deprecation (warning → error → removal)
 * 5. Create a tool to scan code for deprecated API usage
 */

/**
 * Controlling Deprecation Warnings:
 *
 * Environment variables:
 * - NODE_NO_WARNINGS=1          # Suppress all warnings
 * - --no-deprecation            # Suppress deprecation warnings
 * - --trace-deprecation         # Show stack trace for deprecations
 * - --throw-deprecation         # Throw error instead of warning
 *
 * Example:
 * $ node --trace-deprecation app.js    # See where deprecated code is called
 * $ node --throw-deprecation app.js    # Fail fast on deprecations (for CI)
 */
