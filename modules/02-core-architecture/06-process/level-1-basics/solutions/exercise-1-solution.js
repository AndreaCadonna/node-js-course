/**
 * SOLUTION: Exercise 1 - System Information Tool
 *
 * This solution demonstrates comprehensive usage of the process object to access
 * and display system and process information. It showcases best practices for
 * formatting output and working with Node.js process properties.
 *
 * KEY CONCEPTS DEMONSTRATED:
 * - process.version, process.platform, process.arch
 * - process.pid, process.ppid, process.cwd(), process.uptime()
 * - process.memoryUsage() for memory statistics
 * - process.cpuUsage() for CPU time tracking
 * - process.execPath for Node.js installation location
 * - Formatting and presenting data in readable formats
 *
 * PRODUCTION FEATURES:
 * - Clear, structured output with visual separators
 * - Human-readable formatting (bytes to MB, microseconds to milliseconds)
 * - Descriptive labels and documentation
 * - Helper functions for code reusability
 */

/**
 * Converts bytes to megabytes with specified decimal precision
 *
 * @param {number} bytes - Number of bytes to convert
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted string with MB suffix
 */
function formatBytes(bytes, decimals = 2) {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(decimals)} MB`;
}

/**
 * Converts microseconds to milliseconds with specified decimal precision
 *
 * @param {number} microseconds - Time in microseconds
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted string with ms suffix
 */
function formatMicroseconds(microseconds, decimals = 2) {
  const milliseconds = microseconds / 1000;
  return `${milliseconds.toFixed(decimals)} ms`;
}

/**
 * Displays Node.js and system information
 *
 * This function demonstrates accessing static process properties that provide
 * information about the Node.js runtime and the underlying system.
 */
function displaySystemInfo() {
  console.log('--- System Information ---');

  // Node.js version (e.g., 'v18.17.0')
  console.log(`Node.js Version:       ${process.version}`);

  // Operating system platform (e.g., 'linux', 'darwin', 'win32')
  console.log(`Platform:              ${process.platform}`);

  // CPU architecture (e.g., 'x64', 'arm64')
  console.log(`Architecture:          ${process.arch}`);

  // Full path to the Node.js executable
  console.log(`Node.js Executable:    ${process.execPath}`);
}

/**
 * Displays process-specific information
 *
 * This function shows how to access dynamic process information including
 * process identifiers, working directory, and uptime.
 */
function displayProcessInfo() {
  console.log('\n--- Process Information ---');

  // Process ID - unique identifier for this process
  console.log(`Process ID (PID):      ${process.pid}`);

  // Parent Process ID - PID of the process that spawned this one
  console.log(`Parent PID (PPID):     ${process.ppid}`);

  // Current working directory - the directory from which the process was started
  console.log(`Working Directory:     ${process.cwd()}`);

  // Process uptime in seconds - how long the process has been running
  const uptime = process.uptime();
  console.log(`Process Uptime:        ${uptime.toFixed(2)} seconds`);

  // Additional useful information
  console.log(`Node Version:          ${process.versions.node}`);
  console.log(`V8 Engine Version:     ${process.versions.v8}`);
}

/**
 * Displays detailed memory usage statistics
 *
 * The memoryUsage() method returns an object with memory usage metrics in bytes.
 * Understanding these metrics is crucial for monitoring and optimizing Node.js applications.
 */
function displayMemoryUsage() {
  console.log('\n--- Memory Usage ---');

  // Get memory usage snapshot
  const memUsage = process.memoryUsage();

  /**
   * RSS (Resident Set Size): Total memory allocated for the process
   * This includes all memory: heap, code segment, and stack
   */
  console.log(`RSS (Total Memory):    ${formatBytes(memUsage.rss)}`);
  console.log('  └─ Total memory allocated for the process');

  /**
   * Heap Total: Total size of the allocated heap
   * This is the memory V8 has allocated for JavaScript objects
   */
  console.log(`Heap Total:            ${formatBytes(memUsage.heapTotal)}`);
  console.log('  └─ Total heap allocated by V8');

  /**
   * Heap Used: Actual memory used by JavaScript objects
   * This is the portion of the heap that's actively being used
   */
  console.log(`Heap Used:             ${formatBytes(memUsage.heapUsed)}`);
  console.log('  └─ Actual heap memory in use');

  /**
   * External: Memory used by C++ objects bound to JavaScript objects
   * This includes Buffer memory managed outside V8's heap
   */
  console.log(`External:              ${formatBytes(memUsage.external)}`);
  console.log('  └─ Memory used by C++ objects');

  /**
   * Array Buffers: Memory allocated for ArrayBuffer and SharedArrayBuffer
   * Available in Node.js v13.9.0+
   */
  if (memUsage.arrayBuffers) {
    console.log(`Array Buffers:         ${formatBytes(memUsage.arrayBuffers)}`);
    console.log('  └─ Memory for ArrayBuffer instances');
  }

  // Calculate and display heap usage percentage
  const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(2);
  console.log(`\nHeap Usage:            ${heapUsagePercent}%`);
}

/**
 * Displays CPU usage statistics
 *
 * The cpuUsage() method returns the user and system CPU time consumed by the
 * current process, measured in microseconds. This is useful for performance
 * monitoring and optimization.
 */
function displayCPUUsage() {
  console.log('\n--- CPU Usage ---');

  // Get CPU usage snapshot
  const cpuUsage = process.cpuUsage();

  /**
   * User CPU time: Time spent executing user code (your JavaScript)
   * Measured in microseconds
   */
  console.log(`User CPU Time:         ${formatMicroseconds(cpuUsage.user)}`);
  console.log('  └─ Time spent in user code');

  /**
   * System CPU time: Time spent in system/kernel operations
   * This includes file I/O, network operations, etc.
   */
  console.log(`System CPU Time:       ${formatMicroseconds(cpuUsage.system)}`);
  console.log('  └─ Time spent in system calls');

  /**
   * Total CPU time: Sum of user and system time
   * Represents total CPU resources consumed by this process
   */
  const totalCpu = cpuUsage.user + cpuUsage.system;
  console.log(`Total CPU Time:        ${formatMicroseconds(totalCpu)}`);
  console.log('  └─ Total CPU time used');

  /**
   * CPU Usage Ratio: Compare user vs system time
   * High system time might indicate heavy I/O operations
   */
  if (totalCpu > 0) {
    const userPercent = (cpuUsage.user / totalCpu * 100).toFixed(2);
    const systemPercent = (cpuUsage.system / totalCpu * 100).toFixed(2);
    console.log(`\nCPU Time Distribution: ${userPercent}% user, ${systemPercent}% system`);
  }
}

/**
 * Displays additional useful process information
 *
 * This function demonstrates other useful process properties and methods
 * that can be helpful in real-world applications.
 */
function displayAdditionalInfo() {
  console.log('\n--- Additional Information ---');

  // Title of the process (as shown in process listings)
  console.log(`Process Title:         ${process.title}`);

  // Node.js release information
  console.log(`Release LTS:           ${process.release.lts || 'N/A'}`);

  // Environment variable count
  const envCount = Object.keys(process.env).length;
  console.log(`Environment Variables: ${envCount} defined`);

  // Feature flags
  const features = [];
  if (process.features.inspector) features.push('Inspector');
  if (process.features.debug) features.push('Debug');
  if (process.features.uv) features.push('libuv');
  if (process.features.ipv6) features.push('IPv6');
  if (process.features.tls_alpn) features.push('TLS-ALPN');
  if (process.features.tls_sni) features.push('TLS-SNI');

  console.log(`Enabled Features:      ${features.join(', ')}`);
}

/**
 * Main execution function
 *
 * This demonstrates a clean, organized approach to running multiple
 * information display functions with proper error handling.
 */
function main() {
  try {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║    System Information Tool - Solution      ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log();

    // Display all information sections
    displaySystemInfo();
    displayProcessInfo();
    displayMemoryUsage();
    displayCPUUsage();
    displayAdditionalInfo();

    console.log('\n' + '═'.repeat(46));
    console.log('Information gathered successfully!');
    console.log('═'.repeat(46));

  } catch (error) {
    // Handle any unexpected errors gracefully
    console.error('\n❌ Error gathering system information:', error.message);
    process.exit(1);
  }
}

// Execute the main function
main();

/**
 * LEARNING NOTES:
 *
 * 1. The process object is a global object available in all Node.js applications
 * 2. Most process properties are read-only snapshots of current state
 * 3. Some methods like memoryUsage() and cpuUsage() return new objects each time
 * 4. Memory values are always in bytes - convert to MB for readability
 * 5. CPU times are in microseconds - convert to milliseconds for readability
 * 6. Process information is useful for monitoring, debugging, and diagnostics
 *
 * BEST PRACTICES:
 *
 * 1. Create helper functions for common formatting operations
 * 2. Add descriptive comments explaining what each metric means
 * 3. Group related information together logically
 * 4. Use proper error handling even for information display
 * 5. Format output for human readability
 * 6. Consider adding visual elements (boxes, separators) for better UX
 *
 * COMMON USE CASES:
 *
 * 1. Health check endpoints in web applications
 * 2. Performance monitoring and profiling
 * 3. Debugging memory leaks
 * 4. System compatibility checks
 * 5. Application startup diagnostics
 * 6. Logging and telemetry systems
 */
