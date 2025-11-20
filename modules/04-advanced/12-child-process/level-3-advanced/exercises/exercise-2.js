/**
 * Exercise 2: Task Queue System
 *
 * Build a distributed task queue system with the following features:
 * - Persistent task queue (survives restarts)
 * - Task priorities and scheduling
 * - Worker scaling (add/remove workers dynamically)
 * - Result caching
 * - Retry logic with exponential backoff
 * - Dead letter queue for failed tasks
 *
 * Requirements:
 * 1. Implement persistent queue using JSON file storage
 * 2. Support task scheduling (run at specific time)
 * 3. Implement dynamic worker scaling based on load
 * 4. Cache task results with TTL
 * 5. Retry failed tasks with exponential backoff
 * 6. Move permanently failed tasks to dead letter queue
 * 7. Provide queue management API
 *
 * Bonus:
 * - Add task dependencies (run task B after task A)
 * - Implement task batching
 * - Add rate limiting
 * - Provide web dashboard for monitoring
 */

const { fork } = require('child_process');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

/**
 * TaskQueue - Distributed task queue with persistence
 *
 * YOUR TASK: Implement this class with all required features
 */
class TaskQueue extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.workerPath = options.workerPath;
    this.minWorkers = options.minWorkers || 2;
    this.maxWorkers = options.maxWorkers || 10;
    this.queueFile = options.queueFile || './task-queue.json';
    this.cacheMaxAge = options.cacheMaxAge || 60000; // 1 minute
    this.maxRetries = options.maxRetries || 3;
    this.baseRetryDelay = options.baseRetryDelay || 1000;

    // TODO: Initialize state
    // - workers array
    // - pending tasks
    // - scheduled tasks
    // - dead letter queue
    // - result cache
  }

  /**
   * Initialize the queue system
   * TODO: Load persisted queue and start workers
   */
  async initialize() {
    // TODO: Implement initialization
    // 1. Load queue from disk
    // 2. Create initial workers
    // 3. Start scheduler for scheduled tasks
    // 4. Start autoscaler
    throw new Error('Not implemented');
  }

  /**
   * Add a task to the queue
   * TODO: Queue a task for execution
   *
   * @param {object} taskData - Task data
   * @param {object} options - { priority, scheduledFor, retry }
   * @returns {string} Task ID
   */
  async addTask(taskData, options = {}) {
    // TODO: Implement task addition
    // 1. Generate task ID
    // 2. Create task object with metadata
    // 3. Add to appropriate queue
    // 4. Persist queue
    // 5. Emit task_added event
    // 6. Try to process immediately
    throw new Error('Not implemented');
  }

  /**
   * Load queue from disk
   * TODO: Restore queue state from persistence
   */
  async loadQueue() {
    // TODO: Implement queue loading
    // 1. Read queue file
    // 2. Parse JSON
    // 3. Restore pending tasks
    // 4. Restore scheduled tasks
    // 5. Restore dead letter queue
    throw new Error('Not implemented');
  }

  /**
   * Save queue to disk
   * TODO: Persist current queue state
   */
  async saveQueue() {
    // TODO: Implement queue saving
    // 1. Collect all queue data
    // 2. Serialize to JSON
    // 3. Write atomically (write to temp file, then rename)
    throw new Error('Not implemented');
  }

  /**
   * Process a task
   * TODO: Execute task with retry logic
   */
  async processTask(task) {
    // TODO: Implement task processing
    // 1. Check cache for result
    // 2. Assign to available worker
    // 3. Handle success: cache result, remove from queue
    // 4. Handle failure: retry or move to DLQ
    // 5. Persist changes
    throw new Error('Not implemented');
  }

  /**
   * Retry a failed task
   * TODO: Implement retry logic with exponential backoff
   */
  async retryTask(task, error) {
    // TODO: Implement retry logic
    // 1. Increment retry count
    // 2. Check if under max retries
    // 3. Calculate backoff delay
    // 4. Schedule retry
    // 5. Or move to DLQ if max retries exceeded
    throw new Error('Not implemented');
  }

  /**
   * Calculate retry delay with exponential backoff
   * TODO: Calculate delay for next retry attempt
   */
  calculateRetryDelay(attempt) {
    // TODO: Implement exponential backoff
    // delay = baseDelay * (2 ^ attempt) + jitter
    throw new Error('Not implemented');
  }

  /**
   * Move task to dead letter queue
   * TODO: Handle permanently failed tasks
   */
  async moveToDeadLetterQueue(task, error) {
    // TODO: Implement DLQ
    // 1. Add error information
    // 2. Add to dead letter queue
    // 3. Remove from pending
    // 4. Persist
    // 5. Emit event
    throw new Error('Not implemented');
  }

  /**
   * Check and run scheduled tasks
   * TODO: Execute tasks scheduled for current time
   */
  processScheduledTasks() {
    // TODO: Implement scheduler
    // 1. Find tasks scheduled for now or past
    // 2. Move to pending queue
    // 3. Process them
    throw new Error('Not implemented');
  }

  /**
   * Cache a task result
   * TODO: Store result with TTL
   */
  cacheResult(taskKey, result) {
    // TODO: Implement caching
    // 1. Generate cache key
    // 2. Store with timestamp
    // 3. Implement LRU eviction if needed
    throw new Error('Not implemented');
  }

  /**
   * Get cached result
   * TODO: Retrieve cached result if valid
   */
  getCachedResult(taskKey) {
    // TODO: Implement cache lookup
    // 1. Check if cached
    // 2. Check if expired
    // 3. Return result or null
    throw new Error('Not implemented');
  }

  /**
   * Auto-scale workers based on load
   * TODO: Adjust worker count based on queue size
   */
  autoScale() {
    // TODO: Implement autoscaling
    // 1. Calculate current load
    // 2. Decide if need more/fewer workers
    // 3. Add or remove workers
    // 4. Stay within min/max bounds
    throw new Error('Not implemented');
  }

  /**
   * Add a worker
   * TODO: Spawn new worker process
   */
  async addWorker() {
    // TODO: Implement worker addition
    // 1. Check if under max workers
    // 2. Fork worker
    // 3. Setup event handlers
    // 4. Add to workers array
    throw new Error('Not implemented');
  }

  /**
   * Remove a worker
   * TODO: Gracefully remove worker
   */
  async removeWorker() {
    // TODO: Implement worker removal
    // 1. Find available worker
    // 2. Send shutdown signal
    // 3. Wait for graceful exit
    // 4. Remove from array
    throw new Error('Not implemented');
  }

  /**
   * Get queue statistics
   * TODO: Return comprehensive stats
   */
  getStats() {
    // TODO: Return statistics
    // - Pending tasks by priority
    // - Scheduled tasks count
    // - Dead letter queue size
    // - Worker count
    // - Cache hit rate
    // - Success/failure rates
    throw new Error('Not implemented');
  }

  /**
   * Get task status
   * TODO: Get status of a specific task
   */
  getTaskStatus(taskId) {
    // TODO: Find and return task status
    // - pending, processing, completed, failed, scheduled
    throw new Error('Not implemented');
  }

  /**
   * Cancel a task
   * TODO: Remove task from queue
   */
  async cancelTask(taskId) {
    // TODO: Implement task cancellation
    // 1. Find task in queues
    // 2. If processing, kill
    // 3. Remove from queue
    // 4. Persist
    throw new Error('Not implemented');
  }

  /**
   * Shutdown the queue system
   * TODO: Graceful shutdown
   */
  async shutdown() {
    // TODO: Implement shutdown
    // 1. Stop accepting new tasks
    // 2. Save current state
    // 3. Shutdown all workers
    // 4. Clear timers
    throw new Error('Not implemented');
  }
}

