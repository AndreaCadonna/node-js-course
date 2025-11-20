/**
 * Exercise 5: Simple Encryption Tool
 *
 * OBJECTIVE:
 * Learn to encrypt and decrypt data using symmetric encryption (AES).
 *
 * REQUIREMENTS:
 * 1. Encrypt text using AES-256-CBC
 * 2. Decrypt encrypted data back to original text
 * 3. Understand keys and initialization vectors (IV)
 * 4. Handle encryption with password-derived keys
 * 5. Build a simple encryption/decryption utility
 *
 * LEARNING GOALS:
 * - Understanding symmetric encryption
 * - Using crypto.createCipheriv() and createDecipheriv()
 * - Working with encryption keys and IVs
 * - Understanding the difference between encryption and hashing
 * - Deriving keys from passwords
 * - Proper error handling in encryption
 */

const crypto = require('crypto');

console.log('=== Exercise 5: Simple Encryption Tool ===\n');

// Task 1: Encrypt text with key and IV
console.log('Task 1: Basic encryption with AES-256-CBC');
/**
 * TODO 1: Implement function to encrypt text
 *
 * Steps:
 * 1. Create cipher using crypto.createCipheriv(algorithm, key, iv)
 * 2. Encrypt the text using cipher.update() and cipher.final()
 * 3. Return encrypted data as hexadecimal string
 *
 * @param {string} text - Text to encrypt
 * @param {Buffer} key - 32-byte encryption key
 * @param {Buffer} iv - 16-byte initialization vector
 * @returns {string} Encrypted text in hex format
 *
 * Hint: Use 'aes-256-cbc' as algorithm
 * Hint: cipher.update(text, 'utf8', 'hex') + cipher.final('hex')
 */
function encrypt(text, key, iv) {
  // Your code here
}

