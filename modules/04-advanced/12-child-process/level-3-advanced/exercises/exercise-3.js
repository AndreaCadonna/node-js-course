/**
 * Exercise 3: Process Monitor with Statistics
 *
 * Create a comprehensive process monitoring system that:
 * - Tracks multiple running processes
 * - Collects performance metrics
 * - Detects anomalies
 * - Generates alerts
 * - Provides real-time statistics
 * - Exports metrics for dashboards
 *
 * Requirements:
 * 1. Monitor CPU and memory usage per process
 * 2. Track process uptime and restart count
 * 3. Detect performance anomalies (spikes, degradation)
 * 4. Generate alerts based on thresholds
 * 5. Collect time-series metrics
 * 6. Calculate statistics (avg, min, max, percentiles)
 * 7. Export metrics in standard format (e.g., JSON, Prometheus)
 *
 * Bonus:
 * - Add custom metric collection from workers
 * - Implement metric aggregation across processes
 * - Add historical data persistence
 * - Create alerting rules engine
 */

const { fork } = require('child_process');
const { EventEmitter } = require('events');

/**
 * ProcessMonitor - Monitor and collect metrics from processes
 *
 * YOUR TASK: Implement this class with all required features
 */
class ProcessMonitor extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.sampleInterval = options.sampleInterval || 1000; // 1 second
    this.historySize = options.historySize || 100;
    this.alertThresholds = options.alertThresholds || {
      cpu: 80,      // CPU percentage
      memory: 512,  // MB
      errors: 10    // Error count
    };

    // TODO: Initialize state
    // - processes Map
    // - metrics storage
    // - alert rules
    // - timers
  }

  /**
   * Start monitoring a process
   * TODO: Add process to monitoring
   *
   * @param {string} name - Process identifier
   * @param {ChildProcess} childProcess - Process to monitor
   */
  monitorProcess(name, childProcess) {
    // TODO: Implement process monitoring
    // 1. Create process metadata
    // 2. Setup metric collection
    // 3. Start sampling
    // 4. Setup event listeners
    throw new Error('Not implemented');
  }

  /**
   * Collect metrics for a process
   * TODO: Sample current resource usage
   */
  async collectMetrics(processInfo) {
    // TODO: Implement metric collection
    // 1. Get CPU usage (process.cpuUsage)
    // 2. Get memory usage (process.memoryUsage)
    // 3. Get uptime
    // 4. Collect custom metrics from worker
    // 5. Store in time-series
    throw new Error('Not implemented');
  }

  /**
   * Calculate statistics for a process
   * TODO: Compute statistical measures
   */
  calculateStats(processName, metricName, period = 60000) {
    // TODO: Calculate statistics
    // 1. Get samples from last period
    // 2. Calculate: avg, min, max, median
    // 3. Calculate percentiles (p50, p95, p99)
    // 4. Return stats object
    throw new Error('Not implemented');
  }

  /**
   * Calculate percentile
   * TODO: Calculate Nth percentile from data
   */
  calculatePercentile(values, percentile) {
    // TODO: Implement percentile calculation
    // 1. Sort values
    // 2. Find index: (percentile/100) * length
    // 3. Return value at index
    throw new Error('Not implemented');
  }

  /**
   * Detect anomalies
   * TODO: Identify unusual patterns in metrics
   */
  detectAnomalies(processInfo, metrics) {
    // TODO: Implement anomaly detection
    // 1. Compare with historical baseline
    // 2. Check for sudden spikes
    // 3. Check for degradation trends
    // 4. Return anomalies found
    throw new Error('Not implemented');
  }

  /**
   * Check alert thresholds
   * TODO: Evaluate metrics against thresholds
   */
  checkAlerts(processInfo, metrics) {
    // TODO: Implement alert checking
    // 1. Check each metric against threshold
    // 2. Track alert state (to avoid spam)
    // 3. Emit alert events
    // 4. Update alert history
    throw new Error('Not implemented');
  }

  /**
   * Get current metrics for a process
   * TODO: Return latest metrics
   */
  getCurrentMetrics(processName) {
    // TODO: Return current state
    // - Latest metric values
    // - Process status
    // - Active alerts
    throw new Error('Not implemented');
  }

  /**
   * Get historical metrics
   * TODO: Return time-series data
   */
  getHistoricalMetrics(processName, metricName, period = 60000) {
    // TODO: Return historical data
    // 1. Filter by time period
    // 2. Return samples with timestamps
    throw new Error('Not implemented');
  }

  /**
   * Get metrics for all processes
   * TODO: Return aggregated metrics
   */
  getAllMetrics() {
    // TODO: Return all process metrics
    // - Per-process current metrics
    // - Aggregate metrics (total CPU, memory, etc.)
    // - Alert summary
    throw new Error('Not implemented');
  }

  /**
   * Export metrics in Prometheus format
   * TODO: Format metrics for Prometheus scraping
   */
  exportPrometheus() {
    // TODO: Export in Prometheus format
    // # HELP metric_name Description
    // # TYPE metric_name gauge
    // metric_name{label="value"} value timestamp
    throw new Error('Not implemented');
  }

  /**
   * Export metrics as JSON
   * TODO: Export in JSON format
   */
  exportJSON() {
    // TODO: Export as JSON
    // {
    //   timestamp: Date.now(),
    //   processes: { ... },
    //   aggregates: { ... }
    // }
    throw new Error('Not implemented');
  }

  /**
   * Get performance report
   * TODO: Generate human-readable report
   */
  getReport() {
    // TODO: Generate report
    // - Summary statistics
    // - Alert history
    // - Performance trends
    // - Recommendations
    throw new Error('Not implemented');
  }

  /**
   * Stop monitoring a process
   * TODO: Clean up monitoring for process
   */
  stopMonitoring(processName) {
    // TODO: Cleanup
    // 1. Stop sampling
    // 2. Clear timers
    // 3. Archive metrics if needed
    // 4. Remove from processes
    throw new Error('Not implemented');
  }

  /**
   * Stop monitoring all processes
   * TODO: Shutdown monitor
   */
  shutdown() {
    // TODO: Cleanup all monitoring
    throw new Error('Not implemented');
  }
}

