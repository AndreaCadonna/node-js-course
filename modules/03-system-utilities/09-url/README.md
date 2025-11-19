# Module 9: URL

Master URL parsing and manipulation in Node.js.

## Why This Module Matters

The `url` module is essential for working with web addresses and URLs in Node.js. Whether you're building web servers, consuming APIs, validating user input, or constructing dynamic links, understanding URL parsing and manipulation is crucial for modern web development.

**Real-world applications:**
- Building REST APIs with dynamic endpoints
- Parsing query parameters from HTTP requests
- Validating and sanitizing URLs
- Constructing redirect URLs
- URL routing in web frameworks
- OAuth and authentication flows
- Web scraping and crawling
- Deep linking in applications

---

## What You'll Learn

By completing this module, you'll master:

### Technical Skills
- Understanding URL components and structure
- Using the URL API (WHATWG URL Standard)
- Working with the legacy url module
- Parsing and constructing URLs
- Manipulating query parameters
- URL validation and sanitization
- Working with relative and absolute URLs

### Practical Applications
- Parse URLs from any source
- Build dynamic API endpoints
- Handle query string parameters
- Validate user-submitted URLs
- Construct safe redirect URLs
- Work with international domain names
- Implement URL-based routing
- Handle URL encoding/decoding

---

## Module Structure

This module is divided into three progressive levels:

### [Level 1: Basics](./level-1-basics/README.md)
**Time**: 1-2 hours

Learn the fundamentals of URLs:
- Understanding URL structure and components
- Using the WHATWG URL API
- Parsing URLs into components
- Accessing URL properties (protocol, hostname, pathname, etc.)
- Basic query parameter handling
- Converting between URL strings and objects

**You'll be able to:**
- Parse URLs correctly
- Access URL components
- Understand URL anatomy
- Use the modern URL API
- Extract query parameters
- Build simple URLs

### [Level 2: Intermediate](./level-2-intermediate/README.md)
**Time**: 2-3 hours

Advanced URL manipulation techniques:
- Constructing URLs programmatically
- Working with URLSearchParams
- Handling relative URLs
- URL validation patterns
- Encoding and decoding URL components
- Working with file:// and other protocols
- Legacy URL module API

**You'll be able to:**
- Build URLs dynamically
- Manipulate query parameters
- Resolve relative URLs
- Validate URLs correctly
- Handle special characters
- Work with different protocols
- Choose between URL APIs

### [Level 3: Advanced](./level-3-advanced/README.md)
**Time**: 3-4 hours

Production-ready URL handling:
- URL security and validation
- Internationalized domain names (IDN)
- URL normalization techniques
- Performance optimization
- Building URL builders and validators
- Handling edge cases
- Testing URL code

**You'll be able to:**
- Implement secure URL handling
- Prevent URL-based attacks
- Handle international domains
- Build production-grade URL utilities
- Optimize URL processing
- Handle all edge cases
- Write comprehensive tests

---

## Prerequisites

- **Module 10: Query String** (helpful but not required)
- Basic JavaScript knowledge
- Understanding of HTTP and web concepts
- Node.js installed (v14+)

---

## Learning Path

### Recommended Approach

1. **Read** the [CONCEPTS.md](./CONCEPTS.md) file first for foundational understanding
2. **Start** with Level 1 and progress sequentially
3. **Study** the examples in each level
4. **Complete** the exercises before checking solutions
5. **Read** the conceptual guides for deeper understanding
6. **Practice** by building the suggested projects

### Alternative Approaches

