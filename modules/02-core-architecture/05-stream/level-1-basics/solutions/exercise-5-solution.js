/**
 * Exercise 5 Solution: Data Pipeline
 *
 * This solution demonstrates:
 * - Creating custom Transform streams
 * - Building multi-stage stream pipelines
 * - Working with compression (gzip)
 * - Chaining multiple stream operations
 * - Performance measurement in complex pipelines
 * - Decompression and verification
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { Transform, pipeline } = require('stream');
const readline = require('readline');

// File paths
const CSV_FILE = path.join(__dirname, 'data.csv');
const OUTPUT_FILE = path.join(__dirname, 'data-uppercase.csv.gz');
const VERIFY_FILE = path.join(__dirname, 'data-decompressed.csv');

/**
 * Create a sample CSV file with realistic data
 * Generates at least 1000 rows for meaningful testing
 */
function createSampleCSV() {
  console.log('Creating sample CSV file...');

  const header = 'id,name,email,city,country,age,occupation\n';

  // Sample data arrays for variety
  const firstNames = ['john', 'jane', 'michael', 'sarah', 'david', 'emily', 'robert', 'lisa', 'james', 'maria'];
  const lastNames = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis', 'rodriguez', 'martinez'];
  const cities = ['new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas', 'austin'];
  const countries = ['usa', 'canada', 'uk', 'australia', 'germany', 'france', 'spain', 'italy', 'japan', 'brazil'];
  const occupations = ['engineer', 'teacher', 'doctor', 'designer', 'developer', 'manager', 'analyst', 'consultant', 'scientist', 'artist'];

  // Generate rows
  const rows = [];
  for (let i = 1; i <= 1000; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 7) % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName}.${lastName}${i}@example.com`;
    const city = cities[i % cities.length];
    const country = countries[i % countries.length];
    const age = 20 + (i % 50);
    const occupation = occupations[i % occupations.length];

    rows.push(`${i},${name},${email},${city},${country},${age},${occupation}`);
  }

  const content = header + rows.join('\n') + '\n';

  // Write to file
  fs.writeFileSync(CSV_FILE, content, 'utf8');

  const stats = fs.statSync(CSV_FILE);
  console.log(`Sample CSV file created: ${CSV_FILE}`);
  console.log(`File size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);
  console.log(`Rows: ${rows.length + 1} (including header)\n`);

  return stats.size;
}

/**
 * Custom Transform stream to convert text to uppercase
 * This demonstrates how to create a reusable transformation
 */
class UppercaseTransform extends Transform {
  constructor(options) {
    super(options);
    this.bytesTransformed = 0;
  }

  /**
   * The _transform method is called for each chunk
   * @param {Buffer} chunk - The data chunk
   * @param {string} encoding - The encoding type
   * @param {Function} callback - Call when processing is complete
   */
  _transform(chunk, encoding, callback) {
    try {
      // Convert buffer to string
      const text = chunk.toString();

      // Transform to uppercase
      const uppercased = text.toUpperCase();

      // Track bytes
      this.bytesTransformed += chunk.length;

      // Push the transformed data to the next stream
      this.push(uppercased);

      // Signal that we're done with this chunk
      callback();

    } catch (error) {
      // Pass errors to the callback
      callback(error);
    }
  }

  /**
   * Optional: _flush is called when there's no more data
   * Useful for final cleanup or emitting remaining data
   */
  _flush(callback) {
    console.log(`  Uppercase transform completed: ${this.bytesTransformed} bytes processed`);
    callback();
  }
}

/**
 * Build and execute the data pipeline
 * Demonstrates chaining multiple transformations
 *
 * @returns {Promise<object>} Statistics object
 */
