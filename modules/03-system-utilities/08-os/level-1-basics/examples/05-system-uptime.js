/**
 * Example 5: System Uptime
 *
 * This example demonstrates how to retrieve and format
 * system uptime information.
 */

const os = require('os');

console.log('=== System Uptime ===\n');

// Get uptime in seconds
const uptimeSeconds = os.uptime();
console.log('System Uptime (seconds):', uptimeSeconds);
console.log('System Uptime (raw):', Math.floor(uptimeSeconds), 'seconds');

console.log('\n=== Formatted Uptime ===\n');

// Helper function to format seconds into readable time
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return {
    days,
    hours,
    minutes,
    seconds: secs,
    formatted: `${days}d ${hours}h ${minutes}m ${secs}s`
  };
}

const uptime = formatUptime(uptimeSeconds);
console.log('Days:', uptime.days);
console.log('Hours:', uptime.hours);
console.log('Minutes:', uptime.minutes);
console.log('Seconds:', uptime.seconds);
console.log('Formatted:', uptime.formatted);

console.log('\n=== Human-Readable Uptime ===\n');

// Create more human-friendly descriptions
function getHumanReadableUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];

  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  }
  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }

  return parts.join(', ');
}

console.log('Human-readable:', getHumanReadableUptime(uptimeSeconds));

console.log('\n=== Uptime Statistics ===\n');

// Calculate various uptime metrics
const uptimeMinutes = Math.floor(uptimeSeconds / 60);
const uptimeHours = Math.floor(uptimeSeconds / 3600);
const uptimeDays = Math.floor(uptimeSeconds / 86400);
const uptimeWeeks = Math.floor(uptimeSeconds / 604800);

console.log('Uptime in different units:');
console.log('Seconds:', Math.floor(uptimeSeconds));
console.log('Minutes:', uptimeMinutes);
console.log('Hours:', uptimeHours);
console.log('Days:', uptimeDays);
console.log('Weeks:', uptimeWeeks);

console.log('\n=== Last Boot Time ===\n');

// Calculate when the system was last booted
const now = new Date();
const bootTime = new Date(now.getTime() - (uptimeSeconds * 1000));

console.log('Current Time:', now.toLocaleString());
console.log('Last Boot Time:', bootTime.toLocaleString());
console.log('System has been running since:', bootTime.toDateString());

console.log('\n=== Process vs System Uptime ===\n');

// Compare Node.js process uptime with system uptime
const processUptime = process.uptime();

console.log('System Uptime:', formatUptime(uptimeSeconds).formatted);
console.log('Process Uptime:', formatUptime(processUptime).formatted);
console.log('System is', Math.floor(uptimeSeconds / processUptime), 'times older than this process');

console.log('\n=== Uptime Status ===\n');

// Determine uptime status
function getUptimeStatus(seconds) {
  const days = seconds / 86400;

  if (days < 1) {
    return {
      status: 'Recently Rebooted',
      emoji: '🔄',
      message: 'System was recently restarted'
    };
  } else if (days < 7) {
    return {
      status: 'Normal',
      emoji: '✅',
      message: 'System uptime is normal'
    };
  } else if (days < 30) {
    return {
      status: 'Long Uptime',
      emoji: '⏰',
      message: 'System has been running for a while'
    };
  } else {
    return {
      status: 'Very Long Uptime',
      emoji: '⚠️',
      message: 'Consider restarting to apply updates'
    };
  }
}

const status = getUptimeStatus(uptimeSeconds);
console.log(status.emoji, status.status);
console.log(status.message);

console.log('\n=== Uptime Summary ===\n');

// Create comprehensive uptime summary
const uptimeSummary = {
  raw: Math.floor(uptimeSeconds),
  formatted: uptime.formatted,
  humanReadable: getHumanReadableUptime(uptimeSeconds),
  breakdown: {
    days: uptime.days,
    hours: uptime.hours,
    minutes: uptime.minutes,
    seconds: uptime.seconds
  },
  lastBootTime: bootTime.toISOString(),
  status: status.status,
  processUptime: Math.floor(processUptime)
};

console.log('Uptime Summary:');
console.log(JSON.stringify(uptimeSummary, null, 2));
