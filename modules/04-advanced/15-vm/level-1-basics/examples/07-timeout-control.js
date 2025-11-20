/**
 * 07-timeout-control.js
 * =====================
 * Implementing timeout protection for VM code execution
 *
 * Key Concepts:
 * - Setting execution timeouts
 * - Preventing infinite loops
 * - Breaking on SIGINT
 * - Resource control basics
 *
 * Run: node 07-timeout-control.js
 */

const vm = require('vm');

console.log('='.repeat(70));
console.log('TIMEOUT CONTROL IN VM');
console.log('='.repeat(70));

// =============================================================================
// 1. BASIC TIMEOUT USAGE
// =============================================================================

console.log('\n1. Basic Timeout Protection:');
console.log('-'.repeat(70));

// This would hang forever without timeout
console.log('Executing infinite loop with timeout...');
try {
  vm.runInNewContext('while(true) {}', {}, {
    timeout: 100,  // 100ms timeout
  });
} catch (err) {
  console.log('✓ Timeout exceeded!');
  console.log('  Error:', err.message);
}

// Code that finishes within timeout
console.log('\nExecuting fast code with timeout...');
try {
  const result = vm.runInNewContext('2 + 2', {}, {
    timeout: 100,
  });
  console.log('✓ Completed within timeout');
  console.log('  Result:', result);
} catch (err) {
  console.log('❌ Timeout exceeded:', err.message);
}

// =============================================================================
// 2. DIFFERENT TIMEOUT SCENARIOS
// =============================================================================

console.log('\n2. Different Timeout Scenarios:');
console.log('-'.repeat(70));

const scenarios = [
  {
    name: 'Infinite loop',
    code: 'while(true) {}',
    timeout: 50,
  },
  {
    name: 'Long-running calculation',
    code: 'let sum = 0; for(let i = 0; i < 100000000; i++) sum += i; sum',
    timeout: 50,
  },
  {
    name: 'Quick operation',
    code: 'Math.sqrt(16)',
    timeout: 50,
  },
  {
    name: 'Recursive infinite',
    code: 'function loop() { loop(); } loop();',
    timeout: 50,
  },
];

scenarios.forEach(({ name, code, timeout }) => {
  console.log(`\n${name}:`);
  try {
    const result = vm.runInNewContext(code, { Math }, { timeout });
    console.log(`  ✓ Completed: ${result}`);
  } catch (err) {
    console.log(`  ❌ Timeout: ${err.message}`);
  }
});

// =============================================================================
// 3. TIMEOUT WITH SCRIPT CLASS
// =============================================================================

console.log('\n\n3. Timeout with Script Class:');
console.log('-'.repeat(70));

const infiniteScript = new vm.Script('while(true) {}');

console.log('Executing script with timeout...');
try {
  const sandbox = {};
  vm.createContext(sandbox);
  infiniteScript.runInContext(sandbox, {
    timeout: 100,
  });
} catch (err) {
  console.log('✓ Timeout works with Script class');
  console.log('  Error:', err.message);
}

// =============================================================================
// 4. SAFE EXECUTOR WITH TIMEOUT
// =============================================================================

console.log('\n4. Safe Executor with Configurable Timeout:');
console.log('-'.repeat(70));

class SafeExecutor {
  constructor(defaultTimeout = 1000) {
    this.defaultTimeout = defaultTimeout;
  }

