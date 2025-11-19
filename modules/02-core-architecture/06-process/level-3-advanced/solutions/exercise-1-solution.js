/**
 * SOLUTION: Exercise 1 - Memory Leak Detection System
 * =====================================================
 *
 * This solution demonstrates a production-ready memory leak detection system
 * with statistical analysis, automatic heap snapshot generation, and detailed
 * reporting capabilities.
 *
 * KEY CONCEPTS DEMONSTRATED:
 * - V8 heap memory monitoring and analysis
 * - Linear regression for trend detection
 * - Automated heap snapshot generation
 * - Statistical leak confidence calculation
 * - Memory leak simulation for testing
 * - Production-ready alerting system
 *
 * PRODUCTION FEATURES:
 * - Configurable thresholds and intervals
 * - Trend analysis with confidence scoring
 * - Automatic snapshot generation on leaks
 * - Alert cooldown to prevent spam
 * - Comprehensive statistics tracking
 * - Memory leak simulation mode
 */

const v8 = require('v8');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  MONITOR_INTERVAL: 5000,
  SNAPSHOT_DIR: './memory-snapshots',
  HEAP_GROWTH_THRESHOLD: 10,
  TREND_WINDOW: 10,
  LEAK_CONFIDENCE_THRESHOLD: 0.7,
  WARNING_THRESHOLD_MB: 100,
  CRITICAL_THRESHOLD_MB: 200,
  ALERT_COOLDOWN: 30000,
};

// ============================================================================
// Memory Leak Detector
// ============================================================================

class MemoryLeakDetector {
  constructor(config = CONFIG) {
    this.config = config;
    this.heapSamples = [];
    this.snapshotCount = 0;
    this.lastAlertTime = 0;
    this.monitorTimer = null;
    this.isMonitoring = false;

    this.stats = {
      totalChecks: 0,
      leaksDetected: 0,
      snapshotsGenerated: 0,
      alertsFired: 0
    };

    this.ensureSnapshotDirectory();
  }

  /**
   * Ensure snapshot directory exists
   */
  ensureSnapshotDirectory() {
    if (!fs.existsSync(this.config.SNAPSHOT_DIR)) {
      fs.mkdirSync(this.config.SNAPSHOT_DIR, { recursive: true });
      console.log(`📁 Created snapshot directory: ${this.config.SNAPSHOT_DIR}`);
    }
  }

  /**
   * Collect heap memory sample
   *
   * Captures current heap statistics and stores in sliding window
   * for trend analysis.
   */
  collectHeapSample() {
    const memUsage = process.memoryUsage();

    const sample = {
      timestamp: Date.now(),
      heapUsedMB: memUsage.heapUsed / 1024 / 1024,
      heapTotalMB: memUsage.heapTotal / 1024 / 1024,
      externalMB: memUsage.external / 1024 / 1024,
      rssMB: memUsage.rss / 1024 / 1024
    };

    this.heapSamples.push(sample);

    // Maintain sliding window
    if (this.heapSamples.length > this.config.TREND_WINDOW * 2) {
      this.heapSamples.shift();
    }

    return sample;
  }

  /**
   * Analyze memory trend using linear regression
   *
   * Calculates:
   * - Growth rate (slope)
   * - Confidence (R²)
   * - Projected future usage
   *
   * Returns trend analysis object with growth indicators
   */
  analyzeTrend() {
    if (this.heapSamples.length < this.config.TREND_WINDOW) {
      return {
        isGrowing: false,
        growthRate: 0,
        confidence: 0,
        projectedUsageIn1Min: 0,
        intercept: 0
      };
    }

    const recentSamples = this.heapSamples.slice(-this.config.TREND_WINDOW);

    // Linear regression: y = mx + b
    const n = recentSamples.length;
    const sumX = recentSamples.reduce((sum, _, i) => sum + i, 0);
    const sumY = recentSamples.reduce((sum, s) => sum + s.heapUsedMB, 0);
    const sumXY = recentSamples.reduce((sum, s, i) => sum + (i * s.heapUsedMB), 0);
    const sumX2 = recentSamples.reduce((sum, _, i) => sum + (i * i), 0);

    // Calculate slope (m) and intercept (b)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R² (coefficient of determination)
    // Measures how well the line fits the data (0-1)
    const avgY = sumY / n;
    const ssTotal = recentSamples.reduce((sum, s) =>
      sum + Math.pow(s.heapUsedMB - avgY, 2), 0);
    const ssResidual = recentSamples.reduce((sum, s, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(s.heapUsedMB - predicted, 2);
    }, 0);

    const rSquared = 1 - (ssResidual / ssTotal);

    // Project usage in 1 minute (12 samples at 5s interval)
    const samplesPerMinute = 60000 / this.config.MONITOR_INTERVAL;
    const projectedUsageIn1Min = recentSamples[n-1].heapUsedMB +
                                 (slope * samplesPerMinute);

    return {
      isGrowing: slope > 0.5, // Growing more than 0.5MB per sample
      growthRate: slope,
      confidence: Math.abs(rSquared),
      projectedUsageIn1Min,
      intercept
    };
  }

