/**
 * Exercise 2: Object Inspection
 *
 * DIFFICULTY: ⭐ Easy
 * TIME: 10-15 minutes
 *
 * OBJECTIVE:
 * Master util.inspect for debugging complex objects, nested structures,
 * and configuring output for better readability.
 *
 * REQUIREMENTS:
 * 1. Create a complex nested object with various data types
 * 2. Use util.inspect with default options to display it
 * 3. Customize depth, colors, and other inspection options
 * 4. Compare util.inspect with console.log and JSON.stringify
 * 5. Handle circular references safely
 *
 * BONUS CHALLENGES:
 * - Create a custom inspect function for a class
 * - Inspect objects with symbols and getters
 * - Use inspect to debug promise states
 *
 * HINTS:
 * - util.inspect has many options: depth, colors, compact, etc.
 * - Default depth is 2, increase for deeper nested objects
 * - Colors work in terminal but not in all environments
 */

const util = require('util');

// TODO 1: Create a complex object
// Include: nested objects, arrays, functions, dates, null, undefined
const complexObject = {
  // Your code here:
  // Create an object with at least:
  // - Basic types (string, number, boolean)
  // - Nested objects (2-3 levels deep)
  // - Arrays with mixed types
  // - Date object
  // - Function
  // - null and undefined values
};

// TODO 2: Basic inspection
function basicInspection() {
  console.log('=== Basic Inspection ===\n');

  // Your code here:
  // 1. Use util.inspect with default options
  // 2. Display the result
  // 3. Note what's hidden due to depth limits
}

// TODO 3: Custom inspection options
function customInspection() {
  console.log('\n=== Custom Inspection ===\n');

  // Your code here:
  // Use util.inspect with custom options:
  // - depth: null (unlimited depth)
  // - colors: true
  // - compact: false
  // - maxArrayLength: 10
}

// TODO 4: Compare different methods
function compareMethods() {
  console.log('\n=== Comparison: inspect vs log vs JSON ===\n');

  const testObj = {
    name: 'Test',
    data: { nested: { value: 42 } },
    func: () => 'hello'
  };

  // Your code here:
  // 1. Display with console.log
  // 2. Display with util.inspect
  // 3. Try JSON.stringify (note what happens with functions)
  // 4. Explain the differences
}

// TODO 5: Handle circular references
function handleCircular() {
  console.log('\n=== Handling Circular References ===\n');

  // Your code here:
  // 1. Create an object with circular reference
  // 2. Show what happens with JSON.stringify (try-catch)
  // 3. Show how util.inspect handles it gracefully
}

// TODO 6: Run all demonstrations
function runAllTests() {
  // Your code here:
  // Call all the above functions
}

// Uncomment to run:
// runAllTests();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Run your solution:
 *    node exercise-2.js
 *
 * 2. Check the output:
 *    - Basic inspection should show limited depth
 *    - Custom inspection should show full structure
 *    - Comparison should highlight differences
 *    - Circular reference should be handled
 *
 * EXAMPLE OUTPUT:
 * ───────────────────────────────────────
 * === Basic Inspection ===
 *
 * {
 *   user: { id: 1, profile: [Object] },
 *   timestamp: 2024-11-19T10:30:00.000Z
 * }
 *
 * === Custom Inspection ===
 *
 * {
 *   user: {
 *     id: 1,
 *     profile: {
 *       name: 'John Doe',
 *       settings: { theme: 'dark', notifications: true }
 *     }
 *   },
 *   timestamp: 2024-11-19T10:30:00.000Z
 * }
 * ───────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - When should you use util.inspect vs console.log?
 * - What are the most useful inspection options?
 * - How does util.inspect handle circular references?
 * - When would you use JSON.stringify instead?
 */
