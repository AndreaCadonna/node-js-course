/**
 * Example 8: Production-Ready Utility Patterns
 *
 * Real-world patterns combining multiple util functions for production use.
 * Learn how to build robust logging, debugging, and API management systems
 * using the util module.
 *
 * Key Concepts:
 * - Combining multiple util functions
 * - Production-safe logging
 * - API backward compatibility
 * - Type-safe utilities
 */

const util = require('util');

// ===== EXAMPLE 1: Production Logger =====
console.log('=== Example 1: Production-Grade Logger ===\n');

class ProductionLogger {
  constructor(options = {}) {
    this.name = options.name || 'app';
    this.env = process.env.NODE_ENV || 'development';

    // Debug loggers for different subsystems
    this.debug = {
      db: util.debuglog(`${this.name}:db`),
      http: util.debuglog(`${this.name}:http`),
      cache: util.debuglog(`${this.name}:cache`),
    };

    // Inspection options based on environment
    this.inspectOptions = this._getInspectOptions();
  }

  _getInspectOptions() {
    if (this.env === 'production') {
      return {
        depth: 2,
        colors: false,
        compact: true,
        maxArrayLength: 10,
        maxStringLength: 200,
      };
    }

    return {
      depth: 5,
      colors: true,
      compact: false,
      maxArrayLength: 100,
    };
  }

  _sanitize(data) {
    // Hide sensitive fields
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const sanitized = this._sanitize(data);

    const formatted = util.formatWithOptions(
      this.inspectOptions,
      '[%s] %s: %s %O',
      timestamp,
      level,
      message,
      sanitized
    );

    console.log(formatted);
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  // Debug logging (only when NODE_DEBUG is set)
  debugDB(message, data) {
    this.debug.db(util.formatWithOptions(this.inspectOptions, message, data));
  }

  debugHTTP(message, data) {
    this.debug.http(util.formatWithOptions(this.inspectOptions, message, data));
  }
}

const logger = new ProductionLogger({ name: 'myapp' });

logger.info('Application started', {
  port: 3000,
  env: process.env.NODE_ENV,
});

logger.error('Database connection failed', {
  error: 'ECONNREFUSED',
  host: 'localhost',
  password: 'secret123', // Will be redacted
});

logger.debugDB('Query executed: %s', 'SELECT * FROM users');

// ===== EXAMPLE 2: Backward-Compatible API =====
console.log('\n=== Example 2: Backward-Compatible API ===\n');

class DataService {
  constructor() {
    // Track deprecated usage
    this.deprecationWarnings = new Set();
  }

  // New promise-based API
  async fetchData(id, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!id) {
      throw new Error('ID is required');
    }

    return {
      id,
      data: 'result',
      cached: options.cache || false,
    };
  }

  // Old callback-based API (deprecated)
  getData(id, callback) {
    const deprecated = util.deprecate(
      () => {},
      'getData() is deprecated. Use async fetchData() instead.',
      'DEP0001'
    );

    if (!this.deprecationWarnings.has('getData')) {
      deprecated();
      this.deprecationWarnings.add('getData');
    }

    // Convert to callback
    const callbackified = util.callbackify(this.fetchData.bind(this));
    callbackified(id, {}, callback);
  }

  // Dual API method
  async loadData(id, optionsOrCallback, maybeCallback) {
    // Detect old callback signature
    if (typeof optionsOrCallback === 'function') {
      const deprecated = util.deprecate(
        () => {},
        'Callback parameter is deprecated. Use promise-based API instead.',
        'DEP0002'
      );

      if (!this.deprecationWarnings.has('loadData-callback')) {
        deprecated();
        this.deprecationWarnings.add('loadData-callback');
      }

      // Old signature: loadData(id, callback)
      const callbackified = util.callbackify(this.fetchData.bind(this));
      return callbackified(id, {}, optionsOrCallback);
    }

    // New signature: loadData(id, options)
    return this.fetchData(id, optionsOrCallback);
  }
}

const service = new DataService();

// New way (promise)
console.log('Modern API:');
service.fetchData(123).then(result => {
  console.log('✓ Promise result:', result);
});

// Old way (callback - deprecated)
console.log('\nLegacy API:');
service.getData(456, (err, result) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('✓ Callback result:', result);
});

// Dual API
console.log('\nDual API (promise):');
service.loadData(789, { cache: true }).then(result => {
  console.log('✓ Result:', result);
});

