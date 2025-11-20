/**
 * 02-run-in-new-context.js
 * =========================
 * Using vm.runInNewContext() for isolated execution
 *
 * Key Concepts:
 * - Creating new isolated contexts
 * - Providing sandbox objects
 * - Complete isolation from main context
 * - One-time context creation and execution
 *
 * Run: node 02-run-in-new-context.js
 */

const vm = require('vm');

console.log('='.repeat(70));
console.log('VM.RUNINNEWCONTEXT() - ISOLATED EXECUTION');
console.log('='.repeat(70));

// =============================================================================
// 1. BASIC USAGE
// =============================================================================

console.log('\n1. Basic Usage of runInNewContext():');
console.log('-'.repeat(70));

// Execute code in a completely new context
const result1 = vm.runInNewContext('2 + 2');
console.log('vm.runInNewContext("2 + 2") =', result1);
console.log('✓ Code executed in new context');

// The code has no access to local variables
let localVar = 100;
try {
  const result2 = vm.runInNewContext('localVar + 10');
  console.log('Result:', result2);
} catch (err) {
  console.log('❌ Error:', err.message);
  console.log('✓ Cannot access local variables from main context');
}

// =============================================================================
// 2. PROVIDING A SANDBOX
// =============================================================================

console.log('\n2. Providing a Sandbox Object:');
console.log('-'.repeat(70));

// Create a sandbox with specific values
const sandbox1 = {
  x: 10,
  y: 20,
};

const result3 = vm.runInNewContext('x + y', sandbox1);
console.log('Sandbox:', sandbox1);
console.log('Code: "x + y"');
console.log('Result:', result3);
console.log('✓ Code can access variables from sandbox');

// The sandbox can be modified by the executed code
vm.runInNewContext('z = x * y', sandbox1);
console.log('\nAfter executing "z = x * y":');
console.log('Sandbox:', sandbox1);
console.log('✓ Code can modify the sandbox object');

// =============================================================================
// 3. ISOLATED CONTEXTS
// =============================================================================

console.log('\n3. Complete Isolation Between Contexts:');
console.log('-'.repeat(70));

const sandbox2 = { value: 10 };
const sandbox3 = { value: 20 };

vm.runInNewContext('result = value * 2', sandbox2);
vm.runInNewContext('result = value * 3', sandbox3);

console.log('Sandbox 2:', sandbox2);
console.log('Sandbox 3:', sandbox3);
console.log('✓ Each context is completely isolated');

// =============================================================================
// 4. PROVIDING BUILT-IN OBJECTS
// =============================================================================

console.log('\n4. Providing Built-in Objects:');
console.log('-'.repeat(70));

// By default, new contexts don't have console, setTimeout, etc.
try {
  vm.runInNewContext('console.log("Hello")');
} catch (err) {
  console.log('❌ Error:', err.message);
  console.log('✓ New contexts don\'t have console by default');
}

// We need to explicitly provide built-ins we want to allow
const sandboxWithConsole = {
  console: console,
  value: 42,
};

console.log('\nWith console provided:');
vm.runInNewContext('console.log("Hello from sandbox!")', sandboxWithConsole);
vm.runInNewContext('console.log("Value is:", value)', sandboxWithConsole);
console.log('✓ Can provide specific built-ins to sandbox');

// =============================================================================
// 5. SAFE ENVIRONMENT EXAMPLE
// =============================================================================

console.log('\n5. Creating a Safe Math Environment:');
console.log('-'.repeat(70));

const mathSandbox = {
  Math: Math,           // Provide Math object
  console: console,     // Provide console for output
  input: 16,           // Input value
};

const code = `
  const sqrt = Math.sqrt(input);
  const squared = Math.pow(input, 2);
  console.log('Square root of', input, '=', sqrt);
  console.log('Square of', input, '=', squared);
  sqrt + squared;
`;

const result4 = vm.runInNewContext(code, mathSandbox);
console.log('Final result:', result4);
console.log('✓ Safe environment with only Math operations');

// =============================================================================
// 6. MULTIPLE EXECUTIONS WITH DIFFERENT DATA
// =============================================================================

console.log('\n6. Processing Multiple Items:');
console.log('-'.repeat(70));

const items = [
  { name: 'Alice', score: 85 },
  { name: 'Bob', score: 92 },
  { name: 'Charlie', score: 78 },
];

const processCode = `
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';
  name + ': ' + grade;
`;

items.forEach(item => {
  const sandbox = {
    name: item.name,
    score: item.score,
  };
  const result = vm.runInNewContext(processCode, sandbox);
  console.log(result);
});

console.log('✓ Each execution gets its own isolated context');

