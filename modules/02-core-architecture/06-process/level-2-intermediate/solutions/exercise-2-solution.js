/**
 * SOLUTION: Exercise 2 - Resource Monitor with Alerts
 * =====================================================
 *
 * This solution demonstrates professional resource monitoring with threshold-based
 * alerts, historical data tracking, and dynamic configuration. It showcases proper
 * CPU usage calculation, memory monitoring, and alert cooldown management.
 *
 * KEY CONCEPTS DEMONSTRATED:
 * - process.memoryUsage() for memory metrics
 * - process.cpuUsage() with delta calculations
 * - Threshold-based alerting
 * - Alert cooldown to prevent spam
 * - Historical data tracking with size limits
 * - Statistical analysis (averages, peaks)
 * - Dynamic configuration via signals (SIGUSR1)
 * - Graceful shutdown with summary report
 *
 * PRODUCTION FEATURES:
 * - Configurable thresholds
 * - Alert rate limiting
 * - Trend analysis
 * - Summary statistics
 * - Signal-based threshold adjustment
 * - Comprehensive logging
 */

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  monitorInterval: 2000,              // Check every 2 seconds
  memoryThreshold: 150 * 1024 * 1024, // 150 MB (in bytes)
  cpuThreshold: 80,                   // 80% CPU usage
  historySize: 10,                    // Keep last 10 samples
  alertCooldown: 5000                 // Minimum 5s between same alert type
};

// ============================================================================
// State Management
// ============================================================================

let monitorInterval;
let previousCpu = process.cpuUsage();
let previousTime = Date.now();
let samplesCollected = 0;

// Historical data storage
const history = {
  memory: [],
  cpu: []
};

// Alert tracking
const alerts = {
  memory: { count: 0, lastAlert: 0 },
  cpu: { count: 0, lastAlert: 0 }
};

// ============================================================================
// Memory Monitoring
// ============================================================================

/**
 * Checks current memory usage against threshold
 *
 * Memory metrics explained:
 * - RSS (Resident Set Size): Total memory allocated for the process
 *   Includes heap, code segment, and stack
 * - heapTotal: Total heap allocated by V8
 * - heapUsed: Actual memory used by JavaScript objects
 * - external: Memory used by C++ objects bound to JS objects
 *
 * @returns {Object} Memory status with RSS, heap metrics, and threshold check
 */
function checkMemory() {
  // Get current memory usage snapshot
  const mem = process.memoryUsage();

  // Convert bytes to megabytes for human readability
  const rssMB = mem.rss / (1024 * 1024);
  const heapUsedMB = mem.heapUsed / (1024 * 1024);
  const heapTotalMB = mem.heapTotal / (1024 * 1024);
  const thresholdMB = CONFIG.memoryThreshold / (1024 * 1024);

  // Check if threshold is exceeded
  const exceeded = mem.rss > CONFIG.memoryThreshold;

  return {
    rss: rssMB.toFixed(2),
    heapUsed: heapUsedMB.toFixed(2),
    heapTotal: heapTotalMB.toFixed(2),
    threshold: thresholdMB.toFixed(2),
    exceeded
  };
}

// ============================================================================
// CPU Monitoring
// ============================================================================

/**
 * Checks current CPU usage with delta calculation
 *
 * CPU usage calculation:
 * 1. Get current CPU usage (cumulative time in microseconds)
 * 2. Calculate delta from previous measurement
 * 3. Calculate elapsed wall-clock time
 * 4. Percentage = (CPU delta / elapsed time) * 100
 *
 * CPU metrics:
 * - user: Time spent executing user code (JavaScript)
 * - system: Time spent in system calls (I/O, etc.)
 *
 * Note: CPU percentage can exceed 100% on multi-core systems
 * if the process uses multiple threads.
 *
 * @returns {Object} CPU status with percentage, deltas, and threshold check
 */
