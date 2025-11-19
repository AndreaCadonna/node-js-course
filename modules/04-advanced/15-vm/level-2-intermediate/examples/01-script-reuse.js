/**
 * Example 1: Advanced Script Class Reuse Patterns
 *
 * This example demonstrates advanced patterns for reusing Script objects
 * including compilation caching, LRU cache implementation, and performance
 * optimization techniques.
 *
 * Topics covered:
 * - Script compilation and caching
 * - LRU (Least Recently Used) cache
 * - Performance benchmarking
 * - Memory-efficient script management
 * - Cache eviction strategies
 */

const vm = require('vm');
const { performance } = require('perf_hooks');

// ============================================================================
// 1. Basic Script Caching
// ============================================================================

console.log('=== 1. Basic Script Caching ===\n');

/**
 * Simple script cache using Map
 */
class SimpleScriptCache {
  constructor() {
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  compile(code) {
    if (this.cache.has(code)) {
      this.hits++;
      return this.cache.get(code);
    }

    this.misses++;
    const script = new vm.Script(code);
    this.cache.set(code, script);
    return script;
  }

  execute(code, context) {
    const script = this.compile(code);
    return script.runInContext(context);
  }

  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

// Demo simple caching
const simpleCache = new SimpleScriptCache();
const context = vm.createContext({ x: 0, console });

// First execution - cache miss
simpleCache.execute('console.log("x =", x); x * 2', context);

// Subsequent executions - cache hits
context.x = 5;
simpleCache.execute('console.log("x =", x); x * 2', context);

context.x = 10;
simpleCache.execute('console.log("x =", x); x * 2', context);

console.log('Cache stats:', simpleCache.getStats());
console.log();

// ============================================================================
// 2. LRU Script Cache
// ============================================================================

console.log('=== 2. LRU Script Cache ===\n');

/**
 * LRU (Least Recently Used) cache implementation
 * Evicts oldest items when size limit is reached
 */
class LRUScriptCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  compile(code) {
    // Check if script exists
    if (this.cache.has(code)) {
      this.hits++;
      // Move to end (most recently used)
      const script = this.cache.get(code);
      this.cache.delete(code);
      this.cache.set(code, script);
      return script;
    }

    this.misses++;

    // Compile new script
    const script = new vm.Script(code);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.evictions++;
    }

    this.cache.set(code, script);
    return script;
  }

  execute(code, context) {
    const script = this.compile(code);
    return script.runInContext(context);
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }
}

// Demo LRU cache with small size
const lruCache = new LRUScriptCache(3);
const ctx = vm.createContext({ result: 0, console });

// Fill cache
console.log('Filling cache with 3 scripts...');
lruCache.execute('result = 1', ctx);
lruCache.execute('result = 2', ctx);
lruCache.execute('result = 3', ctx);
console.log('Cache stats:', lruCache.getStats());

// Access first script (should be cache hit)
console.log('\nAccessing first script again...');
lruCache.execute('result = 1', ctx);
console.log('Cache stats:', lruCache.getStats());

// Add new script (should evict least recently used)
console.log('\nAdding 4th script (should evict "result = 2")...');
lruCache.execute('result = 4', ctx);
console.log('Cache stats:', lruCache.getStats());

// Access evicted script (should be cache miss)
console.log('\nAccessing evicted script...');
lruCache.execute('result = 2', ctx);
console.log('Cache stats:', lruCache.getStats());
console.log();

// ============================================================================
// 3. Weighted Script Cache
// ============================================================================

console.log('=== 3. Weighted Script Cache ===\n');

/**
 * Cache that tracks execution frequency and compilation time
 * Useful for deciding what to keep in cache
 */
class WeightedScriptCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.metadata = new Map();
    this.maxSize = maxSize;
  }

  compile(code) {
    const now = performance.now();

    if (this.cache.has(code)) {
      // Update metadata for hit
      const meta = this.metadata.get(code);
      meta.hits++;
      meta.lastAccess = now;
      return this.cache.get(code);
    }

    // Compile and time it
    const compileStart = performance.now();
    const script = new vm.Script(code);
    const compileTime = performance.now() - compileStart;

    // Evict if necessary
    if (this.cache.size >= this.maxSize) {
      this.evictLowestPriority();
    }

    // Store script and metadata
    this.cache.set(code, script);
    this.metadata.set(code, {
      hits: 0,
      compileTime,
      created: now,
      lastAccess: now,
      codeLength: code.length
    });

    return script;
  }

  evictLowestPriority() {
    let lowestPriority = Infinity;
    let keyToEvict = null;

    // Calculate priority: (hits * compileTime) / age
    // Higher values = higher priority to keep
    for (const [key, meta] of this.metadata.entries()) {
      const age = Date.now() - meta.created;
      const priority = (meta.hits * meta.compileTime) / (age + 1);

      if (priority < lowestPriority) {
        lowestPriority = priority;
        keyToEvict = key;
      }
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      this.metadata.delete(keyToEvict);
    }
  }

  execute(code, context) {
    const script = this.compile(code);
    return script.runInContext(context);
  }

  getStats() {
    const stats = Array.from(this.metadata.entries()).map(([code, meta]) => ({
      codePreview: code.substring(0, 30) + '...',
      hits: meta.hits,
      compileTime: meta.compileTime.toFixed(2) + 'ms',
      age: ((Date.now() - meta.created) / 1000).toFixed(1) + 's'
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      scripts: stats
    };
  }
}

// Demo weighted cache
const weightedCache = new WeightedScriptCache(3);
const wctx = vm.createContext({ console });

// Add some scripts with different access patterns
console.log('Adding scripts with different patterns...\n');

// Frequently accessed, quick to compile
for (let i = 0; i < 5; i++) {
  weightedCache.execute('1 + 1', wctx);
}

// Rarely accessed, quick to compile
weightedCache.execute('2 + 2', wctx);

// Complex script (slow to compile), accessed a few times
const complexCode = 'const result = ' + Array(100).fill('1 + ').join('') + '1';
for (let i = 0; i < 3; i++) {
  weightedCache.execute(complexCode, wctx);
}

console.log('Weighted cache stats:');
console.log(JSON.stringify(weightedCache.getStats(), null, 2));
console.log();

// ============================================================================
// 4. Performance Comparison
// ============================================================================

console.log('=== 4. Performance Comparison ===\n');

/**
 * Benchmark script caching vs no caching
 */
function benchmark(name, fn, iterations = 1000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const duration = performance.now() - start;
  console.log(`${name}: ${duration.toFixed(2)}ms (${iterations} iterations)`);
  return duration;
}

const testCode = 'result = x * 2 + Math.sqrt(x)';
const testContext = vm.createContext({ x: 10, result: 0, Math });

// Without caching - compile every time
console.log('Without caching:');
benchmark('Compile + Execute', () => {
  const script = new vm.Script(testCode);
  script.runInContext(testContext);
}, 1000);

// With caching - compile once
console.log('\nWith caching:');
const cachedScript = new vm.Script(testCode);
benchmark('Execute only', () => {
  cachedScript.runInContext(testContext);
}, 1000);

// With LRU cache
console.log('\nWith LRU cache:');
const perfLRU = new LRUScriptCache(10);
benchmark('LRU Execute', () => {
  perfLRU.execute(testCode, testContext);
}, 1000);
console.log('Final stats:', perfLRU.getStats());
console.log();

// ============================================================================
// 5. Practical Script Manager
// ============================================================================

console.log('=== 5. Practical Script Manager ===\n');

/**
 * Production-ready script manager with multiple features
 */
class ScriptManager {
  constructor(options = {}) {
    this.maxCacheSize = options.maxCacheSize || 100;
    this.enableStats = options.enableStats !== false;
    this.cache = new Map();
    this.stats = {
      compiles: 0,
      executions: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };
  }

  /**
   * Compile and cache a script
   */
  compile(code, options = {}) {
    const cacheKey = this.getCacheKey(code, options);

    if (this.cache.has(cacheKey)) {
      if (this.enableStats) this.stats.cacheHits++;
      return this.cache.get(cacheKey);
    }

    try {
      if (this.enableStats) {
        this.stats.cacheMisses++;
        this.stats.compiles++;
      }

      const script = new vm.Script(code, options);

      // Manage cache size
      if (this.cache.size >= this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      this.cache.set(cacheKey, script);
      return script;
    } catch (err) {
      if (this.enableStats) this.stats.errors++;
      throw new Error(`Script compilation failed: ${err.message}`);
    }
  }

  /**
   * Execute code in a context
   */
  execute(code, context, options = {}) {
    try {
      if (this.enableStats) this.stats.executions++;

      const script = this.compile(code, options);
      return script.runInContext(context, options);
    } catch (err) {
      if (this.enableStats) this.stats.errors++;
      throw err;
    }
  }

  /**
   * Execute with automatic context creation
   */
  run(code, sandbox = {}, options = {}) {
    const context = vm.createContext(sandbox);
    return this.execute(code, context, options);
  }

  /**
   * Get cache key for script
   */
  getCacheKey(code, options) {
    const optionsKey = options.filename || '';
    return `${code}:${optionsKey}`;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      hitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      compiles: 0,
      executions: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0
    };
  }
}

// Demo script manager
const manager = new ScriptManager({ maxCacheSize: 5 });

console.log('Executing various scripts...\n');

// Execute same script multiple times
for (let i = 0; i < 3; i++) {
  manager.run('result = x * 2', { x: i, result: 0, console });
}

// Execute different scripts
manager.run('console.log("Hello, VM!")', { console });
manager.run('const y = 10; y + 5', {});

// Execute with error
try {
  manager.run('throw new Error("Test error")', {});
} catch (err) {
  console.log('Caught expected error:', err.message);
}

console.log('\nScript Manager Stats:');
console.log(JSON.stringify(manager.getStats(), null, 2));
console.log();

// ============================================================================
// Key Takeaways
// ============================================================================

console.log('=== Key Takeaways ===\n');
console.log('1. Script compilation is expensive - cache compiled scripts');
console.log('2. LRU caching prevents unbounded memory growth');
console.log('3. Weighted caching prioritizes frequently-used scripts');
console.log('4. Caching provides significant performance benefits');
console.log('5. Production code needs stats, error handling, and cache limits');
console.log('6. Choose caching strategy based on your use case');
console.log();

console.log('Run this example with: node 01-script-reuse.js');
