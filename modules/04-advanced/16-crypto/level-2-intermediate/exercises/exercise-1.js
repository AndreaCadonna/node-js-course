/**
 * Exercise 1: AES-GCM Encryption Utility
 *
 * OBJECTIVE:
 * Build a complete AES-GCM encryption/decryption utility with proper error handling
 * and secure practices.
 *
 * REQUIREMENTS:
 * 1. Implement AES-256-GCM encryption
 * 2. Support Additional Authenticated Data (AAD)
 * 3. Proper authentication tag handling
 * 4. Error handling for tampering detection
 * 5. Create utility functions for real-world use
 *
 * LEARNING GOALS:
 * - Master AES-GCM authenticated encryption
 * - Understand importance of authentication tags
 * - Learn proper IV/nonce management
 * - Implement tamper-resistant encryption
 * - Build production-ready encryption utilities
 */

const crypto = require('crypto');

console.log('=== Exercise 1: AES-GCM Encryption Utility ===\n');

// Task 1: Basic AES-GCM Encryption
console.log('Task 1: Implement AES-GCM Encryption');
/**
 * TODO 1: Implement function to encrypt data using AES-256-GCM
 *
 * Steps:
 * 1. Generate random 16-byte IV
 * 2. Create cipher with 'aes-256-gcm' algorithm
 * 3. Encrypt the plaintext
 * 4. Get the authentication tag
 * 5. Return object with ciphertext, IV, and auth tag
 *
 * @param {string} plaintext - Data to encrypt
 * @param {Buffer} key - 32-byte encryption key
 * @returns {Object} { ciphertext, iv, authTag } all as hex strings
 *
 * Hint: Use crypto.createCipheriv() and cipher.getAuthTag()
 */
function encryptGCM(plaintext, key) {
  // Your code here
}

