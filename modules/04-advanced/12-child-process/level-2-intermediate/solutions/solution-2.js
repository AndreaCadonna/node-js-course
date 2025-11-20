/**
 * SOLUTION 2: IPC Messaging System
 *
 * This solution demonstrates:
 * - Managing multiple worker processes
 * - Request-response pattern with IPC
 * - Message broadcasting
 * - Timeout handling
 * - Message routing
 */

const { fork } = require('child_process');

class MessageBroker {
  constructor() {
    this.workers = [];
    this.pendingRequests = new Map();
    this.nextRequestId = 1;
    this.stats = {
      messagesSent: 0,
      messagesReceived: 0,
      broadcasts: 0,
      timeouts: 0
    };
  }

  /**
   * Add a worker to the broker
   */
  addWorker(workerScript) {
    const workerId = this.workers.length;
    const process = fork(workerScript);

    const worker = {
      id: workerId,
      process,
      connected: true
    };

    // Set up message handler
    process.on('message', (msg) => {
      this.handleMessage(worker, msg);
    });

    // Handle disconnect
    process.on('disconnect', () => {
      worker.connected = false;
    });

    // Handle exit
    process.on('exit', () => {
      worker.connected = false;
    });

    this.workers.push(worker);
    return workerId;
  }

  /**
   * Handle incoming message from worker
   */
  handleMessage(worker, msg) {
    this.stats.messagesReceived++;

    // Check if this is a response to a pending request
    if (msg.id !== undefined) {
      const pending = this.pendingRequests.get(msg.id);
      if (pending) {
        clearTimeout(pending.timeoutId);
        this.pendingRequests.delete(msg.id);
        pending.resolve(msg);
      }
    }
  }

  /**
   * Send a request to a specific worker
   */
  request(workerId, message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const worker = this.workers[workerId];

      if (!worker || !worker.connected) {
        return reject(new Error(`Worker ${workerId} not available`));
      }

      // Generate unique request ID
      const id = this.nextRequestId++;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          this.stats.timeouts++;
          reject(new Error('Request timeout'));
        }
      }, timeout);

      // Store pending request
      this.pendingRequests.set(id, { resolve, reject, timeoutId });

      // Send message with ID
      worker.process.send({ ...message, id });
      this.stats.messagesSent++;
    });
  }

  /**
   * Broadcast a message to all workers
   */
  broadcast(message) {
    let count = 0;

    this.workers.forEach(worker => {
      if (worker.connected) {
        worker.process.send(message);
        this.stats.messagesSent++;
        count++;
      }
    });

    this.stats.broadcasts++;
    return Promise.resolve(count);
  }

  /**
   * Get messaging statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Shutdown all workers
   */
  shutdown() {
    this.workers.forEach(worker => {
      if (worker.process && !worker.process.killed) {
        worker.process.kill();
      }
    });

    this.workers = [];
    this.pendingRequests.clear();
  }
}

module.exports = MessageBroker;

// Demo if run directly
if (require.main === module) {
  const fs = require('fs');

  // Create demo worker
  const demoWorkerPath = '/tmp/demo-broker-worker.js';
  fs.writeFileSync(demoWorkerPath, `
process.on('message', (msg) => {
  if (msg.type === 'ping') {
    process.send({ id: msg.id, type: 'pong', timestamp: Date.now() });
  } else if (msg.type === 'echo') {
    process.send({ id: msg.id, type: 'echo-response', data: msg.data });
  }
});
  `);

  async function demo() {
    console.log('=== Solution 2 Demo ===\n');

    const broker = new MessageBroker();

    // Add workers
    console.log('Adding 3 workers...');
    broker.addWorker(demoWorkerPath);
    broker.addWorker(demoWorkerPath);
    broker.addWorker(demoWorkerPath);

    // Send request
    console.log('\nSending ping request...');
    const response = await broker.request(0, { type: 'ping' });
    console.log('Response:', response);

    // Broadcast
    console.log('\nBroadcasting message...');
    const count = await broker.broadcast({ type: 'broadcast', data: 'Hello all!' });
    console.log(`Broadcast to ${count} workers`);

    // Stats
    console.log('\nStatistics:', broker.getStats());

    // Cleanup
    broker.shutdown();
    fs.unlinkSync(demoWorkerPath);

    console.log('\n=== Demo Complete ===');
  }

  demo().catch(console.error);
}
