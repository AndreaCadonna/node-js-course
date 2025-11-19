/**
 * Example 2: Buffer Pooling
 *
 * Demonstrates buffer pooling to reduce allocation overhead
 * and improve performance in high-frequency scenarios.
 */

console.log('=== Buffer Pooling ===\n');

// 1. Why buffer pooling?
console.log('1. Performance Problem: Frequent Allocations');

console.time('Without pooling (10000 allocations)');
for (let i = 0; i < 10000; i++) {
  const buf = Buffer.alloc(4096);
  // Simulate usage
  buf[0] = i & 0xFF;
}
console.timeEnd('Without pooling (10000 allocations)');
console.log('');

// 2. Simple buffer pool
console.log('2. Simple Buffer Pool Implementation');

class SimpleBufferPool {
  constructor(bufferSize, initialSize = 10) {
    this.bufferSize = bufferSize;
    this.available = [];

    // Pre-allocate buffers
    for (let i = 0; i < initialSize; i++) {
      this.available.push(Buffer.allocUnsafe(bufferSize));
    }

    console.log(`Pool created: ${initialSize} buffers of ${bufferSize} bytes`);
  }

  acquire() {
    if (this.available.length > 0) {
      return this.available.pop();
    }
    // Pool exhausted - allocate new buffer
    console.log('Pool exhausted, allocating new buffer');
    return Buffer.allocUnsafe(this.bufferSize);
  }

  release(buffer) {
    if (buffer.length !== this.bufferSize) {
      throw new Error('Buffer size mismatch');
    }
    // Clear buffer before returning to pool (security)
    buffer.fill(0);
    this.available.push(buffer);
  }

  size() {
    return this.available.length;
  }
}

const pool = new SimpleBufferPool(4096, 10);

console.log('Available buffers:', pool.size());

const buf1 = pool.acquire();
console.log('Acquired buffer 1, available:', pool.size());

const buf2 = pool.acquire();
console.log('Acquired buffer 2, available:', pool.size());

pool.release(buf1);
console.log('Released buffer 1, available:', pool.size());

pool.release(buf2);
console.log('Released buffer 2, available:', pool.size());
console.log('');

// 3. Performance with pooling
console.log('3. Performance with Pooling');

const perfPool = new SimpleBufferPool(4096, 100);

console.time('With pooling (10000 acquire/release)');
for (let i = 0; i < 10000; i++) {
  const buf = perfPool.acquire();
  buf[0] = i & 0xFF;
  perfPool.release(buf);
}
console.timeEnd('With pooling (10000 acquire/release)');
console.log('✅ Pooling is significantly faster!');
console.log('');

// 4. Advanced pool with stats
console.log('4. Advanced Pool with Statistics');

class AdvancedBufferPool {
  constructor(bufferSize, maxSize = 50) {
    this.bufferSize = bufferSize;
    this.maxSize = maxSize;
    this.available = [];
    this.stats = {
      acquired: 0,
      released: 0,
      created: 0,
      discarded: 0
    };
  }

  acquire() {
    this.stats.acquired++;

    if (this.available.length > 0) {
      return this.available.pop();
    }

    this.stats.created++;
    return Buffer.allocUnsafe(this.bufferSize);
  }

  release(buffer) {
    this.stats.released++;

    // Don't grow pool beyond max size
    if (this.available.length >= this.maxSize) {
      this.stats.discarded++;
      return; // Let buffer be garbage collected
    }

    buffer.fill(0);
    this.available.push(buffer);
  }

  getStats() {
    return {
      ...this.stats,
      available: this.available.length,
      hitRate: (this.stats.acquired - this.stats.created) / this.stats.acquired
    };
  }

  reset() {
    this.available = [];
    this.stats = {
      acquired: 0,
      released: 0,
      created: 0,
      discarded: 0
    };
  }
}

const advPool = new AdvancedBufferPool(1024, 20);

// Simulate usage
for (let i = 0; i < 100; i++) {
  const buf = advPool.acquire();
  // Simulate async operation
  if (i % 2 === 0) {
    advPool.release(buf);
  }
}

console.log('Pool statistics:', advPool.getStats());
console.log('');

// 5. Size-based pool
console.log('5. Multi-Size Buffer Pool');

class MultiSizeBufferPool {
  constructor() {
    this.pools = new Map();
    // Common sizes: 1KB, 4KB, 16KB, 64KB
    [1024, 4096, 16384, 65536].forEach(size => {
      this.pools.set(size, new AdvancedBufferPool(size, 10));
    });
  }

