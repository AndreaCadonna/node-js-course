/**
 * Example 8: VM Performance Optimization Patterns
 *
 * This example demonstrates performance optimization techniques for VM usage
 * including context pooling, script caching, execution profiling, and
 * various optimization strategies.
 *
 * Topics covered:
 * - Context pooling implementation
 * - Script cache optimization
 * - Performance profiling
 * - Benchmark comparisons
 * - Memory optimization
 * - Execution optimization
 */

const vm = require('vm');
const { performance } = require('perf_hooks');
const v8 = require('v8');

// ============================================================================
// 1. Context Creation Overhead
// ============================================================================

console.log('=== 1. Context Creation Overhead ===\n');

/**
 * Measure context creation cost
 */
function measureContextCreation() {
  const iterations = 1000;

  // Benchmark: Creating contexts
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const ctx = vm.createContext({ x: i });
  }
  const duration = performance.now() - start;

  console.log(`Creating ${iterations} contexts: ${duration.toFixed(2)}ms`);
  console.log(`Average per context: ${(duration / iterations).toFixed(3)}ms`);
  console.log();
}

measureContextCreation();

// ============================================================================
// 2. Context Pool Implementation
// ============================================================================

console.log('=== 2. Context Pool Implementation ===\n');

/**
 * Context pool for reusing VM contexts
 */
class ContextPool {
  constructor(size = 10) {
    this.size = size;
    this.available = [];
    this.inUse = new Set();

    // Pre-create contexts
    for (let i = 0; i < size; i++) {
      this.available.push(vm.createContext({}));
    }

    this.stats = {
      hits: 0,
      misses: 0,
      created: size
    };
  }

  /**
   * Acquire a context from the pool
   */
  acquire() {
    let context;

    if (this.available.length > 0) {
      context = this.available.pop();
      this.stats.hits++;
    } else {
      // Pool exhausted, create new context
      context = vm.createContext({});
      this.stats.misses++;
      this.stats.created++;
    }

    this.inUse.add(context);
    return context;
  }

  /**
   * Release a context back to the pool
   */
  release(context) {
    if (!this.inUse.has(context)) {
      return;
    }

    // Clear context properties
    for (const key in context) {
      delete context[key];
    }

    this.inUse.delete(context);

    // Add back to pool if not over size
    if (this.available.length < this.size) {
      this.available.push(context);
    }
  }

  /**
   * Execute code using pooled context
   */
  execute(code, data = {}) {
    const context = this.acquire();

    try {
      // Add data to context
      Object.assign(context, data);

      return vm.runInContext(code, context);
    } finally {
      this.release(context);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      ...this.stats,
      available: this.available.length,
      inUse: this.inUse.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }
}

// Demo context pool
const pool = new ContextPool(5);

console.log('Executing 10 operations with pool of 5:');
for (let i = 0; i < 10; i++) {
  pool.execute('result = x * 2', { x: i, result: 0 });
}

console.log('Pool stats:', pool.getStats());
console.log();

// ============================================================================
// 3. Script Caching Performance
// ============================================================================

console.log('=== 3. Script Caching Performance ===\n');

/**
 * Compare performance with and without caching
 */
function compareScriptCaching() {
  const code = 'result = Math.sqrt(x * x + y * y)';
  const iterations = 1000;

  // Without caching
  const ctx1 = vm.createContext({ x: 0, y: 0, result: 0, Math });
  const start1 = performance.now();

  for (let i = 0; i < iterations; i++) {
    ctx1.x = i;
    ctx1.y = i;
    const script = new vm.Script(code); // Compile each time
    script.runInContext(ctx1);
  }

  const time1 = performance.now() - start1;

  // With caching
  const ctx2 = vm.createContext({ x: 0, y: 0, result: 0, Math });
  const cachedScript = new vm.Script(code); // Compile once
  const start2 = performance.now();

  for (let i = 0; i < iterations; i++) {
    ctx2.x = i;
    ctx2.y = i;
    cachedScript.runInContext(ctx2);
  }

  const time2 = performance.now() - start2;

  console.log(`${iterations} iterations:`);
  console.log(`  Without caching: ${time1.toFixed(2)}ms`);
  console.log(`  With caching:    ${time2.toFixed(2)}ms`);
  console.log(`  Speedup:         ${(time1 / time2).toFixed(2)}x`);
  console.log();
}

compareScriptCaching();

// ============================================================================
// 4. Combined Optimization
// ============================================================================

console.log('=== 4. Combined Optimization (Pool + Cache) ===\n');

/**
 * Optimized executor combining pool and cache
 */
class OptimizedExecutor {
  constructor(options = {}) {
    this.pool = new ContextPool(options.poolSize || 10);
    this.scriptCache = new Map();
    this.maxCacheSize = options.maxCacheSize || 100;

    this.stats = {
      executions: 0,
      scriptHits: 0,
      scriptMisses: 0
    };
  }

