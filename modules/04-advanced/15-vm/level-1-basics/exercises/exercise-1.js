/**
 * Exercise 1: Safe Expression Evaluator
 *
 * OBJECTIVE:
 * Create a function that safely evaluates mathematical expressions
 * using VM, handling errors and providing only safe built-ins.
 *
 * REQUIREMENTS:
 * 1. Allow only Math operations
 * 2. Return structured result with success/error
 * 3. Handle both syntax and runtime errors
 * 4. Implement timeout protection
 *
 * LEARNING GOALS:
 * - Use vm.runInNewContext()
 * - Handle errors gracefully
 * - Create safe sandboxes
 */

const vm = require('vm');

/**
 * TODO 1: Implement safeEvaluate function
 *
 * Steps:
 * 1. Create sandbox with Math only
 * 2. Use vm.runInNewContext() with timeout
 * 3. Return { success: true, result } on success
 * 4. Return { success: false, error } on failure
 *
 * Hint: Use try-catch for error handling
 */
function safeEvaluate(expression) {
  // Your code here
}

// Test your implementation
const tests = [
  'Math.sqrt(16)',
  'Math.pow(2, 3)',
  '2 + 2 * 3',
  'Math.PI',
  'unknownVariable', // Should fail
];

console.log('Testing Safe Expression Evaluator:\n');
tests.forEach(expr => {
  const result = safeEvaluate(expr);
  console.log(`Expression: ${expr}`);
  console.log(`Result:`, result);
  console.log('');
});
