# Level 3 Exercises: Advanced Child Process Management

Challenging exercises to build production-ready process management systems.

## Overview

These exercises require you to design and implement complete systems using advanced child process patterns. Each exercise is a substantial project that simulates real-world requirements.

## Before You Begin

### Prerequisites
- Completed Level 1 and Level 2 exercises
- Strong understanding of:
  - Process lifecycle management
  - IPC and message passing
  - Event-driven programming
  - Promises and async/await
  - Error handling patterns

### Approach
1. **Read the requirements carefully** - understand what you're building
2. **Design before coding** - sketch out architecture and data structures
3. **Implement incrementally** - build features one at a time
4. **Test thoroughly** - test each feature and edge cases
5. **Refactor** - improve code structure and efficiency
6. **Compare with solutions** - only after completing your implementation

### Time Estimates
- Exercise 1: 2-3 hours
- Exercise 2: 3-4 hours
- Exercise 3: 2-3 hours
- Exercise 4: 2-3 hours
- Exercise 5: 3-4 hours

---

## Exercise 1: Build a Process Manager

**Difficulty**: ⭐⭐⭐⭐

Build a production-ready process manager that manages a pool of workers, handles failures gracefully, and provides comprehensive monitoring.

### What You'll Build
- Worker pool with configurable size
- Priority-based task queue (high, normal, low)
- Health monitoring with auto-restart
- Performance metrics collection
- Graceful shutdown

### Key Challenges
1. Managing worker lifecycle (spawn, monitor, restart, shutdown)
2. Implementing priority queues
3. Detecting and recovering from failures
4. Collecting meaningful metrics
5. Coordinating graceful shutdown

### Skills Practiced
- Process pool architecture
- Queue data structures
- Health check patterns
- Metrics collection
- Resource cleanup

### Testing Your Solution
```bash
node exercise-1.js
```

Expected behavior:
- Creates worker pool
- Processes tasks by priority
- Restarts failed workers
- Reports statistics
- Shuts down cleanly

---

## Exercise 2: Task Queue System

**Difficulty**: ⭐⭐⭐⭐⭐

Build a distributed task queue with persistence, scheduling, and automatic scaling.

### What You'll Build
- Persistent queue (survives restarts)
- Task scheduling (run at specific time)
- Dynamic worker scaling
- Result caching with TTL
- Retry logic with exponential backoff
- Dead letter queue

### Key Challenges
1. Persisting queue state to disk
2. Implementing task scheduler
3. Dynamic worker scaling based on load
4. Retry logic with exponential backoff
5. Managing dead letter queue
6. Ensuring data consistency

### Skills Practiced
- Data persistence
- Scheduling algorithms
- Autoscaling strategies
- Backoff algorithms
- Error handling patterns

### Testing Your Solution
```bash
node exercise-2.js
```

Expected behavior:
- Persists tasks to disk
- Schedules future tasks
- Scales workers up/down
- Retries failed tasks
- Moves permanently failed tasks to DLQ

---

## Exercise 3: Process Monitor with Statistics

**Difficulty**: ⭐⭐⭐⭐

Create a comprehensive monitoring system that tracks process metrics, detects anomalies, and generates alerts.

### What You'll Build
- CPU and memory monitoring
- Time-series metric collection
- Statistical analysis (avg, percentiles)
- Anomaly detection
- Alert generation
- Metric export (JSON, Prometheus)

### Key Challenges
1. Collecting accurate resource metrics
2. Storing time-series data efficiently
3. Calculating statistics (percentiles)
4. Detecting anomalies
5. Generating actionable alerts
6. Exporting in standard formats

### Skills Practiced
- System monitoring
- Statistical analysis
- Time-series databases
- Alert systems
- Metric formats

### Testing Your Solution
```bash
node exercise-3.js
```

Expected behavior:
- Monitors multiple processes
- Collects metrics over time
- Calculates statistics
- Detects anomalies
- Generates alerts
- Exports metrics

---

## Exercise 4: Secure Command Executor

**Difficulty**: ⭐⭐⭐⭐

Build a secure system for executing commands with comprehensive security controls.

### What You'll Build
- Command whitelisting
- Input sanitization
- Resource limits (time, memory, CPU)
- Audit logging
- Rate limiting
- Security incident detection

### Key Challenges
1. Preventing command injection
2. Validating and sanitizing inputs
3. Enforcing resource limits
4. Comprehensive audit logging
5. Implementing rate limiting
6. Detecting security threats

### Skills Practiced
- Security patterns
- Input validation
- Resource management
- Audit logging
- Threat detection

### Testing Your Solution
```bash
node exercise-4.js
```

Expected behavior:
- Blocks unauthorized commands
- Prevents injection attacks
- Enforces resource limits
- Logs all executions
- Detects suspicious activity
- Generates security reports

---

## Exercise 5: Distributed Processing System

**Difficulty**: ⭐⭐⭐⭐⭐

Design a distributed processing framework with map-reduce, fault tolerance, and intelligent load balancing.

### What You'll Build
- Map-reduce implementation
- Dynamic load balancing
- Fault tolerance with task reassignment
- Result aggregation
- Pipeline processing
- Progress tracking

### Key Challenges
1. Implementing map-reduce correctly
2. Balancing load across workers
3. Handling worker failures
4. Aggregating distributed results
5. Supporting different task types
6. Tracking overall progress

### Skills Practiced
- Distributed computing
- Map-reduce pattern
- Load balancing
- Fault tolerance
- Data aggregation

### Testing Your Solution
```bash
node exercise-5.js
```

Expected behavior:
- Executes map-reduce jobs
- Balances load automatically
- Recovers from failures
- Aggregates results correctly
- Tracks progress
- Supports pipelines

