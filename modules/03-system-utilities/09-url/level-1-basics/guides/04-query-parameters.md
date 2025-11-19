# Working with Query Parameters

This guide explains how to effectively work with URL query parameters using the URLSearchParams API.

## What are Query Parameters?

Query parameters (also called query strings or search parameters) are key-value pairs appended to a URL to pass data to the server or application.

### Format

```
https://example.com/path?key1=value1&key2=value2&key3=value3
                        │
                        └─ Starts with ?
                           Pairs separated by &
                           Format: key=value
```

### Common Uses

- **Search queries**: `?q=nodejs&category=tutorials`
- **Pagination**: `?page=2&limit=20`
- **Filters**: `?color=blue&size=large&inStock=true`
- **Sorting**: `?sortBy=price&order=asc`
- **Tracking**: `?utm_source=google&utm_medium=cpc`

## The URLSearchParams API

Node.js provides the `URLSearchParams` class for working with query parameters.

### Accessing searchParams

Every URL object has a `searchParams` property:

```javascript
const url = new URL('https://example.com/search?q=nodejs');

console.log(url.searchParams); // URLSearchParams object
console.log(url.search);       // '?q=nodejs' (string)
```

## Basic Operations

### Reading Parameters

#### get() - Get Single Value

```javascript
const url = new URL('https://example.com?name=John&age=30');

console.log(url.searchParams.get('name')); // 'John'
console.log(url.searchParams.get('age'));  // '30'
console.log(url.searchParams.get('city')); // null (doesn't exist)
```

#### getAll() - Get All Values for a Key

```javascript
const url = new URL('https://example.com?tag=js&tag=node&tag=web');

console.log(url.searchParams.get('tag'));    // 'js' (first value)
console.log(url.searchParams.getAll('tag')); // ['js', 'node', 'web']
```

#### has() - Check if Parameter Exists

```javascript
const url = new URL('https://example.com?id=123&draft=true');

console.log(url.searchParams.has('id'));        // true
console.log(url.searchParams.has('draft'));     // true
console.log(url.searchParams.has('published')); // false
```

### Adding/Modifying Parameters

#### set() - Set/Replace Value

```javascript
const url = new URL('https://example.com');

url.searchParams.set('query', 'nodejs');
console.log(url.href); // 'https://example.com?query=nodejs'

url.searchParams.set('limit', '10');
console.log(url.href); // 'https://example.com?query=nodejs&limit=10'

// set() replaces existing values
url.searchParams.set('query', 'javascript');
console.log(url.searchParams.get('query')); // 'javascript' (replaced)
```

#### append() - Add Additional Value

```javascript
const url = new URL('https://example.com');

// append() adds values without replacing
url.searchParams.append('tag', 'javascript');
url.searchParams.append('tag', 'nodejs');
url.searchParams.append('tag', 'backend');

console.log(url.searchParams.getAll('tag'));
// ['javascript', 'nodejs', 'backend']
```

### set() vs append()

```javascript
// Using set() - replaces values
const url1 = new URL('https://example.com');
url1.searchParams.set('color', 'red');
url1.searchParams.set('color', 'blue');
console.log(url1.searchParams.getAll('color')); // ['blue']

// Using append() - adds values
const url2 = new URL('https://example.com');
url2.searchParams.append('color', 'red');
url2.searchParams.append('color', 'blue');
console.log(url2.searchParams.getAll('color')); // ['red', 'blue']
```

### Deleting Parameters

```javascript
const url = new URL('https://example.com?a=1&b=2&c=3');

url.searchParams.delete('b');
console.log(url.href); // 'https://example.com?a=1&c=3'

// Delete all values for a key
url.searchParams.append('tag', 'first');
url.searchParams.append('tag', 'second');
url.searchParams.delete('tag'); // Deletes all 'tag' values
```

## Iterating Over Parameters

### for...of Loop

```javascript
const url = new URL('https://example.com?name=John&age=30&city=NYC');

for (const [key, value] of url.searchParams) {
  console.log(`${key}: ${value}`);
}
// Output:
// name: John
// age: 30
// city: NYC
```

### forEach Method

```javascript
url.searchParams.forEach((value, key) => {
  console.log(`${key} = ${value}`);
});
```

### Getting Keys and Values

```javascript
const url = new URL('https://example.com?a=1&b=2&c=3');

// Get all keys
const keys = [...url.searchParams.keys()];
console.log(keys); // ['a', 'b', 'c']

// Get all values
const values = [...url.searchParams.values()];
console.log(values); // ['1', '2', '3']

// Get all entries
const entries = [...url.searchParams.entries()];
console.log(entries); // [['a', '1'], ['b', '2'], ['c', '3']]
```

## Converting Between Formats

### Object to URLSearchParams

```javascript
const params = {
  query: 'nodejs',
  category: 'tutorials',
  limit: 10
};

const url = new URL('https://example.com/search');

Object.entries(params).forEach(([key, value]) => {
  url.searchParams.set(key, value);
});

console.log(url.href);
// 'https://example.com/search?query=nodejs&category=tutorials&limit=10'
```

