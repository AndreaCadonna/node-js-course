/**
 * 08-sandbox-basics.js
 * ====================
 * Creating basic sandboxed environments with controlled access
 *
 * Key Concepts:
 * - Building safe sandboxes
 * - Controlling built-in access
 * - Providing custom APIs
 * - Security basics
 *
 * Run: node 08-sandbox-basics.js
 */

const vm = require('vm');

console.log('='.repeat(70));
console.log('SANDBOX BASICS');
console.log('='.repeat(70));

// =============================================================================
// 1. MINIMAL SANDBOX
// =============================================================================

console.log('\n1. Minimal Sandbox:');
console.log('-'.repeat(70));

const minimalSandbox = {
  x: 10,
  y: 20,
};

vm.createContext(minimalSandbox);

try {
  vm.runInContext('result = x + y', minimalSandbox);
  console.log('✓ Result:', minimalSandbox.result);

  // Try to use console (not available)
  vm.runInContext('console.log("test")', minimalSandbox);
} catch (err) {
  console.log('❌ console not available:', err.message);
  console.log('✓ Sandbox has only what we provide');
}

// =============================================================================
// 2. SANDBOX WITH SAFE BUILT-INS
// =============================================================================

console.log('\n2. Sandbox with Safe Built-ins:');
console.log('-'.repeat(70));

const safeSandbox = {
  // Provide safe built-ins
  Math: Math,
  Date: Date,
  JSON: JSON,
  console: console,

  // Data
  numbers: [1, 2, 3, 4, 5],
};

vm.createContext(safeSandbox);

vm.runInContext(`
  console.log('Numbers:', numbers);
  const sum = numbers.reduce((a, b) => a + b, 0);
  const avg = sum / numbers.length;
  console.log('Average:', avg);
  console.log('Square root of avg:', Math.sqrt(avg));
`, safeSandbox);

console.log('✓ Code can use provided built-ins');

// =============================================================================
// 3. RESTRICTED SANDBOX
// =============================================================================

console.log('\n3. Restricted Sandbox (Blocking Dangerous APIs):');
console.log('-'.repeat(70));

const restrictedSandbox = {
  // Allow
  Math: Math,
  console: console,

  // Block (explicitly undefined)
  require: undefined,
  process: undefined,
  global: undefined,
  setTimeout: undefined,
  setInterval: undefined,
};

vm.createContext(restrictedSandbox);

// This works
vm.runInContext('console.log("Math.PI:", Math.PI)', restrictedSandbox);

// These fail
const blockedAPIs = ['require("fs")', 'process.exit()', 'setTimeout(() => {}, 0)'];

blockedAPIs.forEach(api => {
  try {
    vm.runInContext(api, restrictedSandbox);
    console.log(`⚠️  ${api} should have failed!`);
  } catch (err) {
    console.log(`✓ Blocked: ${api}`);
  }
});

// =============================================================================
// 4. SANDBOX WITH CUSTOM FUNCTIONS
// =============================================================================

console.log('\n4. Sandbox with Custom Functions:');
console.log('-'.repeat(70));

const customSandbox = {
  console: console,
  data: [10, 20, 30, 40, 50],

  // Custom utility functions
  sum: (arr) => arr.reduce((a, b) => a + b, 0),
  average: (arr) => arr.reduce((a, b) => a + b, 0) / arr.length,
  min: (arr) => Math.min(...arr),
  max: (arr) => Math.max(...arr),
};

vm.createContext(customSandbox);

vm.runInContext(`
  console.log('Data:', data);
  console.log('Sum:', sum(data));
  console.log('Average:', average(data));
  console.log('Min:', min(data));
  console.log('Max:', max(data));
`, customSandbox);

console.log('✓ Custom functions available in sandbox');

// =============================================================================
// 5. SANDBOX WITH READ-ONLY DATA
// =============================================================================

console.log('\n5. Sandbox with Read-Only Data:');
console.log('-'.repeat(70));

const originalConfig = {
  apiKey: 'secret-key-123',
  endpoint: 'https://api.example.com',
};

// Clone to prevent modifications
const readOnlySandbox = {
  config: JSON.parse(JSON.stringify(originalConfig)),
  console: console,
};

vm.createContext(readOnlySandbox);

// Try to modify
vm.runInContext(`
  console.log('Original config:', config);
  config.apiKey = 'hacked';
  console.log('Modified in sandbox:', config);
`, readOnlySandbox);

console.log('\nOriginal config unchanged:');
console.log(originalConfig);
console.log('✓ Cloning prevents modifications to original data');

// =============================================================================
// 6. PRACTICAL EXAMPLE - SAFE CALCULATOR
// =============================================================================

console.log('\n6. Practical Example - Safe Calculator:');
console.log('-'.repeat(70));

class SafeCalculator {
  constructor() {
    this.context = {
      Math: Math,
      result: null,

      // Helper functions
      add: (...nums) => nums.reduce((a, b) => a + b, 0),
      multiply: (...nums) => nums.reduce((a, b) => a * b, 1),
      average: (...nums) => nums.reduce((a, b) => a + b, 0) / nums.length,
    };

    vm.createContext(this.context);
  }

