# Util - Level 2: Intermediate

## 🎯 Start Here: Conceptual Understanding First!

**Before diving into code examples**, read these guides to build a solid foundation. Understanding the concepts will make the examples much clearer and help you avoid common mistakes.

### 📖 Essential Guides (60 minutes total)

1. **[Callbackify and Backward Compatibility](guides/01-callbackify-and-compatibility.md)** ⭐ MOST IMPORTANT
   - **Time**: 20 minutes
   - **Why**: Essential for maintaining backward compatibility in APIs
   - **What you'll learn**: How to convert promises back to callbacks, maintaining dual APIs, migration strategies

2. **[Deprecation Strategies](guides/02-deprecation-strategies.md)**
   - **Time**: 15 minutes
   - **What you'll learn**: Proper API deprecation, warning systems, migration paths for users

3. **[Advanced Inspection Techniques](guides/03-advanced-inspection-techniques.md)**
   - **Time**: 15 minutes
   - **What you'll learn**: Deep customization, custom inspectors, performance optimization

4. **[Debugging with debuglog](guides/04-debugging-with-debuglog.md)**
   - **Time**: 10 minutes
   - **What you'll learn**: Conditional logging, production debugging, NODE_DEBUG patterns

### Why Read Guides First?

Without understanding the concepts:
- ❌ You won't understand when to use callbackify vs promisify
- ❌ Deprecation warnings will seem like noise
- ❌ You'll miss powerful debugging techniques
- ❌ Custom inspection will feel like magic

With conceptual understanding:
- ✅ You'll know the right tool for each situation
- ✅ You'll maintain backward compatibility professionally
- ✅ You'll debug production issues efficiently
- ✅ You'll create developer-friendly APIs
- ✅ You're ready for technical interviews

---

## Learning Objectives

By the end of Level 2, you will be able to:

- ✅ Convert promise-based functions to callback-based using util.callbackify()
- ✅ Deprecate APIs properly with helpful warnings
- ✅ Implement custom object inspection with [util.inspect.custom]
- ✅ Use util.debuglog() for conditional production logging
- ✅ Apply advanced formatting options with formatWithOptions()
- ✅ Understand all util.types for comprehensive type checking
- ✅ Build backward-compatible APIs during migrations
- ✅ Create production-ready utility patterns

---

## Topics Covered

### 1. Callbackify - Reverse Conversion
- Converting promises to callbacks with util.callbackify()
- When and why to use callbackify
- Maintaining backward compatibility
- Supporting both callback and promise APIs
- Migration strategies for existing code

### 2. API Deprecation
- Using util.deprecate() to mark functions as deprecated
- Creating helpful deprecation warnings
- Planning migration paths
- Maintaining deprecated code during transitions
- Best practices for version management

### 3. Advanced Inspection
- Custom object inspection with [util.inspect.custom]
- Controlling inspection depth and formatting
- Using showHidden, breakLength, and other options
- Performance considerations for large objects
- Creating developer-friendly debug output

### 4. Conditional Debugging
- Using util.debuglog() for production debugging
- NODE_DEBUG environment variable patterns
- Creating namespaced debug output
- Performance impact of debug logging
- Best practices for production logging

### 5. Advanced Formatting
- util.formatWithOptions() for customized formatting
- Combining inspection and formatting options
- Creating custom format functions
- Building logging systems with util functions

### 6. Comprehensive Type Checking
- Complete guide to util.types methods
- Checking for primitives vs objects
- Node.js-specific types (Buffer, Promise, etc.)
- When to use util.types vs typeof/instanceof
- Building robust type validators

---

## Prerequisites

- Completed Level 1: Util Basics
- Strong understanding of callbacks and promises
- Experience with async/await
- Familiarity with JavaScript classes and symbols
- Understanding of Node.js error patterns

---

## ⏱️ Time Required

- **With Guides** (Recommended): 3-4 hours
  - Guides: 60 minutes
  - Examples: 60 minutes
  - Exercises: 60-90 minutes
  - Review: 20 minutes

- **Without Guides** (Fast Track): 2-2.5 hours
  - Examples: 45 minutes
  - Exercises: 60-75 minutes
  - Review: 15 minutes