### URLSearchParams to Object

```javascript
const url = new URL('https://example.com?a=1&b=2&c=3');

const paramsObject = Object.fromEntries(url.searchParams);
console.log(paramsObject);
// { a: '1', b: '2', c: '3' }
```

### Handling Arrays

```javascript
const filters = {
  category: 'electronics',
  brands: ['Sony', 'Samsung', 'LG'],
  inStock: true
};

const url = new URL('https://example.com/products');

Object.entries(filters).forEach(([key, value]) => {
  if (Array.isArray(value)) {
    value.forEach(v => url.searchParams.append(key, v));
  } else {
    url.searchParams.set(key, value);
  }
});

console.log(url.href);
// 'https://example.com/products?category=electronics&brands=Sony&brands=Samsung&brands=LG&inStock=true'
```

## Creating URLSearchParams Directly

### From String

```javascript
const params = new URLSearchParams('name=John&age=30');

console.log(params.get('name')); // 'John'
console.log(params.get('age'));  // '30'
```

### From Object

```javascript
const params = new URLSearchParams({
  name: 'John',
  age: '30',
  city: 'NYC'
});

console.log(params.toString());
// 'name=John&age=30&city=NYC'
```

### From Array of Pairs

```javascript
const params = new URLSearchParams([
  ['name', 'John'],
  ['age', '30'],
  ['tag', 'javascript'],
  ['tag', 'nodejs']
]);

console.log(params.getAll('tag')); // ['javascript', 'nodejs']
```

## Converting to String

```javascript
const url = new URL('https://example.com/search?q=nodejs&limit=10');

// Get string with ?
console.log(url.search); // '?q=nodejs&limit=10'

// Get string without ?
console.log(url.searchParams.toString()); // 'q=nodejs&limit=10'
```

## Special Characters and Encoding

URLSearchParams automatically handles encoding:

```javascript
const url = new URL('https://example.com');

// Special characters are automatically encoded
url.searchParams.set('query', 'hello world & special chars!');
url.searchParams.set('email', 'user@example.com');

console.log(url.href);
// Automatically encoded: 'https://example.com?query=hello+world+%26+special+chars%21&email=user%40example.com'

// Automatically decoded when reading
console.log(url.searchParams.get('query'));
// 'hello world & special chars!'
```

## Practical Patterns

### Pattern 1: Building Filter URLs

```javascript
function buildFilterUrl(baseUrl, filters) {
  const url = new URL(baseUrl);

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, value);
      }
    }
  });

  return url.href;
}

const filterUrl = buildFilterUrl('https://shop.example.com/products', {
  category: 'electronics',
  minPrice: 100,
  maxPrice: 1000,
  brands: ['Sony', 'Samsung'],
  inStock: true,
  discount: null  // Won't be added
});
```

### Pattern 2: Merging Parameters

```javascript
function mergeParams(urlString, newParams) {
  const url = new URL(urlString);

  Object.entries(newParams).forEach(([key, value]) => {
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });

  return url.href;
}

const updated = mergeParams(
  'https://example.com?page=1&sort=name',
  {
    page: 2,        // Update
    limit: 10,      // Add
    sort: null      // Remove
  }
);
```

### Pattern 3: Pagination

```javascript
function buildPageUrl(baseUrl, page, limit = 20) {
  const url = new URL(baseUrl);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', limit);
  return url.href;
}

console.log(buildPageUrl('https://api.example.com/users', 1));
// 'https://api.example.com/users?page=1&limit=20'
```

## Common Pitfalls

### Pitfall 1: All Values are Strings

```javascript
const url = new URL('https://example.com?count=10&active=true');

console.log(typeof url.searchParams.get('count'));  // 'string'
console.log(typeof url.searchParams.get('active')); // 'string'

// Need to convert
const count = parseInt(url.searchParams.get('count'), 10);
const active = url.searchParams.get('active') === 'true';
```

### Pitfall 2: Forgetting Multiple Values

```javascript
const url = new URL('https://example.com?tag=a&tag=b&tag=c');

console.log(url.searchParams.get('tag'));    // 'a' (only first!)
console.log(url.searchParams.getAll('tag')); // ['a', 'b', 'c'] (all)
```

### Pitfall 3: Modifying search vs searchParams

```javascript
const url = new URL('https://example.com');

// ✗ Don't modify search directly
url.search = '?key=value';

// ✓ Use searchParams instead
url.searchParams.set('key', 'value');
```

## Summary

URLSearchParams provides:

**Key Methods:**
- `get(key)` - Get first value
- `getAll(key)` - Get all values
- `set(key, value)` - Set/replace value
- `append(key, value)` - Add value
- `has(key)` - Check existence
- `delete(key)` - Remove parameter
- `forEach(callback)` - Iterate
- `toString()` - Convert to string

**Best Practices:**
- Use `searchParams` instead of manipulating `search` string
- Remember all values are strings
- Use `getAll()` for multi-value parameters
- Handle encoding automatically with URLSearchParams
- Validate and sanitize user input

Master query parameters to build dynamic, feature-rich URLs!
