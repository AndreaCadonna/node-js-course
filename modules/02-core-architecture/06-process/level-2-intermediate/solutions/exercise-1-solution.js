/**
 * SOLUTION: Exercise 1 - HTTP Server with Graceful Shutdown
 * ===========================================================
 *
 * This solution demonstrates professional implementation of graceful shutdown
 * for an HTTP server. It properly handles process signals, tracks active
 * connections, and ensures all requests complete before the process exits.
 *
 * KEY CONCEPTS DEMONSTRATED:
 * - Signal handling (SIGTERM, SIGINT)
 * - Connection tracking and management
 * - Graceful shutdown patterns
 * - HTTP server lifecycle management
 * - Timeout handling for forced shutdown
 * - Process exit codes
 *
 * PRODUCTION FEATURES:
 * - Rejects new connections during shutdown
 * - Waits for active connections to complete
 * - Implements shutdown timeout to prevent hanging
 * - Comprehensive logging of shutdown process
 * - Proper cleanup of resources
 * - Exit code 0 for clean shutdown
 */

const http = require('http');

// ============================================================================
// Configuration
// ============================================================================

const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT = 10000; // 10 seconds maximum wait for graceful shutdown

// ============================================================================
// Server State
// ============================================================================

let server;
let activeConnections = new Set();
let isShuttingDown = false;

// ============================================================================
// Request Handler
// ============================================================================

/**
 * Handles incoming HTTP requests
 *
 * This handler demonstrates:
 * - Checking shutdown state and rejecting requests with 503
 * - Simulating async work with setTimeout
 * - Providing useful response data
 * - Logging request lifecycle
 *
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 */
function handleRequest(req, res) {
  const requestStart = Date.now();
  console.log(`📨 Received ${req.method} ${req.url}`);

  // Reject new requests during shutdown
  if (isShuttingDown) {
    console.log(`⚠️  Rejected request (shutting down)`);
    res.writeHead(503, {
      'Content-Type': 'application/json',
      'Connection': 'close'
    });
    res.end(JSON.stringify({
      error: 'Service Unavailable',
      message: 'Server is shutting down',
      retry: false
    }));
    return;
  }

  // Simulate asynchronous work (1-3 seconds)
  // In a real application, this would be database queries, API calls, etc.
  const workTime = Math.random() * 2000 + 1000;

  setTimeout(() => {
    const requestDuration = Date.now() - requestStart;

    // Send successful response
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'X-Process-Uptime': process.uptime().toFixed(2)
    });

    res.end(JSON.stringify({
      status: 'success',
      message: 'Request processed successfully',
      data: {
        method: req.method,
        url: req.url,
        processPid: process.pid,
        processUptime: process.uptime().toFixed(2),
        requestDuration: requestDuration,
        timestamp: new Date().toISOString()
      }
    }, null, 2));

    console.log(`✅ Completed ${req.method} ${req.url} (${requestDuration}ms)`);
  }, workTime);
}

// ============================================================================
// Connection Tracking
// ============================================================================

/**
 * Sets up connection tracking on the server
 *
 * This is crucial for graceful shutdown:
 * - We track each socket connection in a Set
 * - When a socket closes, we remove it from the Set
 * - During shutdown, we can see how many connections are active
 * - We can force-close connections if shutdown timeout is reached
 *
 * @param {http.Server} server - The HTTP server instance
 */
