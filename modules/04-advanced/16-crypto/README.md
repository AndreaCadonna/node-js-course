# Module 16: Crypto

Master cryptographic operations, encryption, hashing, and security in Node.js.

## Why This Module Matters

The `crypto` module provides cryptographic functionality that includes a set of wrappers for OpenSSL's hash, HMAC, cipher, decipher, sign, and verify functions. Understanding cryptography is essential for building secure applications, protecting user data, and implementing authentication systems.

**Real-world applications:**
- Password hashing and verification
- Data encryption and decryption
- Digital signatures and verification
- Secure token generation
- API authentication (JWT, HMAC)
- File integrity checking
- SSL/TLS certificate handling
- Secure communication channels

---

## What You'll Learn

By completing this module, you'll master:

### Technical Skills
- Hash data using various algorithms (SHA, MD5, etc.)
- Implement HMAC for message authentication
- Encrypt and decrypt data with different ciphers
- Generate and verify digital signatures
- Create cryptographically secure random values
- Work with public/private key pairs
- Implement password hashing (pbkdf2, scrypt)
- Use symmetric and asymmetric encryption

### Practical Applications
- Build secure authentication systems
- Implement password storage best practices
- Create secure API tokens
- Encrypt sensitive data at rest
- Verify data integrity
- Generate secure random passwords
- Sign and verify messages
- Implement end-to-end encryption

---

## Module Structure

This module is divided into three progressive levels:

### [Level 1: Basics](./level-1-basics/README.md)
**Time**: 1-2 hours

Learn the fundamentals of cryptographic operations:
- Understanding cryptography basics
- Creating hashes (SHA-256, MD5)
- Generating random data
- HMAC for message authentication
- Basic encryption and decryption
- Password hashing with pbkdf2

**You'll be able to:**
- Hash data for integrity checks
- Generate secure random values
- Create and verify HMACs
- Hash passwords securely
- Understand when to use each algorithm
- Implement basic encryption

### [Level 2: Intermediate](./level-2-intermediate/README.md)
**Time**: 2-3 hours

Advanced cryptographic techniques:
- Symmetric encryption (AES)
- Asymmetric encryption (RSA)
- Digital signatures
- Certificate handling
- Advanced password hashing (scrypt)
- Key derivation functions
- Cipher modes and padding

**You'll be able to:**
- Implement AES encryption
- Work with RSA key pairs
- Sign and verify data
- Choose appropriate cipher modes
- Implement secure key management
- Handle encrypted streams

### [Level 3: Advanced](./level-3-advanced/README.md)
**Time**: 3-4 hours

Production-ready security implementation:
- Building authentication systems
- End-to-end encryption
- Security best practices
- Performance optimization
- Common vulnerabilities (timing attacks, etc.)
- Compliance and standards
- Advanced key management

**You'll be able to:**
- Build production authentication
- Implement JWT securely
- Prevent common vulnerabilities
- Optimize crypto operations
- Handle certificates and keys
- Build secure communication systems

---

## Prerequisites

- Basic JavaScript knowledge
- Understanding of Node.js fundamentals
- **Module 3: Buffer** (recommended)
- **Module 5: Stream** (helpful for Level 2+)
- Basic understanding of security concepts (helpful)

---

## Learning Path

### Recommended Approach

1. **Read** the [CONCEPTS.md](./CONCEPTS.md) file first for foundational understanding
2. **Start** with Level 1 and progress sequentially
3. **Study** the examples in each level
4. **Complete** the exercises before checking solutions
5. **Read** the conceptual guides for deeper understanding
6. **Practice** by building the suggested projects

### Alternative Approaches

