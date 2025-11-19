/**
 * Example 1: Body Parsing
 *
 * Demonstrates parsing different content types:
 * - application/json
 * - application/x-www-form-urlencoded
 * - multipart/form-data
 */

const http = require('http');
const querystring = require('querystring');

console.log('=== Body Parsing Example ===\n');

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    const contentType = req.headers['content-type'] || '';

    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        if (contentType.includes('application/json')) {
          resolve({ type: 'json', data: JSON.parse(body) });
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          resolve({ type: 'form', data: querystring.parse(body) });
        } else {
          resolve({ type: 'text', data: body });
        }
      } catch (error) {
        reject(error);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST') {
    try {
      const result = await parseBody(req);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Body parsed successfully',
        contentType: result.type,
        data: result.data
      }, null, 2));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid body' }));
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>Body Parsing Example</h1>
      <p>Send POST requests with different content types:</p>
      <pre>
# JSON
curl -X POST http://localhost:3000 \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Alice","age":30}'

# Form
curl -X POST http://localhost:3000 \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "name=Bob&age=25"
      </pre>
    `);
  }
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/\n');
});
