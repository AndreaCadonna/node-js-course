/**
 * AES-GCM Encryption Examples
 *
 * Demonstrates authenticated encryption using AES-GCM (Galois/Counter Mode).
 * GCM provides both confidentiality and authenticity in a single operation.
 */

const crypto = require('crypto');

console.log('=== AES-GCM Authenticated Encryption ===\n');

// Example 1: Basic AES-GCM Encryption and Decryption
console.log('1. Basic AES-GCM Encryption:');
const algorithm = 'aes-256-gcm';
const key = crypto.randomBytes(32); // 256-bit key
const iv = crypto.randomBytes(16);  // 128-bit IV (nonce)
const plaintext = 'Secret message that needs protection';

console.log('Plaintext:', plaintext);
console.log('Key length:', key.length, 'bytes (256 bits)');
console.log('IV length:', iv.length, 'bytes (128 bits)');

// Encrypt
const cipher = crypto.createCipheriv(algorithm, key, iv);
let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
ciphertext += cipher.final('hex');

// Get authentication tag (crucial for GCM!)
const authTag = cipher.getAuthTag();

console.log('Ciphertext:', ciphertext);
console.log('Auth Tag:', authTag.toString('hex'));
console.log('Auth Tag length:', authTag.length, 'bytes (128 bits)');
console.log();

// Decrypt
const decipher = crypto.createDecipheriv(algorithm, key, iv);
decipher.setAuthTag(authTag); // Must set auth tag before decrypting!
let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
decrypted += decipher.final('utf8');

console.log('Decrypted:', decrypted);
console.log('Match:', plaintext === decrypted ? '✓' : '✗');
console.log();

// Example 2: Why GCM is Better - Authentication Prevents Tampering
console.log('2. GCM Prevents Tampering:');
const data = 'Important financial transaction: $1000';
const key2 = crypto.randomBytes(32);
const iv2 = crypto.randomBytes(16);

// Encrypt
const cipher2 = crypto.createCipheriv('aes-256-gcm', key2, iv2);
let encrypted = cipher2.update(data, 'utf8', 'hex');
encrypted += cipher2.final('hex');
const tag2 = cipher2.getAuthTag();

console.log('Original:', data);
console.log('Encrypted:', encrypted);

// Try to tamper with ciphertext
const tamperedCiphertext = encrypted.slice(0, -4) + 'ffff';
console.log('Tampered:', tamperedCiphertext);

// Attempt to decrypt tampered data
try {
  const decipher2 = crypto.createDecipheriv('aes-256-gcm', key2, iv2);
  decipher2.setAuthTag(tag2);
  let result = decipher2.update(tamperedCiphertext, 'hex', 'utf8');
  result += decipher2.final('utf8');
  console.log('Decrypted:', result);
} catch (err) {
  console.log('✓ Decryption failed (as expected):', err.message);
  console.log('✓ GCM detected tampering!');
}
console.log();

// Example 3: Additional Authenticated Data (AAD)
console.log('3. Using Additional Authenticated Data (AAD):');
// AAD is authenticated but not encrypted - perfect for metadata
const message = 'Transfer $500 to account 12345';
const metadata = 'User: alice, Timestamp: 2024-01-15, IP: 192.168.1.1';
const key3 = crypto.randomBytes(32);
const iv3 = crypto.randomBytes(16);

// Encrypt with AAD
const cipher3 = crypto.createCipheriv('aes-256-gcm', key3, iv3);
cipher3.setAAD(Buffer.from(metadata)); // AAD is authenticated but not encrypted
let encrypted3 = cipher3.update(message, 'utf8', 'hex');
encrypted3 += cipher3.final('hex');
const tag3 = cipher3.getAuthTag();

console.log('Message (encrypted):', message);
console.log('Metadata (authenticated, not encrypted):', metadata);
console.log('Ciphertext:', encrypted3);

// Decrypt with AAD
const decipher3 = crypto.createDecipheriv('aes-256-gcm', key3, iv3);
decipher3.setAAD(Buffer.from(metadata)); // Must provide same AAD!
decipher3.setAuthTag(tag3);
let decrypted3 = decipher3.update(encrypted3, 'hex', 'utf8');
decrypted3 += decipher3.final('utf8');

console.log('Decrypted message:', decrypted3);
console.log('Metadata verified:', '✓');
console.log();

