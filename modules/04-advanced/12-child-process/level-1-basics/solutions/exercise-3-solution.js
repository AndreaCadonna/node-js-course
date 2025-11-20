/**
 * SOLUTION: Exercise 3 - Handling Errors Properly
 *
 * Comprehensive error handling for child processes covering all failure modes.
 */

const { spawn } = require('child_process');

/**
 * Handle command not found (ENOENT)
 */
async function handleCommandNotFound() {
  console.log('\n=== Testing ENOENT Error ===');

  return new Promise((resolve, reject) => {
    const child = spawn('nonexistent-command-123');

    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        console.log('✓ Caught ENOENT: Command not found');
        console.log('💡 Suggestion: Check if command is installed and in PATH');
        resolve({ error: 'ENOENT', handled: true });
      } else {
        reject(error);
      }
    });
  });
}

/**
 * Handle non-zero exit codes
 */
function handleExitCode(command, args = []) {
  console.log(`\n=== Testing Exit Code: ${command} ${args.join(' ')} ===`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let stderr = '';

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code, signal) => {
      console.log(`Exit code: ${code}, Signal: ${signal}`);

      if (code === 0) {
        resolve({ success: true });
      } else {
        const errorMsg = getExitCodeMessage(code);
        console.log(`❌ ${errorMsg}`);
        console.log(`stderr: ${stderr}`);
        resolve({ success: false, code, message: errorMsg });
      }
    });

    child.on('error', reject);
  });
}

function getExitCodeMessage(code) {
  const messages = {
    1: 'General error',
    2: 'Misuse of shell command',
    126: 'Command cannot execute',
    127: 'Command not found',
    130: 'Terminated by Ctrl+C'
  };
  return messages[code] || `Unknown error (code ${code})`;
}

/**
 * Handle timeout
 */
function handleTimeout(command, args, timeoutMs) {
  console.log(`\n=== Testing Timeout (${timeoutMs}ms) ===`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      console.log('⏱️  Timeout reached, killing process...');
      child.kill('SIGTERM');

      // Force kill after 1 second if still alive
      setTimeout(() => {
        if (!child.killed) {
          console.log('💀 Force killing with SIGKILL');
          child.kill('SIGKILL');
        }
      }, 1000);
    }, timeoutMs);

    child.on('close', (code, signal) => {
      clearTimeout(timeout);

      if (timedOut) {
        console.log('✓ Process killed due to timeout');
        resolve({ timedOut: true, signal });
      } else {
        console.log('✓ Process completed before timeout');
        resolve({ timedOut: false, code });
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

/**
 * Execute with comprehensive error handling
 */
function executeWithErrorHandling(command, args = [], options = {}) {
  const { timeout = null } = options;

  return new Promise((resolve, reject) => {
    console.log(`\n▶ Executing: ${command} ${args.join(' ')}`);

    const child = spawn(command, args);
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let timeoutHandle;

    if (timeout) {
      timeoutHandle = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 1000);
      }, timeout);
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);

      if (error.code === 'ENOENT') {
        reject(new Error(`Command not found: ${command}`));
      } else {
        reject(error);
      }
    });

    child.on('close', (code, signal) => {
      if (timeoutHandle) clearTimeout(timeoutHandle);

      if (timedOut) {
        reject(new Error(`Command timed out after ${timeout}ms`));
      } else if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
      } else {
        resolve({ stdout, stderr, code });
      }
    });
  });
}

/**
 * Retry mechanism with exponential backoff
 */
async function executeWithRetry(command, args, maxRetries = 3) {
  console.log(`\n=== Retry Mechanism (max ${maxRetries} attempts) ===`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\nAttempt ${attempt}/${maxRetries}...`);

      const result = await executeWithErrorHandling(command, args, {
        timeout: 5000
      });

      console.log(`✓ Success on attempt ${attempt}`);
      return result;

    } catch (error) {
      console.log(`✗ Attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }
    }
  }
}

/**
 * Main demo
 */
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Child Process Error Handling Solution    ║');
  console.log('╚════════════════════════════════════════════╝');

  // Test 1: Command not found
  try {
    await handleCommandNotFound();
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }

  // Test 2: Exit code
  await handleExitCode('ls', ['/nonexistent-directory-123']);

  // Test 3: Timeout
  await handleTimeout('sleep', ['5'], 2000);

  // Test 4: Comprehensive error handling
  try {
    await executeWithErrorHandling('node', ['--version']);
    console.log('✓ Command succeeded');
  } catch (error) {
    console.error('Command failed:', error.message);
  }

  // Test 5: Retry
  try {
    await executeWithRetry('node', ['--version'], 3);
  } catch (error) {
    console.error('Final error:', error.message);
  }

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║         Exercise Complete ✓                ║');
  console.log('╚════════════════════════════════════════════╝');
}

if (require.main === module) {
  main();
}

module.exports = {
  handleCommandNotFound,
  handleExitCode,
  handleTimeout,
  executeWithErrorHandling,
  executeWithRetry
};
