/**
 * Exercise 2: Resource Monitor with Alerts
 * =========================================
 *
 * Difficulty: Medium
 *
 * Task:
 * Create a resource monitoring system that tracks memory and CPU usage,
 * detects when thresholds are exceeded, and sends alerts. The monitor should
 * provide real-time feedback and maintain a history of resource usage.
 *
 * Requirements:
 * 1. Monitor memory usage (RSS, heap) at regular intervals
 * 2. Monitor CPU usage with proper delta calculations
 * 3. Define configurable thresholds for alerts
 * 4. Detect and log threshold violations
 * 5. Track violation history and alert frequency
 * 6. Provide a summary report on shutdown
 * 7. Allow dynamic threshold updates via signals (SIGUSR1)
 *
 * Learning Goals:
 * - Using process.memoryUsage() and process.cpuUsage()
 * - Calculating resource usage deltas
 * - Implementing threshold-based monitoring
 * - Working with timers (setInterval)
 * - Signal handling for dynamic configuration
 * - Resource cleanup and graceful shutdown
 *
 * Run: node exercise-2.js
 */

// Configuration
const CONFIG = {
  monitorInterval: 2000,        // Check every 2 seconds
  memoryThreshold: 150 * 1024 * 1024, // 150 MB (in bytes)
  cpuThreshold: 80,             // 80% CPU usage
  historySize: 10,              // Keep last 10 samples
  alertCooldown: 5000          // Minimum 5s between same alert type
};

// State
let monitorInterval;
let previousCpu = process.cpuUsage();
let previousTime = Date.now();
let samplesCollected = 0;
let history = {
  memory: [],
  cpu: []
};
let alerts = {
  memory: { count: 0, lastAlert: 0 },
  cpu: { count: 0, lastAlert: 0 }
};

/**
 * TODO 1: Implement memory monitoring
 *
 * Steps:
 * 1. Get current memory usage with process.memoryUsage()
 * 2. Check if RSS exceeds threshold
 * 3. Return an object with:
 *    - rss: current RSS in MB
 *    - heapUsed: current heap used in MB
 *    - heapTotal: total heap in MB
 *    - threshold: threshold in MB
 *    - exceeded: boolean indicating if threshold exceeded
 *
 * Hint: Convert bytes to MB by dividing by (1024 * 1024)
 */
function checkMemory() {
  // TODO: Get memory usage
  // const mem = process.memoryUsage();

  // TODO: Convert to MB
  // const rssMB = mem.rss / (1024 * 1024);
  // const heapUsedMB = mem.heapUsed / (1024 * 1024);
  // const heapTotalMB = mem.heapTotal / (1024 * 1024);
  // const thresholdMB = CONFIG.memoryThreshold / (1024 * 1024);

  // TODO: Check threshold
  // const exceeded = mem.rss > CONFIG.memoryThreshold;

  // TODO: Return result object
  // return {
  //   rss: rssMB.toFixed(2),
  //   heapUsed: heapUsedMB.toFixed(2),
  //   heapTotal: heapTotalMB.toFixed(2),
  //   threshold: thresholdMB.toFixed(2),
  //   exceeded
  // };
}

/**
 * TODO 2: Implement CPU monitoring with delta calculation
 *
 * Steps:
 * 1. Get current CPU usage with process.cpuUsage()
 * 2. Calculate elapsed time since last check
 * 3. Calculate CPU deltas (user and system)
 * 4. Calculate CPU percentage: (delta / elapsed) * 100
 * 5. Update previousCpu and previousTime
 * 6. Return object with usage data and threshold check
 *
 * CPU Percentage Formula:
 * - Delta = current CPU time - previous CPU time (in microseconds)
 * - Elapsed = current time - previous time (in milliseconds)
 * - Percentage = (delta / 1000) / elapsed * 100
 *
 * Hint: CPU values are in microseconds, time is in milliseconds
 */
