# Understanding Cryptography Basics

A foundational guide to cryptographic concepts and why they matter in modern applications.

## Table of Contents
- [What is Cryptography?](#what-is-cryptography)
- [Why Cryptography Matters](#why-cryptography-matters)
- [Core Cryptographic Concepts](#core-cryptographic-concepts)
- [The Four Pillars of Security](#the-four-pillars-of-security)
- [Node.js Crypto Module Overview](#nodejs-crypto-module-overview)
- [Real-World Scenarios](#real-world-scenarios)
- [Common Cryptographic Operations](#common-cryptographic-operations)
- [Security vs Convenience](#security-vs-convenience)
- [Summary](#summary)

---

## What is Cryptography?

**Cryptography** is the science of protecting information by transforming it into a secure format. Think of it as a set of mathematical tools that help keep data safe from unauthorized access and tampering.

### Simple Analogy

Imagine you want to send a secret message to a friend:

```
Without Cryptography:
You → "Meet me at 5pm" → Anyone can read → Friend

With Cryptography:
You → Encrypt → "Xlii xl ex 5tl" → Only friend can read → Friend
```

The encrypted version looks like gibberish to everyone except those who have the key to decode it.

### In the Digital World

In software development, cryptography helps us:
- Keep passwords safe
- Protect sensitive data
- Verify message authenticity
- Secure communications
- Ensure data integrity

---

## Why Cryptography Matters

### The Cost of Insecurity

Consider these real scenarios:

**Scenario 1: Plain Text Passwords**
```javascript
// ❌ DISASTER WAITING TO HAPPEN
const users = [
  { username: 'alice', password: 'password123' },
  { username: 'bob', password: 'qwerty' }
];

// If database is leaked:
// → All passwords exposed
// → Users accounts compromised
// → Possible legal consequences
```

**Scenario 2: Unprotected Data**
```javascript
// ❌ SENSITIVE DATA IN PLAIN TEXT
const creditCard = '1234-5678-9012-3456';
fs.writeFileSync('data.txt', creditCard);

// If file is accessed:
// → Financial fraud
// → Identity theft
// → Regulatory violations (PCI-DSS)
```

### The Value of Security

With proper cryptography:

```javascript
// ✅ SECURE PASSWORD STORAGE
const hashedPassword = await hashPassword('password123');
// Stored: '$2b$10$N9qo8uLOickgx2...'
// Original password cannot be recovered

// ✅ ENCRYPTED SENSITIVE DATA
const encrypted = encrypt('1234-5678-9012-3456', key);
// Stored: 'a8f5f167f44f4964e6c998dee827110c'
// Only readable with the correct key
```

---

## Core Cryptographic Concepts

### 1. Plaintext vs Ciphertext

**Plaintext**: The original, readable data
**Ciphertext**: The encrypted, unreadable data

```
Plaintext:  "Hello World"
     ↓
Encryption
     ↓
Ciphertext: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
```

### 2. Keys

A **key** is like a password for encryption/decryption:

```
Message + Key → Encrypted
Encrypted + Key → Message
```

**Key Properties:**
- Should be random
- Must be kept secret
- Length matters (longer = more secure)
- Different keys = different ciphertext

```javascript
const key1 = crypto.randomBytes(32); // 256-bit key
const key2 = crypto.randomBytes(32); // Different key

// Same message, different keys = different results
const encrypted1 = encrypt("Hello", key1);
const encrypted2 = encrypt("Hello", key2);
// encrypted1 ≠ encrypted2
```

### 3. One-Way vs Two-Way Operations

**One-Way (Hashing):**
```
Input → Hash Function → Hash
"password" → SHA-256 → "5e884898da28047151d0e56f8dc6..."

Cannot reverse: Hash → Original Input ❌
```

**Two-Way (Encryption):**
```
Plaintext → Encrypt → Ciphertext
Ciphertext → Decrypt → Plaintext ✅
```

### 4. Deterministic vs Random

**Deterministic**: Same input always produces same output
```javascript
// Hashing is deterministic
hash("hello") === hash("hello") // Always true
```

**Random**: Each operation produces different output
```javascript
// Encryption with new IV is random
encrypt("hello") !== encrypt("hello") // Different each time
```

---

## The Four Pillars of Security

Cryptography provides four fundamental security properties:

### 1. Confidentiality

**Goal**: Keep data secret from unauthorized parties

```
┌─────────────┐
│   Secret    │
│  Document   │ → Encryption → [Encrypted Data] → Only authorized
└─────────────┘                                     parties can read
```

**Example:**
```javascript
// Encrypt sensitive customer data
const encrypted = encrypt(customerData, key);
// Only those with the key can read it
```

### 2. Integrity

**Goal**: Ensure data hasn't been tampered with

```
Original Message → Hash → "abc123..."

Modified Message → Hash → "xyz789..." ← Different!
```

**Example:**
```javascript
// Hash file to verify it hasn't changed
const originalHash = hash(fileContents);
// Later...
if (hash(fileContents) === originalHash) {
  console.log('File intact ✅');
} else {
  console.log('File modified! ⚠️');
}
```

### 3. Authentication

**Goal**: Verify identity of sender/receiver

```
Sender: Creates signature with secret key
    ↓
Message + Signature
    ↓
Receiver: Verifies signature with secret key
```

**Example:**
```javascript
// Create HMAC signature
const signature = hmac(message, secretKey);
// Receiver can verify message came from someone with the key
```

### 4. Non-Repudiation

**Goal**: Prevent denial of actions

```
Sender signs with private key → Only sender has private key
                               → Cannot deny sending message
```

**Example:**
```javascript
// Digital signature (Level 2 topic)
const signature = sign(message, privateKey);
// Proves sender created this message
```

---

## Node.js Crypto Module Overview

Node.js provides the built-in `crypto` module powered by OpenSSL:

```javascript
const crypto = require('crypto');
```

### Main Categories

```
crypto module
├── Hash Functions        (createHash)
├── HMAC                  (createHmac)
├── Random Generation     (randomBytes, randomUUID, randomInt)
├── Password Hashing      (pbkdf2, scrypt)
├── Encryption/Decryption (createCipheriv, createDecipheriv)
├── Digital Signatures    (createSign, createVerify)
└── Key Generation        (generateKeyPair)
```

### Quick Examples

```javascript
// Hash
const hash = crypto.createHash('sha256');
hash.update('data');
console.log(hash.digest('hex'));

// Random
const randomBytes = crypto.randomBytes(16);
const uuid = crypto.randomUUID();

// HMAC
const hmac = crypto.createHmac('sha256', 'secret');
hmac.update('message');
console.log(hmac.digest('hex'));

// Password Hash
crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', (err, key) => {
  console.log(key.toString('hex'));
});
```

---

## Real-World Scenarios

### Scenario 1: User Registration

```javascript
// User creates account
const username = 'alice';
const password = 'mySecret123';

// ❌ WRONG - Store plain password
users.push({ username, password });

// ✅ CORRECT - Hash password
const salt = crypto.randomBytes(16);
crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, hash) => {
  users.push({
    username,
    passwordHash: hash.toString('hex'),
    salt: salt.toString('hex')
  });
});
```

### Scenario 2: API Request Signing

```javascript
// Client signs API request
const requestData = JSON.stringify({
  action: 'transfer',
  amount: 100,
  timestamp: Date.now()
});

const signature = crypto
  .createHmac('sha256', API_SECRET)
  .update(requestData)
  .digest('hex');

// Send request with signature
fetch('/api/transfer', {
  method: 'POST',
  body: requestData,
  headers: { 'X-Signature': signature }
});

// Server verifies signature
const expectedSignature = crypto
  .createHmac('sha256', API_SECRET)
  .update(requestData)
  .digest('hex');

if (signature === expectedSignature) {
  // Request is authentic
  processTransfer();
}
```

### Scenario 3: Session Token Generation

```javascript
// ❌ WRONG - Predictable token
const badToken = `${userId}-${Date.now()}`;
// Attacker can guess: "123-1699564800000"

// ✅ CORRECT - Cryptographically random
const goodToken = crypto.randomBytes(32).toString('hex');
// Unpredictable: "9f86d081884c7d659a2feaa0c55ad015..."

// Store session
sessions.set(goodToken, {
  userId,
  expiresAt: Date.now() + 3600000
});
```

### Scenario 4: File Integrity Check

```javascript
// Calculate hash when file is created
const originalHash = crypto
  .createHash('sha256')
  .update(fileContents)
  .digest('hex');

// Store hash
fs.writeFileSync('file.txt.sha256', originalHash);

// Later, verify file hasn't been modified
const currentHash = crypto
  .createHash('sha256')
  .update(fs.readFileSync('file.txt'))
  .digest('hex');

if (currentHash === originalHash) {
  console.log('✅ File verified - no tampering');
} else {
  console.log('⚠️ File modified - integrity compromised');
}
```

---

## Common Cryptographic Operations

### Operation Matrix

| Operation | Use Case | Reversible? | Needs Key? |
|-----------|----------|-------------|------------|
| **Hashing** | Data integrity, file checksums | No | No |
| **Password Hashing** | Secure password storage | No | Yes (salt) |
| **HMAC** | Message authentication | No | Yes |
| **Encryption** | Data confidentiality | Yes | Yes |
| **Signatures** | Identity verification | No (verify only) | Yes (key pair) |

### When to Use What

**Use Hashing when:**
- Verifying file integrity
- Creating unique identifiers
- Checking for duplicates

**Use Password Hashing when:**
- Storing user passwords
- Creating password-derived keys

**Use HMAC when:**
- Authenticating API requests
- Verifying message sender
- Creating signed tokens

**Use Encryption when:**
- Storing sensitive data
- Protecting data in transit
- Securing communications

---

## Security vs Convenience

### The Security Triangle

```
        Security
           /\
          /  \
         /    \
        /      \
       /________\
  Convenience  Performance
```

You can optimize for two, but rarely all three:

**Example: Password Hashing**
```javascript
// High security, low performance
crypto.pbkdf2(password, salt, 310000, 64, 'sha512', callback);
// Takes ~100ms per hash → Protects against brute force

// Low security, high performance
const hash = crypto.createHash('sha256').update(password).digest('hex');
// Takes <1ms → Vulnerable to rainbow tables
```

### Making Trade-offs

**Development Environment:**
```javascript
// Can use faster, simpler methods
const hash = crypto.createHash('sha256').update(data).digest('hex');
```

**Production Environment:**
```javascript
// Must use secure methods
crypto.pbkdf2(password, salt, 100000, 64, 'sha512', callback);
```

**Rule of Thumb:**
- For user data: Always maximize security
- For internal tools: Balance based on risk
- For testing: Can use simpler methods
- When in doubt: Choose security

---

## Summary

### Key Takeaways

1. **Cryptography is essential** for protecting sensitive data in modern applications

2. **Four pillars of security:**
   - Confidentiality (keep secret)
   - Integrity (detect tampering)
   - Authentication (verify identity)
   - Non-repudiation (prove actions)

3. **Different tools for different jobs:**
   - Hashing: One-way transformation
   - HMAC: Authenticated hashing
   - Encryption: Two-way transformation
   - Password hashing: Specialized secure storage

4. **Node.js crypto module** provides everything you need:
   ```javascript
   const crypto = require('crypto');
   ```

5. **Always prioritize security** over convenience when handling:
   - User passwords
   - Personal information
   - Financial data
   - Authentication tokens

### Common Mistakes to Avoid

❌ Storing passwords in plain text
❌ Using weak algorithms (MD5, SHA-1)
❌ Using `Math.random()` for security
❌ Ignoring encryption for sensitive data
❌ Rolling your own crypto algorithms

### Next Steps

Now that you understand the fundamentals, you're ready to explore specific cryptographic operations:

- **[Hash Functions](./02-hash-functions.md)** - Learn about creating and using hashes
- **[Random Generation](./03-random-generation.md)** - Generate secure random data
- **[HMAC Authentication](./04-hmac-authentication.md)** - Authenticate messages
- **[Password Hashing](./05-password-hashing.md)** - Secure password storage
- **[Basic Encryption](./06-basic-encryption.md)** - Protect confidential data

---

## Quick Reference

```javascript
const crypto = require('crypto');

// Hash data
const hash = crypto.createHash('sha256').update('data').digest('hex');

// Generate random data
const random = crypto.randomBytes(32);
const uuid = crypto.randomUUID();

// Create HMAC
const hmac = crypto.createHmac('sha256', 'key').update('msg').digest('hex');

// Hash password
crypto.pbkdf2('password', 'salt', 100000, 64, 'sha512', (err, key) => {
  // Use key
});
```

---

**Remember**: Understanding these concepts is the first step to building secure applications. In the following guides, we'll dive deep into each operation with practical examples and best practices.
