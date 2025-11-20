# Level 2: Crypto Intermediate

Master advanced cryptographic operations for production-ready security implementations.

## Learning Objectives

By completing this level, you will:

- ✅ Implement authenticated encryption with AES-GCM
- ✅ Use asymmetric encryption with RSA key pairs
- ✅ Create and verify digital signatures
- ✅ Handle X.509 certificates and public keys
- ✅ Implement advanced key derivation (HKDF, scrypt)
- ✅ Understand and use different cipher modes (GCM, CBC, CTR)
- ✅ Build production-ready encryption systems
- ✅ Implement secure key exchange patterns

---

## Prerequisites

- **Level 1: Crypto Basics** (required)
- **Module 3: Buffer** (required)
- **Module 6: Process** (helpful for environment variables)
- Understanding of async/await and Promises
- Basic understanding of public key cryptography concepts

---

## What You'll Learn

### Core Topics

1. **AES-GCM Authenticated Encryption**
   - Encryption + authentication in one operation
   - Working with authentication tags
   - Additional authenticated data (AAD)
   - Why GCM is superior to CBC for most use cases
   - Proper IV/nonce management

2. **RSA Asymmetric Encryption**
   - Generating RSA key pairs
   - Public key encryption
   - Private key decryption
   - Key formats (PEM, DER)
   - Key size considerations (2048-bit, 4096-bit)
   - Hybrid encryption patterns

3. **Digital Signatures**
   - Creating signatures with private keys
   - Verifying signatures with public keys
   - Different signature algorithms (RSA, ECDSA)
   - Use cases: API verification, document signing
   - Signature formats and encoding

4. **Key Derivation Functions**
   - HKDF (HMAC-based Key Derivation)
   - scrypt for password-based keys
   - Deriving multiple keys from one master key
   - Key stretching and strengthening
   - Comparison with PBKDF2

5. **Certificate Handling**
   - Understanding X.509 certificates
   - Extracting public keys from certificates
   - Certificate verification
   - Working with certificate chains
   - Public Key Infrastructure (PKI) basics

6. **Advanced Cipher Modes**
   - GCM (Galois/Counter Mode) - authenticated encryption
   - CBC (Cipher Block Chaining) - traditional mode
   - CTR (Counter Mode) - streaming encryption
   - When to use each mode
   - IV requirements for each mode

---

## Time Commitment

**Estimated time**: 2-3 hours
- Reading guides: 60-90 minutes
- Studying examples: 30-45 minutes
- Exercises: 60-90 minutes

---

## Conceptual Guides

Before diving into code, read these guides to build conceptual understanding:

### Essential Reading

1. **[AES-GCM Explained](guides/01-aes-gcm-explained.md)** (15 min)
   - What is authenticated encryption?
   - GCM vs CBC comparison
   - Authentication tags
   - Best practices

2. **[Asymmetric Encryption](guides/02-asymmetric-encryption.md)** (15 min)
   - Public/private key pairs
   - How RSA encryption works
   - Key generation and storage
   - Hybrid encryption

3. **[Digital Signatures](guides/03-digital-signatures.md)** (15 min)
   - How signatures provide authentication
   - Signature algorithms
   - Verification process
   - Real-world applications

4. **[Key Derivation Functions](guides/04-key-derivation-functions.md)** (15 min)
   - HKDF explained
   - scrypt vs PBKDF2
   - Deriving multiple keys
   - Security parameters

5. **[Cipher Modes Explained](guides/05-cipher-modes.md)** (15 min)
   - CBC mode details
   - GCM mode details
   - CTR mode details
   - Mode comparison matrix

6. **[Certificate Basics](guides/06-certificate-basics.md)** (15 min)
   - X.509 certificate structure
   - Public Key Infrastructure
   - Certificate verification
   - Common use cases

---

## Key Concepts

### AES-GCM Authenticated Encryption

```javascript
const crypto = require('crypto');

// Encrypt with authentication
const algorithm = 'aes-256-gcm';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = cipher.update('secret data', 'utf8', 'hex');
encrypted += cipher.final('hex');

// Get authentication tag
const authTag = cipher.getAuthTag();

// Decrypt and verify
const decipher = crypto.createDecipheriv(algorithm, key, iv);
decipher.setAuthTag(authTag);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
```

### RSA Key Generation and Encryption

```javascript
const crypto = require('crypto');

// Generate RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Encrypt with public key
const encrypted = crypto.publicEncrypt(
  publicKey,
  Buffer.from('secret message')
);

// Decrypt with private key
const decrypted = crypto.privateDecrypt(privateKey, encrypted);
console.log(decrypted.toString('utf8')); // 'secret message'
```

