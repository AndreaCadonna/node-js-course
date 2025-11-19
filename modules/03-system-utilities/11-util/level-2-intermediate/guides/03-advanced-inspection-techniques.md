# Advanced Inspection Techniques

**Reading Time:** 15 minutes
**Difficulty:** Intermediate
**Prerequisites:** Basic util.inspect() knowledge, JavaScript symbols

## Introduction

Custom object inspection is your secret weapon for better debugging. When you `console.log()` an object, you want useful information - not `[Object object]` or exposed passwords. The `[util.inspect.custom]` symbol lets you control exactly what gets displayed.

**Why This Matters:**
- Better debugging experience for you and your users
- Hide sensitive data automatically
- Provide relevant context without clutter
- Make complex objects understandable at a glance

## What You'll Learn

- How to implement `[util.inspect.custom]`
- Hiding sensitive data in logs
- Environment-aware inspection
- Performance optimization techniques
- Advanced formatting options
- Best practices for custom inspectors

---

## Part 1: Understanding util.inspect.custom

### Basic Custom Inspection

The `[util.inspect.custom]` symbol lets you define how your objects appear:

```javascript
const util = require('util');

class User {
  constructor(name, password) {
    this.name = name;
    this.password = password;
  }

  [util.inspect.custom](depth, options) {
    return `User { name: '${this.name}', password: '[HIDDEN]' }`;
  }
}

const user = new User('Alice', 'secret123');
console.log(user);
// Output: User { name: 'Alice', password: '[HIDDEN]' }
// Instead of: User { name: 'Alice', password: 'secret123' }
```

### The inspect.custom Signature

```javascript
[util.inspect.custom](depth, options, inspect)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `depth` | number | Current inspection depth (null = unlimited) |
| `options` | object | Inspection options (colors, showHidden, etc.) |
| `inspect` | function | The inspect function itself (for recursion) |

---

## Part 2: Respecting Inspection Options

### Working with Depth

Always respect the `depth` parameter to prevent infinite output:

```javascript
class Tree {
  constructor(value) {
    this.value = value;
    this.children = [];
  }

  addChild(child) {
    this.children.push(child);
  }

  [util.inspect.custom](depth, options) {
    // Stop at depth limit
    if (depth < 0) {
      return '[Tree]';
    }

    // Show value and recursively inspect children
    const childrenStr = util.inspect(this.children, {
      ...options,
      depth: depth === null ? null : depth - 1
    });

    return `Tree(${this.value}) ${childrenStr}`;
  }
}

// Usage
const root = new Tree('A');
root.addChild(new Tree('B'));
root.addChild(new Tree('C'));

console.log(util.inspect(root, { depth: 0 }));
// Tree(A) [Tree]

console.log(util.inspect(root, { depth: 1 }));
// Tree(A) [ Tree(B) [], Tree(C) [] ]
```

### Using Options for Colors

Respect the `colors` option and use `options.stylize()`:

```javascript
class Status {
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }

  [util.inspect.custom](depth, options) {
    const { stylize } = options;

    // Color based on status
    const color = this.code >= 400 ? 'red' :
                  this.code >= 300 ? 'yellow' :
                  this.code >= 200 ? 'green' : 'blue';

    const codeStr = stylize(this.code.toString(), color);
    return `Status ${codeStr}: ${this.message}`;
  }
}

const success = new Status(200, 'OK');
const error = new Status(500, 'Internal Server Error');

console.log(util.inspect(success, { colors: true }));
// Status 200: OK  (200 in green)

console.log(util.inspect(error, { colors: true }));
// Status 500: Internal Server Error  (500 in red)
```

---

## Part 3: Hiding Sensitive Data

### Pattern 1: Automatic Field Hiding

```javascript
const util = require('util');

class SecureObject {
  constructor(data) {
    this.data = data;
    this.sensitiveFields = ['password', 'apiKey', 'token', 'secret'];
  }

