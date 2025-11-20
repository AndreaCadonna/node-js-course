/**
 * Solution 5: Distributed Processing System
 *
 * Complete distributed processing framework with map-reduce, load balancing,
 * fault tolerance, and pipeline processing.
 */

const { fork } = require('child_process');
const { EventEmitter } = require('events');

class DistributedProcessor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.workerCount = options.workerCount || 4;
    this.workerScript = options.workerScript;
    this.faultTolerance = options.faultTolerance !== false;
    this.maxTaskRetries = options.maxTaskRetries || 3;
    this.loadBalanceStrategy = options.loadBalanceStrategy || 'round-robin';

    this.workers = [];
    this.tasks = new Map();
    this.taskHandlers = new Map();
    this.taskIdCounter = 0;
    this.roundRobinIndex = 0;

    this.stats = {
      tasksSubmitted: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      tasksRetried: 0
    };
  }

  async initialize() {
    for (let i = 0; i < this.workerCount; i++) {
      await this.createWorker(i);
    }

    this.emit('ready');
  }

  async createWorker(id) {
    const worker = fork(this.workerScript);

    const workerInfo = {
      id,
      worker,
      busy: false,
      tasksProcessed: 0,
      currentTask: null
    };

    worker.on('message', (msg) => {
      this.handleWorkerMessage(workerInfo, msg);
    });

    worker.on('error', (error) => {
      console.error(`Worker ${id} error:`, error.message);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        this.handleWorkerFailure(workerInfo);
      }
    });

    this.workers.push(workerInfo);
    return workerInfo;
  }

  handleWorkerMessage(workerInfo, msg) {
    if (msg.type === 'task_result') {
      const task = this.tasks.get(msg.taskId);
      if (task) {
        this.stats.tasksCompleted++;
        task.resolve(msg.result);
        this.tasks.delete(msg.taskId);
        workerInfo.busy = false;
        workerInfo.currentTask = null;
        workerInfo.tasksProcessed++;
      }
    } else if (msg.type === 'task_error') {
      const task = this.tasks.get(msg.taskId);
      if (task) {
        this.handleTaskFailure(task, msg.error);
        workerInfo.busy = false;
        workerInfo.currentTask = null;
      }
    }
  }

  async handleWorkerFailure(workerInfo) {
    console.log(`Worker ${workerInfo.id} failed`);

    // Reassign current task
    if (workerInfo.currentTask) {
      const task = this.tasks.get(workerInfo.currentTask);
      if (task) {
        await this.submitTask(task.type, task.data);
      }
    }

    // Remove failed worker
    const index = this.workers.indexOf(workerInfo);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }

    // Restart worker
    if (this.faultTolerance) {
      await this.createWorker(workerInfo.id);
    }
  }

  async submitTask(taskType, taskData) {
    const taskId = ++this.taskIdCounter;
    this.stats.tasksSubmitted++;

    return new Promise((resolve, reject) => {
      const task = {
        id: taskId,
        type: taskType,
        data: taskData,
        resolve,
        reject,
        retries: 0
      };

      this.tasks.set(taskId, task);

      const worker = this.selectWorker(task);
      if (worker) {
        this.assignTask(worker, task);
      } else {
        reject(new Error('No available workers'));
      }
    });
  }

  selectWorker(task) {
    const available = this.workers.filter(w => !w.busy && w.worker.connected);
    if (available.length === 0) return null;

    switch (this.loadBalanceStrategy) {
      case 'round-robin':
        const worker = available[this.roundRobinIndex % available.length];
        this.roundRobinIndex++;
        return worker;

      case 'least-busy':
        return available.reduce((min, w) =>
          w.tasksProcessed < min.tasksProcessed ? w : min
        );

      case 'random':
        return available[Math.floor(Math.random() * available.length)];

      default:
        return available[0];
    }
  }

  assignTask(workerInfo, task) {
    workerInfo.busy = true;
    workerInfo.currentTask = task.id;

    workerInfo.worker.send({
      type: 'task',
      taskId: task.id,
      taskType: task.type,
      data: task.data
    });
  }

  async handleTaskFailure(task, error) {
    if (this.faultTolerance && task.retries < this.maxTaskRetries) {
      task.retries++;
      this.stats.tasksRetried++;

      const worker = this.selectWorker(task);
      if (worker) {
        this.assignTask(worker, task);
      } else {
        task.reject(new Error('No workers available for retry'));
        this.tasks.delete(task.id);
        this.stats.tasksFailed++;
      }
    } else {
      task.reject(new Error(error));
      this.tasks.delete(task.id);
      this.stats.tasksFailed++;
    }
  }

  async mapReduce(data, mapFn, reduceFn, initialValue) {
    console.log(`Map-Reduce: ${data.length} items`);

    // Map phase
    const mapped = await this.mapPhase(data, mapFn);

    // Reduce phase
    const result = await this.reducePhase(mapped, reduceFn, initialValue);

    return result;
  }

  async mapPhase(data, mapFn) {
    const tasks = data.map(item =>
      this.submitTask('map', { item, fn: mapFn.toString() })
    );

    return Promise.all(tasks);
  }

  async reducePhase(mappedData, reduceFn, initialValue) {
    // Partition data for parallel reduction
    const partitions = this.partitionData(mappedData, this.workerCount);

    // Parallel reduce
    const partialResults = await Promise.all(
      partitions.map(partition =>
        this.submitTask('reduce', { data: partition, fn: reduceFn.toString() })
      )
    );

    // Final reduction
    const fn = eval(`(${reduceFn.toString()})`);
    return partialResults.reduce(fn, initialValue);
  }

  async processBatch(tasks, batchSize = null) {
    const size = batchSize || this.workerCount * 2;
    const results = [];

    for (let i = 0; i < tasks.length; i += size) {
      const batch = tasks.slice(i, i + size);
      const batchResults = await Promise.all(
        batch.map(task => this.submitTask(task.type, task.data))
      );
      results.push(...batchResults);
    }

    return results;
  }

  async pipeline(data, stages) {
    let result = data;

    for (const stageFn of stages) {
      const mapped = await this.mapPhase(result, stageFn);
      result = mapped.filter(item => item !== null && item !== undefined);
    }

    return result;
  }

  partitionData(data, partitionCount) {
    const partitions = [];
    const partitionSize = Math.ceil(data.length / partitionCount);

    for (let i = 0; i < data.length; i += partitionSize) {
      partitions.push(data.slice(i, i + partitionSize));
    }

    return partitions;
  }

  getProgress() {
    const total = this.stats.tasksSubmitted;
    const completed = this.stats.tasksCompleted;
    const failed = this.stats.tasksFailed;
    const inProgress = this.tasks.size;

    return {
      total,
      completed,
      failed,
      inProgress,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  getWorkerStats() {
    return this.workers.map(w => ({
      id: w.id,
      tasksProcessed: w.tasksProcessed,
      busy: w.busy,
      currentTask: w.currentTask
    }));
  }

  async shutdown() {
    for (const workerInfo of this.workers) {
      workerInfo.worker.kill();
    }
    this.workers = [];
  }
}

module.exports = { DistributedProcessor };

/* Complete implementation with all key features:
 * - Map-reduce pattern
 * - Multiple load balancing strategies
 * - Fault tolerance with task reassignment
 * - Batch and pipeline processing
 * - Progress tracking
 * - Worker statistics
 *
 * For production, add:
 * - More sophisticated scheduling
 * - Task dependencies (DAG)
 * - Better error handling
 * - Metrics and monitoring
 * - Data serialization optimization
 */
