/**
 * Example 1: Building Custom Promisify Implementations
 *
 * Demonstrates how to build custom promisify functions from scratch,
 * understand util.promisify() internals, and handle edge cases.
 */

const util = require('util');
const fs = require('fs');

console.log('=== Custom Promisify Implementations ===\n');

// =============================================================================
// 1. Basic Custom Promisify
// =============================================================================
console.log('1. Basic Custom Promisify Implementation');

function basicPromisify(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
}

// Test basic promisify
const readFileBasic = basicPromisify(fs.readFile);

readFileBasic(__filename, 'utf8')
  .then(content => {
    console.log('✅ Basic promisify works!');
    console.log(`   File has ${content.split('\n').length} lines`);
  })
  .catch(err => console.error('Error:', err.message));

console.log('');

// =============================================================================
// 2. Advanced Promisify with Multiple Values
// =============================================================================
console.log('2. Handling Multiple Callback Values');

function advancedPromisify(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, ...values) => {
        if (err) {
          return reject(err);
        }

        // Handle different numbers of callback values
        if (values.length === 0) {
          resolve();
        } else if (values.length === 1) {
          resolve(values[0]);
        } else {
          // Multiple values - return as array
          resolve(values);
        }
      });
    });
  };
}

// Example function with multiple callback values
function multiValueCallback(a, b, callback) {
  setTimeout(() => {
    callback(null, a + b, a * b);
  }, 10);
}

const multiValuePromise = advancedPromisify(multiValueCallback);

multiValuePromise(5, 3).then(results => {
  console.log('✅ Multiple values handled:', results); // [8, 15]
  console.log('   Sum:', results[0], 'Product:', results[1]);
  console.log('');
});

// =============================================================================
// 3. Promisify with Custom Symbol Support
// =============================================================================
console.log('3. Supporting util.promisify.custom');

function completePromisify(fn) {
  // Check if function has custom promisify implementation
  if (fn[util.promisify.custom]) {
    return fn[util.promisify.custom];
  }

  // Standard promisify implementation
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, ...values) => {
        if (err) return reject(err);

        if (values.length === 0) resolve();
        else if (values.length === 1) resolve(values[0]);
        else resolve(values);
      });
    });
  };
}

// Function with custom promisify
function specialFunction(value, callback) {
  setTimeout(() => {
    callback(null, value * 2);
  }, 10);
}

// Add custom promisify that does something different
specialFunction[util.promisify.custom] = function(value) {
  return Promise.resolve(value * 3); // Custom behavior!
};

const specialPromise = completePromisify(specialFunction);

specialPromise(10).then(result => {
  console.log('✅ Custom promisify used:', result); // 30 (not 20!)
  console.log('   Custom implementation returned value * 3');
  console.log('');
});

// =============================================================================
// 4. Promisify with Validation
// =============================================================================
console.log('4. Promisify with Input Validation');

function promisifyWithValidation(fn, validator) {
  const promisified = completePromisify(fn);

  return async function(...args) {
    // Validate arguments before calling
    if (validator) {
      const validationError = validator(...args);
      if (validationError) {
        throw validationError;
      }
    }

    return await promisified(...args);
  };
}

// Example: Safe file reader
const safeReadFile = promisifyWithValidation(
  fs.readFile,
  (path, encoding) => {
    if (typeof path !== 'string') {
      return new TypeError('Path must be a string');
    }
    if (path.includes('..')) {
      return new Error('Path traversal not allowed');
    }
    return null; // Valid
  }
);

// Test validation
safeReadFile(__filename, 'utf8')
  .then(() => {
    console.log('✅ Valid path accepted');
  })
  .catch(err => console.error('Error:', err.message));

safeReadFile('../../../etc/passwd', 'utf8')
  .catch(err => {
    console.log('✅ Invalid path rejected:', err.message);
    console.log('');
  });

// =============================================================================
// 5. Promisify with Context Binding
// =============================================================================
console.log('5. Handling "this" Context');

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

// Example object with methods
class Database {
  constructor() {
    this.data = { users: 100 };
  }

  query(sql, callback) {
    setTimeout(() => {
      callback(null, this.data); // Uses "this"
    }, 10);
  }
}

const db = new Database();
const queryPromise = promisifyWithContext(db.query, db);

queryPromise('SELECT * FROM users').then(result => {
  console.log('✅ Context preserved:', result);
  console.log('');
});

// =============================================================================
// 6. Error-First Callback Detection
// =============================================================================
console.log('6. Detecting Non-Standard Callbacks');

