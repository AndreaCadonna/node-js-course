# Guide 1: Custom Promisify Implementations

**Reading time**: 20 minutes

## Introduction

Understanding how `util.promisify()` works internally is crucial for building robust async utilities. This guide explains promisify internals, edge cases, and how to build production-ready custom implementations.

## How util.promisify() Works

### Basic Algorithm

```javascript
function basicPromisify(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}
```

### What It Does

1. Takes a function that uses error-first callbacks
2. Returns a new function that returns a Promise
3. Handles error propagation from callback to Promise rejection
4. Passes result values to Promise resolution

## The util.promisify.custom Symbol

### Why It Exists

Some functions don't follow the standard error-first callback pattern. The `util.promisify.custom` symbol allows functions to define their own promisification.

### Usage

```javascript
const util = require('util');

function myFunction(value, callback) {
  // Standard implementation
  setTimeout(() => callback(null, value * 2), 10);
}

// Custom promisify that does something different
myFunction[util.promisify.custom] = function(value) {
  return Promise.resolve(value * 3);
};

const promisified = util.promisify(myFunction);
// Uses custom implementation, returns value * 3
```

### When to Use

- Non-standard callback signatures
- Optimization opportunities
- Special error handling requirements
- Multiple callback arguments that need special handling

## Handling Multiple Callback Values

### The Problem

Some Node.js callbacks pass multiple success values:

```javascript
crypto.randomFill(buffer, (err, buffer) => {
  // One value
});

dns.lookup('example.com', (err, address, family) => {
  // Multiple values!
});
```

### The Solution

```javascript
function advancedPromisify(fn, options = {}) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, ...values) => {
        if (err) return reject(err);

        if (options.multiArgs) {
          resolve(values); // Return array
        } else if (values.length === 0) {
          resolve(); // No value
        } else if (values.length === 1) {
          resolve(values[0]); // Single value
        } else {
          resolve(values); // Multiple values as array
        }
      });
    });
  };
}
```

## Adding Timeout Support

### Implementation

```javascript
function promisifyWithTimeout(fn, timeout) {
  const promisified = util.promisify(fn);

  return async function(...args) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);
    });

    return Promise.race([
      promisified(...args),
      timeoutPromise
    ]);
  };
}
```

### Important Considerations

1. **Memory Leaks**: The timeout timer keeps running even if the main promise resolves
2. **Solution**: Clear the timeout when done

```javascript
return Promise.race([
  promisified(...args).finally(() => clearTimeout(timer)),
  timeoutPromise
]);
```

## Context Binding

### The Problem

Methods that use `this` lose context when promisified:

```javascript
class Database {
  constructor() {
    this.connected = true;
  }

  query(sql, callback) {
    if (!this.connected) {
      return callback(new Error('Not connected'));
    }
    // ...
  }
}

const db = new Database();
const query = util.promisify(db.query); // WRONG! Loses 'this'
```

### The Solution

```javascript
// Option 1: Bind context
const query = util.promisify(db.query.bind(db));

// Option 2: Custom promisify with context
function promisifyWithContext(fn, context) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn.call(context, ...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

const query = promisifyWithContext(db.query, db);
```

## Retry Logic

### Basic Retry

```javascript
function promisifyWithRetry(fn, retries = 3) {
  const promisified = util.promisify(fn);

  return async function(...args) {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await promisified(...args);
      } catch (err) {
        lastError = err;

        if (attempt < retries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, attempt) * 100)
          );
        }
      }
    }

    throw lastError;
  };
}
```

### What NOT to Retry

- Validation errors (they'll fail again)
- Timeout errors (likely to timeout again)
- Authorization errors (permissions won't change)
- Any errors that are deterministic

## Validation Before Execution

### Why Validate Early

1. Fail fast - don't waste time on invalid inputs
2. Better error messages
3. Prevent side effects from invalid calls

### Implementation

```javascript
function promisifyWithValidation(fn, validator) {
  const promisified = util.promisify(fn);

  return async function(...args) {
    // Validate BEFORE calling the function
    const error = validator(...args);
    if (error) {
      throw error;
    }

    return await promisified(...args);
  };
}

// Usage
const safeReadFile = promisifyWithValidation(
  fs.readFile,
  (path) => {
    if (typeof path !== 'string') {
      return new TypeError('Path must be a string');
    }
    if (path.includes('..')) {
      return new Error('Path traversal not allowed');
    }
    return null; // Valid
  }
);
```

## Production Best Practices

### Complete Production Implementation

```javascript
function productionPromisify(fn, options = {}) {
  const {
    timeout = null,
    retries = 0,
    validator = null,
    context = null,
    multiArgs = false
  } = options;

  // Check for custom implementation
  if (fn[util.promisify.custom]) {
    return fn[util.promisify.custom];
  }

  return async function(...args) {
    // 1. Validate
    if (validator) {
      const error = validator(...args);
      if (error) throw error;
    }

    // 2. Retry loop
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // 3. Create promise
        const promise = new Promise((resolve, reject) => {
          const callback = (err, ...values) => {
            if (err) return reject(err);

            if (multiArgs) resolve(values);
            else if (values.length <= 1) resolve(values[0]);
            else resolve(values);
          };

          if (context) {
            fn.call(context, ...args, callback);
          } else {
            fn(...args, callback);
          }
        });

        // 4. Add timeout if needed
        if (timeout) {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
          });
          return await Promise.race([promise, timeoutPromise]);
        }

        return await promise;

      } catch (err) {
        // Don't retry certain error types
        if (err instanceof TypeError || err.message.includes('Timeout')) {
          throw err;
        }

        if (attempt === retries) throw err;

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  };
}
```

## Common Pitfalls

### 1. Not Checking for util.promisify.custom

```javascript
// ❌ Wrong
function myPromisify(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

// ✅ Correct
function myPromisify(fn) {
  if (fn[util.promisify.custom]) {
    return fn[util.promisify.custom];
  }
  // ... rest of implementation
}
```

### 2. Memory Leaks from Timeouts

```javascript
// ❌ Wrong - timer never cleared
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Timeout')), timeout);
});

// ✅ Correct
let timer;
const timeoutPromise = new Promise((_, reject) => {
  timer = setTimeout(() => reject(new Error('Timeout')), timeout);
});

return Promise.race([promise, timeoutPromise])
  .finally(() => clearTimeout(timer));
```

### 3. Losing Context

```javascript
// ❌ Wrong
const method = util.promisify(obj.method);

// ✅ Correct
const method = util.promisify(obj.method.bind(obj));
```

## Summary

- Promisify converts error-first callbacks to promises
- Always check for `util.promisify.custom` first
- Handle multiple callback values with multiArgs option
- Add timeout with `Promise.race()` and cleanup
- Preserve context with `.bind()` or explicit context parameter
- Implement retry with exponential backoff
- Validate arguments before execution
- Don't retry deterministic errors
- Clear timers to prevent memory leaks

## Next Steps

- Practice implementing custom promisify
- Read Guide 2: Deep Equality Testing
- Study the exercise solutions
- Try building a production promisify library
