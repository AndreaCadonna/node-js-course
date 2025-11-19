/**
 * Example 2: Memory Information
 *
 * This example demonstrates how to retrieve and work with
 * system memory information.
 */

const os = require('os');

console.log('=== Memory Information ===\n');

// Get memory in bytes
const totalMem = os.totalmem();
const freeMem = os.freemem();
const usedMem = totalMem - freeMem;

console.log('Raw Memory Values (in bytes):');
console.log('Total Memory:', totalMem);
console.log('Free Memory:', freeMem);
console.log('Used Memory:', usedMem);

console.log('\n=== Human-Readable Format ===\n');

// Helper function to convert bytes to GB
function bytesToGB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

// Helper function to convert bytes to MB
function bytesToMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

// Display in GB
console.log('Memory in GB:');
console.log('Total:', bytesToGB(totalMem), 'GB');
console.log('Free:', bytesToGB(freeMem), 'GB');
console.log('Used:', bytesToGB(usedMem), 'GB');

// Display in MB
console.log('\nMemory in MB:');
console.log('Total:', bytesToMB(totalMem), 'MB');
console.log('Free:', bytesToMB(freeMem), 'MB');
console.log('Used:', bytesToMB(usedMem), 'MB');

console.log('\n=== Memory Usage Percentage ===\n');

// Calculate percentage
const usagePercent = (usedMem / totalMem) * 100;
const freePercent = (freeMem / totalMem) * 100;

console.log('Memory Usage:', usagePercent.toFixed(2) + '%');
console.log('Memory Free:', freePercent.toFixed(2) + '%');

// Visual representation
function createProgressBar(percent, width = 40) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return '[' + '='.repeat(filled) + ' '.repeat(empty) + ']';
}

console.log('\nMemory Usage:');
console.log(createProgressBar(usagePercent), usagePercent.toFixed(1) + '%');

console.log('\n=== Memory Status ===\n');

// Determine memory status
function getMemoryStatus() {
  const usagePercent = ((totalMem - freeMem) / totalMem) * 100;

  if (usagePercent > 90) {
    return { status: 'CRITICAL', emoji: '🔴', message: 'Memory critically low!' };
  } else if (usagePercent > 75) {
    return { status: 'WARNING', emoji: '🟡', message: 'Memory usage is high' };
  } else if (usagePercent > 50) {
    return { status: 'MODERATE', emoji: '🟢', message: 'Memory usage is moderate' };
  } else {
    return { status: 'HEALTHY', emoji: '✅', message: 'Memory usage is healthy' };
  }
}

const memStatus = getMemoryStatus();
console.log(memStatus.emoji, memStatus.status);
console.log(memStatus.message);

console.log('\n=== Memory Information Object ===\n');

// Create a comprehensive memory info object
const memoryInfo = {
  total: {
    bytes: totalMem,
    mb: bytesToMB(totalMem),
    gb: bytesToGB(totalMem)
  },
  free: {
    bytes: freeMem,
    mb: bytesToMB(freeMem),
    gb: bytesToGB(freeMem)
  },
  used: {
    bytes: usedMem,
    mb: bytesToMB(usedMem),
    gb: bytesToGB(usedMem)
  },
  usagePercent: usagePercent.toFixed(2),
  freePercent: freePercent.toFixed(2),
  status: memStatus.status
};

console.log(JSON.stringify(memoryInfo, null, 2));
