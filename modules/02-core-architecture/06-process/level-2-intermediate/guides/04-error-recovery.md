# Error Recovery in Node.js

## Introduction

Error recovery is the art of handling unexpected failures gracefully, maintaining service availability, and preventing complete system collapse. In Node.js, proper error handling goes beyond try-catch blocks—it involves managing uncaught exceptions, unhandled promise rejections, and building resilient systems that recover from failures automatically.

This comprehensive guide explores production-grade error recovery strategies, from basic error handling to sophisticated recovery mechanisms. By the end, you'll know how to build Node.js applications that survive errors, maintain data integrity, and recover automatically.

---

## What Problem Does Error Recovery Solve?

### The Challenge

Node.js applications face various error scenarios that can cause crashes or undefined behavior:

**Synchronous Errors:**
- Uncaught exceptions that crash the process
- Type errors from invalid operations
- Reference errors from undefined variables
- Range errors from invalid values

**Asynchronous Errors:**
- Unhandled promise rejections
- Callback errors not properly caught
- Event emitter errors without listeners
- Stream errors that propagate

**Resource Errors:**
- Database connection failures
- Network timeouts
- File system errors
- Out of memory errors

**System Errors:**
- EADDRINUSE (port already in use)
- ECONNREFUSED (connection refused)
- ENOENT (file not found)
- EMFILE (too many open files)

**Without proper error recovery:**
```javascript
// Application crashes on any uncaught error
async function processData() {
  const data = await fetchData(); // If this fails, crash!
  const result = transform(data);  // If this fails, crash!
  await saveResult(result);        // If this fails, crash!
}

// Result: Users see downtime, data is lost, service is unavailable
```

### The Solution

Implement comprehensive error recovery mechanisms:

```javascript
// Multi-layered error recovery
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Log, alert, attempt recovery
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
  // Log, alert, investigate
});

async function processDataWithRecovery() {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const data = await fetchData();
      const result = transform(data);
      await saveResult(result);
      return result;
    } catch (error) {
      attempt++;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt >= maxRetries) {
        // Final fallback
        await saveToDeadLetterQueue(data, error);
        throw error;
      }

      // Exponential backoff
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

---

## Real-World Analogies

### Analogy 1: Hospital Emergency Response

**Your Node.js application is like a hospital:**

- **Emergency alarm (uncaughtException)** → Code Red, all hands on deck
- **Warning system (unhandledRejection)** → Patient monitoring alerts
- **Backup generators (retry logic)** → Keep critical systems running
- **Emergency procedures (error handlers)** → Documented response protocols
- **Redundant systems (failover)** → Backup equipment ready
- **Recovery room (graceful degradation)** → Partial service while recovering

### Analogy 2: Airplane Safety Systems

**Error recovery is like aircraft safety:**

- **Multiple engines (redundancy)** → Backup systems for critical functions
- **Black box recorder (logging)** → Record everything for investigation
- **Emergency procedures (error handlers)** → Pilot checklist for failures
- **Autopilot correction (auto-recovery)** → Automatic error correction
- **Safe landing mode (graceful degradation)** → Reduce functionality but stay safe
- **Ground crew (monitoring)** → Always watching for problems

### Analogy 3: Immune System

**Your error recovery is like your body's immune system:**

- **White blood cells (error handlers)** → Identify and neutralize threats
- **Inflammation (alerts)** → Signal that something is wrong
- **Fever (circuit breaker)** → Slow down to prevent further damage
- **Antibodies (learned responses)** → Remember previous errors
- **Rest and recovery (graceful shutdown)** → Time to heal
- **Vaccination (testing)** → Build immunity to known issues

---

## Understanding Node.js Error Events

### Error Event Flow

```
┌────────────────────────────────────────────────┐
│           Your Application Code                │
│                                                │
│  try {                                         │
│    await operation();                          │
│  } catch (err) {                               │
│    // Caught - handled locally                 │
│  }                                             │
│                                                │
│  throw new Error('uncaught'); ─────────────┐   │
│                                            │   │
│  Promise.reject('unhandled'); ─────────┐   │   │
└────────────────────────────────────────┼───┼───┘
                                         │   │
                    ┌────────────────────┘   │
                    │                        │
                    ↓                        ↓
