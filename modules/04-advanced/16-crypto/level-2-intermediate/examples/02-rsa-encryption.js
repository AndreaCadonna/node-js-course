/**
 * RSA Encryption Examples
 *
 * Demonstrates asymmetric encryption using RSA (Rivest-Shamir-Adleman).
 * RSA uses public/private key pairs: encrypt with public, decrypt with private.
 */

const crypto = require('crypto');

console.log('=== RSA Asymmetric Encryption ===\n');

// Example 1: Generate RSA Key Pair
console.log('1. Generating RSA Key Pair:');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048, // Key size in bits (2048 or 4096 recommended)
  publicKeyEncoding: {
    type: 'spki',      // SubjectPublicKeyInfo
    format: 'pem'      // PEM format (base64 encoded)
  },
  privateKeyEncoding: {
    type: 'pkcs8',     // PKCS #8
    format: 'pem'
  }
});

console.log('Public Key (first 100 chars):');
console.log(publicKey.substring(0, 100) + '...');
console.log('\nPrivate Key (first 100 chars):');
console.log(privateKey.substring(0, 100) + '...');
console.log();

// Example 2: Basic RSA Encryption and Decryption
console.log('2. Basic RSA Encryption:');
const message = 'Secret message for RSA';

console.log('Original message:', message);

// Encrypt with public key
const encrypted = crypto.publicEncrypt(
  publicKey,
  Buffer.from(message, 'utf8')
);

console.log('Encrypted (hex):', encrypted.toString('hex'));
console.log('Encrypted length:', encrypted.length, 'bytes');
console.log();

// Decrypt with private key
const decrypted = crypto.privateDecrypt(privateKey, encrypted);

console.log('Decrypted:', decrypted.toString('utf8'));
console.log('Match:', message === decrypted.toString('utf8') ? '✓' : '✗');
console.log();

// Example 3: Different Padding Schemes
console.log('3. RSA Padding Schemes:');

// OAEP padding (recommended for encryption)
const encryptedOAEP = crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  },
  Buffer.from('Message with OAEP padding')
);

console.log('OAEP encrypted:', encryptedOAEP.toString('hex').slice(0, 60) + '...');

const decryptedOAEP = crypto.privateDecrypt(
  {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  },
  encryptedOAEP
);

console.log('OAEP decrypted:', decryptedOAEP.toString('utf8'));
console.log();

// PKCS1 padding (older, still widely used)
const encryptedPKCS1 = crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  },
  Buffer.from('Message with PKCS1 padding')
);

console.log('PKCS1 encrypted:', encryptedPKCS1.toString('hex').slice(0, 60) + '...');
console.log('Note: OAEP is more secure, use it for new applications');
console.log();

// Example 4: Key Size Limitations
console.log('4. RSA Size Limitations:');

// RSA can only encrypt data smaller than the key size
// For 2048-bit key with OAEP/SHA-256: max data = (2048/8) - 2*32 - 2 = 190 bytes

const maxMessage = 'x'.repeat(190); // Should work
const tooLarge = 'x'.repeat(500);   // Will fail

console.log('2048-bit RSA key size:', 2048 / 8, 'bytes =', 2048 / 8, 'bytes');
console.log('With OAEP-SHA256, max data ≈ 190 bytes');

try {
  const enc = crypto.publicEncrypt(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(maxMessage)
  );
  console.log('✓ 190 bytes encrypted successfully');
} catch (err) {
  console.log('✗ Failed:', err.message);
}

try {
  const enc = crypto.publicEncrypt(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(tooLarge)
  );
  console.log('500 bytes encrypted');
} catch (err) {
  console.log('✗ 500 bytes too large (as expected):', err.message.split('\n')[0]);
}
console.log();

// Example 5: Hybrid Encryption (RSA + AES)
console.log('5. Hybrid Encryption (RSA + AES):');
// For large data: encrypt data with AES, encrypt AES key with RSA

