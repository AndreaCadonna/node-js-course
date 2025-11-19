# Process Security

## Table of Contents
- [Introduction](#introduction)
- [Security Fundamentals](#security-fundamentals)
- [Privilege Management](#privilege-management)
- [Process Isolation](#process-isolation)
- [Sandboxing Techniques](#sandboxing-techniques)
- [Security Hardening](#security-hardening)
- [Container Security](#container-security)
- [Case Studies](#case-studies)
- [Best Practices](#best-practices)
- [Anti-Patterns](#anti-patterns)

## Introduction

Process security is critical for protecting Node.js applications from attacks and limiting the impact of security breaches. Proper security configuration reduces the attack surface and contains potential compromises.

### Security Principles

```javascript
/**
 * Core Security Principles for Node.js Processes
 *
 * 1. Least Privilege - Run with minimal permissions
 * 2. Defense in Depth - Multiple security layers
 * 3. Fail Secure - Safe defaults and error handling
 * 4. Separation of Concerns - Isolate sensitive operations
 * 5. Minimal Attack Surface - Reduce exposed functionality
 */

class SecurityPrinciples {
  static demonstrateLeastPrivilege() {
    console.log('=== Principle: Least Privilege ===');
    console.log('Run processes with minimal required permissions:');
    console.log('  - Non-root user');
    console.log('  - Restricted file system access');
    console.log('  - Limited network capabilities');
    console.log('  - Minimal environment variables');
    console.log();
  }

  static demonstrateDefenseInDepth() {
    console.log('=== Principle: Defense in Depth ===');
    console.log('Implement multiple security layers:');
    console.log('  - Process isolation');
    console.log('  - Network segmentation');
    console.log('  - Input validation');
    console.log('  - Output encoding');
    console.log('  - Monitoring and alerting');
    console.log();
  }

  static demonstrateFailSecure() {
    console.log('=== Principle: Fail Secure ===');
    console.log('Handle errors securely:');
    console.log('  - Default deny permissions');
    console.log('  - Secure error messages');
    console.log('  - Graceful degradation');
    console.log('  - Audit all failures');
    console.log();
  }
}

if (require.main === module) {
  SecurityPrinciples.demonstrateLeastPrivilege();
  SecurityPrinciples.demonstrateDefenseInDepth();
  SecurityPrinciples.demonstrateFailSecure();
}
```

## Security Fundamentals

### Process User and Permissions

```javascript
/**
 * Managing process user and permissions
 */

const fs = require('fs');
const path = require('path');

class ProcessSecurity {
  /**
   * Drop privileges after startup
   */
  static dropPrivileges(targetUser = 'node', targetGroup = 'node') {
    // This requires starting as root (not recommended)
    // Only use during initialization if necessary

    if (process.getuid && process.getuid() === 0) {
      console.log('Running as root, dropping privileges...');

      try {
        // Set group first (must be done before user)
        if (process.setgid) {
          process.setgid(targetGroup);
          console.log(`Changed group to: ${targetGroup}`);
        }

        // Set user
        if (process.setuid) {
          process.setuid(targetUser);
          console.log(`Changed user to: ${targetUser}`);
        }

        console.log('Privileges dropped successfully');
        console.log(`Current UID: ${process.getuid()}`);
        console.log(`Current GID: ${process.getgid()}`);
      } catch (error) {
        console.error('Failed to drop privileges:', error);
        process.exit(1);
      }
    } else {
      console.log('Not running as root, no privilege drop needed');
    }
  }

  /**
   * Check if running with elevated privileges
   */
  static checkPrivileges() {
    const uid = process.getuid ? process.getuid() : null;
    const gid = process.getgid ? process.getgid() : null;

    return {
      isRoot: uid === 0,
      uid,
      gid,
      euid: process.geteuid ? process.geteuid() : null,
      egid: process.getegid ? process.getegid() : null,
      groups: process.getgroups ? process.getgroups() : null
    };
  }

  /**
   * Verify file permissions
   */
  static verifyFilePermissions(filepath, expectedMode = 0o600) {
    try {
      const stats = fs.statSync(filepath);
      const mode = stats.mode & parseInt('777', 8);

      if (mode !== expectedMode) {
        console.warn(`File permissions incorrect: ${filepath}`);
        console.warn(`  Expected: ${expectedMode.toString(8)}`);
        console.warn(`  Actual: ${mode.toString(8)}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Failed to check file permissions: ${filepath}`, error);
      return false;
    }
  }

  /**
   * Set secure file permissions
   */
  static setSecurePermissions(filepath, mode = 0o600) {
    try {
      fs.chmodSync(filepath, mode);
      console.log(`Set permissions for ${filepath} to ${mode.toString(8)}`);
      return true;
    } catch (error) {
      console.error(`Failed to set permissions: ${filepath}`, error);
      return false;
    }
  }

  /**
   * Create secure directory
   */
  static createSecureDirectory(dirpath, mode = 0o700) {
    try {
      if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath, { recursive: true, mode });
        console.log(`Created secure directory: ${dirpath}`);
      }

      // Verify permissions
      const stats = fs.statSync(dirpath);
      const actualMode = stats.mode & parseInt('777', 8);

      if (actualMode !== mode) {
        fs.chmodSync(dirpath, mode);
      }

      return true;
    } catch (error) {
      console.error(`Failed to create secure directory: ${dirpath}`, error);
      return false;
    }
  }
}

// Example usage
if (require.main === module) {
  console.log('=== Process Security Check ===\n');

  const privileges = ProcessSecurity.checkPrivileges();
  console.log('Current privileges:', JSON.stringify(privileges, null, 2));

  if (privileges.isRoot) {
    console.warn('\nWARNING: Running as root is not recommended!');
    console.log('Consider dropping privileges after initialization.\n');

    // Example: Drop privileges (uncomment to use)
    // ProcessSecurity.dropPrivileges('node', 'node');
  }

  // Verify sensitive files
  const sensitiveFiles = [
    '.env',
    'config/secrets.json',
    'private.key'
  ];

  console.log('\n=== Checking File Permissions ===\n');
  sensitiveFiles.forEach(file => {
    if (fs.existsSync(file)) {
      ProcessSecurity.verifyFilePermissions(file, 0o600);
    }
  });
}
```

### Environment Variable Security

```javascript
/**
 * Secure environment variable handling
 */

class EnvironmentSecurity {
  /**
   * Validate required environment variables
   */
  static validateEnvironment(requiredVars) {
    const missing = [];
    const invalid = [];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return true;
  }

  /**
   * Sanitize environment variables
   */
  static sanitizeEnvironment(allowedVars) {
    const sanitized = {};

    for (const varName of allowedVars) {
      if (process.env[varName]) {
        sanitized[varName] = process.env[varName];
      }
    }

    return sanitized;
  }

  /**
   * Remove sensitive variables from child processes
   */
  static getSecureEnv(sensitivePrefixes = ['SECRET_', 'API_KEY_', 'PASSWORD_']) {
    const secureEnv = { ...process.env };

    // Remove sensitive variables
    Object.keys(secureEnv).forEach(key => {
      if (sensitivePrefixes.some(prefix => key.startsWith(prefix))) {
        delete secureEnv[key];
      }
    });

    return secureEnv;
  }

  /**
   * Mask sensitive environment variables in logs
   */
  static maskSensitiveVars(envVars, sensitivePrefixes = ['SECRET_', 'API_KEY_', 'PASSWORD_']) {
    const masked = {};

    Object.entries(envVars).forEach(([key, value]) => {
      if (sensitivePrefixes.some(prefix => key.startsWith(prefix))) {
        masked[key] = '***REDACTED***';
      } else {
        masked[key] = value;
      }
    });

    return masked;
  }

  /**
   * Validate environment variable format
   */
  static validateFormat(varName, pattern) {
    const value = process.env[varName];

    if (!value) {
      throw new Error(`Environment variable ${varName} is not set`);
    }

    if (!pattern.test(value)) {
      throw new Error(`Environment variable ${varName} has invalid format`);
    }

    return value;
  }

  /**
   * Load environment from encrypted file
   */
  static loadEncryptedEnv(filepath, decryptionKey) {
    const crypto = require('crypto');
    const fs = require('fs');

    try {
      const encrypted = fs.readFileSync(filepath, 'utf8');
      const [iv, data] = encrypted.split(':');

      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(decryptionKey, 'hex'),
        Buffer.from(iv, 'hex')
      );

      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const env = JSON.parse(decrypted);

      // Merge into process.env
      Object.assign(process.env, env);

      console.log('Environment loaded from encrypted file');
      return true;
    } catch (error) {
      console.error('Failed to load encrypted environment:', error);
      return false;
    }
  }
}

// Example usage
const requiredVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'API_KEY'
];

try {
  EnvironmentSecurity.validateEnvironment(requiredVars);
  console.log('Environment validation passed');

  // Log environment (masked)
  const maskedEnv = EnvironmentSecurity.maskSensitiveVars(process.env);
  console.log('Environment variables:', maskedEnv);

  // Validate specific format
  const dbUrl = EnvironmentSecurity.validateFormat(
    'DATABASE_URL',
    /^postgresql:\/\/.+/
  );

} catch (error) {
  console.error('Environment validation failed:', error.message);
  process.exit(1);
}
```

## Privilege Management

### Capability-Based Security

```javascript
/**
 * Linux capabilities for fine-grained privilege control
 */

const { spawn } = require('child_process');

class CapabilityManagement {
  /**
   * Run process with specific capabilities
   *
   * Common capabilities:
   * - CAP_NET_BIND_SERVICE: Bind to ports < 1024
   * - CAP_NET_RAW: Use RAW and PACKET sockets
   * - CAP_SYS_ADMIN: Various admin operations
   * - CAP_SYS_TIME: Set system clock
   */
  static runWithCapabilities(script, capabilities = []) {
    // Use setcap to grant capabilities
    const capString = capabilities.join(',');

    console.log(`Running with capabilities: ${capString}`);

    // This requires the binary to have capabilities set:
    // sudo setcap 'cap_net_bind_service=+ep' /usr/bin/node

    const proc = spawn('node', [script], {
      stdio: 'inherit',
      env: process.env
    });

    return proc;
  }

  /**
   * Check current capabilities
   */
  static getCurrentCapabilities() {
    const { execSync } = require('child_process');

    try {
      const output = execSync(`getpcaps ${process.pid}`, { encoding: 'utf8' });
      return output.trim();
    } catch (error) {
      console.error('Failed to get capabilities:', error.message);
      return null;
    }
  }

  /**
   * Generate setcap command
   */
  static generateSetcapCommand(nodePath = '/usr/bin/node', capabilities = ['cap_net_bind_service']) {
    const capString = capabilities.map(cap => `${cap}=+ep`).join(' ');
    return `sudo setcap '${capString}' ${nodePath}`;
  }

  /**
   * Verify capabilities are set
   */
  static verifyCapabilities(nodePath = '/usr/bin/node') {
    const { execSync } = require('child_process');

    try {
      const output = execSync(`getcap ${nodePath}`, { encoding: 'utf8' });
      console.log(`Capabilities for ${nodePath}:`, output.trim());
      return true;
    } catch (error) {
      console.error('Failed to verify capabilities:', error.message);
      return false;
    }
  }
}

// Example: Bind to port 80 without root
if (require.main === module) {
  console.log('=== Capability Management ===\n');

  // Check current capabilities
  const caps = CapabilityManagement.getCurrentCapabilities();
  console.log('Current capabilities:', caps);

  // Generate setcap command
  const setcapCmd = CapabilityManagement.generateSetcapCommand(
    process.execPath,
    ['cap_net_bind_service']
  );

  console.log('\nTo bind to port 80 without root, run:');
  console.log(setcapCmd);
  console.log('\nThen start your server normally (without sudo)');
}
```

### Secure Child Process Spawning

```javascript
/**
 * Secure child process execution
 */

const { spawn } = require('child_process');
const path = require('path');

class SecureChildProcess {
  /**
   * Spawn child process with security constraints
   */
  static spawnSecure(command, args = [], options = {}) {
    // Security defaults
    const secureOptions = {
      // Don't inherit all environment variables
      env: options.env || EnvironmentSecurity.getSecureEnv(),

      // Set working directory
      cwd: options.cwd || process.cwd(),

      // Don't create shell
      shell: false,

      // Timeout
      timeout: options.timeout || 30000,

      // UID/GID
      ...(options.uid && { uid: options.uid }),
      ...(options.gid && { gid: options.gid }),

      // Stdio
      stdio: options.stdio || 'pipe'
    };

    // Validate command path
    if (path.isAbsolute(command) === false && !options.allowRelative) {
      throw new Error('Command must be absolute path for security');
    }

    console.log(`Spawning secure child process: ${command} ${args.join(' ')}`);

    const proc = spawn(command, args, secureOptions);

    // Enforce timeout
    const timeout = setTimeout(() => {
      console.error('Child process timeout, killing...');
      proc.kill('SIGKILL');
    }, secureOptions.timeout);

    proc.on('exit', () => {
      clearTimeout(timeout);
    });

    return proc;
  }

  /**
   * Execute command with input validation
   */
  static execSafe(command, args = [], options = {}) {
    // Validate command
    if (!this.isCommandAllowed(command, options.allowedCommands)) {
      throw new Error(`Command not allowed: ${command}`);
    }

    // Validate arguments
    args.forEach(arg => {
      if (!this.isArgumentSafe(arg)) {
        throw new Error(`Unsafe argument detected: ${arg}`);
      }
    });

    return this.spawnSecure(command, args, options);
  }

  /**
   * Check if command is in allowlist
   */
  static isCommandAllowed(command, allowedCommands = []) {
    if (allowedCommands.length === 0) {
      console.warn('No command allowlist specified');
      return true;
    }

    return allowedCommands.includes(command);
  }

  /**
   * Validate argument safety
   */
  static isArgumentSafe(arg) {
    // Check for command injection attempts
    const dangerous = [
      ';', '|', '&', '$', '`', '\n', '\r',
      '$(', '${', '>', '<', '*', '?'
    ];

    return !dangerous.some(char => arg.includes(char));
  }

  /**
   * Create sandboxed environment
   */
  static createSandbox(options = {}) {
    const tmpDir = require('os').tmpdir();
    const sandboxDir = path.join(tmpDir, `sandbox-${Date.now()}`);

    require('fs').mkdirSync(sandboxDir, { recursive: true, mode: 0o700 });

    return {
      dir: sandboxDir,
      env: {
        HOME: sandboxDir,
        TMPDIR: sandboxDir,
        PATH: '/usr/bin:/bin',
        ...options.extraEnv
      },
      cleanup: () => {
        require('fs').rmSync(sandboxDir, { recursive: true, force: true });
      }
    };
  }
}

// Example usage
if (require.main === module) {
  // Safe command execution
  const allowedCommands = ['/usr/bin/ls', '/usr/bin/cat'];

  try {
    const proc = SecureChildProcess.execSafe(
      '/usr/bin/ls',
      ['-la', '/tmp'],
      {
        allowedCommands,
        timeout: 5000
      }
    );

    proc.stdout.on('data', (data) => {
      console.log(`Output: ${data}`);
    });

    proc.on('exit', (code) => {
      console.log(`Process exited with code ${code}`);
    });

  } catch (error) {
    console.error('Failed to execute command:', error.message);
  }

  // Sandboxed execution
  const sandbox = SecureChildProcess.createSandbox();

  try {
    console.log(`Created sandbox: ${sandbox.dir}`);

    const proc = SecureChildProcess.spawnSecure(
      '/usr/bin/node',
      ['-e', 'console.log("Sandboxed execution")'],
      {
        cwd: sandbox.dir,
        env: sandbox.env
      }
    );

    proc.on('exit', () => {
      sandbox.cleanup();
      console.log('Sandbox cleaned up');
    });

  } catch (error) {
    sandbox.cleanup();
    console.error('Sandbox execution failed:', error);
  }
}
```

## Process Isolation

### Worker Thread Isolation

```javascript
/**
 * Isolate sensitive operations in worker threads
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

class IsolatedWorker {
  /**
   * Run sensitive operation in isolated worker
   */
  static async runIsolated(operation, data, options = {}) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: { operation, data },
        resourceLimits: {
          maxOldGenerationSizeMb: options.maxMemoryMb || 512,
          maxYoungGenerationSizeMb: options.maxYoungMemoryMb || 128
        }
      });

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error('Worker timeout'));
      }, options.timeout || 30000);

      worker.on('message', (result) => {
        clearTimeout(timeout);
        resolve(result);
      });

      worker.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      worker.on('exit', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(`Worker exited with code ${code}`));
        }
      });
    });
  }
}

