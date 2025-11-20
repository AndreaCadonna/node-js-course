# Security Considerations

Learn essential security practices for safe process execution, preventing injection attacks, and protecting system resources.

## Table of Contents
- [Threat Model](#threat-model)
- [Input Validation](#input-validation)
- [Command Injection Prevention](#command-injection-prevention)
- [Resource Limits](#resource-limits)
- [Sandboxing](#sandboxing)
- [Audit Logging](#audit-logging)

---

## Threat Model

### Common Threats

**1. Command Injection**
```javascript
// DANGEROUS
const userInput = req.query.filename;
exec(`cat ${userInput}`); // Can execute: file.txt; rm -rf /
```

**2. Path Traversal**
```javascript
// DANGEROUS
const file = req.params.file;
exec(`cat /data/${file}`); // Can access: ../../etc/passwd
```

**3. Resource Exhaustion**
```javascript
// DANGEROUS
exec('find /'); // Can consume all memory/CPU
```

**4. Privilege Escalation**
```javascript
// DANGEROUS
exec('sudo rm -rf /'); // If process has sudo rights
```

### Attack Surface

```
User Input → Validation → Sanitization → Whitelisting → Execution
     ↓           ↓            ↓             ↓            ↓
  Untrusted   Check Type   Remove Bad    Check Allow  Run Safely
              Check Size   Characters     List
```

---

## Input Validation

### Comprehensive Validation

```javascript
class InputValidator {
  static validate(input, rules) {
    // Type check
    if (rules.type && typeof input !== rules.type) {
      throw new Error(`Invalid type: expected ${rules.type}`);
    }

    // Length check
    if (rules.maxLength && input.length > rules.maxLength) {
      throw new Error('Input too long');
    }

    // Pattern check
    if (rules.pattern && !rules.pattern.test(input)) {
      throw new Error('Input does not match pattern');
    }

    // Whitelist check
    if (rules.whitelist && !rules.whitelist.includes(input)) {
      throw new Error('Input not in whitelist');
    }

    // Blacklist check (less preferred than whitelist)
    if (rules.blacklist && rules.blacklist.includes(input)) {
      throw new Error('Input in blacklist');
    }

    return true;
  }
}

// Usage
InputValidator.validate(userInput, {
  type: 'string',
  maxLength: 100,
  pattern: /^[a-zA-Z0-9_-]+$/,
  whitelist: ['file1.txt', 'file2.txt']
});
```

### Path Validation

```javascript
class PathValidator {
  static validatePath(inputPath, allowedPaths) {
    const path = require('path');

    // Resolve to absolute path
    const resolved = path.resolve(inputPath);

    // Check for path traversal
    if (inputPath.includes('..')) {
      throw new Error('Path traversal detected');
    }

    // Check against allowed paths
    const isAllowed = allowedPaths.some(allowed => {
      const allowedResolved = path.resolve(allowed);
      return resolved.startsWith(allowedResolved);
    });

    if (!isAllowed) {
      throw new Error('Path not allowed');
    }

    return resolved;
  }
}
```

---

## Command Injection Prevention

### Use execFile Instead of exec

```javascript
// WRONG - shell injection possible
const { exec } = require('child_process');
exec(`ls ${userInput}`, callback);

// CORRECT - no shell, no injection
const { execFile } = require('child_process');
execFile('ls', [userInput], callback);
```

### Command Whitelisting

```javascript
class SecureExecutor {
  constructor(allowedCommands) {
    this.allowedCommands = new Set(allowedCommands);
  }

  async execute(command, args) {
    // Validate command
    if (!this.allowedCommands.has(command)) {
      throw new Error(`Command not allowed: ${command}`);
    }

    // Validate args
    this.validateArguments(args);

    // Execute safely
    return new Promise((resolve, reject) => {
      execFile(command, args, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  validateArguments(args) {
    // Check for shell metacharacters
    const dangerous = [';', '|', '&', '$', '`', '\n', '>', '<'];

    for (const arg of args) {
      if (typeof arg !== 'string') {
        throw new Error('Arguments must be strings');
      }

      for (const char of dangerous) {
        if (arg.includes(char)) {
          throw new Error(`Dangerous character: ${char}`);
        }
      }
    }
  }
}
```

### Argument Sanitization

```javascript
function sanitizeArgument(arg) {
  // Remove all non-alphanumeric except safe chars
  return arg.replace(/[^a-zA-Z0-9._-]/g, '');
}

function escapeShellArg(arg) {
  // Escape for shell (but prefer not using shell!)
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}
```

---

## Resource Limits

### Time Limits

```javascript
function executeWithTimeout(command, args, timeout) {
  return new Promise((resolve, reject) => {
    const child = execFile(command, args);

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Execution timeout'));
    }, timeout);

    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Exit code: ${code}`));
      }
    });
  });
}
```

### Memory Limits

```javascript
const { spawn } = require('child_process');

function spawnWithLimits(command, args, limits) {
  const options = {
    // Set environment with memory limit
    env: {
      ...process.env,
      NODE_OPTIONS: `--max-old-space-size=${limits.maxMemoryMB}`
    },

    // Resource limits (Linux-specific)
    // In production, use cgroups or containers
    maxBuffer: limits.maxOutputMB * 1024 * 1024,

    // Time limit
    timeout: limits.maxTimeSec * 1000
  };

  return spawn(command, args, options);
}
```

### CPU Limits (Linux)

```javascript
// Using cgroups (requires root/capabilities)
function setCPULimit(pid, cpuPercent) {
  const fs = require('fs');

  const cgroupPath = `/sys/fs/cgroup/cpu/myapp/${pid}`;

  // Create cgroup
  fs.mkdirSync(cgroupPath, { recursive: true });

  // Set CPU limit (cpu.cfs_quota_us / cpu.cfs_period_us)
  const period = 100000; // 100ms
  const quota = Math.floor(period * (cpuPercent / 100));

  fs.writeFileSync(`${cgroupPath}/cpu.cfs_period_us`, period.toString());
  fs.writeFileSync(`${cgroupPath}/cpu.cfs_quota_us`, quota.toString());

  // Add process to cgroup
  fs.writeFileSync(`${cgroupPath}/tasks`, pid.toString());
}
```

---

## Sandboxing

### Container-Based (Docker)

```javascript
const { spawn } = require('child_process');

function runInContainer(command, args) {
  const dockerArgs = [
    'run',
    '--rm',                          // Remove after exit
    '--network=none',                // No network
    '--memory=128m',                 // Memory limit
    '--cpus=0.5',                    // CPU limit
    '--read-only',                   // Read-only filesystem
    '--user=nobody',                 // Non-root user
    'alpine:latest',                 // Minimal image
    command,
    ...args
  ];

  return spawn('docker', dockerArgs);
}

// Usage
const child = runInContainer('sh', ['-c', 'echo hello']);
```

### Process Isolation (Linux)

```javascript
// Using unshare for namespaces (simplified example)
function spawnIsolated(command, args) {
  return spawn('unshare', [
    '--pid',      // PID namespace
    '--net',      // Network namespace
    '--mount',    // Mount namespace
    '--uts',      // Hostname namespace
    '--ipc',      // IPC namespace
    command,
    ...args
  ]);
}
```

### chroot Jail (Unix)

```javascript
const { spawn } = require('child_process');

function spawnInChroot(command, args, chrootPath) {
  // Requires root privileges
  return spawn('chroot', [
    chrootPath,
    command,
    ...args
  ], {
    // Drop privileges after chroot
    uid: 65534, // nobody
    gid: 65534
  });
}
```

---

## Audit Logging

### Comprehensive Audit Trail

```javascript
class AuditLogger {
  constructor(logPath) {
    this.logPath = logPath;
  }

  async log(entry) {
    const fs = require('fs').promises;

    const record = {
      timestamp: new Date().toISOString(),
      id: this.generateId(),
      ...entry
    };

    const line = JSON.stringify(record) + '\n';

    // Append to log file
    await fs.appendFile(this.logPath, line, { mode: 0o600 });

    // Also log to console
    console.log('[AUDIT]', record);

    return record.id;
  }

  async logExecution(details) {
    return this.log({
      type: 'execution',
      user: details.user,
      command: details.command,
      args: details.args,
      workingDir: details.cwd,
      environment: Object.keys(details.env || {}),
      ipAddress: details.ip,
      sessionId: details.sessionId
    });
  }

  async logResult(executionId, result) {
    return this.log({
      type: 'result',
      executionId,
      exitCode: result.code,
      signal: result.signal,
      duration: result.duration,
      outputSize: result.outputSize
    });
  }

  async logSecurityEvent(event) {
    return this.log({
      type: 'security',
      severity: event.severity,
      event: event.type,
      details: event.details,
      blocked: event.blocked
    });
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Security Event Detection

```javascript
class SecurityMonitor {
  constructor() {
    this.suspiciousPatterns = [
      /;/,                    // Command chaining
      /\|/,                   // Piping
      /&/,                    // Background
      /\$\(/,                 // Command substitution
      /`/,                    // Backticks
      /\.\./,                 // Path traversal
      /\/etc\/passwd/,        // Sensitive files
      /sudo/,                 // Privilege escalation
      /rm\s+-rf/             // Destructive commands
    ];
  }

  analyze(command, args) {
    const fullCommand = `${command} ${args.join(' ')}`;

    const threats = [];

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(fullCommand)) {
        threats.push({
          pattern: pattern.toString(),
          severity: 'high',
          description: this.describePattern(pattern)
        });
      }
    }

    return {
      isSuspicious: threats.length > 0,
      threats
    };
  }

  describePattern(pattern) {
    const descriptions = {
      '/;/': 'Command chaining attempt',
      '/\\|/': 'Pipe command detected',
      '/&/': 'Background execution',
      '/\\$\\(/': 'Command substitution',
      '/`/': 'Backtick command execution',
      '/\\.\\./': 'Path traversal attempt',
      '/\\/etc\\/passwd/': 'Access to sensitive file',
      '/sudo/': 'Privilege escalation attempt',
      '/rm\\s+-rf/': 'Destructive command'
    };

    return descriptions[pattern.toString()] || 'Unknown threat';
  }
}
```

---

## Best Practices

### Security Checklist

- [ ] **Never use `exec()` with user input** - Use `execFile()`
- [ ] **Whitelist commands** - Only allow known-safe commands
- [ ] **Validate all inputs** - Type, length, format, content
- [ ] **Validate paths** - Prevent traversal, check allowed dirs
- [ ] **Set resource limits** - Time, memory, CPU, output size
- [ ] **Use principle of least privilege** - Minimal permissions
- [ ] **Run in sandbox** - Containers, chroot, namespaces
- [ ] **Log everything** - Comprehensive audit trail
- [ ] **Monitor for anomalies** - Detect suspicious activity
- [ ] **Regular security reviews** - Audit code and logs

### Defense in Depth

```
Layer 1: Input Validation     ← First line of defense
Layer 2: Whitelisting          ← Only allow known-safe
Layer 3: Sanitization          ← Clean dangerous characters
Layer 4: Resource Limits       ← Prevent DoS
Layer 5: Sandboxing            ← Isolate execution
Layer 6: Privilege Separation  ← Minimal permissions
Layer 7: Audit Logging         ← Detect and respond
```

---

**Next**: Read [Performance Optimization](05-performance-optimization.md) for optimization techniques.
