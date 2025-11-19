# HTTP Methods and Routing

## HTTP Methods

### GET - Retrieve Data

```javascript
if (req.method === 'GET' && req.url === '/users') {
  res.end(JSON.stringify(users));
}
```

### POST - Create Data

```javascript
if (req.method === 'POST' && req.url === '/users') {
  // Read body, create user, respond
}
```

### PUT - Update Data

```javascript
if (req.method === 'PUT' && req.url.startsWith('/users/')) {
  // Update entire user
}
```

### DELETE - Remove Data

```javascript
if (req.method === 'DELETE' && req.url.startsWith('/users/')) {
  // Delete user
}
```

## Routing Patterns

### Simple Routing

```javascript
if (req.url === '/') {
  res.end('Home');
} else if (req.url === '/about') {
  res.end('About');
} else {
  res.statusCode = 404;
  res.end('Not Found');
}
```

### Dynamic Routes

```javascript
if (req.url.startsWith('/users/')) {
  const id = req.url.split('/')[2];
  res.end(`User ${id}`);
}
```

### Query Parameters

```javascript
const url = require('url');
const parsedUrl = url.parse(req.url, true);
const query = parsedUrl.query;

console.log(query.name); // from ?name=value
```
