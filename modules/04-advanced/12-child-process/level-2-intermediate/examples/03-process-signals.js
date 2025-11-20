/**
 * EXAMPLE 3: Process Signals
 *
 * This example demonstrates:
 * - Sending signals to child processes
 * - Handling signals in child processes
 * - Graceful shutdown patterns
 * - Signal propagation
 * - Timeout-based forced termination
 */

const { spawn, fork } = require('child_process');
const fs = require('fs');

console.log('=== Process Signals Examples ===\n');

// Example 1: Sending Basic Signals
function sendingBasicSignals() {
  console.log('1. Sending Basic Signals');
  console.log('   Demonstrating SIGTERM and SIGKILL\n');

  // Create a long-running process
  const sleep = spawn('sleep', ['30']);

  console.log(`   Started process with PID: ${sleep.pid}`);

  // Send SIGTERM after 1 second
  setTimeout(() => {
    console.log('   Sending SIGTERM...');
    sleep.kill('SIGTERM'); // Graceful termination request
  }, 1000);

  sleep.on('close', (code, signal) => {
    console.log(`   Process exited with signal: ${signal}`);
    console.log('   (SIGTERM allows process to clean up)\n');
    example2();
  });
}

// Example 2: SIGKILL (Force Kill)
function example2() {
  console.log('2. SIGKILL - Force Termination');
  console.log('   Immediate termination without cleanup\n');

  const sleep = spawn('sleep', ['30']);
  console.log(`   Started process with PID: ${sleep.pid}`);

  setTimeout(() => {
    console.log('   Sending SIGKILL (cannot be caught)...');
    sleep.kill('SIGKILL'); // Force kill
  }, 500);

  sleep.on('close', (code, signal) => {
    console.log(`   Process killed with signal: ${signal}`);
    console.log('   (SIGKILL terminates immediately)\n');
    example3();
  });
}

// Example 3: Graceful Shutdown Pattern
function example3() {
  console.log('3. Graceful Shutdown Pattern');
  console.log('   Worker handles SIGTERM for cleanup\n');

  // Create a worker that handles signals
  const workerPath = '/tmp/graceful-worker.js';
  fs.writeFileSync(workerPath, `
let isShuttingDown = false;

// Simulate work
const interval = setInterval(() => {
  console.log('   [Worker] Processing...');
}, 500);

// Handle SIGTERM gracefully
process.on('SIGTERM', () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('   [Worker] Received SIGTERM, starting graceful shutdown...');

  // Cleanup
  clearInterval(interval);

  // Simulate cleanup tasks
  setTimeout(() => {
    console.log('   [Worker] Cleanup completed');
    process.exit(0);
  }, 1000);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('   [Worker] Received SIGINT');
  process.exit(0);
});

console.log('   [Worker] Started, PID:', process.pid);
  `);

  const worker = spawn('node', [workerPath]);

  // Let it run for 2 seconds, then signal shutdown
  setTimeout(() => {
    console.log('   [Parent] Sending SIGTERM to worker...');
    worker.kill('SIGTERM');
  }, 2000);

  worker.on('close', (code, signal) => {
    console.log(`   [Parent] Worker exited: code=${code}, signal=${signal}\n`);
    example4();
  });
}

// Example 4: Graceful Shutdown with Timeout
function example4() {
  console.log('4. Graceful Shutdown with Force-Kill Timeout');
  console.log('   Escalate to SIGKILL if graceful shutdown takes too long\n');

  // Create a worker that takes too long to shut down
  const slowWorkerPath = '/tmp/slow-worker.js';
  fs.writeFileSync(slowWorkerPath, `
process.on('SIGTERM', () => {
  console.log('   [Worker] Received SIGTERM, but taking too long...');
  // Simulate slow cleanup (never completes)
  // In real scenario, worker might be stuck
});

setInterval(() => {
  console.log('   [Worker] Working...');
}, 500);

console.log('   [Worker] Started');
  `);

  const worker = spawn('node', [slowWorkerPath]);
  let forceKilled = false;

  setTimeout(() => {
    console.log('   [Parent] Sending SIGTERM...');
    worker.kill('SIGTERM');

    // Set timeout for force kill
    const forceKillTimeout = setTimeout(() => {
      if (!worker.killed) {
        console.log('   [Parent] Graceful shutdown timed out, force killing...');
        worker.kill('SIGKILL');
        forceKilled = true;
      }
    }, 2000);

    worker.on('close', () => {
      clearTimeout(forceKillTimeout);
    });
  }, 1500);

  worker.on('close', (code, signal) => {
    const method = forceKilled ? 'SIGKILL' : 'SIGTERM';
    console.log(`   [Parent] Worker terminated with ${method}\n`);
    example5();
  });
}

