# Level 1: Basics - Solutions

This directory contains comprehensive, production-quality solutions for all Level 1 exercises in the Child Process module. Each solution demonstrates best practices, proper error handling, and includes extensive documentation.

## Overview

These solutions cover fundamental child process operations:
- Executing system commands with exec()
- Streaming data with spawn()
- Comprehensive error handling
- Inter-process communication with fork()
- Building production-ready CLI tools

## Solutions

### Exercise 1: Basic Command Execution
**File:** `exercise-1-solution.js`

Complete implementation of exec() usage patterns including system information retrieval, directory listing, timeout handling, and sequential command execution.

**Key Concepts:**
- Promise-based exec() usage
- Platform-specific command handling (Windows/Unix)
- Timeout and maxBuffer configuration
- Comprehensive error categorization
- Multi-command execution patterns

**Run It:**
```bash
node exercise-1-solution.js
```

**What You'll See:**
- System information (date, user, hostname)
- Directory listings
- Git operations (if in a git repo)
- Command execution timing
- Success/failure summaries

---

### Exercise 2: Streaming with spawn()
**File:** `exercise-2-solution.js`

Demonstrates spawn() for streaming data, real-time output processing, process piping, and stdin/stdout interaction.

**Key Concepts:**
- Stream-based data handling
- Real-time output processing
- Process piping (ls | grep pattern)
- Providing input via stdin
- Large output handling without memory issues

**Run It:**
```bash
node exercise-2-solution.js
```

---

### Exercise 3: Error Handling
**File:** `exercise-3-solution.js`

Comprehensive error handling for all child process failure modes including ENOENT errors, non-zero exit codes, timeouts, and signal termination.

**Key Concepts:**
- ENOENT (command not found) handling
- Exit code interpretation
- Timeout implementation with cleanup
- Signal handling (SIGTERM, SIGKILL)
- Retry mechanisms with exponential backoff
- User-friendly error messages

**Run It:**
```bash
node exercise-3-solution.js
```

---

### Exercise 4: IPC with fork()
**File:** `exercise-4-solution.js`

Full implementation of parent-child communication, request-response patterns, worker pools, and CPU task offloading.

**Key Concepts:**
- fork() for Node.js processes
- Message-based IPC
- Request-response with correlation IDs
- Worker pool implementation
- CPU-intensive task offloading
- Process lifecycle management

**Run It:**
```bash
# Note: Requires worker files
node exercise-4-solution.js
```

**Worker Files Needed:**
Create `worker-basic.js`, `worker-calculator.js`, and `worker-cpu.js` as described in the exercise.

---

### Exercise 5: CLI Tool
**File:** `exercise-5-solution.js`

Production-ready task runner CLI tool integrating all child_process methods with task configuration, dependency management, and progress tracking.

**Key Concepts:**
- Combining exec(), spawn(), and fork()
- Task configuration and parsing
- Parallel and sequential execution
- Progress tracking and reporting
- Signal handling for graceful shutdown
- CLI argument parsing

**Run It:**
```bash
node exercise-5-solution.js --help
node exercise-5-solution.js build
node exercise-5-solution.js --verbose test
```

---

## Running All Solutions

Test each solution:

```bash
# Solution 1 - exec() operations
node exercise-1-solution.js

# Solution 2 - spawn() streaming
node exercise-2-solution.js

# Solution 3 - Error handling
node exercise-3-solution.js

# Solution 4 - fork() and IPC
# (Create worker files first)
node exercise-4-solution.js

# Solution 5 - CLI tool
node exercise-5-solution.js
```

## Key Takeaways

### 1. Method Selection
- **exec()** - Simple commands, small output
- **spawn()** - Large output, streaming needed
- **execFile()** - Security, no shell needed
- **fork()** - Node.js parallel processing

### 2. Error Handling Essentials
- Always handle 'error' event on child processes
- Check exit codes (0 = success)
- ENOENT means command not found
- Use timeouts to prevent hanging
- Provide actionable error messages

### 3. Stream Management
- spawn() returns streams, not buffered output
- Listen to 'data', 'end', 'error' events
- 'close' vs 'exit' - close happens after streams flush
- Clean up listeners to prevent memory leaks

### 4. IPC Patterns
- fork() creates IPC channel automatically
- Use process.send() and process.on('message')
- Implement correlation IDs for request-response
- Handle worker crashes and restart them
- Limit worker count (use os.cpus().length)

### 5. Production Patterns
- Promise-wrap callback APIs
- Set appropriate timeouts
- Validate all inputs
- Clean up resources (timers, processes)
- Log errors for monitoring
- Provide user-friendly output

## Common Patterns

