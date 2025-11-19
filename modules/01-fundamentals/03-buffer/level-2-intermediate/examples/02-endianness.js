/**
 * Example 2: Endianness (Byte Order)
 *
 * Demonstrates little-endian vs big-endian byte ordering
 * and when each is used in practice.
 */

console.log('=== Endianness: Byte Order ===\n');

// 1. Understanding endianness visually
console.log('1. What is Endianness?');
console.log('Consider the number 0x12345678 (305,419,896 in decimal)');
console.log('This needs 4 bytes to store\n');

const value = 0x12345678;
const buf = Buffer.alloc(4);

// Little-endian: least significant byte first
buf.writeUInt32LE(value, 0);
console.log('Little-Endian (LE):');
console.log('  Bytes:', buf);
console.log('  Order: [78, 56, 34, 12] - backwards!');
console.log('  Memory: 78 56 34 12');
console.log('');

// Big-endian: most significant byte first
buf.writeUInt32BE(value, 0);
console.log('Big-Endian (BE):');
console.log('  Bytes:', buf);
console.log('  Order: [12, 34, 56, 78] - same as written!');
console.log('  Memory: 12 34 56 78');
console.log('');

// 2. Reading with correct endianness
console.log('2. Reading with Correct Endianness');

const testBuf = Buffer.from([0x12, 0x34, 0x56, 0x78]);
console.log('Buffer:', testBuf);
console.log('As LE:', testBuf.readUInt32LE(0).toString(16), '→', testBuf.readUInt32LE(0));
console.log('As BE:', testBuf.readUInt32BE(0).toString(16), '→', testBuf.readUInt32BE(0));
console.log('⚠️  Same bytes, different values!');
console.log('');

// 3. Network byte order (Big-Endian)
console.log('3. Network Byte Order (Always Big-Endian)');

function createIPv4Header() {
  const buf = Buffer.alloc(20);
  let offset = 0;

  // Version (4 bits) + IHL (4 bits) = 1 byte
  buf.writeUInt8(0x45, offset); // Version 4, IHL 5
  offset += 1;

  // Type of Service
  buf.writeUInt8(0, offset);
  offset += 1;

  // Total Length (big-endian for network!)
  buf.writeUInt16BE(60, offset);
  offset += 2;

  // Identification (big-endian)
  buf.writeUInt16BE(54321, offset);
  offset += 2;

  // Flags + Fragment Offset
  buf.writeUInt16BE(0x4000, offset); // Don't fragment
  offset += 2;

  // TTL
  buf.writeUInt8(64, offset);
  offset += 1;

  // Protocol (TCP = 6)
  buf.writeUInt8(6, offset);
  offset += 1;

  // Header Checksum (placeholder)
  buf.writeUInt16BE(0, offset);
  offset += 2;

  // Source IP (192.168.1.100)
  buf.writeUInt32BE(0xC0A80164, offset);
  offset += 4;

  // Destination IP (8.8.8.8)
  buf.writeUInt32BE(0x08080808, offset);
  offset += 4;

  return buf;
}

const ipHeader = createIPv4Header();
console.log('IPv4 Header (hex):', ipHeader.toString('hex'));
console.log('Total Length:', ipHeader.readUInt16BE(2), 'bytes');
console.log('Source IP:',
  `${ipHeader[12]}.${ipHeader[13]}.${ipHeader[14]}.${ipHeader[15]}`);
console.log('Destination IP:',
  `${ipHeader[16]}.${ipHeader[17]}.${ipHeader[18]}.${ipHeader[19]}`);
console.log('');

// 4. File formats (often Little-Endian on x86)
console.log('4. BMP File Format (Little-Endian)');

function createBMPHeader(width, height) {
  const headerSize = 54;
  const pixelDataSize = width * height * 3; // 24-bit RGB
  const fileSize = headerSize + pixelDataSize;

  const buf = Buffer.alloc(headerSize);
  let offset = 0;

  // Signature "BM"
  buf.write('BM', offset, 2, 'ascii');
  offset += 2;

  // File size (little-endian)
  buf.writeUInt32LE(fileSize, offset);
  offset += 4;

  // Reserved
  buf.writeUInt32LE(0, offset);
  offset += 4;

  // Pixel data offset
  buf.writeUInt32LE(headerSize, offset);
  offset += 4;

  // DIB header size
  buf.writeUInt32LE(40, offset);
  offset += 4;

  // Width (little-endian)
  buf.writeInt32LE(width, offset);
  offset += 4;

  // Height (little-endian)
  buf.writeInt32LE(height, offset);
  offset += 4;

  // Color planes
  buf.writeUInt16LE(1, offset);
  offset += 2;

  // Bits per pixel
  buf.writeUInt16LE(24, offset);
  offset += 2;

  // Compression (0 = none)
  buf.writeUInt32LE(0, offset);
  offset += 4;

  // Rest filled with zeros...

  return buf;
}

