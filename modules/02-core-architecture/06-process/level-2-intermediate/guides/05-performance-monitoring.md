# Performance Monitoring in Node.js

## Introduction

Performance monitoring is the practice of measuring, analyzing, and optimizing how your Node.js application uses system resources and responds to requests. Effective performance monitoring helps you identify bottlenecks, prevent degradation, optimize resource usage, and deliver fast, responsive applications.

This comprehensive guide explores event loop lag monitoring, CPU profiling, memory optimization, request tracing, and production performance analysis. By the end, you'll know how to build high-performance Node.js applications and maintain optimal performance in production.

---

## What Problem Does Performance Monitoring Solve?

### The Challenge

Node.js applications can suffer from various performance issues:

**Event Loop Blocking:**
- Long-running synchronous operations
- CPU-intensive calculations
- Blocking I/O operations
- Large JSON parsing/serialization
- Complex regular expressions

**Memory Issues:**
- Memory leaks that degrade performance
- Excessive garbage collection pauses
- Memory fragmentation
- Large object allocations
- Closure memory retention

**Request Latency:**
- Slow database queries
- Network request delays
- Inefficient algorithms
- Resource contention
- Queue backlogs

**Throughput Problems:**
- Request rate limits
- Connection pool exhaustion
- CPU saturation
- I/O bottlenecks
- Inefficient concurrency

**Without performance monitoring:**
```javascript
// Application runs, but performance degrades over time
app.get('/api/data', async (req, res) => {
  const data = await slowOperation(); // How slow?
  res.json(data);
});

// Problems invisible until:
// - Users complain about slowness
// - Timeout errors appear
// - System becomes unresponsive
// - Production incident occurs
```

### The Solution

Implement comprehensive performance monitoring:

```javascript
// Monitor event loop lag
const lagMonitor = new EventLoopLagMonitor({ threshold: 50 });
lagMonitor.start();

// Track request duration
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1000000;
    metrics.recordRequestDuration(req.path, duration);

    if (duration > 1000) {
      console.warn(`Slow request: ${req.path} took ${duration}ms`);
    }
  });

  next();
});

// Profile CPU usage
const profiler = new CPUProfiler();
if (cpuUsage > 80) {
  profiler.start();
}

// Monitor memory trends
const memMonitor = new MemoryMonitor();
memMonitor.detectLeaks();
```

---

## Real-World Analogies

### Analogy 1: Sports Performance Tracking

**Your Node.js application is like an athlete:**

- **Heart rate monitor (Event Loop)** → Shows how hard you're working
- **Pace tracking (Throughput)** → How fast you're going
- **Form analysis (Profiling)** → Identifies inefficient movements
- **Recovery time (GC pauses)** → Time spent not performing
- **Training log (Metrics)** → Track performance over time
- **Coach feedback (Alerts)** → Tells you when something is wrong

### Analogy 2: Traffic Monitoring System

**Performance monitoring is like traffic cameras:**

- **Speed cameras (Request latency)** → How fast traffic moves
- **Volume counters (Throughput)** → How many cars pass through
- **Congestion detection (Event loop lag)** → Identifies bottlenecks
- **Incident reports (Slow requests)** → Highlights problems
- **Pattern analysis (Trends)** → Identifies rush hours
- **Route optimization (Profiling)** → Finds better paths

### Analogy 3: Factory Production Line

**Your process is like a factory:**

- **Assembly line speed (Event loop)** → How fast work gets done
- **Quality control (Performance tests)** → Ensures standards
- **Bottleneck identification (Profiling)** → Finds slow stations
- **Production metrics (Monitoring)** → Tracks output
- **Efficiency audits (Optimization)** → Improves processes
- **Downtime tracking (Lag detection)** → Minimizes waste

---

## Event Loop Performance Monitoring

### Understanding the Event Loop

```
┌───────────────────────────┐
│         Event Loop         │
│                           │
│  ┌─────────────────────┐  │
│  │  1. Timers          │  │ ← setTimeout, setInterval
│  └─────────────────────┘  │
│           ↓               │
│  ┌─────────────────────┐  │
│  │  2. Pending I/O     │  │ ← I/O callbacks
│  └─────────────────────┘  │
│           ↓               │
│  ┌─────────────────────┐  │
│  │  3. Idle, Prepare   │  │ ← Internal use
│  └─────────────────────┘  │
│           ↓               │
│  ┌─────────────────────┐  │
│  │  4. Poll            │  │ ← Retrieve new I/O events
│  └─────────────────────┘  │
│           ↓               │
│  ┌─────────────────────┐  │
│  │  5. Check           │  │ ← setImmediate callbacks
│  └─────────────────────┘  │
│           ↓               │
│  ┌─────────────────────┐  │
│  │  6. Close           │  │ ← Close callbacks
│  └─────────────────────┘  │
│           ↓               │
│  ┌─────────────────────┐  │
│  │  Has pending work?  │  │
│  └─────────────────────┘  │
│      Yes ↓     No ↓       │
│      Loop    Exit         │
└───────────────────────────┘

Performance Impact:
• Synchronous code blocks ALL phases
• Long-running tasks delay all callbacks
• I/O operations don't block (async)
• CPU-intensive work should be moved to workers
```

