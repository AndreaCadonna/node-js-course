# The exec() Method

## Introduction

This guide provides a comprehensive understanding of `child_process.exec()`, the simplest method for executing shell commands in Node.js.

---

## What is exec()?

### Definition

`exec()` spawns a shell and executes a command within that shell, buffering all output and providing it via a callback.

```javascript
const { exec } = require('child_process');

exec('ls -la', (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Output:', stdout);
});
```

### Signature

```javascript
child_process.exec(command[, options][, callback])
```

**Parameters:**
- `command` (string): The command to execute
- `options` (object): Configuration options
- `callback` (function): Called with `(error, stdout, stderr)`

**Returns:** ChildProcess object

---

## How exec() Works

### The Process Flow

```
┌─────────────────────────────────────────┐
│  Your Code: exec('ls -la', callback)    │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  Node.js spawns a shell                 │
│  - /bin/sh on Unix                      │
│  - cmd.exe on Windows                   │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  Shell executes command: ls -la         │
│  - Produces stdout                      │
│  - Produces stderr (if errors)          │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  All output buffered in memory          │
│  - Stored until process completes       │
│  - Limited by maxBuffer (default 1 MB)  │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  Callback invoked with complete output  │
│  callback(error, stdout, stderr)        │
└─────────────────────────────────────────┘
```

### Key Behavior

1. **Shell is spawned** - Command runs in a shell context
2. **Output is buffered** - All data kept in memory
3. **Callback when complete** - Called after process exits
4. **Synchronous alternative** - `execSync()` blocks until done

---

## Basic Usage

### Simple Command
```javascript
const { exec } = require('child_process');

exec('date', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }

  console.log(`Current date: ${stdout}`);
});
```

### With Options
```javascript
exec('ls -la', {
  cwd: '/tmp',              // Working directory
  timeout: 5000,            // Kill after 5 seconds
  maxBuffer: 1024 * 500,    // 500 KB max output
  env: process.env          // Environment variables
}, (error, stdout, stderr) => {
  console.log(stdout);
});
```

### Promise-Based (Recommended)
```javascript
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runCommand() {
  try {
    const { stdout, stderr } = await execAsync('git status');
    console.log('Git status:', stdout);
  } catch (error) {
    console.error('Command failed:', error);
  }
}
```

---

## Options

### All Available Options

```javascript
const options = {
  // Working directory
  cwd: '/path/to/directory',

  // Environment variables
  env: { ...process.env, CUSTOM: 'value' },

  // Shell to use
  shell: '/bin/bash',  // Default: /bin/sh (Unix), cmd.exe (Windows)

  // Encoding for output
  encoding: 'utf8',    // Default: 'utf8'

  // Timeout in milliseconds
  timeout: 0,          // Default: 0 (no timeout)

  // Max output buffer size in bytes
  maxBuffer: 1024 * 1024,  // Default: 1 MB

  // Signal to send when killing
  killSignal: 'SIGTERM',   // Default: 'SIGTERM'

  // User ID to run as (Unix only)
  uid: 1000,

  // Group ID to run as (Unix only)
  gid: 1000,

  // Hide window on Windows
  windowsHide: true
};

exec('command', options, callback);
```

### Important Options Explained

#### cwd (Current Working Directory)
```javascript
// Execute in different directory
exec('ls', { cwd: '/tmp' }, (error, stdout) => {
  console.log('Files in /tmp:', stdout);
});
```

#### timeout
```javascript
// Kill process after 5 seconds
exec('long-running-command', {
  timeout: 5000
}, (error, stdout) => {
  if (error && error.killed) {
    console.error('Command timed out');
  }
});
```

#### maxBuffer
```javascript
// Increase buffer for large output
exec('find / -type f', {
  maxBuffer: 1024 * 1024 * 10  // 10 MB
}, (error, stdout) => {
  if (error && error.code === 'ERR_CHILD_PROCESS_STDOUT_MAXBUFFER_EXCEEDED') {
    console.error('Output too large!');
  }
});
```

#### env (Environment Variables)
```javascript
// Pass custom environment
exec('echo $CUSTOM_VAR', {
  env: { ...process.env, CUSTOM_VAR: 'Hello' }
}, (error, stdout) => {
  console.log(stdout); // Hello
});
```

