/**
 * Example 6: Error Handling in Child Processes
 *
 * Demonstrates comprehensive error handling patterns for child processes.
 * Covers spawn errors, runtime errors, timeouts, and graceful degradation.
 */

const { spawn, exec, execFile, fork } = require('child_process');

console.log('=== Child Process Error Handling ===\n');

// 1. Handling spawn errors
console.log('1. Handling spawn errors (command not found)');
const invalid = spawn('commandthatdoesnotexist');

invalid.on('error', (error) => {
  console.error('Spawn error occurred:');
  console.error(`  Error: ${error.message}`);
  console.error(`  Code: ${error.code}`);
  console.error(`  Syscall: ${error.syscall || 'N/A'}`);
  console.error('');
});

invalid.on('close', (code) => {
  console.log(`Process closed (code: ${code})\n`);
});

// 2. Handling runtime errors (exec)
setTimeout(() => {
  console.log('2. Handling runtime errors with exec()');
  exec('ls /nonexistent/directory', (error, stdout, stderr) => {
    if (error) {
      console.error('Runtime error:');
      console.error(`  Command: ${error.cmd}`);
      console.error(`  Exit code: ${error.code}`);
      console.error(`  Signal: ${error.signal || 'none'}`);
      console.error(`  Message: ${error.message}`);
      console.error(`  stderr: ${stderr}`);
      console.error('');
      return;
    }
    console.log(stdout);
  });
}, 500);

// 3. Handling stderr output
setTimeout(() => {
  console.log('3. Handling stderr (not always an error!)');
  const node = spawn('node', ['-e', 'console.error("Warning: test"); console.log("Success");']);

  let hasStderr = false;
  let exitCode = null;

  node.stderr.on('data', (data) => {
    hasStderr = true;
    console.log(`  stderr detected: ${data.toString().trim()}`);
  });

  node.stdout.on('data', (data) => {
    console.log(`  stdout: ${data.toString().trim()}`);
  });

  node.on('close', (code) => {
    exitCode = code;
    console.log(`  Exit code: ${code}`);
    console.log(`  Has stderr: ${hasStderr}`);
    console.log(`  Is error: ${code !== 0}`);
    console.log('  Note: stderr exists but exit code is 0 (success)\n');
  });
}, 1500);

// 4. Timeout handling
setTimeout(() => {
  console.log('4. Implementing timeout for long-running processes');
  const longProcess = spawn('sleep', ['10']);
  const timeout = 1000; // 1 second

  const timer = setTimeout(() => {
    console.log('  Timeout reached, killing process...');
    longProcess.kill('SIGTERM');
  }, timeout);

  longProcess.on('exit', (code, signal) => {
    clearTimeout(timer);
    console.log(`  Process terminated:`);
    console.log(`    Exit code: ${code}`);
    console.log(`    Signal: ${signal}`);
    console.log(`    Killed by timeout: ${signal === 'SIGTERM'}\n`);
  });
}, 3000);

// 5. Graceful error handling with fallback
setTimeout(() => {
  console.log('5. Graceful degradation with fallback');

  function executeWithFallback(primaryCmd, fallbackCmd) {
    return new Promise((resolve) => {
      exec(primaryCmd, (error, stdout, stderr) => {
        if (error) {
          console.log(`  Primary command failed: ${primaryCmd}`);
          console.log(`  Trying fallback: ${fallbackCmd}`);

          exec(fallbackCmd, (fallbackError, fallbackStdout) => {
            if (fallbackError) {
              console.log(`  Fallback also failed\n`);
              resolve(null);
            } else {
              console.log(`  Fallback succeeded\n`);
              resolve(fallbackStdout);
            }
          });
        } else {
          console.log(`  Primary command succeeded\n`);
          resolve(stdout);
        }
      });
    });
  }

  // Try non-existent command with fallback
  executeWithFallback('nonexistentcmd', 'echo "Fallback executed"');
}, 5500);