---

## Common Patterns

### Worker Pool Management
```javascript
class WorkerPool {
  constructor(size, workerPath) {
    this.workers = [];
    this.available = [];
    this.busy = [];
  }

  async createWorker() {
    const worker = fork(this.workerPath);
    // Setup event handlers
    // Add to available pool
  }

  getAvailableWorker() {
    return this.available[0];
  }

  markBusy(worker) {
    const index = this.available.indexOf(worker);
    this.available.splice(index, 1);
    this.busy.push(worker);
  }

  markAvailable(worker) {
    const index = this.busy.indexOf(worker);
    this.busy.splice(index, 1);
    this.available.push(worker);
  }
}
```

### Priority Queue
```javascript
class PriorityQueue {
  constructor() {
    this.highQueue = [];
    this.normalQueue = [];
    this.lowQueue = [];
  }

  enqueue(item, priority = 'normal') {
    switch (priority) {
      case 'high':
        this.highQueue.push(item);
        break;
      case 'low':
        this.lowQueue.push(item);
        break;
      default:
        this.normalQueue.push(item);
    }
  }

  dequeue() {
    if (this.highQueue.length > 0) {
      return this.highQueue.shift();
    }
    if (this.normalQueue.length > 0) {
      return this.normalQueue.shift();
    }
    if (this.lowQueue.length > 0) {
      return this.lowQueue.shift();
    }
    return null;
  }

  size() {
    return this.highQueue.length +
           this.normalQueue.length +
           this.lowQueue.length;
  }
}
```

### Exponential Backoff
```javascript
function calculateBackoff(attempt, baseDelay = 1000, maxDelay = 30000) {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * baseDelay;
  const delay = Math.min(exponentialDelay + jitter, maxDelay);
  return delay;
}
```

### Health Check
```javascript
async function healthCheck(worker, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Health check timeout'));
    }, timeout);

    const handler = (msg) => {
      if (msg.type === 'health_check_response') {
        clearTimeout(timer);
        worker.removeListener('message', handler);
        resolve(true);
      }
    };

    worker.on('message', handler);
    worker.send({ type: 'health_check' });
  });
}
```

---

## Testing Guidelines

### Unit Testing
Test individual methods:
```javascript
describe('ProcessManager', () => {
  it('should create workers', async () => {
    const manager = new ProcessManager({ poolSize: 2 });
    await manager.initialize();
    expect(manager.workers.length).toBe(2);
  });

  it('should execute tasks', async () => {
    const result = await manager.execute({ value: 42 });
    expect(result).toBeDefined();
  });
});
```

### Integration Testing
Test the complete system:
- Multiple workers working together
- Failure scenarios
- Resource limits
- Edge cases

### Load Testing
- High volume of tasks
- Many concurrent operations
- Sustained load over time
- Resource exhaustion scenarios

---

## Debugging Tips

### Common Issues

**1. Workers not starting**
- Check worker script path
- Verify worker script syntax
- Check for errors in worker setup

**2. Tasks not completing**
- Verify message handling
- Check for promise resolution
- Ensure workers send responses

**3. Memory leaks**
- Clean up event listeners
- Clear completed tasks
- Limit history/cache size

**4. Race conditions**
- Use proper locking/flags
- Handle concurrent operations
- Test with many parallel tasks

### Debugging Tools
```javascript
// Add comprehensive logging
console.log('[MANAGER] Creating worker', id);
console.log('[WORKER] Task received', taskId);
console.log('[MANAGER] Task completed', taskId, duration);

// Track state transitions
this.emit('state_change', { from, to, reason });

// Monitor metrics
setInterval(() => {
  console.log('Stats:', this.getStats());
}, 5000);
```

---

## Going Further

### Enhancements

1. **Add Web Dashboard**
   - Real-time metrics visualization
   - Task management UI
   - Worker control panel

2. **Implement Clustering**
   - Distribute across multiple machines
   - Network communication
   - Service discovery

3. **Add Database Integration**
   - Store tasks in database
   - Query task history
   - Persistent metrics

4. **Improve Monitoring**
   - Detailed flame graphs
   - Resource profiling
   - Performance insights

### Production Considerations

1. **Error Handling**
   - Catch all errors
   - Log with context
   - Graceful degradation

2. **Resource Management**
   - Set memory limits
   - Monitor CPU usage
   - Clean up properly

3. **Scalability**
   - Test with many workers
   - Optimize for throughput
   - Profile bottlenecks

4. **Reliability**
   - Handle all failure modes
   - Implement retries
   - Use circuit breakers

---

## Solutions

Solutions are provided in the `solutions/` directory. Only consult them after attempting the exercises yourself.

Each solution includes:
- Complete implementation
- Detailed comments
- Error handling
- Test code
- Performance considerations

---

## Getting Help

If you're stuck:

1. **Review the guides** - Read the conceptual guides again
2. **Study the examples** - See how patterns are used
3. **Check the hints** - Each exercise has hints at the bottom
4. **Test incrementally** - Test each feature as you build it
5. **Use the REPL** - Test code snippets interactively
6. **Review solutions** - Compare after your attempt

---

## Completion Checklist

For each exercise, verify:

- [ ] All required features implemented
- [ ] Error handling for edge cases
- [ ] Tests pass successfully
- [ ] No memory leaks
- [ ] Clean shutdown
- [ ] Code is well-documented
- [ ] Metrics/logs are meaningful

---

**Remember**: These are advanced exercises. Take your time, design carefully, and build incrementally. The goal is to understand production patterns, not just complete the code.

Good luck! 🚀
