/**
 * Example 2: Advanced IPC with Handle Passing
 *
 * Demonstrates advanced inter-process communication patterns:
 * - TCP server handle passing
 * - Socket distribution to workers
 * - Shared server ports
 * - Load balancing across workers
 * - Performance comparison
 */

const { fork } = require('child_process');
const net = require('net');
const http = require('http');

console.log('=== Advanced IPC Example ===\n');

/**
 * Demo 1: TCP Handle Passing
 * Shows how to pass TCP server handles to workers
 */
async function demo1_handlePassing() {
  console.log('--- Demo 1: TCP Handle Passing ---\n');

  // Create temporary worker file
  const fs = require('fs');
  const path = require('path');

  const workerCode = `
const net = require('net');

let connectionCount = 0;

process.on('message', (msg, handle) => {
  if (msg === 'server') {
    console.log(\`Worker \${process.pid} received server handle\`);

    handle.on('connection', (socket) => {
      connectionCount++;
      console.log(\`Worker \${process.pid} handling connection #\${connectionCount}\`);

      socket.write(\`Handled by worker \${process.pid}\\n\`);
      socket.pipe(socket);
    });
  }
});

console.log(\`Worker \${process.pid} ready\`);
`;

  const workerPath = path.join(__dirname, 'temp-handle-worker.js');
  fs.writeFileSync(workerPath, workerCode);

  // Create workers
  const workers = [];
  for (let i = 0; i < 3; i++) {
    const worker = fork(workerPath);
    workers.push(worker);
  }

  console.log('Created 3 workers\n');

  // Create TCP server
  const server = net.createServer();

  server.on('connection', (socket) => {
    // This won't be called when handles are passed
    console.log('Main process handling connection');
    socket.end('Handled by main process\n');
  });

  server.listen(8000, () => {
    console.log('TCP server listening on port 8000');
    console.log('Passing server handle to workers...\n');

    // Pass server handle to all workers
    workers.forEach((worker, index) => {
      worker.send('server', server);
    });

    // Simulate some connections
    setTimeout(() => {
      console.log('\nSimulating client connections...\n');

      for (let i = 0; i < 9; i++) {
        setTimeout(() => {
          const client = net.connect(8000, () => {
            client.write(`Request ${i + 1}\n`);
          });

          client.on('data', (data) => {
            console.log(`Response: ${data.toString().trim()}`);
            client.end();
          });
        }, i * 100);
      }

      // Cleanup
      setTimeout(() => {
        server.close();
        workers.forEach(w => w.kill());
        fs.unlinkSync(workerPath);
        console.log('\nDemo 1 complete\n');
      }, 2000);
    }, 500);
  });

  // Wait for cleanup
  await new Promise(resolve => setTimeout(resolve, 3000));
}

/**
 * Demo 2: HTTP Server with Socket Sharing
 * Shows how to share an HTTP server across workers
 */
async function demo2_socketSharing() {
  console.log('--- Demo 2: HTTP Server Socket Sharing ---\n');

  const fs = require('fs');
  const path = require('path');

  const workerCode = `
const http = require('http');

let requestCount = 0;

process.on('message', (msg, handle) => {
  if (msg === 'server') {
    const server = http.createServer((req, res) => {
      requestCount++;

      const response = {
        message: 'Hello from worker',
        workerId: process.pid,
        requestNumber: requestCount,
        timestamp: Date.now()
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response, null, 2));

      console.log(\`Worker \${process.pid} handled request #\${requestCount}\`);
    });

    // Listen on the shared handle
    server.listen(handle);
    console.log(\`Worker \${process.pid} listening on shared socket\`);
  }
});

console.log(\`HTTP Worker \${process.pid} ready\`);
`;

  const workerPath = path.join(__dirname, 'temp-http-worker.js');
  fs.writeFileSync(workerPath, workerCode);

  // Create workers
  const workers = [];
  for (let i = 0; i < 4; i++) {
    const worker = fork(workerPath);
    workers.push(worker);
  }

  console.log('Created 4 HTTP workers\n');

  // Create shared socket
  const server = net.createServer();

  server.listen(8001, () => {
    console.log('HTTP server listening on port 8001');
    console.log('Sharing socket with workers...\n');

    // Pass the server handle to each worker
    workers.forEach((worker) => {
      worker.send('server', server._handle);
    });

    // Close the main server (workers will handle requests)
    server.close();

    // Make some HTTP requests
    setTimeout(async () => {
      console.log('Making HTTP requests...\n');

      const http = require('http');

      for (let i = 0; i < 12; i++) {
        await new Promise((resolve) => {
          setTimeout(() => {
            const req = http.request({
              hostname: 'localhost',
              port: 8001,
              path: '/',
              method: 'GET'
            }, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                const response = JSON.parse(data);
                console.log(`Request ${i + 1} → Worker ${response.workerId} (req #${response.requestNumber})`);
                resolve();
              });
            });

            req.on('error', console.error);
            req.end();
          }, i * 100);
        });
      }

      // Cleanup
      setTimeout(() => {
        workers.forEach(w => w.kill());
        fs.unlinkSync(workerPath);
        console.log('\nDemo 2 complete\n');
      }, 500);
    }, 500);
  });

  // Wait for cleanup
  await new Promise(resolve => setTimeout(resolve, 3000));
}

