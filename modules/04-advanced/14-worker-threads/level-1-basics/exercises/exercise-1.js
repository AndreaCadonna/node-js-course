/**
 * Exercise 1: Hello Worker
 *
 * TASK:
 * Create a worker thread that:
 * 1. Receives a name through workerData
 * 2. Sends a personalized greeting message back to the main thread
 * 3. Main thread should print the greeting
 * 4. Properly terminate the worker
 *
 * EXAMPLE OUTPUT:
 * Creating worker with name: Alice
 * Worker: Hello, Alice! Nice to meet you.
 * Main: Worker greeted successfully
 *
 * REQUIREMENTS:
 * - Use workerData to pass the name
 * - Worker should send greeting via postMessage
 * - Handle the 'message' event in main thread
 * - Terminate worker after receiving greeting
 *
 * BONUS:
 * - Add timestamp to the greeting
 * - Handle the case where no name is provided
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // === MAIN THREAD CODE ===
  // TODO: Implement main thread logic
  //
  // 1. Create a worker passing a name via workerData
  // 2. Listen for the greeting message
  // 3. Print the greeting
  // 4. Terminate the worker

  console.log('Exercise 1: Hello Worker\n');

  // Your code here...

} else {
  // === WORKER THREAD CODE ===
  // TODO: Implement worker logic
  //
  // 1. Get the name from workerData
  // 2. Create a greeting message
  // 3. Send it back to the main thread via postMessage

  // Your code here...
}
