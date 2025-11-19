# Performance Tuning Guide

## Overview

This guide covers advanced techniques for optimizing query string processing performance in high-traffic applications.

## Table of Contents

1. [Performance Profiling](#performance-profiling)
2. [Caching Strategies](#caching-strategies)
3. [Lazy Evaluation](#lazy-evaluation)
4. [Batch Processing](#batch-processing)
5. [Memory Optimization](#memory-optimization)
6. [Benchmarking](#benchmarking)

## Performance Profiling

### Identifying Bottlenecks

```javascript
class QueryPerformanceProfiler {
  constructor() {
    this.metrics = [];
    this.enabled = process.env.NODE_ENV !== 'production';
  }

  profile(name, fn) {
    if (!this.enabled) {
      return fn();
    }

    const start = process.hrtime.bigint();
    const memBefore = process.memoryUsage();

    try {
      const result = fn();

      const end = process.hrtime.bigint();
      const memAfter = process.memoryUsage();

      this.metrics.push({
        name,
        duration: Number(end - start) / 1000000, // Convert to ms
        memory: {
          heapUsed: memAfter.heapUsed - memBefore.heapUsed,
          external: memAfter.external - memBefore.external
        },
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async profileAsync(name, fn) {
    if (!this.enabled) {
      return await fn();
    }

    const start = process.hrtime.bigint();
    const memBefore = process.memoryUsage();

    try {
      const result = await fn();

      const end = process.hrtime.bigint();
      const memAfter = process.memoryUsage();

      this.metrics.push({
        name,
        duration: Number(end - start) / 1000000,
        memory: {
          heapUsed: memAfter.heapUsed - memBefore.heapUsed,
          external: memAfter.external - memBefore.external
        },
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  getReport() {
    const grouped = this.groupByName(this.metrics);
    const report = {};

    for (const [name, metrics] of Object.entries(grouped)) {
      report[name] = this.calculateStats(metrics);
    }

    return report;
  }

  groupByName(metrics) {
    return metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric);
      return acc;
    }, {});
  }

  calculateStats(metrics) {
    const durations = metrics.map(m => m.duration);
    const sorted = durations.sort((a, b) => a - b);

    return {
      count: metrics.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
}

// Usage
const profiler = new QueryPerformanceProfiler();

const result = profiler.profile('parseQuery', () => {
  return querystring.parse(queryStr);
});

console.log(profiler.getReport());
```

### Real-Time Performance Monitoring

```javascript
class PerformanceMonitor {
  constructor(options = {}) {
    this.threshold = options.threshold || 100; // ms
    this.sampleRate = options.sampleRate || 0.1; // 10%
    this.slowQueries = [];
    this.maxSlowQueries = 100;
  }

  measure(queryStr, fn) {
    // Sample only percentage of requests
    if (Math.random() > this.sampleRate) {
      return fn();
    }

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    if (duration > this.threshold) {
      this.recordSlowQuery({
        queryStr,
        duration,
        timestamp: new Date(),
        stackTrace: new Error().stack
      });
    }

    return result;
  }

  recordSlowQuery(record) {
    this.slowQueries.push(record);

    if (this.slowQueries.length > this.maxSlowQueries) {
      this.slowQueries.shift();
    }

    // Alert if threshold exceeded
    if (record.duration > this.threshold * 5) {
      this.sendAlert(record);
    }
  }

  getSlowestQueries(n = 10) {
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, n);
  }

  getRecommendations() {
    const recommendations = [];

    // Analyze patterns in slow queries
    const patterns = this.analyzePatterns(this.slowQueries);

    if (patterns.longQueries > 0) {
      recommendations.push({
        issue: 'Long query strings detected',
        suggestion: 'Consider implementing pagination or using POST for complex filters',
        affected: patterns.longQueries
      });
    }

    if (patterns.complexParsing > 0) {
      recommendations.push({
        issue: 'Complex nested parameters detected',
        suggestion: 'Implement caching for frequently parsed queries',
        affected: patterns.complexParsing
      });
    }

    return recommendations;
  }

  analyzePatterns(queries) {
    return {
      longQueries: queries.filter(q => q.queryStr.length > 500).length,
      complexParsing: queries.filter(q => {
        const params = querystring.parse(q.queryStr);
        return Object.keys(params).length > 20;
      }).length
    };
  }

  sendAlert(record) {
    console.error('[PERFORMANCE ALERT] Slow query detected:', {
      duration: record.duration,
      query: record.queryStr.substring(0, 100),
      timestamp: record.timestamp
    });
  }
}
```

## Caching Strategies

### LRU Cache Implementation

```javascript
class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      this.hits++;
      return value;
    }

    this.misses++;
    return null;
  }

  set(key, value) {
    // Remove if exists (will re-add at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
      usage: this.cache.size / this.maxSize
    };
  }
}
```

### Multi-Tier Caching

```javascript
class MultiTierCache {
  constructor(options = {}) {
    // L1: In-memory (fast, small)
    this.l1 = new LRUCache(options.l1Size || 100);

    // L2: Larger in-memory cache
    this.l2 = new LRUCache(options.l2Size || 1000);

    // L3: Redis or external cache (would be implemented)
    this.l3 = options.l3 || null;
  }

  async get(key) {
    // Try L1 first
    let value = this.l1.get(key);
    if (value !== null) {
      return { value, tier: 'L1' };
    }

    // Try L2
    value = this.l2.get(key);
    if (value !== null) {
      // Promote to L1
      this.l1.set(key, value);
      return { value, tier: 'L2' };
    }

    // Try L3 (external)
    if (this.l3) {
      value = await this.l3.get(key);
      if (value !== null) {
        // Promote to L2 and L1
        this.l2.set(key, value);
        this.l1.set(key, value);
        return { value, tier: 'L3' };
      }
    }

    return { value: null, tier: null };
  }

  async set(key, value) {
    // Set in all tiers
    this.l1.set(key, value);
    this.l2.set(key, value);

    if (this.l3) {
      await this.l3.set(key, value);
    }
  }

  getStats() {
    return {
      l1: this.l1.getStats(),
      l2: this.l2.getStats(),
      l3: this.l3 ? this.l3.getStats() : null
    };
  }
}
```

### Cached Query Parser

```javascript
class CachedQueryParser {
  constructor(cacheSize = 1000) {
    this.cache = new LRUCache(cacheSize);
  }

  parse(queryStr) {
    // Check cache first
    const cached = this.cache.get(queryStr);
    if (cached !== null) {
      return { ...cached }; // Return copy to prevent mutation
    }

    // Parse and cache
    const parsed = querystring.parse(queryStr);
    this.cache.set(queryStr, parsed);

    return parsed;
  }

  // Warm cache with common queries
  warmCache(queries) {
    for (const queryStr of queries) {
      if (!this.cache.has(queryStr)) {
        const parsed = querystring.parse(queryStr);
        this.cache.set(queryStr, parsed);
      }
    }
  }

  // Invalidate cache based on pattern
  invalidate(pattern) {
    const regex = new RegExp(pattern);
    const keys = Array.from(this.cache.cache.keys());

    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.cache.delete(key);
      }
    }
  }

  getStats() {
    return this.cache.getStats();
  }
}
```

## Lazy Evaluation

### Lazy Query Parser

```javascript
class LazyQueryParser {
  constructor(queryStr) {
    this.queryStr = queryStr;
    this.parsed = null;
    this.accessed = new Set();
  }

  static create(queryStr) {
    const parser = new LazyQueryParser(queryStr);

    return new Proxy({}, {
      get(target, prop) {
        if (prop === 'getAccessed') {
          return () => Array.from(parser.accessed);
        }

        if (prop === 'isParsed') {
          return () => parser.parsed !== null;
        }

        // Lazy parse on first access
        if (!parser.parsed) {
          parser.parsed = querystring.parse(parser.queryStr);
        }

        parser.accessed.add(prop);
        return parser.parsed[prop];
      },

      has(target, prop) {
        if (!parser.parsed) {
          parser.parsed = querystring.parse(parser.queryStr);
        }
        return prop in parser.parsed;
      },

      ownKeys(target) {
        if (!parser.parsed) {
          parser.parsed = querystring.parse(parser.queryStr);
        }
        return Object.keys(parser.parsed);
      }
    });
  }
}

// Usage
const lazyQuery = LazyQueryParser.create('a=1&b=2&c=3');

console.log(lazyQuery.isParsed()); // false
console.log(lazyQuery.a); // Now parsed
console.log(lazyQuery.isParsed()); // true
console.log(lazyQuery.getAccessed()); // ['a']
```

### Lazy Field Computation

```javascript
class LazyQueryFields {
  constructor(queryStr) {
    this.queryStr = queryStr;
    this.computed = {};
  }

  get page() {
    if (!this.computed.page) {
      const params = querystring.parse(this.queryStr);
      this.computed.page = Math.max(1, parseInt(params.page) || 1);
    }
    return this.computed.page;
  }

  get limit() {
    if (!this.computed.limit) {
      const params = querystring.parse(this.queryStr);
      this.computed.limit = Math.min(100, parseInt(params.limit) || 20);
    }
    return this.computed.limit;
  }

  get offset() {
    if (!this.computed.offset) {
      this.computed.offset = (this.page - 1) * this.limit;
    }
    return this.computed.offset;
  }

  get filters() {
    if (!this.computed.filters) {
      const params = querystring.parse(this.queryStr);
      this.computed.filters = this.extractFilters(params);
    }
    return this.computed.filters;
  }

  extractFilters(params) {
    const filters = {};
    for (const [key, value] of Object.entries(params)) {
      if (key.startsWith('filter_')) {
        filters[key.substring(7)] = value;
      }
    }
    return filters;
  }
}
```

## Batch Processing

### Batch Query Processor

```javascript
class BatchQueryProcessor {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 100;
    this.concurrency = options.concurrency || 4;
  }

  async processBatch(queries, processor) {
    const results = [];
    const batches = this.createBatches(queries, this.batchSize);

    for (const batch of batches) {
      const batchResults = await this.processConcurrent(
        batch,
        processor,
        this.concurrency
      );
      results.push(...batchResults);
    }

    return results;
  }

  createBatches(items, size) {
    const batches = [];
    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size));
    }
    return batches;
  }

  async processConcurrent(items, processor, concurrency) {
    const results = [];
    const executing = [];

    for (const item of items) {
      const promise = processor(item).then(result => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });

      results.push(promise);
      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }

    return await Promise.all(results);
  }

  // Streaming for very large datasets
  async *processStream(queryStream, processor) {
    let batch = [];

    for await (const query of queryStream) {
      batch.push(query);

      if (batch.length >= this.batchSize) {
        const results = await this.processConcurrent(
          batch,
          processor,
          this.concurrency
        );

        for (const result of results) {
          yield result;
        }

        batch = [];
      }
    }

    // Process remaining
    if (batch.length > 0) {
      const results = await this.processConcurrent(
        batch,
        processor,
        this.concurrency
      );

      for (const result of results) {
        yield result;
      }
    }
  }
}
```

## Memory Optimization

### Memory-Efficient Parsing

```javascript
class MemoryEfficientParser {
  // Parse without creating intermediate objects
  parseMinimal(queryStr) {
    const result = Object.create(null); // No prototype

    let start = 0;
    for (let i = 0; i <= queryStr.length; i++) {
      if (queryStr[i] === '&' || i === queryStr.length) {
        const pair = queryStr.substring(start, i);
        const eqIdx = pair.indexOf('=');

        if (eqIdx === -1) {
          result[decodeURIComponent(pair)] = '';
        } else {
          const key = decodeURIComponent(pair.substring(0, eqIdx));
          const value = decodeURIComponent(pair.substring(eqIdx + 1));
          result[key] = value;
        }

        start = i + 1;
      }
    }

    return result;
  }

  // Parse with streaming for very large query strings
  *parseStreaming(queryStr) {
    let start = 0;

    for (let i = 0; i <= queryStr.length; i++) {
      if (queryStr[i] === '&' || i === queryStr.length) {
        const pair = queryStr.substring(start, i);
        const eqIdx = pair.indexOf('=');

        let key, value;
        if (eqIdx === -1) {
          key = decodeURIComponent(pair);
          value = '';
        } else {
          key = decodeURIComponent(pair.substring(0, eqIdx));
          value = decodeURIComponent(pair.substring(eqIdx + 1));
        }

        yield [key, value];
        start = i + 1;
      }
    }
  }

  // Only parse specific fields
  parseFields(queryStr, fields) {
    const result = {};
    const fieldsSet = new Set(fields);

    for (const [key, value] of this.parseStreaming(queryStr)) {
      if (fieldsSet.has(key)) {
        result[key] = value;
        fieldsSet.delete(key);

        // Early exit if all fields found
        if (fieldsSet.size === 0) break;
      }
    }

    return result;
  }
}

// Usage
const parser = new MemoryEfficientParser();

// Parse only needed fields
const { page, limit } = parser.parseFields(
  longQueryString,
  ['page', 'limit']
);
```

### Object Pool Pattern

```javascript
class QueryObjectPool {
  constructor(size = 100) {
    this.pool = [];
    this.maxSize = size;

    // Pre-allocate objects
    for (let i = 0; i < size; i++) {
      this.pool.push({});
    }
  }

  acquire() {
    return this.pool.pop() || {};
  }

  release(obj) {
    // Clear object
    for (const key in obj) {
      delete obj[key];
    }

    // Return to pool if not at capacity
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  parse(queryStr) {
    const obj = this.acquire();

    try {
      // Parse into reused object
      const params = querystring.parse(queryStr);
      Object.assign(obj, params);
      return obj;
    } catch (error) {
      this.release(obj);
      throw error;
    }
  }
}
```

## Benchmarking

### Comprehensive Benchmark Suite

```javascript
class QueryBenchmark {
  static run(iterations = 10000) {
    const results = {};
    const testQuery = 'a=1&b=2&c=3&d=4&e=5';

    // Benchmark standard parsing
    results.standard = this.measure('Standard parse', () => {
      querystring.parse(testQuery);
    }, iterations);

    // Benchmark cached parsing
    const cachedParser = new CachedQueryParser(100);
    results.cached = this.measure('Cached parse', () => {
      cachedParser.parse(testQuery);
    }, iterations);

    // Benchmark lazy parsing
    results.lazy = this.measure('Lazy parse', () => {
      const lazy = LazyQueryParser.create(testQuery);
      lazy.a; // Access one field
    }, iterations);

    // Benchmark memory-efficient parsing
    const memParser = new MemoryEfficientParser();
    results.memoryEfficient = this.measure('Memory-efficient parse', () => {
      memParser.parseMinimal(testQuery);
    }, iterations);

    return results;
  }

  static measure(name, fn, iterations) {
    // Warm up
    for (let i = 0; i < 1000; i++) {
      fn();
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const memBefore = process.memoryUsage();
    const start = process.hrtime.bigint();

    for (let i = 0; i < iterations; i++) {
      fn();
    }

    const end = process.hrtime.bigint();
    const memAfter = process.memoryUsage();

    const duration = Number(end - start) / 1000000; // ms

    return {
      name,
      iterations,
      totalMs: duration,
      perOp: duration / iterations,
      opsPerSec: (iterations / duration) * 1000,
      memory: {
        heapUsed: memAfter.heapUsed - memBefore.heapUsed,
        external: memAfter.external - memBefore.external
      }
    };
  }

  static compare(result1, result2) {
    const speedup = result1.perOp / result2.perOp;
    const memoryDiff = result1.memory.heapUsed - result2.memory.heapUsed;

    return {
      speedup: speedup.toFixed(2) + 'x',
      fasterMethod: speedup > 1 ? result2.name : result1.name,
      memoryDiff: (memoryDiff / 1024).toFixed(2) + ' KB',
      recommendation: speedup > 1.5
        ? `Use ${result2.name} for ${((speedup - 1) * 100).toFixed(0)}% performance gain`
        : 'Performance difference is negligible'
    };
  }
}

// Run benchmarks
const results = QueryBenchmark.run();
console.log('Benchmark Results:');
for (const [key, result] of Object.entries(results)) {
  console.log(`\n${result.name}:`);
  console.log(`  Operations/sec: ${result.opsPerSec.toFixed(0)}`);
  console.log(`  Time per op: ${result.perOp.toFixed(6)}ms`);
  console.log(`  Memory used: ${(result.memory.heapUsed / 1024).toFixed(2)} KB`);
}
```

## Performance Best Practices

1. **Cache aggressively** - Parse query strings are expensive
2. **Use lazy evaluation** - Only parse what you need
3. **Implement query complexity limits** - Prevent DoS
4. **Pool objects** - Reduce GC pressure
5. **Batch operations** - Process multiple queries together
6. **Monitor performance** - Track slow queries
7. **Optimize hot paths** - Profile and optimize frequently called code
8. **Use streaming** - For very large datasets
9. **Consider compression** - For long query strings
10. **Benchmark regularly** - Measure impact of changes

## Performance Checklist

- [ ] Implement caching for parsed queries
- [ ] Use lazy evaluation where possible
- [ ] Set maximum query string length
- [ ] Monitor parse times and memory usage
- [ ] Optimize database queries built from parameters
- [ ] Implement batch processing for multiple queries
- [ ] Use object pooling for high-frequency operations
- [ ] Profile regularly to find bottlenecks
- [ ] Benchmark different parsing strategies
- [ ] Consider CDN caching for cacheable query results

## Additional Resources

- [V8 Performance Tips](https://v8.dev/blog/cost-of-javascript-2019)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Memory Profiling in Node.js](https://nodejs.org/en/docs/guides/diagnostics/memory/)
