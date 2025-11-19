# Query String Module: Core Concepts

This document provides foundational concepts for the Query String module that span all three levels (Basics, Intermediate, Advanced).

## Table of Contents
- [What is a Query String?](#what-is-a-query-string)
- [Why Query Strings Matter](#why-query-strings-matter)
- [Query String Format](#query-string-format)
- [The querystring Module](#the-querystring-module)
- [URL Encoding](#url-encoding)
- [Modern Alternatives](#modern-alternatives)
- [Security Considerations](#security-considerations)

---

## What is a Query String?

### Definition

A **query string** is a part of a URL that contains data to be passed to web applications. It begins with a question mark (`?`) and contains key-value pairs separated by ampersands (`&`).

```
https://example.com/search?q=nodejs&category=tutorials&page=1
                          └─────────────────────────────────┘
                                    Query String
```

### Anatomy of a Query String

```javascript
// Complete URL breakdown:
// Protocol: https://
// Host: example.com
// Path: /search
// Query String: ?q=nodejs&category=tutorials&page=1

const url = 'https://example.com/search?q=nodejs&category=tutorials&page=1';

// Query string components:
// Key-value pair 1: q=nodejs
// Key-value pair 2: category=tutorials
// Key-value pair 3: page=1
```

### Core Purpose

Query strings exist to:
1. **Pass parameters to web applications** - Send data via URL
2. **Enable bookmarkable state** - Save application state in URLs
3. **Share links with context** - URLs contain the data needed
4. **Support GET requests** - Primary method for GET parameters
5. **Enable analytics** - Track sources and campaigns

---

## Why Query Strings Matter

### 1. Web Development

Query strings are fundamental to web applications:

```javascript
// Express.js example
app.get('/search', (req, res) => {
  const query = req.query.q;        // From ?q=nodejs
  const page = req.query.page || 1; // From ?page=2
  // Perform search with parameters
});
```

### 2. API Development

APIs use query strings for filtering and options:

```javascript
// REST API with query parameters
GET /api/users?role=admin&active=true&limit=50

// Parse and use
const querystring = require('querystring');
const params = querystring.parse('role=admin&active=true&limit=50');
// { role: 'admin', active: 'true', limit: '50' }
```

### 3. SEO and Sharing

Query strings enable shareable URLs with context:

```javascript
// Search results URL
https://shop.com/products?category=electronics&price_max=1000&sort=rating

// The URL preserves:
// - Category filter
// - Price filter
// - Sort order
```

### 4. Analytics and Tracking

Marketing teams use query parameters to track campaigns:

```javascript
// UTM parameters for Google Analytics
https://example.com/?utm_source=facebook&utm_medium=social&utm_campaign=summer_sale

const qs = require('querystring');
const tracking = qs.parse('utm_source=facebook&utm_medium=social&utm_campaign=summer_sale');
// { utm_source: 'facebook', utm_medium: 'social', utm_campaign: 'summer_sale' }
```

---

## Query String Format

### Basic Format

The standard format for query strings:

```
?key1=value1&key2=value2&key3=value3
```

Components:
- **`?`** - Query string delimiter (separates path from query)
- **`key=value`** - Parameter pairs
- **`&`** - Separator between parameters

### Examples

```javascript
// Simple parameters
?name=John&age=30

// Empty values
?search=&category=all

// No value
?debug

// Special characters (encoded)
?name=John%20Doe&email=john%40example.com
```

### Multiple Values

Same key can appear multiple times:

```javascript
// Multiple values for same key
?color=red&color=blue&color=green

const qs = require('querystring');
const params = qs.parse('color=red&color=blue&color=green');
console.log(params.color); // ['red', 'blue', 'green']
```

---

## The querystring Module

### Core API

Node.js provides the `querystring` module with four main methods:

```javascript
const querystring = require('querystring');

// 1. parse() - Query string to object
const obj = querystring.parse('name=John&age=30');

// 2. stringify() - Object to query string
const str = querystring.stringify({ name: 'John', age: 30 });

// 3. escape() - Encode string for URL
const encoded = querystring.escape('Hello World!');

// 4. unescape() - Decode URL encoded string
const decoded = querystring.unescape('Hello%20World!');
```

### querystring.parse()

Convert query string to object:

```javascript
const qs = require('querystring');

// Basic parsing
qs.parse('name=John&age=30');
// { name: 'John', age: '30' }

// With custom separator
qs.parse('name:John;age:30', ';', ':');
// { name: 'John', age: '30' }

// With arrays
qs.parse('color=red&color=blue');
// { color: ['red', 'blue'] }
```

### querystring.stringify()

Convert object to query string:

```javascript
const qs = require('querystring');

// Basic stringification
qs.stringify({ name: 'John', age: 30 });
// 'name=John&age=30'

// With arrays
qs.stringify({ colors: ['red', 'blue'] });
// 'colors=red&colors=blue'

// With custom separator
qs.stringify({ name: 'John', age: 30 }, ';', ':');
// 'name:John;age:30'
```

### querystring.escape() and unescape()

Handle URL encoding:

```javascript
const qs = require('querystring');

// Escape (encode)
qs.escape('Hello World!');
// 'Hello%20World!'

qs.escape('user@example.com');
// 'user%40example.com'

// Unescape (decode)
qs.unescape('Hello%20World!');
// 'Hello World!'
```

---

## URL Encoding

### Why Encoding is Necessary

URLs can only contain certain characters. Special characters must be encoded:

```javascript
// Characters that need encoding:
// Space: ' ' → '%20'
// @: '@' → '%40'
// &: '&' → '%26'
// =: '=' → '%3D'
// #: '#' → '%23'
// ?: '?' → '%3F'

const qs = require('querystring');

// Automatic encoding with stringify
const params = {
  email: 'user@example.com',
  message: 'Hello & goodbye!',
  tags: 'nodejs, express'
};

console.log(qs.stringify(params));
// 'email=user%40example.com&message=Hello%20%26%20goodbye!&tags=nodejs%2C%20express'
```

### Percent Encoding

URL encoding uses percent signs followed by hexadecimal values:

```javascript
// Character → Hex → Encoded
// Space ' '  → 20  → %20
// @ → 40 → %40
// # → 23 → %23

const qs = require('querystring');

// Original
const original = 'Price: $50 (20% off)';

// Encoded
const encoded = qs.escape(original);
console.log(encoded);
// 'Price%3A%20%2450%20(20%25%20off)'

// Decoded
const decoded = qs.unescape(encoded);
console.log(decoded);
// 'Price: $50 (20% off)'
```

### Reserved vs Unreserved Characters

```javascript
// Unreserved (safe, no encoding needed):
// A-Z a-z 0-9 - _ . ~

// Reserved (have special meaning, must encode):
// : / ? # [ ] @ ! $ & ' ( ) * + , ; =

// Always encode in query string values:
const qs = require('querystring');
qs.escape('http://example.com'); // Encodes : and /
// 'http%3A%2F%2Fexample.com'
```

---

## Modern Alternatives

### URLSearchParams

Modern JavaScript provides `URLSearchParams`:

```javascript
// Modern approach (Node.js 10+)
const params = new URLSearchParams('name=John&age=30');

console.log(params.get('name')); // 'John'
console.log(params.get('age'));  // '30'

// Add parameters
params.append('city', 'New York');

// Convert to string
console.log(params.toString());
// 'name=John&age=30&city=New+York'
```

### querystring vs URLSearchParams

```javascript
const qs = require('querystring');

// querystring module
const obj1 = qs.parse('a=1&b=2');
console.log(obj1); // { a: '1', b: '2' }

// URLSearchParams
const params = new URLSearchParams('a=1&b=2');
console.log(params.get('a')); // '1'

// Key differences:
// 1. querystring returns plain objects
// 2. URLSearchParams is an iterator
// 3. URLSearchParams has more methods
// 4. Different encoding for spaces (+ vs %20)
```

### When to Use Each

```javascript
// Use querystring when:
// - Working with legacy Node.js code
// - Need simple object conversion
// - Require custom separators

// Use URLSearchParams when:
// - Writing new code
// - Need standard compliance
// - Want richer API (has, delete, etc.)
// - Working with browser-compatible code

// Example comparison:
const qs = require('querystring');

// querystring - simple
const obj = qs.parse('a=1&b=2');
console.log(obj.a); // '1'

// URLSearchParams - feature-rich
const params = new URLSearchParams('a=1&b=2');
params.has('a');      // true
params.delete('b');
params.append('c', 3);
```

---

## Security Considerations

### 1. Injection Attacks

Never trust query parameters:

```javascript
const qs = require('querystring');

// ❌ DANGEROUS - Direct use in queries
const params = qs.parse(req.url.split('?')[1]);
const query = `SELECT * FROM users WHERE id = ${params.id}`;
// SQL Injection risk!

// ✅ SAFE - Validate and sanitize
const params = qs.parse(req.url.split('?')[1]);
const id = parseInt(params.id, 10);
if (isNaN(id) || id < 1) {
  throw new Error('Invalid ID');
}
// Use parameterized queries
```

### 2. XSS (Cross-Site Scripting)

Escape parameters before displaying:

```javascript
const qs = require('querystring');

// ❌ DANGEROUS - Rendering user input
const params = qs.parse('name=<script>alert("XSS")</script>');
const html = `<h1>Hello ${params.name}</h1>`;
// XSS vulnerability!

// ✅ SAFE - Escape HTML
const escapeHtml = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const html = `<h1>Hello ${escapeHtml(params.name)}</h1>`;
```

### 3. Parameter Pollution

Handle duplicate parameters carefully:

```javascript
const qs = require('querystring');

// Multiple values can cause issues
const params = qs.parse('role=user&role=admin');
console.log(params.role); // ['user', 'admin']

// ❌ DANGEROUS - Assuming single value
if (params.role === 'admin') { /* ... */ }
// Arrays are never === to strings!

// ✅ SAFE - Handle arrays
const roles = Array.isArray(params.role) ? params.role : [params.role];
if (roles.includes('admin')) { /* ... */ }
```

### 4. Data Validation

Always validate query parameters:

```javascript
const qs = require('querystring');

// Parse parameters
const params = qs.parse(queryStr);

// ✅ Validate types
const page = parseInt(params.page, 10);
if (isNaN(page) || page < 1) {
  page = 1; // Default
}

// ✅ Validate allowed values
const validSortOptions = ['date', 'name', 'price'];
const sort = validSortOptions.includes(params.sort) ? params.sort : 'date';

// ✅ Validate ranges
const limit = Math.min(Math.max(parseInt(params.limit, 10) || 10, 1), 100);
```

### 5. Sensitive Data

Never pass sensitive data in query strings:

```javascript
// ❌ NEVER DO THIS
// Query strings appear in:
// - Browser history
// - Server logs
// - Referrer headers
// - Analytics

// Bad examples:
https://example.com/?password=secret123
https://example.com/?creditCard=1234567890
https://example.com/?ssn=123-45-6789

// ✅ Use POST requests and request body for sensitive data
// ✅ Use authentication tokens in headers
// ✅ Encrypt sensitive data
```

---

## Best Practices

### 1. Consistent Naming

Use consistent parameter naming conventions:

```javascript
// ✅ Good - consistent snake_case
?first_name=John&last_name=Doe&email_address=john@example.com

// ✅ Good - consistent camelCase
?firstName=John&lastName=Doe&emailAddress=john@example.com

// ❌ Avoid - mixed styles
?firstName=John&last_name=Doe&Email_Address=john@example.com
```

### 2. Meaningful Names

Use clear, descriptive parameter names:

```javascript
// ✅ Good - clear and descriptive
?category=electronics&minPrice=100&maxPrice=500&sortBy=rating

// ❌ Bad - unclear abbreviations
?cat=el&min=100&max=500&s=r
```

### 3. Default Values

Provide sensible defaults:

```javascript
const qs = require('querystring');
const params = qs.parse(queryStr);

// ✅ Good - defaults for missing params
const page = parseInt(params.page, 10) || 1;
const limit = parseInt(params.limit, 10) || 20;
const sort = params.sort || 'created_at';
```

### 4. Array Parameters

Be consistent with array syntax:

```javascript
// Common conventions:
// 1. Repeat the key
?color=red&color=blue&color=green

// 2. Use brackets (PHP style)
?color[]=red&color[]=blue&color[]=green

// 3. Use comma-separated
?colors=red,blue,green

// Choose one and stick with it!
```

---

## Common Patterns

### Pattern 1: Pagination

```javascript
const qs = require('querystring');

function buildPaginationUrl(baseUrl, page, limit) {
  const params = qs.stringify({ page, limit });
  return `${baseUrl}?${params}`;
}

const url = buildPaginationUrl('/api/users', 2, 50);
// '/api/users?page=2&limit=50'
```

### Pattern 2: Filtering

```javascript
const qs = require('querystring');

function buildFilterUrl(baseUrl, filters) {
  const cleanFilters = {};

  // Only include non-empty filters
  for (const [key, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined && value !== '') {
      cleanFilters[key] = value;
    }
  }

  const params = qs.stringify(cleanFilters);
  return params ? `${baseUrl}?${params}` : baseUrl;
}

const url = buildFilterUrl('/products', {
  category: 'electronics',
  minPrice: 100,
  maxPrice: null, // Omitted
  brand: ''       // Omitted
});
// '/products?category=electronics&minPrice=100'
```

### Pattern 3: State Preservation

```javascript
const qs = require('querystring');

// Save application state in URL
function saveStateToUrl(state) {
  const params = qs.stringify({
    view: state.view,
    filter: state.filter,
    sort: state.sort,
    page: state.page
  });

  window.history.pushState(null, '', `?${params}`);
}

// Restore state from URL
function loadStateFromUrl() {
  const params = qs.parse(window.location.search.substring(1));

  return {
    view: params.view || 'grid',
    filter: params.filter || 'all',
    sort: params.sort || 'date',
    page: parseInt(params.page, 10) || 1
  };
}
```

---

## Summary

The `querystring` module provides essential functionality for working with URL parameters:

1. **Parse** query strings into objects
2. **Stringify** objects into query strings
3. **Encode/Decode** special characters
4. **Handle arrays** and complex parameters

While modern code often uses `URLSearchParams`, understanding `querystring` is valuable for:
- Maintaining legacy code
- Understanding URL parameter fundamentals
- Working with custom separators
- Simple object conversions

Remember to always:
- ✅ Validate and sanitize input
- ✅ Handle encoding properly
- ✅ Provide default values
- ✅ Never trust user input
- ✅ Keep query strings simple and readable

---

## Next Steps

Now that you understand the core concepts, you're ready to:

1. Start with **[Level 1: Basics](./level-1-basics/README.md)** for hands-on practice
2. Explore the conceptual guides for deeper understanding
3. Complete exercises to reinforce learning
4. Build projects to apply your knowledge

Happy learning!
