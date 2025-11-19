/**
 * 03-resource-monitoring.js
 *
 * Resource Monitoring in Node.js
 *
 * This example demonstrates production-ready resource monitoring patterns including:
 * - Memory usage monitoring and leak detection
 * - CPU usage tracking
 * - Threshold-based alerting
 * - Resource trend analysis
 * - Automatic memory snapshots
 * - Process health scoring
 * - Resource-based scaling decisions
 *
 * Monitoring is essential for:
 * - Detecting memory leaks early
 * - Preventing OOM (Out of Memory) crashes
 * - Optimizing resource allocation
 * - Capacity planning
 * - Auto-scaling decisions
 * - Performance troubleshooting
 *
 * Key Metrics:
 * - Heap usage (used, total, limit)
 * - External memory
 * - RSS (Resident Set Size)
 * - CPU usage (user, system)
 * - Event loop lag
 *
 * @module resource-monitoring
 * @level intermediate
 */

'use strict';

const { EventEmitter } = require('events');
const os = require('os');

// =============================================================================
// 1. Basic Memory Monitoring
// =============================================================================

console.log('\n=== 1. Basic Memory Monitoring ===\n');

class MemoryMonitor {
  constructor(interval = 5000) {
    this.interval = interval;
    this.timer = null;
    this.samples = [];
    this.maxSamples = 100;
  }

  /**
   * Start monitoring memory usage
   */
  start() {
    console.log(`[MemoryMonitor] Starting monitoring (interval: ${this.interval}ms)`);

    this.timer = setInterval(() => {
      this.collectSample();
    }, this.interval);

    // Initial sample
    this.collectSample();
  }

  /**
   * Collect a memory sample
   */
  collectSample() {
    const memUsage = process.memoryUsage();
    const sample = {
      timestamp: Date.now(),
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers
    };

    // Add derived metrics
    sample.heapUsedPercent = (sample.heapUsed / sample.heapTotal) * 100;
    sample.rssMB = Math.round(sample.rss / 1024 / 1024);
    sample.heapUsedMB = Math.round(sample.heapUsed / 1024 / 1024);
    sample.heapTotalMB = Math.round(sample.heapTotal / 1024 / 1024);

    this.samples.push(sample);

    // Keep only last N samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    this.reportSample(sample);
  }

  /**
   * Report current sample
   */
  reportSample(sample) {
    console.log(`[MemoryMonitor] ${new Date(sample.timestamp).toISOString()}`);
    console.log(`  RSS:         ${sample.rssMB} MB`);
    console.log(`  Heap Used:   ${sample.heapUsedMB} MB / ${sample.heapTotalMB} MB (${sample.heapUsedPercent.toFixed(1)}%)`);
    console.log(`  External:    ${Math.round(sample.external / 1024 / 1024)} MB`);
    console.log(`  ArrayBuffers: ${Math.round(sample.arrayBuffers / 1024 / 1024)} MB`);
  }

  /**
   * Get memory statistics
   */
  getStats() {
    if (this.samples.length === 0) {
      return null;
    }

    const heapUsedValues = this.samples.map(s => s.heapUsed);
    const rssValues = this.samples.map(s => s.rss);

    return {
      sampleCount: this.samples.length,
      heapUsed: {
        current: heapUsedValues[heapUsedValues.length - 1],
        min: Math.min(...heapUsedValues),
        max: Math.max(...heapUsedValues),
        avg: heapUsedValues.reduce((a, b) => a + b, 0) / heapUsedValues.length
      },
      rss: {
        current: rssValues[rssValues.length - 1],
        min: Math.min(...rssValues),
        max: Math.max(...rssValues),
        avg: rssValues.reduce((a, b) => a + b, 0) / rssValues.length
      }
    };
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[MemoryMonitor] Monitoring stopped');
    }
  }
}

const memoryMonitor = new MemoryMonitor(10000);
memoryMonitor.start();

// =============================================================================
// 2. CPU Monitoring
// =============================================================================

