# Module 10: Query String

Master URL query string parsing and manipulation in Node.js.

## Why This Module Matters

The `querystring` module provides utilities for parsing and formatting URL query strings. While the modern `URLSearchParams` API is often preferred for new code, understanding the `querystring` module is essential for maintaining legacy code and understanding URL parameter handling fundamentals.

**Real-world applications:**
- Parsing URL parameters in web applications
- Building search functionality with filters
- Creating API query parameters
- Form data processing
- Analytics and tracking parameters
- SEO-friendly URLs

---

## What You'll Learn

By completing this module, you'll master:

### Technical Skills
- Parse query strings into objects
- Stringify objects into query strings
- Handle special characters and encoding
- Work with arrays in query parameters
- Custom encoding/decoding strategies
- URL-safe parameter handling

### Practical Applications
- Build search filters for web apps
- Parse API request parameters
- Generate shareable URLs with state
- Process form submissions
- Handle complex nested parameters
- Create URL builders for APIs

---

## Module Structure

This module is divided into three progressive levels:

### [Level 1: Basics](./level-1-basics/README.md)
**Time**: 1-2 hours

Learn the fundamentals of query string handling:
- Understanding query string format
- Parsing query strings to objects
- Stringifying objects to query strings
- Basic encoding and decoding
- Common use cases

**You'll be able to:**
- Parse URL query strings
- Convert objects to query strings
- Handle special characters
- Work with simple parameters
- Understand encoding basics

### [Level 2: Intermediate](./level-2-intermediate/README.md)
**Time**: 2-3 hours

Advanced query string manipulation:
- Arrays in query parameters
- Custom separators and delimiters
- URLSearchParams vs querystring
- Complex parameter structures
- Encoding strategies

**You'll be able to:**
- Handle array parameters
- Use custom separators
- Choose between querystring and URLSearchParams
- Process complex parameters
- Implement custom encoders

### [Level 3: Advanced](./level-3-advanced/README.md)
**Time**: 3-4 hours

Production-ready query string handling:
- Building URL builder utilities
- Query string validation
- Security considerations
- Performance optimization
- Integration patterns

**You'll be able to:**
- Build robust URL utilities
- Validate and sanitize parameters
- Prevent injection attacks
- Optimize parameter handling
- Build production-grade solutions

---

## Prerequisites

- Basic JavaScript knowledge
- Understanding of URLs (helpful)
- Node.js installed (v14+)
- **Module 9: URL** (recommended but not required)

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

