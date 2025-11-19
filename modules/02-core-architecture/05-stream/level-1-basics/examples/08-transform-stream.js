/**
 * 08-transform-stream.js
 * =======================
 * Demonstrates using built-in transform streams
 *
 * Key Concepts:
 * - What transform streams are
 * - Using zlib for compression/decompression
 * - Using crypto for encryption/decryption
 * - Chaining multiple transforms
 * - Creating data processing pipelines
 *
 * Run: node 08-transform-stream.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { pipeline } = require('stream');

console.log('=== Transform Streams Example ===\n');

/**
 * WHAT IS A TRANSFORM STREAM?
 *
 * A Transform stream is both readable AND writable:
 * - Receives input (writable side)
 * - Processes/transforms the data
 * - Outputs result (readable side)
 *
 * Think of it as: Input → [Transform] → Output
 *
 * Common built-in transforms:
 * - zlib: Compression/decompression
 * - crypto: Encryption/decryption/hashing
 * - Custom: Any data transformation
 */

// =============================================================================
// EXAMPLE 1: Compression with zlib
// =============================================================================

console.log('--- Example 1: File Compression with Gzip ---\n');

// Create a sample file
const inputPath = path.join(__dirname, 'transform-input.txt');
const sampleData = 'This is sample data that will be compressed. '.repeat(1000);
fs.writeFileSync(inputPath, sampleData);

const originalSize = fs.statSync(inputPath).size;
console.log(`✓ Created input file: ${(originalSize / 1024).toFixed(2)}KB\n`);

function example1Compression() {
  return new Promise((resolve) => {
    const compressedPath = path.join(__dirname, 'compressed.txt.gz');

    console.log('Compressing with Gzip transform...\n');
    const startTime = Date.now();

    pipeline(
      fs.createReadStream(inputPath),
      zlib.createGzip(), // Transform: compress
      fs.createWriteStream(compressedPath),
      (error) => {
        if (error) {
          console.error('Compression error:', error.message);
          resolve();
          return;
        }

        const duration = Date.now() - startTime;
        const compressedSize = fs.statSync(compressedPath).size;
        const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

        console.log(`✓ Compression complete in ${duration}ms`);
        console.log(`✓ Original size: ${(originalSize / 1024).toFixed(2)}KB`);
        console.log(`✓ Compressed size: ${(compressedSize / 1024).toFixed(2)}KB`);
        console.log(`✓ Space saved: ${ratio}%\n`);

        resolve(compressedPath);
      }
    );
  });
}

// =============================================================================
// EXAMPLE 2: Decompression with zlib
// =============================================================================

function example2Decompression(compressedPath) {
  console.log('--- Example 2: File Decompression with Gunzip ---\n');

  return new Promise((resolve) => {
    const decompressedPath = path.join(__dirname, 'decompressed.txt');

    console.log('Decompressing with Gunzip transform...\n');
    const startTime = Date.now();

    pipeline(
      fs.createReadStream(compressedPath),
      zlib.createGunzip(), // Transform: decompress
      fs.createWriteStream(decompressedPath),
      (error) => {
        if (error) {
          console.error('Decompression error:', error.message);
          resolve();
          return;
        }

        const duration = Date.now() - startTime;
        const decompressedSize = fs.statSync(decompressedPath).size;

        console.log(`✓ Decompression complete in ${duration}ms`);
        console.log(`✓ Decompressed size: ${(decompressedSize / 1024).toFixed(2)}KB`);
        console.log(`✓ Matches original: ${decompressedSize === originalSize ? 'YES' : 'NO'}\n`);

        resolve();
      }
    );
  });
}

// =============================================================================
// EXAMPLE 3: Other zlib Compression Algorithms
// =============================================================================

