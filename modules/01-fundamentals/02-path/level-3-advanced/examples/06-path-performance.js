/**
 * Example 6: Path Performance Optimization
 *
 * Demonstrates performance optimization techniques for path operations
 * including caching, batch processing, and benchmarking.
 *
 * Key Points:
 * - Caching strategies for path operations
 * - Batch processing techniques
 * - Performance benchmarking
 * - Memory optimization
 * - Profiling path-heavy code
 */

const path = require('path');

console.log('=== Path Performance Optimization ===\n');

// 1. Benchmarking Utility
console.log('1. Performance Benchmarking:');

class Benchmark {
  static measure(name, fn, iterations = 10000) {
    const start = process.hrtime.bigint();

    for (let i = 0; i < iterations; i++) {
      fn();
    }

    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to ms

    return {
      name,
      iterations,
      totalTime: duration,
      avgTime: duration / iterations,
      opsPerSecond: Math.floor((iterations / duration) * 1000)
    };
  }

  static compare(operations, iterations = 10000) {
    const results = operations.map(op =>
      this.measure(op.name, op.fn, iterations)
    );

    return results.sort((a, b) => b.opsPerSecond - a.opsPerSecond);
  }
}

// Compare path.join vs string concatenation
const joinOps = [
  {
    name: 'path.join',
    fn: () => path.join('a', 'b', 'c', 'd')
  },
  {
    name: 'path.resolve',
    fn: () => path.resolve('a', 'b', 'c', 'd')
  },
  {
    name: 'string concat',
    fn: () => 'a' + path.sep + 'b' + path.sep + 'c' + path.sep + 'd'
  }
];

console.log('  Comparing path operations (10,000 iterations):');
const results = Benchmark.compare(joinOps);
results.forEach((result, i) => {
  console.log(`    ${i + 1}. ${result.name.padEnd(15)} - ${result.opsPerSecond.toLocaleString()} ops/sec`);
  console.log(`       Avg time: ${result.avgTime.toFixed(4)}ms`);
});
console.log();

// 2. Path Caching
console.log('2. Path Caching Strategy:');

class PathCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
  }

  resolve(...segments) {
    const key = segments.join('|');

    if (this.cache.has(key)) {
      this.hits++;
      return this.cache.get(key);
    }

    this.misses++;
    const result = path.resolve(...segments);

    if (this.cache.size >= this.maxSize) {
      // LRU: Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, result);
    return result;
  }

  join(...segments) {
    const key = 'join:' + segments.join('|');

    if (this.cache.has(key)) {
      this.hits++;
      return this.cache.get(key);
    }

    this.misses++;
    const result = path.join(...segments);

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, result);
    return result;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses || 1)
    };
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

const cache = new PathCache(100);

// Simulate repeated path operations
const testPaths = [
  ['src', 'lib', 'util.js'],
  ['src', 'app.js'],
  ['src', 'lib', 'util.js'], // Repeat
  ['test', 'spec.js'],
  ['src', 'app.js'], // Repeat
];

console.log('  Testing path cache:');
testPaths.forEach((segments, i) => {
  cache.resolve(...segments);
  console.log(`    ${i + 1}. resolve(${segments.join(', ')})`);
});