// Test Task 1
try {
  const testKey = crypto.randomBytes(32);
  const testData = 'Secret message for GCM encryption';

  const encrypted = encryptGCM(testData, testKey);
  console.log('Encrypted:', encrypted);
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Basic AES-GCM Decryption
console.log('Task 2: Implement AES-GCM Decryption');
/**
 * TODO 2: Implement function to decrypt AES-256-GCM encrypted data
 *
 * Steps:
 * 1. Create decipher with 'aes-256-gcm' algorithm
 * 2. Set the authentication tag (BEFORE any update calls!)
 * 3. Decrypt the ciphertext
 * 4. Finalize and return plaintext
 *
 * @param {Object} encrypted - { ciphertext, iv, authTag } as hex strings
 * @param {Buffer} key - 32-byte encryption key
 * @returns {string} Decrypted plaintext
 * @throws {Error} If authentication fails (tampered data)
 *
 * Hint: Use crypto.createDecipheriv() and decipher.setAuthTag()
 */
function decryptGCM(encrypted, key) {
  // Your code here
}

// Test Task 2
try {
  const testKey = crypto.randomBytes(32);
  const testData = 'Test decryption';

  // You'll need your encryptGCM function working for this
  // const encrypted = encryptGCM(testData, testKey);
  // const decrypted = decryptGCM(encrypted, testKey);

  console.log('Match expected: true');
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Encryption with Additional Authenticated Data
console.log('Task 3: Add AAD Support');
/**
 * TODO 3: Enhance encryption to support Additional Authenticated Data
 *
 * Steps:
 * 1. Modify encryptGCM to accept optional AAD parameter
 * 2. Call cipher.setAAD(Buffer.from(aad)) before encryption
 * 3. Include AAD in return object
 * 4. AAD is authenticated but NOT encrypted
 *
 * @param {string} plaintext - Data to encrypt
 * @param {Buffer} key - 32-byte encryption key
 * @param {string} aad - Additional data to authenticate (optional)
 * @returns {Object} { ciphertext, iv, authTag, aad } as hex/strings
 *
 * Hint: AAD is typically metadata like user ID, timestamp, etc.
 */
function encryptWithAAD(plaintext, key, aad = null) {
  // Your code here
}

/**
 * TODO 3b: Enhance decryption to verify AAD
 *
 * Steps:
 * 1. If AAD exists, call decipher.setAAD(Buffer.from(aad))
 * 2. Must be called BEFORE setAuthTag
 * 3. Decryption will fail if AAD doesn't match
 *
 * @param {Object} encrypted - { ciphertext, iv, authTag, aad }
 * @param {Buffer} key - 32-byte encryption key
 * @returns {string} Decrypted plaintext
 * @throws {Error} If AAD verification fails
 */
function decryptWithAAD(encrypted, key) {
  // Your code here
}

// Test Task 3
try {
  const testKey = crypto.randomBytes(32);
  const message = 'Message with metadata';
  const metadata = 'user:alice,timestamp:2024-01-15';

  // const encrypted = encryptWithAAD(message, testKey, metadata);
  // const decrypted = decryptWithAAD(encrypted, testKey);

  console.log('AAD authenticated: expected');
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Tamper Detection
console.log('Task 4: Verify Tamper Detection');
/**
 * TODO 4: Verify that tampering is detected
 *
 * Steps:
 * 1. Encrypt some data
 * 2. Modify the ciphertext
 * 3. Attempt to decrypt
 * 4. Should throw error
 * 5. Return whether tampering was detected
 *
 * @param {string} plaintext - Original data
 * @param {Buffer} key - Encryption key
 * @returns {boolean} True if tampering was detected
 *
 * Hint: Wrap decrypt in try-catch
 */
function testTamperDetection(plaintext, key) {
  // Your code here
  // Encrypt, tamper with ciphertext, try to decrypt
  // Return true if error thrown, false otherwise
}

// Test Task 4
try {
  const testKey = crypto.randomBytes(32);
  const detected = testTamperDetection('Important data', testKey);
  console.log('Tampering detected:', detected ? '✓' : '✗ FAILED');
  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Complete Encryption Service
console.log('Task 5: Build Complete Encryption Service');
/**
 * TODO 5: Create a complete encryption service class
 *
 * Requirements:
 * - Initialize with a master key
 * - encrypt(data, metadata) method
 * - decrypt(encrypted) method
 * - Support for versioning
 * - Proper error handling
 * - Storage-ready format
 */
class EncryptionService {
  constructor(masterKey) {
    // Your code here
    // Initialize with master key
    // Set version number
  }

  /**
   * TODO: Implement encrypt method
   * @param {string} data - Data to encrypt
   * @param {Object} metadata - Optional metadata to include as AAD
   * @returns {Object} Complete encrypted package ready for storage
   */
  encrypt(data, metadata = {}) {
    // Your code here
    // Use AES-256-GCM
    // Include metadata as AAD
    // Return object with: version, algorithm, ciphertext, iv, authTag, metadata, timestamp
  }

  /**
   * TODO: Implement decrypt method
   * @param {Object} encrypted - Encrypted package from encrypt()
   * @returns {string} Decrypted data
   * @throws {Error} If version unsupported or decryption fails
   */
  decrypt(encrypted) {
    // Your code here
    // Check version
    // Verify and decrypt
  }

  /**
   * TODO: Implement key rotation check
   * @param {Object} encrypted - Encrypted package
   * @returns {boolean} True if needs re-encryption
   */
  needsReencryption(encrypted) {
    // Your code here
    // Return true if encrypted.version < this.currentVersion
  }
}

// Test Task 5
try {
  const masterKey = crypto.randomBytes(32);
  const service = new EncryptionService(masterKey);

  // const encrypted = service.encrypt('Sensitive data', { userId: '123' });
  // const decrypted = service.decrypt(encrypted);

  console.log('Service created');
  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge
console.log('Bonus: Password-Based Encryption');
/**
 * TODO BONUS: Implement password-based encryption
 *
 * Steps:
 * 1. Derive key from password using scrypt
 * 2. Use derived key for AES-GCM encryption
 * 3. Store salt with encrypted data
 * 4. For decryption, re-derive key from password and salt
 *
 * @param {string} plaintext - Data to encrypt
 * @param {string} password - User password
 * @returns {Object} { ciphertext, iv, authTag, salt, kdf, kdfParams }
 */
function encryptWithPassword(plaintext, password) {
  // Your code here
}

function decryptWithPassword(encrypted, password) {
  // Your code here
}

// Test Bonus
try {
  const data = 'Password-protected data';
  const password = 'MySecurePassword123!';

  // const encrypted = encryptWithPassword(data, password);
  // const decrypted = decryptWithPassword(encrypted, password);

  console.log('Password-based encryption: expected');
  console.log('✓ Bonus implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 1 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
console.log('\nKey Takeaways:');
console.log('- AES-GCM provides encryption + authentication');
console.log('- Always verify authentication tags');
console.log('- Use unique IV for each encryption');
console.log('- AAD authenticates metadata without encrypting');
console.log('- Password-based encryption requires key derivation');
console.log('\nRun the solution file to see one possible implementation!');
