# Module 15: VM (Virtual Machine)

The `vm` module in Node.js provides APIs for compiling and running code within V8 Virtual Machine contexts. It allows you to execute JavaScript code in isolated sandboxed environments, making it essential for plugin systems, template engines, code evaluation, and security-critical applications.

## Why VM Matters

The VM module enables safe code execution by creating isolated execution contexts. This is crucial for:

- **Plugin Systems**: Safely run third-party code without compromising your application
- **Template Engines**: Execute user-defined templates in controlled environments
- **Code Sandboxing**: Isolate untrusted code from your main application context
- **REPL Implementation**: Build custom read-eval-print-loops
- **Testing Frameworks**: Create isolated test environments
- **Code Evaluation**: Safely evaluate dynamic code
- **Multi-Tenancy**: Run tenant-specific code in isolated contexts
- **Security Boundaries**: Prevent code from accessing sensitive resources

## Real-World Applications

1. **Template Rendering Systems** - Handlebars, EJS, Pug use VM contexts to safely evaluate templates
2. **Online Code Editors** - CodeSandbox, JSFiddle execute user code in isolated environments
3. **Testing Frameworks** - Jest, Mocha use VM for isolated test execution
4. **Serverless Platforms** - AWS Lambda, Cloudflare Workers isolate function execution
5. **Plugin Architectures** - VS Code, Webpack run plugins in sandboxed contexts
6. **Configuration Evaluation** - Safely evaluate configuration files with code
7. **Rule Engines** - Execute business rules in isolated contexts
8. **Dynamic Code Generation** - Compile and run generated code safely
9. **Browser Automation** - Tools like Puppeteer use VM contexts
10. **Educational Platforms** - Run student code submissions safely

## What You'll Learn

### Technical Skills
- Creating and managing VM contexts
- Running code in isolated environments
- Understanding context objects and global scope
- Using Script class for compiled code
- Working with context isolation and security
- Handling errors in sandboxed code
- Implementing timeout and resource limits
- Creating secure evaluation environments
- Building custom REPL systems
- Managing memory in VM contexts

### Practical Applications
- Build a safe code evaluation API
- Create a plugin system with sandboxing
- Implement a template engine
- Design a custom REPL
- Develop a testing sandbox
- Create a rule engine
- Build a configuration evaluator
- Implement resource-limited execution
- Design multi-tenant code execution
- Create secure code playgrounds

## Module Structure

### [Level 1: Basics](./level-1-basics/README.md) ⏱️ 2-3 hours
Introduction to VM concepts, basic context creation, and simple code execution.

**Key Topics:**
- Understanding VM contexts and sandboxing
- Basic code execution with vm.runInThisContext()
- Creating new contexts with vm.createContext()
- Running code in new contexts with vm.runInNewContext()
- Understanding global objects in contexts
- Script compilation and execution basics
- Error handling in VM contexts
- Simple use cases and patterns

### [Level 2: Intermediate](./level-2-intermediate/README.md) ⏱️ 3-4 hours
Advanced context management, Script class usage, and practical patterns.

**Key Topics:**
- Script class for reusable compiled code
- Context manipulation and inspection
- Timeout and resource control
- Module loading in contexts
- Context freezing and sealing
- Building template engines
- Implementing plugin systems
- Best practices for sandboxing

### [Level 3: Advanced](./level-3-advanced/README.md) ⏱️ 4-6 hours
Production-grade patterns, security hardening, and complex architectures.

**Key Topics:**
- Advanced security patterns and sandboxing
- Memory management and leak prevention
- Performance optimization strategies
- Building production REPL systems
- Worker threads integration
- Proxy-based context protection
- Resource monitoring and limits
- Testing isolated code
- Multi-tenant architectures
- Production deployment patterns

## Prerequisites

Before starting this module, you should be familiar with:

- **JavaScript Fundamentals** - Objects, functions, closures, scope
- **Node.js Basics** - Modules, event loop, async patterns
- **Events Module** - Event emitter patterns (Module 4)
- **Process Module** - Understanding Node.js process (Module 6)
- **Error Handling** - Try-catch, error types, stack traces
- **Security Concepts** - Basic understanding of sandboxing and isolation

## Learning Path

### 🎯 Recommended Path (Complete Learning)
1. Read [CONCEPTS.md](./CONCEPTS.md) to understand VM fundamentals
2. Complete Level 1 - Master basic VM operations
3. Complete Level 2 - Learn practical patterns
4. Complete Level 3 - Master production techniques
5. Build a complete project combining all concepts

