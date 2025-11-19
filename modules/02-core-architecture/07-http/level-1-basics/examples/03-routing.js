/**
 * Example 3: Basic Routing
 *
 * Demonstrates:
 * - URL-based routing
 * - Method-based routing
 * - Handling different routes
 * - 404 Not Found responses
 */

const http = require('http');
const url = require('url');

console.log('=== Routing Example ===\n');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${pathname}`);

  // Set default headers
  res.setHeader('Content-Type', 'text/html');

  // Route handling
  if (pathname === '/' && method === 'GET') {
    // Home page
    res.statusCode = 200;
    res.end(`
      <h1>Welcome Home!</h1>
      <nav>
        <a href="/">Home</a> |
        <a href="/about">About</a> |
        <a href="/contact">Contact</a> |
        <a href="/api/users">API Users</a>
      </nav>
    `);

  } else if (pathname === '/about' && method === 'GET') {
    // About page
    res.statusCode = 200;
    res.end(`
      <h1>About Us</h1>
      <p>This is a simple routing example.</p>
      <a href="/">Back to Home</a>
    `);

  } else if (pathname === '/contact' && method === 'GET') {
    // Contact page
    res.statusCode = 200;
    res.end(`
      <h1>Contact Us</h1>
      <p>Email: contact@example.com</p>
      <a href="/">Back to Home</a>
    `);

  } else if (pathname === '/api/users' && method === 'GET') {
    // API endpoint - return JSON
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
      ]
    }));

  } else if (pathname === '/api/users' && method === 'POST') {
    // API endpoint - handle POST
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 201;
    res.end(JSON.stringify({
      message: 'User would be created here',
      method: 'POST'
    }));

  } else if (pathname.startsWith('/user/')) {
    // Dynamic route - extract user ID
    const userId = pathname.split('/')[2];
    res.statusCode = 200;
    res.end(`
      <h1>User Profile</h1>
      <p>Viewing user: ${userId}</p>
      <a href="/">Back to Home</a>
    `);

  } else if (pathname === '/redirect') {
    // Redirect example
    res.statusCode = 302;
    res.setHeader('Location', '/');
    res.end();

  } else {
    // 404 Not Found
    res.statusCode = 404;
    res.end(`
      <h1>404 - Page Not Found</h1>
      <p>The page <code>${pathname}</code> does not exist.</p>
      <a href="/">Go to Home</a>
    `);
  }
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/\n`);
  console.log('Available routes:');
  console.log('  GET  http://localhost:${PORT}/');
  console.log('  GET  http://localhost:${PORT}/about');
  console.log('  GET  http://localhost:${PORT}/contact');
  console.log('  GET  http://localhost:${PORT}/api/users');
  console.log('  POST http://localhost:${PORT}/api/users');
  console.log('  GET  http://localhost:${PORT}/user/:id');
  console.log('  GET  http://localhost:${PORT}/redirect');
  console.log('\nTry:');
  console.log('  curl http://localhost:${PORT}/');
  console.log('  curl http://localhost:${PORT}/about');
  console.log('  curl http://localhost:${PORT}/api/users');
  console.log('  curl http://localhost:${PORT}/nonexistent\n');
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
 * 1. Use pathname to determine which route to handle
 * 2. Check both pathname and method for complete routing
 * 3. Always have a 404 fallback for unmatched routes
 * 4. Different routes can return different content types
 * 5. Use startsWith() for dynamic routes
 * 6. Set appropriate status codes (200, 404, 302, etc.)
 */
