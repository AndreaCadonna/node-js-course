/**
 * Exercise 1 Solution: Promisify Custom Function
 *
 * This solution demonstrates:
 * - Converting callback-based functions to Promises using util.promisify
 * - Proper error handling in both callback and Promise patterns
 * - Comparing readability of callbacks vs async/await
 * - Creating custom promisified functions
 */

const util = require('util');

/**
 * Step 1: Create a callback-based function
 * This simulates reading user data from a database
 */
function getUserData(userId, callback) {
  // Simulate async operation with setTimeout
  setTimeout(() => {
    // Validate userId
    if (!userId || userId < 1) {
      // Error-first callback pattern: callback(error, result)
      const error = new Error('Invalid user ID');
      return callback(error);
    }

    // Simulate database result
    const userData = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date()
    };

    // Success: callback(null, result)
    callback(null, userData);
  }, 100);
}

/**
 * Step 2: Promisify the function
 * util.promisify converts callback-based functions to Promise-based
 * It expects the callback to follow (err, result) signature
 */
const getUserDataAsync = util.promisify(getUserData);

/**
 * Step 3: Test the callback version
 */
async function testCallbackVersion() {
  console.log('=== Testing Callback Version ===\n');

  // Test success case
  console.log('Test 1: Valid userId');
  getUserData(1, (err, data) => {
    if (err) {
      console.error('Callback error:', err.message);
      return;
    }
    console.log('Callback success:');
    console.log(data);
  });

  // Wait for async operation
  await new Promise(resolve => setTimeout(resolve, 150));

  // Test error case
  console.log('\nTest 2: Invalid userId');
  getUserData(0, (err, data) => {
    if (err) {
      console.error('Callback error:', err.message);
      return;
    }
    console.log('Callback success:', data);
  });

  // Wait for async operation
  await new Promise(resolve => setTimeout(resolve, 150));
}

/**
 * Step 4: Test the promisified version
 */
async function testPromiseVersion() {
  console.log('\n=== Testing Promise Version ===\n');

  // Test success case
  console.log('Test 1: Valid userId');
  try {
    const data = await getUserDataAsync(1);
    console.log('Promise success:');
    console.log(data);
  } catch (err) {
    console.error('Promise error:', err.message);
  }

  // Test error case
  console.log('\nTest 2: Invalid userId');
  try {
    const data = await getUserDataAsync(0);
    console.log('Promise success:', data);
  } catch (err) {
    console.error('Promise error caught:', err.message);
  }
}

/**
 * Step 5: Run both tests
 */
async function runTests() {
  await testCallbackVersion();
  await testPromiseVersion();

  // Bonus: Show clean code comparison
  console.log('\n=== Code Comparison ===\n');
  console.log('Notice how async/await is much cleaner than callbacks!');
  console.log('No nested callbacks, easier error handling.\n');
}

// Run the tests
runTests();

/**
 * BONUS 1: Promisify setTimeout to create a sleep function
 */

// Create a promisified sleep function
const sleep = util.promisify(setTimeout);

async function demonstrateSleep() {
  console.log('\n=== Bonus: Sleep Function ===\n');
  console.log('Starting...');
  await sleep(1000);
  console.log('1 second passed');
  await sleep(1000);
  console.log('2 seconds passed');
}

// Uncomment to run:
// demonstrateSleep();

/**
 * BONUS 2: Custom promisify for non-standard callback signatures
 * Some functions don't follow the (err, result) pattern
 */

// Function with different callback signature (result, err)
function customCallbackFunction(value, callback) {
  setTimeout(() => {
    if (value < 0) {
      callback(undefined, new Error('Value must be positive'));
    } else {
      callback(value * 2, undefined);
    }
  }, 100);
}

// Custom promisify implementation
function promisifyCustom(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (result, err) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
}

const customCallbackAsync = promisifyCustom(customCallbackFunction);

async function demonstrateCustomPromisify() {
  console.log('\n=== Bonus: Custom Promisify ===\n');

  try {
    const result = await customCallbackAsync(5);
    console.log('Custom promisify result:', result); // 10
  } catch (err) {
    console.error('Error:', err.message);
  }

  try {
    const result = await customCallbackAsync(-5);
    console.log('Result:', result);
  } catch (err) {
    console.error('Custom promisify error:', err.message);
  }
}

// Uncomment to run:
// demonstrateCustomPromisify();

/**
 * ALTERNATIVE SOLUTION: Using util.promisify.custom
 *
 * You can define how a function should be promisified
 */

function advancedGetUserData(userId, callback) {
  setTimeout(() => {
    if (!userId || userId < 1) {
      return callback(new Error('Invalid user ID'));
    }
    callback(null, { id: userId, name: 'John Doe' });
  }, 100);
}

// Define custom promisification
advancedGetUserData[util.promisify.custom] = function (userId) {
  return new Promise((resolve, reject) => {
    advancedGetUserData(userId, (err, data) => {
      if (err) {
        reject(err);
      } else {
        // Add custom behavior - uppercase the name
        resolve({ ...data, name: data.name.toUpperCase() });
      }
    });
  });
};

const advancedGetUserDataAsync = util.promisify(advancedGetUserData);

async function demonstrateCustomSymbol() {
  console.log('\n=== Bonus: util.promisify.custom ===\n');

  const data = await advancedGetUserDataAsync(1);
  console.log('Custom promisified result:', data);
  // Name will be uppercase: JOHN DOE
}

// Uncomment to run:
// demonstrateCustomSymbol();

/**
 * KEY LEARNING POINTS:
 *
 * 1. util.promisify:
 *    - Converts callback functions to Promise-based functions
 *    - Expects (err, result) callback signature
 *    - Returns a function that returns a Promise
 *
 * 2. Error-First Callbacks:
 *    - Convention: callback(error, result)
 *    - First argument is always error (null if success)
 *    - Remaining arguments are results
 *
 * 3. Benefits of Promises:
 *    - Cleaner code with async/await
 *    - Better error handling with try-catch
 *    - Easier to compose and chain
 *    - Avoids callback hell
 *
 * 4. Custom Promisification:
 *    - Use util.promisify.custom symbol for special cases
 *    - Create custom wrapper for non-standard signatures
 *    - Maintain backward compatibility if needed
 *
 * 5. Best Practices:
 *    - Always handle errors (both callbacks and promises)
 *    - Use try-catch with async/await
 *    - Document expected callback signatures
 *    - Test both success and error paths
 */

/**
 * COMMON MISTAKES TO AVOID:
 *
 * ❌ Forgetting to bind context:
 *    const method = util.promisify(obj.method);
 *    // This will lose 'this' context
 *
 * ✅ Correct way:
 *    const method = util.promisify(obj.method.bind(obj));
 *
 * ❌ Not handling promise rejections:
 *    const data = await getUserDataAsync(0);
 *    // Will crash if error is not caught
 *
 * ✅ Correct way:
 *    try {
 *      const data = await getUserDataAsync(0);
 *    } catch (err) {
 *      console.error(err);
 *    }
 *
 * ❌ Promisifying non-standard callbacks:
 *    function fn(callback) { callback(result); } // No error argument
 *    const promisified = util.promisify(fn); // Won't work correctly
 *
 * ✅ Use custom promisification for non-standard signatures
 */

/**
 * GOING FURTHER:
 *
 * Try these challenges:
 * 1. Promisify the entire 'fs' module methods
 * 2. Create a promisify function that handles timeouts
 * 3. Build a utility that auto-promisifies all methods of a class
 * 4. Implement retry logic for promisified functions
 * 5. Create a cache wrapper for promisified functions
 */
