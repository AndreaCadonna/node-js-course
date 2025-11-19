/**
 * Exercise 1: Memory Leak Detection System
 * =========================================
 *
 * Difficulty: Hard
 *
 * Task:
 * Build an advanced memory leak detection system that monitors heap usage,
 * detects memory leaks using statistical analysis, generates heap snapshots,
 * and provides detailed leak reports with recommendations.
 *
 * Requirements:
 * 1. Monitor heap memory usage with configurable intervals
 * 2. Implement trend analysis to detect consistent memory growth
 * 3. Generate heap snapshots when leaks are detected
 * 4. Analyze heap snapshots to identify potential leak sources
 * 5. Track retained size and shallow size of objects
 * 6. Implement alerting system with multiple severity levels
 * 7. Generate detailed leak reports with remediation suggestions
 * 8. Support manual and automatic leak detection modes
 * 9. Implement memory pressure detection
 * 10. Create a leak simulation mode for testing
 *
 * Learning Goals:
 * - Deep understanding of V8 heap structure
 * - Memory profiling techniques
 * - Statistical analysis for leak detection
 * - Heap snapshot generation and analysis
 * - Production memory monitoring strategies
 * - Memory leak patterns and prevention
 *
 * Test:
 * 1. Run the detector in normal mode
 * 2. Trigger leak simulation
 * 3. Observe leak detection and alerting
 * 4. Review generated heap snapshots
 * 5. Analyze leak report recommendations
 *
 * Run: node exercise-1.js
 */

