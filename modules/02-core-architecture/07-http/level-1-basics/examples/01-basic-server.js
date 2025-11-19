/**
 * Example 1: Basic HTTP Server
 *
 * Demonstrates:
 * - Creating an HTTP server
 * - Handling requests and responses
 * - Listening on a port
 * - Setting status codes and headers
 */

const http = require('http');

console.log('=== Basic HTTP Server Example ===\n');

// Create an HTTP server
// The callback function is called for each incoming request
const server = http.createServer((req, res) => {
  console.log(`Received ${req.method} request for ${req.url}`);

  // Set the status code
  res.statusCode = 200;

  // Set response headers
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('X-Powered-By', 'Node.js');

  // Send response and end
  res.end('Hello World!\n');
});

// Define the port to listen on
const PORT = 3000;
const HOST = 'localhost';

// Start listening for requests
server.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}/`);
  console.log('Press Ctrl+C to stop\n');
  console.log('Try these commands:');
  console.log(`  curl http://${HOST}:${PORT}`);
  console.log(`  Or visit http://${HOST}:${PORT} in your browser\n`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', error);
  }
});

// Handle server close
server.on('close', () => {
  console.log('Server closed');
});

// Graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

/**
 * Key Concepts:
 *
 * 1. http.createServer() creates a server instance
 * 2. The callback receives (req, res) for each request
 * 3. res.statusCode sets the HTTP status code
 * 4. res.setHeader() sets response headers
 * 5. res.end() sends the response and closes the connection
 * 6. server.listen() starts the server on a specific port
 */
