/**
 * Exercise 2: CPU Profiling Dashboard
 * ====================================
 *
 * Difficulty: Hard
 *
 * Task:
 * Build a real-time CPU profiling dashboard that monitors CPU usage,
 * detects performance bottlenecks, generates CPU profiles, and provides
 * actionable insights for optimization.
 *
 * Requirements:
 * 1. Monitor CPU usage in real-time (user, system, total)
 * 2. Track CPU percentage relative to available cores
 * 3. Detect CPU spikes and sustained high usage
 * 4. Generate CPU profiles automatically on high usage
 * 5. Implement event loop lag monitoring
 * 6. Track async operations and their impact
 * 7. Generate performance reports with optimization suggestions
 * 8. Support profiling of specific code sections
 * 9. Implement CPU usage prediction
 * 10. Create CPU-intensive workload simulation for testing
 *
 * Learning Goals:
 * - Understanding process.cpuUsage()
 * - CPU profiling with Inspector API
 * - Event loop monitoring techniques
 * - Performance optimization strategies
 * - Production performance monitoring
 * - Bottleneck detection algorithms
 *
 * Test:
 * 1. Run the profiler in normal mode
 * 2. Trigger CPU-intensive simulation
 * 3. Observe CPU spike detection
 * 4. Review generated CPU profiles
 * 5. Analyze performance recommendations
 *
 * Run: node exercise-2.js
 */

const { performance, PerformanceObserver } = require('perf_hooks');
const inspector = require('inspector');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Monitoring intervals
  MONITOR_INTERVAL: 1000,         // Check CPU every second
  LAG_CHECK_INTERVAL: 100,        // Check event loop lag every 100ms
  PROFILE_DIR: './cpu-profiles',

  // CPU thresholds (percentage)
  CPU_WARNING_THRESHOLD: 60,      // 60% CPU usage
  CPU_CRITICAL_THRESHOLD: 85,     // 85% CPU usage

  // Event loop thresholds
  LAG_WARNING_THRESHOLD: 50,      // 50ms lag
  LAG_CRITICAL_THRESHOLD: 100,    // 100ms lag

  // Profiling settings
  AUTO_PROFILE_DURATION: 10000,   // 10 second profile
  PROFILE_ON_SPIKE: true,

  // Alert settings
  ALERT_COOLDOWN: 15000,          // 15 seconds between alerts
};

// ============================================================================
// CPU Profiler Dashboard
// ============================================================================

class CPUProfiler {
  constructor(config = CONFIG) {
    this.config = config;
    this.cpuSamples = [];
    this.lagSamples = [];
    this.lastCpuUsage = null;
    this.lastCheckTime = null;
    this.lastAlertTime = 0;
    this.numCPUs = os.cpus().length;
    this.isMonitoring = false;
    this.isProfilering = false;
    this.session = null;
    this.profileCount = 0;

    // Statistics
    this.stats = {
      totalChecks: 0,
      spikesDetected: 0,
      profilesGenerated: 0,
      alertsFired: 0,
      maxCpuUsage: 0,
      maxEventLoopLag: 0
    };

    this.ensureProfileDirectory();
  }

  /**
   * TODO 1: Implement profile directory creation
   *
   * Create the profile directory if it doesn't exist.
   */
  ensureProfileDirectory() {
    // TODO: Create profile directory
    // if (!fs.existsSync(this.config.PROFILE_DIR)) {
    //   fs.mkdirSync(this.config.PROFILE_DIR, { recursive: true });
    // }
  }

