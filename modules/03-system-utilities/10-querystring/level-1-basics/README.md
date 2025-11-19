# Level 1: Query String Basics

Learn the fundamentals of parsing and manipulating URL query strings in Node.js.

## Learning Objectives

By completing this level, you will:

- ✅ Understand what query strings are and how they work
- ✅ Parse query strings into JavaScript objects
- ✅ Convert objects into query strings
- ✅ Handle URL encoding and decoding
- ✅ Work with special characters in URLs
- ✅ Understand the difference between querystring and URLSearchParams

---

## Prerequisites

- Basic JavaScript knowledge
- Understanding of URLs (helpful but not required)
- Node.js installed (v14+)

---

## What You'll Learn

### Core Topics

1. **Query String Basics**
   - What are query strings?
   - Query string format and syntax
   - Use cases and applications

2. **Parsing Query Strings**
   - `querystring.parse()` method
   - Converting strings to objects
   - Handling multiple values

3. **Stringifying Objects**
   - `querystring.stringify()` method
   - Converting objects to query strings
   - Creating valid URLs

4. **URL Encoding**
   - `querystring.escape()` method
   - `querystring.unescape()` method
   - Why encoding matters

---

## Time Commitment

**Estimated time**: 1-2 hours
- Reading guides: 30-45 minutes
- Exercises: 30-45 minutes
- Experimentation: 15-30 minutes

---

## Conceptual Guides

Before diving into code, read these guides to build conceptual understanding:

### Essential Reading

1. **[Understanding Query Strings](guides/01-understanding-query-strings.md)** (10 min)
   - What query strings are
   - Format and structure
   - Common use cases

2. **[Parsing Query Strings](guides/02-parsing-query-strings.md)** (10 min)
   - Using querystring.parse()
   - Working with the result
   - Handling edge cases

3. **[Stringifying Objects](guides/03-stringifying-objects.md)** (10 min)
   - Using querystring.stringify()
   - Creating valid query strings
   - Best practices

4. **[URL Encoding Explained](guides/04-url-encoding.md)** (10 min)
   - Why encoding is necessary
   - How encoding works
   - Escape and unescape methods

5. **[Working with Special Characters](guides/05-special-characters.md)** (8 min)
   - Characters that need encoding
   - Common pitfalls
   - Safe handling

6. **[querystring vs URLSearchParams](guides/06-querystring-vs-urlsearchparams.md)** (7 min)
   - Key differences
   - When to use each
   - Migration guide

---

## Key Concepts

### What is a Query String?

A query string is the part of a URL containing parameters:

```javascript
// URL: https://example.com/search?q=nodejs&page=2
//                                  └─────────────┘
//                                   Query String

const querystring = require('querystring');

// Parse it
const params = querystring.parse('q=nodejs&page=2');
console.log(params);
// { q: 'nodejs', page: '2' }
```

### Parsing Query Strings

Convert query strings to objects:

```javascript
const qs = require('querystring');

// Basic parsing
const params = qs.parse('name=John&age=30&city=NYC');
console.log(params);
// { name: 'John', age: '30', city: 'NYC' }

// All values are strings
console.log(typeof params.age); // 'string'
```

### Stringifying Objects

Convert objects to query strings:

```javascript
const qs = require('querystring');

// Basic stringification
const obj = { name: 'John', age: 30, city: 'NYC' };
const queryStr = qs.stringify(obj);

console.log(queryStr);
// 'name=John&age=30&city=NYC'
```

### URL Encoding

Handle special characters properly:

```javascript
const qs = require('querystring');

// Spaces and special characters are encoded
const params = { name: 'John Doe', email: 'john@example.com' };
const encoded = qs.stringify(params);

console.log(encoded);
// 'name=John%20Doe&email=john%40example.com'

// Decode it back
const decoded = qs.parse(encoded);
console.log(decoded);
// { name: 'John Doe', email: 'john@example.com' }
```

---

## Quick Start

### Your First Query String

Try this in Node.js REPL (`node`):

```javascript
// Require the module
const qs = require('querystring');

// Parse a query string
const params = qs.parse('search=nodejs&category=tutorial');
console.log(params);
// { search: 'nodejs', category: 'tutorial' }

// Create a query string
const obj = { search: 'nodejs', category: 'tutorial' };
const str = qs.stringify(obj);
console.log(str);
// 'search=nodejs&category=tutorial'
```

---

## Common Pitfalls

### ❌ Pitfall 1: Type Confusion

```javascript
const qs = require('querystring');

// All parsed values are STRINGS!
const params = qs.parse('page=2&limit=10');

// ❌ WRONG - they're strings, not numbers
if (params.page > 1) { /* ... */ }

// ✅ CORRECT - convert to numbers
const page = parseInt(params.page, 10);
const limit = parseInt(params.limit, 10);
if (page > 1) { /* ... */ }
```

