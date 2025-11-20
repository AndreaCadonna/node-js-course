/**
 * Exercise 1: File Integrity Checker - SOLUTION
 *
 * This solution demonstrates:
 * - Creating hashes with different algorithms
 * - Verifying data integrity
 * - Detecting data tampering
 * - Working with hash digests in various formats
 * - Streaming hash updates
 */

const crypto = require('crypto');

console.log('=== Exercise 1: File Integrity Checker - SOLUTION ===\n');

// ============================================================================
// Task 1: Create a basic hash function
// ============================================================================
console.log('Task 1: Create SHA-256 hash of text');

/**
 * Creates a SHA-256 hash of the provided data
 *
 * APPROACH:
 * 1. Create a hash object using crypto.createHash()
 * 2. Update it with the input data
 * 3. Generate the final digest as hexadecimal
 *
 * KEY CONCEPTS:
 * - Hash functions are one-way: you cannot reverse them
 * - Same input always produces same output (deterministic)
 * - Even tiny changes produce completely different hashes
 * - Output length is fixed regardless of input size
 *
 * @param {string} data - Data to hash
 * @returns {string} Hash in hexadecimal format
 */
function createHash(data) {
  // Create a hash object with SHA-256 algorithm
  const hash = crypto.createHash('sha256');

  // Update the hash with data (can be called multiple times)
  hash.update(data);

  // Generate and return the final digest as hex string
  return hash.digest('hex');
}