---

## 📚 Recommended Learning Flow

```
Step 1: Read Essential Guides (60 min)
   ├─ Callbackify and Compatibility (20 min) ⭐
   ├─ Deprecation Strategies (15 min)
   ├─ Advanced Inspection (15 min)
   └─ Debugging with debuglog (10 min)
        ↓
Step 2: Study Examples (60 min)
   ├─ Study examples 1-4 (Core concepts)
   ├─ Study examples 5-6 (Custom patterns)
   ├─ Study examples 7-8 (Production use)
   └─ Run and modify each example
        ↓
Step 3: Complete Exercises (60-90 min)
   ├─ Exercise 1: Backward Compatible API (⭐⭐)
   ├─ Exercise 2: Deprecation System (⭐⭐)
   ├─ Exercise 3: Advanced Inspector (⭐⭐)
   ├─ Exercise 4: Debug Logging (⭐⭐⭐)
   └─ Exercise 5: Production Library (⭐⭐⭐)
        ↓
Step 4: Verify Understanding
   ├─ Can you explain when to use callbackify?
   ├─ Can you deprecate APIs properly?
   ├─ Can you customize object inspection?
   └─ Ready for Level 3? ✓
```

---

## Examples Overview

### [01-callbackify-basics.js](examples/01-callbackify-basics.js)
Learn the reverse of promisify - converting promise-based functions back to callbacks. Essential for backward compatibility.

### [02-deprecate-apis.js](examples/02-deprecate-apis.js)
Mark functions as deprecated with proper warnings. Guide users through API changes professionally.

### [03-advanced-inspection.js](examples/03-advanced-inspection.js)
Master advanced inspection options like showHidden, breakLength, and depth control for complex debugging scenarios.

### [04-debuglog-conditional.js](examples/04-debuglog-conditional.js)
Implement conditional logging with NODE_DEBUG. Perfect for production debugging without performance impact.

### [05-format-with-options.js](examples/05-format-with-options.js)
Use formatWithOptions() to combine formatting and inspection capabilities for advanced output control.

### [06-custom-inspect.js](examples/06-custom-inspect.js)
Implement [util.inspect.custom] to control how your objects are displayed. Create developer-friendly debug output.

### [07-types-comprehensive.js](examples/07-types-comprehensive.js)
Complete guide to all util.types methods. Learn reliable type checking for all JavaScript and Node.js types.

### [08-production-patterns.js](examples/08-production-patterns.js)
Real-world patterns combining multiple util functions. Production-ready logging, debugging, and API patterns.

---

## Exercises Overview

### [exercise-1.js](exercises/exercise-1.js) - ⭐⭐ Intermediate
**Create Backward Compatible API**
Build an API that supports both callbacks and promises, allowing gradual migration for users.

### [exercise-2.js](exercises/exercise-2.js) - ⭐⭐ Intermediate
**Implement Deprecation System**
Create a deprecation warning system that helps users migrate to new APIs with clear guidance.

### [exercise-3.js](exercises/exercise-3.js) - ⭐⭐ Intermediate
**Advanced Object Inspector**
Build a custom object inspector with configurable options for debugging complex data structures.

### [exercise-4.js](exercises/exercise-4.js) - ⭐⭐⭐ Hard
**Debug Logging System**
Implement a namespaced debug logging system using util.debuglog() with multiple severity levels.

### [exercise-5.js](exercises/exercise-5.js) - ⭐⭐⭐ Hard
**Production Utility Library**
Create a comprehensive utility library combining inspection, formatting, logging, and type checking.

---

## Solutions

Complete solutions with multiple implementation approaches:

- [Solution 1](solutions/exercise-1-solution.js) - Backward compatible API
- [Solution 2](solutions/exercise-2-solution.js) - Deprecation system
- [Solution 3](solutions/exercise-3-solution.js) - Advanced inspector
- [Solution 4](solutions/exercise-4-solution.js) - Debug logging
- [Solution 5](solutions/exercise-5-solution.js) - Production library

---

## Key Concepts Summary

### util.callbackify() - Reverse Conversion

