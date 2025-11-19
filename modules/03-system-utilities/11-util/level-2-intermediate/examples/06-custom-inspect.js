/**
 * Example 6: Custom Object Inspection with util.inspect.custom
 *
 * Learn how to implement custom inspection for your classes using the
 * util.inspect.custom symbol. This allows you to control exactly how
 * your objects appear in console.log, debuggers, and error messages.
 *
 * Key Concepts:
 * - Implementing [util.inspect.custom] symbol
 * - Hiding sensitive data
 * - Creating developer-friendly output
 * - Respecting inspection options
 */

const util = require('util');

// ===== EXAMPLE 1: Basic Custom Inspect =====
console.log('=== Example 1: Basic Custom Inspect ===\n');

class User {
  constructor(name, email, password) {
    this.name = name;
    this.email = email;
    this.password = password; // Sensitive!
  }
}

// Without custom inspect - exposes password!
const userBad = new User('Alice', 'alice@example.com', 'secret123');
console.log('Without custom inspect:');
console.log(userBad);
// Shows: User { name: 'Alice', email: 'alice@example.com', password: 'secret123' }

// With custom inspect - hides password
class SafeUser {
  constructor(name, email, password) {
    this.name = name;
    this.email = email;
    this.password = password;
  }

  [util.inspect.custom](depth, options) {
    return `SafeUser { name: '${this.name}', email: '${this.email}', password: '[HIDDEN]' }`;
  }
}

const userGood = new SafeUser('Alice', 'alice@example.com', 'secret123');
console.log('\nWith custom inspect:');
console.log(userGood);
// Shows: SafeUser { name: 'Alice', email: 'alice@example.com', password: '[HIDDEN]' }

// ===== EXAMPLE 2: Respecting Inspection Options =====
console.log('\n=== Example 2: Respecting Inspection Options ===\n');

class SmartUser {
  constructor(name, email, metadata) {
    this.name = name;
    this.email = email;
    this.metadata = metadata;
  }

  [util.inspect.custom](depth, options) {
    // Respect colors option
    const stylize = options.stylize || ((text) => text);

    // Respect depth option
    const metadataInspect = depth > 0
      ? util.inspect(this.metadata, { ...options, depth: depth - 1 })
      : '[Object]';

    return `SmartUser {\n` +
      `  name: ${stylize(this.name, 'string')},\n` +
      `  email: ${stylize(this.email, 'string')},\n` +
      `  metadata: ${metadataInspect}\n` +
      `}`;
  }
}

const smartUser = new SmartUser('Bob', 'bob@example.com', {
  role: 'admin',
  permissions: ['read', 'write'],
  settings: { theme: 'dark' }
});

console.log('Default inspection:');
console.log(smartUser);

console.log('\nWith colors:');
console.log(util.inspect(smartUser, { colors: true }));

console.log('\nWith limited depth:');
console.log(util.inspect(smartUser, { depth: 0 }));

// ===== EXAMPLE 3: Different Representations for Different Contexts =====
console.log('\n=== Example 3: Context-Aware Inspection ===\n');

class Config {
  constructor(data) {
    this.public = data.public;
    this.secrets = data.secrets;
  }

  [util.inspect.custom](depth, options) {
    // In production, hide secrets
    if (process.env.NODE_ENV === 'production') {
      return `Config { public: ${util.inspect(this.public)}, secrets: [REDACTED] }`;
    }

    // In development, show everything
    return `Config ${util.inspect({
      public: this.public,
      secrets: this.secrets
    }, options)}`;
  }
}

const config = new Config({
  public: { apiUrl: 'https://api.example.com' },
  secrets: { apiKey: 'super-secret-key' }
});

console.log('Config in development mode:');
console.log(config);

// Simulate production
const oldEnv = process.env.NODE_ENV;
process.env.NODE_ENV = 'production';

console.log('\nConfig in production mode:');
console.log(config);

process.env.NODE_ENV = oldEnv; // Restore

// ===== EXAMPLE 4: Custom Inspect for Collections =====
console.log('\n=== Example 4: Custom Collection Inspection ===\n');

class UserList {
  constructor() {
    this.users = [];
  }

  add(user) {
    this.users.push(user);
  }

