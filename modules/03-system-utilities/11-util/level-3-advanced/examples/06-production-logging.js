/**
 * Example 6: Enterprise-Grade Production Logging
 *
 * Demonstrates building production logging systems using util functions with
 * structured logging, performance optimization, and security considerations.
 */

const util = require('util');
const fs = require('fs');
const path = require('path');

console.log('=== Enterprise-Grade Production Logging ===\n');

// =============================================================================
// 1. Structured Logging System
// =============================================================================
console.log('1. Structured Logging System\n');

class StructuredLogger {
  constructor(options = {}) {
    this.service = options.service || 'app';
    this.version = options.version || '1.0.0';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.minLevel = options.minLevel || 'info';

    this.levels = {
      trace: 10,
      debug: 20,
      info: 30,
      warn: 40,
      error: 50,
      fatal: 60
    };
  }

  log(level, message, context = {}) {
    const levelNum = this.levels[level];
    const minLevelNum = this.levels[this.minLevel];

    if (levelNum < minLevelNum) {
      return; // Below threshold
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      version: this.version,
      environment: this.environment,
      message,
      ...context,
      ...(levelNum >= this.levels.error && context.error && {
        error: {
          message: context.error.message,
          stack: context.error.stack,
          code: context.error.code
        }
      })
    };

    // JSON format for production (for log aggregation tools)
    if (this.environment === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      // Pretty format for development
      console.log(util.inspect(logEntry, {
        depth: null,
        colors: true,
        compact: false
      }));
    }
  }

  trace(message, context) { this.log('trace', message, context); }
  debug(message, context) { this.log('debug', message, context); }
  info(message, context) { this.log('info', message, context); }
  warn(message, context) { this.log('warn', message, context); }
  error(message, context) { this.log('error', message, context); }
  fatal(message, context) { this.log('fatal', message, context); }
}

const logger = new StructuredLogger({
  service: 'api-server',
  version: '2.1.0',
  environment: 'development',
  minLevel: 'debug'
});

logger.info('Server started', { port: 3000, host: 'localhost' });
logger.debug('Database connected', { database: 'myapp', latency: '45ms' });
logger.warn('High memory usage', { usage: '85%', threshold: '80%' });

console.log('');

// =============================================================================
// 2. Sensitive Data Sanitization
// =============================================================================
console.log('2. Automatic Sensitive Data Sanitization\n');

class SanitizingLogger extends StructuredLogger {
  constructor(options = {}) {
    super(options);
    this.sensitiveKeys = options.sensitiveKeys || [
      'password', 'token', 'secret', 'apikey', 'authorization',
      'cookie', 'creditcard', 'ssn', 'private'
    ];
  }

  log(level, message, context = {}) {
    const sanitized = this.sanitize(context);
    super.log(level, message, sanitized);
  }

  sanitize(obj, depth = 0) {
    if (depth > 10) return '[Too Deep]'; // Prevent stack overflow

    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitize(item, depth + 1));
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.sensitiveKeys.some(sensitive =>
        lowerKey.includes(sensitive.toLowerCase())
      );

