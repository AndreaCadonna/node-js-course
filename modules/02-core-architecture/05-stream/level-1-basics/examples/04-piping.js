/**
 * 04-piping.js
 * =============
 * Demonstrates stream piping - connecting readable to writable streams
 *
 * Key Concepts:
 * - Using pipe() to connect streams
 * - Automatic data flow management
 * - Comparing manual vs. pipe approach
 * - Automatic backpressure handling
 * - Error handling with pipes
 *
 * Run: node 04-piping.js
 */

const fs = require('fs');
const path = require('path');

console.log('=== Stream Piping Example ===\n');

// Create a sample file to copy
const sourcePath = path.join(__dirname, 'source.txt');
const sampleData = 'This is line ${i} of sample data for piping demonstration.\n';
let fileContent = '';
for (let i = 1; i <= 1000; i++) {
  fileContent += `This is line ${i} of sample data for piping demonstration.\n`;
}
fs.writeFileSync(sourcePath, fileContent);

console.log(`✓ Created source file: ${sourcePath}`);
console.log(`✓ File size: ${fs.statSync(sourcePath).size} bytes\n`);

// =============================================================================
// METHOD 1: Manual Copying (WITHOUT pipe) - The Hard Way
// =============================================================================

console.log('--- Method 1: Manual Copy (WITHOUT pipe) ---\n');

const dest1Path = path.join(__dirname, 'destination-manual.txt');

function manualCopy() {
  return new Promise((resolve, reject) => {
    const readable = fs.createReadStream(sourcePath);
    const writable = fs.createWriteStream(dest1Path);

    let bytesRead = 0;
    const startTime = Date.now();

    console.log('Manually reading and writing chunks...\n');

    // Manually handle the 'data' event
    readable.on('data', (chunk) => {
      bytesRead += chunk.length;

      // Write the chunk to the writable stream
      // In a real scenario, you'd need to handle backpressure here!
      const canContinue = writable.write(chunk);

      if (!canContinue) {
        console.log('⚠️  Buffer full! Should pause reading (backpressure)');
        // We're not handling this properly - that's the problem!
      }
    });

    // Handle the 'end' event
    readable.on('end', () => {
      console.log(`✓ Reading complete: ${bytesRead} bytes`);

      // Close the writable stream
      writable.end();
    });

    // Handle the 'finish' event
    writable.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`✓ Writing complete: ${duration}ms`);
      console.log(`✓ Destination: ${dest1Path}\n`);
      resolve();
    });

    // Error handling
    readable.on('error', reject);
    writable.on('error', reject);
  });
}

// =============================================================================
// METHOD 2: Using pipe() - The Easy Way
// =============================================================================

function copyWithPipe() {
  console.log('--- Method 2: Copy with pipe() (RECOMMENDED) ---\n');

  const dest2Path = path.join(__dirname, 'destination-pipe.txt');

  return new Promise((resolve, reject) => {
    const readable = fs.createReadStream(sourcePath);
    const writable = fs.createWriteStream(dest2Path);

    const startTime = Date.now();

    console.log('Piping readable to writable...\n');

    // The magic happens here: pipe() handles everything!
    // - Automatically reads chunks
    // - Automatically writes chunks
    // - Automatically handles backpressure
    // - Automatically closes writable when done
    readable.pipe(writable);

    // We only need to handle completion and errors
    writable.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`✓ Piping complete: ${duration}ms`);
      console.log(`✓ Destination: ${dest2Path}\n`);
      resolve();
    });

    // Error handling is still important
    readable.on('error', (error) => {
      console.error('❌ Read error:', error.message);
      reject(error);
    });

    writable.on('error', (error) => {
      console.error('❌ Write error:', error.message);
      reject(error);
    });
  });
}

// =============================================================================
// METHOD 3: Pipe with Progress Tracking
// =============================================================================

function copyWithProgress() {
  console.log('--- Method 3: Pipe with Progress Tracking ---\n');

  const dest3Path = path.join(__dirname, 'destination-progress.txt');
  const totalSize = fs.statSync(sourcePath).size;
  let bytesRead = 0;

  return new Promise((resolve, reject) => {
    const readable = fs.createReadStream(sourcePath);
    const writable = fs.createWriteStream(dest3Path);

    const startTime = Date.now();

    // Track progress while still using pipe
    readable.on('data', (chunk) => {
      bytesRead += chunk.length;
      const progress = ((bytesRead / totalSize) * 100).toFixed(1);
      process.stdout.write(`\r  Progress: ${progress}% (${bytesRead}/${totalSize} bytes)`);
    });

    // Use pipe for automatic flow management
    readable.pipe(writable);

    writable.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log('\n✓ Copy complete with progress tracking');
      console.log(`✓ Time: ${duration}ms`);
      console.log(`✓ Destination: ${dest3Path}\n`);
      resolve();
    });

    readable.on('error', reject);
    writable.on('error', reject);
  });
}

// =============================================================================
// METHOD 4: Demonstrating Backpressure Handling
// =============================================================================

