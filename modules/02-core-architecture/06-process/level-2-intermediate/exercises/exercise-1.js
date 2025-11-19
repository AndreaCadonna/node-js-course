/**
 * Exercise 1: HTTP Server with Graceful Shutdown
 * ===============================================
 *
 * Difficulty: Medium
 *
 * Task:
 * Create an HTTP server that implements graceful shutdown when receiving
 * termination signals (SIGTERM, SIGINT). The server should properly close
 * existing connections and clean up resources before exiting.
 *
 * Requirements:
 * 1. Create a basic HTTP server that handles requests
 * 2. Implement signal handlers for SIGTERM and SIGINT
 * 3. Track active connections
 * 4. Implement graceful shutdown that:
 *    - Stops accepting new connections
 *    - Waits for existing connections to complete
 *    - Times out after a maximum wait period
 *    - Logs shutdown progress
 * 5. Handle cleanup of resources before exit
 *
 * Learning Goals:
 * - Understanding process signals (SIGTERM, SIGINT)
 * - Implementing graceful shutdown patterns
 * - Managing server lifecycle
 * - Resource cleanup and connection tracking
 * - Using process.exit() appropriately
 *
 * Test:
 * 1. Run the server
 * 2. Make some requests (curl http://localhost:3000)
 * 3. Press Ctrl+C to trigger shutdown
 * 4. Observe graceful shutdown behavior
 *
 * Run: node exercise-1.js
 */

const http = require('http');

// Configuration
const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT = 10000; // 10 seconds

// Server state
let server;
let activeConnections = new Set();
let isShuttingDown = false;

/**
 * TODO 1: Implement request handler
 *
 * The handler should:
 * 1. Check if server is shutting down (respond with 503 if true)
 * 2. Simulate some work with setTimeout (1-3 seconds)
 * 3. Respond with a success message
 * 4. Log each request
 *
 * Hint: Use Math.random() to vary the response time
 */
function handleRequest(req, res) {
  console.log(`📨 Received ${req.method} ${req.url}`);

  // TODO: Check if shutting down and respond with 503 if true
  // if (isShuttingDown) {
  //   res.writeHead(503, { 'Content-Type': 'text/plain' });
  //   res.end('Server is shutting down');
  //   return;
  // }

  // TODO: Simulate work (1-3 seconds)
  // const workTime = Math.random() * 2000 + 1000;

  // TODO: Use setTimeout to simulate async work
  // setTimeout(() => {
  //   res.writeHead(200, { 'Content-Type': 'application/json' });
  //   res.end(JSON.stringify({
  //     message: 'Success',
  //     timestamp: new Date().toISOString(),
  //     processUptime: process.uptime()
  //   }));
  //   console.log(`✅ Completed ${req.method} ${req.url}`);
  // }, workTime);
}

/**
 * TODO 2: Implement connection tracking
 *
 * Track connections so we can wait for them during shutdown:
 * 1. Listen to 'connection' event on server
 * 2. Add socket to activeConnections Set
 * 3. Listen to socket 'close' event
 * 4. Remove socket from activeConnections when closed
 *
 * Hint: Sockets should be tracked in the activeConnections Set
 */
function setupConnectionTracking(server) {
  // TODO: Implement connection tracking
  // server.on('connection', (socket) => {
  //   activeConnections.add(socket);
  //   socket.on('close', () => {
  //     activeConnections.delete(socket);
  //   });
  // });
}

/**
 * TODO 3: Implement graceful shutdown
 *
 * Steps:
 * 1. Set isShuttingDown flag to true
 * 2. Log shutdown initiation
 * 3. Stop server from accepting new connections (server.close())
 * 4. Set up shutdown timeout
 * 5. Wait for active connections to complete
 * 6. Log final statistics
 * 7. Exit with code 0
 *
 * Handle two cases:
 * - All connections complete naturally
 * - Timeout expires (force close remaining connections)
 */