const bmpHeader = createBMPHeader(800, 600);
console.log('BMP Header (first 20 bytes):', bmpHeader.slice(0, 20).toString('hex'));
console.log('Signature:', bmpHeader.toString('ascii', 0, 2));
console.log('File size:', bmpHeader.readUInt32LE(2), 'bytes');
console.log('Width:', bmpHeader.readInt32LE(18), 'pixels');
console.log('Height:', bmpHeader.readInt32LE(22), 'pixels');
console.log('');

// 5. Platform differences
console.log('5. Platform Endianness');

// Node.js Buffer provides both LE and BE methods regardless of platform
const testValue = 0xAABBCCDD;
const platformBuf = Buffer.alloc(8);

platformBuf.writeUInt32LE(testValue, 0);
platformBuf.writeUInt32BE(testValue, 4);

console.log('Same value, different byte orders:');
console.log('LE:', platformBuf.slice(0, 4));
console.log('BE:', platformBuf.slice(4, 8));
console.log('');

// Check platform endianness using ArrayBuffer
const arrayBuf = new ArrayBuffer(4);
const uint8View = new Uint8Array(arrayBuf);
const uint32View = new Uint32Array(arrayBuf);

uint32View[0] = 0x11223344;

if (uint8View[0] === 0x44) {
  console.log('Your CPU is Little-Endian (x86, x64, ARM in LE mode)');
} else {
  console.log('Your CPU is Big-Endian (some RISC architectures)');
}
console.log('Memory bytes:', Array.from(uint8View));
console.log('');

// 6. Converting between endianness
console.log('6. Converting Between Endianness');

function swapEndianness16(value) {
  return ((value & 0xFF) << 8) | ((value >> 8) & 0xFF);
}

function swapEndianness32(value) {
  return (
    ((value & 0x000000FF) << 24) |
    ((value & 0x0000FF00) << 8) |
    ((value & 0x00FF0000) >> 8) |
    ((value & 0xFF000000) >>> 24)
  ) >>> 0; // >>> 0 ensures unsigned
}

const original16 = 0x1234;
const swapped16 = swapEndianness16(original16);
console.log('16-bit swap:');
console.log('  Original:', original16.toString(16));
console.log('  Swapped:', swapped16.toString(16));
console.log('');

const original32 = 0x12345678;
const swapped32 = swapEndianness32(original32);
console.log('32-bit swap:');
console.log('  Original:', original32.toString(16));
console.log('  Swapped:', swapped32.toString(16));
console.log('');

// 7. When to use which endianness
console.log('7. When to Use Each Endianness');

const guidelines = {
  'Little-Endian (LE)': [
    'File formats (BMP, WAV, RIFF)',
    'Windows data structures',
    'x86/x64 native operations',
    'Internal application data'
  ],
  'Big-Endian (BE)': [
    'Network protocols (TCP/IP, UDP)',
    'Network byte order (RFC standard)',
    'Some image formats (JPEG, TIFF)',
    'Many binary file signatures'
  ]
};

Object.entries(guidelines).forEach(([type, uses]) => {
  console.log(`${type}:`);
  uses.forEach(use => console.log(`  • ${use}`));
  console.log('');
});

// 8. Practical mixed-endianness example
console.log('8. Practical Example: DNS Packet (Big-Endian)');

function createDNSQuery(domain) {
  // DNS header is 12 bytes, all fields are big-endian
  const header = Buffer.alloc(12);
  let offset = 0;

  // Transaction ID (random)
  header.writeUInt16BE(Math.floor(Math.random() * 0xFFFF), offset);
  offset += 2;

  // Flags (standard query)
  header.writeUInt16BE(0x0100, offset);
  offset += 2;

  // Questions count
  header.writeUInt16BE(1, offset);
  offset += 2;

  // Answer RRs
  header.writeUInt16BE(0, offset);
  offset += 2;

  // Authority RRs
  header.writeUInt16BE(0, offset);
  offset += 2;

  // Additional RRs
  header.writeUInt16BE(0, offset);
  offset += 2;

  return header;
}

const dnsHeader = createDNSQuery('example.com');
console.log('DNS Header:', dnsHeader.toString('hex'));
console.log('Transaction ID:', dnsHeader.readUInt16BE(0));
console.log('Flags:', '0x' + dnsHeader.readUInt16BE(2).toString(16));
console.log('Questions:', dnsHeader.readUInt16BE(4));
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Little-Endian: Least significant byte first (LSB)');
console.log('✓ Big-Endian: Most significant byte first (MSB)');
console.log('✓ Network = Big-Endian (network byte order)');
console.log('✓ Files = Usually Little-Endian (on x86/x64)');
console.log('✓ Always use matching read/write methods');
console.log('⚠️  Wrong endianness = Wrong values!');
