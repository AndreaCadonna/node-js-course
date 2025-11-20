/**
 * Example 6: Distributed Task Processing
 *
 * Demonstrates building a distributed task processing system:
 * - Work distribution across workers
 * - Load balancing strategies
 * - Result aggregation
 * - Fault tolerance
 * - Map-reduce pattern
 * - Parallel processing
 */

const { fork } = require('child_process');
const { EventEmitter } = require('events');

console.log('=== Distributed Task Processing Example ===\n');

/**
 * DistributedTaskProcessor - Distribute and process tasks across workers
 */
class DistributedTaskProcessor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.workerCount = options.workerCount || 4;
    this.workerPath = options.workerPath;
    this.workers = [];
    this.tasks = new Map();
    this.results = new Map();
    this.taskIdCounter = 0;
    this.stats = {
      tasksSubmitted: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      totalProcessingTime: 0
    };
  }

  /**
   * Initialize workers
   */
  async init() {
    console.log(`Initializing ${this.workerCount} workers...`);

    for (let i = 0; i < this.workerCount; i++) {
      await this.createWorker(i);
    }

    console.log(`${this.workers.length} workers ready\n`);
    this.emit('ready');
  }

  /**
   * Create a worker
   */
  async createWorker(id) {
    const worker = fork(this.workerPath);

    const workerInfo = {
      id,
      worker,
      busy: false,
      tasksProcessed: 0,
      errors: 0,
      currentTask: null
    };

    worker.on('message', (msg) => {
      this.handleWorkerMessage(workerInfo, msg);
    });

    worker.on('error', (error) => {
      console.error(`Worker ${id} error:`, error.message);
      workerInfo.errors++;
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.log(`Worker ${id} crashed, restarting...`);
        const index = this.workers.indexOf(workerInfo);
        if (index !== -1) {
          this.workers.splice(index, 1);
          this.createWorker(id);
        }
      }
    });

    this.workers.push(workerInfo);
    return workerInfo;
  }

  /**
   * Handle messages from workers
   */
  handleWorkerMessage(workerInfo, msg) {
    if (msg.type === 'task_result') {
      const { taskId, result, error } = msg;
      const task = this.tasks.get(taskId);

      if (task) {
        task.endTime = Date.now();
        const duration = task.endTime - task.startTime;
        this.stats.totalProcessingTime += duration;

        if (error) {
          this.stats.tasksFailed++;
          task.reject(new Error(error));
          console.log(`Task ${taskId} failed: ${error}`);
        } else {
          this.stats.tasksCompleted++;
          task.resolve(result);
          console.log(`Task ${taskId} completed in ${duration}ms`);
        }

        this.tasks.delete(taskId);
        workerInfo.tasksProcessed++;
      }

      workerInfo.busy = false;
      workerInfo.currentTask = null;
      this.processNextTask();
    }
  }

  /**
   * Submit a task
   */
  submitTask(taskData) {
    const taskId = ++this.taskIdCounter;
    this.stats.tasksSubmitted++;

    return new Promise((resolve, reject) => {
      const task = {
        id: taskId,
        data: taskData,
        resolve,
        reject,
        startTime: Date.now(),
        endTime: null
      };

      this.tasks.set(taskId, task);
      this.assignTask(task);
    });
  }

  /**
   * Assign task to available worker
   */
  assignTask(task) {
    const worker = this.getAvailableWorker();

    if (worker) {
      worker.busy = true;
      worker.currentTask = task;

      worker.worker.send({
        type: 'task',
        taskId: task.id,
        data: task.data
      });
    }
    // Otherwise task stays in this.tasks map until a worker becomes available
  }

  /**
   * Get an available worker
   */
  getAvailableWorker() {
    return this.workers.find(w => !w.busy && w.worker.connected);
  }

  /**
   * Process next pending task
   */
  processNextTask() {
    for (const [taskId, task] of this.tasks.entries()) {
      const worker = this.getAvailableWorker();
      if (!worker) break;

      this.assignTask(task);
    }
  }

  /**
   * Map-Reduce pattern: Map phase
   */
  async map(data, mapFunction) {
    console.log(`\n--- Map Phase (${data.length} items) ---`);

    const tasks = data.map(item =>
      this.submitTask({
        type: 'map',
        data: item,
        function: mapFunction.toString()
      })
    );

    const results = await Promise.all(tasks);
    console.log(`Map phase complete: ${results.length} results`);

    return results;
  }

  /**
   * Map-Reduce pattern: Reduce phase
   */
  async reduce(mappedData, reduceFunction) {
    console.log(`\n--- Reduce Phase (${mappedData.length} items) ---`);

    // Group mapped data into chunks for parallel reduction
    const chunkSize = Math.ceil(mappedData.length / this.workerCount);
    const chunks = [];

    for (let i = 0; i < mappedData.length; i += chunkSize) {
      chunks.push(mappedData.slice(i, i + chunkSize));
    }

    // Reduce each chunk in parallel
    const tasks = chunks.map(chunk =>
      this.submitTask({
        type: 'reduce',
        data: chunk,
        function: reduceFunction.toString()
      })
    );

    const partialResults = await Promise.all(tasks);
    console.log(`Parallel reduce complete: ${partialResults.length} partial results`);

    // Final reduction (sequential)
    const finalResult = partialResults.reduce((acc, val) => {
      const fn = eval(`(${reduceFunction.toString()})`);
      return fn(acc, val);
    });

    console.log('Reduce phase complete');
    return finalResult;
  }

  /**
   * Execute map-reduce job
   */
  async mapReduce(data, mapFunction, reduceFunction, initialValue = 0) {
    const startTime = Date.now();

    console.log(`\n=== Map-Reduce Job ===`);
    console.log(`Input: ${data.length} items`);
    console.log(`Workers: ${this.workerCount}`);

    // Map phase
    const mapped = await this.map(data, mapFunction);

    // Reduce phase
    const result = await this.reduce(
      mapped.filter(v => v !== null && v !== undefined),
      reduceFunction
    );

    const duration = Date.now() - startTime;
    console.log(`\nMap-Reduce completed in ${duration}ms`);
    console.log(`Result: ${JSON.stringify(result)}\n`);

    return result;
  }

  /**
   * Process tasks in parallel batches
   */
  async processBatch(tasks, batchSize = null) {
    const size = batchSize || this.workerCount * 2;
    const results = [];

    console.log(`Processing ${tasks.length} tasks in batches of ${size}`);

    for (let i = 0; i < tasks.length; i += size) {
      const batch = tasks.slice(i, i + size);
      console.log(`Processing batch ${Math.floor(i / size) + 1}...`);

      const batchResults = await Promise.all(
        batch.map(task => this.submitTask(task))
      );

      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get processor statistics
   */
  getStats() {
    const avgProcessingTime = this.stats.tasksCompleted > 0
      ? this.stats.totalProcessingTime / this.stats.tasksCompleted
      : 0;

    return {
      workers: this.workers.length,
      stats: {
        submitted: this.stats.tasksSubmitted,
        completed: this.stats.tasksCompleted,
        failed: this.stats.tasksFailed,
        pending: this.tasks.size,
        avgProcessingTime: avgProcessingTime.toFixed(2)
      },
      workerStats: this.workers.map(w => ({
        id: w.id,
        busy: w.busy,
        tasksProcessed: w.tasksProcessed,
        errors: w.errors,
        currentTask: w.currentTask ? w.currentTask.id : null
      }))
    };
  }

  /**
   * Shutdown all workers
   */
  async shutdown() {
    console.log('\nShutting down workers...');

    for (const workerInfo of this.workers) {
      workerInfo.worker.kill();
    }

    this.workers = [];
  }
}

/**
 * Demo
 */
async function demo() {
  const fs = require('fs');
  const path = require('path');

  // Create worker file
  const workerCode = `
process.on('message', async (msg) => {
  if (msg.type === 'task') {
    const { taskId, data } = msg;

    try {
      let result;

      if (data.type === 'map') {
        // Execute map function
        const mapFn = eval(\`(\${data.function})\`);
        result = mapFn(data.data);
      } else if (data.type === 'reduce') {
        // Execute reduce function
        const reduceFn = eval(\`(\${data.function})\`);
        result = data.data.reduce(reduceFn);
      } else if (data.type === 'compute') {
        // Generic computation
        await new Promise(resolve => setTimeout(resolve, data.duration || 100));
        result = data.operation(data.value);
      } else {
        result = data;
      }

      process.send({
        type: 'task_result',
        taskId,
        result
      });
    } catch (error) {
      process.send({
        type: 'task_result',
        taskId,
        error: error.message
      });
    }
  }
});

console.log(\`Worker \${process.pid} ready\`);
`;

  const workerPath = path.join(__dirname, 'temp-distributed-worker.js');
  fs.writeFileSync(workerPath, workerCode);

  // Create distributed processor
  const processor = new DistributedTaskProcessor({
    workerCount: 4,
    workerPath
  });

  await processor.init();

  // Demo 1: Map-Reduce for sum calculation
  console.log('=== Demo 1: Map-Reduce Sum ===');

  const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
  console.log(`Numbers: ${numbers.join(', ')}`);

  const sum = await processor.mapReduce(
    numbers,
    // Map: square each number
    (n) => n * n,
    // Reduce: sum all values
    (acc, val) => acc + val,
    0
  );

  console.log(`Sum of squares: ${sum}`);
  console.log(`Expected: ${numbers.reduce((a, b) => a + b * b, 0)}\n`);

  // Demo 2: Map-Reduce for word count
  console.log('=== Demo 2: Map-Reduce Word Count ===');

  const sentences = [
    'hello world',
    'hello distributed processing',
    'world of processes',
    'hello again world'
  ];

  console.log('Sentences:', sentences);

  const wordCount = await processor.mapReduce(
    sentences,
    // Map: split into words and count
    (sentence) => {
      const words = sentence.split(' ');
      const counts = {};
      words.forEach(word => {
        counts[word] = (counts[word] || 0) + 1;
      });
      return counts;
    },
    // Reduce: merge word counts
    (acc, counts) => {
      for (const [word, count] of Object.entries(counts)) {
        acc[word] = (acc[word] || 0) + count;
      }
      return acc;
    },
    {}
  );

  console.log('Word counts:', wordCount);

  // Demo 3: Parallel batch processing
  console.log('\n=== Demo 3: Batch Processing ===\n');

  const batchTasks = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    value: i + 1,
    type: 'compute',
    operation: (n) => n * 2,
    duration: Math.random() * 100 + 50
  }));

  const batchResults = await processor.processBatch(batchTasks, 4);
  console.log(`\nProcessed ${batchResults.length} tasks`);
  console.log('Sample results:', batchResults.slice(0, 5).map((r, i) => `${i + 1}*2=${r}`).join(', '));

  // Demo 4: Fault tolerance
  console.log('\n=== Demo 4: Fault Tolerance ===\n');

  const mixedTasks = [
    { type: 'map', data: 10, function: '(n) => n * 2' },
    { type: 'map', data: 'invalid', function: '(n) => n.toUpperCase()' },
    { type: 'map', data: 20, function: '(n) => n * 2' },
    { type: 'map', data: 30, function: '(n) => n * 2' }
  ];

  const mixedResults = await Promise.allSettled(
    mixedTasks.map(task => processor.submitTask(task))
  );

  console.log('\nResults:');
  mixedResults.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`  Task ${i + 1}: ✓ ${result.value}`);
    } else {
      console.log(`  Task ${i + 1}: ✗ ${result.reason.message}`);
    }
  });

  // Show final statistics
  console.log('\n=== Final Statistics ===\n');

  const stats = processor.getStats();
  console.log('Overall:');
  console.log(`  Tasks Submitted: ${stats.stats.submitted}`);
  console.log(`  Tasks Completed: ${stats.stats.completed}`);
  console.log(`  Tasks Failed: ${stats.stats.failed}`);
  console.log(`  Avg Processing Time: ${stats.stats.avgProcessingTime}ms`);

  console.log('\nWorker Distribution:');
  stats.workerStats.forEach(w => {
    console.log(`  Worker ${w.id}: ${w.tasksProcessed} tasks, ${w.errors} errors`);
  });

  // Cleanup
  await processor.shutdown();
  fs.unlinkSync(workerPath);

  console.log('\n=== Distributed Processing Patterns ===\n');
  console.log('✓ Map-Reduce for data transformation and aggregation');
  console.log('✓ Parallel batch processing for throughput');
  console.log('✓ Load balancing across available workers');
  console.log('✓ Fault tolerance with Promise.allSettled');
  console.log('✓ Dynamic work distribution');
  console.log('✓ Result aggregation from multiple workers');
  console.log('✓ Worker pool reuse for efficiency');
  console.log('✓ Graceful degradation on worker failure');

  console.log('\n=== Demo Complete ===');
}

// Run demo
if (require.main === module) {
  demo().catch(console.error);
}

module.exports = { DistributedTaskProcessor };
