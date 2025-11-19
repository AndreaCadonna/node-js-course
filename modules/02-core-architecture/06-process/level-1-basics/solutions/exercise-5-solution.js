/**
 * SOLUTION: Exercise 5 - Process Monitor
 *
 * This solution demonstrates building a real-time process monitoring tool using
 * setInterval, process metrics, signal handling, and terminal manipulation.
 * It showcases advanced process monitoring techniques and graceful shutdown.
 *
 * KEY CONCEPTS DEMONSTRATED:
 * - Real-time monitoring with setInterval
 * - process.memoryUsage() for memory tracking
 * - process.cpuUsage() for CPU tracking with deltas
 * - Signal handling (SIGINT, SIGTERM)
 * - Terminal control with ANSI escape codes
 * - Statistical analysis (peaks, averages, trends)
 * - Graceful shutdown and cleanup
 *
 * PRODUCTION FEATURES:
 * - Real-time updating display
 * - Memory and CPU trend detection
 * - Peak value tracking
 * - Running averages
 * - Comprehensive final statistics
 * - Clean terminal manipulation
 * - Proper resource cleanup
 */

// Monitoring state
let stats = {
  samples: 0,
  startTime: null,
  lastCpuUsage: null,
  lastMemoryUsage: null,
  peakMemory: 0,
  totalMemory: 0,
  totalCpuUser: 0,
  totalCpuSystem: 0,
  history: [] // Keep last 60 samples for trend analysis
};

// Interval handle for cleanup
let monitorInterval = null;

/**
 * Clears the terminal screen and moves cursor to top-left
 *
 * Uses ANSI escape codes for terminal control:
 * - \x1B[2J: Clear entire screen
 * - \x1B[H: Move cursor to home position (0,0)
 */
function clearScreen() {
  process.stdout.write('\x1B[2J\x1B[H');
}

/**
 * Formats bytes to human-readable format with appropriate unit
 *
 * Automatically selects the best unit (B, KB, MB, GB) based on size.
 *
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Formatted string with unit
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  // Calculate which unit to use
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Convert to that unit
  const value = bytes / Math.pow(k, i);

  return `${value.toFixed(decimals)} ${sizes[i]}`;
}

/**
 * Formats duration in seconds to HH:MM:SS format
 *
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  // Pad with zeros for consistent formatting
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

/**
 * Gets current memory snapshot
 *
 * Returns all memory metrics from process.memoryUsage()
 *
 * @returns {Object} Memory snapshot with all metrics
 */
function getMemorySnapshot() {
  const mem = process.memoryUsage();

  return {
    rss: mem.rss,
    heapTotal: mem.heapTotal,
    heapUsed: mem.heapUsed,
    external: mem.external,
    arrayBuffers: mem.arrayBuffers || 0
  };
}

/**
 * Gets current CPU snapshot with delta from last measurement
 *
 * CPU usage is cumulative, so we need to calculate the delta
 * from the last measurement to get the usage since last check.
 *
 * @returns {Object} CPU snapshot with user and system time in milliseconds
 */
function getCPUSnapshot() {
  const current = process.cpuUsage();

  // If this is the first measurement, return zeros
  if (!stats.lastCpuUsage) {
    return {
      user: 0,
      system: 0
    };
  }

  // Calculate delta (difference from last measurement)
  const delta = process.cpuUsage(stats.lastCpuUsage);

  // Convert microseconds to milliseconds
  return {
    user: delta.user / 1000,
    system: delta.system / 1000
  };
}

/**
 * Collects metrics and updates statistics
 *
 * This function:
 * 1. Captures current memory and CPU metrics
 * 2. Updates peak values
 * 3. Stores in history (for trend analysis)
 * 4. Updates running totals (for averages)
 */
function collectMetrics() {
  // Get current snapshots
  const memory = getMemorySnapshot();
  const cpu = getCPUSnapshot();

  // Update peak memory
  if (memory.rss > stats.peakMemory) {
    stats.peakMemory = memory.rss;
  }

  // Update totals for averages
  stats.totalMemory += memory.rss;
  stats.totalCpuUser += cpu.user;
  stats.totalCpuSystem += cpu.system;

  // Store in history (keep last 60 samples)
  stats.history.push({
    timestamp: Date.now(),
    memory,
    cpu
  });

  // Keep only last 60 samples
  if (stats.history.length > 60) {
    stats.history.shift();
  }

  // Increment sample count
  stats.samples++;

  // Update last values for next delta calculation
  stats.lastCpuUsage = process.cpuUsage();
  stats.lastMemoryUsage = memory;
}

/**
 * Calculates memory trend based on recent history
 *
 * @returns {string} Trend indicator: ▲ (increasing), ▼ (decreasing), ● (stable)
 */
