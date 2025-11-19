# Using the URL API

This guide explains the WHATWG URL API - the modern, standard way to work with URLs in Node.js.

## What is the WHATWG URL API?

The **WHATWG URL Standard** is a specification that defines how URLs should be parsed and manipulated. It's implemented in:
- Modern browsers
- Node.js (since v7.0.0)
- Deno
- Other JavaScript runtimes

## The URL Class

The global `URL` class is the core of the API:

```javascript
// Available globally in Node.js
const url = new URL('https://example.com');

// Or import from 'url' module
const { URL } = require('url');
const url2 = new URL('https://example.com');
```

## Creating URL Objects

### From Absolute URLs

```javascript
const url = new URL('https://www.example.com/path?key=value#section');

console.log(url.href);
// 'https://www.example.com/path?key=value#section'
```

### From Relative URLs (with Base)

```javascript
// Relative URLs require a base
const url = new URL('/api/users', 'https://example.com');

console.log(url.href);
// 'https://example.com/api/users'
```

### Error Handling

```javascript
// Invalid URLs throw TypeError
try {
  const url = new URL('not a valid url');
} catch (err) {
  console.error('Invalid URL:', err.message);
}

// Relative URL without base throws
try {
  const url = new URL('/path'); // Error!
} catch (err) {
  console.error('Need base:', err.message);
}
```

## Accessing URL Properties

All components are accessible as properties:

```javascript
const url = new URL('https://user:pass@example.com:8080/path?key=value#section');

// Read properties
console.log(url.protocol);  // 'https:'
console.log(url.username);  // 'user'
console.log(url.password);  // 'pass'
console.log(url.hostname);  // 'example.com'
console.log(url.port);      // '8080'
console.log(url.host);      // 'example.com:8080'
console.log(url.pathname);  // '/path'
console.log(url.search);    // '?key=value'
console.log(url.hash);      // '#section'
console.log(url.origin);    // 'https://example.com:8080' (read-only)
console.log(url.href);      // Full URL (read-write)
```

## Modifying URL Properties

URL objects are mutable:

```javascript
const url = new URL('https://example.com');

// Modify properties
url.protocol = 'http:';
url.hostname = 'api.example.com';
url.port = '8080';
url.pathname = '/v1/users';
url.hash = '#results';

console.log(url.href);
// 'http://api.example.com:8080/v1/users#results'
```

## Working with Query Parameters

The `searchParams` property returns a `URLSearchParams` object:

```javascript
const url = new URL('https://example.com/search');

// Add parameters
url.searchParams.set('q', 'nodejs');
url.searchParams.set('limit', '10');

console.log(url.href);
// 'https://example.com/search?q=nodejs&limit=10'

// Read parameters
console.log(url.searchParams.get('q'));     // 'nodejs'
console.log(url.searchParams.get('limit')); // '10'
```

## Converting to String

```javascript
const url = new URL('https://example.com/path');

// Method 1: href property
console.log(url.href); // 'https://example.com/path'

// Method 2: toString()
console.log(url.toString()); // 'https://example.com/path'

// Both are equivalent
console.log(url.href === url.toString()); // true
```

## URL API vs Legacy url.parse()

### The Old Way (Deprecated)

```javascript
const url = require('url');
const parsed = url.parse('https://example.com/path?key=value');

console.log(parsed);
// Returns plain object with properties
```

### The New Way (Recommended)

```javascript
const url = new URL('https://example.com/path?key=value');

console.log(url);
// Returns URL object with methods
```

### Why Use URL API?

1. **Web Standard** - Same API in browsers and Node.js
2. **Better validation** - Strict URL parsing
3. **Mutable** - Can modify properties
4. **URLSearchParams** - Built-in query parameter handling
5. **Active development** - Legacy API is deprecated

## Practical Examples

### Example 1: Building API URLs

```javascript
function buildApiUrl(baseUrl, endpoint, params) {
  const url = new URL(endpoint, baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.href;
}

const apiUrl = buildApiUrl(
  'https://api.example.com',
  '/v1/users',
  { role: 'admin', status: 'active' }
);

console.log(apiUrl);
// 'https://api.example.com/v1/users?role=admin&status=active'
```

### Example 2: Parsing Request URLs

```javascript
function parseRequestUrl(requestUrl, host) {
  const url = new URL(requestUrl, `https://${host}`);

  return {
    pathname: url.pathname,
    query: Object.fromEntries(url.searchParams),
    hash: url.hash
  };
}

const request = parseRequestUrl(
  '/api/users?page=1&limit=10',
  'api.example.com'
);

console.log(request);
// {
//   pathname: '/api/users',
//   query: { page: '1', limit: '10' },
//   hash: ''
// }
```

### Example 3: URL Validation

```javascript
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

console.log(isValidUrl('https://example.com')); // true
console.log(isValidUrl('not a url')); // false
```

## Common Patterns

### Pattern 1: Clone a URL

```javascript
const original = new URL('https://example.com/path');
const clone = new URL(original.href);

clone.pathname = '/new-path';

console.log(original.href); // 'https://example.com/path'
console.log(clone.href);    // 'https://example.com/new-path'
```

### Pattern 2: Merge Query Parameters

```javascript
const url = new URL('https://example.com?existing=param');

const newParams = { page: 1, limit: 10 };
Object.entries(newParams).forEach(([key, value]) => {
  url.searchParams.set(key, value);
});

console.log(url.href);
// 'https://example.com?existing=param&page=1&limit=10'
```

### Pattern 3: Remove Query Parameters

```javascript
const url = new URL('https://example.com/path?foo=bar&baz=qux');

url.searchParams.delete('baz');

console.log(url.href);
// 'https://example.com/path?foo=bar'
```

## Browser vs Node.js

The URL API works identically in both:

```javascript
// In Node.js
const url = new URL('https://example.com');

// In Browser
const url = new URL('https://example.com');

// Same API, same behavior!
```

This makes code portable between environments.

## Important Notes

### 1. URL Objects are Mutable

```javascript
const url = new URL('https://example.com');
url.pathname = '/new-path';  // Modifies the object

console.log(url.href); // 'https://example.com/new-path'
```

### 2. Relative URLs Need a Base

```javascript
// ✗ Error - no base
new URL('/path');

// ✓ Correct - with base
new URL('/path', 'https://example.com');
```

### 3. Protocol Must Include Colon

```javascript
url.protocol = 'https:';  // ✓ Correct
url.protocol = 'https';   // ✗ Won't work as expected
```

### 4. searchParams is Always Available

```javascript
const url = new URL('https://example.com');
// searchParams exists even with no query string
url.searchParams.set('key', 'value');

console.log(url.href); // 'https://example.com?key=value'
```

## Summary

The WHATWG URL API provides:

**Key Features:**
- ✓ Global `URL` class
- ✓ Parse URLs from strings
- ✓ Access all URL components
- ✓ Modify URLs easily
- ✓ Built-in query parameter handling
- ✓ Automatic encoding/decoding
- ✓ Strict validation
- ✓ Cross-platform compatibility

**Best Practices:**
- Always use the modern URL API
- Handle errors with try-catch
- Provide base for relative URLs
- Use searchParams for queries
- Validate user-provided URLs

The URL API is the standard way to work with URLs in modern JavaScript!