```javascript
const util = require('util');

// Promise-based function
async function fetchData(id) {
  const data = await database.get(id);
  return data;
}

// Convert to callback-based for backward compatibility
const fetchDataCallback = util.callbackify(fetchData);

// Now supports both styles
fetchDataCallback(123, (err, data) => {
  if (err) console.error(err);
  else console.log(data);
});

// Original still works
const data = await fetchData(123);
```

### util.deprecate() - API Deprecation

```javascript
const util = require('util');

// Old API to deprecate
function oldApi(data) {
  return processData(data);
}

// Wrap with deprecation warning
const deprecatedApi = util.deprecate(
  oldApi,
  'oldApi() is deprecated. Use newApi() instead.',
  'DEP0001' // Deprecation code
);

// Users get helpful warning
deprecatedApi(data); // Shows: (node:1234) [DEP0001] DeprecationWarning
```

### Custom Inspection

```javascript
const util = require('util');

class User {
  constructor(name, password) {
    this.name = name;
    this.password = password; // Sensitive!
  }

  // Custom inspection - hide password
  [util.inspect.custom](depth, options) {
    return `User { name: '${this.name}', password: '[HIDDEN]' }`;
  }
}

const user = new User('alice', 'secret123');
console.log(user); // User { name: 'alice', password: '[HIDDEN]' }
// Instead of: User { name: 'alice', password: 'secret123' }
```

### util.debuglog() - Conditional Debugging

```javascript
const util = require('util');

// Create debug logger
const debugLog = util.debuglog('myapp');

// Only logs when NODE_DEBUG=myapp
debugLog('Database query started'); // Silent by default
debugLog('Result: %O', result);

// Enable: NODE_DEBUG=myapp node app.js
// Output: MYAPP 12345: Database query started
```

---

## Common Patterns

### Pattern 1: Dual API Support

```javascript
const util = require('util');

// Modern promise-based implementation
async function getData(id) {
  return await database.query(id);
}

// Backward compatible callback version
getData.callback = util.callbackify(getData);

// Usage:
await getData(123);                    // Promise style
getData.callback(123, (err, data) => {}); // Callback style
```

### Pattern 2: Gradual Deprecation

```javascript
const util = require('util');

// Phase 1: Deprecate with warning
exports.oldMethod = util.deprecate(
  oldMethodImpl,
  'oldMethod is deprecated. Use newMethod instead.',
  'DEP0001'
);

// Phase 2: New method available
exports.newMethod = newMethodImpl;

// Phase 3: (Next major version) Remove oldMethod
```

### Pattern 3: Smart Object Inspection

```javascript
class Config {
  constructor(data) {
    this.publicData = data.public;
    this.secretData = data.secret;
  }

  [util.inspect.custom](depth, options) {
    // Hide secrets in production
    if (process.env.NODE_ENV === 'production') {
      return `Config { publicData: ${util.inspect(this.publicData)} }`;
    }
    // Show everything in development
    return `Config ${util.inspect({
      publicData: this.publicData,
      secretData: this.secretData
    }, options)}`;
  }
}
```

---

## Common Pitfalls

### Pitfall 1: Not Handling Rejection in Callbackify

```javascript
// ❌ Wrong - Promise rejection becomes callback error
const fn = util.callbackify(async () => {
  throw new Error('Failed'); // Becomes err in callback
});

fn((err, result) => {
  // err will be the Error object
  // Make sure to check err!
});

// ✅ Correct - Always check error first
fn((err, result) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Result:', result);
});
```

### Pitfall 2: Deprecation Warning Spam

```javascript
// ❌ Wrong - Creates new wrapper each time
function getDeprecated() {
  return util.deprecate(fn, 'deprecated');
}

// Warns every time getDeprecated() is called!

// ✅ Correct - Create wrapper once
const deprecatedFn = util.deprecate(fn, 'deprecated');

function getDeprecated() {
  return deprecatedFn;
}
```

### Pitfall 3: Custom Inspect Infinite Loop

```javascript
// ❌ Wrong - Infinite recursion
class BadClass {
  [util.inspect.custom]() {
    return util.inspect(this); // Calls itself!
  }
}

// ✅ Correct - Return string or plain object
class GoodClass {
  [util.inspect.custom]() {
    return `GoodClass { value: ${this.value} }`;
    // Or: return { value: this.value };
  }
}
```

