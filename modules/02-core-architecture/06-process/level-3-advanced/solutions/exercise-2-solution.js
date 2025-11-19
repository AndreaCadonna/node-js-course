/**
 * SOLUTION: Exercise 2 - CPU Profiling Dashboard
 * ================================================
 *
 * Production-ready CPU profiling system with real-time monitoring,
 * event loop lag detection, automatic profiling, and performance analysis.
 *
 * KEY FEATURES:
 * - Real-time CPU usage monitoring
 * - Event loop lag detection
 * - Automatic CPU profiling on spikes
 * - Performance analysis and recommendations
 * - Inspector API integration
 */

const { performance } = require('perf_hooks');
const inspector = require('inspector');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG = {
  MONITOR_INTERVAL: 1000,
  LAG_CHECK_INTERVAL: 100,
  PROFILE_DIR: './cpu-profiles',
  CPU_WARNING_THRESHOLD: 60,
  CPU_CRITICAL_THRESHOLD: 85,
  LAG_WARNING_THRESHOLD: 50,
  LAG_CRITICAL_THRESHOLD: 100,
  AUTO_PROFILE_DURATION: 10000,
  PROFILE_ON_SPIKE: true,
  ALERT_COOLDOWN: 15000,
};

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
    this.isProfiling = false;
    this.session = null;
    this.profileCount = 0;

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

  ensureProfileDirectory() {
    if (!fs.existsSync(this.config.PROFILE_DIR)) {
      fs.mkdirSync(this.config.PROFILE_DIR, { recursive: true });
    }
  }

  /**
   * Calculate CPU usage percentage
   * Formula: (cpuTime / elapsedTime) * 100
   */
  calculateCPUUsage() {
    const currentUsage = process.cpuUsage();
    const currentTime = Date.now();

    if (!this.lastCpuUsage || !this.lastCheckTime) {
      this.lastCpuUsage = currentUsage;
      this.lastCheckTime = currentTime;
      return { user: 0, system: 0, total: 0, timestamp: currentTime };
    }

    // Calculate elapsed time in microseconds
    const elapsedTime = (currentTime - this.lastCheckTime) * 1000;

    // Calculate CPU time used (in microseconds)
    const userTime = currentUsage.user - this.lastCpuUsage.user;
    const systemTime = currentUsage.system - this.lastCpuUsage.system;
    const totalTime = userTime + systemTime;

    // Calculate percentage
    const userPercent = (userTime / elapsedTime) * 100;
    const systemPercent = (systemTime / elapsedTime) * 100;
    const totalPercent = (totalTime / elapsedTime) * 100;

    this.lastCpuUsage = currentUsage;
    this.lastCheckTime = currentTime;

    return {
      user: userPercent,
      system: systemPercent,
      total: totalPercent,
      timestamp: currentTime
    };
  }

  /**
   * Measure event loop lag
   * Lag = time between scheduling and execution
   */
  measureEventLoopLag() {
    return new Promise((resolve) => {
      const start = Date.now();

      setImmediate(() => {
        const lag = Date.now() - start;

        this.lagSamples.push({ lag, timestamp: Date.now() });

        if (this.lagSamples.length > 100) {
          this.lagSamples.shift();
        }

        if (lag > this.stats.maxEventLoopLag) {
          this.stats.maxEventLoopLag = lag;
        }

        resolve(lag);
      });
    });
  }

  /**
   * Detect CPU spikes based on thresholds and patterns
   */
  detectSpike(cpuUsage, eventLoopLag) {
    const result = {
      isSpike: false,
      severity: 'normal',
      reason: '',
      metrics: {
        cpuUsage: cpuUsage.total,
        eventLoopLag,
        sustainedHighUsage: false
      }
    };

    // Check for critical CPU usage
    if (cpuUsage.total > this.config.CPU_CRITICAL_THRESHOLD) {
      result.isSpike = true;
      result.severity = 'critical';
      result.reason = `Critical CPU usage: ${cpuUsage.total.toFixed(1)}%`;
    } else if (cpuUsage.total > this.config.CPU_WARNING_THRESHOLD) {
      result.isSpike = true;
      result.severity = 'warning';
      result.reason = `High CPU usage: ${cpuUsage.total.toFixed(1)}%`;
    }

    // Check event loop lag
    if (eventLoopLag > this.config.LAG_CRITICAL_THRESHOLD) {
      result.isSpike = true;
      result.severity = 'critical';
      result.reason += (result.reason ? ' | ' : '') +
        `Critical event loop lag: ${eventLoopLag}ms`;
    } else if (eventLoopLag > this.config.LAG_WARNING_THRESHOLD) {
      if (!result.isSpike) {
        result.isSpike = true;
        result.severity = 'warning';
      }
      result.reason += (result.reason ? ' | ' : '') +
        `High event loop lag: ${eventLoopLag}ms`;
    }

    // Check for sustained high usage
    const recentSamples = this.cpuSamples.slice(-5);
    if (recentSamples.length >= 5) {
      const avgCpu = recentSamples.reduce((sum, s) => sum + s.total, 0) / 5;
      if (avgCpu > this.config.CPU_WARNING_THRESHOLD) {
        result.metrics.sustainedHighUsage = true;
        result.reason += ' | Sustained high usage detected';
      }
    }

    return result;
  }

  /**
   * Generate CPU profile using Inspector API
   */
  async generateCPUProfile(duration = this.config.AUTO_PROFILE_DURATION) {
    if (this.isProfiling) {
      console.log('⚠️  Profiling already in progress');
      return null;
    }

    try {
      this.isProfiling = true;
      console.log(`🔍 Starting CPU profile (${duration}ms)...`);

      this.session = new inspector.Session();
      this.session.connect();

      // Enable profiler
      await new Promise((resolve, reject) => {
        this.session.post('Profiler.enable', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Start profiling
      await new Promise((resolve, reject) => {
        this.session.post('Profiler.start', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Wait for duration
      await new Promise(resolve => setTimeout(resolve, duration));

      // Stop profiling and get profile
      const profile = await new Promise((resolve, reject) => {
        this.session.post('Profiler.stop', (err, { profile }) => {
          if (err) reject(err);
          else resolve(profile);
        });
      });

      // Save profile
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `cpu-profile-${timestamp}-${this.profileCount}.cpuprofile`;
      const filepath = path.join(this.config.PROFILE_DIR, filename);

      fs.writeFileSync(filepath, JSON.stringify(profile));

      this.session.disconnect();
      this.session = null;
      this.isProfiling = false;
      this.profileCount++;
      this.stats.profilesGenerated++;

      console.log(`✅ CPU profile saved: ${filepath}`);
      console.log(`   Analyze in Chrome DevTools > Performance > Load`);

      return filepath;
    } catch (error) {
      console.error('❌ Failed to generate CPU profile:', error.message);
      this.isProfiling = false;
      if (this.session) {
        this.session.disconnect();
        this.session = null;
      }
      return null;
    }
  }

  /**
   * Analyze performance and generate recommendations
   */
  analyzePerformance() {
    if (this.cpuSamples.length === 0) {
      return { recommendations: ['Not enough data collected yet'] };
    }

    const recentSamples = this.cpuSamples.slice(-60);
    const avgCpu = recentSamples.reduce((sum, s) => sum + s.total, 0) / recentSamples.length;
    const maxCpu = Math.max(...recentSamples.map(s => s.total));
    const avgLag = this.lagSamples.slice(-60).reduce((sum, s) => sum + s.lag, 0) /
                   Math.min(this.lagSamples.length, 60);

    const recommendations = [];

    if (avgCpu > 50) {
      recommendations.push('High average CPU usage - consider optimizing hot code paths');
      recommendations.push('Review synchronous operations and move to worker threads');
      recommendations.push('Profile with Chrome DevTools to identify bottlenecks');
    }

    if (avgLag > 20) {
      recommendations.push('Event loop blocking detected - avoid long synchronous operations');
      recommendations.push('Consider using async/await or breaking work into chunks');
      recommendations.push('Use setImmediate() to yield control between tasks');
    }

    if (maxCpu > 90) {
      recommendations.push('CPU spikes detected - profile and optimize bottlenecks');
      recommendations.push('Consider implementing caching for expensive operations');
    }

    if (this.numCPUs > 1 && avgCpu < 30) {
      recommendations.push('Low CPU utilization - consider using cluster module for parallelism');
      recommendations.push(`${this.numCPUs} CPUs available but underutilized`);
    }

    if (avgLag < 10 && avgCpu < 40) {
      recommendations.push('Performance looks good - system is responsive');
    }

    return {
      avgCpu: avgCpu.toFixed(1),
      maxCpu: maxCpu.toFixed(1),
      avgLag: avgLag.toFixed(1),
      recommendations: recommendations.length > 0 ? recommendations :
        ['Performance metrics within normal range']
    };
  }

  /**
   * Fire alert based on spike detection
   */
  async fireAlert(detection) {
    const now = Date.now();
    if (now - this.lastAlertTime < this.config.ALERT_COOLDOWN) {
      return;
    }

    const severityEmoji = {
      warning: '⚠️',
      critical: '🚨'
    };

    console.log('\n' + '═'.repeat(70));
    console.log(`${severityEmoji[detection.severity]} CPU SPIKE ALERT - ${detection.severity.toUpperCase()}`);
    console.log('═'.repeat(70));
    console.log(`📌 Reason: ${detection.reason}`);
    console.log(`💻 CPU Usage: ${detection.metrics.cpuUsage.toFixed(1)}%`);
    console.log(`🐌 Event Loop Lag: ${detection.metrics.eventLoopLag}ms`);
    console.log(`📊 Sustained: ${detection.metrics.sustainedHighUsage ? 'Yes' : 'No'}`);

    const analysis = this.analyzePerformance();
    console.log('\n📋 Recommendations:');
    analysis.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });

    // Auto-profile on critical spikes
    if (detection.severity === 'critical' && this.config.PROFILE_ON_SPIKE && !this.isProfiling) {
      console.log('\n🔍 Generating CPU profile...');
      await this.generateCPUProfile(5000);
    }

    console.log('═'.repeat(70) + '\n');

    this.lastAlertTime = now;
    this.stats.alertsFired++;
  }

  /**
   * Main monitoring cycle
   */
  async monitoringCycle() {
    this.stats.totalChecks++;

    const cpuUsage = this.calculateCPUUsage();
    const eventLoopLag = await this.measureEventLoopLag();

    this.cpuSamples.push(cpuUsage);
    if (this.cpuSamples.length > 300) {
      this.cpuSamples.shift();
    }

    if (cpuUsage.total > this.stats.maxCpuUsage) {
      this.stats.maxCpuUsage = cpuUsage.total;
    }

    const detection = this.detectSpike(cpuUsage, eventLoopLag);

    const statusIcon = cpuUsage.total > this.config.CPU_WARNING_THRESHOLD ? '🔥' : '📊';
    const lagIcon = eventLoopLag > this.config.LAG_WARNING_THRESHOLD ? '🐌' : '⚡';

    console.log(
      `[${new Date().toISOString()}] ${statusIcon} CPU: ${cpuUsage.total.toFixed(1)}% ` +
      `(U: ${cpuUsage.user.toFixed(1)}% S: ${cpuUsage.system.toFixed(1)}%) | ` +
      `${lagIcon} Lag: ${eventLoopLag}ms`
    );

    if (detection.isSpike) {
      this.stats.spikesDetected++;
      await this.fireAlert(detection);
    }
  }

  start() {
    if (this.isMonitoring) {
      console.log('Monitoring already active');
      return;
    }

    this.isMonitoring = true;
    this.lastCpuUsage = process.cpuUsage();
    this.lastCheckTime = Date.now();

    console.log('🔍 CPU Profiler Dashboard Started');
    console.log(`💻 CPUs: ${this.numCPUs}`);
    console.log(`📊 Monitoring interval: ${this.config.MONITOR_INTERVAL}ms`);
    console.log(`📁 Profile directory: ${this.config.PROFILE_DIR}\n`);

    this.monitorTimer = setInterval(() => {
      this.monitoringCycle();
    }, this.config.MONITOR_INTERVAL);
  }

  stop() {
    if (!this.isMonitoring) return;

    clearInterval(this.monitorTimer);
    this.isMonitoring = false;

    const analysis = this.analyzePerformance();

    console.log('\n' + '═'.repeat(70));
    console.log('📊 CPU PROFILING STATISTICS');
    console.log('═'.repeat(70));
    console.log(`Total Checks: ${this.stats.totalChecks}`);
    console.log(`Spikes Detected: ${this.stats.spikesDetected}`);
    console.log(`Profiles Generated: ${this.stats.profilesGenerated}`);
    console.log(`Alerts Fired: ${this.stats.alertsFired}`);
    console.log(`Max CPU Usage: ${this.stats.maxCpuUsage.toFixed(1)}%`);
    console.log(`Max Event Loop Lag: ${this.stats.maxEventLoopLag}ms`);
    console.log('\n📈 Performance Summary:');
    console.log(`Average CPU: ${analysis.avgCpu}%`);
    console.log(`Max CPU: ${analysis.maxCpu}%`);
    console.log(`Average Lag: ${analysis.avgLag}ms`);
    console.log('═'.repeat(70) + '\n');
  }

  /**
   * Simulate CPU-intensive workload
   */
  simulateCPULoad() {
    console.log('🔥 Starting CPU load simulation...\n');
    let isRunning = true;

    const heavyWork = () => {
      if (!isRunning) return;

      // Calculate primes (CPU intensive)
      const primes = [];
      for (let i = 2; i < 100000; i++) {
        let isPrime = true;
        for (let j = 2; j <= Math.sqrt(i); j++) {
          if (i % j === 0) {
            isPrime = false;
            break;
          }
        }
        if (isPrime) primes.push(i);
      }

      console.log(`🔥 CPU load simulation: calculated ${primes.length} primes`);

      setTimeout(heavyWork, 2000);
    };

    heavyWork();

    return {
      stop: () => {
        isRunning = false;
        console.log('🛑 CPU load simulation stopped');
      }
    };
  }
}

// Main
function main() {
  console.log('═'.repeat(70));
  console.log('CPU PROFILING DASHBOARD');
  console.log('═'.repeat(70));
  console.log('\nMonitoring CPU usage and event loop performance...\n');

  const profiler = new CPUProfiler();
  profiler.start();

  // Simulate CPU load after 10 seconds
  setTimeout(() => {
    console.log('\n🔥 Starting CPU load simulation in 5 seconds...\n');
    setTimeout(() => {
      const simulation = profiler.simulateCPULoad();

      setTimeout(() => {
        simulation.stop();
      }, 30000);
    }, 5000);
  }, 10000);

  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down profiler...');
    profiler.stop();
    process.exit(0);
  });

  console.log('💡 Press Ctrl+C to stop monitoring\n');
}

main();