console.log('\n=== 2. CPU Monitoring ===\n');

class CPUMonitor {
  constructor(interval = 5000) {
    this.interval = interval;
    this.timer = null;
    this.lastUsage = null;
    this.samples = [];
    this.maxSamples = 100;
  }

  /**
   * Start monitoring CPU usage
   */
  start() {
    console.log(`[CPUMonitor] Starting monitoring (interval: ${this.interval}ms)`);
    this.lastUsage = process.cpuUsage();

    this.timer = setInterval(() => {
      this.collectSample();
    }, this.interval);
  }

  /**
   * Collect CPU usage sample
   */
  collectSample() {
    const currentUsage = process.cpuUsage(this.lastUsage);
    const sample = {
      timestamp: Date.now(),
      user: currentUsage.user,
      system: currentUsage.system,
      total: currentUsage.user + currentUsage.system
    };

    // Convert microseconds to milliseconds
    sample.userMS = sample.user / 1000;
    sample.systemMS = sample.system / 1000;
    sample.totalMS = sample.total / 1000;

    // Calculate percentage over interval
    sample.userPercent = (sample.userMS / this.interval) * 100;
    sample.systemPercent = (sample.systemMS / this.interval) * 100;
    sample.totalPercent = (sample.totalMS / this.interval) * 100;

    this.samples.push(sample);
    this.lastUsage = process.cpuUsage();

    // Keep only last N samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    this.reportSample(sample);
  }

  /**
   * Report current sample
   */
  reportSample(sample) {
    console.log(`[CPUMonitor] ${new Date(sample.timestamp).toISOString()}`);
    console.log(`  User:   ${sample.userMS.toFixed(2)} ms (${sample.userPercent.toFixed(1)}%)`);
    console.log(`  System: ${sample.systemMS.toFixed(2)} ms (${sample.systemPercent.toFixed(1)}%)`);
    console.log(`  Total:  ${sample.totalMS.toFixed(2)} ms (${sample.totalPercent.toFixed(1)}%)`);
  }

  /**
   * Get CPU statistics
   */
  getStats() {
    if (this.samples.length === 0) {
      return null;
    }

    const totalPercents = this.samples.map(s => s.totalPercent);

    return {
      sampleCount: this.samples.length,
      current: totalPercents[totalPercents.length - 1],
      min: Math.min(...totalPercents),
      max: Math.max(...totalPercents),
      avg: totalPercents.reduce((a, b) => a + b, 0) / totalPercents.length
    };
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[CPUMonitor] Monitoring stopped');
    }
  }
}

const cpuMonitor = new CPUMonitor(10000);
cpuMonitor.start();

// =============================================================================
// 3. Threshold-Based Alerting
// =============================================================================

console.log('\n=== 3. Threshold-Based Alerting ===\n');

class ResourceAlerter extends EventEmitter {
  constructor() {
    super();
    this.thresholds = {
      heapUsedPercent: { warning: 70, critical: 85 },
      heapTotalMB: { warning: 1024, critical: 1536 },
      rssMB: { warning: 1536, critical: 2048 },
      cpuPercent: { warning: 70, critical: 90 }
    };
    this.alerts = [];
    this.alertCooldown = 60000; // 1 minute
    this.lastAlerts = new Map();
  }

