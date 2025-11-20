# Contexts and Scope in the VM Module

## Introduction

Understanding contexts and scope is fundamental to mastering the VM module. While scope is a JavaScript concept you're already familiar with, contexts are a V8-specific concept that enables code isolation in Node.js. This guide explains how they work, how they differ, and how to use them effectively.

### Why This Matters

The power of the VM module lies in its ability to create isolated execution environments. To use this power effectively, you need to understand what contexts are, how they differ from scope, and how isolation actually works.

> **Key Insight:** Scope determines what variables your code can access. Context determines what global object and built-ins your code uses. VM lets you control both.

---

## Table of Contents

- [Understanding JavaScript Scope](#understanding-javascript-scope)
- [Understanding V8 Contexts](#understanding-v8-contexts)
- [Scope vs Context](#scope-vs-context)
- [Execution Contexts Explained](#execution-contexts-explained)
- [Context Isolation Principles](#context-isolation-principles)
- [Creating and Managing Contexts](#creating-and-managing-contexts)
- [Context Sharing and Communication](#context-sharing-and-communication)
- [Common Patterns](#common-patterns)
- [Practical Examples](#practical-examples)
- [Best Practices](#best-practices)
- [Summary](#summary)

---

## Understanding JavaScript Scope

### What is Scope?

**Scope** determines what variables are accessible from where in your code:

```javascript
// Global scope
const global = 'I am global';

function outer() {
  // Outer function scope
  const outerVar = 'I am in outer';

  function inner() {
    // Inner function scope
    const innerVar = 'I am in inner';

    console.log(global);    // ✅ Accessible
    console.log(outerVar);  // ✅ Accessible
    console.log(innerVar);  // ✅ Accessible
  }

  inner();
  // console.log(innerVar); // ❌ Not accessible
}

outer();
```

### Scope Chain

JavaScript uses **lexical scoping** - inner scopes can access outer scopes:

```javascript
const level1 = 'L1';

function a() {
  const level2 = 'L2';

  function b() {
    const level3 = 'L3';

    console.log(level1); // Looks up the chain
    console.log(level2); // Looks up the chain
    console.log(level3); // Found in current scope
  }

  b();
}

a();
```

### Visual: Scope Chain

```
┌─────────────────────────────┐
│     Global Scope            │
│  const global = 'value'     │
│                             │
│  ┌───────────────────────┐  │
│  │  Function Scope       │  │
│  │  const local = 'val'  │  │
│  │                       │  │
│  │  ┌─────────────────┐  │  │
│  │  │  Block Scope    │  │  │
│  │  │  const x = 10   │  │  │
│  │  │     ↓           │  │  │
│  │  │  Can access:    │  │  │
│  │  │  - x (block)    │  │  │
│  │  │  - local (func) │  │  │
│  │  │  - global       │  │  │
│  │  └─────────────────┘  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

## Understanding V8 Contexts

### What is a Context?

A **context** in V8 is an isolated execution environment with:

1. **Its own global object**
2. **Its own built-in objects** (Object, Array, String, etc.)
3. **Its own prototype chain**

```javascript
const vm = require('vm');

// Create a new context
const context = vm.createContext({
  myVar: 'Hello'
});

// This context has its own global object
vm.runInContext('console.log(this)', context);
// Prints: { myVar: 'Hello' }

// Different from your main context
console.log(this); // Different global object
```

### Multiple Contexts

Each context is completely separate:

```javascript
const vm = require('vm');

// Context 1
const context1 = vm.createContext({ name: 'Context 1' });
vm.runInContext('this.value = 100', context1);

// Context 2
const context2 = vm.createContext({ name: 'Context 2' });
vm.runInContext('this.value = 200', context2);

console.log(context1.value); // 100
console.log(context2.value); // 200
// Completely isolated from each other
```

### Built-in Objects per Context

Each context gets its own built-ins:

```javascript
const vm = require('vm');

const context1 = vm.createContext({});
const context2 = vm.createContext({});

vm.runInContext('this.MyArray = Array', context1);
vm.runInContext('this.MyArray = Array', context2);

// Different Array constructors!
console.log(context1.MyArray === context2.MyArray); // false
console.log(context1.MyArray === Array);            // false
```

### Visual: Multiple Contexts

```
V8 Engine
├─ Main Context
│  ├─ global object
│  ├─ Object.prototype
│  ├─ Array.prototype
│  └─ Your application code
│
├─ VM Context 1
│  ├─ sandbox object (as global)
│  ├─ Object.prototype (separate)
│  ├─ Array.prototype (separate)
│  └─ User code A
│
└─ VM Context 2
   ├─ sandbox object (as global)
   ├─ Object.prototype (separate)
   ├─ Array.prototype (separate)
   └─ User code B
```

---

## Scope vs Context

### Key Differences

| Aspect | Scope | Context |
|--------|-------|---------|
| **What** | Variable accessibility | Execution environment |
| **Determined by** | Code structure | VM API calls |
| **Controls** | Which variables you can see | Which global object you use |
| **Created by** | Functions, blocks | `vm.createContext()` |
| **Isolation level** | Limited by closure | Full (separate globals) |

### Example: Scope without Context Change

```javascript
// Same context, different scopes
function outer() {
  const x = 10;

  function inner() {
    const y = 20;
    console.log(x + y); // Can access x (scope chain)
  }

  inner();
}

outer();
// All running in the same context (global object)
```

### Example: Context without Scope Change

```javascript
const vm = require('vm');

// Same code structure, different contexts
const code = 'x + 10';

const context1 = vm.createContext({ x: 5 });
const context2 = vm.createContext({ x: 15 });

console.log(vm.runInContext(code, context1)); // 15
console.log(vm.runInContext(code, context2)); // 25

// Same scope (flat code), different contexts (different x values)
```

### Example: Both Scope and Context

```javascript
const vm = require('vm');

// Outer scope in main context
const outerValue = 'main';

const context = vm.createContext({
  // Context-specific value
  contextValue: 'sandbox',

  // Function that creates new scope in VM context
  execute: function(param) {
    // New scope within VM context
    const localValue = 'local';
    return `${this.contextValue}-${localValue}-${param}`;
  }
});

const result = vm.runInContext(
  'execute("test")',
  context
);

console.log(result); // "sandbox-local-test"
// console.log(contextValue); // Error - different context
// console.log(localValue);   // Error - different scope
console.log(outerValue);     // "main" - accessible in main context
```

---

## Execution Contexts Explained

### Three Types of Execution

The VM module provides three ways to execute code, each with different context behavior:

#### 1. runInThisContext

Runs code in the current V8 context but **not** in the current scope:

```javascript
const vm = require('vm');

const localVar = 'I am local';
global.globalVar = 'I am global';

const code = `
  console.log(typeof localVar);  // "undefined" - no scope access
  console.log(globalVar);        // "I am global" - same context
  var newVar = 'I am new';       // Creates global var
`;

vm.runInThisContext(code);

console.log(global.newVar); // "I am new"
```

**Use case:** Like `eval()` but without scope access - safer but same global object.

#### 2. runInNewContext

Creates a brand new context for each execution:

```javascript
const vm = require('vm');

const localVar = 'I am local';
global.globalVar = 'I am global';

const sandbox = {
  console: console
};

const code = `
  console.log(typeof localVar);   // "undefined" - different scope
  console.log(typeof globalVar);  // "undefined" - different context
  var newVar = 'I am new';
`;

vm.runInNewContext(code, sandbox);

console.log(sandbox.newVar); // "I am new" - added to sandbox
console.log(global.newVar);  // undefined - not in main context
```

**Use case:** Maximum isolation, one-off executions.

#### 3. runInContext

Runs code in a pre-created, reusable context:

```javascript
const vm = require('vm');

// Create context once
const context = vm.createContext({
  counter: 0,
  console: console
});

// Use multiple times
vm.runInContext('counter++', context);
vm.runInContext('counter++', context);
vm.runInContext('console.log(counter)', context); // 2

// State persists in context
```

**Use case:** Repeated executions with persistent state, better performance.

### Comparison Table

```javascript
const vm = require('vm');

const code = 'var x = 10; typeof global';

// Main context
global.x = 5;

// 1. runInThisContext
console.log(vm.runInThisContext(code)); // "object"
console.log(global.x); // 10 - modified global

// 2. runInNewContext
const sandbox1 = {};
console.log(vm.runInNewContext(code, sandbox1)); // "undefined"
console.log(sandbox1.x); // 10 - in sandbox

// 3. runInContext
const context = vm.createContext({});
console.log(vm.runInContext(code, context)); // "undefined"
console.log(context.x); // 10 - in context
```

---

## Context Isolation Principles

### What Gets Isolated

✅ **Isolated between contexts:**
```javascript
const vm = require('vm');

const context1 = vm.createContext({ value: 10 });
const context2 = vm.createContext({ value: 20 });

vm.runInContext('value = 100', context1);
console.log(context1.value); // 100
console.log(context2.value); // 20 - unaffected
```

✅ **Separate global objects:**
```javascript
const context = vm.createContext({});

vm.runInContext('this.newProp = "test"', context);
console.log(context.newProp);  // "test"
console.log(global.newProp);   // undefined
```

✅ **Separate built-in prototypes:**
```javascript
const context = vm.createContext({});

vm.runInContext('Object.prototype.custom = true', context);

console.log({}.custom);        // undefined - main context unaffected
vm.runInContext('console.log({}.custom)', context); // true
```

### What Doesn't Get Isolated

❌ **Shared memory:**
```javascript
const vm = require('vm');

// Objects are passed by reference!
const shared = { value: 10 };

const context = vm.createContext({
  shared: shared
});

vm.runInContext('shared.value = 100', context);
console.log(shared.value); // 100 - modified in both places!
```

❌ **Function closures:**
```javascript
const vm = require('vm');

let external = 'secret';

const context = vm.createContext({
  getExternal: function() {
    return external; // Closure still works!
  }
});

vm.runInContext('console.log(getExternal())', context); // "secret"
```

❌ **Process-wide state:**
```javascript
const vm = require('vm');

const context = vm.createContext({
  process: process // Same process object!
});

vm.runInContext('process.exit(0)', context); // Will exit entire process!
```

### Isolation Boundaries

```
┌─────────────────────────────────────┐
│  Process Memory (Shared)            │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Main Context                 │  │
│  │  • global object              │  │
│  │  • Built-in prototypes        │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  VM Context 1                 │  │
│  │  • separate global            │  │
│  │  • separate prototypes        │  │
│  │  • But: shared heap memory    │  │
│  └───────────────────────────────┘  │
│                                     │
│  Objects/Arrays: SHARED REFERENCES  │
└─────────────────────────────────────┘
```

---

## Creating and Managing Contexts

### Basic Context Creation

```javascript
const vm = require('vm');

// Empty context
const empty = vm.createContext();

// Context with initial properties
const initialized = vm.createContext({
  console: console,
  data: { value: 10 }
});

// Context from existing object
const obj = { x: 5 };
const contextified = vm.createContext(obj);
// obj is now contextified
```

### Context Reuse

```javascript
const vm = require('vm');

// Create once
const context = vm.createContext({
  counter: 0,
  console: console
});

// Reuse many times (efficient!)
for (let i = 0; i < 100; i++) {
  vm.runInContext('counter++', context);
}

console.log(context.counter); // 100
```

### Checking if Object is Contextified

```javascript
const vm = require('vm');

const obj = {};
console.log(vm.isContext(obj)); // false

vm.createContext(obj);
console.log(vm.isContext(obj)); // true
```

### Context Cleanup

```javascript
const vm = require('vm');

function createTemporaryContext() {
  const context = vm.createContext({
    data: new Array(1000000) // Large data
  });

  // Use context...
  vm.runInContext('data.length', context);

  // Context will be GC'd when no longer referenced
}

createTemporaryContext();
// Context is eligible for garbage collection
```

---

## Context Sharing and Communication

### Passing Data Between Contexts

#### Method 1: Via Sandbox

```javascript
const vm = require('vm');

const sandbox = {
  input: 'Hello',
  output: null
};

vm.runInNewContext('output = input.toUpperCase()', sandbox);
console.log(sandbox.output); // "HELLO"
```

#### Method 2: Via Functions

```javascript
const vm = require('vm');

const results = [];

const context = vm.createContext({
  sendResult: (data) => {
    results.push(data); // Closure over main context
  }
});

vm.runInContext('sendResult("test")', context);
console.log(results); // ["test"]
```

#### Method 3: Via Shared Objects

```javascript
const vm = require('vm');

const shared = {
  config: { timeout: 1000 },
  data: []
};

const context = vm.createContext({
  shared: shared
});

vm.runInContext('shared.data.push("item")', context);
console.log(shared.data); // ["item"]
```

### Communication Patterns

#### Event-based Communication

```javascript
const vm = require('vm');
const EventEmitter = require('events');

const events = new EventEmitter();

const context = vm.createContext({
  emit: (event, data) => events.emit(event, data),
  on: (event, handler) => events.on(event, handler)
});

// Main context listens
events.on('result', (data) => {
  console.log('Received:', data);
});

// VM context emits
vm.runInContext('emit("result", "Hello from VM")', context);
```

#### Message Passing

```javascript
const vm = require('vm');

class VMBridge {
  constructor() {
    this.messageQueue = [];
  }

  send(message) {
    this.messageQueue.push(message);
  }

  receive() {
    return this.messageQueue.shift();
  }
}

const bridge = new VMBridge();

const context = vm.createContext({
  postMessage: (msg) => bridge.send(msg),
  getMessage: () => bridge.receive()
});

vm.runInContext('postMessage("Hello")', context);
console.log(bridge.receive()); // "Hello"
```

---

## Common Patterns

### Pattern 1: Stateful Context

```javascript
const vm = require('vm');

class StatefulVM {
  constructor() {
    this.context = vm.createContext({
      state: {},
      console: console
    });
  }

  execute(code) {
    return vm.runInContext(code, this.context);
  }

  getState() {
    return this.context.state;
  }

  reset() {
    this.context.state = {};
  }
}

const svm = new StatefulVM();
svm.execute('state.count = 5');
svm.execute('state.count++');
console.log(svm.getState()); // { count: 6 }
```

### Pattern 2: Context Pool

```javascript
const vm = require('vm');

class ContextPool {
  constructor(size = 5) {
    this.pool = [];
    for (let i = 0; i < size; i++) {
      this.pool.push(this.createContext());
    }
    this.available = [...this.pool];
  }

  createContext() {
    return vm.createContext({
      console: console
    });
  }

  acquire() {
    return this.available.pop() || this.createContext();
  }

  release(context) {
    // Reset context
    vm.runInContext('for (let key in this) delete this[key]', context);
    vm.runInContext('console = arguments[0]', context, {
      arguments: [console]
    });
    this.available.push(context);
  }
}

const pool = new ContextPool();
const ctx = pool.acquire();
// use context...
pool.release(ctx);
```

### Pattern 3: Context with API

```javascript
const vm = require('vm');

function createAPIContext(api) {
  return vm.createContext({
    ...api,
    // Prevent access to context object itself
    global: undefined,
    this: undefined
  });
}

const context = createAPIContext({
  log: console.log,
  getData: () => ({ value: 42 }),
  processData: (data) => data.toUpperCase()
});

vm.runInContext(`
  const data = getData();
  log('Data:', data);
`, context);
```

---

## Practical Examples

### Example 1: Multi-Tenant Execution

```javascript
const vm = require('vm');

class TenantVM {
  constructor(tenantId) {
    this.tenantId = tenantId;
    this.context = vm.createContext({
      tenantId: tenantId,
      storage: {},
      console: console,
      save: (key, value) => {
        this.storage[tenantId] = this.storage[tenantId] || {};
        this.storage[tenantId][key] = value;
      },
      load: (key) => {
        return this.storage[tenantId]?.[key];
      }
    });
    this.storage = {};
  }

  execute(code) {
    return vm.runInContext(code, this.context, {
      timeout: 1000
    });
  }
}

const tenant1 = new TenantVM('tenant-1');
const tenant2 = new TenantVM('tenant-2');

tenant1.execute('save("name", "Alice")');
tenant2.execute('save("name", "Bob")');

// Isolated storage
console.log(tenant1.storage); // { 'tenant-1': { name: 'Alice' } }
console.log(tenant2.storage); // { 'tenant-2': { name: 'Bob' } }
```

### Example 2: Progressive Context Building

```javascript
const vm = require('vm');

class ProgressiveContext {
  constructor() {
    this.context = vm.createContext({});
  }

  addAPI(name, api) {
    this.context[name] = api;
  }

  execute(code) {
    return vm.runInContext(code, this.context);
  }
}

const ctx = new ProgressiveContext();

// Add APIs progressively
ctx.addAPI('console', console);
ctx.execute('console.log("Phase 1")');

ctx.addAPI('fs', {
  readFile: (name) => `Content of ${name}`
});
ctx.execute('console.log(fs.readFile("test.txt"))');

ctx.addAPI('http', {
  get: (url) => `Fetching ${url}`
});
ctx.execute('console.log(http.get("http://example.com"))');
```

### Example 3: Context Snapshot and Restore

```javascript
const vm = require('vm');

class SnapshottableContext {
  constructor(initial = {}) {
    this.snapshots = [];
    this.context = vm.createContext(initial);
  }

  execute(code) {
    return vm.runInContext(code, this.context);
  }

  snapshot() {
    this.snapshots.push(JSON.stringify(this.context));
  }

  restore() {
    if (this.snapshots.length === 0) return;
    const snapshot = this.snapshots.pop();
    const data = JSON.parse(snapshot);
    this.context = vm.createContext(data);
  }
}

const ctx = new SnapshottableContext({ x: 0 });

ctx.execute('x = 10');
console.log(ctx.context.x); // 10

ctx.snapshot(); // Save state

ctx.execute('x = 100');
console.log(ctx.context.x); // 100

ctx.restore(); // Restore state
console.log(ctx.context.x); // 10
```

---

## Best Practices

### 1. Minimize Shared Objects

```javascript
// ❌ Bad - Sharing complex objects
const context = vm.createContext({
  process: process, // Dangerous!
  global: global    // Defeats isolation!
});

// ✅ Good - Provide minimal, safe API
const context = vm.createContext({
  log: (...args) => console.log(...args),
  getTime: () => Date.now()
});
```

### 2. Reuse Contexts for Performance

```javascript
// ❌ Bad - Creating new context each time
for (let i = 0; i < 1000; i++) {
  vm.runInNewContext(code, sandbox); // Expensive!
}

// ✅ Good - Reuse context
const context = vm.createContext(sandbox);
for (let i = 0; i < 1000; i++) {
  vm.runInContext(code, context); // Efficient!
}
```

### 3. Freeze Dangerous Prototypes

```javascript
const vm = require('vm');

const sandbox = {};
const context = vm.createContext(sandbox);

// Freeze prototypes to prevent pollution
vm.runInContext(`
  Object.freeze(Object.prototype);
  Object.freeze(Array.prototype);
  Object.freeze(Function.prototype);
`, context);
```

### 4. Provide Deep Copies, Not References

```javascript
// ❌ Bad - Passing by reference
const data = { secret: 'password' };
const context = vm.createContext({ data });
vm.runInContext('data.secret = "hacked"', context);
console.log(data.secret); // "hacked"

// ✅ Good - Pass copy
const context = vm.createContext({
  data: JSON.parse(JSON.stringify(data))
});
vm.runInContext('data.secret = "hacked"', context);
console.log(data.secret); // "password" - safe
```

---

## Summary

### Key Takeaways

1. **Scope** = variable accessibility | **Context** = execution environment
2. **Contexts** provide separate global objects and built-ins
3. **Three execution modes**: `runInThisContext`, `runInNewContext`, `runInContext`
4. **Isolation** applies to globals/prototypes, **not** to shared object references
5. **Reuse contexts** for better performance
6. **Minimize shared state** between main context and VM contexts

### Mental Model

```
Scope (JavaScript Concept)
├─ Determined by code structure
├─ Controls variable access
└─ Same in all contexts

Context (V8 Concept)
├─ Created by VM API
├─ Provides isolated global object
├─ Each has own built-ins
└─ Multiple can exist simultaneously
```

### Quick Reference

```javascript
const vm = require('vm');

// Create context
const ctx = vm.createContext({ x: 10 });

// Check if contextified
vm.isContext(ctx); // true

// Execute in context
vm.runInContext('x++', ctx);

// Context types
vm.runInThisContext(code);     // Same context, no scope
vm.runInNewContext(code, {});  // New context each time
vm.runInContext(code, ctx);    // Reusable context
```

### Next Steps

- [Script Compilation Guide](./03-script-compilation.md) - Learn to compile and reuse code
- [Sandbox Creation Guide](./04-sandbox-creation.md) - Build secure sandboxes
- [Error Handling Guide](./05-error-handling.md) - Handle VM errors effectively

---

Ready to learn about compiling scripts? Continue to the [Script Compilation Guide](./03-script-compilation.md)!
