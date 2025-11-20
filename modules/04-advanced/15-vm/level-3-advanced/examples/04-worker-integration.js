/**
 * Example 4: Worker Thread Integration
 *
 * This example demonstrates:
 * - VM execution in Worker Threads for true isolation
 * - Worker thread pools
 * - Secure message passing
 * - Thread-safe VM execution
 * - Resource management across threads
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const vm = require('vm');
const path = require('path');

console.log('=== VM Worker Thread Integration ===\n');

if (isMainThread) {
  // ============================================================================
  // Part 1: Basic Worker VM Execution
  // ============================================================================

  console.log('Part 1: Basic Worker VM Execution\n');

  /**
   * Execute VM code in a worker thread
   */
  function executeInWorker(code, sandbox = {}, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: {
          type: 'execute',
          code,
          sandbox,
          timeout
        }
      });

      const timer = setTimeout(() => {
        worker.terminate();
        reject(new Error('Worker timeout'));
      }, timeout + 1000);

      worker.on('message', (result) => {
        clearTimeout(timer);
        worker.terminate();
        resolve(result);
      });

      worker.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      worker.on('exit', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  // Test basic worker execution
  (async () => {
    console.log('Testing basic worker execution:');

    try {
      const result = await executeInWorker(
        'Math.pow(2, 10) + Math.sqrt(144)',
        {},
        3000
      );
      console.log('  Result:', result);
    } catch (err) {
      console.log('  Error:', err.message);
    }

    // Test with sandbox data
    console.log('\nTesting with sandbox data:');
    try {
      const result = await executeInWorker(
        'x * y + z',
        { x: 10, y: 20, z: 30 },
        3000
      );
      console.log('  Result:', result);
    } catch (err) {
      console.log('  Error:', err.message);
    }

    // Test timeout
    console.log('\nTesting timeout protection:');
    try {
      await executeInWorker(
        'while(true) {}',
        {},
        1000
      );
    } catch (err) {
      console.log('  ✓ Timeout caught:', err.message);
    }

    // ========================================================================
    // Part 2: Worker Thread Pool
    // ========================================================================

    console.log('\n\nPart 2: Worker Thread Pool\n');

    /**
     * Worker thread pool for VM execution
     */
    class WorkerPool {
      constructor(options = {}) {
        this.options = {
          maxWorkers: options.maxWorkers || 4,
          maxQueueSize: options.maxQueueSize || 100,
          workerTimeout: options.workerTimeout || 30000,
          ...options
        };

        this.workers = [];
        this.availableWorkers = [];
        this.queue = [];
        this.stats = {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          timeouts: 0
        };
      }

      /**
       * Initialize worker pool
       */
      initialize() {
        for (let i = 0; i < this.options.maxWorkers; i++) {
          const worker = this.createWorker(i);
          this.workers.push(worker);
          this.availableWorkers.push(worker);
        }
      }

      /**
       * Create a worker
       */
      createWorker(id) {
        const worker = new Worker(__filename, {
          workerData: { type: 'pool', workerId: id }
        });

        worker.workerId = id;
        worker.busy = false;
        worker.currentTask = null;

        return worker;
      }

      /**
       * Execute code using pool
       */
      async execute(code, sandbox = {}, timeout = 5000) {
        if (this.queue.length >= this.options.maxQueueSize) {
          throw new Error('Queue is full');
        }

        return new Promise((resolve, reject) => {
          const task = {
            code,
            sandbox,
            timeout,
            resolve,
            reject,
            startTime: Date.now()
          };

          this.queue.push(task);
          this.processQueue();
        });
      }

      /**
       * Process task queue
       */
      async processQueue() {
        while (this.queue.length > 0 && this.availableWorkers.length > 0) {
          const task = this.queue.shift();
          const worker = this.availableWorkers.shift();

          this.executeTask(worker, task);
        }
      }

      /**
       * Execute task in worker
       */
      executeTask(worker, task) {
        worker.busy = true;
        worker.currentTask = task;

        const timer = setTimeout(() => {
          worker.terminate();
          this.handleWorkerFailure(worker, task, 'Timeout');
        }, task.timeout + 1000);

        const messageHandler = (result) => {
          clearTimeout(timer);
          worker.removeListener('message', messageHandler);
          worker.removeListener('error', errorHandler);

          worker.busy = false;
          worker.currentTask = null;
          this.availableWorkers.push(worker);

          if (result.success) {
            this.stats.successfulExecutions++;
            task.resolve(result);
          } else {
            this.stats.failedExecutions++;
            task.reject(new Error(result.error));
          }

          this.stats.totalExecutions++;
          this.processQueue();
        };

        const errorHandler = (err) => {
          clearTimeout(timer);
          worker.removeListener('message', messageHandler);
          worker.removeListener('error', errorHandler);

          this.handleWorkerFailure(worker, task, err.message);
        };

        worker.on('message', messageHandler);
        worker.on('error', errorHandler);

        worker.postMessage({
          action: 'execute',
          code: task.code,
          sandbox: task.sandbox,
          timeout: task.timeout
        });
      }

      /**
       * Handle worker failure
       */
      handleWorkerFailure(worker, task, reason) {
        this.stats.failedExecutions++;
        this.stats.timeouts++;
        task.reject(new Error(`Worker failed: ${reason}`));

        // Replace failed worker
        const index = this.workers.indexOf(worker);
        if (index !== -1) {
          const newWorker = this.createWorker(worker.workerId);
          this.workers[index] = newWorker;
          this.availableWorkers.push(newWorker);
        }

        this.stats.totalExecutions++;
        this.processQueue();
      }

      /**
       * Get pool statistics
       */
      getStats() {
        return {
          workers: this.workers.length,
          available: this.availableWorkers.length,
          busy: this.workers.length - this.availableWorkers.length,
          queued: this.queue.length,
          ...this.stats,
          successRate: this.stats.totalExecutions > 0
            ? ((this.stats.successfulExecutions / this.stats.totalExecutions) * 100).toFixed(2) + '%'
            : '0%'
        };
      }

      /**
       * Shutdown pool
       */
      async shutdown() {
        for (const worker of this.workers) {
          await worker.terminate();
        }
        this.workers = [];
        this.availableWorkers = [];
        this.queue = [];
      }
    }

    // Test worker pool
    console.log('Testing worker pool:');
    const pool = new WorkerPool({
      maxWorkers: 3,
      workerTimeout: 5000
    });

    pool.initialize();

    console.log('Executing multiple tasks...');
    const tasks = [];
    for (let i = 0; i < 10; i++) {
      tasks.push(
        pool.execute(
          `Math.pow(${i}, 2)`,
          {},
          2000
        )
      );
    }

    try {
      const results = await Promise.all(tasks);
      console.log('  Completed', results.length, 'tasks');
      console.log('  Sample results:', results.slice(0, 3).map(r => r.result));
    } catch (err) {
      console.log('  Error:', err.message);
    }

    console.log('\nPool statistics:');
    const stats = pool.getStats();
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    // ========================================================================
    // Part 3: Secure Inter-Thread Communication
    // ========================================================================

    console.log('\n\nPart 3: Secure Inter-Thread Communication\n');

    /**
     * Secure worker executor with message validation
     */
    class SecureWorkerExecutor {
      constructor(options = {}) {
        this.options = {
          maxMessageSize: options.maxMessageSize || 1024 * 1024, // 1MB
          allowedTypes: options.allowedTypes || ['string', 'number', 'boolean', 'object'],
          timeout: options.timeout || 5000,
          ...options
        };
      }

      /**
       * Validate message data
       */
      validateData(data) {
        const size = JSON.stringify(data).length;
        if (size > this.options.maxMessageSize) {
          throw new Error(`Message size ${size} exceeds limit ${this.options.maxMessageSize}`);
        }

        const validateValue = (value) => {
          const type = typeof value;
          if (!this.options.allowedTypes.includes(type)) {
            throw new Error(`Type ${type} not allowed`);
          }

          if (type === 'object' && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(validateValue);
            } else {
              Object.values(value).forEach(validateValue);
            }
          }
        };

        validateValue(data);
        return true;
      }

      /**
       * Execute with validated data
       */
      async execute(code, sandbox = {}) {
        // Validate code
        if (typeof code !== 'string') {
          throw new Error('Code must be a string');
        }

        if (code.length > 10000) {
          throw new Error('Code too long');
        }

        // Validate sandbox
        this.validateData(sandbox);

        return new Promise((resolve, reject) => {
          const worker = new Worker(__filename, {
            workerData: {
              type: 'execute',
              code,
              sandbox,
              timeout: this.options.timeout
            }
          });

          const timer = setTimeout(() => {
            worker.terminate();
            reject(new Error('Timeout'));
          }, this.options.timeout + 1000);

          worker.on('message', (result) => {
            clearTimeout(timer);
            worker.terminate();

            // Validate result
            try {
              this.validateData(result);
              resolve(result);
            } catch (err) {
              reject(new Error('Invalid result: ' + err.message));
            }
          });

          worker.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
          });
        });
      }
    }

    // Test secure executor
    console.log('Testing secure worker executor:');
    const secureExecutor = new SecureWorkerExecutor({
      maxMessageSize: 1000,
      timeout: 3000
    });

    try {
      const result = await secureExecutor.execute(
        'x + y',
        { x: 100, y: 200 }
      );
      console.log('  ✓ Execution successful:', result.result);
    } catch (err) {
      console.log('  Error:', err.message);
    }

    console.log('\nTesting message size limit:');
    try {
      await secureExecutor.execute(
        'x',
        { x: new Array(10000).fill('data') }
      );
    } catch (err) {
      console.log('  ✓ Size limit enforced:', err.message);
    }

    // ========================================================================
    // Part 4: Production Worker Manager
    // ========================================================================

    console.log('\n\nPart 4: Production Worker Manager\n');

    /**
     * Production-grade worker manager
     */
    class WorkerManager {
      constructor(options = {}) {
        this.options = {
          minWorkers: options.minWorkers || 2,
          maxWorkers: options.maxWorkers || 8,
          taskTimeout: options.taskTimeout || 5000,
          workerMaxAge: options.workerMaxAge || 60000, // 1 minute
          autoScale: options.autoScale !== false,
          ...options
        };

        this.workers = new Map();
        this.nextWorkerId = 0;
        this.queue = [];
        this.stats = {
          created: 0,
          terminated: 0,
          executed: 0,
          failed: 0
        };

        this.initialize();
      }

      /**
       * Initialize with minimum workers
       */
      initialize() {
        for (let i = 0; i < this.options.minWorkers; i++) {
          this.createWorker();
        }

        // Auto-scale monitoring
        if (this.options.autoScale) {
          this.startAutoScaling();
        }
      }

      /**
       * Create worker with metadata
       */
      createWorker() {
        const id = this.nextWorkerId++;
        const worker = new Worker(__filename, {
          workerData: { type: 'managed', workerId: id }
        });

        const workerMeta = {
          id,
          worker,
          busy: false,
          createdAt: Date.now(),
          executions: 0,
          lastUsed: Date.now()
        };

        this.workers.set(id, workerMeta);
        this.stats.created++;

        worker.on('error', (err) => {
          console.log(`  [Worker ${id}] Error:`, err.message);
          this.terminateWorker(id);
        });

        worker.on('exit', (code) => {
          if (code !== 0) {
            console.log(`  [Worker ${id}] Exited with code ${code}`);
          }
        });

        return workerMeta;
      }

      /**
       * Get available worker
       */
      getAvailableWorker() {
        for (const [id, meta] of this.workers) {
          if (!meta.busy) {
            return meta;
          }
        }

        // Create new worker if under max
        if (this.workers.size < this.options.maxWorkers) {
          return this.createWorker();
        }

        return null;
      }

      /**
       * Execute task
       */
      async execute(code, sandbox = {}, timeout) {
        return new Promise((resolve, reject) => {
          const task = { code, sandbox, timeout: timeout || this.options.taskTimeout, resolve, reject };

          const worker = this.getAvailableWorker();
          if (worker) {
            this.executeInWorker(worker, task);
          } else {
            this.queue.push(task);
          }
        });
      }

      /**
       * Execute in specific worker
       */
      executeInWorker(workerMeta, task) {
        workerMeta.busy = true;
        workerMeta.lastUsed = Date.now();

        const timer = setTimeout(() => {
          this.terminateWorker(workerMeta.id);
          task.reject(new Error('Timeout'));
          this.stats.failed++;
          this.processQueue();
        }, task.timeout + 1000);

        const messageHandler = (result) => {
          clearTimeout(timer);
          workerMeta.worker.removeListener('message', messageHandler);

          workerMeta.busy = false;
          workerMeta.executions++;
          workerMeta.lastUsed = Date.now();

          if (result.success) {
            task.resolve(result);
            this.stats.executed++;
          } else {
            task.reject(new Error(result.error));
            this.stats.failed++;
          }

          this.processQueue();
        };

        workerMeta.worker.on('message', messageHandler);
        workerMeta.worker.postMessage({
          action: 'execute',
          code: task.code,
          sandbox: task.sandbox,
          timeout: task.timeout
        });
      }

      /**
       * Process queued tasks
       */
      processQueue() {
        while (this.queue.length > 0) {
          const worker = this.getAvailableWorker();
          if (!worker) break;

          const task = this.queue.shift();
          this.executeInWorker(worker, task);
        }
      }

      /**
       * Terminate worker
       */
      async terminateWorker(id) {
        const workerMeta = this.workers.get(id);
        if (workerMeta) {
          await workerMeta.worker.terminate();
          this.workers.delete(id);
          this.stats.terminated++;
        }
      }

      /**
       * Auto-scaling logic
       */
      startAutoScaling() {
        this.scaleInterval = setInterval(() => {
          const now = Date.now();

          // Remove old idle workers
          for (const [id, meta] of this.workers) {
            if (!meta.busy &&
                this.workers.size > this.options.minWorkers &&
                now - meta.lastUsed > this.options.workerMaxAge) {
              this.terminateWorker(id);
            }
          }

          // Add workers if queue is building up
          if (this.queue.length > 5 && this.workers.size < this.options.maxWorkers) {
            this.createWorker();
          }
        }, 5000);
      }

      /**
       * Get statistics
       */
      getStats() {
        return {
          workers: this.workers.size,
          busy: Array.from(this.workers.values()).filter(w => w.busy).length,
          queued: this.queue.length,
          ...this.stats
        };
      }

      /**
       * Shutdown manager
       */
      async shutdown() {
        if (this.scaleInterval) {
          clearInterval(this.scaleInterval);
        }

        const promises = [];
        for (const [id] of this.workers) {
          promises.push(this.terminateWorker(id));
        }
        await Promise.all(promises);
      }
    }

    // Test worker manager
    console.log('Testing production worker manager:');
    const manager = new WorkerManager({
      minWorkers: 2,
      maxWorkers: 4,
      taskTimeout: 3000
    });

    console.log('Executing tasks...');
    const managerTasks = [];
    for (let i = 0; i < 8; i++) {
      managerTasks.push(
        manager.execute(`Math.sqrt(${i * 100})`, {}, 2000)
      );
    }

    const managerResults = await Promise.all(managerTasks);
    console.log('  Completed', managerResults.length, 'tasks');

    console.log('\nManager statistics:');
    const managerStats = manager.getStats();
    Object.entries(managerStats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    // Cleanup
    await pool.shutdown();
    await manager.shutdown();

    console.log('\n=== Summary: Worker Integration ===\n');
    console.log('Key Features:');
    console.log('✓ True process isolation via Worker Threads');
    console.log('✓ Worker thread pooling for efficiency');
    console.log('✓ Secure message passing with validation');
    console.log('✓ Auto-scaling worker management');
    console.log('✓ Timeout protection');
    console.log('✓ Resource cleanup and lifecycle management');
  })();

} else {
  // ============================================================================
  // Worker Thread Code
  // ============================================================================

  const { type } = workerData;

  if (type === 'execute') {
    // Simple execution
    const { code, sandbox, timeout } = workerData;
    try {
      const context = vm.createContext(sandbox);
      const result = vm.runInContext(code, context, {
        timeout,
        displayErrors: true
      });
      parentPort.postMessage({ success: true, result });
    } catch (error) {
      parentPort.postMessage({ success: false, error: error.message });
    }
  } else if (type === 'pool' || type === 'managed') {
    // Pool worker - listen for messages
    parentPort.on('message', ({ action, code, sandbox, timeout }) => {
      if (action === 'execute') {
        try {
          const context = vm.createContext(sandbox);
          const result = vm.runInContext(code, context, {
            timeout,
            displayErrors: true
          });
          parentPort.postMessage({ success: true, result });
        } catch (error) {
          parentPort.postMessage({ success: false, error: error.message });
        }
      }
    });
  }
}
