/**
 * Example 6: Platform Constants
 *
 * This example demonstrates platform-specific constants
 * like line endings (EOL) and endianness.
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

console.log('=== Platform Constants ===\n');

// Line ending constant
const eol = os.EOL;
console.log('End of Line (EOL):', JSON.stringify(eol));
console.log('EOL Length:', eol.length, 'character(s)');
console.log('EOL Hex:', Buffer.from(eol).toString('hex'));

// Endianness
const endianness = os.endianness();
console.log('\nEndianness:', endianness);
console.log('Full name:', endianness === 'LE' ? 'Little-Endian' : 'Big-Endian');

console.log('\n=== Line Ending Details ===\n');

// Explain line endings for different platforms
console.log('Platform:', os.platform());
switch (os.platform()) {
  case 'win32':
    console.log('Windows uses CRLF (\\r\\n) - 2 characters');
    console.log('Carriage Return (CR) + Line Feed (LF)');
    break;
  case 'darwin':
  case 'linux':
    console.log('Unix/Linux/Mac uses LF (\\n) - 1 character');
    console.log('Line Feed (LF) only');
    break;
  default:
    console.log('Unknown platform, check EOL value');
}

console.log('\n=== Using EOL in Files ===\n');

// Create text with platform-appropriate line endings
const lines = [
  'First line',
  'Second line',
  'Third line'
];

const textWithEOL = lines.join(os.EOL);
console.log('Text with platform EOL:');
console.log(textWithEOL);

// Write to file with proper line endings
const tempFile = path.join(os.tmpdir(), 'test-eol.txt');
fs.writeFileSync(tempFile, textWithEOL);
console.log('\nWritten to:', tempFile);

// Read and display
const content = fs.readFileSync(tempFile, 'utf8');
console.log('File content:', JSON.stringify(content));

// Clean up
fs.unlinkSync(tempFile);
console.log('Temp file deleted');

console.log('\n=== Endianness Explanation ===\n');

// Explain endianness
console.log('Endianness determines byte order in multi-byte values');
console.log('Current system:', endianness);

if (endianness === 'LE') {
  console.log('\nLittle-Endian (LE):');
  console.log('- Least significant byte stored first');
  console.log('- Common on Intel/AMD x86, ARM processors');
  console.log('- Example: 0x12345678 stored as [78, 56, 34, 12]');
} else {
  console.log('\nBig-Endian (BE):');
  console.log('- Most significant byte stored first');
  console.log('- Used in network protocols, some older systems');
  console.log('- Example: 0x12345678 stored as [12, 34, 56, 78]');
}

console.log('\n=== Endianness Demonstration ===\n');

// Demonstrate endianness with buffer
const buffer = Buffer.alloc(4);
const value = 0x12345678;

// Write as little-endian
buffer.writeUInt32LE(value, 0);
console.log('Value:', value.toString(16));
console.log('Little-Endian bytes:', Array.from(buffer).map(b => b.toString(16).padStart(2, '0')));

// Write as big-endian
buffer.writeUInt32BE(value, 0);
console.log('Big-Endian bytes:', Array.from(buffer).map(b => b.toString(16).padStart(2, '0')));

console.log('\n=== Cross-Platform Text Processing ===\n');

// Function to normalize line endings
function normalizeLineEndings(text, targetEOL = '\n') {
  // Replace all line ending variants with target
  return text.replace(/\r\n|\r|\n/g, targetEOL);
}

// Example text with mixed line endings
const mixedText = 'Line 1\r\nLine 2\rLine 3\nLine 4';
console.log('Original (mixed):', JSON.stringify(mixedText));

// Normalize to Unix
const unixText = normalizeLineEndings(mixedText, '\n');
console.log('Normalized to Unix:', JSON.stringify(unixText));

// Normalize to Windows
const windowsText = normalizeLineEndings(mixedText, '\r\n');
console.log('Normalized to Windows:', JSON.stringify(windowsText));

// Normalize to platform
const platformText = normalizeLineEndings(mixedText, os.EOL);
console.log('Normalized to platform:', JSON.stringify(platformText));

console.log('\n=== Platform Constants Summary ===\n');

const constants = {
  eol: {
    value: os.EOL,
    display: JSON.stringify(os.EOL),
    length: os.EOL.length,
    hex: Buffer.from(os.EOL).toString('hex'),
    type: os.EOL === '\r\n' ? 'CRLF (Windows)' : 'LF (Unix)'
  },
  endianness: {
    value: os.endianness(),
    fullName: os.endianness() === 'LE' ? 'Little-Endian' : 'Big-Endian',
    description: os.endianness() === 'LE'
      ? 'Least significant byte first (Intel/AMD, ARM)'
      : 'Most significant byte first (Network byte order)'
  },
  platform: os.platform()
};

console.log('Platform Constants:');
console.log(JSON.stringify(constants, null, 2));