function processDataPipeline() {
  return new Promise((resolve, reject) => {
    console.log('Starting data pipeline...\n');

    const startTime = Date.now();

    // Get original file size
    const originalSize = fs.statSync(CSV_FILE).size;

    // Create all the streams
    const readStream = fs.createReadStream(CSV_FILE);
    const uppercaseTransform = new UppercaseTransform();
    const gzipStream = zlib.createGzip({ level: 9 }); // Maximum compression
    const writeStream = fs.createWriteStream(OUTPUT_FILE);

    // Track progress
    let bytesRead = 0;
    let lastProgress = 0;

    readStream.on('data', (chunk) => {
      bytesRead += chunk.length;
      const progress = Math.floor((bytesRead / originalSize) * 100);

      if (progress >= lastProgress + 20) {
        console.log(`  Progress: ${progress}%`);
        lastProgress = progress;
      }
    });

    // Use pipeline() to connect all streams
    // This is the recommended way as it handles errors and cleanup
    pipeline(
      readStream,
      uppercaseTransform,
      gzipStream,
      writeStream,
      (error) => {
        if (error) {
          console.error('Pipeline error:', error.message);
          reject(error);
        } else {
          const endTime = Date.now();
          const elapsedTime = endTime - startTime;

          // Get compressed file size
          const compressedSize = fs.statSync(OUTPUT_FILE).size;
          const compressionRatio = ((1 - (compressedSize / originalSize)) * 100);

          console.log('  Progress: 100%\n');
          console.log('=== Pipeline Complete ===');
          console.log(`Original size: ${originalSize} bytes (${(originalSize / 1024).toFixed(2)} KB)`);
          console.log(`Compressed size: ${compressedSize} bytes (${(compressedSize / 1024).toFixed(2)} KB)`);
          console.log(`Compression ratio: ${compressionRatio.toFixed(1)}%`);
          console.log(`Processing time: ${elapsedTime}ms`);
          console.log(`Throughput: ${((originalSize / 1024) / (elapsedTime / 1000)).toFixed(2)} KB/s\n`);

          resolve({
            originalSize,
            compressedSize,
            compressionRatio,
            time: elapsedTime
          });
        }
      }
    );
  });
}

/**
 * Verify the output by decompressing and checking a few lines
 * This demonstrates reading from a compressed stream
 */
function verifyOutput() {
  return new Promise((resolve, reject) => {
    console.log('=== Verifying Output ===\n');

    // Create a pipeline to decompress
    const readStream = fs.createReadStream(OUTPUT_FILE);
    const gunzipStream = zlib.createGunzip();
    const writeStream = fs.createWriteStream(VERIFY_FILE);

    pipeline(
      readStream,
      gunzipStream,
      writeStream,
      async (error) => {
        if (error) {
          console.error('Decompression error:', error.message);
          reject(error);
        } else {
          console.log('File decompressed successfully\n');

          // Read and display first few lines
          await displaySampleLines();

          // Verify transformation
          await verifyTransformation();

          resolve();
        }
      }
    );
  });
}

/**
 * Display sample lines from the processed file
 */
async function displaySampleLines() {
  console.log('Sample lines from processed file:\n');

  const stream = fs.createReadStream(VERIFY_FILE);
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  const maxLines = 5;

  for await (const line of rl) {
    if (lineCount < maxLines) {
      console.log(`  ${line}`);
      lineCount++;
    } else {
      break;
    }
  }

  console.log('\n... (showing first 5 lines)\n');
}

/**
 * Verify that transformation was applied correctly
 */
async function verifyTransformation() {
  console.log('Verification checks:');

  try {
    // Read a sample from original
    const original = fs.readFileSync(CSV_FILE, 'utf8').split('\n')[1];

    // Read corresponding line from processed
    const processed = fs.readFileSync(VERIFY_FILE, 'utf8').split('\n')[1];

    // Check if processed is uppercase version of original
    const isCorrect = processed === original.toUpperCase();

    console.log(`  Uppercase transformation: ${isCorrect ? '✓ Correct' : '✗ Failed'}`);
    console.log(`  Original:  ${original.substring(0, 50)}...`);
    console.log(`  Processed: ${processed.substring(0, 50)}...`);

  } catch (error) {
    console.error('Verification error:', error.message);
  }

  console.log();
}

/**
 * Alternative: Create a custom transform that counts lines
 * This shows a more complex transformation use case
 */
class LineCounterTransform extends Transform {
  constructor(options) {
    super(options);
    this.lineCount = 0;
  }

