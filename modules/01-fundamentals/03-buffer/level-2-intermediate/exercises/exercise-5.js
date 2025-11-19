/**
 * Exercise 5: Network Protocol Implementation
 *
 * Practice implementing a complete binary protocol with
 * message types, encoding, decoding, and error handling.
 */

console.log('=== Exercise 5: Network Protocol Implementation ===\n');

// Protocol specification:
// All multi-byte integers are big-endian (network byte order)
//
// Message format:
// +--------+--------+--------+--------+--------+
// | Magic  | Version| Type   | Length | Data   |
// | 2 bytes| 1 byte | 1 byte | 2 bytes| N bytes|
// +--------+--------+--------+--------+--------+
//
// Magic: 0x4D50 ('MP' in ASCII)
// Version: 0x01
// Type: Message type (see MessageType enum)
// Length: Data length in bytes
// Data: Variable-length payload

const PROTOCOL_MAGIC = 0x4D50; // 'MP'
const PROTOCOL_VERSION = 0x01;

const MessageType = {
  CONNECT: 0x01,
  DISCONNECT: 0x02,
  DATA: 0x03,
  ACK: 0x04,
  PING: 0x05,
  PONG: 0x06,
  ERROR: 0xFF
};

// Task 1: Create protocol message
console.log('Task 1: Create Protocol Message');
/**
 * Create a protocol message
 * @param {number} type - Message type from MessageType enum
 * @param {Buffer} data - Message payload
 * @returns {Buffer} Complete protocol message
 */
function createMessage(type, data = Buffer.alloc(0)) {
  // TODO: Implement this function
  // Header: magic (2) + version (1) + type (1) + length (2) = 6 bytes
  // Total: 6 + data.length
  // Use big-endian for network byte order
  // Your code here
}

