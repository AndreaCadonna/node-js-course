# Security Best Practices for Streams

## Introduction

This guide covers security considerations when working with Node.js streams. You'll learn about input validation, resource limits, denial-of-service prevention, secure data handling, and other critical security patterns for production streaming applications.

By the end, you'll be able to build secure streaming applications that protect against common attacks and vulnerabilities.

---

## Understanding Stream Security Risks

### Common Stream Vulnerabilities

```javascript
const securityRisks = {
  // 1. Resource Exhaustion
  unboundedMemory: 'Malicious input causes memory overflow',
  cpuExhaustion: 'Expensive operations block event loop',

  // 2. Data Injection
  codeInjection: 'Unsafe eval of stream data',
  pathTraversal: 'Reading/writing outside safe directories',

  // 3. Information Disclosure
  dataLeakage: 'Sensitive data in error messages',
  timingAttacks: 'Response timing reveals information',

  // 4. Denial of Service
  infiniteStream: 'Stream never ends, exhausting resources',
  slowloris: 'Slow writes keep connections open',

  // 5. Improper Cleanup
  resourceLeaks: 'File handles, sockets not closed'
};
```

---

## Input Validation

### Validating Stream Data

```javascript
const { Transform } = require('stream');

class ValidatingTransform extends Transform {
  constructor(schema, options) {
    super({ objectMode: true, ...options });
    this.schema = schema;
    this.validatedCount = 0;
    this.rejectedCount = 0;
  }

  _transform(item, encoding, callback) {
    try {
      // Validate against schema
      const validationResult = this.schema.validate(item);

      if (validationResult.error) {
        this.rejectedCount++;

        // Log but don't fail (or fail based on policy)
        this.emit('validationError', {
          item,
          error: validationResult.error.message
        });

        // Skip invalid item
        callback();
        return;
      }

      this.validatedCount++;

      // Pass sanitized data
      callback(null, validationResult.value);
    } catch (err) {
      callback(err);
    }
  }
}

// Usage with Joi
const Joi = require('joi');

const schema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  age: Joi.number().min(0).max(150)
});

const validator = new ValidatingTransform(schema);

validator.on('validationError', ({ item, error }) => {
  console.error('Validation failed:', error, item);
});
```

### Sanitizing Input

```javascript
class SanitizingTransform extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
  }

  _transform(item, encoding, callback) {
    try {
      const sanitized = this.sanitize(item);
      callback(null, sanitized);
    } catch (err) {
      callback(err);
    }
  }

  sanitize(item) {
    if (typeof item === 'string') {
      // Remove dangerous characters
      return item
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/[;&|`$]/g, '') // Remove shell metacharacters
        .trim()
        .substring(0, 1000); // Limit length
    }

    if (typeof item === 'object') {
      const sanitized = {};

      for (const [key, value] of Object.entries(item)) {
        // Whitelist allowed keys
        if (this.isAllowedKey(key)) {
          sanitized[key] = this.sanitize(value);
        }
      }

      return sanitized;
    }

    return item;
  }

  isAllowedKey(key) {
    const allowedKeys = ['id', 'name', 'email', 'age'];
    return allowedKeys.includes(key);
  }
}
```

### Path Traversal Prevention

```javascript
const path = require('path');
const fs = require('fs');

class SecureFileWriter extends Transform {
  constructor(baseDir, options) {
    super({ objectMode: true, ...options });
    this.baseDir = path.resolve(baseDir);
  }

  _transform(item, encoding, callback) {
    try {
      // Sanitize filename
      const safePath = this.getSafePath(item.filename);

      if (!safePath) {
        callback(new Error('Invalid filename'));
        return;
      }

      // Write file securely
      fs.writeFile(safePath, item.data, (err) => {
        if (err) {
          callback(err);
        } else {
          callback(null, { filename: item.filename, written: true });
        }
      });
    } catch (err) {
      callback(err);
    }
  }

  getSafePath(filename) {
    // Remove dangerous characters
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '');

    if (!safe || safe.startsWith('.')) {
      return null; // Reject hidden files or empty names
    }

    // Resolve and verify it's within baseDir
    const fullPath = path.resolve(this.baseDir, safe);

    if (!fullPath.startsWith(this.baseDir)) {
      return null; // Path traversal attempt
    }

    return fullPath;
  }
}

// Usage
const writer = new SecureFileWriter('/var/uploads');

// ✅ Safe: /var/uploads/document.txt
writer.write({ filename: 'document.txt', data: 'content' });

// ❌ Blocked: path traversal attempt
writer.write({ filename: '../../../etc/passwd', data: 'hack' });
```

---

## Resource Limits

### Size Limits

```javascript
class SizeLimitedTransform extends Transform {
  constructor(maxSize, options) {
    super(options);
    this.maxSize = maxSize;
    this.bytesProcessed = 0;
  }

