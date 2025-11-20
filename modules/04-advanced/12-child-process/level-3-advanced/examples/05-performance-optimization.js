/**
 * Example 5: Performance Optimization
 *
 * Demonstrates performance optimization techniques:
 * - Process pooling and reuse
 * - Caching strategies
 * - Resource monitoring
 * - Bottleneck identification
 * - Memory management
 * - CPU utilization optimization
 */

const { fork } = require('child_process');
const { performance } = require('perf_hooks');

console.log('=== Performance Optimization Example ===\n');

/**
 * PerformanceMonitor - Tracks process performance metrics
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      executions: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    this.history = [];
  }

  /**
   * Record an execution
   */
  recordExecution(duration, cached = false, error = false) {
    this.metrics.executions++;
    this.metrics.totalTime += duration;
    this.metrics.minTime = Math.min(this.metrics.minTime, duration);
    this.metrics.maxTime = Math.max(this.metrics.maxTime, duration);

    if (error) {
      this.metrics.errors++;
    }

    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    this.history.push({
      timestamp: Date.now(),
      duration,
      cached,
      error
    });

    // Keep only last 100 entries
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const avgTime = this.metrics.executions > 0
      ? this.metrics.totalTime / this.metrics.executions
      : 0;

    const cacheHitRate = this.metrics.executions > 0
      ? (this.metrics.cacheHits / this.metrics.executions) * 100
      : 0;

    return {
      executions: this.metrics.executions,
      averageTime: avgTime.toFixed(2),
      minTime: this.metrics.minTime === Infinity ? 0 : this.metrics.minTime.toFixed(2),
      maxTime: this.metrics.maxTime.toFixed(2),
      totalTime: this.metrics.totalTime.toFixed(2),
      errors: this.metrics.errors,
      cacheHitRate: cacheHitRate.toFixed(1) + '%',
      recentExecutions: this.history.slice(-10).map(h => ({
        duration: h.duration.toFixed(2),
        cached: h.cached
      }))
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      executions: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    this.history = [];
  }
}

/**
 * OptimizedProcessPool - Process pool with caching and monitoring
 */
class OptimizedProcessPool {
  constructor(options = {}) {
    this.workerPath = options.workerPath;
    this.poolSize = options.poolSize || 4;
    this.enableCache = options.enableCache !== false;
    this.cacheMaxSize = options.cacheMaxSize || 100;
    this.cacheMaxAge = options.cacheMaxAge || 60000; // 1 minute

    this.workers = [];
    this.queue = [];
    this.cache = new Map();
    this.monitor = new PerformanceMonitor();
    this.taskCounter = 0;
  }

  /**
   * Initialize the pool
   */
  async init() {
    console.log(`Initializing optimized pool (size: ${this.poolSize})...`);

    for (let i = 0; i < this.poolSize; i++) {
      await this.createWorker(i);
    }

    // Start cache cleanup
    this.startCacheCleanup();

    console.log(`Pool ready with ${this.workers.length} workers\n`);
  }

  /**
   * Create a worker
   */
  async createWorker(id) {
    const worker = fork(this.workerPath);

    const workerInfo = {
      id,
      worker,
      available: true,
      tasksProcessed: 0,
      totalProcessingTime: 0,
      createdAt: Date.now()
    };

    worker.on('message', (msg) => {
      if (msg.type === 'task_complete') {
        this.handleTaskComplete(workerInfo, msg);
      }
    });

    worker.on('exit', () => {
      const index = this.workers.indexOf(workerInfo);
      if (index !== -1) {
        this.workers.splice(index, 1);
        this.createWorker(id); // Auto-restart
      }
    });

    this.workers.push(workerInfo);
    return workerInfo;
  }

  /**
   * Execute a task
   */
  async execute(task) {
    const taskId = ++this.taskCounter;
    const startTime = performance.now();

    // Check cache
    if (this.enableCache) {
      const cacheKey = this.getCacheKey(task);
      const cached = this.cache.get(cacheKey);

      if (cached && !this.isCacheExpired(cached)) {
        const duration = performance.now() - startTime;
        this.monitor.recordExecution(duration, true);

        console.log(`Task ${taskId}: Cache hit (${duration.toFixed(2)}ms)`);
        return cached.result;
      }
    }

    // Execute task
    return new Promise((resolve, reject) => {
      const taskInfo = {
        id: taskId,
        task,
        resolve: (result) => {
          const duration = performance.now() - startTime;
          this.monitor.recordExecution(duration, false);

          // Cache result
          if (this.enableCache) {
            this.cacheResult(task, result);
          }

          console.log(`Task ${taskId}: Completed (${duration.toFixed(2)}ms)`);
          resolve(result);
        },
        reject: (error) => {
          const duration = performance.now() - startTime;
          this.monitor.recordExecution(duration, false, true);
          reject(error);
        },
        startTime
      };

      const worker = this.getAvailableWorker();

      if (worker) {
        this.assignTask(worker, taskInfo);
      } else {
        this.queue.push(taskInfo);
      }
    });
  }

