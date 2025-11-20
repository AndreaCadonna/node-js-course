# Level 2 Solutions: Intermediate Child Process Operations

This directory contains complete, working solutions for all Level 2 exercises.

## Purpose

These solutions demonstrate:
- Best practices for child process management
- Production-ready error handling
- Efficient resource management
- Clear, maintainable code structure

## Using the Solutions

### When to Look at Solutions

1. **After attempting the exercise yourself** - Try to solve it first!
2. **When stuck on a specific part** - Use solutions as hints
3. **To compare approaches** - See alternative implementations
4. **To learn best practices** - Study the patterns used

### How to Use Solutions

Each solution can be run independently:

```bash
node solution-1.js
node solution-2.js
# etc.
```

Running a solution directly executes a demo that shows the implementation in action.

---

## Solutions Overview

### Solution 1: Stream Processing Task
**File:** `solution-1.js`

**Key Techniques:**
- Using `spawn()` with `cat` to read files
- Creating `Transform` streams for data processing
- Piping streams for automatic backpressure
- Handling stream errors properly
- Using grep for filtering

**Notable Patterns:**
```javascript
// Transform stream for counting
const counter = new Transform({
  transform: (chunk, encoding, callback) => {
    // Process chunk
    callback();
  }
});

// Piping for automatic backpressure
cat.stdout.pipe(counter);
```

**Error Handling:**
- Handles grep exit code 1 (no matches)
- Proper error propagation
- Stream error handling

---

### Solution 2: IPC Messaging System
**File:** `solution-2.js`

**Key Techniques:**
- Managing multiple forked workers
- Request-response with unique message IDs
- Using `Map` to track pending requests
- Timeout implementation with `setTimeout()`
- Broadcasting to all workers

**Notable Patterns:**
```javascript
// Pending request tracking
this.pendingRequests.set(id, { resolve, reject, timeoutId });

// Timeout handling
const timeoutId = setTimeout(() => {
  if (this.pendingRequests.has(id)) {
    this.pendingRequests.delete(id);
    reject(new Error('Request timeout'));
  }
}, timeout);
```

**Error Handling:**
- Request timeouts
- Worker disconnection handling
- Graceful shutdown

---

### Solution 3: Process Pool Implementation
**File:** `solution-3.js`

**Key Techniques:**
- Worker pool with task queuing
- Busy/idle worker tracking
- Automatic worker replacement on crash
- Task retry logic
- Graceful pool shutdown

**Notable Patterns:**
```javascript
// Worker state tracking
const worker = {
  process: fork(script),
  busy: false,
  currentTask: null
};

// Crash detection and replacement
process.on('exit', (code) => {
  if (code !== 0) {
    this.replaceWorker(worker);
  }
});
```

**Error Handling:**
- Worker crash detection
- Task rejection on failure
- Automatic worker replacement
- Queue processing on recovery

---

### Solution 4: Signal Handling
**File:** `solution-4.js`

**Key Techniques:**
- Process state tracking
- Graceful shutdown with SIGTERM
- Timeout-based escalation to SIGKILL
- Waiting for processes to exit
- Shutdown summary reporting

**Notable Patterns:**
```javascript
// Graceful shutdown with timeout
processes.forEach(p => p.kill('SIGTERM'));

// Wait for exit or timeout
while (Date.now() < deadline) {
  if (allExited) break;
  await sleep(100);
}

// Force kill remaining
remaining.forEach(p => p.kill('SIGKILL'));
```

**Error Handling:**
- Timeout escalation
- State tracking through exit events
- Summary of shutdown methods used

---

### Solution 5: Build a Simple Build Tool
**File:** `solution-5.js`

**Key Techniques:**
- Dependency resolution
- Concurrency limiting
- Parallel execution where possible
- Build step coordination
- Output collection