  [util.inspect.custom](depth, options) {
    const safe = {};

    for (const [key, value] of Object.entries(this.data)) {
      const isSensitive = this.sensitiveFields.some(
        field => key.toLowerCase().includes(field.toLowerCase())
      );

      safe[key] = isSensitive ? '[REDACTED]' : value;
    }

    return `SecureObject ${util.inspect(safe, {
      ...options,
      depth: depth === null ? null : depth - 1
    })}`;
  }
}

const obj = new SecureObject({
  username: 'alice',
  password: 'secret123',
  email: 'alice@example.com',
  apiKey: 'sk_live_abc123'
});

console.log(obj);
// SecureObject {
//   username: 'alice',
//   password: '[REDACTED]',
//   email: 'alice@example.com',
//   apiKey: '[REDACTED]'
// }
```

### Pattern 2: Environment-Based Visibility

Show more in development, less in production:

```javascript
class Config {
  constructor(config) {
    this.public = config.public || {};
    this.secrets = config.secrets || {};
    this.internal = config.internal || {};
  }

  [util.inspect.custom](depth, options) {
    const env = process.env.NODE_ENV || 'development';

    if (env === 'production') {
      // Minimal info in production
      return `Config { public: ${Object.keys(this.public).length} keys, secrets: [HIDDEN] }`;
    }

    if (env === 'development') {
      // Show structure but hide values
      const safeSecrets = {};
      for (const key of Object.keys(this.secrets)) {
        safeSecrets[key] = '[REDACTED]';
      }

      return `Config ${util.inspect({
        public: this.public,
        secrets: safeSecrets,
        internal: this.internal
      }, { ...options, depth: depth - 1 })}`;
    }

    // Test environment: Show everything
    return `Config ${util.inspect({
      public: this.public,
      secrets: this.secrets,
      internal: this.internal
    }, { ...options, depth: depth - 1 })}`;
  }
}
```

---

## Part 4: Smart Truncation

### Truncating Large Collections

```javascript
class DataCollection {
  constructor(name, items) {
    this.name = name;
    this.items = items;
  }

  [util.inspect.custom](depth, options) {
    const maxItems = options.maxArrayLength || 10;
    const itemCount = this.items.length;
    const showCount = Math.min(itemCount, maxItems);
    const hiddenCount = itemCount - showCount;

    let output = `${this.name} (${itemCount} items)`;

    if (itemCount === 0) {
      return `${output} []`;
    }

    output += ' [\n';

    // Show first N items
    for (let i = 0; i < showCount; i++) {
      const itemStr = util.inspect(this.items[i], {
        ...options,
        depth: depth - 1,
        compact: true
      });
      output += `  ${itemStr}`;
      if (i < showCount - 1 || hiddenCount > 0) {
        output += ',';
      }
      output += '\n';
    }

    // Show truncation message
    if (hiddenCount > 0) {
      output += `  ... ${hiddenCount} more item${hiddenCount === 1 ? '' : 's'}\n`;
    }

    output += ']';

    return output;
  }
}

const collection = new DataCollection('Users', [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
  // ... many more
]);

console.log(util.inspect(collection, { maxArrayLength: 2 }));
// Users (15 items) [
//   { id: 1, name: 'Alice' },
//   { id: 2, name: 'Bob' },
//   ... 13 more items
// ]
```

### Truncating Long Strings

```javascript
class LogEntry {
  constructor(message, data) {
    this.timestamp = new Date();
    this.message = message;
    this.data = data;
  }

  [util.inspect.custom](depth, options) {
    const maxLength = options.maxStringLength || 50;
    let msg = this.message;

    if (msg.length > maxLength) {
      msg = msg.substring(0, maxLength - 3) + '...';
    }

    return `LogEntry { time: ${this.timestamp.toISOString()}, message: "${msg}" }`;
  }
}

const longLog = new LogEntry(
  'This is a very long log message that would normally clutter the output and make it hard to read',
  {}
);

