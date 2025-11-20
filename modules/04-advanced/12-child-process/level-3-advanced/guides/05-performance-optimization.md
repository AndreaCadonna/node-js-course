# Performance Optimization

Techniques for optimizing process pool performance, reducing overhead, and maximizing throughput.

## Table of Contents
- [Profiling and Measurement](#profiling-and-measurement)
- [Process Pooling](#process-pooling)
- [Caching Strategies](#caching-strategies)
- [Resource Optimization](#resource-optimization)
- [Bottleneck Identification](#bottleneck-identification)

---

## Profiling and Measurement

### Performance Measurement

```javascript
const { performance } = require('perf_hooks');

class PerformanceTracker {
  constructor() {
    this.marks = new Map();
    this.measures = [];
  }

  start(name) {
    this.marks.set(name, performance.now());
  }

  end(name) {
    const start = this.marks.get(name);
    if (!start) {
      throw new Error(`No start mark for: ${name}`);
    }

    const duration = performance.now() - start;
    this.measures.push({ name, duration, timestamp: Date.now() });
    this.marks.delete(name);

    return duration;
  }

  getStats(name) {
    const measures = this.measures.filter(m => m.name === name);
    if (measures.length === 0) return null;

    const durations = measures.map(m => m.duration);
    return {
      count: durations.length,
      total: durations.reduce((a, b) => a + b, 0),
      avg: durations.reduce((a, b) => a + b) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations)
    };
  }
}
```

### CPU Profiling

```javascript
// Start profiling
const inspector = require('inspector');
const fs = require('fs');

const session = new inspector.Session();
session.connect();

session.post('Profiler.enable', () => {
  session.post('Profiler.start', () => {
    // Run code to profile
    runWorkload();

    // Stop and save profile
    session.post('Profiler.stop', (err, { profile }) => {
      fs.writeFileSync('profile.cpuprofile', JSON.stringify(profile));
      session.disconnect();
    });
  });
});
```

---

## Process Pooling

### Optimal Pool Size

```javascript
const os = require('os');

class PoolSizeCalculator {
  static calculateOptimal(workloadType) {
    const cpus = os.cpus().length;

    switch (workloadType) {
      case 'cpu-intensive':
        // Use all CPUs
        return cpus;

      case 'io-intensive':
        // Can use more than CPU count
        return cpus * 2;

      case 'mixed':
        // Balance between CPU and I/O
        return Math.ceil(cpus * 1.5);

      default:
        return cpus;
    }
  }

  static adjust(currentSize, metrics) {
    const { queueSize, avgWaitTime, cpuUsage } = metrics;

    // Scale up if queue growing or high wait time
    if (queueSize > currentSize * 2 || avgWaitTime > 1000) {
      return Math.min(currentSize + 1, os.cpus().length * 2);
    }

    // Scale down if underutilized
    if (queueSize === 0 && cpuUsage < 30) {
      return Math.max(currentSize - 1, 1);
    }

    return currentSize;
  }
}
```

### Worker Warmup

```javascript
class WarmupPool {
  async createWorker() {
    const worker = fork(this.workerPath);

    // Warmup worker
    await this.warmupWorker(worker);

    return worker;
  }

  async warmupWorker(worker) {
    // Send warmup tasks
    await Promise.all([
      this.executeTask(worker, { type: 'warmup', data: 'init' }),
      this.loadResources(worker),
      this.primeCache(worker)
    ]);
  }

  async loadResources(worker) {
    // Preload commonly used resources
    return new Promise((resolve) => {
      worker.send({ type: 'load_resources' });
      worker.once('message', (msg) => {
        if (msg.type === 'resources_loaded') {
          resolve();
        }
      });
    });
  }
}
```

---

## Caching Strategies

### LRU Cache Implementation

```javascript
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  set(key, value) {
    // Delete if exists (will re-add at end)
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
  }

  get size() {
    return this.cache.size;
  }
}
```

### Task Result Caching

```javascript
class CachedProcessPool {
  constructor(poolSize) {
    this.pool = new ProcessPool(poolSize);
    this.cache = new LRUCache(1000);
    this.stats = {
      hits: 0,
      misses: 0
    };
  }

  async execute(task) {
    const key = this.cacheKey(task);

    // Check cache
    const cached = this.cache.get(key);
    if (cached && !this.isExpired(cached)) {
      this.stats.hits++;
      return cached.result;
    }

    // Execute task
    this.stats.misses++;
    const result = await this.pool.execute(task);

    // Cache result
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });

    return result;
  }

  cacheKey(task) {
    return JSON.stringify(task);
  }

  isExpired(entry) {
    const maxAge = 60000; // 1 minute
    return Date.now() - entry.timestamp > maxAge;
  }

  getCacheHitRate() {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}
```

---

## Resource Optimization

### Memory Management

```javascript
class MemoryOptimizedPool {
  constructor() {
    this.pool = [];
    this.memoryLimit = 512 * 1024 * 1024; // 512MB
  }

  monitorMemory() {
    setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsed = usage.heapUsed;

      if (heapUsed > this.memoryLimit) {
        this.reduceMemoryUsage();
      }
    }, 5000);
  }

  reduceMemoryUsage() {
    // Clear caches
    this.cache.clear();

    // Force GC if available
    if (global.gc) {
      global.gc();
    }

    // Reduce pool size if needed
    if (this.pool.length > 2) {
      const worker = this.pool.pop();
      worker.kill();
    }
  }
}
```

### Connection Reuse

```javascript
class ConnectionPool {
  constructor(size, createFn) {
    this.connections = [];
    this.available = [];
    this.waiting = [];

    for (let i = 0; i < size; i++) {
      const conn = createFn();
      this.connections.push(conn);
      this.available.push(conn);
    }
  }

  async acquire(timeout = 5000) {
    // Return available connection
    if (this.available.length > 0) {
      return this.available.pop();
    }

    // Wait for connection to become available
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.waiting.indexOf(resolve);
        if (index !== -1) {
          this.waiting.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, timeout);

      this.waiting.push((conn) => {
        clearTimeout(timer);
        resolve(conn);
      });
    });
  }

  release(conn) {
    if (this.waiting.length > 0) {
      // Give to waiting request
      const resolve = this.waiting.shift();
      resolve(conn);
    } else {
      // Return to available pool
      this.available.push(conn);
    }
  }

  async execute(fn) {
    const conn = await this.acquire();
    try {
      return await fn(conn);
    } finally {
      this.release(conn);
    }
  }
}
```

---

## Bottleneck Identification

### Performance Profiler

```javascript
class Profiler {
  constructor() {
    this.sections = new Map();
  }

  startSection(name) {
    if (!this.sections.has(name)) {
      this.sections.set(name, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0
      });
    }

    return {
      name,
      start: performance.now()
    };
  }

  endSection(section) {
    const duration = performance.now() - section.start;
    const stats = this.sections.get(section.name);

    stats.count++;
    stats.totalTime += duration;
    stats.minTime = Math.min(stats.minTime, duration);
    stats.maxTime = Math.max(stats.maxTime, duration);
  }

  getBottlenecks(threshold = 100) {
    const bottlenecks = [];

    for (const [name, stats] of this.sections) {
      const avgTime = stats.totalTime / stats.count;

      if (avgTime > threshold) {
        bottlenecks.push({
          name,
          avgTime,
          totalTime: stats.totalTime,
          percentage: 0 // Calculate below
        });
      }
    }

    // Calculate percentage of total time
    const totalTime = bottlenecks.reduce((sum, b) => sum + b.totalTime, 0);
    bottlenecks.forEach(b => {
      b.percentage = (b.totalTime / totalTime) * 100;
    });

    // Sort by total time
    return bottlenecks.sort((a, b) => b.totalTime - a.totalTime);
  }

  report() {
    console.log('\n=== Performance Profile ===\n');

    for (const [name, stats] of this.sections) {
      const avgTime = stats.totalTime / stats.count;

      console.log(`${name}:`);
      console.log(`  Calls: ${stats.count}`);
      console.log(`  Avg: ${avgTime.toFixed(2)}ms`);
      console.log(`  Min: ${stats.minTime.toFixed(2)}ms`);
      console.log(`  Max: ${stats.maxTime.toFixed(2)}ms`);
      console.log(`  Total: ${stats.totalTime.toFixed(2)}ms`);
      console.log('');
    }

    const bottlenecks = this.getBottlenecks();
    if (bottlenecks.length > 0) {
      console.log('Bottlenecks:');
      bottlenecks.forEach((b, i) => {
        console.log(`${i + 1}. ${b.name}: ${b.avgTime.toFixed(2)}ms (${b.percentage.toFixed(1)}%)`);
      });
    }
  }
}

// Usage
const profiler = new Profiler();

const s1 = profiler.startSection('task_execution');
await executeTask();
profiler.endSection(s1);

const s2 = profiler.startSection('result_processing');
processResult();
profiler.endSection(s2);

profiler.report();
```

---

## Best Practices

### Optimization Checklist

1. **Measure First** - Don't optimize without data
2. **Profile** - Use proper profiling tools
3. **Focus on Bottlenecks** - 80/20 rule
4. **Pool Processes** - Reuse instead of recreate
5. **Cache Results** - Avoid redundant work
6. **Batch Operations** - Reduce overhead
7. **Monitor Memory** - Prevent leaks
8. **Optimize IPC** - Minimize message passing
9. **Use Workers Efficiently** - Balance load
10. **Test Impact** - Verify improvements

### Common Anti-Patterns

❌ **Premature Optimization**
```javascript
// Don't optimize before measuring
```

❌ **Too Many Workers**
```javascript
// More workers ≠ better performance
// Use workers = CPU count for CPU-bound
```

❌ **Excessive Caching**
```javascript
// Don't cache everything
// Cache only frequently used data
```

❌ **Ignoring Profiling Data**
```javascript
// Optimize bottlenecks, not everything
```

---

**Next**: Read [Production Patterns](06-production-patterns.md) for deployment and operations.