// Try with wrong AAD
console.log('4. AAD Tampering Detection:');
try {
  const wrongMetadata = 'User: bob, Timestamp: 2024-01-15, IP: 192.168.1.1';
  const decipher4 = crypto.createDecipheriv('aes-256-gcm', key3, iv3);
  decipher4.setAAD(Buffer.from(wrongMetadata)); // Wrong AAD!
  decipher4.setAuthTag(tag3);
  let result = decipher4.update(encrypted3, 'hex', 'utf8');
  result += decipher4.final('utf8');
  console.log('Decrypted:', result);
} catch (err) {
  console.log('✓ Decryption failed:', err.message);
  console.log('✓ GCM detected AAD tampering!');
}
console.log();

// Example 5: Complete Encryption Utility
console.log('5. Complete AES-GCM Utility:');

/**
 * Encrypts data using AES-256-GCM
 * Returns object with all components needed for decryption
 */
function encryptGCM(plaintext, key, aad = null) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  if (aad) {
    cipher.setAAD(Buffer.from(aad));
  }

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    aad: aad || null
  };
}

/**
 * Decrypts data using AES-256-GCM
 * Throws error if authentication fails
 */
function decryptGCM(encrypted, key) {
  const { ciphertext, iv, authTag, aad } = encrypted;

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  );

  if (aad) {
    decipher.setAAD(Buffer.from(aad));
  }

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

// Test the utility
const masterKey = crypto.randomBytes(32);
const sensitiveData = 'Credit Card: 1234-5678-9012-3456';
const additionalData = 'CardHolder: John Doe';

const encrypted = encryptGCM(sensitiveData, masterKey, additionalData);
console.log('Encrypted package:', {
  ciphertext: encrypted.ciphertext,
  iv: encrypted.iv,
  authTag: encrypted.authTag.slice(0, 20) + '...',
  aad: encrypted.aad
});

const decrypted = decryptGCM(encrypted, masterKey);
console.log('Decrypted:', decrypted);
console.log('Match:', sensitiveData === decrypted ? '✓' : '✗');
console.log();

// Example 6: Storing Encrypted Data
console.log('6. Practical Storage Format:');

function encryptForStorage(data, key, metadata = {}) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  // Use metadata as AAD
  const aad = JSON.stringify(metadata);
  cipher.setAAD(Buffer.from(aad));

  let ciphertext = cipher.update(data, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Return complete package for storage
  return {
    version: 1,
    algorithm: 'aes-256-gcm',
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    metadata,
    timestamp: new Date().toISOString()
  };
}