/**
 * Demo 3: Advanced Message Passing Patterns
 * Shows request-response and pub-sub patterns
 */
async function demo3_messagePatterns() {
  console.log('--- Demo 3: Advanced Message Patterns ---\n');

  const fs = require('fs');
  const path = require('path');

  const workerCode = `
const subscriptions = new Set();

process.on('message', (msg) => {
  if (msg.type === 'subscribe') {
    subscriptions.add(msg.topic);
    console.log(\`Worker \${process.pid} subscribed to \${msg.topic}\`);

    process.send({
      type: 'subscription_confirmed',
      topic: msg.topic
    });
  } else if (msg.type === 'publish') {
    if (subscriptions.has(msg.topic)) {
      console.log(\`Worker \${process.pid} received: [\${msg.topic}] \${msg.data}\`);

      // Process the message
      const result = {
        type: 'processing_complete',
        topic: msg.topic,
        originalData: msg.data,
        processedBy: process.pid,
        timestamp: Date.now()
      };

      setTimeout(() => {
        process.send(result);
      }, Math.random() * 100);
    }
  } else if (msg.type === 'request') {
    // Handle request-response pattern
    const response = {
      type: 'response',
      requestId: msg.requestId,
      data: {
        request: msg.data,
        response: \`Processed by \${process.pid}\`,
        timestamp: Date.now()
      }
    };

    setTimeout(() => {
      process.send(response);
    }, Math.random() * 200);
  }
});

console.log(\`Pattern Worker \${process.pid} ready\`);
`;

  const workerPath = path.join(__dirname, 'temp-pattern-worker.js');
  fs.writeFileSync(workerPath, workerCode);

  // Create workers
  const workers = [];
  for (let i = 0; i < 3; i++) {
    const worker = fork(workerPath);

    worker.on('message', (msg) => {
      if (msg.type === 'subscription_confirmed') {
        console.log(`✓ Subscription confirmed: ${msg.topic}`);
      } else if (msg.type === 'processing_complete') {
        console.log(`✓ Processing complete: [${msg.topic}] by ${msg.processedBy}`);
      } else if (msg.type === 'response') {
        console.log(`✓ Response to request ${msg.requestId}: ${msg.data.response}`);
      }
    });

    workers.push(worker);
  }

  console.log('Created 3 workers for message patterns\n');

  // Demo pub-sub pattern
  console.log('Setting up pub-sub subscriptions...\n');

  workers[0].send({ type: 'subscribe', topic: 'news' });
  workers[0].send({ type: 'subscribe', topic: 'sports' });
  workers[1].send({ type: 'subscribe', topic: 'news' });
  workers[2].send({ type: 'subscribe', topic: 'sports' });

  await new Promise(resolve => setTimeout(resolve, 200));

  console.log('\nPublishing messages...\n');

  workers.forEach(w => {
    w.send({ type: 'publish', topic: 'news', data: 'Breaking news!' });
    w.send({ type: 'publish', topic: 'sports', data: 'Game results' });
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  // Demo request-response pattern
  console.log('\nSending requests...\n');

  let requestId = 0;
  for (const worker of workers) {
    worker.send({
      type: 'request',
      requestId: ++requestId,
      data: `Request ${requestId}`
    });
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  // Cleanup
  workers.forEach(w => w.kill());
  fs.unlinkSync(workerPath);

  console.log('\nDemo 3 complete\n');
}

/**
 * Demo 4: Load Balancing with Handle Passing
 * Shows how to implement load balancing across workers
 */
async function demo4_loadBalancing() {
  console.log('--- Demo 4: Load Balancing ---\n');

  const fs = require('fs');
  const path = require('path');

  const workerCode = `
const http = require('http');

let requestCount = 0;
let totalProcessingTime = 0;

process.on('message', (msg, handle) => {
  if (msg === 'server') {
    const server = http.createServer(async (req, res) => {
      const startTime = Date.now();
      requestCount++;

      // Simulate variable processing time
      const processingTime = Math.random() * 200;
      await new Promise(resolve => setTimeout(resolve, processingTime));

      totalProcessingTime += processingTime;

      const response = {
        workerId: process.pid,
        requestNumber: requestCount,
        processingTime: Math.round(processingTime),
        avgProcessingTime: Math.round(totalProcessingTime / requestCount)
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    });

    server.listen(handle);
  } else if (msg.type === 'get_stats') {
    process.send({
      type: 'stats',
      workerId: process.pid,
      requestCount,
      avgProcessingTime: requestCount > 0 ? Math.round(totalProcessingTime / requestCount) : 0
    });
  }
});

console.log(\`Load Balancer Worker \${process.pid} ready\`);
`;

  const workerPath = path.join(__dirname, 'temp-lb-worker.js');
  fs.writeFileSync(workerPath, workerCode);

  // Create workers
  const workerCount = 4;
  const workers = [];

  for (let i = 0; i < workerCount; i++) {
    const worker = fork(workerPath);
    worker.on('message', (msg) => {
      if (msg.type === 'stats') {
        console.log(`  Worker ${msg.workerId}: ${msg.requestCount} requests, avg ${msg.avgProcessingTime}ms`);
      }
    });
    workers.push(worker);
  }

  console.log(`Created ${workerCount} workers for load balancing\n`);

  // Create server and share handle
  const server = net.createServer();

  server.listen(8002, async () => {
    console.log('Load balancer listening on port 8002\n');

    // Share handle with all workers
    workers.forEach(worker => {
      worker.send('server', server._handle);
    });

    server.close();

    // Make many requests
    console.log('Making 20 requests...\n');

    const http = require('http');
    const results = [];

    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => {
        setTimeout(() => {
          const req = http.request({
            hostname: 'localhost',
            port: 8002,
            method: 'GET'
          }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              const response = JSON.parse(data);
              results.push(response);
              console.log(`Request ${i + 1} → Worker ${response.workerId} (${response.processingTime}ms)`);
              resolve();
            });
          });
          req.on('error', console.error);
          req.end();
        }, i * 50);
      });
    }

    // Get statistics
    console.log('\nWorker Statistics:');
    workers.forEach(w => w.send({ type: 'get_stats' }));

    await new Promise(resolve => setTimeout(resolve, 500));

    // Analyze load distribution
    console.log('\nLoad Distribution:');
    const workerRequests = {};
    results.forEach(r => {
      workerRequests[r.workerId] = (workerRequests[r.workerId] || 0) + 1;
    });

    Object.entries(workerRequests).forEach(([pid, count]) => {
      const percentage = ((count / results.length) * 100).toFixed(1);
      console.log(`  Worker ${pid}: ${count} requests (${percentage}%)`);
    });

    // Cleanup
    workers.forEach(w => w.kill());
    fs.unlinkSync(workerPath);

    console.log('\nDemo 4 complete\n');
  });

  await new Promise(resolve => setTimeout(resolve, 4000));
}

/**
 * Run all demos
 */
async function runAllDemos() {
  try {
    await demo1_handlePassing();
    await demo2_socketSharing();
    await demo3_messagePatterns();
    await demo4_loadBalancing();

    console.log('=== All Advanced IPC Demos Complete ===\n');

    console.log('Key Takeaways:');
    console.log('✓ Handle passing allows sharing TCP/HTTP servers across processes');
    console.log('✓ Multiple workers can listen on the same port via handle sharing');
    console.log('✓ OS kernel does automatic load balancing for shared handles');
    console.log('✓ Pub-sub and request-response patterns enhance IPC flexibility');
    console.log('✓ Handle passing is more efficient than proxying connections');
    console.log('✓ Workers can be added/removed without downtime');
  } catch (error) {
    console.error('Demo error:', error);
  }
}

// Run demos
if (require.main === module) {
  runAllDemos().catch(console.error);
}

module.exports = {
  demo1_handlePassing,
  demo2_socketSharing,
  demo3_messagePatterns,
  demo4_loadBalancing
};