┌────────────────────────────┐  ┌────────────────────────────┐
│  unhandledRejection Event  │  │  uncaughtException Event   │
│                            │  │                            │
│  • Promise rejected        │  │  • Synchronous throw       │
│  • No .catch() handler     │  │  • Async callback error    │
│  • No rejection handler    │  │  • Not caught anywhere     │
└────────────────────────────┘  └────────────────────────────┘
          │                               │
          ↓                               ↓
┌────────────────────────────────────────────────┐
│       process.on('event', handler)             │
│                                                │
│  • Log error details                           │
│  • Alert monitoring system                     │
│  • Attempt recovery                            │
│  • Graceful shutdown if needed                 │
└────────────────────────────────────────────────┘
```

---

## Basic Error Recovery Patterns

### Pattern 1: Uncaught Exception Handler

```javascript
// uncaught-exception-handler.js
class UncaughtExceptionHandler {
  constructor(options = {}) {
    this.shouldExit = options.shouldExit !== false; // Exit by default
    this.exitDelay = options.exitDelay || 1000;
    this.onError = options.onError || this.defaultErrorHandler;

    this.setupHandlers();
  }

  setupHandlers() {
    process.on('uncaughtException', (err, origin) => {
      this.handleUncaughtException(err, origin);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.handleUnhandledRejection(reason, promise);
    });

    // Warning events
    process.on('warning', (warning) => {
      this.handleWarning(warning);
    });
  }

  handleUncaughtException(err, origin) {
    console.error('═══ UNCAUGHT EXCEPTION ═══');
    console.error('Origin:', origin);
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    console.error('Time:', new Date().toISOString());
    console.error('════════════════════════════');

    // Call custom error handler
    this.onError(err, 'uncaughtException', { origin });

    if (this.shouldExit) {
      console.error(`Process will exit in ${this.exitDelay}ms`);

      setTimeout(() => {
        console.error('Exiting due to uncaught exception');
        process.exit(1);
      }, this.exitDelay);
    }
  }

  handleUnhandledRejection(reason, promise) {
    console.error('═══ UNHANDLED REJECTION ═══');
    console.error('Promise:', promise);
    console.error('Reason:', reason);

    if (reason instanceof Error) {
      console.error('Stack:', reason.stack);
    }

    console.error('Time:', new Date().toISOString());
    console.error('════════════════════════════');

    // Call custom error handler
    this.onError(reason, 'unhandledRejection', { promise });

    // Note: Unhandled rejections don't crash the process in Node.js 15+
    // But they should still be treated seriously
  }

  handleWarning(warning) {
    console.warn('⚠️  Process Warning:', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  }

  defaultErrorHandler(err, type, context) {
    // Default: just log
    // In production, you would:
    // - Send to error tracking service (Sentry, Rollbar, etc.)
    // - Alert on-call engineers
    // - Create incident ticket
    // - Save error details to database
  }
}

// Usage
const errorHandler = new UncaughtExceptionHandler({
  shouldExit: true,
  exitDelay: 5000,
  onError: (err, type, context) => {
    // Send to monitoring service
    monitoring.captureException(err, {
      type,
      ...context,
      tags: {
        pid: process.pid,
        version: process.version,
      },
    });

    // Alert team
    if (type === 'uncaughtException') {
      pagerDuty.alert('critical', 'Uncaught exception in production');
    }
  },
});

// Test it
// throw new Error('Test uncaught exception');
// Promise.reject(new Error('Test unhandled rejection'));
```

### Pattern 2: Retry with Exponential Backoff

```javascript
// retry-with-backoff.js
class RetryWithBackoff {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.factor = options.factor || 2;
    this.jitter = options.jitter !== false; // Add jitter by default
  }

