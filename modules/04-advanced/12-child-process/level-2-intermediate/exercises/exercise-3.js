/**
 * EXERCISE 3: Process Pool Implementation
 *
 * Difficulty: Intermediate
 * Estimated time: 40-50 minutes
 *
 * OBJECTIVE:
 * Build a worker pool that efficiently manages multiple worker processes,
 * distributes tasks, and handles worker failures.
 *
 * REQUIREMENTS:
 * 1. Create a WorkerPool class with configurable pool size
 * 2. Implement task queuing when all workers are busy
 * 3. Distribute tasks to available workers
 * 4. Handle worker crashes and replace them automatically
 * 5. Track pool statistics (tasks completed, workers replaced, etc.)
 * 6. Implement graceful shutdown
 *
 * INSTRUCTIONS:
 * Implement the WorkerPool class with these methods:
 * - constructor(workerScript, size): Create pool with N workers
 * - execute(task): Execute a task on an available worker
 * - getStats(): Return pool statistics
 * - shutdown(): Gracefully shut down all workers
 *
 * TESTING:
 * Run: node exercise-3.js
 */

const { fork } = require('child_process');
const fs = require('fs');

class WorkerPool {
  constructor(workerScript, size) {
    this.workerScript = workerScript;
    this.size = size;
    this.workers = [];
    this.taskQueue = [];
    this.stats = {
      tasksCompleted: 0,
      tasksFailed: 0,
      workersCreated: 0,
      workersReplaced: 0
    };

    // TODO: Initialize the worker pool
    // Hints:
    // 1. Create 'size' number of workers
    // 2. Set up message handlers for each worker
    // 3. Set up exit handlers to detect crashes
    // 4. Track worker state (busy/idle)
  }

  /**
   * Create a new worker
   * @returns {Object} Worker object with process and state
   */
  createWorker() {
    // TODO: Implement this method
    // Hints:
    // 1. Fork the worker script
    // 2. Set up message handler
    // 3. Set up exit handler for crash detection
    // 4. Track as busy/idle
    // 5. Increment workersCreated stat

    throw new Error('Not implemented');
  }

  /**
   * Replace a crashed worker
   * @param {Object} worker - The crashed worker
   */
  replaceWorker(worker) {
    // TODO: Implement this method
    // Hints:
    // 1. Remove crashed worker from pool
    // 2. Create new worker
    // 3. Add to pool
    // 4. Increment workersReplaced stat
    // 5. Process queued tasks

    throw new Error('Not implemented');
  }

  /**
   * Execute a task on an available worker
   * @param {Object} task - Task to execute
   * @returns {Promise<any>} Task result
   */
  execute(task) {
    // TODO: Implement this method
    // Hints:
    // 1. Find an available (idle) worker
    // 2. If available, send task immediately
    // 3. If all busy, add to queue
    // 4. Return promise that resolves with result
    // 5. Handle worker becoming available

    throw new Error('Not implemented');
  }

  /**
   * Process queued tasks
   */
  processQueue() {
    // TODO: Implement this method
    // Hints:
    // 1. Check if queue has tasks
    // 2. Find idle worker
    // 3. Assign task from queue to worker
    // 4. Mark worker as busy

    throw new Error('Not implemented');
  }

  /**
   * Get pool statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.workers.length,
      queueDepth: this.taskQueue.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      idleWorkers: this.workers.filter(w => !w.busy).length
    };
  }

  /**
   * Shutdown the pool gracefully
   * @returns {Promise<void>}
   */
  async shutdown() {
    // TODO: Implement this method
    // Hints:
    // 1. Wait for queue to empty
    // 2. Wait for all workers to become idle
    // 3. Kill all workers
    // 4. Clear workers array

    throw new Error('Not implemented');
  }
}

// ============================================================================
// TEST CODE - DO NOT MODIFY BELOW THIS LINE
// ============================================================================

// Create test worker that can simulate different behaviors
const testWorkerPath = '/tmp/pool-test-worker.js';
const testWorkerCode = `
process.on('message', (task) => {
  const { id, type, duration, shouldCrash } = task;

  // Simulate crash
  if (shouldCrash) {
    console.log(\`  [Worker \${process.pid}] Simulating crash...\`);
    process.exit(1);
  }

  // Simulate work
  setTimeout(() => {
    process.send({
      id,
      result: \`Task \${id} completed by worker \${process.pid}\`,
      duration
    });
  }, duration || 100);
});
`;

fs.writeFileSync(testWorkerPath, testWorkerCode);

