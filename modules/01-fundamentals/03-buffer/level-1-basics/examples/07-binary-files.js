/**
 * Example 7: Reading and Writing Binary Files
 *
 * Demonstrates working with binary files using buffers.
 */

const fs = require('fs');
const path = require('path');

console.log('=== Binary File Operations ===\n');

// Create a temporary directory for examples
const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// 1. Writing binary data to file
console.log('1. Writing binary data to file');

const binaryData = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, // PNG signature
  0x0D, 0x0A, 0x1A, 0x0A,
  0x00, 0x00, 0x00, 0x0D  // Additional bytes
]);

const binaryFile = path.join(tmpDir, 'binary.dat');
fs.writeFileSync(binaryFile, binaryData);

console.log('Written', binaryData.length, 'bytes to', binaryFile);
console.log('Data (hex):', binaryData.toString('hex'));
console.log('');

// 2. Reading binary data from file
console.log('2. Reading binary data from file');

const readData = fs.readFileSync(binaryFile);
console.log('Read', readData.length, 'bytes');
console.log('Data (hex):', readData.toString('hex'));
console.log('Match:', binaryData.equals(readData));
console.log('');

// 3. Reading first N bytes
console.log('3. Reading file header (first 8 bytes)');

const headerSize = 8;
const header = Buffer.alloc(headerSize);
const fd = fs.openSync(binaryFile, 'r');
const bytesRead = fs.readSync(fd, header, 0, headerSize, 0);
fs.closeSync(fd);

console.log('Bytes read:', bytesRead);
console.log('Header:', header);
console.log('As hex:', header.toString('hex'));
console.log('');

// 4. Writing text vs binary
console.log('4. Text file vs Binary file');

const textData = 'Hello World';
const textFile = path.join(tmpDir, 'text.txt');
const textAsBinary = path.join(tmpDir, 'text-binary.bin');

// Write as text (default encoding)
fs.writeFileSync(textFile, textData);

// Write as binary (explicit buffer)
fs.writeFileSync(textAsBinary, Buffer.from(textData, 'utf8'));

const textContent = fs.readFileSync(textFile, 'utf8');
const binaryContent = fs.readFileSync(textAsBinary);

console.log('Text file content:', textContent);
console.log('Binary file as buffer:', binaryContent);
console.log('Binary as string:', binaryContent.toString('utf8'));
console.log('Same content:', textContent === binaryContent.toString('utf8'));
console.log('');

// 5. Appending to binary file
console.log('5. Appending to binary file');

const appendFile = path.join(tmpDir, 'append.bin');
const chunk1 = Buffer.from([0x01, 0x02, 0x03]);
const chunk2 = Buffer.from([0x04, 0x05, 0x06]);

fs.writeFileSync(appendFile, chunk1);
fs.appendFileSync(appendFile, chunk2);

const combined = fs.readFileSync(appendFile);
console.log('After appending:', Array.from(combined));
console.log('');

// 6. Checking file signatures
console.log('6. Checking file signatures');

function getFileType(filePath) {
  const header = Buffer.alloc(8);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, header, 0, 8, 0);
  fs.closeSync(fd);

  // PNG signature
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    return 'PNG';
  }

  // JPEG signature
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return 'JPEG';
  }

  // PDF signature
  if (header.toString('ascii', 0, 4) === '%PDF') {
    return 'PDF';
  }

  return 'Unknown';
}

console.log('Binary file type:', getFileType(binaryFile));
console.log('');

// 7. Creating a simple binary file format
console.log('7. Creating custom binary file format');

function createDataFile(filename, records) {
  const parts = [];

  // Header: magic number + version + record count
  const header = Buffer.alloc(8);
  header.write('DATA', 0, 4, 'ascii');  // Magic
  header.writeUInt16LE(1, 4);           // Version
  header.writeUInt16LE(records.length, 6); // Count

  parts.push(header);

  // Records
  for (const record of records) {
    const data = Buffer.from(record, 'utf8');
    const recordHeader = Buffer.alloc(2);
    recordHeader.writeUInt16LE(data.length, 0);
    parts.push(recordHeader);
    parts.push(data);
  }

  const fileData = Buffer.concat(parts);
  fs.writeFileSync(filename, fileData);
  return fileData.length;
}