**Estimated Time:** 10-13 hours

### ⚡ Fast Track (Essential Skills)
1. Skim [CONCEPTS.md](./CONCEPTS.md) for core concepts
2. Review Level 1 examples for basic usage
3. Complete Level 2 for practical patterns
4. Review Level 3 security guides

**Estimated Time:** 5-7 hours

### 🔬 Deep Dive (Expert Mastery)
1. Study [CONCEPTS.md](./CONCEPTS.md) thoroughly
2. Complete all levels with all exercises
3. Read all guides in detail
4. Build multiple practice projects
5. Explore VM source code and V8 documentation

**Estimated Time:** 15-20 hours

## Key Concepts

### 1. Contexts and Sandboxing

A context is an isolated execution environment with its own global object:

```javascript
const vm = require('vm');

// Code executed in current context (global scope)
const result1 = vm.runInThisContext('x = 42');
console.log(global.x); // undefined (no access to outer scope)

// Code executed in new isolated context
const sandbox = { x: 10 };
vm.createContext(sandbox);
vm.runInContext('x += 32', sandbox);
console.log(sandbox.x); // 42
```

### 2. Script Compilation and Reuse

Scripts can be compiled once and executed multiple times:

```javascript
const vm = require('vm');

// Compile once
const script = new vm.Script('result = x * 2');

// Execute multiple times with different contexts
const context1 = { x: 10 };
vm.createContext(context1);
script.runInContext(context1);
console.log(context1.result); // 20

const context2 = { x: 25 };
vm.createContext(context2);
script.runInContext(context2);
console.log(context2.result); // 50
```

### 3. Security and Isolation

VM contexts provide isolation but are not complete security boundaries:

```javascript
const vm = require('vm');

// Sandbox with timeout protection
const sandbox = {
  console: console,
  setTimeout: undefined, // Remove dangerous globals
  setInterval: undefined,
};

vm.createContext(sandbox);

try {
  vm.runInContext('console.log("Safe code")', sandbox, {
    timeout: 100, // 100ms timeout
    breakOnSigint: true,
  });
} catch (err) {
  console.error('Execution error:', err.message);
}
```

### 4. Context Global Objects

Each context has its own set of built-in objects:

```javascript
const vm = require('vm');

const sandbox = {};
vm.createContext(sandbox);

// Each context has its own Object, Array, etc.
const result = vm.runInContext(`
  const arr = [1, 2, 3];
  arr instanceof Array; // true in sandbox
`, sandbox);

console.log(result); // true
console.log(sandbox.Array === Array); // false (different Array constructor)
```

### 5. Module System Integration

Contexts can have custom module loading:

```javascript
const vm = require('vm');

// Create context with custom require
const sandbox = {
  require: (moduleName) => {
    const allowed = ['path', 'url'];
    if (allowed.includes(moduleName)) {
      return require(moduleName);
    }
    throw new Error(`Module ${moduleName} not allowed`);
  },
};

vm.createContext(sandbox);
vm.runInContext('const path = require("path")', sandbox); // OK
// vm.runInContext('require("fs")', sandbox); // Error: Module fs not allowed
```

## Practical Examples

### Example 1: Safe Expression Evaluator

```javascript
const vm = require('vm');

function safeEval(expression, context = {}) {
  // Create sandbox with safe built-ins only
  const sandbox = {
    Math: Math,
    Date: Date,
    ...context,
  };

  vm.createContext(sandbox);

  try {
    const result = vm.runInContext(expression, sandbox, {
      timeout: 100,
      displayErrors: true,
    });
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Usage
console.log(safeEval('2 + 2')); // { success: true, result: 4 }
console.log(safeEval('Math.sqrt(16)')); // { success: true, result: 4 }
console.log(safeEval('x + y', { x: 10, y: 20 })); // { success: true, result: 30 }
console.log(safeEval('while(true) {}')); // { success: false, error: 'Script execution timed out' }
```

### Example 2: Simple Template Engine

```javascript
const vm = require('vm');

class SimpleTemplate {
  constructor(template) {
    this.template = template;
  }

  render(data) {
    // Convert template to executable code
    const code = `
      let output = '';
      with (data) {
        output = \`${this.template}\`;
      }
      output;
    `;

    const sandbox = { data };
    vm.createContext(sandbox);

    try {
      return vm.runInContext(code, sandbox, { timeout: 100 });
    } catch (err) {
      throw new Error(`Template error: ${err.message}`);
    }
  }
}