  async execute(fn, context = '') {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        lastError = error;

        // Don't retry on last attempt
        if (attempt === this.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const baseDelay = Math.min(
          this.initialDelay * Math.pow(this.factor, attempt),
          this.maxDelay
        );

        // Add jitter to prevent thundering herd
        const delay = this.jitter
          ? baseDelay * (0.5 + Math.random() * 0.5)
          : baseDelay;

        console.log(`${context} - Attempt ${attempt + 1} failed, retrying in ${delay.toFixed(0)}ms...`);
        console.error('Error:', error.message);

        await this.sleep(delay);
      }
    }

    // All retries exhausted
    throw new Error(
      `Failed after ${this.maxRetries + 1} attempts: ${lastError.message}`
    );
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const retry = new RetryWithBackoff({
  maxRetries: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2,
});

async function fetchDataWithRetry() {
  return retry.execute(async () => {
    const response = await fetch('https://api.example.com/data');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }, 'fetchData');
}

// Example: Database operation with retry
async function saveWithRetry(data) {
  return retry.execute(async () => {
    await database.save(data);
  }, 'database save');
}
```

### Pattern 3: Circuit Breaker

```javascript
// circuit-breaker.js
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 1 minute
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    // Check circuit state
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }

      // Time to try again
      this.state = 'HALF_OPEN';
      this.successCount = 0;
      console.log('Circuit breaker entering HALF_OPEN state');
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn, this.timeout);

      // Success
      this.onSuccess();
      return result;

    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  async executeWithTimeout(fn, timeout) {
    return Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      ),
    ]);
  }

  onSuccess() {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;

      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        console.log('Circuit breaker CLOSED');
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;

      console.error(`Circuit breaker OPEN (${this.failureCount} failures)`);
      console.log(`Will retry at ${new Date(this.nextAttempt).toISOString()}`);
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: new Date(this.nextAttempt).toISOString(),
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    console.log('Circuit breaker manually reset');
  }
}

// Usage
const breaker = new CircuitBreaker({
  failureThreshold: 5,    // Open after 5 failures
  successThreshold: 2,    // Close after 2 successes
  timeout: 5000,          // 5 second timeout
  resetTimeout: 30000,    // Try again after 30 seconds
});

async function callExternalAPIWithCircuitBreaker() {
  try {
    return await breaker.execute(async () => {
      const response = await fetch('https://api.example.com/data');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    });
  } catch (error) {
    if (error.message === 'Circuit breaker is OPEN') {
      // Use fallback/cache
      return getCachedData();
    }

    throw error;
  }
}

// Monitor circuit breaker state
setInterval(() => {
  const state = breaker.getState();
  if (state.state !== 'CLOSED') {
    console.log('Circuit breaker state:', state);
  }
}, 10000);
```

---

## Advanced Error Recovery Patterns

### Pattern 4: Bulkhead Pattern (Resource Isolation)

```javascript
// bulkhead.js
class Bulkhead {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 10;
    this.maxQueue = options.maxQueue || 20;
    this.timeout = options.timeout || 30000;

    this.active = 0;
    this.queue = [];
  }

  async execute(fn) {
    // Check if we can execute immediately
    if (this.active < this.maxConcurrent) {
      return this.run(fn);
    }

    // Check queue capacity
    if (this.queue.length >= this.maxQueue) {
      throw new Error('Bulkhead queue full');
    }

    // Queue the request
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
    });
  }

  async run(fn) {
    this.active++;

    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Bulkhead timeout')), this.timeout)
        ),
      ]);

      return result;

    } finally {
      this.active--;
      this.processQueue();
    }
  }

  processQueue() {
    if (this.queue.length === 0) {
      return;
    }

    if (this.active < this.maxConcurrent) {
      const { fn, resolve, reject } = this.queue.shift();

      this.run(fn)
        .then(resolve)
        .catch(reject);
    }
  }

  getStats() {
    return {
      active: this.active,
      queued: this.queue.length,
      available: this.maxConcurrent - this.active,
    };
  }
}

