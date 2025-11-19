/**
 * Exercise 2 Solution: Object Inspection
 *
 * This solution demonstrates:
 * - Using util.inspect to debug complex objects
 * - Customizing inspection depth, colors, and formatting
 * - Handling circular references safely
 * - Comparing different object display methods
 * - Creating custom inspect methods for classes
 */

const util = require('util');

/**
 * Step 1: Create a complex nested object
 */
const complexObject = {
  // Basic types
  name: 'Complex System',
  version: 1.5,
  active: true,

  // Nested objects
  config: {
    server: {
      host: 'localhost',
      port: 3000,
      ssl: {
        enabled: true,
        cert: '/path/to/cert',
        key: '/path/to/key'
      }
    },
    database: {
      type: 'postgresql',
      connection: {
        host: 'db.example.com',
        port: 5432,
        credentials: {
          username: 'admin',
          password: '***hidden***'
        }
      }
    }
  },

  // Arrays
  users: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' }
  ],

  // Special types
  createdAt: new Date(),
  updatedAt: new Date('2024-01-01'),

  // Function
  getStatus: function () {
    return this.active ? 'running' : 'stopped';
  },

  // Null and undefined
  deletedAt: null,
  metadata: undefined,

  // Symbols
  [Symbol('secret')]: 'hidden-value',

  // Getters
  get status() {
    return this.active ? 'Active' : 'Inactive';
  }
};

/**
 * Step 2: Basic inspection with default options
 */
function basicInspection() {
  console.log('=== Basic Inspection (Default Options) ===\n');

  // Default util.inspect - depth is limited to 2
  const inspected = util.inspect(complexObject);
  console.log(inspected);

  console.log('\nNotice:');
  console.log('- Nested objects beyond depth 2 show as [Object]');
  console.log('- Functions are shown but not their code');
  console.log('- Dates are formatted');
  console.log('- Default depth is 2');
}

/**
 * Step 3: Custom inspection with various options
 */
function customInspection() {
  console.log('\n=== Custom Inspection Options ===\n');

  // Option 1: Unlimited depth
  console.log('--- Unlimited Depth ---');
  const deepInspect = util.inspect(complexObject, {
    depth: null, // null = unlimited depth
    colors: false
  });
  console.log(deepInspect);

  // Option 2: With colors (if terminal supports it)
  console.log('\n--- With Colors ---');
  const coloredInspect = util.inspect(complexObject, {
    depth: null,
    colors: true,
    compact: false
  });
  console.log(coloredInspect);

  // Option 3: Compact format
  console.log('\n--- Compact Format ---');
  const compactInspect = util.inspect(complexObject, {
    depth: 3,
    compact: true,
    breakLength: 80
  });
  console.log(compactInspect);

  // Option 4: Show hidden properties
  console.log('\n--- Show Hidden Properties ---');
  const withHidden = util.inspect(complexObject, {
    depth: 2,
    showHidden: true
  });
  console.log(withHidden);

  // Option 5: Custom max array length
  console.log('\n--- Limited Array Length ---');
  const limitedArray = util.inspect(complexObject, {
    depth: 3,
    maxArrayLength: 2
  });
  console.log(limitedArray);
}

/**
 * Step 4: Compare different display methods
 */
function compareMethods() {
  console.log('\n=== Comparison: Different Display Methods ===\n');

  const testObj = {
    name: 'Test',
    nested: {
      deep: {
        value: 42
      }
    },
    func: () => 'hello',
    date: new Date(),
    buffer: Buffer.from('test')
  };

  // Method 1: console.log (uses util.inspect internally)
  console.log('--- console.log ---');
  console.log(testObj);

  // Method 2: util.inspect with custom options
  console.log('\n--- util.inspect (depth: null, colors: false) ---');
  console.log(util.inspect(testObj, { depth: null, colors: false }));

  // Method 3: JSON.stringify
  console.log('\n--- JSON.stringify ---');
  try {
    // Clone without functions and buffers for JSON
    const jsonSafe = {
      name: testObj.name,
      nested: testObj.nested,
      date: testObj.date
    };
    console.log(JSON.stringify(jsonSafe, null, 2));
    console.log('\nNote: Functions and Buffers cannot be stringified');
  } catch (err) {
    console.error('JSON.stringify error:', err.message);
  }

  // Method 4: util.format with %o
  console.log('\n--- util.format with %o ---');
  console.log(util.format('Object: %o', testObj));

  console.log('\n--- Summary ---');
  console.log('console.log:      Good for quick debugging');
  console.log('util.inspect:     Full control over display');
  console.log('JSON.stringify:   For serialization, limited types');
  console.log('util.format:      For formatted strings');
}

/**
 * Step 5: Handle circular references
 */
