/**
 * Basic Hashing Examples
 *
 * Demonstrates how to create hashes using the crypto module.
 * Hashing is used for data integrity, password storage, and fingerprinting.
 */

const crypto = require('crypto');

console.log('=== Basic Hashing Examples ===\n');

// Example 1: Simple SHA-256 Hash
console.log('1. Simple SHA-256 Hash:');
const hash1 = crypto.createHash('sha256');
hash1.update('Hello World');
console.log('Input: "Hello World"');
console.log('SHA-256:', hash1.digest('hex'));
console.log();

// Example 2: Hash the Same Data Again (Deterministic)
console.log('2. Hashing is Deterministic:');
const hash2 = crypto.createHash('sha256');
hash2.update('Hello World');
console.log('Input: "Hello World" (same as before)');
console.log('SHA-256:', hash2.digest('hex'));
console.log('Notice: Same input = Same hash');
console.log();

// Example 3: Small Change = Completely Different Hash
console.log('3. Avalanche Effect (small change = big difference):');
const hash3a = crypto.createHash('sha256');
hash3a.update('Hello World');
console.log('Input: "Hello World"');
console.log('Hash:', hash3a.digest('hex'));

const hash3b = crypto.createHash('sha256');
hash3b.update('Hello World!'); // Added exclamation mark
console.log('\nInput: "Hello World!" (added !)');
console.log('Hash:', hash3b.digest('hex'));
console.log('Notice: Completely different hashes');
console.log();

// Example 4: Different Hash Algorithms
console.log('4. Different Hash Algorithms:');
const data = 'Test Data';
console.log('Input:', data);

const md5 = crypto.createHash('md5').update(data).digest('hex');
const sha1 = crypto.createHash('sha1').update(data).digest('hex');
const sha256 = crypto.createHash('sha256').update(data).digest('hex');
const sha512 = crypto.createHash('sha512').update(data).digest('hex');

console.log('MD5:    ', md5, `(${md5.length} chars - DON'T USE FOR SECURITY)`);
console.log('SHA-1:  ', sha1, `(${sha1.length} chars - DON'T USE FOR SECURITY)`);
console.log('SHA-256:', sha256, `(${sha256.length} chars - RECOMMENDED)`);
console.log('SHA-512:', sha512, `(${sha512.length} chars - RECOMMENDED)`);
console.log();

// Example 5: Multiple Updates
console.log('5. Multiple Updates (same result):');
const hashA = crypto.createHash('sha256');
hashA.update('Hello');
hashA.update(' ');
hashA.update('World');
console.log('Method A - Multiple updates:');
console.log(hashA.digest('hex'));

const hashB = crypto.createHash('sha256');
hashB.update('Hello World');
console.log('\nMethod B - Single update:');
console.log(hashB.digest('hex'));
console.log('Notice: Same result');
console.log();

// Example 6: Different Output Formats
console.log('6. Different Output Formats:');
const input = 'Output Formats';
console.log('Input:', input);

const hashHex = crypto.createHash('sha256').update(input).digest('hex');
const hashBase64 = crypto.createHash('sha256').update(input).digest('base64');
const hashBuffer = crypto.createHash('sha256').update(input).digest();

console.log('Hex:    ', hashHex);
console.log('Base64: ', hashBase64);
console.log('Buffer: ', hashBuffer);
console.log('Buffer length:', hashBuffer.length, 'bytes');
console.log();

// Example 7: Practical Use Case - Data Integrity
console.log('7. Practical Use Case - Data Integrity:');
const originalData = 'Important document content';
const originalHash = crypto.createHash('sha256').update(originalData).digest('hex');

console.log('Original data:', originalData);
console.log('Original hash:', originalHash);

// Later, verify the data hasn't changed
const receivedData = 'Important document content';
const receivedHash = crypto.createHash('sha256').update(receivedData).digest('hex');

if (originalHash === receivedHash) {
  console.log('✓ Data integrity verified - data is unchanged');
} else {
  console.log('✗ Data has been modified!');
}
console.log();

// Example 8: Detecting Tampering
console.log('8. Detecting Tampering:');
const tamperedData = 'Important document content MODIFIED';
const tamperedHash = crypto.createHash('sha256').update(tamperedData).digest('hex');

console.log('Tampered data:', tamperedData);
console.log('Tampered hash:', tamperedHash);

if (originalHash === tamperedHash) {
  console.log('✓ Data is unchanged');
} else {
  console.log('✗ Data has been tampered with!');
}
console.log();

// Example 9: Hashing Large Data
console.log('9. Hashing Large Data:');
const largeData = 'A'.repeat(1000000); // 1 million characters
const startTime = Date.now();
const largeHash = crypto.createHash('sha256').update(largeData).digest('hex');
const endTime = Date.now();

console.log('Data size: 1,000,000 characters');
console.log('Hash:', largeHash);
console.log('Time taken:', endTime - startTime, 'ms');
console.log('Notice: Hash is still same length (256 bits = 64 hex chars)');
console.log();

// Example 10: Available Hash Algorithms
console.log('10. Available Hash Algorithms:');
const algorithms = crypto.getHashes();
console.log('Total available:', algorithms.length);
console.log('Recommended for security:', ['sha256', 'sha384', 'sha512', 'sha3-256', 'sha3-512']);
console.log('AVOID for security:', ['md5', 'sha1', 'md4']);
console.log('\nFirst 20 available algorithms:');
console.log(algorithms.slice(0, 20).join(', '));
