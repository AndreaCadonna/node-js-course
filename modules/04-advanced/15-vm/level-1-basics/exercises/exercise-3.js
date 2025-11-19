/**
 * Exercise 3: Script Cache
 *
 * OBJECTIVE:
 * Implement a script cache that compiles scripts once and
 * reuses them for better performance.
 *
 * REQUIREMENTS:
 * 1. Cache compiled scripts
 * 2. Compile only on first use
 * 3. Track cache hits/misses
 * 4. Provide cache statistics
 *
 * LEARNING GOALS:
 * - Use vm.Script class
 * - Implement caching strategy
 * - Optimize performance
 */

const vm = require('vm');

/**
 * TODO 1: Implement ScriptCache class
 *
 * Methods needed:
 * - compile(code) - Compile and cache
 * - execute(code, context) - Execute cached script
 * - getStats() - Return cache statistics
 * - clear() - Clear cache
 */
class ScriptCache {
  constructor() {
    // Your code here
  }

  compile(code) {
    // Your code here
  }

  execute(code, context = {}) {
    // Your code here
  }

  getStats() {
    // Your code here
  }

  clear() {
    // Your code here
  }
}

// Test your implementation
const cache = new ScriptCache();

console.log('Testing Script Cache:\n');

// Execute same code multiple times
console.log('Result 1:', cache.execute('2 + 2'));
console.log('Result 2:', cache.execute('2 + 2')); // Cache hit
console.log('Result 3:', cache.execute('Math.sqrt(16)', { Math }));
console.log('Result 4:', cache.execute('2 + 2')); // Cache hit

console.log('\nCache Statistics:', cache.getStats());
