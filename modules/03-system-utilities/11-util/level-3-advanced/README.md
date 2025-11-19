# Util - Level 3: Advanced

## 🎯 Start Here: Conceptual Understanding First!

**Before diving into code examples**, read these guides to build a solid foundation. Understanding advanced concepts will help you build production-ready utilities and avoid critical mistakes.

### 📖 Essential Guides (60 minutes total)

1. **[Custom Promisify Implementations](guides/01-custom-promisify-implementations.md)** ⭐ MOST IMPORTANT
   - **Time**: 20 minutes
   - **Why**: Essential for understanding promisify internals and building custom async wrappers
   - **What you'll learn**: How promisify works internally, custom promisify implementations, util.promisify.custom symbol

2. **[Deep Equality Testing](guides/02-deep-equality-testing.md)**
   - **Time**: 15 minutes
   - **What you'll learn**: Using util.isDeepStrictEqual() for testing, comparison algorithms, performance considerations

3. **[Production Debugging Strategies](guides/03-production-debugging-strategies.md)**
   - **Time**: 15 minutes
   - **What you'll learn**: Advanced debugging patterns, combining util.debuglog with inspect, production logging systems

4. **[Performance and Optimization](guides/04-performance-and-optimization.md)**
   - **Time**: 10 minutes
   - **What you'll learn**: Optimizing util function usage, performance benchmarks, production best practices

### Why Read Guides First?

Without understanding the concepts:
- ❌ You won't understand how promisify handles edge cases
- ❌ Custom implementations will seem like magic
- ❌ Deep equality comparisons will fail unexpectedly
- ❌ Performance bottlenecks will go unnoticed

With conceptual understanding:
- ✅ You'll build robust custom utilities
- ✅ You'll understand promisify internals and limitations
- ✅ You'll write reliable test assertions
- ✅ You'll optimize production performance
- ✅ You're ready for senior-level interviews

---

## Learning Objectives

By the end of Level 3, you will be able to:

- ✅ Build custom promisify implementations with edge case handling
- ✅ Use util.isDeepStrictEqual() for robust test assertions
- ✅ Implement advanced debugging systems for production
- ✅ Optimize util function performance in high-throughput scenarios
- ✅ Create enterprise-grade logging systems with util functions
- ✅ Compose multiple util functions for complex patterns
- ✅ Apply production best practices and security patterns
- ✅ Design utility libraries for large-scale applications

---

## Topics Covered

### 1. Custom Promisify Implementations
- Understanding promisify internals and implementation
- Building custom promisify with options and validation
- Implementing util.promisify.custom symbol
- Handling edge cases and error scenarios
- Creating domain-specific promisify wrappers

### 2. Deep Equality and Testing
- Using util.isDeepStrictEqual() for assertions
- Understanding deep comparison algorithms
- Comparing complex objects, arrays, and types
- Performance considerations for large objects
- Building test assertion libraries

### 3. Advanced Debugging Patterns
- Complex debugging scenarios with util.inspect()
- Combining debuglog with custom inspectors
- Production debugging without performance impact
- Distributed system debugging patterns
- Error tracking and diagnostic systems

### 4. Performance Optimization
- Profiling util function overhead
- Optimizing inspect operations
- Caching and memoization strategies
- Reducing allocations in hot paths
- Production performance best practices

### 5. Custom Inspect Advanced
- Complex [util.inspect.custom] implementations
- Context-aware inspection (production vs development)
- Circular reference handling
- Performance-optimized inspectors
- Security considerations

### 6. Production Logging Systems
- Enterprise-grade logging with util functions
- Structured logging patterns
- Log aggregation and monitoring
- Performance-conscious logging
- Security and compliance considerations

### 7. Utility Composition
- Composing multiple util functions
- Building utility pipelines
- Creating reusable utility patterns
- Type-safe utility wrappers
- Functional programming patterns

