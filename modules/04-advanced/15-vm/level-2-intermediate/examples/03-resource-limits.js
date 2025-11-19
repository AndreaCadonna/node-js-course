/**
 * Example 3: Memory and CPU Resource Limits
 *
 * This example demonstrates various strategies for implementing and enforcing
 * resource limits in VM contexts, including timeout control, memory monitoring,
 * and CPU usage tracking.
 *
 * Topics covered:
 * - Timeout enforcement strategies
 * - Memory usage monitoring
 * - CPU time tracking
 * - Resource limit patterns
 * - Safe execution wrappers
 */

const vm = require('vm');
const v8 = require('v8');
const { performance } = require('perf_hooks');

// ============================================================================
// 1. Basic Timeout Control
// ============================================================================

console.log('=== 1. Basic Timeout Control ===\n');

/**
 * Execute code with timeout
 */
function executeWithTimeout(code, context, timeout = 1000) {
  try {
    const result = vm.runInContext(code, context, {
      timeout,
      displayErrors: true
    });
    return { success: true, result };
  } catch (err) {
    if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
      return { success: false, error: 'Execution timeout exceeded' };
    }
    return { success: false, error: err.message };
  }
}

// Demo timeout control
const ctx = vm.createContext({ x: 10 });

console.log('Fast execution (should succeed):');
const result1 = executeWithTimeout('x * 2', ctx, 100);
console.log(result1);

console.log('\nSlow execution (should timeout):');
const result2 = executeWithTimeout('while(true) {}', ctx, 100);
console.log(result2);
console.log();

// ============================================================================
// 2. Advanced Timeout Strategies
// ============================================================================

console.log('=== 2. Advanced Timeout Strategies ===\n');

/**
 * Timeout executor with retry logic
 */
class TimeoutExecutor {
  constructor(defaultTimeout = 1000, maxRetries = 3) {
    this.defaultTimeout = defaultTimeout;
    this.maxRetries = maxRetries;
    this.stats = {
      executions: 0,
      timeouts: 0,
      retries: 0,
      successes: 0
    };
  }

  execute(code, context, options = {}) {
    const {
      timeout = this.defaultTimeout,
      retry = true,
      backoff = 1.5
    } = options;

    this.stats.executions++;
    let currentTimeout = timeout;
    let attempts = 0;

    while (attempts <= this.maxRetries) {
      try {
        const result = vm.runInContext(code, context, {
          timeout: currentTimeout,
          breakOnSigint: true
        });

        this.stats.successes++;
        return {
          success: true,
          result,
          attempts: attempts + 1,
          timeUsed: currentTimeout
        };
      } catch (err) {
        if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
          this.stats.timeouts++;
          attempts++;

          if (attempts <= this.maxRetries && retry) {
            this.stats.retries++;
            currentTimeout = Math.floor(currentTimeout * backoff);
            console.log(`Timeout on attempt ${attempts}, retrying with ${currentTimeout}ms...`);
            continue;
          }

          return {
            success: false,
            error: 'Maximum retries exceeded',
            attempts
          };
        }

        return {
          success: false,
          error: err.message,
          attempts: attempts + 1
        };
      }
    }
  }

  getStats() {
    return { ...this.stats };
  }
}

// Demo advanced timeout
const executor = new TimeoutExecutor(50, 2);
const testCtx = vm.createContext({ x: 100, result: 0 });

console.log('Execute fast code:');
console.log(executor.execute('result = x * 2', testCtx));

console.log('\nExecute moderate code (may need retry):');
const moderateCode = 'for(let i = 0; i < 1000000; i++) { result = i; }';
console.log(executor.execute(moderateCode, testCtx, { retry: true }));

console.log('\nExecutor stats:', executor.getStats());
console.log();

// ============================================================================
// 3. Memory Monitoring
// ============================================================================

console.log('=== 3. Memory Monitoring ===\n');

/**
 * Execute with memory monitoring
 */
class MemoryMonitor {
  constructor(maxMemoryMB = 50) {
    this.maxMemory = maxMemoryMB * 1024 * 1024; // Convert to bytes
    this.executions = [];
  }

