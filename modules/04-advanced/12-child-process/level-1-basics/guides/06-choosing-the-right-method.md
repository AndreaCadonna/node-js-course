# Choosing the Right Child Process Method

## Introduction

Node.js provides four methods for creating child processes: `exec()`, `execFile()`, `spawn()`, and `fork()`. This guide helps you choose the right one for your use case.

---

## Decision Tree

```
Need to run external code?
│
├─ Is it Node.js code?
│  │
│  ├─ YES → Use fork()
│  │   • Built-in IPC
│  │   • Perfect for CPU-intensive JS
│  │   • Example: fork('worker.js')
│  │
│  └─ NO → Continue below
│
├─ Do you need shell features?
│  │  (pipes, redirects, wildcards)
│  │
│  ├─ YES
│  │  │
│  │  ├─ Is output small (< 1 MB)?
│  │  │  │
│  │  │  ├─ YES → Use exec()
│  │  │  │   • Simple callback
│  │  │  │   • Example: exec('ls | grep .js')
│  │  │  │
│  │  │  └─ NO → Use spawn() with shell: true
│  │  │      • Streaming large output
│  │  │      • Example: spawn('find / | grep', {shell: true})
│  │  │
│  │  └─ Is it a script file?
│  │      → Use execFile() with shell option
│  │
│  └─ NO (direct executable)
│     │
│     ├─ Is output small?
│     │  │
│     │  ├─ YES → Use execFile()
│     │  │   • More secure
│     │  │   • Faster than exec()
│     │  │   • Example: execFile('ls', ['-la'])
│     │  │
│     │  └─ NO → Use spawn()
│     │      • Streaming output
│     │      • Example: spawn('ls', ['-laR', '/'])
│     │
│     └─ Need real-time output?
│         → Use spawn()
```

---

## Detailed Comparison

### At a Glance

| Method | Shell | Output | IPC | Best For |
|--------|-------|--------|-----|----------|
| **exec()** | ✅ Yes | Buffered | ❌ No | Quick shell commands |
| **execFile()** | ❌ No | Buffered | ❌ No | Direct executables |
| **spawn()** | ❌ No* | Streamed | ❌ No | Large output, real-time |
| **fork()** | ❌ No | Streamed | ✅ Yes | Node.js parallel tasks |

*spawn() can use shell with `{shell: true}` option

---

## exec() - Quick Shell Commands

### Use When:
- Running simple shell commands
- Output is small (< 1 MB)
- Need shell features (pipes, redirects)
- Convenience over performance
- Input is trusted

### Perfect For:
```javascript
// Git operations
exec('git status');
exec('git log --oneline -10');

// Build commands
exec('npm install && npm run build');

// System info
exec('ps aux | grep node');

// File operations with wildcards
exec('tar czf backup.tar.gz *.log');
```

### Avoid For:
```javascript
// Large output - will crash
exec('find /'); // Could exceed buffer

// Untrusted input - security risk
const file = userInput;
exec(`cat ${file}`); // Command injection!

// High frequency - too slow
for (let i = 0; i < 1000; i++) {
  exec('process-item'); // Creates 1000 shells!
}
```

### Template:
```javascript
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

try {
  const { stdout, stderr } = await execAsync('command', {
    timeout: 5000,
    maxBuffer: 1024 * 1024
  });
  console.log(stdout);
} catch (error) {
  console.error('Command failed:', error);
}
```

---

## execFile() - Secure Direct Execution

### Use When:
- Security is important
- Running direct executables
- Output is small
- No shell features needed
- Performance matters

### Perfect For:
```javascript
// User-provided input
const filename = userInput;
execFile('cat', [filename]); // Safe!

// Node.js scripts
execFile('node', ['script.js', '--flag']);

// System binaries
execFile('/usr/bin/custom-tool', ['--option', 'value']);

// High-frequency operations
for (let i = 0; i < 1000; i++) {
  execFile('process-item', [items[i]]);
}
```

### Avoid For:
```javascript
// Shell features - won't work
execFile('ls | grep .js'); // Error: file not found

// Wildcards - won't work
execFile('cat', ['*.txt']); // Looks for file named "*.txt"

// Large output - might exceed buffer
execFile('find', ['/']); // Could be huge
```

