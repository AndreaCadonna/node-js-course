/**
 * Example 3: Basic execFile() Usage
 *
 * Demonstrates how to execute files directly using execFile().
 * execFile() is more secure than exec() as it doesn't use a shell.
 */

const { execFile } = require('child_process');

console.log('=== Basic execFile() Examples ===\n');

// 1. Simple file execution
console.log('1. Execute node directly');
execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.log(`Node.js version: ${stdout.trim()}`);
});

// 2. Execute with arguments
setTimeout(() => {
  console.log('\n2. Execute ls with arguments');
  execFile('ls', ['-lh', '.'], (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log('Files in current directory:');
    console.log(stdout);
  });
}, 500);

// 3. Execute a specific executable
setTimeout(() => {
  console.log('3. Execute specific executable');
  execFile('/usr/bin/env', ['node', '--version'], (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log(`Output: ${stdout.trim()}`);
  });
}, 1000);

// 4. With custom options
setTimeout(() => {
  console.log('\n4. Execute with custom options');
  execFile('ls', ['-lh'], {
    cwd: process.cwd(),
    timeout: 5000,
    maxBuffer: 1024 * 1024,
    env: process.env,
  }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log('Files (with custom options):');
    console.log(stdout);
  });
}, 1500);

// 5. Handling stderr
setTimeout(() => {
  console.log('5. Handling stderr output');
  execFile('node', ['-e', 'console.error("Error message"); console.log("Normal output")'],
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      console.log(`stdout: ${stdout.trim()}`);
      console.log(`stderr: ${stderr.trim()}`);
    }
  );
}, 2000);

// 6. Handling execution errors
setTimeout(() => {
  console.log('\n6. Handling execution errors');
  execFile('invalid-command', [], (error, stdout, stderr) => {
    if (error) {
      console.error('Expected error:');
      console.error(`  Message: ${error.message}`);
      console.error(`  Code: ${error.code}`);
      console.error(`  Path: ${error.path || 'N/A'}`);
    }
  });
}, 2500);

// 7. Execute with timeout
setTimeout(() => {
  console.log('\n7. Execute with timeout');
  execFile('sleep', ['10'], {
    timeout: 1000, // Kill after 1 second
  }, (error, stdout, stderr) => {
    if (error) {
      console.error('Process killed due to timeout:');
      console.error(`  Signal: ${error.signal}`);
      console.error(`  Killed: ${error.killed}`);
    }
  });
}, 3000);

// 8. Security comparison
setTimeout(() => {
  console.log('\n8. Security comparison (execFile vs exec)');
  console.log('execFile is SAFE from shell injection because:');
  console.log('  ✓ Does not spawn a shell');
  console.log('  ✓ Arguments are passed directly to the executable');
  console.log('  ✓ No interpretation of shell metacharacters');
  console.log('');

  // This is safe even with malicious input
  const userInput = 'file.txt; rm -rf /';
  console.log(`User input: "${userInput}"`);

  execFile('echo', [userInput], (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log(`Safe output: ${stdout.trim()}`);
    console.log('✓ Malicious input was treated as literal string\n');
  });
}, 4500);

// 9. Execute Node.js script
setTimeout(() => {
  console.log('9. Execute Node.js script');
  execFile('node', ['-e', 'console.log("Hello from inline script")'],
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      console.log(`Script output: ${stdout.trim()}`);
    }
  );
}, 5500);

// Important notes
setTimeout(() => {
  console.log('\n=== Important Notes ===');
  console.log('✓ execFile() executes a file directly (no shell)');
  console.log('✓ More secure than exec() - no shell injection risk');
  console.log('✓ Faster than exec() - no shell overhead');
  console.log('✓ Output is buffered like exec()');
  console.log('✓ Cannot use shell features (pipes, redirects)');
  console.log('✓ Arguments must be in array format');
  console.log('✓ Best for executing specific binaries safely');
  console.log('✓ Preferred over exec() when shell is not needed');
}, 6000);
