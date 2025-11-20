/**
 * Task Model
 * Represents a single task in the queue with metadata and state management
 */

const crypto = require('crypto');

class Task {
  static STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    RETRYING: 'retrying'
  };

  constructor(data, options = {}) {
    this.id = options.id || crypto.randomUUID();
    this.type = data.type;
    this.payload = data.payload || {};
    this.priority = data.priority || 0; // Higher number = higher priority
    this.status = Task.STATUS.PENDING;
    this.attempts = 0;
    this.maxAttempts = data.maxAttempts || 3;
    this.timeout = data.timeout || 30000; // 30 seconds default
    this.createdAt = options.createdAt || Date.now();
    this.updatedAt = Date.now();
    this.startedAt = null;
    this.completedAt = null;
    this.error = null;
    this.result = null;
    this.progress = 0;
    this.workerId = null;

    // Retry configuration
    this.retryDelay = data.retryDelay || 1000; // 1 second base delay
    this.retryBackoff = data.retryBackoff || 'exponential'; // exponential or linear
  }

  /**
   * Mark task as started
   */
  start(workerId) {
    this.status = Task.STATUS.PROCESSING;
    this.startedAt = Date.now();
    this.updatedAt = Date.now();
    this.attempts += 1;
    this.workerId = workerId;
    this.error = null;
  }

  /**
   * Update task progress (0-100)
   */
  updateProgress(progress) {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    this.progress = progress;
    this.updatedAt = Date.now();
  }

  /**
   * Mark task as completed
   */
  complete(result) {
    this.status = Task.STATUS.COMPLETED;
    this.completedAt = Date.now();
    this.updatedAt = Date.now();
    this.result = result;
    this.progress = 100;
  }

  /**
   * Mark task as failed
   */
  fail(error) {
    this.error = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    };
    this.updatedAt = Date.now();

    if (this.canRetry()) {
      this.status = Task.STATUS.RETRYING;
    } else {
      this.status = Task.STATUS.FAILED;
      this.completedAt = Date.now();
    }
  }

  /**
   * Check if task can be retried
   */
  canRetry() {
    return this.attempts < this.maxAttempts;
  }

  /**
   * Calculate next retry delay with backoff
   */
  getRetryDelay() {
    if (this.retryBackoff === 'exponential') {
      return this.retryDelay * Math.pow(2, this.attempts - 1);
    } else {
      return this.retryDelay * this.attempts;
    }
  }

  /**
   * Check if task has timed out
   */
  hasTimedOut() {
    if (!this.startedAt || this.status !== Task.STATUS.PROCESSING) {
      return false;
    }
    return Date.now() - this.startedAt > this.timeout;
  }

  /**
   * Get task execution duration in milliseconds
   */
  getExecutionTime() {
    if (!this.startedAt) return 0;
    const endTime = this.completedAt || Date.now();
    return endTime - this.startedAt;
  }

  /**
   * Get task waiting time in queue
   */
  getWaitingTime() {
    const startTime = this.startedAt || Date.now();
    return startTime - this.createdAt;
  }

  /**
   * Serialize task for storage
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      priority: this.priority,
      status: this.status,
      attempts: this.attempts,
      maxAttempts: this.maxAttempts,
      timeout: this.timeout,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      error: this.error,
      result: this.result,
      progress: this.progress,
      workerId: this.workerId,
      retryDelay: this.retryDelay,
      retryBackoff: this.retryBackoff
    };
  }

  /**
   * Create task from stored JSON
   */
  static fromJSON(json) {
    const task = new Task(
      {
        type: json.type,
        payload: json.payload,
        priority: json.priority,
        maxAttempts: json.maxAttempts,
        timeout: json.timeout,
        retryDelay: json.retryDelay,
        retryBackoff: json.retryBackoff
      },
      {
        id: json.id,
        createdAt: json.createdAt
      }
    );

    task.status = json.status;
    task.attempts = json.attempts;
    task.updatedAt = json.updatedAt;
    task.startedAt = json.startedAt;
    task.completedAt = json.completedAt;
    task.error = json.error;
    task.result = json.result;
    task.progress = json.progress;
    task.workerId = json.workerId;

    return task;
  }
}

module.exports = Task;