  /**
   * Check memory thresholds
   */
  checkMemory(sample) {
    const alerts = [];

    // Check heap used percentage
    if (sample.heapUsedPercent >= this.thresholds.heapUsedPercent.critical) {
      alerts.push({
        severity: 'critical',
        metric: 'heapUsedPercent',
        value: sample.heapUsedPercent.toFixed(1),
        threshold: this.thresholds.heapUsedPercent.critical,
        message: `Heap usage critical: ${sample.heapUsedPercent.toFixed(1)}%`
      });
    } else if (sample.heapUsedPercent >= this.thresholds.heapUsedPercent.warning) {
      alerts.push({
        severity: 'warning',
        metric: 'heapUsedPercent',
        value: sample.heapUsedPercent.toFixed(1),
        threshold: this.thresholds.heapUsedPercent.warning,
        message: `Heap usage warning: ${sample.heapUsedPercent.toFixed(1)}%`
      });
    }

    // Check RSS
    if (sample.rssMB >= this.thresholds.rssMB.critical) {
      alerts.push({
        severity: 'critical',
        metric: 'rssMB',
        value: sample.rssMB,
        threshold: this.thresholds.rssMB.critical,
        message: `RSS critical: ${sample.rssMB} MB`
      });
    } else if (sample.rssMB >= this.thresholds.rssMB.warning) {
      alerts.push({
        severity: 'warning',
        metric: 'rssMB',
        value: sample.rssMB,
        threshold: this.thresholds.rssMB.warning,
        message: `RSS warning: ${sample.rssMB} MB`
      });
    }

    return alerts;
  }

  /**
   * Check CPU thresholds
   */
  checkCPU(sample) {
    const alerts = [];

    if (sample.totalPercent >= this.thresholds.cpuPercent.critical) {
      alerts.push({
        severity: 'critical',
        metric: 'cpuPercent',
        value: sample.totalPercent.toFixed(1),
        threshold: this.thresholds.cpuPercent.critical,
        message: `CPU usage critical: ${sample.totalPercent.toFixed(1)}%`
      });
    } else if (sample.totalPercent >= this.thresholds.cpuPercent.warning) {
      alerts.push({
        severity: 'warning',
        metric: 'cpuPercent',
        value: sample.totalPercent.toFixed(1),
        threshold: this.thresholds.cpuPercent.warning,
        message: `CPU usage warning: ${sample.totalPercent.toFixed(1)}%`
      });
    }

    return alerts;
  }

  /**
   * Emit alert with cooldown
   */
  emitAlert(alert) {
    const key = `${alert.metric}-${alert.severity}`;
    const lastAlert = this.lastAlerts.get(key);
    const now = Date.now();

    // Check cooldown
    if (lastAlert && (now - lastAlert) < this.alertCooldown) {
      return; // Skip duplicate alert within cooldown period
    }

    this.lastAlerts.set(key, now);
    alert.timestamp = now;
    this.alerts.push(alert);

    // Emit event
    this.emit('alert', alert);

    // Log alert
    const symbol = alert.severity === 'critical' ? '🔴' : '⚠️';
    console.log(`\n[ALERT ${alert.severity.toUpperCase()}] ${symbol} ${alert.message}`);
    console.log(`  Metric: ${alert.metric}`);
    console.log(`  Current: ${alert.value}`);
    console.log(`  Threshold: ${alert.threshold}`);
  }

  /**
   * Get alert history
   */
  getAlertHistory() {
    return this.alerts;
  }
}

const alerter = new ResourceAlerter();

// Listen for alerts
alerter.on('alert', (alert) => {
  // In production, send to monitoring system
  console.log(`[AlertHandler] Would send ${alert.severity} alert to monitoring system`);
});

// =============================================================================
// 4. Memory Leak Detection
// =============================================================================

console.log('\n=== 4. Memory Leak Detection ===\n');

class MemoryLeakDetector {
  constructor(checkInterval = 30000) {
    this.checkInterval = checkInterval;
    this.samples = [];
    this.maxSamples = 10;
    this.timer = null;
    this.leakDetected = false;
  }

  /**
   * Start leak detection
   */
  start() {
    console.log(`[LeakDetector] Starting detection (interval: ${this.checkInterval}ms)`);

    this.timer = setInterval(() => {
      this.checkForLeak();
    }, this.checkInterval);
  }

