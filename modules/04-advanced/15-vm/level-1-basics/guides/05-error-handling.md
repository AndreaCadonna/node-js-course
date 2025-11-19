# Error Handling in the VM Module

## Introduction

When executing code in VM contexts, errors can occur at multiple stages: compilation, execution, and during runtime. Understanding how to handle these errors properly is crucial for building robust applications that use the VM module. This guide covers error types, handling patterns, timeout errors, and debugging techniques.

### Why This Matters

Untrusted code will fail - it's not a question of if, but when. Proper error handling prevents crashes, provides useful feedback, and helps you debug issues. Whether you're building a code playground, plugin system, or template engine, robust error handling is essential.

> **Key Insight:** Errors in VM contexts don't automatically crash your application. With proper handling, you can isolate failures, provide meaningful feedback, and keep your application running smoothly.

---

## Table of Contents

- [Types of Errors](#types-of-errors)
- [Compilation Errors](#compilation-errors)
- [Runtime Errors](#runtime-errors)
- [Timeout Errors](#timeout-errors)
- [Try-Catch Patterns](#try-catch-patterns)
- [Error Boundaries](#error-boundaries)
- [Stack Traces](#stack-traces)
- [Debugging Techniques](#debugging-techniques)
- [Error Recovery](#error-recovery)
- [Practical Examples](#practical-examples)
- [Best Practices](#best-practices)
- [Summary](#summary)

---

## Types of Errors

### Three Main Categories

```javascript
const vm = require('vm');

// 1. Compilation Errors (syntax errors)
try {
  new vm.Script('const x = ;'); // Missing value
} catch (err) {
  console.log('Compilation:', err.message);
  // SyntaxError: Unexpected token ';'
}

// 2. Runtime Errors (during execution)
try {
  vm.runInNewContext('unknownVariable');
} catch (err) {
  console.log('Runtime:', err.message);
  // ReferenceError: unknownVariable is not defined
}

// 3. Timeout Errors (execution too long)
try {
  vm.runInNewContext('while(true) {}', {}, {
    timeout: 100
  });
} catch (err) {
  console.log('Timeout:', err.message);
  // Error: Script execution timed out
}
```

### Error Inheritance

```javascript
const vm = require('vm');

try {
  vm.runInNewContext('throw new TypeError("Custom error")');
} catch (err) {
  console.log(err instanceof Error);      // true
  console.log(err instanceof TypeError);  // true
  console.log(err.name);                 // "TypeError"
  console.log(err.message);              // "Custom error"
  console.log(err.stack);                // Full stack trace
}
```

### Visual: Error Types

```
VM Execution Pipeline
│
├─ Compilation Phase
│  └─ SyntaxError
│     • Invalid syntax
│     • Missing tokens
│     • Malformed code
│
├─ Execution Phase
│  ├─ ReferenceError
│  │  • Undefined variables
│  │  • Invalid references
│  │
│  ├─ TypeError
│  │  • Wrong type operations
│  │  • Null/undefined access
│  │
│  ├─ RangeError
│  │  • Invalid array length
│  │  • Out of range values
│  │
│  └─ Custom Errors
│     • User-thrown errors
│     • API errors
│
└─ System Errors
   ├─ Timeout
   │  • Execution too long
   │  • Infinite loops
   │
   └─ Memory
      • Out of memory
      • Stack overflow
```

---

## Compilation Errors

### Detecting Syntax Errors

```javascript
const vm = require('vm');

function compileCode(code, filename = 'user-code.js') {
  try {
    const script = new vm.Script(code, {
      filename: filename,
      displayErrors: true
    });
    return { success: true, script };
  } catch (err) {
    return {
      success: false,
      error: {
        type: 'compilation',
        name: err.name,
        message: err.message,
        stack: err.stack
      }
    };
  }
}

// Test with valid code
const result1 = compileCode('const x = 10;');
console.log(result1.success); // true

// Test with invalid code
const result2 = compileCode('const x = ;');
console.log(result2.success); // false
console.log(result2.error.message); // "Unexpected token ';'"
```

### Parsing Error Details

```javascript
const vm = require('vm');

try {
  new vm.Script(`
    function test() {
      const x = 10
      const y = 20; // Missing semicolon above
    }
  `);
} catch (err) {
  console.log('Name:', err.name);           // SyntaxError
  console.log('Message:', err.message);     // Error description
  console.log('Stack:', err.stack);         // Stack trace

  // Parse line number from stack
  const match = err.stack.match(/:(\d+):/);
  if (match) {
    console.log('Error on line:', match[1]);
  }
}
```

### User-Friendly Error Messages

```javascript
const vm = require('vm');

function compileWithFriendlyError(code) {
  try {
    return new vm.Script(code);
  } catch (err) {
    // Transform technical error to user-friendly message
    let friendly = err.message;

    if (err.message.includes('Unexpected token')) {
      friendly = 'Syntax error: Check for missing or extra characters';
    } else if (err.message.includes('Unexpected end of input')) {
      friendly = 'Syntax error: Code appears incomplete - check for missing closing brackets';
    } else if (err.message.includes('Unexpected identifier')) {
      friendly = 'Syntax error: Unexpected word or variable name';
    }

    throw new Error(friendly + '\n\nOriginal: ' + err.message);
  }
}

try {
  compileWithFriendlyError('const x = {');
} catch (err) {
  console.log(err.message);
  // Syntax error: Code appears incomplete - check for missing closing brackets
  // Original: Unexpected end of input
}
```

---

## Runtime Errors

### Common Runtime Errors

```javascript
const vm = require('vm');

const sandbox = {
  console: console,
  data: null
};

// ReferenceError
try {
  vm.runInNewContext('console.log(unknownVar)', sandbox);
} catch (err) {
  console.log('1.', err.name, ':', err.message);
  // ReferenceError: unknownVar is not defined
}

// TypeError
try {
  vm.runInNewContext('data.property', sandbox);
} catch (err) {
  console.log('2.', err.name, ':', err.message);
  // TypeError: Cannot read property 'property' of null
}

// RangeError
try {
  vm.runInNewContext('new Array(-1)', sandbox);
} catch (err) {
  console.log('3.', err.name, ':', err.message);
  // RangeError: Invalid array length
}

// Custom errors
try {
  vm.runInNewContext('throw new Error("Custom!")', sandbox);
} catch (err) {
  console.log('4.', err.name, ':', err.message);
  // Error: Custom!
}
```

### Catching Errors Inside VM

```javascript
const vm = require('vm');

const sandbox = {
  console: console
};

// Error handled inside VM
vm.runInNewContext(`
  try {
    throw new Error('Internal error');
  } catch (err) {
    console.log('Caught inside VM:', err.message);
  }
`, sandbox);

// Error propagated to outside
try {
  vm.runInNewContext(`
    throw new Error('External error');
  `, sandbox);
} catch (err) {
  console.log('Caught outside VM:', err.message);
}
```

### Safe Property Access

```javascript
const vm = require('vm');

// Unsafe access
const unsafe = `
  console.log(obj.prop.nested.value);
`;

// Safe access with optional chaining
const safe = `
  console.log(obj?.prop?.nested?.value ?? 'default');
`;

const sandbox1 = {
  obj: null,
  console: console
};

try {
  vm.runInNewContext(unsafe, sandbox1);
} catch (err) {
  console.log('Unsafe failed:', err.message);
}

// This works
vm.runInNewContext(safe, { ...sandbox1 });
// Output: default
```

---

## Timeout Errors

### Setting Timeouts

```javascript
const vm = require('vm');

const infiniteLoop = `
  while (true) {
    // Never ends
  }
`;

try {
  vm.runInNewContext(infiniteLoop, {}, {
    timeout: 1000 // 1 second
  });
} catch (err) {
  console.log('Timed out:', err.message);
  // Error: Script execution timed out after 1000ms
}
```

### Detecting Timeout Errors

```javascript
const vm = require('vm');

function executeWithTimeout(code, timeout = 1000) {
  try {
    return {
      success: true,
      result: vm.runInNewContext(code, {}, { timeout })
    };
  } catch (err) {
    // Check if timeout error
    const isTimeout = err.message.includes('timed out');

    return {
      success: false,
      timedOut: isTimeout,
      error: err.message
    };
  }
}

const result1 = executeWithTimeout('1 + 1');
console.log(result1); // { success: true, result: 2 }

const result2 = executeWithTimeout('while(true) {}', 500);
console.log(result2);
// { success: false, timedOut: true, error: 'Script execution timed out...' }
```

### Async Timeout Handling

```javascript
const vm = require('vm');

function executeWithAsyncTimeout(code, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Execution timeout'));
    }, timeout);

    try {
      const result = vm.runInNewContext(code, {});
      clearTimeout(timeoutId);
      resolve(result);
    } catch (err) {
      clearTimeout(timeoutId);
      reject(err);
    }
  });
}

// Usage
executeWithAsyncTimeout('2 + 2', 1000)
  .then(result => console.log('Result:', result))
  .catch(err => console.error('Error:', err.message));
```

### Timeout with Cleanup

```javascript
const vm = require('vm');

class ManagedExecution {
  constructor() {
    this.resources = [];
  }

  execute(code, sandbox, timeout = 1000) {
    try {
      const result = vm.runInNewContext(code, sandbox, { timeout });
      return { success: true, result };
    } catch (err) {
      // Cleanup on timeout
      if (err.message.includes('timed out')) {
        this.cleanup();
        return {
          success: false,
          timedOut: true,
          message: 'Execution stopped due to timeout'
        };
      }
      throw err;
    }
  }

  cleanup() {
    console.log('Cleaning up resources...');
    this.resources.forEach(resource => resource.dispose());
    this.resources = [];
  }
}
```

---

## Try-Catch Patterns

### Basic Pattern

```javascript
const vm = require('vm');

function safeExecute(code, sandbox = {}) {
  try {
    const result = vm.runInNewContext(code, sandbox, {
      timeout: 1000
    });
    return { success: true, result };
  } catch (err) {
    return {
      success: false,
      error: {
        name: err.name,
        message: err.message
      }
    };
  }
}

const result = safeExecute('x + 1', { x: 5 });
console.log(result); // { success: true, result: 6 }
```

### Nested Try-Catch

```javascript
const vm = require('vm');

function executeWithValidation(code, sandbox) {
  // Compilation try-catch
  let script;
  try {
    script = new vm.Script(code, {
      displayErrors: true
    });
  } catch (err) {
    return {
      phase: 'compilation',
      error: err.message
    };
  }

  // Execution try-catch
  try {
    const result = script.runInNewContext(sandbox, {
      timeout: 1000
    });
    return {
      phase: 'success',
      result
    };
  } catch (err) {
    return {
      phase: 'execution',
      error: err.message
    };
  }
}

console.log(executeWithValidation('const x =', {}));
// { phase: 'compilation', error: '...' }

console.log(executeWithValidation('unknown', {}));
// { phase: 'execution', error: '...' }

console.log(executeWithValidation('1 + 1', {}));
// { phase: 'success', result: 2 }
```

### Error Classification

```javascript
const vm = require('vm');

function classifyError(err) {
  if (err.message.includes('timed out')) {
    return 'timeout';
  } else if (err.name === 'SyntaxError') {
    return 'syntax';
  } else if (err.name === 'ReferenceError') {
    return 'reference';
  } else if (err.name === 'TypeError') {
    return 'type';
  } else {
    return 'unknown';
  }
}

function executeWithClassification(code, sandbox = {}) {
  try {
    const result = vm.runInNewContext(code, sandbox, {
      timeout: 1000
    });
    return { success: true, result };
  } catch (err) {
    return {
      success: false,
      errorType: classifyError(err),
      message: err.message
    };
  }
}

console.log(executeWithClassification('while(true){}'));
// { success: false, errorType: 'timeout', message: '...' }

console.log(executeWithClassification('unknownVar'));
// { success: false, errorType: 'reference', message: '...' }
```

### Retry Pattern

```javascript
const vm = require('vm');

async function executeWithRetry(code, sandbox, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = vm.runInNewContext(code, sandbox, {
        timeout: 1000
      });
      return { success: true, result, attempt };
    } catch (err) {
      // Don't retry syntax errors
      if (err.name === 'SyntaxError') {
        return {
          success: false,
          error: err.message,
          attempt
        };
      }

      // Last attempt - fail
      if (attempt === maxRetries) {
        return {
          success: false,
          error: err.message,
          attempt,
          retriesExhausted: true
        };
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
```

---

## Error Boundaries

### Isolating Errors

```javascript
const vm = require('vm');

class VMErrorBoundary {
  constructor() {
    this.errors = [];
  }

  execute(code, sandbox = {}) {
    try {
      const result = vm.runInNewContext(code, sandbox, {
        timeout: 1000
      });
      return { success: true, result };
    } catch (err) {
      // Log error but don't throw
      this.errors.push({
        timestamp: Date.now(),
        code: code.substring(0, 100),
        error: err.message
      });

      return {
        success: false,
        error: err.message
      };
    }
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }
}

const boundary = new VMErrorBoundary();

boundary.execute('1 + 1'); // OK
boundary.execute('throw new Error("Oops")'); // Caught
boundary.execute('2 + 2'); // OK

console.log(boundary.getErrors());
// Array with one error
```

### Multiple Code Execution

```javascript
const vm = require('vm');

function executeBatch(scripts) {
  const results = [];

  for (const script of scripts) {
    try {
      const result = vm.runInNewContext(script.code, script.sandbox || {}, {
        timeout: script.timeout || 1000
      });

      results.push({
        id: script.id,
        success: true,
        result
      });
    } catch (err) {
      // Error in one script doesn't stop others
      results.push({
        id: script.id,
        success: false,
        error: err.message
      });
    }
  }

  return results;
}

const scripts = [
  { id: 1, code: '1 + 1' },
  { id: 2, code: 'throw new Error("Fail")' },
  { id: 3, code: '3 + 3' }
];

const results = executeBatch(scripts);
console.log(results);
// [
//   { id: 1, success: true, result: 2 },
//   { id: 2, success: false, error: 'Fail' },
//   { id: 3, success: true, result: 6 }
// ]
```

---

## Stack Traces

### Understanding Stack Traces

```javascript
const vm = require('vm');

try {
  new vm.Script(`
    function level3() {
      throw new Error('Deep error');
    }

    function level2() {
      level3();
    }

    function level1() {
      level2();
    }

    level1();
  `).runInThisContext();
} catch (err) {
  console.log(err.stack);
  // Error: Deep error
  //   at level3 (evalmachine.<anonymous>:3:13)
  //   at level2 (evalmachine.<anonymous>:7:7)
  //   at level1 (evalmachine.<anonymous>:11:7)
  //   at evalmachine.<anonymous>:14:5
}
```

### Custom Filenames in Stack Traces

```javascript
const vm = require('vm');

try {
  new vm.Script(`
    throw new Error('Error in user code');
  `, {
    filename: 'user-template.js',
    lineOffset: 10 // Start at line 10
  }).runInThisContext();
} catch (err) {
  console.log(err.stack);
  // Error: Error in user code
  //   at user-template.js:11:11
  //   ↑ Shows your custom filename!
}
```

### Parsing Stack Traces

```javascript
const vm = require('vm');

function parseStackTrace(err) {
  const lines = err.stack.split('\n');

  return {
    message: lines[0],
    frames: lines.slice(1).map(line => {
      const match = line.match(/at (.+?) \((.+?):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          file: match[2],
          line: parseInt(match[3]),
          column: parseInt(match[4])
        };
      }
      return null;
    }).filter(Boolean)
  };
}

try {
  vm.runInNewContext(`
    function test() {
      throw new Error('Test error');
    }
    test();
  `, {}, {
    filename: 'test.js'
  });
} catch (err) {
  const parsed = parseStackTrace(err);
  console.log(JSON.stringify(parsed, null, 2));
}
```

---

## Debugging Techniques

### Console Debugging

```javascript
const vm = require('vm');

const debugConsole = {
  log: (...args) => {
    console.log('[DEBUG]', ...args);
  },
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
  trace: () => {
    console.trace('[TRACE]');
  }
};

vm.runInNewContext(`
  console.log('Step 1');
  console.trace();
  console.log('Step 2');
`, {
  console: debugConsole
});
```

### Step-by-Step Execution

```javascript
const vm = require('vm');

class StepDebugger {
  constructor(code) {
    this.statements = code.split(';').filter(s => s.trim());
    this.currentStep = 0;
    this.context = vm.createContext({
      console: console
    });
  }

  step() {
    if (this.currentStep >= this.statements.length) {
      return { done: true };
    }

    const statement = this.statements[this.currentStep].trim() + ';';
    console.log(`Step ${this.currentStep + 1}: ${statement}`);

    try {
      const result = vm.runInContext(statement, this.context);
      this.currentStep++;
      return {
        done: false,
        statement,
        result,
        success: true
      };
    } catch (err) {
      return {
        done: false,
        statement,
        error: err.message,
        success: false
      };
    }
  }

  run() {
    while (this.currentStep < this.statements.length) {
      const result = this.step();
      if (!result.success) {
        console.error('Error:', result.error);
        break;
      }
    }
  }
}

const debugger = new StepDebugger(`
  const x = 10;
  const y = 20;
  const sum = x + y;
  console.log(sum)
`);

debugger.run();
```

### Logging Wrapper

```javascript
const vm = require('vm');

function executeWithLogging(code, sandbox = {}) {
  const log = [];

  const loggingSandbox = {
    ...sandbox,
    console: {
      log: (...args) => {
        const message = args.join(' ');
        log.push({ type: 'log', message, timestamp: Date.now() });
        console.log(message);
      }
    }
  };

  try {
    const result = vm.runInNewContext(code, loggingSandbox, {
      timeout: 1000
    });

    return {
      success: true,
      result,
      log
    };
  } catch (err) {
    log.push({
      type: 'error',
      message: err.message,
      timestamp: Date.now()
    });

    return {
      success: false,
      error: err.message,
      log
    };
  }
}

const result = executeWithLogging(`
  console.log('Starting...');
  const x = 10;
  console.log('x =', x);
  throw new Error('Oops');
`);

console.log('Execution log:', result.log);
```

---

## Error Recovery

### Graceful Degradation

```javascript
const vm = require('vm');

function executeWithFallback(code, fallbackCode, sandbox = {}) {
  try {
    return {
      primary: true,
      result: vm.runInNewContext(code, sandbox, {
        timeout: 1000
      })
    };
  } catch (err) {
    console.log('Primary failed, using fallback');

    try {
      return {
        primary: false,
        result: vm.runInNewContext(fallbackCode, sandbox, {
          timeout: 1000
        })
      };
    } catch (fallbackErr) {
      return {
        primary: false,
        error: 'Both primary and fallback failed',
        primaryError: err.message,
        fallbackError: fallbackErr.message
      };
    }
  }
}

const result = executeWithFallback(
  'unknownVar + 1',      // Will fail
  '0',                   // Fallback returns 0
  {}
);

console.log(result);
```

### State Rollback

```javascript
const vm = require('vm');

class RollbackContext {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.snapshots = [];
  }

  snapshot() {
    this.snapshots.push(JSON.parse(JSON.stringify(this.state)));
  }

  rollback() {
    if (this.snapshots.length > 0) {
      this.state = this.snapshots.pop();
      return true;
    }
    return false;
  }

  execute(code) {
    this.snapshot(); // Save state before execution

    const context = vm.createContext({
      ...this.state,
      console: console
    });

    try {
      vm.runInContext(code, context);
      // Update state on success
      this.state = { ...context };
      return { success: true };
    } catch (err) {
      // Rollback on error
      this.rollback();
      return {
        success: false,
        error: err.message
      };
    }
  }
}

const ctx = new RollbackContext({ x: 10 });

ctx.execute('x = 20'); // Success, x = 20
console.log(ctx.state.x); // 20

ctx.execute('throw new Error("Oops")'); // Fails, rolls back
console.log(ctx.state.x); // 20 (not changed)
```

---

## Practical Examples

### Example 1: Template Engine with Error Reporting

```javascript
const vm = require('vm');

class TemplateEngine {
  render(template, data) {
    const code = `\`${template}\``;

    try {
      // Try to compile
      const script = new vm.Script(code, {
        filename: 'template.js',
        displayErrors: true
      });

      // Try to execute
      return {
        success: true,
        output: script.runInNewContext(data, {
          timeout: 1000
        })
      };
    } catch (err) {
      // Determine error type
      const isCompilation = err.name === 'SyntaxError';
      const isTimeout = err.message.includes('timed out');

      return {
        success: false,
        errorType: isCompilation ? 'syntax' :
                   isTimeout ? 'timeout' : 'runtime',
        message: this.formatError(err, template),
        details: err.message
      };
    }
  }

  formatError(err, template) {
    if (err.name === 'SyntaxError') {
      return `Template syntax error: ${err.message}\n\nTemplate: ${template}`;
    } else if (err.message.includes('timed out')) {
      return 'Template execution timed out (possible infinite loop)';
    } else {
      return `Template error: ${err.message}`;
    }
  }
}

const engine = new TemplateEngine();

// Success
console.log(engine.render('Hello ${name}!', { name: 'Alice' }));

// Syntax error
console.log(engine.render('Hello ${name', { name: 'Bob' }));

// Runtime error
console.log(engine.render('Hello ${user.name}', {}));
```

### Example 2: Safe Expression Evaluator

```javascript
const vm = require('vm');

class SafeEvaluator {
  constructor() {
    this.cache = new Map();
  }

  evaluate(expression, variables = {}) {
    // Validate expression
    const validation = this.validate(expression);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Get or compile script
    let script = this.cache.get(expression);
    if (!script) {
      try {
        script = new vm.Script(expression, {
          filename: 'expression.js'
        });
        this.cache.set(expression, script);
      } catch (err) {
        return {
          success: false,
          error: `Compilation error: ${err.message}`,
          type: 'syntax'
        };
      }
    }

    // Execute
    try {
      const result = script.runInNewContext({
        ...variables,
        Math: Math
      }, {
        timeout: 100
      });

      return {
        success: true,
        result
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        type: err.message.includes('timed out') ? 'timeout' : 'runtime'
      };
    }
  }

  validate(expression) {
    // Check length
    if (expression.length > 500) {
      return { valid: false, error: 'Expression too long' };
    }

    // Check for dangerous patterns
    const dangerous = ['require', 'process', 'eval', 'Function'];
    for (const keyword of dangerous) {
      if (expression.includes(keyword)) {
        return {
          valid: false,
          error: `Dangerous keyword: ${keyword}`
        };
      }
    }

    return { valid: true };
  }
}

const evaluator = new SafeEvaluator();

console.log(evaluator.evaluate('2 + 2'));
// { success: true, result: 4 }

console.log(evaluator.evaluate('Math.sqrt(x)', { x: 16 }));
// { success: true, result: 4 }

console.log(evaluator.evaluate('process.exit()'));
// { success: false, error: 'Dangerous keyword: process' }

console.log(evaluator.evaluate('while(true){}'));
// { success: false, error: '...timed out...', type: 'timeout' }
```

### Example 3: Plugin System with Error Isolation

```javascript
const vm = require('vm');

class PluginSystem {
  constructor() {
    this.plugins = new Map();
  }

  loadPlugin(name, code) {
    const sandbox = {
      plugin: {
        name: name,
        exports: {},
        log: (...args) => console.log(`[${name}]`, ...args),
        error: (...args) => console.error(`[${name}]`, ...args)
      }
    };

    try {
      // Compile
      const script = new vm.Script(code, {
        filename: `${name}.js`,
        displayErrors: true
      });

      // Execute
      script.runInNewContext(sandbox, {
        timeout: 5000
      });

      // Store plugin
      this.plugins.set(name, {
        name,
        exports: sandbox.plugin.exports,
        status: 'loaded'
      });

      return {
        success: true,
        message: `Plugin "${name}" loaded successfully`
      };
    } catch (err) {
      // Store error state
      this.plugins.set(name, {
        name,
        status: 'error',
        error: err.message
      });

      return {
        success: false,
        error: `Failed to load plugin "${name}": ${err.message}`,
        details: {
          type: err.name,
          message: err.message,
          stack: err.stack
        }
      };
    }
  }

  executePlugin(name, method, ...args) {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      return {
        success: false,
        error: `Plugin "${name}" not found`
      };
    }

    if (plugin.status === 'error') {
      return {
        success: false,
        error: `Plugin "${name}" failed to load: ${plugin.error}`
      };
    }

    if (typeof plugin.exports[method] !== 'function') {
      return {
        success: false,
        error: `Method "${method}" not found in plugin "${name}"`
      };
    }

    try {
      const result = plugin.exports[method](...args);
      return {
        success: true,
        result
      };
    } catch (err) {
      return {
        success: false,
        error: `Plugin "${name}" method "${method}" failed: ${err.message}`
      };
    }
  }

  getStatus() {
    const status = {};
    for (const [name, plugin] of this.plugins) {
      status[name] = plugin.status;
      if (plugin.error) {
        status[name + '_error'] = plugin.error;
      }
    }
    return status;
  }
}

const system = new PluginSystem();

// Load valid plugin
system.loadPlugin('math', `
  plugin.exports.add = (a, b) => a + b;
  plugin.log('Math plugin loaded');
`);

// Load invalid plugin
system.loadPlugin('broken', `
  throw new Error('This plugin is broken');
`);

// Execute plugins
console.log(system.executePlugin('math', 'add', 5, 3));
// { success: true, result: 8 }

console.log(system.executePlugin('broken', 'anything'));
// { success: false, error: '...' }

console.log(system.getStatus());
// { math: 'loaded', broken: 'error', broken_error: '...' }
```

---

## Best Practices

### 1. Always Use Try-Catch

```javascript
// ✅ Always wrap VM execution
try {
  vm.runInNewContext(code, sandbox, { timeout: 1000 });
} catch (err) {
  console.error('Execution failed:', err.message);
}
```

### 2. Set Timeouts

```javascript
// ✅ Always set timeout
vm.runInNewContext(code, sandbox, {
  timeout: 1000 // Prevents infinite loops
});
```

### 3. Provide Helpful Error Messages

```javascript
// ✅ Transform errors for users
catch (err) {
  if (err.name === 'SyntaxError') {
    return 'Your code has a syntax error. Please check for typos.';
  }
  return `Error: ${err.message}`;
}
```

### 4. Log Errors for Debugging

```javascript
// ✅ Log errors with context
catch (err) {
  console.error('VM Error:', {
    code: code.substring(0, 100),
    error: err.message,
    stack: err.stack,
    timestamp: new Date()
  });
}
```

### 5. Isolate Error Handling

```javascript
// ✅ One error shouldn't crash everything
scripts.forEach(script => {
  try {
    vm.runInNewContext(script, {});
  } catch (err) {
    console.error(`Script failed: ${err.message}`);
    // Continue with next script
  }
});
```

---

## Summary

### Key Takeaways

1. **Three error types**: Compilation, Runtime, Timeout
2. **Always use try-catch** around VM operations
3. **Set timeouts** to prevent infinite loops
4. **Provide helpful error messages** for users
5. **Isolate errors** - one failure shouldn't break everything
6. **Use filenames** in Script options for better stack traces
7. **Log errors** for debugging and monitoring

### Error Handling Checklist

- [ ] Wrap VM operations in try-catch
- [ ] Set timeout option
- [ ] Handle compilation errors separately
- [ ] Classify error types
- [ ] Provide user-friendly messages
- [ ] Log errors for debugging
- [ ] Use custom filenames for stack traces
- [ ] Test error scenarios

### Quick Reference

```javascript
const vm = require('vm');

try {
  // Compile with error display
  const script = new vm.Script(code, {
    filename: 'user-code.js',
    displayErrors: true
  });

  // Execute with timeout
  const result = script.runInNewContext(sandbox, {
    timeout: 1000
  });

  return { success: true, result };
} catch (err) {
  // Handle errors
  return {
    success: false,
    errorType: err.name,
    message: err.message,
    isTimeout: err.message.includes('timed out')
  };
}
```

---

## Congratulations!

You've completed all Level 1 guides for the VM module! You now understand:

- ✅ What the VM module is and when to use it
- ✅ Contexts and scope isolation
- ✅ Script compilation and reuse
- ✅ Creating secure sandboxes
- ✅ Handling errors effectively

### Next Steps

Ready for more advanced topics? Check out:
- Level 2: Advanced VM Patterns
- Level 3: Building Production VM Applications
- Level 4: VM Security and Performance

Keep practicing and building with the VM module! 🚀
