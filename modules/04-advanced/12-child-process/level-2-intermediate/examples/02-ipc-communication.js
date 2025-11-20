/**
 * EXAMPLE 2: Advanced IPC Communication
 *
 * This example demonstrates:
 * - Request-response patterns
 * - Broadcasting to multiple workers
 * - Message queuing
 * - Error handling in IPC
 * - Heartbeat/keep-alive patterns
 */

const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== Advanced IPC Communication Examples ===\n');

// Create worker scripts for the examples
const workerScripts = {
  calculator: '/tmp/calculator-worker.js',
  echo: '/tmp/echo-worker.js',
  processor: '/tmp/processor-worker.js'
};

// Calculator worker
fs.writeFileSync(workerScripts.calculator, `
process.on('message', (msg) => {
  const { id, operation, a, b } = msg;

  let result;
  switch (operation) {
    case 'add': result = a + b; break;
    case 'subtract': result = a - b; break;
    case 'multiply': result = a * b; break;
    case 'divide': result = a / b; break;
    default: result = null;
  }

  process.send({ id, result });
});
`);

// Echo worker with heartbeat
fs.writeFileSync(workerScripts.echo, `
let messageCount = 0;

process.on('message', (msg) => {
  if (msg.type === 'heartbeat') {
    process.send({ type: 'heartbeat-response', timestamp: Date.now() });
  } else if (msg.type === 'echo') {
    messageCount++;
    process.send({
      type: 'echo-response',
      id: msg.id,
      data: msg.data,
      count: messageCount
    });
  } else if (msg.type === 'stats') {
    process.send({ type: 'stats-response', messageCount });
  }
});
`);

// Data processor worker
fs.writeFileSync(workerScripts.processor, `
process.on('message', (msg) => {
  const { id, data } = msg;

  // Simulate processing
  setTimeout(() => {
    const processed = {
      id,
      original: data,
      processed: data.toUpperCase(),
      length: data.length,
      timestamp: Date.now()
    };

    process.send({ type: 'result', data: processed });
  }, Math.random() * 1000);
});
`);

// Example 1: Request-Response Pattern
function requestResponsePattern() {
  console.log('1. Request-Response Pattern');
  console.log('   Implementing async request-response with calculator\n');

  const worker = fork(workerScripts.calculator);
  const pendingRequests = new Map();
  let requestId = 0;

  // Helper to send requests
  function calculate(operation, a, b) {
    return new Promise((resolve, reject) => {
      const id = ++requestId;
      pendingRequests.set(id, { resolve, reject });

      worker.send({ id, operation, a, b });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (pendingRequests.has(id)) {
          pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 5000);
    });
  }

  // Handle responses
  worker.on('message', (msg) => {
    const { id, result } = msg;
    const pending = pendingRequests.get(id);

    if (pending) {
      pendingRequests.delete(id);
      pending.resolve(result);
    }
  });

  // Make several requests
  (async () => {
    try {
      const r1 = await calculate('add', 5, 3);
      console.log(`   5 + 3 = ${r1}`);

      const r2 = await calculate('multiply', 7, 6);
      console.log(`   7 * 6 = ${r2}`);

      const r3 = await calculate('divide', 100, 4);
      console.log(`   100 / 4 = ${r3}`);

      console.log('   All calculations completed\n');
      worker.kill();
      example2();
    } catch (error) {
      console.error('   Error:', error.message);
      worker.kill();
    }
  })();
}

// Example 2: Broadcasting to Multiple Workers
function example2() {
  console.log('2. Broadcasting to Multiple Workers');
  console.log('   Sending messages to worker pool\n');

  const numWorkers = 3;
  const workers = [];

  // Create worker pool
  for (let i = 0; i < numWorkers; i++) {
    const worker = fork(workerScripts.echo);
    worker.workerId = i;

    worker.on('message', (msg) => {
      if (msg.type === 'echo-response') {
        console.log(`   Worker ${worker.workerId} echoed: "${msg.data}" (count: ${msg.count})`);
      }
    });

    workers.push(worker);
  }

  // Broadcast to all workers
  function broadcast(message) {
    workers.forEach(worker => {
      worker.send({
        type: 'echo',
        id: Date.now(),
        data: message
      });
    });
  }

  // Send some broadcasts
  broadcast('Hello from parent!');

  setTimeout(() => {
    broadcast('Second message');
  }, 100);

  setTimeout(() => {
    broadcast('Final message');
  }, 200);

  setTimeout(() => {
    console.log('\n   Shutting down workers');
    workers.forEach(w => w.kill());
    example3();
  }, 500);
}

