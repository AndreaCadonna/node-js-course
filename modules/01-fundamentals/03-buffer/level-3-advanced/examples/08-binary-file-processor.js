/**
 * Example 8: Binary File Processor
 *
 * Complete example of processing large binary files efficiently
 * with streaming, pooling, and production patterns.
 */

const fs = require('fs');
const path = require('path');
const { Readable, Writable, pipeline } = require('stream');
const crypto = require('crypto');

console.log('=== Binary File Processor ===\n');

// 1. Chunked file reader
class ChunkedFileReader extends Readable {
  constructor(filePath, options = {}) {
    super(options);
    this.filePath = filePath;
    this.chunkSize = options.chunkSize || 64 * 1024; // 64KB
    this.offset = 0;
    this.fileSize = 0;
    this.bytesRead = 0;
  }

  async _construct(callback) {
    try {
      const stats = await fs.promises.stat(this.filePath);
      this.fileSize = stats.size;
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _read() {
    if (this.offset >= this.fileSize) {
      this.push(null); // EOF
      return;
    }

    const buffer = Buffer.allocUnsafe(this.chunkSize);
    const bytesToRead = Math.min(this.chunkSize, this.fileSize - this.offset);

    fs.open(this.filePath, 'r', (err, fd) => {
      if (err) {
        this.destroy(err);
        return;
      }

      fs.read(fd, buffer, 0, bytesToRead, this.offset, (readErr, bytesRead) => {
        fs.close(fd, () => {});

        if (readErr) {
          this.destroy(readErr);
          return;
        }

        this.offset += bytesRead;
        this.bytesRead += bytesRead;

        const chunk = bytesRead < this.chunkSize ? buffer.slice(0, bytesRead) : buffer;
        this.push(chunk);
      });
    });
  }

  getProgress() {
    return {
      bytesRead: this.bytesRead,
      fileSize: this.fileSize,
      percentage: (this.bytesRead / this.fileSize * 100).toFixed(2)
    };
  }
}

// 2. Binary data processor
class BinaryDataProcessor extends Writable {
  constructor(options = {}) {
    super(options);
    this.processedBytes = 0;
    this.processedChunks = 0;
    this.stats = {
      min: Infinity,
      max: -Infinity,
      sum: 0,
      count: 0
    };
  }

  _write(chunk, encoding, callback) {
    try {
      this.processChunk(chunk);
      this.processedBytes += chunk.length;
      this.processedChunks++;
      callback();
    } catch (err) {
      callback(err);
    }
  }

  processChunk(chunk) {
    // Analyze each byte
    for (let i = 0; i < chunk.length; i++) {
      const byte = chunk[i];
      this.stats.min = Math.min(this.stats.min, byte);
      this.stats.max = Math.max(this.stats.max, byte);
      this.stats.sum += byte;
      this.stats.count++;
    }
  }

  getStats() {
    return {
      ...this.stats,
      average: this.stats.count > 0 ? this.stats.sum / this.stats.count : 0,
      processedBytes: this.processedBytes,
      processedChunks: this.processedChunks
    };
  }
}

// 3. Binary file analyzer
class BinaryFileAnalyzer {
  constructor() {
    this.bufferPool = {
      available: [],
      bufferSize: 64 * 1024
    };

    // Pre-allocate buffers
    for (let i = 0; i < 10; i++) {
      this.bufferPool.available.push(Buffer.allocUnsafe(this.bufferPool.bufferSize));
    }
  }

  acquireBuffer() {
    if (this.bufferPool.available.length > 0) {
      return this.bufferPool.available.pop();
    }
    return Buffer.allocUnsafe(this.bufferPool.bufferSize);
  }

  releaseBuffer(buffer) {
    buffer.fill(0);
    this.bufferPool.available.push(buffer);
  }

  async analyze(buffer) {
    const analysis = {
      size: buffer.length,
      hash: crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16),
      entropy: this.calculateEntropy(buffer),
      fileType: this.detectFileType(buffer),
      isText: this.isLikelyText(buffer)
    };

    return analysis;
  }

  calculateEntropy(buffer) {
    const counts = new Array(256).fill(0);

    for (let i = 0; i < buffer.length; i++) {
      counts[buffer[i]]++;
    }

    let entropy = 0;

    for (let count of counts) {
      if (count > 0) {
        const p = count / buffer.length;
        entropy -= p * Math.log2(p);
      }
    }

    return entropy.toFixed(2);
  }

  detectFileType(buffer) {
    if (buffer.length < 4) return 'unknown';

    // Check signatures
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'PNG';
    }
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'JPEG';
    }
    if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
      return 'ZIP';
    }
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return 'PDF';
    }

    return 'unknown';
  }

  isLikelyText(buffer) {
    let textBytes = 0;

    for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
      const byte = buffer[i];
      // Check if printable ASCII or common whitespace
      if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
        textBytes++;
      }
    }

    return textBytes / Math.min(buffer.length, 1000) > 0.8;
  }
}

