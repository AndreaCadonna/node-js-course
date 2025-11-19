# util.format() Basics

**Reading Time:** 15 minutes
**Difficulty:** Beginner
**Prerequisites:** Basic understanding of string formatting

---

## Introduction

String formatting is a fundamental programming task - building messages, creating logs, displaying output. The `util.format()` function brings printf-style formatting to Node.js, offering a powerful and familiar way to construct strings with placeholders and type-specific formatting.

### Why This Matters

While JavaScript has template literals, `util.format()` provides precise control over formatting, type conversion, and a syntax familiar to developers from many other languages (C, Python, Go, etc.). It's also the engine that powers `console.log()` and other Node.js APIs.

> **Key Insight:** `util.format()` is printf for JavaScript. It's the backbone of Node.js's formatted output, combining type safety, automatic conversion, and familiar syntax into one powerful utility.

---

## Table of Contents

- [What You'll Learn](#what-youll-learn)
- [Understanding util.format()](#understanding-utilformat)
- [Placeholder Types](#placeholder-types)
- [Basic Usage](#basic-usage)
- [Advanced Formatting](#advanced-formatting)
- [Building Log Messages](#building-log-messages)
- [Comparison with Template Literals](#comparison-with-template-literals)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)
- [Summary](#summary)

---

## What You'll Learn

By the end of this guide, you'll understand:

1. How `util.format()` constructs formatted strings
2. All placeholder types and when to use each
3. Type conversion and coercion behavior
4. How to build structured log messages
5. When to use util.format() vs template literals
6. Real-world formatting patterns

---

## Understanding util.format()

### What It Does

`util.format()` takes a format string with placeholders and replaces them with provided arguments:

```javascript
const util = require('util');

const message = util.format('Hello, %s!', 'World');
console.log(message);
// Hello, World!

const score = util.format('Score: %d/%d', 85, 100);
console.log(score);
// Score: 85/100

const json = util.format('Data: %j', { user: 'Alice', age: 30 });
console.log(json);
// Data: {"user":"Alice","age":30}
```

### How It Works

```javascript
// Format string with placeholders
//        ↓    ↓    ↓
util.format('%s scored %d points in %d seconds', 'Alice', 95, 12)
//           ↑         ↑            ↑
//           │         │            │
//    Arguments replace placeholders in order
//
// Result: "Alice scored 95 points in 12 seconds"
```

### The Console.log Connection

**Important:** `console.log()` uses `util.format()` internally!

```javascript
// These are equivalent:
console.log('User: %s, Age: %d', 'Alice', 30);
console.log(util.format('User: %s, Age: %d', 'Alice', 30));

// Both output: User: Alice, Age: 30
```

---

## Placeholder Types

### Complete Placeholder Reference

| Placeholder | Type | Description | Example |
|-------------|------|-------------|---------|
| `%s` | String | Converts to string | `'hello'` |
| `%d` | Number | Converts to number (integer) | `42` |
| `%i` | Integer | Converts to integer | `42` |
| `%f` | Float | Converts to floating-point | `3.14` |
| `%j` | JSON | JSON.stringify() | `{"a":1}` |
| `%o` | Object | util.inspect() default | Full object |
| `%O` | Object | util.inspect() compact | Compact object |
| `%%` | Literal | Literal `%` character | `%` |

---

### %s - String Conversion

Converts any value to a string:

```javascript
const util = require('util');

// Strings pass through
util.format('%s', 'hello');
// 'hello'

// Numbers convert to strings
util.format('%s', 42);
// '42'

// Booleans convert to strings
util.format('%s', true);
// 'true'

// Objects use toString()
util.format('%s', { name: 'Alice' });
// '[object Object]'

// Arrays join with commas
util.format('%s', [1, 2, 3]);
// '1,2,3'

// Null and undefined
util.format('%s', null);
// 'null'
util.format('%s', undefined);
// 'undefined'
```

### %d and %i - Number Conversion

Converts values to numbers:

```javascript
// Integers
util.format('%d', 42);
// '42'

// Floats get truncated (no rounding!)
util.format('%d', 3.14);
// '3' (truncated, not rounded)

// Strings that are numbers
util.format('%d', '123');
// '123'

// Strings that aren't numbers
util.format('%d', 'hello');
// 'NaN'

// Boolean to number
util.format('%d', true);
// '1'
util.format('%d', false);
// '0'

// Null and undefined
util.format('%d', null);
// '0'
util.format('%d', undefined);
// 'NaN'
```

> **Note:** `%i` and `%d` are identical in Node.js - both convert to numbers. The distinction exists for compatibility with printf in other languages.

### %f - Float Conversion

Same as `%d` but semantically for floats:

```javascript
// Floating-point numbers
util.format('%f', 3.14159);
// '3.14159'

// Integers work too
util.format('%f', 42);
// '42'

// Scientific notation
util.format('%f', 1.23e-4);
// '0.000123'
```

> **Important:** Node.js doesn't support precision specifiers like `%.2f` (unlike C's printf). Use `toFixed()` instead.

### %j - JSON Conversion

Uses `JSON.stringify()` on the value:

```javascript
// Objects
util.format('%j', { name: 'Alice', age: 30 });
// '{"name":"Alice","age":30}'

// Arrays
util.format('%j', [1, 2, 3]);
// '[1,2,3]'

// Nested structures
util.format('%j', {
  user: { name: 'Alice' },
  scores: [95, 87, 92]
});
// '{"user":{"name":"Alice"},"scores":[95,87,92]}'

// Primitives
util.format('%j', 'hello');
// '"hello"' (quoted!)

util.format('%j', 42);
// '42'

util.format('%j', true);
// 'true'

util.format('%j', null);
// 'null'
```

**Limitations of %j:**

```javascript
// Functions are omitted
util.format('%j', { fn: function() {} });
// '{}'

// Undefined is omitted in objects
util.format('%j', { a: 1, b: undefined });
// '{"a":1}'

// Undefined alone becomes nothing
util.format('%j', undefined);
// '' (empty string!)

// Circular references throw error
const obj = {};
obj.self = obj;
util.format('%j', obj);
// Throws: Converting circular structure to JSON
```

### %o and %O - Object Inspection

Uses `util.inspect()` for rich object formatting:

```javascript
const obj = {
  name: 'Alice',
  age: 30,
  hobbies: ['reading', 'coding'],
  address: { city: 'SF' }
};

// %o - Default inspection
util.format('%o', obj);
// {
//   name: 'Alice',
//   age: 30,
//   hobbies: [ 'reading', 'coding' ],
//   address: { city: 'SF' }
// }

// %O - Compact inspection (single line)
util.format('%O', obj);
// { name: 'Alice', age: 30, hobbies: [ 'reading', 'coding' ], address: { city: 'SF' } }
```

**Advantages over %j:**

```javascript
// Shows functions
util.format('%o', { fn: () => {} });
// { fn: [Function: fn] }

// Handles circular references
const circular = { name: 'test' };
circular.self = circular;
util.format('%o', circular);
// { name: 'test', self: [Circular] }

// Shows undefined
util.format('%o', { a: 1, b: undefined });
// { a: 1, b: undefined }
```

### %% - Literal Percent

Escapes the `%` character:

```javascript
// Single percent
util.format('100%%');
// '100%'

// Multiple percents
util.format('%%s is not a placeholder');
// '%s is not a placeholder'

// Combined with actual placeholders
util.format('Success rate: %d%%', 95);
// 'Success rate: 95%'
```

---

## Basic Usage

### Simple String Building

```javascript
const util = require('util');

// Basic substitution
const greeting = util.format('Hello, %s!', 'Alice');
// 'Hello, Alice!'

// Multiple placeholders
const intro = util.format('%s is %d years old', 'Bob', 25);
// 'Bob is 25 years old'

// Mixed types
const summary = util.format('%s scored %d points with %f accuracy',
  'Charlie', 95, 0.87);
// 'Charlie scored 95 points with 0.87 accuracy'
```

### Extra Arguments

Arguments beyond placeholders are appended:

```javascript
// More arguments than placeholders
util.format('%s %s', 'Hello', 'World', 'Extra', 'Args');
// 'Hello World Extra Args'

// No placeholders
util.format('Hello', 'World');
// 'Hello World'

// Objects get inspected when extra
util.format('Data:', { a: 1, b: 2 });
// 'Data: { a: 1, b: 2 }'
```

### Missing Arguments

Missing arguments result in placeholder strings:

```javascript
// Fewer arguments than placeholders
util.format('%s %s %s', 'Hello');
// 'Hello %s %s'
// (unreplaced placeholders remain)

// No arguments
util.format('%s %s');
// '%s %s'
```

---

## Advanced Formatting

### Type Coercion Examples

```javascript
const util = require('util');

// String to number
util.format('%d', '42');     // '42'
util.format('%d', '3.14');   // '3.14' (kept as string of number)

// Number to string
util.format('%s', 42);       // '42'

// Boolean conversions
util.format('%s', true);     // 'true'
util.format('%d', true);     // '1'
util.format('%d', false);    // '0'

// Array to string
util.format('%s', [1,2,3]);  // '1,2,3'

// Object to JSON
util.format('%j', {a:1});    // '{"a":1}'
```

### Nested Objects

```javascript
const user = {
  name: 'Alice',
  profile: {
    age: 30,
    location: {
      city: 'San Francisco',
      country: 'USA'
    }
  },
  scores: [95, 87, 92]
};

// JSON format
console.log(util.format('User: %j', user));
// User: {"name":"Alice","profile":{"age":30,"location":{"city":"San Francisco","country":"USA"}},"scores":[95,87,92]}

// Object inspection (readable)
console.log(util.format('User: %o', user));
// User: {
//   name: 'Alice',
//   profile: { age: 30, location: { city: 'San Francisco', country: 'USA' } },
//   scores: [ 95, 87, 92 ]
// }

// Compact object
console.log(util.format('User: %O', user));
// User: { name: 'Alice', profile: { age: 30, location: { ... } }, scores: [ ... ] }
```

---

## Building Log Messages

### Structured Logging

```javascript
const util = require('util');

function log(level, message, data) {
  const timestamp = new Date().toISOString();
  const formatted = util.format(
    '[%s] %s: %s %o',
    timestamp,
    level.toUpperCase(),
    message,
    data
  );
  console.log(formatted);
}

// Usage
log('info', 'User logged in', { userId: 123, ip: '192.168.1.1' });
// [2024-01-01T12:00:00.000Z] INFO: User logged in { userId: 123, ip: '192.168.1.1' }

log('error', 'Database connection failed', { error: 'ECONNREFUSED', attempts: 3 });
// [2024-01-01T12:00:00.000Z] ERROR: Database connection failed { error: 'ECONNREFUSED', attempts: 3 }
```

### HTTP Request Logging

```javascript
function logRequest(req, res, duration) {
  const log = util.format(
    '%s %s %d %dms - %s',
    req.method,           // %s
    req.url,              // %s
    res.statusCode,       // %d
    duration,             // %d
    req.headers['user-agent'] || 'unknown'  // %s
  );
  console.log(log);
}

// Usage
// GET /api/users 200 45ms - Mozilla/5.0...
```

### Error Logging with Context

```javascript
function logError(error, context) {
  const message = util.format(
    'ERROR: %s\nContext: %O\nStack: %s',
    error.message,
    context,
    error.stack
  );
  console.error(message);
}

// Usage
try {
  processPayment(order);
} catch (err) {
  logError(err, {
    orderId: order.id,
    userId: user.id,
    amount: order.total
  });
}
```

### Performance Monitoring

```javascript
function logPerformance(operation, duration, metadata) {
  const message = util.format(
    'PERF: %s completed in %dms | %j',
    operation,
    duration,
    metadata
  );
  console.log(message);
}

// Usage
const start = Date.now();
await database.query(sql);
const duration = Date.now() - start;

logPerformance('database_query', duration, {
  query: 'SELECT * FROM users',
  rows: 1000
});
// PERF: database_query completed in 245ms | {"query":"SELECT * FROM users","rows":1000}
```

---

## Comparison with Template Literals

### Template Literals (ES6)

```javascript
const name = 'Alice';
const age = 30;

// Template literal
const message = `${name} is ${age} years old`;
// 'Alice is 30 years old'

// Multiline
const multiline = `
  Name: ${name}
  Age: ${age}
`;

// Expressions
const calc = `2 + 2 = ${2 + 2}`;
// '2 + 2 = 4'

// Function calls
const upper = `Name: ${name.toUpperCase()}`;
// 'Name: ALICE'
```

### util.format()

```javascript
const name = 'Alice';
const age = 30;

// util.format
const message = util.format('%s is %d years old', name, age);
// 'Alice is 30 years old'

// Type-specific formatting
const formatted = util.format(
  'User: %s, Data: %j',
  name,
  { age, active: true }
);
// 'User: Alice, Data: {"age":30,"active":true}'

// Object inspection
const inspected = util.format('User: %o', { name, age });
// 'User: { name: 'Alice', age: 30 }'
```

### Side-by-Side Comparison

| Feature | Template Literals | util.format() |
|---------|------------------|---------------|
| Syntax | `` `${var}` `` | `'%s', var` |
| Type checking | ❌ No | ✅ Yes (%d, %f, etc.) |
| JSON output | Manual | `%j` |
| Object inspect | Manual | `%o`, `%O` |
| Expressions | ✅ Yes | ❌ No |
| Multiline | ✅ Easy | ❌ Manual `\n` |
| Readability | ✅ High | ✅ High |
| Reusable format | ❌ No | ✅ Yes |
| Type coercion | Implicit | Explicit |

### When to Use Each

**Use Template Literals when:**
- Simple string interpolation
- Need multiline strings
- Want to evaluate expressions
- Modern JavaScript codebase
- Readability is priority

```javascript
// ✅ Good use of template literal
const message = `Hello ${name}, you have ${count} new messages`;
```

**Use util.format() when:**
- Need type-specific formatting
- Building reusable format strings
- Logging and debugging
- Need JSON or object inspection
- Working with dynamic format strings
- Type safety is important

```javascript
// ✅ Good use of util.format()
const FORMAT = 'User: %s, Score: %d, Data: %j';
const message = util.format(FORMAT, user, score, metadata);
```

### Combining Both

```javascript
// Use both together!
const baseUrl = 'https://api.example.com';
const userId = 123;
const data = { active: true };

const message = util.format(
  'Fetching %s with data: %j',
  `${baseUrl}/users/${userId}`,  // Template literal for URL
  data                             // util.format for JSON
);
// 'Fetching https://api.example.com/users/123 with data: {"active":true}'
```

---

## Real-World Examples

### Example 1: API Response Formatter

```javascript
function formatAPIResponse(status, data, timing) {
  if (status === 'success') {
    return util.format(
      'API Success (%dms): %O',
      timing,
      data
    );
  } else {
    return util.format(
      'API Error (%dms): %s - %j',
      timing,
      data.error,
      data.details
    );
  }
}

// Usage
const response = await fetchAPI('/users');
const message = formatAPIResponse('success', response.data, response.timing);
console.log(message);
// API Success (234ms): { users: [...], count: 50 }
```

### Example 2: SQL Query Logger

```javascript
function logQuery(query, params, duration, rowCount) {
  const formatted = util.format(
    'SQL [%dms, %d rows]: %s | Params: %j',
    duration,
    rowCount,
    query.trim(),
    params
  );

  if (duration > 1000) {
    console.warn('SLOW QUERY:', formatted);
  } else {
    console.log(formatted);
  }
}

// Usage
logQuery(
  'SELECT * FROM users WHERE age > ?',
  [18],
  1250,
  1000
);
// SLOW QUERY: SQL [1250ms, 1000 rows]: SELECT * FROM users WHERE age > ? | Params: [18]
```

### Example 3: Validation Error Messages

```javascript
function validationError(field, constraint, value) {
  return util.format(
    'Validation failed: "%s" %s (received: %j)',
    field,
    constraint,
    value
  );
}

// Usage
const errors = [];

if (age < 18) {
  errors.push(validationError('age', 'must be at least 18', age));
}

if (!email.includes('@')) {
  errors.push(validationError('email', 'must be valid email', email));
}

// Validation failed: "age" must be at least 18 (received: 15)
// Validation failed: "email" must be valid email (received: "invalid.email")
```

### Example 4: Test Assertion Messages

```javascript
function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    const error = util.format(
      '%s\n  Expected: %o\n  Received: %o',
      message || 'Assertion failed',
      expected,
      actual
    );
    throw new Error(error);
  }
}

// Usage
assertEqual(
  getUserCount(),
  100,
  'User count should match'
);
// If fails:
// User count should match
//   Expected: 100
//   Received: 95
```

### Example 5: CLI Progress Messages

```javascript
function progressMessage(current, total, filename) {
  const percent = Math.round((current / total) * 100);

  return util.format(
    '[%d%%] Processing %d/%d: %s',
    percent,
    current,
    total,
    filename
  );
}

// Usage
for (let i = 1; i <= files.length; i++) {
  console.log(progressMessage(i, files.length, files[i - 1]));
}
// [20%] Processing 1/5: file1.txt
// [40%] Processing 2/5: file2.txt
// [60%] Processing 3/5: file3.txt
// ...
```

---

## Best Practices

### ✅ DO: Use Type-Specific Placeholders

```javascript
// ✅ Good - Explicit types
util.format('Age: %d, Score: %f', age, score);

// ❌ Bad - Everything as string
util.format('Age: %s, Score: %s', age, score);
```

### ✅ DO: Use %j for JSON Output

```javascript
// ✅ Good - Clean JSON
util.format('Data: %j', data);

// ❌ Bad - Object toString
util.format('Data: %s', data);  // '[object Object]'
```

### ✅ DO: Use %o/%O for Debugging

```javascript
// ✅ Good - Readable object
console.log(util.format('Debug: %o', complexObject));

// ❌ Bad - Loses information
console.log(util.format('Debug: %j', complexObject));  // Functions omitted
```

### ✅ DO: Reuse Format Strings

```javascript
// ✅ Good - Reusable format
const LOG_FORMAT = '[%s] %s: %s';

function log(level, message) {
  console.log(util.format(LOG_FORMAT, timestamp(), level, message));
}
```

### ❌ DON'T: Use for Complex Expressions

```javascript
// ❌ Bad - Can't do expressions
util.format('%s', user.name.toUpperCase());  // Must pre-compute

// ✅ Good - Use template literal
`${user.name.toUpperCase()}`
```

### ❌ DON'T: Expect printf Precision

```javascript
// ❌ Bad - Doesn't work in Node.js
util.format('%.2f', 3.14159);  // Still '3.14159', not '3.14'

// ✅ Good - Use toFixed
util.format('%s', (3.14159).toFixed(2));  // '3.14'
```

---

## Summary

### Key Takeaways

1. **`util.format()` is printf for JavaScript**
   - Familiar syntax from C, Python, Go
   - Powers console.log() internally
   - Type-safe string formatting

2. **Essential placeholders:**
   - `%s` - String conversion
   - `%d/%i/%f` - Number conversion
   - `%j` - JSON output
   - `%o/%O` - Object inspection
   - `%%` - Literal percent

3. **Advantages:**
   - Type-specific formatting
   - Reusable format strings
   - Automatic type coercion
   - JSON and object inspection built-in

4. **Use cases:**
   - Logging and debugging
   - Error messages
   - Structured output
   - Type-safe string building

5. **vs Template Literals:**
   - Template literals: expressions, multiline, modern
   - util.format(): type safety, JSON/object formatting, reusable

### Quick Reference

```javascript
const util = require('util');

// Basic placeholders
util.format('%s', value);      // String
util.format('%d', value);      // Number
util.format('%j', value);      // JSON
util.format('%o', value);      // Object (multiline)
util.format('%O', value);      // Object (compact)
util.format('%%');             // Literal %

// Complete example
util.format('%s scored %d%% with data: %j',
  name,
  score,
  metadata
);
```

### Placeholder Decision Tree

```
Need to format a value?
│
├─ Simple string interpolation?
│  └─ Use template literals: `${value}`
│
├─ Need JSON output?
│  └─ Use %j
│
├─ Debugging complex object?
│  └─ Use %o or %O
│
├─ Number with type checking?
│  └─ Use %d or %f
│
└─ Building reusable format?
   └─ Use util.format() with placeholders
```

---

## Next Steps

- **Practice:** Replace template literals with util.format() in logging code
- **Experiment:** Try all placeholder types with different data types
- **Build:** Create a custom logging system using util.format()
- **Explore:** Study Node.js source code to see how core modules use formatting

---

## Related Guides

- [util.inspect() Basics](./02-inspect-basics.md) - Deep dive into object inspection
- [util.promisify() Basics](./01-promisify-basics.md) - Converting callbacks to Promises
- [Logging Best Practices](../../common/logging.md)
- [Debugging Techniques](../../common/debugging.md)