### Pattern 1: Advanced Event Loop Lag Monitor

```javascript
// event-loop-lag-monitor.js
const perf_hooks = require('perf_hooks');

class EventLoopLagMonitor {
  constructor(options = {}) {
    this.sampleInterval = options.sampleInterval || 1000; // 1 second
    this.threshold = options.threshold || 50; // 50ms
    this.maxHistory = options.maxHistory || 1000;

    this.history = [];
    this.stats = {
      min: Infinity,
      max: -Infinity,
      avg: 0,
      p50: 0,
      p95: 0,
      p99: 0,
    };

    this.timer = null;
    this.lastCheck = null;
    this.onLag = options.onLag || this.defaultLagHandler;
  }

  start() {
    console.log('Event loop lag monitor started');

    // Use high-resolution time
    this.lastCheck = perf_hooks.performance.now();

    this.timer = setInterval(() => {
      this.measure();
    }, this.sampleInterval);

    // Don't prevent process exit
    this.timer.unref();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  measure() {
    const now = perf_hooks.performance.now();
    const expectedTime = this.lastCheck + this.sampleInterval;
    const lag = Math.max(0, now - expectedTime);

    // Record measurement
    this.history.push({
      timestamp: Date.now(),
      lag,
    });

    // Keep history bounded
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Update statistics
    this.updateStats();

    // Check threshold
    if (lag > this.threshold) {
      this.onLag(lag, this.stats);
    }

    this.lastCheck = now;
  }

  updateStats() {
    const lags = this.history.map(h => h.lag);

    this.stats.min = Math.min(...lags);
    this.stats.max = Math.max(...lags);
    this.stats.avg = lags.reduce((a, b) => a + b, 0) / lags.length;

    // Calculate percentiles
    const sorted = [...lags].sort((a, b) => a - b);
    this.stats.p50 = this.percentile(sorted, 50);
    this.stats.p95 = this.percentile(sorted, 95);
    this.stats.p99 = this.percentile(sorted, 99);
  }

  percentile(sorted, p) {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  defaultLagHandler(lag, stats) {
    console.warn(`⚠️  Event loop lag: ${lag.toFixed(2)}ms`, {
      p95: stats.p95.toFixed(2) + 'ms',
      p99: stats.p99.toFixed(2) + 'ms',
    });
  }

  getStats() {
    return {
      current: this.history[this.history.length - 1]?.lag || 0,
      ...this.stats,
      samples: this.history.length,
    };
  }

  // Get detailed report
  getReport() {
    const stats = this.getStats();

    return {
      summary: {
        average: stats.avg.toFixed(2) + 'ms',
        min: stats.min.toFixed(2) + 'ms',
        max: stats.max.toFixed(2) + 'ms',
        p50: stats.p50.toFixed(2) + 'ms',
        p95: stats.p95.toFixed(2) + 'ms',
        p99: stats.p99.toFixed(2) + 'ms',
      },
      health: this.assessHealth(stats),
      recommendations: this.getRecommendations(stats),
    };
  }

  assessHealth(stats) {
    if (stats.p99 < 10) return 'excellent';
    if (stats.p99 < 50) return 'good';
    if (stats.p99 < 100) return 'fair';
    if (stats.p99 < 500) return 'poor';
    return 'critical';
  }

  getRecommendations(stats) {
    const recommendations = [];

    if (stats.p99 > 100) {
      recommendations.push('High event loop lag detected');
      recommendations.push('Look for CPU-intensive synchronous operations');
      recommendations.push('Consider using worker threads for heavy computation');
    }

    if (stats.max > 1000) {
      recommendations.push('Severe lag spikes detected');
      recommendations.push('Profile application to find blocking operations');
    }

    if (stats.avg > 50) {
      recommendations.push('Average lag is high');
      recommendations.push('Review request handlers for optimization opportunities');
    }

    return recommendations;
  }
}

// Usage
const lagMonitor = new EventLoopLagMonitor({
  sampleInterval: 1000,
  threshold: 50,
  onLag: (lag, stats) => {
    console.warn('Event loop lag detected:', {
      current: lag.toFixed(2) + 'ms',
      p95: stats.p95.toFixed(2) + 'ms',
      p99: stats.p99.toFixed(2) + 'ms',
    });

    // Take action
    if (lag > 500) {
      // Start profiler
      startProfiler();

      // Alert team
      alertTeam('severe-lag', { lag, stats });
    }
  },
});

lagMonitor.start();

// Endpoint to check event loop health
app.get('/metrics/event-loop', (req, res) => {
  res.json(lagMonitor.getReport());
});
```

