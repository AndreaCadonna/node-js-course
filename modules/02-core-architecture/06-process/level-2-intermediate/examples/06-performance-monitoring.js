/**
 * 06-performance-monitoring.js
 *
 * Performance Monitoring in Node.js
 *
 * This example demonstrates production-ready performance monitoring including:
 * - Event loop lag detection
 * - Async operation tracking
 * - Performance timing API
 * - High-resolution time measurements
 * - Operation profiling
 * - Performance marks and measures
 * - Bottleneck identification
 * - Real-time performance metrics
 *
 * Performance monitoring is critical for:
 * - Identifying slow operations
 * - Detecting event loop blocking
 * - Optimizing application performance
 * - Capacity planning
 * - SLA compliance
 * - User experience optimization
 *
 * Key Metrics:
 * - Event loop lag
 * - Operation duration
 * - Async operation count
 * - GC pause time
 * - Request latency
 *
 * @module performance-monitoring
 * @level intermediate
 */

'use strict';

const { EventEmitter } = require('events');
const { performance, PerformanceObserver } = require('perf_hooks');

// =============================================================================
// 1. Event Loop Lag Detection
// =============================================================================

console.log('\n=== 1. Event Loop Lag Detection ===\n');

class EventLoopMonitor {
  constructor(options = {}) {
    this.sampleInterval = options.sampleInterval || 1000;
    this.warningThreshold = options.warningThreshold || 100; // ms
    this.criticalThreshold = options.criticalThreshold || 500; // ms
    this.timer = null;
    this.samples = [];
    this.maxSamples = 100;
  }

  /**
   * Start monitoring event loop lag
   */
  start() {
    console.log(`[EventLoopMonitor] Starting monitoring`);
    console.log(`  Sample interval: ${this.sampleInterval}ms`);
    console.log(`  Warning threshold: ${this.warningThreshold}ms`);
    console.log(`  Critical threshold: ${this.criticalThreshold}ms\n`);

    this.monitor();
  }

  /**
   * Monitor event loop
   */
  monitor() {
    const start = performance.now();
    const expectedDelay = this.sampleInterval;

    this.timer = setTimeout(() => {
      const actualDelay = performance.now() - start;
      const lag = Math.max(0, actualDelay - expectedDelay);

      this.recordLag(lag);
      this.monitor(); // Schedule next check
    }, this.sampleInterval);
  }

  /**
   * Record lag measurement
   */
  recordLag(lag) {
    const sample = {
      timestamp: Date.now(),
      lag: Math.round(lag),
      severity: this.getSeverity(lag)
    };

    this.samples.push(sample);

    // Keep only recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    // Report based on severity
    if (sample.severity === 'critical') {
      console.log(`\n🔴 [EventLoopMonitor] CRITICAL LAG: ${sample.lag}ms`);
      console.log(`   Event loop is severely blocked!`);
    } else if (sample.severity === 'warning') {
      console.log(`\n⚠️  [EventLoopMonitor] WARNING: Event loop lag ${sample.lag}ms`);
    } else {
      console.log(`[EventLoopMonitor] Lag: ${sample.lag}ms (${sample.severity})`);
    }
  }

  /**
   * Get severity level
   */
  getSeverity(lag) {
    if (lag >= this.criticalThreshold) return 'critical';
    if (lag >= this.warningThreshold) return 'warning';
    return 'ok';
  }

  /**
   * Get statistics
   */
  getStats() {
    if (this.samples.length === 0) {
      return null;
    }

    const lags = this.samples.map(s => s.lag);
    const avg = lags.reduce((a, b) => a + b, 0) / lags.length;

    // Calculate percentiles
    const sorted = [...lags].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      samples: this.samples.length,
      min: Math.min(...lags),
      max: Math.max(...lags),
      avg: Math.round(avg),
      p50,
      p95,
      p99,
      severityCounts: {
        ok: this.samples.filter(s => s.severity === 'ok').length,
        warning: this.samples.filter(s => s.severity === 'warning').length,
        critical: this.samples.filter(s => s.severity === 'critical').length
      }
    };
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      console.log('\n[EventLoopMonitor] Monitoring stopped');
    }
  }
}

const eventLoopMonitor = new EventLoopMonitor({
  sampleInterval: 5000,
  warningThreshold: 50,
  criticalThreshold: 200
});

eventLoopMonitor.start();

// =============================================================================
// 2. Async Operation Tracking
// =============================================================================

