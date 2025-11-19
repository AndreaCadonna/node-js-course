/**
 * Exercise 1: Basic Server and Routing
 *
 * Create an HTTP server with multiple routes that respond with different content.
 */

const http = require('http');

console.log('=== Exercise 1: Basic Server and Routing ===\n');

// Task 1: Create a server that handles multiple routes
/**
 * Implement a server with the following routes:
 * - GET / - Return "Welcome to my website!"
 * - GET /about - Return information about yourself
 * - GET /contact - Return your contact information
 * - GET /api/time - Return current time as JSON
 * - All other routes - Return 404 with "Page not found"
 */

const server = http.createServer((req, res) => {
  // TODO: Implement routing logic here
  // Hint: Use req.url and req.method
  // Your code here

  res.end('TODO: Implement routing');
});

// Task 2: Make the server listen on port 3000
// TODO: Implement server.listen()
// Your code here

// Task 3: Add error handling for port in use
// TODO: Handle server errors
// server.on('error', ...)

// Task 4: Add graceful shutdown on Ctrl+C
// TODO: Handle SIGINT
// process.on('SIGINT', ...)

/**
 * Testing:
 * 1. Run: node exercise-1.js
 * 2. Test with curl:
 *    curl http://localhost:3000/
 *    curl http://localhost:3000/about
 *    curl http://localhost:3000/contact
 *    curl http://localhost:3000/api/time
 *    curl http://localhost:3000/nonexistent
 *
 * Expected Results:
 * - / should return "Welcome to my website!"
 * - /about should return information about you
 * - /contact should return contact info
 * - /api/time should return JSON with current time
 * - /nonexistent should return 404
 */
