/**
 * Streaming Cryptography
 *
 * Efficient encryption and decryption of large files using streams,
 * minimizing memory usage while maintaining security.
 */

const crypto = require('crypto');
const fs = require('fs');
const { pipeline, Transform } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

console.log('=== Streaming Cryptography ===\n');

// Example 1: Stream-Based File Encryption
console.log('1. Stream-Based File Encryption:');

class EncryptStream extends Transform {
  constructor(key, options = {}) {
    super(options);
    this.key = key;
    this.iv = crypto.randomBytes(16);
    this.cipher = crypto.createCipheriv('aes-256-gcm', this.key, this.iv);
    this.ivWritten = false;
  }

  _transform(chunk, encoding, callback) {
    try {
      // Write IV as first chunk
      if (!this.ivWritten) {
        this.push(this.iv);
        this.ivWritten = true;
      }

      // Encrypt and push chunk
      const encrypted = this.cipher.update(chunk);
      this.push(encrypted);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    try {
      // Push final encrypted data
      const final = this.cipher.final();
      this.push(final);

      // Push auth tag
      const authTag = this.cipher.getAuthTag();
      this.push(authTag);

      callback();
    } catch (err) {
      callback(err);
    }
  }
}

class DecryptStream extends Transform {
  constructor(key, options = {}) {
    super(options);
    this.key = key;
    this.iv = null;
    this.authTag = null;
    this.decipher = null;
    this.chunks = [];
    this.headerSize = 16; // IV size
    this.authTagSize = 16; // Auth tag size
    this.headerRead = false;
  }

  _transform(chunk, encoding, callback) {
    try {
      this.chunks.push(chunk);
      const buffered = Buffer.concat(this.chunks);

      // Read IV from first chunk
      if (!this.headerRead && buffered.length >= this.headerSize) {
        this.iv = buffered.slice(0, this.headerSize);
        this.decipher = crypto.createDecipheriv('aes-256-gcm', this.key, this.iv);
        this.chunks = [buffered.slice(this.headerSize)];
        this.headerRead = true;
      }

      // Process chunks (keep last 16 bytes for auth tag)
      if (this.headerRead && this.chunks.length > 0) {
        const data = Buffer.concat(this.chunks);
        if (data.length > this.authTagSize) {
          const toDecrypt = data.slice(0, -this.authTagSize);
          this.chunks = [data.slice(-this.authTagSize)];
          const decrypted = this.decipher.update(toDecrypt);
          this.push(decrypted);
        }
      }

      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    try {
      // Last chunk is auth tag
      const authTag = Buffer.concat(this.chunks);
      this.decipher.setAuthTag(authTag);

      const final = this.decipher.final();
      this.push(final);

      callback();
    } catch (err) {
      callback(err);
    }
  }
}

// Demonstrate streaming encryption (simulated)
const key = crypto.randomBytes(32);

// Create sample data
const sampleData = Buffer.from('Large file content '.repeat(1000));

console.log('Sample data size:', sampleData.length, 'bytes');
console.log('Streaming encryption preserves constant memory usage');
console.log('✓ Stream encryption classes ready\n');

// Example 2: Progress Tracking with Streams
console.log('2. Progress Tracking During Encryption:');

class ProgressEncryptStream extends Transform {
  constructor(key, totalSize, onProgress) {
    super();
    this.key = key;
    this.totalSize = totalSize;
    this.onProgress = onProgress || (() => {});
    this.processedBytes = 0;

    this.iv = crypto.randomBytes(16);
    this.cipher = crypto.createCipheriv('aes-256-gcm', this.key, this.iv);
    this.ivWritten = false;
  }

