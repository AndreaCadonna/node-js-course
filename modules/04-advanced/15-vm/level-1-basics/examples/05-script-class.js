/**
 * 05-script-class.js
 * ==================
 * Using the vm.Script class for compiled, reusable code
 *
 * Key Concepts:
 * - Compiling scripts with vm.Script
 * - Reusing compiled scripts
 * - Performance benefits
 * - Script options and configuration
 *
 * Run: node 05-script-class.js
 */

const vm = require('vm');

console.log('='.repeat(70));
console.log('VM.SCRIPT CLASS - COMPILED REUSABLE CODE');
console.log('='.repeat(70));

// =============================================================================
// 1. BASIC SCRIPT USAGE
// =============================================================================

console.log('\n1. Creating and Using a Script:');
console.log('-'.repeat(70));

// Step 1: Compile the code into a Script
const script = new vm.Script('2 + 2');

// Step 2: Execute the script
const result1 = script.runInThisContext();
console.log('Result:', result1);

console.log('✓ Script compiled and executed');

// =============================================================================
// 2. REUSING SCRIPTS
// =============================================================================

console.log('\n2. Reusing Scripts with Different Contexts:');
console.log('-'.repeat(70));

// Compile once
const calculation = new vm.Script('x * y + z');

// Execute many times with different contexts
const contexts = [
  { x: 2, y: 3, z: 1 },
  { x: 5, y: 4, z: 2 },
  { x: 10, y: 2, z: 5 },
];

contexts.forEach((ctx, i) => {
  vm.createContext(ctx);
  const result = calculation.runInContext(ctx);
  console.log(`Context ${i + 1}: ${ctx.x} * ${ctx.y} + ${ctx.z} = ${result}`);
});

console.log('✓ Same script reused with different contexts');

// =============================================================================
// 3. SCRIPT VS DIRECT EXECUTION
// =============================================================================

console.log('\n3. Comparison: Script vs Direct Execution:');
console.log('-'.repeat(70));

const code = 'Math.sqrt(value)';

// Method 1: Direct execution (compiles each time)
console.log('Method 1: vm.runInNewContext() each time');
console.log(vm.runInNewContext(code, { Math, value: 16 }));
console.log(vm.runInNewContext(code, { Math, value: 25 }));
console.log(vm.runInNewContext(code, { Math, value: 36 }));

// Method 2: Compile once, execute many
console.log('\nMethod 2: Compile once with vm.Script');
const sqrtScript = new vm.Script(code);
[16, 25, 36].forEach(val => {
  const ctx = { Math, value: val };
  vm.createContext(ctx);
  console.log(sqrtScript.runInContext(ctx));
});

console.log('\n✓ Script method is more efficient for repeated execution');

// =============================================================================
// 4. SCRIPT OPTIONS
// =============================================================================

console.log('\n4. Script Options:');
console.log('-'.repeat(70));

const scriptWithOptions = new vm.Script('x + y', {
  filename: 'my-calculation.js',  // For stack traces
  lineOffset: 10,                 // Line number offset
  columnOffset: 5,                // Column offset
  displayErrors: true,            // Display errors clearly
});

const ctx1 = { x: 10, y: 20 };
vm.createContext(ctx1);
const result2 = scriptWithOptions.runInContext(ctx1);

console.log('Result:', result2);
console.log('Script filename:', scriptWithOptions.filename || 'evalmachine.<anonymous>');
console.log('✓ Options help with debugging and error messages');

// =============================================================================
// 5. ERROR HANDLING WITH SCRIPTS
// =============================================================================

console.log('\n5. Error Handling:');
console.log('-'.repeat(70));

try {
  // Syntax error during compilation
  const badScript = new vm.Script('invalid syntax here!');
} catch (err) {
  console.log('❌ Compilation error:', err.message);
  console.log('✓ Errors caught during compilation');
}

try {
  // Runtime error during execution
  const runtimeScript = new vm.Script('unknownVariable + 1');
  const ctx2 = {};
  vm.createContext(ctx2);
  runtimeScript.runInContext(ctx2);
} catch (err) {
  console.log('\n❌ Runtime error:', err.message);
  console.log('✓ Errors caught during execution');
}

// =============================================================================
// 6. PRACTICAL EXAMPLE - EXPRESSION EVALUATOR
// =============================================================================

console.log('\n6. Practical Example - Template Processor:');
console.log('-'.repeat(70));

class TemplateProcessor {
  constructor(template) {
    // Compile template once
    this.script = new vm.Script(`\`${template}\``, {
      filename: 'template.js',
      displayErrors: true,
    });
  }

  render(data) {
    const context = { ...data };
    vm.createContext(context);
    return this.script.runInContext(context);
  }
}

// Create template
const greeting = new TemplateProcessor('Hello, ${name}! You have ${count} messages.');

// Render multiple times
const users = [
  { name: 'Alice', count: 5 },
  { name: 'Bob', count: 12 },
  { name: 'Charlie', count: 0 },
];

users.forEach(user => {
  console.log(greeting.render(user));
});

console.log('✓ Template compiled once, rendered multiple times');

// =============================================================================
// 7. PERFORMANCE BENCHMARK
// =============================================================================

console.log('\n7. Performance Benchmark:');
console.log('-'.repeat(70));

const iterations = 10000;
const expression = 'a + b * c';

// Method 1: vm.runInNewContext (compile each time)
console.log(`\nMethod 1: runInNewContext (${iterations} iterations)`);
let start = Date.now();
for (let i = 0; i < iterations; i++) {
  vm.runInNewContext(expression, { a: 1, b: 2, c: 3 });
}
const timeMethod1 = Date.now() - start;
console.log(`Time: ${timeMethod1}ms`);

