/**
 * Example 6: System Monitoring Dashboard
 *
 * This example demonstrates how to create a real-time
 * monitoring dashboard with formatted output.
 */

const os = require('os');

console.log('=== System Monitoring Dashboard ===\n');

class MonitoringDashboard {
  constructor(refreshInterval = 2000) {
    this.refreshInterval = refreshInterval;
    this.running = false;
  }

  start() {
    this.running = true;
    console.log('Starting dashboard... (Press Ctrl+C to stop)\n');

    this.refresh();
    this.timer = setInterval(() => {
      if (this.running) {
        this.refresh();
      }
    }, this.refreshInterval);
  }

  stop() {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  refresh() {
    // Clear screen (works in most terminals)
    console.clear();

    const data = this.collectData();
    this.render(data);
  }

  collectData() {
    const cpus = os.cpus();
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;

    return {
      timestamp: new Date(),
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        uptime: os.uptime()
      },
      cpu: {
        model: cpus[0].model,
        count: cpus.length,
        speed: cpus[0].speed
      },
      memory: {
        total,
        free,
        used,
        usagePercent: (used / total) * 100
      },
      load: os.platform() !== 'win32' ? os.loadavg() : null,
      network: this.getNetworkSummary()
    };
  }

  getNetworkSummary() {
    const interfaces = os.networkInterfaces();
    let externalIPv4 = 0;
    let externalIPv6 = 0;

    for (const addrs of Object.values(interfaces)) {
      for (const addr of addrs) {
        if (!addr.internal) {
          if (addr.family === 'IPv4') externalIPv4++;
          if (addr.family === 'IPv6') externalIPv6++;
        }
      }
    }

    return { externalIPv4, externalIPv6 };
  }

  render(data) {
    const width = 60;

    // Header
    this.printLine('═', width);
    this.printCentered('SYSTEM MONITORING DASHBOARD', width);
    this.printCentered(data.timestamp.toLocaleString(), width);
    this.printLine('═', width);

    console.log('');

    // System Info
    console.log('📋 SYSTEM INFO');
    this.printLine('─', width);
    console.log(`   Hostname: ${data.system.hostname}`);
    console.log(`   Platform: ${data.system.platform}`);
    console.log(`   Uptime:   ${this.formatUptime(data.system.uptime)}`);
    console.log('');

    // CPU Info
    console.log('💻 CPU');
    this.printLine('─', width);
    console.log(`   Model:  ${data.cpu.model.substring(0, 45)}...`);
    console.log(`   Cores:  ${data.cpu.count}`);
    console.log(`   Speed:  ${data.cpu.speed} MHz`);
    console.log('');

    // Memory
    console.log('🧠 MEMORY');
    this.printLine('─', width);
    const memPercent = data.memory.usagePercent;
    const memBar = this.createBar(memPercent, 40);
    const memStatus = this.getStatusEmoji(memPercent);

    console.log(`   Total:  ${this.formatBytes(data.memory.total)}`);
    console.log(`   Free:   ${this.formatBytes(data.memory.free)}`);
    console.log(`   Used:   ${this.formatBytes(data.memory.used)}`);
    console.log(`   Usage:  ${memBar} ${memPercent.toFixed(1)}% ${memStatus}`);
    console.log('');

    // Load Average (if available)
    if (data.load) {
      console.log('📊 LOAD AVERAGE');
      this.printLine('─', width);
      console.log(`    1 min:  ${data.load[0].toFixed(2)}`);
      console.log(`    5 min:  ${data.load[1].toFixed(2)}`);
      console.log(`   15 min:  ${data.load[2].toFixed(2)}`);
      console.log('');
    }

    // Network
    console.log('🌐 NETWORK');
    this.printLine('─', width);
    console.log(`   IPv4 Interfaces: ${data.network.externalIPv4}`);
    console.log(`   IPv6 Interfaces: ${data.network.externalIPv6}`);
    console.log('');

    // Footer
    this.printLine('═', width);
    console.log(`   Refresh: every ${this.refreshInterval / 1000}s | Press Ctrl+C to exit`);
    this.printLine('═', width);
  }

  createBar(percent, width) {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;

    let bar = '[';
    bar += '█'.repeat(filled);
    bar += '░'.repeat(empty);
    bar += ']';

    return bar;
  }

  getStatusEmoji(percent) {
    if (percent >= 90) return '🔴';
    if (percent >= 75) return '🟡';
    return '🟢';
  }

  formatBytes(bytes) {
    const gb = (bytes / 1024 / 1024 / 1024);
    return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '0m';
  }

  printLine(char, width) {
    console.log(char.repeat(width));
  }

  printCentered(text, width) {
    const padding = Math.floor((width - text.length) / 2);
    console.log(' '.repeat(padding) + text);
  }
}

// Create dashboard
const dashboard = new MonitoringDashboard(2000);

// Start dashboard
dashboard.start();

// Stop after 20 seconds (for demo purposes)
setTimeout(() => {
  dashboard.stop();
  console.log('\n✓ Dashboard stopped');
  process.exit(0);
}, 20000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  dashboard.stop();
  console.log('\n✓ Dashboard stopped');
  process.exit(0);
});
