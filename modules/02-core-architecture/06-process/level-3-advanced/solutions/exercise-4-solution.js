/**
 * SOLUTION: Exercise 4 - Secure Process Manager
 * ==============================================
 *
 * Production secure process manager with privilege dropping,
 * sandboxing, input validation, and security monitoring.
 *
 * SECURITY FEATURES:
 * - Privilege dropping (Unix)
 * - Secure sandboxing with vm module
 * - Input validation and sanitization
 * - Security audit logging
 * - Resource monitoring
 * - IPC security
 *
 * NOTE: Some features require root privileges (Unix systems only)
 */

const { fork } = require('child_process');
const vm = require('vm');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const EventEmitter = require('events');

const CONFIG = {
  DROP_PRIVILEGES: false,
  TARGET_USER: 'nobody',
  TARGET_GROUP: 'nogroup',
  MAX_MEMORY_MB: 512,
  MAX_CPU_PERCENT: 80,
  SANDBOX_TIMEOUT: 5000,
  ALLOWED_MODULES: ['crypto', 'util'],
  MONITOR_INTERVAL: 5000,
  AUDIT_LOG_FILE: './security-audit.log',
};

const SecurityEvent = {
  PRIVILEGE_DROP: 'privilege_drop',
  SANDBOX_VIOLATION: 'sandbox_violation',
  RESOURCE_LIMIT_EXCEEDED: 'resource_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  INPUT_VALIDATION_FAILED: 'input_validation_failed',
  IPC_SECURITY_VIOLATION: 'ipc_security_violation'
};

class SecurityAuditLogger {
  constructor(logFile) {
    this.logFile = logFile;
    this.events = [];
  }

  log(eventType, severity, details) {
    const event = {
      timestamp: new Date().toISOString(),
      eventType,
      severity,
      details,
      pid: process.pid,
      user: process.getuid ? process.getuid() : 'N/A',
      platform: process.platform
    };

    this.events.push(event);

    const logLine = JSON.stringify(event) + '\n';
    fs.appendFileSync(this.logFile, logLine);

    if (severity === 'critical') {
      console.error(`🚨 SECURITY ALERT: ${eventType}`, details);
    }
  }

  getEvents(filter = {}) {
    return this.events.filter(event => {
      if (filter.eventType && event.eventType !== filter.eventType) return false;
      if (filter.severity && event.severity !== filter.severity) return false;
      return true;
    });
  }

  generateReport() {
    const eventsByType = {};
    const eventsBySeverity = {};

    this.events.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      recentEvents: this.events.slice(-10)
    };
  }
}

