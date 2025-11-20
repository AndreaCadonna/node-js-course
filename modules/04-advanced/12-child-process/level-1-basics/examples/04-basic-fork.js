/**
 * Example 4: Basic fork() Usage
 *
 * Demonstrates how to fork Node.js processes using fork().
 * fork() creates a new Node.js process with IPC communication channel.
 *
 * This example requires a worker script.
 */

const { fork } = require('child_process');
const path = require('path');

console.log('=== Basic fork() Examples ===\n');

// Create a worker script dynamically for the examples
const fs = require('fs');
const workerPath = path.join(__dirname, 'fork-worker-temp.js');

const workerCode = `
// Worker process
console.log('Worker started with PID:', process.pid);

// Listen for messages from parent
process.on('message', (msg) => {
  console.log('Worker received:', msg);

  if (msg.type === 'compute') {
    // Simulate computation
    const result = msg.data.reduce((sum, n) => sum + n, 0);

    // Send result back to parent
    process.send({
      type: 'result',
      value: result
    });
  }

  if (msg.type === 'echo') {
    // Echo the message back
    process.send({
      type: 'echo',
      message: msg.message
    });
  }

  if (msg.type === 'exit') {
    console.log('Worker exiting...');
    process.exit(0);
  }
});

// Send ready message
process.send({ type: 'ready', pid: process.pid });
`;

fs.writeFileSync(workerPath, workerCode);

// 1. Basic fork and communication
console.log('1. Basic fork and IPC communication');
console.log('Parent PID:', process.pid);

const child1 = fork(workerPath);

// Listen for messages from child
child1.on('message', (msg) => {
  console.log('Parent received:', msg);

  if (msg.type === 'ready') {
    console.log('Child is ready, sending compute task...');

    // Send data to compute
    child1.send({
      type: 'compute',
      data: [1, 2, 3, 4, 5]
    });
  }

  if (msg.type === 'result') {
    console.log(`Computation result: ${msg.value}`);

    // Ask child to exit
    child1.send({ type: 'exit' });
  }
});

// Handle child exit
child1.on('exit', (code) => {
  console.log(`Child exited with code ${code}\n`);

  // Run next example
  runExample2();
});

// 2. Multiple messages
function runExample2() {
  setTimeout(() => {
    console.log('2. Sending multiple messages');

    const child2 = fork(workerPath);
    let messageCount = 0;

    child2.on('message', (msg) => {
      if (msg.type === 'ready') {
        // Send multiple echo messages
        ['Hello', 'from', 'parent'].forEach((word, i) => {
          setTimeout(() => {
            child2.send({ type: 'echo', message: word });
          }, i * 200);
        });

        // Exit after messages
        setTimeout(() => {
          child2.send({ type: 'exit' });
        }, 1000);
      }

      if (msg.type === 'echo') {
        messageCount++;
        console.log(`Echo #${messageCount}: ${msg.message}`);
      }
    });

    child2.on('exit', () => {
      console.log('Second child exited\n');
      runExample3();
    });
  }, 500);
}

// 3. Fork with custom options
function runExample3() {
  setTimeout(() => {
    console.log('3. Fork with custom options');

    const child3 = fork(workerPath, [], {
      silent: false, // Inherit parent's stdio
      env: { CUSTOM_VAR: 'custom value' },
      cwd: process.cwd(),
    });

    child3.on('message', (msg) => {
      if (msg.type === 'ready') {
        console.log('Child with custom options ready');
        child3.send({ type: 'exit' });
      }
    });

    child3.on('exit', () => {
      console.log('Third child exited\n');
      runExample4();
    });
  }, 500);
}

// 4. Silent mode (capture stdio)
function runExample4() {
  setTimeout(() => {
    console.log('4. Silent mode - capturing child output');

    const child4 = fork(workerPath, [], {
      silent: true, // Don't inherit stdio
    });

    // Capture stdout
    child4.stdout.on('data', (data) => {
      console.log(`Child stdout: ${data.toString().trim()}`);
    });

    child4.on('message', (msg) => {
      if (msg.type === 'ready') {
        child4.send({ type: 'exit' });
      }
    });

    child4.on('exit', () => {
      console.log('Fourth child exited\n');
      runExample5();
    });
  }, 500);
}

// 5. Error handling
function runExample5() {
  setTimeout(() => {
    console.log('5. Error handling in fork');

    // Try to fork non-existent file
    const invalidChild = fork('/path/to/nonexistent.js');

    invalidChild.on('error', (error) => {
      console.error('Fork error:');
      console.error(`  Message: ${error.message}`);
      console.error(`  Code: ${error.code}`);
    });

    invalidChild.on('exit', (code) => {
      console.log(`Invalid child exited with code ${code}\n`);
      cleanup();
    });
  }, 500);
}

// Cleanup
function cleanup() {
  setTimeout(() => {
    console.log('=== Important Notes ===');
    console.log('✓ fork() is a special case of spawn()');
    console.log('✓ Creates a new Node.js process');
    console.log('✓ Built-in IPC channel for communication');
    console.log('✓ Parent and child can send JavaScript objects');
    console.log('✓ Child process is independent (own memory, V8 instance)');
    console.log('✓ Use for CPU-intensive tasks in Node.js');
    console.log('✓ IPC uses message passing (serialized with JSON)');
    console.log('✓ Can pass handles (servers, sockets) between processes');

    // Clean up temporary worker file
    fs.unlinkSync(workerPath);
    console.log('\nCleaned up temporary worker file');
  }, 500);
}
