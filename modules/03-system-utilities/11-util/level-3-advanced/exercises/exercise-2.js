/**
 * Exercise 2: Implement Test Assertion Library
 * Difficulty: ⭐⭐⭐ Hard
 *
 * Create a comprehensive test assertion library using util.isDeepStrictEqual()
 * with detailed error messages, multiple assertion types, and helpful output.
 *
 * Learning objectives:
 * - Master deep equality comparisons
 * - Build useful error messages
 * - Handle edge cases in comparisons
 * - Create developer-friendly test utilities
 */

const util = require('util');

console.log('Exercise 2: Implement Test Assertion Library\n');

// =============================================================================
// YOUR TASK
// =============================================================================

/**
 * Implement an Assert class with the following methods:
 *
 * 1. equal(actual, expected, message) - Deep strict equality
 * 2. notEqual(actual, expected, message) - Not deeply equal
 * 3. arrayEqual(actual, expected, message) - Array equality
 * 4. objectMatches(actual, expected, message) - Partial object match
 * 5. throws(fn, errorType, message) - Async function throws
 * 6. doesNotThrow(fn, message) - Function doesn't throw
 * 7. isType(value, type, message) - Type checking
 * 8. matches(actual, pattern, message) - Pattern matching
 *
 * Requirements:
 * - Use util.isDeepStrictEqual() for comparisons
 * - Throw AssertionError with detailed information
 * - Include actual vs expected in error messages
 * - Use util.inspect() for formatting values
 * - Handle all edge cases (undefined, null, NaN, etc.)
 * - Support async assertions
 */

class AssertionError extends Error {
  constructor(message, actual, expected, operator) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
    this.operator = operator;

    // TODO: Generate detailed error message with util.inspect()
  }

  toString() {
    // TODO: Format error message nicely
    return `${this.name}: ${this.message}`;
  }
}

class Assert {
  /**
   * Assert deep strict equality
   */
  static equal(actual, expected, message) {
    // TODO: Implement using util.isDeepStrictEqual()
    throw new Error('Not implemented');
  }

  /**
   * Assert not deeply equal
   */
  static notEqual(actual, expected, message) {
    // TODO: Implement
    throw new Error('Not implemented');
  }

  /**
   * Assert array equality with helpful diff
   */
  static arrayEqual(actual, expected, message) {
    // TODO: Check both are arrays, then compare
    // Show index of first difference
    throw new Error('Not implemented');
  }

  /**
   * Assert object contains expected properties
   */
  static objectMatches(actual, expected, message) {
    // TODO: Check if actual contains all properties from expected
    throw new Error('Not implemented');
  }

  /**
   * Assert function throws expected error
   */
  static async throws(fn, errorType, message) {
    // TODO: Call function, expect it to throw
    // Check error type if provided
    throw new Error('Not implemented');
  }

  /**
   * Assert function doesn't throw
   */
  static async doesNotThrow(fn, message) {
    // TODO: Call function, expect no error
    throw new Error('Not implemented');
  }

  /**
   * Assert value type using util.types
   */
  static isType(value, type, message) {
    // TODO: Check type using util.types methods
    // Support: 'string', 'number', 'boolean', 'array', 'object', 'promise', etc.
    throw new Error('Not implemented');
  }

  /**
   * Assert value matches pattern/predicate
   */
  static matches(actual, pattern, message) {
    // TODO: Support function predicates and object patterns
    throw new Error('Not implemented');
  }

  /**
   * Assert value is truthy
   */
  static ok(value, message) {
    // TODO: Check if value is truthy
    throw new Error('Not implemented');
  }

  /**
   * Assert value is falsy
   */
  static notOk(value, message) {
    // TODO: Check if value is falsy
    throw new Error('Not implemented');
  }
}

// =============================================================================
// TEST CASES
// =============================================================================

console.log('Running tests...\n');

// Test 1: Basic equality
console.log('Test 1: Basic equality');
try {
  Assert.equal({ a: 1, b: 2 }, { a: 1, b: 2 });
  console.log('✅ PASS: Basic equality');
} catch (err) {
  console.log('❌ FAIL:', err.message);
}

try {
  Assert.equal({ a: 1 }, { a: 2 });
  console.log('❌ FAIL: Should have thrown');
} catch (err) {
  console.log('✅ PASS: Inequality detected');
}

// Test 2: Not equal
console.log('\nTest 2: Not equal');
try {
  Assert.notEqual([1, 2, 3], [1, 2, 4]);
  console.log('✅ PASS: Not equal works');
} catch (err) {
  console.log('❌ FAIL:', err.message);
}

// Test 3: Array equality
console.log('\nTest 3: Array equality');
try {
  Assert.arrayEqual([1, 2, 3], [1, 2, 3]);
  console.log('✅ PASS: Arrays equal');
} catch (err) {
  console.log('❌ FAIL:', err.message);
}

