/**
 * Example 3: Advanced Memory Management
 *
 * This example demonstrates:
 * - Memory leak detection
 * - Heap snapshot analysis
 * - Automatic cleanup strategies
 * - Memory profiling
 * - Resource cleanup patterns
 */

const vm = require('vm');
const v8 = require('v8');
const util = require('util');

console.log('=== Advanced VM Memory Management ===\n');

// ============================================================================
// Part 1: Memory Monitoring Basics
// ============================================================================

console.log('Part 1: Memory Monitoring Basics\n');

/**
 * Get current memory statistics
 */
function getMemoryStats() {
  const heapStats = v8.getHeapStatistics();
  const memUsage = process.memoryUsage();

  return {
    heap: {
      total: (heapStats.total_heap_size / 1024 / 1024).toFixed(2) + ' MB',
      used: (heapStats.used_heap_size / 1024 / 1024).toFixed(2) + ' MB',
      limit: (heapStats.heap_size_limit / 1024 / 1024).toFixed(2) + ' MB',
      percentage: ((heapStats.used_heap_size / heapStats.total_heap_size) * 100).toFixed(2) + '%'
    },
    process: {
      rss: (memUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      external: (memUsage.external / 1024 / 1024).toFixed(2) + ' MB'
    }
  };
}

console.log('Initial memory state:');
console.log(util.inspect(getMemoryStats(), { depth: null, colors: true }));

// ============================================================================
// Part 2: Memory Leak Detection
// ============================================================================

console.log('\n\nPart 2: Memory Leak Detection\n');

/**
 * Memory leak detector for VM contexts
 */
class MemoryLeakDetector {
  constructor(options = {}) {
    this.options = {
      sampleInterval: options.sampleInterval || 100, // ms
      leakThreshold: options.leakThreshold || 5, // MB growth
      maxSamples: options.maxSamples || 10,
      ...options
    };

    this.samples = [];
  }

  /**
   * Take memory snapshot
   */
  takeSnapshot() {
    const stats = v8.getHeapStatistics();
    return {
      timestamp: Date.now(),
      used: stats.used_heap_size,
      total: stats.total_heap_size
    };
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    this.samples = [];
    this.interval = setInterval(() => {
      this.samples.push(this.takeSnapshot());

      // Keep only recent samples
      if (this.samples.length > this.options.maxSamples) {
        this.samples.shift();
      }

      // Check for leaks
      if (this.samples.length >= 3) {
        this.checkForLeaks();
      }
    }, this.options.sampleInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Check for memory leaks
   */
  checkForLeaks() {
    if (this.samples.length < 3) return null;

    const recent = this.samples.slice(-3);
    const growth = recent[recent.length - 1].used - recent[0].used;
    const growthMB = growth / 1024 / 1024;

    if (growthMB > this.options.leakThreshold) {
      return {
        detected: true,
        growth: growthMB.toFixed(2) + ' MB',
        duration: recent[recent.length - 1].timestamp - recent[0].timestamp,
        rate: (growthMB / ((recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000)).toFixed(2) + ' MB/s'
      };
    }

    return { detected: false };
  }

  /**
   * Get analysis
   */
  getAnalysis() {
    if (this.samples.length === 0) {
      return { status: 'No data' };
    }

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const growth = last.used - first.used;
    const duration = last.timestamp - first.timestamp;

    return {
      samples: this.samples.length,
      duration: duration + ' ms',
      growth: (growth / 1024 / 1024).toFixed(2) + ' MB',
      rate: ((growth / duration) * 1000 / 1024 / 1024).toFixed(2) + ' MB/s',
      trend: growth > 0 ? 'increasing' : growth < 0 ? 'decreasing' : 'stable'
    };
  }
}

// Test leak detection
console.log('Testing memory leak detection:');
const detector = new MemoryLeakDetector({
  sampleInterval: 50,
  leakThreshold: 1
});

detector.startMonitoring();

// Simulate leak
const context = vm.createContext({ data: [] });
for (let i = 0; i < 100; i++) {
  vm.runInContext('data.push(new Array(10000).fill("leak"))', context);
}

setTimeout(() => {
  detector.stopMonitoring();
  console.log('Leak analysis:');
  console.log(util.inspect(detector.getAnalysis(), { depth: null, colors: true }));
}, 500);

// ============================================================================
// Part 3: Context Memory Management
// ============================================================================

setTimeout(() => {
  console.log('\n\nPart 3: Context Memory Management\n');

  /**
   * Memory-managed VM context
   */
  class ManagedContext {
    constructor(options = {}) {
      this.options = {
        maxMemoryMB: options.maxMemoryMB || 50,
        cleanupInterval: options.cleanupInterval || 1000,
        enableAutoCleanup: options.enableAutoCleanup !== false,
        ...options
      };

      this.context = null;
      this.executionCount = 0;
      this.createdAt = Date.now();
      this.lastCleanup = Date.now();

      this.createContext();

      if (this.options.enableAutoCleanup) {
        this.startAutoCleanup();
      }
    }

    /**
     * Create fresh context
     */
    createContext() {
      this.context = vm.createContext({
        // Provide safe globals
        Math,
        JSON,
        console,
        // Add cleanup helper
        __cleanup: () => this.cleanup()
      });

      this.createdAt = Date.now();
      this.executionCount = 0;
    }

    /**
     * Execute code with memory tracking
     */
    execute(code, timeout = 5000) {
      const beforeMemory = v8.getHeapStatistics().used_heap_size;

      try {
        const result = vm.runInContext(code, this.context, {
          timeout,
          displayErrors: true
        });

        this.executionCount++;

        const afterMemory = v8.getHeapStatistics().used_heap_size;
        const usedMB = (afterMemory - beforeMemory) / 1024 / 1024;

        // Check memory limit
        if (usedMB > this.options.maxMemoryMB) {
          this.cleanup();
          throw new Error(`Memory limit exceeded: ${usedMB.toFixed(2)}MB`);
        }

        return {
          success: true,
          result,
          memory: usedMB.toFixed(2) + ' MB'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }

    /**
     * Cleanup context
     */
    cleanup() {
      console.log('  [Cleanup] Recreating context...');

      // Clear all properties
      for (const key in this.context) {
        delete this.context[key];
      }

      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Create fresh context
      this.createContext();
      this.lastCleanup = Date.now();
    }

    /**
     * Start automatic cleanup
     */
    startAutoCleanup() {
      this.cleanupInterval = setInterval(() => {
        const timeSinceCleanup = Date.now() - this.lastCleanup;
        if (timeSinceCleanup > this.options.cleanupInterval) {
          this.cleanup();
        }
      }, this.options.cleanupInterval);
    }

    /**
     * Stop automatic cleanup
     */
    stopAutoCleanup() {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
    }

    /**
     * Get statistics
     */
    getStats() {
      return {
        executions: this.executionCount,
        age: Date.now() - this.createdAt + ' ms',
        timeSinceCleanup: Date.now() - this.lastCleanup + ' ms'
      };
    }

    /**
     * Destroy context
     */
    destroy() {
      this.stopAutoCleanup();
      this.cleanup();
    }
  }

  // Test managed context
  console.log('Testing managed context:');
  const managed = new ManagedContext({
    maxMemoryMB: 10,
    cleanupInterval: 2000
  });

  // Execute some code
  console.log('Executing code...');
  const result1 = managed.execute('Math.sqrt(16) + Math.pow(2, 3)');
  console.log('  Result:', result1);

  console.log('\nContext stats:');
  console.log(util.inspect(managed.getStats(), { depth: null, colors: true }));

  managed.destroy();
}, 1000);

// ============================================================================
// Part 4: Memory Pool Pattern
// ============================================================================

setTimeout(() => {
  console.log('\n\nPart 4: Memory Pool Pattern\n');

  /**
   * Context pool with memory management
   */
  class ContextPool {
    constructor(options = {}) {
      this.options = {
        poolSize: options.poolSize || 5,
        maxMemoryPerContext: options.maxMemoryPerContext || 50,
        recycleAfter: options.recycleAfter || 100, // executions
        ...options
      };

      this.pool = [];
      this.available = [];
      this.stats = {
        created: 0,
        recycled: 0,
        totalExecutions: 0
      };

      this.initialize();
    }

    /**
     * Initialize pool
     */
    initialize() {
      for (let i = 0; i < this.options.poolSize; i++) {
        const context = this.createContext();
        this.pool.push(context);
        this.available.push(context);
      }
    }

    /**
     * Create new context with metadata
     */
    createContext() {
      const ctx = {
        context: vm.createContext({ Math, JSON, console }),
        executions: 0,
        createdAt: Date.now(),
        totalMemoryUsed: 0
      };

      this.stats.created++;
      return ctx;
    }

    /**
     * Acquire context from pool
     */
    acquire() {
      if (this.available.length === 0) {
        console.log('  [Pool] No available contexts, creating new one');
        return this.createContext();
      }

      const ctx = this.available.pop();

      // Check if context needs recycling
      if (ctx.executions >= this.options.recycleAfter) {
        console.log('  [Pool] Recycling context (executions:', ctx.executions, ')');
        this.recycleContext(ctx);
      }

      return ctx;
    }

    /**
     * Release context back to pool
     */
    release(ctx) {
      this.available.push(ctx);
    }

    /**
     * Recycle context
     */
    recycleContext(ctx) {
      // Clear all properties
      for (const key in ctx.context) {
        delete ctx.context[key];
      }

      // Recreate context
      ctx.context = vm.createContext({ Math, JSON, console });
      ctx.executions = 0;
      ctx.createdAt = Date.now();
      ctx.totalMemoryUsed = 0;

      this.stats.recycled++;

      // Force GC if available
      if (global.gc) {
        global.gc();
      }
    }

    /**
     * Execute code using pool
     */
    execute(code, timeout = 5000) {
      const ctx = this.acquire();
      const beforeMemory = v8.getHeapStatistics().used_heap_size;

      try {
        const result = vm.runInContext(code, ctx.context, {
          timeout,
          displayErrors: true
        });

        const afterMemory = v8.getHeapStatistics().used_heap_size;
        const memoryUsed = afterMemory - beforeMemory;

        ctx.executions++;
        ctx.totalMemoryUsed += memoryUsed;
        this.stats.totalExecutions++;

        return {
          success: true,
          result,
          poolStats: this.getStats()
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      } finally {
        this.release(ctx);
      }
    }

    /**
     * Get pool statistics
     */
    getStats() {
      return {
        poolSize: this.pool.length,
        available: this.available.length,
        inUse: this.pool.length - this.available.length,
        created: this.stats.created,
        recycled: this.stats.recycled,
        totalExecutions: this.stats.totalExecutions,
        avgExecutionsPerContext: (this.stats.totalExecutions / this.pool.length).toFixed(2)
      };
    }

    /**
     * Cleanup entire pool
     */
    cleanup() {
      this.pool.forEach(ctx => this.recycleContext(ctx));
      this.available = [...this.pool];
    }

    /**
     * Destroy pool
     */
    destroy() {
      this.pool.forEach(ctx => {
        for (const key in ctx.context) {
          delete ctx.context[key];
        }
      });
      this.pool = [];
      this.available = [];
    }
  }

  // Test context pool
  console.log('Testing context pool:');
  const pool = new ContextPool({
    poolSize: 3,
    recycleAfter: 5
  });

  console.log('Executing multiple operations...');
  for (let i = 0; i < 10; i++) {
    const result = pool.execute(`Math.pow(2, ${i})`);
    if (i % 3 === 0) {
      console.log(`  Execution ${i + 1}:`, result.result);
    }
  }

  console.log('\nPool statistics:');
  console.log(util.inspect(pool.getStats(), { depth: null, colors: true }));

  pool.destroy();
}, 2000);

// ============================================================================
// Part 5: Heap Snapshot Analysis
// ============================================================================

setTimeout(() => {
  console.log('\n\nPart 5: Heap Snapshot Analysis\n');

  /**
   * Heap snapshot analyzer
   */
  class HeapAnalyzer {
    constructor() {
      this.snapshots = [];
    }

    /**
     * Take heap snapshot
     */
    takeSnapshot(label = 'snapshot') {
      const stats = v8.getHeapStatistics();
      const spaces = v8.getHeapSpaceStatistics();

      const snapshot = {
        label,
        timestamp: Date.now(),
        heap: {
          total: stats.total_heap_size,
          used: stats.used_heap_size,
          limit: stats.heap_size_limit,
          available: stats.total_available_size
        },
        spaces: spaces.map(s => ({
          name: s.space_name,
          size: s.space_size,
          used: s.space_used_size,
          available: s.space_available_size
        }))
      };

      this.snapshots.push(snapshot);
      return snapshot;
    }

    /**
     * Compare snapshots
     */
    compareSnapshots(index1 = 0, index2 = -1) {
      if (this.snapshots.length < 2) {
        return { error: 'Need at least 2 snapshots' };
      }

      const snap1 = this.snapshots[index1];
      const snap2 = this.snapshots[index2 === -1 ? this.snapshots.length - 1 : index2];

      return {
        from: snap1.label,
        to: snap2.label,
        duration: snap2.timestamp - snap1.timestamp + ' ms',
        heapGrowth: {
          total: ((snap2.heap.total - snap1.heap.total) / 1024 / 1024).toFixed(2) + ' MB',
          used: ((snap2.heap.used - snap1.heap.used) / 1024 / 1024).toFixed(2) + ' MB'
        },
        percentageGrowth: {
          total: (((snap2.heap.total - snap1.heap.total) / snap1.heap.total) * 100).toFixed(2) + '%',
          used: (((snap2.heap.used - snap1.heap.used) / snap1.heap.used) * 100).toFixed(2) + '%'
        }
      };
    }

    /**
     * Get memory trend
     */
    getTrend() {
      if (this.snapshots.length < 2) {
        return { status: 'Insufficient data' };
      }

      const usagePoints = this.snapshots.map(s => s.heap.used);
      const trend = usagePoints[usagePoints.length - 1] - usagePoints[0];

      return {
        snapshots: this.snapshots.length,
        trend: trend > 0 ? 'Growing' : trend < 0 ? 'Shrinking' : 'Stable',
        totalGrowth: (trend / 1024 / 1024).toFixed(2) + ' MB',
        averagePerSnapshot: (trend / this.snapshots.length / 1024 / 1024).toFixed(2) + ' MB'
      };
    }

    /**
     * Clear snapshots
     */
    clear() {
      this.snapshots = [];
    }
  }

  // Test heap analyzer
  console.log('Testing heap snapshot analyzer:');
  const analyzer = new HeapAnalyzer();

  analyzer.takeSnapshot('Before allocations');

  // Allocate memory
  const arrays = [];
  for (let i = 0; i < 50; i++) {
    arrays.push(new Array(10000).fill('data'));
  }

  analyzer.takeSnapshot('After allocations');

  // Free memory
  arrays.length = 0;
  if (global.gc) global.gc();

  analyzer.takeSnapshot('After cleanup');

  console.log('\nSnapshot comparison:');
  console.log(util.inspect(analyzer.compareSnapshots(0, 1), { depth: null, colors: true }));

  console.log('\nMemory trend:');
  console.log(util.inspect(analyzer.getTrend(), { depth: null, colors: true }));
}, 3000);

// ============================================================================
// Summary
// ============================================================================

setTimeout(() => {
  console.log('\n\n=== Summary: Memory Management ===\n');

  console.log('Key Techniques:');
  console.log('✓ Memory monitoring and leak detection');
  console.log('✓ Managed contexts with automatic cleanup');
  console.log('✓ Context pooling for efficiency');
  console.log('✓ Heap snapshot analysis');
  console.log('✓ Memory limit enforcement');
  console.log('✓ Resource recycling');

  console.log('\nBest Practices:');
  console.log('• Monitor memory continuously');
  console.log('• Set and enforce memory limits');
  console.log('• Use context pooling for high throughput');
  console.log('• Regular cleanup and GC triggers');
  console.log('• Analyze heap snapshots for leaks');
  console.log('• Recycle contexts after N executions');
  console.log('• Track memory usage per execution');
}, 4000);
