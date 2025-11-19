/**
 * 08-ipc-basics.js
 *
 * Inter-Process Communication (IPC) Basics
 *
 * This example demonstrates IPC patterns in Node.js including:
 * - Parent-child process communication
 * - Message passing with child_process
 * - Structured message protocols
 * - Bidirectional communication
 * - Handle passing
 * - Error handling in IPC
 * - Process coordination
 * - Worker process patterns
 *
 * IPC Use Cases:
 * - Parallel processing
 * - CPU-intensive task offloading
 * - Process isolation
 * - Load distribution
 * - Graceful task distribution
 *
 * Communication Methods:
 * - process.send() - Send to parent
 * - child.send() - Send to child
 * - process.on('message') - Receive from parent
 * - child.on('message') - Receive from child
 *
 * IPC Features:
 * - JSON serialization
 * - Handle passing (TCP, UDP sockets)
 * - Buffered sends
 * - Disconnect handling
 *
 * @module ipc-basics
 * @level intermediate
 */

'use strict';

const { fork } = require('child_process');
const { EventEmitter } = require('events');
const path = require('path');

// =============================================================================
// 1. Basic Parent-Child Communication
// =============================================================================

console.log('\n=== 1. Basic Parent-Child Communication ===\n');

class BasicIPCDemo {
  constructor() {
    this.isChild = !!process.send; // Has send method = child process
  }

  /**
   * Run as parent process
   */
  runAsParent() {
    console.log('[Parent] Starting basic IPC demo');
    console.log(`[Parent] PID: ${process.pid}\n`);

    // Fork a child process (this same file)
    const child = fork(__filename, ['--child', '--demo', 'basic']);

    console.log(`[Parent] Forked child process: ${child.pid}\n`);

    // Listen for messages from child
    child.on('message', (message) => {
      console.log('[Parent] Received message from child:', message);

      // Respond to child
      if (message.type === 'greeting') {
        child.send({
          type: 'response',
          data: 'Hello from parent!',
          timestamp: Date.now()
        });
      }
    });

    // Send initial message to child
    setTimeout(() => {
      console.log('[Parent] Sending message to child...');
      child.send({
        type: 'command',
        action: 'start',
        timestamp: Date.now()
      });
    }, 1000);

    // Cleanup
    setTimeout(() => {
      console.log('\n[Parent] Disconnecting from child...');
      child.disconnect();
    }, 5000);

    child.on('disconnect', () => {
      console.log('[Parent] Child disconnected\n');
    });

    child.on('exit', (code, signal) => {
      console.log(`[Parent] Child exited: code=${code}, signal=${signal}\n`);
    });
  }

  /**
   * Run as child process
   */
  runAsChild() {
    console.log('[Child] Started');
    console.log(`[Child] PID: ${process.pid}`);
    console.log(`[Child] Parent PID: ${process.ppid}\n`);

    // Listen for messages from parent
    process.on('message', (message) => {
      console.log('[Child] Received message from parent:', message);

      // Handle different message types
      if (message.type === 'command' && message.action === 'start') {
        // Send greeting to parent
        process.send({
          type: 'greeting',
          data: 'Hello from child!',
          timestamp: Date.now()
        });
      }
    });

    // Handle disconnect
    process.on('disconnect', () => {
      console.log('[Child] Disconnected from parent');
      console.log('[Child] Exiting...\n');
      process.exit(0);
    });
  }
}

const basicDemo = new BasicIPCDemo();

// Check if running as child process
if (process.argv.includes('--child') && process.argv.includes('basic')) {
  basicDemo.runAsChild();
} else if (!process.argv.includes('--child')) {
  basicDemo.runAsParent();
}

// =============================================================================
// 2. Structured Message Protocol
// =============================================================================

console.log('\n=== 2. Structured Message Protocol ===\n');

class MessageProtocol {
  constructor() {
    this.messageCounter = 0;
    this.pendingRequests = new Map();
  }

  /**
   * Create a structured message
   */
  createMessage(type, data, options = {}) {
    return {
      id: ++this.messageCounter,
      type,
      data,
      timestamp: Date.now(),
      sender: process.pid,
      ...options
    };
  }

