# Level 2 Exercises: Intermediate Child Process Operations

These hands-on exercises test your understanding of intermediate child process concepts.

## Overview

Complete these exercises to practice:
- Stream processing and piping
- Advanced IPC patterns
- Process pool implementation
- Signal handling
- Building real-world tools

## Exercises

### Exercise 1: Stream Processing Task
**File:** `exercise-1.js`
**Difficulty:** Intermediate
**Time:** 30-40 minutes

Build a log processor that reads log files using child processes, filters by severity level, and collects statistics using stream piping.

**Skills Practiced:**
- Working with process streams
- Stream piping and transformation
- Backpressure handling
- Aggregating stream data

**To Test:**
```bash
node exercise-1.js
```

**Key Concepts:**
- Use `spawn()` with `cat` or similar to read files
- Create `Transform` streams to process data
- Use `pipe()` for automatic backpressure
- Handle stream events properly

---

### Exercise 2: IPC Messaging System
**File:** `exercise-2.js`
**Difficulty:** Intermediate
**Time:** 35-45 minutes

Create a message broker that coordinates communication between parent and multiple worker processes using IPC.

**Skills Practiced:**
- Advanced IPC patterns
- Request-response implementation
- Message broadcasting
- Timeout handling
- Message routing

**To Test:**
```bash
node exercise-2.js
```

**Key Concepts:**
- Use `fork()` to create workers
- Implement request-response with promises
- Track pending requests with unique IDs
- Handle timeouts with `setTimeout()`
- Route messages to specific workers

---

### Exercise 3: Process Pool Implementation
**File:** `exercise-3.js`
**Difficulty:** Intermediate
**Time:** 40-50 minutes

Build a worker pool that efficiently manages multiple worker processes, distributes tasks, and handles worker failures.

**Skills Practiced:**
- Worker pool architecture
- Task queuing
- Load distribution
- Error recovery
- Worker replacement

**To Test:**
```bash
node exercise-3.js
```

**Key Concepts:**
- Track worker state (busy/idle)
- Queue tasks when all workers busy
- Detect and replace crashed workers
- Process queue when workers available
- Collect pool statistics

---

### Exercise 4: Signal Handling
**File:** `exercise-4.js`
**Difficulty:** Intermediate
**Time:** 30-40 minutes

Build a process manager that handles signals for graceful shutdown with timeout-based escalation to force kill.

**Skills Practiced:**
- Sending signals to processes
- Graceful shutdown patterns
- Timeout implementation
- Signal propagation
- Process state tracking

**To Test:**
```bash
node exercise-4.js
```

**Key Concepts:**
- Send `SIGTERM` for graceful shutdown
- Escalate to `SIGKILL` after timeout
- Track process exit state
- Handle multiple processes
- Wait for all to exit

---

### Exercise 5: Build a Simple Build Tool
**File:** `exercise-5.js`
**Difficulty:** Intermediate-Advanced
**Time:** 45-60 minutes

Create a build tool that runs multiple build steps in parallel with dependency management, failure handling, and progress reporting.

**Skills Practiced:**
- Parallel process execution
- Dependency resolution
- Concurrency limiting
- Output collection
- Error handling
- Build orchestration

**To Test:**
```bash
node exercise-5.js
```

**Key Concepts:**
- Manage build step dependencies
- Limit concurrent execution
- Handle critical vs non-critical failures
- Track timing and results
- Coordinate multiple processes

---

## How to Approach These Exercises

### 1. Read the Requirements
- Understand what you need to build
- Note the methods you need to implement
- Review the test expectations

### 2. Study Related Examples
Before coding, review the corresponding examples:
- Exercise 1 → `examples/01-process-streams.js`
- Exercise 2 → `examples/02-ipc-communication.js`
- Exercise 3 → `examples/05-process-pooling.js`
- Exercise 4 → `examples/03-process-signals.js`
- Exercise 5 → Uses concepts from multiple examples

### 3. Read the Guides
Consult the guides for patterns and best practices:
- `guides/01-working-with-streams.md`
- `guides/02-inter-process-communication.md`
- `guides/03-process-lifecycle.md`
- `guides/04-handling-signals.md`
- `guides/06-process-pooling-patterns.md`

### 4. Implement Incrementally
- Start with the simplest method
- Test each method as you implement it
- Use the provided test code to verify
- Debug issues before moving on

### 5. Run the Tests
Each exercise has built-in tests:
```bash
node exercise-1.js
node exercise-2.js
# etc.
```

Look for ✓ and ✗ symbols to see what's working.

## Success Criteria

For each exercise, your implementation should:
- Pass all the provided tests
- Handle errors gracefully
- Clean up resources properly
- Follow the hints provided
- Use appropriate child process methods

## Common Pitfalls

### Exercise 1 (Streams)
- ❌ Not handling stream errors
- ❌ Not closing streams properly
- ❌ Buffering everything in memory
- ✅ Use pipe() for backpressure
- ✅ Handle all stream events

### Exercise 2 (IPC)
- ❌ Not tracking message IDs
- ❌ Missing timeout handling
- ❌ Not cleaning up pending requests
- ✅ Use Map for pending requests
- ✅ Clear timeouts when response received

### Exercise 3 (Pool)
- ❌ Not tracking worker state
- ❌ Not replacing crashed workers
- ❌ Not processing queued tasks
- ✅ Mark workers busy/idle
- ✅ Auto-replace crashed workers

### Exercise 4 (Signals)
- ❌ Not implementing timeout
- ❌ Not force-killing stuck processes
- ❌ Not tracking process state
- ✅ Escalate SIGTERM → SIGKILL
- ✅ Wait for all processes

### Exercise 5 (Build Tool)
- ❌ Ignoring dependencies
- ❌ Not limiting concurrency
- ❌ Not handling failures
- ✅ Respect step dependencies
- ✅ Limit parallel execution

## Getting Help

If you're stuck:

1. **Read the hints** in the exercise file
2. **Check the examples** for similar patterns
3. **Consult the guides** for detailed explanations
4. **Review the test code** to understand expectations
5. **Look at the solutions** (after trying yourself!)

## Solutions

After attempting each exercise, compare your solution with the reference implementation in `../solutions/`.

Solutions demonstrate:
- Best practices
- Error handling patterns
- Efficient implementations
- Production-ready code

## Next Steps

After completing these exercises:

1. **Review your solutions** against the reference implementations
2. **Experiment** with variations and edge cases
3. **Combine concepts** to build more complex systems
4. **Move to Level 3** for advanced patterns

---

Remember: The goal is to understand the patterns, not just to pass the tests. Take time to experiment and understand why things work!
