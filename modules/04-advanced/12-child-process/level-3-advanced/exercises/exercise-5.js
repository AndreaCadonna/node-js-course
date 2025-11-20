/**
 * Exercise 5: Distributed Processing System
 *
 * Design and implement a distributed processing framework that:
 * - Distributes work across multiple workers
 * - Implements map-reduce pattern
 * - Handles worker failures gracefully
 * - Balances load automatically
 * - Aggregates results efficiently
 * - Supports different task types
 *
 * Requirements:
 * 1. Implement map-reduce for data processing
 * 2. Dynamic load balancing across workers
 * 3. Fault tolerance with task reassignment
 * 4. Result aggregation with custom reducers
 * 5. Support for different task types/handlers
 * 6. Progress tracking and reporting
 * 7. Efficient data serialization
 *
 * Bonus:
 * - Add task dependencies (DAG execution)
 * - Implement speculative execution
 * - Add data locality awareness
 * - Support pipeline processing
 */

const { fork } = require('child_process');
const { EventEmitter } = require('events');

/**
 * DistributedProcessor - Framework for distributed processing
 *
 * YOUR TASK: Implement this class with all required features
 */
class DistributedProcessor extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.workerCount = options.workerCount || 4;
    this.workerScript = options.workerScript;
    this.faultTolerance = options.faultTolerance !== false;
    this.maxTaskRetries = options.maxTaskRetries || 3;
    this.loadBalanceStrategy = options.loadBalanceStrategy || 'round-robin';

    // TODO: Initialize state
    // - workers array
    // - task assignments
    // - results storage
    // - task handlers
    // - progress tracking
  }

  /**
   * Initialize the processor
   * TODO: Setup workers and handlers
   */
  async initialize() {
    // TODO: Implement initialization
    // 1. Create worker pool
    // 2. Register default task handlers
    // 3. Setup fault detection
    // 4. Emit ready event
    throw new Error('Not implemented');
  }

  /**
   * Register a task handler
   * TODO: Register handler for task type
   */
  registerHandler(taskType, handler) {
    // TODO: Store task handler
    // Handler is a function: (data) => result
    throw new Error('Not implemented');
  }

  /**
   * Execute map-reduce job
   * TODO: Implement map-reduce pattern
   *
   * @param {Array} data - Input data array
   * @param {Function} mapFn - Map function
   * @param {Function} reduceFn - Reduce function
   * @param {*} initialValue - Initial reducer value
   */
  async mapReduce(data, mapFn, reduceFn, initialValue) {
    // TODO: Implement map-reduce
    // 1. Split data into chunks
    // 2. Map phase: process each chunk in parallel
    // 3. Collect map results
    // 4. Reduce phase: combine results
    // 5. Return final result
    throw new Error('Not implemented');
  }

  /**
   * Map phase
   * TODO: Distribute map tasks to workers
   */
  async mapPhase(data, mapFn) {
    // TODO: Implement map phase
    // 1. Create map tasks from data
    // 2. Distribute to workers
    // 3. Collect results
    // 4. Handle failures
    // 5. Return mapped data
    throw new Error('Not implemented');
  }

  /**
   * Reduce phase
   * TODO: Aggregate mapped results
   */
  async reducePhase(mappedData, reduceFn, initialValue) {
    // TODO: Implement reduce phase
    // 1. Partition mapped data
    // 2. Parallel reduce on partitions
    // 3. Final reduce on partial results
    // 4. Return aggregated result
    throw new Error('Not implemented');
  }

  /**
   * Submit a task
   * TODO: Execute a single task
   */
  async submitTask(taskType, taskData) {
    // TODO: Implement task submission
    // 1. Create task object
    // 2. Select worker (load balancing)
    // 3. Assign task to worker
    // 4. Wait for result
    // 5. Handle failure/retry
    throw new Error('Not implemented');
  }

  /**
   * Select worker for task
   * TODO: Implement load balancing
   */
  selectWorker(task) {
    // TODO: Implement load balancing strategies
    // - round-robin: distribute evenly
    // - least-busy: assign to worker with fewest tasks
    // - random: random selection
    // - locality: prefer worker with related data
    throw new Error('Not implemented');
  }

  /**
   * Handle task failure
   * TODO: Retry or reassign failed task
   */
  async handleTaskFailure(task, error) {
    // TODO: Implement fault tolerance
    // 1. Increment retry count
    // 2. Check if under max retries
    // 3. Reassign to different worker
    // 4. Or fail task permanently
    // 5. Update progress
    throw new Error('Not implemented');
  }

  /**
   * Handle worker failure
   * TODO: Recover from worker crash
   */
  async handleWorkerFailure(worker) {
    // TODO: Implement worker failure handling
    // 1. Identify tasks assigned to worker
    // 2. Reassign tasks to other workers
    // 3. Restart worker if auto-restart enabled
    // 4. Update worker pool
    throw new Error('Not implemented');
  }

  /**
   * Get processing progress
   * TODO: Return current progress stats
   */
  getProgress() {
    // TODO: Calculate and return progress
    // - Total tasks
    // - Completed tasks
    // - Failed tasks
    // - In-progress tasks
    // - Estimated time remaining
    throw new Error('Not implemented');
  }

  /**
   * Batch process tasks
   * TODO: Process multiple tasks in batches
   */
  async processBatch(tasks, batchSize = null) {
    // TODO: Implement batch processing
    // 1. Group tasks into batches
    // 2. Process each batch in parallel
    // 3. Collect results
    // 4. Handle failures
    // 5. Return all results
    throw new Error('Not implemented');
  }

  /**
   * Pipeline processing
   * TODO: Chain multiple processing stages
   */
  async pipeline(data, stages) {
    // TODO: Implement pipeline
    // stages = [stage1Fn, stage2Fn, stage3Fn]
    // Each stage processes output of previous stage
    // 1. Start with input data
    // 2. For each stage: map data through stage function
    // 3. Pass results to next stage
    // 4. Return final results
    throw new Error('Not implemented');
  }

  /**
   * Execute DAG (Directed Acyclic Graph)
   * BONUS: Execute tasks with dependencies
   */
  async executeDAG(taskGraph) {
    // TODO: Implement DAG execution
    // taskGraph = {
    //   'task1': { fn: ..., deps: [] },
    //   'task2': { fn: ..., deps: ['task1'] },
    //   'task3': { fn: ..., deps: ['task1', 'task2'] }
    // }
    // 1. Build dependency graph
    // 2. Find tasks with no dependencies
    // 3. Execute in topological order
    // 4. Wait for dependencies before executing
    throw new Error('Not implemented');
  }

  /**
   * Partition data
   * TODO: Split data into chunks for workers
   */
  partitionData(data, partitionCount) {
    // TODO: Partition data
    // 1. Calculate partition size
    // 2. Split into equal chunks
    // 3. Handle remainder
    // 4. Return partitions array
    throw new Error('Not implemented');
  }

  /**
   * Serialize task data
   * TODO: Efficiently serialize for IPC
   */
  serializeTask(task) {
    // TODO: Implement efficient serialization
    // Consider:
    // - JSON for simple data
    // - Buffer for binary data
    // - Custom protocol for large data
    throw new Error('Not implemented');
  }

  /**
   * Deserialize task data
   * TODO: Deserialize received data
   */
  deserializeTask(data) {
    // TODO: Implement deserialization
    throw new Error('Not implemented');
  }

  /**
   * Get worker statistics
   * TODO: Return per-worker stats
   */
  getWorkerStats() {
    // TODO: Return worker statistics
    // - Tasks processed per worker
    // - Current load per worker
    // - Error rates
    // - Average processing time
    throw new Error('Not implemented');
  }

  /**
   * Rebalance load
   * TODO: Redistribute tasks across workers
   */
  async rebalance() {
    // TODO: Implement load rebalancing
    // 1. Calculate current load distribution
    // 2. Identify overloaded workers
    // 3. Move tasks to underutilized workers
    // 4. Update assignments
    throw new Error('Not implemented');
  }

  /**
   * Shutdown processor
   * TODO: Clean shutdown
   */
  async shutdown() {
    // TODO: Implement shutdown
    // 1. Stop accepting new tasks
    // 2. Wait for in-progress tasks
    // 3. Shutdown workers
    // 4. Clean up resources
    throw new Error('Not implemented');
  }
}

