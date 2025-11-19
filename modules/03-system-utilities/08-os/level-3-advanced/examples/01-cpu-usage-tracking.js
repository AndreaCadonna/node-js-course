/**
 * Example 1: Real-Time CPU Usage Tracking
 *
 * This example demonstrates how to accurately track CPU usage
 * over time by comparing measurements.
 */

const os = require('os');

console.log('=== Real-Time CPU Usage Tracking ===\n');

class CPUUsageTracker {
  constructor() {
    this.previousMeasurement = null;
  }

  /**
   * Get CPU times snapshot
   */
  getCPUTimes() {
    const cpus = os.cpus();
    const totals = { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 };

    cpus.forEach(cpu => {
      totals.user += cpu.times.user;
      totals.nice += cpu.times.nice;
      totals.sys += cpu.times.sys;
      totals.idle += cpu.times.idle;
      totals.irq += cpu.times.irq;
    });

    return {
      timestamp: Date.now(),
      times: totals,
      cpuCount: cpus.length
    };
  }

  /**
   * Calculate CPU usage between two measurements
   */
  calculateUsage(start, end) {
    const userDiff = end.times.user - start.times.user;
    const niceDiff = end.times.nice - start.times.nice;
    const sysDiff = end.times.sys - start.times.sys;
    const idleDiff = end.times.idle - start.times.idle;
    const irqDiff = end.times.irq - start.times.irq;

    const totalDiff = userDiff + niceDiff + sysDiff + idleDiff + irqDiff;
    const activeDiff = totalDiff - idleDiff;

    const usage = (activeDiff / totalDiff) * 100;
    const userPercent = (userDiff / totalDiff) * 100;
    const sysPercent = (sysDiff / totalDiff) * 100;

    return {
      total: usage,
      user: userPercent,
      system: sysPercent,
      idle: (idleDiff / totalDiff) * 100,
      duration: end.timestamp - start.timestamp
    };
  }

  /**
   * Get current CPU usage (requires previous measurement)
   */
  async getCurrentUsage() {
    const current = this.getCPUTimes();

    if (!this.previousMeasurement) {
      this.previousMeasurement = current;
      // Wait a bit for meaningful measurement
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getCurrentUsage();
    }

    const usage = this.calculateUsage(this.previousMeasurement, current);
    this.previousMeasurement = current;

    return usage;
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(interval = 1000, duration = 10000) {
    console.log(`Monitoring CPU usage for ${duration / 1000} seconds...\n`);

    const measurements = [];
    let count = 0;

    const timer = setInterval(async () => {
      const usage = await this.getCurrentUsage();
      measurements.push(usage);

      const time = new Date().toLocaleTimeString();
      const bar = this.createBar(usage.total);

      console.log(`[${time}] CPU: ${bar} ${usage.total.toFixed(1)}%`);
      console.log(`          User: ${usage.user.toFixed(1)}% | System: ${usage.system.toFixed(1)}% | Idle: ${usage.idle.toFixed(1)}%`);

      count++;
      if (count >= duration / interval) {
        clearInterval(timer);
        this.displaySummary(measurements);
      }
    }, interval);
  }

  createBar(percent) {
    const width = 30;
    const filled = Math.round((percent / 100) * width);
    return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + ']';
  }

  displaySummary(measurements) {
    if (measurements.length === 0) return;

    console.log('\n═══ CPU Usage Summary ═══\n');

    const totals = measurements.map(m => m.total);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const max = Math.max(...totals);
    const min = Math.min(...totals);

    console.log('Total CPU Usage:');
    console.log('  Average:', avg.toFixed(2) + '%');
    console.log('  Maximum:', max.toFixed(2) + '%');
    console.log('  Minimum:', min.toFixed(2) + '%');

    const userAvg = measurements.reduce((sum, m) => sum + m.user, 0) / measurements.length;
    const sysAvg = measurements.reduce((sum, m) => sum + m.system, 0) / measurements.length;

    console.log('\nBreakdown:');
    console.log('  Avg User:', userAvg.toFixed(2) + '%');
    console.log('  Avg System:', sysAvg.toFixed(2) + '%');

    console.log('\nMeasurements:', measurements.length);
  }
}

// Example usage
const tracker = new CPUUsageTracker();

// Start monitoring
tracker.startMonitoring(1000, 10000);
