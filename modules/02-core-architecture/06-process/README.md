# Module 6: Process

Master Node.js process control and system information.

## Why This Module Matters

The `process` global object is one of the most fundamental features in Node.js. It provides essential information about and control over the current Node.js process. Understanding the process object is crucial for building production-ready applications that can handle signals, manage resources, respond to environment changes, and interact with the operating system effectively.

**Real-world applications:**
- Reading environment variables for configuration
- Gracefully handling shutdown signals
- Monitoring memory and CPU usage
- Managing application lifecycle
- Command-line argument parsing
- Process performance monitoring
- Exit code management
- Inter-process communication
- Error handling and debugging
- Resource management and optimization

---

## What You'll Learn

By completing this module, you'll master:

### Technical Skills
- Understanding the process object
- Working with environment variables
- Handling process signals (SIGTERM, SIGINT, etc.)
- Managing exit codes
- Accessing process information
- Working with command-line arguments
- Monitoring resource usage
- Managing process lifecycle

### Practical Applications
- Build configurable applications with environment variables
- Implement graceful shutdown
- Handle system signals properly
- Monitor application performance
- Debug production issues
- Manage process resources
- Create robust CLI applications
- Implement proper error handling

---

## Module Structure

This module is divided into three progressive levels:

### [Level 1: Basics](./level-1-basics/README.md)
**Time**: 2-3 hours

Learn the fundamentals of the process object:
- Understanding the process object
- Environment variables (`process.env`)
- Command-line arguments (`process.argv`)
- Standard I/O streams (stdin, stdout, stderr)
- Basic process information
- Exit codes and `process.exit()`
- Current working directory
- Platform information

**You'll be able to:**
- Access environment variables
- Parse command-line arguments
- Read from stdin and write to stdout
- Get basic process information
- Exit processes with proper codes
- Understand process properties
- Build simple CLI tools

### [Level 2: Intermediate](./level-2-intermediate/README.md)
**Time**: 3-4 hours

Advanced process control techniques:
- Process signals and event handling
- Signal handling (SIGINT, SIGTERM, etc.)
- Graceful shutdown patterns
- Resource monitoring (memory, CPU)
- Process warnings and errors
- Unhandled rejection handling
- Uncaught exception handling
- Process event lifecycle
- Performance monitoring

**You'll be able to:**
- Handle system signals properly
- Implement graceful shutdown
- Monitor process resources
- Handle uncaught errors
- Manage process warnings
- Track process events
- Build resilient applications
- Debug process issues

### [Level 3: Advanced](./level-3-advanced/README.md)
**Time**: 4-6 hours

Production-ready process patterns:
- Advanced signal handling strategies
- Process monitoring and health checks
- Memory leak detection
- CPU profiling and optimization
- Inter-process communication
- Process clustering coordination
- Advanced error recovery
- Production debugging techniques
- Performance tuning
- Security considerations

**You'll be able to:**
- Build production-grade applications
- Implement comprehensive health checks
- Detect and fix memory leaks
- Optimize process performance
- Handle complex shutdown scenarios
- Implement process monitoring
- Debug production issues
- Secure process information

---

## Prerequisites

- **Module 4: Events** (recommended - process is an EventEmitter)
- **Module 5: Stream** (recommended - stdin/stdout/stderr are streams)
- Basic JavaScript knowledge
- Understanding of asynchronous programming
- Node.js installed (v14+)
- Basic command-line familiarity

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

**Fast Track** (If you're experienced with process management):
- Skim Level 1
- Focus on Level 2 and 3
- Complete advanced exercises

**Deep Dive** (If you want complete mastery):
- Read all guides thoroughly
- Complete all exercises
- Build additional projects
- Study the solutions for alternative approaches

---

## Key Concepts

### The Process Object

The process object is a global that provides information about and control over the current Node.js process:

```javascript
// No need to require - it's a global
console.log(process.version);        // Node.js version
console.log(process.platform);       // Operating system
console.log(process.pid);            // Process ID
console.log(process.cwd());          // Current directory
```

### Environment Variables

Environment variables provide configuration without changing code:

```javascript
// Read environment variables
const dbHost = process.env.DB_HOST || 'localhost';
const port = process.env.PORT || 3000;

// Check environment
if (process.env.NODE_ENV === 'production') {
  // Production-specific code
}
```

### Process Signals

Handle system signals for graceful shutdown:

```javascript
// Handle SIGTERM (termination signal)
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');

  // Close connections, cleanup resources
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('SIGINT received, exiting...');
  process.exit(0);
});
```

### Command-Line Arguments

Access arguments passed to your program:

```javascript
// process.argv contains all arguments
// node script.js arg1 arg2 arg3
console.log(process.argv);
// ['node', '/path/to/script.js', 'arg1', 'arg2', 'arg3']

// Get user arguments (skip node and script path)
const args = process.argv.slice(2);
console.log(args); // ['arg1', 'arg2', 'arg3']
```

---

## Practical Examples

### Example 1: Environment-Based Configuration

```javascript
// Configuration from environment variables
const config = {
  port: process.env.PORT || 3000,
  dbHost: process.env.DB_HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info'
};

console.log('Starting server with config:', config);

// Use different settings based on environment
if (config.nodeEnv === 'production') {
  // Enable production optimizations
  console.log('Running in production mode');
} else {
  // Enable development features
  console.log('Running in development mode');
}
```

### Example 2: Graceful Shutdown

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.end('Hello World');
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});

