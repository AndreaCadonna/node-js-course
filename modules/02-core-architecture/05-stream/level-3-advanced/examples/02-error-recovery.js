/**
 * 02-error-recovery.js
 * ====================
 * Demonstrates advanced error recovery patterns for production streams
 *
 * Key Concepts:
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern
 * - Dead letter queue
 * - Graceful degradation
 * - Error aggregation
 * - Checkpoint and resume
 *
 * Run: node 02-error-recovery.js
 */

const { Transform, Readable, Writable, pipeline } = require('stream');
const fs = require('fs');
const path = require('path');

console.log('=== Error Recovery Patterns ===\n');

// =============================================================================
// Example 1: Retry with Exponential Backoff
// =============================================================================

class RetryTransform extends Transform {
  constructor(maxRetries = 3, baseDelay = 1000, options) {
    super({ objectMode: true, ...options });
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.successCount = 0;
    this.failureCount = 0;
  }

  async _transform(item, encoding, callback) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.processItem(item);
        this.successCount++;
        callback(null, result);
        return; // Success!
      } catch (err) {
        lastError = err;

        console.error(`  Attempt ${attempt}/${this.maxRetries} failed:`, err.message);

        if (attempt < this.maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const delay = this.baseDelay * Math.pow(2, attempt - 1);
          console.log(`  Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    this.failureCount++;
    console.error(`  ❌ All ${this.maxRetries} retries exhausted for item:`, item.id);

    // Option 1: Fail the stream
    // callback(lastError);

    // Option 2: Skip item and continue
    this.emit('itemFailed', { item, error: lastError });
    callback();
  }

  async processItem(item) {
    // Simulate flaky operation (30% failure rate)
    if (Math.random() < 0.3) {
      throw new Error('Transient processing error');
    }

    return { ...item, processed: true, timestamp: Date.now() };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _flush(callback) {
    console.log('\n📊 Retry Statistics:');
    console.log(`  Successful: ${this.successCount}`);
    console.log(`  Failed: ${this.failureCount}`);
    console.log(`  Success rate: ${(this.successCount / (this.successCount + this.failureCount) * 100).toFixed(2)}%`);
    callback();
  }
}

function example1() {
  console.log('--- Example 1: Retry with Exponential Backoff ---\n');

  const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, data: `Item ${i + 1}` }));
  const source = Readable.from(items);

  const retryTransform = new RetryTransform(3, 100); // 3 retries, 100ms base delay

  retryTransform.on('itemFailed', ({ item, error }) => {
    console.log(`  📝 Logged failed item ${item.id} to monitoring system`);
  });

  const destination = new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      console.log(`  ✓ Processed: Item ${chunk.id}`);
      callback();
    }
  });

  pipeline(source, retryTransform, destination, (err) => {
    if (err) {
      console.error('Pipeline error:', err);
    } else {
      console.log('\n✓ Example 1 complete\n');
      example2();
    }
  });
}

// =============================================================================
// Example 2: Circuit Breaker Pattern
// =============================================================================

class CircuitBreakerTransform extends Transform {
  constructor(options = {}) {
    super({ objectMode: true, ...options });

    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.failureCount = 0;
    this.successCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
    this.stateChanges = [];
  }

  async _transform(item, encoding, callback) {
    // Check circuit state
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        // Circuit is open - fail fast
        console.log(`  🔴 Circuit OPEN - failing fast for item ${item.id}`);
        callback(new Error('Circuit breaker is OPEN'));
        return;
      } else {
        // Try to recover
        this.changeState('HALF_OPEN');
        console.log('  🟡 Circuit entering HALF_OPEN state - testing recovery');
      }
    }

    try {
      const result = await this.processItem(item);

      // Success!
      if (this.state === 'HALF_OPEN') {
        this.changeState('CLOSED');
        this.failureCount = 0;
        console.log('  🟢 Circuit CLOSED - recovered!');
      }

      this.successCount++;
      callback(null, result);
    } catch (err) {
      this.failureCount++;

      console.error(`  ⚠️  Failure ${this.failureCount}/${this.failureThreshold}:`, err.message);

      if (this.state === 'HALF_OPEN') {
        // Failed during recovery - reopen circuit
        this.changeState('OPEN');
        this.nextAttempt = Date.now() + this.resetTimeout;
        console.log(`  🔴 Circuit OPEN again - waiting ${this.resetTimeout}ms`);
      } else if (this.failureCount >= this.failureThreshold) {
        this.changeState('OPEN');
        this.nextAttempt = Date.now() + this.resetTimeout;
        console.log(`  🔴 Circuit OPEN after ${this.failureCount} failures`);
      }

      callback(err);
    }
  }

  changeState(newState) {
    this.stateChanges.push({
      from: this.state,
      to: newState,
      timestamp: Date.now()
    });
    this.state = newState;
  }

  async processItem(item) {
    // Simulate service that fails sometimes
    if (Math.random() < 0.4) {
      throw new Error('Service unavailable');
    }

    return { ...item, processed: true };
  }

  _flush(callback) {
    console.log('\n🔌 Circuit Breaker Statistics:');
    console.log(`  Final state: ${this.state}`);
    console.log(`  Successes: ${this.successCount}`);
    console.log(`  Failures: ${this.failureCount}`);
    console.log(`  State changes: ${this.stateChanges.length}`);

    if (this.stateChanges.length > 0) {
      console.log('\n  State history:');
      this.stateChanges.forEach(change => {
        console.log(`    ${change.from} → ${change.to}`);
      });
    }

    callback();
  }
}

function example2() {
  console.log('--- Example 2: Circuit Breaker Pattern ---\n');

  const items = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, data: `Item ${i + 1}` }));
  const source = Readable.from(items);

  const circuitBreaker = new CircuitBreakerTransform({
    failureThreshold: 3,
    resetTimeout: 2000 // 2 seconds
  });

  const destination = new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      console.log(`  ✓ Successfully processed: Item ${chunk.id}`);
      callback();
    }
  });

  pipeline(source, circuitBreaker, destination, (err) => {
    if (err) {
      console.log('  Pipeline stopped due to circuit breaker');
    }
    console.log('\n✓ Example 2 complete\n');
    example3();
  });
}

// =============================================================================
// Example 3: Dead Letter Queue
// =============================================================================

class DeadLetterQueueTransform extends Transform {
  constructor(deadLetterPath, options) {
    super({ objectMode: true, ...options });
    this.deadLetterPath = deadLetterPath;
    this.deadLetterStream = fs.createWriteStream(deadLetterPath, { flags: 'a' });
    this.deadLetterCount = 0;
    this.processedCount = 0;
  }

  async _transform(item, encoding, callback) {
    try {
      const result = await this.processItem(item);
      this.processedCount++;
      callback(null, result);
    } catch (err) {
      // Write failed item to dead letter queue
      this.writeToDeadLetter({
        item,
        error: err.message,
        timestamp: new Date().toISOString(),
        attemptNumber: 1
      });

      // Continue processing (don't stop stream)
      callback();
    }
  }

  async processItem(item) {
    // Simulate processing that fails for certain items
    if (item.id % 4 === 0) {
      throw new Error(`Validation failed for item ${item.id}`);
    }

    return { ...item, processed: true };
  }

  writeToDeadLetter(record) {
    this.deadLetterCount++;
    this.deadLetterStream.write(JSON.stringify(record) + '\n');
    console.log(`  💀 Dead letter: Item ${record.item.id} - ${record.error}`);
    this.emit('deadLetter', record);
  }

  _flush(callback) {
    this.deadLetterStream.end();

    console.log('\n📬 Dead Letter Queue Statistics:');
    console.log(`  Processed: ${this.processedCount}`);
    console.log(`  Dead letters: ${this.deadLetterCount}`);
    console.log(`  Dead letter file: ${this.deadLetterPath}`);

    callback();
  }
}

function example3() {
  console.log('--- Example 3: Dead Letter Queue ---\n');

  const deadLetterPath = path.join(__dirname, 'dead-letters.jsonl');

  // Clear previous dead letter file
  if (fs.existsSync(deadLetterPath)) {
    fs.unlinkSync(deadLetterPath);
  }

  const items = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, data: `Item ${i + 1}` }));
  const source = Readable.from(items);

  const dlq = new DeadLetterQueueTransform(deadLetterPath);

  dlq.on('deadLetter', (record) => {
    // In production, you might:
    // - Send alert to monitoring system
    // - Queue for manual review
    // - Attempt reprocessing later
  });

  const destination = new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      console.log(`  ✓ Processed: Item ${chunk.id}`);
      callback();
    }
  });

  pipeline(source, dlq, destination, (err) => {
    if (err) {
      console.error('Pipeline error:', err);
    } else {
      // Read and display dead letter file
      if (fs.existsSync(deadLetterPath)) {
        const content = fs.readFileSync(deadLetterPath, 'utf8');
        const lines = content.trim().split('\n');
        console.log(`\n  Dead letter file contents (${lines.length} items):`);
        lines.forEach(line => {
          const record = JSON.parse(line);
          console.log(`    - Item ${record.item.id}: ${record.error}`);
        });
      }

      console.log('\n✓ Example 3 complete\n');
      example4();
    }
  });
}

// =============================================================================
// Example 4: Graceful Degradation
// =============================================================================

class GracefulTransform extends Transform {
  constructor(fallback, options) {
    super({ objectMode: true, ...options });
    this.fallback = fallback;
    this.primarySuccessCount = 0;
    this.fallbackCount = 0;
    this.errorCount = 0;
  }

  async _transform(item, encoding, callback) {
    try {
      // Try primary processing
      const result = await this.primaryProcess(item);
      this.primarySuccessCount++;
      callback(null, result);
    } catch (primaryErr) {
      console.log(`  ⚠️  Primary processing failed for item ${item.id}, using fallback`);

      try {
        // Fall back to simpler processing
        const result = await this.fallbackProcess(item);
        this.fallbackCount++;
        callback(null, { ...result, degraded: true });
      } catch (fallbackErr) {
        // Both failed
        this.errorCount++;
        console.error(`  ❌ Both primary and fallback failed for item ${item.id}`);
        callback(fallbackErr);
      }
    }
  }

  async primaryProcess(item) {
    // Complex processing that might fail
    if (Math.random() < 0.3) {
      throw new Error('Complex processing failed');
    }

    return {
      ...item,
      complexScore: Math.random() * 100,
      enrichedData: 'Complex enrichment'
    };
  }

  async fallbackProcess(item) {
    // Simpler, more reliable processing
    return {
      ...item,
      simpleScore: 50, // Default value
      enrichedData: 'Basic enrichment'
    };
  }

  _flush(callback) {
    console.log('\n🔄 Graceful Degradation Statistics:');
    console.log(`  Primary success: ${this.primarySuccessCount}`);
    console.log(`  Fallback used: ${this.fallbackCount}`);
    console.log(`  Total errors: ${this.errorCount}`);

    const total = this.primarySuccessCount + this.fallbackCount + this.errorCount;
    const degradationRate = (this.fallbackCount / total * 100).toFixed(2);

    console.log(`  Degradation rate: ${degradationRate}%`);

    callback();
  }
}

function example4() {
  console.log('--- Example 4: Graceful Degradation ---\n');

  const items = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, data: `Item ${i + 1}` }));
  const source = Readable.from(items);

  const graceful = new GracefulTransform();

  const destination = new Writable({
    objectMode: true,
    write(chunk, encoding, callback) {
      const status = chunk.degraded ? '(degraded)' : '';
      console.log(`  ✓ Item ${chunk.id}: score=${chunk.complexScore || chunk.simpleScore} ${status}`);
      callback();
    }
  });

  pipeline(source, graceful, destination, (err) => {
    if (err) {
      console.error('Pipeline error:', err);
    } else {
      console.log('\n✓ Example 4 complete\n');
      showSummary();
    }
  });
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('=== Error Recovery Summary ===\n');
  console.log('Recovery Patterns:');
  console.log('1. Retry - Handle transient failures with exponential backoff');
  console.log('2. Circuit Breaker - Prevent cascading failures');
  console.log('3. Dead Letter Queue - Track and analyze failures');
  console.log('4. Graceful Degradation - Provide reduced functionality');
  console.log('\nBest Practices:');
  console.log('- Use retries for transient errors (network, rate limits)');
  console.log('- Implement circuit breakers for downstream services');
  console.log('- Log failed items for later analysis');
  console.log('- Provide fallback options when possible');
  console.log('- Monitor error rates and patterns');
  console.log('\n✓ All error recovery examples completed!\n');
}

// Start examples
example1();
