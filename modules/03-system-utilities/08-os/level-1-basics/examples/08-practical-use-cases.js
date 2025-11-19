/**
 * Example 8: Practical Use Cases
 *
 * This example demonstrates practical applications of the OS module
 * in real-world scenarios.
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

console.log('=== Practical Use Case Examples ===\n');

// Use Case 1: Environment Detection
console.log('1. ENVIRONMENT DETECTION\n');

function detectEnvironment() {
  const env = {
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
    platform: os.platform(),
    isWindows: os.platform() === 'win32',
    isMac: os.platform() === 'darwin',
    isLinux: os.platform() === 'linux',
    cpuCores: os.cpus().length,
    totalMemoryGB: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
    architecture: os.arch()
  };

  return env;
}

const environment = detectEnvironment();
console.log('Environment:', environment);
console.log('');

// Use Case 2: Resource-Based Configuration
console.log('2. RESOURCE-BASED CONFIGURATION\n');

function getOptimalConfiguration() {
  const totalMemoryGB = os.totalmem() / (1024 ** 3);
  const cpuCount = os.cpus().length;

  const config = {
    workers: 1,
    cacheSize: '100MB',
    maxConcurrentConnections: 100,
    useCluster: false
  };

  // Adjust based on available resources
  if (totalMemoryGB >= 16 && cpuCount >= 8) {
    config.workers = cpuCount - 1;
    config.cacheSize = '1GB';
    config.maxConcurrentConnections = 1000;
    config.useCluster = true;
  } else if (totalMemoryGB >= 8 && cpuCount >= 4) {
    config.workers = Math.floor(cpuCount / 2);
    config.cacheSize = '500MB';
    config.maxConcurrentConnections = 500;
    config.useCluster = true;
  } else if (totalMemoryGB >= 4 && cpuCount >= 2) {
    config.workers = 2;
    config.cacheSize = '250MB';
    config.maxConcurrentConnections = 250;
  }

  return config;
}

const config = getOptimalConfiguration();
console.log('Optimal Configuration:', config);
console.log('');

// Use Case 3: System Health Check
console.log('3. SYSTEM HEALTH CHECK\n');

function performHealthCheck() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;

  const health = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      memory: {
        passed: memUsagePercent < 85,
        usage: memUsagePercent.toFixed(2) + '%',
        message: memUsagePercent < 85 ? 'OK' : 'High memory usage'
      },
      uptime: {
        passed: true,
        value: Math.floor(os.uptime() / 3600) + ' hours',
        message: 'System is running'
      },
      platform: {
        passed: true,
        value: os.platform(),
        message: 'Platform supported'
      }
    }
  };

  // Determine overall status
  const allChecksPassed = Object.values(health.checks).every(check => check.passed);
  health.status = allChecksPassed ? 'healthy' : 'warning';

  return health;
}

const healthCheck = performHealthCheck();
console.log('Health Check Results:');
console.log(JSON.stringify(healthCheck, null, 2));
console.log('');

// Use Case 4: Cross-Platform File Paths
console.log('4. CROSS-PLATFORM FILE PATHS\n');

function getAppPaths(appName) {
  const platform = os.platform();
  const home = os.homedir();
  const temp = os.tmpdir();

  let configDir, dataDir, logDir, cacheDir;

  switch (platform) {
    case 'win32':
      configDir = path.join(process.env.APPDATA || home, appName);
      dataDir = path.join(process.env.LOCALAPPDATA || home, appName, 'data');
      logDir = path.join(process.env.LOCALAPPDATA || home, appName, 'logs');
      cacheDir = path.join(process.env.LOCALAPPDATA || home, appName, 'cache');
      break;

    case 'darwin':
      configDir = path.join(home, 'Library', 'Application Support', appName);
      dataDir = path.join(home, 'Library', 'Application Support', appName, 'data');
      logDir = path.join(home, 'Library', 'Logs', appName);
      cacheDir = path.join(home, 'Library', 'Caches', appName);
      break;

    case 'linux':
    default:
      configDir = path.join(home, '.config', appName);
      dataDir = path.join(home, '.local', 'share', appName);
      logDir = path.join(home, '.local', 'share', appName, 'logs');
      cacheDir = path.join(home, '.cache', appName);
      break;
  }

  return {
    config: configDir,
    data: dataDir,
    logs: logDir,
    cache: cacheDir,
    temp: path.join(temp, appName)
  };
}

const appPaths = getAppPaths('myapp');
console.log('Application Paths:');
console.log(appPaths);
console.log('');

// Use Case 5: Performance Monitoring Setup
console.log('5. PERFORMANCE MONITORING SETUP\n');

class SystemMonitor {
  constructor(interval = 5000) {
    this.interval = interval;
    this.measurements = [];
  }

  start() {
    console.log('Starting system monitor...');
    this.timer = setInterval(() => {
      this.measure();
    }, this.interval);

    // Take first measurement
    this.measure();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      console.log('System monitor stopped');
    }
  }

  measure() {
    const measurement = {
      timestamp: new Date().toISOString(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      uptime: os.uptime(),
      platform: os.platform()
    };

    this.measurements.push(measurement);

    // Keep only last 10 measurements
    if (this.measurements.length > 10) {
      this.measurements.shift();
    }

    console.log('Measurement:', {
      time: measurement.timestamp,
      memoryUsage: measurement.memory.usagePercent + '%'
    });

    return measurement;
  }

  getStats() {
    if (this.measurements.length === 0) {
      return null;
    }

    const latest = this.measurements[this.measurements.length - 1];
    return {
      latest,
      count: this.measurements.length
    };
  }
}

// Demo the monitor (will take one measurement and stop)
const monitor = new SystemMonitor(5000);
console.log('Taking one measurement:');
monitor.measure();
console.log('');

// Use Case 6: Adaptive Processing
console.log('6. ADAPTIVE PROCESSING STRATEGY\n');

function chooseProcessingStrategy(dataSize) {
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;

  let strategy = {
    method: '',
    reason: ''
  };

  // If data fits comfortably in memory and memory usage is low
  if (dataSize < freeMem * 0.5 && memUsagePercent < 70) {
    strategy.method = 'in-memory';
    strategy.reason = 'Sufficient memory available for fast processing';
  }
  // If data is moderate and memory is available
  else if (dataSize < freeMem * 0.8 && memUsagePercent < 85) {
    strategy.method = 'buffered';
    strategy.reason = 'Process in chunks to balance speed and memory';
  }
  // If memory is tight or data is large
  else {
    strategy.method = 'streaming';
    strategy.reason = 'Use streaming to minimize memory footprint';
  }

  return strategy;
}

// Example: 500MB file
const fileSize = 500 * 1024 * 1024;
const strategy = chooseProcessingStrategy(fileSize);
console.log('Processing Strategy for 500MB file:');
console.log('Method:', strategy.method);
console.log('Reason:', strategy.reason);
console.log('');

// Use Case 7: System Requirements Check
console.log('7. SYSTEM REQUIREMENTS CHECK\n');

function checkSystemRequirements(requirements) {
  const results = {
    met: true,
    checks: []
  };

  // Check minimum memory
  if (requirements.minMemoryGB) {
    const totalMemGB = os.totalmem() / (1024 ** 3);
    const memCheck = {
      requirement: `Minimum ${requirements.minMemoryGB}GB RAM`,
      actual: `${totalMemGB.toFixed(2)}GB`,
      passed: totalMemGB >= requirements.minMemoryGB
    };
    results.checks.push(memCheck);
    if (!memCheck.passed) results.met = false;
  }

  // Check minimum CPU cores
  if (requirements.minCPUCores) {
    const cpuCores = os.cpus().length;
    const cpuCheck = {
      requirement: `Minimum ${requirements.minCPUCores} CPU cores`,
      actual: `${cpuCores} cores`,
      passed: cpuCores >= requirements.minCPUCores
    };
    results.checks.push(cpuCheck);
    if (!cpuCheck.passed) results.met = false;
  }

  // Check platform
  if (requirements.platforms) {
    const platform = os.platform();
    const platformCheck = {
      requirement: `Platform: ${requirements.platforms.join(' or ')}`,
      actual: platform,
      passed: requirements.platforms.includes(platform)
    };
    results.checks.push(platformCheck);
    if (!platformCheck.passed) results.met = false;
  }

  return results;
}

const requirements = {
  minMemoryGB: 4,
  minCPUCores: 2,
  platforms: ['linux', 'darwin', 'win32']
};

const reqCheck = checkSystemRequirements(requirements);
console.log('System Requirements Check:');
console.log('Overall:', reqCheck.met ? '✅ Met' : '❌ Not Met');
reqCheck.checks.forEach(check => {
  console.log(`  ${check.passed ? '✅' : '❌'} ${check.requirement}`);
  console.log(`     Actual: ${check.actual}`);
});

console.log('\n=== End of Practical Examples ===');