const v8 = require('v8');
const fs = require('fs');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Monitoring intervals
  MONITOR_INTERVAL: 5000,        // Check memory every 5 seconds
  SNAPSHOT_DIR: './memory-snapshots',

  // Leak detection thresholds
  HEAP_GROWTH_THRESHOLD: 10,     // MB growth to trigger warning
  TREND_WINDOW: 10,               // Number of samples for trend analysis
  LEAK_CONFIDENCE_THRESHOLD: 0.7, // 70% confidence to declare leak

  // Memory limits
  WARNING_THRESHOLD_MB: 100,      // Warn at 100MB
  CRITICAL_THRESHOLD_MB: 200,     // Critical at 200MB

  // Alert settings
  ALERT_COOLDOWN: 30000,          // 30 seconds between duplicate alerts
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

    // Statistics
    this.stats = {
      totalChecks: 0,
      leaksDetected: 0,
      snapshotsGenerated: 0,
      alertsFired: 0
    };

    this.ensureSnapshotDirectory();
  }

  /**
   * TODO 1: Implement snapshot directory creation
   *
   * Create the snapshot directory if it doesn't exist.
   * Use fs.existsSync and fs.mkdirSync with recursive option.
   */
  ensureSnapshotDirectory() {
    // TODO: Create snapshot directory
    // if (!fs.existsSync(this.config.SNAPSHOT_DIR)) {
    //   fs.mkdirSync(this.config.SNAPSHOT_DIR, { recursive: true });
    // }
  }

  /**
   * TODO 2: Implement heap memory sampling
   *
   * Collect heap statistics and store in samples array:
   * - Use process.memoryUsage() to get current heap stats
   * - Calculate heap used in MB
   * - Store timestamp, heapUsed, heapTotal, external
   * - Maintain sliding window of samples (config.TREND_WINDOW)
   * - Return the sample object
   */
  collectHeapSample() {
    // TODO: Collect heap sample
    // const memUsage = process.memoryUsage();
    // const sample = {
    //   timestamp: Date.now(),
    //   heapUsedMB: memUsage.heapUsed / 1024 / 1024,
    //   heapTotalMB: memUsage.heapTotal / 1024 / 1024,
    //   externalMB: memUsage.external / 1024 / 1024,
    //   rssMB: memUsage.rss / 1024 / 1024
    // };

    // this.heapSamples.push(sample);

    // // Keep only recent samples
    // if (this.heapSamples.length > this.config.TREND_WINDOW * 2) {
    //   this.heapSamples.shift();
    // }

    // return sample;
  }

  /**
   * TODO 3: Implement memory trend analysis
   *
   * Analyze heap samples to detect growing trend:
   * - Calculate linear regression over samples
   * - Determine if heap is consistently growing
   * - Calculate growth rate (MB per sample)
   * - Return trend analysis object with:
   *   - isGrowing (boolean)
   *   - growthRate (MB/sample)
   *   - confidence (0-1)
   *   - projectedUsageIn1Min
   */
  analyzeTrend() {
    // TODO: Implement trend analysis using linear regression
    // if (this.heapSamples.length < this.config.TREND_WINDOW) {
    //   return { isGrowing: false, confidence: 0 };
    // }

    // const recentSamples = this.heapSamples.slice(-this.config.TREND_WINDOW);

    // // Simple linear regression
    // const n = recentSamples.length;
    // const sumX = recentSamples.reduce((sum, _, i) => sum + i, 0);
    // const sumY = recentSamples.reduce((sum, s) => sum + s.heapUsedMB, 0);
    // const sumXY = recentSamples.reduce((sum, s, i) => sum + (i * s.heapUsedMB), 0);
    // const sumX2 = recentSamples.reduce((sum, _, i) => sum + (i * i), 0);

    // const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    // const intercept = (sumY - slope * sumX) / n;

    // // Calculate R² (coefficient of determination)
    // const avgY = sumY / n;
    // const ssTotal = recentSamples.reduce((sum, s) => sum + Math.pow(s.heapUsedMB - avgY, 2), 0);
    // const ssResidual = recentSamples.reduce((sum, s, i) => {
    //   const predicted = slope * i + intercept;
    //   return sum + Math.pow(s.heapUsedMB - predicted, 2);
    // }, 0);
    // const rSquared = 1 - (ssResidual / ssTotal);

    // return {
    //   isGrowing: slope > 0.5, // Growing more than 0.5MB per sample
    //   growthRate: slope,
    //   confidence: Math.abs(rSquared),
    //   projectedUsageIn1Min: recentSamples[n-1].heapUsedMB + (slope * 12), // 12 samples in 1 min
    //   intercept
    // };
  }

  /**
   * TODO 4: Implement leak detection logic
   *
   * Determine if there's a memory leak based on:
   * - Current heap usage vs thresholds
   * - Trend analysis results
   * - Growth rate and confidence
   *
   * Return detection result with:
   * - isLeak (boolean)
   * - severity ('low' | 'medium' | 'high' | 'critical')
   * - reason (string)
   * - recommendations (array)
   */
  detectLeak(sample, trend) {
    // TODO: Implement leak detection logic
    // const result = {
    //   isLeak: false,
    //   severity: 'low',
    //   reason: '',
    //   recommendations: []
    // };

    // // Check absolute threshold
    // if (sample.heapUsedMB > this.config.CRITICAL_THRESHOLD_MB) {
    //   result.isLeak = true;
    //   result.severity = 'critical';
    //   result.reason = `Heap usage (${sample.heapUsedMB.toFixed(2)}MB) exceeded critical threshold`;
    //   result.recommendations.push('Immediate investigation required');
    //   result.recommendations.push('Consider restarting the process');
    // } else if (sample.heapUsedMB > this.config.WARNING_THRESHOLD_MB &&
    //            trend.isGrowing && trend.confidence > this.config.LEAK_CONFIDENCE_THRESHOLD) {
    //   result.isLeak = true;
    //   result.severity = 'high';
    //   result.reason = `Consistent memory growth detected (${trend.growthRate.toFixed(2)}MB per check)`;
    //   result.recommendations.push('Review recent code changes');
    //   result.recommendations.push('Check for unclosed connections or event listeners');
    //   result.recommendations.push(`Projected usage in 1 min: ${trend.projectedUsageIn1Min.toFixed(2)}MB`);
    // } else if (trend.isGrowing && trend.confidence > 0.5) {
    //   result.isLeak = true;
    //   result.severity = 'medium';
    //   result.reason = 'Potential memory leak detected (moderate confidence)';
    //   result.recommendations.push('Monitor closely');
    //   result.recommendations.push('Review object retention patterns');
    // }

    // return result;
  }

  /**
   * TODO 5: Implement heap snapshot generation
   *
   * Generate V8 heap snapshot:
   * - Use v8.writeHeapSnapshot() or v8.getHeapSnapshot()
   * - Create filename with timestamp
   * - Save to snapshot directory
   * - Return snapshot file path
   * - Handle errors gracefully
   */
  generateHeapSnapshot() {
    // TODO: Generate heap snapshot
    // try {
    //   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    //   const filename = `heap-${timestamp}-${this.snapshotCount}.heapsnapshot`;
    //   const filepath = path.join(this.config.SNAPSHOT_DIR, filename);
    //
    //   v8.writeHeapSnapshot(filepath);
    //
    //   this.snapshotCount++;
    //   this.stats.snapshotsGenerated++;
    //
    //   return filepath;
    // } catch (error) {
    //   console.error('Failed to generate heap snapshot:', error.message);
    //   return null;
    // }
  }

  /**
   * TODO 6: Implement alert system
   *
   * Fire alerts based on detection results:
   * - Check alert cooldown to prevent spam
   * - Log alerts with severity-appropriate formatting
   * - Generate heap snapshot for high/critical alerts
   * - Update last alert time
   * - Increment alert counter
   */
  fireAlert(detection, sample, trend) {
    // TODO: Implement alert system
    // const now = Date.now();
    // if (now - this.lastAlertTime < this.config.ALERT_COOLDOWN) {
    //   return; // Cooldown period
    // }

    // const severityEmoji = {
    //   low: '⚠️',
    //   medium: '🔶',
    //   high: '🔥',
    //   critical: '🚨'
    // };

    // console.log('\n' + '='.repeat(70));
    // console.log(`${severityEmoji[detection.severity]} MEMORY LEAK ALERT - ${detection.severity.toUpperCase()}`);
    // console.log('='.repeat(70));
    // console.log(`Reason: ${detection.reason}`);
    // console.log(`Current Heap: ${sample.heapUsedMB.toFixed(2)}MB`);
    // console.log(`Growth Rate: ${trend.growthRate.toFixed(2)}MB per check`);
    // console.log(`Confidence: ${(trend.confidence * 100).toFixed(1)}%`);
    // console.log('\nRecommendations:');
    // detection.recommendations.forEach((rec, i) => {
    //   console.log(`${i + 1}. ${rec}`);
    // });

    // // Generate snapshot for serious leaks
    // if (detection.severity === 'high' || detection.severity === 'critical') {
    //   const snapshotPath = this.generateHeapSnapshot();
    //   if (snapshotPath) {
    //     console.log(`\n📸 Heap snapshot saved: ${snapshotPath}`);
    //   }
    // }

    // console.log('='.repeat(70) + '\n');

    // this.lastAlertTime = now;
    // this.stats.alertsFired++;
  }

  /**
   * TODO 7: Implement monitoring cycle
   *
   * Main monitoring logic:
   * - Collect heap sample
   * - Analyze trend
   * - Detect leaks
   * - Fire alerts if needed
   * - Update statistics
   * - Log current status
   */
  async monitoringCycle() {
    // TODO: Implement monitoring cycle
    // this.stats.totalChecks++;

    // const sample = this.collectHeapSample();
    // const trend = this.analyzeTrend();
    // const detection = this.detectLeak(sample, trend);

    // // Log current status
    // console.log(`[${new Date().toISOString()}] Heap: ${sample.heapUsedMB.toFixed(2)}MB | ` +
    //            `Trend: ${trend.isGrowing ? '📈' : '📊'} ${trend.growthRate.toFixed(2)}MB/check | ` +
    //            `Confidence: ${(trend.confidence * 100).toFixed(0)}%`);

    // if (detection.isLeak) {
    //   this.stats.leaksDetected++;
    //   this.fireAlert(detection, sample, trend);
    // }
  }

  /**
   * TODO 8: Implement start monitoring
   *
   * Start the monitoring process:
   * - Check if already monitoring
   * - Set monitoring flag
   * - Start interval timer
   * - Log startup message
   */
  start() {
    // TODO: Implement start method
    // if (this.isMonitoring) {
    //   console.log('Monitoring already active');
    //   return;
    // }

    // this.isMonitoring = true;
    // console.log('🔍 Memory Leak Detector Started');
    // console.log(`📊 Monitoring interval: ${this.config.MONITOR_INTERVAL}ms`);
    // console.log(`📁 Snapshot directory: ${this.config.SNAPSHOT_DIR}\n`);

    // this.monitorTimer = setInterval(() => {
    //   this.monitoringCycle();
    // }, this.config.MONITOR_INTERVAL);
  }

  /**
   * TODO 9: Implement stop monitoring
   *
   * Stop the monitoring process:
   * - Clear interval timer
   * - Set monitoring flag to false
   * - Print final statistics
   */
  stop() {
    // TODO: Implement stop method
    // if (!this.isMonitoring) {
    //   return;
    // }

    // clearInterval(this.monitorTimer);
    // this.isMonitoring = false;

    // console.log('\n' + '='.repeat(70));
    // console.log('📊 MONITORING STATISTICS');
    // console.log('='.repeat(70));
    // console.log(`Total Checks: ${this.stats.totalChecks}`);
    // console.log(`Leaks Detected: ${this.stats.leaksDetected}`);
    // console.log(`Alerts Fired: ${this.stats.alertsFired}`);
    // console.log(`Snapshots Generated: ${this.stats.snapshotsGenerated}`);
    // console.log('='.repeat(70) + '\n');
  }

  /**
   * TODO 10: Implement leak simulation for testing
   *
   * Simulate a memory leak:
   * - Create a growing array/object that's never released
   * - Optionally create circular references
   * - Add to global scope to prevent GC
   * - Return simulation controller object
   */
  simulateLeak() {
    // TODO: Implement leak simulation
    // const leakData = [];

    // const interval = setInterval(() => {
    //   // Create objects that won't be garbage collected
    //   const largeObject = {
    //     data: new Array(10000).fill('x'.repeat(100)),
    //     timestamp: Date.now(),
    //     circular: null
    //   };
    //
    //   // Create circular reference
    //   largeObject.circular = largeObject;
    //
    //   leakData.push(largeObject);
    //
    //   console.log(`💧 Leak simulation: ${leakData.length} objects retained`);
    // }, 2000);

    // return {
    //   stop: () => {
    //     clearInterval(interval);
    //     console.log('🛑 Leak simulation stopped');
    //   },
    //   clear: () => {
    //     leakData.length = 0;
    //     console.log('🧹 Leak data cleared');
    //   }
    // };
  }
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * TODO 11: Implement main function
 *
 * Create detector instance and:
 * - Start monitoring
 * - Optionally start leak simulation after delay
 * - Handle SIGINT/SIGTERM for graceful shutdown
 * - Print usage instructions
 */
