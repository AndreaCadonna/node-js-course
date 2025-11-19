# querystring vs URLSearchParams

Understand the differences and when to use each approach.

## Overview

Node.js provides two ways to work with query strings:

1. **`querystring` module** - Node.js legacy API
2. **`URLSearchParams`** - Modern WHATWG standard

## Basic Comparison

### querystring Module

```javascript
const qs = require('querystring');

// Parse: returns plain object
const params = qs.parse('name=John&age=30');
console.log(params); // { name: 'John', age: '30' }
console.log(params.name); // 'John'

// Stringify: from object
const str = qs.stringify({ name: 'John', age: 30 });
console.log(str); // 'name=John&age=30'
```

### URLSearchParams

```javascript
// Parse: returns URLSearchParams instance
const params = new URLSearchParams('name=John&age=30');
console.log(params.get('name')); // 'John'

// Build: method chaining
const params2 = new URLSearchParams();
params2.append('name', 'John');
params2.append('age', '30');
console.log(params2.toString()); // 'name=John&age=30'
```

## Key Differences

### 1. Return Type

```javascript
// querystring - Plain object
const qs = require('querystring');
const obj = qs.parse('a=1&b=2');
console.log(obj); // { a: '1', b: '2' }
console.log(obj.constructor.name); // 'Object'

// URLSearchParams - Special instance
const params = new URLSearchParams('a=1&b=2');
console.log(params.constructor.name); // 'URLSearchParams'
console.log(params.get('a')); // '1'
```

### 2. Space Encoding

```javascript
const text = 'Hello World';

// querystring uses %20
qs.escape(text); // 'Hello%20World'

// URLSearchParams uses +
const params = new URLSearchParams({ q: text });
params.toString(); // 'q=Hello+World'
```

### 3. Available Methods

```javascript
const qs = require('querystring');

// querystring - Only 4 methods
qs.parse()
qs.stringify()
qs.escape()
qs.unescape()

// URLSearchParams - Many methods
const params = new URLSearchParams();
params.append(key, value)   // Add parameter
params.delete(key)          // Remove parameter
params.get(key)             // Get first value
params.getAll(key)          // Get all values
params.has(key)             // Check existence
params.set(key, value)      // Set/replace value
params.sort()               // Sort parameters
params.toString()           // Convert to string
params.forEach(callback)    // Iterate
params.entries()            // Iterator
params.keys()               // Get all keys
params.values()             // Get all values
```

### 4. Custom Separators

```javascript
// querystring - Supports custom separators
qs.parse('a:1;b:2', ';', ':');
// { a: '1', b: '2' }

qs.stringify({ a: 1, b: 2 }, ';', ':');
// 'a:1;b:2'

// URLSearchParams - No custom separators
// Always uses & and =
```

### 5. Arrays Handling

```javascript
// querystring - Duplicate keys become array
const obj = qs.parse('color=red&color=blue');
console.log(obj.color); // ['red', 'blue']

// URLSearchParams - Use getAll()
const params = new URLSearchParams('color=red&color=blue');
console.log(params.get('color')); // 'red' (first only)
console.log(params.getAll('color')); // ['red', 'blue']
```

## When to Use Each

### Use `querystring` When:

1. **Working with legacy Node.js code**
```javascript
// Existing codebase uses querystring
const params = qs.parse(req.url.split('?')[1]);
```

2. **Need simple object conversion**
```javascript
// Quick parse to object
const obj = qs.parse(queryStr);
console.log(obj.page); // Direct access
```

3. **Need custom separators**
```javascript
// Special format
qs.parse('a:1;b:2', ';', ':');
```

4. **Want plain objects**
```javascript
// Easy to work with
const params = qs.parse(queryStr);
const { page, limit, sort } = params; // Destructuring works
```

### Use `URLSearchParams` When:

1. **Writing new code**
```javascript
// Modern, standard approach
const params = new URLSearchParams(window.location.search);
```

