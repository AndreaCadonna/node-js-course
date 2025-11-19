# Guide 6: Platform Constants

Understanding platform-specific constants like EOL and endianness.

## Table of Contents
- [End of Line (EOL)](#end-of-line-eol)
- [Endianness](#endianness)
- [Cross-Platform Compatibility](#cross-platform-compatibility)
- [Best Practices](#best-practices)

---

## End of Line (EOL)

### What is EOL?

**EOL** (End of Line) is the character or sequence of characters that marks the end of a line in a text file. Different operating systems use different EOL characters.

### Getting EOL

```javascript
const os = require('os');

const eol = os.EOL;
console.log('EOL:', JSON.stringify(eol));
console.log('EOL Length:', eol.length);
```

### Platform-Specific EOL

| Platform | EOL | Name | Escape Sequence | Hex |
|----------|-----|------|-----------------|-----|
| Windows | `\r\n` | CRLF | Carriage Return + Line Feed | `0D 0A` |
| Unix/Linux | `\n` | LF | Line Feed | `0A` |
| macOS | `\n` | LF | Line Feed | `0A` |
| Classic Mac (pre-OS X) | `\r` | CR | Carriage Return | `0D` |

**Note**: Modern macOS (OS X and later) uses LF like Unix, not CR.

### Historical Background

- **CR** (`\r`): Typewriter command to return carriage to start of line
- **LF** (`\n`): Typewriter command to advance paper to next line
- **CRLF** (`\r\n`): Combination - move carriage back AND advance line

```javascript
// Windows: Two characters
console.log('Windows EOL:', os.EOL); // '\r\n'
console.log('Length:', os.EOL.length); // 2

// Unix/Mac: One character
console.log('Unix/Mac EOL:', os.EOL); // '\n'
console.log('Length:', os.EOL.length); // 1
```

### Using EOL in Code

```javascript
const os = require('os');

// Creating multi-line text
const lines = ['Line 1', 'Line 2', 'Line 3'];
const text = lines.join(os.EOL);

console.log('Text:', text);
// Windows: "Line 1\r\nLine 2\r\nLine 3"
// Unix/Mac: "Line 1\nLine 2\nLine 3"
```

### Writing Files with EOL

```javascript
const os = require('os');
const fs = require('fs');

// Create text with platform-appropriate line endings
const content = [
  'First line',
  'Second line',
  'Third line'
].join(os.EOL);

fs.writeFileSync('output.txt', content);
console.log('File written with platform EOL');
```

### Normalizing Line Endings

```javascript
const os = require('os');

function normalizeLineEndings(text, targetEOL = os.EOL) {
  // Replace all EOL variants with target
  return text.replace(/\r\n|\r|\n/g, targetEOL);
}

// Example with mixed line endings
const mixedText = 'Line 1\r\nLine 2\rLine 3\nLine 4';
console.log('Original:', JSON.stringify(mixedText));

// Normalize to Unix
const unixText = normalizeLineEndings(mixedText, '\n');
console.log('Unix:', JSON.stringify(unixText));

// Normalize to Windows
const windowsText = normalizeLineEndings(mixedText, '\r\n');
console.log('Windows:', JSON.stringify(windowsText));

// Normalize to platform
const platformText = normalizeLineEndings(mixedText, os.EOL);
console.log('Platform:', JSON.stringify(platformText));
```

---

## Endianness

### What is Endianness?

**Endianness** refers to the order in which bytes are stored in memory for multi-byte values. It affects how numbers are represented in binary.

### Getting Endianness

```javascript
const os = require('os');

const endianness = os.endianness();
console.log('Endianness:', endianness);
// Returns: 'BE' or 'LE'
```

### Types of Endianness

**Little-Endian (LE)**:
- Least significant byte stored first
- Most common (Intel/AMD x86, ARM)
- Example: `0x12345678` → `[78, 56, 34, 12]`

**Big-Endian (BE)**:
- Most significant byte stored first
- Network byte order, some older systems
- Example: `0x12345678` → [12, 34, 56, 78]`

```javascript
const os = require('os');

if (os.endianness() === 'LE') {
  console.log('Little-Endian System');
  console.log('- Least significant byte first');
  console.log('- Common on modern CPUs (Intel, AMD, ARM)');
} else {
  console.log('Big-Endian System');
  console.log('- Most significant byte first');
  console.log('- Network byte order');
}
```

### Visual Example

```
Value: 0x12345678 (305,419,896 in decimal)

Little-Endian (LE):
Memory:  [78] [56] [34] [12]
Index:    0    1    2    3

Big-Endian (BE):
Memory:  [12] [34] [56] [78]
Index:    0    1    2    3
```

### Endianness in Buffers

```javascript
const os = require('os');

// Create a 4-byte buffer
const buffer = Buffer.alloc(4);
const value = 0x12345678;

console.log('System Endianness:', os.endianness());
console.log('Original Value:', value.toString(16));

// Write as little-endian
buffer.writeUInt32LE(value, 0);
console.log('Little-Endian:', Array.from(buffer).map(b => b.toString(16).padStart(2, '0')));

// Write as big-endian
buffer.writeUInt32BE(value, 0);
console.log('Big-Endian:', Array.from(buffer).map(b => b.toString(16).padStart(2, '0')));

// Read back based on system endianness
if (os.endianness() === 'LE') {
  const readValue = buffer.readUInt32LE(0);
  console.log('Read Value (LE):', readValue.toString(16));
} else {
  const readValue = buffer.readUInt32BE(0);
  console.log('Read Value (BE):', readValue.toString(16));
}
```

### When Endianness Matters

1. **Binary File Parsing**: Reading/writing binary files
2. **Network Protocols**: Network byte order is big-endian
3. **Cross-Platform Data**: Sharing binary data between systems
4. **Hardware Interfacing**: Communicating with devices

```javascript
const os = require('os');

// Example: Reading a binary file header
function readBinaryHeader(buffer) {
  // Assuming file was written in little-endian
  const magic = buffer.readUInt32LE(0);
  const version = buffer.readUInt16LE(4);
  const size = buffer.readUInt32LE(6);

  return { magic, version, size };
}

// Always specify endianness explicitly for portability
```

---

## Cross-Platform Compatibility

### Handling Text Files

```javascript
const os = require('os');
const fs = require('fs');

function writeTextFile(filename, lines) {
  // Use platform-appropriate line endings
  const content = lines.join(os.EOL);
  fs.writeFileSync(filename, content, 'utf8');
}

function readTextFile(filename) {
  const content = fs.readFileSync(filename, 'utf8');

  // Normalize line endings when reading
  const normalized = content.replace(/\r\n|\r/g, '\n');

  // Split into lines
  return normalized.split('\n');
}

// Usage
const lines = ['Line 1', 'Line 2', 'Line 3'];
writeTextFile('data.txt', lines);

const readLines = readTextFile('data.txt');
console.log('Read lines:', readLines);
```

### Cross-Platform Binary I/O

```javascript
const fs = require('fs');

function writeBinaryFile(filename, data) {
  const buffer = Buffer.alloc(12);

  // Always specify endianness explicitly
  buffer.writeUInt32LE(data.magic, 0);    // Little-endian
  buffer.writeUInt32BE(data.version, 4);  // Big-endian (network order)
  buffer.writeUInt32LE(data.size, 8);     // Little-endian

  fs.writeFileSync(filename, buffer);
}

function readBinaryFile(filename) {
  const buffer = fs.readFileSync(filename);

  // Read with same endianness as written
  return {
    magic: buffer.readUInt32LE(0),
    version: buffer.readUInt32BE(4),
    size: buffer.readUInt32LE(8)
  };
}
```

---

## Best Practices

### 1. Use os.EOL for Text Output

```javascript
// ❌ WRONG - hardcoded line ending
const text = 'Line 1\nLine 2\nLine 3';

// ✅ CORRECT - platform-appropriate
const text = ['Line 1', 'Line 2', 'Line 3'].join(os.EOL);
```

### 2. Normalize on Input

```javascript
// ❌ WRONG - assumes one line ending type
const lines = text.split('\n');

// ✅ CORRECT - handle all line ending types
const lines = text.replace(/\r\n|\r/g, '\n').split('\n');
```

### 3. Specify Endianness Explicitly

```javascript
const buffer = Buffer.alloc(4);

// ❌ AVOID - system-dependent
buffer.writeInt32(value, 0);

// ✅ CORRECT - explicit endianness
buffer.writeInt32LE(value, 0); // Little-endian
// or
buffer.writeInt32BE(value, 0); // Big-endian
```

### 4. Document Binary Format Endianness

```javascript
/**
 * Binary file format (Little-Endian):
 * 0-3: Magic number (0x12345678)
 * 4-7: Version (32-bit integer)
 * 8-11: Size (32-bit integer)
 */
function readHeader(buffer) {
  return {
    magic: buffer.readUInt32LE(0),
    version: buffer.readUInt32LE(4),
    size: buffer.readUInt32LE(8)
  };
}
```

---

## Common Patterns

### 1. CSV with Platform EOL

```javascript
const os = require('os');

function generateCSV(data) {
  const rows = data.map(row => row.join(','));
  return rows.join(os.EOL);
}

const data = [
  ['Name', 'Age', 'City'],
  ['Alice', '30', 'NYC'],
  ['Bob', '25', 'LA']
];

const csv = generateCSV(data);
console.log(csv);
```

### 2. Log File with Timestamps

```javascript
const os = require('os');
const fs = require('fs');

function appendLog(filename, message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}${os.EOL}`;

  fs.appendFileSync(filename, logLine, 'utf8');
}

appendLog('app.log', 'Application started');
appendLog('app.log', 'User logged in');
```

### 3. Portable Binary Format

```javascript
// Define a portable binary format
class BinaryWriter {
  constructor() {
    this.buffers = [];
  }

  writeUInt32(value) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(value, 0); // Always use LE
    this.buffers.push(buffer);
  }

  writeString(str) {
    const buffer = Buffer.from(str, 'utf8');
    this.writeUInt32(buffer.length); // Length prefix
    this.buffers.push(buffer);
  }

  toBuffer() {
    return Buffer.concat(this.buffers);
  }
}
```

---

## Summary

- Use `os.EOL` for platform-appropriate line endings
- Windows uses CRLF (`\r\n`), Unix/Mac use LF (`\n`)
- Use `os.endianness()` to check byte order ('LE' or 'LE')
- Little-endian is most common (Intel, AMD, ARM)
- Always normalize line endings when reading text
- Specify endianness explicitly when reading/writing binary data
- Document binary format endianness in your code

Understanding platform constants helps you write code that works correctly across different operating systems and handles binary data portably.