function checkCPU() {
  // Get current CPU usage and time
  const currentCpu = process.cpuUsage();
  const currentTime = Date.now();

  // Calculate elapsed time in milliseconds
  const elapsed = currentTime - previousTime;

  // Calculate CPU time deltas (in microseconds)
  const userDelta = currentCpu.user - previousCpu.user;
  const systemDelta = currentCpu.system - previousCpu.system;
  const totalDelta = userDelta + systemDelta;

  // Calculate CPU percentage
  // Convert microseconds to milliseconds (divide by 1000)
  // Then calculate as percentage of elapsed time
  const cpuPercent = ((totalDelta / 1000) / elapsed) * 100;

  // Check if threshold is exceeded
  const exceeded = cpuPercent > CONFIG.cpuThreshold;

  // Update previous values for next calculation
  previousCpu = currentCpu;
  previousTime = currentTime;

  return {
    percent: cpuPercent.toFixed(2),
    userDelta: (userDelta / 1000).toFixed(2),
    systemDelta: (systemDelta / 1000).toFixed(2),
    threshold: CONFIG.cpuThreshold,
    exceeded
  };
}

// ============================================================================
// Alert System
// ============================================================================

/**
 * Sends an alert if cooldown period has passed
 *
 * Alert cooldown prevents alert spam:
 * - If the same alert type fires repeatedly, only send after cooldown
 * - This prevents flooding logs with duplicate alerts
 * - Production systems would integrate with PagerDuty, Slack, etc.
 *
 * @param {string} type - Alert type ('memory' or 'cpu')
 * @param {Object} details - Alert details to include in message
 */
function sendAlert(type, details) {
  const now = Date.now();
  const timeSinceLastAlert = now - alerts[type].lastAlert;

  // Check cooldown period
  if (timeSinceLastAlert < CONFIG.alertCooldown) {
    return; // Skip alert - still in cooldown
  }

  // Display alert header
  console.log(`\n${'🚨'.repeat(30)}`);
  console.log(`🚨 ALERT: ${type.toUpperCase()} threshold exceeded!`);
  console.log('🚨'.repeat(30));

  // Display type-specific details
  if (type === 'memory') {
    console.log(`   RSS: ${details.rss} MB (threshold: ${details.threshold} MB)`);
    console.log(`   Heap Used: ${details.heapUsed} MB`);
    console.log(`   Heap Total: ${details.heapTotal} MB`);
    console.log(`   Utilization: ${((parseFloat(details.heapUsed) / parseFloat(details.heapTotal)) * 100).toFixed(1)}%`);
  } else if (type === 'cpu') {
    console.log(`   CPU Usage: ${details.percent}% (threshold: ${details.threshold}%)`);
    console.log(`   User Time: ${details.userDelta}ms`);
    console.log(`   System Time: ${details.systemDelta}ms`);
  }

  console.log(`   Alert Count: ${alerts[type].count + 1}`);
  console.log(`   Time Since Last Alert: ${(timeSinceLastAlert / 1000).toFixed(1)}s`);
  console.log('🚨'.repeat(30) + '\n');

  // Update alert tracking
  alerts[type].count++;
  alerts[type].lastAlert = now;

  // In production: Send to monitoring service
  // Example: sendToSlack(type, details);
  // Example: sendToPagerDuty(type, details);
}

// ============================================================================
// History Management
// ============================================================================

/**
 * Adds a sample to history with size limit
 *
 * Maintains a rolling window of recent samples:
 * - Keeps only the last N samples
 * - Removes oldest when limit is reached
 * - Used for trend analysis and statistics
 *
 * @param {string} type - History type ('memory' or 'cpu')
 * @param {number} sample - Sample value to add
 */
function addToHistory(type, sample) {
  history[type].push(sample);

  // Trim history to maximum size
  if (history[type].length > CONFIG.historySize) {
    history[type].shift(); // Remove oldest sample
  }
}

// ============================================================================
// Monitoring Logic
// ============================================================================

/**
 * Main monitoring function - runs at each interval
 *
 * This function orchestrates:
 * 1. Memory usage check
 * 2. CPU usage check (after first sample)
 * 3. History tracking
 * 4. Alert generation
 * 5. Status logging
 */
function monitor() {
  samplesCollected++;

  console.log(`\n📊 Sample #${samplesCollected} (Uptime: ${process.uptime().toFixed(2)}s)`);
  console.log('━'.repeat(60));

  // Check memory
  const memoryStatus = checkMemory();
  console.log(`💾 Memory: RSS ${memoryStatus.rss} MB, ` +
              `Heap ${memoryStatus.heapUsed}/${memoryStatus.heapTotal} MB`);

  addToHistory('memory', parseFloat(memoryStatus.rss));

  // Send memory alert if needed
  if (memoryStatus.exceeded) {
    sendAlert('memory', memoryStatus);
  }

  // Check CPU (skip first sample - need previous data for delta)
  if (samplesCollected > 1) {
    const cpuStatus = checkCPU();
    console.log(`⚙️  CPU: ${cpuStatus.percent}% ` +
                `(User: ${cpuStatus.userDelta}ms, System: ${cpuStatus.systemDelta}ms)`);

    addToHistory('cpu', parseFloat(cpuStatus.percent));

    // Send CPU alert if needed
    if (cpuStatus.exceeded) {
      sendAlert('cpu', cpuStatus);
    }
  } else {
    console.log(`⚙️  CPU: Collecting baseline (first sample)`);
  }
}

