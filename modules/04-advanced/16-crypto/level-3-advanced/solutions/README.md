# Level 3: Advanced Crypto Operations - Solutions

Complete, production-ready solutions for all Level 3 exercises with detailed explanations and best practices.

## Overview

This directory contains comprehensive solutions demonstrating:

- ✅ Production-ready implementations
- ✅ Security best practices
- ✅ Comprehensive error handling
- ✅ Performance optimization
- ✅ Compliance considerations
- ✅ Complete test coverage
- ✅ Real-world patterns

## Solutions Index

| Exercise | Topic | File | Complexity |
|----------|-------|------|------------|
| 1 | JWT Authentication | [exercise-1-solution.js](./exercise-1-solution.js) | Advanced |
| 2 | E2E Encryption | [exercise-2-solution.js](./exercise-2-solution.js) | Advanced |
| 3 | File Storage | [exercise-3-solution.js](./exercise-3-solution.js) | Advanced |
| 4 | API Authentication | [exercise-4-solution.js](./exercise-4-solution.js) | Advanced |
| 5 | Key Vault | [exercise-5-solution.js](./exercise-5-solution.js) | Expert |

## How to Use Solutions

### 1. Attempt the Exercise First
Try to solve the exercise on your own before looking at the solution. This is crucial for learning.

### 2. Compare Approaches
After completing your solution:
- Compare your approach with the provided solution
- Note differences in implementation
- Understand trade-offs made
- Learn alternative patterns

### 3. Study Best Practices
Each solution demonstrates:
- Security considerations
- Error handling patterns
- Performance optimizations
- Production readiness
- Testing strategies

### 4. Run and Test
```bash
node exercise-1-solution.js
node exercise-2-solution.js
node exercise-3-solution.js
node exercise-4-solution.js
node exercise-5-solution.js
```

## Solution Highlights

### Exercise 1: JWT Authentication

**Key Features:**
- RS256 asymmetric signing
- Access and refresh token patterns
- Token rotation on refresh
- Comprehensive claims validation
- Rate limiting
- Audit logging

**Security Highlights:**
- Timing-safe password comparison
- Secure token revocation
- PBKDF2 password hashing
- Proper error handling
- No sensitive data in tokens

### Exercise 2: E2E Encryption

**Key Features:**
- X25519 key exchange
- AES-GCM authenticated encryption
- Forward secrecy implementation
- Multi-device support
- Session management

**Security Highlights:**
- Ephemeral keys per session
- Perfect forward secrecy
- Message authentication
- Zero-knowledge architecture
- Public key verification

### Exercise 3: Secure File Storage

**Key Features:**
- Per-file encryption keys
- Hierarchical key derivation
- Access control system
- Metadata protection
- Audit trail

**Security Highlights:**
- Master key encryption
- Secure file deletion
- Key rotation support
- Compliance logging
- Access control enforcement

### Exercise 4: API Authentication

**Key Features:**
- HMAC request signing
- Timestamp validation
- Replay attack prevention
- Rate limiting
- API key management

**Security Highlights:**
- Timing-safe signature verification
- Nonce management
- Request throttling
- Comprehensive logging
- Attack detection

### Exercise 5: Key Vault

**Key Features:**
- Encrypted key storage
- Hierarchical keys
- Access control
- Audit logging
- Backup and recovery

**Security Highlights:**
- Master key protection
- Key access logging
- Rotation support
- Secure deletion
- Recovery procedures

## Production Patterns Demonstrated

### 1. Error Handling

```javascript
class SecureError extends Error {
  constructor(message, publicMessage) {
    super(message);
    this.publicMessage = publicMessage; // Safe to expose
    this.name = 'SecureError';
  }

  toPublic() {
    return {
      message: this.publicMessage,
      code: this.code
    };
  }
}
```

### 2. Audit Logging

```javascript
class AuditLogger {
  log(event, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userId: details.userId,
      ipAddress: details.ipAddress
    };

    // Log to secure storage
    this.storage.append(entry);

    // Alert on security events
    if (this.isSecurityEvent(event)) {
      this.alerting.notify(entry);
    }
  }
}
```

### 3. Rate Limiting

```javascript
class AdaptiveRateLimiter {
  constructor() {
    this.attempts = new Map();
    this.blacklist = new Set();
  }

  async checkLimit(identifier) {
    // Check blacklist
    if (this.blacklist.has(identifier)) {
      throw new Error('Rate limit exceeded');
    }

    // Get attempts
    const attempts = this.attempts.get(identifier) || [];

    // Clean old attempts
    const recent = attempts.filter(
      t => Date.now() - t < this.window
    );

    // Check limit
    if (recent.length >= this.max) {
      this.blacklist.add(identifier);
      throw new Error('Rate limit exceeded');
    }

    // Record attempt
    recent.push(Date.now());
    this.attempts.set(identifier, recent);
  }
}
```

