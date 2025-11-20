/**
 * Exercise 1: File Integrity Checker
 *
 * OBJECTIVE:
 * Learn to create file hashes for verifying data integrity and comparing files.
 *
 * REQUIREMENTS:
 * 1. Create SHA-256 hashes of text content
 * 2. Verify data integrity by comparing hashes
 * 3. Support multiple hash algorithms
 * 4. Handle file content simulation
 * 5. Detect data tampering
 *
 * LEARNING GOALS:
 * - Understanding hash functions and their properties
 * - Using crypto.createHash() with different algorithms
 * - Working with hash digests in various formats
 * - Comparing hashes for integrity verification
 * - Understanding hash collision resistance
 */

const crypto = require('crypto');

console.log('=== Exercise 1: File Integrity Checker ===\n');

// Task 1: Create a basic hash function
console.log('Task 1: Create SHA-256 hash of text');
/**
 * TODO 1: Implement function to create a hash of text data
 *
 * Steps:
 * 1. Create a hash object using crypto.createHash('sha256')
 * 2. Update the hash with the input data
 * 3. Generate the digest as a hexadecimal string
 * 4. Return the hash
 *
 * @param {string} data - Data to hash
 * @returns {string} Hash in hexadecimal format
 *
 * Hint: Use hash.update(data) and hash.digest('hex')
 */
function createHash(data) {
  // Your code here
}

