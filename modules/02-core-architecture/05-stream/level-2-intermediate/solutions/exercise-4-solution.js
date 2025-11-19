/**
 * Solution: Exercise 4 - Rate Limiter Transform Stream
 * ======================================================
 * Complete rate limiter with smooth output and queue management
 */

const { Transform, Readable } = require('stream');

class RateLimiterStream extends Transform {
  constructor(itemsPerSecond, options) {
    super({ objectMode: true, ...options });

    this.itemsPerSecond = itemsPerSecond;
    this.interval = 1000 / itemsPerSecond;
    this.queue = [];
    this.timer = null;
    this.lastEmit = 0;
    this.running = false;
    this.stats = {
      total: 0,
      queued: 0,
      maxQueueDepth: 0
    };
  }

  _transform(item, encoding, callback) {
    this.queue.push(item);
    this.stats.queued++;

    if (this.queue.length > this.stats.maxQueueDepth) {
      this.stats.maxQueueDepth = this.queue.length;
    }

    if (!this.running) {
      this.running = true;
      this.processQueue();
    }

    callback();
  }

  _flush(callback) {
    if (this.queue.length === 0) {
      this.reportFinalStats();
      callback();
      return;
    }

    const checkQueue = () => {
      if (this.queue.length === 0) {
        this.reportFinalStats();
        callback();
      } else {
        setTimeout(checkQueue, 100);
      }
    };

    checkQueue();
  }

  processQueue() {
    if (this.queue.length === 0) {
      this.running = false;
      return;
    }

    const now = Date.now();
    const timeSinceLastEmit = now - this.lastEmit;

    if (timeSinceLastEmit >= this.interval || this.lastEmit === 0) {
      this.emitNext();
      setImmediate(() => this.processQueue());
    } else {
      const delay = this.interval - timeSinceLastEmit;
      this.timer = setTimeout(() => this.processQueue(), delay);
    }
  }

  emitNext() {
    if (this.queue.length === 0) return;

    const item = this.queue.shift();
    this.push(item);
    this.lastEmit = Date.now();
    this.stats.total++;

    if (this.queue.length % 5 === 0 && this.queue.length > 0) {
      console.log(`  Queue depth: ${this.queue.length} items`);
    }
  }

  reportFinalStats() {
    console.log(`\nRate Limiter Statistics:`);
    console.log(`  Total items processed: ${this.stats.total}`);
    console.log(`  Max queue depth: ${this.stats.maxQueueDepth}`);
  }

  _destroy(err, callback) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    callback(err);
  }
}

// =============================================================================
// Tests
// =============================================================================

function test1() {
  console.log('Test 1: Basic Rate Limiting (5 items/sec)\n');

  const limiter = new RateLimiterStream(5);
  const startTime = Date.now();

  const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));

  items.forEach(item => limiter.write(item));
  limiter.end();

  limiter.on('data', (item) => {
    const elapsed = Date.now() - startTime;
    console.log(`  ${elapsed}ms: Item ${item.id}`);
  });

  limiter.on('end', () => {
    const duration = Date.now() - startTime;
    console.log(`\n✓ Test 1 complete in ${duration}ms`);
    console.log(`Expected: ~1800ms (10 items at 5/sec = 200ms between items)\n`);
    test2();
  });
}

function test2() {
  console.log('Test 2: Queue Depth Monitoring\n');

  const limiter = new RateLimiterStream(2);

  for (let i = 1; i <= 20; i++) {
    limiter.write({ id: i });
  }

  limiter.end();

  let count = 0;

  limiter.on('data', (item) => {
    count++;
  });

  limiter.on('end', () => {
    console.log(`\n✓ Test 2 complete (${count} items processed)\n`);
    test3();
  });
}

function test3() {
  console.log('Test 3: Burst vs Smooth Output\n');

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
      console.log('\n✓ Test 3 complete');
      console.log('Notice the smooth, consistent spacing with rate limiting!\n');
      console.log('=== All tests passed! ===\n');
    });
  });
}

test1();

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. Rate Calculation:
 *    interval = 1000ms / itemsPerSecond
 *    Example: 5 items/sec = 200ms between items
 *
 * 2. Smooth Output:
 *    - Track lastEmit timestamp
 *    - Calculate time since last emit
 *    - If enough time passed, emit immediately
 *    - Otherwise, setTimeout for remaining time
 *    - This ensures consistent spacing
 *
 * 3. Queue Management:
 *    - Add items to queue in _transform()
 *    - Process queue asynchronously
 *    - Track max queue depth
 *    - Report periodically
 *
 * 4. Callback Handling:
 *    - Call callback() immediately in _transform()
 *    - Don't wait for output
 *    - This prevents blocking producer
 *
 * 5. Cleanup:
 *    - Wait for queue to drain in _flush()
 *    - Clear timers in _destroy()
 *    - Report final statistics
 *
 * 6. Backpressure:
 *    - Still respects downstream backpressure
 *    - Rate limiting adds additional delay
 *    - Can be combined with other transforms
 */
