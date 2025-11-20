# Level 2 Examples: Intermediate Child Process Operations

This directory contains practical examples demonstrating intermediate child process concepts.

## Overview

These examples build on the basics and show real-world patterns for:
- Stream manipulation and piping
- Advanced IPC communication
- Signal handling
- Environment management
- Process pooling
- Multi-process pipelines

## Examples

### 01-process-streams.js
**Working with Process Streams**

Demonstrates:
- Basic stream piping between processes
- Multi-process pipelines
- Writing to child process stdin
- Stream transformation with backpressure handling
- Bidirectional communication
- Separate handling of stdout and stderr
- Stream multiplexing

**Run:**
```bash
node 01-process-streams.js
```

**Key Concepts:**
- Piping process stdout to stdin
- Transform streams for data modification
- Handling backpressure in streams
- Multiplexing multiple process outputs

---

### 02-ipc-communication.js
**Advanced IPC Communication**

Demonstrates:
- Request-response pattern with promises
- Broadcasting to multiple workers
- Message queue pattern
- Heartbeat/keep-alive patterns
- Error handling in IPC
- Round-robin load balancing

**Run:**
```bash
node 02-ipc-communication.js
```

**Key Concepts:**
- Async request-response with workers
- Worker pool broadcasting
- Queue-based task distribution
- Health monitoring with heartbeats
- Load balancing strategies

---

### 03-process-signals.js
**Process Signals**

Demonstrates:
- Sending SIGTERM and SIGKILL
- Graceful shutdown patterns
- Graceful shutdown with force-kill timeout
- Signal handling in forked processes
- Coordinated shutdown of multiple processes
- Parent process signal handling

**Run:**
```bash
node 03-process-signals.js
```

**Key Concepts:**
- SIGTERM for graceful shutdown
- SIGKILL for force termination
- Timeout-based escalation
- Signal propagation
- Multi-process coordination

---

### 04-environment-variables.js
**Environment Variables**

Demonstrates:
- Inheriting parent environment
- Custom isolated environment
- Selective environment inheritance
- Environment for Node.js processes
- Environment variable interpolation
- Configuration patterns
- Security best practices

**Run:**
```bash
node 04-environment-variables.js
```

**Key Concepts:**
- Environment inheritance vs isolation
- Whitelist approach for security
- Configuration per environment
- Avoiding secret leakage

---

### 05-process-pooling.js
**Process Pooling**

Demonstrates:
- Basic worker pool with round-robin
- Load-balanced pool (task assignment to available workers)
- Auto-scaling pool (dynamic sizing)
- Resilient pool with error recovery

**Run:**
```bash
node 05-process-pooling.js
```

**Key Concepts:**
- Fixed vs dynamic pool sizing
- Load balancing strategies
- Auto-scaling based on queue depth
- Worker replacement on crash
- Pool statistics and monitoring

---

### 06-piping-processes.js
**Piping Between Processes**

Demonstrates:
- Basic two-process pipeline
- Three-process pipeline
- Pipeline with transform streams
- Bidirectional communication
- Complex multi-stage pipelines
- Error handling in pipelines
- Using Node.js pipeline() utility
- Dynamic pipeline construction

**Run:**
```bash
node 06-piping-processes.js
```

**Key Concepts:**
- Chaining process stdout to stdin
- Transform streams in pipelines
- Error propagation in multi-stage pipelines
- Pipeline builder pattern

---

## Running All Examples

To run all examples in sequence:

```bash
# Run individually
node 01-process-streams.js
node 02-ipc-communication.js
node 03-process-signals.js
node 04-environment-variables.js
node 05-process-pooling.js
node 06-piping-processes.js

# Or create a simple runner
for example in 0*.js; do
  echo "Running $example..."
  node "$example"
  echo "---"
done
```

## What You'll Learn

After studying these examples, you'll understand:

1. **Stream Management**
   - Piping between processes
   - Transform streams
   - Backpressure handling
   - Error handling in streams

2. **IPC Patterns**
   - Request-response
   - Broadcasting
   - Message queuing
   - Heartbeat monitoring

3. **Signal Handling**
   - Graceful vs forced termination
   - Timeout patterns
   - Multi-process coordination
   - Cleanup strategies

4. **Environment Control**
   - Inheritance patterns
   - Security considerations
   - Configuration management
   - Isolation techniques

5. **Process Pooling**
   - Pool sizing strategies
   - Load balancing
   - Auto-scaling
   - Error recovery

6. **Process Pipelines**
   - Building data pipelines
   - Error handling
   - Dynamic construction
   - Complex workflows

## Common Patterns

### Pattern 1: Graceful Shutdown
```javascript
const child = spawn('command');

process.on('SIGTERM', () => {
  child.kill('SIGTERM');

  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
    process.exit(0);
  }, 5000);
});
```

### Pattern 2: Worker Pool
```javascript
class WorkerPool {
  constructor(script, size) {
    this.workers = Array.from({ length: size }, () => ({
      process: fork(script),
      busy: false
    }));
  }

  execute(task) {
    const worker = this.workers.find(w => !w.busy);
    worker.busy = true;
    worker.process.send(task);
  }
}
```

### Pattern 3: Process Pipeline
```javascript
const stage1 = spawn('command1');
const stage2 = spawn('command2');
const stage3 = spawn('command3');

stage1.stdout.pipe(stage2.stdin);
stage2.stdout.pipe(stage3.stdin);

stage3.stdout.on('data', (data) => {
  console.log(data.toString());
});
```

## Tips for Experimentation

1. **Modify Parameters**
   - Change pool sizes
   - Adjust timeouts
   - Vary task durations

2. **Add Logging**
   - Track process lifecycle
   - Monitor resource usage
   - Debug stream flow

3. **Break Things**
   - Remove error handlers to see what happens
   - Send invalid data
   - Simulate crashes

4. **Combine Patterns**
   - Use multiple patterns together
   - Build complex workflows
   - Create production-ready systems

## Next Steps

After studying the examples:

1. Read the corresponding guides in `../guides/`
2. Complete the exercises in `../exercises/`
3. Experiment with your own variations
4. Build mini-projects using these patterns

## Resources

- [Node.js child_process Docs](https://nodejs.org/api/child_process.html)
- [Node.js Stream Docs](https://nodejs.org/api/stream.html)
- [Unix Signal Reference](https://man7.org/linux/man-pages/man7/signal.7.html)

---

Remember: These intermediate patterns are the foundation for building scalable, production-ready systems with child processes!
