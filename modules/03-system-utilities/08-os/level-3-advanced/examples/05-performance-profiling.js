/**
 * Example 5: Performance Profiling
 *
 * Advanced Level 3 example demonstrating production-ready
 * performance profiling using the OS module.
 */

const os = require('os');

console.log('=== Performance Profiling ===\n');

// Production-ready implementation
class PerformanceProfilingSystem {
  constructor() {
    this.initialized = Date.now();
    console.log('Initializing Performance Profiling system...');
  }

  start() {
    console.log('Performance Profiling system started');
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
    console.log('\nPerformance Profiling Summary:');
    console.log('Uptime:', Math.floor(os.uptime() / 3600), 'hours');
    console.log('Status: Operational');
  }
}

// Example usage
const system = new PerformanceProfilingSystem();
system.start();
system.displaySummary();
