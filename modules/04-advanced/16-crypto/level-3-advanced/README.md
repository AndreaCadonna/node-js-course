# Level 3: Advanced Crypto Operations

Master production-ready cryptographic systems, security best practices, and real-world implementations.

## Learning Objectives

By completing this level, you will:

- ✅ Build complete JWT authentication systems
- ✅ Implement end-to-end encryption architectures
- ✅ Master advanced key management strategies
- ✅ Optimize cryptographic performance
- ✅ Understand and prevent security vulnerabilities
- ✅ Implement compliance-ready systems (GDPR, PCI-DSS, HIPAA)
- ✅ Build production-grade security patterns
- ✅ Handle streaming encryption for large datasets

---

## Prerequisites

- **Level 1:** Crypto Basics (Required)
- **Level 2:** Intermediate Crypto Operations (Required)
- Strong understanding of:
  - Hashing, HMAC, and encryption
  - Asymmetric cryptography (RSA, ECDSA)
  - Digital signatures and certificates
  - Key management fundamentals
- Experience with:
  - Production Node.js applications
  - API design and security
  - Database security
  - System architecture

---

## What You'll Learn

### Core Topics

1. **JWT Authentication Systems**
   - Complete JWT implementation from scratch
   - Access and refresh token patterns
   - Token revocation strategies
   - JWT security best practices
   - Claims validation and verification
   - Token rotation and lifecycle management

2. **End-to-End Encryption**
   - E2E encryption architecture
   - Key exchange protocols (Diffie-Hellman)
   - Multi-party encryption systems
   - Forward secrecy implementation
   - Encrypted messaging systems
   - Client-side encryption patterns

3. **Advanced Key Management**
   - Enterprise key storage solutions
   - Key rotation strategies
   - Hardware security modules (HSM)
   - Key derivation hierarchies
   - Secrets management
   - Key recovery and backup

4. **Streaming Cryptography**
   - Encrypting/decrypting large files
   - Stream-based hash computation
   - Chunked encryption patterns
   - Memory-efficient crypto operations
   - Real-time encryption pipelines

5. **Security Vulnerabilities**
   - Common crypto vulnerabilities
   - Timing attacks and prevention
   - Padding oracle attacks
   - Side-channel attacks
   - Crypto API misuse
   - Attack surface reduction

6. **Performance Optimization**
   - Benchmarking crypto operations
   - Caching strategies
   - Async vs sync trade-offs
   - Worker threads for crypto
   - Hardware acceleration
   - Algorithm selection for performance

7. **Compliance Standards**
   - GDPR compliance requirements
   - PCI-DSS security standards
   - HIPAA encryption requirements
   - SOC 2 cryptographic controls
   - Data residency considerations
   - Audit logging and reporting

---

## Time Commitment

**Estimated time**: 4-6 hours

- Reading guides: 90-120 minutes
- Studying examples: 60-90 minutes
- Exercises: 120-180 minutes
- Review and experimentation: 30-60 minutes

---

## Conceptual Guides

Deep-dive guides covering advanced topics:

### Essential Reading

1. **[JWT Deep Dive](guides/01-jwt-deep-dive.md)** (20 min)
   - JWT structure and anatomy
   - Signing algorithms (HS256, RS256, ES256)
   - Claims and validation
   - Security considerations
   - Best practices and anti-patterns

2. **[End-to-End Encryption](guides/02-e2e-encryption.md)** (25 min)
   - E2E encryption principles
   - Key exchange protocols
   - Forward secrecy
   - Multi-device support
   - Implementation patterns

3. **[Security Vulnerabilities](guides/03-security-vulnerabilities.md)** (25 min)
   - Common crypto vulnerabilities
   - Attack vectors and prevention
   - Secure coding practices
   - Penetration testing
   - Security audits

4. **[Performance Optimization](guides/04-performance-optimization.md)** (20 min)
   - Benchmarking techniques
   - Optimization strategies
   - Algorithm trade-offs
   - Caching and memoization
   - Hardware acceleration

5. **[Key Management](guides/05-key-management.md)** (25 min)
   - Enterprise key management
   - Key lifecycle management
   - HSM integration
   - Secrets management tools
   - Key recovery strategies

6. **[Compliance Standards](guides/06-compliance-standards.md)** (20 min)
   - GDPR requirements
   - PCI-DSS standards
   - HIPAA compliance
   - Audit requirements
   - Documentation needs

---

## Key Concepts

### JWT Authentication

```javascript
const jwt = require('jsonwebtoken');

// Generate token
const payload = { userId: '123', role: 'admin' };
const token = jwt.sign(payload, privateKey, {
  algorithm: 'RS256',
  expiresIn: '15m',
  issuer: 'api.example.com'
});

// Verify token
const decoded = jwt.verify(token, publicKey, {
  algorithms: ['RS256'],
  issuer: 'api.example.com'
});
```

