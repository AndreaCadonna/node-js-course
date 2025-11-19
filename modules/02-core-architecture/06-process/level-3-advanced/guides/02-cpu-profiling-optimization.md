# CPU Profiling and Optimization

## Table of Contents
- [Introduction](#introduction)
- [Understanding CPU Profiling](#understanding-cpu-profiling)
- [Profiling Tools](#profiling-tools)
- [Flame Graphs](#flame-graphs)
- [Performance Analysis](#performance-analysis)
- [Optimization Techniques](#optimization-techniques)
- [Production Profiling](#production-profiling)
- [Case Studies](#case-studies)
- [Best Practices](#best-practices)
- [Anti-Patterns](#anti-patterns)

## Introduction

CPU profiling is essential for identifying performance bottlenecks in Node.js applications. Unlike memory leaks, CPU performance issues can manifest immediately, causing slow response times, high server costs, and poor user experience.

### Why CPU Profiling Matters

```javascript
/**
 * Understanding CPU Bottlenecks
 *
 * CPU issues in Node.js can cause:
 * - Slow request processing
 * - Event loop blocking
 * - Reduced throughput
 * - Timeout errors
 * - Poor scalability
 */

const { performance } = require('perf_hooks');

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      slow: 100,      // 100ms
      critical: 1000  // 1s
    };
  }

  /**
   * Measure function execution time
   */
  async measure(name, fn) {
    const start = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - start;

      this.recordMetric(name, duration);

      if (duration > this.thresholds.critical) {
        console.error(`CRITICAL: ${name} took ${duration.toFixed(2)}ms`);
      } else if (duration > this.thresholds.slow) {
        console.warn(`SLOW: ${name} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, error);
      throw error;
    }
  }

  recordMetric(name, duration, error = null) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errors: 0
      });
    }

    const metric = this.metrics.get(name);
    metric.count++;
    metric.totalDuration += duration;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);

    if (error) {
      metric.errors++;
    }
  }

  getReport(name) {
    const metric = this.metrics.get(name);

    if (!metric) {
      return null;
    }

    return {
      name,
      count: metric.count,
      avgDuration: metric.totalDuration / metric.count,
      minDuration: metric.minDuration,
      maxDuration: metric.maxDuration,
      totalDuration: metric.totalDuration,
      errors: metric.errors,
      errorRate: (metric.errors / metric.count) * 100
    };
  }

  getAllReports() {
    const reports = [];

    for (const name of this.metrics.keys()) {
      reports.push(this.getReport(name));
    }

    return reports.sort((a, b) => b.totalDuration - a.totalDuration);
  }

  reset() {
    this.metrics.clear();
  }
}

// Usage example
const monitor = new PerformanceMonitor();

async function processRequest(data) {
  return await monitor.measure('processRequest', async () => {
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
    return { processed: true, data };
  });
}

// Simulate requests
async function simulateLoad() {
  for (let i = 0; i < 100; i++) {
    await processRequest({ id: i });
  }

  console.log('Performance Report:');
  console.log(JSON.stringify(monitor.getAllReports(), null, 2));
}

if (require.main === module) {
  simulateLoad().catch(console.error);
}
```

## Understanding CPU Profiling

### CPU Time vs Wall Clock Time

```javascript
/**
 * Understanding different time measurements
 */

const { performance, PerformanceObserver } = require('perf_hooks');

class TimingAnalyzer {
  /**
   * CPU Time: Actual time CPU spent executing
   * Wall Clock Time: Real-world time elapsed
   */
  static async demonstrateDifference() {
    console.log('=== CPU Time vs Wall Clock Time ===\n');

    // Scenario 1: CPU-bound operation
    console.log('1. CPU-bound operation (computation):');
    const cpuStart = process.cpuUsage();
    const wallStart1 = performance.now();

    // Heavy computation
    let result = 0;
    for (let i = 0; i < 10000000; i++) {
      result += Math.sqrt(i);
    }

    const wallEnd1 = performance.now();
    const cpuEnd = process.cpuUsage(cpuStart);

    console.log(`  Wall clock time: ${(wallEnd1 - wallStart1).toFixed(2)}ms`);
    console.log(`  CPU user time: ${(cpuEnd.user / 1000).toFixed(2)}ms`);
    console.log(`  CPU system time: ${(cpuEnd.system / 1000).toFixed(2)}ms`);
    console.log(`  Total CPU time: ${((cpuEnd.user + cpuEnd.system) / 1000).toFixed(2)}ms`);

    // Scenario 2: I/O-bound operation
    console.log('\n2. I/O-bound operation (waiting):');
    const cpuStart2 = process.cpuUsage();
    const wallStart2 = performance.now();

    // Wait for I/O
    await new Promise(resolve => setTimeout(resolve, 100));

    const wallEnd2 = performance.now();
    const cpuEnd2 = process.cpuUsage(cpuStart2);

    console.log(`  Wall clock time: ${(wallEnd2 - wallStart2).toFixed(2)}ms`);
    console.log(`  CPU user time: ${(cpuEnd2.user / 1000).toFixed(2)}ms`);
    console.log(`  CPU system time: ${(cpuEnd2.system / 1000).toFixed(2)}ms`);
    console.log(`  Total CPU time: ${((cpuEnd2.user + cpuEnd2.system) / 1000).toFixed(2)}ms`);

    console.log('\n  Note: Wall clock time >> CPU time (most time spent waiting)\n');
  }

  /**
   * Track CPU usage over time
   */
  static monitorCPUUsage(interval = 1000, duration = 10000) {
    const samples = [];
    let lastUsage = process.cpuUsage();

    const timer = setInterval(() => {
      const currentUsage = process.cpuUsage(lastUsage);
      const sample = {
        timestamp: Date.now(),
        user: currentUsage.user,
        system: currentUsage.system,
        total: currentUsage.user + currentUsage.system
      };

      samples.push(sample);
      lastUsage = process.cpuUsage();

      console.log(`CPU: user=${(sample.user / 1000).toFixed(2)}ms, ` +
                  `system=${(sample.system / 1000).toFixed(2)}ms, ` +
                  `total=${(sample.total / 1000).toFixed(2)}ms`);
    }, interval);

    setTimeout(() => {
      clearInterval(timer);

      // Calculate statistics
      const totalUser = samples.reduce((sum, s) => sum + s.user, 0);
      const totalSystem = samples.reduce((sum, s) => sum + s.system, 0);
      const avgUser = totalUser / samples.length / 1000;
      const avgSystem = totalSystem / samples.length / 1000;

      console.log('\n=== CPU Usage Summary ===');
      console.log(`Samples: ${samples.length}`);
      console.log(`Avg User Time: ${avgUser.toFixed(2)}ms per interval`);
      console.log(`Avg System Time: ${avgSystem.toFixed(2)}ms per interval`);
      console.log(`Total User Time: ${(totalUser / 1000).toFixed(2)}ms`);
      console.log(`Total System Time: ${(totalSystem / 1000).toFixed(2)}ms`);
    }, duration);
  }
}

// Run demonstrations
if (require.main === module) {
  TimingAnalyzer.demonstrateDifference().then(() => {
    console.log('\n=== Monitoring CPU Usage ===');
    TimingAnalyzer.monitorCPUUsage(1000, 10000);
  });
}
```

### Event Loop Monitoring

```javascript
/**
 * Event Loop Delay Monitoring
 *
 * High event loop delay indicates CPU blocking
 */

const { monitorEventLoopDelay } = require('perf_hooks');

class EventLoopMonitor {
  constructor(options = {}) {
    this.resolution = options.resolution || 10;
    this.histogram = monitorEventLoopDelay({ resolution: this.resolution });
    this.thresholds = {
      warning: options.warningThreshold || 50,
      critical: options.criticalThreshold || 100
    };
    this.alerts = [];
  }

  start() {
    this.histogram.enable();
    console.log('Event loop monitoring started');
  }

  stop() {
    this.histogram.disable();
    console.log('Event loop monitoring stopped');
  }

  getMetrics() {
    return {
      min: this.histogram.min,
      max: this.histogram.max,
      mean: this.histogram.mean,
      stddev: this.histogram.stddev,
      percentiles: {
        p50: this.histogram.percentile(50),
        p90: this.histogram.percentile(90),
        p95: this.histogram.percentile(95),
        p99: this.histogram.percentile(99),
        p999: this.histogram.percentile(99.9)
      }
    };
  }

  check() {
    const metrics = this.getMetrics();
    const p99 = metrics.percentiles.p99 / 1000000; // Convert to ms

    if (p99 > this.thresholds.critical) {
      this.raiseAlert('CRITICAL', `Event loop delay p99: ${p99.toFixed(2)}ms`, metrics);
    } else if (p99 > this.thresholds.warning) {
      this.raiseAlert('WARNING', `Event loop delay p99: ${p99.toFixed(2)}ms`, metrics);
    }

    return metrics;
  }

  raiseAlert(level, message, metrics) {
    const alert = {
      timestamp: Date.now(),
      level,
      message,
      metrics
    };

    this.alerts.push(alert);
    console[level === 'CRITICAL' ? 'error' : 'warn'](`[${level}] ${message}`);
  }

  reset() {
    this.histogram.reset();
    this.alerts = [];
  }

  printReport() {
    const metrics = this.getMetrics();

    console.log('\n=== Event Loop Delay Report ===');
    console.log(`Min: ${(metrics.min / 1000000).toFixed(2)}ms`);
    console.log(`Max: ${(metrics.max / 1000000).toFixed(2)}ms`);
    console.log(`Mean: ${(metrics.mean / 1000000).toFixed(2)}ms`);
    console.log(`Std Dev: ${(metrics.stddev / 1000000).toFixed(2)}ms`);
    console.log('\nPercentiles:');
    console.log(`  p50:  ${(metrics.percentiles.p50 / 1000000).toFixed(2)}ms`);
    console.log(`  p90:  ${(metrics.percentiles.p90 / 1000000).toFixed(2)}ms`);
    console.log(`  p95:  ${(metrics.percentiles.p95 / 1000000).toFixed(2)}ms`);
    console.log(`  p99:  ${(metrics.percentiles.p99 / 1000000).toFixed(2)}ms`);
    console.log(`  p99.9: ${(metrics.percentiles.p999 / 1000000).toFixed(2)}ms`);

    if (this.alerts.length > 0) {
      console.log(`\nAlerts: ${this.alerts.length}`);
      this.alerts.slice(-5).forEach(alert => {
        console.log(`  [${alert.level}] ${alert.message}`);
      });
    }
  }
}

// Usage example
const monitor = new EventLoopMonitor({
  resolution: 10,
  warningThreshold: 50,
  criticalThreshold: 100
});

monitor.start();

// Simulate work
setInterval(() => {
  monitor.check();
}, 5000);

// Simulate CPU-intensive task
setInterval(() => {
  const start = Date.now();
  while (Date.now() - start < 50) {
    // Block event loop for 50ms
  }
}, 10000);

// Print report every minute
setInterval(() => {
  monitor.printReport();
  monitor.reset();
}, 60000);

// Graceful shutdown
process.on('SIGTERM', () => {
  monitor.printReport();
  monitor.stop();
  process.exit(0);
});
```

## Profiling Tools

### Node.js Built-in Profiler

```javascript
/**
 * Using Node.js built-in V8 profiler
 *
 * Run with: node --prof script.js
 * Process with: node --prof-process isolate-*.log
 */

const v8 = require('v8');
const fs = require('fs');

class V8Profiler {
  constructor(outputDir = './profiles') {
    this.outputDir = outputDir;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * Start CPU profiling
   */
  startProfiling(name = 'profile') {
    // Use inspector for programmatic profiling
    const inspector = require('inspector');
    const session = new inspector.Session();
    session.connect();

    return new Promise((resolve, reject) => {
      session.post('Profiler.enable', (err) => {
        if (err) {
          reject(err);
          return;
        }

        session.post('Profiler.start', (err) => {
          if (err) {
            reject(err);
          } else {
            console.log(`CPU profiling started: ${name}`);
            resolve({ session, name });
          }
        });
      });
    });
  }

  /**
   * Stop CPU profiling
   */
  stopProfiling(sessionInfo) {
    return new Promise((resolve, reject) => {
      sessionInfo.session.post('Profiler.stop', (err, { profile }) => {
        if (err) {
          reject(err);
          return;
        }

        const filename = `${sessionInfo.name}-${Date.now()}.cpuprofile`;
        const filepath = `${this.outputDir}/${filename}`;

        fs.writeFileSync(filepath, JSON.stringify(profile, null, 2));
        console.log(`CPU profile saved: ${filepath}`);

        sessionInfo.session.disconnect();
        resolve(filepath);
      });
    });
  }

  /**
   * Profile a specific function
   */
  async profileFunction(fn, name = 'function') {
    const sessionInfo = await this.startProfiling(name);

    try {
      const result = await fn();
      const profilePath = await this.stopProfiling(sessionInfo);

      return { result, profilePath };
    } catch (error) {
      await this.stopProfiling(sessionInfo);
      throw error;
    }
  }

  /**
   * Take heap snapshot
   */
  takeHeapSnapshot(name = 'heap') {
    const filename = `${name}-${Date.now()}.heapsnapshot`;
    const filepath = `${this.outputDir}/${filename}`;

    v8.writeHeapSnapshot(filepath);
    console.log(`Heap snapshot saved: ${filepath}`);

    return filepath;
  }

  /**
   * Get heap statistics
   */
  getHeapStatistics() {
    const stats = v8.getHeapStatistics();
    const spaces = v8.getHeapSpaceStatistics();

    return {
      heap: {
        totalHeapSize: stats.total_heap_size,
        totalHeapSizeExecutable: stats.total_heap_size_executable,
        totalPhysicalSize: stats.total_physical_size,
        totalAvailableSize: stats.total_available_size,
        usedHeapSize: stats.used_heap_size,
        heapSizeLimit: stats.heap_size_limit,
        mallocedMemory: stats.malloced_memory,
        peakMallocedMemory: stats.peak_malloced_memory
      },
      spaces: spaces.map(space => ({
        name: space.space_name,
        size: space.space_size,
        used: space.space_used_size,
        available: space.space_available_size,
        physicalSize: space.physical_space_size
      }))
    };
  }
}

// Example usage
async function demonstrateProfiling() {
  const profiler = new V8Profiler('./cpu-profiles');

  // Profile a CPU-intensive operation
  await profiler.profileFunction(async () => {
    let result = 0;
    for (let i = 0; i < 10000000; i++) {
      result += Math.sqrt(i);
    }
    return result;
  }, 'math-heavy');

  // Take heap snapshot
  profiler.takeHeapSnapshot('after-operation');

  // Get heap statistics
  const stats = profiler.getHeapStatistics();
  console.log('Heap Statistics:', JSON.stringify(stats, null, 2));
}

if (require.main === module) {
  demonstrateProfiling().catch(console.error);
}
```

### Third-Party Profiling Tools

```javascript
/**
 * Integration with popular profiling tools
 *
 * Tools covered:
 * - clinic.js (Doctor, Bubbleprof, Flame)
 * - 0x (Flamegraph)
 * - autocannon (Load testing)
 */

const { spawn } = require('child_process');
const path = require('path');

class ProfilingToolkit {
  /**
   * Clinic.js Doctor - Diagnose performance issues
   */
  static runClinicDoctor(scriptPath, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        'doctor',
        '--on-port', options.onPort || 'autocannon localhost:$PORT',
        '--autocannon', JSON.stringify({
          connections: options.connections || 10,
          duration: options.duration || 30
        }),
        '--',
        scriptPath
      ];

      console.log('Running Clinic.js Doctor...');
      const proc = spawn('clinic', args, { stdio: 'inherit' });

      proc.on('exit', (code) => {
        if (code === 0) {
          console.log('Clinic.js Doctor completed. Open .clinic/*.html to view results.');
          resolve();
        } else {
          reject(new Error(`clinic doctor exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Clinic.js Flame - CPU flamegraphs
   */
  static runClinicFlame(scriptPath, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        'flame',
        '--on-port', options.onPort || 'autocannon localhost:$PORT',
        '--',
        scriptPath
      ];

      console.log('Running Clinic.js Flame...');
      const proc = spawn('clinic', args, { stdio: 'inherit' });

      proc.on('exit', (code) => {
        if (code === 0) {
          console.log('Clinic.js Flame completed. Open .clinic/*.html to view flamegraph.');
          resolve();
        } else {
          reject(new Error(`clinic flame exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Clinic.js Bubbleprof - Async operations
   */
  static runClinicBubbleprof(scriptPath, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        'bubbleprof',
        '--on-port', options.onPort || 'autocannon localhost:$PORT',
        '--',
        scriptPath
      ];

      console.log('Running Clinic.js Bubbleprof...');
      const proc = spawn('clinic', args, { stdio: 'inherit' });

      proc.on('exit', (code) => {
        if (code === 0) {
          console.log('Clinic.js Bubbleprof completed. Open .clinic/*.html to view results.');
          resolve();
        } else {
          reject(new Error(`clinic bubbleprof exited with code ${code}`));
        }
      });
    });
  }

  /**
   * 0x - Flamegraph profiler
   */
  static run0x(scriptPath, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        scriptPath,
        ...(options.args || [])
      ];

      console.log('Running 0x flamegraph profiler...');
      const proc = spawn('0x', args, { stdio: 'inherit' });

      proc.on('exit', (code) => {
        if (code === 0) {
          console.log('0x completed. Flamegraph generated.');
          resolve();
        } else {
          reject(new Error(`0x exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Autocannon - HTTP load testing
   */
  static runAutocannon(url, options = {}) {
    return new Promise((resolve, reject) => {
      const args = [
        '-c', String(options.connections || 10),
        '-d', String(options.duration || 30),
        '-p', String(options.pipelining || 1),
        url
      ];

      console.log('Running autocannon load test...');
      const proc = spawn('autocannon', args, { stdio: 'inherit' });

      proc.on('exit', (code) => {
        if (code === 0) {
          console.log('Autocannon completed.');
          resolve();
        } else {
          reject(new Error(`autocannon exited with code ${code}`));
        }
      });
    });
  }
}

// Example usage
if (require.main === module) {
  const scriptPath = process.argv[2] || './server.js';

  console.log('Profiling Toolkit');
  console.log(`Target script: ${scriptPath}`);
  console.log('\nAvailable commands:');
  console.log('  doctor    - Run Clinic.js Doctor');
  console.log('  flame     - Run Clinic.js Flame');
  console.log('  bubble    - Run Clinic.js Bubbleprof');
  console.log('  0x        - Run 0x flamegraph');
  console.log('  autocannon - Run autocannon load test');
}
```

## Flame Graphs

### Understanding Flame Graphs

```javascript
/**
 * Flame Graph Analysis Guide
 *
 * Flame graphs visualize CPU time spent in different functions.
 * - X-axis: Alphabetical order (NOT time)
 * - Y-axis: Call stack depth
 * - Width: Time spent in function
 * - Color: Usually random (for differentiation)
 */

class FlameGraphAnalyzer {
  /**
   * Generate flame graph data from CPU profile
   */
  static async generateFlameGraphData(cpuProfilePath) {
    const fs = require('fs').promises;
    const profile = JSON.parse(await fs.readFile(cpuProfilePath, 'utf8'));

    const nodes = new Map();
    const samples = [];

    // Build node map
    profile.nodes.forEach(node => {
      nodes.set(node.id, {
        id: node.id,
        functionName: node.callFrame.functionName || '(anonymous)',
        url: node.callFrame.url,
        lineNumber: node.callFrame.lineNumber,
        children: node.children || []
      });
    });

    // Process samples
    let currentTime = profile.startTime;
    profile.samples.forEach((nodeId, i) => {
      const timeDelta = profile.timeDeltas?.[i] || 0;
      currentTime += timeDelta;

      samples.push({
        nodeId,
        time: currentTime,
        timeDelta
      });
    });

    return { nodes, samples, profile };
  }

  /**
   * Analyze hot paths (most time-consuming call stacks)
   */
  static analyzeHotPaths(nodes, samples, topN = 10) {
    const nodeDurations = new Map();

    // Calculate time spent in each node
    samples.forEach(sample => {
      const duration = sample.timeDelta;
      const current = nodeDurations.get(sample.nodeId) || 0;
      nodeDurations.set(sample.nodeId, current + duration);
    });

    // Get top nodes
    const sorted = Array.from(nodeDurations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);

    return sorted.map(([nodeId, duration]) => {
      const node = nodes.get(nodeId);
      return {
        functionName: node?.functionName || 'unknown',
        url: node?.url || 'unknown',
        duration,
        percentage: (duration / samples.reduce((sum, s) => sum + s.timeDelta, 0)) * 100
      };
    });
  }

  /**
   * Find optimization opportunities
   */
  static findOptimizationOpportunities(hotPaths) {
    const opportunities = [];

    hotPaths.forEach(path => {
      if (path.percentage > 10) {
        opportunities.push({
          priority: 'HIGH',
          functionName: path.functionName,
          duration: path.duration,
          percentage: path.percentage,
          recommendation: this.getRecommendation(path)
        });
      } else if (path.percentage > 5) {
        opportunities.push({
          priority: 'MEDIUM',
          functionName: path.functionName,
          duration: path.duration,
          percentage: path.percentage,
          recommendation: this.getRecommendation(path)
        });
      }
    });

    return opportunities;
  }

  static getRecommendation(path) {
    const name = path.functionName.toLowerCase();

    if (name.includes('json')) {
      return 'Consider using faster JSON parser or reducing JSON payload size';
    }
    if (name.includes('parse')) {
      return 'Review parsing logic for optimization opportunities';
    }
    if (name.includes('validate')) {
      return 'Consider caching validation results or using faster validation';
    }
    if (name.includes('regex') || name.includes('match')) {
      return 'Optimize regex patterns or use alternative string methods';
    }
    if (name.includes('loop') || name.includes('foreach')) {
      return 'Review loop logic, consider parallelization or optimization';
    }

    return 'Profile this function in isolation to identify bottlenecks';
  }

  /**
   * Print flame graph analysis report
   */
  static async analyzeProfile(cpuProfilePath) {
    console.log('=== Flame Graph Analysis ===\n');

    const { nodes, samples } = await this.generateFlameGraphData(cpuProfilePath);
    const hotPaths = this.analyzeHotPaths(nodes, samples, 10);
    const opportunities = this.findOptimizationOpportunities(hotPaths);

    console.log('Hot Paths (Top 10):');
    hotPaths.forEach((path, i) => {
      console.log(`${i + 1}. ${path.functionName}`);
      console.log(`   Duration: ${path.duration.toFixed(2)}µs`);
      console.log(`   Percentage: ${path.percentage.toFixed(2)}%`);
      console.log(`   URL: ${path.url}`);
      console.log();
    });

    if (opportunities.length > 0) {
      console.log('\n=== Optimization Opportunities ===\n');
      opportunities.forEach((opp, i) => {
        console.log(`${i + 1}. [${opp.priority}] ${opp.functionName}`);
        console.log(`   ${opp.percentage.toFixed(2)}% of CPU time`);
        console.log(`   Recommendation: ${opp.recommendation}`);
        console.log();
      });
    }
  }
}

// Example usage
if (require.main === module) {
  const profilePath = process.argv[2];

  if (!profilePath) {
    console.error('Usage: node script.js <path-to-cpu-profile>');
    process.exit(1);
  }

  FlameGraphAnalyzer.analyzeProfile(profilePath)
    .catch(console.error);
}
```

### Reading Flame Graphs

```javascript
/**
 * Flame Graph Reading Guide
 */

const FLAMEGRAPH_GUIDE = {
  structure: {
    title: 'Flame Graph Structure',
    description: `
      - Bottom to top: Call stack (bottom = entry point)
      - Left to right: Alphabetical order (NOT chronological)
      - Width: Time spent in function (including children)
      - Height: Stack depth
    `
  },

  patterns: {
    title: 'Common Patterns',
    patterns: [
      {
        name: 'Wide Box at Top',
        meaning: 'Function consuming significant CPU time',
        action: 'Primary optimization target'
      },
      {
        name: 'Tall Stack',
        meaning: 'Deep call chain',
        action: 'May indicate excessive abstraction or recursion'
      },
      {
        name: 'Many Thin Boxes',
        meaning: 'Many small functions called',
        action: 'Check if function call overhead is significant'
      },
      {
        name: 'Flat Plateau',
        meaning: 'Time distributed across many functions',
        action: 'No single hot spot, optimization harder'
      },
      {
        name: 'Spiky Pattern',
        meaning: 'Irregular performance',
        action: 'May indicate GC, event loop blocking, or caching effects'
      }
    ]
  },

  colors: {
    title: 'Color Interpretation',
    note: 'Colors vary by tool, but typically:',
    meanings: [
      'Red/Orange: JavaScript code',
      'Yellow: C++ (Node.js internals)',
      'Green: System/kernel',
      'Purple: GC or runtime',
      'Blue: Native modules'
    ]
  },

  analysis: {
    title: 'Analysis Process',
    steps: [
      '1. Identify widest boxes (most CPU time)',
      '2. Check if box width is expected for that function',
      '3. Look at parent/child relationships',
      '4. Compare similar operations (should have similar widths)',
      '5. Focus on user code (not Node.js internals)',
      '6. Look for unexpected patterns'
    ]
  }
};

function printFlameGraphGuide() {
  console.log('=== Flame Graph Reading Guide ===\n');

  Object.entries(FLAMEGRAPH_GUIDE).forEach(([key, section]) => {
    console.log(`\n${section.title}`);
    console.log('='.repeat(section.title.length));

    if (section.description) {
      console.log(section.description);
    }

    if (section.patterns) {
      section.patterns.forEach(pattern => {
        console.log(`\n${pattern.name}:`);
        console.log(`  Meaning: ${pattern.meaning}`);
        console.log(`  Action: ${pattern.action}`);
      });
    }

    if (section.meanings) {
      section.meanings.forEach(meaning => {
        console.log(`  - ${meaning}`);
      });
    }

    if (section.steps) {
      section.steps.forEach(step => {
        console.log(`  ${step}`);
      });
    }

    if (section.note) {
      console.log(`\n  Note: ${section.note}`);
    }
  });

  console.log('\n=== Key Takeaways ===');
  console.log('  - Width = Time spent (most important metric)');
  console.log('  - Focus on wide boxes in YOUR code');
  console.log('  - Compare similar operations');
  console.log('  - Look for unexpected patterns');
  console.log('  - Profile before and after optimization');
}

if (require.main === module) {
  printFlameGraphGuide();
}
```

## Performance Analysis

### Identifying Bottlenecks

```javascript
/**
 * Systematic Bottleneck Identification
 */

const { performance } = require('perf_hooks');

class BottleneckDetector {
  constructor() {
    this.measurements = new Map();
    this.thresholds = {
      slow: 100,
      verySlow: 500,
      critical: 1000
    };
  }

  /**
   * Instrument function for automatic measurement
   */
  instrument(fn, name) {
    return async (...args) => {
      const start = performance.now();
      const startCPU = process.cpuUsage();

      try {
        const result = await fn(...args);
        const duration = performance.now() - start;
        const cpuUsage = process.cpuUsage(startCPU);

        this.recordMeasurement(name, {
          duration,
          cpuUser: cpuUsage.user / 1000,
          cpuSystem: cpuUsage.system / 1000,
          success: true
        });

        return result;
      } catch (error) {
        const duration = performance.now() - start;
        const cpuUsage = process.cpuUsage(startCPU);

        this.recordMeasurement(name, {
          duration,
          cpuUser: cpuUsage.user / 1000,
          cpuSystem: cpuUsage.system / 1000,
          success: false,
          error: error.message
        });

        throw error;
      }
    };
  }

  recordMeasurement(name, data) {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }

    this.measurements.get(name).push({
      ...data,
      timestamp: Date.now()
    });
  }

  /**
   * Analyze measurements and identify bottlenecks
   */
  analyzeBottlenecks() {
    const bottlenecks = [];

    for (const [name, measurements] of this.measurements) {
      const stats = this.calculateStatistics(measurements);

      const severity = this.determineSeverity(stats);
      if (severity) {
        bottlenecks.push({
          name,
          severity,
          stats,
          recommendations: this.getRecommendations(stats)
        });
      }
    }

    return bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 0, verySlow: 1, slow: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  calculateStatistics(measurements) {
    const durations = measurements.map(m => m.duration);
    const cpuUsers = measurements.map(m => m.cpuUser);
    const successes = measurements.filter(m => m.success).length;

    return {
      count: measurements.length,
      successRate: (successes / measurements.length) * 100,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        mean: durations.reduce((a, b) => a + b, 0) / durations.length,
        p50: this.percentile(durations, 50),
        p95: this.percentile(durations, 95),
        p99: this.percentile(durations, 99)
      },
      cpu: {
        mean: cpuUsers.reduce((a, b) => a + b, 0) / cpuUsers.length,
        max: Math.max(...cpuUsers)
      },
      cpuRatio: (cpuUsers.reduce((a, b) => a + b, 0) / durations.reduce((a, b) => a + b, 0))
    };
  }

  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  determineSeverity(stats) {
    if (stats.duration.p95 > this.thresholds.critical) {
      return 'critical';
    }
    if (stats.duration.p95 > this.thresholds.verySlow) {
      return 'verySlow';
    }
    if (stats.duration.p95 > this.thresholds.slow) {
      return 'slow';
    }
    return null;
  }

  getRecommendations(stats) {
    const recommendations = [];

    if (stats.cpuRatio > 0.8) {
      recommendations.push('CPU-bound operation - consider optimization or offloading');
    } else if (stats.cpuRatio < 0.2) {
      recommendations.push('I/O-bound operation - check external dependencies');
    }

    if (stats.duration.max > stats.duration.mean * 10) {
      recommendations.push('High variance - investigate outliers');
    }

    if (stats.successRate < 95) {
      recommendations.push(`Low success rate (${stats.successRate.toFixed(1)}%) - check error handling`);
    }

    if (stats.duration.p99 > stats.duration.p95 * 2) {
      recommendations.push('Long tail latency - investigate p99 cases');
    }

    return recommendations;
  }

  printReport() {
    const bottlenecks = this.analyzeBottlenecks();

    console.log('\n=== Performance Bottleneck Report ===\n');

    if (bottlenecks.length === 0) {
      console.log('No significant bottlenecks detected.');
      return;
    }

    bottlenecks.forEach((bottleneck, i) => {
      console.log(`${i + 1}. ${bottleneck.name} [${bottleneck.severity.toUpperCase()}]`);
      console.log(`   Calls: ${bottleneck.stats.count}`);
      console.log(`   Success Rate: ${bottleneck.stats.successRate.toFixed(1)}%`);
      console.log(`   Duration (ms):`);
      console.log(`     Mean: ${bottleneck.stats.duration.mean.toFixed(2)}`);
      console.log(`     P95:  ${bottleneck.stats.duration.p95.toFixed(2)}`);
      console.log(`     P99:  ${bottleneck.stats.duration.p99.toFixed(2)}`);
      console.log(`     Max:  ${bottleneck.stats.duration.max.toFixed(2)}`);
      console.log(`   CPU Usage (ms):`);
      console.log(`     Mean: ${bottleneck.stats.cpu.mean.toFixed(2)}`);
      console.log(`     Max:  ${bottleneck.stats.cpu.max.toFixed(2)}`);
      console.log(`   CPU Ratio: ${(bottleneck.stats.cpuRatio * 100).toFixed(1)}%`);

      if (bottleneck.recommendations.length > 0) {
        console.log(`   Recommendations:`);
        bottleneck.recommendations.forEach(rec => {
          console.log(`     - ${rec}`);
        });
      }

      console.log();
    });
  }

  reset() {
    this.measurements.clear();
  }
}

// Example usage
async function demonstrateBottleneckDetection() {
  const detector = new BottleneckDetector();

  // Simulate different types of operations
  const cpuIntensive = detector.instrument(async () => {
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(i);
    }
    return result;
  }, 'cpu-intensive');

  const ioIntensive = detector.instrument(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'done';
  }, 'io-intensive');

  const mixed = detector.instrument(async () => {
    let result = 0;
    for (let i = 0; i < 100000; i++) {
      result += Math.sqrt(i);
    }
    await new Promise(resolve => setTimeout(resolve, 50));
    return result;
  }, 'mixed');

  // Run operations multiple times
  for (let i = 0; i < 20; i++) {
    await cpuIntensive();
    await ioIntensive();
    await mixed();
  }

  detector.printReport();
}

if (require.main === module) {
  demonstrateBottleneckDetection().catch(console.error);
}
```

## Optimization Techniques

### Algorithm Optimization

```javascript
/**
 * Algorithm-level optimizations
 */

class AlgorithmOptimizations {
  /**
   * Example 1: Array operations
   */
  static demonstrateArrayOptimizations() {
    console.log('=== Array Optimizations ===\n');

    const data = Array.from({ length: 100000 }, (_, i) => ({
      id: i,
      value: Math.random(),
      category: i % 10
    }));

    // SLOW: Multiple passes
    console.time('Multiple passes');
    const filtered = data.filter(item => item.value > 0.5);
    const mapped = filtered.map(item => item.value * 2);
    const sumSlow = mapped.reduce((sum, val) => sum + val, 0);
    console.timeEnd('Multiple passes');

    // FAST: Single pass
    console.time('Single pass');
    const sumFast = data.reduce((sum, item) => {
      if (item.value > 0.5) {
        return sum + (item.value * 2);
      }
      return sum;
    }, 0);
    console.timeEnd('Single pass');

    console.log(`Results equal: ${Math.abs(sumSlow - sumFast) < 0.001}\n`);
  }

  /**
   * Example 2: Object property access
   */
  static demonstratePropertyAccess() {
    console.log('=== Property Access Optimization ===\n');

    const obj = { a: { b: { c: { d: { e: 'value' } } } } };

    // SLOW: Repeated deep access
    console.time('Repeated access');
    for (let i = 0; i < 100000; i++) {
      const val = obj.a.b.c.d.e;
      if (val === 'value') {
        // Do something
      }
    }
    console.timeEnd('Repeated access');

    // FAST: Cache the value
    console.time('Cached access');
    const cachedVal = obj.a.b.c.d.e;
    for (let i = 0; i < 100000; i++) {
      if (cachedVal === 'value') {
        // Do something
      }
    }
    console.timeEnd('Cached access');

    console.log();
  }

  /**
   * Example 3: String concatenation
   */
  static demonstrateStringOptimizations() {
    console.log('=== String Concatenation ===\n');

    const parts = Array.from({ length: 10000 }, (_, i) => `part${i}`);

    // SLOW: String concatenation in loop
    console.time('String concat');
    let strSlow = '';
    for (const part of parts) {
      strSlow += part + ',';
    }
    console.timeEnd('String concat');

    // FAST: Array join
    console.time('Array join');
    const strFast = parts.join(',') + ',';
    console.timeEnd('Array join');

    console.log(`Results equal: ${strSlow === strFast}\n`);
  }

  /**
   * Example 4: Loop optimizations
   */
  static demonstrateLoopOptimizations() {
    console.log('=== Loop Optimizations ===\n');

    const data = Array.from({ length: 100000 }, (_, i) => i);

    // SLOW: Property access in loop condition
    console.time('Property in condition');
    let sum1 = 0;
    for (let i = 0; i < data.length; i++) {
      sum1 += data[i];
    }
    console.timeEnd('Property in condition');

    // FAST: Cache length
    console.time('Cached length');
    let sum2 = 0;
    const len = data.length;
    for (let i = 0; i < len; i++) {
      sum2 += data[i];
    }
    console.timeEnd('Cached length');

    console.log(`Results equal: ${sum1 === sum2}\n`);
  }

  /**
   * Example 5: Data structure selection
   */
  static demonstrateDataStructures() {
    console.log('=== Data Structure Selection ===\n');

    const size = 10000;
    const searches = 1000;

    // Array for lookup
    const array = Array.from({ length: size }, (_, i) => ({ id: i, value: i }));

    console.time('Array lookup');
    for (let i = 0; i < searches; i++) {
      const target = Math.floor(Math.random() * size);
      const found = array.find(item => item.id === target);
    }
    console.timeEnd('Array lookup');

    // Map for lookup
    const map = new Map(array.map(item => [item.id, item]));

    console.time('Map lookup');
    for (let i = 0; i < searches; i++) {
      const target = Math.floor(Math.random() * size);
      const found = map.get(target);
    }
    console.timeEnd('Map lookup');

    console.log();
  }

  /**
   * Example 6: Memoization
   */
  static demonstrateMemoization() {
    console.log('=== Memoization ===\n');

    // Expensive function
    function fibonacci(n) {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    }

    // Memoized version
    const cache = new Map();
    function fibonacciMemo(n) {
      if (n <= 1) return n;
      if (cache.has(n)) return cache.get(n);

      const result = fibonacciMemo(n - 1) + fibonacciMemo(n - 2);
      cache.set(n, result);
      return result;
    }

    console.time('Without memoization');
    fibonacci(35);
    console.timeEnd('Without memoization');

    console.time('With memoization');
    fibonacciMemo(35);
    console.timeEnd('With memoization');

    console.log();
  }
}

// Run all demonstrations
if (require.main === module) {
  AlgorithmOptimizations.demonstrateArrayOptimizations();
  AlgorithmOptimizations.demonstratePropertyAccess();
  AlgorithmOptimizations.demonstrateStringOptimizations();
  AlgorithmOptimizations.demonstrateLoopOptimizations();
  AlgorithmOptimizations.demonstrateDataStructures();
  AlgorithmOptimizations.demonstrateMemoization();
}
```

### V8 Optimization Tips

```javascript
/**
 * V8 Engine Optimization Techniques
 */

class V8Optimizations {
  /**
   * Hidden Classes - Keep object shapes consistent
   */
  static demonstrateHiddenClasses() {
    console.log('=== Hidden Classes (Object Shapes) ===\n');

    // BAD: Inconsistent object shapes
    console.time('Inconsistent shapes');
    const arr1 = [];
    for (let i = 0; i < 100000; i++) {
      if (i % 2 === 0) {
        arr1.push({ a: i, b: i * 2 });
      } else {
        arr1.push({ b: i * 2, a: i }); // Different property order
      }
    }
    console.timeEnd('Inconsistent shapes');

    // GOOD: Consistent object shapes
    console.time('Consistent shapes');
    const arr2 = [];
    for (let i = 0; i < 100000; i++) {
      arr2.push({ a: i, b: i * 2 }); // Always same order
    }
    console.timeEnd('Consistent shapes');

    console.log();
  }

  /**
   * Inline Caching - Monomorphic vs Polymorphic
   */
  static demonstrateInlineCaching() {
    console.log('=== Inline Caching ===\n');

    class Point2D {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }
    }

    class Point3D {
      constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
      }
    }

    function getX(point) {
      return point.x;
    }

    // GOOD: Monomorphic (one type)
    console.time('Monomorphic');
    const points2D = Array.from({ length: 100000 }, (_, i) => new Point2D(i, i));
    let sum1 = 0;
    for (const point of points2D) {
      sum1 += getX(point); // Always Point2D
    }
    console.timeEnd('Monomorphic');

    // BAD: Polymorphic (multiple types)
    console.time('Polymorphic');
    const pointsMixed = [];
    for (let i = 0; i < 100000; i++) {
      pointsMixed.push(i % 2 === 0 ? new Point2D(i, i) : new Point3D(i, i, i));
    }
    let sum2 = 0;
    for (const point of pointsMixed) {
      sum2 += getX(point); // Sometimes Point2D, sometimes Point3D
    }
    console.timeEnd('Polymorphic');

    console.log();
  }

  /**
   * Array optimizations
   */
  static demonstrateArrayOptimizations() {
    console.log('=== Array Optimizations ===\n');

    // GOOD: Same type elements (PACKED_SMI_ELEMENTS)
    console.time('Homogeneous array');
    const arr1 = new Array(100000);
    for (let i = 0; i < arr1.length; i++) {
      arr1[i] = i;
    }
    let sum1 = 0;
    for (let i = 0; i < arr1.length; i++) {
      sum1 += arr1[i];
    }
    console.timeEnd('Homogeneous array');

    // BAD: Mixed types (PACKED_ELEMENTS)
    console.time('Heterogeneous array');
    const arr2 = new Array(100000);
    for (let i = 0; i < arr2.length; i++) {
      arr2[i] = i % 2 === 0 ? i : String(i); // Mixed types
    }
    let sum2 = 0;
    for (let i = 0; i < arr2.length; i++) {
      sum2 += typeof arr2[i] === 'number' ? arr2[i] : 0;
    }
    console.timeEnd('Heterogeneous array');

    // BAD: Holes in array (HOLEY_ELEMENTS)
    console.time('Holey array');
    const arr3 = new Array(100000);
    for (let i = 0; i < 50000; i++) {
      arr3[i * 2] = i; // Create holes
    }
    let sum3 = 0;
    for (let i = 0; i < arr3.length; i++) {
      if (arr3[i] !== undefined) {
        sum3 += arr3[i];
      }
    }
    console.timeEnd('Holey array');

    console.log();
  }

  /**
   * Function optimization
   */
  static demonstrateFunctionOptimizations() {
    console.log('=== Function Optimizations ===\n');

    // GOOD: Predictable function
    function addOptimized(a, b) {
      return a + b; // Always numbers
    }

    // BAD: Unpredictable function
    function addUnoptimized(a, b) {
      return a + b; // Could be numbers or strings
    }

    console.time('Optimized function');
    let sum1 = 0;
    for (let i = 0; i < 1000000; i++) {
      sum1 = addOptimized(sum1, i);
    }
    console.timeEnd('Optimized function');

    console.time('Unoptimized function');
    let sum2 = 0;
    for (let i = 0; i < 1000000; i++) {
      // Mix types randomly
      if (i % 1000 === 0) {
        sum2 = addUnoptimized(String(sum2), String(i));
        sum2 = Number(sum2);
      } else {
        sum2 = addUnoptimized(sum2, i);
      }
    }
    console.timeEnd('Unoptimized function');

    console.log();
  }

  /**
   * Avoid deoptimization
   */
  static demonstrateDeoptimization() {
    console.log('=== Avoiding Deoptimization ===\n');

    // These patterns cause deoptimization:
    // - try/catch in hot code
    // - with statements
    // - eval
    // - arguments object manipulation
    // - Accessing beyond array bounds

    // BAD: try/catch in hot loop
    console.time('With try/catch');
    let sum1 = 0;
    for (let i = 0; i < 100000; i++) {
      try {
        sum1 += Math.sqrt(i);
      } catch (e) {
        // Rarely happens but prevents optimization
      }
    }
    console.timeEnd('With try/catch');

    // GOOD: try/catch outside loop
    console.time('try/catch outside');
    let sum2 = 0;
    try {
      for (let i = 0; i < 100000; i++) {
        sum2 += Math.sqrt(i);
      }
    } catch (e) {
      console.error(e);
    }
    console.timeEnd('try/catch outside');

    console.log();
  }
}

// Run all demonstrations
if (require.main === module) {
  V8Optimizations.demonstrateHiddenClasses();
  V8Optimizations.demonstrateInlineCaching();
  V8Optimizations.demonstrateArrayOptimizations();
  V8Optimizations.demonstrateFunctionOptimizations();
  V8Optimizations.demonstrateDeoptimization();
}
```

## Production Profiling

### Safe Production Profiling

```javascript
/**
 * Production-safe profiling techniques
 */

class ProductionProfiler {
  constructor(options = {}) {
    this.samplingRate = options.samplingRate || 0.01; // 1% of requests
    this.maxProfileDuration = options.maxProfileDuration || 30000; // 30 seconds
    this.cooldownPeriod = options.cooldownPeriod || 300000; // 5 minutes
    this.lastProfileTime = 0;
    this.currentProfile = null;
  }

  /**
   * Decide if request should be profiled
   */
  shouldProfile() {
    // Check cooldown
    if (Date.now() - this.lastProfileTime < this.cooldownPeriod) {
      return false;
    }

    // Check if already profiling
    if (this.currentProfile) {
      return false;
    }

    // Random sampling
    return Math.random() < this.samplingRate;
  }

  /**
   * Start profiling if conditions are met
   */
  async maybeStartProfile(requestId) {
    if (!this.shouldProfile()) {
      return null;
    }

    const inspector = require('inspector');
    const session = new inspector.Session();
    session.connect();

    this.lastProfileTime = Date.now();
    this.currentProfile = {
      requestId,
      session,
      startTime: Date.now()
    };

    return new Promise((resolve, reject) => {
      session.post('Profiler.enable', (err) => {
        if (err) {
          this.currentProfile = null;
          reject(err);
          return;
        }

        session.post('Profiler.start', (err) => {
          if (err) {
            this.currentProfile = null;
            reject(err);
          } else {
            console.log(`[Profiler] Started for request ${requestId}`);

            // Auto-stop after max duration
            setTimeout(() => {
              if (this.currentProfile && this.currentProfile.requestId === requestId) {
                this.stopProfile().catch(console.error);
              }
            }, this.maxProfileDuration);

            resolve();
          }
        });
      });
    });
  }

  /**
   * Stop current profile
   */
  async stopProfile() {
    if (!this.currentProfile) {
      return null;
    }

    const { requestId, session, startTime } = this.currentProfile;
    const duration = Date.now() - startTime;

    return new Promise((resolve, reject) => {
      session.post('Profiler.stop', (err, { profile }) => {
        if (err) {
          reject(err);
          return;
        }

        session.disconnect();
        this.currentProfile = null;

        console.log(`[Profiler] Stopped for request ${requestId} (duration: ${duration}ms)`);

        // In production, send to storage/analysis service
        this.storeProfile(requestId, profile, duration);

        resolve({ requestId, profile, duration });
      });
    });
  }

  /**
   * Store profile for later analysis
   */
  storeProfile(requestId, profile, duration) {
    const fs = require('fs');
    const path = require('path');

    const dir = './profiles/production';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filename = `${requestId}-${Date.now()}.cpuprofile`;
    const filepath = path.join(dir, filename);

    fs.writeFileSync(filepath, JSON.stringify({
      requestId,
      duration,
      timestamp: Date.now(),
      profile
    }, null, 2));

    console.log(`[Profiler] Profile saved: ${filepath}`);

    // In production, you might:
    // - Upload to S3/Cloud Storage
    // - Send to analysis service
    // - Store metadata in database
  }

  /**
   * Express middleware for automatic profiling
   */
  middleware() {
    return async (req, res, next) => {
      const requestId = req.id || require('crypto').randomUUID();

      try {
        await this.maybeStartProfile(requestId);
      } catch (error) {
        console.error('[Profiler] Failed to start:', error);
      }

      // Continue with request
      next();

      // Stop profiling after response
      res.on('finish', async () => {
        if (this.currentProfile && this.currentProfile.requestId === requestId) {
          try {
            await this.stopProfile();
          } catch (error) {
            console.error('[Profiler] Failed to stop:', error);
          }
        }
      });
    };
  }
}

// Usage with Express
const express = require('express');
const app = express();

const profiler = new ProductionProfiler({
  samplingRate: 0.01,        // Profile 1% of requests
  maxProfileDuration: 30000, // Max 30 seconds
  cooldownPeriod: 300000     // 5 minutes between profiles
});

app.use(profiler.middleware());

app.get('/api/data', (req, res) => {
  // Your handler
  res.json({ data: 'response' });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log('Server with production profiling running on port 3000');
  });
}
```

## Case Studies

### Case Study 1: API Response Time Optimization

```javascript
/**
 * CASE STUDY: E-commerce API Response Time
 *
 * Problem: API response time degraded from 50ms to 500ms
 * Impact: Customer complaints, reduced conversion rate
 * Root Cause: N+1 query problem in product listing
 * Solution: Implemented data loader pattern with batching
 */

// BEFORE: N+1 queries
class ProductServiceBefore {
  async getProducts(ids) {
    const products = [];

    for (const id of ids) {
      const product = await this.db.query(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      // Additional query for each product
      const reviews = await this.db.query(
        'SELECT * FROM reviews WHERE product_id = ?',
        [id]
      );

      products.push({
        ...product,
        reviews
      });
    }

    return products;
  }
}

// AFTER: Batched queries with DataLoader
class ProductServiceAfter {
  constructor(db) {
    this.db = db;
    this.productLoader = this.createProductLoader();
    this.reviewLoader = this.createReviewLoader();
  }

  createProductLoader() {
    return new DataLoader(async (ids) => {
      const products = await this.db.query(
        'SELECT * FROM products WHERE id IN (?)',
        [ids]
      );

      // Return in same order as requested
      const productMap = new Map(products.map(p => [p.id, p]));
      return ids.map(id => productMap.get(id));
    });
  }

  createReviewLoader() {
    return new DataLoader(async (productIds) => {
      const reviews = await this.db.query(
        'SELECT * FROM reviews WHERE product_id IN (?)',
        [productIds]
      );

      // Group by product_id
      const reviewMap = new Map();
      for (const review of reviews) {
        if (!reviewMap.has(review.product_id)) {
          reviewMap.set(review.product_id, []);
        }
        reviewMap.get(review.product_id).push(review);
      }

      return productIds.map(id => reviewMap.get(id) || []);
    });
  }

  async getProducts(ids) {
    const products = await Promise.all(
      ids.map(id => this.productLoader.load(id))
    );

    const reviews = await Promise.all(
      ids.map(id => this.reviewLoader.load(id))
    );

    return products.map((product, i) => ({
      ...product,
      reviews: reviews[i]
    }));
  }
}

/**
 * Results:
 * - Response time: 500ms -> 60ms (8x improvement)
 * - Database queries: 201 -> 2 (100x reduction)
 * - Throughput: 20 req/s -> 160 req/s (8x improvement)
 */

// Simple DataLoader implementation
class DataLoader {
  constructor(batchFn, options = {}) {
    this.batchFn = batchFn;
    this.cache = new Map();
    this.queue = [];
    this.batchScheduled = false;
    this.maxBatchSize = options.maxBatchSize || 100;
  }

  load(key) {
    if (this.cache.has(key)) {
      return Promise.resolve(this.cache.get(key));
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });

      if (!this.batchScheduled) {
        this.batchScheduled = true;
        process.nextTick(() => this.dispatch());
      }
    });
  }

  async dispatch() {
    this.batchScheduled = false;

    const queue = this.queue.splice(0, this.maxBatchSize);
    if (queue.length === 0) return;

    const keys = queue.map(item => item.key);

    try {
      const results = await this.batchFn(keys);

      queue.forEach((item, index) => {
        const result = results[index];
        this.cache.set(item.key, result);
        item.resolve(result);
      });
    } catch (error) {
      queue.forEach(item => item.reject(error));
    }
  }

  clear() {
    this.cache.clear();
  }
}
```

## Best Practices

```javascript
/**
 * CPU Performance Best Practices
 */

const CPU_PERFORMANCE_BEST_PRACTICES = {
  profiling: [
    'Profile in production with sampling',
    'Use flame graphs to identify hot spots',
    'Profile before and after optimization',
    'Monitor event loop delay',
    'Track CPU usage metrics'
  ],

  optimization: [
    'Optimize hot paths first (biggest impact)',
    'Use appropriate data structures',
    'Cache expensive computations',
    'Minimize object allocations in loops',
    'Keep object shapes consistent',
    'Avoid deoptimization patterns',
    'Use worker threads for CPU-intensive tasks'
  ],

  monitoring: [
    'Track response time percentiles (p50, p95, p99)',
    'Monitor event loop lag',
    'Set up alerting for performance degradation',
    'Use APM tools in production',
    'Implement distributed tracing'
  ],

  testing: [
    'Load test before production',
    'Test with production-like data',
    'Measure performance in CI/CD',
    'Use benchmarking tools',
    'Test optimization impact'
  ]
};

console.log('CPU Performance Best Practices:\n');
Object.entries(CPU_PERFORMANCE_BEST_PRACTICES).forEach(([category, practices]) => {
  console.log(`${category.toUpperCase()}:`);
  practices.forEach(practice => {
    console.log(`  - ${practice}`);
  });
  console.log();
});
```

## Anti-Patterns

```javascript
/**
 * Common CPU Performance Anti-Patterns
 */

// ANTI-PATTERN 1: Blocking event loop
// BAD
function blockingOperation() {
  const start = Date.now();
  while (Date.now() - start < 1000) {
    // Block for 1 second
  }
}

// GOOD
async function nonBlockingOperation() {
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// ANTI-PATTERN 2: Synchronous I/O in hot path
// BAD
const fs = require('fs');
function readConfigSync() {
  return JSON.parse(fs.readFileSync('./config.json', 'utf8'));
}

// GOOD
const configCache = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
function readConfig() {
  return configCache;
}

// ANTI-PATTERN 3: Premature optimization
// BAD: Optimizing before profiling
function overOptimized() {
  // Complex, hard-to-maintain code
  // that doesn't actually improve performance
}

// GOOD: Profile first, then optimize
function profileFirst() {
  // Simple, maintainable code
  // Optimize only after profiling shows need
}

// ANTI-PATTERN 4: Ignoring async/await overhead
// BAD: Unnecessary async
async function unnecessaryAsync(x) {
  return x * 2; // No async operation
}

// GOOD: Only use async when needed
function synchronous(x) {
  return x * 2;
}

// ANTI-PATTERN 5: Large object allocations in loops
// BAD
function allocatingLoop() {
  for (let i = 0; i < 10000; i++) {
    const obj = {
      a: i,
      b: i * 2,
      c: i * 3,
      // ... many properties
    };
    process(obj);
  }
}

// GOOD: Reuse objects when possible
function reusingLoop() {
  const obj = { a: 0, b: 0, c: 0 };
  for (let i = 0; i < 10000; i++) {
    obj.a = i;
    obj.b = i * 2;
    obj.c = i * 3;
    process(obj);
  }
}
```

## Conclusion

CPU profiling and optimization is essential for high-performance Node.js applications:

1. **Profile First** - Measure before optimizing
2. **Use Tools** - Leverage flame graphs and profilers
3. **Focus on Hot Paths** - Optimize code that runs most often
4. **Monitor Production** - Track performance metrics
5. **Test Impact** - Verify optimization improvements

**Key Takeaways:**
- Event loop health is critical
- Profile with realistic workloads
- Optimize algorithms before micro-optimizations
- Use appropriate data structures
- Monitor continuously in production
- Test optimization impact
- Balance performance with maintainability
