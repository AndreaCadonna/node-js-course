/**
 * 05-stream-pooling.js
 * ====================
 * Demonstrates connection pooling and resource reuse patterns
 *
 * Key Concepts:
 * - Stream pooling for resource efficiency
 * - Connection reuse
 * - Pool management (acquire/release)
 * - Automatic cleanup
 * - Pool statistics and monitoring
 *
 * Run: node 05-stream-pooling.js
 */

const { Transform, Readable, Writable } = require('stream');
const net = require('net');
const { EventEmitter } = require('events');

console.log('=== Stream Pooling Patterns ===\n');

// =============================================================================
// Example 1: Basic Stream Pool
// =============================================================================

class StreamPool extends EventEmitter {
  constructor(factory, poolSize) {
    super();
    this.factory = factory;
    this.poolSize = poolSize;
    this.available = [];
    this.inUse = new Set();
    this.stats = {
      created: 0,
      acquired: 0,
      released: 0,
      destroyed: 0
    };
  }

  async acquire() {
    // Try to get available stream
    if (this.available.length > 0) {
      const stream = this.available.pop();
      this.inUse.add(stream);
      this.stats.acquired++;

      console.log(`  📥 Acquired stream from pool (${this.inUse.size} in use, ${this.available.length} available)`);

      return stream;
    }

    // Create new if under limit
    if (this.inUse.size < this.poolSize) {
      const stream = await this.factory();
      this.inUse.add(stream);
      this.stats.created++;
      this.stats.acquired++;

      console.log(`  🆕 Created new stream (${this.inUse.size}/${this.poolSize})`);

      return stream;
    }

    // Wait for one to become available
    console.log(`  ⏳ Pool full, waiting for available stream...`);

    return new Promise((resolve) => {
      const checkAvailable = () => {
        if (this.available.length > 0) {
          const stream = this.available.pop();
          this.inUse.add(stream);
          this.stats.acquired++;

          console.log(`  ✓ Stream became available`);

          resolve(stream);
        } else {
          setTimeout(checkAvailable, 10);
        }
      };
      checkAvailable();
    });
  }

  release(stream) {
    if (!this.inUse.has(stream)) {
      console.warn('  ⚠️  Warning: Attempting to release stream not in pool');
      return;
    }

    this.inUse.delete(stream);
    this.available.push(stream);
    this.stats.released++;

    console.log(`  📤 Released stream (${this.inUse.size} in use, ${this.available.length} available)`);

    this.emit('released', stream);
  }

  async drain() {
    console.log('\n  🚰 Draining pool...');

    // Wait for all to be released
    while (this.inUse.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Destroy all
    for (const stream of this.available) {
      stream.destroy();
      this.stats.destroyed++;
    }

    this.available = [];

    console.log('  ✓ Pool drained');
  }

  getStats() {
    return {
      ...this.stats,
      inUse: this.inUse.size,
      available: this.available.length,
      utilizationRate: (this.inUse.size / this.poolSize * 100).toFixed(2) + '%'
    };
  }
}

async function example1() {
  console.log('--- Example 1: Basic Stream Pool ---\n');

  // Create a pool of transform streams
  const pool = new StreamPool(
    async () => {
      return new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          // Simulate processing
          setTimeout(() => {
            callback(null, { ...chunk, processed: true });
          }, 50);
        }
      });
    },
    3 // max 3 streams
  );

  // Process items using pool
  const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, data: `Item ${i + 1}` }));

  console.log('Processing items with pooled streams:\n');

  const promises = items.map(async (item) => {
    const stream = await pool.acquire();

    return new Promise((resolve, reject) => {
      stream.write(item);

      stream.once('data', (result) => {
        console.log(`  ✓ Processed: ${result.data}`);
        pool.release(stream);
        resolve(result);
      });

      stream.once('error', reject);
    });
  });

  await Promise.all(promises);

  // Show statistics
  console.log('\n📊 Pool Statistics:');
  const stats = pool.getStats();
  Object.entries(stats).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  await pool.drain();

  console.log('\n✓ Example 1 complete\n');
  example2();
}

// =============================================================================
// Example 2: Worker Pool Pattern
// =============================================================================

class WorkerPool {
  constructor(numWorkers, workerFactory) {
    this.workers = [];
    this.tasks = [];
    this.stats = {
      tasksCompleted: 0,
      tasksQueued: 0
    };

    // Create workers
    for (let i = 0; i < numWorkers; i++) {
      const worker = {
        id: i + 1,
        stream: workerFactory(i + 1),
        busy: false,
        tasksCompleted: 0
      };

      this.workers.push(worker);

      console.log(`  👷 Created worker ${worker.id}`);
    }
  }

  async processTask(task) {
    return new Promise((resolve, reject) => {
      this.tasks.push({ task, resolve, reject });
      this.stats.tasksQueued++;
      this.processNext();
    });
  }

  processNext() {
    // Find available worker
    const worker = this.workers.find(w => !w.busy);

    if (!worker || this.tasks.length === 0) {
      return;
    }

    const { task, resolve, reject } = this.tasks.shift();

    worker.busy = true;

    console.log(`  [Worker ${worker.id}] Processing task ${task.id}`);

    worker.stream.write(task);

    worker.stream.once('data', (result) => {
      worker.busy = false;
      worker.tasksCompleted++;
      this.stats.tasksCompleted++;

      console.log(`  [Worker ${worker.id}] ✓ Completed task ${task.id}`);

      resolve(result);

      // Process next task
      this.processNext();
    });

    worker.stream.once('error', (err) => {
      worker.busy = false;
      reject(err);
      this.processNext();
    });
  }