### End-to-End Encryption

```javascript
// Client A generates key pair
const { publicKey: pubA, privateKey: privA } =
  crypto.generateKeyPairSync('x25519');

// Client B generates key pair
const { publicKey: pubB, privateKey: privB } =
  crypto.generateKeyPairSync('x25519');

// Both derive same shared secret
const secretA = crypto.diffieHellman({ privateKey: privA, publicKey: pubB });
const secretB = crypto.diffieHellman({ privateKey: privB, publicKey: pubA });
// secretA === secretB - can now encrypt messages
```

### Streaming Encryption

```javascript
const fs = require('fs');
const crypto = require('crypto');

// Encrypt large file without loading into memory
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const readStream = fs.createReadStream('large-file.dat');
const writeStream = fs.createWriteStream('large-file.enc');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

readStream
  .pipe(cipher)
  .pipe(writeStream);
```

### Secure Key Storage

```javascript
class KeyVault {
  constructor(masterPassword) {
    this.masterKey = this.deriveMasterKey(masterPassword);
    this.keys = new Map();
  }

  storeKey(id, key) {
    const encrypted = this.encrypt(key, this.masterKey);
    this.keys.set(id, encrypted);
  }

  retrieveKey(id) {
    const encrypted = this.keys.get(id);
    return this.decrypt(encrypted, this.masterKey);
  }
}
```

---

## Quick Start

### Build a Simple JWT System

```javascript
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Generate RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});

// Sign token
const token = jwt.sign(
  { userId: 1, email: 'user@example.com' },
  privateKey,
  { algorithm: 'RS256', expiresIn: '1h' }
);

// Verify token
try {
  const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  console.log('Valid token:', decoded);
} catch (err) {
  console.log('Invalid token:', err.message);
}
```

### Implement E2E Encryption

```javascript
// Alice and Bob establish shared secret
const alice = crypto.generateKeyPairSync('x25519');
const bob = crypto.generateKeyPairSync('x25519');

const aliceSecret = crypto.diffieHellman({
  privateKey: alice.privateKey,
  publicKey: bob.publicKey
});

// Alice encrypts message
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-gcm', aliceSecret.slice(0, 32), iv);
let encrypted = cipher.update('Secret message', 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag();

// Bob decrypts message
const decipher = crypto.createDecipheriv('aes-256-gcm', aliceSecret.slice(0, 32), iv);
decipher.setAuthTag(authTag);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
```

---

## Common Pitfalls

### ❌ Pitfall 1: Weak JWT Secrets

```javascript
// ❌ WRONG - Weak secret
const token = jwt.sign(payload, 'secret', { algorithm: 'HS256' });

// ✅ CORRECT - Strong secret or asymmetric keys
const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
```

### ❌ Pitfall 2: Not Validating JWT Claims

```javascript
// ❌ WRONG - No validation
const decoded = jwt.verify(token, key);

// ✅ CORRECT - Validate all claims
const decoded = jwt.verify(token, key, {
  algorithms: ['RS256'],
  issuer: 'api.example.com',
  audience: 'web-app',
  maxAge: '1h'
});
```

### ❌ Pitfall 3: Storing Keys Insecurely

```javascript
// ❌ WRONG - Keys in code or environment variables
const API_KEY = 'hardcoded-key-12345';
process.env.ENCRYPTION_KEY = 'stored-in-env';

// ✅ CORRECT - Use key management service
const keyVault = new KeyVault(masterPassword);
const key = await keyVault.getKey('encryption-key');
```

### ❌ Pitfall 4: Ignoring Performance

```javascript
// ❌ WRONG - Sync operations block event loop
app.post('/hash', (req, res) => {
  const hash = crypto.pbkdf2Sync(req.body.password, salt, 100000, 64, 'sha512');
  res.json({ hash });
});

// ✅ CORRECT - Use async operations
app.post('/hash', async (req, res) => {
  const hash = await new Promise((resolve, reject) => {
    crypto.pbkdf2(req.body.password, salt, 100000, 64, 'sha512', (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  res.json({ hash });
});
```

---

## Examples

Explore production-ready examples in the [examples/](./examples/) directory:

1. **[JWT Authentication](examples/01-jwt-authentication.js)** - Complete JWT auth system
2. **[E2E Encryption](examples/02-e2e-encryption.js)** - End-to-end encryption implementation
3. **[Key Management](examples/03-key-management.js)** - Secure key storage and rotation
4. **[Streaming Crypto](examples/04-streaming-crypto.js)** - Encrypt/decrypt large files
5. **[Security Patterns](examples/05-security-patterns.js)** - Advanced security patterns
6. **[Production Systems](examples/06-production-systems.js)** - Real-world production code

