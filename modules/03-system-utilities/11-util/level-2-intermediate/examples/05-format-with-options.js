/**
 * Example 5: Advanced Formatting with util.formatWithOptions()
 *
 * Learn how to use util.formatWithOptions() to combine string formatting
 * with custom inspection options. This gives you fine control over how
 * objects are formatted in log messages.
 *
 * Key Concepts:
 * - Combining format and inspect options
 * - Customizing object output in format strings
 * - Building advanced logging functions
 * - Controlling colors and depth in formatted output
 */

const util = require('util');

// ===== EXAMPLE 1: Basic formatWithOptions =====
console.log('=== Example 1: Basic formatWithOptions ===\n');

const user = {
  id: 123,
  name: 'Alice',
  email: 'alice@example.com',
  metadata: {
    created: new Date('2024-01-01'),
    role: 'admin',
    permissions: ['read', 'write', 'delete']
  }
};

// Regular util.format (default inspection)
console.log('util.format (default):');
console.log(util.format('User: %O', user));

// formatWithOptions with custom depth
console.log('\nformatWithOptions (depth: 1):');
console.log(util.formatWithOptions(
  { depth: 1 },
  'User: %O',
  user
));

// formatWithOptions with unlimited depth
console.log('\nformatWithOptions (depth: null):');
console.log(util.formatWithOptions(
  { depth: null },
  'User: %O',
  user
));

// ===== EXAMPLE 2: Colors in Formatted Output =====
console.log('\n=== Example 2: Colors in Formatted Messages ===\n');

const data = {
  status: 'success',
  count: 42,
  items: ['apple', 'banana', 'cherry']
};

// Without colors
console.log('Without colors:');
console.log(util.formatWithOptions(
  { colors: false },
  'Result: %O',
  data
));

// With colors
console.log('\nWith colors:');
console.log(util.formatWithOptions(
  { colors: true },
  'Result: %O',
  data
));

// ===== EXAMPLE 3: Compact vs Expanded =====
console.log('\n=== Example 3: Compact vs Expanded Formatting ===\n');

const complexObject = {
  server: { host: 'localhost', port: 3000 },
  database: { host: 'localhost', port: 5432 },
  cache: { host: 'localhost', port: 6379 }
};

// Compact format (single line)
console.log('Compact (breakLength: Infinity):');
console.log(util.formatWithOptions(
  { breakLength: Infinity, compact: true },
  'Config: %O',
  complexObject
));

// Expanded format (multi-line)
console.log('\nExpanded (compact: false):');
console.log(util.formatWithOptions(
  { compact: false },
  'Config: %O',
  complexObject
));

// ===== EXAMPLE 4: Custom Logging Function =====
console.log('\n=== Example 4: Custom Logger with formatWithOptions ===\n');

class Logger {
  constructor(options = {}) {
    this.options = {
      colors: options.colors !== false,
      depth: options.depth ?? 3,
      compact: options.compact ?? false,
      showHidden: options.showHidden ?? false
    };
  }

  log(message, ...args) {
    const formatted = util.formatWithOptions(
      this.options,
      message,
      ...args
    );
    console.log(`[LOG] ${formatted}`);
  }

  info(message, ...args) {
    const formatted = util.formatWithOptions(
      { ...this.options, colors: true },
      message,
      ...args
    );
    console.log(`[INFO] ${formatted}`);
  }

  debug(object) {
    const formatted = util.formatWithOptions(
      { ...this.options, depth: null, colors: true },
      '%O',
      object
    );
    console.log(`[DEBUG]\n${formatted}`);
  }
}

const logger = new Logger({ depth: 2, colors: true });

logger.log('User logged in: %s', 'alice@example.com');
logger.info('Request processed: %O', { method: 'GET', path: '/api/users' });
logger.debug({
  request: { id: 123, user: 'alice' },
  response: { status: 200, data: { items: [1, 2, 3] } }
});

// ===== EXAMPLE 5: Environment-Aware Formatting =====
console.log('\n=== Example 5: Environment-Aware Logging ===\n');

function createFormatter(env = 'development') {
  const options = {
    development: {
      colors: true,
      depth: null,
      compact: false,
      showHidden: true
    },
    production: {
      colors: false,
      depth: 2,
      compact: true,
      showHidden: false
    },
    test: {
      colors: false,
      depth: 1,
      compact: true,
      sorted: true
    }
  };

  const selectedOptions = options[env] || options.development;

  return function format(message, ...args) {
    return util.formatWithOptions(selectedOptions, message, ...args);
  };
}

// Development formatter (verbose)
const devFormat = createFormatter('development');
console.log('Development:');
console.log(devFormat('Debug info: %O', { deep: { nested: { data: 'value' } } }));

// Production formatter (compact)
const prodFormat = createFormatter('production');
console.log('\nProduction:');
console.log(prodFormat('Debug info: %O', { deep: { nested: { data: 'value' } } }));

// ===== EXAMPLE 6: Limiting Output Size =====
console.log('\n=== Example 6: Limiting Output Size ===\n');

const hugeArray = Array.from({ length: 1000 }, (_, i) => i);
const longString = 'x'.repeat(1000);

// Without limits (dangerous for logs)
console.log('Without limits (truncated for display):');
const unlimited = util.formatWithOptions(
  {},
  'Data: %O',
  { hugeArray, longString }
);
console.log(unlimited.slice(0, 100) + '...');

