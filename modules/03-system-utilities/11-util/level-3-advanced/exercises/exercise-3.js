/**
 * Exercise 3: Create Advanced Debug System
 * Difficulty: ⭐⭐⭐ Hard
 *
 * Build a production debugging system with namespaces, severity levels,
 * custom formatting, sensitive data redaction, and performance tracking.
 *
 * Learning objectives:
 * - Combine util.debuglog() with custom formatting
 * - Implement secure logging with sanitization
 * - Create context-aware debug output
 * - Build production-ready debugging tools
 */

const util = require('util');

console.log('Exercise 3: Create Advanced Debug System\n');

// =============================================================================
// YOUR TASK
// =============================================================================

/**
 * Implement a DebugSystem class with the following features:
 *
 * 1. Namespace support (e.g., 'app:database', 'app:api')
 * 2. Multiple severity levels (trace, debug, info, warn, error)
 * 3. Custom inspect for complex objects
 * 4. Automatic sensitive data redaction
 * 5. Context propagation
 * 6. Performance timing
 * 7. Conditional logging based on environment
 * 8. Structured output (JSON in prod, pretty in dev)
 *
 * Requirements:
 * - Use util.debuglog() for conditional debugging
 * - Use util.inspect() for object formatting
 * - Automatically redact sensitive fields
 * - Support both sync and async operations
 * - Track performance metrics
 * - Environment-aware formatting
 */

class DebugSystem {
  constructor(namespace, options = {}) {
    // TODO: Initialize debug system
    // - Set up namespace
    // - Create util.debuglog instance
    // - Configure options (environment, sensitive keys, etc.)
    // - Initialize metrics

    throw new Error('Not implemented');
  }

  /**
   * Log with severity level
   */
  log(level, message, context = {}) {
    // TODO: Implement logging with level check
    // - Check if level meets threshold
    // - Sanitize context
    // - Format output based on environment
    // - Use util.debuglog for debug/trace levels
    // - Always output error/warn levels

    throw new Error('Not implemented');
  }

  /**
   * Convenience methods
   */
  trace(message, context) {
    return this.log('trace', message, context);
  }

  debug(message, context) {
    return this.log('debug', message, context);
  }

  info(message, context) {
    return this.log('info', message, context);
  }

  warn(message, context) {
    return this.log('warn', message, context);
  }

  error(message, context) {
    return this.log('error', message, context);
  }

  /**
   * Sanitize sensitive data
   */
  sanitize(obj) {
    // TODO: Recursively redact sensitive fields
    // - Check against sensitiveKeys list
    // - Handle nested objects and arrays
    // - Preserve structure

    throw new Error('Not implemented');
  }

  /**
   * Time an operation
   */
  time(label, fn) {
    // TODO: Time sync or async operation
    // - Record start time
    // - Execute function
    // - Log duration
    // - Return result

    throw new Error('Not implemented');
  }

  /**
   * Create child logger with additional context
   */
  child(context) {
    // TODO: Create child logger that includes parent context
    throw new Error('Not implemented');
  }

  /**
   * Format output based on environment
   */
  format(data) {
    // TODO: Format differently for prod vs dev
    // - JSON for production
    // - Pretty print for development

    throw new Error('Not implemented');
  }

  /**
   * Custom inspect for the debug system itself
   */
  [util.inspect.custom](depth, options) {
    // TODO: Show debug system state
    throw new Error('Not implemented');
  }
}

// =============================================================================
// TEST CASES
// =============================================================================

console.log('Running tests...\n');

// Test 1: Basic logging
console.log('Test 1: Basic logging');
try {
  const debug = new DebugSystem('test:basic', {
    environment: 'development',
    minLevel: 'debug'
  });

  debug.info('Test message', { data: 'value' });
  debug.debug('Debug message', { details: { nested: true } });

  console.log('✅ PASS: Basic logging works');
} catch (err) {
  console.log('❌ FAIL:', err.message);
}

// Test 2: Sensitive data redaction
console.log('\nTest 2: Sensitive data redaction');
try {
  const debug = new DebugSystem('test:security', {
    environment: 'development',
    sensitiveKeys: ['password', 'token', 'secret']
  });

  debug.info('User login', {
    username: 'alice',
    password: 'super_secret',
    sessionToken: 'tok_abc123',
    metadata: {
      apiSecret: 'secret_key'
    }
  });

  console.log('✅ PASS: Sensitive data redaction (check output above)');
} catch (err) {
  console.log('❌ FAIL:', err.message);
}

// Test 3: Performance timing
console.log('\nTest 3: Performance timing');
(async () => {
  try {
    const debug = new DebugSystem('test:perf', {
      environment: 'development'
    });

    const result = await debug.time('async-operation', async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      return 'done';
    });

    if (result === 'done') {
      console.log('✅ PASS: Performance timing works');
    } else {
      console.log('❌ FAIL: Wrong result');
    }
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
})();