function hybridEncrypt(data, publicKey) {
  // Generate random AES key
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  // Encrypt data with AES
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  let encryptedData = cipher.update(data, 'utf8', 'hex');
  encryptedData += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Encrypt AES key with RSA
  const encryptedKey = crypto.publicEncrypt(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    aesKey
  );

  return {
    encryptedData,
    encryptedKey: encryptedKey.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function hybridDecrypt(encrypted, privateKey) {
  // Decrypt AES key with RSA
  const aesKey = crypto.privateDecrypt(
    { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(encrypted.encryptedKey, 'hex')
  );

  // Decrypt data with AES
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    aesKey,
    Buffer.from(encrypted.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));

  let decryptedData = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
  decryptedData += decipher.final('utf8');

  return decryptedData;
}

// Test hybrid encryption with large data
const largeData = 'This is a large document. '.repeat(100); // ~2.7KB
console.log('Large data size:', largeData.length, 'bytes');

const hybridEncrypted = hybridEncrypt(largeData, publicKey);
console.log('Hybrid encrypted:');
console.log('  Encrypted data length:', hybridEncrypted.encryptedData.length, 'chars');
console.log('  Encrypted AES key length:', hybridEncrypted.encryptedKey.length, 'chars');
console.log();

const hybridDecrypted = hybridDecrypt(hybridEncrypted, privateKey);
console.log('Decrypted length:', hybridDecrypted.length, 'bytes');
console.log('Match:', largeData === hybridDecrypted ? '✓' : '✗');
console.log();

// Example 6: Password-Protected Private Key
console.log('6. Password-Protected Private Key:');

const { publicKey: pubKey, privateKey: privKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: 'my-secret-passphrase' // Encrypt private key
  }
});

console.log('Protected private key (first 100 chars):');
console.log(privKey.substring(0, 100) + '...');
console.log('Notice: "ENCRYPTED PRIVATE KEY" header');
console.log();

// To use encrypted private key, provide passphrase
const testMessage = 'Test with encrypted key';
const encTest = crypto.publicEncrypt(pubKey, Buffer.from(testMessage));

const decTest = crypto.privateDecrypt(
  {
    key: privKey,
    passphrase: 'my-secret-passphrase' // Required for encrypted key
  },
  encTest
);

console.log('Decrypted:', decTest.toString('utf8'));
console.log('✓ Passphrase-protected key works!');
console.log();

// Example 7: Different Key Sizes
console.log('7. Different RSA Key Sizes:');

// 2048-bit (standard)
const start2048 = Date.now();
const keys2048 = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const time2048 = Date.now() - start2048;

// 4096-bit (high security)
const start4096 = Date.now();
const keys4096 = crypto.generateKeyPairSync('rsa', { modulusLength: 4096 });
const time4096 = Date.now() - start4096;

console.log('Key generation times:');
console.log('  2048-bit:', time2048, 'ms (standard security)');
console.log('  4096-bit:', time4096, 'ms (high security)');
console.log();

// Compare encryption/decryption speed
const testData = Buffer.from('Speed test data');

const start2048Enc = Date.now();
for (let i = 0; i < 10; i++) {
  const enc = crypto.publicEncrypt(keys2048.publicKey, testData);
  crypto.privateDecrypt(keys2048.privateKey, enc);
}
const time2048Enc = Date.now() - start2048Enc;

const start4096Enc = Date.now();
for (let i = 0; i < 10; i++) {
  const enc = crypto.publicEncrypt(keys4096.publicKey, testData);
  crypto.privateDecrypt(keys4096.privateKey, enc);
}
const time4096Enc = Date.now() - start4096Enc;

console.log('10 encrypt+decrypt operations:');
console.log('  2048-bit:', time2048Enc, 'ms');
console.log('  4096-bit:', time4096Enc, 'ms');
console.log('  Ratio:', (time4096Enc / time2048Enc).toFixed(2) + 'x slower');
console.log();

// Example 8: Exporting and Importing Keys
console.log('8. Exporting and Importing Keys:');

// Create key pair
const { publicKey: expPub, privateKey: expPriv } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});

// Export keys in different formats
const publicKeyPEM = crypto.createPublicKey(expPub).export({
  type: 'spki',
  format: 'pem'
});

const publicKeyDER = crypto.createPublicKey(expPub).export({
  type: 'spki',
  format: 'der'
});

const privateKeyPEM = crypto.createPrivateKey(expPriv).export({
  type: 'pkcs8',
  format: 'pem'
});

console.log('Public key formats:');
console.log('  PEM length:', publicKeyPEM.length, 'chars');
console.log('  DER length:', publicKeyDER.length, 'bytes');
console.log();

// Import keys back
const importedPublic = crypto.createPublicKey(publicKeyPEM);
const importedPrivate = crypto.createPrivateKey(privateKeyPEM);

// Test imported keys
const testMsg = 'Test imported keys';
const encImported = crypto.publicEncrypt(importedPublic, Buffer.from(testMsg));
const decImported = crypto.privateDecrypt(importedPrivate, encImported);

console.log('Imported keys test:', decImported.toString('utf8') === testMsg ? '✓' : '✗');
console.log();

// Example 9: Key Pair from Existing Keys
console.log('9. Working with Key Objects:');

// Create KeyObject instances
const publicKeyObject = crypto.createPublicKey(publicKey);
const privateKeyObject = crypto.createPrivateKey(privateKey);

