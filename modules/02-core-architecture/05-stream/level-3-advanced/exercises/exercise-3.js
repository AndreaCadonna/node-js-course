/**
 * Exercise 3: Multi-Source Data Aggregator
 * =========================================
 *
 * Difficulty: Hard
 *
 * Task:
 * Build a stream aggregator that combines data from multiple sources, processes them
 * in parallel, and merges the results intelligently. Implement fan-out, parallel
 * processing, and fan-in patterns with proper coordination and error handling.
 *
 * Requirements:
 * 1. Create DataAggregator class that coordinates multiple streams
 * 2. Implement parallel processing with configurable worker count
 * 3. Implement fan-out to distribute work across workers
 * 4. Implement fan-in to merge results
 * 5. Handle different data sources (files, APIs, databases)
 * 6. Implement priority-based processing
 * 7. Track processing statistics per worker
 * 8. Handle errors without stopping the entire pipeline
 * 9. Implement result ordering (maintain input order in output)
 * 10. Support graceful shutdown of all workers
 *
 * Scenario:
 * Aggregate data from three sources:
 * - Source A: User data (high priority)
 * - Source B: Transaction data (medium priority)
 * - Source C: Log data (low priority)
 *
 * Processing:
 * - Validate each record
 * - Enrich with additional data
 * - Transform to common format
 * - Merge and deduplicate
 *
 * Run: node exercise-3.js
 */

const { Transform, PassThrough, Readable, Writable, pipeline } = require('stream');

// Simulated data sources
class DataSource {
  static createUserStream() {
    const users = Array.from({ length: 100 }, (_, i) => ({
      type: 'user',
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      priority: 'high'
    }));
    return Readable.from(users);
  }

  static createTransactionStream() {
    const transactions = Array.from({ length: 200 }, (_, i) => ({
      type: 'transaction',
      id: i + 1,
      userId: Math.floor(Math.random() * 100) + 1,
      amount: Math.random() * 1000,
      priority: 'medium'
    }));
    return Readable.from(transactions);
  }

  static createLogStream() {
    const logs = Array.from({ length: 500 }, (_, i) => ({
      type: 'log',
      id: i + 1,
      message: `Log entry ${i + 1}`,
      timestamp: new Date(),
      priority: 'low'
    }));
    return Readable.from(logs);
  }
}

// TODO: Implement Worker class
class Worker extends Transform {
  constructor(workerId, options) {
    super({ objectMode: true, ...options });

    this.workerId = workerId;

    // TODO: Initialize worker state
    // - Processed count
    // - Error count
    // - Processing time stats
  }

  async _transform(item, encoding, callback) {
    // TODO: Implement worker processing
    // 1. Validate item
    // 2. Enrich with additional data
    // 3. Transform to common format
    // 4. Track statistics
    // 5. Handle errors gracefully

    callback(null, item);
  }

  async validate(item) {
    // TODO: Implement validation logic for different types
  }

  async enrich(item) {
    // TODO: Enrich item with additional data
    // Simulate async data lookup
  }

  transform(item) {
    // TODO: Transform to common output format
  }

  getStatistics() {
    // TODO: Return worker statistics
  }
}

// TODO: Implement DataAggregator class
class DataAggregator {
  constructor(numWorkers = 3) {
    this.numWorkers = numWorkers;

    // TODO: Initialize aggregator
    // - Create worker pool
    // - Setup fan-out mechanism
    // - Setup fan-in mechanism
    // - Initialize statistics
  }

  addSource(stream, name, priority) {
    // TODO: Add data source to aggregator
    // - Assign priority
    // - Connect to fan-out
  }

  createWorkerPool() {
    // TODO: Create pool of worker streams
  }

  createFanOut() {
    // TODO: Implement fan-out to distribute work
    // - Round-robin distribution
    // - Consider priority
  }