### 4. Performance Monitoring

```javascript
class PerformanceMonitor {
  async measure(operation, fn) {
    const start = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - start;

      this.metrics.record(operation, duration, 'success');

      return result;
    } catch (err) {
      const duration = Date.now() - start;

      this.metrics.record(operation, duration, 'error');

      throw err;
    }
  }
}
```

## Security Best Practices

### 1. Input Validation

```javascript
function validateInput(data, schema) {
  // Type checking
  if (typeof data !== schema.type) {
    throw new Error('Invalid type');
  }

  // Length checking
  if (schema.maxLength && data.length > schema.maxLength) {
    throw new Error('Input too long');
  }

  // Pattern matching
  if (schema.pattern && !schema.pattern.test(data)) {
    throw new Error('Invalid format');
  }

  return data;
}
```

### 2. Secure Defaults

```javascript
class SecureConfig {
  constructor(options = {}) {
    this.config = {
      // Secure defaults
      tokenExpiry: options.tokenExpiry || 900, // 15 minutes
      algorithm: options.algorithm || 'RS256',
      keySize: options.keySize || 2048,
      iterations: options.iterations || 100000,
      saltSize: options.saltSize || 16,

      // Override with options
      ...options
    };
  }
}
```

### 3. Defense in Depth

```javascript
class DefenseInDepth {
  async processRequest(req) {
    // Layer 1: Rate limiting
    await this.rateLimit.check(req.ip);

    // Layer 2: Authentication
    const user = await this.auth.verify(req.token);

    // Layer 3: Authorization
    await this.authz.checkPermission(user, req.action);

    // Layer 4: Input validation
    const data = this.validate(req.body);

    // Layer 5: Business logic
    return await this.process(data, user);
  }
}
```

## Testing Strategies

### Unit Tests

```javascript
describe('JWT Authentication', () => {
  it('should generate valid token', () => {
    const token = auth.createToken(payload);
    expect(token).to.be.a('string');
    expect(token.split('.')).to.have.length(3);
  });

  it('should verify valid token', () => {
    const token = auth.createToken(payload);
    const decoded = auth.verifyToken(token);
    expect(decoded.sub).to.equal(payload.sub);
  });

  it('should reject expired token', () => {
    const token = auth.createToken(payload, -1); // Expired
    expect(() => auth.verifyToken(token)).to.throw('Token expired');
  });
});
```

### Integration Tests

```javascript
describe('Authentication Flow', () => {
  it('should complete login flow', async () => {
    // Register
    await auth.register('user', 'password');

    // Login
    const tokens = await auth.login('user', 'password');
    expect(tokens.accessToken).to.exist;
    expect(tokens.refreshToken).to.exist;

    // Verify
    const payload = auth.verifyAccess(tokens.accessToken);
    expect(payload.sub).to.exist;

    // Refresh
    const newTokens = await auth.refresh(tokens.refreshToken);
    expect(newTokens.accessToken).to.not.equal(tokens.accessToken);

    // Logout
    await auth.logout(newTokens.refreshToken);
  });
});
```

## Performance Benchmarks

Typical performance metrics for crypto operations:

| Operation | Time (ms) | Notes |
|-----------|-----------|-------|
| PBKDF2 (100k iterations) | 50-100 | Intentionally slow |
| RS256 Sign | 1-2 | Per token |
| RS256 Verify | 0.5-1 | Per token |
| AES-GCM Encrypt (1MB) | 5-10 | Streaming |
| X25519 Key Exchange | 0.1-0.5 | One-time |

## Common Pitfalls Addressed

### 1. Timing Attacks

```javascript
// ✅ CORRECT - Timing-safe comparison
const isValid = crypto.timingSafeEqual(
  Buffer.from(computed),
  Buffer.from(provided)
);

// ❌ WRONG - Vulnerable to timing attacks
const isValid = computed === provided;
```

### 2. Error Information Leakage

```javascript
// ✅ CORRECT - Generic error
catch (err) {
  logger.error('Internal error:', err);
  throw new Error('Authentication failed');
}

// ❌ WRONG - Leaks information
catch (err) {
  throw new Error(`Database error: ${err.message}`);
}
```

### 3. Resource Exhaustion

```javascript
// ✅ CORRECT - Rate limiting
const limiter = new RateLimiter(5, 60000);
await limiter.check(userId);

// ❌ WRONG - No rate limiting
await processExpensiveOperation();
```

## Further Learning

After studying these solutions:

1. **Implement variations** - Try different approaches
2. **Add features** - Extend functionality
3. **Optimize** - Improve performance
4. **Security audit** - Review for vulnerabilities
5. **Production deployment** - Consider real-world requirements

## Resources

- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cryptographic Standards](https://csrc.nist.gov/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Remember**: These solutions are educational. Always have production code reviewed by security experts and tested thoroughly in your specific environment!
