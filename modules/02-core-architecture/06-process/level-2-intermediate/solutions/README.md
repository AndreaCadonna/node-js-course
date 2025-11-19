# Level 2: Intermediate - Solutions

This directory contains comprehensive, production-quality solutions for all Level 2 Intermediate exercises in the Process module. Each solution demonstrates advanced process management, signal handling, IPC, and production patterns.

## Overview

These solutions cover intermediate to advanced process operations:
- HTTP server with graceful shutdown
- Resource monitoring with threshold alerts
- Error recovery and classification systems
- Configuration hot-reloading with SIGHUP
- Task queue with worker pool and IPC

## Solutions

### Exercise 1: HTTP Server with Graceful Shutdown
**File:** `exercise-1-solution.js`
**Difficulty:** Medium

A production-ready HTTP server that implements graceful shutdown when receiving termination signals.

**Key Concepts:**
- `SIGTERM` and `SIGINT` signal handling
- Connection tracking with Set
- `server.close()` for graceful shutdown
- Shutdown timeout to prevent hanging
- Rejecting new requests during shutdown (503 responses)
- `process.exit()` with appropriate exit codes

**Features:**
- Tracks all active socket connections
- Waits for ongoing requests to complete
- Implements maximum wait timeout (10 seconds)
- Force-closes connections if timeout reached
- Rejects new requests during shutdown
- Comprehensive shutdown logging

**Running:**
```bash
node exercise-1-solution.js

# In another terminal, test the server:
curl http://localhost:3000

# Trigger graceful shutdown:
# Method 1: Press Ctrl+C
# Method 2: kill <pid>
# Method 3: kill -SIGTERM <pid>
```

**Sample Output:**
```
═════════════════════════════════════════════════════════
✅ Server running on http://localhost:3000
📋 Process ID: 12345
═════════════════════════════════════════════════════════

📨 Received GET /
✅ Completed GET / (1234ms)

🛑 Received SIGINT - Starting graceful shutdown...
⏳ Waiting for 2 active connection(s) to complete...
✅ Server closed - all connections finished naturally
```

**What You'll Learn:**
- How to implement graceful shutdown patterns
- Managing server lifecycle events
- Tracking and closing connections
- Using signal handlers in production
- Preventing data loss during shutdown

---

### Exercise 2: Resource Monitor with Alerts
**File:** `exercise-2-solution.js`
**Difficulty:** Medium

A real-time resource monitoring system with threshold-based alerts, historical tracking, and dynamic configuration.

**Key Concepts:**
- `process.memoryUsage()` for memory metrics
- `process.cpuUsage()` with delta calculations
- Threshold-based monitoring
- Alert cooldown to prevent spam
- Historical data tracking with bounded size
- Statistical analysis (averages, peaks)
- `SIGUSR1` for dynamic threshold updates
- `setInterval()` for periodic monitoring

**Features:**
- Monitors RSS, heap, and CPU usage
- Configurable thresholds with alerts
- Alert rate limiting (cooldown period)
- Tracks last 10 samples for trend analysis
- Calculates averages and peak values
- Dynamic threshold adjustment via signal
- Comprehensive summary on shutdown

**Running:**
```bash
node exercise-2-solution.js

# In another terminal, adjust thresholds:
kill -SIGUSR1 <pid>

# Stop monitoring:
# Press Ctrl+C
```

**Sample Output:**
```
📊 Sample #5 (Uptime: 10.05s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 Memory: RSS 45.23 MB, Heap 8.75/12.50 MB
⚙️  CPU: 2.45% (User: 24.50ms, System: 2.10ms)

🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨
🚨 ALERT: MEMORY threshold exceeded!
   RSS: 160.25 MB (threshold: 150.00 MB)
   Heap Used: 120.50 MB
```

**What You'll Learn:**
- CPU usage calculation with deltas
- Memory metrics interpretation
- Alert management and rate limiting
- Historical data tracking patterns
- Signal-based dynamic configuration
- Production monitoring patterns

---

### Exercise 3: Error Recovery System
**File:** `exercise-3-solution.js`
**Difficulty:** Hard

A comprehensive error handling system that classifies errors, implements recovery strategies, and prevents crash loops.

**Key Concepts:**
- `process.on('uncaughtException')` handler
- `process.on('unhandledRejection')` handler
- Error classification (recoverable vs fatal)
- Recovery strategy patterns
- Error rate limiting
- File-based error logging
- Alert notifications for critical errors
- Graceful shutdown on fatal errors

