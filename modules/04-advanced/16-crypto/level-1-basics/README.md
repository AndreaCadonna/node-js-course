# Level 1: Crypto Basics

Learn the fundamentals of cryptographic operations in Node.js.

## Learning Objectives

By completing this level, you will:

- ✅ Understand basic cryptography concepts
- ✅ Create hashes using SHA-256 and other algorithms
- ✅ Generate cryptographically secure random data
- ✅ Implement HMAC for message authentication
- ✅ Hash passwords securely with pbkdf2
- ✅ Perform basic encryption and decryption
- ✅ Understand when to use different cryptographic operations

---

## Prerequisites

- Basic JavaScript knowledge
- Understanding of Node.js fundamentals
- **Module 3: Buffer** (recommended)
- Basic understanding of security concepts (helpful but not required)

---

## What You'll Learn

### Core Topics

1. **Hash Functions**
   - Creating hashes with crypto.createHash()
   - Different hash algorithms (SHA-256, SHA-512)
   - Use cases for hashing
   - Understanding hash properties

2. **Random Data Generation**
   - crypto.randomBytes() for secure random data
   - crypto.randomUUID() for unique identifiers
   - crypto.randomInt() for random numbers
   - Why cryptographic randomness matters

3. **HMAC (Hash-based Message Authentication)**
   - Creating HMACs with crypto.createHmac()
   - Verifying message authenticity
   - Use cases for HMAC
   - Comparing with simple hashing

4. **Password Hashing**
   - Using crypto.pbkdf2() for password hashing
   - Understanding salt and iterations
   - Secure password storage
   - Password verification

5. **Basic Encryption**
   - Symmetric encryption basics
   - Using crypto.createCipher() and crypto.createDecipher()
   - Understanding keys and initialization vectors
   - Encryption best practices

6. **Security Fundamentals**
   - Strong vs weak algorithms
   - Common security mistakes
   - Best practices for beginners
   - When to use each cryptographic operation

---

## Time Commitment

**Estimated time**: 1-2 hours
- Reading guides: 30-45 minutes
- Studying examples: 20-30 minutes
- Exercises: 30-45 minutes

---

## Conceptual Guides

Before diving into code, read these guides to build conceptual understanding:

### Essential Reading

1. **[Understanding Cryptography Basics](guides/01-understanding-cryptography.md)** (10 min)
   - What is cryptography?
   - Why it matters
   - Core concepts

2. **[Hash Functions Explained](guides/02-hash-functions.md)** (10 min)
   - How hashing works
   - Hash algorithms
   - Common use cases

3. **[Random Data Generation](guides/03-random-generation.md)** (8 min)
   - Cryptographic randomness
   - Different random methods
   - Security implications

4. **[HMAC and Message Authentication](guides/04-hmac-authentication.md)** (10 min)
   - What is HMAC?
   - How it provides authentication
   - Practical applications

5. **[Password Hashing with PBKDF2](guides/05-password-hashing.md)** (12 min)
   - Why special password hashing?
   - Understanding salt and iterations
   - PBKDF2 explained

6. **[Basic Encryption and Decryption](guides/06-basic-encryption.md)** (10 min)
   - Symmetric encryption basics
   - Keys and IVs
   - Simple encryption example

---

## Key Concepts

### Creating Hashes

```javascript
const crypto = require('crypto');

// Create a SHA-256 hash
const hash = crypto.createHash('sha256');
hash.update('Hello World');
const digest = hash.digest('hex');

console.log(digest);
// '64ec88ca00b268e5ba1a35678a1b5316d212f4f366b2477232534a8aeca37f3c'
```

### Generating Random Data

```javascript
const crypto = require('crypto');

// Random bytes
const randomBytes = crypto.randomBytes(16);
console.log(randomBytes.toString('hex'));

// Random UUID
const uuid = crypto.randomUUID();
console.log(uuid); // 'e4b4c7d2-5f1a-4d3e-8c9a-1b2c3d4e5f6a'

// Random integer
const randomNum = crypto.randomInt(0, 100);
console.log(randomNum); // Random number 0-99
```

### Creating HMAC

```javascript
const crypto = require('crypto');

// Create HMAC
const hmac = crypto.createHmac('sha256', 'secret-key');
hmac.update('important message');
const signature = hmac.digest('hex');

console.log(signature);
// Signature proves message authenticity
```

### Hashing Passwords

```javascript
const crypto = require('crypto');

// Hash a password
const password = 'userPassword123';
const salt = crypto.randomBytes(16).toString('hex');

crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
  if (err) throw err;
  const hash = derivedKey.toString('hex');
  console.log('Hash:', hash);
  console.log('Salt:', salt);
  // Store both hash and salt
});
```

### Basic Encryption

```javascript
const crypto = require('crypto');

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

console.log('Original:', 'secret message');
console.log('Encrypted:', encrypted);
console.log('Decrypted:', decrypted);
```

---

## Quick Start

### Your First Hash

Try this in Node.js REPL (`node`):

```javascript
const crypto = require('crypto');

// Create a hash
const hash = crypto.createHash('sha256');
hash.update('Hello');
console.log(hash.digest('hex'));

// Try with different input
const hash2 = crypto.createHash('sha256');
hash2.update('Hello!'); // Added exclamation mark
console.log(hash2.digest('hex'));
// Completely different hash!
```

### Your First Random Data

```javascript
const crypto = require('crypto');

// Generate random token
const token = crypto.randomBytes(32).toString('hex');
console.log('Random token:', token);

// Generate UUID
const id = crypto.randomUUID();
console.log('UUID:', id);
```