console.log(longLog);
// LogEntry { time: 2024-01-15T10:00:00.000Z, message: "This is a very long log message that would..." }
```

---

## Part 5: Visual Indicators

### Status Indicators

Use emojis and symbols for quick understanding:

```javascript
class Connection {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.connected = false;
    this.errors = 0;
  }

  [util.inspect.custom]() {
    const status = this.connected ? '🟢 Connected' : '🔴 Disconnected';
    const health = this.errors === 0 ? '✓' :
                   this.errors < 5 ? '⚠️ ' :
                   '❌';

    return `Connection ${status} ${health}\n` +
           `  Host: ${this.host}:${this.port}\n` +
           `  Errors: ${this.errors}`;
  }
}

const conn = new Connection('localhost', 5432);
conn.connected = true;

console.log(conn);
// Connection 🟢 Connected ✓
//   Host: localhost:5432
//   Errors: 0
```

### Formatted Tables

```javascript
class Statistics {
  constructor(data) {
    this.data = data;
  }

  [util.inspect.custom]() {
    let output = 'Statistics:\n';

    // Find longest key for alignment
    const maxKeyLength = Math.max(...Object.keys(this.data).map(k => k.length));

    for (const [key, value] of Object.entries(this.data)) {
      const padding = ' '.repeat(maxKeyLength - key.length);
      output += `  ${key}:${padding} ${value}\n`;
    }

    return output.trimEnd();
  }
}

const stats = new Statistics({
  requests: 1523,
  errors: 12,
  avgResponseTime: 45.2,
  uptime: 86400
});

console.log(stats);
// Statistics:
//   requests:        1523
//   errors:          12
//   avgResponseTime: 45.2
//   uptime:          86400
```

---

## Part 6: Performance Optimization

### ✅ Best Practices

**1. Check depth before expensive operations**

```javascript
[util.inspect.custom](depth, options) {
  // Quick exit for depth limit
  if (depth < 0) {
    return '[ComplexObject]';
  }

  // Only compute expensive stuff if needed
  const stats = this.calculateStatistics();
  return `ComplexObject { stats: ${util.inspect(stats, options)} }`;
}
```

**2. Cache computed values**

```javascript
class CachedInspector {
  constructor() {
    this._inspectCache = null;
    this._cacheTimestamp = 0;
    this.cacheTimeout = 1000; // 1 second
  }

  [util.inspect.custom](depth, options) {
    const now = Date.now();

    // Use cached value if recent
    if (this._inspectCache &&
        now - this._cacheTimestamp < this.cacheTimeout) {
      return this._inspectCache;
    }

    // Compute fresh value
    this._inspectCache = this._computeInspection(depth, options);
    this._cacheTimestamp = now;

    return this._inspectCache;
  }

  _computeInspection(depth, options) {
    // Expensive inspection logic here
    return '...';
  }
}
```

**3. Avoid infinite loops**

```javascript
// ❌ BAD: Infinite recursion
class BadClass {
  [util.inspect.custom]() {
    return util.inspect(this); // Calls itself forever!
  }
}

// ✅ GOOD: Return plain object or string
class GoodClass {
  [util.inspect.custom]() {
    // Option 1: Return string
    return `GoodClass { value: ${this.value} }`;

    // Option 2: Return plain object
    // return { value: this.value };
  }
}
```

### ❌ Common Mistakes

**Mistake 1: Ignoring depth parameter**

```javascript
// ❌ BAD
[util.inspect.custom](depth, options) {
  return util.inspect(this.nested, options);
  // Always shows full depth!
}

// ✅ GOOD
[util.inspect.custom](depth, options) {
  if (depth < 0) return '[Object]';

  return util.inspect(this.nested, {
    ...options,
    depth: depth - 1
  });
}
```

**Mistake 2: Not using options.stylize**

```javascript
// ❌ BAD
[util.inspect.custom]() {
  return '\x1b[32mGreen Text\x1b[0m'; // Hardcoded colors
}

// ✅ GOOD
[util.inspect.custom](depth, options) {
  return options.stylize('Green Text', 'string');
}
```

---

## Part 7: Complete Example

```javascript
const util = require('util');

/**
 * Production-ready custom inspector
 */
class DatabaseConnection {
  constructor(config) {
    this.config = config;
    this.connected = false;
    this.queryCount = 0;
    this.lastQuery = null;
    this.lastQueryTime = null;
    this.errors = [];
    this.pool = {
      active: 0,
      idle: 5,
      max: 10
    };
  }