// 4. File transformation pipeline
class FileTransformer {
  static async transform(inputPath, outputPath, transformFn) {
    return new Promise((resolve, reject) => {
      const stats = {
        bytesRead: 0,
        bytesWritten: 0,
        chunksProcessed: 0,
        startTime: Date.now()
      };

      const reader = fs.createReadStream(inputPath, { highWaterMark: 64 * 1024 });
      const writer = fs.createWriteStream(outputPath);

      reader.on('data', (chunk) => {
        stats.bytesRead += chunk.length;
        stats.chunksProcessed++;

        try {
          const transformed = transformFn(chunk);
          stats.bytesWritten += transformed.length;
          writer.write(transformed);
        } catch (err) {
          reader.destroy(err);
        }
      });

      reader.on('end', () => {
        writer.end(() => {
          stats.endTime = Date.now();
          stats.duration = stats.endTime - stats.startTime;
          resolve(stats);
        });
      });

      reader.on('error', reject);
      writer.on('error', reject);
    });
  }
}

// 5. Example usage
console.log('File Processing Examples:\n');

// Create test file
const testFilePath = path.join(__dirname, 'test-data.bin');
const testData = Buffer.alloc(1024 * 100); // 100KB
crypto.randomFillSync(testData);

// Write test file
try {
  fs.writeFileSync(testFilePath, testData);
  console.log('Created test file:', testFilePath);
  console.log('Size:', testData.length, 'bytes\n');
} catch (err) {
  console.log('Note: File operations may not work in this environment\n');
}

// Analyze file
const analyzer = new BinaryFileAnalyzer();

(async () => {
  try {
    const analysis = await analyzer.analyze(testData.slice(0, 1024));
    console.log('File analysis:', analysis);
    console.log('');
  } catch (err) {
    console.log('Analysis error:', err.message);
  }

  // Process with stats
  const processor = new BinaryDataProcessor();

  processor.on('finish', () => {
    console.log('Processing complete!');
    console.log('Stats:', processor.getStats());
    console.log('');
  });

  // Feed data in chunks
  const chunkSize = 1024;
  for (let i = 0; i < testData.length; i += chunkSize) {
    const chunk = testData.slice(i, Math.min(i + chunkSize, testData.length));
    processor.write(chunk);
  }
  processor.end();

  // Wait a bit for async operations
  await new Promise(resolve => setTimeout(resolve, 100));

  // Clean up
  try {
    fs.unlinkSync(testFilePath);
    console.log('Cleaned up test file');
  } catch (err) {
    // Ignore cleanup errors
  }

  console.log('\n=== Summary ===');
  console.log('✓ Chunked reading for large files');
  console.log('✓ Streaming processing prevents memory issues');
  console.log('✓ Buffer pooling for efficiency');
  console.log('✓ File analysis and type detection');
  console.log('✓ Transformation pipelines');
  console.log('✓ Production-ready error handling');
  console.log('✓ Progress tracking and statistics');
})();
