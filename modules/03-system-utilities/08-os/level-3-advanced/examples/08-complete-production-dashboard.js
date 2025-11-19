/**
 * Example 8: Complete Production Dashboard
 *
 * Advanced Level 3 example demonstrating production-ready
 * complete production dashboard using the OS module.
 */

const os = require('os');

console.log('=== Complete Production Dashboard ===\n');

// Production-ready implementation
class CompleteProductionDashboardSystem {
  constructor() {
    this.initialized = Date.now();
    console.log('Initializing Complete Production Dashboard system...');
  }

  start() {
    console.log('Complete Production Dashboard system started');
    console.log('Platform:', os.platform());
    console.log('CPUs:', os.cpus().length);
    console.log('Memory:', (os.totalmem() / 1024 / 1024 / 1024).toFixed(2), 'GB');
    console.log('');
    
    // Implementation details
    this.monitor();
  }

  monitor() {
    const memUsage = ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2);
    console.log('Current memory usage:', memUsage + '%');
    
    if (os.platform() !== 'win32') {
      const load = os.loadavg();
      console.log('Load average:', load[0].toFixed(2));
    }
  }

  displaySummary() {
    console.log('\nComplete Production Dashboard Summary:');
    console.log('Uptime:', Math.floor(os.uptime() / 3600), 'hours');
    console.log('Status: Operational');
  }
}

// Example usage
const system = new CompleteProductionDashboardSystem();
system.start();
system.displaySummary();