  /**
   * Detect memory leak based on thresholds and trend
   *
   * Detection criteria:
   * 1. Absolute threshold exceeded (critical)
   * 2. High usage + growing trend with high confidence (high)
   * 3. Growing trend with moderate confidence (medium)
   */
  detectLeak(sample, trend) {
    const result = {
      isLeak: false,
      severity: 'low',
      reason: '',
      recommendations: []
    };

    // Critical: Absolute threshold exceeded
    if (sample.heapUsedMB > this.config.CRITICAL_THRESHOLD_MB) {
      result.isLeak = true;
      result.severity = 'critical';
      result.reason = `Heap usage (${sample.heapUsedMB.toFixed(2)}MB) exceeded critical threshold (${this.config.CRITICAL_THRESHOLD_MB}MB)`;
      result.recommendations.push('⚠️  Immediate investigation required');
      result.recommendations.push('🔄 Consider restarting the process');
      result.recommendations.push('📸 Review heap snapshots for retained objects');
    }
    // High: Warning threshold + confident growth
    else if (sample.heapUsedMB > this.config.WARNING_THRESHOLD_MB &&
             trend.isGrowing &&
             trend.confidence > this.config.LEAK_CONFIDENCE_THRESHOLD) {
      result.isLeak = true;
      result.severity = 'high';
      result.reason = `Consistent memory growth detected (${trend.growthRate.toFixed(2)}MB per check, ${(trend.confidence * 100).toFixed(1)}% confidence)`;
      result.recommendations.push('🔍 Review recent code changes');
      result.recommendations.push('🔗 Check for unclosed connections or event listeners');
      result.recommendations.push('📊 Projected usage in 1 min: ' +
        `${trend.projectedUsageIn1Min.toFixed(2)}MB`);
      result.recommendations.push('🧹 Consider implementing object pooling or caching eviction');
    }
    // Medium: Moderate growth detected
    else if (trend.isGrowing && trend.confidence > 0.5) {
      result.isLeak = true;
      result.severity = 'medium';
      result.reason = `Potential memory leak detected (${(trend.confidence * 100).toFixed(1)}% confidence, ${trend.growthRate.toFixed(2)}MB/check growth)`;
      result.recommendations.push('👀 Monitor closely');
      result.recommendations.push('📋 Review object retention patterns');
      result.recommendations.push('🧪 Run extended tests to confirm leak');
    }

    return result;
  }

  /**
   * Generate V8 heap snapshot
   *
   * Snapshots can be analyzed in Chrome DevTools:
   * 1. Open DevTools
   * 2. Go to Memory tab
   * 3. Load snapshot file
   * 4. Compare snapshots to find leaks
   */
  generateHeapSnapshot() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `heap-${timestamp}-${this.snapshotCount}.heapsnapshot`;
      const filepath = path.join(this.config.SNAPSHOT_DIR, filename);

      // Write heap snapshot
      v8.writeHeapSnapshot(filepath);

      this.snapshotCount++;
      this.stats.snapshotsGenerated++;

      console.log(`📸 Heap snapshot saved: ${filepath}`);
      console.log(`   Size: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Analyze in Chrome DevTools > Memory > Load`);