function checkCPU() {
  // TODO: Get current CPU usage and time
  // const currentCpu = process.cpuUsage();
  // const currentTime = Date.now();

  // TODO: Calculate elapsed time in milliseconds
  // const elapsed = currentTime - previousTime;

  // TODO: Calculate CPU deltas (current - previous)
  // const userDelta = currentCpu.user - previousCpu.user;
  // const systemDelta = currentCpu.system - previousCpu.system;
  // const totalDelta = userDelta + systemDelta;

  // TODO: Calculate CPU percentage
  // Convert microseconds to milliseconds (divide by 1000)
  // Then calculate percentage of elapsed time
  // const cpuPercent = ((totalDelta / 1000) / elapsed) * 100;

  // TODO: Check threshold
  // const exceeded = cpuPercent > CONFIG.cpuThreshold;

  // TODO: Update previous values
  // previousCpu = currentCpu;
  // previousTime = currentTime;

  // TODO: Return result object
  // return {
  //   percent: cpuPercent.toFixed(2),
  //   userDelta: (userDelta / 1000).toFixed(2),
  //   systemDelta: (systemDelta / 1000).toFixed(2),
  //   threshold: CONFIG.cpuThreshold,
  //   exceeded
  // };
}

/**
 * TODO 3: Implement alert system with cooldown
 *
 * Steps:
 * 1. Check if cooldown period has passed since last alert
 * 2. If cooldown period hasn't passed, skip alert
 * 3. Log alert message with details
 * 4. Increment alert counter
 * 5. Update last alert timestamp
 *
 * Hint: Use Date.now() to check time since last alert
 */
function sendAlert(type, details) {
  const now = Date.now();
  const timeSinceLastAlert = now - alerts[type].lastAlert;

  // TODO: Check cooldown period
  // if (timeSinceLastAlert < CONFIG.alertCooldown) {
  //   return; // Skip alert - in cooldown
  // }

  // TODO: Log alert
  // console.log(`\n🚨 ALERT: ${type.toUpperCase()} threshold exceeded!`);

  // TODO: Log type-specific details
  // if (type === 'memory') {
  //   console.log(`   RSS: ${details.rss} MB (threshold: ${details.threshold} MB)`);
  //   console.log(`   Heap: ${details.heapUsed} / ${details.heapTotal} MB`);
  // } else if (type === 'cpu') {
  //   console.log(`   CPU: ${details.percent}% (threshold: ${details.threshold}%)`);
  //   console.log(`   User: ${details.userDelta}ms, System: ${details.systemDelta}ms`);
  // }

  // TODO: Update alert tracking
  // alerts[type].count++;
  // alerts[type].lastAlert = now;
}

/**
 * TODO 4: Implement history tracking
 *
 * Steps:
 * 1. Add new sample to history array
 * 2. Keep only the last CONFIG.historySize samples
 * 3. Use array methods to manage size
 *
 * Hint: Use array.push() and array.shift() or array.slice()
 */
function addToHistory(type, sample) {
  // TODO: Add sample to history
  // history[type].push(sample);

  // TODO: Trim history to maximum size
  // if (history[type].length > CONFIG.historySize) {
  //   history[type].shift();
  // }
}

/**
 * TODO 5: Implement main monitoring function
 *
 * This function runs at each interval and:
 * 1. Checks memory usage
 * 2. Checks CPU usage
 * 3. Adds data to history
 * 4. Sends alerts if thresholds exceeded
 * 5. Logs current status
 */
function monitor() {
  samplesCollected++;

  console.log(`\n📊 Sample #${samplesCollected} (Uptime: ${process.uptime().toFixed(2)}s)`);
  console.log('━'.repeat(60));

  // TODO: Check memory
  // const memoryStatus = checkMemory();
  // console.log(`💾 Memory: RSS ${memoryStatus.rss} MB, Heap ${memoryStatus.heapUsed}/${memoryStatus.heapTotal} MB`);
  // addToHistory('memory', parseFloat(memoryStatus.rss));

  // TODO: Send memory alert if needed
  // if (memoryStatus.exceeded) {
  //   sendAlert('memory', memoryStatus);
  // }

  // TODO: Check CPU (skip first sample - need previous data)
  // if (samplesCollected > 1) {
  //   const cpuStatus = checkCPU();
  //   console.log(`⚙️  CPU: ${cpuStatus.percent}% (User: ${cpuStatus.userDelta}ms, System: ${cpuStatus.systemDelta}ms)`);
  //   addToHistory('cpu', parseFloat(cpuStatus.percent));
  //
  //   if (cpuStatus.exceeded) {
  //     sendAlert('cpu', cpuStatus);
  //   }
  // }
}

