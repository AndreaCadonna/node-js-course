/**
 * Example 1: VM Escape Prevention
 *
 * This example demonstrates comprehensive techniques for preventing
 * VM escape attacks, including:
 * - Prototype pollution prevention
 * - Constructor access blocking
 * - Function constructor protection
 * - Proto chain manipulation defense
 * - Dangerous property access prevention
 */

const vm = require('vm');
const util = require('util');

console.log('=== VM Escape Prevention Techniques ===\n');

// ============================================================================
// Part 1: Understanding VM Escape Vectors
// ============================================================================

console.log('Part 1: Common VM Escape Vectors\n');

// Escape Vector 1: Constructor access
console.log('1. Constructor Access Escape:');
const unsafeContext1 = vm.createContext({ data: {} });

try {
  const result = vm.runInContext(
    'this.constructor.constructor("return process")()',
    unsafeContext1
  );
  console.log('   ❌ ESCAPED! Got process:', typeof result);
} catch (err) {
  console.log('   ✓ Blocked:', err.message);
}

// Escape Vector 2: Prototype pollution
console.log('\n2. Prototype Pollution Escape:');
const unsafeContext2 = vm.createContext({ obj: {} });

try {
  vm.runInContext('obj.__proto__.polluted = true', unsafeContext2);
  console.log('   ❌ ESCAPED! Prototype polluted:', {}.polluted === true);
} catch (err) {
  console.log('   ✓ Blocked:', err.message);
}

// Escape Vector 3: Function constructor
console.log('\n3. Function Constructor Escape:');
const unsafeContext3 = vm.createContext({ fn: function() {} });

try {
  const result = vm.runInContext(
    'fn.constructor("return process")()',
    unsafeContext3
  );
  console.log('   ❌ ESCAPED! Got process:', typeof result);
} catch (err) {
  console.log('   ✓ Blocked:', err.message);
}

// ============================================================================
// Part 2: Creating Hardened Context
// ============================================================================

console.log('\n\nPart 2: Creating Hardened Context\n');

/**
 * Creates a hardened context with multiple layers of protection
 */
function createHardenedContext(sandbox = {}) {
  // Layer 1: Start with null prototype (no inheritance)
  const base = Object.create(null);

  // Layer 2: Whitelist safe built-in objects (create clean copies)
  const safeGlobals = {
    // Math object (no dangerous methods)
    Math: Object.create(null,
      Object.getOwnPropertyDescriptors(Math)
    ),

    // JSON object
    JSON: Object.create(null,
      Object.getOwnPropertyDescriptors(JSON)
    ),

    // Safe console (limited methods)
    console: {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console)
    },

    // Safe built-in constructors (without prototype access)
    Array: Object.create(null),
    Object: Object.create(null),
    String: Object.create(null),
    Number: Object.create(null),
    Boolean: Object.create(null)
  };

  // Copy safe globals to base
  Object.assign(base, safeGlobals);

  // Layer 3: Add user sandbox data through defensive copy
  for (const key in sandbox) {
    if (sandbox.hasOwnProperty(key)) {
      // Deep clone to prevent reference sharing
      base[key] = JSON.parse(JSON.stringify(sandbox[key]));
    }
  }

  // Layer 4: Create VM context
  const context = vm.createContext(base);

  // Layer 5: Freeze critical objects
  Object.freeze(base.Math);
  Object.freeze(base.JSON);
  Object.freeze(base.console);

  return context;
}

// Test hardened context
console.log('Testing Hardened Context:');
const hardened = createHardenedContext({ x: 42, y: 100 });

const escapeAttempts = [
  {
    name: 'Constructor access',
    code: 'this.constructor.constructor("return process")()'
  },
  {
    name: 'Proto pollution',
    code: 'Object.prototype.polluted = true; polluted'
  },
  {
    name: 'Function constructor',
    code: '(function(){}).constructor("return process")()'
  },
  {
    name: '__proto__ access',
    code: 'x.__proto__.evil = true; evil'
  }
];

escapeAttempts.forEach(({ name, code }) => {
  try {
    const result = vm.runInContext(code, hardened, { timeout: 100 });
    console.log(`   ❌ ${name}: FAILED (got ${typeof result})`);
  } catch (err) {
    console.log(`   ✓ ${name}: Blocked`);
  }
});

// ============================================================================
// Part 3: Proxy-Based Protection
// ============================================================================

console.log('\n\nPart 3: Proxy-Based Protection\n');

/**
 * Creates a context protected by proxy interceptors
 */