// Method 2: vm.Script (compile once)
console.log(`\nMethod 2: vm.Script (${iterations} iterations)`);
const compiledScript = new vm.Script(expression);
const ctx3 = { a: 1, b: 2, c: 3 };
vm.createContext(ctx3);
start = Date.now();
for (let i = 0; i < iterations; i++) {
  compiledScript.runInContext(ctx3);
}
const timeMethod2 = Date.now() - start;
console.log(`Time: ${timeMethod2}ms`);

console.log(`\nSpeedup: ${(timeMethod1 / timeMethod2).toFixed(2)}x faster`);
console.log('✓ Pre-compiled scripts are significantly faster');

// =============================================================================
// 8. SCRIPT CACHE IMPLEMENTATION
// =============================================================================

console.log('\n8. Practical Example - Script Cache:');
console.log('-'.repeat(70));

class ScriptCache {
  constructor() {
    this.cache = new Map();
  }

  compile(code, options = {}) {
    // Use code as cache key
    if (this.cache.has(code)) {
      console.log('  ✓ Cache hit');
      return this.cache.get(code);
    }

    console.log('  ⚡ Compiling and caching');
    const script = new vm.Script(code, options);
    this.cache.set(code, script);
    return script;
  }

  execute(code, context, options = {}) {
    const script = this.compile(code, options);
    vm.createContext(context);
    return script.runInContext(context);
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

// Use the cache
const cache = new ScriptCache();

console.log('\nFirst execution:');
cache.execute('x + y', { x: 10, y: 20 });

console.log('\nSecond execution (same code):');
cache.execute('x + y', { x: 5, y: 15 });

console.log('\nThird execution (different code):');
cache.execute('x * y', { x: 10, y: 20 });

console.log('\nCache size:', cache.size);
console.log('✓ Script cache improves performance for repeated expressions');

// =============================================================================
// 9. DIFFERENT EXECUTION METHODS
// =============================================================================

console.log('\n9. Script Execution Methods:');
console.log('-'.repeat(70));

const multiMethodScript = new vm.Script('message + "!"');

// Method 1: runInThisContext
global.message = 'Hello';
console.log('runInThisContext:', multiMethodScript.runInThisContext());
delete global.message;

// Method 2: runInNewContext
console.log('runInNewContext:', multiMethodScript.runInNewContext({ message: 'Bonjour' }));

// Method 3: runInContext
const ctx4 = { message: 'Hola' };
vm.createContext(ctx4);
console.log('runInContext:', multiMethodScript.runInContext(ctx4));

console.log('✓ Same script can be executed in different ways');

// =============================================================================
// 10. COMPLEX SCRIPT EXAMPLE
// =============================================================================

console.log('\n10. Complex Script - Data Processor:');
console.log('-'.repeat(70));

const processorScript = new vm.Script(`
  let total = 0;
  let count = 0;

  items.forEach(item => {
    if (item.active) {
      total += item.value;
      count++;
    }
  });

  ({
    total: total,
    count: count,
    average: count > 0 ? total / count : 0
  });
`, {
  filename: 'processor.js',
  displayErrors: true,
});

const datasets = [
  {
    name: 'Dataset 1',
    items: [
      { value: 10, active: true },
      { value: 20, active: true },
      { value: 30, active: false },
    ],
  },
  {
    name: 'Dataset 2',
    items: [
      { value: 5, active: true },
      { value: 15, active: true },
      { value: 25, active: true },
    ],
  },
];

datasets.forEach(dataset => {
  const ctx = { items: dataset.items };
  vm.createContext(ctx);
  const result = processorScript.runInContext(ctx);
  console.log(`${dataset.name}:`, result);
});

console.log('✓ Complex scripts can be reused with different data');

// =============================================================================
// SUMMARY
// =============================================================================

console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

console.log(`
Key Takeaways:

1. vm.Script Class:
   ✓ Compiles code once for multiple executions
   ✓ new vm.Script(code, options)
   ✓ Significantly faster for repeated use
   ✓ Separates compilation from execution

2. Execution Methods:
   ✓ script.runInThisContext()
   ✓ script.runInNewContext(sandbox)
   ✓ script.runInContext(context)
   ✓ Same script, different contexts

3. Performance:
   ✓ 3-10x faster than re-compiling
   ✓ Critical for high-frequency execution
   ✓ Use for templates, expressions, rules
   ✓ Implement caching for even better performance

4. Script Options:
   ✓ filename: For better error messages
   ✓ lineOffset, columnOffset: For source maps
   ✓ displayErrors: Clear error display
   ✓ Helps with debugging

5. Use Cases:
   - Template engines
   - Expression evaluators
   - Rule engines
   - Configuration processors
   - Repeated code execution
   - High-performance sandboxing

6. Best Practices:
   ✓ Compile once, execute many times
   ✓ Cache compiled scripts
   ✓ Use meaningful filenames
   ✓ Handle compilation errors
   ✓ Handle execution errors separately
   ✓ Reuse contexts when possible

7. When to Use Scripts:
   - Code executed multiple times: YES
   - Code executed once: Not necessary
   - Performance matters: YES
   - Need separation of compile/run: YES
`);

console.log('='.repeat(70));

/**
 * PRACTICE EXERCISES
 * ==================
 *
 * 1. Create a math expression evaluator that compiles expressions
 *    once and evaluates them with different variable values.
 *
 * 2. Build a template engine that compiles templates into Scripts
 *    and renders them with different data.
 *
 * 3. Implement a script cache with TTL (time-to-live) that
 *    automatically removes old scripts.
 *
 * 4. Benchmark the performance difference between runInNewContext
 *    and vm.Script for 1000, 10000, and 100000 iterations.
 */
