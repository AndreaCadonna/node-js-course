# Level 2: VM Intermediate

Welcome to Level 2 of the VM module! This level builds on the fundamentals from Level 1 and introduces intermediate concepts including advanced Script class usage, context manipulation, resource control, module loading, and building real-world systems like template engines and plugin architectures.

**Estimated Time**: 4-6 hours

---

## Learning Objectives

By the end of this level, you will be able to:

- [ ] Master advanced Script class patterns and compilation strategies
- [ ] Inspect and manipulate context properties programmatically
- [ ] Implement resource limits including memory and CPU constraints
- [ ] Create custom module loading systems in VM contexts
- [ ] Build template engines using VM for expression evaluation
- [ ] Design plugin systems with safe code execution
- [ ] Freeze and seal contexts for security
- [ ] Apply performance optimization patterns
- [ ] Implement context pooling for efficiency
- [ ] Build production-ready VM-based systems

---

## Prerequisites

Before starting Level 2, ensure you understand:

- **Level 1 Concepts**: All fundamentals from VM Basics
- **VM Execution**: runInContext(), createContext(), Script class
- **Error Handling**: Try-catch, timeout handling
- **JavaScript Advanced**: Prototypes, closures, proxies
- **Module Systems**: CommonJS, module.exports, require()
- **Design Patterns**: Factory, singleton, observer patterns

---

## Topics Covered

### Core Concepts
- **Advanced Script Class**: Reuse patterns, caching, compilation strategies
- **Context Inspection**: Reading and manipulating context properties
- **Resource Control**: Memory limits, CPU limits, timeout strategies
- **Module Loading**: Custom require() implementation, module resolution
- **Template Engines**: Expression evaluation, variable substitution
- **Plugin Systems**: Safe plugin loading, isolation, communication
- **Context Security**: Freezing, sealing, immutability
- **Performance Patterns**: Pooling, caching, optimization techniques

---

## Conceptual Guides

Work through these guides to build your understanding:

1. **[Script Patterns](./guides/01-script-patterns.md)** ⏱️ 30 min
   - Advanced Script class usage
   - Compilation strategies
   - Caching patterns
   - Performance optimization

2. **[Context Manipulation](./guides/02-context-manipulation.md)** ⏱️ 35 min
   - Inspecting context properties
   - Dynamic context modification
   - Context cloning and copying
   - Security considerations

3. **[Resource Control](./guides/03-resource-control.md)** ⏱️ 30 min
   - Memory limit enforcement
   - CPU time restrictions
   - Timeout strategies
   - Resource monitoring

4. **[Template Engines](./guides/04-template-engines.md)** ⏱️ 40 min
   - Template compilation
   - Expression evaluation
   - Variable substitution
   - Security best practices

5. **[Plugin Systems](./guides/05-plugin-systems.md)** ⏱️ 35 min
   - Plugin architecture design
   - Safe plugin loading
   - Isolation strategies
   - Plugin communication

---

## Learning Path

### 🎯 Recommended Approach (Complete Learning)

1. **Read the Guides** (3 hours)
   - Work through all 5 conceptual guides
   - Understand architectural patterns
   - Study the design decisions

2. **Study the Examples** (1 hour)
   - Run each example file
   - Modify examples to experiment
   - Build on the patterns

3. **Complete the Exercises** (2-3 hours)
   - Attempt each exercise
   - Build complete implementations
   - Test thoroughly

4. **Review Solutions** (1 hour)
   - Compare with provided solutions
   - Understand different approaches
   - Apply best practices

### ⚡ Fast Track (Essential Skills)

1. **Skim Guides 1, 3, and 4** (45 minutes)
2. **Run Examples 1, 4, 5, 6** (20 minutes)
3. **Complete Exercises 1, 2, 5** (90 minutes)
4. **Review Key Solutions** (20 minutes)

---

## Examples

The following examples demonstrate intermediate VM concepts:

### 1. [01-script-reuse.js](./examples/01-script-reuse.js)
Advanced Script class reuse patterns including caching, compilation strategies, and performance optimization techniques.

