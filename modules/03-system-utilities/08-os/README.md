# Module 8: OS

Master system information and monitoring with Node.js.

## Why This Module Matters

The `os` module provides essential operating system-related utility methods and properties. Understanding this module is crucial for building cross-platform applications, system monitoring tools, and performance optimization solutions. It's your window into the underlying system where your Node.js application runs.

**Real-world applications:**
- System monitoring and health checks
- Performance profiling and optimization
- Cross-platform compatibility handling
- Load balancing decisions
- Resource allocation and scaling
- DevOps and infrastructure tools
- Application telemetry and diagnostics
- Environment-specific configuration

---

## What You'll Learn

By completing this module, you'll master:

### Technical Skills
- Retrieving system information
- Monitoring CPU and memory usage
- Understanding network interfaces
- Platform detection and compatibility
- User information retrieval
- System uptime tracking
- Endianness detection

### Practical Applications
- Build system monitoring dashboards
- Implement health check endpoints
- Create performance profiling tools
- Handle cross-platform differences
- Optimize resource allocation
- Make intelligent scaling decisions
- Build DevOps automation tools

---

## Module Structure

This module is divided into three progressive levels:

### [Level 1: Basics](./level-1-basics/README.md)
**Time**: 1-2 hours

Learn the fundamentals of OS module:
- Understanding system architecture
- CPU information retrieval
- Memory usage monitoring
- Platform and version detection
- User and hostname information
- System uptime tracking

**You'll be able to:**
- Retrieve basic system information
- Monitor memory usage
- Detect operating system
- Get CPU details
- Check system uptime
- Understand platform differences

### [Level 2: Intermediate](./level-2-intermediate/README.md)
**Time**: 2-3 hours

Advanced system monitoring techniques:
- Network interface information
- Load average monitoring
- Temporary directory handling
- System constants and priorities
- Cross-platform path handling
- Environment-based configuration

**You'll be able to:**
- Monitor network interfaces
- Track system load
- Handle cross-platform differences
- Build monitoring dashboards
- Implement health checks
- Make scaling decisions

### [Level 3: Advanced](./level-3-advanced/README.md)
**Time**: 3-4 hours

Production-ready system monitoring:
- Real-time performance monitoring
- Resource-based auto-scaling
- Advanced CPU metrics analysis
- Memory leak detection
- System diagnostics tools
- Cross-platform production patterns

**You'll be able to:**
- Build production monitoring systems
- Implement auto-scaling logic
- Detect and diagnose issues
- Optimize resource usage
- Create comprehensive dashboards
- Build DevOps tools

---

## Prerequisites

- Basic JavaScript knowledge
- Node.js installed (v14+)
- Understanding of basic system concepts (CPU, RAM, etc.)
- Familiarity with asynchronous programming (helpful)

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

