/**
 * Example 6: Resource Monitoring and Enforcement
 *
 * This example demonstrates:
 * - Real-time CPU monitoring
 * - Memory usage tracking
 * - Execution time limits
 * - Resource quotas and enforcement
 * - Performance profiling
 */

const vm = require('vm');
const v8 = require('v8');
const { performance } = require('perf_hooks');

console.log('=== Resource Monitoring and Enforcement ===\n');

// ============================================================================
// Part 1: CPU Time Monitoring
// ============================================================================

console.log('Part 1: CPU Time Monitoring\n');

/**
 * CPU time monitor for VM execution
 */
class CPUMonitor {
  constructor(options = {}) {
    this.options = {
      maxCPUTime: options.maxCPUTime || 1000, // ms
      sampleInterval: options.sampleInterval || 100,
      ...options
    };

    this.measurements = [];
  }

  /**
   * Measure CPU time for execution
   */
  measure(fn) {
    const start = performance.now();
    const startCPU = process.cpuUsage();

    try {
      const result = fn();
      const end = performance.now();
      const endCPU = process.cpuUsage(startCPU);

      const measurement = {
        wallTime: end - start,
        cpuTime: (endCPU.user + endCPU.system) / 1000, // Convert to ms
        userTime: endCPU.user / 1000,
        systemTime: endCPU.system / 1000
      };

      this.measurements.push(measurement);

      return {
        success: true,
        result,
        ...measurement
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute with CPU limit
   */
  executeWithLimit(code, context, timeout) {
    const start = performance.now();
    const startCPU = process.cpuUsage();

    const checkInterval = setInterval(() => {
      const current = process.cpuUsage(startCPU);
      const cpuTime = (current.user + current.system) / 1000;

      if (cpuTime > this.options.maxCPUTime) {
        clearInterval(checkInterval);
        throw new Error(`CPU time limit exceeded: ${cpuTime.toFixed(2)}ms`);
      }
    }, this.options.sampleInterval);

    try {
      const result = vm.runInContext(code, context, {
        timeout,
        displayErrors: true
      });

      clearInterval(checkInterval);

      const end = performance.now();
      const endCPU = process.cpuUsage(startCPU);

      return {
        success: true,
        result,
        wallTime: end - start,
        cpuTime: (endCPU.user + endCPU.system) / 1000
      };
    } catch (error) {
      clearInterval(checkInterval);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    if (this.measurements.length === 0) {
      return { message: 'No measurements' };
    }

    const totalCPU = this.measurements.reduce((sum, m) => sum + m.cpuTime, 0);
    const avgCPU = totalCPU / this.measurements.length;

    return {
      measurements: this.measurements.length,
      totalCPUTime: totalCPU.toFixed(2) + 'ms',
      avgCPUTime: avgCPU.toFixed(2) + 'ms',
      maxCPUTime: Math.max(...this.measurements.map(m => m.cpuTime)).toFixed(2) + 'ms'
    };
  }
}

// Test CPU monitor
console.log('Testing CPU monitor:');
const cpuMonitor = new CPUMonitor({ maxCPUTime: 500 });

const context1 = vm.createContext({ result: 0 });
const measurement = cpuMonitor.measure(() => {
  return vm.runInContext('for(let i = 0; i < 1000000; i++) { result += i }; result', context1);
});

console.log('Measurement results:');
console.log('  Wall time:', measurement.wallTime.toFixed(2), 'ms');
console.log('  CPU time:', measurement.cpuTime.toFixed(2), 'ms');
console.log('  User time:', measurement.userTime.toFixed(2), 'ms');
console.log('  System time:', measurement.systemTime.toFixed(2), 'ms');

// ============================================================================
// Part 2: Memory Usage Tracking
// ============================================================================

console.log('\n\nPart 2: Memory Usage Tracking\n');

/**
 * Memory usage tracker
 */
class MemoryTracker {
  constructor(options = {}) {
    this.options = {
      maxMemoryMB: options.maxMemoryMB || 50,
      trackInterval: options.trackInterval || 100,
      ...options
    };

    this.snapshots = [];
    this.tracking = false;
  }

  /**
   * Take memory snapshot
   */
  snapshot() {
    const heap = v8.getHeapStatistics();
    const mem = process.memoryUsage();

    return {
      timestamp: Date.now(),
      heap: {
        total: heap.total_heap_size,
        used: heap.used_heap_size,
        limit: heap.heap_size_limit
      },
      process: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        external: mem.external
      }
    };
  }

  /**
   * Start tracking
   */
  startTracking() {
    this.snapshots = [];
    this.tracking = true;
    this.interval = setInterval(() => {
      if (this.tracking) {
        this.snapshots.push(this.snapshot());
      }
    }, this.options.trackInterval);
  }

  /**
   * Stop tracking
   */
  stopTracking() {
    this.tracking = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Execute with memory tracking
   */
  executeWithTracking(code, context, timeout = 5000) {
    this.startTracking();
    const before = this.snapshot();

    try {
      const result = vm.runInContext(code, context, {
        timeout,
        displayErrors: true
      });

      this.stopTracking();
      const after = this.snapshot();

      const memoryUsed = {
        heap: (after.heap.used - before.heap.used) / 1024 / 1024,
        rss: (after.process.rss - before.process.rss) / 1024 / 1024
      };

      // Check limit
      if (memoryUsed.heap > this.options.maxMemoryMB) {
        throw new Error(`Memory limit exceeded: ${memoryUsed.heap.toFixed(2)}MB`);
      }

      return {
        success: true,
        result,
        memory: {
          heapMB: memoryUsed.heap.toFixed(2),
          rssMB: memoryUsed.rss.toFixed(2)
        },
        snapshots: this.snapshots.length
      };
    } catch (error) {
      this.stopTracking();
      throw error;
    }
  }

  /**
   * Analyze memory usage
   */
  analyze() {
    if (this.snapshots.length < 2) {
      return { message: 'Insufficient data' };
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    const peak = this.snapshots.reduce((max, snap) =>
      snap.heap.used > max.heap.used ? snap : max
    );

    return {
      duration: last.timestamp - first.timestamp + 'ms',
      snapshots: this.snapshots.length,
      growth: {
        heap: ((last.heap.used - first.heap.used) / 1024 / 1024).toFixed(2) + 'MB',
        rss: ((last.process.rss - first.process.rss) / 1024 / 1024).toFixed(2) + 'MB'
      },
      peak: {
        heap: (peak.heap.used / 1024 / 1024).toFixed(2) + 'MB',
        rss: (peak.process.rss / 1024 / 1024).toFixed(2) + 'MB'
      }
    };
  }
}

// Test memory tracker
console.log('Testing memory tracker:');
const memTracker = new MemoryTracker({ maxMemoryMB: 10 });

const context2 = vm.createContext({ arrays: [] });
try {
  const result = memTracker.executeWithTracking(
    'for(let i = 0; i < 100; i++) arrays.push(new Array(1000).fill(i))',
    context2
  );
  console.log('Execution successful:');
  console.log('  Heap usage:', result.memory.heapMB, 'MB');
  console.log('  RSS usage:', result.memory.rssMB, 'MB');
  console.log('  Snapshots taken:', result.snapshots);
} catch (err) {
  console.log('Error:', err.message);
}

console.log('\nMemory analysis:');
const analysis = memTracker.analyze();
Object.entries(analysis).forEach(([key, value]) => {
  console.log(`  ${key}:`, typeof value === 'object' ? JSON.stringify(value) : value);
});

// ============================================================================
// Part 3: Resource Quota System
// ============================================================================

console.log('\n\nPart 3: Resource Quota System\n');

/**
 * Resource quota enforcer
 */
class ResourceQuota {
  constructor(quotas = {}) {
    this.quotas = {
      maxCPUTime: quotas.maxCPUTime || 1000,
      maxMemory: quotas.maxMemory || 50 * 1024 * 1024,
      maxExecutionTime: quotas.maxExecutionTime || 5000,
      maxExecutionsPerMinute: quotas.maxExecutionsPerMinute || 60,
      ...quotas
    };

    this.usage = {
      cpuTime: 0,
      memory: 0,
      executions: [],
      violations: []
    };
  }

  /**
   * Check if execution is allowed
   */
  canExecute() {
    // Check rate limit
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentExecutions = this.usage.executions.filter(t => t > oneMinuteAgo);

    if (recentExecutions.length >= this.quotas.maxExecutionsPerMinute) {
      this.recordViolation('rate_limit', 'Execution rate limit exceeded');
      return false;
    }

    return true;
  }

  /**
   * Execute with quota enforcement
   */
  execute(code, context) {
    if (!this.canExecute()) {
      throw new Error('Resource quota exceeded: too many executions');
    }

    const startTime = performance.now();
    const startCPU = process.cpuUsage();
    const startMemory = v8.getHeapStatistics().used_heap_size;

    try {
      const result = vm.runInContext(code, context, {
        timeout: this.quotas.maxExecutionTime,
        displayErrors: true
      });

      const endTime = performance.now();
      const endCPU = process.cpuUsage(startCPU);
      const endMemory = v8.getHeapStatistics().used_heap_size;

      const cpuTime = (endCPU.user + endCPU.system) / 1000;
      const memoryUsed = endMemory - startMemory;
      const executionTime = endTime - startTime;

      // Check quotas
      if (cpuTime > this.quotas.maxCPUTime) {
        this.recordViolation('cpu_time', `CPU time ${cpuTime.toFixed(2)}ms exceeded limit`);
      }

      if (memoryUsed > this.quotas.maxMemory) {
        this.recordViolation('memory', `Memory ${(memoryUsed / 1024 / 1024).toFixed(2)}MB exceeded limit`);
      }

      // Record usage
      this.usage.cpuTime += cpuTime;
      this.usage.memory = Math.max(this.usage.memory, memoryUsed);
      this.usage.executions.push(Date.now());

      return {
        success: true,
        result,
        resources: {
          cpuTime: cpuTime.toFixed(2) + 'ms',
          memory: (memoryUsed / 1024 / 1024).toFixed(2) + 'MB',
          executionTime: executionTime.toFixed(2) + 'ms'
        }
      };
    } catch (error) {
      this.usage.executions.push(Date.now());
      throw error;
    }
  }

  /**
   * Record quota violation
   */
  recordViolation(type, message) {
    this.usage.violations.push({
      timestamp: new Date().toISOString(),
      type,
      message
    });
  }

  /**
   * Get usage statistics
   */
  getUsage() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentExecutions = this.usage.executions.filter(t => t > oneMinuteAgo).length;

    return {
      totalCPUTime: this.usage.cpuTime.toFixed(2) + 'ms',
      peakMemory: (this.usage.memory / 1024 / 1024).toFixed(2) + 'MB',
      totalExecutions: this.usage.executions.length,
      executionsLastMinute: recentExecutions,
      violations: this.usage.violations.length,
      quotaStatus: {
        cpuTime: `${this.usage.cpuTime.toFixed(0)}/${this.quotas.maxCPUTime}ms`,
        executionsPerMinute: `${recentExecutions}/${this.quotas.maxExecutionsPerMinute}`
      }
    };
  }

  /**
   * Reset usage tracking
   */
  reset() {
    this.usage = {
      cpuTime: 0,
      memory: 0,
      executions: [],
      violations: []
    };
  }
}

// Test resource quota
console.log('Testing resource quota system:');
const quota = new ResourceQuota({
  maxCPUTime: 500,
  maxMemory: 10 * 1024 * 1024,
  maxExecutionsPerMinute: 5
});

const context3 = vm.createContext({ sum: 0 });

console.log('Executing within quotas:');
for (let i = 0; i < 3; i++) {
  try {
    const result = quota.execute('for(let i = 0; i < 10000; i++) sum += i; sum', context3);
    console.log(`  Execution ${i + 1}:`, result.resources.cpuTime);
  } catch (err) {
    console.log(`  Execution ${i + 1} failed:`, err.message);
  }
}

console.log('\nQuota usage:');
const usage = quota.getUsage();
Object.entries(usage).forEach(([key, value]) => {
  console.log(`  ${key}:`, typeof value === 'object' ? JSON.stringify(value) : value);
});

// ============================================================================
// Part 4: Performance Profiler
// ============================================================================

console.log('\n\nPart 4: Performance Profiler\n');

/**
 * VM execution profiler
 */
class ExecutionProfiler {
  constructor() {
    this.profiles = [];
  }

  /**
   * Profile code execution
   */
  profile(code, context, iterations = 1) {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const startCPU = process.cpuUsage();
      const startMemory = v8.getHeapStatistics().used_heap_size;

      try {
        const result = vm.runInContext(code, context, {
          timeout: 10000,
          displayErrors: true
        });

        const endTime = performance.now();
        const endCPU = process.cpuUsage(startCPU);
        const endMemory = v8.getHeapStatistics().used_heap_size;

        results.push({
          iteration: i + 1,
          success: true,
          wallTime: endTime - startTime,
          cpuTime: (endCPU.user + endCPU.system) / 1000,
          memory: endMemory - startMemory,
          result
        });
      } catch (error) {
        results.push({
          iteration: i + 1,
          success: false,
          error: error.message
        });
      }
    }

    const profile = this.analyzeResults(code, results);
    this.profiles.push(profile);
    return profile;
  }

  /**
   * Analyze profile results
   */
  analyzeResults(code, results) {
    const successful = results.filter(r => r.success);

    if (successful.length === 0) {
      return {
        code: code.substring(0, 50),
        iterations: results.length,
        success: false,
        errors: results.map(r => r.error)
      };
    }

    const wallTimes = successful.map(r => r.wallTime);
    const cpuTimes = successful.map(r => r.cpuTime);
    const memories = successful.map(r => r.memory);

    return {
      code: code.substring(0, 50),
      iterations: results.length,
      successful: successful.length,
      wallTime: {
        min: Math.min(...wallTimes).toFixed(2) + 'ms',
        max: Math.max(...wallTimes).toFixed(2) + 'ms',
        avg: (wallTimes.reduce((a, b) => a + b) / wallTimes.length).toFixed(2) + 'ms',
        median: this.median(wallTimes).toFixed(2) + 'ms'
      },
      cpuTime: {
        min: Math.min(...cpuTimes).toFixed(2) + 'ms',
        max: Math.max(...cpuTimes).toFixed(2) + 'ms',
        avg: (cpuTimes.reduce((a, b) => a + b) / cpuTimes.length).toFixed(2) + 'ms'
      },
      memory: {
        min: (Math.min(...memories) / 1024).toFixed(2) + 'KB',
        max: (Math.max(...memories) / 1024).toFixed(2) + 'KB',
        avg: (memories.reduce((a, b) => a + b) / memories.length / 1024).toFixed(2) + 'KB'
      }
    };
  }

  /**
   * Calculate median
   */
  median(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Get all profiles
   */
  getProfiles() {
    return this.profiles;
  }
}

// Test profiler
console.log('Testing execution profiler:');
const profiler = new ExecutionProfiler();

const context4 = vm.createContext({ Math });

console.log('Profiling Math.pow...');
const profile1 = profiler.profile('Math.pow(2, 20)', context4, 10);
console.log('Wall time:', profile1.wallTime.avg);
console.log('CPU time:', profile1.cpuTime.avg);
console.log('Memory:', profile1.memory.avg);

console.log('\nProfiling array operations...');
const profile2 = profiler.profile(
  'new Array(1000).fill(0).map((_, i) => i * 2)',
  context4,
  10
);
console.log('Wall time:', profile2.wallTime.avg);
console.log('CPU time:', profile2.cpuTime.avg);
console.log('Memory:', profile2.memory.avg);

// ============================================================================
// Part 5: Complete Resource Monitor
// ============================================================================

console.log('\n\nPart 5: Complete Resource Monitor\n');

/**
 * Complete resource monitoring system
 */
class ResourceMonitor {
  constructor(options = {}) {
    this.cpuMonitor = new CPUMonitor(options);
    this.memoryTracker = new MemoryTracker(options);
    this.quota = new ResourceQuota(options.quotas);
    this.profiler = new ExecutionProfiler();
  }

  /**
   * Execute with full monitoring
   */
  async execute(code, context, timeout = 5000) {
    // Check quota
    if (!this.quota.canExecute()) {
      throw new Error('Resource quota exceeded');
    }

    // Start tracking
    this.memoryTracker.startTracking();
    const startTime = performance.now();
    const startCPU = process.cpuUsage();
    const startMemory = v8.getHeapStatistics().used_heap_size;

    try {
      const result = vm.runInContext(code, context, {
        timeout,
        displayErrors: true
      });

      const endTime = performance.now();
      const endCPU = process.cpuUsage(startCPU);
      const endMemory = v8.getHeapStatistics().used_heap_size;

      this.memoryTracker.stopTracking();

      const metrics = {
        wallTime: (endTime - startTime).toFixed(2) + 'ms',
        cpuTime: ((endCPU.user + endCPU.system) / 1000).toFixed(2) + 'ms',
        memory: ((endMemory - startMemory) / 1024 / 1024).toFixed(2) + 'MB',
        memorySnapshots: this.memoryTracker.snapshots.length
      };

      // Update quota
      this.quota.usage.executions.push(Date.now());

      return {
        success: true,
        result,
        metrics,
        quotaStatus: this.quota.getUsage()
      };
    } catch (error) {
      this.memoryTracker.stopTracking();
      throw error;
    }
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      cpu: this.cpuMonitor.getStats(),
      memory: this.memoryTracker.analyze(),
      quota: this.quota.getUsage(),
      profiles: this.profiler.getProfiles().length
    };
  }
}

// Test complete monitor
console.log('Testing complete resource monitor:');
const monitor = new ResourceMonitor({
  maxCPUTime: 1000,
  maxMemoryMB: 50,
  quotas: {
    maxExecutionsPerMinute: 10
  }
});

const context5 = vm.createContext({ result: 0 });

(async () => {
  try {
    const result = await monitor.execute(
      'for(let i = 0; i < 100000; i++) result += i; result',
      context5
    );
    console.log('Execution metrics:');
    Object.entries(result.metrics).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  } catch (err) {
    console.log('Error:', err.message);
  }

  console.log('\n=== Summary: Resource Monitoring ===\n');
  console.log('Monitoring Capabilities:');
  console.log('✓ CPU time tracking');
  console.log('✓ Memory usage monitoring');
  console.log('✓ Resource quota enforcement');
  console.log('✓ Performance profiling');
  console.log('✓ Real-time tracking');
  console.log('✓ Violation detection');
  console.log('✓ Comprehensive metrics');
})();