  /**
   * Get or compile script
   */
  getScript(code) {
    if (this.scriptCache.has(code)) {
      this.stats.scriptHits++;
      return this.scriptCache.get(code);
    }

    this.stats.scriptMisses++;
    const script = new vm.Script(code);

    // Add to cache with LRU eviction
    if (this.scriptCache.size >= this.maxCacheSize) {
      const firstKey = this.scriptCache.keys().next().value;
      this.scriptCache.delete(firstKey);
    }

    this.scriptCache.set(code, script);
    return script;
  }

  /**
   * Execute code with optimizations
   */
  execute(code, data = {}) {
    this.stats.executions++;

    const context = this.pool.acquire();
    const script = this.getScript(code);

    try {
      Object.assign(context, data);
      return script.runInContext(context);
    } finally {
      this.pool.release(context);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      poolStats: this.pool.getStats(),
      cacheSize: this.scriptCache.size,
      scriptHitRate: this.stats.scriptHits / (this.stats.scriptHits + this.stats.scriptMisses) || 0
    };
  }
}

// Benchmark optimized executor
function benchmarkOptimized() {
  const executor = new OptimizedExecutor({ poolSize: 5 });

  const codes = [
    'result = x + y',
    'result = x * y',
    'result = Math.sqrt(x)',
    'result = Math.pow(x, y)',
    'result = x / y'
  ];

  const iterations = 1000;
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    const code = codes[i % codes.length];
    executor.execute(code, { x: i, y: i + 1, result: 0, Math });
  }

  const duration = performance.now() - start;

  console.log(`${iterations} executions: ${duration.toFixed(2)}ms`);
  console.log('Stats:', JSON.stringify(executor.getStats(), null, 2));
  console.log();
}

benchmarkOptimized();

// ============================================================================
// 5. Memory Optimization
// ============================================================================

console.log('=== 5. Memory Optimization ===\n');

/**
 * Memory-efficient executor
 */
class MemoryEfficientExecutor {
  constructor() {
    this.contextPool = [];
    this.maxPoolSize = 5;
  }

  execute(code, data) {
    // Reuse context or create new one
    let context = this.contextPool.pop();

    if (!context) {
      context = vm.createContext({});
    }

    try {
      // Clear previous data
      for (const key in context) {
        delete context[key];
      }

      // Add new data
      Object.assign(context, data);

      // Execute
      return vm.runInContext(code, context);
    } finally {
      // Return to pool if under limit
      if (this.contextPool.length < this.maxPoolSize) {
        this.contextPool.push(context);
      }
    }
  }