// Worker thread code
if (!isMainThread) {
  const { operation, data } = workerData;

  try {
    let result;

    switch (operation) {
      case 'processPayment':
        result = processPayment(data);
        break;

      case 'encryptData':
        result = encryptData(data);
        break;

      case 'validateInput':
        result = validateInput(data);
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    parentPort.postMessage(result);
  } catch (error) {
    throw error; // Will be caught by error event
  }

  process.exit(0);
}

// Mock operations (implement actual logic)
function processPayment(data) {
  return { success: true, transactionId: 'txn_123' };
}

function encryptData(data) {
  const crypto = require('crypto');
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return { encrypted, key: key.toString('hex'), iv: iv.toString('hex') };
}

function validateInput(data) {
  // Validation logic
  return { valid: true };
}

// Example usage (main thread)
if (require.main === module && isMainThread) {
  (async () => {
    try {
      // Process sensitive operation in isolated worker
      const result = await IsolatedWorker.runIsolated(
        'processPayment',
        { amount: 100, currency: 'USD' },
        { timeout: 10000, maxMemoryMb: 256 }
      );

      console.log('Payment result:', result);

    } catch (error) {
      console.error('Isolated operation failed:', error);
    }
  })();
}
```

## Sandboxing Techniques

### VM-Based Sandboxing

```javascript
/**
 * Sandbox untrusted code using Node.js VM module
 */

const vm = require('vm');

class CodeSandbox {
  constructor(options = {}) {
    this.timeout = options.timeout || 5000;
    this.memoryLimit = options.memoryLimit || 100 * 1024 * 1024; // 100MB
  }

  /**
   * Execute code in sandbox
   */
  execute(code, context = {}) {
    // Create restricted context
    const sandbox = {
      console: {
        log: (...args) => console.log('[Sandbox]', ...args),
        error: (...args) => console.error('[Sandbox]', ...args)
      },
      Buffer: Buffer,
      setTimeout: null,  // Disabled
      setInterval: null, // Disabled
      require: null,     // Disabled
      process: null,     // Disabled
      ...context
    };

    try {
      const script = new vm.Script(code, {
        filename: 'sandbox.js',
        lineOffset: 0,
        columnOffset: 0
      });

      const result = script.runInNewContext(sandbox, {
        timeout: this.timeout,
        displayErrors: true
      });

      return { success: true, result };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Execute async code
   */
  async executeAsync(code, context = {}) {
    return new Promise((resolve, reject) => {
      const sandbox = {
        console: {
          log: (...args) => console.log('[Sandbox]', ...args)
        },
        done: (result) => {
          resolve({ success: true, result });
        },
        error: (error) => {
          resolve({ success: false, error: error.message });
        },
        ...context
      };

      const wrappedCode = `
        (async () => {
          try {
            ${code}
          } catch (error) {
            error(error);
          }
        })();
      `;

      try {
        const script = new vm.Script(wrappedCode);
        script.runInNewContext(sandbox, { timeout: this.timeout });

        // Enforce timeout
        setTimeout(() => {
          resolve({ success: false, error: 'Timeout' });
        }, this.timeout);

      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  /**
   * Validate code before execution
   */
  validateCode(code) {
    const dangerous = [
      'eval',
      'Function',
      'require',
      'process',
      '__dirname',
      '__filename',
      'module',
      'exports'
    ];

    const found = dangerous.filter(keyword => code.includes(keyword));

    if (found.length > 0) {
      return {
        valid: false,
        reason: `Dangerous keywords found: ${found.join(', ')}`
      };
    }

    return { valid: true };
  }
}

// Example usage
if (require.main === module) {
  const sandbox = new CodeSandbox({
    timeout: 5000
  });

  // Example 1: Safe code
  console.log('=== Example 1: Safe Code ===');
  const safeCode = `
    const x = 10;
    const y = 20;
    console.log('Sum:', x + y);
    x + y
  `;

  const result1 = sandbox.execute(safeCode);
  console.log('Result:', result1);

  // Example 2: Dangerous code
  console.log('\n=== Example 2: Dangerous Code ===');
  const dangerousCode = `
    require('fs').readFileSync('/etc/passwd')
  `;

  const validation = sandbox.validateCode(dangerousCode);
  console.log('Validation:', validation);

  if (validation.valid) {
    const result2 = sandbox.execute(dangerousCode);
    console.log('Result:', result2);
  }

  // Example 3: Infinite loop protection
  console.log('\n=== Example 3: Infinite Loop ===');
  const infiniteLoop = `
    while(true) {
      // Infinite loop
    }
  `;

  const result3 = sandbox.execute(infiniteLoop);
  console.log('Result:', result3);
}
```

## Security Hardening

### Security Headers and Configuration

```javascript
/**
 * Security hardening configuration
 */

const express = require('express');
const helmet = require('helmet');

class SecurityHardening {
  /**
   * Apply security headers
   */
  static applySecurityHeaders(app) {
    // Use Helmet for security headers
    app.use(helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },

      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },

      // X-Frame-Options
      frameguard: {
        action: 'deny'
      },

      // X-Content-Type-Options
      noSniff: true,

      // X-XSS-Protection
      xssFilter: true,

      // Referrer-Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
      },

      // Permissions-Policy
      permittedCrossDomainPolicies: {
        permittedPolicies: 'none'
      }
    }));

    // Additional security headers
    app.use((req, res, next) => {
      // Remove server identification
      res.removeHeader('X-Powered-By');

      // Add custom security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      next();
    });
  }

  /**
   * Configure process limits
   */
  static configureProcessLimits() {
    // Set max event listeners
    require('events').EventEmitter.defaultMaxListeners = 20;

    // Set max HTTP header size
    if (process.env.NODE_OPTIONS) {
      console.log('NODE_OPTIONS:', process.env.NODE_OPTIONS);
    } else {
      console.log('Consider setting NODE_OPTIONS=--max-http-header-size=16384');
    }

    // Memory limits (requires starting with flags)
    console.log('Memory limits:');
    console.log('  --max-old-space-size=2048 (2GB heap)');
    console.log('  --max-semi-space-size=64 (64MB)');
  }

  /**
   * Setup rate limiting
   */
  static setupRateLimiting(app) {
    const rateLimit = require('express-rate-limit');

    // General rate limit
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false
    });

    app.use('/api/', limiter);

    // Strict rate limit for authentication
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      skipSuccessfulRequests: true,
      message: 'Too many authentication attempts'
    });

    app.use('/auth/', authLimiter);
  }

  /**
   * Input validation and sanitization
   */
  static setupInputValidation(app) {
    const { body, validationResult } = require('express-validator');

    // Example validation middleware
    app.post('/api/user',
      body('email').isEmail().normalizeEmail(),
      body('password').isLength({ min: 8 }).trim().escape(),
      body('name').trim().escape(),
      (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        // Process validated data
        res.json({ success: true });
      }
    );
  }

  /**
   * Setup security monitoring
   */
  static setupSecurityMonitoring() {
    // Log security events
    process.on('warning', (warning) => {
      console.warn('Security warning:', warning.name, warning.message);
    });

    // Monitor for suspicious activity
    const suspiciousPatterns = [
      /eval\(/,
      /Function\(/,
      /__proto__/,
      /constructor\[/
    ];

    return (req, res, next) => {
      const body = JSON.stringify(req.body);
      const query = JSON.stringify(req.query);

      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(body) || pattern.test(query)) {
          console.error('SECURITY: Suspicious input detected', {
            ip: req.ip,
            path: req.path,
            pattern: pattern.toString()
          });
        }
      });

      next();
    };
  }
}