// ===== EXAMPLE 3: Type-Safe Configuration =====
console.log('\n=== Example 3: Type-Safe Configuration ===\n');

class Configuration {
  constructor(config) {
    this._config = this._validate(config);
  }

  _validate(config) {
    const schema = {
      server: {
        port: 'number',
        host: 'string',
      },
      database: {
        url: 'string',
        poolSize: 'number',
      },
      cache: {
        enabled: 'boolean',
        ttl: 'number',
      },
    };

    return this._validateObject(config, schema, 'config');
  }

  _validateObject(obj, schema, path) {
    const validated = {};

    for (const [key, expectedType] of Object.entries(schema)) {
      const fullPath = `${path}.${key}`;

      if (!(key in obj)) {
        throw new TypeError(`Missing required config: ${fullPath}`);
      }

      const value = obj[key];

      if (typeof expectedType === 'object') {
        // Nested object
        validated[key] = this._validateObject(value, expectedType, fullPath);
      } else {
        // Primitive type
        this._validateType(value, expectedType, fullPath);
        validated[key] = value;
      }
    }

    return validated;
  }

  _validateType(value, expectedType, path) {
    let isValid = false;

    switch (expectedType) {
      case 'string':
        isValid = typeof value === 'string';
        break;
      case 'number':
        isValid = typeof value === 'number' && !isNaN(value);
        break;
      case 'boolean':
        isValid = typeof value === 'boolean';
        break;
      case 'date':
        isValid = util.types.isDate(value);
        break;
      case 'promise':
        isValid = util.types.isPromise(value);
        break;
      default:
        throw new Error(`Unknown type: ${expectedType}`);
    }

    if (!isValid) {
      throw new TypeError(
        `Invalid type for ${path}: expected ${expectedType}, got ${typeof value}`
      );
    }
  }

  // Custom inspection (hide in production)
  [util.inspect.custom](depth, options) {
    if (process.env.NODE_ENV === 'production') {
      return 'Configuration { [REDACTED] }';
    }

    return `Configuration ${util.inspect(this._config, options)}`;
  }

  get(key) {
    const keys = key.split('.');
    let value = this._config;

    for (const k of keys) {
      value = value[k];
      if (value === undefined) {
        return undefined;
      }
    }

    return value;
  }
}

const config = new Configuration({
  server: {
    port: 3000,
    host: 'localhost',
  },
  database: {
    url: 'postgresql://localhost/mydb',
    poolSize: 10,
  },
  cache: {
    enabled: true,
    ttl: 3600,
  },
});

console.log('Server port:', config.get('server.port'));
console.log('Config:', config);

// ===== EXAMPLE 4: Smart Debug Logger =====
console.log('\n=== Example 4: Smart Debug Logger ===\n');

class SmartDebugger {
  constructor(namespace) {
    this.namespace = namespace;
    this.debugLog = util.debuglog(namespace);
  }

  log(message, data) {
    // Only format if debug is enabled
    if (this.debugLog.enabled) {
      const formatted = util.formatWithOptions(
        { depth: 5, colors: true },
        message,
        data
      );

      this.debugLog(formatted);
    }
  }

  time(label) {
    if (this.debugLog.enabled) {
      this.timers = this.timers || new Map();
      this.timers.set(label, Date.now());
      this.debugLog(`Timer started: ${label}`);
    }
  }

  timeEnd(label) {
    if (this.debugLog.enabled) {
      const start = this.timers?.get(label);

      if (start) {
        const duration = Date.now() - start;
        this.debugLog(`Timer ended: ${label} (${duration}ms)`);
        this.timers.delete(label);
      }
    }
  }

  inspect(value, label) {
    if (this.debugLog.enabled) {
      const inspected = util.inspect(value, {
        depth: null,
        colors: true,
        compact: false,
      });

      this.debugLog(`${label}:\n${inspected}`);
    }
  }
}

const debugger = new SmartDebugger('myapp:perf');

debugger.time('operation');
debugger.log('Processing data: %O', { items: 100 });
debugger.inspect({ complex: { nested: { data: 'here' } } }, 'Complex Object');
debugger.timeEnd('operation');

console.log('Debug logs only appear when NODE_DEBUG=myapp:perf');

// ===== EXAMPLE 5: Error Reporting System =====
console.log('\n=== Example 5: Production Error Reporter ===\n');

