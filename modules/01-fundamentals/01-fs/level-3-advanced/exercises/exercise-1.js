/**
 * Exercise 1: Large File Processor
 *
 * DIFFICULTY: ⭐⭐⭐ Advanced
 * TIME: 30-40 minutes
 *
 * OBJECTIVE:
 * Build a command-line tool that processes large log files efficiently
 * using streams, without loading the entire file into memory.
 *
 * REQUIREMENTS:
 * 1. Accept a log file path as command-line argument
 * 2. Process file line-by-line using streams
 * 3. Extract and count different log levels (INFO, WARN, ERROR)
 * 4. Find all unique IP addresses in the logs
 * 5. Calculate average response time from log entries
 * 6. Show progress indicator while processing
 * 7. Write summary to output file
 * 8. Handle files larger than available RAM
 *
 * LOG FORMAT EXAMPLE:
 * 2024-01-15 10:23:45 [INFO] 192.168.1.100 - Request processed in 120ms
 * 2024-01-15 10:23:46 [ERROR] 192.168.1.101 - Failed to connect
 * 2024-01-15 10:23:47 [WARN] 192.168.1.102 - Slow query: 450ms
 *
 * OUTPUT FORMAT:
 * Log File Analysis Report
 * ========================
 * File: server.log
 * Size: 2.5 GB
 * Lines processed: 10,234,567
 *
 * Log Levels:
 *   INFO:  8,234,123 (80.4%)
 *   WARN:  1,123,444 (11.0%)
 *   ERROR:   877,000 ( 8.6%)
 *
 * Unique IP Addresses: 45,678
 * Average Response Time: 156ms
 * Processing Time: 45.2s
 *
 * BONUS CHALLENGES:
 * - Add filtering by date range
 * - Support multiple log formats
 * - Parallel processing for multiple files
 * - Generate visualization (ASCII chart)
 * - Detect anomalies (error spikes)
 * - Export to JSON, CSV, or HTML
 * - Real-time tailing mode (watch for new entries)
 * - Compression support (.gz, .zip)
 *
 * HINTS:
 * - Use Transform streams for line processing
 * - Use Set for unique values
 * - Track file size for progress calculation
 * - Use regex for parsing log entries
 * - Handle backpressure properly
 */

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { Transform } = require('stream');

// TODO: Implement your solution here

/**
 * Line-by-line transform stream
 */
class LineTransform extends Transform {
  constructor(options) {
    super(options);
    // TODO: Implement buffering for incomplete lines
  }

  _transform(chunk, encoding, callback) {
    // TODO: Split chunk into lines and process
  }

  _flush(callback) {
    // TODO: Handle any remaining buffer
  }
}

/**
 * Log analyzer transform stream
 */
class LogAnalyzer extends Transform {
  constructor(options) {
    super(options);
    this.stats = {
      logLevels: {},
      ipAddresses: new Set(),
      responseTimes: [],
      totalLines: 0
    };
  }

  _transform(chunk, encoding, callback) {
    // TODO: Parse and analyze each log line
  }

  getStats() {
    // TODO: Return analysis statistics
  }
}

/**
 * Progress tracking transform
 */
class ProgressTransform extends Transform {
  constructor(totalSize, options) {
    super(options);
    this.totalSize = totalSize;
    this.processedBytes = 0;
  }

  _transform(chunk, encoding, callback) {
    // TODO: Track and display progress
  }
}

/**
 * Main processing function
 */
async function processLogFile(logFilePath, outputPath) {
  // TODO: Implement main logic
  // 1. Get file size
  // 2. Create read stream
  // 3. Create transform streams (line parser, analyzer, progress)
  // 4. Pipe streams together
  // 5. Generate and write report
}

/**
 * Generate test log file
 */
async function generateTestLog(filePath, sizeInMB) {
  // TODO: Generate realistic log file for testing
}

/**
 * Format report
 */
function formatReport(stats, filePath, processingTime) {
  // TODO: Create formatted text report
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node exercise-1.js <log-file> [output-file]');
    console.log('');
    console.log('Generate test file:');
    console.log('  node exercise-1.js --generate <size-mb> <output-file>');
    process.exit(0);
  }

  // TODO: Parse arguments and run processing
}

// main();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Generate test file:
 *    node exercise-1.js --generate 100 test-logs.txt
 *
 * 2. Process the file:
 *    node exercise-1.js test-logs.txt report.txt
 *
 * 3. Verify output:
 *    cat report.txt
 *
 * 4. Test with large file (1GB+):
 *    node exercise-1.js --generate 1000 large-log.txt
 *    node exercise-1.js large-log.txt large-report.txt
 *
 * 5. Monitor memory usage:
 *    node --max-old-space-size=512 exercise-1.js large-log.txt
 *    (Should work with only 512MB heap)
 */

/**
 * EXAMPLE LOG PATTERNS:
 *
 * const logPatterns = [
 *   '${timestamp} [INFO] ${ip} - Request to ${endpoint} completed in ${ms}ms',
 *   '${timestamp} [WARN] ${ip} - Slow query detected: ${ms}ms',
 *   '${timestamp} [ERROR] ${ip} - ${error}',
 *   '${timestamp} [INFO] ${ip} - User ${user} logged in',
 *   '${timestamp} [ERROR] ${ip} - Database connection failed',
 * ];
 */

/**
 * STREAM PIPELINE EXAMPLE:
 *
 * const { pipeline } = require('stream');
 *
 * await new Promise((resolve, reject) => {
 *   pipeline(
 *     fs.createReadStream(inputFile),
 *     new LineTransform(),
 *     new LogAnalyzer(),
 *     new ProgressTransform(fileSize),
 *     (err) => err ? reject(err) : resolve()
 *   );
 * });
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - How do streams help with large files?
 * - What is backpressure and why does it matter?
 * - How do you track progress with streams?
 * - What are the memory implications of different approaches?
 * - How do you handle incomplete lines at chunk boundaries?
 */
