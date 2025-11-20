# Module 12: Child Process

Master spawning and managing child processes in Node.js for executing external commands and parallel processing.

## Why This Module Matters

The `child_process` module enables Node.js to run external programs, execute shell commands, and spawn new processes. This is essential for tasks like running system commands, integrating with other programs, performing CPU-intensive operations in parallel, and building command-line tools.

**Real-world applications:**
- Running shell commands and scripts
- Executing external programs (ffmpeg, imagemagick, etc.)
- Building CLI tools and automation scripts
- Parallel processing and task distribution
- System administration and DevOps tasks
- Integrating with legacy applications

---

## What You'll Learn

By completing this module, you'll master:

### Technical Skills
- Spawn child processes with `spawn()`
- Execute commands with `exec()` and `execFile()`
- Fork Node.js processes with `fork()`
- Handle process communication (stdin/stdout/stderr)
- Manage process lifecycle and signals
- Work with process streams
- Handle process errors and exit codes

### Practical Applications
- Build CLI tools that execute commands
- Process files in parallel
- Integrate external programs into Node.js apps
- Create build tools and automation scripts
- Implement background job processing
- Handle CPU-intensive tasks efficiently

---

## Module Structure

This module is divided into three progressive levels:

### [Level 1: Basics](./level-1-basics/README.md)
**Time**: 1-2 hours

Learn the fundamentals of child processes:
- Understanding child processes in Node.js
- Using `exec()` for simple commands
- Using `execFile()` for direct execution
- Using `spawn()` for streaming
- Basic process communication
- Handling exit codes and errors

**You'll be able to:**
- Execute shell commands from Node.js
- Choose the right child process method
- Capture command output
- Handle basic process errors
- Understand the differences between methods
- Work with synchronous variants

### [Level 2: Intermediate](./level-2-intermediate/README.md)
**Time**: 2-3 hours

Advanced process management:
- Using `fork()` for Node.js processes
- Inter-process communication (IPC)
- Working with process streams
- Handling process signals
- Managing multiple processes
- Process pooling patterns

**You'll be able to:**
- Communicate between parent and child processes
- Stream large amounts of data
- Handle process termination gracefully
- Manage multiple concurrent processes
- Implement process pools
- Use environment variables

### [Level 3: Advanced](./level-3-advanced/README.md)
**Time**: 3-4 hours

Production-ready process management:
- Building robust process managers
- Advanced IPC patterns
- Process monitoring and supervision
- Security considerations
- Performance optimization
- Error recovery strategies

**You'll be able to:**
- Build production-grade process managers
- Implement automatic restart on failure
- Handle security vulnerabilities
- Optimize process performance
- Build distributed task systems
- Create resilient applications

---

## Prerequisites

- JavaScript fundamentals
- Understanding of streams (Module 5 recommended)
- Understanding of events (Module 4 recommended)
- Node.js installed (v14+)
- Basic command-line knowledge

---

## Learning Path

### Recommended Approach

1. **Read** the [CONCEPTS.md](./CONCEPTS.md) file first for foundational understanding
2. **Start** with Level 1 and progress sequentially
3. **Study** the examples in each level
4. **Complete** the exercises before checking solutions
5. **Read** the conceptual guides for deeper understanding
6. **Practice** by building the suggested projects

### Alternative Approaches

