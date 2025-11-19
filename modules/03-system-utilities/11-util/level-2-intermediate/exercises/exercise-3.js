/**
 * Exercise 3: Advanced Object Inspector
 *
 * DIFFICULTY: ⭐⭐ Intermediate
 * TIME: 25-30 minutes
 *
 * OBJECTIVE:
 * Build a smart object inspector with custom inspection rules, sensitive data
 * hiding, and configurable output formats. This is essential for debugging
 * complex applications without exposing sensitive information.
 *
 * REQUIREMENTS:
 * 1. Create classes that implement [util.inspect.custom]
 * 2. Hide sensitive data (passwords, tokens, API keys)
 * 3. Provide different detail levels based on depth
 * 4. Create environment-aware inspection (dev vs production)
 * 5. Build a reusable inspector utility
 *
 * BONUS CHALLENGES:
 * - Support custom sanitization rules
 * - Create different output formats (JSON, table, tree)
 * - Add performance metrics for inspection
 * - Implement inspection presets
 *
 * HINTS:
 * - Use [util.inspect.custom] symbol
 * - Check process.env.NODE_ENV for environment
 * - Use util.inspect() for nested objects with depth - 1
 * - Remember to respect the options parameter
 */

const util = require('util');

// TODO 1: Create User class with custom inspection
class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password; // Sensitive!
    this.apiKey = data.apiKey; // Sensitive!
    this.metadata = data.metadata || {};
  }

  // TODO: Implement [util.inspect.custom]
  // - Hide password and apiKey
  // - Show ID, name, email
  // - Respect depth for metadata
  // - Use colors if provided in options
  [util.inspect.custom](depth, options) {
    // Your code here
  }
}

// TODO 2: Create Database class with connection status
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

  // TODO: Implement [util.inspect.custom]
  // Show:
  // - Connection status (with emoji: 🟢/🔴)
  // - Host and port (hide password in config)
  // - Query statistics
  // - Last query (truncated if too long)
  // - Pool status
  [util.inspect.custom](depth, options) {
    // Your code here
  }
}

// TODO 3: Create SmartInspector utility
class SmartInspector {
  constructor(options = {}) {
    this.sensitiveFields = options.sensitiveFields || [
      'password',
      'apiKey',
      'secret',
      'token',
      'privateKey',
    ];

    this.environment = options.environment || process.env.NODE_ENV || 'development';

    this.maxStringLength = options.maxStringLength || 100;
    this.maxArrayLength = options.maxArrayLength || 10;
  }

  // TODO: Implement inspect method
  // - Detect and hide sensitive fields
  // - Apply depth limits
  // - Format based on environment
  // - Return formatted string
  inspect(value, options = {}) {
    // Your code here:
    // 1. Sanitize sensitive data
    // 2. Apply environment-specific formatting
    // 3. Use util.inspect with custom options
  }

  // TODO: Implement sanitize method
  // Recursively hide sensitive fields
  sanitize(obj) {
    // Your code here:
    // 1. Check if object
    // 2. Clone object
    // 3. Replace sensitive fields with '[REDACTED]'
    // 4. Recursively sanitize nested objects
  }

  // TODO: Get inspection options based on environment
  getInspectOptions(customOptions = {}) {
    // Your code here:
    // Return different options for dev vs production
  }
}

// TODO 4: Create DataCollection with smart inspection
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

  // TODO: Implement [util.inspect.custom]
  // Show:
  // - Collection name
  // - Item count
  // - First few items (based on maxArrayLength)
  // - "... N more items" if truncated
  // - Metadata only if depth > 0
  [util.inspect.custom](depth, options) {
    // Your code here
  }
}

// TODO 5: Create ConfigObject with environment-aware inspection
class ConfigObject {
  constructor(config) {
    this.public = config.public || {};
    this.secrets = config.secrets || {};
    this.internal = config.internal || {};
  }

  // TODO: Implement [util.inspect.custom]
  // Production:
  //   - Show only public config
  //   - Hide secrets completely
  //   - Hide internal state
  // Development:
  //   - Show public config
  //   - Show secrets (but redact values)
  //   - Show internal state
  [util.inspect.custom](depth, options) {
    // Your code here:
    // 1. Check environment
    // 2. Build appropriate representation
    // 3. Respect depth and options
  }
}

