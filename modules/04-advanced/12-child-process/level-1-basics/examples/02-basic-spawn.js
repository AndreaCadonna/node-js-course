/**
 * Example 2: Basic spawn() Usage
 *
 * Demonstrates how to spawn child processes using spawn().
 * spawn() is best for streaming data and long-running processes.
 */

const { spawn } = require('child_process');

console.log('=== Basic spawn() Examples ===\n');

// 1. Simple spawn
console.log('1. Simple spawn - list files');
const ls = spawn('ls', ['-lh']);

ls.stdout.on('data', (data) => {
  console.log(`Files:\n${data}`);
});

ls.stderr.on('data', (data) => {
  console.error(`Error: ${data}`);
});

ls.on('close', (code) => {
  console.log(`Process exited with code ${code}\n`);
});

// 2. Spawn with arguments
setTimeout(() => {
  console.log('2. Spawn with multiple arguments');
  const echo = spawn('echo', ['Hello', 'from', 'spawn']);

  echo.stdout.on('data', (data) => {
    console.log(`Output: ${data.toString().trim()}`);
  });

  echo.on('close', (code) => {
    console.log(`Done (exit code: ${code})\n`);
  });
}, 500);

// 3. Working with streaming data
setTimeout(() => {
  console.log('3. Streaming data example');
  const find = spawn('find', ['.', '-type', 'f', '-name', '*.js']);

  let fileCount = 0;

  find.stdout.on('data', (data) => {
    const files = data.toString().split('\n').filter(f => f);
    fileCount += files.length;
    console.log(`Found ${files.length} files...`);
  });

  find.on('close', (code) => {
    console.log(`Total JavaScript files: ${fileCount}`);
    console.log(`Process exited with code ${code}\n`);
  });
}, 1000);

// 4. Capturing all output
setTimeout(() => {
  console.log('4. Capturing all output');
  const nodeVersion = spawn('node', ['--version']);

  let output = '';

  nodeVersion.stdout.on('data', (data) => {
    output += data.toString();
  });

  nodeVersion.on('close', (code) => {
    console.log(`Node.js version: ${output.trim()}`);
    console.log(`Exit code: ${code}\n`);
  });
}, 2000);

// 5. Handling errors
setTimeout(() => {
  console.log('5. Handling spawn errors');
  const invalid = spawn('command-that-does-not-exist');

  invalid.on('error', (error) => {
    console.error('Failed to start process:');
    console.error(`  Error: ${error.message}`);
    console.error(`  Code: ${error.code}\n`);
  });

  invalid.on('close', (code) => {
    console.log(`Process closed with code ${code}`);
  });
}, 2500);

// 6. Process with stdin
setTimeout(() => {
  console.log('6. Writing to process stdin');
  const grep = spawn('grep', ['error']);

  // Write to stdin
  grep.stdin.write('This is an error message\n');
  grep.stdin.write('This is fine\n');
  grep.stdin.write('Another error occurred\n');
  grep.stdin.end();

  grep.stdout.on('data', (data) => {
    console.log(`Matched lines:\n${data}`);
  });

  grep.on('close', (code) => {
    console.log(`Grep completed (exit code: ${code})\n`);
  });
}, 3000);

// 7. Spawn with custom options
setTimeout(() => {
  console.log('7. Spawn with custom options');
  const ls2 = spawn('ls', ['-lh'], {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
  });

  ls2.stdout.on('data', (data) => {
    console.log('Files with custom options:');
    console.log(data.toString());
  });

  ls2.on('close', (code) => {
    console.log(`Done (exit code: ${code})\n`);
  });
}, 3500);

// 8. Process lifecycle events
setTimeout(() => {
  console.log('8. Process lifecycle events');
  const sleep = spawn('sleep', ['1']);

  sleep.on('spawn', () => {
    console.log(`Process spawned with PID: ${sleep.pid}`);
  });

  sleep.on('close', (code, signal) => {
    console.log(`Process closed (code: ${code}, signal: ${signal})`);
  });

  sleep.on('exit', (code, signal) => {
    console.log(`Process exited (code: ${code}, signal: ${signal})\n`);
  });
}, 4000);

// Important notes
setTimeout(() => {
  console.log('=== Important Notes ===');
  console.log('✓ spawn() returns a stream interface');
  console.log('✓ Does NOT buffer output - streams data in chunks');
  console.log('✓ Does NOT use shell by default (more secure)');
  console.log('✓ Arguments passed as array (safer than string)');
  console.log('✓ Best for large output and long-running processes');
  console.log('✓ Most efficient method for streaming data');
  console.log('✓ Use .on("data") to handle output chunks');
  console.log('✓ Use .on("close") for completion notification');
}, 6000);