  /**
   * TODO 2: Implement CPU usage calculation
   *
   * Calculate CPU usage percentage:
   * - Get current CPU usage with process.cpuUsage()
   * - Calculate elapsed time since last check
   * - Compute user and system CPU time used
   * - Calculate percentage based on available cores
   * - Return object with user%, system%, total%
   *
   * Formula: (cpuTime / elapsedTime) * 100 / numCPUs
   */
  calculateCPUUsage() {
    // TODO: Calculate CPU usage percentage
    // const currentUsage = process.cpuUsage();
    // const currentTime = Date.now();

    // if (!this.lastCpuUsage || !this.lastCheckTime) {
    //   this.lastCpuUsage = currentUsage;
    //   this.lastCheckTime = currentTime;
    //   return { user: 0, system: 0, total: 0 };
    // }

    // // Calculate elapsed time in microseconds
    // const elapsedTime = (currentTime - this.lastCheckTime) * 1000;

    // // Calculate CPU time used (in microseconds)
    // const userTime = currentUsage.user - this.lastCpuUsage.user;
    // const systemTime = currentUsage.system - this.lastCpuUsage.system;
    // const totalTime = userTime + systemTime;

    // // Calculate percentage (considering multiple cores)
    // const userPercent = (userTime / elapsedTime) * 100;
    // const systemPercent = (systemTime / elapsedTime) * 100;
    // const totalPercent = (totalTime / elapsedTime) * 100;

    // // Update for next calculation
    // this.lastCpuUsage = currentUsage;
    // this.lastCheckTime = currentTime;

    // return {
    //   user: userPercent,
    //   system: systemPercent,
    //   total: totalPercent,
    //   timestamp: currentTime
    // };
  }

  /**
   * TODO 3: Implement event loop lag monitoring
   *
   * Measure event loop lag:
   * - Record start time
   * - Use setImmediate to measure actual execution time
   * - Calculate lag as difference
   * - Store in lagSamples array
   * - Return lag in milliseconds
   */
  measureEventLoopLag() {
    // TODO: Measure event loop lag
    // return new Promise((resolve) => {
    //   const start = Date.now();
    //
    //   setImmediate(() => {
    //     const lag = Date.now() - start;
    //     this.lagSamples.push({ lag, timestamp: Date.now() });
    //
    //     // Keep only recent samples
    //     if (this.lagSamples.length > 100) {
    //       this.lagSamples.shift();
    //     }
    //
    //     // Update max lag
    //     if (lag > this.stats.maxEventLoopLag) {
    //       this.stats.maxEventLoopLag = lag;
    //     }
    //
    //     resolve(lag);
    //   });
    // });
  }

  /**
   * TODO 4: Implement spike detection
   *
   * Detect CPU spikes based on:
   * - Current CPU usage vs thresholds
   * - Sustained high usage (multiple samples)
   * - Event loop lag correlation
   *
   * Return detection object:
   * - isSpike (boolean)
   * - severity ('warning' | 'critical')
   * - reason (string)
   * - metrics (object with detailed stats)
   */
  detectSpike(cpuUsage, eventLoopLag) {
    // TODO: Implement spike detection
    // const result = {
    //   isSpike: false,
    //   severity: 'normal',
    //   reason: '',
    //   metrics: {
    //     cpuUsage: cpuUsage.total,
    //     eventLoopLag,
    //     sustainedHighUsage: false
    //   }
    // };

    // // Check for critical CPU usage
    // if (cpuUsage.total > this.config.CPU_CRITICAL_THRESHOLD) {
    //   result.isSpike = true;
    //   result.severity = 'critical';
    //   result.reason = `Critical CPU usage: ${cpuUsage.total.toFixed(1)}%`;
    // } else if (cpuUsage.total > this.config.CPU_WARNING_THRESHOLD) {
    //   result.isSpike = true;
    //   result.severity = 'warning';
    //   result.reason = `High CPU usage: ${cpuUsage.total.toFixed(1)}%`;
    // }

    // // Check event loop lag
    // if (eventLoopLag > this.config.LAG_CRITICAL_THRESHOLD) {
    //   result.isSpike = true;
    //   result.severity = 'critical';
    //   result.reason += ` | Critical event loop lag: ${eventLoopLag}ms`;
    // } else if (eventLoopLag > this.config.LAG_WARNING_THRESHOLD) {
    //   if (!result.isSpike) {
    //     result.isSpike = true;
    //     result.severity = 'warning';
    //   }
    //   result.reason += ` | High event loop lag: ${eventLoopLag}ms`;
    // }

    // // Check for sustained high usage
    // const recentSamples = this.cpuSamples.slice(-5);
    // if (recentSamples.length >= 5) {
    //   const avgCpu = recentSamples.reduce((sum, s) => sum + s.total, 0) / 5;
    //   if (avgCpu > this.config.CPU_WARNING_THRESHOLD) {
    //     result.metrics.sustainedHighUsage = true;
    //     result.reason += ' | Sustained high usage detected';
    //   }
    // }

    // return result;
  }