console.log('\n=== 2. Async Operation Tracking ===\n');

class AsyncOperationTracker extends EventEmitter {
  constructor() {
    super();
    this.operations = new Map();
    this.completedOperations = [];
    this.maxCompleted = 100;
    this.operationCounter = 0;
  }

  /**
   * Start tracking an async operation
   */
  startOperation(name, metadata = {}) {
    const operationId = ++this.operationCounter;
    const operation = {
      id: operationId,
      name,
      metadata,
      startTime: performance.now(),
      startTimestamp: Date.now()
    };

    this.operations.set(operationId, operation);

    console.log(`[AsyncTracker] Started: ${name} (ID: ${operationId})`);

    return operationId;
  }

  /**
   * End tracking an async operation
   */
  endOperation(operationId, result = {}) {
    const operation = this.operations.get(operationId);

    if (!operation) {
      console.log(`[AsyncTracker] Unknown operation ID: ${operationId}`);
      return;
    }

    const duration = performance.now() - operation.startTime;

    const completed = {
      ...operation,
      endTime: performance.now(),
      endTimestamp: Date.now(),
      duration,
      result
    };

    this.operations.delete(operationId);
    this.completedOperations.push(completed);

    // Keep only recent
    if (this.completedOperations.length > this.maxCompleted) {
      this.completedOperations.shift();
    }

    console.log(`[AsyncTracker] Completed: ${operation.name} in ${duration.toFixed(2)}ms (ID: ${operationId})`);

    this.emit('operationComplete', completed);

    return completed;
  }

  /**
   * Get active operations
   */
  getActiveOperations() {
    const now = performance.now();

    return Array.from(this.operations.values()).map(op => ({
      id: op.id,
      name: op.name,
      duration: now - op.startTime,
      metadata: op.metadata
    }));
  }

  /**
   * Get statistics
   */
  getStats() {
    if (this.completedOperations.length === 0) {
      return {
        active: this.operations.size,
        completed: 0
      };
    }

    const durations = this.completedOperations.map(op => op.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

    // Group by operation name
    const byName = {};
    for (const op of this.completedOperations) {
      if (!byName[op.name]) {
        byName[op.name] = { count: 0, totalDuration: 0 };
      }
      byName[op.name].count++;
      byName[op.name].totalDuration += op.duration;
    }

    // Calculate averages
    for (const name in byName) {
      byName[name].avgDuration = byName[name].totalDuration / byName[name].count;
    }

    return {
      active: this.operations.size,
      completed: this.completedOperations.length,
      avgDuration: avg.toFixed(2),
      minDuration: Math.min(...durations).toFixed(2),
      maxDuration: Math.max(...durations).toFixed(2),
      byName
    };
  }
}

const asyncTracker = new AsyncOperationTracker();

// Example async operations
async function exampleAsyncWork() {
  const opId = asyncTracker.startOperation('database-query', {
    query: 'SELECT * FROM users'
  });

  // Simulate async work
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

  asyncTracker.endOperation(opId, { rows: 42 });
}

// Run example operations
setInterval(() => {
  exampleAsyncWork();
}, 3000);

// =============================================================================
// 3. Performance Timing API
// =============================================================================

console.log('\n=== 3. Performance Timing API ===\n');

class PerformanceTimer {
  constructor() {
    this.marks = new Map();
    this.measures = [];
  }

  /**
   * Create a performance mark
   */
  mark(name) {
    const mark = {
      name,
      timestamp: performance.now()
    };

    this.marks.set(name, mark);
    performance.mark(name);

    console.log(`[PerformanceTimer] Mark: ${name} at ${mark.timestamp.toFixed(3)}ms`);

    return mark;
  }

  /**
   * Measure between two marks
   */
  measure(name, startMark, endMark) {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (!start || !end) {
      console.log(`[PerformanceTimer] Invalid marks for measure: ${startMark}, ${endMark}`);
      return null;
    }

    const duration = end.timestamp - start.timestamp;

    const measure = {
      name,
      startMark,
      endMark,
      duration,
      timestamp: Date.now()
    };

    this.measures.push(measure);
    performance.measure(name, startMark, endMark);

    console.log(`[PerformanceTimer] Measure: ${name} = ${duration.toFixed(3)}ms (${startMark} → ${endMark})`);

    return measure;
  }

  /**
   * Time a function execution
   */
  async timeFunction(name, fn) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    this.mark(startMark);