### Pattern 2: Request Duration Tracking

```javascript
// request-duration-tracker.js
class RequestDurationTracker {
  constructor(options = {}) {
    this.slowThreshold = options.slowThreshold || 1000; // 1 second
    this.verySlowThreshold = options.verySlowThreshold || 5000; // 5 seconds
    this.maxHistory = options.maxHistory || 10000;

    this.requests = new Map(); // Active requests
    this.history = []; // Completed requests
    this.stats = new Map(); // Stats by route
  }

  middleware() {
    return (req, res, next) => {
      const requestId = this.generateId();
      const startTime = process.hrtime.bigint();

      // Track active request
      this.requests.set(requestId, {
        method: req.method,
        path: req.path,
        startTime,
        timestamp: Date.now(),
      });

      // Cleanup on response
      const cleanup = () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to ms

        this.requests.delete(requestId);
        this.recordRequest(req, duration);
      };

      res.on('finish', cleanup);
      res.on('close', cleanup);

      next();
    };
  }

  recordRequest(req, duration) {
    const record = {
      method: req.method,
      path: req.path,
      route: this.normalizeRoute(req.path),
      duration,
      timestamp: Date.now(),
      statusCode: req.res?.statusCode,
    };

    this.history.push(record);

    // Keep history bounded
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Update route statistics
    this.updateRouteStats(record.route, duration);

    // Check for slow requests
    if (duration > this.verySlowThreshold) {
      this.onVerySlowRequest(record);
    } else if (duration > this.slowThreshold) {
      this.onSlowRequest(record);
    }
  }

  normalizeRoute(path) {
    // Normalize dynamic routes: /users/123 -> /users/:id
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[0-9a-f-]{36}/g, '/:uuid');
  }

  updateRouteStats(route, duration) {
    if (!this.stats.has(route)) {
      this.stats.set(route, {
        count: 0,
        total: 0,
        min: Infinity,
        max: -Infinity,
        durations: [],
      });
    }

    const stats = this.stats.get(route);
    stats.count++;
    stats.total += duration;
    stats.min = Math.min(stats.min, duration);
    stats.max = Math.max(stats.max, duration);
    stats.durations.push(duration);

    // Keep last 1000 durations per route
    if (stats.durations.length > 1000) {
      stats.durations.shift();
    }
  }

  onSlowRequest(record) {
    console.warn(`🐌 Slow request: ${record.method} ${record.path}`, {
      duration: record.duration.toFixed(2) + 'ms',
      statusCode: record.statusCode,
    });
  }

  onVerySlowRequest(record) {
    console.error(`🐢 Very slow request: ${record.method} ${record.path}`, {
      duration: record.duration.toFixed(2) + 'ms',
      statusCode: record.statusCode,
    });

    // Could trigger:
    // - Profiler
    // - Detailed logging
    // - Alert
  }

  getRouteStats(route) {
    const stats = this.stats.get(route);

    if (!stats) {
      return null;
    }

    const sorted = [...stats.durations].sort((a, b) => a - b);

    return {
      route,
      count: stats.count,
      avg: stats.total / stats.count,
      min: stats.min,
      max: stats.max,
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
    };
  }

  getAllRouteStats() {
    const allStats = [];

    for (const route of this.stats.keys()) {
      allStats.push(this.getRouteStats(route));
    }

    // Sort by p95 descending (slowest first)
    return allStats.sort((a, b) => b.p95 - a.p95);
  }

  getSlowestRequests(limit = 10) {
    return [...this.history]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  getActiveRequests() {
    const now = Date.now();

    return Array.from(this.requests.values()).map(req => ({
      method: req.method,
      path: req.path,
      duration: now - req.timestamp,
    }));
  }

  percentile(sorted, p) {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getReport() {
    const routeStats = this.getAllRouteStats();
    const slowest = this.getSlowestRequests(10);
    const active = this.getActiveRequests();

    return {
      summary: {
        totalRequests: this.history.length,
        activeRequests: this.requests.size,
        trackedRoutes: this.stats.size,
      },
      slowestRoutes: routeStats.slice(0, 10),
      slowestRequests: slowest,
      activeRequests: active,
    };
  }
}

// Usage
const tracker = new RequestDurationTracker({
  slowThreshold: 1000,
  verySlowThreshold: 5000,
});

app.use(tracker.middleware());

// Metrics endpoint
app.get('/metrics/requests', (req, res) => {
  res.json(tracker.getReport());
});

// Per-route stats
app.get('/metrics/routes/:route(*)', (req, res) => {
  const route = '/' + req.params.route;
  const stats = tracker.getRouteStats(route);

  if (!stats) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }

  res.json(stats);
});
```