  /**
   * Get available worker
   */
  getAvailableWorker() {
    // Find least busy worker
    const available = this.workers.filter(w => w.available && w.worker.connected);

    if (available.length === 0) return null;

    // Return worker with least tasks processed
    return available.reduce((min, w) =>
      w.tasksProcessed < min.tasksProcessed ? w : min
    );
  }

  /**
   * Assign task to worker
   */
  assignTask(workerInfo, taskInfo) {
    workerInfo.available = false;
    workerInfo.currentTask = taskInfo;
    workerInfo.taskStartTime = performance.now();

    workerInfo.worker.send({
      type: 'task',
      taskId: taskInfo.id,
      data: taskInfo.task
    });
  }

  /**
   * Handle task completion
   */
  handleTaskComplete(workerInfo, msg) {
    if (!workerInfo.currentTask) return;

    const processingTime = performance.now() - workerInfo.taskStartTime;

    workerInfo.tasksProcessed++;
    workerInfo.totalProcessingTime += processingTime;
    workerInfo.currentTask.resolve(msg.result);
    workerInfo.currentTask = null;
    workerInfo.available = true;

    // Process queue
    if (this.queue.length > 0) {
      const nextTask = this.queue.shift();
      this.assignTask(workerInfo, nextTask);
    }
  }

  /**
   * Generate cache key
   */
  getCacheKey(task) {
    return JSON.stringify(task);
  }

  /**
   * Cache result
   */
  cacheResult(task, result) {
    const key = this.getCacheKey(task);

    // Implement LRU eviction
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Check if cache entry is expired
   */
  isCacheExpired(entry) {
    return Date.now() - entry.timestamp > this.cacheMaxAge;
  }

  /**
   * Start cache cleanup
   */
  startCacheCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete = [];

      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.cacheMaxAge) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.cache.delete(key));

      if (keysToDelete.length > 0) {
        console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const workerStats = this.workers.map(w => ({
      id: w.id,
      tasksProcessed: w.tasksProcessed,
      avgProcessingTime: w.tasksProcessed > 0
        ? (w.totalProcessingTime / w.tasksProcessed).toFixed(2)
        : 0,
      uptime: Date.now() - w.createdAt,
      available: w.available
    }));

    return {
      poolSize: this.poolSize,
      activeWorkers: this.workers.length,
      queueSize: this.queue.length,
      cacheSize: this.cache.size,
      cacheMaxSize: this.cacheMaxSize,
      performance: this.monitor.getStats(),
      workers: workerStats
    };
  }

  /**
   * Shutdown pool
   */
  async shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    for (const workerInfo of this.workers) {
      workerInfo.worker.kill();
    }

    this.workers = [];
    this.cache.clear();
  }
}

/**
 * ResourceMonitor - Monitor system resource usage
 */
class ResourceMonitor {
  constructor() {
    this.samples = [];
  }

  /**
   * Take a snapshot of current resource usage
   */
  snapshot() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const sample = {
      timestamp: Date.now(),
      memory: {
        rss: (memUsage.rss / 1024 / 1024).toFixed(2),
        heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
        heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
        external: (memUsage.external / 1024 / 1024).toFixed(2)
      },
      cpu: {
        user: (cpuUsage.user / 1000).toFixed(2),
        system: (cpuUsage.system / 1000).toFixed(2)
      }
    };

    this.samples.push(sample);

    // Keep only last 60 samples
    if (this.samples.length > 60) {
      this.samples.shift();
    }

    return sample;
  }

  /**
   * Get resource statistics
   */
  getStats() {
    if (this.samples.length === 0) return null;

    const latest = this.samples[this.samples.length - 1];
    const first = this.samples[0];

    return {
      current: latest,
      trend: {
        memoryGrowth: (parseFloat(latest.memory.heapUsed) - parseFloat(first.memory.heapUsed)).toFixed(2),
        cpuTime: (parseFloat(latest.cpu.user) - parseFloat(first.cpu.user)).toFixed(2)
      },
      samples: this.samples.length
    };
  }
}

/**
 * Demo
 */
