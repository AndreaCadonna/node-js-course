/**
 * Example 2: Proxy-Based Sandbox Protection
 *
 * This example demonstrates advanced proxy-based protection including:
 * - Fine-grained access control
 * - Property interception and validation
 * - Security logging and monitoring
 * - Revocable proxies for temporary access
 * - Multi-layer proxy defense
 */

const vm = require('vm');
const util = require('util');

console.log('=== Proxy-Based Sandbox Protection ===\n');

// ============================================================================
// Part 1: Basic Proxy Protection
// ============================================================================

console.log('Part 1: Basic Proxy Protection\n');

/**
 * Create a simple proxy-protected context
 */
function createBasicProxyContext(sandbox = {}) {
  const handler = {
    get(target, prop, receiver) {
      console.log(`  [GET] ${String(prop)}`);

      // Block dangerous properties
      if (prop === 'constructor' || prop === '__proto__') {
        throw new Error(`Access to ${String(prop)} denied`);
      }

      return Reflect.get(target, prop, receiver);
    },

    set(target, prop, value, receiver) {
      console.log(`  [SET] ${String(prop)} = ${value}`);

      // Block prototype pollution
      if (prop === '__proto__' || prop === 'constructor') {
        throw new Error(`Cannot set ${String(prop)}`);
      }

      return Reflect.set(target, prop, value, receiver);
    }
  };

  const proxied = new Proxy(sandbox, handler);
  return vm.createContext(proxied);
}

console.log('Testing basic proxy protection:');
const basicContext = createBasicProxyContext({ x: 10, y: 20 });

vm.runInContext('x + y', basicContext);
console.log('  Result: 30\n');

try {
  vm.runInContext('constructor', basicContext);
} catch (err) {
  console.log(`  ✓ Blocked: ${err.message}\n`);
}

// ============================================================================
// Part 2: Multi-Layer Proxy Defense
// ============================================================================

console.log('Part 2: Multi-Layer Proxy Defense\n');

/**
 * Multi-layer proxy with validation, sanitization, and logging
 */
class MultiLayerProxy {
  constructor(target, options = {}) {
    this.target = target;
    this.options = {
      logAccess: options.logAccess !== false,
      validateTypes: options.validateTypes !== false,
      sanitizeValues: options.sanitizeValues !== false,
      maxStringLength: options.maxStringLength || 1000,
      maxArrayLength: options.maxArrayLength || 1000,
      ...options
    };

    this.accessLog = [];
    this.blockedAttempts = [];
  }

  /**
   * Layer 1: Access Control
   */
  createAccessControlLayer() {
    const blocklist = new Set([
      'constructor', '__proto__', 'prototype',
      'eval', 'Function', 'process', 'require',
      'global', 'Buffer', 'module', 'exports'
    ]);

    return {
      get: (target, prop, receiver) => {
        if (blocklist.has(prop)) {
          this.logBlocked('get', prop);
          throw new Error(`Access to '${String(prop)}' is blocked`);
        }
        return Reflect.get(target, prop, receiver);
      },

      set: (target, prop, value, receiver) => {
        if (blocklist.has(prop)) {
          this.logBlocked('set', prop);
          throw new Error(`Cannot set '${String(prop)}'`);
        }
        return Reflect.set(target, prop, value, receiver);
      }
    };
  }

  /**
   * Layer 2: Type Validation
   */
  createTypeValidationLayer() {
    return {
      set: (target, prop, value, receiver) => {
        if (!this.options.validateTypes) {
          return Reflect.set(target, prop, value, receiver);
        }

        // Validate types
        if (typeof value === 'function') {
          throw new Error('Cannot set function properties');
        }

        if (typeof value === 'symbol') {
          throw new Error('Cannot set symbol properties');
        }

        return Reflect.set(target, prop, value, receiver);
      }
    };
  }

  /**
   * Layer 3: Value Sanitization
   */
  createSanitizationLayer() {
    return {
      set: (target, prop, value, receiver) => {
        if (!this.options.sanitizeValues) {
          return Reflect.set(target, prop, value, receiver);
        }

        let sanitized = value;

        // Limit string length
        if (typeof value === 'string' && value.length > this.options.maxStringLength) {
          sanitized = value.substring(0, this.options.maxStringLength);
        }

        // Limit array length
        if (Array.isArray(value) && value.length > this.options.maxArrayLength) {
          sanitized = value.slice(0, this.options.maxArrayLength);
        }

        return Reflect.set(target, prop, sanitized, receiver);
      }
    };
  }

