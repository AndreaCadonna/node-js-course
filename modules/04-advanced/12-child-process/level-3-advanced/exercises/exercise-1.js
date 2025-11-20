/**
 * Exercise 1: Build a Process Manager
 *
 * Create a production-ready process manager with the following features:
 * - Worker pool with configurable size
 * - Task queue with priority support
 * - Auto-restart on worker failure
 * - Health monitoring
 * - Graceful shutdown
 * - Performance metrics
 *
 * Requirements:
 * 1. Create a ProcessManager class that manages a pool of workers
 * 2. Implement task queuing with priority levels (high, normal, low)
 * 3. Add health checks that ping workers every N seconds
 * 4. Restart workers that fail or become unresponsive
 * 5. Collect metrics: tasks completed, avg time, error rate
 * 6. Implement graceful shutdown with timeout
 * 7. Add events for important lifecycle changes
 *
 * Bonus:
 * - Implement worker specialization (different worker types)
 * - Add task timeout with automatic retry
 * - Implement backpressure (limit queue size)
 * - Add worker warmup/cooldown
 */

const { fork } = require('child_process');
const { EventEmitter } = require('events');

/**
 * ProcessManager - Manage a pool of worker processes
 *
 * YOUR TASK: Implement this class with all required features
 */
class ProcessManager extends EventEmitter {
  constructor(options = {}) {
    super();

    // TODO: Initialize configuration
    this.workerPath = options.workerPath;
    this.poolSize = options.poolSize || 4;
    this.healthCheckInterval = options.healthCheckInterval || 5000;
    this.maxRestarts = options.maxRestarts || 3;
    this.shutdownTimeout = options.shutdownTimeout || 5000;

    // TODO: Initialize internal state
    // - workers array
    // - task queues (by priority)
    // - metrics
    // - timers
  }

  /**
   * Initialize the process manager
   * TODO: Create the worker pool and start monitoring
   */
  async initialize() {
    // TODO: Implement initialization
    // 1. Create workers
    // 2. Start health checks
    // 3. Emit 'ready' event
    throw new Error('Not implemented');
  }

  /**
   * Create a worker process
   * TODO: Create and configure a worker
   */
  createWorker(id) {
    // TODO: Implement worker creation
    // 1. Fork the worker script
    // 2. Setup event listeners (message, error, exit)
    // 3. Initialize worker metadata
    // 4. Return worker info object
    throw new Error('Not implemented');
  }

  /**
   * Submit a task for execution
   * TODO: Queue a task and execute when worker available
   *
   * @param {object} task - Task data
   * @param {string} priority - 'high', 'normal', or 'low'
   * @returns {Promise} Resolves with task result
   */
  async execute(task, priority = 'normal') {
    // TODO: Implement task execution
    // 1. Validate priority
    // 2. Create task promise
    // 3. Add to appropriate queue
    // 4. Try to assign to available worker
    // 5. Return promise
    throw new Error('Not implemented');
  }

  /**
   * Get next task from queues (priority order)
   * TODO: Implement priority-based task selection
   */
  getNextTask() {
    // TODO: Check queues in priority order
    // 1. High priority first
    // 2. Normal priority second
    // 3. Low priority last
    throw new Error('Not implemented');
  }

  /**
   * Assign task to worker
   * TODO: Send task to worker and track it
   */
  assignTask(worker, task) {
    // TODO: Implement task assignment
    // 1. Mark worker as busy
    // 2. Store current task
    // 3. Send message to worker
    // 4. Start task timeout if configured
    throw new Error('Not implemented');
  }

  /**
   * Handle worker message
   * TODO: Process messages from workers
   */
  handleMessage(worker, message) {
    // TODO: Handle different message types
    // - task_complete: resolve task, free worker
    // - task_error: reject task, free worker
    // - health_check_response: update health status
    throw new Error('Not implemented');
  }

  /**
   * Handle worker exit
   * TODO: Cleanup and potentially restart worker
   */
  handleExit(worker, code, signal) {
    // TODO: Implement exit handling
    // 1. Fail any current task
    // 2. Remove from workers array
    // 3. Decide whether to restart
    // 4. Emit events
    throw new Error('Not implemented');
  }

  /**
   * Start health check monitoring
   * TODO: Periodically check worker health
   */
  startHealthChecks() {
    // TODO: Implement health checking
    // 1. Set up interval
    // 2. Ping each worker
    // 3. Track response times
    // 4. Kill unresponsive workers
    throw new Error('Not implemented');
  }

