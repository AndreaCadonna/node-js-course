/**
 * Exercise 5 Solution: Timeout-Protected Executor
 */

const vm = require('vm');

class TimeoutExecutor {
  constructor(defaultTimeout = 1000) {
    this.defaultTimeout = defaultTimeout;
  }

  execute(code, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;
    const context = options.context || {};
    const startTime = Date.now();

    try {
      vm.createContext(context);
      const result = vm.runInContext(code, context, {
        timeout,
        displayErrors: true,
      });

      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        timedOut: false,
      };
    } catch (err) {
      return {
        success: false,
        result: null,
        error: err.message,
        executionTime: Date.now() - startTime,
        timedOut: err.message.includes('timeout'),
      };
    }
  }
}

// Test
const executor = new TimeoutExecutor(100);

console.log('Timeout Executor Solution:\n');

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
