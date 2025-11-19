/**
 * Exercise 5: Task Queue with Worker Pool
 * ========================================
 *
 * Difficulty: Hard
 *
 * Task:
 * Create a task queue system with a worker pool using child processes and IPC
 * (Inter-Process Communication). The master process manages a queue of tasks
 * and distributes them to worker processes, which execute the tasks and send
 * results back via IPC.
 *
 * Requirements:
 * 1. Create a master process that manages task queue and workers
 * 2. Spawn multiple worker processes
 * 3. Implement IPC between master and workers
 * 4. Distribute tasks to available workers
 * 5. Handle worker failures and respawning
 * 6. Track task status and worker utilization
 * 7. Implement graceful shutdown
 * 8. Display real-time statistics
 *
 * Learning Goals:
 * - Using child_process.fork() to create child processes
 * - IPC with process.send() and process.on('message')
 * - Managing worker pools
 * - Task queue implementation
 * - Process lifecycle management
 * - Load distribution and balancing
 * - Handling process failures
 *
 * Run: node exercise-5.js
 */

const { fork } = require('child_process');
const path = require('path');

// Configuration
const CONFIG = {
  workerCount: 3,           // Number of worker processes
  maxTaskDuration: 5000,    // Max time for a task (ms)
  workerRestartDelay: 1000, // Delay before restarting failed worker
  statsInterval: 3000       // Stats display interval
};

// State
const workers = new Map();      // workerId -> worker object
const taskQueue = [];           // Pending tasks
const completedTasks = [];      // Completed task results
const failedTasks = [];         // Failed tasks
let nextWorkerId = 1;
let nextTaskId = 1;
let isShuttingDown = false;
let statsInterval;

/**
 * Task represents a unit of work
 */
