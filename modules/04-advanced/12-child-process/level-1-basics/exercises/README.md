# Level 1: Basics - Exercises

Welcome to the Child Process exercises! These hands-on exercises will help you master the fundamentals of creating and managing child processes in Node.js.

## Overview

This directory contains 5 progressive exercises that cover all essential aspects of the `child_process` module. Each exercise builds upon concepts from previous ones, guiding you from simple command execution to building a complete CLI tool.

## Exercises

### Exercise 1: Basic Command Execution with exec()
**File:** `exercise-1.js`
**Difficulty:** ⭐ Easy
**Time:** 30-45 minutes

Learn to execute system commands using `child_process.exec()` and handle their output.

**Topics Covered:**
- Using exec() to run shell commands
- Handling stdout, stderr, and errors
- Working with callbacks and promises
- Setting timeouts and buffer limits
- Executing multiple commands sequentially

**What You'll Build:**
A system information utility that executes various commands and displays their output.

**Key Concepts:**
- `exec()` buffers all output in memory
- Callback signature: `(error, stdout, stderr)`
- Timeout and maxBuffer options
- When to use exec() vs other methods

**Run It:**
```bash
node exercise-1.js
```

---

### Exercise 2: Working with spawn() and Streams
**File:** `exercise-2.js`
**Difficulty:** ⭐⭐ Medium
**Time:** 45-60 minutes

Master `child_process.spawn()` for streaming command output and handling large data.

**Topics Covered:**
- Using spawn() with command and arguments
- Working with stdout/stderr streams
- Processing data in chunks
- Listening to process events (close, exit, error)
- Piping between processes
- Providing input via stdin

**What You'll Build:**
Tools that stream data, pipe between processes, and handle large output efficiently.

**Key Concepts:**
- spawn() returns streams, not buffered output
- Data arrives in chunks via 'data' events
- 'close' vs 'exit' events
- spawn() is better for large output
- Process piping: `proc1.stdout.pipe(proc2.stdin)`

**Run It:**
```bash
node exercise-2.js
```

---

### Exercise 3: Handling Errors Properly
**File:** `exercise-3.js`
**Difficulty:** ⭐⭐ Medium
**Time:** 45-60 minutes

Build robust error handling for all types of child process failures.

**Topics Covered:**
- Command not found (ENOENT) errors
- Non-zero exit codes
- Timeout handling
- Signal termination (SIGTERM, SIGKILL)
- Retry mechanisms with exponential backoff
- Comprehensive error reporting

**What You'll Build:**
Error handling utilities that gracefully manage all failure scenarios.

**Key Concepts:**
- Always listen to 'error' event on child processes
- ENOENT means "Error NO ENTry" - command not found
- Exit code 0 = success, non-zero = failure
- Use timeouts to prevent hanging
- Clean up resources to prevent leaks
- Provide actionable error messages

**Run It:**
```bash
node exercise-3.js
```

---

### Exercise 4: Process Communication with fork()
**File:** `exercise-4.js`
**Difficulty:** ⭐⭐⭐ Advanced
**Time:** 60-90 minutes

Learn to create Node.js child processes and communicate via IPC (Inter-Process Communication).

**Topics Covered:**
- Using fork() for Node.js processes
- Sending messages with process.send()
- Receiving messages with process.on('message')
- Request-response patterns
- Worker pool implementation
- Bidirectional streaming
- Offloading CPU-intensive tasks

**What You'll Build:**
Worker pools, request-response systems, and CPU task offloaders.

**Key Concepts:**
- fork() creates a new Node.js process with IPC
- IPC channel established automatically
- Perfect for CPU-intensive work
- Worker pools manage multiple child processes
- Correlation IDs match requests with responses
- Handle worker crashes and restarts

**Run It:**
```bash
node exercise-4.js
```

**Note:** You'll need to create separate worker files for this exercise.

---

### Exercise 5: Building a Simple CLI Tool
**File:** `exercise-5.js`
**Difficulty:** ⭐⭐⭐ Advanced
**Time:** 90-120 minutes

Integrate all concepts to build a production-quality task runner CLI tool.

**Topics Covered:**
- Combining exec(), spawn(), and fork()
- Task configuration and dependency management
- Parallel and sequential execution
- Progress tracking and reporting
- Signal handling for graceful shutdown
- CLI argument parsing
- User-friendly output

**What You'll Build:**
A complete task runner that executes configured tasks with dependencies.

**Key Concepts:**
- Use the right tool for each job
- Manage concurrent processes effectively
- Provide clear user feedback
- Handle cleanup on exit
- Build production-ready error handling
- Create great developer experience

**Run It:**
```bash
node exercise-5.js
```

---

## Learning Path

### Recommended Order
1. **Start with Exercise 1** - Get comfortable with exec()
2. **Move to Exercise 2** - Understand spawn() and streams
3. **Practice Exercise 3** - Master error handling
4. **Challenge with Exercise 4** - Learn fork() and IPC
5. **Build with Exercise 5** - Integrate everything