### Digital Signatures

```javascript
const crypto = require('crypto');

// Generate key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});

// Sign data
const sign = crypto.createSign('SHA256');
sign.update('important message');
const signature = sign.sign(privateKey, 'hex');

// Verify signature
const verify = crypto.createVerify('SHA256');
verify.update('important message');
const isValid = verify.verify(publicKey, signature, 'hex');
console.log('Signature valid:', isValid); // true
```

### HKDF Key Derivation

```javascript
const crypto = require('crypto');

// Derive multiple keys from one master key
const masterKey = crypto.randomBytes(32);
const salt = crypto.randomBytes(16);

// Derive encryption key
const encryptionKey = crypto.hkdfSync(
  'sha256',
  masterKey,
  salt,
  Buffer.from('encryption'),
  32
);

// Derive authentication key
const authKey = crypto.hkdfSync(
  'sha256',
  masterKey,
  salt,
  Buffer.from('authentication'),
  32
);
```

### scrypt Password-Based Key Derivation

```javascript
const crypto = require('crypto');

// Derive key from password (async)
const password = 'user-password';
const salt = crypto.randomBytes(16);

crypto.scrypt(password, salt, 32, (err, derivedKey) => {
  if (err) throw err;
  console.log('Derived key:', derivedKey.toString('hex'));
});

// Or use synchronous version
const key = crypto.scryptSync(password, salt, 32);
```

---

## Quick Start

### Your First AES-GCM Encryption

Try this in Node.js REPL (`node`):

```javascript
const crypto = require('crypto');

// Setup
const algorithm = 'aes-256-gcm';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const data = 'Top secret message';

// Encrypt
const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = cipher.update(data, 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag();

console.log('Encrypted:', encrypted);
console.log('Auth tag:', authTag.toString('hex'));

// Decrypt
const decipher = crypto.createDecipheriv(algorithm, key, iv);
decipher.setAuthTag(authTag);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');

console.log('Decrypted:', decrypted); // 'Top secret message'
```

### Your First RSA Key Pair

```javascript
const crypto = require('crypto');

// Generate keys
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});

console.log('Public key:', publicKey.export({ type: 'spki', format: 'pem' }));
console.log('Private key generated:', privateKey ? 'Yes' : 'No');

// Test encryption
const message = 'Hello RSA!';
const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(message));
const decrypted = crypto.privateDecrypt(privateKey, encrypted);

console.log('Original:', message);
console.log('Decrypted:', decrypted.toString()); // 'Hello RSA!'
```

---

## Common Pitfalls

### ❌ Pitfall 1: Not Setting Auth Tag for GCM Decryption

```javascript
// ❌ WRONG - Will fail authentication
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
// Missing: decipher.setAuthTag(authTag);
const decrypted = decipher.update(encrypted, 'hex', 'utf8');

// ✅ CORRECT - Always set auth tag before decrypting
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher.setAuthTag(authTag); // Required!
const decrypted = decipher.update(encrypted, 'hex', 'utf8');
```

### ❌ Pitfall 2: Encrypting Large Data with RSA

```javascript
// ❌ WRONG - RSA can only encrypt small amounts
const largeData = 'x'.repeat(10000);
const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(largeData));
// Error: data too large for key size

// ✅ CORRECT - Use hybrid encryption (RSA + AES)
const aesKey = crypto.randomBytes(32);
const encryptedData = aesEncrypt(largeData, aesKey);
const encryptedKey = crypto.publicEncrypt(publicKey, aesKey);
// Send both encryptedData and encryptedKey
```

### ❌ Pitfall 3: Reusing IV/Nonce with GCM

```javascript
// ❌ WRONG - Never reuse IV with same key in GCM
const iv = crypto.randomBytes(16);
const encrypted1 = encryptGCM(data1, key, iv);
const encrypted2 = encryptGCM(data2, key, iv); // DANGER!

// ✅ CORRECT - Generate new IV for each encryption
const encrypted1 = encryptGCM(data1, key, crypto.randomBytes(16));
const encrypted2 = encryptGCM(data2, key, crypto.randomBytes(16));
```

### ❌ Pitfall 4: Not Protecting Private Keys

```javascript
// ❌ WRONG - Private key in code
const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEF...
-----END PRIVATE KEY-----`;

