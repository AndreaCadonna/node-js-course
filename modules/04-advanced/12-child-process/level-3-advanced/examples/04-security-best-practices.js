/**
 * Example 4: Security Best Practices
 *
 * Demonstrates secure patterns for child process execution:
 * - Command sanitization and validation
 * - Whitelisting allowed commands
 * - Resource limits (CPU, memory, time)
 * - Input validation
 * - Audit logging
 * - Sandboxing strategies
 */

const { spawn, execFile } = require('child_process');
const path = require('path');
const { EventEmitter } = require('events');

console.log('=== Security Best Practices Example ===\n');

/**
 * SecureCommandExecutor - Executes commands with security controls
 */
class SecureCommandExecutor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      allowedCommands: options.allowedCommands || [],
      allowedPaths: options.allowedPaths || [],
      maxExecutionTime: options.maxExecutionTime || 5000,
      maxOutputSize: options.maxOutputSize || 1024 * 1024, // 1MB
      enableAuditLog: options.enableAuditLog !== false,
      ...options
    };

    this.auditLog = [];
  }

  /**
   * Execute a command securely
   */
  async executeCommand(command, args = [], options = {}) {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    // Audit log entry
    const auditEntry = {
      id: executionId,
      command,
      args,
      timestamp: new Date().toISOString(),
      user: options.user || 'unknown',
      status: 'pending'
    };

    this.logAudit(auditEntry);

    try {
      // Validate command
      this.validateCommand(command);

      // Validate arguments
      this.validateArguments(args);

      // Execute with restrictions
      const result = await this.runRestricted(command, args, options);

      // Update audit log
      auditEntry.status = 'success';
      auditEntry.duration = Date.now() - startTime;
      auditEntry.exitCode = result.exitCode;
      this.logAudit(auditEntry);

      return result;
    } catch (error) {
      // Update audit log
      auditEntry.status = 'failed';
      auditEntry.error = error.message;
      auditEntry.duration = Date.now() - startTime;
      this.logAudit(auditEntry);

      throw error;
    }
  }

  /**
   * Validate command is in whitelist
   */
  validateCommand(command) {
    // Check if command is in allowed list
    if (this.options.allowedCommands.length > 0) {
      const commandName = path.basename(command);

      if (!this.options.allowedCommands.includes(commandName)) {
        throw new Error(`Command not allowed: ${commandName}`);
      }
    }

    // Check for shell injection attempts
    const dangerous = [';', '|', '&', '$', '`', '\n', '>', '<'];
    if (dangerous.some(char => command.includes(char))) {
      throw new Error('Potentially dangerous characters in command');
    }

    return true;
  }

  /**
   * Validate arguments
   */
  validateArguments(args) {
    if (!Array.isArray(args)) {
      throw new Error('Arguments must be an array');
    }

    // Check each argument
    for (const arg of args) {
      if (typeof arg !== 'string') {
        throw new Error('All arguments must be strings');
      }

      // Check for injection attempts
      const dangerous = [';', '|', '&', '$', '`', '\n'];
      if (dangerous.some(char => arg.includes(char))) {
        throw new Error(`Potentially dangerous characters in argument: ${arg}`);
      }

      // Check path traversal
      if (arg.includes('..')) {
        throw new Error('Path traversal attempt detected');
      }
    }

    return true;
  }

  /**
   * Run command with restrictions
   */
  runRestricted(command, args, options) {
    return new Promise((resolve, reject) => {
      // Use execFile (safer than exec - no shell)
      const child = execFile(command, args, {
        timeout: this.options.maxExecutionTime,
        maxBuffer: this.options.maxOutputSize,
        env: this.getSafeEnvironment(options.env),
        cwd: this.validatePath(options.cwd || process.cwd()),
        uid: options.uid, // Run as specific user (Unix)
        gid: options.gid  // Run as specific group (Unix)
      });

      let stdout = '';
      let stderr = '';
      let killed = false;

      // Collect output
      child.stdout.on('data', (data) => {
        stdout += data.toString();

        // Check output size limit
        if (stdout.length > this.options.maxOutputSize) {
          killed = true;
          child.kill();
          reject(new Error('Output size limit exceeded'));
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();

        if (stderr.length > this.options.maxOutputSize) {
          killed = true;
          child.kill();
          reject(new Error('Error output size limit exceeded'));
        }
      });

      // Handle completion
      child.on('close', (code, signal) => {
        if (killed) return;

        if (code === 0) {
          resolve({
            exitCode: code,
            signal,
            stdout,
            stderr
          });
        } else {
          const error = new Error(`Command failed with exit code ${code}`);
          error.exitCode = code;
          error.signal = signal;
          error.stdout = stdout;
          error.stderr = stderr;
          reject(error);
        }
      });

      // Handle errors
      child.on('error', (error) => {
        if (!killed) {
          reject(error);
        }
      });

      // Timeout handling
      setTimeout(() => {
        if (child.exitCode === null) {
          killed = true;
          child.kill();
          reject(new Error('Execution timeout'));
        }
      }, this.options.maxExecutionTime);
    });
  }

  /**
   * Get safe environment variables
   */
  getSafeEnvironment(customEnv = {}) {
    // Start with minimal safe environment
    const safeEnv = {
      PATH: '/usr/bin:/bin',
      HOME: '/tmp',
      LANG: 'en_US.UTF-8'
    };

    // Add only whitelisted custom variables
    const allowedEnvVars = this.options.allowedEnvVars || [];

    for (const [key, value] of Object.entries(customEnv)) {
      if (allowedEnvVars.includes(key)) {
        safeEnv[key] = value;
      }
    }

    return safeEnv;
  }

  /**
   * Validate and sanitize path
   */
  validatePath(inputPath) {
    const resolvedPath = path.resolve(inputPath);

    // Check if path is in allowed directories
    if (this.options.allowedPaths.length > 0) {
      const allowed = this.options.allowedPaths.some(allowedPath => {
        return resolvedPath.startsWith(path.resolve(allowedPath));
      });

      if (!allowed) {
        throw new Error(`Path not allowed: ${resolvedPath}`);
      }
    }

    // Check for symlink attacks (would need fs.lstat in real implementation)
    // This is a simplified check
    if (inputPath.includes('..')) {
      throw new Error('Path traversal attempt');
    }

    return resolvedPath;
  }

  /**
   * Generate unique execution ID
   */
  generateExecutionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log audit entry
   */
  logAudit(entry) {
    if (this.options.enableAuditLog) {
      this.auditLog.push(entry);
      this.emit('audit', entry);

      // In production, write to secure audit log file or service
      console.log(`[AUDIT] ${entry.id}: ${entry.status} - ${entry.command}`);
    }
  }

  /**
   * Get audit log
   */
  getAuditLog() {
    return [...this.auditLog];
  }

  /**
   * Get failed executions
   */
  getFailedExecutions() {
    return this.auditLog.filter(entry => entry.status === 'failed');
  }
}

