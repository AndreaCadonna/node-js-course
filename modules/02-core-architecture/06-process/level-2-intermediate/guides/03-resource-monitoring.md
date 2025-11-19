# Resource Monitoring in Node.js

## Introduction

Resource monitoring is essential for understanding how your Node.js application consumes system resources like memory, CPU, and event loop time. Effective monitoring enables you to detect performance issues, prevent crashes, optimize resource usage, and ensure your application runs efficiently in production.

This comprehensive guide explores memory monitoring, CPU profiling, event loop lag detection, and system resource tracking. By the end, you'll know how to implement production-grade monitoring that helps you maintain healthy, performant Node.js applications.

---

## What Problem Does Resource Monitoring Solve?

### The Challenge

Node.js applications can suffer from various resource-related issues:

**Memory Problems:**
- Memory leaks that grow over time
- Heap exhaustion leading to crashes
- Excessive garbage collection pauses
- External memory (buffers) consuming RAM
- Memory fragmentation

**CPU Problems:**
- CPU-intensive operations blocking the event loop
- Inefficient algorithms consuming cycles
- Too many concurrent operations
- RegEx catastrophic backtracking
- JSON parsing of large payloads

**Event Loop Problems:**
- Long-running synchronous operations
- Starved I/O operations
- Delayed timers and callbacks
- Poor request latency
- Unresponsive applications

**System Resource Problems:**
- File descriptor leaks
- Network connection exhaustion
- Disk I/O bottlenecks
- OS resource limits reached

**Without proper monitoring:**
```javascript
// Application runs without visibility
const server = http.createServer(handler);
server.listen(3000);

// Problems invisible until:
// - Out of memory crash
// - Severe performance degradation
// - Customer complaints
// - Complete service failure
```

### The Solution

Implement comprehensive resource monitoring:

```javascript
// Monitor memory
setInterval(() => {
  const mem = process.memoryUsage();
  console.log('Heap:', (mem.heapUsed / 1024 / 1024).toFixed(2), 'MB');

  if (mem.heapUsed > MEMORY_THRESHOLD) {
    alert('High memory usage');
  }
}, 30000);

// Monitor event loop lag
const start = process.hrtime.bigint();
setInterval(() => {
  const lag = Number(process.hrtime.bigint() - start - 1000000000n) / 1000000;
  if (lag > 100) { // More than 100ms lag
    console.warn('Event loop lag:', lag, 'ms');
  }
}, 1000);

// Monitor CPU
const startUsage = process.cpuUsage();
setInterval(() => {
  const usage = process.cpuUsage(startUsage);
  console.log('CPU:', (usage.user / 1000000).toFixed(2), 's');
}, 60000);
```

---

## Real-World Analogies

### Analogy 1: Car Dashboard

**Your Node.js process is like a car:**

- **Fuel gauge (Memory)** → Shows how much memory is available
- **Speedometer (CPU)** → Shows processing speed
- **Tachometer (Event Loop)** → Shows how hard the engine is working
- **Temperature gauge (Heat)** → Shows system stress
- **Check engine light (Alerts)** → Warns of problems
- **Odometer (Uptime)** → Shows how long it's been running

### Analogy 2: Hospital Patient Monitoring

**Your application is like a patient in a hospital:**

- **Heart rate monitor (Event Loop)** → Regular heartbeat indicates health
- **Blood pressure (Memory)** → Too high indicates problems
- **Oxygen saturation (CPU)** → Shows resource utilization
- **Temperature (System load)** → Indicates stress levels
- **EKG (Performance traces)** → Shows detailed activity patterns
- **Vital signs alert (Alarms)** → Notifies staff of critical conditions

### Analogy 3: Factory Production Line

**Your process is like a factory:**

- **Conveyor belt speed (Event Loop)** → How fast work moves
- **Warehouse capacity (Memory)** → How much you can store
- **Worker efficiency (CPU)** → How productively work gets done
- **Quality control (Monitoring)** → Ensures everything works correctly
- **Maintenance schedule (GC)** → Regular cleanup operations
- **Production metrics (Telemetry)** → Track overall performance

---

## Understanding Process Memory

### Memory Structure

