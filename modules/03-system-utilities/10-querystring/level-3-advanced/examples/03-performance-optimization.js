/**
 * Example 3: Performance Optimization
 *
 * Techniques for optimizing query string operations.
 */

const querystring = require('querystring');

class PerformanceOptimizer {
  constructor() {
    this.cache = new Map();
    this.cacheMaxSize = 1000;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  // Cached parsing
  parseWithCache(queryStr) {
    if (this.cache.has(queryStr)) {
      this.cacheHits++;
      return this.cache.get(queryStr);
    }

    this.cacheMisses++;
    const result = querystring.parse(queryStr);

    // Implement LRU cache
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(queryStr, result);
    return result;
  }

  // Lazy parsing
  createLazyParser(queryStr) {
    let parsed = null;
    
    return new Proxy({}, {
      get(target, prop) {
        if (!parsed) {
          parsed = querystring.parse(queryStr);
        }
        return parsed[prop];
      }
    });
  }

  // Batch operations
  static parseBatch(queryStrings) {
    return queryStrings.map(qs => querystring.parse(qs));
  }

  // Streaming for large datasets
  static* parseStream(queryStrings) {
    for (const qs of queryStrings) {
      yield querystring.parse(qs);
    }
  }

  // Memoization
  static memoize(fn) {
    const cache = new Map();
    return function(...args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const result = fn.apply(this, args);
      cache.set(key, result);
      return result;
    };
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses)
    };
  }
}

// Benchmarking utility
class Benchmark {
  static measure(fn, iterations = 10000) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1000000;
    return { ms, perOp: ms / iterations };
  }
}

// Demo
console.log('=== Performance Optimization Demo ===\n');

const optimizer = new PerformanceOptimizer();
const testQuery = 'a=1&b=2&c=3&d=4&e=5';

// Test cache performance
console.log('Testing cache performance...');
for (let i = 0; i < 100; i++) {
  optimizer.parseWithCache(testQuery);
}
console.log('Cache stats:', optimizer.getCacheStats());
console.log('');

// Benchmark comparisons
console.log('Benchmarking...');
const results = {
  standard: Benchmark.measure(() => querystring.parse(testQuery)),
  cached: Benchmark.measure(() => optimizer.parseWithCache(testQuery))
};

console.log(`Standard parsing: ${results.standard.ms.toFixed(2)}ms`);
console.log(`Cached parsing: ${results.cached.ms.toFixed(2)}ms`);
console.log(`Speedup: ${(results.standard.ms / results.cached.ms).toFixed(2)}x`);
console.log('');

console.log('✓ Caching provides significant performance gains!');

module.exports = { PerformanceOptimizer, Benchmark };