  _transform(chunk, encoding, callback) {
    this.bytesProcessed += chunk.length;

    if (this.bytesProcessed > this.maxSize) {
      callback(new Error(`Size limit exceeded: ${this.maxSize} bytes`));
      return;
    }

    callback(null, chunk);
  }
}

// Usage: Limit uploads to 10MB
const limiter = new SizeLimitedTransform(10 * 1024 * 1024);

request
  .pipe(limiter)
  .on('error', (err) => {
    console.error('Upload too large:', err.message);
    response.status(413).send('Payload too large');
  })
  .pipe(fs.createWriteStream('upload.dat'));
```

### Count Limits

```javascript
class CountLimitedTransform extends Transform {
  constructor(maxCount, options) {
    super({ objectMode: true, ...options });
    this.maxCount = maxCount;
    this.count = 0;
  }

  _transform(item, encoding, callback) {
    this.count++;

    if (this.count > this.maxCount) {
      callback(new Error(`Count limit exceeded: ${this.maxCount} items`));
      return;
    }

    callback(null, item);
  }
}
```

### Time Limits

```javascript
class TimeLimitedTransform extends Transform {
  constructor(maxDurationMs, options) {
    super(options);
    this.maxDuration = maxDurationMs;
    this.startTime = Date.now();
  }

  _transform(chunk, encoding, callback) {
    const elapsed = Date.now() - this.startTime;

    if (elapsed > this.maxDuration) {
      callback(new Error(`Processing timeout: ${this.maxDuration}ms`));
      return;
    }

    callback(null, chunk);
  }
}

// Usage: Timeout after 30 seconds
const timeout = new TimeLimitedTransform(30000);

source
  .pipe(timeout)
  .on('error', (err) => {
    console.error('Processing timeout:', err.message);
  })
  .pipe(destination);
```

### Memory Limits

```javascript
class MemoryGuardedTransform extends Transform {
  constructor(maxHeapMB, options) {
    super(options);
    this.maxHeap = maxHeapMB * 1024 * 1024;
    this.checkInterval = 100;
    this.count = 0;
  }

  _transform(chunk, encoding, callback) {
    this.count++;

    // Check memory periodically
    if (this.count % this.checkInterval === 0) {
      const heapUsed = process.memoryUsage().heapUsed;

      if (heapUsed > this.maxHeap) {
        callback(new Error(`Memory limit exceeded: ${this.maxHeap} bytes`));
        return;
      }
    }

    callback(null, chunk);
  }
}
```

---

## Rate Limiting

### Token Bucket Rate Limiter

```javascript
class RateLimiter extends Transform {
  constructor(tokensPerSecond, bucketSize, options) {
    super(options);
    this.tokensPerSecond = tokensPerSecond;
    this.bucketSize = bucketSize;
    this.tokens = bucketSize;
    this.lastRefill = Date.now();
  }

  refillTokens() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.tokensPerSecond;

    this.tokens = Math.min(this.bucketSize, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async _transform(chunk, encoding, callback) {
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      callback(null, chunk);
    } else {
      // Wait for tokens
      const waitTime = (1 - this.tokens) / this.tokensPerSecond * 1000;

      setTimeout(() => {
        this.tokens = 0;
        callback(null, chunk);
      }, waitTime);
    }
  }
}

// Usage: 10 requests per second
const rateLimiter = new RateLimiter(10, 10);
```

### Sliding Window Rate Limiter

```javascript
class SlidingWindowRateLimiter extends Transform {
  constructor(maxRequests, windowMs, options) {
    super({ objectMode: true, ...options });
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  _transform(item, encoding, callback) {
    const now = Date.now();

    // Remove old requests outside window
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );

    if (this.requests.length >= this.maxRequests) {
      callback(new Error('Rate limit exceeded'));
      return;
    }

    this.requests.push(now);
    callback(null, item);
  }
}

// Usage: 100 requests per minute
const limiter = new SlidingWindowRateLimiter(100, 60000);
```

---

## Secure Data Handling

### Encryption in Transit

```javascript
const crypto = require('crypto');

class EncryptTransform extends Transform {
  constructor(key, iv, options) {
    super(options);
    this.cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  }

  _transform(chunk, encoding, callback) {
    try {
      const encrypted = this.cipher.update(chunk);
      callback(null, encrypted);
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    try {
      const final = this.cipher.final();
      callback(null, final);
    } catch (err) {
      callback(err);
    }
  }
}

class DecryptTransform extends Transform {
  constructor(key, iv, options) {
    super(options);
    this.decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  }