**Fast Track** (If you're experienced):
- Skim Level 1
- Focus on Level 2 and 3
- Complete advanced exercises

**Deep Dive** (If you want mastery):
- Read all guides thoroughly
- Complete all exercises
- Build additional projects
- Study the solutions for alternative approaches

---

## Key Concepts

### Child Process Methods

Node.js provides four main methods for creating child processes:

```javascript
const { spawn, exec, execFile, fork } = require('child_process');

// 1. spawn - For long-running processes with streaming
const ls = spawn('ls', ['-lh', '/usr']);
ls.stdout.on('data', (data) => {
  console.log(`Output: ${data}`);
});

// 2. exec - For shell commands with buffered output
exec('ls -lh /usr', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.log(`Output: ${stdout}`);
});

// 3. execFile - For executing files directly (no shell)
execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.log(`Version: ${stdout}`);
});

// 4. fork - For Node.js processes with IPC
const child = fork('./worker.js');
child.on('message', (msg) => {
  console.log('Message from child:', msg);
});
child.send({ hello: 'world' });
```

### Choosing the Right Method

```javascript
// Use spawn() when:
// - Output is large or streaming
// - Long-running process
// - Need stream control
const ffmpeg = spawn('ffmpeg', ['-i', 'input.mp4', 'output.avi']);

// Use exec() when:
// - Need shell features (pipes, redirects)
// - Output is small
// - Simple one-off commands
exec('cat file.txt | grep "error"', (err, stdout) => {
  console.log(stdout);
});

// Use execFile() when:
// - Don't need shell
// - More secure (no shell injection)
// - Executing a specific file
execFile('/usr/bin/node', ['script.js'], (err, stdout) => {
  console.log(stdout);
});

// Use fork() when:
// - Running Node.js code
// - Need IPC communication
// - CPU-intensive tasks
const worker = fork('./heavy-computation.js');
worker.send({ data: largeDataset });
```

### Process Communication

```javascript
// Parent process (main.js)
const { fork } = require('child_process');
const child = fork('./child.js');

// Send message to child
child.send({ task: 'process', data: [1, 2, 3, 4, 5] });

// Receive message from child
child.on('message', (result) => {
  console.log('Result from child:', result);
});

// Child process (child.js)
process.on('message', (msg) => {
  const result = msg.data.reduce((sum, n) => sum + n, 0);
  process.send({ result });
});
```

---

## Practical Examples

### Example 1: Execute a Shell Command

```javascript
const { exec } = require('child_process');

// Execute a simple command
exec('node --version', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }

  console.log(`Node version: ${stdout.trim()}`);
});
```

### Example 2: Stream Large Output

```javascript
const { spawn } = require('child_process');

// Find large files
const find = spawn('find', ['.', '-type', 'f', '-size', '+1M']);

find.stdout.on('data', (data) => {
  console.log(`Found: ${data}`);
});

find.stderr.on('data', (data) => {
  console.error(`Error: ${data}`);
});

find.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});
```

### Example 3: Process Pool for Parallel Tasks

```javascript
const { fork } = require('child_process');

class ProcessPool {
  constructor(workerScript, poolSize = 4) {
    this.workers = [];
    this.queue = [];

    for (let i = 0; i < poolSize; i++) {
      const worker = fork(workerScript);
      worker.busy = false;
      this.workers.push(worker);
    }
  }

  execute(data) {
    return new Promise((resolve, reject) => {
      const worker = this.workers.find(w => !w.busy);

      if (worker) {
        this.runTask(worker, data, resolve, reject);
      } else {
        this.queue.push({ data, resolve, reject });
      }
    });
  }

  runTask(worker, data, resolve, reject) {
    worker.busy = true;

    worker.once('message', (result) => {
      worker.busy = false;
      resolve(result);
      this.processQueue();
    });

    worker.send(data);
  }

  processQueue() {
    if (this.queue.length > 0) {
      const worker = this.workers.find(w => !w.busy);
      if (worker) {
        const { data, resolve, reject } = this.queue.shift();
        this.runTask(worker, data, resolve, reject);
      }
    }
  }
}

// Usage
const pool = new ProcessPool('./worker.js', 4);

async function processTasks() {
  const tasks = [1, 2, 3, 4, 5, 6, 7, 8];
  const results = await Promise.all(
    tasks.map(task => pool.execute({ task }))
  );
  console.log('All results:', results);
}

processTasks();
```

---

## Common Pitfalls

### ❌ Shell Injection Vulnerability

```javascript
// DANGEROUS - user input in shell command
const userInput = req.query.filename; // Could be: "file.txt; rm -rf /"
exec(`cat ${userInput}`, (error, stdout) => {
  console.log(stdout);
});

// SAFE - use execFile or spawn with array arguments
execFile('cat', [userInput], (error, stdout) => {
  console.log(stdout);
});

// SAFE - use spawn with separate arguments
const cat = spawn('cat', [userInput]);
```

### ❌ Not Handling Errors

```javascript
// Wrong - no error handling
const child = spawn('non-existent-command');
// Process crashes if command fails

// Correct - handle all error cases
const child = spawn('command');
child.on('error', (error) => {
  console.error('Failed to start process:', error);
});
child.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
  }
});
```

### ❌ Memory Leaks with exec()

```javascript
// Wrong - exec buffers entire output in memory
exec('find / -type f', (error, stdout) => {
  // Could use gigabytes of memory!
  console.log(stdout);
});

// Correct - use spawn for large output
const find = spawn('find', ['/', '-type', 'f']);
find.stdout.on('data', (data) => {
  // Process data in chunks
  console.log(data.toString());
});
```

---

## Module Contents

### Documentation
- **[CONCEPTS.md](./CONCEPTS.md)** - Foundational concepts for the entire module
- **Level READMEs** - Specific guidance for each level

### Conceptual Guides
- **18 in-depth guides** - Deep understanding of specific topics
- **Level 1**: 6 guides on fundamentals
- **Level 2**: 6 guides on intermediate patterns
- **Level 3**: 6 guides on advanced topics

---

## Getting Started

### Quick Start

1. **Read the concepts**:
   ```bash
   # Read the foundational concepts
   cat CONCEPTS.md
   ```

2. **Start Level 1**:
   ```bash
   cd level-1-basics
   cat README.md
   ```

3. **Try spawning a process**:
   ```bash
   node -e "const {exec} = require('child_process'); exec('node --version', (e, stdout) => console.log(stdout))"
   ```

### Setting Up

No special setup is required! The child_process module is built into Node.js.

```javascript
// No npm install needed - built into Node.js
const { spawn, exec, execFile, fork } = require('child_process');
```

---

## Success Criteria

You'll know you've mastered this module when you can:

- [ ] Explain the four child process methods and when to use each
- [ ] Execute shell commands safely from Node.js
- [ ] Handle process output (stdout, stderr)
- [ ] Manage process lifecycle and errors
- [ ] Communicate between parent and child processes
- [ ] Build process pools for parallel execution
- [ ] Prevent security vulnerabilities (shell injection)
- [ ] Handle process monitoring and supervision
- [ ] Optimize process performance

---

## Additional Resources

### Official Documentation
- [Node.js Child Process Documentation](https://nodejs.org/api/child_process.html)
- [Process Documentation](https://nodejs.org/api/process.html)

### Practice Projects
After completing this module, try building:
1. **CLI Task Runner** - Build a tool like npm scripts
2. **Image Processor** - Batch process images with ImageMagick
3. **Log Analyzer** - Process large log files in parallel
4. **Build Tool** - Create a simple build system
5. **Job Queue** - Implement a background job processor

### Related Modules
- **Module 4: Events** - Understanding event emitters
- **Module 5: Stream** - Working with process streams
- **Module 6: Process** - Understanding the process object
- **Module 13: Cluster** - Multi-core process management
- **Module 14: Worker Threads** - Alternative to child processes

---

## Questions or Issues?

- Review the [CONCEPTS.md](./CONCEPTS.md) for foundational understanding
- Check the guides for deep dives into specific topics
- Study the examples for practical demonstrations
- Review solutions after attempting exercises

---

## Let's Begin!

Start your journey with [Level 1: Basics](./level-1-basics/README.md) and build a solid foundation in child process management.

Remember: Child processes are powerful but come with complexity. Understanding them well will help you build robust, scalable Node.js applications that can execute external programs and distribute work efficiently!
