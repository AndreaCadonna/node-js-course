/**
 * 01-process-info.js
 * ==================
 * Demonstrates how to access basic process information using the process object
 *
 * Key Concepts:
 * - Reading process ID (PID)
 * - Accessing Node.js and V8 versions
 * - Detecting platform and architecture
 * - Getting current working directory and execution path
 * - Understanding process uptime
 *
 * Run: node 01-process-info.js
 */

console.log('=== Process Information Example ===\n');

// =============================================================================
// PROCESS IDENTIFICATION
// =============================================================================

console.log('--- Process Identification ---\n');

// process.pid: The process ID assigned by the operating system
// Every running process has a unique PID
console.log(`Process ID (PID): ${process.pid}`);

// process.ppid: The parent process ID
// This is the PID of the process that spawned this one
console.log(`Parent Process ID (PPID): ${process.ppid}`);

// On Linux/Mac, you can verify: ps -p <PID>
// On Windows, you can verify: tasklist /FI "PID eq <PID>"
console.log(`(Run "ps -p ${process.pid}" to see this process)\n`);

// =============================================================================
// VERSION INFORMATION
// =============================================================================

console.log('--- Version Information ---\n');

// process.version: The current Node.js version
console.log(`Node.js Version: ${process.version}`);

// process.versions: An object containing versions of Node.js and its dependencies
console.log('\nAll Version Information:');
console.log(`  Node.js: ${process.versions.node}`);
console.log(`  V8 Engine: ${process.versions.v8}`);
console.log(`  OpenSSL: ${process.versions.openssl}`);
console.log(`  libuv: ${process.versions.uv}`);
console.log(`  zlib: ${process.versions.zlib}`);

// Full versions object (contains many more components)
console.log('\nFull versions object:');
console.log(process.versions);
console.log();

// =============================================================================
// PLATFORM AND ARCHITECTURE
// =============================================================================

console.log('--- Platform and Architecture ---\n');

// process.platform: The operating system platform
// Possible values: 'darwin' (macOS), 'linux', 'win32' (Windows), 'freebsd', etc.
console.log(`Platform: ${process.platform}`);

// process.arch: The CPU architecture
// Possible values: 'x64', 'arm', 'arm64', 'ia32', etc.
console.log(`Architecture: ${process.arch}`);

// Practical example: Conditional logic based on platform
console.log('\nPlatform Detection:');
switch (process.platform) {
  case 'darwin':
    console.log('  Running on macOS');
    break;
  case 'linux':
    console.log('  Running on Linux');
    break;
  case 'win32':
    console.log('  Running on Windows');
    break;
  default:
    console.log(`  Running on ${process.platform}`);
}
console.log();

// =============================================================================
// EXECUTION PATHS AND DIRECTORIES
// =============================================================================

console.log('--- Execution Paths and Directories ---\n');

// process.cwd(): Returns the current working directory
// This is the directory from which the Node.js process was launched
console.log(`Current Working Directory: ${process.cwd()}`);

// process.execPath: The absolute path to the Node.js executable
// This is the path to the node binary that is running this script
console.log(`Node.js Executable Path: ${process.execPath}`);

// process.argv[1]: The path to the JavaScript file being executed
// (process.argv[0] is the node executable, argv[1] is the script)
console.log(`Script Path: ${process.argv[1]}`);

// __dirname vs process.cwd()
console.log(`\n__dirname (script's directory): ${__dirname}`);
console.log(`process.cwd() (launch directory): ${process.cwd()}`);
console.log('Note: These may differ if you run the script from a different directory\n');

// =============================================================================
// PROCESS TIMING
// =============================================================================

console.log('--- Process Timing ---\n');

// process.uptime(): Returns the number of seconds the process has been running
console.log(`Process Uptime: ${process.uptime().toFixed(3)} seconds`);

// process.hrtime(): High-resolution real time in [seconds, nanoseconds]
// Useful for measuring code execution time with nanosecond precision
const hrtime = process.hrtime();
console.log(`High-Resolution Time: ${hrtime[0]}s ${hrtime[1]}ns`);

// Example: Measuring execution time
console.log('\nMeasuring execution time...');
const startTime = process.hrtime();

// Simulate some work
let sum = 0;
for (let i = 0; i < 1000000; i++) {
  sum += i;
}

// Calculate elapsed time
const elapsed = process.hrtime(startTime);
const milliseconds = (elapsed[0] * 1000 + elapsed[1] / 1000000).toFixed(3);
console.log(`Operation took ${milliseconds}ms`);
console.log();

// =============================================================================
// RESOURCE USAGE
// =============================================================================

console.log('--- Resource Usage ---\n');

// process.memoryUsage(): Returns an object describing memory usage
const memoryUsage = process.memoryUsage();
console.log('Memory Usage:');
console.log(`  RSS (Resident Set Size): ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`  External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);

console.log('\nMemory Explanation:');
console.log('  • RSS: Total memory allocated for the process');
console.log('  • Heap Total: Total heap size available');
console.log('  • Heap Used: Actual memory used in the heap');
console.log('  • External: Memory used by C++ objects bound to JS objects');
console.log();

// process.cpuUsage(): Returns CPU usage in microseconds
const cpuUsage = process.cpuUsage();
console.log('CPU Usage:');
console.log(`  User: ${cpuUsage.user} microseconds`);
console.log(`  System: ${cpuUsage.system} microseconds`);
console.log('  (User: CPU time in user mode, System: CPU time in kernel mode)\n');

// =============================================================================
// RELEASE INFORMATION
// =============================================================================

console.log('--- Release Information ---\n');

// process.release: Information about the current Node.js release
console.log('Release Info:');
console.log(`  Name: ${process.release.name}`);
console.log(`  LTS: ${process.release.lts || 'Not an LTS release'}`);
console.log(`  Source URL: ${process.release.sourceUrl}`);
console.log(`  Headers URL: ${process.release.headersUrl}`);
console.log();

console.log('=== Key Takeaways ===');
console.log('• process.pid gives unique process identifier');
console.log('• process.platform and process.arch help write cross-platform code');
console.log('• process.cwd() shows where the process was launched from');
console.log('• process.memoryUsage() helps monitor memory consumption');
console.log('• process.hrtime() provides high-precision timing for benchmarks');

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * COMMON USE CASES:
 *
 * 1. Platform-Specific Code:
 *    if (process.platform === 'win32') {
 *      // Windows-specific code
 *    }
 *
 * 2. Memory Monitoring:
 *    setInterval(() => {
 *      const used = process.memoryUsage().heapUsed / 1024 / 1024;
 *      console.log(`Memory: ${used.toFixed(2)} MB`);
 *    }, 1000);
 *
 * 3. Performance Benchmarking:
 *    const start = process.hrtime();
 *    // ... code to measure
 *    const [seconds, nanoseconds] = process.hrtime(start);
 *    console.log(`Took ${seconds}s ${nanoseconds}ns`);
 *
 * 4. Process Identification (for logging):
 *    console.log(`[PID ${process.pid}] Application started`);
 *
 * 5. Version Checking:
 *    const nodeVersion = process.versions.node.split('.')[0];
 *    if (nodeVersion < 18) {
 *      console.error('Node.js 18+ required');
 *      process.exit(1);
 *    }
 */
