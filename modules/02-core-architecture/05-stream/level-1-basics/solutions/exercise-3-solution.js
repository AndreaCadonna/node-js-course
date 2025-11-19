/**
 * Exercise 3 Solution: Copy Files with Streams
 *
 * This solution demonstrates:
 * - Using pipe() to connect streams
 * - Monitoring progress during streaming
 * - Performance measurement and comparison
 * - Error handling in pipelines
 * - Memory efficiency of streams
 */

const fs = require('fs');
const path = require('path');

// File paths
const SOURCE_FILE = path.join(__dirname, 'source-large.txt');
const DEST_FILE_STREAM = path.join(__dirname, 'dest-stream.txt');
const DEST_FILE_COPY = path.join(__dirname, 'dest-copy.txt');

/**
 * Create a large test file (approximately 5MB)
 * This size is large enough to see performance differences
 */
function createLargeFile() {
  console.log('Creating large test file...');

  // Create a line of text
  const line = 'The quick brown fox jumps over the lazy dog. '.repeat(10) + '\n';

  // Repeat to create ~5MB file
  // Each line is ~460 bytes, so we need ~11,000 lines
  const content = line.repeat(11000);

  // Write synchronously for simplicity
  fs.writeFileSync(SOURCE_FILE, content, 'utf8');

  const stats = fs.statSync(SOURCE_FILE);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log(`Test file created: ${SOURCE_FILE}`);
  console.log(`File size: ${stats.size} bytes (${sizeMB} MB)\n`);

  return stats.size;
}

/**
 * Copy file using streams with progress monitoring
 *
 * @returns {Promise<object>} Statistics object
 */
function copyWithStreams() {
  return new Promise((resolve, reject) => {
    console.log('Copying with streams...');

    let bytesWritten = 0;
    let lastProgress = 0;
    const startTime = Date.now();

    // Get source file size for progress calculation
    const sourceStats = fs.statSync(SOURCE_FILE);
    const totalBytes = sourceStats.size;

    // Create readable stream
    const readStream = fs.createReadStream(SOURCE_FILE);

    // Create writable stream
    const writeStream = fs.createWriteStream(DEST_FILE_STREAM);

    // Monitor progress by listening to 'data' event
    readStream.on('data', (chunk) => {
      bytesWritten += chunk.length;

      // Calculate progress percentage
      const progress = Math.floor((bytesWritten / totalBytes) * 100);

      // Display progress every 10%
      if (progress >= lastProgress + 10) {
        console.log(`  Progress: ${progress}% (${(bytesWritten / 1024 / 1024).toFixed(2)} MB)`);
        lastProgress = progress;
      }
    });

    // Use pipe() to connect the streams
    // This automatically handles backpressure
    readStream.pipe(writeStream);

    // Handle successful completion
    writeStream.on('finish', () => {
      const endTime = Date.now();
      const elapsedTime = endTime - startTime;
      const speedMBps = (bytesWritten / 1024 / 1024) / (elapsedTime / 1000);

      console.log('  Progress: 100%');
      console.log(`\nStream copy completed!`);
      console.log(`  Bytes copied: ${bytesWritten}`);
      console.log(`  Time taken: ${elapsedTime}ms`);
      console.log(`  Speed: ${speedMBps.toFixed(2)} MB/s`);

      resolve({
        method: 'Stream',
        bytes: bytesWritten,
        time: elapsedTime,
        speed: speedMBps
      });
    });

    // Handle errors on both streams
    readStream.on('error', (error) => {
      console.error('Read error:', error.message);
      reject(error);
    });

    writeStream.on('error', (error) => {
      console.error('Write error:', error.message);
      reject(error);
    });
  });
}

/**
 * Copy file using fs.copyFile for comparison
 *
 * @returns {Promise<object>} Statistics object
 */
async function copyWithCopyFile() {
  console.log('\nCopying with fs.copyFile...');

  const startTime = Date.now();

  try {
    // Use the promise-based API
    await fs.promises.copyFile(SOURCE_FILE, DEST_FILE_COPY);

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    // Get file size
    const stats = await fs.promises.stat(DEST_FILE_COPY);
    const speedMBps = (stats.size / 1024 / 1024) / (elapsedTime / 1000);

    console.log(`fs.copyFile completed!`);
    console.log(`  Bytes copied: ${stats.size}`);
    console.log(`  Time taken: ${elapsedTime}ms`);
    console.log(`  Speed: ${speedMBps.toFixed(2)} MB/s`);

    return {
      method: 'fs.copyFile',
      bytes: stats.size,
      time: elapsedTime,
      speed: speedMBps
    };
  } catch (error) {
    console.error('Copy error:', error.message);
    throw error;
  }
}

/**
 * Alternative implementation using pipeline (more modern approach)
 * Available in Node.js 10+
 */
