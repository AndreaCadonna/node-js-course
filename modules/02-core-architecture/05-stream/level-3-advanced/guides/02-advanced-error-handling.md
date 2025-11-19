# Advanced Error Handling for Streams

## Introduction

This guide covers production-grade error handling patterns for Node.js streams. You'll learn how to handle errors gracefully, implement retry logic, build resilient pipelines, and ensure your streaming applications never lose data or leave resources hanging.

By the end, you'll be able to build bullet-proof streaming applications that handle failures elegantly in production environments.

---

## Understanding Stream Errors

### Error Propagation in Streams

```
Source Stream → Transform 1 → Transform 2 → Destination
     ↓              ↓             ↓              ↓
   error          error         error          error
     ↓              ↓             ↓              ↓
   Where does the error go?
```

**Critical Fact:** Errors do NOT automatically propagate through pipelines!

```javascript
const { pipeline } = require('stream');

// ❌ WRONG - errors not handled
source
  .pipe(transform1)
  .pipe(transform2)
  .pipe(destination);
// If transform1 errors, the pipeline continues but is broken!

// ✅ CORRECT - use pipeline() or manual error handlers
pipeline(
  source,
  transform1,
  transform2,
  destination,
  (err) => {
    if (err) {
      console.error('Pipeline failed:', err);
      // Cleanup happens automatically
    }
  }
);
```

### Types of Stream Errors

```javascript
// 1. Stream implementation errors
class FaultyStream extends Transform {
  _transform(chunk, encoding, callback) {
    // Synchronous error
    throw new Error('Sync error'); // ❌ Bad!

    // Asynchronous error
    callback(new Error('Async error')); // ✅ Good!
  }
}

// 2. External errors (network, database, file system)
class ExternalErrorStream extends Transform {
  async _transform(chunk, encoding, callback) {
    try {
      await externalAPI.process(chunk);
      callback();
    } catch (err) {
      callback(err); // ✅ Pass error to callback
    }
  }
}

// 3. Data validation errors
class ValidationStream extends Transform {
  _transform(chunk, encoding, callback) {
    if (!this.isValid(chunk)) {
      // Emit error
      this.destroy(new Error('Invalid data'));
      return;
    }
    callback(null, chunk);
  }
}

// 4. Resource errors (out of memory, file descriptors)
class ResourceStream extends Transform {
  _transform(chunk, encoding, callback) {
    if (process.memoryUsage().heapUsed > this.maxMemory) {
      callback(new Error('Memory limit exceeded'));
      return;
    }
    callback(null, chunk);
  }
}
```

---

## Error Handling Patterns

### Pattern 1: Try-Catch in Async Operations

```javascript
const { Transform } = require('stream');

class SafeAsyncTransform extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
  }

  async _transform(item, encoding, callback) {
    try {
      // Async operation that might fail
      const result = await this.processItem(item);
      callback(null, result);
    } catch (err) {
      // Handle error appropriately
      console.error('Processing error:', err.message);

      // Option 1: Pass error to callback (stops stream)
      callback(err);

      // Option 2: Skip bad item and continue
      // callback(); // Don't emit this item

      // Option 3: Emit error event and continue
      // this.emit('error', err);
      // callback();
    }
  }

  async processItem(item) {
    // Simulate async operation that might fail
    if (Math.random() < 0.1) {
      throw new Error('Random processing error');
    }
    return item;
  }
}
```

### Pattern 2: Error Recovery with Retry

```javascript
class RetryTransform extends Transform {
  constructor(maxRetries = 3, retryDelay = 1000, options) {
    super({ objectMode: true, ...options });
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  async _transform(item, encoding, callback) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.processItem(item);
        callback(null, result);
        return; // Success!
      } catch (err) {
        lastError = err;

        console.error(`Attempt ${attempt}/${this.maxRetries} failed:`, err.message);

        if (attempt < this.maxRetries) {
          // Wait before retrying
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }

    // All retries failed
    console.error('All retries exhausted:', lastError.message);

    // Decide what to do:
    // 1. Stop stream with error
    callback(lastError);

    // 2. Skip item and continue
    // this.emit('itemFailed', { item, error: lastError });
    // callback();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async processItem(item) {
    // Your processing logic
    return item;
  }
}
```

### Pattern 3: Circuit Breaker