/**
 * Test your implementation
 */
async function test() {
  console.log('=== Testing Task Queue System ===\n');

  const workerCode = `
process.on('message', async (msg) => {
  if (msg.type === 'task') {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      if (Math.random() < 0.2) {
        throw new Error('Random failure');
      }

      process.send({
        type: 'task_result',
        taskId: msg.taskId,
        result: { processed: msg.data }
      });
    } catch (error) {
      process.send({
        type: 'task_error',
        taskId: msg.taskId,
        error: error.message
      });
    }
  }
});
`;

  const workerPath = path.join(__dirname, 'test-queue-worker.js');
  await fs.writeFile(workerPath, workerCode);

  try {
    const queue = new TaskQueue({
      workerPath,
      minWorkers: 2,
      maxWorkers: 5,
      queueFile: './test-queue.json',
      maxRetries: 3
    });

    await queue.initialize();
    console.log('✓ Queue initialized\n');

    // Add immediate tasks
    console.log('Adding immediate tasks...');
    for (let i = 1; i <= 5; i++) {
      await queue.addTask({ value: i }, { priority: 'normal' });
    }

    // Add scheduled task
    const scheduledTime = Date.now() + 2000;
    await queue.addTask(
      { value: 'scheduled' },
      { scheduledFor: scheduledTime }
    );
    console.log('✓ Tasks added\n');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check stats
    console.log('Statistics:');
    console.log(queue.getStats());

    await queue.shutdown();
    await fs.unlink(workerPath);
    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Uncomment to test
// test().catch(console.error);

module.exports = { TaskQueue };

/**
 * Hints:
 *
 * 1. Persistence:
 *    - Use JSON for simplicity
 *    - Write atomically: tmp file -> rename
 *    - Debounce writes to avoid excessive I/O
 *
 * 2. Scheduling:
 *    - Keep scheduled tasks separate
 *    - Use setInterval to check for due tasks
 *    - Store timestamp for each scheduled task
 *
 * 3. Autoscaling:
 *    - Calculate: queueSize / workerCount
 *    - If ratio > threshold, add worker
 *    - If ratio < threshold, remove worker
 *    - Check periodically with setInterval
 *
 * 4. Retry Logic:
 *    - delay = baseDelay * Math.pow(2, attempt)
 *    - Add jitter: + Math.random() * baseDelay
 *    - Use setTimeout for retry scheduling
 *
 * 5. Caching:
 *    - Key: JSON.stringify(taskData)
 *    - Value: { result, timestamp }
 *    - Check TTL on retrieval
 *
 * 6. Dead Letter Queue:
 *    - Separate array for failed tasks
 *    - Include: task, error, attempts, timestamps
 *    - Provide API to replay DLQ tasks
 */
