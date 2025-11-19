/**
 * Advanced Memory Leak Detection System
 *
 * This module demonstrates enterprise-grade memory leak detection using:
 * - Heap snapshot analysis and comparison
 * - Memory growth trend detection
 * - Leak pattern recognition
 * - Automated alerting and reporting
 * - Integration with monitoring systems
 *
 * Production Features:
 * - Continuous memory monitoring
 * - Automated heap dumps on thresholds
 * - Delta analysis between snapshots
 * - Leak classification and ranking
 * - Performance impact minimization
 * - Integration with APM tools
 *
 * @module MemoryLeakDetection
 */

const v8 = require('v8');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

/**
 * Memory Leak Detector Configuration
 */
const DEFAULT_CONFIG = {
  // Monitoring intervals
  checkInterval: 5000,              // Check memory every 5 seconds
  snapshotInterval: 60000,          // Take snapshot every minute

  // Thresholds
  heapGrowthThreshold: 10,          // MB per minute
  externalGrowthThreshold: 5,       // MB per minute
  heapUsageThreshold: 85,           // Percentage

  // Snapshot settings
  maxSnapshots: 10,
  snapshotDir: './heap-snapshots',
  autoHeapDump: true,

  // Alert settings
  alertOnGrowth: true,
  alertOnThreshold: true,
  alertCooldown: 300000,            // 5 minutes between alerts

  // Analysis
  enableTrendAnalysis: true,
  trendWindow: 10,                  // Number of samples for trend
  enableLeakPatterns: true,

  // Performance
  maxAnalysisTime: 5000,            // Max time for analysis
  enableSampling: true,
  samplingRate: 0.1,                // 10% sampling during high load
};

/**
 * Memory Snapshot with metadata
 */
class MemorySnapshot {
  constructor(stats) {
    this.timestamp = Date.now();
    this.stats = stats;
    this.heapUsed = stats.heapUsed;
    this.heapTotal = stats.heapTotal;
    this.external = stats.external;
    this.arrayBuffers = stats.arrayBuffers;
    this.rss = stats.rss;
  }

  /**
   * Calculate delta from another snapshot
   */
  delta(other) {
    return {
      timeDelta: this.timestamp - other.timestamp,
      heapUsedDelta: this.heapUsed - other.heapUsed,
      heapTotalDelta: this.heapTotal - other.heapTotal,
      externalDelta: this.external - other.external,
      rssDelta: this.rss - other.rss,
      heapUsagePercent: (this.heapUsed / this.heapTotal) * 100,
    };
  }

  /**
   * Calculate growth rate (MB per minute)
   */
  growthRate(other) {
    const delta = this.delta(other);
    const minutes = delta.timeDelta / 60000;

    return {
      heapGrowth: (delta.heapUsedDelta / 1024 / 1024) / minutes,
      externalGrowth: (delta.externalDelta / 1024 / 1024) / minutes,
      rssGrowth: (delta.rssDelta / 1024 / 1024) / minutes,
    };
  }
}

/**
 * Trend Analysis Engine
 */
class TrendAnalyzer {
  constructor(windowSize = 10) {
    this.windowSize = windowSize;
    this.samples = [];
  }

  addSample(snapshot) {
    this.samples.push(snapshot);
    if (this.samples.length > this.windowSize) {
      this.samples.shift();
    }
  }

  /**
   * Detect if memory is growing consistently
   */
  detectGrowthTrend() {
    if (this.samples.length < 3) return null;

    const deltas = [];
    for (let i = 1; i < this.samples.length; i++) {
      const rate = this.samples[i].growthRate(this.samples[i - 1]);
      deltas.push(rate.heapGrowth);
    }

    // Check if majority of deltas are positive (growing)
    const positiveCount = deltas.filter(d => d > 0).length;
    const avgGrowth = deltas.reduce((a, b) => a + b, 0) / deltas.length;

    return {
      isGrowing: positiveCount / deltas.length > 0.7,
      avgGrowthRate: avgGrowth,
      consistency: positiveCount / deltas.length,
      samples: this.samples.length,
    };
  }

