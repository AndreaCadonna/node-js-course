/**
 * Exercise 3: Context Pool
 *
 * Implement a context pool that reuses VM contexts for better performance
 * in high-throughput scenarios with proper cleanup and statistics.
 *
 * Difficulty: ⭐⭐ Medium
 * Estimated Time: 45-60 minutes
 *
 * Related Examples:
 * - 08-performance-patterns.js
 * - 03-resource-limits.js
 *
 * Related Guides:
 * - 03-resource-control.md
 * - 01-script-patterns.md
 */

const vm = require('vm');
const { performance } = require('perf_hooks');

/**
 * TASK: Implement a ContextPool class
 *
 * Requirements:
 * 1. Pre-create a pool of VM contexts
 * 2. Acquire/release contexts from the pool
 * 3. Properly clean contexts after use
 * 4. Grow pool dynamically if needed
 * 5. Track context usage statistics
 * 6. Support timeout for context execution
 * 7. Handle concurrent acquisitions
 * 8. Implement context health checks
 * 9. Support warm-up for contexts
 * 10. Provide performance metrics
 *
 * Example Usage:
 *
 * const pool = new ContextPool({ size: 10 });
 *
 * const result = pool.execute('x * 2', { x: 21 });
 * // => 42
 *
 * const stats = pool.getStats();
 * // => { hits: 1, misses: 0, available: 10, ... }
 */

class ContextPool {
  constructor(options = {}) {
    // TODO: Initialize the context pool
    // - Create pool array
    // - Track available contexts
    // - Track in-use contexts
    // - Initialize statistics
    // - Pre-create contexts based on size option
  }

  /**
   * Pre-create contexts for the pool
   */
  warmUp() {
    // TODO: Create initial contexts
    // Fill the pool to initial size
  }

  /**
   * Create a new context
   * @returns {object} VM context
   */
  createContext() {
    // TODO: Create and return a VM context
    // Should include safe built-ins
  }

  /**
   * Clean a context by removing properties
   * @param {object} context - Context to clean
   */
  cleanContext(context) {
    // TODO: Remove all properties from context
    // Keep it ready for reuse
  }

  /**
   * Acquire a context from the pool
   * @returns {object} VM context
   */
  acquire() {
    // TODO: Get a context from the pool
    // 1. Check if contexts available
    // 2. If yes, pop from available array (cache hit)
    // 3. If no, create new context (cache miss)
    // 4. Mark context as in-use
    // 5. Update statistics
    // 6. Return context
  }

  /**
   * Release a context back to the pool
   * @param {object} context - Context to release
   */
  release(context) {
    // TODO: Return context to pool
    // 1. Check if context is in-use
    // 2. Clean the context
    // 3. Remove from in-use set
    // 4. Add back to available array (if under max size)
  }

  /**
   * Execute code in a pooled context
   * @param {string} code - Code to execute
   * @param {object} data - Data for context
   * @param {object} options - Execution options
   * @returns {*} Execution result
   */
  execute(code, data = {}, options = {}) {
    // TODO: Execute using pooled context
    // 1. Acquire context
    // 2. Add data to context
    // 3. Execute code with timeout
    // 4. Release context
    // 5. Return result
    // 6. Handle errors
  }

  /**
   * Execute with a cached script
   * @param {vm.Script} script - Compiled script
   * @param {object} data - Data for context
   * @returns {*} Execution result
   */
  executeScript(script, data = {}) {
    // TODO: Execute pre-compiled script
    // Same as execute() but takes Script instead of code string
  }

  /**
   * Get pool statistics
   * @returns {object} Statistics
   */
  getStats() {
    // TODO: Return statistics
    // {
    //   size: total created contexts,
    //   available: contexts ready to use,
    //   inUse: contexts currently in use,
    //   hits: times context was reused,
    //   misses: times new context was created,
    //   hitRate: hits / (hits + misses),
    //   executions: total execute() calls
    // }
  }

  /**
   * Drain the pool (remove all contexts)
   */
  drain() {
    // TODO: Clear all contexts
    // Remove all contexts from available and in-use
  }

  /**
   * Resize the pool
   * @param {number} newSize - New pool size
   */
  resize(newSize) {
    // TODO: Adjust pool size
    // If larger: create more contexts
    // If smaller: remove excess contexts
  }
}

// ============================================================================
// TEST CASES
// ============================================================================