**Notable Patterns:**
```javascript
// Dependency checking
canRunStep(step, completed) {
  return step.dependsOn.every(dep => {
    const result = this.results.get(dep);
    return result && result.success;
  });
}

// Concurrency limiting
const slotsAvailable = this.maxConcurrency - this.running.size;
const toStart = ready.slice(0, slotsAvailable);
```

**Error Handling:**
- Critical vs non-critical failures
- Dependency validation
- Build summary reporting
- Process error handling

---

## Common Patterns Across Solutions

### 1. Resource Cleanup

All solutions properly clean up resources:

```javascript
// Shutdown pattern
async shutdown() {
  // Wait for completion
  await waitForTasks();

  // Clean up resources
  this.workers.forEach(w => w.kill());
  this.workers = [];
}
```

### 2. Error Propagation

Errors are caught and handled appropriately:

```javascript
process.on('error', reject);
process.on('close', (code) => {
  if (code === 0) {
    resolve(result);
  } else {
    reject(new Error(`Process failed: ${code}`));
  }
});
```

### 3. State Tracking

Process state is tracked throughout lifecycle:

```javascript
const processInfo = {
  id,
  pid: process.pid,
  state: 'running',
  exitCode: null,
  signal: null
};

process.on('exit', (code, signal) => {
  processInfo.state = 'exited';
  processInfo.exitCode = code;
  processInfo.signal = signal;
});
```

### 4. Statistics Collection

All solutions track relevant metrics:

```javascript
getStats() {
  return {
    total: this.items.length,
    active: this.items.filter(i => i.active).length,
    completed: this.stats.completed,
    failed: this.stats.failed
  };
}
```

## Learning from Solutions

### Compare Your Approach

When reviewing solutions:

1. **Compare structure** - How did you organize the code?
2. **Error handling** - Did you catch all error cases?
3. **Resource cleanup** - Are resources properly released?
4. **Edge cases** - Did you handle special cases?

### Extract Patterns

Identify reusable patterns:

- Request-response with timeouts
- Worker pool management
- Graceful shutdown
- Dependency resolution
- Concurrency limiting

### Understand Trade-offs

Solutions make specific choices:

- **Simplicity vs Features** - Basic implementation vs full-featured
- **Performance vs Clarity** - Optimized vs readable
- **Error Handling** - Fail-fast vs graceful degradation

## Best Practices Demonstrated

### 1. Proper Error Handling

```javascript
// Handle all error sources
process.on('error', handleError);
process.stdout.on('error', handleError);
process.stderr.on('error', handleError);
```

### 2. Resource Management

```javascript
// Track resources
const resources = [];

// Clean up on exit
process.on('exit', () => {
  resources.forEach(cleanup);
});
```

### 3. Timeout Patterns

```javascript
// Always include timeouts
const timer = setTimeout(() => {
  reject(new Error('Timeout'));
}, timeout);

// Clear on completion
operation.then(() => clearTimeout(timer));
```

### 4. State Machines

```javascript
// Clear state transitions
const states = {
  idle: ['starting'],
  starting: ['running', 'failed'],
  running: ['stopping', 'crashed'],
  stopping: ['stopped']
};
```

## Testing Solutions

Each solution includes a demo mode:

```bash
# Run solution directly to see demo
node solution-1.js
node solution-2.js
node solution-3.js
node solution-4.js
node solution-5.js
```

You can also import and use solutions as modules:

```javascript
const LogProcessor = require('./solution-1');
const processor = new LogProcessor();
await processor.processFile('app.log');
```

## Next Steps

After reviewing solutions:

1. **Re-implement without looking** - Test your understanding
2. **Add features** - Extend the solutions
3. **Optimize** - Improve performance
4. **Productionize** - Add logging, metrics, etc.
5. **Combine** - Use multiple patterns together

## Additional Resources

- Review the guides in `../guides/` for deeper understanding
- Study the examples in `../examples/` for more patterns
- Read the main README in `../` for learning path

---

Remember: These solutions show one way to solve each problem. There are often multiple valid approaches. The key is understanding the principles and patterns, not memorizing specific implementations.
