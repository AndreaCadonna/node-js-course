/**
 * Example 7: Freezing and Sealing VM Contexts
 *
 * This example demonstrates techniques for creating immutable contexts
 * using Object.freeze() and Object.seal(), including deep freezing
 * strategies, security implications, and performance considerations.
 *
 * Topics covered:
 * - Object.freeze() and Object.seal()
 * - Deep freezing strategies
 * - Security implications
 * - Performance considerations
 * - Immutable context patterns
 */

const vm = require('vm');

// ============================================================================
// 1. Basic Freezing
// ============================================================================

console.log('=== 1. Basic Object.freeze() ===\n');

/**
 * Demonstrate basic freezing
 */
function demoBasicFreeze() {
  const ctx = vm.createContext({
    config: { port: 3000, host: 'localhost' },
    data: [1, 2, 3]
  });

  console.log('Before freezing:');
  vm.runInContext('config.port = 8080; console.log("Port changed to:", config.port)', ctx);

  // Freeze the config object
  Object.freeze(ctx.config);

  console.log('\nAfter freezing config:');
  try {
    vm.runInContext(`
      'use strict';
      config.port = 9000;  // Should throw in strict mode
    `, ctx);
  } catch (err) {
    console.log('Error (expected):', err.message);
  }

  // Non-strict mode silently fails
  vm.runInContext(`
    config.port = 9000;  // Silently fails
    console.log('Port is still:', config.port);
  `, ctx);
}

demoBasicFreeze();
console.log();

// ============================================================================
// 2. Shallow vs Deep Freeze
// ============================================================================

console.log('=== 2. Shallow vs Deep Freeze ===\n');

/**
 * Demonstrate shallow freeze limitations
 */
function demoShallowFreeze() {
  const ctx = vm.createContext({
    config: {
      server: {
        port: 3000,
        host: 'localhost'
      }
    }
  });

  // Shallow freeze
  Object.freeze(ctx.config);

  console.log('Shallow freeze - top level is frozen:');
  vm.runInContext(`
    config.newProperty = 'test';
    console.log('New property:', config.newProperty);  // undefined
  `, ctx);

  console.log('\nBut nested objects can still be modified:');
  vm.runInContext(`
    config.server.port = 8080;
    console.log('Server port changed to:', config.server.port);  // 8080!
  `, ctx);
}

demoShallowFreeze();

/**
 * Deep freeze implementation
 */
function deepFreeze(obj) {
  // Retrieve the property names defined on obj
  const propNames = Object.getOwnPropertyNames(obj);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = obj[name];

    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj);
}

console.log('\nDeep freeze - all levels frozen:');
const deepCtx = vm.createContext({
  config: {
    server: {
      port: 3000,
      host: 'localhost'
    }
  }
});

deepFreeze(deepCtx.config);

vm.runInContext(`
  config.server.port = 8080;
  console.log('Server port (should still be 3000):', config.server.port);
`, deepCtx);
console.log();

// ============================================================================
// 3. Object.seal() vs Object.freeze()
// ============================================================================

console.log('=== 3. Object.seal() vs Object.freeze() ===\n');

/**
 * Compare seal and freeze
 */
function compareSealAndFreeze() {
  // Sealed context
  const sealedCtx = vm.createContext({
    data: { value: 42 }
  });
  Object.seal(sealedCtx.data);

  console.log('Sealed object:');
  vm.runInContext(`
    console.log('  Original value:', data.value);
    data.value = 100;  // Can modify existing properties
    console.log('  Modified value:', data.value);
    data.newProp = 'test';  // Cannot add new properties
    console.log('  New property:', data.newProp);  // undefined
  `, sealedCtx);

  // Frozen context
  const frozenCtx = vm.createContext({
    data: { value: 42 }
  });
  Object.freeze(frozenCtx.data);

  console.log('\nFrozen object:');
  vm.runInContext(`
    console.log('  Original value:', data.value);
    data.value = 100;  // Cannot modify
    console.log('  Value after attempt:', data.value);  // Still 42
    data.newProp = 'test';  // Cannot add
    console.log('  New property:', data.newProp);  // undefined
  `, frozenCtx);
}

compareSealAndFreeze();
console.log();

// ============================================================================
// 4. Creating Immutable Contexts
// ============================================================================

console.log('=== 4. Creating Immutable Contexts ===\n');

/**
 * Create a completely immutable context
 */
class ImmutableContext {
  static create(data) {
    // Clone data to prevent external modification
    const clonedData = JSON.parse(JSON.stringify(data));

    // Deep freeze the cloned data
    deepFreeze(clonedData);

    // Create context with frozen built-ins
    const context = vm.createContext({
      ...clonedData,
      Math: Object.freeze({ ...Math }),
      JSON: Object.freeze({
        parse: JSON.parse,
        stringify: JSON.stringify
      }),
      console: Object.freeze({
        log: console.log,
        error: console.error
      })
    });

    // Freeze the context itself
    Object.freeze(context);

    return context;
  }

