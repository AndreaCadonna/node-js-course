/**
 * Advanced Cryptographic Patterns
 *
 * Demonstrates real-world intermediate cryptographic patterns combining
 * multiple techniques for production-ready security implementations.
 */

const crypto = require('crypto');

console.log('=== Advanced Cryptographic Patterns ===\n');

// Example 1: Secure Envelope Pattern (Hybrid Encryption)
console.log('1. Secure Envelope Pattern:');

class SecureEnvelope {
  constructor(recipientPublicKey) {
    this.recipientPublicKey = recipientPublicKey;
  }

  seal(message) {
    // Generate ephemeral AES key
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    // Encrypt message with AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    let ciphertext = cipher.update(message, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Encrypt AES key with recipient's public key
    const encryptedKey = crypto.publicEncrypt(
      {
        key: this.recipientPublicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      aesKey
    );

    return {
      ciphertext,
      encryptedKey: encryptedKey.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  open(envelope, privateKey) {
    // Decrypt AES key
    const aesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      Buffer.from(envelope.encryptedKey, 'hex')
    );

    // Decrypt message
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      aesKey,
      Buffer.from(envelope.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(envelope.authTag, 'hex'));
    let plaintext = decipher.update(envelope.ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  }
}

// Test secure envelope
const recipientKeys = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const envelope = new SecureEnvelope(recipientKeys.publicKey);
const sealed = envelope.seal('Confidential business proposal');

console.log('Sealed envelope:');
console.log('  Encrypted key:', sealed.encryptedKey.slice(0, 40) + '...');
console.log('  Ciphertext:', sealed.ciphertext.slice(0, 40) + '...');

const opened = envelope.open(sealed, recipientKeys.privateKey);
console.log('Opened message:', opened);
console.log();

// Example 2: Password-Based Encryption with Key Stretching
console.log('2. Password-Based Encryption (Complete System):');

class PasswordCrypto {
  static encrypt(data, password) {
    // Generate salt for key derivation
    const salt = crypto.randomBytes(16);

    // Derive key using scrypt
    const key = crypto.scryptSync(password, salt, 32, {
      N: 16384,
      r: 8,
      p: 1
    });

    // Encrypt with AES-GCM
    const iv = crypto.randomBytes(12); // 12 bytes optimal for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ciphertext = cipher.update(data, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      version: 1,
      algorithm: 'aes-256-gcm',
      kdf: 'scrypt',
      kdfParams: { N: 16384, r: 8, p: 1 },
      ciphertext,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      salt: salt.toString('hex')
    };
  }

  static decrypt(encrypted, password) {
    // Derive key with same parameters
    const salt = Buffer.from(encrypted.salt, 'hex');
    const key = crypto.scryptSync(password, salt, 32, encrypted.kdfParams);

    // Decrypt
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
}

const sensitiveData = JSON.stringify({
  creditCard: '1234-5678-9012-3456',
  cvv: '123',
  expiry: '12/25'
});

const userPassword = 'MyStrongPassword123!';
const encryptedData = PasswordCrypto.encrypt(sensitiveData, userPassword);

console.log('Password-based encryption:');
console.log('  KDF:', encryptedData.kdf);
console.log('  KDF params:', JSON.stringify(encryptedData.kdfParams));
console.log('  Ciphertext:', encryptedData.ciphertext.slice(0, 40) + '...');

const decryptedData = PasswordCrypto.decrypt(encryptedData, userPassword);
console.log('Decrypted:', JSON.parse(decryptedData));
console.log();

// Example 3: Authenticated Key Exchange (Simplified)
console.log('3. Authenticated Key Exchange:');

class KeyExchange {
  constructor() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048
    });
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  initiateExchange() {
    // Generate ephemeral session key
    const sessionKey = crypto.randomBytes(32);
    return { sessionKey };
  }

  encryptSessionKey(sessionKey, recipientPublicKey) {
    // Encrypt session key for recipient
    const encrypted = crypto.publicEncrypt(
      {
        key: recipientPublicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      sessionKey
    );

    // Sign the encrypted key
    const sign = crypto.createSign('SHA256');
    sign.update(encrypted);
    const signature = sign.sign(this.privateKey);

    return {
      encryptedKey: encrypted,
      signature
    };
  }

  decryptSessionKey(exchange, senderPublicKey) {
    // Verify signature
    const verify = crypto.createVerify('SHA256');
    verify.update(exchange.encryptedKey);
    const signatureValid = verify.verify(senderPublicKey, exchange.signature);

    if (!signatureValid) {
      throw new Error('Invalid signature - possible man-in-the-middle attack!');
    }

    // Decrypt session key
    const sessionKey = crypto.privateDecrypt(
      {
        key: this.privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      exchange.encryptedKey
    );

    return sessionKey;
  }
}

// Alice and Bob establish secure session
const alice = new KeyExchange();
const bob = new KeyExchange();

// Alice initiates
const { sessionKey } = alice.initiateExchange();
console.log('Alice generated session key:', sessionKey.toString('hex').slice(0, 32) + '...');

// Alice sends to Bob
const exchange = alice.encryptSessionKey(sessionKey, bob.publicKey);
console.log('Alice encrypted session key for Bob');

// Bob receives and verifies
const bobSessionKey = bob.decryptSessionKey(exchange, alice.publicKey);
console.log('Bob decrypted session key:', bobSessionKey.toString('hex').slice(0, 32) + '...');
console.log('Keys match:', crypto.timingSafeEqual(sessionKey, bobSessionKey) ? '✓' : '✗');
console.log();

// Example 4: Encrypt-then-MAC Pattern
console.log('4. Encrypt-then-MAC Pattern:');

function encryptThenMAC(plaintext, encKey, macKey) {
  // Encrypt
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', encKey, iv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  // MAC over ciphertext + IV
  const hmac = crypto.createHmac('sha256', macKey);
  hmac.update(iv.toString('hex') + ciphertext);
  const mac = hmac.digest('hex');

  return {
    ciphertext,
    iv: iv.toString('hex'),
    mac
  };
}

function verifyThenDecrypt(encrypted, encKey, macKey) {
  // Verify MAC
  const hmac = crypto.createHmac('sha256', macKey);
  hmac.update(encrypted.iv + encrypted.ciphertext);
  const expectedMAC = hmac.digest('hex');

  if (!crypto.timingSafeEqual(
    Buffer.from(expectedMAC),
    Buffer.from(encrypted.mac)
  )) {
    throw new Error('MAC verification failed - data tampered!');
  }

  // Decrypt
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    encKey,
    Buffer.from(encrypted.iv, 'hex')
  );
  let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

const masterKey = crypto.randomBytes(32);
const encryptionKey = crypto.hkdfSync('sha256', masterKey, null, Buffer.from('enc'), 32);
const macKey = crypto.hkdfSync('sha256', masterKey, null, Buffer.from('mac'), 32);

const message = 'Sensitive data requiring both confidentiality and integrity';
const encrypted = encryptThenMAC(message, encryptionKey, macKey);

console.log('Encrypt-then-MAC:');
console.log('  Ciphertext:', encrypted.ciphertext.slice(0, 40) + '...');
console.log('  MAC:', encrypted.mac.slice(0, 40) + '...');

const decrypted = verifyThenDecrypt(encrypted, encryptionKey, macKey);
console.log('  Decrypted:', decrypted);
console.log('  Match:', message === decrypted ? '✓' : '✗');
console.log();

// Example 5: Versioned Encryption for Key Rotation
console.log('5. Versioned Encryption (Key Rotation):');

class VersionedEncryption {
  constructor() {
    this.keys = new Map();
    this.currentVersion = 1;
  }

  addKeyVersion(version, key) {
    this.keys.set(version, key);
    if (version > this.currentVersion) {
      this.currentVersion = version;
    }
  }

  encrypt(data) {
    const key = this.keys.get(this.currentVersion);
    if (!key) throw new Error('No key for current version');

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ciphertext = cipher.update(data, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      version: this.currentVersion,
      ciphertext,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encrypted) {
    const key = this.keys.get(encrypted.version);
    if (!key) throw new Error(`No key for version ${encrypted.version}`);

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

  needsReencryption(encrypted) {
    return encrypted.version < this.currentVersion;
  }
}

const versioned = new VersionedEncryption();
versioned.addKeyVersion(1, crypto.randomBytes(32));
versioned.addKeyVersion(2, crypto.randomBytes(32));

const v1Data = versioned.encrypt('Data encrypted with v1');
console.log('Encrypted with version:', v1Data.version);

// Rotate to version 2
versioned.currentVersion = 2;
const v2Data = versioned.encrypt('Data encrypted with v2');
console.log('Encrypted with version:', v2Data.version);

// Can still decrypt old version
const decrypted1 = versioned.decrypt(v1Data);
console.log('Decrypted v1:', decrypted1);
console.log('Needs re-encryption:', versioned.needsReencryption(v1Data) ? '✓' : '✗');
console.log();

// Example 6: Secure Token Generation
console.log('6. Secure Token System:');

class TokenSystem {
  constructor(secretKey) {
    this.secretKey = secretKey;
  }

  createToken(payload, expiresIn = 3600000) { // 1 hour default
    const tokenData = {
      payload,
      iat: Date.now(),
      exp: Date.now() + expiresIn,
      jti: crypto.randomUUID()
    };

    const tokenString = JSON.stringify(tokenData);
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(tokenString)
      .digest('hex');

    return {
      token: Buffer.from(tokenString).toString('base64'),
      signature
    };
  }

  verifyToken(token, signature) {
    // Verify signature
    const tokenString = Buffer.from(token, 'base64').toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(tokenString)
      .digest('hex');

    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      return { valid: false, reason: 'Invalid signature' };
    }

    // Parse and validate
    const tokenData = JSON.parse(tokenString);

    if (Date.now() > tokenData.exp) {
      return { valid: false, reason: 'Token expired' };
    }

    return { valid: true, payload: tokenData.payload };
  }
}

const tokenSystem = new TokenSystem(crypto.randomBytes(32));
const userToken = tokenSystem.createToken({ userId: 123, role: 'admin' });

console.log('Token created:');
console.log('  Token:', userToken.token.slice(0, 40) + '...');
console.log('  Signature:', userToken.signature.slice(0, 40) + '...');

const verification = tokenSystem.verifyToken(userToken.token, userToken.signature);
console.log('Token valid:', verification.valid ? '✓' : '✗');
console.log('Payload:', verification.payload);
console.log();

// Example 7: Multi-Layer Encryption
console.log('7. Multi-Layer Encryption:');

function multiLayerEncrypt(data, keys) {
  let encrypted = data;

  // Encrypt with each key in sequence
  for (let i = 0; i < keys.length; i++) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', keys[i], iv);
    let ciphertext = cipher.update(encrypted, i === 0 ? 'utf8' : 'hex', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    encrypted = JSON.stringify({
      layer: i + 1,
      ciphertext,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }

  return encrypted;
}

function multiLayerDecrypt(encrypted, keys) {
  let decrypted = encrypted;

  // Decrypt in reverse order
  for (let i = keys.length - 1; i >= 0; i--) {
    const layer = JSON.parse(decrypted);
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      keys[i],
      Buffer.from(layer.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(layer.authTag, 'hex'));
    decrypted = decipher.update(layer.ciphertext, 'hex', i === 0 ? 'utf8' : 'hex');
    decrypted += decipher.final(i === 0 ? 'utf8' : 'hex');
  }

  return decrypted;
}

const layers = [
  crypto.randomBytes(32),
  crypto.randomBytes(32),
  crypto.randomBytes(32)
];

const multiEncrypted = multiLayerEncrypt('Triple encrypted data', layers);
console.log('Multi-layer encrypted (3 layers)');
console.log('Size:', multiEncrypted.length, 'bytes');

const multiDecrypted = multiLayerDecrypt(multiEncrypted, layers);
console.log('Decrypted:', multiDecrypted);
console.log();

// Example 8: Secure Random Generation Utilities
console.log('8. Secure Random Utilities:');

class SecureRandom {
  static token(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static uuid() {
    return crypto.randomUUID();
  }

  static password(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const bytes = crypto.randomBytes(length);
    return Array.from(bytes)
      .map(byte => chars[byte % chars.length])
      .join('');
  }

  static pin(length = 6) {
    const max = Math.pow(10, length);
    return crypto.randomInt(0, max).toString().padStart(length, '0');
  }

  static apiKey() {
    const prefix = 'sk';
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(24).toString('base64url');
    return `${prefix}_${timestamp}_${random}`;
  }
}

console.log('Secure random utilities:');
console.log('  Token:', SecureRandom.token(16));
console.log('  UUID:', SecureRandom.uuid());
console.log('  Password:', SecureRandom.password(12));
console.log('  PIN:', SecureRandom.pin(6));
console.log('  API Key:', SecureRandom.apiKey());

console.log('\n=== Key Takeaways ===');
console.log('✓ Hybrid encryption combines RSA + AES strengths');
console.log('✓ Password-based encryption needs key stretching');
console.log('✓ Encrypt-then-MAC provides defense in depth');
console.log('✓ Key versioning enables safe key rotation');
console.log('✓ Authenticated key exchange prevents MITM attacks');
console.log('✓ Tokens should include expiry and signatures');
console.log('✓ Multi-layer encryption adds redundancy');
console.log('✓ Always use cryptographically secure randomness');
console.log('✓ Combine multiple techniques for production security');
console.log('✓ Design with key rotation and upgrades in mind');