// ============================================================================
// Statistics and Reporting
// ============================================================================

/**
 * Displays comprehensive summary report
 *
 * Includes:
 * - Total samples collected
 * - Alert counts by type
 * - Memory statistics (average, peak, threshold)
 * - CPU statistics (average, peak, threshold)
 * - Process uptime
 */
function displaySummary() {
  console.log('\n' + '═'.repeat(60));
  console.log('📈 MONITORING SUMMARY');
  console.log('═'.repeat(60));

  // Sample and uptime information
  console.log(`\n📊 Samples Collected: ${samplesCollected}`);
  console.log(`⏱️  Process Uptime: ${process.uptime().toFixed(2)}s`);
  console.log(`📅 Start Time: ${new Date(Date.now() - process.uptime() * 1000).toISOString()}`);

  // Alert summary
  console.log(`\n🚨 Alerts:`);
  console.log(`   Memory Alerts: ${alerts.memory.count}`);
  console.log(`   CPU Alerts: ${alerts.cpu.count}`);
  console.log(`   Total Alerts: ${alerts.memory.count + alerts.cpu.count}`);

  // Memory statistics
  if (history.memory.length > 0) {
    const avgMemory = history.memory.reduce((a, b) => a + b, 0) / history.memory.length;
    const maxMemory = Math.max(...history.memory);
    const minMemory = Math.min(...history.memory);

    console.log(`\n💾 Memory Statistics:`);
    console.log(`   Average RSS: ${avgMemory.toFixed(2)} MB`);
    console.log(`   Peak RSS: ${maxMemory.toFixed(2)} MB`);
    console.log(`   Minimum RSS: ${minMemory.toFixed(2)} MB`);
    console.log(`   Threshold: ${(CONFIG.memoryThreshold / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Threshold Exceeded: ${maxMemory > CONFIG.memoryThreshold / (1024 * 1024) ? 'Yes' : 'No'}`);
  }

  // CPU statistics
  if (history.cpu.length > 0) {
    const avgCpu = history.cpu.reduce((a, b) => a + b, 0) / history.cpu.length;
    const maxCpu = Math.max(...history.cpu);
    const minCpu = Math.min(...history.cpu);

    console.log(`\n⚙️  CPU Statistics:`);
    console.log(`   Average: ${avgCpu.toFixed(2)}%`);
    console.log(`   Peak: ${maxCpu.toFixed(2)}%`);
    console.log(`   Minimum: ${minCpu.toFixed(2)}%`);
    console.log(`   Threshold: ${CONFIG.cpuThreshold}%`);
    console.log(`   Threshold Exceeded: ${maxCpu > CONFIG.cpuThreshold ? 'Yes' : 'No'}`);
  }

  console.log('\n' + '═'.repeat(60));
}

// ============================================================================
// Dynamic Configuration
// ============================================================================

/**
 * Handles threshold adjustment via SIGUSR1 signal
 *
 * This demonstrates dynamic configuration without restart:
 * - Increases thresholds by percentage
 * - Logs new values
 * - No service interruption
 *
 * Usage: kill -SIGUSR1 <pid>
 */
function handleThresholdUpdate() {
  // Adjust thresholds
  CONFIG.memoryThreshold *= 1.2;  // Increase by 20%
  CONFIG.cpuThreshold *= 1.1;     // Increase by 10%

  // Log changes
  console.log('\n' + '🔧'.repeat(30));
  console.log('🔧 THRESHOLDS UPDATED (SIGUSR1)');
  console.log('🔧'.repeat(30));
  console.log(`   New Memory Threshold: ${(CONFIG.memoryThreshold / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   New CPU Threshold: ${CONFIG.cpuThreshold.toFixed(2)}%`);
  console.log('🔧'.repeat(30) + '\n');
}