  getMemoryUsage() {
    const heapStats = v8.getHeapStatistics();
    return {
      heapUsed: (heapStats.used_heap_size / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (heapStats.total_heap_size / 1024 / 1024).toFixed(2) + ' MB',
      poolSize: this.contextPool.length
    };
  }
}

// Demo memory efficiency
const memExecutor = new MemoryEfficientExecutor();

console.log('Initial memory:', memExecutor.getMemoryUsage());

// Execute many operations
for (let i = 0; i < 100; i++) {
  memExecutor.execute('result = x * 2', { x: i });
}

console.log('After 100 executions:', memExecutor.getMemoryUsage());
console.log();

// ============================================================================
// 6. Execution Profiling
// ============================================================================

console.log('=== 6. Execution Profiling ===\n');

/**
 * Executor with detailed profiling
 */
class ProfiledExecutor {
  constructor() {
    this.profiles = [];
  }

  execute(code, data = {}, label = 'unnamed') {
    const profile = {
      label,
      codeLength: code.length,
      dataSize: Object.keys(data).length
    };

    // Measure compilation
    const compileStart = performance.now();
    const script = new vm.Script(code);
    profile.compileTime = performance.now() - compileStart;

    // Measure context creation
    const contextStart = performance.now();
    const context = vm.createContext(data);
    profile.contextTime = performance.now() - contextStart;

    // Measure execution
    const execStart = performance.now();
    const result = script.runInContext(context);
    profile.execTime = performance.now() - execStart;

    // Total time
    profile.totalTime = performance.now() - compileStart;

    this.profiles.push(profile);
    return { result, profile };
  }

  getReport() {
    if (this.profiles.length === 0) {
      return 'No profiles recorded';
    }

    const avg = (arr, key) =>
      arr.reduce((sum, p) => sum + p[key], 0) / arr.length;

    return {
      count: this.profiles.length,
      averages: {
        compile: avg(this.profiles, 'compileTime').toFixed(3) + 'ms',
        context: avg(this.profiles, 'contextTime').toFixed(3) + 'ms',
        exec: avg(this.profiles, 'execTime').toFixed(3) + 'ms',
        total: avg(this.profiles, 'totalTime').toFixed(3) + 'ms'
      },
      breakdown: this.profiles.map(p => ({
        label: p.label,
        compile: p.compileTime.toFixed(3) + 'ms',
        exec: p.execTime.toFixed(3) + 'ms'
      }))
    };
  }
}

// Demo profiling
const profiler = new ProfiledExecutor();

profiler.execute('x + y', { x: 10, y: 20 }, 'simple-add');
profiler.execute('Math.sqrt(x * x + y * y)', { x: 3, y: 4, Math }, 'distance');
profiler.execute(
  'arr.reduce((sum, n) => sum + n, 0)',
  { arr: [1, 2, 3, 4, 5] },
  'array-sum'
);

console.log('Profiling report:');
console.log(JSON.stringify(profiler.getReport(), null, 2));
console.log();

// ============================================================================
// 7. Batch Execution Optimization
// ============================================================================

console.log('=== 7. Batch Execution Optimization ===\n');

/**
 * Optimize execution of multiple scripts
 */
class BatchExecutor {
  constructor() {
    this.context = vm.createContext({ Math, JSON });
  }