    try {
      const result = await fn();
      this.mark(endMark);
      this.measure(name, startMark, endMark);

      return result;
    } catch (error) {
      this.mark(endMark);
      this.measure(name, startMark, endMark);
      throw error;
    }
  }

  /**
   * Get all measures
   */
  getMeasures() {
    return this.measures;
  }

  /**
   * Clear all marks and measures
   */
  clear() {
    this.marks.clear();
    this.measures = [];
    performance.clearMarks();
    performance.clearMeasures();

    console.log('[PerformanceTimer] Cleared all marks and measures');
  }
}

const perfTimer = new PerformanceTimer();

// Example usage
async function exampleTimedOperation() {
  perfTimer.mark('operation-start');

  // Phase 1
  perfTimer.mark('phase1-start');
  await new Promise(resolve => setTimeout(resolve, 200));
  perfTimer.mark('phase1-end');
  perfTimer.measure('phase-1', 'phase1-start', 'phase1-end');

  // Phase 2
  perfTimer.mark('phase2-start');
  await new Promise(resolve => setTimeout(resolve, 300));
  perfTimer.mark('phase2-end');
  perfTimer.measure('phase-2', 'phase2-start', 'phase2-end');

  perfTimer.mark('operation-end');
  perfTimer.measure('total-operation', 'operation-start', 'operation-end');
}

// Run example
setTimeout(() => {
  console.log('\n[Demo] Running timed operation...\n');
  exampleTimedOperation();
}, 5000);

// =============================================================================
// 4. Performance Observer
// =============================================================================

console.log('\n=== 4. Performance Observer ===\n');

class PerformanceMonitor extends EventEmitter {
  constructor() {
    super();
    this.observers = [];
    this.entries = [];
  }

  /**
   * Start observing performance entries
   */
  start() {
    console.log('[PerformanceMonitor] Starting performance observation\n');

    // Observe marks
    const markObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.handleEntry('mark', entry);
      }
    });
    markObserver.observe({ entryTypes: ['mark'] });
    this.observers.push(markObserver);

    // Observe measures
    const measureObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.handleEntry('measure', entry);
      }
    });
    measureObserver.observe({ entryTypes: ['measure'] });
    this.observers.push(measureObserver);

    // Observe functions (if available)
    try {
      const functionObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handleEntry('function', entry);
        }
      });
      functionObserver.observe({ entryTypes: ['function'] });
      this.observers.push(functionObserver);
    } catch (err) {
      // Function observation not available
    }

    console.log(`[PerformanceMonitor] Observing ${this.observers.length} entry type(s)`);
  }

  /**
   * Handle performance entry
   */
  handleEntry(type, entry) {
    const record = {
      type,
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration,
      timestamp: Date.now()
    };

    this.entries.push(record);
    this.emit('entry', record);

    console.log(`[PerformanceMonitor] ${type.toUpperCase()}: ${entry.name} (duration: ${entry.duration.toFixed(3)}ms)`);
  }

  /**
   * Get all entries
   */
  getEntries() {
    return this.entries;
  }

  /**
   * Stop observing
   */
  stop() {
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers = [];
    console.log('\n[PerformanceMonitor] Stopped observing');
  }
}

const perfMonitor = new PerformanceMonitor();
perfMonitor.start();

// =============================================================================
// 5. High-Resolution Timer
// =============================================================================

console.log('\n=== 5. High-Resolution Timer ===\n');

class HighResTimer {
  /**
   * Get current high-resolution time
   */
  static now() {
    return performance.now();
  }

  /**
   * Measure execution time
   */
  static measure(fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    return {
      result,
      duration: end - start
    };
  }

  /**
   * Measure async execution time
   */
  static async measureAsync(fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    return {
      result,
      duration: end - start
    };
  }

  /**
   * Create a timer
   */
  static createTimer() {
    const start = performance.now();

    return {
      elapsed: () => performance.now() - start,
      stop: () => {
        const end = performance.now();
        return end - start;
      }
    };
  }
}

// Example usage
console.log('[HighResTimer] Measuring synchronous operation...');
const syncResult = HighResTimer.measure(() => {
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += i;
  }
  return sum;
});
console.log(`  Duration: ${syncResult.duration.toFixed(3)}ms`);
console.log(`  Result: ${syncResult.result}\n`);

// =============================================================================
// 6. Operation Profiler
// =============================================================================

console.log('\n=== 6. Operation Profiler ===\n');