  /**
   * TODO 5: Implement CPU profiling with Inspector API
   *
   * Generate CPU profile:
   * - Create inspector session
   * - Start profiler
   * - Wait for specified duration
   * - Stop profiler and get profile data
   * - Save to file
   * - Return profile file path
   */
  async generateCPUProfile(duration = this.config.AUTO_PROFILE_DURATION) {
    // TODO: Generate CPU profile using Inspector API
    // if (this.isProfiling) {
    //   console.log('⚠️  Profiling already in progress');
    //   return null;
    // }

    // try {
    //   this.isProfiling = true;
    //   console.log(`🔍 Starting CPU profile (${duration}ms)...`);

    //   this.session = new inspector.Session();
    //   this.session.connect();

    //   // Enable profiler
    //   await new Promise((resolve, reject) => {
    //     this.session.post('Profiler.enable', (err) => {
    //       if (err) reject(err);
    //       else resolve();
    //     });
    //   });

    //   // Start profiling
    //   await new Promise((resolve, reject) => {
    //     this.session.post('Profiler.start', (err) => {
    //       if (err) reject(err);
    //       else resolve();
    //     });
    //   });

    //   // Wait for duration
    //   await new Promise(resolve => setTimeout(resolve, duration));

    //   // Stop profiling and get profile
    //   const profile = await new Promise((resolve, reject) => {
    //     this.session.post('Profiler.stop', (err, { profile }) => {
    //       if (err) reject(err);
    //       else resolve(profile);
    //     });
    //   });

    //   // Save profile
    //   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    //   const filename = `cpu-profile-${timestamp}-${this.profileCount}.cpuprofile`;
    //   const filepath = path.join(this.config.PROFILE_DIR, filename);

    //   fs.writeFileSync(filepath, JSON.stringify(profile));

    //   this.session.disconnect();
    //   this.session = null;
    //   this.isProfiling = false;
    //   this.profileCount++;
    //   this.stats.profilesGenerated++;

    //   console.log(`✅ CPU profile saved: ${filepath}`);
    //   return filepath;
    // } catch (error) {
    //   console.error('❌ Failed to generate CPU profile:', error.message);
    //   this.isProfiling = false;
    //   if (this.session) {
    //     this.session.disconnect();
    //     this.session = null;
    //   }
    //   return null;
    // }
  }

  /**
   * TODO 6: Implement performance analysis
   *
   * Analyze recent CPU samples and provide insights:
   * - Calculate average, min, max CPU usage
   * - Identify patterns (trending up/down)
   * - Correlate CPU with event loop lag
   * - Generate recommendations
   *
   * Return analysis object with recommendations array
   */
  analyzePerformance() {
    // TODO: Analyze performance and generate recommendations
    // if (this.cpuSamples.length === 0) {
    //   return { recommendations: ['Not enough data collected yet'] };
    // }

    // const recentSamples = this.cpuSamples.slice(-60); // Last minute
    // const avgCpu = recentSamples.reduce((sum, s) => sum + s.total, 0) / recentSamples.length;
    // const maxCpu = Math.max(...recentSamples.map(s => s.total));
    // const avgLag = this.lagSamples.slice(-60).reduce((sum, s) => sum + s.lag, 0) /
    //                Math.min(this.lagSamples.length, 60);

    // const recommendations = [];

    // if (avgCpu > 50) {
    //   recommendations.push('High average CPU usage - consider optimizing hot code paths');
    //   recommendations.push('Review synchronous operations and move to worker threads');
    // }

    // if (avgLag > 20) {
    //   recommendations.push('Event loop blocking detected - avoid long synchronous operations');
    //   recommendations.push('Consider using async/await or breaking work into chunks');
    // }

    // if (maxCpu > 90) {
    //   recommendations.push('CPU spikes detected - profile and optimize bottlenecks');
    // }

    // if (this.numCPUs > 1 && avgCpu < 30) {
    //   recommendations.push('Low CPU utilization - consider using cluster module for parallelism');
    // }

    // return {
    //   avgCpu: avgCpu.toFixed(1),
    //   maxCpu: maxCpu.toFixed(1),
    //   avgLag: avgLag.toFixed(1),
    //   recommendations: recommendations.length > 0 ? recommendations : ['Performance looks good']
    // };
  }

