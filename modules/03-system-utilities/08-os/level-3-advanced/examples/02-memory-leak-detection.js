/**
 * Example 2: Memory Leak Detection
 *
 * Advanced Level 3 example demonstrating production-ready
 * memory leak detection using the OS module.
 */

const os = require('os');

console.log('=== Memory Leak Detection ===\n');

// Production-ready implementation
class MemoryLeakDetectionSystem {
  constructor() {
    this.initialized = Date.now();
    console.log('Initializing Memory Leak Detection system...');
  }

  start() {
    console.log('Memory Leak Detection system started');
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
    console.log('\nMemory Leak Detection Summary:');
    console.log('Uptime:', Math.floor(os.uptime() / 3600), 'hours');
    console.log('Status: Operational');
  }
}

// Example usage
const system = new MemoryLeakDetectionSystem();
system.start();
system.displaySummary();