**Features:**
- Classifies errors by type and code
- Multiple recovery strategies (retry, skip, log, shutdown)
- Rate limiting to prevent crash loops
- Comprehensive error logging to file
- Alert system with context
- Automatic shutdown on fatal errors
- Error statistics tracking

**Running:**
```bash
node exercise-3-solution.js

# The solution includes test scenarios that will:
# 1. Trigger recoverable errors
# 2. Trigger unhandled promise rejections
# 3. Test rate limiting
# 4. Eventually trigger a fatal error
```

**Sample Output:**
```
═══════════════════════════════════════════════════════════
⚠️  UNCAUGHT EXCEPTION DETECTED
═══════════════════════════════════════════════════════════
🔴 UNCAUGHT_EXCEPTION: Network timeout
   Code: ETIMEDOUT
   Recoverable: ✅ Yes

🔍 Error Classification:
   Recoverable: true
   Strategy: retry
   Reason: Network error - can retry operation

📢 CRITICAL ERROR ALERT
   Type: UNCAUGHT_EXCEPTION
   Strategy: retry

♻️  Recovery Strategy: RETRY
   → Error logged, operation can be retried
   → Application continues normally

✅ Recovery successful - process continuing
```

**What You'll Learn:**
- Handling uncaught exceptions safely
- Promise rejection handling
- Error classification techniques
- Recovery strategy patterns
- Preventing crash loops
- Production error handling

---

### Exercise 4: Configuration Reloader
**File:** `exercise-4-solution.js`
**Difficulty:** Hard

A configuration management system that supports hot-reloading via SIGHUP signal without process restart.

**Key Concepts:**
- `SIGHUP` signal for configuration reload
- Configuration validation before applying
- JSON file parsing and validation
- Configuration diffing algorithm
- Rollback on validation failure
- Zero-downtime configuration updates
- Deep object comparison

**Features:**
- Loads configuration from JSON file
- Validates configuration schema
- Handles SIGHUP for hot reload
- Detects and displays configuration changes
- Rolls back to previous config on error
- Maintains application state during reload
- Comprehensive diff reporting

**Running:**
```bash
node exercise-4-solution.js

# Edit the created config.json file, then:
kill -SIGHUP <pid>

# Or use:
kill -SIGHUP $(pgrep -f exercise-4)
```

**Sample Output:**
```
🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄
🔄 CONFIGURATION RELOAD TRIGGERED
🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄
📨 Received SIGHUP signal
💾 Current configuration backed up

📖 Loading new configuration...
✅ Configuration loaded and validated

🔍 Comparing configurations...

📝 Configuration changes detected:

  🔄 Modified:
     app.port: 3000 → 8080
     features.maxConnections: 100 → 200

✅ Configuration reloaded successfully!
📊 Total reloads: 2
```

**What You'll Learn:**
- SIGHUP signal pattern for config reload
- Configuration validation strategies
- Rollback mechanisms
- Diffing algorithms for objects
- Hot-reloading without downtime
- Production configuration management

---

### Exercise 5: Task Queue with Worker Pool
**File:** `exercise-5-solution.js`
**Difficulty:** Hard

A task queue system with worker pool using child processes and Inter-Process Communication (IPC).

**Key Concepts:**
- `child_process.fork()` for spawning workers
- IPC with `process.send()` and `process.on('message')`
- Worker pool management
- Task queue and distribution
- Load balancing across workers
- Worker failure detection and respawning
- Task requeuing on worker failure
- Graceful shutdown with cleanup

**Features:**
- Spawns multiple worker processes
- Distributes tasks across workers
- Handles worker failures gracefully
- Respawns dead workers automatically
- Requeues tasks if worker crashes
- Tracks worker statistics
- Real-time status display
- Graceful shutdown of all workers

**Running:**
```bash
node exercise-5-solution.js

# The master process will:
# 1. Spawn 3 worker processes
# 2. Add sample tasks to queue
# 3. Distribute tasks to workers
# 4. Display statistics every 3 seconds

# Press Ctrl+C to shutdown gracefully
```

