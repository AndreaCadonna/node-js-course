/**
 * Exercise 4: Secure Process Manager
 * ===================================
 *
 * Difficulty: Very Hard
 *
 * Task:
 * Build a secure process manager that implements security hardening,
 * privilege management, resource isolation, and security monitoring.
 * Handle sensitive operations safely and implement defense-in-depth strategies.
 *
 * Requirements:
 * 1. Implement privilege dropping after initialization
 * 2. Create secure sandbox for untrusted code execution
 * 3. Monitor and limit resource usage (CPU, memory, file descriptors)
 * 4. Implement security event logging and alerting
 * 5. Handle environment variable sanitization
 * 6. Implement secure IPC channels
 * 7. Validate and sanitize all inputs
 * 8. Implement process isolation strategies
 * 9. Monitor for suspicious activity patterns
 * 10. Provide security audit reports
 *
 * Learning Goals:
 * - Process security best practices
 * - Privilege management in Node.js
 * - Resource limitation and isolation
 * - Security monitoring and alerting
 * - Defense-in-depth strategies
 * - Secure coding patterns
 *
 * Test:
 * 1. Run secure process manager
 * 2. Test privilege dropping
 * 3. Execute sandboxed code
 * 4. Monitor security events
 * 5. Review security audit
 *
 * Run: node exercise-4.js
 * Note: Some features require root/admin privileges
 */

const { fork, spawn } = require('child_process');
const vm = require('vm');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const EventEmitter = require('events');

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Security settings
  DROP_PRIVILEGES: false,         // Set to true in production
  TARGET_USER: 'nobody',          // User to drop to (Unix)
  TARGET_GROUP: 'nogroup',        // Group to drop to (Unix)

  // Resource limits
  MAX_MEMORY_MB: 512,             // Maximum memory per worker
  MAX_CPU_PERCENT: 80,            // Maximum CPU usage
  MAX_FILE_DESCRIPTORS: 1024,

  // Sandbox settings
  SANDBOX_TIMEOUT: 5000,          // 5 seconds max execution
  ALLOWED_MODULES: ['crypto', 'util'], // Whitelist of modules

  // Security monitoring
  MONITOR_INTERVAL: 5000,         // 5 seconds
  ALERT_ON_SUSPICIOUS: true,

  // Audit log
  AUDIT_LOG_FILE: './security-audit.log',
};

// ============================================================================
// Security Event Types
// ============================================================================

const SecurityEvent = {
  PRIVILEGE_DROP: 'privilege_drop',
  SANDBOX_VIOLATION: 'sandbox_violation',
  RESOURCE_LIMIT_EXCEEDED: 'resource_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  INPUT_VALIDATION_FAILED: 'input_validation_failed',
  IPC_SECURITY_VIOLATION: 'ipc_security_violation',
  UNAUTHORIZED_ACCESS: 'unauthorized_access'
};

// ============================================================================
// Security Audit Logger
// ============================================================================

class SecurityAuditLogger {
  /**
   * TODO 1: Implement Security Audit Logger
   *
   * The logger should:
   * - Write security events to audit log
   * - Include timestamp, event type, severity, details
   * - Support different severity levels
   * - Rotate logs if they get too large
   * - Provide log analysis capabilities
   */
  constructor(logFile) {
    this.logFile = logFile;
    this.events = [];
  }

  log(eventType, severity, details) {
    // TODO: Log security event
    // const event = {
    //   timestamp: new Date().toISOString(),
    //   eventType,
    //   severity,
    //   details,
    //   pid: process.pid,
    //   user: process.getuid ? process.getuid() : 'N/A',
    //   platform: process.platform
    // };
    //
    // this.events.push(event);
    //
    // const logLine = JSON.stringify(event) + '\n';
    // fs.appendFileSync(this.logFile, logLine);
    //
    // // Alert on critical events
    // if (severity === 'critical') {
    //   console.error(`🚨 SECURITY ALERT: ${eventType}`, details);
    // }
  }

  getEvents(filter = {}) {
    // TODO: Query events with filters
    // return this.events.filter(event => {
    //   if (filter.eventType && event.eventType !== filter.eventType) return false;
    //   if (filter.severity && event.severity !== filter.severity) return false;
    //   return true;
    // });
  }

  generateReport() {
    // TODO: Generate security report
    // const eventsByType = {};
    // const eventsBySeverity = {};
    //
    // this.events.forEach(event => {
    //   eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
    //   eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    // });
    //
    // return {
    //   totalEvents: this.events.length,
    //   eventsByType,
    //   eventsBySeverity,
    //   recentEvents: this.events.slice(-10)
    // };
  }
}

