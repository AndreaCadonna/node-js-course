/**
 * Example 4: Byte Operations
 *
 * Demonstrates reading and writing individual bytes in buffers.
 */

console.log('=== Byte Operations ===\n');

// 1. Reading individual bytes
console.log('1. Reading bytes (array-style access)');
const buf = Buffer.from('Hello');
console.log('Buffer:', buf);
console.log('');

for (let i = 0; i < buf.length; i++) {
  const byte = buf[i];
  const char = String.fromCharCode(byte);
  const hex = byte.toString(16).padStart(2, '0');
  console.log(`buf[${i}] = ${byte.toString().padStart(3)} (0x${hex}) = '${char}'`);
}
console.log('');

// 2. Writing bytes
console.log('2. Writing individual bytes');
const writeBuf = Buffer.alloc(5);
writeBuf[0] = 72;  // 'H'
writeBuf[1] = 101; // 'e'
writeBuf[2] = 108; // 'l'
writeBuf[3] = 108; // 'l'
writeBuf[4] = 111; // 'o'

console.log('After writing:', writeBuf);
console.log('As string:', writeBuf.toString());
console.log('');

// 3. Hexadecimal values
console.log('3. Using hexadecimal notation');
const hexBuf = Buffer.alloc(5);
hexBuf[0] = 0x48; // H
hexBuf[1] = 0x65; // e
hexBuf[2] = 0x6C; // l
hexBuf[3] = 0x6C; // l
hexBuf[4] = 0x6F; // o

console.log('Hex values:', '0x48, 0x65, 0x6C, 0x6C, 0x6F');
console.log('Result:', hexBuf.toString());
console.log('');

// 4. Byte range (0-255)
console.log('4. Byte value range (0-255)');
const rangeBuf = Buffer.alloc(3);
rangeBuf[0] = 0;      // Minimum
rangeBuf[1] = 127;    // Mid-range
rangeBuf[2] = 255;    // Maximum

console.log('Values:', Array.from(rangeBuf));
console.log('As hex:', rangeBuf.toString('hex'));
console.log('');

// 5. Overflow behavior
console.log('5. Value overflow (wraps around)');
const overflowBuf = Buffer.alloc(3);
overflowBuf[0] = 256;  // Wraps to 0
overflowBuf[1] = 257;  // Wraps to 1
overflowBuf[2] = 510;  // Wraps to 254

console.log('Set values: 256, 257, 510');
console.log('Actual values:', Array.from(overflowBuf));
console.log('⚠️  Values wrap around (256 % 256 = 0)');
console.log('');

// 6. Iterating over bytes
console.log('6. Different ways to iterate');
const iterBuf = Buffer.from([65, 66, 67, 68, 69]); // ABCDE

console.log('Method 1: for loop');
for (let i = 0; i < iterBuf.length; i++) {
  process.stdout.write(String.fromCharCode(iterBuf[i]));
}
console.log('\n');

console.log('Method 2: for...of');
for (const byte of iterBuf) {
  process.stdout.write(String.fromCharCode(byte));
}
console.log('\n');

console.log('Method 3: forEach');
iterBuf.forEach(byte => {
  process.stdout.write(String.fromCharCode(byte));
});
console.log('\n');

// 7. Binary operations
console.log('7. Binary operations on bytes');
const binaryBuf = Buffer.from([0b10101010, 0b11110000, 0b00001111]);

console.log('Original (binary):');
binaryBuf.forEach((byte, i) => {
  console.log(`  buf[${i}] = ${byte.toString(2).padStart(8, '0')} (${byte})`);
});

// XOR each byte with 0xFF (flip all bits)
console.log('\nAfter XOR with 0xFF:');
for (let i = 0; i < binaryBuf.length; i++) {
  binaryBuf[i] ^= 0xFF;
  console.log(`  buf[${i}] = ${binaryBuf[i].toString(2).padStart(8, '0')} (${binaryBuf[i]})`);
}
console.log('');

// 8. Byte manipulation - Simple cipher
console.log('8. Simple XOR cipher');
const message = Buffer.from('SECRET');
const key = 0x42;

console.log('Original:', message.toString());
console.log('Bytes:', Array.from(message));

// Encrypt: XOR each byte with key
for (let i = 0; i < message.length; i++) {
  message[i] ^= key;
}
console.log('Encrypted:', message);
console.log('Encrypted bytes:', Array.from(message));

// Decrypt: XOR again with same key
for (let i = 0; i < message.length; i++) {
  message[i] ^= key;
}
console.log('Decrypted:', message.toString());
console.log('');

// 9. Reading/writing with writeUInt8 and readUInt8
console.log('9. Using read/write methods');
const methodBuf = Buffer.alloc(3);

// Write using method
methodBuf.writeUInt8(65, 0);
methodBuf.writeUInt8(66, 1);
methodBuf.writeUInt8(67, 2);

// Read using method
console.log('Written:', methodBuf.toString());
console.log('Read byte 0:', methodBuf.readUInt8(0), '→', String.fromCharCode(methodBuf.readUInt8(0)));
console.log('Read byte 1:', methodBuf.readUInt8(1), '→', String.fromCharCode(methodBuf.readUInt8(1)));
console.log('Read byte 2:', methodBuf.readUInt8(2), '→', String.fromCharCode(methodBuf.readUInt8(2)));
console.log('');

// 10. Practical example: Hex dump
console.log('10. Practical: Hex dump function');

function hexDump(buffer, bytesPerLine = 16) {
  for (let i = 0; i < buffer.length; i += bytesPerLine) {
    // Offset
    const offset = i.toString(16).padStart(8, '0');

    // Hex bytes
    const line = buffer.subarray(i, i + bytesPerLine);
    const hex = Array.from(line)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ')
      .padEnd(bytesPerLine * 3 - 1);

    // ASCII representation
    const ascii = Array.from(line)
      .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
      .join('');

    console.log(`${offset}  ${hex}  ${ascii}`);
  }
}

const dumpBuf = Buffer.from('Hello World! This is a buffer example.');
hexDump(dumpBuf);
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Access bytes with buf[index] (0 to buf.length-1)');
console.log('✓ Byte values range from 0 to 255');
console.log('✓ Use hex notation (0x48) for readability');
console.log('✓ Values over 255 wrap around');
console.log('✓ Can use buf.readUInt8() and buf.writeUInt8() methods');
console.log('✓ Iterate with for, for...of, or forEach');