/**
 * Test your implementation
 */
async function test() {
  console.log('=== Testing Distributed Processing System ===\n');

  const fs = require('fs');
  const path = require('path');

  // Create worker script
  const workerCode = `
const handlers = {
  map: (data) => data.value * 2,
  reduce: (acc, val) => acc + val,
  square: (n) => n * n,
  filter: (n) => n % 2 === 0 ? n : null
};

process.on('message', async (msg) => {
  try {
    const handler = handlers[msg.type];
    if (!handler) {
      throw new Error(\`Unknown task type: \${msg.type}\`);
    }

    const result = handler(msg.data);

    process.send({
      type: 'task_result',
      taskId: msg.taskId,
      result
    });
  } catch (error) {
    process.send({
      type: 'task_error',
      taskId: msg.taskId,
      error: error.message
    });
  }
});
`;

  const workerScript = path.join(__dirname, 'test-distributed-worker.js');
  fs.writeFileSync(workerScript, workerCode);

  try {
    const processor = new DistributedProcessor({
      workerCount: 4,
      workerScript,
      faultTolerance: true
    });

    await processor.initialize();
    console.log('✓ Processor initialized\n');

    // Test 1: Map-Reduce
    console.log('Test 1: Map-Reduce (sum of squares)');
    const numbers = Array.from({ length: 20 }, (_, i) => i + 1);

    const sum = await processor.mapReduce(
      numbers,
      (n) => n * n,
      (acc, val) => acc + val,
      0
    );

    const expected = numbers.reduce((a, b) => a + b * b, 0);
    console.log(`Result: ${sum}`);
    console.log(`Expected: ${expected}`);
    console.log(sum === expected ? '✓ Correct' : '✗ Incorrect');
    console.log('');

    // Test 2: Batch processing
    console.log('Test 2: Batch processing');
    const tasks = Array.from({ length: 10 }, (_, i) => ({
      type: 'square',
      data: i + 1
    }));

    const results = await processor.processBatch(tasks, 3);
    console.log(`Processed ${results.length} tasks`);
    console.log('✓ Batch processing complete\n');

    // Test 3: Pipeline
    console.log('Test 3: Pipeline processing');
    const pipelineData = Array.from({ length: 10 }, (_, i) => i + 1);

    const pipelineResult = await processor.pipeline(pipelineData, [
      (n) => n * 2,      // Double
      (n) => n + 1,      // Add 1
      (n) => n % 2 === 0 ? n : null  // Filter evens
    ]);

    console.log('Pipeline result:', pipelineResult.filter(x => x !== null));
    console.log('✓ Pipeline complete\n');

    // Test 4: Progress tracking
    console.log('Test 4: Progress tracking');
    const progress = processor.getProgress();
    console.log(progress);
    console.log('');

    // Test 5: Worker statistics
    console.log('Test 5: Worker statistics');
    const stats = processor.getWorkerStats();
    console.log(stats);
    console.log('');

    await processor.shutdown();
    fs.unlinkSync(workerScript);

    console.log('=== All Tests Passed ===');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Uncomment to test
// test().catch(console.error);

module.exports = { DistributedProcessor };

/**
 * Hints:
 *
 * 1. Map-Reduce:
 *    - Map: parallelize across workers
 *    - Shuffle: group intermediate results
 *    - Reduce: parallelize reduction, then final reduce
 *
 * 2. Load Balancing:
 *    - Round-robin: cyclic assignment
 *    - Least-busy: track pending tasks per worker
 *    - Track worker.busyCount and increment/decrement
 *
 * 3. Fault Tolerance:
 *    - Track task.retries count
 *    - On failure: if retries < max, reassign to different worker
 *    - Keep task state: pending, processing, completed, failed
 *
 * 4. Data Partitioning:
 *    - chunkSize = Math.ceil(data.length / workerCount)
 *    - Create chunks with slice(i * chunkSize, (i+1) * chunkSize)
 *
 * 5. Pipeline:
 *    - Start with input
 *    - For each stage: result = await mapPhase(result, stageFn)
 *    - Return final result
 *
 * 6. Progress Tracking:
 *    - Track: total, completed, failed, inProgress
 *    - Update on task state changes
 *    - Calculate percentage and ETA
 *
 * 7. DAG Execution (Bonus):
 *    - Build adjacency list
 *    - Topological sort
 *    - Execute when all dependencies complete
 *    - Use Promise.all for dependencies
 */
