/**
 * Exercise 1: System Information Tool
 *
 * OBJECTIVE:
 * Learn to access and display process and system information using the process object.
 *
 * REQUIREMENTS:
 * 1. Display Node.js version and platform information
 * 2. Show process ID (PID) and parent process ID (PPID)
 * 3. Display current working directory and execution path
 * 4. Show memory usage statistics
 * 5. Display CPU usage information
 * 6. Format output in a readable table format
 *
 * LEARNING GOALS:
 * - Understanding the process object
 * - Accessing process properties (pid, ppid, version, platform)
 * - Reading memory usage with process.memoryUsage()
 * - Working with process.cpuUsage()
 * - Formatting output for better readability
 */

/**
 * TODO 1: Implement function to display Node.js and system information
 *
 * Steps:
 * 1. Get Node.js version using process.version
 * 2. Get platform using process.platform
 * 3. Get architecture using process.arch
 * 4. Get Node.js installation path using process.execPath
 * 5. Display all information with clear labels
 */
function displaySystemInfo() {
  console.log('--- System Information ---');
  // Your code here
}

/**
 * TODO 2: Implement function to display process information
 *
 * Steps:
 * 1. Get process ID using process.pid
 * 2. Get parent process ID using process.ppid
 * 3. Get current working directory using process.cwd()
 * 4. Get process uptime using process.uptime()
 * 5. Display all information with clear labels
 *
 * Hint: Format uptime in seconds with 2 decimal places
 */
function displayProcessInfo() {
  console.log('\n--- Process Information ---');
  // Your code here
}

/**
 * TODO 3: Implement function to display memory usage
 *
 * Steps:
 * 1. Get memory usage object using process.memoryUsage()
 * 2. The object contains: rss, heapTotal, heapUsed, external
 * 3. Convert bytes to megabytes (divide by 1024 * 1024)
 * 4. Display each memory metric with 2 decimal places
 * 5. Add brief descriptions of what each metric means
 *
 * Memory metrics:
 * - rss: Resident Set Size (total memory allocated)
 * - heapTotal: Total heap allocated
 * - heapUsed: Actual heap used
 * - external: Memory used by C++ objects
 */
function displayMemoryUsage() {
  console.log('\n--- Memory Usage ---');
  // Your code here
}

/**
 * TODO 4: Implement function to display CPU usage
 *
 * Steps:
 * 1. Get CPU usage using process.cpuUsage()
 * 2. The object contains: user and system (both in microseconds)
 * 3. Convert microseconds to milliseconds (divide by 1000)
 * 4. Display both user and system CPU time
 * 5. Calculate and display total CPU time
 *
 * CPU metrics:
 * - user: CPU time spent in user code
 * - system: CPU time spent in system code
 */
function displayCPUUsage() {
  console.log('\n--- CPU Usage ---');
  // Your code here
}

/**
 * TODO 5: Implement helper function to format bytes to MB
 *
 * Steps:
 * 1. Take bytes as parameter
 * 2. Divide by (1024 * 1024) to convert to megabytes
 * 3. Return formatted string with 2 decimal places and 'MB' suffix
 */
function formatBytes(bytes) {
  // Your code here
}

// TODO 6: Run the program
// Call all display functions to show complete system information

console.log('=== System Information Tool ===\n');

// Call your functions here