  /**
   * Check for memory leak
   */
  checkForLeak() {
    const memUsage = process.memoryUsage();
    const sample = {
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      rss: memUsage.rss
    };

    this.samples.push(sample);

    // Keep only last N samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    // Need at least 5 samples to detect trend
    if (this.samples.length < 5) {
      console.log(`[LeakDetector] Collecting samples... (${this.samples.length}/${this.maxSamples})`);
      return;
    }

    const trend = this.analyzeTrend();

    if (trend.isIncreasing && trend.slope > 1024 * 1024) { // > 1MB/sample
      this.leakDetected = true;
      console.log('\n[LeakDetector] ⚠️  POTENTIAL MEMORY LEAK DETECTED');
      console.log(`  Trend: ${trend.direction}`);
      console.log(`  Slope: ${(trend.slope / 1024 / 1024).toFixed(2)} MB per sample`);
      console.log(`  Samples: ${this.samples.length}`);
      console.log(`  Current heap: ${Math.round(sample.heapUsed / 1024 / 1024)} MB`);
      console.log(`  Recommendation: Investigate growing memory usage`);
    } else {
      console.log(`[LeakDetector] Memory trend: ${trend.direction} (slope: ${(trend.slope / 1024).toFixed(2)} KB/sample)`);
    }
  }

  /**
   * Analyze memory trend using linear regression
   */
  analyzeTrend() {
    const n = this.samples.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = this.samples.map(s => s.heapUsed);

    // Calculate means
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;

    // Calculate slope
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (y[i] - meanY);
      denominator += (x[i] - meanX) ** 2;
    }

    const slope = numerator / denominator;

