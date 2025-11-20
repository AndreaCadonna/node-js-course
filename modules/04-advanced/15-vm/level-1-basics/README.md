# Level 1: VM Basics

Welcome to Level 1 of the VM module! This level introduces you to the fundamentals of Node.js's VM module, teaching you how to execute code in isolated contexts and create basic sandboxed environments.

**Estimated Time**: 2-3 hours

---

## Learning Objectives

By the end of this level, you will be able to:

- [ ] Understand what VM contexts are and how they differ from scope
- [ ] Use `vm.runInThisContext()` to execute code in the current context
- [ ] Use `vm.runInNewContext()` to execute code in isolated contexts
- [ ] Create reusable contexts with `vm.createContext()`
- [ ] Execute code in created contexts with `vm.runInContext()`
- [ ] Understand how global objects work in different contexts
- [ ] Use the Script class for basic code compilation
- [ ] Handle errors in sandboxed code execution
- [ ] Implement basic timeout protection
- [ ] Create simple sandboxed environments

---

## Prerequisites

Before starting Level 1, ensure you understand:

- **JavaScript Fundamentals**: Variables, functions, objects, scope
- **Node.js Basics**: Modules, require(), basic error handling
- **Execution Context**: Understanding of `this`, global object
- **Error Handling**: try-catch blocks, Error objects

---

## Topics Covered

### Core Concepts
- **VM Module Overview**: What it is and why it's useful
- **Execution Contexts**: Difference between context and scope
- **Context Types**: runInThisContext vs runInNewContext vs runInContext
- **Global Objects**: How globals work in different contexts
- **Script Compilation**: Using the Script class
- **Basic Sandboxing**: Creating isolated environments
- **Error Handling**: Managing errors in VM execution
- **Timeout Control**: Preventing infinite loops

---

## Conceptual Guides

Work through these guides to build your understanding:

1. **[Understanding VM](./guides/01-understanding-vm.md)** ⏱️ 20 min
   - What is the VM module?
   - Why use VM?
   - Real-world use cases
   - VM vs eval()

2. **[Contexts and Scope](./guides/02-contexts-and-scope.md)** ⏱️ 25 min
   - Understanding execution contexts
   - Scope vs context explained
   - Context isolation principles
   - Global object behavior

3. **[Script Compilation](./guides/03-script-compilation.md)** ⏱️ 20 min
   - The Script class
   - Compilation vs execution
   - Reusing compiled scripts
   - Performance benefits

4. **[Sandbox Creation](./guides/04-sandbox-creation.md)** ⏱️ 25 min
   - What is a sandbox?
   - Creating basic sandboxes
   - Providing built-ins
   - Sandbox configuration

5. **[Error Handling](./guides/05-error-handling.md)** ⏱️ 20 min
   - Errors in VM contexts
   - Try-catch patterns
   - Timeout errors
   - Debugging techniques

---

## Learning Path

### 🎯 Recommended Approach (Complete Learning)

1. **Read the Guides** (2 hours)
   - Work through all 5 conceptual guides
   - Take notes on key concepts
   - Try the code examples

2. **Study the Examples** (30 minutes)
   - Run each example file
   - Modify examples to experiment
   - Observe the outputs

3. **Complete the Exercises** (1-2 hours)
   - Attempt each exercise
   - Don't peek at solutions immediately
   - Test your code thoroughly

4. **Review Solutions** (30 minutes)
   - Compare with provided solutions
   - Understand alternative approaches
   - Note best practices

### ⚡ Fast Track (Essential Skills)

1. **Skim Guides 1, 2, and 4** (30 minutes)
2. **Run Examples 1-5** (15 minutes)
3. **Complete Exercises 1-3** (45 minutes)
4. **Review Key Solutions** (15 minutes)

---

## Examples

The following examples demonstrate core VM concepts:

### 1. [01-basic-execution.js](./examples/01-basic-execution.js)
Introduction to running code with VM, demonstrating the difference between normal execution, eval(), and vm.runInThisContext().

### 2. [02-run-in-new-context.js](./examples/02-run-in-new-context.js)
Using vm.runInNewContext() to execute code in completely isolated contexts.

### 3. [03-create-context.js](./examples/03-create-context.js)
Creating reusable contexts with vm.createContext() and vm.runInContext().

### 4. [04-global-objects.js](./examples/04-global-objects.js)
Understanding how global objects and built-ins work in different contexts.

