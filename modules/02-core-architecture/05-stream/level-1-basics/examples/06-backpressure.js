/**
 * 06-backpressure.js
 * ===================
 * Demonstrates backpressure in streams and how to handle it
 *
 * Key Concepts:
 * - What backpressure is and why it matters
 * - Manual backpressure handling
 * - The 'drain' event
 * - Why pipe() handles backpressure automatically
 * - Consequences of ignoring backpressure
 *
 * Run: node 06-backpressure.js
 */

const fs = require('fs');
const path = require('path');
const { Writable } = require('stream');

console.log('=== Backpressure Demonstration ===\n');

/**
 * WHAT IS BACKPRESSURE?
 *
 * Backpressure occurs when data is being written to a stream faster than
 * it can be processed or drained. Think of it like a water pipe:
 * - If you pour water in faster than it can drain, the pipe fills up
 * - The pipe has a buffer, but it's limited
 * - If you ignore the full buffer, water (data) overflows (memory issues)
 *
 * In streams, write() returns false when the buffer is full.
 * You should STOP writing and wait for the 'drain' event.
 */

// =============================================================================
// EXAMPLE 1: Demonstrating Backpressure
// =============================================================================

console.log('--- Example 1: Understanding Backpressure ---\n');

// Create a custom writable with a VERY small buffer to trigger backpressure
class SlowWriter extends Writable {
  constructor(options) {
    super(options);
    this.writeCount = 0;
  }

  _write(chunk, encoding, callback) {
    this.writeCount++;
    // Simulate slow processing
    setTimeout(() => {
      console.log(`  ✓ Processed chunk #${this.writeCount} (${chunk.length} bytes)`);
      callback();
    }, 100); // 100ms delay per chunk
  }
}

function example1Understanding() {
  return new Promise((resolve) => {
    const slowWriter = new SlowWriter({
      highWaterMark: 16 // Very small buffer (16 bytes)
    });

    console.log('Created SlowWriter with 16-byte buffer');
    console.log('Writing 5 chunks of 10 bytes each...\n');

    let canContinue;

    // Write 5 chunks
    for (let i = 1; i <= 5; i++) {
      const chunk = `Chunk ${i}!\n`; // ~10 bytes
      canContinue = slowWriter.write(chunk);

      console.log(`Chunk ${i} written - Can continue: ${canContinue}`);

      if (!canContinue) {
        console.log('⚠️  BACKPRESSURE! Buffer is full. Should wait for drain.\n');
      }
    }

    slowWriter.end();

    slowWriter.on('finish', () => {
      console.log('\n✓ All chunks processed\n');
      resolve();
    });
  });
}

// =============================================================================
// EXAMPLE 2: WRONG Way - Ignoring Backpressure
// =============================================================================

function example2IgnoringBackpressure() {
  console.log('--- Example 2: WRONG Way (Ignoring Backpressure) ---\n');

  const outputPath = path.join(__dirname, 'backpressure-ignored.txt');
  const writable = fs.createWriteStream(outputPath, {
    highWaterMark: 1024 // 1KB buffer
  });

  const startMemory = process.memoryUsage().heapUsed;
  let ignoredWarnings = 0;

  console.log('Writing 10,000 chunks while IGNORING backpressure...\n');

  const startTime = Date.now();

  // BAD: Ignoring the return value of write()
  for (let i = 0; i < 10000; i++) {
    const chunk = `Line ${i}: ${'x'.repeat(100)}\n`; // ~110 bytes per line

    const canContinue = writable.write(chunk);

    if (!canContinue) {
      ignoredWarnings++;
      // BAD: We're ignoring the warning and continuing to write!
    }
  }

  writable.end();

  writable.on('finish', () => {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed;
    const memoryUsed = endMemory - startMemory;

    console.log(`✓ Finished in ${duration}ms`);
    console.log(`⚠️  Ignored ${ignoredWarnings} backpressure warnings`);
    console.log(`⚠️  Memory used: ~${Math.round(memoryUsed / 1024 / 1024)}MB`);
    console.log('⚠️  Risk: Memory could grow unbounded with larger data!\n');

    example3CorrectHandling();
  });
}