// Example application with security hardening
if (require.main === module) {
  const app = express();

  // Parse JSON bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Apply security hardening
  SecurityHardening.applySecurityHeaders(app);
  SecurityHardening.setupRateLimiting(app);
  SecurityHardening.configureProcessLimits();

  // Security monitoring
  app.use(SecurityHardening.setupSecurityMonitoring());

  // Routes
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  app.listen(3000, () => {
    console.log('Hardened server running on port 3000');
  });
}
```

## Container Security

### Docker Security Best Practices

```javascript
/**
 * Dockerfile security best practices
 */

class DockerSecurity {
  /**
   * Generate secure Dockerfile
   */
  static generateSecureDockerfile() {
    return `
# Use specific version (not 'latest')
FROM node:18.17.1-alpine3.18 AS base

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \\
    npm cache clean --force

# Copy application files
COPY --chown=nodejs:nodejs . .

# Remove unnecessary files
RUN rm -rf .git .gitignore .dockerignore

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \\
  CMD node healthcheck.js || exit 1

# Run application
CMD ["node", "server.js"]
`.trim();
  }

  /**
   * Generate docker-compose with security settings
   */
  static generateSecureDockerCompose() {
    return `
version: '3.8'

services:
  app:
    image: my-app:latest

    # Run as non-root user
    user: "1001:1001"

    # Security options
    security_opt:
      - no-new-privileges:true

    # Read-only root filesystem
    read_only: true

    # Tmpfs for temporary files
    tmpfs:
      - /tmp:size=100M,mode=1777
      - /app/logs:size=100M,mode=1777

    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

    # Restart policy
    restart: unless-stopped

    # Capabilities (drop all, add only needed)
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE

    # Environment
    environment:
      - NODE_ENV=production
      - PORT=3000

    # Health check
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s

    ports:
      - "3000:3000"

    volumes:
      - ./config:/app/config:ro

    networks:
      - app-network

networks:
  app-network:
    driver: bridge
`.trim();
  }

