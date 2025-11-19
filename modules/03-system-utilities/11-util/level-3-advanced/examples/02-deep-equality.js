/**
 * Example 2: util.isDeepStrictEqual() for Testing and Validation
 *
 * Demonstrates deep equality checking for complex objects, understanding
 * the algorithm, edge cases, and building test assertion libraries.
 */

const util = require('util');

console.log('=== Deep Equality Testing ===\n');

// =============================================================================
// 1. Basic Deep Equality
// =============================================================================
console.log('1. Basic Deep Equality Checks\n');

// Simple objects
const obj1 = { a: 1, b: 2 };
const obj2 = { a: 1, b: 2 };
const obj3 = { a: 1, b: 3 };

console.log('obj1:', obj1);
console.log('obj2:', obj2);
console.log('obj3:', obj3);
console.log('');

console.log('obj1 === obj2:', obj1 === obj2); // false (different references)
console.log('isDeepStrictEqual(obj1, obj2):', util.isDeepStrictEqual(obj1, obj2)); // true
console.log('isDeepStrictEqual(obj1, obj3):', util.isDeepStrictEqual(obj1, obj3)); // false
console.log('');

// Nested objects
const nested1 = { a: { b: { c: 1 } } };
const nested2 = { a: { b: { c: 1 } } };
const nested3 = { a: { b: { c: 2 } } };

console.log('Nested objects:');
console.log('isDeepStrictEqual(nested1, nested2):', util.isDeepStrictEqual(nested1, nested2)); // true
console.log('isDeepStrictEqual(nested1, nested3):', util.isDeepStrictEqual(nested1, nested3)); // false
console.log('');

// =============================================================================
// 2. Arrays and Collections
// =============================================================================
console.log('2. Arrays and Collections\n');

// Arrays
const arr1 = [1, 2, 3];
const arr2 = [1, 2, 3];
const arr3 = [1, 2, 3, 4];

console.log('Arrays:');
console.log('isDeepStrictEqual([1,2,3], [1,2,3]):', util.isDeepStrictEqual(arr1, arr2)); // true
console.log('isDeepStrictEqual([1,2,3], [1,2,3,4]):', util.isDeepStrictEqual(arr1, arr3)); // false
console.log('');

// Sets
const set1 = new Set([1, 2, 3]);
const set2 = new Set([1, 2, 3]);
const set3 = new Set([3, 2, 1]); // Different order

console.log('Sets:');
console.log('isDeepStrictEqual(Set[1,2,3], Set[1,2,3]):', util.isDeepStrictEqual(set1, set2)); // true
console.log('isDeepStrictEqual(Set[1,2,3], Set[3,2,1]):', util.isDeepStrictEqual(set1, set3)); // true (order doesn't matter in Sets)
console.log('');

// Maps
const map1 = new Map([['a', 1], ['b', 2]]);
const map2 = new Map([['a', 1], ['b', 2]]);
const map3 = new Map([['b', 2], ['a', 1]]); // Different insertion order

console.log('Maps:');
console.log('isDeepStrictEqual(map1, map2):', util.isDeepStrictEqual(map1, map2)); // true
console.log('isDeepStrictEqual(map1, map3):', util.isDeepStrictEqual(map1, map3)); // true
console.log('');

// =============================================================================
// 3. Edge Cases - undefined vs missing
// =============================================================================
console.log('3. Edge Cases: undefined vs Missing Properties\n');

const withUndefined = { a: 1, b: undefined };
const withoutB = { a: 1 };
const withNullB = { a: 1, b: null };

console.log('withUndefined:', withUndefined);
console.log('withoutB:', withoutB);
console.log('withNullB:', withNullB);
console.log('');

console.log('isDeepStrictEqual({ a: 1, b: undefined }, { a: 1 }):',
  util.isDeepStrictEqual(withUndefined, withoutB)); // false!
console.log('isDeepStrictEqual({ a: 1, b: undefined }, { a: 1, b: null }):',
  util.isDeepStrictEqual(withUndefined, withNullB)); // false!
console.log('');
console.log('⚠️  undefined property !== missing property (strict!)');
console.log('');

// =============================================================================
// 4. Special Number Values
// =============================================================================
console.log('4. Special Number Values\n');

// NaN
console.log('isDeepStrictEqual(NaN, NaN):', util.isDeepStrictEqual(NaN, NaN)); // true!
console.log('NaN === NaN:', NaN === NaN); // false (normal comparison)
console.log('');

