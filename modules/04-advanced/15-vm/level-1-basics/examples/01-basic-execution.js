/**
 * 01-basic-execution.js
 * =====================
 * Introduction to running code with VM module
 *
 * Key Concepts:
 * - Normal JavaScript execution
 * - Using eval() and its limitations
 * - Using vm.runInThisContext()
 * - Understanding context vs scope
 *
 * Run: node 01-basic-execution.js
 */

const vm = require('vm');

console.log('='.repeat(70));
console.log('VM BASIC EXECUTION');
console.log('='.repeat(70));

// =============================================================================
// 1. NORMAL EXECUTION
// =============================================================================

console.log('\n1. Normal JavaScript Execution:');
console.log('-'.repeat(70));

// Regular variable declaration in local scope
let x = 10;
let y = 20;
let normalResult = x + y;

console.log('x =', x);
console.log('y =', y);
console.log('Result:', normalResult);
console.log('✓ Variables are in local scope');

// =============================================================================
// 2. USING EVAL (NOT RECOMMENDED)
// =============================================================================

console.log('\n2. Using eval() - Has Access to Local Scope:');
console.log('-'.repeat(70));

let a = 5;
let b = 15;

// eval() has access to local scope
let evalResult = eval('a + b');
console.log('a =', a);
console.log('b =', b);
console.log('eval("a + b") =', evalResult);

// eval() can also modify local scope
eval('c = 100');
console.log('After eval("c = 100"), c =', c);
console.log('⚠️  eval() can access and modify local scope (dangerous!)');

// =============================================================================
// 3. USING VM.RUNINTHISCONTEXT()
// =============================================================================

console.log('\n3. Using vm.runInThisContext() - No Scope Access:');
console.log('-'.repeat(70));

let m = 10;
let n = 20;

// vm.runInThisContext() does NOT have access to local scope
try {
  const vmResult = vm.runInThisContext('m + n');
  console.log('Result:', vmResult);
} catch (err) {
  console.log('❌ Error:', err.message);
  console.log('✓ vm.runInThisContext() cannot access local variables');
}

// But it can access global context (global object)
global.globalVar = 42;
const vmGlobalResult = vm.runInThisContext('globalVar * 2');
console.log('\nglobal.globalVar =', global.globalVar);
console.log('vm.runInThisContext("globalVar * 2") =', vmGlobalResult);
console.log('✓ vm.runInThisContext() can access global variables');

// =============================================================================
// 4. VM CONTEXT VS SCOPE
// =============================================================================

console.log('\n4. Understanding Context vs Scope:');
console.log('-'.repeat(70));

// Code string to execute
const codeString = '2 + 2';

// Method 1: Direct evaluation
const directResult = eval(codeString);
console.log('Direct eval:', directResult);

// Method 2: VM execution
const vmResult = vm.runInThisContext(codeString);
console.log('VM execution:', vmResult);

console.log('\nKey Difference:');
console.log('- eval() runs in current scope (can access local vars)');
console.log('- vm.runInThisContext() runs in current V8 context but not scope');
console.log('- VM is safer because it cannot access local variables');

// =============================================================================
// 5. PRACTICAL EXAMPLE - SAFE EXPRESSION EVALUATION
// =============================================================================

console.log('\n5. Practical Example - Safe Expression Evaluation:');
console.log('-'.repeat(70));

function safeEvaluate(expression) {
  try {
    // Only allow simple math expressions
    // runInThisContext provides some isolation from local scope
    const result = vm.runInThisContext(expression);
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Test with various expressions
const expressions = [
  '2 + 2',
  'Math.sqrt(16)',
  'Math.PI * 2',
  '100 / 5',
  'invalidVariable', // Will fail
];

expressions.forEach(expr => {
  const result = safeEvaluate(expr);
  if (result.success) {
    console.log(`✓ ${expr} = ${result.result}`);
  } else {
    console.log(`❌ ${expr} - Error: ${result.error}`);
  }
});

// =============================================================================
// 6. VARIABLE ISOLATION DEMONSTRATION
// =============================================================================

console.log('\n6. Variable Isolation:');
console.log('-'.repeat(70));

let secretPassword = 'super-secret-123';
console.log('Local variable: secretPassword =', secretPassword);

// Try to access with eval (BAD - this works!)
try {
  const leaked = eval('secretPassword');
  console.log('eval() can access: secretPassword =', leaked);
  console.log('⚠️  Security risk!');
} catch (err) {
  console.log('Protected!');
}

// Try to access with VM (GOOD - this fails!)
try {
  const safe = vm.runInThisContext('secretPassword');
  console.log('VM accessed:', safe);
} catch (err) {
  console.log('✓ VM cannot access: Error -', err.message);
  console.log('✓ Local variables are protected!');
}

// =============================================================================
// 7. GLOBAL NAMESPACE POLLUTION
// =============================================================================

console.log('\n7. Global Namespace Pollution:');
console.log('-'.repeat(70));

// Both eval and runInThisContext can pollute global namespace
eval('globalFromEval = "from eval"');
vm.runInThisContext('globalFromVM = "from VM"');

console.log('global.globalFromEval =', global.globalFromEval);
console.log('global.globalFromVM =', global.globalFromVM);
console.log('⚠️  Both can create global variables!');

// Clean up
delete global.globalVar;
delete global.globalFromEval;
delete global.globalFromVM;

// =============================================================================
// SUMMARY
// =============================================================================

console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

console.log(`
Key Takeaways:

1. eval():
   ✓ Has access to local scope
   ✓ Can read and modify local variables
   ✗ Security risk
   ✗ Should be avoided

2. vm.runInThisContext():
   ✓ Runs in current V8 context
   ✓ Cannot access local scope variables
   ✓ Safer than eval()
   ✓ Can access global object
   ✗ Can still pollute global namespace

3. Use Cases:
   - Use vm.runInThisContext() for safer code execution
   - Still not completely safe for untrusted code
   - Better than eval() for isolation
   - Need more isolation? Use runInNewContext() (next example!)

4. Context vs Scope:
   - Context: V8 execution environment (global object, built-ins)
   - Scope: Variable accessibility (local variables, closures)
   - vm.runInThisContext(): Same context, different scope
`);

console.log('='.repeat(70));

/**
 * PRACTICE EXERCISES
 * ==================
 *
 * 1. Create a function that takes a math expression and safely evaluates it
 *    using vm.runInThisContext(). Handle errors appropriately.
 *
 * 2. Demonstrate the difference between eval() and vm.runInThisContext()
 *    by trying to access a local variable with both methods.
 *
 * 3. Create a simple calculator that uses vm.runInThisContext() to evaluate
 *    expressions. Only allow Math operations.
 *
 * 4. Write code that shows how both eval() and vm.runInThisContext() can
 *    access the global object, but only eval() can access local scope.
 */
