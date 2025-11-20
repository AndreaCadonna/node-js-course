/**
 * EXERCISE 1: Stream Processing Task
 *
 * Difficulty: Intermediate
 * Estimated time: 30-40 minutes
 *
 * OBJECTIVE:
 * Build a log processor that reads log files, filters them, and outputs
 * statistics using process streams and piping.
 *
 * REQUIREMENTS:
 * 1. Read a log file using child processes
 * 2. Filter log lines by severity (ERROR, WARNING, INFO)
 * 3. Count occurrences of each severity level
 * 4. Use stream piping for efficient processing
 * 5. Handle backpressure properly
 * 6. Report statistics at the end
 *
 * INSTRUCTIONS:
 * Implement the LogProcessor class below with the following methods:
 * - processFile(filePath): Process a log file
 * - filterBySeverity(severity): Filter by specific severity
 * - getStats(): Return statistics object
 *
 * The class should use child processes and streams for all operations.
 *
 * TESTING:
 * Run: node exercise-1.js
 * The test code at the bottom will verify your implementation.
 */

const { spawn } = require('child_process');
const { Transform } = require('stream');
const fs = require('fs');

class LogProcessor {
  constructor() {
    this.stats = {
      ERROR: 0,
      WARNING: 0,
      INFO: 0,
      total: 0
    };
  }

  /**
   * Process a log file and collect statistics
   * @param {string} filePath - Path to the log file
   * @returns {Promise<Object>} Statistics object
   */
  async processFile(filePath) {
    // TODO: Implement this method
    // Hints:
    // 1. Use spawn() to cat the file
    // 2. Create a Transform stream to parse and count log lines
    // 3. Pipe the streams together
    // 4. Update this.stats as you process
    // 5. Return a promise that resolves with stats when done

    throw new Error('Not implemented');
  }

  /**
   * Filter log file by severity and return matching lines
   * @param {string} filePath - Path to the log file
   * @param {string} severity - Severity level to filter (ERROR, WARNING, INFO)
   * @returns {Promise<string[]>} Array of matching log lines
   */
  async filterBySeverity(filePath, severity) {
    // TODO: Implement this method
    // Hints:
    // 1. Use spawn() to read the file
    // 2. Use grep or a Transform stream to filter by severity
    // 3. Collect and return matching lines
    // 4. Handle the case where grep finds no matches (exit code 1)

    throw new Error('Not implemented');
  }

  /**
   * Get current statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      ERROR: 0,
      WARNING: 0,
      INFO: 0,
      total: 0
    };
  }
}

// ============================================================================
// TEST CODE - DO NOT MODIFY BELOW THIS LINE
// ============================================================================

async function runTests() {
  console.log('=== Exercise 1: Stream Processing Task ===\n');

  // Create test log file
  const testLogPath = '/tmp/test-app.log';
  const testLog = `
2025-01-15T10:00:00 INFO Server started on port 3000
2025-01-15T10:00:01 INFO Database connected
2025-01-15T10:00:05 ERROR Failed to load config file
2025-01-15T10:00:10 WARNING High memory usage detected
2025-01-15T10:00:15 INFO Request processed in 45ms
2025-01-15T10:00:20 ERROR Database connection lost
2025-01-15T10:00:25 ERROR Failed to reconnect to database
2025-01-15T10:00:30 WARNING Retry attempt 1 of 3
2025-01-15T10:00:35 INFO Successfully reconnected
2025-01-15T10:00:40 WARNING Cache miss rate high
`.trim();

  fs.writeFileSync(testLogPath, testLog);

  const processor = new LogProcessor();

  // Test 1: Process file and get statistics
  console.log('Test 1: Process log file and count severities');
  try {
    const stats = await processor.processFile(testLogPath);

    console.log('  Statistics:', stats);

    const expectedStats = {
      ERROR: 3,
      WARNING: 3,
      INFO: 4,
      total: 10
    };

    const statsMatch =
      stats.ERROR === expectedStats.ERROR &&
      stats.WARNING === expectedStats.WARNING &&
      stats.INFO === expectedStats.INFO &&
      stats.total === expectedStats.total;

    if (statsMatch) {
      console.log('  ✓ Statistics are correct\n');
    } else {
      console.log('  ✗ Statistics are incorrect');
      console.log('  Expected:', expectedStats);
      console.log('  Got:', stats);
      console.log();
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 2: Filter by ERROR severity
  console.log('Test 2: Filter logs by ERROR severity');
  try {
    const errors = await processor.filterBySeverity(testLogPath, 'ERROR');

    console.log(`  Found ${errors.length} ERROR lines:`);
    errors.forEach(line => console.log(`    ${line}`));

    if (errors.length === 3) {
      console.log('  ✓ Correct number of ERROR lines\n');
    } else {
      console.log(`  ✗ Expected 3 ERROR lines, got ${errors.length}\n`);
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 3: Filter by WARNING severity
  console.log('Test 3: Filter logs by WARNING severity');
  try {
    const warnings = await processor.filterBySeverity(testLogPath, 'WARNING');

    console.log(`  Found ${warnings.length} WARNING lines`);

    if (warnings.length === 3) {
      console.log('  ✓ Correct number of WARNING lines\n');
    } else {
      console.log(`  ✗ Expected 3 WARNING lines, got ${warnings.length}\n`);
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 4: Large file handling (backpressure test)
  console.log('Test 4: Process large log file');
  try {
    const largeLogPath = '/tmp/large-app.log';
    const lines = [];

    // Generate 1000 log lines
    for (let i = 0; i < 1000; i++) {
      const severity = ['ERROR', 'WARNING', 'INFO'][i % 3];
      lines.push(`2025-01-15T10:00:00 ${severity} Log entry ${i}`);
    }

    fs.writeFileSync(largeLogPath, lines.join('\n'));

    processor.resetStats();
    const stats = await processor.processFile(largeLogPath);

    console.log('  Processed 1000 log lines');
    console.log('  Statistics:', stats);

    if (stats.total === 1000) {
      console.log('  ✓ Large file processed successfully\n');
    } else {
      console.log(`  ✗ Expected 1000 total lines, got ${stats.total}\n`);
    }

    // Cleanup
    fs.unlinkSync(largeLogPath);
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Cleanup
  fs.unlinkSync(testLogPath);

  console.log('=== Tests Complete ===');
  console.log('\nHINTS:');
  console.log('- Use spawn() with cat or a similar command to read files');
  console.log('- Create Transform streams to process data line by line');
  console.log('- Use pipe() for automatic backpressure handling');
  console.log('- Handle stream errors with .on("error", handler)');
  console.log('- Use the "close" event to know when processing is complete');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = LogProcessor;
