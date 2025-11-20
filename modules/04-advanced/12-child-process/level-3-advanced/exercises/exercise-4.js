/**
 * Exercise 4: Secure Command Executor
 *
 * Build a secure command execution system that:
 * - Validates and sanitizes all inputs
 * - Uses command whitelisting
 * - Enforces resource limits
 * - Implements audit logging
 * - Applies principle of least privilege
 * - Detects and blocks security threats
 *
 * Requirements:
 * 1. Whitelist allowed commands and arguments
 * 2. Sanitize user input to prevent injection
 * 3. Enforce timeout, memory, and CPU limits
 * 4. Log all executions with full context
 * 5. Validate file paths and prevent traversal
 * 6. Run commands with minimal privileges
 * 7. Detect and log suspicious activity
 *
 * Bonus:
 * - Implement rate limiting per user
 * - Add command signing/verification
 * - Create security incident response
 * - Implement command approval workflow
 */

const { spawn, execFile } = require('child_process');
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

/**
 * SecureExecutor - Execute commands with security controls
 *
 * YOUR TASK: Implement this class with all required features
 */
class SecureExecutor extends EventEmitter {
  constructor(options = {}) {
    super();

    // Security configuration
    this.allowedCommands = options.allowedCommands || [];
    this.allowedPaths = options.allowedPaths || [];
    this.maxExecutionTime = options.maxExecutionTime || 5000;
    this.maxMemory = options.maxMemory || 128; // MB
    this.maxOutputSize = options.maxOutputSize || 1024 * 1024; // 1MB
    this.enableAuditLog = options.enableAuditLog !== false;
    this.rateLimits = options.rateLimits || {
      perUser: 10,       // executions per minute
      perCommand: 100    // executions per minute
    };

    // TODO: Initialize state
    // - audit log
    // - rate limit tracking
    // - security incidents
    // - blocked users/IPs
  }

  /**
   * Execute a command securely
   * TODO: Validate and execute with security controls
   *
   * @param {object} request - { command, args, user, context }
   * @returns {Promise} Execution result
   */
  async execute(request) {
    // TODO: Implement secure execution
    // 1. Validate request structure
    // 2. Check rate limits
    // 3. Validate command
    // 4. Validate arguments
    // 5. Validate paths if any
    // 6. Create audit log entry
    // 7. Execute with limits
    // 8. Update audit log
    // 9. Return result
    throw new Error('Not implemented');
  }

  /**
   * Validate command is allowed
   * TODO: Check if command is in whitelist
   */
  validateCommand(command) {
    // TODO: Implement command validation
    // 1. Check against whitelist
    // 2. Check for shell metacharacters
    // 3. Verify command exists
    // 4. Check command permissions
    throw new Error('Not implemented');
  }

  /**
   * Validate arguments
   * TODO: Sanitize and validate all arguments
   */
  validateArguments(args) {
    // TODO: Implement argument validation
    // 1. Check argument types
    // 2. Sanitize each argument
    // 3. Check for injection attempts
    // 4. Validate against patterns
    // 5. Check argument count limits
    throw new Error('Not implemented');
  }

  /**
   * Sanitize input string
   * TODO: Remove dangerous characters
   */
  sanitizeInput(input) {
    // TODO: Implement sanitization
    // 1. Remove/escape shell metacharacters
    // 2. Check for null bytes
    // 3. Validate encoding
    // 4. Check length limits
    throw new Error('Not implemented');
  }

  /**
   * Validate file path
   * TODO: Ensure path is safe and allowed
   */
  validatePath(inputPath) {
    // TODO: Implement path validation
    // 1. Resolve to absolute path
    // 2. Check for path traversal (..)
    // 3. Check against allowed paths
    // 4. Verify path exists
    // 5. Check permissions
    throw new Error('Not implemented');
  }

