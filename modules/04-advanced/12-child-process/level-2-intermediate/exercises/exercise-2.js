/**
 * EXERCISE 2: IPC Messaging System
 *
 * Difficulty: Intermediate
 * Estimated time: 35-45 minutes
 *
 * OBJECTIVE:
 * Build a message broker that coordinates communication between a parent
 * process and multiple worker processes using advanced IPC patterns.
 *
 * REQUIREMENTS:
 * 1. Create a MessageBroker class that manages multiple workers
 * 2. Implement request-response pattern with message IDs
 * 3. Support broadcasting messages to all workers
 * 4. Implement message routing to specific workers
 * 5. Handle timeouts for requests (5 seconds)
 * 6. Track and report message statistics
 *
 * INSTRUCTIONS:
 * Implement the MessageBroker class with these methods:
 * - addWorker(workerScript): Add a new worker to the broker
 * - request(workerId, message): Send request to specific worker, get response
 * - broadcast(message): Send message to all workers
 * - getStats(): Return messaging statistics
 *
 * You'll also need to create a simple worker script that the broker uses.
 *
 * TESTING:
 * Run: node exercise-2.js
 */

const { fork } = require('child_process');
const fs = require('fs');

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
   * @param {string} workerScript - Path to worker script
   * @returns {number} Worker ID
   */
  addWorker(workerScript) {
    // TODO: Implement this method
    // Hints:
    // 1. Fork the worker script
    // 2. Assign it an ID
    // 3. Set up message handler
    // 4. Store in this.workers array
    // 5. Return the worker ID

    throw new Error('Not implemented');
  }

  /**
   * Send a request to a specific worker and wait for response
   * @param {number} workerId - ID of the target worker
   * @param {Object} message - Message to send
   * @param {number} timeout - Timeout in milliseconds (default: 5000)
   * @returns {Promise<any>} Response from worker
   */
  request(workerId, message, timeout = 5000) {
    // TODO: Implement this method
    // Hints:
    // 1. Generate unique request ID
    // 2. Create promise with resolve/reject
    // 3. Store in pendingRequests map
    // 4. Send message with ID to worker
    // 5. Set up timeout
    // 6. Return promise

    throw new Error('Not implemented');
  }

  /**
   * Broadcast a message to all workers
   * @param {Object} message - Message to broadcast
   * @returns {Promise<number>} Number of workers that received the message
   */
  broadcast(message) {
    // TODO: Implement this method
    // Hints:
    // 1. Loop through all workers
    // 2. Send message to each
    // 3. Increment broadcast counter
    // 4. Return count of workers

    throw new Error('Not implemented');
  }

  /**
   * Get messaging statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Shutdown all workers
   */
  shutdown() {
    // TODO: Implement this method
    // Kill all workers gracefully

    throw new Error('Not implemented');
  }
}

// ============================================================================
// TEST CODE - DO NOT MODIFY BELOW THIS LINE
// ============================================================================

// Create a simple test worker
const testWorkerPath = '/tmp/broker-test-worker.js';
const testWorkerCode = `
let messageCount = 0;

process.on('message', (msg) => {
  if (msg.type === 'broadcast') {
    // Just acknowledge broadcast
    messageCount++;
  } else if (msg.type === 'ping') {
    // Respond to ping
    process.send({
      id: msg.id,
      type: 'pong',
      workerId: process.pid
    });
  } else if (msg.type === 'echo') {
    // Echo back the data
    process.send({
      id: msg.id,
      type: 'echo-response',
      data: msg.data
    });
  } else if (msg.type === 'slow-response') {
    // Simulate slow response
    setTimeout(() => {
      process.send({
        id: msg.id,
        type: 'slow-response',
        completed: true
      });
    }, msg.delay || 1000);
  } else if (msg.type === 'get-stats') {
    process.send({
      id: msg.id,
      type: 'stats',
      messageCount
    });
  }
});
`;