/**
 * TODO 6: Implement summary report
 *
 * Calculate and display:
 * 1. Total samples collected
 * 2. Total alerts sent (by type)
 * 3. Average memory usage from history
 * 4. Average CPU usage from history
 * 5. Peak values for memory and CPU
 */
function displaySummary() {
  console.log('\n' + '═'.repeat(60));
  console.log('📈 MONITORING SUMMARY');
  console.log('═'.repeat(60));

  // TODO: Display sample count
  // console.log(`\nSamples Collected: ${samplesCollected}`);
  // console.log(`Process Uptime: ${process.uptime().toFixed(2)}s`);

  // TODO: Display alerts
  // console.log(`\n🚨 Alerts:`);
  // console.log(`   Memory: ${alerts.memory.count}`);
  // console.log(`   CPU: ${alerts.cpu.count}`);

  // TODO: Calculate and display memory statistics
  // if (history.memory.length > 0) {
  //   const avgMemory = history.memory.reduce((a, b) => a + b, 0) / history.memory.length;
  //   const maxMemory = Math.max(...history.memory);
  //   console.log(`\n💾 Memory Statistics:`);
  //   console.log(`   Average RSS: ${avgMemory.toFixed(2)} MB`);
  //   console.log(`   Peak RSS: ${maxMemory.toFixed(2)} MB`);
  //   console.log(`   Threshold: ${(CONFIG.memoryThreshold / (1024 * 1024)).toFixed(2)} MB`);
  // }

  // TODO: Calculate and display CPU statistics
  // if (history.cpu.length > 0) {
  //   const avgCpu = history.cpu.reduce((a, b) => a + b, 0) / history.cpu.length;
  //   const maxCpu = Math.max(...history.cpu);
  //   console.log(`\n⚙️  CPU Statistics:`);
  //   console.log(`   Average: ${avgCpu.toFixed(2)}%`);
  //   console.log(`   Peak: ${maxCpu.toFixed(2)}%`);
  //   console.log(`   Threshold: ${CONFIG.cpuThreshold}%`);
  // }

  console.log('\n' + '═'.repeat(60));
}

/**
 * TODO 7: Implement threshold adjustment via SIGUSR1
 *
 * When SIGUSR1 signal is received:
 * 1. Increase memory threshold by 20%
 * 2. Increase CPU threshold by 10%
 * 3. Log new thresholds
 *
 * Test with: kill -SIGUSR1 <pid>
 */
function handleThresholdUpdate() {
  // TODO: Adjust thresholds
  // CONFIG.memoryThreshold *= 1.2;
  // CONFIG.cpuThreshold *= 1.1;

  // TODO: Log changes
  // console.log('\n🔧 Thresholds updated via SIGUSR1:');
  // console.log(`   Memory: ${(CONFIG.memoryThreshold / (1024 * 1024)).toFixed(2)} MB`);
  // console.log(`   CPU: ${CONFIG.cpuThreshold.toFixed(2)}%\n`);
}

/**
 * TODO 8: Implement shutdown handler
 *
 * Steps:
 * 1. Clear the monitoring interval
 * 2. Display summary report
 * 3. Exit cleanly
 */
function shutdown(signal) {
  console.log(`\n\n🛑 Received ${signal} - Shutting down monitor...`);

  // TODO: Stop monitoring
  // clearInterval(monitorInterval);

  // TODO: Display summary
  // displaySummary();

  // TODO: Exit
  // console.log('\n👋 Monitor stopped.\n');
  // process.exit(0);
}

/**
 * TODO 9: Start the monitor
 *
 * Steps:
 * 1. Display startup information
 * 2. Set up signal handlers (SIGINT, SIGTERM, SIGUSR1)
 * 3. Start monitoring interval
 * 4. Run first check immediately
 */
