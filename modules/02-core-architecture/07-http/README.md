# Module 7: HTTP

Master building web servers and clients with Node.js HTTP module.

## Why This Module Matters

The `http` and `https` modules are at the heart of web development in Node.js. Understanding how to build HTTP servers and clients is fundamental to creating web applications, APIs, microservices, and any networked application. Node.js's non-blocking I/O makes it particularly well-suited for building high-performance web servers.

**Real-world applications:**
- Building REST APIs and web services
- Creating web servers and applications
- Making HTTP requests to external APIs
- Implementing reverse proxies and load balancers
- Building webhooks and callback handlers
- Creating HTTP middleware and routing systems
- Implementing file upload/download services
- Building real-time communication backends

---

## What You'll Learn

By completing this module, you'll master:

### Technical Skills
- Creating HTTP servers and handling requests
- Making HTTP client requests
- Understanding request/response objects
- Working with headers and status codes
- Handling different HTTP methods
- Request body parsing
- File uploads and downloads
- Cookie and session management

### Practical Applications
- Build production-ready web servers
- Create RESTful APIs
- Implement authentication systems
- Handle file uploads efficiently
- Make external API calls
- Build HTTP middleware
- Optimize server performance
- Implement security best practices

---

## Module Structure

This module is divided into three progressive levels:

### [Level 1: Basics](./level-1-basics/README.md)
**Time**: 2-3 hours

Learn the fundamentals of HTTP in Node.js:
- Creating a basic HTTP server
- Understanding request and response objects
- Handling different routes
- Setting status codes and headers
- Making HTTP client requests
- Understanding HTTP methods (GET, POST, etc.)
- Serving static files
- Basic error handling

**You'll be able to:**
- Create simple HTTP servers
- Handle basic routing
- Make HTTP requests to APIs
- Serve static content
- Work with headers and status codes
- Handle basic request data

### [Level 2: Intermediate](./level-2-intermediate/README.md)
**Time**: 3-4 hours

Advanced HTTP server and client techniques:
- Request body parsing (JSON, URL-encoded, multipart)
- File upload handling
- Cookie management
- Session handling
- Creating reusable middleware
- Implementing routing systems
- Stream-based responses
- HTTPS and SSL/TLS
- Error handling patterns

**You'll be able to:**
- Build RESTful APIs
- Handle form submissions and file uploads
- Implement authentication
- Create middleware systems
- Use HTTPS for secure communication
- Build efficient streaming responses
- Handle complex routing scenarios

### [Level 3: Advanced](./level-3-advanced/README.md)
**Time**: 4-5 hours

Production-ready HTTP applications:
- Performance optimization and tuning
- Connection pooling and keep-alive
- Request/response compression
- Rate limiting and throttling
- Advanced security (CORS, CSP, XSS protection)
- HTTP/2 server push
- Reverse proxy implementation
- Load balancing strategies
- Monitoring and logging
- Graceful shutdown

**You'll be able to:**
- Build high-performance production servers
- Implement advanced security measures
- Optimize for scale and performance
- Handle thousands of concurrent connections
- Implement HTTP/2 features
- Build production-grade APIs
- Monitor and debug HTTP applications
- Design resilient server architectures

---

## Prerequisites

- **Module 4: Events** (recommended - HTTP uses EventEmitter)
- **Module 5: Stream** (highly recommended - requests/responses are streams)
- **Module 3: Buffer** (helpful for binary data handling)
- Basic JavaScript knowledge
- Understanding of asynchronous programming
- Node.js installed (v14+)
- Basic understanding of HTTP protocol (helpful but not required)

---

## Learning Path

### Recommended Approach

1. **Read** the [CONCEPTS.md](./CONCEPTS.md) file first for foundational understanding
2. **Start** with Level 1 and progress sequentially
3. **Study** the examples in each level
4. **Complete** the exercises before checking solutions
5. **Read** the conceptual guides for deeper understanding
6. **Practice** by building the suggested projects

### Alternative Approaches

**Fast Track** (If you're experienced with HTTP):
- Skim Level 1
- Focus on Level 2 and 3
- Complete advanced exercises

**Deep Dive** (If you want complete mastery):
- Read all guides thoroughly
- Complete all exercises
- Build additional projects
- Study the solutions for alternative approaches

---

## Key Concepts

### Creating an HTTP Server

The simplest HTTP server in Node.js:

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
```

### Request and Response Objects

Every request handler receives `req` (IncomingMessage) and `res` (ServerResponse):

```javascript
const server = http.createServer((req, res) => {
  // Request properties
  console.log('Method:', req.method);      // GET, POST, etc.
  console.log('URL:', req.url);            // /path?query=value
  console.log('Headers:', req.headers);    // Request headers

  // Response methods
  res.statusCode = 200;                    // Set status code
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ message: 'OK' }));
});
```

### Making HTTP Requests

Node.js can also act as an HTTP client:

```javascript
const http = require('http');

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

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
```

### Routing Basics

Handle different URLs and methods:

```javascript
const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (method === 'GET' && url === '/') {
    res.end('Home page');
  } else if (method === 'GET' && url === '/about') {
    res.end('About page');
  } else if (method === 'POST' && url === '/api/data') {
    res.end('Data received');
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});
```

---

## Practical Examples

### Example 1: Simple REST API

```javascript
const http = require('http');

let users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
];

