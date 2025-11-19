/**
 * Example 3: TypedArrays and ArrayBuffer
 *
 * Demonstrates the relationship between Buffer, TypedArrays,
 * and ArrayBuffer, and when to use each.
 */

console.log('=== TypedArrays and ArrayBuffer ===\n');

// 1. Understanding the relationship
console.log('1. Buffer, ArrayBuffer, and TypedArray Relationship');

// Node.js Buffer
const nodeBuf = Buffer.from([1, 2, 3, 4, 5]);
console.log('Node Buffer:', nodeBuf);
console.log('Type:', nodeBuf.constructor.name);
console.log('');

// ArrayBuffer - raw binary data container
const arrayBuf = new ArrayBuffer(8);
console.log('ArrayBuffer:', arrayBuf);
console.log('Byte length:', arrayBuf.byteLength);
console.log('⚠️  ArrayBuffer is not directly readable!');
console.log('');

// TypedArray - view into ArrayBuffer
const uint8View = new Uint8Array(arrayBuf);
uint8View[0] = 255;
uint8View[1] = 128;
console.log('Uint8Array view:', uint8View);
console.log('Can read/write:', uint8View[0]);
console.log('');

// 2. Buffer and ArrayBuffer interoperability
console.log('2. Buffer ↔ ArrayBuffer Conversion');

// Buffer to ArrayBuffer
const buf1 = Buffer.from([10, 20, 30, 40]);
const ab1 = buf1.buffer.slice(buf1.byteOffset, buf1.byteOffset + buf1.byteLength);
console.log('Buffer:', buf1);
console.log('→ ArrayBuffer:', ab1);
console.log('');

// ArrayBuffer to Buffer
const ab2 = new ArrayBuffer(4);
const view = new Uint8Array(ab2);
view.set([50, 60, 70, 80]);
const buf2 = Buffer.from(ab2);
console.log('ArrayBuffer:', ab2);
console.log('→ Buffer:', buf2);
console.log('');

// 3. Multiple views on same data
console.log('3. Multiple TypedArray Views on Same Buffer');

const sharedBuf = Buffer.alloc(16);

// Create different views
const uint8 = new Uint8Array(sharedBuf.buffer, sharedBuf.byteOffset, sharedBuf.length);
const uint16 = new Uint16Array(sharedBuf.buffer, sharedBuf.byteOffset, sharedBuf.length / 2);
const uint32 = new Uint32Array(sharedBuf.buffer, sharedBuf.byteOffset, sharedBuf.length / 4);
const float32 = new Float32Array(sharedBuf.buffer, sharedBuf.byteOffset, sharedBuf.length / 4);

// Write using uint8 view
uint8[0] = 0xFF;
uint8[1] = 0xFF;
uint8[2] = 0xFF;
uint8[3] = 0xFF;

console.log('After writing 0xFF to first 4 bytes:');
console.log('Uint8Array:', Array.from(uint8.slice(0, 4)));
console.log('Uint16Array:', uint16[0], '→ 0x' + uint16[0].toString(16));
console.log('Uint32Array:', uint32[0], '→ 0x' + uint32[0].toString(16));
console.log('');

// Write using float32 view
float32[1] = 3.14159;
console.log('After writing 3.14159 as float at index 1:');
console.log('Float32Array:', float32[1]);
console.log('Raw bytes:', Array.from(uint8.slice(4, 8)));
console.log('');

// 4. TypedArray types
console.log('4. All TypedArray Types');

const typedBuf = new ArrayBuffer(32);
const examples = {
  'Int8Array': new Int8Array(typedBuf, 0, 4),
  'Uint8Array': new Uint8Array(typedBuf, 0, 4),
  'Int16Array': new Int16Array(typedBuf, 0, 4),
  'Uint16Array': new Uint16Array(typedBuf, 0, 4),
  'Int32Array': new Int32Array(typedBuf, 0, 4),
  'Uint32Array': new Uint32Array(typedBuf, 0, 4),
  'Float32Array': new Float32Array(typedBuf, 0, 4),
  'Float64Array': new Float64Array(typedBuf, 0, 4),
  'BigInt64Array': new BigInt64Array(typedBuf, 0, 4),
  'BigUint64Array': new BigUint64Array(typedBuf, 0, 4)
};

console.log('TypedArray Types:');
Object.entries(examples).forEach(([name, arr]) => {
  console.log(`  ${name.padEnd(20)}: ${arr.BYTES_PER_ELEMENT} bytes per element`);
});
console.log('');

// 5. Practical: Image data manipulation
console.log('5. Practical Example: Image Pixel Manipulation');

// Simulate 4x4 RGBA image (16 pixels × 4 bytes = 64 bytes)
const imageData = Buffer.alloc(64);
const pixels = new Uint8ClampedArray(imageData.buffer, imageData.byteOffset, imageData.length);

// Fill with red pixels
for (let i = 0; i < pixels.length; i += 4) {
  pixels[i] = 255;     // R
  pixels[i + 1] = 0;   // G
  pixels[i + 2] = 0;   // B
  pixels[i + 3] = 255; // A (alpha)
}