function createProxyProtectedContext(sandbox = {}) {
  const base = Object.create(null);

  // Whitelist of allowed properties
  const allowedProps = new Set([
    'Math', 'JSON', 'console', 'Array', 'Object',
    'String', 'Number', 'Boolean', 'Date'
  ]);

  // Blacklist of dangerous properties
  const blockedProps = new Set([
    'constructor', '__proto__', 'prototype',
    'eval', 'Function', 'process', 'require',
    'global', 'globalThis', 'module', 'exports'
  ]);

  const handler = {
    get(target, prop, receiver) {
      // Block dangerous properties
      if (blockedProps.has(prop)) {
        throw new Error(`Access to '${String(prop)}' is not allowed`);
      }

      // Check for symbol or private access
      if (typeof prop === 'symbol') {
        throw new Error('Symbol properties are not allowed');
      }

      const value = Reflect.get(target, prop, receiver);

      // Log access for monitoring
      if (process.env.DEBUG) {
        console.log(`[Proxy] Get: ${String(prop)}`);
      }

      return value;
    },

    set(target, prop, value, receiver) {
      // Block dangerous properties
      if (blockedProps.has(prop)) {
        throw new Error(`Setting '${String(prop)}' is not allowed`);
      }

      // Validate property names
      if (typeof prop === 'symbol' || String(prop).startsWith('_')) {
        throw new Error('Cannot set private or symbol properties');
      }

      // Log mutations
      if (process.env.DEBUG) {
        console.log(`[Proxy] Set: ${String(prop)} = ${value}`);
      }

      return Reflect.set(target, prop, value, receiver);
    },

    has(target, prop) {
      // Hide dangerous properties
      if (blockedProps.has(prop)) {
        return false;
      }
      return Reflect.has(target, prop);
    },

    deleteProperty(target, prop) {
      // Prevent deletion of protected properties
      if (allowedProps.has(prop)) {
        throw new Error(`Cannot delete protected property '${String(prop)}'`);
      }
      return Reflect.deleteProperty(target, prop);
    },

    getOwnPropertyDescriptor(target, prop) {
      // Block descriptor access for dangerous props
      if (blockedProps.has(prop)) {
        return undefined;
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },

    ownKeys(target) {
      // Filter out dangerous keys
      return Reflect.ownKeys(target).filter(key =>
        !blockedProps.has(key)
      );
    }
  };

  // Add safe globals
  base.Math = Math;
  base.JSON = JSON;
  base.console = console;

  // Add sandbox data
  Object.assign(base, sandbox);

  // Wrap in proxy
  const protected = new Proxy(base, handler);

  return vm.createContext(protected);
}

// Test proxy-protected context
console.log('Testing Proxy-Protected Context:');
const proxyProtected = createProxyProtectedContext({ data: { value: 42 } });

const proxyTests = [
  {
    name: 'Normal access',
    code: 'data.value * 2',
    shouldPass: true
  },
  {
    name: 'Constructor access',
    code: 'constructor',
    shouldPass: false
  },
  {
    name: 'Proto access',
    code: '__proto__',
    shouldPass: false
  },
  {
    name: 'Eval access',
    code: 'eval',
    shouldPass: false
  }
];

proxyTests.forEach(({ name, code, shouldPass }) => {
  try {
    const result = vm.runInContext(code, proxyProtected, { timeout: 100 });
    if (shouldPass) {
      console.log(`   ✓ ${name}: Success (${result})`);
    } else {
      console.log(`   ❌ ${name}: Should have been blocked`);
    }
  } catch (err) {
    if (!shouldPass) {
      console.log(`   ✓ ${name}: Blocked correctly`);
    } else {
      console.log(`   ❌ ${name}: Should have passed`);
    }
  }
});

// ============================================================================
// Part 4: Production-Ready Hardened Sandbox
// ============================================================================

console.log('\n\nPart 4: Production-Ready Hardened Sandbox\n');

/**
 * Production-grade hardened sandbox with all protections
 */
class HardenedSandbox {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 5000,
      allowedGlobals: options.allowedGlobals || ['Math', 'JSON', 'Date'],
      logAccess: options.logAccess || false,
      ...options
    };

    this.accessLog = [];
  }

  /**
   * Create a fully hardened context
   */
  createContext(sandbox = {}) {
    // Start with null prototype
    const base = Object.create(null);

    // Add only explicitly allowed globals
    this.options.allowedGlobals.forEach(name => {
      if (global[name]) {
        // Create clean copy without prototype
        base[name] = Object.create(null,
          Object.getOwnPropertyDescriptors(global[name])
        );
        Object.freeze(base[name]);
      }
    });

    // Add safe console
    base.console = {
      log: (...args) => console.log('[Sandbox]', ...args),
      error: (...args) => console.error('[Sandbox]', ...args),
      warn: (...args) => console.warn('[Sandbox]', ...args)
    };

    // Defensive copy of sandbox data
    const safeSandbox = this.deepClone(sandbox);
    Object.assign(base, safeSandbox);

    // Wrap in protective proxy
    const handler = this.createProxyHandler();
    const protected = new Proxy(base, handler);

    // Create and return context
    return vm.createContext(protected);
  }

  /**
   * Create comprehensive proxy handler
   */
  createProxyHandler() {
    const blocklist = new Set([
      'constructor', '__proto__', 'prototype',
      'eval', 'Function', 'process', 'require',
      'global', 'globalThis', 'module', 'exports',
      'import', 'Buffer'
    ]);

    return {
      get: (target, prop, receiver) => {
        if (blocklist.has(prop)) {
          this.logAttempt('get', prop, 'BLOCKED');
          throw new Error(`Access denied: ${String(prop)}`);
        }

        this.logAttempt('get', prop, 'ALLOWED');
        return Reflect.get(target, prop, receiver);
      },

      set: (target, prop, value, receiver) => {
        if (blocklist.has(prop)) {
          this.logAttempt('set', prop, 'BLOCKED');
          throw new Error(`Mutation denied: ${String(prop)}`);
        }

        // Prevent prototype pollution
        if (prop === '__proto__' || prop === 'constructor') {
          this.logAttempt('set', prop, 'BLOCKED');
          throw new Error('Prototype pollution attempt blocked');
        }

        this.logAttempt('set', prop, 'ALLOWED');
        return Reflect.set(target, prop, value, receiver);
      },

      has: (target, prop) => {
        if (blocklist.has(prop)) {
          return false;
        }
        return Reflect.has(target, prop);
      },

      deleteProperty: (target, prop) => {
        if (this.options.allowedGlobals.includes(prop)) {
          throw new Error(`Cannot delete protected property: ${String(prop)}`);
        }
        return Reflect.deleteProperty(target, prop);
      }
    };
  }

  /**
   * Log access attempts
   */
  logAttempt(operation, property, result) {
    if (this.options.logAccess) {
      const entry = {
        timestamp: new Date().toISOString(),
        operation,
        property: String(property),
        result
      };
      this.accessLog.push(entry);
    }
  }

  /**
   * Deep clone object safely
   */
  deepClone(obj) {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (err) {
      // Fallback to shallow clone if JSON fails
      return { ...obj };
    }
  }

  /**
   * Execute code in hardened context
   */
  execute(code, sandbox = {}) {
    const context = this.createContext(sandbox);

    try {
      const result = vm.runInContext(code, context, {
        timeout: this.options.timeout,
        displayErrors: true
      });

      return {
        success: true,
        result,
        logs: this.accessLog
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        logs: this.accessLog
      };
    } finally {
      this.accessLog = [];
    }
  }

  /**
   * Get access statistics
   */
  getStats() {
    const stats = {
      total: this.accessLog.length,
      allowed: this.accessLog.filter(l => l.result === 'ALLOWED').length,
      blocked: this.accessLog.filter(l => l.result === 'BLOCKED').length
    };
    return stats;
  }
}