```javascript
class CircuitBreakerTransform extends Transform {
  constructor(options = {}) {
    super({ objectMode: true, ...options });

    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async _transform(item, encoding, callback) {
    // Check circuit state
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        // Circuit is open - fail fast
        callback(new Error('Circuit breaker is OPEN'));
        return;
      } else {
        // Try to recover
        this.state = 'HALF_OPEN';
        console.log('Circuit breaker entering HALF_OPEN state');
      }
    }

    try {
      const result = await this.processItem(item);

      // Success!
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        console.log('Circuit breaker CLOSED - recovered');
      }

      callback(null, result);
    } catch (err) {
      this.failureCount++;

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.resetTimeout;
        console.error(`Circuit breaker OPEN after ${this.failureCount} failures`);
      }

      callback(err);
    }
  }

  async processItem(item) {
    // Your processing logic
    return item;
  }
}
```

### Pattern 4: Dead Letter Queue

```javascript
const fs = require('fs');

class DeadLetterQueueTransform extends Transform {
  constructor(deadLetterPath, options) {
    super({ objectMode: true, ...options });
    this.deadLetterPath = deadLetterPath;
    this.deadLetterStream = fs.createWriteStream(deadLetterPath, { flags: 'a' });
  }

  async _transform(item, encoding, callback) {
    try {
      const result = await this.processItem(item);
      callback(null, result);
    } catch (err) {
      // Write failed item to dead letter queue
      this.writeToDeadLetter({
        item,
        error: err.message,
        timestamp: new Date().toISOString()
      });

      // Continue processing (don't stop stream)
      callback();
    }
  }

  writeToDeadLetter(record) {
    this.deadLetterStream.write(JSON.stringify(record) + '\n');
    this.emit('deadLetter', record);
  }

  _flush(callback) {
    this.deadLetterStream.end();
    callback();
  }

  async processItem(item) {
    // Your processing logic
    return item;
  }
}
```

---

## Pipeline Error Handling

### Using pipeline() for Automatic Cleanup

```javascript
const { pipeline } = require('stream');
const fs = require('fs');

// ✅ BEST PRACTICE - pipeline handles errors and cleanup
pipeline(
  fs.createReadStream('input.txt'),
  new Transform({
    transform(chunk, encoding, callback) {
      try {
        const result = processChunk(chunk);
        callback(null, result);
      } catch (err) {
        callback(err); // pipeline will cleanup all streams
      }
    }
  }),
  fs.createWriteStream('output.txt'),
  (err) => {
    if (err) {
      console.error('Pipeline failed:', err);
      // All streams are destroyed
      // File descriptors are closed
      // No resource leaks
    } else {
      console.log('Pipeline succeeded');
    }
  }
);
```

### Custom Pipeline with Error Recovery

```javascript
function resilientPipeline(...streams) {
  return new Promise((resolve, reject) => {
    const callback = (err) => {
      if (err) {
        // Cleanup
        streams.forEach(stream => {
          if (stream && !stream.destroyed) {
            stream.destroy();
          }
        });
        reject(err);
      } else {
        resolve();
      }
    };

    pipeline(...streams, callback);
  });
}

// Usage with retry
async function processWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await resilientPipeline(
        createSource(),
        createTransform(),
        createDestination()
      );
      console.log('Pipeline succeeded');
      return; // Success!
    } catch (err) {
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, err.message);

      if (attempt === maxRetries) {
        throw err; // All retries exhausted
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

---

## Error Recovery Strategies

### Strategy 1: Graceful Degradation

```javascript
class GracefulTransform extends Transform {
  constructor(fallback, options) {
    super({ objectMode: true, ...options });
    this.fallback = fallback;
    this.errorCount = 0;
  }

  async _transform(item, encoding, callback) {
    try {
      // Try primary processing
      const result = await this.primaryProcess(item);
      callback(null, result);
    } catch (err) {
      this.errorCount++;

      try {
        // Fall back to simpler processing
        console.log('Using fallback processing');
        const result = await this.fallbackProcess(item);
        callback(null, result);
      } catch (fallbackErr) {
        // Both failed
        callback(fallbackErr);
      }
    }
  }

  async primaryProcess(item) {
    // Complex processing that might fail
    return item;
  }

  async fallbackProcess(item) {
    // Simpler, more reliable processing
    return this.fallback(item);
  }
}
```

### Strategy 2: Checkpoint and Resume

```javascript
const fs = require('fs');

class CheckpointTransform extends Transform {
  constructor(checkpointFile, options) {
    super({ objectMode: true, ...options });
    this.checkpointFile = checkpointFile;
    this.processedCount = this.loadCheckpoint();
    this.checkpointInterval = 100;
  }

  loadCheckpoint() {
    try {
      const data = fs.readFileSync(this.checkpointFile, 'utf8');
      return parseInt(data, 10) || 0;
    } catch (err) {
      return 0;
    }
  }