### 8. Real-World Production Patterns
- Patterns from production applications
- API client utilities
- Database wrapper utilities
- Testing framework utilities
- Monitoring and observability utilities

---

## Prerequisites

- Completed Level 2: Util Intermediate
- Strong understanding of async/await and promises
- Experience with production Node.js applications
- Familiarity with testing frameworks
- Understanding of performance optimization concepts

---

## ⏱️ Time Required

- **With Guides** (Recommended): 4-5 hours
  - Guides: 60 minutes
  - Examples: 90 minutes
  - Exercises: 90-120 minutes
  - Review: 30 minutes

- **Without Guides** (Fast Track): 3-3.5 hours
  - Examples: 60 minutes
  - Exercises: 90-100 minutes
  - Review: 20 minutes

---

## 📚 Recommended Learning Flow

```
Step 1: Read Essential Guides (60 min)
   ├─ Custom Promisify Implementations (20 min) ⭐
   ├─ Deep Equality Testing (15 min)
   ├─ Production Debugging Strategies (15 min)
   └─ Performance and Optimization (10 min)
        ↓
Step 2: Study Examples (90 min)
   ├─ Study examples 1-4 (Core advanced concepts)
   ├─ Study examples 5-6 (Production patterns)
   ├─ Study examples 7-8 (Real-world applications)
   └─ Run and modify each example
        ↓
Step 3: Complete Exercises (90-120 min)
   ├─ Exercise 1: Custom Promisify with Options (⭐⭐⭐)
   ├─ Exercise 2: Test Assertion Library (⭐⭐⭐)
   ├─ Exercise 3: Advanced Debug System (⭐⭐⭐)
   ├─ Exercise 4: Performance Monitoring (⭐⭐⭐)
   └─ Exercise 5: Enterprise Utility Suite (⭐⭐⭐)
        ↓
Step 4: Verify Understanding
   ├─ Can you explain promisify internals?
   ├─ Can you build production utilities?
   ├─ Can you optimize performance?
   └─ Ready for production work? ✓
```

---

## Examples Overview

### [01-custom-promisify.js](examples/01-custom-promisify.js)
Build custom promisify implementations from scratch. Understand how util.promisify() works internally and handle edge cases.

### [02-deep-equality.js](examples/02-deep-equality.js)
Master util.isDeepStrictEqual() for testing and validation. Learn deep comparison algorithms and edge cases.

### [03-advanced-debugging.js](examples/03-advanced-debugging.js)
Implement complex debugging scenarios combining inspect, debuglog, and custom formatting for production systems.

### [04-performance-optimization.js](examples/04-performance-optimization.js)
Optimize util function usage for high-performance scenarios. Learn profiling, caching, and performance patterns.

### [05-custom-inspect-advanced.js](examples/05-custom-inspect-advanced.js)
Advanced [util.inspect.custom] patterns including context-awareness, circular references, and security.

### [06-production-logging.js](examples/06-production-logging.js)
Build enterprise-grade logging systems using util functions. Structured logging, performance, and security.

### [07-utility-composition.js](examples/07-utility-composition.js)
Compose multiple util functions for complex patterns. Build reusable utility pipelines and wrappers.

### [08-real-world-patterns.js](examples/08-real-world-patterns.js)
Production patterns from real applications: API clients, database wrappers, testing utilities, and monitoring.

---

## Exercises Overview

### [exercise-1.js](exercises/exercise-1.js) - ⭐⭐⭐ Hard
**Build Custom Promisify with Options**
Implement a custom promisify function with validation, error handling, and util.promisify.custom support.

### [exercise-2.js](exercises/exercise-2.js) - ⭐⭐⭐ Hard
**Implement Test Assertion Library**
Create a testing assertion library using util.isDeepStrictEqual() with detailed error messages.

### [exercise-3.js](exercises/exercise-3.js) - ⭐⭐⭐ Hard
**Create Advanced Debug System**
Build a production debugging system with namespaces, severity levels, and custom formatting.