  acquire(size) {
    // Find smallest pool that fits
    for (const [poolSize, pool] of this.pools) {
      if (poolSize >= size) {
        return pool.acquire();
      }
    }

    // Size too large, allocate directly
    return Buffer.allocUnsafe(size);
  }

  release(buffer) {
    const size = buffer.length;
    const pool = this.pools.get(size);

    if (pool) {
      pool.release(buffer);
    }
    // else: buffer not from pool, let GC handle it
  }

  getStats() {
    const stats = {};
    this.pools.forEach((pool, size) => {
      stats[size] = pool.getStats();
    });
    return stats;
  }
}

const multiPool = new MultiSizeBufferPool();

// Acquire different sizes
const small = multiPool.acquire(512);   // Gets 1KB buffer
const medium = multiPool.acquire(5000); // Gets 16KB buffer
const large = multiPool.acquire(50000); // Gets 64KB buffer

console.log('Small buffer:', small.length);
console.log('Medium buffer:', medium.length);
console.log('Large buffer:', large.length);

multiPool.release(small);
multiPool.release(medium);
multiPool.release(large);

console.log('Multi-pool stats:', multiPool.getStats());
console.log('');

// 6. Practical: HTTP request handler
console.log('6. Practical: Pooled Request Handler');

class RequestHandler {
  constructor() {
    this.bufferPool = new AdvancedBufferPool(4096, 50);
  }

  handleRequest(requestData) {
    // Acquire buffer from pool
    const buffer = this.bufferPool.acquire();

    try {
      // Process request
      const data = Buffer.from(requestData);
      data.copy(buffer, 0);

      // Simulate processing
      const response = buffer.slice(0, data.length);

      return response.toString();
    } finally {
      // Always release buffer
      this.bufferPool.release(buffer);
    }
  }

  getPoolStats() {
    return this.bufferPool.getStats();
  }
}

const handler = new RequestHandler();

// Simulate multiple requests
for (let i = 0; i < 20; i++) {
  handler.handleRequest(`Request ${i}`);
}

console.log('Request handler stats:', handler.getPoolStats());
console.log('');

// 7. Memory-aware pool
console.log('7. Memory-Aware Pool with Limits');

class MemoryAwarePool {
  constructor(bufferSize, maxMemoryMB) {
    this.bufferSize = bufferSize;
    this.maxBuffers = Math.floor((maxMemoryMB * 1024 * 1024) / bufferSize);
    this.available = [];

    console.log(`Memory limit: ${maxMemoryMB}MB = max ${this.maxBuffers} buffers`);
  }

  acquire() {
    if (this.available.length > 0) {
      return this.available.pop();
    }

    if (this.getCurrentMemoryMB() >= this.getMaxMemoryMB()) {
      throw new Error('Memory limit exceeded');
    }

    return Buffer.allocUnsafe(this.bufferSize);
  }

  release(buffer) {
    if (this.available.length < this.maxBuffers) {
      buffer.fill(0);
      this.available.push(buffer);
    }
    // else: discard to free memory
  }

  getCurrentMemoryMB() {
    return (this.available.length * this.bufferSize) / (1024 * 1024);
  }

  getMaxMemoryMB() {
    return (this.maxBuffers * this.bufferSize) / (1024 * 1024);
  }

  getUtilization() {
    return (this.available.length / this.maxBuffers) * 100;
  }
}

const memPool = new MemoryAwarePool(1024 * 1024, 10); // 1MB buffers, 10MB limit

console.log('Current memory:', memPool.getCurrentMemoryMB().toFixed(2), 'MB');
console.log('Max memory:', memPool.getMaxMemoryMB().toFixed(2), 'MB');

// Acquire some buffers
const bufs = [];
for (let i = 0; i < 5; i++) {
  bufs.push(memPool.acquire());
}

// Release them
bufs.forEach(b => memPool.release(b));

console.log('Pool utilization:', memPool.getUtilization().toFixed(1), '%');
console.log('');

// 8. Best practices
console.log('8. Buffer Pooling Best Practices');

console.log('✓ Use pools for frequent allocations (> 100/sec)');
console.log('✓ Match buffer sizes to common use cases');
console.log('✓ Always release buffers back to pool');
console.log('✓ Clear buffers before returning (security)');
console.log('✓ Set maximum pool size to prevent memory leaks');
console.log('✓ Monitor pool statistics in production');
console.log('⚠️  Use try/finally to ensure buffers are released');
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Pooling reduces allocation overhead');
console.log('✓ Pre-allocate buffers for reuse');
console.log('✓ Track statistics for optimization');
console.log('✓ Set memory limits to prevent leaks');
console.log('✓ Clear buffers before reuse (security)');
console.log('✓ Use try/finally pattern for release');
