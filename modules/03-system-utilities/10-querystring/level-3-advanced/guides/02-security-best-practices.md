# Security Best Practices Guide

## Overview

Query strings are a common attack vector for web applications. This guide covers comprehensive security measures for handling query strings safely in production.

## Table of Contents

1. [Threat Model](#threat-model)
2. [Input Validation](#input-validation)
3. [XSS Prevention](#xss-prevention)
4. [SQL Injection Prevention](#sql-injection-prevention)
5. [Parameter Pollution](#parameter-pollution)
6. [Rate Limiting](#rate-limiting)
7. [Security Headers](#security-headers)
8. [Audit and Monitoring](#audit-and-monitoring)

## Threat Model

### Common Attack Vectors

```
┌──────────────────────────────────────┐
│  Query String Attack Vectors         │
├──────────────────────────────────────┤
│  1. XSS (Cross-Site Scripting)      │
│  2. SQL Injection                    │
│  3. Command Injection                │
│  4. Path Traversal                   │
│  5. Parameter Pollution              │
│  6. Open Redirect                    │
│  7. CSRF (via query parameters)      │
│  8. Information Disclosure           │
│  9. DoS (Resource Exhaustion)        │
│  10. Session Fixation                │
└──────────────────────────────────────┘
```

### Risk Assessment

| Attack Type | Severity | Likelihood | Mitigation Priority |
|------------|----------|------------|-------------------|
| XSS | High | High | Critical |
| SQL Injection | Critical | Medium | Critical |
| Parameter Pollution | Medium | High | High |
| DoS | Medium | Medium | High |
| Information Disclosure | Medium | Low | Medium |

## Input Validation

### Validation Framework

```javascript
class SecureQueryValidator {
  constructor() {
    this.rules = new Map();
    this.errors = [];
  }

  addRule(param, rule) {
    this.rules.set(param, rule);
    return this;
  }

  validate(params) {
    this.errors = [];

    for (const [param, value] of Object.entries(params)) {
      const rule = this.rules.get(param);

      if (!rule) {
        // Strict mode: reject unknown parameters
        if (this.strictMode) {
          this.errors.push(`Unknown parameter: ${param}`);
        }
        continue;
      }

      try {
        this.validateParameter(param, value, rule);
      } catch (error) {
        this.errors.push(error.message);
      }
    }

    if (this.errors.length > 0) {
      throw new ValidationError(this.errors);
    }

    return true;
  }

  validateParameter(param, value, rule) {
    // Type validation
    if (rule.type) {
      this.validateType(param, value, rule.type);
    }

    // Length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      throw new Error(
        `${param} exceeds maximum length of ${rule.maxLength}`
      );
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      throw new Error(`${param} does not match required pattern`);
    }

    // Whitelist validation
    if (rule.enum && !rule.enum.includes(value)) {
      throw new Error(`${param} must be one of: ${rule.enum.join(', ')}`);
    }

    // Range validation
    if (rule.min !== undefined || rule.max !== undefined) {
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`${param} must be a number`);
      }
      if (rule.min !== undefined && num < rule.min) {
        throw new Error(`${param} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && num > rule.max) {
        throw new Error(`${param} must be at most ${rule.max}`);
      }
    }

    // Custom validator
    if (rule.validator && !rule.validator(value)) {
      throw new Error(`${param} failed custom validation`);
    }
  }

  validateType(param, value, expectedType) {
    switch (expectedType) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new Error(`${param} must be a valid email`);
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch {
          throw new Error(`${param} must be a valid URL`);
        }
        break;

      case 'uuid':
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
          throw new Error(`${param} must be a valid UUID`);
        }
        break;

      case 'alphanumeric':
        if (!/^[a-zA-Z0-9]+$/.test(value)) {
          throw new Error(`${param} must be alphanumeric`);
        }
        break;
    }
  }
}
```

### Example Usage

```javascript
const validator = new SecureQueryValidator();

validator
  .addRule('id', {
    type: 'uuid',
    required: true
  })
  .addRule('email', {
    type: 'email',
    required: true,
    maxLength: 255
  })
  .addRule('age', {
    type: 'number',
    min: 0,
    max: 120
  })
  .addRule('role', {
    enum: ['user', 'admin', 'moderator']
  })
  .addRule('search', {
    maxLength: 500,
    pattern: /^[a-zA-Z0-9\s]+$/,
    validator: (value) => !value.includes('script')
  });

try {
  validator.validate(querystring.parse(req.url.split('?')[1]));
} catch (error) {
  return res.status(400).json({ errors: error.errors });
}
```

## XSS Prevention

### HTML Sanitization

```javascript
class XSSProtector {
  static sanitizeHtml(str) {
    if (typeof str !== 'string') return str;

    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return str.replace(/[&<>"'\/]/g, char => htmlEntities[char]);
  }

  static removeHtml(str) {
    return str.replace(/<[^>]*>/g, '');
  }

  static sanitizeForAttribute(str) {
    // Extra strict for attribute context
    return str
      .replace(/[&<>"'`=]/g, char => {
        const code = char.charCodeAt(0);
        return `&#${code};`;
      });
  }

  static sanitizeForJS(str) {
    // Escape for JavaScript context
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  static detectXSS(str) {
    const patterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers
      /<iframe/gi,
      /onerror\s*=/gi,
      /onload\s*=/gi,
      /<object/gi,
      /<embed/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ];

    for (const pattern of patterns) {
      if (pattern.test(str)) {
        return true;
      }
    }

    return false;
  }

  static sanitizeParams(params) {
    const sanitized = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        if (this.detectXSS(value)) {
          throw new Error(`XSS attempt detected in parameter: ${key}`);
        }
        sanitized[key] = this.sanitizeHtml(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(v =>
          typeof v === 'string' ? this.sanitizeHtml(v) : v
        );
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
```

### Content Security Policy

```javascript
class CSPManager {
  static setSecureHeaders(res) {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'nonce-{RANDOM}'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
    );

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }
}
```

## SQL Injection Prevention

### Parameterized Queries

```javascript
class SafeQueryBuilder {
  constructor(db) {
    this.db = db;
  }

  async search(filters) {
    // NEVER concatenate user input into SQL
    const conditions = [];
    const params = [];

    // Whitelist approach for filter fields
    const allowedFields = ['name', 'category', 'price', 'rating'];

    for (const [field, value] of Object.entries(filters)) {
      if (!allowedFields.includes(field)) {
        throw new Error(`Invalid filter field: ${field}`);
      }

      conditions.push(`${field} = ?`);
      params.push(value);
    }

    const sql = `
      SELECT id, name, category, price
      FROM products
      WHERE ${conditions.join(' AND ')}
    `;

    // Use parameterized query
    return await this.db.query(sql, params);
  }

  validateFieldName(field) {
    // Only allow alphanumeric and underscore
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
      throw new Error('Invalid field name');
    }

    // Whitelist allowed fields
    const allowedFields = ['id', 'name', 'email', 'created_at'];
    if (!allowedFields.includes(field)) {
      throw new Error(`Field not allowed: ${field}`);
    }

    return field;
  }

  buildSortClause(sort, order) {
    // Validate sort field
    const field = this.validateFieldName(sort);

    // Validate order direction
    const direction = order === 'desc' ? 'DESC' : 'ASC';

    return `ORDER BY ${field} ${direction}`;
  }
}
```

### SQL Injection Detection

```javascript
class SQLInjectionDetector {
  static isSafe(str) {
    const dangerous = [
      /('|\"|;|--|\\/\\*|\\*\\/)/i,  // SQL special chars
      /\\b(select|insert|update|delete|drop|create|alter|exec|execute|union)\\b/i,  // SQL keywords
      /\\bxp_\\w+/i,  // SQL Server extended procedures
      /\\bsp_\\w+/i,  // SQL Server stored procedures
      /information_schema/i,
      /\\/\\*.*\\*\\//,  // SQL comments
      /--.*$/m  // SQL line comments
    ];

    for (const pattern of dangerous) {
      if (pattern.test(str)) {
        return false;
      }
    }

    return true;
  }

  static sanitize(str) {
    if (!this.isSafe(str)) {
      throw new Error('Potential SQL injection detected');
    }
    return str;
  }

  static validateParams(params) {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && !this.isSafe(value)) {
        throw new Error(
          `Potential SQL injection in parameter: ${key}`
        );
      }
    }
    return params;
  }
}
```

## Parameter Pollution

### Pollution Prevention

```javascript
class ParameterPollutionPreventer {
  static prevent(params, config = {}) {
    const {
      strategy = 'last',  // 'first', 'last', 'array', 'error'
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
            throw new Error(
              `Parameter pollution detected for: ${key}`
            );

          default:
            cleaned[key] = value[value.length - 1];
        }
      } else {
        cleaned[key] = value;
      }
    }

    if (pollutionAttempts.length > 0) {
      console.warn('Parameter pollution detected:', pollutionAttempts);
    }

    return {
      params: cleaned,
      pollutionDetected: pollutionAttempts.length > 0,
      pollutionAttempts
    };
  }
}

// Usage
const result = ParameterPollutionPreventer.prevent(params, {
  strategy: 'last',
  perParam: {
    id: 'error',      // Throw error if id is duplicated
    tags: 'array',    // Allow array for tags
    email: 'first'    // Take first email
  }
});
```

## Rate Limiting

### Query-Based Rate Limiting

```javascript
class QueryRateLimiter {
  constructor(options = {}) {
    this.maxRequests = options.maxRequests || 100;
    this.windowMs = options.windowMs || 60000;
    this.store = new Map();
  }

  async checkLimit(identifier, queryStr) {
    const key = this.generateKey(identifier, queryStr);
    const now = Date.now();

    // Clean up old entries
    this.cleanup(now);

    // Get current count
    const record = this.store.get(key) || {
      count: 0,
      resetAt: now + this.windowMs,
      queries: []
    };

    // Check if limit exceeded
    if (record.count >= this.maxRequests) {
      const remainingMs = record.resetAt - now;

      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil(remainingMs / 1000)}s`,
        {
          limit: this.maxRequests,
          remaining: 0,
          resetAt: new Date(record.resetAt)
        }
      );
    }

    // Increment count
    record.count++;
    record.queries.push({ queryStr, timestamp: now });
    this.store.set(key, record);

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - record.count,
      resetAt: new Date(record.resetAt)
    };
  }

  generateKey(identifier, queryStr) {
    // Create fingerprint of query
    const params = querystring.parse(queryStr);
    const sorted = Object.keys(params).sort().join(',');
    return `${identifier}:${sorted}`;
  }

  cleanup(now) {
    for (const [key, record] of this.store.entries()) {
      if (record.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  // Detect suspicious patterns
  detectAnomalies(identifier) {
    const records = Array.from(this.store.entries())
      .filter(([key]) => key.startsWith(identifier));

    const queries = records.flatMap(([_, record]) => record.queries);

    // Check for rapid-fire identical queries
    const duplicates = this.findDuplicates(queries);
    if (duplicates.length > 10) {
      return {
        suspicious: true,
        reason: 'Rapid duplicate queries detected',
        count: duplicates.length
      };
    }

    return { suspicious: false };
  }

  findDuplicates(queries) {
    const seen = new Map();
    const duplicates = [];

    for (const query of queries) {
      const count = seen.get(query.queryStr) || 0;
      seen.set(query.queryStr, count + 1);

      if (count > 0) {
        duplicates.push(query);
      }
    }

    return duplicates;
  }
}
```

## Security Headers

```javascript
class SecurityHeaderMiddleware {
  static apply(req, res, next) {
    // Strict Transport Security
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    // Content Type Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Frame Options
    res.setHeader('X-Frame-Options', 'DENY');

    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()'
    );

    next();
  }
}
```

## Audit and Monitoring

### Security Logging

```javascript
class SecurityAuditLogger {
  log(event, context) {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      severity: this.calculateSeverity(event),
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      queryString: this.sanitizeForLog(context.queryString),
      details: context.details
    };

    // Log to security audit system
    this.sendToAudit(entry);

    // Alert on high severity
    if (entry.severity === 'critical') {
      this.sendAlert(entry);
    }
  }

  calculateSeverity(event) {
    const severityMap = {
      xss_attempt: 'critical',
      sql_injection_attempt: 'critical',
      rate_limit_exceeded: 'high',
      parameter_pollution: 'medium',
      validation_failed: 'low'
    };

    return severityMap[event] || 'low';
  }

  sanitizeForLog(queryStr) {
    // Remove sensitive data before logging
    const params = querystring.parse(queryStr);
    const sanitized = { ...params };

    const sensitiveFields = [
      'password', 'token', 'apiKey', 'secret',
      'creditCard', 'ssn', 'pin'
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return querystring.stringify(sanitized);
  }
}
```

## Security Checklist

- [ ] Validate all query parameters against a schema
- [ ] Sanitize input to prevent XSS
- [ ] Use parameterized queries to prevent SQL injection
- [ ] Implement parameter pollution prevention
- [ ] Set appropriate rate limits
- [ ] Add security headers
- [ ] Log security events
- [ ] Monitor for attack patterns
- [ ] Implement CSRF protection
- [ ] Use HTTPS only
- [ ] Set maximum query string length
- [ ] Validate data types strictly
- [ ] Use whitelists over blacklists
- [ ] Implement proper error handling (don't leak info)
- [ ] Regular security audits and penetration testing

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Query Parameterization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Query_Parameterization_Cheat_Sheet.html)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [CWE-79: XSS](https://cwe.mitre.org/data/definitions/79.html)
