/**
 * Example 8: Simple JSON API
 *
 * Demonstrates:
 * - Building a RESTful JSON API
 * - CRUD operations (Create, Read, Update, Delete)
 * - In-memory data storage
 * - Proper HTTP methods and status codes
 */

const http = require('http');
const url = require('url');

console.log('=== JSON API Example ===\n');

// In-memory data store
let users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 }
];

let nextId = 4;

// Helper function to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

// Helper function to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${pathname}`);

  try {
    // GET /api/users - Get all users
    if (pathname === '/api/users' && method === 'GET') {
      sendJSON(res, 200, {
        success: true,
        data: users,
        count: users.length
      });
    }

    // GET /api/users/:id - Get user by ID
    else if (pathname.match(/^\/api\/users\/\d+$/) && method === 'GET') {
      const id = parseInt(pathname.split('/')[3]);
      const user = users.find(u => u.id === id);

      if (user) {
        sendJSON(res, 200, {
          success: true,
          data: user
        });
      } else {
        sendJSON(res, 404, {
          success: false,
          error: 'User not found'
        });
      }
    }

    // POST /api/users - Create new user
    else if (pathname === '/api/users' && method === 'POST') {
      const body = await parseBody(req);

      // Validate required fields
      if (!body.name || !body.email) {
        sendJSON(res, 400, {
          success: false,
          error: 'Name and email are required'
        });
        return;
      }

      // Create new user
      const newUser = {
        id: nextId++,
        name: body.name,
        email: body.email,
        age: body.age || null
      };

      users.push(newUser);

      sendJSON(res, 201, {
        success: true,
        message: 'User created successfully',
        data: newUser
      });
    }

    // PUT /api/users/:id - Update user
    else if (pathname.match(/^\/api\/users\/\d+$/) && method === 'PUT') {
      const id = parseInt(pathname.split('/')[3]);
      const userIndex = users.findIndex(u => u.id === id);

      if (userIndex === -1) {
        sendJSON(res, 404, {
          success: false,
          error: 'User not found'
        });
        return;
      }

      const body = await parseBody(req);

      // Update user
      users[userIndex] = {
        ...users[userIndex],
        ...body,
        id: id // Preserve ID
      };

      sendJSON(res, 200, {
        success: true,
        message: 'User updated successfully',
        data: users[userIndex]
      });
    }

    // PATCH /api/users/:id - Partial update
    else if (pathname.match(/^\/api\/users\/\d+$/) && method === 'PATCH') {
      const id = parseInt(pathname.split('/')[3]);
      const userIndex = users.findIndex(u => u.id === id);

      if (userIndex === -1) {
        sendJSON(res, 404, {
          success: false,
          error: 'User not found'
        });
        return;
      }

      const body = await parseBody(req);

      // Partial update
      users[userIndex] = {
        ...users[userIndex],
        ...body,
        id: id // Preserve ID
      };

      sendJSON(res, 200, {
        success: true,
        message: 'User updated successfully',
        data: users[userIndex]
      });
    }

    // DELETE /api/users/:id - Delete user
    else if (pathname.match(/^\/api\/users\/\d+$/) && method === 'DELETE') {
      const id = parseInt(pathname.split('/')[3]);
      const userIndex = users.findIndex(u => u.id === id);

      if (userIndex === -1) {
        sendJSON(res, 404, {
          success: false,
          error: 'User not found'
        });
        return;
      }

      const deletedUser = users.splice(userIndex, 1)[0];

      sendJSON(res, 200, {
        success: true,
        message: 'User deleted successfully',
        data: deletedUser
      });
    }

    // GET /api/users/search - Search users
    else if (pathname === '/api/users/search' && method === 'GET') {
      const query = parsedUrl.query;
      let results = users;

      if (query.name) {
        results = results.filter(u =>
          u.name.toLowerCase().includes(query.name.toLowerCase())
        );
      }

      if (query.email) {
        results = results.filter(u =>
          u.email.toLowerCase().includes(query.email.toLowerCase())
        );
      }

      if (query.minAge) {
        results = results.filter(u => u.age >= parseInt(query.minAge));
      }

      if (query.maxAge) {
        results = results.filter(u => u.age <= parseInt(query.maxAge));
      }

      sendJSON(res, 200, {
        success: true,
        data: results,
        count: results.length
      });
    }

    // GET / - API documentation
    else if (pathname === '/' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <h1>JSON API Documentation</h1>
        <h2>Endpoints:</h2>
        <ul>
          <li><strong>GET</strong> /api/users - Get all users</li>
          <li><strong>GET</strong> /api/users/:id - Get user by ID</li>
          <li><strong>POST</strong> /api/users - Create new user</li>
          <li><strong>PUT</strong> /api/users/:id - Update user</li>
          <li><strong>PATCH</strong> /api/users/:id - Partial update</li>
          <li><strong>DELETE</strong> /api/users/:id - Delete user</li>
          <li><strong>GET</strong> /api/users/search?name=Alice - Search users</li>
        </ul>
        <h2>Example curl commands:</h2>
        <pre>
# Get all users
curl http://localhost:3000/api/users

# Get user by ID
curl http://localhost:3000/api/users/1

# Create new user
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":"David","email":"david@example.com","age":28}'

# Update user
curl -X PUT http://localhost:3000/api/users/1 \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Alice Updated","email":"alice.new@example.com","age":31}'

# Partial update
curl -X PATCH http://localhost:3000/api/users/1 \\
  -H "Content-Type: application/json" \\
  -d '{"age":32}'

# Delete user
curl -X DELETE http://localhost:3000/api/users/2

# Search users
curl "http://localhost:3000/api/users/search?name=Alice"
        </pre>
      `);
    }

    // 404 Not Found
    else {
      sendJSON(res, 404, {
        success: false,
        error: 'Endpoint not found'
      });
    }

  } catch (error) {
    console.error('Error:', error);
    sendJSON(res, 500, {
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`JSON API server running at http://localhost:${PORT}/\n`);
  console.log('API Endpoints:');
  console.log('  GET    /api/users');
  console.log('  GET    /api/users/:id');
  console.log('  POST   /api/users');
  console.log('  PUT    /api/users/:id');
  console.log('  PATCH  /api/users/:id');
  console.log('  DELETE /api/users/:id');
  console.log('  GET    /api/users/search\n');
  console.log('Visit http://localhost:3000/ for full documentation\n');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close(() => process.exit(0));
});

/**
 * Key Concepts:
 *
 * 1. RESTful API design principles
 * 2. Use appropriate HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * 3. Use appropriate status codes (200, 201, 400, 404, 500)
 * 4. Always validate input data
 * 5. Use URL parameters for resource IDs
 * 6. Use query parameters for filtering/searching
 * 7. Return consistent JSON response format
 * 8. Handle errors gracefully with proper error responses
 */