  calculate(expression) {
    try {
      const result = vm.runInContext(expression, this.context, {
        timeout: 100,
      });
      return { success: true, result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

const calc = new SafeCalculator();

const expressions = [
  'Math.sqrt(16)',
  'Math.pow(2, 10)',
  'add(1, 2, 3, 4, 5)',
  'multiply(2, 3, 4)',
  'average(10, 20, 30, 40)',
  'Math.PI * 2',
];

expressions.forEach(expr => {
  const result = calc.calculate(expr);
  if (result.success) {
    console.log(`✓ ${expr} = ${result.result}`);
  } else {
    console.log(`❌ ${expr} - Error: ${result.error}`);
  }
});

// =============================================================================
// 7. SANDBOX ISOLATION DEMONSTRATION
// =============================================================================

console.log('\n7. Sandbox Isolation:');
console.log('-'.repeat(70));

// Create two independent sandboxes
const sandbox1 = {
  name: 'Sandbox 1',
  value: 100,
  console: console,
};

const sandbox2 = {
  name: 'Sandbox 2',
  value: 200,
  console: console,
};

vm.createContext(sandbox1);
vm.createContext(sandbox2);

vm.runInContext(`
  value = value * 2;
  console.log(name + ': value =', value);
`, sandbox1);

vm.runInContext(`
  value = value * 3;
  console.log(name + ': value =', value);
`, sandbox2);

console.log('\nFinal values:');
console.log('Sandbox 1:', sandbox1.value);
console.log('Sandbox 2:', sandbox2.value);
console.log('✓ Sandboxes are completely isolated');

// =============================================================================
// 8. SANDBOX BUILDER CLASS
// =============================================================================

console.log('\n8. Sandbox Builder Class:');
console.log('-'.repeat(70));

class SandboxBuilder {
  constructor() {
    this.sandbox = {};
  }

  allowMath() {
    this.sandbox.Math = Math;
    return this;
  }

  allowDate() {
    this.sandbox.Date = Date;
    return this;
  }

  allowJSON() {
    this.sandbox.JSON = JSON;
    return this;
  }

  allowConsole() {
    this.sandbox.console = console;
    return this;
  }

  addData(key, value) {
    this.sandbox[key] = value;
    return this;
  }

  addFunction(name, fn) {
    this.sandbox[name] = fn;
    return this;
  }

  build() {
    vm.createContext(this.sandbox);
    return this.sandbox;
  }

  execute(code) {
    if (!vm.isContext(this.sandbox)) {
      this.build();
    }

    try {
      return vm.runInContext(code, this.sandbox, { timeout: 100 });
    } catch (err) {
      throw new Error(`Execution failed: ${err.message}`);
    }
  }
}

// Use the builder
const builder = new SandboxBuilder();

builder
  .allowMath()
  .allowConsole()
  .addData('numbers', [1, 2, 3, 4, 5])
  .addFunction('sum', arr => arr.reduce((a, b) => a + b, 0))
  .build();

const result = builder.execute(`
  console.log('Numbers:', numbers);
  const total = sum(numbers);
  console.log('Sum:', total);
  Math.sqrt(total);
`);

console.log('Final result:', result);
console.log('✓ Builder pattern for flexible sandbox creation');

// =============================================================================
// SUMMARY
// =============================================================================

console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

console.log(`
Key Takeaways:

1. Sandbox Basics:
   ✓ Sandbox = object that becomes global in context
   ✓ Control what's available to code
   ✓ Start minimal, add what's needed
   ✓ Each sandbox is isolated

2. Safe Built-ins:
   ✓ Math, Date, JSON - usually safe
   ✓ console - safe for logging
   ✓ Object, Array - be careful
   ✓ require, process, fs - dangerous!

3. Custom Functions:
   ✓ Provide domain-specific utilities
   ✓ Wrap dangerous operations
   ✓ Simplify common tasks
   ✓ Better UX for users

4. Data Handling:
   ✓ Clone data before passing
   ✓ Use JSON.parse(JSON.stringify())
   ✓ Prevent modifications to original
   ✓ Consider Object.freeze() for read-only

5. Best Practices:
   ✓ Provide only what's necessary
   ✓ Explicitly block dangerous APIs
   ✓ Clone sensitive data
   ✓ Use timeout for all executions
   ✓ Validate results
   ✓ Document available APIs

6. Common Patterns:
   - Calculator/expression evaluator
   - Template renderer
   - Rule engine
   - Configuration evaluator
   - Plugin system

7. Limitations:
   ⚠️  Sandbox is not complete security
   ⚠️  Can be escaped (advanced techniques)
   ⚠️  Combine with other security layers
   ⚠️  Use Worker Threads for true isolation
`);

console.log('='.repeat(70));

/**
 * PRACTICE EXERCISES
 * ==================
 *
 * 1. Create a sandbox that only allows string operations
 *    (toUpperCase, toLowerCase, trim, etc.)
 *
 * 2. Build a sandbox for data processing with custom
 *    filter, map, and reduce functions.
 *
 * 3. Implement a config evaluator that safely evaluates
 *    configuration expressions.
 *
 * 4. Create a sandbox builder with preset configurations
 *    (minimal, calculator, data-processor, full).
 */
