/**
 * Example 4: Performance Optimization of Util Functions
 *
 * Demonstrates optimization techniques for util functions in high-performance
 * scenarios, including profiling, caching, and best practices.
 */

const util = require('util');
const fs = require('fs');

console.log('=== Performance Optimization ===\n');

// =============================================================================
// 1. Lazy Inspection
// =============================================================================
console.log('1. Lazy Inspection - Only Inspect When Needed\n');

// ❌ Bad: Always inspects
function badLogging(data) {
  const inspected = util.inspect(data, { depth: 10, colors: true });

  if (process.env.DEBUG) {
    console.log(inspected);
  }
}

// ✅ Good: Only inspects when needed
function goodLogging(data) {
  if (process.env.DEBUG) {
    console.log(util.inspect(data, { depth: 10, colors: true }));
  }
}

// Benchmark
const largeData = { users: Array(1000).fill({ id: 1, name: 'Test', data: {} }) };

console.time('Bad logging (always inspect)');
for (let i = 0; i < 1000; i++) {
  badLogging(largeData);
}
console.timeEnd('Bad logging (always inspect)');

console.time('Good logging (lazy inspect)');
for (let i = 0; i < 1000; i++) {
  goodLogging(largeData);
}
console.timeEnd('Good logging (lazy inspect)');

console.log('✅ Lazy inspection is much faster!\n');

// =============================================================================
// 2. Cached Inspection
// =============================================================================
console.log('2. Caching Expensive Inspections\n');

class InspectionCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  inspect(obj, options = {}) {
    // Create cache key from object and options
    const key = this.createKey(obj, options);

    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Perform expensive inspection
    const result = util.inspect(obj, options);

    // Manage cache size (LRU-like)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, result);
    return result;
  }

  createKey(obj, options) {
    // Simple key creation (production would use more sophisticated hashing)
    try {
      return JSON.stringify({ obj, options });
    } catch (err) {
      // Fallback for non-serializable objects
      return String(obj) + JSON.stringify(options);
    }
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

const cache = new InspectionCache(50);
const testObj = { id: 1, name: 'Test', data: { values: [1, 2, 3] } };

console.time('First inspection (uncached)');
for (let i = 0; i < 1000; i++) {
  util.inspect(testObj, { depth: 5, colors: true });
}
console.timeEnd('First inspection (uncached)');

console.time('Cached inspection');
for (let i = 0; i < 1000; i++) {
  cache.inspect(testObj, { depth: 5, colors: true });
}
console.timeEnd('Cached inspection');

console.log(`Cache size: ${cache.size}`);
console.log('✅ Caching provides significant speedup for repeated inspections!\n');

// =============================================================================
// 3. Optimizing Depth
// =============================================================================
console.log('3. Depth Optimization\n');

const deeplyNested = {
  level1: {
    level2: {
      level3: {
        level4: {
          level5: {
            level6: {
              level7: {
                level8: { data: 'deep' }
              }
            }
          }
        }
      }
    }
  }
};

console.time('Deep inspection (depth: null)');
for (let i = 0; i < 1000; i++) {
  util.inspect(deeplyNested, { depth: null });
}
console.timeEnd('Deep inspection (depth: null)');

console.time('Shallow inspection (depth: 2)');
for (let i = 0; i < 1000; i++) {
  util.inspect(deeplyNested, { depth: 2 });
}
console.timeEnd('Shallow inspection (depth: 2)');

console.log('✅ Limiting depth significantly improves performance!\n');

// =============================================================================
// 4. Optimizing Promisify
// =============================================================================
console.log('4. Promisify Optimization\n');

// Create promisified versions once, not in hot path
const readFilePromise = util.promisify(fs.readFile);
const statPromise = util.promisify(fs.stat);

// ❌ Bad: Creating promisified function in loop
async function badPromisifyUsage() {
  const promises = [];
  for (let i = 0; i < 100; i++) {
    const readFile = util.promisify(fs.readFile); // Created 100 times!
    promises.push(readFile(__filename, 'utf8'));
  }
  await Promise.all(promises);
}

// ✅ Good: Reuse promisified function
async function goodPromisifyUsage() {
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(readFilePromise(__filename, 'utf8')); // Reused!
  }
  await Promise.all(promises);
}

(async () => {
  console.time('Bad promisify usage');
  await badPromisifyUsage();
  console.timeEnd('Bad promisify usage');

  console.time('Good promisify usage');
  await goodPromisifyUsage();
  console.timeEnd('Good promisify usage');

  console.log('✅ Reusing promisified functions is much faster!\n');
})();

