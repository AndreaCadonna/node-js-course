/**
 * Exercise 1: Promisify Custom Function
 *
 * DIFFICULTY: ⭐ Easy
 * TIME: 10-15 minutes
 *
 * OBJECTIVE:
 * Learn to convert callback-based functions to Promise-based using util.promisify.
 * This is essential for modernizing legacy code and working with async/await.
 *
 * REQUIREMENTS:
 * 1. Create a callback-based function that simulates async file reading
 * 2. Use util.promisify to convert it to a Promise-based function
 * 3. Use the promisified function with async/await
 * 4. Handle both success and error cases
 * 5. Compare the callback vs Promise versions side by side
 *
 * BONUS CHALLENGES:
 * - Create a custom promisify for a function with multiple callback arguments
 * - Promisify setTimeout to create a sleep function
 * - Handle functions that don't follow the (err, result) callback pattern
 *
 * HINTS:
 * - util.promisify expects callbacks with (err, result) signature
 * - The promisified function returns a Promise
 * - Use try-catch with async/await for error handling
 */

const util = require('util');

// TODO 1: Create a callback-based function
// This simulates reading user data from a database
function getUserData(userId, callback) {
  // Simulate async operation with setTimeout
  setTimeout(() => {
    // Your code here:
    // 1. If userId is invalid (e.g., < 1), call callback with error
    // 2. Otherwise, call callback with null and user data object
    // Example: callback(null, { id: userId, name: 'John Doe', email: 'john@example.com' })
  }, 100);
}

// TODO 2: Promisify the function
// Use util.promisify to convert getUserData to Promise-based
// const getUserDataAsync = ...

// TODO 3: Test the callback version
async function testCallbackVersion() {
  console.log('=== Testing Callback Version ===\n');

  // Your code here:
  // Call getUserData with a callback
  // Handle both success and error cases
}

// TODO 4: Test the promisified version
async function testPromiseVersion() {
  console.log('\n=== Testing Promise Version ===\n');

  // Your code here:
  // Call getUserDataAsync with async/await
  // Use try-catch for error handling
  // Test both valid and invalid userId
}

// TODO 5: Run both tests
async function runTests() {
  // Your code here:
  // Call testCallbackVersion()
  // Call testPromiseVersion()
}

// Uncomment to run:
// runTests();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Run your solution:
 *    node exercise-1.js
 *
 * 2. Expected output:
 *    - Callback version should display user data
 *    - Promise version should display the same data
 *    - Both should handle errors properly
 *
 * 3. Test cases to verify:
 *    - Valid userId (should return user data)
 *    - Invalid userId (should handle error)
 *
 * EXAMPLE OUTPUT:
 * ───────────────────────────────────────
 * === Testing Callback Version ===
 *
 * Callback success:
 * { id: 1, name: 'John Doe', email: 'john@example.com' }
 *
 * Callback error:
 * Error: Invalid user ID
 *
 * === Testing Promise Version ===
 *
 * Promise success:
 * { id: 1, name: 'John Doe', email: 'john@example.com' }
 *
 * Promise error caught:
 * Error: Invalid user ID
 * ───────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - What is util.promisify and why is it useful?
 * - What callback signature does promisify expect?
 * - How does error handling differ between callbacks and promises?
 * - When would you use promisify vs writing promises manually?
 */