  static execute(code, data, options = {}) {
    const context = this.create(data);

    try {
      return vm.runInContext(code, context, {
        timeout: options.timeout || 1000
      });
    } catch (err) {
      throw new Error(`Execution error: ${err.message}`);
    }
  }
}

// Demo immutable context
console.log('Executing in immutable context:');

const result = ImmutableContext.execute(`
  const doubled = numbers.map(n => n * 2);
  const sum = doubled.reduce((a, b) => a + b, 0);
  sum
`, {
  numbers: [1, 2, 3, 4, 5]
});

console.log('Result:', result);

console.log('\nTrying to modify immutable data:');
try {
  ImmutableContext.execute(`
    'use strict';
    numbers.push(6);  // Should fail
  `, {
    numbers: [1, 2, 3]
  });
} catch (err) {
  console.log('Error (expected):', err.message);
}
console.log();

// ============================================================================
// 5. Selective Freezing
// ============================================================================

console.log('=== 5. Selective Freezing ===\n');

/**
 * Context with selectively frozen properties
 */
class SelectiveFreezeContext {
  constructor(config) {
    this.frozenProps = new Set(config.freeze || []);
    this.sealedProps = new Set(config.seal || []);
    this.context = null;
  }

  create(data) {
    const context = vm.createContext({ ...data });

    // Apply selective freezing
    for (const prop of this.frozenProps) {
      if (context[prop] !== undefined) {
        deepFreeze(context[prop]);
      }
    }

    // Apply selective sealing
    for (const prop of this.sealedProps) {
      if (context[prop] !== undefined) {
        Object.seal(context[prop]);
      }
    }

    this.context = context;
    return context;
  }

  execute(code, data) {
    const context = this.create(data);
    return vm.runInContext(code, context);
  }
}

// Demo selective freezing
const selective = new SelectiveFreezeContext({
  freeze: ['config'],
  seal: ['settings']
});

selective.execute(`
  console.log('Config (frozen):');
  config.port = 9000;
  console.log('  Port:', config.port);  // Still 3000

  console.log('\\nSettings (sealed):');
  settings.theme = 'dark';  // Can modify
  console.log('  Theme:', settings.theme);
  settings.newProp = 'test';  // Cannot add
  console.log('  New prop:', settings.newProp);

  console.log('\\nData (mutable):');
  data.push(4);
  console.log('  Data:', JSON.stringify(data));
`, {
  config: { port: 3000 },
  settings: { theme: 'light' },
  data: [1, 2, 3]
});
console.log();

// ============================================================================
// 6. Security Implications
// ============================================================================

console.log('=== 6. Security Implications ===\n');

/**
 * Demonstrate security considerations
 */
function demoSecurity() {
  console.log('Attempt 1: Modifying frozen built-in');

  const ctx1 = vm.createContext({
    console: Object.freeze({ log: console.log }),
    Math: Object.freeze({ ...Math })
  });

  try {
    vm.runInContext(`
      'use strict';
      Math.random = () => 0.5;  // Attempt to override
    `, ctx1);
  } catch (err) {
    console.log('Blocked:', err.message);
  }

  console.log('\nAttempt 2: Prototype pollution');

  const ctx2 = vm.createContext({
    data: Object.freeze({ value: 42 })
  });

  // Even with frozen objects, prototype chain can be accessed
  vm.runInContext(`
    Object.prototype.polluted = 'hacked';
    const test = {};
    console.log('Prototype polluted:', test.polluted);
  `, ctx2);

  // This affects the main context too!
  const testObj = {};
  if (testObj.polluted) {
    console.log('WARNING: Prototype pollution leaked to main context!');
    delete Object.prototype.polluted; // Cleanup
  }

  console.log('\nAttempt 3: Accessing constructor');
  const ctx3 = vm.createContext({
    data: Object.freeze([1, 2, 3])
  });

  vm.runInContext(`
    // Even frozen, can access constructors
    const ArrayConstructor = data.constructor;
    const newArray = new ArrayConstructor(10, 20, 30);
    console.log('Created new array:', JSON.stringify(newArray));
  `, ctx3);

  console.log('\nKey insight: Freezing alone is NOT sufficient for security!');
}

demoSecurity();
console.log();

// ============================================================================
// 7. Performance Considerations
// ============================================================================

console.log('=== 7. Performance Considerations ===\n');

/**
 * Benchmark freezing overhead
 */
