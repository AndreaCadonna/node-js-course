/**
 * Exercise 1: AES-GCM Encryption Utility - SOLUTION
 *
 * Complete implementation of AES-GCM encryption utility with
 * authentication, AAD support, and password-based encryption.
 */

const crypto = require('crypto');

console.log('=== Exercise 1: AES-GCM Encryption Utility - SOLUTION ===\n');

// ============================================================================
// Task 1: Basic AES-GCM Encryption
// ============================================================================
console.log('Task 1: AES-GCM Encryption');

function encryptGCM(plaintext, key) {
  const iv = crypto.randomBytes(16); // 128-bit IV (12 bytes is optimal, but 16 works)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

// Test
const testKey = crypto.randomBytes(32);
const testData = 'Secret message for GCM encryption';
const encrypted = encryptGCM(testData, testKey);
console.log('Encrypted:', encrypted.ciphertext.slice(0, 40) + '...');
console.log('✓ Task 1 Complete\n');

// ============================================================================
// Task 2: Basic AES-GCM Decryption
// ============================================================================
console.log('Task 2: AES-GCM Decryption');

function decryptGCM(encrypted, key) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(encrypted.iv, 'hex')
  );
  
  // IMPORTANT: Set auth tag BEFORE any update calls
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
  
  let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8'); // Throws if authentication fails
  
  return plaintext;
}

// Test
const decrypted = decryptGCM(encrypted, testKey);
console.log('Decrypted:', decrypted);
console.log('Match:', testData === decrypted ? '✓' : '✗');
console.log('✓ Task 2 Complete\n');

// ============================================================================
// Task 3: Encryption with AAD
// ============================================================================
console.log('Task 3: AAD Support');

function encryptWithAAD(plaintext, key, aad = null) {
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

function decryptWithAAD(encrypted, key) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(encrypted.iv, 'hex')
  );
  
  if (encrypted.aad) {
    decipher.setAAD(Buffer.from(encrypted.aad));
  }
  
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
  
  let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');
  
  return plaintext;
}

// Test
const message = 'Message with metadata';
const metadata = 'user:alice,timestamp:2024-01-15';
const encAAD = encryptWithAAD(message, testKey, metadata);
const decAAD = decryptWithAAD(encAAD, testKey);
console.log('Decrypted with AAD:', decAAD);
console.log('Match:', message === decAAD ? '✓' : '✗');
console.log('✓ Task 3 Complete\n');

// ============================================================================
// Task 4: Tamper Detection
// ============================================================================
console.log('Task 4: Tamper Detection');

function testTamperDetection(plaintext, key) {
  try {
    // Encrypt
    const encrypted = encryptGCM(plaintext, key);
    
    // Tamper with ciphertext
    const tampered = {
      ...encrypted,
      ciphertext: encrypted.ciphertext.slice(0, -4) + 'ffff'
    };
    
    // Try to decrypt - should fail
    decryptGCM(tampered, key);
    return false; // Decryption succeeded (bad!)
  } catch (err) {
    return true; // Decryption failed (good!)
  }
}

const detected = testTamperDetection('Important data', testKey);
console.log('Tampering detected:', detected ? '✓' : '✗ SECURITY ISSUE');
console.log('✓ Task 4 Complete\n');

// ============================================================================
// Task 5: Complete Encryption Service
// ============================================================================
console.log('Task 5: Encryption Service');

class EncryptionService {
  constructor(masterKey) {
    if (!masterKey || masterKey.length !== 32) {
      throw new Error('Master key must be 32 bytes');
    }
    this.masterKey = masterKey;
    this.currentVersion = 1;
  }
  
  encrypt(data, metadata = {}) {
    const iv = crypto.randomBytes(12); // 96-bit optimal for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    
    const aad = JSON.stringify(metadata);
    cipher.setAAD(Buffer.from(aad));
    
    let ciphertext = cipher.update(data, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return {
      version: this.currentVersion,
      algorithm: 'aes-256-gcm',
      ciphertext,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      metadata,
      timestamp: new Date().toISOString()
    };
  }
  
  decrypt(encrypted) {
    if (encrypted.version !== this.currentVersion) {
      console.warn(`Warning: Encrypted with version ${encrypted.version}, current is ${this.currentVersion}`);
    }
    
    if (encrypted.algorithm !== 'aes-256-gcm') {
      throw new Error(`Unsupported algorithm: ${encrypted.algorithm}`);
    }
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.masterKey,
      Buffer.from(encrypted.iv, 'hex')
    );
    
    const aad = JSON.stringify(encrypted.metadata);
    decipher.setAAD(Buffer.from(aad));
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
    
    let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
  }
  
  needsReencryption(encrypted) {
    return encrypted.version < this.currentVersion;
  }
}

// Test
const service = new EncryptionService(crypto.randomBytes(32));
const serviceEnc = service.encrypt('Sensitive data', { userId: '123' });
const serviceDec = service.decrypt(serviceEnc);
console.log('Service encrypted and decrypted:', serviceDec);
console.log('Needs reencryption:', service.needsReencryption(serviceEnc) ? '✓' : '✗');
console.log('✓ Task 5 Complete\n');

// ============================================================================
// Bonus: Password-Based Encryption
// ============================================================================
console.log('Bonus: Password-Based Encryption');

function encryptWithPassword(plaintext, password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
  
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    salt: salt.toString('hex'),
    kdf: 'scrypt',
    kdfParams: { N: 16384, r: 8, p: 1 }
  };
}

function decryptWithPassword(encrypted, password) {
  const salt = Buffer.from(encrypted.salt, 'hex');
  const key = crypto.scryptSync(password, salt, 32, encrypted.kdfParams);
  
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(encrypted.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
  
  let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');
  
  return plaintext;
}

// Test
const pwdData = 'Password-protected data';
const password = 'MySecurePassword123!';
const pwdEnc = encryptWithPassword(pwdData, password);
const pwdDec = decryptWithPassword(pwdEnc, password);
console.log('Password-based encryption:', pwdDec);
console.log('Match:', pwdData === pwdDec ? '✓' : '✗');
console.log('✓ Bonus Complete\n');

console.log('=== Exercise 1 Solution Complete ===');
console.log('\nKey Implementations:');
console.log('✓ AES-256-GCM encryption/decryption');
console.log('✓ Authentication tag verification');
console.log('✓ Additional Authenticated Data support');
console.log('✓ Tamper detection');
console.log('✓ Complete encryption service');
console.log('✓ Password-based encryption with scrypt');