function startMonitor() {
  console.log('🚀 Starting Resource Monitor...\n');
  console.log('═'.repeat(60));
  console.log('Configuration:');
  console.log(`  Monitor Interval: ${CONFIG.monitorInterval}ms`);
  console.log(`  Memory Threshold: ${(CONFIG.memoryThreshold / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  CPU Threshold: ${CONFIG.cpuThreshold}%`);
  console.log(`  History Size: ${CONFIG.historySize} samples`);
  console.log(`  Alert Cooldown: ${CONFIG.alertCooldown}ms`);
  console.log('═'.repeat(60));
  console.log('\n💡 Tip: Send SIGUSR1 to increase thresholds (kill -SIGUSR1 ' + process.pid + ')');
  console.log('🛑 Press Ctrl+C to stop and see summary\n');

  // TODO: Set up signal handlers
  // process.on('SIGINT', () => shutdown('SIGINT'));
  // process.on('SIGTERM', () => shutdown('SIGTERM'));
  // process.on('SIGUSR1', handleThresholdUpdate);

  // TODO: Start monitoring interval
  // monitorInterval = setInterval(monitor, CONFIG.monitorInterval);

  // TODO: Run first check immediately
  // monitor();
}

// Start the monitor
// TODO: Uncomment when ready to test
// startMonitor();

// =============================================================================
// Expected Output:
// =============================================================================

/**
 * Normal operation:
 * 📊 Sample #1 (Uptime: 0.05s)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 💾 Memory: RSS 45.23 MB, Heap 8.75/12.50 MB
 * ⚙️  CPU: 2.45% (User: 24.50ms, System: 2.10ms)
 *
 * When threshold exceeded:
 * 🚨 ALERT: MEMORY threshold exceeded!
 *    RSS: 160.25 MB (threshold: 150.00 MB)
 *    Heap: 120.50 / 140.00 MB
 *
 * On shutdown (Ctrl+C):
 * 🛑 Received SIGINT - Shutting down monitor...
 * ═══════════════════════════════════════════════════════════
 * 📈 MONITORING SUMMARY
 * ═══════════════════════════════════════════════════════════
 * Samples Collected: 25
 * Process Uptime: 50.23s
 * ...
 */

// =============================================================================
// Hints:
// =============================================================================

/**
 * Hint 1: CPU percentage calculation
 * cpuPercent = ((totalDelta / 1000) / elapsed) * 100
 * - totalDelta is in microseconds, so divide by 1000 for milliseconds
 * - elapsed is in milliseconds
 * - Multiply by 100 for percentage
 *
 * Hint 2: Alert cooldown
 * const timeSinceLastAlert = Date.now() - alerts[type].lastAlert;
 * if (timeSinceLastAlert < CONFIG.alertCooldown) return;
 *
 * Hint 3: History management
 * history[type].push(sample);
 * if (history[type].length > CONFIG.historySize) {
 *   history[type].shift(); // Remove oldest
 * }
 *
 * Hint 4: Calculate average from array
 * const avg = array.reduce((a, b) => a + b, 0) / array.length;
 *
 * Hint 5: Find maximum in array
 * const max = Math.max(...array);
 */

// =============================================================================
// Testing Tips:
// =============================================================================

/**
 * Test 1: Basic monitoring
 * $ node exercise-2.js
 * Observe normal resource usage
 *
 * Test 2: Trigger memory alert
 * Add this code before startMonitor() to allocate memory:
 * const buffer = Buffer.alloc(200 * 1024 * 1024); // 200 MB
 *
 * Test 3: Trigger CPU alert
 * Add this inside monitor() to burn CPU:
 * for (let i = 0; i < 100000000; i++) { Math.sqrt(i); }
 *
 * Test 4: Dynamic threshold update
 * $ node exercise-2.js
 * $ # In another terminal:
 * $ kill -SIGUSR1 <pid>
 *
 * Test 5: Long-running monitor
 * $ node exercise-2.js
 * Let it run for several minutes, then Ctrl+C to see summary
 */
