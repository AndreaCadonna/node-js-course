# Module 11: Util

Master essential utility functions and helpers in Node.js.

## Why This Module Matters

The `util` module provides crucial utility functions that solve common programming challenges. From converting callback-based functions to promises, to inspecting complex objects, to creating deprecation warnings, this module contains tools that every professional Node.js developer uses regularly.

**Real-world applications:**
- Modernizing legacy callback-based code
- Debugging complex object structures
- Type checking and validation
- Creating backward-compatible APIs
- Building robust logging systems
- Implementing graceful deprecation strategies

---

## What You'll Learn

By completing this module, you'll master:

### Technical Skills
- Converting between callbacks and promises
- Advanced object inspection and formatting
- Type checking with util.types
- Text encoding and decoding
- Creating deprecation warnings
- Debugging utilities and techniques

### Practical Applications
- Modernize legacy Node.js codebases
- Build flexible, backward-compatible APIs
- Debug complex data structures effectively
- Implement robust type validation
- Create developer-friendly deprecation paths
- Build production-ready logging systems

---

## Module Structure

This module is divided into three progressive levels:

### [Level 1: Basics](./level-1-basics/README.md)
**Time**: 2-3 hours

Learn the fundamental utility functions:
- util.promisify() for promise conversion
- util.format() for string formatting
- util.inspect() for object visualization
- Basic type checking with util.types
- Text encoding with TextEncoder/TextDecoder

**You'll be able to:**
- Convert callback functions to promises
- Format and inspect objects effectively
- Perform basic type checking
- Work with text encodings
- Use utility helpers in your code

### [Level 2: Intermediate](./level-2-intermediate/README.md)
**Time**: 3-4 hours

Advanced utility patterns:
- util.callbackify() for reverse conversion
- util.deprecate() for API deprecation
- Advanced inspection options
- util.types comprehensive type checking
- Custom formatting with formatWithOptions
- util.debuglog() for conditional logging

**You'll be able to:**
- Build backward-compatible APIs
- Implement graceful deprecation strategies
- Master advanced inspection techniques
- Create conditional debugging systems
- Handle complex type validation
- Build production-ready utilities

### [Level 3: Advanced](./level-3-advanced/README.md)
**Time**: 4-5 hours

Production-ready utility implementations:
- Building custom promisify implementations
- Advanced debugging and logging strategies
- Performance considerations
- Custom inspector implementations
- Utility patterns in production systems
- Deep equality checking with isDeepStrictEqual

**You'll be able to:**
- Build custom utility functions
- Implement production-grade debugging
- Optimize utility usage for performance
- Create sophisticated logging systems
- Handle complex migration scenarios
- Build professional-grade tools

---

## Prerequisites

- Basic JavaScript knowledge
- Understanding of callbacks and promises
- Node.js installed (v14+)
- **Module 4: Events** (helpful for understanding patterns)
- **Module 5: Stream** (helpful for advanced examples)

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

### Converting Callbacks to Promises

The util.promisify() function transforms callback-based functions into promise-based ones:

```javascript
const util = require('util');
const fs = require('fs');

// Convert callback-based fs.readFile to promise-based
const readFile = util.promisify(fs.readFile);

// Now use with async/await
async function readConfig() {
  try {
    const data = await readFile('config.json', 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read config:', err.message);
  }
}
```

### Object Inspection

util.inspect() provides powerful object visualization:

```javascript
const util = require('util');

const complexObject = {
  name: 'Server',
  config: {
    port: 3000,
    host: 'localhost',
    nested: { deep: { value: 'hidden' } }
  },
  circular: null
};
complexObject.circular = complexObject; // Circular reference

// Default inspection
console.log(util.inspect(complexObject));

// Custom depth and colors
console.log(util.inspect(complexObject, {
  depth: 5,
  colors: true,
  compact: false
}));
```

### Type Checking

util.types provides reliable type checking:

```javascript
const util = require('util');

const buffer = Buffer.from('hello');
const date = new Date();
const regex = /test/;

console.log(util.types.isBuffer(buffer));    // true
console.log(util.types.isDate(date));        // true
console.log(util.types.isRegExp(regex));     // true
console.log(util.types.isPromise(Promise.resolve())); // true
```

### String Formatting

util.format() provides sprintf-style string formatting:

```javascript
const util = require('util');

// Format with placeholders
const message = util.format('Hello %s, you have %d messages', 'Alice', 5);
console.log(message); // 'Hello Alice, you have 5 messages'

// JSON formatting
const obj = { name: 'Bob', age: 30 };
console.log(util.format('User: %j', obj));
// User: {"name":"Bob","age":30}

// Object inspection
console.log(util.format('Data: %o', { complex: { nested: 'value' } }));
```

---

## Practical Examples

### Example 1: Modernizing Legacy Code