---

## CPU Profiling and Optimization

### Pattern 3: CPU Profiler

```javascript
// cpu-profiler.js
const { Session } = require('inspector');
const fs = require('fs').promises;
const path = require('path');

class CPUProfiler {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './profiles';
    this.session = null;
    this.profiling = false;
    this.ensureOutputDir();
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create profile directory:', error);
    }
  }

  start() {
    if (this.profiling) {
      console.log('Profiler already running');
      return false;
    }

    this.session = new Session();
    this.session.connect();

    return new Promise((resolve, reject) => {
      this.session.post('Profiler.enable', (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.session.post('Profiler.start', (err) => {
          if (err) {
            reject(err);
            return;
          }

          this.profiling = true;
          console.log('CPU profiler started');
          resolve(true);
        });
      });
    });
  }

  async stop() {
    if (!this.profiling) {
      return null;
    }

    return new Promise((resolve, reject) => {
      this.session.post('Profiler.stop', async (err, { profile }) => {
        if (err) {
          reject(err);
          return;
        }

        this.profiling = false;
        this.session.disconnect();
        this.session = null;

        // Save profile
        const filename = `cpu-${Date.now()}.cpuprofile`;
        const filepath = path.join(this.outputDir, filename);

        try {
          await fs.writeFile(filepath, JSON.stringify(profile));
          const stats = await fs.stat(filepath);

          console.log('CPU profile saved:', filepath);
          console.log('Size:', (stats.size / 1024).toFixed(2), 'KB');

          const analysis = this.analyzeProfile(profile);

          resolve({
            filepath,
            size: stats.size,
            analysis,
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async profile(duration = 30000) {
    console.log(`Profiling CPU for ${duration}ms`);

    await this.start();

    await new Promise(resolve => setTimeout(resolve, duration));

    const result = await this.stop();

    return result;
  }

  analyzeProfile(profile) {
    const nodes = profile.nodes || [];
    const samples = profile.samples || [];

    // Find hot functions (most sampled)
    const hitCount = new Map();

    samples.forEach(nodeId => {
      hitCount.set(nodeId, (hitCount.get(nodeId) || 0) + 1);
    });

    // Get top functions
    const topFunctions = Array.from(hitCount.entries())
      .map(([nodeId, count]) => {
        const node = nodes.find(n => n.id === nodeId);
        return {
          functionName: node?.callFrame?.functionName || '(anonymous)',
          url: node?.callFrame?.url || '',
          lineNumber: node?.callFrame?.lineNumber,
          hitCount: count,
          percentage: (count / samples.length) * 100,
        };
      })
      .filter(f => f.percentage > 1) // Only functions with >1% time
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, 10);

    return {
      totalSamples: samples.length,
      duration: profile.endTime - profile.startTime,
      topFunctions,
    };
  }

  // Profile a specific function
  async profileFunction(fn, name = 'function') {
    console.log(`Profiling ${name}...`);

    await this.start();

    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;

    const profile = await this.stop();

    console.log(`${name} completed in ${duration}ms`);

    return {
      result,
      duration,
      profile,
    };
  }
}

// Usage
const profiler = new CPUProfiler({
  outputDir: './cpu-profiles',
});

// Profile on demand (e.g., via signal or endpoint)
process.on('SIGUSR2', async () => {
  console.log('SIGUSR2 received, starting CPU profiler');

  try {
    const result = await profiler.profile(30000);
    console.log('Profile complete:', result.filepath);
    console.log('Top functions:', result.analysis.topFunctions);
  } catch (error) {
    console.error('Profiling failed:', error);
  }
});

// Endpoint to start profiling
app.post('/admin/profile/start', async (req, res) => {
  const duration = parseInt(req.query.duration) || 30000;

  try {
    // Start profiling in background
    profiler.profile(duration).then(result => {
      console.log('Background profiling complete:', result.filepath);
    });

    res.json({
      status: 'profiling started',
      duration,
      message: 'Profile will be saved to disk when complete',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profile specific operation
async function profileSlowOperation() {
  const result = await profiler.profileFunction(
    async () => {
      // Your slow operation here
      return await complexCalculation();
    },
    'complexCalculation'
  );

  console.log('Profiling result:', result.profile.analysis);
}
```