class OperationProfiler {
  constructor() {
    this.profiles = new Map();
  }

  /**
   * Profile an operation
   */
  async profile(name, operation) {
    const timer = HighResTimer.createTimer();
    const memBefore = process.memoryUsage();
    const cpuBefore = process.cpuUsage();

    try {
      const result = await operation();
      const duration = timer.stop();
      const memAfter = process.memoryUsage();
      const cpuAfter = process.cpuUsage(cpuBefore);

      const profile = {
        name,
        duration,
        memory: {
          heapUsedDelta: memAfter.heapUsed - memBefore.heapUsed,
          externalDelta: memAfter.external - memBefore.external
        },
        cpu: {
          user: cpuAfter.user / 1000, // Convert to ms
          system: cpuAfter.system / 1000
        },
        timestamp: Date.now()
      };

      this.recordProfile(profile);

      return { result, profile };
    } catch (error) {
      const duration = timer.stop();

      const profile = {
        name,
        duration,
        error: error.message,
        timestamp: Date.now()
      };

      this.recordProfile(profile);

      throw error;
    }
  }

  /**
   * Record profile
   */
  recordProfile(profile) {
    if (!this.profiles.has(profile.name)) {
      this.profiles.set(profile.name, []);
    }

    this.profiles.get(profile.name).push(profile);

    console.log(`\n[Profiler] ${profile.name}:`);
    console.log(`  Duration: ${profile.duration.toFixed(3)}ms`);

    if (profile.memory) {
      console.log(`  Heap Δ: ${(profile.memory.heapUsedDelta / 1024).toFixed(2)} KB`);
    }

    if (profile.cpu) {
      console.log(`  CPU User: ${profile.cpu.user.toFixed(3)}ms`);
      console.log(`  CPU System: ${profile.cpu.system.toFixed(3)}ms`);
    }

    if (profile.error) {
      console.log(`  Error: ${profile.error}`);
    }
  }

  /**
   * Get profile statistics
   */
  getStats(name) {
    const profiles = this.profiles.get(name);

    if (!profiles || profiles.length === 0) {
      return null;
    }

    const durations = profiles.map(p => p.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

    return {
      name,
      count: profiles.length,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg
      }
    };
  }

  /**
   * Get all statistics
   */
  getAllStats() {
    const stats = {};

    for (const name of this.profiles.keys()) {
      stats[name] = this.getStats(name);
    }

    return stats;
  }
}

const profiler = new OperationProfiler();

// Example profiled operations
async function profiledDatabaseQuery() {
  return profiler.profile('database-query', async () => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    return { rows: Math.floor(Math.random() * 100) };
  });
}

async function profiledApiCall() {
  return profiler.profile('api-call', async () => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
    return { status: 200, data: 'success' };
  });
}

// Run profiled operations
setInterval(() => {
  profiledDatabaseQuery();
  profiledApiCall();
}, 8000);

// =============================================================================
// 7. Comprehensive Performance Dashboard
// =============================================================================

console.log('\n=== 7. Comprehensive Performance Dashboard ===\n');

class PerformanceDashboard {
  constructor() {
    this.eventLoopMonitor = eventLoopMonitor;
    this.asyncTracker = asyncTracker;
    this.profiler = profiler;
    this.startTime = Date.now();
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const uptime = Date.now() - this.startTime;

    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║  PERFORMANCE DASHBOARD                            ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log(`Uptime: ${Math.floor(uptime / 1000)}s\n`);

    // Event Loop
    const eventLoopStats = this.eventLoopMonitor.getStats();
    if (eventLoopStats) {
      console.log('Event Loop Lag:');
      console.log(`  Average: ${eventLoopStats.avg}ms`);
      console.log(`  P50: ${eventLoopStats.p50}ms`);
      console.log(`  P95: ${eventLoopStats.p95}ms`);
      console.log(`  P99: ${eventLoopStats.p99}ms`);
      console.log(`  Max: ${eventLoopStats.max}ms`);
      console.log(`  Severity: OK=${eventLoopStats.severityCounts.ok} `+
                  `WARN=${eventLoopStats.severityCounts.warning} `+
                  `CRIT=${eventLoopStats.severityCounts.critical}\n`);
    }

    // Async Operations
    const asyncStats = this.asyncTracker.getStats();
    console.log('Async Operations:');
    console.log(`  Active: ${asyncStats.active}`);
    console.log(`  Completed: ${asyncStats.completed}`);
    if (asyncStats.avgDuration) {
      console.log(`  Avg Duration: ${asyncStats.avgDuration}ms`);
      console.log(`  Min/Max: ${asyncStats.minDuration}ms / ${asyncStats.maxDuration}ms\n`);
    }

    // Profiler Stats
    const profilerStats = this.profiler.getAllStats();
    if (Object.keys(profilerStats).length > 0) {
      console.log('Profiled Operations:');
      for (const [name, stats] of Object.entries(profilerStats)) {
        if (stats) {
          console.log(`  ${name}:`);
          console.log(`    Count: ${stats.count}`);
          console.log(`    Avg: ${stats.duration.avg.toFixed(2)}ms`);
          console.log(`    Min/Max: ${stats.duration.min.toFixed(2)}ms / ${stats.duration.max.toFixed(2)}ms`);
        }
      }
      console.log('');
    }

    // System Resources
    const mem = process.memoryUsage();
    console.log('Memory:');
    console.log(`  Heap: ${Math.round(mem.heapUsed / 1024 / 1024)}MB / ${Math.round(mem.heapTotal / 1024 / 1024)}MB`);
    console.log(`  RSS: ${Math.round(mem.rss / 1024 / 1024)}MB\n`);

    console.log('═'.repeat(53) + '\n');
  }

