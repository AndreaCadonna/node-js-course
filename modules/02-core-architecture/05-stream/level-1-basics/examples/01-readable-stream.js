/**
 * 01-readable-stream.js
 * ======================
 * Demonstrates basic readable stream operations using fs.createReadStream
 *
 * Key Concepts:
 * - Creating readable streams from files
 * - Listening to 'data' events for chunks
 * - Handling 'end' event when stream completes
 * - Measuring bytes read and memory usage
 * - Comparing streams vs. readFileSync
 *
 * Run: node 01-readable-stream.js
 */

const fs = require('fs');
const path = require('path');

console.log('=== Readable Stream Example ===\n');

// First, let's create a sample file to read from
const filePath = path.join(__dirname, 'sample-data.txt');
const sampleData = 'Hello from Node.js streams!\n'.repeat(1000); // ~28KB of data

// Create sample file
fs.writeFileSync(filePath, sampleData);
console.log(`✓ Created sample file: ${filePath}`);
console.log(`✓ File size: ${fs.statSync(filePath).size} bytes\n`);

// =============================================================================
// METHOD 1: Using Readable Stream (Memory Efficient)
// =============================================================================

console.log('--- Reading file with streams (RECOMMENDED) ---\n');

// Track memory and bytes
let bytesRead = 0;
const startMemory = process.memoryUsage().heapUsed;

// Create a readable stream
// The highWaterMark option controls chunk size (default is 64KB)
const readableStream = fs.createReadStream(filePath, {
  encoding: 'utf8',        // Decode buffer to string automatically
  highWaterMark: 16 * 1024  // Read 16KB at a time (16384 bytes)
});

console.log('Stream created. Starting to read data...\n');

// The 'data' event fires whenever a chunk of data is available
// This is called "flowing mode" - data flows automatically
readableStream.on('data', (chunk) => {
  bytesRead += chunk.length;
  console.log(`📦 Received chunk: ${chunk.length} bytes`);
  console.log(`   Total read so far: ${bytesRead} bytes`);

  // In a real application, you would process the chunk here
  // For example: parse JSON, search for patterns, transform data, etc.
  // The key advantage: only one chunk is in memory at a time!
});

// The 'end' event fires when there's no more data to read
readableStream.on('end', () => {
  const endMemory = process.memoryUsage().heapUsed;
  const memoryUsed = endMemory - startMemory;

  console.log('\n✓ Stream finished reading');
  console.log(`✓ Total bytes read: ${bytesRead}`);
  console.log(`✓ Memory used: ~${Math.round(memoryUsed / 1024)}KB\n`);

  // Continue with the comparison after stream finishes
  demonstrateReadFileSync();
});

// The 'error' event fires if something goes wrong
readableStream.on('error', (error) => {
  console.error('❌ Stream error:', error.message);
});

// =============================================================================
// METHOD 2: Using readFileSync (Memory Intensive) - For Comparison
// =============================================================================

function demonstrateReadFileSync() {
  console.log('--- Reading file with readFileSync (NOT RECOMMENDED for large files) ---\n');

  const startMemory = process.memoryUsage().heapUsed;

  // readFileSync loads the ENTIRE file into memory at once
  const data = fs.readFileSync(filePath, 'utf8');

  const endMemory = process.memoryUsage().heapUsed;
  const memoryUsed = endMemory - startMemory;

  console.log(`✓ Read entire file at once: ${data.length} bytes`);
  console.log(`✓ Memory used: ~${Math.round(memoryUsed / 1024)}KB\n`);

  console.log('=== Key Takeaways ===');
  console.log('• Streams read data in chunks (lower memory usage)');
  console.log('• readFileSync loads entire file (higher memory usage)');
  console.log('• For large files (GB+), streams are essential');
  console.log('• Streams allow processing data as it arrives');
  console.log('• Streams are non-blocking (better for async operations)\n');

  // Clean up
  fs.unlinkSync(filePath);
  console.log('✓ Cleanup: Sample file deleted');
}

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * STREAM MODES:
 *
 * 1. Flowing Mode (used above):
 *    - Data flows automatically
 *    - Triggered by 'data' event listener
 *    - or by calling .pipe() or .resume()
 *
 * 2. Paused Mode:
 *    - Data doesn't flow automatically
 *    - Must call .read() to consume data
 *    - Default mode when stream is created
 *
 * WHEN TO USE STREAMS:
 * - Reading/writing large files
 * - Network requests/responses
 * - Processing data that doesn't fit in memory
 * - Real-time data processing
 * - Building data pipelines
 */