### Pattern 4: Function Performance Measurement

```javascript
// function-performance.js
const perf_hooks = require('perf_hooks');

class FunctionPerformance {
  constructor() {
    this.measurements = new Map();
  }

  // Measure function execution time
  measure(fn, name) {
    return async function(...args) {
      const start = perf_hooks.performance.now();

      try {
        const result = await fn.apply(this, args);
        const duration = perf_hooks.performance.now() - start;

        this.record(name, duration, true);

        return result;
      } catch (error) {
        const duration = perf_hooks.performance.now() - start;
        this.record(name, duration, false);

        throw error;
      }
    }.bind(this);
  }

  // Decorator for measuring methods
  measureMethod(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const measurements = this.measurements;

    descriptor.value = async function(...args) {
      const start = perf_hooks.performance.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = perf_hooks.performance.now() - start;

        const name = `${target.constructor.name}.${propertyKey}`;
        measurements.set(name, {
          count: (measurements.get(name)?.count || 0) + 1,
          total: (measurements.get(name)?.total || 0) + duration,
          avg: 0,
        });

        const stats = measurements.get(name);
        stats.avg = stats.total / stats.count;

        return result;
      } catch (error) {
        throw error;
      }
    };

    return descriptor;
  }

  record(name, duration, success) {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, {
        count: 0,
        total: 0,
        min: Infinity,
        max: -Infinity,
        errors: 0,
        durations: [],
      });
    }

    const stats = this.measurements.get(name);
    stats.count++;
    stats.total += duration;
    stats.min = Math.min(stats.min, duration);
    stats.max = Math.max(stats.max, duration);
    stats.durations.push(duration);

    if (!success) {
      stats.errors++;
    }

    // Keep last 1000 measurements
    if (stats.durations.length > 1000) {
      stats.durations.shift();
    }
  }

  getStats(name) {
    const stats = this.measurements.get(name);

    if (!stats) {
      return null;
    }

    const sorted = [...stats.durations].sort((a, b) => a - b);

    return {
      name,
      count: stats.count,
      errors: stats.errors,
      avg: stats.total / stats.count,
      min: stats.min,
      max: stats.max,
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
    };
  }

  getAllStats() {
    const allStats = [];

    for (const name of this.measurements.keys()) {
      allStats.push(this.getStats(name));
    }

    return allStats.sort((a, b) => b.p95 - a.p95);
  }

  percentile(sorted, p) {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  reset() {
    this.measurements.clear();
  }

  // Performance report
  getReport() {
    const stats = this.getAllStats();

    return {
      summary: {
        totalFunctions: stats.length,
        totalCalls: stats.reduce((sum, s) => sum + s.count, 0),
        totalErrors: stats.reduce((sum, s) => sum + s.errors, 0),
      },
      slowest: stats.slice(0, 10),
      mostCalled: [...stats].sort((a, b) => b.count - a.count).slice(0, 10),
      mostErrors: [...stats].sort((a, b) => b.errors - a.errors).slice(0, 10),
    };
  }
}

// Usage
const perf = new FunctionPerformance();

// Measure a function
const measureDatabaseQuery = perf.measure(
  async function(sql) {
    return await database.query(sql);
  },
  'database.query'
);

// Use the measured function
const results = await measureDatabaseQuery('SELECT * FROM users');

// Class with measured methods
class UserService {
  constructor() {
    this.perf = new FunctionPerformance();
  }

  async getUser(id) {
    const start = perf_hooks.performance.now();

    try {
      const user = await database.query('SELECT * FROM users WHERE id = ?', [id]);
      const duration = perf_hooks.performance.now() - start;

      perf.record('UserService.getUser', duration, true);

      return user;
    } catch (error) {
      const duration = perf_hooks.performance.now() - start;
      perf.record('UserService.getUser', duration, false);

      throw error;
    }
  }
}

// Get performance report
app.get('/metrics/performance', (req, res) => {
  res.json(perf.getReport());
});
```

