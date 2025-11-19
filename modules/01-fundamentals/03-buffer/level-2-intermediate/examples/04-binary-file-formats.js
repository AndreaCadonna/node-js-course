/**
 * Example 4: Binary File Formats
 *
 * Demonstrates parsing and creating binary file formats
 * including BMP images and WAV audio files.
 */

const fs = require('fs');
const path = require('path');

console.log('=== Binary File Formats ===\n');

// 1. File signatures (magic numbers)
console.log('1. File Signatures (Magic Numbers)');

const signatures = {
  'PNG': Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  'JPEG': Buffer.from([0xFF, 0xD8, 0xFF]),
  'GIF': Buffer.from('GIF89a'),
  'PDF': Buffer.from('%PDF'),
  'ZIP': Buffer.from([0x50, 0x4B, 0x03, 0x04]),
  'BMP': Buffer.from('BM'),
  'WAV': Buffer.from('RIFF')
};

console.log('Common File Signatures:');
Object.entries(signatures).forEach(([type, sig]) => {
  const hex = sig.toString('hex');
  const ascii = sig.toString('ascii').replace(/[^\x20-\x7E]/g, '.');
  console.log(`  ${type.padEnd(6)}: ${hex.padEnd(20)} ("${ascii}")`);
});
console.log('');

// 2. BMP file format
console.log('2. BMP File Format');

/**
 * Create a simple BMP image file
 * BMP format (simplified):
 * - File header (14 bytes)
 * - DIB header (40 bytes)
 * - Pixel data (width × height × 3 bytes for 24-bit RGB)
 */
function createBMP(width, height, fillColor = { r: 255, g: 0, b: 0 }) {
  // Calculate sizes
  const rowSize = Math.floor((24 * width + 31) / 32) * 4; // Row must be multiple of 4
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;

  const buf = Buffer.alloc(fileSize);
  let offset = 0;

  // === BMP File Header (14 bytes) ===
  buf.write('BM', offset, 2, 'ascii'); // Signature
  offset += 2;

  buf.writeUInt32LE(fileSize, offset); // File size
  offset += 4;

  buf.writeUInt32LE(0, offset); // Reserved
  offset += 4;

  buf.writeUInt32LE(54, offset); // Pixel data offset
  offset += 4;

  // === DIB Header (BITMAPINFOHEADER, 40 bytes) ===
  buf.writeUInt32LE(40, offset); // DIB header size
  offset += 4;

  buf.writeInt32LE(width, offset); // Image width
  offset += 4;

  buf.writeInt32LE(height, offset); // Image height
  offset += 4;

  buf.writeUInt16LE(1, offset); // Color planes
  offset += 2;

  buf.writeUInt16LE(24, offset); // Bits per pixel (24 = RGB)
  offset += 2;

  buf.writeUInt32LE(0, offset); // Compression (0 = none)
  offset += 4;

  buf.writeUInt32LE(pixelDataSize, offset); // Image size
  offset += 4;

  buf.writeInt32LE(2835, offset); // Horizontal resolution (pixels/meter)
  offset += 4;

  buf.writeInt32LE(2835, offset); // Vertical resolution
  offset += 4;

  buf.writeUInt32LE(0, offset); // Colors in palette
  offset += 4;

  buf.writeUInt32LE(0, offset); // Important colors
  offset += 4;

  // === Pixel Data ===
  // BMP stores pixels bottom-to-top, left-to-right
  // Each pixel is BGR (not RGB!)
  const padding = rowSize - (width * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      buf.writeUInt8(fillColor.b, offset++); // Blue
      buf.writeUInt8(fillColor.g, offset++); // Green
      buf.writeUInt8(fillColor.r, offset++); // Red
    }
    // Row padding
    for (let p = 0; p < padding; p++) {
      buf.writeUInt8(0, offset++);
    }
  }

  return buf;
}