function setupConnectionTracking(server) {
  server.on('connection', (socket) => {
    // Add socket to active connections
    activeConnections.add(socket);
    console.log(`🔌 New connection (total: ${activeConnections.size})`);

    // Remove socket when it closes
    socket.on('close', () => {
      activeConnections.delete(socket);
      console.log(`🔌 Connection closed (remaining: ${activeConnections.size})`);
    });

    // If we're shutting down, immediately close new connections
    // This prevents new connections from being established during shutdown
    if (isShuttingDown) {
      socket.destroy();
    }
  });
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Implements graceful shutdown sequence
 *
 * Graceful shutdown process:
 * 1. Set isShuttingDown flag (stops accepting new requests)
 * 2. Call server.close() to stop accepting new connections
 * 3. Wait for existing connections to complete
 * 4. If timeout is reached, force close remaining connections
 * 5. Log statistics and exit with code 0
 *
 * This ensures:
 * - No new work is started
 * - Existing work completes (or times out)
 * - Resources are cleaned up
 * - Process exits cleanly
 *
 * @param {string} signal - The signal that triggered shutdown (SIGTERM, SIGINT, etc.)
 */
function gracefulShutdown(signal) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🛑 Received ${signal} - Starting graceful shutdown...`);
  console.log('═'.repeat(60));

  // Prevent multiple shutdown attempts
  if (isShuttingDown) {
    console.log('⚠️  Shutdown already in progress...');
    return;
  }

  // Set flag to reject new requests
  isShuttingDown = true;

  // Get initial connection count
  const initialConnections = activeConnections.size;
  console.log(`⏳ Waiting for ${initialConnections} active connection(s) to complete...`);

  // Stop accepting new connections
  // The callback fires when all connections are closed
  server.close(() => {
    const shutdownDuration = process.uptime();
    console.log('\n✅ Server closed - all connections finished naturally');
    console.log('═'.repeat(60));
    console.log('📊 Shutdown Statistics:');
    console.log(`   Duration: ${shutdownDuration.toFixed(2)}s`);
    console.log(`   Initial connections: ${initialConnections}`);
    console.log(`   Exit code: 0 (success)`);
    console.log('═'.repeat(60));
    console.log('👋 Process exiting cleanly\n');
    process.exit(0);
  });

  // Set up timeout to force shutdown if connections don't close
  // This prevents the server from hanging indefinitely
  const forceShutdownTimer = setTimeout(() => {
    console.log('\n⚠️  Shutdown timeout reached!');
    console.log(`⚠️  Forcing closure of ${activeConnections.size} remaining connection(s)`);

    // Force destroy all remaining sockets
    let destroyCount = 0;
    for (const socket of activeConnections) {
      socket.destroy();
      destroyCount++;
    }

    console.log(`🔪 Destroyed ${destroyCount} connection(s)`);
    console.log('═'.repeat(60));
    console.log('⚠️  Forced shutdown completed');
    console.log('═'.repeat(60));
    console.log('👋 Process exiting\n');

    // Exit with code 0 (we still consider this successful shutdown)
    // In production, you might use a different exit code
    process.exit(0);
  }, SHUTDOWN_TIMEOUT);

  // Allow Node.js to exit if the timer is the only thing keeping it alive
  // This is important - without unref(), the timer would prevent process exit
  forceShutdownTimer.unref();
}

// ============================================================================
// Signal Handlers
// ============================================================================

/**
 * Sets up signal handlers for graceful shutdown
 *
 * SIGTERM: Standard termination signal (docker stop, kill command)
 * SIGINT: Interrupt signal (Ctrl+C in terminal)
 *
 * Both signals trigger the same graceful shutdown sequence
 */
function setupSignalHandlers() {
  // SIGTERM: Termination signal
  // Sent by: docker stop, systemd, kill <pid>
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // SIGINT: Interrupt signal (Ctrl+C)
  // Sent by: pressing Ctrl+C in terminal
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// ============================================================================
// Server Startup
// ============================================================================

/**
 * Starts the HTTP server with graceful shutdown capabilities
 *
 * This is the main entry point that:
 * 1. Creates the HTTP server
 * 2. Sets up connection tracking
 * 3. Registers signal handlers
 * 4. Starts listening on the configured port
 * 5. Logs startup information
 */
function startServer() {
  console.log('═'.repeat(60));
  console.log('HTTP SERVER WITH GRACEFUL SHUTDOWN');
  console.log('═'.repeat(60));
  console.log('\n🚀 Starting server...\n');

  // Create HTTP server with request handler
  server = http.createServer(handleRequest);

  // Set up connection tracking for graceful shutdown
  setupConnectionTracking(server);

  // Register signal handlers
  setupSignalHandlers();

  // Handle server errors
  server.on('error', (error) => {
    console.error('❌ Server error:', error.message);

    // Handle specific errors
    if (error.code === 'EADDRINUSE') {
      console.error(`   Port ${PORT} is already in use`);
      process.exit(1);
    } else if (error.code === 'EACCES') {
      console.error(`   Permission denied for port ${PORT}`);
      process.exit(1);
    } else {
      process.exit(1);
    }
  });

  // Start listening
  server.listen(PORT, () => {
    console.log('═'.repeat(60));
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📋 Process ID: ${process.pid}`);
    console.log(`📋 Node Version: ${process.version}`);
    console.log(`📋 Platform: ${process.platform}`);
    console.log('═'.repeat(60));
    console.log('\n📝 Try these commands in another terminal:');
    console.log(`   curl http://localhost:${PORT}`);
    console.log(`   curl http://localhost:${PORT}/api/status`);
    console.log(`   curl http://localhost:${PORT}/api/health`);
    console.log('\n🛑 Graceful shutdown methods:');
    console.log('   - Press Ctrl+C (sends SIGINT)');
    console.log(`   - Run: kill ${process.pid} (sends SIGTERM)`);
    console.log(`   - Run: kill -SIGTERM ${process.pid}`);
    console.log('\n💡 Server will wait up to 10s for connections to close\n');
  });
}