  /**
   * Execute multiple scripts in same context
   */
  executeBatch(scripts) {
    const results = [];

    for (const { code, data = {} } of scripts) {
      // Add data to context
      Object.assign(this.context, data);

      try {
        const result = vm.runInContext(code, this.context);
        results.push({ success: true, result });
      } catch (err) {
        results.push({ success: false, error: err.message });
      }

      // Clear data (keep built-ins)
      for (const key of Object.keys(data)) {
        delete this.context[key];
      }
    }

    return results;
  }
}

// Compare individual vs batch execution
function compareBatchExecution() {
  const scripts = Array.from({ length: 100 }, (_, i) => ({
    code: 'result = x * 2',
    data: { x: i, result: 0 }
  }));

  // Individual execution
  const start1 = performance.now();
  for (const { code, data } of scripts) {
    const ctx = vm.createContext(data);
    vm.runInContext(code, ctx);
  }
  const time1 = performance.now() - start1;

  // Batch execution
  const batchExecutor = new BatchExecutor();
  const start2 = performance.now();
  batchExecutor.executeBatch(scripts);
  const time2 = performance.now() - start2;

  console.log('100 script executions:');
  console.log(`  Individual: ${time1.toFixed(2)}ms`);
  console.log(`  Batch:      ${time2.toFixed(2)}ms`);
  console.log(`  Speedup:    ${(time1 / time2).toFixed(2)}x`);
  console.log();
}

compareBatchExecution();

// ============================================================================
// 8. Complete Performance Comparison
// ============================================================================

console.log('=== 8. Complete Performance Comparison ===\n');

/**
 * Compare all optimization strategies
 */
function completeComparison() {
  const iterations = 500;
  const code = 'result = Math.sqrt(x * x + y * y)';

  console.log(`Benchmarking ${iterations} executions:\n`);

  // 1. Naive approach
  const start1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    const ctx = vm.createContext({ x: i, y: i, result: 0, Math });
    vm.runInContext(code, ctx);
  }
  const time1 = performance.now() - start1;
  console.log(`1. Naive (new context + compile each time): ${time1.toFixed(2)}ms`);

  // 2. Script caching only
  const script = new vm.Script(code);
  const start2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    const ctx = vm.createContext({ x: i, y: i, result: 0, Math });
    script.runInContext(ctx);
  }
  const time2 = performance.now() - start2;
  console.log(`2. Script caching only:                     ${time2.toFixed(2)}ms (${(time1/time2).toFixed(2)}x)`);

  // 3. Context pooling only
  const pool = new ContextPool(10);
  const start3 = performance.now();
  for (let i = 0; i < iterations; i++) {
    pool.execute(code, { x: i, y: i, result: 0, Math });
  }
  const time3 = performance.now() - start3;
  console.log(`3. Context pooling only:                    ${time3.toFixed(2)}ms (${(time1/time3).toFixed(2)}x)`);

  // 4. Both optimizations
  const optimized = new OptimizedExecutor({ poolSize: 10 });
  const start4 = performance.now();
  for (let i = 0; i < iterations; i++) {
    optimized.execute(code, { x: i, y: i, result: 0, Math });
  }
  const time4 = performance.now() - start4;
  console.log(`4. Both (pool + cache):                     ${time4.toFixed(2)}ms (${(time1/time4).toFixed(2)}x)`);

  // 5. Reuse single context (fastest but least safe)
  const singleCtx = vm.createContext({ x: 0, y: 0, result: 0, Math });
  const singleScript = new vm.Script(code);
  const start5 = performance.now();
  for (let i = 0; i < iterations; i++) {
    singleCtx.x = i;
    singleCtx.y = i;
    singleScript.runInContext(singleCtx);
  }
  const time5 = performance.now() - start5;
  console.log(`5. Single context reuse (best performance): ${time5.toFixed(2)}ms (${(time1/time5).toFixed(2)}x)`);

  console.log();
  console.log('Summary:');
  console.log('  - Script caching provides major speedup');
  console.log('  - Context pooling helps when creating many contexts');
  console.log('  - Combining both gives best practical performance');
  console.log('  - Single context reuse is fastest but least isolated');
}

completeComparison();
console.log();

// ============================================================================
// Key Takeaways
// ============================================================================

console.log('=== Key Takeaways ===\n');
console.log('1. Context creation is expensive - use pooling for high throughput');
console.log('2. Script compilation is expensive - cache compiled scripts');
console.log('3. Combining pool + cache gives best practical performance');
console.log('4. Profile your specific use case to identify bottlenecks');
console.log('5. Clear context data between uses to prevent leaks');
console.log('6. Batch execution can reduce overhead for multiple scripts');
console.log('7. Balance performance with security/isolation needs');
console.log('8. Monitor memory usage with v8.getHeapStatistics()');
console.log();

console.log('Run this example with: node 08-performance-patterns.js');