// =============================================================================
// EXAMPLE 3: CORRECT Way - Manual Backpressure Handling
// =============================================================================

function example3CorrectHandling() {
  console.log('--- Example 3: CORRECT Way (Handling Backpressure) ---\n');

  const outputPath = path.join(__dirname, 'backpressure-handled.txt');
  const writable = fs.createWriteStream(outputPath, {
    highWaterMark: 1024 // 1KB buffer
  });

  const startMemory = process.memoryUsage().heapUsed;
  let currentLine = 0;
  const totalLines = 10000;
  let drainCount = 0;

  console.log('Writing 10,000 chunks while HANDLING backpressure...\n');

  const startTime = Date.now();

  function writeChunk() {
    let canContinue = true;

    // Write as many chunks as we can
    while (currentLine < totalLines && canContinue) {
      currentLine++;
      const chunk = `Line ${currentLine}: ${'x'.repeat(100)}\n`;

      if (currentLine === totalLines) {
        // Last chunk, use end()
        writable.end(chunk);
        canContinue = false;
      } else {
        // Check if we can continue writing
        canContinue = writable.write(chunk);

        if (!canContinue) {
          console.log(`⏸️  Paused at line ${currentLine} (buffer full)`);
          // CORRECT: Stop writing and wait for 'drain' event
        }
      }
    }
  }

  // CORRECT: Listen to 'drain' event and resume writing
  writable.on('drain', () => {
    drainCount++;
    console.log(`💧 Drain event #${drainCount} - Resuming writes`);
    writeChunk(); // Resume writing
  });

  writable.on('finish', () => {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed;
    const memoryUsed = endMemory - startMemory;

    console.log(`\n✓ Finished in ${duration}ms`);
    console.log(`✓ Handled ${drainCount} drain events properly`);
    console.log(`✓ Memory used: ~${Math.round(memoryUsed / 1024 / 1024)}MB`);
    console.log('✓ Memory usage stayed controlled!\n');

    example4UsingPipe();
  });

  // Start writing
  writeChunk();
}

// =============================================================================
// EXAMPLE 4: BEST Way - Using pipe()
// =============================================================================

function example4UsingPipe() {
  console.log('--- Example 4: BEST Way (Using pipe()) ---\n');

  const { Readable } = require('stream');

  // Create a readable stream that generates data
  class DataGenerator extends Readable {
    constructor(options) {
      super(options);
      this.currentLine = 0;
      this.totalLines = 10000;
    }

    _read() {
      if (this.currentLine < this.totalLines) {
        this.currentLine++;
        const chunk = `Line ${this.currentLine}: ${'x'.repeat(100)}\n`;
        this.push(chunk);
      } else {
        // Signal end
        this.push(null);
      }
    }
  }

  const outputPath = path.join(__dirname, 'backpressure-piped.txt');
  const readable = new DataGenerator();
  const writable = fs.createWriteStream(outputPath, {
    highWaterMark: 1024 // 1KB buffer
  });

  const startMemory = process.memoryUsage().heapUsed;
  let pauseCount = 0;
  let resumeCount = 0;

  console.log('Writing 10,000 chunks using pipe()...\n');

  // Monitor backpressure events
  readable.on('pause', () => {
    pauseCount++;
    console.log(`⏸️  Stream paused automatically (backpressure) - Count: ${pauseCount}`);
  });

  readable.on('resume', () => {
    resumeCount++;
    console.log(`▶️  Stream resumed automatically - Count: ${resumeCount}`);
  });

  const startTime = Date.now();

  // BEST: pipe() handles ALL backpressure automatically!
  readable.pipe(writable);

  writable.on('finish', () => {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed;
    const memoryUsed = endMemory - startMemory;

    console.log(`\n✓ Finished in ${duration}ms`);
    console.log(`✓ Stream paused ${pauseCount} times (automatic)`);
    console.log(`✓ Stream resumed ${resumeCount} times (automatic)`);
    console.log(`✓ Memory used: ~${Math.round(memoryUsed / 1024 / 1024)}MB`);
    console.log('✓ pipe() handled ALL backpressure automatically!\n');

    compareResults();
  });
}