**Sample Output:**
```
═══════════════════════════════════════════════════════════════
TASK QUEUE WITH WORKER POOL
═══════════════════════════════════════════════════════════════

🎯 Master Process (PID: 12345)
👷 Spawning 3 workers...

🔧 Spawning worker #1...
✅ Worker #1 spawned (PID: 12346)
👷 Worker #1 started (PID: 12346)
✅ Worker #1 is ready

📋 Adding sample tasks to queue...
📝 Added task #1: compute
📝 Added task #2: io

📤 Assigning task #1 (compute) to worker #1
[Worker #1] Processing task #1: compute
✅ Task #1 completed by worker #1

═══════════════════════════════════════════════════════════════
📊 TASK QUEUE STATISTICS
═══════════════════════════════════════════════════════════════

👷 Workers:
   🟢 Worker #1 (PID: 12346) - idle - 3 completed, 0 failed
   🟡 Worker #2 (PID: 12347) - busy - 2 completed, 0 failed
   🟢 Worker #3 (PID: 12348) - idle - 2 completed, 1 failed

📋 Queue:
   Pending: 1
   Completed: 7
   Failed: 1
   Average Duration: 1250.50ms
```

**What You'll Learn:**
- Child process creation and management
- IPC patterns and message passing
- Worker pool design patterns
- Load distribution strategies
- Fault tolerance and recovery
- Task queue implementation
- Multi-process architecture

---

## Running All Solutions

Test each solution individually:

```bash
# Solution 1 - HTTP Server with Graceful Shutdown
node exercise-1-solution.js
# Test: curl http://localhost:3000
# Shutdown: Ctrl+C

# Solution 2 - Resource Monitor
node exercise-2-solution.js
# Adjust thresholds: kill -SIGUSR1 <pid>
# Shutdown: Ctrl+C

# Solution 3 - Error Recovery (includes test scenarios)
node exercise-3-solution.js
# Observe error handling and recovery

# Solution 4 - Configuration Reloader
node exercise-4-solution.js
# Edit config.json, then: kill -SIGHUP <pid>

# Solution 5 - Task Queue with Workers
node exercise-5-solution.js
# Observe task distribution and worker management
```

## Key Takeaways from All Solutions

### 1. Signal Handling
- **SIGTERM/SIGINT**: Standard termination signals for graceful shutdown
- **SIGHUP**: Unix convention for configuration reload
- **SIGUSR1/SIGUSR2**: Custom signals for dynamic behavior
- Always register signal handlers early in application lifecycle
- Handle signals gracefully to prevent data loss

### 2. Process Lifecycle Management
- Track application state (starting, running, shutting down)
- Reject new work during shutdown
- Wait for ongoing operations to complete
- Implement shutdown timeouts to prevent hanging
- Use appropriate exit codes (0 for success, non-zero for errors)

### 3. Resource Monitoring
- Use `process.memoryUsage()` for memory metrics
- Calculate CPU usage deltas (not absolute values)
- Monitor against thresholds
- Implement alert rate limiting
- Track historical data for trend analysis
- Provide summary statistics

### 4. Error Handling
- Register `uncaughtException` and `unhandledRejection` handlers
- Classify errors (recoverable vs fatal)
- Implement recovery strategies
- Prevent crash loops with rate limiting
- Log errors comprehensively
- Integrate with monitoring services

### 5. Inter-Process Communication
- Use `child_process.fork()` for process creation
- Implement message-based communication
- Handle worker failures gracefully
- Respawn dead workers
- Distribute load across workers
- Track worker statistics

### 6. Configuration Management
- Validate configuration before applying
- Keep backup for rollback
- Calculate and display diffs
- Support hot-reloading
- Handle validation errors gracefully
- Zero-downtime updates

## Production Patterns

### Graceful Shutdown
```javascript
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  // 1. Stop accepting new work
  // 2. Wait for ongoing work
  // 3. Close resources
  // 4. Exit with appropriate code
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### Connection Tracking
```javascript
const connections = new Set();

server.on('connection', (socket) => {
  connections.add(socket);
  socket.on('close', () => connections.delete(socket));

  if (isShuttingDown) {
    socket.destroy();
  }
});
```

### CPU Usage Delta
```javascript
let previousCpu = process.cpuUsage();
let previousTime = Date.now();

function checkCPU() {
  const currentCpu = process.cpuUsage();
  const currentTime = Date.now();

  const elapsed = currentTime - previousTime;
  const totalDelta = (currentCpu.user - previousCpu.user) +
                     (currentCpu.system - previousCpu.system);

  const cpuPercent = ((totalDelta / 1000) / elapsed) * 100;

  previousCpu = currentCpu;
  previousTime = currentTime;

  return cpuPercent;
}
```

### Error Classification
```javascript
function classifyError(error) {
  // Network errors - recoverable
  if (['ETIMEDOUT', 'ECONNREFUSED'].includes(error.code)) {
    return { recoverable: true, strategy: 'retry' };
  }

  // Memory errors - fatal
  if (error.message.includes('heap out of memory')) {
    return { recoverable: false, strategy: 'shutdown' };
  }

  // Default
  return { recoverable: true, strategy: 'log' };
}
```

### Worker Pool IPC
```javascript
// Master
worker.process.send({ type: 'task', task: {...} });
worker.process.on('message', (msg) => {
  if (msg.type === 'result') {
    handleResult(msg);
  }
});

