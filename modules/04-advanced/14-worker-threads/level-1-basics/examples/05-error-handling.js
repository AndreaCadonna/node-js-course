/**
 * Example 5: Error Handling in Workers
 *
 * Demonstrates:
 * - Handling errors in workers
 * - Try-catch in worker message handlers
 * - Sending errors back to main thread
 * - Error event in main thread
 * - Graceful error recovery
 */

const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  // === MAIN THREAD CODE ===
  console.log('=== Example 5: Error Handling ===\n');

  const worker = new Worker(__filename);

  // Handle messages from worker
  worker.on('message', (message) => {
    if (message.success) {
      console.log('Main: Success:', message.result);
    } else {
      console.log('Main: Worker reported error:', message.error);
      console.log('  Task:', message.task);
    }
  });

  // Handle worker errors (uncaught exceptions)
  worker.on('error', (err) => {
    console.error('\nMain: UNCAUGHT ERROR in worker:');
    console.error('  Message:', err.message);
    console.error('  Stack:', err.stack);
  });

  worker.on('exit', (code) => {
    console.log(`\nMain: Worker exited with code ${code}`);
  });

  // Send various tasks to the worker
  console.log('Sending tasks to worker...\n');

  // Task 1: Valid task
  worker.postMessage({
    task: 'divide',
    a: 10,
    b: 2
  });

  // Task 2: Division by zero (handled error)
  setTimeout(() => {
    worker.postMessage({
      task: 'divide',
      a: 10,
      b: 0
    });
  }, 100);

  // Task 3: Invalid task (handled error)
  setTimeout(() => {
    worker.postMessage({
      task: 'invalid'
    });
  }, 200);

  // Task 4: Parse JSON (handled error)
  setTimeout(() => {
    worker.postMessage({
      task: 'parseJSON',
      data: 'invalid json {{'
    });
  }, 300);

  // Task 5: Terminate after all tasks
  setTimeout(() => {
    console.log('\nMain: Terminating worker');
    worker.terminate();
  }, 500);

} else {
  // === WORKER THREAD CODE ===
  console.log('Worker: Ready\n');

  // Listen for messages with error handling
  parentPort.on('message', (message) => {
    const { task } = message;

    try {
      let result;

      switch (task) {
        case 'divide':
          // Validate inputs
          if (message.b === 0) {
            throw new Error('Division by zero is not allowed');
          }

          result = message.a / message.b;

          parentPort.postMessage({
            success: true,
            task: 'divide',
            result: result
          });
          break;

        case 'parseJSON':
          // This might throw
          result = JSON.parse(message.data);

          parentPort.postMessage({
            success: true,
            task: 'parseJSON',
            result: result
          });
          break;

        default:
          throw new Error(`Unknown task: ${task}`);
      }

    } catch (err) {
      // Send error back to main thread
      console.log('Worker: Caught error:', err.message);

      parentPort.postMessage({
        success: false,
        task: task,
        error: err.message,
        errorType: err.constructor.name
      });
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Worker: UNCAUGHT EXCEPTION:', err.message);

    // Try to notify main thread before crashing
    parentPort.postMessage({
      success: false,
      task: 'unknown',
      error: `Uncaught exception: ${err.message}`,
      fatal: true
    });

    // Exit with error code
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    console.error('Worker: UNHANDLED REJECTION:', reason);

    parentPort.postMessage({
      success: false,
      task: 'unknown',
      error: `Unhandled rejection: ${reason}`,
      fatal: true
    });

    process.exit(1);
  });
}
