/**
 * Exercise 4: Build Performance Monitoring System
 * Difficulty: ⭐⭐⭐ Hard
 *
 * Create a performance monitoring system for util operations with metrics
 * collection, alerting, reporting, and optimization recommendations.
 *
 * Learning objectives:
 * - Profile util function performance
 * - Identify performance bottlenecks
 * - Implement caching strategies
 * - Build monitoring and alerting systems
 */

const util = require('util');

console.log('Exercise 4: Build Performance Monitoring System\n');

// =============================================================================
// YOUR TASK
// =============================================================================

/**
 * Implement a PerformanceMonitor class with the following features:
 *
 * 1. Track util operation performance (inspect, promisify, format, etc.)
 * 2. Record metrics (duration, count, memory usage)
 * 3. Detect performance anomalies and threshold violations
 * 4. Generate performance reports
 * 5. Provide optimization recommendations
 * 6. Support both sync and async operations
 * 7. Implement caching for expensive operations
 * 8. Track memory allocation patterns
 *
 * Requirements:
 * - Use process.hrtime.bigint() for precise timing
 * - Track memory usage with process.memoryUsage()
 * - Implement statistical analysis (avg, p95, p99)
 * - Detect slow operations and alert
 * - Provide actionable optimization suggestions
 * - Support metric aggregation over time windows
 */

class PerformanceMonitor {
  constructor(options = {}) {
    // TODO: Initialize monitor
    // - Set up thresholds
    // - Initialize metrics storage
    // - Configure alerting
    // - Set up caching

    throw new Error('Not implemented');
  }

  /**
   * Monitor a util.inspect operation
   */
  monitorInspect(obj, options = {}) {
    // TODO: Wrap util.inspect with monitoring
    // - Time the operation
    // - Track memory usage
    // - Record metrics
    // - Check against thresholds
    // - Return result

    throw new Error('Not implemented');
  }

  /**
   * Monitor a util.promisify operation
   */
  monitorPromisify(fn) {
    // TODO: Create monitored promisified function
    // - Track each call
    // - Measure duration
    // - Record success/failure
    // - Return promisified function

    throw new Error('Not implemented');
  }

  /**
   * Monitor a util.format operation
   */
  monitorFormat(template, ...args) {
    // TODO: Wrap util.format with monitoring
    throw new Error('Not implemented');
  }

  /**
   * Monitor a util.isDeepStrictEqual operation
   */
  monitorDeepEqual(actual, expected) {
    // TODO: Wrap deep equality with monitoring
    throw new Error('Not implemented');
  }

  /**
   * Track a custom operation
   */
  track(operationName, fn) {
    // TODO: Generic operation tracking
    // - Support sync and async
    // - Record timing
    // - Track memory
    // - Return result

    throw new Error('Not implemented');
  }

  /**
   * Get metrics for an operation
   */
  getMetrics(operationName) {
    // TODO: Return aggregated metrics
    // - Count
    // - Average duration
    // - Min/max duration
    // - P95, P99 percentiles
    // - Memory stats
    // - Success/failure rate

    throw new Error('Not implemented');
  }

