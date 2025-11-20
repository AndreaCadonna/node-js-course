/**
 * Exercise 4: Process Communication with fork()
 *
 * OBJECTIVE:
 * Learn to create child Node.js processes and communicate between parent and child using IPC.
 *
 * REQUIREMENTS:
 * 1. Use fork() to create child Node.js processes
 * 2. Send messages from parent to child
 * 3. Send messages from child to parent
 * 4. Handle message events on both sides
 * 5. Implement request-response patterns
 * 6. Handle child process lifecycle
 *
 * LEARNING GOALS:
 * - Understanding fork() for Node.js-to-Node.js communication
 * - Working with Inter-Process Communication (IPC)
 * - Using process.send() and process.on('message')
 * - Building communication protocols
 * - Managing child process lifecycle
 */

const { fork } = require('child_process');
const path = require('path');

/**
 * TODO 1: Implement basic parent-to-child communication
 *
 * Steps:
 * 1. Fork a child process (you'll need to create worker-1.js)
 * 2. Send a message to the child using child.send()
 * 3. Listen for messages from child using child.on('message')
 * 4. Display messages received from child
 * 5. Handle child exit
 *
 * Note: Create a separate file worker-1.js for the child process code
 */
function basicParentChildComm() {
  console.log('Starting basic parent-child communication...');

  return new Promise((resolve, reject) => {
    // Your code here
    // const child = fork(path.join(__dirname, 'worker-1.js'));
    //
    // child.on('message', (message) => {
    //   console.log('Parent received:', message);
    // });
    //
    // child.send({ type: 'greeting', data: 'Hello from parent!' });
    //
    // child.on('exit', (code) => {
    //   console.log('Child exited with code:', code);
    //   resolve();
    // });
  });
}

/**
 * TODO 2: Implement request-response pattern
 *
 * Steps:
 * 1. Fork a child process
 * 2. Send a task/request to the child
 * 3. Wait for response from child
 * 4. Use correlation IDs to match requests with responses
 * 5. Support multiple concurrent requests
 *
 * Message format:
 * {
 *   id: 'unique-id',
 *   type: 'request' | 'response',
 *   task: 'taskName',
 *   data: any,
 *   result: any
 * }
 */
function requestResponsePattern() {
  return new Promise((resolve, reject) => {
    let requestId = 0;
    const pendingRequests = new Map();

    // Your code here
    // const child = fork(path.join(__dirname, 'worker-2.js'));
    //
    // function sendRequest(task, data) {
    //   return new Promise((resolve, reject) => {
    //     const id = ++requestId;
    //     pendingRequests.set(id, { resolve, reject });
    //
    //     child.send({
    //       id,
    //       type: 'request',
    //       task,
    //       data
    //     });
    //   });
    // }
    //
    // child.on('message', (message) => {
    //   if (message.type === 'response') {
    //     const pending = pendingRequests.get(message.id);
    //     if (pending) {
    //       pending.resolve(message.result);
    //       pendingRequests.delete(message.id);
    //     }
    //   }
    // });
    //
    // // Use sendRequest to send multiple tasks
  });
}

/**
 * TODO 3: Implement worker pool pattern
 *
 * Steps:
 * 1. Fork multiple worker processes (pool size 3-5)
 * 2. Distribute tasks among workers in round-robin fashion
 * 3. Handle worker crashes and restart them
 * 4. Track which worker is handling which task
 * 5. Gracefully shutdown all workers
 */
class WorkerPool {
  constructor(workerScript, poolSize = 3) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];
    this.currentWorker = 0;
    this.taskId = 0;
    this.pendingTasks = new Map();

    // Your code here
    // Initialize the pool
  }

  /**
   * TODO: Implement worker initialization
   */
  initializeWorkers() {
    // Your code here
    // Fork workers
    // Set up message handlers
    // Set up exit handlers (restart on crash)
  }

  /**
   * TODO: Implement task execution
   */
  executeTask(task, data) {
    return new Promise((resolve, reject) => {
      // Your code here
      // Get next worker (round-robin)
      // Send task to worker
      // Store promise resolve/reject for this task
    });
  }

  /**
   * TODO: Implement graceful shutdown
   */
  async shutdown() {
    // Your code here
    // Send shutdown message to all workers
    // Wait for all to exit
    // Clean up
  }
}

/**
 * TODO 4: Implement CPU-intensive task offloading
 *
 * Steps:
 * 1. Create a child process for CPU-intensive work
 * 2. Send computational task to child
 * 3. Child performs calculation without blocking parent
 * 4. Child sends result back to parent
 * 5. Measure time saved by offloading
 *
 * Example tasks: calculate fibonacci, find primes, etc.
 */
function offloadCPUIntensiveTask(task, data) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Your code here
    // const child = fork(path.join(__dirname, 'cpu-worker.js'));
    //
    // child.send({
    //   type: 'compute',
    //   task,
    //   data
    // });
    //
    // child.on('message', (message) => {
    //   if (message.type === 'result') {
    //     const elapsed = Date.now() - startTime;
    //     console.log(`Task completed in ${elapsed}ms`);
    //     child.kill();
    //     resolve(message.data);
    //   }
    // });
  });
}