**Fast Track** (If you're experienced with URLs):
- Skim Level 1
- Focus on Level 2 and 3
- Complete advanced exercises

**Deep Dive** (If you want complete mastery):
- Read all guides thoroughly
- Complete all exercises
- Build additional projects
- Study the solutions for alternative approaches

---

## Key Concepts

### What is a URL?

A URL (Uniform Resource Locator) is a reference to a web resource that specifies its location:

```javascript
const url = new URL('https://user:pass@example.com:8080/path/page?key=value#section');

console.log(url.protocol);  // 'https:'
console.log(url.username);  // 'user'
console.log(url.password);  // 'pass'
console.log(url.hostname);  // 'example.com'
console.log(url.port);      // '8080'
console.log(url.pathname);  // '/path/page'
console.log(url.search);    // '?key=value'
console.log(url.hash);      // '#section'
```

### URL Components

A URL consists of several components:

```
https://user:pass@example.com:8080/path/page?key=value&foo=bar#section
 │       │    │    │           │    │         │                │
 │       │    │    │           │    │         │                └─ Hash/Fragment
 │       │    │    │           │    │         └─────────────────── Query/Search
 │       │    │    │           │    └───────────────────────────── Pathname
 │       │    │    │           └────────────────────────────────── Port
 │       │    │    └────────────────────────────────────────────── Hostname
 │       │    └─────────────────────────────────────────────────── Password
 │       └──────────────────────────────────────────────────────── Username
 └──────────────────────────────────────────────────────────────── Protocol
```

### The WHATWG URL API

The modern URL API follows the WHATWG URL Standard:

```javascript
// Creating URLs
const url1 = new URL('https://example.com/path');
const url2 = new URL('/path', 'https://example.com');
const url3 = new URL('https://example.com');

// Modifying URLs
url3.pathname = '/new/path';
url3.searchParams.set('key', 'value');
console.log(url3.href); // 'https://example.com/new/path?key=value'
```

### Working with Query Parameters

URLSearchParams makes working with query strings easy:

```javascript
const url = new URL('https://api.example.com/search');

// Add parameters
url.searchParams.set('q', 'nodejs');
url.searchParams.set('limit', '10');
url.searchParams.append('tag', 'javascript');
url.searchParams.append('tag', 'backend');

console.log(url.href);
// 'https://api.example.com/search?q=nodejs&limit=10&tag=javascript&tag=backend'

// Read parameters
console.log(url.searchParams.get('q'));        // 'nodejs'
console.log(url.searchParams.getAll('tag'));   // ['javascript', 'backend']
console.log(url.searchParams.has('limit'));    // true

// Iterate parameters
for (const [key, value] of url.searchParams) {
  console.log(`${key}: ${value}`);
}
```

---

## Practical Examples

### Example 1: Parsing a URL

```javascript
const url = new URL('https://www.example.com:8080/products/123?sort=price&order=asc#reviews');

console.log('Protocol:', url.protocol);    // 'https:'
console.log('Host:', url.host);            // 'www.example.com:8080'
console.log('Hostname:', url.hostname);    // 'www.example.com'
console.log('Port:', url.port);            // '8080'
console.log('Pathname:', url.pathname);    // '/products/123'
console.log('Search:', url.search);        // '?sort=price&order=asc'
console.log('Hash:', url.hash);            // '#reviews'

// Extract query parameters
const sort = url.searchParams.get('sort');      // 'price'
const order = url.searchParams.get('order');    // 'asc'
```

### Example 2: Building Dynamic URLs

```javascript
function buildApiUrl(endpoint, params = {}) {
  const url = new URL(endpoint, 'https://api.example.com');

  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => url.searchParams.append(key, v));
    } else {
      url.searchParams.set(key, value);
    }
  });

  return url.href;
}

const apiUrl = buildApiUrl('/users', {
  role: 'admin',
  status: 'active',
  fields: ['name', 'email', 'createdAt']
});

console.log(apiUrl);
// 'https://api.example.com/users?role=admin&status=active&fields=name&fields=email&fields=createdAt'
```

### Example 3: Validating URLs

```javascript
function isValidUrl(string) {
  try {
    const url = new URL(string);
    // Check for http or https protocol
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

console.log(isValidUrl('https://example.com'));        // true
console.log(isValidUrl('http://localhost:3000'));      // true
console.log(isValidUrl('not a url'));                  // false
console.log(isValidUrl('javascript:alert(1)'));        // false
```

---

## Common Pitfalls

### ❌ Not Handling Invalid URLs

```javascript
// Wrong - crashes on invalid URL
const url = new URL(userInput); // Throws if invalid!

// Correct - handle errors
try {
  const url = new URL(userInput);
  console.log('Valid URL:', url.href);
} catch (err) {
  console.error('Invalid URL:', err.message);
}
```

### ❌ Confusing Encoding Methods

```javascript
const query = 'hello world';

// Wrong - not the same!
encodeURI(query);           // 'hello%20world'
encodeURIComponent(query);  // 'hello%20world'

// For URL components, use encodeURIComponent
const url = `https://example.com/search?q=${encodeURIComponent(query)}`;

// Or better, use URLSearchParams
const url2 = new URL('https://example.com/search');
url2.searchParams.set('q', query); // Handles encoding automatically
```

### ❌ Forgetting Base URL with Relative URLs

```javascript
// Wrong - throws error
new URL('/path');  // Error: Invalid URL

// Correct - provide base
new URL('/path', 'https://example.com');  // Works!
```

---

## Module Contents

### Documentation
- **[CONCEPTS.md](./CONCEPTS.md)** - Foundational concepts for the entire module
- **Level READMEs** - Specific guidance for each level

### Code Examples
- **8 examples per level** (24 total) - Practical demonstrations
- **Fully commented** - Learn from reading the code
- **Runnable** - Execute them to see results

### Exercises
- **5 exercises per level** (15 total) - Practice problems
- **Progressive difficulty** - Build your skills gradually
- **Complete solutions** - Check your work

### Conceptual Guides
- **15 in-depth guides** - Deep understanding of specific topics
- **Level 1**: 5 guides on fundamentals
- **Level 2**: 5 guides on intermediate patterns
- **Level 3**: 5 guides on advanced topics

---

## Getting Started

### Quick Start

1. **Read the concepts**:
   ```bash
   # Read the foundational concepts
   cat CONCEPTS.md
   ```

2. **Start Level 1**:
   ```bash
   cd level-1-basics
   cat README.md
   ```

3. **Run your first example**:
   ```bash
   node examples/01-url-parsing.js
   ```

4. **Try an exercise**:
   ```bash
   node exercises/exercise-1.js
   ```

### Setting Up

No special setup is required! The URL module is built into Node.js.

```javascript
// Just import and start using
const { URL, URLSearchParams } = require('url');

// Or use the global URL (available in modern Node.js)
const url = new URL('https://example.com');
```

---

## Success Criteria

You'll know you've mastered this module when you can:

- [ ] Explain all components of a URL
- [ ] Parse URLs correctly using the modern API
- [ ] Build URLs programmatically
- [ ] Work with query parameters efficiently
- [ ] Validate URLs for security
- [ ] Handle relative and absolute URLs
- [ ] Implement URL encoding/decoding
- [ ] Choose the right URL API for your needs
- [ ] Handle edge cases and errors
- [ ] Build production-ready URL utilities

---

## Why URLs Matter

### Web Development Foundation

URLs are the foundation of the web:

```javascript
// HTTP servers parse incoming URLs
const http = require('http');
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log('Request path:', url.pathname);
  console.log('Query params:', Object.fromEntries(url.searchParams));
});
```

### API Integration

APIs rely heavily on URL construction:

```javascript
// Building API requests
const endpoint = new URL('https://api.github.com/search/repositories');
endpoint.searchParams.set('q', 'nodejs');
endpoint.searchParams.set('sort', 'stars');
endpoint.searchParams.set('order', 'desc');