// -0 vs +0
console.log('isDeepStrictEqual(+0, -0):', util.isDeepStrictEqual(+0, -0)); // false!
console.log('+0 === -0:', +0 === -0); // true (normal comparison)
console.log('');

// Infinity
console.log('isDeepStrictEqual(Infinity, Infinity):', util.isDeepStrictEqual(Infinity, Infinity)); // true
console.log('isDeepStrictEqual(Infinity, -Infinity):', util.isDeepStrictEqual(Infinity, -Infinity)); // false
console.log('');

// =============================================================================
// 5. Object Types
// =============================================================================
console.log('5. Different Object Types\n');

const date1 = new Date('2024-01-01');
const date2 = new Date('2024-01-01');
const date3 = new Date('2024-01-02');

console.log('Dates:');
console.log('isDeepStrictEqual(date1, date2):', util.isDeepStrictEqual(date1, date2)); // true
console.log('isDeepStrictEqual(date1, date3):', util.isDeepStrictEqual(date1, date3)); // false
console.log('');

const regex1 = /abc/gi;
const regex2 = /abc/gi;
const regex3 = /abc/g; // Different flags

console.log('RegExp:');
console.log('isDeepStrictEqual(/abc/gi, /abc/gi):', util.isDeepStrictEqual(regex1, regex2)); // true
console.log('isDeepStrictEqual(/abc/gi, /abc/g):', util.isDeepStrictEqual(regex1, regex3)); // false
console.log('');

const buf1 = Buffer.from('hello');
const buf2 = Buffer.from('hello');
const buf3 = Buffer.from('world');

console.log('Buffers:');
console.log('isDeepStrictEqual(buf1, buf2):', util.isDeepStrictEqual(buf1, buf2)); // true
console.log('isDeepStrictEqual(buf1, buf3):', util.isDeepStrictEqual(buf1, buf3)); // false
console.log('');

// =============================================================================
// 6. Circular References
// =============================================================================
console.log('6. Circular References\n');

const circular1 = { a: 1 };
circular1.self = circular1;

const circular2 = { a: 1 };
circular2.self = circular2;

console.log('Circular references:');
console.log('isDeepStrictEqual(circular1, circular2):',
  util.isDeepStrictEqual(circular1, circular2)); // true!
console.log('✅ Handles circular references correctly');
console.log('');

// =============================================================================
// 7. Building Test Assertions
// =============================================================================
console.log('7. Building Test Assertion Library\n');

class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }

  toString() {
    return `${this.name}: ${this.message}\n` +
           `  Expected: ${util.inspect(this.expected, { depth: null })}\n` +
           `  Actual:   ${util.inspect(this.actual, { depth: null })}`;
  }
}

class Assert {
  static deepEqual(actual, expected, message) {
    if (!util.isDeepStrictEqual(actual, expected)) {
      throw new AssertionError(
        message || 'Deep equality assertion failed',
        actual,
        expected
      );
    }
  }

  static notDeepEqual(actual, expected, message) {
    if (util.isDeepStrictEqual(actual, expected)) {
      throw new AssertionError(
        message || 'Values should not be deeply equal',
        actual,
        expected
      );
    }
  }

  static arrayEquals(actual, expected, message) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      throw new TypeError('Both arguments must be arrays');
    }
    this.deepEqual(actual, expected, message || 'Arrays not equal');
  }

  static objectMatches(actual, expected, message) {
    // Check if actual contains all properties from expected
    for (const key in expected) {
      if (!util.isDeepStrictEqual(actual[key], expected[key])) {
        throw new AssertionError(
          message || `Property ${key} does not match`,
          actual[key],
          expected[key]
        );
      }
    }
  }
}

// Test the assertion library
console.log('Testing assertion library:');

try {
  Assert.deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 });
  console.log('✅ Pass: deepEqual works');
} catch (err) {
  console.log('❌ Fail:', err.message);
}

try {
  Assert.notDeepEqual([1, 2, 3], [1, 2, 4]);
  console.log('✅ Pass: notDeepEqual works');
} catch (err) {
  console.log('❌ Fail:', err.message);
}

try {
  Assert.arrayEquals([1, 2, 3], [1, 2, 3]);
  console.log('✅ Pass: arrayEquals works');
} catch (err) {
  console.log('❌ Fail:', err.message);
}

