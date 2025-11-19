/**
 * Example 1: Basic util.promisify()
 *
 * Learn how to convert a simple callback-based function to a promise-based one
 * using util.promisify(). This is the foundation for modernizing Node.js code.
 *
 * Key Concepts:
 * - Node.js callback convention: callback(error, result)
 * - util.promisify() transformation
 * - Using async/await with promisified functions
 * - Error handling in promisified functions
 */

const util = require('util');

// ===== EXAMPLE 1: Simple Callback Function =====
console.log('=== Example 1: Simple Callback Function ===\n');

// Traditional callback-based function
function greetCallback(name, callback) {
  // Simulate async operation with setTimeout
  setTimeout(() => {
    if (!name) {
      // Error first in callback
      callback(new Error('Name is required'));
    } else {
      // Null for error, result second
      callback(null, `Hello, ${name}!`);
    }
  }, 100);
}

// Using the callback version (old way)
greetCallback('Alice', (err, result) => {
  if (err) {
    console.error('❌ Callback Error:', err.message);
  } else {
    console.log('✓ Callback Result:', result);
  }
});

// ===== EXAMPLE 2: Promisified Version =====
console.log('\n=== Example 2: Promisified Version ===\n');

// Convert callback function to promise-based
const greetPromise = util.promisify(greetCallback);

// Now we can use promises and .then()
greetPromise('Bob')
  .then(result => {
    console.log('✓ Promise Result:', result);
  })
  .catch(err => {
    console.error('❌ Promise Error:', err.message);
  });

// ===== EXAMPLE 3: Using with async/await =====
console.log('\n=== Example 3: Using with async/await ===\n');

async function demonstrateAsyncAwait() {
  try {
    // Clean, synchronous-looking code
    const result1 = await greetPromise('Charlie');
    console.log('✓ Async/Await Result 1:', result1);

    const result2 = await greetPromise('Diana');
    console.log('✓ Async/Await Result 2:', result2);

    // This will throw an error
    const result3 = await greetPromise(''); // Empty name
    console.log('✓ This won\'t print:', result3);

  } catch (err) {
    console.error('❌ Async/Await Error:', err.message);
  }
}

// Run the async function
demonstrateAsyncAwait();

// ===== EXAMPLE 4: Multiple Arguments =====
console.log('\n=== Example 4: Multiple Arguments ===\n');

// Function with multiple arguments
function calculateCallback(a, b, operation, callback) {
  setTimeout(() => {
    let result;
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'multiply':
        result = a * b;
        break;
      default:
        callback(new Error('Invalid operation'));
        return;
    }
    callback(null, result);
  }, 50);
}

// Promisify it
const calculatePromise = util.promisify(calculateCallback);

// Use with async/await
async function demonstrateCalculations() {
  try {
    const sum = await calculatePromise(5, 3, 'add');
    console.log('✓ 5 + 3 =', sum);

    const product = await calculatePromise(5, 3, 'multiply');
    console.log('✓ 5 * 3 =', product);

    // This will cause an error
    await calculatePromise(5, 3, 'divide');
  } catch (err) {
    console.error('❌ Calculation Error:', err.message);
  }
}

demonstrateCalculations();

/**
 * Important Notes:
 *
 * 1. Callback Convention:
 *    - The callback must be the LAST parameter
 *    - Callback signature must be: (error, ...results)
 *    - Error is ALWAYS first, null if no error
 *    - Results come after the error parameter
 *
 * 2. Benefits of Promisify:
 *    - Cleaner code with async/await
 *    - Better error handling with try/catch
 *    - Avoid callback hell
 *    - Modern JavaScript patterns
 *
 * 3. When Promisify Works:
 *    ✅ Function follows Node.js callback convention
 *    ✅ Callback is the last parameter
 *    ✅ Callback receives (err, result)
 *    ❌ Custom callback signatures
 *    ❌ Functions that call callback multiple times
 *    ❌ Event emitters
 */

/**
 * Try This:
 *
 * 1. Create a callback function that reads user data and promisify it
 * 2. Try promisifying a function with 3+ arguments before the callback
 * 3. What happens if you promisify a function that calls the callback twice?
 * 4. Create a chain of promisified async operations
 * 5. Compare error handling between callbacks and promisified versions
 */
