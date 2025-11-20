# Hash Functions Explained

A comprehensive guide to understanding and using cryptographic hash functions in Node.js.

## Table of Contents
- [What is a Hash Function?](#what-is-a-hash-function)
- [How Hashing Works](#how-hashing-works)
- [Properties of Hash Functions](#properties-of-hash-functions)
- [Hash Algorithms](#hash-algorithms)
- [Using crypto.createHash()](#using-cryptocreatehash)
- [Practical Use Cases](#practical-use-cases)
- [Hash Comparison and Verification](#hash-comparison-and-verification)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)
- [Summary](#summary)

---

## What is a Hash Function?

A **hash function** is a mathematical algorithm that converts data of any size into a fixed-size string of bytes. Think of it as a digital fingerprint.

### Simple Analogy

```
Book (500 pages) → Hash Function → "abc123def456" (12 characters)
Article (2 pages) → Hash Function → "xyz789ghi012" (12 characters)
```

No matter the input size, the output (hash) is always the same length.

### Visual Representation

```
Input (Variable Length)           Output (Fixed Length)
┌──────────────────┐             ┌──────────────┐
│ "Hello"          │             │              │
│                  │  → Hash →   │  "2cf24dba5" │
│                  │             │              │
└──────────────────┘             └──────────────┘

┌──────────────────┐             ┌──────────────┐
│ "Hello World!"   │             │              │
│ "Lorem ipsum..." │  → Hash →   │  "7f83b1657" │
│ (1000 lines)     │             │              │
└──────────────────┘             └──────────────┘
```

---

## How Hashing Works

### The Hash Process

```javascript
const crypto = require('crypto');

// Step 1: Create hash object
const hash = crypto.createHash('sha256');

// Step 2: Add data to hash
hash.update('Hello World');

// Step 3: Generate final hash
const digest = hash.digest('hex');

console.log(digest);
// Output: '64ec88ca00b268e5ba1a35678a1b5316d212f4f366b2477232534a8aeca37f3c'
```

### Step-by-Step Breakdown

```
1. Create Hash Object
   crypto.createHash('sha256')
   ↓
   [Hash Object Ready]

2. Feed Data (can be called multiple times)
   hash.update('Hello')
   hash.update(' ')
   hash.update('World')
   ↓
   [Internal State Updated]

3. Finalize and Get Result
   hash.digest('hex')
   ↓
   Final Hash: '64ec88ca...'
```

### Multiple Updates

You can add data in chunks:

```javascript
const hash = crypto.createHash('sha256');

// These produce the same result:
hash.update('Hello World');

// Same as:
const hash2 = crypto.createHash('sha256');
hash2.update('Hello');
hash2.update(' ');
hash2.update('World');

console.log(hash.digest('hex') === hash2.digest('hex')); // true
```

---

## Properties of Hash Functions

A good cryptographic hash function has five key properties:

### 1. Deterministic

Same input always produces same output:

```javascript
const hash1 = crypto.createHash('sha256').update('Hello').digest('hex');
const hash2 = crypto.createHash('sha256').update('Hello').digest('hex');

console.log(hash1 === hash2); // Always true
```

### 2. Quick to Compute

Hash functions are designed to be fast:

```javascript
console.time('hash');
for (let i = 0; i < 100000; i++) {
  crypto.createHash('sha256').update('data').digest('hex');
}
console.timeEnd('hash');
// Typically < 100ms for 100,000 hashes
```

### 3. One-Way (Irreversible)

Cannot reverse a hash to get original input:

```
Input: "password"
   ↓
Hash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
   ↓
Reverse: ??? IMPOSSIBLE ???
```

```javascript
const hash = crypto.createHash('sha256').update('password').digest('hex');
// Cannot reverse hash to get "password" back
// This is by design!
```

### 4. Avalanche Effect

Small change in input = completely different hash:

```javascript
const hash1 = crypto.createHash('sha256').update('Hello').digest('hex');
const hash2 = crypto.createHash('sha256').update('Hello!').digest('hex');

console.log(hash1);
// 185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969

console.log(hash2);
// 334d016f755cd6dc58c53a86e183882f8ec14f52fb05345887c8a5edd42c87b7

// Completely different! (Just added one character)
```

**Visualization:**
```
"Hello"  → "185f8db3..."
"Hello!" → "334d016f..." ← Completely different
         ↑
    One character changed
```

### 5. Collision Resistant

Extremely difficult to find two different inputs with same hash:

```javascript
// Finding two inputs that produce the same SHA-256 hash
// would take approximately 2^256 attempts
// = 115,792,089,237,316,195,423,570,985,008,687,907,853,269,984,665,640,564,039,457,584,007,913,129,639,936 attempts
// = More atoms than in the observable universe!

// Practically impossible with modern algorithms
```

---

## Hash Algorithms

### Available Algorithms

Node.js supports many hash algorithms:

```javascript
// Get list of available algorithms
console.log(crypto.getHashes());
// ['sha1', 'sha256', 'sha512', 'md5', 'blake2b512', ...]
```

### Algorithm Comparison

| Algorithm | Output Size | Security | Speed | Recommendation |
|-----------|-------------|----------|-------|----------------|
| **MD5** | 128 bits | ❌ Broken | Very Fast | Never use for security |
| **SHA-1** | 160 bits | ❌ Broken | Fast | Legacy only, not secure |
| **SHA-256** | 256 bits | ✅ Secure | Fast | **Recommended** |
| **SHA-512** | 512 bits | ✅ Secure | Fast | High security needs |
| **SHA3-256** | 256 bits | ✅ Secure | Moderate | Modern alternative |
| **BLAKE2b** | Variable | ✅ Secure | Very Fast | Modern, efficient |

### Algorithm Examples

```javascript
const data = 'Hello World';

// MD5 (DO NOT USE for security!)
const md5 = crypto.createHash('md5').update(data).digest('hex');
console.log('MD5:', md5);
// b10a8db164e0754105b7a99be72e3fe5

// SHA-256 (Recommended)
const sha256 = crypto.createHash('sha256').update(data).digest('hex');
console.log('SHA-256:', sha256);
// 64ec88ca00b268e5ba1a35678a1b5316d212f4f366b2477232534a8aeca37f3c

// SHA-512 (More secure, larger output)
const sha512 = crypto.createHash('sha512').update(data).digest('hex');
console.log('SHA-512:', sha512);
// 2c74fd17edafd80e8447b0d46741ee243b7eb74dd2149a0ab1b9246fb30382f27e853d8585719e0e67cbda0daa8f51671064615d645ae27acb15bfb1447f459b
```

### Security Status

```
Timeline of Security:

1990s: MD5 is standard
       ↓
2004:  MD5 broken ❌
       ↓
2017:  SHA-1 broken ❌
       ↓
2024:  SHA-2 (SHA-256, SHA-512) still secure ✅
       SHA-3 available as modern alternative ✅
```

---

## Using crypto.createHash()

### Basic Syntax

```javascript
crypto.createHash(algorithm[, options])
```

### Method Chaining

```javascript
// Method 1: Separate calls
const hash = crypto.createHash('sha256');
hash.update('Hello');
const result = hash.digest('hex');

// Method 2: Chaining (more concise)
const result = crypto
  .createHash('sha256')
  .update('Hello')
  .digest('hex');
```

### Output Formats

```javascript
const data = 'Hello World';

// Hexadecimal (most common)
const hex = crypto.createHash('sha256').update(data).digest('hex');
console.log('Hex:', hex);
// 64ec88ca00b268e5ba1a35678a1b5316d212f4f366b2477232534a8aeca37f3c

// Base64
const base64 = crypto.createHash('sha256').update(data).digest('base64');
console.log('Base64:', base64);
// ZOyIygCyaOW6GjVnihswljaLD2QG6LdHMiU0qMrKN/M=

// Binary (Buffer)
const buffer = crypto.createHash('sha256').update(data).digest();
console.log('Buffer:', buffer);
// <Buffer 64 ec 88 ca 00 b2 68 e5 ba 1a 35 67 8a 1b 53 16 ...>

// Binary length
console.log('Length:', buffer.length); // 32 bytes (256 bits)
```

### Working with Different Input Types

```javascript
// String input (default UTF-8)
const hash1 = crypto.createHash('sha256').update('Hello').digest('hex');

// String with encoding
const hash2 = crypto.createHash('sha256').update('Hello', 'utf8').digest('hex');

// Buffer input
const buffer = Buffer.from('Hello');
const hash3 = crypto.createHash('sha256').update(buffer).digest('hex');

// All produce same result
console.log(hash1 === hash2 && hash2 === hash3); // true
```

---

## Practical Use Cases

### Use Case 1: File Integrity Verification

```javascript
const fs = require('fs');
const crypto = require('crypto');

function calculateFileHash(filepath) {
  const fileBuffer = fs.readFileSync(filepath);
  const hash = crypto.createHash('sha256');
  hash.update(fileBuffer);
  return hash.digest('hex');
}

// Usage
const hash = calculateFileHash('./document.pdf');
console.log('File hash:', hash);

// Verify later
const currentHash = calculateFileHash('./document.pdf');
if (hash === currentHash) {
  console.log('✅ File is intact');
} else {
  console.log('⚠️ File has been modified');
}
```

### Use Case 2: Streaming Large Files

For large files, use streams to avoid memory issues:

```javascript
function calculateFileHashStream(filepath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filepath);

    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Usage
calculateFileHashStream('./large-video.mp4')
  .then(hash => console.log('Hash:', hash))
  .catch(err => console.error('Error:', err));
```

### Use Case 3: Data Deduplication

```javascript
class FileStorage {
  constructor() {
    this.files = new Map(); // hash -> content
  }

  store(content) {
    // Calculate hash
    const hash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');

    // Check if already stored
    if (this.files.has(hash)) {
      console.log('File already exists (deduplicated)');
      return hash;
    }

    // Store new file
    this.files.set(hash, content);
    console.log('New file stored');
    return hash;
  }

  retrieve(hash) {
    return this.files.get(hash);
  }
}

// Usage
const storage = new FileStorage();

const hash1 = storage.store('Same content');
const hash2 = storage.store('Same content');
// Second call detects duplicate (same hash)

console.log(hash1 === hash2); // true
```

### Use Case 4: Cache Keys

```javascript
class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  generateKey(params) {
    // Create deterministic key from parameters
    const data = JSON.stringify(params);
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  get(params) {
    const key = this.generateKey(params);
    return this.cache.get(key);
  }

  set(params, value) {
    const key = this.generateKey(params);
    this.cache.set(key, value);
  }
}

// Usage
const cache = new CacheManager();

cache.set({ user: 'alice', page: 1 }, 'data1');
const result = cache.get({ user: 'alice', page: 1 });
console.log(result); // 'data1'
```

### Use Case 5: Content Addressing

```javascript
class ContentStore {
  constructor() {
    this.content = new Map();
  }

  add(data) {
    const address = crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');

    this.content.set(address, data);
    return address; // Return content address
  }

  get(address) {
    const data = this.content.get(address);

    // Verify integrity
    const actualAddress = crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');

    if (actualAddress !== address) {
      throw new Error('Content corrupted!');
    }

    return data;
  }
}

// Usage
const store = new ContentStore();
const address = store.add('Important data');
console.log('Address:', address);

const retrieved = store.get(address);
console.log('Retrieved:', retrieved);
```

---

## Hash Comparison and Verification

### Simple Comparison

```javascript
const hash1 = crypto.createHash('sha256').update('data').digest('hex');
const hash2 = crypto.createHash('sha256').update('data').digest('hex');

if (hash1 === hash2) {
  console.log('Hashes match ✅');
}
```

### Timing-Safe Comparison

For security-critical comparisons, use constant-time comparison:

```javascript
function secureCompare(hash1, hash2) {
  // Convert to buffers
  const buf1 = Buffer.from(hash1, 'hex');
  const buf2 = Buffer.from(hash2, 'hex');

  // Use timing-safe comparison
  return crypto.timingSafeEqual(buf1, buf2);
}

// Usage
const hash1 = crypto.createHash('sha256').update('data').digest('hex');
const hash2 = crypto.createHash('sha256').update('data').digest('hex');

if (secureCompare(hash1, hash2)) {
  console.log('Hashes match ✅');
}
```

**Why timing-safe?**
```
Normal comparison: a === b
- Returns false as soon as first different character found
- Time varies based on where difference is
- Attacker can measure time to guess characters

Timing-safe comparison: crypto.timingSafeEqual()
- Always checks all characters
- Time is constant regardless of differences
- Prevents timing attacks
```

---

## Common Patterns

### Pattern 1: Hash Helper Function

```javascript
function hash(data, algorithm = 'sha256', encoding = 'hex') {
  return crypto
    .createHash(algorithm)
    .update(data)
    .digest(encoding);
}

// Usage
console.log(hash('Hello'));
console.log(hash('Hello', 'sha512'));
console.log(hash('Hello', 'sha256', 'base64'));
```

### Pattern 2: Verify Data Integrity

```javascript
class DataWithHash {
  constructor(data) {
    this.data = data;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(this.data))
      .digest('hex');
  }

  verify() {
    const currentHash = this.calculateHash();
    return currentHash === this.hash;
  }
}

// Usage
const obj = new DataWithHash({ name: 'Alice', age: 30 });
console.log('Valid:', obj.verify()); // true

obj.data.age = 31; // Modify data
console.log('Valid:', obj.verify()); // false (hash doesn't match)
```

### Pattern 3: Checksum Generation

```javascript
function generateChecksum(files) {
  const checksums = {};

  files.forEach(filepath => {
    const content = fs.readFileSync(filepath);
    const checksum = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');

    checksums[filepath] = checksum;
  });

  return checksums;
}

function verifyChecksums(files, checksums) {
  const errors = [];

  files.forEach(filepath => {
    const content = fs.readFileSync(filepath);
    const currentChecksum = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');

    if (currentChecksum !== checksums[filepath]) {
      errors.push(filepath);
    }
  });

  return errors;
}

// Usage
const files = ['file1.txt', 'file2.txt', 'file3.txt'];
const checksums = generateChecksum(files);

// Later verify
const corrupted = verifyChecksums(files, checksums);
if (corrupted.length === 0) {
  console.log('✅ All files verified');
} else {
  console.log('⚠️ Corrupted files:', corrupted);
}
```

---

## Best Practices

### ✅ DO: Use Strong Algorithms

```javascript
// ✅ Good
const hash = crypto.createHash('sha256').update(data).digest('hex');

// ✅ Better (more secure)
const hash = crypto.createHash('sha512').update(data).digest('hex');

// ❌ Bad (broken algorithm)
const hash = crypto.createHash('md5').update(data).digest('hex');
```

### ✅ DO: Hash Entire Data

```javascript
// ✅ Correct
const hash = crypto.createHash('sha256')
  .update(JSON.stringify(data))
  .digest('hex');

// ❌ Wrong (incomplete)
const hash = crypto.createHash('sha256')
  .update(data.username)
  .digest('hex');
// Missing other fields!
```

### ✅ DO: Use Appropriate Encoding

```javascript
// ✅ Hex - Most common, readable
const hex = hash.digest('hex');

// ✅ Base64 - Shorter, still readable
const base64 = hash.digest('base64');

// ✅ Buffer - For binary operations
const buffer = hash.digest();
```

### ❌ DON'T: Reuse Hash Object

```javascript
// ❌ Wrong - Hash object is consumed
const hash = crypto.createHash('sha256');
const digest1 = hash.update('data1').digest('hex');
const digest2 = hash.update('data2').digest('hex'); // Error!

// ✅ Correct - Create new hash object
const hash1 = crypto.createHash('sha256').update('data1').digest('hex');
const hash2 = crypto.createHash('sha256').update('data2').digest('hex');
```

### ❌ DON'T: Use for Password Storage

```javascript
// ❌ WRONG - Simple hash for passwords
const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
// Vulnerable to rainbow table attacks!

// ✅ CORRECT - Use password hashing (next guide)
crypto.pbkdf2(password, salt, 100000, 64, 'sha512', callback);
```

---

## Summary

### Key Takeaways

1. **Hash functions** create fixed-size fingerprints of data
2. **Properties**: Deterministic, fast, one-way, avalanche effect, collision-resistant
3. **Use SHA-256 or SHA-512** - avoid MD5 and SHA-1
4. **Common uses**: File integrity, deduplication, cache keys, checksums

### Quick Reference

```javascript
// Basic hashing
const hash = crypto.createHash('sha256').update('data').digest('hex');

// File hashing
const fileHash = crypto
  .createHash('sha256')
  .update(fs.readFileSync('file.txt'))
  .digest('hex');

// Multiple updates
const hash = crypto.createHash('sha256');
hash.update('part1');
hash.update('part2');
const result = hash.digest('hex');

// Available algorithms
console.log(crypto.getHashes());
```

### When to Use Hashing

✅ File integrity verification
✅ Data deduplication
✅ Content addressing
✅ Cache keys
✅ Checksums

❌ Password storage (use PBKDF2 instead)
❌ Encryption (use ciphers instead)
❌ Message authentication (use HMAC instead)

### Next Steps

- **[Random Generation](./03-random-generation.md)** - Generate cryptographically secure random data
- **[HMAC Authentication](./04-hmac-authentication.md)** - Authenticate messages with keyed hashing
- Review the [CONCEPTS.md](../../CONCEPTS.md) for deeper understanding of hash functions

---

**Remember**: Hashing is a one-way operation. Once data is hashed, you cannot reverse it to get the original data. This makes it perfect for integrity checking but unsuitable for encryption.