function main() {
  console.log('═'.repeat(70));
  console.log('MEMORY LEAK DETECTION SYSTEM');
  console.log('═'.repeat(70));
  console.log('\nMonitoring heap memory for potential leaks...\n');

  // TODO: Create and start detector
  // const detector = new MemoryLeakDetector();
  // detector.start();

  // TODO: Optional - start leak simulation after 10 seconds
  // setTimeout(() => {
  //   console.log('\n💧 Starting leak simulation in 5 seconds...\n');
  //   setTimeout(() => {
  //     const simulation = detector.simulateLeak();
  //
  //     // Stop simulation after 30 seconds
  //     setTimeout(() => {
  //       simulation.stop();
  //     }, 30000);
  //   }, 5000);
  // }, 10000);

  // TODO: Handle graceful shutdown
  // process.on('SIGINT', () => {
  //   console.log('\n\n🛑 Shutting down detector...');
  //   detector.stop();
  //   process.exit(0);
  // });

  console.log('💡 Press Ctrl+C to stop monitoring\n');
}

// TODO: Uncomment to run
// main();

// ============================================================================
// Expected Behavior
// ============================================================================

/**
 * Normal operation:
 * 1. Starts monitoring heap usage every 5 seconds
 * 2. Logs current heap status with trend indicators
 * 3. Analyzes memory growth patterns
 * 4. Detects leaks based on statistical analysis
 *
 * When leak detected:
 * 1. Fires alert with appropriate severity
 * 2. Provides detailed reason and recommendations
 * 3. Generates heap snapshot for serious leaks
 * 4. Respects alert cooldown period
 *
 * Leak simulation mode:
 * 1. Creates growing object retention
 * 2. Simulates real memory leak patterns
 * 3. Triggers leak detection within 20-30 seconds
 * 4. Demonstrates alert system and snapshot generation
 *
 * Shutdown:
 * 1. Stops monitoring cleanly
 * 2. Prints final statistics
 * 3. Exits gracefully
 */

// ============================================================================
// Hints
// ============================================================================

/**
 * Hint 1: Linear Regression for Trend Analysis
 * Use the formula: y = mx + b
 * where m (slope) indicates growth rate
 * and R² indicates confidence in the trend
 *
 * Hint 2: Heap Snapshots
 * v8.writeHeapSnapshot(filename) is the simplest approach
 * Snapshots can be analyzed in Chrome DevTools
 *
 * Hint 3: Memory Leak Patterns
 * Common causes:
 * - Global variables never released
 * - Event listeners not removed
 * - Closures retaining large contexts
 * - Cache without eviction policy
 * - Circular references (less common in modern V8)
 *
 * Hint 4: Testing
 * Run with --inspect flag and use Chrome DevTools
 * to verify heap snapshots are being generated correctly
 *
 * Hint 5: Production Use
 * Consider using libraries like:
 * - node-memwatch
 * - heapdump
 * - v8-profiler-next
 * For more advanced features
 */