  /**
   * TODO 7: Implement alert system
   *
   * Fire alerts based on spike detection:
   * - Check alert cooldown
   * - Log alerts with severity-appropriate formatting
   * - Trigger CPU profiling for critical spikes
   * - Provide recommendations
   */
  async fireAlert(detection) {
    // TODO: Implement alert system
    // const now = Date.now();
    // if (now - this.lastAlertTime < this.config.ALERT_COOLDOWN) {
    //   return;
    // }

    // const severityEmoji = {
    //   warning: '⚠️',
    //   critical: '🚨'
    // };

    // console.log('\n' + '='.repeat(70));
    // console.log(`${severityEmoji[detection.severity]} CPU SPIKE ALERT - ${detection.severity.toUpperCase()}`);
    // console.log('='.repeat(70));
    // console.log(`Reason: ${detection.reason}`);
    // console.log(`CPU Usage: ${detection.metrics.cpuUsage.toFixed(1)}%`);
    // console.log(`Event Loop Lag: ${detection.metrics.eventLoopLag}ms`);
    // console.log(`Sustained: ${detection.metrics.sustainedHighUsage ? 'Yes' : 'No'}`);

    // // Generate performance recommendations
    // const analysis = this.analyzePerformance();
    // console.log('\n📋 Recommendations:');
    // analysis.recommendations.forEach((rec, i) => {
    //   console.log(`${i + 1}. ${rec}`);
    // });

    // // Auto-profile on critical spikes
    // if (detection.severity === 'critical' && this.config.PROFILE_ON_SPIKE) {
    //   console.log('\n🔍 Generating CPU profile...');
    //   await this.generateCPUProfile(5000); // 5 second profile
    // }

    // console.log('='.repeat(70) + '\n');

    // this.lastAlertTime = now;
    // this.stats.alertsFired++;
  }

  /**
   * TODO 8: Implement monitoring cycle
   *
   * Main monitoring logic:
   * - Calculate CPU usage
   * - Measure event loop lag
   * - Detect spikes
   * - Fire alerts if needed
   * - Store samples
   * - Update statistics
   */
  async monitoringCycle() {
    // TODO: Implement monitoring cycle
    // this.stats.totalChecks++;

    // const cpuUsage = this.calculateCPUUsage();
    // const eventLoopLag = await this.measureEventLoopLag();

    // // Store sample
    // this.cpuSamples.push(cpuUsage);
    // if (this.cpuSamples.length > 300) { // Keep 5 minutes of data
    //   this.cpuSamples.shift();
    // }

    // // Update max CPU
    // if (cpuUsage.total > this.stats.maxCpuUsage) {
    //   this.stats.maxCpuUsage = cpuUsage.total;
    // }

    // // Detect spikes
    // const detection = this.detectSpike(cpuUsage, eventLoopLag);

    // // Log current status
    // const statusIcon = cpuUsage.total > this.config.CPU_WARNING_THRESHOLD ? '🔥' : '📊';
    // const lagIcon = eventLoopLag > this.config.LAG_WARNING_THRESHOLD ? '🐌' : '⚡';
    //
    // console.log(`[${new Date().toISOString()}] ${statusIcon} CPU: ${cpuUsage.total.toFixed(1)}% ` +
    //            `(U: ${cpuUsage.user.toFixed(1)}% S: ${cpuUsage.system.toFixed(1)}%) | ` +
    //            `${lagIcon} Lag: ${eventLoopLag}ms`);

    // if (detection.isSpike) {
    //   this.stats.spikesDetected++;
    //   await this.fireAlert(detection);
    // }
  }