// Usage
const template = new SimpleTemplate('Hello, ${name}! You have ${count} messages.');
console.log(template.render({ name: 'Alice', count: 5 }));
// Output: Hello, Alice! You have 5 messages.
```

## Common Pitfalls

### ❌ Pitfall 1: VM is Not a Security Sandbox

```javascript
// WRONG - VM alone doesn't provide complete security
const vm = require('vm');
const sandbox = {};
vm.createContext(sandbox);

// User code can still escape via prototype chains
vm.runInContext('this.constructor.constructor("return process")().exit()', sandbox);
// This can access the host process!

// RIGHT - Combine VM with other security measures
const sandbox2 = Object.create(null); // No prototype chain
vm.createContext(sandbox2);
// Also: Use Worker Threads, OS-level isolation, or containers
```

### ❌ Pitfall 2: Sharing Mutable Objects

```javascript
// WRONG - Sharing objects allows context modification
const shared = { data: [] };
const sandbox = { shared };
vm.createContext(sandbox);

vm.runInContext('shared.data.push("hacked")', sandbox);
console.log(shared.data); // ['hacked'] - main context affected!

// RIGHT - Pass immutable data or deep clones
const sandbox2 = {
  data: JSON.parse(JSON.stringify({ values: [] }))
};
vm.createContext(sandbox2);
```

### ❌ Pitfall 3: Not Handling Timeouts

```javascript
// WRONG - No timeout protection
const vm = require('vm');
vm.runInNewContext('while(true) {}'); // Hangs forever!

// RIGHT - Always use timeouts for untrusted code
try {
  vm.runInNewContext('while(true) {}', {}, { timeout: 100 });
} catch (err) {
  console.log('Timeout exceeded');
}
```

### ❌ Pitfall 4: Memory Leaks from Contexts

```javascript
// WRONG - Creating contexts without cleanup
for (let i = 0; i < 1000; i++) {
  const sandbox = { id: i };
  vm.createContext(sandbox);
  // Context never gets cleaned up!
}

// RIGHT - Reuse contexts when possible
const sandbox = {};
vm.createContext(sandbox);
for (let i = 0; i < 1000; i++) {
  sandbox.id = i;
  vm.runInContext('console.log(id)', sandbox);
}
```

## Module Contents

### 📖 Core Documentation
- [README.md](./README.md) - This file
- [CONCEPTS.md](./CONCEPTS.md) - Fundamental VM concepts and theory

### 📚 Level 1: Basics
- [Level 1 README](./level-1-basics/README.md)
- [8 Example Files](./level-1-basics/examples/)
- [5 Exercise Files](./level-1-basics/exercises/)
- [5 Solution Files](./level-1-basics/solutions/)
- [5 Concept Guides](./level-1-basics/guides/)

### 📚 Level 2: Intermediate
- [Level 2 README](./level-2-intermediate/README.md)
- [8 Example Files](./level-2-intermediate/examples/)
- [5 Exercise Files](./level-2-intermediate/exercises/)
- [5 Solution Files](./level-2-intermediate/solutions/)
- [5 Concept Guides](./level-2-intermediate/guides/)

### 📚 Level 3: Advanced
- [Level 3 README](./level-3-advanced/README.md)
- [8 Example Files](./level-3-advanced/examples/)
- [5 Exercise Files](./level-3-advanced/exercises/)
- [5 Solution Files](./level-3-advanced/solutions/)
- [5 Concept Guides](./level-3-advanced/guides/)

## Getting Started

### Quick Start

1. **Understand the Basics**
   ```bash
   # Read the concepts guide
   cat CONCEPTS.md
   ```

2. **Run Your First Example**
   ```bash
   cd level-1-basics/examples
   node 01-basic-execution.js
   ```

3. **Try an Exercise**
   ```bash
   cd level-1-basics/exercises
   node exercise-1.js
   ```

4. **Check Your Solution**
   ```bash
   cd level-1-basics/solutions
   node exercise-1-solution.js
   ```

### Hands-On Quick Test

Create a file `test-vm.js`:

```javascript
const vm = require('vm');

// Test 1: Basic execution
const result1 = vm.runInThisContext('2 + 2');
console.log('Basic execution:', result1); // 4

