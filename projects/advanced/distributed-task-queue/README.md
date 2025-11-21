# Distributed Task Queue

A production-ready distributed task queue system built with Node.js core modules. Process tasks in parallel across multiple worker threads with automatic retry, progress tracking, and comprehensive monitoring.

## Features

- **Distributed Processing**: Parallel task execution using worker threads
- **Task Persistence**: File-based queue with automatic persistence
- **Automatic Retry**: Failed tasks retry with configurable backoff strategies
- **Progress Tracking**: Real-time progress updates for long-running tasks
- **Priority Queue**: Tasks processed by priority and creation time
- **Timeout Handling**: Automatic timeout detection and task failure
- **Worker Pool**: Dynamic worker management with automatic restart
- **Web API**: RESTful API with cluster support for scalability
- **Monitoring**: Comprehensive metrics, logging, and alerting
- **Graceful Shutdown**: Clean shutdown with task completion

## Architecture

```
┌─────────────────┐
│   API Server    │ (Clustered HTTP Server)
│   (cluster)     │
└────────┬────────┘
         │
┌────────▼────────┐
│   Task Queue    │ (Main Orchestrator)
│    (events)     │
└────┬────────┬───┘
     │        │
┌────▼─────┐ ┌▼──────────────┐
│  Queue   │ │  Worker Pool  │
│ Manager  │ │(worker_threads)│
│  (fs)    │ └───────────────┘
└──────────┘
     │
┌────▼─────┐
│ Monitor  │ (Observability)
│ (stream) │
└──────────┘
```

## Core Components

### 1. Task
Represents a single unit of work with metadata and state management.

**States**: `pending` → `processing` → `completed`/`failed`/`retrying`

**Features**:
- Unique ID and type
- Priority-based ordering
- Configurable retry with backoff
- Timeout handling
- Progress tracking
- Full lifecycle tracking

### 2. Queue Manager
Manages the task queue with file-based persistence.

**Responsibilities**:
- Task storage and retrieval
- Status tracking
- Persistence to disk
- Automatic cleanup
- Statistics collection

**Persistence Strategy**:
- Each task stored as separate JSON file
- Periodic batch persistence (configurable)
- Automatic recovery on restart
- Transactional updates

### 3. Worker Pool
Manages a pool of worker threads for task execution.

**Features**:
- Dynamic worker creation
- Automatic worker restart on failure
- Task distribution (round-robin)
- Worker health monitoring
- Graceful worker termination

**Worker Lifecycle**:
```
Created → Ready → Executing → Available
           ↑                      │
           └──────────────────────┘
```

### 4. Task Queue (Orchestrator)
Coordinates queue manager and worker pool.

**Processing Loop**:
1. Check for pending tasks
2. Assign to available workers
3. Monitor execution
4. Handle completion/failure
5. Check for retries
6. Check for timeouts

### 5. API Server
RESTful HTTP API with cluster support.

**Endpoints**:
- `POST /tasks` - Add task
- `GET /tasks/:id` - Get task status
- `GET /tasks` - List tasks (with filters)
- `DELETE /tasks/:id` - Delete task
- `GET /stats` - Queue statistics
- `GET /health` - Health check

**Clustering**:
- Multiple worker processes
- Automatic restart on crash
- Load balancing across workers

### 6. Monitor
Comprehensive monitoring and observability.

**Features**:
- Real-time metrics collection
- Structured logging
- Alert thresholds
- Performance tracking
- Historical data retention

**Metrics**:
- Queue size and composition
- Task throughput
- Worker utilization
- Execution times
- Failure rates

## Installation

```bash
cd distributed-task-queue
npm install  # No dependencies - uses Node.js core modules only!
```

## Quick Start

### Basic Usage

```javascript
const { TaskQueue } = require('./src');
const path = require('path');

// Create task queue
const taskQueue = new TaskQueue({
  queueDir: './queue',
  poolSize: 4,
  taskHandlers: new Map([
    ['email', path.join(__dirname, 'handlers/email-handler.js')],
    ['process-image', path.join(__dirname, 'handlers/image-handler.js')]
  ])
});

// Initialize
await taskQueue.initialize();

// Start processing
taskQueue.start();

// Add tasks
const task = await taskQueue.addTask({
  type: 'email',
  payload: {
    to: 'user@example.com',
    subject: 'Hello',
    body: 'Test email'
  },
  priority: 5,
  maxAttempts: 3,
  timeout: 30000
});

console.log(`Task added: ${task.id}`);

// Listen for events
taskQueue.on('task:completed', (task) => {
  console.log(`Task ${task.id} completed:`, task.result);
});

taskQueue.on('task:failed', (data) => {
  console.log(`Task ${data.task.id} failed:`, data.task.error);
});
```