```
┌─────────────────────────────────────────────────┐
│           Node.js Process Memory                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  RSS (Resident Set Size)                 │  │
│  │  Total memory in RAM                     │  │
│  │                                          │  │
│  │  ┌────────────────────────────────────┐ │  │
│  │  │  Heap                              │ │  │
│  │  │  (JavaScript objects)              │ │  │
│  │  │                                    │ │  │
│  │  │  ┌──────────────────────────────┐ │ │  │
│  │  │  │  Heap Used                   │ │ │  │
│  │  │  │  (Actually allocated)        │ │ │  │
│  │  │  └──────────────────────────────┘ │ │  │
│  │  │                                    │ │  │
│  │  │  Heap Total (Reserved)             │ │  │
│  │  └────────────────────────────────────┘ │  │
│  │                                          │  │
│  │  ┌────────────────────────────────────┐ │  │
│  │  │  External                          │ │  │
│  │  │  (Buffers, ArrayBuffers)           │ │  │
│  │  └────────────────────────────────────┘ │  │
│  │                                          │  │
│  │  ┌────────────────────────────────────┐ │  │
│  │  │  Code                              │ │  │
│  │  │  (V8, Node.js, your code)          │ │  │
│  │  └────────────────────────────────────┘ │  │
│  │                                          │  │
│  │  ┌────────────────────────────────────┐ │  │
│  │  │  Stack                             │ │  │
│  │  │  (Function call frames)            │ │  │
│  │  └────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Memory Usage API

```javascript
// Get memory usage
const mem = process.memoryUsage();

console.log({
  rss: mem.rss,           // Resident Set Size - total memory in RAM
  heapTotal: mem.heapTotal, // Total heap allocated by V8
  heapUsed: mem.heapUsed,   // Heap actually used
  external: mem.external,    // Memory for C++ objects (Buffers)
  arrayBuffers: mem.arrayBuffers, // Memory for ArrayBuffers
});

// Example output:
// {
//   rss: 36864000,        // ~35 MB total RAM
//   heapTotal: 6537216,   // ~6.2 MB heap allocated
//   heapUsed: 4638376,    // ~4.4 MB heap used
//   external: 1089071,    // ~1 MB for buffers
//   arrayBuffers: 26910   // ~26 KB for ArrayBuffers
// }
```

---

## Memory Monitoring Patterns

### Pattern 1: Basic Memory Monitoring

```javascript
// basic-memory-monitor.js
class MemoryMonitor {
  constructor(options = {}) {
    this.interval = options.interval || 30000; // 30 seconds
    this.threshold = options.threshold || 0.9; // 90% of max heap
    this.maxHeapSize = this.getMaxHeapSize();
    this.timer = null;
    this.history = [];
    this.maxHistory = options.maxHistory || 100;
  }

