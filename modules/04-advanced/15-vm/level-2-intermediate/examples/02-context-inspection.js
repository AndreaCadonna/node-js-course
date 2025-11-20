/**
 * Example 2: Inspecting and Manipulating VM Contexts
 *
 * This example demonstrates how to programmatically inspect and manipulate
 * VM contexts, including reading properties, dynamic modification, cloning,
 * and working with property descriptors.
 *
 * Topics covered:
 * - Reading context properties
 * - Dynamic property modification
 * - Context cloning strategies
 * - Property descriptor manipulation
 * - Context serialization
 */

const vm = require('vm');
const util = require('util');

// ============================================================================
// 1. Basic Context Inspection
// ============================================================================

console.log('=== 1. Basic Context Inspection ===\n');

/**
 * Inspect all properties in a context
 */
function inspectContext(context) {
  const properties = Object.keys(context);
  const inspection = {};

  for (const prop of properties) {
    inspection[prop] = {
      type: typeof context[prop],
      value: context[prop],
      constructor: context[prop]?.constructor?.name
    };
  }

  return inspection;
}

// Create a sample context
const sampleContext = vm.createContext({
  name: 'Test Context',
  version: 1.0,
  data: { items: [1, 2, 3] },
  calculate: function(x) { return x * 2; }
});

console.log('Sample context inspection:');
console.log(util.inspect(inspectContext(sampleContext), { depth: 3, colors: true }));
console.log();

// ============================================================================
// 2. Deep Context Inspection
// ============================================================================

console.log('=== 2. Deep Context Inspection ===\n');

/**
 * Deep inspection including property descriptors
 */
function deepInspectContext(context) {
  const result = {
    properties: {},
    prototypes: [],
    symbols: []
  };

  // Inspect own properties
  for (const prop of Object.getOwnPropertyNames(context)) {
    const descriptor = Object.getOwnPropertyDescriptor(context, prop);
    result.properties[prop] = {
      value: context[prop],
      type: typeof context[prop],
      writable: descriptor.writable,
      enumerable: descriptor.enumerable,
      configurable: descriptor.configurable
    };
  }

  // Inspect symbols
  const symbols = Object.getOwnPropertySymbols(context);
  for (const sym of symbols) {
    result.symbols.push({
      description: sym.description,
      value: context[sym]
    });
  }

  // Inspect prototype chain
  let proto = Object.getPrototypeOf(context);
  while (proto && proto !== Object.prototype) {
    result.prototypes.push(Object.getOwnPropertyNames(proto));
    proto = Object.getPrototypeOf(proto);
  }

  return result;
}

const deepContext = vm.createContext({
  readOnly: 42,
  mutable: 'changeable'
});

// Make readOnly actually read-only
Object.defineProperty(deepContext, 'readOnly', {
  writable: false,
  configurable: false
});

console.log('Deep context inspection:');
console.log(util.inspect(deepInspectContext(deepContext), { depth: 4, colors: true }));
console.log();

// ============================================================================
// 3. Dynamic Context Modification
// ============================================================================

console.log('=== 3. Dynamic Context Modification ===\n');

/**
 * Context modifier that can add/update/remove properties
 */
class ContextModifier {
  constructor(context) {
    this.context = context;
    this.changes = [];
  }

  /**
   * Add or update a property
   */
  set(key, value, options = {}) {
    const {
      writable = true,
      enumerable = true,
      configurable = true
    } = options;

    const hadProperty = key in this.context;

    Object.defineProperty(this.context, key, {
      value,
      writable,
      enumerable,
      configurable
    });

    this.changes.push({
      type: hadProperty ? 'update' : 'add',
      key,
      value,
      timestamp: Date.now()
    });

    return this;
  }

  /**
   * Remove a property
   */
  remove(key) {
    if (key in this.context) {
      const descriptor = Object.getOwnPropertyDescriptor(this.context, key);

      if (!descriptor.configurable) {
        throw new Error(`Property ${key} is not configurable`);
      }

      delete this.context[key];

      this.changes.push({
        type: 'remove',
        key,
        timestamp: Date.now()
      });
    }

    return this;
  }