---

## Error Handling

### Types of Errors

#### 1. Command Execution Errors
```javascript
exec('ls /nonexistent', (error, stdout, stderr) => {
  if (error) {
    console.error('Exit code:', error.code);
    console.error('Signal:', error.signal);
    console.error('Error message:', error.message);
  }
  console.error('stderr:', stderr);
});
```

#### 2. Timeout Errors
```javascript
exec('sleep 10', {
  timeout: 2000
}, (error, stdout, stderr) => {
  if (error && error.killed) {
    console.error('Process was killed due to timeout');
    console.error('Signal used:', error.signal); // SIGTERM
  }
});
```

#### 3. Buffer Exceeded Errors
```javascript
exec('cat huge-file.txt', {
  maxBuffer: 1024 * 100  // 100 KB
}, (error, stdout, stderr) => {
  if (error) {
    console.error('Error code:', error.code);
    // ERR_CHILD_PROCESS_STDOUT_MAXBUFFER_EXCEEDED
  }
});
```

### Comprehensive Error Handler
```javascript
async function safeExec(command, options = {}) {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    const { stdout, stderr } = await execAsync(command, options);

    if (stderr) {
      console.warn('Warning output:', stderr);
    }

    return stdout.trim();

  } catch (error) {
    // Categorize error
    if (error.killed) {
      throw new Error(`Command timed out: ${command}`);
    }

    if (error.code === 'ERR_CHILD_PROCESS_STDOUT_MAXBUFFER_EXCEEDED') {
      throw new Error(`Output too large for command: ${command}`);
    }

    if (error.code) {
      throw new Error(`Command failed (exit ${error.code}): ${command}\n${error.stderr}`);
    }

    throw error;
  }
}

// Usage
try {
  const output = await safeExec('git status');
  console.log(output);
} catch (error) {
  console.error(error.message);
}
```

---

## Practical Examples

### Example 1: Git Operations
```javascript
async function gitInfo() {
  const execAsync = promisify(exec);

  try {
    // Get current branch
    const { stdout: branch } = await execAsync('git branch --show-current');
    console.log('Current branch:', branch.trim());

    // Get last commit
    const { stdout: commit } = await execAsync('git log -1 --oneline');
    console.log('Last commit:', commit.trim());

    // Check for changes
    const { stdout: status } = await execAsync('git status --porcelain');
    const hasChanges = status.trim().length > 0;
    console.log('Has changes:', hasChanges);

  } catch (error) {
    console.error('Git operation failed:', error.message);
  }
}
```

### Example 2: System Information
```javascript
async function getSystemInfo() {
  const execAsync = promisify(exec);
  const os = require('os');

  const info = {};

  try {
    // Platform-specific commands
    if (os.platform() === 'linux') {
      const { stdout } = await execAsync('cat /proc/cpuinfo | grep "model name" | head -1');
      info.cpu = stdout.split(':')[1].trim();

      const { stdout: mem } = await execAsync('free -h | grep Mem | awk \'{print $2}\'');
      info.memory = mem.trim();
    } else if (os.platform() === 'darwin') {
      const { stdout } = await execAsync('sysctl -n machdep.cpu.brand_string');
      info.cpu = stdout.trim();

      const { stdout: mem } = await execAsync('sysctl -n hw.memsize');
      info.memory = (parseInt(mem) / (1024 ** 3)).toFixed(2) + ' GB';
    }

    return info;
  } catch (error) {
    console.error('Failed to get system info:', error);
    return null;
  }
}
```

### Example 3: File Operations
```javascript
async function compressFile(inputFile, outputFile) {
  const execAsync = promisify(exec);

  try {
    // Compress file with gzip
    await execAsync(`gzip -c ${inputFile} > ${outputFile}`);

    // Get compressed size
    const { stdout } = await execAsync(`stat -f%z ${outputFile}`);
    const compressedSize = parseInt(stdout);

    console.log(`Compressed to ${compressedSize} bytes`);
    return compressedSize;

  } catch (error) {
    console.error('Compression failed:', error.message);
    throw error;
  }
}
```

---

## exec() vs execSync()

### Asynchronous exec()
```javascript
// Non-blocking
console.log('Starting...');
exec('sleep 3 && echo "Done"', (error, stdout) => {
  console.log('Command output:', stdout);
});
console.log('Continuing...');

// Output:
// Starting...
// Continuing...
// Command output: Done
```

