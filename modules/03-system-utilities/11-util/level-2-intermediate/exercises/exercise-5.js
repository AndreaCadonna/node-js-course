/**
 * Exercise 5: Production Utility Library
 *
 * DIFFICULTY: ⭐⭐⭐ Hard
 * TIME: 40-45 minutes
 *
 * OBJECTIVE:
 * Build a comprehensive, production-ready utility library that combines
 * multiple util functions into a cohesive system. This integrates everything
 * you've learned: inspection, formatting, logging, deprecation, and types.
 *
 * REQUIREMENTS:
 * 1. Create a Logger with inspection, formatting, and debug logging
 * 2. Implement TypeChecker with comprehensive validation
 * 3. Build APIWrapper with backward compatibility and deprecation
 * 4. Add sanitization for sensitive data
 * 5. Create environment-aware behavior
 *
 * BONUS CHALLENGES:
 * - Add performance monitoring
 * - Create plugin system
 * - Implement log aggregation
 * - Build CLI tool for library
 *
 * HINTS:
 * - Combine util.inspect, util.format, util.debuglog
 * - Use util.types for validation
 * - Apply util.deprecate for old APIs
 * - Implement [util.inspect.custom] for complex objects
 */

const util = require('util');

// TODO 1: Create Production Logger
class ProductionLogger {
  constructor(options = {}) {
    this.name = options.name || 'app';
    this.env = options.env || process.env.NODE_ENV || 'development';
    this.sensitiveFields = options.sensitiveFields || [
      'password',
      'token',
      'apiKey',
      'secret',
    ];

    // TODO: Create debug loggers for different levels
    this.debugLog = null; // util.debuglog(this.name)

    // TODO: Set inspection options based on environment
    this.inspectOptions = this._getInspectOptions();
  }

  _getInspectOptions() {
    // TODO: Return different options for dev vs production
    // Production: limited depth, no colors, compact
    // Development: deep depth, colors, expanded
  }

  _sanitize(data) {
    // TODO: Implement recursive sanitization
    // - Hide sensitive fields
    // - Handle nested objects
    // - Handle arrays
    // - Preserve structure
  }

  _format(level, message, data) {
    // TODO: Format log message
    // - Add timestamp
    // - Add level
    // - Sanitize data
    // - Use util.formatWithOptions
  }

  log(level, message, data) {
    // TODO: Main logging method
    // 1. Format message
    // 2. Output based on level
  }

  debug(message, data) {
    // TODO: Debug level (use util.debuglog)
  }

  info(message, data) {
    // TODO: Info level
  }

  warn(message, data) {
    // TODO: Warn level
  }

  error(message, data) {
    // TODO: Error level
  }

  // TODO: Implement [util.inspect.custom]
  [util.inspect.custom]() {
    // Return useful logger info
  }
}

// TODO 2: Create Type Checker
class TypeChecker {
  constructor() {
    // TODO: Build map of type validators
    this.validators = this._buildValidators();
  }

  _buildValidators() {
    // TODO: Create validators for all types
    // Use util.types methods
    // Include custom validators
  }

  // TODO: Check if value matches expected type
  check(value, expectedType) {
    // Your code here:
    // 1. Get validator for type
    // 2. Run validation
    // 3. Return boolean
  }

  // TODO: Assert type (throw if wrong)
  assert(value, expectedType, message) {
    // Your code here:
    // 1. Check type
    // 2. Throw TypeError if wrong
    // 3. Include helpful message
  }

  // TODO: Get actual type of value
  getType(value) {
    // Your code here:
    // Use util.types to determine precise type
  }

  // TODO: Validate object schema
  validateSchema(obj, schema) {
    // Your code here:
    // 1. Check each field against schema
    // 2. Validate nested objects
    // 3. Return validation result with errors
  }

  // TODO: Create type-safe function wrapper
  typed(paramTypes, returnType, fn) {
    // Your code here:
    // Return wrapped function that validates:
    // 1. Parameter types
    // 2. Return type
    // 3. Throw on mismatch
  }
}

// TODO 3: Create API Wrapper with backward compatibility
class APIWrapper {
  constructor(options = {}) {
    this.name = options.name || 'API';
    this.typeChecker = new TypeChecker();
    this.logger = options.logger;

    // Track deprecations
    this.deprecations = new Map();
  }

  // TODO: Wrap async function with support for callbacks
  wrapAsync(fn, options = {}) {
    // Your code here:
    // 1. Create promise-based implementation
    // 2. Detect if callback is provided
    // 3. If callback, use util.callbackify
    // 4. If deprecated, warn with util.deprecate
    // 5. Add type checking if provided
  }

