/**
 * Solution: Exercise 3 - Create Advanced Debug System
 * Production debugging system with namespaces, severity levels, and sanitization
 */

const util = require('util');

class DebugSystem {
  constructor(namespace, options = {}) {
    this.namespace = namespace;
    this.debuglog = util.debuglog(namespace);
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.minLevel = options.minLevel || 'debug';
    this.sensitiveKeys = options.sensitiveKeys || ['password', 'token', 'secret', 'key', 'apikey'];
    this.defaultContext = {};

    this.levels = { trace: 0, debug: 1, info: 2, warn: 3, error: 4 };
  }

  log(level, message, context = {}) {
    const levelNum = this.levels[level] || this.levels.info;
    const minLevelNum = this.levels[this.minLevel];

    if (levelNum < minLevelNum) return;

    const sanitized = this.sanitize({ ...this.defaultContext, ...context });
    const output = this.format({ level, message, ...sanitized });

    if (level === 'trace' || level === 'debug') {
      this.debuglog(output);
    } else {
      console.log(output);
    }
  }

  trace(message, context) { this.log('trace', message, context); }
  debug(message, context) { this.log('debug', message, context); }
  info(message, context) { this.log('info', message, context); }
  warn(message, context) { this.log('warn', message, context); }
  error(message, context) { this.log('error', message, context); }

  sanitize(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.sanitize(item));

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = this.sensitiveKeys.some(s => key.toLowerCase().includes(s.toLowerCase()));

      if (isSensitive) {
        if (typeof value === 'string' && value.length > 8) {
          result[key] = `${value.substring(0, 4)}****`;
        } else {
          result[key] = '[REDACTED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.sanitize(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  async time(label, fn) {
    const start = process.hrtime.bigint();
    this.debug(`${label} started`);

    try {
      const result = await fn();
      const duration = Number(process.hrtime.bigint() - start) / 1_000_000;
      this.debug(`${label} completed`, { duration: `${duration.toFixed(2)}ms` });
      return result;
    } catch (err) {
      const duration = Number(process.hrtime.bigint() - start) / 1_000_000;
      this.error(`${label} failed`, { error: err, duration: `${duration.toFixed(2)}ms` });
      throw err;
    }
  }

  child(context) {
    const child = new DebugSystem(this.namespace, {
      environment: this.environment,
      minLevel: this.minLevel,
      sensitiveKeys: this.sensitiveKeys
    });
    child.defaultContext = { ...this.defaultContext, ...context };
    return child;
  }

  format(data) {
    if (this.environment === 'production') {
      return JSON.stringify({ ...data, timestamp: new Date().toISOString(), namespace: this.namespace });
    }
    return util.inspect({ ...data, namespace: this.namespace }, { depth: 5, colors: true, compact: false });
  }

  [util.inspect.custom](depth, options) {
    return util.inspect({
      namespace: this.namespace,
      environment: this.environment,
      minLevel: this.minLevel
    }, { ...options, depth: depth - 1 });
  }
}

// KEY LEARNING POINTS:
// 1. Combine util.debuglog with custom formatters
// 2. Always sanitize sensitive data automatically
// 3. Support different formats for dev vs production
// 4. Use process.hrtime.bigint() for accurate timing
// 5. Child loggers inherit parent context
// 6. Level-based filtering prevents log spam
// 7. Structured logging enables log aggregation

module.exports = DebugSystem;