async function runTests() {
  console.log('=== Exercise 3: Process Pool Implementation ===\n');

  // Test 1: Create pool
  console.log('Test 1: Create worker pool');
  try {
    const pool = new WorkerPool(testWorkerPath, 3);

    const stats = pool.getStats();
    console.log('  Pool created:', stats);

    if (stats.poolSize === 3) {
      console.log('  ✓ Pool created with correct size\n');
    } else {
      console.log(`  ✗ Expected pool size 3, got ${stats.poolSize}\n`);
    }

    // Cleanup
    await pool.shutdown();
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 2: Execute tasks
  console.log('Test 2: Execute tasks on pool');
  try {
    const pool = new WorkerPool(testWorkerPath, 2);

    const tasks = [
      { id: 1, type: 'work', duration: 200 },
      { id: 2, type: 'work', duration: 150 },
      { id: 3, type: 'work', duration: 100 }
    ];

    const results = await Promise.all(
      tasks.map(task => pool.execute(task))
    );

    console.log(`  Completed ${results.length} tasks`);

    const stats = pool.getStats();
    if (stats.tasksCompleted === 3) {
      console.log('  ✓ All tasks completed\n');
    } else {
      console.log(`  ✗ Expected 3 completed tasks, got ${stats.tasksCompleted}\n`);
    }

    await pool.shutdown();
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 3: Queue handling
  console.log('Test 3: Task queuing when workers busy');
  try {
    const pool = new WorkerPool(testWorkerPath, 2);

    // Submit more tasks than workers
    const tasks = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      type: 'work',
      duration: 300
    }));

    const startTime = Date.now();
    const promises = tasks.map(task => pool.execute(task));

    // Check queue depth
    setTimeout(() => {
      const stats = pool.getStats();
      console.log(`  Queue depth after 100ms: ${stats.queueDepth}`);

      if (stats.queueDepth > 0) {
        console.log('  ✓ Tasks are queued when workers busy');
      }
    }, 100);

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    console.log(`  All 6 tasks completed in ${duration}ms`);

    // Should take at least 3 rounds (6 tasks / 2 workers)
    if (duration >= 800) {
      console.log('  ✓ Queue processed correctly\n');
    } else {
      console.log('  ✗ Tasks completed too quickly (queue not used?)\n');
    }

    await pool.shutdown();
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 4: Worker crash and replacement
  console.log('Test 4: Handle worker crashes');
  try {
    const pool = new WorkerPool(testWorkerPath, 2);

    // First task works normally
    await pool.execute({ id: 1, type: 'work', duration: 100 });
    console.log('  Task 1 completed normally');

    // Second task crashes worker
    try {
      await pool.execute({ id: 2, type: 'crash', shouldCrash: true });
    } catch (err) {
      console.log('  Task 2 caused worker crash (expected)');
    }

    // Give time for replacement
    await new Promise(resolve => setTimeout(resolve, 200));

    // Third task should work (replacement worker)
    await pool.execute({ id: 3, type: 'work', duration: 100 });
    console.log('  Task 3 completed on replacement worker');

    const stats = pool.getStats();
    console.log('  Workers replaced:', stats.workersReplaced);

    if (stats.workersReplaced > 0) {
      console.log('  ✓ Worker replacement working\n');
    } else {
      console.log('  ✗ No workers were replaced\n');
    }

    await pool.shutdown();
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 5: Pool statistics
  console.log('Test 5: Pool statistics accuracy');
  try {
    const pool = new WorkerPool(testWorkerPath, 3);

    // Execute some tasks
    await Promise.all([
      pool.execute({ id: 1, duration: 100 }),
      pool.execute({ id: 2, duration: 100 }),
      pool.execute({ id: 3, duration: 100 }),
      pool.execute({ id: 4, duration: 100 }),
      pool.execute({ id: 5, duration: 100 })
    ]);

    const stats = pool.getStats();
    console.log('  Final statistics:', stats);

    if (stats.tasksCompleted === 5 && stats.workersCreated >= 3) {
      console.log('  ✓ Statistics accurate\n');
    } else {
      console.log('  ✗ Statistics incorrect\n');
    }

    await pool.shutdown();
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Cleanup
  fs.unlinkSync(testWorkerPath);

  console.log('=== Tests Complete ===');
  console.log('\nHINTS:');
  console.log('- Track worker state (busy: true/false)');
  console.log('- Use a queue (array) for pending tasks');
  console.log('- Listen for worker "exit" events to detect crashes');
  console.log('- Replace crashed workers automatically');
  console.log('- Process queue when a worker becomes available');
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = WorkerPool;
