/**
 * Example 5: Binary Protocols
 *
 * Demonstrates implementing binary network protocols
 * with message framing, encoding, and decoding.
 */

console.log('=== Binary Network Protocols ===\n');

// 1. Simple packet structure
console.log('1. Simple Packet Structure');

/**
 * Packet format:
 * +--------+-------+----------+--------+
 * | Type   | Flags | Length   | Data   |
 * | 1 byte | 1 byte| 2 bytes  | N bytes|
 * +--------+-------+----------+--------+
 */

const PacketType = {
  PING: 0x01,
  PONG: 0x02,
  DATA: 0x03,
  ACK: 0x04,
  ERROR: 0xFF
};

function createPacket(type, data, flags = 0) {
  const dataLength = data.length;
  const totalLength = 4 + dataLength; // Header (4) + data

  const buf = Buffer.alloc(totalLength);
  let offset = 0;

  // Type
  buf.writeUInt8(type, offset);
  offset += 1;

  // Flags
  buf.writeUInt8(flags, offset);
  offset += 1;

  // Length (big-endian for network)
  buf.writeUInt16BE(dataLength, offset);
  offset += 2;

  // Data
  data.copy(buf, offset);

  return buf;
}

function parsePacket(buf) {
  let offset = 0;

  const type = buf.readUInt8(offset);
  offset += 1;

  const flags = buf.readUInt8(offset);
  offset += 1;

  const length = buf.readUInt16BE(offset);
  offset += 2;

  const data = buf.slice(offset, offset + length);

  return { type, flags, length, data };
}

const pingPacket = createPacket(PacketType.PING, Buffer.from('Hello'));
const parsed = parsePacket(pingPacket);

console.log('Packet hex:', pingPacket.toString('hex'));
console.log('Parsed:', {
  type: '0x' + parsed.type.toString(16),
  flags: parsed.flags,
  length: parsed.length,
  data: parsed.data.toString()
});
console.log('');

// 2. Length-prefixed messages
console.log('2. Length-Prefixed Messages');

/**
 * Message format:
 * +----------+----------+
 * | Length   | Message  |
 * | 4 bytes  | N bytes  |
 * +----------+----------+
 */

function encodeMessage(message) {
  const msgBuf = Buffer.from(message, 'utf8');
  const buf = Buffer.alloc(4 + msgBuf.length);

  buf.writeUInt32BE(msgBuf.length, 0);
  msgBuf.copy(buf, 4);

  return buf;
}

function decodeMessage(buf) {
  const length = buf.readUInt32BE(0);
  const message = buf.toString('utf8', 4, 4 + length);
  return message;
}

const msg = encodeMessage('Hello, Protocol!');
const decoded = decodeMessage(msg);

console.log('Encoded:', msg);
console.log('Decoded:', decoded);
console.log('');

// 3. Message framing (handling multiple messages)
console.log('3. Message Framing (Stream Processing)');

class MessageFramer {
  constructor() {
    this.buffer = Buffer.alloc(0);
  }

  // Add data from network
  addData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
  }

  // Extract complete messages
  getMessages() {
    const messages = [];

    while (this.buffer.length >= 4) {
      // Read message length
      const msgLength = this.buffer.readUInt32BE(0);

      // Check if we have the complete message
      if (this.buffer.length < 4 + msgLength) {
        break; // Wait for more data
      }

      // Extract message
      const message = this.buffer.toString('utf8', 4, 4 + msgLength);
      messages.push(message);

      // Remove processed message
      this.buffer = this.buffer.slice(4 + msgLength);
    }

    return messages;
  }
}

// Simulate receiving data in chunks
const framer = new MessageFramer();

const msg1 = encodeMessage('First');
const msg2 = encodeMessage('Second');
const msg3 = encodeMessage('Third');

// Simulate partial arrival
const combined = Buffer.concat([msg1, msg2, msg3]);
framer.addData(combined.slice(0, 10)); // Partial
framer.addData(combined.slice(10, 20)); // Partial
framer.addData(combined.slice(20));      // Rest

const received = framer.getMessages();
console.log('Received messages:', received);
console.log('');

// 4. Request-Response protocol
console.log('4. Request-Response Protocol');

/**
 * Request format:
 * +----------+--------+----------+--------+
 * | Msg ID   | Method | Arg Len  | Args   |
 * | 4 bytes  | 1 byte | 2 bytes  | N bytes|
 * +----------+--------+----------+--------+
 */

const Method = {
  GET: 1,
  SET: 2,
  DELETE: 3,
  LIST: 4
};

function createRequest(msgId, method, args) {
  const argsBuf = Buffer.from(JSON.stringify(args), 'utf8');
  const buf = Buffer.alloc(7 + argsBuf.length);

  let offset = 0;
  buf.writeUInt32BE(msgId, offset); offset += 4;
  buf.writeUInt8(method, offset); offset += 1;
  buf.writeUInt16BE(argsBuf.length, offset); offset += 2;
  argsBuf.copy(buf, offset);

  return buf;
}

function parseRequest(buf) {
  let offset = 0;
  const msgId = buf.readUInt32BE(offset); offset += 4;
  const method = buf.readUInt8(offset); offset += 1;
  const argLen = buf.readUInt16BE(offset); offset += 2;
  const args = JSON.parse(buf.toString('utf8', offset, offset + argLen));

  return { msgId, method, args };
}