function runTests() {
  console.log('Testing ContextPool...\n');

  let passed = 0;
  let failed = 0;

  function test(name, condition) {
    if (condition) {
      console.log(`✓ ${name}`);
      passed++;
    } else {
      console.log(`✗ ${name}`);
      failed++;
    }
  }

  // Test 1: Create pool
  const pool = new ContextPool({ size: 5 });
  test('Create pool', pool !== null);

  // Test 2: Execute code
  try {
    const result = pool.execute('x * 2', { x: 21 });
    test('Execute code', result === 42);
  } catch (err) {
    test('Execute code', false);
    console.log('  Error:', err.message);
  }

  // Test 3: Context reuse
  pool.execute('1 + 1', {});
  pool.execute('2 + 2', {});
  const stats1 = pool.getStats();
  test('Context reuse', stats1.hits > 0);

  // Test 4: Statistics tracking
  test('Statistics tracking', stats1.executions >= 2);

  // Test 5: Multiple executions
  for (let i = 0; i < 10; i++) {
    pool.execute('x + 1', { x: i });
  }
  const stats2 = pool.getStats();
  test('Multiple executions', stats2.executions === stats1.executions + 10);

  // Test 6: Context isolation
  pool.execute('secret = "hidden"', {});
  const result = pool.execute('typeof secret', {});
  test('Context isolation', result === 'undefined');

  // Test 7: Hit rate calculation
  const stats3 = pool.getStats();
  test('Hit rate calculation', typeof stats3.hitRate === 'number' && stats3.hitRate >= 0);

  // Test 8: Execute with script
  const script = new vm.Script('x * x');
  const result2 = pool.executeScript(script, { x: 5 });
  test('Execute with script', result2 === 25);

  // Test 9: Pool size limit
  const initialSize = pool.getStats().size;
  for (let i = 0; i < 20; i++) {
    pool.execute('1', {});
  }
  const finalSize = pool.getStats().size;
  test('Pool size management', finalSize >= initialSize);

  // Test 10: Performance benefit
  const noPoolTime = benchmarkNoPool(100);
  const poolTime = benchmarkWithPool(pool, 100);
  test('Performance benefit', poolTime < noPoolTime * 1.5); // Should be faster or comparable

  // Test 11: Error handling
  try {
    pool.execute('throw new Error("test")', {});
    test('Error handling', false);
  } catch (err) {
    test('Error handling', true);
  }

  // Test 12: Drain pool
  pool.drain();
  const stats4 = pool.getStats();
  test('Drain pool', stats4.available === 0);

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Great work!');
    console.log('\nNext steps:');
    console.log('1. Review the solution for optimization techniques');
    console.log('2. Try benchmarking different pool sizes');
    console.log('3. Move on to Exercise 4');
  } else {
    console.log('\n💡 Some tests failed. Keep going!');
    console.log('Tips:');
    console.log('- Make sure contexts are properly cleaned after use');
    console.log('- Track all statistics correctly');
    console.log('- Handle edge cases (empty pool, errors, etc.)');
  }
}

// Helper benchmarks
function benchmarkNoPool(iterations) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const ctx = vm.createContext({ x: i });
    vm.runInContext('x * 2', ctx);
  }
  return performance.now() - start;
}

function benchmarkWithPool(pool, iterations) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    pool.execute('x * 2', { x: i });
  }
  return performance.now() - start;
}

// Uncomment to run tests
// runTests();

module.exports = { ContextPool };

/**
 * INSTRUCTIONS:
 *
 * 1. Implement all methods in the ContextPool class
 * 2. Uncomment runTests() at the bottom
 * 3. Run: node exercise-3.js
 * 4. Keep working until all tests pass
 * 5. Compare with solution file when done
 *
 * HINTS:
 * - Use array for available contexts, Set for in-use contexts
 * - Clean context by deleting all own properties: for (const key in ctx) delete ctx[key]
 * - Statistics should be incremented at the right places
 * - Consider max pool size to prevent unbounded growth
 * - See examples/08-performance-patterns.js for reference
 *
 * BONUS CHALLENGES:
 * - Add context health checks (verify context is still usable)
 * - Implement context lifetime limits (recreate after N uses)
 * - Add async execute() with Promise support
 * - Implement priority acquisition (VIP contexts)
 * - Add warmup with specific built-ins per context
 * - Track per-context statistics (uses, errors, avg execution time)
 */