### 2. [02-context-inspection.js](./examples/02-context-inspection.js)
Inspecting and manipulating context properties programmatically, including reading, modifying, and cloning contexts.

### 3. [03-resource-limits.js](./examples/03-resource-limits.js)
Implementing memory and CPU limits to control resource usage in VM contexts with various enforcement strategies.

### 4. [04-module-loading.js](./examples/04-module-loading.js)
Creating custom module loading systems in VM contexts, implementing a basic require() function with module resolution.

### 5. [05-template-engine.js](./examples/05-template-engine.js)
Building a template engine using VM for expression evaluation and variable substitution with security features.

### 6. [06-plugin-system.js](./examples/06-plugin-system.js)
Designing a plugin architecture with safe code execution, isolation, and controlled communication between plugins.

### 7. [07-context-freezing.js](./examples/07-context-freezing.js)
Freezing and sealing contexts to prevent modification, creating immutable sandboxes for enhanced security.

### 8. [08-performance-patterns.js](./examples/08-performance-patterns.js)
Performance optimization patterns including context pooling, script caching, and execution optimization.

**Run Examples:**
```bash
cd examples
node 01-script-reuse.js
node 02-context-inspection.js
# ... etc
```

---

## Exercises

Apply what you've learned with these hands-on exercises:

### Exercise 1: Template Renderer
**Skills**: Template compilation, expression evaluation, VM security
**Difficulty**: ⭐⭐ Medium

Build a template renderer that compiles templates with variable substitution and expression evaluation.

### Exercise 2: Plugin Manager
**Skills**: Plugin loading, isolation, communication, lifecycle
**Difficulty**: ⭐⭐⭐ Hard

Create a plugin manager that can load, isolate, and manage multiple plugins with safe execution.

### Exercise 3: Context Pool
**Skills**: Resource management, pooling, performance optimization
**Difficulty**: ⭐⭐ Medium

Implement a context pool that reuses VM contexts for better performance in high-throughput scenarios.

### Exercise 4: Expression Compiler
**Skills**: Script compilation, caching, evaluation
**Difficulty**: ⭐⭐ Medium

Build an expression compiler that can compile and cache expressions for fast repeated evaluation.

### Exercise 5: Safe Module Loader
**Skills**: Module loading, security, custom require()
**Difficulty**: ⭐⭐⭐ Hard

Create a safe module loader with whitelist/blacklist support and custom module resolution.

**Work on Exercises:**
```bash
cd exercises
node exercise-1.js
node exercise-2.js
# ... etc
```

---

## Solutions

After attempting the exercises, review the solutions:

- [Exercise 1 Solution](./solutions/exercise-1-solution.js) - Template Renderer
- [Exercise 2 Solution](./solutions/exercise-2-solution.js) - Plugin Manager
- [Exercise 3 Solution](./solutions/exercise-3-solution.js) - Context Pool
- [Exercise 4 Solution](./solutions/exercise-4-solution.js) - Expression Compiler
- [Exercise 5 Solution](./solutions/exercise-5-solution.js) - Safe Module Loader

**View Solutions:**
```bash
cd solutions
node exercise-1-solution.js
node exercise-2-solution.js
# ... etc
```

---

## Key Concepts Summary

### Advanced Script Usage

```javascript
const vm = require('vm');

// Script caching pattern
class ScriptCache {
  constructor() {
    this.cache = new Map();
  }

  compile(code) {
    if (!this.cache.has(code)) {
      this.cache.set(code, new vm.Script(code));
    }
    return this.cache.get(code);
  }

  execute(code, context) {
    const script = this.compile(code);
    return script.runInContext(context);
  }
}
```

### Context Inspection

```javascript
const vm = require('vm');

// Inspect context properties
function inspectContext(context) {
  const properties = Object.keys(context);
  const values = {};

  for (const prop of properties) {
    values[prop] = {
      type: typeof context[prop],
      value: context[prop],
      writable: Object.getOwnPropertyDescriptor(context, prop)?.writable
    };
  }

  return values;
}
```