// Usage: Separate bulkheads for different resources
const databaseBulkhead = new Bulkhead({
  maxConcurrent: 10,
  maxQueue: 50,
  timeout: 10000,
});

const externalAPIBulkhead = new Bulkhead({
  maxConcurrent: 5,
  maxQueue: 20,
  timeout: 5000,
});

// Database operations use database bulkhead
async function queryDatabase(sql) {
  return databaseBulkhead.execute(async () => {
    return database.query(sql);
  });
}

// External API calls use API bulkhead
async function callExternalAPI(endpoint) {
  return externalAPIBulkhead.execute(async () => {
    return fetch(endpoint);
  });
}

// If external API is slow or down, database operations are unaffected
```

### Pattern 5: Dead Letter Queue

```javascript
// dead-letter-queue.js
const fs = require('fs').promises;
const path = require('path');

class DeadLetterQueue {
  constructor(options = {}) {
    this.directory = options.directory || './dead-letter-queue';
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 60000; // 1 minute
    this.ensureDirectory();
  }

  async ensureDirectory() {
    try {
      await fs.mkdir(this.directory, { recursive: true });
    } catch (error) {
      console.error('Failed to create DLQ directory:', error);
    }
  }

  async add(message, error, metadata = {}) {
    const item = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      message,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      metadata,
      retries: 0,
      nextRetry: Date.now() + this.retryDelay,
    };

    const filename = path.join(this.directory, `${item.id}.json`);

