/**
 * Example 7: Combined System Information
 *
 * This example demonstrates how to combine multiple OS methods
 * to create a comprehensive system information display.
 */

const os = require('os');

console.log('╔════════════════════════════════════════════════════╗');
console.log('║        SYSTEM INFORMATION REPORT                   ║');
console.log('╚════════════════════════════════════════════════════╝\n');

// Helper functions
function formatBytes(bytes) {
  const gb = (bytes / 1024 / 1024 / 1024).toFixed(2);
  const mb = (bytes / 1024 / 1024).toFixed(2);
  return bytes > 1024 * 1024 * 1024 ? `${gb} GB` : `${mb} MB`;
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

function getPlatformName(platform) {
  const names = {
    'win32': 'Windows',
    'darwin': 'macOS',
    'linux': 'Linux',
    'freebsd': 'FreeBSD',
    'openbsd': 'OpenBSD',
    'sunos': 'SunOS',
    'aix': 'AIX'
  };
  return names[platform] || platform;
}

// Collect all system information
const systemInfo = {
  // Operating System
  os: {
    platform: os.platform(),
    platformName: getPlatformName(os.platform()),
    type: os.type(),
    release: os.release(),
    architecture: os.arch(),
    endianness: os.endianness(),
    hostname: os.hostname()
  },

  // CPU Information
  cpu: {
    model: os.cpus()[0].model,
    speed: os.cpus()[0].speed + ' MHz',
    cores: os.cpus().length,
    architecture: os.arch()
  },

  // Memory Information
  memory: {
    total: os.totalmem(),
    free: os.freemem(),
    used: os.totalmem() - os.freemem(),
    usagePercent: (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2)
  },

  // User Information
  user: {
    username: os.userInfo().username,
    homedir: os.homedir(),
    shell: os.userInfo().shell || 'N/A'
  },

  // System Uptime
  uptime: {
    seconds: os.uptime(),
    formatted: formatUptime(os.uptime()),
    bootTime: new Date(Date.now() - os.uptime() * 1000)
  },

  // Directories
  directories: {
    home: os.homedir(),
    temp: os.tmpdir()
  }
};

// Display the report
console.log('─────────────────────────────────────────────────────');
console.log('📋 OPERATING SYSTEM');
console.log('─────────────────────────────────────────────────────');
console.log('Platform      :', systemInfo.os.platformName, `(${systemInfo.os.platform})`);
console.log('Type          :', systemInfo.os.type);
console.log('Release       :', systemInfo.os.release);
console.log('Architecture  :', systemInfo.os.architecture);
console.log('Endianness    :', systemInfo.os.endianness);
console.log('Hostname      :', systemInfo.os.hostname);

console.log('\n─────────────────────────────────────────────────────');
console.log('💻 CPU INFORMATION');
console.log('─────────────────────────────────────────────────────');
console.log('Model         :', systemInfo.cpu.model);
console.log('Speed         :', systemInfo.cpu.speed);
console.log('Cores         :', systemInfo.cpu.cores);
console.log('Architecture  :', systemInfo.cpu.architecture);

console.log('\n─────────────────────────────────────────────────────');
console.log('🧠 MEMORY INFORMATION');
console.log('─────────────────────────────────────────────────────');
console.log('Total         :', formatBytes(systemInfo.memory.total));
console.log('Free          :', formatBytes(systemInfo.memory.free));
console.log('Used          :', formatBytes(systemInfo.memory.used));
console.log('Usage         :', systemInfo.memory.usagePercent + '%');

// Memory usage bar
const memPercent = parseFloat(systemInfo.memory.usagePercent);
const barLength = 30;
const filled = Math.round((memPercent / 100) * barLength);
const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
console.log('              [' + bar + '] ' + memPercent.toFixed(1) + '%');

console.log('\n─────────────────────────────────────────────────────');
console.log('👤 USER INFORMATION');
console.log('─────────────────────────────────────────────────────');
console.log('Username      :', systemInfo.user.username);
console.log('Home Directory:', systemInfo.user.homedir);
console.log('Shell         :', systemInfo.user.shell);

console.log('\n─────────────────────────────────────────────────────');
console.log('⏰ SYSTEM UPTIME');
console.log('─────────────────────────────────────────────────────');
console.log('Uptime        :', systemInfo.uptime.formatted);
console.log('Last Boot     :', systemInfo.uptime.bootTime.toLocaleString());

console.log('\n─────────────────────────────────────────────────────');
console.log('📁 DIRECTORIES');
console.log('─────────────────────────────────────────────────────');
console.log('Home          :', systemInfo.directories.home);
console.log('Temp          :', systemInfo.directories.temp);

console.log('\n─────────────────────────────────────────────────────');
console.log('📊 SYSTEM HEALTH');
console.log('─────────────────────────────────────────────────────');

// Determine system health
const memUsage = parseFloat(systemInfo.memory.usagePercent);
const uptimeDays = Math.floor(systemInfo.uptime.seconds / 86400);

let healthStatus = '✅ Healthy';
let healthMessages = [];

if (memUsage > 90) {
  healthStatus = '🔴 Critical';
  healthMessages.push('Memory usage is critically high');
} else if (memUsage > 75) {
  healthStatus = '🟡 Warning';
  healthMessages.push('Memory usage is high');
}

if (uptimeDays > 30) {
  healthMessages.push('Long uptime - consider restarting for updates');
}

if (systemInfo.cpu.cores < 2) {
  healthMessages.push('Limited CPU cores - may affect multitasking');
}

console.log('Status        :', healthStatus);
if (healthMessages.length > 0) {
  healthMessages.forEach(msg => console.log('              -', msg));
} else {
  console.log('              - All systems operating normally');
}

console.log('\n─────────────────────────────────────────────────────');
console.log('💡 RECOMMENDATIONS');
console.log('─────────────────────────────────────────────────────');

// Provide recommendations
const recommendations = [];

if (systemInfo.cpu.cores >= 4) {
  recommendations.push('Multi-core CPU detected - suitable for parallel processing');
}

if (systemInfo.memory.total > 8 * 1024 * 1024 * 1024) {
  recommendations.push('Sufficient memory for running large applications');
} else if (systemInfo.memory.total < 4 * 1024 * 1024 * 1024) {
  recommendations.push('Limited memory - use streaming for large files');
}

if (systemInfo.os.platform === 'linux') {
  recommendations.push('Linux platform - optimized for server environments');
} else if (systemInfo.os.platform === 'darwin') {
  recommendations.push('macOS platform - optimized for development');
} else if (systemInfo.os.platform === 'win32') {
  recommendations.push('Windows platform - use cross-platform libraries');
}

recommendations.forEach((rec, index) => {
  console.log(`${index + 1}.`, rec);
});

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║              END OF REPORT                         ║');
console.log('╚════════════════════════════════════════════════════╝\n');

// Export as JSON option
console.log('💾 JSON Export Available:');
console.log('You can export this data as JSON for further processing');
console.log('Example: JSON.stringify(systemInfo, null, 2)');
