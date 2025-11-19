# Level 1: Basics - Solutions

This directory contains comprehensive, production-quality solutions for all Level 1 exercises in the Process module. Each solution demonstrates best practices, proper error handling, and includes extensive documentation to help you understand the concepts.

## Overview

These solutions cover fundamental process operations and demonstrate professional approaches to:
- Accessing process information and system metrics
- Managing configuration with environment variables
- Processing command-line arguments
- Building interactive CLI applications
- Monitoring process performance in real-time

## Solutions

### Exercise 1: System Information Tool
**File:** `exercise-1-solution.js`

A comprehensive system information display tool that demonstrates accessing and formatting process and system data.

**Key Concepts:**
- `process.version`, `process.platform`, `process.arch` - System identification
- `process.pid`, `process.ppid` - Process identifiers
- `process.cwd()`, `process.execPath` - Path information
- `process.uptime()` - Process runtime tracking
- `process.memoryUsage()` - Memory statistics (RSS, heap, external)
- `process.cpuUsage()` - CPU time measurement
- Helper functions for formatting (bytes to MB, microseconds to ms)
- Structured output with visual formatting

**What You'll Learn:**
- How to access process properties and methods
- Understanding memory metrics (RSS, heap total/used, external)
- CPU time measurement (user vs system time)
- Formatting numeric data for human readability
- Creating well-structured information displays

**Running the Solution:**
```bash
node exercise-1-solution.js
```

**Sample Output:**
```
╔════════════════════════════════════════════╗
║    System Information Tool - Solution      ║
╚════════════════════════════════════════════╝

--- System Information ---
Node.js Version:       v18.17.0
Platform:              linux
Architecture:          x64
...
```

---

### Exercise 2: Environment Config Reader
**File:** `exercise-2-solution.js`

A professional configuration management system using environment variables with validation, type conversion, and secure display.

**Key Concepts:**
- `process.env` - Accessing environment variables
- Type conversion (string to number, boolean)
- Default value handling
- Required variable validation
- Secure masking of sensitive values
- Configuration object structuring
- Error handling for missing configuration

**What You'll Learn:**
- How to read and parse environment variables
- Converting string values to appropriate types
- Validating required configuration
- Setting sensible defaults for optional config
- Displaying sensitive data securely
- Creating robust configuration loaders
- Fail-fast principle for missing required config

**Running the Solution:**
```bash
# With environment variables
APP_NAME=MyApp DATABASE_URL=postgres://localhost/db node exercise-2-solution.js

# Or export first
export APP_NAME=MyApp
export DATABASE_URL=postgres://localhost/db
node exercise-2-solution.js
```

**Sample Output:**
```
╔════════════════════════════════════════════╗
║      Application Configuration             ║
╚════════════════════════════════════════════╝

  App Name             : MyApp
  Environment          : development
  Database URL         : postgres**************db
  ...
```

**Configuration Variables:**
- `APP_NAME` (required) - Application name
- `DATABASE_URL` (required) - Database connection string
- `APP_ENV` (optional) - Environment: development/staging/production
- `PORT` (optional) - Server port (default: 3000)
- `DEBUG` (optional) - Debug mode (default: false)
- `MAX_CONNECTIONS` (optional) - Max connections (default: 100)
- `API_TIMEOUT` (optional) - API timeout in ms (default: 30000)
- `ENABLE_LOGGING` (optional) - Enable logging (default: false)
- `API_BASE_URL` (optional) - API base URL

---

### Exercise 3: CLI Calculator
**File:** `exercise-3-solution.js`

A command-line calculator that parses arguments, validates input, and performs mathematical operations with comprehensive error handling.

**Key Concepts:**
- `process.argv` - Command-line argument array
- Argument parsing and extraction
- Input validation
- `process.exit(code)` - Exit codes (0 = success, 1 = error)
- Variable number of operands
- Error handling and user feedback
- Functional programming with `reduce()`

**What You'll Learn:**
- How to parse command-line arguments
- Working with `process.argv` structure
- Validating user input thoroughly
- Using appropriate exit codes
- Providing helpful usage documentation
- Processing variable numbers of arguments
- Using reduce() for sequential operations

**Running the Solution:**
```bash
# Addition
node exercise-3-solution.js add 5 10 15 20
# Result: 50

# Subtraction
node exercise-3-solution.js subtract 100 25 10
# Result: 65 (100 - 25 - 10)

# Multiplication
node exercise-3-solution.js multiply 2 3 4
# Result: 24

# Division
node exercise-3-solution.js divide 100 2 5
# Result: 10 (100 / 2 / 5)

# Show usage
node exercise-3-solution.js
```