  /**
   * Send request and wait for response
   */
  sendRequest(target, type, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const message = this.createMessage(type, data, { requestId: this.messageCounter });

      // Setup timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error('Request timeout'));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(message.id, {
        resolve: (response) => {
          clearTimeout(timer);
          this.pendingRequests.delete(message.id);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timer);
          this.pendingRequests.delete(message.id);
          reject(error);
        }
      });

      // Send message
      target.send(message);
    });
  }

  /**
   * Send response to a request
   */
  sendResponse(target, requestId, data, error = null) {
    const response = this.createMessage('response', data, {
      requestId,
      error: error ? error.message : null
    });

    target.send(response);
  }

  /**
   * Handle incoming message
   */
  handleMessage(message, handler) {
    // Check if this is a response to a pending request
    if (message.type === 'response' && message.requestId) {
      const pending = this.pendingRequests.get(message.requestId);

      if (pending) {
        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          pending.resolve(message.data);
        }
        return;
      }
    }

    // Otherwise, pass to handler
    if (handler) {
      handler(message);
    }
  }
}

class ProtocolIPCDemo {
  constructor() {
    this.protocol = new MessageProtocol();
    this.isChild = !!process.send;
  }

  /**
   * Run as parent
   */
  runAsParent() {
    console.log('[ProtocolParent] Starting with structured protocol');
    console.log(`[ProtocolParent] PID: ${process.pid}\n`);

    const child = fork(__filename, ['--child', '--demo', 'protocol']);

    console.log(`[ProtocolParent] Forked child: ${child.pid}\n`);

    // Handle messages
    child.on('message', (message) => {
      this.protocol.handleMessage(message, (msg) => {
        console.log('[ProtocolParent] Received:', msg.type, msg.data);
      });
    });

    // Send requests
    setTimeout(async () => {
      try {
        console.log('[ProtocolParent] Sending compute request...');

        const response = await this.protocol.sendRequest(child, 'compute', {
          operation: 'factorial',
          number: 10
        });

        console.log('[ProtocolParent] Compute result:', response);
      } catch (error) {
        console.error('[ProtocolParent] Request failed:', error.message);
      }
    }, 1000);

    // Cleanup
    setTimeout(() => {
      child.disconnect();
    }, 8000);

    child.on('exit', (code) => {
      console.log(`[ProtocolParent] Child exited: ${code}\n`);
    });
  }

  /**
   * Run as child
   */
  runAsChild() {
    console.log('[ProtocolChild] Started with protocol handler');
    console.log(`[ProtocolChild] PID: ${process.pid}\n`);

    // Handle messages
    process.on('message', (message) => {
      this.protocol.handleMessage(message, (msg) => {
        console.log('[ProtocolChild] Received request:', msg.type, msg.data);

        // Handle compute request
        if (msg.type === 'compute') {
          this.handleCompute(msg);
        }
      });
    });

    process.on('disconnect', () => {
      console.log('[ProtocolChild] Disconnected, exiting...');
      process.exit(0);
    });
  }

  /**
   * Handle compute request
   */
  handleCompute(message) {
    const { operation, number } = message.data;

    try {
      let result;

      if (operation === 'factorial') {
        result = this.factorial(number);
      } else {
        throw new Error(`Unknown operation: ${operation}`);
      }

      console.log(`[ProtocolChild] Computed ${operation}(${number}) = ${result}`);

      this.protocol.sendResponse(process, message.requestId, {
        operation,
        number,
        result
      });
    } catch (error) {
      this.protocol.sendResponse(process, message.requestId, null, error);
    }
  }

  /**
   * Calculate factorial
   */
  factorial(n) {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }
}

const protocolDemo = new ProtocolIPCDemo();

if (process.argv.includes('--child') && process.argv.includes('protocol')) {
  protocolDemo.runAsChild();
} else if (!process.argv.includes('--child')) {
  setTimeout(() => {
    protocolDemo.runAsParent();
  }, 6000);
}

// =============================================================================
// 3. Worker Process Pattern
// =============================================================================

