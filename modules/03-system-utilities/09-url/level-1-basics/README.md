# Level 1: URL Basics

Learn the fundamentals of URL parsing and manipulation in Node.js.

## Learning Objectives

By completing this level, you will:

- ✅ Understand URL structure and components
- ✅ Parse URLs using the WHATWG URL API
- ✅ Access and modify URL properties
- ✅ Work with query parameters using URLSearchParams
- ✅ Convert between URL strings and objects
- ✅ Handle basic URL validation

---

## Prerequisites

- Basic JavaScript knowledge
- Node.js installed (v14+)
- Understanding of web concepts (HTTP, web addresses)
- Familiarity with strings and objects

---

## What You'll Learn

### Core Topics

1. **URL Parsing**
   - Creating URL objects
   - Parsing URL strings
   - Understanding URL components
   - Absolute vs relative URLs

2. **URL Components**
   - Protocol/scheme
   - Hostname and port
   - Pathname
   - Query string
   - Hash/fragment

3. **URLSearchParams**
   - Adding query parameters
   - Reading query parameters
   - Modifying parameters
   - Iterating over parameters

4. **Basic URL Operations**
   - Converting to string
   - Comparing URLs
   - Modifying URL parts
   - Basic validation

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

1. **[Understanding URL Structure](guides/01-url-structure.md)** (10 min)
   - URL anatomy and components
   - How URLs are organized
   - Common URL patterns

2. **[Using the URL API](guides/02-url-api.md)** (12 min)
   - The WHATWG URL standard
   - Creating and parsing URLs
   - URL vs legacy url.parse()

3. **[URL Components Deep Dive](guides/03-url-components.md)** (10 min)
   - Protocol, hostname, port
   - Pathname, search, hash
   - Reading and writing properties

4. **[Working with Query Parameters](guides/04-query-parameters.md)** (12 min)
   - URLSearchParams API
   - Adding and reading parameters
   - Multiple values and iteration

5. **[Basic URL Validation](guides/05-url-validation.md)** (10 min)
   - Checking URL validity
   - Common validation patterns
   - Error handling

---

## Key Concepts

### URL Structure

Every URL has a specific structure:

```javascript
const url = new URL('https://example.com:8080/path?key=value#section');

console.log(url.protocol);  // 'https:'
console.log(url.hostname);  // 'example.com'
console.log(url.port);      // '8080'
console.log(url.pathname);  // '/path'
console.log(url.search);    // '?key=value'
console.log(url.hash);      // '#section'
```

### Creating URLs

The URL class is globally available:

```javascript
// From absolute URL
const url1 = new URL('https://example.com/path');

// From relative URL (requires base)
const url2 = new URL('/path', 'https://example.com');

// Both create the same URL
console.log(url1.href === url2.href); // true
```

### Query Parameters

URLSearchParams makes working with query strings easy:

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

---

## Quick Start

### Your First URL

Try this in Node.js REPL (`node`):

```javascript
// Create a URL
const url = new URL('https://www.example.com/products/123?sort=price');

// Explore components
console.log(url.protocol);  // 'https:'
console.log(url.hostname);  // 'www.example.com'
console.log(url.pathname);  // '/products/123'

// Access query parameters
console.log(url.searchParams.get('sort')); // 'price'

// Modify the URL
url.searchParams.set('order', 'asc');
console.log(url.href);
// 'https://www.example.com/products/123?sort=price&order=asc'
```

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting Base URL for Relative URLs

```javascript
// ❌ WRONG - throws error
const url = new URL('/path');

// ✅ CORRECT - provide base
const url = new URL('/path', 'https://example.com');
```

### ❌ Pitfall 2: Not Handling Invalid URLs

```javascript
// ❌ WRONG - crashes on invalid input
const url = new URL(userInput);

// ✅ CORRECT - use try-catch
try {
  const url = new URL(userInput);
  console.log('Valid URL:', url.href);
} catch (err) {
  console.error('Invalid URL');
}
```

### ❌ Pitfall 3: Confusing set() and append()

