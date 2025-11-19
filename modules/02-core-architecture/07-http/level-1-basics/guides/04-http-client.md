# Making HTTP Requests

## Using http.get()

```javascript
const http = require('http');

http.get('http://api.example.com/data', (res) => {
  let data = '';

  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', err => console.error(err));
```

## Using http.request()

```javascript
const options = {
  hostname: 'api.example.com',
  port: 80,
  path: '/users',
  method: 'GET',
  headers: {
    'User-Agent': 'Node.js'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});

req.on('error', err => console.error(err));
req.end();
```

## POST Request

```javascript
const postData = JSON.stringify({ name: 'Alice' });

const options = {
  hostname: 'api.example.com',
  path: '/users',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  // Handle response
});

req.write(postData);
req.end();
```
