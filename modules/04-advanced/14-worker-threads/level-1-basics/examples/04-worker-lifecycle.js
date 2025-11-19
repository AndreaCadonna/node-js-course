/**
 * Example 4: Worker Lifecycle Events
 *
 * Demonstrates:
 * - 'online' event - worker is ready
 * - 'message' event - worker sent a message
 * - 'error' event - worker encountered an error
 * - 'exit' event - worker exited
 * - Complete lifecycle management
 */

const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  // === MAIN THREAD CODE ===
  console.log('=== Example 4: Worker Lifecycle Events ===\n');

  console.log('Main: Creating worker...');
  const worker = new Worker(__filename);

  // 1. 'online' event - fires when worker is ready
  worker.on('online', () => {
    console.log('Main: Worker is ONLINE - ready to receive messages');

    // Now that worker is online, send it a message
    console.log('Main: Sending task to worker');
    worker.postMessage({ task: 'fibonacci', n: 10 });
  });

  // 2. 'message' event - fires when worker sends a message
  worker.on('message', (message) => {
    console.log('Main: Received MESSAGE from worker');
    console.log('  Type:', message.type);
    console.log('  Data:', JSON.stringify(message.data));

    // After receiving result, request shutdown
    if (message.type === 'result') {
      console.log('\nMain: Requesting graceful shutdown');
      worker.postMessage({ task: 'shutdown' });
    }
  });

  // 3. 'error' event - fires when worker has an error
  worker.on('error', (err) => {
    console.error('Main: Worker ERROR occurred');
    console.error('  Message:', err.message);
    console.error('  Stack:', err.stack);
  });

  // 4. 'exit' event - fires when worker exits
  worker.on('exit', (code) => {
    console.log('\nMain: Worker EXITED');
    console.log('  Exit code:', code);

    if (code === 0) {
      console.log('  Status: Normal exit ✓');
    } else {
      console.log('  Status: Error exit ✗');
    }

    console.log('\nMain: All lifecycle events demonstrated!');
  });

  console.log('Main: Event listeners attached, waiting for events...\n');

} else {
  // === WORKER THREAD CODE ===
  console.log('Worker: Starting up...');

  // Fibonacci function
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }

  // Listen for messages from main thread
  parentPort.on('message', (message) => {
    console.log('Worker: Received task:', message.task);

    if (message.task === 'fibonacci') {
      // Calculate fibonacci
      const result = fibonacci(message.n);

      // Send result back
      console.log('Worker: Calculation complete, sending result');
      parentPort.postMessage({
        type: 'result',
        data: {
          input: message.n,
          result: result
        }
      });

    } else if (message.task === 'shutdown') {
      // Graceful shutdown
      console.log('Worker: Shutdown requested, cleaning up...');

      // Send acknowledgment
      parentPort.postMessage({
        type: 'shutdown',
        data: { message: 'Goodbye!' }
      });

      console.log('Worker: Exiting gracefully');
      process.exit(0); // Exit with code 0 (success)
    }
  });

  console.log('Worker: Ready and waiting for tasks');
}
