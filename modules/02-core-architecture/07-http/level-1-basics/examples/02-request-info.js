/**
 * Example 2: Request Information
 *
 * Demonstrates:
 * - Accessing request properties
 * - Reading request headers
 * - Parsing request URL
 * - Logging request information
 */

const http = require('http');
const url = require('url');

console.log('=== Request Information Example ===\n');

const server = http.createServer((req, res) => {
  // Parse the URL
  const parsedUrl = url.parse(req.url, true);

  // Log request information
  console.log('\n--- New Request ---');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Pathname:', parsedUrl.pathname);
  console.log('Query:', parsedUrl.query);
  console.log('HTTP Version:', req.httpVersion);

  // Log important headers
  console.log('\nHeaders:');
  console.log('  Host:', req.headers.host);
  console.log('  User-Agent:', req.headers['user-agent']);
  console.log('  Accept:', req.headers.accept);
  console.log('  Connection:', req.headers.connection);

  // Log all headers
  console.log('\nAll Headers:', JSON.stringify(req.headers, null, 2));

  // Create response showing request info
  const responseData = {
    message: 'Request Information',
    request: {
      method: req.method,
      url: req.url,
      pathname: parsedUrl.pathname,
      query: parsedUrl.query,
      httpVersion: req.httpVersion,
      headers: req.headers
    }
  };

  // Send JSON response
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'X-Request-Method': req.method,
    'X-Request-Path': parsedUrl.pathname
  });

  res.end(JSON.stringify(responseData, null, 2));
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/\n`);
  console.log('Try these commands:');
  console.log(`  curl http://localhost:${PORT}/`);
  console.log(`  curl http://localhost:${PORT}/path?name=Alice&age=30`);
  console.log(`  curl -H "Custom-Header: value" http://localhost:${PORT}/test\n`);
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
 * 1. req.method - HTTP method (GET, POST, etc.)
 * 2. req.url - Full URL path including query string
 * 3. req.headers - Object containing all headers
 * 4. url.parse() - Parses URL into components
 * 5. Headers are lowercase in Node.js
 * 6. Query parameters are available in parsedUrl.query
 */
