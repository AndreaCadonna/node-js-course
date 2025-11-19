/**
 * 06-error-handling.js
 * ====================
 * Handling errors in VM code execution
 *
 * Key Concepts:
 * - Catching compilation errors
 * - Catching runtime errors
 * - Error stack traces in VM
 * - displayErrors option
 *
 * Run: node 06-error-handling.js
 */

const vm = require('vm');

console.log('='.repeat(70));
console.log('ERROR HANDLING IN VM');
console.log('='.repeat(70));

// =============================================================================
// 1. COMPILATION ERRORS
// =============================================================================

console.log('\n1. Handling Compilation Errors:');
console.log('-'.repeat(70));

try {
  const badScript = new vm.Script('this is not valid javascript!!!');
} catch (err) {
  console.log('❌ Compilation Error:');
  console.log('   Message:', err.message);
  console.log('   Type:', err.constructor.name);
  console.log('✓ Syntax errors caught during compilation');
}

// More examples of compilation errors
const badCode = [
  'function test( {',  // Missing closing brace
  'const x = ;',       // Missing value
  'if (x {',           // Missing closing paren
];

badCode.forEach((code, i) => {
  try {
    new vm.Script(code);
  } catch (err) {
    console.log(`\nExample ${i + 1}: "${code}"`);
    console.log('❌ Error:', err.message.split('\n')[0]);
  }
});

// =============================================================================
// 2. RUNTIME ERRORS
// =============================================================================

console.log('\n\n2. Handling Runtime Errors:');
console.log('-'.repeat(70));

const script = new vm.Script('unknownVariable + 1');

try {
  const sandbox = {};
  vm.createContext(sandbox);
  script.runInContext(sandbox);
} catch (err) {
  console.log('❌ Runtime Error:');
  console.log('   Message:', err.message);
  console.log('   Type:', err.constructor.name);
  console.log('✓ Runtime errors caught during execution');
}

// =============================================================================
// 3. DIFFERENT ERROR TYPES
// =============================================================================

console.log('\n3. Different Types of Errors:');
console.log('-'.repeat(70));

const errorExamples = [
  { code: 'undefinedVar', desc: 'ReferenceError' },
  { code: '({}).nonExistentMethod()', desc: 'TypeError' },
  { code: 'throw new Error("Custom error")', desc: 'Error' },
  { code: 'JSON.parse("invalid")', desc: 'SyntaxError' },
];

errorExamples.forEach(({ code, desc }) => {
  try {
    vm.runInNewContext(code, { JSON });
  } catch (err) {
    console.log(`${desc}:`);
    console.log(`  Code: ${code}`);
    console.log(`  Error: ${err.message}`);
  }
});

// =============================================================================
// 4. DISPLAY ERRORS OPTION
// =============================================================================

console.log('\n4. displayErrors Option:');
console.log('-'.repeat(70));

const codeWithError = `
  function test() {
    nonExistentFunction();
  }
  test();
`;

console.log('With displayErrors: true');
try {
  vm.runInNewContext(codeWithError, {}, {
    filename: 'test.js',
    displayErrors: true,
  });
} catch (err) {
  console.log('Error message:', err.message);
  console.log('Stack includes filename:', err.stack.includes('test.js'));
}

// =============================================================================
// 5. STACK TRACES
// =============================================================================

console.log('\n5. Stack Traces in VM:');
console.log('-'.repeat(70));

const scriptWithStack = new vm.Script(`
  function outer() {
    inner();
  }

  function inner() {
    throw new Error('Something went wrong!');
  }

  outer();
`, {
  filename: 'my-script.js',
});

try {
  const sandbox = {};
  vm.createContext(sandbox);
  scriptWithStack.runInContext(sandbox);
} catch (err) {
  console.log('Error:', err.message);
  console.log('\nStack trace:');
  console.log(err.stack);
}

// =============================================================================
// 6. SAFE EXECUTION WRAPPER
// =============================================================================

console.log('\n6. Safe Execution Wrapper:');
console.log('-'.repeat(70));

