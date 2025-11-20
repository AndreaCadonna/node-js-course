/**
 * Exercise 4: Expression Compiler
 *
 * Build an expression compiler that can compile and cache expressions
 * for fast repeated evaluation with support for various data types and operators.
 *
 * Difficulty: ⭐⭐ Medium
 * Estimated Time: 45-60 minutes
 *
 * Related Examples:
 * - 01-script-reuse.js
 * - 05-template-engine.js
 *
 * Related Guides:
 * - 01-script-patterns.md
 * - 04-template-engines.md
 */

const vm = require('vm');

/**
 * TASK: Implement an ExpressionCompiler class
 *
 * Requirements:
 * 1. Compile JavaScript expressions to vm.Script
 * 2. Cache compiled expressions (LRU with configurable size)
 * 3. Support mathematical operations (+, -, *, /, %, **)
 * 4. Support comparison operators (==, !=, <, >, <=, >=, ===, !==)
 * 5. Support logical operators (&&, ||, !)
 * 6. Support property access (obj.prop, obj['prop'])
 * 7. Support method calls (Math.sqrt, String.toUpperCase)
 * 8. Support ternary operator (condition ? a : b)
 * 9. Provide built-in functions (Math, String, Number, etc.)
 * 10. Track compilation and evaluation statistics
 * 11. Set execution timeout
 * 12. Validate expressions before compilation
 *
 * Example Usage:
 *
 * const compiler = new ExpressionCompiler();
 *
 * const expr1 = compiler.compile('x * 2 + y');
 * console.log(compiler.evaluate(expr1, { x: 5, y: 3 })); // => 13
 *
 * const expr2 = compiler.compile('age >= 18 ? "adult" : "minor"');
 * console.log(compiler.evaluate(expr2, { age: 25 })); // => "adult"
 */

class ExpressionCompiler {
  constructor(options = {}) {
    // TODO: Initialize the expression compiler
    // - Set up LRU cache for compiled expressions
    // - Initialize statistics
    // - Store options (timeout, maxCacheSize, etc.)
  }

  /**
   * Validate an expression
   * @param {string} expression - Expression to validate
   * @returns {boolean} True if valid
   * @throws {Error} If invalid
   */
  validate(expression) {
    // TODO: Validate expression
    // - Check for dangerous patterns (require, process, etc.)
    // - Ensure it's a valid JavaScript expression
    // - Throw error if invalid
  }

  /**
   * Compile an expression to a Script
   * @param {string} expression - Expression to compile
   * @returns {vm.Script} Compiled script
   */
  compile(expression) {
    // TODO: Compile expression
    // 1. Validate expression
    // 2. Check cache
    // 3. If not cached:
    //    - Wrap expression: result = (expression)
    //    - Create vm.Script
    //    - Add to cache (with LRU eviction)
    // 4. Return script
  }

  /**
   * Evaluate a compiled expression
   * @param {vm.Script} script - Compiled script
   * @param {object} data - Data context
   * @param {object} options - Evaluation options
   * @returns {*} Evaluation result
   */
  evaluate(script, data = {}, options = {}) {
    // TODO: Evaluate expression
    // 1. Create context with data and built-ins
    // 2. Execute script with timeout
    // 3. Return result
    // 4. Update statistics
    // 5. Handle errors
  }

