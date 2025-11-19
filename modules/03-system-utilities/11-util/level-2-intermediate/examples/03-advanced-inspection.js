/**
 * Example 3: Advanced Object Inspection
 *
 * Master advanced util.inspect() options for debugging complex objects.
 * Learn about depth control, showHidden, breakLength, custom colors,
 * and other powerful inspection options.
 *
 * Key Concepts:
 * - Advanced inspection options
 * - Controlling output formatting
 * - Handling large and nested objects
 * - Performance considerations
 */

const util = require('util');

// ===== EXAMPLE 1: Depth Control =====
console.log('=== Example 1: Depth Control ===\n');

const deeplyNested = {
  level1: {
    level2: {
      level3: {
        level4: {
          level5: {
            value: 'Hidden by default'
          }
        }
      }
    }
  }
};

// Default depth (2)
console.log('Default depth (2):');
console.log(util.inspect(deeplyNested));
// Shows: { level1: { level2: { level3: [Object] } } }

// Custom depth
console.log('\nDepth 4:');
console.log(util.inspect(deeplyNested, { depth: 4 }));

// Unlimited depth
console.log('\nUnlimited depth (null):');
console.log(util.inspect(deeplyNested, { depth: null }));

// ===== EXAMPLE 2: showHidden Option =====
console.log('\n=== Example 2: Showing Hidden Properties ===\n');

const obj = { visible: 'shown' };

// Add non-enumerable property
Object.defineProperty(obj, 'hidden', {
  value: 'secret',
  enumerable: false
});

// Add symbol property
const sym = Symbol('mySymbol');
obj[sym] = 'symbol value';

console.log('Default inspection:');
console.log(util.inspect(obj));
// Shows: { visible: 'shown' }

console.log('\nWith showHidden:');
console.log(util.inspect(obj, { showHidden: true }));
// Shows: { visible: 'shown', [hidden]: 'secret', [Symbol(mySymbol)]: 'symbol value' }

// ===== EXAMPLE 3: breakLength and compact =====
console.log('\n=== Example 3: Controlling Line Breaks ===\n');

const wideObject = {
  name: 'Alice',
  email: 'alice@example.com',
  address: '123 Main St',
  city: 'Springfield',
  country: 'USA'
};

console.log('Default breakLength (60):');
console.log(util.inspect(wideObject));

console.log('\nbreakLength = 40 (more compact):');
console.log(util.inspect(wideObject, { breakLength: 40 }));

console.log('\nbreakLength = Infinity (single line):');
console.log(util.inspect(wideObject, { breakLength: Infinity }));

console.log('\ncompact = false (always multiline):');
console.log(util.inspect(wideObject, { compact: false }));

console.log('\ncompact = 3 (arrays with ≤3 items on one line):');
const arrays = {
  short: [1, 2, 3],
  long: [1, 2, 3, 4, 5]
};
console.log(util.inspect(arrays, { compact: 3 }));

// ===== EXAMPLE 4: maxArrayLength =====
console.log('\n=== Example 4: Limiting Array Display ===\n');

const longArray = Array.from({ length: 100 }, (_, i) => i);

console.log('Default (maxArrayLength = 100):');
console.log(util.inspect(longArray));

console.log('\nmaxArrayLength = 10:');
console.log(util.inspect(longArray, { maxArrayLength: 10 }));
// Shows: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ... 90 more items ]

console.log('\nmaxArrayLength = null (show all):');
console.log(util.inspect(longArray, { maxArrayLength: null }));

// ===== EXAMPLE 5: maxStringLength =====
console.log('\n=== Example 5: Limiting String Display ===\n');

const longString = 'A'.repeat(200);

const objWithLongString = {
  shortString: 'Hello',
  longString: longString
};

console.log('Default (maxStringLength = 10000):');
console.log(util.inspect(objWithLongString));

console.log('\nmaxStringLength = 50:');
console.log(util.inspect(objWithLongString, { maxStringLength: 50 }));

// ===== EXAMPLE 6: showProxy =====
console.log('\n=== Example 6: Inspecting Proxies ===\n');

const target = { name: 'Original' };
const handler = {
  get(target, prop) {
    return prop in target ? target[prop] : 'Default';
  }
};

const proxy = new Proxy(target, handler);

console.log('Default (showProxy = false):');
console.log(util.inspect(proxy));

console.log('\nWith showProxy = true:');
console.log(util.inspect(proxy, { showProxy: true }));

// ===== EXAMPLE 7: getters Option =====
console.log('\n=== Example 7: Inspecting Getters ===\n');

const objWithGetters = {
  _value: 42,

  get value() {
    return this._value;
  },

  get expensive() {
    console.log('  (Expensive getter called)');
    return 'computed';
  }
};

console.log('Default (getters = false):');
console.log(util.inspect(objWithGetters));

console.log('\nWith getters = true:');
console.log(util.inspect(objWithGetters, { getters: true }));

console.log('\nWith getters = "get" (only invoke getters):');
console.log(util.inspect(objWithGetters, { getters: 'get' }));

console.log('\nWith getters = "set" (only show setters):');
const objWithSetter = {
  _x: 0,
  set x(val) { this._x = val; }
};
console.log(util.inspect(objWithSetter, { getters: 'set' }));