// =============================================================================
// Compare Results
// =============================================================================

function compareResults() {
  console.log('--- Comparison ---\n');

  const files = [
    'backpressure-ignored.txt',
    'backpressure-handled.txt',
    'backpressure-piped.txt'
  ];

  files.forEach(filename => {
    const filepath = path.join(__dirname, filename);
    try {
      const size = fs.statSync(filepath).size;
      const lines = fs.readFileSync(filepath, 'utf8').split('\n').length - 1;
      console.log(`${filename}:`);
      console.log(`  Size: ${(size / 1024).toFixed(2)}KB`);
      console.log(`  Lines: ${lines}`);
    } catch (error) {
      console.log(`${filename}: Not found`);
    }
  });

  console.log('');
  printKeyTakeaways();
  cleanup();
}

// =============================================================================
// Key Takeaways
// =============================================================================

function printKeyTakeaways() {
  console.log('=== Key Takeaways ===');
  console.log('• Backpressure occurs when writing faster than draining');
  console.log('• write() returns false when buffer is full');
  console.log('• ALWAYS check the return value of write()');
  console.log('• When write() returns false, STOP and wait for "drain"');
  console.log('• Resume writing when "drain" event fires');
  console.log('• Ignoring backpressure can cause memory issues');
  console.log('• pipe() handles backpressure AUTOMATICALLY (recommended!)');
  console.log('• pipe() pauses the source when destination is full');
  console.log('• pipe() resumes the source when destination drains\n');

  console.log('=== Code Pattern ===');
  console.log('Manual handling:');
  console.log('  if (!writable.write(chunk)) {');
  console.log('    // Stop writing, wait for drain');
  console.log('  }');
  console.log('  writable.on("drain", () => {');
  console.log('    // Resume writing');
  console.log('  });\n');
  console.log('Using pipe (recommended):');
  console.log('  readable.pipe(writable); // Automatic!\n');
}

// =============================================================================
// Cleanup
// =============================================================================

function cleanup() {
  console.log('Cleaning up files...');

  const filesToDelete = [
    'backpressure-ignored.txt',
    'backpressure-handled.txt',
    'backpressure-piped.txt'
  ];

  filesToDelete.forEach(file => {
    try {
      fs.unlinkSync(path.join(__dirname, file));
    } catch (error) {
      // File might not exist
    }
  });

  console.log('✓ Cleanup complete');
}

// =============================================================================
// Run Examples
// =============================================================================

async function runExamples() {
  try {
    await example1Understanding();
    await example2IgnoringBackpressure();
    // example3 and example4 are called from example2's callback
  } catch (error) {
    console.error('Error:', error);
    cleanup();
  }
}

runExamples();

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * BACKPRESSURE MECHANISM:
 *
 * 1. Writable stream has an internal buffer (highWaterMark)
 * 2. When buffer fills up:
 *    - write() returns false
 *    - This is the "backpressure signal"
 * 3. You should STOP writing
 * 4. When buffer drains below highWaterMark:
 *    - 'drain' event fires
 *    - Safe to resume writing
 *
 * WHY IT MATTERS:
 *
 * Without backpressure handling:
 * - Data accumulates in memory
 * - Memory usage grows unbounded
 * - Can cause out-of-memory crashes
 * - Especially critical for large files or streams
 *
 * WITH pipe():
 * - Automatically pauses source when destination is full
 * - Automatically resumes source when destination drains
 * - No manual tracking needed
 * - Memory efficient
 *
 * BEST PRACTICES:
 *
 * 1. Use pipe() when possible (handles backpressure automatically)
 * 2. If manual handling needed:
 *    - Check write() return value
 *    - Stop writing when false
 *    - Wait for 'drain' event
 *    - Resume writing
 * 3. NEVER ignore write() return value
 * 4. Test with large data sets
 */
