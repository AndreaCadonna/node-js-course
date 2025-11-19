# Level 1: HTTP Basics

Learn the fundamentals of HTTP servers and clients in Node.js.

## Learning Objectives

By completing this level, you will:

- ✅ Understand how HTTP works in Node.js
- ✅ Create basic HTTP servers
- ✅ Handle HTTP requests and responses
- ✅ Work with different HTTP methods (GET, POST, etc.)
- ✅ Set status codes and headers
- ✅ Make HTTP client requests
- ✅ Serve static files
- ✅ Implement basic routing
- ✅ Handle errors gracefully

---

## Prerequisites

- Basic JavaScript knowledge
- Node.js installed (v14+)
- Understanding of asynchronous programming
- Familiarity with callbacks and promises (helpful)

---

## What You'll Learn

### Core Topics

1. **Creating HTTP Servers**
   - `http.createServer()` - Basic server creation
   - Listening on ports
   - Server lifecycle and events

2. **Request Handling**
   - Understanding the request object
   - Parsing URLs and query parameters
   - Reading request headers
   - Handling request body

3. **Response Handling**
   - Setting status codes
   - Setting response headers
   - Sending response data
   - Ending responses properly

4. **HTTP Methods**
   - GET requests
   - POST requests
   - Other methods (PUT, DELETE, etc.)
   - Method-based routing

5. **Making HTTP Requests**
   - Using `http.request()`
   - Using `http.get()`
   - Handling responses
   - Error handling

6. **Basic Routing**
   - URL-based routing
   - Method-based routing
   - Serving different content

7. **Static File Serving**
   - Reading files
   - Setting correct content types
   - Streaming files

8. **Error Handling**
   - Handling server errors
   - Handling request errors
   - Sending error responses

---

## Time Commitment

**Estimated time**: 2-3 hours
- Reading guides: 45-60 minutes
- Studying examples: 30-45 minutes
- Exercises: 45-60 minutes
- Experimentation: 15-30 minutes

---

## Conceptual Guides

Before diving into code, read these guides to build conceptual understanding:

### Essential Reading

1. **[HTTP Servers Fundamentals](guides/01-http-servers.md)** (12 min)
   - How HTTP servers work
   - Request-response cycle
   - Server lifecycle

2. **[Request and Response Objects](guides/02-request-response.md)** (15 min)
   - Request object properties and methods
   - Response object properties and methods
   - Working with headers

3. **[HTTP Methods and Routing](guides/03-methods-routing.md)** (12 min)
   - Understanding HTTP methods
   - Implementing routing
   - Route patterns

4. **[Making HTTP Requests](guides/04-http-client.md)** (10 min)
   - HTTP client basics
   - Making GET and POST requests
   - Handling responses

5. **[Error Handling in HTTP](guides/05-error-handling.md)** (8 min)
   - Common errors
   - Error handling patterns
   - Sending error responses

---

## Key Concepts

### Creating Your First Server

The most basic HTTP server:

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World!\n');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
```

### Understanding Request and Response

```javascript
const server = http.createServer((req, res) => {
  // Request information
  console.log('Method:', req.method);     // GET, POST, etc.
  console.log('URL:', req.url);           // /path?query=value
  console.log('Headers:', req.headers);   // Request headers

  // Set response
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1>Hello!</h1>');
});
```

### Handling Different Routes

```javascript
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.end('Home Page');
  } else if (req.url === '/about') {
    res.end('About Page');
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});
```

### Making HTTP Requests

```javascript
const http = require('http');

http.get('http://api.example.com/data', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
```

---

## Quick Start

### Your First HTTP Server

1. Create a file `server.js`:

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from my first server!');
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

2. Run it:
```bash
node server.js
```

3. Visit in browser:
```
http://localhost:3000
```

4. Test with curl:
```bash
curl http://localhost:3000
```

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting to End Response

```javascript
// ❌ WRONG - response never finishes
const server = http.createServer((req, res) => {
  res.write('Hello');
  // Missing res.end()! Browser waits forever
});

// ✅ CORRECT
const server = http.createServer((req, res) => {
  res.write('Hello');
  res.end();
});
```

### ❌ Pitfall 2: Not Handling Request Body Properly

```javascript
// ❌ WRONG - body is a stream, not immediately available
const server = http.createServer((req, res) => {
  console.log(req.body); // undefined!
});

// ✅ CORRECT - read the stream
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk.toString());
  req.on('end', () => {
    console.log('Body:', body);
    res.end('Received');
  });
});
```

### ❌ Pitfall 3: Port Already in Use

```javascript
// ❌ Error: Port 3000 already in use
server.listen(3000);

// ✅ Handle the error
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Port 3000 is already in use');
  }
});

server.listen(3000);
```

### ❌ Pitfall 4: Setting Headers After Sending Response

```javascript
// ❌ WRONG - can't set headers after response started
const server = http.createServer((req, res) => {
  res.write('Hello');
  res.setHeader('Content-Type', 'text/plain'); // Error!
  res.end();
});

