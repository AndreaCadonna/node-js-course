/**
 * Exercise 4 Solution: Log File Processor
 *
 * This solution demonstrates:
 * - Processing files line by line with readline
 * - Filtering stream data
 * - Combining readable and writable streams
 * - Counting and statistics
 * - Practical log file analysis
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// File paths
const LOG_FILE = path.join(__dirname, 'application.log');
const ERROR_FILE = path.join(__dirname, 'errors-only.log');

/**
 * Create a sample log file with mixed severity levels
 * This simulates a real application log
 */
function createSampleLog() {
  console.log('Creating sample log file...');

  // Sample log entries with various levels
  const logLines = [
    '[2025-11-19T10:00:00.000Z] INFO: Application started successfully',
    '[2025-11-19T10:00:01.234Z] DEBUG: Configuration loaded from /etc/app/config.json',
    '[2025-11-19T10:00:02.456Z] INFO: Database connection established to postgres://localhost:5432',
    '[2025-11-19T10:00:03.789Z] ERROR: Failed to connect to cache server at redis://localhost:6379',
    '[2025-11-19T10:00:04.012Z] INFO: Starting HTTP server on port 3000',
    '[2025-11-19T10:00:05.345Z] WARN: Memory usage above 80% threshold (current: 85%)',
    '[2025-11-19T10:00:06.678Z] INFO: Server listening and ready to accept connections',
    '[2025-11-19T10:00:07.901Z] ERROR: Database query timeout after 30s for query: SELECT * FROM users',
    '[2025-11-19T10:00:08.234Z] INFO: Incoming request: GET /api/users',
    '[2025-11-19T10:00:09.567Z] WARN: Slow query detected: 2.5s for GET /api/users',
    '[2025-11-19T10:00:10.890Z] ERROR: Authentication failed for user: john@example.com - Invalid credentials',
    '[2025-11-19T10:00:11.123Z] INFO: Request completed: GET /api/users - 200 OK',
    '[2025-11-19T10:00:12.456Z] ERROR: Payment processing failed for order #12345 - Gateway timeout',
    '[2025-11-19T10:00:13.789Z] WARN: Rate limit exceeded for IP: 192.168.1.100',
    '[2025-11-19T10:00:14.012Z] INFO: Cache invalidated for key: user_session_abc123',
    '[2025-11-19T10:00:15.345Z] ERROR: File not found: /var/app/config/database.json',
    '[2025-11-19T10:00:16.678Z] INFO: Background job completed: email_queue_processor',
    '[2025-11-19T10:00:17.901Z] DEBUG: Heap memory: 145MB / 512MB',
    '[2025-11-19T10:00:18.234Z] WARN: Deprecated API endpoint called: /api/v1/users (use /api/v2/users)',
    '[2025-11-19T10:00:19.567Z] INFO: Database connection pool size: 10/20',
    '[2025-11-19T10:00:20.890Z] ERROR: Unhandled exception: TypeError: Cannot read property of undefined',
    '[2025-11-19T10:00:21.123Z] INFO: Graceful shutdown initiated',
    '[2025-11-19T10:00:22.456Z] INFO: All connections closed',
    '[2025-11-19T10:00:23.789Z] INFO: Cleanup completed successfully',
    '[2025-11-19T10:00:24.012Z] INFO: Application stopped',
  ];

  // Write to file
  fs.writeFileSync(LOG_FILE, logLines.join('\n') + '\n', 'utf8');

  console.log(`Sample log file created: ${LOG_FILE}`);
  console.log(`Total lines: ${logLines.length}\n`);

  return logLines.length;
}

/**
 * Process log file and extract error entries
 *
 * @returns {Promise<object>} Statistics object
 */
function processLogFile() {
  return new Promise((resolve, reject) => {
    console.log('Processing log file...\n');

    let totalLines = 0;
    let errorCount = 0;
    const errorLines = [];

    // Create readable stream from log file
    const inputStream = fs.createReadStream(LOG_FILE);

    // Create writable stream for errors
    const outputStream = fs.createWriteStream(ERROR_FILE);

    // Create readline interface to process line by line
    const rl = readline.createInterface({
      input: inputStream,
      crlfDelay: Infinity // Handle both \r\n and \n line endings
    });

    // Process each line
    rl.on('line', (line) => {
      totalLines++;

      // Check if line contains ERROR
      if (line.includes('ERROR')) {
        errorCount++;
        errorLines.push(line);

        // Write to error file
        outputStream.write(line + '\n');

        // Display the error
        console.log(`Found error #${errorCount}:`);
        console.log(`  ${line}\n`);
      }
    });

    // Handle completion
    rl.on('close', () => {
      // End the output stream
      outputStream.end();

      outputStream.on('finish', () => {
        console.log('=== Processing Complete ===');
        console.log(`Total lines processed: ${totalLines}`);
        console.log(`Errors found: ${errorCount}`);
        console.log(`Error percentage: ${((errorCount / totalLines) * 100).toFixed(1)}%`);
        console.log(`Error file created: ${ERROR_FILE}\n`);

        resolve({
          totalLines,
          errorCount,
          errorLines
        });
      });
    });

    // Handle errors
    inputStream.on('error', (error) => {
      console.error('Error reading log file:', error.message);
      reject(error);
    });

    outputStream.on('error', (error) => {
      console.error('Error writing error file:', error.message);
      reject(error);
    });
  });
}