const stats = cache.getStats();
console.log(`\n  Cache statistics:`);
console.log(`    Hits: ${stats.hits}`);
console.log(`    Misses: ${stats.misses}`);
console.log(`    Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`    Cache size: ${stats.size}/${stats.maxSize}`);
console.log();

// 3. Batch Operations
console.log('3. Batch Path Operations:');

class PathBatch {
  static resolveBatch(baseDir, paths) {
    const base = path.resolve(baseDir);
    return paths.map(p => path.resolve(base, p));
  }

  static joinBatch(baseDir, paths) {
    return paths.map(p => path.join(baseDir, p));
  }

  static normalizeBatch(paths) {
    return paths.map(p => path.normalize(p));
  }

  static relativeBatch(from, toPaths) {
    const fromResolved = path.resolve(from);
    return toPaths.map(to => path.relative(fromResolved, path.resolve(to)));
  }
}

const inputPaths = [
  'file1.txt',
  'dir/file2.txt',
  'another/dir/file3.txt'
];

console.log('  Batch resolving paths:');
console.log(`    Base: /app/data`);
const resolved = PathBatch.resolveBatch('/app/data', inputPaths);
resolved.forEach((p, i) => {
  console.log(`    ${inputPaths[i]} → ${p}`);
});
console.log();

// 4. Memoization
console.log('4. Memoization Pattern:');

function memoize(fn) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// Expensive path operation
function complexPathOperation(filepath) {
  const parsed = path.parse(filepath);
  const normalized = path.normalize(filepath);
  const dirname = path.dirname(filepath);
  const basename = path.basename(filepath);

  return {
    original: filepath,
    parsed,
    normalized,
    dirname,
    basename
  };
}

const memoizedOperation = memoize(complexPathOperation);

console.log('  Testing memoized operation:');
const testFile = '/app/data/file.txt';

console.log('  First call:');
let start = Date.now();
memoizedOperation(testFile);
console.log(`    Time: ${Date.now() - start}ms`);

console.log('  Second call (cached):');
start = Date.now();
memoizedOperation(testFile);
console.log(`    Time: ${Date.now() - start}ms`);
console.log();

// 5. Lazy Evaluation
console.log('5. Lazy Path Evaluation:');

class LazyPath {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this._resolved = null;
    this._normalized = null;
  }

  get resolved() {
    if (!this._resolved) {
      this._resolved = path.resolve(this.baseDir);
    }
    return this._resolved;
  }

  get normalized() {
    if (!this._normalized) {
      this._normalized = path.normalize(this.baseDir);
    }
    return this._normalized;
  }

  join(...segments) {
    return new LazyPath(path.join(this.baseDir, ...segments));
  }
}

const lazy = new LazyPath('/app/./data/../data');
console.log('  LazyPath created (not evaluated yet)');
console.log(`  Accessing normalized: ${lazy.normalized}`);
console.log(`  Accessing resolved: ${lazy.resolved}`);
console.log();

// 6. Memory-Efficient Path Operations
console.log('6. Memory-Efficient Operations:');

class MemoryEfficientPathProcessor {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 100;
    this.cache = new PathCache(options.cacheSize || 100);
  }

  *processPaths(paths) {
    // Generator for memory-efficient iteration
    for (let i = 0; i < paths.length; i += this.batchSize) {
      const batch = paths.slice(i, i + this.batchSize);
      yield batch.map(p => this.cache.resolve(p));
    }
  }

  async processLargeSet(paths, processor) {
    const results = [];

    for (const batch of this.processPaths(paths)) {
      const processed = batch.map(processor);
      results.push(...processed);

      // Allow event loop to process other tasks
      await new Promise(resolve => setImmediate(resolve));
    }

    return results;
  }
}

const processor = new MemoryEfficientPathProcessor({ batchSize: 2 });
const largePaths = ['a.txt', 'b.txt', 'c.txt', 'd.txt', 'e.txt'];

console.log('  Processing paths in batches:');
let batchNum = 1;
for (const batch of processor.processPaths(largePaths)) {
  console.log(`    Batch ${batchNum++}: ${batch.length} paths`);
}
console.log();

// 7. Performance Monitoring
console.log('7. Path Operation Monitoring:');

class PathMonitor {
  constructor() {
    this.operations = new Map();
  }

  track(operation, fn) {
    return (...args) => {
      const start = process.hrtime.bigint();
      const result = fn(...args);
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // ms

      if (!this.operations.has(operation)) {
        this.operations.set(operation, {
          count: 0,
          totalTime: 0,
          minTime: Infinity,
          maxTime: 0
        });
      }

      const stats = this.operations.get(operation);
      stats.count++;
      stats.totalTime += duration;
      stats.minTime = Math.min(stats.minTime, duration);
      stats.maxTime = Math.max(stats.maxTime, duration);

      return result;
    };
  }

  getStats() {
    const stats = {};

    for (const [operation, data] of this.operations) {
      stats[operation] = {
        count: data.count,
        totalTime: data.totalTime.toFixed(2) + 'ms',
        avgTime: (data.totalTime / data.count).toFixed(4) + 'ms',
        minTime: data.minTime.toFixed(4) + 'ms',
        maxTime: data.maxTime.toFixed(4) + 'ms'
      };
    }

    return stats;
  }

  reset() {
    this.operations.clear();
  }
}

const monitor = new PathMonitor();

const monitoredJoin = monitor.track('join', path.join);
const monitoredResolve = monitor.track('resolve', path.resolve);

console.log('  Running monitored operations:');
for (let i = 0; i < 100; i++) {
  monitoredJoin('a', 'b', 'c');
  monitoredResolve('x', 'y', 'z');
}

const monitorStats = monitor.getStats();
console.log('\n  Performance statistics:');
Object.entries(monitorStats).forEach(([op, stats]) => {
  console.log(`    ${op}:`);
  console.log(`      Count: ${stats.count}`);
  console.log(`      Average: ${stats.avgTime}`);
  console.log(`      Min: ${stats.minTime}, Max: ${stats.maxTime}`);
});
console.log();

// 8. Optimization Recommendations
console.log('8. Performance Optimization Recommendations:');
console.log();
console.log('  Caching:');
console.log('    • Cache frequently accessed paths');
console.log('    • Use LRU eviction strategy');
console.log('    • Set appropriate cache size limits');
console.log('    • Monitor hit/miss rates');
console.log();
console.log('  Batch Operations:');
console.log('    • Process multiple paths together');
console.log('    • Use generators for large sets');
console.log('    • Yield control to event loop');
console.log();
console.log('  Lazy Evaluation:');
console.log('    • Defer expensive operations');
console.log('    • Compute only when needed');
console.log('    • Cache computed values');
console.log();
console.log('  Memoization:');
console.log('    • Cache pure function results');
console.log('    • Use for repeated operations');
console.log('    • Clear cache when memory is limited');
console.log();
console.log('  Monitoring:');
console.log('    • Track operation performance');
console.log('    • Identify bottlenecks');
console.log('    • Set performance budgets');
console.log();

console.log('✅ Path performance optimization complete!');
console.log();
console.log('Key Takeaways:');
console.log('  • Cache frequently used paths');
console.log('  • Process paths in batches');
console.log('  • Use lazy evaluation for expensive operations');
console.log('  • Memoize pure functions');
console.log('  • Monitor performance to identify bottlenecks');
console.log('  • Balance memory usage vs. performance gains');