/**
 * SandboxedExecutor - Execute code in a sandboxed environment
 */
class SandboxedExecutor {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 5000,
      memory: options.memory || '128m',
      cpus: options.cpus || 0.5,
      network: options.network !== false,
      readonlyRootfs: options.readonlyRootfs !== false,
      ...options
    };
  }

  /**
   * Execute in sandbox (using Docker-like isolation)
   * Note: This is a conceptual example. Real sandboxing requires
   * system-level tools like Docker, Firejail, or Linux namespaces
   */
  async executeSandboxed(code, language = 'javascript') {
    console.log('Executing in sandbox with restrictions:');
    console.log(`  Timeout: ${this.options.timeout}ms`);
    console.log(`  Memory: ${this.options.memory}`);
    console.log(`  CPU: ${this.options.cpus} cores`);
    console.log(`  Network: ${this.options.network ? 'enabled' : 'disabled'}`);
    console.log(`  Readonly root: ${this.options.readonlyRootfs}`);

    // In production, this would use:
    // - Docker containers
    // - Linux namespaces and cgroups
    // - chroot jails
    // - VM-based sandboxing

    return new Promise((resolve, reject) => {
      const child = spawn('node', ['--eval', code], {
        timeout: this.options.timeout,
        // Resource limits (Linux-specific)
        // In production, use cgroups or containerization
        env: {
          NODE_OPTIONS: `--max-old-space-size=${this.parseMemory(this.options.memory)}`
        }
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ output, error });
        } else {
          reject(new Error(`Sandboxed execution failed: ${error}`));
        }
      });

      child.on('error', reject);
    });
  }

  /**
   * Parse memory string to megabytes
   */
  parseMemory(memStr) {
    const match = memStr.match(/^(\d+)(m|mb|g|gb)?$/i);
    if (!match) return 128;

    const value = parseInt(match[1]);
    const unit = (match[2] || 'm').toLowerCase();

    if (unit.startsWith('g')) {
      return value * 1024;
    }
    return value;
  }
}