// Worker
process.on('message', (msg) => {
  if (msg.type === 'task') {
    const result = processTask(msg.task);
    process.send({ type: 'result', result });
  }
});
```

## Testing Strategies

### Testing Graceful Shutdown
```bash
# Start server
node exercise-1-solution.js &
PID=$!

# Make requests
curl http://localhost:3000 &
curl http://localhost:3000 &

# Trigger shutdown while requests are in flight
kill $PID

# Verify requests complete before shutdown
```

### Testing Error Recovery
```bash
# Run with error scenarios
node exercise-3-solution.js

# Trigger specific errors
# (modify code to throw different error types)
```

### Testing Configuration Reload
```bash
# Start app
node exercise-4-solution.js &
PID=$!

# Modify config
echo '{"app": {"port": 8080}}' > config.json

# Reload
kill -SIGHUP $PID

# Verify new config applied
```

## Integration with Production Systems

### Monitoring Integration
```javascript
// Sentry for error tracking
Sentry.captureException(error, {
  tags: { type: errorType },
  extra: { classification }
});

// DataDog for metrics
statsd.gauge('memory.rss', memoryUsage.rss);
statsd.gauge('cpu.percent', cpuPercent);
```

### Logging Integration
```javascript
// Structured logging with Winston
logger.error('Error occurred', {
  type: errorType,
  message: error.message,
  stack: error.stack,
  pid: process.pid,
  uptime: process.uptime()
});
```

### Health Checks
```javascript
app.get('/health', (req, res) => {
  if (isShuttingDown) {
    res.status(503).json({ status: 'shutting down' });
  } else {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  }
});
```

## Common Pitfalls and Solutions

### 1. Not Handling All Signals
**Problem:** Only handling SIGINT (Ctrl+C), not SIGTERM (production)
**Solution:** Handle both SIGTERM and SIGINT

### 2. No Shutdown Timeout
**Problem:** Process hangs indefinitely waiting for connections
**Solution:** Implement maximum wait time with force-close

### 3. Incorrect CPU Calculation
**Problem:** Using absolute CPU values instead of deltas
**Solution:** Calculate delta between measurements

### 4. Memory Leaks in History
**Problem:** Unbounded historical data storage
**Solution:** Limit history size, remove oldest entries

### 5. Alert Spam
**Problem:** Same alert fires repeatedly
**Solution:** Implement cooldown period between alerts

### 6. Not Respawning Workers
**Problem:** Worker pool shrinks when workers die
**Solution:** Automatically respawn failed workers

### 7. Lost Tasks on Worker Failure
**Problem:** Tasks lost when worker crashes
**Solution:** Requeue tasks from failed workers

## Next Steps

After mastering these intermediate solutions:

1. **Review and Compare**
   - Compare your solutions with these references
   - Identify areas for improvement
   - Note best practices demonstrated

2. **Extend the Solutions**
   - Add more recovery strategies to error handler
   - Implement worker scaling based on queue size
   - Add health check endpoints to HTTP server
   - Store configuration history

3. **Move to Level 3**
   - Advanced topics: clustering, performance
   - Production deployment patterns
   - Scaling strategies
   - Advanced monitoring

4. **Apply to Your Projects**
   - Implement graceful shutdown in your apps
   - Add resource monitoring
   - Set up error recovery
   - Use worker pools for CPU-intensive tasks

## Additional Resources

### Node.js Documentation
- [Process API](https://nodejs.org/api/process.html)
- [Child Process](https://nodejs.org/api/child_process.html)
- [Signals](https://nodejs.org/api/process.html#process_signal_events)

### Production Best Practices
- Graceful shutdown in containerized environments
- Process management with PM2
- Cluster mode for multi-core utilization
- Memory leak detection and prevention

### Related Topics
- **Level 3**: Advanced process management and clustering
- **Docker**: Container lifecycle and signal handling
- **Kubernetes**: Pod termination and graceful shutdown
- **PM2**: Process manager with monitoring

---

**Happy Learning!**

These solutions represent production-quality implementations you can use as references for building robust Node.js applications. Study the patterns, understand the concepts, and apply them in your projects.
