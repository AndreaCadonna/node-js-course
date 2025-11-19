/**
 * Level 3 Exercise 2 Solution: Security and Validation
 */

const querystring = require('querystring');

// Task 1: XSS Prevention System
class XSSProtector {
  constructor() {
    this.sanitizations = [];
  }

  sanitize(str) {
    if (typeof str !== 'string') return str;

    const original = str;
    let sanitized = str;

    // Remove script tags
    sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: URLs (can contain base64 encoded scripts)
    sanitized = sanitized.replace(/data:text\/html[^,]*,/gi, '');

    // Escape HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    if (original !== sanitized) {
      this.sanitizations.push({
        original: original.substring(0, 100),
        sanitized: sanitized.substring(0, 100)
      });
    }

    return sanitized;
  }

  sanitizeParams(params) {
    const sanitized = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitize(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(v =>
          typeof v === 'string' ? this.sanitize(v) : v
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  isClean(str) {
    const dangerous = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /onerror/i,
      /onload/i
    ];

    return !dangerous.some(pattern => pattern.test(str));
  }

  getReport() {
    return {
      count: this.sanitizations.length,
      sanitizations: this.sanitizations
    };
  }
}

// Task 2: SQL Injection Prevention
class SQLValidator {
  constructor() {
    this.warnings = [];
  }

  isSafe(str) {
    if (typeof str !== 'string') return true;

    const dangerous = [
      /('|"|;|--|\/\*|\*\/)/,  // SQL special chars
      /\b(select|insert|update|delete|drop|create|alter|truncate|exec|execute|union)\b/i,  // SQL keywords
      /\bxp_\w+/i,  // SQL Server extended procedures
      /\bsp_\w+/i,  // SQL Server stored procedures
      /information_schema/i,
      /\bor\b.*\b1\s*=\s*1\b/i,  // Classic SQL injection
      /\bor\b.*\btrue\b/i
    ];

    for (const pattern of dangerous) {
      if (pattern.test(str)) {
        this.warnings.push({
          value: str.substring(0, 100),
          pattern: pattern.toString()
        });
        return false;
      }
    }

    return true;
  }

  escape(str) {
    if (typeof str !== 'string') return str;

    return str
      .replace(/'/g, "''")
      .replace(/\\/g, '\\\\')
      .replace(/\0/g, '\\0');
  }

  validateParams(params, schema) {
    const errors = [];

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && !this.isSafe(value)) {
        errors.push(`Potential SQL injection in parameter: ${key}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    return true;
  }

  getWarnings() {
    return this.warnings;
  }
}

// Task 3: Parameter Pollution Prevention
function preventPollution(params, config = {}) {
  const {
    strategy = 'last',
    perParam = {},
    logPollution = true
  } = config;

  const cleaned = {};
  const pollutionAttempts = [];

  for (const [key, value] of Object.entries(params)) {
    const paramStrategy = perParam[key] || strategy;

    if (Array.isArray(value)) {
      // Pollution detected
      if (logPollution) {
        pollutionAttempts.push({
          param: key,
          values: value,
          count: value.length
        });
      }

      switch (paramStrategy) {
        case 'first':
          cleaned[key] = value[0];
          break;

        case 'last':
          cleaned[key] = value[value.length - 1];
          break;

        case 'array':
          cleaned[key] = value;
          break;

        case 'error':
          throw new Error(`Parameter pollution detected for: ${key}`);

        default:
          cleaned[key] = value[value.length - 1];
      }
    } else {
      cleaned[key] = value;
    }
  }

  if (pollutionAttempts.length > 0 && logPollution) {
    console.warn('[SECURITY] Parameter pollution detected:', pollutionAttempts);
  }

  return {
    params: cleaned,
    pollutionDetected: pollutionAttempts.length > 0,
    pollutionAttempts
  };
}

// Task 4: Rate Limiting by Query Fingerprint
class QueryRateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.store = new Map();
  }

  checkQuery(queryStr, identifier) {
    const fingerprint = this.getFingerprint(queryStr);
    const key = `${identifier}:${fingerprint}`;
    const now = Date.now();

    // Clean old entries
    this.cleanup(now);

    // Get or create record
    let record = this.store.get(key);

    if (!record) {
      record = {
        count: 0,
        firstRequest: now,
        resetAt: now + this.windowMs
      };
      this.store.set(key, record);
    }

    // Check if window has expired
    if (now > record.resetAt) {
      record.count = 0;
      record.firstRequest = now;
      record.resetAt = now + this.windowMs;
    }

    // Check limit
    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(record.resetAt),
        retryAfter: Math.ceil((record.resetAt - now) / 1000)
      };
    }

    // Increment and allow
    record.count++;

    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetAt: new Date(record.resetAt),
      limit: this.maxRequests
    };
  }

  getFingerprint(queryStr) {
    // Create normalized fingerprint
    const params = querystring.parse(queryStr);
    const keys = Object.keys(params).sort();
    return keys.join(',');
  }

  reset(identifier) {
    // Remove all entries for identifier
    for (const key of this.store.keys()) {
      if (key.startsWith(identifier + ':')) {
        this.store.delete(key);
      }
    }
  }

  cleanup(now) {
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt + this.windowMs) {
        this.store.delete(key);
      }
    }
  }
}

// Task 5: Complete Security Pipeline
function secureQueryPipeline(queryStr, options = {}) {
  const {
    maxLength = 2000,
    strict = true
  } = options;

  const warnings = [];
  let safe = true;

  // Length validation
  if (queryStr.length > maxLength) {
    warnings.push(`Query string exceeds maximum length of ${maxLength}`);
    safe = false;
  }

  // Parse
  const params = querystring.parse(queryStr);

  // XSS prevention
  const xssProtector = new XSSProtector();
  const sanitizedParams = xssProtector.sanitizeParams(params);

  if (xssProtector.sanitizations.length > 0) {
    warnings.push(`XSS attempts detected and sanitized: ${xssProtector.sanitizations.length}`);
    if (strict) safe = false;
  }

  // SQL injection prevention
  const sqlValidator = new SQLValidator();
  for (const [key, value] of Object.entries(sanitizedParams)) {
    if (typeof value === 'string' && !sqlValidator.isSafe(value)) {
      warnings.push(`Potential SQL injection in parameter: ${key}`);
      safe = false;
    }
  }

  // Parameter pollution prevention
  const pollutionResult = preventPollution(sanitizedParams, {
    logPollution: false
  });

  if (pollutionResult.pollutionDetected) {
    warnings.push(`Parameter pollution detected: ${pollutionResult.pollutionAttempts.length} cases`);
  }

  return {
    safe,
    sanitized: pollutionResult.params,
    warnings
  };
}

// Test implementations
console.log('=== Level 3 Exercise 2 Solutions ===\\n');

// Test Task 1: XSS Prevention
console.log('Task 1: XSS Prevention');
try {
  const protector = new XSSProtector();
  const dangerous = '<script>alert("XSS")</script>';

  console.log('Original:', dangerous);
  console.log('Sanitized:', protector.sanitize(dangerous));
  console.log('Is clean:', protector.isClean('safe text'));
  console.log('✓ Task 1 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 2: SQL Injection Prevention
console.log('Task 2: SQL Injection Prevention');
try {
  const validator = new SQLValidator();
  const sqlAttempt = "admin' OR '1'='1";

  console.log('SQL attempt:', sqlAttempt);
  console.log('Is safe:', validator.isSafe(sqlAttempt));
  console.log('Warnings:', validator.getWarnings().length);
  console.log('✓ Task 2 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 3: Parameter Pollution
console.log('Task 3: Parameter Pollution Prevention');
try {
  const polluted = querystring.parse('id=1&id=2&id=3&tag=js&tag=node');
  const result = preventPollution(polluted, {
    perParam: {
      id: 'first',
      tag: 'array'
    },
    logPollution: false
  });

  console.log('Cleaned params:', result.params);
  console.log('Pollution detected:', result.pollutionDetected);
  console.log('✓ Task 3 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 4: Rate Limiting
console.log('Task 4: Rate Limiting');
try {
  const limiter = new QueryRateLimiter(5, 60000); // 5 requests per minute
  const query = 'search?q=test';

  for (let i = 0; i < 6; i++) {
    const result = limiter.checkQuery(query, 'user123');
    console.log(`Request ${i + 1}:`, result.allowed ? 'Allowed' : 'Blocked',
                `(${result.remaining} remaining)`);
  }

  console.log('✓ Task 4 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 5: Complete Pipeline
console.log('Task 5: Security Pipeline');
try {
  const result = secureQueryPipeline(
    'name=<script>alert(1)</script>&id=1; DROP TABLE users',
    { maxLength: 500, strict: false }
  );

  console.log('Pipeline result:');
  console.log('  Safe:', result.safe);
  console.log('  Warnings:', result.warnings.length);
  console.log('  Sanitized params:', result.sanitized);
  console.log('✓ Task 5 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

console.log('=== All Solutions Complete ===');

module.exports = {
  XSSProtector,
  SQLValidator,
  preventPollution,
  QueryRateLimiter,
  secureQueryPipeline
};