  // TODO: Deprecate a method
  deprecate(fn, options) {
    // Options:
    // - message: Deprecation message
    // - code: Deprecation code
    // - alternative: What to use instead
    // - removeIn: Version when removed
    //
    // Your code here:
    // 1. Create detailed message
    // 2. Use util.deprecate
    // 3. Track usage
    // 4. Return deprecated function
  }

  // TODO: Get deprecation report
  getDeprecationReport() {
    // Your code here:
    // Return statistics on deprecated API usage
  }
}

// TODO 4: Create Utility Library (main export)
class UtilityLibrary {
  constructor(options = {}) {
    this.options = options;
    this.logger = new ProductionLogger(options.logger);
    this.typeChecker = new TypeChecker();
    this.apiWrapper = new APIWrapper({
      ...options.api,
      logger: this.logger,
    });
  }

  // TODO: Inspection utilities
  inspect(value, options) {
    // Your code here:
    // Smart inspection with sanitization
  }

  format(message, ...args) {
    // TODO: Format with environment-aware options
  }

  // TODO: Type checking utilities
  types = {
    // Your code here:
    // Expose type checking methods
  };

  // TODO: Async utilities
  async = {
    // Your code here:
    // promisify, callbackify, with type checking
  };

  // TODO: Get library stats
  getStats() {
    // Your code here:
    // Return usage statistics
  }

  // TODO: Implement [util.inspect.custom]
  [util.inspect.custom]() {
    // Return library info
  }
}

// TODO 5: Create example application using the library
class ExampleApp {
  constructor() {
    // TODO: Initialize utility library
    this.util = new UtilityLibrary({
      logger: {
        name: 'myapp',
        env: process.env.NODE_ENV,
      },
    });

    this.logger = this.util.logger;
  }

  // TODO: Implement user service with type checking
  async getUser(id) {
    // Your code here:
    // 1. Validate id type
    // 2. Log debug info
    // 3. Fetch user
    // 4. Sanitize output
  }

  // TODO: Implement data processing with timing
  async processData(data) {
    // Your code here:
    // 1. Validate data schema
    // 2. Time operation
    // 3. Log progress
    // 4. Handle errors
  }

  // TODO: Old API method (deprecated)
  getUserById(id, callback) {
    // Your code here:
    // Use apiWrapper.wrapAsync with deprecation
  }
}

// TODO 6: Test the complete library
async function testProductionLibrary() {
  console.log('=== Testing Production Utility Library ===\n');

  // TODO: Test Logger
  console.log('1. Testing Logger:');
  const logger = new ProductionLogger({ name: 'test' });

  logger.info('Application started', {
    port: 3000,
    password: 'secret123', // Should be sanitized
  });

  logger.error('Database error', {
    error: 'Connection failed',
    credentials: { user: 'admin', password: 'secret' }, // Sanitized
  });

  // TODO: Test TypeChecker
  console.log('\n2. Testing TypeChecker:');
  const checker = new TypeChecker();

  console.log('Is 42 a number?', checker.check(42, 'number'));
  console.log('Is "hello" a number?', checker.check('hello', 'number'));
  console.log('Type of Promise:', checker.getType(Promise.resolve()));

  // Validate schema
  const userSchema = {
    id: 'number',
    name: 'string',
    email: 'string',
    metadata: 'object',
  };

  const validUser = {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    metadata: {},
  };

  // TODO: Test schema validation
  // const validationResult = checker.validateSchema(validUser, userSchema);

  // TODO: Test APIWrapper
  console.log('\n3. Testing APIWrapper:');

  async function fetchData(id) {
    return { id, data: 'result' };
  }

  const wrapper = new APIWrapper();

  // TODO: Wrap async function
  // const wrappedFn = wrapper.wrapAsync(fetchData, {
  //   deprecate: true,
  //   message: 'Use async version',
  // });

  // Test with promise
  // await wrappedFn(123);

  // Test with callback
  // wrappedFn(456, (err, result) => {
  //   console.log('Callback result:', result);
  // });

  // TODO: Test UtilityLibrary
  console.log('\n4. Testing UtilityLibrary:');
  const lib = new UtilityLibrary();

  // Test inspection
  // console.log(lib.inspect({ user: 'alice', password: 'secret' }));

  // Test formatting
  // console.log(lib.format('User: %s, ID: %d', 'Alice', 123));

  // TODO: Test ExampleApp
  console.log('\n5. Testing ExampleApp:');
  const app = new ExampleApp();

  // TODO: Test methods
  // await app.getUser(123);
  // await app.processData({ items: [1, 2, 3] });

  // TODO: Print library stats
  console.log('\n=== Library Statistics ===');
  // console.log(lib.getStats());
}

