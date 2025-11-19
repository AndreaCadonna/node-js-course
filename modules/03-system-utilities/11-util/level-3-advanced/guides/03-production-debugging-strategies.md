# Guide 3: Production Debugging Strategies

**Reading time**: 15 minutes

## Introduction

Production debugging requires different strategies than development. This guide covers using util functions effectively in production environments without impacting performance.

## The Problem with console.log in Production

### Why It's Problematic

```javascript
// ❌ Bad: Always runs, even in production
function processRequest(req) {
  console.log('Request:', util.inspect(req, { depth: 10 }));  // Expensive!
  // ...
}
```

Problems:
1. **Performance**: Inspection and logging are expensive
2. **Noise**: Too much output makes logs useless
3. **Security**: May leak sensitive data
4. **Storage**: Generates massive log files

## Using util.debuglog() Correctly

### Basic Usage

```javascript
const util = require('util');
const debuglog = util.debuglog('myapp');

function processRequest(req) {
  // Only logs when NODE_DEBUG=myapp
  debuglog('Request: %O', req);
  // ...
}
```

### Benefits

1. **Zero cost when disabled** (compiled out)
2. **Namespaced** (enable specific modules)
3. **Environment controlled** (no code changes)

### Enable Debug Logging

```bash
# Enable for specific namespace
NODE_DEBUG=myapp node server.js

# Multiple namespaces
NODE_DEBUG=myapp,database node server.js

# All debug output
NODE_DEBUG=* node server.js
```

## Structured Logging for Production

### The Problem with Unstructured Logs

```javascript
// ❌ Hard to parse
console.log('User login failed for ' + userId + ' from ' + ip);
```

### Structured Logging Solution

```javascript
const util = require('util');

class StructuredLogger {
  constructor(service) {
    this.service = service;
    this.environment = process.env.NODE_ENV || 'development';
  }

  log(level, message, context = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      environment: this.environment,
      message,
      ...context
    };

    // JSON for production (for log aggregators)
    if (this.environment === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      // Pretty for development
      console.log(util.inspect(entry, { depth: null, colors: true }));
    }
  }

  info(message, context) { this.log('info', message, context); }
  error(message, context) { this.log('error', message, context); }
  warn(message, context) { this.log('warn', message, context); }
}
```

## Sensitive Data Redaction

### Why It Matters

```javascript
// ❌ Dangerous: Logs passwords!
logger.info('User login', {
  username: 'alice',
  password: 'secret123',  // Leaked!
  sessionToken: 'abc123'  // Leaked!
});
```

### Automatic Redaction

```javascript
class SecureLogger extends StructuredLogger {
  constructor(service, options = {}) {
    super(service);
    this.sensitiveKeys = options.sensitiveKeys || [
      'password', 'token', 'secret', 'apikey', 'authorization'
    ];
  }

  sanitize(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.sanitize(item));

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = this.sensitiveKeys.some(s =>
        key.toLowerCase().includes(s.toLowerCase())
      );

      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.sanitize(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  log(level, message, context = {}) {
    const sanitized = this.sanitize(context);
    super.log(level, message, sanitized);
  }
}

// Usage
const logger = new SecureLogger('auth-service');

logger.info('User login', {
  username: 'alice',
  password: 'secret123',  // Becomes [REDACTED]
  sessionToken: 'abc123'  // Becomes [REDACTED]
});
```

## Context Propagation

### The Problem

```javascript
// How do you correlate logs from the same request?
function handleRequest(req) {
  logger.info('Request received');  // Which request?
  processData();
  logger.info('Request complete');  // Same request? Different request?
}
```

### Solution: Request ID

```javascript
class ContextualLogger {
  constructor(service) {
    this.service = service;
    this.contexts = new Map();
  }

  createContext(requestId, data = {}) {
    this.contexts.set(requestId, {
      requestId,
      createdAt: new Date(),
      ...data
    });
    return requestId;
  }

  log(requestId, level, message, additionalContext = {}) {
    const context = this.contexts.get(requestId) || {};

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...context,
      ...additionalContext
    }));
  }

  clearContext(requestId) {
    this.contexts.delete(requestId);
  }
}

// Usage
const logger = new ContextualLogger('api-server');

app.use((req, res, next) => {
  const requestId = 'req-' + Date.now();
  logger.createContext(requestId, {
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  req.requestId = requestId;
  next();
});

app.get('/users', (req, res) => {
  logger.log(req.requestId, 'info', 'Fetching users');

  // Later...
  logger.log(req.requestId, 'info', 'Users fetched', { count: 100 });

  // Cleanup
  logger.clearContext(req.requestId);
});
```

