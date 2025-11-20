# Level 2: Intermediate Child Process Operations

Master advanced techniques for managing child processes, including streams, IPC, signals, and process pooling.

## Learning Objectives

By completing this level, you will:

- ✅ Master process stream manipulation and piping
- ✅ Implement advanced inter-process communication (IPC) patterns
- ✅ Handle process signals (SIGTERM, SIGKILL, SIGHUP, etc.)
- ✅ Manage environment variables in child processes
- ✅ Implement process pooling for concurrent operations
- ✅ Pipe data between multiple processes
- ✅ Handle process lifecycle events comprehensively
- ✅ Build production-ready child process systems

---

## Prerequisites

- Completion of Level 1 (Child Process Basics)
- Understanding of Node.js streams
- Familiarity with async/await
- Basic understanding of Unix signals (helpful)
- Event-driven programming concepts

---

## What You'll Learn

### Core Topics

1. **Process Streams and Piping**
   - Working with stdin, stdout, stderr
   - Piping between processes
   - Stream transformation
   - Backpressure handling

2. **Advanced IPC Communication**
   - Complex message patterns
   - Request-response patterns
   - Broadcasting to multiple processes
   - Handling IPC errors

3. **Process Signals**
   - Understanding Unix signals
   - Sending and receiving signals
   - Graceful shutdown patterns
   - Signal propagation

4. **Environment Variables**
   - Passing environment to child processes
   - Modifying process environment
   - Security considerations
   - Environment isolation

5. **Process Pooling**
   - Implementing worker pools
   - Load balancing
   - Resource management
   - Auto-scaling patterns

6. **Piping Between Processes**
   - Chaining multiple processes
   - Building pipelines
   - Error handling in pipelines
   - Stream composition

---

## Time Commitment

**Estimated time**: 2-3 hours
- Reading guides: 60-90 minutes
- Studying examples: 30-45 minutes
- Exercises: 60-90 minutes
- Experimentation: 30-45 minutes

---

## Conceptual Guides

Build your understanding with these comprehensive guides:

### Essential Reading

1. **[Working with Streams](guides/01-working-with-streams.md)** (15 min)
   - Process stream fundamentals
   - Reading and writing streams
   - Piping and transformation
   - Backpressure management

2. **[Inter-Process Communication](guides/02-inter-process-communication.md)** (15 min)
   - Advanced IPC patterns
   - Message protocols
   - Error handling
   - Best practices

3. **[Process Lifecycle](guides/03-process-lifecycle.md)** (12 min)
   - Lifecycle events
   - State management
   - Cleanup patterns
   - Resource disposal

4. **[Handling Signals](guides/04-handling-signals.md)** (12 min)
   - Unix signal overview
   - Signal types and meanings
   - Graceful shutdown
   - Signal safety

5. **[Environment Variables](guides/05-environment-variables.md)** (10 min)
   - Environment management
   - Security implications
   - Common patterns
   - Best practices

6. **[Process Pooling Patterns](guides/06-process-pooling-patterns.md)** (15 min)
   - Worker pool architecture
   - Load balancing strategies
   - Resource limits
   - Scaling patterns

---

## Key Concepts

### Advanced Stream Handling

```javascript
const { spawn } = require('child_process');

// Pipe input to a process and capture output
const grep = spawn('grep', ['pattern']);
const wc = spawn('wc', ['-l']);

// Create a pipeline
process.stdin.pipe(grep.stdin);
grep.stdout.pipe(wc.stdin);
wc.stdout.pipe(process.stdout);

// Handle errors in the pipeline
grep.on('error', (err) => console.error('grep error:', err));
wc.on('error', (err) => console.error('wc error:', err));
```

### Advanced IPC Patterns

```javascript
const { fork } = require('child_process');

class WorkerPool {
  constructor(script, size) {
    this.workers = [];
    this.tasks = [];

    for (let i = 0; i < size; i++) {
      const worker = fork(script);
      worker.on('message', (result) => this.handleResult(worker, result));
      this.workers.push({ process: worker, busy: false });
    }
  }

  execute(task) {
    return new Promise((resolve, reject) => {
      this.tasks.push({ task, resolve, reject });
      this.assignTask();
    });
  }

  assignTask() {
    const available = this.workers.find(w => !w.busy);
    if (available && this.tasks.length > 0) {
      const { task, resolve, reject } = this.tasks.shift();
      available.busy = true;
      available.resolve = resolve;
      available.reject = reject;
      available.process.send(task);
    }
  }

  handleResult(worker, result) {
    const w = this.workers.find(w => w.process === worker);
    w.busy = false;
    w.resolve(result);
    this.assignTask();
  }
}
```