const server = http.createServer((req, res) => {
  const { method, url } = req;

  res.setHeader('Content-Type', 'application/json');

  if (method === 'GET' && url === '/users') {
    res.end(JSON.stringify(users));
  } else if (method === 'POST' && url === '/users') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const user = JSON.parse(body);
      user.id = users.length + 1;
      users.push(user);
      res.statusCode = 201;
      res.end(JSON.stringify(user));
    });
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(3000);
```

### Example 2: Serving Static Files

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'public', req.url);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.statusCode = 404;
      res.end('File not found');
    } else {
      res.statusCode = 200;
      res.end(content);
    }
  });
});

server.listen(3000);
```

### Example 3: Making External API Calls

```javascript
const https = require('https');

function fetchUserData(userId) {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/users/${userId}`;

    https.get(url, {
      headers: { 'User-Agent': 'Node.js' }
    }, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

fetchUserData('octocat').then(console.log);
```

---

## Common Pitfalls

### ❌ Not Handling Request Body Properly

```javascript
// Wrong - request body is a stream
const server = http.createServer((req, res) => {
  const data = req.body; // undefined! Body is not auto-parsed
});

// Correct - read the stream
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const data = JSON.parse(body);
    // Now you can use data
  });
});
```

### ❌ Forgetting to End the Response

```javascript
// Wrong - response never finishes
const server = http.createServer((req, res) => {
  res.write('Hello');
  // Missing res.end()! Client waits forever
});

// Correct - always end the response
const server = http.createServer((req, res) => {
  res.write('Hello');
  res.end(); // or res.end('Hello')
});
```

### ❌ Not Handling Errors

```javascript
// Wrong - unhandled errors crash the server
const server = http.createServer((req, res) => {
  const data = JSON.parse(req.body); // Could throw!
});

// Correct - handle errors gracefully
const server = http.createServer((req, res) => {
  try {
    // Your code
  } catch (error) {
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.on('error', (error) => {
  console.error('Server error:', error);
});
```

---

## Module Contents

### Documentation
- **[CONCEPTS.md](./CONCEPTS.md)** - Foundational concepts for the entire module
- **Level READMEs** - Specific guidance for each level

### Code Examples
- **8 examples per level** (24 total) - Practical demonstrations
- **Fully commented** - Learn from reading the code
- **Runnable** - Execute them to see results

### Exercises
- **5 exercises per level** (15 total) - Practice problems
- **Progressive difficulty** - Build your skills gradually
- **Complete solutions** - Check your work

### Conceptual Guides
- **15 in-depth guides** - Deep understanding of specific topics
- **Level 1**: 5 guides on fundamentals
- **Level 2**: 5 guides on intermediate patterns
- **Level 3**: 5 guides on advanced topics

---

## Getting Started

### Quick Start

1. **Read the concepts**:
   ```bash
   # Read the foundational concepts
   cat CONCEPTS.md
   ```

2. **Start Level 1**:
   ```bash
   cd level-1-basics
   cat README.md
   ```

3. **Run your first server**:
   ```bash
   node examples/01-basic-server.js
   ```

4. **Visit in browser**:
   ```
   http://localhost:3000
   ```

### Setting Up

No special setup is required! The http module is built into Node.js.

```javascript
// Just import and start using
const http = require('http');
const https = require('https');
```

---

## Success Criteria

You'll know you've mastered this module when you can:

- [ ] Create HTTP servers and handle requests/responses
- [ ] Implement RESTful API endpoints
- [ ] Make HTTP client requests to external APIs
- [ ] Handle different HTTP methods and routing
- [ ] Parse request bodies (JSON, form data, files)
- [ ] Serve static files efficiently
- [ ] Implement authentication and authorization
- [ ] Use HTTPS for secure communication
- [ ] Optimize server performance for production
- [ ] Handle errors and edge cases gracefully
- [ ] Implement security best practices

---

## Why HTTP Matters

### Foundation of Web Development

HTTP is the foundation of the web. Every web application, API, and web service uses HTTP:

```javascript
// Web servers
const server = http.createServer(handler);

// RESTful APIs
app.get('/api/users', getUsers);
app.post('/api/users', createUser);

// Microservices
service.listen(3000);
```

### Node.js Excels at HTTP

Node.js's event-driven, non-blocking architecture makes it perfect for HTTP servers:

- Handle thousands of concurrent connections
- Non-blocking I/O for high throughput
- Efficient memory usage
- Fast response times

### Real-World Impact

Understanding HTTP in Node.js opens doors to:
- Building production web applications
- Creating APIs consumed by millions
- Implementing microservices architectures
- Building real-time applications
- Creating serverless functions

---

## Additional Resources

### Official Documentation
- [Node.js HTTP Documentation](https://nodejs.org/api/http.html)
- [Node.js HTTPS Documentation](https://nodejs.org/api/https.html)
- [HTTP/2 Module](https://nodejs.org/api/http2.html)

### Practice Projects
After completing this module, try building:
1. **REST API** - Full CRUD API for a todo app
2. **Static File Server** - Serve files with proper MIME types
3. **Reverse Proxy** - Forward requests to multiple backends
4. **URL Shortener** - Create and redirect short URLs
5. **Webhook Handler** - Receive and process webhooks

### Related Modules
- **Module 4: Events** - HTTP servers use EventEmitter
- **Module 5: Stream** - Requests and responses are streams
- **Module 9: URL** - Parse and construct URLs
- **Module 10: Query String** - Parse URL query parameters

---

## Questions or Issues?

- Review the [CONCEPTS.md](./CONCEPTS.md) for foundational understanding
- Check the examples for practical demonstrations
- Study the guides for deep dives into specific topics
- Review solutions after attempting exercises

---

## Let's Begin!

Start your journey with [Level 1: Basics](./level-1-basics/README.md) and learn to build powerful web servers and clients with Node.js.

Remember: HTTP is the backbone of the modern web. Master it, and you'll be able to build any kind of web application or API you can imagine!