  _transform(chunk, encoding, callback) {
    try {
      const decrypted = this.decipher.update(chunk);
      callback(null, decrypted);
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    try {
      const final = this.decipher.final();
      callback(null, final);
    } catch (err) {
      callback(err);
    }
  }
}

// Usage
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

// Encrypt
source
  .pipe(new EncryptTransform(key, iv))
  .pipe(destination);

// Decrypt
encrypted
  .pipe(new DecryptTransform(key, iv))
  .pipe(output);
```

### Hashing for Integrity

```javascript
class HashingTransform extends Transform {
  constructor(algorithm = 'sha256', options) {
    super(options);
    this.hash = crypto.createHash(algorithm);
  }

  _transform(chunk, encoding, callback) {
    this.hash.update(chunk);
    callback(null, chunk); // Pass through
  }

  _flush(callback) {
    const digest = this.hash.digest('hex');
    this.emit('hash', digest);
    callback();
  }
}

// Usage: Verify file integrity
const hasher = new HashingTransform('sha256');

hasher.on('hash', (hash) => {
  console.log('File hash:', hash);
  if (hash === expectedHash) {
    console.log('✓ Integrity verified');
  } else {
    console.error('✗ Integrity check failed');
  }
});

fs.createReadStream('file.dat')
  .pipe(hasher)
  .pipe(destination);
```

### Redacting Sensitive Data

```javascript
class RedactingTransform extends Transform {
  constructor(patterns, options) {
    super({ objectMode: true, ...options });
    this.patterns = patterns;
  }

  _transform(item, encoding, callback) {
    try {
      const redacted = this.redact(item);
      callback(null, redacted);
    } catch (err) {
      callback(err);
    }
  }

  redact(obj) {
    if (typeof obj === 'string') {
      return this.redactString(obj);
    }

    if (typeof obj === 'object' && obj !== null) {
      const redacted = {};

      for (const [key, value] of Object.entries(obj)) {
        if (this.isSensitiveKey(key)) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = this.redact(value);
        }
      }

      return redacted;
    }

    return obj;
  }

  redactString(str) {
    let result = str;

    for (const pattern of this.patterns) {
      result = result.replace(pattern, '[REDACTED]');
    }

    return result;
  }

  isSensitiveKey(key) {
    const sensitiveKeys = ['password', 'ssn', 'creditCard', 'apiKey', 'secret'];
    return sensitiveKeys.includes(key.toLowerCase());
  }
}

// Usage
const redactor = new RedactingTransform([
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b\d{16}\b/g, // Credit card
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g // Email
]);

logStream
  .pipe(redactor)
  .pipe(publicLogStream);
```

---

## Denial of Service Prevention

### Compression Bomb Detection

```javascript
const zlib = require('zlib');

class SafeDecompressor extends Transform {
  constructor(maxRatio = 100, options) {
    super(options);
    this.maxRatio = maxRatio;
    this.compressedSize = 0;
    this.decompressedSize = 0;
    this.decompressor = zlib.createGunzip();

    this.decompressor.on('data', (chunk) => {
      this.decompressedSize += chunk.length;
      this.checkRatio();
      this.push(chunk);
    });
  }

  _transform(chunk, encoding, callback) {
    this.compressedSize += chunk.length;
    this.decompressor.write(chunk);
    callback();
  }

  checkRatio() {
    if (this.compressedSize === 0) return;

    const ratio = this.decompressedSize / this.compressedSize;

    if (ratio > this.maxRatio) {
      this.destroy(new Error(`Compression bomb detected: ratio ${ratio}`));
    }
  }

  _flush(callback) {
    this.decompressor.end();
    callback();
  }
}

// Usage
const decompressor = new SafeDecompressor(100);

compressedStream
  .pipe(decompressor)
  .on('error', (err) => {
    console.error('Decompression error:', err.message);
  })
  .pipe(output);
```

### Slowloris Protection

```javascript
class SlowStreamProtector extends Transform {
  constructor(minBytesPerSecond, options) {
    super(options);
    this.minBytesPerSecond = minBytesPerSecond;
    this.startTime = Date.now();
    this.bytesReceived = 0;
    this.checkInterval = setInterval(() => this.checkRate(), 1000);
  }

  _transform(chunk, encoding, callback) {
    this.bytesReceived += chunk.length;
    callback(null, chunk);
  }

  checkRate() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = this.bytesReceived / elapsed;

    if (rate < this.minBytesPerSecond) {
      this.destroy(new Error('Connection too slow'));
    }
  }

  _flush(callback) {
    clearInterval(this.checkInterval);
    callback();
  }
}

// Usage: Minimum 1KB/s
const protector = new SlowStreamProtector(1024);

request
  .pipe(protector)
  .on('error', (err) => {
    console.error('Slow connection detected:', err.message);
    response.status(408).send('Request timeout');
  })
  .pipe(processor);