### ❌ Pitfall 2: Forgetting to Encode

```javascript
// ❌ WRONG - special characters not encoded
const url = `/search?q=Node.js & Express`;
// Invalid URL! Spaces and & not encoded

// ✅ CORRECT - use stringify
const qs = require('querystring');
const params = { q: 'Node.js & Express' };
const url = `/search?${qs.stringify(params)}`;
// '/search?q=Node.js%20%26%20Express'
```

### ❌ Pitfall 3: Including the `?`

```javascript
const qs = require('querystring');

// ❌ WRONG - includes the ?
const params = qs.parse('?name=John&age=30');
console.log(params);
// { '?name': 'John', age: '30' }
// Notice '?name' instead of 'name'!

// ✅ CORRECT - remove the ?
const params = qs.parse('name=John&age=30');
// Or strip it first:
const queryStr = '?name=John&age=30'.substring(1);
const params = qs.parse(queryStr);
```

---

## Exercises

After reading the guides, test your knowledge with these exercises:

### Exercise 1: Basic Parsing and Stringifying
Practice fundamental query string operations.

**Skills practiced:**
- Parsing query strings
- Stringifying objects
- Understanding the format

### Exercise 2: URL Encoding
Work with special characters and encoding.

**Skills practiced:**
- Encoding special characters
- Using escape/unescape
- Handling user input

### Exercise 3: Type Conversion
Parse and convert query parameter types.

**Skills practiced:**
- Type conversion
- Validation
- Error handling

### Exercise 4: Building URLs
Create complete URLs with query parameters.

**Skills practiced:**
- Combining paths and parameters
- Building dynamic URLs
- Practical application

### Exercise 5: Search Functionality
Build a search query parser and builder.

**Skills practiced:**
- Real-world application
- Multiple parameters
- User-friendly URLs

---

## Learning Path

### Recommended Sequence

1. **Read Conceptual Guides** (50 minutes)
   - Start with [Understanding Query Strings](guides/01-understanding-query-strings.md)
   - Read all 6 guides in order
   - Take notes on key concepts

2. **Experiment in REPL** (15 minutes)
   - Try the examples from guides
   - Modify them and observe results
   - Build intuition through play

3. **Complete Exercises** (45 minutes)
   - Work through each exercise
   - Don't look at solutions immediately
   - Try multiple approaches

4. **Review Solutions** (15 minutes)
   - Compare with your solutions
   - Understand alternative approaches
   - Note best practices

---

## Success Criteria

You've mastered Level 1 when you can:

- [ ] Explain what query strings are and their purpose
- [ ] Parse query strings into objects using `parse()`
- [ ] Convert objects to query strings using `stringify()`
- [ ] Properly encode and decode special characters
- [ ] Handle the `?` character correctly
- [ ] Understand that all values are strings
- [ ] Build complete URLs with parameters
- [ ] Choose between querystring and URLSearchParams

---

## What's Next?

After completing Level 1, you'll be ready for:

### Level 2: Intermediate Query String Operations
- Working with array parameters
- Custom separators and delimiters
- Nested objects in query strings
- Handling complex data structures
- Advanced encoding strategies

---

## Additional Practice

Want more practice? Try these mini-projects:

1. **URL Builder Function**
   - Create a function that builds URLs from objects
   - Handle optional parameters gracefully
   - Validate input data

2. **Search Filter Parser**
   - Parse search URLs from your favorite websites
   - Extract all filter parameters
   - Rebuild the search URL

3. **Query String Validator**
   - Validate query string format
   - Check for required parameters
   - Sanitize user input

4. **Parameter Logger**
   - Log all query parameters from URLs
   - Format them nicely for debugging
   - Handle edge cases

---

## Resources

### Official Documentation
- [Node.js querystring Documentation](https://nodejs.org/api/querystring.html)
- [URLSearchParams API](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- [URL Standard](https://url.spec.whatwg.org/)

### Tools
- **Node.js REPL**: Interactive testing (`node` command)
- **Browser Console**: Test URLSearchParams
- **Online URL Encoder**: Verify encoding results

---

## Questions or Stuck?

- Re-read the relevant guide
- Try the example code in REPL
- Check the [CONCEPTS.md](../CONCEPTS.md) for deeper understanding
- Experiment with variations
- Review the solutions after attempting exercises

---

## Let's Begin!

Start with **[Understanding Query Strings](guides/01-understanding-query-strings.md)** and work your way through the guides. Take your time to understand each concept before moving on.

Remember: Query strings are fundamental to web development. Understanding them well will help you build better web applications and APIs!
