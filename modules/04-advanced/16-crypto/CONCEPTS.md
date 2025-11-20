# Crypto Module - Core Concepts

This document provides foundational knowledge about cryptography and the Node.js crypto module that applies across all levels of this module.

## Table of Contents

- [What is Cryptography?](#what-is-cryptography)
- [Why Cryptography Matters](#why-cryptography-matters)
- [Cryptography Categories](#cryptography-categories)
- [Hash Functions](#hash-functions)
- [Encryption](#encryption)
- [Message Authentication](#message-authentication)
- [Random Number Generation](#random-number-generation)
- [Common Use Cases](#common-use-cases)
- [Security Principles](#security-principles)

---

## What is Cryptography?

**Cryptography** is the practice and study of techniques for secure communication in the presence of adversaries. It encompasses:

- **Confidentiality**: Keeping data secret from unauthorized parties
- **Integrity**: Ensuring data hasn't been tampered with
- **Authentication**: Verifying the identity of parties
- **Non-repudiation**: Preventing denial of actions

### In Node.js

The `crypto` module provides cryptographic functionality powered by OpenSSL, including:

```javascript
const crypto = require('crypto');

// The module provides:
// - Hash functions (SHA-256, SHA-512, etc.)
// - HMAC (keyed-hash message authentication)
// - Ciphers (encryption/decryption)
// - Digital signatures
// - Random number generation
// - Key derivation functions
```

---

## Why Cryptography Matters

### Real-World Scenarios

**Password Storage**
```javascript
// NEVER store passwords in plain text!
// ❌ WRONG
const user = { password: 'myPassword123' };

// ✅ CORRECT - Hash with salt
const hashedPassword = await hashPassword('myPassword123');
const user = { passwordHash: hashedPassword };
```

**Data Protection**
```javascript
// Encrypt sensitive data
const encryptedData = encrypt('Credit Card: 1234-5678-9012-3456', key);
// Store encrypted version, not plain text
```

**API Security**
```javascript
// Verify API requests with HMAC
const signature = createHMAC(requestData, secretKey);
// Include signature with request to prove authenticity
```

---

## Cryptography Categories

### 1. Hash Functions (One-Way)

**Purpose**: Create fixed-size fingerprints of data

**Characteristics**:
- Deterministic (same input = same output)
- One-way (can't reverse)
- Small changes = completely different hash
- Fixed output size

**Common Algorithms**:
- SHA-256 (256-bit output)
- SHA-512 (512-bit output)
- SHA-3 family

**Use Cases**:
- Password verification
- Data integrity checks
- Digital signatures
- File integrity

```javascript
const crypto = require('crypto');

const hash = crypto.createHash('sha256');
hash.update('Hello World');
console.log(hash.digest('hex'));
// Same input always produces same hash
```

### 2. Symmetric Encryption (Same Key)

**Purpose**: Encrypt and decrypt with the same key

**Characteristics**:
- Fast and efficient
- Same key for encryption and decryption
- Requires secure key exchange
- Good for bulk data

**Common Algorithms**:
- AES (Advanced Encryption Standard)
  - AES-128, AES-192, AES-256
  - CBC, GCM, CTR modes
- ChaCha20

**Use Cases**:
- File encryption
- Database encryption
- Session data
- Encrypted communication (with key exchange)

```javascript
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // 256 bits
const iv = crypto.randomBytes(16);  // Initialization vector

// Both parties need the same key
const cipher = crypto.createCipheriv(algorithm, key, iv);
const decipher = crypto.createDecipheriv(algorithm, key, iv);
```

### 3. Asymmetric Encryption (Key Pairs)

**Purpose**: Encrypt with public key, decrypt with private key

**Characteristics**:
- Public key can be shared openly
- Private key must be kept secret
- Slower than symmetric
- No key exchange needed

**Common Algorithms**:
- RSA (2048-bit, 4096-bit)
- Elliptic Curve (ECDSA, ECDH)

**Use Cases**:
- SSL/TLS certificates
- Digital signatures
- Key exchange
- Email encryption (PGP)

```javascript
// Generate key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});

// Encrypt with public key
const encrypted = crypto.publicEncrypt(publicKey, Buffer.from('secret'));

// Decrypt with private key
const decrypted = crypto.privateDecrypt(privateKey, encrypted);
```

### 4. Message Authentication Codes (MAC)

**Purpose**: Verify data authenticity and integrity

**Types**:
- HMAC (Hash-based MAC)
- CMAC (Cipher-based MAC)

**Use Cases**:
- API authentication
- Message verification
- Token generation
- Data integrity

```javascript
const hmac = crypto.createHmac('sha256', 'secret-key');
hmac.update('important message');
const signature = hmac.digest('hex');

// Receiver can verify with same key
```

---

## Hash Functions

### How Hashing Works

```
Input: "Hello World"
   ↓
Hash Function (SHA-256)
   ↓
Output: "64ec88ca00b268e5ba1a35678a1b5316..."
```

**Properties**:
1. **Deterministic**: Same input always produces same output
2. **Quick**: Fast to compute
3. **One-way**: Cannot reverse to get original input
4. **Avalanche Effect**: Small change in input = big change in output
5. **Collision Resistant**: Hard to find two inputs with same hash

### Common Hash Algorithms

| Algorithm | Output Size | Security | Use Case |
|-----------|-------------|----------|----------|
| MD5 | 128 bits | ❌ Broken | Legacy only, NOT secure |
| SHA-1 | 160 bits | ❌ Broken | Legacy only, NOT secure |
| SHA-256 | 256 bits | ✅ Secure | General purpose |
| SHA-512 | 512 bits | ✅ Secure | High security needs |
| SHA-3 | Variable | ✅ Secure | Modern alternative |

### Practical Example

```javascript
const crypto = require('crypto');

function hashData(data, algorithm = 'sha256') {
  const hash = crypto.createHash(algorithm);
  hash.update(data);
  return hash.digest('hex');
}

// File integrity
const fileHash = hashData(fileContent);
// Later, verify file hasn't changed
if (hashData(fileContent) === storedHash) {
  console.log('File is intact');
}
```

---

## Encryption

### Symmetric Encryption Flow

```
Plaintext → [Encrypt with Key + IV] → Ciphertext
Ciphertext → [Decrypt with Key + IV] → Plaintext
```

**Key Components**:

1. **Algorithm**: AES, DES, etc.
2. **Key**: Secret value for encryption/decryption
3. **IV (Initialization Vector)**: Random value for each encryption
4. **Mode**: CBC, GCM, CTR, etc.

### Cipher Modes

**CBC (Cipher Block Chaining)**
- Most common
- Requires padding
- Each block depends on previous

**GCM (Galois/Counter Mode)**
- Provides authentication
- No padding needed
- Parallel processing possible

**CTR (Counter Mode)**
- Stream cipher mode
- No padding needed
- Parallel processing possible

### Initialization Vector (IV)

**Why IV?**
- Prevents pattern recognition
- Same plaintext + same key = different ciphertext
- Must be random and unique for each encryption

```javascript
// ✅ CORRECT - New IV each time
function encrypt(text, key) {
  const iv = crypto.randomBytes(16); // Random IV
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex') };
}

// ❌ WRONG - Reusing IV
const iv = crypto.randomBytes(16);
function badEncrypt(text, key) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv); // Same IV!
  // ... INSECURE
}
```

### Asymmetric Encryption Flow

```
Sender:
Message → [Encrypt with Receiver's Public Key] → Encrypted Message

Receiver:
Encrypted Message → [Decrypt with Private Key] → Original Message
```

**Key Characteristics**:
- Public key encrypts, private key decrypts
- Slower than symmetric encryption
- Good for small data and key exchange
- No need to share private key

---

## Message Authentication

### HMAC (Hash-based Message Authentication Code)

**Purpose**: Verify message came from sender and wasn't modified

```javascript
// Sender creates HMAC
const hmac = crypto.createHmac('sha256', sharedSecret);
hmac.update(message);
const signature = hmac.digest('hex');

// Send: { message, signature }

// Receiver verifies
const verifyHmac = crypto.createHmac('sha256', sharedSecret);
verifyHmac.update(message);
const expectedSignature = verifyHmac.digest('hex');

if (signature === expectedSignature) {
  console.log('Message is authentic');
}
```

**Use Cases**:
- API request signing
- JWT tokens
- Webhook verification
- Message integrity

### Digital Signatures

**Purpose**: Prove who sent a message (non-repudiation)

```javascript
// Sender signs with private key
const sign = crypto.createSign('SHA256');
sign.update(message);
const signature = sign.sign(privateKey, 'hex');

// Receiver verifies with public key
const verify = crypto.createVerify('SHA256');
verify.update(message);
const isValid = verify.verify(publicKey, signature, 'hex');
```

**Differences from HMAC**:
- Uses asymmetric keys (public/private)
- Provides non-repudiation
- Anyone with public key can verify
- Slower than HMAC

---

## Random Number Generation

### Why Cryptographic Randomness Matters

```javascript
// ❌ WRONG - NOT cryptographically secure
const badRandom = Math.random();
const badToken = Math.random().toString(36);

// ✅ CORRECT - Cryptographically secure
const goodRandom = crypto.randomBytes(32);
const goodToken = crypto.randomBytes(32).toString('hex');
```

**Use Cases**:
- Session tokens
- Password reset tokens
- API keys
- Initialization vectors (IV)
- Salt for password hashing
- CSRF tokens

### Methods

```javascript
// Random bytes
const bytes = crypto.randomBytes(32);

// Random UUID (v4)
const uuid = crypto.randomUUID();
// e.g., '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'

// Random integers
const randomInt = crypto.randomInt(0, 100); // 0 to 99
```

---

## Common Use Cases

### 1. Password Storage

**Never store plain text passwords!**

```javascript
// Hash password with salt
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

// Verify password
async function verifyPassword(password, hash) {
  const [salt, key] = hash.split(':');

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}
```

### 2. Data Encryption

```javascript
class DataEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
  }

  encrypt(text, password) {
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encrypted, password, salt, iv, authTag) {
    const key = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 32, 'sha512');

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### 3. Token Generation

```javascript
class TokenGenerator {
  // Session token
  static generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // API key
  static generateApiKey() {
    return crypto.randomBytes(32).toString('base64');
  }

  // Reset token (with expiry)
  static generateResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, hash };
  }

  // UUID
  static generateId() {
    return crypto.randomUUID();
  }
}
```

### 4. File Integrity

```javascript
const fs = require('fs');
const crypto = require('crypto');

function calculateFileHash(filepath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filepath);

    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Usage
const hash = await calculateFileHash('./important-file.pdf');
// Store hash, later verify file hasn't changed
```

---

## Security Principles

### 1. Don't Roll Your Own Crypto

❌ **Don't** create your own encryption algorithms
✅ **Do** use well-tested, standard algorithms

```javascript
// ❌ WRONG - Custom "encryption"
function badEncrypt(text) {
  return text.split('').reverse().join(''); // NOT SECURE!
}

// ✅ CORRECT - Use standard crypto
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
```

### 2. Always Use Salt for Passwords

❌ **Don't** hash passwords without salt
✅ **Do** use unique salt for each password

```javascript
// ❌ WRONG - No salt
const hash = crypto.createHash('sha256').update(password).digest('hex');

// ✅ CORRECT - With salt
crypto.pbkdf2(password, salt, 100000, 64, 'sha512', callback);
```

### 3. Use Strong Algorithms

| Algorithm | Status | Recommendation |
|-----------|--------|----------------|
| MD5 | ❌ Broken | Never use |
| SHA-1 | ❌ Broken | Never use |
| DES | ❌ Weak | Never use |
| SHA-256 | ✅ Secure | Recommended |
| SHA-512 | ✅ Secure | Recommended |
| AES-256 | ✅ Secure | Recommended |

### 4. Never Hardcode Secrets

```javascript
// ❌ WRONG - Hardcoded secret
const SECRET_KEY = 'my-secret-key-12345';

// ✅ CORRECT - Use environment variables
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  throw new Error('SECRET_KEY environment variable is required');
}
```

### 5. Use High Iteration Counts

```javascript
// ❌ WRONG - Too few iterations
crypto.pbkdf2(password, salt, 1000, 64, 'sha512', callback);

// ✅ CORRECT - High iteration count
crypto.pbkdf2(password, salt, 100000, 64, 'sha512', callback);
// Or even higher: 310,000+ for PBKDF2-SHA256 (OWASP 2023)
```

### 6. Generate New IVs

```javascript
// ❌ WRONG - Reusing IV
const IV = crypto.randomBytes(16);
function encrypt1(text) {
  return crypto.createCipheriv('aes-256-cbc', key, IV); // ⚠️ Same IV
}

// ✅ CORRECT - New IV each time
function encrypt(text) {
  const iv = crypto.randomBytes(16); // New IV
  return crypto.createCipheriv('aes-256-cbc', key, iv);
}
```

### 7. Timing Attack Prevention

```javascript
// ❌ WRONG - Vulnerable to timing attacks
function compare(a, b) {
  return a === b; // Early exit reveals information
}

// ✅ CORRECT - Constant-time comparison
function compare(a, b) {
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
```

### 8. Keep Dependencies Updated

```bash
# Regularly update Node.js
nvm install --lts
nvm use --lts

# Check for security vulnerabilities
npm audit
npm audit fix
```

---

## Key Takeaways

1. **Cryptography is complex** - Use standard, well-tested algorithms
2. **Different tools for different jobs**:
   - Hashing: Data integrity, passwords
   - HMAC: Message authentication
   - Symmetric encryption: Fast, bulk data
   - Asymmetric encryption: Key exchange, signatures
3. **Security best practices**:
   - Use salt for passwords
   - High iteration counts (100,000+)
   - New IV for each encryption
   - Strong algorithms only (SHA-256+, AES-256)
   - Never hardcode secrets
4. **Common mistakes to avoid**:
   - Using MD5 or SHA-1
   - Storing plain text passwords
   - Reusing IVs
   - Low iteration counts
   - Ignoring timing attacks

---

## Next Steps

Now that you understand the core concepts, you're ready to dive into practical implementation:

- **[Level 1: Basics](./level-1-basics/README.md)** - Start here to learn fundamental operations
- **[Level 2: Intermediate](./level-2-intermediate/README.md)** - Advanced techniques and patterns
- **[Level 3: Advanced](./level-3-advanced/README.md)** - Production-ready security implementation

Remember: Security is not just about using crypto correctly—it's about understanding the principles and applying them thoughtfully to protect your users' data.