function benchmarkFreezing() {
  const { performance } = require('perf_hooks');

  const largeData = {
    level1: {
      level2: {
        level3: {
          array: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: i * 2 }))
        }
      }
    }
  };

  // Test 1: Without freezing
  const start1 = performance.now();
  const ctx1 = vm.createContext({ data: largeData });
  vm.runInContext('data.level1.level2.level3.array[0].value', ctx1);
  const time1 = performance.now() - start1;

  // Test 2: With shallow freeze
  const start2 = performance.now();
  const ctx2 = vm.createContext({ data: largeData });
  Object.freeze(ctx2.data);
  vm.runInContext('data.level1.level2.level3.array[0].value', ctx2);
  const time2 = performance.now() - start2;

  // Test 3: With deep freeze
  const start3 = performance.now();
  const ctx3 = vm.createContext({ data: JSON.parse(JSON.stringify(largeData)) });
  deepFreeze(ctx3.data);
  vm.runInContext('data.level1.level2.level3.array[0].value', ctx3);
  const time3 = performance.now() - start3;

  console.log('Performance comparison:');
  console.log(`  No freeze:      ${time1.toFixed(2)}ms`);
  console.log(`  Shallow freeze: ${time2.toFixed(2)}ms`);
  console.log(`  Deep freeze:    ${time3.toFixed(2)}ms`);
  console.log();

  console.log('Memory implications:');
  console.log('  - Frozen objects have slightly higher memory overhead');
  console.log('  - Deep freezing large structures can be expensive');
  console.log('  - Consider lazy freezing for large datasets');
}

benchmarkFreezing();
console.log();

// ============================================================================
// 8. Best Practices
// ============================================================================

console.log('=== 8. Best Practices ===\n');

/**
 * Recommended patterns for context freezing
 */
class SecureContextBuilder {
  constructor() {
    this.builtin = this.createFrozenBuiltins();
  }

  createFrozenBuiltins() {
    return {
      Math: Object.freeze({
        abs: Math.abs,
        ceil: Math.ceil,
        floor: Math.floor,
        max: Math.max,
        min: Math.min,
        round: Math.round,
        sqrt: Math.sqrt,
        pow: Math.pow
      }),
      JSON: Object.freeze({
        parse: JSON.parse,
        stringify: JSON.stringify
      }),
      Array: Object.freeze({
        isArray: Array.isArray
      }),
      Object: Object.freeze({
        keys: Object.keys,
        values: Object.values,
        entries: Object.entries
      }),
      console: Object.freeze({
        log: console.log
      })
    };
  }

  build(data, options = {}) {
    const { deepFreeze: shouldDeepFreeze = false } = options;

    // Clone data to prevent external modification
    const clonedData = JSON.parse(JSON.stringify(data));

    // Optionally deep freeze
    if (shouldDeepFreeze) {
      deepFreeze(clonedData);
    }

    // Create context with frozen built-ins
    const context = vm.createContext({
      ...clonedData,
      ...this.builtin
    });

    return context;
  }

  execute(code, data, options = {}) {
    const context = this.build(data, options);

    return vm.runInContext(code, context, {
      timeout: options.timeout || 1000,
      displayErrors: true
    });
  }
}

// Demo secure builder
const builder = new SecureContextBuilder();

console.log('Example 1: Safe calculation');
const calc = builder.execute(`
  Math.sqrt(numbers.reduce((sum, n) => sum + Math.pow(n, 2), 0))
`, {
  numbers: [3, 4]
}, { deepFreeze: true });
console.log('Result:', calc);

console.log('\nExample 2: Data processing');
const processed = builder.execute(`
  items
    .filter(item => item.price > 10)
    .map(item => ({
      name: item.name,
      total: item.price * item.quantity
    }))
`, {
  items: [
    { name: 'A', price: 5, quantity: 2 },
    { name: 'B', price: 15, quantity: 3 },
    { name: 'C', price: 25, quantity: 1 }
  ]
}, { deepFreeze: true });
console.log('Result:', JSON.stringify(processed, null, 2));
console.log();

// ============================================================================
// Key Takeaways
// ============================================================================

console.log('=== Key Takeaways ===\n');
console.log('1. Object.freeze() prevents modification but is shallow');
console.log('2. Deep freeze requires recursive freezing of nested objects');
console.log('3. Object.seal() prevents adding/removing props but allows modification');
console.log('4. Freezing alone does NOT provide complete security');
console.log('5. Prototype chain remains accessible even with frozen objects');
console.log('6. Deep freezing has performance cost - use selectively');
console.log('7. Always combine freezing with other security measures');
console.log('8. Freeze built-in objects to prevent tampering');
console.log();

console.log('Run this example with: node 07-context-freezing.js');
