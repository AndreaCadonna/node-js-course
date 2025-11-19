/**
 * Example 1: Basic Worker Thread Creation
 *
 * Demonstrates:
 * - Creating a worker from a file
 * - Basic message passing
 * - Worker termination
 * - Using isMainThread to create hybrid files
 */

const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  // === MAIN THREAD CODE ===
  console.log('=== Example 1: Basic Worker Creation ===\n');

  console.log('Main thread: Starting');
  console.log('Main thread PID:', process.pid);
  console.log('');

  // Create a worker that runs this same file
  console.log('Main thread: Creating worker...');
  const worker = new Worker(__filename);

  // Listen for messages from the worker
  worker.on('message', (message) => {
    console.log('Main thread: Received from worker:', message);

    // Terminate the worker after receiving the message
    console.log('Main thread: Terminating worker');
    worker.terminate();
  });

  // Listen for worker exit
  worker.on('exit', (code) => {
    console.log(`Main thread: Worker exited with code ${code}`);
    console.log('Main thread: Done');
  });

  console.log('Main thread: Worker created, continuing execution...');
  console.log('Main thread: This proves the main thread is not blocked!');
  console.log('');

} else {
  // === WORKER THREAD CODE ===
  console.log('Worker thread: Starting');
  console.log('Worker thread: This is running in a separate thread!');

  // Simulate some work
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += i;
  }

  // Send a message back to the main thread
  console.log('Worker thread: Sending message to main thread');
  parentPort.postMessage(`Hello from worker! Sum: ${sum}`);

  console.log('Worker thread: Message sent');
}