```javascript
const url = new URL('https://example.com');

// set() replaces value
url.searchParams.set('tag', 'first');
url.searchParams.set('tag', 'second');
console.log(url.searchParams.getAll('tag')); // ['second']

// append() adds value
url.searchParams.append('tag', 'first');
url.searchParams.append('tag', 'second');
console.log(url.searchParams.getAll('tag')); // ['first', 'second']
```

---

## Exercises

After reading the guides, test your knowledge with these exercises:

### Exercise 1: URL Parsing
Parse URLs and extract their components.

**Skills practiced:**
- Creating URL objects
- Accessing URL properties
- Understanding URL structure

### Exercise 2: Query Parameter Manipulation
Work with query strings and URLSearchParams.

**Skills practiced:**
- Adding query parameters
- Reading query values
- Modifying existing parameters

### Exercise 3: URL Builder
Build URLs from components programmatically.

**Skills practiced:**
- Constructing URLs
- Setting URL properties
- Combining URL parts

### Exercise 4: URL Validator
Validate URLs and check specific criteria.

**Skills practiced:**
- Error handling
- URL validation
- Checking URL properties

### Exercise 5: URL Transformer
Transform and modify URLs based on rules.

**Skills practiced:**
- Modifying URLs
- Working with all URL components
- Practical URL manipulation

---

## Learning Path

### Recommended Sequence

1. **Read Conceptual Guides** (50 minutes)
   - Start with [Understanding URL Structure](guides/01-url-structure.md)
   - Read all 5 guides in order
   - Take notes on key concepts

2. **Experiment in REPL** (15 minutes)
   - Try the examples from guides
   - Modify them and observe results
   - Build intuition through play

3. **Study Examples** (20 minutes)
   - Review the 8 example files
   - Run each example
   - Understand the patterns

4. **Complete Exercises** (45 minutes)
   - Work through each exercise
   - Don't look at solutions immediately
   - Try multiple approaches

5. **Review Solutions** (15 minutes)
   - Compare with your solutions
   - Understand alternative approaches
   - Note best practices

---

## Success Criteria

You've mastered Level 1 when you can:

- [ ] Explain all components of a URL
- [ ] Create URL objects from strings
- [ ] Access and modify URL properties
- [ ] Work with query parameters effectively
- [ ] Handle relative and absolute URLs
- [ ] Validate basic URLs
- [ ] Debug URL-related issues
- [ ] Understand when to use URL API vs string manipulation

---

## What's Next?

After completing Level 1, you'll be ready for:

### Level 2: Intermediate URL Operations
- Building URLs programmatically
- Advanced URLSearchParams operations
- URL encoding and decoding
- Working with different protocols
- Legacy URL API comparison
- Real-world URL patterns

---

## Additional Practice

Want more practice? Try these mini-projects:

1. **URL Analyzer**
   - Parse URLs and display all components
   - Show formatted breakdown
   - Validate URL structure

2. **Query String Builder**
   - Convert objects to query strings
   - Handle arrays and nested values
   - Build filter interfaces

3. **Link Extractor**
   - Extract URLs from text
   - Parse and validate each URL
   - Report URL statistics

4. **URL Shortener (Basic)**
   - Generate short codes
   - Map to original URLs
   - Parse and redirect

---

## Resources

### Official Documentation
- [Node.js URL Documentation](https://nodejs.org/api/url.html)
- [WHATWG URL Standard](https://url.spec.whatwg.org/)
- [MDN URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL)
- [MDN URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)

### Tools
- **Node.js REPL**: Interactive testing (`node` command)
- **Browser Console**: Test URL API in browser (same API!)

---

## Questions or Stuck?

- Re-read the relevant guide
- Try the example code in REPL
- Check the [CONCEPTS.md](../CONCEPTS.md) for deeper understanding
- Experiment with variations
- Review the solutions after attempting exercises

---

## Let's Begin!

Start with **[Understanding URL Structure](guides/01-url-structure.md)** and work your way through the guides. Take your time to understand each concept before moving on.

Remember: URLs are fundamental to web development. Understanding how to work with them properly will make you a better developer!