// =============================================================================
// 7. PREVENTING ACCESS TO DANGEROUS GLOBALS
// =============================================================================

console.log('\n7. Security - Preventing Access to Dangerous APIs:');
console.log('-'.repeat(70));

// Try to access require() - should fail
try {
  vm.runInNewContext('require("fs")');
} catch (err) {
  console.log('❌ Trying to use require():', err.message);
  console.log('✓ Cannot access require() in new context');
}

// Try to access process - should fail
try {
  vm.runInNewContext('process.exit()');
} catch (err) {
  console.log('❌ Trying to access process:', err.message);
  console.log('✓ Cannot access process in new context');
}

console.log('\n✓ New contexts are isolated from Node.js globals');
console.log('⚠️  But this is NOT complete security (more in advanced levels)');

// =============================================================================
// 8. PRACTICAL EXAMPLE - USER EXPRESSION EVALUATOR
// =============================================================================

console.log('\n8. Practical Example - User Expression Evaluator:');
console.log('-'.repeat(70));

class ExpressionEvaluator {
  constructor() {
    this.allowedBuiltins = {
      Math: Math,
      Date: Date,
      JSON: JSON,
    };
  }

  evaluate(expression, variables = {}) {
    // Create sandbox with allowed built-ins and user variables
    const sandbox = {
      ...this.allowedBuiltins,
      ...variables,
    };

    try {
      const result = vm.runInNewContext(expression, sandbox);
      return { success: true, result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

const evaluator = new ExpressionEvaluator();

// Test expressions
const tests = [
  { expr: '2 + 2', vars: {} },
  { expr: 'Math.sqrt(x)', vars: { x: 16 } },
  { expr: 'x * y + z', vars: { x: 5, y: 3, z: 2 } },
  { expr: 'Math.max(a, b, c)', vars: { a: 10, b: 25, c: 15 } },
  { expr: 'name.toUpperCase()', vars: { name: 'Alice' } },
];

tests.forEach(({ expr, vars }) => {
  const result = evaluator.evaluate(expr, vars);
  if (result.success) {
    console.log(`✓ ${expr} = ${result.result}`);
    if (Object.keys(vars).length > 0) {
      console.log('  Variables:', vars);
    }
  } else {
    console.log(`❌ ${expr} - Error: ${result.error}`);
  }
});

// =============================================================================
// 9. SANDBOX STATE PERSISTENCE
// =============================================================================

console.log('\n9. Understanding Sandbox State:');
console.log('-'.repeat(70));

const persistentSandbox = { counter: 0 };

console.log('Initial sandbox:', persistentSandbox);

vm.runInNewContext('counter++', persistentSandbox);
console.log('After first execution:', persistentSandbox);

vm.runInNewContext('counter++', persistentSandbox);
console.log('After second execution:', persistentSandbox);

vm.runInNewContext('counter = counter * 2', persistentSandbox);
console.log('After third execution:', persistentSandbox);

console.log('✓ Sandbox object persists state between executions');
console.log('⚠️  But each runInNewContext() creates a new context!');

// =============================================================================
// SUMMARY
// =============================================================================

console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

console.log(`
Key Takeaways:

1. vm.runInNewContext():
   ✓ Creates a completely new context for each execution
   ✓ No access to local variables
   ✓ No access to Node.js globals (require, process, etc.)
   ✓ You control what's available via the sandbox object

2. Sandbox Object:
   ✓ Becomes the global object in the new context
   ✓ Can contain variables, functions, and objects
   ✓ Can be modified by executed code
   ✓ Persists between executions

3. Isolation:
   ✓ Each execution is completely isolated
   ✓ Cannot access main context variables
   ✓ Must explicitly provide built-ins (Math, console, etc.)
   ✓ Better isolation than runInThisContext()

4. Use Cases:
   - Evaluating user expressions with controlled environment
   - Processing data with custom logic
   - Creating safe playgrounds for code execution
   - Isolating plugin code

5. Limitations:
   ⚠️  Creates new context each time (performance cost)
   ⚠️  For repeated execution, better to reuse contexts
   ⚠️  Not 100% secure (advanced escape techniques exist)
   ⚠️  Next: Learn runInContext() for reusable contexts
`);

console.log('='.repeat(70));

/**
 * PRACTICE EXERCISES
 * ==================
 *
 * 1. Create a safe calculator that only allows Math operations
 *    and returns both the result and any error messages.
 *
 * 2. Build a function that processes an array of data objects
 *    using a user-provided expression, isolating each execution.
 *
 * 3. Create a template evaluator that replaces variables in a
 *    template string using runInNewContext().
 *
 * 4. Demonstrate the isolation by trying to access forbidden
 *    APIs (fs, process, require) and handling the errors.
 */