try {
  Assert.objectMatches({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 });
  console.log('✅ Pass: objectMatches works (partial match)');
} catch (err) {
  console.log('❌ Fail:', err.message);
}

// Test failure case
try {
  Assert.deepEqual({ a: 1 }, { a: 2 });
  console.log('❌ Should have failed!');
} catch (err) {
  console.log('✅ Pass: Correctly caught assertion failure');
  console.log('   Error:', err.message);
}

console.log('');

// =============================================================================
// 8. Performance Considerations
// =============================================================================
console.log('8. Performance Considerations\n');

// Create large objects
const largeObj1 = {};
const largeObj2 = {};
for (let i = 0; i < 1000; i++) {
  largeObj1[`key${i}`] = { value: i, nested: { data: i * 2 } };
  largeObj2[`key${i}`] = { value: i, nested: { data: i * 2 } };
}

console.time('Deep equality on large objects');
const result = util.isDeepStrictEqual(largeObj1, largeObj2);
console.timeEnd('Deep equality on large objects');
console.log('Result:', result);
console.log('');

// Different at the end
largeObj2.key999.value = 999999;

console.time('Deep equality (early difference)');
util.isDeepStrictEqual({ a: 1 }, { a: 2 });
console.timeEnd('Deep equality (early difference)');

console.time('Deep equality (late difference)');
util.isDeepStrictEqual(largeObj1, largeObj2);
console.timeEnd('Deep equality (late difference)');

console.log('');

// =============================================================================
// 9. Practical Use Cases
// =============================================================================
console.log('9. Practical Use Cases\n');

// Use Case 1: API Response Validation
function validateApiResponse(actual, expected) {
  if (!util.isDeepStrictEqual(actual, expected)) {
    console.error('API response mismatch!');
    console.error('Expected:', util.inspect(expected, { depth: null, colors: true }));
    console.error('Actual:', util.inspect(actual, { depth: null, colors: true }));
    return false;
  }
  return true;
}

const expectedResponse = { status: 'success', data: { id: 1, name: 'Test' } };
const actualResponse = { status: 'success', data: { id: 1, name: 'Test' } };

if (validateApiResponse(actualResponse, expectedResponse)) {
  console.log('✅ API response valid');
}
console.log('');

// Use Case 2: Configuration Comparison
function hasConfigChanged(oldConfig, newConfig) {
  return !util.isDeepStrictEqual(oldConfig, newConfig);
}

const oldConfig = { port: 3000, host: 'localhost', debug: false };
const newConfig = { port: 3000, host: 'localhost', debug: true };

if (hasConfigChanged(oldConfig, newConfig)) {
  console.log('✅ Configuration changed, reloading...');
  console.log('   Changed fields:',
    Object.keys(newConfig).filter(key =>
      !util.isDeepStrictEqual(oldConfig[key], newConfig[key])
    )
  );
}
console.log('');

// Use Case 3: Snapshot Testing
class SnapshotTester {
  constructor() {
    this.snapshots = new Map();
  }

  snapshot(name, value) {
    this.snapshots.set(name, JSON.parse(JSON.stringify(value)));
  }

  assertMatchesSnapshot(name, value) {
    const snapshot = this.snapshots.get(name);
    if (!snapshot) {
      throw new Error(`No snapshot found for: ${name}`);
    }

    if (!util.isDeepStrictEqual(value, snapshot)) {
      throw new AssertionError('Snapshot mismatch', value, snapshot);
    }
  }
}

const tester = new SnapshotTester();

// Save snapshot
tester.snapshot('userObject', { id: 1, name: 'Alice', role: 'admin' });

// Later, test against snapshot
try {
  tester.assertMatchesSnapshot('userObject', { id: 1, name: 'Alice', role: 'admin' });
  console.log('✅ Snapshot test passed');
} catch (err) {
  console.log('❌ Snapshot test failed:', err.message);
}

console.log('');

// =============================================================================
// Key Takeaways
// =============================================================================
console.log('=== Key Takeaways ===');
console.log('1. isDeepStrictEqual() uses SameValue comparison');
console.log('2. undefined property !== missing property (strict)');
console.log('3. NaN equals NaN, but +0 !== -0');
console.log('4. Handles all built-in types: Date, RegExp, Map, Set, Buffer');
console.log('5. Correctly handles circular references');
console.log('6. Perfect for test assertions and validations');
console.log('7. Performance scales with object size and depth');
console.log('8. Use for API validation, config comparison, snapshot testing');