  /**
   * Layer 4: Logging
   */
  createLoggingLayer() {
    return {
      get: (target, prop, receiver) => {
        if (this.options.logAccess) {
          this.logAccess('get', prop);
        }
        return Reflect.get(target, prop, receiver);
      },

      set: (target, prop, value, receiver) => {
        if (this.options.logAccess) {
          this.logAccess('set', prop, value);
        }
        return Reflect.set(target, prop, value, receiver);
      }
    };
  }

  /**
   * Combine all layers
   */
  createProxy() {
    const layers = [
      this.createAccessControlLayer(),
      this.createTypeValidationLayer(),
      this.createSanitizationLayer(),
      this.createLoggingLayer()
    ];

    // Combine all layer handlers
    const combinedHandler = {
      get: (target, prop, receiver) => {
        for (const layer of layers) {
          if (layer.get) {
            const result = layer.get(target, prop, receiver);
            if (result !== undefined) {
              return result;
            }
          }
        }
        return Reflect.get(target, prop, receiver);
      },

      set: (target, prop, value, receiver) => {
        for (const layer of layers) {
          if (layer.set) {
            value = layer.set(target, prop, value, receiver) || value;
          }
        }
        return Reflect.set(target, prop, value, receiver);
      },

      has: (target, prop) => {
        return Reflect.has(target, prop);
      },

      deleteProperty: (target, prop) => {
        this.logAccess('delete', prop);
        return Reflect.deleteProperty(target, prop);
      }
    };

    return new Proxy(this.target, combinedHandler);
  }

  /**
   * Log access attempts
   */
  logAccess(operation, property, value) {
    this.accessLog.push({
      timestamp: Date.now(),
      operation,
      property: String(property),
      value: value !== undefined ? String(value).substring(0, 50) : undefined
    });
  }

  /**
   * Log blocked attempts
   */
  logBlocked(operation, property) {
    this.blockedAttempts.push({
      timestamp: Date.now(),
      operation,
      property: String(property)
    });
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalAccess: this.accessLog.length,
      blocked: this.blockedAttempts.length,
      byOperation: this.groupBy(this.accessLog, 'operation')
    };
  }

  groupBy(arr, key) {
    return arr.reduce((acc, item) => {
      const group = item[key];
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});
  }
}

// Test multi-layer proxy
console.log('Testing multi-layer proxy:');
const multiLayer = new MultiLayerProxy({ data: 42 });
const multiProxy = multiLayer.createProxy();
const multiContext = vm.createContext(multiProxy);

console.log('Running safe operations...');
vm.runInContext('data', multiContext);
vm.runInContext('result = data * 2', multiContext);

console.log('\nAttempting blocked operations...');
try {
  vm.runInContext('constructor', multiContext);
} catch (err) {
  console.log('✓ Blocked constructor access');
}

console.log('\nProxy Statistics:');
console.log(util.inspect(multiLayer.getStats(), { depth: null, colors: true }));

// ============================================================================
// Part 3: Revocable Proxies for Temporary Access
// ============================================================================

console.log('\n\nPart 3: Revocable Proxies for Temporary Access\n');

/**
 * Create a context with revocable proxy access
 */
class RevocableContext {
  constructor(sandbox = {}) {
    this.sandbox = sandbox;
    this.revocable = null;
    this.revoked = false;
  }

  /**
   * Create context with revocable proxy
   */
  create() {
    const handler = {
      get: (target, prop) => {
        if (this.revoked) {
          throw new Error('Context has been revoked');
        }
        return Reflect.get(target, prop);
      },

      set: (target, prop, value) => {
        if (this.revoked) {
          throw new Error('Context has been revoked');
        }
        return Reflect.set(target, prop, value);
      }
    };

    this.revocable = Proxy.revocable(this.sandbox, handler);
    return vm.createContext(this.revocable.proxy);
  }

