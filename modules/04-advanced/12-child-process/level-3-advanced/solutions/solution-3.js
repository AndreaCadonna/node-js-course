/**
 * Solution 3: Process Monitor with Statistics
 *
 * Complete monitoring system with metrics collection, statistical analysis,
 * anomaly detection, alerting, and metric export.
 */

const { EventEmitter } = require('events');

class ProcessMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.sampleInterval = options.sampleInterval || 1000;
    this.historySize = options.historySize || 100;
    this.alertThresholds = options.alertThresholds || {};
    this.processes = new Map();
    this.alertStates = new Map();
  }

  monitorProcess(name, childProcess) {
    const processInfo = {
      name,
      process: childProcess,
      metrics: [],
      startTime: Date.now(),
      samples: 0
    };

    this.processes.set(name, processInfo);

    const timer = setInterval(() => {
      this.collectMetrics(processInfo);
    }, this.sampleInterval);

    processInfo.timer = timer;

    childProcess.on('exit', () => {
      clearInterval(timer);
    });
  }

  async collectMetrics(processInfo) {
    const sample = {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    processInfo.metrics.push(sample);
    processInfo.samples++;

    if (processInfo.metrics.length > this.historySize) {
      processInfo.metrics.shift();
    }

    this.checkAlerts(processInfo, sample);
  }

  calculateStats(processName, metricName, period = 60000) {
    const processInfo = this.processes.get(processName);
    if (!processInfo) return null;

    const cutoff = Date.now() - period;
    const samples = processInfo.metrics.filter(m => m.timestamp > cutoff);

    if (samples.length === 0) return null;

    const values = samples.map(s => {
      if (metricName === 'memory.heapUsed') {
        return s.memory.heapUsed / 1024 / 1024;
      } else if (metricName === 'cpu.user') {
        return s.cpu.user / 1000000;
      }
      return 0;
    });

    return this.computeStats(values);
  }

  computeStats(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    return {
      count: values.length,
      sum,
      mean,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99)
    };
  }

  percentile(sorted, p) {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  checkAlerts(processInfo, sample) {
    const memoryMB = sample.memory.heapUsed / 1024 / 1024;

    if (this.alertThresholds.memory && memoryMB > this.alertThresholds.memory) {
      this.triggerAlert(processInfo.name, 'memory', memoryMB);
    }
  }

  triggerAlert(processName, alertType, value) {
    const key = `${processName}:${alertType}`;

    if (!this.alertStates.has(key)) {
      this.alertStates.set(key, { active: true, lastTriggered: Date.now() });

      this.emit('alert', {
        process: processName,
        type: alertType,
        value,
        timestamp: Date.now()
      });
    }
  }

  getCurrentMetrics(processName) {
    const processInfo = this.processes.get(processName);
    if (!processInfo || processInfo.metrics.length === 0) return null;

    return processInfo.metrics[processInfo.metrics.length - 1];
  }

  getAllMetrics() {
    const result = {};

    for (const [name, info] of this.processes) {
      result[name] = {
        samples: info.samples,
        uptime: Date.now() - info.startTime,
        current: this.getCurrentMetrics(name)
      };
    }

    return result;
  }

  exportPrometheus() {
    const lines = [];

    for (const [name, info] of this.processes) {
      const current = this.getCurrentMetrics(name);
      if (!current) continue;

      lines.push(`# HELP process_memory_bytes Process memory usage`);
      lines.push(`# TYPE process_memory_bytes gauge`);
      lines.push(`process_memory_bytes{process="${name}"} ${current.memory.heapUsed}`);
    }

    return lines.join('\n');
  }

  exportJSON() {
    return JSON.stringify(this.getAllMetrics(), null, 2);
  }

  getReport() {
    const lines = ['=== Process Monitor Report ===\n'];

    for (const [name, info] of this.processes) {
      lines.push(`Process: ${name}`);
      lines.push(`  Uptime: ${Math.round((Date.now() - info.startTime) / 1000)}s`);
      lines.push(`  Samples: ${info.samples}`);

      const stats = this.calculateStats(name, 'memory.heapUsed', 60000);
      if (stats) {
        lines.push(`  Memory (MB):`);
        lines.push(`    Mean: ${stats.mean.toFixed(2)}`);
        lines.push(`    P95: ${stats.p95.toFixed(2)}`);
        lines.push(`    Max: ${stats.max.toFixed(2)}`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  stopMonitoring(processName) {
    const processInfo = this.processes.get(processName);
    if (processInfo && processInfo.timer) {
      clearInterval(processInfo.timer);
      this.processes.delete(processName);
    }
  }

  shutdown() {
    for (const [name] of this.processes) {
      this.stopMonitoring(name);
    }
  }
}

class MetricCollector {
  constructor() {
    this.metrics = new Map();
  }

  record(name, value, labels = {}) {
    const key = this.makeKey(name, labels);
    this.metrics.set(key, { name, value, labels, timestamp: Date.now() });
  }

  increment(name, delta = 1, labels = {}) {
    const key = this.makeKey(name, labels);
    const current = this.metrics.get(key);
    const value = current ? current.value + delta : delta;
    this.record(name, value, labels);
  }

  gauge(name, value, labels = {}) {
    this.record(name, value, labels);
  }

  getMetrics() {
    return Array.from(this.metrics.values());
  }

  makeKey(name, labels) {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }
}

module.exports = { ProcessMonitor, MetricCollector };