/**
 * MetricCollector - Collects custom metrics from workers
 */
class MetricCollector {
  constructor() {
    this.metrics = new Map();
  }

  /**
   * Record a metric
   * TODO: Store a metric value
   */
  record(name, value, labels = {}) {
    // TODO: Implement metric recording
    // Support different metric types:
    // - Counter: only increases
    // - Gauge: can go up or down
    // - Histogram: distribution of values
    throw new Error('Not implemented');
  }

  /**
   * Increment a counter
   * TODO: Increment counter metric
   */
  increment(name, delta = 1, labels = {}) {
    // TODO: Increment counter
    throw new Error('Not implemented');
  }

  /**
   * Set a gauge value
   * TODO: Set gauge metric
   */
  gauge(name, value, labels = {}) {
    // TODO: Set gauge
    throw new Error('Not implemented');
  }

  /**
   * Record histogram value
   * TODO: Add value to histogram
   */
  histogram(name, value, labels = {}) {
    // TODO: Record in histogram
    // Track: count, sum, buckets
    throw new Error('Not implemented');
  }

  /**
   * Get all metrics
   * TODO: Return collected metrics
   */
  getMetrics() {
    // TODO: Return all metrics
    throw new Error('Not implemented');
  }

  /**
   * Reset all metrics
   * TODO: Clear metrics
   */
  reset() {
    // TODO: Reset metrics
    throw new Error('Not implemented');
  }
}

/**
 * Test your implementation
 */
async function test() {
  console.log('=== Testing Process Monitor ===\n');

  const fs = require('fs');
  const path = require('path');

  // Create test worker
  const workerCode = `
const collector = {
  requests: 0,
  errors: 0
};

setInterval(() => {
  // Simulate work
  collector.requests++;
  if (Math.random() < 0.1) collector.errors++;

  // Send custom metrics
  if (process.send) {
    process.send({
      type: 'metrics',
      data: {
        requests: collector.requests,
        errors: collector.errors,
        customMetric: Math.random() * 100
      }
    });
  }
}, 1000);

process.on('message', (msg) => {
  if (msg.type === 'shutdown') process.exit(0);
});
`;

  const workerPath = path.join(__dirname, 'test-monitor-worker.js');
  fs.writeFileSync(workerPath, workerCode);

  try {
    const monitor = new ProcessMonitor({
      sampleInterval: 1000,
      historySize: 60,
      alertThresholds: {
        cpu: 50,
        memory: 100,
        errors: 5
      }
    });

    // Start monitoring workers
    console.log('Starting workers...');
    const workers = [];

    for (let i = 1; i <= 3; i++) {
      const worker = fork(workerPath);
      workers.push(worker);
      monitor.monitorProcess(`worker-${i}`, worker);
    }

    console.log('✓ Monitoring started\n');

    // Let it run and collect metrics
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Get statistics
    console.log('=== Statistics ===\n');
    const stats = monitor.getAllMetrics();
    console.log(JSON.stringify(stats, null, 2));

    // Get report
    console.log('\n=== Report ===\n');
    const report = monitor.getReport();
    console.log(report);

    // Export metrics
    console.log('\n=== Prometheus Export ===\n');
    console.log(monitor.exportPrometheus());

    // Cleanup
    workers.forEach(w => w.kill());
    monitor.shutdown();
    fs.unlinkSync(workerPath);

    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Uncomment to test
// test().catch(console.error);

module.exports = { ProcessMonitor, MetricCollector };

/**
 * Hints:
 *
 * 1. Metric Collection:
 *    - Use setInterval for periodic sampling
 *    - Store as time-series: { timestamp, value }
 *    - Keep last N samples in memory
 *
 * 2. Statistics:
 *    - Average: sum / count
 *    - Median: sort and take middle value
 *    - Percentile: sort and take value at position
 *
 * 3. Anomaly Detection:
 *    - Calculate moving average
 *    - Check if current > avg * threshold
 *    - Track rate of change
 *
 * 4. Alerting:
 *    - Keep alert state to avoid spam
 *    - Only alert on state changes
 *    - Include context in alerts
 *
 * 5. Prometheus Format:
 *    - metric_name{label="value"} value
 *    - One metric per line
 *    - Include HELP and TYPE comments
 *
 * 6. Performance:
 *    - Limit history size
 *    - Use circular buffer
 *    - Aggregate old data
 */
