/**
 * 03-stream-events.js
 * ====================
 * Comprehensive demonstration of all major stream events
 *
 * Key Concepts:
 * - Readable stream events (data, end, close, error)
 * - Writable stream events (finish, drain, pipe, error)
 * - Event sequence and timing
 * - Understanding the stream lifecycle
 *
 * Run: node 03-stream-events.js
 */

const fs = require('fs');
const path = require('path');
const { Readable, Writable } = require('stream');

console.log('=== Stream Events Demonstration ===\n');

// =============================================================================
// PART 1: Readable Stream Events
// =============================================================================

console.log('--- Part 1: Readable Stream Events ---\n');

// Create a sample file
const inputPath = path.join(__dirname, 'events-input.txt');
fs.writeFileSync(inputPath, 'Sample data for event demonstration\n'.repeat(10));

const readableStream = fs.createReadStream(inputPath, {
  highWaterMark: 64 // Small chunk size to see multiple 'data' events
});

console.log('Readable stream created. Listening for events...\n');

// 'open' event: Fires when the file descriptor is opened (fs streams only)
readableStream.on('open', (fd) => {
  console.log(`[READABLE] 'open' event - File descriptor: ${fd}`);
});

// 'ready' event: Fires when the stream is ready to be read from
readableStream.on('ready', () => {
  console.log(`[READABLE] 'ready' event - Stream is ready`);
});

// 'data' event: Fires when a chunk of data is available
// Adding this listener puts the stream in "flowing mode"
let chunkCount = 0;
readableStream.on('data', (chunk) => {
  chunkCount++;
  console.log(`[READABLE] 'data' event - Chunk #${chunkCount}, Size: ${chunk.length} bytes`);
});

// 'end' event: Fires when there's no more data to read
readableStream.on('end', () => {
  console.log(`[READABLE] 'end' event - No more data (received ${chunkCount} chunks)`);
});

// 'close' event: Fires when the stream and its resources are closed
readableStream.on('close', () => {
  console.log(`[READABLE] 'close' event - Stream closed\n`);

  // Continue to Part 2
  setTimeout(demonstrateWritableEvents, 100);
});

// 'error' event: Fires when an error occurs
readableStream.on('error', (error) => {
  console.error(`[READABLE] 'error' event - ${error.message}`);
});

// 'pause' event: Fires when stream.pause() is called
readableStream.on('pause', () => {
  console.log(`[READABLE] 'pause' event - Stream paused`);
});

// 'resume' event: Fires when stream.resume() is called
readableStream.on('resume', () => {
  console.log(`[READABLE] 'resume' event - Stream resumed`);
});

// =============================================================================
// PART 2: Writable Stream Events
// =============================================================================

function demonstrateWritableEvents() {
  console.log('--- Part 2: Writable Stream Events ---\n');

  const outputPath = path.join(__dirname, 'events-output.txt');
  const writableStream = fs.createWriteStream(outputPath);

  console.log('Writable stream created. Listening for events...\n');

  // 'open' event: Fires when the file descriptor is opened
  writableStream.on('open', (fd) => {
    console.log(`[WRITABLE] 'open' event - File descriptor: ${fd}`);
  });

  // 'ready' event: Fires when the stream is ready to be written to
  writableStream.on('ready', () => {
    console.log(`[WRITABLE] 'ready' event - Stream is ready`);
  });

  // 'drain' event: Fires when buffer is no longer full
  // This is crucial for backpressure handling
  writableStream.on('drain', () => {
    console.log(`[WRITABLE] 'drain' event - Buffer drained, safe to write more`);
  });

  // 'finish' event: Fires when end() is called and all data is flushed
  writableStream.on('finish', () => {
    console.log(`[WRITABLE] 'finish' event - All data written and flushed`);
  });

  // 'close' event: Fires when the stream is closed
  writableStream.on('close', () => {
    console.log(`[WRITABLE] 'close' event - Stream closed\n`);

    // Continue to Part 3
    setTimeout(demonstratePipeEvents, 100);
  });

  // 'error' event: Fires when an error occurs
  writableStream.on('error', (error) => {
    console.error(`[WRITABLE] 'error' event - ${error.message}`);
  });

  // 'pipe' event: Fires when a readable stream is piped to this writable
  writableStream.on('pipe', (src) => {
    console.log(`[WRITABLE] 'pipe' event - Readable stream connected`);
  });

  // 'unpipe' event: Fires when a readable stream is unpiped
  writableStream.on('unpipe', (src) => {
    console.log(`[WRITABLE] 'unpipe' event - Readable stream disconnected`);
  });

  // Write some data
  console.log('Writing data to stream...\n');
  writableStream.write('Line 1\n');
  writableStream.write('Line 2\n');
  writableStream.write('Line 3\n');
  writableStream.end('Final line\n');
}

// =============================================================================
// PART 3: Pipe Events
// =============================================================================

