/**
 * Exercise 5: Timeout-Protected Executor
 *
 * OBJECTIVE:
 * Build a code executor with timeout protection and
 * execution time tracking.
 *
 * REQUIREMENTS:
 * 1. Execute code with configurable timeout
 * 2. Track execution time
 * 3. Report timeout vs success
 * 4. Provide detailed results
 *
 * LEARNING GOALS:
 * - Implement timeout protection
 * - Track execution metrics
 * - Handle timeout errors
 */

const vm = require('vm');

/**
 * TODO 1: Implement TimeoutExecutor class
 *
 * Methods needed:
 * - constructor(defaultTimeout)
 * - execute(code, options)
 * - Returns: { success, result, executionTime, timedOut }
 */
class TimeoutExecutor {
  constructor(defaultTimeout = 1000) {
    // Your code here
  }

  execute(code, options = {}) {
    // Your code here
    // options: { timeout, context }
  }
}

// Test your implementation
const executor = new TimeoutExecutor(100);

console.log('Testing Timeout Executor:\n');

const tests = [
  { code: '2 + 2', desc: 'Fast code' },
  { code: 'Math.sqrt(16)', desc: 'Math operation', context: { Math } },
  { code: 'while(true) {}', desc: 'Infinite loop' },
  { code: 'let sum = 0; for(let i = 0; i < 1000000; i++) sum += i; sum', desc: 'Long calculation' },
];

tests.forEach(({ code, desc, context }) => {
  console.log(`Test: ${desc}`);
  const result = executor.execute(code, { context });
  console.log(`  Success: ${result.success}`);
  console.log(`  Time: ${result.executionTime}ms`);
  console.log(`  Timed out: ${result.timedOut}`);
  if (result.success) {
    console.log(`  Result: ${result.result}`);
  }
  console.log('');
});
