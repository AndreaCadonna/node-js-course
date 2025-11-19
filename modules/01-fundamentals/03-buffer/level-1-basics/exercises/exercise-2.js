/**
 * Exercise 2: Working with Binary Data
 *
 * Practice reading, writing, and manipulating binary data.
 */

console.log('=== Exercise 2: Working with Binary Data ===\n');

// Task 1: Binary data inspector
console.log('Task 1: Create a binary inspector');
/**
 * Create a function that analyzes a buffer and returns information about it
 * @returns {object} { length, firstByte, lastByte, hasNullBytes, allPrintable }
 */
function inspectBuffer(buffer) {
  // TODO: Implement this function
  // Check if all bytes are printable ASCII (32-126)
  // Check if buffer contains null bytes (0x00)
  // Your code here
}

// Test Task 1
try {
  const test1 = Buffer.from('Hello');
  const test2 = Buffer.from([0x00, 0x01, 0x02]);
  const test3 = Buffer.from([0xFF, 0xFE, 0xFD]);

  console.log('Buffer 1:', inspectBuffer(test1));
  console.log('Buffer 2:', inspectBuffer(test2));
  console.log('Buffer 3:', inspectBuffer(test3));
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Byte frequency counter
console.log('Task 2: Count byte frequencies');
/**
 * Create a function that counts how many times each byte value appears
 * @returns {Map} Map of byte value to count
 */
function countByteFrequency(buffer) {
  // TODO: Implement this function
  // Return a Map with byte values as keys and counts as values
  // Your code here
}

// Test Task 2
try {
  const data = Buffer.from('HELLO WORLD');
  const freq = countByteFrequency(data);
  console.log('Text:', data.toString());
  console.log('Frequencies:');
  for (const [byte, count] of freq) {
    const char = String.fromCharCode(byte);
    console.log(`  ${char} (${byte}): ${count}`);
  }
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Find and replace bytes
console.log('Task 3: Find and replace byte values');
/**
 * Create a function that replaces all occurrences of one byte with another
 * @param {Buffer} buffer - Buffer to modify (modified in place)
 * @param {number} findByte - Byte to find (0-255)
 * @param {number} replaceByte - Byte to replace with (0-255)
 * @returns {number} Number of replacements made
 */
function replaceBytes(buffer, findByte, replaceByte) {
  // TODO: Implement this function
  // Modify the buffer in place
  // Return count of replacements
  // Your code here
}

// Test Task 3
try {
  const text = Buffer.from('Hello World');
  console.log('Before:', text.toString());

  const count = replaceBytes(text, 0x6F, 0x30); // Replace 'o' with '0'
  console.log('After:', text.toString());
  console.log('Replacements:', count);
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: XOR cipher
console.log('Task 4: Simple XOR encryption/decryption');
/**
 * Create a function that XORs each byte with a key
 * XOR is its own inverse, so same function encrypts and decrypts
 * @param {Buffer} buffer - Data to encrypt/decrypt
 * @param {number} key - XOR key (0-255)
 * @returns {Buffer} New buffer with XOR applied
 */
function xorCipher(buffer, key) {
  // TODO: Implement this function
  // Create a new buffer with XOR applied
  // Don't modify the original
  // Your code here
}

// Test Task 4
try {
  const plaintext = Buffer.from('SECRET MESSAGE');
  const key = 0x42;

  console.log('Plaintext:', plaintext.toString());

  const encrypted = xorCipher(plaintext, key);
  console.log('Encrypted:', encrypted);

  const decrypted = xorCipher(encrypted, key);
  console.log('Decrypted:', decrypted.toString());

  console.log('Match:', plaintext.equals(decrypted));
  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Checksum calculator
console.log('Task 5: Calculate simple checksum');
/**
 * Create a function that calculates a simple checksum
 * Sum all bytes and return the last byte (sum & 0xFF)
 * @returns {number} Checksum (0-255)
 */
function calculateChecksum(buffer) {
  // TODO: Implement this function
  // Sum all bytes
  // Return sum % 256 (or sum & 0xFF)
  // Your code here
}

/**
 * Create a function that verifies a message with checksum
 * @param {Buffer} buffer - Buffer where last byte is the checksum
 * @returns {boolean} true if checksum is valid
 */
function verifyChecksum(buffer) {
  // TODO: Implement this function
  // Calculate checksum of all bytes except last
  // Compare with last byte
  // Your code here
}

// Test Task 5
try {
  const message = Buffer.from('Hello World');
  const checksum = calculateChecksum(message);
  console.log('Message:', message.toString());
  console.log('Checksum:', checksum);

  // Create message with checksum appended
  const withChecksum = Buffer.concat([message, Buffer.from([checksum])]);
  const valid = verifyChecksum(withChecksum);
  console.log('Verification:', valid ? '✓ Valid' : '✗ Invalid');

  // Corrupt the message
  withChecksum[0] ^= 0xFF;
  const corrupted = verifyChecksum(withChecksum);
  console.log('Corrupted:', corrupted ? '✓ Valid' : '✗ Invalid');

  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge: Hex dumper
console.log('Bonus Challenge: Create a hex dump function');
/**
 * Create a function that displays buffer in hex dump format
 * Format: OFFSET  HEX_BYTES  ASCII
 */
function hexDump(buffer, bytesPerLine = 16) {
  // TODO: Implement this function
  // Format each line: "00000000  48 65 6c 6c 6f  Hello"
  // Replace non-printable characters with '.'
  // Your code here
}

// Test Bonus
try {
  const data = Buffer.from('Hello, World! This is a test of hex dump.');
  console.log('Hex dump:');
  hexDump(data);
  console.log('✓ Bonus implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 2 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
