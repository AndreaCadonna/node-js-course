/**
 * Example 1: Basic exec() Usage
 *
 * Demonstrates how to execute shell commands using exec().
 * exec() is best for simple commands with small output.
 */

const { exec } = require('child_process');

console.log('=== Basic exec() Examples ===\n');

// 1. Simple command execution
console.log('1. Execute a simple command');
exec('node --version', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }

  console.log(`Node.js version: ${stdout.trim()}`);
});

// Wait a bit before next example
setTimeout(() => {
  // 2. Command with output
  console.log('\n2. Command with output');
  exec('echo "Hello from child process"', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log(`Output: ${stdout.trim()}`);
  });
}, 500);

// 3. List files in current directory
setTimeout(() => {
  console.log('\n3. List files in current directory');
  exec('ls -lh', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log('Files:');
    console.log(stdout);
  });
}, 1000);

// 4. Using environment variables
setTimeout(() => {
  console.log('\n4. Using environment variables');
  exec('echo $PATH', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log('PATH variable:');
    console.log(stdout.slice(0, 100) + '...');
  });
}, 1500);

// 5. Command with pipes (shell features)
setTimeout(() => {
  console.log('\n5. Command with pipes (shell features)');
  exec('echo "Line 1\nLine 2\nLine 3" | grep "Line 2"', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log(`Filtered output: ${stdout.trim()}`);
  });
}, 2000);

// 6. Getting current working directory
setTimeout(() => {
  console.log('\n6. Get current working directory');
  exec('pwd', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log(`Current directory: ${stdout.trim()}`);
  });
}, 2500);

// 7. Command with custom options
setTimeout(() => {
  console.log('\n7. Command with custom options');
  exec('ls', {
    cwd: process.cwd(),
    env: process.env,
    maxBuffer: 1024 * 1024, // 1MB
    timeout: 5000, // 5 seconds
  }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log('Files (with custom options):');
    console.log(stdout);
  });
}, 3000);

// 8. Handling command failure
setTimeout(() => {
  console.log('\n8. Handling command failure');
  exec('command-that-does-not-exist', (error, stdout, stderr) => {
    if (error) {
      console.error('Expected error occurred:');
      console.error(`  Error message: ${error.message}`);
      console.error(`  Exit code: ${error.code}`);
      console.error(`  Signal: ${error.signal}`);
      return;
    }
  });
}, 3500);

// 9. Check if a file exists
setTimeout(() => {
  console.log('\n9. Check if file exists');
  exec('test -f package.json && echo "exists" || echo "not found"', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log(`package.json ${stdout.trim()}`);
  });
}, 4000);

// Important notes
setTimeout(() => {
  console.log('\n=== Important Notes ===');
  console.log('✓ exec() spawns a shell (/bin/sh on Unix, cmd.exe on Windows)');
  console.log('✓ Output is buffered (maxBuffer default is 1MB)');
  console.log('✓ Good for small output and simple commands');
  console.log('✓ Can use shell features (pipes, redirects, etc.)');
  console.log('✓ NOT suitable for large output or long-running processes');
  console.log('✓ SECURITY: Never use with untrusted input (shell injection risk)');
}, 4500);
