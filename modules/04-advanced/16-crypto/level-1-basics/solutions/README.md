# Level 1: Crypto Basics - Solutions

Complete solutions for all Level 1 exercises with detailed explanations, best practices, and learning points.

## Overview

This directory contains comprehensive solutions for the crypto module Level 1 exercises. Each solution demonstrates:

- ✅ Complete, working implementations
- ✅ Detailed comments explaining the approach
- ✅ Multiple alternative approaches
- ✅ Proper error handling
- ✅ Security best practices
- ✅ Test cases and examples
- ✅ Real-world usage patterns

---

## Solutions Index

| Exercise | Topic | File | Key Concepts |
|----------|-------|------|--------------|
| 1 | File Integrity Checker | [exercise-1-solution.js](./exercise-1-solution.js) | Hashing, SHA-256, integrity verification |
| 2 | Secure Token Generator | [exercise-2-solution.js](./exercise-2-solution.js) | Random data, UUIDs, secure tokens |
| 3 | Message Authenticator | [exercise-3-solution.js](./exercise-3-solution.js) | HMAC, signatures, API signing |
| 4 | Password Manager | [exercise-4-solution.js](./exercise-4-solution.js) | PBKDF2, salt, password hashing |
| 5 | Simple Encryption Tool | [exercise-5-solution.js](./exercise-5-solution.js) | AES encryption, keys, IVs |

---

## Exercise 1: File Integrity Checker

**Concepts Covered:**
- Creating cryptographic hashes
- Using different hash algorithms (SHA-256, SHA-512)
- Verifying data integrity
- Detecting tampering
- Streaming hash updates

### Key Functions

```javascript
// Basic hashing
function createHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Integrity verification
function verifyIntegrity(data, expectedHash) {
  const actualHash = createHash(data);
  return actualHash === expectedHash;
}

// Multi-algorithm hashing
function createHashWithAlgorithm(data, algorithm) {
  return crypto.createHash(algorithm).update(data).digest('hex');
}
```

### Important Learnings

1. **Hash Properties:**
   - Deterministic (same input = same output)
   - One-way (cannot reverse)
   - Avalanche effect (tiny change = completely different hash)
   - Fixed length output

2. **Algorithm Choices:**
   - ✅ Use: SHA-256, SHA-512 (secure)
   - ❌ Avoid: MD5, SHA-1 (broken for security)

3. **Use Cases:**
   - File integrity verification
   - Checksum validation
   - Deduplication
   - Content addressing

### Best Practices

```javascript
// ✅ GOOD: Timing-safe comparison for security-critical scenarios
function compareHashes(hash1, hash2) {
  const buffer1 = Buffer.from(hash1, 'hex');
  const buffer2 = Buffer.from(hash2, 'hex');
  return crypto.timingSafeEqual(buffer1, buffer2);
}

// ✅ GOOD: Streaming for large files
function hashChunks(chunks) {
  const hash = crypto.createHash('sha256');
  chunks.forEach(chunk => hash.update(chunk));
  return hash.digest('hex');
}
```

---

## Exercise 2: Secure Token Generator

**Concepts Covered:**
- Cryptographically secure random data
- UUID generation
- Random numbers in ranges
- API key formats
- Session tokens with expiration

### Key Functions

```javascript
// Secure random token
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

// Random number in range
function generateRandomNumber(min, max) {
  return crypto.randomInt(min, max);
}

// API key with prefix
function generateAPIKey(prefix = 'sk_', length = 32) {
  return prefix + crypto.randomBytes(length).toString('hex');
}
```

### Important Learnings

1. **Why NOT Math.random():**
   - ❌ Not cryptographically secure
   - ❌ Predictable patterns
   - ❌ Can be exploited by attackers
   - ✅ Always use `crypto.randomBytes()` for security

2. **Token Formats:**
   - **Hex:** 2 chars per byte (16 bytes = 32 chars)
   - **Base64:** ~1.33 chars per byte (more compact)
   - **Base64url:** URL-safe (-, _, no =)

3. **Common Prefixes:**
   - `sk_live_` - Secret key (production)
   - `sk_test_` - Secret key (testing)
   - `pk_live_` - Public key (production)
   - `ghp_` - GitHub personal token

### Best Practices

```javascript
// ✅ GOOD: URL-safe tokens
function generateURLSafeToken(length = 32) {
  return crypto.randomBytes(length)
    .toString('base64url'); // Node.js 14.18+
}

// ✅ GOOD: Session with expiration
class SessionToken {
  constructor(expiryMinutes = 60) {
    this.sessionId = crypto.randomUUID();
    this.expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
  }

  isValid() {
    return Date.now() < this.expiresAt;
  }
}
```

---

## Exercise 3: Message Authenticator