// ALTERNATIVE APPROACH: One-liner using method chaining
function createHashOneLiner(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Test Task 1
try {
  const content1 = 'Hello, World!';
  const hash1 = createHash(content1);
  const hash1Alt = createHashOneLiner(content1);

  console.log('Content:', content1);
  console.log('Hash:', hash1);
  console.log('Alternative approach:', hash1Alt);
  console.log('Length: 64 characters (256 bits / 4 bits per hex char)');
  console.log('Both methods match:', hash1 === hash1Alt);
  console.log('✓ Task 1 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 2: Verify data integrity
// ============================================================================
console.log('Task 2: Verify data integrity by comparing hashes');

/**
 * Verifies if data matches the expected hash
 *
 * APPROACH:
 * 1. Create a hash of the provided data
 * 2. Compare it with the expected hash using strict equality
 * 3. Return true if they match
 *
 * SECURITY NOTE:
 * - For simple comparison, === is fine
 * - For comparing secrets (like HMAC), use crypto.timingSafeEqual()
 *   to prevent timing attacks
 *
 * @param {string} data - Data to verify
 * @param {string} expectedHash - Expected hash value
 * @returns {boolean} True if data is valid
 */
function verifyIntegrity(data, expectedHash) {
  // Hash the data
  const actualHash = createHash(data);

  // Compare with expected hash
  // For simple integrity checks, strict equality is sufficient
  return actualHash === expectedHash;
}

// ALTERNATIVE APPROACH: Using timing-safe comparison (overkill here, but good practice)
function verifyIntegritySafe(data, expectedHash) {
  const actualHash = createHash(data);

  try {
    // Convert both hashes to Buffers for timing-safe comparison
    const actualBuffer = Buffer.from(actualHash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    // This prevents timing attacks by always comparing all bytes
    return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
  } catch (err) {
    // If lengths don't match or conversion fails, hashes don't match
    return false;
  }
}

// Test Task 2
try {
  const originalData = 'Important document content';
  const correctHash = createHash(originalData);
  const tamperedData = 'Important document content!'; // Modified

  const isValid = verifyIntegrity(originalData, correctHash);
  const isTampered = verifyIntegrity(tamperedData, correctHash);
  const isValidSafe = verifyIntegritySafe(originalData, correctHash);

  console.log('Original data is valid:', isValid, '✓');
  console.log('Tampered data is valid:', isTampered, '(correctly rejected)');
  console.log('Timing-safe verification:', isValidSafe, '✓');
  console.log('Expected hash:', correctHash);
  console.log('✓ Task 2 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 3: Hash with different algorithms
// ============================================================================
console.log('Task 3: Create hash with different algorithms');

/**
 * Creates a hash using the specified algorithm
 *
 * APPROACH:
 * 1. Accept algorithm name as parameter
 * 2. Create hash with that algorithm
 * 3. Return the digest
 *
 * COMMON ALGORITHMS:
 * - SHA-256: 256-bit output, good security/performance balance
 * - SHA-512: 512-bit output, higher security
 * - SHA-1: Deprecated, broken for security purposes
 * - MD5: Deprecated, broken for security purposes
 *
 * SECURITY RECOMMENDATION:
 * - Use SHA-256 or SHA-512 for new applications
 * - Avoid MD5 and SHA-1 for security-critical applications
 *
 * @param {string} data - Data to hash
 * @param {string} algorithm - Hash algorithm
 * @returns {string} Hash in hexadecimal format
 */
function createHashWithAlgorithm(data, algorithm) {
  try {
    return crypto.createHash(algorithm).update(data).digest('hex');
  } catch (err) {
    throw new Error(`Unsupported algorithm '${algorithm}': ${err.message}`);
  }
}

// ALTERNATIVE APPROACH: With algorithm validation
function createHashWithAlgorithmSafe(data, algorithm) {
  // Get list of supported algorithms
  const supportedAlgorithms = crypto.getHashes();

  if (!supportedAlgorithms.includes(algorithm)) {
    throw new Error(`Algorithm '${algorithm}' is not supported. Use one of: ${supportedAlgorithms.slice(0, 5).join(', ')}, ...`);
  }

  return crypto.createHash(algorithm).update(data).digest('hex');
}

// Test Task 3
try {
  const testData = 'Test data for multiple algorithms';

  const sha256Hash = createHashWithAlgorithm(testData, 'sha256');
  const sha512Hash = createHashWithAlgorithm(testData, 'sha512');
  const sha1Hash = createHashWithAlgorithm(testData, 'sha1'); // Deprecated

  console.log('SHA-256 hash length:', sha256Hash.length, '(64 chars = 256 bits)');
  console.log('SHA-512 hash length:', sha512Hash.length, '(128 chars = 512 bits)');
  console.log('SHA-1 hash length:', sha1Hash.length, '(40 chars = 160 bits)');
  console.log('\nSHA-256:', sha256Hash);
  console.log('SHA-512:', sha512Hash);
  console.log('SHA-1:', sha1Hash, '(deprecated, use SHA-256+)');

  // List available algorithms
  const algorithms = crypto.getHashes();
  console.log(`\nAvailable algorithms: ${algorithms.length} total`);
  console.log('Examples:', algorithms.slice(0, 10).join(', '), '...');
  console.log('✓ Task 3 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 4: Create file checksum utility
// ============================================================================
console.log('Task 4: Create checksum utility for files');

/**
 * File checksum utility class
 *
 * This simulates file integrity checking by:
 * - Storing content and its checksum
 * - Detecting if content changes
 * - Providing verification methods
 */
class FileChecksum {
  constructor(filename, content) {
    this.filename = filename;
    this.content = content;
    this.checksum = null;
    this.algorithm = 'sha256';
  }

  /**
   * Calculate and store the checksum
   *
   * IMPLEMENTATION NOTES:
   * - Stores checksum for later verification
   * - Uses SHA-256 by default
   * - Can be called multiple times (recalculates)
   */
  calculateChecksum() {
    this.checksum = crypto
      .createHash(this.algorithm)
      .update(this.content)
      .digest('hex');
    return this.checksum;
  }

  /**
   * Verify if current content matches stored checksum
   *
   * VERIFICATION LOGIC:
   * - Calculates fresh hash of current content
   * - Compares with stored checksum
   * - Returns false if no checksum exists
   *
   * @returns {boolean} True if content is unchanged
   */
  verify() {
    if (!this.checksum) {
      return false; // No checksum to verify against
    }

    const currentHash = crypto
      .createHash(this.algorithm)
      .update(this.content)
      .digest('hex');

    return currentHash === this.checksum;
  }

  /**
   * Get checksum information
   *
   * @returns {Object} Object with filename, checksum, and status
   */
  getInfo() {
    return {
      filename: this.filename,
      checksum: this.checksum,
      algorithm: this.algorithm,
      verified: this.verify(),
      contentLength: this.content.length
    };
  }
}

// ALTERNATIVE APPROACH: With multiple algorithm support
class FileChecksumAdvanced extends FileChecksum {
  constructor(filename, content, algorithm = 'sha256') {
    super(filename, content);
    this.algorithm = algorithm;
    this.checksums = {}; // Store multiple checksums
  }

  /**
   * Calculate checksums with multiple algorithms
   */
  calculateMultiple(algorithms = ['sha256', 'sha512']) {
    algorithms.forEach(algo => {
      this.checksums[algo] = crypto
        .createHash(algo)
        .update(this.content)
        .digest('hex');
    });
    return this.checksums;
  }

  /**
   * Verify against multiple checksums
   */
  verifyMultiple() {
    const results = {};
    for (const [algo, checksum] of Object.entries(this.checksums)) {
      const current = crypto.createHash(algo).update(this.content).digest('hex');
      results[algo] = current === checksum;
    }
    return results;
  }
}

// Test Task 4
try {
  const file1 = new FileChecksum('document.txt', 'This is the original content');
  file1.calculateChecksum();

  console.log('File info:', file1.getInfo());
  console.log('Verification before change:', file1.verify(), '✓');

  // Simulate content change
  file1.content = 'This is modified content';
  console.log('Verification after change:', file1.verify(), '(correctly detected change)');

  // Test advanced version
  const file2 = new FileChecksumAdvanced('secure.txt', 'Important data');
  const checksums = file2.calculateMultiple(['sha256', 'sha512', 'sha1']);
  console.log('\nMultiple checksums:', checksums);
  console.log('All verified:', file2.verifyMultiple());
  console.log('✓ Task 4 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 5: Compare multiple files
// ============================================================================
console.log('Task 5: Compare multiple files by hash');

/**
 * Finds duplicate files by comparing their content hashes
 *
 * APPROACH:
 * 1. Use a Map to group files by their hash
 * 2. Calculate hash for each file's content
 * 3. Return only groups with 2+ files (duplicates)
 *
 * EFFICIENCY NOTES:
 * - Single pass through all files: O(n)
 * - Hash calculation is the bottleneck
 * - Memory efficient: only stores hashes, not full content
 *
 * @param {Array} files - Array of {name, content} objects
 * @returns {Array} Array of arrays, each containing duplicate files
 */
function findDuplicates(files) {
  // Map to group files by their hash
  const hashMap = new Map();

  // Calculate hash for each file and group by hash
  for (const file of files) {
    const hash = createHash(file.content);

    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }

    hashMap.get(hash).push(file);
  }

  // Return only groups with 2 or more files (duplicates)
  return Array.from(hashMap.values()).filter(group => group.length >= 2);
}

// ALTERNATIVE APPROACH: With detailed statistics
function findDuplicatesDetailed(files) {
  const hashMap = new Map();

  for (const file of files) {
    const hash = createHash(file.content);

    if (!hashMap.has(hash)) {
      hashMap.set(hash, {
        hash,
        files: [],
        size: file.content.length,
        count: 0
      });
    }

    const group = hashMap.get(hash);
    group.files.push(file);
    group.count++;
  }

  const duplicateGroups = Array.from(hashMap.values())
    .filter(group => group.count >= 2);

  return {
    groups: duplicateGroups,
    totalFiles: files.length,
    uniqueFiles: hashMap.size,
    duplicateCount: duplicateGroups.reduce((sum, g) => sum + g.count, 0),
    spaceSavings: duplicateGroups.reduce((sum, g) => sum + g.size * (g.count - 1), 0)
  };
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
  console.log('Duplicate groups found:', duplicates.length);
  console.log('Duplicates:');
  duplicates.forEach((group, i) => {
    console.log(`  Group ${i + 1}:`, group.map(f => f.name).join(', '));
  });

  // Detailed analysis
  const detailed = findDuplicatesDetailed(files);
  console.log('\nDetailed analysis:', {
    totalFiles: detailed.totalFiles,
    uniqueFiles: detailed.uniqueFiles,
    duplicateFiles: detailed.duplicateCount
  });
  console.log('✓ Task 5 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Bonus Challenge: Hash streaming data
// ============================================================================
console.log('Bonus Challenge: Hash streaming data');

/**
 * Hashes data in chunks (simulates streaming large files)
 *
 * WHY THIS MATTERS:
 * - Large files can't fit in memory
 * - Streaming allows processing data in chunks
 * - Hash.update() can be called multiple times
 * - Final result is same as hashing all data at once
 *
 * REAL-WORLD USE:
 * - Reading large files from disk
 * - Processing network streams
 * - Verifying downloads in progress
 *
 * @param {Array} chunks - Array of data chunks
 * @param {string} algorithm - Hash algorithm to use
 * @returns {string} Final hash
 */
function hashChunks(chunks, algorithm = 'sha256') {
  // Create hash object once
  const hash = crypto.createHash(algorithm);

  // Update with each chunk
  for (const chunk of chunks) {
    hash.update(chunk);
  }

  // Generate final digest
  return hash.digest('hex');
}

// ALTERNATIVE APPROACH: Simulating file stream processing
function hashStream(data, chunkSize = 1024) {
  const hash = crypto.createHash('sha256');

  // Process data in chunks
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    hash.update(chunk);
  }

  return hash.digest('hex');
}

// REAL-WORLD EXAMPLE: Hash a file stream
function createFileHashExample(filepath) {
  // NOTE: This is a conceptual example
  // In real code, use fs.createReadStream()

  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    // const stream = fs.createReadStream(filepath);

    // stream.on('data', chunk => hash.update(chunk));
    // stream.on('end', () => resolve(hash.digest('hex')));
    // stream.on('error', reject);

    // For demonstration:
    console.log('  In real code: fs.createReadStream(filepath).pipe(hash)');
    resolve('example-hash');
  });
}

// Test Bonus
try {
  const chunks = ['First chunk ', 'second chunk ', 'third chunk'];
  const streamHash = hashChunks(chunks);
  const directHash = createHash(chunks.join(''));

  console.log('Stream hash:', streamHash);
  console.log('Direct hash:', directHash);
  console.log('Hashes match:', streamHash === directHash, '✓');
  console.log('This proves hash.update() can be called multiple times!');

  // Test chunk processing
  const largeData = 'x'.repeat(10000); // 10KB of data
  const streamedHash = hashStream(largeData, 1024);
  const normalHash = createHash(largeData);
  console.log('\nLarge data (10KB) streamed vs normal:', streamedHash === normalHash, '✓');
  console.log('✓ Bonus Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Additional Examples: Best Practices
// ============================================================================
console.log('=== Best Practices & Additional Examples ===\n');

// Example 1: Hash comparison best practices
function compareHashes(hash1, hash2) {
  // Always ensure same encoding before comparison
  const buffer1 = Buffer.from(hash1, 'hex');
  const buffer2 = Buffer.from(hash2, 'hex');

  // Use timing-safe comparison for security-sensitive scenarios
  try {
    return crypto.timingSafeEqual(buffer1, buffer2);
  } catch {
    return false; // Different lengths or invalid encoding
  }
}

// Example 2: Multi-format hash output
function createHashMultiFormat(data) {
  const hash = crypto.createHash('sha256').update(data);

  // Note: Can only call digest() once per hash object!
  // So we need to create hash multiple times for different formats
  return {
    hex: crypto.createHash('sha256').update(data).digest('hex'),
    base64: crypto.createHash('sha256').update(data).digest('base64'),
    buffer: crypto.createHash('sha256').update(data).digest()
  };
}

// Example 3: Error handling
function safeHash(data, algorithm = 'sha256') {
  try {
    if (!data) {
      throw new Error('Data is required');
    }

    return {
      success: true,
      hash: crypto.createHash(algorithm).update(data).digest('hex'),
      algorithm
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      algorithm
    };
  }
}

// Test examples
console.log('1. Safe hash comparison:', compareHashes('abc123', 'abc123'));
console.log('2. Multi-format output:', createHashMultiFormat('test'));
console.log('3. Error handling:', safeHash('valid data'));
console.log('4. Error handling (invalid):', safeHash('', 'invalid-algo'));

console.log('\n=== Exercise 1 Complete ===');
console.log('\nKey Takeaways:');
console.log('✓ Hashes are deterministic: same input = same output');
console.log('✓ Even tiny changes produce completely different hashes');
console.log('✓ Hashes are one-way: cannot reverse to get original data');
console.log('✓ Use SHA-256 or SHA-512 for security (avoid MD5, SHA-1)');
console.log('✓ Hash.update() can be called multiple times for streaming');
console.log('✓ Use crypto.timingSafeEqual() for secure comparisons');
console.log('✓ Different algorithms produce different length outputs');
console.log('✓ Hashes are perfect for: integrity verification, deduplication, checksums');