function example3OtherAlgorithms() {
  console.log('--- Example 3: Comparing Compression Algorithms ---\n');

  const algorithms = [
    { name: 'Gzip', compress: zlib.createGzip(), decompress: zlib.createGunzip(), ext: '.gz' },
    { name: 'Deflate', compress: zlib.createDeflate(), decompress: zlib.createInflate(), ext: '.deflate' },
    { name: 'Brotli', compress: zlib.createBrotliCompress(), decompress: zlib.createBrotliDecompress(), ext: '.br' }
  ];

  return Promise.all(algorithms.map(algo => {
    return new Promise((resolve) => {
      const outputPath = path.join(__dirname, `compressed${algo.ext}`);
      const startTime = Date.now();

      pipeline(
        fs.createReadStream(inputPath),
        algo.compress,
        fs.createWriteStream(outputPath),
        (error) => {
          if (error) {
            console.error(`${algo.name} error:`, error.message);
            resolve();
            return;
          }

          const duration = Date.now() - startTime;
          const size = fs.statSync(outputPath).size;
          const ratio = ((1 - size / originalSize) * 100).toFixed(1);

          console.log(`${algo.name}:`);
          console.log(`  Time: ${duration}ms`);
          console.log(`  Size: ${(size / 1024).toFixed(2)}KB`);
          console.log(`  Compression: ${ratio}%\n`);

          resolve();
        }
      );
    });
  }));
}

// =============================================================================
// EXAMPLE 4: Encryption with crypto
// =============================================================================

function example4Encryption() {
  console.log('--- Example 4: File Encryption with crypto ---\n');

  return new Promise((resolve) => {
    const algorithm = 'aes-256-cbc';
    const password = 'my-secret-password';

    // Derive key and IV from password
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const encryptedPath = path.join(__dirname, 'encrypted.bin');

    console.log('Encrypting with AES-256-CBC...\n');
    const startTime = Date.now();

    pipeline(
      fs.createReadStream(inputPath),
      crypto.createCipheriv(algorithm, key, iv), // Transform: encrypt
      fs.createWriteStream(encryptedPath),
      (error) => {
        if (error) {
          console.error('Encryption error:', error.message);
          resolve();
          return;
        }

        const duration = Date.now() - startTime;
        const encryptedSize = fs.statSync(encryptedPath).size;

        console.log(`✓ Encryption complete in ${duration}ms`);
        console.log(`✓ Algorithm: ${algorithm}`);
        console.log(`✓ Encrypted size: ${(encryptedSize / 1024).toFixed(2)}KB`);
        console.log(`✓ Key length: ${key.length * 8} bits`);
        console.log(`✓ IV: ${iv.toString('hex').substring(0, 16)}...\n`);

        resolve({ key, iv, encryptedPath });
      }
    );
  });
}

// =============================================================================
// EXAMPLE 5: Decryption with crypto
// =============================================================================

function example5Decryption({ key, iv, encryptedPath }) {
  console.log('--- Example 5: File Decryption with crypto ---\n');

  return new Promise((resolve) => {
    const algorithm = 'aes-256-cbc';
    const decryptedPath = path.join(__dirname, 'decrypted.txt');

    console.log('Decrypting with AES-256-CBC...\n');
    const startTime = Date.now();

    pipeline(
      fs.createReadStream(encryptedPath),
      crypto.createDecipheriv(algorithm, key, iv), // Transform: decrypt
      fs.createWriteStream(decryptedPath),
      (error) => {
        if (error) {
          console.error('Decryption error:', error.message);
          resolve();
          return;
        }

        const duration = Date.now() - startTime;
        const decryptedSize = fs.statSync(decryptedPath).size;

        console.log(`✓ Decryption complete in ${duration}ms`);
        console.log(`✓ Decrypted size: ${(decryptedSize / 1024).toFixed(2)}KB`);
        console.log(`✓ Matches original: ${decryptedSize === originalSize ? 'YES' : 'NO'}\n`);

        resolve();
      }
    );
  });
}

// =============================================================================
// EXAMPLE 6: Hashing with crypto (One-way Transform)
// =============================================================================

