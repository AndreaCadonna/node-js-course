/**
 * Exercise 1: Basic Command Execution with exec()
 *
 * OBJECTIVE:
 * Learn to execute system commands using child_process.exec() and handle their output.
 *
 * REQUIREMENTS:
 * 1. Use child_process.exec() to run simple shell commands
 * 2. Display the command output
 * 3. Handle both stdout and stderr
 * 4. Implement proper error handling
 * 5. Execute multiple commands sequentially
 *
 * LEARNING GOALS:
 * - Understanding exec() and its use cases
 * - Working with command output (stdout/stderr)
 * - Handling command execution errors
 * - Understanding the exec() callback pattern
 * - Managing command timeouts and buffer sizes
 */

const { exec } = require('child_process');

/**
 * TODO 1: Implement function to execute a single command
 *
 * Steps:
 * 1. Use exec() to run the command
 * 2. Handle the callback with (error, stdout, stderr)
 * 3. If error exists, log error message
 * 4. If stderr has content, log it
 * 5. Log stdout to display command output
 * 6. Return a promise for easier chaining
 *
 * Hint: Wrap exec() in a Promise for better async handling
 */
function executeCommand(command) {
  console.log(`Executing: ${command}`);
  // Your code here

  // Example structure:
  // return new Promise((resolve, reject) => {
  //   exec(command, (error, stdout, stderr) => {
  //     // Handle error, stdout, stderr
  //   });
  // });
}

/**
 * TODO 2: Implement function to get system information
 *
 * Steps:
 * 1. Execute a command to display system info
 *    - Linux/Mac: 'uname -a' or 'date'
 *    - Windows: 'ver' or 'echo %DATE% %TIME%'
 * 2. Return the output
 * 3. Handle any errors gracefully
 *
 * Hint: Use process.platform to detect the OS
 */
async function getSystemInfo() {
  // Your code here
  // Determine command based on platform
  // Execute and return result
}

/**
 * TODO 3: Implement function to list directory contents
 *
 * Steps:
 * 1. Execute 'ls -la' (Unix) or 'dir' (Windows)
 * 2. Display the directory listing
 * 3. Count the number of files/directories
 * 4. Handle errors if directory doesn't exist
 */
async function listDirectory(directory = '.') {
  // Your code here
  // Build command based on platform
  // Execute and process output
}

/**
 * TODO 4: Implement function with timeout
 *
 * Steps:
 * 1. Use exec() with options parameter
 * 2. Set a timeout (e.g., 5000ms)
 * 3. Set maxBuffer size (e.g., 1024 * 500)
 * 4. Handle timeout errors specifically
 *
 * Example options:
 * const options = {
 *   timeout: 5000,
 *   maxBuffer: 1024 * 500
 * };
 */
async function executeWithTimeout(command, timeoutMs = 5000) {
  // Your code here
  // Pass options to exec()
}

/**
 * TODO 5: Implement function to execute multiple commands
 *
 * Steps:
 * 1. Create an array of commands
 * 2. Execute each command sequentially using await
 * 3. Collect all outputs
 * 4. Return summary of results
 *
 * Hint: Use for...of loop with await
 */
async function executeMultipleCommands(commands) {
  console.log('Executing multiple commands...\n');
  const results = [];

  // Your code here
  // Loop through commands and execute each one

  return results;
}

/**
 * TODO 6: Main function to run all examples
 *
 * Steps:
 * 1. Call getSystemInfo()
 * 2. Call listDirectory()
 * 3. Try executeWithTimeout() with a quick command
 * 4. Execute multiple commands
 * 5. Wrap everything in try-catch
 */
async function main() {
  console.log('=== Child Process exec() Exercise ===\n');

  try {
    // Your code here
    // Call the functions you implemented above

    console.log('\n=== Exercise Complete ===');
  } catch (error) {
    console.error('Error in main:', error.message);
  }
}

// Uncomment to run
// main();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Run your solution:
 *    node exercise-1.js
 *
 * 2. Expected behaviors:
 *    - Should display system information
 *    - Should list current directory contents
 *    - Should handle errors gracefully
 *    - Should execute multiple commands successfully
 *
 * 3. Test error handling:
 *    - Try executing an invalid command
 *    - Try with a very short timeout
 *    - Try listing a non-existent directory
 *
 * EXAMPLE OUTPUT:
 * ─────────────────────────────────────
 * === Child Process exec() Exercise ===
 *
 * Executing: date
 * Tue Nov 19 10:30:45 UTC 2024
 *
 * Executing: ls -la
 * total 48
 * drwxr-xr-x 2 root root 4096 Nov 19 10:30 .
 * drwxr-xr-x 5 root root 4096 Nov 19 10:25 ..
 * ...
 * ─────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - What is the difference between exec() and execSync()?
 * - Why do we need to handle stderr separately from error?
 * - What happens when a command times out?
 * - What is maxBuffer and when is it important?
 * - When should you use exec() vs other child_process methods?
 *
 * Key Takeaways:
 * 1. exec() buffers all output in memory
 * 2. It spawns a shell to execute the command
 * 3. Best for small output and simple commands
 * 4. Always set appropriate timeouts
 * 5. Handle errors, stdout, and stderr separately
 */
