/**
 * Exercise 5: Simple Encryption Tool - SOLUTION
 *
 * This solution demonstrates:
 * - Symmetric encryption using AES-256-CBC
 * - Proper use of encryption keys and IVs
 * - Password-based encryption with key derivation
 * - Building a complete encryption/decryption utility
 * - Understanding encryption vs hashing
 */

const crypto = require('crypto');

console.log('=== Exercise 5: Simple Encryption Tool - SOLUTION ===\n');

// ============================================================================
// Task 1: Encrypt text with key and IV
// ============================================================================
console.log('Task 1: Basic encryption with AES-256-CBC');

/**
 * Encrypts text using AES-256-CBC
 *
 * ENCRYPTION BASICS:
 * - Encryption is REVERSIBLE (unlike hashing)
 * - Requires a KEY (secret) and IV (initialization vector)
 * - Same key can decrypt the ciphertext
 * - Protects confidentiality (data can't be read without key)
 *
 * AES-256-CBC:
 * - AES: Advanced Encryption Standard (industry standard)
 * - 256: Key size in bits (very secure)
 * - CBC: Cipher Block Chaining mode
 *
 * KEY REQUIREMENTS:
 * - AES-256 needs 32-byte (256-bit) key
 * - Must be random and kept secret
 * - Losing key means data is unrecoverable
 *
 * IV REQUIREMENTS:
 * - 16 bytes (128 bits) for AES
 * - Must be random for each encryption
 * - NOT secret (can be stored with ciphertext)
 * - Prevents pattern detection in ciphertext
 *
 * @param {string} text - Text to encrypt
 * @param {Buffer} key - 32-byte encryption key
 * @param {Buffer} iv - 16-byte initialization vector
 * @returns {string} Encrypted text in hex format
 */
function encrypt(text, key, iv) {
  // Create cipher with algorithm, key, and IV
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  // Encrypt the text
  // update() processes the input, final() completes encryption
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted;
}