  _transform(chunk, encoding, callback) {
    try {
      if (!this.ivWritten) {
        this.push(this.iv);
        this.ivWritten = true;
      }

      const encrypted = this.cipher.update(chunk);
      this.push(encrypted);

      // Update progress
      this.processedBytes += chunk.length;
      const progress = (this.processedBytes / this.totalSize) * 100;
      this.onProgress(progress, this.processedBytes, this.totalSize);

      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    try {
      const final = this.cipher.final();
      this.push(final);

      const authTag = this.cipher.getAuthTag();
      this.push(authTag);

      this.onProgress(100, this.totalSize, this.totalSize);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

// Simulate progress tracking
let lastProgress = 0;
const progressStream = new ProgressEncryptStream(
  key,
  sampleData.length,
  (progress, processed, total) => {
    if (progress - lastProgress >= 25) {
      console.log(`Progress: ${progress.toFixed(1)}% (${processed}/${total} bytes)`);
      lastProgress = progress;
    }
  }
);

// Process sample data through progress stream
progressStream.write(sampleData.slice(0, sampleData.length / 4));
progressStream.write(sampleData.slice(sampleData.length / 4, sampleData.length / 2));
progressStream.write(sampleData.slice(sampleData.length / 2, 3 * sampleData.length / 4));
progressStream.write(sampleData.slice(3 * sampleData.length / 4));
progressStream.end();

console.log('✓ Progress tracking implemented\n');

// Example 3: Chunked Hash Computation
console.log('3. Streaming Hash Computation:');

class HashStream extends Transform {
  constructor(algorithm = 'sha256') {
    super();
    this.hash = crypto.createHash(algorithm);
    this.algorithm = algorithm;
  }

  _transform(chunk, encoding, callback) {
    try {
      this.hash.update(chunk);
      this.push(chunk); // Pass through
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    try {
      this.digest = this.hash.digest('hex');
      callback();
    } catch (err) {
      callback(err);
    }
  }

  getDigest() {
    return this.digest;
  }
}

const hashStream = new HashStream('sha256');
const chunks = [];

hashStream.on('data', chunk => chunks.push(chunk));
hashStream.on('end', () => {
  console.log('Hash computed:', hashStream.getDigest());
  console.log('Data passed through:', Buffer.concat(chunks).length, 'bytes');
});

hashStream.write(Buffer.from('Chunk 1 '));
hashStream.write(Buffer.from('Chunk 2 '));
hashStream.write(Buffer.from('Chunk 3'));
hashStream.end();

console.log('✓ Streaming hash computation\n');

// Example 4: Encrypted File Storage System
console.log('4. Encrypted File Storage System:');

class EncryptedFileStorage {
  constructor(storageDir, encryptionKey) {
    this.storageDir = storageDir;
    this.encryptionKey = encryptionKey;
    this.manifest = new Map();
  }

  async encryptFile(fileId, inputData) {
    return new Promise((resolve, reject) => {
      const metadata = {
        fileId,
        originalSize: inputData.length,
        encryptedAt: Date.now(),
        algorithm: 'aes-256-gcm'
      };

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

      const chunks = [];

      // IV at start
      chunks.push(iv);

      // Encrypt data
      chunks.push(cipher.update(inputData));
      chunks.push(cipher.final());

      // Auth tag at end
      chunks.push(cipher.getAuthTag());

      const encrypted = Buffer.concat(chunks);

      metadata.encryptedSize = encrypted.length;
      metadata.iv = iv.toString('hex');

      this.manifest.set(fileId, metadata);

      resolve({
        fileId,
        encrypted,
        metadata
      });
    });
  }

  async decryptFile(fileId, encryptedData) {
    return new Promise((resolve, reject) => {
      const metadata = this.manifest.get(fileId);
      if (!metadata) {
        return reject(new Error('File not found'));
      }

      // Extract IV (first 16 bytes)
      const iv = encryptedData.slice(0, 16);

      // Extract auth tag (last 16 bytes)
      const authTag = encryptedData.slice(-16);

      // Extract ciphertext (middle)
      const ciphertext = encryptedData.slice(16, -16);

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      const chunks = [];
      chunks.push(decipher.update(ciphertext));
      chunks.push(decipher.final());

      const decrypted = Buffer.concat(chunks);

      resolve({
        fileId,
        data: decrypted,
        metadata
      });
    });
  }

  async encryptStream(inputStream, outputStream) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    return new Promise((resolve, reject) => {
      // Write IV first
      outputStream.write(iv);

      inputStream
        .pipe(cipher)
        .on('data', chunk => outputStream.write(chunk))
        .on('end', () => {
          // Write auth tag last
          outputStream.write(cipher.getAuthTag());
          outputStream.end();
          resolve();
        })
        .on('error', reject);
    });
  }

  getMetadata(fileId) {
    return this.manifest.get(fileId);
  }

  listFiles() {
    return Array.from(this.manifest.entries()).map(([id, meta]) => ({
      fileId: id,
      ...meta
    }));
  }
}

const storage = new EncryptedFileStorage('/tmp/encrypted', crypto.randomBytes(32));

// Encrypt file
const testData = Buffer.from('Confidential document content');
storage.encryptFile('doc-001', testData)
  .then(result => {
    console.log('File encrypted:', result.fileId);
    console.log('Original size:', result.metadata.originalSize);
    console.log('Encrypted size:', result.metadata.encryptedSize);

    // Decrypt file
    return storage.decryptFile('doc-001', result.encrypted);
  })
  .then(result => {
    console.log('File decrypted:', result.data.toString());
    console.log('✓ Encrypted file storage working');
  })
  .catch(err => console.error('Error:', err.message));

console.log();

// Example 5: Memory-Efficient Large File Processing
console.log('5. Memory-Efficient Processing:');

class MemoryEfficientEncryption {
  constructor() {
    this.highWaterMark = 64 * 1024; // 64KB chunks
  }

  async processLargeFile(inputSize, key) {
    console.log(`Processing file of size: ${inputSize} bytes`);

    const stats = {
      chunksProcessed: 0,
      totalBytesRead: 0,
      totalBytesWritten: 0,
      startTime: Date.now(),
      peakMemory: 0
    };

    // Simulate processing in chunks
    const chunkSize = this.highWaterMark;
    const numChunks = Math.ceil(inputSize / chunkSize);

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    for (let i = 0; i < numChunks; i++) {
      const currentChunkSize = Math.min(chunkSize, inputSize - stats.totalBytesRead);

      // Simulate reading chunk
      const chunk = Buffer.alloc(currentChunkSize);

      // Encrypt chunk
      const encrypted = cipher.update(chunk);

      stats.chunksProcessed++;
      stats.totalBytesRead += chunk.length;
      stats.totalBytesWritten += encrypted.length;

      // Track memory usage
      const memUsage = process.memoryUsage().heapUsed;
      stats.peakMemory = Math.max(stats.peakMemory, memUsage);
    }

    // Final
    const final = cipher.final();
    stats.totalBytesWritten += final.length;

    const authTag = cipher.getAuthTag();
    stats.totalBytesWritten += authTag.length;

    stats.endTime = Date.now();
    stats.duration = stats.endTime - stats.startTime;

    return stats;
  }
}

const memoryEfficient = new MemoryEfficientEncryption();

memoryEfficient.processLargeFile(10 * 1024 * 1024, crypto.randomBytes(32))
  .then(stats => {
    console.log('Processing complete:');
    console.log(`  Chunks: ${stats.chunksProcessed}`);
    console.log(`  Bytes read: ${stats.totalBytesRead}`);
    console.log(`  Bytes written: ${stats.totalBytesWritten}`);
    console.log(`  Duration: ${stats.duration}ms`);
    console.log(`  Peak memory: ${(stats.peakMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log('✓ Memory-efficient processing demonstrated');
  });

console.log();

// Example 6: Best Practices
console.log('6. Streaming Crypto Best Practices:');

const bestPractices = {
  'Use appropriate chunk sizes': '16KB-64KB for optimal performance',
  'Always use authenticated encryption': 'GCM mode prevents tampering',
  'Stream IV and auth tag': 'IV at start, auth tag at end',
  'Handle backpressure': 'Pause reading if output buffer is full',
  'Implement progress tracking': 'User feedback for long operations',
  'Clean up on errors': 'Properly close streams and clean up resources',
  'Use pipeline() for safety': 'Handles errors and cleanup automatically',
  'Constant memory usage': 'Process any size file with fixed memory',
  'Don\'t load entire file': 'Stream processing is the key',
  'Test with large files': 'Verify memory usage stays constant',
  'Monitor performance': 'Track throughput and latency',
  'Handle stream errors': 'Implement proper error handling'
};

console.log('Streaming Crypto Best Practices:');
for (const [practice, description] of Object.entries(bestPractices)) {
  console.log(`✓ ${practice}: ${description}`);
}

console.log('\n=== Streaming Cryptography Complete ===');
