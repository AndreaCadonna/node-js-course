# Guide 2: Memory Management

Understanding system memory monitoring and management in Node.js.

## Table of Contents
- [Memory Basics](#memory-basics)
- [Total vs Free Memory](#total-vs-free-memory)
- [Memory Units](#memory-units)
- [Memory Monitoring](#memory-monitoring)
- [Best Practices](#best-practices)

---

## Memory Basics

### What is System Memory?

System memory (RAM - Random Access Memory) is the hardware that temporarily stores data for active processes. Unlike disk storage, RAM is:

- **Fast**: Quick access and retrieval
- **Volatile**: Data is lost when power is off
- **Limited**: Finite resource shared by all processes
- **Critical**: Insufficient memory causes system slowdown

### Why Monitor Memory?

1. **Resource allocation**: Determine if you can load data into memory
2. **Performance optimization**: Choose appropriate processing strategies
3. **Health monitoring**: Detect memory pressure and issues
4. **Capacity planning**: Understand system limits
5. **Auto-scaling**: Make intelligent scaling decisions

---

## Total vs Free Memory

### Total Memory

Total memory is the complete amount of RAM installed on the system:

```javascript
const os = require('os');

const totalMemory = os.totalmem();
console.log('Total Memory:', totalMemory, 'bytes');
```

**Important**: This value rarely changes and can be cached.

### Free Memory

Free memory is the amount of RAM currently available:

```javascript
const os = require('os');

const freeMemory = os.freemem();
console.log('Free Memory:', freeMemory, 'bytes');
```

**Important**: This value changes constantly as programs allocate and release memory.

### Used Memory

Used memory is calculated by subtracting free from total:

```javascript
const os = require('os');

const totalMem = os.totalmem();
const freeMem = os.freemem();
const usedMem = totalMem - freeMem;

console.log('Used Memory:', usedMem, 'bytes');
```

### Memory Usage Percentage

```javascript
const os = require('os');

function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usagePercent = (used / total) * 100;

  return {
    total,
    free,
    used,
    usagePercent
  };
}

const usage = getMemoryUsage();
console.log('Memory Usage:', usage.usagePercent.toFixed(2) + '%');
```

---

## Memory Units

### Understanding Bytes

Memory is measured in bytes, but raw byte values are difficult to read:

```javascript
const os = require('os');

console.log(os.totalmem()); // 17179869184 - Hard to read!
```

### Conversion Units

```
1 Byte (B) = 8 bits
1 Kilobyte (KB) = 1,024 bytes
1 Megabyte (MB) = 1,024 KB = 1,048,576 bytes
1 Gigabyte (GB) = 1,024 MB = 1,073,741,824 bytes
1 Terabyte (TB) = 1,024 GB
```

### Converting to Human-Readable Format

```javascript
function formatBytes(bytes) {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;
  const TB = GB * 1024;

  if (bytes >= TB) {
    return (bytes / TB).toFixed(2) + ' TB';
  } else if (bytes >= GB) {
    return (bytes / GB).toFixed(2) + ' GB';
  } else if (bytes >= MB) {
    return (bytes / MB).toFixed(2) + ' MB';
  } else if (bytes >= KB) {
    return (bytes / KB).toFixed(2) + ' KB';
  } else {
    return bytes + ' B';
  }
}

const totalMem = os.totalmem();
console.log('Total Memory:', formatBytes(totalMem)); // "16.00 GB"
```

### Quick Conversion Functions

```javascript
// Bytes to Megabytes
function bytesToMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

// Bytes to Gigabytes
function bytesToGB(bytes) {
  return (bytes / (1024 * 1024 * 1024)).toFixed(2);
}

// Megabytes to Bytes
function mbToBytes(mb) {
  return mb * 1024 * 1024;
}

// Gigabytes to Bytes
function gbToBytes(gb) {
  return gb * 1024 * 1024 * 1024;
}
```

---

## Memory Monitoring

### Simple Memory Check

```javascript
const os = require('os');

function checkMemory() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usagePercent = (used / total) * 100;

  console.log('Memory Status:');
  console.log('Total:', formatBytes(total));
  console.log('Free:', formatBytes(free));
  console.log('Used:', formatBytes(used));
  console.log('Usage:', usagePercent.toFixed(2) + '%');
}

checkMemory();
```

### Continuous Monitoring

```javascript
const os = require('os');

function startMemoryMonitor(intervalMs = 5000) {
  console.log('Starting memory monitor...\n');

  const interval = setInterval(() => {
    const total = os.totalmem();
    const free = os.freemem();
    const usagePercent = ((total - free) / total) * 100;

    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Memory: ${usagePercent.toFixed(1)}%`);

    // Alert if usage is high
    if (usagePercent > 85) {
      console.warn('⚠️  High memory usage detected!');
    }
  }, intervalMs);

  // Return function to stop monitoring
  return () => {
    clearInterval(interval);
    console.log('Memory monitor stopped');
  };
}

// Start monitoring
const stopMonitor = startMemoryMonitor();

// Stop after 30 seconds
setTimeout(() => {
  stopMonitor();
}, 30000);
```

### Memory Thresholds

```javascript
const os = require('os');

function getMemoryStatus() {
  const total = os.totalmem();
  const free = os.freemem();
  const usagePercent = ((total - free) / total) * 100;

  if (usagePercent >= 90) {
    return {
      level: 'CRITICAL',
      emoji: '🔴',
      message: 'Memory critically low - immediate action required'
    };
  } else if (usagePercent >= 75) {
    return {
      level: 'WARNING',
      emoji: '🟡',
      message: 'Memory usage is high - monitor closely'
    };
  } else if (usagePercent >= 50) {
    return {
      level: 'MODERATE',
      emoji: '🟢',
      message: 'Memory usage is moderate'
    };
  } else {
    return {
      level: 'HEALTHY',
      emoji: '✅',
      message: 'Memory usage is healthy'
    };
  }
}

const status = getMemoryStatus();
console.log(status.emoji, status.level);
console.log(status.message);
```

---

## Best Practices

### 1. Don't Poll Too Frequently

```javascript
// ❌ WRONG - excessive polling
setInterval(() => {
  console.log(os.freemem());
}, 10); // Every 10ms is wasteful!

// ✅ CORRECT - reasonable interval
setInterval(() => {
  console.log(os.freemem());
}, 5000); // Every 5 seconds is appropriate
```

### 2. Always Format for Display

```javascript
// ❌ WRONG - raw bytes
console.log('Memory:', os.totalmem()); // 17179869184

// ✅ CORRECT - human-readable
const memGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
console.log('Memory:', memGB, 'GB'); // 16.00 GB
```

### 3. Cache Total Memory

```javascript
// Total memory doesn't change, cache it
const TOTAL_MEMORY = os.totalmem();

function getMemoryInfo() {
  const free = os.freemem(); // Only query changing value
  const used = TOTAL_MEMORY - free;

  return { total: TOTAL_MEMORY, free, used };
}
```

### 4. Make Resource-Aware Decisions

```javascript
const os = require('os');

function shouldLoadIntoMemory(fileSize) {
  const freeMem = os.freemem();
  const safetyMargin = 1.5; // 50% buffer

  return fileSize * safetyMargin < freeMem;
}

// Example usage
const fileSize = 500 * 1024 * 1024; // 500MB
if (shouldLoadIntoMemory(fileSize)) {
  // Load entire file into memory
  processFileInMemory();
} else {
  // Use streaming
  processFileAsStream();
}
```

### 5. Understand Memory is Shared

```javascript
// Node.js process memory is PART of free memory
const os = require('os');

function analyzeMemory() {
  const systemTotal = os.totalmem();
  const systemFree = os.freemem();
  const processUsed = process.memoryUsage().heapUsed;

  console.log('System Total:', formatBytes(systemTotal));
  console.log('System Free:', formatBytes(systemFree));
  console.log('This Process:', formatBytes(processUsed));
}
```

---

## Common Use Cases

### 1. Memory-Based Configuration

```javascript
const os = require('os');

function getConfiguration() {
  const totalGB = os.totalmem() / (1024 ** 3);

  return {
    cacheSize: totalGB > 16 ? '1GB' : totalGB > 8 ? '512MB' : '256MB',
    maxWorkers: totalGB > 16 ? 8 : totalGB > 8 ? 4 : 2,
    enableCaching: totalGB > 4
  };
}
```

### 2. Health Check Endpoint

```javascript
const os = require('os');

app.get('/health', (req, res) => {
  const total = os.totalmem();
  const free = os.freemem();
  const usagePercent = ((total - free) / total) * 100;

  res.json({
    status: usagePercent < 85 ? 'healthy' : 'warning',
    memory: {
      total: formatBytes(total),
      free: formatBytes(free),
      usagePercent: usagePercent.toFixed(2) + '%'
    }
  });
});
```

### 3. Adaptive Processing

```javascript
const os = require('os');

function chooseStrategy(dataSize) {
  const freeMem = os.freemem();

  if (dataSize < freeMem * 0.5) {
    return 'in-memory'; // Fast
  } else if (dataSize < freeMem * 0.8) {
    return 'buffered'; // Moderate
  } else {
    return 'streaming'; // Safe
  }
}
```

---

## Summary

- Use `os.totalmem()` for total system memory (can be cached)
- Use `os.freemem()` for available memory (changes frequently)
- Always convert bytes to human-readable units (GB, MB)
- Monitor memory usage to make informed decisions
- Don't poll memory too frequently (5-10 seconds is reasonable)
- Make resource-aware decisions based on available memory
- Remember that system memory is shared by all processes

Understanding memory management helps you build efficient applications that adapt to available resources and avoid out-of-memory errors.
