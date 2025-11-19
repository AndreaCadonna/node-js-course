/**
 * Exercise 1: Build a Production-Ready Worker Pool
 *
 * TASK:
 * Implement a worker pool class that manages multiple workers and distributes
 * tasks efficiently.
 *
 * REQUIREMENTS:
 * 1. Create a WorkerPool class that:
 *    - Accepts worker script path and pool size
 *    - Creates specified number of workers
 *    - Queues tasks when all workers are busy
 *    - Returns Promises for task results
 *
 * 2. The pool should:
 *    - Track busy/available workers
 *    - Distribute tasks to available workers
 *    - Process queue when workers become available
 *    - Handle worker errors gracefully
 *    - Provide pool statistics
 *
 * 3. Implement these methods:
 *    - execute(data) - Execute a task, returns Promise
 *    - getStats() - Return pool statistics
 *    - terminate() - Gracefully shutdown all workers
 *
 * BONUS:
 * - Add task timeout support
 * - Implement priority queue
 * - Add worker health monitoring
 * - Support dynamic pool sizing
 *
 * TEST DATA:
 * Run 20 tasks with pool of 4 workers
 * Each task should calculate fibonacci of a number
 */

const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  // TODO: Implement WorkerPool class
  class WorkerPool {
    constructor(workerScript, poolSize = 4) {
      // Your implementation here
    }

    async execute(data) {
      // Your implementation here
    }

    getStats() {
      // Your implementation here
    }

    async terminate() {
      // Your implementation here
    }
  }

  // Test code
  async function test() {
    const pool = new WorkerPool(__filename, 4);

    console.log('Starting 20 tasks with 4 workers...\n');

    const tasks = Array.from({ length: 20 }, (_, i) => i + 30);

    const results = await Promise.all(
      tasks.map(n => pool.execute(n))
    );

    console.log('\nAll tasks completed!');
    console.log('Results:', results);

    const stats = pool.getStats();
    console.log('\nPool Statistics:', stats);

    await pool.terminate();
  }

  test().catch(console.error);

} else {
  // Worker code (provided)
  parentPort.on('message', (n) => {
    function fibonacci(num) {
      if (num <= 1) return num;
      return fibonacci(num - 1) + fibonacci(num - 2);
    }

    const result = fibonacci(n);
    parentPort.postMessage(result);
  });
}