  /**
   * Freeze a property
   */
  freeze(key) {
    if (key in this.context) {
      Object.defineProperty(this.context, key, {
        writable: false,
        configurable: false
      });

      this.changes.push({
        type: 'freeze',
        key,
        timestamp: Date.now()
      });
    }

    return this;
  }

  /**
   * Get change history
   */
  getHistory() {
    return this.changes;
  }

  /**
   * Rollback last N changes
   */
  rollback(count = 1) {
    // Note: This is simplified - real implementation would need to store old values
    console.log(`Would rollback ${count} changes`);
    return this;
  }
}

// Demo context modification
const modContext = vm.createContext({ x: 10 });
const modifier = new ContextModifier(modContext);

console.log('Initial context:', modContext);

modifier
  .set('y', 20)
  .set('z', 30, { writable: false })
  .set('calculate', (a, b) => a + b);

console.log('After modifications:', modContext);

// Try to modify frozen property
try {
  vm.runInContext('z = 999', modContext);
  console.log('z after attempt to modify:', modContext.z);
} catch (err) {
  console.log('Error:', err.message);
}

console.log('Modification history:', modifier.getHistory());
console.log();

// ============================================================================
// 4. Context Cloning
// ============================================================================

console.log('=== 4. Context Cloning ===\n');

/**
 * Clone a context (shallow copy)
 */
function cloneContextShallow(source) {
  const clone = {};

  for (const key of Object.getOwnPropertyNames(source)) {
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    Object.defineProperty(clone, key, descriptor);
  }

  return vm.createContext(clone);
}

/**
 * Clone a context (deep copy)
 */
function cloneContextDeep(source) {
  const clone = {};

  for (const key of Object.getOwnPropertyNames(source)) {
    const value = source[key];
    let clonedValue;

    // Handle different types
    if (value === null || value === undefined) {
      clonedValue = value;
    } else if (typeof value === 'function') {
      // Functions can't be truly cloned, so we reference them
      clonedValue = value;
    } else if (typeof value === 'object') {
      // Deep clone objects and arrays
      try {
        clonedValue = JSON.parse(JSON.stringify(value));
      } catch {
        // If JSON serialization fails, use shallow copy
        clonedValue = { ...value };
      }
    } else {
      clonedValue = value;
    }

    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    Object.defineProperty(clone, key, {
      ...descriptor,
      value: clonedValue
    });
  }

  return vm.createContext(clone);
}

// Demo context cloning
const original = vm.createContext({
  counter: 0,
  data: { items: [1, 2, 3] },
  increment: function() { this.counter++; }
});

console.log('Original context:', original);

// Shallow clone
const shallowClone = cloneContextShallow(original);
console.log('Shallow clone:', shallowClone);

// Modify original - shallow clone shares object references
original.data.items.push(4);
console.log('After modifying original.data.items:');
console.log('  Original:', original.data.items);
console.log('  Shallow clone:', shallowClone.data.items); // Also changed!

// Deep clone
const deepClone = cloneContextDeep(original);
original.data.items.push(5);
console.log('After modifying original.data.items again:');
console.log('  Original:', original.data.items);
console.log('  Deep clone:', deepClone.data.items); // Not changed
console.log();

// ============================================================================
// 5. Context Serialization
// ============================================================================

console.log('=== 5. Context Serialization ===\n');

/**
 * Serialize context to JSON
 */