**Concepts Covered:**
- HMAC (Hash-based Message Authentication Code)
- Message signature and verification
- Timing-safe comparison
- API request signing
- Webhook verification

### Key Functions

```javascript
// Create HMAC signature
function createSignature(message, secret, algorithm = 'sha256') {
  return crypto.createHmac(algorithm, secret)
    .update(message)
    .digest('hex');
}

// Verify signature (timing-safe)
function verifySignature(message, signature, secret, algorithm = 'sha256') {
  const expectedSignature = createSignature(message, secret, algorithm);
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const providedBuffer = Buffer.from(signature, 'hex');
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

// Sign API request with timestamp
function signAPIRequest(method, path, body, apiSecret) {
  const timestamp = Date.now();
  const payload = `${method}:${path}:${JSON.stringify(body)}:${timestamp}`;
  const signature = createSignature(payload, apiSecret);
  return { signature, timestamp };
}
```

### Important Learnings

1. **HMAC vs Hash:**
   - **Hash:** Integrity only (anyone can verify)
   - **HMAC:** Integrity + Authenticity (requires secret)

2. **Timing Attacks:**
   - Regular `===` comparison can leak information
   - Attacker measures comparison time
   - `crypto.timingSafeEqual()` always takes same time
   - **Always** use for cryptographic comparisons

3. **Replay Attack Prevention:**
   - Include timestamp in signature
   - Verify timestamp is recent (e.g., within 5 minutes)
   - Reject old requests even with valid signature

### Best Practices

```javascript
// ✅ GOOD: Complete API verification
function verifyAPIRequest(method, path, body, signature, timestamp, secret) {
  // Check timestamp
  const age = Date.now() - timestamp;
  if (age > 5 * 60 * 1000) { // 5 minutes
    return { valid: false, reason: 'Timestamp too old' };
  }

  // Reconstruct and verify
  const payload = `${method}:${path}:${JSON.stringify(body)}:${timestamp}`;
  const isValid = verifySignature(payload, signature, secret);

  return {
    valid: isValid,
    reason: isValid ? 'Valid' : 'Signature mismatch'
  };
}

// ✅ GOOD: Webhook verification class
class WebhookVerifier {
  constructor(secret) {
    this.secret = secret;
  }

  sign(payload) {
    return createSignature(JSON.stringify(payload), this.secret);
  }

  verify(payload, signature) {
    return verifySignature(JSON.stringify(payload), signature, this.secret);
  }
}
```

---

## Exercise 4: Password Manager

**Concepts Covered:**
- PBKDF2 password hashing
- Salt generation and storage
- Password verification
- Combined storage format
- User authentication system

### Key Functions

```javascript
// Hash password with salt
function hashPassword(password, iterations = 100000) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');

  return {
    hash: hash.toString('hex'),
    salt: salt.toString('hex')
  };
}

// Verify password (timing-safe)
function verifyPassword(password, storedHash, storedSalt, iterations = 100000) {
  const saltBuffer = Buffer.from(storedSalt, 'hex');
  const hashBuffer = crypto.pbkdf2Sync(password, saltBuffer, iterations, 64, 'sha512');
  const storedHashBuffer = Buffer.from(storedHash, 'hex');

  return crypto.timingSafeEqual(hashBuffer, storedHashBuffer);
}

// Combined storage format
function createPasswordHash(password, iterations = 100000) {
  const { hash, salt } = hashPassword(password, iterations);
  return `pbkdf2:${iterations}:${salt}:${hash}`;
}
```

### Important Learnings

1. **Why NOT Simple Hashing:**
   - ❌ SHA-256 is TOO FAST (billions/second)
   - ❌ Rainbow tables can crack unsalted hashes
   - ✅ PBKDF2 is intentionally SLOW
   - ✅ Makes brute-force attacks impractical

2. **Salt Purpose:**
   - Random data added to password
   - Makes each hash unique
   - Prevents rainbow table attacks
   - NOT secret (stored with hash)
   - Must be unique per password

3. **Iteration Count:**
   - Higher = more secure (but slower)
   - 100,000+ recommended for PBKDF2
   - Adjust based on hardware/requirements
   - Can increase over time

### Best Practices

```javascript
// ✅ GOOD: Combined format with metadata
function createPasswordHash(password, iterations = 100000) {
  const { hash, salt } = hashPassword(password, iterations);
  return `pbkdf2:${iterations}:${salt}:${hash}`;
}

// ✅ GOOD: Parse and verify
function verifyPasswordFromHash(password, combinedHash) {
  const [algorithm, iterations, salt, hash] = combinedHash.split(':');

  if (algorithm !== 'pbkdf2') return false;

  return verifyPassword(password, hash, salt, parseInt(iterations));
}

// ✅ GOOD: Async for web servers
async function hashPasswordAsync(password, iterations = 100000) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (err, key) => {
      if (err) reject(err);
      else resolve({
        hash: key.toString('hex'),
        salt: salt.toString('hex')
      });
    });
  });
}
```