// ============================================================================
// Input Validator
// ============================================================================

class InputValidator {
  /**
   * TODO 2: Implement Input Validator
   *
   * Validate and sanitize inputs:
   * - Check for command injection patterns
   * - Validate file paths (no traversal)
   * - Sanitize strings
   * - Validate against whitelist
   */
  static validateCommand(command) {
    // TODO: Validate command string
    // const dangerousPatterns = [
    //   /[;&|`$()]/,           // Shell metacharacters
    //   /\.\./,                // Path traversal
    //   /^rm\s/,               // Dangerous commands
    //   /^kill\s/,
    //   />\s*\/dev\//          // Device access
    // ];
    //
    // for (const pattern of dangerousPatterns) {
    //   if (pattern.test(command)) {
    //     throw new Error(`Command validation failed: dangerous pattern detected`);
    //   }
    // }
    //
    // return command;
  }

  static validatePath(filePath) {
    // TODO: Validate file path
    // const normalized = path.normalize(filePath);
    //
    // if (normalized.includes('..')) {
    //   throw new Error('Path traversal detected');
    // }
    //
    // if (path.isAbsolute(filePath)) {
    //   throw new Error('Absolute paths not allowed');
    // }
    //
    // return normalized;
  }

  static sanitizeEnv(env) {
    // TODO: Sanitize environment variables
    // const sanitized = {};
    // const dangerous = ['LD_PRELOAD', 'LD_LIBRARY_PATH', 'NODE_OPTIONS'];
    //
    // for (const [key, value] of Object.entries(env)) {
    //   if (!dangerous.includes(key)) {
    //     sanitized[key] = value;
    //   }
    // }
    //
    // return sanitized;
  }
}

// ============================================================================
// Secure Sandbox
// ============================================================================

class SecureSandbox {
  /**
   * TODO 3: Implement Secure Sandbox
   *
   * Create a secure sandbox for code execution:
   * - Use vm.createContext for isolation
   * - Limit available globals
   * - Implement timeout
   * - Whitelist allowed modules
   * - Catch and report violations
   */
  constructor(config, auditLogger) {
    this.config = config;
    this.auditLogger = auditLogger;
  }

  async execute(code, timeout = this.config.SANDBOX_TIMEOUT) {
    // TODO: Execute code in sandbox
    // try {
    //   // Create limited context
    //   const sandbox = {
    //     console: {
    //       log: (...args) => console.log('[SANDBOX]', ...args)
    //     },
    //     setTimeout: setTimeout,
    //     clearTimeout: clearTimeout,
    //     Buffer: Buffer,
    //     // No access to: require, process, fs, etc.
    //   };
    //
    //   const context = vm.createContext(sandbox);
    //
    //   // Execute with timeout
    //   const result = vm.runInContext(code, context, {
    //     timeout,
    //     displayErrors: true,
    //     breakOnSigint: true
    //   });
    //
    //   this.auditLogger.log(SecurityEvent.SANDBOX_VIOLATION, 'info', {
    //     action: 'code_executed',
    //     codeLength: code.length
    //   });
    //
    //   return { success: true, result };
    // } catch (error) {
    //   this.auditLogger.log(SecurityEvent.SANDBOX_VIOLATION, 'warning', {
    //     action: 'execution_failed',
    //     error: error.message
    //   });
    //
    //   return { success: false, error: error.message };
    // }
  }
}

// ============================================================================
// Resource Monitor
// ============================================================================

class ResourceMonitor {
  /**
   * TODO 4: Implement Resource Monitor
   *
   * Monitor and enforce resource limits:
   * - Track memory usage
   * - Monitor CPU usage
   * - Count file descriptors (if available)
   * - Enforce limits
   * - Alert on violations
   */
  constructor(config, auditLogger) {
    this.config = config;
    this.auditLogger = auditLogger;
    this.isMonitoring = false;
  }

  checkMemoryLimit() {
    // TODO: Check memory limit
    // const usage = process.memoryUsage();
    // const heapUsedMB = usage.heapUsed / 1024 / 1024;
    //
    // if (heapUsedMB > this.config.MAX_MEMORY_MB) {
    //   this.auditLogger.log(
    //     SecurityEvent.RESOURCE_LIMIT_EXCEEDED,
    //     'critical',
    //     {
    //       resource: 'memory',
    //       current: heapUsedMB,
    //       limit: this.config.MAX_MEMORY_MB
    //     }
    //   );
    //
    //   return false;
    // }
    //
    // return true;
  }

