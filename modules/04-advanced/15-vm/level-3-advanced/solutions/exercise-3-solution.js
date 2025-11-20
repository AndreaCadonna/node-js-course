/**
 * Exercise 3 Solution: Resource Monitor
 *
 * A comprehensive resource monitoring system that:
 * - Monitors CPU time (user + system)
 * - Tracks memory usage (heap, RSS)
 * - Enforces resource quotas
 * - Real-time monitoring during execution
 * - Generates detailed resource reports
 * - Supports resource profiling
 * - Quota violation detection
 * - Historical tracking
 */

const vm = require('vm');
const v8 = require('v8');
const { performance } = require('perf_hooks');

/**
 * ResourceMonitor - Monitor and enforce resource usage limits
 */
class ResourceMonitor {
  constructor(options = {}) {
    // Configuration
    this.sampleInterval = options.sampleInterval || 100; // milliseconds
    this.maxHistorySize = options.maxHistorySize || 1000;

    // Default quotas
    this.defaultQuotas = {
      maxCPUTime: options.maxCPUTime || 5000, // milliseconds
      maxMemory: options.maxMemory || 100 * 1024 * 1024, // 100MB
      maxTimeout: options.maxTimeout || 10000 // milliseconds
    };

    // Current quotas
    this.quotas = { ...this.defaultQuotas };

    // Monitoring state
    this.monitoring = false;
    this.monitoringInterval = null;
    this.snapshots = [];

    // Execution tracking
    this.executions = [];
  }

  /**
   * Set resource quotas
   */
  setQuotas(quotas) {
    this.quotas = { ...this.quotas, ...quotas };
  }

