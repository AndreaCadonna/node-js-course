# HMAC and Message Authentication

Understanding Hash-based Message Authentication Code (HMAC) for verifying message authenticity and integrity.

## Table of Contents
- [What is HMAC?](#what-is-hmac)
- [Why HMAC Matters](#why-hmac-matters)
- [HMAC vs Simple Hashing](#hmac-vs-simple-hashing)
- [How HMAC Works](#how-hmac-works)
- [Using crypto.createHmac()](#using-cryptocreatehmac)
- [Verifying HMAC Signatures](#verifying-hmac-signatures)
- [Practical Applications](#practical-applications)
- [Common Patterns](#common-patterns)
- [Security Considerations](#security-considerations)
- [Best Practices](#best-practices)
- [Summary](#summary)

---

## What is HMAC?

**HMAC** (Hash-based Message Authentication Code) is a cryptographic technique that combines a secret key with a message to produce a signature. This signature proves:

1. **Authenticity**: Message came from someone with the secret key
2. **Integrity**: Message hasn't been modified

### Simple Analogy

Think of HMAC like a wax seal on a letter:

```
Medieval Times:
Message + King's Seal → Sealed Letter
Recipients can verify it's from the king

Modern Times:
Message + Secret Key → HMAC Signature
Recipients can verify it's from someone with the key
```

### Visual Representation

```
┌──────────────┐     ┌────────────┐
│   Message    │     │ Secret Key │
│ "Hello Bob"  │     │  "abc123"  │
└──────┬───────┘     └──────┬─────┘
       │                    │
       └────────┬───────────┘
                │
           ╔════▼═══╗
           ║  HMAC  ║
           ║Function║
           ╚════╤═══╝
                │
        ┌───────▼────────┐
        │   Signature    │
        │  "9f86d081..." │
        └────────────────┘
```

---

## Why HMAC Matters

### The Problem: Unverified Messages

```javascript
// Client sends request
const request = {
  action: 'transfer',
  amount: 100,
  to: 'bob'
};

// ❌ Problem: Attacker can modify
request.amount = 10000; // Changed from 100!
request.to = 'attacker'; // Changed from bob!

// Server has no way to detect tampering
```

### The Solution: HMAC Signature

```javascript
// Client creates signature
const signature = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(JSON.stringify(request))
  .digest('hex');

// Send: { request, signature }

// Server verifies signature
const expectedSignature = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(JSON.stringify(request))
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Message has been tampered with!');
}
```

### Real-World Example: API Security

```
Without HMAC:
Client → Request → Server
              ↑
         Attacker can modify

With HMAC:
Client → Request + Signature → Server
              ↑                    ↓
         Attacker modifies    Verification fails!
```

---

## HMAC vs Simple Hashing

### Simple Hash (No Security)

```javascript
// ❌ Simple hash - No authentication
const hash = crypto
  .createHash('sha256')
  .update('message')
  .digest('hex');

// Problem: Anyone can compute this hash
// Attacker can modify message and recalculate hash
```

### HMAC (With Security)

```javascript
// ✅ HMAC - Requires secret key
const hmac = crypto
  .createHmac('sha256', 'secret-key')
  .update('message')
  .digest('hex');

// Only someone with the secret key can generate valid signature
```

### Comparison Table

```
╔════════════════╦═══════════════╦══════════════════╗
║                ║ Simple Hash   ║ HMAC             ║
╠════════════════╬═══════════════╬══════════════════╣
║ Needs Key?     ║ No            ║ Yes              ║
║ Authentication ║ No            ║ Yes              ║
║ Integrity      ║ Yes           ║ Yes              ║
║ Tampering      ║ Vulnerable    ║ Protected        ║
║ Use Case       ║ Data verify   ║ Message verify   ║
╚════════════════╩═══════════════╩══════════════════╝
```

### Example Attack Prevention

```javascript
// Scenario: API request
const message = 'transfer $100 to Bob';

// ❌ Simple hash - Vulnerable
const hash = crypto.createHash('sha256').update(message).digest('hex');
// Attacker can:
// 1. Modify: 'transfer $10000 to Attacker'
// 2. Calculate new hash
// 3. Server accepts (no way to verify)

// ✅ HMAC - Protected
const hmac = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(message)
  .digest('hex');
// Attacker can:
// 1. Modify message
// 2. Cannot generate valid signature (no key)
// 3. Server rejects (signature doesn't match)
```

---

## How HMAC Works

### The HMAC Algorithm

```
Step 1: Prepare Key
   Key → Padding → Key Block

Step 2: Inner Hash
   (Key Block ⊕ ipad) || Message → Hash → Inner Hash

Step 3: Outer Hash
   (Key Block ⊕ opad) || Inner Hash → Hash → HMAC
```

### Simplified Flow

```javascript
// What happens inside HMAC:
function hmac(key, message) {
  // 1. Key preparation
  const keyBlock = prepareKey(key);

  // 2. Inner hash
  const innerHash = hash((keyBlock ^ ipad) + message);

  // 3. Outer hash
  const hmac = hash((keyBlock ^ opad) + innerHash);

  return hmac;
}

// You don't need to implement this - crypto.createHmac() does it!
```

### Visual Diagram

```
Message: "Hello"
Key: "secret"
                    ┌─────────────┐
                    │    Key      │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Padding   │
                    └──────┬──────┘
         ┌─────────────────┴─────────────────┐
         │                                   │
    ┌────▼────┐                         ┌────▼────┐
    │ XOR ipad│                         │ XOR opad│
    └────┬────┘                         └────┬────┘
         │                                   │
    ┌────▼────────┐                         │
    │ + "Hello"   │                         │
    └────┬────────┘                         │
         │                                   │
    ┌────▼────┐                              │
    │  Hash   │                              │
    └────┬────┘                              │
         │                                   │
         └───────────────┬───────────────────┘
                         │
                    ┌────▼────┐
                    │  Hash   │
                    └────┬────┘
                         │
                    ┌────▼─────┐
                    │   HMAC   │
                    └──────────┘
```

---

## Using crypto.createHmac()

### Basic Syntax

```javascript
const crypto = require('crypto');

// Create HMAC
const hmac = crypto.createHmac(algorithm, key);
hmac.update(data);
const signature = hmac.digest(encoding);
```

### Simple Example

```javascript
// Create HMAC with SHA-256
const hmac = crypto.createHmac('sha256', 'my-secret-key');
hmac.update('Hello World');
const signature = hmac.digest('hex');

console.log(signature);
// '88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b'
```

### Method Chaining

```javascript
// More concise
const signature = crypto
  .createHmac('sha256', 'my-secret-key')
  .update('Hello World')
  .digest('hex');
```

### Multiple Updates

```javascript
// Can update multiple times
const hmac = crypto.createHmac('sha256', 'secret');
hmac.update('Part 1');
hmac.update('Part 2');
hmac.update('Part 3');
const signature = hmac.digest('hex');

// Same as single update
const signature2 = crypto
  .createHmac('sha256', 'secret')
  .update('Part 1Part 2Part 3')
  .digest('hex');

console.log(signature === signature2); // true
```

### Different Algorithms

```javascript
const message = 'Important message';
const key = 'secret-key';

// SHA-256 (most common)
const hmacSHA256 = crypto
  .createHmac('sha256', key)
  .update(message)
  .digest('hex');

// SHA-512 (more secure)
const hmacSHA512 = crypto
  .createHmac('sha512', key)
  .update(message)
  .digest('hex');

// SHA-1 (legacy, avoid for new projects)
const hmacSHA1 = crypto
  .createHmac('sha1', key)
  .update(message)
  .digest('hex');

console.log('SHA-256:', hmacSHA256);
console.log('SHA-512:', hmacSHA512);
console.log('SHA-1:', hmacSHA1);
```

### Output Formats

```javascript
const message = 'Hello';
const key = 'secret';

// Hexadecimal
const hex = crypto
  .createHmac('sha256', key)
  .update(message)
  .digest('hex');
console.log('Hex:', hex);

// Base64
const base64 = crypto
  .createHmac('sha256', key)
  .update(message)
  .digest('base64');
console.log('Base64:', base64);

// Buffer
const buffer = crypto
  .createHmac('sha256', key)
  .update(message)
  .digest();
console.log('Buffer:', buffer);
```

---

## Verifying HMAC Signatures

### Basic Verification

```javascript
function createSignature(message, key) {
  return crypto
    .createHmac('sha256', key)
    .update(message)
    .digest('hex');
}

function verifySignature(message, signature, key) {
  const expectedSignature = createSignature(message, key);
  return signature === expectedSignature;
}

// Usage
const message = 'Transfer $100';
const key = 'shared-secret';

// Sender creates signature
const signature = createSignature(message, key);

// Receiver verifies
if (verifySignature(message, signature, key)) {
  console.log('✅ Signature valid - message authentic');
} else {
  console.log('❌ Signature invalid - message tampered');
}
```

### Timing-Safe Verification

```javascript
function verifySignatureSecure(message, signature, key) {
  const expectedSignature = crypto
    .createHmac('sha256', key)
    .update(message)
    .digest('hex');

  // Convert to buffers for timing-safe comparison
  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expectedSignature, 'hex');

  // Prevent timing attacks
  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

// Usage
const isValid = verifySignatureSecure(message, signature, key);
```

### Why Timing-Safe Matters

```
Regular comparison (===):
"a1b2c3" vs "x1b2c3"
 ↑ Different - return false immediately (fast)

"a1b2c3" vs "a1b2x3"
       ↑ Different - return false later (slower)

Attacker can measure timing differences to guess signature!

Timing-safe comparison:
Always checks all characters regardless of differences
No timing information leaked
```

---

## Practical Applications

### Application 1: API Request Signing

```javascript
class APIClient {
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  signRequest(method, path, body = '') {
    // Create signature payload
    const timestamp = Date.now();
    const payload = `${method}${path}${timestamp}${body}`;

    // Generate signature
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');

    return {
      headers: {
        'X-API-Key': this.apiKey,
        'X-Timestamp': timestamp,
        'X-Signature': signature
      }
    };
  }

  async makeRequest(method, path, body) {
    const { headers } = this.signRequest(method, path, JSON.stringify(body));

    const response = await fetch(`https://api.example.com${path}`, {
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    return response.json();
  }
}

// Server-side verification
function verifyRequest(req, secretKey) {
  const { method, path } = req;
  const timestamp = req.headers['x-timestamp'];
  const signature = req.headers['x-signature'];
  const body = req.body ? JSON.stringify(req.body) : '';

  // Check timestamp (prevent replay attacks)
  const age = Date.now() - parseInt(timestamp);
  if (age > 300000) { // 5 minutes
    throw new Error('Request too old');
  }

  // Verify signature
  const payload = `${method}${path}${timestamp}${body}`;
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new Error('Invalid signature');
  }

  return true;
}
```

### Application 2: Webhook Verification

```javascript
// Webhook sender (e.g., payment provider)
class WebhookSender {
  constructor(secret) {
    this.secret = secret;
  }

  sendWebhook(url, payload) {
    const body = JSON.stringify(payload);

    // Create signature
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(body)
      .digest('hex');

    // Send to customer's endpoint
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature
      },
      body
    });
  }
}

// Webhook receiver (your application)
function verifyWebhook(req, secret) {
  const signature = req.headers['x-webhook-signature'];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new Error('Invalid webhook signature');
  }

  return req.body;
}

// Express.js example
app.post('/webhook', (req, res) => {
  try {
    const payload = verifyWebhook(req, WEBHOOK_SECRET);
    // Process verified webhook
    processPayment(payload);
    res.status(200).send('OK');
  } catch (err) {
    res.status(400).send('Invalid signature');
  }
});
```

### Application 3: Signed Cookies/Tokens

```javascript
class SignedCookie {
  constructor(secret) {
    this.secret = secret;
  }

  sign(value) {
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(value)
      .digest('base64');

    return `${value}.${signature}`;
  }

  verify(signedValue) {
    const [value, signature] = signedValue.split('.');

    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(value)
      .digest('base64');

    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    return value;
  }
}

// Usage
const cookie = new SignedCookie('cookie-secret');

// Set cookie
const userId = '12345';
const signedCookie = cookie.sign(userId);
res.cookie('userId', signedCookie);

// Verify cookie
try {
  const userId = cookie.verify(req.cookies.userId);
  console.log('User ID:', userId);
} catch (err) {
  console.log('Cookie tampered!');
}
```

### Application 4: URL Signing

```javascript
class URLSigner {
  constructor(secret) {
    this.secret = secret;
  }

  signURL(url, expiresIn = 3600000) { // 1 hour default
    const expires = Date.now() + expiresIn;
    const payload = `${url}${expires}`;

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}expires=${expires}&signature=${signature}`;
  }

  verifyURL(url) {
    const urlObj = new URL(url, 'http://dummy');
    const expires = urlObj.searchParams.get('expires');
    const signature = urlObj.searchParams.get('signature');

    // Remove signature from URL for verification
    urlObj.searchParams.delete('signature');
    const urlWithoutSig = urlObj.pathname + urlObj.search;

    // Check expiration
    if (Date.now() > parseInt(expires)) {
      throw new Error('URL expired');
    }

    // Verify signature
    const payload = `${urlWithoutSig}${expires}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    return true;
  }
}

// Usage
const signer = new URLSigner('url-secret');

// Generate signed URL
const signedURL = signer.signURL('/download/file.pdf', 3600000);
console.log('Signed URL:', signedURL);
// /download/file.pdf?expires=1699568400000&signature=9f86d081...

// Verify later
try {
  signer.verifyURL(signedURL);
  // Allow download
} catch (err) {
  // Deny access
}
```

### Application 5: Message Queue Authentication

```javascript
class MessageQueue {
  constructor(secret) {
    this.secret = secret;
    this.queue = [];
  }

  publish(message) {
    const timestamp = Date.now();
    const payload = JSON.stringify({ message, timestamp });

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');

    this.queue.push({
      payload,
      signature
    });
  }

  consume() {
    const item = this.queue.shift();
    if (!item) return null;

    const { payload, signature } = item;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Message tampered!');
    }

    return JSON.parse(payload);
  }
}

// Usage
const queue = new MessageQueue('queue-secret');

// Producer
queue.publish('Task 1');
queue.publish('Task 2');

// Consumer
const msg1 = queue.consume();
console.log('Processing:', msg1.message);
```

---

## Common Patterns

### Pattern 1: HMAC Helper Function

```javascript
function hmac(message, key, algorithm = 'sha256') {
  return crypto
    .createHmac(algorithm, key)
    .update(message)
    .digest('hex');
}

// Usage
const sig = hmac('message', 'key');
const sig2 = hmac('message', 'key', 'sha512');
```

### Pattern 2: Request Signature Class

```javascript
class RequestSigner {
  constructor(secret) {
    this.secret = secret;
  }

  sign(data) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
  }

  verify(data, signature) {
    const expectedSignature = this.sign(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}
```

### Pattern 3: Expiring Signatures

```javascript
function createExpiringSignature(message, key, ttl = 3600000) {
  const expires = Date.now() + ttl;
  const payload = `${message}:${expires}`;
  const signature = crypto
    .createHmac('sha256', key)
    .update(payload)
    .digest('hex');

  return { signature, expires };
}

function verifyExpiringSignature(message, signature, expires, key) {
  if (Date.now() > expires) {
    throw new Error('Signature expired');
  }

  const payload = `${message}:${expires}`;
  const expectedSignature = crypto
    .createHmac('sha256', key)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}
```

---

## Security Considerations

### Key Management

```javascript
// ❌ BAD - Hardcoded key
const SECRET_KEY = 'my-secret-key-123';

// ✅ GOOD - Environment variable
const SECRET_KEY = process.env.HMAC_SECRET;
if (!SECRET_KEY) {
  throw new Error('HMAC_SECRET not configured');
}

// ✅ BETTER - Generate strong key
const SECRET_KEY = crypto.randomBytes(32).toString('hex');
// Store securely (env var, secrets manager, etc.)
```

### Prevent Replay Attacks

```javascript
function verifyWithTimestamp(message, signature, timestamp, key) {
  // Check timestamp is recent (within 5 minutes)
  const age = Date.now() - timestamp;
  if (age > 300000 || age < 0) {
    throw new Error('Request too old or timestamp in future');
  }

  // Include timestamp in signature
  const payload = `${message}:${timestamp}`;
  const expectedSignature = crypto
    .createHmac('sha256', key)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}
```

### Use Strong Algorithms

```javascript
// ✅ Recommended
const hmac = crypto.createHmac('sha256', key); // Good
const hmac = crypto.createHmac('sha512', key); // Better

// ❌ Avoid
const hmac = crypto.createHmac('md5', key);    // Broken
const hmac = crypto.createHmac('sha1', key);   // Weak
```

---

## Best Practices

### ✅ DO: Use Environment Variables for Keys

```javascript
// ✅ Correct
const SECRET_KEY = process.env.HMAC_SECRET_KEY;
```

### ✅ DO: Use Timing-Safe Comparison

```javascript
// ✅ Correct
crypto.timingSafeEqual(Buffer.from(sig1), Buffer.from(sig2));
```

### ✅ DO: Include Context in Signature

```javascript
// ✅ Good - Include purpose/context
const payload = `api:${method}:${path}:${timestamp}:${body}`;
const signature = hmac(payload, key);
```

### ❌ DON'T: Reuse HMAC Object

```javascript
// ❌ Wrong
const hmac = crypto.createHmac('sha256', key);
const sig1 = hmac.update('msg1').digest('hex');
const sig2 = hmac.update('msg2').digest('hex'); // Error!

// ✅ Correct
const sig1 = crypto.createHmac('sha256', key).update('msg1').digest('hex');
const sig2 = crypto.createHmac('sha256', key).update('msg2').digest('hex');
```

---

## Summary

### Key Takeaways

1. **HMAC provides** both authenticity and integrity
2. **Requires secret key** shared between parties
3. **Use SHA-256 or SHA-512** algorithms
4. **Common uses**: API security, webhooks, signed cookies, URL signing
5. **Always use timing-safe comparison** for verification

### Quick Reference

```javascript
// Create HMAC
const signature = crypto
  .createHmac('sha256', 'secret-key')
  .update('message')
  .digest('hex');

// Verify HMAC
const expectedSignature = crypto
  .createHmac('sha256', 'secret-key')
  .update('message')
  .digest('hex');

const isValid = crypto.timingSafeEqual(
  Buffer.from(signature, 'hex'),
  Buffer.from(expectedSignature, 'hex')
);
```

### Next Steps

- **[Password Hashing](./05-password-hashing.md)** - Learn secure password storage
- **[Basic Encryption](./06-basic-encryption.md)** - Protect confidential data
- Review [CONCEPTS.md](../../CONCEPTS.md) for more on message authentication

---

**Remember**: HMAC is for authentication and integrity, not confidentiality. If you need to keep data secret, use encryption instead.
