/**
 * Solution: Exercise 2 - Memory Monitor
 */

const os = require('os');

// Configuration
const CHECK_INTERVAL = 3000; // 3 seconds
const DURATION = 30000; // 30 seconds
const WARNING_THRESHOLD = 75; // 75%
const CRITICAL_THRESHOLD = 90; // 90%

// Helper function to create progress bar
function createProgressBar(percent, width = 40) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return '[' + '='.repeat(filled) + '░'.repeat(empty) + ']';
}

// Helper function to get memory info
function getMemoryInfo() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usagePercent = (used / total) * 100;

  return {
    totalGB: (total / 1024 ** 3).toFixed(2),
    freeGB: (free / 1024 ** 3).toFixed(2),
    usedGB: (used / 1024 ** 3).toFixed(2),
    usagePercent: usagePercent
  };
}

// Helper function to check and log memory
function checkMemory() {
  const timestamp = new Date().toLocaleTimeString();
  const memInfo = getMemoryInfo();
  const percent = memInfo.usagePercent;

  // Check for alerts
  if (percent >= CRITICAL_THRESHOLD) {
    console.error(`[${timestamp}] 🔴 CRITICAL: Memory usage critical!`);
  } else if (percent >= WARNING_THRESHOLD) {
    console.warn(`[${timestamp}] ⚠️  WARNING: Memory usage high!`);
  }

  // Display memory status
  const bar = createProgressBar(percent);
  console.log(`[${timestamp}] Memory: ${bar} ${percent.toFixed(2)}%`);

  return percent;
}

// Main monitoring function
function startMonitoring() {
  console.log('Starting memory monitor for 30 seconds...\n');

  // Check immediately
  checkMemory();

  // Set up interval
  const intervalId = setInterval(() => {
    checkMemory();
  }, CHECK_INTERVAL);

  // Stop after duration
  setTimeout(() => {
    clearInterval(intervalId);
    console.log('\nMonitoring stopped.');
  }, DURATION);
}

// Start the monitor
startMonitoring();
