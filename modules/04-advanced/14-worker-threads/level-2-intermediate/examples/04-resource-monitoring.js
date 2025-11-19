/**
 * Level 2 Example 4: Resource Monitoring and Management
 *
 * Demonstrates:
 * - Monitoring memory usage in workers
 * - Tracking CPU usage
 * - Setting resource limits
 * - Detecting memory leaks
 * - Graceful degradation
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { performance } = require('perf_hooks');

if (isMainThread) {
  console.log('=== Resource Monitoring Example ===\n');

  class MonitoredWorker {
    constructor(workerFile, config = {}) {
      this.worker = new Worker(workerFile, { workerData: config });
      this.stats = {
        tasksCompleted: 0,
        tasksErrored: 0,
        totalMemory: 0,
        peakMemory: 0,
        avgProcessingTime: 0
      };

      this.setupMonitoring();
    }

    setupMonitoring() {
      // Request stats periodically
      this.monitorInterval = setInterval(() => {
        this.worker.postMessage({ type: 'GET_STATS' });
      }, 2000);

      this.worker.on('message', (message) => {
        if (message.type === 'stats') {
          this.updateStats(message.data);
        } else if (message.type === 'result') {
          this.stats.tasksCompleted++;
        } else if (message.type === 'error') {
          this.stats.tasksErrored++;
        }
      });

      this.worker.on('error', (err) => {
        console.error('Worker error:', err);
        this.stats.tasksErrored++;
      });
    }

    updateStats(workerStats) {
      this.stats.totalMemory = workerStats.memory.heapUsed;
      this.stats.peakMemory = Math.max(
        this.stats.peakMemory,
        workerStats.memory.heapUsed
      );

      // Display stats
      console.log('\n--- Worker Stats ---');
      console.log(`Memory: ${(workerStats.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Peak Memory: ${(this.stats.peakMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Heap Total: ${(workerStats.memory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      console.log(`External: ${(workerStats.memory.external / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Tasks: ${this.stats.tasksCompleted} completed, ${this.stats.tasksErrored} errors`);
      console.log(`Uptime: ${workerStats.uptime.toFixed(2)}s`);

      // Check for memory issues
      if (workerStats.memory.heapUsed > 500 * 1024 * 1024) {
        console.warn('⚠️  WARNING: High memory usage detected!');
      }
    }

    execute(data) {
      return new Promise((resolve, reject) => {
        const handler = (message) => {
          if (message.type === 'result') {
            this.worker.off('message', handler);
            resolve(message.data);
          } else if (message.type === 'error') {
            this.worker.off('message', handler);
            reject(new Error(message.error));
          }
        };

        this.worker.on('message', handler);
        this.worker.postMessage({ type: 'TASK', data });
      });
    }

    async terminate() {
      clearInterval(this.monitorInterval);
      await this.worker.terminate();
    }

    getStats() {
      return { ...this.stats };
    }
  }

  // Create monitored worker
  const worker = new MonitoredWorker(__filename, {
    maxMemory: 100 * 1024 * 1024 // 100MB limit
  });

  // Execute some tasks
  async function runTasks() {
    console.log('Executing tasks...\n');

    for (let i = 0; i < 5; i++) {
      try {
        const result = await worker.execute({
          size: 1000000, // Process 1M items
          iteration: i
        });

        console.log(`Task ${i} completed:`, result);
      } catch (err) {
        console.error(`Task ${i} failed:`, err.message);
      }

      // Wait a bit between tasks
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Final stats
    console.log('\n=== Final Statistics ===');
    const finalStats = worker.getStats();
    console.log(`Total tasks: ${finalStats.tasksCompleted}`);
    console.log(`Errors: ${finalStats.tasksErrored}`);
    console.log(`Peak memory: ${(finalStats.peakMemory / 1024 / 1024).toFixed(2)} MB`);

    await worker.terminate();
  }

  runTasks().catch(console.error);

} else {
  // === WORKER THREAD CODE ===
  const { maxMemory } = workerData;
  const startTime = Date.now();

  // Store some data to show memory usage
  let dataStore = [];

  parentPort.on('message', (message) => {
    if (message.type === 'GET_STATS') {
      // Send current resource stats
      const memoryUsage = process.memoryUsage();

      parentPort.postMessage({
        type: 'stats',
        data: {
          memory: memoryUsage,
          uptime: (Date.now() - startTime) / 1000,
          dataStoreSize: dataStore.length
        }
      });

    } else if (message.type === 'TASK') {
      try {
        const start = performance.now();

        // Simulate processing
        const { size, iteration } = message.data;

        const result = processData(size, iteration);

        const end = performance.now();

        // Check memory limit
        const memUsage = process.memoryUsage();
        if (maxMemory && memUsage.heapUsed > maxMemory) {
          throw new Error('Memory limit exceeded');
        }

        parentPort.postMessage({
          type: 'result',
          data: {
            iteration,
            processed: size,
            time: (end - start).toFixed(2) + 'ms'
          }
        });

      } catch (err) {
        parentPort.postMessage({
          type: 'error',
          error: err.message
        });
      }
    }
  });

  function processData(size, iteration) {
    // Process data (creates some memory pressure)
    const data = new Array(size);

    for (let i = 0; i < size; i++) {
      data[i] = {
        id: i,
        value: Math.random() * 1000,
        timestamp: Date.now()
      };
    }

    // Keep some data in memory (simulating state)
    dataStore.push({
      iteration,
      sample: data.slice(0, 100) // Keep small sample
    });

    // Clean old data to prevent unbounded growth
    if (dataStore.length > 10) {
      dataStore = dataStore.slice(-10);
    }

    // Aggregate results
    const sum = data.reduce((acc, item) => acc + item.value, 0);
    const avg = sum / data.length;

    return {
      sum: sum.toFixed(2),
      avg: avg.toFixed(2),
      count: data.length
    };
  }
}