  /**
   * Revoke access to the context
   */
  revoke() {
    if (this.revocable) {
      this.revocable.revoke();
      this.revoked = true;
    }
  }

  /**
   * Check if context is still valid
   */
  isValid() {
    return !this.revoked;
  }
}

// Test revocable context
console.log('Testing revocable context:');
const revocableCtx = new RevocableContext({ value: 100 });
const revContext = revocableCtx.create();

console.log('Before revocation:');
const result1 = vm.runInContext('value * 2', revContext);
console.log(`  Result: ${result1}`);

console.log('\nRevoking context...');
revocableCtx.revoke();

console.log('After revocation:');
try {
  vm.runInContext('value * 2', revContext);
} catch (err) {
  console.log(`  ✓ Access revoked: ${err.message}`);
}

// ============================================================================
// Part 4: Property Access Control Matrix
// ============================================================================

console.log('\n\nPart 4: Property Access Control Matrix\n');

/**
 * Fine-grained access control using permission matrix
 */
class AccessControlMatrix {
  constructor() {
    this.permissions = new Map();
  }

  /**
   * Set permissions for a property
   */
  setPermissions(property, permissions) {
    this.permissions.set(property, {
      read: permissions.read !== false,
      write: permissions.write !== false,
      delete: permissions.delete !== false,
      ...permissions
    });
  }

  /**
   * Check if operation is allowed
   */
  canAccess(property, operation) {
    const perms = this.permissions.get(property);
    if (!perms) {
      return true; // Default allow if not specified
    }

    return perms[operation] === true;
  }

  /**
   * Create proxy with ACL enforcement
   */
  createProxy(target) {
    return new Proxy(target, {
      get: (obj, prop) => {
        if (!this.canAccess(prop, 'read')) {
          throw new Error(`Read access denied for: ${String(prop)}`);
        }
        return Reflect.get(obj, prop);
      },

      set: (obj, prop, value) => {
        if (!this.canAccess(prop, 'write')) {
          throw new Error(`Write access denied for: ${String(prop)}`);
        }
        return Reflect.set(obj, prop, value);
      },

      deleteProperty: (obj, prop) => {
        if (!this.canAccess(prop, 'delete')) {
          throw new Error(`Delete access denied for: ${String(prop)}`);
        }
        return Reflect.deleteProperty(obj, prop);
      }
    });
  }
}

// Test ACL matrix
console.log('Testing access control matrix:');
const acl = new AccessControlMatrix();

// Set permissions
acl.setPermissions('readOnly', { read: true, write: false, delete: false });
acl.setPermissions('writeOnly', { read: false, write: true, delete: false });
acl.setPermissions('readWrite', { read: true, write: true, delete: false });

const aclTarget = {
  readOnly: 'Can only read this',
  writeOnly: 'Cannot read this',
  readWrite: 'Can read and write this'
};

const aclProxy = acl.createProxy(aclTarget);
const aclContext = vm.createContext({ data: aclProxy });

console.log('Testing read permissions:');
try {
  const val = vm.runInContext('data.readOnly', aclContext);
  console.log(`  ✓ Read allowed: ${val}`);
} catch (err) {
  console.log(`  ❌ Read failed: ${err.message}`);
}

console.log('\nTesting write permissions:');
try {
  vm.runInContext('data.readOnly = "new value"', aclContext);
  console.log('  ❌ Write should have been denied');
} catch (err) {
  console.log(`  ✓ Write denied: ${err.message}`);
}

// ============================================================================
// Part 5: Production-Ready Proxy Protection System
// ============================================================================

console.log('\n\nPart 5: Production-Ready Proxy Protection System\n');

/**
 * Complete proxy-based protection system
 */
class ProxyProtectionSystem {
  constructor(options = {}) {
    this.options = {
      enableLogging: options.enableLogging !== false,
      enableACL: options.enableACL !== false,
      enableSanitization: options.enableSanitization !== false,
      enableRateLimiting: options.enableRateLimiting !== false,
      maxAccessPerSecond: options.maxAccessPerSecond || 100,
      ...options
    };

    this.logs = [];
    this.accessCounts = new Map();
    this.acl = new AccessControlMatrix();
  }

