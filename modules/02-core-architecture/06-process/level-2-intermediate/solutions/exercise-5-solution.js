/**
 * SOLUTION: Exercise 5 - Task Queue with Worker Pool
 * ====================================================
 *
 * This solution demonstrates a production-grade task queue system with worker pool
 * using child processes and IPC (Inter-Process Communication).
 *
 * KEY CONCEPTS:
 * - child_process.fork() for creating worker processes
 * - IPC with process.send() and process.on('message')
 * - Worker pool management
 * - Task queue and distribution
 * - Worker failure handling and respawning
 * - Load balancing across workers
 * - Graceful shutdown with cleanup
 */

const { fork } = require('child_process');
const path = require('path');

// Configuration
const CONFIG = {
  workerCount: 3,
  maxTaskDuration: 5000,
  workerRestartDelay: 1000,
  statsInterval: 3000
};

// State
const workers = new Map();
const taskQueue = [];
const completedTasks = [];
const failedTasks = [];
let nextWorkerId = 1;
let nextTaskId = 1;
let isShuttingDown = false;
let statsInterval;

/**
 * Task class
 */
class Task {
  constructor(type, data) {
    this.id = nextTaskId++;
    this.type = type;
    this.data = data;
    this.status = 'pending';
    this.workerId = null;
    this.result = null;
    this.error = null;
    this.startTime = null;
    this.endTime = null;
  }

  getDuration() {
    if (this.startTime && this.endTime) {
      return this.endTime - this.startTime;
    }
    return null;
  }
}

/**
 * Worker class
 */
class Worker {
  constructor(id) {
    this.id = id;
    this.process = null;
    this.status = 'idle';
    this.currentTask = null;
    this.tasksCompleted = 0;
    this.tasksFailed = 0;
    this.startTime = Date.now();
  }

  getUptime() {
    return Date.now() - this.startTime;
  }
}

/**
 * Spawns a new worker process
 */
function spawnWorker() {
  const worker = new Worker(nextWorkerId++);

  console.log(`🔧 Spawning worker #${worker.id}...`);

  // Fork child process
  worker.process = fork(__filename, ['--worker'], {
    env: { WORKER_ID: worker.id }
  });

  // Handle messages from worker
  worker.process.on('message', (message) => {
    handleWorkerMessage(worker, message);
  });

  // Handle worker exit
  worker.process.on('exit', (code, signal) => {
    handleWorkerExit(worker, code, signal);
  });

  // Handle worker errors
  worker.process.on('error', (error) => {
    console.error(`❌ Worker #${worker.id} error:`, error.message);
  });

  // Add to workers map
  workers.set(worker.id, worker);

  console.log(`✅ Worker #${worker.id} spawned (PID: ${worker.process.pid})`);
  return worker;
}

/**
 * Handles messages from worker processes
 */
function handleWorkerMessage(worker, message) {
  const { type, taskId, result, error } = message;

  if (type === 'ready') {
    console.log(`✅ Worker #${worker.id} is ready`);
    worker.status = 'idle';
    assignTask(worker);
    return;
  }

  if (type === 'result') {
    console.log(`✅ Task #${taskId} completed by worker #${worker.id}`);

    const task = worker.currentTask;
    if (task) {
      task.status = 'completed';
      task.result = result;
      task.endTime = Date.now();
      completedTasks.push(task);
    }

    worker.status = 'idle';
    worker.currentTask = null;
    worker.tasksCompleted++;

    assignTask(worker);
    return;
  }

  if (type === 'error') {
    console.error(`❌ Task #${taskId} failed in worker #${worker.id}: ${error}`);

    const task = worker.currentTask;
    if (task) {
      task.status = 'failed';
      task.error = error;
      task.endTime = Date.now();
      failedTasks.push(task);
    }

    worker.status = 'idle';
    worker.currentTask = null;
    worker.tasksFailed++;

    assignTask(worker);
    return;
  }
}

/**
 * Handles worker process exit
 */
function handleWorkerExit(worker, code, signal) {
  console.log(`\n⚠️  Worker #${worker.id} exited (code: ${code}, signal: ${signal})`);

  worker.status = 'dead';

  // Requeue current task
  if (worker.currentTask) {
    console.log(`   Requeuing task #${worker.currentTask.id}`);
    worker.currentTask.status = 'pending';
    worker.currentTask.workerId = null;
    taskQueue.unshift(worker.currentTask);
    worker.currentTask = null;
  }

  // Remove from workers map
  workers.delete(worker.id);

  // Respawn if not shutting down
  if (!isShuttingDown) {
    console.log(`   Respawning worker in ${CONFIG.workerRestartDelay}ms...`);
    setTimeout(() => {
      spawnWorker();
    }, CONFIG.workerRestartDelay);
  }
}

/**
 * Assigns a task to an idle worker
 */
function assignTask(worker) {
  if (worker.status !== 'idle' || taskQueue.length === 0) {
    return;
  }

  const task = taskQueue.shift();

  task.status = 'processing';
  task.workerId = worker.id;
  task.startTime = Date.now();
  worker.status = 'busy';
  worker.currentTask = task;

  console.log(`📤 Assigning task #${task.id} (${task.type}) to worker #${worker.id}`);

  worker.process.send({
    type: 'task',
    task: {
      id: task.id,
      type: task.type,
      data: task.data
    }
  });
}

/**
 * Distributes tasks to idle workers
 */
function distributeTasks() {
  for (const worker of workers.values()) {
    if (worker.status === 'idle') {
      assignTask(worker);
    }
  }
}

/**
 * Adds sample tasks to the queue
 */
