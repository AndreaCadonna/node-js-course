# Guide 3: CPU Information

Understanding CPU information and metrics in Node.js.

## Table of Contents
- [CPU Basics](#cpu-basics)
- [Getting CPU Information](#getting-cpu-information)
- [CPU Times and Metrics](#cpu-times-and-metrics)
- [Practical Applications](#practical-applications)
- [Best Practices](#best-practices)

---

## CPU Basics

### What is a CPU?

The **CPU** (Central Processing Unit) is the brain of the computer that executes program instructions. Modern CPUs have multiple cores, allowing them to execute multiple tasks simultaneously.

### Why Monitor CPU?

1. **Optimize concurrency**: Determine optimal number of workers/threads
2. **Performance tuning**: Understand CPU capabilities
3. **Load balancing**: Distribute work across cores
4. **Resource planning**: Make informed architecture decisions
5. **Detect bottlenecks**: Identify CPU-bound operations

### CPU Terminology

- **Core**: Independent processing unit within a CPU
- **Thread**: Sequence of instructions that can be executed
- **Speed**: Clock frequency in MHz (megahertz)
- **Model**: CPU manufacturer and model name
- **Times**: Time spent in different execution modes

---

## Getting CPU Information

### Basic CPU Information

```javascript
const os = require('os');

// Get array of CPU cores
const cpus = os.cpus();

console.log('Number of CPU cores:', cpus.length);
console.log('CPU Model:', cpus[0].model);
console.log('CPU Speed:', cpus[0].speed, 'MHz');
```

### CPU Object Structure

Each CPU core object contains:

```javascript
{
  model: 'Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz',
  speed: 2600,  // MHz
  times: {
    user: 252020,    // Time in user mode
    nice: 0,         // Time in nice mode (Unix)
    sys: 30340,      // Time in system mode
    idle: 1742900,   // Time idle
    irq: 0           // Time servicing interrupts
  }
}
```

### Displaying All Cores

```javascript
const os = require('os');

const cpus = os.cpus();

cpus.forEach((cpu, index) => {
  console.log(`\nCore ${index}:`);
  console.log('  Model:', cpu.model);
  console.log('  Speed:', cpu.speed, 'MHz');
  console.log('  Times:', cpu.times);
});
```

---

## CPU Times and Metrics

### Understanding CPU Times

CPU times are measured in **milliseconds** and represent how the CPU spends its time:

| Time Type | Description |
|-----------|-------------|
| **user** | Time executing user-space code (your applications) |
| **nice** | Time executing "nice" (low priority) user processes (Unix only) |
| **sys** | Time executing kernel/system code |
| **idle** | Time doing nothing (CPU is idle) |
| **irq** | Time servicing hardware interrupts |

### Calculating Total CPU Time

```javascript
const os = require('os');

function getTotalCPUTimes() {
  const cpus = os.cpus();
  const totals = {
    user: 0,
    nice: 0,
    sys: 0,
    idle: 0,
    irq: 0
  };

  // Sum times across all cores
  cpus.forEach(cpu => {
    totals.user += cpu.times.user;
    totals.nice += cpu.times.nice;
    totals.sys += cpu.times.sys;
    totals.idle += cpu.times.idle;
    totals.irq += cpu.times.irq;
  });

  return totals;
}

const times = getTotalCPUTimes();
console.log('Total CPU Times:', times);
```

### CPU Time Distribution

```javascript
const os = require('os');

function getCPUDistribution() {
  const totals = getTotalCPUTimes();
  const total = totals.user + totals.nice + totals.sys +
                totals.idle + totals.irq;

  return {
    userPercent: ((totals.user / total) * 100).toFixed(2),
    sysPercent: ((totals.sys / total) * 100).toFixed(2),
    idlePercent: ((totals.idle / total) * 100).toFixed(2),
    activePercent: (((total - totals.idle) / total) * 100).toFixed(2)
  };
}

const dist = getCPUDistribution();
console.log('CPU Distribution:');
console.log('User:', dist.userPercent + '%');
console.log('System:', dist.sysPercent + '%');
console.log('Idle:', dist.idlePercent + '%');
console.log('Active:', dist.activePercent + '%');
```

### Calculating CPU Usage

To calculate CPU usage, you need to take two measurements and compare:

```javascript
const os = require('os');

function getCPUTimes() {
  const cpus = os.cpus();
  let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;

  cpus.forEach(cpu => {
    user += cpu.times.user;
    nice += cpu.times.nice;
    sys += cpu.times.sys;
    idle += cpu.times.idle;
    irq += cpu.times.irq;
  });

  return { user, nice, sys, idle, irq };
}

// First measurement
const startTimes = getCPUTimes();

// Wait 1 second
setTimeout(() => {
  // Second measurement
  const endTimes = getCPUTimes();

  // Calculate differences
  const idleDiff = endTimes.idle - startTimes.idle;
  const totalDiff = Object.keys(endTimes).reduce((acc, key) => {
    return acc + (endTimes[key] - startTimes[key]);
  }, 0);

  // Calculate usage percentage
  const usage = 100 - (100 * idleDiff / totalDiff);

  console.log('CPU Usage:', usage.toFixed(2) + '%');
}, 1000);
```

---

## Practical Applications

### 1. Determining Worker Count

```javascript
const os = require('os');

function getOptimalWorkerCount() {
  const cpuCount = os.cpus().length;

  // Common strategy: Use CPU count minus 1
  // (leave one core for the OS and other processes)
  const workers = Math.max(1, cpuCount - 1);

  return workers;
}

console.log('Recommended workers:', getOptimalWorkerCount());
```

### 2. System Capability Detection

```javascript
const os = require('os');

function analyzeSystemCapabilities() {
  const cpus = os.cpus();
  const cpuCount = cpus.length;
  const cpuSpeed = cpus[0].speed;

  return {
    cores: cpuCount,
    speed: cpuSpeed + ' MHz',
    category: cpuCount >= 8 ? 'High-end' :
              cpuCount >= 4 ? 'Mid-range' : 'Entry-level',
    canHandleMultithreading: cpuCount > 1,
    isHighPerformance: cpuSpeed > 2000,
    recommendedConcurrency: Math.min(cpuCount * 2, 16)
  };
}

const capabilities = analyzeSystemCapabilities();
console.log('System Capabilities:', capabilities);
```

### 3. CPU-Based Configuration

```javascript
const os = require('os');

function getConfiguration() {
  const cpuCount = os.cpus().length;
  const totalMemGB = os.totalmem() / (1024 ** 3);

  return {
    workers: cpuCount >= 8 ? 8 :
             cpuCount >= 4 ? 4 :
             cpuCount >= 2 ? 2 : 1,

    threadPoolSize: cpuCount * 2,

    enableClustering: cpuCount > 1,

    maxConcurrency: cpuCount * 4,

    description: `Optimized for ${cpuCount} cores with ${totalMemGB.toFixed(0)}GB RAM`
  };
}

const config = getConfiguration();
console.log('Configuration:', config);
```

### 4. Performance Profiling

```javascript
const os = require('os');

function createCPUProfile() {
  const cpus = os.cpus();

  return {
    timestamp: new Date().toISOString(),
    cpu: {
      model: cpus[0].model,
      speed: cpus[0].speed,
      count: cpus.length,
      cores: cpus.map((cpu, i) => ({
        id: i,
        speed: cpu.speed,
        user: cpu.times.user,
        sys: cpu.times.sys,
        idle: cpu.times.idle
      }))
    }
  };
}

const profile = createCPUProfile();
console.log(JSON.stringify(profile, null, 2));
```

---

## Best Practices

### 1. Cache Static CPU Information

CPU model and count don't change during execution:

```javascript
// ❌ WRONG - querying every time
function getWorkers() {
  return os.cpus().length;
}

// ✅ CORRECT - cache the value
const CPU_COUNT = os.cpus().length;

function getWorkers() {
  return CPU_COUNT;
}
```

### 2. Don't Assume CPU Symmetry

Not all cores may have the same speed:

```javascript
const os = require('os');

function checkCPUSymmetry() {
  const cpus = os.cpus();
  const speeds = cpus.map(cpu => cpu.speed);
  const uniqueSpeeds = [...new Set(speeds)];

  return {
    symmetric: uniqueSpeeds.length === 1,
    speeds: uniqueSpeeds
  };
}
```

### 3. Consider Both CPU and Memory

Make decisions based on both resources:

```javascript
const os = require('os');

function getOptimalConfig() {
  const cpuCount = os.cpus().length;
  const memoryGB = os.totalmem() / (1024 ** 3);

  // Limited by whichever is more constrained
  if (memoryGB < 4) {
    return { workers: Math.min(2, cpuCount), reason: 'Limited by memory' };
  } else if (cpuCount < 4) {
    return { workers: cpuCount, reason: 'Limited by CPU' };
  } else {
    return { workers: Math.min(cpuCount, 8), reason: 'Optimal' };
  }
}
```

### 4. Understand CPU Times Are Cumulative

CPU times accumulate since boot and never decrease:

```javascript
// CPU times represent total time since boot
const cpus = os.cpus();
console.log('Time in user mode since boot:', cpus[0].times.user, 'ms');

// To get current usage, compare two measurements
```

---

## Common Use Cases

### 1. Cluster Worker Setup

```javascript
const os = require('os');
const cluster = require('cluster');

if (cluster.isMaster) {
  const numWorkers = os.cpus().length;

  console.log(`Starting ${numWorkers} workers...`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
} else {
  // Worker process
  startServer();
}
```

### 2. Thread Pool Sizing

```javascript
const os = require('os');

// Common pattern: CPU count * 2
const threadPoolSize = os.cpus().length * 2;

process.env.UV_THREADPOOL_SIZE = threadPoolSize;
console.log('Thread pool size:', threadPoolSize);
```

### 3. System Requirements Check

```javascript
const os = require('os');

function checkCPURequirements() {
  const cpuCount = os.cpus().length;
  const cpuSpeed = os.cpus()[0].speed;

  const requirements = {
    minCores: 2,
    minSpeed: 1000 // 1 GHz
  };

  if (cpuCount < requirements.minCores) {
    throw new Error(`Insufficient CPU cores. Required: ${requirements.minCores}, Found: ${cpuCount}`);
  }

  if (cpuSpeed < requirements.minSpeed) {
    console.warn(`CPU speed is below recommended: ${cpuSpeed} MHz`);
  }

  console.log('✓ CPU requirements met');
}
```

---

## Summary

- Use `os.cpus()` to get information about all CPU cores
- CPU times are cumulative since system boot
- Cache CPU count and model (they don't change)
- Use CPU count to determine optimal worker/thread counts
- Consider both CPU and memory when making decisions
- CPU times help understand system load and usage
- Modern systems have multiple cores - leverage them!

Understanding CPU information helps you build applications that effectively utilize available processing power and make informed concurrency decisions.
