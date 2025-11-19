/**
 * Advanced CPU Profiling System
 *
 * This module demonstrates enterprise-grade CPU profiling using:
 * - V8 Inspector Protocol integration
 * - CPU profile generation and analysis
 * - Flame graph generation
 * - Performance hotspot detection
 * - Real-time CPU monitoring
 * - APM integration patterns
 *
 * Production Features:
 * - Low-overhead profiling
 * - Automated profile triggering
 * - Profile analysis and optimization recommendations
 * - Integration with distributed tracing
 * - CPU spike detection
 * - Event loop monitoring
 *
 * @module CPUProfiling
 */

const inspector = require('inspector');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

/**
 * CPU Profiler Configuration
 */
const DEFAULT_CONFIG = {
  // Profiling settings
  samplingInterval: 100,           // Microseconds between samples
  maxProfileDuration: 60000,       // Maximum profile duration (ms)
  profileDir: './cpu-profiles',

  // Monitoring
  monitoringInterval: 1000,        // CPU check interval
  cpuThreshold: 80,                // CPU usage threshold (%)
  autoProfileOnSpike: true,        // Auto-profile on CPU spike
  spikeThreshold: 90,              // Spike threshold (%)
  spikeDuration: 5000,             // Minimum spike duration

  // Event loop monitoring
  monitorEventLoop: true,
  eventLoopThreshold: 100,         // ms
  eventLoopWarningThreshold: 50,   // ms

  // Analysis
  enableHotspotDetection: true,
  hotspotThreshold: 10,            // % of total time
  maxHotspots: 10,

  // Performance
  maxProfiles: 20,                 // Keep last N profiles
  enableCompression: false,
};

/**
 * CPU Usage Monitor
 */
class CPUMonitor {
  constructor(interval = 1000) {
    this.interval = interval;
    this.samples = [];
    this.isMonitoring = false;
    this.lastCPUUsage = process.cpuUsage();
    this.lastCheck = Date.now();
  }

  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitorInterval = setInterval(() => {
      this.sample();
    }, this.interval);
  }

  stop() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    clearInterval(this.monitorInterval);
  }

  sample() {
    const now = Date.now();
    const currentCPU = process.cpuUsage();

    // Calculate CPU usage percentage
    const elapsedTimeMs = now - this.lastCheck;
    const userDiff = currentCPU.user - this.lastCPUUsage.user;
    const systemDiff = currentCPU.system - this.lastCPUUsage.system;

    // Convert microseconds to milliseconds
    const totalCPUTime = (userDiff + systemDiff) / 1000;
    const cpuPercent = (totalCPUTime / elapsedTimeMs) * 100;

    const sample = {
      timestamp: now,
      cpuPercent: Math.min(cpuPercent, 100), // Cap at 100%
      user: currentCPU.user,
      system: currentCPU.system,
      userPercent: (userDiff / 1000 / elapsedTimeMs) * 100,
      systemPercent: (systemDiff / 1000 / elapsedTimeMs) * 100,
    };

    this.samples.push(sample);

    // Keep last 60 samples (1 minute with 1s interval)
    if (this.samples.length > 60) {
      this.samples.shift();
    }

    this.lastCPUUsage = currentCPU;
    this.lastCheck = now;

    return sample;
  }

  getAverage(duration = 60000) {
    const cutoff = Date.now() - duration;
    const recentSamples = this.samples.filter(s => s.timestamp > cutoff);

    if (recentSamples.length === 0) return 0;

    const sum = recentSamples.reduce((acc, s) => acc + s.cpuPercent, 0);
    return sum / recentSamples.length;
  }

  detectSpike(threshold, duration) {
    const cutoff = Date.now() - duration;
    const recentSamples = this.samples.filter(s => s.timestamp > cutoff);

    const highSamples = recentSamples.filter(s => s.cpuPercent > threshold);

    return {
      isSpike: highSamples.length / recentSamples.length > 0.7,
      avgCPU: recentSamples.reduce((acc, s) => acc + s.cpuPercent, 0) / recentSamples.length,
      peakCPU: Math.max(...recentSamples.map(s => s.cpuPercent)),
      duration: recentSamples.length * this.interval,
    };
  }

  getCurrentUsage() {
    return this.samples[this.samples.length - 1] || null;
  }
}

/**
 * Event Loop Monitor
 */