// ============================================================================
// Shutdown Handler
// ============================================================================

/**
 * Handles graceful shutdown
 *
 * Steps:
 * 1. Stop monitoring interval
 * 2. Display summary report
 * 3. Clean exit
 *
 * @param {string} signal - Signal that triggered shutdown
 */
function shutdown(signal) {
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log(`🛑 Received ${signal} - Shutting down monitor...`);
  console.log('═'.repeat(60));

  // Stop monitoring
  clearInterval(monitorInterval);

  // Display summary
  displaySummary();

  // Exit
  console.log('\n👋 Monitor stopped.\n');
  process.exit(0);
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Starts the resource monitor
 *
 * Sets up:
 * - Signal handlers
 * - Monitoring interval
 * - Initial check
 */
function startMonitor() {
  console.log('═'.repeat(60));
  console.log('RESOURCE MONITOR WITH ALERTS');
  console.log('═'.repeat(60));
  console.log('\n🚀 Starting Resource Monitor...\n');
  console.log('Configuration:');
  console.log(`  Monitor Interval: ${CONFIG.monitorInterval}ms`);
  console.log(`  Memory Threshold: ${(CONFIG.memoryThreshold / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  CPU Threshold: ${CONFIG.cpuThreshold}%`);
  console.log(`  History Size: ${CONFIG.historySize} samples`);
  console.log(`  Alert Cooldown: ${CONFIG.alertCooldown}ms`);
  console.log('═'.repeat(60));
  console.log(`\n💡 Tip: Send SIGUSR1 to increase thresholds`);
  console.log(`   Command: kill -SIGUSR1 ${process.pid}`);
  console.log('🛑 Press Ctrl+C to stop and see summary\n');

  // Set up signal handlers
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGUSR1', handleThresholdUpdate);

  // Start monitoring interval
  monitorInterval = setInterval(monitor, CONFIG.monitorInterval);

  // Run first check immediately
  monitor();
}

// ============================================================================
// Main Execution
// ============================================================================

startMonitor();

// ============================================================================
// LEARNING NOTES
// ============================================================================

/**
 * KEY TAKEAWAYS:
 *
 * 1. CPU USAGE CALCULATION
 *    - process.cpuUsage() returns cumulative time
 *    - Must calculate delta between measurements
 *    - Formula: ((delta_microseconds / 1000) / elapsed_ms) * 100
 *    - Can exceed 100% on multi-core systems
 *
 * 2. MEMORY MONITORING
 *    - RSS: Total process memory (most important for monitoring)
 *    - heapUsed: JavaScript objects memory
 *    - heapTotal: V8 heap allocation
 *    - external: C++ objects memory
 *
 * 3. ALERT MANAGEMENT
 *    - Implement cooldown to prevent spam
 *    - Track alert frequency
 *    - Include context in alerts
 *    - In production: integrate with monitoring services
 *
 * 4. HISTORICAL DATA
 *    - Keep bounded history (prevent memory growth)
 *    - Use for trend analysis
 *    - Calculate statistics (average, peak)
 *    - Helps identify patterns
 *
 * 5. DYNAMIC CONFIGURATION
 *    - Use signals for runtime updates
 *    - SIGUSR1/SIGUSR2 for custom actions
 *    - No service restart needed
 *    - Log all configuration changes
 *
 * PRODUCTION CONSIDERATIONS:
 *
 * 1. Monitoring Services
 *    - Send metrics to DataDog, Prometheus, CloudWatch
 *    - Set up dashboards for visualization
 *    - Configure alerts in monitoring service
 *
 * 2. Alert Channels
 *    - Email for low-priority alerts
 *    - Slack/Teams for medium-priority
 *    - PagerDuty/OpsGenie for critical
 *
 * 3. Metric Granularity
 *    - High-frequency sampling (1-5 seconds)
 *    - Store aggregates (1-min, 5-min, 1-hour)
 *    - Balance between detail and storage
 *
 * 4. Threshold Tuning
 *    - Start conservative
 *    - Adjust based on observed patterns
 *    - Different thresholds per environment
 *    - Consider time-of-day patterns
 *
 * 5. Resource Limits
 *    - Set memory limits (--max-old-space-size)
 *    - Use container limits (Docker, K8s)
 *    - Monitor against limits
 *    - Plan for scaling
 */