function handleCircular() {
  console.log('\n=== Handling Circular References ===\n');

  // Create object with circular reference
  const obj = {
    name: 'Parent',
    child: {
      name: 'Child'
    }
  };
  obj.child.parent = obj; // Circular reference

  // JSON.stringify fails with circular references
  console.log('--- JSON.stringify (will fail) ---');
  try {
    JSON.stringify(obj);
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // util.inspect handles circular references gracefully
  console.log('\n--- util.inspect (handles circular) ---');
  const inspected = util.inspect(obj, { depth: 3, colors: true });
  console.log('✓ Success:');
  console.log(inspected);
  console.log('\nNotice: Circular reference shown as [Circular *1]');
}

/**
 * BONUS: Custom inspect method for classes
 */
class User {
  constructor(name, email, password) {
    this.name = name;
    this.email = email;
    this._password = password; // Private
    this.createdAt = new Date();
  }

  // Custom inspect method
  [util.inspect.custom](depth, options) {
    // Return custom representation
    return `User { name: '${this.name}', email: '${this.email}' }`;
  }
}

function demonstrateCustomInspect() {
  console.log('\n=== Custom Inspect Method ===\n');

  const user = new User('John Doe', 'john@example.com', 'secret123');

  console.log('--- Default inspect (would show password) ---');
  // Temporarily disable custom inspect to show default
  const customInspect = user[util.inspect.custom];
  delete user[util.inspect.custom];
  console.log(util.inspect(user));
  user[util.inspect.custom] = customInspect;

  console.log('\n--- Custom inspect (hides password) ---');
  console.log(util.inspect(user));

  console.log('\n--- In console.log ---');
  console.log(user);
}

/**
 * BONUS: Inspect options in detail
 */
function demonstrateAllOptions() {
  console.log('\n=== All Inspection Options ===\n');

  const data = {
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    text: 'This is a very long string that might need to be broken',
    nested: { a: { b: { c: { d: 'deep' } } } }
  };

  console.log('--- Option: depth ---');
  console.log('depth: 2:', util.inspect(data, { depth: 2 }));
  console.log('depth: null:', util.inspect(data, { depth: null }));

  console.log('\n--- Option: colors ---');
  console.log('colors: true:', util.inspect(data, { colors: true, depth: 1 }));

  console.log('\n--- Option: compact ---');
  console.log('compact: false:');
  console.log(util.inspect(data, { compact: false, depth: 1 }));

  console.log('\n--- Option: maxArrayLength ---');
  console.log('maxArrayLength: 5:');
  console.log(util.inspect(data, { maxArrayLength: 5 }));

  console.log('\n--- Option: breakLength ---');
  console.log('breakLength: 40:');
  console.log(util.inspect(data, { breakLength: 40, depth: 1 }));

  console.log('\n--- Option: sorted ---');
  console.log('sorted: true:');
  console.log(util.inspect({ z: 1, a: 2, m: 3 }, { sorted: true }));
}

/**
 * Step 6: Run all demonstrations
 */
function runAllTests() {
  basicInspection();
  customInspection();
  compareMethods();
  handleCircular();
  demonstrateCustomInspect();
  demonstrateAllOptions();
}

// Run the tests
runAllTests();

/**
 * KEY LEARNING POINTS:
 *
 * 1. util.inspect Options:
 *    - depth: How many levels to expand (default: 2, null = unlimited)
 *    - colors: Add ANSI color codes (default: false)
 *    - compact: Minimize whitespace (default: true)
 *    - showHidden: Show non-enumerable properties (default: false)
 *    - maxArrayLength: Limit array elements shown (default: 100)
 *    - breakLength: Line length before breaking (default: 60)
 *
 * 2. Circular References:
 *    - JSON.stringify throws error
 *    - util.inspect handles gracefully with [Circular *n]
 *    - Important for debugging complex object graphs
 *
 * 3. Custom Inspect:
 *    - Implement [util.inspect.custom] method
 *    - Control how objects are displayed
 *    - Useful for hiding sensitive data
 *
 * 4. Use Cases:
 *    - Debugging: Use unlimited depth and colors
 *    - Logging: Use limited depth and no colors
 *    - Testing: Use compact format
 *
 * 5. Performance:
 *    - Deep inspection can be slow for large objects
 *    - Limit depth for performance-critical code
 *    - Consider caching inspected strings
 */

/**
 * COMMON MISTAKES TO AVOID:
 *
 * ❌ Using JSON.stringify for debugging:
 *    console.log(JSON.stringify(obj));
 *    // Fails with circular refs, functions, dates look weird
 *
 * ✅ Use util.inspect instead:
 *    console.log(util.inspect(obj, { depth: null }));
 *
 * ❌ Forgetting depth limits:
 *    util.inspect(deepObject);
 *    // Only shows 2 levels, missing important data
 *
 * ✅ Set appropriate depth:
 *    util.inspect(deepObject, { depth: null });
 *
 * ❌ Logging passwords/secrets:
 *    console.log(user); // Shows password!
 *
 * ✅ Implement custom inspect:
 *    user[util.inspect.custom] = () => 'User { ... }';
 */

/**
 * GOING FURTHER:
 *
 * Try these challenges:
 * 1. Create a logger that auto-formats objects with util.inspect
 * 2. Build a JSON viewer that handles circular references
 * 3. Implement a diff tool using util.inspect
 * 4. Create a debug utility that truncates large objects
 * 5. Build a pretty-printer for config files
 */