  checkCPULimit(cpuPercent) {
    // TODO: Check CPU limit
    // if (cpuPercent > this.config.MAX_CPU_PERCENT) {
    //   this.auditLogger.log(
    //     SecurityEvent.RESOURCE_LIMIT_EXCEEDED,
    //     'warning',
    //     {
    //       resource: 'cpu',
    //       current: cpuPercent,
    //       limit: this.config.MAX_CPU_PERCENT
    //     }
    //   );
    //
    //   return false;
    // }
    //
    // return true;
  }

  start() {
    // TODO: Start monitoring
    // if (this.isMonitoring) return;
    //
    // this.isMonitoring = true;
    // this.monitorTimer = setInterval(() => {
    //   this.checkMemoryLimit();
    //   // CPU checking would need additional tracking
    // }, this.config.MONITOR_INTERVAL);
  }

  stop() {
    // TODO: Stop monitoring
    // if (this.monitorTimer) {
    //   clearInterval(this.monitorTimer);
    //   this.isMonitoring = false;
    // }
  }
}

// ============================================================================
// Secure Process Manager
// ============================================================================

class SecureProcessManager extends EventEmitter {
  /**
   * TODO 5: Implement Secure Process Manager
   *
   * Main process manager that:
   * - Manages worker processes securely
   * - Drops privileges after initialization
   * - Monitors security events
   * - Enforces resource limits
   * - Provides security reports
   */
  constructor(config = CONFIG) {
    super();
    this.config = config;
    this.auditLogger = new SecurityAuditLogger(config.AUDIT_LOG_FILE);
    this.sandbox = new SecureSandbox(config, this.auditLogger);
    this.resourceMonitor = new ResourceMonitor(config, this.auditLogger);
    this.workers = new Map();
    this.hasDroppedPrivileges = false;
  }

  /**
   * TODO 6: Implement privilege dropping
   *
   * Drop privileges to non-root user (Unix only):
   * - Check if running as root
   * - Change group first (setgid)
   * - Change user second (setuid)
   * - Verify privileges were dropped
   * - Log the action
   */
  dropPrivileges() {
    // TODO: Drop privileges (Unix only)
    // if (process.platform === 'win32') {
    //   console.log('⚠️  Privilege dropping not supported on Windows');
    //   return;
    // }
    //
    // if (!this.config.DROP_PRIVILEGES) {
    //   console.log('ℹ️  Privilege dropping disabled in config');
    //   return;
    // }
    //
    // try {
    //   if (process.getgid && process.setgid) {
    //     process.setgid(this.config.TARGET_GROUP);
    //   }
    //
    //   if (process.getuid && process.setuid) {
    //     const oldUid = process.getuid();
    //     process.setuid(this.config.TARGET_USER);
    //     const newUid = process.getuid();
    //
    //     console.log(`✅ Dropped privileges: ${oldUid} -> ${newUid}`);
    //
    //     this.auditLogger.log(SecurityEvent.PRIVILEGE_DROP, 'info', {
    //       oldUid,
    //       newUid,
    //       user: this.config.TARGET_USER
    //     });
    //   }
    //
    //   this.hasDroppedPrivileges = true;
    // } catch (error) {
    //   console.error('❌ Failed to drop privileges:', error.message);
    //   this.auditLogger.log(SecurityEvent.PRIVILEGE_DROP, 'critical', {
    //     error: error.message
    //   });
    // }
  }

  /**
   * TODO 7: Spawn secure worker process
   *
   * Spawn a worker with security constraints:
   * - Validate script path
   * - Sanitize environment
   * - Set resource limits
   * - Monitor the process
   * - Handle IPC securely
   */
  spawnSecureWorker(scriptPath, options = {}) {
    // TODO: Spawn secure worker
    // try {
    //   // Validate path
    //   const validPath = InputValidator.validatePath(scriptPath);
    //
    //   // Sanitize environment
    //   const env = InputValidator.sanitizeEnv(options.env || {});
    //
    //   // Fork worker
    //   const worker = fork(validPath, options.args || [], {
    //     env,
    //     stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    //   });
    //
    //   const workerId = crypto.randomBytes(16).toString('hex');
    //   this.workers.set(workerId, worker);
    //
    //   // Monitor worker
    //   this.monitorWorker(workerId, worker);
    //
    //   this.auditLogger.log(SecurityEvent.PRIVILEGE_DROP, 'info', {
    //     action: 'worker_spawned',
    //     workerId,
    //     script: validPath
    //   });
    //
    //   return workerId;
    // } catch (error) {
    //   this.auditLogger.log(SecurityEvent.INPUT_VALIDATION_FAILED, 'warning', {
    //     error: error.message
    //   });
    //   throw error;
    // }
  }

