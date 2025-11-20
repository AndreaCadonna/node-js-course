/**
 * Exercise 3: Handling Errors Properly
 *
 * OBJECTIVE:
 * Master error handling in child processes to build robust applications.
 *
 * REQUIREMENTS:
 * 1. Handle command not found errors
 * 2. Handle command execution errors (non-zero exit codes)
 * 3. Handle timeout errors
 * 4. Handle signal termination (SIGTERM, SIGKILL)
 * 5. Distinguish between different error types
 * 6. Provide meaningful error messages
 *
 * LEARNING GOALS:
 * - Understanding different types of child process errors
 * - Handling spawn ENOENT errors
 * - Managing non-zero exit codes
 * - Dealing with timeouts and signals
 * - Building robust error handling patterns
 */

const { exec, spawn, execFile } = require('child_process');

/**
 * TODO 1: Implement function to handle command not found
 *
 * Steps:
 * 1. Try to execute a non-existent command
 * 2. Catch and identify ENOENT error (command not found)
 * 3. Provide user-friendly error message
 * 4. Return error details
 *
 * Common error: ENOENT means "Error NO ENTry" - command not found
 */
async function handleCommandNotFound() {
  console.log('Testing command not found error...');

  return new Promise((resolve, reject) => {
    // Your code here
    // Try to spawn a non-existent command like 'nonexistentcommand123'
    // Handle the 'error' event specifically
    // Check if error.code === 'ENOENT'
  });
}

/**
 * TODO 2: Implement function to handle non-zero exit codes
 *
 * Steps:
 * 1. Execute a command that will fail (e.g., 'ls /nonexistent')
 * 2. Check the exit code in the 'close' or 'exit' event
 * 3. Distinguish between different exit codes
 * 4. Provide appropriate error messages
 *
 * Exit codes:
 * - 0: Success
 * - 1: General error
 * - 2: Misuse of shell command
 * - 126: Command cannot execute
 * - 127: Command not found
 * - 130: Terminated by Ctrl+C
 */
function handleExitCode(command, args = []) {
  return new Promise((resolve, reject) => {
    // Your code here
    // Spawn the command
    // Listen to 'close' event
    // Check the exit code
    // Provide meaningful error messages based on code
  });
}

/**
 * TODO 3: Implement function with timeout handling
 *
 * Steps:
 * 1. Spawn a long-running command
 * 2. Set a timeout using setTimeout
 * 3. Kill the process if it times out
 * 4. Distinguish timeout errors from other errors
 * 5. Clean up properly
 *
 * Hint: Use child.kill() or child.kill('SIGTERM')
 */
function handleTimeout(command, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    let timedOut = false;

    // Your code here
    // const child = spawn(command, args);
    //
    // const timeout = setTimeout(() => {
    //   timedOut = true;
    //   child.kill();
    //   reject(new Error(`Command timed out after ${timeoutMs}ms`));
    // }, timeoutMs);
    //
    // child.on('close', (code) => {
    //   clearTimeout(timeout);
    //   if (!timedOut) {
    //     // Handle normal completion
    //   }
    // });
  });
}

/**
 * TODO 4: Implement function to handle signals
 *
 * Steps:
 * 1. Spawn a process
 * 2. Send different signals to it (SIGTERM, SIGKILL)
 * 3. Detect which signal terminated the process
 * 4. Handle cleanup appropriately
 *
 * Signals:
 * - SIGTERM: Graceful termination request
 * - SIGKILL: Forceful termination (cannot be caught)
 * - SIGINT: Interrupt (Ctrl+C)
 */
function handleSignals(command, args, signal = 'SIGTERM') {
  return new Promise((resolve, reject) => {
    // Your code here
    // Spawn process
    // After a delay, send signal: child.kill(signal)
    // Check exit code and signal in close event
    // Note: exit code null and signal set means killed by signal
  });
}

/**
 * TODO 5: Implement comprehensive error handler
 *
 * Steps:
 * 1. Create a wrapper that handles all error types
 * 2. Distinguish between:
 *    - Spawn errors (ENOENT)
 *    - Exit code errors
 *    - Timeout errors
 *    - Signal termination
 * 3. Provide appropriate error messages for each
 * 4. Include error recovery suggestions
 */