### Creating Task Handlers

Task handlers are simple modules that export an `execute` function:

```javascript
// handlers/email-handler.js
async function execute(payload, context) {
  const { to, subject, body } = payload;

  // Log progress
  context.log(`Sending email to ${to}`);
  context.progress(25);

  // Perform work
  await sendEmail(to, subject, body);
  context.progress(75);

  // Verify
  await verifyDelivery();
  context.progress(100);

  // Return result
  return {
    messageId: 'msg-123',
    sentAt: new Date().toISOString()
  };
}

module.exports = { execute };
```

**Context API**:
- `context.taskId` - Current task ID
- `context.workerId` - Current worker ID
- `context.progress(percent)` - Update progress (0-100)
- `context.log(message)` - Log message

### Using the API Server

```javascript
const { TaskQueue, APIServer } = require('./src');

const taskQueue = new TaskQueue(config);
await taskQueue.initialize();
taskQueue.start();

// Start API server
const apiServer = new APIServer(taskQueue, {
  port: 3000,
  host: '0.0.0.0',
  clustered: true,
  numWorkers: 4
});

await apiServer.start();
```

**API Examples**:

```bash
# Add task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "payload": {"to": "user@example.com", "subject": "Test"},
    "priority": 5
  }'

# Get task status
curl http://localhost:3000/tasks/{task-id}

# List tasks
curl http://localhost:3000/tasks?status=completed&limit=10

# Get statistics
curl http://localhost:3000/stats

# Health check
curl http://localhost:3000/health
```

### Adding Monitoring

```javascript
const { TaskQueue, Monitor } = require('./src');

const taskQueue = new TaskQueue(config);
const monitor = new Monitor(taskQueue, {
  logDir: './logs',
  metricsInterval: 10000,
  alertThresholds: {
    queueSize: 1000,
    failureRate: 0.1,
    avgExecutionTime: 60000,
    workerUtilization: 0.9
  }
});

await monitor.start();

// Listen for alerts
monitor.on('alert', (alert) => {
  console.log(`ALERT: ${alert.message}`);
  // Send to alerting system (PagerDuty, Slack, etc.)
});

// Get metrics
const metrics = monitor.getMetrics();
console.log('Throughput:', metrics.summary.avgThroughput, 'tasks/min');
```

## Running the Examples

### Complete Example

Demonstrates all features:

```bash
cd examples
node complete-example.js
```

With API server:

```bash
node complete-example.js --api
```

### Custom Task Handlers

Three example handlers are provided:

1. **Email Handler** (`handlers/email-handler.js`)
   - Simulates email sending
   - Progress tracking
   - Validation

2. **Image Processing** (`handlers/image-processing-handler.js`)
   - Multiple operations (resize, crop, filter, compress)
   - CPU-intensive simulation
   - Detailed progress

3. **Data Analysis** (`handlers/data-analysis-handler.js`)
   - Statistics computation
   - Data aggregation
   - Correlation analysis

## Testing

Run the test suite:

```bash
cd tests
node task.test.js
```

## Configuration

### Task Configuration

```javascript
{
  type: 'task-type',        // Required: task type (handler name)
  payload: {},              // Required: task data
  priority: 0,              // Optional: higher = processed first
  maxAttempts: 3,           // Optional: max retry attempts
  timeout: 30000,           // Optional: timeout in ms
  retryDelay: 1000,         // Optional: base retry delay
  retryBackoff: 'exponential' // Optional: 'exponential' or 'linear'
}
```

### Queue Configuration

```javascript
{
  queueDir: './queue',           // Queue storage directory
  poolSize: 4,                   // Number of worker threads
  taskHandlers: new Map(),       // Task type → handler path map
  persistenceInterval: 5000,     // Persistence frequency (ms)
  processingInterval: 100,       // Task processing check (ms)
  retryCheckInterval: 5000,      // Retry check frequency (ms)
  timeoutCheckInterval: 10000,   // Timeout check frequency (ms)
  autoCleanup: true,             // Auto cleanup old tasks
  cleanupAge: 86400000           // Age for cleanup (ms)
}
```

### API Server Configuration

```javascript
{
  port: 3000,           // Server port
  host: '0.0.0.0',      // Server host
  clustered: true,      // Use cluster mode
  numWorkers: 4         // Number of cluster workers
}
```

### Monitor Configuration

