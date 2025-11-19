/**
 * Level 3 Exercise 3 Solution: Performance Optimization
 */

const querystring = require('querystring');

// Task 1: LRU Cache Implementation
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

// Task 2: Cached Query Parser
class CachedQueryParser {
  constructor(maxSize = 1000) {
    this.cache = new LRUCache(maxSize);
    this.parseCount = 0;
    this.cacheHitCount = 0;
  }

  parse(queryStr) {
    // Check cache
    const cached = this.cache.get(queryStr);
    if (cached !== null) {
      this.cacheHitCount++;
      return { ...cached }; // Return copy to prevent mutation
    }

    // Parse and cache
    this.parseCount++;
    const parsed = querystring.parse(queryStr);
    this.cache.set(queryStr, parsed);

    return parsed;
  }

  warmCache(queries) {
    let warmed = 0;

    for (const queryStr of queries) {
      if (!this.cache.has(queryStr)) {
        const parsed = querystring.parse(queryStr);
        this.cache.set(queryStr, parsed);
        warmed++;
      }
    }

    return warmed;
  }

  invalidate(pattern) {
    const regex = new RegExp(pattern);
    let invalidated = 0;

    for (const key of Array.from(this.cache.cache.keys())) {
      if (regex.test(key)) {
        this.cache.cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  getStats() {
    return {
      ...this.cache.getStats(),
      parseCount: this.parseCount,
      cacheHitCount: this.cacheHitCount,
      cacheHitRate: this.cacheHitCount / (this.parseCount + this.cacheHitCount) || 0
    };
  }
}

// Task 3: Lazy Query Parser
function createLazyQuery(queryStr) {
  let parsed = null;
  const accessed = new Set();

  return new Proxy({}, {
    get(target, prop) {
      if (prop === 'getUsedParams') {
        return () => Array.from(accessed);
      }

      if (prop === 'isParsed') {
        return () => parsed !== null;
      }

      if (prop === 'toString') {
        return () => queryStr;
      }

      // Lazy parse on first access
      if (!parsed) {
        parsed = querystring.parse(queryStr);
      }

      accessed.add(prop);
      return parsed[prop];
    },

    has(target, prop) {
      if (!parsed) {
        parsed = querystring.parse(queryStr);
      }
      return prop in parsed;
    },

    ownKeys(target) {
      if (!parsed) {
        parsed = querystring.parse(queryStr);
      }
      return Object.keys(parsed);
    },

    getOwnPropertyDescriptor(target, prop) {
      if (!parsed) {
        parsed = querystring.parse(queryStr);
      }
      return Object.getOwnPropertyDescriptor(parsed, prop);
    }
  });
}

// Task 4: Batch Query Processor
class BatchQueryProcessor {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 4;
    this.stats = {
      processed: 0,
      errors: 0,
      totalTime: 0
    };
  }

  processBatch(queries, callback) {
    const startTime = Date.now();
    const results = [];

    for (let i = 0; i < queries.length; i++) {
      try {
        const result = querystring.parse(queries[i]);
        results.push(result);
        this.stats.processed++;

        if (callback && i % 10 === 0) {
          callback(i + 1);
        }
      } catch (error) {
        results.push({ error: error.message });
        this.stats.errors++;
      }
    }

    this.stats.totalTime += Date.now() - startTime;

    return results;
  }

  async processBatchAsync(queries, callback) {
    const startTime = Date.now();
    const results = [];
    const batches = this.createBatches(queries, Math.ceil(queries.length / this.concurrency));

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(async q => {
          try {
            return querystring.parse(q);
          } catch (error) {
            this.stats.errors++;
            return { error: error.message };
          }
        })
      );

      results.push(...batchResults);
      this.stats.processed += batch.length;

      if (callback) {
        callback(this.stats.processed);
      }
    }

    this.stats.totalTime += Date.now() - startTime;

    return results;
  }

  *processStream(queryStrings) {
    for (const qs of queryStrings) {
      try {
        yield querystring.parse(qs);
        this.stats.processed++;
      } catch (error) {
        yield { error: error.message };
        this.stats.errors++;
      }
    }
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  getBenchmark() {
    return {
      processed: this.stats.processed,
      errors: this.stats.errors,
      totalTime: this.stats.totalTime,
      avgTime: this.stats.processed > 0 ? this.stats.totalTime / this.stats.processed : 0,
      throughput: this.stats.processed / (this.stats.totalTime / 1000) // queries per second
    };
  }
}

// Task 5: Performance Monitoring
class QueryPerformanceMonitor {
  constructor() {
    this.measurements = [];
    this.slowThreshold = 10; // ms
  }

  measure(queryStr, fn) {
    const start = process.hrtime.bigint();
    const result = fn();
    const end = process.hrtime.bigint();

    const duration = Number(end - start) / 1000000; // Convert to ms

    this.measurements.push({
      queryStr,
      duration,
      timestamp: Date.now(),
      slow: duration > this.slowThreshold
    });

    return result;
  }