  /**
   * Start dashboard
   */
  start(interval = 30000) {
    console.log(`[Dashboard] Starting with ${interval}ms interval\n`);

    setInterval(() => {
      this.generateReport();
    }, interval);

    // Initial report
    setTimeout(() => {
      this.generateReport();
    }, 10000);
  }
}

const dashboard = new PerformanceDashboard();
dashboard.start(30000);

// =============================================================================
// Summary and Best Practices
// =============================================================================

console.log('\n=== Performance Monitoring Best Practices ===\n');

console.log(`
Performance Monitoring Guidelines:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Event Loop Monitoring:
   • Monitor lag continuously
   • Set appropriate thresholds (50ms warning, 200ms critical)
   • Alert on sustained high lag
   • Identify blocking operations
   • Use async alternatives

2. Async Operation Tracking:
   • Track all long-running operations
   • Measure operation duration
   • Identify slow operations
   • Monitor active operation count
   • Set operation timeouts

3. Performance Timing:
   • Use performance.now() for high-resolution timing
   • Create marks for important events
   • Measure between marks
   • Track operation phases
   • Export metrics to monitoring

4. Performance Observers:
   • Observe marks and measures
   • Track function performance
   • Monitor GC events
   • Analyze performance entries
   • Automate performance analysis

5. Operation Profiling:
   • Profile critical paths
   • Measure CPU and memory impact
   • Compare operation variants
   • Identify optimization opportunities
   • Track performance regressions

6. Metrics to Monitor:
   • Event loop lag (p50, p95, p99)
   • Operation duration
   • Memory usage trends
   • CPU usage
   • Active async operations
   • Request latency

7. Alerting Strategy:
   • Set baseline performance
   • Define SLAs/SLOs
   • Alert on threshold violations
   • Track performance trends
   • Correlate with deployments

8. Performance Budgets:
   • Set maximum event loop lag
   • Define operation time limits
   • Track budget compliance
   • Fail builds on violations
   • Review regularly

9. Optimization Workflow:
   • Measure before optimizing
   • Identify bottlenecks
   • Optimize critical path
   • Measure after changes
   • Avoid premature optimization

10. Production Monitoring:
    • Export metrics to monitoring systems
    • Create performance dashboards
    • Set up alerts
    • Track over time
    • Compare across instances

Tools and APIs:
───────────────
• performance.now() - High-resolution time
• performance.mark() - Create marks
• performance.measure() - Measure duration
• PerformanceObserver - Observe entries
• process.cpuUsage() - CPU time
• process.memoryUsage() - Memory stats

Current Status:
───────────────
Process ID: ${process.pid}
Uptime: ${Math.floor(process.uptime())}s

Monitoring active:
• Event Loop Monitor
• Async Operation Tracker
• Performance Observer
• Operation Profiler
• Performance Dashboard
`);

console.log('\nPerformance monitoring active. Dashboard will update periodically.\n');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[SIGINT] Generating final performance report...\n');

  dashboard.generateReport();

  eventLoopMonitor.stop();
  perfMonitor.stop();

  console.log('Performance monitoring stopped.\n');
  process.exit(0);
});
