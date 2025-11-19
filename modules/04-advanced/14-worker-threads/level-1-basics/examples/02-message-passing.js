/**
 * Example 2: Two-Way Message Passing
 *
 * Demonstrates:
 * - Sending messages from main to worker
 * - Sending messages from worker to main
 * - Handling multiple messages
 * - Different data types in messages
 */

const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  // === MAIN THREAD CODE ===
  console.log('=== Example 2: Two-Way Message Passing ===\n');

  const worker = new Worker(__filename);

  let messageCount = 0;

  // Listen for messages from worker
  worker.on('message', (message) => {
    messageCount++;
    console.log(`Main: Received message ${messageCount}:`, message);

    // After receiving 3 messages, terminate
    if (messageCount >= 3) {
      console.log('\nMain: Received all messages, terminating worker');
      worker.terminate();
    }
  });

  worker.on('exit', (code) => {
    console.log(`\nMain: Worker exited with code ${code}`);
  });

  // Send different types of messages to the worker
  console.log('Main: Sending messages to worker...\n');

  // 1. String message
  worker.postMessage('Hello Worker!');

  // 2. Number message
  worker.postMessage(42);

  // 3. Object message
  worker.postMessage({
    type: 'task',
    data: [1, 2, 3, 4, 5],
    timestamp: new Date().toISOString()
  });

  // 4. Array message
  worker.postMessage(['apple', 'banana', 'cherry']);

  console.log('Main: All messages sent, waiting for responses...\n');

} else {
  // === WORKER THREAD CODE ===
  console.log('Worker: Ready and listening for messages\n');

  // Listen for messages from main thread
  parentPort.on('message', (message) => {
    console.log('Worker: Received:', typeof message, '-', JSON.stringify(message));

    // Process the message based on its type
    if (typeof message === 'string') {
      // Echo string messages
      parentPort.postMessage(`Echo: ${message}`);

    } else if (typeof message === 'number') {
      // Double number messages
      parentPort.postMessage({ original: message, doubled: message * 2 });

    } else if (typeof message === 'object' && !Array.isArray(message)) {
      // Process object messages
      if (message.type === 'task' && Array.isArray(message.data)) {
        const sum = message.data.reduce((acc, val) => acc + val, 0);
        parentPort.postMessage({
          type: 'result',
          sum: sum,
          timestamp: new Date().toISOString()
        });
      }

    } else if (Array.isArray(message)) {
      // Count array items
      parentPort.postMessage({
        type: 'array',
        count: message.length,
        items: message
      });
    }
  });
}
