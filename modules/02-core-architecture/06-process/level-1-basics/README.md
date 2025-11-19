# Level 1: Process Basics

Master the fundamentals of the Node.js process object.

## Overview

This level introduces you to the core concepts of the Node.js process object. You'll learn how to interact with the current process, access environment variables, handle command-line arguments, work with standard I/O streams, and manage process lifecycle events. By the end of this level, you'll be comfortable building command-line applications and understanding how your Node.js programs interact with the operating system.

**Time to complete:** 2-3 hours

---

## Learning Objectives

By completing this level, you will:

- [ ] Understand what the process object is and why it's important
- [ ] Access process information (PID, version, platform, etc.)
- [ ] Read and write environment variables
- [ ] Parse command-line arguments effectively
- [ ] Use standard streams (stdin, stdout, stderr)
- [ ] Set appropriate exit codes
- [ ] Handle process lifecycle events
- [ ] Understand the difference between exit and beforeExit
- [ ] Build basic CLI applications
- [ ] Implement proper error handling for processes

---

## Prerequisites

- Basic JavaScript knowledge
- Understanding of the command line/terminal
- Node.js Module 1: File System (helpful but not required)
- Node.js Module 4: Events (helpful but not required)

---

## Topics Covered

### 1. Process Information
- What is the process object?
- Accessing process metadata (pid, version, platform)
- Understanding process.title
- Working directory and execution path
- Memory usage and uptime

### 2. Environment Variables
- Reading environment variables with process.env
- Setting environment variables
- Common environment variables (NODE_ENV, PATH)
- Security considerations
- Using .env files

### 3. Command-Line Arguments
- Understanding process.argv
- Parsing command-line arguments
- Building CLI applications
- Working with flags and options
- Using argument parsing libraries

### 4. Standard Streams
- Understanding stdin, stdout, stderr
- Reading from standard input
- Writing to standard output
- Error output best practices
- Stream vs console methods

### 5. Process Lifecycle & Exit
- Exit codes and their meanings
- Using process.exit()
- The 'exit' event
- The 'beforeExit' event
- Handling uncaught exceptions
- Graceful shutdown patterns

---

## Conceptual Guides

Before diving into examples, read these guides to build solid understanding:

### Essential Reading

1. **[Understanding Process](./guides/01-understanding-process.md)** (20 min)
   - What the process object is
   - Why it matters for Node.js apps
   - Real-world use cases

2. **[Environment Variables](./guides/02-environment-variables.md)** (15 min)
   - How environment variables work
   - Reading and setting variables
   - Security best practices

3. **[Command-Line Arguments](./guides/03-command-line-arguments.md)** (15 min)
   - Parsing process.argv
   - Building CLI tools
   - Argument patterns and conventions

4. **[Standard Streams](./guides/04-standard-streams.md)** (15 min)
   - stdin, stdout, stderr explained
   - Interactive CLI applications
   - Stream-based I/O

5. **[Process Lifecycle](./guides/05-process-lifecycle.md)** (10 min)
   - Exit codes and their meanings
   - Process events and shutdown
   - Error handling strategies

---

## Learning Path

### Recommended Approach

```
Day 1: Theory
├─ Read guides 1-2 (Understanding + Environment Variables)
├─ Study examples 1-3
├─ Complete exercises 1-2
└─ Review solutions

Day 2: Practice
├─ Read guides 3-4 (Arguments + Streams)
├─ Study examples 4-6
├─ Complete exercises 3-4
└─ Review solutions

Day 3: Integration
├─ Read guide 5 (Process Lifecycle)
├─ Study examples 7-8
├─ Complete exercise 5
└─ Build a mini-project
```

### Quick Start (Experienced Developers)

1. Skim guides 1-3
2. Run all examples
3. Complete all exercises
4. Check solutions for alternative approaches

---

## Examples

Practical code examples demonstrating core concepts:

1. **[01-process-info.js](./examples/01-process-info.js)**
   - Accessing process information
   - PID, version, platform, and architecture
   - Memory usage and uptime

2. **[02-environment-variables.js](./examples/02-environment-variables.js)**
   - Reading environment variables
   - Setting NODE_ENV
   - Security considerations

3. **[03-command-line-args.js](./examples/03-command-line-args.js)**
   - Parsing process.argv
   - Building a simple CLI tool
   - Handling flags and options

4. **[04-stdin-stdout.js](./examples/04-stdin-stdout.js)**
   - Reading from stdin
   - Writing to stdout
   - Building interactive programs