console.log('First pixel (RGBA):', [pixels[0], pixels[1], pixels[2], pixels[3]]);

// Invert colors
for (let i = 0; i < pixels.length; i += 4) {
  pixels[i] = 255 - pixels[i];         // R
  pixels[i + 1] = 255 - pixels[i + 1]; // G
  pixels[i + 2] = 255 - pixels[i + 2]; // B
  // Keep alpha unchanged
}

console.log('After invert (RGBA):', [pixels[0], pixels[1], pixels[2], pixels[3]]);
console.log('');

// 6. Practical: Audio sample processing
console.log('6. Practical Example: Audio Sample Processing');

// Simulate 1 second of audio at 44.1kHz (44,100 samples)
const sampleRate = 44100;
const duration = 0.1; // 100ms for demo
const numSamples = Math.floor(sampleRate * duration);

// 16-bit audio samples
const audioBuffer = Buffer.alloc(numSamples * 2);
const samples = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, numSamples);

// Generate 440 Hz sine wave (A note)
const frequency = 440;
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const value = Math.sin(2 * Math.PI * frequency * t);
  samples[i] = Math.floor(value * 32767); // Scale to 16-bit range
}

console.log('Generated', numSamples, 'audio samples');
console.log('First 10 samples:', Array.from(samples.slice(0, 10)));
console.log('');

// Apply volume (multiply all samples)
const volume = 0.5;
for (let i = 0; i < samples.length; i++) {
  samples[i] = Math.floor(samples[i] * volume);
}

console.log('After 50% volume reduction:');
console.log('First 10 samples:', Array.from(samples.slice(0, 10)));
console.log('');

// 7. Performance comparison
console.log('7. Performance Comparison');

const testSize = 1000000;
const perfBuf = Buffer.alloc(testSize * 4);
const perfTyped = new Uint32Array(perfBuf.buffer, perfBuf.byteOffset, testSize);

// Test 1: Buffer methods
console.time('Buffer.writeUInt32LE');
for (let i = 0; i < testSize; i++) {
  perfBuf.writeUInt32LE(i, i * 4);
}
console.timeEnd('Buffer.writeUInt32LE');

// Test 2: TypedArray
console.time('Uint32Array access');
for (let i = 0; i < testSize; i++) {
  perfTyped[i] = i;
}
console.timeEnd('Uint32Array access');

console.log('⚠️  TypedArray is typically faster for bulk operations!');
console.log('');

// 8. Uint8ClampedArray special behavior
console.log('8. Uint8ClampedArray (Clamping Behavior)');

const regular = new Uint8Array(4);
const clamped = new Uint8ClampedArray(4);

// Try to set values outside 0-255 range
regular[0] = 256;  // Wraps to 0
clamped[0] = 256;  // Clamps to 255

regular[1] = -1;   // Wraps to 255
clamped[1] = -1;   // Clamps to 0

regular[2] = 127.9; // Truncates to 127
clamped[2] = 127.9; // Rounds to 128

console.log('Uint8Array (wraps):', Array.from(regular));
console.log('Uint8ClampedArray (clamps):', Array.from(clamped));
console.log('');

// 9. DataView - explicit endianness control
console.log('9. DataView - Explicit Endianness Control');

const dvBuf = new ArrayBuffer(8);
const dataView = new DataView(dvBuf);

// Write with explicit endianness
dataView.setUint32(0, 0x12345678, true);  // little-endian
dataView.setUint32(4, 0x12345678, false); // big-endian

const bytes = new Uint8Array(dvBuf);
console.log('DataView with mixed endianness:');
console.log('LE bytes:', Array.from(bytes.slice(0, 4)));
console.log('BE bytes:', Array.from(bytes.slice(4, 8)));
console.log('');

// Read back
console.log('Read as LE:', '0x' + dataView.getUint32(0, true).toString(16));
console.log('Read as BE:', '0x' + dataView.getUint32(4, false).toString(16));
console.log('');

// 10. When to use what
console.log('10. When to Use Each');

const usage = {
  'Buffer': [
    'Node.js file I/O',
    'Network operations',
    'Streams',
    'When you need Node.js-specific methods'
  ],
  'TypedArray': [
    'High-performance numeric operations',
    'WebGL, Canvas',
    'Audio/video processing',
    'Mathematical computations'
  ],
  'DataView': [
    'Mixed endianness data',
    'Complex binary protocols',
    'When you need explicit byte order control'
  ]
};

Object.entries(usage).forEach(([type, uses]) => {
  console.log(`Use ${type} for:`);
  uses.forEach(use => console.log(`  • ${use}`));
  console.log('');
});

// Summary
console.log('=== Summary ===');
console.log('✓ Buffer is Node.js-specific, built on ArrayBuffer');
console.log('✓ TypedArray provides typed views into binary data');
console.log('✓ Multiple views can share same underlying memory');
console.log('✓ TypedArray is faster for bulk numeric operations');
console.log('✓ DataView gives explicit endianness control');
console.log('✓ Uint8ClampedArray clamps instead of wrapping');
console.log('⚠️  Changes in one view affect all views!');