class Task {
  constructor(type, data) {
    this.id = nextTaskId++;
    this.type = type;
    this.data = data;
    this.status = 'pending';  // pending, processing, completed, failed
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
 * Worker represents a child process
 */
class Worker {
  constructor(id) {
    this.id = id;
    this.process = null;
    this.status = 'idle';     // idle, busy, dead
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
 * TODO 1: Implement worker spawning
 *
 * Steps:
 * 1. Create Worker instance
 * 2. Fork a child process (this same file)
 * 3. Set up IPC message handler
 * 4. Set up exit handler
 * 5. Send initial configuration to worker
 * 6. Add to workers map
 *
 * Hint: Use fork(__filename) to spawn the same script as a child
 * Hint: Check if process.send exists to determine if we're a child process
 */
function spawnWorker() {
  const worker = new Worker(nextWorkerId++);

  console.log(`🔧 Spawning worker #${worker.id}...`);

  // TODO: Fork child process
  // worker.process = fork(__filename, ['--worker'], {
  //   env: { WORKER_ID: worker.id }
  // });

  // TODO: Handle messages from worker
  // worker.process.on('message', (message) => {
  //   handleWorkerMessage(worker, message);
  // });

  // TODO: Handle worker exit
  // worker.process.on('exit', (code, signal) => {
  //   handleWorkerExit(worker, code, signal);
  // });

  // TODO: Handle worker errors
  // worker.process.on('error', (error) => {
  //   console.error(`❌ Worker #${worker.id} error:`, error.message);
  // });

  // TODO: Add to workers map
  // workers.set(worker.id, worker);

  console.log(`✅ Worker #${worker.id} spawned (PID: ${worker.process?.pid})`);
  return worker;
}

/**
 * TODO 2: Implement worker message handler
 *
 * Handle messages from workers:
 * - 'ready': Worker is ready to receive tasks
 * - 'result': Task completed successfully
 * - 'error': Task failed
 * - 'status': Worker status update
 */
function handleWorkerMessage(worker, message) {
  const { type, taskId, result, error } = message;

  // TODO: Handle 'ready' message
  // if (type === 'ready') {
  //   console.log(`✅ Worker #${worker.id} is ready`);
  //   worker.status = 'idle';
  //   assignTask(worker);
  //   return;
  // }

  // TODO: Handle 'result' message (task completed)
  // if (type === 'result') {
  //   console.log(`✅ Task #${taskId} completed by worker #${worker.id}`);
  //
  //   const task = worker.currentTask;
  //   if (task) {
  //     task.status = 'completed';
  //     task.result = result;
  //     task.endTime = Date.now();
  //     completedTasks.push(task);
  //   }
  //
  //   worker.status = 'idle';
  //   worker.currentTask = null;
  //   worker.tasksCompleted++;
  //
  //   // Assign next task
  //   assignTask(worker);
  //   return;
  // }

  // TODO: Handle 'error' message (task failed)
  // if (type === 'error') {
  //   console.error(`❌ Task #${taskId} failed in worker #${worker.id}: ${error}`);
  //
  //   const task = worker.currentTask;
  //   if (task) {
  //     task.status = 'failed';
  //     task.error = error;
  //     task.endTime = Date.now();
  //     failedTasks.push(task);
  //   }
  //
  //   worker.status = 'idle';
  //   worker.currentTask = null;
  //   worker.tasksFailed++;
  //
  //   // Assign next task
  //   assignTask(worker);
  //   return;
  // }
}

/**
 * TODO 3: Implement worker exit handler
 *
 * Handle worker process exit:
 * 1. Log exit information
 * 2. Mark worker as dead
 * 3. Handle current task (requeue if necessary)
 * 4. Respawn worker if not shutting down
 */
function handleWorkerExit(worker, code, signal) {
  console.log(`\n⚠️  Worker #${worker.id} exited (code: ${code}, signal: ${signal})`);

  worker.status = 'dead';

  // TODO: Handle current task
  // if (worker.currentTask) {
  //   console.log(`   Requeuing task #${worker.currentTask.id}`);
  //   worker.currentTask.status = 'pending';
  //   worker.currentTask.workerId = null;
  //   taskQueue.unshift(worker.currentTask); // Add back to front of queue
  //   worker.currentTask = null;
  // }

  // TODO: Remove from workers map
  // workers.delete(worker.id);

  // TODO: Respawn worker if not shutting down
  // if (!isShuttingDown) {
  //   console.log(`   Respawning worker in ${CONFIG.workerRestartDelay}ms...`);
  //   setTimeout(() => {
  //     spawnWorker();
  //   }, CONFIG.workerRestartDelay);
  // }
}

/**
 * TODO 4: Implement task assignment
 *
 * Assign a task from the queue to an idle worker:
 * 1. Check if worker is idle
 * 2. Get next task from queue
 * 3. Update task and worker status
 * 4. Send task to worker via IPC
 */
function assignTask(worker) {
  // TODO: Check if worker is idle and queue has tasks
  // if (worker.status !== 'idle' || taskQueue.length === 0) {
  //   return;
  // }

  // TODO: Get next task
  // const task = taskQueue.shift();

  // TODO: Update status
  // task.status = 'processing';
  // task.workerId = worker.id;
  // task.startTime = Date.now();
  // worker.status = 'busy';
  // worker.currentTask = task;

  // TODO: Send task to worker
  // console.log(`📤 Assigning task #${task.id} (${task.type}) to worker #${worker.id}`);
  // worker.process.send({
  //   type: 'task',
  //   task: {
  //     id: task.id,
  //     type: task.type,
  //     data: task.data
  //   }
  // });
}

/**
 * TODO 5: Implement task distribution
 *
 * Try to assign tasks to all idle workers
 */
function distributeTasks() {
  for (const worker of workers.values()) {
    if (worker.status === 'idle') {
      assignTask(worker);
    }
  }
}

/**
 * TODO 6: Implement task queue population
 *
 * Create sample tasks of different types:
 * - 'compute': CPU-intensive calculation
 * - 'io': Simulated I/O operation
 * - 'slow': Long-running task
 */
function addSampleTasks() {
  // TODO: Add various tasks
  // const tasks = [
  //   new Task('compute', { operation: 'fibonacci', n: 35 }),
  //   new Task('io', { operation: 'read', file: 'data.txt' }),
  //   new Task('compute', { operation: 'prime', n: 10000 }),
  //   new Task('slow', { duration: 3000 }),
  //   new Task('compute', { operation: 'fibonacci', n: 30 }),
  //   new Task('io', { operation: 'write', file: 'output.txt' }),
  //   new Task('compute', { operation: 'sort', size: 100000 }),
  //   new Task('slow', { duration: 2000 }),
  // ];

  // TODO: Add to queue
  // tasks.forEach(task => {
  //   taskQueue.push(task);
  //   console.log(`📝 Added task #${task.id}: ${task.type}`);
  // });

  // TODO: Distribute tasks
  // distributeTasks();
}

/**
 * TODO 7: Implement statistics display
 *
 * Show:
 * - Worker status and utilization
 * - Queue size
 * - Completed/failed task counts
 * - Average task duration
 */
function displayStats() {
  console.log('\n' + '═'.repeat(70));
  console.log('📊 TASK QUEUE STATISTICS');
  console.log('═'.repeat(70));

  // TODO: Display worker stats
  // console.log('\n👷 Workers:');
  // for (const worker of workers.values()) {
  //   const status = worker.status === 'idle' ? '🟢' :
  //                  worker.status === 'busy' ? '🟡' : '🔴';
  //   const uptime = (worker.getUptime() / 1000).toFixed(1);
  //   console.log(`   ${status} Worker #${worker.id} (PID: ${worker.process?.pid}) - ` +
  //               `${worker.status} - ${worker.tasksCompleted} completed, ` +
  //               `${worker.tasksFailed} failed, uptime: ${uptime}s`);
  // }

  // TODO: Display queue stats
  // console.log(`\n📋 Queue:`);
  // console.log(`   Pending: ${taskQueue.length}`);
  // console.log(`   Completed: ${completedTasks.length}`);
  // console.log(`   Failed: ${failedTasks.length}`);

  // TODO: Calculate and display averages
  // if (completedTasks.length > 0) {
  //   const avgDuration = completedTasks.reduce((sum, task) =>
  //     sum + task.getDuration(), 0) / completedTasks.length;
  //   console.log(`   Average Duration: ${avgDuration.toFixed(2)}ms`);
  // }

  console.log('═'.repeat(70) + '\n');
}

/**
 * TODO 8: Implement graceful shutdown
 *
 * Steps:
 * 1. Set shutting down flag
 * 2. Stop accepting new tasks
 * 3. Wait for current tasks to complete
 * 4. Kill all workers
 * 5. Display final statistics
 * 6. Exit
 */
function gracefulShutdown() {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log('\n\n🛑 Shutting down task queue system...');

  // TODO: Clear stats interval
  // clearInterval(statsInterval);

  // TODO: Check for pending work
  // const activeTasks = Array.from(workers.values())
  //   .filter(w => w.status === 'busy').length;
  //
  // if (activeTasks > 0 || taskQueue.length > 0) {
  //   console.log(`⏳ Waiting for ${activeTasks} active tasks to complete...`);
  //   console.log(`⚠️  ${taskQueue.length} queued tasks will be cancelled`);
  // }

  // TODO: Wait briefly for tasks to complete
  // setTimeout(() => {
  //   console.log('\n📊 Final Statistics:');
  //   displayStats();
  //
  //   // Kill all workers
  //   console.log('🔪 Terminating workers...');
  //   for (const worker of workers.values()) {
  //     worker.process.kill();
  //   }
  //
  //   console.log('👋 Shutdown complete\n');
  //   process.exit(0);
  // }, 2000);
}

/**
 * TODO 9: Implement master process logic
 */
function runMaster() {
  console.log('═'.repeat(70));
  console.log('TASK QUEUE WITH WORKER POOL');
  console.log('═'.repeat(70));
  console.log(`\n🎯 Master Process (PID: ${process.pid})`);
  console.log(`👷 Spawning ${CONFIG.workerCount} workers...\n`);

  // TODO: Spawn workers
  // for (let i = 0; i < CONFIG.workerCount; i++) {
  //   spawnWorker();
  // }

  // TODO: Wait a bit then add tasks
  // setTimeout(() => {
  //   console.log('\n📋 Adding sample tasks to queue...\n');
  //   addSampleTasks();
  // }, 1000);

  // TODO: Set up periodic stats display
  // statsInterval = setInterval(displayStats, CONFIG.statsInterval);

  // TODO: Set up signal handlers
  // process.on('SIGINT', () => {
  //   console.log('\n\nReceived SIGINT');
  //   gracefulShutdown();
  // });

  console.log('\n💡 Press Ctrl+C to shutdown gracefully\n');
}

/**
 * TODO 10: Implement worker process logic
 *
 * Workers should:
 * 1. Listen for 'task' messages from master
 * 2. Execute the task
 * 3. Send result back to master
 * 4. Handle errors
 */
function runWorker() {
  const workerId = process.env.WORKER_ID;
  console.log(`👷 Worker #${workerId} started (PID: ${process.pid})`);

  // TODO: Send ready message to master
  // process.send({ type: 'ready', workerId });

  // TODO: Listen for tasks
  // process.on('message', async (message) => {
  //   if (message.type === 'task') {
  //     const { task } = message;
  //     console.log(`[Worker #${workerId}] Processing task #${task.id}: ${task.type}`);
  //
  //     try {
  //       // Execute task based on type
  //       let result;
  //
  //       if (task.type === 'compute') {
  //         // Simulate CPU-intensive work
  //         result = await executeCompute(task.data);
  //       } else if (task.type === 'io') {
  //         // Simulate I/O work
  //         result = await executeIO(task.data);
  //       } else if (task.type === 'slow') {
  //         // Simulate slow task
  //         result = await executeSlow(task.data);
  //       }
  //
  //       // Send result back to master
  //       process.send({
  //         type: 'result',
  //         taskId: task.id,
  //         result
  //       });
  //
  //     } catch (error) {
  //       // Send error back to master
  //       process.send({
  //         type: 'error',
  //         taskId: task.id,
  //         error: error.message
  //       });
  //     }
  //   }
  // });
}

/**
 * Helper functions for worker tasks
 */

// TODO: Implement compute task (e.g., Fibonacci)
function executeCompute(data) {
  // return new Promise((resolve) => {
  //   // Simulate CPU work
  //   const start = Date.now();
  //   let result = 0;
  //   for (let i = 0; i < 10000000; i++) {
  //     result += Math.sqrt(i);
  //   }
  //   const duration = Date.now() - start;
  //   resolve({ computed: result, duration });
  // });
}

// TODO: Implement I/O task
function executeIO(data) {
  // return new Promise((resolve) => {
  //   // Simulate I/O delay
  //   setTimeout(() => {
  //     resolve({ operation: data.operation, file: data.file, size: 1024 });
  //   }, 500 + Math.random() * 1000);
  // });
}

// TODO: Implement slow task
function executeSlow(data) {
  // return new Promise((resolve) => {
  //   setTimeout(() => {
  //     resolve({ completed: true, duration: data.duration });
  //   }, data.duration);
  // });
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Determine if this is master or worker process
 */
function main() {
  // Check if this is a worker process
  const isWorker = process.argv.includes('--worker') || process.send !== undefined;

  // TODO: Run as master or worker
  // if (isWorker) {
  //   runWorker();
  // } else {
  //   runMaster();
  // }
}

// Start
// TODO: Uncomment when ready to test
// main();

// =============================================================================
// Expected Output:
// =============================================================================

/**
 * Master process starts:
 * ═══════════════════════════════════════════════════════════════
 * TASK QUEUE WITH WORKER POOL
 * ═══════════════════════════════════════════════════════════════
 *
 * 🎯 Master Process (PID: 12345)
 * 👷 Spawning 3 workers...
 *
 * 🔧 Spawning worker #1...
 * ✅ Worker #1 spawned (PID: 12346)
 * ...
 *
 * Workers start:
 * 👷 Worker #1 started (PID: 12346)
 * ✅ Worker #1 is ready
 * ...
 *
 * Tasks added:
 * 📝 Added task #1: compute
 * 📝 Added task #2: io
 * ...
 *
 * Task execution:
 * 📤 Assigning task #1 (compute) to worker #1
 * [Worker #1] Processing task #1: compute
 * ✅ Task #1 completed by worker #1
 * ...
 *
 * Statistics:
 * ═══════════════════════════════════════════════════════════════
 * 📊 TASK QUEUE STATISTICS
 * ═══════════════════════════════════════════════════════════════
 *
 * 👷 Workers:
 *    🟢 Worker #1 (PID: 12346) - idle - 3 completed, 0 failed
 *    🟡 Worker #2 (PID: 12347) - busy - 2 completed, 0 failed
 *    🟢 Worker #3 (PID: 12348) - idle - 2 completed, 1 failed
 *
 * 📋 Queue:
 *    Pending: 1
 *    Completed: 7
 *    Failed: 1
 *    Average Duration: 1250.50ms
 */

// =============================================================================
// Hints:
// =============================================================================

/**
 * Hint 1: Forking child process
 * const child = fork(__filename, ['--worker']);
 * The child will run the same script but can check for '--worker' flag
 *
 * Hint 2: IPC communication
 * Parent to child: child.send({ type: 'task', data: {...} });
 * Child to parent: process.send({ type: 'result', data: {...} });
 *
 * Hint 3: Detecting worker vs master
 * if (process.argv.includes('--worker')) {
 *   // This is a worker
 * } else {
 *   // This is the master
 * }
 *
 * Hint 4: Handling worker exit
 * worker.on('exit', (code, signal) => {
 *   // Respawn if needed
 *   if (!isShuttingDown) {
 *     spawnWorker();
 *   }
 * });
 *
 * Hint 5: Task distribution
 * After any task completes or worker becomes idle,
 * call assignTask() to assign the next queued task.
 */

// =============================================================================
// Testing:
// =============================================================================

/**
 * Test 1: Basic operation
 * $ node exercise-5.js
 * Observe workers spawning and tasks being processed
 *
 * Test 2: Worker crash
 * Modify a worker to crash (throw error after receiving task)
 * Observe task requeuing and worker respawning
 *
 * Test 3: Graceful shutdown
 * $ node exercise-5.js
 * Wait for some tasks to start
 * Press Ctrl+C
 * Observe tasks completing before shutdown
 *
 * Test 4: Heavy load
 * Add many more tasks to the queue
 * Observe load distribution across workers
 */