// ✅ CORRECT - Load from secure storage
const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, 'utf8');
// Or use encrypted private key with passphrase
```

---

## Examples

Explore practical examples in the [examples/](./examples/) directory:

1. **[AES-GCM Encryption](examples/01-aes-gcm-encryption.js)** - Authenticated encryption
2. **[RSA Encryption](examples/02-rsa-encryption.js)** - Public key cryptography
3. **[Digital Signatures](examples/03-digital-signatures.js)** - Sign and verify
4. **[Key Derivation](examples/04-key-derivation.js)** - HKDF and scrypt
5. **[Certificate Handling](examples/05-certificate-handling.js)** - Work with certificates
6. **[Advanced Patterns](examples/06-advanced-patterns.js)** - Real-world implementations

---

## Exercises

Test your knowledge with these hands-on exercises:

### Exercise 1: AES-GCM Encryption Utility
Build a complete AES-GCM encryption/decryption utility with proper error handling.

**Skills practiced:**
- AES-GCM encryption
- Authentication tags
- IV management
- Error handling

### Exercise 2: RSA Key Pair Generator and Encryptor
Create a system for RSA key generation and hybrid encryption.

**Skills practiced:**
- RSA key generation
- Public/private key operations
- Hybrid encryption
- Key storage

### Exercise 3: Digital Signature System
Implement a document signing and verification system.

**Skills practiced:**
- Creating signatures
- Verifying signatures
- Working with key pairs
- Signature formats

### Exercise 4: Secure Key Exchange
Build a key exchange system using asymmetric cryptography.

**Skills practiced:**
- RSA for key exchange
- HKDF for key derivation
- Combining symmetric and asymmetric crypto
- Secure protocols

### Exercise 5: Encrypted Messaging System
Create an end-to-end encrypted messaging system.

**Skills practiced:**
- Full encryption workflow
- Authentication
- Key management
- Real-world patterns

---

## Learning Path

### Recommended Sequence

1. **Read Conceptual Guides** (90 minutes)
   - Start with [AES-GCM Explained](guides/01-aes-gcm-explained.md)
   - Read all 6 guides in order
   - Take notes on differences from Level 1

2. **Study Examples** (45 minutes)
   - Run each example file
   - Experiment with parameters
   - Understand the security implications

3. **Complete Exercises** (90 minutes)
   - Work through each exercise
   - Focus on secure implementations
   - Test edge cases

4. **Review Solutions** (30 minutes)
   - Compare with your solutions
   - Understand security best practices
   - Note production-ready patterns

---

## Success Criteria

You've mastered Level 2 when you can:

- [ ] Implement AES-GCM encryption with proper authentication
- [ ] Generate and use RSA key pairs correctly
- [ ] Create and verify digital signatures
- [ ] Use HKDF to derive multiple keys
- [ ] Implement scrypt for password-based encryption
- [ ] Understand when to use different cipher modes
- [ ] Extract and use public keys from certificates
- [ ] Build hybrid encryption systems
- [ ] Implement secure key exchange protocols
- [ ] Handle errors in cryptographic operations

---

## What's Next?

After completing Level 2, you'll be ready for:

### Level 3: Advanced Crypto Operations
- Elliptic Curve Cryptography (ECC)
- Diffie-Hellman key exchange
- Streaming encryption/decryption
- Advanced certificate management
- Custom cryptographic protocols
- Hardware security modules (HSM)
- Performance optimization

---

## Additional Practice

Want more practice? Try these mini-projects:

1. **Secure File Vault**
   - Encrypt files with AES-GCM
   - Password-based key derivation
   - File integrity verification
   - Metadata encryption

2. **API Request Signer**
   - Sign API requests
   - Verify signatures
   - Timestamp validation
   - Replay attack prevention

3. **Certificate Manager**
   - Parse X.509 certificates
   - Extract public keys
   - Verify certificate chains
   - Certificate expiry checking

4. **Secure Chat System**
   - Key exchange protocol
   - End-to-end encryption
   - Message authentication
   - Forward secrecy

---

## Resources

### Official Documentation
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [NIST Cryptographic Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)

### Security Guidelines
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [OWASP Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)

### Tools
- **Node.js REPL**: Interactive testing (`node` command)
- **OpenSSL CLI**: Certificate and key management
- **Key Inspector**: View certificate/key details

---

## Questions or Stuck?

- Re-read the relevant guide
- Try the example code in REPL
- Check the [CONCEPTS.md](../CONCEPTS.md) for deeper understanding
- Compare different approaches in solutions
- Experiment with security parameters
- Review Level 1 if needed

---

## Let's Begin!

Start with **[AES-GCM Explained](guides/01-aes-gcm-explained.md)** and work your way through the guides. Level 2 builds on Level 1 fundamentals to implement production-ready cryptographic systems.

Remember: Security is not just about using the right algorithms - it's about using them correctly! Understanding these intermediate concepts will help you build truly secure applications.