2. **Need browser compatibility**
```javascript
// Works in Node.js AND browsers
const params = new URLSearchParams('q=nodejs');
console.log(params.get('q')); // 'nodejs'
```

3. **Need rich API**
```javascript
const params = new URLSearchParams();

// Check existence
if (params.has('page')) { }

// Delete parameters
params.delete('old');

// Iterate
params.forEach((value, key) => {
  console.log(`${key}: ${value}`);
});
```

4. **Working with URL object**
```javascript
const url = new URL('https://example.com/search?q=nodejs');

// URLSearchParams built-in
url.searchParams.append('page', 2);
url.searchParams.delete('old');

console.log(url.toString());
```

## Migration Guide

### querystring to URLSearchParams

```javascript
// Before (querystring)
const qs = require('querystring');
const params = qs.parse('name=John&age=30');
console.log(params.name); // 'John'

// After (URLSearchParams)
const params = new URLSearchParams('name=John&age=30');
console.log(params.get('name')); // 'John'

// Or convert to object
const obj = Object.fromEntries(params);
console.log(obj.name); // 'John'
```

### Stringify Comparison

```javascript
// querystring
const obj = { name: 'John', age: 30 };
qs.stringify(obj); // 'name=John&age=30'

// URLSearchParams
const params = new URLSearchParams(obj);
params.toString(); // 'name=John&age=30'
```

## Practical Examples

### Express.js (Modern)

```javascript
const express = require('express');
const app = express();

app.get('/search', (req, res) => {
  // Express parses to object (like querystring)
  const query = req.query.q;
  const page = req.query.page || 1;

  // Or use URLSearchParams for manipulation
  const url = new URL(req.url, `http://${req.headers.host}`);
  const params = url.searchParams;

  if (!params.has('limit')) {
    params.set('limit', '20');
  }
});
```

### URL Building

```javascript
// querystring approach
function buildUrl(path, params) {
  const query = qs.stringify(params);
  return query ? `${path}?${query}` : path;
}

// URLSearchParams approach
function buildUrl(path, params) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

// Or use URL constructor
function buildUrl(path, params) {
  const url = new URL(path, 'http://example.com');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.pathname + url.search;
}
```

## Performance Considerations

```javascript
// querystring is slightly faster for simple operations
console.time('querystring');
for (let i = 0; i < 10000; i++) {
  qs.parse('a=1&b=2&c=3');
}
console.timeEnd('querystring'); // ~5-10ms

// URLSearchParams has overhead but more features
console.time('URLSearchParams');
for (let i = 0; i < 10000; i++) {
  new URLSearchParams('a=1&b=2&c=3');
}
console.timeEnd('URLSearchParams'); // ~10-15ms

// Difference is minimal in real applications
```

## Recommendation

**For new projects**: Use `URLSearchParams`
- Modern standard
- Better browser compatibility
- Richer API
- Future-proof

**For existing projects**: Can continue using `querystring`
- Well-tested
- Simpler for basic needs
- Direct object access

**For libraries**: Support both
```javascript
function parseQuery(queryStr) {
  // Accept both
  if (queryStr instanceof URLSearchParams) {
    return Object.fromEntries(queryStr);
  }
  return qs.parse(queryStr);
}
```

## Summary

| Feature | querystring | URLSearchParams |
|---------|------------|----------------|
| Return type | Plain object | URLSearchParams instance |
| Space encoding | `%20` | `+` |
| API | Simple (4 methods) | Rich (many methods) |
| Custom separators | ✅ Yes | ❌ No |
| Browser support | ❌ Node only | ✅ Universal |
| Direct property access | ✅ Yes | ❌ Use `.get()` |
| Modern standard | ❌ Legacy | ✅ WHATWG |
| Performance | Slightly faster | Slightly slower |

Choose based on your needs, but prefer `URLSearchParams` for new code!