### Common Mistakes

```javascript
// ❌ WRONG: Using simple hash for passwords
const badHash = crypto.createHash('sha256').update(password).digest('hex');

// ❌ WRONG: No salt
const badHash = crypto.pbkdf2Sync(password, 'fixed-salt', 100000, 64, 'sha512');

// ❌ WRONG: Too few iterations
const badHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512');

// ❌ WRONG: Insecure comparison
if (computedHash === storedHash) { /* vulnerable to timing attacks */ }
```

---

## Exercise 5: Simple Encryption Tool

**Concepts Covered:**
- AES-256-CBC symmetric encryption
- Encryption keys and IVs
- Password-based encryption
- Key derivation from passwords
- Complete encryption utility

### Key Functions

```javascript
// Basic encryption
function encrypt(text, key, iv) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Basic decryption
function decrypt(encryptedText, key, iv) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Password-based encryption
function encryptWithPassword(text, password) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encrypted,
    salt: salt.toString('hex'),
    iv: iv.toString('hex')
  };
}
```

### Important Learnings

1. **Encryption vs Hashing:**
   - **Encryption:** Reversible (can decrypt)
   - **Hashing:** One-way (cannot reverse)
   - **Purpose:** Confidentiality vs Integrity

2. **Key Requirements:**
   - AES-256 needs 32-byte (256-bit) key
   - Must be random and secret
   - Losing key = data is lost forever
   - NEVER hardcode keys in code

3. **IV (Initialization Vector):**
   - 16 bytes (128 bits) for AES-CBC
   - Must be random for EACH encryption
   - NOT secret (stored with ciphertext)
   - Prevents pattern detection
   - NEVER reuse with same key

4. **Password-Based Encryption:**
   - Derive key from password using PBKDF2
   - Need to store: salt, IV, ciphertext
   - Only password is secret
   - Same password produces different ciphertexts

### Best Practices

```javascript
// ✅ GOOD: Complete encryption utility
class EncryptionTool {
  constructor(password) {
    this.password = password;
  }

  encrypt(text) {
    const result = encryptWithPassword(text, this.password);
    return `${result.encrypted}:${result.salt}:${result.iv}`;
  }

  decrypt(combinedString) {
    const [encrypted, salt, iv] = combinedString.split(':');
    return decryptWithPassword(encrypted, this.password, salt, iv);
  }
}

// ✅ GOOD: Use AES-GCM for authenticated encryption
function encryptGCM(text, password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const iv = crypto.randomBytes(12); // GCM uses 12-byte IV

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag(); // Ensures integrity

  return { encrypted, salt: salt.toString('hex'),
           iv: iv.toString('hex'), authTag: authTag.toString('hex') };
}
```

### Common Mistakes

```javascript
// ❌ WRONG: Reusing IV
const iv = crypto.randomBytes(16); // Created once
encrypt(text1, key, iv); // OK
encrypt(text2, key, iv); // WRONG! Reused IV

// ❌ WRONG: Not storing IV or salt
const { encrypted } = encryptWithPassword(text, password);
// Lost salt and IV, cannot decrypt!

// ❌ WRONG: Weak algorithm
crypto.createCipheriv('des', key, iv); // DES is broken

// ❌ WRONG: Hardcoded key
const key = Buffer.from('0123456789...'); // NEVER hardcode keys!
```

---

## Security Comparison Table

| Operation | Purpose | Reversible | Secret Key | Use Cases |
|-----------|---------|------------|------------|-----------|
| **Hash** | Integrity | ❌ No | ❌ No | Checksums, deduplication |
| **HMAC** | Authenticity | ❌ No | ✅ Yes | API signing, webhooks |
| **PBKDF2** | Password hash | ❌ No | ❌ No (uses salt) | Password storage |
| **Encryption** | Confidentiality | ✅ Yes | ✅ Yes | Data protection |

---

## Common Use Cases

### 1. File Integrity Verification

```javascript
// Calculate checksum
const hash = crypto.createHash('sha256')
  .update(fileContent)
  .digest('hex');

// Later, verify
const currentHash = crypto.createHash('sha256')
  .update(fileContent)
  .digest('hex');

if (hash === currentHash) {
  console.log('File is unchanged');
}
```

### 2. API Authentication