  /**
   * Check rate limits
   * TODO: Enforce rate limiting
   */
  checkRateLimit(userId, command) {
    // TODO: Implement rate limiting
    // 1. Get current usage for user
    // 2. Get current usage for command
    // 3. Check against limits
    // 4. Update counters
    // 5. Throw error if exceeded
    throw new Error('Not implemented');
  }

  /**
   * Execute with resource limits
   * TODO: Run command with restrictions
   */
  async executeWithLimits(command, args, options) {
    // TODO: Implement limited execution
    // 1. Setup resource limits
    // 2. Setup timeout
    // 3. Setup output size limits
    // 4. Execute using execFile (not exec!)
    // 5. Monitor resource usage
    // 6. Kill if limits exceeded
    throw new Error('Not implemented');
  }

  /**
   * Create audit log entry
   * TODO: Log execution with full context
   */
  createAuditEntry(request, result, error = null) {
    // TODO: Create comprehensive audit log
    // - Execution ID
    // - Timestamp
    // - User information
    // - Command and arguments
    // - Result or error
    // - Resource usage
    // - Security flags
    throw new Error('Not implemented');
  }

  /**
   * Detect suspicious activity
   * TODO: Identify potential security threats
   */
  detectSuspiciousActivity(request) {
    // TODO: Implement threat detection
    // 1. Check for injection patterns
    // 2. Check for privilege escalation attempts
    // 3. Check for unusual patterns
    // 4. Check user history
    // 5. Return threat level and details
    throw new Error('Not implemented');
  }

  /**
   * Handle security incident
   * TODO: Respond to detected threats
   */
  handleSecurityIncident(incident) {
    // TODO: Implement incident response
    // 1. Log incident with details
    // 2. Block user if necessary
    // 3. Emit security alert
    // 4. Notify administrators
    // 5. Take protective actions
    throw new Error('Not implemented');
  }

  /**
   * Get audit log
   * TODO: Return filtered audit entries
   */
  getAuditLog(filters = {}) {
    // TODO: Query audit log
    // Support filters:
    // - user
    // - command
    // - timeRange
    // - status (success/failure)
    // - securityFlags
    throw new Error('Not implemented');
  }

  /**
   * Get security report
   * TODO: Generate security summary
   */
  getSecurityReport(timeRange = 3600000) {
    // TODO: Generate report
    // - Total executions
    // - Failed executions
    // - Blocked attempts
    // - Security incidents
    // - Top users
    // - Top commands
    throw new Error('Not implemented');
  }

  /**
   * Block user
   * TODO: Prevent user from executing commands
   */
  blockUser(userId, reason, duration = null) {
    // TODO: Implement user blocking
    // 1. Add to blocked list
    // 2. Set expiration if duration given
    // 3. Log the action
    // 4. Emit event
    throw new Error('Not implemented');
  }

  /**
   * Unblock user
   * TODO: Remove user from blocked list
   */
  unblockUser(userId) {
    // TODO: Implement unblocking
    throw new Error('Not implemented');
  }

  /**
   * Check if user is blocked
   * TODO: Verify user status
   */
  isUserBlocked(userId) {
    // TODO: Check block status
    // 1. Check if in blocked list
    // 2. Check expiration
    // 3. Clean up expired blocks
    throw new Error('Not implemented');
  }

  /**
   * Get safe environment variables
   * TODO: Build minimal environment
   */
  getSafeEnvironment(customEnv = {}) {
    // TODO: Create safe environment
    // 1. Start with minimal vars
    // 2. Add only whitelisted custom vars
    // 3. Remove sensitive vars
    throw new Error('Not implemented');
  }
}

/**
 * CommandPolicy - Define security policies for commands
 */
class CommandPolicy {
  constructor() {
    this.policies = new Map();
  }

  /**
   * Define a policy for a command
   * TODO: Set allowed arguments and constraints
   */
  define(command, policy) {
    // TODO: Store policy
    // Policy includes:
    // - allowed arguments (patterns)
    // - required arguments
    // - max execution time
    // - max output size
    // - allowed users/roles
    throw new Error('Not implemented');
  }

