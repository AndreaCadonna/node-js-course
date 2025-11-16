/**
 * Example 1: Streams Basics
 *
 * Demonstrates reading and writing large files efficiently with streams.
 *
 * Key Concepts:
 * - fs.createReadStream() for memory-efficient reading
 * - fs.createWriteStream() for writing
 * - Piping streams together
 * - Handling backpressure automatically
 * - Stream events: data, end, error, drain
 */

const fs = require('fs');
const path = require('path');

async function demonstrateStreams() {
  console.log('File Streams Demonstration\n');
  console.log('═'.repeat(50));

  const testDir = path.join(__dirname, 'test-streams');

  // Create test directory
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  try {
    // Example 1: Create a large test file
    console.log('\n1. Creating Large File with WriteStream');
    console.log('─'.repeat(50));

    const largeFile = path.join(testDir, 'large-file.txt');
    const writeStream = fs.createWriteStream(largeFile);

    const startTime = Date.now();
    let bytesWritten = 0;

    // Write 100MB of data
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = 100;

    for (let i = 0; i < totalChunks; i++) {
      const chunk = `Chunk ${i.toString().padStart(3, '0')}: ${'x'.repeat(chunkSize - 20)}\n`;

      // Check if we can continue writing
      const canContinue = writeStream.write(chunk);
      bytesWritten += chunk.length;

      if (!canContinue) {
        // Wait for drain event
        await new Promise(resolve => writeStream.once('drain', resolve));
      }

      // Progress indicator
      if (i % 10 === 0) {
        process.stdout.write(`\r  Progress: ${i}/${totalChunks} chunks`);
      }
    }

    // Close the stream
    writeStream.end();
    await new Promise(resolve => writeStream.once('finish', resolve));

    const duration = Date.now() - startTime;
    console.log(`\n  ✓ Created ${formatBytes(bytesWritten)} in ${duration}ms`);

    // Example 2: Reading with ReadStream
    console.log('\n2. Reading File with ReadStream');
    console.log('─'.repeat(50));

    const readStream = fs.createReadStream(largeFile, {
      highWaterMark: 64 * 1024 // 64KB chunks
    });

    let chunksRead = 0;
    let totalBytesRead = 0;

    readStream.on('data', (chunk) => {
      chunksRead++;
      totalBytesRead += chunk.length;
    });

    readStream.on('end', () => {
      console.log(`  ✓ Read ${chunksRead} chunks`);
      console.log(`  ✓ Total bytes: ${formatBytes(totalBytesRead)}`);
    });

    await new Promise((resolve, reject) => {
      readStream.on('end', resolve);
      readStream.on('error', reject);
    });

    // Example 3: Copying file with pipe()
    console.log('\n3. Copying File with pipe()');
    console.log('─'.repeat(50));

    const sourcePath = largeFile;
    const destPath = path.join(testDir, 'large-file-copy.txt');

    const copyStart = Date.now();

    const source = fs.createReadStream(sourcePath);
    const dest = fs.createWriteStream(destPath);

    // Pipe automatically handles backpressure
    source.pipe(dest);

    await new Promise((resolve, reject) => {
      dest.on('finish', resolve);
      dest.on('error', reject);
      source.on('error', reject);
    });

    const copyDuration = Date.now() - copyStart;
    const destStats = fs.statSync(destPath);

    console.log(`  ✓ Copied ${formatBytes(destStats.size)} in ${copyDuration}ms`);
    console.log(`  ✓ Speed: ${formatBytes(destStats.size / copyDuration * 1000)}/s`);

    // Example 4: Manual backpressure handling
    console.log('\n4. Manual Backpressure Handling');
    console.log('─'.repeat(50));

    const reader = fs.createReadStream(sourcePath);
    const writer = fs.createWriteStream(path.join(testDir, 'manual-copy.txt'));

    let paused = false;

    reader.on('data', (chunk) => {
      const canContinue = writer.write(chunk);

      if (!canContinue && !paused) {
        console.log('  ⚠ Backpressure detected - pausing read stream');
        reader.pause();
        paused = true;
      }
    });

    writer.on('drain', () => {
      if (paused) {
        console.log('  ✓ Drain event - resuming read stream');
        reader.resume();
        paused = false;
      }
    });

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
      reader.on('error', reject);
      reader.on('end', () => writer.end());
    });

    console.log('  ✓ Manual copy complete');

    // Example 5: Stream with progress tracking
    console.log('\n5. Stream with Progress Tracking');
    console.log('─'.repeat(50));

    const fileSize = fs.statSync(sourcePath).size;
    let processedBytes = 0;

    const progressReader = fs.createReadStream(sourcePath);

    progressReader.on('data', (chunk) => {
      processedBytes += chunk.length;
      const progress = ((processedBytes / fileSize) * 100).toFixed(1);
      process.stdout.write(`\r  Progress: ${progress}% (${formatBytes(processedBytes)}/${formatBytes(fileSize)})`);
    });

    progressReader.on('end', () => {
      console.log('\n  ✓ Reading complete');
    });

    await new Promise(resolve => progressReader.on('end', resolve));

    // Example 6: Reading specific ranges
    console.log('\n6. Reading Specific File Ranges');
    console.log('─'.repeat(50));

    // Read first 1MB
    const rangeStream1 = fs.createReadStream(sourcePath, {
      start: 0,
      end: 1024 * 1024 - 1
    });

    let range1Bytes = 0;
    rangeStream1.on('data', chunk => range1Bytes += chunk.length);
    await new Promise(resolve => rangeStream1.on('end', resolve));

    console.log(`  First 1MB: ${formatBytes(range1Bytes)}`);

    // Read middle 1MB
    const rangeStream2 = fs.createReadStream(sourcePath, {
      start: 50 * 1024 * 1024,
      end: 51 * 1024 * 1024 - 1
    });

    let range2Bytes = 0;
    rangeStream2.on('data', chunk => range2Bytes += chunk.length);
    await new Promise(resolve => rangeStream2.on('end', resolve));

    console.log(`  Middle 1MB: ${formatBytes(range2Bytes)}`);

    // Example 7: Stream error handling
    console.log('\n7. Stream Error Handling');
    console.log('─'.repeat(50));

    const nonExistentFile = path.join(testDir, 'does-not-exist.txt');
    const errorStream = fs.createReadStream(nonExistentFile);

    errorStream.on('error', (err) => {
      console.log(`  ✓ Caught error: ${err.code} - ${err.message}`);
    });

    // Wait for error
    await new Promise(resolve => {
      errorStream.on('error', resolve);
      errorStream.on('end', resolve);
    });

    // Example 8: Multiple stream pipeline
    console.log('\n8. Stream Pipeline');
    console.log('─'.repeat(50));

    const { pipeline } = require('stream');
    const { Transform } = require('stream');

    // Create a transform stream that counts lines
    class LineCounter extends Transform {
      constructor() {
        super();
        this.lineCount = 0;
      }

      _transform(chunk, encoding, callback) {
        const lines = chunk.toString().split('\n').length - 1;
        this.lineCount += lines;
        this.push(chunk);
        callback();
      }
    }

    const lineCounter = new LineCounter();

    const pipelineSource = fs.createReadStream(sourcePath);
    const pipelineDest = fs.createWriteStream(path.join(testDir, 'pipeline-copy.txt'));

    await new Promise((resolve, reject) => {
      pipeline(
        pipelineSource,
        lineCounter,
        pipelineDest,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log(`  ✓ Lines counted: ${lineCounter.lineCount.toLocaleString()}`);
    console.log(`  ✓ Pipeline complete`);

    // Cleanup
    console.log('\n9. Cleanup');
    console.log('─'.repeat(50));

    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('✓ Cleanup complete');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

demonstrateStreams();

/**
 * When to Use Streams:
 *
 * ✓ Use streams when:
 * - File size > 100MB
 * - Processing data as it arrives
 * - Memory is limited
 * - Need to transform data
 * - Copying large files
 *
 * ✗ Don't use streams when:
 * - File is small (<1MB)
 * - Need entire file in memory
 * - Random access required
 * - Simpler code is more important
 */

/**
 * Stream Events:
 *
 * ReadStream:
 * - 'data': Chunk of data available
 * - 'end': No more data
 * - 'error': Error occurred
 * - 'close': Stream closed
 * - 'readable': Data ready to read
 *
 * WriteStream:
 * - 'drain': Ready for more data after backpressure
 * - 'finish': All data written
 * - 'error': Error occurred
 * - 'close': Stream closed
 * - 'pipe': Source piped to this stream
 */

/**
 * Performance Comparison:
 *
 * Reading 100MB file:
 *
 * fs.readFile():
 * - Memory: 100MB+ (entire file in memory)
 * - Time: ~200ms
 * - Use case: Small files, need all data
 *
 * fs.createReadStream():
 * - Memory: 64KB (default highWaterMark)
 * - Time: ~250ms (slightly slower, much less memory)
 * - Use case: Large files, processing chunks
 */

/**
 * Backpressure Explained:
 *
 * When reading faster than writing:
 * 1. Write buffer fills up
 * 2. write() returns false
 * 3. Should pause reading
 * 4. Wait for 'drain' event
 * 5. Resume reading
 *
 * pipe() handles this automatically!
 */
