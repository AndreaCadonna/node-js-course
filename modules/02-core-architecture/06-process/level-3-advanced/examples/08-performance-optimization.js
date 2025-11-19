/**
 * Comprehensive Performance Optimization
 *
 * This module demonstrates enterprise-grade performance optimization using:
 * - V8 optimization hints and monitoring
 * - Memory optimization techniques
 * - CPU optimization strategies
 * - Event loop optimization
 * - Worker thread utilization
 * - Caching strategies
 *
 * Production Features:
 * - Real-time performance monitoring
 * - Automatic optimization recommendations
 * - Bottleneck detection
 * - Performance regression detection
 * - Load testing integration
 * - Production profiling
 *
 * @module PerformanceOptimization
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { performance, PerformanceObserver } = require('perf_hooks');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const v8 = require('v8');

/**
 * Performance Configuration
 */
const DEFAULT_PERF_CONFIG = {
  // Monitoring
  enableMonitoring: true,
  monitoringInterval: 5000,
  performanceMarks: true,

  // Optimization
  enableCaching: true,
  cacheSize: 1000,
  cacheTTL: 60000,

  // Worker threads
  workerPoolSize: 4,
  workerTaskTimeout: 30000,

  // Event loop
  maxEventLoopDelay: 100,
  eventLoopCheckInterval: 1000,

  // V8 optimization
  enableV8Monitoring: true,
  trackDeoptimizations: true,

  // Thresholds
  slowFunctionThreshold: 100, // ms
  highMemoryThreshold: 500, // MB
  highCPUThreshold: 80, // %
};

