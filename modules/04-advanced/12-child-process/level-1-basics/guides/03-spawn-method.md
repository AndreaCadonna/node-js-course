# The spawn() Method

## Introduction

This guide covers `child_process.spawn()`, the most powerful and flexible method for creating child processes with streaming I/O.

---

## What is spawn()?

### Definition

`spawn()` launches a new process with a given command and returns a ChildProcess object with streams for stdin, stdout, and stderr.

```javascript
const { spawn } = require('child_process');

const child = spawn('ls', ['-la', '/usr']);

child.stdout.on('data', (data) => {
  console.log(`Output: ${data}`);
});

child.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});
```

###Key Difference from exec()

| Feature | exec() | spawn() |
|---------|--------|---------|
| Output handling | Buffered (all at once) | Streamed (chunks) |
| Memory usage | High for large output | Low (streaming) |
| Shell | Spawns a shell | Direct execution |
| Best for | Small output | Large output |
| Real-time output | No | Yes |

---

## Signature

```javascript
child_process.spawn(command[, args][, options])
```

**Parameters:**
- `command` (string): Command to execute
- `args` (array): List of string arguments
- `options` (object): Configuration options

**Returns:** ChildProcess object with streams

---

## Basic Usage

### Simple Command
```javascript
const { spawn } = require('child_process');

// Note: command and arguments are separate!
const child = spawn('ls', ['-la', '/usr']);

// Listen to stdout stream
child.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

// Listen to stderr stream
child.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

// Listen to exit event
child.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
});

// Handle errors
child.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});
```

### With Promise Wrapper
```javascript
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
        reject(new Error(`Process exited with code ${code}\n${stderr}`));
      }
    });
  });
}

// Usage
try {
  const { stdout } = await spawnAsync('ls', ['-la']);
  console.log(stdout);
} catch (error) {
  console.error(error.message);
}
```

---

## The ChildProcess Object

### Streams

```javascript
const child = spawn('command', ['args']);

// Readable streams (from child to parent)
child.stdout  // Standard output stream
child.stderr  // Standard error stream

// Writable stream (from parent to child)
child.stdin   // Standard input stream

// All are Node.js streams
child.stdout.pipe(process.stdout);  // Pipe to parent's stdout
```

### Events

```javascript
// Process lifecycle events
child.on('spawn', () => {
  console.log('Process spawned');
});

child.on('close', (code, signal) => {
  console.log(`Process closed: code=${code}, signal=${signal}`);
});

child.on('exit', (code, signal) => {
  console.log(`Process exited: code=${code}, signal=${signal}`);
});

child.on('error', (error) => {
  console.error('Process error:', error);
});

// Stream events
child.stdout.on('data', (chunk) => {
  console.log('Received chunk:', chunk.length, 'bytes');
});

child.stdout.on('end', () => {
  console.log('stdout stream ended');
});
```

### Properties

```javascript
const child = spawn('sleep', ['10']);

console.log('PID:', child.pid);              // Process ID
console.log('Spawned:', child.spawnfile);    // Command that was spawned
console.log('Args:', child.spawnargs);       // Arguments used
console.log('Killed:', child.killed);        // Whether kill() was called
console.log('Exit code:', child.exitCode);   // Exit code (null until exit)
console.log('Signal:', child.signalCode);    // Signal that terminated process
```

### Methods

```javascript
const child = spawn('sleep', ['100']);

// Send signal to child
child.kill();              // Sends SIGTERM (default)
child.kill('SIGKILL');     // Force kill
child.kill('SIGINT');      // Interrupt (Ctrl+C)

// Disconnect IPC channel (only for fork())
// child.disconnect();
```

---

## Options

### Common Options

```javascript
const options = {
  // Working directory
  cwd: '/tmp',

  // Environment variables
  env: { ...process.env, CUSTOM: 'value' },

  // stdio configuration
  stdio: 'pipe',  // 'pipe', 'ignore', 'inherit', or array

  // Detach child from parent
  detached: false,

  // Shell to use (makes it like exec)
  shell: false,

  // Windows-specific
  windowsHide: true,

  // Unix-specific
  uid: 1000,
  gid: 1000
};

const child = spawn('command', ['args'], options);
```

### stdio Option (Important!)