### 5. [05-script-class.js](./examples/05-script-class.js)
Using the Script class to compile code once and execute it multiple times.

### 6. [06-error-handling.js](./examples/06-error-handling.js)
Handling errors that occur during code execution in VM contexts.

### 7. [07-timeout-control.js](./examples/07-timeout-control.js)
Implementing timeout protection to prevent infinite loops and long-running code.

### 8. [08-sandbox-basics.js](./examples/08-sandbox-basics.js)
Creating basic sandboxed environments with controlled access to built-ins.

**Run Examples:**
```bash
cd examples
node 01-basic-execution.js
node 02-run-in-new-context.js
# ... etc
```

---

## Exercises

Apply what you've learned with these hands-on exercises:

### Exercise 1: Basic Context Execution
**Skills**: runInNewContext(), variable isolation
**Difficulty**: ⭐ Easy

Create a function that safely evaluates mathematical expressions in isolated contexts.

### Exercise 2: Context Creation and Reuse
**Skills**: createContext(), runInContext(), context management
**Difficulty**: ⭐⭐ Medium

Build a context manager that can create, store, and reuse contexts for different users.

### Exercise 3: Script Compilation
**Skills**: Script class, compilation, reuse
**Difficulty**: ⭐⭐ Medium

Implement a script cache that compiles scripts once and reuses them for better performance.

### Exercise 4: Safe Sandbox Builder
**Skills**: Sandbox creation, built-in control, security
**Difficulty**: ⭐⭐ Medium

Create a safe sandbox environment with only specific built-in objects available.

### Exercise 5: Timeout Protection
**Skills**: Timeout control, error handling, resource limits
**Difficulty**: ⭐⭐⭐ Hard

Build a safe code executor with timeout protection and proper error handling.

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

- [Exercise 1 Solution](./solutions/exercise-1-solution.js)
- [Exercise 2 Solution](./solutions/exercise-2-solution.js)
- [Exercise 3 Solution](./solutions/exercise-3-solution.js)
- [Exercise 4 Solution](./solutions/exercise-4-solution.js)
- [Exercise 5 Solution](./solutions/exercise-5-solution.js)

**View Solutions:**
```bash
cd solutions
node exercise-1-solution.js
node exercise-2-solution.js
# ... etc
```

---

## Key Concepts Summary

### VM Execution Methods

```javascript
const vm = require('vm');

// 1. runInThisContext - Current V8 context, no scope access
const result1 = vm.runInThisContext('2 + 2');

// 2. runInNewContext - New context, one-time use
const result2 = vm.runInNewContext('x * 2', { x: 10 });

// 3. createContext + runInContext - Reusable context
const sandbox = { x: 10 };
vm.createContext(sandbox);
const result3 = vm.runInContext('x * 2', sandbox);
```

### Script Class

```javascript
const vm = require('vm');

// Compile once
const script = new vm.Script('result = x * 2');

// Execute multiple times
const ctx1 = { x: 5 };
vm.createContext(ctx1);
script.runInContext(ctx1); // ctx1.result = 10

const ctx2 = { x: 10 };
vm.createContext(ctx2);
script.runInContext(ctx2); // ctx2.result = 20
```

### Basic Sandbox

```javascript
const vm = require('vm');

const sandbox = {
  console: console,  // Provide console
  Math: Math,        // Provide Math
  value: 42          // Provide data
};

vm.createContext(sandbox);
vm.runInContext('console.log(Math.sqrt(value))', sandbox);
```

### Error Handling

```javascript
const vm = require('vm');

try {
  vm.runInNewContext('throw new Error("Oops!")', {}, {
    timeout: 100,
    displayErrors: true
  });
} catch (err) {
  console.error('VM Error:', err.message);
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Confusing Scope and Context

```javascript
// WRONG - Expecting scope access
let x = 10;
vm.runInThisContext('console.log(x)'); // Error: x is not defined

// RIGHT - Provide values in context
vm.runInNewContext('console.log(x)', { x: 10, console });
```

### ❌ Pitfall 2: Not Handling Timeouts

```javascript
// WRONG - No timeout protection
vm.runInNewContext('while(true) {}'); // Hangs forever!

// RIGHT - Always use timeout for untrusted code
try {
  vm.runInNewContext('while(true) {}', {}, { timeout: 100 });
} catch (err) {
  console.log('Timeout!');
}
```

### ❌ Pitfall 3: Sharing Mutable Objects

```javascript
// WRONG - Sharing mutable objects
const shared = [];
vm.runInNewContext('shared.push("hacked")', { shared });
console.log(shared); // ['hacked'] - modified!