// Test Task 1
try {
  const msg = createMessage(MessageType.PING);
  console.log('PING message:', msg);
  console.log('Length:', msg.length, 'bytes');
  console.log('Expected: 6 bytes (header only)');

  const dataMsg = createMessage(MessageType.DATA, Buffer.from('Hello'));
  console.log('DATA message:', dataMsg);
  console.log('Length:', dataMsg.length, 'bytes');

  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Parse protocol message
console.log('Task 2: Parse Protocol Message');
/**
 * Parse a protocol message
 * @param {Buffer} buffer - Complete message buffer
 * @returns {Object} { magic, version, type, length, data }
 */
function parseMessage(buffer) {
  // TODO: Implement this function
  // Validate buffer has minimum size (6 bytes)
  // Read all header fields
  // Extract data payload
  // Your code here
}

// Test Task 2
try {
  const testMsg = Buffer.alloc(11);
  let offset = 0;

  testMsg.writeUInt16BE(PROTOCOL_MAGIC, offset); offset += 2;
  testMsg.writeUInt8(PROTOCOL_VERSION, offset); offset += 1;
  testMsg.writeUInt8(MessageType.DATA, offset); offset += 1;
  testMsg.writeUInt16BE(5, offset); offset += 2;
  testMsg.write('Hello', offset, 'utf8');

  const parsed = parseMessage(testMsg);
  console.log('Parsed message:', parsed);
  console.log('Data as string:', parsed.data.toString());

  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Validate protocol message
console.log('Task 3: Validate Protocol Message');
/**
 * Validate a protocol message
 * Check:
 * - Correct magic number
 * - Supported version
 * - Valid message type
 * - Length matches actual data
 *
 * @param {Buffer} buffer - Message buffer
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateMessage(buffer) {
  // TODO: Implement this function
  // Return { valid: true } if valid
  // Return { valid: false, error: 'reason' } if invalid
  // Your code here
}

// Test Task 3
try {
  const validMsg = createMessage(MessageType.PING);
  const result1 = validateMessage(validMsg);
  console.log('Valid message:', result1);

  const invalidMagic = Buffer.from([0x00, 0x00, 0x01, 0x01, 0x00, 0x00]);
  const result2 = validateMessage(invalidMagic);
  console.log('Invalid magic:', result2);

  const tooShort = Buffer.from([0x4D, 0x50, 0x01]);
  const result3 = validateMessage(tooShort);
  console.log('Too short:', result3);

  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Message encoder/decoder class
console.log('Task 4: Message Encoder/Decoder Class');
/**
 * Protocol encoder/decoder with helper methods
 */
class ProtocolCodec {
  // Connection messages
  encodeConnect(clientId) {
    // TODO: Encode CONNECT message
    // Data: clientId as UTF-8 string
    // Your code here
  }

  encodeDisconnect() {
    // TODO: Encode DISCONNECT message
    // No data payload
    // Your code here
  }

  // Data messages
  encodeData(payload) {
    // TODO: Encode DATA message
    // Data: raw payload buffer
    // Your code here
  }

  encodeAck(messageId) {
    // TODO: Encode ACK message
    // Data: 4-byte message ID (big-endian)
    // Your code here
  }

  // Ping/Pong messages
  encodePing(timestamp) {
    // TODO: Encode PING message
    // Data: 8-byte timestamp (big-endian, BigUInt64)
    // Your code here
  }

  encodePong(timestamp) {
    // TODO: Encode PONG message
    // Data: 8-byte timestamp from PING
    // Your code here
  }

  // Error messages
  encodeError(errorCode, errorMessage) {
    // TODO: Encode ERROR message
    // Data: 1-byte error code + UTF-8 error message
    // Your code here
  }

  // Decode message
  decode(buffer) {
    // TODO: Parse and validate message
    // Return parsed message object with type-specific data
    // Your code here
  }
}

// Test Task 4
try {
  const codec = new ProtocolCodec();

  const connectMsg = codec.encodeConnect('client-123');
  console.log('CONNECT:', parseMessage(connectMsg));

  const dataMsg = codec.encodeData(Buffer.from('Hello, World!'));
  console.log('DATA:', parseMessage(dataMsg));

  const ackMsg = codec.encodeAck(12345);
  console.log('ACK:', parseMessage(ackMsg));

  const pingMsg = codec.encodePing(BigInt(Date.now()));
  console.log('PING:', parseMessage(pingMsg));

  const errorMsg = codec.encodeError(404, 'Not Found');
  console.log('ERROR:', parseMessage(errorMsg));

  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Message framing for streams
console.log('Task 5: Message Framing for TCP Streams');
/**
 * Handle message framing over TCP streams
 * Messages may arrive in chunks or multiple messages per chunk
 */
class MessageFramer {
  constructor() {
    // TODO: Initialize buffer for accumulating data
    // Your code here
  }

  addData(chunk) {
    // TODO: Add incoming chunk to buffer
    // Your code here
  }

  getMessages() {
    // TODO: Extract complete messages from buffer
    // Return array of complete messages
    // Keep incomplete data in buffer
    // Your code here
  }

  hasCompleteMessage() {
    // TODO: Check if buffer contains at least one complete message
    // Your code here
  }

  reset() {
    // TODO: Clear internal buffer
    // Your code here
  }
}

// Test Task 5
try {
  const framer = new MessageFramer();

  // Create multiple messages
  const msg1 = createMessage(MessageType.PING);
  const msg2 = createMessage(MessageType.DATA, Buffer.from('Test'));
  const msg3 = createMessage(MessageType.PONG);

  // Combine into one buffer
  const combined = Buffer.concat([msg1, msg2, msg3]);

  // Simulate partial arrivals
  framer.addData(combined.slice(0, 10));  // Partial
  console.log('After chunk 1, complete messages:', framer.getMessages().length);

  framer.addData(combined.slice(10, 20)); // Partial
  console.log('After chunk 2, complete messages:', framer.getMessages().length);

  framer.addData(combined.slice(20));     // Rest
  const messages = framer.getMessages();
  console.log('After chunk 3, complete messages:', messages.length);

  messages.forEach((msg, i) => {
    const parsed = parseMessage(msg);
    console.log(`  Message ${i + 1}:`, parsed.type, parsed.data.length, 'bytes');
  });

  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge 1: Protocol with sequence numbers
console.log('Bonus Challenge 1: Add Sequence Numbers');
/**
 * Extended protocol with sequence numbers for ordering and deduplication
 */
class SequencedProtocol extends ProtocolCodec {
  constructor() {
    super();
    this.nextSeqNum = 0;
    this.receivedSeqNums = new Set();
  }

  encodeWithSequence(type, data) {
    // TODO: Add 4-byte sequence number before data
    // Increment sequence number
    // Your code here
  }

  decodeWithSequence(buffer) {
    // TODO: Extract and validate sequence number
    // Check for duplicates
    // Return { seqNum, message, isDuplicate }
    // Your code here
  }

  resetSequence() {
    // TODO: Reset sequence number and received set
    // Your code here
  }
}

// Test Bonus 1
try {
  const seqProto = new SequencedProtocol();

  const msg1 = seqProto.encodeWithSequence(MessageType.DATA, Buffer.from('First'));
  const msg2 = seqProto.encodeWithSequence(MessageType.DATA, Buffer.from('Second'));

  console.log('Sequenced message 1:', msg1);
  console.log('Sequenced message 2:', msg2);

  const decoded1 = seqProto.decodeWithSequence(msg1);
  console.log('Decoded 1:', decoded1);

  const decoded2 = seqProto.decodeWithSequence(msg1); // Duplicate
  console.log('Decoded 1 again (duplicate):', decoded2);

  console.log('✓ Bonus 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge 2: Request-response matching
console.log('Bonus Challenge 2: Request-Response Matching');
/**
 * Match responses to requests using request IDs
 */
class RequestResponseProtocol {
  constructor() {
    this.nextRequestId = 1;
    this.pendingRequests = new Map();
  }

  createRequest(type, data, callback) {
    // TODO: Create request with unique ID
    // Store callback in pendingRequests map
    // Return request buffer
    // Your code here
  }

  handleResponse(buffer) {
    // TODO: Parse response, extract request ID
    // Call matching callback
    // Remove from pending requests
    // Your code here
  }

  getPendingCount() {
    // TODO: Return number of pending requests
    // Your code here
  }

  timeout(requestId) {
    // TODO: Handle request timeout
    // Call callback with error
    // Remove from pending requests
    // Your code here
  }
}

// Test Bonus 2
try {
  const rrProto = new RequestResponseProtocol();

  const request = rrProto.createRequest(
    MessageType.DATA,
    Buffer.from('Query'),
    (err, response) => {
      if (err) {
        console.log('Request error:', err);
      } else {
        console.log('Request response:', response);
      }
    }
  );

  console.log('Created request:', request);
  console.log('Pending requests:', rrProto.getPendingCount());

  // Simulate response
  // rrProto.handleResponse(responseBuffer);

  console.log('✓ Bonus 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 5 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
console.log('');
console.log('💡 Tips:');
console.log('  • Network protocols use big-endian byte order');
console.log('  • Always validate magic numbers and versions');
console.log('  • Message framing handles partial/combined messages');
console.log('  • Sequence numbers prevent duplicates and enable ordering');
console.log('  • Request IDs match responses to requests');
console.log('  • Consider timeout handling for reliability');
