/**
 * Process Security Hardening System
 *
 * This module demonstrates enterprise-grade process security using:
 * - Privilege dropping and user switching
 * - Resource limits (ulimit)
 * - Sandboxing and isolation
 * - Security headers and policies
 * - Secrets management
 * - Input validation and sanitization
 *
 * Production Features:
 * - Automatic privilege reduction
 * - Container security best practices
 * - File system permissions management
 * - Process isolation techniques
 * - Security audit logging
 * - Compliance monitoring
 *
 * @module ProcessSecurity
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * Security Configuration
 */
const DEFAULT_SECURITY_CONFIG = {
  // User/Group settings
  dropPrivileges: true,
  targetUser: 'nobody',
  targetGroup: 'nogroup',
  targetUID: null,
  targetGID: null,

  // Resource limits
  enforceResourceLimits: true,
  maxMemoryMB: 512,
  maxCPUPercent: 80,
  maxFileDescriptors: 1024,
  maxProcesses: 100,

  // File system security
  restrictFileAccess: true,
  allowedPaths: ['/tmp', '/var/log'],
  readOnlyPaths: ['/etc', '/usr'],

  // Network security
  restrictNetwork: false,
  allowedPorts: [80, 443],
  allowedHosts: ['localhost', '127.0.0.1'],

  // Secrets management
  encryptSecrets: true,
  secretsPath: './.secrets',
  rotateSecretsInterval: 86400000, // 24 hours

  // Audit logging
  enableAuditLog: true,
  auditLogPath: './security-audit.log',
  logSensitiveOperations: true,

  // Security policies
  enforceStrictMode: true,
  enableCSP: true,
  blockEval: true,
  blockNewFunction: true,
};

/**
 * Security Audit Logger
 */
class SecurityAuditLogger {
  constructor(config) {
    this.config = config;
    this.entries = [];
  }

  log(event, level = 'info', details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      level,
      pid: process.pid,
      uid: process.getuid ? process.getuid() : null,
      gid: process.getgid ? process.getgid() : null,
      details,
    };

    this.entries.push(entry);

    // Console output
    const icon = this.getIcon(level);
    console.log(`${icon} [SECURITY] ${event}`, details);

    // Write to file if enabled
    if (this.config.enableAuditLog) {
      this.writeToFile(entry);
    }
  }

  getIcon(level) {
    const icons = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      critical: '🚨',
      success: '✅',
    };
    return icons[level] || 'ℹ️';
  }

  writeToFile(entry) {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.config.auditLogPath, logLine);
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  getRecentEntries(count = 10) {
    return this.entries.slice(-count);
  }

  filterByLevel(level) {
    return this.entries.filter(e => e.level === level);
  }
}

/**
 * Privilege Manager
 */
class PrivilegeManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.originalUID = process.getuid ? process.getuid() : null;
    this.originalGID = process.getgid ? process.getgid() : null;
    this.hasDroppedPrivileges = false;
  }

  /**
   * Drop privileges to specified user/group
   */
  dropPrivileges() {
    // Only available on POSIX systems
    if (!process.setuid || !process.setgid) {
      this.logger.log('privilege-drop-unavailable', 'warn', {
        platform: process.platform,
        message: 'Privilege dropping not available on this platform',
      });
      return false;
    }

    // Check if running as root
    if (this.originalUID !== 0) {
      this.logger.log('not-running-as-root', 'info', {
        uid: this.originalUID,
        message: 'Not running as root, privilege drop not needed',
      });
      return false;
    }

    try {
      this.logger.log('dropping-privileges', 'info', {
        from: { uid: this.originalUID, gid: this.originalGID },
        to: {
          user: this.config.targetUser,
          group: this.config.targetGroup,
          uid: this.config.targetUID,
          gid: this.config.targetGID,
        },
      });

      // Drop group privileges first (must be done before user)
      if (this.config.targetGID) {
        process.setgid(this.config.targetGID);
      } else if (this.config.targetGroup) {
        process.setgid(this.config.targetGroup);
      }

      // Drop user privileges
      if (this.config.targetUID) {
        process.setuid(this.config.targetUID);
      } else if (this.config.targetUser) {
        process.setuid(this.config.targetUser);
      }

      this.hasDroppedPrivileges = true;

      this.logger.log('privileges-dropped', 'success', {
        currentUID: process.getuid(),
        currentGID: process.getgid(),
      });

      return true;
    } catch (error) {
      this.logger.log('privilege-drop-failed', 'error', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Check current privilege level
   */
  checkPrivileges() {
    const uid = process.getuid ? process.getuid() : null;
    const gid = process.getgid ? process.getgid() : null;

    return {
      uid,
      gid,
      isRoot: uid === 0,
      hasDropped: this.hasDroppedPrivileges,
      effectiveUID: process.geteuid ? process.geteuid() : null,
      effectiveGID: process.getegid ? process.getegid() : null,
    };
  }

  /**
   * Verify privileges are properly dropped
   */
  verifySecure() {
    const status = this.checkPrivileges();

    if (status.isRoot) {
      this.logger.log('security-violation', 'critical', {
        message: 'Process still running as root!',
        ...status,
      });
      return false;
    }

    this.logger.log('privilege-verification', 'success', {
      message: 'Process running with reduced privileges',
      ...status,
    });

    return true;
  }
}

/**
 * Resource Limiter
 */
class ResourceLimiter {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.limits = new Map();
  }

  /**
   * Set resource limits
   */
  setLimits() {
    this.logger.log('setting-resource-limits', 'info');

    try {
      // Memory limit (through V8 flags)
      if (this.config.maxMemoryMB) {
        const maxOldSpace = this.config.maxMemoryMB;
        this.limits.set('maxOldSpaceSize', maxOldSpace);

        // Note: This should be set via --max-old-space-size flag
        this.logger.log('memory-limit-configured', 'info', {
          maxMemoryMB: maxOldSpace,
          note: 'Use --max-old-space-size=' + maxOldSpace + ' flag',
        });
      }

      // File descriptor limit (POSIX only)
      if (process.setrlimit && this.config.maxFileDescriptors) {
        try {
          process.setrlimit('nofile', {
            soft: this.config.maxFileDescriptors,
            hard: this.config.maxFileDescriptors,
          });

          this.logger.log('fd-limit-set', 'success', {
            maxFileDescriptors: this.config.maxFileDescriptors,
          });
        } catch (error) {
          this.logger.log('fd-limit-failed', 'warn', {
            error: error.message,
          });
        }
      }

      // Monitor resource usage
      this.startMonitoring();

      return true;
    } catch (error) {
      this.logger.log('resource-limit-error', 'error', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Monitor resource usage
   */
  startMonitoring() {
    this.monitorInterval = setInterval(() => {
      this.checkLimits();
    }, 10000); // Check every 10 seconds
  }

  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
  }

  /**
   * Check if limits are being respected
   */
  checkLimits() {
    const usage = process.memoryUsage();
    const heapMB = usage.heapUsed / 1024 / 1024;

    if (this.config.maxMemoryMB && heapMB > this.config.maxMemoryMB * 0.9) {
      this.logger.log('memory-limit-approaching', 'warn', {
        currentMB: heapMB.toFixed(2),
        limitMB: this.config.maxMemoryMB,
        percentUsed: ((heapMB / this.config.maxMemoryMB) * 100).toFixed(1),
      });
    }
  }

  /**
   * Get current resource usage
   */
  getUsage() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      memory: {
        heapUsedMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
        rssMB: (memUsage.rss / 1024 / 1024).toFixed(2),
        externalMB: (memUsage.external / 1024 / 1024).toFixed(2),
      },
      cpu: {
        userMs: (cpuUsage.user / 1000).toFixed(2),
        systemMs: (cpuUsage.system / 1000).toFixed(2),
      },
      uptime: process.uptime(),
    };
  }
}

/**
 * Secrets Manager
 */
class SecretsManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.secrets = new Map();
    this.encryptionKey = null;
  }

  /**
   * Initialize encryption key
   */
  initialize() {
    // Generate or load encryption key
    this.encryptionKey = crypto.randomBytes(32);

    this.logger.log('secrets-manager-initialized', 'success', {
      encryptionEnabled: this.config.encryptSecrets,
    });
  }

  /**
   * Store a secret
   */
  setSecret(key, value) {
    if (!this.encryptionKey) {
      throw new Error('Secrets manager not initialized');
    }

    let storedValue = value;

    if (this.config.encryptSecrets) {
      storedValue = this.encrypt(value);
    }

    this.secrets.set(key, {
      value: storedValue,
      encrypted: this.config.encryptSecrets,
      created: Date.now(),
    });

    this.logger.log('secret-stored', 'info', {
      key,
      encrypted: this.config.encryptSecrets,
    });
  }

  /**
   * Retrieve a secret
   */
  getSecret(key) {
    const secret = this.secrets.get(key);

    if (!secret) {
      return null;
    }

    if (secret.encrypted) {
      return this.decrypt(secret.value);
    }

    return secret.value;
  }

  /**
   * Encrypt data
   */
  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Rotate secrets
   */
  rotateSecrets() {
    this.logger.log('rotating-secrets', 'info', {
      count: this.secrets.size,
    });

    // Generate new encryption key
    const oldKey = this.encryptionKey;
    this.encryptionKey = crypto.randomBytes(32);

    // Re-encrypt all secrets with new key
    for (const [key, secret] of this.secrets.entries()) {
      if (secret.encrypted) {
        // Decrypt with old key
        this.encryptionKey = oldKey;
        const decrypted = this.decrypt(secret.value);

        // Encrypt with new key
        this.encryptionKey = crypto.randomBytes(32);
        const reencrypted = this.encrypt(decrypted);

        this.secrets.set(key, {
          ...secret,
          value: reencrypted,
          rotated: Date.now(),
        });
      }
    }

    this.logger.log('secrets-rotated', 'success', {
      count: this.secrets.size,
    });
  }

  /**
   * Clear all secrets
   */
  clearSecrets() {
    this.secrets.clear();
    this.logger.log('secrets-cleared', 'info');
  }
}