function example6Hashing() {
  console.log('--- Example 6: File Hashing (One-way Transform) ---\n');

  return Promise.all(['sha256', 'sha512', 'md5'].map(algorithm => {
    return new Promise((resolve) => {
      const hash = crypto.createHash(algorithm);

      console.log(`Calculating ${algorithm.toUpperCase()} hash...`);

      const readable = fs.createReadStream(inputPath);

      readable.on('data', (chunk) => {
        hash.update(chunk);
      });

      readable.on('end', () => {
        const digest = hash.digest('hex');
        console.log(`  ${algorithm.toUpperCase()}: ${digest}\n`);
        resolve();
      });

      readable.on('error', (error) => {
        console.error(`Error hashing with ${algorithm}:`, error.message);
        resolve();
      });
    });
  }));
}

// =============================================================================
// EXAMPLE 7: Complex Pipeline (Compress + Encrypt)
// =============================================================================

function example7ComplexPipeline() {
  console.log('--- Example 7: Complex Pipeline (Compress + Encrypt) ---\n');

  return new Promise((resolve) => {
    const algorithm = 'aes-256-cbc';
    const password = 'complex-pipeline-password';
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const outputPath = path.join(__dirname, 'compressed-encrypted.bin');

    console.log('Pipeline: Read → Gzip → Encrypt → Write\n');
    const startTime = Date.now();

    pipeline(
      fs.createReadStream(inputPath),
      zlib.createGzip(),                           // Transform 1: Compress
      crypto.createCipheriv(algorithm, key, iv),   // Transform 2: Encrypt
      fs.createWriteStream(outputPath),
      (error) => {
        if (error) {
          console.error('Pipeline error:', error.message);
          resolve();
          return;
        }

        const duration = Date.now() - startTime;
        const outputSize = fs.statSync(outputPath).size;

        console.log(`✓ Complex pipeline complete in ${duration}ms`);
        console.log(`✓ Original: ${(originalSize / 1024).toFixed(2)}KB`);
        console.log(`✓ Compressed + Encrypted: ${(outputSize / 1024).toFixed(2)}KB`);
        console.log(`✓ Data is now compressed AND encrypted\n`);

        resolve({ key, iv, outputPath });
      }
    );
  });
}

// =============================================================================
// EXAMPLE 8: Reverse Complex Pipeline (Decrypt + Decompress)
// =============================================================================

function example8ReversePipeline({ key, iv, outputPath }) {
  console.log('--- Example 8: Reverse Pipeline (Decrypt + Decompress) ---\n');

  return new Promise((resolve) => {
    const algorithm = 'aes-256-cbc';
    const finalPath = path.join(__dirname, 'final-output.txt');

    console.log('Pipeline: Read → Decrypt → Gunzip → Write\n');
    const startTime = Date.now();

    pipeline(
      fs.createReadStream(outputPath),
      crypto.createDecipheriv(algorithm, key, iv),  // Transform 1: Decrypt
      zlib.createGunzip(),                          // Transform 2: Decompress
      fs.createWriteStream(finalPath),
      (error) => {
        if (error) {
          console.error('Reverse pipeline error:', error.message);
          resolve();
          return;
        }

        const duration = Date.now() - startTime;
        const finalSize = fs.statSync(finalPath).size;

        console.log(`✓ Reverse pipeline complete in ${duration}ms`);
        console.log(`✓ Final size: ${(finalSize / 1024).toFixed(2)}KB`);
        console.log(`✓ Matches original: ${finalSize === originalSize ? 'YES' : 'NO'}`);
        console.log(`✓ Order matters: decrypt before decompress!\n`);

        resolve();
      }
    );
  });
}

// =============================================================================
// Run All Examples
// =============================================================================

