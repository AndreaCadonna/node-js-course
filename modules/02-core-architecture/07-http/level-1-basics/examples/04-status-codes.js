/**
 * Example 4: HTTP Status Codes
 *
 * Demonstrates:
 * - Different HTTP status codes
 * - When to use each status code
 * - Setting status codes properly
 * - Status code meanings
 */

const http = require('http');
const url = require('url');

console.log('=== HTTP Status Codes Example ===\n');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  res.setHeader('Content-Type', 'application/json');

  // Route to different status code examples
  if (pathname === '/') {
    // 200 OK - Success
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 200,
      message: 'OK - Request succeeded',
      description: 'Standard response for successful HTTP requests'
    }));

  } else if (pathname === '/created') {
    // 201 Created - Resource created
    res.statusCode = 201;
    res.setHeader('Location', '/resource/123');
    res.end(JSON.stringify({
      status: 201,
      message: 'Created',
      description: 'Request succeeded and a new resource was created',
      resourceId: 123
    }));

  } else if (pathname === '/accepted') {
    // 202 Accepted - Request accepted but not yet processed
    res.statusCode = 202;
    res.end(JSON.stringify({
      status: 202,
      message: 'Accepted',
      description: 'Request accepted for processing, but processing not complete'
    }));

  } else if (pathname === '/no-content') {
    // 204 No Content - Success but no content to return
    res.statusCode = 204;
    res.end();

  } else if (pathname === '/redirect') {
    // 301 Moved Permanently
    res.statusCode = 301;
    res.setHeader('Location', '/new-location');
    res.end(JSON.stringify({
      status: 301,
      message: 'Moved Permanently',
      newLocation: '/new-location'
    }));

  } else if (pathname === '/temp-redirect') {
    // 302 Found (Temporary Redirect)
    res.statusCode = 302;
    res.setHeader('Location', '/');
    res.end();

  } else if (pathname === '/not-modified') {
    // 304 Not Modified - Cached version is still valid
    res.statusCode = 304;
    res.end();

  } else if (pathname === '/bad-request') {
    // 400 Bad Request - Client error
    res.statusCode = 400;
    res.end(JSON.stringify({
      status: 400,
      message: 'Bad Request',
      error: 'The request could not be understood by the server'
    }));

  } else if (pathname === '/unauthorized') {
    // 401 Unauthorized - Authentication required
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="Example"');
    res.end(JSON.stringify({
      status: 401,
      message: 'Unauthorized',
      error: 'Authentication is required'
    }));

  } else if (pathname === '/forbidden') {
    // 403 Forbidden - Server refuses to authorize
    res.statusCode = 403;
    res.end(JSON.stringify({
      status: 403,
      message: 'Forbidden',
      error: 'You do not have permission to access this resource'
    }));

  } else if (pathname === '/not-found') {
    // 404 Not Found
    res.statusCode = 404;
    res.end(JSON.stringify({
      status: 404,
      message: 'Not Found',
      error: 'The requested resource was not found'
    }));

  } else if (pathname === '/method-not-allowed') {
    // 405 Method Not Allowed
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, POST');
    res.end(JSON.stringify({
      status: 405,
      message: 'Method Not Allowed',
      error: 'The request method is not supported',
      allowedMethods: ['GET', 'POST']
    }));

  } else if (pathname === '/conflict') {
    // 409 Conflict
    res.statusCode = 409;
    res.end(JSON.stringify({
      status: 409,
      message: 'Conflict',
      error: 'The request conflicts with the current state of the resource'
    }));

  } else if (pathname === '/too-many-requests') {
    // 429 Too Many Requests
    res.statusCode = 429;
    res.setHeader('Retry-After', '60');
    res.end(JSON.stringify({
      status: 429,
      message: 'Too Many Requests',
      error: 'Rate limit exceeded',
      retryAfter: '60 seconds'
    }));

  } else if (pathname === '/error') {
    // 500 Internal Server Error
    res.statusCode = 500;
    res.end(JSON.stringify({
      status: 500,
      message: 'Internal Server Error',
      error: 'An unexpected error occurred on the server'
    }));

  } else if (pathname === '/not-implemented') {
    // 501 Not Implemented
    res.statusCode = 501;
    res.end(JSON.stringify({
      status: 501,
      message: 'Not Implemented',
      error: 'The server does not support this functionality'
    }));

  } else if (pathname === '/service-unavailable') {
    // 503 Service Unavailable
    res.statusCode = 503;
    res.setHeader('Retry-After', '120');
    res.end(JSON.stringify({
      status: 503,
      message: 'Service Unavailable',
      error: 'The server is temporarily unavailable'
    }));

  } else {
    // Default 404
    res.statusCode = 404;
    res.end(JSON.stringify({
      status: 404,
      message: 'Not Found',
      availableEndpoints: [
        '/', '/created', '/accepted', '/no-content',
        '/redirect', '/temp-redirect', '/not-modified',
        '/bad-request', '/unauthorized', '/forbidden',
        '/not-found', '/method-not-allowed', '/conflict',
        '/too-many-requests', '/error', '/not-implemented',
        '/service-unavailable'
      ]
    }));
  }
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/\n`);
  console.log('Try different status codes:');
  console.log('  2xx Success:');
  console.log('    curl http://localhost:${PORT}/');
  console.log('    curl http://localhost:${PORT}/created');
  console.log('    curl http://localhost:${PORT}/no-content');
  console.log('  3xx Redirection:');
  console.log('    curl -i http://localhost:${PORT}/redirect');
  console.log('    curl -i http://localhost:${PORT}/temp-redirect');
  console.log('  4xx Client Errors:');
  console.log('    curl http://localhost:${PORT}/bad-request');
  console.log('    curl http://localhost:${PORT}/unauthorized');
  console.log('    curl http://localhost:${PORT}/not-found');
  console.log('  5xx Server Errors:');
  console.log('    curl http://localhost:${PORT}/error');
  console.log('    curl http://localhost:${PORT}/service-unavailable\n');
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
 * 1. 2xx - Success status codes
 * 2. 3xx - Redirection status codes
 * 3. 4xx - Client error status codes
 * 4. 5xx - Server error status codes
 * 5. Always use appropriate status codes
 * 6. Some status codes require specific headers (Location, Retry-After, etc.)
 */