  _transform(chunk, encoding, callback) {
    const text = chunk.toString();

    // Count newlines
    const newlines = (text.match(/\n/g) || []).length;
    this.lineCount += newlines;

    // Pass through the data unchanged
    this.push(chunk);

    callback();
  }

  _flush(callback) {
    console.log(`  Total lines processed: ${this.lineCount}`);
    callback();
  }
}

/**
 * Demonstrate a more complex pipeline with multiple transforms
 */
function complexPipeline() {
  return new Promise((resolve, reject) => {
    console.log('=== Complex Pipeline Demo ===\n');

    const outputFile = path.join(__dirname, 'data-complex.csv.gz');

    const readStream = fs.createReadStream(CSV_FILE);
    const lineCounter = new LineCounterTransform();
    const uppercaseTransform = new UppercaseTransform();
    const gzipStream = zlib.createGzip();
    const writeStream = fs.createWriteStream(outputFile);

    pipeline(
      readStream,
      lineCounter,      // First: count lines
      uppercaseTransform, // Second: transform to uppercase
      gzipStream,        // Third: compress
      writeStream,       // Finally: write to file
      (error) => {
        if (error) {
          reject(error);
        } else {
          console.log('Complex pipeline completed\n');
          resolve();
        }
      }
    );
  });
}

/**
 * Clean up created files
 */
function cleanup() {
  console.log('=== Cleanup ===\n');

  const files = [CSV_FILE, OUTPUT_FILE, VERIFY_FILE];

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

  console.log();
}

/**
 * Main function
 */
async function main() {
  console.log('=== Data Pipeline Solution ===\n');

  try {
    // Step 1: Create sample CSV
    createSampleCSV();

    // Step 2: Process through pipeline
    const stats = await processDataPipeline();

    // Step 3: Verify the output
    await verifyOutput();

    // Step 4: Demonstrate complex pipeline
    await complexPipeline();

    // Step 5: Display summary
    console.log('=== Summary ===\n');
    console.log('This exercise demonstrated:');
    console.log('  ✓ Creating custom Transform streams');
    console.log('  ✓ Building multi-stage pipelines');
    console.log('  ✓ Data compression with gzip');
    console.log('  ✓ Data decompression and verification');
    console.log('  ✓ Performance measurement');
    console.log('  ✓ Chaining multiple transformations');
    console.log();

    // Optional: Clean up files
    // cleanup();

  } catch (error) {
    console.error('Error in main:', error.message);
    console.error(error.stack);
  }
}

// Run the program
main();

/**
 * KEY LEARNING POINTS:
 *
 * 1. Transform Streams:
 *    - Extend Transform class from 'stream' module
 *    - Implement _transform(chunk, encoding, callback)
 *    - Optional: Implement _flush(callback) for final operations
 *    - Use push() to pass data to next stream
 *    - Call callback() when done processing chunk
 *
 * 2. pipeline() Function:
 *    - Connects multiple streams in sequence
 *    - Handles errors from any stream
 *    - Automatically cleans up resources
 *    - Preferred over manual pipe() chaining
 *    - Syntax: pipeline(stream1, stream2, ..., callback)
 *
 * 3. Compression (zlib):
 *    - createGzip(): Create compression stream
 *    - createGunzip(): Create decompression stream
 *    - Level option: 0 (none) to 9 (max compression)
 *    - Works seamlessly with other streams
 *
 * 4. Multi-Stage Pipelines:
 *    - Can chain any number of transforms
 *    - Each transform processes data independently
 *    - Data flows through pipeline automatically
 *    - Backpressure is handled automatically
 *
 * 5. Real-World Applications:
 *    - Data ETL (Extract, Transform, Load)
 *    - File processing and conversion
 *    - Log processing and analysis
 *    - Data compression and archiving
 *    - API response transformation
 *
 * 6. Best Practices:
 *    - Use pipeline() for better error handling
 *    - Keep transforms focused and reusable
 *    - Handle errors in callback
 *    - Clean up resources properly
 *    - Measure and log performance
 *    - Verify transformations with tests
 */
