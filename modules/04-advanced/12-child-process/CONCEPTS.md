# Child Process Concepts

This document covers the foundational concepts of the `child_process` module. Read this before diving into the level-specific content to build a solid understanding of how child processes work in Node.js.

---

## Table of Contents

1. [What Are Child Processes?](#what-are-child-processes)
2. [Why Use Child Processes?](#why-use-child-processes)
3. [The Four Methods](#the-four-methods)
4. [Process Communication](#process-communication)
5. [Streams and Buffers](#streams-and-buffers)
6. [Process Lifecycle](#process-lifecycle)
7. [Security Considerations](#security-considerations)
8. [Common Patterns](#common-patterns)

---

## What Are Child Processes?

A **child process** is a separate process spawned by a parent process. In Node.js, the main application is the parent process, and it can create child processes to:

- Execute external programs
- Run shell commands
- Spawn additional Node.js processes
- Distribute CPU-intensive work

### Key Characteristics

```javascript
const { spawn } = require('child_process');

// Parent process (your Node.js app)
console.log('Parent PID:', process.pid);

// Create child process
const child = spawn('node', ['--version']);

// Child has its own PID
child.on('spawn', () => {
  console.log('Child PID:', child.pid);
});
```

**Important concepts:**
- Each process has its own memory space
- Processes run independently
- Parent and child can communicate via IPC
- Child processes can outlive the parent (unless managed)

---

## Why Use Child Processes?

### 1. **Execute External Programs**

Run programs written in other languages or use system utilities:

```javascript
const { exec } = require('child_process');

// Use ImageMagick to convert image
exec('convert input.png -resize 50% output.png', (error) => {
  if (!error) console.log('Image converted!');
});
```

### 2. **Parallel Processing**

Distribute CPU-intensive work across multiple processes:

```javascript
const { fork } = require('child_process');

// Process large dataset in parallel
const workers = [];
for (let i = 0; i < 4; i++) {
  const worker = fork('./worker.js');
  worker.send({ data: dataChunks[i] });
  workers.push(worker);
}
```

### 3. **Isolation**

Isolate risky operations:

```javascript
// If child crashes, parent continues
const child = fork('./risky-operation.js');
child.on('exit', (code) => {
  if (code !== 0) {
    console.log('Child crashed, restarting...');
    // Restart the child
  }
});
```

### 4. **System Integration**

Integrate with system commands and scripts:

```javascript
const { exec } = require('child_process');

// Get system information
exec('df -h', (error, stdout) => {
  console.log('Disk usage:\n', stdout);
});
```

---

## The Four Methods

Node.js provides four methods to create child processes, each optimized for different use cases.

### 1. `spawn(command, args, options)`

**Best for:** Long-running processes, streaming data, large output

```javascript
const { spawn } = require('child_process');

const ls = spawn('ls', ['-lh', '/usr']);

// Streams - efficient for large data
ls.stdout.on('data', (data) => {
  console.log(`Output: ${data}`);
});

ls.on('close', (code) => {
  console.log(`Exited with code ${code}`);
});
```

**Characteristics:**
- Returns a stream
- Does not buffer output
- Does not use a shell by default
- Most efficient for large output

### 2. `exec(command, options, callback)`

**Best for:** Simple shell commands, small output, when you need shell features

```javascript
const { exec } = require('child_process');

// Uses shell - can use pipes, redirects
exec('cat package.json | grep "name"', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.log(`Output: ${stdout}`);
});
```

**Characteristics:**
- Buffers entire output in memory
- Uses a shell (/bin/sh on Unix, cmd.exe on Windows)
- Has maxBuffer limit (default 1MB)
- Simple callback interface

### 3. `execFile(file, args, options, callback)`

**Best for:** Executing files directly, better security, no shell needed

```javascript
const { execFile } = require('child_process');

// Direct execution - no shell
execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.log(`Version: ${stdout}`);
});
```

**Characteristics:**
- Does not spawn a shell
- More secure (no shell injection risk)
- Buffers output like exec()
- Faster than exec()

### 4. `fork(modulePath, args, options)`

**Best for:** Running Node.js scripts, IPC communication, CPU-intensive tasks

```javascript
const { fork } = require('child_process');

const child = fork('./worker.js');

// Built-in IPC channel
child.on('message', (msg) => {
  console.log('Message from child:', msg);
});

child.send({ task: 'compute', data: [1, 2, 3] });
```

**Characteristics:**
- Spawns a new Node.js process
- Built-in IPC channel
- Special case of spawn()
- Best for Node.js-to-Node.js communication

---

## Process Communication

### Standard Streams (stdin, stdout, stderr)

Every process has three standard streams:

```javascript
const { spawn } = require('child_process');

const child = spawn('grep', ['error']);

// Write to child's stdin
child.stdin.write('This is an error\n');
child.stdin.write('This is fine\n');
child.stdin.end();

// Read from child's stdout
child.stdout.on('data', (data) => {
  console.log(`Match: ${data}`);
});

// Read from child's stderr
child.stderr.on('data', (data) => {
  console.error(`Error: ${data}`);
});
```

### Inter-Process Communication (IPC)

With `fork()`, parent and child can send JavaScript objects:

```javascript
// Parent (main.js)
const { fork } = require('child_process');
const child = fork('./child.js');

child.send({ type: 'task', data: [1, 2, 3, 4, 5] });

child.on('message', (result) => {
  console.log('Result:', result); // { sum: 15 }
});

// Child (child.js)
process.on('message', (msg) => {
  if (msg.type === 'task') {
    const sum = msg.data.reduce((a, b) => a + b, 0);
    process.send({ sum });
  }
});
```

**IPC Features:**
- Send JavaScript objects (serialized with JSON)
- Bidirectional communication
- Can send handles (sockets, servers)

---

## Streams and Buffers

### Understanding the Difference

**Buffered (exec, execFile):**
```javascript
const { exec } = require('child_process');

// Entire output stored in memory
exec('ls -lh', (error, stdout, stderr) => {
  console.log(stdout); // All output at once
});

// Problem: Limited by maxBuffer (default 1MB)
exec('find /', (error, stdout) => {
  // Error: stdout maxBuffer exceeded
});
```

**Streamed (spawn):**
```javascript
const { spawn } = require('child_process');

// Output processed in chunks
const find = spawn('find', ['/']);

find.stdout.on('data', (chunk) => {
  console.log(chunk.toString()); // Process chunk by chunk
});

// No memory limit - processes any size output
```

### When to Use Each

**Use buffered (exec/execFile) when:**
- Output is small (< 1MB)
- You need the complete output
- Simplicity is preferred

**Use streaming (spawn) when:**
- Output is large or unknown size
- You want to process data as it arrives
- Memory efficiency is important

---

## Process Lifecycle

### Process Events

```javascript
const { spawn } = require('child_process');
const child = spawn('sleep', ['2']);

// 1. Process spawned
child.on('spawn', () => {
  console.log('Process started, PID:', child.pid);
});

// 2. Error spawning
child.on('error', (error) => {
  console.error('Failed to start:', error);
});

// 3. stdout/stderr closed
child.on('close', (code, signal) => {
  console.log('Streams closed');
});

// 4. Process exited
child.on('exit', (code, signal) => {
  console.log('Process exited with code:', code);
});
```

### Exit Codes

```javascript
const { spawn } = require('child_process');

const child = spawn('some-command');

child.on('exit', (code, signal) => {
  if (code === 0) {
    console.log('Success');
  } else if (code !== null) {
    console.log('Failed with code:', code);
  } else {
    console.log('Killed by signal:', signal);
  }
});
```

**Common exit codes:**
- `0` - Success
- `1` - General error
- `2` - Misuse of shell command
- `126` - Command cannot execute
- `127` - Command not found
- `null` - Process killed by signal

### Killing Processes

```javascript
const { spawn } = require('child_process');
const child = spawn('long-running-process');

// Kill after 5 seconds
setTimeout(() => {
  child.kill('SIGTERM'); // Graceful termination
}, 5000);

// Force kill if needed
setTimeout(() => {
  if (!child.killed) {
    child.kill('SIGKILL'); // Force kill
  }
}, 10000);
```

---

## Security Considerations

### Shell Injection

**The Problem:**
```javascript
const { exec } = require('child_process');

// DANGEROUS!
const userInput = req.query.file; // Could be: "file.txt; rm -rf /"
exec(`cat ${userInput}`, (error, stdout) => {
  console.log(stdout);
});
```

**The Solution:**
```javascript
// Option 1: Use execFile (no shell)
const { execFile } = require('child_process');
execFile('cat', [userInput], (error, stdout) => {
  console.log(stdout);
});

// Option 2: Use spawn with array args
const { spawn } = require('child_process');
const cat = spawn('cat', [userInput]);

// Option 3: Validate and sanitize input
function isValidFilename(filename) {
  return /^[a-zA-Z0-9._-]+$/.test(filename);
}

if (isValidFilename(userInput)) {
  exec(`cat ${userInput}`, ...);
}
```

### Principle of Least Privilege

```javascript
// Run with limited permissions
const { spawn } = require('child_process');

const child = spawn('risky-command', [], {
  uid: 1001, // Run as specific user (Unix only)
  gid: 1001,
  env: {}, // Empty environment (no sensitive vars)
});
```

### Environment Variables

```javascript
const { spawn } = require('child_process');

// Don't inherit all env vars
const child = spawn('command', [], {
  env: {
    // Only pass what's needed
    PATH: process.env.PATH,
    NODE_ENV: 'production'
  }
});
```

---

## Common Patterns

### Pattern 1: Promise Wrapper

```javascript
const { exec } = require('child_process');
const util = require('util');

// Convert to promise
const execPromise = util.promisify(exec);

async function runCommand(command) {
  try {
    const { stdout, stderr } = await execPromise(command);
    return stdout;
  } catch (error) {
    console.error('Command failed:', error);
    throw error;
  }
}

// Usage
const output = await runCommand('ls -lh');
```

### Pattern 2: Process Pool

```javascript
const { fork } = require('child_process');

class ProcessPool {
  constructor(script, size) {
    this.workers = Array(size).fill(null).map(() => ({
      process: fork(script),
      busy: false
    }));
  }

  async execute(data) {
    const worker = await this.getAvailableWorker();
    worker.busy = true;

    return new Promise((resolve) => {
      worker.process.once('message', (result) => {
        worker.busy = false;
        resolve(result);
      });
      worker.process.send(data);
    });
  }

  async getAvailableWorker() {
    while (true) {
      const worker = this.workers.find(w => !w.busy);
      if (worker) return worker;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
```

### Pattern 3: Supervised Process

```javascript
const { spawn } = require('child_process');

class SupervisedProcess {
  constructor(command, args) {
    this.command = command;
    this.args = args;
    this.restarts = 0;
    this.maxRestarts = 3;
    this.start();
  }

  start() {
    this.process = spawn(this.command, this.args);

    this.process.on('exit', (code) => {
      if (code !== 0 && this.restarts < this.maxRestarts) {
        this.restarts++;
        console.log(`Restarting (attempt ${this.restarts})...`);
        setTimeout(() => this.start(), 1000);
      }
    });
  }

  stop() {
    this.maxRestarts = 0; // Prevent restart
    this.process.kill();
  }
}
```

### Pattern 4: Timeout Wrapper

```javascript
function execWithTimeout(command, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const child = exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout);
    });

    setTimeout(() => {
      child.kill();
      reject(new Error('Command timed out'));
    }, timeout);
  });
}

// Usage
try {
  const output = await execWithTimeout('slow-command', 3000);
} catch (error) {
  console.error('Timeout or error:', error);
}
```

---

## Performance Considerations

### Memory Usage

```javascript
// exec - buffers in memory (bad for large output)
exec('find /', (error, stdout) => {
  // Could use gigabytes of RAM
});

// spawn - streams (good for large output)
const find = spawn('find', ['/']);
find.stdout.pipe(process.stdout); // Constant memory
```

### CPU Usage

```javascript
// Distribute work across cores
const { fork } = require('child_process');
const os = require('os');

const numCPUs = os.cpus().length;
const workers = [];

for (let i = 0; i < numCPUs; i++) {
  workers.push(fork('./worker.js'));
}

// Distribute tasks to workers
```

### Process Overhead

```javascript
// Each process has overhead
// Don't spawn too many

// Bad: Spawn process per item
items.forEach(item => {
  const child = fork('./process-item.js');
  child.send(item);
});

// Good: Use process pool
const pool = new ProcessPool('./process-item.js', 4);
for (const item of items) {
  await pool.execute(item);
}
```

---

## Synchronous Variants

Each async method has a sync variant (use sparingly):

```javascript
const { execSync, execFileSync, spawnSync } = require('child_process');

// Blocks the event loop!
const output = execSync('ls -lh');
console.log(output.toString());

// Use only for:
// - CLI tools (no concurrency needed)
// - Startup scripts
// - Build tools

// Avoid in:
// - Web servers
// - Real-time applications
// - Anything needing concurrency
```

---

## Debugging Child Processes

### Logging Output

```javascript
const { spawn } = require('child_process');

const child = spawn('command', ['args'], {
  stdio: 'inherit' // Inherit parent's stdio
});

// Or pipe to custom logger
child.stdout.on('data', (data) => {
  logger.info('Child output:', data.toString());
});
```

### Handling Errors

```javascript
const child = spawn('command');

// Handle spawn failure
child.on('error', (error) => {
  console.error('Failed to start:', error);
});

// Handle runtime errors
child.stderr.on('data', (data) => {
  console.error('Child error:', data.toString());
});

// Handle exit
child.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`Exited with code ${code}`);
  }
});
```

---

## Summary

**Key Takeaways:**

1. **Four methods, different purposes:**
   - `spawn` - Streaming, long-running
   - `exec` - Shell commands, small output
   - `execFile` - Direct execution, security
   - `fork` - Node.js IPC

2. **Security first:**
   - Never trust user input
   - Avoid shell when possible
   - Validate all inputs

3. **Choose based on needs:**
   - Large output → spawn
   - Small output → exec/execFile
   - Node.js → fork
   - Shell features → exec

4. **Handle errors:**
   - Always listen for 'error' event
   - Check exit codes
   - Implement timeouts

5. **Manage resources:**
   - Limit concurrent processes
   - Use process pools
   - Kill when done

---

## Next Steps

Now that you understand the concepts, proceed to:

1. **[Level 1: Basics](./level-1-basics/README.md)** - Learn the fundamentals
2. **[Level 2: Intermediate](./level-2-intermediate/README.md)** - Master advanced patterns
3. **[Level 3: Advanced](./level-3-advanced/README.md)** - Build production systems

Happy learning! 🚀