// Example 3: Message Queue Pattern
function example3() {
  console.log('3. Message Queue Pattern');
  console.log('   Processing messages with worker pool\n');

  const poolSize = 2;
  const workers = [];
  const messageQueue = [];
  let processedCount = 0;
  const totalMessages = 5;

  // Create worker pool
  for (let i = 0; i < poolSize; i++) {
    const worker = fork(workerScripts.processor);
    workers.push({
      process: worker,
      busy: false
    });

    worker.on('message', (msg) => {
      if (msg.type === 'result') {
        processedCount++;
        console.log(`   Processed: "${msg.data.original}" -> "${msg.data.processed}"`);

        // Mark worker as available
        const w = workers.find(w => w.process === worker);
        w.busy = false;

        // Process next message
        processQueue();

        if (processedCount === totalMessages) {
          console.log(`\n   All ${totalMessages} messages processed`);
          workers.forEach(w => w.process.kill());
          example4();
        }
      }
    });
  }

  // Queue processor
  function processQueue() {
    const availableWorker = workers.find(w => !w.busy);

    if (availableWorker && messageQueue.length > 0) {
      const message = messageQueue.shift();
      availableWorker.busy = true;
      availableWorker.process.send(message);
      console.log(`   Queued: "${message.data}"`);
    }
  }

  // Add messages to queue
  function enqueue(data) {
    messageQueue.push({
      id: Date.now() + Math.random(),
      data
    });
    processQueue();
  }

  // Send messages
  enqueue('hello');
  enqueue('world');
  enqueue('from');
  enqueue('message');
  enqueue('queue');
}

// Example 4: Heartbeat Pattern
function example4() {
  console.log('\n4. Heartbeat/Keep-Alive Pattern');
  console.log('   Monitoring worker health\n');

  const worker = fork(workerScripts.echo);
  let lastHeartbeat = Date.now();
  let heartbeatInterval;

  worker.on('message', (msg) => {
    if (msg.type === 'heartbeat-response') {
      const latency = Date.now() - msg.timestamp;
      lastHeartbeat = Date.now();
      console.log(`   Heartbeat received (latency: ${latency}ms)`);
    }
  });

  // Send heartbeat every second
  heartbeatInterval = setInterval(() => {
    worker.send({ type: 'heartbeat' });

    // Check if worker is unresponsive
    const timeSinceLastBeat = Date.now() - lastHeartbeat;
    if (timeSinceLastBeat > 3000) {
      console.log('   Worker appears unresponsive!');
      clearInterval(heartbeatInterval);
      worker.kill();
      example5();
    }
  }, 1000);

  // Stop after 3 heartbeats
  setTimeout(() => {
    clearInterval(heartbeatInterval);
    worker.kill();
    console.log('   Worker terminated normally\n');
    example5();
  }, 3500);
}

// Example 5: Error Handling in IPC
function example5() {
  console.log('5. Error Handling in IPC');
  console.log('   Handling worker errors and crashes\n');

  // Create a worker that will crash
  const crashWorkerPath = '/tmp/crash-worker.js';
  fs.writeFileSync(crashWorkerPath, `
let messageCount = 0;

process.on('message', (msg) => {
  messageCount++;

  if (msg.crash) {
    // Simulate crash
    throw new Error('Worker crashed!');
  }

  process.send({ count: messageCount, msg });
});
  `);

  const worker = fork(crashWorkerPath);

  worker.on('message', (msg) => {
    console.log(`   Received message: count=${msg.count}`);
  });

  worker.on('error', (err) => {
    console.log(`   Worker error: ${err.message}`);
  });

  worker.on('exit', (code, signal) => {
    console.log(`   Worker exited: code=${code}, signal=${signal}`);

    if (code !== 0) {
      console.log('   Worker crashed, would restart in production');
    }

    example6();
  });

  // Send some messages
  worker.send({ data: 'message 1' });

  setTimeout(() => {
    worker.send({ data: 'message 2' });
  }, 100);

  setTimeout(() => {
    // This will crash the worker
    worker.send({ crash: true });
  }, 200);
}

// Example 6: Round-Robin Load Balancing
function example6() {
  console.log('\n6. Round-Robin Load Balancing');
  console.log('   Distributing work across workers\n');

  const poolSize = 3;
  const workers = [];
  let currentWorker = 0;

  // Create workers
  for (let i = 0; i < poolSize; i++) {
    const worker = fork(workerScripts.echo);
    worker.workerId = i;

    worker.on('message', (msg) => {
      if (msg.type === 'echo-response') {
        console.log(`   Worker ${worker.workerId}: message #${msg.count}`);
      }
    });

    workers.push(worker);
  }

  // Round-robin distribution
  function sendToNext(message) {
    const worker = workers[currentWorker];
    worker.send({
      type: 'echo',
      id: Date.now(),
      data: message
    });

    currentWorker = (currentWorker + 1) % workers.length;
  }

  // Send 9 messages (3 per worker in round-robin)
  for (let i = 1; i <= 9; i++) {
    setTimeout(() => {
      sendToNext(`Message ${i}`);

      if (i === 9) {
        setTimeout(() => {
          console.log('\n   Load balanced across all workers');
          workers.forEach(w => w.kill());
          cleanup();
        }, 200);
      }
    }, i * 50);
  }
}

// Cleanup and completion
function cleanup() {
  console.log('\n=== All Examples Completed ===');
}

// Start the examples
requestResponsePattern();