function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal} - Starting graceful shutdown...`);

  // TODO: Set shutting down flag
  // isShuttingDown = true;

  // TODO: Stop accepting new connections
  // server.close(() => {
  //   console.log('✅ Server closed - no longer accepting connections');
  //   console.log(`📊 Shutdown complete after ${process.uptime().toFixed(2)}s uptime`);
  //   process.exit(0);
  // });

  // TODO: Log active connections
  // console.log(`⏳ Waiting for ${activeConnections.size} active connection(s) to complete...`);

  // TODO: Set up timeout
  // const timeout = setTimeout(() => {
  //   console.log(`⚠️  Shutdown timeout reached - forcing closure`);
  //   console.log(`⚠️  Terminating ${activeConnections.size} remaining connection(s)`);
  //
  //   // Force close remaining connections
  //   for (const socket of activeConnections) {
  //     socket.destroy();
  //   }
  //
  //   process.exit(0);
  // }, SHUTDOWN_TIMEOUT);

  // TODO: Allow process to exit naturally if connections complete
  // timeout.unref();
}

/**
 * TODO 4: Set up signal handlers
 *
 * Set up handlers for:
 * 1. SIGTERM - Termination signal (kill command)
 * 2. SIGINT - Interrupt signal (Ctrl+C)
 *
 * Both should call gracefulShutdown with the signal name
 */
function setupSignalHandlers() {
  // TODO: Handle SIGTERM
  // process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // TODO: Handle SIGINT
  // process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

/**
 * TODO 5: Start the server
 *
 * Steps:
 * 1. Create HTTP server with handleRequest
 * 2. Set up connection tracking
 * 3. Set up signal handlers
 * 4. Start listening on PORT
 * 5. Log startup information
 */
function startServer() {
  console.log('🚀 Starting HTTP Server...\n');

  // TODO: Create server
  // server = http.createServer(handleRequest);

  // TODO: Set up connection tracking
  // setupConnectionTracking(server);

  // TODO: Set up signal handlers
  // setupSignalHandlers();

  // TODO: Start listening
  // server.listen(PORT, () => {
  //   console.log('════════════════════════════════════════');
  //   console.log(`✅ Server running on http://localhost:${PORT}`);
  //   console.log('════════════════════════════════════════');
  //   console.log('📝 Try these commands:');
  //   console.log(`   curl http://localhost:${PORT}`);
  //   console.log(`   curl http://localhost:${PORT}/api/status`);
  //   console.log('\n🛑 Press Ctrl+C to trigger graceful shutdown\n');
  // });
}

// Start the server
// TODO: Uncomment when ready to test
// startServer();

// =============================================================================
// Expected Behavior:
// =============================================================================

/**
 * Normal operation:
 * 1. Server starts and listens on port 3000
 * 2. Accepts and processes requests (with 1-3 second delay)
 * 3. Tracks active connections
 *
 * During shutdown (Ctrl+C):
 * 1. Logs "Received SIGINT - Starting graceful shutdown..."
 * 2. Stops accepting new connections (503 response)
 * 3. Waits for active connections to complete
 * 4. Logs completion or timeout
 * 5. Exits cleanly
 *
 * If connections take too long:
 * 1. Timeout triggers after 10 seconds
 * 2. Force closes remaining connections
 * 3. Exits with code 0
 */

// =============================================================================
// Hints:
// =============================================================================

/**
 * Hint 1: Checking shutdown status
 * At the start of handleRequest, check:
 * if (isShuttingDown) {
 *   res.writeHead(503, { 'Content-Type': 'text/plain' });
 *   res.end('Server is shutting down');
 *   return;
 * }
 *
 * Hint 2: Connection tracking
 * Use a Set to track sockets:
 * server.on('connection', (socket) => {
 *   activeConnections.add(socket);
 *   socket.on('close', () => activeConnections.delete(socket));
 * });
 *
 * Hint 3: Graceful shutdown
 * server.close() stops accepting new connections but waits for existing ones.
 * The callback fires when all connections are closed.
 *
 * Hint 4: Timeout handling
 * Use setTimeout and destroy() to force-close sockets:
 * for (const socket of activeConnections) {
 *   socket.destroy();
 * }
 *
 * Hint 5: Signal handlers
 * Use process.on() to listen for signals:
 * process.on('SIGINT', () => { /* shutdown logic */ });
 * process.on('SIGTERM', () => { /* shutdown logic */ });
 */

// =============================================================================
// Testing Tips:
// =============================================================================

/**
 * Test 1: Normal operation
 * $ node exercise-1.js
 * $ curl http://localhost:3000
 *
 * Test 2: Multiple concurrent requests
 * $ for i in {1..5}; do curl http://localhost:3000 & done
 *
 * Test 3: Graceful shutdown
 * $ curl http://localhost:3000 &  # Start a request
 * $ # Immediately press Ctrl+C
 * $ # Observe that the request completes before shutdown
 *
 * Test 4: Shutdown during load
 * $ while true; do curl http://localhost:3000; sleep 0.5; done
 * $ # In another terminal: kill -SIGTERM <pid>
 */