**Fast Track** (If you're experienced):
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

### System Information

Get essential information about the operating system:

```javascript
const os = require('os');

console.log('Platform:', os.platform());        // 'linux', 'darwin', 'win32'
console.log('Architecture:', os.arch());         // 'x64', 'arm', etc.
console.log('CPU cores:', os.cpus().length);    // Number of CPU cores
console.log('Total memory:', os.totalmem());    // Total RAM in bytes
console.log('Free memory:', os.freemem());      // Available RAM in bytes
console.log('Hostname:', os.hostname());        // Computer name
console.log('Uptime:', os.uptime());           // System uptime in seconds
```

### Memory Monitoring

Track memory usage for optimization:

```javascript
const os = require('os');

function getMemoryInfo() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const usagePercent = (usedMem / totalMem) * 100;

  return {
    total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
    free: (freeMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
    used: (usedMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
    usagePercent: usagePercent.toFixed(2) + '%'
  };
}

console.log(getMemoryInfo());
```

### CPU Information

Understand CPU capabilities and usage:

```javascript
const os = require('os');

const cpus = os.cpus();
console.log(`CPU Model: ${cpus[0].model}`);
console.log(`Number of cores: ${cpus.length}`);
console.log(`CPU Speed: ${cpus[0].speed} MHz`);

// Calculate average CPU usage
function getCPUUsage() {
  const cpus = os.cpus();

  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~(100 * idle / total);

  return usage;
}
```

### Cross-Platform Handling

Write code that works across different operating systems:

```javascript
const os = require('os');
const path = require('path');

function getConfigPath() {
  const platform = os.platform();
  const homeDir = os.homedir();

  switch (platform) {
    case 'win32':
      return path.join(process.env.APPDATA, 'myapp', 'config.json');
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support', 'myapp', 'config.json');
    case 'linux':
      return path.join(homeDir, '.config', 'myapp', 'config.json');
    default:
      return path.join(homeDir, '.myapp', 'config.json');
  }
}
```

---

## Practical Examples

### Example 1: System Health Check

```javascript
const os = require('os');

function systemHealthCheck() {
  const memUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
  const loadAvg = os.loadavg()[0]; // 1-minute load average
  const cpuCount = os.cpus().length;

  return {
    healthy: memUsage < 90 && loadAvg < cpuCount * 0.8,
    memoryUsage: memUsage.toFixed(2) + '%',
    loadAverage: loadAvg.toFixed(2),
    cpuCount,
    uptime: os.uptime()
  };
}

console.log('System Health:', systemHealthCheck());
```

### Example 2: Network Interfaces

```javascript
const os = require('os');

function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const result = [];

  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (!iface.internal && iface.family === 'IPv4') {
        result.push({
          name,
          address: iface.address,
          netmask: iface.netmask,
          mac: iface.mac
        });
      }
    }
  }

  return result;
}

console.log('Network Interfaces:', getNetworkInfo());
```

### Example 3: Resource-Based Decisions

```javascript
const os = require('os');

function determineWorkerCount() {
  const cpuCount = os.cpus().length;
  const totalMem = os.totalmem() / (1024 * 1024 * 1024); // GB

  // Use fewer workers on systems with limited resources
  if (totalMem < 2) {
    return Math.max(1, cpuCount - 1);
  } else if (totalMem < 4) {
    return cpuCount;
  } else {
    return cpuCount * 2; // More workers for powerful systems
  }
}

console.log(`Recommended workers: ${determineWorkerCount()}`);
```

---

## Common Pitfalls

### ❌ Not Considering Cross-Platform Differences

```javascript
// Wrong - assumes Unix-like system
const homeDir = '/home/' + os.userInfo().username;

// Correct - use os.homedir()
const homeDir = os.homedir();
```

### ❌ Ignoring Memory Values in Bytes

```javascript
// Wrong - displays huge unreadable numbers
console.log('Memory:', os.totalmem());

// Correct - convert to human-readable format
console.log('Memory:', (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB');
```

### ❌ Polling Too Frequently

```javascript
// Wrong - excessive polling wastes resources
setInterval(() => {
  console.log(os.freemem());
}, 10); // Every 10ms is too much!

// Correct - reasonable polling interval
setInterval(() => {
  console.log(os.freemem());
}, 5000); // Every 5 seconds is reasonable
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
- **16 in-depth guides** - Deep understanding of specific topics
- **Level 1**: 6 guides on fundamentals
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
   node examples/01-basic-system-info.js
   ```

4. **Try an exercise**:
   ```bash
   node exercises/exercise-1.js
   ```

### Setting Up

No special setup is required! The os module is built into Node.js.

```javascript
// Just import and start using
const os = require('os');
```

---

## Success Criteria

You'll know you've mastered this module when you can:

- [ ] Retrieve and interpret system information
- [ ] Monitor CPU and memory usage effectively
- [ ] Handle cross-platform differences gracefully
- [ ] Build system health check utilities
- [ ] Understand network interface information
- [ ] Make resource-based scaling decisions
- [ ] Create monitoring dashboards
- [ ] Implement performance diagnostics
- [ ] Build DevOps automation tools

---

## Why OS Module Matters

### System Awareness

Your application doesn't run in a vacuum - understanding the system enables better decisions:

```javascript
// Adapt behavior based on available resources
const isLowMemory = os.freemem() < 500 * 1024 * 1024; // < 500MB
if (isLowMemory) {
  // Use streaming instead of loading entire file
  processFileAsStream();
} else {
  // Fast in-memory processing
  processFileInMemory();
}
```

### Cross-Platform Compatibility

Build applications that work everywhere:

```javascript
const isWindows = os.platform() === 'win32';
const pathSeparator = isWindows ? '\\' : '/';
const lineEnding = isWindows ? '\r\n' : '\n';
```

### Performance Optimization

Make intelligent decisions based on hardware:

```javascript
const workerThreads = os.cpus().length;
const shouldCluster = os.totalmem() > 4 * 1024 * 1024 * 1024; // > 4GB
```

---

## Additional Resources

### Official Documentation
- [Node.js OS Documentation](https://nodejs.org/api/os.html)

### Practice Projects
After completing this module, try building:
1. **System Monitor** - Real-time system resource dashboard
2. **Health Check API** - RESTful health check endpoints
3. **Auto-Scaler** - Automatic worker scaling based on load
4. **System Info CLI** - Command-line system information tool
5. **Performance Logger** - Track and log system metrics

### Related Modules
- **Module 6: Process** - Process-specific information
- **Module 12: Child Process** - Running system commands
- **Module 13: Cluster** - Multi-core optimization
- **Module 14: Worker Threads** - CPU-intensive task distribution

---

## Questions or Issues?

- Review the [CONCEPTS.md](./CONCEPTS.md) for foundational understanding
- Check the examples for practical demonstrations
- Study the guides for deep dives into specific topics
- Review solutions after attempting exercises

---

## Let's Begin!

Start your journey with [Level 1: Basics](./level-1-basics/README.md) and discover how to build system-aware Node.js applications.

Remember: Understanding your system is the first step to building efficient, reliable, and scalable applications!