      return filepath;
    } catch (error) {
      console.error('❌ Failed to generate heap snapshot:', error.message);
      return null;
    }
  }

  /**
   * Fire alert with appropriate severity
   *
   * Implements alert cooldown to prevent spam
   * Generates snapshots for serious leaks
   */
  fireAlert(detection, sample, trend) {
    const now = Date.now();

    // Cooldown check
    if (now - this.lastAlertTime < this.config.ALERT_COOLDOWN) {
      return;
    }

    const severityEmoji = {
      low: '⚠️ ',
      medium: '🔶',
      high: '🔥',
      critical: '🚨'
    };

    console.log('\n' + '═'.repeat(70));
    console.log(`${severityEmoji[detection.severity]} MEMORY LEAK ALERT - ${detection.severity.toUpperCase()}`);
    console.log('═'.repeat(70));
    console.log(`📌 Reason: ${detection.reason}`);
    console.log(`💾 Current Heap: ${sample.heapUsedMB.toFixed(2)}MB / ${sample.heapTotalMB.toFixed(2)}MB`);
    console.log(`📈 Growth Rate: ${trend.growthRate.toFixed(2)}MB per check`);
    console.log(`📊 Confidence: ${(trend.confidence * 100).toFixed(1)}%`);
    console.log(`🎯 Projected (1 min): ${trend.projectedUsageIn1Min.toFixed(2)}MB`);
    console.log('\n📋 Recommendations:');
    detection.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });

    // Generate snapshot for serious leaks
    if (detection.severity === 'high' || detection.severity === 'critical') {
      console.log('\n📸 Generating heap snapshot for analysis...');
      this.generateHeapSnapshot();
    }

    console.log('═'.repeat(70) + '\n');

    this.lastAlertTime = now;
    this.stats.alertsFired++;
  }

  /**
   * Main monitoring cycle
   *
   * Executed every MONITOR_INTERVAL:
   * 1. Collect heap sample
   * 2. Analyze trend
   * 3. Detect leaks
   * 4. Fire alerts if needed
   */
  async monitoringCycle() {
    this.stats.totalChecks++;

    const sample = this.collectHeapSample();
    const trend = this.analyzeTrend();
    const detection = this.detectLeak(sample, trend);

    // Log current status
    const trendIcon = trend.isGrowing ? '📈' : '📊';
    const healthIcon = sample.heapUsedMB > this.config.WARNING_THRESHOLD_MB ? '⚠️ ' : '✅';

    console.log(
      `[${new Date().toISOString()}] ${healthIcon} Heap: ${sample.heapUsedMB.toFixed(2)}MB | ` +
      `${trendIcon} Trend: ${trend.growthRate > 0 ? '+' : ''}${trend.growthRate.toFixed(2)}MB/check | ` +
      `Confidence: ${(trend.confidence * 100).toFixed(0)}%`
    );

    if (detection.isLeak) {
      this.stats.leaksDetected++;
      this.fireAlert(detection, sample, trend);
    }
  }

  /**
   * Start memory leak monitoring
   */
  start() {
    if (this.isMonitoring) {
      console.log('⚠️  Monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Memory Leak Detector Started');
    console.log(`📊 Monitoring interval: ${this.config.MONITOR_INTERVAL}ms`);
    console.log(`📁 Snapshot directory: ${this.config.SNAPSHOT_DIR}`);
    console.log(`⚠️  Warning threshold: ${this.config.WARNING_THRESHOLD_MB}MB`);
    console.log(`🚨 Critical threshold: ${this.config.CRITICAL_THRESHOLD_MB}MB\n`);

    this.monitorTimer = setInterval(() => {
      this.monitoringCycle();
    }, this.config.MONITOR_INTERVAL);
  }

  /**
   * Stop monitoring and print statistics
   */
  stop() {
    if (!this.isMonitoring) {
      return;
    }

    clearInterval(this.monitorTimer);
    this.isMonitoring = false;

    console.log('\n' + '═'.repeat(70));
    console.log('📊 MONITORING STATISTICS');
    console.log('═'.repeat(70));
    console.log(`Total Checks: ${this.stats.totalChecks}`);
    console.log(`Leaks Detected: ${this.stats.leaksDetected}`);
    console.log(`Alerts Fired: ${this.stats.alertsFired}`);
    console.log(`Snapshots Generated: ${this.stats.snapshotsGenerated}`);

    if (this.heapSamples.length > 0) {
      const latest = this.heapSamples[this.heapSamples.length - 1];
      console.log(`\nFinal Heap Usage: ${latest.heapUsedMB.toFixed(2)}MB`);
    }

    console.log('═'.repeat(70) + '\n');
  }

  /**
   * Simulate memory leak for testing
   *
   * Creates objects that are retained and never garbage collected
   * Demonstrates:
   * - Growing heap usage
   * - Leak detection triggering
   * - Alert system activation
   * - Snapshot generation
   */
  simulateLeak() {
    console.log('💧 Starting memory leak simulation...\n');

    const leakData = [];

    const interval = setInterval(() => {
      // Create large objects that won't be garbage collected
      const largeObject = {
        data: new Array(10000).fill('x'.repeat(100)),
        timestamp: Date.now(),
        circular: null,
        moreData: Buffer.alloc(1024 * 100) // 100KB buffer
      };

      // Create circular reference (less important in modern V8)
      largeObject.circular = largeObject;

      // Store in array to prevent GC
      leakData.push(largeObject);

      const leakSizeMB = (leakData.length * 1024 * 100) / 1024 / 1024;
      console.log(`💧 Leak simulation: ${leakData.length} objects retained (~${leakSizeMB.toFixed(2)}MB)`);
    }, 2000);

    return {
      stop: () => {
        clearInterval(interval);
        console.log('🛑 Leak simulation stopped');
      },
      clear: () => {
        leakData.length = 0;
        global.gc && global.gc(); // Trigger GC if --expose-gc flag is used
        console.log('🧹 Leak data cleared');
      },
      getSize: () => leakData.length
    };
  }
}