function getMemoryTrend() {
  if (stats.history.length < 5) {
    return '●'; // Not enough data
  }

  // Compare current with 5 samples ago
  const current = stats.history[stats.history.length - 1].memory.rss;
  const past = stats.history[stats.history.length - 5].memory.rss;

  const change = current - past;
  const changePercent = (change / past) * 100;

  // Consider significant if > 5% change
  if (changePercent > 5) return '▲';
  if (changePercent < -5) return '▼';
  return '●';
}

/**
 * Calculates CPU trend based on recent history
 *
 * @returns {string} Trend indicator
 */
function getCPUTrend() {
  if (stats.history.length < 5) {
    return '●';
  }

  // Get average of last 5 samples
  const recent = stats.history.slice(-5);
  const recentAvg = recent.reduce((sum, s) => sum + s.cpu.user + s.cpu.system, 0) / 5;

  // Get average of previous 5 samples
  if (stats.history.length < 10) {
    return '●';
  }

  const previous = stats.history.slice(-10, -5);
  const previousAvg = previous.reduce((sum, s) => sum + s.cpu.user + s.cpu.system, 0) / 5;

  const change = recentAvg - previousAvg;
  const changePercent = (change / previousAvg) * 100;

  if (changePercent > 10) return '▲';
  if (changePercent < -10) return '▼';
  return '●';
}

/**
 * Displays current metrics in real-time
 *
 * This function creates a live-updating dashboard showing:
 * - Current memory usage
 * - Current CPU usage
 * - Trends
 * - Peak values
 * - Runtime statistics
 */
function displayMetrics() {
  // Clear screen for fresh display
  clearScreen();

  // Get latest snapshot
  if (stats.history.length === 0) {
    process.stdout.write('Collecting initial metrics...\n');
    return;
  }

  const latest = stats.history[stats.history.length - 1];
  const { memory, cpu } = latest;

  // Calculate runtime
  const runtime = (Date.now() - stats.startTime) / 1000;

  // Calculate uptime
  const uptime = process.uptime();

  // Get trends
  const memTrend = getMemoryTrend();
  const cpuTrend = getCPUTrend();

  // Display header
  process.stdout.write('╔════════════════════════════════════════════╗\n');
  process.stdout.write('║         Process Monitor - Real-time        ║\n');
  process.stdout.write('╚════════════════════════════════════════════╝\n');
  process.stdout.write('\n');

  // Display timestamp
  const now = new Date().toLocaleTimeString();
  process.stdout.write(`⏰ Current Time: ${now}\n`);
  process.stdout.write(`⏱️  Monitor Runtime: ${formatDuration(runtime)}\n`);
  process.stdout.write(`🔄 Process Uptime: ${formatDuration(uptime)}\n`);
  process.stdout.write(`📊 Samples Collected: ${stats.samples}\n`);
  process.stdout.write('\n');

  // Display memory metrics
  process.stdout.write('━'.repeat(46) + '\n');
  process.stdout.write(`💾 MEMORY USAGE ${memTrend}\n`);
  process.stdout.write('━'.repeat(46) + '\n');
  process.stdout.write(`RSS (Total):        ${formatBytes(memory.rss).padStart(15)}\n`);
  process.stdout.write(`Heap Total:         ${formatBytes(memory.heapTotal).padStart(15)}\n`);
  process.stdout.write(`Heap Used:          ${formatBytes(memory.heapUsed).padStart(15)}\n`);
  process.stdout.write(`External:           ${formatBytes(memory.external).padStart(15)}\n`);
  if (memory.arrayBuffers > 0) {
    process.stdout.write(`Array Buffers:      ${formatBytes(memory.arrayBuffers).padStart(15)}\n`);
  }

  // Calculate heap usage percentage
  const heapPercent = (memory.heapUsed / memory.heapTotal * 100).toFixed(1);
  process.stdout.write(`Heap Usage:         ${heapPercent.padStart(14)}%\n`);
  process.stdout.write(`Peak Memory:        ${formatBytes(stats.peakMemory).padStart(15)}\n`);
  process.stdout.write('\n');

  // Display CPU metrics
  process.stdout.write('━'.repeat(46) + '\n');
  process.stdout.write(`⚡ CPU USAGE (Last Second) ${cpuTrend}\n`);
  process.stdout.write('━'.repeat(46) + '\n');
  process.stdout.write(`User Time:          ${cpu.user.toFixed(2).padStart(10)} ms\n`);
  process.stdout.write(`System Time:        ${cpu.system.toFixed(2).padStart(10)} ms\n`);
  process.stdout.write(`Total Time:         ${(cpu.user + cpu.system).toFixed(2).padStart(10)} ms\n`);
  process.stdout.write('\n');

  // Display averages
  if (stats.samples > 0) {
    const avgMemory = stats.totalMemory / stats.samples;
    const avgCpuUser = stats.totalCpuUser / stats.samples;
    const avgCpuSystem = stats.totalCpuSystem / stats.samples;

    process.stdout.write('━'.repeat(46) + '\n');
    process.stdout.write('📈 AVERAGES\n');
    process.stdout.write('━'.repeat(46) + '\n');
    process.stdout.write(`Avg Memory:         ${formatBytes(avgMemory).padStart(15)}\n`);
    process.stdout.write(`Avg CPU User:       ${avgCpuUser.toFixed(2).padStart(10)} ms/s\n`);
    process.stdout.write(`Avg CPU System:     ${avgCpuSystem.toFixed(2).padStart(10)} ms/s\n`);
    process.stdout.write('\n');
  }

  // Display legend
  process.stdout.write('━'.repeat(46) + '\n');
  process.stdout.write('Legend: ▲ Increasing | ▼ Decreasing | ● Stable\n');
  process.stdout.write('━'.repeat(46) + '\n');
  process.stdout.write('\n');
  process.stdout.write('Press Ctrl+C to stop monitoring and see summary\n');
}

