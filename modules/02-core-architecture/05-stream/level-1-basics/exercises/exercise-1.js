/**
 * Exercise 1: Read and Count
 *
 * OBJECTIVE:
 * Learn to work with readable streams by reading a file and collecting statistics.
 *
 * REQUIREMENTS:
 * 1. Create a test file with some content (at least 1KB)
 * 2. Create a readable stream to read the file
 * 3. Track the following statistics:
 *    - Total bytes read
 *    - Number of chunks received
 *    - Time taken to read the file
 * 4. Display statistics when reading is complete
 * 5. Handle errors properly
 *
 * LEARNING GOALS:
 * - Understanding readable streams
 * - Working with 'data' and 'end' events
 * - Measuring performance
 * - Error handling in streams
 */

const fs = require('fs');
const path = require('path');

// File paths
const TEST_FILE = path.join(__dirname, 'test-data.txt');

/**
 * TODO 1: Create a test file with sample data
 * Use fs.writeFileSync to create a file with at least 1KB of text
 * Hint: Repeat a string multiple times to make it larger
 */
function createTestFile() {
  // Your code here
}

/**
 * TODO 2: Implement the main function to read and count
 *
 * Steps:
 * 1. Initialize variables to track:
 *    - totalBytes (number)
 *    - chunkCount (number)
 *    - startTime (Date.now())
 * 2. Create a readable stream using fs.createReadStream()
 * 3. Listen to the 'data' event to:
 *    - Increment chunkCount
 *    - Add chunk.length to totalBytes
 *    - Optional: Log each chunk info
 * 4. Listen to the 'end' event to:
 *    - Calculate elapsed time
 *    - Display all statistics
 * 5. Listen to the 'error' event to handle errors
 */
function readAndCount() {
  // Your code here
}

// TODO 3: Run the program
// First create the test file, then read and count

console.log('=== Stream Read and Count Exercise ===\n');

// Call your functions here