function parseBMP(buffer) {
  let offset = 0;

  // File header
  const signature = buffer.toString('ascii', offset, offset + 2);
  offset += 2;

  const fileSize = buffer.readUInt32LE(offset);
  offset += 4;

  offset += 4; // Skip reserved

  const pixelDataOffset = buffer.readUInt32LE(offset);
  offset += 4;

  // DIB header
  const dibHeaderSize = buffer.readUInt32LE(offset);
  offset += 4;

  const width = buffer.readInt32LE(offset);
  offset += 4;

  const height = buffer.readInt32LE(offset);
  offset += 4;

  const colorPlanes = buffer.readUInt16LE(offset);
  offset += 2;

  const bitsPerPixel = buffer.readUInt16LE(offset);
  offset += 2;

  const compression = buffer.readUInt32LE(offset);
  offset += 4;

  return {
    signature,
    fileSize,
    pixelDataOffset,
    dibHeaderSize,
    width,
    height,
    colorPlanes,
    bitsPerPixel,
    compression
  };
}

const bmpData = createBMP(100, 100, { r: 0, g: 128, b: 255 });
const bmpInfo = parseBMP(bmpData);

console.log('Created BMP file:');
console.log('  Signature:', bmpInfo.signature);
console.log('  File size:', bmpInfo.fileSize, 'bytes');
console.log('  Dimensions:', bmpInfo.width, '×', bmpInfo.height);
console.log('  Bits per pixel:', bmpInfo.bitsPerPixel);
console.log('  Total size:', bmpData.length, 'bytes');
console.log('');

// 3. WAV file format
console.log('3. WAV File Format');

/**
 * Create a simple WAV audio file
 * WAV format:
 * - RIFF header
 * - fmt chunk
 * - data chunk
 */
function createWAV(sampleRate, duration, frequency) {
  const numChannels = 1; // Mono
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * numChannels * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buf = Buffer.alloc(fileSize);
  let offset = 0;

  // === RIFF Header (12 bytes) ===
  buf.write('RIFF', offset, 4, 'ascii');
  offset += 4;

  buf.writeUInt32LE(fileSize - 8, offset); // File size - 8
  offset += 4;

  buf.write('WAVE', offset, 4, 'ascii');
  offset += 4;

  // === fmt Chunk (24 bytes) ===
  buf.write('fmt ', offset, 4, 'ascii');
  offset += 4;

  buf.writeUInt32LE(16, offset); // fmt chunk size
  offset += 4;

  buf.writeUInt16LE(1, offset); // Audio format (1 = PCM)
  offset += 2;

  buf.writeUInt16LE(numChannels, offset);
  offset += 2;

  buf.writeUInt32LE(sampleRate, offset);
  offset += 4;

  const byteRate = sampleRate * numChannels * bytesPerSample;
  buf.writeUInt32LE(byteRate, offset);
  offset += 4;

  const blockAlign = numChannels * bytesPerSample;
  buf.writeUInt16LE(blockAlign, offset);
  offset += 2;

  buf.writeUInt16LE(bitsPerSample, offset);
  offset += 2;

  // === data Chunk ===
  buf.write('data', offset, 4, 'ascii');
  offset += 4;

  buf.writeUInt32LE(dataSize, offset);
  offset += 4;

  // Generate sine wave
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const value = Math.sin(2 * Math.PI * frequency * t);
    const sample = Math.floor(value * 32767);
    buf.writeInt16LE(sample, offset);
    offset += 2;
  }

  return buf;
}

function parseWAV(buffer) {
  let offset = 0;

  // RIFF header
  const riffId = buffer.toString('ascii', offset, offset + 4);
  offset += 4;

  const fileSize = buffer.readUInt32LE(offset);
  offset += 4;

  const waveId = buffer.toString('ascii', offset, offset + 4);
  offset += 4;

  // fmt chunk
  const fmtId = buffer.toString('ascii', offset, offset + 4);
  offset += 4;

  const fmtSize = buffer.readUInt32LE(offset);
  offset += 4;

  const audioFormat = buffer.readUInt16LE(offset);
  offset += 2;

  const numChannels = buffer.readUInt16LE(offset);
  offset += 2;

  const sampleRate = buffer.readUInt32LE(offset);
  offset += 4;

  const byteRate = buffer.readUInt32LE(offset);
  offset += 4;

  const blockAlign = buffer.readUInt16LE(offset);
  offset += 2;

  const bitsPerSample = buffer.readUInt16LE(offset);
  offset += 2;

  // data chunk
  const dataId = buffer.toString('ascii', offset, offset + 4);
  offset += 4;

  const dataSize = buffer.readUInt32LE(offset);
  offset += 4;

  return {
    riffId,
    waveId,
    fileSize: fileSize + 8,
    audioFormat,
    numChannels,
    sampleRate,
    byteRate,
    blockAlign,
    bitsPerSample,
    dataSize,
    duration: dataSize / byteRate
  };
}