5. **[05-stderr-logging.js](./examples/05-stderr-logging.js)**
   - Using stderr for errors
   - Distinguishing output from errors
   - Proper logging practices

6. **[06-exit-codes.js](./examples/06-exit-codes.js)**
   - Setting exit codes
   - Exit code conventions
   - Signaling success and failure

7. **[07-process-events.js](./examples/07-process-events.js)**
   - Handling exit and beforeExit
   - Cleanup on shutdown
   - Event sequence and lifecycle

8. **[08-signal-handling.js](./examples/08-signal-handling.js)**
   - Handling SIGINT and SIGTERM
   - Graceful shutdown
   - Cleanup operations

---

## Exercises

Test your understanding with practical exercises:

### Exercise 1: System Information Tool
**Difficulty:** Easy
**File:** [exercises/exercise-1.js](./exercises/exercise-1.js)

Create a CLI tool that displays:
- Node.js version
- Process ID
- Platform and architecture
- Current working directory
- Memory usage

**Skills practiced:**
- Accessing process information
- Formatting output
- Basic CLI structure

---

### Exercise 2: Environment Config Reader
**Difficulty:** Easy
**File:** [exercises/exercise-2.js](./exercises/exercise-2.js)

Build a configuration reader that:
- Reads environment variables
- Provides default values
- Validates required variables
- Reports missing configuration

**Skills practiced:**
- Working with process.env
- Configuration management
- Error handling
- Default value patterns

---

### Exercise 3: CLI Calculator
**Difficulty:** Medium
**File:** [exercises/exercise-3.js](./exercises/exercise-3.js)

Implement a calculator CLI that:
- Accepts operation and numbers as arguments
- Supports add, subtract, multiply, divide
- Validates input
- Exits with appropriate codes

**Skills practiced:**
- Parsing command-line arguments
- Input validation
- Exit codes
- Error messages

---

### Exercise 4: Interactive Todo App
**Difficulty:** Medium
**File:** [exercises/exercise-4.js](./exercises/exercise-4.js)

Build an interactive todo app that:
- Reads commands from stdin
- Adds, lists, and removes todos
- Saves todos to a file
- Handles exit gracefully

**Skills practiced:**
- Reading from stdin
- Writing to stdout
- Interactive programs
- Data persistence
- Graceful shutdown

---

### Exercise 5: Process Monitor
**Difficulty:** Hard
**File:** [exercises/exercise-5.js](./exercises/exercise-5.js)

Create a process monitoring tool that:
- Reports memory usage every second
- Handles SIGINT for graceful shutdown
- Writes stats to a log file
- Cleans up on exit
- Shows summary on termination

**Skills practiced:**
- Process events
- Signal handling
- Timers and cleanup
- File I/O
- Graceful shutdown

---

## Solutions

Complete, well-commented solutions for all exercises:

- [Solution 1](./solutions/exercise-1-solution.js) - System information tool
- [Solution 2](./solutions/exercise-2-solution.js) - Environment config reader
- [Solution 3](./solutions/exercise-3-solution.js) - CLI calculator
- [Solution 4](./solutions/exercise-4-solution.js) - Interactive todo app
- [Solution 5](./solutions/exercise-5-solution.js) - Process monitor

**Note:** Try to complete exercises before checking solutions!

---

## Key Concepts Summary

### What You Should Know

After completing this level, you should understand:

1. **Process Information**
   ```javascript
   console.log(process.pid);        // Process ID
   console.log(process.version);    // Node.js version
   console.log(process.platform);   // Operating system
   console.log(process.cwd());      // Current directory
   ```

2. **Environment Variables**
   ```javascript
   // Reading
   const env = process.env.NODE_ENV || 'development';

   // Setting (for child processes)
   process.env.MY_VAR = 'value';

   // Common pattern
   const config = {
     port: process.env.PORT || 3000,
     dbUrl: process.env.DATABASE_URL
   };
   ```

3. **Command-Line Arguments**
   ```javascript
   // process.argv structure
   // [0]: node executable path
   // [1]: script file path
   // [2+]: actual arguments

   const args = process.argv.slice(2);
   console.log('Arguments:', args);
   ```

4. **Standard Streams**
   ```javascript
   // stdout - normal output
   process.stdout.write('Normal output\n');

   // stderr - error output
   process.stderr.write('Error output\n');

   // stdin - input
   process.stdin.on('data', chunk => {
     console.log('Received:', chunk.toString());
   });
   ```

