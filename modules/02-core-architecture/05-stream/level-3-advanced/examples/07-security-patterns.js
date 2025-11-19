/**
 * 07-security-patterns.js
 * =======================
 * Demonstrates security patterns for production streams
 *
 * Key Concepts:
 * - Input validation and sanitization
 * - Rate limiting
 * - Size limits
 * - Path traversal prevention
 * - Data encryption
 * - Sensitive data redaction
 *
 * Run: node 07-security-patterns.js
 */

const { Transform, Readable, Writable, pipeline } = require('stream');
const crypto = require('crypto');
const path = require('path');

console.log('=== Stream Security Patterns ===\n');

// =============================================================================
// Example 1: Input Validation
// =============================================================================

class ValidationTransform extends Transform {
  constructor(schema, options) {
    super({ objectMode: true, ...options });
    this.schema = schema;
    this.validCount = 0;
    this.invalidCount = 0;
  }

  _transform(item, encoding, callback) {
    const validation = this.validate(item);

    if (!validation.valid) {
      this.invalidCount++;
      console.log(`  ❌ Invalid: ${validation.error}`);

      // Option 1: Emit error and stop
      // callback(new Error(validation.error));

      // Option 2: Skip invalid items
      this.emit('invalid', { item, error: validation.error });
      callback();
      return;
    }

    this.validCount++;
    console.log(`  ✓ Valid: ${item.name}`);

    callback(null, this.sanitize(item));
  }