/**
 * TODO 5: Implement bidirectional streaming
 *
 * Steps:
 * 1. Fork a child process
 * 2. Set up continuous message exchange
 * 3. Parent sends stream of data
 * 4. Child processes each item and sends back results
 * 5. Handle backpressure (don't overwhelm child)
 * 6. Signal end of stream
 */
function bidirectionalStreaming(items) {
  return new Promise((resolve, reject) => {
    const results = [];
    let itemsSent = 0;
    let itemsReceived = 0;
    const maxPending = 5; // Backpressure limit

    // Your code here
    // const child = fork(path.join(__dirname, 'stream-worker.js'));
    //
    // function sendNext() {
    //   while (itemsSent < items.length && (itemsSent - itemsReceived) < maxPending) {
    //     child.send({
    //       type: 'process',
    //       index: itemsSent,
    //       data: items[itemsSent]
    //     });
    //     itemsSent++;
    //   }
    //
    //   if (itemsSent === items.length) {
    //     child.send({ type: 'end' });
    //   }
    // }
    //
    // child.on('message', (message) => {
    //   if (message.type === 'result') {
    //     results[message.index] = message.data;
    //     itemsReceived++;
    //     sendNext();
    //   } else if (message.type === 'done') {
    //     child.kill();
    //     resolve(results);
    //   }
    // });
    //
    // sendNext();
  });
}

/**
 * TODO 6: Main function to demonstrate all fork() features
 */
async function main() {
  console.log('=== Child Process fork() Exercise ===\n');

  try {
    // Test 1: Basic communication
    console.log('1. Basic Parent-Child Communication:');
    // await basicParentChildComm();

    // Test 2: Request-Response
    console.log('\n2. Request-Response Pattern:');
    // await requestResponsePattern();

    // Test 3: Worker Pool
    console.log('\n3. Worker Pool:');
    // const pool = new WorkerPool('./worker.js', 3);
    // const result = await pool.executeTask('calculate', { x: 10, y: 20 });
    // console.log('Result:', result);
    // await pool.shutdown();

    // Test 4: CPU-Intensive Task
    console.log('\n4. CPU-Intensive Task Offloading:');
    // const fibonacci = await offloadCPUIntensiveTask('fibonacci', 40);
    // console.log('Fibonacci result:', fibonacci);

    // Test 5: Bidirectional Streaming
    console.log('\n5. Bidirectional Streaming:');
    // const items = Array.from({ length: 20 }, (_, i) => i + 1);
    // const results = await bidirectionalStreaming(items);
    // console.log('Processed items:', results.length);

    console.log('\n=== Exercise Complete ===');
  } catch (error) {
    console.error('Error in main:', error.message);
  }
}

// Uncomment to run
// main();

/**
 * WORKER FILE EXAMPLES:
 *
 * You'll need to create separate worker files. Here are templates:
 *
 * ============= worker-1.js =============
 * // Basic worker
 * process.on('message', (message) => {
 *   console.log('Child received:', message);
 *   process.send({ type: 'response', data: 'Hello from child!' });
 *   process.exit(0);
 * });
 *
 * ============= worker-2.js =============
 * // Request-response worker
 * process.on('message', (message) => {
 *   if (message.type === 'request') {
 *     let result;
 *     switch (message.task) {
 *       case 'add':
 *         result = message.data.a + message.data.b;
 *         break;
 *       case 'multiply':
 *         result = message.data.a * message.data.b;
 *         break;
 *     }
 *     process.send({
 *       id: message.id,
 *       type: 'response',
 *       result
 *     });
 *   }
 * });
 *
 * ============= cpu-worker.js =============
 * // CPU-intensive worker
 * function fibonacci(n) {
 *   if (n <= 1) return n;
 *   return fibonacci(n - 1) + fibonacci(n - 2);
 * }
 *
 * process.on('message', (message) => {
 *   if (message.type === 'compute') {
 *     let result;
 *     if (message.task === 'fibonacci') {
 *       result = fibonacci(message.data);
 *     }
 *     process.send({ type: 'result', data: result });
 *   }
 * });
 */

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Create the worker files mentioned above
 * 2. Run your solution: node exercise-4.js
 * 3. Observe parent-child communication
 * 4. Try multiple concurrent requests
 * 5. Test worker pool functionality
 *
 * EXAMPLE OUTPUT:
 * ─────────────────────────────────────
 * === Child Process fork() Exercise ===
 *
 * 1. Basic Parent-Child Communication:
 * Starting basic parent-child communication...
 * Parent received: { type: 'response', data: 'Hello from child!' }
 * Child exited with code: 0
 *
 * 2. Request-Response Pattern:
 * Sending multiple requests...
 * Received response 1: 30
 * Received response 2: 200
 * All requests completed!
 * ─────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - How does fork() differ from spawn()?
 * - What is IPC (Inter-Process Communication)?
 * - How do you send messages between parent and child?
 * - What is a worker pool and why is it useful?
 * - When should you use fork() vs other methods?
 *
 * Key Takeaways:
 * 1. fork() creates a new Node.js process
 * 2. IPC channel is established automatically
 * 3. Use process.send() to send messages
 * 4. Listen with process.on('message', handler)
 * 5. fork() is only for Node.js-to-Node.js communication
 * 6. Perfect for offloading CPU-intensive tasks
 * 7. Worker pools provide better resource management
 * 8. Always handle worker crashes and restart them
 */