### Synchronous execSync()
```javascript
const { execSync } = require('child_process');

// Blocks until complete
console.log('Starting...');
const output = execSync('sleep 3 && echo "Done"');
console.log('Command output:', output.toString());
console.log('Continuing...');

// Output:
// Starting...
// (3 second pause)
// Command output: Done
// Continuing...
```

### When to Use Each

**Use exec():**
- Default choice for most cases
- When other code should keep running
- In web servers and async applications
- When handling multiple operations

**Use execSync():**
- In build scripts
- In CLI tools
- During application startup
- When order matters critically

---

## Best Practices

### 1. Use Promises
```javascript
// Good: Promise-based
const execAsync = promisify(exec);
const output = await execAsync('command');

// Avoid: Callback hell
exec('cmd1', (err1, out1) => {
  exec('cmd2', (err2, out2) => {
    exec('cmd3', (err3, out3) => {
      // Deeply nested
    });
  });
});
```

### 2. Set Appropriate Timeouts
```javascript
// Good: Prevent hanging
exec('command', { timeout: 30000 }, callback);

// Bad: No timeout (might hang forever)
exec('command', callback);
```

### 3. Handle All Error Cases
```javascript
// Good: Comprehensive error handling
exec('command', (error, stdout, stderr) => {
  if (error) {
    handleError(error);
    return;
  }
  if (stderr) {
    handleWarning(stderr);
  }
  processOutput(stdout);
});
```

### 4. Sanitize Input
```javascript
// Bad: Command injection risk
const userInput = req.params.filename;
exec(`cat ${userInput}`, callback);  // DANGEROUS!

// Good: Validate and escape
function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9.-]/g, '');
}
const safe = sanitizeFilename(userInput);
exec(`cat ${safe}`, callback);

// Better: Use execFile instead
execFile('cat', [userInput], callback);
```

### 5. Consider spawn() for Large Output
```javascript
// Bad: exec() for large output (might exceed maxBuffer)
exec('find / -type f', callback);

// Good: spawn() for large output
const child = spawn('find', ['/', '-type', 'f']);
child.stdout.on('data', (data) => {
  // Process chunks
});
```

---

## Common Pitfalls

### Pitfall 1: Ignoring stderr
```javascript
// Bad: Only checking error
exec('command', (error, stdout) => {
  if (!error) {
    console.log(stdout); // Might miss warnings!
  }
});

// Good: Check both error and stderr
exec('command', (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  if (stderr) {
    console.warn('Warnings:', stderr);
  }
  console.log('Output:', stdout);
});
```

### Pitfall 2: Not Setting maxBuffer for Large Output
```javascript
// Bad: Might crash with large output
exec('find /', callback);

// Good: Set appropriate buffer
exec('find /', {
  maxBuffer: 1024 * 1024 * 10  // 10 MB
}, callback);

// Better: Use spawn() for very large output
```

### Pitfall 3: Command Injection
```javascript
// Bad: Vulnerable to injection
const file = req.params.file;  // Could be "; rm -rf /"
exec(`cat ${file}`, callback);

// Good: Use array-based APIs
execFile('cat', [file], callback);
```

---

## Summary

### When to Use exec()

✅ **Good for:**
- Simple shell commands
- Small output (< 1 MB)
- One-time operations
- Quick scripts
- Git operations
- System information retrieval

❌ **Not good for:**
- Large output
- Long-running processes
- Real-time output needed
- Untrusted input
- High-frequency operations

### Quick Reference

```javascript
// Basic usage
exec('command', (error, stdout, stderr) => {});

// With options
exec('command', { timeout: 5000 }, callback);

// Promise-based
const { stdout } = await promisify(exec)('command');

// Synchronous
const output = execSync('command');
```

### Next Steps

Continue learning about child processes:
- [spawn() Method Guide](./03-spawn-method.md) - For streaming and large output
- [execFile vs exec](./04-execFile-vs-exec.md) - Security and efficiency
- [Choosing the Right Method](./06-choosing-the-right-method.md) - Decision guide

---

Ready to learn about spawn()? Continue to [spawn() Method Guide](./03-spawn-method.md)!
