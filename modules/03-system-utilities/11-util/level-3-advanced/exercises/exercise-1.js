/**
 * Exercise 1: Build Custom Promisify with Options
 * Difficulty: ⭐⭐⭐ Hard
 *
 * Create a custom promisify implementation that supports:
 * - Standard error-first callbacks
 * - Multiple callback values
 * - util.promisify.custom symbol
 * - Timeout option
 * - Validation option
 * - Context binding
 * - Retry logic
 *
 * Learning objectives:
 * - Understand promisify internals
 * - Handle edge cases in callback conversion
 * - Implement advanced options
 * - Create production-ready utilities
 */

const util = require('util');
const fs = require('fs');

console.log('Exercise 1: Build Custom Promisify with Options\n');

// =============================================================================
// YOUR TASK
// =============================================================================

/**
 * Implement advancedPromisify with the following features:
 *
 * @param {Function} fn - The function to promisify
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Timeout in milliseconds (optional)
 * @param {Function} options.validator - Function to validate arguments (optional)
 * @param {Object} options.context - Context (this) to bind to (optional)
 * @param {number} options.retries - Number of retries on error (optional, default: 0)
 * @param {boolean} options.multiArgs - Return array for multiple callback values (optional)
 * @returns {Function} Promisified function
 *
 * Requirements:
 * 1. Check for util.promisify.custom and use it if available
 * 2. Convert error-first callbacks to promises
 * 3. Handle multiple callback values based on multiArgs option
 * 4. Apply timeout if specified (reject with TimeoutError)
 * 5. Validate arguments if validator provided
 * 6. Bind context if provided
 * 7. Implement retry logic if retries > 0
 * 8. Preserve function name and length
 */

function advancedPromisify(fn, options = {}) {
  // TODO: Implement this function

  // Check for custom promisify

  // Return promisified function with all features

  throw new Error('Not implemented');
}