  [util.inspect.custom](depth, options) {
    // Quick exit for depth limit
    if (depth < 0) {
      return options.stylize('[DatabaseConnection]', 'special');
    }

    // Status indicator
    const statusIcon = this.connected ? '🟢' : '🔴';
    const statusText = this.connected ? 'Connected' : 'Disconnected';
    const status = `${statusIcon} ${statusText}`;

    // Hide password in config
    const safeConfig = { ...this.config };
    if (safeConfig.password) {
      safeConfig.password = '[HIDDEN]';
    }

    // Truncate long queries
    let queryDisplay = this.lastQuery || 'None';
    const maxQueryLength = 50;
    if (queryDisplay.length > maxQueryLength) {
      queryDisplay = queryDisplay.substring(0, maxQueryLength - 3) + '...';
    }

    // Build output
    const lines = [
      `DatabaseConnection ${status}`,
      `  Host: ${this.config.host}:${this.config.port}`,
      `  Database: ${this.config.database || 'default'}`,
      `  Queries: ${this.queryCount}`,
    ];

    if (this.lastQuery) {
      lines.push(`  Last Query: "${queryDisplay}"`);
      lines.push(`  Last Query Time: ${this.lastQueryTime.toISOString()}`);
    }

    lines.push(
      `  Pool: ${this.pool.active} active, ` +
      `${this.pool.idle} idle, ` +
      `${this.pool.max} max`
    );

    if (this.errors.length > 0) {
      const errorCount = this.errors.length;
      lines.push(`  ⚠️  Errors: ${errorCount}`);

      // Show recent error if depth allows
      if (depth > 0 && errorCount > 0) {
        const recentError = this.errors[errorCount - 1];
        lines.push(`  Recent: ${recentError.message}`);
      }
    }

    // Show full config if depth allows
    if (depth > 0) {
      const configStr = util.inspect(safeConfig, {
        ...options,
        depth: depth - 1,
        compact: true
      });
      lines.push(`  Config: ${configStr}`);
    }

    return lines.join('\n');
  }
}
```

---

## Summary

### Key Takeaways

1. **Use [util.inspect.custom] for better debugging** - Control what developers see when they log your objects

2. **Always respect options parameter** - Use depth, colors, maxArrayLength for consistent behavior

3. **Hide sensitive data automatically** - Never expose passwords, keys, or tokens in logs

4. **Adapt to environment** - Show more in development, less in production

5. **Truncate large data** - Prevent console spam from large arrays and long strings

6. **Use visual indicators** - Emojis and colors provide quick understanding

7. **Optimize for performance** - Check depth early, cache when appropriate, avoid infinite loops

### Quick Reference

```javascript
// Basic custom inspection
[util.inspect.custom](depth, options) {
  // Check depth limit
  if (depth < 0) return '[Object]';

  // Hide sensitive data
  const safe = { ...this };
  safe.password = '[HIDDEN]';

  // Respect options
  return util.inspect(safe, {
    ...options,
    depth: depth - 1
  });
}
```

### Checklist for Custom Inspectors

- [ ] Check `depth < 0` for quick exit
- [ ] Hide sensitive fields (passwords, tokens, etc.)
- [ ] Use `options.stylize()` for colors
- [ ] Pass `depth - 1` to nested inspections
- [ ] Truncate large arrays/strings
- [ ] Return string or plain object (not `this`)
- [ ] Test in different environments
- [ ] Optimize expensive operations

---

## Next Steps

- Practice: Complete Exercise 3 to build advanced inspectors
- Read: [Debugging with debuglog](./04-debugging-with-debuglog.md)
- Experiment: Try custom inspection in your projects

## Further Reading

- [util.inspect documentation](https://nodejs.org/api/util.html#util_util_inspect_object_options)
- [Custom inspection in TypeScript](https://www.typescriptlang.org/docs/handbook/symbols.html)
- [Chrome DevTools custom formatters](https://docs.google.com/document/d/1FTascZXT9cxfetuPRT2eXPQKXui4nWFivUnS_335T3U)
