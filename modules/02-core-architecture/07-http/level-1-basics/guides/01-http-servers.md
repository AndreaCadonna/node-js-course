# HTTP Servers Fundamentals

Understanding how HTTP servers work in Node.js.

## What is an HTTP Server?

An HTTP server is a program that listens for incoming HTTP requests and sends back HTTP responses. In Node.js, the `http` module provides everything you need to create a server.

## The Request-Response Cycle

1. **Client** sends HTTP request
2. **Server** receives request
3. **Server** processes request
4. **Server** sends response
5. **Client** receives response

```
Client ──────request──────> Server
       <─────response──────
```

## Creating a Server

### Basic Server Creation

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  // This function is called for each request
  res.end('Hello World');
});

server.listen(3000);
```

### The Callback Function

The callback receives two arguments:

- **`req`** (IncomingMessage): Represents the HTTP request
- **`res`** (ServerResponse): Used to send the HTTP response

### Server Lifecycle

```javascript
const server = http.createServer(requestHandler);

// Start listening
server.listen(3000, () => {
  console.log('Server started');
});

// Handle connections
server.on('connection', (socket) => {
  console.log('New connection');
});

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Close server
server.close(() => {
  console.log('Server closed');
});
```

## Server Methods

### server.listen()

Start the server on a specific port:

```javascript
// Basic
server.listen(3000);

// With hostname
server.listen(3000, 'localhost');

// With callback
server.listen(3000, () => {
  console.log('Server running');
});

// With all options
server.listen({
  port: 3000,
  host: 'localhost',
  backlog: 511
}, () => {
  console.log('Server ready');
});
```

### server.close()

Stop accepting new connections:

```javascript
server.close((error) => {
  if (error) {
    console.error('Error closing server:', error);
  } else {
    console.log('Server closed successfully');
  }
});
```

### server.setTimeout()

Set timeout for inactive connections:

```javascript
// Timeout after 2 seconds of inactivity
server.setTimeout(2000, (socket) => {
  console.log('Socket timed out');
  socket.end();
});
```

## Server Events

### 'request'

Emitted each time there is a request:

```javascript
server.on('request', (req, res) => {
  console.log(`${req.method} ${req.url}`);
});
```

### 'connection'

Emitted when new TCP connection is established:

```javascript
server.on('connection', (socket) => {
  console.log('New TCP connection');
});
```

### 'error'

Emitted when an error occurs:

```javascript
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('Port already in use');
  } else {
    console.error('Server error:', error);
  }
});
```

### 'listening'

Emitted when server starts listening:

```javascript
server.on('listening', () => {
  const address = server.address();
  console.log(`Listening on ${address.address}:${address.port}`);
});
```

### 'close'

Emitted when server closes:

```javascript
server.on('close', () => {
  console.log('Server has closed');
});
```

## Common Patterns

### Graceful Shutdown

```javascript
const server = http.createServer(handler);

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  console.log('Shutting down gracefully...');

  server.close((err) => {
    if (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }

    console.log('Server closed');
    process.exit(0);
  });

  // Force close after timeout
  setTimeout(() => {
    console.error('Forced shutdown');
    process.exit(1);
  }, 10000);
}
```

### Port Already in Use

```javascript
const PORT = 3000;

server.listen(PORT);

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    console.log('Try a different port or stop the other server');
    process.exit(1);
  }
});
```

### Multiple Servers

```javascript
const server1 = http.createServer((req, res) => {
  res.end('Server 1');
});

const server2 = http.createServer((req, res) => {
  res.end('Server 2');
});

server1.listen(3000);
server2.listen(3001);
```

## Server Properties

### server.listening

Boolean indicating if server is listening:

```javascript
console.log('Is listening:', server.listening); // false

server.listen(3000, () => {
  console.log('Is listening:', server.listening); // true
});
```

### server.maxHeadersCount

Maximum number of headers allowed:

```javascript
server.maxHeadersCount = 1000; // Default is 2000
```

### server.timeout

Socket timeout in milliseconds:

```javascript
server.timeout = 120000; // 2 minutes
```

## Best Practices

### 1. Always Handle Errors

```javascript
server.on('error', (error) => {
  console.error('Server error:', error);
});
```

### 2. Implement Graceful Shutdown

```javascript
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
```

### 3. Set Appropriate Timeouts

```javascript
server.setTimeout(30000); // 30 seconds
server.keepAliveTimeout = 5000; // 5 seconds
```

### 4. Use Environment Variables for Port

```javascript
const PORT = process.env.PORT || 3000;
server.listen(PORT);
```

### 5. Log Server Start

```javascript
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Process ID: ${process.pid}`);
});
```

## Performance Considerations

### Keep-Alive Connections

```javascript
// Node.js enables keep-alive by default
server.keepAliveTimeout = 5000; // ms
```

### Connection Limit

```javascript
// Maximum pending connections
server.listen(3000, {
  backlog: 511 // Default value
});
```

### Request Timeout

```javascript
server.setTimeout(2 * 60 * 1000); // 2 minutes
```

## Summary

- Use `http.createServer()` to create a server
- Call `server.listen()` to start accepting connections
- Handle errors with `server.on('error')`
- Implement graceful shutdown
- Set appropriate timeouts
- Use environment variables for configuration

## Next Steps

- Learn about [Request and Response Objects](./02-request-response.md)
- Understand [HTTP Methods and Routing](./03-methods-routing.md)
- Practice with the examples and exercises
