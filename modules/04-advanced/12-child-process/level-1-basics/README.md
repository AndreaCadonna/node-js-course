# Level 1: Child Process Basics

Learn the fundamentals of spawning and managing child processes in Node.js.

## Learning Objectives

By completing this level, you will:

- ✅ Understand what child processes are and why they're useful
- ✅ Execute shell commands using `exec()`
- ✅ Spawn processes using `spawn()`
- ✅ Execute files directly with `execFile()`
- ✅ Create Node.js child processes with `fork()`
- ✅ Handle process output (stdout, stderr)
- ✅ Manage process errors and exit codes
- ✅ Choose the right method for different scenarios

---

## Prerequisites

- JavaScript fundamentals
- Basic understanding of streams (helpful)
- Node.js installed (v14+)
- Command-line familiarity

---

## What You'll Learn

### Core Topics

1. **Understanding Child Processes**
   - What are child processes?
   - When to use them
   - Benefits and trade-offs

2. **The exec() Method**
   - Executing shell commands
   - Working with buffered output
   - Shell features and limitations

3. **The spawn() Method**
   - Spawning processes with streaming
   - Working with streams
   - Long-running processes

4. **The execFile() Method**
   - Direct file execution
   - Security advantages
   - Performance benefits

5. **The fork() Method**
   - Running Node.js scripts
   - Basic IPC communication
   - When to use fork

6. **Choosing the Right Method**
   - Decision criteria
   - Performance considerations
   - Security implications

---

## Time Commitment

**Estimated time**: 1-2 hours
- Reading guides: 45-60 minutes
- Studying examples: 20-30 minutes
- Exercises: 30-45 minutes
- Experimentation: 15-30 minutes

---

## Conceptual Guides

Before diving into code, read these guides to build conceptual understanding:

### Essential Reading

1. **[Understanding Child Processes](guides/01-understanding-child-processes.md)** (12 min)
   - What child processes are
   - Why they're useful
   - Basic concepts

2. **[The exec() Method](guides/02-exec-method.md)** (10 min)
   - How exec() works
   - Use cases
   - Limitations

3. **[The spawn() Method](guides/03-spawn-method.md)** (12 min)
   - How spawn() works
   - Working with streams
   - Best practices

4. **[execFile() vs exec()](guides/04-execFile-vs-exec.md)** (8 min)
   - Key differences
   - Security implications
   - When to use each

5. **[The fork() Method](guides/05-fork-method.md)** (10 min)
   - Forking Node.js processes
   - Basic IPC
   - Common patterns

6. **[Choosing the Right Method](guides/06-choosing-the-right-method.md)** (8 min)
   - Decision tree
   - Comparison table
   - Best practices

---

## Key Concepts

### The Four Methods

```javascript
const { spawn, exec, execFile, fork } = require('child_process');

// 1. exec - Shell commands, buffered output
exec('ls -lh', (error, stdout, stderr) => {
  console.log(stdout);
});

// 2. spawn - Streaming, long-running
const ls = spawn('ls', ['-lh']);
ls.stdout.on('data', (data) => console.log(data.toString()));

// 3. execFile - Direct execution, no shell
execFile('ls', ['-lh'], (error, stdout) => {
  console.log(stdout);
});

// 4. fork - Node.js processes with IPC
const child = fork('./worker.js');
child.send({ task: 'compute' });
```

### Handling Output

```javascript
const { spawn } = require('child_process');

const child = spawn('command');

// Standard output
child.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

// Standard error
child.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

// Process exit
child.on('close', (code) => {
  console.log(`Exit code: ${code}`);
});
```

### Basic Error Handling

```javascript
const { exec } = require('child_process');

exec('command-that-might-fail', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    console.error(`Exit code: ${error.code}`);
    return;
  }

  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }

  console.log(`stdout: ${stdout}`);
});
```

---

## Quick Start

### Your First Child Process

Try this in Node.js:

```javascript
const { exec } = require('child_process');

// Execute a simple command
exec('node --version', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.log(`Node version: ${stdout.trim()}`);
});
```

### Using spawn()

```javascript
const { spawn } = require('child_process');

// List files with streaming
const ls = spawn('ls', ['-lh']);

ls.stdout.on('data', (data) => {
  console.log(`Files:\n${data}`);
});

ls.on('close', (code) => {
  console.log(`Done with exit code ${code}`);
});
```

---

## Common Pitfalls

### ❌ Pitfall 1: Not Handling Errors

```javascript
// WRONG - no error handling
const { exec } = require('child_process');
exec('some-command', (error, stdout) => {
  console.log(stdout); // Crashes if command fails
});

// CORRECT - handle errors
exec('some-command', (error, stdout, stderr) => {
  if (error) {
    console.error('Command failed:', error.message);
    return;
  }
  console.log(stdout);
});
```

### ❌ Pitfall 2: Shell Injection