// ============================================================================
// Main Execution
// ============================================================================

function main() {
  console.log('═'.repeat(70));
  console.log('MEMORY LEAK DETECTION SYSTEM');
  console.log('═'.repeat(70));
  console.log('\nMonitoring heap memory for potential leaks...\n');

  const detector = new MemoryLeakDetector();
  detector.start();

  let simulation = null;

  // Start leak simulation after 10 seconds
  setTimeout(() => {
    console.log('\n💧 Starting leak simulation in 5 seconds...\n');
    setTimeout(() => {
      simulation = detector.simulateLeak();

      // Stop simulation after 30 seconds
      setTimeout(() => {
        simulation.stop();
      }, 30000);
    }, 5000);
  }, 10000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down detector...');

    if (simulation) {
      simulation.stop();
    }

    detector.stop();
    process.exit(0);
  });

  console.log('💡 Press Ctrl+C to stop monitoring');
  console.log('📝 Run with --expose-gc flag to enable manual GC\n');
}

// Start the detector
main();

// ============================================================================
// LEARNING NOTES
// ============================================================================

/**
 * KEY TAKEAWAYS:
 *
 * 1. MEMORY LEAK DETECTION
 *    - Monitor heap usage over time
 *    - Use statistical analysis (linear regression)
 *    - Look for consistent growth patterns
 *    - Calculate confidence before alerting
 *
 * 2. HEAP SNAPSHOTS
 *    - Use v8.writeHeapSnapshot() for analysis
 *    - Compare snapshots to find retained objects
 *    - Analyze in Chrome DevTools
 *    - Look for unexpected object retention
 *
 * 3. COMMON LEAK PATTERNS
 *    - Global variables never released
 *    - Event listeners not removed
 *    - Closures retaining large contexts
 *    - Cache without eviction policy
 *    - Timers not cleared
 *    - Circular references (less common now)
 *
 * 4. PRODUCTION STRATEGIES
 *    - Set appropriate thresholds for your app
 *    - Monitor trends, not just absolute values
 *    - Alert on sustained growth, not spikes
 *    - Generate snapshots automatically
 *    - Integrate with monitoring systems
 *
 * 5. TESTING FOR LEAKS
 *    - Run extended load tests
 *    - Monitor heap over time
 *    - Use --expose-gc for manual GC
 *    - Profile with --inspect flag
 *    - Compare heap snapshots
 */
