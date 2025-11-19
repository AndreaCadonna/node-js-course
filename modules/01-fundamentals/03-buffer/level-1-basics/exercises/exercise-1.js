/**
 * Exercise 1: Buffer Creation and Conversion
 *
 * Practice creating buffers and converting between different formats.
 */

console.log('=== Exercise 1: Buffer Creation and Conversion ===\n');

// Task 1: Create a buffer from a hex string
console.log('Task 1: Convert hex string to buffer');
/**
 * Create a function that converts a hex string to a buffer
 * Example: '48656c6c6f' should become Buffer with 'Hello'
 */
function hexToBuffer(hexString) {
  // TODO: Implement this function
  // Your code here
}

// Test Task 1
try {
  const hex1 = '48656c6c6f';
  const result1 = hexToBuffer(hex1);
  console.log('Input:', hex1);
  console.log('Output:', result1);
  console.log('As string:', result1.toString());
  console.log('Expected: "Hello"');
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Convert buffer to different encodings
console.log('Task 2: Multi-encoding converter');
/**
 * Create a function that takes a string and returns an object
 * with the string encoded in different formats
 */
function encodeToAll(text) {
  // TODO: Implement this function
  // Should return: { utf8: Buffer, ascii: Buffer, hex: string, base64: string }
  // Your code here
}

// Test Task 2
try {
  const text2 = 'Node.js';
  const result2 = encodeToAll(text2);
  console.log('Input:', text2);
  console.log('Output:', result2);
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Safe buffer allocation
console.log('Task 3: Create a safe buffer allocator');
/**
 * Create a function that safely allocates a buffer and fills it with a pattern
 * If size is <= 0 or > 1024, throw an error
 * @param {number} size - Size of buffer to allocate
 * @param {number} fillValue - Value to fill (0-255)
 */
function safeAllocate(size, fillValue = 0) {
  // TODO: Implement this function with validation
  // Your code here
}

// Test Task 3
try {
  const safe1 = safeAllocate(10, 0xFF);
  console.log('safeAllocate(10, 0xFF):', safe1);

  const safe2 = safeAllocate(5, 65); // 'A' in ASCII
  console.log('safeAllocate(5, 65):', safe2.toString());

  // This should throw an error
  const safe3 = safeAllocate(2000, 0);
  console.log('✓ Task 3 tests passed\n');
} catch (err) {
  console.log('Caught expected error:', err.message);
  console.log('✓ Task 3 implementation needed\n');
}

// Task 4: Buffer copy with validation
console.log('Task 4: Safe buffer copy');
/**
 * Create a function that safely copies one buffer to another
 * Should validate that the source fits in the target
 * @returns {boolean} true if copy succeeded
 */
function safeCopy(source, target, targetStart = 0) {
  // TODO: Implement this function
  // Validate: targetStart >= 0
  // Validate: source.length + targetStart <= target.length
  // Copy if valid, throw error if not
  // Your code here
}

// Test Task 4
try {
  const source = Buffer.from('Hello');
  const target = Buffer.alloc(10);

  const success = safeCopy(source, target, 0);
  console.log('Copy succeeded:', success);
  console.log('Target buffer:', target.toString());
  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Byte length calculator
console.log('Task 5: Calculate byte lengths for different encodings');
/**
 * Create a function that calculates how many bytes a string will take
 * in different encodings
 */
function calculateByteLengths(text) {
  // TODO: Implement this function
  // Return: { utf8: number, ascii: number, utf16le: number }
  // Your code here
}

// Test Task 5
try {
  const text5 = 'Hello 世界';
  const lengths = calculateByteLengths(text5);
  console.log('Text:', text5);
  console.log('Byte lengths:', lengths);
  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge
console.log('Bonus Challenge: Buffer validator');
/**
 * Create a function that validates if a buffer contains valid UTF-8
 * @returns {boolean} true if valid UTF-8
 */
function isValidUTF8(buffer) {
  // TODO: Implement this function
  // Hint: Try to decode and catch errors
  // Your code here
}

// Test Bonus
try {
  const valid = Buffer.from('Hello', 'utf8');
  const invalid = Buffer.from([0xFF, 0xFE, 0xFD]);

  console.log('Valid UTF-8:', isValidUTF8(valid));
  console.log('Invalid UTF-8:', isValidUTF8(invalid));
  console.log('✓ Bonus implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 1 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