function decryptFromStorage(stored, key) {
  if (stored.version !== 1) {
    throw new Error('Unsupported encryption version');
  }

  if (stored.algorithm !== 'aes-256-gcm') {
    throw new Error('Unsupported algorithm');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(stored.iv, 'hex')
  );

  const aad = JSON.stringify(stored.metadata);
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(stored.authTag, 'hex'));

  let plaintext = decipher.update(stored.ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

// Test storage format
const storageKey = crypto.randomBytes(32);
const userData = JSON.stringify({
  username: 'alice',
  email: 'alice@example.com',
  ssn: '123-45-6789'
});

const storedData = encryptForStorage(userData, storageKey, {
  userId: 'user-123',
  purpose: 'profile-data'
});

console.log('Stored package:');
console.log(JSON.stringify(storedData, null, 2));
console.log();

const retrievedData = decryptFromStorage(storedData, storageKey);
console.log('Retrieved data:', retrievedData);
console.log('Parsed:', JSON.parse(retrievedData));
console.log();

// Example 7: Different IV Sizes
console.log('7. IV/Nonce Size Considerations:');
// GCM supports different IV sizes, but 12 bytes (96 bits) is optimal
const testData = 'Test data';
const testKey = crypto.randomBytes(32);

// 12-byte IV (recommended for GCM)
const iv12 = crypto.randomBytes(12);
const cipher12 = crypto.createCipheriv('aes-256-gcm', testKey, iv12);
let enc12 = cipher12.update(testData, 'utf8', 'hex');
enc12 += cipher12.final('hex');
console.log('12-byte IV (optimal):', iv12.toString('hex'));

// 16-byte IV (also works)
const iv16 = crypto.randomBytes(16);
const cipher16 = crypto.createCipheriv('aes-256-gcm', testKey, iv16);
let enc16 = cipher16.update(testData, 'utf8', 'hex');
enc16 += cipher16.final('hex');
console.log('16-byte IV (acceptable):', iv16.toString('hex'));

console.log('Both work, but 12-byte is optimal for GCM performance');
console.log();

// Example 8: Error Handling
console.log('8. Proper Error Handling:');

function safeEncryptGCM(plaintext, key, options = {}) {
  try {
    if (!plaintext || !key) {
      throw new Error('Plaintext and key are required');
    }

    if (key.length !== 32) {
      throw new Error('Key must be 32 bytes for AES-256');
    }

    const iv = crypto.randomBytes(options.ivLength || 12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    if (options.aad) {
      cipher.setAAD(Buffer.from(options.aad));
    }

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      success: true,
      data: {
        ciphertext,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        aad: options.aad || null
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// Test error handling
const result1 = safeEncryptGCM('Valid data', crypto.randomBytes(32));
console.log('Valid encryption:', result1.success ? '✓' : '✗');

const result2 = safeEncryptGCM('Data', Buffer.from('short-key'));
console.log('Invalid key:', result2.success ? '✗' : '✓ (correctly rejected)');
console.log('Error:', result2.error);

console.log();

// Example 9: Performance Comparison
console.log('9. Performance Characteristics:');
const perfData = 'x'.repeat(10000); // 10KB
const perfKey = crypto.randomBytes(32);

// Time GCM encryption
const startGCM = Date.now();
for (let i = 0; i < 100; i++) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', perfKey, iv);
  let enc = cipher.update(perfData, 'utf8', 'hex');
  enc += cipher.final('hex');
  cipher.getAuthTag();
}
const endGCM = Date.now();

console.log('100 GCM encryptions of 10KB data:', endGCM - startGCM, 'ms');
console.log('Average per encryption:', ((endGCM - startGCM) / 100).toFixed(2), 'ms');
console.log('GCM provides encryption + authentication in one pass!');
console.log();

// Example 10: Real-World Use Cases
console.log('10. Real-World Use Cases:');

// Use Case 1: API Request Encryption
function encryptAPIRequest(requestData, apiKey) {
  const timestamp = Date.now().toString();
  const requestId = crypto.randomUUID();

  const metadata = JSON.stringify({ timestamp, requestId });

  return encryptGCM(
    JSON.stringify(requestData),
    apiKey,
    metadata
  );
}

const apiKey = crypto.randomBytes(32);
const request = { action: 'transfer', amount: 1000, to: 'account-456' };
const encryptedRequest = encryptAPIRequest(request, apiKey);

console.log('Encrypted API Request:');
console.log('  Request ID:', JSON.parse(encryptedRequest.aad).requestId);
console.log('  Timestamp:', JSON.parse(encryptedRequest.aad).timestamp);
console.log('  Encrypted data:', encryptedRequest.ciphertext.slice(0, 40) + '...');
console.log();

// Use Case 2: Secure File Storage
function encryptFile(fileContent, password) {
  // Derive key from password using scrypt
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 32);

  const encrypted = encryptGCM(fileContent, key);

  return {
    ...encrypted,
    salt: salt.toString('hex'),
    kdf: 'scrypt'
  };
}

function decryptFile(encrypted, password) {
  const salt = Buffer.from(encrypted.salt, 'hex');
  const key = crypto.scryptSync(password, salt, 32);

  return decryptGCM(encrypted, key);
}

const fileData = 'Confidential document contents...';
const password = 'strong-user-password';

const encryptedFile = encryptFile(fileData, password);
console.log('Encrypted File Package:');
console.log('  KDF:', encryptedFile.kdf);
console.log('  Salt:', encryptedFile.salt);
console.log('  IV:', encryptedFile.iv);
console.log();

const decryptedFile = decryptFile(encryptedFile, password);
console.log('Decrypted file:', decryptedFile);
console.log('Match:', fileData === decryptedFile ? '✓' : '✗');

console.log('\n=== Key Takeaways ===');
console.log('✓ AES-GCM provides encryption AND authentication');
console.log('✓ Always use a unique IV/nonce for each encryption');
console.log('✓ Auth tag must be verified during decryption');
console.log('✓ AAD allows authenticating metadata without encrypting it');
console.log('✓ GCM detects any tampering with ciphertext or AAD');
console.log('✓ Use 12-byte IV for optimal GCM performance');
console.log('✓ Store IV and auth tag with ciphertext for decryption');
console.log('✓ GCM is preferred over CBC for most applications');