### Resource Limits

```javascript
const vm = require('vm');

// Execute with memory limit (requires v8 module)
function executeWithLimits(code, context, limits = {}) {
  const { timeout = 1000, maxMemory = 50 * 1024 * 1024 } = limits;

  // Set memory limit using v8
  const v8 = require('v8');
  const initialMemory = v8.getHeapStatistics().used_heap_size;

  try {
    return vm.runInContext(code, context, {
      timeout,
      breakOnSigint: true
    });
  } finally {
    const finalMemory = v8.getHeapStatistics().used_heap_size;
    if (finalMemory - initialMemory > maxMemory) {
      throw new Error('Memory limit exceeded');
    }
  }
}
```

### Custom Module Loading

```javascript
const vm = require('vm');
const path = require('path');
const fs = require('fs');

// Simple require() implementation
function createRequire(context, basePath) {
  const modules = new Map();

  return function require(modulePath) {
    const fullPath = path.resolve(basePath, modulePath);

    if (modules.has(fullPath)) {
      return modules.get(fullPath).exports;
    }

    const code = fs.readFileSync(fullPath, 'utf8');
    const module = { exports: {} };

    const wrapper = `(function(module, exports, require) {
      ${code}
    })`;

    const script = new vm.Script(wrapper);
    const fn = script.runInContext(context);
    fn(module, module.exports, require);

    modules.set(fullPath, module);
    return module.exports;
  };
}
```

### Template Engine Basics

```javascript
const vm = require('vm');

// Simple template engine
class TemplateEngine {
  compile(template) {
    // Convert {{ variable }} to JavaScript
    const code = template.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
      return `' + (${expr.trim()}) + '`;
    });

    const wrapped = `'${code}'`;
    return new vm.Script(`result = ${wrapped}`);
  }

  render(template, data) {
    const script = this.compile(template);
    const context = vm.createContext({ ...data, result: '' });
    script.runInContext(context);
    return context.result;
  }
}
```

### Plugin System Basics

```javascript
const vm = require('vm');

// Simple plugin system
class PluginSystem {
  constructor() {
    this.plugins = new Map();
  }

  loadPlugin(name, code) {
    const sandbox = {
      console,
      exports: {},
      pluginAPI: this.createAPI(name)
    };

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    this.plugins.set(name, {
      exports: sandbox.exports,
      context: sandbox
    });
  }

  createAPI(pluginName) {
    return {
      emit: (event, data) => {
        console.log(`[${pluginName}] ${event}:`, data);
      }
    };
  }

  getPlugin(name) {
    return this.plugins.get(name)?.exports;
  }
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Script Cache Memory Leaks

```javascript
// WRONG - Unbounded cache
class BadCache {
  constructor() {
    this.cache = new Map(); // Never clears!
  }
  compile(code) {
    if (!this.cache.has(code)) {
      this.cache.set(code, new vm.Script(code));
    }
    return this.cache.get(code);
  }
}

// RIGHT - LRU cache with size limit
class GoodCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  compile(code) {
    if (this.cache.has(code)) {
      const script = this.cache.get(code);
      this.cache.delete(code); // Remove and re-add for LRU
      this.cache.set(code, script);
      return script;
    }

    const script = new vm.Script(code);
    this.cache.set(code, script);

    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    return script;
  }
}
```

### ❌ Pitfall 2: Context Pollution

```javascript
// WRONG - Modifying shared context
const sharedContext = { Math, console };
vm.createContext(sharedContext);

vm.runInContext('Math.random = () => 0.5', sharedContext); // Polluted!
vm.runInContext('console.log(Math.random())', sharedContext); // Always 0.5

// RIGHT - Clone context for each use
function createFreshContext(base) {
  return vm.createContext({
    Math: Object.create(Math),
    console: Object.create(console),
    ...base
  });
}
```

### ❌ Pitfall 3: Inefficient Context Creation

```javascript
// WRONG - Creating context per execution
function badExecutor(code, data) {
  const context = vm.createContext({ ...data, console });
  return vm.runInContext(code, context); // New context each time!
}