// Custom error types
class TimeoutError extends Error {
  constructor(message, timeout) {
    super(message);
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}

class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

// =============================================================================
// TEST CASES
// =============================================================================

console.log('Running tests...\n');

// Test 1: Basic promisify
console.log('Test 1: Basic promisify');
function basicCallback(value, callback) {
  setTimeout(() => callback(null, value * 2), 10);
}

const basicPromise = advancedPromisify(basicCallback);
basicPromise(5)
  .then(result => {
    console.log(result === 10 ? '✅ PASS' : '❌ FAIL', 'Basic promisify');
  })
  .catch(err => console.log('❌ FAIL', err.message));

// Test 2: Multiple values
setTimeout(() => {
  console.log('\nTest 2: Multiple callback values');

  function multiCallback(a, b, callback) {
    setTimeout(() => callback(null, a + b, a * b), 10);
  }

  const multiPromise = advancedPromisify(multiCallback, { multiArgs: true });
  multiPromise(3, 4)
    .then(results => {
      const pass = Array.isArray(results) && results[0] === 7 && results[1] === 12;
      console.log(pass ? '✅ PASS' : '❌ FAIL', 'Multiple values');
    })
    .catch(err => console.log('❌ FAIL', err.message));
}, 100);

// Test 3: Timeout
setTimeout(() => {
  console.log('\nTest 3: Timeout handling');

  function slowCallback(callback) {
    setTimeout(() => callback(null, 'done'), 200);
  }

  const timeoutPromise = advancedPromisify(slowCallback, { timeout: 50 });
  timeoutPromise()
    .then(() => console.log('❌ FAIL', 'Should have timed out'))
    .catch(err => {
      const pass = err instanceof TimeoutError;
      console.log(pass ? '✅ PASS' : '❌ FAIL', 'Timeout error thrown');
    });
}, 200);

// Test 4: Validation
setTimeout(() => {
  console.log('\nTest 4: Argument validation');

  function validateCallback(value, callback) {
    setTimeout(() => callback(null, value), 10);
  }

  const validatedPromise = advancedPromisify(validateCallback, {
    validator: (value) => {
      if (typeof value !== 'number') {
        return new ValidationError('Value must be a number', { value });
      }
      return null;
    }
  });

  validatedPromise('invalid')
    .then(() => console.log('❌ FAIL', 'Should have thrown validation error'))
    .catch(err => {
      const pass = err instanceof ValidationError;
      console.log(pass ? '✅ PASS' : '❌ FAIL', 'Validation error thrown');
    });
}, 400);

// Test 5: Context binding
setTimeout(() => {
  console.log('\nTest 5: Context binding');

  const obj = {
    value: 42,
    getValue(callback) {
      setTimeout(() => callback(null, this.value), 10);
    }
  };

  const boundPromise = advancedPromisify(obj.getValue, { context: obj });
  boundPromise()
    .then(result => {
      console.log(result === 42 ? '✅ PASS' : '❌ FAIL', 'Context preserved');
    })
    .catch(err => console.log('❌ FAIL', err.message));
}, 500);

// Test 6: Retry logic
setTimeout(() => {
  console.log('\nTest 6: Retry logic');

  let attempts = 0;
  function flaky Callback(callback) {
    attempts++;
    if (attempts < 3) {
      setTimeout(() => callback(new Error('Temporary failure')), 10);
    } else {
      setTimeout(() => callback(null, 'success'), 10);
    }
  }

  const retryPromise = advancedPromisify(flakyCallback, { retries: 3 });
  retryPromise()
    .then(result => {
      const pass = result === 'success' && attempts === 3;
      console.log(pass ? '✅ PASS' : '❌ FAIL', 'Retry logic (attempts: ' + attempts + ')');
    })
    .catch(err => console.log('❌ FAIL', err.message));
}, 600);

// Test 7: util.promisify.custom support
setTimeout(() => {
  console.log('\nTest 7: util.promisify.custom support');

  function customCallback(value, callback) {
    setTimeout(() => callback(null, value * 2), 10);
  }

  customCallback[util.promisify.custom] = function(value) {
    return Promise.resolve(value * 3); // Different behavior
  };

  const customPromise = advancedPromisify(customCallback);
  customPromise(10)
    .then(result => {
      console.log(result === 30 ? '✅ PASS' : '❌ FAIL', 'Custom promisify used');
    })
    .catch(err => console.log('❌ FAIL', err.message));
}, 750);

// Test 8: Error handling
setTimeout(() => {
  console.log('\nTest 8: Error handling');

  function errorCallback(callback) {
    setTimeout(() => callback(new Error('Test error')), 10);
  }

  const errorPromise = advancedPromisify(errorCallback);
  errorPromise()
    .then(() => console.log('❌ FAIL', 'Should have rejected'))
    .catch(err => {
      const pass = err.message === 'Test error';
      console.log(pass ? '✅ PASS' : '❌ FAIL', 'Error properly rejected');
    });
}, 850);

// Test 9: Real-world usage with fs.readFile
setTimeout(() => {
  console.log('\nTest 9: Real-world usage (fs.readFile)');

  const safeReadFile = advancedPromisify(fs.readFile, {
    timeout: 5000,
    validator: (path) => {
      if (typeof path !== 'string') {
        return new ValidationError('Path must be a string', { path });
      }
      if (path.includes('..')) {
        return new ValidationError('Path traversal not allowed', { path });
      }
      return null;
    }
  });

  safeReadFile(__filename, 'utf8')
    .then(content => {
      const pass = content.includes('Exercise 1');
      console.log(pass ? '✅ PASS' : '❌ FAIL', 'Real-world file read');
    })
    .catch(err => console.log('❌ FAIL', err.message));
}, 950);

// =============================================================================
// BONUS CHALLENGES
// =============================================================================

setTimeout(() => {
  console.log('\n=== Bonus Challenges ===\n');

  console.log('1. Add support for promisifying entire objects (all methods)');
  console.log('2. Implement caching for promisified functions');
  console.log('3. Add progress callbacks for long-running operations');
  console.log('4. Support cancellation with AbortController');
  console.log('5. Add performance monitoring and metrics');

  console.log('\nSee solution file for complete implementation!');
}, 1100);

// =============================================================================
// HINTS
// =============================================================================

/*
HINTS:

1. Custom promisify check:
   if (fn[util.promisify.custom]) return fn[util.promisify.custom];

2. Basic promisify structure:
   return function(...args) {
     return new Promise((resolve, reject) => {
       fn(...args, (err, ...values) => {
         if (err) return reject(err);
         // Handle values
       });
     });
   };

3. Timeout implementation:
   const timeoutPromise = new Promise((_, reject) => {
     setTimeout(() => reject(new TimeoutError(...)), timeout);
   });
   return Promise.race([mainPromise, timeoutPromise]);

4. Retry implementation:
   let lastError;
   for (let i = 0; i <= retries; i++) {
     try {
       return await promisified(...args);
     } catch (err) {
       lastError = err;
     }
   }
   throw lastError;

5. Context binding:
   fn.call(context, ...args, callback);

6. Validation:
   const error = validator(...args);
   if (error) return Promise.reject(error);
*/