---

## Memory Performance Optimization

### Pattern 5: Memory Profiler and Leak Detector

```javascript
// memory-profiler.js
const v8 = require('v8');
const fs = require('fs').promises;
const path = require('path');

class MemoryProfiler {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './heap-snapshots';
    this.autoSnapshot = options.autoSnapshot !== false;
    this.snapshotThreshold = options.snapshotThreshold || 0.9; // 90% of limit
    this.snapshotInterval = options.snapshotInterval || 300000; // 5 minutes

    this.snapshots = [];
    this.timer = null;

    this.ensureOutputDir();
    if (this.autoSnapshot) {
      this.startAutoSnapshot();
    }
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create snapshot directory:', error);
    }
  }

  async takeSnapshot(label = 'manual') {
    console.log(`Taking heap snapshot: ${label}`);

    const filename = `heap-${label}-${Date.now()}.heapsnapshot`;
    const filepath = path.join(this.outputDir, filename);

    try {
      const snapshot = v8.writeHeapSnapshot(filepath);
      const stats = await fs.stat(filepath);

      const snapshotInfo = {
        label,
        filepath,
        timestamp: Date.now(),
        size: stats.size,
        memory: process.memoryUsage(),
      };

      this.snapshots.push(snapshotInfo);

      console.log('Heap snapshot created:', filepath);
      console.log('Size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');

      return snapshotInfo;
    } catch (error) {
      console.error('Failed to create heap snapshot:', error);
      throw error;
    }
  }

  startAutoSnapshot() {
    this.timer = setInterval(async () => {
      const mem = process.memoryUsage();
      const heapStats = v8.getHeapStatistics();
      const utilization = mem.heapUsed / heapStats.heap_size_limit;

      if (utilization > this.snapshotThreshold) {
        console.warn(`High memory usage: ${(utilization * 100).toFixed(2)}%`);
        await this.takeSnapshot('auto-high-memory');
      }
    }, this.snapshotInterval);

    this.timer.unref();
  }

  stopAutoSnapshot() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Compare two snapshots
  async compareSnapshots(snapshot1, snapshot2) {
    const mem1 = snapshot1.memory;
    const mem2 = snapshot2.memory;

    const diff = {
      heapUsed: mem2.heapUsed - mem1.heapUsed,
      heapTotal: mem2.heapTotal - mem1.heapTotal,
      rss: mem2.rss - mem1.rss,
      external: mem2.external - mem1.external,
      arrayBuffers: mem2.arrayBuffers - mem1.arrayBuffers,
    };

    const duration = snapshot2.timestamp - snapshot1.timestamp;

    return {
      snapshot1: snapshot1.label,
      snapshot2: snapshot2.label,
      duration: duration / 1000, // seconds
      diff,
      growthRate: {
        heapUsed: (diff.heapUsed / duration) * 1000, // bytes per second
        rss: (diff.rss / duration) * 1000,
      },
    };
  }

  // Detect memory leaks by comparing snapshots
  async detectLeaks() {
    if (this.snapshots.length < 2) {
      console.log('Need at least 2 snapshots to detect leaks');
      return null;
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];

    const comparison = await this.compareSnapshots(first, last);

    const leakSuspected =
      comparison.diff.heapUsed > 50 * 1024 * 1024 && // > 50MB growth
      comparison.growthRate.heapUsed > 10 * 1024; // > 10KB/s growth rate

    return {
      ...comparison,
      leakSuspected,
      recommendation: leakSuspected
        ? 'Memory leak suspected. Compare snapshots in Chrome DevTools.'
        : 'Memory usage appears normal.',
    };
  }

  getSnapshots() {
    return this.snapshots;
  }

  async cleanup(keepLast = 5) {
    const toDelete = this.snapshots.slice(0, -keepLast);

    for (const snapshot of toDelete) {
      try {
        await fs.unlink(snapshot.filepath);
        console.log('Deleted old snapshot:', snapshot.filepath);
      } catch (error) {
        console.error('Failed to delete snapshot:', error);
      }
    }

    this.snapshots = this.snapshots.slice(-keepLast);
  }
}

// Usage
const memoryProfiler = new MemoryProfiler({
  outputDir: './heap-snapshots',
  autoSnapshot: true,
  snapshotThreshold: 0.85,
  snapshotInterval: 300000, // 5 minutes
});

// Manually take snapshot
process.on('SIGUSR1', async () => {
  console.log('SIGUSR1 received, taking heap snapshot');
  await memoryProfiler.takeSnapshot('manual-sigusr1');
});

// API endpoints
app.post('/admin/snapshot', async (req, res) => {
  const label = req.body.label || 'api';

  try {
    const snapshot = await memoryProfiler.takeSnapshot(label);
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/admin/snapshots', (req, res) => {
  res.json(memoryProfiler.getSnapshots());
});

app.get('/admin/leaks', async (req, res) => {
  const analysis = await memoryProfiler.detectLeaks();

  if (!analysis) {
    res.status(400).json({ error: 'Need at least 2 snapshots' });
    return;
  }

  res.json(analysis);
});

// Periodic leak detection
setInterval(async () => {
  const analysis = await memoryProfiler.detectLeaks();

  if (analysis?.leakSuspected) {
    console.error('🚨 Memory leak suspected!');
    console.error(analysis);

    // Alert team
    // alertTeam('memory-leak', analysis);
  }
}, 10 * 60 * 1000); // Every 10 minutes
```