console.log('\n=== 3. Worker Process Pattern ===\n');

class WorkerProcess extends EventEmitter {
  constructor(workerPath, options = {}) {
    super();
    this.workerPath = workerPath;
    this.options = options;
    this.child = null;
    this.taskCounter = 0;
    this.pendingTasks = new Map();
    this.isReady = false;
  }

  /**
   * Start the worker process
   */
  start() {
    console.log(`[Worker] Starting worker process: ${this.workerPath}`);

    this.child = fork(this.workerPath, this.options.args || []);

    console.log(`[Worker] Worker PID: ${this.child.pid}`);

    // Handle messages
    this.child.on('message', (message) => {
      this.handleMessage(message);
    });

    // Handle worker exit
    this.child.on('exit', (code, signal) => {
      console.log(`[Worker] Process exited: code=${code}, signal=${signal}`);
      this.emit('exit', { code, signal });
    });

    // Handle errors
    this.child.on('error', (error) => {
      console.error('[Worker] Error:', error.message);
      this.emit('error', error);
    });

    return this;
  }

  /**
   * Handle message from worker
   */
  handleMessage(message) {
    if (message.type === 'ready') {
      this.isReady = true;
      console.log('[Worker] Worker is ready');
      this.emit('ready');
      return;
    }

    if (message.type === 'result' && message.taskId) {
      const task = this.pendingTasks.get(message.taskId);

      if (task) {
        clearTimeout(task.timeout);
        this.pendingTasks.delete(message.taskId);

        if (message.error) {
          task.reject(new Error(message.error));
        } else {
          task.resolve(message.data);
        }
      }

      return;
    }

    this.emit('message', message);
  }

  /**
   * Execute task in worker
   */
  executeTask(taskType, data, timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (!this.isReady) {
        reject(new Error('Worker not ready'));
        return;
      }

      const taskId = ++this.taskCounter;

      // Setup timeout
      const timer = setTimeout(() => {
        this.pendingTasks.delete(taskId);
        reject(new Error('Task timeout'));
      }, timeout);

      // Store pending task
      this.pendingTasks.set(taskId, {
        resolve,
        reject,
        timeout: timer
      });

      // Send task
      this.child.send({
        type: 'task',
        taskId,
        taskType,
        data
      });

      console.log(`[Worker] Sent task #${taskId}: ${taskType}`);
    });
  }

  /**
   * Stop the worker
   */
  stop() {
    if (this.child) {
      console.log('[Worker] Stopping worker...');
      this.child.disconnect();
      this.child.kill();
    }
  }
}

// Example worker script simulation
class WorkerScript {
  constructor() {
    this.isWorker = !!process.send;
  }

  /**
   * Run as worker
   */
  runAsWorker() {
    console.log('[WorkerScript] Worker process started');
    console.log(`[WorkerScript] PID: ${process.pid}`);

    // Initialize
    setTimeout(() => {
      process.send({ type: 'ready' });
    }, 500);

    // Handle tasks
    process.on('message', async (message) => {
      if (message.type === 'task') {
        await this.handleTask(message);
      }
    });

    process.on('disconnect', () => {
      console.log('[WorkerScript] Disconnected, exiting...');
      process.exit(0);
    });
  }

  /**
   * Handle task
   */
  async handleTask(message) {
    console.log(`[WorkerScript] Processing task #${message.taskId}: ${message.taskType}`);

    try {
      let result;

      switch (message.taskType) {
        case 'compute':
          result = await this.compute(message.data);
          break;
        case 'process-data':
          result = await this.processData(message.data);
          break;
        default:
          throw new Error(`Unknown task type: ${message.taskType}`);
      }

      console.log(`[WorkerScript] Task #${message.taskId} completed`);

      process.send({
        type: 'result',
        taskId: message.taskId,
        data: result
      });
    } catch (error) {
      console.error(`[WorkerScript] Task #${message.taskId} failed:`, error.message);

      process.send({
        type: 'result',
        taskId: message.taskId,
        error: error.message
      });
    }
  }