### Signal Handling

```javascript
const { spawn } = require('child_process');

const child = spawn('long-running-process');

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');

  // Send SIGTERM to child
  child.kill('SIGTERM');

  // Force kill after timeout
  setTimeout(() => {
    if (!child.killed) {
      console.log('Force killing child process');
      child.kill('SIGKILL');
    }
    process.exit(0);
  }, 5000);
});
```

### Environment Variable Management

```javascript
const { spawn } = require('child_process');

// Pass custom environment
const child = spawn('node', ['script.js'], {
  env: {
    ...process.env,           // Inherit parent environment
    NODE_ENV: 'production',   // Add custom variables
    API_KEY: 'secret',
    DEBUG: 'app:*'
  }
});

// Isolated environment (no inheritance)
const isolated = spawn('node', ['script.js'], {
  env: {
    PATH: process.env.PATH,   // Only include what's needed
    NODE_ENV: 'production'
  }
});
```

---

## Quick Start

### Stream Piping Example

```javascript
const { spawn } = require('child_process');

// Create a pipeline: cat file.txt | grep "pattern" | wc -l
const cat = spawn('cat', ['file.txt']);
const grep = spawn('grep', ['pattern']);
const wc = spawn('wc', ['-l']);

cat.stdout.pipe(grep.stdin);
grep.stdout.pipe(wc.stdin);

wc.stdout.on('data', (data) => {
  console.log(`Lines matching pattern: ${data.toString().trim()}`);
});
```

### Simple Process Pool

```javascript
const { fork } = require('child_process');

class SimplePool {
  constructor(workerScript, size = 4) {
    this.workers = [];
    for (let i = 0; i < size; i++) {
      this.workers.push(fork(workerScript));
    }
    this.nextWorker = 0;
  }

  send(message) {
    const worker = this.workers[this.nextWorker];
    this.nextWorker = (this.nextWorker + 1) % this.workers.length;
    worker.send(message);
    return worker;
  }
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Not Handling Stream Errors

```javascript
// WRONG - stream errors not handled
const child = spawn('command');
child.stdout.pipe(destination);
// If 'command' fails, the app might crash

// CORRECT - handle all stream errors
child.stdout.on('error', (err) => console.error('stdout error:', err));
child.stderr.on('error', (err) => console.error('stderr error:', err));
child.on('error', (err) => console.error('process error:', err));
```

### ❌ Pitfall 2: Signal Propagation Issues

```javascript
// WRONG - not propagating signals to children
process.on('SIGTERM', () => {
  cleanup();
  process.exit(0); // Orphans child processes!
});

// CORRECT - terminate children first
process.on('SIGTERM', async () => {
  await terminateChildren();
  cleanup();
  process.exit(0);
});
```

### ❌ Pitfall 3: Environment Variable Leaks

```javascript
// DANGEROUS - leaking sensitive data to child
const child = spawn('untrusted-command', [], {
  env: process.env // Includes ALL environment variables!
});

// SAFE - only pass necessary variables
const child = spawn('untrusted-command', [], {
  env: {
    PATH: process.env.PATH,
    HOME: process.env.HOME
    // No sensitive variables
  }
});
```

### ❌ Pitfall 4: Process Pool Resource Leaks

```javascript
// WRONG - processes never cleaned up
class BadPool {
  addWorker() {
    this.workers.push(fork('worker.js'));
  }
}

