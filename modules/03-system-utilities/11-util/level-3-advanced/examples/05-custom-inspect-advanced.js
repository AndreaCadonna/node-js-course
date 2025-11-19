/**
 * Example 5: Advanced Custom Inspect Patterns
 *
 * Demonstrates advanced [util.inspect.custom] implementations including
 * context-awareness, circular references, security, and performance.
 */

const util = require('util');

console.log('=== Advanced Custom Inspect Patterns ===\n');

// =============================================================================
// 1. Context-Aware Inspection
// =============================================================================
console.log('1. Context-Aware Inspection (Environment-Based)\n');

class User {
  constructor(id, name, email, password, apiKey) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.apiKey = apiKey;
    this.metadata = {
      lastLogin: new Date(),
      loginCount: 42,
      preferences: { theme: 'dark', notifications: true }
    };
  }

  [util.inspect.custom](depth, options, inspect) {
    const env = process.env.NODE_ENV || 'development';

    // Production: Minimal info, no sensitive data
    if (env === 'production') {
      return `User { id: ${this.id}, name: "${this.name}" }`;
    }

    // Staging: More info but still sanitized
    if (env === 'staging') {
      return inspect({
        id: this.id,
        name: this.name,
        email: this.email,
        password: '[HIDDEN]',
        apiKey: `${this.apiKey.substring(0, 8)}...`,
        metadata: this.metadata
      }, options);
    }

    // Development: Everything visible
    return inspect({
      id: this.id,
      name: this.name,
      email: this.email,
      password: '[DEV-VISIBLE]',
      apiKey: '[DEV-VISIBLE]',
      metadata: this.metadata
    }, options);
  }
}

const user = new User(1, 'Alice', 'alice@example.com', 'secret123', 'key_abcdefgh12345');

console.log('Current environment:', process.env.NODE_ENV || 'development');
console.log('User object:', user);
console.log('');

// =============================================================================
// 2. Depth-Aware Custom Inspect
// =============================================================================
console.log('2. Depth-Aware Custom Inspect\n');

class Tree {
  constructor(value, left = null, right = null) {
    this.value = value;
    this.left = left;
    this.right = right;
  }

  [util.inspect.custom](depth, options, inspect) {
    if (depth < 0) {
      return '[Tree ...]';
    }

    const newOptions = { ...options, depth: options.depth === null ? null : options.depth - 1 };

    return `Tree {
  value: ${this.value},
  left: ${inspect(this.left, newOptions)},
  right: ${inspect(this.right, newOptions)}
}`;
  }
}

const tree = new Tree(1,
  new Tree(2,
    new Tree(4),
    new Tree(5)
  ),
  new Tree(3,
    new Tree(6),
    new Tree(7)
  )
);

console.log('With depth: 2');
console.log(util.inspect(tree, { depth: 2 }));
console.log('');

console.log('With depth: 1');
console.log(util.inspect(tree, { depth: 1 }));
console.log('');

// =============================================================================
// 3. Custom Inspect with Circular Reference Handling
// =============================================================================
console.log('3. Handling Circular References\n');

class Graph {
  constructor(id) {
    this.id = id;
    this.neighbors = [];
  }

  addNeighbor(node) {
    this.neighbors.push(node);
  }

  [util.inspect.custom](depth, options, inspect) {
    // Use WeakSet to track visited nodes
    const visited = options.visited || new WeakSet();

    if (visited.has(this)) {
      return `[Circular: Graph ${this.id}]`;
    }

    visited.add(this);

    const neighborInfo = this.neighbors.map(n => {
      if (visited.has(n)) {
        return `[Circular: Graph ${n.id}]`;
      }
      return inspect(n, { ...options, visited, depth: depth - 1 });
    });

    return `Graph ${this.id} { neighbors: [${neighborInfo.join(', ')}] }`;
  }
}

const node1 = new Graph(1);
const node2 = new Graph(2);
const node3 = new Graph(3);

node1.addNeighbor(node2);
node2.addNeighbor(node3);
node3.addNeighbor(node1); // Circular!

console.log('Graph with circular reference:');
console.log(node1);
console.log('');

// =============================================================================
// 4. Performance-Optimized Custom Inspect
// =============================================================================
console.log('4. Performance-Optimized Custom Inspect\n');

class BigData {
  constructor(size) {
    this.data = Array(size).fill(null).map((_, i) => ({
      id: i,
      value: Math.random(),
      timestamp: new Date()
    }));
  }

