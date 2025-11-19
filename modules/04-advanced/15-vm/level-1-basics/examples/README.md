# Level 1: Examples

This directory contains 8 example files demonstrating basic VM concepts.

## Examples

1. **[01-basic-execution.js](./01-basic-execution.js)** - Introduction to VM execution, comparing eval() and vm.runInThisContext()
2. **[02-run-in-new-context.js](./02-run-in-new-context.js)** - Using vm.runInNewContext() for isolated execution
3. **[03-create-context.js](./03-create-context.js)** - Creating reusable contexts with vm.createContext()
4. **[04-global-objects.js](./04-global-objects.js)** - Understanding global objects and built-ins in contexts
5. **[05-script-class.js](./05-script-class.js)** - Using vm.Script for compiled, reusable code
6. **[06-error-handling.js](./06-error-handling.js)** - Handling errors in VM execution
7. **[07-timeout-control.js](./07-timeout-control.js)** - Implementing timeout protection
8. **[08-sandbox-basics.js](./08-sandbox-basics.js)** - Creating safe sandboxed environments

## How to Run

```bash
node 01-basic-execution.js
node 02-run-in-new-context.js
# ... and so on
```

## What You'll Learn

- Different VM execution methods
- Context creation and management
- Script compilation and reuse
- Error handling patterns
- Timeout protection
- Building safe sandboxes