## Custom Inspect for Production

### Environment-Aware Inspection

```javascript
class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.apiKey = data.apiKey;
  }

  [util.inspect.custom](depth, options) {
    const env = process.env.NODE_ENV;

    // Production: Minimal info
    if (env === 'production') {
      return `User { id: ${this.id} }`;
    }

    // Development: More info, but redacted
    return `User {
  id: ${this.id},
  email: "${this.email}",
  password: "[HIDDEN]",
  apiKey: "[HIDDEN]"
}`;
  }
}
```

## Performance Timing

### Track Operation Duration

```javascript
class TimingLogger {
  constructor() {
    this.timers = new Map();
  }

  start(label, context = {}) {
    this.timers.set(label, {
      start: process.hrtime.bigint(),
      context
    });
  }

  end(label, additionalContext = {}) {
    const timer = this.timers.get(label);
    if (!timer) return;

    const duration = Number(process.hrtime.bigint() - timer.start) / 1_000_000;

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'timing',
      label,
      duration: `${duration.toFixed(2)}ms`,
      ...timer.context,
      ...additionalContext
    }));

    this.timers.delete(label);
    return duration;
  }
}

// Usage
const timing = new TimingLogger();

timing.start('database-query', { query: 'SELECT * FROM users' });
// ... do work ...
timing.end('database-query', { rows: 150 });
```

## Error Logging Best Practices

### Rich Error Context

```javascript
class ErrorLogger {
  logError(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      ...context
    };

    // Production: JSON
    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(errorInfo));
    } else {
      // Development: Pretty
      console.error(util.inspect(errorInfo, { depth: null, colors: true }));
    }
  }
}

// Usage
try {
  await database.query(sql);
} catch (err) {
  errorLogger.logError(err, {
    operation: 'database-query',
    sql,
    database: 'users',
    requestId: req.id
  });
}
```

## Conditional Expensive Operations

### Lazy Evaluation

```javascript
// ❌ Bad: Always inspects, even if not logged
function badLogging(data) {
  const inspected = util.inspect(data, { depth: 10 });

  if (process.env.DEBUG) {
    console.log(inspected);
  }
}

// ✅ Good: Only inspects when needed
function goodLogging(data) {
  if (process.env.DEBUG) {
    console.log(util.inspect(data, { depth: 10 }));
  }
}
```

### Debug Function Pattern

```javascript
// Even better: No-op when disabled
const debug = process.env.DEBUG
  ? (msg, data) => console.log(msg, util.inspect(data))
  : () => {};  // No-op function

// Zero cost when disabled
debug('User data', userData);
```

## Log Sampling

### Reduce High-Volume Logs

```javascript
class SamplingLogger {
  constructor(sampleRate = 0.1) {  // 10% by default
    this.sampleRate = sampleRate;
  }

  shouldSample() {
    return Math.random() < this.sampleRate;
  }

  debug(message, context) {
    // Only log 10% of debug messages
    if (this.shouldSample()) {
      console.log(JSON.stringify({
        level: 'debug',
        message,
        ...context,
        sampled: true
      }));
    }
  }

  error(message, context) {
    // Always log errors
    console.error(JSON.stringify({
      level: 'error',
      message,
      ...context
    }));
  }
}
```

## Production Checklist

### Before Deploying

- [ ] Remove all `console.log()` from hot paths
- [ ] Use `util.debuglog()` for conditional debug output
- [ ] Implement structured JSON logging
- [ ] Redact all sensitive data automatically
- [ ] Add request ID for correlation
- [ ] Use environment-aware custom inspect
- [ ] Implement log sampling for high volume
- [ ] Test log aggregation pipeline
- [ ] Set up alerts for error logs
- [ ] Configure log retention policies

## Summary

- Never use console.log in production hot paths
- Use util.debuglog() for conditional debugging
- Structure logs as JSON for production
- Always redact sensitive data
- Add request context for correlation
- Use custom inspect to hide secrets
- Lazy evaluate expensive operations
- Sample high-volume logs
- Track performance with hrtime
- Different strategies for dev vs production

## Next Steps

- Implement production logging in your apps
- Read Guide 4: Performance and Optimization
- Practice with the exercises
- Set up log aggregation (ELK, Splunk, etc.)