```

---

## Error Handling Security

### Safe Error Messages

```javascript
class SecureErrorTransform extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
  }

  _transform(item, encoding, callback) {
    try {
      const result = this.process(item);
      callback(null, result);
    } catch (err) {
      // Log detailed error internally
      console.error('Processing error:', {
        error: err.message,
        stack: err.stack,
        item: JSON.stringify(item)
      });

      // Emit safe error to client
      const safeError = new Error('Processing failed');
      safeError.code = 'PROCESSING_ERROR';
      // Don't include stack trace or internal details

      callback(safeError);
    }
  }

  process(item) {
    // Your processing logic
    return item;
  }
}
```

### Preventing Information Leakage

```javascript
class SafeErrorHandler {
  static handleError(err, isDevelopment = false) {
    if (isDevelopment) {
      // Full error in development
      return {
        error: err.message,
        stack: err.stack,
        details: err
      };
    } else {
      // Minimal error in production
      return {
        error: 'An error occurred',
        code: err.code || 'INTERNAL_ERROR'
      };
    }
  }
}

// Usage
stream.on('error', (err) => {
  const safeError = SafeErrorHandler.handleError(err, process.env.NODE_ENV === 'development');
  response.status(500).json(safeError);
});
```

---

## Access Control

### Permission Checking

```javascript
class PermissionCheckTransform extends Transform {
  constructor(permissionChecker, requiredPermission, options) {
    super({ objectMode: true, ...options });
    this.permissionChecker = permissionChecker;
    this.requiredPermission = requiredPermission;
  }

  async _transform(item, encoding, callback) {
    try {
      const hasPermission = await this.permissionChecker(
        item.userId,
        this.requiredPermission
      );

      if (!hasPermission) {
        callback(new Error('Permission denied'));
        return;
      }

      callback(null, item);
    } catch (err) {
      callback(err);
    }
  }
}

// Usage
const checker = new PermissionCheckTransform(
  async (userId, permission) => {
    return await db.hasPermission(userId, permission);
  },
  'read:sensitive_data'
);
```

---

## Security Checklist

### Stream Security Audit

- [ ] **Input Validation**
  - [ ] Validate all input data
  - [ ] Sanitize strings
  - [ ] Whitelist allowed values
  - [ ] Reject malformed data

- [ ] **Resource Limits**
  - [ ] Limit total size
  - [ ] Limit item count
  - [ ] Set timeouts
  - [ ] Monitor memory usage

- [ ] **Rate Limiting**
  - [ ] Implement rate limiting
  - [ ] Prevent abuse
  - [ ] Log violations

- [ ] **Data Protection**
  - [ ] Encrypt sensitive data
  - [ ] Validate integrity
  - [ ] Redact PII in logs
  - [ ] Secure file paths

- [ ] **Error Handling**
  - [ ] Safe error messages
  - [ ] No information leakage
  - [ ] Proper logging
  - [ ] Graceful degradation

- [ ] **Access Control**
  - [ ] Verify permissions
  - [ ] Audit access
  - [ ] Principle of least privilege

---

## Summary

### Security Best Practices

1. **Validate all input** - never trust external data
2. **Limit resources** - prevent exhaustion attacks
3. **Rate limit** - protect against abuse
4. **Encrypt sensitive data** - protect data in transit
5. **Safe error handling** - don't leak information
6. **Audit and log** - track security events
7. **Principle of least privilege** - minimal permissions
8. **Defense in depth** - multiple security layers

### Common Attack Vectors

| Attack | Prevention |
|--------|-----------|
| Buffer overflow | Size limits |
| Path traversal | Path validation |
| DoS | Rate limiting, timeouts |
| Compression bomb | Ratio limits |
| Slowloris | Minimum rate enforcement |
| Code injection | Input sanitization |
| Data leakage | Redaction, safe errors |

### Next Steps

1. Review [security patterns example](../examples/07-security-patterns.js)
2. Practice with [production ETL exercise](../exercises/exercise-5.js)
3. Study [production pipeline example](../examples/08-production-pipeline.js)

---

## Quick Reference

```javascript
// Input validation
const validator = new ValidatingTransform(schema);

// Size limit
const limiter = new SizeLimitedTransform(10 * 1024 * 1024);

// Rate limiting
const rateLimiter = new RateLimiter(10, 10);

// Encryption
const encryptor = new EncryptTransform(key, iv);

// Redaction
const redactor = new RedactingTransform(patterns);

// Compression bomb protection
const decompressor = new SafeDecompressor(100);

// Safe errors
const safeError = SafeErrorHandler.handleError(err, isDev);
```

Production-ready and secure! Review [Production Pipeline Example](../examples/08-production-pipeline.js) for a complete implementation!