function demonstratePipeEvents() {
  console.log('--- Part 3: Pipe Events (Readable + Writable) ---\n');

  const sourcePath = path.join(__dirname, 'events-input.txt');
  const destPath = path.join(__dirname, 'events-piped.txt');

  const readable = fs.createReadStream(sourcePath);
  const writable = fs.createWriteStream(destPath);

  console.log('Setting up pipe between readable and writable streams...\n');

  // Track events
  let eventLog = [];

  const logEvent = (streamType, eventName) => {
    const timestamp = Date.now();
    eventLog.push({ streamType, eventName, timestamp });
    console.log(`[${streamType}] '${eventName}' event`);
  };

  // Readable events
  readable.on('open', () => logEvent('READABLE', 'open'));
  readable.on('data', () => logEvent('READABLE', 'data'));
  readable.on('end', () => logEvent('READABLE', 'end'));
  readable.on('close', () => logEvent('READABLE', 'close'));

  // Writable events
  writable.on('open', () => logEvent('WRITABLE', 'open'));
  writable.on('pipe', () => logEvent('WRITABLE', 'pipe'));
  writable.on('finish', () => logEvent('WRITABLE', 'finish'));
  writable.on('close', () => {
    logEvent('WRITABLE', 'close');

    // Show event sequence
    setTimeout(showEventSequence, 100);
  });

  function showEventSequence() {
    console.log('\n--- Event Sequence Summary ---\n');

    const firstTimestamp = eventLog[0].timestamp;
    eventLog.forEach((event, index) => {
      const relativeTime = event.timestamp - firstTimestamp;
      console.log(`${index + 1}. [+${relativeTime}ms] ${event.streamType} - ${event.eventName}`);
    });

    console.log('\n--- Event Flow Explanation ---');
    console.log('1. Streams open (file descriptors created)');
    console.log('2. Pipe event fires (readable connected to writable)');
    console.log('3. Data events fire (chunks flowing through)');
    console.log('4. End event fires (readable has no more data)');
    console.log('5. Finish event fires (writable has flushed all data)');
    console.log('6. Close events fire (resources released)\n');

    demonstrateCustomStreamEvents();
  }

  // Start the pipe
  readable.pipe(writable);
}

// =============================================================================
// PART 4: Custom Stream Events
// =============================================================================

function demonstrateCustomStreamEvents() {
  console.log('--- Part 4: Custom Stream with All Events ---\n');

  // Create a custom readable stream that emits various events
  class DemoReadable extends Readable {
    constructor(options) {
      super(options);
      this.dataCount = 0;
      this.maxData = 5;
    }

    _read() {
      if (this.dataCount < this.maxData) {
        this.dataCount++;
        this.push(`Data chunk ${this.dataCount}\n`);
      } else {
        // Signal end of data
        this.push(null);
      }
    }
  }

  const customReadable = new DemoReadable();

  console.log('Custom readable stream created. Event flow:\n');

  customReadable.on('data', (chunk) => {
    console.log(`  → 'data': Received "${chunk.toString().trim()}"`);
  });

  customReadable.on('end', () => {
    console.log(`  → 'end': Stream finished`);
    cleanup();
  });

  customReadable.on('close', () => {
    console.log(`  → 'close': Stream closed`);
  });

  customReadable.on('error', (error) => {
    console.error(`  → 'error': ${error.message}`);
  });
}

// =============================================================================
// Cleanup
// =============================================================================

function cleanup() {
  console.log('\n=== Key Takeaways ===');
  console.log('• Streams emit events throughout their lifecycle');
  console.log('• Event order: open → data/write → end/finish → close');
  console.log('• Always handle "error" events to prevent crashes');
  console.log('• "drain" event is key for backpressure handling');
  console.log('• "pipe" event fires when streams are connected');
  console.log('• Understanding events helps debug stream issues\n');

  // Clean up files
  try {
    fs.unlinkSync(inputPath);
    fs.unlinkSync(path.join(__dirname, 'events-output.txt'));
    fs.unlinkSync(path.join(__dirname, 'events-piped.txt'));
    console.log('✓ Cleanup: Sample files deleted');
  } catch (error) {
    // Files might not exist
  }
}

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * READABLE STREAM EVENTS (in typical order):
 * 1. 'open' - File/resource opened (fs streams)
 * 2. 'ready' - Stream ready to read
 * 3. 'data' - Data chunk available (may fire multiple times)
 * 4. 'end' - No more data to read
 * 5. 'close' - Resources released
 *
 * Also: 'error', 'pause', 'resume'
 *
 * WRITABLE STREAM EVENTS (in typical order):
 * 1. 'open' - File/resource opened (fs streams)
 * 2. 'ready' - Stream ready to write
 * 3. 'pipe' - Readable piped to this writable
 * 4. 'drain' - Buffer no longer full (during backpressure)
 * 5. 'finish' - All data flushed (after end() called)
 * 6. 'close' - Resources released
 *
 * Also: 'error', 'unpipe'
 */
