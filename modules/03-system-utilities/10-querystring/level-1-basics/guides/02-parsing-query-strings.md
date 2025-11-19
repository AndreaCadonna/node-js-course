# Parsing Query Strings

Learn how to convert query strings into JavaScript objects using `querystring.parse()`.

## The parse() Method

```javascript
const querystring = require('querystring');

const params = querystring.parse('name=John&age=30');
console.log(params); // { name: 'John', age: '30' }
```

## Basic Usage

### Simple Parsing

```javascript
const qs = require('querystring');

const result = qs.parse('search=nodejs&page=1');
// { search: 'nodejs', page: '1' }
```

### Accessing Values

```javascript
const params = qs.parse('name=John&email=john@example.com');

console.log(params.name);  // 'John'
console.log(params.email); // 'john@example.com'
```

## Important Behaviors

### 1. All Values are Strings

```javascript
const params = qs.parse('page=5&limit=20&price=99.99');

console.log(typeof params.page);  // 'string' (not number!)
console.log(typeof params.price); // 'string'

// Convert to numbers
const page = parseInt(params.page, 10);
const price = parseFloat(params.price);
```

### 2. Duplicate Keys Create Arrays

```javascript
const params = qs.parse('color=red&color=blue&color=green');

console.log(params.color); // ['red', 'blue', 'green']
console.log(Array.isArray(params.color)); // true
```

### 3. Empty Values

```javascript
const params = qs.parse('name=John&email=&phone=');

console.log(params.email); // '' (empty string)
console.log(params.phone); // '' (empty string)
```

### 4. Keys Without Values

```javascript
const params = qs.parse('debug&verbose&force');

console.log(params.debug);   // '' (empty string)
console.log(params.verbose); // ''
console.log(params.force);   // ''
```

## Automatic Decoding

Special characters are automatically decoded:

```javascript
const params = qs.parse('name=John%20Doe&email=user%40example.com');

console.log(params.name);  // 'John Doe' (not 'John%20Doe')
console.log(params.email); // 'user@example.com'
```

## Common Patterns

### Extracting from Full URL

```javascript
const fullUrl = 'https://example.com/search?q=nodejs&page=2';

// Method 1: Using split
const queryPart = fullUrl.split('?')[1];
const params = qs.parse(queryPart);

// Method 2: Using URL module
const url = require('url');
const parsed = url.parse(fullUrl, true);
console.log(parsed.query); // Already parsed object
```

### Handling Missing Parameters

```javascript
const params = qs.parse('name=John');

const name = params.name || 'Anonymous';
const age = params.age || '0';
const email = params.email || '';
```

### Safe Array Access

```javascript
const params = qs.parse('tag=nodejs&tag=javascript');

// Ensure it's always an array
const tags = Array.isArray(params.tag)
  ? params.tag
  : [params.tag];
```

## Custom Separators

You can use custom separators instead of `&` and `=`:

```javascript
// Format: name:John;age:30;city:NYC
const params = qs.parse('name:John;age:30', ';', ':');
// { name: 'John', age: '30' }
```

## Edge Cases

### Leading Question Mark

```javascript
// ❌ WRONG - includes the ?
const params1 = qs.parse('?name=John&age=30');
console.log(params1); // { '?name': 'John', age: '30' }

// ✅ CORRECT - remove the ?
const params2 = qs.parse('name=John&age=30');
console.log(params2); // { name: 'John', age: '30' }
```

### Mixed Single and Array Values

```javascript
const params = qs.parse('name=John&tag=a&tag=b&tag=c&age=30');

console.log(params.name); // 'John' (string)
console.log(params.tag);  // ['a', 'b', 'c'] (array)
console.log(params.age);  // '30' (string)
```

## Complete Example

```javascript
const querystring = require('querystring');

function parseSearchParams(url) {
  // Extract query string
  const queryStart = url.indexOf('?');
  if (queryStart === -1) {
    return {};
  }

  const queryStr = url.substring(queryStart + 1);

  // Parse
  const params = querystring.parse(queryStr);

  // Process and convert types
  return {
    query: params.q || '',
    page: parseInt(params.page, 10) || 1,
    limit: parseInt(params.limit, 10) || 20,
    sort: params.sort || 'relevance',
    filters: Array.isArray(params.filter)
      ? params.filter
      : params.filter
      ? [params.filter]
      : []
  };
}

// Usage
const config = parseSearchParams(
  'https://example.com/search?q=nodejs&page=2&limit=50&filter=tutorial&filter=free'
);

console.log(config);
// {
//   query: 'nodejs',
//   page: 2,
//   limit: 50,
//   sort: 'relevance',
//   filters: ['tutorial', 'free']
// }
```

## Summary

- Use `querystring.parse()` to convert query strings to objects
- All values are strings - convert types as needed
- Duplicate keys become arrays
- Empty values become empty strings
- Special characters are automatically decoded
- Remove leading `?` before parsing
- Always validate and provide defaults