/**
 * Demo
 */
async function demo() {
  console.log('--- Demo 1: Secure Command Execution ---\n');

  const executor = new SecureCommandExecutor({
    allowedCommands: ['ls', 'echo', 'node', 'cat'],
    allowedPaths: ['/tmp', process.cwd()],
    maxExecutionTime: 3000,
    maxOutputSize: 1024 * 10,
    enableAuditLog: true
  });

  // Example 1: Valid command
  try {
    console.log('Executing valid command: ls');
    const result = await executor.executeCommand('ls', ['-la'], {
      user: 'demo-user',
      cwd: process.cwd()
    });
    console.log('✓ Command succeeded');
    console.log(`Output length: ${result.stdout.length} bytes\n`);
  } catch (error) {
    console.error('✗ Command failed:', error.message, '\n');
  }

  // Example 2: Blocked command (not in whitelist)
  try {
    console.log('Attempting blocked command: rm');
    await executor.executeCommand('rm', ['-rf', '/'], {
      user: 'demo-user'
    });
  } catch (error) {
    console.log('✓ Command correctly blocked:', error.message, '\n');
  }

  // Example 3: Command injection attempt
  try {
    console.log('Attempting command injection: ls; cat /etc/passwd');
    await executor.executeCommand('ls; cat /etc/passwd', [], {
      user: 'demo-user'
    });
  } catch (error) {
    console.log('✓ Injection attempt blocked:', error.message, '\n');
  }

  // Example 4: Path traversal attempt
  try {
    console.log('Attempting path traversal: cat ../../etc/passwd');
    await executor.executeCommand('cat', ['../../etc/passwd'], {
      user: 'demo-user'
    });
  } catch (error) {
    console.log('✓ Path traversal blocked:', error.message, '\n');
  }

  // Example 5: Timeout
  try {
    console.log('Testing timeout (5 second sleep with 3 second limit)');
    await executor.executeCommand('sleep', ['5'], {
      user: 'demo-user'
    });
  } catch (error) {
    console.log('✓ Timeout enforced:', error.message, '\n');
  }

  console.log('\n--- Demo 2: Audit Log ---\n');

  const auditLog = executor.getAuditLog();
  console.log(`Total executions: ${auditLog.length}`);
  console.log(`Failed executions: ${executor.getFailedExecutions().length}\n`);

  console.log('Audit entries:');
  auditLog.forEach((entry, i) => {
    console.log(`${i + 1}. [${entry.status}] ${entry.command} - ${entry.duration}ms`);
    if (entry.error) {
      console.log(`   Error: ${entry.error}`);
    }
  });

  console.log('\n--- Demo 3: Sandboxed Execution ---\n');

  const sandbox = new SandboxedExecutor({
    timeout: 3000,
    memory: '64m',
    cpus: 0.25
  });

  // Safe code
  try {
    console.log('Executing safe code in sandbox:');
    const code1 = 'console.log("Hello from sandbox:", 2 + 2)';
    const result = await sandbox.executeSandboxed(code1);
    console.log('✓ Output:', result.output.trim());
  } catch (error) {
    console.error('✗ Execution failed:', error.message);
  }

  console.log('');

  // Potentially dangerous code (would need more restrictions in production)
  try {
    console.log('Executing code with timeout:');
    const code2 = 'while(true) { /* infinite loop */ }';
    await sandbox.executeSandboxed(code2);
  } catch (error) {
    console.log('✓ Dangerous code terminated:', error.message);
  }

  console.log('\n=== Security Best Practices Summary ===\n');
  console.log('✓ Use execFile instead of exec (no shell injection)');
  console.log('✓ Whitelist allowed commands');
  console.log('✓ Validate and sanitize all inputs');
  console.log('✓ Enforce resource limits (time, memory, CPU)');
  console.log('✓ Use minimal environment variables');
  console.log('✓ Restrict file system access');
  console.log('✓ Implement comprehensive audit logging');
  console.log('✓ Run with least privileges (uid/gid)');
  console.log('✓ Consider sandboxing (containers, namespaces)');
  console.log('✓ Monitor and alert on suspicious activity');

  console.log('\n=== Demo Complete ===');
}

// Run demo
if (require.main === module) {
  demo().catch(console.error);
}

module.exports = { SecureCommandExecutor, SandboxedExecutor };
