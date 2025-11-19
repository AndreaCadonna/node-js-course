/**
 * Exercise 4: Log File Processor
 *
 * OBJECTIVE:
 * Learn to process data line by line using streams and transform data.
 *
 * REQUIREMENTS:
 * 1. Create a sample log file with mixed INFO, WARN, ERROR entries
 * 2. Read the log file line by line
 * 3. Filter only ERROR level entries
 * 4. Write filtered errors to a new file
 * 5. Count total errors found
 * 6. Display summary at the end
 * 7. Handle errors properly
 *
 * LEARNING GOALS:
 * - Processing streams line by line
 * - Filtering data in streams
 * - Combining readable and writable streams
 * - Working with readline module
 * - Data transformation in streams
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// File paths
const LOG_FILE = path.join(__dirname, 'application.log');
const ERROR_FILE = path.join(__dirname, 'errors-only.log');

/**
 * TODO 1: Create a sample log file
 * Create a log file with multiple entries of different levels
 * Include at least 10 INFO, 5 WARN, and 5 ERROR entries
 */
function createSampleLog() {
  console.log('Creating sample log file...');

  // Your code here
  // Sample format: [2025-11-19T10:30:45.123Z] LEVEL: message

  // You can use this sample data or create your own:
  const logLines = [
    '[2025-11-19T10:00:00.000Z] INFO: Application started',
    '[2025-11-19T10:00:01.000Z] DEBUG: Configuration loaded',
    '[2025-11-19T10:00:02.000Z] INFO: Database connected',
    '[2025-11-19T10:00:03.000Z] ERROR: Failed to connect to cache server',
    '[2025-11-19T10:00:04.000Z] INFO: Starting HTTP server',
    '[2025-11-19T10:00:05.000Z] WARN: Memory usage above 80%',
    '[2025-11-19T10:00:06.000Z] INFO: Server listening on port 3000',
    '[2025-11-19T10:00:07.000Z] ERROR: Database query timeout',
    '[2025-11-19T10:00:08.000Z] INFO: Request received',
    '[2025-11-19T10:00:09.000Z] WARN: Slow query detected',
    '[2025-11-19T10:00:10.000Z] ERROR: Authentication failed for user123',
    '[2025-11-19T10:00:11.000Z] INFO: Request processed',
    '[2025-11-19T10:00:12.000Z] ERROR: Payment processing failed',
    '[2025-11-19T10:00:13.000Z] WARN: Rate limit exceeded',
    '[2025-11-19T10:00:14.000Z] INFO: Cache updated',
    '[2025-11-19T10:00:15.000Z] ERROR: File not found: config.json',
    '[2025-11-19T10:00:16.000Z] INFO: Cleanup completed',
  ];

  // Write these lines to the log file

  console.log('Sample log file created\n');
}

/**
 * TODO 2: Process log file and extract errors
 *
 * Steps:
 * 1. Create a readable stream from the log file
 * 2. Create a writable stream to the error file
 * 3. Use readline.createInterface() to process line by line
 * 4. For each line:
 *    - Check if it contains 'ERROR'
 *    - If yes, write it to the error file
 *    - Increment error counter
 * 5. When done, display summary:
 *    - Total lines processed
 *    - Total errors found
 *    - Error file location
 * 6. Handle errors properly
 *
 * @returns {Promise<object>} Statistics (totalLines, errorCount)
 */
function processLogFile() {
  return new Promise((resolve, reject) => {
    console.log('Processing log file...\n');

    // Your code here
    // Hint: Use readline.createInterface with input stream
  });
}

/**
 * TODO 3: Main function
 *
 * 1. Create the sample log file
 * 2. Process the log file
 * 3. Display the results
 * 4. Optional: Display a few sample error lines
 */
async function main() {
  console.log('=== Log File Processor Exercise ===\n');

  try {
    // Your code here

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// TODO 4: Run the program
// Call your main function here