try {
  Assert.arrayEqual([1, 2, 3], [1, 2, 4]);
  console.log('❌ FAIL: Should have thrown');
} catch (err) {
  console.log('✅ PASS: Array difference detected');
  console.log('   Error message:', err.message);
}

// Test 4: Object matches
console.log('\nTest 4: Object partial match');
try {
  Assert.objectMatches(
    { a: 1, b: 2, c: 3 },
    { a: 1, b: 2 }
  );
  console.log('✅ PASS: Partial match works');
} catch (err) {
  console.log('❌ FAIL:', err.message);
}

// Test 5: Throws assertion
console.log('\nTest 5: Throws assertion');
(async () => {
  try {
    await Assert.throws(
      async () => { throw new TypeError('Test error'); },
      TypeError
    );
    console.log('✅ PASS: Throws assertion works');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }

  try {
    await Assert.throws(
      async () => { return 'no error'; },
      Error
    );
    console.log('❌ FAIL: Should have thrown');
  } catch (err) {
    console.log('✅ PASS: Non-throwing function detected');
  }
})();

// Test 6: Does not throw
setTimeout(() => {
  console.log('\nTest 6: Does not throw');
  (async () => {
    try {
      await Assert.doesNotThrow(async () => { return 'success'; });
      console.log('✅ PASS: Does not throw works');
    } catch (err) {
      console.log('❌ FAIL:', err.message);
    }
  })();
}, 100);

// Test 7: Type checking
setTimeout(() => {
  console.log('\nTest 7: Type checking');
  try {
    Assert.isType('hello', 'string');
    Assert.isType([1, 2, 3], 'array');
    Assert.isType({ a: 1 }, 'object');
    console.log('✅ PASS: Type checking works');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }

  try {
    Assert.isType('hello', 'number');
    console.log('❌ FAIL: Should have thrown');
  } catch (err) {
    console.log('✅ PASS: Wrong type detected');
  }
}, 200);

// Test 8: Pattern matching
setTimeout(() => {
  console.log('\nTest 8: Pattern matching');
  try {
    Assert.matches(42, (x) => x > 40);
    console.log('✅ PASS: Predicate matching works');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }

  try {
    Assert.matches({ a: 1, b: 2 }, { a: 1 });
    console.log('✅ PASS: Object pattern matching works');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
}, 300);

// Test 9: Edge cases
setTimeout(() => {
  console.log('\nTest 9: Edge cases');

  try {
    // NaN equality
    Assert.equal(NaN, NaN);
    console.log('✅ PASS: NaN equals NaN');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }

  try {
    // +0 vs -0
    Assert.notEqual(+0, -0);
    console.log('✅ PASS: +0 not equal to -0');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }

  try {
    // undefined vs missing property
    Assert.notEqual({ a: undefined }, {});
    console.log('✅ PASS: undefined property !== missing');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
}, 400);

// Test 10: Circular references
setTimeout(() => {
  console.log('\nTest 10: Circular references');

  const circular1 = { a: 1 };
  circular1.self = circular1;

  const circular2 = { a: 1 };
  circular2.self = circular2;

  try {
    Assert.equal(circular1, circular2);
    console.log('✅ PASS: Circular references handled');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
}, 500);

// =============================================================================
// BONUS CHALLENGES
// =============================================================================

setTimeout(() => {
  console.log('\n=== Bonus Challenges ===\n');

  console.log('1. Add snapshot testing support');
  console.log('2. Implement custom matchers (toBe, toContain, etc.)');
  console.log('3. Add assertion counting and statistics');
  console.log('4. Support async/await in all assertions');
  console.log('5. Generate color-coded diffs for failed assertions');
  console.log('6. Add assertion chaining (expect(x).to.be.equal(y))');
  console.log('7. Support custom equality comparers');
  console.log('8. Add performance assertions (executionTime < threshold)');

  console.log('\nSee solution file for complete implementation!');
}, 600);

// =============================================================================
// HINTS
// =============================================================================

/*
HINTS:

1. Deep equality:
   if (!util.isDeepStrictEqual(actual, expected)) {
     throw new AssertionError(...);
   }

2. Array comparison with diff:
   for (let i = 0; i < Math.max(actual.length, expected.length); i++) {
     if (!util.isDeepStrictEqual(actual[i], expected[i])) {
       // Found difference at index i
     }
   }

3. Partial object match:
   for (const key in expected) {
     if (!util.isDeepStrictEqual(actual[key], expected[key])) {
       throw new AssertionError(...);
     }
   }

4. Type checking:
   const typeCheckers = {
     string: (v) => typeof v === 'string',
     array: Array.isArray,
     promise: util.types.isPromise,
     // ...
   };

5. Error formatting:
   toString() {
     return `${this.name}: ${this.message}\n` +
            `  Expected: ${util.inspect(this.expected)}\n` +
            `  Actual: ${util.inspect(this.actual)}`;
   }
*/