    try {
      await fs.writeFile(filename, JSON.stringify(item, null, 2));
      console.log(`Message added to DLQ: ${item.id}`);
      return item.id;
    } catch (err) {
      console.error('Failed to write to DLQ:', err);
      throw err;
    }
  }

  async get(id) {
    const filename = path.join(this.directory, `${id}.json`);

    try {
      const data = await fs.readFile(filename, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async list() {
    try {
      const files = await fs.readdir(this.directory);
      const items = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const id = file.replace('.json', '');
          const item = await this.get(id);
          if (item) {
            items.push(item);
          }
        }
      }

      return items;
    } catch (error) {
      console.error('Failed to list DLQ:', error);
      return [];
    }
  }

  async remove(id) {
    const filename = path.join(this.directory, `${id}.json`);

    try {
      await fs.unlink(filename);
      console.log(`Removed from DLQ: ${id}`);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  async retry(id, processor) {
    const item = await this.get(id);

    if (!item) {
      console.log(`Item ${id} not found in DLQ`);
      return false;
    }

    // Check if it's time to retry
    if (Date.now() < item.nextRetry) {
      console.log(`Too early to retry ${id}`);
      return false;
    }

    console.log(`Retrying DLQ item ${id} (attempt ${item.retries + 1})`);

    try {
      // Attempt to process
      await processor(item.message);

      // Success - remove from DLQ
      await this.remove(id);
      console.log(`Successfully processed DLQ item ${id}`);
      return true;

    } catch (error) {
      // Failed again
      item.retries++;
      item.lastError = {
        message: error.message,
        timestamp: new Date().toISOString(),
      };

      if (item.retries >= this.maxRetries) {
        // Max retries reached - mark as failed
        item.status = 'failed';
        item.failedAt = new Date().toISOString();
        console.error(`DLQ item ${id} failed after ${item.retries} retries`);
      } else {
        // Schedule next retry with exponential backoff
        item.nextRetry = Date.now() + (this.retryDelay * Math.pow(2, item.retries));
        console.log(`Will retry ${id} at ${new Date(item.nextRetry).toISOString()}`);
      }

      // Update the item
      const filename = path.join(this.directory, `${id}.json`);
      await fs.writeFile(filename, JSON.stringify(item, null, 2));

      return false;
    }
  }

  async retryAll(processor) {
    const items = await this.list();
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
    };

    for (const item of items) {
      if (item.status === 'failed') {
        results.skipped++;
        continue;
      }

      const success = await this.retry(item.id, processor);

      if (success) {
        results.success++;
      } else {
        results.failed++;
      }
    }

    return results;
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage
const dlq = new DeadLetterQueue({
  directory: './dlq',
  maxRetries: 3,
  retryDelay: 60000,
});

async function processMessage(message) {
  try {
    await sendToExternalAPI(message);
  } catch (error) {
    console.error('Failed to process message:', error);

    // Add to DLQ
    await dlq.add(message, error, {
      source: 'message-queue',
      attempt: message.attempt || 1,
    });
  }
}

// Periodic retry of DLQ items
setInterval(async () => {
  console.log('Processing DLQ...');

  const results = await dlq.retryAll(async (message) => {
    await sendToExternalAPI(message);
  });

  console.log('DLQ processing results:', results);
}, 5 * 60 * 1000); // Every 5 minutes
```

### Pattern 6: Graceful Degradation

```javascript
// graceful-degradation.js
class GracefulService {
  constructor() {
    this.mode = 'NORMAL'; // NORMAL, DEGRADED, MINIMAL
    this.cache = new Map();
  }

  async getData(id) {
    try {
      // Try primary data source
      const data = await this.getPrimaryData(id);
      this.cache.set(id, data);
      return data;

    } catch (primaryError) {
      console.warn('Primary data source failed:', primaryError.message);

      try {
        // Fallback to secondary source
        const data = await this.getSecondaryData(id);
        this.cache.set(id, data);
        this.mode = 'DEGRADED';
        return data;

      } catch (secondaryError) {
        console.error('Secondary data source failed:', secondaryError.message);

        // Use cached data if available
        if (this.cache.has(id)) {
          console.log('Using cached data (stale)');
          this.mode = 'MINIMAL';
          return this.cache.get(id);
        }

        // Last resort: return default/mock data
        console.error('All data sources failed, using default data');
        this.mode = 'MINIMAL';
        return this.getDefaultData(id);
      }
    }
  }

  async getPrimaryData(id) {
    // Primary database or API
    return database.query('SELECT * FROM data WHERE id = ?', [id]);
  }

  async getSecondaryData(id) {
    // Replica database or backup API
    return replicaDatabase.query('SELECT * FROM data WHERE id = ?', [id]);
  }

  getDefaultData(id) {
    // Return safe default data
    return {
      id,
      status: 'unavailable',
      message: 'Service temporarily unavailable',
    };
  }

  getServiceStatus() {
    return {
      mode: this.mode,
      cacheSize: this.cache.size,
      status: this.mode === 'NORMAL' ? 'healthy' : 'degraded',
    };
  }

  resetMode() {
    this.mode = 'NORMAL';
  }
}

// Usage
const service = new GracefulService();

app.get('/api/data/:id', async (req, res) => {
  try {
    const data = await service.getData(req.params.id);

    // Include service status in response
    res.set('X-Service-Mode', service.mode);

    res.json(data);

  } catch (error) {
    res.status(503).json({
      error: 'Service unavailable',
      message: error.message,
    });
  }
});

// Health check includes service mode
app.get('/health', (req, res) => {
  const status = service.getServiceStatus();

  const statusCode = status.mode === 'NORMAL' ? 200 : 503;

  res.status(statusCode).json(status);
});
```

---

## Production Error Recovery System

### Pattern 7: Comprehensive Error Recovery

```javascript
// error-recovery-system.js
class ErrorRecoverySystem {
  constructor(options = {}) {
    this.options = options;

    // Components
    this.retryHandler = new RetryWithBackoff(options.retry);
    this.circuitBreaker = new CircuitBreaker(options.circuitBreaker);
    this.bulkhead = new Bulkhead(options.bulkhead);
    this.dlq = new DeadLetterQueue(options.dlq);

    // State
    this.errorCount = new Map(); // Track errors by type
    this.lastErrors = []; // Recent errors

    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    process.on('uncaughtException', (err, origin) => {
      this.handleCriticalError(err, 'uncaughtException', { origin });
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.handleCriticalError(reason, 'unhandledRejection', { promise });
    });

    process.on('warning', (warning) => {
      this.handleWarning(warning);
    });
  }

  async execute(fn, options = {}) {
    const {
      retries = true,
      circuitBreaker = false,
      bulkhead = false,
      dlqOnFailure = false,
      context = 'operation',
    } = options;

    let operation = fn;

    // Wrap with bulkhead
    if (bulkhead) {
      const originalOp = operation;
      operation = () => this.bulkhead.execute(originalOp);
    }

    // Wrap with circuit breaker
    if (circuitBreaker) {
      const originalOp = operation;
      operation = () => this.circuitBreaker.execute(originalOp);
    }

    // Wrap with retry
    if (retries) {
      const originalOp = operation;
      operation = () => this.retryHandler.execute(originalOp, context);
    }

    try {
      const result = await operation();
      return result;

    } catch (error) {
      this.trackError(error, context);

      if (dlqOnFailure) {
        await this.dlq.add({ context }, error);
      }

      throw error;
    }
  }

  handleCriticalError(err, type, context) {
    console.error('═══ CRITICAL ERROR ═══');
    console.error('Type:', type);
    console.error('Error:', err);
    console.error('Context:', context);
    console.error('Time:', new Date().toISOString());
    console.error('═══════════════════════');

    // Track error
    this.trackError(err, type);

    // Log to file
    this.logError(err, type, context);

    // Send to monitoring
    this.sendToMonitoring(err, type, context);

    // Alert if critical
    if (type === 'uncaughtException') {
      this.alertTeam('critical', 'Uncaught exception', err);

      // Attempt graceful shutdown
      setTimeout(() => {
        console.error('Exiting due to uncaught exception');
        process.exit(1);
      }, 5000);
    }
  }

  handleWarning(warning) {
    console.warn('⚠️  Warning:', warning.message);
    this.trackError(warning, 'warning');
  }

  trackError(error, context) {
    const key = error.name || context;
    const count = this.errorCount.get(key) || 0;
    this.errorCount.set(key, count + 1);

    this.lastErrors.push({
      error,
      context,
      timestamp: Date.now(),
    });

    // Keep last 100 errors
    if (this.lastErrors.length > 100) {
      this.lastErrors.shift();
    }
  }

  logError(error, type, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      context,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    };

    // Write to error log file
    const fs = require('fs');
    fs.appendFileSync(
      './errors.log',
      JSON.stringify(logEntry) + '\n'
    );
  }

  sendToMonitoring(error, type, context) {
    // Send to Sentry, Datadog, New Relic, etc.
    // monitoring.captureException(error, { type, context });
  }

  alertTeam(severity, message, error) {
    // Send to PagerDuty, Slack, email, etc.
    console.error(`ALERT [${severity}]: ${message}`);
  }

  getStats() {
    const errorsByType = Array.from(this.errorCount.entries()).map(
      ([type, count]) => ({ type, count })
    );

    return {
      totalErrors: this.lastErrors.length,
      errorsByType,
      recentErrors: this.lastErrors.slice(-10),
      circuitBreaker: this.circuitBreaker.getState(),
      bulkhead: this.bulkhead.getStats(),
    };
  }
}

// Usage
const recovery = new ErrorRecoverySystem({
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
  },
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 30000,
  },
  bulkhead: {
    maxConcurrent: 10,
    maxQueue: 50,
  },
  dlq: {
    directory: './dlq',
  },
});

