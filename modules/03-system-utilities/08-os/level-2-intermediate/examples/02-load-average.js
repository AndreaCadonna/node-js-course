/**
 * Example 2: Load Average Monitoring
 *
 * This example demonstrates how to retrieve and interpret
 * system load average (Unix-like systems only).
 */

const os = require('os');

console.log('=== Load Average ===\n');

// Check if load average is available
const platform = os.platform();
if (platform === 'win32') {
  console.log('⚠️  Load average is not available on Windows');
  console.log('This feature is only available on Unix-like systems (Linux, macOS)');
  process.exit(0);
}

// Get load average
const loadAvg = os.loadavg();

console.log('Load Average:');
console.log('  1 minute :', loadAvg[0].toFixed(2));
console.log('  5 minutes:', loadAvg[1].toFixed(2));
console.log(' 15 minutes:', loadAvg[2].toFixed(2));

console.log('\n=== Load Average Interpretation ===\n');

// Interpret load average
const cpuCount = os.cpus().length;

console.log('CPU Cores:', cpuCount);
console.log('');

function interpretLoad(load, cpuCount) {
  const normalized = load / cpuCount;

  if (normalized < 0.5) {
    return { status: 'Low', emoji: '✅', message: 'System is underutilized' };
  } else if (normalized < 0.7) {
    return { status: 'Normal', emoji: '🟢', message: 'System load is healthy' };
  } else if (normalized < 1.0) {
    return { status: 'High', emoji: '🟡', message: 'System is busy' };
  } else {
    return { status: 'Critical', emoji: '🔴', message: 'System is overloaded' };
  }
}

console.log('1-minute load analysis:');
const load1 = interpretLoad(loadAvg[0], cpuCount);
console.log(`  ${load1.emoji} ${load1.status}: ${loadAvg[0].toFixed(2)} / ${cpuCount} CPUs = ${(loadAvg[0] / cpuCount).toFixed(2)}`);
console.log(`  ${load1.message}`);

console.log('\n5-minute load analysis:');
const load5 = interpretLoad(loadAvg[1], cpuCount);
console.log(`  ${load5.emoji} ${load5.status}: ${loadAvg[1].toFixed(2)} / ${cpuCount} CPUs = ${(loadAvg[1] / cpuCount).toFixed(2)}`);
console.log(`  ${load5.message}`);

console.log('\n15-minute load analysis:');
const load15 = interpretLoad(loadAvg[2], cpuCount);
console.log(`  ${load15.emoji} ${load15.status}: ${loadAvg[2].toFixed(2)} / ${cpuCount} CPUs = ${(loadAvg[2] / cpuCount).toFixed(2)}`);
console.log(`  ${load15.message}`);

console.log('\n=== Load Trend Analysis ===\n');

// Analyze load trend
function analyzeLoadTrend(loadAvg) {
  const [load1, load5, load15] = loadAvg;

  if (load1 > load5 && load5 > load15) {
    return {
      trend: 'Increasing',
      emoji: '📈',
      message: 'Load is increasing - system getting busier'
    };
  } else if (load1 < load5 && load5 < load15) {
    return {
      trend: 'Decreasing',
      emoji: '📉',
      message: 'Load is decreasing - system getting quieter'
    };
  } else if (Math.abs(load1 - load15) < 0.1) {
    return {
      trend: 'Stable',
      emoji: '📊',
      message: 'Load is stable - consistent activity'
    };
  } else {
    return {
      trend: 'Fluctuating',
      emoji: '📊',
      message: 'Load is fluctuating - variable activity'
    };
  }
}

const trend = analyzeLoadTrend(loadAvg);
console.log(`Trend: ${trend.emoji} ${trend.trend}`);
console.log(trend.message);

console.log('\n=== Load Monitoring Recommendations ===\n');

// Provide recommendations
function getLoadRecommendations(loadAvg, cpuCount) {
  const recommendations = [];
  const normalized1 = loadAvg[0] / cpuCount;

  if (normalized1 > 1.0) {
    recommendations.push('System is overloaded - consider scaling up');
    recommendations.push('Check for resource-intensive processes');
    recommendations.push('Consider adding more CPU cores or instances');
  } else if (normalized1 > 0.8) {
    recommendations.push('System is running hot - monitor closely');
    recommendations.push('Prepare for potential scaling');
  } else if (normalized1 < 0.3) {
    recommendations.push('System has excess capacity');
    recommendations.push('Consider consolidating workloads');
  } else {
    recommendations.push('System load is optimal');
    recommendations.push('No action needed');
  }

  return recommendations;
}

const recommendations = getLoadRecommendations(loadAvg, cpuCount);
recommendations.forEach((rec, index) => {
  console.log(`${index + 1}. ${rec}`);
});