async function demo() {
  const fs = require('fs');
  const path = require('path');

  // Create worker
  const workerCode = `
let taskCount = 0;

process.on('message', (msg) => {
  if (msg.type === 'task') {
    taskCount++;
    const { taskId, data } = msg;

    // Simulate processing
    const processingTime = data.complexity || 100;

    setTimeout(() => {
      const result = {
        input: data.value,
        output: data.value * 2,
        processedBy: process.pid,
        taskNumber: taskCount
      };

      process.send({
        type: 'task_complete',
        taskId,
        result
      });
    }, processingTime);
  }
});
`;

  const workerPath = path.join(__dirname, 'temp-perf-worker.js');
  fs.writeFileSync(workerPath, workerCode);

  // Create optimized pool
  const pool = new OptimizedProcessPool({
    workerPath,
    poolSize: 4,
    enableCache: true,
    cacheMaxSize: 50,
    cacheMaxAge: 30000
  });

  await pool.init();

  // Create resource monitor
  const resourceMonitor = new ResourceMonitor();

  // Start monitoring
  const monitorInterval = setInterval(() => {
    resourceMonitor.snapshot();
  }, 1000);

  console.log('--- Performance Test 1: Without Cache ---\n');

  // Execute tasks without cache benefit
  const tasks1 = [];
  for (let i = 1; i <= 20; i++) {
    tasks1.push(
      pool.execute({
        value: i,
        complexity: Math.random() * 100 + 50,
        unique: Math.random() // Makes each task unique
      })
    );
  }

  await Promise.all(tasks1);

  console.log('\n--- Performance Test 2: With Cache ---\n');

  // Execute same tasks (should hit cache)
  const tasks2 = [];
  for (let i = 1; i <= 20; i++) {
    tasks2.push(
      pool.execute({
        value: i,
        complexity: 100
      })
    );
  }

  await Promise.all(tasks2);

  // Execute cached tasks again
  const tasks3 = [];
  for (let i = 1; i <= 20; i++) {
    tasks3.push(
      pool.execute({
        value: i,
        complexity: 100
      })
    );
  }

  await Promise.all(tasks3);

  console.log('\n--- Performance Statistics ---\n');

  const stats = pool.getStats();

  console.log('Pool Stats:');
  console.log(`  Pool Size: ${stats.poolSize}`);
  console.log(`  Active Workers: ${stats.activeWorkers}`);
  console.log(`  Queue Size: ${stats.queueSize}`);
  console.log(`  Cache Size: ${stats.cacheSize}/${stats.cacheMaxSize}`);

  console.log('\nPerformance Metrics:');
  console.log(`  Total Executions: ${stats.performance.executions}`);
  console.log(`  Average Time: ${stats.performance.averageTime}ms`);
  console.log(`  Min Time: ${stats.performance.minTime}ms`);
  console.log(`  Max Time: ${stats.performance.maxTime}ms`);
  console.log(`  Cache Hit Rate: ${stats.performance.cacheHitRate}`);
  console.log(`  Errors: ${stats.performance.errors}`);

  console.log('\nWorker Distribution:');
  stats.workers.forEach(w => {
    console.log(`  Worker ${w.id}:`);
    console.log(`    Tasks Processed: ${w.tasksProcessed}`);
    console.log(`    Avg Processing Time: ${w.avgProcessingTime}ms`);
    console.log(`    Uptime: ${w.uptime}ms`);
  });

  console.log('\n--- Resource Usage ---\n');

  clearInterval(monitorInterval);
  const resourceStats = resourceMonitor.getStats();

  if (resourceStats) {
    console.log('Current Memory:');
    console.log(`  RSS: ${resourceStats.current.memory.rss} MB`);
    console.log(`  Heap Used: ${resourceStats.current.memory.heapUsed} MB`);
    console.log(`  Heap Total: ${resourceStats.current.memory.heapTotal} MB`);

    console.log('\nTrend:');
    console.log(`  Memory Growth: ${resourceStats.trend.memoryGrowth} MB`);
    console.log(`  CPU Time: ${resourceStats.trend.cpuTime} ms`);
  }

  // Cleanup
  await pool.shutdown();
  fs.unlinkSync(workerPath);

  console.log('\n=== Performance Optimization Tips ===\n');
  console.log('✓ Use process pooling to avoid spawn overhead');
  console.log('✓ Implement caching for repeated computations');
  console.log('✓ Monitor cache hit rates and adjust cache size');
  console.log('✓ Balance pool size with available CPU cores');
  console.log('✓ Distribute load evenly across workers');
  console.log('✓ Monitor memory usage and implement cleanup');
  console.log('✓ Use performance.now() for accurate timing');
  console.log('✓ Track metrics to identify bottlenecks');
  console.log('✓ Implement backpressure for queue management');
  console.log('✓ Consider worker specialization for different task types');

  console.log('\n=== Demo Complete ===');
}

// Run demo
if (require.main === module) {
  demo().catch(console.error);
}

module.exports = {
  OptimizedProcessPool,
  PerformanceMonitor,
  ResourceMonitor
};
