/**
 * Example 5: Request Body Handling
 *
 * Demonstrates:
 * - Reading request body (stream)
 * - Parsing JSON data
 * - Handling POST requests
 * - URL-encoded form data
 */

const http = require('http');
const querystring = require('querystring');

console.log('=== Request Body Example ===\n');

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (url === '/' && method === 'GET') {
    // Home page with examples
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>Request Body Examples</h1>
      <h2>Test with curl:</h2>
      <pre>
# JSON POST
curl -X POST http://localhost:3000/json \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Alice","age":30}'

# Form POST
curl -X POST http://localhost:3000/form \\
  -d "name=Bob&email=bob@example.com"

# Text POST
curl -X POST http://localhost:3000/text \\
  -H "Content-Type: text/plain" \\
  -d "Hello from curl"
      </pre>
    `);

  } else if (url === '/json' && method === 'POST') {
    // Handle JSON POST request
    let body = '';

    // Collect data chunks
    req.on('data', (chunk) => {
      body += chunk.toString();
      console.log('Received chunk:', chunk.length, 'bytes');
    });

    // When all data received
    req.on('end', () => {
      try {
        // Parse JSON
        const data = JSON.parse(body);
        console.log('Parsed JSON:', data);

        // Send response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'JSON received successfully',
          received: data,
          contentType: req.headers['content-type'],
          bodyLength: body.length
        }, null, 2));

      } catch (error) {
        // Handle JSON parse error
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid JSON',
          message: error.message
        }));
      }
    });

    // Handle errors
    req.on('error', (error) => {
      console.error('Request error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Request error' }));
    });

  } else if (url === '/form' && method === 'POST') {
    // Handle URL-encoded form data
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Parse URL-encoded data
      const formData = querystring.parse(body);
      console.log('Parsed form data:', formData);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Form data received successfully',
        received: formData,
        contentType: req.headers['content-type']
      }, null, 2));
    });

  } else if (url === '/text' && method === 'POST') {
    // Handle plain text
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      console.log('Received text:', body);

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`Received text: "${body}"\nLength: ${body.length} characters`);
    });

  } else if (url === '/echo' && method === 'POST') {
    // Echo back whatever is sent
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      res.writeHead(200, {
        'Content-Type': req.headers['content-type'] || 'text/plain'
      });
      res.end(body);
    });

  } else if (url === '/size-limit' && method === 'POST') {
    // Demonstrate size limiting
    const MAX_SIZE = 1024; // 1KB limit
    let body = '';
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;

      if (size > MAX_SIZE) {
        // Request too large
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Payload Too Large',
          maxSize: MAX_SIZE,
          receivedSize: size
        }));
        req.destroy(); // Stop receiving data
        return;
      }

      body += chunk.toString();
    });

    req.on('end', () => {
      if (size <= MAX_SIZE) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Data within size limit',
          size: size,
          maxSize: MAX_SIZE
        }));
      }
    });

  } else {
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      availableEndpoints: [
        'GET  /',
        'POST /json',
        'POST /form',
        'POST /text',
        'POST /echo',
        'POST /size-limit'
      ]
    }));
  }
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/\n`);
  console.log('Try these commands:\n');
  console.log('JSON POST:');
  console.log('  curl -X POST http://localhost:3000/json \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"name":"Alice","age":30}\'\n');
  console.log('Form POST:');
  console.log('  curl -X POST http://localhost:3000/form \\');
  console.log('    -d "name=Bob&email=bob@example.com"\n');
  console.log('Text POST:');
  console.log('  curl -X POST http://localhost:3000/text \\');
  console.log('    -d "Hello World"\n');
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
 * 1. Request body is a stream - must be read in chunks
 * 2. Use 'data' event to receive chunks
 * 3. Use 'end' event when all data is received
 * 4. Always parse the body based on Content-Type
 * 5. Handle JSON.parse() errors gracefully
 * 6. Implement size limits to prevent abuse
 * 7. Use querystring.parse() for URL-encoded data
 */