### [exercise-4.js](exercises/exercise-4.js) - ⭐⭐⭐ Hard
**Build Performance Monitoring**
Implement a performance monitoring system for util operations with metrics and alerting.

### [exercise-5.js](exercises/exercise-5.js) - ⭐⭐⭐ Hard
**Complete Enterprise Utility Suite**
Create a comprehensive utility library combining all advanced patterns for production use.

---

## Solutions

Complete solutions with multiple implementation approaches:

- [Solution 1](solutions/exercise-1-solution.js) - Custom promisify with options
- [Solution 2](solutions/exercise-2-solution.js) - Test assertion library
- [Solution 3](solutions/exercise-3-solution.js) - Advanced debug system
- [Solution 4](solutions/exercise-4-solution.js) - Performance monitoring
- [Solution 5](solutions/exercise-5-solution.js) - Enterprise utility suite

---

## Key Concepts Summary

### Custom Promisify Implementation

```javascript
const util = require('util');

// Basic custom promisify
function customPromisify(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

// Advanced with util.promisify.custom support
function advancedPromisify(fn) {
  // Check for custom promisify implementation
  if (fn[util.promisify.custom]) {
    return fn[util.promisify.custom];
  }

  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, ...values) => {
        if (err) return reject(err);

        // Handle multiple callback values
        if (values.length === 0) resolve();
        else if (values.length === 1) resolve(values[0]);
        else resolve(values);
      });
    });
  };
}

// Usage
const fs = require('fs');
const readFilePromise = advancedPromisify(fs.readFile);
```

### Deep Equality for Testing

```javascript
const util = require('util');

// Simple deep equality check
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { a: 1, b: { c: 2 } };

console.log(util.isDeepStrictEqual(obj1, obj2)); // true

// Testing assertion with helpful messages
function assertEqual(actual, expected, message) {
  if (!util.isDeepStrictEqual(actual, expected)) {
    const error = new Error(message || 'Assertion failed');
    error.actual = actual;
    error.expected = expected;
    error.diff = util.inspect({ actual, expected }, { depth: null });
    throw error;
  }
}

// Edge cases
util.isDeepStrictEqual([1, 2, 3], [1, 2, 3]);  // true
util.isDeepStrictEqual(new Set([1]), new Set([1]));  // true
util.isDeepStrictEqual({ a: undefined }, { });  // false (strict!)
```

### Production Debugging System

```javascript
const util = require('util');

// Advanced debug logger with namespaces
class DebugLogger {
  constructor(namespace) {
    this.namespace = namespace;
    this.debuglog = util.debuglog(namespace);
  }

  debug(message, data) {
    this.debuglog(`[DEBUG] ${message}`, util.inspect(data, {
      depth: 5,
      colors: process.stdout.isTTY
    }));
  }

  error(message, error) {
    // Always log errors, even without NODE_DEBUG
    console.error(`[${this.namespace}] ERROR:`, message);
    console.error(util.inspect(error, { depth: null }));
  }

  // Custom inspector for sensitive data
  inspectSafe(obj) {
    return util.inspect(obj, {
      depth: 3,
      customInspect: true,
      getters: false
    });
  }
}

// Usage
const logger = new DebugLogger('myapp:database');
logger.debug('Query executed', { sql: 'SELECT *', time: 45 });
```

### Performance Optimization

```javascript
const util = require('util');

// Cached inspect for frequently logged objects
class CachedInspector {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  inspect(obj, options = {}) {
    // Create cache key
    const key = JSON.stringify(obj);

    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Perform expensive inspection
    const result = util.inspect(obj, options);

    // Manage cache size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, result);
    return result;
  }
}

// Optimized logging for hot paths
const inspector = new CachedInspector();

function logInHotPath(data) {
  // Only inspect if actually logging
  if (process.env.NODE_DEBUG) {
    console.log(inspector.inspect(data));
  }
}
```