function safeExecute(code, sandbox = {}, options = {}) {
  try {
    const context = { ...sandbox };
    vm.createContext(context);

    const result = vm.runInContext(code, context, {
      filename: options.filename || 'inline.js',
      displayErrors: true,
      ...options,
    });

    return {
      success: true,
      result,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      result: null,
      error: {
        message: err.message,
        type: err.constructor.name,
        stack: err.stack,
      },
    };
  }
}

// Test the wrapper
const tests = [
  '2 + 2',
  'Math.sqrt(16)',
  'unknownVariable',
  'JSON.parse("invalid")',
];

tests.forEach(code => {
  const result = safeExecute(code, { Math, JSON });
  if (result.success) {
    console.log(`✓ ${code} = ${result.result}`);
  } else {
    console.log(`❌ ${code} - ${result.error.type}: ${result.error.message}`);
  }
});

// =============================================================================
// 7. ERROR RECOVERY
// =============================================================================

console.log('\n7. Error Recovery and Fallbacks:');
console.log('-'.repeat(70));

class ResilientEvaluator {
  constructor() {
    this.context = {
      Math: Math,
      console: console,
    };
    vm.createContext(this.context);
  }

  evaluate(code, fallbackValue = null) {
    try {
      return vm.runInContext(code, this.context, {
        filename: 'eval.js',
        displayErrors: true,
      });
    } catch (err) {
      console.log(`⚠️  Error in code: "${code}"`);
      console.log(`   Using fallback value: ${fallbackValue}`);
      return fallbackValue;
    }
  }
}

const evaluator = new ResilientEvaluator();

console.log('Result 1:', evaluator.evaluate('Math.sqrt(16)', 0));
console.log('Result 2:', evaluator.evaluate('invalidCode', 0));
console.log('Result 3:', evaluator.evaluate('2 + 2', 0));

// =============================================================================
// 8. CUSTOM ERROR HANDLING
// =============================================================================

console.log('\n8. Custom Error Handling:');
console.log('-'.repeat(70));

class VMExecutor {
  execute(code, context = {}) {
    const sandbox = {
      ...context,
      __error__: null,
      __try__: function(fn) {
        try {
          return fn();
        } catch (err) {
          this.__error__ = err.message;
          return null;
        }
      },
    };

    vm.createContext(sandbox);

    try {
      const result = vm.runInContext(code, sandbox);
      return {
        success: !sandbox.__error__,
        result,
        error: sandbox.__error__,
      };
    } catch (err) {
      return {
        success: false,
        result: null,
        error: err.message,
      };
    }
  }
}

const executor = new VMExecutor();

// Code with internal error handling
const codeWithTry = `
  __try__(() => {
    return JSON.parse('{"valid": true}');
  });
`;

const codeWithTryFail = `
  __try__(() => {
    return JSON.parse('invalid json');
  });
`;

console.log('Valid JSON:', executor.execute(codeWithTry, { JSON }));
console.log('Invalid JSON:', executor.execute(codeWithTryFail, { JSON }));

// =============================================================================
// SUMMARY
// =============================================================================

console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

console.log(`
Key Takeaways:

1. Error Types:
   ✓ Compilation errors: Caught during new vm.Script()
   ✓ Runtime errors: Caught during script.run*()
   ✓ All standard JavaScript error types apply

2. Error Handling:
   ✓ Use try-catch for both compilation and execution
   ✓ Handle errors separately for better UX
   ✓ Provide meaningful error messages
   ✓ Consider fallback values

3. Options for Better Errors:
   ✓ filename: Shows in stack traces
   ✓ displayErrors: Better error display
   ✓ lineOffset/columnOffset: For source mapping

4. Best Practices:
   ✓ Always wrap VM execution in try-catch
   ✓ Log errors appropriately
   ✓ Provide user-friendly error messages
   ✓ Include filename in options
   ✓ Consider error recovery strategies

5. Production Patterns:
   ✓ Create safe execution wrappers
   ✓ Return structured error objects
   ✓ Implement retry logic where appropriate
   ✓ Log errors for debugging
   ✓ Provide fallback values
`);

console.log('='.repeat(70));