  /**
   * Generate .dockerignore
   */
  static generateDockerignore() {
    return `
# Git
.git
.gitignore
.gitattributes

# CI/CD
.github
.gitlab-ci.yml
.travis.yml

# Documentation
README.md
CONTRIBUTING.md
docs/

# Tests
test/
tests/
**/*.test.js
**/*.spec.js
coverage/

# Development
.env
.env.local
.env.*.local
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Node
node_modules/
npm-debug.log

# Build
dist/
build/
`.trim();
  }

  /**
   * Container security scanning
   */
  static getSecurityScanCommands() {
    return {
      trivy: 'trivy image my-app:latest',
      grype: 'grype my-app:latest',
      snyk: 'snyk container test my-app:latest',
      clair: 'clairctl analyze my-app:latest'
    };
  }
}

// Print Docker security configuration
if (require.main === module) {
  console.log('=== Secure Dockerfile ===\n');
  console.log(DockerSecurity.generateSecureDockerfile());

  console.log('\n\n=== Secure docker-compose.yml ===\n');
  console.log(DockerSecurity.generateSecureDockerCompose());

  console.log('\n\n=== .dockerignore ===\n');
  console.log(DockerSecurity.generateDockerignore());

  console.log('\n\n=== Security Scanning Commands ===\n');
  const scanCommands = DockerSecurity.getSecurityScanCommands();
  Object.entries(scanCommands).forEach(([tool, command]) => {
    console.log(`${tool}: ${command}`);
  });
}
```

## Case Studies

### Case Study 1: Privilege Escalation Prevention

```javascript
/**
 * CASE STUDY: Preventing Privilege Escalation
 *
 * Problem: Application running as root in container
 * Impact: Container breakout vulnerability, full system access if compromised
 * Root Cause: Default Dockerfile ran as root user
 * Solution: Created non-root user, dropped capabilities, read-only filesystem
 */