  saveCheckpoint() {
    fs.writeFileSync(this.checkpointFile, String(this.processedCount));
  }

  _transform(item, encoding, callback) {
    // Skip already processed items
    if (item.id <= this.processedCount) {
      callback();
      return;
    }

    try {
      const result = this.processItem(item);
      this.processedCount = item.id;

      // Checkpoint periodically
      if (this.processedCount % this.checkpointInterval === 0) {
        this.saveCheckpoint();
      }

      callback(null, result);
    } catch (err) {
      this.saveCheckpoint(); // Save progress before failing
      callback(err);
    }
  }

  _flush(callback) {
    this.saveCheckpoint(); // Final checkpoint
    callback();
  }

  processItem(item) {
    return item;
  }
}
```

### Strategy 3: Error Aggregation

```javascript
class ErrorAggregatorTransform extends Transform {
  constructor(maxErrors = 10, options) {
    super({ objectMode: true, ...options });
    this.errors = [];
    this.maxErrors = maxErrors;
    this.successCount = 0;
    this.errorCount = 0;
  }

  async _transform(item, encoding, callback) {
    try {
      const result = await this.processItem(item);
      this.successCount++;
      callback(null, result);
    } catch (err) {
      this.errorCount++;

      // Store error
      this.errors.push({
        item,
        error: err.message,
        timestamp: Date.now()
      });

      // Check if too many errors
      if (this.errors.length >= this.maxErrors) {
        // Emit aggregated error
        const aggregatedError = new Error(
          `Too many errors: ${this.errors.length} failures`
        );
        aggregatedError.errors = this.errors;
        callback(aggregatedError);
        return;
      }

      // Continue despite error
      callback();
    }
  }

  _flush(callback) {
    // Emit error summary
    this.emit('summary', {
      success: this.successCount,
      errors: this.errorCount,
      errorDetails: this.errors
    });

    callback();
  }

  async processItem(item) {
    return item;
  }
}
```

---

## Production Error Patterns

### Pattern 1: Comprehensive Error Logging

```javascript
class LoggingTransform extends Transform {
  constructor(logger, options) {
    super({ objectMode: true, ...options });
    this.logger = logger || console;
    this.errorContext = new Map();
  }

  async _transform(item, encoding, callback) {
    const startTime = Date.now();

    try {
      const result = await this.processItem(item);

      // Log success
      this.logger.debug('Item processed', {
        itemId: item.id,
        duration: Date.now() - startTime
      });

      callback(null, result);
    } catch (err) {
      // Log detailed error
      this.logger.error('Processing failed', {
        itemId: item.id,
        error: err.message,
        stack: err.stack,
        duration: Date.now() - startTime,
        context: this.errorContext.get(item.id)
      });

      callback(err);
    }
  }

  async processItem(item) {
    // Store context for error logging
    this.errorContext.set(item.id, {
      timestamp: Date.now(),
      item: JSON.stringify(item)
    });

    try {
      return await this.process(item);
    } finally {
      // Cleanup context
      this.errorContext.delete(item.id);
    }
  }

  process(item) {
    return item;
  }
}
```

### Pattern 2: Error Metrics and Monitoring

```javascript
class MonitoredTransform extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });

    this.metrics = {
      totalProcessed: 0,
      totalErrors: 0,
      errorsByType: new Map(),
      lastError: null,
      errorRate: 0
    };

    // Report metrics periodically
    this.metricsInterval = setInterval(() => {
      this.reportMetrics();
    }, 10000); // Every 10 seconds
  }

  async _transform(item, encoding, callback) {
    try {
      const result = await this.processItem(item);
      this.metrics.totalProcessed++;
      callback(null, result);
    } catch (err) {
      this.metrics.totalErrors++;
      this.metrics.lastError = {
        message: err.message,
        timestamp: Date.now()
      };

      // Track error types
      const errorType = err.constructor.name;
      const count = this.metrics.errorsByType.get(errorType) || 0;
      this.metrics.errorsByType.set(errorType, count + 1);

      // Calculate error rate
      this.metrics.errorRate =
        this.metrics.totalErrors / (this.metrics.totalProcessed + this.metrics.totalErrors);

      callback(err);
    }
  }

  reportMetrics() {
    console.log('\n=== Stream Metrics ===');
    console.log(`Total processed: ${this.metrics.totalProcessed}`);
    console.log(`Total errors: ${this.metrics.totalErrors}`);
    console.log(`Error rate: ${(this.metrics.errorRate * 100).toFixed(2)}%`);

    if (this.metrics.errorsByType.size > 0) {
      console.log('Errors by type:');
      for (const [type, count] of this.metrics.errorsByType) {
        console.log(`  ${type}: ${count}`);
      }
    }
  }

  _flush(callback) {
    clearInterval(this.metricsInterval);
    this.reportMetrics();
    callback();
  }

  async processItem(item) {
    return item;
  }
}
```

### Pattern 3: Alerting on Critical Errors

```javascript
class AlertingTransform extends Transform {
  constructor(alertThreshold, alertCallback, options) {
    super({ objectMode: true, ...options });
    this.alertThreshold = alertThreshold;
    this.alertCallback = alertCallback;
    this.recentErrors = [];
    this.alertWindow = 60000; // 1 minute
  }

