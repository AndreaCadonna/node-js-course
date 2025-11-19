/**
 * Exercise 2: TCP Packet Builder
 *
 * Practice building binary network protocols by implementing
 * a TCP-like packet format with checksums and validation.
 */

console.log('=== Exercise 2: TCP Packet Builder ===\n');

// Task 1: Create packet header
console.log('Task 1: Create Packet Header');
/**
 * Create a TCP-like packet header
 * Header structure (20 bytes):
 * - Source Port: 2 bytes (BE)
 * - Dest Port: 2 bytes (BE)
 * - Sequence Number: 4 bytes (BE)
 * - Acknowledgment: 4 bytes (BE)
 * - Flags: 1 byte (SYN=0x02, ACK=0x10, FIN=0x01, PSH=0x08)
 * - Window Size: 2 bytes (BE)
 * - Checksum: 2 bytes (BE) - set to 0 for now
 * - Urgent Pointer: 2 bytes (BE)
 * - Reserved: 1 byte
 *
 * @param {Object} options - { srcPort, destPort, seqNum, ackNum, flags, windowSize }
 * @returns {Buffer} 20-byte header
 */
function createPacketHeader(options) {
  // TODO: Implement this function
  // Network protocols use big-endian byte order!
  // Your code here
}

// Test Task 1
try {
  const header = createPacketHeader({
    srcPort: 12345,
    destPort: 80,
    seqNum: 1000,
    ackNum: 2000,
    flags: 0x02, // SYN
    windowSize: 8192
  });

  console.log('Packet header:', header);
  console.log('Length:', header.length, 'bytes');
  console.log('Expected: 20 bytes');
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Parse packet header
console.log('Task 2: Parse Packet Header');
/**
 * Parse a TCP-like packet header
 * @param {Buffer} buffer - Packet buffer
 * @returns {Object} Parsed header fields
 */
function parsePacketHeader(buffer) {
  // TODO: Implement this function
  // Return: { srcPort, destPort, seqNum, ackNum, flags, windowSize, checksum, urgentPtr }
  // Your code here
}

// Test Task 2
try {
  const testHeader = Buffer.alloc(20);
  let offset = 0;

  testHeader.writeUInt16BE(8080, offset); offset += 2;
  testHeader.writeUInt16BE(443, offset); offset += 2;
  testHeader.writeUInt32BE(5000, offset); offset += 4;
  testHeader.writeUInt32BE(6000, offset); offset += 4;
  testHeader.writeUInt8(0x10, offset); offset += 1; // ACK
  testHeader.writeUInt16BE(16384, offset); offset += 2;
  testHeader.writeUInt16BE(0, offset); offset += 2; // Checksum
  testHeader.writeUInt16BE(0, offset); offset += 2; // Urgent
  testHeader.writeUInt8(0, offset); // Reserved

  const parsed = parsePacketHeader(testHeader);
  console.log('Parsed header:', parsed);
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Calculate checksum
console.log('Task 3: Calculate Packet Checksum');
/**
 * Calculate a simple checksum for the packet
 * Algorithm: Sum all bytes, then take 16-bit ones' complement
 * @param {Buffer} buffer - Packet data (header + payload)
 * @returns {number} 16-bit checksum
 */
function calculateChecksum(buffer) {
  // TODO: Implement this function
  // 1. Sum all bytes in the buffer
  // 2. While sum > 0xFFFF, add carry: sum = (sum & 0xFFFF) + (sum >> 16)
  // 3. Return ones' complement: ~sum & 0xFFFF
  // Your code here
}

// Test Task 3
try {
  const testData = Buffer.from([0x45, 0x00, 0x00, 0x3C, 0x1C, 0x46]);
  const checksum = calculateChecksum(testData);

  console.log('Test data:', testData);
  console.log('Checksum:', '0x' + checksum.toString(16));
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Create complete packet
console.log('Task 4: Create Complete Packet with Checksum');
/**
 * Create a complete packet with header, payload, and checksum
 * @param {Object} options - Header options
 * @param {Buffer} payload - Packet payload data
 * @returns {Buffer} Complete packet with checksum
 */
function createPacket(options, payload) {
  // TODO: Implement this function
  // 1. Create header (use createPacketHeader)
  // 2. Combine header + payload
  // 3. Calculate checksum
  // 4. Write checksum to header at offset 16
  // Your code here
}

// Test Task 4
try {
  const payload = Buffer.from('Hello, TCP!');
  const packet = createPacket({
    srcPort: 5000,
    destPort: 8080,
    seqNum: 100,
    ackNum: 200,
    flags: 0x18, // PSH + ACK
    windowSize: 4096
  }, payload);

  console.log('Complete packet:', packet.length, 'bytes');
  console.log('Header (20 bytes):', packet.slice(0, 20));
  console.log('Payload:', packet.slice(20).toString());
  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Verify packet checksum
console.log('Task 5: Verify Packet Checksum');
/**
 * Verify that a packet's checksum is valid
 * @param {Buffer} packet - Complete packet
 * @returns {boolean} True if checksum is valid
 */
function verifyChecksum(packet) {
  // TODO: Implement this function
  // 1. Extract checksum from header (offset 16)
  // 2. Set checksum field to 0 in a copy
  // 3. Calculate checksum of the modified packet
  // 4. Compare with extracted checksum
  // Your code here
}

// Test Task 5
try {
  const testPayload = Buffer.from('Test data');
  const testPacket = createPacket({
    srcPort: 1234,
    destPort: 5678,
    seqNum: 1,
    ackNum: 1,
    flags: 0x02,
    windowSize: 8192
  }, testPayload);

  const isValid = verifyChecksum(testPacket);
  console.log('Checksum valid:', isValid);

  // Corrupt the packet
  testPacket[25] = 0xFF;
  const isValidCorrupted = verifyChecksum(testPacket);
  console.log('Corrupted packet valid:', isValidCorrupted);

  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge 1: Flag helper functions
console.log('Bonus Challenge 1: Flag Helper Functions');
/**
 * Create helper functions for TCP flags
 */
const TCPFlags = {
  FIN: 0x01,
  SYN: 0x02,
  RST: 0x04,
  PSH: 0x08,
  ACK: 0x10,
  URG: 0x20
};

function hasFlag(flags, flag) {
  // TODO: Implement this function
  // Check if a specific flag is set
  // Your code here
}

function setFlag(flags, flag) {
  // TODO: Implement this function
  // Set a specific flag
  // Your code here
}

function clearFlag(flags, flag) {
  // TODO: Implement this function
  // Clear a specific flag
  // Your code here
}

function flagsToString(flags) {
  // TODO: Implement this function
  // Return a string like "SYN,ACK" for set flags
  // Your code here
}

// Test Bonus 1
try {
  let flags = 0;
  flags = setFlag(flags, TCPFlags.SYN);
  flags = setFlag(flags, TCPFlags.ACK);

  console.log('Flags value:', '0x' + flags.toString(16));
  console.log('Has SYN:', hasFlag(flags, TCPFlags.SYN));
  console.log('Has FIN:', hasFlag(flags, TCPFlags.FIN));
  console.log('Flags string:', flagsToString(flags));

  flags = clearFlag(flags, TCPFlags.SYN);
  console.log('After clearing SYN:', flagsToString(flags));

  console.log('✓ Bonus 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge 2: Packet stream processor
console.log('Bonus Challenge 2: Packet Stream Processor');
/**
 * Process a stream of packets and handle fragmentation
 */
class PacketStream {
  constructor() {
    // TODO: Initialize properties
    // Your code here
  }

  addPacket(packet) {
    // TODO: Add packet to stream
    // Track sequence numbers
    // Detect missing packets
    // Your code here
  }

  getPayload() {
    // TODO: Return combined payload in correct order
    // Your code here
  }

  isMissingPackets() {
    // TODO: Check if any packets are missing
    // Your code here
  }
}

// Test Bonus 2
try {
  const stream = new PacketStream();

  const pkt1 = createPacket({
    srcPort: 1000,
    destPort: 2000,
    seqNum: 100,
    ackNum: 0,
    flags: TCPFlags.SYN,
    windowSize: 8192
  }, Buffer.from('First'));

  const pkt2 = createPacket({
    srcPort: 1000,
    destPort: 2000,
    seqNum: 105,
    ackNum: 0,
    flags: TCPFlags.ACK,
    windowSize: 8192
  }, Buffer.from('Second'));

  stream.addPacket(pkt1);
  stream.addPacket(pkt2);

  console.log('Stream payload:', stream.getPayload());
  console.log('Missing packets:', stream.isMissingPackets());

  console.log('✓ Bonus 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 2 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
console.log('');
console.log('💡 Tips:');
console.log('  • Network protocols use big-endian (network byte order)');
console.log('  • Checksums detect transmission errors');
console.log('  • Flags are combined using bitwise OR');
console.log('  • Sequence numbers track packet order');