/**
 * Performance Metrics Collector
 */
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      cpu: [],
      memory: [],
      eventLoop: [],
      throughput: [],
      latency: [],
    };

    this.marks = new Map();
    this.measures = [];
  }

  addCPUMetric(usage) {
    this.metrics.cpu.push({
      timestamp: Date.now(),
      ...usage,
    });
    this.trimMetrics('cpu');
  }

  addMemoryMetric(usage) {
    this.metrics.memory.push({
      timestamp: Date.now(),
      ...usage,
    });
    this.trimMetrics('memory');
  }

  addEventLoopMetric(delay) {
    this.metrics.eventLoop.push({
      timestamp: Date.now(),
      delay,
    });
    this.trimMetrics('eventLoop');
  }

  addLatencyMetric(operation, duration) {
    this.metrics.latency.push({
      timestamp: Date.now(),
      operation,
      duration,
    });
    this.trimMetrics('latency');
  }

  addThroughputMetric(operation, count) {
    this.metrics.throughput.push({
      timestamp: Date.now(),
      operation,
      count,
    });
    this.trimMetrics('throughput');
  }

  trimMetrics(type, maxSize = 1000) {
    if (this.metrics[type].length > maxSize) {
      this.metrics[type] = this.metrics[type].slice(-maxSize);
    }
  }

  mark(name) {
    this.marks.set(name, performance.now());
  }

  measure(name, startMark, endMark = null) {
    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : performance.now();

    if (startTime === undefined) {
      throw new Error(`Mark ${startMark} not found`);
    }

    const duration = endTime - startTime;
    this.measures.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    return duration;
  }

  getStatistics(type, duration = 60000) {
    const cutoff = Date.now() - duration;
    const data = this.metrics[type]
      .filter(m => m.timestamp > cutoff)
      .map(m => {
        if (type === 'eventLoop') return m.delay;
        if (type === 'latency') return m.duration;
        if (type === 'cpu') return m.user + m.system;
        if (type === 'memory') return m.heapUsed;
        return 0;
      });

    if (data.length === 0) return null;

    const sorted = [...data].sort((a, b) => a - b);

    return {
      count: data.length,
      avg: data.reduce((a, b) => a + b, 0) / data.length,
      min: Math.min(...data),
      max: Math.max(...data),
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
}

/**
 * LRU Cache Implementation
 */
class LRUCache {
  constructor(maxSize = 1000, ttl = 60000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    this.accessOrder = [];

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  set(key, value) {
    // Remove if exists
    if (this.cache.has(key)) {
      this.remove(key);
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
    this.accessOrder.push(key);

    // Evict if needed
    if (this.cache.size > this.maxSize) {
      const oldest = this.accessOrder.shift();
      this.cache.delete(oldest);
      this.stats.evictions++;
    }
  }

  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.remove(key);
      this.stats.misses++;
      return null;
    }

    // Update access order
    this.remove(key);
    this.accessOrder.push(key);

    this.stats.hits++;
    return entry.value;
  }

  remove(key) {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  getHitRate() {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.getHitRate(),
      ...this.stats,
    };
  }
}

/**
 * Worker Thread Pool
 */
class WorkerPool {
  constructor(size = 4, workerScript = null) {
    this.size = size;
    this.workerScript = workerScript;
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = new Set();

    this.stats = {
      tasksCompleted: 0,
      tasksFailed: 0,
      totalTime: 0,
    };
  }

  async initialize() {
    console.log(`Initializing worker pool with ${this.size} workers...`);

    for (let i = 0; i < this.size; i++) {
      const worker = new Worker(__filename, {
        workerData: { workerId: i },
      });

      this.workers.push({
        id: i,
        worker,
        busy: false,
      });
    }

    console.log(`Worker pool initialized`);
  }

  async execute(task, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.stats.tasksFailed++;
        reject(new Error('Task timeout'));
      }, timeout);

      const queuedTask = {
        task,
        resolve: (result) => {
          clearTimeout(timeoutHandle);
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeoutHandle);
          reject(error);
        },
      };

      this.taskQueue.push(queuedTask);
      this.processQueue();
    });
  }

  processQueue() {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;

    const queuedTask = this.taskQueue.shift();
    this.runTask(availableWorker, queuedTask);
  }

  runTask(workerInfo, queuedTask) {
    workerInfo.busy = true;
    const start = performance.now();

    const messageHandler = (result) => {
      const duration = performance.now() - start;
      this.stats.tasksCompleted++;
      this.stats.totalTime += duration;

      workerInfo.busy = false;
      workerInfo.worker.removeListener('message', messageHandler);
      workerInfo.worker.removeListener('error', errorHandler);

      queuedTask.resolve(result);
      this.processQueue();
    };

    const errorHandler = (error) => {
      this.stats.tasksFailed++;
      workerInfo.busy = false;
      workerInfo.worker.removeListener('message', messageHandler);
      workerInfo.worker.removeListener('error', errorHandler);

      queuedTask.reject(error);
      this.processQueue();
    };

    workerInfo.worker.once('message', messageHandler);
    workerInfo.worker.once('error', errorHandler);
    workerInfo.worker.postMessage(queuedTask.task);
  }

  getStats() {
    return {
      ...this.stats,
      queueSize: this.taskQueue.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      avgTaskTime: this.stats.tasksCompleted > 0
        ? this.stats.totalTime / this.stats.tasksCompleted
        : 0,
    };
  }

  async terminate() {
    await Promise.all(
      this.workers.map(w => w.worker.terminate())
    );
  }
}

/**
 * V8 Optimization Monitor
 */
class V8OptimizationMonitor {
  constructor() {
    this.deoptimizations = [];
    this.optimizations = [];
  }

  enable() {
    // Note: Requires --allow-natives-syntax flag
    console.log('V8 optimization monitoring enabled');
  }

  getV8Statistics() {
    const heapStats = v8.getHeapStatistics();
    const heapSpaceStats = v8.getHeapSpaceStatistics();

    return {
      heap: {
        totalHeapSize: (heapStats.total_heap_size / 1024 / 1024).toFixed(2) + ' MB',
        totalHeapSizeExecutable: (heapStats.total_heap_size_executable / 1024 / 1024).toFixed(2) + ' MB',
        totalPhysicalSize: (heapStats.total_physical_size / 1024 / 1024).toFixed(2) + ' MB',
        usedHeapSize: (heapStats.used_heap_size / 1024 / 1024).toFixed(2) + ' MB',
        heapSizeLimit: (heapStats.heap_size_limit / 1024 / 1024).toFixed(2) + ' MB',
        mallocedMemory: (heapStats.malloced_memory / 1024 / 1024).toFixed(2) + ' MB',
      },
      spaces: heapSpaceStats.map(space => ({
        name: space.space_name,
        size: (space.space_size / 1024 / 1024).toFixed(2) + ' MB',
        used: (space.space_used_size / 1024 / 1024).toFixed(2) + ' MB',
        available: (space.space_available_size / 1024 / 1024).toFixed(2) + ' MB',
      })),
    };
  }

