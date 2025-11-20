/**
 * Exercise 2: Working with spawn() and Streams
 *
 * OBJECTIVE:
 * Learn to use child_process.spawn() for streaming command output and handling large data.
 *
 * REQUIREMENTS:
 * 1. Use spawn() to execute commands
 * 2. Handle stdout and stderr streams
 * 3. Listen to process events (close, exit, error)
 * 4. Stream data in chunks
 * 5. Compare spawn() behavior with exec()
 *
 * LEARNING GOALS:
 * - Understanding spawn() and streaming
 * - Working with readable streams from child processes
 * - Handling process events
 * - Understanding the difference between spawn() and exec()
 * - Processing data in chunks vs buffering
 */

const { spawn } = require('child_process');

/**
 * TODO 1: Implement function to spawn a simple command
 *
 * Steps:
 * 1. Use spawn() to run a command (e.g., 'ls', '-la')
 * 2. Listen to 'data' event on stdout
 * 3. Listen to 'data' event on stderr
 * 4. Listen to 'close' event on the child process
 * 5. Convert buffer chunks to strings
 * 6. Return a promise that resolves when process closes
 *
 * Important: spawn() takes command and args separately
 * Example: spawn('ls', ['-la']) not spawn('ls -la')
 */
function spawnCommand(command, args = []) {
  console.log(`Spawning: ${command} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    // Your code here
    // const child = spawn(command, args);
    //
    // child.stdout.on('data', (data) => {
    //   // Handle output chunks
    // });
    //
    // child.stderr.on('data', (data) => {
    //   // Handle error chunks
    // });
    //
    // child.on('close', (code) => {
    //   // Handle process completion
    // });
    //
    // child.on('error', (err) => {
    //   // Handle spawn errors
    // });
  });
}

/**
 * TODO 2: Implement function to count lines in real-time
 *
 * Steps:
 * 1. Spawn a command that produces multiple lines (e.g., 'ls -la')
 * 2. Count lines as they arrive
 * 3. Display line count progress
 * 4. Return final count when process completes
 *
 * Hint: Use .toString().split('\n') to process lines
 */
function countLinesRealTime(command, args = []) {
  let lineCount = 0;

  return new Promise((resolve, reject) => {
    // Your code here
    // Spawn command
    // Count lines in each chunk
    // Resolve with final count
  });
}

/**
 * TODO 3: Implement function to handle large output
 *
 * Steps:
 * 1. Spawn a command that generates large output
 *    (e.g., 'find / -type f' or 'cat large-file.txt')
 * 2. Process output in chunks without buffering all
 * 3. Track total bytes received
 * 4. Display progress periodically
 * 5. Handle backpressure properly
 *
 * This demonstrates spawn()'s advantage over exec() for large output
 */
function handleLargeOutput(command, args = []) {
  let totalBytes = 0;
  let chunkCount = 0;

  return new Promise((resolve, reject) => {
    // Your code here
    // Spawn process
    // Track bytes and chunks
    // Display progress
  });
}

/**
 * TODO 4: Implement function to pipe between processes
 *
 * Steps:
 * 1. Spawn first process (e.g., 'ls -la')
 * 2. Spawn second process (e.g., 'grep .js')
 * 3. Pipe stdout of first to stdin of second
 * 4. Collect output from second process
 * 5. Return filtered results
 *
 * This demonstrates process piping: ls -la | grep .js
 */
function pipeBetweenProcesses(cmd1, args1, cmd2, args2) {
  return new Promise((resolve, reject) => {
    let output = '';

    // Your code here
    // const proc1 = spawn(cmd1, args1);
    // const proc2 = spawn(cmd2, args2);
    //
    // proc1.stdout.pipe(proc2.stdin);
    //
    // proc2.stdout.on('data', (data) => {
    //   output += data.toString();
    // });
    //
    // proc2.on('close', (code) => {
    //   resolve(output);
    // });
  });
}

/**
 * TODO 5: Implement function to provide input to a process
 *
 * Steps:
 * 1. Spawn a process that reads from stdin (e.g., 'cat')
 * 2. Write data to the process stdin
 * 3. End the stdin stream
 * 4. Collect output from stdout
 * 5. Return the output
 *
 * This demonstrates interactive process communication
 */
function provideInput(command, args, input) {
  return new Promise((resolve, reject) => {
    let output = '';

    // Your code here
    // const child = spawn(command, args);
    //
    // child.stdin.write(input);
    // child.stdin.end();
    //
    // child.stdout.on('data', (data) => {
    //   output += data.toString();
    // });
    //
    // child.on('close', () => {
    //   resolve(output);
    // });
  });
}

/**
 * TODO 6: Main function to demonstrate all spawn() features
 *
 * Steps:
 * 1. Run spawnCommand() with a simple command
 * 2. Count lines in real-time
 * 3. Try handling large output (be careful with system commands)
 * 4. Demonstrate piping
 * 5. Show providing input to a process
 */
async function main() {
  console.log('=== Child Process spawn() Exercise ===\n');

  try {
    // TODO: Uncomment and implement each demo

    // 1. Basic spawn
    // console.log('1. Basic Spawn Demo:');
    // await spawnCommand('node', ['--version']);

    // 2. Count lines
    // console.log('\n2. Count Lines Demo:');
    // const count = await countLinesRealTime('ls', ['-la']);
    // console.log(`Total lines: ${count}`);

    // 3. Large output (use with caution)
    // console.log('\n3. Large Output Demo:');
    // await handleLargeOutput('ls', ['-R', '/usr/bin']);

    // 4. Pipe between processes
    // console.log('\n4. Pipe Demo (ls | grep):');
    // const filtered = await pipeBetweenProcesses('ls', ['-la'], 'grep', ['.js']);
    // console.log(filtered);

    // 5. Provide input
    // console.log('\n5. Provide Input Demo:');
    // const echoed = await provideInput('cat', [], 'Hello from stdin!\n');
    // console.log('Output:', echoed);

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
 *    node exercise-2.js
 *
 * 2. Expected behaviors:
 *    - Should see data arriving in chunks
 *    - Should see real-time progress updates
 *    - Should handle large output without memory issues
 *    - Should successfully pipe between processes
 *    - Should handle stdin/stdout interaction
 *
 * 3. Compare with exec():
 *    - spawn() processes data in chunks
 *    - exec() buffers all output in memory
 *    - spawn() is better for large output
 *    - exec() is simpler for small output
 *
 * EXAMPLE OUTPUT:
 * ─────────────────────────────────────
 * === Child Process spawn() Exercise ===
 *
 * 1. Basic Spawn Demo:
 * Spawning: node --version
 * v18.17.0
 * Process exited with code: 0
 *
 * 2. Count Lines Demo:
 * Spawning: ls -la
 * Lines so far: 5
 * Lines so far: 10
 * Total lines: 12
 * ─────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - How does spawn() differ from exec()?
 * - Why are stdout and stderr streams?
 * - What does the 'close' event mean?
 * - How do you pipe between processes?
 * - When should you use spawn() instead of exec()?
 *
 * Key Takeaways:
 * 1. spawn() returns a ChildProcess object with streams
 * 2. Data arrives in chunks via 'data' events
 * 3. 'close' event fires when process ends and streams are flushed
 * 4. 'exit' event fires when process ends (may be before streams close)
 * 5. spawn() is better for large output or long-running processes
 * 6. You can pipe between processes using .pipe()
 * 7. stdin/stdout/stderr are all streams you can interact with
 */