  createFanIn() {
    // TODO: Implement fan-in to merge results
    // - Merge results from all workers
    // - Maintain order if needed
    // - Handle completion
  }

  async process() {
    // TODO: Start processing pipeline
    // - Connect all sources
    // - Start workers
    // - Return merged output stream
  }

  async shutdown() {
    // TODO: Gracefully shutdown all workers
    // - Wait for pending work
    // - Close all streams
    // - Return final statistics
  }

  getStatistics() {
    // TODO: Aggregate statistics from all workers
  }
}

// =============================================================================
// Test Cases
// =============================================================================

async function test1() {
  console.log('Test 1: Basic Multi-Source Aggregation\n');

  // TODO: Create aggregator with 3 workers
  // TODO: Add all three data sources
  // TODO: Process and count results
  // TODO: Verify all sources processed
  // TODO: Display statistics per worker

  console.log('\n✓ Test 1 complete\n');
  test2();
}

async function test2() {
  console.log('Test 2: Priority-Based Processing\n');

  // TODO: Create aggregator
  // TODO: Add sources with different priorities
  // TODO: Verify high-priority items processed first
  // TODO: Display processing order statistics

  console.log('\n✓ Test 2 complete\n');
  test3();
}

async function test3() {
  console.log('Test 3: Error Handling and Recovery\n');

  // TODO: Create aggregator
  // TODO: Add sources with some invalid data
  // TODO: Verify errors don't stop processing
  // TODO: Verify valid data still processed
  // TODO: Display error statistics

  console.log('\n✓ Test 3 complete\n');
  test4();
}

async function test4() {
  console.log('Test 4: Worker Load Balancing\n');

  // TODO: Create aggregator with 4 workers
  // TODO: Process large dataset
  // TODO: Verify work distributed evenly
  // TODO: Display load distribution

  console.log('\n✓ Test 4 complete\n');
  showSummary();
}

function showSummary() {
  console.log('=== Exercise 3 Summary ===\n');
  console.log('TODO: Implement the following:');
  console.log('1. Worker class for parallel processing');
  console.log('2. Fan-out to distribute work');
  console.log('3. Fan-in to merge results');
  console.log('4. Priority-based processing');
  console.log('5. Multi-source coordination');
  console.log('6. Error handling without stopping pipeline');
  console.log('7. Load balancing across workers');
  console.log('8. Statistics tracking per worker');
  console.log('9. Graceful shutdown');
  console.log('\nArchitecture:');
  console.log('  Sources → Fan-Out → Workers (parallel) → Fan-In → Output');
  console.log('\nHints:');
  console.log('- Use PassThrough for fan-out/fan-in');
  console.log('- Track worker assignments for balancing');
  console.log('- Use priority queues for priority processing');
  console.log('- Emit events for coordination');
  console.log('- Use object mode throughout');
}

// Start tests
test1();

// =============================================================================
// Expected Output Format:
// =============================================================================

/**
 * Test 1: Basic Multi-Source Aggregation
 *
 * Adding sources:
 *   ✓ User stream (100 items, priority: high)
 *   ✓ Transaction stream (200 items, priority: medium)
 *   ✓ Log stream (500 items, priority: low)
 *
 * Processing with 3 workers...
 *
 * Statistics:
 *   Total processed: 800
 *   Worker 1: 267 items (33.4%)
 *   Worker 2: 267 items (33.4%)
 *   Worker 3: 266 items (33.2%)
 *
 *   By type:
 *     User: 100
 *     Transaction: 200
 *     Log: 500
 *
 *   Errors: 0
 *   Duration: 1.25s
 *
 * ✓ Load balanced correctly
 * ✓ Test 1 complete
 *
 * Test 2: Priority-Based Processing
 *
 * Processing order:
 *   → High priority items first: 100
 *   → Medium priority items: 200
 *   → Low priority items: 500
 *
 * ✓ Priority ordering maintained
 * ✓ Test 2 complete
 */
