# Understanding the VM Module

## Introduction

The `vm` module is one of Node.js's most powerful and misunderstood features. It provides APIs for compiling and running JavaScript code within V8 virtual machine contexts, enabling you to execute code in isolated environments with controlled access to global objects.

### Why This Matters

Being able to execute untrusted code safely, create sandboxes, implement plugin systems, or build JavaScript playgrounds requires understanding how to isolate code execution. The VM module is Node.js's answer to these challenges.

> **Key Insight:** The VM module lets you run JavaScript in a separate context - think of it as creating a new "world" where code can run with its own global objects, while still being inside the same V8 engine.

---

## Table of Contents

- [What Problem Does VM Solve?](#what-problem-does-vm-solve)
- [What is the VM Module?](#what-is-the-vm-module)
- [VM vs eval()](#vm-vs-eval)
- [Real-World Use Cases](#real-world-use-cases)
- [Understanding V8 Contexts](#understanding-v8-contexts)
- [Core VM APIs](#core-vm-apis)
- [When to Use VM](#when-to-use-vm)
- [When NOT to Use VM](#when-not-to-use-vm)
- [Security Considerations](#security-considerations)
- [Practical Examples](#practical-examples)
- [Best Practices](#best-practices)
- [Summary](#summary)

---

## What Problem Does VM Solve?

### The Challenge

When building Node.js applications, you often need to:

- Execute user-provided code without compromising your application
- Create isolated execution environments for plugins
- Build online code playgrounds or REPLs
- Implement template engines that evaluate expressions
- Test code in controlled environments
- Run configuration files as code

**Without the VM module:**

```javascript
// How would you:
// - Run user code without giving them access to your globals?
// - Execute code with a custom global object?
// - Compile code once and run it multiple times?
// - Isolate third-party plugins from each other?

// eval() gives full access to your scope - dangerous!
const userCode = "process.exit(0)"; // Would crash your app!
eval(userCode);
```

### The Solution

The VM module provides controlled code execution:

```javascript
const vm = require('vm');

// Execute code in isolated context
const userCode = "process.exit(0)";
const sandbox = {}; // Empty sandbox

vm.runInNewContext(userCode, sandbox);
// Error: process is not defined
// Your app is safe!
```

---

## What is the VM Module?

### Definition

The `vm` module provides APIs to:

1. **Compile** JavaScript code into reusable scripts
2. **Execute** code in isolated V8 contexts
3. **Control** what global objects the code can access
4. **Isolate** code execution from your main application

```javascript
const vm = require('vm');

// Three main ways to run code:

// 1. Quick execution - new context each time
vm.runInNewContext('x = 5', { x: 0 });

// 2. Execute in existing context
const context = vm.createContext({ x: 0 });
vm.runInContext('x = 5', context);

// 3. Execute in current context (like eval)
vm.runInThisContext('var y = 5');
```

### Key Characteristics

#### 1. Context Isolation

```javascript
// Your code runs in one context
let myVar = 'secret';

// User code runs in a different context
const sandbox = { myVar: 'public' };
vm.runInNewContext('console.log(myVar)', sandbox);
// Output: "public"

console.log(myVar); // Still "secret" - isolated!
```

#### 2. V8 Integration

```javascript
// VM uses the same V8 engine
// - Same JavaScript features
// - Same performance characteristics
// - Same memory space (but isolated scopes)

const script = new vm.Script('1 + 1');
const result = script.runInNewContext();
console.log(result); // 2 - evaluated by V8
```

#### 3. Controllable Environment

```javascript
// You control what's available
const sandbox = {
  console: console,
  setTimeout: setTimeout,
  myAPI: {
    getData: () => 'safe data'
  }
  // No access to: process, require, __dirname, etc.
};

vm.runInNewContext('myAPI.getData()', sandbox);
// User can only access what you provide
```

---

## VM vs eval()

### Understanding eval()

**eval() has two major problems:**

1. **Full scope access** - Can access and modify all variables
2. **Security risk** - Can execute any code with your privileges

```javascript
// eval() is DANGEROUS
let password = 'secret123';

const userCode = `
  console.log(password);  // Can read your variables!
  password = 'hacked';    // Can modify them!
  require('fs').unlinkSync('/important/file'); // Can do anything!
`;

eval(userCode);
console.log(password); // "hacked"
```

### VM Module Alternative

**VM provides isolation:**

```javascript
const vm = require('vm');

let password = 'secret123';

const sandbox = {
  console: console
  // No access to password, require, fs, etc.
};

const userCode = `
  console.log(password);  // ReferenceError: password is not defined
  require('fs').unlinkSync('/file'); // ReferenceError: require is not defined
`;

try {
  vm.runInNewContext(userCode, sandbox);
} catch (err) {
  console.log('Safe - user code cannot access secrets');
}

console.log(password); // Still "secret123"
```

### Comparison Table

| Feature | eval() | vm.runInNewContext() | vm.runInContext() |
|---------|--------|---------------------|-------------------|
| **Scope Access** | Full access to local scope | No access to outer scope | No access to outer scope |
| **Global Access** | Uses current global object | Uses provided sandbox | Uses created context |
| **Security** | Very dangerous | More secure | More secure |
| **Performance** | Fast | Slower (new context) | Fast (reuse context) |
| **Use Case** | Never (use VM instead) | One-off execution | Repeated execution |

### Visual Comparison

```
eval():
┌─────────────────────────────┐
│   Your Application Scope    │
│                             │
│   let secret = "value"      │
│          ↕                  │
│   eval("secret = 'hacked'") │ ← Can access everything
│                             │
└─────────────────────────────┘

vm.runInNewContext():
┌─────────────────────────────┐
│   Your Application Scope    │
│                             │
│   let secret = "value"      │
│                             │
└─────────────────────────────┘
         ✗ No Access
┌─────────────────────────────┐
│   Isolated VM Context       │
│                             │
│   { console: console }      │ ← Separate world
│   runInNewContext(code)     │
│                             │
└─────────────────────────────┘
```

---

## Real-World Use Cases

### Use Case 1: Online Code Playgrounds

```javascript
// Services like CodeSandbox, JSFiddle, etc.
const vm = require('vm');

function runUserCode(code) {
  const sandbox = {
    console: {
      log: (...args) => outputPanel.append(args.join(' '))
    }
  };

  try {
    vm.runInNewContext(code, sandbox, {
      timeout: 1000 // Prevent infinite loops
    });
  } catch (err) {
    outputPanel.append('Error: ' + err.message);
  }
}

// User submits code
runUserCode('console.log("Hello from sandbox!")');
```

### Use Case 2: Plugin Systems

```javascript
// WordPress-style plugin system
class PluginManager {
  constructor() {
    this.plugins = [];
  }

  loadPlugin(pluginCode, pluginName) {
    const sandbox = {
      // Provide API to plugins
      registerHook: (event, callback) => {
        this.hooks[event] = callback;
      },
      console: console
      // No access to: require, process, filesystem, etc.
    };

    try {
      vm.runInNewContext(pluginCode, sandbox);
      console.log(`Plugin "${pluginName}" loaded successfully`);
    } catch (err) {
      console.error(`Plugin "${pluginName}" failed:`, err.message);
    }
  }
}

// Load untrusted plugin
const pluginManager = new PluginManager();
pluginManager.loadPlugin(`
  registerHook('init', () => {
    console.log('Plugin initialized!');
  });
`, 'MyPlugin');
```

### Use Case 3: Template Engines

```javascript
// Simplified template engine (like Handlebars, EJS)
function renderTemplate(template, data) {
  const sandbox = {
    ...data,
    // Helper functions
    uppercase: (str) => str.toUpperCase(),
    formatDate: (date) => date.toLocaleDateString()
  };

  const code = `
    \`${template}\`
  `;

  return vm.runInNewContext(code, sandbox);
}

const template = 'Hello ${name}! Today is ${formatDate(new Date())}';
const result = renderTemplate(template, {
  name: 'Alice'
});
console.log(result);
```

### Use Case 4: Configuration Files

```javascript
// Execute .js config files safely
const fs = require('fs');
const vm = require('vm');

function loadConfig(configPath) {
  const configCode = fs.readFileSync(configPath, 'utf8');

  const sandbox = {
    module: { exports: {} },
    require: createSafeRequire(), // Limited require
    console: console
  };

  vm.runInNewContext(configCode, sandbox);

  return sandbox.module.exports;
}

// config.js can use JavaScript but limited scope
const config = loadConfig('./config.js');
```

### Use Case 5: Testing and Mocking

```javascript
// Test code in isolated environment
function testInIsolation(code, mocks = {}) {
  const sandbox = {
    console: console,
    ...mocks,
    assert: require('assert')
  };

  vm.runInNewContext(code, sandbox);
}

// Test with mock database
testInIsolation(`
  const result = database.query('SELECT * FROM users');
  assert(result.length > 0);
`, {
  database: {
    query: () => [{ id: 1, name: 'Test User' }]
  }
});
```

### Use Case 6: Expression Evaluator

```javascript
// Safe calculator or formula evaluator
function evaluateExpression(expression, variables = {}) {
  const sandbox = {
    ...variables,
    Math: Math // Safe to provide
  };

  const allowedChars = /^[0-9+\-*/(). MathA-Za-z,]+$/;
  if (!allowedChars.test(expression)) {
    throw new Error('Invalid expression');
  }

  return vm.runInNewContext(expression, sandbox, {
    timeout: 100
  });
}

// Use in spreadsheet application
const result = evaluateExpression('A1 + B1 * 2', {
  A1: 10,
  B1: 5
});
console.log(result); // 20
```

---

## Understanding V8 Contexts

### What is a Context?

A **context** is an isolated execution environment in the V8 JavaScript engine. Each context has:

- Its own global object
- Its own built-in objects (Object, Array, etc.)
- Its own variable scope

```javascript
const vm = require('vm');

// Create two separate contexts
const context1 = vm.createContext({ name: 'Context 1' });
const context2 = vm.createContext({ name: 'Context 2' });

// Same code, different contexts, different results
vm.runInContext('this.value = name', context1);
vm.runInContext('this.value = name', context2);

console.log(context1.value); // "Context 1"
console.log(context2.value); // "Context 2"
```

### Context Isolation

```javascript
// Each context is isolated
const context1 = vm.createContext({ x: 10 });
const context2 = vm.createContext({ x: 20 });

vm.runInContext('x = x + 5', context1);
vm.runInContext('x = x + 5', context2);

console.log(context1.x); // 15
console.log(context2.x); // 25
// Changes don't affect each other
```

### Memory Considerations

```javascript
// All contexts share the same V8 heap
const contexts = [];
for (let i = 0; i < 1000; i++) {
  contexts.push(vm.createContext({}));
}
// Each context uses memory!

// Clean up when done
contexts.length = 0; // Allow garbage collection
```

---

## Core VM APIs

### Quick Reference

```javascript
const vm = require('vm');

// 1. Execute code in new context (one-off)
vm.runInNewContext(code, sandbox, options);

// 2. Create reusable context
const context = vm.createContext(sandbox);
vm.runInContext(code, context, options);

// 3. Execute in current context
vm.runInThisContext(code, options);

// 4. Compile for reuse
const script = new vm.Script(code, options);
script.runInNewContext(sandbox);
script.runInContext(context);
script.runInThisContext();
```

### Common Options

```javascript
const options = {
  filename: 'user-code.js',     // For stack traces
  timeout: 1000,                // Milliseconds
  displayErrors: true,          // Show errors
  breakOnSigint: true,          // Allow Ctrl+C
  cachedData: undefined,        // Code caching
};
```

---

## When to Use VM

### ✅ Use VM When:

1. **Executing user-provided code**
   ```javascript
   // Online code editor
   vm.runInNewContext(userSubmittedCode, sandbox);
   ```

2. **Building plugin systems**
   ```javascript
   // Load plugins safely
   plugins.forEach(plugin => {
     vm.runInNewContext(plugin.code, pluginAPI);
   });
   ```

3. **Creating DSLs (Domain Specific Languages)**
   ```javascript
   // Custom configuration language
   const config = vm.runInNewContext(dslCode, dslAPI);
   ```

4. **Template evaluation**
   ```javascript
   // Evaluate template expressions
   const result = vm.runInNewContext(templateExpr, templateVars);
   ```

5. **Testing with mocks**
   ```javascript
   // Test with controlled environment
   vm.runInNewContext(testCode, mockEnvironment);
   ```

---

## When NOT to Use VM

### ❌ Don't Use VM When:

1. **You need true security isolation**
   ```javascript
   // VM is NOT a security boundary!
   // Can escape sandbox via:
   // - Prototype pollution
   // - Constructor access
   // - Timing attacks

   // For true isolation, use:
   // - Docker containers
   // - Web Workers
   // - Separate processes
   ```

2. **Performance is critical**
   ```javascript
   // Creating new contexts is expensive
   for (let i = 0; i < 1000000; i++) {
     vm.runInNewContext('1 + 1'); // Slow!
   }

   // Better: reuse context or avoid VM
   ```

3. **You control all the code**
   ```javascript
   // No need for VM if you trust the code
   // Just use normal functions:
   const result = myFunction(input); // Simpler!
   ```

4. **Browser compatibility needed**
   ```javascript
   // VM is Node.js only
   // Won't work in browsers
   ```

---

## Security Considerations

### ⚠️ Critical Warning

**The VM module is NOT a security mechanism!**

```javascript
// VM can be escaped!
const vm = require('vm');

const sandbox = {};

// Attack: Access Node.js internals via constructor
const malicious = `
  this.constructor.constructor('return process')().exit()
`;

// This WILL crash your application!
vm.runInNewContext(malicious, sandbox);
```

### Defense Strategies

```javascript
// 1. Freeze prototypes
Object.freeze(Object.prototype);
Object.freeze(Array.prototype);
Object.freeze(Function.prototype);

// 2. Use proxies to intercept access
const safeConsole = new Proxy(console, {
  get(target, prop) {
    if (prop === 'log') return target.log;
    throw new Error('Access denied');
  }
});

// 3. Timeout protection
vm.runInNewContext(code, sandbox, {
  timeout: 1000 // Prevent infinite loops
});

// 4. Resource limits (use in combination with VM)
const { Worker } = require('worker_threads');
// Run in worker with memory limits
```

### What VM Does Protect

✅ VM protects against:
- Accidental variable conflicts
- Unintended global pollution
- Simple mistakes in user code

❌ VM does NOT protect against:
- Determined attackers
- Prototype pollution attacks
- Infinite loops (without timeout)
- Memory exhaustion
- Timing attacks

---

## Practical Examples

### Example 1: Safe Calculator

```javascript
const vm = require('vm');

function calculate(expression) {
  // Whitelist safe operations
  const allowed = /^[0-9+\-*/(). ]+$/;
  if (!allowed.test(expression)) {
    throw new Error('Invalid expression');
  }

  const sandbox = {
    result: null
  };

  try {
    const code = `result = ${expression}`;
    vm.runInNewContext(code, sandbox, {
      timeout: 100
    });
    return sandbox.result;
  } catch (err) {
    throw new Error('Calculation failed: ' + err.message);
  }
}

console.log(calculate('2 + 2'));           // 4
console.log(calculate('(10 + 5) * 2'));   // 30
// console.log(calculate('process.exit()')); // Error: Invalid expression
```

### Example 2: Simple Template Engine

```javascript
function renderTemplate(template, data) {
  const sandbox = {
    ...data,
    output: ''
  };

  // Convert template to code
  const code = template
    .replace(/{{(.+?)}}/g, '${$1}')
    .replace(/^/, 'output = `')
    .replace(/$/, '`');

  vm.runInNewContext(code, sandbox);
  return sandbox.output;
}

const template = 'Hello {{name}}! You have {{count}} messages.';
const result = renderTemplate(template, {
  name: 'Alice',
  count: 5
});
console.log(result); // "Hello Alice! You have 5 messages."
```

### Example 3: Configuration Loader

```javascript
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadConfig(filepath) {
  const code = fs.readFileSync(filepath, 'utf8');

  const sandbox = {
    env: process.env.NODE_ENV || 'development',
    module: { exports: {} },
    exports: {},
    console: console
  };

  vm.runInNewContext(code, sandbox, {
    filename: path.basename(filepath)
  });

  return sandbox.module.exports;
}

// config.js content:
// module.exports = {
//   port: env === 'production' ? 80 : 3000
// };

const config = loadConfig('./config.js');
console.log(config.port);
```

---

## Best Practices

### 1. Always Use Timeouts

```javascript
// ✅ Good - Prevent infinite loops
vm.runInNewContext(code, sandbox, {
  timeout: 1000
});

// ❌ Bad - No timeout
vm.runInNewContext(code, sandbox);
```

### 2. Reuse Contexts

```javascript
// ✅ Good - Reuse context for multiple executions
const context = vm.createContext(sandbox);
for (const code of codes) {
  vm.runInContext(code, context);
}

// ❌ Bad - Create new context each time
for (const code of codes) {
  vm.runInNewContext(code, sandbox); // Expensive!
}
```

### 3. Validate Input

```javascript
// ✅ Good - Validate before execution
function safeEval(expr) {
  if (typeof expr !== 'string') {
    throw new Error('Expression must be string');
  }
  if (expr.length > 1000) {
    throw new Error('Expression too long');
  }
  if (!/^[a-zA-Z0-9+\-*/(). ]+$/.test(expr)) {
    throw new Error('Invalid characters');
  }
  return vm.runInNewContext(expr, {});
}
```

### 4. Provide Minimal Sandbox

```javascript
// ✅ Good - Only provide what's needed
const sandbox = {
  console: { log: console.log },
  data: safeData
};

// ❌ Bad - Providing dangerous objects
const sandbox = {
  console: console,
  process: process,    // Dangerous!
  require: require,    // Very dangerous!
  global: global       // Extremely dangerous!
};
```

---

## Summary

### Key Takeaways

1. **VM enables isolated code execution** in separate V8 contexts
2. **Not a security boundary** - can be escaped with clever attacks
3. **Better than eval()** - provides scope isolation
4. **Use cases**: playgrounds, plugins, templates, configs
5. **Performance cost** - creating contexts is expensive
6. **Always use timeouts** - prevent infinite loops
7. **Reuse contexts** - better performance for repeated execution

### Mental Model

```
Your Application
    ↓
VM Module
    ↓
V8 Engine
    ├─ Context 1 (isolated) → User Code A
    ├─ Context 2 (isolated) → User Code B
    └─ Context 3 (isolated) → Plugin Code
```

### Quick Decision Guide

**Use VM when:**
- Running untrusted code (with caution)
- Building plugin systems
- Creating code playgrounds
- Evaluating templates

**Don't use VM when:**
- You need strong security (use processes/containers)
- Performance is critical
- You control all code

### Next Steps

Now that you understand the VM module, dive deeper:
1. [Contexts and Scope Guide](./02-contexts-and-scope.md)
2. [Script Compilation Guide](./03-script-compilation.md)
3. [Sandbox Creation Guide](./04-sandbox-creation.md)
4. [Error Handling Guide](./05-error-handling.md)

---

## Quick Reference

```javascript
const vm = require('vm');

// Quick execution
vm.runInNewContext(code, sandbox, options);

// Reusable context
const context = vm.createContext(sandbox);
vm.runInContext(code, context);

// Compile once, run many
const script = new vm.Script(code);
script.runInContext(context);

// Common options
const options = {
  timeout: 1000,
  filename: 'code.js',
  displayErrors: true
};
```

Ready to learn about contexts and scope? Continue to the [Contexts and Scope Guide](./02-contexts-and-scope.md)!