// ============================================================================
// Main Execution
// ============================================================================

// Start the server
startServer();

// ============================================================================
// LEARNING NOTES
// ============================================================================

/**
 * KEY TAKEAWAYS:
 *
 * 1. GRACEFUL SHUTDOWN PATTERN
 *    - Set a flag to stop accepting new work
 *    - Stop accepting new connections (server.close())
 *    - Wait for existing work to complete
 *    - Force cleanup after timeout
 *    - Exit with appropriate code
 *
 * 2. CONNECTION TRACKING
 *    - Track sockets in a Set for O(1) add/remove
 *    - Listen to 'connection' and 'close' events
 *    - Can iterate over Set to force-close if needed
 *
 * 3. SIGNAL HANDLING
 *    - SIGTERM: standard termination (production)
 *    - SIGINT: user interrupt (development)
 *    - Both should trigger same shutdown logic
 *
 * 4. TIMEOUT HANDLING
 *    - Always set a maximum wait time
 *    - Use setTimeout with unref() to allow exit
 *    - Force-close remaining connections on timeout
 *
 * 5. EXIT CODES
 *    - 0: Clean shutdown (success)
 *    - 1: Error during operation
 *    - Other codes can indicate specific errors
 *
 * PRODUCTION CONSIDERATIONS:
 *
 * 1. Health Checks
 *    - Add a /health endpoint
 *    - Return 503 during shutdown
 *    - Load balancers can detect and stop routing
 *
 * 2. Logging
 *    - Use structured logging (JSON)
 *    - Log to external service (DataDog, CloudWatch)
 *    - Include correlation IDs for request tracking
 *
 * 3. Metrics
 *    - Track active connections
 *    - Monitor shutdown duration
 *    - Alert on frequent shutdowns
 *
 * 4. Kubernetes/Docker
 *    - Set terminationGracePeriodSeconds
 *    - Should be longer than SHUTDOWN_TIMEOUT
 *    - Implement readiness probes
 *
 * 5. Database Connections
 *    - Close connection pools during shutdown
 *    - Wait for queries to complete
 *    - Don't start new transactions during shutdown
 *
 * COMMON PITFALLS:
 *
 * 1. Not tracking connections
 *    → Can't wait for them during shutdown
 *
 * 2. No shutdown timeout
 *    → Server hangs indefinitely if connection doesn't close
 *
 * 3. Not using unref() on timeout
 *    → Timer keeps event loop alive, prevents exit
 *
 * 4. Accepting requests during shutdown
 *    → New work starts that won't complete
 *
 * 5. Not handling multiple signals
 *    → Works in dev (Ctrl+C) but not in production (SIGTERM)
 */