// ✅ CORRECT - set headers before writing
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.write('Hello');
  res.end();
});
```

---

## Exercises

After reading the guides, test your knowledge with these exercises:

### Exercise 1: Basic Server and Routing
Create a server with multiple routes responding with different content.

**Skills practiced:**
- Creating HTTP servers
- Basic routing
- Setting headers and status codes

### Exercise 2: Query Parameters
Build a server that parses and uses URL query parameters.

**Skills practiced:**
- Parsing URLs
- Working with query strings
- Dynamic responses

### Exercise 3: POST Request Handling
Create a server that accepts and processes POST requests.

**Skills practiced:**
- Reading request body
- Parsing JSON
- Handling POST data

### Exercise 4: HTTP Client
Make HTTP requests to external APIs and process responses.

**Skills practiced:**
- Making HTTP requests
- Handling responses
- Error handling

### Exercise 5: Simple Static File Server
Serve static files from a directory.

**Skills practiced:**
- Reading files
- Setting content types
- Streaming files

---

## Examples

### Practical Code Examples

1. **[01-basic-server.js](examples/01-basic-server.js)**
   - Creating a basic HTTP server
   - Handling requests and responses
   - Listening on a port

2. **[02-request-info.js](examples/02-request-info.js)**
   - Accessing request properties
   - Reading headers
   - Logging request information

3. **[03-routing.js](examples/03-routing.js)**
   - URL-based routing
   - Method-based routing
   - Handling 404 errors

4. **[04-status-codes.js](examples/04-status-codes.js)**
   - Setting different status codes
   - Understanding status code meanings
   - Appropriate status code usage

5. **[05-request-body.js](examples/05-request-body.js)**
   - Reading request body
   - Parsing JSON data
   - Handling form data

6. **[06-http-client.js](examples/06-http-client.js)**
   - Making GET requests
   - Making POST requests
   - Handling responses

7. **[07-static-files.js](examples/07-static-files.js)**
   - Serving static files
   - Setting content types
   - Handling file errors

8. **[08-json-api.js](examples/08-json-api.js)**
   - Building a JSON API
   - CRUD operations
   - JSON responses

---

## Learning Path

### Recommended Sequence

1. **Read Conceptual Guides** (60 minutes)
   - Start with [HTTP Servers Fundamentals](guides/01-http-servers.md)
   - Read all 5 guides in order
   - Take notes on key concepts

2. **Study Examples** (45 minutes)
   - Run each example
   - Modify and experiment
   - Understand the patterns

3. **Complete Exercises** (60 minutes)
   - Work through each exercise
   - Don't look at solutions immediately
   - Try multiple approaches

4. **Review Solutions** (20 minutes)
   - Compare with your solutions
   - Understand alternative approaches
   - Note best practices

---

## Testing Your Server

### Using a Browser

Simply visit `http://localhost:3000` in your web browser.

### Using curl

```bash
# GET request
curl http://localhost:3000

# POST request with JSON
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}'

# View response headers
curl -i http://localhost:3000

# Follow redirects
curl -L http://localhost:3000
```

### Using Node.js

```javascript
const http = require('http');

http.get('http://localhost:3000', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
```

---

## Success Criteria

You've mastered Level 1 when you can:

- [ ] Create an HTTP server and make it listen on a port
- [ ] Handle GET and POST requests
- [ ] Parse URLs and query parameters
- [ ] Read and parse request bodies
- [ ] Set status codes and headers appropriately
- [ ] Implement basic routing
- [ ] Make HTTP client requests
- [ ] Serve static files
- [ ] Handle errors gracefully
- [ ] Understand the request-response cycle

---

## What's Next?

After completing Level 1, you'll be ready for:

### Level 2: Intermediate HTTP
- Advanced routing patterns
- Middleware implementation
- File uploads
- Cookie and session management
- HTTPS and security
- Request/response compression
- Advanced error handling

---

## Additional Practice

Want more practice? Try these mini-projects:

1. **Personal Website Server**
   - Serve HTML, CSS, and JavaScript files
   - Multiple pages with navigation
   - Handle 404 errors gracefully

2. **Simple REST API**
   - CRUD operations for a resource
   - In-memory data storage
   - JSON request/response

3. **URL Shortener**
   - Accept long URLs
   - Generate short codes
   - Redirect short URLs to long ones

4. **Echo Server**
   - Return request details
   - Show headers, method, URL
   - Return request body

---

## Resources

### Official Documentation
- [Node.js HTTP Documentation](https://nodejs.org/api/http.html)
- [HTTP Protocol Basics](https://developer.mozilla.org/en-US/docs/Web/HTTP)

### Tools for Testing
- **Browser**: Chrome, Firefox, Safari
- **curl**: Command-line HTTP client
- **Postman**: GUI for API testing
- **httpie**: User-friendly HTTP client

---

## Questions or Stuck?

- Re-read the relevant guide
- Try the example code in isolation
- Check the [CONCEPTS.md](../CONCEPTS.md) for deeper understanding
- Experiment with variations
- Review the solutions after attempting exercises

---

## Let's Begin!

Start with **[HTTP Servers Fundamentals](guides/01-http-servers.md)** and work your way through the guides. Take your time to understand each concept before moving on.

Remember: HTTP is the foundation of the web. Understanding these basics will serve you throughout your entire career in web development!
