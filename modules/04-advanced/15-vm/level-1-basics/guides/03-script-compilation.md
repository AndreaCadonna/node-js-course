# Script Compilation in the VM Module

## Introduction

One of the most powerful features of the VM module is the ability to compile JavaScript code once and execute it multiple times in different contexts. This is enabled by the `vm.Script` class, which provides significant performance benefits when you need to run the same code repeatedly.

### Why This Matters

Parsing and compiling JavaScript is expensive. If you're running the same code thousands of times (like in a template engine, rule engine, or code playground), compiling once and reusing the compiled script can dramatically improve performance.

> **Key Insight:** Think of `vm.Script` like a blueprint - you create the blueprint once (compile), then build from it many times (execute) without redoing the design work each time.

---

## Table of Contents

- [Understanding Script Compilation](#understanding-script-compilation)
- [The Script Class](#the-script-class)
- [Compilation Process](#compilation-process)
- [Reuse Benefits](#reuse-benefits)
- [Performance Comparison](#performance-comparison)
- [Script Options](#script-options)
- [Code Caching](#code-caching)
- [Common Patterns](#common-patterns)
- [Practical Examples](#practical-examples)
- [Best Practices](#best-practices)
- [Summary](#summary)

---

## Understanding Script Compilation

### The JavaScript Execution Pipeline

When JavaScript code runs, it goes through several stages:

```
Source Code → Parse → Compile → Execute → Result
```

1. **Parse**: Convert text to Abstract Syntax Tree (AST)
2. **Compile**: Convert AST to bytecode/machine code
3. **Execute**: Run the compiled code

### Without Script Compilation

```javascript
const vm = require('vm');

// Every call does: parse → compile → execute
for (let i = 0; i < 10000; i++) {
  vm.runInNewContext('x + y', { x: i, y: 10 });
  // Parses the same code 10,000 times! ❌
  // Compiles the same code 10,000 times! ❌
}
```

### With Script Compilation

```javascript
const vm = require('vm');

// Compile once: parse → compile
const script = new vm.Script('x + y');

// Execute many times (just execute, no parse/compile)
for (let i = 0; i < 10000; i++) {
  script.runInNewContext({ x: i, y: 10 }); ✅
  // Only execution happens - much faster!
}
```

### Visual Comparison

```
Without Script Class:
┌─────────────────────────────┐
│  for each execution:        │
│    Parse                    │  ← Repeated
│    Compile                  │  ← Repeated
│    Execute                  │
└─────────────────────────────┘

With Script Class:
┌─────────────────────────────┐
│  Once:                      │
│    Parse                    │  ← One time
│    Compile                  │  ← One time
├─────────────────────────────┤
│  for each execution:        │
│    Execute                  │  ← Only this repeated
└─────────────────────────────┘
```

---

## The Script Class

### Creating a Script

```javascript
const vm = require('vm');

// Basic script creation
const script = new vm.Script('x + y');

// Script with options
const script2 = new vm.Script('x + y', {
  filename: 'calculation.js',
  lineOffset: 0,
  columnOffset: 0,
  displayErrors: true,
  timeout: 1000
});
```

### Script Methods

A compiled script has three execution methods:

```javascript
const vm = require('vm');
const script = new vm.Script('x + 1');

// 1. Run in current context (like runInThisContext)
const result1 = script.runInThisContext();

// 2. Run in new context (like runInNewContext)
const result2 = script.runInNewContext({ x: 10 });

// 3. Run in existing context (like runInContext)
const context = vm.createContext({ x: 20 });
const result3 = script.runInContext(context);
```

### Script Properties

```javascript
const vm = require('vm');

const code = 'x + y';
const script = new vm.Script(code, {
  filename: 'math.js'
});

// Access script source
console.log(script.sourceMapURL);  // undefined (if no source map)
console.log(script.cachedData);    // undefined (initially)

// Script is immutable - code cannot be changed
// script.code is not accessible (internal)
```

---

## Compilation Process

### What Happens During Compilation

```javascript
const vm = require('vm');

const code = `
  function add(a, b) {
    return a + b;
  }
  add(x, y);
`;

// During new vm.Script():
// 1. Parse: Code → AST
// 2. Validate: Check syntax errors
// 3. Compile: AST → Bytecode
// 4. Store: Keep compiled bytecode

const script = new vm.Script(code);

// Compilation happens here ↑
// Execution happens here ↓

const result = script.runInNewContext({ x: 5, y: 3 });
console.log(result); // 8
```

### Compilation Errors

```javascript
const vm = require('vm');

try {
  // Syntax error detected during compilation
  const script = new vm.Script('const x = ;');
} catch (err) {
  console.error('Compilation error:', err.message);
  // SyntaxError: Unexpected token ';'
}

// Script was never created - compilation failed
```

### Compile-Time vs Runtime Errors

```javascript
const vm = require('vm');

// ✅ Compiles successfully (syntax is valid)
const script = new vm.Script('unknownVariable + 1');

try {
  // ❌ Runtime error (variable not defined)
  script.runInNewContext({});
} catch (err) {
  console.error('Runtime error:', err.message);
  // ReferenceError: unknownVariable is not defined
}
```

---

## Reuse Benefits

### Performance Benefits

**Script compilation provides:**

1. **Faster execution** - No re-parsing
2. **Reduced CPU usage** - Compile once, not N times
3. **Better memory efficiency** - One compiled version
4. **Consistent performance** - No compilation jitter

### When to Use Script Compilation

✅ **Use Script when:**

```javascript
// 1. Running same code many times
const template = new vm.Script('name.toUpperCase()');
users.forEach(user => {
  const result = template.runInNewContext({ name: user.name });
});

// 2. Pre-compiling templates
const templates = {
  welcome: new vm.Script('`Welcome ${name}!`'),
  goodbye: new vm.Script('`Goodbye ${name}!`')
};

// 3. Rule engines
const rules = [
  new vm.Script('age >= 18'),
  new vm.Script('country === "US"'),
  new vm.Script('verified === true')
];

rules.forEach(rule => {
  if (rule.runInNewContext(user)) {
    console.log('Rule passed');
  }
});
```

❌ **Don't use Script when:**

```javascript
// 1. Running code only once
vm.runInNewContext('x + 1', { x: 5 }); // Simpler

// 2. Code changes every time
users.forEach(user => {
  // Different code each time - can't reuse
  vm.runInNewContext(user.customCode, sandbox);
});

// 3. Very simple operations
const result = 2 + 2; // Just do it directly!
```

---

## Performance Comparison

### Benchmark Example

```javascript
const vm = require('vm');

const code = 'Math.sqrt(x * x + y * y)';
const iterations = 100000;

// Method 1: Without compilation
console.time('Without Script');
for (let i = 0; i < iterations; i++) {
  vm.runInNewContext(code, { x: i, y: i });
}
console.timeEnd('Without Script');

// Method 2: With compilation
console.time('With Script');
const script = new vm.Script(code);
for (let i = 0; i < iterations; i++) {
  script.runInNewContext({ x: i, y: i });
}
console.timeEnd('With Script');

// Typical results:
// Without Script: ~2000ms
// With Script: ~1000ms
// 2x faster! ✅
```

### Performance with Context Reuse

```javascript
const vm = require('vm');

const code = 'x = x + 1';
const iterations = 100000;

// Method 1: New context each time
console.time('New context each time');
const script1 = new vm.Script(code);
for (let i = 0; i < iterations; i++) {
  script1.runInNewContext({ x: i });
}
console.timeEnd('New context each time');

// Method 2: Reuse context (fastest!)
console.time('Reuse context');
const script2 = new vm.Script(code);
const context = vm.createContext({ x: 0 });
for (let i = 0; i < iterations; i++) {
  script2.runInContext(context);
}
console.timeEnd('Reuse context');

// Typical results:
// New context each time: ~1000ms
// Reuse context: ~100ms
// 10x faster! ✅✅
```

### Memory Comparison

```javascript
const vm = require('vm');

const code = 'x + 1';

// Without Script: Memory used each execution
function withoutScript() {
  for (let i = 0; i < 10000; i++) {
    vm.runInNewContext(code, { x: i });
    // Creates temporary AST and bytecode each time
  }
}

// With Script: Memory used once
function withScript() {
  const script = new vm.Script(code);
  for (let i = 0; i < 10000; i++) {
    script.runInNewContext({ x: i });
    // Reuses same compiled bytecode
  }
}

// Script version uses less total memory
```

---

## Script Options

### Common Options

```javascript
const vm = require('vm');

const script = new vm.Script(code, {
  // Filename for stack traces
  filename: 'user-script.js',

  // Line offset for error reporting
  lineOffset: 0,

  // Column offset for error reporting
  columnOffset: 0,

  // Display compilation errors
  displayErrors: true,

  // Timeout for execution (ms)
  timeout: 1000,

  // Enable code caching
  produceCachedData: true,

  // Use cached data from previous compilation
  cachedData: undefined,

  // Import module dynamically
  importModuleDynamically: undefined
});
```

### Filename Option

```javascript
const vm = require('vm');

// Without filename
const script1 = new vm.Script('throw new Error("Oops")');
try {
  script1.runInThisContext();
} catch (err) {
  console.log(err.stack);
  // Error: Oops
  //   at evalmachine.<anonymous>:1:7
}

// With filename (better debugging!)
const script2 = new vm.Script('throw new Error("Oops")', {
  filename: 'user-code.js'
});
try {
  script2.runInThisContext();
} catch (err) {
  console.log(err.stack);
  // Error: Oops
  //   at user-code.js:1:7
  //   ↑ Much clearer!
}
```

### Line and Column Offsets

```javascript
const vm = require('vm');

// Useful when embedding code in larger file
const wrappedCode = `
// Header comments
// Line 2
const result = x + y; // Line 3 (actual code)
`;

const script = new vm.Script('const result = x + y;', {
  filename: 'embedded.js',
  lineOffset: 2,    // Skip 2 header lines
  columnOffset: 0
});

// Errors now report correct line numbers
```

### Timeout Option

```javascript
const vm = require('vm');

const infiniteLoop = new vm.Script('while(true) {}', {
  filename: 'infinite.js'
});

try {
  infiniteLoop.runInNewContext({}, {
    timeout: 1000 // Kill after 1 second
  });
} catch (err) {
  console.log(err.message);
  // Script execution timed out after 1000ms
}
```

---

## Code Caching

### What is Code Caching?

Code caching saves the compiled bytecode to reuse across process restarts:

```javascript
const vm = require('vm');
const fs = require('fs');

const code = fs.readFileSync('template.js', 'utf8');

// First run: Compile and cache
const script1 = new vm.Script(code, {
  produceCachedData: true
});

// Save cached data
if (script1.cachedDataProduced) {
  fs.writeFileSync('template.cache', script1.cachedData);
  console.log('Cached data saved');
}

// Later/different process: Use cached data
const cachedData = fs.readFileSync('template.cache');

const script2 = new vm.Script(code, {
  cachedData: cachedData
});

if (script2.cachedDataRejected) {
  console.log('Cache invalid - recompiled');
} else {
  console.log('Used cached compilation!');
}
```

### Benefits of Code Caching

```javascript
// Without caching
const script = new vm.Script(largeTemplateCode);
// Parse + Compile: ~50ms

// With caching (subsequent runs)
const script = new vm.Script(largeTemplateCode, {
  cachedData: cache
});
// Just validate cache: ~5ms
// 10x faster startup! ✅
```

### Cache Invalidation

```javascript
const vm = require('vm');

const code1 = 'x + 1';
const script1 = new vm.Script(code1, {
  produceCachedData: true
});
const cache = script1.cachedData;

// Try to use cache with different code
const code2 = 'x + 2'; // Different!
const script2 = new vm.Script(code2, {
  cachedData: cache
});

console.log(script2.cachedDataRejected); // true
// Cache rejected - code doesn't match
```

---

## Common Patterns

### Pattern 1: Template Compilation

```javascript
const vm = require('vm');

class TemplateEngine {
  constructor() {
    this.compiled = new Map();
  }

  compile(name, template) {
    const code = `\`${template}\``;
    const script = new vm.Script(code, {
      filename: `${name}.template`
    });
    this.compiled.set(name, script);
  }

  render(name, data) {
    const script = this.compiled.get(name);
    if (!script) throw new Error(`Template ${name} not found`);

    return script.runInNewContext(data);
  }
}

const engine = new TemplateEngine();
engine.compile('welcome', 'Hello ${name}! You have ${count} messages.');

console.log(engine.render('welcome', {
  name: 'Alice',
  count: 5
}));
// "Hello Alice! You have 5 messages."
```

### Pattern 2: Rule Engine

```javascript
const vm = require('vm');

class RuleEngine {
  constructor() {
    this.rules = [];
  }

  addRule(name, condition, action) {
    this.rules.push({
      name,
      condition: new vm.Script(condition),
      action: new vm.Script(action)
    });
  }

  evaluate(context) {
    const vmContext = vm.createContext(context);

    this.rules.forEach(rule => {
      try {
        const matches = rule.condition.runInContext(vmContext);
        if (matches) {
          console.log(`Rule '${rule.name}' matched`);
          rule.action.runInContext(vmContext);
        }
      } catch (err) {
        console.error(`Rule '${rule.name}' error:`, err.message);
      }
    });
  }
}

const engine = new RuleEngine();

engine.addRule(
  'adult',
  'age >= 18',
  'category = "adult"'
);

engine.addRule(
  'premium',
  'score > 100',
  'tier = "premium"'
);

const user = { age: 25, score: 150 };
engine.evaluate(user);
console.log(user); // { age: 25, score: 150, category: 'adult', tier: 'premium' }
```

### Pattern 3: Expression Evaluator

```javascript
const vm = require('vm');

class ExpressionEvaluator {
  constructor() {
    this.cache = new Map();
  }

  evaluate(expression, variables) {
    // Get from cache or compile
    let script = this.cache.get(expression);

    if (!script) {
      script = new vm.Script(expression, {
        filename: 'expression.js'
      });
      this.cache.set(expression, script);
    }

    return script.runInNewContext({
      ...variables,
      Math: Math
    }, {
      timeout: 100
    });
  }
}

const evaluator = new ExpressionEvaluator();

console.log(evaluator.evaluate('a + b', { a: 5, b: 3 }));           // 8
console.log(evaluator.evaluate('Math.sqrt(x)', { x: 16 }));          // 4
console.log(evaluator.evaluate('price * (1 - discount)', {
  price: 100,
  discount: 0.2
})); // 80
```

### Pattern 4: Script Library

```javascript
const vm = require('vm');
const fs = require('fs');
const path = require('path');

class ScriptLibrary {
  constructor(directory) {
    this.directory = directory;
    this.scripts = new Map();
  }

  load(filename) {
    const filepath = path.join(this.directory, filename);
    const code = fs.readFileSync(filepath, 'utf8');

    const script = new vm.Script(code, {
      filename: filename,
      produceCachedData: true
    });

    this.scripts.set(filename, script);

    // Save cache
    if (script.cachedDataProduced) {
      fs.writeFileSync(
        `${filepath}.cache`,
        script.cachedData
      );
    }
  }

  execute(filename, context) {
    const script = this.scripts.get(filename);
    if (!script) throw new Error(`Script ${filename} not loaded`);

    return script.runInNewContext(context);
  }
}

const lib = new ScriptLibrary('./scripts');
lib.load('calculator.js');
lib.load('formatter.js');

const result = lib.execute('calculator.js', { x: 10, y: 5 });
```

---

## Practical Examples

### Example 1: Formula Calculator

```javascript
const vm = require('vm');

class FormulaCalculator {
  constructor() {
    this.formulas = new Map();
  }

  defineFormula(name, formula) {
    const script = new vm.Script(formula, {
      filename: `formula-${name}.js`
    });
    this.formulas.set(name, script);
  }

  calculate(name, variables) {
    const formula = this.formulas.get(name);
    if (!formula) throw new Error(`Formula ${name} not found`);

    return formula.runInNewContext({
      ...variables,
      Math: Math
    }, {
      timeout: 500
    });
  }
}

const calc = new FormulaCalculator();

// Define formulas (compile once)
calc.defineFormula('bmi', 'weight / ((height / 100) ** 2)');
calc.defineFormula('area', 'Math.PI * radius ** 2');
calc.defineFormula('compound', 'principal * Math.pow(1 + rate, years)');

// Use many times (fast execution)
console.log(calc.calculate('bmi', { weight: 70, height: 175 }));
console.log(calc.calculate('area', { radius: 5 }));
console.log(calc.calculate('compound', {
  principal: 1000,
  rate: 0.05,
  years: 10
}));
```

### Example 2: Configuration DSL

```javascript
const vm = require('vm');

class ConfigDSL {
  constructor() {
    this.configScript = null;
  }

  compile(dslCode) {
    const wrapped = `
      const config = {};

      function set(key, value) {
        config[key] = value;
      }

      function env(key, defaultValue) {
        return process.env[key] || defaultValue;
      }

      ${dslCode}

      config; // Return config
    `;

    this.configScript = new vm.Script(wrapped, {
      filename: 'config.dsl'
    });
  }

  evaluate(environment = {}) {
    return this.configScript.runInNewContext({
      process: { env: environment }
    });
  }
}

const dsl = new ConfigDSL();

// Compile DSL once
dsl.compile(`
  set('port', env('PORT', '3000'));
  set('database', env('DB_URL', 'localhost'));
  set('debug', env('DEBUG', 'false') === 'true');
`);

// Evaluate with different environments
console.log(dsl.evaluate({ PORT: '8080', DEBUG: 'true' }));
// { port: '8080', database: 'localhost', debug: true }

console.log(dsl.evaluate({ DB_URL: 'prod-db.com' }));
// { port: '3000', database: 'prod-db.com', debug: false }
```

### Example 3: Batch Processor

```javascript
const vm = require('vm');

class BatchProcessor {
  constructor(transformCode) {
    this.transform = new vm.Script(`(${transformCode})`, {
      filename: 'transform.js'
    });
  }

  process(items) {
    const results = [];

    // Create context with shared utilities
    const context = vm.createContext({
      push: (item) => results.push(item),
      console: console
    });

    items.forEach((item, index) => {
      // Add current item to context
      context.item = item;
      context.index = index;

      try {
        this.transform.runInContext(context);
      } catch (err) {
        console.error(`Error processing item ${index}:`, err.message);
      }
    });

    return results;
  }
}

const processor = new BatchProcessor(`
  // Transform function (compiled once)
  if (item.value > 10) {
    push({
      id: item.id,
      doubled: item.value * 2
    });
  }
`);

const items = [
  { id: 1, value: 5 },
  { id: 2, value: 15 },
  { id: 3, value: 20 }
];

const results = processor.process(items);
console.log(results);
// [ { id: 2, doubled: 30 }, { id: 3, doubled: 40 } ]
```

---

## Best Practices

### 1. Compile Once, Execute Many

```javascript
// ❌ Bad - Compiling repeatedly
for (let i = 0; i < 1000; i++) {
  const script = new vm.Script('x + 1');
  script.runInNewContext({ x: i });
}

// ✅ Good - Compile once
const script = new vm.Script('x + 1');
for (let i = 0; i < 1000; i++) {
  script.runInNewContext({ x: i });
}
```

### 2. Always Provide Filename

```javascript
// ❌ Bad - No filename
const script = new vm.Script(code);

// ✅ Good - Filename for debugging
const script = new vm.Script(code, {
  filename: 'user-template.js'
});
```

### 3. Handle Compilation Errors

```javascript
// ✅ Good - Handle errors properly
function compileScript(code, name) {
  try {
    return new vm.Script(code, {
      filename: name,
      displayErrors: true
    });
  } catch (err) {
    console.error(`Failed to compile ${name}:`, err.message);
    return null;
  }
}
```

### 4. Use Caching for Large Scripts

```javascript
// ✅ Good - Cache large templates
const script = new vm.Script(largeTemplate, {
  filename: 'template.js',
  produceCachedData: true
});

if (script.cachedDataProduced) {
  saveCache(script.cachedData);
}
```

### 5. Set Timeouts for Execution

```javascript
// ✅ Good - Always use timeout
const script = new vm.Script(userCode);

script.runInNewContext(sandbox, {
  timeout: 1000 // Prevent infinite loops
});
```

---

## Summary

### Key Takeaways

1. **vm.Script** compiles code once for multiple executions
2. **Compilation** = Parse + Compile (expensive)
3. **Execution** = Run compiled code (fast)
4. **Performance** = 2-10x faster for repeated execution
5. **Code caching** = Save bytecode across process restarts
6. **Best for** = Templates, rules, formulas, DSLs

### Performance Guidelines

```javascript
// One-time execution
vm.runInNewContext(code, sandbox); // OK

// 10-100 executions
const script = new vm.Script(code);
script.runInNewContext(sandbox); // Better

// 1000+ executions
const script = new vm.Script(code);
const context = vm.createContext(sandbox);
script.runInContext(context); // Best
```

### Quick Reference

```javascript
const vm = require('vm');

// Create script
const script = new vm.Script(code, {
  filename: 'script.js',
  timeout: 1000,
  produceCachedData: true
});

// Execute
script.runInThisContext(options);
script.runInNewContext(sandbox, options);
script.runInContext(context, options);

// Check cache
if (script.cachedDataProduced) {
  save(script.cachedData);
}
```

### Next Steps

- [Sandbox Creation Guide](./04-sandbox-creation.md) - Build secure execution environments
- [Error Handling Guide](./05-error-handling.md) - Handle compilation and runtime errors

---

Ready to learn about creating sandboxes? Continue to the [Sandbox Creation Guide](./04-sandbox-creation.md)!
