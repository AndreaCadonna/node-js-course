# Request and Response Objects

## The Request Object (IncomingMessage)

### Key Properties

```javascript
req.method        // 'GET', 'POST', etc.
req.url           // '/path?query=value'
req.headers       // { host: 'localhost', ... }
req.httpVersion   // '1.1'
```

### Reading Request Body

```javascript
let body = '';
req.on('data', chunk => body += chunk);
req.on('end', () => {
  console.log('Body:', body);
});
```

## The Response Object (ServerResponse)

### Setting Status Code

```javascript
res.statusCode = 200;
res.statusMessage = 'OK';
```

### Setting Headers

```javascript
res.setHeader('Content-Type', 'text/html');
res.setHeader('X-Custom-Header', 'value');

// Or all at once
res.writeHead(200, {
  'Content-Type': 'application/json'
});
```

### Sending Response

```javascript
res.write('chunk1');
res.write('chunk2');
res.end('final chunk');

// Or simply
res.end('response data');
```

## Complete Example

```javascript
const server = http.createServer((req, res) => {
  // Read request
  console.log(req.method, req.url);
  console.log(req.headers);

  // Send response
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World');
});
```