function readDataFile(filename) {
  const data = fs.readFileSync(filename);
  let offset = 0;

  // Read header
  const magic = data.toString('ascii', offset, offset + 4);
  offset += 4;

  const version = data.readUInt16LE(offset);
  offset += 2;

  const count = data.readUInt16LE(offset);
  offset += 2;

  console.log(`Format: ${magic}, Version: ${version}, Records: ${count}`);

  // Read records
  const records = [];
  for (let i = 0; i < count; i++) {
    const length = data.readUInt16LE(offset);
    offset += 2;

    const record = data.toString('utf8', offset, offset + length);
    offset += length;

    records.push(record);
  }

  return records;
}

const dataFile = path.join(tmpDir, 'data.db');
const records = ['Record 1', 'Record 2', 'Record 3'];

console.log('Writing records:', records);
const size = createDataFile(dataFile, records);
console.log('File size:', size, 'bytes');

console.log('\nReading back:');
const readRecords = readDataFile(dataFile);
readRecords.forEach((r, i) => console.log(`  [${i}]:`, r));
console.log('');

// 8. Reading file in chunks
console.log('8. Reading large file in chunks');

// Create a larger file
const largeFile = path.join(tmpDir, 'large.bin');
const largeData = Buffer.alloc(1000);
for (let i = 0; i < 1000; i++) {
  largeData[i] = i % 256;
}
fs.writeFileSync(largeFile, largeData);

// Read in chunks
const chunkSize = 100;
const chunks = [];
const largeFd = fs.openSync(largeFile, 'r');
let position = 0;

while (true) {
  const chunk = Buffer.alloc(chunkSize);
  const bytesRead = fs.readSync(largeFd, chunk, 0, chunkSize, position);

  if (bytesRead === 0) break;

  chunks.push(chunk.subarray(0, bytesRead));
  position += bytesRead;
}

fs.closeSync(largeFd);

console.log('Read', chunks.length, 'chunks');
console.log('Total bytes:', chunks.reduce((sum, c) => sum + c.length, 0));

const reassembled = Buffer.concat(chunks);
console.log('Match original:', largeData.equals(reassembled));
console.log('');

// 9. Binary file viewer
console.log('9. Simple hex viewer');

function hexView(filePath, maxBytes = 64) {
  const data = fs.readFileSync(filePath);
  const view = data.subarray(0, Math.min(maxBytes, data.length));

  console.log(`File: ${path.basename(filePath)} (${data.length} bytes)`);
  console.log('');

  for (let i = 0; i < view.length; i += 16) {
    const offset = i.toString(16).padStart(8, '0');
    const line = view.subarray(i, i + 16);

    const hex = Array.from(line)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ')
      .padEnd(47);

    const ascii = Array.from(line)
      .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
      .join('');

    console.log(`${offset}  ${hex}  ${ascii}`);
  }

  if (data.length > maxBytes) {
    console.log('... (showing first', maxBytes, 'of', data.length, 'bytes)');
  }
  console.log('');
}

hexView(dataFile);

// Cleanup
console.log('Cleaning up temporary files...');
fs.readdirSync(tmpDir).forEach(file => {
  fs.unlinkSync(path.join(tmpDir, file));
});
fs.rmdirSync(tmpDir);
console.log('✓ Cleanup complete');
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Use fs.writeFileSync(path, buffer) to write binary');
console.log('✓ Use fs.readFileSync(path) to read as buffer');
console.log('✓ Check file signatures for file type detection');
console.log('✓ Read large files in chunks to save memory');
console.log('✓ Always close file descriptors when using fs.openSync');
console.log('✓ Buffers preserve binary data integrity');