  /**
   * Validate command against policy
   * TODO: Check if execution matches policy
   */
  validate(command, args, user) {
    // TODO: Validate against policy
    // 1. Get policy for command
    // 2. Check user authorization
    // 3. Validate arguments
    // 4. Check constraints
    throw new Error('Not implemented');
  }

  /**
   * Get policy for command
   * TODO: Return command policy
   */
  getPolicy(command) {
    // TODO: Return policy or default
    throw new Error('Not implemented');
  }
}

/**
 * Test your implementation
 */
async function test() {
  console.log('=== Testing Secure Command Executor ===\n');

  const executor = new SecureExecutor({
    allowedCommands: ['ls', 'echo', 'cat', 'node'],
    allowedPaths: ['/tmp', process.cwd()],
    maxExecutionTime: 3000,
    enableAuditLog: true,
    rateLimits: {
      perUser: 5,
      perCommand: 10
    }
  });

  // Test 1: Valid command
  console.log('Test 1: Valid command');
  try {
    const result = await executor.execute({
      command: 'echo',
      args: ['Hello, World!'],
      user: { id: 'user1', name: 'Test User' },
      context: { ip: '127.0.0.1' }
    });
    console.log('✓ Command executed successfully\n');
  } catch (error) {
    console.error('✗ Failed:', error.message, '\n');
  }

  // Test 2: Blocked command
  console.log('Test 2: Blocked command');
  try {
    await executor.execute({
      command: 'rm',
      args: ['-rf', '/'],
      user: { id: 'user1' }
    });
    console.error('✗ Should have blocked this command\n');
  } catch (error) {
    console.log('✓ Command blocked:', error.message, '\n');
  }

  // Test 3: Injection attempt
  console.log('Test 3: Injection attempt');
  try {
    await executor.execute({
      command: 'echo',
      args: ['test; rm -rf /'],
      user: { id: 'user1' }
    });
    console.error('✗ Should have detected injection\n');
  } catch (error) {
    console.log('✓ Injection detected:', error.message, '\n');
  }

  // Test 4: Rate limiting
  console.log('Test 4: Rate limiting');
  try {
    for (let i = 0; i < 10; i++) {
      await executor.execute({
        command: 'echo',
        args: [`Request ${i}`],
        user: { id: 'user2' }
      });
    }
    console.error('✗ Should have hit rate limit\n');
  } catch (error) {
    console.log('✓ Rate limit enforced:', error.message, '\n');
  }

  // Test 5: Security report
  console.log('Test 5: Security report');
  const report = executor.getSecurityReport();
  console.log(report);

  console.log('\n=== Test Complete ===');
}

// Uncomment to test
// test().catch(console.error);

module.exports = { SecureExecutor, CommandPolicy };

/**
 * Hints:
 *
 * 1. Whitelisting:
 *    - Use Set for O(1) lookup
 *    - Store absolute paths to commands
 *    - Validate command exists and is executable
 *
 * 2. Injection Prevention:
 *    - NEVER use exec() - use execFile()
 *    - Check for: ; | & $ ` \n > < ( ) { }
 *    - Escape or reject dangerous chars
 *
 * 3. Path Validation:
 *    - Use path.resolve() to get absolute path
 *    - Check for ".." after resolving
 *    - Verify starts with allowed path
 *
 * 4. Rate Limiting:
 *    - Track: Map<userId, Array<timestamp>>
 *    - Filter timestamps within window
 *    - Check count against limit
 *
 * 5. Audit Logging:
 *    - Log BEFORE and AFTER execution
 *    - Include: user, command, args, result, timing
 *    - Store securely (append-only)
 *
 * 6. Resource Limits:
 *    - Use timeout option in execFile
 *    - Monitor output size
 *    - Kill process if exceeded
 *    - Set maxBuffer option
 */