/**
 * Alternative implementation using Transform stream
 * This shows a more stream-oriented approach
 */
function processWithTransform() {
  return new Promise((resolve, reject) => {
    console.log('\n=== Processing with Transform Stream ===\n');

    const { Transform } = require('stream');

    let lineCount = 0;
    let errorCount = 0;

    // Create a transform stream that filters errors
    const errorFilter = new Transform({
      transform(chunk, encoding, callback) {
        // Split chunk into lines
        const lines = chunk.toString().split('\n');

        lines.forEach(line => {
          if (line.trim()) {
            lineCount++;

            // Only pass through ERROR lines
            if (line.includes('ERROR')) {
              errorCount++;
              this.push(line + '\n');
            }
          }
        });

        callback();
      }
    });

    const inputStream = fs.createReadStream(LOG_FILE);
    const outputStream = fs.createWriteStream(
      path.join(__dirname, 'errors-transform.log')
    );

    // Use pipeline for better error handling
    const { pipeline } = require('stream');

    pipeline(
      inputStream,
      errorFilter,
      outputStream,
      (error) => {
        if (error) {
          console.error('Pipeline error:', error.message);
          reject(error);
        } else {
          console.log('Transform processing completed');
          console.log(`Lines: ${lineCount}, Errors: ${errorCount}\n`);
          resolve({ lineCount, errorCount });
        }
      }
    );
  });
}

/**
 * Analyze error patterns in the extracted errors
 * This demonstrates further processing of filtered data
 */
async function analyzeErrors(errorLines) {
  console.log('=== Error Analysis ===\n');

  // Count errors by type
  const errorTypes = {};

  errorLines.forEach(line => {
    // Extract error type (simple pattern matching)
    if (line.includes('Failed to connect')) {
      errorTypes['Connection'] = (errorTypes['Connection'] || 0) + 1;
    } else if (line.includes('timeout')) {
      errorTypes['Timeout'] = (errorTypes['Timeout'] || 0) + 1;
    } else if (line.includes('Authentication failed')) {
      errorTypes['Authentication'] = (errorTypes['Authentication'] || 0) + 1;
    } else if (line.includes('Payment')) {
      errorTypes['Payment'] = (errorTypes['Payment'] || 0) + 1;
    } else if (line.includes('File not found')) {
      errorTypes['File System'] = (errorTypes['File System'] || 0) + 1;
    } else if (line.includes('exception')) {
      errorTypes['Exception'] = (errorTypes['Exception'] || 0) + 1;
    } else {
      errorTypes['Other'] = (errorTypes['Other'] || 0) + 1;
    }
  });

  console.log('Error Types:');
  Object.entries(errorTypes)
    .sort(([, a], [, b]) => b - a) // Sort by count descending
    .forEach(([type, count]) => {
      console.log(`  ${type.padEnd(20)}: ${count}`);
    });

  console.log();
}

/**
 * Display sample errors from the error file
 */
async function displaySampleErrors() {
  console.log('=== Sample Error Entries ===\n');

  try {
    const content = await fs.promises.readFile(ERROR_FILE, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    // Display first 3 errors
    const samplesToShow = Math.min(3, lines.length);

    for (let i = 0; i < samplesToShow; i++) {
      console.log(`${i + 1}. ${lines[i]}`);
    }

    if (lines.length > samplesToShow) {
      console.log(`\n... and ${lines.length - samplesToShow} more errors`);
    }

    console.log();
  } catch (error) {
    console.error('Error reading error file:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('=== Log File Processor Solution ===\n');

  try {
    // Step 1: Create sample log file
    createSampleLog();

    // Step 2: Process log file (readline approach)
    const stats = await processLogFile();

    // Step 3: Analyze the errors
    await analyzeErrors(stats.errorLines);

    // Step 4: Display sample errors
    await displaySampleErrors();

    // Step 5: Demonstrate transform approach
    await processWithTransform();

    console.log('=== All Processing Complete ===\n');

  } catch (error) {
    console.error('Error in main:', error.message);
  }
}

// Run the program
main();

/**
 * KEY LEARNING POINTS:
 *
 * 1. readline Module:
 *    - Processes files line by line
 *    - Memory efficient for large files
 *    - Works with readable streams
 *    - Handles different line endings
 *
 * 2. Line-by-Line Processing:
 *    - readline.createInterface() creates line reader
 *    - 'line' event fires for each line
 *    - 'close' event fires when done
 *    - crlfDelay handles Windows/Unix line endings
 *
 * 3. Filtering Data:
 *    - Process each line individually
 *    - Apply filtering logic
 *    - Write only matching lines to output
 *
 * 4. Transform Streams:
 *    - Can also be used for line filtering
 *    - More stream-oriented approach
 *    - Good for complex transformations
 *
 * 5. Practical Applications:
 *    - Log file analysis
 *    - Data filtering and extraction
 *    - Report generation
 *    - Error monitoring
 *
 * 6. Best Practices:
 *    - Use readline for text files
 *    - Process line by line for memory efficiency
 *    - Close streams properly
 *    - Use pipeline() for better error handling
 *    - Provide meaningful statistics
 */