```javascript
// Client: Sign request
const timestamp = Date.now();
const payload = `${method}:${path}:${JSON.stringify(body)}:${timestamp}`;
const signature = crypto.createHmac('sha256', apiSecret)
  .update(payload)
  .digest('hex');

// Send: headers['X-Signature'] = signature
//       headers['X-Timestamp'] = timestamp

// Server: Verify
const age = Date.now() - timestamp;
if (age > 300000) throw new Error('Request expired');

const expectedSig = crypto.createHmac('sha256', apiSecret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSig) throw new Error('Invalid signature');
```

### 3. User Authentication

```javascript
// Registration
const { hash, salt } = hashPassword(password);
db.users.insert({ username, passwordHash: `pbkdf2:100000:${salt}:${hash}` });

// Login
const user = db.users.findOne({ username });
const isValid = verifyPasswordFromHash(password, user.passwordHash);

if (isValid) {
  // Create session
  const sessionToken = crypto.randomUUID();
  // ...
}
```

### 4. Secure Data Storage

```javascript
// Encrypt sensitive data
const tool = new EncryptionTool(masterPassword);
const encrypted = tool.encrypt(sensitiveData);
db.store(encrypted);

// Later, decrypt
const encrypted = db.retrieve();
const decrypted = tool.decrypt(encrypted);
```

---

## Performance Considerations

### Hash Functions (Fast)

```javascript
// SHA-256: ~100-500 MB/s
// Suitable for: File checksums, integrity verification
console.time('hash');
crypto.createHash('sha256').update(largeData).digest('hex');
console.timeEnd('hash'); // ~few milliseconds
```

### PBKDF2 (Intentionally Slow)

```javascript
// 100,000 iterations: ~50-200ms
// Suitable for: Password hashing (slow = secure)
console.time('pbkdf2');
crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
console.timeEnd('pbkdf2'); // ~100ms
```

### Encryption (Medium)

```javascript
// AES-256-CBC: ~50-200 MB/s
// Suitable for: Data encryption, file encryption
console.time('encrypt');
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
cipher.update(data);
cipher.final();
console.timeEnd('encrypt'); // ~few milliseconds
```

---

## Testing Your Solutions

Each solution file can be run independently:

```bash
# Test Exercise 1
node exercise-1-solution.js

# Test Exercise 2
node exercise-2-solution.js

# Test Exercise 3
node exercise-3-solution.js

# Test Exercise 4
node exercise-4-solution.js

# Test Exercise 5
node exercise-5-solution.js
```

All tests should pass and display ✓ marks for completed tasks.

---

## Key Takeaways

### 🔐 Security Principles

1. **Use the Right Tool:**
   - Hash for integrity
   - HMAC for authenticity
   - PBKDF2 for passwords
   - Encryption for confidentiality

2. **Never Compromise on Security:**
   - Always use `crypto.randomBytes()` (never `Math.random()`)
   - Always use timing-safe comparisons for secrets
   - Always use proper salt for passwords
   - Never reuse IVs with the same key

3. **Modern Algorithms Only:**
   - ✅ Use: SHA-256/512, AES-256, PBKDF2 100k+ iterations
   - ❌ Avoid: MD5, SHA-1, DES, RC4, low iterations

### 🛠️ Best Practices

1. **Error Handling:**
   - Always validate inputs
   - Handle errors gracefully
   - Don't expose sensitive error details

2. **Storage:**
   - Store salt with hash (not secret)
   - Store IV with ciphertext (not secret)
   - NEVER store encryption keys or passwords
   - Use combined formats for easy management

3. **Performance:**
   - Use async operations in web servers
   - Stream large files instead of loading into memory
   - Choose appropriate iteration counts

### 📚 Further Learning

After mastering these exercises, you're ready for:

- **Level 2:** Advanced encryption (RSA, digital signatures)
- **Level 3:** Certificates, key management, real-world systems

---

## Additional Resources

### Official Documentation
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

### Recommended Reading
- Understanding Cryptography by Christof Paar
- Serious Cryptography by Jean-Philippe Aumasson
- [Crypto 101](https://www.crypto101.io/) - Free book

### Online Tools
- [SHA-256 Hash Generator](https://emn178.github.io/online-tools/sha256.html)
- [AES Encryption](https://www.devglan.com/online-tools/aes-encryption-decryption)

---

## Need Help?

If you're stuck on any exercise:

1. Review the relevant guide in the `guides/` directory
2. Study the example code in `examples/`
3. Check the solution explanations in this README
4. Run the solution file to see it in action
5. Experiment with modifications to understand deeply

Remember: The goal is understanding, not just completing exercises. Take time to experiment and explore!

---

## Contributing

Found an issue or have a better approach? Contributions are welcome!

- Solutions should be clear and well-commented
- Include multiple approaches where applicable
- Follow security best practices
- Add test cases to demonstrate functionality

---

**Happy Learning! 🎓**

You're now equipped with fundamental cryptographic skills that are essential for building secure applications. Keep practicing and stay curious!