  /**
   * Compute task
   */
  async compute(data) {
    // Simulate CPU-intensive work
    const { iterations = 1000000 } = data;
    let result = 0;

    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i);
    }

    return { result, iterations };
  }

  /**
   * Process data task
   */
  async processData(data) {
    // Simulate data processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      processed: true,
      itemCount: data.items?.length || 0,
      timestamp: Date.now()
    };
  }
}

const workerScript = new WorkerScript();

if (process.argv.includes('--child') && process.argv.includes('worker')) {
  workerScript.runAsWorker();
} else if (!process.argv.includes('--child')) {
  // Demonstrate worker pattern
  setTimeout(async () => {
    console.log('[Demo] Starting worker pattern demo...\n');

    // Create worker (would normally use separate file)
    const worker = new WorkerProcess(__filename, {
      args: ['--child', '--demo', 'worker']
    });

    worker.start();

    worker.on('ready', async () => {
      try {
        // Execute tasks
        console.log('\n[Demo] Executing compute task...');
        const result1 = await worker.executeTask('compute', { iterations: 5000000 });
        console.log('[Demo] Result:', result1);

        console.log('\n[Demo] Executing process-data task...');
        const result2 = await worker.executeTask('process-data', {
          items: [1, 2, 3, 4, 5]
        });
        console.log('[Demo] Result:', result2);

        // Cleanup
        setTimeout(() => {
          worker.stop();
        }, 2000);
      } catch (error) {
        console.error('[Demo] Task failed:', error.message);
        worker.stop();
      }
    });

    worker.on('exit', () => {
      console.log('[Demo] Worker exited\n');
    });
  }, 12000);
}

// =============================================================================
// 4. Process Pool Manager
// =============================================================================

console.log('\n=== 4. Process Pool Manager ===\n');

class ProcessPool extends EventEmitter {
  constructor(workerPath, poolSize = 4) {
    super();
    this.workerPath = workerPath;
    this.poolSize = poolSize;
    this.workers = [];
    this.taskQueue = [];
    this.roundRobinIndex = 0;
  }

  /**
   * Initialize the pool
   */
  async initialize() {
    console.log(`[Pool] Initializing pool with ${this.poolSize} workers...`);

    const initPromises = [];

    for (let i = 0; i < this.poolSize; i++) {
      const worker = new WorkerProcess(this.workerPath, {
        args: ['--child', '--demo', 'worker']
      });

      const initPromise = new Promise((resolve) => {
        worker.on('ready', () => {
          console.log(`[Pool] Worker ${i + 1}/${this.poolSize} ready (PID: ${worker.child.pid})`);
          resolve();
        });
      });

      worker.start();
      this.workers.push(worker);
      initPromises.push(initPromise);
    }

    await Promise.all(initPromises);
    console.log('[Pool] All workers ready\n');

    this.emit('ready');
  }

  /**
   * Get next available worker (round-robin)
   */
  getNextWorker() {
    const worker = this.workers[this.roundRobinIndex];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % this.workers.length;
    return worker;
  }

  /**
   * Execute task on pool
   */
  async executeTask(taskType, data, timeout) {
    const worker = this.getNextWorker();
    console.log(`[Pool] Assigning task to worker (PID: ${worker.child.pid})`);
    return worker.executeTask(taskType, data, timeout);
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeParallel(tasks) {
    console.log(`[Pool] Executing ${tasks.length} tasks in parallel...`);

    const promises = tasks.map(task =>
      this.executeTask(task.type, task.data, task.timeout)
    );

    return Promise.all(promises);
  }

  /**
   * Shutdown the pool
   */
  shutdown() {
    console.log('[Pool] Shutting down pool...');

    for (const worker of this.workers) {
      worker.stop();
    }

    this.workers = [];
    console.log('[Pool] Pool shutdown complete');
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      poolSize: this.poolSize,
      activeWorkers: this.workers.length,
      pendingTasks: this.workers.reduce((sum, w) => sum + w.pendingTasks.size, 0)
    };
  }
}