// Use in your application
async function fetchData(id) {
  return recovery.execute(
    async () => {
      const response = await fetch(`https://api.example.com/data/${id}`);
      return response.json();
    },
    {
      retries: true,
      circuitBreaker: true,
      bulkhead: true,
      dlqOnFailure: true,
      context: 'fetchData',
    }
  );
}

// Monitoring endpoint
app.get('/admin/errors', (req, res) => {
  res.json(recovery.getStats());
});
```

---

## Best Practices

### 1. Always Handle Uncaught Errors

```javascript
// GOOD: Global error handlers
process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);

// BAD: No global handlers
// Errors crash the process
```

### 2. Log Before Exiting

```javascript
// GOOD: Log then exit
process.on('uncaughtException', async (err) => {
  await logger.error('Uncaught exception', err);
  await logger.flush();
  process.exit(1);
});

// BAD: Immediate exit
process.on('uncaughtException', () => {
  process.exit(1); // No logs!
});
```

### 3. Use Retry with Backoff

```javascript
// GOOD: Exponential backoff
await retry.execute(operation);

// BAD: Immediate retry
while (true) {
  try {
    await operation();
    break;
  } catch (error) {
    // Retry immediately - hammers the service
  }
}
```

### 4. Implement Circuit Breakers

```javascript
// GOOD: Protect services with circuit breakers
await circuitBreaker.execute(callExternalAPI);