function copyWithPipeline() {
  return new Promise((resolve, reject) => {
    console.log('\nCopying with pipeline...');

    const startTime = Date.now();
    const destFile = path.join(__dirname, 'dest-pipeline.txt');

    const readStream = fs.createReadStream(SOURCE_FILE);
    const writeStream = fs.createWriteStream(destFile);

    // pipeline() is the recommended way to pipe streams
    // It properly handles errors and cleanup
    const { pipeline } = require('stream');

    pipeline(
      readStream,
      writeStream,
      (error) => {
        if (error) {
          console.error('Pipeline error:', error.message);
          reject(error);
        } else {
          const endTime = Date.now();
          const elapsedTime = endTime - startTime;

          console.log(`Pipeline copy completed!`);
          console.log(`  Time taken: ${elapsedTime}ms`);

          resolve({
            method: 'Pipeline',
            time: elapsedTime
          });
        }
      }
    );
  });
}

/**
 * Compare both methods and display results
 */
async function comparePerformance() {
  console.log('=== File Copy Performance Comparison ===\n');

  try {
    // Create the test file
    const fileSize = createLargeFile();

    // Method 1: Stream with pipe
    const streamStats = await copyWithStreams();

    // Method 2: fs.copyFile
    const copyStats = await copyWithCopyFile();

    // Method 3: pipeline (bonus)
    const pipelineStats = await copyWithPipeline();

    // Display comparison
    console.log('\n=== Performance Comparison ===\n');
    console.log('Method          | Time (ms) | Speed (MB/s)');
    console.log('----------------|-----------|-------------');
    console.log(`Stream + pipe   | ${streamStats.time.toString().padEnd(9)} | ${streamStats.speed.toFixed(2)}`);
    console.log(`fs.copyFile     | ${copyStats.time.toString().padEnd(9)} | ${copyStats.speed.toFixed(2)}`);
    console.log(`pipeline()      | ${pipelineStats.time.toString().padEnd(9)} | N/A`);

    console.log('\n=== Analysis ===\n');

    // Determine winner
    const fastest = streamStats.time < copyStats.time ? 'Stream' : 'fs.copyFile';
    const difference = Math.abs(streamStats.time - copyStats.time);
    const percentDiff = ((difference / Math.max(streamStats.time, copyStats.time)) * 100).toFixed(1);

    console.log(`Fastest method: ${fastest}`);
    console.log(`Time difference: ${difference}ms (${percentDiff}%)`);

    console.log('\nKey Insights:');
    console.log('- fs.copyFile may be faster for small files (optimized at OS level)');
    console.log('- Streams are more memory-efficient for large files');
    console.log('- Streams allow progress monitoring and transformation');
    console.log('- pipeline() is the recommended modern approach');

    // Verify files are identical
    verifyFiles();

    // Clean up
    cleanupFiles();

  } catch (error) {
    console.error('Error during comparison:', error.message);
  }
}

/**
 * Verify that all copied files are identical to source
 */
function verifyFiles() {
  console.log('\n=== Verifying File Integrity ===\n');

  const sourceContent = fs.readFileSync(SOURCE_FILE);
  const files = [DEST_FILE_STREAM, DEST_FILE_COPY];

  files.forEach(file => {
    const destContent = fs.readFileSync(file);
    const match = Buffer.compare(sourceContent, destContent) === 0;

    const filename = path.basename(file);
    console.log(`${filename}: ${match ? '✓ Match' : '✗ Mismatch'}`);
  });
}

/**
 * Clean up created files
 */
function cleanupFiles() {
  console.log('\n=== Cleanup ===\n');

  const files = [
    SOURCE_FILE,
    DEST_FILE_STREAM,
    DEST_FILE_COPY,
    path.join(__dirname, 'dest-pipeline.txt')
  ];

  files.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`Deleted: ${path.basename(file)}`);
      }
    } catch (error) {
      console.error(`Error deleting ${file}:`, error.message);
    }
  });

  console.log('\nCleanup completed!');
}

/**
 * Main execution
 */
async function main() {
  await comparePerformance();
}

// Run the program
main();

/**
 * KEY LEARNING POINTS:
 *
 * 1. pipe() Method:
 *    - Connects readable stream to writable stream
 *    - Automatically handles backpressure
 *    - Returns the destination stream (for chaining)
 *
 * 2. pipeline() Function (Modern Approach):
 *    - Recommended over pipe() for error handling
 *    - Automatically cleans up resources on error
 *    - Can chain multiple streams
 *    - Provides single error callback
 *
 * 3. Progress Monitoring:
 *    - Listen to 'data' event on readable stream
 *    - Track bytes processed
 *    - Calculate percentage based on file size
 *
 * 4. Performance Considerations:
 *    - Streams: Better for large files, allows monitoring
 *    - fs.copyFile: Optimized at OS level, good for simple copies
 *    - Memory: Streams use constant memory regardless of file size
 *
 * 5. Error Handling:
 *    - Handle errors on both readable and writable streams
 *    - pipeline() provides centralized error handling
 *    - Always clean up resources
 */