  [util.inspect.custom](depth, options) {
    // Only show summary, not full data
    const summary = {
      type: 'BigData',
      size: this.data.length,
      sample: this.data.slice(0, 3),
      stats: {
        avgValue: this.data.reduce((sum, d) => sum + d.value, 0) / this.data.length,
        first: this.data[0],
        last: this.data[this.data.length - 1]
      }
    };

    return util.inspect(summary, options);
  }
}

const bigData = new BigData(10000);

console.time('Inspect large dataset');
console.log(bigData);
console.timeEnd('Inspect large dataset');
console.log('✅ Shows summary instead of 10,000 items!\n');

// =============================================================================
// 5. Security-Focused Custom Inspect
// =============================================================================
console.log('5. Security-Focused Custom Inspect\n');

class SecureConfig {
  constructor(config) {
    this.publicConfig = config.public || {};
    this.secretConfig = config.secret || {};
    this.sensitivePatterns = ['password', 'token', 'key', 'secret', 'apikey'];
  }

  get(key) {
    return this.publicConfig[key] || this.secretConfig[key];
  }

  [util.inspect.custom](depth, options) {
    // Always redact secrets, even in development
    const redacted = this.redactSecrets(this.secretConfig);

    return util.inspect({
      public: this.publicConfig,
      secret: redacted
    }, { ...options, depth: depth - 1 });
  }

