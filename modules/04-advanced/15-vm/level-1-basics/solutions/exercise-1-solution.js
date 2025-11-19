/**
 * Exercise 1 Solution: Safe Expression Evaluator
 */

const vm = require('vm');

function safeEvaluate(expression) {
  try {
    const sandbox = { Math: Math };
    const result = vm.runInNewContext(expression, sandbox, {
      timeout: 100,
      displayErrors: true,
    });
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Test
const tests = [
  'Math.sqrt(16)',
  'Math.pow(2, 3)',
  '2 + 2 * 3',
  'Math.PI',
  'unknownVariable',
];

console.log('Safe Expression Evaluator Solution:\n');
tests.forEach(expr => {
  const result = safeEvaluate(expr);
  console.log(`Expression: ${expr}`);
  console.log(`Result:`, result);
  console.log('');
});
