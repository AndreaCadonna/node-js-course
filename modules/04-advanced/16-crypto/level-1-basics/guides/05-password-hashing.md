# Password Hashing with PBKDF2

Understanding secure password storage using Password-Based Key Derivation Function 2 (PBKDF2).

## Table of Contents
- [Why Special Password Hashing?](#why-special-password-hashing)
- [The Problem with Simple Hashing](#the-problem-with-simple-hashing)
- [Understanding Salt](#understanding-salt)
- [Understanding Iterations](#understanding-iterations)
- [What is PBKDF2?](#what-is-pbkdf2)
- [Using crypto.pbkdf2()](#using-cryptopbkdf2)
- [Password Storage Workflow](#password-storage-workflow)
- [Password Verification](#password-verification)
- [Complete Implementation](#complete-implementation)
- [Security Considerations](#security-considerations)
- [Best Practices](#best-practices)
- [Summary](#summary)

---

## Why Special Password Hashing?

### Passwords Are Special

Unlike other data, passwords have unique characteristics:

1. **Users reuse them** across multiple sites
2. **They're often weak** (common words, patterns)
3. **Attackers have huge databases** of common passwords
4. **Compromise is catastrophic** for users

```
Regular Data:
"Transaction ID: 12345" → Hash → Store

Passwords:
"password123" → Special Hash (slow + salt) → Store
                   ↑
            Designed to be slow!
```

### The Threat: Offline Attacks

```
Scenario:
1. Attacker steals database
2. Tries billions of passwords offline
3. Modern GPUs: 100+ billion hashes/second

With Simple Hash:
- 100 billion passwords/second
- Crack weak passwords instantly

With PBKDF2:
- 10,000 passwords/second (10 million times slower!)
- Makes attacks infeasible
```

---

## The Problem with Simple Hashing

### Simple Hash Vulnerability

```javascript
// ❌ NEVER DO THIS
const passwordHash = crypto
  .createHash('sha256')
  .update('password123')
  .digest('hex');

// Problems:
// 1. Always same hash for same password
// 2. Attacker pre-computes hashes (rainbow tables)
// 3. Too fast - billions of attempts per second
```

### Rainbow Table Attack

```
Attacker pre-computes common passwords:

Password        SHA-256 Hash
──────────────────────────────────────────────────────
"password"   →  "5e884898da28047151d0e56f8dc6292773..."
"123456"     →  "8d969eef6ecad3c29a3a629280e686cf0c3f..."
"password123"→  "ef92b778bafe771e89245b89ecbc08a44a4e..."

User's hash in database: "5e884898da28047151d0e56f8dc6292773..."
                          ↓
Lookup in table: Found! Password is "password"
```

### Dictionary Attack

```javascript
// Attacker's script
const commonPasswords = [
  'password', '123456', 'qwerty', 'admin',
  'letmein', 'welcome', 'monkey', '1234567890'
  // ... millions more
];

for (const password of commonPasswords) {
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  if (hash === stolenHash) {
    console.log('Found password:', password);
    break;
  }
}

// With modern hardware: Tests millions per second
```

---

## Understanding Salt

### What is Salt?

**Salt** is random data added to a password before hashing:

```
Without Salt:
Password: "password123"
    ↓
Hash: "ef92b778..."

With Salt:
Password: "password123"
Salt: "a8f3d92c..." (random)
    ↓
Hash(Password + Salt): "9c42ff98..."
```

### Why Salt Matters

```javascript
// Two users with same password

// Without salt (BAD):
User 1: "password123" → Hash → "ef92b778..."
User 2: "password123" → Hash → "ef92b778..."  ← Same hash!
// Attacker knows: If one password found, both are cracked

// With salt (GOOD):
User 1: "password123" + Salt₁ → Hash → "9c42ff98..."
User 2: "password123" + Salt₂ → Hash → "7d8e3a12..."  ← Different!
// Each user has unique hash, must crack separately
```

### Salt Properties

```javascript
// Generate cryptographically random salt
const salt = crypto.randomBytes(16);

console.log(salt.toString('hex'));
// "a8f3d92c4e7b1f2a9d6c3e8f4a7b2d1c"

// Properties:
// 1. Random (unpredictable)
// 2. Unique per user
// 3. Not secret (stored with hash)
// 4. 16-32 bytes recommended
```

**Important**: Salt doesn't need to be secret. It's okay to store it alongside the hash!

```
Database:
┌──────────┬──────────────────┬──────────────────┐
│ Username │ Salt             │ Hash             │
├──────────┼──────────────────┼──────────────────┤
│ alice    │ a8f3d92c4e7b...  │ 9c42ff98de71...  │
│ bob      │ 7d2e8f3a9c1b...  │ 2f8a3c9e7d1b...  │
└──────────┴──────────────────┴──────────────────┘
         ↑                    ↑
    Public (OK)          Public (OK)
```

---

## Understanding Iterations

### What Are Iterations?

**Iterations** (or rounds) determine how many times the hash function runs:

```
1 Iteration:
Password + Salt → Hash

100,000 Iterations:
Password + Salt → Hash → Hash → Hash → ... (100,000 times) → Final Hash
```

### Why Multiple Iterations?

**Make hashing intentionally slow:**

```javascript
// Fast (1 iteration) - BAD
console.time('fast');
crypto.createHash('sha256').update('password').digest();
console.timeEnd('fast');
// fast: 0.5ms
// Attacker: 2 billion attempts/second ❌

// Slow (100,000 iterations) - GOOD
console.time('slow');
crypto.pbkdf2Sync('password', 'salt', 100000, 64, 'sha512');
console.timeEnd('slow');
// slow: 50ms
// Attacker: 20 attempts/second ✅
```

### Iteration Count Recommendations

```
╔════════════╦═════════════╦══════════════════════════╗
║ Algorithm  ║ Iterations  ║ Time (approx)            ║
╠════════════╬═════════════╬══════════════════════════╣
║ PBKDF2-    ║ 600,000+    ║ 50-100ms (2023 OWASP)    ║
║ SHA256     ║             ║                          ║
║            ║             ║                          ║
║ PBKDF2-    ║ 210,000+    ║ 50-100ms (2023 OWASP)    ║
║ SHA512     ║             ║                          ║
║            ║             ║                          ║
║ Legacy     ║ 100,000     ║ Minimum for old systems  ║
╚════════════╩═════════════╩══════════════════════════╝
```

**Rule**: Hash should take 50-100ms on your server. Adjust iterations accordingly.

### Performance Impact

```javascript
// Impact on login:
// - Legitimate user: 100ms delay (barely noticeable)
// - Attacker: 100ms per attempt (makes brute force infeasible)

// Example attack:
const passwordsToTry = 1000000000; // 1 billion
const timePerAttempt = 0.1; // 100ms

const totalTime = passwordsToTry * timePerAttempt;
const years = totalTime / (365 * 24 * 60 * 60);

console.log(`Time to try all: ${years.toFixed(0)} years`);
// 3,171 years!
```

---

## What is PBKDF2?

**PBKDF2** (Password-Based Key Derivation Function 2) is a key derivation function designed for password hashing.

### How PBKDF2 Works

```
Inputs:
├── Password: "myPassword123"
├── Salt: random bytes
├── Iterations: 100,000
├── Key length: 64 bytes
└── Algorithm: SHA-512

Process:
Password + Salt → HMAC-SHA512 → Result₁
Result₁ → HMAC-SHA512 → Result₂
Result₂ → HMAC-SHA512 → Result₃
... (100,000 times)
Result₉₉₉₉₉ → HMAC-SHA512 → Final Hash (64 bytes)
```

### Visual Flow

```
┌──────────────┐
│   Password   │
└──────┬───────┘
       │
       ├───────┐
       │       │
┌──────▼────┐  │
│   Salt    │  │
│ (random)  │  │
└──────┬────┘  │
       │       │
       ├───────┤
       │       │
┌──────▼───────▼────┐
│   HMAC-SHA512     │
│   Iteration 1     │
└──────┬────────────┘
       │
┌──────▼────────────┐
│   HMAC-SHA512     │
│   Iteration 2     │
└──────┬────────────┘
       │
       ⋮
       │ (100,000 times)
       ⋮
       │
┌──────▼────────────┐
│   HMAC-SHA512     │
│   Iteration       │
│   100,000         │
└──────┬────────────┘
       │
┌──────▼────────────┐
│   Derived Key     │
│   (Password Hash) │
└───────────────────┘
```

---

## Using crypto.pbkdf2()

### Basic Syntax

```javascript
crypto.pbkdf2(password, salt, iterations, keylen, digest, callback)
```

**Parameters:**
- `password`: The password to hash (string or buffer)
- `salt`: The salt (buffer)
- `iterations`: Number of iterations (100,000+)
- `keylen`: Length of derived key in bytes (32-64)
- `digest`: Hash algorithm ('sha512', 'sha256')
- `callback`: Function receiving (err, derivedKey)

### Async Example (Callback)

```javascript
const crypto = require('crypto');

// Generate salt
const salt = crypto.randomBytes(16);

// Hash password
crypto.pbkdf2('myPassword123', salt, 100000, 64, 'sha512', (err, derivedKey) => {
  if (err) throw err;

  console.log('Salt:', salt.toString('hex'));
  console.log('Hash:', derivedKey.toString('hex'));
});
```

### Async Example (Promises)

```javascript
const { promisify } = require('util');
const pbkdf2 = promisify(crypto.pbkdf2);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await pbkdf2(password, salt, 100000, 64, 'sha512');

  return {
    salt: salt.toString('hex'),
    hash: hash.toString('hex')
  };
}

// Usage
const result = await hashPassword('myPassword123');
console.log('Salt:', result.salt);
console.log('Hash:', result.hash);
```

### Sync Example

```javascript
// Synchronous (blocks code - use with caution)
const salt = crypto.randomBytes(16);
const hash = crypto.pbkdf2Sync('myPassword123', salt, 100000, 64, 'sha512');

console.log('Hash:', hash.toString('hex'));
```

**Warning**: `pbkdf2Sync` blocks the event loop. Use async version in production!

---

## Password Storage Workflow

### Step-by-Step Process

```
User Registration:
1. User submits password
   ↓
2. Generate random salt
   ↓
3. Hash password with salt using PBKDF2
   ↓
4. Store salt + hash in database
   ↓
5. Discard original password
```

### Implementation

```javascript
class PasswordManager {
  async hashPassword(password) {
    // Step 1: Generate salt
    const salt = crypto.randomBytes(16);

    // Step 2: Hash password
    const hash = await new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });

    // Step 3: Combine salt and hash
    // Store as: salt:hash
    return salt.toString('hex') + ':' + hash.toString('hex');
  }

  async verifyPassword(password, storedHash) {
    // Step 1: Split salt and hash
    const [saltHex, hashHex] = storedHash.split(':');
    const salt = Buffer.from(saltHex, 'hex');

    // Step 2: Hash provided password with same salt
    const hash = await new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });

    // Step 3: Compare hashes
    return hashHex === hash.toString('hex');
  }
}

// Usage
const pm = new PasswordManager();

// Registration
const storedHash = await pm.hashPassword('userPassword123');
console.log('Store this:', storedHash);
// "a8f3d92c4e7b1f2a9d6c3e8f4a7b2d1c:9c42ff98de71..."

// Login
const isValid = await pm.verifyPassword('userPassword123', storedHash);
console.log('Password valid:', isValid); // true
```

---

## Password Verification

### Verification Process

```
User Login:
1. User submits password
   ↓
2. Retrieve stored salt + hash from database
   ↓
3. Hash submitted password with stored salt
   ↓
4. Compare: Does new hash match stored hash?
   ↓
5. Yes → Grant access | No → Deny access
```

### Timing-Safe Comparison

```javascript
async function verifyPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const storedHashBuffer = Buffer.from(hashHex, 'hex');

  // Hash the provided password
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');

  // Timing-safe comparison
  return crypto.timingSafeEqual(hash, storedHashBuffer);
}

// Usage
const isValid = await verifyPassword('password123', storedHash);
```

### Why Timing-Safe?

```javascript
// ❌ Regular comparison (timing attack vulnerable)
function unsafeCompare(hash1, hash2) {
  return hash1 === hash2;
  // Returns as soon as difference found
  // Attacker can measure time differences
}

// ✅ Timing-safe comparison
function safeCompare(hash1, hash2) {
  return crypto.timingSafeEqual(Buffer.from(hash1), Buffer.from(hash2));
  // Always checks all bytes
  // Constant time, no information leak
}
```

---

## Complete Implementation

### Full Password Manager

```javascript
const crypto = require('crypto');
const { promisify } = require('util');

const pbkdf2Async = promisify(crypto.pbkdf2);

class SecurePasswordManager {
  constructor(options = {}) {
    this.iterations = options.iterations || 100000;
    this.keyLength = options.keyLength || 64;
    this.digest = options.digest || 'sha512';
    this.saltSize = options.saltSize || 16;
  }

  /**
   * Hash a password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Combined salt:hash string
   */
  async hash(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    // Generate random salt
    const salt = crypto.randomBytes(this.saltSize);

    // Hash password
    const hash = await pbkdf2Async(
      password,
      salt,
      this.iterations,
      this.keyLength,
      this.digest
    );

    // Return salt:hash format
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  /**
   * Verify a password against stored hash
   * @param {string} password - Plain text password to verify
   * @param {string} storedHash - Stored salt:hash string
   * @returns {Promise<boolean>} True if password matches
   */
  async verify(password, storedHash) {
    if (!password || !storedHash) {
      return false;
    }

    try {
      // Parse stored hash
      const [saltHex, hashHex] = storedHash.split(':');
      if (!saltHex || !hashHex) {
        return false;
      }

      const salt = Buffer.from(saltHex, 'hex');
      const storedHashBuffer = Buffer.from(hashHex, 'hex');

      // Hash provided password with same parameters
      const hash = await pbkdf2Async(
        password,
        salt,
        this.iterations,
        this.keyLength,
        this.digest
      );

      // Timing-safe comparison
      return crypto.timingSafeEqual(hash, storedHashBuffer);
    } catch (err) {
      console.error('Password verification error:', err);
      return false;
    }
  }

  /**
   * Check if hash needs rehashing (parameters changed)
   */
  needsRehash(storedHash) {
    // In a real implementation, you might store iteration count
    // For now, we assume if format is correct, it's OK
    return !storedHash || !storedHash.includes(':');
  }
}

// Export
module.exports = SecurePasswordManager;

// Usage Example
async function demo() {
  const passwordManager = new SecurePasswordManager({
    iterations: 100000,
    keyLength: 64,
    digest: 'sha512'
  });

  // User registration
  console.log('=== Registration ===');
  const password = 'MySecureP@ssw0rd!';
  const hashedPassword = await passwordManager.hash(password);
  console.log('Hashed password:', hashedPassword);
  console.log('Length:', hashedPassword.length);

  // Store in database
  const user = {
    username: 'alice',
    passwordHash: hashedPassword
  };

  // User login
  console.log('\n=== Login ===');
  const loginPassword = 'MySecureP@ssw0rd!';
  const isValid = await passwordManager.verify(loginPassword, user.passwordHash);
  console.log('Password valid:', isValid); // true

  const wrongPassword = 'WrongPassword';
  const isInvalid = await passwordManager.verify(wrongPassword, user.passwordHash);
  console.log('Wrong password valid:', isInvalid); // false
}

demo();
```

### Database Integration Example

```javascript
// Using the password manager with a database
class UserService {
  constructor(db, passwordManager) {
    this.db = db;
    this.passwordManager = passwordManager;
  }

  async register(username, password) {
    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Hash password
    const passwordHash = await this.passwordManager.hash(password);

    // Store in database
    await this.db.users.insert({
      username,
      passwordHash,
      createdAt: new Date()
    });

    return { username };
  }

  async login(username, password) {
    // Get user from database
    const user = await this.db.users.findOne({ username });
    if (!user) {
      return null; // User not found
    }

    // Verify password
    const isValid = await this.passwordManager.verify(
      password,
      user.passwordHash
    );

    if (!isValid) {
      return null; // Invalid password
    }

    // Password valid - return user (without hash)
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(username, oldPassword, newPassword) {
    // Get user
    const user = await this.db.users.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isValid = await this.passwordManager.verify(
      oldPassword,
      user.passwordHash
    );

    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.passwordManager.hash(newPassword);

    // Update database
    await this.db.users.update(
      { username },
      { passwordHash: newPasswordHash, updatedAt: new Date() }
    );

    return true;
  }
}
```

---

## Security Considerations

### 1. Never Log or Display Hashes

```javascript
// ❌ WRONG
console.log('User password:', user.password);
console.log('Password hash:', user.passwordHash);

// ✅ CORRECT
console.log('User logged in:', user.username);
// Never log passwords or hashes
```

### 2. Use Environment-Based Iterations

```javascript
// ✅ Adjust for environment
const ITERATIONS = process.env.NODE_ENV === 'test'
  ? 1000      // Fast for tests
  : 100000;   // Secure for production
```

### 3. Increase Iterations Over Time

```javascript
// Store iteration count with hash
function hashWithMetadata(password) {
  const iterations = 100000;
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');

  // Format: iterations:salt:hash
  return `${iterations}:${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verify(password, storedHash) {
  const [iterations, saltHex, hashHex] = storedHash.split(':');
  const salt = Buffer.from(saltHex, 'hex');

  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    parseInt(iterations),
    64,
    'sha512'
  );

  return hash.toString('hex') === hashHex;
}
```

### 4. Handle Upgrade Path

```javascript
async function loginWithUpgrade(username, password) {
  const user = await db.users.findOne({ username });

  // Verify with old parameters
  const isValid = await verify(password, user.passwordHash);
  if (!isValid) return null;

  // Check if needs rehash with new parameters
  if (needsRehash(user.passwordHash)) {
    const newHash = await hash(password); // Uses new iterations
    await db.users.update({ username }, { passwordHash: newHash });
  }

  return user;
}
```

---

## Best Practices

### ✅ DO: Use High Iteration Counts

```javascript
// ✅ Good (2023 standards)
const iterations = 210000; // PBKDF2-SHA512
const iterations = 600000; // PBKDF2-SHA256
```

### ✅ DO: Use Strong Digest

```javascript
// ✅ Recommended
crypto.pbkdf2(password, salt, 100000, 64, 'sha512', callback);

// ❌ Avoid
crypto.pbkdf2(password, salt, 100000, 64, 'sha1', callback);
```

### ✅ DO: Use Sufficient Key Length

```javascript
// ✅ Good
const keyLength = 64; // 512 bits

// ❌ Too short
const keyLength = 16; // Only 128 bits
```

### ✅ DO: Validate Password Strength

```javascript
function validatePassword(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain number';
  }
  return null; // Valid
}
```

### ❌ DON'T: Use Sync in Production

```javascript
// ❌ Blocks event loop
const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');

// ✅ Non-blocking
crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, hash) => {
  // ...
});
```

---

## Summary

### Key Takeaways

1. **Never use simple hashing** for passwords
2. **Always use salt** - random and unique per user
3. **Use high iteration counts** - 100,000+ (adjust based on performance)
4. **PBKDF2 combines**: Salt + Iterations + Strong hashing
5. **Store salt with hash** - salt is not secret

### Quick Reference

```javascript
// Hash password
const salt = crypto.randomBytes(16);
crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, hash) => {
  const stored = salt.toString('hex') + ':' + hash.toString('hex');
  // Store in database
});

// Verify password
const [saltHex, hashHex] = storedHash.split(':');
const salt = Buffer.from(saltHex, 'hex');
crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, hash) => {
  const isValid = hash.toString('hex') === hashHex;
});
```

### Storage Format

```
Format: salt:hash
Example: "a8f3d92c4e7b1f2a:9c42ff98de71ba..."
         └────────┬────────┘ └──────┬──────┘
              Salt (hex)          Hash (hex)
```

### Next Steps

- **[Basic Encryption](./06-basic-encryption.md)** - Learn symmetric encryption
- Review [CONCEPTS.md](../../CONCEPTS.md) for more on password security
- Practice implementing a complete authentication system

---

**Remember**: Password security is critical. Always use PBKDF2 (or bcrypt/scrypt) for password hashing, never simple hash functions!
