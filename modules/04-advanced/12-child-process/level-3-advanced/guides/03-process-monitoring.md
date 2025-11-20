# Process Monitoring

Learn how to implement comprehensive monitoring systems for process metrics, health checks, and performance analysis.

## Table of Contents
- [Metrics Collection](#metrics-collection)
- [Health Monitoring](#health-monitoring)
- [Performance Analysis](#performance-analysis)
- [Alerting Systems](#alerting-systems)
- [Metric Export](#metric-export)

---

## Metrics Collection

### Key Metrics to Track

**Process Metrics:**
- CPU usage
- Memory usage (RSS, heap)
- Event loop lag
- Handle count
- Uptime

**Application Metrics:**
- Tasks processed
- Error rates
- Response times
- Queue sizes
- Throughput

### Collecting System Metrics

```javascript
class ProcessMetricsCollector {
  collectMetrics(process) {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();

    return {
      timestamp: Date.now(),
      memory: {
        rss: mem.rss / 1024 / 1024,          // MB
        heapTotal: mem.heapTotal / 1024 / 1024,
        heapUsed: mem.heapUsed / 1024 / 1024,
        external: mem.external / 1024 / 1024
      },
      cpu: {
        user: cpu.user / 1000000,    // Convert to seconds
        system: cpu.system / 1000000
      },
      uptime: process.uptime(),
      pid: process.pid
    };
  }
}
```

### Time-Series Storage

```javascript
class TimeSeriesStore {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.series = new Map(); // metric name -> array of samples
  }

  record(metricName, value, labels = {}) {
    const key = this.makeKey(metricName, labels);

    if (!this.series.has(key)) {
      this.series.set(key, []);
    }

    const samples = this.series.get(key);
    samples.push({
      timestamp: Date.now(),
      value
    });

    // Trim old samples
    if (samples.length > this.maxSize) {
      samples.shift();
    }
  }

  query(metricName, timeRange = 60000) {
    const samples = this.series.get(metricName) || [];
    const cutoff = Date.now() - timeRange;

    return samples.filter(s => s.timestamp > cutoff);
  }

  makeKey(name, labels) {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return labelStr ? `${name}{${labelStr}}` : name;
  }
}
```

---

## Health Monitoring

### Health Check Implementation

```javascript
class HealthChecker {
  constructor(worker, options = {}) {
    this.worker = worker;
    this.interval = options.interval || 5000;
    this.timeout = options.timeout || 3000;
    this.failureThreshold = options.failureThreshold || 3;

    this.consecutiveFailures = 0;
    this.isHealthy = true;
    this.timer = null;
  }

  start() {
    this.timer = setInterval(() => {
      this.performCheck();
    }, this.interval);
  }

  async performCheck() {
    try {
      await Promise.race([
        this.ping(),
        this.timeoutPromise(this.timeout)
      ]);

      this.onSuccess();
    } catch (error) {
      this.onFailure(error);
    }
  }

  async ping() {
    return new Promise((resolve, reject) => {
      const handler = (msg) => {
        if (msg.type === 'pong') {
          this.worker.removeListener('message', handler);
          resolve();
        }
      };

      this.worker.on('message', handler);
      this.worker.send({ type: 'ping' });
    });
  }

  onSuccess() {
    this.consecutiveFailures = 0;
    if (!this.isHealthy) {
      this.isHealthy = true;
      this.emit('healthy');
    }
  }

  onFailure(error) {
    this.consecutiveFailures++;

    if (this.consecutiveFailures >= this.failureThreshold) {
      if (this.isHealthy) {
        this.isHealthy = false;
        this.emit('unhealthy', error);
      }
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
```

### Event Loop Monitoring

```javascript
class EventLoopMonitor {
  constructor(threshold = 50) {
    this.threshold = threshold; // ms
    this.measurements = [];
  }

  start() {
    this.lastCheck = Date.now();
    this.timer = setInterval(() => {
      const now = Date.now();
      const lag = now - this.lastCheck - 1000;

      this.measurements.push({
        timestamp: now,
        lag
      });

      if (lag > this.threshold) {
        console.warn(`Event loop lag: ${lag}ms`);
      }

      this.lastCheck = now;
    }, 1000);
  }

  getStats() {
    if (this.measurements.length === 0) return null;

    const lags = this.measurements.map(m => m.lag);
    return {
      current: lags[lags.length - 1],
      avg: lags.reduce((a, b) => a + b) / lags.length,
      max: Math.max(...lags),
      min: Math.min(...lags)
    };
  }
}
```

---

## Performance Analysis

### Statistical Analysis

```javascript
class StatsCalculator {
  static calculate(values) {
    if (values.length === 0) return null;

    const sorted = values.slice().sort((a, b) => a - b);

    return {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      mean: this.mean(values),
      median: this.median(sorted),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      stdDev: this.stdDev(values)
    };
  }

  static mean(values) {
    return values.reduce((a, b) => a + b) / values.length;
  }

  static median(sorted) {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  static percentile(sorted, p) {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  static stdDev(values) {
    const mean = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquareDiff = this.mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }
}
```

### Anomaly Detection

```javascript
class AnomalyDetector {
  constructor(options = {}) {
    this.windowSize = options.windowSize || 20;
    this.threshold = options.threshold || 3; // standard deviations
    this.history = [];
  }

  check(value) {
    this.history.push(value);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    if (this.history.length < this.windowSize) {
      return { isAnomaly: false };
    }

    const stats = StatsCalculator.calculate(this.history);
    const zScore = Math.abs((value - stats.mean) / stats.stdDev);

    const isAnomaly = zScore > this.threshold;

    return {
      isAnomaly,
      value,
      mean: stats.mean,
      stdDev: stats.stdDev,
      zScore
    };
  }
}
```

---

## Alerting Systems

### Alert Rules

```javascript
class AlertManager {
  constructor() {
    this.rules = new Map();
    this.activeAlerts = new Map();
  }

  addRule(name, condition, options = {}) {
    this.rules.set(name, {
      condition,
      severity: options.severity || 'warning',
      cooldown: options.cooldown || 60000,
      lastTriggered: 0
    });
  }

  evaluate(metrics) {
    const alerts = [];

    for (const [name, rule] of this.rules) {
      if (rule.condition(metrics)) {
        if (this.shouldTrigger(name, rule)) {
          const alert = this.createAlert(name, rule, metrics);
          alerts.push(alert);
          this.activeAlerts.set(name, alert);
          rule.lastTriggered = Date.now();
        }
      } else {
        // Clear alert if condition no longer met
        if (this.activeAlerts.has(name)) {
          alerts.push(this.createClearAlert(name));
          this.activeAlerts.delete(name);
        }
      }
    }

    return alerts;
  }

  shouldTrigger(name, rule) {
    const timeSinceLastAlert = Date.now() - rule.lastTriggered;
    return timeSinceLastAlert >= rule.cooldown;
  }

  createAlert(name, rule, metrics) {
    return {
      name,
      severity: rule.severity,
      message: `Alert ${name} triggered`,
      metrics,
      timestamp: Date.now(),
      state: 'firing'
    };
  }

  createClearAlert(name) {
    return {
      name,
      message: `Alert ${name} cleared`,
      timestamp: Date.now(),
      state: 'resolved'
    };
  }
}
```

---

## Metric Export

### Prometheus Format

```javascript
class PrometheusExporter {
  constructor() {
    this.metrics = new Map();
  }

  gauge(name, value, labels = {}, help = '') {
    this.metrics.set(name, {
      type: 'gauge',
      help,
      value,
      labels
    });
  }

  counter(name, value, labels = {}, help = '') {
    const key = this.metricKey(name, labels);
    const existing = this.metrics.get(key);

    this.metrics.set(key, {
      type: 'counter',
      help,
      value: existing ? existing.value + value : value,
      labels
    });
  }

  export() {
    const lines = [];

    for (const [name, metric] of this.metrics) {
      if (metric.help) {
        lines.push(`# HELP ${name} ${metric.help}`);
      }
      lines.push(`# TYPE ${name} ${metric.type}`);

      const labelStr = Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');

      const metricLine = labelStr
        ? `${name}{${labelStr}} ${metric.value}`
        : `${name} ${metric.value}`;

      lines.push(metricLine);
    }

    return lines.join('\n');
  }
}
```

### JSON Export

```javascript
class JSONExporter {
  export(metrics) {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: metrics
    }, null, 2);
  }
}
```

---

## Best Practices

1. **Collect meaningful metrics** - Focus on what matters
2. **Use appropriate intervals** - Balance overhead and freshness
3. **Set realistic thresholds** - Avoid alert fatigue
4. **Store historical data** - Enable trend analysis
5. **Export to external systems** - Centralize monitoring
6. **Monitor the monitors** - Ensure reliability
7. **Document metrics** - Clear descriptions

---

**Next**: Read [Security Considerations](04-security-considerations.md) for securing process execution.
