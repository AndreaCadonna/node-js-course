/**
 * Exercise 1 Solution: Read and Count
 *
 * This solution demonstrates:
 * - Creating and reading from a readable stream
 * - Tracking stream statistics (bytes, chunks, time)
 * - Handling stream events (data, end, error)
 * - Performance measurement
 */

const fs = require('fs');
const path = require('path');

// File paths
const TEST_FILE = path.join(__dirname, 'test-data.txt');

/**
 * Create a test file with sample data
 * We'll create a file with at least 1KB of text for testing
 */
function createTestFile() {
  console.log('Creating test file...');

  // Create a string and repeat it to make a larger file
  const line = 'This is a test line for stream reading exercise. Lorem ipsum dolor sit amet.\n';
  const content = line.repeat(100); // Creates approximately 7.5KB

  // Write the file synchronously
  fs.writeFileSync(TEST_FILE, content, 'utf8');

  const stats = fs.statSync(TEST_FILE);
  console.log(`Test file created: ${TEST_FILE}`);
  console.log(`File size: ${stats.size} bytes\n`);
}

/**
 * Read file using streams and collect statistics
 * This demonstrates the core stream reading pattern
 */
function readAndCount() {
  // Initialize tracking variables
  let totalBytes = 0;
  let chunkCount = 0;
  const startTime = Date.now();

  console.log('Starting to read file with streams...\n');

  // Create a readable stream
  // By default, it uses a 64KB buffer
  const readStream = fs.createReadStream(TEST_FILE);

  // Listen for the 'data' event - fires each time a chunk is ready
  readStream.on('data', (chunk) => {
    chunkCount++;
    totalBytes += chunk.length;

    // Log each chunk (optional, useful for learning)
    console.log(`Chunk ${chunkCount}: ${chunk.length} bytes`);
  });

  // Listen for the 'end' event - fires when all data has been read
  readStream.on('end', () => {
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    console.log('\n=== Reading Complete ===');
    console.log(`Total bytes read: ${totalBytes}`);
    console.log(`Number of chunks: ${chunkCount}`);
    console.log(`Time taken: ${elapsedTime}ms`);
    console.log(`Average chunk size: ${Math.round(totalBytes / chunkCount)} bytes`);

    // Calculate throughput
    const throughputMBps = (totalBytes / 1024 / 1024) / (elapsedTime / 1000);
    console.log(`Throughput: ${throughputMBps.toFixed(2)} MB/s`);
  });

  // Listen for the 'error' event - important for handling errors
  readStream.on('error', (error) => {
    console.error('Error reading file:', error.message);
  });

  // Optional: Listen to 'open' event to know when file is opened
  readStream.on('open', (fd) => {
    console.log(`File opened (file descriptor: ${fd})\n`);
  });

  // Optional: Listen to 'close' event to know when stream is closed
  readStream.on('close', () => {
    console.log('\nStream closed');
  });
}

/**
 * Alternative implementation using different buffer sizes
 * This shows how to control the chunk size
 */
function readWithCustomBufferSize() {
  console.log('\n\n=== Reading with Custom Buffer Size (16KB) ===\n');

  let totalBytes = 0;
  let chunkCount = 0;

  // Create stream with custom highWaterMark (buffer size)
  const readStream = fs.createReadStream(TEST_FILE, {
    highWaterMark: 16 * 1024 // 16KB chunks
  });

  readStream.on('data', (chunk) => {
    chunkCount++;
    totalBytes += chunk.length;
    console.log(`Chunk ${chunkCount}: ${chunk.length} bytes`);
  });

  readStream.on('end', () => {
    console.log(`\nTotal: ${totalBytes} bytes in ${chunkCount} chunks`);
    console.log(`Average chunk size: ${Math.round(totalBytes / chunkCount)} bytes`);
  });

  readStream.on('error', (error) => {
    console.error('Error:', error.message);
  });
}

/**
 * Main execution
 */
function main() {
  console.log('=== Stream Read and Count Solution ===\n');

  // Create the test file
  createTestFile();

  // Read and count with default buffer
  readAndCount();

  // Wait a bit, then demonstrate custom buffer size
  setTimeout(() => {
    readWithCustomBufferSize();
  }, 100);
}

// Run the program
main();

/**
 * KEY LEARNING POINTS:
 *
 * 1. Readable Stream Events:
 *    - 'data': Emitted when chunk is available
 *    - 'end': Emitted when no more data
 *    - 'error': Emitted on errors
 *    - 'open': Emitted when file is opened
 *    - 'close': Emitted when stream is closed
 *
 * 2. Stream Options:
 *    - highWaterMark: Controls buffer size (default 64KB)
 *    - encoding: Can set to 'utf8' for string chunks
 *
 * 3. Performance:
 *    - Streams are efficient for large files
 *    - Process data in chunks, not all at once
 *    - Memory usage stays constant regardless of file size
 *
 * 4. Best Practices:
 *    - Always handle 'error' event
 *    - Clean up resources properly
 *    - Use appropriate buffer sizes for your use case
 */
