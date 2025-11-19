/**
 * Solution: Exercise 4
 * Level 3 Advanced - OS Module
 * 
 * Production-ready implementation
 */

const os = require('os');

class ProductionSolution {
  constructor() {
    this.metrics = [];
    console.log('Production solution initialized');
  }

  start() {
    console.log('Monitoring started');
    this.collect();
  }

  collect() {
    const metric = {
      timestamp: Date.now(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      cpu: {
        count: os.cpus().length,
        load: os.platform() !== 'win32' ? os.loadavg()[0] : null
      }
    };

    this.metrics.push(metric);
    console.log('Metric collected:', metric.memory.usage + '% memory');
    
    return metric;
  }

  analyze() {
    if (this.metrics.length === 0) return null;

    const latest = this.metrics[this.metrics.length - 1];
    const memUsage = parseFloat(latest.memory.usage);

    return {
      status: memUsage < 75 ? 'healthy' : memUsage < 90 ? 'warning' : 'critical',
      metrics: latest
    };
  }
}

// Example usage
const solution = new ProductionSolution();
solution.start();
const analysis = solution.analyze();
console.log('Analysis:', analysis);