  /**
   * Calculate linear regression for trend prediction
   */
  predictTrend() {
    if (this.samples.length < 3) return null;

    const n = this.samples.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    this.samples.forEach((snapshot, i) => {
      const x = i;
      const y = snapshot.heapUsed / 1024 / 1024; // MB
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next 5 intervals
    const predictions = [];
    for (let i = 0; i < 5; i++) {
      const x = n + i;
      predictions.push({
        interval: i + 1,
        predictedHeapMB: slope * x + intercept,
      });
    }

    return {
      slope: slope, // MB per interval
      intercept,
      predictions,
      confidence: this.calculateConfidence(slope, intercept),
    };
  }

  calculateConfidence(slope, intercept) {
    // Calculate R-squared
    const yMean = this.samples.reduce((sum, s) =>
      sum + s.heapUsed / 1024 / 1024, 0) / this.samples.length;

    let ssRes = 0, ssTot = 0;
    this.samples.forEach((snapshot, i) => {
      const y = snapshot.heapUsed / 1024 / 1024;
      const yPred = slope * i + intercept;
      ssRes += Math.pow(y - yPred, 2);
      ssTot += Math.pow(y - yMean, 2);
    });

    return 1 - (ssRes / ssTot);
  }
}

/**
 * Leak Pattern Detector
 */
class LeakPatternDetector {
  constructor() {
    this.patterns = {
      closureLeaks: [],
      eventListenerLeaks: [],
      timerLeaks: [],
      cacheLeaks: [],
      streamLeaks: [],
    };
  }

  /**
   * Analyze heap for common leak patterns
   */
  async analyzeHeap(heapSnapshot) {
    const patterns = [];

    // Simulate heap analysis (in production, use v8-profiler or heapdump)
    const processInfo = {
      handles: process._getActiveHandles ? process._getActiveHandles().length : 0,
      requests: process._getActiveRequests ? process._getActiveRequests().length : 0,
      listeners: this.countEventListeners(),
      timers: this.countTimers(),
    };

    // Detect event listener leaks
    if (processInfo.listeners > 100) {
      patterns.push({
        type: 'event-listener-leak',
        severity: 'high',
        count: processInfo.listeners,
        description: 'Excessive event listeners detected',
        recommendation: 'Review event listener cleanup, use once() or removeListener()',
      });
    }

    // Detect timer leaks
    if (processInfo.timers > 50) {
      patterns.push({
        type: 'timer-leak',
        severity: 'medium',
        count: processInfo.timers,
        description: 'Excessive timers/intervals active',
        recommendation: 'Ensure clearTimeout/clearInterval is called',
      });
    }

    // Detect handle leaks
    if (processInfo.handles > 1000) {
      patterns.push({
        type: 'handle-leak',
        severity: 'high',
        count: processInfo.handles,
        description: 'Excessive active handles',
        recommendation: 'Check for unclosed file descriptors, sockets, or streams',
      });
    }

    return patterns;
  }

  countEventListeners() {
    // Count all event listeners across emitters
    let count = 0;
    const emitters = [];

    // This is a simplified check - in production, use more sophisticated tracking
    if (process.listenerCount) {
      count += process.listenerCount('uncaughtException');
      count += process.listenerCount('unhandledRejection');
      count += process.listenerCount('warning');
    }

    return count;
  }

  countTimers() {
    // In production, track timers more accurately
    // This is a placeholder for demonstration
    return process._getActiveHandles ?
      process._getActiveHandles().filter(h =>
        h.constructor.name === 'Timeout' ||
        h.constructor.name === 'Immediate'
      ).length : 0;
  }
}

/**
 * Heap Dump Manager
 */
class HeapDumpManager {
  constructor(config) {
    this.config = config;
    this.dumpCount = 0;
  }

  /**
   * Take heap snapshot and save to disk
   */
  async takeSnapshot(reason = 'manual') {
    const filename = `heap-${Date.now()}-${reason}.heapsnapshot`;
    const filepath = path.join(this.config.snapshotDir, filename);

    try {
      // Ensure directory exists
      await mkdir(this.config.snapshotDir, { recursive: true });

      // Take heap snapshot
      const snapshot = v8.writeHeapSnapshot(filepath);

      this.dumpCount++;

      // Clean up old snapshots
      await this.cleanupOldSnapshots();

      return {
        filename,
        filepath: snapshot,
        size: fs.statSync(snapshot).size,
        timestamp: Date.now(),
        reason,
      };
    } catch (error) {
      console.error('Failed to take heap snapshot:', error);
      throw error;
    }
  }

  /**
   * Remove old heap snapshots
   */
  async cleanupOldSnapshots() {
    try {
      const files = fs.readdirSync(this.config.snapshotDir);
      const snapshots = files
        .filter(f => f.endsWith('.heapsnapshot'))
        .map(f => ({
          name: f,
          path: path.join(this.config.snapshotDir, f),
          time: fs.statSync(path.join(this.config.snapshotDir, f)).mtime,
        }))
        .sort((a, b) => b.time - a.time);

      // Keep only maxSnapshots
      if (snapshots.length > this.config.maxSnapshots) {
        for (let i = this.config.maxSnapshots; i < snapshots.length; i++) {
          fs.unlinkSync(snapshots[i].path);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup snapshots:', error);
    }
  }

  /**
   * Compare two heap snapshots
   */
  async compareSnapshots(snapshot1, snapshot2) {
    // In production, use heapdump module or v8-profiler for detailed comparison
    // This is a simplified version
    return {
      comparison: 'detailed',
      timestamp: Date.now(),
      snapshots: [snapshot1, snapshot2],
      note: 'Use Chrome DevTools to compare these snapshots manually',
    };
  }
}

/**
 * Main Memory Leak Detector
 */
class MemoryLeakDetector extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.snapshots = [];
    this.lastAlertTime = 0;
    this.isMonitoring = false;

    // Components
    this.trendAnalyzer = new TrendAnalyzer(this.config.trendWindow);
    this.patternDetector = new LeakPatternDetector();
    this.heapDumpManager = new HeapDumpManager(this.config);

    // Metrics
    this.metrics = {
      checksPerformed: 0,
      alertsRaised: 0,
      heapDumpsTaken: 0,
      leaksDetected: 0,
    };
  }

  /**
   * Start monitoring memory
   */
  start() {
    if (this.isMonitoring) {
      console.log('Memory monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Starting memory leak detection...');
    console.log('Configuration:', {
      checkInterval: `${this.config.checkInterval}ms`,
      heapGrowthThreshold: `${this.config.heapGrowthThreshold} MB/min`,
      heapUsageThreshold: `${this.config.heapUsageThreshold}%`,
    });

    // Start periodic checks
    this.checkInterval = setInterval(() => {
      this.checkMemory();
    }, this.config.checkInterval);

    // Start snapshot collection
    if (this.config.snapshotInterval) {
      this.snapshotInterval = setInterval(() => {
        this.collectSnapshot();
      }, this.config.snapshotInterval);
    }

    this.emit('started');
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    clearInterval(this.checkInterval);
    clearInterval(this.snapshotInterval);

    console.log('🛑 Memory monitoring stopped');
    console.log('Final metrics:', this.metrics);

    this.emit('stopped', this.metrics);
  }

  /**
   * Check current memory usage
   */
  async checkMemory() {
    this.metrics.checksPerformed++;

    const memUsage = process.memoryUsage();
    const snapshot = new MemorySnapshot(memUsage);

    this.snapshots.push(snapshot);
    this.trendAnalyzer.addSample(snapshot);

    // Keep last N snapshots
    if (this.snapshots.length > 100) {
      this.snapshots.shift();
    }

    // Analyze memory
    const analysis = await this.analyzeMemory(snapshot);

    // Check for issues
    if (analysis.issues.length > 0) {
      this.handleIssues(analysis);
    }

    this.emit('check', analysis);
  }

  /**
   * Collect detailed snapshot
   */
  async collectSnapshot() {
    const snapshot = new MemorySnapshot(process.memoryUsage());

    // Analyze for leak patterns
    const patterns = await this.patternDetector.analyzeHeap(snapshot);

    if (patterns.length > 0) {
      console.log(`⚠️  Detected ${patterns.length} potential leak patterns`);
      patterns.forEach(p => {
        console.log(`  - ${p.type}: ${p.description}`);
      });

      this.emit('patterns-detected', patterns);
    }
  }

  /**
   * Analyze memory for issues
   */
  async analyzeMemory(snapshot) {
    const issues = [];
    const warnings = [];

    // Check heap usage percentage
    const heapUsagePercent = (snapshot.heapUsed / snapshot.heapTotal) * 100;
    if (heapUsagePercent > this.config.heapUsageThreshold) {
      issues.push({
        type: 'high-heap-usage',
        severity: 'critical',
        value: heapUsagePercent.toFixed(2),
        threshold: this.config.heapUsageThreshold,
        message: `Heap usage at ${heapUsagePercent.toFixed(2)}%`,
      });
    }

    // Check growth rate
    if (this.snapshots.length >= 2) {
      const prevSnapshot = this.snapshots[this.snapshots.length - 2];
      const growthRate = snapshot.growthRate(prevSnapshot);

      if (growthRate.heapGrowth > this.config.heapGrowthThreshold) {
        issues.push({
          type: 'rapid-heap-growth',
          severity: 'high',
          value: growthRate.heapGrowth.toFixed(2),
          threshold: this.config.heapGrowthThreshold,
          message: `Heap growing at ${growthRate.heapGrowth.toFixed(2)} MB/min`,
        });
      }

      if (growthRate.externalGrowth > this.config.externalGrowthThreshold) {
        warnings.push({
          type: 'external-growth',
          severity: 'medium',
          value: growthRate.externalGrowth.toFixed(2),
          message: `External memory growing at ${growthRate.externalGrowth.toFixed(2)} MB/min`,
        });
      }
    }

    // Trend analysis
    let trend = null;
    if (this.config.enableTrendAnalysis) {
      trend = this.trendAnalyzer.detectGrowthTrend();

      if (trend && trend.isGrowing && trend.avgGrowthRate > 1) {
        warnings.push({
          type: 'growth-trend',
          severity: 'medium',
          trend: trend,
          message: `Sustained memory growth detected (${trend.avgGrowthRate.toFixed(2)} MB/min)`,
        });
      }
    }

    return {
      timestamp: Date.now(),
      snapshot,
      issues,
      warnings,
      trend,
      heapUsagePercent,
      metrics: {
        heapUsedMB: (snapshot.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (snapshot.heapTotal / 1024 / 1024).toFixed(2),
        externalMB: (snapshot.external / 1024 / 1024).toFixed(2),
        rssMB: (snapshot.rss / 1024 / 1024).toFixed(2),
      },
    };
  }

  /**
   * Handle detected issues
   */
  async handleIssues(analysis) {
    const { issues, warnings } = analysis;

    // Check alert cooldown
    const now = Date.now();
    if (now - this.lastAlertTime < this.config.alertCooldown) {
      return;
    }

    // Critical issues
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      this.lastAlertTime = now;
      this.metrics.alertsRaised++;

      console.error('🚨 CRITICAL MEMORY ISSUE DETECTED:');
      criticalIssues.forEach(issue => {
        console.error(`  ${issue.message}`);
      });

      // Take heap dump if enabled
      if (this.config.autoHeapDump) {
        console.log('📸 Taking automatic heap snapshot...');
        const snapshot = await this.heapDumpManager.takeSnapshot('critical-alert');
        console.log(`  Saved to: ${snapshot.filepath}`);
        this.metrics.heapDumpsTaken++;
      }

      this.emit('critical-alert', { issues: criticalIssues, analysis });
    }

    // High priority issues
    const highIssues = issues.filter(i => i.severity === 'high');
    if (highIssues.length > 0) {
      this.metrics.leaksDetected++;
      console.warn('⚠️  HIGH PRIORITY MEMORY ISSUE:');
      highIssues.forEach(issue => {
        console.warn(`  ${issue.message}`);
      });

      this.emit('high-alert', { issues: highIssues, analysis });
    }

    // Warnings
    if (warnings.length > 0 && this.config.alertOnGrowth) {
      this.emit('warning', { warnings, analysis });
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const trend = this.trendAnalyzer.predictTrend();

    const report = {
      timestamp: Date.now(),
      monitoring: {
        duration: this.isMonitoring ?
          Date.now() - this.snapshots[0]?.timestamp : 0,
        checksPerformed: this.metrics.checksPerformed,
        alertsRaised: this.metrics.alertsRaised,
        heapDumpsTaken: this.metrics.heapDumpsTaken,
        leaksDetected: this.metrics.leaksDetected,
      },
      currentMemory: this.snapshots[this.snapshots.length - 1]?.stats,
      trend: trend,
      recommendations: this.generateRecommendations(trend),
    };

    return report;
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(trend) {
    const recommendations = [];

    if (trend && trend.slope > 0.5) {
      recommendations.push({
        priority: 'high',
        category: 'memory-growth',
        message: 'Significant memory growth detected',
        actions: [
          'Take heap snapshot and analyze retained objects',
          'Check for event listener leaks',
          'Review cache implementations',
          'Verify stream cleanup',
        ],
      });
    }

    const current = this.snapshots[this.snapshots.length - 1];
    if (current) {
      const usagePercent = (current.heapUsed / current.heapTotal) * 100;
      if (usagePercent > 70) {
        recommendations.push({
          priority: 'medium',
          category: 'heap-usage',
          message: 'High heap usage detected',
          actions: [
            'Consider increasing heap size with --max-old-space-size',
            'Review memory-intensive operations',
            'Implement object pooling for frequently created objects',
          ],
        });
      }
    }

    return recommendations;
  }

  /**
   * Force garbage collection (requires --expose-gc flag)
   */
  forceGC() {
    if (global.gc) {
      console.log('🗑️  Forcing garbage collection...');
      const before = process.memoryUsage();
      global.gc();
      const after = process.memoryUsage();

      const freed = (before.heapUsed - after.heapUsed) / 1024 / 1024;
      console.log(`  Freed ${freed.toFixed(2)} MB`);

      return { before, after, freed };
    } else {
      console.warn('⚠️  Garbage collection not exposed. Run with --expose-gc flag.');
      return null;
    }
  }
}

/**
 * Demo: Memory leak detection
 */
async function demonstrateLeakDetection() {
  console.log('='.repeat(80));
  console.log('ADVANCED MEMORY LEAK DETECTION DEMO');
  console.log('='.repeat(80));

  const detector = new MemoryLeakDetector({
    checkInterval: 2000,
    heapGrowthThreshold: 5,
    heapUsageThreshold: 80,
    autoHeapDump: false, // Disabled for demo
  });

  // Listen to events
  detector.on('check', (analysis) => {
    if (analysis.issues.length > 0 || analysis.warnings.length > 0) {
      console.log(`\n📊 Analysis at ${new Date().toISOString()}:`);
      console.log(`  Heap: ${analysis.metrics.heapUsedMB}/${analysis.metrics.heapTotalMB} MB (${analysis.heapUsagePercent.toFixed(2)}%)`);
      console.log(`  RSS: ${analysis.metrics.rssMB} MB`);
      console.log(`  External: ${analysis.metrics.externalMB} MB`);

      if (analysis.trend) {
        console.log(`  Trend: ${analysis.trend.isGrowing ? '📈 Growing' : '📉 Stable'} (${analysis.trend.avgGrowthRate.toFixed(2)} MB/min)`);
      }
    }
  });

  detector.on('critical-alert', ({ issues }) => {
    console.error('\n🚨 CRITICAL ALERT:', issues.map(i => i.message).join(', '));
  });

  detector.on('warning', ({ warnings }) => {
    console.warn('\n⚠️  WARNING:', warnings.map(w => w.message).join(', '));
  });

  // Start monitoring
  detector.start();

  // Simulate memory leak scenarios
  console.log('\n1️⃣  Simulating event listener leak...');
  const leakyEmitter = new EventEmitter();
  const leakInterval1 = setInterval(() => {
    // Add listener without removing
    leakyEmitter.on('data', () => {});
  }, 100);

  await new Promise(resolve => setTimeout(resolve, 5000));
  clearInterval(leakInterval1);

  console.log('\n2️⃣  Simulating closure leak...');
  const cache = [];
  const leakInterval2 = setInterval(() => {
    // Create closures that capture large objects
    const bigData = Buffer.alloc(1024 * 1024); // 1MB
    cache.push(() => bigData.length);
  }, 50);

  await new Promise(resolve => setTimeout(resolve, 5000));
  clearInterval(leakInterval2);

  // Force GC if available
  detector.forceGC();

  // Wait for more monitoring
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('FINAL REPORT');
  console.log('='.repeat(80));
  const report = detector.generateReport();
  console.log(JSON.stringify(report, null, 2));

  // Stop monitoring
  detector.stop();

  // Cleanup
  cache.length = 0;
  leakyEmitter.removeAllListeners();

  console.log('\n✅ Demo complete!');
  console.log('\n💡 Production Tips:');
  console.log('  1. Run with --expose-gc to enable manual garbage collection');
  console.log('  2. Use heapdump or v8-profiler for detailed heap analysis');
  console.log('  3. Integrate with monitoring systems (Prometheus, DataDog, etc.)');
  console.log('  4. Set up automated alerts in production');
  console.log('  5. Compare heap snapshots in Chrome DevTools');
}

// Run demo if executed directly
if (require.main === module) {
  demonstrateLeakDetection().catch(console.error);
}

module.exports = {
  MemoryLeakDetector,
  MemorySnapshot,
  TrendAnalyzer,
  LeakPatternDetector,
  HeapDumpManager,
};
