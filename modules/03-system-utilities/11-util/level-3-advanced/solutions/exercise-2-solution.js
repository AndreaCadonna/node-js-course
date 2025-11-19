/**
 * Solution: Exercise 2 - Implement Test Assertion Library
 * Complete implementation with detailed error messages and all assertion types
 */

const util = require('util');

class AssertionError extends Error {
  constructor(message, actual, expected, operator) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
    this.operator = operator;
  }

  toString() {
    const actualStr = util.inspect(this.actual, { depth: null, colors: true });
    const expectedStr = util.inspect(this.expected, { depth: null, colors: true });
    return `${this.name}: ${this.message}\n  Expected: ${expectedStr}\n  Actual: ${actualStr}`;
  }
}

class Assert {
  static equal(actual, expected, message) {
    if (!util.isDeepStrictEqual(actual, expected)) {
      throw new AssertionError(message || 'Values not deeply equal', actual, expected, 'equal');
    }
  }

  static notEqual(actual, expected, message) {
    if (util.isDeepStrictEqual(actual, expected)) {
      throw new AssertionError(message || 'Values should not be equal', actual, expected, 'notEqual');
    }
  }

  static arrayEqual(actual, expected, message) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      throw new TypeError('Both arguments must be arrays');
    }
    for (let i = 0; i < Math.max(actual.length, expected.length); i++) {
      if (!util.isDeepStrictEqual(actual[i], expected[i])) {
        throw new AssertionError(message || `Arrays differ at index ${i}`, actual, expected, 'arrayEqual');
      }
    }
  }

  static objectMatches(actual, expected, message) {
    for (const key in expected) {
      if (!util.isDeepStrictEqual(actual[key], expected[key])) {
        throw new AssertionError(message || `Property "${key}" does not match`, actual[key], expected[key], 'objectMatches');
      }
    }
  }

  static async throws(fn, errorType, message) {
    try {
      await fn();
      throw new AssertionError(message || 'Expected function to throw', 'no error', errorType?.name || 'Error', 'throws');
    } catch (err) {
      if (err instanceof AssertionError) throw err;
      if (errorType && !(err instanceof errorType)) {
        throw new AssertionError(message || `Expected ${errorType.name} but got ${err.name}`, err, errorType, 'throws');
      }
    }
  }

  static async doesNotThrow(fn, message) {
    try {
      await fn();
    } catch (err) {
      throw new AssertionError(message || 'Expected function not to throw', err, 'no error', 'doesNotThrow');
    }
  }

  static isType(value, type, message) {
    const typeCheckers = {
      string: (v) => typeof v === 'string',
      number: (v) => typeof v === 'number',
      boolean: (v) => typeof v === 'boolean',
      array: Array.isArray,
      object: (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
      promise: (v) => v instanceof Promise || util.types.isPromise(v),
      function: (v) => typeof v === 'function'
    };

    const checker = typeCheckers[type];
    if (!checker) throw new TypeError(`Unknown type: ${type}`);
    if (!checker(value)) {
      throw new AssertionError(message || `Expected type ${type}`, typeof value, type, 'isType');
    }
  }

  static matches(actual, pattern, message) {
    if (typeof pattern === 'function') {
      if (!pattern(actual)) throw new AssertionError(message || 'Predicate did not match', actual, pattern, 'matches');
    } else if (typeof pattern === 'object') {
      this.objectMatches(actual, pattern, message);
    }
  }

  static ok(value, message) {
    if (!value) throw new AssertionError(message || 'Expected truthy value', value, 'truthy', 'ok');
  }

  static notOk(value, message) {
    if (value) throw new AssertionError(message || 'Expected falsy value', value, 'falsy', 'notOk');
  }
}

// KEY LEARNING POINTS:
// 1. util.isDeepStrictEqual is perfect for test assertions
// 2. Provide detailed error messages with actual vs expected
// 3. Handle async assertions properly
// 4. Support multiple assertion types for flexibility
// 5. Use util.inspect for formatting complex values
// 6. Edge cases: NaN, +0/-0, undefined vs missing properties
// 7. Circular references are handled automatically

// COMMON MISTAKES:
// 1. Not using util.isDeepStrictEqual (using === instead)
// 2. Poor error messages that don't show actual vs expected
// 3. Not handling async/await in assertions
// 4. Forgetting to check array indices
// 5. Not distinguishing between undefined and missing properties

module.exports = { Assert, AssertionError };