```javascript
// Default: pipe all streams
spawn('ls', [], { stdio: 'pipe' });
// child.stdout/stderr/stdin are streams

// Inherit parent's streams
spawn('ls', [], { stdio: 'inherit' });
// Output goes directly to parent's stdout

// Ignore all streams
spawn('ls', [], { stdio: 'ignore' });
// No streams created

// Custom configuration (array)
spawn('ls', [], {
  stdio: [
    'pipe',    // stdin
    'pipe',    // stdout
    'inherit'  // stderr goes to parent
  ]
});

// Advanced: use specific streams
const fs = require('fs');
const logFile = fs.createWriteStream('output.log');
spawn('ls', [], {
  stdio: ['ignore', logFile, 'pipe']
});
```

---

## Streaming Examples

### Example 1: Process Large File
```javascript
function processLargeFile(filename) {
  const child = spawn('grep', ['ERROR', filename]);
  let lineCount = 0;

  child.stdout.on('data', (chunk) => {
    const lines = chunk.toString().split('\n');
    lineCount += lines.length - 1;
    console.log(`Found ${lineCount} errors so far...`);
  });

  child.on('close', (code) => {
    console.log(`Total errors found: ${lineCount}`);
  });

  child.on('error', (error) => {
    console.error('Failed to process file:', error.message);
  });
}
```

### Example 2: Real-Time Log Monitoring
```javascript
function tailLog(filename) {
  const tail = spawn('tail', ['-f', filename]);

  tail.stdout.on('data', (data) => {
    const line = data.toString().trim();
    console.log(`[LOG] ${line}`);

    // Process log line in real-time
    if (line.includes('ERROR')) {
      console.error('⚠️  Error detected!');
    }
  });

  // Return function to stop tailing
  return () => tail.kill();
}

// Usage
const stopTailing = tailLog('/var/log/app.log');
// ... later ...
stopTailing();
```

### Example 3: Piping Between Processes
```javascript
// Equivalent to: ls -la | grep .js | sort
const ls = spawn('ls', ['-la']);
const grep = spawn('grep', ['.js']);
const sort = spawn('sort');

// Pipe ls output to grep input
ls.stdout.pipe(grep.stdin);

// Pipe grep output to sort input
grep.stdout.pipe(sort.stdin);

// Collect final output
let output = '';
sort.stdout.on('data', (data) => {
  output += data.toString();
});

sort.on('close', (code) => {
  console.log('JavaScript files (sorted):');
  console.log(output);
});
```

### Example 4: Interactive Process
```javascript
// Interactive process (like a REPL)
const python = spawn('python3', ['-i']);

// Send input to process
python.stdin.write('print("Hello from Python")\n');
python.stdin.write('import sys\n');
python.stdin.write('print(sys.version)\n');

// Receive output
python.stdout.on('data', (data) => {
  console.log('Python says:', data.toString());
});

// Close input when done
setTimeout(() => {
  python.stdin.write('exit()\n');
}, 1000);
```

---

## Handling Input and Output

### Providing Input
```javascript
const cat = spawn('cat');

// Write to stdin
cat.stdin.write('Hello\n');
cat.stdin.write('World\n');
cat.stdin.end();  // Important: signal end of input!

// Read from stdout
cat.stdout.on('data', (data) => {
  console.log('Cat echoed:', data.toString());
});
```

### Collecting Output
```javascript
function collectOutput(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    const chunks = [];
    let errorOutput = '';

    child.stdout.on('data', (chunk) => {
      chunks.push(chunk);
    });

    child.stderr.on('data', (chunk) => {
      errorOutput += chunk.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code === 0) {
        const output = Buffer.concat(chunks).toString();
        resolve(output);
      } else {
        reject(new Error(`Exit code ${code}: ${errorOutput}`));
      }
    });
  });
}
```

### Streaming to File
```javascript
const fs = require('fs');

const output = fs.createWriteStream('output.log');
const child = spawn('find', ['/', '-name', '*.js']);

// Pipe stdout to file
child.stdout.pipe(output);

child.on('close', () => {
  console.log('Results written to output.log');
});
```

---

## Advanced Patterns

