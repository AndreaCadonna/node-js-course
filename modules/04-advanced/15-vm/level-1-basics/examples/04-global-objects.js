/**
 * 04-global-objects.js
 * ====================
 * Understanding how global objects work in different VM contexts
 *
 * Key Concepts:
 * - Global objects in different contexts
 * - Built-in constructors (Object, Array, Function, etc.)
 * - Prototype chains across contexts
 * - Instanceof behavior in different contexts
 *
 * Run: node 04-global-objects.js
 */

const vm = require('vm');

console.log('='.repeat(70));
console.log('GLOBAL OBJECTS IN VM CONTEXTS');
console.log('='.repeat(70));

// =============================================================================
// 1. GLOBAL OBJECT BASICS
// =============================================================================

console.log('\n1. Global Object in Main Context:');
console.log('-'.repeat(70));

console.log('In Node.js, the global object is called "global"');
console.log('typeof global:', typeof global);
console.log('global.setTimeout:', typeof global.setTimeout);
console.log('global.console:', typeof global.console);
console.log('global.process:', typeof global.process);

// =============================================================================
// 2. GLOBAL OBJECT IN NEW CONTEXT
// =============================================================================

console.log('\n2. Global Object in New Context:');
console.log('-'.repeat(70));

const sandbox = {};
vm.createContext(sandbox);

// The sandbox becomes the global object in the new context
vm.runInContext(`
  globalThis.customValue = 42;
`, sandbox);

console.log('sandbox.customValue:', sandbox.customValue);
console.log('✓ Sandbox object IS the global object in the context');

// =============================================================================
// 3. BUILT-IN CONSTRUCTORS
// =============================================================================

console.log('\n3. Built-in Constructors in Different Contexts:');
console.log('-'.repeat(70));

// Each context has its own built-in constructors
const sandbox2 = {};
vm.createContext(sandbox2);

vm.runInContext(`
  myArray = [1, 2, 3];
  myObject = { a: 1, b: 2 };
  myDate = new Date();
`, sandbox2);

console.log('Array in sandbox:', sandbox2.myArray);
console.log('Object in sandbox:', sandbox2.myObject);
console.log('Date in sandbox:', sandbox2.myDate);

// These are created with the sandbox's constructors, not the main context's
console.log('\nmyArray instanceof Array (main):', sandbox2.myArray instanceof Array);
console.log('myObject instanceof Object (main):', sandbox2.myObject instanceof Object);

console.log('⚠️  instanceof compares against main context constructors!');

// =============================================================================
// 4. INSTANCEOF ACROSS CONTEXTS
// =============================================================================

console.log('\n4. Understanding instanceof Across Contexts:');
console.log('-'.repeat(70));

const sandbox3 = {};
vm.createContext(sandbox3);

// Create array in sandbox
vm.runInContext('arr = [1, 2, 3]', sandbox3);

// Get the Array constructor from sandbox context
const SandboxArray = vm.runInContext('Array', sandbox3);

console.log('Main context:');
console.log('  arr instanceof Array:', sandbox3.arr instanceof Array); // false
console.log('  arr instanceof SandboxArray:', sandbox3.arr instanceof SandboxArray); // true

console.log('\nWhy? Each context has its own Array constructor:');
console.log('  Main Array === Sandbox Array:', Array === SandboxArray); // false

console.log('\n✓ Each context has separate constructor functions');

// =============================================================================
// 5. CHECKING TYPES ACROSS CONTEXTS
// =============================================================================

console.log('\n5. Safe Type Checking Across Contexts:');
console.log('-'.repeat(70));

const sandbox4 = {};
vm.createContext(sandbox4);

vm.runInContext(`
  testArray = [1, 2, 3];
  testObject = { a: 1 };
  testString = "hello";
  testNumber = 42;
`, sandbox4);

// Method 1: Array.isArray (works across contexts!)
console.log('Array.isArray(testArray):', Array.isArray(sandbox4.testArray));