function createResponse(msgId, success, data) {
  const dataBuf = Buffer.from(JSON.stringify(data), 'utf8');
  const buf = Buffer.alloc(6 + dataBuf.length);

  let offset = 0;
  buf.writeUInt32BE(msgId, offset); offset += 4;
  buf.writeUInt8(success ? 1 : 0, offset); offset += 1;
  buf.writeUInt8(dataBuf.length, offset); offset += 1;
  dataBuf.copy(buf, offset);

  return buf;
}

const req = createRequest(123, Method.GET, { key: 'username' });
const parsedReq = parseRequest(req);

console.log('Request:', parsedReq);

const resp = createResponse(123, true, { value: 'alice' });
console.log('Response hex:', resp.toString('hex'));
console.log('');

// 5. Protocol with checksum
console.log('5. Protocol with Checksum');

/**
 * Packet with checksum:
 * +--------+----------+----------+
 * | Data   | Checksum | Length   |
 * | N bytes| 2 bytes  | Total    |
 * +--------+----------+----------+
 */

function calculateChecksum(buf) {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    sum = (sum + buf[i]) & 0xFFFF;
  }
  return sum;
}

function createChecksumPacket(data) {
  const buf = Buffer.alloc(data.length + 2);

  // Copy data
  data.copy(buf, 0);

  // Calculate and append checksum
  const checksum = calculateChecksum(data);
  buf.writeUInt16BE(checksum, data.length);

  return buf;
}

function verifyChecksumPacket(buf) {
  if (buf.length < 2) return false;

  const dataLen = buf.length - 2;
  const data = buf.slice(0, dataLen);
  const receivedChecksum = buf.readUInt16BE(dataLen);
  const calculatedChecksum = calculateChecksum(data);

  return receivedChecksum === calculatedChecksum;
}

const payload = Buffer.from('Important data');
const checksumPkt = createChecksumPacket(payload);

console.log('Packet with checksum:', checksumPkt.toString('hex'));
console.log('Checksum valid:', verifyChecksumPacket(checksumPkt));

// Corrupt the packet
checksumPkt[5] = 0xFF;
console.log('After corruption, valid:', verifyChecksumPacket(checksumPkt));
console.log('');

// 6. TLV (Type-Length-Value) encoding
console.log('6. TLV (Type-Length-Value) Encoding');

/**
 * TLV format:
 * +--------+----------+--------+
 * | Type   | Length   | Value  |
 * | 1 byte | 2 bytes  | N bytes|
 * +--------+----------+--------+
 */

const TLVType = {
  STRING: 0x01,
  INTEGER: 0x02,
  BOOLEAN: 0x03,
  BINARY: 0x04
};

function encodeTLV(type, value) {
  let valueBuf;

  switch (type) {
    case TLVType.STRING:
      valueBuf = Buffer.from(value, 'utf8');
      break;
    case TLVType.INTEGER:
      valueBuf = Buffer.alloc(4);
      valueBuf.writeInt32BE(value, 0);
      break;
    case TLVType.BOOLEAN:
      valueBuf = Buffer.alloc(1);
      valueBuf.writeUInt8(value ? 1 : 0, 0);
      break;
    case TLVType.BINARY:
      valueBuf = value;
      break;
  }

  const buf = Buffer.alloc(3 + valueBuf.length);
  buf.writeUInt8(type, 0);
  buf.writeUInt16BE(valueBuf.length, 1);
  valueBuf.copy(buf, 3);

  return buf;
}

function decodeTLV(buf) {
  const type = buf.readUInt8(0);
  const length = buf.readUInt16BE(1);
  const valueBuf = buf.slice(3, 3 + length);

  let value;
  switch (type) {
    case TLVType.STRING:
      value = valueBuf.toString('utf8');
      break;
    case TLVType.INTEGER:
      value = valueBuf.readInt32BE(0);
      break;
    case TLVType.BOOLEAN:
      value = valueBuf.readUInt8(0) === 1;
      break;
    case TLVType.BINARY:
      value = valueBuf;
      break;
  }

  return { type, length, value };
}

const tlvString = encodeTLV(TLVType.STRING, 'Hello');
const tlvInt = encodeTLV(TLVType.INTEGER, 42);
const tlvBool = encodeTLV(TLVType.BOOLEAN, true);

console.log('TLV String:', decodeTLV(tlvString));
console.log('TLV Integer:', decodeTLV(tlvInt));
console.log('TLV Boolean:', decodeTLV(tlvBool));
console.log('');

// 7. Connection handshake
console.log('7. Connection Handshake Protocol');

/**
 * Handshake:
 * Client -> Server: HELLO + version + client_id
 * Server -> Client: HELLO_ACK + session_id
 */

function createHello(version, clientId) {
  const buf = Buffer.alloc(9);
  buf.writeUInt32BE(0x48454C4F, 0); // 'HELO'
  buf.writeUInt16BE(version, 4);
  buf.writeUInt32BE(clientId, 5);
  return buf;
}

function createHelloAck(sessionId) {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(0x48454C41, 0); // 'HELA'
  buf.writeUInt32BE(sessionId, 4);
  return buf;
}

const clientHello = createHello(1, 12345);
console.log('Client HELLO:', clientHello.toString('hex'));

const serverAck = createHelloAck(67890);
console.log('Server HELLO_ACK:', serverAck.toString('hex'));
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Binary protocols are compact and fast');
console.log('✓ Use length prefixes for variable-length data');
console.log('✓ Network byte order = Big-endian');
console.log('✓ Message framing handles partial messages');
console.log('✓ Checksums detect data corruption');
console.log('✓ TLV provides flexible encoding');
console.log('✓ Always document protocol format!');