// Test 4: Child loggers with context
setTimeout(() => {
  console.log('\nTest 4: Child loggers');
  try {
    const parentDebug = new DebugSystem('test:parent', {
      environment: 'development'
    });

    const childDebug = parentDebug.child({
      requestId: 'req-123',
      userId: 'user-456'
    });

    childDebug.info('Child log message', { action: 'test' });

    console.log('✅ PASS: Child logger (check context in output)');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
}, 150);

// Test 5: Environment-based formatting
setTimeout(() => {
  console.log('\nTest 5: Environment formatting');
  try {
    const devDebug = new DebugSystem('test:dev', {
      environment: 'development'
    });

    const prodDebug = new DebugSystem('test:prod', {
      environment: 'production'
    });

    console.log('Development format:');
    devDebug.info('Test', { data: { nested: true } });

    console.log('\nProduction format (JSON):');
    prodDebug.info('Test', { data: { nested: true } });

    console.log('✅ PASS: Environment formatting');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
}, 250);

// Test 6: Log level filtering
setTimeout(() => {
  console.log('\nTest 6: Log level filtering');
  try {
    const debug = new DebugSystem('test:levels', {
      environment: 'development',
      minLevel: 'info' // Should filter out debug and trace
    });

    console.log('Setting minLevel to "info" (should filter debug/trace)');

    debug.trace('This should not appear');
    debug.debug('This should not appear');
    debug.info('This should appear');
    debug.warn('This should appear');

    console.log('✅ PASS: Log level filtering');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
}, 350);

// Test 7: Error logging
setTimeout(() => {
  console.log('\nTest 7: Error logging');
  try {
    const debug = new DebugSystem('test:errors', {
      environment: 'development'
    });

    const error = new Error('Test error');
    error.code = 'TEST_ERROR';
    error.statusCode = 500;

    debug.error('Operation failed', {
      error,
      context: { operation: 'test', attempt: 3 }
    });

    console.log('✅ PASS: Error logging (check stack trace above)');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
}, 450);

// Test 8: Circular reference handling
setTimeout(() => {
  console.log('\nTest 8: Circular reference handling');
  try {
    const debug = new DebugSystem('test:circular', {
      environment: 'development'
    });

    const circular = { a: 1 };
    circular.self = circular;

    debug.info('Circular object', { data: circular });

    console.log('✅ PASS: Circular references handled');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
}, 550);

// Test 9: Namespace hierarchy
setTimeout(() => {
  console.log('\nTest 9: Namespace hierarchy');
  try {
    const appDebug = new DebugSystem('myapp', { environment: 'development' });
    const dbDebug = new DebugSystem('myapp:database', { environment: 'development' });
    const apiDebug = new DebugSystem('myapp:api', { environment: 'development' });

    appDebug.info('App started');
    dbDebug.info('Database connected');
    apiDebug.info('API ready');

    console.log('✅ PASS: Namespace hierarchy');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
}, 650);

// Test 10: Custom inspect integration
setTimeout(() => {
  console.log('\nTest 10: Custom inspect integration');
  try {
    const debug = new DebugSystem('test:inspect', {
      environment: 'development'
    });

    class CustomObject {
      constructor() {
        this.publicData = 'visible';
        this.privateData = 'hidden';
      }

      [util.inspect.custom]() {
        return `CustomObject { publicData: "${this.publicData}" }`;
      }
    }

    debug.info('Custom object', { obj: new CustomObject() });

    console.log('✅ PASS: Custom inspect integration');
  } catch (err) {
    console.log('❌ FAIL:', err.message);
  }
}, 750);

// =============================================================================
// BONUS CHALLENGES
// =============================================================================

setTimeout(() => {
  console.log('\n=== Bonus Challenges ===\n');

  console.log('1. Add log sampling for high-volume scenarios');
  console.log('2. Implement rate limiting per namespace');
  console.log('3. Add log aggregation and statistics');
  console.log('4. Support custom formatters per namespace');
  console.log('5. Implement log streaming to external services');
  console.log('6. Add correlation ID tracking across async operations');
  console.log('7. Support log filtering with RegExp patterns');
  console.log('8. Add colored output for terminal with ANSI codes');

  console.log('\nSee solution file for complete implementation!');
}, 850);

// =============================================================================
// HINTS
// =============================================================================

/*
HINTS:

1. Debug system initialization:
   this.namespace = namespace;
   this.debuglog = util.debuglog(namespace);
   this.environment = options.environment || 'development';
   this.levels = { trace: 0, debug: 1, info: 2, warn: 3, error: 4 };

2. Sensitive data redaction:
   sanitize(obj) {
     if (!obj || typeof obj !== 'object') return obj;
     const result = {};
     for (const [key, value] of Object.entries(obj)) {
       if (this.sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
         result[key] = '[REDACTED]';
       } else if (typeof value === 'object') {
         result[key] = this.sanitize(value);
       } else {
         result[key] = value;
       }
     }
     return result;
   }

3. Performance timing:
   async time(label, fn) {
     const start = process.hrtime.bigint();
     try {
       const result = await fn();
       const duration = Number(process.hrtime.bigint() - start) / 1_000_000;
       this.debug(`${label} completed`, { duration: `${duration.toFixed(2)}ms` });
       return result;
     } catch (err) {
       this.error(`${label} failed`, { error: err });
       throw err;
     }
   }

4. Environment formatting:
   format(data) {
     if (this.environment === 'production') {
       return JSON.stringify(data);
     }
     return util.inspect(data, { depth: 5, colors: true });
   }

5. Child logger:
   child(context) {
     const child = new DebugSystem(this.namespace, this.options);
     child.defaultContext = { ...this.defaultContext, ...context };
     return child;
   }
*/