// Test 2: Sandboxed execution
const sandbox = { x: 10 };
vm.createContext(sandbox);
vm.runInContext('y = x * 2', sandbox);
console.log('Sandboxed result:', sandbox.y); // 20

// Test 3: Script reuse
const script = new vm.Script('greeting = "Hello " + name');
const context1 = { name: 'Alice' };
const context2 = { name: 'Bob' };
vm.createContext(context1);
vm.createContext(context2);
script.runInContext(context1);
script.runInContext(context2);
console.log('Context 1:', context1.greeting); // Hello Alice
console.log('Context 2:', context2.greeting); // Hello Bob
```

Run it:
```bash
node test-vm.js
```

## Success Criteria

You've mastered this module when you can:

- ✅ Explain the difference between VM contexts and scopes
- ✅ Create and manage isolated execution contexts
- ✅ Use vm.runInThisContext() vs vm.runInNewContext() appropriately
- ✅ Compile and reuse Script objects efficiently
- ✅ Implement timeout and resource controls
- ✅ Build a safe code evaluation system
- ✅ Create a simple template engine using VM
- ✅ Understand VM security limitations
- ✅ Handle errors in sandboxed code
- ✅ Prevent common VM escape vulnerabilities
- ✅ Build a plugin system with code isolation
- ✅ Implement context cleanup and memory management
- ✅ Use VM with Worker Threads for true isolation
- ✅ Design production-grade sandboxing solutions

## Why This Module Matters

### In Real-World Development

The VM module is crucial for:

1. **Security-Critical Applications** - Safely execute untrusted code without compromising your system
2. **Developer Tools** - Build code editors, playgrounds, and testing environments
3. **Plugin Architectures** - Allow extensibility while maintaining security boundaries
4. **Template Systems** - Execute user-defined templates safely
5. **Multi-Tenant Platforms** - Isolate customer code in SaaS applications

### In Technical Interviews

VM module knowledge demonstrates:

- **Advanced Node.js Understanding** - Shows deep knowledge of Node.js internals
- **Security Awareness** - Understanding of code isolation and sandboxing
- **Architectural Skills** - Ability to design plugin systems and extensible architectures
- **Problem-Solving** - Handling complex scenarios like code execution safety
- **Performance Optimization** - Managing resources and memory in isolated contexts

### Career Impact

Mastering VM opens doors to:

- **DevTools Development** - Building developer productivity tools
- **Platform Engineering** - Creating extensible platforms and frameworks
- **Security Engineering** - Designing secure code execution systems
- **Cloud Infrastructure** - Working on serverless and container platforms
- **Enterprise Architecture** - Building plugin-based enterprise systems

## Real-World Impact

Understanding VM enables you to:

1. **Build Safer Applications** - Protect your apps from malicious code
2. **Create Extensible Systems** - Allow users to extend functionality safely
3. **Implement Custom DSLs** - Domain-specific languages with safe evaluation
4. **Design Better APIs** - Code-as-configuration patterns
5. **Optimize Performance** - Reuse compiled scripts for better performance

## Additional Resources

### Official Documentation
- [Node.js VM Documentation](https://nodejs.org/api/vm.html)
- [V8 Context Documentation](https://v8.dev/docs/embed)

### Recommended Reading
- "Node.js Design Patterns" by Mario Casciaro
- "Secure Your Node.js Web Application" by Karl Düüna
- V8 Blog on Context Isolation

### Related Modules
- [Module 6: Process](../../02-core-architecture/06-process/README.md) - Process management
- [Module 14: Worker Threads](../14-worker-threads/README.md) - True isolation with threads
- [Module 16: Crypto](../16-crypto/README.md) - Security and encryption

### Tools and Libraries
- `vm2` - Enhanced VM with better security
- `isolated-vm` - Truly isolated V8 contexts
- `safe-eval` - Safe expression evaluation
- `eshost` - ECMAScript host environment for testing

## Let's Begin!

Ready to master VM and code sandboxing? Start with [CONCEPTS.md](./CONCEPTS.md) to understand the fundamental theory, then dive into [Level 1: Basics](./level-1-basics/README.md) to start coding!

Remember:
- VM provides **isolation**, not complete **security**
- Always use **timeouts** for untrusted code
- Combine VM with **Worker Threads** for true isolation
- **Test thoroughly** - sandboxing is security-critical
- **Monitor resources** - prevent memory and CPU abuse

Happy sandboxing! 🏖️🔒
