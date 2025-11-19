/**
 * Exercise 3: Copy Files with Streams
 *
 * OBJECTIVE:
 * Learn to pipe streams together and compare performance with traditional methods.
 *
 * REQUIREMENTS:
 * 1. Create a test file (at least 1MB)
 * 2. Implement file copy using streams (with pipe)
 * 3. Show progress during copying (bytes copied)
 * 4. Measure time taken
 * 5. Compare with fs.copyFile() performance
 * 6. Handle errors properly in the pipeline
 *
 * LEARNING GOALS:
 * - Using pipe() to connect streams
 * - Monitoring stream progress
 * - Understanding stream performance benefits
 * - Error handling in pipelines
 */

const fs = require('fs');
const path = require('path');

// File paths
const SOURCE_FILE = path.join(__dirname, 'source-large.txt');
const DEST_FILE_STREAM = path.join(__dirname, 'dest-stream.txt');
const DEST_FILE_COPY = path.join(__dirname, 'dest-copy.txt');

/**
 * TODO 1: Create a large test file
 * Create a file with at least 1MB of data
 * Tip: Create a string and repeat it many times
 */
function createLargeFile() {
  console.log('Creating test file...');

  // Your code here
  // Hint: const data = 'Some text...\n'.repeat(50000);

  console.log('Test file created\n');
}

/**
 * TODO 2: Copy file using streams
 *
 * Steps:
 * 1. Initialize variables:
 *    - bytesWritten = 0
 *    - startTime = Date.now()
 * 2. Create readable stream from source file
 * 3. Create writable stream to destination file
 * 4. Listen to 'data' event on readable stream to track progress
 * 5. Use pipe() to connect readable to writable
 * 6. Listen to 'finish' event on writable to:
 *    - Calculate elapsed time
 *    - Display statistics (bytes copied, time, speed)
 * 7. Handle errors on both streams
 *
 * @returns {Promise<object>} Statistics object with bytes and time
 */
function copyWithStreams() {
  return new Promise((resolve, reject) => {
    console.log('Copying with streams...');

    // Your code here
  });
}

/**
 * TODO 3: Copy file using fs.copyFile
 *
 * Measure the time taken to copy using the built-in method
 *
 * @returns {Promise<object>} Statistics object with time
 */
async function copyWithCopyFile() {
  console.log('\nCopying with fs.copyFile...');

  // Your code here
  // Hint: Use Date.now() before and after fs.promises.copyFile()
}

/**
 * TODO 4: Compare both methods
 *
 * Run both copy methods and display comparison
 */
async function comparePerformance() {
  console.log('=== File Copy Performance Comparison ===\n');

  // Your code here:
  // 1. Create the large file
  // 2. Copy with streams and get stats
  // 3. Copy with fs.copyFile and get stats
  // 4. Display comparison
  // 5. Clean up files (optional)
}

// TODO 5: Run the comparison
// Call your function here
