/**
 * Solution: Exercise 4 - Build Performance Monitoring System
 * Comprehensive performance monitoring with metrics, alerts, and recommendations
 */

const util = require('util');
const { EventEmitter } = require('events');

class PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.thresholds = options.thresholds || {};
    this.metrics = new Map();
  }

  monitorInspect(obj, options = {}) {
    return this.track('inspect', () => util.inspect(obj, options));
  }

  monitorPromisify(fn) {
    const promisified = util.promisify(fn);
    return (...args) => this.track('promisify', () => promisified(...args));
  }

  monitorFormat(template, ...args) {
    return this.track('format', () => util.format(template, ...args));
  }

  monitorDeepEqual(actual, expected) {
    return this.track('deepEqual', () => util.isDeepStrictEqual(actual, expected));
  }

  async track(operationName, fn) {
    const memBefore = process.memoryUsage();
    const start = process.hrtime.bigint();
    let success = true;
    let error = null;

    try {
      const result = await fn();
      return result;
    } catch (err) {
      success = false;
      error = err;
      throw err;
    } finally {
      const duration = Number(process.hrtime.bigint() - start) / 1_000_000;
      const memAfter = process.memoryUsage();
      const memDelta = memAfter.heapUsed - memBefore.heapUsed;

      this.recordMetric(operationName, { duration, memory: memDelta, success, error });
      this.checkThresholds(operationName, duration, memDelta);
    }
  }

  recordMetric(operationName, data) {
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, []);
    }
    this.metrics.get(operationName).push({ ...data, timestamp: Date.now() });
  }

  getMetrics(operationName) {
    const metrics = this.metrics.get(operationName) || [];
    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }

    const durations = metrics.map(m => m.duration);
    const successCount = metrics.filter(m => m.success).length;

    return {
      count: metrics.length,
      avg: durations.reduce((a, b) => a + b) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
      successRate: successCount / metrics.length,
      memory: metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length
    };
  }

  percentile(values, p) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p / 100) - 1;
    return sorted[Math.max(0, index)];
  }

  generateReport() {
    const report = { operations: {}, summary: {} };

    for (const [name, _] of this.metrics) {
      report.operations[name] = this.getMetrics(name);
    }

    const allMetrics = Array.from(this.metrics.values()).flat();
    report.summary = {
      totalOperations: allMetrics.length,
      avgDuration: allMetrics.reduce((sum, m) => sum + m.duration, 0) / allMetrics.length,
      successRate: allMetrics.filter(m => m.success).length / allMetrics.length
    };

    return report;
  }

  getRecommendations() {
    const recommendations = [];

    for (const [name, metrics] of this.metrics) {
      const stats = this.getMetrics(name);

      if (stats.avg > 100) {
        recommendations.push(`${name}: Consider optimization - avg duration ${stats.avg.toFixed(2)}ms`);
      }

      if (stats.successRate < 0.95) {
        recommendations.push(`${name}: High failure rate ${((1 - stats.successRate) * 100).toFixed(1)}%`);
      }

      const uniqueInputs = new Set(metrics.map(m => JSON.stringify(m)));
      if (uniqueInputs.size < metrics.length * 0.5) {
        recommendations.push(`${name}: Consider caching - high repetition detected`);
      }
    }

    return recommendations;
  }

  checkThresholds(operationName, duration, memory) {
    const threshold = this.thresholds[operationName];
    if (!threshold) return;

    if (threshold.duration && duration > threshold.duration) {
      this.emit('alert', { operation: operationName, metric: 'duration', value: duration, threshold: threshold.duration });
    }

    if (threshold.memory && memory > threshold.memory) {
      this.emit('alert', { operation: operationName, metric: 'memory', value: memory, threshold: threshold.memory });
    }
  }

  clearMetrics() {
    this.metrics.clear();
  }

  [util.inspect.custom](depth, options) {
    return util.inspect({
      metricsCount: this.metrics.size,
      operations: Array.from(this.metrics.keys()),
      summary: this.generateReport().summary
    }, { ...options, depth: depth - 1 });
  }
}

// KEY LEARNING POINTS:
// 1. Use process.hrtime.bigint() for nanosecond precision
// 2. Track memory with process.memoryUsage()
// 3. Calculate percentiles for realistic SLO tracking
// 4. Emit events for alerting systems
// 5. Provide actionable recommendations
// 6. Track both success and failure rates
// 7. Monitor memory allocation patterns

module.exports = PerformanceMonitor;