// ALTERNATIVE APPROACH: With error handling
function encryptSafe(text, key, iv) {
  try {
    if (!text) {
      throw new Error('Text is required');
    }
    if (key.length !== 32) {
      throw new Error('Key must be 32 bytes for AES-256');
    }
    if (iv.length !== 16) {
      throw new Error('IV must be 16 bytes');
    }

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return { success: true, encrypted };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ALTERNATIVE APPROACH: With base64 output
function encryptBase64(text, key, iv) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

// Test Task 1
try {
  const key1 = crypto.randomBytes(32); // 256 bits
  const iv1 = crypto.randomBytes(16); // 128 bits
  const plaintext1 = 'Hello, World!';

  const encrypted1 = encrypt(plaintext1, key1, iv1);
  const encrypted2 = encryptBase64(plaintext1, key1, iv1);

  console.log('Plaintext:', plaintext1);
  console.log('Encrypted (hex):', encrypted1);
  console.log('Encrypted (base64):', encrypted2);
  console.log('Is encrypted:', encrypted1 !== plaintext1, '✓');
  console.log('Hex is longer:', encrypted1.length > plaintext1.length, '✓');

  // Show that different IVs produce different ciphertexts
  const iv2 = crypto.randomBytes(16);
  const encrypted3 = encrypt(plaintext1, key1, iv2); // Same key, different IV
  console.log('\nSame plaintext, different IV:', encrypted3);
  console.log('Different ciphertext:', encrypted1 !== encrypted3, '✓');
  console.log('✓ Task 1 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 2: Decrypt text
// ============================================================================
console.log('Task 2: Decrypt encrypted text');

/**
 * Decrypts text using AES-256-CBC
 *
 * DECRYPTION REQUIREMENTS:
 * - Must use SAME key as encryption
 * - Must use SAME IV as encryption
 * - Must use SAME algorithm
 * - Wrong key/IV will produce garbage or error
 *
 * SECURITY NOTES:
 * - Keep encryption keys secure
 * - IV can be public (often stored with ciphertext)
 * - No way to decrypt without correct key
 *
 * @param {string} encryptedText - Encrypted text in hex format
 * @param {Buffer} key - 32-byte encryption key (same as encryption)
 * @param {Buffer} iv - 16-byte initialization vector (same as encryption)
 * @returns {string} Decrypted plaintext
 */
function decrypt(encryptedText, key, iv) {
  // Create decipher with same algorithm, key, and IV
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

  // Decrypt the text
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ALTERNATIVE APPROACH: With error handling
function decryptSafe(encryptedText, key, iv) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return { success: true, decrypted };
  } catch (err) {
    return {
      success: false,
      error: 'Decryption failed (wrong key/IV or corrupted data)',
      details: err.message
    };
  }
}

// Test Task 2
try {
  const key2 = crypto.randomBytes(32);
  const iv2 = crypto.randomBytes(16);
  const original = 'Secret message to encrypt and decrypt!';

  const encrypted2 = encrypt(original, key2, iv2);
  const decrypted2 = decrypt(encrypted2, key2, iv2);

  console.log('Original:', original);
  console.log('Encrypted:', encrypted2);
  console.log('Decrypted:', decrypted2);
  console.log('Matches original:', decrypted2 === original, '✓');

  // Test with wrong key
  const wrongKey = crypto.randomBytes(32);
  const wrongDecrypt = decryptSafe(encrypted2, wrongKey, iv2);
  console.log('\nWrong key error:', !wrongDecrypt.success, '✓');
  console.log('Error message:', wrongDecrypt.error);

  // Test with wrong IV
  const wrongIV = crypto.randomBytes(16);
  const wrongIVDecrypt = decryptSafe(encrypted2, key2, wrongIV);
  console.log('Wrong IV produces garbage:', wrongIVDecrypt.decrypted !== original);
  console.log('✓ Task 2 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 3: Encrypt with password (derive key)
// ============================================================================
console.log('Task 3: Encrypt with password-derived key');

/**
 * Encrypts text using a password
 *
 * PASSWORD-BASED ENCRYPTION:
 * - Users remember passwords, not 32-byte hex keys
 * - Must derive encryption key from password
 * - Use PBKDF2 (same as password hashing!)
 * - Different purpose: derive key, not store hash
 *
 * SALT FOR KEY DERIVATION:
 * - Must be random for each encryption
 * - Ensures same password produces different keys
 * - NOT secret (stored with ciphertext)
 * - Different from IV (both needed!)
 *
 * STORAGE FORMAT:
 * - Must store: salt, IV, ciphertext
 * - All three needed for decryption
 * - Only password is secret
 *
 * @param {string} text - Text to encrypt
 * @param {string} password - Password to derive key from
 * @returns {Object} Object with { encrypted, salt, iv }
 */
function encryptWithPassword(text, password) {
  // Generate random salt (16 bytes)
  const salt = crypto.randomBytes(16);

  // Generate random IV (16 bytes)
  const iv = crypto.randomBytes(16);

  // Derive encryption key from password using PBKDF2
  // Note: Fewer iterations than password hashing (speed vs security trade-off)
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  // Encrypt the text
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return everything needed for decryption (except password)
  return {
    encrypted,
    salt: salt.toString('hex'),
    iv: iv.toString('hex')
  };
}

// ALTERNATIVE APPROACH: With configurable iterations
function encryptWithPasswordConfigurable(text, password, options = {}) {
  const {
    saltLength = 16,
    iterations = 100000,
    keyLength = 32,
    digest = 'sha256'
  } = options;

  const salt = crypto.randomBytes(saltLength);
  const iv = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encrypted,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    iterations,
    algorithm: 'aes-256-cbc',
    digest
  };
}

// Test Task 3
try {
  const password3 = 'mySecurePassword123';
  const message3 = 'Confidential information';

  const result3 = encryptWithPassword(message3, password3);

  console.log('Encrypted with password:', result3.encrypted.substring(0, 32) + '...');
  console.log('Salt:', result3.salt);
  console.log('IV:', result3.iv);
  console.log('Has all parts:', !!result3.encrypted && !!result3.salt && !!result3.iv, '✓');

  // Same password, different encryption each time (due to random salt/IV)
  const result4 = encryptWithPassword(message3, password3);
  console.log('\nSame password, different ciphertext:', result3.encrypted !== result4.encrypted, '✓');
  console.log('(Due to random salt and IV)');
  console.log('✓ Task 3 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 4: Decrypt with password
// ============================================================================
console.log('Task 4: Decrypt with password');

/**
 * Decrypts text using a password
 *
 * DECRYPTION PROCESS:
 * 1. Convert salt and IV from hex to Buffer
 * 2. Derive same key from password and salt
 * 3. Decrypt using derived key and IV
 *
 * SECURITY NOTES:
 * - Must use EXACT same parameters as encryption
 * - Same iterations count
 * - Same key derivation algorithm
 * - Wrong password produces error or garbage
 *
 * @param {string} encryptedText - Encrypted text in hex
 * @param {string} password - Password to derive key from
 * @param {string} salt - Salt in hex format
 * @param {string} iv - IV in hex format
 * @returns {string} Decrypted plaintext
 */
function decryptWithPassword(encryptedText, password, salt, iv) {
  // Convert salt and IV from hex strings to Buffers
  const saltBuffer = Buffer.from(salt, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');

  // Derive the same key from password and salt
  const key = crypto.pbkdf2Sync(password, saltBuffer, 100000, 32, 'sha256');

  // Decrypt using derived key
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// ALTERNATIVE APPROACH: With error handling
function decryptWithPasswordSafe(encryptedText, password, salt, iv) {
  try {
    const saltBuffer = Buffer.from(salt, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const key = crypto.pbkdf2Sync(password, saltBuffer, 100000, 32, 'sha256');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return { success: true, decrypted };
  } catch (err) {
    return {
      success: false,
      error: 'Decryption failed (wrong password or corrupted data)'
    };
  }
}

// Test Task 4
try {
  const password4 = 'testPassword456';
  const message4 = 'This is a secret message!';

  const encrypted4 = encryptWithPassword(message4, password4);
  const decrypted4 = decryptWithPassword(
    encrypted4.encrypted,
    password4,
    encrypted4.salt,
    encrypted4.iv
  );

  console.log('Original:', message4);
  console.log('Decrypted:', decrypted4);
  console.log('Match:', decrypted4 === message4, '✓');

  // Test with wrong password
  const wrongPasswordResult = decryptWithPasswordSafe(
    encrypted4.encrypted,
    'wrongPassword',
    encrypted4.salt,
    encrypted4.iv
  );
  console.log('\nWrong password rejected:', !wrongPasswordResult.success, '✓');
  console.log('Error:', wrongPasswordResult.error);

  // Demonstrate that password is the only secret needed
  console.log('\nSecurity note:');
  console.log('  Only password is secret');
  console.log('  Salt and IV can be public (stored with ciphertext)');
  console.log('✓ Task 4 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 5: Encryption utility class
// ============================================================================
console.log('Task 5: Complete encryption utility');

/**
 * Complete encryption/decryption utility
 *
 * FEATURES:
 * - Simple interface (just password needed)
 * - Handles all encryption details internally
 * - Multiple output formats (string, object)
 * - Automatic key derivation
 * - Proper error handling
 *
 * DESIGN PRINCIPLES:
 * - Hide complexity from user
 * - Clear method names
 * - Consistent error handling
 * - Support multiple use cases
 */
class EncryptionTool {
  constructor(password) {
    this.password = password;
    this.algorithm = 'aes-256-cbc';
    this.iterations = 100000;
  }

  /**
   * Encrypt text with stored password
   * Returns combined string format: "encrypted:salt:iv"
   *
   * @param {string} text - Text to encrypt
   * @returns {string} Combined encrypted string
   */
  encrypt(text) {
    const result = encryptWithPassword(text, this.password);
    return `${result.encrypted}:${result.salt}:${result.iv}`;
  }

  /**
   * Decrypt combined encrypted string
   *
   * @param {string} combinedString - String from encrypt() method
   * @returns {string} Decrypted text
   */
  decrypt(combinedString) {
    const [encrypted, salt, iv] = combinedString.split(':');

    if (!encrypted || !salt || !iv) {
      throw new Error('Invalid encrypted string format');
    }

    return decryptWithPassword(encrypted, this.password, salt, iv);
  }

  /**
   * Encrypt and return as object
   *
   * @param {string} text - Text to encrypt
   * @returns {Object} Object with encrypted data
   */
  encryptToObject(text) {
    const result = encryptWithPassword(text, this.password);

    return {
      encrypted: result.encrypted,
      salt: result.salt,
      iv: result.iv,
      algorithm: this.algorithm,
      timestamp: Date.now()
    };
  }

  /**
   * Decrypt from object
   *
   * @param {Object} encryptedObj - Object from encryptToObject
   * @returns {string} Decrypted text
   */
  decryptFromObject(encryptedObj) {
    return decryptWithPassword(
      encryptedObj.encrypted,
      this.password,
      encryptedObj.salt,
      encryptedObj.iv
    );
  }
}

// ALTERNATIVE APPROACH: Enhanced with validation and features
class EncryptionToolAdvanced extends EncryptionTool {
  constructor(password, options = {}) {
    super(password);
    this.iterations = options.iterations || 100000;
    this.version = options.version || 1;
  }

  /**
   * Encrypt with version and metadata
   */
  encryptWithMetadata(text, metadata = {}) {
    const result = encryptWithPassword(text, this.password);

    return {
      version: this.version,
      encrypted: result.encrypted,
      salt: result.salt,
      iv: result.iv,
      algorithm: this.algorithm,
      iterations: this.iterations,
      timestamp: Date.now(),
      metadata
    };
  }

  /**
   * Decrypt with version checking
   */
  decryptVersioned(encryptedObj) {
    if (encryptedObj.version !== this.version) {
      throw new Error(`Version mismatch: expected ${this.version}, got ${encryptedObj.version}`);
    }

    return decryptWithPassword(
      encryptedObj.encrypted,
      this.password,
      encryptedObj.salt,
      encryptedObj.iv
    );
  }

  /**
   * Change password (re-encrypt)
   */
  changePassword(encryptedObj, newPassword) {
    // Decrypt with old password
    const plaintext = this.decryptFromObject(encryptedObj);

    // Create new tool with new password
    const newTool = new EncryptionToolAdvanced(newPassword, {
      iterations: this.iterations,
      version: this.version
    });

    // Encrypt with new password
    return newTool.encryptToObject(plaintext);
  }
}

// Test Task 5
try {
  const tool = new EncryptionTool('masterPassword123');

  // Test string format
  const original5 = 'Top secret information!';
  const encrypted5 = tool.encrypt(original5);
  const decrypted5 = tool.decrypt(encrypted5);

  console.log('Original:', original5);
  console.log('Encrypted string:', encrypted5.substring(0, 50) + '...');
  console.log('Decrypted:', decrypted5);
  console.log('Match:', decrypted5 === original5, '✓');

  // Test object format
  const original6 = 'Another secret!';
  const encryptedObj = tool.encryptToObject(original6);
  const decrypted6 = tool.decryptFromObject(encryptedObj);

  console.log('\nEncrypted object:', {
    encrypted: encryptedObj.encrypted.substring(0, 20) + '...',
    algorithm: encryptedObj.algorithm,
    timestamp: new Date(encryptedObj.timestamp).toISOString()
  });
  console.log('Decrypted from object:', decrypted6);
  console.log('Match:', decrypted6 === original6, '✓');

  // Test advanced features
  const advTool = new EncryptionToolAdvanced('password', { version: 2 });
  const withMeta = advTool.encryptWithMetadata('secret', { type: 'document' });
  console.log('\nWith metadata:', {
    version: withMeta.version,
    metadata: withMeta.metadata
  });

  const decryptedMeta = advTool.decryptVersioned(withMeta);
  console.log('Decrypted with version:', decryptedMeta === 'secret', '✓');
  console.log('✓ Task 5 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Bonus Challenge: File encryption simulation
// ============================================================================
console.log('Bonus Challenge: Encrypt multiple data items');

/**
 * Encrypts array of items
 *
 * BATCH ENCRYPTION:
 * - Each item encrypted independently
 * - Each gets unique salt and IV
 * - Same password can decrypt all
 * - Useful for bulk operations
 *
 * @param {Array} items - Array of {id, data} objects
 * @param {string} password - Password for encryption
 * @returns {Array} Array of {id, encrypted, salt, iv} objects
 */
function encryptMultiple(items, password) {
  return items.map(item => {
    const encrypted = encryptWithPassword(item.data, password);

    return {
      id: item.id,
      encrypted: encrypted.encrypted,
      salt: encrypted.salt,
      iv: encrypted.iv
    };
  });
}

/**
 * Decrypts array of encrypted items
 *
 * @param {Array} encryptedItems - Array from encryptMultiple
 * @param {string} password - Password for decryption
 * @returns {Array} Array of {id, data} objects
 */
function decryptMultiple(encryptedItems, password) {
  return encryptedItems.map(item => {
    try {
      const decrypted = decryptWithPassword(
        item.encrypted,
        password,
        item.salt,
        item.iv
      );

      return {
        id: item.id,
        data: decrypted
      };
    } catch (err) {
      return {
        id: item.id,
        data: null,
        error: 'Decryption failed'
      };
    }
  });
}

// ALTERNATIVE APPROACH: With progress callback
function encryptMultipleWithProgress(items, password, onProgress) {
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const encrypted = encryptWithPassword(item.data, password);

    results.push({
      id: item.id,
      encrypted: encrypted.encrypted,
      salt: encrypted.salt,
      iv: encrypted.iv
    });

    if (onProgress) {
      onProgress(i + 1, items.length);
    }
  }

  return results;
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
  const decrypted = decryptMultiple(encrypted, password);

  console.log('Original items:', items.length);
  console.log('Encrypted items:', encrypted.length);
  console.log('Decrypted items:', decrypted.length);
  console.log('First item matches:', decrypted[0].data === items[0].data, '✓');
  console.log('All items match:', decrypted.every((d, i) => d.data === items[i].data), '✓');

  // Show encrypted format
  console.log('\nSample encrypted item:');
  console.log('  ID:', encrypted[0].id);
  console.log('  Encrypted:', encrypted[0].encrypted.substring(0, 20) + '...');
  console.log('  Salt:', encrypted[0].salt.substring(0, 16) + '...');

  // Test with progress
  console.log('\nEncrypting with progress:');
  const withProgress = encryptMultipleWithProgress(items, password, (current, total) => {
    console.log(`  Progress: ${current}/${total}`);
  });
  console.log('✓ Bonus Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Additional Examples: Best Practices
// ============================================================================
console.log('=== Best Practices & Additional Examples ===\n');

// Example 1: Secure file encryption (conceptual)
class SecureFileEncryption {
  constructor(password) {
    this.tool = new EncryptionTool(password);
  }

  // In real application, would use fs streams
  encryptFile(fileContent, filename) {
    const encrypted = this.tool.encryptToObject(fileContent);

    return {
      filename,
      originalSize: fileContent.length,
      encryptedSize: encrypted.encrypted.length,
      data: encrypted,
      checksum: crypto.createHash('sha256').update(fileContent).digest('hex')
    };
  }

  decryptFile(encryptedFile) {
    const decrypted = this.tool.decryptFromObject(encryptedFile.data);

    // Verify checksum
    const checksum = crypto.createHash('sha256').update(decrypted).digest('hex');
    const valid = checksum === encryptedFile.checksum;

    return {
      content: decrypted,
      checksumValid: valid
    };
  }
}

// Example 2: AES-GCM (authenticated encryption)
function encryptGCM(text, password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const iv = crypto.randomBytes(12); // GCM uses 12-byte IV

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get authentication tag (ensures integrity)
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decryptGCM(encryptedText, password, salt, iv, authTag) {
  const saltBuffer = Buffer.from(salt, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');
  const key = crypto.pbkdf2Sync(password, saltBuffer, 100000, 32, 'sha256');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Example 3: Encryption with compression
function encryptCompressed(text, password) {
  const zlib = require('zlib');

  // Compress first
  const compressed = zlib.gzipSync(text);

  // Then encrypt
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(compressed),
    cipher.final()
  ]);

  return {
    encrypted: encrypted.toString('hex'),
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    originalSize: text.length,
    compressedSize: compressed.length
  };
}

// Test examples
console.log('1. File encryption:');
const fileEnc = new SecureFileEncryption('password');
const encFile = fileEnc.encryptFile('file content', 'test.txt');
console.log('   Encrypted file:', encFile.filename);
console.log('   Checksum valid:', fileEnc.decryptFile(encFile).checksumValid);

console.log('\n2. AES-GCM (authenticated):');
const gcmEnc = encryptGCM('secret', 'password');
const gcmDec = decryptGCM(gcmEnc.encrypted, 'password', gcmEnc.salt, gcmEnc.iv, gcmEnc.authTag);
console.log('   GCM works:', gcmDec === 'secret');
console.log('   Has auth tag:', !!gcmEnc.authTag);

console.log('\n3. With compression:');
const longText = 'Lorem ipsum '.repeat(100);
const compressed = encryptCompressed(longText, 'password');
console.log('   Original size:', compressed.originalSize);
console.log('   Compressed size:', compressed.compressedSize);
console.log('   Savings:', Math.round((1 - compressed.compressedSize / compressed.originalSize) * 100) + '%');

console.log('\n=== Exercise 5 Complete ===');
console.log('\nKey Takeaways:');
console.log('✓ Encryption is REVERSIBLE (unlike hashing)');
console.log('✓ Always use strong algorithms (AES-256, not DES or RC4)');
console.log('✓ NEVER reuse IVs with the same key');
console.log('✓ IV and salt are NOT secret (can be stored with ciphertext)');
console.log('✓ Use PBKDF2 to derive keys from passwords');
console.log('✓ Encryption protects confidentiality, hashing verifies integrity');
console.log('✓ Consider AES-GCM for authenticated encryption');
console.log('✓ Store all parameters needed for decryption (except key/password)');
console.log('✓ Wrong key produces error or garbage (not original data)');
console.log('✓ Encryption keys must be kept absolutely secret');
