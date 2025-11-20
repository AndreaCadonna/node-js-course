# Cryptographic Random Generation

Understanding and using secure random number generation in Node.js.

## Table of Contents
- [Why Cryptographic Randomness Matters](#why-cryptographic-randomness-matters)
- [Random vs Cryptographically Random](#random-vs-cryptographically-random)
- [crypto.randomBytes()](#cryptorandombytes)
- [crypto.randomUUID()](#cryptorandomuuid)
- [crypto.randomInt()](#cryptorandomint)
- [Practical Applications](#practical-applications)
- [Common Patterns](#common-patterns)
- [Security Implications](#security-implications)
- [Best Practices](#best-practices)
- [Summary](#summary)

---

## Why Cryptographic Randomness Matters

### The Problem with Predictability

Imagine generating a password reset token:

```javascript
// ❌ DANGEROUS - Predictable
const badToken = `reset-${Date.now()}-${userId}`;
// Result: "reset-1699564800000-123"
// Attacker can guess: Try timestamps around now + user IDs

// ✅ SECURE - Unpredictable
const goodToken = crypto.randomBytes(32).toString('hex');
// Result: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
// Impossible to guess or predict
```

### Real-World Consequences

**Case Study: Weak Token Generation**
```javascript
// ❌ Company X used this for session tokens
const sessionId = Math.floor(Math.random() * 1000000);
// Tokens: 123456, 789012, 456789...

// Result:
// - Attacker tries random 6-digit numbers
// - 1 in 1,000,000 chance per guess
// - Can try thousands per second
// - Account takeover in minutes
```

**Proper Solution:**
```javascript
// ✅ Cryptographically secure
const sessionId = crypto.randomBytes(32).toString('hex');
// Tokens: "f4a8c0d1e2b9...", "8d7e3c1f9a4b..."

// Result:
// - 2^256 possible values
// - Impossible to guess
// - Accounts secure
```

---

## Random vs Cryptographically Random

### Math.random() vs crypto.randomBytes()

```
╔════════════════╦═══════════════════════╦════════════════════════╗
║                ║ Math.random()         ║ crypto.randomBytes()   ║
╠════════════════╬═══════════════════════╬════════════════════════╣
║ Predictability ║ Predictable           ║ Unpredictable          ║
║ Security       ║ NOT secure            ║ Cryptographically safe ║
║ Use Case       ║ Games, simulations    ║ Security, tokens       ║
║ Speed          ║ Very fast             ║ Fast enough            ║
║ Seed           ║ Can be seeded         ║ System entropy         ║
╚════════════════╩═══════════════════════╩════════════════════════╝
```

### Visual Comparison

```javascript
// Math.random() - Predictable pattern
console.log(Math.random()); // 0.123456789
console.log(Math.random()); // 0.987654321
console.log(Math.random()); // 0.456789123
// Pattern might exist, especially with seeded generators

// crypto.randomBytes() - True randomness
console.log(crypto.randomBytes(4)); // <Buffer a3 4f 2d 8e>
console.log(crypto.randomBytes(4)); // <Buffer 1c 9b 5e 7a>
console.log(crypto.randomBytes(4)); // <Buffer d2 8f 3c 6b>
// No pattern, truly random
```

### Security Comparison

```
Math.random():
┌──────────────┐
│ Simple PRNG  │  Predictable Algorithm
│ (Mersenne    │  ↓
│  Twister)    │  Given enough samples, can predict next values
└──────────────┘

crypto.randomBytes():
┌──────────────┐
│ OS Entropy   │  System randomness (keyboard, mouse, network)
│ Pool         │  ↓
│              │  Combined with cryptographic algorithms
│ (CSPRNG)     │  ↓
└──────────────┘  Impossible to predict
```

---

## crypto.randomBytes()

### Basic Usage

```javascript
const crypto = require('crypto');

// Generate 16 random bytes
const bytes = crypto.randomBytes(16);
console.log(bytes);
// <Buffer 9f 86 d0 81 88 4c 7d 65 9a 2f ea a0 c5 5a d0 15>

// Convert to hexadecimal string
console.log(bytes.toString('hex'));
// "9f86d081884c7d659a2feaa0c55ad015"

// Convert to base64
console.log(bytes.toString('base64'));
// "n4bQgYhMfWWaL+qgxVrQFQ=="
```

### Async vs Sync

```javascript
// Synchronous (blocks code)
const syncBytes = crypto.randomBytes(32);
console.log('Sync:', syncBytes.toString('hex'));

// Asynchronous (callback)
crypto.randomBytes(32, (err, buffer) => {
  if (err) throw err;
  console.log('Async:', buffer.toString('hex'));
});

// Asynchronous (Promise - Node.js 15+)
const { randomBytes } = require('crypto').promises;
const asyncBytes = await randomBytes(32);
console.log('Promise:', asyncBytes.toString('hex'));
```

### Choosing the Right Size

```javascript
// Token sizes and their strength
const token8 = crypto.randomBytes(8);   // 64 bits  - Weak
const token16 = crypto.randomBytes(16); // 128 bits - Moderate
const token32 = crypto.randomBytes(32); // 256 bits - Strong (recommended)
const token64 = crypto.randomBytes(64); // 512 bits - Very strong

console.log('8 bytes: ', token8.toString('hex'));  // 16 hex chars
console.log('16 bytes:', token16.toString('hex')); // 32 hex chars
console.log('32 bytes:', token32.toString('hex')); // 64 hex chars
console.log('64 bytes:', token64.toString('hex')); // 128 hex chars
```

**Recommendation Table:**

| Use Case | Recommended Size | Example |
|----------|-----------------|---------|
| Session tokens | 32 bytes (256 bits) | Login sessions |
| API keys | 32 bytes (256 bits) | API authentication |
| Password reset tokens | 32 bytes (256 bits) | Password recovery |
| CSRF tokens | 16 bytes (128 bits) | Form protection |
| Encryption keys (AES-256) | 32 bytes (256 bits) | Data encryption |
| Encryption IV | 16 bytes (128 bits) | Cipher initialization |
| Salt | 16-32 bytes | Password hashing |

---

## crypto.randomUUID()

### What is UUID?

**UUID** (Universally Unique Identifier) is a 128-bit identifier:

```
Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx

Example: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
         └─────┘ └──┘ └─┘ └─┘ └──────────┘
         8 chars  4   4   4    12 chars
```

### Basic Usage

```javascript
// Generate UUID v4 (random)
const uuid = crypto.randomUUID();
console.log(uuid);
// "f47ac10b-58cc-4372-a567-0e02b2c3d479"

// Generate multiple UUIDs
for (let i = 0; i < 5; i++) {
  console.log(crypto.randomUUID());
}
// f47ac10b-58cc-4372-a567-0e02b2c3d479
// 9a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d
// 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d
// ...each unique
```

### UUID Use Cases

```javascript
// 1. Database primary keys
const userId = crypto.randomUUID();
db.users.insert({ id: userId, name: 'Alice' });

// 2. Unique filenames
const filename = `${crypto.randomUUID()}.jpg`;
fs.writeFileSync(filename, imageData);

// 3. Request tracking
function handleRequest(req, res) {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Processing request`);
  // ... handle request
  console.log(`[${requestId}] Request complete`);
}

// 4. Event IDs
const event = {
  id: crypto.randomUUID(),
  type: 'user.login',
  timestamp: Date.now()
};
```

### UUID vs Random Bytes

```javascript
// UUID - Standard format, 128 bits
const uuid = crypto.randomUUID();
console.log(uuid); // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
console.log(uuid.length); // 36 characters (with dashes)

// Random Bytes - Custom format, variable size
const random = crypto.randomBytes(16).toString('hex');
console.log(random); // "f47ac10b58cc4372a5670e02b2c3d479"
console.log(random.length); // 32 characters (no dashes)
```

**When to use each:**
- **UUID**: When you need standard format, database IDs, interoperability
- **Random Bytes**: When you need security tokens, custom length, flexibility

---

## crypto.randomInt()

### Basic Usage

```javascript
// Random integer from 0 to 99 (100 not included)
const num = crypto.randomInt(100);
console.log(num); // 0-99

// Random integer from 10 to 99
const num2 = crypto.randomInt(10, 100);
console.log(num2); // 10-99

// Random integer from 1 to 6 (dice roll)
const dice = crypto.randomInt(1, 7);
console.log('Dice roll:', dice); // 1-6
```

### Async Version

```javascript
// Callback style
crypto.randomInt(100, (err, num) => {
  if (err) throw err;
  console.log('Random number:', num);
});

// Promise style (Node.js 15+)
const { randomInt } = require('crypto').promises;
const num = await randomInt(100);
console.log('Random number:', num);
```

### Practical Examples

```javascript
// 1. Random PIN generation
function generatePIN() {
  return crypto.randomInt(1000, 10000).toString();
  // 4-digit PIN: 1000-9999
}

// 2. Random array selection
function randomChoice(array) {
  const index = crypto.randomInt(array.length);
  return array[index];
}

const colors = ['red', 'blue', 'green', 'yellow'];
console.log(randomChoice(colors)); // Random color

// 3. Random delay (for rate limiting)
function randomDelay(minMs, maxMs) {
  return crypto.randomInt(minMs, maxMs);
}

const delay = randomDelay(100, 500); // 100-500ms
setTimeout(() => console.log('Delayed'), delay);

// 4. Secure OTP generation
function generateOTP(digits = 6) {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits);
  return crypto.randomInt(min, max).toString();
}

console.log(generateOTP(6)); // "583921"
console.log(generateOTP(4)); // "7492"
```

### randomInt vs Math.random()

```javascript
// ❌ Math.random() - NOT secure
function badRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
  // Predictable, not for security
}

// ✅ crypto.randomInt() - Secure
function goodRandomInt(min, max) {
  return crypto.randomInt(min, max);
  // Cryptographically secure
}

// For security purposes, always use crypto.randomInt()
```

---

## Practical Applications

### Application 1: Session Token Generator

```javascript
class SessionManager {
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  createSession(userId) {
    const token = this.generateToken();
    const session = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000 // 1 hour
    };

    // Store in database or memory
    this.sessions.set(token, session);
    return token;
  }

  validateToken(token) {
    const session = this.sessions.get(token);
    if (!session) return false;
    if (session.expiresAt < Date.now()) return false;
    return true;
  }
}

// Usage
const sm = new SessionManager();
const token = sm.createSession('user123');
console.log('Session token:', token);
// "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
```

### Application 2: API Key Generator

```javascript
class APIKeyManager {
  generateKey(prefix = 'sk') {
    const random = crypto.randomBytes(32).toString('base64')
      .replace(/[+/=]/g, ''); // Remove special chars
    return `${prefix}_${random}`;
  }

  createAPIKey(userId, permissions) {
    const key = this.generateKey();
    const apiKey = {
      key,
      userId,
      permissions,
      createdAt: new Date(),
      lastUsed: null
    };

    // Store in database
    this.keys.set(key, apiKey);
    return key;
  }
}

// Usage
const akm = new APIKeyManager();
const apiKey = akm.createAPIKey('user123', ['read', 'write']);
console.log('API Key:', apiKey);
// "sk_9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
```

### Application 3: Password Reset Token

```javascript
class PasswordResetManager {
  generateResetToken(email) {
    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');

    // Hash token for storage (don't store plain token)
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Store hashed version
    this.resetTokens.set(tokenHash, {
      email,
      expiresAt: Date.now() + 3600000 // 1 hour
    });

    // Return plain token (send to user via email)
    return token;
  }

  validateResetToken(token) {
    // Hash received token
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Check if exists and not expired
    const reset = this.resetTokens.get(tokenHash);
    if (!reset) return null;
    if (reset.expiresAt < Date.now()) return null;

    return reset.email;
  }
}

// Usage
const prm = new PasswordResetManager();

// User requests reset
const token = prm.generateResetToken('user@example.com');
console.log('Reset token:', token);
// Send this token via email

// User clicks link with token
const email = prm.validateResetToken(token);
if (email) {
  console.log('Valid reset for:', email);
  // Allow password reset
}
```

### Application 4: CSRF Token Generator

```javascript
class CSRFProtection {
  generateToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  createToken(sessionId) {
    const token = this.generateToken();

    // Associate with session
    this.tokens.set(sessionId, {
      token,
      createdAt: Date.now()
    });

    return token;
  }

  validateToken(sessionId, token) {
    const stored = this.tokens.get(sessionId);
    if (!stored) return false;
    if (stored.token !== token) return false;

    // Token can only be used once
    this.tokens.delete(sessionId);
    return true;
  }
}

// Usage in web framework
app.get('/form', (req, res) => {
  const csrfToken = csrf.createToken(req.sessionID);
  res.render('form', { csrfToken });
});

app.post('/submit', (req, res) => {
  if (!csrf.validateToken(req.sessionID, req.body.csrfToken)) {
    return res.status(403).send('Invalid CSRF token');
  }
  // Process form
});
```

### Application 5: Encryption Key Generation

```javascript
class KeyGenerator {
  // AES-256 key (32 bytes)
  generateAESKey() {
    return crypto.randomBytes(32);
  }

  // Initialization Vector (16 bytes)
  generateIV() {
    return crypto.randomBytes(16);
  }

  // Generate key and IV together
  generateEncryptionParams() {
    return {
      key: this.generateAESKey(),
      iv: this.generateIV()
    };
  }
}

// Usage
const kg = new KeyGenerator();
const { key, iv } = kg.generateEncryptionParams();

console.log('Key:', key.toString('hex'));
console.log('IV:', iv.toString('hex'));

// Use for encryption
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
```

---

## Common Patterns

### Pattern 1: Random String Generator

```javascript
function randomString(length, encoding = 'hex') {
  const bytes = Math.ceil(length / 2);
  return crypto.randomBytes(bytes).toString(encoding).slice(0, length);
}

// Usage
console.log(randomString(16)); // 16-char hex string
console.log(randomString(20, 'base64')); // 20-char base64 string
```

### Pattern 2: Random Element Selection

```javascript
function randomElement(array) {
  const index = crypto.randomInt(array.length);
  return array[index];
}

// Usage
const colors = ['red', 'blue', 'green'];
console.log(randomElement(colors));
```

### Pattern 3: Weighted Random Selection

```javascript
function weightedRandom(items, weights) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let random = crypto.randomInt(total);

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random < 0) return items[i];
  }

  return items[items.length - 1];
}

// Usage
const outcomes = ['common', 'rare', 'legendary'];
const weights = [70, 25, 5]; // 70%, 25%, 5%
console.log(weightedRandom(outcomes, weights));
```

### Pattern 4: Unique ID Generator

```javascript
class IDGenerator {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  generate() {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `${this.prefix}${timestamp}_${random}`;
  }
}

// Usage
const idGen = new IDGenerator('user_');
console.log(idGen.generate()); // "user_l5x8k9_9f86d081884c7d65"
```

---

## Security Implications

### Critical: Always Use Crypto Random for Security

```javascript
// ❌ VULNERABLE - Predictable
const sessionToken = Math.random().toString(36).substring(2);
// Attacker can predict next tokens

// ✅ SECURE - Unpredictable
const sessionToken = crypto.randomBytes(32).toString('hex');
// Impossible to predict
```

### Entropy and Randomness Quality

```
Low Entropy (Bad):
- Sequential numbers: 1, 2, 3, 4...
- Timestamps: 1699564800000
- Simple patterns: abcabc123123

High Entropy (Good):
- crypto.randomBytes(): <Buffer 9f 86 d0 81 88 4c...>
- Truly random
- No patterns
```

### Token Size Matters

```javascript
// ❌ TOO SHORT - 4 bytes (32 bits)
const weak = crypto.randomBytes(4).toString('hex');
// 2^32 = 4.3 billion possibilities
// Can be brute-forced

// ✅ GOOD - 16 bytes (128 bits)
const moderate = crypto.randomBytes(16).toString('hex');
// 2^128 possibilities
// Secure for most uses

// ✅ BETTER - 32 bytes (256 bits)
const strong = crypto.randomBytes(32).toString('hex');
// 2^256 possibilities
// Maximum security
```

### Avoid These Mistakes

```javascript
// ❌ Don't use weak randomness
const bad1 = String(Math.random());
const bad2 = Date.now().toString();
const bad3 = userId + timestamp;

// ❌ Don't truncate too much
const weak = crypto.randomBytes(32).toString('hex').slice(0, 8);
// Only 8 characters! Defeats purpose

// ✅ Use full crypto random
const good = crypto.randomBytes(32).toString('hex');
```

---

## Best Practices

### ✅ DO: Use Appropriate Size

```javascript
// ✅ Session tokens - 32 bytes
const sessionToken = crypto.randomBytes(32).toString('hex');

// ✅ CSRF tokens - 16 bytes
const csrfToken = crypto.randomBytes(16).toString('hex');

// ✅ Encryption keys - Match algorithm
const aes256Key = crypto.randomBytes(32); // 256 bits
```

### ✅ DO: Use Proper Encoding

```javascript
// ✅ Hex - Most common
const hex = crypto.randomBytes(16).toString('hex');

// ✅ Base64 - Shorter
const base64 = crypto.randomBytes(16).toString('base64');

// ✅ Base64 URL-safe
const urlSafe = crypto.randomBytes(16)
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');
```

### ✅ DO: Handle Errors

```javascript
// ✅ Async with error handling
crypto.randomBytes(32, (err, buffer) => {
  if (err) {
    console.error('Failed to generate random bytes:', err);
    return;
  }
  const token = buffer.toString('hex');
  // Use token
});
```

### ❌ DON'T: Use for Non-Security Purposes

```javascript
// ❌ Overkill for game randomness
const diceRoll = crypto.randomInt(1, 7);

// ✅ Math.random() is fine for games
const diceRoll = Math.floor(Math.random() * 6) + 1;
```

---

## Summary

### Key Takeaways

1. **Always use crypto module** for security-related randomness
2. **Never use Math.random()** for tokens, keys, or security
3. **Use appropriate sizes**: 16-32 bytes for most tokens
4. **Three main methods**:
   - `randomBytes()` - General purpose random data
   - `randomUUID()` - Standard UUID format
   - `randomInt()` - Random integers

### Quick Reference

```javascript
// Random bytes (most versatile)
const token = crypto.randomBytes(32).toString('hex');

// UUID (standard format)
const id = crypto.randomUUID();

// Random integer
const num = crypto.randomInt(100); // 0-99
const num2 = crypto.randomInt(10, 100); // 10-99
```

### Common Use Cases

| Use Case | Method | Size |
|----------|--------|------|
| Session tokens | `randomBytes()` | 32 bytes |
| API keys | `randomBytes()` | 32 bytes |
| Database IDs | `randomUUID()` | - |
| Password reset | `randomBytes()` | 32 bytes |
| CSRF tokens | `randomBytes()` | 16 bytes |
| OTP codes | `randomInt()` | 6 digits |
| Encryption keys | `randomBytes()` | Key size |
| IVs | `randomBytes()` | 16 bytes |

### Next Steps

- **[HMAC Authentication](./04-hmac-authentication.md)** - Use random data in HMAC
- **[Password Hashing](./05-password-hashing.md)** - Generate salts with random data
- **[Basic Encryption](./06-basic-encryption.md)** - Generate keys and IVs
- Review [CONCEPTS.md](../../CONCEPTS.md) for more on random number generation

---

**Remember**: Cryptographic randomness is essential for security. When in doubt, use `crypto.randomBytes()` instead of `Math.random()`.
