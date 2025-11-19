/**
 * 02-writable-stream.js
 * ======================
 * Demonstrates basic writable stream operations using fs.createWriteStream
 *
 * Key Concepts:
 * - Creating writable streams to files
 * - Writing data with write()
 * - Closing streams with end()
 * - Handling 'finish' event
 * - Error handling for write operations
 *
 * Run: node 02-writable-stream.js
 */

const fs = require('fs');
const path = require('path');

console.log('=== Writable Stream Example ===\n');

// =============================================================================
// EXAMPLE 1: Basic Writing
// =============================================================================

console.log('--- Example 1: Basic Write Operations ---\n');

const outputPath = path.join(__dirname, 'output.txt');

// Create a writable stream
// This opens a file for writing (creates it if it doesn't exist)
const writableStream = fs.createWriteStream(outputPath, {
  encoding: 'utf8',           // Encode strings as UTF-8
  flags: 'w',                 // 'w' = write (overwrite if exists)
  // Other flags: 'a' = append, 'wx' = write but fail if exists
});

console.log('✓ Writable stream created');
console.log(`✓ Writing to: ${outputPath}\n`);

// Write data to the stream
// The write() method returns a boolean:
// - true: buffer is not full, safe to write more
// - false: buffer is full, should wait for 'drain' event (we'll cover this later)

let writeSuccess;

writeSuccess = writableStream.write('Line 1: Hello from writable stream!\n');
console.log(`✓ Wrote line 1 - Continue writing: ${writeSuccess}`);

writeSuccess = writableStream.write('Line 2: Streams are awesome!\n');
console.log(`✓ Wrote line 2 - Continue writing: ${writeSuccess}`);

writeSuccess = writableStream.write('Line 3: This is efficient for large data!\n');
console.log(`✓ Wrote line 3 - Continue writing: ${writeSuccess}`);

// The end() method signals that no more data will be written
// You can optionally pass final data to write
writableStream.end('Line 4: Final line (written with end())\n');

console.log('✓ Called end() - no more writes allowed\n');

// The 'finish' event fires when all data has been flushed to the file
writableStream.on('finish', () => {
  console.log('✓ Stream finished - all data written to disk');
  console.log(`✓ File size: ${fs.statSync(outputPath).size} bytes\n`);

  // Read back the file to verify
  const content = fs.readFileSync(outputPath, 'utf8');
  console.log('--- File Contents ---');
  console.log(content);

  // Continue with Example 2
  example2WritingLargeData();
});

// Error handling is crucial for writable streams
writableStream.on('error', (error) => {
  console.error('❌ Write stream error:', error.message);
});

// =============================================================================
// EXAMPLE 2: Writing Large Amounts of Data
// =============================================================================

function example2WritingLargeData() {
  console.log('\n--- Example 2: Writing Large Data ---\n');

  const largeFilePath = path.join(__dirname, 'large-output.txt');
  const writableStream = fs.createWriteStream(largeFilePath);

  const iterations = 100000; // Write 100k lines
  let linesWritten = 0;

  console.log(`Writing ${iterations.toLocaleString()} lines...`);
  const startTime = Date.now();

  // Write data in a loop
  for (let i = 1; i <= iterations; i++) {
    const line = `Line ${i}: This is sample data for demonstration ${Date.now()}\n`;
    writableStream.write(line);
    linesWritten++;

    // Log progress every 25k lines
    if (i % 25000 === 0) {
      console.log(`  Progress: ${i.toLocaleString()} lines written`);
    }
  }

  // Signal completion
  writableStream.end();

  writableStream.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const fileSize = fs.statSync(largeFilePath).size;

    console.log(`\n✓ Finished writing ${linesWritten.toLocaleString()} lines`);
    console.log(`✓ Time taken: ${duration}ms`);
    console.log(`✓ File size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`✓ Write speed: ${Math.round(linesWritten / duration * 1000).toLocaleString()} lines/sec\n`);

    // Continue with Example 3
    example3ErrorHandling();
  });

  writableStream.on('error', (error) => {
    console.error('❌ Error writing large file:', error.message);
  });
}

// =============================================================================
// EXAMPLE 3: Error Handling
// =============================================================================

function example3ErrorHandling() {
  console.log('--- Example 3: Error Handling ---\n');

  // Try to write to an invalid path (will cause an error)
  const invalidPath = '/root/cannot-write-here/file.txt';

  console.log(`Attempting to write to: ${invalidPath}`);
  const writableStream = fs.createWriteStream(invalidPath);

  // Set up error handler BEFORE writing
  writableStream.on('error', (error) => {
    console.error('❌ Expected error caught:', error.code);
    console.error('   Error message:', error.message);
    console.log('\n✓ Error was handled gracefully\n');

    // Clean up and finish
    cleanupAndFinish();
  });

  // This write will fail
  writableStream.write('This will not be written\n');
  writableStream.end();

  // Note: Without an error handler, this would crash the process!
}

// =============================================================================
// Cleanup
// =============================================================================

function cleanupAndFinish() {
  console.log('=== Key Takeaways ===');
  console.log('• Use write() to add data to the stream');
  console.log('• Use end() to signal completion (optionally with final data)');
  console.log('• Listen to "finish" event to know when writing is done');
  console.log('• ALWAYS add error handlers to prevent crashes');
  console.log('• Streams are perfect for writing large files efficiently');
  console.log('• write() returns false when buffer is full (backpressure)\n');

  // Clean up created files
  try {
    fs.unlinkSync(outputPath);
    fs.unlinkSync(path.join(__dirname, 'large-output.txt'));
    console.log('✓ Cleanup: Sample files deleted');
  } catch (error) {
    // Files might not exist, that's okay
  }
}

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * WRITABLE STREAM METHODS:
 *
 * - write(chunk, [encoding], [callback])
 *   Writes data to the stream
 *   Returns true if buffer is not full, false if full
 *
 * - end([chunk], [encoding], [callback])
 *   Signals that no more data will be written
 *   Optionally writes final chunk
 *
 * - cork()
 *   Forces buffering of writes
 *
 * - uncork()
 *   Flushes all buffered writes
 *
 * WRITABLE STREAM EVENTS:
 *
 * - 'finish': All data has been flushed to underlying system
 * - 'drain': Buffer is no longer full, safe to write more
 * - 'error': An error occurred
 * - 'pipe': A readable stream is piped to this writable
 * - 'unpipe': A readable stream is unpiped from this writable
 * - 'close': Stream is closed
 */