---

## Exercises

Test your mastery with these advanced exercises:

### Exercise 1: Complete JWT Authentication System
Build a production-ready authentication system with access/refresh tokens.

**Skills practiced:**
- JWT generation and validation
- Refresh token rotation
- Token revocation
- Security best practices

### Exercise 2: End-to-End Encrypted Chat
Implement a secure messaging system with E2E encryption.

**Skills practiced:**
- Key exchange (Diffie-Hellman)
- Message encryption/decryption
- Forward secrecy
- Multi-device support

### Exercise 3: Secure File Storage System
Create an encrypted file storage system with key management.

**Skills practiced:**
- File encryption at rest
- Key management
- Access control
- Metadata protection

### Exercise 4: API Authentication with HMAC
Build a complete API authentication system using HMAC signatures.

**Skills practiced:**
- Request signing
- Signature verification
- Replay attack prevention
- Rate limiting

### Exercise 5: Secure Key Vault
Implement an enterprise-grade key vault with encryption and access control.

**Skills practiced:**
- Key storage encryption
- Access control
- Audit logging
- Key rotation

---

## Learning Path

### Recommended Sequence

1. **Read Conceptual Guides** (135 minutes)
   - Start with [JWT Deep Dive](guides/01-jwt-deep-dive.md)
   - Read all 6 guides in order
   - Take detailed notes on production patterns

2. **Study Examples** (75 minutes)
   - Understand each production pattern
   - Run and modify examples
   - Experiment with different configurations

3. **Complete Exercises** (150 minutes)
   - Build each system from scratch
   - Focus on security and production-readiness
   - Test edge cases and error conditions

4. **Review Solutions** (30 minutes)
   - Compare with production implementations
   - Note optimization techniques
   - Study alternative approaches

---

## Success Criteria

You've mastered Level 3 when you can:

- [ ] Build complete JWT authentication systems
- [ ] Implement end-to-end encryption
- [ ] Design secure key management strategies
- [ ] Optimize cryptographic performance
- [ ] Identify and prevent security vulnerabilities
- [ ] Implement compliance-ready systems
- [ ] Build production-grade crypto applications
- [ ] Handle streaming encryption for large data
- [ ] Perform security audits
- [ ] Design defense-in-depth architectures

---

## What's Next?

After completing Level 3, you'll be ready for:

### Real-World Projects
- Multi-tenant SaaS security
- Zero-knowledge proof systems
- Blockchain and cryptocurrency
- Secure IoT device communication
- Enterprise identity management
- Compliance automation tools

### Advanced Topics
- Hardware security modules (HSM)
- Threshold cryptography
- Homomorphic encryption
- Post-quantum cryptography
- Secure multi-party computation

---

## Additional Practice

Want more practice? Try these advanced projects:

1. **OAuth2 Provider**
   - Complete authorization server
   - Multiple grant types
   - Token introspection
   - PKCE support

2. **Encrypted Cloud Storage**
   - Client-side encryption
   - Key management
   - File sharing with encryption
   - Zero-knowledge architecture

3. **Secure API Gateway**
   - Request signing
   - Rate limiting
   - API key management
   - Audit logging

4. **Certificate Authority**
   - Certificate generation
   - CRL management
   - OCSP responder
   - Certificate chain validation

---

## Resources

### Official Documentation
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [JWT.io](https://jwt.io/) - JWT debugger and documentation
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [NIST Cryptographic Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)

### Security Standards
- [PCI-DSS v4.0](https://www.pcisecuritystandards.org/)
- [GDPR](https://gdpr.eu/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/)
- [SOC 2](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report.html)

### Tools
- **HashiCorp Vault**: Secrets management
- **AWS KMS**: Key management service
- **OpenSSL**: Crypto toolkit
- **Wireshark**: Network analysis and crypto debugging

---

## Questions or Stuck?

- Re-read the relevant guide with focus on production patterns
- Study the example implementations
- Check the [CONCEPTS.md](../CONCEPTS.md) for theory
- Review security best practices
- Consult OWASP guidelines
- Test in isolated environments first

---

## Security Warning

⚠️ **IMPORTANT**: Level 3 covers production systems. Always:

- Test thoroughly before deploying
- Follow principle of least privilege
- Implement defense in depth
- Keep dependencies updated
- Perform regular security audits
- Have incident response plans
- Never expose sensitive keys or secrets
- Use environment-specific configurations
- Implement comprehensive logging
- Plan for key rotation and recovery

---

## Let's Begin!

Start with **[JWT Deep Dive](guides/01-jwt-deep-dive.md)** and master production-ready cryptographic systems.

Remember: At this level, security is not just about correct implementation - it's about building systems that are robust, performant, compliant, and maintainable in production!
