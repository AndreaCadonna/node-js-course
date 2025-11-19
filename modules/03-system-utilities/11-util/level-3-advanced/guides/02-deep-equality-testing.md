# Guide 2: Deep Equality Testing

**Reading time**: 15 minutes

## Introduction

`util.isDeepStrictEqual()` is the foundation for robust test assertions. This guide explains how it works, edge cases, and how to build reliable test utilities.

## Understanding Deep Strict Equality

### How It Differs from ===

```javascript
const util = require('util');

const obj1 = { a: 1, b: 2 };
const obj2 = { a: 1, b: 2 };

console.log(obj1 === obj2);  // false (different references)
console.log(util.isDeepStrictEqual(obj1, obj2));  // true (same structure and values)
```

### What "Deep" Means

Deep equality recursively compares object properties:

```javascript
const nested1 = { a: { b: { c: 1 } } };
const nested2 = { a: { b: { c: 1 } } };

util.isDeepStrictEqual(nested1, nested2);  // true
```

### What "Strict" Means

Strict uses SameValue comparison (like ===, but with special cases):

```javascript
// NaN equals NaN (different from ===)
util.isDeepStrictEqual(NaN, NaN);  // true
NaN === NaN;  // false

// +0 and -0 are NOT equal (different from ===)
util.isDeepStrictEqual(+0, -0);  // false
+0 === -0;  // true

// undefined property !== missing property
util.isDeepStrictEqual({ a: undefined }, {});  // false!
```

## Edge Cases You Must Know

### 1. undefined vs Missing Properties

```javascript
const obj1 = { a: 1, b: undefined };
const obj2 = { a: 1 };

util.isDeepStrictEqual(obj1, obj2);  // false!
```

**Why**: Strict equality considers property presence, not just values.

### 2. NaN Handling

```javascript
util.isDeepStrictEqual(NaN, NaN);  // true
util.isDeepStrictEqual({ a: NaN }, { a: NaN });  // true

// Regular equality
NaN === NaN;  // false
```

### 3. Signed Zero

```javascript
util.isDeepStrictEqual(+0, -0);  // false!
+0 === -0;  // true

// In objects
util.isDeepStrictEqual({ a: +0 }, { a: -0 });  // false
```

### 4. Arrays

```javascript
// Order matters
util.isDeepStrictEqual([1, 2, 3], [1, 2, 3]);  // true
util.isDeepStrictEqual([1, 2, 3], [3, 2, 1]);  // false

// Sparse arrays
const sparse1 = [1, , 3];  // Empty slot
const sparse2 = [1, undefined, 3];

util.isDeepStrictEqual(sparse1, sparse2);  // false!
```

### 5. Sets and Maps

```javascript
// Sets - order doesn't matter
const set1 = new Set([1, 2, 3]);
const set2 = new Set([3, 2, 1]);
util.isDeepStrictEqual(set1, set2);  // true

// Maps - order doesn't matter for equality
const map1 = new Map([['a', 1], ['b', 2]]);
const map2 = new Map([['b', 2], ['a', 1]]);
util.isDeepStrictEqual(map1, map2);  // true
```

### 6. Dates

```javascript
const date1 = new Date('2024-01-01');
const date2 = new Date('2024-01-01');
const date3 = new Date('2024-01-02');

util.isDeepStrictEqual(date1, date2);  // true
util.isDeepStrictEqual(date1, date3);  // false
```

### 7. Regular Expressions

```javascript
util.isDeepStrictEqual(/abc/gi, /abc/gi);  // true
util.isDeepStrictEqual(/abc/g, /abc/gi);   // false (different flags)
util.isDeepStrictEqual(/abc/, /def/);       // false (different pattern)
```

### 8. Buffers

```javascript
const buf1 = Buffer.from('hello');
const buf2 = Buffer.from('hello');
const buf3 = Buffer.from('world');

util.isDeepStrictEqual(buf1, buf2);  // true
util.isDeepStrictEqual(buf1, buf3);  // false
```

### 9. Circular References

```javascript
const circular1 = { a: 1 };
circular1.self = circular1;

const circular2 = { a: 1 };
circular2.self = circular2;

util.isDeepStrictEqual(circular1, circular2);  // true!
// Handles circular references correctly
```

## Building Test Assertions

### Basic Assertion

```javascript
function assertEqual(actual, expected, message) {
  if (!util.isDeepStrictEqual(actual, expected)) {
    throw new AssertionError({
      message: message || 'Assertion failed',
      actual,
      expected
    });
  }
}
```

### Detailed Error Messages

```javascript
class AssertionError extends Error {
  constructor({ message, actual, expected }) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }

  toString() {
    return `${this.name}: ${this.message}\n` +
           `  Expected: ${util.inspect(this.expected, { depth: null, colors: true })}\n` +
           `  Actual:   ${util.inspect(this.actual, { depth: null, colors: true })}`;
  }
}
```

### Array Assertions with Diff

