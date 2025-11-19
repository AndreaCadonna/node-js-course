# Guide 5: System Uptime

Understanding system uptime and time formatting in Node.js.

## Table of Contents
- [What is Uptime?](#what-is-uptime)
- [Getting Uptime](#getting-uptime)
- [Formatting Uptime](#formatting-uptime)
- [Practical Applications](#practical-applications)
- [Best Practices](#best-practices)

---

## What is Uptime?

### Definition

**Uptime** is the amount of time a system has been running since its last boot or restart, measured in seconds.

### Why Monitor Uptime?

1. **System stability**: Longer uptime can indicate stable system
2. **Maintenance planning**: Know when system was last rebooted
3. **Update management**: Long uptime may mean pending updates
4. **Troubleshooting**: Helps diagnose reboot-related issues
5. **Monitoring**: Track system availability and reliability

### System vs Process Uptime

```javascript
const os = require('os');

// System uptime (since last boot)
const systemUptime = os.uptime();

// Process uptime (since Node.js started)
const processUptime = process.uptime();

console.log('System running for:', systemUptime, 'seconds');
console.log('Process running for:', processUptime, 'seconds');
console.log('System is', Math.floor(systemUptime / processUptime), 'times older');
```

---

## Getting Uptime

### Basic Uptime

```javascript
const os = require('os');

// Get uptime in seconds
const uptimeSeconds = os.uptime();
console.log('System Uptime:', uptimeSeconds, 'seconds');

// Example output: 1234567.89
```

### Uptime Returns Seconds

The uptime is returned as a **number of seconds** since boot:

```javascript
const os = require('os');

const uptime = os.uptime();
console.log(typeof uptime);  // 'number'
console.log(uptime);         // 1234567.89 (can have decimals)
console.log(Math.floor(uptime)); // 1234567 (whole seconds)
```

### Calculate Boot Time

```javascript
const os = require('os');

function getBootTime() {
  const uptimeMs = os.uptime() * 1000;
  const bootTime = new Date(Date.now() - uptimeMs);
  return bootTime;
}

const bootTime = getBootTime();
console.log('System booted at:', bootTime.toLocaleString());
console.log('Boot date:', bootTime.toDateString());
console.log('Boot time:', bootTime.toLocaleTimeString());
```

---

## Formatting Uptime

### Basic Time Conversion

```javascript
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return {
    days,
    hours,
    minutes,
    seconds: secs,
    formatted: `${days}d ${hours}h ${minutes}m ${secs}s`
  };
}

const uptime = os.uptime();
const formatted = formatUptime(uptime);
console.log(formatted.formatted);
// Output: "14d 5h 32m 18s"
```

### Human-Readable Format

```javascript
function getHumanReadableUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];

  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  }
  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }

  return parts.join(', ');
}

const uptime = os.uptime();
console.log('Uptime:', getHumanReadableUptime(uptime));
// Output: "14 days, 5 hours, 32 minutes"
```

### Different Time Units

```javascript
const os = require('os');

function getUptimeInUnits() {
  const seconds = os.uptime();

  return {
    seconds: Math.floor(seconds),
    minutes: Math.floor(seconds / 60),
    hours: Math.floor(seconds / 3600),
    days: Math.floor(seconds / 86400),
    weeks: Math.floor(seconds / 604800)
  };
}

const units = getUptimeInUnits();
console.log('Uptime in different units:');
console.log('Seconds:', units.seconds);
console.log('Minutes:', units.minutes);
console.log('Hours:', units.hours);
console.log('Days:', units.days);
console.log('Weeks:', units.weeks);
```

### Compact Format

```javascript
function formatUptimeCompact(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

const uptime = os.uptime();
console.log('Uptime:', formatUptimeCompact(uptime));
// Output: "14d 5h" or "5h 32m" or "32m"
```

---

## Practical Applications

### 1. Uptime Status Indicator

```javascript
const os = require('os');

function getUptimeStatus() {
  const uptime = os.uptime();
  const days = uptime / 86400;

  if (days < 1) {
    return {
      status: 'Recently Rebooted',
      emoji: '🔄',
      color: 'blue',
      message: 'System was recently restarted'
    };
  } else if (days < 7) {
    return {
      status: 'Normal',
      emoji: '✅',
      color: 'green',
      message: 'System uptime is healthy'
    };
  } else if (days < 30) {
    return {
      status: 'Long Uptime',
      emoji: '⏰',
      color: 'yellow',
      message: 'System has been running for a while'
    };
  } else {
    return {
      status: 'Very Long Uptime',
      emoji: '⚠️',
      color: 'orange',
      message: 'Consider restarting to apply updates'
    };
  }
}

const status = getUptimeStatus();
console.log(status.emoji, status.status);
console.log(status.message);
```

### 2. Uptime Report

```javascript
const os = require('os');

function generateUptimeReport() {
  const uptime = os.uptime();
  const bootTime = new Date(Date.now() - uptime * 1000);
  const formatted = formatUptime(uptime);

  return {
    report: `
╔════════════════════════════════════════════╗
║           SYSTEM UPTIME REPORT             ║
╚════════════════════════════════════════════╝

Current Time    : ${new Date().toLocaleString()}
Boot Time       : ${bootTime.toLocaleString()}
Uptime          : ${formatted.formatted}

Breakdown:
  Days          : ${formatted.days}
  Hours         : ${formatted.hours}
  Minutes       : ${formatted.minutes}
  Seconds       : ${formatted.seconds}

Human Readable  : ${getHumanReadableUptime(uptime)}
    `,
    data: {
      current: new Date(),
      boot: bootTime,
      uptime: uptime,
      formatted: formatted
    }
  };
}

const report = generateUptimeReport();
console.log(report.report);
```

### 3. Uptime Monitoring

```javascript
const os = require('os');

class UptimeMonitor {
  constructor(checkInterval = 3600000) { // 1 hour
    this.checkInterval = checkInterval;
    this.lastUptime = 0;
  }

  start() {
    this.monitor();
    this.timer = setInterval(() => {
      this.monitor();
    }, this.checkInterval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  monitor() {
    const currentUptime = os.uptime();

    // Detect if system was rebooted
    if (this.lastUptime > 0 && currentUptime < this.lastUptime) {
      console.log('🔄 System reboot detected!');
      console.log('Previous uptime:', formatUptime(this.lastUptime).formatted);
      console.log('New uptime:', formatUptime(currentUptime).formatted);
      this.onReboot(this.lastUptime, currentUptime);
    }

    this.lastUptime = currentUptime;

    // Log current uptime
    const formatted = formatUptime(currentUptime);
    console.log(`[${new Date().toLocaleTimeString()}] Uptime: ${formatted.formatted}`);
  }

  onReboot(oldUptime, newUptime) {
    // Override this method to handle reboot events
    console.log('Reboot handler - implement your logic here');
  }
}

// Usage
const monitor = new UptimeMonitor();
monitor.onReboot = (old, new_) => {
  console.log('System was rebooted - send alert!');
};
monitor.start();
```

### 4. Uptime vs Process Time

```javascript
const os = require('os');

function compareUptimes() {
  const systemUptime = os.uptime();
  const processUptime = process.uptime();

  return {
    system: {
      uptime: systemUptime,
      formatted: formatUptime(systemUptime).formatted,
      boot: new Date(Date.now() - systemUptime * 1000)
    },
    process: {
      uptime: processUptime,
      formatted: formatUptime(processUptime).formatted,
      started: new Date(Date.now() - processUptime * 1000)
    },
    ratio: (systemUptime / processUptime).toFixed(2),
    difference: systemUptime - processUptime
  };
}

const comparison = compareUptimes();
console.log('System Uptime:', comparison.system.formatted);
console.log('Process Uptime:', comparison.process.formatted);
console.log('Ratio:', comparison.ratio + 'x');
```

---

## Best Practices

### 1. Format for Human Readability

Raw seconds are hard to understand:

```javascript
// ❌ WRONG - raw seconds
console.log('Uptime:', os.uptime()); // 1234567

// ✅ CORRECT - formatted
console.log('Uptime:', formatUptime(os.uptime()).formatted); // "14d 5h 32m 47s"
```

### 2. Include Boot Time in Reports

Boot time is often more useful than uptime:

```javascript
const os = require('os');

function getSystemInfo() {
  const uptime = os.uptime();
  const bootTime = new Date(Date.now() - uptime * 1000);

  return {
    uptime: formatUptime(uptime).formatted,
    bootTime: bootTime.toLocaleString(),
    lastRestart: bootTime.toDateString()
  };
}
```

### 3. Consider Long Uptimes

Very long uptimes might indicate missed updates:

```javascript
const os = require('os');

function checkUptimeHealth() {
  const days = os.uptime() / 86400;

  if (days > 90) {
    console.warn('⚠️  System uptime is very long (${days.toFixed(0)} days)');
    console.warn('Consider restarting to apply security updates');
  }
}
```

### 4. Handle Reboot Detection

Monitor for unexpected reboots:

```javascript
let previousUptime = os.uptime();

setInterval(() => {
  const currentUptime = os.uptime();

  if (currentUptime < previousUptime) {
    console.log('System was rebooted!');
    // Send notification, log event, etc.
  }

  previousUptime = currentUptime;
}, 60000); // Check every minute
```

---

## Summary

- Use `os.uptime()` to get system uptime in seconds
- Format uptime into human-readable strings
- Calculate boot time by subtracting uptime from current time
- Long uptimes (>30 days) may indicate pending updates
- Compare system uptime with process uptime for context
- Monitor uptime changes to detect system reboots
- Always format uptime for display (days, hours, minutes)

Understanding uptime helps you monitor system stability, plan maintenance windows, and detect unexpected system restarts.
