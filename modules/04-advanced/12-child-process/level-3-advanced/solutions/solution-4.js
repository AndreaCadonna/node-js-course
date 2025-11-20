/**
 * Solution 4: Secure Command Executor
 *
 * Production-ready secure execution system with validation, whitelisting,
 * resource limits, audit logging, and threat detection.
 */

const { execFile } = require('child_process');
const path = require('path');
const { EventEmitter } = require('events');

class SecureExecutor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.allowedCommands = new Set(options.allowedCommands || []);
    this.allowedPaths = options.allowedPaths || [];
    this.maxExecutionTime = options.maxExecutionTime || 5000;
    this.maxOutputSize = options.maxOutputSize || 1024 * 1024;
    this.enableAuditLog = options.enableAuditLog !== false;
    this.rateLimits = options.rateLimits || {};

    this.auditLog = [];
    this.rateLimitTracking = new Map();
    this.blockedUsers = new Set();
  }

  async execute(request) {
    const executionId = this.generateId();
    const startTime = Date.now();

    const auditEntry = {
      id: executionId,
      command: request.command,
      args: request.args,
      user: request.user,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    this.logAudit(auditEntry);

    try {
      // Security checks
      this.checkRateLimit(request.user?.id, request.command);
      this.validateCommand(request.command);
      this.validateArguments(request.args);

      // Security analysis
      const threats = this.detectThreats(request.command, request.args);
      if (threats.length > 0) {
        throw new Error(`Security threat detected: ${threats[0].description}`);
      }

      // Execute
      const result = await this.executeWithLimits(
        request.command,
        request.args,
        request.options
      );

      auditEntry.status = 'success';
      auditEntry.duration = Date.now() - startTime;
      auditEntry.exitCode = result.exitCode;
      this.logAudit(auditEntry);

      return result;
    } catch (error) {
      auditEntry.status = 'failed';
      auditEntry.error = error.message;
      auditEntry.duration = Date.now() - startTime;
      this.logAudit(auditEntry);

      throw error;
    }
  }

  validateCommand(command) {
    if (this.allowedCommands.size > 0) {
      const cmdName = path.basename(command);
      if (!this.allowedCommands.has(cmdName)) {
        throw new Error(`Command not allowed: ${cmdName}`);
      }
    }

    const dangerous = [';', '|', '&', '$', '`', '\n', '>', '<'];
    if (dangerous.some(char => command.includes(char))) {
      throw new Error('Dangerous characters in command');
    }
  }

  validateArguments(args) {
    if (!Array.isArray(args)) {
      throw new Error('Arguments must be an array');
    }

    const dangerous = [';', '|', '&', '$', '`', '\n'];
    for (const arg of args) {
      if (typeof arg !== 'string') {
        throw new Error('All arguments must be strings');
      }

      if (dangerous.some(char => arg.includes(char))) {
        throw new Error(`Dangerous character in argument: ${arg}`);
      }

      if (arg.includes('..')) {
        throw new Error('Path traversal attempt detected');
      }
    }
  }

  validatePath(inputPath) {
    const resolved = path.resolve(inputPath);

    if (inputPath.includes('..')) {
      throw new Error('Path traversal attempt');
    }

    if (this.allowedPaths.length > 0) {
      const allowed = this.allowedPaths.some(allowedPath => {
        return resolved.startsWith(path.resolve(allowedPath));
      });

      if (!allowed) {
        throw new Error(`Path not allowed: ${resolved}`);
      }
    }

    return resolved;
  }

  checkRateLimit(userId, command) {
    if (!userId) return;

    const key = `${userId}:${command}`;
    const now = Date.now();
    const window = 60000; // 1 minute

    if (!this.rateLimitTracking.has(key)) {
      this.rateLimitTracking.set(key, []);
    }

    const timestamps = this.rateLimitTracking.get(key);

    // Remove old timestamps
    const recent = timestamps.filter(t => now - t < window);
    this.rateLimitTracking.set(key, recent);

    // Check limit
    const limit = this.rateLimits.perUser || 10;
    if (recent.length >= limit) {
      throw new Error('Rate limit exceeded');
    }

    recent.push(now);
  }

  executeWithLimits(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = execFile(command, args, {
        timeout: this.maxExecutionTime,
        maxBuffer: this.maxOutputSize,
        env: this.getSafeEnvironment(options.env),
        cwd: options.cwd || process.cwd()
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (stdout.length > this.maxOutputSize) {
          child.kill();
          reject(new Error('Output size limit exceeded'));
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code, signal) => {
        resolve({ exitCode: code, signal, stdout, stderr });
      });

      child.on('error', reject);
    });
  }

  getSafeEnvironment(customEnv = {}) {
    return {
      PATH: '/usr/bin:/bin',
      HOME: '/tmp',
      LANG: 'en_US.UTF-8'
    };
  }

  detectThreats(command, args) {
    const threats = [];
    const fullCommand = `${command} ${args.join(' ')}`;

    const patterns = [
      { regex: /;/, desc: 'Command chaining attempt' },
      { regex: /\|/, desc: 'Pipe detected' },
      { regex: /&/, desc: 'Background execution' },
      { regex: /\$\(/, desc: 'Command substitution' },
      { regex: /\.\./, desc: 'Path traversal' },
      { regex: /rm\s+-rf/, desc: 'Destructive command' }
    ];

    for (const { regex, desc } of patterns) {
      if (regex.test(fullCommand)) {
        threats.push({ pattern: regex.toString(), description: desc });
      }
    }

    return threats;
  }

  logAudit(entry) {
    if (this.enableAuditLog) {
      this.auditLog.push(entry);
      this.emit('audit', entry);
      console.log(`[AUDIT] ${entry.id}: ${entry.status} - ${entry.command}`);
    }
  }

  getAuditLog(filters = {}) {
    let log = this.auditLog;

    if (filters.user) {
      log = log.filter(e => e.user?.id === filters.user);
    }

    if (filters.status) {
      log = log.filter(e => e.status === filters.status);
    }

    return log;
  }

  getSecurityReport(timeRange = 3600000) {
    const cutoff = Date.now() - timeRange;
    const recentLog = this.auditLog.filter(e => {
      return new Date(e.timestamp).getTime() > cutoff;
    });

    return {
      totalExecutions: recentLog.length,
      successful: recentLog.filter(e => e.status === 'success').length,
      failed: recentLog.filter(e => e.status === 'failed').length,
      blockedUsers: this.blockedUsers.size,
      timeRange: timeRange
    };
  }

  blockUser(userId, reason) {
    this.blockedUsers.add(userId);
    this.logAudit({
      id: this.generateId(),
      type: 'user_blocked',
      userId,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

class CommandPolicy {
  constructor() {
    this.policies = new Map();
  }

  define(command, policy) {
    this.policies.set(command, policy);
  }

  validate(command, args, user) {
    const policy = this.policies.get(command);
    if (!policy) return true;

    if (policy.allowedUsers && !policy.allowedUsers.includes(user.id)) {
      throw new Error('User not authorized for this command');
    }

    if (policy.maxArgs && args.length > policy.maxArgs) {
      throw new Error('Too many arguments');
    }

    return true;
  }

  getPolicy(command) {
    return this.policies.get(command);
  }
}

module.exports = { SecureExecutor, CommandPolicy };
