/**
 * Level 3 Exercise 1 Solution: Production URL Utility
 */

const querystring = require('querystring');

// Task 1: Secure URL Builder
class SecureUrlBuilder {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.params = new Map();
    this.maxLength = 500;
  }

  addParam(key, value) {
    // Validate key
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Invalid parameter key');
    }

    // Sanitize value
    const sanitized = this.sanitize(String(value));

    // Validate SQL patterns
    this.validateSqlSafe(sanitized);

    // Check length
    if (sanitized.length > this.maxLength) {
      throw new Error(`Parameter value too long: ${key}`);
    }

    this.params.set(key, sanitized);
    return this;
  }

  addParams(obj) {
    for (const [key, value] of Object.entries(obj)) {
      this.addParam(key, value);
    }
    return this;
  }

  removeParam(key) {
    this.params.delete(key);
    return this;
  }

  build() {
    if (this.params.size === 0) {
      return this.baseUrl;
    }

    const obj = Object.fromEntries(this.params);
    const queryStr = querystring.stringify(obj);

    return `${this.baseUrl}?${queryStr}`;
  }

  validate() {
    // Check total URL length
    const url = this.build();
    if (url.length > 2000) {
      throw new Error('URL exceeds maximum length of 2000 characters');
    }

    // Validate base URL
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    return true;
  }

  sanitize(str) {
    return str
      .replace(/</g, '')
      .replace(/>/g, '')
      .replace(/"/g, '')
      .replace(/'/g, '')
      .trim();
  }

  validateSqlSafe(str) {
    const dangerous = /('|"|;|--|\\/\\*|\\*\\/|\\bselect\\b|\\binsert\\b|\\bupdate\\b|\\bdelete\\b|\\bdrop\\b)/i;

    if (dangerous.test(str)) {
      throw new Error(`Potentially dangerous pattern detected: ${str.substring(0, 50)}`);
    }

    return true;
  }
}

// Task 2: URL Normalization
function normalizeUrl(url) {
  // Split URL into base and query
  const [base, queryStr = ''] = url.split('?');

  if (!queryStr) {
    return base;
  }

  // Parse query string
  const params = querystring.parse(queryStr);

  // Remove duplicate parameters (keep last)
  // querystring.parse already handles this

  // Remove empty parameters
  const cleaned = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) {
      // Decode and re-encode consistently
      const decoded = querystring.unescape(String(value));
      cleaned[key] = decoded;
    }
  }

  // Sort parameters alphabetically
  const sorted = Object.keys(cleaned).sort().reduce((acc, key) => {
    acc[key] = cleaned[key];
    return acc;
  }, {});

  // Build normalized query string
  const normalized = querystring.stringify(sorted);

  return normalized ? `${base}?${normalized}` : base;
}

// Task 3: URL Comparison
function areUrlsEquivalent(url1, url2) {
  // Normalize both URLs
  const normalized1 = normalizeUrl(url1);
  const normalized2 = normalizeUrl(url2);

  // Split into base and query
  let [base1, query1 = ''] = normalized1.split('?');
  let [base2, query2 = ''] = normalized2.split('?');

  // Remove trailing slashes
  base1 = base1.replace(/\\/+$/, '');
  base2 = base2.replace(/\\/+$/, '');

  // Compare base paths (case-sensitive)
  if (base1 !== base2) {
    return false;
  }

  // Compare query parameters
  return query1 === query2;
}

// Task 4: Query Parameter Validator
class QueryValidator {
  constructor() {
    this.rules = new Map();
    this.errors = [];
  }

  addRule(key, rule) {
    this.rules.set(key, rule);
    return this;
  }

  validate(queryStr) {
    this.errors = [];
    const params = querystring.parse(queryStr);

    // Validate each rule
    for (const [key, rule] of this.rules.entries()) {
      const value = params[key];

      // Required check
      if (rule.required && !value) {
        this.errors.push(`Missing required parameter: ${key}`);
        continue;
      }

      if (!value) continue;

      try {
        // Type validation
        if (rule.type) {
          this.validateType(key, value, rule.type);
        }

        // Range validation (for numbers)
        if (rule.min !== undefined || rule.max !== undefined) {
          const num = Number(value);
          if (isNaN(num)) {
            this.errors.push(`${key} must be a number`);
          } else {
            if (rule.min !== undefined && num < rule.min) {
              this.errors.push(`${key} must be at least ${rule.min}`);
            }
            if (rule.max !== undefined && num > rule.max) {
              this.errors.push(`${key} must be at most ${rule.max}`);
            }
          }
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
          this.errors.push(`${key} does not match required pattern`);
        }

        // Enum validation
        if (rule.enum && !rule.enum.includes(value)) {
          this.errors.push(`${key} must be one of: ${rule.enum.join(', ')}`);
        }
      } catch (error) {
        this.errors.push(error.message);
      }
    }

    if (this.errors.length > 0) {
      throw new Error(`Validation failed: ${this.errors.join('; ')}`);
    }

    return true;
  }

  validateType(key, value, expectedType) {
    switch (expectedType) {
      case 'number':
        if (isNaN(Number(value))) {
          throw new Error(`${key} must be a number`);
        }
        break;

      case 'email':
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error(`${key} must be a valid email`);
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch {
          throw new Error(`${key} must be a valid URL`);
        }
        break;

      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          throw new Error(`${key} must be a boolean`);
        }
        break;

      case 'string':
        // Always passes
        break;

      default:
        throw new Error(`Unknown type: ${expectedType}`);
    }
  }

  getErrors() {
    return this.errors;
  }
}

// Test implementations
console.log('=== Level 3 Exercise 1 Solutions ===\\n');

// Test Task 1: SecureUrlBuilder
console.log('Task 1: SecureUrlBuilder');
try {
  const builder = new SecureUrlBuilder('https://api.example.com/search');
  builder.addParam('q', 'nodejs');
  builder.addParam('page', 2);
  builder.addParam('safe', '<script>alert("xss")</script>'); // Will be sanitized

  console.log('Built URL:', builder.build());
  builder.validate();
  console.log('✓ Validation passed\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 2: URL Normalization
console.log('Task 2: URL Normalization');
try {
  const normalized = normalizeUrl('/search?z=3&a=1&b=&a=2');
  console.log('Normalized:', normalized);
  console.log('✓ Task 2 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 3: URL Comparison
console.log('Task 3: URL Comparison');
try {
  const equiv1 = areUrlsEquivalent('/page?a=1&b=2', '/page?b=2&a=1');
  const equiv2 = areUrlsEquivalent('/page?a=1', '/page?a=2');

  console.log('URLs equivalent (should be true):', equiv1);
  console.log('URLs equivalent (should be false):', equiv2);
  console.log('✓ Task 3 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 4: Query Validator
console.log('Task 4: Query Validator');
try {
  const validator = new QueryValidator();
  validator.addRule('age', { type: 'number', required: true, min: 0, max: 120 });
  validator.addRule('email', { type: 'email', required: true });
  validator.addRule('status', { enum: ['active', 'inactive', 'pending'] });

  validator.validate('age=25&email=test@example.com&status=active');
  console.log('✓ Validation passed\\n');

  try {
    validator.validate('age=150&email=invalid');
  } catch (error) {
    console.log('✓ Correctly caught invalid input:', error.message);
  }

  console.log('✓ Task 4 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

console.log('=== All Solutions Complete ===');

module.exports = {
  SecureUrlBuilder,
  normalizeUrl,
  areUrlsEquivalent,
  QueryValidator
};
