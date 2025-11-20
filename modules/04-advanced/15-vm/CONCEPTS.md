# VM Module - Core Concepts

## Table of Contents

1. [What is the VM Module?](#what-is-the-vm-module)
2. [Execution Contexts](#execution-contexts)
3. [Script Compilation and Execution](#script-compilation-and-execution)
4. [Sandboxing and Isolation](#sandboxing-and-isolation)
5. [Security Considerations](#security-considerations)
6. [Memory and Performance](#memory-and-performance)
7. [Mental Models](#mental-models)
8. [Summary](#summary)

---

## What is the VM Module?

### Definition

The **VM (Virtual Machine) module** provides APIs for compiling and running code within V8 Virtual Machine contexts. It enables execution of JavaScript code in isolated environments separate from the current execution context.

### Real-World Analogy

Think of VM contexts like **hotel rooms**:

- **Main Context**: The hotel lobby (global scope) - everyone can access it
- **VM Context**: Individual hotel rooms - private, isolated spaces
- **Script**: A set of instructions that can be performed in any room
- **Sandbox**: The amenities available in each room (some rooms might have more than others)

Just as hotel guests can use their rooms without affecting other guests, VM contexts allow code to run in isolation without affecting the main application.

### Key Characteristics

1. **Isolated Execution**: Code runs in separate contexts with their own global objects
2. **Compiled Scripts**: Code can be compiled once and executed multiple times
3. **Controlled Environment**: You control what's available in each context
4. **Performance**: Reusing compiled scripts improves performance
5. **Limited Security**: Provides isolation but not complete security boundaries

---

## Execution Contexts

### What is an Execution Context?

An **execution context** is an isolated environment with its own:
- Global object
- Built-in objects (Object, Array, Function, etc.)
- Variables and functions
- Scope chain

### Types of Execution

The VM module provides several ways to execute code:

#### 1. runInThisContext()

Executes code in the current V8 context but **not** in the current scope:

```javascript
const vm = require('vm');

// In current scope
var x = 10;

// runInThisContext: can access V8 globals but not local scope
const result = vm.runInThisContext('var y = x + 5; y');
// Error: x is not defined

console.log(global.y); // undefined (y is not added to global)
```

**Use when**: You want V8 context isolation but need access to built-ins

#### 2. runInNewContext()

Creates a new context, executes code, and destroys context:

```javascript
const vm = require('vm');

const result = vm.runInNewContext('x = 42; x * 2');
console.log(result); // 84
console.log(global.x); // undefined
```

**Use when**: You need quick, one-off isolated execution

#### 3. createContext() + runInContext()

Creates a reusable context for multiple executions:

```javascript
const vm = require('vm');

const sandbox = { x: 10 };
vm.createContext(sandbox); // Make sandbox a context

vm.runInContext('y = x * 2', sandbox);
console.log(sandbox.y); // 20

vm.runInContext('z = x + y', sandbox);
console.log(sandbox.z); // 30
```

**Use when**: You need persistent state across multiple executions

### Context Visualization

```
┌─────────────────────────────────────────────────────────┐
│                    Main Context                         │
│  ┌──────────────────────────────────────┐              │
│  │  Global Scope                        │              │
│  │  - global                            │              │
│  │  - process                           │              │
│  │  - require                           │              │
│  │  - Buffer                            │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    VM Context 1                         │
│  ┌──────────────────────────────────────┐              │
│  │  Sandbox Global                      │              │
│  │  - x: 10                             │              │
│  │  - y: 20                             │              │
│  │  - customFunction: [Function]        │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    VM Context 2                         │
│  ┌──────────────────────────────────────┐              │
│  │  Sandbox Global                      │              │
│  │  - data: {...}                       │              │
│  │  - allowed: ['module1', 'module2']   │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Scope vs Context

**Scope** determines variable accessibility:
```javascript
function outer() {
  let x = 10;
  function inner() {
    console.log(x); // Can access x (scope chain)
  }
}
```

**Context** determines the global environment:
```javascript
const vm = require('vm');

let x = 10;
vm.runInNewContext('console.log(x)'); // Error: x not in context
vm.runInNewContext('console.log(x)', { x: 10 }); // OK: x in sandbox
```

---

## Script Compilation and Execution

### The Script Class

The `vm.Script` class represents a compiled script that can be executed multiple times:

```javascript
const vm = require('vm');

// Compile once
const script = new vm.Script(`
  result = Math.pow(base, exponent);
`);

// Execute many times with different contexts
const context1 = { base: 2, exponent: 3 };
vm.createContext(context1);
script.runInContext(context1);
console.log(context1.result); // 8

const context2 = { base: 5, exponent: 2 };
vm.createContext(context2);
script.runInContext(context2);
console.log(context2.result); // 25
```

### Compilation Process

```
Source Code
    │
    ▼
┌─────────────────┐
│   Parsing       │  ← Syntax checking
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   AST           │  ← Abstract Syntax Tree
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Bytecode      │  ← V8 bytecode
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Optimized     │  ← JIT compilation
│   Machine Code  │
└─────────────────┘
```

### Script Options

```javascript
const vm = require('vm');

const script = new vm.Script('result = x * 2', {
  filename: 'my-script.js',        // For error messages
  lineOffset: 10,                  // Line number offset
  columnOffset: 5,                 // Column offset
  displayErrors: true,             // Show errors clearly
  timeout: 1000,                   // Execution timeout (ms)
  cachedData: undefined,           // Cached compilation data
  produceCachedData: false,        // Whether to produce cache
});
```

### Execution Options

```javascript
const vm = require('vm');

const sandbox = { x: 10 };
vm.createContext(sandbox);

const result = vm.runInContext('x * 2', sandbox, {
  filename: 'inline-code.js',
  timeout: 100,                    // Max execution time
  displayErrors: true,             // Display errors
  breakOnSigint: true,             // Terminate on SIGINT
});
```

---

## Sandboxing and Isolation

### Creating a Sandbox

A sandbox is an object that becomes the global object in the context:

```javascript
const vm = require('vm');

// Basic sandbox
const sandbox = {
  animal: 'cat',
  count: 2
};

vm.createContext(sandbox);
vm.runInContext('result = animal + "s: " + count', sandbox);
console.log(sandbox.result); // "cats: 2"
```

### Providing Safe Built-ins

Control what's available in the sandbox:

```javascript
const vm = require('vm');

// Minimal sandbox
const sandbox = {
  // Provide safe built-ins
  console: console,
  Math: Math,
  Date: Date,
  JSON: JSON,

  // Custom safe functions
  safeLog: (msg) => console.log('[Sandboxed]:', msg),

  // Data for the script
  data: { value: 42 }
};

vm.createContext(sandbox);

const code = `
  safeLog("Starting computation");
  const result = Math.sqrt(data.value);
  safeLog("Result: " + result);
  result;
`;

const result = vm.runInContext(code, sandbox);
console.log('Final result:', result); // 6.48...
```

### Removing Dangerous Globals

```javascript
const vm = require('vm');

// Create sandbox WITHOUT dangerous globals
const sandbox = {
  // Include safe items
  console: console,
  Math: Math,

  // Explicitly set dangerous ones to undefined
  setTimeout: undefined,
  setInterval: undefined,
  setImmediate: undefined,
  require: undefined,
  process: undefined,
  global: undefined,
};

vm.createContext(sandbox);

try {
  vm.runInContext('require("fs")', sandbox);
} catch (err) {
  console.log('Prevented:', err.message); // require is not defined
}
```

### Context Isolation Levels

```
┌─────────────────────────────────────────────────────┐
│  Level 1: runInThisContext()                        │
│  - Same V8 context                                  │
│  - No scope access                                  │
│  - Shares built-in objects                          │
│  Isolation: ⭐ Low                                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Level 2: runInNewContext() / runInContext()        │
│  - New V8 context                                   │
│  - Separate global object                           │
│  - Separate built-in objects                        │
│  Isolation: ⭐⭐ Medium                               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Level 3: Worker Threads + VM                       │
│  - Separate V8 isolate                              │
│  - Separate event loop                              │
│  - Separate memory space                            │
│  Isolation: ⭐⭐⭐ High                                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Level 4: OS Process + VM                           │
│  - Separate OS process                              │
│  - Complete memory isolation                        │
│  - System-level isolation                           │
│  Isolation: ⭐⭐⭐⭐ Maximum                            │
└─────────────────────────────────────────────────────┘
```

---

## Security Considerations

### VM is NOT a Security Sandbox

**Critical**: The VM module alone does not provide adequate security for running untrusted code.

### Why VM Can Be Escaped

```javascript
const vm = require('vm');

// UNSAFE - Can be escaped!
const sandbox = {};
vm.createContext(sandbox);

// Escape via constructor chain
const code = `
  const FunctionConstructor = this.constructor.constructor;
  const process = FunctionConstructor('return process')();
  process.exit(); // Can access host process!
`;

// vm.runInContext(code, sandbox); // Don't run this!
```

### Common Escape Techniques

#### 1. Constructor Chain Escape
```javascript
// Access Function constructor
this.constructor.constructor('return process')();
```

#### 2. Prototype Pollution
```javascript
// Modify shared prototypes
Object.prototype.hacked = true;
```

#### 3. Shared Object References
```javascript
// Mutate shared objects
const sandbox = { shared: [] };
vm.runInContext('shared.push("bad")', sandbox);
```

### Defense Strategies

#### 1. Use Object.create(null)

```javascript
const vm = require('vm');

// No prototype chain
const sandbox = Object.create(null);
sandbox.console = console;
sandbox.data = { value: 42 };

vm.createContext(sandbox);
```

#### 2. Freeze Built-ins

```javascript
const vm = require('vm');

const sandbox = {
  Object: Object.freeze(Object),
  Array: Object.freeze(Array),
  Function: Object.freeze(Function),
};

vm.createContext(sandbox);
```

#### 3. Use Proxies for Access Control

```javascript
const vm = require('vm');

const data = { secret: 'hidden', public: 'visible' };

const sandbox = {
  data: new Proxy(data, {
    get(target, prop) {
      if (prop === 'secret') {
        throw new Error('Access denied');
      }
      return target[prop];
    }
  })
};

vm.createContext(sandbox);
vm.runInContext('console.log(data.public)', sandbox); // OK
// vm.runInContext('data.secret', sandbox); // Error
```

#### 4. Combine with Worker Threads

```javascript
const { Worker } = require('worker_threads');
const vm = require('vm');

// Run VM code in a worker for true isolation
const worker = new Worker(`
  const vm = require('vm');
  const { parentPort } = require('worker_threads');

  parentPort.on('message', (code) => {
    try {
      const result = vm.runInNewContext(code, {}, { timeout: 100 });
      parentPort.postMessage({ success: true, result });
    } catch (err) {
      parentPort.postMessage({ success: false, error: err.message });
    }
  });
`, { eval: true });
```

#### 5. Timeout Protection

```javascript
const vm = require('vm');

const sandbox = {};
vm.createContext(sandbox);

try {
  vm.runInContext('while(true) {}', sandbox, {
    timeout: 100, // 100ms timeout
  });
} catch (err) {
  console.log('Timeout exceeded');
}
```

### Security Best Practices

✅ **DO:**
- Use timeouts for all untrusted code
- Combine VM with Worker Threads or child processes
- Use Object.create(null) for sandboxes
- Freeze shared objects
- Validate all inputs
- Log all executions
- Monitor resource usage
- Use allow-lists for modules
- Test escape scenarios

❌ **DON'T:**
- Rely on VM alone for security
- Share mutable objects
- Give access to require()
- Expose process or global
- Trust user input
- Skip timeout protection
- Allow infinite loops
- Share prototype chains

---

## Memory and Performance

### Memory Considerations

#### Context Memory

Each context allocates memory for:
- Global object
- Built-in objects (Object, Array, etc.)
- Compiled code
- Runtime state

```javascript
const vm = require('vm');

// BAD - Creates many contexts
for (let i = 0; i < 1000; i++) {
  const sandbox = { id: i };
  vm.createContext(sandbox);
  // Each context uses memory!
}

// GOOD - Reuse context
const sandbox = {};
vm.createContext(sandbox);
for (let i = 0; i < 1000; i++) {
  sandbox.id = i;
  vm.runInContext('console.log(id)', sandbox);
}
```

#### Script Compilation Caching

```javascript
const vm = require('vm');

// BAD - Recompiles every time
for (let i = 0; i < 1000; i++) {
  vm.runInNewContext('result = Math.sqrt(x)', { x: i });
}

// GOOD - Compile once, execute many times
const script = new vm.Script('result = Math.sqrt(x)');
for (let i = 0; i < 1000; i++) {
  const context = { x: i };
  vm.createContext(context);
  script.runInContext(context);
}
```

### Performance Optimization

#### 1. Script Reuse

```javascript
const vm = require('vm');
const script = new vm.Script('compute(data)');

// Reuse compiled script
function processItems(items) {
  const context = {
    compute: (data) => data * 2,
  };
  vm.createContext(context);

  return items.map(item => {
    context.data = item;
    return script.runInContext(context);
  });
}
```

#### 2. Context Pooling

```javascript
class ContextPool {
  constructor(size) {
    this.pool = [];
    this.size = size;
    this.init();
  }

  init() {
    for (let i = 0; i < this.size; i++) {
      const sandbox = { console };
      vm.createContext(sandbox);
      this.pool.push(sandbox);
    }
  }

  acquire() {
    return this.pool.pop() || this.createContext();
  }

  release(context) {
    // Clean context
    for (let key in context) {
      if (key !== 'console') {
        delete context[key];
      }
    }
    this.pool.push(context);
  }

  createContext() {
    const sandbox = { console };
    vm.createContext(sandbox);
    return sandbox;
  }
}
```

#### 3. Cached Data

```javascript
const vm = require('vm');

// First execution: produce cached data
const script1 = new vm.Script('x + y', {
  produceCachedData: true
});

const cachedData = script1.cachedData;

// Later executions: use cached data
const script2 = new vm.Script('x + y', {
  cachedData: cachedData
});

// script2 uses cached compilation data
```

### Performance Comparison

```javascript
const vm = require('vm');
const { performance } = require('perf_hooks');

function benchmark(name, fn, iterations = 10000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

// Test 1: Direct execution
benchmark('Direct execution', () => {
  const result = 2 + 2;
});

// Test 2: runInThisContext
benchmark('runInThisContext', () => {
  vm.runInThisContext('2 + 2');
});

// Test 3: runInNewContext
benchmark('runInNewContext', () => {
  vm.runInNewContext('2 + 2');
});

// Test 4: Script reuse
const script = new vm.Script('2 + 2');
const context = {};
vm.createContext(context);
benchmark('Script reuse', () => {
  script.runInContext(context);
});
```

---

## Mental Models

### Model 1: The Hotel Analogy

**Main Context** = Hotel Lobby (public, shared space)
**VM Context** = Hotel Room (private, isolated)
**Script** = Room service menu (same in all rooms, but executed privately)
**Sandbox** = Room amenities (what's available in each room)

### Model 2: The Laboratory Analogy

**Main Context** = Main laboratory
**VM Context** = Isolated test chamber
**Script** = Experimental procedure
**Sandbox** = Equipment and materials in chamber
**Timeout** = Safety timer
**Context isolation** = Airlock preventing contamination

### Model 3: The Container Analogy

**Main Process** = Host machine
**VM Context** = Container (Docker-like)
**Script** = Application code
**Sandbox** = Container environment
**Resource limits** = cgroups/limits
**Isolation levels** = Container vs VM vs bare metal

---

## Summary

### Key Takeaways

1. **VM provides execution isolation**, not complete security
2. **Contexts have separate global objects** and built-ins
3. **Scripts can be compiled once** and executed multiple times
4. **Sandboxing requires multiple layers** of protection
5. **Memory management matters** - reuse contexts when possible
6. **Always use timeouts** for untrusted code
7. **Combine with Worker Threads** for true isolation
8. **Prototype chains can be exploited** - use defensive coding

### When to Use VM

✅ Use VM when:
- Building plugin systems with trusted code
- Creating template engines
- Implementing REPLs
- Evaluating configuration files
- Running slightly untrusted code with multiple layers of defense

❌ Don't use VM when:
- Running completely untrusted code (use Worker Threads + OS isolation)
- Security is critical (VM alone is insufficient)
- Simple eval() would suffice (avoid unnecessary complexity)
- Performance is critical and isolation isn't needed

### The VM Decision Tree

```
Need to execute dynamic code?
  │
  ├─ Code is trusted → Use Function() or eval()
  │
  ├─ Code is semi-trusted → Use VM with:
  │   • Timeouts
  │   • Restricted sandbox
  │   • Allow-listed modules
  │
  └─ Code is untrusted → Use:
      • VM + Worker Threads
      • VM + Child Process
      • OS-level containers
      • Serverless functions
```

### Next Steps

Now that you understand the core concepts, you're ready to:

1. **Practice with examples** - See these concepts in action
2. **Complete exercises** - Build your own sandboxed systems
3. **Explore advanced patterns** - Production-grade implementations
4. **Build real projects** - Apply VM in practical scenarios

Continue to [Level 1: Basics](./level-1-basics/README.md) to start hands-on learning!