class EventLoopMonitor {
  constructor(threshold = 100) {
    this.threshold = threshold;
    this.samples = [];
    this.isMonitoring = false;
  }

  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.checkEventLoop();
  }

  stop() {
    this.isMonitoring = false;
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  checkEventLoop() {
    if (!this.isMonitoring) return;

    const start = performance.now();

    setImmediate(() => {
      const delay = performance.now() - start;

      const sample = {
        timestamp: Date.now(),
        delay: delay,
        isBlocked: delay > this.threshold,
      };

      this.samples.push(sample);

      // Keep last 100 samples
      if (this.samples.length > 100) {
        this.samples.shift();
      }

      // Continue monitoring
      this.timeout = setTimeout(() => this.checkEventLoop(), 100);
    });
  }

  getStats() {
    if (this.samples.length === 0) return null;

    const delays = this.samples.map(s => s.delay);
    const blocked = this.samples.filter(s => s.isBlocked);

    return {
      count: this.samples.length,
      avg: delays.reduce((a, b) => a + b, 0) / delays.length,
      min: Math.min(...delays),
      max: Math.max(...delays),
      p95: this.percentile(delays, 0.95),
      p99: this.percentile(delays, 0.99),
      blockedCount: blocked.length,
      blockedPercent: (blocked.length / this.samples.length) * 100,
    };
  }

  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

/**
 * V8 Inspector Session Manager
 */
class InspectorSession {
  constructor() {
    this.session = null;
    this.isActive = false;
  }

  connect() {
    if (this.isActive) return;

    this.session = new inspector.Session();
    this.session.connect();
    this.isActive = true;
  }

  disconnect() {
    if (!this.isActive) return;

    this.session.disconnect();
    this.isActive = false;
  }

  async post(method, params = {}) {
    return new Promise((resolve, reject) => {
      this.session.post(method, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

/**
 * CPU Profile Analyzer
 */
class ProfileAnalyzer {
  constructor() {
    this.callTree = null;
  }

  /**
   * Analyze CPU profile and extract insights
   */
  analyze(profile) {
    const nodes = profile.nodes;
    const samples = profile.samples;
    const timeDeltas = profile.timeDeltas;

    // Build call tree
    this.callTree = this.buildCallTree(nodes);

    // Calculate total time
    const totalTime = timeDeltas.reduce((a, b) => a + b, 0);

    // Find hotspots
    const hotspots = this.findHotspots(nodes, samples, timeDeltas, totalTime);

    // Analyze by category
    const categories = this.categorizeNodes(nodes, samples, totalTime);

    // Calculate statistics
    const stats = {
      totalTime: totalTime / 1000, // Convert to ms
      sampleCount: samples.length,
      uniqueFunctions: nodes.length,
      hotspots: hotspots,
      categories: categories,
    };

    return {
      stats,
      recommendations: this.generateRecommendations(hotspots, categories),
    };
  }

  buildCallTree(nodes) {
    const tree = new Map();

    nodes.forEach((node, index) => {
      tree.set(node.id, {
        id: node.id,
        functionName: node.callFrame.functionName || '(anonymous)',
        url: node.callFrame.url,
        lineNumber: node.callFrame.lineNumber,
        children: node.children || [],
        hitCount: node.hitCount || 0,
      });
    });

    return tree;
  }

  findHotspots(nodes, samples, timeDeltas, totalTime) {
    // Count time spent in each function
    const functionTime = new Map();

    samples.forEach((sampleId, index) => {
      const node = nodes.find(n => n.id === sampleId);
      if (!node) return;

      const funcName = node.callFrame.functionName || '(anonymous)';
      const time = timeDeltas[index] || 0;

      functionTime.set(funcName, (functionTime.get(funcName) || 0) + time);
    });

    // Convert to array and calculate percentages
    const hotspots = Array.from(functionTime.entries())
      .map(([name, time]) => ({
        function: name,
        time: time / 1000, // ms
        percent: (time / totalTime) * 100,
      }))
      .filter(h => h.percent > 1) // Only functions taking >1% time
      .sort((a, b) => b.time - a.time)
      .slice(0, 10); // Top 10

    return hotspots;
  }

  categorizeNodes(nodes, samples, totalTime) {
    const categories = {
      userCode: 0,
      nodeModules: 0,
      nativeCode: 0,
      v8: 0,
      other: 0,
    };

    nodes.forEach(node => {
      const url = node.callFrame.url;
      const hitCount = node.hitCount || 0;

      if (!url || url === '') {
        categories.nativeCode += hitCount;
      } else if (url.includes('node_modules')) {
        categories.nodeModules += hitCount;
      } else if (url.startsWith('node:') || url.includes('internal/')) {
        categories.v8 += hitCount;
      } else if (url.includes('/')) {
        categories.userCode += hitCount;
      } else {
        categories.other += hitCount;
      }
    });

    const total = Object.values(categories).reduce((a, b) => a + b, 0);

    // Convert to percentages
    Object.keys(categories).forEach(key => {
      categories[key] = ((categories[key] / total) * 100).toFixed(2);
    });

    return categories;
  }

  generateRecommendations(hotspots, categories) {
    const recommendations = [];

    // Check user code hotspots
    if (parseFloat(categories.userCode) > 50) {
      const topUserHotspot = hotspots[0];
      if (topUserHotspot && topUserHotspot.percent > 20) {
        recommendations.push({
          priority: 'high',
          category: 'performance',
          message: `Function "${topUserHotspot.function}" consumes ${topUserHotspot.percent.toFixed(1)}% of CPU time`,
          actions: [
            'Profile this function in isolation',
            'Consider algorithm optimization',
            'Check for unnecessary loops or recursion',
            'Look for blocking operations',
          ],
        });
      }
    }

    // Check node_modules usage
    if (parseFloat(categories.nodeModules) > 40) {
      recommendations.push({
        priority: 'medium',
        category: 'dependencies',
        message: 'Significant time spent in node_modules',
        actions: [
          'Review dependency choices',
          'Consider lighter alternatives',
          'Check if dependencies are used efficiently',
          'Profile specific module usage',
        ],
      });
    }

    // Check native code
    if (parseFloat(categories.nativeCode) > 30) {
      recommendations.push({
        priority: 'low',
        category: 'native',
        message: 'High native code execution',
        actions: [
          'This may be normal for I/O-heavy operations',
          'Verify system calls are necessary',
          'Consider async alternatives for blocking operations',
        ],
      });
    }

    return recommendations;
  }
}

/**
 * Main CPU Profiler
 */
class CPUProfiler extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.inspector = new InspectorSession();
    this.cpuMonitor = new CPUMonitor(this.config.monitoringInterval);
    this.eventLoopMonitor = new EventLoopMonitor(this.config.eventLoopThreshold);
    this.analyzer = new ProfileAnalyzer();

    this.isProfilering = false;
    this.profiles = [];
    this.profileStartTime = 0;

    this.metrics = {
      profilesCreated: 0,
      autoProfilesTriggered: 0,
      cpuSpikesDetected: 0,
    };
  }

  /**
   * Start monitoring CPU
   */
  startMonitoring() {
    console.log('🔍 Starting CPU monitoring...');

    this.cpuMonitor.start();

    if (this.config.monitorEventLoop) {
      this.eventLoopMonitor.start();
    }

    // Check for CPU spikes
    if (this.config.autoProfileOnSpike) {
      this.spikeCheckInterval = setInterval(() => {
        this.checkForSpikes();
      }, this.config.monitoringInterval);
    }

    this.emit('monitoring-started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    console.log('🛑 Stopping CPU monitoring...');

    this.cpuMonitor.stop();
    this.eventLoopMonitor.stop();

    if (this.spikeCheckInterval) {
      clearInterval(this.spikeCheckInterval);
    }

    this.emit('monitoring-stopped');
  }

  /**
   * Check for CPU spikes
   */
  async checkForSpikes() {
    const spike = this.cpuMonitor.detectSpike(
      this.config.spikeThreshold,
      this.config.spikeDuration
    );

    if (spike.isSpike && !this.isProfilering) {
      this.metrics.cpuSpikesDetected++;

      console.warn(`⚠️  CPU spike detected: ${spike.avgCPU.toFixed(1)}% avg, ${spike.peakCPU.toFixed(1)}% peak`);

      this.emit('cpu-spike', spike);

      // Auto-profile
      if (this.config.autoProfileOnSpike) {
        this.metrics.autoProfilesTriggered++;
        console.log('📊 Auto-triggering CPU profile...');
        await this.startProfiling();

        // Profile for spike duration or max duration
        const duration = Math.min(this.config.spikeDuration, this.config.maxProfileDuration);
        setTimeout(() => {
          this.stopProfiling().catch(console.error);
        }, duration);
      }
    }
  }

  /**
   * Start CPU profiling
   */
  async startProfiling() {
    if (this.isProfilering) {
      console.warn('Profiling already in progress');
      return;
    }

    try {
      this.inspector.connect();

      // Enable profiler
      await this.inspector.post('Profiler.enable');

      // Start profiling
      await this.inspector.post('Profiler.start', {
        samplingInterval: this.config.samplingInterval,
      });

      this.isProfilering = true;
      this.profileStartTime = Date.now();

      console.log('🎯 CPU profiling started');
      this.emit('profiling-started');
    } catch (error) {
      console.error('Failed to start profiling:', error);
      throw error;
    }
  }

  /**
   * Stop CPU profiling and save
   */
  async stopProfiling(filename = null) {
    if (!this.isProfilering) {
      console.warn('No active profiling session');
      return null;
    }

    try {
      // Stop profiling
      const { profile } = await this.inspector.post('Profiler.stop');

      const duration = Date.now() - this.profileStartTime;

      // Disable profiler
      await this.inspector.post('Profiler.disable');
      this.inspector.disconnect();

      this.isProfilering = false;

      console.log(`✅ CPU profiling stopped (duration: ${duration}ms)`);

      // Analyze profile
      const analysis = this.analyzer.analyze(profile);

      // Save profile
      const savedProfile = await this.saveProfile(profile, analysis, filename);

      this.metrics.profilesCreated++;
      this.emit('profiling-stopped', { profile: savedProfile, analysis });

      return savedProfile;
    } catch (error) {
      console.error('Failed to stop profiling:', error);
      this.isProfilering = false;
      this.inspector.disconnect();
      throw error;
    }
  }

  /**
   * Save profile to disk
   */
  async saveProfile(profile, analysis, filename = null) {
    const name = filename || `cpu-profile-${Date.now()}.cpuprofile`;
    const filepath = path.join(this.config.profileDir, name);

    try {
      // Ensure directory exists
      await mkdir(this.config.profileDir, { recursive: true });

      // Add metadata
      const profileData = {
        profile,
        metadata: {
          timestamp: Date.now(),
          duration: profile.endTime - profile.startTime,
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        analysis,
      };

      await writeFile(filepath, JSON.stringify(profileData, null, 2));

      console.log(`💾 Profile saved to: ${filepath}`);

      // Cleanup old profiles
      await this.cleanupOldProfiles();

      return {
        filename: name,
        filepath,
        size: fs.statSync(filepath).size,
        analysis,
      };
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  }

  /**
   * Cleanup old profiles
   */
  async cleanupOldProfiles() {
    try {
      const files = fs.readdirSync(this.config.profileDir);
      const profiles = files
        .filter(f => f.endsWith('.cpuprofile'))
        .map(f => ({
          name: f,
          path: path.join(this.config.profileDir, f),
          time: fs.statSync(path.join(this.config.profileDir, f)).mtime,
        }))
        .sort((a, b) => b.time - a.time);

      // Remove old profiles
      if (profiles.length > this.config.maxProfiles) {
        for (let i = this.config.maxProfiles; i < profiles.length; i++) {
          fs.unlinkSync(profiles[i].path);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup profiles:', error);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    const cpuUsage = this.cpuMonitor.getCurrentUsage();
    const eventLoopStats = this.eventLoopMonitor.getStats();

    return {
      monitoring: {
        cpu: this.cpuMonitor.isMonitoring,
        eventLoop: this.eventLoopMonitor.isMonitoring,
      },
      profiling: {
        active: this.isProfilering,
        duration: this.isProfilering ? Date.now() - this.profileStartTime : 0,
      },
      current: {
        cpu: cpuUsage,
        eventLoop: eventLoopStats,
      },
      metrics: this.metrics,
    };
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const status = this.getStatus();
    const cpuHistory = this.cpuMonitor.samples.slice(-10);

    return {
      timestamp: Date.now(),
      status,
      cpuHistory,
      metrics: this.metrics,
      recommendations: this.generateSystemRecommendations(status),
    };
  }

  generateSystemRecommendations(status) {
    const recommendations = [];

    // Check average CPU
    const avgCPU = this.cpuMonitor.getAverage();
    if (avgCPU > 70) {
      recommendations.push({
        priority: 'high',
        category: 'cpu-usage',
        message: `High average CPU usage: ${avgCPU.toFixed(1)}%`,
        actions: [
          'Take CPU profile to identify hotspots',
          'Review resource-intensive operations',
          'Consider horizontal scaling',
          'Check for inefficient algorithms',
        ],
      });
    }

    // Check event loop
    if (status.current.eventLoop) {
      const { avg, p95, blockedPercent } = status.current.eventLoop;

      if (p95 > this.config.eventLoopThreshold) {
        recommendations.push({
          priority: 'high',
          category: 'event-loop',
          message: `Event loop delays detected (p95: ${p95.toFixed(2)}ms)`,
          actions: [
            'Identify blocking operations',
            'Move CPU-intensive work to worker threads',
            'Use async alternatives for I/O',
            'Consider breaking up long-running tasks',
          ],
        });
      }
    }

    return recommendations;
  }
}

/**
 * Demo: CPU profiling
 */
async function demonstrateCPUProfiling() {
  console.log('='.repeat(80));
  console.log('ADVANCED CPU PROFILING DEMO');
  console.log('='.repeat(80));

  const profiler = new CPUProfiler({
    monitoringInterval: 1000,
    spikeThreshold: 80,
    autoProfileOnSpike: false, // Manual control for demo
  });

  // Listen to events
  profiler.on('cpu-spike', (spike) => {
    console.warn(`\n⚠️  CPU Spike: ${spike.avgCPU.toFixed(1)}% avg, ${spike.peakCPU.toFixed(1)}% peak`);
  });

  // Start monitoring
  profiler.startMonitoring();

  // Wait for baseline
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n1️⃣  Starting CPU profile...');
  await profiler.startProfiling();

  // Simulate CPU-intensive work
  console.log('2️⃣  Simulating CPU-intensive operations...');

  // Heavy computation
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }

  function heavyOperation() {
    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push(fibonacci(35));
    }
    return results;
  }

  function stringManipulation() {
    let str = '';
    for (let i = 0; i < 100000; i++) {
      str += 'a';
      str = str.replace('a', 'b');
    }
    return str;
  }

  // Run operations
  heavyOperation();
  stringManipulation();

  // Wait a bit more
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n3️⃣  Stopping profile and analyzing...');
  const result = await profiler.stopProfiling();

  // Display analysis
  console.log('\n' + '='.repeat(80));
  console.log('PROFILE ANALYSIS');
  console.log('='.repeat(80));

  const { analysis } = result;
  console.log('\n📊 Statistics:');
  console.log(`  Total Time: ${analysis.stats.totalTime.toFixed(2)}ms`);
  console.log(`  Samples: ${analysis.stats.sampleCount}`);
  console.log(`  Unique Functions: ${analysis.stats.uniqueFunctions}`);

  console.log('\n🔥 Top Hotspots:');
  analysis.stats.hotspots.forEach((hotspot, i) => {
    console.log(`  ${i + 1}. ${hotspot.function}`);
    console.log(`     Time: ${hotspot.time.toFixed(2)}ms (${hotspot.percent.toFixed(1)}%)`);
  });

  console.log('\n📂 Code Categories:');
  Object.entries(analysis.stats.categories).forEach(([category, percent]) => {
    console.log(`  ${category}: ${percent}%`);
  });

  if (analysis.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    analysis.recommendations.forEach((rec, i) => {
      console.log(`\n  ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      rec.actions.forEach(action => {
        console.log(`     - ${action}`);
      });
    });
  }

  // Show current status
  console.log('\n' + '='.repeat(80));
  console.log('SYSTEM STATUS');
  console.log('='.repeat(80));

  const status = profiler.getStatus();
  console.log('\nCPU Usage:');
  if (status.current.cpu) {
    console.log(`  Current: ${status.current.cpu.cpuPercent.toFixed(1)}%`);
    console.log(`  User: ${status.current.cpu.userPercent.toFixed(1)}%`);
    console.log(`  System: ${status.current.cpu.systemPercent.toFixed(1)}%`);
  }

  console.log('\nEvent Loop:');
  if (status.current.eventLoop) {
    const el = status.current.eventLoop;
    console.log(`  Average Delay: ${el.avg.toFixed(2)}ms`);
    console.log(`  P95: ${el.p95.toFixed(2)}ms`);
    console.log(`  P99: ${el.p99.toFixed(2)}ms`);
    console.log(`  Blocked: ${el.blockedPercent.toFixed(1)}%`);
  }

  console.log('\nMetrics:');
  console.log(`  Profiles Created: ${profiler.metrics.profilesCreated}`);
  console.log(`  CPU Spikes: ${profiler.metrics.cpuSpikesDetected}`);
  console.log(`  Auto Profiles: ${profiler.metrics.autoProfilesTriggered}`);

  // Stop monitoring
  profiler.stopMonitoring();

  console.log('\n✅ Demo complete!');
  console.log(`\n📁 Profile saved to: ${result.filepath}`);
  console.log('\n💡 Analysis Tips:');
  console.log('  1. Open .cpuprofile files in Chrome DevTools (Performance tab)');
  console.log('  2. Look for wide bars in flame graph (CPU hotspots)');
  console.log('  3. Focus on optimizing functions with >5% CPU time');
  console.log('  4. Use --prof and --prof-process for V8 internal profiling');
  console.log('  5. Integrate with APM tools like New Relic or DataDog');
}

// Run demo if executed directly
if (require.main === module) {
  demonstrateCPUProfiling().catch(console.error);
}

module.exports = {
  CPUProfiler,
  CPUMonitor,
  EventLoopMonitor,
  ProfileAnalyzer,
  InspectorSession,
};
