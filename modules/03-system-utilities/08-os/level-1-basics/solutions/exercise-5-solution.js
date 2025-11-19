/**
 * Solution: Exercise 5 - System Health Checker
 */

const os = require('os');

// Minimum requirements
const REQUIREMENTS = {
  minMemoryGB: 4,
  minCPUCores: 2,
  supportedPlatforms: ['linux', 'darwin', 'win32']
};

// Thresholds
const THRESHOLDS = {
  memoryWarning: 75,
  memoryCritical: 90,
  uptimeWarningDays: 30
};

// Check memory
function checkMemory() {
  const total = os.totalmem();
  const free = os.freemem();
  const percent = ((total - free) / total) * 100;

  let status = 'ok';
  let message = `${percent.toFixed(2)}% - OK`;

  if (percent >= THRESHOLDS.memoryCritical) {
    status = 'critical';
    message = `${percent.toFixed(2)}% - CRITICAL`;
  } else if (percent >= THRESHOLDS.memoryWarning) {
    status = 'warning';
    message = `${percent.toFixed(2)}% - High usage`;
  }

  return { name: 'Memory Usage', status, message, percent };
}

// Check uptime
function checkUptime() {
  const uptimeSec = os.uptime();
  const days = Math.floor(uptimeSec / 86400);

  let status = 'ok';
  let message = `${days} days - OK`;

  if (days > THRESHOLDS.uptimeWarningDays) {
    status = 'warning';
    message = `${days} days - Long uptime detected`;
  }

  return { name: 'System Uptime', status, message, days };
}

// Check system requirements
function checkRequirements() {
  const checks = [];
  const cpuCount = os.cpus().length;
  const memoryGB = os.totalmem() / (1024 ** 3);
  const platform = os.platform();

  checks.push({
    name: 'CPU Cores',
    status: cpuCount >= REQUIREMENTS.minCPUCores ? 'ok' : 'critical',
    message: `${cpuCount} - ${cpuCount >= REQUIREMENTS.minCPUCores ? 'OK' : 'Insufficient'}`
  });

  checks.push({
    name: 'Total Memory',
    status: memoryGB >= REQUIREMENTS.minMemoryGB ? 'ok' : 'critical',
    message: `${memoryGB.toFixed(2)} GB - ${memoryGB >= REQUIREMENTS.minMemoryGB ? 'OK' : 'Insufficient'}`
  });

  checks.push({
    name: 'Platform',
    status: REQUIREMENTS.supportedPlatforms.includes(platform) ? 'ok' : 'warning',
    message: `${platform} - ${REQUIREMENTS.supportedPlatforms.includes(platform) ? 'Supported' : 'Not officially supported'}`
  });

  return checks;
}

// Get overall status
function getOverallStatus(allChecks) {
  const hasCritical = allChecks.some(c => c.status === 'critical');
  const hasWarning = allChecks.some(c => c.status === 'warning');

  if (hasCritical) return { status: 'CRITICAL', emoji: '🔴' };
  if (hasWarning) return { status: 'WARNING', emoji: '⚠️ ' };
  return { status: 'HEALTHY', emoji: '✅' };
}

// Generate recommendations
function getRecommendations(allChecks) {
  const recommendations = [];

  const uptimeCheck = allChecks.find(c => c.name === 'System Uptime');
  if (uptimeCheck && uptimeCheck.status === 'warning') {
    recommendations.push('Consider restarting system to apply updates');
    recommendations.push('Schedule regular maintenance windows');
  }

  const memCheck = allChecks.find(c => c.name === 'Memory Usage');
  if (memCheck && memCheck.status === 'critical') {
    recommendations.push('Free up memory by closing unused applications');
    recommendations.push('Consider upgrading system memory');
  } else if (memCheck && memCheck.status === 'warning') {
    recommendations.push('Monitor memory usage closely');
  }

  if (recommendations.length === 0) {
    recommendations.push('System is healthy - no action needed');
  }

  return recommendations;
}

// Main health check function
function performHealthCheck() {
  console.log('╔══════════════════════════════╗');
  console.log('║   SYSTEM HEALTH CHECK        ║');
  console.log('╚══════════════════════════════╝\n');

  const allChecks = [
    checkMemory(),
    checkUptime(),
    ...checkRequirements()
  ];

  const overall = getOverallStatus(allChecks);
  console.log(`Overall Status: ${overall.emoji} ${overall.status}\n`);

  console.log('Checks:');
  allChecks.forEach(check => {
    const emoji = check.status === 'ok' ? '✅' :
                  check.status === 'warning' ? '⚠️ ' : '🔴';
    console.log(`${emoji} ${check.name}: ${check.message}`);
  });

  const issues = allChecks.filter(c => c.status !== 'ok');
  if (issues.length > 0) {
    console.log('\nIssues:');
    issues.forEach(issue => {
      console.log(`  - ${issue.message.split('-')[1].trim()}`);
    });
  }

  const recommendations = getRecommendations(allChecks);
  console.log('\nRecommendations:');
  recommendations.forEach(rec => {
    console.log(`  - ${rec}`);
  });
}

// Run the health check
performHealthCheck();