async function runExamples() {
  try {
    const compressedPath = await example1Compression();
    await example2Decompression(compressedPath);
    await example3OtherAlgorithms();
    const encryptionData = await example4Encryption();
    await example5Decryption(encryptionData);
    await example6Hashing();
    const pipelineData = await example7ComplexPipeline();
    await example8ReversePipeline(pipelineData);

    printKeyTakeaways();
    cleanup();

  } catch (error) {
    console.error('Error:', error.message);
    cleanup();
  }
}

// =============================================================================
// Key Takeaways
// =============================================================================

function printKeyTakeaways() {
  console.log('=== Key Takeaways ===');
  console.log('\n1. Transform Streams:');
  console.log('   - Both readable AND writable');
  console.log('   - Input → Process → Output');
  console.log('   - Perfect for data processing pipelines');
  console.log('\n2. Built-in Transforms (zlib):');
  console.log('   - createGzip() / createGunzip()');
  console.log('   - createDeflate() / createInflate()');
  console.log('   - createBrotliCompress() / createBrotliDecompress()');
  console.log('\n3. Built-in Transforms (crypto):');
  console.log('   - createCipheriv() / createDecipheriv() - Encryption');
  console.log('   - createHash() - One-way hashing');
  console.log('   - createSign() / createVerify() - Signatures');
  console.log('\n4. Chaining Transforms:');
  console.log('   - Multiple transforms in sequence');
  console.log('   - Order matters (compress → encrypt, decrypt → decompress)');
  console.log('   - Use pipeline() for better error handling');
  console.log('\n5. Use Cases:');
  console.log('   - File compression/decompression');
  console.log('   - Data encryption/decryption');
  console.log('   - File integrity (hashing)');
  console.log('   - Data format conversion');
  console.log('   - Real-time data processing');
  console.log('\n6. Best Practices:');
  console.log('   - Use pipeline() instead of pipe()');
  console.log('   - Always handle errors');
  console.log('   - Consider compression before encryption');
  console.log('   - Stream for large files, not small ones\n');
}

// =============================================================================
// Cleanup
// =============================================================================

function cleanup() {
  console.log('Cleaning up files...');

  const filesToDelete = [
    'transform-input.txt',
    'compressed.txt.gz',
    'decompressed.txt',
    'compressed.gz',
    'compressed.deflate',
    'compressed.br',
    'encrypted.bin',
    'decrypted.txt',
    'compressed-encrypted.bin',
    'final-output.txt'
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

// Start examples
runExamples();

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * TRANSFORM STREAM INTERFACE:
 *
 * A transform implements both:
 * - Writable interface: receives data
 * - Readable interface: outputs data
 *
 * COMPRESSION ALGORITHMS:
 *
 * 1. Gzip (.gz):
 *    - Most common
 *    - Good balance of speed and compression
 *    - Widely supported
 *
 * 2. Deflate:
 *    - Similar to gzip
 *    - Used in HTTP compression
 *
 * 3. Brotli (.br):
 *    - Better compression than gzip
 *    - Slower compression
 *    - Modern browsers support it
 *
 * ENCRYPTION ALGORITHMS:
 *
 * 1. AES-256-CBC:
 *    - Strong symmetric encryption
 *    - Requires key and IV
 *    - Block cipher mode
 *
 * 2. AES-256-GCM:
 *    - Authenticated encryption
 *    - Provides integrity check
 *    - Preferred for modern applications
 *
 * HASHING ALGORITHMS:
 *
 * 1. SHA-256:
 *    - Secure, widely used
 *    - 256-bit output
 *
 * 2. SHA-512:
 *    - More secure than SHA-256
 *    - 512-bit output
 *    - Slower
 *
 * 3. MD5:
 *    - NOT secure (deprecated)
 *    - Only use for checksums
 *
 * PIPELINE ORDER:
 *
 * Correct:   Compress → Encrypt → Store
 * Retrieve:  Decrypt → Decompress → Use
 *
 * Why? Compression works better on unencrypted data.
 * Encrypted data is essentially random and won't compress well.
 */