// BAD: Keep calling failing service
await callExternalAPI(); // Keeps failing
```

### 5. Use Dead Letter Queues

```javascript
// GOOD: Save failed messages
catch (error) {
  await dlq.add(message, error);
}

// BAD: Discard failed messages
catch (error) {
  // Message lost forever
}
```

---

## Common Pitfalls

### Pitfall 1: Swallowing Errors

```javascript
// PROBLEM: Silent failure
try {
  await operation();
} catch (error) {
  // Do nothing - error disappears!
}

// SOLUTION: Always log and handle
try {
  await operation();
} catch (error) {
  logger.error('Operation failed', error);
  // Decide: retry, fallback, or propagate
  throw error;
}
```

### Pitfall 2: Not Exiting on Fatal Errors

```javascript
// PROBLEM: Continue after uncaught exception
process.on('uncaughtException', (err) => {
  console.error(err);
  // Process continues in undefined state!
});

// SOLUTION: Exit after cleanup
process.on('uncaughtException', async (err) => {
  console.error(err);
  await cleanup();
  process.exit(1);
});
```

### Pitfall 3: Infinite Retry Loops

```javascript
// PROBLEM: Retry forever
while (true) {
  try {
    await operation();
    break;
  } catch (error) {
    // Never stops retrying
  }
}

// SOLUTION: Limit retries
for (let i = 0; i < maxRetries; i++) {
  try {
    await operation();
    break;
  } catch (error) {
    if (i === maxRetries - 1) throw error;
  }
}
```

### Pitfall 4: No Error Context

```javascript
// PROBLEM: Generic error handling
catch (error) {
  console.error('Error:', error);
}

// SOLUTION: Include context
catch (error) {
  console.error('Failed to process user order', {
    error: error.message,
    userId,
    orderId,
    timestamp: new Date(),
  });
}
```

---

## Summary

### Key Strategies

1. **Global Error Handlers** - Catch uncaught exceptions and rejections
2. **Retry with Backoff** - Automatic retry with exponential backoff
3. **Circuit Breaker** - Prevent cascading failures
4. **Bulkhead** - Isolate resource pools
5. **Dead Letter Queue** - Save failed messages for retry
6. **Graceful Degradation** - Maintain partial functionality
7. **Comprehensive System** - Combine all strategies

### Error Recovery Checklist

- [ ] Handle uncaughtException events
- [ ] Handle unhandledRejection events
- [ ] Implement retry with exponential backoff
- [ ] Use circuit breakers for external services
- [ ] Implement resource isolation (bulkheads)
- [ ] Set up dead letter queues
- [ ] Implement graceful degradation
- [ ] Log all errors with context
- [ ] Send errors to monitoring service
- [ ] Alert on critical errors
- [ ] Test error recovery paths
- [ ] Document recovery procedures

### Next Steps

1. Implement global error handlers
2. Add retry logic to critical operations
3. Set up circuit breakers
4. Create dead letter queue
5. Test error scenarios
6. Proceed to [Performance Monitoring Guide](./05-performance-monitoring.md)

Ready to monitor and optimize performance? Continue to [Performance Monitoring Guide](./05-performance-monitoring.md)!
