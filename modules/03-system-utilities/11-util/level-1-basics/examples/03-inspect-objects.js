/**
 * Example 3: Object Inspection with util.inspect()
 *
 * Learn how to inspect and visualize complex JavaScript objects effectively.
 * util.inspect() provides much more control than console.log() for debugging.
 *
 * Key Concepts:
 * - Basic object inspection
 * - Controlling inspection depth
 * - Enabling colors for better readability
 * - Compact vs expanded formatting
 * - Inspecting nested structures
 */

const util = require('util');

// ===== EXAMPLE 1: Basic Inspection =====
console.log('=== Example 1: Basic Inspection ===\n');

const simpleObject = {
  name: 'Alice',
  age: 30,
  city: 'New York'
};

// Regular console.log
console.log('Using console.log:');
console.log(simpleObject);

// Using util.inspect
console.log('\nUsing util.inspect:');
console.log(util.inspect(simpleObject));

// They look similar for simple objects
console.log('\n✓ For simple objects, output is similar\n');

// ===== EXAMPLE 2: Nested Objects =====
console.log('=== Example 2: Nested Objects (Depth Problem) ===\n');

const nestedObject = {
  user: {
    name: 'Bob',
    profile: {
      bio: 'Developer',
      social: {
        twitter: '@bob',
        github: 'bob-dev',
        links: {
          website: 'bob.dev',
          blog: 'blog.bob.dev'
        }
      }
    }
  }
};

// Default console.log - limited depth (2)
console.log('Using console.log (default depth):');
console.log(nestedObject);

// util.inspect with default depth (also 2)
console.log('\nUsing util.inspect with default depth:');
console.log(util.inspect(nestedObject));

// util.inspect with increased depth
console.log('\nUsing util.inspect with depth: 5');
console.log(util.inspect(nestedObject, { depth: 5 }));

// util.inspect with unlimited depth
console.log('\nUsing util.inspect with depth: null (unlimited)');
console.log(util.inspect(nestedObject, { depth: null }));

// ===== EXAMPLE 3: Colors for Better Readability =====
console.log('\n=== Example 3: Colors for Readability ===\n');

const coloredObject = {
  string: 'Hello World',
  number: 42,
  boolean: true,
  null: null,
  undefined: undefined,
  date: new Date('2024-01-01'),
  regex: /test/g,
  array: [1, 2, 3, 4, 5]
};

console.log('Without colors:');
console.log(util.inspect(coloredObject, { colors: false }));

console.log('\nWith colors (if terminal supports):');
console.log(util.inspect(coloredObject, { colors: true }));

// ===== EXAMPLE 4: Compact vs Expanded =====
console.log('\n=== Example 4: Compact vs Expanded Formatting ===\n');

const largeObject = {
  users: [
    { id: 1, name: 'Alice', role: 'admin', active: true },
    { id: 2, name: 'Bob', role: 'user', active: true },
    { id: 3, name: 'Charlie', role: 'user', active: false }
  ],
  settings: {
    theme: 'dark',
    notifications: true,
    privacy: 'public'
  }
};

console.log('Compact formatting (compact: true):');
console.log(util.inspect(largeObject, { compact: true, depth: null }));

console.log('\nExpanded formatting (compact: false):');
console.log(util.inspect(largeObject, { compact: false, depth: null }));

console.log('\nAuto formatting (compact: 3 - default):');
console.log(util.inspect(largeObject, { compact: 3, depth: null }));

// ===== EXAMPLE 5: Arrays and Length Limits =====
console.log('\n=== Example 5: Array Length Limits ===\n');

const longArray = Array.from({ length: 150 }, (_, i) => i);

console.log('Default maxArrayLength (100):');
console.log(util.inspect(longArray));

console.log('\nLimited maxArrayLength (10):');
console.log(util.inspect(longArray, { maxArrayLength: 10 }));

console.log('\nUnlimited maxArrayLength (null):');
console.log(util.inspect(longArray, { maxArrayLength: null }));

// ===== EXAMPLE 6: Hidden Properties =====
console.log('\n=== Example 6: Hidden Properties ===\n');

const objectWithHidden = { visible: 'I am visible' };

// Add hidden property
Object.defineProperty(objectWithHidden, 'hidden', {
  value: 'I am hidden',
  enumerable: false  // This makes it hidden
});

console.log('Default inspection (showHidden: false):');
console.log(util.inspect(objectWithHidden));

console.log('\nWith showHidden: true:');
console.log(util.inspect(objectWithHidden, { showHidden: true }));

// ===== EXAMPLE 7: Complex Real-World Object =====
console.log('\n=== Example 7: Real-World Complex Object ===\n');

const complexConfig = {
  server: {
    host: 'localhost',
    port: 3000,
    ssl: {
      enabled: true,
      cert: '/path/to/cert.pem',
      key: '/path/to/key.pem'
    }
  },
  database: {
    connections: {
      primary: {
        host: 'db1.example.com',
        port: 5432,
        pool: { min: 2, max: 10 }
      },
      replica: {
        host: 'db2.example.com',
        port: 5432,
        pool: { min: 2, max: 10 }
      }
    }
  },
  cache: {
    redis: {
      nodes: [
        { host: 'redis1.example.com', port: 6379 },
        { host: 'redis2.example.com', port: 6379 }
      ]
    }
  }
};

console.log('Inspecting with optimal settings:');
console.log(util.inspect(complexConfig, {
  depth: null,
  colors: true,
  compact: false
}));

// ===== EXAMPLE 8: Comparison Summary =====
console.log('\n=== Example 8: When to Use What ===\n');

console.log('Use console.log() for:');
console.log('- ✓ Simple objects');
console.log('- ✓ Quick debugging');
console.log('- ✓ Shallow structures');

console.log('\nUse util.inspect() for:');
console.log('- ✓ Deep nested objects');
console.log('- ✓ Custom formatting needs');
console.log('- ✓ Circular references');
console.log('- ✓ Hidden properties');
console.log('- ✓ Large arrays');
console.log('- ✓ Production logging');

/**
 * Important Notes:
 *
 * 1. Depth Control:
 *    - Default depth: 2 (shows 2 levels)
 *    - depth: 5 (shows 5 levels)
 *    - depth: null (shows everything)
 *    - depth: 0 (shows only top level)
 *
 * 2. Common Options:
 *    - colors: true/false (ANSI colors)
 *    - depth: number/null (recursion depth)
 *    - compact: true/false/number (formatting)
 *    - showHidden: true/false (enumerable props)
 *    - maxArrayLength: number/null (array limit)
 *    - breakLength: number (line breaking)
 *
 * 3. Performance:
 *    - util.inspect() can be slow for huge objects
 *    - Use depth limits for better performance
 *    - Consider maxArrayLength for large arrays
 */

/**
 * Try This:
 *
 * 1. Inspect the `process` object with different depths
 * 2. Create an object with 10 nested levels and inspect it
 * 3. Compare inspection of Error objects with/without showHidden
 * 4. Inspect different data types (Map, Set, WeakMap, etc.)
 * 5. Create a custom inspect function for a class
 */