// Uncomment to run:
// testProductionLibrary();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Run your solution:
 *    node exercise-5.js
 *
 * 2. Expected behavior:
 *    - Logger sanitizes sensitive data
 *    - TypeChecker validates types correctly
 *    - APIWrapper handles both callbacks and promises
 *    - Deprecation warnings appear appropriately
 *    - Environment-aware formatting works
 *
 * 3. Test cases to verify:
 *    ✓ Logging with sensitive data sanitization
 *    ✓ Type checking and validation
 *    ✓ Schema validation
 *    ✓ Dual API support (callback/promise)
 *    ✓ Deprecation warnings
 *    ✓ Custom inspection
 *    ✓ Environment-aware behavior
 *
 * EXAMPLE OUTPUT:
 * ───────────────────────────────────────
 * === Testing Production Utility Library ===
 *
 * 1. Testing Logger:
 * [2024-01-01T10:00:00.000Z] INFO: Application started
 * { port: 3000, password: '[REDACTED]' }
 *
 * [2024-01-01T10:00:01.000Z] ERROR: Database error
 * {
 *   error: 'Connection failed',
 *   credentials: { user: 'admin', password: '[REDACTED]' }
 * }
 *
 * 2. Testing TypeChecker:
 * Is 42 a number? true
 * Is "hello" a number? false
 * Type of Promise: Promise
 * Schema validation passed
 *
 * 3. Testing APIWrapper:
 * (node:12345) [DEP0001] DeprecationWarning:
 * This API is deprecated. Use async version instead.
 *
 * Promise result: { id: 123, data: 'result' }
 * Callback result: { id: 456, data: 'result' }
 *
 * 4. Testing UtilityLibrary:
 * { user: 'alice', password: '[REDACTED]' }
 * User: Alice, ID: 123
 *
 * 5. Testing ExampleApp:
 * User fetched: { id: 123, name: 'User123' }
 * Data processed: 3 items
 *
 * === Library Statistics ===
 * {
 *   logger: { calls: 5, sanitized: 2 },
 *   typeChecker: { checks: 10, assertions: 0, failures: 1 },
 *   apiWrapper: { deprecations: 1, callbacks: 1, promises: 2 }
 * }
 * ───────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - How do you combine multiple util functions effectively?
 * - What makes a utility library production-ready?
 * - How do you design for different environments?
 * - What statistics are useful to track?
 * - How do you balance features with performance?
 */

/**
 * BONUS IMPLEMENTATION IDEAS:
 *
 * 1. Plugin System:
 *    lib.use(myPlugin)
 *    Extend library with custom functionality
 *
 * 2. Configuration Presets:
 *    lib.preset('development') // Verbose logging
 *    lib.preset('production')  // Minimal logging
 *    lib.preset('testing')     // Silent mode
 *
 * 3. Performance Monitoring:
 *    lib.monitor.getMetrics()
 *    Track all operations and performance
 *
 * 4. Log Aggregation:
 *    lib.logger.stream()
 *    Stream logs to external service
 *
 * 5. CLI Tool:
 *    $ mylib analyze-logs app.log
 *    $ mylib check-types src/
 *    $ mylib find-deprecated src/
 */

/**
 * Real-World Usage Example:
 *
 * // config.js
 * const UtilLib = require('./utility-library');
 *
 * module.exports = new UtilLib({
 *   logger: {
 *     name: 'myapp',
 *     env: process.env.NODE_ENV,
 *     sensitiveFields: ['password', 'apiKey', 'ssn'],
 *   },
 *   api: {
 *     trackDeprecations: true,
 *     strictMode: process.env.STRICT === 'true',
 *   },
 * });
 *
 * // user-service.js
 * const lib = require('./config');
 *
 * class UserService {
 *   async getUser(id) {
 *     lib.types.assert(id, 'number', 'User ID must be a number');
 *     lib.logger.debug('Fetching user', { id });
 *
 *     const user = await database.query('SELECT * FROM users WHERE id = ?', [id]);
 *
 *     lib.logger.info('User fetched', lib.inspect(user));
 *     return user;
 *   }
 * }
 */
