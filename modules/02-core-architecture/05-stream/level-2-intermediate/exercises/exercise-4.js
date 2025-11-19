/**
 * Exercise 4: Rate Limiter Transform Stream
 * ==========================================
 *
 * Difficulty: Hard
 *
 * Task:
 * Create a Transform stream that limits throughput to N items per second with:
 * - Configurable rate limit
 * - Smooth output (not bursty)
 * - Buffer management
 * - Queue depth reporting
 * - Backpressure handling
 *
 * Requirements:
 * 1. Create a RateLimiterStream class extending Transform
 * 2. Accept itemsPerSecond parameter
 * 3. Ensure smooth output (not all at once)
 * 4. Buffer items when rate exceeded
 * 5. Report queue depth periodically
 * 6. Handle backpressure correctly
 * 7. Clean up timers on stream end
 *
 * Run: node exercise-4.js
 */

const { Transform, Readable } = require('stream');

// =============================================================================
// TODO: Implement RateLimiterStream class
// =============================================================================

class RateLimiterStream extends Transform {
  constructor(itemsPerSecond, options) {
    // TODO: Call super with object mode
    super({ objectMode: true, ...options });

    // TODO: Initialize instance variables
    // - this.itemsPerSecond
    // - this.interval (time between items in ms)
    // - this.queue = []
    // - this.timer = null
    // - this.lastEmit = 0
    // - this.stats = { total: 0, queued: 0, maxQueueDepth: 0 }
    // - this.running = false
  }

  _transform(item, encoding, callback) {
    // TODO: Implement rate limiting
    // 1. Add item to queue
    // 2. Update statistics
    // 3. Start processing if not already running
    // 4. Call callback immediately (don't wait for output)
  }

  _flush(callback) {
    // TODO: Process remaining queued items
    // TODO: Clean up timers
    // TODO: Emit final statistics
    // TODO: Call callback when done
  }

  processQueue() {
    // TODO: Process queue with rate limiting
    // 1. If queue is empty, stop
    // 2. Calculate time since last emit
    // 3. If enough time has passed, emit next item
    // 4. Otherwise, wait and try again
    // 5. Use setTimeout to maintain smooth rate
  }

  emitNext() {
    // TODO: Emit next item from queue
    // 1. Get item from queue
    // 2. Push to output
    // 3. Update lastEmit time
    // 4. Update statistics
    // 5. Log queue depth if needed
  }

  reportQueueDepth() {
    // TODO: Report current queue depth
    // Update max queue depth
  }

  _destroy(err, callback) {
    // TODO: Clean up timer
    callback(err);
  }
}

// =============================================================================
// Test Cases
// =============================================================================

function test1() {
  console.log('Test 1: Basic Rate Limiting (5 items/sec)\n');

  const limiter = new RateLimiterStream(5); // 5 items per second
  const startTime = Date.now();

  // Generate 10 items quickly
  const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));

  // TODO: Write all items to limiter
  // TODO: Listen to 'data' event and log with timestamp
  // TODO: Calculate time between items
  // TODO: Verify rate limiting is working

  limiter.on('end', () => {
    const duration = Date.now() - startTime;
    console.log(`\n✓ Test 1 complete in ${duration}ms`);
    console.log(`Expected: ~2000ms (10 items at 5/sec)`);
    console.log();
    test2();
  });
}

function test2() {
  console.log('Test 2: Queue Depth Monitoring\n');

  const limiter = new RateLimiterStream(2); // 2 items per second (slow)

  // TODO: Generate 20 items quickly
  // TODO: Monitor queue depth
  // TODO: Report max queue depth at end

  // Then call test3()
}

function test3() {
  console.log('\nTest 3: Backpressure Handling\n');

  const limiter = new RateLimiterStream(10, {
    highWaterMark: 5 // Small buffer to test backpressure
  });

  // TODO: Create fast producer
  // TODO: Create slow consumer
  // TODO: Connect with limiter in middle
  // TODO: Demonstrate backpressure propagation

  // Then call test4()
}