// =============================================================================
// 5. Format String Optimization
// =============================================================================
setTimeout(() => {
  console.log('5. Format String Optimization\n');

  const data = { id: 123, name: 'Test', value: 456 };

  // ❌ Bad: Complex format with inspection
  console.time('Complex format');
  for (let i = 0; i < 10000; i++) {
    util.format('Data: %O', util.inspect(data, { depth: 5 }));
  }
  console.timeEnd('Complex format');

  // ✅ Good: Simple format
  console.time('Simple format');
  for (let i = 0; i < 10000; i++) {
    util.format('Data: %O', data);
  }
  console.timeEnd('Simple format');

  // ✅ Better: Template literals for simple cases
  console.time('Template literal');
  for (let i = 0; i < 10000; i++) {
    `Data: ${data.id}, ${data.name}, ${data.value}`;
  }
  console.timeEnd('Template literal');

  console.log('✅ Template literals are fastest for simple formatting!\n');
}, 100);

// =============================================================================
// 6. Conditional Debugging Performance
// =============================================================================
setTimeout(() => {
  console.log('6. Conditional Debug Performance\n');

  const debugEnabled = false;

  // ❌ Bad: Function call overhead even when disabled
  function badDebug(message, data) {
    if (debugEnabled) {
      console.log(util.format(message, util.inspect(data)));
    }
  }

  // ✅ Good: Early return
  function goodDebug(message, data) {
    if (!debugEnabled) return;
    console.log(util.format(message, util.inspect(data)));
  }

  // ✅ Better: Wrapper that becomes no-op
  const debug = debugEnabled
    ? (message, data) => console.log(util.format(message, util.inspect(data)))
    : () => {};

  const testData = { test: 'data' };

  console.time('Bad debug (many function calls)');
  for (let i = 0; i < 100000; i++) {
    badDebug('Test message', testData);
  }
  console.timeEnd('Bad debug (many function calls)');

  console.time('Good debug (early return)');
  for (let i = 0; i < 100000; i++) {
    goodDebug('Test message', testData);
  }
  console.timeEnd('Good debug (early return)');

  console.time('Best debug (no-op function)');
  for (let i = 0; i < 100000; i++) {
    debug('Test message', testData);
  }
  console.timeEnd('Best debug (no-op function)');

  console.log('✅ No-op function is fastest for disabled debugging!\n');
}, 200);

// =============================================================================
// 7. Deep Equality Optimization
// =============================================================================
setTimeout(() => {
  console.log('7. Deep Equality Optimization\n');

  const obj1 = { a: 1, b: { c: 2, d: { e: 3 } } };
  const obj2 = { a: 1, b: { c: 2, d: { e: 3 } } };
  const obj3 = { a: 2, b: { c: 2, d: { e: 3 } } }; // Different at root

  // Early difference detection
  console.time('Deep equal (same objects)');
  for (let i = 0; i < 10000; i++) {
    util.isDeepStrictEqual(obj1, obj2);
  }
  console.timeEnd('Deep equal (same objects)');

  console.time('Deep equal (early difference)');
  for (let i = 0; i < 10000; i++) {
    util.isDeepStrictEqual(obj1, obj3);
  }
  console.timeEnd('Deep equal (early difference)');

  // ✅ Optimization: Quick reference check first
  function optimizedDeepEqual(a, b) {
    // Quick reference check
    if (a === b) return true;

    // Then deep equality
    return util.isDeepStrictEqual(a, b);
  }

  console.time('Optimized (with reference check)');
  for (let i = 0; i < 10000; i++) {
    optimizedDeepEqual(obj1, obj1); // Same reference
  }
  console.timeEnd('Optimized (with reference check)');

  console.log('✅ Reference check before deep equality is much faster!\n');
}, 300);

// =============================================================================
// 8. Memory-Efficient Inspection
// =============================================================================
setTimeout(() => {
  console.log('8. Memory-Efficient Inspection\n');

  // Large array
  const largeArray = Array(10000).fill(null).map((_, i) => ({
    id: i,
    name: `Item ${i}`,
    data: { value: i * 2 }
  }));

  // ❌ Bad: Inspect entire array
  console.time('Inspect full array');
  const fullInspection = util.inspect(largeArray, { depth: 3 });
  console.timeEnd('Inspect full array');
  console.log(`Full inspection length: ${fullInspection.length} characters`);

  // ✅ Good: Inspect with maxArrayLength
  console.time('Inspect with maxArrayLength');
  const limitedInspection = util.inspect(largeArray, {
    depth: 3,
    maxArrayLength: 10
  });
  console.timeEnd('Inspect with maxArrayLength');
  console.log(`Limited inspection length: ${limitedInspection.length} characters`);

  console.log(`✅ Limiting array length reduces output by ${
    ((1 - limitedInspection.length / fullInspection.length) * 100).toFixed(1)
  }%!\n`);
}, 400);