// ===== EXAMPLE 8: Custom Colors =====
console.log('\n=== Example 8: Custom Colors ===\n');

const colorfulData = {
  string: 'text',
  number: 42,
  boolean: true,
  null: null,
  undefined: undefined,
  date: new Date(),
  regexp: /pattern/
};

console.log('With colors:');
console.log(util.inspect(colorfulData, { colors: true }));

console.log('\nCustom color scheme:');
// Customize colors
util.inspect.styles.string = 'cyan';
util.inspect.styles.number = 'yellow';
util.inspect.styles.boolean = 'magenta';

console.log(util.inspect(colorfulData, { colors: true }));

// Reset to defaults
util.inspect.styles.string = 'green';
util.inspect.styles.number = 'yellow';
util.inspect.styles.boolean = 'yellow';

// ===== EXAMPLE 9: Sorting Keys =====
console.log('\n=== Example 9: Sorting Object Keys ===\n');

const unsortedObj = {
  zebra: 1,
  apple: 2,
  mango: 3,
  banana: 4
};

console.log('Default (insertion order):');
console.log(util.inspect(unsortedObj));

console.log('\nWith sorted = true:');
console.log(util.inspect(unsortedObj, { sorted: true }));

console.log('\nWith custom sort function:');
console.log(util.inspect(unsortedObj, {
  sorted: (a, b) => b.localeCompare(a) // Reverse alphabetical
}));

// ===== EXAMPLE 10: Combining Options =====
console.log('\n=== Example 10: Combining Multiple Options ===\n');

const complexData = {
  users: Array.from({ length: 50 }, (_, i) => ({
    id: i,
    name: `User${i}`,
    metadata: {
      created: new Date(),
      tags: ['tag1', 'tag2', 'tag3']
    }
  })),
  config: {
    deep: {
      nested: {
        value: 'important'
      }
    }
  }
};

console.log('Optimized for readability:');
console.log(util.inspect(complexData, {
  depth: 3,              // Show 3 levels
  colors: true,          // Use colors
  compact: false,        // Multiline format
  maxArrayLength: 5,     // Limit array display
  breakLength: 60,       // Break at 60 chars
  sorted: true           // Sort keys
}));

// ===== EXAMPLE 11: Performance Considerations =====
console.log('\n=== Example 11: Performance Testing ===\n');

const hugeObject = {
  array: Array.from({ length: 10000 }, (_, i) => ({ id: i, data: 'x'.repeat(100) }))
};

console.time('Default inspection');
util.inspect(hugeObject);
console.timeEnd('Default inspection');

console.time('Limited inspection');
util.inspect(hugeObject, {
  depth: 1,
  maxArrayLength: 10,
  maxStringLength: 20
});
console.timeEnd('Limited inspection');

console.log('Limited inspection is much faster!');

/**
 * Important Notes:
 *
 * 1. Inspection Options:
 *    - depth: How deep to inspect (default: 2, null = unlimited)
 *    - showHidden: Show non-enumerable properties (default: false)
 *    - colors: Use ANSI colors (default: false)
 *    - breakLength: Width before breaking to new line (default: 60)
 *    - compact: Compact format (default: 3)
 *    - maxArrayLength: Max array items (default: 100)
 *    - maxStringLength: Max string length (default: 10000)
 *    - sorted: Sort keys (default: false)
 *    - getters: Invoke getters (default: false)
 *    - showProxy: Show proxy details (default: false)
 *
 * 2. Performance Tips:
 *    ✅ Limit depth for large nested objects
 *    ✅ Set maxArrayLength for long arrays
 *    ✅ Use maxStringLength for objects with long strings
 *    ✅ Avoid showHidden in hot paths
 *    ❌ Don't use depth: null on unknown objects
 *    ❌ Don't invoke getters on untrusted objects
 *
 * 3. Common Use Cases:
 *    - Debugging: colors: true, depth: null
 *    - Logging: compact: true, colors: false
 *    - Testing: sorted: true for consistent output
 *    - Production: Limit all sizes for safety
 *
 * 4. Default Settings:
 *    util.inspect.defaultOptions = {
 *      depth: 2,
 *      colors: false,
 *      maxArrayLength: 100,
 *      breakLength: 60,
 *      compact: 3,
 *      sorted: false,
 *      getters: false
 *    };
 */

/**
 * Try This:
 *
 * 1. Inspect a circular reference with different depth settings
 * 2. Compare console.log() vs util.inspect() for complex objects
 * 3. Create a custom inspection preset for different environments
 * 4. Measure performance impact of different options
 * 5. Build a smart inspector that auto-adjusts based on object size
 */

/**
 * Available Color Styles:
 *
 * util.inspect.styles = {
 *   special: 'cyan',    // Functions, symbols
 *   number: 'yellow',   // Numbers
 *   bigint: 'yellow',   // BigInt
 *   boolean: 'yellow',  // Booleans
 *   undefined: 'grey',  // undefined
 *   null: 'bold',       // null
 *   string: 'green',    // Strings
 *   date: 'magenta',    // Dates
 *   regexp: 'red',      // RegExp
 *   module: 'underline' // Modules
 * };
 *
 * Colors: black, red, green, yellow, blue, magenta, cyan, white
 * Modifiers: bold, italic, underline, inverse
 */