```javascript
function assertArrayEqual(actual, expected, message) {
  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    throw new TypeError('Both arguments must be arrays');
  }

  // Find first difference
  for (let i = 0; i < Math.max(actual.length, expected.length); i++) {
    if (!util.isDeepStrictEqual(actual[i], expected[i])) {
      throw new AssertionError({
        message: message || `Arrays differ at index ${i}`,
        actual: actual[i],
        expected: expected[i],
        index: i
      });
    }
  }
}
```

### Partial Object Matching

```javascript
function assertObjectContains(actual, expected, message) {
  for (const key in expected) {
    if (!util.isDeepStrictEqual(actual[key], expected[key])) {
      throw new AssertionError({
        message: message || `Property "${key}" does not match`,
        actual: actual[key],
        expected: expected[key],
        property: key
      });
    }
  }
}

// Usage
assertObjectContains(
  { a: 1, b: 2, c: 3 },  // actual
  { a: 1, b: 2 }         // expected (c is ignored)
);  // Pass!
```

## Practical Use Cases

### 1. API Response Validation

```javascript
function validateResponse(actual, expected) {
  if (!util.isDeepStrictEqual(actual, expected)) {
    console.error('Response mismatch!');
    console.error('Expected:', util.inspect(expected, { depth: null }));
    console.error('Actual:', util.inspect(actual, { depth: null }));
    return false;
  }
  return true;
}
```

### 2. Configuration Comparison

```javascript
function hasConfigChanged(oldConfig, newConfig) {
  return !util.isDeepStrictEqual(oldConfig, newConfig);
}

if (hasConfigChanged(oldConfig, newConfig)) {
  console.log('Configuration changed, reloading...');

  // Find what changed
  const changedKeys = Object.keys(newConfig).filter(key =>
    !util.isDeepStrictEqual(oldConfig[key], newConfig[key])
  );

  console.log('Changed fields:', changedKeys);
}
```

### 3. Snapshot Testing

```javascript
class SnapshotTester {
  constructor() {
    this.snapshots = new Map();
  }

  snapshot(name, value) {
    // Deep clone to prevent mutations
    this.snapshots.set(name, JSON.parse(JSON.stringify(value)));
  }

  assertMatchesSnapshot(name, value) {
    const snapshot = this.snapshots.get(name);

    if (!snapshot) {
      throw new Error(`No snapshot found: ${name}`);
    }

    if (!util.isDeepStrictEqual(value, snapshot)) {
      throw new AssertionError({
        message: 'Snapshot mismatch',
        actual: value,
        expected: snapshot
      });
    }
  }
}
```

### 4. Mock Verification

```javascript
class MockVerifier {
  constructor() {
    this.calls = [];
  }

  record(...args) {
    this.calls.push(args);
  }

  assertCalledWith(...expected) {
    const found = this.calls.some(args =>
      util.isDeepStrictEqual(args, expected)
    );

    if (!found) {
      throw new AssertionError({
        message: 'Mock was not called with expected arguments',
        actual: this.calls,
        expected
      });
    }
  }
}
```

## Performance Considerations

### Large Objects

```javascript
// Deep equality is O(n) where n is the size of the object
const large1 = { /* 10,000 properties */ };
const large2 = { /* 10,000 properties */ };

// This can be slow!
util.isDeepStrictEqual(large1, large2);
```

### Optimization: Quick Reference Check

```javascript
function optimizedDeepEqual(a, b) {
  // Quick reference check first
  if (a === b) return true;

  // Then deep equality
  return util.isDeepStrictEqual(a, b);
}
```

### Optimization: Early Exit

```javascript
function fastArrayEqual(a, b) {
  // Length check first
  if (a.length !== b.length) return false;

  // Then deep equality
  return util.isDeepStrictEqual(a, b);
}
```

## Common Mistakes

### 1. Using === for Objects

```javascript
// ❌ Wrong
if (obj1 === obj2) {
  // Never true for different object references
}

// ✅ Correct
if (util.isDeepStrictEqual(obj1, obj2)) {
  // Compares contents
}
```

### 2. Forgetting About undefined vs Missing

```javascript
// ❌ Wrong assumption
const obj1 = { a: 1, b: undefined };
const obj2 = { a: 1 };

// These are NOT equal!
util.isDeepStrictEqual(obj1, obj2);  // false
```

### 3. Not Handling NaN

```javascript
// ❌ Wrong
function assertEqual(a, b) {
  if (a !== b) throw new Error('Not equal');
}

assertEqual(NaN, NaN);  // Throws! (NaN !== NaN)

// ✅ Correct
function assertEqual(a, b) {
  if (!util.isDeepStrictEqual(a, b)) {
    throw new Error('Not equal');
  }
}

assertEqual(NaN, NaN);  // Pass!
```

## Summary

- `isDeepStrictEqual` uses SameValue comparison
- NaN equals NaN, but +0 !== -0
- undefined property !== missing property
- Handles all built-in types correctly
- Handles circular references
- Perfect for test assertions
- Can be slow for very large objects
- Use reference check first for optimization

## Next Steps

- Practice with edge cases
- Build a test assertion library
- Read Guide 3: Production Debugging Strategies
- Try the exercises