// 6. Handling maxBuffer exceeded
setTimeout(() => {
  console.log('6. Handling maxBuffer exceeded error');

  // This will fail because output exceeds maxBuffer
  exec('cat /dev/urandom | head -c 2000000', { maxBuffer: 1024 }, (error, stdout) => {
    if (error && error.message.includes('maxBuffer')) {
      console.error('  Error: maxBuffer exceeded');
      console.error(`  Max allowed: ${error.maxBuffer} bytes`);
      console.error('  Solution: Use spawn() for large output\n');

      // Proper solution using spawn
      console.log('  Using spawn() instead:');
      const cat = spawn('cat', ['/dev/urandom']);
      const head = spawn('head', ['-c', '2000000']);

      let bytesReceived = 0;

      cat.stdout.pipe(head.stdin);

      head.stdout.on('data', (chunk) => {
        bytesReceived += chunk.length;
      });

      head.on('close', () => {
        console.log(`  Successfully processed ${bytesReceived} bytes\n`);
      });

      // Stop cat after a short time
      setTimeout(() => cat.kill(), 100);
    }
  });
}, 7000);

// 7. Handling all error cases comprehensively
setTimeout(() => {
  console.log('7. Comprehensive error handling pattern');

  function safeExec(command, options = {}) {
    return new Promise((resolve, reject) => {
      const child = exec(command, options, (error, stdout, stderr) => {
        if (error) {
          reject({
            type: 'execution_error',
            message: error.message,
            code: error.code,
            signal: error.signal,
            stderr: stderr
          });
          return;
        }

        resolve({ stdout, stderr });
      });

      child.on('error', (error) => {
        reject({
          type: 'spawn_error',
          message: error.message,
          code: error.code
        });
      });
    });
  }

  // Test with failing command
  safeExec('exit 42')
    .then(({ stdout }) => {
      console.log('  Success:', stdout);
    })
    .catch((error) => {
      console.log('  Caught error:');
      console.log(`    Type: ${error.type}`);
      console.log(`    Message: ${error.message}`);
      console.log(`    Code: ${error.code}\n`);
    });
}, 8500);

// 8. Error handling with fork
setTimeout(() => {
  console.log('8. Error handling with fork()');

  // Try to fork non-existent file
  const child = fork('./nonexistent-worker.js');

  child.on('error', (error) => {
    console.log('  Fork error:');
    console.log(`    Message: ${error.message}`);
    console.log(`    Code: ${error.code}`);
  });

  child.on('exit', (code, signal) => {
    console.log(`  Child exit:`);
    console.log(`    Code: ${code}`);
    console.log(`    Signal: ${signal}\n`);

    showBestPractices();
  });
}, 9500);

function showBestPractices() {
  setTimeout(() => {
    console.log('=== Error Handling Best Practices ===\n');

    console.log('Always handle these error cases:');
    console.log('  1. "error" event - Spawn failure');
    console.log('  2. "exit" with non-zero code - Runtime failure');
    console.log('  3. stderr output - Warning or error messages');
    console.log('  4. Timeout - Process takes too long');
    console.log('  5. maxBuffer exceeded - Output too large');
    console.log('');

    console.log('Best practices:');
    console.log('  ✓ Always listen for "error" event');
    console.log('  ✓ Check exit codes in "exit" or "close" event');
    console.log('  ✓ Don\'t assume stderr means failure');
    console.log('  ✓ Implement timeouts for long operations');
    console.log('  ✓ Use spawn() for large output');
    console.log('  ✓ Validate input before passing to child process');
    console.log('  ✓ Provide fallback mechanisms');
    console.log('  ✓ Log errors for debugging');
    console.log('  ✓ Clean up resources (kill orphaned processes)');
    console.log('');

    console.log('Error types:');
    console.log('  • ENOENT - Command not found');
    console.log('  • EACCES - Permission denied');
    console.log('  • ETIMEDOUT - Operation timed out');
    console.log('  • maxBuffer exceeded - Output too large for exec()');
    console.log('  • Non-zero exit code - Command failed');
  }, 500);
}
