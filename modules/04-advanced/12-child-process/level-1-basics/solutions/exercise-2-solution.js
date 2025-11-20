/**
 * SOLUTION: Exercise 2 - Working with spawn() and Streams
 *
 * This solution demonstrates spawn() for streaming data, real-time processing,
 * process piping, and stdin/stdout interaction.
 *
 * KEY CONCEPTS:
 * - spawn() returns streams, not buffered output
 * - Data arrives in chunks via events
 * - Real-time processing without memory buffering
 * - Process piping (chaining commands)
 * - Interactive process communication
 */

const { spawn } = require('child_process');

/**
 * Spawn a command with full event handling
 */
function spawnCommand(command, args = []) {
  console.log(`\n▶ Spawning: ${command} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      console.log(`📦 Chunk received (${data.length} bytes)`);
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`⚠️  stderr: ${data}`);
    });

    child.on('error', (error) => {
      console.error(`❌ Spawn error: ${error.message}`);
      reject(error);
    });

    child.on('close', (code, signal) => {
      console.log(`✓ Process closed with code: ${code}`);
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

/**
 * Count lines in real-time as they arrive
 */
function countLinesRealTime(command, args = []) {
  console.log(`\n▶ Counting lines from: ${command} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let lineCount = 0;
    let buffer = '';

    child.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');

      // Keep last incomplete line in buffer
      buffer = lines.pop() || '';

      // Count complete lines
      lineCount += lines.length;
      if (lines.length > 0) {
        console.log(`📊 Lines so far: ${lineCount}`);
      }
    });

    child.on('close', (code) => {
      // Count final line if buffer has content
      if (buffer.length > 0) lineCount++;

      console.log(`✓ Total lines: ${lineCount}`);
      resolve(lineCount);
    });

    child.on('error', reject);
  });
}

/**
 * Handle large output by processing chunks
 */
function handleLargeOutput(command, args = []) {
  console.log(`\n▶ Processing large output from: ${command}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let totalBytes = 0;
    let chunkCount = 0;

    child.stdout.on('data', (data) => {
      totalBytes += data.length;
      chunkCount++;

      // Report progress every 10 chunks
      if (chunkCount % 10 === 0) {
        console.log(`📈 Progress: ${chunkCount} chunks, ${totalBytes} bytes`);
      }
    });

    child.on('close', (code) => {
      console.log(`✓ Completed: ${chunkCount} chunks, ${totalBytes} bytes total`);
      resolve({ totalBytes, chunkCount });
    });

    child.on('error', reject);
  });
}

/**
 * Pipe between two processes (ls | grep pattern)
 */
function pipeBetweenProcesses(cmd1, args1, cmd2, args2) {
  console.log(`\n▶ Piping: ${cmd1} | ${cmd2}`);

  return new Promise((resolve, reject) => {
    const proc1 = spawn(cmd1, args1);
    const proc2 = spawn(cmd2, args2);
    let output = '';

    // Pipe first process stdout to second process stdin
    proc1.stdout.pipe(proc2.stdin);

    // Collect output from second process
    proc2.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Handle errors from either process
    proc1.on('error', reject);
    proc2.on('error', reject);

    // Wait for second process to complete
    proc2.on('close', (code) => {
      console.log(`✓ Pipe completed with code: ${code}`);
      resolve(output);
    });
  });
}

/**
 * Provide input to a process via stdin
 */
function provideInput(command, args, input) {
  console.log(`\n▶ Sending input to: ${command}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let output = '';

    // Write input to child's stdin
    child.stdin.write(input);
    child.stdin.end(); // Important: signal end of input

    // Collect output
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      console.log(`✓ Process completed`);
      resolve(output);
    });
  });
}

/**
 * Main demo function
 */
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Child Process spawn() - Solution Demo    ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    // 1. Basic spawn
    console.log('\n=== 1. Basic Spawn Demo ===');
    await spawnCommand('node', ['--version']);

    // 2. Count lines in real-time
    console.log('\n=== 2. Real-Time Line Counting ===');
    const lineCount = await countLinesRealTime('ls', ['-la']);
    console.log(`Final count: ${lineCount} lines`);

    // 3. Handle large output (be careful with this one)
    console.log('\n=== 3. Large Output Handling ===');
    const result = await handleLargeOutput('ls', ['-laR', '.']);
    console.log(`Processed ${result.totalBytes} bytes in ${result.chunkCount} chunks`);

    // 4. Pipe between processes
    console.log('\n=== 4. Process Piping ===');
    const filtered = await pipeBetweenProcesses(
      'ls', ['-la'],
      'grep', ['\.js']
    );
    console.log(`Filtered output:\n${filtered.substring(0, 200)}...`);

    // 5. Provide input to process
    console.log('\n=== 5. Providing Input ===');
    const echoed = await provideInput('cat', [], 'Hello from stdin!\nLine 2\n');
    console.log(`Output:\n${echoed}`);

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║         Exercise Complete ✓                ║');
    console.log('╚════════════════════════════════════════════╝');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  spawnCommand,
  countLinesRealTime,
  handleLargeOutput,
  pipeBetweenProcesses,
  provideInput
};
