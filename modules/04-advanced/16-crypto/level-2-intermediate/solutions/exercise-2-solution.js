/**
 * Exercise 2 Solution: RSA Key Pair Generator and Encryptor
 * Demonstrates RSA operations and hybrid encryption
 */
const crypto = require('crypto');
console.log('=== Exercise 2 Solution: RSA Key Pair Generator ===\n');

// Task 1: Generate RSA Key Pair
function generateRSAKeyPair(modulusLength = 2048) {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
}
console.log('✓ Task 1: Key pair generation implemented\n');

// Task 2: RSA Encryption/Decryption
function rsaEncrypt(data, publicKey) {
  return crypto.publicEncrypt({
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, Buffer.from(data)).toString('hex');
}

function rsaDecrypt(encryptedHex, privateKey) {
  return crypto.privateDecrypt({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, Buffer.from(encryptedHex, 'hex')).toString('utf8');
}
console.log('✓ Task 2: RSA encryption/decryption implemented\n');

// Task 3: Hybrid Encryption
function hybridEncrypt(data, publicKey) {
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  let encryptedData = cipher.update(data, 'utf8', 'hex');
  encryptedData += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  const encryptedKey = crypto.publicEncrypt({
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, aesKey).toString('hex');
  
  return { encryptedData, encryptedKey, iv: iv.toString('hex'), authTag: authTag.toString('hex') };
}

function hybridDecrypt(encrypted, privateKey) {
  const aesKey = crypto.privateDecrypt({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, Buffer.from(encrypted.encryptedKey, 'hex'));
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(encrypted.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
  let data = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
  data += decipher.final('utf8');
  return data;
}
console.log('✓ Task 3: Hybrid encryption implemented\n');

// Task 4: Password-Protected Keys
function generateProtectedKeyPair(passphrase, modulusLength = 2048) {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase
    }
  });
}
console.log('✓ Task 4: Password-protected keys implemented\n');

// Task 5: Key Management System
class KeyManager {
  constructor() {
    this.keys = new Map();
  }
  
  generateKeyPair(id, size = 2048, passphrase = null) {
    const keyPair = passphrase 
      ? generateProtectedKeyPair(passphrase, size)
      : generateRSAKeyPair(size);
    this.keys.set(id, keyPair);
    return keyPair.publicKey;
  }
  
  getPublicKey(id) {
    return this.keys.get(id)?.publicKey;
  }
  
  encryptFor(id, data) {
    const publicKey = this.getPublicKey(id);
    if (!publicKey) throw new Error('Public key not found');
    return hybridEncrypt(data, publicKey);
  }
  
  decryptWith(id, encrypted, passphrase = null) {
    const keyPair = this.keys.get(id);
    if (!keyPair) throw new Error('Key pair not found');
    const privateKey = passphrase ? { key: keyPair.privateKey, passphrase } : keyPair.privateKey;
    return hybridDecrypt(encrypted, privateKey);
  }
}
console.log('✓ Task 5: KeyManager implemented\n');
console.log('=== Exercise 2 Solution Complete ===');
