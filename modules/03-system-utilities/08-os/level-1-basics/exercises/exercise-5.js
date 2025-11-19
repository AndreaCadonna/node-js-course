/**
 * Exercise 5: System Health Checker
 *
 * Create a comprehensive system health check that evaluates
 * multiple system metrics and provides an overall health status.
 *
 * Requirements:
 * 1. Check memory usage (warn if > 75%, critical if > 90%)
 * 2. Check system uptime (warn if > 30 days)
 * 3. Check if system meets minimum requirements
 * 4. Provide overall health status (healthy, warning, critical)
 * 5. List all issues found
 * 6. Provide recommendations
 *
 * Expected Output:
 * ╔══════════════════════════════╗
 * ║   SYSTEM HEALTH CHECK        ║
 * ╚══════════════════════════════╝
 *
 * Overall Status: ⚠️  WARNING
 *
 * Checks:
 * ✅ Memory Usage: 64.23% - OK
 * ⚠️  System Uptime: 35 days - Long uptime detected
 * ✅ CPU Cores: 8 - OK
 * ✅ Total Memory: 16.00 GB - OK
 * ✅ Platform: linux - Supported
 *
 * Issues:
 * - System has been running for 35 days
 *
 * Recommendations:
 * - Consider restarting system to apply updates
 * - Schedule regular maintenance windows
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

// TODO: Implement the solution here

// Check memory
function checkMemory() {
  // TODO: Implement this function
  // Return { status: 'ok|warning|critical', message: '...', percent: 64.23 }
}

// Check uptime
function checkUptime() {
  // TODO: Implement this function
  // Return { status: 'ok|warning', message: '...', days: 35 }
}

// Check system requirements
function checkRequirements() {
  // TODO: Implement this function
  // Return array of check results
}

// Get overall status
function getOverallStatus(checks) {
  // TODO: Implement this function
}

// Generate recommendations
function getRecommendations(checks) {
  // TODO: Implement this function
}

// Main health check function
function performHealthCheck() {
  // TODO: Implement this function
}

// Run the health check
performHealthCheck();