```javascript
{
  logDir: './logs',          // Log directory
  metricsInterval: 10000,    // Metrics collection frequency
  alertThresholds: {
    queueSize: 1000,         // Max queue size
    failureRate: 0.1,        // Max failure rate (10%)
    avgExecutionTime: 60000, // Max avg execution time
    workerUtilization: 0.9   // Max worker utilization (90%)
  }
}
```

## Advanced Usage

### Graceful Shutdown

```javascript
// Shutdown with timeout
await taskQueue.shutdown({
  timeout: 30000,  // Wait up to 30s for tasks to complete
  force: false     // If true, terminate immediately
});
```

### Custom Retry Logic

```javascript
const task = await taskQueue.addTask({
  type: 'custom',
  payload: { data: 'test' },
  maxAttempts: 5,
  retryDelay: 2000,
  retryBackoff: 'exponential'  // Delays: 2s, 4s, 8s, 16s
});
```

### Waiting for Completion

```javascript
// Wait for all tasks to complete
await taskQueue.waitForCompletion(60000); // 60s timeout
```

### Event-Driven Integration

```javascript
taskQueue.on('task:completed', async (task) => {
  // Trigger downstream processing
  if (task.type === 'process-video') {
    await taskQueue.addTask({
      type: 'create-thumbnail',
      payload: { videoId: task.result.videoId }
    });
  }
});
```

## Performance Characteristics

### Throughput
- **Small tasks** (< 1s): 1000+ tasks/minute on 4-core CPU
- **Medium tasks** (1-10s): 100-500 tasks/minute
- **Large tasks** (> 10s): Depends on pool size and task duration

### Scalability
- **Worker threads**: Scale with CPU cores (optimal = core count)
- **API cluster**: Scale horizontally with multiple processes
- **Queue storage**: Handles 10,000+ tasks efficiently

### Resource Usage
- **Memory**: ~10MB base + 2-5MB per worker thread
- **Disk I/O**: Periodic persistence minimizes I/O overhead
- **CPU**: Scales linearly with worker count

## Production Deployment

### Best Practices

1. **Worker Pool Size**
   - CPU-bound tasks: `os.cpus().length`
   - I/O-bound tasks: `os.cpus().length * 2`

2. **Persistence**
   - Set `persistenceInterval` based on acceptable data loss
   - Use SSD for queue directory

3. **Monitoring**
   - Enable monitoring in production
   - Set appropriate alert thresholds
   - Forward logs to centralized logging

4. **API Server**
   - Use cluster mode for high availability
   - Place behind reverse proxy (nginx)
   - Implement rate limiting

5. **Error Handling**
   - Set appropriate `maxAttempts` for each task type
   - Log all errors for debugging
   - Monitor failure rates

### Health Checks

Implement health checks for orchestration (Kubernetes, Docker Swarm):

```javascript
app.get('/health', (req, res) => {
  const stats = taskQueue.getStats();
  const healthy =
    stats.running &&
    stats.workers.activeWorkers > 0;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    stats
  });
});
```

## Troubleshooting

### High Memory Usage
- Reduce `poolSize`
- Enable `autoCleanup`
- Lower `cleanupAge`

### Tasks Not Processing
- Check worker pool is initialized
- Verify task handlers are registered
- Check task handler errors in logs

### Slow Processing
- Increase `poolSize`
- Optimize task handlers
- Check for I/O bottlenecks

### Task Timeouts
- Increase task `timeout`
- Optimize task handlers
- Check system resources

## Module Usage

This project demonstrates advanced usage of:

- **worker_threads**: Parallel task execution
- **cluster**: Horizontal API server scaling
- **events**: Event-driven architecture
- **fs**: Queue persistence
- **stream**: Efficient log writing
- **http**: RESTful API server
- **crypto**: Task ID generation

## License

MIT

## Contributing

Contributions welcome! This is an educational project demonstrating Node.js core modules.

## Learning Objectives

After completing this project, you should understand:

1. Worker thread pool management
2. Cluster-based horizontal scaling
3. Event-driven architecture patterns
4. File-based queue persistence
5. Production monitoring and observability
6. Graceful shutdown patterns
7. Error handling and retry logic
8. Progress tracking in distributed systems

## Next Steps

Extend this project by adding:

1. **Priority-based workers**: Separate pools for different priorities
2. **Dead letter queue**: Failed task storage
3. **Task dependencies**: Chain tasks together
4. **Scheduled tasks**: Cron-like scheduling
5. **Rate limiting**: Limit tasks per second
6. **Webhooks**: HTTP callbacks on completion
7. **Metrics dashboard**: Real-time visualization
8. **Distributed queue**: Redis-based queue for multiple servers