// Graceful shutdown handler
function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }

    console.log('Server closed successfully');
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
}

// Register signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### Example 3: Memory Monitoring

```javascript
// Monitor memory usage
function logMemoryUsage() {
  const usage = process.memoryUsage();

  console.log('Memory Usage:');
  console.log(`  RSS: ${Math.round(usage.rss / 1024 / 1024)} MB`);
  console.log(`  Heap Total: ${Math.round(usage.heapTotal / 1024 / 1024)} MB`);
  console.log(`  Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024)} MB`);
  console.log(`  External: ${Math.round(usage.external / 1024 / 1024)} MB`);
}

// Log memory every 5 seconds
setInterval(logMemoryUsage, 5000);

// Warn on high memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;

  if (heapUsedMB > 500) {
    console.warn('WARNING: High memory usage detected!');
  }
}, 1000);
```

---

## Common Pitfalls

### ❌ Not Handling Uncaught Exceptions

```javascript
// Wrong - process crashes on error
throw new Error('Unhandled error');

// Correct - handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Cleanup and exit gracefully
  process.exit(1);
});
```

### ❌ Ignoring Unhandled Promise Rejections

```javascript
// Wrong - unhandled rejection may crash process
Promise.reject(new Error('Unhandled rejection'));

// Correct - handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Handle the error appropriately
});
```

### ❌ Not Implementing Graceful Shutdown

```javascript
// Wrong - abrupt shutdown loses data
process.exit(0);

// Correct - graceful shutdown
process.on('SIGTERM', async () => {
  await closeConnections();
  await saveData();
  process.exit(0);
});
```

### ❌ Hardcoding Configuration

```javascript
// Wrong - hardcoded values
const port = 3000;
const dbHost = 'localhost';

// Correct - use environment variables
const port = process.env.PORT || 3000;
const dbHost = process.env.DB_HOST || 'localhost';
```

---

## Module Contents

### Documentation
- **[CONCEPTS.md](./CONCEPTS.md)** - Foundational concepts for the entire module
- **Level READMEs** - Specific guidance for each level

### Code Examples
- **8 examples per level** (24 total) - Practical demonstrations
- **Fully commented** - Learn from reading the code
- **Runnable** - Execute them to see results

### Exercises
- **5 exercises per level** (15 total) - Practice problems
- **Progressive difficulty** - Build your skills gradually
- **Complete solutions** - Check your work

### Conceptual Guides
- **15 in-depth guides** - Deep understanding of specific topics
- **Level 1**: 5 guides on fundamentals
- **Level 2**: 5 guides on intermediate patterns
- **Level 3**: 5 guides on advanced topics

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

3. **Run your first example**:
   ```bash
   node examples/01-process-info.js
   ```

4. **Try an exercise**:
   ```bash
   node exercises/exercise-1.js
   ```

### Setting Up

No special setup is required! The process object is a global in Node.js.

```javascript
// Just start using it - no require needed!
console.log(process.version);
console.log(process.platform);
console.log(process.env.USER);
```

---

## Success Criteria

You'll know you've mastered this module when you can:

- [ ] Use environment variables for configuration
- [ ] Handle system signals properly
- [ ] Implement graceful shutdown
- [ ] Parse command-line arguments
- [ ] Monitor process resources
- [ ] Handle uncaught exceptions and rejections
- [ ] Understand process lifecycle events
- [ ] Build production-ready applications
- [ ] Debug process-related issues
- [ ] Optimize process performance

---

## Why Process Management Matters

### Configuration Management

```javascript
// Development, staging, production - same code, different config
const config = {
  db: process.env.DATABASE_URL,
  port: process.env.PORT,
  env: process.env.NODE_ENV
};

// No need to change code for different environments
```

### Reliability

```javascript
// Handle unexpected errors gracefully
process.on('uncaughtException', (err) => {
  logger.error('Fatal error:', err);
  // Cleanup and restart
  process.exit(1);
});

// Container orchestrators can restart the process
```

### Monitoring

```javascript
// Track application health
setInterval(() => {
  const metrics = {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    cpu: process.cpuUsage()
  };

  sendToMonitoringService(metrics);
}, 60000);
```

---

## Additional Resources

### Official Documentation
- [Node.js Process Documentation](https://nodejs.org/api/process.html)
- [Process Object Reference](https://nodejs.org/api/process.html)

### Practice Projects
After completing this module, try building:
1. **Configuration Manager** - Load and validate env variables
2. **Process Monitor** - Track resource usage over time
3. **Graceful Server** - HTTP server with proper shutdown
4. **CLI Tool** - Parse arguments and handle signals
5. **Health Check API** - Expose process metrics

### Related Modules
- **Module 4: Events** - Process is an EventEmitter
- **Module 5: Stream** - stdin/stdout/stderr are streams
- **Module 8: OS** - System information
- **Module 12: Child Process** - Creating and managing child processes

---

## Questions or Issues?

- Review the [CONCEPTS.md](./CONCEPTS.md) for foundational understanding
- Check the examples for practical demonstrations
- Study the guides for deep dives into specific topics
- Review solutions after attempting exercises

---

## Let's Begin!

Start your journey with [Level 1: Basics](./level-1-basics/README.md) and discover the power of process management in Node.js.

Remember: Understanding the process object is essential for building production-ready Node.js applications. Master it, and you'll be able to build robust, configurable, and maintainable applications!
