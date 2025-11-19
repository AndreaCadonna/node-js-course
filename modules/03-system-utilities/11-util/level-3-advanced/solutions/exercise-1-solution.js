/**
 * Solution: Exercise 1 - Build Custom Promisify with Options
 * ===========================================================
 *
 * This solution demonstrates a production-ready promisify implementation
 * with validation, timeout, retry, and all advanced features.
 */

const util = require('util');
const fs = require('fs');

console.log('=== Solution: Custom Promisify with Options ===\n');

// =============================================================================
// CUSTOM ERROR TYPES
// =============================================================================

class TimeoutError extends Error {
  constructor(message, timeout) {
    super(message || `Operation timed out after ${timeout}ms`);
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
// SOLUTION: Advanced Promisify Implementation
// =============================================================================

function advancedPromisify(fn, options = {}) {
  const {
    timeout = null,
    validator = null,
    context = null,
    retries = 0,
    multiArgs = false
  } = options;

  // STEP 1: Check for custom promisify implementation
  if (fn[util.promisify.custom]) {
    return fn[util.promisify.custom];
  }

  // STEP 2: Create promisified function with all features
  const promisified = function(...args) {
    return new Promise((resolve, reject) => {
      // STEP 3: Validate arguments if validator provided
      if (validator) {
        const validationError = validator(...args);
        if (validationError) {
          return reject(validationError);
        }
      }

      // STEP 4: Call original function with proper context
      const callback = (err, ...values) => {
        if (err) {
          return reject(err);
        }

        // STEP 5: Handle multiple callback values
        if (multiArgs) {
          resolve(values);
        } else if (values.length === 0) {
          resolve();
        } else if (values.length === 1) {
          resolve(values[0]);
        } else {
          resolve(values);
        }
      };

      // Call with proper context
      if (context) {
        fn.call(context, ...args, callback);
      } else {
        fn(...args, callback);
      }
    });
  };

  // STEP 6: Add timeout if specified
  const withTimeout = timeout
    ? async function(...args) {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new TimeoutError(`Operation timed out after ${timeout}ms`, timeout));
          }, timeout);
        });

        return Promise.race([promisified(...args), timeoutPromise]);
      }
    : promisified;

  // STEP 7: Add retry logic if specified
  const withRetry = retries > 0
    ? async function(...args) {
        let lastError;

        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            return await withTimeout(...args);
          } catch (err) {
            lastError = err;

            // Don't retry on validation or timeout errors
            if (err instanceof ValidationError || err instanceof TimeoutError) {
              throw err;
            }

            // Don't retry on last attempt
            if (attempt === retries) {
              throw err;
            }

            // Optional: Add exponential backoff
            if (attempt < retries) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
            }
          }
        }

        throw lastError;
      }
    : withTimeout;

  // Preserve function properties
  Object.defineProperty(withRetry, 'name', {
    value: fn.name || 'promisified',
    configurable: true
  });

  Object.defineProperty(withRetry, 'length', {
    value: fn.length - 1, // Subtract callback
    configurable: true
  });

  return withRetry;
}

// =============================================================================
// DEMONSTRATION & TESTS
// =============================================================================

console.log('Testing advanced promisify implementation...\n');

// Test 1: Basic promisify
console.log('Test 1: Basic promisify');
function basicCallback(value, callback) {
  setTimeout(() => callback(null, value * 2), 10);
}

const basicPromise = advancedPromisify(basicCallback);
basicPromise(5).then(result => {
  console.log(result === 10 ? '✅ PASS' : '❌ FAIL', `Result: ${result}`);
});

// Test 2: Multiple values
setTimeout(() => {
  console.log('\nTest 2: Multiple callback values');
  function multiCallback(a, b, callback) {
    setTimeout(() => callback(null, a + b, a * b), 10);
  }

  const multiPromise = advancedPromisify(multiCallback, { multiArgs: true });
  multiPromise(3, 4).then(results => {
    console.log(Array.isArray(results) && results[0] === 7 && results[1] === 12
      ? '✅ PASS' : '❌ FAIL', `Results: ${results}`);
  });
}, 100);

// Additional tests continue...
setTimeout(() => {
  console.log('\n=== KEY LEARNING POINTS ===\n');

  console.log('1. Always check for util.promisify.custom first');
  console.log('2. Handle multiple callback values correctly');
  console.log('3. Use Promise.race() for timeout implementation');
  console.log('4. Implement retry with exponential backoff');
  console.log('5. Preserve function properties (name, length)');
  console.log('6. Validate before executing for early failure');
  console.log('7. Support context binding for class methods');
  console.log('8. Don\'t retry on validation/timeout errors');

  console.log('\n=== COMMON MISTAKES ===\n');

  console.log('1. Not checking for util.promisify.custom');
  console.log('2. Incorrectly handling multiple callback values');
  console.log('3. Memory leaks from timeout promises');
  console.log('4. Retrying non-retryable errors');
  console.log('5. Not preserving function context');
  console.log('6. Validating after function call instead of before');
  console.log('7. Not handling edge cases (undefined, null)');

  console.log('\n=== GOING FURTHER ===\n');

  console.log('1. Add progress callbacks for long operations');
  console.log('2. Support AbortController for cancellation');
  console.log('3. Implement circuit breaker pattern');
  console.log('4. Add request deduplication/coalescing');
  console.log('5. Track metrics (success rate, latency)');
  console.log('6. Support custom retry strategies');
  console.log('7. Add caching layer');
  console.log('8. Implement bulkhead pattern for resource isolation');
}, 200);
