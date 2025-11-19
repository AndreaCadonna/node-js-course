/**
 * Example 3: Continuous System Monitoring
 *
 * This example demonstrates how to implement continuous
 * system monitoring with historical data tracking.
 */

const os = require('os');

console.log('=== Continuous System Monitor ===\n');
console.log('Monitoring system metrics every 5 seconds...');
console.log('Will run for 30 seconds\n');

class SystemMonitor {
  constructor(interval = 5000) {
    this.interval = interval;
    this.history = [];
    this.maxHistory = 20;
  }

  start() {
    console.log('Starting monitor...\n');

    // Take initial measurement
    this.measure();

    // Set up interval
    this.timer = setInterval(() => {
      this.measure();
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      console.log('\nMonitor stopped');
      this.displaySummary();
    }
  }

  measure() {
    const timestamp = new Date();
    const measurement = {
      timestamp,
      memory: this.getMemoryMetrics(),
      cpu: this.getCPUInfo(),
      uptime: os.uptime()
    };

    // Add load average if available
    if (os.platform() !== 'win32') {
      measurement.loadAvg = os.loadavg();
    }

    this.history.push(measurement);

    // Keep only recent history
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.displayMeasurement(measurement);

    return measurement;
  }

  getMemoryMetrics() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;

    return {
      total,
      free,
      used,
      usagePercent: (used / total) * 100
    };
  }

  getCPUInfo() {
    const cpus = os.cpus();
    return {
      count: cpus.length,
      model: cpus[0].model,
      speed: cpus[0].speed
    };
  }

  displayMeasurement(measurement) {
    const time = measurement.timestamp.toLocaleTimeString();
    const memPercent = measurement.memory.usagePercent.toFixed(1);

    let output = `[${time}] `;
    output += `Memory: ${memPercent}% `;

    if (measurement.loadAvg) {
      output += `| Load: ${measurement.loadAvg[0].toFixed(2)}`;
    }

    // Add status indicator
    if (measurement.memory.usagePercent > 85) {
      output += ' 🔴';
    } else if (measurement.memory.usagePercent > 70) {
      output += ' 🟡';
    } else {
      output += ' 🟢';
    }

    console.log(output);
  }

  displaySummary() {
    if (this.history.length === 0) {
      console.log('No data collected');
      return;
    }

    console.log('\n═══ Monitoring Summary ═══\n');

    // Calculate statistics
    const memUsages = this.history.map(h => h.memory.usagePercent);
    const avgMemory = memUsages.reduce((a, b) => a + b, 0) / memUsages.length;
    const maxMemory = Math.max(...memUsages);
    const minMemory = Math.min(...memUsages);

    console.log('Memory Usage:');
    console.log('  Average:', avgMemory.toFixed(2) + '%');
    console.log('  Maximum:', maxMemory.toFixed(2) + '%');
    console.log('  Minimum:', minMemory.toFixed(2) + '%');

    if (this.history[0].loadAvg) {
      const loads = this.history.map(h => h.loadAvg[0]);
      const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
      const maxLoad = Math.max(...loads);

      console.log('\nLoad Average (1-min):');
      console.log('  Average:', avgLoad.toFixed(2));
      console.log('  Maximum:', maxLoad.toFixed(2));
    }

    console.log('\nMeasurements:', this.history.length);
    console.log('Duration:', Math.round((this.history[this.history.length - 1].timestamp - this.history[0].timestamp) / 1000), 'seconds');
  }

  getStats() {
    if (this.history.length === 0) return null;

    const latest = this.history[this.history.length - 1];
    const memUsages = this.history.map(h => h.memory.usagePercent);

    return {
      latest: latest,
      averageMemoryUsage: memUsages.reduce((a, b) => a + b, 0) / memUsages.length,
      measurements: this.history.length
    };
  }
}

// Create and start monitor
const monitor = new SystemMonitor(5000);
monitor.start();

// Stop after 30 seconds
setTimeout(() => {
  monitor.stop();
}, 30000);