const wavData = createWAV(44100, 0.1, 440); // 100ms, 440Hz (A note)
const wavInfo = parseWAV(wavData);

console.log('Created WAV file:');
console.log('  Format:', wavInfo.riffId, wavInfo.waveId);
console.log('  Sample rate:', wavInfo.sampleRate, 'Hz');
console.log('  Channels:', wavInfo.numChannels);
console.log('  Bits per sample:', wavInfo.bitsPerSample);
console.log('  Duration:', wavInfo.duration.toFixed(3), 'seconds');
console.log('  Total size:', wavData.length, 'bytes');
console.log('');

// 4. Custom binary file format
console.log('4. Custom Binary File Format');

/**
 * Create a custom data file format
 * Format:
 * - Magic: 'MYDB' (4 bytes)
 * - Version: uint16 (2 bytes)
 * - Record count: uint32 (4 bytes)
 * - Records: variable length
 *   - ID: uint32 (4 bytes)
 *   - Name length: uint8 (1 byte)
 *   - Name: string (variable)
 *   - Score: float (4 bytes)
 */
function createCustomDB(records) {
  // Calculate total size
  let dataSize = 10; // Header
  records.forEach(r => {
    dataSize += 4 + 1 + Buffer.byteLength(r.name, 'utf8') + 4;
  });

  const buf = Buffer.alloc(dataSize);
  let offset = 0;

  // Header
  buf.write('MYDB', offset, 4, 'ascii');
  offset += 4;

  buf.writeUInt16LE(1, offset); // Version
  offset += 2;

  buf.writeUInt32LE(records.length, offset);
  offset += 4;

  // Records
  records.forEach(record => {
    buf.writeUInt32LE(record.id, offset);
    offset += 4;

    const nameBytes = Buffer.from(record.name, 'utf8');
    buf.writeUInt8(nameBytes.length, offset);
    offset += 1;

    nameBytes.copy(buf, offset);
    offset += nameBytes.length;

    buf.writeFloatLE(record.score, offset);
    offset += 4;
  });

  return buf;
}

function parseCustomDB(buffer) {
  let offset = 0;

  // Header
  const magic = buffer.toString('ascii', offset, offset + 4);
  offset += 4;

  const version = buffer.readUInt16LE(offset);
  offset += 2;

  const recordCount = buffer.readUInt32LE(offset);
  offset += 4;

  // Records
  const records = [];
  for (let i = 0; i < recordCount; i++) {
    const id = buffer.readUInt32LE(offset);
    offset += 4;

    const nameLength = buffer.readUInt8(offset);
    offset += 1;

    const name = buffer.toString('utf8', offset, offset + nameLength);
    offset += nameLength;

    const score = buffer.readFloatLE(offset);
    offset += 4;

    records.push({ id, name, score });
  }

  return { magic, version, recordCount, records };
}

const dbRecords = [
  { id: 1, name: 'Alice', score: 95.5 },
  { id: 2, name: 'Bob', score: 87.3 },
  { id: 3, name: 'Charlie', score: 92.1 }
];

const dbData = createCustomDB(dbRecords);
const dbParsed = parseCustomDB(dbData);

console.log('Custom database format:');
console.log('  Magic:', dbParsed.magic);
console.log('  Version:', dbParsed.version);
console.log('  Records:', dbParsed.recordCount);
dbParsed.records.forEach(r => {
  console.log(`    ${r.id}: ${r.name} → ${r.score}`);
});
console.log('  Total size:', dbData.length, 'bytes');
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ File signatures identify file types');
console.log('✓ Binary formats are space-efficient');
console.log('✓ Little-endian common in file formats');
console.log('✓ Headers contain metadata and structure info');
console.log('✓ Variable-length data needs length prefixes');
console.log('✓ Always document your binary format!');
