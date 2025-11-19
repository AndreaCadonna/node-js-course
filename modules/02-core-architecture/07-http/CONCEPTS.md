# HTTP Module - Core Concepts

This document provides foundational concepts for understanding HTTP in Node.js. Read this before diving into the level-specific content.

---

## Table of Contents

1. [What is HTTP?](#what-is-http)
2. [HTTP in Node.js](#http-in-nodejs)
3. [Request-Response Cycle](#request-response-cycle)
4. [HTTP Methods](#http-methods)
5. [Status Codes](#status-codes)
6. [Headers](#headers)
7. [Streams and HTTP](#streams-and-http)
8. [Client vs Server](#client-vs-server)
9. [HTTPS and Security](#https-and-security)
10. [HTTP/2](#http2)

---

## What is HTTP?

**HTTP** (Hypertext Transfer Protocol) is the foundation of data communication on the web. It's a protocol that defines how messages are formatted and transmitted between clients (like web browsers) and servers.

### Key Characteristics

- **Request-Response Protocol**: Client sends request, server sends response
- **Stateless**: Each request is independent; server doesn't remember previous requests
- **Text-Based**: Messages are human-readable (HTTP/1.1)
- **Application Layer**: Operates on top of TCP/IP

### HTTP Message Structure

Every HTTP message has two parts:

1. **Headers**: Metadata about the message
2. **Body**: The actual content (optional)

```
GET /users HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0
Accept: application/json

```

---

## HTTP in Node.js

Node.js provides built-in modules for HTTP:

### The `http` Module

```javascript
const http = require('http');
```

**Capabilities:**
- Create HTTP servers
- Make HTTP client requests
- Handle requests and responses
- Work with headers and status codes

### The `https` Module

```javascript
const https = require('https');
```

**Capabilities:**
- Same as `http` but with SSL/TLS encryption
- Secure communication
- Certificate management

### The `http2` Module

```javascript
const http2 = require('http2');
```

**Capabilities:**
- HTTP/2 protocol support
- Multiplexing
- Server push
- Header compression

---

## Request-Response Cycle

### 1. Client Sends Request

```
GET /api/users/123 HTTP/1.1
Host: api.example.com
Accept: application/json
```

### 2. Server Processes Request

```javascript
const server = http.createServer((req, res) => {
  // req: IncomingMessage (readable stream)
  // res: ServerResponse (writable stream)

  const userId = req.url.split('/')[3]; // Extract '123'
  const user = database.findUser(userId);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(user));
});
```

### 3. Client Receives Response

```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 45

{"id":123,"name":"Alice","email":"alice@example.com"}
```

---

## HTTP Methods

HTTP methods (also called verbs) indicate the desired action:

### GET

**Purpose**: Retrieve data

```javascript
// Request
GET /users

// Response
[{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}]
```

**Characteristics:**
- Should not modify server state
- Can be cached
- Parameters in URL (query string)
- Idempotent (same result each time)

### POST

**Purpose**: Create new resources

```javascript
// Request
POST /users
Content-Type: application/json

{"name": "Charlie", "email": "charlie@example.com"}

// Response
201 Created
Location: /users/123
{"id": 123, "name": "Charlie", "email": "charlie@example.com"}
```

**Characteristics:**
- Modifies server state
- Not cached
- Data in request body
- Not idempotent

### PUT

**Purpose**: Update/replace entire resource

```javascript
// Request
PUT /users/123
Content-Type: application/json

{"name": "Charlie Updated", "email": "new@example.com"}

// Response
200 OK
{"id": 123, "name": "Charlie Updated", "email": "new@example.com"}
```

**Characteristics:**
- Replaces entire resource
- Idempotent
- Data in request body

### PATCH

**Purpose**: Partial update of resource

```javascript
// Request
PATCH /users/123
Content-Type: application/json

{"email": "newemail@example.com"}

// Response
200 OK
{"id": 123, "name": "Charlie", "email": "newemail@example.com"}
```

**Characteristics:**
- Updates only specified fields
- Not necessarily idempotent

### DELETE

**Purpose**: Remove resource

```javascript
// Request
DELETE /users/123

// Response
204 No Content
```

**Characteristics:**
- Removes resource
- Idempotent
- Often returns 204 (No Content)

### HEAD

**Purpose**: Same as GET but without response body

```javascript
// Request
HEAD /users/123

// Response (headers only, no body)
200 OK
Content-Type: application/json
Content-Length: 45
```

**Use cases:**
- Check if resource exists
- Get metadata without downloading content
- Validate cached resources

### OPTIONS

**Purpose**: Get allowed methods for resource

```javascript
// Request
OPTIONS /users

// Response
200 OK
Allow: GET, POST, PUT, DELETE
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
```

**Use cases:**
- CORS preflight requests
- API capability discovery

---

## Status Codes

HTTP status codes indicate the result of a request:

### 1xx: Informational

- **100 Continue**: Server received headers, client should send body
- **101 Switching Protocols**: Switching to WebSocket, etc.

### 2xx: Success

- **200 OK**: Request succeeded
- **201 Created**: Resource created successfully
- **204 No Content**: Success but no content to return
- **206 Partial Content**: Partial resource (range request)

### 3xx: Redirection

- **301 Moved Permanently**: Resource moved to new URL
- **302 Found**: Temporary redirect
- **304 Not Modified**: Cached version is still valid
- **307 Temporary Redirect**: Same as 302 but preserves method

### 4xx: Client Errors

- **400 Bad Request**: Invalid request syntax
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Server refuses to authorize
- **404 Not Found**: Resource doesn't exist
- **405 Method Not Allowed**: Method not supported for resource
- **409 Conflict**: Request conflicts with server state
- **429 Too Many Requests**: Rate limit exceeded

### 5xx: Server Errors

- **500 Internal Server Error**: Generic server error
- **501 Not Implemented**: Server doesn't support functionality
- **502 Bad Gateway**: Invalid response from upstream server
- **503 Service Unavailable**: Server temporarily unavailable
- **504 Gateway Timeout**: Upstream server timeout

### Common Patterns

```javascript
// Success
res.statusCode = 200; // OK
res.statusCode = 201; // Created
res.statusCode = 204; // No Content

// Client Error
res.statusCode = 400; // Bad Request
res.statusCode = 404; // Not Found

// Server Error
res.statusCode = 500; // Internal Server Error
```

---

## Headers

Headers provide metadata about HTTP messages.

### Common Request Headers

```javascript
{
  'Host': 'api.example.com',           // Target host
  'User-Agent': 'Mozilla/5.0',         // Client info
  'Accept': 'application/json',        // Desired response format
  'Accept-Language': 'en-US',          // Preferred language
  'Accept-Encoding': 'gzip, deflate',  // Supported compression
  'Content-Type': 'application/json',  // Body format
  'Content-Length': '123',             // Body size in bytes
  'Authorization': 'Bearer token123',  // Authentication
  'Cookie': 'session=abc123',          // Session data
  'Referer': 'https://example.com',    // Previous page
  'If-None-Match': '"etag123"',        // Conditional request
}
```

### Common Response Headers

```javascript
{
  'Content-Type': 'application/json',      // Response format
  'Content-Length': '456',                 // Response size
  'Content-Encoding': 'gzip',              // Compression used
  'Cache-Control': 'max-age=3600',         // Caching rules
  'ETag': '"etag123"',                     // Resource version
  'Location': '/users/123',                // Redirect target
  'Set-Cookie': 'session=xyz; HttpOnly',   // Set cookie
  'Access-Control-Allow-Origin': '*',      // CORS policy
  'X-RateLimit-Remaining': '99',           // Rate limit info
}
```

### Working with Headers in Node.js

```javascript
// Reading request headers
const server = http.createServer((req, res) => {
  console.log(req.headers['user-agent']);
  console.log(req.headers['content-type']);

  // Setting response headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Custom-Header', 'value');

  // Setting multiple headers
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  });

  res.end(JSON.stringify({ message: 'Hello' }));
});
```

---

## Streams and HTTP

Both requests and responses in Node.js HTTP are streams.

### Request as Readable Stream

```javascript
const server = http.createServer((req, res) => {
  // req is a Readable stream
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    console.log('Request body:', body);
    res.end('Received');
  });
});
```

### Response as Writable Stream

```javascript
const server = http.createServer((req, res) => {
  // res is a Writable stream
  res.write('First chunk\n');
  res.write('Second chunk\n');
  res.end('Final chunk\n');
});
```

### Streaming Files

```javascript
const server = http.createServer((req, res) => {
  const fileStream = fs.createReadStream('large-file.txt');

  // Pipe file directly to response
  fileStream.pipe(res);
});
```

### Benefits of Streaming

1. **Memory Efficiency**: Don't load entire content into memory
2. **Speed**: Start sending data immediately
3. **Scalability**: Handle large files/responses efficiently

---

## Client vs Server

### HTTP Server

Creates a server that listens for incoming requests:

```javascript
const server = http.createServer((req, res) => {
  res.end('Hello from server!');
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

**Use cases:**
- Web applications
- REST APIs
- Microservices
- Static file servers

### HTTP Client

Makes requests to other servers:

```javascript
const options = {
  hostname: 'api.example.com',
  port: 80,
  path: '/users',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.end();
```

**Use cases:**
- Calling external APIs
- Microservice communication
- Webhooks
- Data fetching

### Node.js Can Be Both

```javascript
// Server that makes client requests
const server = http.createServer((req, res) => {
  // Make request to external API
  http.get('http://api.example.com/data', (apiRes) => {
    let data = '';
    apiRes.on('data', chunk => data += chunk);
    apiRes.on('end', () => {
      // Send API response to client
      res.end(data);
    });
  });
});
```

---

## HTTPS and Security

### What is HTTPS?

HTTPS = HTTP + SSL/TLS encryption

**Benefits:**
- Data encryption
- Server authentication
- Data integrity

### Creating HTTPS Server

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

const server = https.createServer(options, (req, res) => {
  res.end('Secure connection!');
});

server.listen(443);
```

### Making HTTPS Requests

```javascript
const https = require('https');

https.get('https://api.github.com/users/octocat', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
```

### Security Best Practices

1. **Always use HTTPS in production**
2. **Validate SSL certificates**
3. **Keep certificates up to date**
4. **Use strong cipher suites**
5. **Implement HSTS (HTTP Strict Transport Security)**

---

## HTTP/2

### What is HTTP/2?

Next generation of HTTP with improved performance:

**Key Features:**
- **Multiplexing**: Multiple requests over single connection
- **Header Compression**: Reduced overhead
- **Server Push**: Server can push resources proactively
- **Binary Protocol**: More efficient parsing

### HTTP/2 Server in Node.js

```javascript
const http2 = require('http2');
const fs = require('fs');

const server = http2.createSecureServer({
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
});

server.on('stream', (stream, headers) => {
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  });
  stream.end('<h1>Hello HTTP/2!</h1>');
});

server.listen(443);
```

### When to Use HTTP/2

- **Modern browsers** support it
- **Performance** is critical
- **Multiple resources** are served
- **HTTPS** is already implemented (HTTP/2 requires HTTPS)

### HTTP/2 vs HTTP/1.1

| Feature | HTTP/1.1 | HTTP/2 |
|---------|----------|--------|
| Connections | Multiple per request | Single multiplexed |
| Headers | Text | Binary (compressed) |
| Server Push | No | Yes |
| Prioritization | No | Yes |
| Performance | Good | Better |

---

## Understanding the Request Object

### Properties

```javascript
req.method        // 'GET', 'POST', etc.
req.url          // '/users?id=123'
req.headers      // { 'user-agent': '...', ... }
req.httpVersion  // '1.1'
req.socket       // Underlying TCP socket
```

### Methods

```javascript
req.on('data', callback)  // Read body chunks
req.on('end', callback)   // Body fully received
req.on('error', callback) // Handle errors
```

---

## Understanding the Response Object

### Properties

```javascript
res.statusCode   // 200, 404, 500, etc.
res.statusMessage // 'OK', 'Not Found', etc.
res.headersSent  // Boolean: headers sent?
```

### Methods

```javascript
res.setHeader(name, value)     // Set single header
res.getHeader(name)            // Get header value
res.removeHeader(name)         // Remove header
res.writeHead(status, headers) // Write status and headers
res.write(data)                // Write body chunk
res.end([data])                // Finish response
```

---

## Common Patterns

### JSON API Response

```javascript
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Usage
sendJSON(res, 200, { message: 'Success', data: users });
```

### Error Handling

```javascript
function handleError(res, error) {
  console.error(error);
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Internal Server Error' }));
}
```

### Request Body Parsing

```javascript
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}
```

---

## Performance Considerations

### Connection Keep-Alive

Reuse TCP connections for multiple requests:

```javascript
const server = http.createServer();
server.keepAliveTimeout = 5000; // 5 seconds
```

### Response Compression

Compress responses to reduce bandwidth:

```javascript
const zlib = require('zlib');

const server = http.createServer((req, res) => {
  const raw = fs.createReadStream('large-file.txt');

  res.setHeader('Content-Encoding', 'gzip');
  raw.pipe(zlib.createGzip()).pipe(res);
});
```

### Streaming Responses

Stream large responses instead of buffering:

```javascript
// Bad: Buffers entire file in memory
const data = fs.readFileSync('large-file.txt');
res.end(data);

// Good: Streams file
fs.createReadStream('large-file.txt').pipe(res);
```

---

## Next Steps

Now that you understand the core concepts:

1. **Start with Level 1**: Learn basic HTTP server and client usage
2. **Practice with Examples**: Run and modify the example code
3. **Complete Exercises**: Build your understanding through practice
4. **Read Guides**: Dive deeper into specific topics
5. **Build Projects**: Apply your knowledge to real applications

Remember: HTTP is fundamental to web development. Take time to understand these concepts deeply, and you'll be well-equipped to build any kind of web application!