// Call 1000 times - very slow!
for (let i = 0; i < 1000; i++) {
  badExecutor('x * 2', { x: i });
}

// RIGHT - Use context pool
class ContextPool {
  constructor(size = 10) {
    this.pool = Array.from({ length: size }, () => vm.createContext({}));
    this.available = [...this.pool];
  }

  acquire() {
    return this.available.pop() || vm.createContext({});
  }

  release(context) {
    // Clear context
    for (const key in context) {
      delete context[key];
    }
    this.available.push(context);
  }

  execute(code, data) {
    const context = this.acquire();
    try {
      Object.assign(context, data, { console });
      return vm.runInContext(code, context);
    } finally {
      this.release(context);
    }
  }
}
```

---

## Practice Projects

Build these mini-projects to reinforce your learning:

### Project 1: Configuration Evaluator
Create a safe configuration file evaluator that supports expressions:
```javascript
// config.conf
port = 3000
host = "localhost"
url = "http://" + host + ":" + port
timeout = 30 * 1000  // 30 seconds in ms

const config = evaluator.load('config.conf');
// { port: 3000, host: "localhost", url: "http://localhost:3000", timeout: 30000 }
```

### Project 2: Rule Engine
Build a rule engine for business logic evaluation:
```javascript
const engine = new RuleEngine();
engine.addRule('discount', 'order.total > 100 && customer.tier === "gold"');
engine.addRule('shipping', 'order.weight < 5 || customer.isPremium');

const result = engine.evaluate({
  order: { total: 150, weight: 3 },
  customer: { tier: 'gold', isPremium: true }
});
// { discount: true, shipping: true }
```

### Project 3: Sandboxed REPL
Create an interactive REPL with persistent state and safe execution:
```javascript
const repl = new SandboxREPL();
repl.execute('x = 10');           // 10
repl.execute('y = x * 2');        // 20
repl.execute('function add(a, b) { return a + b }');
repl.execute('add(x, y)');        // 30
repl.getState();                  // { x: 10, y: 20, add: [Function] }
```

---

## Testing Your Knowledge

Test your understanding with these questions:

1. **Why should you cache compiled Script objects?**
   <details>
   <summary>Answer</summary>

   - Compilation is expensive, execution is cheap
   - Reusing scripts improves performance significantly
   - Scripts can be executed in different contexts
   - Reduces CPU usage in high-throughput scenarios
   </details>

2. **What's the difference between context pooling and script caching?**
   <details>
   <summary>Answer</summary>

   - Context pooling reuses VM contexts to avoid creation overhead
   - Script caching reuses compiled code to avoid compilation overhead
   - Both are complementary optimization strategies
   - Context pooling helps when creating many contexts
   - Script caching helps when executing same code repeatedly
   </details>

3. **How can you prevent a plugin from modifying shared objects?**
   <details>
   <summary>Answer</summary>

   - Use Object.create() to provide prototype-based copies
   - Freeze objects with Object.freeze()
   - Use proxies to control access
   - Provide only immutable data
   - Clone objects before passing to context
   </details>

4. **Why might Object.freeze() not be sufficient for security?**
   <details>
   <summary>Answer</summary>

   - Freeze is shallow - doesn't freeze nested objects
   - Can still access prototype chain
   - Existing references can be exploited
   - VM contexts share the same V8 isolate
   - Need deeper isolation for true security
   </details>

5. **When should you use a context pool?**
   <details>
   <summary>Answer</summary>

   - High-throughput scenarios with many executions
   - When context creation overhead is significant
   - When contexts can be safely reused
   - When you need consistent performance
   - Not when contexts maintain important state
   </details>

---

## Quick Reference Card

```javascript
const vm = require('vm');

// Script Caching
const scriptCache = new Map();
function getCachedScript(code) {
  if (!scriptCache.has(code)) {
    scriptCache.set(code, new vm.Script(code));
  }
  return scriptCache.get(code);
}

