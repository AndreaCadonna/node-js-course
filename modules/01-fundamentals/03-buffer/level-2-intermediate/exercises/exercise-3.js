/**
 * Exercise 3: TypedArray Converter
 *
 * Practice working with TypedArrays by implementing
 * converters and utilities for different array types.
 */

console.log('=== Exercise 3: TypedArray Converter ===\n');

// Task 1: Convert between TypedArray types
console.log('Task 1: TypedArray Type Converter');
/**
 * Convert data from one TypedArray type to another
 * Handle potential data loss (e.g., float to int, larger to smaller)
 *
 * @param {TypedArray} sourceArray - Source typed array
 * @param {Function} TargetType - Target TypedArray constructor
 * @returns {TypedArray} Converted array
 */
function convertArrayType(sourceArray, TargetType) {
  // TODO: Implement this function
  // Handle overflow/underflow appropriately
  // Your code here
}

// Test Task 1
try {
  const float32 = new Float32Array([1.7, 2.3, 3.9, -4.2]);
  const int16 = convertArrayType(float32, Int16Array);

  console.log('Float32:', float32);
  console.log('→ Int16:', int16);

  const uint8 = new Uint8Array([100, 200, 255]);
  const int32 = convertArrayType(uint8, Int32Array);

  console.log('Uint8:', uint8);
  console.log('→ Int32:', int32);

  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Normalize audio samples
console.log('Task 2: Normalize Audio Samples');
/**
 * Normalize audio samples to a specific range
 * Convert between different bit depths (e.g., 16-bit to 32-bit float)
 *
 * @param {Int16Array|Int32Array} samples - Integer audio samples
 * @returns {Float32Array} Normalized samples (-1.0 to 1.0)
 */
function normalizeAudioSamples(samples) {
  // TODO: Implement this function
  // Int16: divide by 32768
  // Int32: divide by 2147483648
  // Your code here
}

function denormalizeAudioSamples(samples, targetType) {
  // TODO: Implement this function
  // Float32 → Int16: multiply by 32767
  // Float32 → Int32: multiply by 2147483647
  // Your code here
}

// Test Task 2
try {
  const int16Samples = new Int16Array([0, 16384, 32767, -16384, -32768]);
  const normalized = normalizeAudioSamples(int16Samples);

  console.log('Int16 samples:', int16Samples);
  console.log('Normalized:', normalized);

  const denormalized = denormalizeAudioSamples(normalized, Int16Array);
  console.log('Denormalized:', denormalized);

  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Interleave/deinterleave audio channels
console.log('Task 3: Interleave Audio Channels');
/**
 * Interleave multiple audio channels into a single array
 * Example: [L1, L2, L3], [R1, R2, R3] → [L1, R1, L2, R2, L3, R3]
 *
 * @param {Float32Array[]} channels - Array of channel data
 * @returns {Float32Array} Interleaved data
 */
function interleaveChannels(channels) {
  // TODO: Implement this function
  // Your code here
}

/**
 * Deinterleave audio data into separate channels
 * @param {Float32Array} interleaved - Interleaved audio data
 * @param {number} numChannels - Number of channels
 * @returns {Float32Array[]} Array of separated channels
 */
function deinterleaveChannels(interleaved, numChannels) {
  // TODO: Implement this function
  // Your code here
}

// Test Task 3
try {
  const leftChannel = new Float32Array([0.1, 0.2, 0.3]);
  const rightChannel = new Float32Array([0.4, 0.5, 0.6]);

  const interleaved = interleaveChannels([leftChannel, rightChannel]);
  console.log('Interleaved:', interleaved);
  console.log('Expected: [0.1, 0.4, 0.2, 0.5, 0.3, 0.6]');

  const separated = deinterleaveChannels(interleaved, 2);
  console.log('Deinterleaved:');
  console.log('  Left:', separated[0]);
  console.log('  Right:', separated[1]);

  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Image data manipulation
console.log('Task 4: Image Pixel Data Converter');
/**
 * Convert RGBA image data to grayscale
 * Use standard luminance formula: Y = 0.299*R + 0.587*G + 0.114*B
 *
 * @param {Uint8ClampedArray} rgba - RGBA pixel data (4 bytes per pixel)
 * @returns {Uint8ClampedArray} Grayscale RGBA (R=G=B)
 */
function rgbaToGrayscale(rgba) {
  // TODO: Implement this function
  // Keep alpha channel unchanged
  // Your code here
}

/**
 * Extract a single color channel from RGBA data
 * @param {Uint8ClampedArray} rgba - RGBA pixel data
 * @param {string} channel - 'r', 'g', 'b', or 'a'
 * @returns {Uint8Array} Single channel data
 */
function extractChannel(rgba, channel) {
  // TODO: Implement this function
  // Your code here
}

// Test Task 4
try {
  // 2x2 image (16 bytes = 4 pixels × 4 bytes)
  const rgbaData = new Uint8ClampedArray([
    255, 0, 0, 255,    // Red pixel
    0, 255, 0, 255,    // Green pixel
    0, 0, 255, 255,    // Blue pixel
    128, 128, 128, 255 // Gray pixel
  ]);

  const grayscale = rgbaToGrayscale(rgbaData);
  console.log('Original RGBA (first pixel):', rgbaData.slice(0, 4));
  console.log('Grayscale (first pixel):', grayscale.slice(0, 4));

  const redChannel = extractChannel(rgbaData, 'r');
  console.log('Red channel:', redChannel);

  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Buffer and TypedArray views
console.log('Task 5: Create Multiple Views on Same Data');
/**
 * Create a class that provides multiple TypedArray views
 * on the same underlying ArrayBuffer
 */
class MultiViewBuffer {
  constructor(sizeInBytes) {
    // TODO: Initialize ArrayBuffer and create views
    // Create: uint8, uint16, uint32, int32, float32, float64 views
    // Your code here
  }

  writeUint8(index, value) {
    // TODO: Write to uint8 view
    // Your code here
  }

  writeFloat32(index, value) {
    // TODO: Write to float32 view
    // Your code here
  }

  readAsUint32(byteOffset) {
    // TODO: Read 4 bytes as uint32 starting at byteOffset
    // Remember to handle alignment
    // Your code here
  }

  readAsFloat64(byteOffset) {
    // TODO: Read 8 bytes as float64 starting at byteOffset
    // Your code here
  }

  getRawBytes() {
    // TODO: Return Uint8Array view of all data
    // Your code here
  }
}

// Test Task 5
try {
  const multiView = new MultiViewBuffer(16);

  multiView.writeFloat32(0, 3.14159);
  multiView.writeUint8(0, 0xFF);

  console.log('Raw bytes:', multiView.getRawBytes());
  console.log('As uint32:', multiView.readAsUint32(0));

  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge 1: Efficient array operations
console.log('Bonus Challenge 1: Efficient Array Operations');
/**
 * Implement efficient operations using TypedArrays
 */

function vectorAdd(a, b) {
  // TODO: Add two Float32Arrays element-wise
  // Your code here
}

function vectorMultiply(a, scalar) {
  // TODO: Multiply Float32Array by scalar
  // Your code here
}

function dotProduct(a, b) {
  // TODO: Calculate dot product of two Float32Arrays
  // Your code here
}

// Test Bonus 1
try {
  const vec1 = new Float32Array([1, 2, 3, 4]);
  const vec2 = new Float32Array([5, 6, 7, 8]);

  const sum = vectorAdd(vec1, vec2);
  console.log('Vector add:', sum);

  const scaled = vectorMultiply(vec1, 2);
  console.log('Vector multiply:', scaled);

  const dot = dotProduct(vec1, vec2);
  console.log('Dot product:', dot);

  console.log('✓ Bonus 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge 2: Endianness converter
console.log('Bonus Challenge 2: Endianness Converter');
/**
 * Convert endianness of typed array data
 */
class EndiannessConverter {
  static swap16(uint16Array) {
    // TODO: Swap bytes in 16-bit array
    // [0x1234] → [0x3412]
    // Your code here
  }

  static swap32(uint32Array) {
    // TODO: Swap bytes in 32-bit array
    // [0x12345678] → [0x78563412]
    // Your code here
  }

  static convertBuffer(buffer, bytesPerElement) {
    // TODO: Convert buffer between endianness
    // Handle 2, 4, or 8 byte elements
    // Your code here
  }
}

// Test Bonus 2
try {
  const test16 = new Uint16Array([0x1234, 0x5678]);
  const swapped16 = EndiannessConverter.swap16(test16);
  console.log('Original 16-bit:', test16.map(n => '0x' + n.toString(16)));
  console.log('Swapped 16-bit:', swapped16.map(n => '0x' + n.toString(16)));

  console.log('✓ Bonus 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 3 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
console.log('');
console.log('💡 Tips:');
console.log('  • TypedArrays share underlying ArrayBuffer');
console.log('  • Uint8ClampedArray clamps instead of wrapping');
console.log('  • Consider alignment when creating views');
console.log('  • Float32 has ~7 decimal digits precision');
console.log('  • Float64 has ~15 decimal digits precision');