  async _transform(item, encoding, callback) {
    try {
      const result = await this.processItem(item);
      callback(null, result);
    } catch (err) {
      const now = Date.now();

      // Add to recent errors
      this.recentErrors.push({ error: err, timestamp: now });

      // Remove old errors outside window
      this.recentErrors = this.recentErrors.filter(
        e => now - e.timestamp < this.alertWindow
      );

      // Check if threshold exceeded
      if (this.recentErrors.length >= this.alertThreshold) {
        this.sendAlert({
          message: `High error rate: ${this.recentErrors.length} errors in ${this.alertWindow}ms`,
          errors: this.recentErrors,
          timestamp: now
        });

        // Reset to avoid alert spam
        this.recentErrors = [];
      }

      callback(err);
    }
  }

  sendAlert(alert) {
    console.error('🚨 ALERT:', alert.message);

    if (this.alertCallback) {
      this.alertCallback(alert);
    }
  }

  async processItem(item) {
    return item;
  }
}
```

---

## Testing Error Handling

### Simulating Errors

```javascript
class ErrorSimulator extends Transform {
  constructor(errorRate = 0.1, options) {
    super({ objectMode: true, ...options });
    this.errorRate = errorRate;
  }

  _transform(item, encoding, callback) {
    // Randomly inject errors
    if (Math.random() < this.errorRate) {
      callback(new Error('Simulated error'));
    } else {
      callback(null, item);
    }
  }
}

// Test error handling
function testErrorHandling() {
  const { pipeline } = require('stream');
  const { Readable } = require('stream');

  const source = Readable.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const errorSimulator = new ErrorSimulator(0.3); // 30% error rate
  const retryTransform = new RetryTransform(3);

  pipeline(
    source,
    errorSimulator,
    retryTransform,
    (err) => {
      if (err) {
        console.error('Pipeline failed:', err.message);
      } else {
        console.log('Pipeline succeeded despite errors');
      }
    }
  );
}
```

---

## Summary

### Error Handling Best Practices

1. **Always handle errors** - use `pipeline()` or manual handlers
2. **Fail gracefully** - don't crash the entire system
3. **Log errors** with context for debugging
4. **Monitor error rates** and alert on anomalies
5. **Use retries** for transient failures
6. **Implement circuit breakers** for cascading failures
7. **Dead letter queues** for failed items
8. **Checkpoint progress** for resumability
9. **Test error paths** extensively
10. **Document error behavior** for operators

### Error Handling Patterns Summary

| Pattern | Use Case | Pros | Cons |
|---------|----------|------|------|
| Retry | Transient failures | Simple, effective | Can amplify load |
| Circuit Breaker | Cascading failures | Protects downstream | Complex state |
| Dead Letter Queue | Track failures | No data loss | Requires processing |
| Graceful Degradation | Partial functionality | Better UX | Reduced features |
| Checkpoint/Resume | Long processes | Resumable | State management |

### Next Steps

1. Study [Complex Stream Patterns](./03-complex-stream-patterns.md)
2. Review [error recovery example](../examples/02-error-recovery.js)
3. Practice with [resilient API client exercise](../exercises/exercise-2.js)

---

## Quick Reference

```javascript
// Basic error handling
stream.on('error', (err) => {
  console.error('Stream error:', err);
});

// Pipeline with error handling
const { pipeline } = require('stream');
pipeline(stream1, stream2, stream3, (err) => {
  if (err) console.error('Pipeline error:', err);
});

// Retry pattern
async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1000 * (i + 1));
    }
  }
}

// Error in transform
_transform(chunk, encoding, callback) {
  try {
    const result = process(chunk);
    callback(null, result);
  } catch (err) {
    callback(err); // ✅ Pass to callback
    // OR
    this.destroy(err); // ✅ Destroy stream
  }
}
```

Ready for complex patterns? Continue to [Complex Stream Patterns](./03-complex-stream-patterns.md)!
