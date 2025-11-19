# Sandbox Creation in the VM Module

## Introduction

A sandbox is a controlled execution environment where code runs with limited access to resources and APIs. Creating effective sandboxes is essential for safely running untrusted code, building plugin systems, and implementing code playgrounds. This guide teaches you how to create, configure, and secure sandboxes using the VM module.

### Why This Matters

Running untrusted code is inherently risky. A well-designed sandbox minimizes this risk by controlling exactly what the code can access and do. Understanding sandbox creation is crucial for building secure applications that execute user-provided code.

> **Key Insight:** A sandbox is like a playground - you define the boundaries and equipment (APIs) available, while keeping the children (code) away from dangerous areas (system resources).

---

## Table of Contents

- [What is a Sandbox?](#what-is-a-sandbox)
- [Creating Basic Sandboxes](#creating-basic-sandboxes)
- [Providing Built-in Objects](#providing-built-in-objects)
- [Sandbox Security Basics](#sandbox-security-basics)
- [Common Sandbox Patterns](#common-sandbox-patterns)
- [Sandbox APIs](#sandbox-apis)
- [Freezing and Sealing](#freezing-and-sealing)
- [Resource Limits](#resource-limits)
- [Practical Examples](#practical-examples)
- [Security Pitfalls](#security-pitfalls)
- [Best Practices](#best-practices)
- [Summary](#summary)

---

## What is a Sandbox?

### Definition

A **sandbox** is an object that becomes the global object in a VM context, controlling what the executed code can access.

```javascript
const vm = require('vm');

// The sandbox defines what's available
const sandbox = {
  x: 10,
  console: console
};

// Code runs with sandbox as its global object
vm.runInNewContext('console.log(x)', sandbox);
// Output: 10

// Code cannot access things not in sandbox
vm.runInNewContext('console.log(process)', sandbox);
// Error: process is not defined
```

### Sandbox as Global Object

```javascript
const vm = require('vm');

const sandbox = {
  name: 'Alice',
  age: 30
};

// Inside the VM context:
// - 'this' refers to sandbox
// - Global variables are properties of sandbox
vm.runInNewContext(`
  console.log(this.name);     // "Alice"
  this.occupation = 'Engineer'; // Add property
`, { ...sandbox, console: console });

console.log(sandbox.occupation); // undefined (we spread sandbox)

// To see modifications, don't spread:
const mutableSandbox = { name: 'Bob', console: console };
vm.runInNewContext('this.age = 25', mutableSandbox);
console.log(mutableSandbox.age); // 25
```

### Visual: Sandbox Boundary

```
┌─────────────────────────────────────┐
│   Your Node.js Process              │
│                                     │
│   ┌─────────────────────────────┐   │
│   │   Main Context              │   │
│   │   • process                 │   │
│   │   • require                 │   │
│   │   • __dirname               │   │
│   │   • Buffer                  │   │
│   │   • All Node.js APIs        │   │
│   └─────────────────────────────┘   │
│              ↕                      │
│         Not Accessible              │
│              ↕                      │
│   ┌─────────────────────────────┐   │
│   │   VM Sandbox Context        │   │
│   │   • console (provided)      │   │
│   │   • customAPI (provided)    │   │
│   │   • data (provided)         │   │
│   │   ✗ process (not provided)  │   │
│   │   ✗ require (not provided)  │   │
│   └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Creating Basic Sandboxes

### Empty Sandbox

```javascript
const vm = require('vm');

// Minimal sandbox
const sandbox = {};

vm.runInNewContext('this.x = 5', sandbox);
console.log(sandbox.x); // 5

// Has basic JavaScript built-ins
vm.runInNewContext(`
  const arr = [1, 2, 3];
  this.result = arr.map(x => x * 2);
`, sandbox);

console.log(sandbox.result); // [2, 4, 6]
```

### Sandbox with Data

```javascript
const vm = require('vm');

// Sandbox with initial data
const sandbox = {
  input: 'hello',
  multiplier: 3
};

vm.runInNewContext(`
  this.output = input.repeat(multiplier);
`, sandbox);

console.log(sandbox.output); // "hellohellohello"
```

### Sandbox with Functions

```javascript
const vm = require('vm');

// Sandbox with utility functions
const sandbox = {
  log: (...args) => console.log('[Sandbox]', ...args),
  getData: () => ({ value: 42 }),
  processValue: (x) => x * 2
};

vm.runInNewContext(`
  const data = getData();
  const processed = processValue(data.value);
  log('Result:', processed);
`, sandbox);
// Output: [Sandbox] Result: 84
```

---

## Providing Built-in Objects

### Safe Console

```javascript
const vm = require('vm');

// Limited console (only log)
const safeConsole = {
  log: (...args) => console.log('[VM]', ...args)
  // No console.error, console.warn, etc.
};

const sandbox = {
  console: safeConsole
};

vm.runInNewContext(`
  console.log('Hello');
  // console.error('Oops'); // Would fail - not provided
`, sandbox);
```

### Buffered Console

```javascript
const vm = require('vm');

class BufferedConsole {
  constructor() {
    this.buffer = [];
  }

  log(...args) {
    this.buffer.push(args.join(' '));
  }

  getOutput() {
    return this.buffer.join('\n');
  }

  clear() {
    this.buffer = [];
  }
}

const bufConsole = new BufferedConsole();

const sandbox = {
  console: bufConsole
};

vm.runInNewContext(`
  console.log('Line 1');
  console.log('Line 2');
`, sandbox);

console.log(bufConsole.getOutput());
// Line 1
// Line 2
```

### Safe setTimeout/setInterval

```javascript
const vm = require('vm');

// Track timers for cleanup
const timers = [];

const sandbox = {
  setTimeout: (fn, delay) => {
    const id = setTimeout(fn, delay);
    timers.push(id);
    return id;
  },
  clearTimeout: (id) => {
    clearTimeout(id);
    const index = timers.indexOf(id);
    if (index > -1) timers.splice(index, 1);
  },
  console: console
};

vm.runInNewContext(`
  setTimeout(() => {
    console.log('Delayed message');
  }, 100);
`, sandbox);

// Later: cleanup all timers
function cleanup() {
  timers.forEach(id => clearTimeout(id));
  timers.length = 0;
}
```

### Limited Math

```javascript
const vm = require('vm');

// Provide only specific Math functions
const safeMath = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  max: Math.max,
  min: Math.min,
  PI: Math.PI
  // No Math.random - might be used for attacks
};

const sandbox = {
  Math: safeMath,
  console: console
};

vm.runInNewContext(`
  console.log(Math.sqrt(16)); // 4
  console.log(Math.PI);        // 3.14159...
  // console.log(Math.random()); // Error - not provided
`, sandbox);
```

### Custom Global Objects

```javascript
const vm = require('vm');

// Create custom API
const sandbox = {
  // Data access
  db: {
    query: (sql) => {
      console.log('Query:', sql);
      return [{ id: 1, name: 'Test' }];
    },
    insert: (table, data) => {
      console.log('Insert into', table, data);
      return true;
    }
  },

  // HTTP simulation
  http: {
    get: (url) => {
      console.log('GET', url);
      return { status: 200, data: 'Response' };
    }
  },

  // Utilities
  utils: {
    timestamp: () => Date.now(),
    uuid: () => Math.random().toString(36)
  },

  console: console
};

vm.runInNewContext(`
  const users = db.query('SELECT * FROM users');
  console.log('Found', users.length, 'users');

  const response = http.get('https://api.example.com');
  console.log('Response:', response.status);
`, sandbox);
```

---

## Sandbox Security Basics

### Principle of Least Privilege

**Only provide what's necessary:**

```javascript
const vm = require('vm');

// ❌ Bad - Too much access
const unsafeSandbox = {
  process: process,         // Can exit process!
  require: require,         // Can load any module!
  global: global,          // Access to everything!
  console: console,
  fs: require('fs')        // Can read/write files!
};

// ✅ Good - Minimal access
const safeSandbox = {
  console: {
    log: (...args) => console.log(...args)
  },
  data: {
    getValue: () => 'safe data'
  }
};
```

### Whitelist, Don't Blacklist

```javascript
// ❌ Bad - Trying to remove dangerous things
const sandbox = { ...global };
delete sandbox.process;
delete sandbox.require;
// What else did we forget?

// ✅ Good - Only add safe things
const sandbox = {
  console: console,
  Math: Math,
  // Only what's needed
};
```

### Avoid Object References

```javascript
const vm = require('vm');

const secret = { password: '12345' };

// ❌ Bad - Passing reference
const unsafeSandbox = {
  data: secret, // Reference!
  console: console
};

vm.runInNewContext(`
  data.password = 'hacked';
`, unsafeSandbox);

console.log(secret.password); // "hacked" - modified!

// ✅ Good - Pass copy
const safeSandbox = {
  data: JSON.parse(JSON.stringify(secret)),
  console: console
};

vm.runInNewContext(`
  data.password = 'hacked';
`, safeSandbox);

console.log(secret.password); // "12345" - safe!
```

### Protect Against Prototype Pollution

```javascript
const vm = require('vm');

const sandbox = {};

// ❌ Vulnerable to prototype pollution
vm.runInNewContext(`
  Object.prototype.polluted = true;
`, sandbox);

console.log({}.polluted); // undefined - separate context
vm.runInNewContext(`
  console.log({}.polluted);
`, { console: console }); // But new contexts affected!

// ✅ Better - Freeze prototypes in sandbox
const safeSandbox = {};
const context = vm.createContext(safeSandbox);

vm.runInContext(`
  Object.freeze(Object.prototype);
  Object.freeze(Array.prototype);
  Object.freeze(Function.prototype);
`, context);

// Now protected
try {
  vm.runInContext(`
    Object.prototype.polluted = true;
  `, context);
} catch (err) {
  console.log('Protected!');
}
```

---

## Common Sandbox Patterns

### Pattern 1: Read-Only Data

```javascript
const vm = require('vm');

function createReadOnlySandbox(data) {
  const proxy = new Proxy(data, {
    set: () => {
      throw new Error('Cannot modify read-only data');
    },
    deleteProperty: () => {
      throw new Error('Cannot delete read-only data');
    }
  });

  return {
    data: proxy,
    console: console
  };
}

const sandbox = createReadOnlySandbox({ x: 10, y: 20 });

vm.runInNewContext('console.log(data.x)', sandbox); // 10

try {
  vm.runInNewContext('data.x = 100', sandbox);
} catch (err) {
  console.log(err.message); // Cannot modify read-only data
}
```

### Pattern 2: API Rate Limiting

```javascript
const vm = require('vm');

class RateLimitedAPI {
  constructor(maxCalls = 10) {
    this.maxCalls = maxCalls;
    this.calls = 0;
  }

  getData() {
    if (this.calls >= this.maxCalls) {
      throw new Error('Rate limit exceeded');
    }
    this.calls++;
    return { value: 42 };
  }

  reset() {
    this.calls = 0;
  }
}

const api = new RateLimitedAPI(5);

const sandbox = {
  api: api,
  console: console
};

vm.runInNewContext(`
  for (let i = 0; i < 10; i++) {
    console.log(api.getData());
  }
`, sandbox);
// Works 5 times, then throws error
```

### Pattern 3: Sandboxed Module System

```javascript
const vm = require('vm');

class SandboxedModules {
  constructor() {
    this.modules = new Map();
  }

  register(name, exports) {
    this.modules.set(name, exports);
  }

  createRequire() {
    return (name) => {
      if (!this.modules.has(name)) {
        throw new Error(`Module ${name} not found`);
      }
      return this.modules.get(name);
    };
  }
}

const modules = new SandboxedModules();

// Register safe modules
modules.register('lodash', {
  map: (arr, fn) => arr.map(fn),
  filter: (arr, fn) => arr.filter(fn)
});

modules.register('moment', {
  now: () => Date.now()
});

const sandbox = {
  require: modules.createRequire(),
  console: console
};

vm.runInNewContext(`
  const _ = require('lodash');
  const moment = require('moment');

  const data = [1, 2, 3];
  const doubled = _.map(data, x => x * 2);
  console.log(doubled);

  // const fs = require('fs'); // Error: Module fs not found
`, sandbox);
```

### Pattern 4: Async Sandbox

```javascript
const vm = require('vm');

class AsyncSandbox {
  constructor() {
    this.pending = [];
  }

  createSandbox() {
    return {
      async: {
        fetch: (url) => {
          return new Promise((resolve) => {
            const promise = Promise.resolve({
              url: url,
              data: 'Response data'
            });
            this.pending.push(promise);
            resolve(promise);
          });
        }
      },
      console: console
    };
  }

  async waitForAll() {
    await Promise.all(this.pending);
    this.pending = [];
  }
}

const asyncBox = new AsyncSandbox();
const sandbox = asyncBox.createSandbox();

vm.runInNewContext(`
  async.fetch('http://example.com').then(data => {
    console.log('Received:', data);
  });
`, sandbox);

// Wait for async operations
asyncBox.waitForAll().then(() => {
  console.log('All async operations complete');
});
```

---

## Freezing and Sealing

### Freezing Objects

```javascript
const vm = require('vm');

const config = Object.freeze({
  apiKey: 'secret-key',
  timeout: 5000
});

const sandbox = {
  config: config,
  console: console
};

vm.runInNewContext(`
  console.log(config.apiKey); // Can read
  config.apiKey = 'hacked';   // Cannot modify (silently fails)
  console.log(config.apiKey); // Still "secret-key"
`, sandbox);
```

### Deep Freeze

```javascript
function deepFreeze(obj) {
  Object.freeze(obj);

  Object.values(obj).forEach(value => {
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value);
    }
  });

  return obj;
}

const vm = require('vm');

const config = deepFreeze({
  database: {
    host: 'localhost',
    credentials: {
      username: 'admin',
      password: 'secret'
    }
  }
});

const sandbox = { config, console };

vm.runInNewContext(`
  config.database.credentials.password = 'hacked';
  console.log(config.database.credentials.password);
  // Still "secret" - deep frozen!
`, sandbox);
```

### Sealing Objects

```javascript
const vm = require('vm');

const api = Object.seal({
  version: '1.0',
  endpoint: 'https://api.example.com'
});

const sandbox = { api, console };

vm.runInNewContext(`
  // Can modify existing properties
  api.version = '2.0';
  console.log(api.version); // "2.0"

  // Cannot add new properties
  api.newProp = 'test';
  console.log(api.newProp); // undefined

  // Cannot delete properties
  delete api.version;
  console.log(api.version); // Still "2.0"
`, sandbox);
```

---

## Resource Limits

### Timeout Limits

```javascript
const vm = require('vm');

const sandbox = {
  console: console
};

try {
  vm.runInNewContext(`
    while(true) {
      // Infinite loop
    }
  `, sandbox, {
    timeout: 1000 // Kill after 1 second
  });
} catch (err) {
  console.log('Script timed out:', err.message);
}
```

### Memory Limits (Indirect)

```javascript
const vm = require('vm');

// Monitor memory usage
function runWithMemoryLimit(code, sandbox, maxMemoryMB) {
  const startMem = process.memoryUsage().heapUsed;
  const maxMemory = maxMemoryMB * 1024 * 1024;

  const result = vm.runInNewContext(code, sandbox, {
    timeout: 5000
  });

  const endMem = process.memoryUsage().heapUsed;
  const used = endMem - startMem;

  if (used > maxMemory) {
    throw new Error(`Memory limit exceeded: ${Math.round(used / 1024 / 1024)}MB`);
  }

  return result;
}

try {
  runWithMemoryLimit(`
    const huge = new Array(10000000);
  `, {}, 10); // 10MB limit
} catch (err) {
  console.log(err.message);
}
```

### Call Stack Limits

```javascript
const vm = require('vm');

// Detect deep recursion
const sandbox = {
  depth: 0,
  maxDepth: 100,
  console: console
};

vm.runInNewContext(`
  function recurse() {
    depth++;
    if (depth > maxDepth) {
      throw new Error('Maximum recursion depth exceeded');
    }
    recurse();
  }

  try {
    recurse();
  } catch (err) {
    console.log(err.message);
  }
`, sandbox);
```

---

## Practical Examples

### Example 1: Expression Sandbox

```javascript
const vm = require('vm');

class ExpressionSandbox {
  constructor() {
    this.allowedVars = new Set([
      'Math', 'Number', 'String', 'Array', 'Object'
    ]);
  }

  createSandbox(variables) {
    const sandbox = {
      Math: Math,
      Number: Number,
      String: String,
      Array: Array,
      Object: Object,
      ...variables
    };

    // Freeze built-ins
    Object.freeze(sandbox.Math);
    Object.freeze(sandbox.Number);
    Object.freeze(sandbox.String);
    Object.freeze(sandbox.Array);
    Object.freeze(sandbox.Object);

    return sandbox;
  }

  evaluate(expression, variables = {}) {
    const sandbox = this.createSandbox(variables);

    return vm.runInNewContext(expression, sandbox, {
      timeout: 100,
      displayErrors: true
    });
  }
}

const evaluator = new ExpressionSandbox();

console.log(evaluator.evaluate('Math.sqrt(x)', { x: 16 }));        // 4
console.log(evaluator.evaluate('arr.length', { arr: [1, 2, 3] })); // 3
console.log(evaluator.evaluate('price * 1.1', { price: 100 }));    // 110
```

### Example 2: Template Sandbox

```javascript
const vm = require('vm');

class TemplateSandbox {
  constructor() {
    this.helpers = {
      uppercase: (str) => str.toUpperCase(),
      lowercase: (str) => str.toLowerCase(),
      capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),
      formatDate: (date) => new Date(date).toLocaleDateString(),
      formatCurrency: (amount) => `$${amount.toFixed(2)}`
    };
  }

  createSandbox(data) {
    return {
      ...data,
      ...this.helpers,
      console: undefined,  // No console access
      process: undefined,  // No process access
      require: undefined   // No require access
    };
  }

  render(template, data) {
    const sandbox = this.createSandbox(data);
    const code = `\`${template}\``;

    return vm.runInNewContext(code, sandbox, {
      timeout: 500
    });
  }
}

const renderer = new TemplateSandbox();

const result = renderer.render(
  'Hello ${uppercase(name)}! Total: ${formatCurrency(total)}',
  {
    name: 'alice',
    total: 49.99
  }
);

console.log(result);
// "Hello ALICE! Total: $49.99"
```

### Example 3: Plugin Sandbox

```javascript
const vm = require('vm');
const EventEmitter = require('events');

class PluginSandbox extends EventEmitter {
  constructor(pluginName) {
    super();
    this.pluginName = pluginName;
    this.storage = {};
  }

  createSandbox() {
    return {
      plugin: {
        name: this.pluginName,

        // Storage API
        set: (key, value) => {
          this.storage[key] = value;
        },
        get: (key) => {
          return this.storage[key];
        },

        // Event API
        on: (event, handler) => {
          this.on(event, handler);
        },
        emit: (event, data) => {
          this.emit(event, data);
        },

        // Logging
        log: (...args) => {
          console.log(`[${this.pluginName}]`, ...args);
        }
      },

      // Limited console
      console: {
        log: (...args) => console.log(`[${this.pluginName}]`, ...args)
      }
    };
  }

  load(code) {
    const sandbox = this.createSandbox();

    try {
      vm.runInNewContext(code, sandbox, {
        filename: `${this.pluginName}.js`,
        timeout: 5000
      });

      console.log(`Plugin "${this.pluginName}" loaded`);
      return true;
    } catch (err) {
      console.error(`Plugin "${this.pluginName}" error:`, err.message);
      return false;
    }
  }

  trigger(event, data) {
    this.emit(event, data);
  }
}

// Usage
const plugin = new PluginSandbox('MyPlugin');

plugin.load(`
  plugin.log('Plugin initializing...');

  plugin.on('user-login', (user) => {
    plugin.log('User logged in:', user.name);
    plugin.set('lastLogin', Date.now());
  });

  plugin.on('get-stats', () => {
    const lastLogin = plugin.get('lastLogin');
    plugin.emit('stats', { lastLogin });
  });
`);

// Trigger events
plugin.trigger('user-login', { name: 'Alice' });

plugin.on('stats', (stats) => {
  console.log('Plugin stats:', stats);
});
plugin.trigger('get-stats');
```

---

## Security Pitfalls

### Pitfall 1: Constructor Access

```javascript
// ⚠️ Can escape sandbox via constructor!
const vm = require('vm');

const sandbox = {};

try {
  vm.runInNewContext(`
    this.constructor.constructor('return process')().exit()
  `, sandbox);
  // This WILL exit your process!
} catch (err) {
  // May not catch in time
}

// 🛡️ Mitigation: Freeze constructor
const safeSandbox = {};
const context = vm.createContext(safeSandbox);
vm.runInContext(`
  Object.freeze(Object.prototype.constructor);
`, context);
```

### Pitfall 2: Shared References

```javascript
const vm = require('vm');

const shared = { value: 'original' };

// ⚠️ Modifying shared object
const sandbox = { data: shared };
vm.runInNewContext('data.value = "modified"', sandbox);
console.log(shared.value); // "modified" - mutated!

// 🛡️ Use copies
const safeSandbox = {
  data: JSON.parse(JSON.stringify(shared))
};
```

### Pitfall 3: Function Closures

```javascript
const vm = require('vm');

let secret = 'password';

// ⚠️ Function closure can access outer scope
const sandbox = {
  getSecret: function() {
    return secret; // Closure!
  }
};

vm.runInNewContext('console.log(getSecret())', { ...sandbox, console });
// Prints "password"

// 🛡️ Don't provide functions with closures
// Or provide bound functions with controlled scope
```

---

## Best Practices

### 1. Principle of Least Privilege

```javascript
// ✅ Only provide what's needed
const sandbox = {
  data: userSafeData,
  log: console.log
  // Nothing else
};
```

### 2. Use Proxies for Control

```javascript
const sandbox = {
  api: new Proxy(realAPI, {
    get(target, prop) {
      if (allowedMethods.includes(prop)) {
        return target[prop];
      }
      throw new Error(`Access denied: ${prop}`);
    }
  })
};
```

### 3. Deep Copy Data

```javascript
const sandbox = {
  data: JSON.parse(JSON.stringify(originalData))
};
```

### 4. Freeze Prototypes

```javascript
const context = vm.createContext(sandbox);
vm.runInContext(`
  Object.freeze(Object.prototype);
  Object.freeze(Array.prototype);
`, context);
```

### 5. Always Set Timeouts

```javascript
vm.runInNewContext(code, sandbox, {
  timeout: 1000
});
```

---

## Summary

### Key Takeaways

1. **Sandbox** = Object that becomes global in VM context
2. **Provide minimally** = Only include necessary APIs
3. **Use copies** = Don't share object references
4. **Freeze objects** = Prevent modification
5. **Set timeouts** = Prevent infinite loops
6. **VM is not a security boundary** = Can be escaped

### Sandbox Creation Checklist

- [ ] Start with empty object
- [ ] Add only required APIs
- [ ] Deep copy all data
- [ ] Freeze sensitive objects
- [ ] Validate all inputs
- [ ] Set execution timeout
- [ ] Handle errors gracefully

### Quick Reference

```javascript
const vm = require('vm');

// Create sandbox
const sandbox = {
  // Data (copied)
  data: JSON.parse(JSON.stringify(original)),

  // Safe APIs
  console: { log: console.log },
  Math: Math,

  // Custom APIs
  api: {
    getData: () => ({ value: 42 })
  }
};

// Execute with timeout
vm.runInNewContext(code, sandbox, {
  timeout: 1000,
  displayErrors: true
});
```

### Next Steps

- [Error Handling Guide](./05-error-handling.md) - Handle errors in VM execution

---

Ready to learn about error handling? Continue to the [Error Handling Guide](./05-error-handling.md)!
