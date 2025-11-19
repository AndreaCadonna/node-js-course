/**
 * Exercise 1: High-Performance Log Processor
 * ===========================================
 *
 * Difficulty: Hard
 *
 * Task:
 * Build a high-performance log processing system that can handle millions of log entries
 * efficiently. The system must parse, filter, aggregate, and output processed logs while
 * maintaining high throughput and low memory usage.
 *
 * Requirements:
 * 1. Create a LogProcessor class that extends Transform
 * 2. Parse log lines in format: "TIMESTAMP|LEVEL|SOURCE|MESSAGE"
 * 3. Filter logs by level (configurable minimum level)
 * 4. Aggregate statistics: count by level, errors by source, messages per second
 * 5. Implement performance monitoring with throughput metrics
 * 6. Handle backpressure properly
 * 7. Batch output for efficiency (configurable batch size)
 * 8. Emit periodic statistics (every N records)
 *
 * Performance Goals:
 * - Process at least 100,000 records/second
 * - Memory usage < 100MB for 1M records
 * - Backpressure rate < 10%
 *
 * Example Input:
 * "2024-01-01T10:00:00.000Z|INFO|api-server|Request processed"
 * "2024-01-01T10:00:01.000Z|ERROR|database|Connection failed"
 * "2024-01-01T10:00:02.000Z|WARN|auth-service|Rate limit exceeded"
 *
 * Example Output:
 * {
 *   timestamp: Date,
 *   level: 'INFO',
 *   source: 'api-server',
 *   message: 'Request processed',
 *   processed_at: Date
 * }
 *
 * Run: node exercise-1.js
 */

const { Transform, Readable, Writable, pipeline } = require('stream');
const { performance } = require('perf_hooks');

// TODO: Implement LogProcessor class
class LogProcessor extends Transform {
  constructor(options = {}) {
    super({ objectMode: true, ...options });

    this.minLevel = options.minLevel || 'DEBUG';
    this.batchSize = options.batchSize || 100;
    this.statsInterval = options.statsInterval || 10000;

    // TODO: Initialize instance variables
    // - Level priority map
    // - Statistics counters
    // - Performance metrics
    // - Batch buffer
    // - Start time
  }

  _transform(line, encoding, callback) {
    // TODO: Implement log processing
    // 1. Parse log line
    // 2. Validate format
    // 3. Filter by level
    // 4. Update statistics
    // 5. Add to batch
    // 6. Flush batch if needed
    // 7. Emit statistics periodically

    callback();
  }

  parseLine(line) {
    // TODO: Parse log line into structured object
    // Handle errors gracefully
  }

  meetsLevelThreshold(level) {
    // TODO: Check if log level meets minimum threshold
  }

  updateStatistics(record) {
    // TODO: Update counters for statistics
  }

  emitStatistics() {
    // TODO: Emit statistics event with current metrics
  }

  flushBatch(callback) {
    // TODO: Flush current batch of records
  }

  _flush(callback) {
    // TODO: Flush remaining records and emit final statistics
    callback();
  }
}

// =============================================================================
// Test Cases
// =============================================================================

function generateTestLogs(count) {
  const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  const sources = ['api-server', 'database', 'auth-service', 'worker'];
  const messages = [
    'Request processed',
    'Database query executed',
    'User authenticated',
    'Cache miss',
    'Rate limit check',
    'Connection established'
  ];

  const logs = [];

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 3600000).toISOString();
    const level = levels[Math.floor(Math.random() * levels.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];

    logs.push(`${timestamp}|${level}|${source}|${message}`);
  }

  return logs;
}

async function test1() {
  console.log('Test 1: Basic Processing (1,000 records)\n');

  // TODO: Create processor with default options
  // TODO: Process test logs
  // TODO: Verify output count
  // TODO: Display statistics

  console.log('\n✓ Test 1 complete\n');
  test2();
}

async function test2() {
  console.log('Test 2: Level Filtering\n');

  // TODO: Create processor with minLevel='WARN'
  // TODO: Process test logs
  // TODO: Verify only WARN and ERROR are output

  console.log('\n✓ Test 2 complete\n');
  test3();
}

async function test3() {
  console.log('Test 3: Performance Test (100,000 records)\n');

  // TODO: Create processor
  // TODO: Process 100k records
  // TODO: Measure throughput
  // TODO: Verify throughput > 100,000 records/sec
  // TODO: Display performance metrics

  console.log('\n✓ Test 3 complete\n');
  test4();
}

async function test4() {
  console.log('Test 4: Memory Efficiency (1,000,000 records)\n');

  // TODO: Create processor
  // TODO: Measure initial memory
  // TODO: Process 1M records
  // TODO: Measure final memory
  // TODO: Verify memory growth < 100MB

  console.log('\n✓ Test 4 complete\n');
  showSummary();
}

function showSummary() {
  console.log('=== Exercise 1 Summary ===\n');
  console.log('TODO: Implement the following:');
  console.log('1. LogProcessor class with parsing logic');
  console.log('2. Level filtering based on priority');
  console.log('3. Statistics aggregation');
  console.log('4. Batch processing for efficiency');
  console.log('5. Performance monitoring');
  console.log('6. Memory-efficient processing');
  console.log('\nGoals:');
  console.log('- Throughput: > 100,000 records/sec');
  console.log('- Memory: < 100MB for 1M records');
  console.log('- Backpressure: < 10% of writes');
  console.log('\nHints:');
  console.log('- Use object mode for structured data');
  console.log('- Batch records before pushing');
  console.log('- Use performance.now() for timing');
  console.log('- Monitor process.memoryUsage()');
  console.log('- Check push() return value for backpressure');
}

// Start tests
test1();

// =============================================================================
// Expected Output Format:
// =============================================================================

/**
 * Test 1: Basic Processing
 *
 * Processing 1,000 records...
 *
 * Statistics:
 *   Total processed: 1,000
 *   By level:
 *     DEBUG: 250
 *     INFO: 250
 *     WARN: 250
 *     ERROR: 250
 *   By source:
 *     api-server: 250
 *     database: 250
 *     auth-service: 250
 *     worker: 250
 *   Duration: 0.05s
 *   Throughput: 20,000 records/sec
 *
 * ✓ Test 1 complete
 *
 * Test 3: Performance Test
 *
 * Processing 100,000 records...
 *
 * Performance Metrics:
 *   Records: 100,000
 *   Duration: 0.85s
 *   Throughput: 117,647 records/sec ✓
 *   Memory: 45.2 MB ✓
 *
 * ✓ Performance goals met!
 */