  execute(code, context = {}, options = {}) {
    const timeout = options.timeout || this.defaultTimeout;
    const startTime = Date.now();

    try {
      const sandbox = { ...context };
      vm.createContext(sandbox);

      const result = vm.runInContext(code, sandbox, {
        timeout,
        filename: options.filename || 'code.js',
        displayErrors: true,
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        result,
        executionTime,
        timedOut: false,
      };
    } catch (err) {
      const executionTime = Date.now() - startTime;
      const timedOut = err.message.includes('timeout');

      return {
        success: false,
        result: null,
        error: err.message,
        executionTime,
        timedOut,
      };
    }
  }
}

const executor = new SafeExecutor(100);

const tests = [
  { code: '2 + 2', desc: 'Fast code' },
  { code: 'while(true) {}', desc: 'Infinite loop' },
  { code: 'Math.sqrt(16)', desc: 'Math operation' },
];

tests.forEach(({ code, desc }) => {
  const result = executor.execute(code, { Math });
  console.log(`\n${desc}:`);
  console.log(`  Success: ${result.success}`);
  console.log(`  Execution time: ${result.executionTime}ms`);
  console.log(`  Timed out: ${result.timedOut}`);
  if (result.success) {
    console.log(`  Result: ${result.result}`);
  }
});

// =============================================================================
// 5. BREAK ON SIGINT
// =============================================================================

console.log('\n\n5. Break on SIGINT:');
console.log('-'.repeat(70));

console.log('The breakOnSigint option allows Ctrl+C to interrupt execution');
console.log('Example (not demonstrated to avoid interrupting script):');
console.log(`
  vm.runInNewContext('while(true) {}', {}, {
    timeout: 5000,
    breakOnSigint: true  // Allow Ctrl+C to break
  });
`);
console.log('✓ Use breakOnSigint for interactive applications');

// =============================================================================
// 6. PROGRESSIVE TIMEOUT EXAMPLE
// =============================================================================

console.log('\n6. Progressive Timeout Strategy:');
console.log('-'.repeat(70));

class ProgressiveExecutor {
  execute(code, context = {}) {
    const timeouts = [50, 100, 500];
    const sandbox = { ...context };
    vm.createContext(sandbox);

    for (let i = 0; i < timeouts.length; i++) {
      const timeout = timeouts[i];
      console.log(`  Attempt ${i + 1} with ${timeout}ms timeout...`);

      try {
        const result = vm.runInContext(code, sandbox, { timeout });
        console.log(`  ✓ Completed in attempt ${i + 1}`);
        return { success: true, result, attempts: i + 1 };
      } catch (err) {
        if (i === timeouts.length - 1) {
          console.log(`  ❌ Failed all attempts`);
          return { success: false, error: err.message, attempts: i + 1 };
        }
      }
    }
  }
}

const progExecutor = new ProgressiveExecutor();

console.log('\nTesting with quick code:');
progExecutor.execute('2 + 2');

console.log('\nTesting with slow code:');
progExecutor.execute('let x = 0; for(let i = 0; i < 10000000; i++) x += i; x');

// =============================================================================
// 7. MONITORING EXECUTION TIME
// =============================================================================

console.log('\n\n7. Monitoring Execution Time:');
console.log('-'.repeat(70));

class MonitoredExecutor {
  execute(code, context = {}, maxTime = 1000) {
    const sandbox = {
      ...context,
      __startTime__: Date.now(),
    };

    vm.createContext(sandbox);

    try {
      const result = vm.runInContext(code, sandbox, {
        timeout: maxTime,
      });

      const elapsed = Date.now() - sandbox.__startTime__;

      return {
        success: true,
        result,
        elapsed,
        timeoutUsed: (elapsed / maxTime * 100).toFixed(1) + '%',
      };
    } catch (err) {
      const elapsed = Date.now() - sandbox.__startTime__;

      return {
        success: false,
        error: err.message,
        elapsed,
        timedOut: err.message.includes('timeout'),
      };
    }
  }
}

const monitor = new MonitoredExecutor();

[
  'Math.sqrt(16)',
  '2 + 2',
  'let sum = 0; for(let i = 0; i < 1000000; i++) sum += i; sum',
].forEach(code => {
  const result = monitor.execute(code, { Math }, 100);
  console.log(`\nCode: ${code.substring(0, 30)}...`);
  console.log(`  Success: ${result.success}`);
  console.log(`  Elapsed: ${result.elapsed}ms`);
  if (result.timeoutUsed) {
    console.log(`  Timeout used: ${result.timeoutUsed}`);
  }
});

// =============================================================================
// 8. PRACTICAL EXAMPLE - USER CODE EXECUTOR
// =============================================================================

console.log('\n\n8. Practical Example - User Code Executor:');
console.log('-'.repeat(70));

class UserCodeExecutor {
  constructor(options = {}) {
    this.maxTimeout = options.maxTimeout || 5000;
    this.defaultTimeout = options.defaultTimeout || 1000;
  }

  execute(code, userTimeout) {
    // Use user timeout but cap it at max
    const timeout = Math.min(
      userTimeout || this.defaultTimeout,
      this.maxTimeout
    );

    const startTime = Date.now();

    try {
      const sandbox = {
        Math: Math,
        Date: Date,
        JSON: JSON,
      };

      vm.createContext(sandbox);

      const result = vm.runInContext(code, sandbox, {
        timeout,
        filename: 'user-code.js',
        displayErrors: true,
      });

      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        timeoutLimit: timeout,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        executionTime: Date.now() - startTime,
        timeoutLimit: timeout,
        timedOut: err.message.includes('timeout'),
      };
    }
  }
}

const userExecutor = new UserCodeExecutor({
  maxTimeout: 200,
  defaultTimeout: 100,
});

console.log('Test 1 - Default timeout:');
console.log(userExecutor.execute('2 + 2'));

console.log('\nTest 2 - Custom timeout (150ms):');
console.log(userExecutor.execute('Math.sqrt(16)', 150));

console.log('\nTest 3 - Requested timeout too high (will be capped):');
console.log(userExecutor.execute('2 + 2', 10000));

console.log('\nTest 4 - Timeout exceeded:');
console.log(userExecutor.execute('while(true) {}', 50));

// =============================================================================
// SUMMARY
// =============================================================================

console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

console.log(`
Key Takeaways:

1. Timeout Option:
   ✓ Essential for untrusted code
   ✓ Prevents infinite loops
   ✓ Measured in milliseconds
   ✓ Works with all execution methods

2. When Timeout is Triggered:
   - Infinite loops
   - Very long-running calculations
   - Recursive calls without base case
   - Any code exceeding time limit

3. Best Practices:
   ✓ Always set timeout for untrusted code
   ✓ Use reasonable default (100-1000ms)
   ✓ Allow users to specify but cap it
   ✓ Monitor execution time
   ✓ Provide clear timeout error messages

4. breakOnSigint:
   ✓ Allows Ctrl+C interruption
   ✓ Useful for interactive applications
   ✓ Not needed for server environments

5. Production Patterns:
   ✓ Progressive timeouts (retry with longer timeout)
   ✓ Timeout monitoring and metrics
   ✓ User-configurable with max cap
   ✓ Clear feedback when timeout occurs

6. Limitations:
   ⚠️  Timeout is not instant (polling-based)
   ⚠️  Very tight loops might take longer to interrupt
   ⚠️  Not a replacement for true resource limits
   ⚠️  Combine with other security measures
`);

console.log('='.repeat(70));
