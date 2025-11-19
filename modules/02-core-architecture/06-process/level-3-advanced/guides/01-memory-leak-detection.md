# Memory Leak Detection and Prevention

## Table of Contents
- [Introduction](#introduction)
- [Understanding Memory Leaks](#understanding-memory-leaks)
- [Detection Techniques](#detection-techniques)
- [Profiling Tools](#profiling-tools)
- [Common Leak Patterns](#common-leak-patterns)
- [Production Monitoring](#production-monitoring)
- [Case Studies](#case-studies)
- [Prevention Strategies](#prevention-strategies)
- [Best Practices](#best-practices)
- [Anti-Patterns](#anti-patterns)

## Introduction

Memory leaks in Node.js applications are among the most challenging production issues to diagnose and resolve. Unlike traditional memory leaks in languages like C, JavaScript's garbage collection can mask leaks, making them harder to detect until they cause catastrophic failures.

### What Makes Node.js Memory Leaks Critical

```javascript
/**
 * Memory Leak Impact Analysis
 *
 * A memory leak in a Node.js process can cause:
 * - Gradual performance degradation
 * - Increased garbage collection frequency
 * - Process crashes due to OOM (Out of Memory)
 * - Service downtime and cascading failures
 */

// Example: Monitoring memory over time
class MemoryMonitor {
  constructor(options = {}) {
    this.interval = options.interval || 5000;
    this.threshold = options.threshold || 0.9;
    this.samples = [];
    this.maxSamples = options.maxSamples || 100;
  }

  start() {
    this.timer = setInterval(() => {
      const usage = process.memoryUsage();
      const sample = {
        timestamp: Date.now(),
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss,
        arrayBuffers: usage.arrayBuffers
      };

      this.samples.push(sample);

      // Keep only recent samples
      if (this.samples.length > this.maxSamples) {
        this.samples.shift();
      }

      this.analyze(sample);
    }, this.interval);
  }

  analyze(sample) {
    const utilization = sample.heapUsed / sample.heapTotal;

    if (utilization > this.threshold) {
      console.warn('High memory usage detected:', {
        utilization: `${(utilization * 100).toFixed(2)}%`,
        heapUsed: `${(sample.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(sample.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(sample.rss / 1024 / 1024).toFixed(2)} MB`
      });
    }

    // Detect steady growth (potential leak)
    if (this.samples.length >= 10) {
      const trend = this.calculateTrend();
      if (trend > 0.01) { // 1% growth per sample
        console.error('Memory leak suspected - steady growth detected:', {
          trendPercentage: `${(trend * 100).toFixed(4)}%`,
          samples: this.samples.length
        });
      }
    }
  }

  calculateTrend() {
    const recent = this.samples.slice(-10);
    const first = recent[0].heapUsed;
    const last = recent[recent.length - 1].heapUsed;
    return (last - first) / first / recent.length;
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getReport() {
    if (this.samples.length === 0) {
      return { message: 'No samples collected' };
    }

    const latest = this.samples[this.samples.length - 1];
    const oldest = this.samples[0];
    const avgHeapUsed = this.samples.reduce((sum, s) => sum + s.heapUsed, 0) / this.samples.length;

    return {
      duration: latest.timestamp - oldest.timestamp,
      samples: this.samples.length,
      current: {
        heapUsed: latest.heapUsed,
        heapTotal: latest.heapTotal,
        rss: latest.rss
      },
      average: {
        heapUsed: avgHeapUsed
      },
      growth: {
        absolute: latest.heapUsed - oldest.heapUsed,
        percentage: ((latest.heapUsed - oldest.heapUsed) / oldest.heapUsed) * 100
      },
      trend: this.calculateTrend()
    };
  }
}

// Usage
const monitor = new MemoryMonitor({
  interval: 10000, // Check every 10 seconds
  threshold: 0.85  // Alert at 85% heap usage
});

monitor.start();

// In production, attach to process exit
process.on('SIGTERM', () => {
  const report = monitor.getReport();
  console.log('Final memory report:', JSON.stringify(report, null, 2));
  monitor.stop();
  process.exit(0);
});
```

## Understanding Memory Leaks

### Memory Structure in Node.js

```javascript
/**
 * V8 Heap Memory Structure
 *
 * Understanding how V8 manages memory is crucial for leak detection
 */

class MemoryStructureAnalyzer {
  static analyze() {
    const usage = process.memoryUsage();

    return {
      // Resident Set Size - total memory allocated for the process
      rss: {
        bytes: usage.rss,
        mb: (usage.rss / 1024 / 1024).toFixed(2),
        description: 'Total memory allocated to the process (including heap, code, and stack)'
      },

      // Heap Total - total size of the allocated heap
      heapTotal: {
        bytes: usage.heapTotal,
        mb: (usage.heapTotal / 1024 / 1024).toFixed(2),
        description: 'Total size of the allocated heap'
      },

      // Heap Used - actual memory used
      heapUsed: {
        bytes: usage.heapUsed,
        mb: (usage.heapUsed / 1024 / 1024).toFixed(2),
        percentage: ((usage.heapUsed / usage.heapTotal) * 100).toFixed(2),
        description: 'Actual memory used in the heap'
      },

      // External - memory used by C++ objects bound to JavaScript
      external: {
        bytes: usage.external,
        mb: (usage.external / 1024 / 1024).toFixed(2),
        description: 'Memory used by C++ objects bound to JavaScript objects'
      },

      // Array Buffers - memory allocated for ArrayBuffers and SharedArrayBuffers
      arrayBuffers: {
        bytes: usage.arrayBuffers,
        mb: (usage.arrayBuffers / 1024 / 1024).toFixed(2),
        description: 'Memory allocated for ArrayBuffers and SharedArrayBuffers'
      }
    };
  }

  static getHeapStatistics() {
    const v8 = require('v8');
    const stats = v8.getHeapStatistics();

    return {
      totalHeapSize: stats.total_heap_size,
      totalHeapSizeExecutable: stats.total_heap_size_executable,
      totalPhysicalSize: stats.total_physical_size,
      totalAvailableSize: stats.total_available_size,
      usedHeapSize: stats.used_heap_size,
      heapSizeLimit: stats.heap_size_limit,
      mallocedMemory: stats.malloced_memory,
      peakMallocedMemory: stats.peak_malloced_memory,
      doesZapGarbage: stats.does_zap_garbage,
      numberOfNativeContexts: stats.number_of_native_contexts,
      numberOfDetachedContexts: stats.number_of_detached_contexts
    };
  }

  static getHeapSpaceStatistics() {
    const v8 = require('v8');
    return v8.getHeapSpaceStatistics();
  }
}

// Example usage
console.log('Memory Structure:',
  JSON.stringify(MemoryStructureAnalyzer.analyze(), null, 2));
console.log('Heap Statistics:',
  JSON.stringify(MemoryStructureAnalyzer.getHeapStatistics(), null, 2));
console.log('Heap Space Statistics:',
  JSON.stringify(MemoryStructureAnalyzer.getHeapSpaceStatistics(), null, 2));
```

### Types of Memory Leaks

```javascript
/**
 * Common Memory Leak Categories in Node.js
 */

// 1. GLOBAL VARIABLE LEAKS
class GlobalLeakExample {
  static demonstrateLeak() {
    // BAD: Unintentional global (missing 'const', 'let', or 'var')
    leakedData = new Array(1000000).fill('x');

    // BAD: Intentional global accumulation
    if (!global.cache) {
      global.cache = [];
    }
    global.cache.push(new Array(1000).fill('data'));
  }

  static demonstrateFix() {
    // GOOD: Proper scoping
    const localData = new Array(1000000).fill('x');

    // GOOD: Bounded cache with cleanup
    const cache = new Map();
    const MAX_CACHE_SIZE = 1000;

    function addToCache(key, value) {
      if (cache.size >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    }
  }
}

// 2. EVENT LISTENER LEAKS
class EventListenerLeaks {
  constructor() {
    this.eventEmitter = new (require('events')).EventEmitter();
    this.listeners = new Set();
  }

  // BAD: Adding listeners without cleanup
  demonstrateLeak() {
    setInterval(() => {
      this.eventEmitter.on('data', (data) => {
        console.log(data);
      });
    }, 1000);
  }

  // GOOD: Proper listener management
  demonstrateFix() {
    const listener = (data) => {
      console.log(data);
    };

    // Track listener
    this.listeners.add(listener);
    this.eventEmitter.on('data', listener);

    // Cleanup method
    this.cleanup = () => {
      this.listeners.forEach(listener => {
        this.eventEmitter.removeListener('data', listener);
      });
      this.listeners.clear();
    };
  }

  // Alternative: Use 'once' for one-time listeners
  demonstrateOnce() {
    this.eventEmitter.once('data', (data) => {
      console.log(data);
      // Automatically removed after first call
    });
  }
}

// 3. CLOSURE LEAKS
class ClosureLeaks {
  // BAD: Closure capturing large context
  demonstrateLeak() {
    const largeData = new Array(1000000).fill('x');

    return setInterval(() => {
      // This closure captures largeData even if not used
      console.log('tick');
    }, 1000);
  }

  // GOOD: Minimize closure scope
  demonstrateFix() {
    const largeData = new Array(1000000).fill('x');
    const needed = largeData.length; // Extract only what's needed

    return setInterval(() => {
      console.log('tick', needed);
      // largeData is not captured
    }, 1000);
  }

  // BAD: Detached DOM-like structures
  demonstrateDetachedStructures() {
    const cache = [];

    function createElement() {
      const element = {
        data: new Array(10000).fill('x'),
        parent: null,
        children: []
      };

      cache.push(element); // Reference kept even after 'removal'
      return element;
    }

    const el = createElement();
    // el is 'removed' but cache still holds reference
  }

  // GOOD: Proper cleanup
  demonstrateProperCleanup() {
    const cache = new WeakMap(); // Use WeakMap for automatic GC

    function createElement() {
      const element = {
        data: new Array(10000).fill('x'),
        parent: null,
        children: []
      };

      cache.set(element, { created: Date.now() });
      return element;
    }

    // When element is no longer referenced, WeakMap entry is GC'd
  }
}

// 4. TIMER LEAKS
class TimerLeaks {
  constructor() {
    this.timers = new Set();
  }

  // BAD: Timers not cleared
  demonstrateLeak() {
    setInterval(() => {
      console.log('This will run forever');
    }, 1000);

    setTimeout(() => {
      console.log('Even one-time timers hold references');
    }, 3600000); // 1 hour
  }

  // GOOD: Timer management
  demonstrateFix() {
    const intervalId = setInterval(() => {
      console.log('Managed interval');
    }, 1000);

    this.timers.add(intervalId);

    const timeoutId = setTimeout(() => {
      console.log('Managed timeout');
      this.timers.delete(timeoutId);
    }, 5000);

    this.timers.add(timeoutId);
  }

  cleanup() {
    this.timers.forEach(timerId => {
      clearInterval(timerId);
      clearTimeout(timerId);
    });
    this.timers.clear();
  }
}

// 5. CACHE LEAKS
class CacheLeaks {
  // BAD: Unbounded cache
  demonstrateLeak() {
    const cache = new Map();

    function cacheData(key, value) {
      cache.set(key, value); // Grows indefinitely
    }

    // Simulate requests
    for (let i = 0; i < 1000000; i++) {
      cacheData(`key-${i}`, { data: new Array(1000).fill('x') });
    }
  }

  // GOOD: LRU Cache with size limit
  demonstrateFix() {
    class LRUCache {
      constructor(maxSize = 1000) {
        this.maxSize = maxSize;
        this.cache = new Map();
      }

      get(key) {
        if (!this.cache.has(key)) {
          return undefined;
        }

        // Move to end (most recently used)
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
      }

      set(key, value) {
        // Remove if exists (to re-add at end)
        if (this.cache.has(key)) {
          this.cache.delete(key);
        }

        // Remove oldest if at capacity
        if (this.cache.size >= this.maxSize) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }

        this.cache.set(key, value);
      }

      clear() {
        this.cache.clear();
      }
    }

    const cache = new LRUCache(1000);

    for (let i = 0; i < 1000000; i++) {
      cache.set(`key-${i}`, { data: new Array(100).fill('x') });
    }
    // Cache never exceeds 1000 entries
  }
}

// 6. PROMISE LEAKS
class PromiseLeaks {
  // BAD: Unresolved promises with references
  demonstrateLeak() {
    const promises = [];

    function createHangingPromise() {
      const largeData = new Array(100000).fill('x');

      return new Promise((resolve, reject) => {
        // Never resolves - largeData is never released
        // resolve and reject are never called
      });
    }

    for (let i = 0; i < 1000; i++) {
      promises.push(createHangingPromise());
    }
  }

  // GOOD: Promise with timeout
  demonstrateFix() {
    function promiseWithTimeout(promise, timeout = 5000) {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
    }

    async function safeOperation() {
      try {
        const result = await promiseWithTimeout(
          someAsyncOperation(),
          5000
        );
        return result;
      } catch (error) {
        if (error.message === 'Timeout') {
          console.error('Operation timed out');
        }
        throw error;
      }
    }

    function someAsyncOperation() {
      return new Promise((resolve) => {
        setTimeout(() => resolve('done'), 1000);
      });
    }
  }
}
```

## Detection Techniques

### Heap Snapshot Analysis

```javascript
/**
 * Advanced Heap Snapshot Techniques
 */

const v8 = require('v8');
const fs = require('fs');
const path = require('path');

class HeapSnapshotAnalyzer {
  constructor(outputDir = './heap-snapshots') {
    this.outputDir = outputDir;
    this.snapshots = [];

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Take a heap snapshot
   */
  takeSnapshot(name = 'snapshot') {
    const timestamp = Date.now();
    const filename = `${name}-${timestamp}.heapsnapshot`;
    const filepath = path.join(this.outputDir, filename);

    console.log(`Taking heap snapshot: ${filename}`);

    const snapshot = v8.writeHeapSnapshot(filepath);

    this.snapshots.push({
      name,
      timestamp,
      filepath: snapshot,
      memoryUsage: process.memoryUsage()
    });

    console.log(`Snapshot saved: ${snapshot}`);
    return snapshot;
  }

  /**
   * Take snapshot before and after operation
   */
  async compareOperation(name, operation) {
    // Force GC if exposed
    if (global.gc) {
      global.gc();
    }

    const before = this.takeSnapshot(`${name}-before`);
    const memBefore = process.memoryUsage();

    console.log(`Executing operation: ${name}`);
    const result = await operation();

    // Force GC if exposed
    if (global.gc) {
      global.gc();
    }

    const after = this.takeSnapshot(`${name}-after`);
    const memAfter = process.memoryUsage();

    const diff = {
      heapUsed: memAfter.heapUsed - memBefore.heapUsed,
      heapTotal: memAfter.heapTotal - memBefore.heapTotal,
      external: memAfter.external - memBefore.external,
      rss: memAfter.rss - memBefore.rss
    };

    console.log('Memory difference:', {
      heapUsed: `${(diff.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(diff.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      external: `${(diff.external / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(diff.rss / 1024 / 1024).toFixed(2)} MB`
    });

    return { result, before, after, diff };
  }

  /**
   * Continuous monitoring with periodic snapshots
   */
  startContinuousMonitoring(interval = 60000, maxSnapshots = 10) {
    let count = 0;

    this.monitoringTimer = setInterval(() => {
      if (count >= maxSnapshots) {
        this.stopContinuousMonitoring();
        return;
      }

      this.takeSnapshot(`monitoring-${count}`);
      count++;
    }, interval);

    console.log(`Started continuous monitoring (interval: ${interval}ms, max: ${maxSnapshots})`);
  }

  stopContinuousMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      console.log('Stopped continuous monitoring');
    }
  }

  /**
   * Get snapshot report
   */
  getReport() {
    return {
      totalSnapshots: this.snapshots.length,
      outputDirectory: this.outputDir,
      snapshots: this.snapshots.map(s => ({
        name: s.name,
        timestamp: new Date(s.timestamp).toISOString(),
        filepath: s.filepath,
        memoryUsage: {
          heapUsed: `${(s.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(s.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          rss: `${(s.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`
        }
      }))
    };
  }

  /**
   * Clean old snapshots
   */
  cleanOldSnapshots(olderThanMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const files = fs.readdirSync(this.outputDir);
    let deleted = 0;

    files.forEach(file => {
      const filepath = path.join(this.outputDir, file);
      const stats = fs.statSync(filepath);

      if (now - stats.mtimeMs > olderThanMs) {
        fs.unlinkSync(filepath);
        deleted++;
      }
    });

    console.log(`Cleaned ${deleted} old snapshots`);
    return deleted;
  }
}

// Usage examples
async function demonstrateHeapSnapshotAnalysis() {
  const analyzer = new HeapSnapshotAnalyzer('./snapshots');

  // Example 1: Single snapshot
  analyzer.takeSnapshot('initial');

  // Example 2: Compare operation
  await analyzer.compareOperation('data-processing', async () => {
    const data = [];
    for (let i = 0; i < 100000; i++) {
      data.push({ id: i, value: `item-${i}` });
    }
    return data;
  });

  // Example 3: Continuous monitoring
  analyzer.startContinuousMonitoring(10000, 5); // Every 10s, max 5 snapshots

  // Simulate work
  setTimeout(() => {
    console.log('Report:', JSON.stringify(analyzer.getReport(), null, 2));
  }, 60000);
}

// Run with: node --expose-gc script.js
if (require.main === module) {
  demonstrateHeapSnapshotAnalysis().catch(console.error);
}
```

### Memory Usage Tracking

```javascript
/**
 * Production-Grade Memory Tracking
 */

class ProductionMemoryTracker {
  constructor(options = {}) {
    this.interval = options.interval || 30000; // 30 seconds
    this.retentionPeriod = options.retentionPeriod || 3600000; // 1 hour
    this.metrics = [];
    this.alerts = [];
    this.thresholds = {
      heapUsedWarning: options.heapUsedWarning || 0.75,
      heapUsedCritical: options.heapUsedCritical || 0.9,
      growthRateWarning: options.growthRateWarning || 0.05, // 5% per minute
      gcFrequencyWarning: options.gcFrequencyWarning || 10 // GC per minute
    };
  }

  start() {
    console.log('Starting production memory tracker');

    this.timer = setInterval(() => {
      this.collect();
      this.analyze();
      this.cleanup();
    }, this.interval);

    // Track GC events if available
    if (global.gc && process.env.NODE_ENV === 'development') {
      this.trackGC();
    }
  }

  collect() {
    const now = Date.now();
    const usage = process.memoryUsage();
    const v8 = require('v8');
    const heapStats = v8.getHeapStatistics();

    const metric = {
      timestamp: now,
      memory: {
        rss: usage.rss,
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers
      },
      heap: {
        totalHeapSize: heapStats.total_heap_size,
        usedHeapSize: heapStats.used_heap_size,
        heapSizeLimit: heapStats.heap_size_limit,
        mallocedMemory: heapStats.malloced_memory
      },
      derived: {
        heapUtilization: usage.heapUsed / usage.heapTotal,
        heapPercentage: (heapStats.used_heap_size / heapStats.heap_size_limit) * 100
      }
    };

    this.metrics.push(metric);
  }

  analyze() {
    if (this.metrics.length < 2) return;

    const latest = this.metrics[this.metrics.length - 1];
    const previous = this.metrics[this.metrics.length - 2];

    // Check heap utilization
    if (latest.derived.heapUtilization > this.thresholds.heapUsedCritical) {
      this.raiseAlert('CRITICAL', 'Heap utilization critical', {
        utilization: latest.derived.heapUtilization,
        threshold: this.thresholds.heapUsedCritical
      });
    } else if (latest.derived.heapUtilization > this.thresholds.heapUsedWarning) {
      this.raiseAlert('WARNING', 'Heap utilization high', {
        utilization: latest.derived.heapUtilization,
        threshold: this.thresholds.heapUsedWarning
      });
    }

    // Check growth rate
    const timeDiff = latest.timestamp - previous.timestamp;
    const heapGrowth = latest.memory.heapUsed - previous.memory.heapUsed;
    const growthPerMinute = (heapGrowth / previous.memory.heapUsed) * (60000 / timeDiff);

    if (growthPerMinute > this.thresholds.growthRateWarning) {
      this.raiseAlert('WARNING', 'Rapid heap growth detected', {
        growthPerMinute: `${(growthPerMinute * 100).toFixed(2)}%`,
        threshold: `${(this.thresholds.growthRateWarning * 100).toFixed(2)}%`
      });
    }

    // Check for steady growth (potential leak)
    if (this.metrics.length >= 10) {
      const trend = this.calculateTrend();
      if (trend.slope > 0 && trend.correlation > 0.9) {
        this.raiseAlert('WARNING', 'Steady memory growth (possible leak)', {
          trend: trend.slope,
          correlation: trend.correlation
        });
      }
    }
  }

  calculateTrend() {
    const recent = this.metrics.slice(-10);
    const n = recent.length;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    recent.forEach((metric, i) => {
      const x = i;
      const y = metric.memory.heapUsed;

      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
      sumY2 += y * y;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const correlation = (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return { slope, correlation };
  }

  raiseAlert(level, message, data) {
    const alert = {
      timestamp: Date.now(),
      level,
      message,
      data,
      metric: this.metrics[this.metrics.length - 1]
    };

    this.alerts.push(alert);

    console[level === 'CRITICAL' ? 'error' : 'warn'](`[${level}] ${message}`, data);

    // In production, send to monitoring system
    this.sendToMonitoring(alert);
  }

  sendToMonitoring(alert) {
    // Integration point for monitoring systems
    // Example: send to Prometheus, DataDog, New Relic, etc.
    if (process.env.MONITORING_ENDPOINT) {
      // Send alert to monitoring system
    }
  }

  cleanup() {
    const cutoff = Date.now() - this.retentionPeriod;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('Stopped production memory tracker');
  }

  getMetrics() {
    return {
      current: this.metrics[this.metrics.length - 1],
      count: this.metrics.length,
      alerts: this.alerts.length,
      recentAlerts: this.alerts.slice(-5)
    };
  }

  trackGC() {
    const { PerformanceObserver, performance } = require('perf_hooks');

    const obs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.kind === 'major') {
          console.log('Major GC:', {
            duration: entry.duration,
            flags: entry.flags
          });
        }
      });
    });

    obs.observe({ entryTypes: ['gc'], buffered: true });
  }
}

// Usage in production
const tracker = new ProductionMemoryTracker({
  interval: 30000,
  retentionPeriod: 3600000,
  heapUsedWarning: 0.75,
  heapUsedCritical: 0.9
});

tracker.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Final metrics:', tracker.getMetrics());
  tracker.stop();
  process.exit(0);
});
```

## Profiling Tools

### Node.js Inspector Integration

```javascript
/**
 * Advanced Inspector Integration for Memory Profiling
 */

const inspector = require('inspector');
const fs = require('fs');
const path = require('path');

class InspectorProfiler {
  constructor(outputDir = './profiles') {
    this.outputDir = outputDir;
    this.session = null;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Start heap profiling session
   */
  async startHeapProfiling() {
    this.session = new inspector.Session();
    this.session.connect();

    return new Promise((resolve, reject) => {
      this.session.post('HeapProfiler.enable', (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.session.post('HeapProfiler.startSampling', {
          samplingInterval: 512  // bytes
        }, (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Heap profiling started');
            resolve();
          }
        });
      });
    });
  }

  /**
   * Stop heap profiling and save results
   */
  async stopHeapProfiling(filename = 'heap-profile') {
    return new Promise((resolve, reject) => {
      this.session.post('HeapProfiler.stopSampling', (err, { profile }) => {
        if (err) {
          reject(err);
          return;
        }

        const filepath = path.join(
          this.outputDir,
          `${filename}-${Date.now()}.heapprofile`
        );

        fs.writeFileSync(filepath, JSON.stringify(profile, null, 2));
        console.log(`Heap profile saved: ${filepath}`);

        this.session.disconnect();
        this.session = null;
        resolve(filepath);
      });
    });
  }

  /**
   * Take allocation timeline
   */
  async recordAllocationTimeline(duration = 30000) {
    this.session = new inspector.Session();
    this.session.connect();

    const samples = [];

    return new Promise((resolve, reject) => {
      this.session.post('HeapProfiler.enable', (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.session.on('HeapProfiler.addHeapSnapshotChunk', (m) => {
          samples.push(m.params.chunk);
        });

        this.session.post('HeapProfiler.startTrackingHeapObjects', {
          trackAllocations: true
        }, (err) => {
          if (err) {
            reject(err);
            return;
          }

          console.log(`Recording allocation timeline for ${duration}ms`);

          setTimeout(() => {
            this.session.post('HeapProfiler.stopTrackingHeapObjects', (err) => {
              if (err) {
                reject(err);
                return;
              }

              const filepath = path.join(
                this.outputDir,
                `allocation-timeline-${Date.now()}.heaptimeline`
              );

              fs.writeFileSync(filepath, samples.join(''));
              console.log(`Allocation timeline saved: ${filepath}`);

              this.session.disconnect();
              this.session = null;
              resolve(filepath);
            });
          }, duration);
        });
      });
    });
  }

  /**
   * Profile a specific operation
   */
  async profileOperation(operation, name = 'operation') {
    await this.startHeapProfiling();

    console.log(`Profiling operation: ${name}`);
    const startMem = process.memoryUsage();
    const startTime = Date.now();

    try {
      const result = await operation();

      const endTime = Date.now();
      const endMem = process.memoryUsage();

      const profile = await this.stopHeapProfiling(name);

      return {
        result,
        profile,
        metrics: {
          duration: endTime - startTime,
          memoryDelta: {
            heapUsed: endMem.heapUsed - startMem.heapUsed,
            external: endMem.external - startMem.external,
            rss: endMem.rss - startMem.rss
          }
        }
      };
    } catch (error) {
      await this.stopHeapProfiling(`${name}-error`);
      throw error;
    }
  }

  /**
   * Get heap object statistics
   */
  async getObjectStats() {
    this.session = new inspector.Session();
    this.session.connect();

    return new Promise((resolve, reject) => {
      this.session.post('HeapProfiler.enable', (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.session.post('HeapProfiler.getObjectByHeapObjectId', {
          objectId: '1'
        }, (err, result) => {
          this.session.disconnect();
          this.session = null;

          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    });
  }
}

// Usage examples
async function demonstrateInspectorProfiling() {
  const profiler = new InspectorProfiler('./profiles');

  // Example 1: Profile specific operation
  const result = await profiler.profileOperation(async () => {
    const data = [];
    for (let i = 0; i < 100000; i++) {
      data.push({ id: i, timestamp: Date.now() });
    }
    return data.length;
  }, 'data-generation');

  console.log('Profile result:', result);

  // Example 2: Record allocation timeline
  const timeline = await profiler.recordAllocationTimeline(5000);
  console.log('Timeline saved:', timeline);
}

if (require.main === module) {
  demonstrateInspectorProfiling().catch(console.error);
}
```

### CLI Profiling Tools

```javascript
/**
 * Integration with CLI profiling tools
 *
 * Tools covered:
 * - node --inspect
 * - node --heapsnapshot-signal
 * - clinic.js
 * - 0x
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class CLIProfilingTools {
  /**
   * Run script with Node.js inspector
   */
  static runWithInspector(scriptPath, options = {}) {
    const args = [
      '--inspect',
      ...(options.inspectBrk ? ['--inspect-brk'] : []),
      ...(options.exposeGC ? ['--expose-gc'] : []),
      scriptPath,
      ...(options.args || [])
    ];

    console.log('Running with inspector:', args.join(' '));

    const child = spawn('node', args, {
      stdio: 'inherit',
      env: { ...process.env, ...options.env }
    });

    return new Promise((resolve, reject) => {
      child.on('exit', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  /**
   * Run with heap snapshot on signal
   */
  static runWithHeapSnapshotSignal(scriptPath, options = {}) {
    const signal = options.signal || 'SIGUSR2';
    const outputDir = options.outputDir || './heap-snapshots';

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const args = [
      `--heapsnapshot-signal=${signal}`,
      `--heapsnapshot-dir=${outputDir}`,
      scriptPath,
      ...(options.args || [])
    ];

    console.log(`Running with heap snapshot signal (${signal}):`, args.join(' '));
    console.log(`Snapshots will be saved to: ${outputDir}`);
    console.log(`Send signal with: kill -${signal} <pid>`);

    const child = spawn('node', args, {
      stdio: 'inherit',
      env: { ...process.env, ...options.env }
    });

    console.log(`Process PID: ${child.pid}`);

    return new Promise((resolve, reject) => {
      child.on('exit', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  /**
   * Run with Clinic.js Doctor
   */
  static runWithClinicDoctor(scriptPath, options = {}) {
    const args = [
      'doctor',
      '--on-port', options.port || 'autocannon localhost:$PORT',
      '--',
      scriptPath,
      ...(options.args || [])
    ];

    console.log('Running with Clinic.js Doctor:', args.join(' '));
    console.log('This will generate performance diagnostics');

    const child = spawn('clinic', args, {
      stdio: 'inherit',
      env: { ...process.env, ...options.env }
    });

    return new Promise((resolve, reject) => {
      child.on('exit', (code) => {
        if (code === 0) {
          console.log('Clinic.js Doctor completed. Check the generated HTML report.');
          resolve(code);
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  /**
   * Run with 0x (flamegraph profiler)
   */
  static runWith0x(scriptPath, options = {}) {
    const args = [
      ...(options.collectOnly ? ['--collect-only'] : []),
      scriptPath,
      ...(options.args || [])
    ];

    console.log('Running with 0x:', args.join(' '));
    console.log('This will generate flame graphs');

    const child = spawn('0x', args, {
      stdio: 'inherit',
      env: { ...process.env, ...options.env }
    });

    return new Promise((resolve, reject) => {
      child.on('exit', (code) => {
        if (code === 0) {
          console.log('0x profiling completed. Check the generated flame graph.');
          resolve(code);
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }
}

// Example usage script
if (require.main === module) {
  const scriptToProfile = process.argv[2] || './app.js';

  // Example 1: Run with inspector
  // CLIProfilingTools.runWithInspector(scriptToProfile, {
  //   exposeGC: true,
  //   inspectBrk: true
  // });

  // Example 2: Run with heap snapshot signal
  // CLIProfilingTools.runWithHeapSnapshotSignal(scriptToProfile, {
  //   signal: 'SIGUSR2',
  //   outputDir: './snapshots'
  // });

  // Example 3: Run with Clinic.js Doctor
  // CLIProfilingTools.runWithClinicDoctor(scriptToProfile);

  // Example 4: Run with 0x
  // CLIProfilingTools.runWith0x(scriptToProfile);

  console.log('CLI Profiling Tools Helper');
  console.log('Usage examples provided in source code');
}
```

## Common Leak Patterns

### Real-World Examples

```javascript
/**
 * Real-world memory leak patterns from production systems
 */

// PATTERN 1: Express.js middleware leak
class ExpressMiddlewareLeak {
  // BAD: Middleware adding to global array
  static leakyMiddleware() {
    const requestLog = []; // This accumulates forever

    return (req, res, next) => {
      requestLog.push({
        url: req.url,
        timestamp: Date.now(),
        headers: req.headers, // Large object
        body: req.body // Potentially large
      });
      next();
    };
  }

  // GOOD: Bounded circular buffer
  static fixedMiddleware() {
    const MAX_LOG_SIZE = 1000;
    const requestLog = [];

    return (req, res, next) => {
      if (requestLog.length >= MAX_LOG_SIZE) {
        requestLog.shift(); // Remove oldest
      }

      requestLog.push({
        url: req.url,
        timestamp: Date.now(),
        // Only log what's needed
        method: req.method,
        statusCode: res.statusCode
      });

      next();
    };
  }
}

// PATTERN 2: WebSocket connection leak
class WebSocketLeak {
  constructor() {
    this.connections = new Map();
  }

  // BAD: Connections never cleaned up
  handleConnection(ws, id) {
    this.connections.set(id, ws);

    ws.on('message', (data) => {
      console.log('Received:', data);
    });

    // Missing: cleanup on close
  }

  // GOOD: Proper connection lifecycle
  handleConnectionFixed(ws, id) {
    this.connections.set(id, ws);

    ws.on('message', (data) => {
      console.log('Received:', data);
    });

    ws.on('close', () => {
      this.connections.delete(id);
      console.log(`Connection ${id} cleaned up`);
    });

    ws.on('error', (error) => {
      console.error(`Connection ${id} error:`, error);
      this.connections.delete(id);
    });
  }

  // Additional: Periodic cleanup of stale connections
  startCleanup(interval = 60000) {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [id, ws] of this.connections.entries()) {
        if (ws.readyState === ws.CLOSED || ws.readyState === ws.CLOSING) {
          this.connections.delete(id);
          console.log(`Cleaned up stale connection: ${id}`);
        }
      }
    }, interval);
  }

  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

// PATTERN 3: Database connection pool leak
class DatabasePoolLeak {
  // BAD: Connections not returned to pool
  async queryLeaky(pool, query) {
    const connection = await pool.getConnection();
    const results = await connection.query(query);
    return results;
    // Connection never released!
  }

  // GOOD: Proper connection management
  async queryFixed(pool, query) {
    const connection = await pool.getConnection();
    try {
      const results = await connection.query(query);
      return results;
    } finally {
      connection.release();
    }
  }

  // BETTER: Use pool.query directly
  async queryBest(pool, query) {
    return await pool.query(query);
    // Pool handles connection lifecycle
  }
}

// PATTERN 4: Stream leak
class StreamLeak {
  // BAD: Stream not properly closed
  processFileLeaky(filename) {
    const fs = require('fs');
    const stream = fs.createReadStream(filename);

    stream.on('data', (chunk) => {
      console.log('Processing chunk:', chunk.length);
    });

    // Missing: error handling and cleanup
  }

  // GOOD: Proper stream handling
  processFileFixed(filename) {
    const fs = require('fs');
    const stream = fs.createReadStream(filename);

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        console.log('Processing chunk:', chunk.length);
      });

      stream.on('end', () => {
        console.log('Stream ended');
        resolve();
      });

      stream.on('error', (error) => {
        console.error('Stream error:', error);
        stream.destroy();
        reject(error);
      });

      // Cleanup on process exit
      const cleanup = () => {
        stream.destroy();
      };

      process.once('SIGTERM', cleanup);
      process.once('SIGINT', cleanup);

      stream.on('close', () => {
        process.removeListener('SIGTERM', cleanup);
        process.removeListener('SIGINT', cleanup);
      });
    });
  }

  // BETTER: Use pipeline
  async processFileBest(filename, outputFilename) {
    const fs = require('fs');
    const { pipeline } = require('stream/promises');
    const { Transform } = require('stream');

    const transform = new Transform({
      transform(chunk, encoding, callback) {
        console.log('Processing chunk:', chunk.length);
        callback(null, chunk);
      }
    });

    try {
      await pipeline(
        fs.createReadStream(filename),
        transform,
        fs.createWriteStream(outputFilename)
      );
      console.log('Pipeline completed');
    } catch (error) {
      console.error('Pipeline error:', error);
      throw error;
    }
  }
}

// PATTERN 5: React-like component leak (applicable to any framework)
class ComponentLeak {
  constructor() {
    this.subscribers = new Set();
  }

  // BAD: Subscription not cleaned up
  componentDidMountLeaky() {
    const subscription = eventEmitter.on('data', (data) => {
      this.handleData(data);
    });
    // Subscription persists after component unmounts
  }

  // GOOD: Cleanup in unmount
  componentDidMountFixed() {
    this.subscription = eventEmitter.on('data', (data) => {
      this.handleData(data);
    });
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  handleData(data) {
    console.log('Data received:', data);
  }
}

// PATTERN 6: Circular reference leak
class CircularReferenceLeak {
  // BAD: Circular references preventing GC
  createCircularLeaky() {
    const obj1 = { name: 'obj1' };
    const obj2 = { name: 'obj2' };

    obj1.ref = obj2;
    obj2.ref = obj1;

    // Both stored in long-lived cache
    cache.set('obj1', obj1);
    cache.set('obj2', obj2);
  }

  // GOOD: Use WeakMap for circular structures
  createCircularFixed() {
    const obj1 = { name: 'obj1' };
    const obj2 = { name: 'obj2' };

    const weakCache = new WeakMap();
    weakCache.set(obj1, obj2);
    weakCache.set(obj2, obj1);

    // When obj1 and obj2 are no longer referenced elsewhere, they can be GC'd
  }

  // ALTERNATIVE: Break circular references explicitly
  cleanup(obj) {
    if (obj && obj.ref) {
      obj.ref = null;
    }
  }
}
```

## Production Monitoring

### Integration with Monitoring Systems

```javascript
/**
 * Production monitoring integration
 */

class ProductionMonitoringIntegration {
  constructor(options = {}) {
    this.prometheusEnabled = options.prometheus || false;
    this.datadogEnabled = options.datadog || false;
    this.newRelicEnabled = options.newRelic || false;
    this.customEnabled = options.custom || false;
  }

  /**
   * Prometheus integration
   */
  setupPrometheus() {
    const client = require('prom-client');

    // Create a Registry
    const register = new client.Registry();

    // Add default metrics
    client.collectDefaultMetrics({ register });

    // Custom memory metrics
    const heapUsedGauge = new client.Gauge({
      name: 'nodejs_heap_used_bytes',
      help: 'Heap used in bytes',
      registers: [register]
    });

    const heapTotalGauge = new client.Gauge({
      name: 'nodejs_heap_total_bytes',
      help: 'Total heap size in bytes',
      registers: [register]
    });

    const externalGauge = new client.Gauge({
      name: 'nodejs_external_memory_bytes',
      help: 'External memory in bytes',
      registers: [register]
    });

    // Update metrics periodically
    setInterval(() => {
      const usage = process.memoryUsage();
      heapUsedGauge.set(usage.heapUsed);
      heapTotalGauge.set(usage.heapTotal);
      externalGauge.set(usage.external);
    }, 5000);

    return { register, client };
  }

  /**
   * DataDog StatsD integration
   */
  setupDatadog() {
    const StatsD = require('hot-shots');

    const dogstatsd = new StatsD({
      host: process.env.DD_AGENT_HOST || 'localhost',
      port: process.env.DD_AGENT_PORT || 8125,
      globalTags: {
        env: process.env.NODE_ENV || 'development',
        service: process.env.SERVICE_NAME || 'node-app'
      }
    });

    // Send memory metrics
    setInterval(() => {
      const usage = process.memoryUsage();

      dogstatsd.gauge('nodejs.memory.heap_used', usage.heapUsed);
      dogstatsd.gauge('nodejs.memory.heap_total', usage.heapTotal);
      dogstatsd.gauge('nodejs.memory.external', usage.external);
      dogstatsd.gauge('nodejs.memory.rss', usage.rss);
      dogstatsd.gauge('nodejs.memory.array_buffers', usage.arrayBuffers);
    }, 10000);

    return dogstatsd;
  }

  /**
   * New Relic integration
   */
  setupNewRelic() {
    // Requires NEW_RELIC_LICENSE_KEY environment variable
    if (!process.env.NEW_RELIC_LICENSE_KEY) {
      console.warn('NEW_RELIC_LICENSE_KEY not set');
      return null;
    }

    const newrelic = require('newrelic');

    // Custom memory metrics
    setInterval(() => {
      const usage = process.memoryUsage();

      newrelic.recordMetric('Custom/Memory/HeapUsed', usage.heapUsed / 1024 / 1024);
      newrelic.recordMetric('Custom/Memory/HeapTotal', usage.heapTotal / 1024 / 1024);
      newrelic.recordMetric('Custom/Memory/RSS', usage.rss / 1024 / 1024);
      newrelic.recordMetric('Custom/Memory/External', usage.external / 1024 / 1024);
    }, 60000);

    return newrelic;
  }

  /**
   * Custom webhook integration
   */
  setupCustomWebhook(webhookUrl) {
    const https = require('https');
    const url = require('url');

    const sendMetrics = (metrics) => {
      const payload = JSON.stringify({
        timestamp: new Date().toISOString(),
        service: process.env.SERVICE_NAME || 'node-app',
        metrics
      });

      const urlObj = url.parse(webhookUrl);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          console.error(`Webhook failed: ${res.statusCode}`);
        }
      });

      req.on('error', (error) => {
        console.error('Webhook error:', error);
      });

      req.write(payload);
      req.end();
    };

    // Send metrics periodically
    setInterval(() => {
      const usage = process.memoryUsage();
      const v8 = require('v8');
      const heapStats = v8.getHeapStatistics();

      sendMetrics({
        memory: {
          heapUsed: usage.heapUsed,
          heapTotal: usage.heapTotal,
          external: usage.external,
          rss: usage.rss,
          arrayBuffers: usage.arrayBuffers
        },
        heap: {
          totalHeapSize: heapStats.total_heap_size,
          usedHeapSize: heapStats.used_heap_size,
          heapSizeLimit: heapStats.heap_size_limit
        }
      });
    }, 60000);
  }
}

// Usage
const monitoring = new ProductionMonitoringIntegration({
  prometheus: true,
  datadog: false,
  newRelic: false,
  custom: false
});

const { register } = monitoring.setupPrometheus();

// Expose metrics endpoint for Prometheus
const express = require('express');
const app = express();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(9090, () => {
  console.log('Metrics server listening on port 9090');
});
```

## Case Studies

### Case Study 1: E-commerce Platform Memory Leak

```javascript
/**
 * CASE STUDY: E-commerce Session Store Leak
 *
 * Problem: Memory growing steadily in production, process OOM after 48 hours
 * Root Cause: Express sessions stored in memory without expiration
 * Impact: 3 production outages over 2 weeks
 * Solution: Implemented Redis session store with TTL
 */

// BEFORE: Memory leak
class SessionLeakBefore {
  constructor() {
    this.sessions = new Map(); // No cleanup!
  }

  createSession(userId, data) {
    const sessionId = this.generateId();
    this.sessions.set(sessionId, {
      userId,
      data,
      createdAt: Date.now()
    });
    return sessionId;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  generateId() {
    return require('crypto').randomBytes(16).toString('hex');
  }

  // Memory keeps growing - sessions never expire or cleaned up
}

// AFTER: Fixed implementation
class SessionStoreFixed {
  constructor(options = {}) {
    this.sessions = new Map();
    this.ttl = options.ttl || 24 * 60 * 60 * 1000; // 24 hours
    this.cleanupInterval = options.cleanupInterval || 60 * 60 * 1000; // 1 hour
    this.maxSessions = options.maxSessions || 10000;

    this.startCleanup();
  }

  createSession(userId, data) {
    // Enforce max sessions
    if (this.sessions.size >= this.maxSessions) {
      this.evictOldest();
    }

    const sessionId = this.generateId();
    this.sessions.set(sessionId, {
      userId,
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttl
    });
    return sessionId;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check expiration
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    console.log(`Cleaned ${cleaned} expired sessions. Active: ${this.sessions.size}`);
  }

  evictOldest() {
    const oldest = Array.from(this.sessions.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt)[0];

    if (oldest) {
      this.sessions.delete(oldest[0]);
    }
  }

  generateId() {
    return require('crypto').randomBytes(16).toString('hex');
  }

  stop() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

// PRODUCTION SOLUTION: Redis-backed sessions
class RedisSessionStore {
  constructor(redisClient, options = {}) {
    this.redis = redisClient;
    this.ttl = options.ttl || 24 * 60 * 60; // 24 hours in seconds
    this.prefix = options.prefix || 'sess:';
  }

  async createSession(userId, data) {
    const sessionId = this.generateId();
    const key = this.prefix + sessionId;

    await this.redis.setex(
      key,
      this.ttl,
      JSON.stringify({ userId, data, createdAt: Date.now() })
    );

    return sessionId;
  }

  async getSession(sessionId) {
    const key = this.prefix + sessionId;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  async destroySession(sessionId) {
    const key = this.prefix + sessionId;
    await this.redis.del(key);
  }

  generateId() {
    return require('crypto').randomBytes(16).toString('hex');
  }
}

/**
 * Results:
 * - Memory usage stable at ~200MB (was growing to 2GB+)
 * - No OOM crashes since implementation
 * - Session cleanup automatic via Redis TTL
 * - Horizontal scaling now possible
 */
```

### Case Study 2: Real-time Analytics Dashboard

```javascript
/**
 * CASE STUDY: WebSocket Event Listener Leak
 *
 * Problem: Memory increasing 100MB/hour in analytics dashboard
 * Root Cause: Event listeners on WebSocket reconnections not cleaned up
 * Impact: Dashboard unusable after 12 hours, required daily restarts
 * Solution: Proper listener cleanup and connection pooling
 */

// BEFORE: Event listener leak
class AnalyticsDashboardBefore {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
  }

  connect() {
    const WebSocket = require('ws');
    this.ws = new WebSocket('ws://analytics-server');

    // PROBLEM: Adding new listeners on each reconnection
    this.ws.on('message', (data) => {
      this.handleMessage(data);
    });

    this.ws.on('close', () => {
      console.log('Connection closed, reconnecting...');
      setTimeout(() => this.connect(), this.reconnectInterval);
      // Listeners from previous connection not removed!
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  handleMessage(data) {
    console.log('Received:', data);
    // Process analytics data
  }
}

// AFTER: Fixed implementation
class AnalyticsDashboardFixed {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.messageHandler = this.handleMessage.bind(this);
    this.closeHandler = this.handleClose.bind(this);
    this.errorHandler = this.handleError.bind(this);
    this.reconnectTimer = null;
  }

  connect() {
    // Clean up existing connection
    if (this.ws) {
      this.disconnect();
    }

    const WebSocket = require('ws');
    this.ws = new WebSocket('ws://analytics-server');

    // Use bound methods to ensure consistent reference
    this.ws.on('message', this.messageHandler);
    this.ws.on('close', this.closeHandler);
    this.ws.on('error', this.errorHandler);

    console.log('Connected to analytics server');
  }

  disconnect() {
    if (this.ws) {
      // Remove all listeners
      this.ws.removeListener('message', this.messageHandler);
      this.ws.removeListener('close', this.closeHandler);
      this.ws.removeListener('error', this.errorHandler);

      // Close connection
      if (this.ws.readyState === this.ws.OPEN) {
        this.ws.close();
      }

      this.ws = null;
    }

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  handleMessage(data) {
    try {
      const parsed = JSON.parse(data);
      console.log('Received analytics:', parsed);
      // Process analytics data
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  handleClose() {
    console.log('Connection closed, scheduling reconnect...');
    this.ws = null;

    // Schedule reconnection
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  handleError(error) {
    console.error('WebSocket error:', error);
  }

  shutdown() {
    console.log('Shutting down analytics dashboard');
    this.disconnect();
  }
}

/**
 * Results:
 * - Memory usage stable at ~50MB (was growing to 1.2GB+)
 * - No more daily restarts required
 * - Proper cleanup on reconnections
 * - Added graceful shutdown handling
 */
```

## Prevention Strategies

### Code Review Checklist

```javascript
/**
 * Memory Leak Prevention Checklist
 */

const MEMORY_LEAK_CHECKLIST = {
  eventListeners: {
    title: 'Event Listener Management',
    checks: [
      'Are all event listeners removed when no longer needed?',
      'Are "once" listeners used for one-time events?',
      'Is removeListener called in cleanup/destructor methods?',
      'Are listener references stored for later removal?'
    ],
    example: `
// GOOD
class Component {
  constructor(emitter) {
    this.emitter = emitter;
    this.handler = this.onData.bind(this);
    this.emitter.on('data', this.handler);
  }

  onData(data) {
    console.log(data);
  }

  destroy() {
    this.emitter.removeListener('data', this.handler);
  }
}
    `
  },

  timers: {
    title: 'Timer Management',
    checks: [
      'Are all setTimeout/setInterval cleared when done?',
      'Are timer IDs stored for cleanup?',
      'Is cleanup called on process exit?',
      'Are timers cleared in error paths?'
    ],
    example: `
// GOOD
class PeriodicTask {
  constructor(interval) {
    this.interval = interval;
    this.timerId = null;
  }

  start() {
    this.timerId = setInterval(() => {
      this.execute();
    }, this.interval);
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  execute() {
    // Task logic
  }
}
    `
  },

  caches: {
    title: 'Cache Management',
    checks: [
      'Do caches have size limits?',
      'Is there an eviction strategy (LRU, TTL)?',
      'Are cache entries cleaned up periodically?',
      'Is WeakMap used where appropriate?'
    ],
    example: `
// GOOD
class BoundedCache {
  constructor(maxSize = 1000, ttl = 3600000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.startCleanup();
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 60000);
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}
    `
  },

  streams: {
    title: 'Stream Management',
    checks: [
      'Are streams properly closed/destroyed?',
      'Are error handlers attached?',
      'Is cleanup done on error?',
      'Is pipeline used instead of manual piping?'
    ],
    example: `
// GOOD
async function processFile(inputPath, outputPath) {
  const { pipeline } = require('stream/promises');
  const fs = require('fs');
  const { Transform } = require('stream');

  const transform = new Transform({
    transform(chunk, encoding, callback) {
      // Process chunk
      callback(null, chunk);
    }
  });

  try {
    await pipeline(
      fs.createReadStream(inputPath),
      transform,
      fs.createWriteStream(outputPath)
    );
  } catch (error) {
    console.error('Pipeline failed:', error);
    throw error;
  }
  // All streams automatically cleaned up
}
    `
  },

  promises: {
    title: 'Promise Management',
    checks: [
      'Are all promises resolved or rejected?',
      'Are promise chains properly terminated?',
      'Are error handlers attached?',
      'Are timeouts used for long operations?'
    ],
    example: `
// GOOD
function withTimeout(promise, timeout = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
}

async function safeOperation() {
  try {
    return await withTimeout(riskyOperation(), 5000);
  } catch (error) {
    console.error('Operation failed:', error);
    throw error;
  }
}
    `
  },

  closures: {
    title: 'Closure Scope',
    checks: [
      'Do closures capture only necessary data?',
      'Are large objects extracted before closure?',
      'Are closures created in loops optimized?',
      'Are detached DOM-like structures avoided?'
    ],
    example: `
// GOOD
function createProcessor() {
  const largeData = loadLargeData();
  const neededValue = largeData.importantField;

  // Closure only captures neededValue, not largeData
  return function process(input) {
    return input + neededValue;
  };
}
    `
  }
};

// Print checklist
function printChecklist() {
  console.log('Memory Leak Prevention Checklist\n');

  Object.entries(MEMORY_LEAK_CHECKLIST).forEach(([key, section]) => {
    console.log(`\n${section.title}:`);
    section.checks.forEach((check, i) => {
      console.log(`  ${i + 1}. ${check}`);
    });
  });
}

if (require.main === module) {
  printChecklist();
}
```

## Best Practices

```javascript
/**
 * Memory Management Best Practices
 */

// 1. Use WeakMap/WeakSet for caches
class WeakCacheExample {
  constructor() {
    this.cache = new WeakMap(); // Allows GC
  }

  set(obj, value) {
    this.cache.set(obj, value);
  }

  get(obj) {
    return this.cache.get(obj);
  }
}

// 2. Implement proper cleanup
class ResourceManager {
  constructor() {
    this.resources = new Set();
  }

  acquire(resource) {
    this.resources.add(resource);
    return resource;
  }

  release(resource) {
    this.resources.delete(resource);
    if (resource.cleanup) {
      resource.cleanup();
    }
  }

  releaseAll() {
    for (const resource of this.resources) {
      this.release(resource);
    }
    this.resources.clear();
  }
}

// 3. Monitor memory in production
function setupProductionMonitoring() {
  const monitor = new MemoryMonitor({
    interval: 60000,
    threshold: 0.85
  });

  monitor.start();

  process.on('SIGTERM', () => {
    console.log('Final memory report:', monitor.getReport());
    monitor.stop();
  });
}

// 4. Use streaming for large data
async function processLargeFile(inputPath, outputPath) {
  const { pipeline } = require('stream/promises');
  const fs = require('fs');

  await pipeline(
    fs.createReadStream(inputPath),
    transformStream(),
    fs.createWriteStream(outputPath)
  );
}

// 5. Implement backpressure
function createBackpressureHandler(stream) {
  stream.on('drain', () => {
    console.log('Stream drained, can write more');
  });

  function writeWithBackpressure(data) {
    if (!stream.write(data)) {
      return new Promise(resolve => {
        stream.once('drain', resolve);
      });
    }
  }

  return writeWithBackpressure;
}
```

## Anti-Patterns

```javascript
/**
 * Common Memory Leak Anti-Patterns to Avoid
 */

// ANTI-PATTERN 1: Global variable accumulation
// BAD
global.requestLog = [];
function logRequest(req) {
  global.requestLog.push(req); // Grows forever
}

// GOOD
const MAX_LOG = 1000;
const requestLog = [];
function logRequest(req) {
  if (requestLog.length >= MAX_LOG) {
    requestLog.shift();
  }
  requestLog.push(req);
}

// ANTI-PATTERN 2: Forgotten timers
// BAD
function startPolling() {
  setInterval(() => {
    poll();
  }, 1000);
  // No way to stop!
}

// GOOD
class Poller {
  start() {
    this.timerId = setInterval(() => {
      this.poll();
    }, 1000);
  }

  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  poll() {
    // Polling logic
  }
}

// ANTI-PATTERN 3: Unbounded caches
// BAD
const cache = {};
function cacheResult(key, value) {
  cache[key] = value; // Grows forever
}

// GOOD
class LRUCache {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;

    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
}

// ANTI-PATTERN 4: Event listener buildup
// BAD
function setupListener(emitter) {
  setInterval(() => {
    emitter.on('data', data => {
      console.log(data);
    });
  }, 1000);
}

// GOOD
function setupListener(emitter) {
  const handler = (data) => {
    console.log(data);
  };

  emitter.on('data', handler);

  return () => {
    emitter.removeListener('data', handler);
  };
}

// ANTI-PATTERN 5: Missing error handlers
// BAD
const stream = fs.createReadStream('file.txt');
stream.on('data', chunk => {
  process(chunk);
});
// Stream never cleaned up on error!

// GOOD
const stream = fs.createReadStream('file.txt');
stream.on('data', chunk => {
  process(chunk);
});
stream.on('error', error => {
  console.error('Stream error:', error);
  stream.destroy();
});
stream.on('close', () => {
  console.log('Stream closed');
});
```

## Conclusion

Memory leak detection and prevention requires:

1. **Understanding** - Know how V8 manages memory
2. **Monitoring** - Track memory usage in production
3. **Profiling** - Use tools to identify leaks
4. **Prevention** - Follow best practices
5. **Testing** - Test for leaks before production

Remember:
- Memory leaks are gradual and often hard to detect
- Production monitoring is essential
- Proper cleanup is critical
- Use the right data structures (WeakMap, etc.)
- Test with realistic data volumes
- Profile regularly in development

**Key Takeaways:**
- Monitor memory usage continuously
- Use heap snapshots to diagnose leaks
- Implement proper cleanup in all components
- Use bounded caches and proper eviction
- Clean up event listeners and timers
- Use streams and backpressure for large data
- Test under production-like conditions