  execute(code, context, timeout = 1000) {
    // Take memory snapshot before
    const beforeStats = v8.getHeapStatistics();
    const beforeMemory = beforeStats.used_heap_size;
    const startTime = performance.now();

    try {
      // Execute code
      const result = vm.runInContext(code, context, {
        timeout,
        breakOnSigint: true
      });

      // Take memory snapshot after
      const afterStats = v8.getHeapStatistics();
      const afterMemory = afterStats.used_heap_size;
      const memoryUsed = afterMemory - beforeMemory;
      const duration = performance.now() - startTime;

      const execution = {
        success: true,
        result,
        memoryUsed,
        duration,
        timestamp: Date.now()
      };

      this.executions.push(execution);

      // Check if memory limit exceeded
      if (memoryUsed > this.maxMemory) {
        return {
          ...execution,
          warning: `Memory usage (${this.formatBytes(memoryUsed)}) exceeded limit (${this.formatBytes(this.maxMemory)})`
        };
      }

      return execution;
    } catch (err) {
      const duration = performance.now() - startTime;
      const execution = {
        success: false,
        error: err.message,
        duration,
        timestamp: Date.now()
      };

      this.executions.push(execution);
      return execution;
    }
  }

  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  getStats() {
    const successful = this.executions.filter(e => e.success);
    const avgMemory = successful.reduce((sum, e) => sum + (e.memoryUsed || 0), 0) / successful.length || 0;
    const avgDuration = this.executions.reduce((sum, e) => sum + e.duration, 0) / this.executions.length || 0;

    return {
      totalExecutions: this.executions.length,
      successful: successful.length,
      failed: this.executions.length - successful.length,
      avgMemory: this.formatBytes(avgMemory),
      avgDuration: avgDuration.toFixed(2) + 'ms',
      maxMemoryLimit: this.formatBytes(this.maxMemory)
    };
  }
}

// Demo memory monitoring
const monitor = new MemoryMonitor(10); // 10MB limit
const memCtx = vm.createContext({ result: null });

console.log('Execute small allocation:');
console.log(monitor.execute('result = [1, 2, 3]', memCtx));

console.log('\nExecute large allocation:');
console.log(monitor.execute('result = new Array(1000000).fill(0)', memCtx));

console.log('\nMemory monitor stats:', monitor.getStats());
console.log();

// ============================================================================
// 4. CPU Time Tracking
// ============================================================================

console.log('=== 4. CPU Time Tracking ===\n');

/**
 * Track CPU time for executions
 */
class CPUTimeTracker {
  constructor(maxCPUTime = 1000) {
    this.maxCPUTime = maxCPUTime;
    this.executions = [];
  }

  execute(code, context) {
    const startTime = performance.now();
    const startCPU = process.cpuUsage();

    try {
      const result = vm.runInContext(code, context, {
        timeout: this.maxCPUTime,
        breakOnSigint: true
      });

      const endTime = performance.now();
      const endCPU = process.cpuUsage(startCPU);

      const execution = {
        success: true,
        result,
        wallTime: endTime - startTime,
        cpuTime: (endCPU.user + endCPU.system) / 1000, // Convert to ms
        cpuUser: endCPU.user / 1000,
        cpuSystem: endCPU.system / 1000,
        timestamp: Date.now()
      };

      this.executions.push(execution);
      return execution;
    } catch (err) {
      const endTime = performance.now();
      const endCPU = process.cpuUsage(startCPU);

      const execution = {
        success: false,
        error: err.message,
        wallTime: endTime - startTime,
        cpuTime: (endCPU.user + endCPU.system) / 1000,
        timestamp: Date.now()
      };

      this.executions.push(execution);
      return execution;
    }
  }

  getStats() {
    const successful = this.executions.filter(e => e.success);

    return {
      totalExecutions: this.executions.length,
      successful: successful.length,
      avgWallTime: (successful.reduce((s, e) => s + e.wallTime, 0) / successful.length || 0).toFixed(2) + 'ms',
      avgCPUTime: (successful.reduce((s, e) => s + e.cpuTime, 0) / successful.length || 0).toFixed(2) + 'ms',
      maxCPUTime: this.maxCPUTime + 'ms'
    };
  }
}

// Demo CPU tracking
const cpuTracker = new CPUTimeTracker(2000);
const cpuCtx = vm.createContext({ result: 0 });

console.log('Execute light computation:');
console.log(cpuTracker.execute('result = 2 + 2', cpuCtx));

console.log('\nExecute heavy computation:');
const heavyCode = 'for(let i = 0; i < 10000000; i++) { result = Math.sqrt(i); }';
console.log(cpuTracker.execute(heavyCode, cpuCtx));

console.log('\nCPU tracker stats:', cpuTracker.getStats());
console.log();

// ============================================================================
// 5. Combined Resource Limiter
// ============================================================================

console.log('=== 5. Combined Resource Limiter ===\n');

/**
 * Comprehensive resource limiter
 */
class ResourceLimiter {
  constructor(options = {}) {
    this.limits = {
      timeout: options.timeout || 1000,
      maxMemoryMB: options.maxMemoryMB || 50,
      maxCPUTime: options.maxCPUTime || 2000
    };

    this.stats = {
      executions: 0,
      timeouts: 0,
      memoryViolations: 0,
      cpuViolations: 0,
      successes: 0,
      errors: 0
    };
  }