// Test Task 1
try {
  const content1 = 'Hello, World!';
  const hash1 = createHash(content1);
  console.log('Content:', content1);
  console.log('Hash:', hash1);
  console.log('Expected length: 64 characters (SHA-256)');
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Verify data integrity
console.log('Task 2: Verify data integrity by comparing hashes');
/**
 * TODO 2: Implement function to verify if data matches expected hash
 *
 * Steps:
 * 1. Create a hash of the provided data
 * 2. Compare it with the expected hash
 * 3. Return true if they match, false otherwise
 *
 * @param {string} data - Data to verify
 * @param {string} expectedHash - Expected hash value
 * @returns {boolean} True if data is valid
 *
 * Hint: Use the createHash function from Task 1
 * Hint: Use strict equality (===) to compare hashes
 */
function verifyIntegrity(data, expectedHash) {
  // Your code here
}

// Test Task 2
try {
  const originalData = 'Important document content';
  const correctHash = '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4'; // Pre-calculated
  const tamperedData = 'Important document content!'; // Modified

  const isValid = verifyIntegrity(originalData, correctHash);
  const isTampered = verifyIntegrity(tamperedData, correctHash);

  console.log('Original data is valid:', isValid, '(should be true)');
  console.log('Tampered data is valid:', isTampered, '(should be false)');
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Hash with different algorithms
console.log('Task 3: Create hash with different algorithms');
/**
 * TODO 3: Implement function to hash data with specified algorithm
 *
 * Steps:
 * 1. Accept algorithm name as parameter
 * 2. Create hash using the specified algorithm
 * 3. Return the hash in hexadecimal format
 * 4. Handle any errors gracefully
 *
 * @param {string} data - Data to hash
 * @param {string} algorithm - Hash algorithm (sha256, sha512, md5, etc.)
 * @returns {string} Hash in hexadecimal format
 *
 * Hint: Use crypto.createHash(algorithm)
 * Common algorithms: 'sha256', 'sha512', 'sha1' (avoid MD5 for security)
 */
function createHashWithAlgorithm(data, algorithm) {
  // Your code here
}

// Test Task 3
try {
  const testData = 'Test data for multiple algorithms';

  const sha256Hash = createHashWithAlgorithm(testData, 'sha256');
  const sha512Hash = createHashWithAlgorithm(testData, 'sha512');

  console.log('SHA-256 hash length:', sha256Hash?.length || 0, '(expected: 64)');
  console.log('SHA-512 hash length:', sha512Hash?.length || 0, '(expected: 128)');
  console.log('SHA-256:', sha256Hash);
  console.log('SHA-512:', sha512Hash);
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Create file checksum utility
console.log('Task 4: Create checksum utility for files');
/**
 * TODO 4: Implement a checksum utility class
 *
 * Steps:
 * 1. Store file content and its hash
 * 2. Implement method to calculate checksum
 * 3. Implement method to verify checksum
 * 4. Return checksum information
 *
 * This simulates file integrity checking
 */
class FileChecksum {
  constructor(filename, content) {
    this.filename = filename;
    this.content = content;
    this.checksum = null;
  }

  /**
   * TODO: Calculate and store the checksum
   * Use SHA-256 algorithm
   */
  calculateChecksum() {
    // Your code here
    // Store the result in this.checksum
  }

  /**
   * TODO: Verify if current content matches stored checksum
   * @returns {boolean} True if content is unchanged
   */
  verify() {
    // Your code here
    // Compare current content hash with stored checksum
  }

  /**
   * TODO: Get checksum information
   * @returns {Object} Object with filename, checksum, and status
   */
  getInfo() {
    // Your code here
    // Return object with: filename, checksum, verified status
  }
}

// Test Task 4
try {
  const file1 = new FileChecksum('document.txt', 'This is the original content');
  file1.calculateChecksum();

  console.log('Checksum info:', file1.getInfo());
  console.log('Verification before change:', file1.verify());

  // Simulate content change
  file1.content = 'This is modified content';
  console.log('Verification after change:', file1.verify(), '(should be false)');
  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Compare multiple files
console.log('Task 5: Compare multiple files by hash');
/**
 * TODO 5: Implement function to find duplicate content by comparing hashes
 *
 * Steps:
 * 1. Accept array of file objects with name and content
 * 2. Calculate hash for each file
 * 3. Find files with identical hashes
 * 4. Return groups of duplicate files
 *
 * @param {Array} files - Array of {name, content} objects
 * @returns {Array} Array of arrays, each containing duplicate files
 *
 * Hint: Use a Map to group files by their hash
 */
function findDuplicates(files) {
  // Your code here
  // Return array of duplicate groups (only groups with 2+ files)
}

// Test Task 5
try {
  const files = [
    { name: 'file1.txt', content: 'Identical content' },
    { name: 'file2.txt', content: 'Different content' },
    { name: 'file3.txt', content: 'Identical content' },
    { name: 'file4.txt', content: 'Unique content' },
    { name: 'file5.txt', content: 'Different content' }
  ];

  const duplicates = findDuplicates(files);
  console.log('Duplicate groups found:', duplicates?.length || 0);
  console.log('Duplicates:', duplicates);
  console.log('Expected: 2 groups (file1&file3, file2&file5)');
  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge
console.log('Bonus Challenge: Hash streaming data');
/**
 * TODO BONUS: Implement function to hash data in chunks
 *
 * This simulates streaming large files where you can't load everything at once.
 *
 * Steps:
 * 1. Create a hash object
 * 2. Update it with multiple chunks of data
 * 3. Return final digest
 *
 * @param {Array} chunks - Array of data chunks
 * @param {string} algorithm - Hash algorithm to use
 * @returns {string} Final hash
 *
 * Hint: You can call hash.update() multiple times before digest()
 */
function hashChunks(chunks, algorithm = 'sha256') {
  // Your code here
}

// Test Bonus
try {
  const chunks = ['First chunk ', 'second chunk ', 'third chunk'];
  const streamHash = hashChunks(chunks);
  const directHash = createHash(chunks.join(''));

  console.log('Stream hash:', streamHash);
  console.log('Direct hash:', directHash);
  console.log('Hashes match:', streamHash === directHash, '(should be true)');
  console.log('✓ Bonus implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 1 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
console.log('\nKey Takeaways:');
console.log('- Hashes are deterministic: same input = same output');
console.log('- Even tiny changes produce completely different hashes');
console.log('- Hashes are one-way: cannot reverse to get original data');
console.log('- Use SHA-256 or SHA-512 for security (avoid MD5, SHA-1)');