// BEFORE: Running as root
const dockerfileBefore = `
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "server.js"]
`;

// AFTER: Non-root user with minimal privileges
const dockerfileAfter = `
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --chown=nodejs:nodejs . .
USER nodejs
CMD ["node", "server.js"]
`;

/**
 * Results:
 * - No root access in container
 * - Limited damage from container compromise
 * - Passed security audit
 * - Compliance requirements met
 */
```

## Best Practices

```javascript
/**
 * Process Security Best Practices
 */

const SECURITY_BEST_PRACTICES = {
  privileges: [
    'Run as non-root user',
    'Drop unnecessary capabilities',
    'Use principle of least privilege',
    'Implement privilege separation',
    'Validate all inputs',
    'Sanitize outputs'
  ],

  isolation: [
    'Use containers for isolation',
    'Implement process sandboxing',
    'Separate sensitive operations',
    'Use worker threads for untrusted code',
    'Implement resource limits',
    'Use security profiles (AppArmor/SELinux)'
  ],

  configuration: [
    'Remove server identification headers',
    'Implement rate limiting',
    'Use security headers (CSP, HSTS, etc.)',
    'Configure CORS properly',
    'Disable unnecessary features',
    'Use secure defaults'
  ],

  monitoring: [
    'Log security events',
    'Monitor for suspicious activity',
    'Implement intrusion detection',
    'Track failed authentication attempts',
    'Alert on security violations',
    'Regular security audits'
  ],

  updates: [
    'Keep dependencies updated',
    'Use npm audit regularly',
    'Monitor security advisories',
    'Implement automated updates',
    'Test updates in staging',
    'Have incident response plan'
  ]
};

