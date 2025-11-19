/**
 * Example 3: Advanced Debugging Scenarios and Tools
 *
 * Demonstrates complex debugging patterns combining util.inspect(),
 * util.debuglog(), custom formatting, and production debugging strategies.
 */

const util = require('util');
const fs = require('fs');
const path = require('path');

console.log('=== Advanced Debugging Scenarios ===\n');

// =============================================================================
// 1. Multi-Level Debug System
// =============================================================================
console.log('1. Multi-Level Debug System\n');

class DebugLogger {
  constructor(namespace, options = {}) {
    this.namespace = namespace;
    this.level = options.level || 'info';
    this.debuglog = util.debuglog(namespace);
    this.colorize = options.colorize !== false;

    this.levels = {
      trace: 0,
      debug: 1,
      info: 2,
      warn: 3,
      error: 4
    };
  }

  log(level, message, data) {
    const levelNum = this.levels[level] || this.levels.info;
    const currentLevelNum = this.levels[this.level];

    if (levelNum < currentLevelNum) {
      return; // Below threshold
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.namespace}]`;

    if (data !== undefined) {
      const inspected = util.inspect(data, {
        depth: 5,
        colors: this.colorize && process.stdout.isTTY,
        compact: false,
        breakLength: 80
      });
      console.log(`${prefix} ${message}\n${inspected}`);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  trace(message, data) { this.log('trace', message, data); }
  debug(message, data) { this.log('debug', message, data); }
  info(message, data) { this.log('info', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  error(message, data) { this.log('error', message, data); }

  // Special debug with NODE_DEBUG
  debugConditional(message, data) {
    this.debuglog(message, data);
  }
}

const logger = new DebugLogger('myapp', { level: 'debug', colorize: true });

logger.debug('Debug message', { operation: 'test', status: 'running' });
logger.info('Info message');
logger.warn('Warning message', { warning: 'Low memory', available: '10%' });
logger.trace('Trace message'); // Won't show (below debug)

console.log('');

// =============================================================================
// 2. Custom Inspect for Debugging
// =============================================================================
console.log('2. Custom Inspect for Debug-Friendly Objects\n');

class DebugFriendlyUser {
  constructor(id, name, email, password, sessionToken) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password; // Sensitive!
    this.sessionToken = sessionToken; // Sensitive!
    this.createdAt = new Date();
  }

  [util.inspect.custom](depth, options, inspect) {
    // Check if in production
    const isProduction = process.env.NODE_ENV === 'production';

    // In production, hide sensitive data
    if (isProduction) {
      return `User { id: ${this.id}, name: "${this.name}", email: "${this.email}" }`;
    }

    // In development, show more but still hide password
    return `User {
  id: ${this.id},
  name: "${this.name}",
  email: "${this.email}",
  password: "[HIDDEN]",
  sessionToken: "${this.sessionToken.substring(0, 8)}...",
  createdAt: ${this.createdAt.toISOString()}
}`;
  }
}

const user = new DebugFriendlyUser(
  1,
  'Alice',
  'alice@example.com',
  'super_secret_password',
  'abc123def456ghi789'
);

console.log('User object:');
console.log(user);
console.log('');

// =============================================================================
// 3. Contextual Debugging
// =============================================================================
console.log('3. Context-Aware Debugging\n');

class ContextualDebugger {
  constructor(context) {
    this.context = context;
  }

  inspect(obj, message) {
    const enriched = {
      ...this.context,
      timestamp: new Date().toISOString(),
      message,
      data: obj
    };

    return util.inspect(enriched, {
      depth: null,
      colors: process.stdout.isTTY,
      compact: false
    });
  }

  log(obj, message) {
    console.log(this.inspect(obj, message));
  }
}

// Create debugger with context
const debugger = new ContextualDebugger({
  service: 'api-server',
  version: '1.2.3',
  environment: 'development',
  requestId: 'req-12345'
});

debugger.log({ userId: 1, action: 'login' }, 'User action');
console.log('');

// =============================================================================
// 4. Error Debugging with Stack Traces
// =============================================================================
console.log('4. Enhanced Error Debugging\n');

class DetailedError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = this.constructor.name;
    this.context = context;
    this.timestamp = new Date();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  [util.inspect.custom](depth, options) {
    return util.inspect({
      name: this.name,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack.split('\n').slice(0, 5).join('\n') // First 5 lines
    }, {
      ...options,
      depth: null,
      colors: true
    });
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

try {
  throw new DetailedError('Database connection failed', {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    attempt: 3
  });
} catch (err) {
  console.log('Caught error:');
  console.log(err);
  console.log('');
}

// =============================================================================
// 5. Performance Debugging
// =============================================================================
console.log('5. Performance Debugging\n');

class PerformanceDebugger {
  constructor() {
    this.timers = new Map();
    this.metrics = [];
  }

  start(label) {
    this.timers.set(label, process.hrtime.bigint());
  }

  end(label, context = {}) {
    const start = this.timers.get(label);
    if (!start) {
      console.warn(`No timer found for: ${label}`);
      return;
    }

    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1_000_000; // Convert to ms

    const metric = {
      label,
      duration,
      timestamp: new Date(),
      ...context
    };

    this.metrics.push(metric);
    this.timers.delete(label);

    return metric;
  }

  report() {
    console.log('Performance Report:');
    console.log(util.inspect(this.metrics, {
      depth: null,
      colors: true,
      compact: false
    }));

    // Summary statistics
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const avg = total / this.metrics.length;
    const max = Math.max(...this.metrics.map(m => m.duration));
    const min = Math.min(...this.metrics.map(m => m.duration));

    console.log('\nSummary:');
    console.log(`  Total: ${total.toFixed(2)}ms`);
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
  }
}

const perfDebugger = new PerformanceDebugger();

// Simulate some operations
perfDebugger.start('operation1');
setTimeout(() => {
  perfDebugger.end('operation1', { type: 'database' });

  perfDebugger.start('operation2');
  setTimeout(() => {
    perfDebugger.end('operation2', { type: 'api-call' });

    perfDebugger.start('operation3');
    setTimeout(() => {
      perfDebugger.end('operation3', { type: 'computation' });

      perfDebugger.report();
      console.log('');
    }, 15);
  }, 25);
}, 30);

// =============================================================================
// 6. Circular Reference Debugging
// =============================================================================
setTimeout(() => {
  console.log('6. Debugging Circular References\n');

  // Create circular structure
  const obj = { name: 'root' };
  const child1 = { name: 'child1', parent: obj };
  const child2 = { name: 'child2', parent: obj };
  obj.children = [child1, child2];

  console.log('Object with circular references:');
  console.log(util.inspect(obj, {
    depth: 5,
    colors: true,
    showHidden: false,
    circular: true // Default, but explicit
  }));
  console.log('');

  // Custom handler for circular refs
  function inspectWithCircularHandler(obj, seen = new WeakSet()) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (seen.has(obj)) {
      return '[Circular]';
    }

    seen.add(obj);

    if (Array.isArray(obj)) {
      return obj.map(item => inspectWithCircularHandler(item, seen));
    }

    const result = {};
    for (const key in obj) {
      result[key] = inspectWithCircularHandler(obj[key], seen);
    }

    return result;
  }

  console.log('Custom circular handler:');
  console.log(util.inspect(inspectWithCircularHandler(obj), { depth: null, colors: true }));
  console.log('');
}, 200);

// =============================================================================
// 7. Request/Response Debugging
// =============================================================================
setTimeout(() => {
  console.log('7. HTTP Request/Response Debugging\n');

  class RequestLogger {
    static logRequest(req) {
      const sanitized = {
        method: req.method,
        url: req.url,
        headers: this.sanitizeHeaders(req.headers),
        timestamp: new Date().toISOString()
      };

      console.log('Incoming Request:');
      console.log(util.inspect(sanitized, {
        depth: null,
        colors: true,
        compact: false
      }));
    }

    static logResponse(res, duration) {
      const sanitized = {
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        headers: this.sanitizeHeaders(res.headers),
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      };

      console.log('Outgoing Response:');
      console.log(util.inspect(sanitized, {
        depth: null,
        colors: true,
        compact: false
      }));
    }

    static sanitizeHeaders(headers) {
      const sanitized = { ...headers };

      // Hide sensitive headers
      const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key'];
      for (const header of sensitiveHeaders) {
        if (sanitized[header]) {
          sanitized[header] = '[REDACTED]';
        }
      }

      return sanitized;
    }
  }

  // Simulate request/response
  const mockReq = {
    method: 'POST',
    url: '/api/users',
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer secret_token_here',
      'user-agent': 'Node.js'
    }
  };

  const mockRes = {
    statusCode: 201,
    statusMessage: 'Created',
    headers: {
      'content-type': 'application/json',
      'set-cookie': 'session=abc123; HttpOnly'
    }
  };

  RequestLogger.logRequest(mockReq);
  console.log('');
  RequestLogger.logResponse(mockRes, 45.2);
  console.log('');
}, 300);

// =============================================================================
// 8. Production Debug Formatter
// =============================================================================
setTimeout(() => {
  console.log('8. Production-Ready Debug Formatter\n');

  class ProductionDebugger {
    constructor(options = {}) {
      this.environment = options.environment || process.env.NODE_ENV || 'development';
      this.maxDepth = options.maxDepth || 3;
      this.includeTimestamp = options.includeTimestamp !== false;
      this.redactFields = options.redactFields || ['password', 'token', 'secret', 'apiKey'];
    }

    format(data, context = {}) {
      const formatted = {
        ...(this.includeTimestamp && { timestamp: new Date().toISOString() }),
        environment: this.environment,
        ...context,
        data: this.redact(data)
      };

      if (this.environment === 'production') {
        // JSON format for production (for log aggregation)
        return JSON.stringify(formatted);
      } else {
        // Pretty format for development
        return util.inspect(formatted, {
          depth: this.maxDepth,
          colors: true,
          compact: false,
          breakLength: 100
        });
      }
    }

    redact(obj) {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(item => this.redact(item));
      }

      const redacted = {};
      for (const [key, value] of Object.entries(obj)) {
        if (this.redactFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          redacted[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          redacted[key] = this.redact(value);
        } else {
          redacted[key] = value;
        }
      }

      return redacted;
    }

    log(level, message, data, context = {}) {
      const output = this.format(data, {
        level,
        message,
        ...context
      });

      console.log(output);
    }
  }

  const prodDebugger = new ProductionDebugger({
    environment: 'development',
    maxDepth: 5
  });

  prodDebugger.log('info', 'User login', {
    userId: 123,
    email: 'user@example.com',
    password: 'should_be_hidden',
    sessionToken: 'also_should_be_hidden',
    metadata: {
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    }
  });

  console.log('\n');

  // Production mode (JSON)
  const prodDebuggerProd = new ProductionDebugger({
    environment: 'production'
  });

  console.log('Production format (JSON):');
  prodDebuggerProd.log('error', 'Database error', {
    error: 'Connection timeout',
    database: 'users',
    password: 'should_be_hidden'
  });

  console.log('');
}, 400);

// =============================================================================
// Key Takeaways
// =============================================================================
setTimeout(() => {
  console.log('\n=== Key Takeaways ===');
  console.log('1. Build multi-level debug systems with util.debuglog()');
  console.log('2. Use custom inspect to hide sensitive data');
  console.log('3. Add context to all debug output');
  console.log('4. Handle circular references properly');
  console.log('5. Sanitize headers and sensitive fields');
  console.log('6. Use JSON format in production, pretty format in dev');
  console.log('7. Track performance with timing metrics');
  console.log('8. Always redact sensitive data before logging');
}, 500);