      if (isSensitive) {
        if (typeof value === 'string' && value.length > 8) {
          sanitized[key] = `${value.substring(0, 4)}****`;
        } else {
          sanitized[key] = '[REDACTED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

const secureLogger = new SanitizingLogger({
  service: 'auth-service',
  environment: 'development'
});

secureLogger.info('User login attempt', {
  userId: 123,
  email: 'user@example.com',
  password: 'super_secret_password',
  sessionToken: 'tok_abcdefghijklmnop',
  metadata: {
    ip: '192.168.1.1',
    apiKey: 'sk_live_secret_key'
  }
});

console.log('✅ Sensitive fields automatically redacted!\n');

// =============================================================================
// 3. Request/Response Logging
// =============================================================================
console.log('3. HTTP Request/Response Logging\n');

class HTTPLogger extends SanitizingLogger {
  logRequest(req, requestId) {
    this.info('Incoming request', {
      requestId,
      method: req.method,
      url: req.url,
      headers: this.sanitize(req.headers),
      query: req.query,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  }

  logResponse(req, res, duration, requestId) {
    const level = res.statusCode >= 500 ? 'error' :
                  res.statusCode >= 400 ? 'warn' : 'info';

    this[level]('Outgoing response', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.headers['content-length']
    });
  }

  logError(req, error, requestId) {
    this.error('Request error', {
      requestId,
      method: req.method,
      url: req.url,
      error
    });
  }
}

const httpLogger = new HTTPLogger({ service: 'api-gateway' });

// Simulate HTTP request/response
const mockReq = {
  method: 'POST',
  url: '/api/users',
  headers: {
    'content-type': 'application/json',
    'authorization': 'Bearer secret_token',
    'user-agent': 'Node.js'
  },
  query: { page: 1, limit: 10 },
  ip: '192.168.1.1'
};

const mockRes = {
  statusCode: 201,
  headers: {
    'content-type': 'application/json',
    'content-length': '256'
  }
};

const requestId = 'req-' + Date.now();

httpLogger.logRequest(mockReq, requestId);
setTimeout(() => {
  httpLogger.logResponse(mockReq, mockRes, 45, requestId);
  console.log('');
}, 100);

// =============================================================================
// 4. Performance Monitoring
// =============================================================================
setTimeout(() => {
  console.log('4. Performance Monitoring Integration\n');

  class PerformanceLogger extends SanitizingLogger {
    constructor(options = {}) {
      super(options);
      this.performanceThresholds = options.performanceThresholds || {
        slow: 1000,
        verySlow: 5000
      };
    }

    timeOperation(label) {
      const start = process.hrtime.bigint();
      const operationId = `${label}-${Date.now()}`;

      return {
        end: (context = {}) => {
          const end = process.hrtime.bigint();
          const duration = Number(end - start) / 1_000_000; // ms

          const level = duration > this.performanceThresholds.verySlow ? 'warn' :
                       duration > this.performanceThresholds.slow ? 'info' : 'debug';

          this[level]('Operation completed', {
            operation: label,
            operationId,
            duration: `${duration.toFixed(2)}ms`,
            ...context
          });

          return duration;
        }
      };
    }
  }

  const perfLogger = new PerformanceLogger({
    service: 'data-processor',
    performanceThresholds: { slow: 50, verySlow: 100 }
  });

  // Simulate operations
  const timer1 = perfLogger.timeOperation('database-query');
  setTimeout(() => {
    timer1.end({ query: 'SELECT * FROM users', rows: 150 });
  }, 30);

  const timer2 = perfLogger.timeOperation('api-call');
  setTimeout(() => {
    timer2.end({ endpoint: 'https://api.example.com/data' });
  }, 75);

  setTimeout(() => console.log(''), 150);
}, 200);

// =============================================================================
// 5. Context Propagation
// =============================================================================
setTimeout(() => {
  console.log('5. Context Propagation (Request Tracing)\n');

  class ContextualLogger extends SanitizingLogger {
    constructor(options = {}) {
      super(options);
      this.contexts = new Map();
    }

    createContext(contextId, initialContext = {}) {
      this.contexts.set(contextId, {
        ...initialContext,
        contextId,
        createdAt: new Date().toISOString()
      });
      return contextId;
    }

    getContext(contextId) {
      return this.contexts.get(contextId) || {};
    }

    logWithContext(contextId, level, message, additionalContext = {}) {
      const context = this.getContext(contextId);
      this.log(level, message, { ...context, ...additionalContext });
    }

    clearContext(contextId) {
      this.contexts.delete(contextId);
    }
  }

  const contextLogger = new ContextualLogger({ service: 'microservice' });

  // Create request context
  const reqId = contextLogger.createContext('req-12345', {
    userId: 'user-789',
    sessionId: 'session-abc',
    requestPath: '/api/orders'
  });

  // All logs include context automatically
  contextLogger.logWithContext(reqId, 'info', 'Processing order', {
    orderId: 'order-456',
    amount: 99.99
  });

  contextLogger.logWithContext(reqId, 'debug', 'Validating payment', {
    paymentMethod: 'credit_card'
  });

  contextLogger.logWithContext(reqId, 'info', 'Order completed', {
    orderId: 'order-456',
    status: 'success'
  });

  // Clean up context
  contextLogger.clearContext(reqId);

  console.log('');
}, 350);

// =============================================================================
// 6. Log Sampling and Rate Limiting
// =============================================================================
setTimeout(() => {
  console.log('6. Log Sampling and Rate Limiting\n');

  class SamplingLogger extends SanitizingLogger {
    constructor(options = {}) {
      super(options);
      this.sampleRate = options.sampleRate || 0.1; // 10% by default
      this.rateLimits = new Map();
      this.rateLimitWindow = options.rateLimitWindow || 60000; // 1 minute
    }

    log(level, message, context = {}) {
      // Check rate limit
      if (this.isRateLimited(message)) {
        return;
      }

      // Check sampling (for debug/trace)
      if ((level === 'debug' || level === 'trace') && !this.shouldSample()) {
        return;
      }

      super.log(level, message, context);
    }

    shouldSample() {
      return Math.random() < this.sampleRate;
    }

    isRateLimited(message) {
      const now = Date.now();
      const key = message;

      if (!this.rateLimits.has(key)) {
        this.rateLimits.set(key, { count: 1, windowStart: now });
        return false;
      }

      const limit = this.rateLimits.get(key);

      // Reset window if expired
      if (now - limit.windowStart > this.rateLimitWindow) {
        limit.count = 1;
        limit.windowStart = now;
        return false;
      }

      // Limit to 10 per window
      if (limit.count >= 10) {
        return true;
      }

      limit.count++;
      return false;
    }
  }

  const samplingLogger = new SamplingLogger({
    service: 'high-traffic-service',
    sampleRate: 0.2, // 20% sampling for debug logs
    rateLimitWindow: 5000 // 5 seconds
  });

  // Simulate high-volume logging
  console.log('Simulating 100 debug logs (20% sample rate)...');
  let logged = 0;
  for (let i = 0; i < 100; i++) {
    // Override console.log temporarily to count
    const originalLog = console.log;
    console.log = () => { logged++; };
    samplingLogger.debug('Debug message', { iteration: i });
    console.log = originalLog;
  }
  console.log(`✅ Only ${logged} out of 100 debug logs were written (sampling)\n`);

  console.log('Simulating rate limiting (same message 20 times)...');
  for (let i = 0; i < 20; i++) {
    samplingLogger.info('Repeated message', { attempt: i });
  }
  console.log('✅ Rate limiting prevents log spam!\n');
}, 450);

// =============================================================================
// 7. Error Aggregation
// =============================================================================
setTimeout(() => {
  console.log('7. Error Aggregation and Tracking\n');

  class ErrorTrackingLogger extends SanitizingLogger {
    constructor(options = {}) {
      super(options);
      this.errorCounts = new Map();
      this.errorExamples = new Map();
      this.reportInterval = options.reportInterval || 60000; // 1 minute

      if (options.enableReporting) {
        this.startReporting();
      }
    }

    error(message, context = {}) {
      super.error(message, context);

      // Track error
      const errorKey = context.error ? context.error.message : message;
      const count = this.errorCounts.get(errorKey) || 0;
      this.errorCounts.set(errorKey, count + 1);

      // Store example if first occurrence
      if (!this.errorExamples.has(errorKey)) {
        this.errorExamples.set(errorKey, {
          message,
          context,
          firstSeen: new Date().toISOString()
        });
      }
    }

    getErrorReport() {
      const report = {
        totalErrors: 0,
        uniqueErrors: this.errorCounts.size,
        errors: []
      };

      for (const [errorKey, count] of this.errorCounts.entries()) {
        report.totalErrors += count;
        const example = this.errorExamples.get(errorKey);
        report.errors.push({
          error: errorKey,
          count,
          firstSeen: example.firstSeen,
          example: {
            message: example.message,
            context: this.sanitize(example.context)
          }
        });
      }

      // Sort by count descending
      report.errors.sort((a, b) => b.count - a.count);

      return report;
    }

    startReporting() {
      setInterval(() => {
        const report = this.getErrorReport();
        if (report.totalErrors > 0) {
          this.info('Error report', report);
          this.resetErrorTracking();
        }
      }, this.reportInterval);
    }

    resetErrorTracking() {
      this.errorCounts.clear();
      this.errorExamples.clear();
    }
  }

  const errorLogger = new ErrorTrackingLogger({
    service: 'error-tracking-service',
    enableReporting: false // Manual reporting for demo
  });

  // Simulate various errors
  for (let i = 0; i < 5; i++) {
    errorLogger.error('Database connection failed', {
      error: new Error('Connection timeout'),
      database: 'users'
    });
  }

  for (let i = 0; i < 3; i++) {
    errorLogger.error('API call failed', {
      error: new Error('503 Service Unavailable'),
      endpoint: 'https://api.example.com'
    });
  }

  errorLogger.error('Validation failed', {
    error: new Error('Invalid input'),
    field: 'email'
  });

  // Generate report
  console.log('\nError Report:');
  console.log(util.inspect(errorLogger.getErrorReport(), {
    depth: null,
    colors: true,
    compact: false
  }));

  console.log('');
}, 550);

// =============================================================================
// Key Takeaways
// =============================================================================
setTimeout(() => {
  console.log('=== Key Takeaways ===');
  console.log('1. Use structured JSON logging for production');
  console.log('2. Always sanitize sensitive data automatically');
  console.log('3. Log requests/responses with correlation IDs');
  console.log('4. Monitor performance with timing operations');
  console.log('5. Propagate context across async operations');
  console.log('6. Use sampling and rate limiting for high-volume logs');
  console.log('7. Aggregate errors for better visibility');
  console.log('8. Different formats for dev (pretty) vs prod (JSON)');
  console.log('9. Implement multiple log levels with thresholds');
  console.log('10. Combine all patterns for enterprise logging');
}, 650);