  /**
   * Generate performance report
   */
  generateReport() {
    // TODO: Generate comprehensive report
    // - Summary of all operations
    // - Slowest operations
    // - Most frequent operations
    // - Memory hogs
    // - Recommendations

    throw new Error('Not implemented');
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations() {
    // TODO: Analyze metrics and provide recommendations
    // - Suggest caching for repeated operations
    // - Recommend depth limits for deep inspections
    // - Suggest lazy evaluation
    // - Recommend code optimizations

    throw new Error('Not implemented');
  }

  /**
   * Check if operation violates thresholds
   */
  checkThresholds(operationName, duration, memory) {
    // TODO: Check against configured thresholds
    // - Emit alerts if violated
    // - Track violations

    throw new Error('Not implemented');
  }

  /**
   * Clear metrics
   */
  clearMetrics() {
    // TODO: Reset all metrics
    throw new Error('Not implemented');
  }

  /**
   * Custom inspect for the monitor
   */
  [util.inspect.custom](depth, options) {
    // TODO: Show monitor state and summary stats
    throw new Error('Not implemented');
  }
}

// =============================================================================
// TEST CASES
// =============================================================================

console.log('Running tests...\n');

// Test 1: Monitor inspect operations
console.log('Test 1: Monitor inspect operations');
try {
  const monitor = new PerformanceMonitor({
    thresholds: {
      inspect: { duration: 10, memory: 1024 * 1024 }
    }
  });

  const largeObject = {
    data: Array(1000).fill({ id: 1, value: 'test' })
  };

  const result = monitor.monitorInspect(largeObject, { depth: 3 });

  const metrics = monitor.getMetrics('inspect');
  console.log('Metrics:', metrics);
  console.log('✅ PASS: Inspect monitoring works');
} catch (err) {
  console.log('❌ FAIL:', err.message);
}

// Test 2: Monitor promisify operations
console.log('\nTest 2: Monitor promisify operations');
(async () => {
  try {
    const monitor = new PerformanceMonitor();

    function asyncOperation(value, callback) {
      setTimeout(() => callback(null, value * 2), 10);
    }

    const monitoredPromise = monitor.monitorPromisify(asyncOperation);

    await monitoredPromise(5);
    await monitoredPromise(10);
    await monitoredPromise(15);

    const metrics = monitor.getMetrics('promisify');
    console.log('Metrics:', metrics);

    if (metrics.count === 3) {
      console.log('✅ PASS: Promisify monitoring works');
    } else {
      console.log('❌ FAIL: Wrong count');
    }
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
})();

// Test 3: Custom operation tracking
setTimeout(() => {
  console.log('\nTest 3: Custom operation tracking');
  (async () => {
    try {
      const monitor = new PerformanceMonitor();

      const result = await monitor.track('database-query', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return { rows: 100 };
      });

      if (result.rows === 100) {
        const metrics = monitor.getMetrics('database-query');
        console.log('Metrics:', metrics);
        console.log('✅ PASS: Custom tracking works');
      }
    } catch (err) {
      console.log('❌ FAIL:', err.message);
    }
  })();
}, 150);

// Test 4: Threshold violations and alerts
setTimeout(() => {
  console.log('\nTest 4: Threshold violations');
  try {
    const monitor = new PerformanceMonitor({
      thresholds: {
        'slow-operation': { duration: 5 }
      }
    });

    let alertTriggered = false;
    monitor.on('alert', (alert) => {
      alertTriggered = true;
      console.log('Alert triggered:', alert);
    });

    // Simulate slow operation
    monitor.track('slow-operation', () => {
      const start = Date.now();
      while (Date.now() - start < 20) {} // Busy wait
      return 'done';
    });

    setTimeout(() => {
      console.log(alertTriggered ? '✅ PASS: Alerts work' : '❌ FAIL: No alert');
    }, 50);
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
}, 300);

// Test 5: Performance report generation
setTimeout(() => {
  console.log('\nTest 5: Performance report');
  (async () => {
    try {
      const monitor = new PerformanceMonitor();

      // Generate some metrics
      for (let i = 0; i < 10; i++) {
        monitor.monitorInspect({ data: i });
        monitor.monitorFormat('Test %s', i);
        await monitor.track('async-op', async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
        });
      }

      const report = monitor.generateReport();
      console.log('Report:', util.inspect(report, { depth: 3, colors: true }));

      if (report.operations) {
        console.log('✅ PASS: Report generation works');
      }
    } catch (err) {
      console.log('❌ FAIL:', err.message);
    }
  })();
}, 450);

// Test 6: Optimization recommendations
setTimeout(() => {
  console.log('\nTest 6: Optimization recommendations');
  (async () => {
    try {
      const monitor = new PerformanceMonitor();

      // Create pattern that should trigger recommendations
      const sameObject = { repeated: true };

      for (let i = 0; i < 20; i++) {
        monitor.monitorInspect(sameObject); // Same object repeated
      }

      const recommendations = monitor.getRecommendations();
      console.log('Recommendations:', recommendations);

      if (Array.isArray(recommendations) && recommendations.length > 0) {
        console.log('✅ PASS: Recommendations generated');
      } else {
        console.log('❌ FAIL: No recommendations');
      }
    } catch (err) {
      console.log('❌ FAIL:', err.message);
    }
  })();
}, 600);

// Test 7: Memory tracking
setTimeout(() => {
  console.log('\nTest 7: Memory tracking');
  try {
    const monitor = new PerformanceMonitor();

    // Create large object
    const large = {
      data: Array(10000).fill({ value: 'x'.repeat(100) })
    };

    monitor.monitorInspect(large);

    const metrics = monitor.getMetrics('inspect');

    if (metrics.memory) {
      console.log('Memory delta:', metrics.memory);
      console.log('✅ PASS: Memory tracking works');
    } else {
      console.log('❌ FAIL: No memory stats');
    }
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
}, 750);

// Test 8: Percentile calculations
setTimeout(() => {
  console.log('\nTest 8: Percentile calculations');
  (async () => {
    try {
      const monitor = new PerformanceMonitor();

      // Generate operations with varying durations
      for (let i = 1; i <= 100; i++) {
        await monitor.track('varied-duration', async () => {
          await new Promise(resolve => setTimeout(resolve, i % 10));
        });
      }

      const metrics = monitor.getMetrics('varied-duration');

      if (metrics.p95 && metrics.p99) {
        console.log('P95:', metrics.p95);
        console.log('P99:', metrics.p99);
        console.log('✅ PASS: Percentile calculations work');
      } else {
        console.log('❌ FAIL: Missing percentiles');
      }
    } catch (err) {
      console.log('❌ FAIL:', err.message);
    }
  })();
}, 900);

// =============================================================================
// BONUS CHALLENGES
// =============================================================================

setTimeout(() => {
  console.log('\n=== Bonus Challenges ===\n');

  console.log('1. Add real-time performance dashboards');
  console.log('2. Implement metric export to Prometheus/Graphite');
  console.log('3. Add anomaly detection using statistical methods');
  console.log('4. Support custom metric collectors');
  console.log('5. Implement metric retention and rollup policies');
  console.log('6. Add distributed tracing integration');
  console.log('7. Create performance comparison over time');
  console.log('8. Add automatic optimization application');

  console.log('\nSee solution file for complete implementation!');
}, 2000);

// =============================================================================
// HINTS
// =============================================================================

/*
HINTS:

1. Precise timing:
   const start = process.hrtime.bigint();
   const result = operation();
   const duration = Number(process.hrtime.bigint() - start) / 1_000_000; // ms

2. Memory tracking:
   const before = process.memoryUsage();
   const result = operation();
   const after = process.memoryUsage();
   const delta = after.heapUsed - before.heapUsed;

3. Percentile calculation:
   function percentile(values, p) {
     const sorted = values.sort((a, b) => a - b);
     const index = Math.ceil(sorted.length * p / 100) - 1;
     return sorted[index];
   }

4. Threshold checking:
   if (duration > this.thresholds[operation].duration) {
     this.emit('alert', { operation, duration, threshold });
   }

5. Caching recommendation:
   const unique = new Set(operations.map(op => op.input));
   if (unique.size < operations.length * 0.5) {
     recommendations.push('Consider caching - high repetition detected');
   }
*/