### Time Commitment
- **Minimum:** 4-5 hours (basic completion)
- **Recommended:** 6-8 hours (thorough understanding)
- **Mastery:** 10+ hours (with bonus challenges)

### Prerequisites
Before starting, you should understand:
- Basic Node.js programming
- Async/await and Promises
- Stream concepts (helpful but not required)
- Command-line basics
- Process concepts

## Getting Started

### Setup
1. Navigate to this directory
2. Read the exercise file comments carefully
3. Implement TODOs one at a time
4. Test frequently as you build
5. Compare with solutions when complete

### Running Exercises
Each exercise file contains:
- Detailed instructions in comments
- TODO markers for implementation
- Testing guidelines
- Example output
- Learning notes section

To run an exercise:
```bash
# Uncomment the main() call at the bottom of the file
node exercise-1.js
```

### Getting Help
1. Read the inline comments carefully
2. Review the guides in `/guides` directory
3. Check the examples in `/examples` directory
4. Refer to solutions in `/solutions` directory
5. Read Node.js documentation

## Tips for Success

### 1. Read First, Code Second
- Read all comments before writing code
- Understand the goal before implementing
- Review examples and guides

### 2. Test Incrementally
- Implement one TODO at a time
- Test after each implementation
- Don't move on until it works

### 3. Handle Errors Early
- Add error handling as you code
- Test error scenarios
- Don't leave error handling for later

### 4. Use the Examples
- Review example files in `/examples`
- Run examples to see patterns
- Adapt examples to exercises

### 5. Take Notes
- Fill out "Learning Notes" sections
- Write what you learned
- Note questions for later research

## Common Challenges

### Challenge 1: "Command not found"
**Problem:** spawn/exec fails with ENOENT
**Solution:**
- Check if command is in PATH
- Use full path to executable
- Verify command spelling

### Challenge 2: "Output is truncated"
**Problem:** Large output gets cut off with exec()
**Solution:**
- Use spawn() for large output
- Increase maxBuffer option
- Process data in chunks

### Challenge 3: "Process hangs"
**Problem:** Child process doesn't exit
**Solution:**
- Set appropriate timeout
- Check if stdin needs to be closed
- Listen to 'close' event, not just 'exit'

### Challenge 4: "Messages not received"
**Problem:** IPC messages aren't arriving
**Solution:**
- Verify fork() is used (not spawn)
- Check message handler is set up
- Ensure child process is ready

## Testing Your Solutions

### Basic Testing
```bash
# Run each exercise
node exercise-1.js
node exercise-2.js
node exercise-3.js
node exercise-4.js
node exercise-5.js
```

### Testing Error Handling
Try these scenarios:
- Non-existent commands
- Invalid arguments
- Commands that timeout
- Commands with large output
- Commands that fail

### Validation Checklist
- [ ] All TODOs implemented
- [ ] No unhandled promise rejections
- [ ] Proper error messages
- [ ] Resources cleaned up
- [ ] Output is readable
- [ ] Edge cases handled

## Next Steps

### After Completing Exercises
1. Compare your code with solutions
2. Note differences and improvements
3. Implement bonus challenges
4. Try extending the exercises
5. Apply to your own projects

### Bonus Challenges
Each exercise includes bonus challenges:
- Add features not in requirements
- Improve error messages
- Optimize performance
- Add configuration options
- Create additional tools

### Move to Level 2
Once comfortable with these exercises:
1. Review all solutions thoroughly
2. Ensure you understand key concepts
3. Complete bonus challenges
4. Progress to Level 2 (Intermediate)

## Resources

### Documentation
- [Node.js child_process API](https://nodejs.org/api/child_process.html)
- [Streams API](https://nodejs.org/api/stream.html)
- [Process API](https://nodejs.org/api/process.html)

### Guides (in this module)
- [Understanding Child Processes](../guides/01-understanding-child-processes.md)
- [exec() Method](../guides/02-exec-method.md)
- [spawn() Method](../guides/03-spawn-method.md)
- [execFile vs exec](../guides/04-execFile-vs-exec.md)
- [fork() Method](../guides/05-fork-method.md)
- [Choosing the Right Method](../guides/06-choosing-the-right-method.md)

### Examples
Check the `/examples` directory for working code samples.

### Solutions
Complete solutions are available in `/solutions` directory.

## FAQ

**Q: Can I use async/await instead of callbacks?**
A: Yes! Wrapping callbacks in Promises is recommended.

**Q: What if a command doesn't exist on my system?**
A: Use platform-appropriate commands or install required tools.

**Q: Should I use ES6 modules or CommonJS?**
A: These exercises use CommonJS (require) to match Node.js child_process API.

**Q: Can I use external libraries?**
A: Try using only built-in modules first. Libraries are great for production.

**Q: How do I know if my solution is correct?**
A: If it works and handles errors gracefully, it's correct! Compare with solutions for best practices.

---

**Ready to begin?** Start with [Exercise 1: Basic Command Execution](./exercise-1.js)

Good luck and happy coding!