    return {
      slope,
      isIncreasing: slope > 0,
      isDecreasing: slope < 0,
      direction: slope > 100000 ? 'increasing' : slope < -100000 ? 'decreasing' : 'stable'
    };
  }

  /**
   * Stop detection
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[LeakDetector] Detection stopped');
    }
  }
}

const leakDetector = new MemoryLeakDetector(15000);
leakDetector.start();

// =============================================================================
// 5. Comprehensive Resource Monitor
// =============================================================================

console.log('\n=== 5. Comprehensive Resource Monitor ===\n');

class ResourceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.interval = options.interval || 5000;
    this.enableAlerts = options.enableAlerts !== false;
    this.timer = null;
    this.samples = [];
    this.maxSamples = 100;
    this.startTime = Date.now();
    this.alerter = new ResourceAlerter();
  }

  /**
   * Start comprehensive monitoring
   */
  start() {
    console.log(`[ResourceMonitor] Starting comprehensive monitoring`);
    console.log(`  Interval: ${this.interval}ms`);
    console.log(`  Alerts: ${this.enableAlerts ? 'enabled' : 'disabled'}`);

    this.timer = setInterval(() => {
      this.collectSample();
    }, this.interval);

    // Collect initial sample
    this.collectSample();
  }

  /**
   * Collect comprehensive resource sample
   */
  collectSample() {
    const sample = this.gatherMetrics();
    this.samples.push(sample);

    // Keep only last N samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    // Check thresholds
    if (this.enableAlerts) {
      const memoryAlerts = this.alerter.checkMemory(sample.memory);
      const cpuAlerts = this.alerter.checkCPU(sample.cpu);

      [...memoryAlerts, ...cpuAlerts].forEach(alert => {
        this.alerter.emitAlert(alert);
      });
    }

    // Emit sample event
    this.emit('sample', sample);

    // Report sample
    this.reportSample(sample);
  }

  /**
   * Gather all metrics
   */
  gatherMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
        rssMB: Math.round(memUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsedPercent: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        total: cpuUsage.user + cpuUsage.system,
        userMS: cpuUsage.user / 1000,
        systemMS: cpuUsage.system / 1000,
        totalMS: (cpuUsage.user + cpuUsage.system) / 1000,
        userPercent: (cpuUsage.user / 1000 / this.interval) * 100,
        systemPercent: (cpuUsage.system / 1000 / this.interval) * 100,
        totalPercent: ((cpuUsage.user + cpuUsage.system) / 1000 / this.interval) * 100
      },
      system: {
        loadavg: os.loadavg(),
        freemem: os.freemem(),
        totalmem: os.totalmem(),
        freememMB: Math.round(os.freemem() / 1024 / 1024),
        totalmemMB: Math.round(os.totalmem() / 1024 / 1024),
        memoryUsagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      }
    };
  }

  /**
   * Report current sample
   */
  reportSample(sample) {
    console.log(`\n[ResourceMonitor] ${new Date(sample.timestamp).toISOString()}`);
    console.log(`  Uptime: ${Math.floor(sample.uptime)}s`);
    console.log(`\n  Memory:`);
    console.log(`    RSS:         ${sample.memory.rssMB} MB`);
    console.log(`    Heap:        ${sample.memory.heapUsedMB} / ${sample.memory.heapTotalMB} MB (${sample.memory.heapUsedPercent.toFixed(1)}%)`);
    console.log(`    External:    ${Math.round(sample.memory.external / 1024 / 1024)} MB`);
    console.log(`\n  CPU:`);
    console.log(`    User:        ${sample.cpu.userPercent.toFixed(1)}%`);
    console.log(`    System:      ${sample.cpu.systemPercent.toFixed(1)}%`);
    console.log(`    Total:       ${sample.cpu.totalPercent.toFixed(1)}%`);
    console.log(`\n  System:`);
    console.log(`    Load Avg:    ${sample.system.loadavg.map(l => l.toFixed(2)).join(', ')}`);
    console.log(`    Free Mem:    ${sample.system.freememMB} / ${sample.system.totalmemMB} MB`);
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    if (this.samples.length === 0) {
      return null;
    }

    const heapUsed = this.samples.map(s => s.memory.heapUsed);
    const rss = this.samples.map(s => s.memory.rss);
    const cpu = this.samples.map(s => s.cpu.totalPercent);

    return {
      sampleCount: this.samples.length,
      duration: Date.now() - this.startTime,
      memory: {
        heapUsed: {
          current: heapUsed[heapUsed.length - 1],
          min: Math.min(...heapUsed),
          max: Math.max(...heapUsed),
          avg: heapUsed.reduce((a, b) => a + b, 0) / heapUsed.length
        },
        rss: {
          current: rss[rss.length - 1],
          min: Math.min(...rss),
          max: Math.max(...rss),
          avg: rss.reduce((a, b) => a + b, 0) / rss.length
        }
      },
      cpu: {
        current: cpu[cpu.length - 1],
        min: Math.min(...cpu),
        max: Math.max(...cpu),
        avg: cpu.reduce((a, b) => a + b, 0) / cpu.length
      },
      alerts: this.alerter.getAlertHistory()
    };
  }

  /**
   * Generate health score (0-100)
   */
  getHealthScore() {
    const latest = this.samples[this.samples.length - 1];
    if (!latest) return 100;

    let score = 100;

    // Deduct points for high memory usage
    if (latest.memory.heapUsedPercent > 85) score -= 30;
    else if (latest.memory.heapUsedPercent > 70) score -= 15;

    // Deduct points for high CPU usage
    if (latest.cpu.totalPercent > 90) score -= 30;
    else if (latest.cpu.totalPercent > 70) score -= 15;

    // Deduct points for high system memory usage
    if (latest.system.memoryUsagePercent > 90) score -= 20;
    else if (latest.system.memoryUsagePercent > 80) score -= 10;

    return Math.max(0, score);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('\n[ResourceMonitor] Monitoring stopped');

      // Print final statistics
      const stats = this.getStats();
      console.log('\nFinal Statistics:');
      console.log(JSON.stringify(stats, null, 2));
    }
  }
}

const resourceMonitor = new ResourceMonitor({ interval: 15000 });
resourceMonitor.start();

// =============================================================================
// 6. Simulate Resource Usage
// =============================================================================

console.log('\n=== 6. Simulating Resource Usage ===\n');

// Simulate memory usage by creating objects
let simulatedData = [];