### Pattern 1: Process Pool
```javascript
class ProcessPool {
  constructor(command, args, poolSize = 4) {
    this.command = command;
    this.args = args;
    this.poolSize = poolSize;
    this.workers = [];
    this.queue = [];
    this.initialize();
  }

  initialize() {
    for (let i = 0; i < this.poolSize; i++) {
      this.workers.push({
        process: null,
        busy: false
      });
    }
  }

  async execute(input) {
    return new Promise((resolve, reject) => {
      this.queue.push({ input, resolve, reject });
      this.processQueue();
    });
  }

  processQueue() {
    const available = this.workers.find(w => !w.busy);
    if (!available || this.queue.length === 0) return;

    const job = this.queue.shift();
    available.busy = true;

    const child = spawn(this.command, this.args);
    available.process = child;

    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      available.busy = false;
      available.process = null;

      if (code === 0) {
        job.resolve(output);
      } else {
        job.reject(new Error(`Process failed: ${code}`));
      }

      this.processQueue();  // Process next in queue
    });

    if (job.input) {
      child.stdin.write(job.input);
      child.stdin.end();
    }
  }

  async shutdown() {
    this.workers.forEach(w => {
      if (w.process) w.process.kill();
    });
  }
}

// Usage
const pool = new ProcessPool('grep', ['-i', 'error']);
const results = await Promise.all([
  pool.execute('file1.txt'),
  pool.execute('file2.txt'),
  pool.execute('file3.txt')
]);
await pool.shutdown();
```

### Pattern 2: Progress Tracking
```javascript
function downloadWithProgress(url, filename) {
  return new Promise((resolve, reject) => {
    const wget = spawn('wget', [
      '--progress=dot:mega',
      '-O', filename,
      url
    ]);

    wget.stderr.on('data', (data) => {
      const output = data.toString();

      // Parse progress from wget output
      const match = output.match(/(\d+)%/);
      if (match) {
        const progress = parseInt(match[1]);
        process.stdout.write(`\rDownload progress: ${progress}%`);
      }
    });

    wget.on('close', (code) => {
      console.log('\n');
      if (code === 0) {
        resolve(filename);
      } else {
        reject(new Error('Download failed'));
      }
    });
  });
}
```

---

## Best Practices

### 1. Always Handle 'error' Event
```javascript
// Good
const child = spawn('command', ['args']);
child.on('error', (error) => {
  console.error('Spawn error:', error);
});

// Bad: Will crash Node.js if command not found
const child = spawn('nonexistent-command');
```

### 2. Handle Both 'exit' and 'close'
```javascript
// 'exit' fires when process ends
child.on('exit', (code, signal) => {
  console.log('Process ended');
});

// 'close' fires when streams are closed (after 'exit')
child.on('close', (code, signal) => {
  console.log('Streams closed, safe to finish');
  // Do cleanup here
});
```

### 3. Clean Up Streams
```javascript
function cleanup(child) {
  child.stdout.removeAllListeners();
  child.stderr.removeAllListeners();
  child.removeAllListeners();
}

child.on('close', () => {
  cleanup(child);
});
```

### 4. Set Encoding for Text
```javascript
// Without encoding: receive Buffers
child.stdout.on('data', (data) => {
  console.log(data);  // <Buffer ...>
});

// With encoding: receive strings
child.stdout.setEncoding('utf8');
child.stdout.on('data', (data) => {
  console.log(data);  // "text output"
});
```

---

## Summary

### When to Use spawn()

✅ **Perfect for:**
- Large output (> 1 MB)
- Long-running processes
- Real-time output needed
- Streaming data
- Process piping
- High-frequency operations

❌ **Overkill for:**
- Simple, quick commands
- Small output
- When you need shell features (use exec)

### Quick Reference

```javascript
// Basic
const child = spawn('command', ['arg1', 'arg2']);

// Listen to output
child.stdout.on('data', (data) => { /* ... */ });
child.stderr.on('data', (data) => { /* ... */ });
child.on('close', (code) => { /* ... */ });
child.on('error', (error) => { /* ... */ });

// Provide input
child.stdin.write('data');
child.stdin.end();

// Kill process
child.kill('SIGTERM');
```

### Next Steps

- [execFile vs exec](./04-execFile-vs-exec.md)
- [fork() Method](./05-fork-method.md)
- [Choosing the Right Method](./06-choosing-the-right-method.md)

---

Continue to [execFile vs exec Guide](./04-execFile-vs-exec.md)!