**Supported Operations:**
- `add` - Sum all numbers
- `subtract` - Subtract all from first
- `multiply` - Multiply all numbers
- `divide` - Divide first by all others

---

### Exercise 4: Interactive Todo App
**File:** `exercise-4-solution.js`

An interactive command-line todo list application using stdin/stdout for real-time user interaction and state management.

**Key Concepts:**
- `process.stdin` - Reading user input
- `process.stdout` - Writing output
- Stream events (`data`, `end`, `error`)
- `setEncoding('utf8')` - Stream encoding
- Line-by-line input processing
- Input buffering for incomplete lines
- Interactive prompts and feedback
- Application state management
- Command parsing and routing

**What You'll Learn:**
- How to create interactive CLI applications
- Reading from stdin with event handlers
- Writing to stdout for user feedback
- Handling stream data in chunks
- Buffering incomplete lines
- Parsing commands with arguments
- Managing application state
- Providing immediate user feedback
- Graceful exit handling

**Running the Solution:**
```bash
node exercise-4-solution.js
```

**Available Commands:**
```
add <task>        - Add a new todo item
list              - Show all todo items
complete <id>     - Mark a todo as completed
delete <id>       - Delete a todo item
help              - Show help message
quit              - Exit the application
```

**Sample Session:**
```
╔════════════════════════════════════════════╗
║        Interactive Todo App                ║
╚════════════════════════════════════════════╝

todo> add Buy groceries
✅ Added todo #1: "Buy groceries"
todo> add Finish homework
✅ Added todo #2: "Finish homework"
todo> list

📋 Your Todos:
──────────────────────────────────────────────
  1. [ ] Buy groceries
  2. [ ] Finish homework
──────────────────────────────────────────────
Total: 2 | Completed: 0 | Pending: 2

todo> complete 1
✅ Completed todo #1: "Buy groceries"
todo> quit

👋 Goodbye! Thanks for using Todo App!
```

---

### Exercise 5: Process Monitor
**File:** `exercise-5-solution.js`

A real-time process monitoring tool that tracks memory, CPU, and displays live metrics with trend analysis and comprehensive statistics.

**Key Concepts:**
- `setInterval()` - Periodic task execution
- `clearInterval()` - Cleanup
- `process.memoryUsage()` - Real-time memory tracking
- `process.cpuUsage()` - CPU time with delta calculation
- Signal handling (`SIGINT`, `SIGTERM`)
- ANSI escape codes for terminal control
- Statistical analysis (peaks, averages, trends)
- Graceful shutdown and resource cleanup
- History tracking for trend detection

**What You'll Learn:**
- How to monitor process metrics in real-time
- Using setInterval for periodic updates
- Calculating CPU usage deltas
- Tracking trends and detecting changes
- Terminal manipulation with ANSI codes
- Handling process signals for shutdown
- Calculating running averages and peaks
- Cleaning up resources properly
- Building live-updating dashboards

**Running the Solution:**
```bash
node exercise-5-solution.js
```

**Press Ctrl+C to stop and see summary statistics.**

**Display Includes:**
- Real-time memory usage (RSS, heap, external)
- CPU usage (user and system time)
- Memory and CPU trends (▲ increasing, ▼ decreasing, ● stable)
- Peak memory tracking
- Running averages
- Sample count and uptime
- Final summary statistics on exit

**Sample Output:**
```
╔════════════════════════════════════════════╗
║         Process Monitor - Real-time        ║
╚════════════════════════════════════════════╝

⏰ Current Time: 10:30:45 AM
⏱️  Monitor Runtime: 00:00:15
🔄 Process Uptime: 00:00:15
📊 Samples Collected: 15

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 MEMORY USAGE ●
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RSS (Total):              45.23 MB
Heap Total:               12.50 MB
Heap Used:                 8.75 MB
...
```

---

## Running All Solutions

You can test all solutions sequentially:

```bash
# Solution 1 - System Information
node exercise-1-solution.js

# Solution 2 - Environment Config
APP_NAME=TestApp DATABASE_URL=postgres://localhost/db node exercise-2-solution.js

# Solution 3 - CLI Calculator
node exercise-3-solution.js add 10 20 30

# Solution 4 - Interactive Todo (type 'quit' to exit)
node exercise-4-solution.js

# Solution 5 - Process Monitor (press Ctrl+C to stop)
node exercise-5-solution.js
```