function smartPromisify(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      const callback = (...results) => {
        // Detect if first argument looks like an error
        const firstArg = results[0];
        const isError = firstArg instanceof Error ||
                       (firstArg && typeof firstArg === 'object' && 'message' in firstArg);

        if (isError) {
          reject(firstArg);
          results.shift();
        }

        // Handle remaining values
        if (results.length === 0) resolve();
        else if (results.length === 1) resolve(results[0]);
        else resolve(results);
      };

      fn(...args, callback);
    });
  };
}

// Non-standard callback (sometimes has error, sometimes doesn't)
function weirdCallback(shouldFail, callback) {
  setTimeout(() => {
    if (shouldFail) {
      callback(new Error('Failed!'));
    } else {
      callback('success', 'extra data');
    }
  }, 10);
}

const weirdPromise = smartPromisify(weirdCallback);

weirdPromise(false).then(result => {
  console.log('✅ Success case:', result);
});

weirdPromise(true).catch(err => {
  console.log('✅ Error case:', err.message);
  console.log('');
});

// =============================================================================
// 7. Timeout Support
// =============================================================================
console.log('7. Promisify with Timeout');

function promisifyWithTimeout(fn, timeoutMs) {
  const promisified = completePromisify(fn);

  return async function(...args) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([
      promisified(...args),
      timeoutPromise
    ]);
  };
}

// Slow function
function slowOperation(delay, callback) {
  setTimeout(() => {
    callback(null, 'Done!');
  }, delay);
}

const fastOperation = promisifyWithTimeout(slowOperation, 100);
const slowOperationPromise = promisifyWithTimeout(slowOperation, 50);

// Fast enough
fastOperation(30).then(result => {
  console.log('✅ Fast operation completed:', result);
});

// Too slow
slowOperationPromise(200).catch(err => {
  console.log('✅ Slow operation timed out:', err.message);
  console.log('');
});

// =============================================================================
// 8. Compare with Built-in util.promisify
// =============================================================================
setTimeout(() => {
  console.log('8. Comparing Custom vs Built-in Promisify\n');

  // Create test function
  function testFunction(value, callback) {
    setTimeout(() => callback(null, value * 2), 10);
  }

  // Test with custom
  const customVersion = completePromisify(testFunction);

  // Test with built-in
  const builtinVersion = util.promisify(testFunction);

  Promise.all([
    customVersion(5),
    builtinVersion(5)
  ]).then(([customResult, builtinResult]) => {
    console.log('Custom result:', customResult);
    console.log('Built-in result:', builtinResult);
    console.log('✅ Both produce same result!');
    console.log('');
    console.log('=== Key Takeaways ===');
    console.log('1. Promisify converts callback-based to promise-based');
    console.log('2. Must handle multiple callback values correctly');
    console.log('3. Check for util.promisify.custom symbol first');
    console.log('4. Can add validation, timeout, and other features');
    console.log('5. Preserve context when needed');
  });
}, 300);

// =============================================================================
// 9. Production-Ready Promisify
// =============================================================================
setTimeout(() => {
  console.log('\n9. Production-Ready Implementation\n');

  function productionPromisify(fn, options = {}) {
    const {
      multiArgs = false,
      timeout = null,
      context = null,
      validator = null
    } = options;

    // Check for custom implementation
    if (fn[util.promisify.custom]) {
      return fn[util.promisify.custom];
    }

    return function(...args) {
      // Validate if validator provided
      if (validator) {
        const error = validator(...args);
        if (error) return Promise.reject(error);
      }

      const promise = new Promise((resolve, reject) => {
        const callback = (err, ...values) => {
          if (err) return reject(err);

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

        if (context) {
          fn.call(context, ...args, callback);
        } else {
          fn(...args, callback);
        }
      });

      // Add timeout if specified
      if (timeout) {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
        });
        return Promise.race([promise, timeoutPromise]);
      }

      return promise;
    };
  }

  // Example usage
  const advancedReadFile = productionPromisify(fs.readFile, {
    timeout: 5000,
    validator: (path) => {
      if (typeof path !== 'string') return new TypeError('Invalid path');
      return null;
    }
  });

  advancedReadFile(__filename, 'utf8')
    .then(content => {
      console.log('✅ Production promisify works!');
      console.log('   Features: validation, timeout, context, multiArgs');
      console.log('');
      console.log('=== Complete! ===');
    })
    .catch(err => console.error('Error:', err.message));
}, 500);