// Example 5: Signal Handling in Fork
function example5() {
  console.log('5. Signal Handling in Forked Processes');
  console.log('   Using fork() with IPC and signals\n');

  const workerPath = '/tmp/fork-signal-worker.js';
  fs.writeFileSync(workerPath, `
let taskCount = 0;

process.on('message', (msg) => {
  if (msg.type === 'task') {
    taskCount++;
    process.send({ type: 'completed', taskCount });
  }
});

process.on('SIGTERM', () => {
  console.log(\`   [Worker] Shutting down after completing \${taskCount} tasks\`);
  process.send({ type: 'final-report', taskCount });
  process.exit(0);
});

process.send({ type: 'ready' });
  `);

  const worker = fork(workerPath);

  worker.on('message', (msg) => {
    if (msg.type === 'ready') {
      console.log('   [Parent] Worker is ready');

      // Send some tasks
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => {
          worker.send({ type: 'task', id: i });
        }, i * 200);
      }

      // Signal shutdown after tasks
      setTimeout(() => {
        console.log('   [Parent] Sending SIGTERM...');
        worker.kill('SIGTERM');
      }, 1500);
    } else if (msg.type === 'completed') {
      console.log(`   [Parent] Task completed (total: ${msg.taskCount})`);
    } else if (msg.type === 'final-report') {
      console.log(`   [Parent] Final report: ${msg.taskCount} tasks completed`);
    }
  });

  worker.on('close', (code) => {
    console.log(`   [Parent] Worker exited with code: ${code}\n`);
    example6();
  });
}

// Example 6: Multiple Process Coordination
function example6() {
  console.log('6. Coordinated Shutdown of Multiple Processes');
  console.log('   Shutting down a process group gracefully\n');

  const workerPath = '/tmp/coordinated-worker.js';
  fs.writeFileSync(workerPath, `
const workerId = process.argv[2];

process.on('SIGTERM', () => {
  console.log(\`   [Worker \${workerId}] Shutting down...\`);
  setTimeout(() => {
    console.log(\`   [Worker \${workerId}] Cleanup complete\`);
    process.exit(0);
  }, 500);
});

console.log(\`   [Worker \${workerId}] Started\`);
setInterval(() => {}, 1000); // Keep alive
  `);

  const workers = [];
  const numWorkers = 3;

  // Start workers
  for (let i = 1; i <= numWorkers; i++) {
    const worker = spawn('node', [workerPath, i.toString()]);
    worker.workerId = i;
    workers.push(worker);
  }

  // Shutdown all workers after 2 seconds
  setTimeout(() => {
    console.log('   [Parent] Initiating coordinated shutdown...\n');

    // Send SIGTERM to all workers
    workers.forEach(worker => {
      worker.kill('SIGTERM');
    });

    // Wait for all to exit
    let exitedCount = 0;
    workers.forEach(worker => {
      worker.on('close', (code) => {
        exitedCount++;
        if (exitedCount === numWorkers) {
          console.log('\n   [Parent] All workers shut down successfully');
          example7();
        }
      });
    });
  }, 2000);
}

// Example 7: Parent Process Signal Handling
function example7() {
  console.log('\n7. Parent Process Signal Handling');
  console.log('   Handling signals in parent and propagating to children\n');

  const workerPath = '/tmp/parent-signal-worker.js';
  fs.writeFileSync(workerPath, `
process.on('SIGTERM', () => {
  console.log('   [Worker] Received SIGTERM from parent');
  process.exit(0);
});

setInterval(() => {}, 1000);
  `);

  const worker = spawn('node', [workerPath]);

  // Simulate parent receiving SIGTERM
  console.log('   [Parent] Simulating SIGTERM received by parent...');

  setTimeout(() => {
    console.log('   [Parent] Propagating SIGTERM to child...');
    worker.kill('SIGTERM');

    worker.on('close', (code, signal) => {
      console.log('   [Parent] Child terminated, exiting parent');
      console.log('\n=== All Examples Completed ===');
      console.log('\nKey Takeaways:');
      console.log('- SIGTERM allows graceful cleanup');
      console.log('- SIGKILL forces immediate termination');
      console.log('- Always implement timeout for force-kill');
      console.log('- Coordinate shutdown across process groups');
      console.log('- Handle signals in both parent and child');
    });
  }, 1000);
}

// Start the examples
sendingBasicSignals();
