/**
 * SOLUTION: Exercise 1 - Basic Command Execution with exec()
 *
 * This solution demonstrates comprehensive usage of child_process.exec() to execute
 * shell commands, handle output, manage errors, and work with multiple commands.
 *
 * KEY CONCEPTS DEMONSTRATED:
 * - Using exec() with callbacks and promises
 * - Handling stdout, stderr, and errors
 * - Setting timeouts and maxBuffer options
 * - Executing commands sequentially
 * - Platform-specific command handling
 * - Comprehensive error handling
 *
 * PRODUCTION FEATURES:
 * - Promise-based for clean async/await usage
 * - Platform detection for cross-platform compatibility
 * - Proper error categorization
 * - Resource management with timeouts
 * - User-friendly output formatting
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');

// Convert exec to promise-based
const execAsync = promisify(exec);

/**
 * Execute a single command with proper error handling
 *
 * @param {string} command - Command to execute
 * @param {object} options - Execution options
 * @returns {Promise<string>} Command output
 */
async function executeCommand(command, options = {}) {
  console.log(`\n▶ Executing: ${command}`);

  const defaultOptions = {
    timeout: 30000,      // 30 seconds
    maxBuffer: 1024 * 500 // 500 KB
  };

  try {
    const { stdout, stderr } = await execAsync(command, {
      ...defaultOptions,
      ...options
    });

    // Handle stderr (warnings/info messages)
    if (stderr) {
      console.warn('⚠️  Warnings/Info:', stderr.trim());
    }

    // Return trimmed stdout
    const output = stdout.trim();
    console.log('✓ Output:', output.substring(0, 200) + (output.length > 200 ? '...' : ''));
    return output;

  } catch (error) {
    // Categorize errors for better handling
    if (error.killed) {
      throw new Error(`Command timed out after ${options.timeout || defaultOptions.timeout}ms`);
    }

    if (error.code) {
      throw new Error(`Command failed (exit code ${error.code}): ${error.message}`);
    }

    throw error;
  }
}

/**
 * Get system information using platform-appropriate commands
 *
 * @returns {Promise<object>} System information
 */
async function getSystemInfo() {
  console.log('\n=== Getting System Information ===');

  const platform = os.platform();
  const info = {
    platform,
    node: process.version
  };

  try {
    // Platform-specific commands
    if (platform === 'linux' || platform === 'darwin') {
      // Get current date/time
      info.date = await executeCommand('date');

      // Get username
      info.user = await executeCommand('whoami');

      // Get hostname
      info.hostname = await executeCommand('hostname');

      // Get uptime
      info.uptime = await executeCommand('uptime');

    } else if (platform === 'win32') {
      // Windows commands
      info.date = await executeCommand('echo %DATE% %TIME%');
      info.user = await executeCommand('echo %USERNAME%');
      info.hostname = await executeCommand('hostname');
    }

    console.log('\n📊 System Information:');
    console.log('  Platform:', info.platform);
    console.log('  Node.js:', info.node);
    console.log('  Date:', info.date);
    console.log('  User:', info.user);
    console.log('  Hostname:', info.hostname);
    if (info.uptime) console.log('  Uptime:', info.uptime);

    return info;

  } catch (error) {
    console.error('Failed to get system info:', error.message);
    return info;
  }
}

/**
 * List directory contents with file count
 *
 * @param {string} directory - Directory to list
 * @returns {Promise<object>} Directory listing info
 */
async function listDirectory(directory = '.') {
  console.log(`\n=== Listing Directory: ${directory} ===`);

  const platform = os.platform();
  let command;

  // Platform-specific directory listing command
  if (platform === 'win32') {
    command = `dir "${directory}"`;
  } else {
    command = `ls -la "${directory}"`;
  }

  try {
    const output = await executeCommand(command);

    // Count lines (approximate file count)
    const lines = output.split('\n');
    const fileCount = lines.length - (platform === 'win32' ? 5 : 3); // Subtract header lines

    console.log(`\n📁 Directory Contents:`);
    console.log(output.substring(0, 500) + (output.length > 500 ? '\n...(truncated)' : ''));
    console.log(`\n📊 Approximate file count: ${fileCount}`);

    return {
      directory,
      output,
      fileCount,
      totalLines: lines.length
    };

  } catch (error) {
    console.error(`Failed to list directory ${directory}:`, error.message);
    throw error;
  }
}

/**
 * Execute command with custom timeout
 *
 * @param {string} command - Command to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<string>} Command output
 */