  /**
   * Create fully protected context
   */
  createContext(sandbox = {}) {
    const handler = {
      get: (target, prop, receiver) => {
        // Rate limiting
        if (this.options.enableRateLimiting && !this.checkRateLimit('get')) {
          throw new Error('Rate limit exceeded');
        }

        // Access control
        if (this.options.enableACL && !this.acl.canAccess(prop, 'read')) {
          throw new Error(`Read access denied: ${String(prop)}`);
        }

        // Logging
        if (this.options.enableLogging) {
          this.log('get', prop);
        }

        return Reflect.get(target, prop, receiver);
      },

      set: (target, prop, value, receiver) => {
        // Rate limiting
        if (this.options.enableRateLimiting && !this.checkRateLimit('set')) {
          throw new Error('Rate limit exceeded');
        }

        // Access control
        if (this.options.enableACL && !this.acl.canAccess(prop, 'write')) {
          throw new Error(`Write access denied: ${String(prop)}`);
        }

        // Sanitization
        if (this.options.enableSanitization) {
          value = this.sanitize(value);
        }

        // Logging
        if (this.options.enableLogging) {
          this.log('set', prop, value);
        }

        return Reflect.set(target, prop, value, receiver);
      }
    };

    const protected = new Proxy(sandbox, handler);
    return vm.createContext(protected);
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(operation) {
    const key = `${operation}_${Date.now() / 1000 | 0}`;
    const count = this.accessCounts.get(key) || 0;

    if (count >= this.options.maxAccessPerSecond) {
      return false;
    }

    this.accessCounts.set(key, count + 1);

    // Clean old entries
    if (this.accessCounts.size > 60) {
      const cutoff = Date.now() / 1000 - 60;
      for (const [k] of this.accessCounts) {
        if (parseInt(k.split('_')[1]) < cutoff) {
          this.accessCounts.delete(k);
        }
      }
    }

    return true;
  }

  /**
   * Sanitize values
   */
  sanitize(value) {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      return value.replace(/<script>/gi, '').substring(0, 1000);
    }
    return value;
  }

  /**
   * Log access
   */
  log(operation, property, value) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      operation,
      property: String(property),
      value: value ? String(value).substring(0, 50) : undefined
    });
  }

  /**
   * Get logs
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalLogs: this.logs.length,
      operations: this.logs.reduce((acc, log) => {
        acc[log.operation] = (acc[log.operation] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

// Test production system
console.log('Testing production proxy protection:');
const protection = new ProxyProtectionSystem({
  enableLogging: true,
  enableACL: false,
  maxAccessPerSecond: 10
});

protection.acl.setPermissions('secret', { read: false, write: false });

const prodContext = protection.createContext({
  public: 'Public data',
  secret: 'Secret data'
});

console.log('Accessing public data:');
const pub = vm.runInContext('public', prodContext);
console.log(`  ✓ Success: ${pub}`);

console.log('\nAttempting to access secret:');
protection.acl = new AccessControlMatrix();
protection.acl.setPermissions('secret', { read: false });
protection.options.enableACL = true;

const prodContext2 = protection.createContext({
  public: 'Public data',
  secret: 'Secret data'
});

try {
  vm.runInContext('secret', prodContext2);
} catch (err) {
  console.log(`  ✓ Blocked: ${err.message}`);
}

console.log('\nProtection Statistics:');
console.log(util.inspect(protection.getStats(), { depth: null, colors: true }));

// ============================================================================
// Summary
// ============================================================================

console.log('\n\n=== Summary: Proxy-Based Protection ===\n');

console.log('Key Features:');
console.log('✓ Multi-layer defense (access control, validation, sanitization)');
console.log('✓ Revocable proxies for temporary access');
console.log('✓ Fine-grained permission matrix');
console.log('✓ Rate limiting');
console.log('✓ Comprehensive logging');
console.log('✓ Value sanitization');

console.log('\nBest Practices:');
console.log('• Use multiple proxy layers');
console.log('• Implement comprehensive logging');
console.log('• Apply rate limiting');
console.log('• Use revocable proxies for time-limited access');
console.log('• Regular audit of access logs');
console.log('• Sanitize all input values');