  [util.inspect.custom](depth, options) {
    const count = this.users.length;
    const maxDisplay = options.maxArrayLength ?? 5;

    if (count === 0) {
      return 'UserList (empty)';
    }

    if (count <= maxDisplay) {
      const users = this.users.map(u => u.name).join(', ');
      return `UserList (${count} users) [ ${users} ]`;
    }

    const displayed = this.users.slice(0, maxDisplay).map(u => u.name).join(', ');
    const remaining = count - maxDisplay;
    return `UserList (${count} users) [ ${displayed} ... ${remaining} more ]`;
  }
}

const users = new UserList();
users.add({ name: 'Alice' });
users.add({ name: 'Bob' });
users.add({ name: 'Charlie' });

console.log('Small list:');
console.log(users);

// Add more users
for (let i = 0; i < 10; i++) {
  users.add({ name: `User${i}` });
}

console.log('\nLarge list (default):');
console.log(users);

console.log('\nLarge list (maxArrayLength: 3):');
console.log(util.inspect(users, { maxArrayLength: 3 }));

// ===== EXAMPLE 5: Readable String Representation =====
console.log('\n=== Example 5: Human-Readable Representations ===\n');

class Duration {
  constructor(milliseconds) {
    this.ms = milliseconds;
  }

  [util.inspect.custom]() {
    const seconds = this.ms / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;

    if (days >= 1) {
      return `Duration { ${days.toFixed(2)} days }`;
    }
    if (hours >= 1) {
      return `Duration { ${hours.toFixed(2)} hours }`;
    }
    if (minutes >= 1) {
      return `Duration { ${minutes.toFixed(2)} minutes }`;
    }
    if (seconds >= 1) {
      return `Duration { ${seconds.toFixed(2)} seconds }`;
    }
    return `Duration { ${this.ms} ms }`;
  }
}

console.log(new Duration(500));           // milliseconds
console.log(new Duration(5000));          // seconds
console.log(new Duration(300000));        // minutes
console.log(new Duration(7200000));       // hours
console.log(new Duration(172800000));     // days

// ===== EXAMPLE 6: Debugging Information =====
console.log('\n=== Example 6: Enhanced Debugging Information ===\n');

class Database {
  constructor(config) {
    this.config = config;
    this.connected = false;
    this.queryCount = 0;
    this.lastQuery = null;
    this.lastQueryTime = null;
  }

  connect() {
    this.connected = true;
  }

  query(sql) {
    this.queryCount++;
    this.lastQuery = sql;
    this.lastQueryTime = new Date();
  }

  [util.inspect.custom](depth, options) {
    const status = this.connected ? '🟢 Connected' : '🔴 Disconnected';
    const queries = this.queryCount > 0
      ? `${this.queryCount} queries`
      : 'No queries yet';

    let output = `Database ${status}\n`;
    output += `  Host: ${this.config.host}:${this.config.port}\n`;
    output += `  Queries: ${queries}\n`;

    if (this.lastQuery) {
      output += `  Last Query: "${this.lastQuery.slice(0, 50)}..."\n`;
      output += `  Last Query Time: ${this.lastQueryTime.toISOString()}`;
    }

    return output;
  }
}

const db = new Database({ host: 'localhost', port: 5432 });
console.log('Before connection:');
console.log(db);

db.connect();
db.query('SELECT * FROM users WHERE id = 123');

console.log('\nAfter connection and query:');
console.log(db);

// ===== EXAMPLE 7: Conditional Detail Levels =====
console.log('\n=== Example 7: Depth-Based Detail Levels ===\n');

class DetailedObject {
  constructor() {
    this.basic = 'Basic info';
    this.intermediate = { more: 'details', here: true };
    this.advanced = {
      deep: {
        nested: {
          data: 'Very detailed'
        }
      }
    };
  }

  [util.inspect.custom](depth, options) {
    // Shallow: Just basic info
    if (depth === null || depth >= 2) {
      return util.inspect({
        basic: this.basic,
        intermediate: this.intermediate,
        advanced: this.advanced
      }, { ...options, depth: depth === null ? null : depth - 1 });
    }

    // Medium depth: Skip advanced
    if (depth === 1) {
      return util.inspect({
        basic: this.basic,
        intermediate: this.intermediate,
        advanced: '[Object]'
      }, { ...options, depth: 0 });
    }

    // Minimal: Just type
    return 'DetailedObject { ... }';
  }
}