```javascript
// DANGEROUS - user input in shell command
const userFile = req.query.file; // Could be: "file.txt; rm -rf /"
exec(`cat ${userFile}`, callback); // SECURITY VULNERABILITY!

// SAFE - use execFile or spawn
execFile('cat', [userFile], callback);
```

### ❌ Pitfall 3: maxBuffer Exceeded

```javascript
// WRONG - large output with exec
exec('find /', (error, stdout) => {
  // Error: stdout maxBuffer exceeded
});

// CORRECT - use spawn for large output
const find = spawn('find', ['/']);
find.stdout.on('data', (data) => {
  console.log(data.toString());
});
```

---

## Examples

After reading the guides, explore these examples:

### Example Files

1. **[Basic exec()](examples/01-basic-exec.js)**
   - Simple command execution
   - Handling output
   - Error handling

2. **[Basic spawn()](examples/02-basic-spawn.js)**
   - Spawning processes
   - Working with streams
   - Process lifecycle

3. **[Basic execFile()](examples/03-basic-execFile.js)**
   - Direct execution
   - No shell usage
   - Security benefits

4. **[Basic fork()](examples/04-basic-fork.js)**
   - Forking Node.js processes
   - Simple IPC
   - Message passing

5. **[Handling Output](examples/05-handling-output.js)**
   - stdout and stderr
   - Exit codes
   - Data streaming

6. **[Error Handling](examples/06-error-handling.js)**
   - Common errors
   - Graceful degradation
   - Best practices

---

## Exercises

Test your knowledge with these hands-on exercises:

### Exercise 1: Basic Command Execution
Practice executing commands with exec().

**Skills practiced:**
- Using exec()
- Handling output
- Error handling

### Exercise 2: Working with spawn()
Spawn processes and work with streams.

**Skills practiced:**
- Using spawn()
- Stream handling
- Process events

### Exercise 3: Handling Errors
Implement robust error handling.

**Skills practiced:**
- Error detection
- Graceful failure
- Exit code handling

### Exercise 4: Process Communication
Use fork() for IPC.

**Skills practiced:**
- Using fork()
- Message passing
- Basic IPC

### Exercise 5: Building a CLI Tool
Create a simple CLI wrapper.

**Skills practiced:**
- Real-world application
- Multiple methods
- User interaction

---

## Learning Path

### Recommended Sequence

1. **Read Conceptual Guides** (60 minutes)
   - Start with [Understanding Child Processes](guides/01-understanding-child-processes.md)
   - Read all 6 guides in order
   - Take notes on key concepts

2. **Study Examples** (30 minutes)
   - Run each example file
   - Modify and experiment
   - Understand the patterns

3. **Complete Exercises** (45 minutes)
   - Work through each exercise
   - Don't look at solutions immediately
   - Try different approaches

4. **Review Solutions** (15 minutes)
   - Compare with your solutions
   - Understand alternative approaches
   - Note best practices

---

## Success Criteria

You've mastered Level 1 when you can:

- [ ] Explain what child processes are and when to use them
- [ ] Execute commands using exec()
- [ ] Spawn processes using spawn()
- [ ] Use execFile() for direct execution
- [ ] Create Node.js child processes with fork()
- [ ] Handle stdout, stderr, and exit codes
- [ ] Implement proper error handling
- [ ] Choose the appropriate method for each use case
- [ ] Understand security implications

---

## What's Next?

After completing Level 1, you'll be ready for:

### Level 2: Intermediate Child Process Operations
- Advanced stream handling
- Inter-process communication patterns
- Process lifecycle management
- Signal handling
- Process pooling
- Environment variables

---

## Additional Practice

Want more practice? Try these mini-projects:

1. **Command Runner**
   - Create a function to run commands safely
   - Handle errors gracefully
   - Return promises

2. **File Processor**
   - Use child processes to process files
   - Handle multiple files concurrently
   - Report progress

3. **System Info Tool**
   - Gather system information
   - Execute multiple commands
   - Format output nicely

4. **Simple Task Queue**
   - Queue commands for execution
   - Run them sequentially
   - Handle failures

---

## Resources

### Official Documentation
- [Node.js child_process Documentation](https://nodejs.org/api/child_process.html)
- [Node.js Process Documentation](https://nodejs.org/api/process.html)

### Tools
- **Node.js REPL**: Interactive testing
- **Terminal**: Test commands first
- **Process Monitor**: Watch spawned processes

---

## Questions or Stuck?

- Re-read the relevant guide
- Check the [CONCEPTS.md](../CONCEPTS.md) for deeper understanding
- Run the examples to see working code
- Experiment in the REPL
- Review solutions after attempting exercises

---

## Let's Begin!

Start with **[Understanding Child Processes](guides/01-understanding-child-processes.md)** and work your way through the guides. Take your time to understand each concept before moving on.

Remember: Child processes are powerful tools for integrating Node.js with external programs and distributing work. Understanding them well opens up many possibilities!
