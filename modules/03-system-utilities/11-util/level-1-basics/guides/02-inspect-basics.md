# util.inspect() Basics

**Reading Time:** 15 minutes
**Difficulty:** Beginner
**Prerequisites:** Basic understanding of JavaScript objects

---

## Introduction

Debugging JavaScript objects can be frustrating - `console.log()` often shows `[Object]`, and `JSON.stringify()` fails with circular references or loses important information. The `util.inspect()` function is Node.js's solution for intelligently inspecting and displaying any JavaScript value in a readable, customizable format.

### Why This Matters

Whether you're debugging complex objects, logging application state, or building developer tools, `util.inspect()` gives you complete control over how JavaScript values are displayed. It's the same engine that powers `console.log()` under the hood, but with much more flexibility.

> **Key Insight:** `util.inspect()` is your Swiss Army knife for object inspection. It handles everything JSON.stringify() can't - circular references, functions, symbols, and deep nesting - while giving you fine-grained control over the output.

---

## Table of Contents

- [What You'll Learn](#what-youll-learn)
- [Understanding util.inspect()](#understanding-utilinspect)
- [Basic Usage](#basic-usage)
- [Inspection Options](#inspection-options)
- [Depth Control](#depth-control)
- [Colors and Styling](#colors-and-styling)
- [Circular Reference Handling](#circular-reference-handling)
- [Comparison with Alternatives](#comparison-with-alternatives)
- [Practical Debugging Techniques](#practical-debugging-techniques)
- [Custom Inspect Behavior](#custom-inspect-behavior)
- [Best Practices](#best-practices)
- [Summary](#summary)

---

## What You'll Learn

By the end of this guide, you'll understand:

1. How `util.inspect()` displays JavaScript values
2. Key inspection options (depth, colors, compact)
3. How to handle circular references safely
4. Differences between inspect, console.log, and JSON.stringify
5. Practical debugging techniques
6. How to customize inspection for your own objects

---

## Understanding util.inspect()

### What It Does

`util.inspect()` converts any JavaScript value into a human-readable string representation:

```javascript
const util = require('util');

const obj = {
  name: 'Alice',
  age: 30,
  hobbies: ['reading', 'coding'],
  address: {
    city: 'San Francisco',
    country: 'USA'
  }
};

const output = util.inspect(obj);
console.log(output);
// {
//   name: 'Alice',
//   age: 30,
//   hobbies: [ 'reading', 'coding' ],
//   address: { city: 'San Francisco', country: 'USA' }
// }
```

### Why Not Just Use console.log?

**Surprise:** `console.log()` actually uses `util.inspect()` internally!

```javascript
// These are equivalent:
console.log(obj);
console.log(util.inspect(obj));
```

But `util.inspect()` gives you **control**:

```javascript
// Custom depth
console.log(util.inspect(obj, { depth: 1 }));

// No colors
console.log(util.inspect(obj, { colors: false }));

// Compact format
console.log(util.inspect(obj, { compact: true }));

// console.log can't do these customizations easily!
```

---

## Basic Usage

### Simple Values

```javascript
const util = require('util');

// Primitives
console.log(util.inspect(42));           // 42
console.log(util.inspect('hello'));      // 'hello'
console.log(util.inspect(true));         // true
console.log(util.inspect(null));         // null
console.log(util.inspect(undefined));    // undefined

// Arrays
console.log(util.inspect([1, 2, 3]));
// [ 1, 2, 3 ]

// Objects
console.log(util.inspect({ a: 1, b: 2 }));
// { a: 1, b: 2 }
```

### Functions and Special Values

```javascript
// Functions show their definition
function greet(name) {
  return `Hello, ${name}`;
}
console.log(util.inspect(greet));
// [Function: greet]

// With colors, you see more detail
console.log(util.inspect(greet, { colors: true }));

// Symbols
const sym = Symbol('id');
console.log(util.inspect(sym));
// Symbol(id)

// Regular expressions
console.log(util.inspect(/test/gi));
// /test/gi

// Dates
console.log(util.inspect(new Date('2024-01-01')));
// 2024-01-01T00:00:00.000Z
```

---

## Inspection Options

### The Options Object

```javascript
util.inspect(object, {
  showHidden: false,    // Show non-enumerable properties
  depth: 2,             // How many levels to inspect
  colors: false,        // Use ANSI color codes
  customInspect: true,  // Use custom inspect functions
  showProxy: false,     // Show Proxy target and handler
  maxArrayLength: 100,  // Max array elements to show
  maxStringLength: 10000, // Max string length
  breakLength: 80,      // Line break threshold
  compact: 3,           // Compact or expanded format
  sorted: false,        // Sort object keys
  getters: false        // Show getter return values
});
```

### Common Options Reference

| Option | Default | Description |
|--------|---------|-------------|
| `depth` | `2` | How deeply to inspect nested objects |
| `colors` | `false` | Enable syntax highlighting |
| `compact` | `3` | Format: `true` (compact), `false` (expanded), or number |
| `maxArrayLength` | `100` | Max array elements to display |
| `maxStringLength` | `10000` | Max string length to display |
| `showHidden` | `false` | Include non-enumerable properties |
| `breakLength` | `80` | Characters before line break |

---

## Depth Control

### Understanding Depth

The `depth` option controls how many levels of nested objects to inspect:

```javascript
const util = require('util');

const nested = {
  level1: {
    level2: {
      level3: {
        level4: {
          value: 'deep!'
        }
      }
    }
  }
};

// Depth 0 - Only top level
console.log(util.inspect(nested, { depth: 0 }));
// { level1: [Object] }

// Depth 1 - One level deep
console.log(util.inspect(nested, { depth: 1 }));
// { level1: { level2: [Object] } }

// Depth 2 - Two levels deep (DEFAULT)
console.log(util.inspect(nested, { depth: 2 }));
// { level1: { level2: { level3: [Object] } } }

// Depth null - Infinite depth
console.log(util.inspect(nested, { depth: null }));
// { level1: { level2: { level3: { level4: { value: 'deep!' } } } } }
```

### When to Use Different Depths

```javascript
// Depth 0: Quick overview
console.log(util.inspect(complexObject, { depth: 0 }));
// Good for: Seeing structure, not details

// Depth 1-2: Standard debugging
console.log(util.inspect(complexObject, { depth: 2 }));
// Good for: Most debugging scenarios

// Depth null: Full inspection
console.log(util.inspect(complexObject, { depth: null }));
// Good for: Deep debugging, but can be overwhelming
```

> **Warning:** Using `depth: null` on very large objects can produce massive output and freeze your terminal!

---

## Colors and Styling

### Enabling Colors

```javascript
const util = require('util');

const obj = {
  string: 'hello',
  number: 42,
  boolean: true,
  null: null,
  function: function() {}
};

// Without colors
console.log(util.inspect(obj, { colors: false }));

// With colors (colored in terminal)
console.log(util.inspect(obj, { colors: true }));
```

### Color Scheme

When `colors: true`, different types get different colors:

| Type | Color | Example |
|------|-------|---------|
| String | Green | `'hello'` |
| Number | Yellow | `42` |
| Boolean | Yellow | `true` |
| Null | Bold | `null` |
| Undefined | Grey | `undefined` |
| Function | Cyan | `[Function]` |
| RegExp | Red | `/test/` |
| Date | Magenta | `2024-01-01T...` |
| Special | Cyan | `Symbol(...)` |

### Custom Colors

```javascript
// Customize color scheme
util.inspect.styles = {
  special: 'cyan',
  number: 'yellow',
  boolean: 'yellow',
  undefined: 'grey',
  null: 'bold',
  string: 'green',
  date: 'magenta',
  regexp: 'red'
};

util.inspect.colors = {
  bold: [1, 22],
  italic: [3, 23],
  underline: [4, 24],
  // ... ANSI color codes
};
```

---

## Circular Reference Handling

### The Problem with JSON.stringify

```javascript
// Create circular reference
const obj = { name: 'Alice' };
obj.self = obj; // Points to itself!

// JSON.stringify fails
try {
  JSON.stringify(obj);
} catch (err) {
  console.error('Error:', err.message);
  // Error: Converting circular structure to JSON
}

// util.inspect handles it gracefully
console.log(util.inspect(obj));
// { name: 'Alice', self: [Circular] }
```

### Complex Circular References

```javascript
const util = require('util');

// Parent-child circular reference
const parent = { name: 'Parent' };
const child = { name: 'Child', parent: parent };
parent.child = child;

console.log(util.inspect(parent, { depth: null }));
// {
//   name: 'Parent',
//   child: { name: 'Child', parent: [Circular] }
// }

// Multiple circular references
const a = { name: 'A' };
const b = { name: 'B', a: a };
const c = { name: 'C', a: a, b: b };
a.b = b;
a.c = c;

console.log(util.inspect(a, { depth: null }));
// Shows [Circular] for all circular references
```

### Real-World Example: DOM-like Structure

```javascript
// Simulated DOM tree
class Node {
  constructor(name) {
    this.name = name;
    this.children = [];
    this.parent = null;
  }

  appendChild(child) {
    child.parent = this;
    this.children.push(child);
  }
}

const root = new Node('html');
const body = new Node('body');
const div = new Node('div');

root.appendChild(body);
body.appendChild(div);

console.log(util.inspect(root, { depth: null }));
// Node {
//   name: 'html',
//   children: [
//     Node {
//       name: 'body',
//       children: [
//         Node { name: 'div', children: [], parent: [Circular] }
//       ],
//       parent: [Circular]
//     }
//   ],
//   parent: null
// }
```

---

## Comparison with Alternatives

### util.inspect vs console.log

```javascript
const obj = { a: 1, b: { c: 2 } };

// console.log uses util.inspect internally
console.log(obj);
// { a: 1, b: { c: 2 } }

// util.inspect gives you control
console.log(util.inspect(obj, { colors: true, depth: 1 }));
// Colored output, depth limited

// util.inspect returns a string
const str = util.inspect(obj);
// Can be stored, manipulated, logged elsewhere
```

**Use console.log when:**
- Quick debugging
- Default formatting is fine
- Interactive terminal output

**Use util.inspect when:**
- Need custom formatting
- Want to store/manipulate output
- Building tools or libraries
- Need consistent string representation

### util.inspect vs JSON.stringify

```javascript
const obj = {
  name: 'Alice',
  greet: function() { return 'Hi'; },
  date: new Date(),
  regex: /test/,
  symbol: Symbol('id'),
  undefined: undefined,
  ref: null
};
obj.circular = obj;

// JSON.stringify
try {
  console.log(JSON.stringify(obj, null, 2));
} catch (err) {
  console.log('JSON failed:', err.message);
}
// Fails on circular reference
// Loses: functions, symbols, undefined, regex, date format

// util.inspect
console.log(util.inspect(obj));
// {
//   name: 'Alice',
//   greet: [Function: greet],
//   date: 2024-01-01T00:00:00.000Z,
//   regex: /test/,
//   symbol: Symbol(id),
//   undefined: undefined,
//   ref: null,
//   circular: [Circular]
// }
// Handles everything!
```

### Comparison Table

| Feature | util.inspect | JSON.stringify | console.log |
|---------|--------------|----------------|-------------|
| Circular refs | ✅ Shows [Circular] | ❌ Throws error | ✅ (uses inspect) |
| Functions | ✅ Shows definition | ❌ Omits | ✅ (uses inspect) |
| Symbols | ✅ Shows symbols | ❌ Omits | ✅ (uses inspect) |
| Undefined | ✅ Shows undefined | ❌ Omits | ✅ (uses inspect) |
| RegExp | ✅ Shows pattern | ✅ As string | ✅ (uses inspect) |
| Dates | ✅ ISO format | ✅ ISO string | ✅ (uses inspect) |
| Depth control | ✅ Configurable | ✅ Via replacer | ❌ Uses default |
| Colors | ✅ Optional | ❌ No | ✅ (terminal) |
| Returns string | ✅ Yes | ✅ Yes | ❌ No (logs) |
| Custom format | ✅ Many options | ✅ Replacer | ❌ Limited |

---

## Practical Debugging Techniques

### Technique 1: Quick Object Overview

```javascript
// See structure without details
function overview(obj) {
  return util.inspect(obj, {
    depth: 0,
    colors: true,
    compact: true
  });
}

const bigObject = {
  users: [...],      // 1000 items
  config: {...},     // 50 properties
  cache: {...}       // 500 items
};

console.log(overview(bigObject));
// { users: [Array], config: [Object], cache: [Object] }
```

### Technique 2: Debugging Nested Errors

```javascript
function inspectError(err) {
  return util.inspect(err, {
    depth: null,
    colors: true,
    showHidden: true
  });
}

try {
  throw new Error('Something broke');
} catch (err) {
  err.context = { userId: 123, action: 'delete' };
  console.log(inspectError(err));
  // Shows full error with stack trace and context
}
```

### Technique 3: Comparing Objects

```javascript
function compare(obj1, obj2) {
  const options = { depth: null, colors: false, sorted: true };
  const str1 = util.inspect(obj1, options);
  const str2 = util.inspect(obj2, options);

  if (str1 === str2) {
    console.log('Objects are identical');
  } else {
    console.log('Object 1:', str1);
    console.log('Object 2:', str2);
  }
}
```

### Technique 4: Logging with Context

```javascript
function log(message, data) {
  const timestamp = new Date().toISOString();
  const inspected = util.inspect(data, {
    depth: 3,
    colors: true,
    compact: false,
    breakLength: 60
  });

  console.log(`[${timestamp}] ${message}`);
  console.log(inspected);
}

log('User created', {
  id: 123,
  name: 'Alice',
  metadata: { /* ... */ }
});
```

### Technique 5: Readable Array Inspection

```javascript
// Large arrays
const numbers = Array.from({ length: 200 }, (_, i) => i);

// Default: Shows first 100 + truncation message
console.log(util.inspect(numbers));

// Custom: Show all with line breaks
console.log(util.inspect(numbers, {
  maxArrayLength: null,
  breakLength: 60
}));

// Custom: Compact display
console.log(util.inspect(numbers, {
  maxArrayLength: null,
  compact: true
}));
```

---

## Custom Inspect Behavior

### Implementing [util.inspect.custom]

Control how your objects are inspected:

```javascript
const util = require('util');

class User {
  constructor(name, email, password) {
    this.name = name;
    this.email = email;
    this._password = password; // Private!
  }

  // Custom inspect implementation
  [util.inspect.custom](depth, options) {
    return `User { name: '${this.name}', email: '${this.email}' }`;
    // Password not shown!
  }
}

const user = new User('Alice', 'alice@example.com', 'secret123');

console.log(util.inspect(user));
// User { name: 'Alice', email: 'alice@example.com' }
// Password is hidden!

// Without custom inspect, it would show:
// User {
//   name: 'Alice',
//   email: 'alice@example.com',
//   _password: 'secret123'  // Exposed!
// }
```

### Advanced Custom Inspect

```javascript
class DataStore {
  constructor() {
    this.data = new Map();
    this.metadata = { created: Date.now(), version: '1.0' };
  }

  [util.inspect.custom](depth, options) {
    // Use options for formatting
    const indent = options.stylize ? options.stylize('  ', 'special') : '  ';

    return `DataStore {
${indent}size: ${this.data.size},
${indent}metadata: ${util.inspect(this.metadata, { ...options, depth: depth - 1 })}
${indent}(use .data to see contents)
}`;
  }

  set(key, value) {
    this.data.set(key, value);
  }
}

const store = new DataStore();
store.set('user:1', { name: 'Alice' });
store.set('user:2', { name: 'Bob' });

console.log(util.inspect(store, { colors: true }));
// DataStore {
//   size: 2,
//   metadata: { created: 1234567890, version: '1.0' }
//   (use .data to see contents)
// }
```

---

## Best Practices

### ✅ DO: Use Colors in Development

```javascript
// ✅ Good - Easy to read during development
const DEBUG = util.inspect(data, { colors: true, depth: 3 });
console.log(DEBUG);
```

### ✅ DO: Limit Depth for Large Objects

```javascript
// ✅ Good - Prevents terminal overflow
console.log(util.inspect(hugeObject, { depth: 2 }));

// ❌ Bad - Could freeze terminal
console.log(util.inspect(hugeObject, { depth: null }));
```

### ✅ DO: Use Compact for Arrays

```javascript
// ✅ Good - Readable array display
console.log(util.inspect(longArray, { compact: true }));
// [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...]

// ❌ Bad - Wastes vertical space
console.log(util.inspect(longArray, { compact: false }));
// [
//   1,
//   2,
//   3,
//   ...
```

### ✅ DO: Sort Keys for Consistency

```javascript
// ✅ Good - Consistent output
console.log(util.inspect(obj, { sorted: true }));
// Always same order, easier to compare

// ❌ Bad - Order may vary
console.log(util.inspect(obj));
// Order depends on insertion
```

### ❌ DON'T: Use for Serialization

```javascript
// ❌ Bad - Not meant for data storage
fs.writeFileSync('data.txt', util.inspect(data));

// ✅ Good - Use proper serialization
fs.writeFileSync('data.json', JSON.stringify(data));
```

### ❌ DON'T: Disable Colors in Logs

```javascript
// ❌ Bad - Colors in log files create garbage
logger.log(util.inspect(data, { colors: true }));

// ✅ Good - No colors for permanent logs
logger.log(util.inspect(data, { colors: false }));
```

---

## Summary

### Key Takeaways

1. **`util.inspect()` is the most powerful JavaScript inspection tool**
   - Handles circular references gracefully
   - Shows all types (functions, symbols, etc.)
   - Highly customizable output

2. **Key options to remember:**
   - `depth` - Controls nesting level (default: 2)
   - `colors` - Enables syntax highlighting (default: false)
   - `compact` - Controls formatting (default: 3)
   - `maxArrayLength` - Limits array output (default: 100)

3. **Use cases:**
   - **Debugging:** See complete object structure
   - **Logging:** Custom formatted output
   - **Development:** Color-coded terminal output
   - **Comparison:** Sorted, consistent representations

4. **Advantages over alternatives:**
   - vs `console.log`: More control and customization
   - vs `JSON.stringify`: Handles circular refs, functions, symbols
   - vs manual formatting: Automatic, consistent, tested

5. **Custom inspect:**
   - Implement `[util.inspect.custom]` to control display
   - Hide sensitive data
   - Show user-friendly representations

### Quick Reference

```javascript
const util = require('util');

// Basic inspection
util.inspect(obj);

// Common configurations
util.inspect(obj, { depth: 3, colors: true });
util.inspect(obj, { compact: true, maxArrayLength: 50 });
util.inspect(obj, { depth: null }); // Infinite depth
util.inspect(obj, { sorted: true }); // Sorted keys

// Custom inspect
class MyClass {
  [util.inspect.custom](depth, options) {
    return `MyClass { ... }`;
  }
}
```

### When to Use What

| Scenario | Tool | Reason |
|----------|------|--------|
| Quick debug | `console.log()` | Fast, automatic |
| Custom format | `util.inspect()` | Control over output |
| Data storage | `JSON.stringify()` | Standard format |
| Circular refs | `util.inspect()` | Only one that works |
| Deep objects | `util.inspect()` | Depth control |
| Production logs | `util.inspect()` | No colors, custom format |

---

## Next Steps

- **Practice:** Try inspecting complex objects in your projects
- **Explore:** [util.format() Basics](./03-format-basics.md) - Learn about string formatting
- **Experiment:** Create custom inspect methods for your classes
- **Advanced:** Study Node.js source to see how core modules use inspect

---

## Related Guides

- [Debugging Node.js Applications](../../common/debugging.md)
- [Logging Best Practices](../../common/logging.md)
- [Custom Object Representations](../../advanced/custom-inspect.md)
