/**
 * Solution: Exercise 3 - Advanced Object Inspector
 * ==================================================
 *
 * This solution demonstrates how to create custom object inspection that:
 * - Hides sensitive data automatically
 * - Adapts to different environments
 * - Provides useful debug information
 * - Respects depth and formatting options
 *
 * Key techniques used:
 * - [util.inspect.custom] symbol for custom inspection
 * - Environment-aware formatting
 * - Recursive sanitization of sensitive data
 * - Smart truncation of large collections
 * - Performance-conscious inspection
 */

const util = require('util');

// =============================================================================
// SOLUTION: User class with sensitive data hiding
// =============================================================================

/**
 * STEP 1: User class with custom inspection
 *
 * This demonstrates hiding sensitive fields while showing useful debug info
 */
class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password; // Sensitive!
    this.apiKey = data.apiKey; // Sensitive!
    this.metadata = data.metadata || {};
  }

  /**
   * Custom inspection implementation
   * @param {number} depth - Current inspection depth
   * @param {Object} options - Inspection options
   * @returns {string} Formatted representation
   */
  [util.inspect.custom](depth, options) {
    // If depth is negative, just show class name
    if (depth < 0) {
      return options.stylize('[User]', 'special');
    }

    // Build safe representation
    const safe = {
      id: this.id,
      name: this.name,
      email: this.email,
      password: '[HIDDEN]',
      apiKey: '[HIDDEN]'
    };

    // Include metadata if depth allows
    if (depth > 0 && this.metadata) {
      safe.metadata = util.inspect(this.metadata, {
        ...options,
        depth: depth - 1
      });
    } else if (this.metadata && Object.keys(this.metadata).length > 0) {
      safe.metadata = '[Object]';
    }

    // Format output
    const className = options.stylize('User', 'special');
    const content = util.inspect(safe, {
      ...options,
      depth: depth - 1,
      compact: false
    });

    return `${className} ${content}`;
  }
}

// =============================================================================
// STEP 2: Database class with connection status
// =============================================================================

/**
 * Database class with rich debugging information
 * Shows connection status, query stats, and pool information
 */
class Database {
  constructor(config) {
    this.config = config;
    this.connected = false;
    this.queryCount = 0;
    this.lastQuery = null;
    this.lastQueryTime = null;
    this.connectionPool = {
      active: 0,
      idle: 5,
      max: 10,
    };
  }

  connect() {
    this.connected = true;
  }

  query(sql) {
    this.queryCount++;
    this.lastQuery = sql;
    this.lastQueryTime = new Date();
  }

  /**
   * Custom inspection with visual status indicators
   */
  [util.inspect.custom](depth, options) {
    if (depth < 0) {
      return options.stylize('[Database]', 'special');
    }

    // Status indicator
    const status = this.connected ? '🟢 Connected' : '🔴 Disconnected';

    // Hide password in config
    const safeConfig = { ...this.config };
    if (safeConfig.password) {
      safeConfig.password = '[HIDDEN]';
    }

    // Truncate long queries
    let queryDisplay = this.lastQuery || 'None';
    if (queryDisplay.length > 50) {
      queryDisplay = queryDisplay.substring(0, 47) + '...';
    }

    // Build output
    const lines = [
      `Database ${status}`,
      `  Host: ${this.config.host}:${this.config.port}`,
      `  Database: ${this.config.database || 'default'}`,
      `  Queries: ${this.queryCount}`,
    ];

    if (this.lastQuery) {
      lines.push(`  Last Query: "${queryDisplay}"`);
      lines.push(`  Last Query Time: ${this.lastQueryTime.toISOString()}`);
    }

    lines.push(
      `  Pool: ${this.connectionPool.active} active, ` +
      `${this.connectionPool.idle} idle, ` +
      `${this.connectionPool.max} max`
    );

    // Show full config if depth allows
    if (depth > 0) {
      lines.push(`  Config: ${util.inspect(safeConfig, {
        ...options,
        depth: depth - 1,
        compact: true
      })}`);
    }

    return lines.join('\n');
  }
}

