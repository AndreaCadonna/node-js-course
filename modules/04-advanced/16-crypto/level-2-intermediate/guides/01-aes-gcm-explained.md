# AES-GCM Explained

Understanding authenticated encryption with AES-GCM (Galois/Counter Mode).

## Table of Contents
- [What is AES-GCM?](#what-is-aes-gcm)
- [How GCM Works](#how-gcm-works)
- [GCM vs CBC](#gcm-vs-cbc)
- [Authentication Tags](#authentication-tags)
- [Additional Authenticated Data](#additional-authenticated-data)
- [Best Practices](#best-practices)

---

## What is AES-GCM?

**AES-GCM** (Advanced Encryption Standard - Galois/Counter Mode) is an **authenticated encryption** mode that provides both:
1. **Confidentiality** - Data is encrypted
2. **Authenticity** - Data integrity is verified

```
Traditional encryption:          AES-GCM:
Encrypt → Ciphertext            Encrypt + Authenticate → Ciphertext + Tag
                                ✓ Both in one operation
```

### Key Benefits

✅ Single pass encryption + authentication
✅ Parallel processing (faster)
✅ Detects tampering automatically
✅ Industry standard (TLS 1.3, IPsec)
✅ Hardware acceleration available

---

## How GCM Works

### Components

1. **Plaintext** - Your data
2. **Key** - 128, 192, or 256 bits
3. **IV/Nonce** - Initialization vector (96 bits optimal)
4. **AAD** - Additional Authenticated Data (optional)
5. **Ciphertext** - Encrypted data
6. **Authentication Tag** - 128-bit integrity tag

### Encryption Process

```
Input: Plaintext + Key + IV + AAD
  ↓
Counter Mode (CTR) Encryption
  ↓
Galois Message Authentication
  ↓
Output: Ciphertext + Auth Tag
```

### Why "Counter Mode"?

```javascript
// GCM uses CTR mode internally
Block 1: Encrypt(Key, IV + Counter=1) ⊕ Plaintext[0]
Block 2: Encrypt(Key, IV + Counter=2) ⊕ Plaintext[1]
Block 3: Encrypt(Key, IV + Counter=3) ⊕ Plaintext[2]
```

Benefits:
- Parallel encryption/decryption
- No padding needed
- Fast on modern hardware

---

## GCM vs CBC

### CBC Mode (Older)

```
Encryption + Separate HMAC:
1. Encrypt with AES-CBC → Ciphertext
2. HMAC(Ciphertext) → MAC
3. Send: IV + Ciphertext + MAC

Problems:
❌ Two operations (slower)
❌ Padding oracle attacks possible
❌ Must be done carefully
```

### GCM Mode (Modern)

```
Authenticated Encryption:
1. Encrypt + Authenticate → Ciphertext + Tag
   
Benefits:
✓ One operation (faster)
✓ No padding oracle attacks
✓ Built-in tamper detection
✓ Parallel processing
```

### Comparison Table

| Feature | CBC + HMAC | GCM |
|---------|------------|-----|
| **Operations** | 2 (encrypt, then MAC) | 1 (combined) |
| **Speed** | Slower | Faster |
| **Padding** | Required | Not required |
| **Parallelization** | Sequential | Parallel |
| **Tamper Detection** | Manual | Automatic |
| **Recommended** | Legacy only | ✓ Yes |

---

## Authentication Tags

### What is an Auth Tag?

The authentication tag is a 128-bit value that:
- Proves data hasn't been tampered with
- Verifies the correct key was used
- Authenticates AAD (if provided)

```javascript
// Encryption
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
ciphertext += cipher.final('hex');
const authTag = cipher.getAuthTag(); // ← Must save this!

// Decryption
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher.setAuthTag(authTag); // ← Must set BEFORE updating!
let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
plaintext += decipher.final('utf8'); // Throws if tag invalid
```

### Critical Rules

⚠️ **Auth Tag Must:**
- Be generated after encryption (cipher.final())
- Be set before decryption starts
- Be transmitted with ciphertext
- Never be reused for different data

```javascript
// ❌ WRONG - Setting tag after update
decipher.update(ciphertext, 'hex', 'utf8');
decipher.setAuthTag(authTag); // Too late!

// ✓ CORRECT - Set tag before update
decipher.setAuthTag(authTag);
decipher.update(ciphertext, 'hex', 'utf8');
```

---

## Additional Authenticated Data

### What is AAD?

**AAD** (Additional Authenticated Data) is metadata that:
- Is authenticated but NOT encrypted
- Can be headers, IDs, timestamps
- Must match exactly during decryption

```
Encrypted: Plaintext
Authenticated: Plaintext + AAD
```

### Use Cases

```javascript
// Use Case 1: User Context
const message = 'Transfer $500';
const metadata = JSON.stringify({
  userId: '12345',
  timestamp: Date.now(),
  action: 'transfer'
});

cipher.setAAD(Buffer.from(metadata));
// Metadata is authenticated but readable
```

```javascript
// Use Case 2: Protocol Headers
const packetData = 'Encrypted payload';
const header = 'version:1,type:data,seq:42';

cipher.setAAD(Buffer.from(header));
// Header verified but not encrypted
```

### AAD Benefits

✓ Verify metadata integrity
✓ Metadata stays readable
✓ Prevents protocol confusion
✓ No additional operations needed

---

## Best Practices

### 1. IV/Nonce Management

```javascript
// ✓ CORRECT - Generate new IV each time
function encrypt(data, key) {
  const iv = crypto.randomBytes(12); // 96 bits optimal for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  // ... encrypt ...
  return { ciphertext, iv, authTag };
}

// ❌ WRONG - Reusing IV
const fixedIV = Buffer.from('same-iv-always'); // NEVER DO THIS!
```

**Rules:**
- Generate new random IV for each encryption
- 96 bits (12 bytes) is optimal for GCM
- Must be unique for each (key, plaintext) pair
- Can be public (send with ciphertext)

### 2. Key Management

```javascript
// ✓ Use proper key sizes
const key256 = crypto.randomBytes(32); // AES-256 (recommended)
const key192 = crypto.randomBytes(24); // AES-192 (acceptable)
const key128 = crypto.randomBytes(16); // AES-128 (minimum)
```

### 3. Storage Format

```javascript
// ✓ Store all components together
const encrypted = {
  algorithm: 'aes-256-gcm',
  ciphertext: '...',
  iv: '...',
  authTag: '...',
  aad: '...' // if used
};
```

### 4. Error Handling

```javascript
// ✓ Handle authentication failures
try {
  const plaintext = decryptGCM(encrypted, key);
} catch (err) {
  if (err.message.includes('Unsupported state')) {
    console.log('Authentication failed - data tampered!');
  }
  // Do NOT reveal which specific check failed
}
```

### 5. Never

❌ Reuse IV with same key
❌ Forget to save auth tag
❌ Modify ciphertext
❌ Skip AAD if it was used in encryption
❌ Use GCM without verifying tag

---

## Summary

**Key Takeaways:**

1. **GCM = Encryption + Authentication** in one operation
2. **Auth tags** verify data integrity automatically
3. **AAD** authenticates metadata without encryption
4. **IV must be unique** for each encryption
5. **GCM is preferred** over CBC for new applications
6. **Hardware accelerated** on modern systems
7. **No padding required** unlike CBC
8. **Tamper detection** is automatic

**When to use GCM:**
- ✓ New applications
- ✓ High-performance needs
- ✓ Authenticated encryption required
- ✓ Streaming data
- ✓ Network protocols

**Migration path:**
CBC + HMAC → AES-GCM (recommended upgrade)

---

## Further Reading

- [NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) - GCM Specification
- [RFC 5288](https://tools.ietf.org/html/rfc5288) - AES-GCM for TLS
- Node.js Crypto Documentation

Remember: GCM makes authenticated encryption easy and fast, but only if used correctly!