function executeWithErrorHandling(command, args = [], options = {}) {
  const { timeout = null, maxBuffer = 1024 * 1024 } = options;

  return new Promise((resolve, reject) => {
    let output = '';
    let errorOutput = '';
    let timedOut = false;
    let timeoutHandle;

    // Your code here
    // Create robust error handling for all cases
    // const child = spawn(command, args);
    //
    // if (timeout) {
    //   timeoutHandle = setTimeout(() => {
    //     timedOut = true;
    //     child.kill('SIGTERM');
    //     setTimeout(() => child.kill('SIGKILL'), 1000);
    //   }, timeout);
    // }
    //
    // child.stdout.on('data', (data) => {
    //   // Handle output
    // });
    //
    // child.stderr.on('data', (data) => {
    //   // Handle errors
    // });
    //
    // child.on('error', (err) => {
    //   // Handle spawn errors
    // });
    //
    // child.on('close', (code, signal) => {
    //   // Handle completion/errors
    // });
  });
}

/**
 * TODO 6: Implement error recovery mechanism
 *
 * Steps:
 * 1. Try to execute a command
 * 2. If it fails, retry with backoff
 * 3. Limit number of retries
 * 4. Log each attempt
 * 5. Give up after max retries
 */
async function executeWithRetry(command, args, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}...`);

      // Your code here
      // Try to execute the command
      // If successful, return result
      // If failed, catch error and continue to next iteration

      // Add exponential backoff delay between retries
      // await new Promise(resolve => setTimeout(resolve, attempt * 1000));

    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        const delay = attempt * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        // await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * TODO 7: Main function to demonstrate all error handling
 */
async function main() {
  console.log('=== Child Process Error Handling Exercise ===\n');

  // Test 1: Command not found
  console.log('1. Testing command not found...');
  try {
    // await handleCommandNotFound();
  } catch (error) {
    console.error('Caught error:', error.message);
  }

  // Test 2: Non-zero exit code
  console.log('\n2. Testing exit code handling...');
  try {
    // await handleExitCode('ls', ['/nonexistent/directory']);
  } catch (error) {
    console.error('Caught error:', error.message);
  }

  // Test 3: Timeout
  console.log('\n3. Testing timeout...');
  try {
    // await handleTimeout('sleep', ['10'], 2000);
  } catch (error) {
    console.error('Caught error:', error.message);
  }

  // Test 4: Signal handling
  console.log('\n4. Testing signal handling...');
  try {
    // await handleSignals('sleep', ['5'], 'SIGTERM');
  } catch (error) {
    console.error('Caught error:', error.message);
  }

  // Test 5: Comprehensive error handling
  console.log('\n5. Testing comprehensive error handling...');
  try {
    // await executeWithErrorHandling('node', ['--version']);
  } catch (error) {
    console.error('Caught error:', error.message);
  }

  // Test 6: Retry mechanism
  console.log('\n6. Testing retry mechanism...');
  try {
    // Simulate unreliable command (use a command that might fail)
    // await executeWithRetry('node', ['--version'], 3);
  } catch (error) {
    console.error('Final error:', error.message);
  }

  console.log('\n=== Exercise Complete ===');
}

// Uncomment to run
// main();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Run your solution:
 *    node exercise-3.js
 *
 * 2. Expected behaviors:
 *    - Should catch and identify ENOENT errors
 *    - Should handle non-zero exit codes
 *    - Should timeout long-running commands
 *    - Should handle signal termination
 *    - Should provide clear error messages
 *    - Should retry failed commands
 *
 * 3. Test scenarios:
 *    - Command not found
 *    - Permission denied
 *    - Invalid arguments
 *    - Timeout
 *    - Signal termination
 *
 * EXAMPLE OUTPUT:
 * ─────────────────────────────────────
 * === Child Process Error Handling Exercise ===
 *
 * 1. Testing command not found...
 * Caught error: Command not found: nonexistentcommand123
 * Suggestion: Check if the command is installed
 *
 * 2. Testing exit code handling...
 * Command failed with exit code 1
 * Caught error: Directory not found: /nonexistent/directory
 *
 * 3. Testing timeout...
 * Process killed due to timeout
 * Caught error: Command timed out after 2000ms
 * ─────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - What is ENOENT and when does it occur?
 * - What's the difference between 'exit' and 'close' events?
 * - How do you distinguish timeout from other errors?
 * - What signals can you send to processes?
 * - When should you retry failed commands?
 *
 * Key Takeaways:
 * 1. Always handle the 'error' event on child processes
 * 2. Check exit codes in 'close' event (code 0 = success)
 * 3. ENOENT error means command not found in PATH
 * 4. Use timeouts to prevent hanging processes
 * 5. SIGTERM is graceful, SIGKILL is forceful
 * 6. Clean up timeouts to prevent memory leaks
 * 7. Provide helpful error messages with recovery suggestions
 * 8. Use exponential backoff for retries
 */