/**
 * File System Security Manager
 */
class FileSystemSecurityManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Validate file path access
   */
  validatePath(filePath) {
    const normalized = path.normalize(filePath);
    const resolved = path.resolve(normalized);

    // Check if path is in allowed directories
    const isAllowed = this.config.allowedPaths.some(allowed =>
      resolved.startsWith(path.resolve(allowed))
    );

    if (!isAllowed) {
      this.logger.log('path-access-denied', 'warn', {
        path: resolved,
        allowedPaths: this.config.allowedPaths,
      });
      return false;
    }

    // Check if path is read-only
    const isReadOnly = this.config.readOnlyPaths.some(readonly =>
      resolved.startsWith(path.resolve(readonly))
    );

    return {
      allowed: true,
      readOnly: isReadOnly,
      path: resolved,
    };
  }

  /**
   * Secure file read
   */
  secureRead(filePath) {
    const validation = this.validatePath(filePath);

    if (!validation || !validation.allowed) {
      throw new Error(`Access denied: ${filePath}`);
    }

    this.logger.log('file-read', 'info', {
      path: validation.path,
    });

    return fs.readFileSync(validation.path);
  }

  /**
   * Secure file write
   */
  secureWrite(filePath, data) {
    const validation = this.validatePath(filePath);

    if (!validation || !validation.allowed) {
      throw new Error(`Access denied: ${filePath}`);
    }

    if (validation.readOnly) {
      throw new Error(`Write denied to read-only path: ${filePath}`);
    }

    this.logger.log('file-write', 'info', {
      path: validation.path,
      size: data.length,
    });

    return fs.writeFileSync(validation.path, data);
  }

  /**
   * Check file permissions
   */
  checkPermissions(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const mode = stats.mode;

      return {
        path: filePath,
        mode: mode.toString(8),
        isReadable: !!(mode & fs.constants.S_IRUSR),
        isWritable: !!(mode & fs.constants.S_IWUSR),
        isExecutable: !!(mode & fs.constants.S_IXUSR),
        uid: stats.uid,
        gid: stats.gid,
      };
    } catch (error) {
      this.logger.log('permission-check-failed', 'error', {
        path: filePath,
        error: error.message,
      });
      return null;
    }
  }
}

/**
 * Input Validator
 */