  start() {
    console.log(`Memory monitor started (max heap: ${this.formatBytes(this.maxHeapSize)})`);

    this.timer = setInterval(() => {
      this.check();
    }, this.interval);

    // Don't prevent process from exiting
    this.timer.unref();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  check() {
    const mem = process.memoryUsage();
    const heapPercent = mem.heapUsed / this.maxHeapSize;

    const snapshot = {
      timestamp: Date.now(),
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      heapPercent,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
    };

    this.history.push(snapshot);

    // Keep history size bounded
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Log current state
    console.log('Memory:', {
      heap: this.formatBytes(mem.heapUsed),
      percent: (heapPercent * 100).toFixed(1) + '%',
      rss: this.formatBytes(mem.rss),
    });

    // Check threshold
    if (heapPercent > this.threshold) {
      this.onThresholdExceeded(snapshot);
    }

    return snapshot;
  }

  onThresholdExceeded(snapshot) {
    console.warn('⚠️  Memory threshold exceeded!', {
      current: this.formatBytes(snapshot.heapUsed),
      max: this.formatBytes(this.maxHeapSize),
      percent: (snapshot.heapPercent * 100).toFixed(1) + '%',
    });

    // Could trigger:
    // - Alert to monitoring system
    // - Heap snapshot
    // - Graceful restart
    // - Load shedding
  }

  getMaxHeapSize() {
    // V8 max heap size (approximate)
    const v8 = require('v8');
    const heapStats = v8.getHeapStatistics();
    return heapStats.heap_size_limit;
  }

  formatBytes(bytes) {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  getStats() {
    if (this.history.length === 0) {
      return null;
    }

    const recent = this.history.slice(-10);
    const heapUsed = recent.map(s => s.heapUsed);

    return {
      current: this.history[this.history.length - 1],
      avg: heapUsed.reduce((a, b) => a + b) / heapUsed.length,
      min: Math.min(...heapUsed),
      max: Math.max(...heapUsed),
      trend: this.calculateTrend(),
    };
  }

  calculateTrend() {
    if (this.history.length < 10) {
      return 'insufficient data';
    }

    const recent = this.history.slice(-10);
    const first = recent[0].heapUsed;
    const last = recent[recent.length - 1].heapUsed;
    const change = ((last - first) / first) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }
}

// Usage
const monitor = new MemoryMonitor({
  interval: 30000,  // Check every 30 seconds
  threshold: 0.85,  // Alert at 85%
});

monitor.start();

// Get statistics
setInterval(() => {
  const stats = monitor.getStats();
  if (stats) {
    console.log('Memory trend:', stats.trend);
  }
}, 60000);
```

### Pattern 2: Memory Leak Detection

```javascript
// memory-leak-detector.js
class MemoryLeakDetector {
  constructor(options = {}) {
    this.checkInterval = options.checkInterval || 60000; // 1 minute
    this.samplesNeeded = options.samplesNeeded || 10;
    this.growthThreshold = options.growthThreshold || 1024 * 1024 * 10; // 10MB
    this.samples = [];
    this.timer = null;
  }

  start() {
    console.log('Memory leak detector started');

    this.timer = setInterval(() => {
      this.takeSample();
    }, this.checkInterval);

    this.timer.unref();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  takeSample() {
    // Force garbage collection before sampling (if available)
    if (global.gc) {
      global.gc();
    }

    const mem = process.memoryUsage();
    const sample = {
      timestamp: Date.now(),
      heapUsed: mem.heapUsed,
      external: mem.external,
      rss: mem.rss,
    };

    this.samples.push(sample);

    // Keep bounded sample size
    if (this.samples.length > this.samplesNeeded * 2) {
      this.samples = this.samples.slice(-this.samplesNeeded);
    }

    // Check for leak after enough samples
    if (this.samples.length >= this.samplesNeeded) {
      this.detectLeak();
    }
  }

  detectLeak() {
    const samples = this.samples;
    const first = samples[0];
    const last = samples[samples.length - 1];

    // Calculate growth
    const heapGrowth = last.heapUsed - first.heapUsed;
    const timespan = last.timestamp - first.timestamp;
    const minutes = timespan / 1000 / 60;

    // Calculate growth rate (bytes per minute)
    const growthRate = heapGrowth / minutes;

    console.log('Memory growth analysis:', {
      timespan: `${minutes.toFixed(1)} minutes`,
      growth: this.formatBytes(heapGrowth),
      growthRate: `${this.formatBytes(growthRate)}/min`,
    });

    // Check if growth is consistent and significant
    if (this.isConsistentGrowth() && heapGrowth > this.growthThreshold) {
      this.onLeakDetected(heapGrowth, growthRate);
    }
  }

  isConsistentGrowth() {
    // Check if memory is consistently growing (not just fluctuating)
    const samples = this.samples;

    let increases = 0;
    for (let i = 1; i < samples.length; i++) {
      if (samples[i].heapUsed > samples[i - 1].heapUsed) {
        increases++;
      }
    }

    // If 70%+ of samples show growth, it's consistent
    const growthRatio = increases / (samples.length - 1);
    return growthRatio > 0.7;
  }

  onLeakDetected(growth, growthRate) {
    console.error('🚨 Potential memory leak detected!');
    console.error({
      totalGrowth: this.formatBytes(growth),
      growthRate: `${this.formatBytes(growthRate)}/min`,
      samples: this.samples.length,
    });

    // Take actions:
    // 1. Create heap snapshot
    this.createHeapSnapshot();

    // 2. Alert monitoring system
    // alerting.send('memory-leak-detected', { growth, growthRate });

    // 3. Consider graceful restart
    // if (criticalThreshold) shutdown.graceful();
  }

  createHeapSnapshot() {
    const v8 = require('v8');
    const fs = require('fs');
    const path = require('path');

    try {
      const filename = `heap-leak-${Date.now()}.heapsnapshot`;
      const filepath = path.join('./diagnostics', filename);

      // Ensure directory exists
      require('fs').mkdirSync('./diagnostics', { recursive: true });

      const snapshot = v8.writeHeapSnapshot(filepath);
      console.log('Heap snapshot created:', snapshot);

      return snapshot;
    } catch (error) {
      console.error('Failed to create heap snapshot:', error);
    }
  }

  formatBytes(bytes) {
    const mb = Math.abs(bytes) / 1024 / 1024;
    return `${bytes < 0 ? '-' : ''}${mb.toFixed(2)} MB`;
  }

  getReport() {
    if (this.samples.length < 2) {
      return 'Insufficient data';
    }

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const growth = last.heapUsed - first.heapUsed;
    const timespan = (last.timestamp - first.timestamp) / 1000 / 60;

    return {
      samples: this.samples.length,
      timespan: `${timespan.toFixed(1)} minutes`,
      initialMemory: this.formatBytes(first.heapUsed),
      currentMemory: this.formatBytes(last.heapUsed),
      growth: this.formatBytes(growth),
      growthRate: this.formatBytes(growth / timespan) + '/min',
      consistent: this.isConsistentGrowth(),
    };
  }
}

// Usage
const leakDetector = new MemoryLeakDetector({
  checkInterval: 60000,    // Check every minute
  samplesNeeded: 15,       // Need 15 samples to detect
  growthThreshold: 10 * 1024 * 1024, // Alert if >10MB growth
});

// Run with --expose-gc to enable GC before sampling
// node --expose-gc app.js

leakDetector.start();
```

### Pattern 3: Heap Statistics Monitoring

```javascript
// heap-stats-monitor.js
const v8 = require('v8');

class HeapStatsMonitor {
  constructor() {
    this.previousStats = null;
  }

  getStats() {
    const stats = v8.getHeapStatistics();

    return {
      // Total size limits
      heapSizeLimit: stats.heap_size_limit,

      // Current sizes
      totalHeapSize: stats.total_heap_size,
      usedHeapSize: stats.used_heap_size,
      totalPhysicalSize: stats.total_physical_size,
      totalAvailableSize: stats.total_available_size,

      // Heap utilization
      heapUtilization: (stats.used_heap_size / stats.total_heap_size) * 100,
      limitUtilization: (stats.used_heap_size / stats.heap_size_limit) * 100,

      // Memory spaces
      mallocedMemory: stats.mallocedMemory,
      peakMallocedMemory: stats.peak_malloced_memory,

      // Garbage collection
      doesZapGarbage: stats.does_zap_garbage,
    };
  }

  getSpaceStats() {
    const spaces = v8.getHeapSpaceStatistics();

    return spaces.map(space => ({
      name: space.space_name,
      size: space.space_size,
      used: space.space_used_size,
      available: space.space_available_size,
      physicalSize: space.physical_space_size,
      utilization: (space.space_used_size / space.space_size) * 100,
    }));
  }

  printReport() {
    const stats = this.getStats();
    const spaces = this.getSpaceStats();

    console.log('\n=== Heap Statistics ===\n');

    console.log('Overall:');
    console.log('  Heap Size Limit:', this.formatBytes(stats.heapSizeLimit));
    console.log('  Total Heap Size:', this.formatBytes(stats.totalHeapSize));
    console.log('  Used Heap Size:', this.formatBytes(stats.usedHeapSize));
    console.log('  Heap Utilization:', stats.heapUtilization.toFixed(2) + '%');
    console.log('  Limit Utilization:', stats.limitUtilization.toFixed(2) + '%');
    console.log();

    console.log('Memory Spaces:');
    spaces.forEach(space => {
      console.log(`  ${space.name}:`);
      console.log(`    Size: ${this.formatBytes(space.size)}`);
      console.log(`    Used: ${this.formatBytes(space.used)} (${space.utilization.toFixed(1)}%)`);
    });

    console.log('\n');
  }

  formatBytes(bytes) {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  startMonitoring(interval = 60000) {
    setInterval(() => {
      const stats = this.getStats();

      if (stats.limitUtilization > 85) {
        console.warn('⚠️  Heap utilization high:', stats.limitUtilization.toFixed(2) + '%');
      }

      if (stats.limitUtilization > 95) {
        console.error('🚨 Critical heap utilization:', stats.limitUtilization.toFixed(2) + '%');
        this.printReport();
      }
    }, interval);
  }
}

// Usage
const heapMonitor = new HeapStatsMonitor();

// Print detailed report
heapMonitor.printReport();

// Start continuous monitoring
heapMonitor.startMonitoring(30000);
```

---

## CPU Monitoring Patterns

### Pattern 1: Basic CPU Monitoring

```javascript
// cpu-monitor.js
class CPUMonitor {
  constructor(options = {}) {
    this.interval = options.interval || 60000; // 1 minute
    this.threshold = options.threshold || 80; // 80% CPU
    this.timer = null;
    this.history = [];
    this.previousUsage = process.cpuUsage();
    this.previousTime = process.hrtime.bigint();
  }

  start() {
    console.log('CPU monitor started');

    this.timer = setInterval(() => {
      this.check();
    }, this.interval);

    this.timer.unref();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  check() {
    const currentUsage = process.cpuUsage(this.previousUsage);
    const currentTime = process.hrtime.bigint();

    // Calculate elapsed time in microseconds
    const elapsedTime = Number(currentTime - this.previousTime) / 1000;

    // Calculate CPU percentage
    // cpuUsage returns microseconds, so we divide by elapsed microseconds
    const userPercent = (currentUsage.user / elapsedTime) * 100;
    const systemPercent = (currentUsage.system / elapsedTime) * 100;
    const totalPercent = userPercent + systemPercent;

    const snapshot = {
      timestamp: Date.now(),
      user: currentUsage.user,
      system: currentUsage.system,
      userPercent,
      systemPercent,
      totalPercent,
    };

    this.history.push(snapshot);

    // Keep history bounded
    if (this.history.length > 100) {
      this.history.shift();
    }

    console.log('CPU:', {
      user: userPercent.toFixed(1) + '%',
      system: systemPercent.toFixed(1) + '%',
      total: totalPercent.toFixed(1) + '%',
    });

    // Check threshold
    if (totalPercent > this.threshold) {
      this.onThresholdExceeded(snapshot);
    }

    // Update for next interval
    this.previousUsage = process.cpuUsage();
    this.previousTime = currentTime;

    return snapshot;
  }

  onThresholdExceeded(snapshot) {
    console.warn('⚠️  CPU threshold exceeded:', {
      current: snapshot.totalPercent.toFixed(1) + '%',
      threshold: this.threshold + '%',
    });

    // Actions:
    // - Start profiler
    // - Alert monitoring
    // - Investigate
  }

  getStats() {
    if (this.history.length === 0) {
      return null;
    }

    const recent = this.history.slice(-10);
    const totals = recent.map(s => s.totalPercent);

    return {
      current: this.history[this.history.length - 1],
      avg: totals.reduce((a, b) => a + b) / totals.length,
      min: Math.min(...totals),
      max: Math.max(...totals),
    };
  }
}

// Usage
const cpuMonitor = new CPUMonitor({
  interval: 10000,  // Check every 10 seconds
  threshold: 75,    // Alert at 75% CPU
});

cpuMonitor.start();
```

### Pattern 2: Profiler Integration

```javascript
// profiler.js
const { Session } = require('inspector');
const fs = require('fs');

class Profiler {
  constructor() {
    this.session = null;
    this.profiling = false;
  }

  start() {
    if (this.profiling) {
      console.log('Profiler already running');
      return;
    }

    this.session = new Session();
    this.session.connect();

    this.session.post('Profiler.enable', () => {
      this.session.post('Profiler.start', () => {
        this.profiling = true;
        console.log('CPU profiler started');
      });
    });
  }

  async stop() {
    if (!this.profiling) {
      return null;
    }

    return new Promise((resolve, reject) => {
      this.session.post('Profiler.stop', (err, { profile }) => {
        if (err) {
          reject(err);
          return;
        }

        this.profiling = false;
        this.session.disconnect();

        // Save profile
        const filename = `cpu-profile-${Date.now()}.cpuprofile`;
        fs.writeFileSync(filename, JSON.stringify(profile));

        console.log('CPU profile saved:', filename);
        resolve(filename);
      });
    });
  }

  async profile(duration = 30000) {
    console.log(`Profiling for ${duration}ms`);

    this.start();

    await new Promise(resolve => setTimeout(resolve, duration));

    const filename = await this.stop();
    return filename;
  }
}

// Usage
const profiler = new Profiler();

// Profile for 30 seconds
process.on('SIGUSR2', async () => {
  console.log('SIGUSR2 received, starting profiler');
  const file = await profiler.profile(30000);
  console.log('Profile complete:', file);
  // Open in Chrome DevTools: chrome://inspect
});

// Or manually
// profiler.start();
// ... run your code ...
// profiler.stop();
```

---

## Event Loop Monitoring

### Pattern 1: Event Loop Lag Detection

```javascript
// event-loop-monitor.js
class EventLoopMonitor {
  constructor(options = {}) {
    this.interval = options.interval || 1000; // 1 second
    this.threshold = options.threshold || 100; // 100ms lag
    this.timer = null;
    this.lastCheck = process.hrtime.bigint();
    this.history = [];
  }

  start() {
    console.log('Event loop monitor started');

    this.timer = setInterval(() => {
      this.check();
    }, this.interval);

    this.timer.unref();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  check() {
    const now = process.hrtime.bigint();
    const expectedInterval = BigInt(this.interval * 1000000); // Convert to nanoseconds
    const actualInterval = now - this.lastCheck;
    const lag = Number(actualInterval - expectedInterval) / 1000000; // Convert to milliseconds

    const snapshot = {
      timestamp: Date.now(),
      lag: Math.max(0, lag), // Lag can't be negative
      interval: this.interval,
    };

    this.history.push(snapshot);

    // Keep history bounded
    if (this.history.length > 100) {
      this.history.shift();
    }

    if (lag > this.threshold) {
      this.onLagDetected(snapshot);
    }

    this.lastCheck = now;

    return snapshot;
  }

  onLagDetected(snapshot) {
    console.warn('⚠️  Event loop lag detected:', {
      lag: snapshot.lag.toFixed(2) + 'ms',
      threshold: this.threshold + 'ms',
    });

    // Actions:
    // - Start profiler
    // - Take heap snapshot
    // - Alert monitoring
  }

  getStats() {
    if (this.history.length === 0) {
      return null;
    }

    const recent = this.history.slice(-60); // Last minute
    const lags = recent.map(s => s.lag);

    return {
      current: this.history[this.history.length - 1].lag,
      avg: lags.reduce((a, b) => a + b) / lags.length,
      min: Math.min(...lags),
      max: Math.max(...lags),
      p95: this.percentile(lags, 95),
      p99: this.percentile(lags, 99),
    };
  }

  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// Usage
const eventLoopMonitor = new EventLoopMonitor({
  interval: 1000,   // Check every second
  threshold: 50,    // Alert if >50ms lag
});

eventLoopMonitor.start();

// Get statistics
setInterval(() => {
  const stats = eventLoopMonitor.getStats();
  if (stats) {
    console.log('Event loop stats:', {
      avg: stats.avg.toFixed(2) + 'ms',
      p95: stats.p95.toFixed(2) + 'ms',
      p99: stats.p99.toFixed(2) + 'ms',
    });
  }
}, 60000);
```

### Pattern 2: Active Handles and Requests

```javascript
// active-handles-monitor.js
class ActiveHandlesMonitor {
  constructor() {
    this.timer = null;
  }

  start(interval = 30000) {
    this.timer = setInterval(() => {
      this.check();
    }, interval);

    this.timer.unref();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  check() {
    // Get active handles (timers, servers, sockets, etc.)
    const handles = process._getActiveHandles();
    const requests = process._getActiveRequests();

    console.log('Active Resources:', {
      handles: handles.length,
      requests: requests.length,
      total: handles.length + requests.length,
    });

    // Analyze handle types
    const handleTypes = {};
    handles.forEach(handle => {
      const type = handle.constructor.name;
      handleTypes[type] = (handleTypes[type] || 0) + 1;
    });

    console.log('Handle types:', handleTypes);

    // Check for leaks
    if (handles.length > 100) {
      console.warn('⚠️  High number of active handles:', handles.length);
      this.investigateHandles(handles);
    }

    return {
      handles: handles.length,
      requests: requests.length,
      types: handleTypes,
    };
  }

  investigateHandles(handles) {
    console.log('\nInvestigating handles:');

    handles.forEach((handle, index) => {
      const type = handle.constructor.name;

      if (type === 'Socket') {
        console.log(`  Socket ${index}:`, {
          remoteAddress: handle.remoteAddress,
          remotePort: handle.remotePort,
          localPort: handle.localPort,
        });
      } else if (type === 'Timer') {
        console.log(`  Timer ${index}:`, {
          repeat: handle._repeat,
        });
      } else {
        console.log(`  ${type} ${index}`);
      }
    });
  }
}

// Usage
const handlesMonitor = new ActiveHandlesMonitor();
handlesMonitor.start(60000); // Check every minute
```

---

## Comprehensive Monitoring Solution

### Pattern 3: Complete Resource Monitor

```javascript
// complete-resource-monitor.js
const v8 = require('v8');
const os = require('os');

class ResourceMonitor {
  constructor(options = {}) {
    this.interval = options.interval || 30000;
    this.onMetrics = options.onMetrics || this.defaultMetricsHandler;

    this.memoryMonitor = null;
    this.cpuMonitor = null;
    this.eventLoopMonitor = null;

    this.timer = null;
    this.startTime = Date.now();
    this.startCPU = process.cpuUsage();
  }

  start() {
    console.log('Resource monitor started');

    this.timer = setInterval(() => {
      const metrics = this.collect();
      this.onMetrics(metrics);
    }, this.interval);

    this.timer.unref();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  collect() {
    const metrics = {
      timestamp: Date.now(),
      uptime: process.uptime(),

      // Memory metrics
      memory: this.collectMemoryMetrics(),

      // CPU metrics
      cpu: this.collectCPUMetrics(),

      // Event loop metrics
      eventLoop: this.collectEventLoopMetrics(),

      // System metrics
      system: this.collectSystemMetrics(),

      // Process metrics
      process: this.collectProcessMetrics(),
    };

    return metrics;
  }

  collectMemoryMetrics() {
    const mem = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    return {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      heapLimit: heapStats.heap_size_limit,
      heapUtilization: (mem.heapUsed / heapStats.heap_size_limit) * 100,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
    };
  }

  collectCPUMetrics() {
    const usage = process.cpuUsage(this.startCPU);
    const elapsed = Date.now() - this.startTime;

    return {
      user: usage.user,
      system: usage.system,
      userPercent: (usage.user / (elapsed * 1000)) * 100,
      systemPercent: (usage.system / (elapsed * 1000)) * 100,
      totalPercent: ((usage.user + usage.system) / (elapsed * 1000)) * 100,
    };
  }

  collectEventLoopMetrics() {
    // This is a simplified version
    // Use a proper event loop lag library for production
    const handles = process._getActiveHandles();
    const requests = process._getActiveRequests();

    return {
      activeHandles: handles.length,
      activeRequests: requests.length,
    };
  }

  collectSystemMetrics() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    return {
      cpuCount: cpus.length,
      cpuModel: cpus[0].model,
      totalMemory: totalMem,
      freeMemory: freeMem,
      memoryUtilization: ((totalMem - freeMem) / totalMem) * 100,
      loadAverage: os.loadavg(),
      platform: os.platform(),
    };
  }

  collectProcessMetrics() {
    return {
      pid: process.pid,
      ppid: process.ppid,
      title: process.title,
      version: process.version,
      nodeVersion: process.versions.node,
      v8Version: process.versions.v8,
    };
  }

  defaultMetricsHandler(metrics) {
    console.log('\n=== Resource Metrics ===');
    console.log('Time:', new Date(metrics.timestamp).toISOString());
    console.log('Uptime:', (metrics.uptime / 60).toFixed(2), 'minutes');
    console.log();

    console.log('Memory:');
    console.log('  Heap:', this.formatBytes(metrics.memory.heapUsed));
    console.log('  Heap %:', metrics.memory.heapUtilization.toFixed(2) + '%');
    console.log('  RSS:', this.formatBytes(metrics.memory.rss));
    console.log();

    console.log('CPU:');
    console.log('  Total:', metrics.cpu.totalPercent.toFixed(2) + '%');
    console.log('  User:', metrics.cpu.userPercent.toFixed(2) + '%');
    console.log('  System:', metrics.cpu.systemPercent.toFixed(2) + '%');
    console.log();

    console.log('Event Loop:');
    console.log('  Active Handles:', metrics.eventLoop.activeHandles);
    console.log('  Active Requests:', metrics.eventLoop.activeRequests);
    console.log();

    console.log('System:');
    console.log('  System Memory:', metrics.system.memoryUtilization.toFixed(2) + '%');
    console.log('  Load Average:', metrics.system.loadAverage.map(l => l.toFixed(2)).join(', '));
    console.log();
  }

  formatBytes(bytes) {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  }

  // Export metrics in Prometheus format
  toPrometheus(metrics) {
    return `
# Node.js Process Metrics
nodejs_memory_heap_used_bytes ${metrics.memory.heapUsed}
nodejs_memory_heap_total_bytes ${metrics.memory.heapTotal}
nodejs_memory_rss_bytes ${metrics.memory.rss}
nodejs_memory_external_bytes ${metrics.memory.external}
nodejs_cpu_user_seconds ${metrics.cpu.user / 1000000}
nodejs_cpu_system_seconds ${metrics.cpu.system / 1000000}
nodejs_eventloop_handles ${metrics.eventLoop.activeHandles}
nodejs_eventloop_requests ${metrics.eventLoop.activeRequests}
nodejs_uptime_seconds ${metrics.uptime}
    `.trim();
  }
}

// Usage
const monitor = new ResourceMonitor({
  interval: 30000,
  onMetrics: (metrics) => {
    // Send to monitoring system
    // monitoring.send(metrics);

    // Log to console
    console.log(monitor.toPrometheus(metrics));

    // Check thresholds
    if (metrics.memory.heapUtilization > 85) {
      console.warn('High memory usage!');
    }

    if (metrics.cpu.totalPercent > 80) {
      console.warn('High CPU usage!');
    }
  },
});

monitor.start();

// Export metrics endpoint for Prometheus
// app.get('/metrics', (req, res) => {
//   const metrics = monitor.collect();
//   res.set('Content-Type', 'text/plain');
//   res.send(monitor.toPrometheus(metrics));
// });
```

---

## Best Practices

### 1. Monitor Continuously

```javascript
// GOOD: Continuous monitoring
const monitor = new ResourceMonitor({ interval: 30000 });
monitor.start();

// BAD: No monitoring
// Just hope everything works
```

### 2. Set Appropriate Thresholds

```javascript
// GOOD: Thresholds based on your app
const thresholds = {
  memory: 0.85,      // 85% of max heap
  cpu: 75,           // 75% CPU
  eventLoopLag: 100, // 100ms lag
};

// BAD: No thresholds or unrealistic ones
const thresholds = {
  memory: 0.99, // Too high, crashes before alert
  cpu: 10,      // Too low, always alerting
};
```

### 3. Export Metrics

```javascript
// GOOD: Export to monitoring system
app.get('/metrics', (req, res) => {
  const metrics = monitor.collect();
  res.json(metrics);
});

// BAD: Metrics only in logs
console.log(metrics);
```

### 4. Take Action on Alerts

```javascript
// GOOD: Automated response
if (metrics.memory.heapUtilization > 90) {
  // 1. Create heap snapshot
  createHeapSnapshot();

  // 2. Alert team
  pagerDuty.alert('high-memory');

  // 3. Consider restart
  if (metrics.memory.heapUtilization > 95) {
    gracefulRestart();
  }
}

// BAD: Just log
if (metrics.memory.heapUtilization > 90) {
  console.log('Memory high');
}
```

### 5. Track Trends

```javascript
// GOOD: Track over time
const history = [];
setInterval(() => {
  history.push(monitor.collect());
  if (history.length > 1000) history.shift();

  const trend = analyzeTrend(history);
  if (trend === 'increasing') {
    alert('Memory leak suspected');
  }
}, 60000);

// BAD: Only current values
console.log(metrics.memory.heapUsed);
```

---

## Summary

### Key Concepts

1. **Memory Monitoring** - Track heap, RSS, external memory
2. **CPU Monitoring** - Monitor CPU usage and profile
3. **Event Loop Monitoring** - Detect lag and blocking
4. **System Monitoring** - Track system resources
5. **Trend Analysis** - Detect leaks and degradation
6. **Alerting** - Take action on thresholds
7. **Profiling** - Deep dive when needed

### Monitoring Checklist

- [ ] Monitor heap memory usage
- [ ] Track memory trends over time
- [ ] Monitor CPU usage
- [ ] Detect event loop lag
- [ ] Track active handles/requests
- [ ] Set appropriate thresholds
- [ ] Export metrics for visualization
- [ ] Alert on threshold violations
- [ ] Create heap snapshots on demand
- [ ] Profile CPU when needed
- [ ] Test monitoring in production

### Next Steps

1. Implement basic monitoring
2. Set up metrics export
3. Configure alerting
4. Test with load testing
5. Proceed to [Error Recovery Guide](./04-error-recovery.md)

---

## Quick Reference

```javascript
// Memory
const mem = process.memoryUsage();
console.log(mem.heapUsed, mem.rss);

// CPU
const cpu = process.cpuUsage();
console.log(cpu.user, cpu.system);

// Event loop lag
const start = process.hrtime.bigint();
setTimeout(() => {
  const lag = Number(process.hrtime.bigint() - start - 1000000n) / 1000000;
  console.log('Lag:', lag, 'ms');
}, 1);

// Heap statistics
const v8 = require('v8');
const stats = v8.getHeapStatistics();
console.log(stats.used_heap_size, stats.heap_size_limit);

// Profiling
node --prof app.js
node --prof-process isolate-*.log > processed.txt

// Heap snapshot
const v8 = require('v8');
v8.writeHeapSnapshot();
```

Ready to handle errors and recover gracefully? Continue to [Error Recovery Guide](./04-error-recovery.md)!