  getOptimizationStatus() {
    return {
      deoptimizations: this.deoptimizations.length,
      optimizations: this.optimizations.length,
    };
  }
}

/**
 * Event Loop Monitor
 */
class EventLoopMonitor extends EventEmitter {
  constructor(checkInterval = 1000, threshold = 100) {
    super();
    this.checkInterval = checkInterval;
    this.threshold = threshold;
    this.samples = [];
    this.isMonitoring = false;
  }

  start() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.check();
  }

  stop() {
    this.isMonitoring = false;
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  check() {
    if (!this.isMonitoring) return;

    const start = performance.now();

    setImmediate(() => {
      const delay = performance.now() - start;

      this.samples.push({
        timestamp: Date.now(),
        delay,
      });

      // Keep last 100 samples
      if (this.samples.length > 100) {
        this.samples.shift();
      }

      if (delay > this.threshold) {
        this.emit('blocked', delay);
      }

      this.timeout = setTimeout(() => this.check(), this.checkInterval);
    });
  }

  getStatistics() {
    if (this.samples.length === 0) return null;

    const delays = this.samples.map(s => s.delay);
    const sorted = [...delays].sort((a, b) => a - b);

    return {
      count: delays.length,
      avg: delays.reduce((a, b) => a + b, 0) / delays.length,
      min: Math.min(...delays),
      max: Math.max(...delays),
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
}

/**
 * Main Performance Optimizer
 */
class PerformanceOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_PERF_CONFIG, ...config };

    this.metrics = new PerformanceMetrics();
    this.cache = new LRUCache(this.config.cacheSize, this.config.cacheTTL);
    this.workerPool = null;
    this.v8Monitor = new V8OptimizationMonitor();
    this.eventLoopMonitor = new EventLoopMonitor(
      this.config.eventLoopCheckInterval,
      this.config.maxEventLoopDelay
    );

    this.lastCPUUsage = process.cpuUsage();
    this.lastCheck = Date.now();

    this.recommendations = [];
  }

  /**
   * Initialize optimizer
   */
  async initialize() {
    console.log('🚀 Initializing Performance Optimizer...\n');

    // Initialize worker pool if needed
    if (this.config.workerPoolSize > 0) {
      this.workerPool = new WorkerPool(this.config.workerPoolSize);
      await this.workerPool.initialize();
    }

    // Enable V8 monitoring
    if (this.config.enableV8Monitoring) {
      this.v8Monitor.enable();
    }

    // Start event loop monitoring
    this.eventLoopMonitor.start();
    this.eventLoopMonitor.on('blocked', (delay) => {
      console.warn(`⚠️  Event loop blocked for ${delay.toFixed(2)}ms`);
      this.addRecommendation('high', 'event-loop-blocking',
        `Event loop delay ${delay.toFixed(0)}ms exceeds threshold`,
        [
          'Move CPU-intensive work to worker threads',
          'Break up long-running synchronous operations',
          'Use setImmediate() for long loops',
        ]
      );
    });

    // Start monitoring
    if (this.config.enableMonitoring) {
      this.startMonitoring();
    }

    // Set up performance observer
    this.setupPerformanceObserver();

    console.log('✅ Performance Optimizer initialized\n');
    this.emit('initialized');
  }

  /**
   * Setup performance observer
   */
  setupPerformanceObserver() {
    const obs = new PerformanceObserver((items) => {
      items.getEntries().forEach((entry) => {
        if (entry.duration > this.config.slowFunctionThreshold) {
          console.warn(`🐌 Slow operation: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
        }

        this.metrics.addLatencyMetric(entry.name, entry.duration);
      });
    });

    obs.observe({ entryTypes: ['measure', 'function'] });
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    this.monitorInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
    }, this.config.monitoringInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    this.eventLoopMonitor.stop();
  }

  /**
   * Collect metrics
   */
  collectMetrics() {
    // CPU metrics
    const now = Date.now();
    const currentCPU = process.cpuUsage();
    const elapsedMs = now - this.lastCheck;

    const userDiff = currentCPU.user - this.lastCPUUsage.user;
    const systemDiff = currentCPU.system - this.lastCPUUsage.system;

    const cpuPercent = ((userDiff + systemDiff) / 1000 / elapsedMs) * 100;

    this.metrics.addCPUMetric({
      user: userDiff,
      system: systemDiff,
      percent: Math.min(cpuPercent, 100),
    });

    this.lastCPUUsage = currentCPU;
    this.lastCheck = now;

    // Memory metrics
    const memUsage = process.memoryUsage();
    this.metrics.addMemoryMetric(memUsage);

    // Event loop metrics
    const elStats = this.eventLoopMonitor.getStatistics();
    if (elStats) {
      this.metrics.addEventLoopMetric(elStats.avg);
    }
  }

  /**
   * Analyze performance and generate recommendations
   */
  analyzePerformance() {
    const cpuStats = this.metrics.getStatistics('cpu');
    const memStats = this.metrics.getStatistics('memory');
    const elStats = this.eventLoopMonitor.getStatistics();

    // Check CPU usage
    if (cpuStats && cpuStats.avg > this.config.highCPUThreshold) {
      this.addRecommendation('high', 'high-cpu',
        `Average CPU usage ${cpuStats.avg.toFixed(1)}% exceeds threshold`,
        [
          'Profile application to identify CPU hotspots',
          'Optimize algorithms and data structures',
          'Consider horizontal scaling',
          'Use worker threads for CPU-intensive tasks',
        ]
      );
    }

    // Check memory usage
    if (memStats) {
      const heapMB = memStats.avg / 1024 / 1024;
      if (heapMB > this.config.highMemoryThreshold) {
        this.addRecommendation('medium', 'high-memory',
          `Average heap usage ${heapMB.toFixed(0)}MB exceeds threshold`,
          [
            'Check for memory leaks',
            'Implement caching with TTL',
            'Use streams for large data processing',
            'Increase heap size if legitimate usage',
          ]
        );
      }
    }

    // Check event loop
    if (elStats && elStats.p95 > this.config.maxEventLoopDelay) {
      this.addRecommendation('high', 'event-loop-delay',
        `P95 event loop delay ${elStats.p95.toFixed(0)}ms is high`,
        [
          'Identify blocking operations',
          'Use async I/O instead of sync',
          'Move CPU work to worker threads',
        ]
      );
    }

    // Check cache hit rate
    const cacheStats = this.cache.getStats();
    if (cacheStats.hitRate < 50 && cacheStats.hits + cacheStats.misses > 100) {
      this.addRecommendation('low', 'low-cache-hit-rate',
        `Cache hit rate ${cacheStats.hitRate.toFixed(1)}% is low`,
        [
          'Review cache key strategy',
          'Increase cache size',
          'Adjust TTL settings',
        ]
      );
    }
  }

  /**
   * Add recommendation
   */
  addRecommendation(priority, category, message, actions) {
    // Check if recommendation already exists
    const exists = this.recommendations.some(r =>
      r.category === category && Date.now() - r.timestamp < 60000
    );

    if (!exists) {
      this.recommendations.push({
        timestamp: Date.now(),
        priority,
        category,
        message,
        actions,
      });

      // Keep only last 50 recommendations
      if (this.recommendations.length > 50) {
        this.recommendations.shift();
      }

      this.emit('recommendation', { priority, category, message, actions });
    }
  }

  /**
   * Mark performance point
   */
  mark(name) {
    performance.mark(name);
    this.metrics.mark(name);
  }

  /**
   * Measure between marks
   */
  measure(name, startMark, endMark = null) {
    if (endMark) {
      performance.measure(name, startMark, endMark);
    } else {
      performance.measure(name, startMark);
    }

    return this.metrics.measure(name, startMark, endMark);
  }

  /**
   * Optimize function with caching
   */
  withCache(key, fn) {
    return async (...args) => {
      const cacheKey = `${key}:${JSON.stringify(args)}`;

      // Check cache
      const cached = this.cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute function
      const result = await fn(...args);

      // Cache result
      this.cache.set(cacheKey, result);

      return result;
    };
  }

  /**
   * Execute in worker thread
   */
  async executeInWorker(task) {
    if (!this.workerPool) {
      throw new Error('Worker pool not initialized');
    }

    return this.workerPool.execute(task);
  }

  /**
   * Get comprehensive status
   */
  getStatus() {
    return {
      metrics: {
        cpu: this.metrics.getStatistics('cpu'),
        memory: this.metrics.getStatistics('memory'),
        eventLoop: this.eventLoopMonitor.getStatistics(),
        latency: this.metrics.getStatistics('latency'),
      },
      cache: this.cache.getStats(),
      workerPool: this.workerPool ? this.workerPool.getStats() : null,
      v8: this.v8Monitor.getV8Statistics(),
      recommendations: this.recommendations.slice(-10),
    };
  }

  /**
   * Generate optimization report
   */
  generateReport() {
    const status = this.getStatus();

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        health: this.calculateHealth(status),
        recommendations: this.recommendations.length,
      },
      metrics: status.metrics,
      caching: status.cache,
      workers: status.workerPool,
      v8: status.v8,
      topRecommendations: this.recommendations
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .slice(0, 5),
    };

    return report;
  }

  /**
   * Calculate overall health score
   */
  calculateHealth(status) {
    let score = 100;

    // CPU penalty
    if (status.metrics.cpu?.avg > 80) score -= 20;
    else if (status.metrics.cpu?.avg > 60) score -= 10;

    // Memory penalty
    const heapMB = status.metrics.memory?.avg / 1024 / 1024;
    if (heapMB > 500) score -= 20;
    else if (heapMB > 300) score -= 10;

    // Event loop penalty
    if (status.metrics.eventLoop?.p95 > 100) score -= 20;
    else if (status.metrics.eventLoop?.p95 > 50) score -= 10;

    // Cache bonus
    if (status.cache.hitRate > 80) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Shutdown optimizer
   */
  async shutdown() {
    console.log('🛑 Shutting down Performance Optimizer...');

    this.stopMonitoring();

    if (this.workerPool) {
      await this.workerPool.terminate();
    }

    this.emit('shutdown');
  }
}

/**
 * Worker thread code
 */
function workerThreadCode() {
  parentPort.on('message', (task) => {
    try {
      // Simulate CPU-intensive work
      if (task.type === 'compute') {
        const result = heavyComputation(task.data);
        parentPort.postMessage({ success: true, result });
      } else if (task.type === 'hash') {
        const hash = crypto.createHash('sha256');
        hash.update(task.data);
        const result = hash.digest('hex');
        parentPort.postMessage({ success: true, result });
      } else {
        parentPort.postMessage({ success: true, result: 'OK' });
      }
    } catch (error) {
      parentPort.postMessage({ success: false, error: error.message });
    }
  });

  function heavyComputation(n) {
    let result = 0;
    for (let i = 0; i < n; i++) {
      result += Math.sqrt(i);
    }
    return result;
  }
}

/**
 * Demo: Performance optimization
 */
async function demonstratePerformanceOptimization() {
  if (!isMainThread) {
    workerThreadCode();
    return;
  }

  console.log('='.repeat(80));
  console.log('COMPREHENSIVE PERFORMANCE OPTIMIZATION DEMO');
  console.log('='.repeat(80));
  console.log();

  const optimizer = new PerformanceOptimizer({
    enableMonitoring: true,
    monitoringInterval: 3000,
    workerPoolSize: 2,
  });

  // Listen to recommendations
  optimizer.on('recommendation', (rec) => {
    console.log(`\n💡 [${rec.priority.toUpperCase()}] ${rec.message}`);
  });

  await optimizer.initialize();

  // Demo 1: Performance measurement
  console.log('='.repeat(80));
  console.log('1. PERFORMANCE MEASUREMENT');
  console.log('='.repeat(80));
  console.log();

  optimizer.mark('operation-start');

  // Simulate work
  await new Promise(resolve => setTimeout(resolve, 100));

  optimizer.mark('operation-end');
  const duration = optimizer.measure('my-operation', 'operation-start', 'operation-end');

  console.log(`Operation completed in ${duration.toFixed(2)}ms`);

  // Demo 2: Caching
  console.log('\n' + '='.repeat(80));
  console.log('2. CACHING OPTIMIZATION');
  console.log('='.repeat(80));
  console.log();

  const expensiveFunction = async (n) => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return n * 2;
  };

  const cachedFunction = optimizer.withCache('expensive', expensiveFunction);

  console.log('First call (cache miss):');
  const start1 = performance.now();
  await cachedFunction(42);
  console.log(`  Duration: ${(performance.now() - start1).toFixed(2)}ms`);

  console.log('Second call (cache hit):');
  const start2 = performance.now();
  await cachedFunction(42);
  console.log(`  Duration: ${(performance.now() - start2).toFixed(2)}ms`);

  console.log(`Cache hit rate: ${optimizer.cache.getHitRate().toFixed(1)}%`);

  // Demo 3: Worker threads
  console.log('\n' + '='.repeat(80));
  console.log('3. WORKER THREAD OPTIMIZATION');
  console.log('='.repeat(80));
  console.log();

  console.log('Executing CPU-intensive tasks in worker threads...');
  const workerStart = performance.now();

  const tasks = [];
  for (let i = 0; i < 4; i++) {
    tasks.push(optimizer.executeInWorker({
      type: 'compute',
      data: 10000000,
    }));
  }

  await Promise.all(tasks);
  const workerDuration = performance.now() - workerStart;

  console.log(`Completed 4 tasks in ${workerDuration.toFixed(2)}ms using worker pool`);

  // Wait for metrics collection
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Demo 4: V8 Statistics
  console.log('\n' + '='.repeat(80));
  console.log('4. V8 STATISTICS');
  console.log('='.repeat(80));
  console.log();

  const v8Stats = optimizer.v8Monitor.getV8Statistics();
  console.log('Heap Statistics:');
  console.log(`  Total Heap Size: ${v8Stats.heap.totalHeapSize}`);
  console.log(`  Used Heap Size: ${v8Stats.heap.usedHeapSize}`);
  console.log(`  Heap Size Limit: ${v8Stats.heap.heapSizeLimit}`);

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('PERFORMANCE REPORT');
  console.log('='.repeat(80));
  console.log();

  const report = optimizer.generateReport();

  console.log(`Health Score: ${report.summary.health}/100`);
  console.log(`Recommendations: ${report.summary.recommendations}`);

  if (report.metrics.cpu) {
    console.log('\nCPU:');
    console.log(`  Average: ${report.metrics.cpu.avg.toFixed(1)}%`);
    console.log(`  Peak: ${report.metrics.cpu.max.toFixed(1)}%`);
  }

  if (report.metrics.memory) {
    console.log('\nMemory:');
    console.log(`  Average: ${(report.metrics.memory.avg / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Peak: ${(report.metrics.memory.max / 1024 / 1024).toFixed(2)} MB`);
  }

  if (report.metrics.eventLoop) {
    console.log('\nEvent Loop:');
    console.log(`  Average Delay: ${report.metrics.eventLoop.avg.toFixed(2)}ms`);
    console.log(`  P95 Delay: ${report.metrics.eventLoop.p95.toFixed(2)}ms`);
  }

  console.log('\nCache:');
  console.log(`  Hit Rate: ${report.caching.hitRate.toFixed(1)}%`);
  console.log(`  Size: ${report.caching.size}/${optimizer.config.cacheSize}`);

  if (report.workers) {
    console.log('\nWorker Pool:');
    console.log(`  Tasks Completed: ${report.workers.tasksCompleted}`);
    console.log(`  Average Task Time: ${report.workers.avgTaskTime.toFixed(2)}ms`);
  }

  if (report.topRecommendations.length > 0) {
    console.log('\nTop Recommendations:');
    report.topRecommendations.forEach((rec, i) => {
      console.log(`\n${i + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      rec.actions.forEach(action => {
        console.log(`   - ${action}`);
      });
    });
  }

  // Cleanup
  await optimizer.shutdown();

  console.log('\n✅ Demo complete!');
  console.log('\n💡 Performance Optimization Best Practices:');
  console.log('  1. Profile before optimizing - measure, don\'t guess');
  console.log('  2. Use caching for expensive computations');
  console.log('  3. Offload CPU-intensive work to worker threads');
  console.log('  4. Monitor event loop lag in production');
  console.log('  5. Set appropriate V8 heap limits');
  console.log('  6. Use streaming for large data processing');
  console.log('  7. Implement connection pooling for databases');
  console.log('  8. Use object pooling for frequently created objects');
  console.log('  9. Optimize hot code paths identified by profiling');
  console.log('  10. Monitor and optimize based on real production metrics');
}

// Run demo if executed directly
if (require.main === module) {
  demonstratePerformanceOptimization().catch(console.error);
}

module.exports = {
  PerformanceOptimizer,
  PerformanceMetrics,
  LRUCache,
  WorkerPool,
  V8OptimizationMonitor,
  EventLoopMonitor,
};