// With limits (safe for logs)
console.log('\nWith limits:');
console.log(util.formatWithOptions(
  {
    maxArrayLength: 5,
    maxStringLength: 50,
    depth: 2
  },
  'Data: %O',
  { hugeArray, longString }
));

// ===== EXAMPLE 7: Sorted Output for Testing =====
console.log('\n=== Example 7: Sorted Output for Tests ===\n');

const unsortedData = {
  zebra: 1,
  apple: 2,
  mango: 3,
  banana: 4
};

// Normal order (insertion order)
console.log('Normal order:');
console.log(util.formatWithOptions(
  { compact: true },
  '%O',
  unsortedData
));

// Sorted for consistent test output
console.log('\nSorted order:');
console.log(util.formatWithOptions(
  { sorted: true, compact: true },
  '%O',
  unsortedData
));

// ===== EXAMPLE 8: Hiding Sensitive Data =====
console.log('\n=== Example 8: Hiding Sensitive Data ===\n');

const userData = {
  username: 'alice',
  email: 'alice@example.com',
  _password: 'secret123', // Private field
  publicKey: 'pk_12345'
};

// Default (shows private fields)
console.log('Default inspection:');
console.log(util.formatWithOptions(
  {},
  'User: %O',
  userData
));

// Hide private fields (starts with _)
const safeData = Object.keys(userData)
  .filter(key => !key.startsWith('_'))
  .reduce((obj, key) => {
    obj[key] = userData[key];
    return obj;
  }, {});

console.log('\nSafe for logging:');
console.log(util.formatWithOptions(
  { colors: true },
  'User: %O',
  safeData
));

// ===== EXAMPLE 9: Multiple Placeholders with Options =====
console.log('\n=== Example 9: Multiple Placeholders ===\n');

const request = {
  method: 'POST',
  url: '/api/users',
  headers: { 'content-type': 'application/json' }
};

const response = {
  status: 201,
  body: { id: 123, created: true }
};

console.log(util.formatWithOptions(
  { colors: true, compact: false },
  'Request: %s %s\nHeaders: %O\nResponse: %d\nBody: %O',
  request.method,
  request.url,
  request.headers,
  response.status,
  response.body
));

// ===== EXAMPLE 10: Building a Structured Logger =====
console.log('\n=== Example 10: Structured Logger ===\n');

class StructuredLogger {
  constructor(context = {}) {
    this.context = context;
    this.formatOptions = {
      colors: true,
      depth: 3,
      compact: false
    };
  }

  _format(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const mergedData = { ...this.context, ...data };

    return util.formatWithOptions(
      this.formatOptions,
      '[%s] %s: %s %O',
      timestamp,
      level,
      message,
      mergedData
    );
  }

  info(message, data) {
    console.log(this._format('INFO', message, data));
  }

  error(message, data) {
    console.error(this._format('ERROR', message, data));
  }

  warn(message, data) {
    console.warn(this._format('WARN', message, data));
  }
}

const structuredLogger = new StructuredLogger({
  service: 'api',
  version: '1.0.0'
});

structuredLogger.info('Server started', {
  port: 3000,
  host: 'localhost'
});

structuredLogger.error('Database connection failed', {
  error: 'ECONNREFUSED',
  host: 'localhost',
  port: 5432
});

/**
 * Important Notes:
 *
 * 1. util.formatWithOptions() vs util.format():
 *    - format(): Uses default inspection options
 *    - formatWithOptions(): Custom inspection options
 *    - Both support same placeholders (%s, %d, %O, etc.)
 *
 * 2. Available Options:
 *    All options from util.inspect() can be used:
 *    - colors: Enable ANSI colors
 *    - depth: Inspection depth
 *    - compact: Compact/expanded format
 *    - breakLength: Line break width
 *    - maxArrayLength: Limit array items
 *    - maxStringLength: Limit string length
 *    - sorted: Sort object keys
 *    - showHidden: Show non-enumerable
 *
 * 3. Common Use Cases:
 *    ✅ Building custom logging libraries
 *    ✅ Environment-specific formatting
 *    ✅ Limiting output size for production
 *    ✅ Consistent test output (sorted)
 *    ✅ Colored development logs
 *
 * 4. Performance Considerations:
 *    - formatWithOptions has same performance as format
 *    - Inspection options affect performance
 *    - Use depth limits for large objects
 *    - Disable colors in production for speed
 *
 * 5. Best Practices:
 *    ✅ Create reusable formatters for different environments
 *    ✅ Limit depth and array length in production
 *    ✅ Use colors in development only
 *    ✅ Sort keys for test output consistency
 *    ❌ Don't use deep inspection in hot paths
 *    ❌ Don't log sensitive data
 */

/**
 * Try This:
 *
 * 1. Build a logger that changes format based on NODE_ENV
 * 2. Create formatters for different log levels (debug, info, warn, error)
 * 3. Implement a logger that sanitizes sensitive fields automatically
 * 4. Build a JSON logger using formatWithOptions
 * 5. Compare output sizes with different options
 */

/**
 * Placeholder Reference:
 *
 * %s - String
 * %d - Number
 * %i - Integer
 * %f - Floating point
 * %j - JSON (JSON.stringify)
 * %o - Object (single-line)
 * %O - Object (multi-line with options)
 * %c - CSS (browser only, ignored in Node.js)
 * %% - Literal '%'
 *
 * The %O placeholder respects formatWithOptions settings
 * while %j always uses JSON.stringify
 */