  redactSecrets(obj) {
    const redacted = {};

    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = this.sensitivePatterns.some(pattern =>
        key.toLowerCase().includes(pattern)
      );

      if (isSensitive) {
        if (typeof value === 'string' && value.length > 8) {
          redacted[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
        } else {
          redacted[key] = '[REDACTED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactSecrets(value);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }
}

const config = new SecureConfig({
  public: {
    appName: 'MyApp',
    version: '1.0.0',
    port: 3000
  },
  secret: {
    databasePassword: 'super_secret_password_123',
    apiKey: 'sk_live_abcdefghijklmnop',
    jwtSecret: 'my_jwt_secret_key',
    publicEndpoint: 'https://api.example.com'
  }
});

console.log('Secure config:', config);
console.log('✅ Sensitive data automatically redacted!\n');

// =============================================================================
// 6. Color and Style Custom Inspect
// =============================================================================
console.log('6. Custom Colors and Styles\n');

class StyledOutput {
  constructor(data, style = 'default') {
    this.data = data;
    this.style = style;
  }

  [util.inspect.custom](depth, options) {
    const styles = {
      error: '\x1b[31m',    // Red
      success: '\x1b[32m',  // Green
      warning: '\x1b[33m',  // Yellow
      info: '\x1b[34m',     // Blue
      reset: '\x1b[0m'
    };

    const color = styles[this.style] || '';
    const reset = options.colors ? styles.reset : '';

    const inspected = util.inspect(this.data, {
      ...options,
      colors: false, // We handle colors manually
      depth: depth - 1
    });

    return `${color}${inspected}${reset}`;
  }
}

console.log('Error:', new StyledOutput({ message: 'Something went wrong' }, 'error'));
console.log('Success:', new StyledOutput({ message: 'All good!' }, 'success'));
console.log('Warning:', new StyledOutput({ message: 'Be careful' }, 'warning'));
console.log('');

// =============================================================================
// 7. Conditional Custom Inspect
// =============================================================================
console.log('7. Conditional Custom Inspect Based on Options\n');

class SmartObject {
  constructor(data) {
    this.data = data;
    this.metadata = {
      created: new Date(),
      version: '1.0',
      checksum: 'abc123'
    };
  }

  [util.inspect.custom](depth, options) {
    // Check custom option
    const showMetadata = options.showMetadata !== false;
    const compact = options.compact === true;

    const output = {
      data: this.data,
      ...(showMetadata && { metadata: this.metadata })
    };

    if (compact) {
      return JSON.stringify(output);
    }

    return util.inspect(output, { ...options, depth: depth - 1 });
  }
}

const smartObj = new SmartObject({ id: 1, value: 'test' });

console.log('Default (with metadata):');
console.log(smartObj);

console.log('\nWithout metadata:');
console.log(util.inspect(smartObj, { showMetadata: false }));

console.log('\nCompact:');
console.log(util.inspect(smartObj, { compact: true }));
console.log('');

// =============================================================================
// 8. Async-Ready Custom Inspect
// =============================================================================
console.log('8. Lazy-Loading Data in Custom Inspect\n');

class LazyData {
  constructor(id) {
    this.id = id;
    this._cachedData = null;
  }

  async loadData() {
    // Simulate async loading
    return new Promise(resolve => {
      setTimeout(() => {
        this._cachedData = {
          id: this.id,
          value: Math.random(),
          timestamp: new Date()
        };
        resolve(this._cachedData);
      }, 10);
    });
  }

  [util.inspect.custom](depth, options) {
    // Show cached data if available, otherwise show placeholder
    if (this._cachedData) {
      return util.inspect({
        id: this.id,
        data: this._cachedData,
        status: 'loaded'
      }, { ...options, depth: depth - 1 });
    }

    return util.inspect({
      id: this.id,
      data: '[Not Loaded - call loadData()]',
      status: 'pending'
    }, { ...options, depth: depth - 1 });
  }
}

const lazyData = new LazyData(123);

console.log('Before loading:');
console.log(lazyData);

lazyData.loadData().then(() => {
  console.log('\nAfter loading:');
  console.log(lazyData);
  console.log('');
});

// =============================================================================
// 9. Inheritance and Custom Inspect
// =============================================================================
setTimeout(() => {
  console.log('9. Custom Inspect with Inheritance\n');

  class Animal {
    constructor(name) {
      this.name = name;
    }

    [util.inspect.custom](depth, options) {
      return `Animal { name: "${this.name}" }`;
    }
  }

  class Dog extends Animal {
    constructor(name, breed) {
      super(name);
      this.breed = breed;
    }

    [util.inspect.custom](depth, options) {
      // Call parent's custom inspect
      const parentInspect = super[util.inspect.custom](depth, options);
      return `Dog { name: "${this.name}", breed: "${this.breed}" }`;
    }
  }

  const animal = new Animal('Generic');
  const dog = new Dog('Buddy', 'Golden Retriever');

  console.log('Animal:', animal);
  console.log('Dog:', dog);
  console.log('');
}, 100);

// =============================================================================
// 10. Production Best Practices
// =============================================================================
setTimeout(() => {
  console.log('10. Production-Ready Custom Inspect\n');

  class ProductionEntity {
    constructor(data) {
      this.id = data.id;
      this.type = data.type;
      this.publicData = data.public || {};
      this.privateData = data.private || {};
      this.createdAt = new Date();
    }

    [util.inspect.custom](depth, options, inspect) {
      const env = process.env.NODE_ENV || 'development';

      // Build output based on environment and depth
      const output = {
        id: this.id,
        type: this.type
      };

      // Add public data (always safe)
      if (depth > 0) {
        output.publicData = this.publicData;
      }

      // Add private data only in development
      if (env === 'development' && depth > 1) {
        output.privateData = this.redactSensitive(this.privateData);
      }

      // Add metadata in verbose mode
      if (options.showHidden) {
        output.createdAt = this.createdAt;
      }

      // Use provided inspect function for consistency
      return inspect(output, {
        ...options,
        depth: depth - 1,
        showHidden: false // Don't cascade showHidden
      });
    }

    redactSensitive(obj) {
      const sensitive = ['password', 'token', 'secret', 'key'];
      const redacted = {};

      for (const [key, value] of Object.entries(obj)) {
        if (sensitive.some(s => key.toLowerCase().includes(s))) {
          redacted[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          redacted[key] = this.redactSensitive(value);
        } else {
          redacted[key] = value;
        }
      }

      return redacted;
    }
  }

  const entity = new ProductionEntity({
    id: 123,
    type: 'user',
    public: {
      name: 'Alice',
      email: 'alice@example.com'
    },
    private: {
      password: 'secret123',
      apiToken: 'tok_abc123',
      preferences: { theme: 'dark' }
    }
  });

  console.log('Standard inspect:');
  console.log(entity);

  console.log('\nDeep inspect (depth: 2):');
  console.log(util.inspect(entity, { depth: 2 }));

  console.log('\nWith hidden fields:');
  console.log(util.inspect(entity, { showHidden: true, depth: 2 }));

  console.log('\n=== Key Takeaways ===');
  console.log('1. Make inspect context-aware (environment, depth, options)');
  console.log('2. Handle circular references with WeakSet');
  console.log('3. Optimize for performance with summaries');
  console.log('4. Always redact sensitive data');
  console.log('5. Support custom colors and styles');
  console.log('6. Respond to custom options');
  console.log('7. Handle lazy-loaded data gracefully');
  console.log('8. Consider inheritance chains');
  console.log('9. Use provided inspect function for consistency');
  console.log('10. Combine all patterns for production use');
}, 200);