async function executeWithTimeout(command, timeoutMs = 5000) {
  console.log(`\n=== Executing with ${timeoutMs}ms timeout ===`);

  try {
    const output = await executeCommand(command, {
      timeout: timeoutMs,
      maxBuffer: 1024 * 500
    });

    console.log(`✓ Completed within timeout`);
    return output;

  } catch (error) {
    if (error.message.includes('timed out')) {
      console.error(`❌ Command timed out after ${timeoutMs}ms`);
    } else {
      console.error(`❌ Command failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Execute multiple commands sequentially
 *
 * @param {Array<string>} commands - Array of commands to execute
 * @returns {Promise<Array<object>>} Results from all commands
 */
async function executeMultipleCommands(commands) {
  console.log('\n=== Executing Multiple Commands ===');
  console.log(`Total commands: ${commands.length}\n`);

  const results = [];

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    console.log(`\n[${i + 1}/${commands.length}] ${command}`);

    try {
      const startTime = Date.now();
      const output = await executeCommand(command);
      const duration = Date.now() - startTime;

      results.push({
        command,
        success: true,
        output,
        duration
      });

      console.log(`  ⏱️  Duration: ${duration}ms`);

    } catch (error) {
      results.push({
        command,
        success: false,
        error: error.message
      });

      console.error(`  ❌ Failed: ${error.message}`);
    }
  }

  // Print summary
  console.log('\n=== Execution Summary ===');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`✓ Successful: ${successful}`);
  console.log(`✗ Failed: ${failed}`);

  return results;
}

/**
 * Demonstrate Git operations (if git is available)
 */
async function demonstrateGitOperations() {
  console.log('\n=== Git Operations Demo ===');

  try {
    // Check if git is available
    await executeCommand('git --version');

    // Try various git commands (will work in git repo)
    try {
      const branch = await executeCommand('git branch --show-current');
      console.log(`Current branch: ${branch}`);

      const status = await executeCommand('git status --short');
      if (status) {
        console.log('Modified files:', status.split('\n').length);
      } else {
        console.log('No changes detected');
      }
    } catch (error) {
      console.log('Not a git repository or no git configured');
    }

  } catch (error) {
    console.log('Git not available on this system');
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Child Process exec() - Solution Demo     ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    // 1. Get system information
    await getSystemInfo();

    // 2. List current directory
    await listDirectory('.');

    // 3. Execute with timeout
    const platform = os.platform();
    const quickCommand = platform === 'win32' ? 'echo Hello' : 'echo "Hello World"';
    await executeWithTimeout(quickCommand, 5000);

    // 4. Execute multiple commands
    const commands = [
      platform === 'win32' ? 'node --version' : 'node --version',
      platform === 'win32' ? 'npm --version' : 'npm --version',
      platform === 'win32' ? 'echo %PATH%' : 'echo $PATH | head -c 100'
    ];
    await executeMultipleCommands(commands);

    // 5. Git operations (if available)
    await demonstrateGitOperations();

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║         Exercise Complete ✓                ║');
    console.log('╚════════════════════════════════════════════╝');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

// Export for testing
module.exports = {
  executeCommand,
  getSystemInfo,
  listDirectory,
  executeWithTimeout,
  executeMultipleCommands
};

/**
 * LEARNING NOTES:
 *
 * 1. exec() vs execSync():
 *    - exec() is asynchronous (non-blocking)
 *    - execSync() blocks until command completes
 *    - Always prefer exec() in servers/async code
 *
 * 2. Error Handling:
 *    - error object contains: code, killed, signal, cmd
 *    - stderr can contain warnings, not just errors
 *    - Always check both error and stderr
 *
 * 3. Timeouts:
 *    - Prevent hanging on unresponsive commands
 *    - Command is killed with SIGTERM
 *    - error.killed will be true for timeouts
 *
 * 4. maxBuffer:
 *    - Default is 1 MB
 *    - Increase for commands with large output
 *    - Consider spawn() if output is very large
 *
 * 5. Platform Differences:
 *    - Windows uses cmd.exe
 *    - Unix uses /bin/sh
 *    - Commands differ between platforms
 *    - Use os.platform() for cross-platform code
 *
 * BEST PRACTICES APPLIED:
 *
 * ✓ Promise-based async/await for clean code
 * ✓ Comprehensive error handling
 * ✓ Platform-specific command handling
 * ✓ Appropriate timeouts to prevent hanging
 * ✓ User-friendly output with emojis and formatting
 * ✓ Modular functions for reusability
 * ✓ Detailed logging for debugging
 * ✓ Resource management (buffers, timeouts)
 *
 * PRODUCTION CONSIDERATIONS:
 *
 * 1. Security:
 *    - Never pass unsanitized user input to exec()
 *    - Use execFile() for user-provided data
 *    - Validate all inputs
 *
 * 2. Performance:
 *    - exec() spawns a shell (overhead)
 *    - Use execFile() for better performance
 *    - Use spawn() for large output
 *
 * 3. Error Recovery:
 *    - Implement retry logic for transient failures
 *    - Log errors for monitoring
 *    - Provide fallbacks when possible
 *
 * 4. Testing:
 *    - Mock exec() in tests
 *    - Test error scenarios
 *    - Test platform-specific code
 */
