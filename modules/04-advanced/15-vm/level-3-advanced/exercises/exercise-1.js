/**
 * Exercise 1: Build a Hardened Sandbox
 *
 * Difficulty: ⭐⭐⭐ Hard
 * Estimated Time: 60-90 minutes
 *
 * Your Task:
 * Build a production-ready hardened sandbox that prevents all common escape
 * techniques and provides comprehensive security features.
 *
 * Requirements:
 * 1. Create a HardenedSandbox class with the following features:
 *    - Null prototype base context
 *    - Whitelist-only global objects
 *    - Multi-layer proxy protection
 *    - Property access blacklist
 *    - Execution timeout enforcement
 *    - Memory limit tracking
 *    - Security audit logging
 *
 * 2. Implement security layers:
 *    - Layer 1: Null prototype (Object.create(null))
 *    - Layer 2: Whitelist safe globals (Math, JSON, Date, etc.)
 *    - Layer 3: Proxy-based access control
 *    - Layer 4: Execution monitoring
 *
 * 3. Block these escape vectors:
 *    - constructor access
 *    - __proto__ manipulation
 *    - prototype pollution
 *    - Function constructor
 *    - eval access
 *    - process/require access
 *
 * 4. Provide these methods:
 *    - execute(code, timeout): Execute code safely
 *    - getSecurityLog(): Get all security events
 *    - getStats(): Get execution statistics
 *    - reset(): Reset sandbox state
 *
 * 5. Track and report:
 *    - Total executions
 *    - Successful executions
 *    - Failed executions
 *    - Security violations
 *    - Average execution time
 *    - Memory usage
 */

const vm = require('vm');
const v8 = require('v8');

// TODO: Implement the HardenedSandbox class
class HardenedSandbox {
  constructor(options = {}) {
    // TODO: Initialize sandbox with configuration
    // - timeout (default: 5000ms)
    // - maxMemoryMB (default: 50)
    // - enableLogging (default: true)
    // - allowedGlobals (default: ['Math', 'JSON', 'Date'])
  }

  /**
   * Create secure base context
   * TODO: Implement null prototype base with whitelisted globals
   */
  createSecureBase() {
    // TODO: Start with Object.create(null)
    // TODO: Add only whitelisted globals
    // TODO: Create clean copies without prototypes
    // TODO: Freeze all global objects
  }

  /**
   * Create proxy protection layer
   * TODO: Implement comprehensive proxy handler
   */
  createProxyHandler() {
    // TODO: Implement get trap (block dangerous properties)
    // TODO: Implement set trap (prevent pollution)
    // TODO: Implement has trap (hide internals)
    // TODO: Implement deleteProperty trap
    // TODO: Implement getPrototypeOf trap
    // TODO: Log all access attempts
  }

  /**
   * Execute code in hardened sandbox
   * TODO: Implement secure execution with monitoring
   */
  execute(code, timeout) {
    // TODO: Create/reuse secure context
    // TODO: Track memory before execution
    // TODO: Execute with timeout
    // TODO: Track memory after execution
    // TODO: Check memory limit
    // TODO: Log execution
    // TODO: Return result with metrics
  }

  /**
   * Log security event
   * TODO: Implement security event logging
   */
  logSecurityEvent(event, details) {
    // TODO: Create log entry with timestamp
    // TODO: Include event type and details
    // TODO: Track violations
  }

  /**
   * Get security log
   * TODO: Return all security events
   */
  getSecurityLog() {
    // TODO: Return array of log entries
  }

  /**
   * Get execution statistics
   * TODO: Return comprehensive stats
   */
  getStats() {
    // TODO: Return statistics object with:
    // - totalExecutions
    // - successfulExecutions
    // - failedExecutions
    // - securityViolations
    // - averageExecutionTime
    // - peakMemoryUsage
  }

  /**
   * Reset sandbox
   * TODO: Clear all state and create fresh context
   */
  reset() {
    // TODO: Clear context
    // TODO: Reset statistics
    // TODO: Clear logs
    // TODO: Trigger garbage collection
  }
}

// ============================================================================
// Test Cases - DO NOT MODIFY
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
  console.log('\nAll tests completed!');
  console.log('\nExpected output:');
  console.log('- Safe operations should execute successfully');
  console.log('- All escape attempts should be blocked');
  console.log('- Timeout should be enforced');
  console.log('- Statistics should be accurate');
  console.log('- Security logging should work');
  console.log('- Reset should clear state');
}

// Uncomment to run tests
// runTests();

console.log(`
Exercise 1: Build a Hardened Sandbox

Next Steps:
1. Implement the HardenedSandbox class
2. Create secure base context with null prototype
3. Implement proxy-based protection
4. Add execution monitoring and logging
5. Implement statistics tracking
6. Test with provided test cases
7. Compare with solution

Tips:
- Use Object.create(null) for base context
- Whitelist only safe globals
- Create comprehensive proxy handler
- Block all dangerous properties
- Track memory before and after execution
- Log all security events
- Test against all escape vectors

Good luck!
`);
