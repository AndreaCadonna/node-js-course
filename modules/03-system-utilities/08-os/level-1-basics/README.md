# Level 1: OS Basics

Learn the fundamentals of working with operating system information in Node.js.

## Learning Objectives

By completing this level, you will:

- ✅ Understand what the OS module provides
- ✅ Retrieve basic system information (platform, architecture, hostname)
- ✅ Monitor memory usage (total and free memory)
- ✅ Get CPU information (count, model, speed)
- ✅ Check system uptime
- ✅ Understand user and home directory information
- ✅ Work with platform-specific paths

---

## Prerequisites

- Basic JavaScript knowledge
- Node.js installed (v14+)
- Understanding of basic system concepts (CPU, RAM, etc.)
- Familiarity with the command line

---

## What You'll Learn

### Core Topics

1. **System Information**
   - `os.platform()` - Operating system platform
   - `os.type()` - Operating system name
   - `os.release()` - OS version
   - `os.arch()` - CPU architecture
   - `os.hostname()` - Computer name

2. **Memory Information**
   - `os.totalmem()` - Total system memory
   - `os.freemem()` - Available memory
   - Calculating memory usage
   - Converting bytes to readable units

3. **CPU Information**
   - `os.cpus()` - CPU details
   - Number of cores
   - CPU model and speed
   - Understanding CPU times

4. **User Information**
   - `os.userInfo()` - Current user details
   - `os.homedir()` - Home directory
   - `os.tmpdir()` - Temporary directory

5. **System Uptime**
   - `os.uptime()` - System uptime in seconds
   - Converting to readable format
   - Understanding system stability

6. **Platform Constants**
   - `os.EOL` - Line ending for platform
   - `os.endianness()` - Byte order
   - Cross-platform considerations

---

## Time Commitment

**Estimated time**: 1-2 hours
- Reading guides: 30-40 minutes
- Running examples: 15-20 minutes
- Exercises: 30-40 minutes
- Experimentation: 10-20 minutes

---

## Conceptual Guides

Before diving into code, read these guides to build conceptual understanding:

### Essential Reading

1. **[Platform and Architecture](guides/01-platform-architecture.md)** (8 min)
   - Understanding different platforms
   - CPU architectures
   - Platform detection

2. **[Memory Management](guides/02-memory-management.md)** (10 min)
   - Total vs free memory
   - Memory units and conversion
   - Memory monitoring basics

3. **[CPU Information](guides/03-cpu-information.md)** (10 min)
   - Understanding CPU cores
   - CPU model and speed
   - CPU time metrics

4. **[User and Directories](guides/04-user-directories.md)** (7 min)
   - User information
   - Home directory
   - Temporary directory
   - Cross-platform paths

5. **[System Uptime](guides/05-system-uptime.md)** (5 min)
   - Understanding uptime
   - Converting seconds to readable format
   - Why uptime matters

6. **[Platform Constants](guides/06-platform-constants.md)** (8 min)
   - Line endings (EOL)
   - Endianness
   - Cross-platform compatibility

---

## Key Concepts

### Basic System Information

Get essential OS details:

```javascript
const os = require('os');

console.log('Platform:', os.platform());     // 'linux', 'darwin', 'win32'
console.log('Type:', os.type());             // 'Linux', 'Darwin', 'Windows_NT'
console.log('Release:', os.release());       // OS version
console.log('Architecture:', os.arch());     // 'x64', 'arm64', etc.
console.log('Hostname:', os.hostname());     // Computer name
console.log('Uptime:', os.uptime(), 'seconds');
```

### Memory Information

Monitor system memory:

```javascript
const os = require('os');

const totalMem = os.totalmem();
const freeMem = os.freemem();
const usedMem = totalMem - freeMem;

console.log('Total Memory:', (totalMem / 1024 / 1024 / 1024).toFixed(2), 'GB');
console.log('Free Memory:', (freeMem / 1024 / 1024 / 1024).toFixed(2), 'GB');
console.log('Used Memory:', (usedMem / 1024 / 1024 / 1024).toFixed(2), 'GB');
console.log('Usage:', ((usedMem / totalMem) * 100).toFixed(2), '%');
```

### CPU Information

Get CPU details:

```javascript
const os = require('os');

const cpus = os.cpus();
console.log('CPU Model:', cpus[0].model);
console.log('CPU Speed:', cpus[0].speed, 'MHz');
console.log('Number of Cores:', cpus.length);

// Each CPU core has timing information
console.log('CPU Times:', cpus[0].times);
// { user: 123, nice: 0, sys: 456, idle: 789, irq: 0 }
```

---

## Quick Start

### Your First OS Information

Try this in Node.js REPL (`node`):