class ErrorReporter {
  constructor(options = {}) {
    this.env = process.env.NODE_ENV || 'development';
    this.reportErrors = options.reportErrors !== false;
  }

  [util.inspect.custom]() {
    return `ErrorReporter { env: '${this.env}' }`;
  }

  _formatError(error, context = {}) {
    // Type check
    const isError = util.types.isNativeError(error);

    if (!isError) {
      error = new Error(String(error));
    }

    const formatted = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      env: this.env,
      context: util.inspect(context, {
        depth: 3,
        colors: false,
        compact: true,
      }),
    };

    return formatted;
  }

  report(error, context) {
    const formatted = this._formatError(error, context);

    if (this.env === 'production') {
      // In production, send to error tracking service
      console.error(JSON.stringify(formatted));
    } else {
      // In development, pretty print
      console.error(util.inspect(formatted, {
        depth: null,
        colors: true,
      }));
    }
  }

  async captureAsync(fn, context = {}) {
    try {
      return await fn();
    } catch (error) {
      this.report(error, context);
      throw error;
    }
  }
}

const reporter = new ErrorReporter();

reporter.report(new Error('Something went wrong'), {
  user: 'alice',
  action: 'fetchData',
  params: { id: 123 },
});

// ===== EXAMPLE 6: Complete Utility Library =====
console.log('\n=== Example 6: Complete Utility Library ===\n');

const UtilLib = {
  // Type checking
  types: {
    isValidDate(value) {
      return util.types.isDate(value) && !isNaN(value.getTime());
    },

    isNonEmptyString(value) {
      return typeof value === 'string' && value.trim().length > 0;
    },

    isPositiveNumber(value) {
      return typeof value === 'number' && value > 0 && !isNaN(value);
    },
  },

  // Formatting
  format: {
    currency(amount) {
      return util.format('$%.2f', amount);
    },

    duration(ms) {
      const seconds = ms / 1000;
      return util.format('%.2fs', seconds);
    },

    object(obj, options = {}) {
      return util.inspect(obj, {
        depth: options.depth ?? 3,
        colors: options.colors ?? false,
        compact: options.compact ?? true,
      });
    },
  },

  // Async helpers
  async: {
    callbackify: util.callbackify,

    promisify: util.promisify,

    async timeout(promise, ms) {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), ms)
        ),
      ]);
    },
  },

  // Debug helpers
  debug(namespace) {
    return util.debuglog(namespace);
  },

  // Inspection
  inspect(value, options) {
    return util.inspect(value, options);
  },
};

console.log('Type checks:');
console.log('Valid date?', UtilLib.types.isValidDate(new Date()));
console.log('Valid string?', UtilLib.types.isNonEmptyString('hello'));
console.log('Positive number?', UtilLib.types.isPositiveNumber(42));

console.log('\nFormatting:');
console.log('Currency:', UtilLib.format.currency(1234.567));
console.log('Duration:', UtilLib.format.duration(5432));
console.log('Object:', UtilLib.format.object({ key: 'value' }));

/**
 * Important Notes:
 *
 * 1. Production Logger Pattern:
 *    - Environment-aware formatting
 *    - Automatic data sanitization
 *    - Debug logging with util.debuglog
 *    - Structured logging output
 *
 * 2. Backward Compatibility:
 *    - Use util.deprecate() for old APIs
 *    - Provide migration path
 *    - Support both callback and promise
 *    - Track deprecation warnings
 *
 * 3. Type Safety:
 *    - Use util.types for validation
 *    - Build schema validators
 *    - Runtime type checking
 *    - Clear error messages
 *
 * 4. Custom Inspection:
 *    - Hide sensitive data
 *    - Environment-aware output
 *    - Implement [util.inspect.custom]
 *    - Respect inspection options
 *
 * 5. Best Practices:
 *    ✅ Combine util functions for robust solutions
 *    ✅ Make logging environment-aware
 *    ✅ Sanitize sensitive data
 *    ✅ Use deprecation properly
 *    ✅ Validate types at boundaries
 *    ✅ Keep debug logs conditional
 */

/**
 * Try This:
 *
 * 1. Build a complete logging library
 * 2. Create a migration helper for callback to promise
 * 3. Implement a type-safe API client
 * 4. Build a configuration validation system
 * 5. Create a production-ready error tracking system
 */