fetch(endpoint.href)
  .then(res => res.json())
  .then(data => console.log(data));
```

### Security

Proper URL handling prevents security vulnerabilities:

```javascript
// Prevent open redirect vulnerabilities
function safeRedirect(userUrl, allowedDomains) {
  try {
    const url = new URL(userUrl);
    if (allowedDomains.includes(url.hostname)) {
      return url.href;
    }
  } catch (err) {
    // Invalid URL
  }
  return '/'; // Safe default
}
```

---

## Additional Resources

### Official Documentation
- [Node.js URL Documentation](https://nodejs.org/api/url.html)
- [WHATWG URL Standard](https://url.spec.whatwg.org/)
- [MDN URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL)

### Practice Projects
After completing this module, try building:
1. **URL Shortener** - Create short URLs and redirect to original
2. **Link Validator** - Validate URLs in markdown files
3. **Query Builder** - Build complex API query strings
4. **Sitemap Generator** - Generate XML sitemaps from URLs
5. **URL Analyzer** - Analyze and report URL structure

### Related Modules
- **Module 10: Query String** - Alternative query string parsing
- **Module 7: HTTP** - URLs in HTTP requests/responses
- **Module 11: Util** - Utility functions for URL work

---

## Questions or Issues?

- Review the [CONCEPTS.md](./CONCEPTS.md) for foundational understanding
- Check the examples for practical demonstrations
- Study the guides for deep dives into specific topics
- Review solutions after attempting exercises

---

## Let's Begin!

Start your journey with [Level 1: Basics](./level-1-basics/README.md) and discover the power of URL manipulation in Node.js.

Remember: URLs are everywhere in web development. Master them, and you'll build better, more secure, and more maintainable applications!
