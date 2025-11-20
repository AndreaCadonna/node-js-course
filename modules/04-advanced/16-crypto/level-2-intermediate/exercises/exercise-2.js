/**
 * Exercise 2: RSA Key Pair Generator and Encryptor
 *
 * OBJECTIVE:
 * Create a system for RSA key generation and hybrid encryption.
 *
 * REQUIREMENTS:
 * 1. Generate RSA key pairs with different sizes
 * 2. Implement RSA encryption/decryption
 * 3. Build hybrid encryption (RSA + AES)
 * 4. Export and import keys in different formats
 * 5. Password-protect private keys
 *
 * LEARNING GOALS:
 * - Master RSA key pair generation
 * - Understand RSA size limitations
 * - Implement hybrid encryption pattern
 * - Learn key export/import formats
 * - Secure private key storage
 */

const crypto = require('crypto');

console.log('=== Exercise 2: RSA Key Pair Generator and Encryptor ===\n');

// Task 1: Generate RSA Key Pair
console.log('Task 1: Generate RSA Key Pair');
/**
 * TODO 1: Generate RSA key pair with specified size
 * @param {number} modulusLength - Key size (2048 or 4096)
 * @returns {Object} { publicKey, privateKey } in PEM format
 */
function generateRSAKeyPair(modulusLength = 2048) {
  // Your code here
}

// Test Task 1
console.log('✓ Task 1 implementation needed\n');

// Task 2: Implement RSA Encryption
console.log('Task 2: RSA Encryption');
/**
 * TODO 2: Encrypt data with RSA public key
 * Use OAEP padding for security
 * @param {string} data - Data to encrypt (must be small!)
 * @param {string|KeyObject} publicKey - Public key
 * @returns {string} Encrypted data as hex string
 */
function rsaEncrypt(data, publicKey) {
  // Your code here
  // Use RSA_PKCS1_OAEP_PADDING with sha256
}

function rsaDecrypt(encryptedHex, privateKey) {
  // Your code here
}

// Test Task 2
console.log('✓ Task 2 implementation needed\n');

// Task 3: Hybrid Encryption
console.log('Task 3: Implement Hybrid Encryption');
/**
 * TODO 3: Implement hybrid encryption for large data
 * 1. Generate random AES key
 * 2. Encrypt data with AES-GCM
 * 3. Encrypt AES key with RSA
 * 4. Return both encrypted data and encrypted key
 */
function hybridEncrypt(data, publicKey) {
  // Your code here
  // Return { encryptedData, encryptedKey, iv, authTag }
}

function hybridDecrypt(encrypted, privateKey) {
  // Your code here
  // Decrypt AES key with RSA, then decrypt data with AES
}

// Test Task 3
console.log('✓ Task 3 implementation needed\n');

// Task 4: Password-Protected Keys
console.log('Task 4: Password-Protected Private Keys');
/**
 * TODO 4: Generate key pair with encrypted private key
 * @param {string} passphrase - Password to encrypt private key
 * @returns {Object} { publicKey, privateKey } with encrypted private key
 */
function generateProtectedKeyPair(passphrase, modulusLength = 2048) {
  // Your code here
  // Use aes-256-cbc cipher for private key encryption
}

// Test Task 4
console.log('✓ Task 4 implementation needed\n');

// Task 5: Key Management System
console.log('Task 5: Build Key Management System');
/**
 * TODO 5: Complete key management system
 */
class KeyManager {
  constructor() {
    // Store key pairs
  }

  generateKeyPair(id, size = 2048, passphrase = null) {
    // Generate and store key pair
  }

  getPublicKey(id) {
    // Return public key
  }

  encryptFor(id, data) {
    // Encrypt data for specific recipient
    // Use hybrid encryption
  }

  decryptWith(id, encrypted, passphrase = null) {
    // Decrypt data with private key
  }

  exportPublicKey(id, format = 'pem') {
    // Export public key in specified format
  }
}

// Test Task 5
console.log('✓ Task 5 implementation needed\n');

console.log('=== Exercise 2 Complete ===');
console.log('\nKey Takeaways:');
console.log('- RSA key pairs: public encrypts, private decrypts');
console.log('- Use hybrid encryption for large data');
console.log('- OAEP padding is more secure than PKCS1');
console.log('- Protect private keys with passphrases');
console.log('- 2048-bit keys are standard, 4096-bit for high security');