function demonstrateBackpressure() {
  console.log('--- Method 4: Backpressure Handling ---\n');

  const dest4Path = path.join(__dirname, 'destination-backpressure.txt');

  return new Promise((resolve, reject) => {
    const readable = fs.createReadStream(sourcePath, {
      highWaterMark: 16 * 1024 // 16KB chunks
    });

    const writable = fs.createWriteStream(dest4Path, {
      highWaterMark: 1024 // Small buffer (1KB) to trigger backpressure
    });

    let pauseCount = 0;
    let drainCount = 0;

    console.log('Using small buffer to demonstrate backpressure...\n');

    // Monitor when the stream pauses
    readable.on('pause', () => {
      pauseCount++;
      console.log(`  ⏸️  Stream paused (backpressure) - Count: ${pauseCount}`);
    });

    // Monitor when the stream resumes
    readable.on('resume', () => {
      console.log(`  ▶️  Stream resumed`);
    });

    // Monitor when the buffer drains
    writable.on('drain', () => {
      drainCount++;
      console.log(`  💧 Buffer drained - Count: ${drainCount}`);
    });

    // pipe() automatically handles pause/resume based on backpressure!
    readable.pipe(writable);

    writable.on('finish', () => {
      console.log(`\n✓ Copy complete with backpressure handling`);
      console.log(`✓ Stream was paused ${pauseCount} times`);
      console.log(`✓ Buffer drained ${drainCount} times`);
      console.log('✓ pipe() handled all of this automatically!\n');
      resolve();
    });

    readable.on('error', reject);
    writable.on('error', reject);
  });
}

// =============================================================================
// Run All Examples
// =============================================================================

async function runExamples() {
  try {
    await manualCopy();
    await copyWithPipe();
    await copyWithProgress();
    await demonstrateBackpressure();

    // Verify all copies are identical
    console.log('--- Verification ---\n');

    const original = fs.readFileSync(sourcePath);
    const manual = fs.readFileSync(path.join(__dirname, 'destination-manual.txt'));
    const piped = fs.readFileSync(path.join(__dirname, 'destination-pipe.txt'));
    const progress = fs.readFileSync(path.join(__dirname, 'destination-progress.txt'));
    const backpressure = fs.readFileSync(path.join(__dirname, 'destination-backpressure.txt'));

    console.log(`✓ Original size: ${original.length} bytes`);
    console.log(`✓ Manual copy: ${manual.length} bytes - ${Buffer.compare(original, manual) === 0 ? 'MATCH' : 'DIFFER'}`);
    console.log(`✓ Piped copy: ${piped.length} bytes - ${Buffer.compare(original, piped) === 0 ? 'MATCH' : 'DIFFER'}`);
    console.log(`✓ Progress copy: ${progress.length} bytes - ${Buffer.compare(original, progress) === 0 ? 'MATCH' : 'DIFFER'}`);
    console.log(`✓ Backpressure copy: ${backpressure.length} bytes - ${Buffer.compare(original, backpressure) === 0 ? 'MATCH' : 'DIFFER'}\n`);

    printKeyTakeaways();
    cleanup();

  } catch (error) {
    console.error('❌ Error:', error.message);
    cleanup();
  }
}

// =============================================================================
// Key Takeaways
// =============================================================================

function printKeyTakeaways() {
  console.log('=== Key Takeaways ===');
  console.log('• pipe() is the recommended way to connect streams');
  console.log('• pipe() automatically handles backpressure');
  console.log('• pipe() automatically manages flow control');
  console.log('• pipe() automatically closes the destination');
  console.log('• Manual copying requires careful backpressure handling');
  console.log('• Always add error handlers, even with pipe()');
  console.log('• You can monitor events while using pipe()');
  console.log('• Syntax: readable.pipe(writable)\n');
}

// =============================================================================
// Cleanup
// =============================================================================

function cleanup() {
  console.log('Cleaning up files...');

  const filesToDelete = [
    sourcePath,
    path.join(__dirname, 'destination-manual.txt'),
    path.join(__dirname, 'destination-pipe.txt'),
    path.join(__dirname, 'destination-progress.txt'),
    path.join(__dirname, 'destination-backpressure.txt')
  ];

  filesToDelete.forEach(file => {
    try {
      fs.unlinkSync(file);
    } catch (error) {
      // File might not exist
    }
  });

  console.log('✓ Cleanup complete');
}

// Start the examples
runExamples();

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * PIPE() METHOD SIGNATURE:
 *
 * readable.pipe(destination, [options])
 *
 * Parameters:
 * - destination: The writable stream to pipe to
 * - options: { end: boolean } - If false, destination won't be closed
 *            when source ends (default: true)
 *
 * Returns: The destination stream (allows chaining)
 *
 * WHAT PIPE() DOES:
 * 1. Listens to 'data' events on the readable
 * 2. Writes data to the writable
 * 3. Pauses the readable if writable buffer is full
 * 4. Resumes the readable when writable emits 'drain'
 * 5. Closes the writable when readable ends (unless end: false)
 * 6. Handles errors (but you should still add handlers!)
 *
 * BACKPRESSURE:
 * When the writable stream's buffer is full, pipe() will:
 * - Pause the readable stream
 * - Wait for the 'drain' event
 * - Resume the readable stream
 * This prevents memory overflow!
 */