// Demonstrate process pool
if (!process.argv.includes('--child')) {
  setTimeout(async () => {
    console.log('\n[Demo] Starting process pool demo...\n');

    const pool = new ProcessPool(__filename, 2);

    pool.on('ready', async () => {
      try {
        // Execute parallel tasks
        const tasks = [
          { type: 'compute', data: { iterations: 1000000 } },
          { type: 'process-data', data: { items: [1, 2, 3] } },
          { type: 'compute', data: { iterations: 2000000 } },
          { type: 'process-data', data: { items: [4, 5, 6] } }
        ];

        console.log('[Demo] Executing parallel tasks...\n');
        const results = await pool.executeParallel(tasks);

        console.log('\n[Demo] All tasks completed:');
        results.forEach((result, i) => {
          console.log(`  Task ${i + 1}:`, result);
        });

        // Cleanup
        setTimeout(() => {
          pool.shutdown();
        }, 2000);
      } catch (error) {
        console.error('[Demo] Pool error:', error.message);
        pool.shutdown();
      }
    });

    await pool.initialize();
  }, 18000);
}

// =============================================================================
// Summary and Best Practices
// =============================================================================

if (!process.argv.includes('--child')) {
  console.log('\n=== IPC Best Practices ===\n');

  console.log(`
Inter-Process Communication Guidelines:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Message Structure:
   • Use consistent message format
   • Include message ID for tracking
   • Add timestamps
   • Include sender PID
   • Support request/response pattern

2. Error Handling:
   • Wrap message handlers in try/catch
   • Send error messages back
   • Implement timeouts
   • Handle worker crashes
   • Validate message format

3. Process Lifecycle:
   • Wait for 'ready' before sending tasks
   • Handle 'disconnect' event
   • Handle 'exit' event
   • Clean up on errors
   • Implement graceful shutdown

4. Performance:
   • Use process pools for parallel work
   • Implement task queuing
   • Balance load across workers
   • Monitor worker health
   • Restart failed workers

5. Communication Patterns:
   • Request/response
   • Fire and forget
   • Broadcast to all workers
   • Worker-to-worker (via parent)
   • Stream data

6. Data Serialization:
   • JSON for simple data
   • Consider msgpack for efficiency
   • Handle large payloads
   • Avoid circular references
   • Use structured cloning

7. Worker Management:
   • Maintain worker pool
   • Track worker state
   • Implement health checks
   • Auto-restart on failure
   • Graceful replacement

8. Resource Management:
   • Limit concurrent tasks
   • Implement backpressure
   • Monitor memory usage
   • Clean up resources
   • Set task timeouts

9. Debugging:
   • Log all IPC messages
   • Track message flow
   • Include correlation IDs
   • Monitor message rate
   • Detect message loops

10. Production Patterns:
    • Use PM2 cluster mode
    • Implement worker monitoring
    • Handle worker restart
    • Load balance tasks
    • Scale based on load

Common Use Cases:
─────────────────
• CPU-intensive tasks (image processing, data analysis)
• Parallel processing (multiple tasks simultaneously)
• Process isolation (sandboxed execution)
• Load distribution (spread work across cores)
• Graceful degradation (worker failure handling)

IPC Methods:
────────────
Parent to Child:
  child.send(message) - Send message
  child.disconnect() - Close IPC channel
  child.kill(signal) - Terminate child

Child to Parent:
  process.send(message) - Send to parent
  process.disconnect() - Close channel
  process.exit(code) - Exit process

Events:
  'message' - Message received
  'disconnect' - Channel closed
  'exit' - Process exited
  'error' - Error occurred

Current Process:
────────────────
PID: ${process.pid}
Is Child: ${!!process.send}
Node Version: ${process.version}

This example demonstrates basic IPC patterns.
For production, consider using:
• Worker threads for CPU-bound tasks (same memory)
• Child processes for isolation
• Cluster module for HTTP servers
• External message queues for distributed systems
`);

  console.log('\nIPC examples will run sequentially. Watch the output above.\n');
}

// Graceful shutdown
if (!process.argv.includes('--child')) {
  process.on('SIGINT', () => {
    console.log('\n[SIGINT] Shutting down...');
    process.exit(0);
  });
}