```javascript
const util = require('util');
const fs = require('fs');

// Old callback-based code
function readConfigOld(callback) {
  fs.readFile('config.json', 'utf8', callback);
}

// Modernized with promisify
const readConfigNew = util.promisify(fs.readFile);

async function loadConfig() {
  const data = await readConfigNew('config.json', 'utf8');
  return JSON.parse(data);
}
```

### Example 2: Deprecating an API

```javascript
const util = require('util');

// Old function that will be removed
const oldFunction = util.deprecate(
  function oldAPI(data) {
    return data.toUpperCase();
  },
  'oldAPI() is deprecated. Use newAPI() instead.',
  'DEP0001'
);

// New function
function newAPI(data) {
  return data.toUpperCase();
}

// First call shows warning, subsequent calls are silent (by default)
oldFunction('test');  // Warning: oldAPI() is deprecated...
```

### Example 3: Advanced Debugging

```javascript
const util = require('util');

// Create a debug logger
const debug = util.debuglog('myapp');

// Only logs when NODE_DEBUG=myapp environment variable is set
debug('Server starting on port %d', 3000);
debug('Configuration: %o', { db: 'mongodb://localhost' });

// Run with: NODE_DEBUG=myapp node app.js
```

---

## Common Pitfalls

### ❌ Not Handling Custom Callback Conventions

```javascript
// Won't work - custom callback convention
function customAsync(arg, callback) {
  // Calls callback with (result, error) instead of (error, result)
  callback(data, null);
}

const promisified = util.promisify(customAsync); // ❌ Wrong!

// Correct - use custom promisify symbol
customAsync[util.promisify.custom] = function(arg) {
  return new Promise((resolve, reject) => {
    customAsync(arg, (result, error) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};
```

### ❌ Circular References Without Inspection

```javascript
const obj = { name: 'test' };
obj.self = obj;

// Wrong - throws error
try {
  console.log(JSON.stringify(obj));
} catch (err) {
  console.error('Error:', err.message); // Converting circular structure
}

// Correct - use util.inspect
console.log(util.inspect(obj)); // <ref *1> { name: 'test', self: [Circular *1] }
```

### ❌ Ignoring Deprecation Warnings

```javascript
// Bad practice - ignoring warnings
process.noDeprecation = true; // ❌ Don't do this!

// Good practice - fix deprecated code usage
const oldAPI = util.deprecate(fn, 'Use newAPI instead');
// Actively migrate to newAPI when you see the warning
```

---

## Module Contents

### Documentation
- **[CONCEPTS.md](./CONCEPTS.md)** - Foundational concepts for the entire module
- **Level READMEs** - Specific guidance for each level

### Conceptual Guides
- **11 in-depth guides** - Deep understanding of specific topics
- **Level 1**: 3 guides on fundamentals
- **Level 2**: 4 guides on intermediate patterns
- **Level 3**: 4 guides on advanced topics

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

3. **Try util.promisify()**:
   ```bash
   node -e "const util = require('util'); const fs = require('fs'); const readFile = util.promisify(fs.readFile); readFile('package.json', 'utf8').then(console.log);"
   ```

### Setting Up

No special setup is required! The util module is built into Node.js.

```javascript
const util = require('util');
// Or with ES modules
import util from 'util';
```

---

## Success Criteria

You'll know you've mastered this module when you can:

- [ ] Convert callback-based APIs to promise-based ones
- [ ] Use util.inspect() to debug complex objects
- [ ] Implement proper deprecation strategies
- [ ] Perform comprehensive type checking
- [ ] Format strings and objects effectively
- [ ] Build conditional debugging systems
- [ ] Handle text encoding/decoding
- [ ] Create backward-compatible APIs
- [ ] Use utility functions in production code

---

## Additional Resources

### Official Documentation
- [Node.js Util Documentation](https://nodejs.org/api/util.html)

### Practice Projects
After completing this module, try building:
1. **API Migration Tool** - Convert a callback-based library to promises
2. **Advanced Logger** - Build a logging system with util.debuglog and util.format
3. **Object Diff Tool** - Create a tool using util.isDeepStrictEqual
4. **Deprecation Manager** - Build a system to track and manage deprecated APIs

### Related Modules
- **Module 4: Events** - Event-driven patterns
- **Module 6: Process** - Process utilities
- **Module 16: Crypto** - Often uses util for encoding

---

## Questions or Issues?

- Review the [CONCEPTS.md](./CONCEPTS.md) for foundational understanding
- Check the guides for deep dives into specific topics
- Study the examples for practical demonstrations
- Review solutions after attempting exercises

---

## Let's Begin!

Start your journey with [Level 1: Basics](./level-1-basics/README.md) and build a solid foundation in Node.js utility functions.

Remember: The util module is your toolkit for writing cleaner, more maintainable Node.js code. Whether you're modernizing legacy code, debugging complex systems, or building robust APIs, these utilities will make you more productive and your code more professional!