---

## Best Practices

### ✅ DO:

- Use callbackify only when you need backward compatibility
- Provide clear deprecation messages with migration paths
- Implement custom inspect for classes with sensitive data
- Use debuglog for production debugging
- Check NODE_ENV before expensive inspection operations
- Document deprecation codes and timelines
- Test both callback and promise versions

### ❌ DON'T:

- Use callbackify for new APIs (use callbacks or promises, not both)
- Deprecate without providing alternatives
- Forget to hide sensitive data in custom inspect
- Leave debuglog calls in hot code paths
- Create deprecation wrappers inside loops
- Change custom inspect behavior unexpectedly
- Mix deprecated and non-deprecated exports confusingly

---

## Testing Your Knowledge

### Self-Check Questions

Before moving to Level 3, you should be able to answer:

**Conceptual Questions:**

1. When should you use util.callbackify() vs keeping separate implementations? ([Guide 1](guides/01-callbackify-and-compatibility.md))
2. What makes a good deprecation warning? ([Guide 2](guides/02-deprecation-strategies.md))
3. How does [util.inspect.custom] differ from toString()? ([Guide 3](guides/03-advanced-inspection-techniques.md))
4. When should you use util.debuglog() vs console.log()? ([Guide 4](guides/04-debugging-with-debuglog.md))

**Practical Questions:**

1. How do you support both callbacks and promises in an API?
2. How do you deprecate a function parameter vs entire function?
3. How do you prevent sensitive data from appearing in logs?
4. How do you enable debug logging for specific modules?

---

## Practice Projects

Apply your intermediate skills:

### Project 1: Database Wrapper
Build a database wrapper that:
- Supports both callback and promise APIs
- Deprecates old methods properly
- Custom inspects connections (hides credentials)
- Debuglog for query logging
- Type checks for query parameters

### Project 2: Configuration Manager
Create a config system that:
- Loads from multiple sources
- Deprecates old config keys
- Custom inspect hides secrets
- Debug logs config resolution
- Validates types with util.types

### Project 3: API Client Library
Build an HTTP client that:
- Dual callback/promise API
- Deprecation warnings for old endpoints
- Custom request/response inspection
- Conditional debug logging
- Comprehensive type checking

---

## Self-Assessment Checklist

Before moving to Level 3, you should be comfortable with:

- [ ] Understanding when to use util.callbackify()
- [ ] Creating backward compatible APIs
- [ ] Deprecating functions with helpful warnings
- [ ] Implementing [util.inspect.custom] symbol
- [ ] Using util.debuglog() for conditional logging
- [ ] Applying util.formatWithOptions()
- [ ] Using util.types for type checking
- [ ] Building production-ready utilities

---

## Exercises Checklist

- [ ] Exercise 1: Backward Compatible API (⭐⭐)
- [ ] Exercise 2: Deprecation System (⭐⭐)
- [ ] Exercise 3: Advanced Inspector (⭐⭐)
- [ ] Exercise 4: Debug Logging System (⭐⭐⭐)
- [ ] Exercise 5: Production Utility Library (⭐⭐⭐)

---

## Next Steps

Once you've completed all exercises and feel comfortable with the intermediate concepts:

1. Review challenging concepts
2. Build one of the practice projects
3. Experiment with real-world scenarios
4. Move to **[Level 3: Advanced](../level-3-advanced/README.md)**

Level 3 will teach you:
- Advanced util.inspect() customization
- Performance optimization strategies
- Building custom utility functions
- Integration with other Node.js modules
- Production debugging at scale

---

## Need Help?

- Review the [guides](./guides/) for conceptual explanations
- Check [Level 1](../level-1-basics/README.md) if you need to review basics
- Study the [examples](./examples/) for practical demonstrations
- Compare your solutions with provided [solutions](./solutions/)
- Review [CONCEPTS.md](../CONCEPTS.md) for foundational understanding

---

**Ready to start?** Begin with [Guide 1: Callbackify and Backward Compatibility](guides/01-callbackify-and-compatibility.md)!