---

## Common Patterns

### Pattern 1: Custom Promisify with Validation

```javascript
const util = require('util');

function promisifyWithValidation(fn, validator) {
  const promisified = util.promisify(fn);

  return async function(...args) {
    // Validate arguments before calling
    if (validator) {
      const error = validator(...args);
      if (error) throw error;
    }

    return await promisified(...args);
  };
}

// Usage
const fs = require('fs');
const readFile = promisifyWithValidation(
  fs.readFile,
  (path) => {
    if (typeof path !== 'string') {
      return new TypeError('Path must be a string');
    }
  }
);
```

### Pattern 2: Assertion Library

```javascript
const util = require('util');

class Assert {
  static deepEqual(actual, expected, message) {
    if (!util.isDeepStrictEqual(actual, expected)) {
      throw new AssertionError({
        message: message || 'Deep equality assertion failed',
        actual,
        expected,
        operator: 'deepEqual'
      });
    }
  }

  static notDeepEqual(actual, expected, message) {
    if (util.isDeepStrictEqual(actual, expected)) {
      throw new AssertionError({
        message: message || 'Values should not be deeply equal',
        actual,
        expected,
        operator: 'notDeepEqual'
      });
    }
  }
}

class AssertionError extends Error {
  constructor({ message, actual, expected, operator }) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
    this.operator = operator;
    this.stack = this.generateStack();
  }

  generateStack() {
    return `${this.name}: ${this.message}\n` +
           `  Expected: ${util.inspect(this.expected)}\n` +
           `  Actual: ${util.inspect(this.actual)}`;
  }
}
```

### Pattern 3: Production Logger

```javascript
const util = require('util');

class ProductionLogger {
  constructor(options = {}) {
    this.namespace = options.namespace || 'app';
    this.level = options.level || 'info';
    this.debuglog = util.debuglog(this.namespace);
  }

  log(level, message, data) {
    const timestamp = new Date().toISOString();
    const formatted = {
      timestamp,
      level,
      namespace: this.namespace,
      message,
      ...(data && { data: this.sanitize(data) })
    };

    // Structured JSON logging
    console.log(JSON.stringify(formatted));
  }

  sanitize(obj) {
    // Use custom inspect to hide sensitive fields
    return util.inspect(obj, {
      depth: 5,
      customInspect: true,
      getters: false
    });
  }

  debug(message, data) {
    this.debuglog(message, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  error(message, error) {
    this.log('error', message, {
      error: error.message,
      stack: error.stack
    });
  }
}
```

---

## Common Pitfalls

### Pitfall 1: Not Handling util.promisify.custom

```javascript
// ❌ Wrong - Ignores custom implementation
function badPromisify(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
}

// ✅ Correct - Checks for custom
function goodPromisify(fn) {
  if (fn[util.promisify.custom]) {
    return fn[util.promisify.custom];
  }
  // ... rest of implementation
}
```

### Pitfall 2: Expensive Inspection in Production

```javascript
// ❌ Wrong - Always inspects, even when not needed
function logRequest(req) {
  const inspected = util.inspect(req, { depth: 10 });
  if (process.env.DEBUG) {
    console.log(inspected);
  }
}

// ✅ Correct - Only inspect when needed
function logRequest(req) {
  if (process.env.DEBUG) {
    console.log(util.inspect(req, { depth: 10 }));
  }
}
```

### Pitfall 3: Deep Equality Confusion

```javascript
// ❌ Wrong - Doesn't understand strict equality
const obj1 = { a: 1, b: undefined };
const obj2 = { a: 1 };
console.log(util.isDeepStrictEqual(obj1, obj2)); // false!

// ✅ Correct - Understand the difference
// isDeepStrictEqual uses SameValue comparison
// undefined property !== missing property
```

---

## Best Practices

### ✅ DO:

- Implement util.promisify.custom for non-standard callbacks
- Use util.isDeepStrictEqual() for test assertions
- Cache expensive inspect operations
- Sanitize sensitive data before logging
- Use debuglog for conditional production logging
- Profile performance before optimizing
- Handle all promisify edge cases
- Document custom utility behavior

### ❌ DON'T:

- Promisify functions with non-standard callback signatures without custom
- Use deep equality for reference comparison
- Inspect large objects in hot code paths
- Log sensitive data without sanitization
- Over-optimize without profiling
- Assume promisify handles all edge cases
- Create custom utilities without documentation
- Ignore security implications of inspection

---

## Testing Your Knowledge

### Self-Check Questions

Before considering yourself advanced, you should be able to answer:

**Conceptual Questions:**

1. How does util.promisify() handle multiple callback values? ([Guide 1](guides/01-custom-promisify-implementations.md))
2. What's the difference between === and util.isDeepStrictEqual()? ([Guide 2](guides/02-deep-equality-testing.md))
3. When should you use util.debuglog() vs console.log()? ([Guide 3](guides/03-production-debugging-strategies.md))
4. What are the performance implications of util.inspect()? ([Guide 4](guides/04-performance-and-optimization.md))

**Practical Questions:**

1. How do you implement util.promisify.custom?
2. How do you compare complex objects including Sets and Maps?
3. How do you prevent sensitive data leaks in logs?
4. How do you optimize util usage in high-throughput scenarios?

---

## Production Projects

Apply your advanced skills to these production scenarios:

### Project 1: API Client Library
Build a production API client that:
- Custom promisify for all async operations
- Deep equality for response validation
- Advanced debugging with sanitization
- Performance monitoring and caching
- Comprehensive error handling

### Project 2: Testing Framework
Create a testing framework that:
- Custom assertion library with util.isDeepStrictEqual()
- Advanced test output with custom inspect
- Performance benchmarking utilities
- Mock and spy utilities using promisify
- Detailed error reporting

### Project 3: Logging Infrastructure
Build enterprise logging that:
- Structured logging with util.format()
- Production debugging with util.debuglog()
- Sensitive data sanitization
- Performance-optimized inspection
- Log aggregation support

---

## Self-Assessment Checklist

Before considering yourself an expert, you should be comfortable with:

- [ ] Understanding promisify internals and implementation
- [ ] Building custom promisify with edge case handling
- [ ] Using deep equality for complex comparisons
- [ ] Implementing production debugging systems
- [ ] Optimizing util performance in production
- [ ] Creating custom inspect for security
- [ ] Composing utilities for complex patterns
- [ ] Applying production best practices

---

## Exercises Checklist

- [ ] Exercise 1: Custom Promisify with Options (⭐⭐⭐)
- [ ] Exercise 2: Test Assertion Library (⭐⭐⭐)
- [ ] Exercise 3: Advanced Debug System (⭐⭐⭐)
- [ ] Exercise 4: Performance Monitoring (⭐⭐⭐)
- [ ] Exercise 5: Enterprise Utility Suite (⭐⭐⭐)

---

## Next Steps

Once you've mastered Level 3:

1. Build one of the production projects
2. Contribute to open-source utilities
3. Review Node.js util module source code
4. Explore advanced Node.js modules (async_hooks, perf_hooks)
5. Apply knowledge to real production applications

---

## Need Help?

- Review the [guides](./guides/) for in-depth explanations
- Check [Level 2](../level-2-intermediate/README.md) if you need to review intermediate concepts
- Study the [examples](./examples/) for practical demonstrations
- Compare your solutions with provided [solutions](./solutions/)
- Review [CONCEPTS.md](../CONCEPTS.md) for foundational understanding

---

**Ready to master advanced util patterns?** Begin with [Guide 1: Custom Promisify Implementations](guides/01-custom-promisify-implementations.md)!