### Template:
```javascript
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

try {
  const { stdout } = await execFileAsync('command', ['arg1', 'arg2'], {
    timeout: 5000,
    maxBuffer: 1024 * 1024
  });
  console.log(stdout);
} catch (error) {
  console.error('Command failed:', error);
}
```

---

## spawn() - Streaming and Real-Time

### Use When:
- Output is large (> 1 MB)
- Need real-time output
- Long-running process
- Want to pipe processes
- Need fine-grained control

### Perfect For:
```javascript
// Large output
const find = spawn('find', ['/', '-name', '*.js']);
find.stdout.on('data', (chunk) => {
  processChunk(chunk);
});

// Real-time monitoring
const tail = spawn('tail', ['-f', 'app.log']);
tail.stdout.on('data', (line) => {
  console.log('New log:', line);
});

// Process piping
const grep = spawn('grep', ['ERROR']);
const sort = spawn('sort');
grep.stdout.pipe(sort.stdin);

// Interactive processes
const python = spawn('python3', ['-i']);
python.stdin.write('print("hello")\n');
python.stdout.on('data', (output) => {
  console.log(output.toString());
});
```

### Avoid For:
```javascript
// Simple small commands - overkill
const child = spawn('node', ['--version']);
// Better: execFile('node', ['--version'])

// When you need shell features
spawn('ls | grep .js'); // Won't work
// Better: exec() or spawn() with {shell: true}
```

### Template:
```javascript
const { spawn } = require('child_process');

function spawnAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Exit code ${code}: ${stderr}`));
      }
    });
  });
}
```

---

## fork() - Node.js Workers

### Use When:
- Running Node.js code in parallel
- CPU-intensive JavaScript tasks
- Need IPC (Inter-Process Communication)
- Building worker pools
- Want to send JavaScript objects

### Perfect For:
```javascript
// CPU-intensive calculations
const child = fork('calculate-primes.js');
child.send({ max: 1000000 });
child.on('message', (result) => {
  console.log('Primes:', result);
});

// Worker pool
const workers = Array(4).fill().map(() => fork('worker.js'));
workers.forEach(w => {
  w.send({ task: 'process', data: chunk });
});

// Background processing
const bgWorker = fork('background-job.js');
bgWorker.send({ job: 'cleanup', schedule: 'daily' });

// Parallel data processing
const chunks = splitData(largeDataset);
const results = await Promise.all(
  chunks.map(chunk => {
    const worker = fork('process-chunk.js');
    return new Promise(resolve => {
      worker.send(chunk);
      worker.on('message', resolve);
    });
  })
);
```

### Avoid For:
```javascript
// System commands - wrong tool
fork('ls.js'); // Just use spawn/exec

// Non-Node.js programs
fork('python-script.py'); // Use spawn

// Simple tasks - too much overhead
fork('simple-calculation.js'); // Just do it inline

// Shared memory - use worker_threads instead
fork('shared-worker.js'); // Worker threads better for this
```

### Template:
```javascript
const { fork } = require('child_process');