  /**
   * TODO 8: Monitor worker process
   */
  monitorWorker(workerId, worker) {
    // TODO: Monitor worker for security violations
    // worker.on('message', (msg) => {
    //   // Validate IPC messages
    //   if (typeof msg !== 'object') {
    //     this.auditLogger.log(SecurityEvent.IPC_SECURITY_VIOLATION, 'warning', {
    //       workerId,
    //       issue: 'Invalid message type'
    //     });
    //   }
    // });
    //
    // worker.on('error', (error) => {
    //   this.auditLogger.log(SecurityEvent.SUSPICIOUS_ACTIVITY, 'error', {
    //     workerId,
    //     error: error.message
    //   });
    // });
    //
    // worker.on('exit', (code, signal) => {
    //   this.workers.delete(workerId);
    //   this.auditLogger.log(SecurityEvent.PRIVILEGE_DROP, 'info', {
    //     action: 'worker_exited',
    //     workerId,
    //     code,
    //     signal
    //   });
    // });
  }

  /**
   * TODO 9: Execute code in sandbox
   */
  async executeSandboxed(code) {
    // TODO: Execute code in sandbox
    // return await this.sandbox.execute(code);
  }

  /**
   * TODO 10: Generate security report
   */
  generateSecurityReport() {
    // TODO: Generate comprehensive security report
    // const auditReport = this.auditLogger.generateReport();
    //
    // return {
    //   timestamp: new Date().toISOString(),
    //   privilegesDropped: this.hasDroppedPrivileges,
    //   activeWorkers: this.workers.size,
    //   platform: process.platform,
    //   nodeVersion: process.version,
    //   audit: auditReport,
    //   processInfo: {
    //     pid: process.pid,
    //     uid: process.getuid ? process.getuid() : 'N/A',
    //     gid: process.getgid ? process.getgid() : 'N/A'
    //   }
    // };
  }

  /**
   * TODO 11: Start security monitoring
   */
  start() {
    // TODO: Initialize and start
    // console.log('🔒 Secure Process Manager Started\n');
    //
    // // Drop privileges if configured
    // this.dropPrivileges();
    //
    // // Start resource monitoring
    // this.resourceMonitor.start();
    //
    // console.log('✅ Security monitoring active\n');
  }

  /**
   * TODO 12: Stop and cleanup
   */
  stop() {
    // TODO: Stop monitoring and cleanup
    // this.resourceMonitor.stop();
    //
    // // Terminate all workers
    // for (const [workerId, worker] of this.workers) {
    //   worker.kill();
    // }
    //
    // const report = this.generateSecurityReport();
    // console.log('\n📊 Final Security Report:');
    // console.log(JSON.stringify(report, null, 2));
  }
}

// ============================================================================
// Main Execution
// ============================================================================

function main() {
  console.log('═'.repeat(70));
  console.log('SECURE PROCESS MANAGER');
  console.log('═'.repeat(70));
  console.log();

  // TODO: Create and start manager
  // const manager = new SecureProcessManager();
  // manager.start();

  // TODO: Test sandbox execution
  // setTimeout(async () => {
  //   console.log('\n🧪 Testing sandbox execution...\n');
  //
  //   // Safe code
  //   const result1 = await manager.executeSandboxed(`
  //     const x = 1 + 1;
  //     x * 2;
  //   `);
  //   console.log('Safe code result:', result1);
  //
  //   // Unsafe code (will fail)
  //   const result2 = await manager.executeSandboxed(`
  //     require('fs').readFileSync('/etc/passwd');
  //   `);
  //   console.log('Unsafe code result:', result2);
  // }, 2000);

  // TODO: Handle shutdown
  // process.on('SIGINT', () => {
  //   console.log('\n\n🛑 Shutting down...');
  //   manager.stop();
  //   process.exit(0);
  // });

  console.log('💡 Press Ctrl+C to stop\n');
}

// TODO: Uncomment to run
// main();

/**
 * IMPORTANT NOTES:
 *
 * 1. Privilege Dropping:
 *    - Only works on Unix systems
 *    - Requires starting as root
 *    - Cannot regain privileges after dropping
 *    - Should be done after binding to privileged ports
 *
 * 2. Sandboxing Limitations:
 *    - vm module provides isolation but not complete security
 *    - For true isolation, use worker_threads or child_process
 *    - Consider using containers for stronger isolation
 *
 * 3. Resource Limits:
 *    - Use --max-old-space-size for memory limits
 *    - Consider using cgroups for stronger enforcement
 *    - Monitor external to the process for reliability
 *
 * 4. Production Recommendations:
 *    - Run as non-root user
 *    - Use containers for isolation
 *    - Implement rate limiting
 *    - Use security scanning tools
 *    - Regular security audits
 */
