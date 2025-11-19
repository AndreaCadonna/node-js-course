/**
 * Exercise 5: Data Pipeline
 *
 * OBJECTIVE:
 * Learn to create a multi-stage stream pipeline with transformation and compression.
 *
 * REQUIREMENTS:
 * 1. Create a sample CSV file with data
 * 2. Build a pipeline that:
 *    - Reads the CSV file
 *    - Transforms text to uppercase
 *    - Compresses the data with gzip
 *    - Writes to an output file
 * 3. Measure total processing time
 * 4. Display statistics (original size, compressed size, compression ratio)
 * 5. Handle errors in the pipeline
 *
 * LEARNING GOALS:
 * - Creating transform streams
 * - Chaining multiple streams (pipeline)
 * - Working with compression streams
 * - Building complex data processing workflows
 * - Error handling in multi-stage pipelines
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { Transform, pipeline } = require('stream');

// File paths
const CSV_FILE = path.join(__dirname, 'data.csv');
const OUTPUT_FILE = path.join(__dirname, 'data-uppercase.csv.gz');

/**
 * TODO 1: Create a sample CSV file
 * Create a CSV file with at least 100 rows of data
 */
function createSampleCSV() {
  console.log('Creating sample CSV file...');

  // Your code here
  // Sample CSV format:
  // id,name,email,city
  // 1,john doe,john@example.com,new york
  // 2,jane smith,jane@example.com,los angeles
  // ...

  // Generate at least 100 rows

  console.log('Sample CSV file created\n');
}

/**
 * TODO 2: Create a transform stream to convert to uppercase
 *
 * Create a Transform stream that:
 * 1. Receives chunks of data
 * 2. Converts them to uppercase
 * 3. Passes them to the next stream
 *
 * Hint: Extend Transform class and implement _transform method
 */
class UppercaseTransform extends Transform {
  constructor(options) {
    super(options);
    // Initialize any properties if needed
  }

  /**
   * TODO: Implement the _transform method
   *
   * @param {Buffer} chunk - Data chunk
   * @param {string} encoding - Encoding
   * @param {Function} callback - Callback function
   */
  _transform(chunk, encoding, callback) {
    // Your code here
    // 1. Convert chunk to string
    // 2. Transform to uppercase
    // 3. Push the result
    // 4. Call callback()
  }
}

/**
 * TODO 3: Build and execute the pipeline
 *
 * Steps:
 * 1. Get original file size
 * 2. Create readable stream from CSV file
 * 3. Create UppercaseTransform instance
 * 4. Create gzip compression stream
 * 5. Create writable stream to output file
 * 6. Use pipeline() to connect all streams
 * 7. Measure processing time
 * 8. Display statistics when complete
 *
 * @returns {Promise<object>} Statistics (originalSize, compressedSize, time)
 */
function processDataPipeline() {
  return new Promise((resolve, reject) => {
    console.log('Starting data pipeline...\n');

    const startTime = Date.now();

    // Your code here
    // Use: pipeline(readable, transform, gzip, writable, callback)
  });
}

/**
 * TODO 4: Main function
 *
 * 1. Create the sample CSV file
 * 2. Run the pipeline
 * 3. Display results:
 *    - Original file size
 *    - Compressed file size
 *    - Compression ratio
 *    - Processing time
 * 4. Optional: Verify the output by decompressing and showing a few lines
 */
async function main() {
  console.log('=== Data Pipeline Exercise ===\n');

  try {
    // Your code here

  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * BONUS TODO: Verify the output
 * Create a function to decompress and display first few lines
 * to verify the transformation worked correctly
 */
function verifyOutput() {
  console.log('\n--- Verifying Output ---\n');

  // Your code here
  // Hint: Create pipeline with: readable -> gunzip -> process lines
}

// TODO 5: Run the program
// Call your main function here
