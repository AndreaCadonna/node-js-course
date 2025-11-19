/**
 * Solution 2: Number Processor
 *
 * This solution demonstrates:
 * - Processing data in workers
 * - Calculating statistics
 * - Sending structured results
 * - Handling edge cases
 */

const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  // === MAIN THREAD CODE ===
  console.log('Exercise 2 Solution: Number Processor\n');

  const numbers = [5, 12, 8, 130, 44, 67, 23, 91];
  console.log('Processing numbers:', numbers);
  console.log('');

  // Create worker
  const worker = new Worker(__filename);

  // Listen for results
  worker.on('message', (results) => {
    console.log('Results:');
    console.log('  Count:', results.count);
    console.log('  Sum:', results.sum);
    console.log('  Average:', results.average);
    console.log('  Min:', results.min);
    console.log('  Max:', results.max);

    if (results.median !== undefined) {
      console.log('  Median:', results.median);
    }

    // Terminate worker
    worker.terminate();
  });

  // Handle errors
  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  // Send numbers to worker
  worker.postMessage(numbers);

} else {
  // === WORKER THREAD CODE ===

  parentPort.on('message', (numbers) => {
    try {
      // Validate input
      if (!Array.isArray(numbers) || numbers.length === 0) {
        throw new Error('Input must be a non-empty array');
      }

      // Calculate statistics
      const count = numbers.length;
      const sum = numbers.reduce((acc, num) => acc + num, 0);
      const average = sum / count;
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);

      // Bonus: Calculate median
      const sorted = [...numbers].sort((a, b) => a - b);
      const median = count % 2 === 0
        ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
        : sorted[Math.floor(count / 2)];

      // Send results back
      parentPort.postMessage({
        count,
        sum,
        average,
        min,
        max,
        median
      });

    } catch (err) {
      // Send error back to main thread
      parentPort.postMessage({
        error: err.message
      });
    }
  });
}

/**
 * ALTERNATIVE APPROACHES:
 *
 * 1. Use reduce for all calculations:
 *    const stats = numbers.reduce((acc, num) => ({
 *      sum: acc.sum + num,
 *      min: Math.min(acc.min, num),
 *      max: Math.max(acc.max, num),
 *      count: acc.count + 1
 *    }), { sum: 0, min: Infinity, max: -Infinity, count: 0 });
 *
 * 2. Add more statistics (standard deviation):
 *    const variance = numbers.reduce((acc, num) =>
 *      acc + Math.pow(num - average, 2), 0) / count;
 *    const stdDev = Math.sqrt(variance);
 *
 * 3. Stream large datasets instead of sending all at once
 */