```javascript
const os = require('os');

// Display basic system info
console.log('\n=== System Information ===');
console.log('Platform:', os.platform());
console.log('CPU Cores:', os.cpus().length);
console.log('Total Memory:', (os.totalmem() / 1024 / 1024 / 1024).toFixed(2), 'GB');
console.log('Free Memory:', (os.freemem() / 1024 / 1024 / 1024).toFixed(2), 'GB');
console.log('Hostname:', os.hostname());
console.log('Uptime:', Math.floor(os.uptime() / 3600), 'hours');
```

---

## Common Pitfalls

### ❌ Pitfall 1: Not Converting Bytes to Readable Units

```javascript
// ❌ WRONG - displays huge numbers
console.log('Memory:', os.totalmem()); // 17179869184

// ✅ CORRECT - human-readable
const memGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
console.log('Memory:', memGB, 'GB'); // 16.00 GB
```

### ❌ Pitfall 2: Assuming Platform Names

```javascript
// ❌ WRONG - 'windows' is incorrect
if (os.platform() === 'windows') {
  // This will never match!
}

// ✅ CORRECT - Windows is 'win32'
if (os.platform() === 'win32') {
  console.log('Running on Windows');
}
```

### ❌ Pitfall 3: Polling Too Frequently

```javascript
// ❌ WRONG - wasteful polling
setInterval(() => {
  console.log(os.freemem());
}, 10); // Every 10ms is too much!

// ✅ CORRECT - reasonable interval
setInterval(() => {
  console.log(os.freemem());
}, 5000); // Every 5 seconds
```

---

## Exercises

After reading the guides, test your knowledge with these exercises:

### Exercise 1: System Information Display
Create a script that displays comprehensive system information in a formatted way.

**Skills practiced:**
- Using multiple OS methods
- Formatting output
- Converting units

### Exercise 2: Memory Monitor
Build a simple memory monitoring tool that tracks memory usage over time.

**Skills practiced:**
- Memory monitoring
- Percentage calculations
- Time-based tracking

### Exercise 3: CPU Information Tool
Display detailed CPU information including all cores.

**Skills practiced:**
- Working with CPU data
- Iterating over CPU array
- Formatting complex data

### Exercise 4: Cross-Platform Path Helper
Create a utility that returns platform-appropriate paths.

**Skills practiced:**
- Platform detection
- Cross-platform compatibility
- Path handling

### Exercise 5: System Health Checker
Build a basic health check that reports system status.

**Skills practiced:**
- Combining multiple metrics
- Decision making based on system info
- Status reporting

---

## Learning Path

### Recommended Sequence

1. **Read Conceptual Guides** (50 minutes)
   - Start with [Platform and Architecture](guides/01-platform-architecture.md)
   - Read all 6 guides in order
   - Take notes on key concepts

2. **Run Examples** (20 minutes)
   - Execute each example script
   - Modify examples and observe changes
   - Understand the output

3. **Complete Exercises** (40 minutes)
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

- [ ] Explain what information the OS module provides
- [ ] Detect the operating system and architecture
- [ ] Monitor memory usage and convert to readable units
- [ ] Retrieve and display CPU information
- [ ] Get user and directory information
- [ ] Calculate and format system uptime
- [ ] Handle platform-specific differences
- [ ] Understand when to use different OS methods
- [ ] Build simple system information tools

---

## What's Next?

After completing Level 1, you'll be ready for:

### Level 2: Intermediate OS Operations
- Network interface information
- Load average monitoring
- Advanced cross-platform handling
- Building monitoring dashboards
- Performance tracking over time
- Integration with other modules

---

## Additional Practice

Want more practice? Try these mini-projects:

1. **System Info CLI**
   - Command-line tool to display system info
   - Colorful formatted output
   - Different display modes

2. **Memory Alert Tool**
   - Monitor memory usage
   - Alert when usage exceeds threshold
   - Log alerts to file

3. **Platform Detector**
   - Detect platform and architecture
   - Display platform-specific recommendations
   - Show compatible features

4. **Uptime Tracker**
   - Track system uptime
   - Display in human-readable format
   - Compare with Node.js process uptime

---

## Resources

### Official Documentation
- [Node.js OS Documentation](https://nodejs.org/api/os.html)

### Tools
- **Node.js REPL**: Interactive testing (`node` command)
- **System Monitor**: Your OS's built-in monitor (Task Manager, Activity Monitor, top, htop)

---

## Questions or Stuck?

- Re-read the relevant guide
- Try the example code in REPL
- Check the [CONCEPTS.md](../CONCEPTS.md) for deeper understanding
- Experiment with variations
- Review the solutions after attempting exercises

---

## Let's Begin!

Start with **[Platform and Architecture](guides/01-platform-architecture.md)** and work your way through the guides. Take your time to understand each concept before moving on.

Remember: Understanding your system is the foundation for building efficient and reliable Node.js applications!
