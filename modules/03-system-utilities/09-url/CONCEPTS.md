# URL Module: Core Concepts

This document provides foundational concepts for the URL module that span all three levels (Basics, Intermediate, Advanced).

## Table of Contents
- [What is a URL?](#what-is-a-url)
- [URL Anatomy](#url-anatomy)
- [The WHATWG URL Standard](#the-whatwg-url-standard)
- [Legacy URL API](#legacy-url-api)
- [URL Encoding](#url-encoding)
- [Query Parameters](#query-parameters)
- [URL Security](#url-security)

---

## What is a URL?

### Definition

A **URL** (Uniform Resource Locator) is a reference to a web resource that specifies its location on a computer network and a mechanism for retrieving it.

```javascript
// A complete URL with all components
const fullUrl = 'https://user:pass@www.example.com:8080/path/to/page?key=value&foo=bar#section';

// Parse it
const url = new URL(fullUrl);
console.log(url.href); // The complete URL
```

### Purpose

URLs serve several critical purposes:

1. **Resource Location** - Specify where a resource is located
2. **Resource Identification** - Uniquely identify resources
3. **Access Method** - Define how to access the resource (protocol)
4. **Parameter Passing** - Send data via query strings
5. **Navigation** - Link between web pages and resources

### URL vs URI vs URN

These terms are often confused:

**URI (Uniform Resource Identifier)**
- Generic term for all types of names and addresses
- Both URLs and URNs are types of URIs

**URL (Uniform Resource Locator)**
- Specifies how to access a resource
- Includes location and access method
- Example: `https://example.com/page`

**URN (Uniform Resource Name)**
- Identifies a resource by name in a namespace
- Doesn't specify how to access it
- Example: `urn:isbn:0-123-45678-9`

```javascript
// All URLs are URIs
const url = 'https://example.com';  // URL (and URI)
const urn = 'urn:isbn:123456';      // URN (URI but not URL)
```

---

## URL Anatomy

### Complete URL Structure

```
https://user:pass@subdomain.example.com:8080/path/to/page.html?key=value&foo=bar#section

│       │    │    │                 │    │                  │                │
│       │    │    │                 │    │                  │                └─ Fragment/Hash
│       │    │    │                 │    │                  └──────────────────── Search/Query
│       │    │    │                 │    └─────────────────────────────────────── Path
│       │    │    │                 └──────────────────────────────────────────── Port
│       │    │    └────────────────────────────────────────────────────────────── Host
│       │    └─────────────────────────────────────────────────────────────────── Password
│       └──────────────────────────────────────────────────────────────────────── Username
└──────────────────────────────────────────────────────────────────────────────── Scheme/Protocol
```

### URL Components Explained

#### 1. Protocol/Scheme

Defines how to access the resource:

```javascript
const url1 = new URL('https://example.com');
console.log(url1.protocol); // 'https:'

const url2 = new URL('http://example.com');
console.log(url2.protocol); // 'http:'

const url3 = new URL('ftp://example.com');
console.log(url3.protocol); // 'ftp:'

const url4 = new URL('file:///path/to/file');
console.log(url4.protocol); // 'file:'
```

**Common protocols:**
- `http:` - Hypertext Transfer Protocol
- `https:` - HTTP Secure (encrypted)
- `ftp:` - File Transfer Protocol
- `file:` - Local file system
- `ws:` - WebSocket
- `wss:` - WebSocket Secure
- `mailto:` - Email address
- `data:` - Inline data

#### 2. Authentication (Username & Password)

Credentials for basic authentication (rarely used in modern apps):

```javascript
const url = new URL('https://user:password@example.com');
console.log(url.username); // 'user'
console.log(url.password); // 'password'

// ⚠️ Security warning: Credentials in URLs are visible in logs, history, etc.
// Better to use Authorization headers instead
```

#### 3. Host (Hostname + Port)

**Hostname** - Domain name or IP address:

```javascript
const url1 = new URL('https://example.com');
console.log(url1.hostname); // 'example.com'

const url2 = new URL('https://subdomain.example.com');
console.log(url2.hostname); // 'subdomain.example.com'

const url3 = new URL('https://192.168.1.1');
console.log(url3.hostname); // '192.168.1.1'
```

**Port** - Network port (optional, defaults by protocol):

```javascript
const url1 = new URL('https://example.com');
console.log(url1.port); // '' (empty, uses default 443)

const url2 = new URL('https://example.com:8080');
console.log(url2.port); // '8080'

// Default ports:
// http:  80
// https: 443
// ftp:   21
```

**Host** - Hostname + Port:

```javascript
const url = new URL('https://example.com:8080');
console.log(url.host);     // 'example.com:8080'
console.log(url.hostname); // 'example.com'
console.log(url.port);     // '8080'
```

#### 4. Pathname

The path to the resource:

```javascript
const url = new URL('https://example.com/products/123/reviews');
console.log(url.pathname); // '/products/123/reviews'

// Pathname always starts with /
const url2 = new URL('https://example.com');
console.log(url2.pathname); // '/'
```

#### 5. Search/Query String

Parameters passed to the resource:

```javascript
const url = new URL('https://example.com/search?q=nodejs&limit=10');
console.log(url.search); // '?q=nodejs&limit=10'

// Access individual parameters via searchParams
console.log(url.searchParams.get('q'));     // 'nodejs'
console.log(url.searchParams.get('limit')); // '10'
```

#### 6. Hash/Fragment

Reference to a specific part of the resource:

```javascript
const url = new URL('https://example.com/page#section-2');
console.log(url.hash); // '#section-2'

// Used for:
// - Jumping to page sections
// - Client-side routing in SPAs
// - Fragment identifiers in documents
```

### Visual Breakdown Example

```javascript
const url = new URL('https://api.example.com:443/v1/users/123?fields=name,email&format=json#details');

console.log({
  href: url.href,           // Full URL
  protocol: url.protocol,   // 'https:'
  username: url.username,   // ''
  password: url.password,   // ''
  hostname: url.hostname,   // 'api.example.com'
  port: url.port,           // '443'
  host: url.host,           // 'api.example.com:443'
  pathname: url.pathname,   // '/v1/users/123'
  search: url.search,       // '?fields=name,email&format=json'
  hash: url.hash,           // '#details'
  origin: url.origin        // 'https://api.example.com:443'
});
```

---

## The WHATWG URL Standard

### History and Purpose

The **WHATWG URL Standard** is the modern, standardized way to work with URLs in JavaScript. It's implemented in browsers and Node.js.

**Timeline:**
- **Before**: Node.js had its own legacy `url.parse()` API
- **Now**: WHATWG URL API is the standard (available since Node.js 7.0.0)
- **Future**: Legacy API is deprecated

### The URL Class

The global `URL` class follows the WHATWG standard:

```javascript
// Available globally (no require needed in modern Node.js)
const url = new URL('https://example.com');

// Or import from 'url' module
const { URL } = require('url');
const url2 = new URL('https://example.com');
```

### Creating URL Objects

#### From Absolute URL

```javascript
const url = new URL('https://example.com/path?key=value');
console.log(url.href); // 'https://example.com/path?key=value'
```

#### From Relative URL (with base)

```javascript
// Relative URL requires a base
const url = new URL('/api/users', 'https://example.com');
console.log(url.href); // 'https://example.com/api/users'

// Works with relative paths
const url2 = new URL('../admin', 'https://example.com/api/users');
console.log(url2.href); // 'https://example.com/admin'
```

#### From Request URL

```javascript
// In HTTP server
const http = require('http');
http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log('Pathname:', url.pathname);
  console.log('Query:', Object.fromEntries(url.searchParams));
});
```

### Modifying URLs

URLs are mutable - you can change components:

```javascript
const url = new URL('https://example.com');

// Change pathname
url.pathname = '/api/v2/users';

// Add query parameters
url.searchParams.set('limit', '10');
url.searchParams.set('offset', '0');

// Change protocol
url.protocol = 'http:';

// Change hostname
url.hostname = 'api.example.com';

console.log(url.href);
// 'http://api.example.com/api/v2/users?limit=10&offset=0'
```

### URL Properties

All URL properties are both readable and writable:

```javascript
const url = new URL('https://example.com');

// Read-only properties
console.log(url.origin);    // 'https://example.com'
console.log(url.href);      // Full URL

// Writable properties
url.protocol = 'http:';     // Change protocol
url.hostname = 'test.com';  // Change hostname
url.port = '8080';          // Set port
url.pathname = '/path';     // Set pathname
url.search = '?key=value';  // Set query string
url.hash = '#section';      // Set hash
```

---

## Legacy URL API

### Node.js Legacy Methods

Before the WHATWG standard, Node.js had its own API:

```javascript
const url = require('url');

// Legacy parsing (deprecated)
const parsed = url.parse('https://example.com/path?key=value', true);

console.log(parsed);
// {
//   protocol: 'https:',
//   host: 'example.com',
//   pathname: '/path',
//   query: { key: 'value' },  // Parsed when second arg is true
//   ...
// }
```

### Why Legacy API Still Exists

Some codebases still use it, but you should prefer WHATWG URL:

```javascript
// ❌ Old way (avoid)
const url = require('url');
const parsed = url.parse(urlString);

// ✅ New way (prefer)
const parsed = new URL(urlString);
```

### Key Differences

| Feature | Legacy `url.parse()` | WHATWG `URL` |
|---------|---------------------|--------------|
| Standard | Node.js specific | Web standard |
| Mutability | Returns plain object | Returns URL object |
| Query parsing | Manual (parse=true) | Built-in URLSearchParams |
| Validation | Less strict | Strict validation |
| Browser support | No | Yes |
| Future | Deprecated | Standard |

### When You Might See Legacy API

```javascript
// Old code you might encounter
const url = require('url');
const querystring = require('querystring');

const parsed = url.parse('https://example.com/path?a=1&b=2');
const query = querystring.parse(parsed.query);

// Modern equivalent
const modern = new URL('https://example.com/path?a=1&b=2');
const params = Object.fromEntries(modern.searchParams);
```

---

## URL Encoding

### Why Encoding is Necessary

URLs can only contain certain characters. Special characters must be encoded:

```javascript
// These characters need encoding in URLs:
// Space, <, >, #, %, {, }, |, \, ^, ~, [, ], `

const searchTerm = 'hello world';
const url = `https://example.com/search?q=${searchTerm}`;
// ❌ Invalid: space in URL

const encoded = encodeURIComponent(searchTerm);
const validUrl = `https://example.com/search?q=${encoded}`;
// ✅ Valid: 'https://example.com/search?q=hello%20world'
```

### Encoding Methods

**encodeURIComponent()** - Encode URL component (most common):

```javascript
const param = 'hello world & foo=bar';
const encoded = encodeURIComponent(param);
console.log(encoded); // 'hello%20world%20%26%20foo%3Dbar'

// Use for query parameter values
const url = `https://example.com?q=${encodeURIComponent(param)}`;
```

**encodeURI()** - Encode complete URI (preserves URI structure):

```javascript
const uri = 'https://example.com/path with spaces/';
const encoded = encodeURI(uri);
console.log(encoded); // 'https://example.com/path%20with%20spaces/'

// Preserves :, /, ?, #, etc.
```

**Percent Encoding**:

```javascript
// Characters encoded as %XX where XX is hexadecimal
' ' → '%20'
'!' → '%21'
'#' → '%23'
'$' → '%24'
'&' → '%26'
'=' → '%3D'
'?' → '%3F'

// Example
const value = 'a+b=c';
console.log(encodeURIComponent(value)); // 'a%2Bb%3Dc'
```

### Decoding

**decodeURIComponent()** - Decode URL component:

```javascript
const encoded = 'hello%20world%20%26%20foo%3Dbar';
const decoded = decodeURIComponent(encoded);
console.log(decoded); // 'hello world & foo=bar'
```

**decodeURI()** - Decode complete URI:

```javascript
const encoded = 'https://example.com/path%20with%20spaces/';
const decoded = decodeURI(encoded);
console.log(decoded); // 'https://example.com/path with spaces/'
```

### Automatic Encoding with URL API

The URL API handles encoding automatically:

```javascript
const url = new URL('https://example.com/search');
url.searchParams.set('q', 'hello world & foo=bar');

console.log(url.href);
// 'https://example.com/search?q=hello+world+%26+foo%3Dbar'
// Automatically encoded!

console.log(url.searchParams.get('q'));
// 'hello world & foo=bar'
// Automatically decoded!
```

---

## Query Parameters

### URLSearchParams API

Modern way to work with query strings:

```javascript
const params = new URLSearchParams();

// Set single value
params.set('key', 'value');

// Append (allows duplicates)
params.append('tag', 'javascript');
params.append('tag', 'nodejs');

// Get value
console.log(params.get('key'));        // 'value'
console.log(params.getAll('tag'));     // ['javascript', 'nodejs']

// Check existence
console.log(params.has('key'));        // true

// Delete
params.delete('key');

// Iterate
for (const [key, value] of params) {
  console.log(`${key}: ${value}`);
}

// Convert to string
console.log(params.toString());
// 'tag=javascript&tag=nodejs'
```

### Working with URL and URLSearchParams

```javascript
const url = new URL('https://example.com/search');

// Modify query parameters
url.searchParams.set('q', 'nodejs');
url.searchParams.set('limit', '10');
url.searchParams.append('tag', 'backend');

console.log(url.href);
// 'https://example.com/search?q=nodejs&limit=10&tag=backend'
```

### Creating URLSearchParams from Object

```javascript
const params = {
  query: 'nodejs',
  limit: 10,
  tags: ['backend', 'javascript']
};

const searchParams = new URLSearchParams();
Object.entries(params).forEach(([key, value]) => {
  if (Array.isArray(value)) {
    value.forEach(v => searchParams.append(key, v));
  } else {
    searchParams.set(key, value);
  }
});

console.log(searchParams.toString());
// 'query=nodejs&limit=10&tags=backend&tags=javascript'
```

### Converting URLSearchParams to Object

```javascript
const url = new URL('https://example.com?a=1&b=2&c=3');

// Simple object (last value wins for duplicates)
const params = Object.fromEntries(url.searchParams);
console.log(params); // { a: '1', b: '2', c: '3' }

// Array of entries
const entries = [...url.searchParams.entries()];
console.log(entries); // [['a', '1'], ['b', '2'], ['c', '3']]

// Handle multiple values
const grouped = {};
for (const [key, value] of url.searchParams) {
  if (grouped[key]) {
    grouped[key] = Array.isArray(grouped[key])
      ? [...grouped[key], value]
      : [grouped[key], value];
  } else {
    grouped[key] = value;
  }
}
```

---

## URL Security

### Common Security Issues

#### 1. Open Redirect Vulnerability

Accepting user-provided URLs without validation:

```javascript
// ❌ Vulnerable
app.get('/redirect', (req, res) => {
  const redirectUrl = req.query.url;
  res.redirect(redirectUrl); // Dangerous!
});

// Attacker can use:
// /redirect?url=https://evil.com

// ✅ Safe - validate domain
app.get('/redirect', (req, res) => {
  try {
    const url = new URL(req.query.url);
    const allowedDomains = ['example.com', 'trusted.com'];

    if (allowedDomains.includes(url.hostname)) {
      res.redirect(url.href);
    } else {
      res.redirect('/'); // Safe default
    }
  } catch (err) {
    res.redirect('/'); // Invalid URL
  }
});
```

#### 2. JavaScript Protocol Injection

```javascript
// ❌ Vulnerable
function createLink(url) {
  return `<a href="${url}">Click</a>`;
}

// Attacker uses:
// javascript:alert(document.cookie)

// ✅ Safe - validate protocol
function createSafeLink(url) {
  try {
    const parsed = new URL(url);
    const safeProtocols = ['http:', 'https:'];

    if (safeProtocols.includes(parsed.protocol)) {
      return `<a href="${parsed.href}">Click</a>`;
    }
  } catch (err) {
    // Invalid URL
  }
  return '<a href="#">Click</a>';
}
```

#### 3. URL Parameter Pollution

```javascript
// URL: /search?id=123&id=456
// Which id is used?

// ✅ Handle explicitly
const url = new URL(req.url, `http://${req.headers.host}`);
const ids = url.searchParams.getAll('id'); // ['123', '456']

// Choose appropriate handling:
const firstId = url.searchParams.get('id');  // '123'
const allIds = url.searchParams.getAll('id'); // ['123', '456']
```

### URL Validation Best Practices

```javascript
function validateUrl(input, options = {}) {
  const {
    allowedProtocols = ['http:', 'https:'],
    allowedDomains = null,
    requireDomain = true
  } = options;

  try {
    const url = new URL(input);

    // Check protocol
    if (!allowedProtocols.includes(url.protocol)) {
      return { valid: false, error: 'Invalid protocol' };
    }

    // Check domain required
    if (requireDomain && !url.hostname) {
      return { valid: false, error: 'Domain required' };
    }

    // Check allowed domains
    if (allowedDomains && !allowedDomains.includes(url.hostname)) {
      return { valid: false, error: 'Domain not allowed' };
    }

    return { valid: true, url };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

// Usage
const result = validateUrl('https://example.com/path', {
  allowedProtocols: ['https:'],
  allowedDomains: ['example.com', 'api.example.com']
});

if (result.valid) {
  console.log('Safe URL:', result.url.href);
} else {
  console.error('Invalid URL:', result.error);
}
```

---

## Best Practices

### 1. Always Use the WHATWG URL API

```javascript
// ❌ Avoid legacy API
const url = require('url');
const parsed = url.parse(urlString);

// ✅ Use modern API
const parsed = new URL(urlString);
```

### 2. Handle URL Errors

```javascript
// ❌ No error handling
const url = new URL(userInput); // Throws on invalid URL

// ✅ Always use try-catch
try {
  const url = new URL(userInput);
  // Use url...
} catch (err) {
  console.error('Invalid URL:', err.message);
}
```

### 3. Use URLSearchParams for Query Strings

```javascript
// ❌ Manual string concatenation
const url = `https://api.com/search?q=${query}&limit=${limit}`;

// ✅ Use URLSearchParams
const url = new URL('https://api.com/search');
url.searchParams.set('q', query);
url.searchParams.set('limit', limit);
```

### 4. Validate User-Provided URLs

```javascript
// ✅ Always validate
function isSafeUrl(urlString) {
  try {
    const url = new URL(urlString);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}
```

### 5. Be Careful with Base URLs

```javascript
// ❌ Forgetting base with relative URL
new URL('/path'); // Throws error

// ✅ Provide base for relative URLs
new URL('/path', 'https://example.com'); // Works
```

---

## Summary

Understanding URLs deeply enables you to:

1. **Parse URLs correctly** - Extract components reliably
2. **Build URLs safely** - Construct URLs without errors
3. **Handle query parameters** - Manage complex parameter sets
4. **Validate user input** - Prevent security vulnerabilities
5. **Work with APIs** - Build and consume RESTful APIs
6. **Debug web issues** - Understand URL-related problems

Mastering URLs is essential for any Node.js developer working with web technologies!