  getReport() {
    if (this.measurements.length === 0) {
      return { message: 'No measurements recorded' };
    }

    const durations = this.measurements.map(m => m.duration);
    const sorted = [...durations].sort((a, b) => a - b);

    return {
      count: this.measurements.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      slowQueries: this.measurements.filter(m => m.slow).length
    };
  }

  getSlowestQueries(n = 10) {
    return this.measurements
      .sort((a, b) => b.duration - a.duration)
      .slice(0, n)
      .map(m => ({
        query: m.queryStr.substring(0, 100),
        duration: m.duration.toFixed(3) + 'ms'
      }));
  }

  getRecommendations() {
    const report = this.getReport();
    const recommendations = [];

    if (report.slowQueries > this.measurements.length * 0.1) {
      recommendations.push({
        issue: 'High number of slow queries',
        suggestion: 'Implement caching for frequently accessed queries',
        priority: 'high'
      });
    }

    if (report.avg > 5) {
      recommendations.push({
        issue: 'High average parse time',
        suggestion: 'Consider using lazy parsing or simplifying query structure',
        priority: 'medium'
      });
    }

    const longQueries = this.measurements.filter(m => m.queryStr.length > 500);
    if (longQueries.length > 0) {
      recommendations.push({
        issue: 'Long query strings detected',
        suggestion: 'Consider using POST requests or pagination',
        count: longQueries.length,
        priority: 'low'
      });
    }

    return recommendations;
  }
}

// Test implementations
console.log('=== Level 3 Exercise 3 Solutions ===\\n');

// Test Task 1: LRU Cache
console.log('Task 1: LRU Cache');
try {
  const cache = new LRUCache(3);

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  console.log('Cache size:', cache.cache.size);

  cache.get('a'); // Access 'a' (moves to end)
  cache.set('d', 4); // Should evict 'b'

  console.log('Has "a":', cache.has('a')); // true
  console.log('Has "b":', cache.has('b')); // false (evicted)
  console.log('Cache stats:', cache.getStats());
  console.log('✓ Task 1 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 2: Cached Parser
console.log('Task 2: Cached Query Parser');
try {
  const parser = new CachedQueryParser(100);
  const query = 'page=1&limit=20&sort=date';

  console.time('First parse');
  parser.parse(query);
  console.timeEnd('First parse');

  console.time('Cached parse');
  parser.parse(query);
  console.timeEnd('Cached parse');

  console.log('Parser stats:', parser.getStats());
  console.log('✓ Task 2 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 3: Lazy Parser
console.log('Task 3: Lazy Query Parser');
try {
  const lazyQuery = createLazyQuery('a=1&b=2&c=3&d=4&e=5');

  console.log('Created lazy query (not parsed yet)');
  console.log('Is parsed?', lazyQuery.isParsed());

  console.log('Accessing property "a":', lazyQuery.a);
  console.log('Is parsed?', lazyQuery.isParsed());
  console.log('Used params:', lazyQuery.getUsedParams());

  console.log('✓ Task 3 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 4: Batch Processor
console.log('Task 4: Batch Query Processor');
try {
  const processor = new BatchQueryProcessor();
  const queries = Array(100).fill('a=1&b=2&c=3');

  const results = processor.processBatch(queries, (progress) => {
    if (progress % 50 === 0) {
      console.log(`  Processed ${progress} queries`);
    }
  });

  console.log('Benchmark:', processor.getBenchmark());
  console.log('✓ Task 4 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 5: Performance Monitor
console.log('Task 5: Performance Monitor');
try {
  const monitor = new QueryPerformanceMonitor();

  // Measure some queries
  for (let i = 0; i < 100; i++) {
    monitor.measure(`query${i}`, () => querystring.parse('a=1&b=2&c=3'));
  }

  // Simulate a slow query
  monitor.measure('slow_query', () => {
    const result = querystring.parse('a=1&b=2');
    for (let i = 0; i < 100000; i++) {} // Busy wait
    return result;
  });

  const report = monitor.getReport();
  console.log('Performance report:');
  console.log(`  Count: ${report.count}`);
  console.log(`  Average: ${report.avg.toFixed(3)}ms`);
  console.log(`  Min: ${report.min.toFixed(3)}ms`);
  console.log(`  Max: ${report.max.toFixed(3)}ms`);
  console.log(`  Slow queries: ${report.slowQueries}`);

  const recommendations = monitor.getRecommendations();
  if (recommendations.length > 0) {
    console.log('\\nRecommendations:');
    recommendations.forEach(r => {
      console.log(`  - [${r.priority}] ${r.issue}: ${r.suggestion}`);
    });
  }

  console.log('\\n✓ Task 5 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

console.log('=== All Solutions Complete ===');

module.exports = {
  LRUCache,
  CachedQueryParser,
  createLazyQuery,
  BatchQueryProcessor,
  QueryPerformanceMonitor
};
