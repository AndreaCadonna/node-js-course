# Guide 2: Load Average Monitoring

Understanding system load average in Node.js (Unix-like systems).

## What is Load Average?

Load average represents the average number of processes waiting for CPU time over 1, 5, and 15 minute intervals. Only available on Unix-like systems (Linux, macOS, BSD).

## Getting Load Average

```javascript
const os = require('os');

// Check if available
if (os.platform() !== 'win32') {
  const [load1, load5, load15] = os.loadavg();
  console.log('1-min:', load1);
  console.log('5-min:', load5);
  console.log('15-min:', load15);
}
```

## Interpreting Load

Load average should be interpreted relative to CPU count:

```javascript
const load = os.loadavg()[0];
const cpuCount = os.cpus().length;
const normalized = load / cpuCount;

if (normalized < 0.7) {
  console.log('System is healthy');
} else if (normalized < 1.0) {
  console.log('System is busy');
} else {
  console.log('System is overloaded');
}
```

## Understanding the Numbers

- **< 0.7 per CPU**: System is underutilized
- **0.7 - 1.0 per CPU**: System is busy but healthy
- **> 1.0 per CPU**: System is overloaded (processes waiting)

## Trend Analysis

```javascript
const [load1, load5, load15] = os.loadavg();

if (load1 > load5 && load5 > load15) {
  console.log('Load is increasing');
} else if (load1 < load5 && load5 < load15) {
  console.log('Load is decreasing');
} else {
  console.log('Load is stable or fluctuating');
}
```

## Platform Considerations

- **Linux/macOS**: Load average available via `os.loadavg()`
- **Windows**: Not available - use alternative monitoring
- **FreeBSD/OpenBSD**: Available

## Best Practices

1. Always check platform before using
2. Normalize by CPU count
3. Monitor trends over time
4. Set alerts based on sustained high load
5. Consider all three timeframes

## Summary

- Load average shows system pressure
- Interpret relative to CPU count
- Only available on Unix-like systems
- Use for capacity planning and alerting
