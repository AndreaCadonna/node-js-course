/**
 * Exercise 2: Number Processor
 *
 * TASK:
 * Create a worker that processes an array of numbers and calculates statistics.
 *
 * REQUIREMENTS:
 * 1. Main thread sends an array of numbers via postMessage
 * 2. Worker calculates:
 *    - Sum of all numbers
 *    - Average
 *    - Minimum value
 *    - Maximum value
 *    - Count of numbers
 * 3. Worker sends results back as an object
 * 4. Main thread displays the results
 *
 * EXAMPLE OUTPUT:
 * Processing numbers: [5, 12, 8, 130, 44, 67, 23, 91]
 * Results:
 *   Count: 8
 *   Sum: 380
 *   Average: 47.5
 *   Min: 5
 *   Max: 130
 *
 * BONUS:
 * - Add median calculation
 * - Handle empty array edge case
 * - Add standard deviation calculation
 */

const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  // === MAIN THREAD CODE ===
  // TODO: Implement main thread logic

  console.log('Exercise 2: Number Processor\n');

  const numbers = [5, 12, 8, 130, 44, 67, 23, 91];

  // Your code here...
  // 1. Create worker
  // 2. Send numbers array to worker
  // 3. Receive and display results
  // 4. Terminate worker

} else {
  // === WORKER THREAD CODE ===
  // TODO: Implement worker logic

  // Your code here...
  // 1. Listen for message containing numbers array
  // 2. Calculate all statistics
  // 3. Send results back to main thread
}