console.log('Process Security Best Practices:\n');
Object.entries(SECURITY_BEST_PRACTICES).forEach(([category, practices]) => {
  console.log(`${category.toUpperCase()}:`);
  practices.forEach(practice => console.log(`  - ${practice}`));
  console.log();
});
```

## Anti-Patterns

```javascript
/**
 * Security Anti-Patterns to Avoid
 */

// ANTI-PATTERN 1: Running as root
// BAD
// Running entire application as root user

// GOOD
// Drop privileges or use non-root user from start

// ANTI-PATTERN 2: Trusting user input
// BAD
const { exec } = require('child_process');
app.post('/run', (req, res) => {
  exec(`ls ${req.body.path}`, (error, stdout) => {
    res.send(stdout);
  });
});

// GOOD
const { execFile } = require('child_process');
app.post('/run', (req, res) => {
  const allowedPaths = ['/tmp', '/var/log'];
  if (!allowedPaths.includes(req.body.path)) {
    return res.status(400).send('Invalid path');
  }
  execFile('ls', [req.body.path], (error, stdout) => {
    res.send(stdout);
  });
});

// ANTI-PATTERN 3: Exposing sensitive information
// BAD
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.stack,
    env: process.env
  });
});

// GOOD
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

// ANTI-PATTERN 4: No resource limits
// BAD
// No limits on memory, CPU, file descriptors

// GOOD
// Set limits in Docker, Kubernetes, or process manager

// ANTI-PATTERN 5: Using eval or Function constructor
// BAD
const userCode = req.body.code;
eval(userCode);

// GOOD
// Use VM module with proper sandboxing
const sandbox = new CodeSandbox();
sandbox.execute(userCode);
```

## Conclusion

Process security requires a defense-in-depth approach:

1. **Least Privilege** - Minimal permissions always
2. **Isolation** - Separate sensitive operations
3. **Validation** - Never trust input
4. **Monitoring** - Detect and respond to threats
5. **Updates** - Keep dependencies current

**Key Takeaways:**
- Never run as root
- Validate all inputs
- Implement proper isolation
- Use security headers
- Monitor for suspicious activity
- Keep dependencies updated
- Test security controls
- Have incident response plan

**Remember:**
- Security is not optional
- Defense in depth is essential
- Regular audits are critical
- Assume breach mentality
- Security is everyone's responsibility