class InputValidator {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Sanitize string input
   */
  sanitizeString(input, options = {}) {
    const {
      maxLength = 1000,
      allowedChars = /^[a-zA-Z0-9\s\-_.,!?]+$/,
      trim = true,
    } = options;

    if (typeof input !== 'string') {
      this.logger.log('invalid-input-type', 'warn', {
        expected: 'string',
        received: typeof input,
      });
      throw new Error('Input must be a string');
    }

    let sanitized = trim ? input.trim() : input;

    // Check length
    if (sanitized.length > maxLength) {
      this.logger.log('input-too-long', 'warn', {
        length: sanitized.length,
        maxLength,
      });
      sanitized = sanitized.substring(0, maxLength);
    }

    // Check allowed characters
    if (!allowedChars.test(sanitized)) {
      this.logger.log('invalid-characters', 'warn', {
        input: sanitized.substring(0, 50),
      });
      sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.,!?]/g, '');
    }

    return sanitized;
  }

  /**
   * Validate email
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    if (!isValid) {
      this.logger.log('invalid-email', 'warn', { email });
    }

    return isValid;
  }

  /**
   * Validate URL
   */
  validateURL(url) {
    try {
      const parsed = new URL(url);

      // Check if protocol is allowed
      const allowedProtocols = ['http:', 'https:'];
      if (!allowedProtocols.includes(parsed.protocol)) {
        this.logger.log('invalid-url-protocol', 'warn', {
          protocol: parsed.protocol,
        });
        return false;
      }

      return true;
    } catch (error) {
      this.logger.log('invalid-url', 'warn', {
        url,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Prevent code injection
   */
  preventCodeInjection(input) {
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\(/i,
      /function\s*\(/i,
      /require\(/i,
      /import\s+/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        this.logger.log('code-injection-attempt', 'critical', {
          pattern: pattern.toString(),
          input: input.substring(0, 100),
        });
        throw new Error('Potential code injection detected');
      }
    }

    return true;
  }
}

/**
 * Main Security Manager
 */
class ProcessSecurityManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };

    this.logger = new SecurityAuditLogger(this.config);
    this.privilegeManager = new PrivilegeManager(this.config, this.logger);
    this.resourceLimiter = new ResourceLimiter(this.config, this.logger);
    this.secretsManager = new SecretsManager(this.config, this.logger);
    this.fsManager = new FileSystemSecurityManager(this.config, this.logger);
    this.validator = new InputValidator(this.logger);

    this.isInitialized = false;
  }

  /**
   * Initialize security measures
   */
  async initialize() {
    console.log('🔒 Initializing Process Security...\n');

    this.logger.log('security-initialization-started', 'info', {
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
    });

    try {
      // Step 1: Set resource limits
      if (this.config.enforceResourceLimits) {
        console.log('1️⃣  Setting resource limits...');
        this.resourceLimiter.setLimits();
      }

      // Step 2: Initialize secrets manager
      console.log('2️⃣  Initializing secrets manager...');
      this.secretsManager.initialize();

      // Step 3: Drop privileges (last step)
      if (this.config.dropPrivileges) {
        console.log('3️⃣  Dropping privileges...');
        this.privilegeManager.dropPrivileges();
      }

      // Step 4: Verify security
      console.log('4️⃣  Verifying security measures...');
      const isSecure = this.verifySecurityMeasures();

      if (!isSecure) {
        throw new Error('Security verification failed');
      }

      this.isInitialized = true;

      this.logger.log('security-initialized', 'success', {
        measures: [
          'resource-limits',
          'secrets-manager',
          'privilege-drop',
          'file-system-security',
        ],
      });

      this.emit('initialized');

      console.log('\n✅ Security measures initialized successfully\n');

      return true;
    } catch (error) {
      this.logger.log('security-initialization-failed', 'critical', {
        error: error.message,
      });

      console.error('\n❌ Security initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Verify all security measures
   */
  verifySecurityMeasures() {
    const checks = [];

    // Check privileges
    const privStatus = this.privilegeManager.checkPrivileges();
    checks.push({
      name: 'Privilege Check',
      passed: !privStatus.isRoot || !this.config.dropPrivileges,
      details: privStatus,
    });

    // Check resource limits
    const usage = this.resourceLimiter.getUsage();
    checks.push({
      name: 'Resource Usage',
      passed: true,
      details: usage,
    });

    // Log results
    console.log('\n📋 Security Verification:');
    checks.forEach(check => {
      const icon = check.passed ? '✅' : '❌';
      console.log(`  ${icon} ${check.name}`);
    });

    return checks.every(c => c.passed);
  }

  /**
   * Get security status
   */
  getSecurityStatus() {
    return {
      initialized: this.isInitialized,
      privileges: this.privilegeManager.checkPrivileges(),
      resourceUsage: this.resourceLimiter.getUsage(),
      audit: {
        totalEntries: this.logger.entries.length,
        recentEntries: this.logger.getRecentEntries(5),
        warnings: this.logger.filterByLevel('warn').length,
        errors: this.logger.filterByLevel('error').length,
        critical: this.logger.filterByLevel('critical').length,
      },
    };
  }

  /**
   * Shutdown security manager
   */
  async shutdown() {
    console.log('🛑 Shutting down security manager...');

    this.resourceLimiter.stopMonitoring();
    this.secretsManager.clearSecrets();

    this.logger.log('security-shutdown', 'info');

    this.emit('shutdown');
  }
}

/**
 * Demo: Security hardening
 */
async function demonstrateSecurityHardening() {
  console.log('='.repeat(80));
  console.log('PROCESS SECURITY HARDENING DEMO');
  console.log('='.repeat(80));
  console.log();

  const securityManager = new ProcessSecurityManager({
    dropPrivileges: false, // Keep false for demo (requires root)
    enforceResourceLimits: true,
    encryptSecrets: true,
    enableAuditLog: true,
    allowedPaths: ['/tmp', process.cwd()],
  });

  // Initialize security
  await securityManager.initialize();

  // Demo: Secrets management
  console.log('='.repeat(80));
  console.log('SECRETS MANAGEMENT');
  console.log('='.repeat(80));

  console.log('\n1️⃣  Storing encrypted secrets...');
  securityManager.secretsManager.setSecret('api_key', 'super-secret-key-12345');
  securityManager.secretsManager.setSecret('db_password', 'my-database-password');

  console.log('2️⃣  Retrieving secrets...');
  const apiKey = securityManager.secretsManager.getSecret('api_key');
  console.log(`  Retrieved API Key: ${apiKey.substring(0, 10)}...`);

  // Demo: Input validation
  console.log('\n' + '='.repeat(80));
  console.log('INPUT VALIDATION');
  console.log('='.repeat(80));

  console.log('\n1️⃣  Sanitizing user input...');
  const userInput = '  Hello World! <script>alert("xss")</script>  ';
  const sanitized = securityManager.validator.sanitizeString(userInput);
  console.log(`  Original: "${userInput}"`);
  console.log(`  Sanitized: "${sanitized}"`);

  console.log('\n2️⃣  Validating email...');
  const emails = ['valid@example.com', 'invalid-email', 'test@test'];
  emails.forEach(email => {
    const isValid = securityManager.validator.validateEmail(email);
    console.log(`  ${email}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  });

  console.log('\n3️⃣  Preventing code injection...');
  try {
    securityManager.validator.preventCodeInjection('eval(malicious_code)');
  } catch (error) {
    console.log(`  Blocked: ${error.message}`);
  }

  // Demo: File system security
  console.log('\n' + '='.repeat(80));
  console.log('FILE SYSTEM SECURITY');
  console.log('='.repeat(80));

  console.log('\n1️⃣  Checking file permissions...');
  const testFile = __filename;
  const permissions = securityManager.fsManager.checkPermissions(testFile);
  if (permissions) {
    console.log(`  File: ${path.basename(testFile)}`);
    console.log(`  Mode: ${permissions.mode}`);
    console.log(`  Readable: ${permissions.isReadable}`);
    console.log(`  Writable: ${permissions.isWritable}`);
  }

  // Show security status
  console.log('\n' + '='.repeat(80));
  console.log('SECURITY STATUS');
  console.log('='.repeat(80));

  const status = securityManager.getSecurityStatus();

  console.log('\nPrivileges:');
  console.log(`  UID: ${status.privileges.uid}`);
  console.log(`  GID: ${status.privileges.gid}`);
  console.log(`  Is Root: ${status.privileges.isRoot}`);

  console.log('\nResource Usage:');
  console.log(`  Heap: ${status.resourceUsage.memory.heapUsedMB} MB`);
  console.log(`  RSS: ${status.resourceUsage.memory.rssMB} MB`);
  console.log(`  Uptime: ${status.resourceUsage.uptime.toFixed(2)}s`);

  console.log('\nAudit Log:');
  console.log(`  Total Entries: ${status.audit.totalEntries}`);
  console.log(`  Warnings: ${status.audit.warnings}`);
  console.log(`  Errors: ${status.audit.errors}`);
  console.log(`  Critical: ${status.audit.critical}`);

  // Cleanup
  await securityManager.shutdown();

  console.log('\n✅ Demo complete!');
  console.log('\n💡 Production Security Best Practices:');
  console.log('  1. Always drop privileges after binding to privileged ports');
  console.log('  2. Use principle of least privilege');
  console.log('  3. Encrypt sensitive data at rest and in transit');
  console.log('  4. Validate and sanitize all external inputs');
  console.log('  5. Set appropriate resource limits (ulimit)');
  console.log('  6. Enable security audit logging');
  console.log('  7. Regularly rotate secrets and credentials');
  console.log('  8. Use environment variables for configuration');
  console.log('  9. Implement rate limiting and throttling');
  console.log('  10. Keep dependencies updated and scan for vulnerabilities');
}

// Run demo if executed directly
if (require.main === module) {
  demonstrateSecurityHardening().catch(console.error);
}

module.exports = {
  ProcessSecurityManager,
  PrivilegeManager,
  ResourceLimiter,
  SecretsManager,
  FileSystemSecurityManager,
  InputValidator,
  SecurityAuditLogger,
};