  validate(item) {
    const rules = this.schema;

    // Check required fields
    for (const field of rules.required || []) {
      if (!(field in item)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    // Check field types
    for (const [field, type] of Object.entries(rules.types || {})) {
      if (field in item && typeof item[field] !== type) {
        return { valid: false, error: `Invalid type for ${field}: expected ${type}` };
      }
    }

    // Check field constraints
    for (const [field, constraint] of Object.entries(rules.constraints || {})) {
      if (field in item) {
        if (constraint.min !== undefined && item[field] < constraint.min) {
          return { valid: false, error: `${field} must be >= ${constraint.min}` };
        }
        if (constraint.max !== undefined && item[field] > constraint.max) {
          return { valid: false, error: `${field} must be <= ${constraint.max}` };
        }
        if (constraint.maxLength && item[field].length > constraint.maxLength) {
          return { valid: false, error: `${field} exceeds max length ${constraint.maxLength}` };
        }
      }
    }

    return { valid: true };
  }

  sanitize(item) {
    const sanitized = {};

    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'string') {
        // Remove dangerous characters
        sanitized[key] = value
          .replace(/[<>]/g, '')
          .replace(/[;&|`$]/g, '')
          .trim();
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  _flush(callback) {
    console.log(`\n  📊 Validation stats: ${this.validCount} valid, ${this.invalidCount} invalid`);
    callback();
  }
}

function example1() {
  console.log('--- Example 1: Input Validation ---\n');

  const schema = {
    required: ['name', 'age'],
    types: {
      name: 'string',
      age: 'number'
    },
    constraints: {
      name: { maxLength: 50 },
      age: { min: 0, max: 150 }
    }
  };

  const validator = new ValidationTransform(schema);

  validator.on('invalid', ({ item, error }) => {
    // In production: log to monitoring system
  });

  const testData = [
    { name: 'Alice', age: 30 },
    { name: 'Bob' }, // Missing age
    { name: 'Charlie', age: 'not a number' }, // Wrong type
    { name: 'David', age: -5 }, // Out of range
    { name: 'Eve<script>', age: 25 }, // XSS attempt
    { name: 'Frank', age: 40 }
  ];

  const source = Readable.from(testData);

  const destination = new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      console.log(`  → Processed: ${chunk.name}`);
      callback();
    }
  });

  pipeline(source, validator, destination, (err) => {
    if (err) {
      console.error('Pipeline error:', err);
    } else {
      console.log('\n✓ Example 1 complete\n');
      example2();
    }
  });
}

// =============================================================================
// Example 2: Rate Limiting
// =============================================================================

class RateLimiter extends Transform {
  constructor(tokensPerSecond, bucketSize, options) {
    super({ objectMode: true, ...options });
    this.tokensPerSecond = tokensPerSecond;
    this.bucketSize = bucketSize;
    this.tokens = bucketSize;
    this.lastRefill = Date.now();
    this.processed = 0;
    this.throttled = 0;
  }

  refillTokens() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.tokensPerSecond;

    this.tokens = Math.min(this.bucketSize, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async _transform(item, encoding, callback) {
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      this.processed++;
      console.log(`  ✓ Processed item ${item.id} (${this.tokens.toFixed(1)} tokens remaining)`);
      callback(null, item);
    } else {
      // Rate limit exceeded - wait for tokens
      this.throttled++;
      const waitTime = ((1 - this.tokens) / this.tokensPerSecond) * 1000;

      console.log(`  ⏳ Rate limited - waiting ${waitTime.toFixed(0)}ms`);

      setTimeout(() => {
        this.tokens = 0;
        this.processed++;
        callback(null, item);
      }, waitTime);
    }
  }

  _flush(callback) {
    console.log(`\n  📊 Rate limiting stats: ${this.processed} processed, ${this.throttled} throttled`);
    callback();
  }
}

async function example2() {
  console.log('--- Example 2: Rate Limiting ---\n');

  const rateLimiter = new RateLimiter(5, 5); // 5 requests/second, burst of 5

  const items = Array.from({ length: 12 }, (_, i) => ({ id: i + 1 }));
  const source = Readable.from(items);

  const destination = new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      callback();
    }
  });

  pipeline(source, rateLimiter, destination, (err) => {
    if (err) {
      console.error('Pipeline error:', err);
    } else {
      console.log('\n✓ Example 2 complete\n');
      example3();
    }
  });
}

// =============================================================================
// Example 3: Size Limiting
// =============================================================================

class SizeLimiter extends Transform {
  constructor(maxBytes, options) {
    super(options);
    this.maxBytes = maxBytes;
    this.bytesProcessed = 0;
  }

  _transform(chunk, encoding, callback) {
    this.bytesProcessed += chunk.length;

    if (this.bytesProcessed > this.maxBytes) {
      const error = new Error(`Size limit exceeded: ${this.maxBytes} bytes`);
      error.code = 'SIZE_LIMIT_EXCEEDED';
      callback(error);
      return;
    }

    console.log(`  → ${chunk.length} bytes (total: ${this.bytesProcessed}/${this.maxBytes})`);

    callback(null, chunk);
  }
}

function example3() {
  console.log('--- Example 3: Size Limiting ---\n');

  const limiter = new SizeLimiter(10 * 1024); // 10KB limit

  const source = new Readable({
    read() {
      // Simulate upload
      for (let i = 0; i < 15; i++) {
        if (!this.push(Buffer.alloc(1024, 'x'))) {
          break;
        }
      }
      this.push(null);
    }
  });

  const destination = new Writable({
    write(chunk, encoding, callback) {
      callback();
    }
  });

  pipeline(source, limiter, destination, (err) => {
    if (err) {
      console.log(`\n  🛑 ${err.message}`);
      console.log('  ✓ Size limit enforced correctly\n');
    } else {
      console.log('\n  ✓ Within size limit\n');
    }

    example4();
  });
}

// =============================================================================
// Example 4: Path Traversal Prevention
// =============================================================================

class SecurePathValidator extends Transform {
  constructor(baseDir, options) {
    super({ objectMode: true, ...options });
    this.baseDir = path.resolve(baseDir);
  }

  _transform(item, encoding, callback) {
    const safePath = this.validatePath(item.filename);

    if (!safePath) {
      console.log(`  ❌ Rejected: ${item.filename} (path traversal attempt)`);
      callback(new Error('Invalid filename'));
      return;
    }

    console.log(`  ✓ Safe: ${item.filename} → ${safePath}`);

    callback(null, { ...item, safePath });
  }

  validatePath(filename) {
    // Remove dangerous characters
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '');

    if (!safe || safe.startsWith('.')) {
      return null;
    }

    // Resolve and verify within base directory
    const fullPath = path.resolve(this.baseDir, safe);

    if (!fullPath.startsWith(this.baseDir)) {
      return null;
    }

    return fullPath;
  }
}

function example4() {
  console.log('--- Example 4: Path Traversal Prevention ---\n');

  const validator = new SecurePathValidator('/var/uploads');

  const testPaths = [
    { filename: 'document.txt' }, // Safe
    { filename: '../../../etc/passwd' }, // Path traversal
    { filename: 'report.pdf' }, // Safe
    { filename: '.hidden' }, // Hidden file
    { filename: 'data/file.txt' } // Sub-directory (becomes datafile.txt)
  ];

  const source = Readable.from(testPaths);

  const destination = new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      callback();
    }
  });

  pipeline(source, validator, destination, (err) => {
    if (err) {
      console.log('\n  🛑 Invalid path detected');
    }
    console.log('\n✓ Example 4 complete\n');
    example5();
  });
}

// =============================================================================
// Example 5: Data Redaction
// =============================================================================

class RedactionTransform extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });

    this.patterns = [
      { name: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
      { name: 'Credit Card', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
      { name: 'Email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g }
    ];

    this.sensitiveKeys = ['password', 'ssn', 'creditcard', 'apikey', 'secret'];
    this.redactionCount = 0;
  }

  _transform(item, encoding, callback) {
    const redacted = this.redact(item);

    if (this.redactionCount > 0) {
      console.log(`  🔒 Redacted ${this.redactionCount} sensitive fields in item ${item.id}`);
      this.redactionCount = 0;
    }

    callback(null, redacted);
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
          this.redactionCount++;
        } else if (typeof value === 'string') {
          const original = value;
          redacted[key] = this.redactString(value);
          if (original !== redacted[key]) {
            this.redactionCount++;
          }
        } else {
          redacted[key] = value;
        }
      }

      return redacted;
    }

    return obj;
  }

  redactString(str) {
    let result = str;

    for (const { pattern } of this.patterns) {
      result = result.replace(pattern, '[REDACTED]');
    }

    return result;
  }

  isSensitiveKey(key) {
    const lowerKey = key.toLowerCase();
    return this.sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
  }
}

function example5() {
  console.log('--- Example 5: Sensitive Data Redaction ---\n');

  const redactor = new RedactionTransform();

  const testData = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      description: 'Contact me at john@example.com'
    },
    {
      id: 2,
      name: 'Jane Smith',
      ssn: '123-45-6789',
      creditCard: '4532-1234-5678-9012'
    },
    {
      id: 3,
      name: 'Bob Johnson',
      password: 'secret123',
      apiKey: 'sk_live_1234567890'
    }
  ];

  const source = Readable.from(testData);

  const destination = new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      console.log('  → Output:', JSON.stringify(chunk));
      callback();
    }
  });

  pipeline(source, redactor, destination, (err) => {
    if (err) {
      console.error('Pipeline error:', err);
    } else {
      console.log('\n✓ Example 5 complete\n');
      showSummary();
    }
  });
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('=== Security Patterns Summary ===\n');
  console.log('Security Measures:');
  console.log('1. Validation - Verify and sanitize all input');
  console.log('2. Rate Limiting - Prevent abuse and DoS');
  console.log('3. Size Limiting - Protect against resource exhaustion');
  console.log('4. Path Validation - Prevent directory traversal');
  console.log('5. Redaction - Remove sensitive data from logs');
  console.log('\nBest Practices:');
  console.log('- Never trust external input');
  console.log('- Validate early in the pipeline');
  console.log('- Set appropriate limits (size, rate, time)');
  console.log('- Sanitize data before processing');
  console.log('- Redact PII from logs and outputs');
  console.log('- Use allowlists over blocklists');
  console.log('- Log security events for monitoring');
  console.log('\nSecurity Checklist:');
  console.log('✓ Input validation');
  console.log('✓ Rate limiting');
  console.log('✓ Size limits');
  console.log('✓ Path validation');
  console.log('✓ Data redaction');
  console.log('✓ Error handling');
  console.log('\n✓ All security examples completed!\n');
}

// Start examples
example1();
