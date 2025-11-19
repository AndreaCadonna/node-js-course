/**
 * Exercise 5: Process Monitor
 *
 * OBJECTIVE:
 * Build a real-time process monitoring tool that tracks and displays process metrics over time.
 *
 * REQUIREMENTS:
 * 1. Monitor memory usage and CPU usage in real-time
 * 2. Update display at regular intervals (e.g., every 1 second)
 * 3. Calculate and display rate of change for metrics
 * 4. Implement graceful shutdown on SIGINT (Ctrl+C)
 * 5. Display statistics summary on exit
 * 6. Clear and redraw the terminal display for real-time updates
 *
 * LEARNING GOALS:
 * - Using setInterval for periodic tasks
 * - Working with process.memoryUsage() and process.cpuUsage()
 * - Handling process signals (SIGINT, SIGTERM)
 * - Calculating deltas and rates
 * - Terminal control and formatting
 * - Cleanup and graceful shutdown
 */

// Monitoring state
let stats = {
  samples: 0,
  startTime: null,
  lastCpuUsage: null,
  lastMemoryUsage: null,
  peakMemory: 0,
  totalCpuUser: 0,
  totalCpuSystem: 0,
  history: []
};

/**
 * TODO 1: Implement function to clear terminal and move cursor to top
 *
 * Steps:
 * 1. Write ANSI escape codes to clear screen
 * 2. Move cursor to home position (0,0)
 * 3. Use process.stdout.write()
 *
 * ANSI codes:
 * - '\x1Bc' - Clear entire screen
 * - '\x1B[H' - Move cursor to home
 * Or use: '\x1B[2J\x1B[H'
 */
function clearScreen() {
  // Your code here
}

/**
 * TODO 2: Implement function to format bytes to human-readable format
 *
 * Steps:
 * 1. Take bytes as parameter
 * 2. Convert to appropriate unit (B, KB, MB, GB)
 * 3. Return formatted string with unit
 * 4. Use 2 decimal places
 *
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  // Your code here
}

/**
 * TODO 3: Implement function to format time duration
 *
 * Steps:
 * 1. Take seconds as parameter
 * 2. Convert to hours, minutes, seconds
 * 3. Return formatted string (HH:MM:SS)
 *
 * @param {number} seconds - Seconds to format
 * @returns {string} Formatted time string
 */
function formatDuration(seconds) {
  // Your code here
}

/**
 * TODO 4: Implement function to get current memory snapshot
 *
 * Steps:
 * 1. Get memory usage from process.memoryUsage()
 * 2. Extract rss, heapTotal, heapUsed, external
 * 3. Calculate total memory (rss)
 * 4. Return object with memory values
 *
 * @returns {Object} Memory snapshot
 */
function getMemorySnapshot() {
  // Your code here
  // Return: { rss, heapTotal, heapUsed, external }
}

/**
 * TODO 5: Implement function to get current CPU snapshot
 *
 * Steps:
 * 1. Get CPU usage from process.cpuUsage()
 * 2. If lastCpuUsage exists, calculate delta
 * 3. Convert microseconds to milliseconds
 * 4. Return object with user and system time
 *
 * @returns {Object} CPU snapshot { user, system }
 */
function getCPUSnapshot() {
  // Your code here
}

/**
 * TODO 6: Implement function to collect and store metrics
 *
 * Steps:
 * 1. Get current memory snapshot
 * 2. Get current CPU snapshot
 * 3. Update peak memory if current is higher
 * 4. Store in history array (keep last 60 samples)
 * 5. Update totals for averages
 * 6. Increment sample count
 * 7. Update last usage values for next delta calculation
 */
function collectMetrics() {
  // Your code here
}

/**
 * TODO 7: Implement function to display current metrics
 *
 * Steps:
 * 1. Clear screen
 * 2. Display header with title and timestamp
 * 3. Display current memory usage (all metrics)
 * 4. Display current CPU usage
 * 5. Display peak memory seen
 * 6. Display uptime and sample count
 * 7. If history available, show trend (increasing/decreasing)
 * 8. Format nicely with alignment and colors (optional)
 *
 * Use Unicode symbols for visual appeal:
 * - ▲ for increasing
 * - ▼ for decreasing
 * - ● for current value
 */
function displayMetrics() {
  // Your code here
}

/**
 * TODO 8: Implement function to display final statistics
 *
 * Steps:
 * 1. Calculate total runtime
 * 2. Calculate average memory usage
 * 3. Calculate average CPU usage
 * 4. Display summary with:
 *    - Total samples collected
 *    - Total runtime
 *    - Peak memory
 *    - Average memory
 *    - Average CPU usage
 * 5. Thank user for using the tool
 */
function displaySummary() {
  console.log('\n\n=== Process Monitoring Summary ===\n');
  // Your code here
}

/**
 * TODO 9: Implement graceful shutdown handler
 *
 * Steps:
 * 1. Stop the monitoring interval
 * 2. Clear the screen
 * 3. Display final statistics
 * 4. Display goodbye message
 * 5. Exit with code 0
 */
function shutdown() {
  // Your code here
}

/**
 * TODO 10: Implement main function to start monitoring
 *
 * Steps:
 * 1. Initialize start time
 * 2. Display welcome message
 * 3. Register signal handlers for SIGINT and SIGTERM
 * 4. Take initial CPU measurement for delta calculation
 * 5. Set up interval to collect and display metrics (1000ms)
 * 6. Store interval ID for cleanup
 *
 * Hint: process.on('SIGINT', handler) for Ctrl+C
 */
let monitorInterval = null;

function startMonitoring() {
  console.log('=== Process Monitor ===');
  console.log('Press Ctrl+C to stop monitoring\n');

  // Your code here
  // Initialize stats.startTime
  // Set stats.lastCpuUsage = process.cpuUsage()
  // Register signal handlers
  // Start interval
}

// TODO 11: Run the monitor
// Call startMonitoring to begin

// Add a small delay before starting to let user see the welcome message
setTimeout(() => {
  // Call your function here
}, 1000);

// Hint: You can test with memory-intensive operations:
// const arr = [];
// setInterval(() => arr.push(new Array(1000000)), 100);