const detailed = new DetailedObject();

console.log('Depth 0:');
console.log(util.inspect(detailed, { depth: 0 }));

console.log('\nDepth 1:');
console.log(util.inspect(detailed, { depth: 1 }));

console.log('\nDepth 2:');
console.log(util.inspect(detailed, { depth: 2 }));

// ===== EXAMPLE 8: Formatting for Error Messages =====
console.log('\n=== Example 8: Custom Error Inspection ===\n');

class ValidationError {
  constructor(field, message, details = {}) {
    this.field = field;
    this.message = message;
    this.details = details;
    this.timestamp = new Date();
  }

  [util.inspect.custom](depth, options) {
    const timestamp = this.timestamp.toISOString();

    return `ValidationError: ${this.message}\n` +
      `  Field: ${this.field}\n` +
      `  Time: ${timestamp}\n` +
      `  Details: ${util.inspect(this.details, { ...options, depth: depth ? depth - 1 : 1 })}`;
  }
}

const error = new ValidationError('email', 'Invalid email format', {
  value: 'not-an-email',
  expected: 'user@domain.com',
  rule: 'EMAIL_FORMAT'
});

console.log(error);

// ===== EXAMPLE 9: Return Plain Object =====
console.log('\n=== Example 9: Returning Plain Object ===\n');

class Product {
  constructor(id, name, price) {
    this.id = id;
    this.name = name;
    this.price = price;
    this._internalState = { cached: true, version: 1 };
  }

  [util.inspect.custom](depth, options) {
    // Return plain object (util.inspect will format it)
    return {
      id: this.id,
      name: this.name,
      price: `$${this.price.toFixed(2)}`,
      // Omit internal state
    };
  }
}

const product = new Product(123, 'Laptop', 999.99);
console.log(product);

/**
 * Important Notes:
 *
 * 1. Custom Inspect Symbol:
 *    const util = require('util');
 *    [util.inspect.custom](depth, options) {
 *      return 'your custom representation';
 *    }
 *
 * 2. Return Types:
 *    ✅ String: Displayed as-is
 *    ✅ Plain object: Inspected with options
 *    ❌ Don't return 'this' (infinite loop!)
 *    ❌ Don't call util.inspect(this)
 *
 * 3. Parameters:
 *    - depth: Remaining inspection depth (null = unlimited)
 *    - options: Inspection options (colors, breakLength, etc.)
 *    - Recursive calls should use depth - 1
 *
 * 4. Best Practices:
 *    ✅ Hide sensitive data (passwords, tokens)
 *    ✅ Make output human-readable
 *    ✅ Respect depth and options parameters
 *    ✅ Keep output concise for large objects
 *    ✅ Use for debugging information
 *    ❌ Don't make it too expensive (it's called often)
 *    ❌ Don't include circular references
 *    ❌ Don't modify object state
 *
 * 5. Use Cases:
 *    - Hiding sensitive data in logs
 *    - Showing connection status
 *    - Formatting dates/durations
 *    - Summarizing large collections
 *    - Debug-friendly class representations
 */

/**
 * Try This:
 *
 * 1. Implement custom inspect for a database connection class
 * 2. Create a logger that hides PII (personally identifiable information)
 * 3. Build a custom inspect for a tree data structure
 * 4. Make a class that shows different info based on depth
 * 5. Create a readable representation for complex business objects
 */

/**
 * Common Patterns:
 *
 * // Pattern 1: Hide sensitive fields
 * [util.inspect.custom]() {
 *   const { password, apiKey, ...safe } = this;
 *   return `Class ${util.inspect(safe)}`;
 * }
 *
 * // Pattern 2: Readable summary
 * [util.inspect.custom]() {
 *   return `Class { count: ${this.items.length} items }`;
 * }
 *
 * // Pattern 3: Status indicator
 * [util.inspect.custom]() {
 *   const status = this.connected ? '✓' : '✗';
 *   return `Connection ${status}`;
 * }
 *
 * // Pattern 4: Respect options
 * [util.inspect.custom](depth, options) {
 *   return util.inspect(this.publicData, options);
 * }
 */