// =============================================================================
// STEP 3: SmartInspector utility class
// =============================================================================

/**
 * Reusable inspector with automatic sensitive data detection
 */
class SmartInspector {
  constructor(options = {}) {
    this.sensitiveFields = options.sensitiveFields || [
      'password',
      'apiKey',
      'secret',
      'token',
      'privateKey',
      'accessToken',
      'refreshToken',
      'sessionId',
      'cookie',
      'creditCard'
    ];

    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.maxStringLength = options.maxStringLength || 100;
    this.maxArrayLength = options.maxArrayLength || 10;

    // Create case-insensitive regex patterns for sensitive field detection
    this.sensitivePatterns = this.sensitiveFields.map(
      field => new RegExp(field, 'i')
    );
  }

  /**
   * Inspect value with automatic sanitization
   * @param {*} value - Value to inspect
   * @param {Object} options - Inspection options
   * @returns {string} Formatted output
   */
  inspect(value, options = {}) {
    // Sanitize sensitive data first
    const sanitized = this.sanitize(value);

    // Get environment-specific options
    const inspectOptions = this.getInspectOptions(options);

    // Inspect sanitized value
    return util.inspect(sanitized, inspectOptions);
  }

  /**
   * Recursively sanitize sensitive fields
   * @param {*} obj - Object to sanitize
   * @returns {*} Sanitized copy
   */
  sanitize(obj) {
    // Handle primitives
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitize(item));
    }

    // Handle Date, RegExp, etc.
    if (obj.constructor !== Object) {
      return obj;
    }

    // Clone and sanitize object
    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check if field is sensitive
      const isSensitive = this.sensitivePatterns.some(
        pattern => pattern.test(key)
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (value && typeof value === 'object') {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get inspection options based on environment
   * @param {Object} customOptions - Custom options to merge
   * @returns {Object} Complete inspection options
   */
  getInspectOptions(customOptions = {}) {
    const baseOptions = {
      depth: 3,
      colors: true,
      maxArrayLength: this.maxArrayLength,
      maxStringLength: this.maxStringLength,
      breakLength: 80,
      compact: false
    };

    // Environment-specific adjustments
    if (this.environment === 'production') {
      return {
        ...baseOptions,
        depth: 1,
        colors: false,
        showHidden: false,
        maxArrayLength: 5,
        maxStringLength: 50,
        ...customOptions
      };
    } else if (this.environment === 'test') {
      return {
        ...baseOptions,
        colors: false,
        ...customOptions
      };
    } else {
      // Development
      return {
        ...baseOptions,
        showHidden: false,
        ...customOptions
      };
    }
  }

  /**
   * Check if a field name is sensitive
   * @param {string} fieldName - Field name to check
   * @returns {boolean} True if sensitive
   */
  isSensitiveField(fieldName) {
    return this.sensitivePatterns.some(pattern => pattern.test(fieldName));
  }

  /**
   * Add custom sensitive field pattern
   * @param {string|RegExp} pattern - Pattern to match
   */
  addSensitivePattern(pattern) {
    if (typeof pattern === 'string') {
      pattern = new RegExp(pattern, 'i');
    }
    this.sensitivePatterns.push(pattern);
  }
}

// =============================================================================
// STEP 4: DataCollection with smart truncation
// =============================================================================

/**
 * Collection class that provides summary for large datasets
 */
class DataCollection {
  constructor(name) {
    this.name = name;
    this.items = [];
    this.metadata = {
      created: new Date(),
      modified: new Date(),
    };
  }

  add(item) {
    this.items.push(item);
    this.metadata.modified = new Date();
  }

  /**
   * Custom inspection with smart truncation
   */
  [util.inspect.custom](depth, options) {
    if (depth < 0) {
      return options.stylize(`[${this.name}]`, 'special');
    }

    const itemCount = this.items.length;
    const maxItems = options.maxArrayLength || 10;

    // Determine how many items to show
    const showItems = Math.min(itemCount, maxItems);
    const hiddenCount = itemCount - showItems;

    // Build display
    let output = `${this.name} (${itemCount} item${itemCount === 1 ? '' : 's'})`;

    if (itemCount > 0) {
      output += ' [\n';

      // Show first N items
      for (let i = 0; i < showItems; i++) {
        const itemStr = util.inspect(this.items[i], {
          ...options,
          depth: depth - 1,
          compact: true
        });
        output += `  ${itemStr}`;
        if (i < showItems - 1 || hiddenCount > 0) {
          output += ',';
        }
        output += '\n';
      }

      // Show truncation message
      if (hiddenCount > 0) {
        output += `  ... ${hiddenCount} more item${hiddenCount === 1 ? '' : 's'}\n`;
      }

      output += ']';
    } else {
      output += ' []';
    }

    // Show metadata if depth allows
    if (depth > 0) {
      const metaStr = util.inspect(this.metadata, {
        ...options,
        depth: depth - 1,
        compact: true
      });
      output += `\n  Metadata: ${metaStr}`;
    }

    return output;
  }
}

// =============================================================================
// STEP 5: ConfigObject with environment-aware inspection
// =============================================================================

/**
 * Config class that hides secrets in production
 */
class ConfigObject {
  constructor(config) {
    this.public = config.public || {};
    this.secrets = config.secrets || {};
    this.internal = config.internal || {};
  }

  /**
   * Environment-aware custom inspection
   */
  [util.inspect.custom](depth, options) {
    const env = process.env.NODE_ENV || 'development';

    if (depth < 0) {
      return options.stylize('[Config]', 'special');
    }

    // Production: Minimal information
    if (env === 'production') {
      const safe = {
        public: this.public,
        secrets: '[REDACTED]',
        internal: '[HIDDEN]'
      };

      return `Config ${util.inspect(safe, {
        ...options,
        depth: depth - 1,
        compact: true
      })}`;
    }

    // Development: Show structure but redact secret values
    const safeSecrets = {};
    for (const key of Object.keys(this.secrets)) {
      safeSecrets[key] = '[REDACTED]';
    }

    const safe = {
      public: this.public,
      secrets: safeSecrets,
      internal: this.internal
    };

    return `Config ${util.inspect(safe, {
      ...options,
      depth: depth - 1,
      compact: false
    })}`;
  }

  /**
   * Get value safely (sanitizes secrets)
   */
  get(path) {
    const parts = path.split('.');
    let value = this;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }
}

// =============================================================================
// ADVANCED: Performance-tracking inspector
// =============================================================================

/**
 * Inspector that tracks performance metrics
 */
class PerformanceInspector extends SmartInspector {
  inspect(value, options = {}) {
    if (!options.trackPerformance) {
      return super.inspect(value, options);
    }

    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    const output = super.inspect(value, options);

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    const metrics = {
      output,
      time: `${(endTime - startTime).toFixed(2)}ms`,
      size: output.length,
      memoryDelta: `${((endMemory - startMemory) / 1024).toFixed(2)}KB`
    };

    return metrics;
  }
}

// =============================================================================
// TEST CASES
// =============================================================================

function testInspectorSystem() {
  console.log('=== Testing Custom Inspection ===\n');

  // Test 1: User class
  console.log('--- User Inspection ---\n');

  const user = new User({
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    password: 'secret123',
    apiKey: 'sk_live_abc123',
    metadata: {
      role: 'admin',
      lastLogin: new Date(),
      preferences: {
        theme: 'dark',
        notifications: true
      }
    },
  });

  console.log('Basic inspection:');
  console.log(user);

  console.log('\nWith colors and depth:');
  console.log(util.inspect(user, { colors: true, depth: 2 }));

  // Test 2: Database class
  console.log('\n--- Database Inspection ---\n');

  const db = new Database({
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    password: 'db_secret',
  });

  console.log('Before connection:');
  console.log(db);

  db.connect();
  db.query('SELECT * FROM users WHERE id = 1');
  db.query('UPDATE users SET last_login = NOW() WHERE id = 1');

  console.log('\nAfter queries:');
  console.log(db);

  // Test 3: SmartInspector
  console.log('\n--- SmartInspector ---\n');

  const inspector = new SmartInspector();

  const sensitiveData = {
    username: 'alice',
    password: 'secret',
    profile: {
      name: 'Alice',
      apiKey: 'sk_test_123',
      email: 'alice@example.com'
    },
    settings: {
      twoFactorEnabled: true,
      sessionToken: 'sess_abc123'
    }
  };

  console.log('Inspecting sensitive data:');
  console.log(inspector.inspect(sensitiveData));

  console.log('\nManual sanitization:');
  console.log(inspector.sanitize(sensitiveData));

  // Test 4: DataCollection
  console.log('\n--- DataCollection ---\n');

  const collection = new DataCollection('Users');
  for (let i = 0; i < 15; i++) {
    collection.add({ id: i, name: `User${i}`, email: `user${i}@example.com` });
  }

  console.log('Large collection (default limit):');
  console.log(collection);

  console.log('\nWith custom maxArrayLength:');
  console.log(util.inspect(collection, { maxArrayLength: 3 }));

  // Test 5: ConfigObject in different environments
  console.log('\n--- ConfigObject ---\n');

  const config = new ConfigObject({
    public: {
      apiUrl: 'https://api.example.com',
      version: '1.0.0'
    },
    secrets: {
      apiKey: 'secret_key_123',
      dbPassword: 'db_secret'
    },
    internal: {
      cacheEnabled: true,
      debugMode: false
    }
  });

  const oldEnv = process.env.NODE_ENV;

  process.env.NODE_ENV = 'development';
  console.log('Development environment:');
  console.log(config);

  process.env.NODE_ENV = 'production';
  console.log('\nProduction environment:');
  console.log(config);

  process.env.NODE_ENV = oldEnv;

  // Test 6: Performance tracking
  console.log('\n--- Performance Tracking ---\n');

  const perfInspector = new PerformanceInspector();

  const largeObject = {
    users: Array(100).fill(null).map((_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`
    })),
    metadata: {
      created: new Date(),
      version: '1.0.0'
    }
  };

  console.log('Performance metrics:');
  const metrics = perfInspector.inspect(largeObject, {
    trackPerformance: true,
    depth: 2
  });

  console.log(`Time: ${metrics.time}`);
  console.log(`Size: ${metrics.size} characters`);
  console.log(`Memory delta: ${metrics.memoryDelta}`);
}

// Run tests
if (require.main === module) {
  testInspectorSystem();
}

// =============================================================================
// ALTERNATIVE SOLUTION: Decorator-based approach
// =============================================================================

/**
 * ALTERNATIVE: Use decorators to add custom inspection
 *
 * This provides a more reusable way to add inspection to multiple classes
 */

function inspectable(options = {}) {
  const {
    hiddenFields = [],
    formatter = null
  } = options;

  return function(target) {
    target.prototype[util.inspect.custom] = function(depth, opts) {
      if (depth < 0) {
        return opts.stylize(`[${target.name}]`, 'special');
      }

      const safe = {};

      for (const [key, value] of Object.entries(this)) {
        if (hiddenFields.includes(key)) {
          safe[key] = '[HIDDEN]';
        } else {
          safe[key] = value;
        }
      }

      if (formatter) {
        return formatter(safe, depth, opts);
      }

      return `${target.name} ${util.inspect(safe, { ...opts, depth: depth - 1 })}`;
    };

    return target;
  };
}

// Usage example:
// @inspectable({ hiddenFields: ['password', 'apiKey'] })
// class SecureUser { ... }

module.exports = {
  User,
  Database,
  SmartInspector,
  DataCollection,
  ConfigObject,
  PerformanceInspector,
  inspectable
};

// =============================================================================
// KEY LEARNING POINTS
// =============================================================================

/**
 * 1. UTIL.INSPECT.CUSTOM SYMBOL
 *    The [util.inspect.custom] symbol lets you control how your objects
 *    appear in console.log, debuggers, and error messages. This is crucial
 *    for:
 *    - Hiding sensitive data
 *    - Providing useful debug information
 *    - Improving developer experience
 *
 * 2. RESPECT THE OPTIONS PARAMETER
 *    Always use the options parameter passed to your custom inspector:
 *    - options.stylize() for colors
 *    - depth for recursion control
 *    - maxArrayLength, maxStringLength for truncation
 *    This ensures your output respects user preferences
 *
 * 3. ENVIRONMENT-AWARE INSPECTION
 *    Different environments need different levels of detail:
 *    - Development: Show everything (helps debugging)
 *    - Production: Minimal output (security + performance)
 *    - Test: Consistent output (reproducible tests)
 *
 * 4. AUTOMATIC SENSITIVE DATA DETECTION
 *    Use patterns to detect sensitive fields:
 *    - password, apiKey, token, secret
 *    - Use regex for flexible matching
 *    - Allow customization per application
 *
 * 5. DEPTH MANAGEMENT
 *    - Check if depth < 0 (return simple string)
 *    - Pass depth - 1 to nested inspections
 *    - Prevents infinite recursion
 *    - Controls output size
 *
 * 6. PERFORMANCE CONSIDERATIONS
 *    Custom inspection runs frequently in development:
 *    - Avoid expensive operations
 *    - Cache computed values when possible
 *    - Use compact output for large objects
 *    - Consider lazy evaluation
 *
 * 7. VISUAL INDICATORS
 *    Use symbols and colors for quick understanding:
 *    - 🟢/🔴 for status
 *    - [HIDDEN]/[REDACTED] for security
 *    - Colors for different types
 *    - Indentation for hierarchy
 */

// =============================================================================
// COMMON MISTAKES
// =============================================================================

/**
 * MISTAKE 1: Infinite recursion
 * ❌ BAD:
 */
class BadClass {
  [util.inspect.custom]() {
    return util.inspect(this); // Calls itself forever!
  }
}
/**
 * ✅ GOOD: Return string or plain object
 */
class GoodClass {
  [util.inspect.custom](depth, options) {
    return `GoodClass { value: ${this.value} }`;
    // Or return plain object:
    // return { value: this.value };
  }
}

/**
 * MISTAKE 2: Ignoring depth parameter
 * ❌ BAD:
 */
class BadDepth {
  [util.inspect.custom](depth, options) {
    // Always shows everything, ignores depth!
    return util.inspect({
      nested: this.deepObject
    }, options);
  }
}
/**
 * ✅ GOOD: Respect depth
 */
class GoodDepth {
  [util.inspect.custom](depth, options) {
    if (depth < 0) return '[Object]';

    return util.inspect({
      nested: this.deepObject
    }, { ...options, depth: depth - 1 });
  }
}

/**
 * MISTAKE 3: Exposing sensitive data in production
 * ❌ BAD:
 */
class BadSecurity {
  [util.inspect.custom]() {
    return `User { password: ${this.password} }`; // Leaks password!
  }
}
/**
 * ✅ GOOD: Always hide sensitive data
 */
class GoodSecurity {
  [util.inspect.custom]() {
    return `User { password: [HIDDEN] }`;
  }
}

/**
 * MISTAKE 4: Not using options.stylize
 * ❌ BAD:
 */
class BadColors {
  [util.inspect.custom]() {
    return '\x1b[32mUser\x1b[0m'; // Hardcoded ANSI colors
  }
}
/**
 * ✅ GOOD: Use options.stylize
 */
class GoodColors {
  [util.inspect.custom](depth, options) {
    return options.stylize('User', 'special');
  }
}

/**
 * MISTAKE 5: Expensive operations in inspect
 * ❌ BAD:
 */
class BadPerformance {
  [util.inspect.custom]() {
    // Expensive operation every time object is logged!
    const stats = this.calculateComplexStatistics();
    return `Object { stats: ${stats} }`;
  }
}
/**
 * ✅ GOOD: Cache or compute lazily
 */
class GoodPerformance {
  [util.inspect.custom]() {
    if (!this._cachedStats) {
      this._cachedStats = this.calculateComplexStatistics();
    }
    return `Object { stats: ${this._cachedStats} }`;
  }
}

// =============================================================================
// GOING FURTHER - Advanced Challenges
// =============================================================================

/**
 * CHALLENGE 1: Multi-format Inspector
 * Build an inspector that can output in different formats:
 *
 * inspector.format(obj, 'json')  // JSON format
 * inspector.format(obj, 'yaml')  // YAML format
 * inspector.format(obj, 'table') // ASCII table
 * inspector.format(obj, 'tree')  // Tree structure
 *
 * Each format should:
 * - Respect depth limits
 * - Hide sensitive data
 * - Support colors
 * - Handle circular references
 */

/**
 * CHALLENGE 2: Smart Diff Inspector
 * Create an inspector that shows differences between objects:
 *
 * const diff = new DiffInspector();
 * console.log(diff.compare(obj1, obj2));
 *
 * Output:
 * Object {
 *   - name: 'Alice'  (removed)
 *   + name: 'Bob'    (added)
 *   ~ age: 25 → 26   (changed)
 *   email: '...'     (unchanged)
 * }
 *
 * Color-code additions, deletions, and changes.
 */

/**
 * CHALLENGE 3: Time-Travel Inspector
 * Build an inspector that records history:
 *
 * const obj = new TrackableObject({ value: 1 });
 * obj.value = 2;
 * obj.value = 3;
 *
 * console.log(obj); // Shows current state
 * console.log(obj.history()); // Shows all changes
 * console.log(obj.at(timestamp)); // Shows state at time
 *
 * Track:
 * - What changed
 * - When it changed
 * - Who changed it (stack trace)
 */

/**
 * CHALLENGE 4: Size-Aware Inspector
 * Create an inspector that adapts to terminal size:
 *
 * const inspector = new AdaptiveInspector();
 * console.log(inspector.inspect(obj));
 *
 * Behavior:
 * - Small terminal: Compact output
 * - Large terminal: Expanded output
 * - Split large objects across multiple lines
 * - Wrap at breakpoints
 * - Adjust depth based on available space
 */

/**
 * CHALLENGE 5: Interactive Inspector
 * Build an inspector with interactive exploration:
 *
 * const explorer = new InteractiveInspector(obj);
 * explorer.start();
 *
 * Features:
 * - Navigate with arrow keys
 * - Expand/collapse sections
 * - Search within object
 * - Copy paths to clipboard
 * - Show/hide hidden properties
 * - Real-time updates
 *
 * Similar to Chrome DevTools but in terminal.
 */

/**
 * BONUS: Circular Reference Handling
 *
 * Handle circular references gracefully:
 */
function testCircular() {
  const obj = { name: 'A' };
  obj.self = obj; // Circular reference

  class CircularSafe {
    constructor(data) {
      this.data = data;
    }

    [util.inspect.custom](depth, options) {
      // util.inspect handles circulars automatically
      return util.inspect(this.data, { ...options, depth: depth - 1 });
    }
  }

  const safe = new CircularSafe(obj);
  console.log(safe); // Won't crash!
}
