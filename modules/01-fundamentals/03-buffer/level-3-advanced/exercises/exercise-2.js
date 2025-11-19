/**
 * Exercise 2: Memory-Efficient Image Processor
 *
 * Process large image files without loading them entirely into memory
 * using chunked processing and zero-copy operations.
 */

console.log('=== Exercise 2: Memory-Efficient Image Processor ===\n');

// Task 1: Parse BMP header
console.log('Task 1: Parse BMP Header (54 bytes)');
/**
 * Parse a BMP file header
 * @param {Buffer} buffer - BMP file data (at least 54 bytes)
 * @returns {Object} { width, height, bitsPerPixel, pixelDataOffset, fileSize }
 */
function parseBMPHeader(buffer) {
  // TODO: Implement this function
  // BMP Header structure (first 54 bytes):
  // 0-1: Signature 'BM'
  // 2-5: File size (UInt32LE)
  // 10-13: Pixel data offset (UInt32LE)
  // 18-21: Width (Int32LE)
  // 22-25: Height (Int32LE)
  // 28-29: Bits per pixel (UInt16LE)
  // Your code here
}

// Test Task 1
try {
  const testHeader = Buffer.alloc(54);
  testHeader.write('BM', 0);
  testHeader.writeUInt32LE(1024, 2); // File size
  testHeader.writeUInt32LE(54, 10); // Pixel offset
  testHeader.writeInt32LE(100, 18); // Width
  testHeader.writeInt32LE(100, 22); // Height
  testHeader.writeUInt16LE(24, 28); // 24-bit RGB

  const header = parseBMPHeader(testHeader);
  console.log('Parsed header:', header);
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Process image rows in chunks
console.log('Task 2: Chunked Row Processor');
/**
 * Process image rows without loading entire image
 */
class ChunkedImageProcessor {
  constructor(width, height, bytesPerPixel) {
    // TODO: Initialize processor
    // Calculate row size (width * bytesPerPixel + padding)
    // BMP rows are padded to multiple of 4 bytes
    // Your code here
  }

  processRow(rowData, rowNumber) {
    // TODO: Process a single row of pixels
    // rowData is a buffer containing one row
    // Apply transformation (e.g., grayscale, invert)
    // Return transformed row
    // Your code here
  }

  getRowSize() {
    // TODO: Return size of one row in bytes (including padding)
    // Your code here
  }
}

// Test Task 2
try {
  const processor = new ChunkedImageProcessor(10, 10, 3); // 10x10 RGB

  const rowData = Buffer.alloc(processor.getRowSize());
  // Fill with test data
  for (let i = 0; i < 30; i += 3) {
    rowData[i] = 255; // R
    rowData[i + 1] = 128; // G
    rowData[i + 2] = 64; // B
  }

  const processed = processor.processRow(rowData, 0);
  console.log('Processed row:', processed ? processed.length : 0, 'bytes');
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: RGB to grayscale conversion
console.log('Task 3: RGB to Grayscale (In-Place)');
/**
 * Convert RGB pixels to grayscale in-place
 * Formula: Gray = 0.299*R + 0.587*G + 0.114*B
 * @param {Buffer} rgbData - RGB pixel data (3 bytes per pixel)
 * Modifies buffer in-place
 */
function convertToGrayscale(rgbData) {
  // TODO: Implement this function
  // Process every 3 bytes (R, G, B)
  // Calculate grayscale value
  // Set R = G = B = grayscale (in-place)
  // Your code here
}

// Test Task 3
try {
  const rgbData = Buffer.from([
    255, 0, 0,    // Red
    0, 255, 0,    // Green
    0, 0, 255,    // Blue
    128, 128, 128 // Gray
  ]);

  console.log('Before:', rgbData);
  convertToGrayscale(rgbData);
  console.log('After:', rgbData);
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Image buffer pool
console.log('Task 4: Image Buffer Pool');
/**
 * Specialized buffer pool for image processing
 */
class ImageBufferPool {
  constructor(rowSize, poolSize) {
    // TODO: Initialize pool for image row buffers
    // Your code here
  }

  acquireRow() {
    // TODO: Get buffer for one image row
    // Your code here
  }

  releaseRow(buffer) {
    // TODO: Return row buffer to pool
    // Your code here
  }

  acquireImage(rows) {
    // TODO: Acquire buffers for multiple rows
    // Return array of buffers
    // Your code here
  }

  releaseImage(buffers) {
    // TODO: Release all row buffers
    // Your code here
  }

  getUtilization() {
    // TODO: Return pool utilization percentage
    // Your code here
  }
}

// Test Task 4
try {
  const imgPool = new ImageBufferPool(100, 20);

  const row = imgPool.acquireRow();
  console.log('Acquired row buffer:', row ? row.length : 0, 'bytes');

  const imageBuffers = imgPool.acquireImage(5);
  console.log('Acquired image buffers:', imageBuffers ? imageBuffers.length : 0);

  imgPool.releaseRow(row);
  imgPool.releaseImage(imageBuffers);

  console.log('Pool utilization:', imgPool.getUtilization(), '%');
  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Streaming image transformer
console.log('Task 5: Streaming Image Transformer');
/**
 * Transform image data in a streaming fashion
 */
class StreamingImageTransformer {
  constructor(width, height, bytesPerPixel) {
    // TODO: Initialize transformer
    // Your code here
  }

  transform(inputChunk, transformFn) {
    // TODO: Apply transformation to chunk
    // Handle partial rows between chunks
    // Return transformed data
    // Your code here
  }

  flush() {
    // TODO: Process any remaining partial row
    // Your code here
  }
}

// Test Task 5
try {
  const transformer = new StreamingImageTransformer(10, 10, 3);

  const chunk1 = Buffer.alloc(50); // Partial rows
  const chunk2 = Buffer.alloc(50);

  const out1 = transformer.transform(chunk1, (pixel) => {
    // Invert colors
    return [255 - pixel[0], 255 - pixel[1], 255 - pixel[2]];
  });

  const out2 = transformer.transform(chunk2, (pixel) => pixel);

  console.log('Transformed chunks:', (out1 ? out1.length : 0) + (out2 ? out2.length : 0), 'bytes');
  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus: Image statistics calculator
console.log('Bonus: Image Statistics');
/**
 * Calculate statistics while streaming image data
 */
class ImageStatistics {
  constructor() {
    // TODO: Initialize statistics trackers
    // Your code here
  }

  addPixel(r, g, b) {
    // TODO: Update statistics with pixel
    // Track min, max, average per channel
    // Your code here
  }

  getStats() {
    // TODO: Return calculated statistics
    // { r: {min, max, avg}, g: {}, b: {}, totalPixels }
    // Your code here
  }
}

// Test Bonus
try {
  const stats = new ImageStatistics();

  stats.addPixel(255, 0, 0);
  stats.addPixel(0, 255, 0);
  stats.addPixel(0, 0, 255);
  stats.addPixel(128, 128, 128);

  console.log('Image stats:', stats.getStats());
  console.log('✓ Bonus implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 2 Complete ===');
console.log('');
console.log('💡 Tips:');
console.log('  • Process images row by row to save memory');
console.log('  • BMP rows are padded to 4-byte boundaries');
console.log('  • Use buffer pools for repeated allocations');
console.log('  • In-place transformations save memory');
console.log('  • Handle partial rows in streaming');