  /**
   * Take a snapshot of current resource usage
   */
  snapshot() {
    const heapStats = v8.getHeapStatistics();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: Date.now(),
      wallTime: performance.now(),
      heap: {
        totalHeapSize: heapStats.total_heap_size,
        usedHeapSize: heapStats.used_heap_size,
        heapSizeLimit: heapStats.heap_size_limit,
        mallocedMemory: heapStats.malloced_memory,
        externalMemory: heapStats.external_memory
      },
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers || 0
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      }
    };
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring() {
    if (this.monitoring) {
      return;
    }

    this.monitoring = true;
    this.snapshots = [];

    // Take initial snapshot
    this.snapshots.push(this.snapshot());

    // Start periodic sampling
    this.monitoringInterval = setInterval(() => {
      if (this.monitoring) {
        this.snapshots.push(this.snapshot());

        // Limit snapshot history
        if (this.snapshots.length > this.maxHistorySize) {
          this.snapshots.shift();
        }
      }
    }, this.sampleInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.monitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Take final snapshot
    if (this.snapshots.length > 0) {
      this.snapshots.push(this.snapshot());
    }
  }

  /**
   * Execute code with resource monitoring
   */
  execute(code, context, quotas = {}) {
    // Merge quotas with defaults
    const effectiveQuotas = { ...this.quotas, ...quotas };

    const executionRecord = {
      code,
      startTime: Date.now(),
      endTime: null,
      success: false,
      result: null,
      error: null,
      metrics: null,
      quotaViolations: []
    };

    try {
      // Take before snapshot
      const beforeSnapshot = this.snapshot();

      // Compile the script
      const script = new vm.Script(code, {
        filename: 'monitored-code',
        displayErrors: true
      });

      // Execute with timeout
      const startWall = performance.now();
      const result = script.runInContext(context, {
        timeout: effectiveQuotas.maxTimeout,
        displayErrors: true
      });
      const endWall = performance.now();

      // Take after snapshot
      const afterSnapshot = this.snapshot();

      // Calculate resource usage
      const usage = this.calculateUsage(beforeSnapshot, afterSnapshot);
      usage.wallTime = endWall - startWall;

      // Check quotas
      const violations = this.checkQuotas(usage, effectiveQuotas);

      // Record results
      executionRecord.success = violations.length === 0;
      executionRecord.result = result;
      executionRecord.metrics = usage;
      executionRecord.quotaViolations = violations;
      executionRecord.endTime = Date.now();

      this.executions.push(executionRecord);

      return {
        success: executionRecord.success,
        result,
        metrics: usage,
        violations
      };

    } catch (error) {
      executionRecord.success = false;
      executionRecord.error = error.message;
      executionRecord.endTime = Date.now();
      this.executions.push(executionRecord);

      return {
        success: false,
        error: error.message,
        metrics: null,
        violations: []
      };
    }
  }

  /**
   * Calculate resource usage between two snapshots
   */
  calculateUsage(before, after) {
    return {
      cpuTime: {
        user: after.cpu.user - before.cpu.user,
        system: after.cpu.system - before.cpu.system,
        total: (after.cpu.user + after.cpu.system) - (before.cpu.user + before.cpu.system)
      },
      memory: {
        heapUsedDelta: after.memory.heapUsed - before.memory.heapUsed,
        rssDelta: after.memory.rss - before.memory.rss,
        heapUsedFinal: after.memory.heapUsed,
        rssFinal: after.memory.rss,
        externalDelta: after.memory.external - before.memory.external
      },
      wallTime: after.wallTime - before.wallTime,
      timestamp: after.timestamp
    };
  }

  /**
   * Check if resource usage violates quotas
   */
  checkQuotas(usage, quotas) {
    const violations = [];

    // Check CPU time (convert microseconds to milliseconds)
    if (quotas.maxCPUTime && usage.cpuTime.total / 1000 > quotas.maxCPUTime) {
      violations.push({
        type: 'cpu',
        limit: quotas.maxCPUTime,
        actual: usage.cpuTime.total / 1000,
        message: `CPU time exceeded: ${(usage.cpuTime.total / 1000).toFixed(2)}ms > ${quotas.maxCPUTime}ms`
      });
    }

    // Check memory usage
    if (quotas.maxMemory && usage.memory.heapUsedFinal > quotas.maxMemory) {
      violations.push({
        type: 'memory',
        limit: quotas.maxMemory,
        actual: usage.memory.heapUsedFinal,
        message: `Memory usage exceeded: ${(usage.memory.heapUsedFinal / 1024 / 1024).toFixed(2)}MB > ${(quotas.maxMemory / 1024 / 1024).toFixed(2)}MB`
      });
    }

    // Check wall time (timeout)
    if (quotas.maxTimeout && usage.wallTime > quotas.maxTimeout) {
      violations.push({
        type: 'timeout',
        limit: quotas.maxTimeout,
        actual: usage.wallTime,
        message: `Execution timeout: ${usage.wallTime.toFixed(2)}ms > ${quotas.maxTimeout}ms`
      });
    }

    return violations;
  }

  /**
   * Profile code execution
   */
  profile(code, context, iterations = 10) {
    const results = [];

    console.log(`Profiling code (${iterations} iterations)...`);

    for (let i = 0; i < iterations; i++) {
      // Create a fresh context for each iteration to avoid state pollution
      const freshContext = vm.createContext({ ...context });

      const result = this.execute(code, freshContext, {});

      if (result.success && result.metrics) {
        results.push({
          iteration: i + 1,
          cpuTime: result.metrics.cpuTime.total / 1000, // Convert to ms
          wallTime: result.metrics.wallTime,
          memoryUsed: result.metrics.memory.heapUsedFinal,
          memoryDelta: result.metrics.memory.heapUsedDelta
        });
      }
    }

    // Calculate statistics
    if (results.length === 0) {
      return {
        iterations: 0,
        statistics: null,
        error: 'No successful executions'
      };
    }

    const cpuTimes = results.map(r => r.cpuTime);
    const wallTimes = results.map(r => r.wallTime);
    const memoryUsed = results.map(r => r.memoryUsed);

    const statistics = {
      iterations: results.length,
      cpuTime: this.calculateStats(cpuTimes),
      wallTime: this.calculateStats(wallTimes),
      memory: this.calculateStats(memoryUsed)
    };

    return {
      iterations: results.length,
      statistics,
      results
    };
  }

  /**
   * Calculate statistical measures (min, max, avg, median, stddev)
   */
  calculateStats(values) {
    if (values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    // Calculate standard deviation
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Calculate median
    const median = values.length % 2 === 0
      ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
      : sorted[Math.floor(values.length / 2)];

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg,
      median,
      stdDev,
      p95: sorted[Math.floor(values.length * 0.95)],
      p99: sorted[Math.floor(values.length * 0.99)]
    };
  }

  /**
   * Get current resource usage
   */
  getUsage() {
    const snapshot = this.snapshot();

    return {
      timestamp: snapshot.timestamp,
      cpu: {
        user: (snapshot.cpu.user / 1000).toFixed(2) + ' ms',
        system: (snapshot.cpu.system / 1000).toFixed(2) + ' ms',
        total: ((snapshot.cpu.user + snapshot.cpu.system) / 1000).toFixed(2) + ' ms'
      },
      memory: {
        heapUsed: (snapshot.memory.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        heapTotal: (snapshot.memory.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
        rss: (snapshot.memory.rss / 1024 / 1024).toFixed(2) + ' MB',
        external: (snapshot.memory.external / 1024 / 1024).toFixed(2) + ' MB'
      },
      heap: {
        used: (snapshot.heap.usedHeapSize / 1024 / 1024).toFixed(2) + ' MB',
        total: (snapshot.heap.totalHeapSize / 1024 / 1024).toFixed(2) + ' MB',
        limit: (snapshot.heap.heapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
      }
    };
  }

  /**
   * Get detailed resource report
   */
  getReport() {
    if (this.snapshots.length < 2) {
      return {
        duration: 0,
        snapshotCount: this.snapshots.length,
        error: 'Insufficient snapshots for report'
      };
    }

    const firstSnapshot = this.snapshots[0];
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];

    const duration = lastSnapshot.timestamp - firstSnapshot.timestamp;

    // Calculate CPU usage statistics
    const cpuDeltas = [];
    const memoryUsages = [];

    for (let i = 1; i < this.snapshots.length; i++) {
      const prev = this.snapshots[i - 1];
      const curr = this.snapshots[i];

      const cpuDelta = (curr.cpu.user + curr.cpu.system) - (prev.cpu.user + prev.cpu.system);
      cpuDeltas.push(cpuDelta / 1000); // Convert to ms

      memoryUsages.push(curr.memory.heapUsed);
    }

    // Calculate statistics
    const cpuStats = this.calculateStats(cpuDeltas);
    const memoryStats = this.calculateStats(memoryUsages);

    // Find quota violations
    const violations = this.executions
      .flatMap(exec => exec.quotaViolations)
      .filter(v => v);

    return {
      duration,
      snapshotCount: this.snapshots.length,
      cpuUsage: {
        totalMs: cpuStats ? cpuStats.avg * (this.snapshots.length - 1) : 0,
        avgMs: cpuStats ? cpuStats.avg : 0,
        peakMs: cpuStats ? cpuStats.max : 0,
        minMs: cpuStats ? cpuStats.min : 0
      },
      memoryUsage: {
        totalBytes: memoryStats ? memoryStats.avg : 0,
        avgBytes: memoryStats ? memoryStats.avg : 0,
        peakBytes: memoryStats ? memoryStats.max : 0,
        minBytes: memoryStats ? memoryStats.min : 0,
        avgMB: memoryStats ? (memoryStats.avg / 1024 / 1024).toFixed(2) : 0,
        peakMB: memoryStats ? (memoryStats.max / 1024 / 1024).toFixed(2) : 0
      },
      quotaViolations: violations.length,
      violations,
      executions: this.executions.length
    };
  }

  /**
   * Get monitoring history
   */
  getHistory() {
    return this.snapshots.map(snapshot => ({
      timestamp: snapshot.timestamp,
      cpuUser: snapshot.cpu.user,
      cpuSystem: snapshot.cpu.system,
      heapUsed: snapshot.memory.heapUsed,
      rss: snapshot.memory.rss
    }));
  }

  /**
   * Reset monitor
   */
  reset() {
    this.stopMonitoring();
    this.snapshots = [];
    this.executions = [];
    this.quotas = { ...this.defaultQuotas };
  }

  /**
   * Get execution history
   */
  getExecutions() {
    return this.executions.map(exec => ({
      startTime: exec.startTime,
      duration: exec.endTime - exec.startTime,
      success: exec.success,
      violations: exec.quotaViolations.length,
      cpuTime: exec.metrics ? exec.metrics.cpuTime.total / 1000 : null,
      memoryUsed: exec.metrics ? exec.metrics.memory.heapUsedFinal : null
    }));
  }

  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }

  /**
   * Format time in milliseconds
   */
  formatTime(ms) {
    if (ms < 1) return (ms * 1000).toFixed(2) + ' μs';
    if (ms < 1000) return ms.toFixed(2) + ' ms';
    return (ms / 1000).toFixed(2) + ' s';
  }
}

// ============================================================================
// Test Cases - DO NOT MODIFY
// ============================================================================

function runTests() {
  console.log('Testing Resource Monitor\n');
  console.log('='.repeat(60));

  const monitor = new ResourceMonitor({
    sampleInterval: 50
  });

  const context = vm.createContext({ result: 0, Math });

  // Test 1: Basic execution monitoring
  console.log('\n✓ Test 1: Basic Execution Monitoring');
  monitor.setQuotas({
    maxCPUTime: 1000,
    maxMemory: 50 * 1024 * 1024,
    maxTimeout: 5000
  });

  const result1 = monitor.execute('Math.pow(2, 20)', context);
  console.assert(result1.success === true, 'Should execute successfully');
  console.assert(result1.metrics, 'Should have metrics');
  console.log('  CPU time:', result1.metrics.cpuTime);
  console.log('  Memory:', result1.metrics.memory);

  // Test 2: Quota enforcement
  console.log('\n✓ Test 2: Quota Enforcement');
  monitor.setQuotas({ maxTimeout: 500 });
  const result2 = monitor.execute('while(true) {}', context);
  console.assert(result2.success === false, 'Should timeout');
  console.log('  Timeout enforced');

  // Test 3: Real-time monitoring
  console.log('\n✓ Test 3: Real-time Monitoring');
  monitor.startMonitoring();
  const context2 = vm.createContext({ arrays: [] });
  vm.runInContext(
    'for(let i=0; i<50; i++) arrays.push(new Array(1000).fill(i))',
    context2,
    { timeout: 5000 }
  );
  monitor.stopMonitoring();
  const history = monitor.getHistory();
  console.assert(history.length > 0, 'Should have snapshots');
  console.log('  Snapshots captured:', history.length);

  // Test 4: Resource report
  console.log('\n✓ Test 4: Resource Report');
  const report = monitor.getReport();
  console.assert(report.snapshotCount > 0, 'Should have snapshots');
  console.log('  Duration:', report.duration);
  console.log('  Snapshots:', report.snapshotCount);

  // Test 5: Profiling
  console.log('\n✓ Test 5: Code Profiling');
  const profile = monitor.profile('Math.sqrt(144)', context, 5);
  console.assert(profile.iterations === 5, 'Should run 5 times');
  console.assert(profile.statistics, 'Should have statistics');
  console.log('  Avg time:', profile.statistics.cpuTime.avg);

  console.log('\n' + '='.repeat(60));
  console.log('\nAll tests completed!');
}

// Export for reuse
module.exports = ResourceMonitor;

// Run tests if executed directly
if (require.main === module) {
  runTests();
}
