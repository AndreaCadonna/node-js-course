/**
 * Exercise 3: Buffer Comparison and Searching
 *
 * Practice comparing buffers and searching for patterns.
 */

console.log('=== Exercise 3: Buffer Comparison and Searching ===\n');

// Task 1: Buffer equality checker
console.log('Task 1: Check if two buffers are equal');
/**
 * Create a function that checks if two buffers are equal
 * Don't use .equals() - implement it manually
 * @returns {boolean}
 */
function buffersEqual(buf1, buf2) {
  // TODO: Implement this function
  // Check length first (fast path)
  // Then compare byte by byte
  // Your code here
}

// Test Task 1
try {
  const a = Buffer.from('Hello');
  const b = Buffer.from('Hello');
  const c = Buffer.from('World');

  console.log('buffersEqual(a, b):', buffersEqual(a, b)); // Should be true
  console.log('buffersEqual(a, c):', buffersEqual(a, c)); // Should be false
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Find byte in buffer
console.log('Task 2: Find first occurrence of a byte');
/**
 * Create a function that finds the first occurrence of a byte
 * @param {Buffer} buffer - Buffer to search
 * @param {number} byte - Byte to find (0-255)
 * @param {number} start - Start position (default 0)
 * @returns {number} Index of first occurrence, or -1 if not found
 */
function indexOf(buffer, byte, start = 0) {
  // TODO: Implement this function
  // Your code here
}

// Test Task 2
try {
  const text = Buffer.from('Hello World');
  console.log('Text:', text.toString());

  const pos1 = indexOf(text, 0x6F); // 'o'
  console.log('First "o" at position:', pos1);

  const pos2 = indexOf(text, 0x6F, pos1 + 1); // Next 'o'
  console.log('Second "o" at position:', pos2);

  const pos3 = indexOf(text, 0x58); // 'X' - not found
  console.log('"X" position:', pos3);

  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Find sub-buffer (pattern matching)
console.log('Task 3: Find a sub-buffer within a buffer');
/**
 * Create a function that finds a pattern in a buffer
 * @param {Buffer} buffer - Buffer to search
 * @param {Buffer} pattern - Pattern to find
 * @returns {number} Index where pattern starts, or -1 if not found
 */
function indexOfBuffer(buffer, pattern) {
  // TODO: Implement this function
  // Slide the pattern across the buffer
  // Compare at each position
  // Your code here
}

// Test Task 3
try {
  const haystack = Buffer.from('The quick brown fox');
  const needle1 = Buffer.from('quick');
  const needle2 = Buffer.from('slow');

  console.log('Text:', haystack.toString());
  console.log('"quick" found at:', indexOfBuffer(haystack, needle1));
  console.log('"slow" found at:', indexOfBuffer(haystack, needle2));

  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Compare buffers lexicographically
console.log('Task 4: Lexicographic comparison');
/**
 * Create a function that compares two buffers
 * Don't use .compare() - implement it manually
 * @returns {number} -1 if buf1 < buf2, 0 if equal, 1 if buf1 > buf2
 */
function compareBuffers(buf1, buf2) {
  // TODO: Implement this function
  // Compare byte by byte
  // If all bytes equal but different lengths, shorter is "less"
  // Your code here
}

// Test Task 4
try {
  const abc = Buffer.from('abc');
  const def = Buffer.from('def');
  const abc2 = Buffer.from('abc');

  console.log('compareBuffers(abc, def):', compareBuffers(abc, def)); // -1
  console.log('compareBuffers(def, abc):', compareBuffers(def, abc)); // 1
  console.log('compareBuffers(abc, abc2):', compareBuffers(abc, abc2)); // 0

  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Find all occurrences
console.log('Task 5: Find all occurrences of a byte');
/**
 * Create a function that finds all positions where a byte occurs
 * @param {Buffer} buffer - Buffer to search
 * @param {number} byte - Byte to find (0-255)
 * @returns {number[]} Array of indices
 */
function findAll(buffer, byte) {
  // TODO: Implement this function
  // Return array of all positions where byte is found
  // Your code here
}

// Test Task 5
try {
  const text = Buffer.from('Mississippi');
  console.log('Text:', text.toString());

  const positions = findAll(text, 0x69); // 'i'
  console.log('Positions of "i":', positions);

  const sPositions = findAll(text, 0x73); // 's'
  console.log('Positions of "s":', sPositions);

  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge 1: Case-insensitive comparison
console.log('Bonus Challenge 1: Case-insensitive equals');
/**
 * Create a function that compares buffers ignoring case (for ASCII text)
 * @returns {boolean}
 */
function equalsIgnoreCase(buf1, buf2) {
  // TODO: Implement this function
  // Convert both to lowercase and compare
  // Or compare bytes with case adjustment
  // Your code here
}

// Test Bonus 1
try {
  const upper = Buffer.from('HELLO');
  const lower = Buffer.from('hello');
  const mixed = Buffer.from('HeLLo');

  console.log('equalsIgnoreCase(upper, lower):', equalsIgnoreCase(upper, lower));
  console.log('equalsIgnoreCase(upper, mixed):', equalsIgnoreCase(upper, mixed));

  console.log('✓ Bonus 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge 2: Find and count pattern
console.log('Bonus Challenge 2: Count pattern occurrences');
/**
 * Create a function that counts how many times a pattern appears
 * @param {Buffer} buffer - Buffer to search
 * @param {Buffer} pattern - Pattern to count
 * @returns {number} Number of occurrences
 */
function countOccurrences(buffer, pattern) {
  // TODO: Implement this function
  // Find all occurrences and count them
  // Your code here
}

// Test Bonus 2
try {
  const text = Buffer.from('abababab');
  const pattern = Buffer.from('ab');

  const count = countOccurrences(text, pattern);
  console.log('Text:', text.toString());
  console.log('Pattern:', pattern.toString());
  console.log('Occurrences:', count);

  console.log('✓ Bonus 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 3 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