function addSampleTasks() {
  const tasks = [
    new Task('compute', { operation: 'fibonacci', n: 35 }),
    new Task('io', { operation: 'read', file: 'data.txt' }),
    new Task('compute', { operation: 'prime', n: 10000 }),
    new Task('slow', { duration: 3000 }),
    new Task('compute', { operation: 'fibonacci', n: 30 }),
    new Task('io', { operation: 'write', file: 'output.txt' }),
    new Task('compute', { operation: 'sort', size: 100000 }),
    new Task('slow', { duration: 2000 }),
  ];

  tasks.forEach(task => {
    taskQueue.push(task);
    console.log(`📝 Added task #${task.id}: ${task.type}`);
  });

  distributeTasks();
}

/**
 * Displays statistics
 */
function displayStats() {
  console.log('\n' + '═'.repeat(70));
  console.log('📊 TASK QUEUE STATISTICS');
  console.log('═'.repeat(70));

  console.log('\n👷 Workers:');
  for (const worker of workers.values()) {
    const status = worker.status === 'idle' ? '🟢' :
                   worker.status === 'busy' ? '🟡' : '🔴';
    const uptime = (worker.getUptime() / 1000).toFixed(1);
    console.log(`   ${status} Worker #${worker.id} (PID: ${worker.process.pid}) - ` +
                `${worker.status} - ${worker.tasksCompleted} completed, ` +
                `${worker.tasksFailed} failed, uptime: ${uptime}s`);
  }

  console.log(`\n📋 Queue:`);
  console.log(`   Pending: ${taskQueue.length}`);
  console.log(`   Completed: ${completedTasks.length}`);
  console.log(`   Failed: ${failedTasks.length}`);

  if (completedTasks.length > 0) {
    const avgDuration = completedTasks.reduce((sum, task) =>
      sum + task.getDuration(), 0) / completedTasks.length;
    console.log(`   Average Duration: ${avgDuration.toFixed(2)}ms`);
  }

  console.log('═'.repeat(70) + '\n');
}

/**
 * Graceful shutdown
 */
function gracefulShutdown() {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log('\n\n🛑 Shutting down task queue system...');

  clearInterval(statsInterval);

  const activeTasks = Array.from(workers.values())
    .filter(w => w.status === 'busy').length;

  if (activeTasks > 0 || taskQueue.length > 0) {
    console.log(`⏳ Waiting for ${activeTasks} active tasks to complete...`);
    console.log(`⚠️  ${taskQueue.length} queued tasks will be cancelled`);
  }

  setTimeout(() => {
    console.log('\n📊 Final Statistics:');
    displayStats();

    console.log('🔪 Terminating workers...');
    for (const worker of workers.values()) {
      worker.process.kill();
    }

    console.log('👋 Shutdown complete\n');
    process.exit(0);
  }, 2000);
}

/**
 * Master process logic
 */
function runMaster() {
  console.log('═'.repeat(70));
  console.log('TASK QUEUE WITH WORKER POOL');
  console.log('═'.repeat(70));
  console.log(`\n🎯 Master Process (PID: ${process.pid})`);
  console.log(`👷 Spawning ${CONFIG.workerCount} workers...\n`);

  // Spawn workers
  for (let i = 0; i < CONFIG.workerCount; i++) {
    spawnWorker();
  }

  // Add tasks after workers are ready
  setTimeout(() => {
    console.log('\n📋 Adding sample tasks to queue...\n');
    addSampleTasks();
  }, 1000);

  // Set up periodic stats display
  statsInterval = setInterval(displayStats, CONFIG.statsInterval);

  // Set up signal handlers
  process.on('SIGINT', () => {
    console.log('\n\nReceived SIGINT');
    gracefulShutdown();
  });

  console.log('\n💡 Press Ctrl+C to shutdown gracefully\n');
}

/**
 * Worker process logic
 */
function runWorker() {
  const workerId = process.env.WORKER_ID;
  console.log(`👷 Worker #${workerId} started (PID: ${process.pid})`);

  // Send ready message
  process.send({ type: 'ready', workerId });

  // Listen for tasks
  process.on('message', async (message) => {
    if (message.type === 'task') {
      const { task } = message;
      console.log(`[Worker #${workerId}] Processing task #${task.id}: ${task.type}`);

      try {
        let result;

        if (task.type === 'compute') {
          result = await executeCompute(task.data);
        } else if (task.type === 'io') {
          result = await executeIO(task.data);
        } else if (task.type === 'slow') {
          result = await executeSlow(task.data);
        }

        process.send({ type: 'result', taskId: task.id, result });

      } catch (error) {
        process.send({ type: 'error', taskId: task.id, error: error.message });
      }
    }
  });
}

/**
 * Worker task execution functions
 */
function executeCompute(data) {
  return new Promise((resolve) => {
    const start = Date.now();
    let result = 0;
    for (let i = 0; i < 10000000; i++) {
      result += Math.sqrt(i);
    }
    const duration = Date.now() - start;
    resolve({ computed: result, duration });
  });
}

function executeIO(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ operation: data.operation, file: data.file, size: 1024 });
    }, 500 + Math.random() * 1000);
  });
}

function executeSlow(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ completed: true, duration: data.duration });
    }, data.duration);
  });
}

/**
 * Main entry point
 */
function main() {
  const isWorker = process.argv.includes('--worker') || process.send !== undefined;

  if (isWorker) {
    runWorker();
  } else {
    runMaster();
  }
}

main();

/**
 * LEARNING NOTES:
 *
 * 1. IPC (Inter-Process Communication) enables communication between master and workers
 * 2. fork() creates child processes that run the same script
 * 3. Worker pool pattern distributes load across multiple processes
 * 4. Failed workers should be respawned to maintain pool size
 * 5. Tasks should be requeued if worker fails mid-execution
 * 6. Graceful shutdown should wait for active tasks to complete
 */