function test4() {
  console.log('\nTest 4: Burst vs Smooth Output\n');

  console.log('Without rate limiting:');
  const withoutLimiter = new Transform({ objectMode: true });
  withoutLimiter._transform = (chunk, enc, cb) => {
    cb(null, chunk);
  };

  const items1 = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
  const start1 = Date.now();

  items1.forEach(item => withoutLimiter.write(item));
  withoutLimiter.end();

  withoutLimiter.on('data', (item) => {
    console.log(`  ${Date.now() - start1}ms: Item ${item.id}`);
  });

  withoutLimiter.on('end', () => {
    console.log('\nWith rate limiting (5 items/sec):');

    const withLimiter = new RateLimiterStream(5);
    const items2 = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
    const start2 = Date.now();

    items2.forEach(item => withLimiter.write(item));
    withLimiter.end();

    withLimiter.on('data', (item) => {
      console.log(`  ${Date.now() - start2}ms: Item ${item.id}`);
    });

    withLimiter.on('end', () => {
      console.log('\n✓ Test 4 complete\n');
      showSummary();
    });
  });
}

// Start tests
test1();

// =============================================================================
// Expected Output Example:
// =============================================================================

/**
 * Test 1: Basic Rate Limiting (5 items/sec)
 *
 * 0ms: Item 1
 * 200ms: Item 2
 * 400ms: Item 3
 * 600ms: Item 4
 * 800ms: Item 5
 * 1000ms: Item 6
 * 1200ms: Item 7
 * 1400ms: Item 8
 * 1600ms: Item 9
 * 1800ms: Item 10
 *
 * ✓ Test 1 complete in 1800ms
 * Expected: ~2000ms (10 items at 5/sec)
 *
 *
 * Test 2: Queue Depth Monitoring
 *
 * Queue depth: 19 items
 * Queue depth: 18 items
 * ...
 * Queue depth: 1 items
 * Max queue depth: 20 items
 *
 * ✓ Test 2 complete
 *
 *
 * Test 3: Backpressure Handling
 *
 * Fast producer writing 100 items...
 * ⚠ Backpressure at item 50 (queue full)
 * ✅ Resuming after queue drains
 * ...
 *
 * ✓ Test 3 complete
 *
 *
 * Test 4: Burst vs Smooth Output
 *
 * Without rate limiting:
 *   0ms: Item 1
 *   0ms: Item 2
 *   0ms: Item 3
 *   1ms: Item 4
 *   1ms: Item 5
 *
 * With rate limiting (5 items/sec):
 *   0ms: Item 1
 *   200ms: Item 2
 *   400ms: Item 3
 *   600ms: Item 4
 *   800ms: Item 5
 */

// =============================================================================
// Hints:
// =============================================================================

/**
 * Hint 1: Calculating interval
 * this.interval = 1000 / itemsPerSecond; // milliseconds between items
 * Example: 5 items/sec = 200ms between items
 *
 * Hint 2: Smooth output with setTimeout
 * processQueue() {
 *   if (this.queue.length === 0) {
 *     this.running = false;
 *     return;
 *   }
 *
 *   const now = Date.now();
 *   const timeSinceLastEmit = now - this.lastEmit;
 *
 *   if (timeSinceLastEmit >= this.interval) {
 *     this.emitNext();
 *     setImmediate(() => this.processQueue());
 *   } else {
 *     const delay = this.interval - timeSinceLastEmit;
 *     setTimeout(() => this.processQueue(), delay);
 *   }
 * }
 *
 * Hint 3: Queue management
 * _transform(item, encoding, callback) {
 *   this.queue.push(item);
 *   if (!this.running) {
 *     this.running = true;
 *     this.processQueue();
 *   }
 *   callback(); // Don't wait for output
 * }
 *
 * Hint 4: Cleanup in _flush
 * _flush(callback) {
 *   if (this.queue.length === 0) {
 *     callback();
 *     return;
 *   }
 *
 *   // Wait for queue to drain
 *   const checkQueue = () => {
 *     if (this.queue.length === 0) {
 *       callback();
 *     } else {
 *       setTimeout(checkQueue, 100);
 *     }
 *   };
 *
 *   checkQueue();
 * }
 *
 * Hint 5: Timer cleanup
 * _destroy(err, callback) {
 *   if (this.timer) {
 *     clearTimeout(this.timer);
 *     this.timer = null;
 *   }
 *   callback(err);
 * }
 */

function showSummary() {
  console.log('\n=== Summary ===\n');
  console.log('Rate limiting ensures:');
  console.log('1. Smooth, predictable output rate');
  console.log('2. Protection against overwhelming downstream');
  console.log('3. Fair resource usage');
  console.log('\nUse cases:');
  console.log('• API rate limiting');
  console.log('• Network throttling');
  console.log('• Resource-constrained processing');
  console.log('• Load balancing');
  console.log('\n✓ All tests complete!\n');
}