// RIGHT - Pass copies or immutable data
const data = JSON.parse(JSON.stringify([]));
vm.runInNewContext('data.push("safe")', { data });
```

---

## Practice Projects

Build these mini-projects to reinforce your learning:

### Project 1: Math Expression Evaluator
Create a safe calculator that evaluates mathematical expressions:
```javascript
safeCalc('2 + 2'); // 4
safeCalc('Math.sqrt(16)'); // 4
safeCalc('while(true) {}'); // Error: Timeout
```

### Project 2: Variable Playground
Build a REPL-like environment where users can define variables and execute code:
```javascript
playground.execute('x = 10');
playground.execute('y = x * 2');
playground.getState(); // { x: 10, y: 20 }
```

### Project 3: Code Validator
Create a tool that checks if code is safe to run:
```javascript
validator.check('2 + 2'); // { safe: true }
validator.check('require("fs")'); // { safe: false, reason: 'require not allowed' }
```

---

## Testing Your Knowledge

Test your understanding with these questions:

1. **What's the difference between `vm.runInThisContext()` and `eval()`?**
   <details>
   <summary>Answer</summary>

   - `runInThisContext()` runs in current V8 context but not in local scope
   - `eval()` has access to local scope variables
   - `runInThisContext()` is safer as it can't access local variables
   </details>

2. **When should you use `vm.runInNewContext()` vs `vm.createContext()`?**
   <details>
   <summary>Answer</summary>

   - `runInNewContext()` for one-time execution
   - `createContext()` + `runInContext()` for reusable contexts
   - Reusable contexts are more efficient for multiple executions
   </details>

3. **Why is timeout important when running untrusted code?**
   <details>
   <summary>Answer</summary>

   - Prevents infinite loops
   - Prevents resource exhaustion
   - Protects against denial-of-service
   - Essential security measure
   </details>

4. **What's the advantage of using the Script class?**
   <details>
   <summary>Answer</summary>

   - Compile once, execute many times
   - Better performance for repeated execution
   - Can cache compiled code
   - Separates compilation from execution
   </details>

5. **Can VM provide complete security for untrusted code?**
   <details>
   <summary>Answer</summary>

   - **No!** VM alone is not sufficient
   - Can be escaped via prototype chains
   - Should be combined with other security measures
   - Use Worker Threads or OS isolation for true security
   </details>

---

## Quick Reference Card

```javascript
const vm = require('vm');

// Basic Execution
vm.runInThisContext(code);                    // Current context, no scope
vm.runInNewContext(code, sandbox);            // New context, one-time
vm.runInNewContext(code, sandbox, options);   // With options

// Context Management
const ctx = {};
vm.createContext(ctx);                        // Make ctx a context
vm.runInContext(code, ctx);                   // Run in context
vm.isContext(ctx);                            // Check if context

// Script Class
const script = new vm.Script(code);           // Compile script
script.runInThisContext();                    // Run in current
script.runInNewContext(sandbox);              // Run in new
script.runInContext(ctx);                     // Run in existing

// Options
{
  timeout: 100,                               // Max time (ms)
  displayErrors: true,                        // Show errors
  breakOnSigint: true,                        // Ctrl+C handling
  filename: 'script.js'                       // For stack traces
}
```

---

## Next Steps

Once you've completed Level 1:

1. ✅ **Review**: Make sure you understand all core concepts
2. ✅ **Practice**: Complete all exercises
3. ✅ **Experiment**: Modify examples and try new things
4. ✅ **Build**: Create one of the practice projects
5. ➡️ **Advance**: Move to [Level 2: Intermediate](../level-2-intermediate/README.md)

---

## Getting Help

If you're stuck:

1. **Re-read the guides** - Often the answer is in the documentation
2. **Review examples** - See how concepts are applied
3. **Check solutions** - Learn from working code
4. **Experiment** - Try things and see what happens
5. **Read Node.js docs** - Official documentation is valuable

---

## Additional Resources

- [Node.js VM Documentation](https://nodejs.org/api/vm.html)
- [MDN: Execution Context](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)
- [V8 Documentation](https://v8.dev/docs)

---

**Ready to start?** Begin with [Guide 1: Understanding VM](./guides/01-understanding-vm.md) or jump straight to [Example 1](./examples/01-basic-execution.js)!

Happy learning! 🚀
