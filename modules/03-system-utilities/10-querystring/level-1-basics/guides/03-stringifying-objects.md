# Stringifying Objects

Learn how to convert JavaScript objects into query strings using `querystring.stringify()`.

## The stringify() Method

```javascript
const querystring = require('querystring');

const params = { name: 'John', age: 30 };
const queryStr = querystring.stringify(params);

console.log(queryStr); // 'name=John&age=30'
```

## Basic Usage

### Simple Object

```javascript
const qs = require('querystring');

const obj = {
  search: 'nodejs',
  category: 'tutorial',
  page: 1
};

const result = qs.stringify(obj);
// 'search=nodejs&category=tutorial&page=1'
```

### Building Complete URLs

```javascript
const basePath = '/products';
const params = { category: 'electronics', sort: 'price' };
const queryStr = qs.stringify(params);

const fullUrl = `${basePath}?${queryStr}`;
// '/products?category=electronics&sort=price'
```

## Automatic Encoding

Special characters are automatically encoded:

```javascript
const params = {
  name: 'John Doe',           // Space
  email: 'user@example.com',  // @
  message: 'Hello & goodbye'  // &
};

const result = qs.stringify(params);
// 'name=John%20Doe&email=user%40example.com&message=Hello%20%26%20goodbye'
```

## Handling Different Types

### Numbers

```javascript
const params = { page: 1, limit: 20, price: 99.99 };
const result = qs.stringify(params);
// 'page=1&limit=20&price=99.99'
// All converted to strings automatically
```

### Booleans

```javascript
const params = { active: true, verified: false };
const result = qs.stringify(params);
// 'active=true&verified=false'
```

### Arrays

Arrays become repeated keys:

```javascript
const params = {
  size: 'large',
  color: ['red', 'blue', 'green']
};

const result = qs.stringify(params);
// 'size=large&color=red&color=blue&color=green'
```

### Null and Undefined

```javascript
const params = {
  name: 'John',
  email: null,
  phone: undefined,
  age: 30
};

const result = qs.stringify(params);
// 'name=John&email=&phone=&age=30'
// null and undefined become empty strings
```

## Best Practices

### Clean URLs - Remove Empty Values

```javascript
function buildCleanQuery(params) {
  const clean = {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      clean[key] = value;
    }
  }

  return querystring.stringify(clean);
}

const params = {
  name: 'John',
  email: '',
  phone: null,
  age: 30
};

const result = buildCleanQuery(params);
// 'name=John&age=30' (email and phone excluded)
```

### Conditional Parameters

```javascript
function buildProductUrl(filters) {
  const params = {};

  if (filters.category) params.category = filters.category;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.sort) params.sort = filters.sort;

  const query = querystring.stringify(params);
  return query ? `/products?${query}` : '/products';
}

buildProductUrl({ category: 'books' });
// '/products?category=books'

buildProductUrl({});
// '/products' (no query string)
```

## Custom Separators

Use custom separators instead of `&` and `=`:

```javascript
const params = { name: 'John', age: 30, city: 'NYC' };

// Default
qs.stringify(params);
// 'name=John&age=30&city=NYC'

// Custom: ; and :
qs.stringify(params, ';', ':');
// 'name:John;age:30;city:NYC'
```

## Common Patterns

### URL Builder Class

```javascript
class UrlBuilder {
  constructor(basePath) {
    this.basePath = basePath;
    this.params = {};
  }

  addParam(key, value) {
    this.params[key] = value;
    return this; // Enable chaining
  }

  build() {
    const query = querystring.stringify(this.params);
    return query ? `${this.basePath}?${query}` : this.basePath;
  }
}

// Usage
const url = new UrlBuilder('/search')
  .addParam('q', 'nodejs')
  .addParam('page', 1)
  .addParam('limit', 20)
  .build();
// '/search?q=nodejs&page=1&limit=20'
```

### Merging Parameters

```javascript
function buildUrlWithDefaults(path, params, defaults = {}) {
  const merged = { ...defaults, ...params };
  const query = querystring.stringify(merged);
  return `${path}?${query}`;
}

const defaults = { page: 1, limit: 20, sort: 'date' };
const url = buildUrlWithDefaults('/posts', { page: 3 }, defaults);
// '/posts?page=3&limit=20&sort=date'
```

## Complete Example

```javascript
const querystring = require('querystring');

class SearchUrlBuilder {
  static build(searchTerm, options = {}) {
    const params = { q: searchTerm };

    // Add optional parameters
    if (options.page) params.page = options.page;
    if (options.limit) params.limit = options.limit;
    if (options.sort) params.sort = options.sort;
    if (options.filters && options.filters.length) {
      params.filter = options.filters;
    }

    return `/search?${querystring.stringify(params)}`;
  }
}

// Usage
SearchUrlBuilder.build('nodejs');
// '/search?q=nodejs'

SearchUrlBuilder.build('javascript', {
  page: 2,
  limit: 50,
  sort: 'date',
  filters: ['tutorial', 'free']
});
// '/search?q=javascript&page=2&limit=50&sort=date&filter=tutorial&filter=free'
```

## Summary

- Use `querystring.stringify()` to convert objects to query strings
- Special characters are automatically encoded
- Arrays become repeated keys
- null/undefined become empty strings
- All values converted to strings
- Filter out empty values for clean URLs
- Build helper functions for common patterns
- Use template literals to build complete URLs