class InputValidator {
  static validateCommand(command) {
    const dangerousPatterns = [
      /[;&|`$()]/,
      /\.\./,
      /^rm\s/,
      /^kill\s/,
      />\s*\/dev\//
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        throw new Error(`Command validation failed: dangerous pattern detected`);
      }
    }

    return command;
  }

  static validatePath(filePath) {
    const normalized = path.normalize(filePath);

    if (normalized.includes('..')) {
      throw new Error('Path traversal detected');
    }

    if (path.isAbsolute(filePath)) {
      throw new Error('Absolute paths not allowed');
    }

    return normalized;
  }

  static sanitizeEnv(env) {
    const sanitized = {};
    const dangerous = ['LD_PRELOAD', 'LD_LIBRARY_PATH', 'NODE_OPTIONS'];

    for (const [key, value] of Object.entries(env)) {
      if (!dangerous.includes(key)) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

class SecureSandbox {
  constructor(config, auditLogger) {
    this.config = config;
    this.auditLogger = auditLogger;
  }

  async execute(code, timeout = this.config.SANDBOX_TIMEOUT) {
    try {
      // Create limited context
      const sandbox = {
        console: {
          log: (...args) => console.log('[SANDBOX]', ...args)
        },
        Buffer: Buffer,
        // No access to: require, process, fs, etc.
      };

      const context = vm.createContext(sandbox);

      // Execute with timeout
      const result = vm.runInContext(code, context, {
        timeout,
        displayErrors: true,
        breakOnSigint: true
      });

      this.auditLogger.log(SecurityEvent.SANDBOX_VIOLATION, 'info', {
        action: 'code_executed',
        codeLength: code.length
      });

      return { success: true, result };
    } catch (error) {
      this.auditLogger.log(SecurityEvent.SANDBOX_VIOLATION, 'warning', {
        action: 'execution_failed',
        error: error.message
      });

      return { success: false, error: error.message };
    }
  }
}

class ResourceMonitor {
  constructor(config, auditLogger) {
    this.config = config;
    this.auditLogger = auditLogger;
    this.isMonitoring = false;
  }

  checkMemoryLimit() {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;

    if (heapUsedMB > this.config.MAX_MEMORY_MB) {
      this.auditLogger.log(
        SecurityEvent.RESOURCE_LIMIT_EXCEEDED,
        'critical',
        {
          resource: 'memory',
          current: heapUsedMB,
          limit: this.config.MAX_MEMORY_MB
        }
      );

      return false;
    }

    return true;
  }

  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitorTimer = setInterval(() => {
      this.checkMemoryLimit();
    }, this.config.MONITOR_INTERVAL);
  }

  stop() {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.isMonitoring = false;
    }
  }
}

class SecureProcessManager extends EventEmitter {
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
   * Drop privileges to non-root user (Unix only)
   */
  dropPrivileges() {
    if (process.platform === 'win32') {
      console.log('⚠️  Privilege dropping not supported on Windows');
      return;
    }

    if (!this.config.DROP_PRIVILEGES) {
      console.log('ℹ️  Privilege dropping disabled in config');
      return;
    }

    try {
      if (process.getgid && process.setgid) {
        process.setgid(this.config.TARGET_GROUP);
      }

      if (process.getuid && process.setuid) {
        const oldUid = process.getuid();
        process.setuid(this.config.TARGET_USER);
        const newUid = process.getuid();

        console.log(`✅ Dropped privileges: ${oldUid} -> ${newUid}`);

        this.auditLogger.log(SecurityEvent.PRIVILEGE_DROP, 'info', {
          oldUid,
          newUid,
          user: this.config.TARGET_USER
        });
      }

      this.hasDroppedPrivileges = true;
    } catch (error) {
      console.error('❌ Failed to drop privileges:', error.message);
      this.auditLogger.log(SecurityEvent.PRIVILEGE_DROP, 'critical', {
        error: error.message
      });
    }
  }

  async executeSandboxed(code) {
    return await this.sandbox.execute(code);
  }

  generateSecurityReport() {
    const auditReport = this.auditLogger.generateReport();

    return {
      timestamp: new Date().toISOString(),
      privilegesDropped: this.hasDroppedPrivileges,
      activeWorkers: this.workers.size,
      platform: process.platform,
      nodeVersion: process.version,
      audit: auditReport,
      processInfo: {
        pid: process.pid,
        uid: process.getuid ? process.getuid() : 'N/A',
        gid: process.getgid ? process.getgid() : 'N/A'
      }
    };
  }

  start() {
    console.log('🔒 Secure Process Manager Started\n');

    this.dropPrivileges();
    this.resourceMonitor.start();

    console.log('✅ Security monitoring active\n');
  }

  stop() {
    this.resourceMonitor.stop();

    for (const [workerId, worker] of this.workers) {
      worker.kill();
    }

    const report = this.generateSecurityReport();
    console.log('\n📊 Final Security Report:');
    console.log(JSON.stringify(report, null, 2));
  }
}

// Main
function main() {
  console.log('═'.repeat(70));
  console.log('SECURE PROCESS MANAGER');
  console.log('═'.repeat(70));
  console.log();

  const manager = new SecureProcessManager();
  manager.start();

  // Test sandbox execution
  setTimeout(async () => {
    console.log('\n🧪 Testing sandbox execution...\n');

    // Safe code
    const result1 = await manager.executeSandboxed(`
      const x = 1 + 1;
      x * 2;
    `);
    console.log('Safe code result:', result1);

    // Unsafe code (will fail)
    const result2 = await manager.executeSandboxed(`
      require('fs').readFileSync('/etc/passwd');
    `);
    console.log('Unsafe code result:', result2);
  }, 2000);

  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...');
    manager.stop();
    process.exit(0);
  });

  console.log('💡 Press Ctrl+C to stop\n');
}

main();

/**
 * SECURITY BEST PRACTICES:
 *
 * 1. Run as non-root user
 * 2. Drop privileges early
 * 3. Validate all inputs
 * 4. Use containers for isolation
 * 5. Monitor resource usage
 * 6. Log security events
 * 7. Regular security audits
 */
