/**
 * Example 2: Security and Validation
 *
 * Comprehensive security measures for query string handling.
 */

const querystring = require('querystring');

class SecureQueryHandler {
  // XSS Prevention
  static sanitizeHtml(str) {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // SQL Injection Prevention
  static validateSqlSafe(str) {
    const dangerous = /('|"|;|--|\/\*|\*\/|xp_|sp_|exec|execute|select|insert|update|delete|drop|create|alter)/i;
    
    if (dangerous.test(str)) {
      throw new Error(`Potentially dangerous SQL pattern detected: ${str}`);
    }
    
    return true;
  }

  // Parameter Pollution Prevention
  static ensureSingleValue(params, keys) {
    for (const key of keys) {
      if (Array.isArray(params[key])) {
        params[key] = params[key][0]; // Take first value only
      }
    }
    return params;
  }

  // Whitelist Validation
  static validateWhitelist(value, allowedValues) {
    if (!allowedValues.includes(value)) {
      throw new Error(`Value "${value}" not in whitelist`);
    }
    return value;
  }

  // Type Validation
  static validateType(value, expectedType) {
    const parsers = {
      number: (v) => {
        const num = Number(v);
        if (isNaN(num)) throw new Error(`Expected number, got: ${v}`);
        return num;
      },
      boolean: (v) => v === 'true' || v === '1',
      email: (v) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(v)) throw new Error(`Invalid email: ${v}`);
        return v;
      },
      url: (v) => {
        try {
          new URL(v);
          return v;
        } catch {
          throw new Error(`Invalid URL: ${v}`);
        }
      }
    };

    const parser = parsers[expectedType];
    if (!parser) throw new Error(`Unknown type: ${expectedType}`);
    
    return parser(value);
  }

  // Range Validation
  static validateRange(value, min, max) {
    const num = Number(value);
    if (isNaN(num)) throw new Error(`Not a number: ${value}`);
    if (num < min || num > max) {
      throw new Error(`Value ${num} out of range [${min}, ${max}]`);
    }
    return num;
  }

  // Complete validation example
  static validateSearchParams(queryStr) {
    const params = querystring.parse(queryStr);
    
    // Validate and sanitize
    const validated = {
      q: params.q ? this.sanitizeHtml(params.q.substring(0, 200)) : '',
      page: this.validateRange(params.page || 1, 1, 1000),
      limit: this.validateRange(params.limit || 20, 1, 100),
      sort: this.validateWhitelist(params.sort || 'relevance', ['relevance', 'date', 'price']),
      order: this.validateWhitelist(params.order || 'desc', ['asc', 'desc'])
    };

    return validated;
  }
}

// Demo
console.log('=== Security and Validation Demo ===\n');

try {
  // XSS attempt
  const malicious = '<script>alert("XSS")</script>';
  console.log('Malicious input:', malicious);
  console.log('Sanitized:', SecureQueryHandler.sanitizeHtml(malicious));
  console.log('');

  // SQL injection attempt
  try {
    SecureQueryHandler.validateSqlSafe("admin'; DROP TABLE users--");
  } catch (err) {
    console.log('SQL injection blocked:', err.message);
  }
  console.log('');

  // Valid search params
  const valid = SecureQueryHandler.validateSearchParams(
    'q=nodejs&page=2&limit=50&sort=date&order=asc'
  );
  console.log('Validated params:', valid);
  console.log('');

  // Invalid params
  try {
    SecureQueryHandler.validateSearchParams('page=9999&sort=invalid');
  } catch (err) {
    console.log('Validation error:', err.message);
  }

} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n✓ Security validation is essential for production!');

module.exports = SecureQueryHandler;