// CORRECT - proper cleanup
class GoodPool {
  destroy() {
    this.workers.forEach(w => w.kill());
    this.workers = [];
  }
}
```

---

## Examples

Explore these practical examples:

### Example Files

1. **[Process Streams](examples/01-process-streams.js)**
   - Working with stdin/stdout/stderr
   - Stream piping
   - Transformation streams
   - Backpressure handling

2. **[IPC Communication](examples/02-ipc-communication.js)**
   - Advanced message patterns
   - Request-response
   - Broadcasting
   - Error handling

3. **[Process Signals](examples/03-process-signals.js)**
   - Sending signals
   - Receiving signals
   - Graceful shutdown
   - Signal propagation

4. **[Environment Variables](examples/04-environment-variables.js)**
   - Passing environment
   - Modifying environment
   - Security patterns
   - Isolation

5. **[Process Pooling](examples/05-process-pooling.js)**
   - Worker pool implementation
   - Load balancing
   - Resource management
   - Error recovery

6. **[Piping Processes](examples/06-piping-processes.js)**
   - Building pipelines
   - Chaining processes
   - Error handling
   - Stream composition

7. **[Examples README](examples/README.md)**
   - Overview and descriptions
   - How to run examples
   - Expected output

---

## Exercises

Test your skills with these challenges:

### Exercise 1: Stream Processing
Build a log processor that reads from stdin, filters lines, and writes to stdout.

**Skills practiced:**
- Stream manipulation
- Piping
- Transformation
- Error handling

### Exercise 2: IPC Messaging System
Create a message broker between parent and multiple child processes.

**Skills practiced:**
- Advanced IPC
- Message routing
- Error handling
- State management

### Exercise 3: Process Pool
Implement a worker pool for CPU-intensive tasks.

**Skills practiced:**
- Process management
- Load balancing
- Resource limits
- Error recovery

### Exercise 4: Signal Handling
Build a process manager that handles graceful shutdown.

**Skills practiced:**
- Signal handling
- Graceful shutdown
- Cleanup patterns
- Timeout management

### Exercise 5: Build Tool
Create a simple build tool that runs multiple processes in parallel.

**Skills practiced:**
- Process coordination
- Parallel execution
- Error aggregation
- Progress reporting

---

## Learning Path

### Recommended Sequence

1. **Read Conceptual Guides** (90 minutes)
   - Start with [Working with Streams](guides/01-working-with-streams.md)
   - Read all 6 guides in order
   - Take notes on advanced patterns

2. **Study Examples** (45 minutes)
   - Run each example file
   - Modify parameters and observe behavior
   - Understand the advanced techniques

3. **Complete Exercises** (90 minutes)
   - Work through each exercise
   - Try implementing without looking at solutions
   - Experiment with different approaches

4. **Review Solutions** (30 minutes)
   - Compare with your solutions
   - Understand alternative implementations
   - Note production-ready patterns

---

## Success Criteria

You've mastered Level 2 when you can:

- [ ] Manipulate process streams effectively
- [ ] Implement complex IPC communication patterns
- [ ] Handle Unix signals properly
- [ ] Manage environment variables securely
- [ ] Build and manage process pools
- [ ] Create process pipelines
- [ ] Implement graceful shutdown patterns
- [ ] Handle errors in multi-process systems
- [ ] Apply backpressure management
- [ ] Optimize process resource usage

---

## What's Next?

After completing Level 2, you'll be ready for:

### Level 3: Advanced Child Process Patterns
- Cluster management
- Process monitoring and health checks
- Advanced error recovery
- Performance optimization
- Security hardening
- Production deployment patterns

---

## Additional Practice

Want more challenges? Try these projects:

1. **Task Runner**
   - Execute tasks in parallel with a worker pool
   - Handle dependencies between tasks
   - Implement retry logic
   - Report progress in real-time

2. **Log Aggregator**
   - Collect logs from multiple child processes
   - Parse and filter log entries
   - Write to different destinations
   - Handle log rotation

3. **Process Supervisor**
   - Monitor child processes
   - Restart failed processes
   - Handle graceful shutdown
   - Collect process metrics

4. **Build System**
   - Run build steps in parallel
   - Handle build failures
   - Cache results
   - Report build status

---

## Resources

### Official Documentation
- [Node.js child_process Documentation](https://nodejs.org/api/child_process.html)
- [Node.js Stream Documentation](https://nodejs.org/api/stream.html)
- [Node.js Process Documentation](https://nodejs.org/api/process.html)
- [Unix Signal Documentation](https://man7.org/linux/man-pages/man7/signal.7.html)

### Tools
- **Node.js REPL**: Interactive testing
- **Process Monitor**: `ps`, `top`, `htop`
- **Stream Debugging**: Enable debug logs
- **Signal Testing**: `kill` command

---

## Questions or Stuck?

- Re-read the relevant guide
- Check the [CONCEPTS.md](../CONCEPTS.md) for deeper understanding
- Run the examples to see working patterns
- Experiment with different configurations
- Review solutions after attempting exercises
- Test with real-world scenarios

---

## Let's Begin!

Start with **[Working with Streams](guides/01-working-with-streams.md)** and work your way through the guides. These intermediate concepts build on your basic knowledge to create production-ready systems.

Remember: Mastering process management unlocks the ability to build scalable, resilient applications that can handle complex workflows efficiently!