function simulateMemoryUsage() {
  // Add some data
  for (let i = 0; i < 1000; i++) {
    simulatedData.push({
      id: i,
      data: new Array(1000).fill(Math.random()),
      timestamp: Date.now()
    });
  }

  console.log(`[Simulator] Created ${simulatedData.length} objects`);
}

// Simulate CPU usage
function simulateCPUUsage() {
  const start = Date.now();
  let result = 0;

  // Burn CPU for a bit
  while (Date.now() - start < 100) {
    result += Math.sqrt(Math.random());
  }

  console.log(`[Simulator] CPU work completed (result: ${result.toFixed(2)})`);
}

// Run simulations periodically
setInterval(() => {
  simulateMemoryUsage();
  simulateCPUUsage();
}, 20000);

// =============================================================================
// Summary and Best Practices
// =============================================================================

console.log('\n=== Resource Monitoring Best Practices ===\n');

console.log(`
Resource Monitoring Guidelines:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Key Metrics to Monitor:
   Memory:
   • RSS (Resident Set Size): Total memory allocated
   • Heap Used: JavaScript heap usage
   • Heap Total: Total heap size
   • External: C++ objects bound to JS
   • Array Buffers: ArrayBuffer and SharedArrayBuffer

   CPU:
   • User time: Time in application code
   • System time: Time in OS kernel
   • Total usage: Overall CPU consumption

   System:
   • Load average: System load over time
   • Free memory: Available system memory
   • Memory pressure: Overall system health

2. Monitoring Intervals:
   • High-frequency: 1-5 seconds (development/debugging)
   • Medium-frequency: 15-30 seconds (production monitoring)
   • Low-frequency: 1-5 minutes (trend analysis)

3. Threshold Configuration:
   Memory Thresholds:
   • Warning: 70% heap usage
   • Critical: 85% heap usage
   • Emergency: 95% heap usage → trigger restart

   CPU Thresholds:
   • Warning: 70% sustained usage
   • Critical: 90% sustained usage
   • Check: Sustained over multiple samples

4. Alert Strategy:
   • Use cooldown periods to prevent spam
   • Severity levels: info, warning, critical
   • Include context in alerts (current, threshold, trend)
   • Integrate with monitoring systems

5. Memory Leak Detection:
   • Track heap growth over time
   • Use linear regression for trend analysis
   • Alert on sustained growth (> 1MB per sample)
   • Take heap snapshots for investigation

6. Health Scoring:
   • Combine multiple metrics
   • Weight critical metrics higher
   • Use for auto-scaling decisions
   • Trend analysis for predictions

7. Production Integration:
   • Export metrics to monitoring systems
   • Use structured logging
   • Correlate with application events
   • Set up dashboards and alerts

8. Performance Considerations:
   • Monitoring has overhead
   • Don't monitor too frequently
   • Use sampling for high-traffic apps
   • Offload heavy analysis to external systems

9. Heap Snapshots:
   • Take snapshots when leak detected
   • Compare snapshots to find leaks
   • Use Chrome DevTools for analysis
   • Automate snapshot collection

10. Graceful Degradation:
    • When resources high, reduce non-critical work
    • Implement backpressure
    • Reject new requests if needed
    • Consider auto-scaling

Current Status:
─────────────
Process ID: ${process.pid}
Uptime: ${Math.floor(process.uptime())} seconds
Health Score: ${resourceMonitor.getHealthScore()}/100

Monitoring Components:
• Memory Monitor: Running
• CPU Monitor: Running
• Leak Detector: Running
• Resource Monitor: Running
• Alert System: Active

Try triggering alerts by creating memory pressure or CPU load.
Monitor the health score as resource usage changes.
`);

console.log('\nMonitoring active. Press Ctrl+C to stop and see final statistics.\n');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[SIGINT] Stopping all monitors...\n');

  memoryMonitor.stop();
  cpuMonitor.stop();
  leakDetector.stop();
  resourceMonitor.stop();

  process.exit(0);
});