### Pattern 1: Promise Wrapper
```javascript
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

async function run() {
  const { stdout } = await execAsync('command');
  return stdout;
}
```

### Pattern 2: Stream Processing
```javascript
const child = spawn('command', ['args']);
let output = '';

child.stdout.on('data', (chunk) => {
  output += chunk.toString();
});

child.on('close', (code) => {
  if (code === 0) {
    processOutput(output);
  }
});
```

### Pattern 3: Request-Response IPC
```javascript
function sendRequest(worker, data) {
  return new Promise((resolve) => {
    const id = Date.now();

    function handler(msg) {
      if (msg.id === id) {
        worker.off('message', handler);
        resolve(msg.result);
      }
    }

    worker.on('message', handler);
    worker.send({ id, data });
  });
}
```

### Pattern 4: Worker Pool
```javascript
class WorkerPool {
  constructor(script, size) {
    this.workers = Array(size)
      .fill()
      .map(() => ({
        child: fork(script),
        busy: false
      }));
  }

  async execute(task) {
    const worker = await this.getAvailable();
    worker.busy = true;

    const result = await sendTask(worker.child, task);

    worker.busy = false;
    return result;
  }

  getAvailable() {
    return new Promise((resolve) => {
      const check = () => {
        const worker = this.workers.find(w => !w.busy);
        if (worker) resolve(worker);
        else setTimeout(check, 10);
      };
      check();
    });
  }
}
```

## Best Practices Summary

### Security
- ✅ Never pass unsanitized user input to exec()
- ✅ Use execFile() for user-provided data
- ✅ Validate all inputs
- ✅ Use allowlists when possible
- ✅ Avoid shell injection vulnerabilities

### Performance
- ✅ Use spawn() for large output
- ✅ Reuse workers in pools
- ✅ Limit concurrent processes
- ✅ Clean up resources promptly
- ✅ Use streams instead of buffering

### Reliability
- ✅ Always set timeouts
- ✅ Handle all error types
- ✅ Implement retry logic
- ✅ Clean up on exit
- ✅ Log errors for debugging

### User Experience
- ✅ Provide clear progress indicators
- ✅ Show actionable error messages
- ✅ Support graceful shutdown
- ✅ Format output nicely
- ✅ Handle Ctrl+C properly

## Testing Recommendations

### Unit Testing
```javascript
// Mock child_process
jest.mock('child_process');

test('should execute command', async () => {
  exec.mockImplementation((cmd, callback) => {
    callback(null, 'output', '');
  });

  const result = await myFunction();
  expect(result).toBe('output');
});
```

### Integration Testing
```javascript
// Test with real processes
test('should spawn and get output', (done) => {
  const child = spawn('echo', ['hello']);
  let output = '';

  child.stdout.on('data', (data) => {
    output += data;
  });

  child.on('close', () => {
    expect(output.trim()).toBe('hello');
    done();
  });
});
```

## Troubleshooting

### Issue: "ENOENT" Error
**Problem:** Command not found in PATH
**Solution:**
- Check if command is installed
- Use full path: `/usr/bin/command`
- Verify PATH environment variable

### Issue: "maxBuffer exceeded"
**Problem:** Output larger than buffer
**Solution:**
- Increase maxBuffer option
- Use spawn() instead of exec()
- Process data in chunks

### Issue: Process hangs
**Problem:** Process doesn't exit
**Solution:**
- Set timeout option
- Close stdin if process waits for input
- Listen to 'close' not just 'exit'

### Issue: Messages not received (fork)
**Problem:** IPC not working
**Solution:**
- Verify using fork() not spawn()
- Ensure worker script exists
- Check message handler is set up
- Child must use process.send()

## Next Steps

After mastering these solutions:

1. **Compare your code** - See what's different
2. **Understand patterns** - Learn the "why" behind choices
3. **Try variations** - Modify solutions to learn more
4. **Build projects** - Apply to real-world problems
5. **Move to Level 2** - Advanced child process topics

## Additional Resources

### Documentation
- [Node.js child_process](https://nodejs.org/api/child_process.html)
- [Stream API](https://nodejs.org/api/stream.html)
- [Process API](https://nodejs.org/api/process.html)

### Related Topics
- **Worker Threads** - For shared memory scenarios
- **Cluster Module** - For load balancing
- **PM2** - Process manager for production

### Libraries
- **execa** - Better child_process API
- **cross-spawn** - Cross-platform spawn
- **concurrently** - Run multiple commands
- **p-queue** - Promise queue for rate limiting

---

**Congratulations!** You've completed Level 1. These solutions represent production-quality code you can reference and adapt for your projects.

Ready for more advanced topics? Move on to **Level 2: Intermediate**!