// Test Task 1
try {
  const key1 = crypto.randomBytes(32); // 256 bits
  const iv1 = crypto.randomBytes(16); // 128 bits
  const plaintext1 = 'Hello, World!';

  const encrypted1 = encrypt(plaintext1, key1, iv1);

  console.log('Plaintext:', plaintext1);
  console.log('Encrypted:', encrypted1);
  console.log('Is encrypted:', encrypted1 !== plaintext1);
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Decrypt text
console.log('Task 2: Decrypt encrypted text');
/**
 * TODO 2: Implement function to decrypt text
 *
 * Steps:
 * 1. Create decipher using crypto.createDecipheriv(algorithm, key, iv)
 * 2. Decrypt using decipher.update() and decipher.final()
 * 3. Return decrypted text
 *
 * @param {string} encryptedText - Encrypted text in hex format
 * @param {Buffer} key - 32-byte encryption key (same as encryption)
 * @param {Buffer} iv - 16-byte initialization vector (same as encryption)
 * @returns {string} Decrypted plaintext
 *
 * Hint: Use same algorithm as encryption
 * Hint: decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8')
 */
function decrypt(encryptedText, key, iv) {
  // Your code here
}

// Test Task 2
try {
  const key2 = crypto.randomBytes(32);
  const iv2 = crypto.randomBytes(16);
  const original = 'Secret message to encrypt and decrypt!';

  const encrypted2 = encrypt(original, key2, iv2);
  const decrypted2 = decrypt(encrypted2 || '', key2, iv2);

  console.log('Original:', original);
  console.log('Encrypted:', encrypted2);
  console.log('Decrypted:', decrypted2);
  console.log('Matches original:', decrypted2 === original, '(should be true)');
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Encrypt with password (derive key)
console.log('Task 3: Encrypt with password-derived key');
/**
 * TODO 3: Implement function to encrypt using password
 *
 * Steps:
 * 1. Generate random salt and IV
 * 2. Derive encryption key from password using pbkdf2
 * 3. Encrypt the text
 * 4. Return object with encrypted text, salt, and IV
 *
 * @param {string} text - Text to encrypt
 * @param {string} password - Password to derive key from
 * @returns {Object} Object with { encrypted, salt, iv }
 *
 * Hint: Use crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')
 * Hint: Salt and IV should be random for each encryption
 * Hint: Return salt and IV as hex strings (they're not secret)
 */
function encryptWithPassword(text, password) {
  // Your code here
  // 1. Generate salt (16 bytes)
  // 2. Generate IV (16 bytes)
  // 3. Derive key from password
  // 4. Encrypt text
  // 5. Return { encrypted, salt, iv }
}

// Test Task 3
try {
  const password3 = 'mySecurePassword123';
  const message3 = 'Confidential information';

  const result3 = encryptWithPassword(message3, password3);

  console.log('Encrypted with password:', result3?.encrypted?.substring(0, 32) + '...');
  console.log('Salt:', result3?.salt);
  console.log('IV:', result3?.iv);
  console.log('Has all parts:', !!result3?.encrypted && !!result3?.salt && !!result3?.iv);
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Decrypt with password
console.log('Task 4: Decrypt with password');
/**
 * TODO 4: Implement function to decrypt using password
 *
 * Steps:
 * 1. Convert salt and IV from hex strings to Buffers
 * 2. Derive the same key from password and salt
 * 3. Decrypt the text
 * 4. Return decrypted text
 *
 * @param {string} encryptedText - Encrypted text in hex
 * @param {string} password - Password to derive key from
 * @param {string} salt - Salt in hex format
 * @param {string} iv - IV in hex format
 * @returns {string} Decrypted plaintext
 *
 * Hint: Use same pbkdf2 parameters as encryptWithPassword
 * Hint: Buffer.from(salt, 'hex') to convert hex to Buffer
 */
function decryptWithPassword(encryptedText, password, salt, iv) {
  // Your code here
}

// Test Task 4
try {
  const password4 = 'testPassword456';
  const message4 = 'This is a secret message!';

  const encrypted4 = encryptWithPassword(message4, password4);
  const decrypted4 = decryptWithPassword(
    encrypted4?.encrypted || '',
    password4,
    encrypted4?.salt || '',
    encrypted4?.iv || ''
  );

  console.log('Original:', message4);
  console.log('Decrypted:', decrypted4);
  console.log('Match:', decrypted4 === message4, '(should be true)');

  // Test with wrong password
  try {
    const wrongDecrypt = decryptWithPassword(
      encrypted4?.encrypted || '',
      'wrongPassword',
      encrypted4?.salt || '',
      encrypted4?.iv || ''
    );
    console.log('Wrong password decryption failed as expected');
  } catch (err) {
    console.log('Wrong password rejected:', err.message);
  }

  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Encryption utility class
console.log('Task 5: Complete encryption utility');
/**
 * TODO 5: Implement EncryptionTool class
 *
 * This provides a complete encryption/decryption interface
 */
class EncryptionTool {
  constructor(password) {
    // TODO: Store password for encryption/decryption
  }

  /**
   * TODO: Encrypt text with stored password
   * @param {string} text - Text to encrypt
   * @returns {string} Combined encrypted string (includes salt and IV)
   *
   * Format: "encrypted:salt:iv" (all in hex)
   *
   * Hint: Use encryptWithPassword
   * Hint: Combine parts with ':'
   */
  encrypt(text) {
    // Your code here
  }

  /**
   * TODO: Decrypt combined encrypted string
   * @param {string} combinedString - String from encrypt() method
   * @returns {string} Decrypted text
   *
   * Hint: Split by ':'
   * Hint: Parts are [encrypted, salt, iv]
   * Hint: Use decryptWithPassword
   */
  decrypt(combinedString) {
    // Your code here
  }

  /**
   * TODO: Encrypt and return as object
   * @param {string} text - Text to encrypt
   * @returns {Object} Object with encrypted data
   */
  encryptToObject(text) {
    // Your code here
    // Return { encrypted, salt, iv, algorithm: 'aes-256-cbc', timestamp }
  }

  /**
   * TODO: Decrypt from object
   * @param {Object} encryptedObj - Object from encryptToObject
   * @returns {string} Decrypted text
   */
  decryptFromObject(encryptedObj) {
    // Your code here
  }
}

// Test Task 5
try {
  const tool = new EncryptionTool('masterPassword123');

  // Test string format
  const original5 = 'Top secret information!';
  const encrypted5 = tool.encrypt(original5);
  const decrypted5 = tool.decrypt(encrypted5 || '');

  console.log('Original:', original5);
  console.log('Encrypted string:', encrypted5?.substring(0, 50) + '...');
  console.log('Decrypted:', decrypted5);
  console.log('Match:', decrypted5 === original5, '(should be true)');

  // Test object format
  const original6 = 'Another secret!';
  const encryptedObj = tool.encryptToObject(original6);
  const decrypted6 = tool.decryptFromObject(encryptedObj || {});

  console.log('Encrypted object:', encryptedObj);
  console.log('Decrypted from object:', decrypted6);
  console.log('Match:', decrypted6 === original6, '(should be true)');

  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge: File encryption simulation
console.log('Bonus Challenge: Encrypt multiple data items');
/**
 * TODO BONUS: Implement function to encrypt array of items
 *
 * Steps:
 * 1. Accept array of objects with {id, data}
 * 2. Encrypt each data item
 * 3. Return array with encrypted versions
 * 4. Each should be independently decryptable
 *
 * @param {Array} items - Array of {id, data} objects
 * @param {string} password - Password for encryption
 * @returns {Array} Array of {id, encrypted, salt, iv} objects
 */
function encryptMultiple(items, password) {
  // Your code here
}

/**
 * TODO BONUS: Decrypt array of encrypted items
 * @param {Array} encryptedItems - Array from encryptMultiple
 * @param {string} password - Password for decryption
 * @returns {Array} Array of {id, data} objects
 */
function decryptMultiple(encryptedItems, password) {
  // Your code here
}

// Test Bonus
try {
  const items = [
    { id: 1, data: 'First secret' },
    { id: 2, data: 'Second secret' },
    { id: 3, data: 'Third secret' }
  ];

  const password = 'batchPassword';
  const encrypted = encryptMultiple(items, password);
  const decrypted = decryptMultiple(encrypted || [], password);

  console.log('Original items:', items.length);
  console.log('Encrypted items:', encrypted?.length || 0);
  console.log('Decrypted items:', decrypted?.length || 0);
  console.log('First item matches:', decrypted?.[0]?.data === items[0].data);
  console.log('All items:', decrypted);
  console.log('✓ Bonus implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 5 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
console.log('\nKey Takeaways:');
console.log('- Encryption is reversible (unlike hashing)');
console.log('- Always use strong algorithms (AES-256, not DES or RC4)');
console.log('- Never reuse IVs with the same key');
console.log('- Store IV and salt with encrypted data (they\'re not secret)');
console.log('- Use password derivation (PBKDF2) for password-based encryption');
console.log('- Encryption protects confidentiality, hashing verifies integrity');