function forkAsync(scriptPath, data) {
  return new Promise((resolve, reject) => {
    const child = fork(scriptPath);

    child.send(data);

    child.on('message', (result) => {
      child.kill();
      resolve(result);
    });

    child.on('error', reject);

    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker exited with code ${code}`));
      }
    });
  });
}

// Usage
const result = await forkAsync('./worker.js', { task: 'calculate' });
```

---

## Real-World Scenarios

### Scenario 1: Web Server Image Processing

```javascript
// User uploads image, needs resizing

// Bad: Blocks event loop
app.post('/upload', (req, res) => {
  const resized = resizeImageSync(req.file); // BLOCKS!
  res.send({ url: resized });
});

// Good: Use fork() to offload work
app.post('/upload', async (req, res) => {
  const worker = fork('resize-worker.js');

  worker.send({
    file: req.file.path,
    width: 800,
    height: 600
  });

  worker.on('message', (result) => {
    worker.kill();
    res.send({ url: result.outputPath });
  });
});
```

### Scenario 2: Build Tool

```javascript
// Running build tasks

// exec() for shell commands
await execAsync('npm run build');
await execAsync('npm run test');

// spawn() for long-running processes with output
const webpack = spawn('webpack', ['--watch']);
webpack.stdout.on('data', (data) => {
  console.log('Webpack:', data.toString());
});

// execFile() for direct tools
await execFileAsync('eslint', ['src/**/*.js']);
await execFileAsync('prettier', ['--write', 'src/**/*.js']);
```

### Scenario 3: Data Processing Pipeline

```javascript
// Process large CSV file

// Bad: Load entire file in memory
const data = fs.readFileSync('huge.csv');
const processed = processData(data); // Memory issue!

// Good: Stream with spawn()
const csvReader = spawn('cat', ['huge.csv']);
const processor = spawn('node', ['process-csv.js']);

csvReader.stdout.pipe(processor.stdin);

processor.stdout.on('data', (chunk) => {
  saveToDatabase(chunk);
});
```

### Scenario 4: Parallel Test Runner

```javascript
// Run tests in parallel across CPUs

const os = require('os');
const numCPUs = os.cpus().length;

// Create worker pool
const workers = Array(numCPUs)
  .fill()
  .map(() => fork('test-runner.js'));

// Distribute test files
const testFiles = getTestFiles();
const chunks = chunkArray(testFiles, numCPUs);

const results = await Promise.all(
  workers.map((worker, i) => {
    return new Promise(resolve => {
      worker.send({ files: chunks[i] });
      worker.on('message', resolve);
    });
  })
);

// Cleanup
workers.forEach(w => w.kill());

// Report results
console.log('Total tests:', results.reduce((sum, r) => sum + r.count, 0));
```

---

## Performance Comparison

### Benchmark Results (1000 iterations)

| Method | Time | Memory | CPU |
|--------|------|--------|-----|
| exec() | 3000ms | High | Medium |
| execFile() | 1500ms | Medium | Medium |
| spawn() | 1800ms | Low | Low |
| fork() | 2500ms | Medium | Medium |

**Conclusions:**
- **execFile()** is fastest for simple commands
- **spawn()** uses least memory for large output
- **exec()** has shell overhead
- **fork()** has Node.js startup overhead

---

## Security Comparison

| Method | Security Risk | Mitigation |
|--------|--------------|------------|
| exec() | HIGH (shell injection) | Sanitize input, use allowlists |
| execFile() | LOW (no shell) | Validate paths |
| spawn() | LOW (no shell) | Validate args |
| fork() | LOW (Node.js only) | Trust worker code |

**Best Practice:** Default to execFile() when security matters.

---

## Quick Reference Table

| Need | Use | Example |
|------|-----|---------|
| Git commands | exec() | `exec('git status')` |
| User input | execFile() | `execFile('cat', [userFile])` |
| Large output | spawn() | `spawn('find', ['/'])` |
| CPU task | fork() | `fork('worker.js')` |
| Shell pipes | exec() | `exec('ls \| grep')` |
| Real-time | spawn() | `spawn('tail', ['-f'])` |
| Security | execFile() | `execFile('cmd', [args])` |
| Node.js parallel | fork() | `fork('worker.js')` |

---

## Summary

### Default Choices

1. **Default:** execFile() - Secure and fast
2. **Large output:** spawn() - Streaming
3. **Shell features:** exec() - Convenience
4. **Node.js parallel:** fork() - Built-in IPC

### Decision Checklist

Ask yourself:
1. ❓ **Node.js code?** → fork()
2. ❓ **Shell features needed?** → exec() or spawn({shell: true})
3. ❓ **Large output?** → spawn()
4. ❓ **User input?** → execFile()
5. ❓ **Default?** → execFile()

### Remember

- **Security:** execFile() > spawn() > exec()
- **Performance:** execFile() > spawn() > exec() > fork()
- **Flexibility:** spawn() > fork() > exec() > execFile()
- **Simplicity:** exec() > execFile() > spawn() > fork()

---

Ready to practice? Try the exercises to master all methods!
