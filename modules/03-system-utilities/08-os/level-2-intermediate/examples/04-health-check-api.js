/**
 * Example 4: Health Check API
 *
 * This example demonstrates how to create a comprehensive
 * health check endpoint for monitoring applications.
 */

const os = require('os');

console.log('=== Health Check API Example ===\n');

/**
 * Health Check System
 * Returns comprehensive system health information
 */
class HealthCheck {
  constructor() {
    this.thresholds = {
      memory: {
        warning: 75,
        critical: 90
      },
      load: {
        warning: 0.7,  // 70% of CPU count
        critical: 1.0  // 100% of CPU count
      }
    };
  }

  /**
   * Perform complete health check
   */
  check() {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {},
      metrics: {}
    };

    // Memory check
    checks.checks.memory = this.checkMemory();

    // CPU check
    checks.checks.cpu = this.checkCPU();

    // Uptime check
    checks.checks.uptime = this.checkUptime();

    // Load average check (Unix-like only)
    if (os.platform() !== 'win32') {
      checks.checks.load = this.checkLoad();
    }

    // Network check
    checks.checks.network = this.checkNetwork();

    // Add metrics
    checks.metrics = this.getMetrics();

    // Determine overall status
    checks.status = this.determineOverallStatus(checks.checks);

    return checks;
  }

  checkMemory() {
    const total = os.totalmem();
    const free = os.freemem();
    const usagePercent = ((total - free) / total) * 100;

    let status = 'pass';
    let message = 'Memory usage is healthy';

    if (usagePercent >= this.thresholds.memory.critical) {
      status = 'fail';
      message = 'Memory usage is critical';
    } else if (usagePercent >= this.thresholds.memory.warning) {
      status = 'warn';
      message = 'Memory usage is high';
    }

    return {
      status,
      message,
      usage: `${usagePercent.toFixed(2)}%`,
      total: this.formatBytes(total),
      free: this.formatBytes(free)
    };
  }

  checkCPU() {
    const cpus = os.cpus();
    const count = cpus.length;

    return {
      status: 'pass',
      message: `${count} CPU core${count > 1 ? 's' : ''} available`,
      count,
      model: cpus[0].model,
      speed: `${cpus[0].speed} MHz`
    };
  }

  checkUptime() {
    const uptime = os.uptime();
    const days = Math.floor(uptime / 86400);

    let status = 'pass';
    let message = 'System uptime is healthy';

    if (days > 90) {
      status = 'warn';
      message = 'System has been running for a very long time';
    }

    return {
      status,
      message,
      uptime: this.formatUptime(uptime),
      days
    };
  }

  checkLoad() {
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    const normalized = loadAvg[0] / cpuCount;

    let status = 'pass';
    let message = 'System load is healthy';

    if (normalized >= this.thresholds.load.critical) {
      status = 'fail';
      message = 'System load is critical';
    } else if (normalized >= this.thresholds.load.warning) {
      status = 'warn';
      message = 'System load is high';
    }

    return {
      status,
      message,
      load: loadAvg[0].toFixed(2),
      normalized: normalized.toFixed(2),
      cpuCount
    };
  }

  checkNetwork() {
    const interfaces = os.networkInterfaces();
    let externalCount = 0;

    for (const addrs of Object.values(interfaces)) {
      for (const addr of addrs) {
        if (!addr.internal && addr.family === 'IPv4') {
          externalCount++;
        }
      }
    }

    return {
      status: externalCount > 0 ? 'pass' : 'warn',
      message: externalCount > 0 ? 'Network interfaces available' : 'No external network interfaces found',
      externalInterfaces: externalCount
    };
  }

  getMetrics() {
    const total = os.totalmem();
    const free = os.freemem();

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: {
        total: total,
        free: free,
        used: total - free,
        usagePercent: ((total - free) / total) * 100
      },
      uptime: os.uptime(),
      loadavg: os.platform() !== 'win32' ? os.loadavg() : null
    };
  }

  determineOverallStatus(checks) {
    const statuses = Object.values(checks).map(c => c.status);

    if (statuses.includes('fail')) {
      return 'unhealthy';
    } else if (statuses.includes('warn')) {
      return 'degraded';
    }
    return 'healthy';
  }

  formatBytes(bytes) {
    const gb = (bytes / 1024 / 1024 / 1024).toFixed(2);
    return `${gb} GB`;
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  /**
   * Get health check in different formats
   */
  toJSON() {
    return this.check();
  }

  toString() {
    const health = this.check();
    let output = `Health Status: ${health.status.toUpperCase()}\n\n`;

    for (const [name, check] of Object.entries(health.checks)) {
      const emoji = check.status === 'pass' ? '✅' :
                    check.status === 'warn' ? '⚠️ ' : '🔴';
      output += `${emoji} ${name}: ${check.message}\n`;
    }

    return output;
  }
}

// Example usage
console.log('Creating health check system...\n');

const healthCheck = new HealthCheck();

// Perform health check
const result = healthCheck.check();

// Display as string
console.log(healthCheck.toString());

// Display as JSON
console.log('JSON Output:');
console.log(JSON.stringify(result, null, 2));

// Simulate HTTP endpoint
console.log('\n=== Simulated HTTP Response ===\n');
const httpResponse = {
  status: result.status === 'healthy' ? 200 : result.status === 'degraded' ? 503 : 503,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  },
  body: result
};

console.log('HTTP Status:', httpResponse.status);
console.log('Headers:', httpResponse.headers);
console.log('Body:', JSON.stringify(httpResponse.body, null, 2));