/**
 * Displays final summary statistics
 *
 * Shows comprehensive statistics collected during the monitoring session.
 */
function displaySummary() {
  process.stdout.write('\n\n');
  process.stdout.write('╔════════════════════════════════════════════╗\n');
  process.stdout.write('║      Process Monitoring Summary            ║\n');
  process.stdout.write('╚════════════════════════════════════════════╝\n');
  process.stdout.write('\n');

  if (stats.samples === 0) {
    process.stdout.write('No data collected.\n');
    return;
  }

  // Calculate runtime
  const runtime = (Date.now() - stats.startTime) / 1000;

  // Calculate averages
  const avgMemory = stats.totalMemory / stats.samples;
  const avgCpuUser = stats.totalCpuUser / stats.samples;
  const avgCpuSystem = stats.totalCpuSystem / stats.samples;
  const avgCpuTotal = avgCpuUser + avgCpuSystem;

  // Display statistics
  process.stdout.write('📊 Session Statistics:\n');
  process.stdout.write('─'.repeat(46) + '\n');
  process.stdout.write(`Total Runtime:           ${formatDuration(runtime)}\n`);
  process.stdout.write(`Samples Collected:       ${stats.samples}\n`);
  process.stdout.write(`Sample Rate:             ${(stats.samples / runtime).toFixed(2)} samples/sec\n`);
  process.stdout.write('\n');

  process.stdout.write('💾 Memory Statistics:\n');
  process.stdout.write('─'.repeat(46) + '\n');
  process.stdout.write(`Peak Memory:             ${formatBytes(stats.peakMemory)}\n`);
  process.stdout.write(`Average Memory:          ${formatBytes(avgMemory)}\n`);

  if (stats.history.length > 0) {
    const finalMem = stats.history[stats.history.length - 1].memory.rss;
    const initialMem = stats.history[0].memory.rss;
    const memChange = finalMem - initialMem;
    const memChangePercent = (memChange / initialMem * 100).toFixed(2);

    process.stdout.write(`Initial Memory:          ${formatBytes(initialMem)}\n`);
    process.stdout.write(`Final Memory:            ${formatBytes(finalMem)}\n`);
    process.stdout.write(`Memory Change:           ${formatBytes(Math.abs(memChange))} `);
    process.stdout.write(`(${memChangePercent >= 0 ? '+' : ''}${memChangePercent}%)\n`);
  }

  process.stdout.write('\n');
  process.stdout.write('⚡ CPU Statistics:\n');
  process.stdout.write('─'.repeat(46) + '\n');
  process.stdout.write(`Avg User CPU:            ${avgCpuUser.toFixed(2)} ms/sec\n`);
  process.stdout.write(`Avg System CPU:          ${avgCpuSystem.toFixed(2)} ms/sec\n`);
  process.stdout.write(`Avg Total CPU:           ${avgCpuTotal.toFixed(2)} ms/sec\n`);
  process.stdout.write(`Total User CPU:          ${stats.totalCpuUser.toFixed(2)} ms\n`);
  process.stdout.write(`Total System CPU:        ${stats.totalCpuSystem.toFixed(2)} ms\n`);
  process.stdout.write('\n');

  process.stdout.write('═'.repeat(46) + '\n');
  process.stdout.write('✨ Thank you for using Process Monitor!\n');
  process.stdout.write('═'.repeat(46) + '\n');
}

/**
 * Handles graceful shutdown
 *
 * This function:
 * 1. Stops the monitoring interval
 * 2. Displays final statistics
 * 3. Exits cleanly
 */
function shutdown() {
  // Stop the interval
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }

  // Clear screen
  clearScreen();

  // Display final summary
  displaySummary();

  // Exit successfully
  process.exit(0);
}