fs.writeFileSync(testWorkerPath, testWorkerCode);

async function runTests() {
  console.log('=== Exercise 2: IPC Messaging System ===\n');

  const broker = new MessageBroker();

  // Test 1: Add workers
  console.log('Test 1: Add workers to broker');
  try {
    const worker1Id = broker.addWorker(testWorkerPath);
    const worker2Id = broker.addWorker(testWorkerPath);
    const worker3Id = broker.addWorker(testWorkerPath);

    console.log(`  Added workers: ${worker1Id}, ${worker2Id}, ${worker3Id}`);

    if (broker.workers.length === 3) {
      console.log('  ✓ All workers added successfully\n');
    } else {
      console.log(`  ✗ Expected 3 workers, got ${broker.workers.length}\n`);
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 2: Request-response pattern
  console.log('Test 2: Send request to specific worker');
  try {
    const response = await broker.request(0, {
      type: 'ping'
    });

    console.log('  Response received:', response);

    if (response && response.type === 'pong') {
      console.log('  ✓ Request-response working\n');
    } else {
      console.log('  ✗ Invalid response received\n');
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 3: Echo test
  console.log('Test 3: Echo test with data');
  try {
    const testData = { message: 'Hello, Worker!' };
    const response = await broker.request(1, {
      type: 'echo',
      data: testData
    });

    console.log('  Sent:', testData);
    console.log('  Received:', response.data);

    if (response.data.message === testData.message) {
      console.log('  ✓ Data echoed correctly\n');
    } else {
      console.log('  ✗ Echo data mismatch\n');
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 4: Broadcasting
  console.log('Test 4: Broadcast message to all workers');
  try {
    const count = await broker.broadcast({
      type: 'broadcast',
      data: 'Message to all workers'
    });

    console.log(`  Broadcast sent to ${count} workers`);

    if (count === 3) {
      console.log('  ✓ Broadcast successful\n');
    } else {
      console.log(`  ✗ Expected broadcast to 3 workers, got ${count}\n`);
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 5: Timeout handling
  console.log('Test 5: Timeout handling');
  try {
    // This should timeout because worker takes 10 seconds
    await broker.request(0, {
      type: 'slow-response',
      delay: 10000
    }, 2000); // 2 second timeout

    console.log('  ✗ Should have timed out\n');
  } catch (error) {
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      console.log('  ✓ Timeout handled correctly\n');
    } else {
      console.log('  ✗ Wrong error:', error.message);
      console.log();
    }
  }

  // Test 6: Statistics
  console.log('Test 6: Message statistics');
  try {
    const stats = broker.getStats();
    console.log('  Statistics:', stats);

    if (stats.messagesSent > 0) {
      console.log('  ✓ Statistics tracked\n');
    } else {
      console.log('  ✗ Statistics not updated\n');
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 7: Multiple concurrent requests
  console.log('Test 7: Concurrent requests to different workers');
  try {
    const requests = [
      broker.request(0, { type: 'echo', data: 'Request 1' }),
      broker.request(1, { type: 'echo', data: 'Request 2' }),
      broker.request(2, { type: 'echo', data: 'Request 3' })
    ];

    const responses = await Promise.all(requests);

    console.log(`  Received ${responses.length} responses`);

    if (responses.length === 3 && responses.every(r => r.type === 'echo-response')) {
      console.log('  ✓ Concurrent requests handled\n');
    } else {
      console.log('  ✗ Some requests failed\n');
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Cleanup
  broker.shutdown();
  fs.unlinkSync(testWorkerPath);

  console.log('=== Tests Complete ===');
  console.log('\nHINTS:');
  console.log('- Use fork() to create workers');
  console.log('- Assign unique IDs to track workers');
  console.log('- Use Map to track pending requests by ID');
  console.log('- Use setTimeout for request timeouts');
  console.log('- Handle worker message events to route responses');
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = MessageBroker;
