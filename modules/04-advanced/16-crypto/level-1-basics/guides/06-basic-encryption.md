# Basic Encryption and Decryption

Understanding symmetric encryption fundamentals for protecting confidential data.

## Table of Contents
- [What is Encryption?](#what-is-encryption)
- [Encryption vs Hashing](#encryption-vs-hashing)
- [Symmetric Encryption Basics](#symmetric-encryption-basics)
- [Understanding Keys](#understanding-keys)
- [Understanding IVs](#understanding-ivs)
- [Common Cipher Algorithms](#common-cipher-algorithms)
- [Using crypto.createCipheriv()](#using-cryptocreatecipheriv)
- [Using crypto.createDecipheriv()](#using-cryptocreatedecipheriv)
- [Complete Encryption System](#complete-encryption-system)
- [Common Patterns](#common-patterns)
- [Security Considerations](#security-considerations)
- [Best Practices](#best-practices)
- [Summary](#summary)

---

## What is Encryption?

**Encryption** is the process of transforming readable data (plaintext) into unreadable data (ciphertext) using a key. Only those with the correct key can decrypt it back.

### Simple Analogy

```
Like a locked box:
┌──────────────────┐
│ Secret Message   │ → Put in box → Lock → 📦🔒
└──────────────────┘

Only person with key can unlock:
📦🔒 → Unlock with key → Open box → │ Secret Message   │
```

### Visual Representation

```
Encryption:
┌─────────────┐    ┌─────┐
│  Plaintext  │    │ Key │
│  "Hello"    │    │ 🔑  │
└──────┬──────┘    └──┬──┘
       │              │
       └──────┬───────┘
              │
         ┌────▼─────┐
         │ Encrypt  │
         └────┬─────┘
              │
       ┌──────▼────────┐
       │  Ciphertext   │
       │ "a8f5f167..." │
       └───────────────┘

Decryption:
┌───────────────┐    ┌─────┐
│  Ciphertext   │    │ Key │
│ "a8f5f167..." │    │ 🔑  │
└──────┬────────┘    └──┬──┘
       │                │
       └──────┬─────────┘
              │
         ┌────▼─────┐
         │ Decrypt  │
         └────┬─────┘
              │
       ┌──────▼──────┐
       │  Plaintext  │
       │  "Hello"    │
       └─────────────┘
```

---

## Encryption vs Hashing

### Key Differences

```
╔══════════════╦═════════════════╦════════════════════╗
║              ║ Hashing         ║ Encryption         ║
╠══════════════╬═════════════════╬════════════════════╣
║ Reversible?  ║ No (one-way)    ║ Yes (two-way)      ║
║ Needs Key?   ║ No              ║ Yes                ║
║ Output       ║ Fixed size      ║ Variable size      ║
║ Purpose      ║ Integrity       ║ Confidentiality    ║
║ Use Case     ║ Checksums       ║ Secret data        ║
╚══════════════╩═════════════════╩════════════════════╝
```

### When to Use Each

```javascript
// Hashing - One-way, for integrity
const hash = crypto.createHash('sha256').update('data').digest('hex');
// Use for: File integrity, passwords (with pbkdf2)

// Encryption - Two-way, for confidentiality
const encrypted = encrypt('secret data', key);
const decrypted = decrypt(encrypted, key);
// Use for: Sensitive data storage, secure communication
```

### Comparison Example

```javascript
// Hashing - Cannot get original back
const hash = crypto.createHash('sha256').update('password').digest('hex');
console.log(hash); // "5e884898da28..."
// No way to get "password" back from hash ❌

// Encryption - Can get original back
const key = crypto.randomBytes(32);
const encrypted = encrypt('password', key);
console.log(encrypted); // "a8f5f167..."
const decrypted = decrypt(encrypted, key);
console.log(decrypted); // "password" ✅
```

---

## Symmetric Encryption Basics

### What is Symmetric Encryption?

**Symmetric** means the same key is used for both encryption and decryption:

```
Alice                           Bob
  │                              │
  ├─ Shared Key: 🔑 ────────────┤
  │                              │
  ├─ Encrypt with 🔑             │
  │  "Hello" → "a8f5..."         │
  │                              │
  ├─ Send "a8f5..." ────────────►│
  │                              │
  │                              ├─ Decrypt with 🔑
  │                              │  "a8f5..." → "Hello"
```

**Key Challenge**: Both parties need the same key securely!

### Symmetric vs Asymmetric

```
Symmetric (This Guide):
┌──────┐
│ Key  │ ← Same key for both
└──┬───┘
   ├── Encrypt
   └── Decrypt

Asymmetric (Level 2):
┌─────────────┐
│ Public Key  │ ─── Encrypt
└─────────────┘

┌─────────────┐
│ Private Key │ ─── Decrypt
└─────────────┘
```

---

## Understanding Keys

### What is a Key?

A **key** is a secret value used to encrypt and decrypt data:

```javascript
// Generate a random key
const key = crypto.randomBytes(32); // 32 bytes = 256 bits

console.log(key);
// <Buffer a8 f5 f1 67 f4 4f 49 64 e6 c9 98 de e8 27 11 0c ...>

console.log(key.toString('hex'));
// "a8f5f167f44f4964e6c998dee827110c..."
```

### Key Sizes

Different algorithms require different key sizes:

```
╔════════════╦═══════════╦═════════════════════╗
║ Algorithm  ║ Key Size  ║ Security Level      ║
╠════════════╬═══════════╬═════════════════════╣
║ AES-128    ║ 16 bytes  ║ Good                ║
║ AES-192    ║ 24 bytes  ║ Better              ║
║ AES-256    ║ 32 bytes  ║ Best (recommended)  ║
╚════════════╩═══════════╩═════════════════════╝
```

### Generating Keys

```javascript
// AES-256 key (recommended)
const key256 = crypto.randomBytes(32);

// AES-192 key
const key192 = crypto.randomBytes(24);

// AES-128 key
const key128 = crypto.randomBytes(16);

// ✅ Always use crypto.randomBytes() for keys
// ❌ Never use weak sources like Date.now() or Math.random()
```

### Key Properties

```javascript
// 1. Must be random
const goodKey = crypto.randomBytes(32); // ✅ Random
const badKey = Buffer.from('my-secret-key-12345'); // ❌ Predictable

// 2. Must be correct length
const key256 = crypto.randomBytes(32); // ✅ 32 bytes for AES-256
const wrongKey = crypto.randomBytes(20); // ❌ Wrong size

// 3. Must be kept secret
// ✅ Store in environment variables
// ❌ Never hardcode in source code
// ❌ Never commit to git
```

---

## Understanding IVs

### What is an IV?

**IV** (Initialization Vector) is random data used to ensure the same plaintext encrypts to different ciphertext each time:

```
Without IV (Same plaintext → Same ciphertext):
Encrypt("Hello", key) → "a8f5f167..."
Encrypt("Hello", key) → "a8f5f167..." ← Same! Bad!

With IV (Same plaintext → Different ciphertext):
Encrypt("Hello", key, iv1) → "a8f5f167..."
Encrypt("Hello", key, iv2) → "9c42ff98..." ← Different! Good!
```

### Why IVs Matter

```javascript
// Scenario: Encrypting user emails

// ❌ Without IV
const key = getKey();
encrypt('user@example.com', key); // → "a8f5f167..."
encrypt('user@example.com', key); // → "a8f5f167..." (same!)
// Attacker knows: Same ciphertext = same email

// ✅ With IV
const iv1 = crypto.randomBytes(16);
const iv2 = crypto.randomBytes(16);
encrypt('user@example.com', key, iv1); // → "a8f5f167..."
encrypt('user@example.com', key, iv2); // → "9c42ff98..." (different!)
// Attacker cannot tell if emails are the same
```

### IV Properties

```javascript
// 1. Random and unique
const iv = crypto.randomBytes(16); // ✅ New random IV

// 2. Fixed size (depends on algorithm)
// AES: 16 bytes (128 bits)
const iv = crypto.randomBytes(16);

// 3. NOT secret (can be stored with ciphertext)
const encrypted = {
  ciphertext: '...',
  iv: iv.toString('hex') // ✅ OK to store publicly
};

// 4. Must be unique for each encryption
const iv1 = crypto.randomBytes(16); // ✅ New IV for message 1
const iv2 = crypto.randomBytes(16); // ✅ New IV for message 2
```

### IV vs Key

```
╔═══════════╦═════════════════╦════════════════════╗
║           ║ Key             ║ IV                 ║
╠═══════════╬═════════════════╬════════════════════╣
║ Secret?   ║ Yes             ║ No                 ║
║ Reusable? ║ Yes (same key)  ║ No (new each time) ║
║ Size      ║ Algorithm size  ║ 16 bytes (AES)     ║
║ Storage   ║ Secure storage  ║ With ciphertext    ║
╚═══════════╩═════════════════╩════════════════════╝
```

---

## Common Cipher Algorithms

### AES (Advanced Encryption Standard)

**Most commonly used symmetric encryption algorithm:**

```javascript
// AES with CBC mode
const algorithm = 'aes-256-cbc';
// - AES: Algorithm
// - 256: Key size in bits
// - CBC: Cipher mode

// Other AES variants:
'aes-128-cbc' // 128-bit key
'aes-192-cbc' // 192-bit key
'aes-256-cbc' // 256-bit key (recommended)
'aes-256-gcm' // With authentication (Level 2)
```

### Cipher Modes

```
╔══════════╦══════════════════════════════════════════════╗
║ Mode     ║ Description                                  ║
╠══════════╬══════════════════════════════════════════════╣
║ CBC      ║ Cipher Block Chaining (most common)         ║
║          ║ Requires padding                             ║
║          ║ Good for general purpose                     ║
║          ║                                              ║
║ GCM      ║ Galois/Counter Mode (Level 2)                ║
║          ║ Provides authentication                      ║
║          ║ No padding needed                            ║
║          ║                                              ║
║ CTR      ║ Counter Mode                                 ║
║          ║ Stream cipher                                ║
║          ║ Parallel processing                          ║
╚══════════╩══════════════════════════════════════════════╝
```

### Getting Available Ciphers

```javascript
// List all available ciphers
console.log(crypto.getCiphers());
// ['aes-128-cbc', 'aes-256-cbc', 'aes-256-gcm', ...]
```

---

## Using crypto.createCipheriv()

### Basic Syntax

```javascript
crypto.createCipheriv(algorithm, key, iv)
```

### Simple Example

```javascript
const crypto = require('crypto');

// Setup
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // 256 bits
const iv = crypto.randomBytes(16);  // 128 bits

// Encrypt
const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = cipher.update('Hello World', 'utf8', 'hex');
encrypted += cipher.final('hex');

console.log('Encrypted:', encrypted);
// "a8f5f167f44f4964e6c998dee827110c..."
```

### Step-by-Step Encryption

```javascript
function encrypt(text) {
  // Step 1: Choose algorithm
  const algorithm = 'aes-256-cbc';

  // Step 2: Generate key (in practice, use existing key)
  const key = crypto.randomBytes(32);

  // Step 3: Generate IV (new for each encryption)
  const iv = crypto.randomBytes(16);

  // Step 4: Create cipher
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  // Step 5: Encrypt data
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Step 6: Return encrypted data with IV
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    key: key.toString('hex') // Only for demo! Never expose key!
  };
}

// Usage
const result = encrypt('Secret message');
console.log('Encrypted:', result.encrypted);
console.log('IV:', result.iv);
```

### Method Chaining

```javascript
// Concise version
const cipher = crypto.createCipheriv(algorithm, key, iv);
const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
```

### Different Encodings

```javascript
const cipher = crypto.createCipheriv(algorithm, key, iv);

// UTF-8 to hex
const hex = cipher.update('Hello', 'utf8', 'hex') + cipher.final('hex');

// UTF-8 to base64
const cipher2 = crypto.createCipheriv(algorithm, key, iv);
const base64 = cipher2.update('Hello', 'utf8', 'base64') + cipher2.final('base64');

// Buffer to buffer
const cipher3 = crypto.createCipheriv(algorithm, key, iv);
const buffer = Buffer.concat([
  cipher3.update(Buffer.from('Hello')),
  cipher3.final()
]);
```

---

## Using crypto.createDecipheriv()

### Basic Syntax

```javascript
crypto.createDecipheriv(algorithm, key, iv)
```

### Simple Example

```javascript
// Decrypt (using same key and IV from encryption)
const decipher = crypto.createDecipheriv(algorithm, key, iv);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');

console.log('Decrypted:', decrypted);
// "Hello World"
```

### Complete Encrypt/Decrypt Example

```javascript
const crypto = require('crypto');

// Encryption
function encrypt(text, key) {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted
  };
}

// Decryption
function decrypt(encrypted, key) {
  const algorithm = 'aes-256-cbc';
  const iv = Buffer.from(encrypted.iv, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Usage
const key = crypto.randomBytes(32);
const encrypted = encrypt('Secret message', key);
console.log('Encrypted:', encrypted);

const decrypted = decrypt(encrypted, key);
console.log('Decrypted:', decrypted); // "Secret message"
```

---

## Complete Encryption System

### Production-Ready Encryption Class

```javascript
const crypto = require('crypto');

class Encryption {
  constructor(algorithm = 'aes-256-cbc') {
    this.algorithm = algorithm;
    this.keyLength = this.getKeyLength(algorithm);
    this.ivLength = 16; // Standard for AES
  }

  getKeyLength(algorithm) {
    if (algorithm.includes('256')) return 32;
    if (algorithm.includes('192')) return 24;
    if (algorithm.includes('128')) return 16;
    throw new Error('Unknown algorithm');
  }

  /**
   * Generate a random encryption key
   */
  generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  /**
   * Encrypt data
   * @param {string} text - Text to encrypt
   * @param {Buffer} key - Encryption key
   * @returns {string} - Format: iv:encryptedData
   */
  encrypt(text, key) {
    if (key.length !== this.keyLength) {
      throw new Error(`Key must be ${this.keyLength} bytes`);
    }

    // Generate random IV
    const iv = crypto.randomBytes(this.ivLength);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Combine IV and encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt data
   * @param {string} encryptedData - Format: iv:encryptedData
   * @param {Buffer} key - Encryption key
   * @returns {string} - Decrypted text
   */
  decrypt(encryptedData, key) {
    if (key.length !== this.keyLength) {
      throw new Error(`Key must be ${this.keyLength} bytes`);
    }

    // Split IV and encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Encrypt with password (derives key from password)
   */
  async encryptWithPassword(text, password) {
    const salt = crypto.randomBytes(16);

    // Derive key from password
    const key = await new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, this.keyLength, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });

    // Encrypt
    const encrypted = this.encrypt(text, key);

    // Return with salt
    return salt.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt with password
   */
  async decryptWithPassword(encryptedData, password) {
    // Split salt and encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const salt = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1] + ':' + parts[2];

    // Derive key from password
    const key = await new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, this.keyLength, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });

    // Decrypt
    return this.decrypt(encrypted, key);
  }
}

// Export
module.exports = Encryption;

// Usage Example
async function demo() {
  const encryption = new Encryption();

  console.log('=== Encryption with Key ===');
  // Generate key
  const key = encryption.generateKey();
  console.log('Key:', key.toString('hex'));

  // Encrypt
  const encrypted = encryption.encrypt('Secret message', key);
  console.log('Encrypted:', encrypted);

  // Decrypt
  const decrypted = encryption.decrypt(encrypted, key);
  console.log('Decrypted:', decrypted);

  console.log('\n=== Encryption with Password ===');
  // Encrypt with password
  const encryptedWithPassword = await encryption.encryptWithPassword(
    'Secret message',
    'myPassword123'
  );
  console.log('Encrypted:', encryptedWithPassword);

  // Decrypt with password
  const decryptedWithPassword = await encryption.decryptWithPassword(
    encryptedWithPassword,
    'myPassword123'
  );
  console.log('Decrypted:', decryptedWithPassword);
}

demo();
```

---

## Common Patterns

### Pattern 1: File Encryption

```javascript
const fs = require('fs');

function encryptFile(inputFile, outputFile, key) {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);

  // Create cipher
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  // Read and encrypt
  const input = fs.createReadStream(inputFile);
  const output = fs.createWriteStream(outputFile);

  // Write IV first
  output.write(iv);

  // Pipe through cipher
  input.pipe(cipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on('finish', resolve);
    output.on('error', reject);
  });
}

function decryptFile(inputFile, outputFile, key) {
  const algorithm = 'aes-256-cbc';

  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(inputFile);
    const output = fs.createWriteStream(outputFile);

    // Read IV from file
    const ivBuffer = [];
    let ivRead = false;

    input.on('data', chunk => {
      if (!ivRead) {
        ivBuffer.push(chunk);
        const iv = Buffer.concat(ivBuffer).slice(0, 16);

        if (iv.length === 16) {
          ivRead = true;
          const decipher = crypto.createDecipheriv(algorithm, key, iv);

          // Remaining data
          const remaining = Buffer.concat(ivBuffer).slice(16);
          decipher.write(remaining);

          // Pipe rest
          input.pipe(decipher).pipe(output);
        }
      }
    });

    output.on('finish', resolve);
    output.on('error', reject);
  });
}
```

### Pattern 2: Environment Variable Encryption

```javascript
class SecureConfig {
  constructor() {
    // Get encryption key from environment
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) {
      throw new Error('ENCRYPTION_KEY not set');
    }
    this.key = Buffer.from(keyHex, 'hex');
    this.encryption = new Encryption();
  }

  encryptValue(value) {
    return this.encryption.encrypt(String(value), this.key);
  }

  decryptValue(encryptedValue) {
    return this.encryption.decrypt(encryptedValue, this.key);
  }

  set(name, value) {
    const encrypted = this.encryptValue(value);
    fs.writeFileSync(`.env.${name}`, encrypted);
  }

  get(name) {
    const encrypted = fs.readFileSync(`.env.${name}`, 'utf8');
    return this.decryptValue(encrypted);
  }
}

// Usage
const config = new SecureConfig();
config.set('API_KEY', 'secret-api-key-12345');
const apiKey = config.get('API_KEY');
```

### Pattern 3: Database Field Encryption

```javascript
class EncryptedModel {
  constructor(encryption, key) {
    this.encryption = encryption;
    this.key = key;
    this.encryptedFields = ['email', 'phone', 'ssn'];
  }

  beforeSave(data) {
    const encrypted = { ...data };

    for (const field of this.encryptedFields) {
      if (data[field]) {
        encrypted[field] = this.encryption.encrypt(data[field], this.key);
      }
    }

    return encrypted;
  }

  afterLoad(data) {
    const decrypted = { ...data };

    for (const field of this.encryptedFields) {
      if (data[field]) {
        try {
          decrypted[field] = this.encryption.decrypt(data[field], this.key);
        } catch (err) {
          console.error(`Failed to decrypt ${field}:`, err);
        }
      }
    }

    return decrypted;
  }
}

// Usage
const model = new EncryptedModel(encryption, key);

// Saving
const user = { name: 'Alice', email: 'alice@example.com' };
const encrypted = model.beforeSave(user);
db.save(encrypted);

// Loading
const loaded = db.load(userId);
const decrypted = model.afterLoad(loaded);
console.log(decrypted); // { name: 'Alice', email: 'alice@example.com' }
```

---

## Security Considerations

### 1. Never Reuse IV

```javascript
// ❌ WRONG - Reusing IV
const iv = crypto.randomBytes(16);
const encrypted1 = encrypt('message1', key, iv);
const encrypted2 = encrypt('message2', key, iv); // Same IV!

// ✅ CORRECT - New IV each time
const encrypted1 = encrypt('message1', key, crypto.randomBytes(16));
const encrypted2 = encrypt('message2', key, crypto.randomBytes(16));
```

### 2. Store IV with Ciphertext

```javascript
// ✅ Correct - IV stored with data
function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');

  // Store IV with encrypted data
  return {
    iv: iv.toString('hex'),
    data: encrypted
  };
}
```

### 3. Use Authenticated Encryption (Level 2)

```javascript
// Basic encryption (CBC) - No authentication
// Vulnerable to tampering

// Authenticated encryption (GCM) - With authentication (Level 2)
// Detects tampering
```

### 4. Key Management

```javascript
// ❌ NEVER do this
const KEY = 'my-hardcoded-key-12345';

// ✅ Use environment variables
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

// ✅ Use key management service (KMS)
const KEY = await kms.getEncryptionKey();
```

---

## Best Practices

### ✅ DO: Use AES-256

```javascript
// ✅ Recommended
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
```

### ✅ DO: Generate New IV Every Time

```javascript
// ✅ Correct
function encrypt(text, key) {
  const iv = crypto.randomBytes(16); // New IV
  // ...
}
```

### ✅ DO: Store IV with Ciphertext

```javascript
// ✅ Format: iv:ciphertext
const result = iv.toString('hex') + ':' + encrypted;
```

### ✅ DO: Validate Inputs

```javascript
function encrypt(text, key) {
  if (!text) throw new Error('Text required');
  if (key.length !== 32) throw new Error('Invalid key length');
  // ...
}
```

### ❌ DON'T: Use ECB Mode

```javascript
// ❌ NEVER use ECB mode
const algorithm = 'aes-256-ecb'; // Insecure!

// ✅ Use CBC or GCM
const algorithm = 'aes-256-cbc';
```

### ❌ DON'T: Encrypt Without Authentication

```javascript
// ❌ Basic CBC - no tamper detection
// For production, use GCM mode (Level 2)
```

---

## Summary

### Key Takeaways

1. **Encryption is reversible** - can decrypt back to plaintext
2. **Symmetric encryption** - same key for encrypt and decrypt
3. **Key management** - keep keys secret and secure
4. **IV is essential** - generate new random IV for each encryption
5. **Use AES-256-CBC** for basic encryption (GCM for Level 2)

### Quick Reference

```javascript
// Encrypt
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const cipher = crypto.createCipheriv(algorithm, key, iv);
const encrypted = cipher.update('text', 'utf8', 'hex') + cipher.final('hex');

// Decrypt
const decipher = crypto.createDecipheriv(algorithm, key, iv);
const decrypted = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
```

### Storage Format

```
Format: iv:ciphertext
Example: "a8f3d92c4e7b1f2a:9c42ff98de71..."
         └──────┬───────┘ └──────┬──────┘
              IV (hex)      Ciphertext (hex)
```

### When to Use Encryption

✅ Storing sensitive data (credit cards, SSN, etc.)
✅ Protecting data at rest
✅ Secure file storage
✅ Confidential communications

❌ Password storage (use PBKDF2 instead)
❌ Data integrity only (use hashing instead)

### Next Steps

- Review all guides to solidify understanding
- Practice with the exercises in `exercises/`
- Study examples in `examples/`
- Move to Level 2 for advanced encryption (GCM, asymmetric)
- Review [CONCEPTS.md](../../CONCEPTS.md) for deeper understanding

---

**Remember**: Encryption provides confidentiality, but not authentication. For production systems, consider using authenticated encryption modes like AES-GCM (covered in Level 2).