// Context Inspection
function inspectContext(ctx) {
  return Object.keys(ctx).map(key => ({
    key,
    type: typeof ctx[key],
    descriptor: Object.getOwnPropertyDescriptor(ctx, key)
  }));
}

// Context Freezing
function createFrozenContext(sandbox) {
  const ctx = vm.createContext(sandbox);
  Object.freeze(sandbox);
  return ctx;
}

// Resource Limits
vm.runInContext(code, ctx, {
  timeout: 1000,           // 1 second max
  breakOnSigint: true,     // Allow Ctrl+C
  displayErrors: true      // Show errors
});

// Module Loading
function createSafeRequire(allowedModules = []) {
  return function(moduleName) {
    if (!allowedModules.includes(moduleName)) {
      throw new Error(`Module ${moduleName} not allowed`);
    }
    return require(moduleName);
  };
}

// Template Compilation
function compileTemplate(template) {
  const code = template.replace(/\{\{(.+?)\}\}/g,
    (_, expr) => `\${${expr.trim()}}`);
  return new Function('data', `return \`${code}\`;`);
}
```

---

## Best Practices

### 1. Always Use Script Caching for Repeated Execution
```javascript
// Cache compiled scripts for reuse
const cache = new Map();
function execute(code, context) {
  let script = cache.get(code);
  if (!script) {
    script = new vm.Script(code);
    cache.set(code, script);
  }
  return script.runInContext(context);
}
```

### 2. Implement Proper Context Cleanup
```javascript
// Clean up contexts after use
function executeAndCleanup(code, data) {
  const context = vm.createContext(data);
  try {
    return vm.runInContext(code, context);
  } finally {
    // Clear all properties
    for (const key in context) {
      delete context[key];
    }
  }
}
```

### 3. Use Timeouts for All Untrusted Code
```javascript
// Always set reasonable timeouts
const DEFAULT_TIMEOUT = 1000;

function safeExecute(code, context, timeout = DEFAULT_TIMEOUT) {
  try {
    return vm.runInContext(code, context, { timeout });
  } catch (err) {
    if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
      throw new Error('Execution timed out');
    }
    throw err;
  }
}
```

### 4. Provide Minimal Context
```javascript
// Only provide what's necessary
function createMinimalContext(data) {
  return vm.createContext({
    // Only safe built-ins
    Math,
    JSON,
    // User data
    ...data,
    // No require, no process, no fs, etc.
  });
}
```

### 5. Monitor Resource Usage
```javascript
const v8 = require('v8');

function executeWithMonitoring(code, context) {
  const before = v8.getHeapStatistics();
  const result = vm.runInContext(code, context);
  const after = v8.getHeapStatistics();

  const memoryUsed = after.used_heap_size - before.used_heap_size;
  console.log(`Memory used: ${(memoryUsed / 1024 / 1024).toFixed(2)} MB`);

  return result;
}
```

---

## Next Steps

Once you've completed Level 2:

1. ✅ **Review**: Ensure you understand all intermediate concepts
2. ✅ **Practice**: Complete all exercises thoroughly
3. ✅ **Experiment**: Build one of the practice projects
4. ✅ **Optimize**: Apply performance patterns to your code
5. ➡️ **Advance**: Move to [Level 3: Advanced](../level-3-advanced/README.md)

---

## Getting Help

If you're stuck:

1. **Re-read the guides** - Pattern explanations are detailed
2. **Review examples** - See complete implementations
3. **Check solutions** - Learn from working code
4. **Experiment** - Try different approaches
5. **Build projects** - Apply concepts in practice

---

## Additional Resources

- [Node.js VM Documentation](https://nodejs.org/api/vm.html)
- [V8 Embedder's Guide](https://v8.dev/docs/embed)
- [Template Engine Design Patterns](https://en.wikipedia.org/wiki/Template_processor)
- [Plugin Architecture Patterns](https://www.martinfowler.com/articles/plugins.html)

---

**Ready to start?** Begin with [Guide 1: Script Patterns](./guides/01-script-patterns.md) or jump straight to [Example 1](./examples/01-script-reuse.js)!

Happy learning! 🚀
