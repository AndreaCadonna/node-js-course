/**
 * SOLUTION: Exercise 4 - Process Communication with fork()
 *
 * IPC, worker pools, and CPU task offloading using fork().
 *
 * Note: This solution requires creating separate worker files.
 * See examples at the end of this file.
 */

const { fork } = require('child_process');
const path = require('path');

/**
 * Basic parent-child communication
 */
function basicParentChildComm() {
  console.log('\n=== Basic Parent-Child Communication ===');

  return new Promise((resolve) => {
    // In a real implementation, create worker-basic.js
    console.log('Note: Create worker-basic.js with message handlers');

    // Example implementation:
    /*
    const child = fork(path.join(__dirname, 'worker-basic.js'));

    child.on('message', (message) => {
      console.log('✉️  Parent received:', message);
    });

    child.send({ type: 'greeting', data: 'Hello from parent!' });

    child.on('exit', (code) => {
      console.log(`✓ Child exited with code: ${code}`);
      resolve();
    });
    */

    resolve();
  });
}

/**
 * Request-response pattern with correlation IDs
 */
class IPCClient {
  constructor(workerPath) {
    this.child = fork(workerPath);
    this.requestId = 0;
    this.pending = new Map();

    this.child.on('message', (message) => {
      if (message.type === 'response' && message.id) {
        const handler = this.pending.get(message.id);
        if (handler) {
          handler.resolve(message.result);
          this.pending.delete(message.id);
        }
      }
    });
  }

  sendRequest(task, data) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pending.set(id, { resolve, reject });

      this.child.send({
        id,
        type: 'request',
        task,
        data
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  close() {
    this.child.kill();
  }
}

/**
 * Worker pool implementation
 */
class WorkerPool {
  constructor(workerScript, poolSize = 4) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];
    this.queue = [];
    this.taskId = 0;

    this.initializeWorkers();
  }

  initializeWorkers() {
    console.log(`\n🏊 Initializing worker pool (size: ${this.poolSize})`);

    for (let i = 0; i < this.poolSize; i++) {
      const worker = {
        id: i,
        child: null,
        busy: false
      };

      // Note: In real implementation, fork actual worker
      // worker.child = fork(this.workerScript);

      this.workers.push(worker);
      console.log(`  Worker ${i} created`);
    }
  }

  async executeTask(task, data) {
    return new Promise((resolve, reject) => {
      const taskId = ++this.taskId;

      this.queue.push({
        taskId,
        task,
        data,
        resolve,
        reject
      });

      this.processQueue();
    });
  }

  processQueue() {
    if (this.queue.length === 0) return;

    const available = this.workers.find(w => !w.busy);
    if (!available) return;

    const job = this.queue.shift();
    available.busy = true;

    console.log(`📋 Worker ${available.id} processing task ${job.taskId}`);

    // Simulate work
    setTimeout(() => {
      available.busy = false;
      job.resolve({ result: `Task ${job.taskId} completed` });
      this.processQueue();
    }, 100);
  }

  async shutdown() {
    console.log('\n🛑 Shutting down worker pool...');
    this.workers.forEach((w, i) => {
      if (w.child) w.child.kill();
      console.log(`  Worker ${i} terminated`);
    });
  }
}

/**
 * CPU-intensive task offloading
 */
async function offloadCPUIntensiveTask(task, data) {
  console.log(`\n⚙️  Offloading CPU task: ${task}`);

  return new Promise((resolve, reject) => {
    // In real implementation:
    // const child = fork('./cpu-worker.js');

    // Simulate CPU work
    setTimeout(() => {
      console.log('✓ CPU task completed');
      resolve({ result: 'Calculation complete' });
    }, 1000);

    /*
    child.send({ type: 'compute', task, data });

    child.on('message', (message) => {
      if (message.type === 'result') {
        child.kill();
        resolve(message.data);
      }
    });

    child.on('error', reject);
    */
  });
}

/**
 * Main demo
 */
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Child Process fork() IPC Solution        ║');
  console.log('╚════════════════════════════════════════════╝');

  // Demo 1: Basic communication
  await basicParentChildComm();

  // Demo 2: Worker pool
  console.log('\n=== Worker Pool Demo ===');
  const pool = new WorkerPool('./worker.js', 3);
  const results = await Promise.all([
    pool.executeTask('task1', { x: 1 }),
    pool.executeTask('task2', { x: 2 }),
    pool.executeTask('task3', { x: 3 })
  ]);
  console.log('Results:', results);
  await pool.shutdown();

  // Demo 3: CPU offloading
  await offloadCPUIntensiveTask('fibonacci', 40);

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║         Exercise Complete ✓                ║');
  console.log('╚════════════════════════════════════════════╝');

  console.log('\n📝 Note: Create these worker files to see full functionality:');
  console.log('   - worker-basic.js');
  console.log('   - worker-calculator.js');
  console.log('   - cpu-worker.js');
}

if (require.main === module) {
  main();
}

module.exports = { IPCClient, WorkerPool, offloadCPUIntensiveTask };

/**
 * WORKER FILE EXAMPLES:
 *
 * === worker-basic.js ===
 * process.on('message', (message) => {
 *   console.log('Child received:', message);
 *   process.send({ type: 'response', data: 'Hello from child!' });
 *   process.exit(0);
 * });
 *
 * === worker-calculator.js ===
 * process.on('message', (message) => {
 *   if (message.type === 'request') {
 *     let result;
 *     switch (message.task) {
 *       case 'add': result = message.data.a + message.data.b; break;
 *       case 'multiply': result = message.data.a * message.data.b; break;
 *     }
 *     process.send({ id: message.id, type: 'response', result });
 *   }
 * });
 *
 * === cpu-worker.js ===
 * function fibonacci(n) {
 *   if (n <= 1) return n;
 *   return fibonacci(n - 1) + fibonacci(n - 2);
 * }
 *
 * process.on('message', (message) => {
 *   if (message.type === 'compute') {
 *     const result = fibonacci(message.data);
 *     process.send({ type: 'result', data: result });
 *   }
 * });
 */