---

## Common Pitfalls

### ❌ Pitfall 1: Using Weak Algorithms

```javascript
// ❌ WRONG - MD5 is broken, don't use for security
const hash = crypto.createHash('md5');
hash.update('password');

// ✅ CORRECT - Use SHA-256 or better
const hash = crypto.createHash('sha256');
hash.update('password');
```

### ❌ Pitfall 2: Not Using Salt for Passwords

```javascript
// ❌ WRONG - No salt, vulnerable to rainbow tables
const hash = crypto.createHash('sha256');
hash.update('password');
const insecure = hash.digest('hex');

// ✅ CORRECT - Use pbkdf2 with salt
const salt = crypto.randomBytes(16);
crypto.pbkdf2('password', salt, 100000, 64, 'sha512', (err, key) => {
  // Secure password hash
});
```

### ❌ Pitfall 3: Using Math.random() for Security

```javascript
// ❌ WRONG - Not cryptographically secure
const badToken = Math.random().toString(36).substring(2);

// ✅ CORRECT - Use crypto.randomBytes()
const goodToken = crypto.randomBytes(32).toString('hex');
```

### ❌ Pitfall 4: Forgetting to Handle Errors

```javascript
// ❌ WRONG - No error handling
crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
  const hash = key.toString('hex'); // Crashes if err!
});

// ✅ CORRECT - Handle errors
crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
  if (err) {
    console.error('Hashing failed:', err);
    return;
  }
  const hash = key.toString('hex');
});
```

---

## Examples

Explore practical examples in the [examples/](./examples/) directory:

1. **[Basic Hashing](examples/01-basic-hashing.js)** - Create and verify hashes
2. **[Random Generation](examples/02-random-generation.js)** - Generate secure random data
3. **[HMAC Creation](examples/03-hmac-creation.js)** - Create and verify HMACs
4. **[Password Hashing](examples/04-password-hashing.js)** - Secure password storage
5. **[Basic Encryption](examples/05-basic-encryption.js)** - Encrypt and decrypt data
6. **[Practical Use Cases](examples/06-practical-examples.js)** - Real-world applications

---

## Exercises

Test your knowledge with these hands-on exercises:

### Exercise 1: File Integrity Checker
Create a simple file hash calculator for integrity verification.

**Skills practiced:**
- Creating hashes
- Working with different algorithms
- Comparing hash values

### Exercise 2: Secure Token Generator
Build a token generator for session IDs and API keys.

**Skills practiced:**
- Generating random data
- Different random methods
- Token format considerations

### Exercise 3: Message Authenticator
Implement HMAC-based message authentication.

**Skills practiced:**
- Creating HMACs
- Verifying message authenticity
- Understanding shared secrets

### Exercise 4: Password Manager
Create a simple password hashing and verification system.

**Skills practiced:**
- Password hashing with pbkdf2
- Salt generation
- Password verification
- Secure storage

### Exercise 5: Simple Encryption Tool
Build a basic text encryption and decryption utility.

**Skills practiced:**
- Symmetric encryption
- Working with keys and IVs
- Encryption/decryption flow

---

## Learning Path

### Recommended Sequence

1. **Read Conceptual Guides** (50 minutes)
   - Start with [Understanding Cryptography](guides/01-understanding-cryptography.md)
   - Read all 6 guides in order
   - Take notes on key concepts

2. **Study Examples** (20 minutes)
   - Run each example file
   - Modify examples to experiment
   - Understand the output

3. **Complete Exercises** (45 minutes)
   - Work through each exercise
   - Don't look at solutions immediately
   - Try different approaches

4. **Review Solutions** (15 minutes)
   - Compare with your solutions
   - Understand alternative approaches
   - Note best practices

---

## Success Criteria

You've mastered Level 1 when you can:

- [ ] Create hashes using various algorithms
- [ ] Explain the difference between hashing and encryption
- [ ] Generate cryptographically secure random data
- [ ] Create and verify HMACs
- [ ] Hash passwords securely with salt
- [ ] Perform basic encryption and decryption
- [ ] Understand when to use each cryptographic operation
- [ ] Avoid common security mistakes

---

## What's Next?

After completing Level 1, you'll be ready for:

### Level 2: Intermediate Crypto Operations
- Advanced encryption (AES-GCM)
- Asymmetric encryption (RSA)
- Digital signatures
- Certificate handling
- Key derivation functions
- Streaming encryption

---

## Additional Practice

Want more practice? Try these mini-projects:

1. **Password Strength Checker**
   - Hash passwords
   - Compare hash performance
   - Test different salt lengths

2. **Data Integrity Tool**
   - Calculate file hashes
   - Verify file integrity
   - Support multiple algorithms

3. **Token Service**
   - Generate session tokens
   - Create API keys
   - Build password reset tokens

4. **Simple Encryption App**
   - Encrypt text messages
   - Decrypt with password
   - Handle errors gracefully

---

## Resources

### Official Documentation
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

### Tools
- **Node.js REPL**: Interactive testing (`node` command)
- **Online Hash Calculators**: Verify your results

---

## Questions or Stuck?

- Re-read the relevant guide
- Try the example code in REPL
- Check the [CONCEPTS.md](../CONCEPTS.md) for deeper understanding
- Experiment with variations
- Review solutions after attempting exercises

---

## Let's Begin!

Start with **[Understanding Cryptography](guides/01-understanding-cryptography.md)** and work your way through the guides. Take your time to understand each concept before moving on.

Remember: Cryptography is powerful but must be used correctly. Understanding the fundamentals will help you build secure applications!