function serializeContext(context, options = {}) {
  const { includeFunctions = false } = options;
  const result = {};

  for (const key of Object.getOwnPropertyNames(context)) {
    const value = context[key];
    const type = typeof value;

    if (type === 'function' && !includeFunctions) {
      continue;
    }

    if (type === 'function') {
      result[key] = {
        __type: 'function',
        __source: value.toString()
      };
    } else if (value && type === 'object') {
      try {
        result[key] = JSON.parse(JSON.stringify(value));
      } catch {
        result[key] = { __type: 'non-serializable' };
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Deserialize JSON to context
 */
function deserializeContext(serialized) {
  const context = {};

  for (const [key, value] of Object.entries(serialized)) {
    if (value && value.__type === 'function') {
      // Reconstruct function (dangerous - only for trusted data!)
      try {
        context[key] = eval(`(${value.__source})`);
      } catch {
        context[key] = null;
      }
    } else if (value && value.__type === 'non-serializable') {
      context[key] = null;
    } else {
      context[key] = value;
    }
  }

  return vm.createContext(context);
}

// Demo serialization
const serContext = vm.createContext({
  name: 'Serializable Context',
  count: 42,
  data: { x: 10, y: 20 },
  add: function(a, b) { return a + b; }
});

console.log('Original context:', serContext);

const serialized = serializeContext(serContext, { includeFunctions: true });
console.log('\nSerialized:', JSON.stringify(serialized, null, 2));

const deserialized = deserializeContext(serialized);
console.log('\nDeserialized context:', deserialized);

// Test function execution
if (deserialized.add) {
  console.log('Function test: add(5, 3) =', deserialized.add(5, 3));
}
console.log();

// ============================================================================
// 6. Context Diff
// ============================================================================

console.log('=== 6. Context Diff ===\n');

/**
 * Compare two contexts and show differences
 */
function diffContexts(ctx1, ctx2) {
  const diff = {
    added: [],
    removed: [],
    modified: [],
    unchanged: []
  };

  const keys1 = new Set(Object.keys(ctx1));
  const keys2 = new Set(Object.keys(ctx2));

  // Find added and modified
  for (const key of keys2) {
    if (!keys1.has(key)) {
      diff.added.push({ key, value: ctx2[key] });
    } else if (ctx1[key] !== ctx2[key]) {
      diff.modified.push({
        key,
        oldValue: ctx1[key],
        newValue: ctx2[key]
      });
    } else {
      diff.unchanged.push(key);
    }
  }

  // Find removed
  for (const key of keys1) {
    if (!keys2.has(key)) {
      diff.removed.push({ key, value: ctx1[key] });
    }
  }

  return diff;
}

// Demo context diff
const ctx1 = vm.createContext({
  x: 10,
  y: 20,
  name: 'Context 1'
});

const ctx2 = vm.createContext({
  x: 10,       // unchanged
  y: 25,       // modified
  name: 'Context 2',  // modified
  z: 30        // added
  // x removed
});

const diff = diffContexts(ctx1, ctx2);
console.log('Context diff:');
console.log(util.inspect(diff, { depth: 3, colors: true }));
console.log();

// ============================================================================
// 7. Practical Context Inspector
// ============================================================================

console.log('=== 7. Practical Context Inspector ===\n');

/**
 * Complete context inspector with multiple features
 */
class ContextInspector {
  constructor(context) {
    this.context = context;
  }

  /**
   * Get summary of context
   */
  summary() {
    const keys = Object.keys(this.context);
    const types = {};

    for (const key of keys) {
      const type = typeof this.context[key];
      types[type] = (types[type] || 0) + 1;
    }

    return {
      propertyCount: keys.length,
      types,
      keys
    };
  }

  /**
   * Find properties by type
   */
  findByType(type) {
    const results = [];

    for (const key of Object.keys(this.context)) {
      if (typeof this.context[key] === type) {
        results.push({ key, value: this.context[key] });
      }
    }

    return results;
  }

  /**
   * Find writable properties
   */
  findWritable() {
    const results = [];

    for (const key of Object.keys(this.context)) {
      const descriptor = Object.getOwnPropertyDescriptor(this.context, key);
      if (descriptor.writable) {
        results.push(key);
      }
    }

    return results;
  }

  /**
   * Export as plain object
   */
  export() {
    return { ...this.context };
  }
}

// Demo inspector
const inspectCtx = vm.createContext({
  config: { port: 3000 },
  version: '1.0.0',
  enabled: true,
  handler: () => {},
  data: [1, 2, 3]
});

const inspector = new ContextInspector(inspectCtx);

console.log('Context summary:', inspector.summary());
console.log('Functions:', inspector.findByType('function'));
console.log('Writable properties:', inspector.findWritable());
console.log();

// ============================================================================
// Key Takeaways
// ============================================================================

console.log('=== Key Takeaways ===\n');
console.log('1. Use Object.getOwnPropertyDescriptor() to inspect properties');
console.log('2. Property descriptors control writability, enumerability, configurability');
console.log('3. Shallow cloning shares object references');
console.log('4. Deep cloning requires careful handling of different types');
console.log('5. Context serialization enables persistence and transfer');
console.log('6. Context diffing helps track changes over time');
console.log();

console.log('Run this example with: node 02-context-inspection.js');