  getStats() {
    return {
      totalTasks: this.stats.tasksCompleted,
      queuedTasks: this.tasks.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      workerStats: this.workers.map(w => ({
        id: w.id,
        tasksCompleted: w.tasksCompleted,
        busy: w.busy
      }))
    };
  }

  async shutdown() {
    console.log('\n  🛑 Shutting down worker pool...');

    // Wait for all tasks to complete
    while (this.tasks.length > 0 || this.workers.some(w => w.busy)) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Destroy workers
    this.workers.forEach(w => w.stream.destroy());

    console.log('  ✓ Worker pool shut down');
  }
}

async function example2() {
  console.log('--- Example 2: Worker Pool ---\n');

  const pool = new WorkerPool(
    3, // 3 workers
    (workerId) => new Transform({
      objectMode: true,
      transform(task, encoding, callback) {
        // Simulate work
        setTimeout(() => {
          callback(null, {
            ...task,
            workerId,
            completedAt: Date.now()
          });
        }, Math.random() * 100);
      }
    })
  );

  console.log('\nProcessing tasks:\n');

  // Create tasks
  const tasks = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    data: `Task ${i + 1}`
  }));

  // Process all tasks
  const results = await Promise.all(
    tasks.map(task => pool.processTask(task))
  );

  console.log('\n📊 Worker Pool Statistics:');
  const stats = pool.getStats();

  console.log(`  Total tasks: ${stats.totalTasks}`);
  console.log(`  Queued tasks: ${stats.queuedTasks}`);
  console.log('\n  Worker distribution:');

  stats.workerStats.forEach(worker => {
    console.log(`    Worker ${worker.id}: ${worker.tasksCompleted} tasks`);
  });

  await pool.shutdown();

  console.log('\n✓ Example 2 complete\n');
  example3();
}

// =============================================================================
// Example 3: Connection Pool (Mock)
// =============================================================================

class ConnectionPool {
  constructor(config) {
    this.config = config;
    this.connections = [];
    this.available = [];
    this.waiting = [];
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      waitingRequests: 0,
      totalAcquired: 0
    };
  }

  async acquire() {
    // Return available connection
    if (this.available.length > 0) {
      const conn = this.available.pop();
      this.stats.activeConnections++;
      this.stats.totalAcquired++;

      console.log(`  🔌 Acquired connection (${this.stats.activeConnections} active)`);

      return conn;
    }

    // Create new if under limit
    if (this.connections.length < this.config.max) {
      const conn = await this.createConnection();
      this.connections.push(conn);
      this.stats.totalConnections++;
      this.stats.activeConnections++;
      this.stats.totalAcquired++;

      console.log(`  🆕 Created new connection (${this.connections.length}/${this.config.max})`);

      return conn;
    }

    // Wait for available connection
    console.log(`  ⏳ Waiting for connection...`);

    this.stats.waitingRequests++;

    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(conn) {
    this.stats.activeConnections--;

    // Give to waiting request
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift();
      this.stats.waitingRequests--;
      this.stats.activeConnections++;

      console.log(`  ✓ Connection given to waiting request`);

      resolve(conn);
    } else {
      this.available.push(conn);
      console.log(`  📤 Connection returned to pool (${this.available.length} available)`);
    }
  }

  async createConnection() {
    // Simulate connection creation
    await new Promise(resolve => setTimeout(resolve, 10));

    return new Transform({
      objectMode: true,
      transform(data, encoding, callback) {
        // Simulate query
        setTimeout(() => {
          callback(null, { ...data, result: 'success' });
        }, 20);
      }
    });
  }

  async close() {
    console.log('\n  🔌 Closing all connections...');

    this.connections.forEach(conn => conn.destroy());
    this.connections = [];
    this.available = [];

    console.log('  ✓ All connections closed');
  }

  getStats() {
    return {
      ...this.stats,
      totalConnections: this.connections.length,
      availableConnections: this.available.length
    };
  }
}

async function example3() {
  console.log('--- Example 3: Connection Pool ---\n');

  const pool = new ConnectionPool({ max: 5 });

  console.log('Simulating database queries:\n');

  // Simulate 10 concurrent queries
  const queries = Array.from({ length: 10 }, async (_, i) => {
    const conn = await pool.acquire();

    return new Promise((resolve) => {
      conn.write({ id: i + 1, query: `SELECT * FROM table${i + 1}` });

      conn.once('data', (result) => {
        console.log(`  ✓ Query ${i + 1} completed`);
        pool.release(conn);
        resolve(result);
      });
    });
  });

  await Promise.all(queries);

  console.log('\n📊 Connection Pool Statistics:');
  const stats = pool.getStats();

  Object.entries(stats).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  await pool.close();

  console.log('\n✓ Example 3 complete\n');
  showSummary();
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('=== Stream Pooling Summary ===\n');
  console.log('Pooling Patterns:');
  console.log('1. Basic Pool - Reuse streams to avoid creation overhead');
  console.log('2. Worker Pool - Distribute tasks across fixed workers');
  console.log('3. Connection Pool - Manage database/network connections');
  console.log('\nBenefits:');
  console.log('- Reduced resource allocation overhead');
  console.log('- Limited concurrent resource usage');
  console.log('- Better resource utilization');
  console.log('- Controlled concurrency');
  console.log('\nBest Practices:');
  console.log('- Set appropriate pool size based on workload');
  console.log('- Monitor pool utilization and adjust');
  console.log('- Implement timeout for acquire operations');
  console.log('- Clean up resources on shutdown');
  console.log('- Track statistics for optimization');
  console.log('\n✓ All pooling examples completed!\n');
}

// Start examples
example1();
