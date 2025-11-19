# Error Handling in HTTP

## Server Errors

```javascript
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('Port already in use');
  } else {
    console.error('Server error:', error);
  }
});
```

## Request Errors

```javascript
req.on('error', (error) => {
  console.error('Request error:', error);
  res.statusCode = 500;
  res.end('Internal Server Error');
});
```

## Try-Catch for Synchronous Code

```javascript
try {
  const data = JSON.parse(body);
  // Process data
} catch (error) {
  res.statusCode = 400;
  res.end('Bad Request: Invalid JSON');
}
```

## Error Response Format

```javascript
function sendError(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: true,
    message: message
  }));
}

// Usage
sendError(res, 404, 'Not Found');
```