## Key Takeaways from All Solutions

### 1. Process Object Fundamentals
- The `process` object is globally available in all Node.js applications
- It provides access to system information, environment, and I/O streams
- Properties are read-only snapshots; methods return fresh data

### 2. Environment Variables
- All environment variables are strings - type conversion is required
- Always validate required configuration at startup
- Use defaults for optional configuration
- Never log sensitive values in plain text

### 3. Command-Line Arguments
- `process.argv[0]` is Node.js path, `[1]` is script path, `[2+]` are arguments
- All arguments are strings - parse as needed
- Use proper exit codes: 0 for success, non-zero for errors
- Provide helpful usage documentation

### 4. Stream I/O
- `process.stdin` is a readable stream
- `process.stdout` and `process.stderr` are writable streams
- Set encoding to get strings instead of buffers
- Handle data in chunks - buffer incomplete lines
- Listen to `data`, `end`, and `error` events

### 5. Monitoring and Signals
- Use `setInterval()` for periodic monitoring
- Always clean up with `clearInterval()`
- Handle signals (`SIGINT`, `SIGTERM`) for graceful shutdown
- CPU usage requires delta calculation for meaningful metrics
- Keep history bounded to prevent memory leaks

### 6. Best Practices Applied
- ✅ Comprehensive input validation
- ✅ Clear, actionable error messages
- ✅ Proper error handling with try/catch
- ✅ Resource cleanup and graceful shutdown
- ✅ Human-readable output formatting
- ✅ Extensive inline documentation
- ✅ Helper functions for reusability
- ✅ Consistent code structure
- ✅ Security considerations (masking sensitive data)
- ✅ User-friendly interfaces

### 7. Common Patterns
- **Information Display**: Gather data → Format → Present
- **Configuration Loading**: Validate → Parse → Provide defaults
- **CLI Tools**: Parse args → Validate → Execute → Exit with code
- **Interactive Apps**: Display prompt → Read input → Process → Repeat
- **Monitoring**: Collect metrics → Calculate trends → Display → Clean up

## Additional Resources

### Node.js Documentation
- [Process API](https://nodejs.org/api/process.html)
- [Streams](https://nodejs.org/api/stream.html)
- [Environment Variables](https://nodejs.org/api/process.html#process_process_env)

### Related Topics
- **Level 2**: Advanced process operations (child processes, IPC)
- **Level 3**: Master-level concepts (clustering, performance)

### Production Libraries
For production applications, consider these libraries:
- **dotenv** - Load environment variables from .env files
- **commander** or **yargs** - Advanced CLI argument parsing
- **chalk** - Terminal colors and styling
- **ora** - Elegant terminal spinners
- **inquirer** - Interactive CLI prompts
- **blessed** or **ink** - Terminal UI frameworks

## Testing the Solutions

All solutions include:
1. ✅ Complete implementations
2. ✅ Comprehensive error handling
3. ✅ Extensive comments and documentation
4. ✅ Input validation
5. ✅ Production-quality code structure
6. ✅ User-friendly output
7. ✅ Security considerations

## Learning Path

1. **Start with Exercise 1** - Understand the process object and its properties
2. **Move to Exercise 2** - Learn configuration management patterns
3. **Continue with Exercise 3** - Master command-line argument handling
4. **Practice Exercise 4** - Build interactive applications
5. **Challenge with Exercise 5** - Combine concepts in a real-time monitor

## Next Steps

After completing these solutions:
1. Compare your implementations with these solutions
2. Identify areas for improvement in your code
3. Try extending the solutions with additional features
4. Move on to Level 2 exercises for advanced topics
5. Apply these patterns in your own projects

## Questions and Concepts to Master

Before moving to Level 2, ensure you can answer:
- What's the difference between `process.stdout.write()` and `console.log()`?
- How do you calculate CPU usage deltas?
- Why is input validation critical in CLI tools?
- What exit codes should be used for success vs errors?
- How do you handle stream data that arrives in chunks?
- When should you use signal handlers?
- How do you mask sensitive data for display?
- What's the difference between user and system CPU time?
- How do you gracefully shut down a Node.js application?

---

**Happy Learning!** 🚀

These solutions represent production-quality code that you can use as references for your own projects. Study them carefully, understand the patterns, and apply the best practices in your work.