**Fast Track** (If you're experienced):
- Skim Level 1
- Focus on Level 2 and 3
- Complete advanced exercises

**Deep Dive** (If you want mastery):
- Read all guides thoroughly
- Complete all exercises
- Build additional projects
- Study the solutions for alternative approaches

---

## Key Concepts

### Hashing

Create fixed-size fingerprints of data:

```javascript
const crypto = require('crypto');

// Create a hash
const hash = crypto.createHash('sha256');
hash.update('Hello World');
const digest = hash.digest('hex');

console.log(digest);
// '64ec88ca00b268e5ba1a35678a1b5316d212f4f366b2477232534a8aeca37f3c'
```

### HMAC (Hash-based Message Authentication Code)

Verify data authenticity with a secret key:

```javascript
const crypto = require('crypto');

// Create HMAC
const hmac = crypto.createHmac('sha256', 'secret-key');
hmac.update('important message');
const mac = hmac.digest('hex');

console.log(mac);
// Verify by recreating with same key
```

### Encryption and Decryption

Protect data confidentiality:

```javascript
const crypto = require('crypto');

// Generate key and IV
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

// Encrypt
const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = cipher.update('secret message', 'utf8', 'hex');
encrypted += cipher.final('hex');

// Decrypt
const decipher = crypto.createDecipheriv(algorithm, key, iv);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
```

### Password Hashing

Securely store passwords:

```javascript
const crypto = require('crypto');

// Hash a password
crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey.toString('hex'));
});
```

### Random Data Generation

Create cryptographically secure random values:

```javascript
const crypto = require('crypto');

// Generate random bytes
const randomBytes = crypto.randomBytes(32);
console.log(randomBytes.toString('hex'));

// Generate random UUID
const uuid = crypto.randomUUID();
console.log(uuid); // e.g., '36b8f84d-df4e-4d49-b662-bcde71a8764f'
```

---

## Practical Examples

### Example 1: Password Authentication

```javascript
const crypto = require('crypto');

class PasswordAuth {
  static hashPassword(password) {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');

      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ':' + derivedKey.toString('hex'));
      });
    });
  }

  static verifyPassword(password, hash) {
    return new Promise((resolve, reject) => {
      const [salt, key] = hash.split(':');

      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(key === derivedKey.toString('hex'));
      });
    });
  }
}

// Usage
async function demo() {
  const hashed = await PasswordAuth.hashPassword('myPassword123');
  console.log('Hashed:', hashed);

  const isValid = await PasswordAuth.verifyPassword('myPassword123', hashed);
  console.log('Valid:', isValid); // true
}
```

### Example 2: File Integrity Check

```javascript
const crypto = require('crypto');
const fs = require('fs');

function calculateFileHash(filepath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filepath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Usage
calculateFileHash('./document.pdf').then(hash => {
  console.log('File hash:', hash);
  // Store this hash to verify file hasn't been modified
});
```

### Example 3: Secure Token Generation

```javascript
const crypto = require('crypto');

class TokenGenerator {
  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateSessionId() {
    return crypto.randomUUID();
  }

  static generateApiKey() {
    return crypto.randomBytes(32).toString('base64');
  }
}

// Usage
console.log('Token:', TokenGenerator.generateToken());
console.log('Session:', TokenGenerator.generateSessionId());
console.log('API Key:', TokenGenerator.generateApiKey());
```

---

## Common Pitfalls

### ❌ Using Weak Hash Algorithms

```javascript
// ❌ WRONG - MD5 is cryptographically broken
const hash = crypto.createHash('md5');
hash.update('password');
const weak = hash.digest('hex');

// ✅ CORRECT - Use strong algorithms
const hash = crypto.createHash('sha256');
hash.update('password');
const strong = hash.digest('hex');
```

### ❌ Not Using Salt for Passwords

```javascript
// ❌ WRONG - No salt, vulnerable to rainbow tables
const hash = crypto.createHash('sha256');
hash.update('password');
const insecure = hash.digest('hex');

// ✅ CORRECT - Use pbkdf2/scrypt with salt
crypto.pbkdf2('password', salt, 100000, 64, 'sha512', (err, key) => {
  // Secure password hash
});
```

### ❌ Reusing Initialization Vectors (IV)

```javascript
// ❌ WRONG - Reusing IV compromises security
const iv = crypto.randomBytes(16); // Don't reuse this!
const cipher1 = crypto.createCipheriv('aes-256-cbc', key, iv);
const cipher2 = crypto.createCipheriv('aes-256-cbc', key, iv); // ⚠️ INSECURE

// ✅ CORRECT - Generate new IV for each encryption
function encrypt(data, key) {
  const iv = crypto.randomBytes(16); // New IV each time
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  // ... encrypt and return both encrypted data and IV
}
```

### ❌ Ignoring Timing Attacks

```javascript
// ❌ WRONG - Vulnerable to timing attacks
function verifyToken(input, stored) {
  return input === stored; // ⚠️ Takes different time based on where strings differ
}

// ✅ CORRECT - Use constant-time comparison
function verifyToken(input, stored) {
  return crypto.timingSafeEqual(
    Buffer.from(input),
    Buffer.from(stored)
  );
}
```

---

## Module Contents

### Documentation
- **[CONCEPTS.md](./CONCEPTS.md)** - Foundational concepts for the entire module
- **Level READMEs** - Specific guidance for each level

### Conceptual Guides
- **18 in-depth guides** - Deep understanding of specific topics
- **Level 1**: 6 guides on fundamentals
- **Level 2**: 6 guides on intermediate patterns
- **Level 3**: 6 guides on advanced topics

---

## Getting Started

### Quick Start

1. **Read the concepts**:
   ```bash
   cat CONCEPTS.md
   ```

2. **Start Level 1**:
   ```bash
   cd level-1-basics
   cat README.md
   ```

3. **Try creating a hash**:
   ```bash
   node -e "const crypto = require('crypto'); const hash = crypto.createHash('sha256'); hash.update('Hello'); console.log(hash.digest('hex'))"
   ```

### Setting Up

No special setup is required! The crypto module is built into Node.js.

```javascript
// No npm install needed - built into Node.js
const crypto = require('crypto');
```

---

## Security Warnings

⚠️ **IMPORTANT SECURITY CONSIDERATIONS**

1. **Never use MD5 or SHA-1 for security purposes** - They are cryptographically broken
2. **Always use salt** when hashing passwords
3. **Use high iteration counts** for pbkdf2/scrypt (at least 100,000 for pbkdf2)
4. **Never hardcode keys or secrets** in your code
5. **Use environment variables** for sensitive configuration
6. **Generate new IVs** for each encryption operation
7. **Use constant-time comparison** for tokens and secrets
8. **Keep your Node.js version updated** for security patches
9. **Understand the algorithm** before using it
10. **Consider using established libraries** (like bcrypt) for passwords

---

## Success Criteria

You'll know you've mastered this module when you can:

- [ ] Create hashes using various algorithms
- [ ] Generate cryptographically secure random data
- [ ] Implement HMAC for message authentication
- [ ] Hash passwords securely with pbkdf2/scrypt
- [ ] Encrypt and decrypt data with AES
- [ ] Work with RSA key pairs
- [ ] Sign and verify digital signatures
- [ ] Understand common security vulnerabilities
- [ ] Choose appropriate algorithms for different use cases
- [ ] Implement production-ready authentication

---

## Additional Resources

### Official Documentation
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

### Practice Projects
After completing this module, try building:
1. **Password Manager** - Securely store and retrieve passwords
2. **File Encryption Tool** - Encrypt/decrypt files with password
3. **JWT Authentication System** - Build complete auth with tokens
4. **Secure File Sharing** - End-to-end encrypted file sharing
5. **API Authentication** - HMAC-based API security

### Related Modules
- **Module 3: Buffer** - Understanding binary data
- **Module 5: Stream** - Efficient crypto operations
- **Module 6: Process** - Environment variables for secrets
- **Module 7: HTTP** - HTTPS and secure communication

---

## Questions or Issues?

- Review the [CONCEPTS.md](./CONCEPTS.md) for foundational understanding
- Check the guides for deep dives into specific topics
- Study the examples for practical demonstrations
- Review solutions after attempting exercises
- Consult OWASP resources for security best practices

---

## Let's Begin!

Start your journey with [Level 1: Basics](./level-1-basics/README.md) and build a solid foundation in cryptographic operations.

Remember: Cryptography is a critical aspect of modern software development. Understanding it well will help you build secure applications and protect user data effectively!
