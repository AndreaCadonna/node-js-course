/**
 * Exercise 2: Memory Monitor
 *
 * Create a memory monitoring tool that tracks memory usage over time
 * and alerts when usage exceeds a threshold.
 *
 * Requirements:
 * 1. Check memory usage every 3 seconds
 * 2. Display memory usage percentage
 * 3. Show a visual progress bar (40 characters wide)
 * 4. Alert (console.warn) when usage exceeds 75%
 * 5. Critical alert (console.error) when usage exceeds 90%
 * 6. Run for 30 seconds then stop automatically
 * 7. Display timestamp with each check
 *
 * Expected Output:
 * [10:30:45] Memory: [================░░░░░░░░░░░░░░] 64.23%
 * [10:30:48] Memory: [=================░░░░░░░░░░░░░] 68.50%
 * [10:30:51] ⚠️  WARNING: Memory usage high!
 * [10:30:51] Memory: [=====================░░░░░░░░] 76.12%
 */

const os = require('os');

// Configuration
const CHECK_INTERVAL = 3000; // 3 seconds
const DURATION = 30000; // 30 seconds
const WARNING_THRESHOLD = 75; // 75%
const CRITICAL_THRESHOLD = 90; // 90%

// TODO: Implement the solution here

// Helper function to create progress bar
function createProgressBar(percent, width = 40) {
  // TODO: Implement this function
  // Should return something like: [========░░░░░░░░]
}

// Helper function to get memory info
function getMemoryInfo() {
  // TODO: Implement this function
  // Should return { totalGB, freeGB, usedGB, usagePercent }
}

// Helper function to check and log memory
function checkMemory() {
  // TODO: Implement this function
  // Should log memory status and return usage percentage
}

// Main monitoring function
function startMonitoring() {
  // TODO: Implement this function
  // Use setInterval to check memory every CHECK_INTERVAL
  // Use setTimeout to stop after DURATION
}

// Start the monitor
startMonitoring();