// Test production sandbox
console.log('Testing Production Hardened Sandbox:\n');

const sandbox = new HardenedSandbox({
  timeout: 1000,
  allowedGlobals: ['Math', 'JSON'],
  logAccess: true
});

const tests = [
  {
    name: 'Safe calculation',
    code: 'Math.sqrt(16) + Math.pow(2, 3)',
    expectSuccess: true
  },
  {
    name: 'JSON operations',
    code: 'JSON.stringify({ a: 1, b: 2 })',
    expectSuccess: true
  },
  {
    name: 'Constructor escape',
    code: 'this.constructor.constructor("return process")()',
    expectSuccess: false
  },
  {
    name: 'Prototype pollution',
    code: 'Object.prototype.polluted = true',
    expectSuccess: false
  },
  {
    name: 'Process access',
    code: 'process.exit()',
    expectSuccess: false
  }
];

tests.forEach(({ name, code, expectSuccess }) => {
  const result = sandbox.execute(code);
  const status = result.success === expectSuccess ? '✓' : '❌';
  console.log(`${status} ${name}:`);
  if (result.success) {
    console.log(`   Result: ${result.result}`);
  } else {
    console.log(`   Error: ${result.error}`);
  }
  if (result.logs.length > 0) {
    console.log(`   Access logs: ${result.logs.length} operations`);
  }
  console.log();
});

// ============================================================================
// Part 5: Summary and Best Practices
// ============================================================================

console.log('\n=== Summary: VM Escape Prevention ===\n');

console.log('Key Defense Layers:');
console.log('1. Null prototype (Object.create(null))');
console.log('2. Whitelist only safe globals');
console.log('3. Create clean copies without prototypes');
console.log('4. Proxy-based access control');
console.log('5. Property blocklist enforcement');
console.log('6. Access logging and monitoring');
console.log('7. Timeout enforcement');
console.log('8. Deep cloning of user data');

console.log('\nCommon Escape Vectors Blocked:');
console.log('✓ Constructor access');
console.log('✓ Prototype pollution');
console.log('✓ Function constructor');
console.log('✓ __proto__ manipulation');
console.log('✓ eval and Function access');
console.log('✓ Process/require access');

console.log('\nBest Practices:');
console.log('• Use multiple layers of defense');
console.log('• Default deny (whitelist approach)');
console.log('• Log all access attempts');
console.log('• Regular security audits');
console.log('• Keep dependencies updated');
console.log('• Test against known exploits');
console.log('• Monitor production usage');
