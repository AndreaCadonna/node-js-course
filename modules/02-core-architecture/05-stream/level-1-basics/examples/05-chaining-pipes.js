/**
 * 05-chaining-pipes.js
 * =====================
 * Demonstrates chaining multiple pipes to create data pipelines
 *
 * Key Concepts:
 * - Chaining multiple transform streams
 * - Building data pipelines with pipe()
 * - File compression with zlib
 * - Measuring performance of chained operations
 * - Return value of pipe() enables chaining
 *
 * Run: node 05-chaining-pipes.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { Transform } = require('stream');

console.log('=== Chaining Pipes Example ===\n');

// =============================================================================
// EXAMPLE 1: Simple Chain (Read → Transform → Write)
// =============================================================================

console.log('--- Example 1: Simple Transform Chain ---\n');

// Create a sample file
const inputPath = path.join(__dirname, 'chain-input.txt');
const sampleData = 'hello world\n'.repeat(100);
fs.writeFileSync(inputPath, sampleData);

console.log(`✓ Created input file: ${inputPath}`);
console.log(`✓ Input size: ${fs.statSync(inputPath).size} bytes\n`);

// Create a simple transform that converts to uppercase
class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // Transform the chunk
    const upperChunk = chunk.toString().toUpperCase();
    // Push transformed data
    this.push(upperChunk);
    // Signal completion
    callback();
  }
}

const outputPath1 = path.join(__dirname, 'chain-output-1.txt');

console.log('Chaining: Read → UpperCase → Write\n');

const startTime1 = Date.now();

// Chain the streams: readable.pipe(transform).pipe(writable)
// pipe() returns the destination, allowing chaining!
fs.createReadStream(inputPath)
  .pipe(new UpperCaseTransform())
  .pipe(fs.createWriteStream(outputPath1))
  .on('finish', () => {
    const duration = Date.now() - startTime1;
    console.log(`✓ Chain complete in ${duration}ms`);
    console.log(`✓ Output: ${outputPath1}\n`);

    // Preview the result
    const output = fs.readFileSync(outputPath1, 'utf8');
    console.log('Preview (first 50 chars):', output.substring(0, 50));
    console.log('');

    // Continue to Example 2
    setTimeout(example2Compression, 100);
  });

// =============================================================================
// EXAMPLE 2: Compression Chain (Read → Gzip → Write)
// =============================================================================

function example2Compression() {
  console.log('--- Example 2: Compression Chain ---\n');

  // Create a larger file to see compression benefits
  const largeInputPath = path.join(__dirname, 'large-input.txt');
  const largeData = 'This is sample data that will be compressed. '.repeat(10000);
  fs.writeFileSync(largeInputPath, largeData);

  const compressedPath = path.join(__dirname, 'compressed.txt.gz');

  const originalSize = fs.statSync(largeInputPath).size;
  console.log(`Original file size: ${(originalSize / 1024).toFixed(2)}KB`);
  console.log('Chaining: Read → Gzip → Write\n');

  const startTime = Date.now();

  // Chain compression: read → compress → write
  fs.createReadStream(largeInputPath)
    .pipe(zlib.createGzip()) // Gzip compression transform
    .pipe(fs.createWriteStream(compressedPath))
    .on('finish', () => {
      const duration = Date.now() - startTime;
      const compressedSize = fs.statSync(compressedPath).size;
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

      console.log(`✓ Compression complete in ${duration}ms`);
      console.log(`✓ Original size: ${(originalSize / 1024).toFixed(2)}KB`);
      console.log(`✓ Compressed size: ${(compressedSize / 1024).toFixed(2)}KB`);
      console.log(`✓ Compression ratio: ${ratio}% smaller\n`);

      // Continue to decompression
      example3Decompression(compressedPath, originalSize);
    });
}

// =============================================================================
// EXAMPLE 3: Decompression Chain (Read → Gunzip → Write)
// =============================================================================

function example3Decompression(compressedPath, originalSize) {
  console.log('--- Example 3: Decompression Chain ---\n');

  const decompressedPath = path.join(__dirname, 'decompressed.txt');

  console.log('Chaining: Read → Gunzip → Write\n');

  const startTime = Date.now();

  // Chain decompression: read → decompress → write
  fs.createReadStream(compressedPath)
    .pipe(zlib.createGunzip()) // Gunzip decompression transform
    .pipe(fs.createWriteStream(decompressedPath))
    .on('finish', () => {
      const duration = Date.now() - startTime;
      const decompressedSize = fs.statSync(decompressedPath).size;

      console.log(`✓ Decompression complete in ${duration}ms`);
      console.log(`✓ Decompressed size: ${(decompressedSize / 1024).toFixed(2)}KB`);
      console.log(`✓ Matches original: ${decompressedSize === originalSize ? 'YES' : 'NO'}\n`);

      // Continue to Example 4
      example4MultipleTransforms();
    });
}

// =============================================================================
// EXAMPLE 4: Multiple Transform Chain
// =============================================================================

function example4MultipleTransforms() {
  console.log('--- Example 4: Multiple Transform Chain ---\n');

  const inputPath = path.join(__dirname, 'chain-input.txt');
  const outputPath = path.join(__dirname, 'multi-transform-output.txt');

  // Create multiple custom transforms
  class LineNumberTransform extends Transform {
    constructor(options) {
      super(options);
      this.lineNumber = 0;
    }

    _transform(chunk, encoding, callback) {
      const lines = chunk.toString().split('\n');
      const numberedLines = lines.map((line, index) => {
        if (line) {
          this.lineNumber++;
          return `${this.lineNumber}. ${line}`;
        }
        return line;
      }).join('\n');

      this.push(numberedLines);
      callback();
    }
  }

  class ReverseTransform extends Transform {
    _transform(chunk, encoding, callback) {
      const reversed = chunk.toString()
        .split('')
        .reverse()
        .join('');
      this.push(reversed);
      callback();
    }
  }

  console.log('Chaining: Read → LineNumber → UpperCase → Reverse → Write\n');

  const startTime = Date.now();

  // Chain multiple transforms!
  fs.createReadStream(inputPath)
    .pipe(new LineNumberTransform())
    .pipe(new UpperCaseTransform())
    .pipe(new ReverseTransform())
    .pipe(fs.createWriteStream(outputPath))
    .on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`✓ Multi-transform chain complete in ${duration}ms\n`);

      // Show sample output
      const output = fs.readFileSync(outputPath, 'utf8');
      console.log('Sample output (first 100 chars):');
      console.log(output.substring(0, 100));
      console.log('');

      // Continue to Example 5
      example5ComplexPipeline();
    });
}

// =============================================================================
// EXAMPLE 5: Complex Pipeline (Compress + Encrypt)
// =============================================================================

function example5ComplexPipeline() {
  console.log('--- Example 5: Complex Pipeline (Compress + Encrypt) ---\n');

  const inputPath = path.join(__dirname, 'large-input.txt');
  const outputPath = path.join(__dirname, 'compressed-encrypted.bin');

  // Encryption setup
  const algorithm = 'aes-256-cbc';
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  const inputSize = fs.statSync(inputPath).size;
  console.log(`Input size: ${(inputSize / 1024).toFixed(2)}KB`);
  console.log('Pipeline: Read → Gzip → Encrypt → Write\n');

  const startTime = Date.now();

  // Build a complex pipeline
  fs.createReadStream(inputPath)
    .pipe(zlib.createGzip())                           // Step 1: Compress
    .pipe(crypto.createCipheriv(algorithm, key, iv))   // Step 2: Encrypt
    .pipe(fs.createWriteStream(outputPath))            // Step 3: Write
    .on('finish', () => {
      const duration = Date.now() - startTime;
      const outputSize = fs.statSync(outputPath).size;

      console.log(`✓ Complex pipeline complete in ${duration}ms`);
      console.log(`✓ Output size: ${(outputSize / 1024).toFixed(2)}KB`);
      console.log('✓ Data is now compressed AND encrypted\n');

      // Demonstrate decryption and decompression
      example6ReversePipeline(outputPath, key, iv, inputSize);
    });
}

// =============================================================================
// EXAMPLE 6: Reverse Pipeline (Decrypt + Decompress)
// =============================================================================

function example6ReversePipeline(encryptedPath, key, iv, originalSize) {
  console.log('--- Example 6: Reverse Pipeline (Decrypt + Decompress) ---\n');

  const outputPath = path.join(__dirname, 'decrypted-decompressed.txt');

  const algorithm = 'aes-256-cbc';

  console.log('Reverse Pipeline: Read → Decrypt → Gunzip → Write\n');

  const startTime = Date.now();

  // Reverse the pipeline
  fs.createReadStream(encryptedPath)
    .pipe(crypto.createDecipheriv(algorithm, key, iv))  // Step 1: Decrypt
    .pipe(zlib.createGunzip())                          // Step 2: Decompress
    .pipe(fs.createWriteStream(outputPath))             // Step 3: Write
    .on('finish', () => {
      const duration = Date.now() - startTime;
      const outputSize = fs.statSync(outputPath).size;

      console.log(`✓ Reverse pipeline complete in ${duration}ms`);
      console.log(`✓ Output size: ${(outputSize / 1024).toFixed(2)}KB`);
      console.log(`✓ Matches original: ${outputSize === originalSize ? 'YES' : 'NO'}\n`);

      // Show statistics
      showStatistics();
    });
}

// =============================================================================
// Statistics and Summary
// =============================================================================

function showStatistics() {
  console.log('=== Pipeline Statistics ===\n');

  const files = {
    'Original': 'large-input.txt',
    'Compressed': 'compressed.txt.gz',
    'Compressed + Encrypted': 'compressed-encrypted.bin',
    'Decompressed': 'decompressed.txt',
    'Decrypted + Decompressed': 'decrypted-decompressed.txt'
  };

  console.log('File sizes:');
  for (const [label, filename] of Object.entries(files)) {
    const filepath = path.join(__dirname, filename);
    try {
      const size = fs.statSync(filepath).size;
      console.log(`  ${label}: ${(size / 1024).toFixed(2)}KB`);
    } catch (error) {
      console.log(`  ${label}: Not found`);
    }
  }

  console.log('');
  printKeyTakeaways();
  cleanup();
}

// =============================================================================
// Key Takeaways
// =============================================================================

function printKeyTakeaways() {
  console.log('=== Key Takeaways ===');
  console.log('• pipe() returns the destination stream, enabling chaining');
  console.log('• Syntax: stream1.pipe(stream2).pipe(stream3).pipe(stream4)');
  console.log('• Each stream processes data and passes it to the next');
  console.log('• Transform streams are perfect for chaining');
  console.log('• Common transforms: compression, encryption, parsing, formatting');
  console.log('• Chaining is memory-efficient (processes chunks, not entire file)');
  console.log('• Order matters: compress before encrypt, decrypt before decompress');
  console.log('• Backpressure is handled automatically across the chain');
  console.log('• Always handle errors on each stream in the chain\n');
}

// =============================================================================
// Cleanup
// =============================================================================

function cleanup() {
  console.log('Cleaning up files...');

  const filesToDelete = [
    'chain-input.txt',
    'chain-output-1.txt',
    'large-input.txt',
    'compressed.txt.gz',
    'decompressed.txt',
    'multi-transform-output.txt',
    'compressed-encrypted.bin',
    'decrypted-decompressed.txt'
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
// Additional Notes:
// =============================================================================

/**
 * PIPE CHAINING:
 *
 * pipe() returns the destination stream, which allows chaining:
 *
 * source.pipe(transform1).pipe(transform2).pipe(destination)
 *
 * This is equivalent to:
 *
 * const step1 = source.pipe(transform1);
 * const step2 = step1.pipe(transform2);
 * step2.pipe(destination);
 *
 * DATA FLOW:
 *
 * source → [chunk] → transform1 → [processed] → transform2 → [processed] → dest
 *
 * Each stream:
 * 1. Receives data from previous stream
 * 2. Processes it
 * 3. Passes it to next stream
 * 4. Handles backpressure automatically
 *
 * COMMON TRANSFORM STREAMS:
 *
 * - zlib.createGzip() / createGunzip() - Compression
 * - zlib.createDeflate() / createInflate() - Compression
 * - crypto.createCipheriv() / createDecipheriv() - Encryption
 * - Custom Transform classes - Any processing
 *
 * ERROR HANDLING IN CHAINS:
 *
 * Add error handlers to EACH stream or use pipeline() (covered in later example)
 */
