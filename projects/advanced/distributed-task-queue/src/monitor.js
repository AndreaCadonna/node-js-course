/**
 * Monitor
 * System monitoring and observability for task queue
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');

class Monitor extends EventEmitter {
  constructor(taskQueue, options = {}) {
    super();

    this.taskQueue = taskQueue;
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    this.metricsInterval = options.metricsInterval || 10000; // 10 seconds
    this.alertThresholds = options.alertThresholds || {
      queueSize: 1000,
      failureRate: 0.1, // 10%
      avgExecutionTime: 60000, // 1 minute
      workerUtilization: 0.9 // 90%
    };

    this.metrics = {
      timestamp: [],
      queueSize: [],
      pendingTasks: [],
      processingTasks: [],
      completedTasks: [],
      failedTasks: [],
      workerUtilization: [],
      avgExecutionTime: [],
      avgWaitingTime: [],
      throughput: [] // Tasks completed per minute
    };

    this.alerts = [];
    this.metricsTimer = null;
    this.logStream = null;
    this.metricsStream = null;

    this.lastStats = {
      completedTasks: 0,
      timestamp: Date.now()
    };
  }

  /**
   * Start monitoring
   */
  async start() {
    // Create log directory
    await fs.promises.mkdir(this.logDir, { recursive: true });

    // Open log streams
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logStream = createWriteStream(
      path.join(this.logDir, `queue-${timestamp}.log`),
      { flags: 'a' }
    );
    this.metricsStream = createWriteStream(
      path.join(this.logDir, `metrics-${timestamp}.jsonl`),
      { flags: 'a' }
    );

    // Setup event listeners
    this.setupEventListeners();

    // Start metrics collection
    this.startMetricsCollection();

    this.log('info', 'Monitor started');
    this.emit('started');
  }

  /**
   * Setup event listeners for task queue
   */
  setupEventListeners() {
    this.taskQueue.on('task:added', (task) => {
      this.log('info', `Task added: ${task.id} (${task.type})`);
    });

    this.taskQueue.on('task:started', (task) => {
      this.log('info', `Task started: ${task.id} (worker: ${task.workerId})`);
    });

    this.taskQueue.on('task:completed', (task) => {
      this.log('info', `Task completed: ${task.id} (${task.getExecutionTime()}ms)`);
    });

    this.taskQueue.on('task:failed', (data) => {
      this.log('error', `Task failed: ${data.task.id} (attempts: ${data.task.attempts}/${data.task.maxAttempts})`, {
        error: data.task.error,
        willRetry: data.willRetry
      });

      if (!data.willRetry) {
        this.createAlert('task_failed', `Task ${data.task.id} failed permanently`, data.task);
      }
    });

    this.taskQueue.on('task:retry', (task) => {
      this.log('warn', `Task retry: ${task.id} (attempt ${task.attempts}/${task.maxAttempts})`);
    });

    this.taskQueue.on('task:timeout', (task) => {
      this.log('error', `Task timeout: ${task.id}`);
      this.createAlert('task_timeout', `Task ${task.id} timed out`, task);
    });

    this.taskQueue.on('worker:error', (data) => {
      this.log('error', `Worker error: ${data.workerId}`, { error: data.error });
      this.createAlert('worker_error', `Worker ${data.workerId} encountered an error`, data);
    });

    this.taskQueue.on('worker:exit', (data) => {
      if (data.code !== 0) {
        this.log('error', `Worker exited: ${data.workerId} (code: ${data.code})`);
        this.createAlert('worker_exit', `Worker ${data.workerId} exited unexpectedly`, data);
      }
    });

    this.taskQueue.on('error', (error) => {
      this.log('error', 'Task queue error', { error });
      this.createAlert('queue_error', 'Task queue error', { error: error.message });
    });
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    this.metricsTimer = setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
    }, this.metricsInterval);
  }

  /**
   * Collect metrics
   */
  collectMetrics() {
    const stats = this.taskQueue.getStats();
    const timestamp = Date.now();

    // Calculate throughput (tasks per minute)
    const timeDiff = (timestamp - this.lastStats.timestamp) / 1000 / 60; // minutes
    const completedDiff = stats.queue.byStatus.completed - this.lastStats.completedTasks;
    const throughput = timeDiff > 0 ? Math.round(completedDiff / timeDiff) : 0;

    // Calculate worker utilization
    const workerUtilization = stats.workers.poolSize > 0
      ? stats.workers.busyWorkers / stats.workers.poolSize
      : 0;

    // Store metrics
    this.metrics.timestamp.push(timestamp);
    this.metrics.queueSize.push(stats.queue.total);
    this.metrics.pendingTasks.push(stats.queue.byStatus.pending);
    this.metrics.processingTasks.push(stats.queue.byStatus.processing);
    this.metrics.completedTasks.push(stats.queue.byStatus.completed);
    this.metrics.failedTasks.push(stats.queue.byStatus.failed);
    this.metrics.workerUtilization.push(workerUtilization);
    this.metrics.avgExecutionTime.push(stats.queue.avgExecutionTime);
    this.metrics.avgWaitingTime.push(stats.queue.avgWaitingTime);
    this.metrics.throughput.push(throughput);

    // Keep only last 1000 data points
    const maxDataPoints = 1000;
    for (const key in this.metrics) {
      if (this.metrics[key].length > maxDataPoints) {
        this.metrics[key] = this.metrics[key].slice(-maxDataPoints);
      }
    }

    // Update last stats
    this.lastStats.completedTasks = stats.queue.byStatus.completed;
    this.lastStats.timestamp = timestamp;

    // Write metrics to file
    const metricsData = {
      timestamp,
      queue: stats.queue,
      workers: {
        poolSize: stats.workers.poolSize,
        available: stats.workers.availableWorkers,
        busy: stats.workers.busyWorkers,
        utilization: workerUtilization
      },
      performance: {
        avgExecutionTime: stats.queue.avgExecutionTime,
        avgWaitingTime: stats.queue.avgWaitingTime,
        throughput
      }
    };

    if (this.metricsStream) {
      this.metricsStream.write(JSON.stringify(metricsData) + '\n');
    }

    this.emit('metrics:collected', metricsData);
  }

  /**
   * Check alert thresholds
   */
  checkThresholds() {
    const stats = this.taskQueue.getStats();

    // Check queue size
    if (stats.queue.total > this.alertThresholds.queueSize) {
      this.createAlert(
        'high_queue_size',
        `Queue size (${stats.queue.total}) exceeds threshold (${this.alertThresholds.queueSize})`,
        { queueSize: stats.queue.total }
      );
    }

    // Check failure rate
    const totalProcessed = stats.queue.byStatus.completed + stats.queue.byStatus.failed;
    if (totalProcessed > 0) {
      const failureRate = stats.queue.byStatus.failed / totalProcessed;
      if (failureRate > this.alertThresholds.failureRate) {
        this.createAlert(
          'high_failure_rate',
          `Failure rate (${(failureRate * 100).toFixed(2)}%) exceeds threshold (${(this.alertThresholds.failureRate * 100).toFixed(2)}%)`,
          { failureRate, failed: stats.queue.byStatus.failed, total: totalProcessed }
        );
      }
    }

    // Check average execution time
    if (stats.queue.avgExecutionTime > this.alertThresholds.avgExecutionTime) {
      this.createAlert(
        'high_execution_time',
        `Average execution time (${stats.queue.avgExecutionTime}ms) exceeds threshold (${this.alertThresholds.avgExecutionTime}ms)`,
        { avgExecutionTime: stats.queue.avgExecutionTime }
      );
    }

    // Check worker utilization
    const workerUtilization = stats.workers.poolSize > 0
      ? stats.workers.busyWorkers / stats.workers.poolSize
      : 0;

    if (workerUtilization > this.alertThresholds.workerUtilization) {
      this.createAlert(
        'high_worker_utilization',
        `Worker utilization (${(workerUtilization * 100).toFixed(2)}%) exceeds threshold (${(this.alertThresholds.workerUtilization * 100).toFixed(2)}%)`,
        { utilization: workerUtilization }
      );
    }
  }

  /**
   * Create alert
   */
  createAlert(type, message, data = {}) {
    const alert = {
      id: Date.now(),
      type,
      message,
      data,
      timestamp: Date.now()
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    this.log('alert', message, data);
    this.emit('alert', alert);
  }

  /**
   * Log message
   */
  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      pid: process.pid,
      ...data
    };

    const logLine = `[${entry.timestamp}] [${level.toUpperCase()}] ${message}`;

    // Write to console
    if (level === 'error' || level === 'alert') {
      console.error(logLine, data);
    } else if (level === 'warn') {
      console.warn(logLine, data);
    } else {
      console.log(logLine);
    }

    // Write to file
    if (this.logStream) {
      this.logStream.write(JSON.stringify(entry) + '\n');
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      summary: {
        avgThroughput: this.calculateAverage(this.metrics.throughput),
        avgWorkerUtilization: this.calculateAverage(this.metrics.workerUtilization),
        avgExecutionTime: this.calculateAverage(this.metrics.avgExecutionTime),
        avgWaitingTime: this.calculateAverage(this.metrics.avgWaitingTime)
      }
    };
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit = 50) {
    return this.alerts.slice(-limit);
  }

  /**
   * Calculate average
   */
  calculateAverage(arr) {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return Math.round(sum / arr.length);
  }

  /**
   * Generate report
   */
  generateReport() {
    const stats = this.taskQueue.getStats();
    const metrics = this.getMetrics();
    const alerts = this.getAlerts();

    return {
      timestamp: new Date().toISOString(),
      queue: stats.queue,
      workers: stats.workers,
      performance: metrics.summary,
      alerts: {
        total: alerts.length,
        recent: alerts.slice(-10)
      }
    };
  }

  /**
   * Stop monitoring
   */
  async stop() {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }

    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }

    if (this.metricsStream) {
      this.metricsStream.end();
      this.metricsStream = null;
    }

    this.log('info', 'Monitor stopped');
    this.emit('stopped');
  }
}

module.exports = Monitor;