// TODO 6: Test the inspector system
function testInspectorSystem() {
  console.log('=== Testing Custom Inspection ===\n');

  // TODO: Test User class
  console.log('User inspection:');
  const user = new User({
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    password: 'secret123',
    apiKey: 'sk_live_abc123',
    metadata: {
      role: 'admin',
      lastLogin: new Date(),
    },
  });
  // console.log(user);
  // console.log(util.inspect(user, { colors: true, depth: 1 }));

  // TODO: Test Database class
  console.log('\nDatabase inspection:');
  const db = new Database({
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    password: 'db_secret',
  });
  db.connect();
  db.query('SELECT * FROM users WHERE id = 1');
  // console.log(db);

  // TODO: Test SmartInspector
  console.log('\nSmartInspector:');
  const inspector = new SmartInspector();
  const sensitiveData = {
    username: 'alice',
    password: 'secret',
    profile: {
      name: 'Alice',
      apiKey: 'sk_test_123',
    },
  };
  // console.log(inspector.inspect(sensitiveData));

  // TODO: Test DataCollection
  console.log('\nDataCollection inspection:');
  const collection = new DataCollection('Users');
  for (let i = 0; i < 15; i++) {
    collection.add({ id: i, name: `User${i}` });
  }
  // console.log(collection);
  // console.log(util.inspect(collection, { maxArrayLength: 3 }));

  // TODO: Test ConfigObject in different environments
  console.log('\nConfigObject (development):');
  const config = new ConfigObject({
    public: { apiUrl: 'https://api.example.com' },
    secrets: { apiKey: 'secret_key_123' },
    internal: { cacheEnabled: true },
  });
  // console.log(config);

  // Simulate production
  const oldEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  console.log('\nConfigObject (production):');
  // console.log(config);
  process.env.NODE_ENV = oldEnv;
}

// Uncomment to run:
// testInspectorSystem();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Run your solution:
 *    node exercise-3.js
 *
 * 2. Expected output:
 *    - User shows name/email but hides password/apiKey
 *    - Database shows connection status and stats
 *    - SmartInspector hides all sensitive fields
 *    - DataCollection shows summary for large arrays
 *    - ConfigObject changes based on environment
 *
 * 3. Test cases to verify:
 *    ✓ Sensitive fields are hidden
 *    ✓ Nested objects respect depth
 *    ✓ Large collections are truncated
 *    ✓ Production vs development output differs
 *    ✓ Colors and formatting work
 *    ✓ Connection status shows correctly
 *
 * EXAMPLE OUTPUT:
 * ───────────────────────────────────────
 * === Testing Custom Inspection ===
 *
 * User inspection:
 * User {
 *   id: 1,
 *   name: 'Alice',
 *   email: 'alice@example.com',
 *   password: '[HIDDEN]',
 *   apiKey: '[HIDDEN]',
 *   metadata: { role: 'admin', lastLogin: 2024-01-01T... }
 * }
 *
 * Database inspection:
 * Database 🟢 Connected
 *   Host: localhost:5432
 *   Queries: 1 query
 *   Last Query: "SELECT * FROM users WHERE id = 1"
 *   Last Query Time: 2024-01-01T10:00:00.000Z
 *   Pool: 0 active, 5 idle, 10 max
 *
 * SmartInspector:
 * {
 *   username: 'alice',
 *   password: '[REDACTED]',
 *   profile: { name: 'Alice', apiKey: '[REDACTED]' }
 * }
 *
 * DataCollection inspection:
 * Users (15 items) [
 *   { id: 0, name: 'User0' },
 *   { id: 1, name: 'User1' },
 *   { id: 2, name: 'User2' },
 *   ... 12 more items
 * ]
 *
 * ConfigObject (production):
 * Config { public: { apiUrl: '...' }, secrets: [REDACTED] }
 * ───────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - How does [util.inspect.custom] work?
 * - When should you hide data vs show it?
 * - How do you make inspection environment-aware?
 * - What makes good debug output?
 * - How do you handle nested objects in custom inspect?
 */

/**
 * BONUS IMPLEMENTATION IDEAS:
 *
 * 1. Inspection Presets:
 *    inspector.preset('minimal') // Minimal output
 *    inspector.preset('detailed') // Full details
 *    inspector.preset('secure') // Maximum data hiding
 *
 * 2. Custom Formatters:
 *    inspector.format(obj, 'json')  // JSON format
 *    inspector.format(obj, 'table') // Table format
 *    inspector.format(obj, 'tree')  // Tree structure
 *
 * 3. Sanitization Rules:
 *    inspector.addRule(/^_.*/, '[PRIVATE]')  // Hide fields starting with _
 *    inspector.addRule(/.*password.*/i, '[REDACTED]') // Regex match
 *
 * 4. Performance Tracking:
 *    inspector.inspect(obj, { trackPerformance: true })
 *    // Returns: { output: '...', time: 5.2ms, size: 1234 }
 */