  /**
   * Perform health check on a worker
   * TODO: Check if worker is responsive
   */
  async healthCheck(worker) {
    // TODO: Implement single health check
    // 1. Send health check message
    // 2. Wait for response with timeout
    // 3. Return health status
    throw new Error('Not implemented');
  }

  /**
   * Get current statistics
   * TODO: Return performance metrics
   */
  getStats() {
    // TODO: Return comprehensive statistics
    // - Pool size and availability
    // - Queue sizes by priority
    // - Tasks completed/failed
    // - Average processing time
    // - Worker-specific stats
    throw new Error('Not implemented');
  }

  /**
   * Graceful shutdown
   * TODO: Stop all workers cleanly
   */
  async shutdown() {
    // TODO: Implement graceful shutdown
    // 1. Stop accepting new tasks
    // 2. Stop health checks
    // 3. Send shutdown signal to workers
    // 4. Wait for workers to exit (with timeout)
    // 5. Force kill if timeout exceeded
    throw new Error('Not implemented');
  }
}

/**
 * Test your implementation
 */
async function test() {
  console.log('=== Testing Process Manager ===\n');

  // Create a test worker file
  const fs = require('fs');
  const path = require('path');

  const workerCode = `
process.on('message', async (msg) => {
  if (msg.type === 'task') {
    try {
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, msg.data.duration || 100));

      process.send({
        type: 'task_complete',
        taskId: msg.taskId,
        result: { processed: msg.data, worker: process.pid }
      });
    } catch (error) {
      process.send({
        type: 'task_error',
        taskId: msg.taskId,
        error: error.message
      });
    }
  } else if (msg.type === 'health_check') {
    process.send({ type: 'health_check_response' });
  } else if (msg.type === 'shutdown') {
    process.exit(0);
  }
});
`;

  const workerPath = path.join(__dirname, 'test-worker.js');
  fs.writeFileSync(workerPath, workerCode);

  try {
    // Create manager
    const manager = new ProcessManager({
      workerPath,
      poolSize: 3,
      healthCheckInterval: 2000,
      maxRestarts: 2
    });

    // Test initialization
    console.log('Initializing manager...');
    await manager.initialize();
    console.log('✓ Manager initialized\n');

    // Test task execution with different priorities
    console.log('Submitting tasks...');

    const tasks = [
      manager.execute({ value: 1, duration: 100 }, 'high'),
      manager.execute({ value: 2, duration: 150 }, 'normal'),
      manager.execute({ value: 3, duration: 100 }, 'low'),
      manager.execute({ value: 4, duration: 100 }, 'high'),
      manager.execute({ value: 5, duration: 100 }, 'normal')
    ];

    const results = await Promise.all(tasks);
    console.log('✓ All tasks completed\n');

    // Test statistics
    console.log('Statistics:');
    const stats = manager.getStats();
    console.log(stats);
    console.log('');

    // Test shutdown
    console.log('Shutting down...');
    await manager.shutdown();
    console.log('✓ Shutdown complete\n');

    // Cleanup
    fs.unlinkSync(workerPath);

    console.log('=== All Tests Passed ===');
  } catch (error) {
    console.error('Test failed:', error.message);
    fs.unlinkSync(workerPath);
  }
}

// Uncomment to test your implementation
// test().catch(console.error);

module.exports = { ProcessManager };

/**
 * Hints:
 *
 * 1. Worker State Management:
 *    - Track: available, busy, currentTask, tasksProcessed, errors
 *    - Update state on task assignment and completion
 *
 * 2. Priority Queues:
 *    - Use separate arrays: highQueue, normalQueue, lowQueue
 *    - Or use a priority queue data structure
 *
 * 3. Health Checks:
 *    - Use setInterval for periodic checks
 *    - Implement timeout for health check responses
 *    - Kill and restart unhealthy workers
 *
 * 4. Graceful Shutdown:
 *    - Set a flag to reject new tasks
 *    - Send shutdown message to each worker
 *    - Use Promise.race with timeout
 *
 * 5. Metrics:
 *    - Track start/end time for each task
 *    - Use running counters for completed/failed
 *    - Calculate averages on demand
 *
 * 6. Events:
 *    - Emit: ready, worker_started, worker_failed, task_complete, shutdown
 *    - Allows external monitoring and integration
 */