/**
 * Starts the monitoring process
 *
 * This function:
 * 1. Initializes state
 * 2. Sets up signal handlers
 * 3. Starts the monitoring interval
 */
function startMonitoring() {
  process.stdout.write('╔════════════════════════════════════════════╗\n');
  process.stdout.write('║         Process Monitor Starting...        ║\n');
  process.stdout.write('╚════════════════════════════════════════════╝\n');
  process.stdout.write('\n');
  process.stdout.write('Press Ctrl+C to stop monitoring\n');
  process.stdout.write('Initializing...\n');

  // Initialize start time
  stats.startTime = Date.now();

  // Take initial CPU measurement (needed for delta calculation)
  stats.lastCpuUsage = process.cpuUsage();

  // Register signal handlers for graceful shutdown
  process.on('SIGINT', () => {
    // Ctrl+C pressed
    shutdown();
  });

  process.on('SIGTERM', () => {
    // Termination signal
    shutdown();
  });

  // Handle uncaught errors gracefully
  process.on('uncaughtException', (err) => {
    clearInterval(monitorInterval);
    clearScreen();
    process.stderr.write('❌ Error occurred:\n');
    process.stderr.write(err.stack + '\n');
    process.exit(1);
  });

  // Set up monitoring interval (1000ms = 1 second)
  monitorInterval = setInterval(() => {
    collectMetrics();
    displayMetrics();
  }, 1000);

  // Collect initial metrics immediately
  collectMetrics();
}

// Start monitoring after a brief delay to show welcome message
setTimeout(() => {
  startMonitoring();
}, 1000);

/**
 * LEARNING NOTES:
 *
 * 1. setInterval() runs a function repeatedly at specified intervals
 * 2. clearInterval() stops a running interval
 * 3. process.memoryUsage() returns current memory snapshot
 * 4. process.cpuUsage() returns cumulative CPU time
 * 5. CPU usage needs delta calculation for meaningful metrics
 * 6. Signal handlers allow graceful shutdown
 *
 * SIGNAL HANDLING:
 *
 * 1. SIGINT: Interrupt signal (Ctrl+C)
 * 2. SIGTERM: Termination signal (kill command)
 * 3. Always clean up resources in signal handlers
 * 4. Use process.on('signal', handler) to register handlers
 *
 * TERMINAL CONTROL:
 *
 * 1. ANSI escape codes control terminal:
 *    - \x1B[2J: Clear screen
 *    - \x1B[H: Move cursor to home
 *    - \x1B[nA: Move cursor up n lines
 *    - \x1B[nB: Move cursor down n lines
 *
 * 2. Colors and formatting:
 *    - \x1B[31m: Red text
 *    - \x1B[32m: Green text
 *    - \x1B[0m: Reset formatting
 *    - \x1B[1m: Bold
 *    - \x1B[9m: Strikethrough
 *
 * BEST PRACTICES:
 *
 * 1. Always clear intervals on shutdown
 * 2. Handle multiple exit scenarios (SIGINT, SIGTERM, errors)
 * 3. Provide meaningful statistics and summaries
 * 4. Use appropriate interval timing (not too fast)
 * 5. Keep history bounded (avoid memory leaks)
 * 6. Calculate trends for better insights
 * 7. Display data in human-readable formats
 *
 * MEMORY METRICS EXPLAINED:
 *
 * 1. RSS (Resident Set Size):
 *    - Total memory allocated to the process
 *    - Includes heap, stack, and code
 *
 * 2. Heap Total:
 *    - Total heap allocated by V8
 *    - Can grow/shrink over time
 *
 * 3. Heap Used:
 *    - Actual heap memory in use
 *    - Your JavaScript objects
 *
 * 4. External:
 *    - C++ objects bound to JavaScript
 *    - Includes Buffer memory
 *
 * CPU METRICS EXPLAINED:
 *
 * 1. User Time:
 *    - Time spent executing JavaScript code
 *    - Your application logic
 *
 * 2. System Time:
 *    - Time spent in system calls
 *    - I/O, network, file operations
 *
 * 3. Delta Calculation:
 *    - CPU usage is cumulative
 *    - Subtract previous from current
 *    - Gives usage in the interval
 *
 * COMMON USE CASES:
 *
 * 1. Performance monitoring
 * 2. Memory leak detection
 * 3. Resource usage tracking
 * 4. Application profiling
 * 5. Health monitoring dashboards
 * 6. Development debugging
 * 7. Production monitoring agents
 *
 * ENHANCEMENTS FOR PRODUCTION:
 *
 * 1. Add configurable intervals
 * 2. Support logging to file
 * 3. Add alerting thresholds
 * 4. Support multiple processes
 * 5. Add charting/graphing
 * 6. Export metrics to monitoring systems
 * 7. Add network and disk I/O metrics
 * 8. Support filtering and searching
 */