5. **Exit Codes**
   ```javascript
   // Success
   process.exit(0);

   // Generic error
   process.exit(1);

   // Let Node.js decide (0 if no errors)
   // (preferred for normal termination)
   ```

---

## Common Pitfalls

### Pitfall 1: Forgetting to Slice process.argv

```javascript
// ❌ Wrong - includes node and script paths
const args = process.argv;
console.log(args); // ['/usr/bin/node', '/path/to/script.js', 'arg1']

// ✅ Correct - only user arguments
const args = process.argv.slice(2);
console.log(args); // ['arg1']
```

### Pitfall 2: Modifying process.env Incorrectly

```javascript
// ❌ Wrong - doesn't affect current process
process.env.NODE_ENV = 'production'; // Only affects child processes

// ✅ Correct - set before starting Node.js
// NODE_ENV=production node app.js

// ⚠️ Note: Can set for conditional logic in current process
const isProduction = process.env.NODE_ENV === 'production';
```

### Pitfall 3: Using process.exit() Unnecessarily

```javascript
// ❌ Wrong - prevents cleanup
doSomething();
process.exit(0); // Abrupt exit

// ✅ Correct - let process exit naturally
doSomething();
// Process exits after event loop is empty

// ✅ Also correct - for error cases
if (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}
```

### Pitfall 4: Not Handling stdin Properly

```javascript
// ❌ Wrong - stdin might be paused
process.stdin.on('data', data => {
  console.log(data);
});

// ✅ Correct - resume stdin first
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', data => {
  console.log(data);
});
```

---

## Practice Projects

Apply what you've learned:

### Project 1: File Statistics CLI
Build a CLI tool that:
- Accepts file path as argument
- Displays file size, lines, words
- Uses environment variable for output format
- Exits with proper codes on errors

### Project 2: Environment Validator
Create a tool that:
- Checks required environment variables
- Validates variable formats (URLs, numbers)
- Reports missing or invalid variables
- Exits with code 1 if validation fails

### Project 3: Interactive Shell
Build a simple shell that:
- Reads commands from stdin
- Executes basic operations
- Maintains command history
- Handles Ctrl+C gracefully
- Writes logs to stderr

---

## Testing Your Knowledge

### Self-Check Questions

Answer these to verify your understanding:

1. What is the process object in Node.js?
2. How do you access the third command-line argument?
3. What's the difference between stdout and stderr?
4. What exit code indicates success?
5. When does the 'beforeExit' event fire?
6. Why should you use stderr for error messages?
7. How do you gracefully handle SIGINT?
8. What does process.cwd() return?

### Practical Check

You've mastered this level if you can:

- [ ] Build a CLI tool that accepts arguments
- [ ] Read configuration from environment variables
- [ ] Create an interactive program using stdin
- [ ] Exit with appropriate status codes
- [ ] Handle process shutdown gracefully
- [ ] Distinguish between stdout and stderr usage

---

## Performance Insights

### Memory Usage Monitoring

```javascript
const used = process.memoryUsage();
console.log({
  rss: `${Math.round(used.rss / 1024 / 1024)} MB`,        // Total memory
  heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
  heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
  external: `${Math.round(used.external / 1024 / 1024)} MB`
});
```

### Process Uptime

```javascript
console.log(`Uptime: ${process.uptime()} seconds`);

// Convert to readable format
const uptime = process.uptime();
const hours = Math.floor(uptime / 3600);
const minutes = Math.floor((uptime % 3600) / 60);
const seconds = Math.floor(uptime % 60);
console.log(`${hours}h ${minutes}m ${seconds}s`);
```

---

## Additional Resources

### Official Documentation
- [Node.js Process API](https://nodejs.org/api/process.html)
- [Process Object Documentation](https://nodejs.org/api/process.html)

### Related Topics
- Module 4: Events - process is an EventEmitter
- Module 5: Stream - stdin/stdout/stderr are streams
- Module 7: Child Process - spawning child processes

### Next Steps
- Complete all exercises
- Build practice projects
- Move to [Level 2: Intermediate](../level-2-intermediate/README.md)

---

## Getting Help

If you're stuck:

1. Review the relevant guide
2. Study the examples
3. Check your code against solutions
4. Review [CONCEPTS.md](../CONCEPTS.md)
5. Practice with smaller examples

---

## Ready to Start?

Begin with the [first guide](./guides/01-understanding-process.md), then work through the examples and exercises at your own pace.

Remember: The process object is fundamental to Node.js applications. Understanding it well will help you build robust command-line tools and server applications!