  execute(code, context, customLimits = {}) {
    this.stats.executions++;

    const limits = { ...this.limits, ...customLimits };
    const maxMemory = limits.maxMemoryMB * 1024 * 1024;

    // Capture initial state
    const beforeMemory = v8.getHeapStatistics().used_heap_size;
    const startTime = performance.now();
    const startCPU = process.cpuUsage();

    try {
      // Execute with timeout
      const result = vm.runInContext(code, context, {
        timeout: limits.timeout,
        breakOnSigint: true
      });

      // Capture final state
      const afterMemory = v8.getHeapStatistics().used_heap_size;
      const endTime = performance.now();
      const endCPU = process.cpuUsage(startCPU);

      const memoryUsed = afterMemory - beforeMemory;
      const wallTime = endTime - startTime;
      const cpuTime = (endCPU.user + endCPU.system) / 1000;

      // Check violations
      const violations = [];

      if (memoryUsed > maxMemory) {
        violations.push({
          type: 'memory',
          used: memoryUsed,
          limit: maxMemory
        });
        this.stats.memoryViolations++;
      }

      if (cpuTime > limits.maxCPUTime) {
        violations.push({
          type: 'cpu',
          used: cpuTime,
          limit: limits.maxCPUTime
        });
        this.stats.cpuViolations++;
      }

      if (violations.length === 0) {
        this.stats.successes++;
      }

      return {
        success: true,
        result,
        resources: {
          memoryUsed: this.formatBytes(memoryUsed),
          wallTime: wallTime.toFixed(2) + 'ms',
          cpuTime: cpuTime.toFixed(2) + 'ms'
        },
        violations: violations.length > 0 ? violations : undefined
      };
    } catch (err) {
      if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
        this.stats.timeouts++;
        return {
          success: false,
          error: 'Timeout exceeded',
          limit: limits.timeout + 'ms'
        };
      }

      this.stats.errors++;
      return {
        success: false,
        error: err.message
      };
    }
  }

  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  getStats() {
    return {
      ...this.stats,
      limits: this.limits
    };
  }

  resetStats() {
    this.stats = {
      executions: 0,
      timeouts: 0,
      memoryViolations: 0,
      cpuViolations: 0,
      successes: 0,
      errors: 0
    };
  }
}

// Demo combined limiter
const limiter = new ResourceLimiter({
  timeout: 1000,
  maxMemoryMB: 5,
  maxCPUTime: 500
});

const limitCtx = vm.createContext({ result: null, Math });

console.log('Execute within limits:');
console.log(limiter.execute('result = Math.sqrt(16)', limitCtx));

console.log('\nExecute with memory violation:');
console.log(limiter.execute('result = new Array(10000000).fill(0)', limitCtx));

console.log('\nExecute with timeout:');
console.log(limiter.execute('while(true) {}', limitCtx));

console.log('\nResource limiter stats:');
console.log(limiter.getStats());
console.log();

// ============================================================================
// 6. Safe Execution Wrapper
// ============================================================================

console.log('=== 6. Safe Execution Wrapper ===\n');

/**
 * Complete safe execution wrapper
 */
class SafeExecutor {
  constructor(options = {}) {
    this.limiter = new ResourceLimiter(options);
    this.contextPool = [];
    this.maxPoolSize = options.poolSize || 5;
  }

  /**
   * Execute code safely
   */
  execute(code, sandbox = {}, options = {}) {
    const context = this.acquireContext(sandbox);

    try {
      return this.limiter.execute(code, context, options);
    } finally {
      this.releaseContext(context);
    }
  }

  /**
   * Acquire context from pool
   */
  acquireContext(sandbox) {
    let context;

    if (this.contextPool.length > 0) {
      context = this.contextPool.pop();
      // Clear old properties
      for (const key in context) {
        delete context[key];
      }
    } else {
      context = vm.createContext({});
    }

    // Add sandbox properties
    Object.assign(context, sandbox);
    return context;
  }

  /**
   * Release context back to pool
   */
  releaseContext(context) {
    if (this.contextPool.length < this.maxPoolSize) {
      this.contextPool.push(context);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.limiter.getStats(),
      poolSize: this.contextPool.length,
      maxPoolSize: this.maxPoolSize
    };
  }
}

// Demo safe executor
const safeExec = new SafeExecutor({
  timeout: 1000,
  maxMemoryMB: 10,
  poolSize: 3
});

console.log('Safe execution 1:');
console.log(safeExec.execute('x * 2', { x: 21 }));

console.log('\nSafe execution 2:');
console.log(safeExec.execute('y + 10', { y: 32 }));

console.log('\nSafe executor stats:');
console.log(safeExec.getStats());
console.log();

// ============================================================================
// Key Takeaways
// ============================================================================

console.log('=== Key Takeaways ===\n');
console.log('1. Always set timeouts when executing untrusted code');
console.log('2. Monitor memory usage with v8.getHeapStatistics()');
console.log('3. Track CPU time with process.cpuUsage()');
console.log('4. Combine multiple limit strategies for robust control');
console.log('5. Use context pooling for better performance');
console.log('6. Log violations for security monitoring');
console.log();

console.log('Run this example with: node 03-resource-limits.js');
