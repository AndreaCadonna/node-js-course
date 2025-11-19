/**
 * Example 7: Offset Management
 *
 * Demonstrates best practices for managing offsets when
 * reading and writing complex binary structures.
 */

console.log('=== Offset Management ===\n');

// 1. Manual offset tracking
console.log('1. Manual Offset Tracking (Prone to Errors)');

function writeDataManual(buf) {
  // ❌ Error-prone: manually calculating offsets
  buf.writeUInt8(1, 0);
  buf.writeUInt16LE(256, 1);
  buf.writeUInt32LE(65536, 3);
  buf.writeFloatLE(3.14, 7);
  // Easy to make mistakes! What if types change?
}

const manual = Buffer.alloc(11);
writeDataManual(manual);
console.log('Manual offset:', manual);
console.log('⚠️  Hard to maintain and error-prone');
console.log('');

// 2. Auto-incrementing offset
console.log('2. Auto-Incrementing Offset Pattern');

function writeDataAuto(buf) {
  let offset = 0;

  // ✅ Better: offset auto-increments
  buf.writeUInt8(1, offset);
  offset += 1;

  buf.writeUInt16LE(256, offset);
  offset += 2;

  buf.writeUInt32LE(65536, offset);
  offset += 4;

  buf.writeFloatLE(3.14, offset);
  offset += 4;

  return offset; // Return final offset for chaining
}

const auto = Buffer.alloc(11);
const finalOffset = writeDataAuto(auto);
console.log('Auto offset:', auto);
console.log('Final offset:', finalOffset);
console.log('✅ Easier to maintain');
console.log('');

// 3. Offset helper class
console.log('3. Offset Helper Class');

class BufferWriter {
  constructor(size) {
    this.buffer = Buffer.alloc(size);
    this.offset = 0;
  }

  writeUInt8(value) {
    this.buffer.writeUInt8(value, this.offset);
    this.offset += 1;
    return this;
  }

  writeUInt16LE(value) {
    this.buffer.writeUInt16LE(value, this.offset);
    this.offset += 2;
    return this;
  }

  writeUInt32LE(value) {
    this.buffer.writeUInt32LE(value, this.offset);
    this.offset += 4;
    return this;
  }

  writeFloatLE(value) {
    this.buffer.writeFloatLE(value, this.offset);
    this.offset += 4;
    return this;
  }

  writeString(str, encoding = 'utf8') {
    const len = this.buffer.write(str, this.offset, encoding);
    this.offset += len;
    return this;
  }

  writeBuffer(buf) {
    buf.copy(this.buffer, this.offset);
    this.offset += buf.length;
    return this;
  }

  getBuffer() {
    return this.buffer.slice(0, this.offset);
  }
}

const writer = new BufferWriter(100);
writer
  .writeUInt8(1)
  .writeUInt16LE(256)
  .writeUInt32LE(65536)
  .writeFloatLE(3.14);

console.log('BufferWriter result:', writer.getBuffer());
console.log('✅ Clean, chainable API');
console.log('');

// 4. Offset helper for reading
console.log('4. BufferReader Class');

class BufferReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  readUInt8() {
    const value = this.buffer.readUInt8(this.offset);
    this.offset += 1;
    return value;
  }

  readUInt16LE() {
    const value = this.buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return value;
  }

  readUInt32LE() {
    const value = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  readFloatLE() {
    const value = this.buffer.readFloatLE(this.offset);
    this.offset += 4;
    return value;
  }

  readString(length, encoding = 'utf8') {
    const value = this.buffer.toString(encoding, this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  readBuffer(length) {
    const value = this.buffer.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  remaining() {
    return this.buffer.length - this.offset;
  }
}

const reader = new BufferReader(writer.getBuffer());
console.log('Read UInt8:', reader.readUInt8());
console.log('Read UInt16LE:', reader.readUInt16LE());
console.log('Read UInt32LE:', reader.readUInt32LE());
console.log('Read FloatLE:', reader.readFloatLE());
console.log('Remaining bytes:', reader.remaining());
console.log('');

// 5. Complex structure example
console.log('5. Complex Binary Structure');

/**
 * Packet structure:
 * - Header (10 bytes)
 *   - Magic (4 bytes): 'PACK'
 *   - Version (2 bytes)
 *   - Flags (1 byte)
 *   - Payload length (4 bytes)
 * - Payload (variable)
 */

class Packet {
  constructor(version, flags, payload) {
    this.version = version;
    this.flags = flags;
    this.payload = payload;
  }

  serialize() {
    const writer = new BufferWriter(10 + this.payload.length);

    // Header
    writer.writeBuffer(Buffer.from('PACK'));
    writer.writeUInt16LE(this.version);
    writer.writeUInt8(this.flags);
    writer.writeUInt32LE(this.payload.length);

    // Payload
    writer.writeBuffer(this.payload);

    return writer.getBuffer();
  }

  static deserialize(buf) {
    const reader = new BufferReader(buf);

    // Header
    const magic = reader.readBuffer(4).toString('ascii');
    if (magic !== 'PACK') {
      throw new Error('Invalid packet magic');
    }

    const version = reader.readUInt16LE();
    const flags = reader.readUInt8();
    const payloadLength = reader.readUInt32LE();

    // Payload
    const payload = reader.readBuffer(payloadLength);

    return new Packet(version, flags, payload);
  }
}

const packet = new Packet(1, 0x01, Buffer.from('Hello, World!'));
const packetBuf = packet.serialize();
const packetRestored = Packet.deserialize(packetBuf);

console.log('Original packet:', packet);
console.log('Serialized:', packetBuf.length, 'bytes');
console.log('Restored:', packetRestored);
console.log('Payload:', packetRestored.payload.toString());
console.log('');

// 6. Alignment and padding
console.log('6. Alignment and Padding');

/**
 * Some platforms require aligned data:
 * - 16-bit values at even offsets
 * - 32-bit values at multiples of 4
 * - 64-bit values at multiples of 8
 */

function alignOffset(offset, alignment) {
  const remainder = offset % alignment;
  if (remainder === 0) return offset;
  return offset + (alignment - remainder);
}

class AlignedWriter extends BufferWriter {
  align(bytes) {
    const aligned = alignOffset(this.offset, bytes);
    // Fill padding with zeros
    while (this.offset < aligned) {
      this.writeUInt8(0);
    }
    return this;
  }

  writeUInt16Aligned(value) {
    this.align(2);
    return this.writeUInt16LE(value);
  }

  writeUInt32Aligned(value) {
    this.align(4);
    return this.writeUInt32LE(value);
  }
}

const aligned = new AlignedWriter(20);
aligned
  .writeUInt8(0xFF)           // offset: 0
  .writeUInt16Aligned(0x1234) // offset: 2 (aligned from 1)
  .writeUInt8(0xAA)           // offset: 4
  .writeUInt32Aligned(0x56789ABC); // offset: 8 (aligned from 5)

console.log('Aligned buffer:', aligned.getBuffer());
console.log('✅ Proper alignment for platform requirements');
console.log('');

// 7. Nested structures
console.log('7. Nested Structures');

class Address {
  constructor(street, city, zip) {
    this.street = street;
    this.city = city;
    this.zip = zip;
  }

  serialize(writer) {
    // Write lengths first
    writer.writeUInt8(this.street.length);
    writer.writeString(this.street);
    writer.writeUInt8(this.city.length);
    writer.writeString(this.city);
    writer.writeUInt32LE(this.zip);
  }

  static deserialize(reader) {
    const streetLen = reader.readUInt8();
    const street = reader.readString(streetLen);
    const cityLen = reader.readUInt8();
    const city = reader.readString(cityLen);
    const zip = reader.readUInt32LE();

    return new Address(street, city, zip);
  }
}

class Person {
  constructor(name, age, address) {
    this.name = name;
    this.age = age;
    this.address = address;
  }

  serialize() {
    const writer = new BufferWriter(200);

    writer.writeUInt8(this.name.length);
    writer.writeString(this.name);
    writer.writeUInt8(this.age);

    // Nested structure
    this.address.serialize(writer);

    return writer.getBuffer();
  }

  static deserialize(buf) {
    const reader = new BufferReader(buf);

    const nameLen = reader.readUInt8();
    const name = reader.readString(nameLen);
    const age = reader.readUInt8();

    // Nested structure
    const address = Address.deserialize(reader);

    return new Person(name, age, address);
  }
}

const address = new Address('123 Main St', 'Springfield', 12345);
const person = new Person('Alice', 30, address);

const personBuf = person.serialize();
const personRestored = Person.deserialize(personBuf);

console.log('Original:', person);
console.log('Serialized:', personBuf.length, 'bytes');
console.log('Restored:', personRestored);
console.log('');

// 8. Performance tips
console.log('8. Performance Tips');

// ❌ Slow: Creating new buffer for each field
function slowWrite() {
  const buffers = [];
  const buf1 = Buffer.alloc(1);
  buf1.writeUInt8(1, 0);
  buffers.push(buf1);

  const buf2 = Buffer.alloc(2);
  buf2.writeUInt16LE(256, 0);
  buffers.push(buf2);

  return Buffer.concat(buffers);
}

// ✅ Fast: Pre-allocate and write sequentially
function fastWrite() {
  const buf = Buffer.alloc(3);
  let offset = 0;
  buf.writeUInt8(1, offset);
  offset += 1;
  buf.writeUInt16LE(256, offset);
  offset += 2;
  return buf;
}

console.time('Slow approach (1000x)');
for (let i = 0; i < 1000; i++) slowWrite();
console.timeEnd('Slow approach (1000x)');

console.time('Fast approach (1000x)');
for (let i = 0; i < 1000; i++) fastWrite();
console.timeEnd('Fast approach (1000x)');

console.log('✅ Pre-allocation is much faster!');
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Always use auto-incrementing offset pattern');
console.log('✓ BufferWriter/Reader classes simplify code');
console.log('✓ Pre-allocate buffers for best performance');
console.log('✓ Consider alignment for platform compatibility');
console.log('✓ Nested structures need careful offset management');
console.log('✓ Return offset from write functions for chaining');
console.log('⚠️  Manual offset calculation is error-prone!');
