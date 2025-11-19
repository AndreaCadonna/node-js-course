/**
 * Exercise 3: POST Request Handling
 *
 * Create a server that accepts and processes POST requests with JSON data.
 */

const http = require('http');

console.log('=== Exercise 3: POST Request Handling ===\n');

// Task 1: Parse request body helper
/**
 * Create a function that reads and parses the request body as JSON
 * Handle errors gracefully
 */
function parseJSONBody(req) {
  // TODO: Implement body parsing
  // Return a Promise that resolves with parsed JSON
  // Your code here
}

// Task 2: Create POST /users endpoint
/**
 * Accept POST requests with user data:
 * {
 *   "name": "Alice",
 *   "email": "alice@example.com",
 *   "age": 30
 * }
 *
 * Validate:
 * - name is required
 * - email is required and contains @
 * - age is optional but must be a number
 *
 * Return 201 with created user data
 * Return 400 for validation errors
 */

// In-memory storage
const users = [];
let nextId = 1;

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  // TODO: Implement POST /users
  if (url === '/users' && method === 'POST') {
    try {
      // Parse body
      // Validate data
      // Store user
      // Return 201
      // Your code here

      res.end('TODO: Implement user creation');
    } catch (error) {
      // Handle errors
      res.end('TODO: Handle errors');
    }
  }

  // TODO: Implement GET /users - return all users
  else if (url === '/users' && method === 'GET') {
    // Your code here
    res.end('TODO: Return all users');
  }

  // TODO: Handle 404
  else {
    // Your code here
    res.end('TODO: Handle 404');
  }
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/\n`);
  console.log('Try these commands:');
  console.log('  curl -X POST http://localhost:3000/users \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"name":"Alice","email":"alice@example.com","age":30}\'');
  console.log('');
  console.log('  curl http://localhost:3000/users');
});

/**
 * Testing:
 * 1. Create a user:
 *    curl -X POST http://localhost:3000/users \
 *      -H "Content-Type: application/json" \
 *      -d '{"name":"Alice","email":"alice@example.com","age":30}'
 *
 * 2. Create another user:
 *    curl -X POST http://localhost:3000/users \
 *      -H "Content-Type: application/json" \
 *      -d '{"name":"Bob","email":"bob@example.com"}'
 *
 * 3. Test validation (should fail):
 *    curl -X POST http://localhost:3000/users \
 *      -H "Content-Type: application/json" \
 *      -d '{"name":"Charlie"}'
 *
 * 4. Get all users:
 *    curl http://localhost:3000/users
 */