  /**
   * Compile and evaluate in one step
   * @param {string} expression - Expression to evaluate
   * @param {object} data - Data context
   * @returns {*} Evaluation result
   */
  exec(expression, data = {}) {
    // TODO: Compile and evaluate
    // Convenience method that calls compile() then evaluate()
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getCacheStats() {
    // TODO: Return cache statistics
    // { size, maxSize, hits, misses, hitRate, evictions }
  }

  /**
   * Get evaluation statistics
   * @returns {object} Evaluation statistics
   */
  getStats() {
    // TODO: Return evaluation statistics
    // { compilations, evaluations, errors, avgEvalTime }
  }

  /**
   * Clear the expression cache
   */
  clearCache() {
    // TODO: Clear cache and reset statistics
  }

  /**
   * Add a custom function to the execution context
   * @param {string} name - Function name
   * @param {function} fn - Function implementation
   */
  addFunction(name, fn) {
    // TODO: Add custom function available in expressions
    // Store in a functions object that's added to context
  }
}

// ============================================================================
// TEST CASES
// ============================================================================

function runTests() {
  console.log('Testing ExpressionCompiler...\n');

  const compiler = new ExpressionCompiler({ maxCacheSize: 10 });
  let passed = 0;
  let failed = 0;

  function test(name, expression, data, expected) {
    try {
      const result = compiler.exec(expression, data);
      if (result === expected) {
        console.log(`✓ ${name}`);
        passed++;
      } else {
        console.log(`✗ ${name}`);
        console.log(`  Expression: ${expression}`);
        console.log(`  Expected: ${expected}`);
        console.log(`  Got: ${result}`);
        failed++;
      }
    } catch (err) {
      console.log(`✗ ${name} - Error: ${err.message}`);
      failed++;
    }
  }

  // Test 1: Simple arithmetic
  test('Addition', 'x + y', { x: 5, y: 3 }, 8);
  test('Subtraction', 'x - y', { x: 10, y: 4 }, 6);
  test('Multiplication', 'x * y', { x: 6, y: 7 }, 42);
  test('Division', 'x / y', { x: 20, y: 4 }, 5);

  // Test 2: Complex arithmetic
  test('Complex math', 'x * 2 + y / 2', { x: 5, y: 10 }, 15);
  test('Parentheses', '(x + y) * z', { x: 2, y: 3, z: 4 }, 20);

  // Test 3: Comparisons
  test('Greater than', 'x > y', { x: 10, y: 5 }, true);
  test('Less than or equal', 'x <= y', { x: 5, y: 5 }, true);
  test('Equality', 'x === y', { x: 42, y: 42 }, true);

  // Test 4: Logical operators
  test('AND operator', 'x > 5 && y < 10', { x: 7, y: 8 }, true);
  test('OR operator', 'x > 10 || y > 10', { x: 5, y: 15 }, true);
  test('NOT operator', '!x', { x: false }, true);

  // Test 5: Ternary operator
  test('Ternary', 'age >= 18 ? "adult" : "minor"', { age: 25 }, 'adult');
  test('Ternary false', 'age >= 18 ? "adult" : "minor"', { age: 15 }, 'minor');

  // Test 6: Property access
  test('Property access', 'user.name', { user: { name: 'Alice' } }, 'Alice');
  test('Nested property', 'config.server.port', {
    config: { server: { port: 3000 } }
  }, 3000);

  // Test 7: Method calls
  test('Math.sqrt', 'Math.sqrt(x)', { x: 16, Math }, 4);
  test('String method', 'name.toUpperCase()', { name: 'hello' }, 'HELLO');

  // Test 8: Arrays
  test('Array access', 'arr[0]', { arr: [10, 20, 30] }, 10);
  test('Array length', 'arr.length', { arr: [1, 2, 3, 4] }, 4);

  // Test 9: Cache hit
  const script1 = compiler.compile('x * 2');
  const script2 = compiler.compile('x * 2'); // Should hit cache
  const stats1 = compiler.getCacheStats();
  console.log(stats1.hits > 0 ? '✓ Cache hit' : '✗ Cache hit');
  if (stats1.hits > 0) passed++; else failed++;

  // Test 10: LRU eviction
  // Fill cache beyond max size
  for (let i = 0; i < 15; i++) {
    compiler.compile(`x + ${i}`);
  }
  const stats2 = compiler.getCacheStats();
  console.log(stats2.evictions > 0 ? '✓ LRU eviction' : '✗ LRU eviction');
  if (stats2.evictions > 0) passed++; else failed++;

  // Test 11: Validation - block dangerous code
  try {
    compiler.compile('require("fs")');
    console.log('✗ Validation blocking');
    failed++;
  } catch (err) {
    console.log('✓ Validation blocking');
    passed++;
  }

  // Test 12: Custom function
  compiler.addFunction('double', (x) => x * 2);
  test('Custom function', 'double(x)', { x: 21 }, 42);

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Excellent!');
    console.log('\nNext steps:');
    console.log('1. Review the solution for optimization techniques');
    console.log('2. Try adding more built-in functions');
    console.log('3. Move on to Exercise 5');
  } else {
    console.log('\n💡 Some tests failed. Keep going!');
    console.log('Tips:');
    console.log('- Wrap expressions properly: result = (expression)');
    console.log('- Implement LRU cache correctly');
    console.log('- Add safe built-ins to context (Math, etc.)');
  }
}

// Uncomment to run tests
// runTests();

module.exports = { ExpressionCompiler };

/**
 * INSTRUCTIONS:
 *
 * 1. Implement all methods in the ExpressionCompiler class
 * 2. Uncomment runTests() at the bottom
 * 3. Run: node exercise-4.js
 * 4. Keep working until all tests pass
 * 5. Compare with solution file when done
 *
 * HINTS:
 * - Use Map for cache storage
 * - For LRU: when accessing, delete and re-add to move to end
 * - Validate by checking for blocked patterns: /require|process|import|eval/
 * - Wrap expression: const code = `result = (${expression})`
 * - Provide safe built-ins in context: Math, JSON, String, Number, Array
 * - See examples/01-script-reuse.js for caching patterns
 *
 * BONUS CHALLENGES:
 * - Add expression parsing/AST validation
 * - Support custom operators
 * - Add expression optimization (constant folding)
 * - Implement expression debugging mode
 * - Add type inference for expressions
 * - Support async expressions
 */