---

## Production Monitoring Integration

### Pattern 6: Metrics Collector and Exporter

```javascript
// metrics-collector.js
class MetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
  }

  // Counter - value that only increases
  incrementCounter(name, value = 1, labels = {}) {
    const key = this.getKey(name, labels);

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        type: 'counter',
        name,
        labels,
        value: 0,
      });
    }

    const metric = this.metrics.get(key);
    metric.value += value;
  }

  // Gauge - value that can increase or decrease
  setGauge(name, value, labels = {}) {
    const key = this.getKey(name, labels);

    this.gauges.set(key, {
      type: 'gauge',
      name,
      labels,
      value,
      timestamp: Date.now(),
    });
  }

  // Histogram - distribution of values
  recordHistogram(name, value, labels = {}) {
    const key = this.getKey(name, labels);

    if (!this.histograms.has(key)) {
      this.histograms.set(key, {
        type: 'histogram',
        name,
        labels,
        values: [],
        count: 0,
        sum: 0,
      });
    }

    const histogram = this.histograms.get(key);
    histogram.values.push(value);
    histogram.count++;
    histogram.sum += value;

    // Keep last 1000 values
    if (histogram.values.length > 1000) {
      const removed = histogram.values.shift();
      histogram.sum -= removed;
      histogram.count--;
    }
  }

  getKey(name, labels) {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `${name}{${labelStr}}`;
  }

  // Export in Prometheus format
  toPrometheus() {
    let output = '';

    // Counters
    for (const metric of this.metrics.values()) {
      output += `# TYPE ${metric.name} counter\n`;
      output += `${this.formatMetric(metric)}\n`;
    }

    // Gauges
    for (const gauge of this.gauges.values()) {
      output += `# TYPE ${gauge.name} gauge\n`;
      output += `${this.formatMetric(gauge)}\n`;
    }

    // Histograms
    for (const histogram of this.histograms.values()) {
      output += `# TYPE ${histogram.name} histogram\n`;
      output += `${histogram.name}_count${this.formatLabels(histogram.labels)} ${histogram.count}\n`;
      output += `${histogram.name}_sum${this.formatLabels(histogram.labels)} ${histogram.sum}\n`;

      // Calculate percentiles
      const sorted = [...histogram.values].sort((a, b) => a - b);
      const p50 = this.percentile(sorted, 50);
      const p95 = this.percentile(sorted, 95);
      const p99 = this.percentile(sorted, 99);

      output += `${histogram.name}${this.formatLabels({ ...histogram.labels, quantile: '0.5' })} ${p50}\n`;
      output += `${histogram.name}${this.formatLabels({ ...histogram.labels, quantile: '0.95' })} ${p95}\n`;
      output += `${histogram.name}${this.formatLabels({ ...histogram.labels, quantile: '0.99' })} ${p99}\n`;
    }

    return output;
  }

  formatMetric(metric) {
    return `${metric.name}${this.formatLabels(metric.labels)} ${metric.value}`;
  }

  formatLabels(labels) {
    if (Object.keys(labels).length === 0) {
      return '';
    }

    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');

    return `{${labelStr}}`;
  }

  percentile(sorted, p) {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  // Collect Node.js metrics
  collectNodeMetrics() {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();

    this.setGauge('nodejs_memory_heap_used_bytes', mem.heapUsed);
    this.setGauge('nodejs_memory_heap_total_bytes', mem.heapTotal);
    this.setGauge('nodejs_memory_rss_bytes', mem.rss);
    this.setGauge('nodejs_memory_external_bytes', mem.external);
    this.setGauge('nodejs_memory_array_buffers_bytes', mem.arrayBuffers);

    this.setGauge('nodejs_cpu_user_seconds', cpu.user / 1000000);
    this.setGauge('nodejs_cpu_system_seconds', cpu.system / 1000000);

    this.setGauge('nodejs_uptime_seconds', process.uptime());

    const handles = process._getActiveHandles();
    const requests = process._getActiveRequests();

    this.setGauge('nodejs_active_handles', handles.length);
    this.setGauge('nodejs_active_requests', requests.length);
  }

  startCollection(interval = 10000) {
    setInterval(() => {
      this.collectNodeMetrics();
    }, interval);
  }
}

