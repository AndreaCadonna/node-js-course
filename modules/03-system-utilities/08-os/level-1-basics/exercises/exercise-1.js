/**
 * Exercise 1: System Information Display
 *
 * Create a script that displays comprehensive system information
 * in a formatted and easy-to-read way.
 *
 * Requirements:
 * 1. Display platform, architecture, and hostname
 * 2. Show total and free memory in GB (formatted to 2 decimal places)
 * 3. Display CPU count and model
 * 4. Show system uptime in a human-readable format
 * 5. Display user information
 * 6. Format the output in a clean, organized manner
 *
 * Expected Output Format:
 * ╔═══════════════════════════════╗
 * ║    SYSTEM INFORMATION         ║
 * ╚═══════════════════════════════╝
 *
 * Platform: linux
 * Architecture: x64
 * Hostname: mycomputer
 *
 * Memory:
 *   Total: 16.00 GB
 *   Free: 8.45 GB
 *
 * CPU:
 *   Model: Intel(R) Core(TM) i7
 *   Cores: 8
 *
 * Uptime: 5 days, 3 hours, 24 minutes
 *
 * User: username
 * Home: /home/username
 */

const os = require('os');

// TODO: Implement the solution here

// Helper function to convert bytes to GB
function bytesToGB(bytes) {
  // TODO: Implement this function
}

// Helper function to format uptime
function formatUptime(seconds) {
  // TODO: Implement this function
}

// Main function to display system info
function displaySystemInfo() {
  // TODO: Implement this function
}

// Run the display function
displaySystemInfo();
