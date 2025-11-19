/**
 * Exercise 4: Buffer Concatenation and Manipulation
 *
 * Practice joining and manipulating multiple buffers.
 */

console.log('=== Exercise 4: Buffer Concatenation ===\n');

// Task 1: Simple buffer joiner
console.log('Task 1: Join multiple buffers');
/**
 * Create a function that joins multiple buffers
 * Don't use Buffer.concat() - implement it manually
 * @param {Buffer[]} buffers - Array of buffers to join
 * @returns {Buffer} Combined buffer
 */
function joinBuffers(buffers) {
  // TODO: Implement this function
  // Calculate total length
  // Create new buffer
  // Copy each buffer into position
  // Your code here
}

// Test Task 1
try {
  const parts = [
    Buffer.from('Hello'),
    Buffer.from(' '),
    Buffer.from('World')
  ];

  const joined = joinBuffers(parts);
  console.log('Parts:', parts.map(p => p.toString()));
  console.log('Joined:', joined.toString());

  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Join with separator
console.log('Task 2: Join buffers with separator');
/**
 * Create a function that joins buffers with a separator between them
 * @param {Buffer[]} buffers - Array of buffers
 * @param {Buffer} separator - Separator buffer
 * @returns {Buffer} Combined buffer with separators
 */
function joinWithSeparator(buffers, separator) {
  // TODO: Implement this function
  // Insert separator between each buffer (not at start/end)
  // Your code here
}

// Test Task 2
try {
  const words = [
    Buffer.from('apple'),
    Buffer.from('banana'),
    Buffer.from('cherry')
  ];
  const comma = Buffer.from(',');

  const csv = joinWithSeparator(words, comma);
  console.log('Words:', words.map(w => w.toString()));
  console.log('CSV:', csv.toString());

  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Buffer builder class
console.log('Task 3: Implement a BufferBuilder class');
/**
 * Create a class that builds buffers efficiently
 * Methods: append(buffer), appendString(str, encoding), build(), reset()
 */
class BufferBuilder {
  constructor() {
    // TODO: Initialize properties
    // Your code here
  }

  append(buffer) {
    // TODO: Add buffer to collection
    // Your code here
  }

  appendString(str, encoding = 'utf8') {
    // TODO: Convert string to buffer and append
    // Your code here
  }

  build() {
    // TODO: Concatenate all buffers and return
    // Your code here
  }

  reset() {
    // TODO: Clear all buffers
    // Your code here
  }

  get length() {
    // TODO: Return total length of all buffers
    // Your code here
  }
}

// Test Task 3
try {
  const builder = new BufferBuilder();
  builder.appendString('Hello ');
  builder.appendString('World');
  builder.append(Buffer.from('!'));

  console.log('Total length:', builder.length);

  const result = builder.build();
  console.log('Built:', result.toString());

  builder.reset();
  console.log('After reset:', builder.length);

  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Split buffer
console.log('Task 4: Split buffer by delimiter');
/**
 * Create a function that splits a buffer by a delimiter byte
 * @param {Buffer} buffer - Buffer to split
 * @param {number} delimiter - Delimiter byte (e.g., 0x0A for newline)
 * @returns {Buffer[]} Array of buffer segments
 */
function splitBuffer(buffer, delimiter) {
  // TODO: Implement this function
  // Find all positions of delimiter
  // Extract segments between delimiters
  // Your code here
}

// Test Task 4
try {
  const lines = Buffer.from('line1\nline2\nline3');
  const segments = splitBuffer(lines, 0x0A); // Split by newline

  console.log('Original:', lines.toString());
  console.log('Split into', segments.length, 'parts:');
  segments.forEach((seg, i) => console.log(`  [${i}]:`, seg.toString()));

  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Pad buffer
console.log('Task 5: Pad buffer to specified length');
/**
 * Create functions to pad a buffer with zeros
 * @param {Buffer} buffer - Buffer to pad
 * @param {number} length - Target length
 * @returns {Buffer} Padded buffer
 */
function padRight(buffer, length, padByte = 0) {
  // TODO: Implement this function
  // Add padding to the right (end)
  // Your code here
}

function padLeft(buffer, length, padByte = 0) {
  // TODO: Implement this function
  // Add padding to the left (start)
  // Your code here
}

// Test Task 5
try {
  const short = Buffer.from('Hi');

  const rightPadded = padRight(short, 10, 0x20); // Pad with spaces
  console.log('Right padded:', `"${rightPadded.toString()}"`);
  console.log('Length:', rightPadded.length);

  const leftPadded = padLeft(short, 10, 0x2E); // Pad with dots
  console.log('Left padded:', `"${leftPadded.toString()}"`);
  console.log('Length:', leftPadded.length);

  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge: Efficient chunk collector
console.log('Bonus Challenge: Stream-like chunk collector');
/**
 * Create a class that collects chunks efficiently
 * and processes them when a complete message is received
 */
class ChunkCollector {
  constructor(expectedSize) {
    // TODO: Initialize with expected message size
    // Your code here
  }

  add(chunk) {
    // TODO: Add chunk to collection
    // Return true if we have collected enough
    // Your code here
  }

  getData() {
    // TODO: Return concatenated buffer
    // Your code here
  }

  reset() {
    // TODO: Clear collected chunks
    // Your code here
  }

  get bytesCollected() {
    // TODO: Return how many bytes collected so far
    // Your code here
  }

  get bytesRemaining() {
    // TODO: Return how many bytes still needed
    // Your code here
  }
}

// Test Bonus
try {
  const collector = new ChunkCollector(20);

  console.log('Expecting 20 bytes');

  const chunk1 = Buffer.from('Hello ');
  console.log('Add chunk 1:', collector.add(chunk1), '- bytes collected:', collector.bytesCollected);

  const chunk2 = Buffer.from('World!');
  console.log('Add chunk 2:', collector.add(chunk2), '- bytes collected:', collector.bytesCollected);

  const chunk3 = Buffer.from(' Complete');
  console.log('Add chunk 3:', collector.add(chunk3), '- complete:', collector.bytesCollected >= 20);

  const data = collector.getData();
  console.log('Final data:', data.toString());

  console.log('✓ Bonus implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 4 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
