/**
 * Exercise 1: WAV File Parser
 *
 * Practice parsing binary file formats by implementing
 * a complete WAV audio file header parser and validator.
 */

console.log('=== Exercise 1: WAV File Parser ===\n');

// Task 1: Parse RIFF header
console.log('Task 1: Parse RIFF Header');
/**
 * Parse the RIFF header from a WAV file
 * RIFF header structure:
 * - ChunkID: 'RIFF' (4 bytes, ASCII)
 * - ChunkSize: file size - 8 (4 bytes, LE)
 * - Format: 'WAVE' (4 bytes, ASCII)
 *
 * @param {Buffer} buffer - WAV file buffer
 * @returns {Object} { chunkId, chunkSize, format }
 */
function parseRIFFHeader(buffer) {
  // TODO: Implement this function
  // Your code here
}

// Test Task 1
try {
  const testWAV = Buffer.alloc(100);
  testWAV.write('RIFF', 0, 'ascii');
  testWAV.writeUInt32LE(92, 4); // file size - 8
  testWAV.write('WAVE', 8, 'ascii');

  const riffHeader = parseRIFFHeader(testWAV);
  console.log('RIFF Header:', riffHeader);
  console.log('Expected: { chunkId: "RIFF", chunkSize: 92, format: "WAVE" }');
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Parse fmt chunk
console.log('Task 2: Parse fmt Chunk');
/**
 * Parse the fmt chunk from a WAV file
 * fmt chunk structure (starts at offset 12):
 * - SubchunkID: 'fmt ' (4 bytes, ASCII)
 * - SubchunkSize: 16 for PCM (4 bytes, LE)
 * - AudioFormat: 1 for PCM (2 bytes, LE)
 * - NumChannels: 1 = mono, 2 = stereo (2 bytes, LE)
 * - SampleRate: samples per second (4 bytes, LE)
 * - ByteRate: SampleRate × NumChannels × BitsPerSample/8 (4 bytes, LE)
 * - BlockAlign: NumChannels × BitsPerSample/8 (2 bytes, LE)
 * - BitsPerSample: 8, 16, 24, etc. (2 bytes, LE)
 *
 * @param {Buffer} buffer - WAV file buffer
 * @param {number} offset - Offset where fmt chunk starts
 * @returns {Object} Format information
 */
function parseFmtChunk(buffer, offset = 12) {
  // TODO: Implement this function
  // Return: { subchunkId, subchunkSize, audioFormat, numChannels,
  //           sampleRate, byteRate, blockAlign, bitsPerSample }
  // Your code here
}

// Test Task 2
try {
  const testWAV2 = Buffer.alloc(100);
  let offset = 12;

  // fmt chunk
  testWAV2.write('fmt ', offset, 'ascii');
  offset += 4;
  testWAV2.writeUInt32LE(16, offset); // PCM
  offset += 4;
  testWAV2.writeUInt16LE(1, offset); // PCM format
  offset += 2;
  testWAV2.writeUInt16LE(2, offset); // Stereo
  offset += 2;
  testWAV2.writeUInt32LE(44100, offset); // 44.1kHz
  offset += 4;
  testWAV2.writeUInt32LE(176400, offset); // Byte rate
  offset += 4;
  testWAV2.writeUInt16LE(4, offset); // Block align
  offset += 2;
  testWAV2.writeUInt16LE(16, offset); // 16-bit
  offset += 2;

  const fmtChunk = parseFmtChunk(testWAV2, 12);
  console.log('fmt Chunk:', fmtChunk);
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Parse data chunk header
console.log('Task 3: Parse data Chunk Header');
/**
 * Parse the data chunk header
 * data chunk structure:
 * - SubchunkID: 'data' (4 bytes, ASCII)
 * - SubchunkSize: number of bytes in data (4 bytes, LE)
 *
 * @param {Buffer} buffer - WAV file buffer
 * @param {number} offset - Offset where data chunk starts (typically 36)
 * @returns {Object} { subchunkId, dataSize }
 */
function parseDataChunk(buffer, offset = 36) {
  // TODO: Implement this function
  // Your code here
}

// Test Task 3
try {
  const testWAV3 = Buffer.alloc(100);
  testWAV3.write('data', 36, 'ascii');
  testWAV3.writeUInt32LE(8000, 40);

  const dataChunk = parseDataChunk(testWAV3, 36);
  console.log('data Chunk:', dataChunk);
  console.log('Expected: { subchunkId: "data", dataSize: 8000 }');
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Complete WAV parser
console.log('Task 4: Complete WAV Parser');
/**
 * Parse a complete WAV file and return all information
 * @param {Buffer} buffer - WAV file buffer
 * @returns {Object} Complete WAV file information
 */
function parseWAV(buffer) {
  // TODO: Implement this function
  // Use the functions from Tasks 1-3
  // Calculate duration: dataSize / byteRate
  // Your code here
}

// Test Task 4
try {
  // Create a minimal valid WAV file
  const wavBuf = Buffer.alloc(44);
  let pos = 0;

  // RIFF header
  wavBuf.write('RIFF', pos, 'ascii'); pos += 4;
  wavBuf.writeUInt32LE(36, pos); pos += 4;
  wavBuf.write('WAVE', pos, 'ascii'); pos += 4;

  // fmt chunk
  wavBuf.write('fmt ', pos, 'ascii'); pos += 4;
  wavBuf.writeUInt32LE(16, pos); pos += 4;
  wavBuf.writeUInt16LE(1, pos); pos += 2;
  wavBuf.writeUInt16LE(1, pos); pos += 2; // Mono
  wavBuf.writeUInt32LE(44100, pos); pos += 4;
  wavBuf.writeUInt32LE(88200, pos); pos += 4;
  wavBuf.writeUInt16LE(2, pos); pos += 2;
  wavBuf.writeUInt16LE(16, pos); pos += 2;

  // data chunk
  wavBuf.write('data', pos, 'ascii'); pos += 4;
  wavBuf.writeUInt32LE(0, pos); pos += 4;

  const wavInfo = parseWAV(wavBuf);
  console.log('Complete WAV info:', wavInfo);
  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Validate WAV file
console.log('Task 5: WAV File Validator');
/**
 * Validate a WAV file buffer
 * Check:
 * - Valid RIFF signature
 * - Valid WAVE format
 * - Valid fmt chunk
 * - Valid audio format (PCM = 1)
 * - Reasonable sample rate (e.g., 8000-192000 Hz)
 * - Valid bits per sample (8, 16, 24, or 32)
 *
 * @param {Buffer} buffer - WAV file buffer
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateWAV(buffer) {
  // TODO: Implement this function
  // Return an object with validation results
  // Your code here
}

// Test Task 5
try {
  const validWAV = Buffer.alloc(44);
  let p = 0;
  validWAV.write('RIFF', p, 'ascii'); p += 4;
  validWAV.writeUInt32LE(36, p); p += 4;
  validWAV.write('WAVE', p, 'ascii'); p += 4;
  validWAV.write('fmt ', p, 'ascii'); p += 4;
  validWAV.writeUInt32LE(16, p); p += 4;
  validWAV.writeUInt16LE(1, p); p += 2;
  validWAV.writeUInt16LE(2, p); p += 2;
  validWAV.writeUInt32LE(44100, p); p += 4;
  validWAV.writeUInt32LE(176400, p); p += 4;
  validWAV.writeUInt16LE(4, p); p += 2;
  validWAV.writeUInt16LE(16, p); p += 2;
  validWAV.write('data', p, 'ascii'); p += 4;
  validWAV.writeUInt32LE(0, p);

  const result = validateWAV(validWAV);
  console.log('Validation result:', result);

  // Test with invalid file
  const invalidWAV = Buffer.from('Not a WAV file');
  const invalidResult = validateWAV(invalidWAV);
  console.log('Invalid WAV result:', invalidResult);

  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge: Calculate audio duration
console.log('Bonus Challenge: Audio Duration Calculator');
/**
 * Calculate the duration of audio in seconds
 * @param {Object} wavInfo - Parsed WAV information
 * @returns {number} Duration in seconds
 */
function calculateDuration(wavInfo) {
  // TODO: Implement this function
  // Duration = dataSize / byteRate
  // Your code here
}

// Test Bonus
try {
  const bonusInfo = {
    sampleRate: 44100,
    numChannels: 2,
    bitsPerSample: 16,
    byteRate: 176400,
    dataSize: 176400 // Should be 1 second
  };

  const duration = calculateDuration(bonusInfo);
  console.log('Duration:', duration, 'seconds');
  console.log('Expected: 1 second');
  console.log('✓ Bonus implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 1 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
console.log('');
console.log('💡 Tips:');
console.log('  • WAV files use little-endian byte order');
console.log('  • RIFF chunk IDs are ASCII strings');
console.log('  • Always check buffer bounds before reading');
console.log('  • ByteRate = SampleRate × NumChannels × BitsPerSample / 8');