// Method 2: Object.prototype.toString (works across contexts!)
function getType(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

console.log('Type of testArray:', getType(sandbox4.testArray));
console.log('Type of testObject:', getType(sandbox4.testObject));
console.log('Type of testString:', getType(sandbox4.testString));
console.log('Type of testNumber:', getType(sandbox4.testNumber));

console.log('\n✓ Use Array.isArray() and Object.prototype.toString for safe type checking');

// =============================================================================
// 6. PROVIDING CONSTRUCTORS TO SANDBOX
// =============================================================================

console.log('\n6. Providing Constructors to Sandbox:');
console.log('-'.repeat(70));

// Sandbox without built-ins
const minimalSandbox = {};
vm.createContext(minimalSandbox);

try {
  vm.runInContext('new Date()', minimalSandbox);
} catch (err) {
  console.log('❌ Error without Date:', err.message);
}

// Sandbox with built-ins
const fullSandbox = {
  Date: Date,
  Math: Math,
  JSON: JSON,
  Array: Array,
  Object: Object,
  console: console,
};
vm.createContext(fullSandbox);

vm.runInContext(`
  const now = new Date();
  const nums = [1, 2, 3, 4, 5];
  const max = Math.max(...nums);
  console.log('Date:', now.toISOString());
  console.log('Max number:', max);
`, fullSandbox);

console.log('✓ Explicitly provide needed built-ins to sandbox');

// =============================================================================
// 7. PROTOTYPE CHAIN DEMONSTRATION
// =============================================================================

console.log('\n7. Prototype Chains in Different Contexts:');
console.log('-'.repeat(70));

const sandbox5 = {};
vm.createContext(sandbox5);

// Define a class in the sandbox
vm.runInContext(`
  class Person {
    constructor(name) {
      this.name = name;
    }

    greet() {
      return 'Hello, I am ' + this.name;
    }
  }

  const alice = new Person('Alice');
`, sandbox5);

console.log('alice.greet():', sandbox5.alice.greet());
console.log('alice.name:', sandbox5.alice.name);

// The prototype chain exists within the sandbox context
console.log('\nPrototype chain:');
console.log('  alice has greet method:', typeof sandbox5.alice.greet);
console.log('  alice instanceof Person (sandbox):',
  vm.runInContext('alice instanceof Person', sandbox5));

// =============================================================================
// 8. SHARING OBJECTS BETWEEN CONTEXTS
// =============================================================================

console.log('\n8. Sharing Objects Between Contexts:');
console.log('-'.repeat(70));

// Create an object in main context
const sharedData = {
  values: [1, 2, 3],
  config: { debug: true },
};

// Share it with sandbox
const sandbox6 = {
  data: sharedData,
  console: console,
};
vm.createContext(sandbox6);

// Modify in sandbox
vm.runInContext(`
  data.values.push(4);
  data.config.debug = false;
  console.log('Modified in sandbox:', data);
`, sandbox6);

console.log('\nIn main context:');
console.log('sharedData:', sharedData);
console.log('⚠️  Shared objects can be modified from sandbox!');
console.log('⚠️  This is a security concern!');

// =============================================================================
// 9. SAFE DATA PASSING
// =============================================================================

console.log('\n9. Safe Data Passing (Cloning):');
console.log('-'.repeat(70));

const originalData = {
  user: 'Alice',
  role: 'admin',
  permissions: ['read', 'write'],
};

// Clone data before passing to sandbox
const sandbox7 = {
  data: JSON.parse(JSON.stringify(originalData)),
  console: console,
};
vm.createContext(sandbox7);

vm.runInContext(`
  data.role = 'guest';
  data.permissions = [];
  console.log('Modified in sandbox:', data);
`, sandbox7);

console.log('\nOriginal data in main context:');
console.log(originalData);
console.log('✓ Original data unchanged - we passed a clone!');

// =============================================================================
// 10. PRACTICAL EXAMPLE - SAFE ENVIRONMENT BUILDER
// =============================================================================

console.log('\n10. Practical Example - Safe Environment Builder:');
console.log('-'.repeat(70));

class SafeEnvironment {
  constructor(options = {}) {
    this.context = {};

    // Provide safe built-ins
    if (options.allowMath !== false) {
      this.context.Math = Math;
    }

    if (options.allowDate !== false) {
      this.context.Date = Date;
    }

    if (options.allowJSON !== false) {
      this.context.JSON = JSON;
    }

    if (options.allowConsole !== false) {
      this.context.console = console;
    }

    // Add custom utilities
    this.context.utils = {
      type: (obj) => Object.prototype.toString.call(obj).slice(8, -1),
      isArray: Array.isArray,
    };

    vm.createContext(this.context);
  }

  execute(code, data = {}) {
    // Clone data to prevent modifications
    const safeData = JSON.parse(JSON.stringify(data));

    // Make data available in context temporarily
    Object.assign(this.context, safeData);

    try {
      const result = vm.runInContext(code, this.context);

      // Clean up data from context
      Object.keys(safeData).forEach(key => {
        delete this.context[key];
      });

      return { success: true, result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

// Use the safe environment
const env = new SafeEnvironment();

const tests = [
  { code: 'Math.sqrt(16)', data: {} },
  { code: 'x + y', data: { x: 10, y: 20 } },
  { code: 'utils.type([1,2,3])', data: {} },
  { code: 'JSON.stringify({a: 1})', data: {} },
];

tests.forEach(({ code, data }) => {
  const result = env.execute(code, data);
  if (result.success) {
    console.log(`✓ ${code} = ${result.result}`);
  } else {
    console.log(`❌ ${code} - ${result.error}`);
  }
});

// =============================================================================
// SUMMARY
// =============================================================================

console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

console.log(`
Key Takeaways:

1. Global Objects:
   ✓ Each context has its own global object
   ✓ Sandbox object becomes the global in new context
   ✓ globalThis refers to the sandbox in context

2. Built-in Constructors:
   ✓ Each context has separate Array, Object, Date, etc.
   ✓ Created objects use sandbox's constructors
   ✓ instanceof doesn't work across contexts
   ✓ Use Array.isArray() and Object.prototype.toString()

3. Providing Built-ins:
   ✓ Must explicitly provide what you want available
   ✓ Choose carefully for security
   ✓ Common safe: Math, Date, JSON
   ✓ Usually unsafe: require, process, fs

4. Object Sharing:
   ⚠️  Shared objects can be modified from sandbox
   ✓ Clone data before passing to sandbox
   ✓ Use JSON.parse(JSON.stringify()) for simple cloning
   ✓ Consider deep cloning for complex objects

5. Type Checking:
   ❌ Don't: instanceof across contexts
   ✓ Do: Array.isArray()
   ✓ Do: Object.prototype.toString.call()
   ✓ Do: typeof for primitives

6. Best Practices:
   ✓ Provide minimal necessary built-ins
   ✓ Clone data before sharing
   ✓ Use safe type checking methods
   ✓ Document what's available in sandbox
   ✓ Test cross-context behavior
`);

console.log('='.repeat(70));

/**
 * PRACTICE EXERCISES
 * ==================
 *
 * 1. Create a sandbox with only specific built-ins (Math, Date)
 *    and verify other built-ins are not available.
 *
 * 2. Demonstrate the instanceof problem by creating an array in
 *    a sandbox and testing it with main context's instanceof.
 *
 * 3. Build a safe type checker function that works across contexts
 *    for Array, Object, String, Number, and Date.
 *
 * 4. Create a context that shares a read-only view of data
 *    (modifications don't affect original).
 */
