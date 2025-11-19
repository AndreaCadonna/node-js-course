/**
 * Solution: Exercise 5 - Production Utility Library
 * ===================================================
 *
 * This solution combines all intermediate util concepts into a comprehensive,
 * production-ready utility library. It demonstrates:
 * - Smart inspection with sanitization
 * - Debug logging with performance tracking
 * - Type checking and validation
 * - Backward compatibility with deprecation
 * - Environment-aware behavior
 */

const util = require('util');
const { performance } = require('perf_hooks');

// =============================================================================
// COMPONENT 1: Production Logger
// =============================================================================

/**
 * Production-ready logger with sanitization and environment awareness
 */
class ProductionLogger {
  constructor(options = {}) {
    this.name = options.name || 'app';
    this.env = options.env || process.env.NODE_ENV || 'development';
    this.sensitiveFields = options.sensitiveFields || [
      'password', 'token', 'apiKey', 'secret', 'privateKey',
      'accessToken', 'refreshToken', 'sessionId', 'cookie'
    ];

    // Create debug loggers
    this.debugLog = util.debuglog(this.name);
    this.debugInfo = util.debuglog(`${this.name}:info`);
    this.debugWarn = util.debuglog(`${this.name}:warn`);
    this.debugError = util.debuglog(`${this.name}:error`);

    // Set inspection options based on environment
    this.inspectOptions = this._getInspectOptions();

    // Statistics
    this.stats = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      sanitized: 0
    };
  }

  _getInspectOptions() {
    if (this.env === 'production') {
      return {
        depth: 1,
        colors: false,
        compact: true,
        maxArrayLength: 5,
        maxStringLength: 50,
        breakLength: Infinity
      };
    } else if (this.env === 'test') {
      return {
        depth: 2,
        colors: false,
        compact: true,
        maxArrayLength: 10
      };
    } else {
      // Development
      return {
        depth: 3,
        colors: true,
        compact: false,
        maxArrayLength: 20,
        breakLength: 80
      };
    }
  }

  _sanitize(data) {
    if (data === null || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this._sanitize(item));
    }

    if (data.constructor !== Object) {
      return data;
    }

    const sanitized = {};
    let didSanitize = false;

    for (const [key, value] of Object.entries(data)) {
      const isSensitive = this.sensitiveFields.some(
        field => key.toLowerCase().includes(field.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
        didSanitize = true;
      } else if (value && typeof value === 'object') {
        sanitized[key] = this._sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    if (didSanitize) {
      this.stats.sanitized++;
    }

    return sanitized;
  }

  _format(level, message, data) {
    const timestamp = new Date().toISOString();
    const sanitized = data ? this._sanitize(data) : null;

    const parts = [`[${timestamp}] ${level}: ${message}`];

    if (sanitized !== null) {
      const inspected = util.inspect(sanitized, this.inspectOptions);
      parts.push(inspected);
    }

    return parts.join('\n');
  }

  debug(message, data) {
    this.stats.debug++;

    if (this.debugLog.enabled) {
      const formatted = this._format('DEBUG', message, data);
      this.debugLog(formatted);
    }
  }

  info(message, data) {
    this.stats.info++;

    const formatted = this._format('INFO', message, data);

    if (this.debugInfo.enabled) {
      this.debugInfo(formatted);
    } else {
      console.log(formatted);
    }
  }

  warn(message, data) {
    this.stats.warn++;

    const formatted = this._format('WARN', message, data);

    if (this.debugWarn.enabled) {
      this.debugWarn(formatted);
    } else {
      console.warn(formatted);
    }
  }

  error(message, data) {
    this.stats.error++;

    const formatted = this._format('ERROR', message, data);

    if (this.debugError.enabled) {
      this.debugError(formatted);
    } else {
      console.error(formatted);
    }
  }

  getStats() {
    return { ...this.stats };
  }

  [util.inspect.custom]() {
    return `ProductionLogger { name: '${this.name}', env: '${this.env}', enabled: ${this.debugLog.enabled} }`;
  }
}

// =============================================================================
// COMPONENT 2: Type Checker
// =============================================================================

/**
 * Comprehensive type checking using util.types
 */
class TypeChecker {
  constructor() {
    this.validators = this._buildValidators();
    this.stats = {
      checks: 0,
      assertions: 0,
      failures: 0
    };
  }

  _buildValidators() {
    return {
      // Primitives
      'string': (v) => typeof v === 'string',
      'number': (v) => typeof v === 'number' && !isNaN(v),
      'boolean': (v) => typeof v === 'boolean',
      'undefined': (v) => v === undefined,
      'null': (v) => v === null,
      'symbol': (v) => typeof v === 'symbol',
      'bigint': (v) => typeof v === 'bigint',

      // Objects
      'object': (v) => typeof v === 'object' && v !== null,
      'array': (v) => Array.isArray(v),
      'function': (v) => typeof v === 'function',

      // util.types
      'promise': (v) => util.types.isPromise(v),
      'date': (v) => util.types.isDate(v),
      'regexp': (v) => util.types.isRegExp(v),
      'error': (v) => util.types.isNativeError(v),
      'map': (v) => util.types.isMap(v),
      'set': (v) => util.types.isSet(v),
      'weakmap': (v) => util.types.isWeakMap(v),
      'weakset': (v) => util.types.isWeakSet(v),
      'arraybuffer': (v) => util.types.isArrayBuffer(v),
      'sharedarraybuffer': (v) => util.types.isSharedArrayBuffer(v),
      'uint8array': (v) => util.types.isUint8Array(v),
      'buffer': (v) => Buffer.isBuffer(v),
      'proxy': (v) => util.types.isProxy(v)
    };
  }

  check(value, expectedType) {
    this.stats.checks++;

    const validator = this.validators[expectedType.toLowerCase()];

    if (!validator) {
      throw new Error(`Unknown type: ${expectedType}`);
    }

    return validator(value);
  }

  assert(value, expectedType, message) {
    this.stats.assertions++;

    if (!this.check(value, expectedType)) {
      this.stats.failures++;

      const actualType = this.getType(value);
      const errorMessage = message ||
        `Type assertion failed: expected ${expectedType}, got ${actualType}`;

      throw new TypeError(errorMessage);
    }
  }

  getType(value) {
    // Check primitives first
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    const primitiveType = typeof value;
    if (primitiveType !== 'object' && primitiveType !== 'function') {
      return primitiveType;
    }

    // Check special types
    if (Array.isArray(value)) return 'array';
    if (Buffer.isBuffer(value)) return 'buffer';
    if (util.types.isPromise(value)) return 'promise';
    if (util.types.isDate(value)) return 'date';
    if (util.types.isRegExp(value)) return 'regexp';
    if (util.types.isMap(value)) return 'map';
    if (util.types.isSet(value)) return 'set';

    return primitiveType;
  }

  validateSchema(obj, schema) {
    const errors = [];

    for (const [field, expectedType] of Object.entries(schema)) {
      const value = obj[field];

      if (value === undefined) {
        errors.push(`Missing field: ${field}`);
        continue;
      }

      try {
        this.assert(value, expectedType);
      } catch (err) {
        errors.push(`Field '${field}': ${err.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  typed(paramTypes, returnType, fn) {
    const checker = this;

    return function(...args) {
      // Validate parameters
      paramTypes.forEach((type, index) => {
        checker.assert(
          args[index],
          type,
          `Parameter ${index} must be ${type}`
        );
      });

      // Call function
      const result = fn.apply(this, args);

      // Validate return type
      if (returnType) {
        checker.assert(
          result,
          returnType,
          `Return value must be ${returnType}`
        );
      }

      return result;
    };
  }

  getStats() {
    return { ...this.stats };
  }
}

// =============================================================================
// COMPONENT 3: API Wrapper
// =============================================================================

/**
 * API wrapper with backward compatibility and deprecation tracking
 */
class APIWrapper {
  constructor(options = {}) {
    this.name = options.name || 'API';
    this.typeChecker = new TypeChecker();
    this.logger = options.logger;
    this.deprecations = new Map();

    this.stats = {
      callbacks: 0,
      promises: 0,
      deprecations: 0
    };
  }

  wrapAsync(fn, options = {}) {
    const wrapper = this;
    const {
      deprecate = false,
      message = 'This API is deprecated',
      code = 'DEP0000',
      types = null
    } = options;

    // Create callbackified version
    const callbackified = util.callbackify(fn);

    // Optionally add deprecation
    const finalCallback = deprecate
      ? util.deprecate(callbackified, message, code)
      : callbackified;

    // Return dual API function
    return function(...args) {
      const lastArg = args[args.length - 1];

      // Check if callback provided
      if (typeof lastArg === 'function') {
        wrapper.stats.callbacks++;

        if (deprecate) {
          wrapper.stats.deprecations++;
          wrapper._trackDeprecation(code, message);
        }

        return finalCallback.apply(this, args);
      }

      // Promise API
      wrapper.stats.promises++;

      // Type checking if provided
      if (types && types.params) {
        types.params.forEach((type, index) => {
          wrapper.typeChecker.assert(args[index], type);
        });
      }

      return fn.apply(this, args);
    };
  }

  _trackDeprecation(code, message) {
    if (this.deprecations.has(code)) {
      const entry = this.deprecations.get(code);
      entry.count++;
      entry.lastSeen = new Date();
    } else {
      this.deprecations.set(code, {
        code,
        message,
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date()
      });
    }
  }

  deprecate(fn, options) {
    const {
      message = 'This function is deprecated',
      code = 'DEP0000',
      alternative = null,
      removeIn = 'future version'
    } = options;

    const fullMessage = [
      `[${code}] ${message}`,
      alternative ? `Use ${alternative} instead` : null,
      `Will be removed in ${removeIn}`
    ].filter(Boolean).join('\n');

    const deprecated = util.deprecate(
      fn,
      fullMessage,
      code
    );

    this._trackDeprecation(code, message);

    return deprecated;
  }

  getDeprecationReport() {
    return {
      total: this.deprecations.size,
      deprecations: Array.from(this.deprecations.values())
    };
  }

  getStats() {
    return { ...this.stats };
  }
}

// =============================================================================
// COMPONENT 4: Utility Library (Main Export)
// =============================================================================

/**
 * Complete utility library combining all components
 */
class UtilityLibrary {
  constructor(options = {}) {
    this.options = options;
    this.logger = new ProductionLogger(options.logger || {});
    this.typeChecker = new TypeChecker();
    this.apiWrapper = new APIWrapper({
      ...options.api,
      logger: this.logger,
    });

    // Create sanitizer instance
    this._sanitizer = {
      fields: this.logger.sensitiveFields,
      sanitize: (data) => this.logger._sanitize(data)
    };
  }

  /**
   * Smart inspection with sanitization
   */
  inspect(value, options = {}) {
    const sanitized = this._sanitizer.sanitize(value);
    return util.inspect(sanitized, {
      ...this.logger.inspectOptions,
      ...options
    });
  }

  /**
   * Format with environment-aware options
   */
  format(message, ...args) {
    return util.formatWithOptions(
      this.logger.inspectOptions,
      message,
      ...args
    );
  }

  /**
   * Type checking utilities
   */
  types = {
    check: (value, type) => this.typeChecker.check(value, type),
    assert: (value, type, message) => this.typeChecker.assert(value, type, message),
    getType: (value) => this.typeChecker.getType(value),
    validate: (obj, schema) => this.typeChecker.validateSchema(obj, schema),
    typed: (params, ret, fn) => this.typeChecker.typed(params, ret, fn)
  };

  /**
   * Async utilities
   */
  async = {
    promisify: (fn) => util.promisify(fn),
    callbackify: (fn) => util.callbackify(fn),
    wrapAsync: (fn, opts) => this.apiWrapper.wrapAsync(fn, opts)
  };

  /**
   * Get library stats
   */
  getStats() {
    return {
      logger: this.logger.getStats(),
      typeChecker: this.typeChecker.getStats(),
      apiWrapper: this.apiWrapper.getStats(),
      deprecations: this.apiWrapper.getDeprecationReport()
    };
  }

  [util.inspect.custom]() {
    return `UtilityLibrary { logger: '${this.logger.name}', env: '${this.logger.env}' }`;
  }
}

// =============================================================================
// EXAMPLE APPLICATION
// =============================================================================

/**
 * Example application using the utility library
 */
class ExampleApp {
  constructor() {
    this.util = new UtilityLibrary({
      logger: {
        name: 'myapp',
        env: process.env.NODE_ENV || 'development',
      },
    });

    this.logger = this.util.logger;

    // Simulated database
    this.users = new Map([
      [123, { id: 123, name: 'Alice', email: 'alice@example.com', password: 'secret123' }],
      [456, { id: 456, name: 'Bob', email: 'bob@example.com', password: 'secret456' }]
    ]);
  }

  /**
   * Get user with type checking
   */
  async getUser(id) {
    // Validate id type
    this.util.types.assert(id, 'number', 'User ID must be a number');

    // Log debug info (sanitized automatically)
    this.logger.debug('Fetching user', { id });

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 50));

    const user = this.users.get(id);

    if (!user) {
      this.logger.warn('User not found', { id });
      throw new Error(`User not found: ${id}`);
    }

    // Log with sanitization
    this.logger.info('User fetched', user);

    return user;
  }

  /**
   * Process data with timing and validation
   */
  async processData(data) {
    const startTime = performance.now();

    // Validate data schema
    const schema = {
      items: 'array'
    };

    const validation = this.util.types.validate(data, schema);

    if (!validation.valid) {
      this.logger.error('Invalid data schema', {
        errors: validation.errors
      });
      throw new Error('Invalid data: ' + validation.errors.join(', '));
    }

    this.logger.debug('Processing data', { itemCount: data.items.length });

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));

    const duration = performance.now() - startTime;

    this.logger.info('Data processed', {
      itemCount: data.items.length,
      duration: `${duration.toFixed(2)}ms`
    });

    return { processed: data.items.length };
  }

  /**
   * Old API method (deprecated)
   */
  getUserById = this.util.async.wrapAsync(
    this.getUser.bind(this),
    {
      deprecate: true,
      message: 'getUserById is deprecated. Use getUser() instead.',
      code: 'DEP_APP_001'
    }
  );
}

// =============================================================================
// TEST CASES
// =============================================================================

async function testProductionLibrary() {
  console.log('=== Testing Production Utility Library ===\n');

  // Test 1: Logger
  console.log('1. Testing Logger\n');

  const logger = new ProductionLogger({ name: 'test' });

  logger.info('Application started', {
    port: 3000,
    password: 'secret123', // Should be sanitized
  });

  logger.error('Database error', {
    error: 'Connection failed',
    credentials: { user: 'admin', password: 'secret' }, // Sanitized
  });

  console.log('\nLogger stats:', logger.getStats());

  // Test 2: TypeChecker
  console.log('\n2. Testing TypeChecker\n');

  const checker = new TypeChecker();

  console.log('Is 42 a number?', checker.check(42, 'number'));
  console.log('Is "hello" a number?', checker.check('hello', 'number'));
  console.log('Type of Promise:', checker.getType(Promise.resolve()));
  console.log('Type of Buffer:', checker.getType(Buffer.from('test')));

  // Schema validation
  const userSchema = {
    id: 'number',
    name: 'string',
    email: 'string'
  };

  const validUser = {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com'
  };

  const validation = checker.validateSchema(validUser, userSchema);
  console.log('Schema validation:', validation.valid ? 'PASS' : 'FAIL');

  // Test 3: APIWrapper
  console.log('\n3. Testing APIWrapper\n');

  async function fetchData(id) {
    return { id, data: 'result' };
  }

  const wrapper = new APIWrapper();

  const wrappedFn = wrapper.wrapAsync(fetchData, {
    deprecate: true,
    message: 'Use async version',
    code: 'DEP_TEST_001'
  });

  // Test with promise
  const result1 = await wrappedFn(123);
  console.log('Promise result:', result1);

  // Test with callback
  wrappedFn(456, (err, result) => {
    if (err) {
      console.error('Callback error:', err);
    } else {
      console.log('Callback result:', result);
    }
  });

  // Test 4: UtilityLibrary
  console.log('\n4. Testing UtilityLibrary\n');

  const lib = new UtilityLibrary();

  const inspected = lib.inspect({ user: 'alice', password: 'secret' });
  console.log('Inspected (sanitized):', inspected);

  const formatted = lib.format('User: %s, ID: %d', 'Alice', 123);
  console.log('Formatted:', formatted);

  // Test 5: ExampleApp
  console.log('\n5. Testing ExampleApp\n');

  const app = new ExampleApp();

  try {
    const user = await app.getUser(123);
    console.log('Fetched user ID:', user.id);
  } catch (err) {
    console.error('Error:', err.message);
  }

  try {
    const result = await app.processData({ items: [1, 2, 3] });
    console.log('Processing result:', result);
  } catch (err) {
    console.error('Error:', err.message);
  }

  // Test deprecated API
  console.log('\n6. Testing Deprecated API (should show warning)\n');
  await app.getUserById(123);

  // Print stats
  setTimeout(() => {
    console.log('\n=== Library Statistics ===\n');
    const stats = lib.getStats();
    console.log(JSON.stringify(stats, null, 2));
  }, 100);
}

if (require.main === module) {
  testProductionLibrary();
}

module.exports = {
  ProductionLogger,
  TypeChecker,
  APIWrapper,
  UtilityLibrary,
  ExampleApp
};

// =============================================================================
// KEY LEARNING POINTS
// =============================================================================

/**
 * 1. COMPOSITION OVER INHERITANCE
 *    The library combines multiple focused components rather than creating
 *    one monolithic class. This makes it more maintainable and testable.
 *
 * 2. ENVIRONMENT-AWARE BEHAVIOR
 *    Different environments need different defaults:
 *    - Development: Verbose, colorful, deep inspection
 *    - Production: Minimal, efficient, shallow inspection
 *    - Test: Consistent, reproducible output
 *
 * 3. AUTOMATIC SANITIZATION
 *    Sensitive data should be hidden automatically, not manually.
 *    Use pattern matching to detect and redact sensitive fields.
 *
 * 4. DUAL API SUPPORT
 *    Support both old (callbacks) and new (promises) APIs during migration.
 *    Use deprecation warnings to guide users to new APIs.
 *
 * 5. COMPREHENSIVE TYPE CHECKING
 *    util.types provides reliable type checking for all JavaScript types.
 *    Build schema validation on top for object validation.
 *
 * 6. TRACK USAGE STATISTICS
 *    Monitor library usage to understand:
 *    - Which features are used most
 *    - Deprecated API usage
 *    - Performance characteristics
 *
 * 7. PRODUCTION-READY MEANS
 *    - Zero overhead when features disabled
 *    - Secure by default (sanitization)
 *    - Environment-aware
 *    - Backward compatible
 *    - Well-tested
 *    - Documented
 */

// =============================================================================
// COMMON MISTAKES
// =============================================================================

/**
 * MISTAKE 1: Not sanitizing in production
 * ❌ BAD: Log everything including passwords
 * ✅ GOOD: Automatic sanitization of sensitive fields
 */

/**
 * MISTAKE 2: Same configuration for all environments
 * ❌ BAD: Deep inspection in production (slow)
 * ✅ GOOD: Environment-specific options
 */

/**
 * MISTAKE 3: Breaking backward compatibility
 * ❌ BAD: Remove old API immediately
 * ✅ GOOD: Deprecate first, remove later
 */

/**
 * MISTAKE 4: No usage tracking
 * ❌ BAD: No idea which features are used
 * ✅ GOOD: Track usage for informed decisions
 */

/**
 * MISTAKE 5: Ignoring performance
 * ❌ BAD: Expensive operations always run
 * ✅ GOOD: Check if enabled before expensive ops
 */

// =============================================================================
// GOING FURTHER - Advanced Challenges
// =============================================================================

/**
 * CHALLENGE 1: Plugin System
 * Add extensibility via plugins:
 *
 * lib.use({
 *   name: 'my-plugin',
 *   install(lib) {
 *     lib.myFeature = () => {};
 *   }
 * });
 *
 * Allow users to extend library functionality
 */

/**
 * CHALLENGE 2: Configuration Presets
 * Create named configuration presets:
 *
 * lib.preset('development'); // Verbose
 * lib.preset('production');  // Minimal
 * lib.preset('debug');       // Everything enabled
 *
 * Make it easy to switch configurations
 */

/**
 * CHALLENGE 3: Log Streaming
 * Add log streaming for aggregation:
 *
 * lib.logger.stream()
 *   .pipe(transform)
 *   .pipe(elasticsearch);
 *
 * Integrate with log aggregation systems
 */

/**
 * CHALLENGE 4: Performance Monitoring
 * Add comprehensive performance tracking:
 *
 * lib.monitor.startOperation('db-query');
 * // ... operation ...
 * lib.monitor.endOperation('db-query');
 *
 * lib.monitor.getReport(); // Performance stats
 *
 * Track all operations for performance analysis
 */

/**
 * CHALLENGE 5: CLI Tool
 * Build command-line tools:
 *
 * $ mylib analyze-logs app.log
 * $ mylib check-types src/
 * $ mylib find-deprecated src/
 * $ mylib generate-report stats.json
 *
 * Provide developer tools for library usage
 */