// Get key details
console.log('Public key details:');
console.log('  Type:', publicKeyObject.type); // 'public'
console.log('  Asymmetric key type:', publicKeyObject.asymmetricKeyType); // 'rsa'
console.log('  Asymmetric key details:', publicKeyObject.asymmetricKeyDetails);
console.log();

// Example 10: Real-World Use Cases
console.log('10. Real-World Use Cases:');

// Use Case 1: Secure Key Exchange
console.log('Use Case 1: Secure Key Exchange');

// Alice wants to send encrypted data to Bob
// Bob generates key pair and shares public key
const bob = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Alice generates session key and encrypts it with Bob's public key
const sessionKey = crypto.randomBytes(32);
const encryptedSessionKey = crypto.publicEncrypt(
  { key: bob.publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
  sessionKey
);

console.log('Alice generated session key and encrypted with Bob\'s public key');
console.log('Encrypted session key:', encryptedSessionKey.toString('hex').slice(0, 40) + '...');

// Bob decrypts session key with his private key
const decryptedSessionKey = crypto.privateDecrypt(
  { key: bob.privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
  encryptedSessionKey
);

console.log('Bob decrypted session key:',
  decryptedSessionKey.toString('hex') === sessionKey.toString('hex') ? '✓' : '✗');

// Now Alice and Bob can use session key for fast symmetric encryption
const aliceMessage = 'Secret message from Alice';
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-gcm', sessionKey, iv);
let encMsg = cipher.update(aliceMessage, 'utf8', 'hex');
encMsg += cipher.final('hex');
const tag = cipher.getAuthTag();

console.log('Alice sends encrypted message using session key');

// Bob decrypts
const decipher = crypto.createDecipheriv('aes-256-gcm', decryptedSessionKey, iv);
decipher.setAuthTag(tag);
let bobReceived = decipher.update(encMsg, 'hex', 'utf8');
bobReceived += decipher.final('utf8');

console.log('Bob received:', bobReceived);
console.log('✓ Secure key exchange complete!');
console.log();

// Use Case 2: Encrypting Configuration
console.log('Use Case 2: Encrypting Configuration Files');

const configKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

const sensitiveConfig = JSON.stringify({
  database: 'postgresql://user:pass@localhost:5432/db',
  apiKey: 'sk-1234567890abcdef',
  secret: 'top-secret-value'
});

// Encrypt config
const encryptedConfig = hybridEncrypt(sensitiveConfig, configKeys.publicKey);
console.log('Config encrypted and ready for storage');
console.log('Encrypted config size:', JSON.stringify(encryptedConfig).length, 'bytes');

// Decrypt config (e.g., when application starts)
const decryptedConfig = hybridDecrypt(encryptedConfig, configKeys.privateKey);
const config = JSON.parse(decryptedConfig);
console.log('Config decrypted:');
console.log('  Database:', config.database.substring(0, 30) + '...');
console.log('  API Key:', config.apiKey.substring(0, 10) + '...');
console.log();

// Example 11: Error Handling
console.log('11. Error Handling:');

function safeRSAEncrypt(data, publicKey) {
  try {
    if (!data || !publicKey) {
      throw new Error('Data and public key required');
    }

    // Check data size (rough estimate for 2048-bit key with OAEP)
    if (Buffer.from(data).length > 190) {
      return {
        success: false,
        error: 'Data too large for RSA. Use hybrid encryption instead.',
        suggestion: 'Use hybridEncrypt() for large data'
      };
    }

    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      Buffer.from(data)
    );

    return {
      success: true,
      encrypted: encrypted.toString('hex')
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// Test error handling
const result1 = safeRSAEncrypt('Valid short message', publicKey);
console.log('Short message:', result1.success ? '✓' : '✗');

const result2 = safeRSAEncrypt('x'.repeat(500), publicKey);
console.log('Large message:', result2.success ? '✗ (rejected as expected)' : '✗');
console.log('Suggestion:', result2.suggestion);

console.log('\n=== Key Takeaways ===');
console.log('✓ RSA uses public/private key pairs');
console.log('✓ Public key encrypts, private key decrypts');
console.log('✓ RSA can only encrypt small amounts of data');
console.log('✓ Use hybrid encryption (RSA + AES) for large data');
console.log('✓ OAEP padding is more secure than PKCS1');
console.log('✓ 2048-bit keys are standard, 4096-bit for high security');
console.log('✓ Protect private keys with passphrases');
console.log('✓ Private keys must be kept secret');
console.log('✓ Public keys can be shared freely');
console.log('✓ RSA is slower than symmetric encryption');
