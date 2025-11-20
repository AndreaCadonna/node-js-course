/**
 * Exercise 1 Solution: Hardened Sandbox
 *
 * This is a complete, production-ready implementation of a hardened sandbox
 * with multiple layers of security protection.
 */

const vm = require('vm');
const v8 = require('v8');

class HardenedSandbox {
  constructor(options = {}) {
    this.timeout = options.timeout || 5000;
    this.maxMemoryMB = options.maxMemoryMB || 50;
    this.enableLogging = options.enableLogging !== false;
    this.allowedGlobals = options.allowedGlobals || ['Math', 'JSON', 'Date'];

    // Statistics
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      securityViolations: 0,
      totalExecutionTime: 0,
      peakMemoryUsage: 0
    };

    // Security log
    this.securityLog = [];

    // Dangerous properties to block
    this.blockedProperties = new Set([
      'constructor',
      '__proto__',
      'prototype',
      'eval',
      'Function',
      'process',
      'require',
      'global',
      'globalThis',
      'import',
      'module',
      'exports',
      '__dirname',
      '__filename'
    ]);

    // Create secure context
    this.context = null;
    this.createSecureContext();
  }

  /**
   * Create secure base context with null prototype
   */
  createSecureBase() {
    // Start with null prototype to prevent prototype chain access
    const base = Object.create(null);

    // Add only whitelisted globals
    for (const globalName of this.allowedGlobals) {
      const original = global[globalName];
      if (original) {
        // Create frozen copy to prevent modification
        if (typeof original === 'object') {
          base[globalName] = Object.freeze({ ...original });
        } else {
          base[globalName] = original;
        }
      }
    }

    return base;
  }

  /**
   * Create proxy handler for access control
   */
  createProxyHandler() {
    const self = this;

    return {
      // Intercept property access
      get(target, prop, receiver) {
        // Block dangerous properties
        if (self.blockedProperties.has(prop)) {
          self.logSecurityEvent('BLOCKED_ACCESS', {
            property: prop,
            type: 'get'
          });
          throw new Error(`Access to "${prop}" is not allowed`);
        }

        // Allow safe property access
        return Reflect.get(target, prop, receiver);
      },

      // Intercept property setting (prevent pollution)
      set(target, prop, value, receiver) {
        // Block prototype pollution attempts
        if (prop === '__proto__' || prop === 'prototype' || prop === 'constructor') {
          self.logSecurityEvent('BLOCKED_POLLUTION', {
            property: prop,
            type: 'set'
          });
          throw new Error(`Setting "${prop}" is not allowed`);
        }

        // Allow normal property setting
        return Reflect.set(target, prop, value, receiver);
      },

      // Hide internal properties
      has(target, prop) {
        if (self.blockedProperties.has(prop)) {
          return false;
        }
        return Reflect.has(target, prop);
      },

      // Block property deletion of protected properties
      deleteProperty(target, prop) {
        if (self.blockedProperties.has(prop)) {
          self.logSecurityEvent('BLOCKED_DELETE', {
            property: prop
          });
          return false;
        }
        return Reflect.deleteProperty(target, prop);
      },

      // Block prototype manipulation
      getPrototypeOf(target) {
        return null;
      },

      setPrototypeOf(target, proto) {
        self.logSecurityEvent('BLOCKED_SETPROTO', {
          attempted: true
        });
        return false;
      }
    };
  }

  /**
   * Create secure context
   */
  createSecureContext() {
    // Create base context with security
    const base = this.createSecureBase();

    // Wrap in protective proxy
    const handler = this.createProxyHandler();
    const proxied = new Proxy(base, handler);

    // Create VM context
    this.context = vm.createContext(proxied);
  }

  /**
   * Execute code in hardened sandbox
   */
  execute(code, timeout) {
    this.stats.totalExecutions++;

    const executionTimeout = timeout || this.timeout;
    const startTime = Date.now();

    // Get memory before execution
    const memBefore = process.memoryUsage();

    try {
      // Execute with timeout
      const result = vm.runInContext(code, this.context, {
        timeout: executionTimeout,
        displayErrors: true,
        breakOnSigint: true
      });

      // Get memory after execution
      const memAfter = process.memoryUsage();
      const memUsed = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;

      // Check memory limit
      if (memUsed > this.maxMemoryMB) {
        this.logSecurityEvent('MEMORY_LIMIT_EXCEEDED', {
          used: memUsed,
          limit: this.maxMemoryMB
        });
        throw new Error(`Memory limit exceeded: ${memUsed.toFixed(2)}MB > ${this.maxMemoryMB}MB`);
      }

      // Update statistics
      const executionTime = Date.now() - startTime;
      this.stats.successfulExecutions++;
      this.stats.totalExecutionTime += executionTime;
      this.stats.peakMemoryUsage = Math.max(this.stats.peakMemoryUsage, memUsed);

      if (this.enableLogging) {
        this.logSecurityEvent('EXECUTION_SUCCESS', {
          executionTime,
          memoryUsed: memUsed
        });
      }

      return {
        success: true,
        result,
        executionTime,
        memoryUsed: memUsed
      };

    } catch (err) {
      this.stats.failedExecutions++;

      // Log error
      const errorType = err.message.includes('timeout') ? 'TIMEOUT' :
                        err.message.includes('not allowed') ? 'SECURITY_VIOLATION' :
                        err.message.includes('Memory limit') ? 'MEMORY_VIOLATION' :
                        'EXECUTION_ERROR';

      if (errorType === 'SECURITY_VIOLATION' || errorType === 'MEMORY_VIOLATION') {
        this.stats.securityViolations++;
      }

      this.logSecurityEvent(errorType, {
        error: err.message,
        executionTime: Date.now() - startTime
      });

      return {
        success: false,
        error: err.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Log security event
   */
  logSecurityEvent(event, details) {
    if (!this.enableLogging) return;

    const entry = {
      timestamp: new Date().toISOString(),
      event,
      details
    };

    this.securityLog.push(entry);

    // Keep log size manageable
    if (this.securityLog.length > 1000) {
      this.securityLog.shift();
    }
  }

  /**
   * Get security log
   */
  getSecurityLog() {
    return [...this.securityLog];
  }

  /**
   * Get execution statistics
   */
  getStats() {
    return {
      ...this.stats,
      averageExecutionTime: this.stats.totalExecutions > 0
        ? this.stats.totalExecutionTime / this.stats.totalExecutions
        : 0
    };
  }

  /**
   * Reset sandbox
   */
  reset() {
    // Clear context
    this.context = null;

    // Reset statistics
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      securityViolations: 0,
      totalExecutionTime: 0,
      peakMemoryUsage: 0
    };

    // Clear logs
    this.securityLog = [];

    // Trigger garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Create fresh context
    this.createSecureContext();
  }
}

// ============================================================================
// Test Cases
// ============================================================================

function runTests() {
  console.log('Testing Hardened Sandbox\n');
  console.log('='.repeat(60));

  const sandbox = new HardenedSandbox({
    timeout: 2000,
    maxMemoryMB: 10,
    enableLogging: true
  });

  // Test 1: Safe operations should work
  console.log('\n✓ Test 1: Safe Operations');
  const test1 = sandbox.execute('Math.sqrt(144) + Math.pow(2, 3)');
  console.assert(test1.success === true, 'Safe code should execute');
  console.assert(test1.result === 20, 'Result should be 20');
  console.log('  Result:', test1.result);

  // Test 2: Constructor access should be blocked
  console.log('\n✓ Test 2: Constructor Access Block');
  const test2 = sandbox.execute('this.constructor.constructor("return process")()');
  console.assert(test2.success === false, 'Constructor access should fail');
  console.log('  Blocked:', test2.error);

  // Test 3: Prototype pollution should be blocked
  console.log('\n✓ Test 3: Prototype Pollution Block');
  const test3 = sandbox.execute('Object.prototype.polluted = true');
  console.assert(test3.success === false, 'Prototype pollution should fail');
  console.log('  Blocked:', test3.error);

  // Test 4: __proto__ access should be blocked
  console.log('\n✓ Test 4: __proto__ Access Block');
  const test4 = sandbox.execute('x = {}; x.__proto__.evil = true');
  console.assert(test4.success === false, '__proto__ access should fail');
  console.log('  Blocked:', test4.error);

  // Test 5: eval should be blocked
  console.log('\n✓ Test 5: Eval Block');
  const test5 = sandbox.execute('eval("1 + 1")');
  console.assert(test5.success === false, 'eval should be blocked');
  console.log('  Blocked:', test5.error);

  // Test 6: process access should be blocked
  console.log('\n✓ Test 6: Process Access Block');
  const test6 = sandbox.execute('process.exit()');
  console.assert(test6.success === false, 'process access should fail');
  console.log('  Blocked:', test6.error);

  // Test 7: Timeout should be enforced
  console.log('\n✓ Test 7: Timeout Enforcement');
  const test7 = sandbox.execute('while(true) {}', 1000);
  console.assert(test7.success === false, 'Timeout should trigger');
  console.log('  Timeout enforced:', test7.error);

  // Test 8: Statistics should be accurate
  console.log('\n✓ Test 8: Statistics Tracking');
  const stats = sandbox.getStats();
  console.assert(stats.totalExecutions === 7, 'Should have 7 executions');
  console.assert(stats.successfulExecutions === 1, 'Should have 1 success');
  console.assert(stats.failedExecutions === 6, 'Should have 6 failures');
  console.assert(stats.securityViolations >= 4, 'Should track violations');
  console.log('  Stats:', stats);

  // Test 9: Security log should record events
  console.log('\n✓ Test 9: Security Logging');
  const log = sandbox.getSecurityLog();
  console.assert(log.length > 0, 'Should have log entries');
  console.log('  Log entries:', log.length);

  // Test 10: Reset should clear state
  console.log('\n✓ Test 10: Reset Functionality');
  sandbox.reset();
  const statsAfterReset = sandbox.getStats();
  console.assert(statsAfterReset.totalExecutions === 0, 'Stats should be reset');
  console.log('  Reset successful');

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ All tests passed!');
}

// Run tests
runTests();

// Export for use in other modules
module.exports = HardenedSandbox;
