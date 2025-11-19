/**
 * Solution 1: Hello Worker
 *
 * This solution demonstrates:
 * - Creating a worker with workerData
 * - Sending messages from worker to main
 * - Proper worker termination
 * - Basic error handling
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // === MAIN THREAD CODE ===
  console.log('Exercise 1 Solution: Hello Worker\n');

  // The name to send to the worker
  const name = 'Alice';
  console.log(`Creating worker with name: ${name}`);

  // Create worker and pass name via workerData
  const worker = new Worker(__filename, {
    workerData: { name }
  });

  // Listen for greeting from worker
  worker.on('message', (message) => {
    console.log('Main: Received greeting:', message);

    // Terminate worker after receiving greeting
    worker.terminate();
  });

  // Handle errors
  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  // Confirm termination
  worker.on('exit', (code) => {
    console.log(`Main: Worker exited with code ${code}`);
  });

} else {
  // === WORKER THREAD CODE ===

  // Get name from workerData (with default if not provided)
  const name = workerData?.name || 'Guest';

  // Create personalized greeting
  const greeting = `Hello, ${name}! Nice to meet you.`;

  // Send greeting to main thread
  console.log('Worker:', greeting);
  parentPort.postMessage(greeting);
}

/**
 * ALTERNATIVE APPROACHES:
 *
 * 1. Include timestamp in greeting:
 *    const greeting = `Hello, ${name}! Time: ${new Date().toISOString()}`;
 *
 * 2. Send structured message object:
 *    parentPort.postMessage({
 *      greeting,
 *      timestamp: Date.now(),
 *      workerName: 'GreeterWorker'
 *    });
 *
 * 3. Validate name in worker:
 *    if (!workerData || !workerData.name) {
 *      throw new Error('Name is required');
 *    }
 */