// =============================================================================
// 9. Production Performance Best Practices
// =============================================================================
setTimeout(() => {
  console.log('9. Production Performance Best Practices\n');

  class OptimizedLogger {
    constructor(options = {}) {
      this.enabled = options.enabled !== false;
      this.maxDepth = options.maxDepth || 3;
      this.maxArrayLength = options.maxArrayLength || 100;
      this.inspectCache = new Map();
      this.cacheMaxSize = options.cacheMaxSize || 50;

      // Pre-bind methods for better performance
      this.log = this.log.bind(this);
      this.error = this.error.bind(this);
    }

    log(message, data) {
      if (!this.enabled) return;

      if (data !== undefined) {
        const inspected = this.cachedInspect(data);
        console.log(`${message}: ${inspected}`);
      } else {
        console.log(message);
      }
    }

    error(message, err) {
      // Always log errors
      console.error(message, err.message);

      if (this.enabled) {
        console.error(this.cachedInspect(err));
      }
    }

    cachedInspect(obj) {
      const key = this.createCacheKey(obj);

      if (this.inspectCache.has(key)) {
        return this.inspectCache.get(key);
      }

      const result = util.inspect(obj, {
        depth: this.maxDepth,
        maxArrayLength: this.maxArrayLength,
        breakLength: Infinity, // Single line for logs
        compact: true
      });

      // Manage cache size
      if (this.inspectCache.size >= this.cacheMaxSize) {
        const firstKey = this.inspectCache.keys().next().value;
        this.inspectCache.delete(firstKey);
      }

      this.inspectCache.set(key, result);
      return result;
    }

    createCacheKey(obj) {
      try {
        return JSON.stringify(obj);
      } catch {
        return String(obj);
      }
    }
  }

  const logger = new OptimizedLogger({
    enabled: true,
    maxDepth: 3,
    maxArrayLength: 50,
    cacheMaxSize: 100
  });

  const testData = {
    operation: 'database-query',
    params: { id: 123, limit: 10 },
    results: Array(100).fill({ id: 1, data: 'test' })
  };

  console.time('Optimized logger (1000 calls)');
  for (let i = 0; i < 1000; i++) {
    logger.log('Operation completed', testData);
  }
  console.timeEnd('Optimized logger (1000 calls)');

  console.log('✅ Optimized logger combines all best practices!\n');
}, 500);

// =============================================================================
// 10. Benchmarking Utility
// =============================================================================
setTimeout(() => {
  console.log('10. Benchmarking Different Approaches\n');

  class Benchmark {
    static async run(name, fn, iterations = 1000) {
      // Warmup
      for (let i = 0; i < 10; i++) {
        await fn();
      }

      // Measure
      const start = process.hrtime.bigint();
      for (let i = 0; i < iterations; i++) {
        await fn();
      }
      const end = process.hrtime.bigint();

      const duration = Number(end - start) / 1_000_000; // ms
      const avg = duration / iterations;

      return {
        name,
        iterations,
        total: duration.toFixed(2),
        average: avg.toFixed(4),
        opsPerSec: (1000 / avg).toFixed(0)
      };
    }

    static async compare(tests) {
      const results = [];

      for (const [name, fn] of Object.entries(tests)) {
        const result = await this.run(name, fn);
        results.push(result);
      }

      console.log('Benchmark Results:');
      console.table(results);

      // Find fastest
      const fastest = results.reduce((min, r) =>
        parseFloat(r.average) < parseFloat(min.average) ? r : min
      );

      console.log(`\n✅ Fastest: ${fastest.name} (${fastest.opsPerSec} ops/sec)`);

      return results;
    }
  }

  // Compare different inspection approaches
  const testObj = { id: 1, data: { nested: { value: 'test' } } };

  Benchmark.compare({
    'util.inspect (depth: null)': () => util.inspect(testObj, { depth: null }),
    'util.inspect (depth: 2)': () => util.inspect(testObj, { depth: 2 }),
    'util.inspect (compact)': () => util.inspect(testObj, { compact: true }),
    'JSON.stringify': () => JSON.stringify(testObj),
    'toString': () => testObj.toString()
  }).then(() => {
    console.log('\n=== Key Takeaways ===');
    console.log('1. Only inspect when actually needed (lazy evaluation)');
    console.log('2. Cache repeated inspections');
    console.log('3. Limit depth and array length');
    console.log('4. Reuse promisified functions');
    console.log('5. Use template literals for simple formatting');
    console.log('6. Make debug functions no-ops when disabled');
    console.log('7. Check reference equality before deep equality');
    console.log('8. Use maxArrayLength for large arrays');
    console.log('9. Combine all optimizations for production');
    console.log('10. Benchmark to verify optimizations');
  });
}, 600);