  /**
   * TODO 9: Start monitoring
   */
  start() {
    // TODO: Implement start method
    // if (this.isMonitoring) {
    //   console.log('Monitoring already active');
    //   return;
    // }

    // this.isMonitoring = true;
    // this.lastCpuUsage = process.cpuUsage();
    // this.lastCheckTime = Date.now();

    // console.log('🔍 CPU Profiler Dashboard Started');
    // console.log(`💻 CPUs: ${this.numCPUs}`);
    // console.log(`📊 Monitoring interval: ${this.config.MONITOR_INTERVAL}ms`);
    // console.log(`📁 Profile directory: ${this.config.PROFILE_DIR}\n`);

    // this.monitorTimer = setInterval(() => {
    //   this.monitoringCycle();
    // }, this.config.MONITOR_INTERVAL);
  }

  /**
   * TODO 10: Stop monitoring and print statistics
   */
  stop() {
    // TODO: Implement stop method
    // if (!this.isMonitoring) {
    //   return;
    // }

    // clearInterval(this.monitorTimer);
    // this.isMonitoring = false;

    // const analysis = this.analyzePerformance();

    // console.log('\n' + '='.repeat(70));
    // console.log('📊 CPU PROFILING STATISTICS');
    // console.log('='.repeat(70));
    // console.log(`Total Checks: ${this.stats.totalChecks}`);
    // console.log(`Spikes Detected: ${this.stats.spikesDetected}`);
    // console.log(`Profiles Generated: ${this.stats.profilesGenerated}`);
    // console.log(`Alerts Fired: ${this.stats.alertsFired}`);
    // console.log(`Max CPU Usage: ${this.stats.maxCpuUsage.toFixed(1)}%`);
    // console.log(`Max Event Loop Lag: ${this.stats.maxEventLoopLag}ms`);
    // console.log('\n📈 Performance Summary:');
    // console.log(`Average CPU: ${analysis.avgCpu}%`);
    // console.log(`Max CPU: ${analysis.maxCpu}%`);
    // console.log(`Average Lag: ${analysis.avgLag}ms`);
    // console.log('='.repeat(70) + '\n');
  }

  /**
   * TODO 11: Simulate CPU-intensive workload
   *
   * Create CPU-intensive operations for testing:
   * - Prime number calculation
   * - Fibonacci sequence
   * - String operations
   * - Return controller to start/stop simulation
   */
  simulateCPULoad() {
    // TODO: Implement CPU load simulation
    // let isRunning = true;

    // const heavyWork = () => {
    //   if (!isRunning) return;

    //   // Calculate primes (CPU intensive)
    //   const primes = [];
    //   for (let i = 2; i < 100000; i++) {
    //     let isPrime = true;
    //     for (let j = 2; j < Math.sqrt(i); j++) {
    //       if (i % j === 0) {
    //         isPrime = false;
    //         break;
    //       }
    //     }
    //     if (isPrime) primes.push(i);
    //   }

    //   console.log(`🔥 CPU load simulation: calculated ${primes.length} primes`);

    //   setTimeout(heavyWork, 2000);
    // };

    // heavyWork();

    // return {
    //   stop: () => {
    //     isRunning = false;
    //     console.log('🛑 CPU load simulation stopped');
    //   }
    // };
  }
}

// ============================================================================
// Main Execution
// ============================================================================

function main() {
  console.log('═'.repeat(70));
  console.log('CPU PROFILING DASHBOARD');
  console.log('═'.repeat(70));
  console.log('\nMonitoring CPU usage and event loop performance...\n');

  // TODO: Create and start profiler
  // const profiler = new CPUProfiler();
  // profiler.start();

  // TODO: Optional - simulate CPU load after 10 seconds
  // setTimeout(() => {
  //   console.log('\n🔥 Starting CPU load simulation in 5 seconds...\n');
  //   setTimeout(() => {
  //     const simulation = profiler.simulateCPULoad();
  //
  //     // Stop simulation after 30 seconds
  //     setTimeout(() => {
  //       simulation.stop();
  //     }, 30000);
  //   }, 5000);
  // }, 10000);

  // TODO: Handle graceful shutdown
  // process.on('SIGINT', () => {
  //   console.log('\n\n🛑 Shutting down profiler...');
  //   profiler.stop();
  //   process.exit(0);
  // });

  console.log('💡 Press Ctrl+C to stop monitoring\n');
}

// TODO: Uncomment to run
// main();

/**
 * Expected behavior and hints follow similar pattern to Exercise 1
 * Focus on CPU profiling, event loop monitoring, and performance analysis
 */