// Usage
const metrics = new MetricsCollector();

// Start collecting Node.js metrics
metrics.startCollection(10000);

// Track custom metrics
app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1000000;

    metrics.incrementCounter('http_requests_total', 1, {
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
    });

    metrics.recordHistogram('http_request_duration_ms', duration, {
      method: req.method,
      route: req.route?.path || req.path,
    });
  });

  next();
});

// Prometheus metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(metrics.toPrometheus());
});

// Custom business metrics
function recordUserLogin(userId) {
  metrics.incrementCounter('user_logins_total', 1, { user_id: userId });
}

function recordPaymentProcessed(amount, currency) {
  metrics.incrementCounter('payments_total', 1, { currency });
  metrics.recordHistogram('payment_amount', amount, { currency });
}
```

---

## Best Practices

### 1. Monitor Event Loop Continuously

```javascript
// GOOD: Continuous monitoring
const lagMonitor = new EventLoopLagMonitor();
lagMonitor.start();

// BAD: No monitoring
// Hope event loop is fine
```

### 2. Track Request Performance

```javascript
// GOOD: Track all requests
app.use(requestTracker.middleware());

// BAD: No tracking
// Don't know which endpoints are slow
```

### 3. Profile Regularly

```javascript
// GOOD: Profile in production (carefully)
if (cpuUsage > 80) {
  profiler.profile(30000);
}

// BAD: Never profile production
// No visibility into performance issues
```

### 4. Export Metrics

```javascript
// GOOD: Export to monitoring system
app.get('/metrics', (req, res) => {
  res.send(metrics.toPrometheus());
});

// BAD: Metrics only in logs
console.log(metrics);
```

### 5. Set Performance Budgets

```javascript
// GOOD: Define acceptable performance
const budgets = {
  eventLoopLag: 50, // ms
  requestDuration: 500, // ms
  memoryUsage: 0.85, // 85%
};

if (lag > budgets.eventLoopLag) {
  alert();
}

// BAD: No defined budgets
// Don't know what's acceptable
```

---

## Summary

### Key Techniques

1. **Event Loop Monitoring** - Detect and prevent blocking
2. **Request Tracking** - Measure endpoint performance
3. **CPU Profiling** - Identify hot code paths
4. **Memory Profiling** - Find leaks and optimize
5. **Function Performance** - Track individual operations
6. **Metrics Collection** - Aggregate performance data
7. **Production Monitoring** - Continuous visibility

### Performance Monitoring Checklist

- [ ] Monitor event loop lag
- [ ] Track request duration
- [ ] Profile CPU usage
- [ ] Take heap snapshots
- [ ] Detect memory leaks
- [ ] Measure function performance
- [ ] Export metrics to monitoring system
- [ ] Set performance budgets
- [ ] Alert on degradation
- [ ] Profile production (safely)
- [ ] Optimize based on data

### Next Steps

1. Implement event loop monitoring
2. Add request tracking
3. Set up metrics collection
4. Configure profiling tools
5. Integrate with monitoring system
6. Define performance budgets
7. Test and optimize

---

## Quick Reference

```javascript
// Event loop lag
const lagMonitor = new EventLoopLagMonitor();
lagMonitor.start();

// Request tracking
app.use(tracker.middleware());

// CPU profiling
await profiler.profile(30000);

// Heap snapshot
v8.writeHeapSnapshot();

// Metrics
metrics.incrementCounter('requests', 1);
metrics.setGauge('memory', heapUsed);
metrics.recordHistogram('duration', ms);

// Prometheus export
app.get('/metrics', (req, res) => {
  res.send(metrics.toPrometheus());
});
```

Congratulations! You've completed the Level 2 Intermediate Process guides. You now have comprehensive knowledge of signal handling, graceful shutdowns, resource monitoring, error recovery, and performance optimization!