**Fast Track** (If you're experienced):
- Skim Level 1
- Focus on Level 2 and 3
- Complete advanced exercises

**Deep Dive** (If you want mastery):
- Read all guides thoroughly
- Complete all exercises
- Build additional projects
- Study the solutions for alternative approaches

---

## Key Concepts

### What is a Query String?

A query string is the part of a URL that contains parameters:

```javascript
// URL: https://example.com/search?q=nodejs&page=2&sort=date
// Query string: q=nodejs&page=2&sort=date

const querystring = require('querystring');

// Parse query string to object
const params = querystring.parse('q=nodejs&page=2&sort=date');
console.log(params);
// { q: 'nodejs', page: '2', sort: 'date' }
```

### Parsing Query Strings

Convert query strings to JavaScript objects:

```javascript
const qs = require('querystring');

// Basic parsing
const parsed = qs.parse('name=John&age=30');
console.log(parsed); // { name: 'John', age: '30' }

// With special characters
const encoded = qs.parse('name=John%20Doe&city=New%20York');
console.log(encoded); // { name: 'John Doe', city: 'New York' }
```

### Stringifying Objects

Convert JavaScript objects to query strings:

```javascript
const qs = require('querystring');

// Basic stringification
const obj = { name: 'John', age: 30 };
const str = qs.stringify(obj);
console.log(str); // 'name=John&age=30'

// With special characters
const obj2 = { name: 'John Doe', city: 'New York' };
const str2 = qs.stringify(obj2);
console.log(str2); // 'name=John%20Doe&city=New%20York'
```

### URL Encoding

Handle special characters properly:

```javascript
const qs = require('querystring');

// Encoding special characters
const params = {
  search: 'Node.js & Express',
  tags: 'web, api, server'
};

const encoded = qs.stringify(params);
console.log(encoded);
// 'search=Node.js%20%26%20Express&tags=web%2C%20api%2C%20server'

// Decoding
const decoded = qs.parse(encoded);
console.log(decoded);
// { search: 'Node.js & Express', tags: 'web, api, server' }
```

---

## Practical Examples

### Example 1: Parse Search Parameters

```javascript
const querystring = require('querystring');
const url = require('url');

// Full URL with query string
const fullUrl = 'https://example.com/search?q=nodejs&category=tutorials&page=1';

// Extract query string
const parsedUrl = url.parse(fullUrl);
const params = querystring.parse(parsedUrl.query);

console.log('Search query:', params.q);        // 'nodejs'
console.log('Category:', params.category);      // 'tutorials'
console.log('Page:', params.page);              // '1'
```

### Example 2: Build Filter URLs

```javascript
const querystring = require('querystring');

// User selections
const filters = {
  color: 'blue',
  size: 'large',
  minPrice: 50,
  maxPrice: 100
};

// Create query string
const queryStr = querystring.stringify(filters);
const filterUrl = `/products?${queryStr}`;

console.log(filterUrl);
// '/products?color=blue&size=large&minPrice=50&maxPrice=100'
```

### Example 3: Handle Form Data

```javascript
const querystring = require('querystring');

// Simulated POST body (application/x-www-form-urlencoded)
const formData = 'username=john&email=john%40example.com&subscribe=true';

// Parse form data
const userData = querystring.parse(formData);

console.log('Username:', userData.username);  // 'john'
console.log('Email:', userData.email);        // 'john@example.com'
console.log('Subscribe:', userData.subscribe); // 'true'
```

---

## Common Pitfalls

### ❌ Not Handling Special Characters

```javascript
// Wrong - special characters not encoded
const url = `/search?q=Node.js & Express`; // ⚠️ Invalid URL

// Correct - use stringify for encoding
const qs = require('querystring');
const params = { q: 'Node.js & Express' };
const url = `/search?${qs.stringify(params)}`;
// '/search?q=Node.js%20%26%20Express'
```

### ❌ Type Confusion

```javascript
const qs = require('querystring');

// All parsed values are strings!
const params = qs.parse('page=2&limit=10');
console.log(typeof params.page);  // 'string', not 'number'

// Correct - convert types as needed
const page = parseInt(params.page, 10);
const limit = parseInt(params.limit, 10);
```

### ❌ Array Handling

```javascript
const qs = require('querystring');

// Multiple values with same key
const query = 'tag=nodejs&tag=javascript&tag=tutorial';
const params = qs.parse(query);

console.log(params.tag); // ['nodejs', 'javascript', 'tutorial']

// Wrong - assuming single value
const tag = params.tag.toUpperCase(); // ⚠️ Arrays don't have toUpperCase

// Correct - handle both cases
const tags = Array.isArray(params.tag) ? params.tag : [params.tag];
```

---

## Module Contents

### Documentation
- **[CONCEPTS.md](./CONCEPTS.md)** - Foundational concepts for the entire module
- **Level READMEs** - Specific guidance for each level

### Conceptual Guides
- **18 in-depth guides** - Deep understanding of specific topics
- **Level 1**: 6 guides on fundamentals
- **Level 2**: 6 guides on intermediate patterns
- **Level 3**: 6 guides on advanced topics

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

3. **Try parsing a query string**:
   ```bash
   node -e "const qs = require('querystring'); console.log(qs.parse('name=John&age=30'))"
   ```

### Setting Up

No special setup is required! The querystring module is built into Node.js.

```javascript
// No npm install needed - built into Node.js
const querystring = require('querystring');
```

---

## Success Criteria

You'll know you've mastered this module when you can:

- [ ] Explain what query strings are and their purpose
- [ ] Parse query strings into JavaScript objects
- [ ] Stringify objects into valid query strings
- [ ] Handle special characters and encoding properly
- [ ] Work with array parameters
- [ ] Choose between querystring and URLSearchParams
- [ ] Validate and sanitize query parameters
- [ ] Build URL utilities for applications
- [ ] Handle security concerns in parameter processing

---

## Additional Resources

### Official Documentation
- [Node.js Query String Documentation](https://nodejs.org/api/querystring.html)
- [URLSearchParams API](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)

### Practice Projects
After completing this module, try building:
1. **Search Filter Builder** - Create a dynamic search interface with URL sync
2. **API Client** - Build a client that constructs API URLs with parameters
3. **Analytics Tracker** - Parse and process tracking parameters
4. **URL Shortener** - Handle parameter preservation in short URLs

### Related Modules
- **Module 9: URL** - Parse and manipulate complete URLs
- **Module 7: HTTP** - Use query strings in web servers
- **Module 11: Util** - Additional utility functions

---

## Questions or Issues?

- Review the [CONCEPTS.md](./CONCEPTS.md) for foundational understanding
- Check the guides for deep dives into specific topics
- Study the examples for practical demonstrations
- Review solutions after attempting exercises

---

## Let's Begin!

Start your journey with [Level 1: Basics](./level-1-basics/README.md) and build a solid foundation in query string handling.

Remember: Query strings are fundamental to web development. Whether you're building APIs, web applications, or processing URLs, mastering query string handling will make you a more capable developer!
