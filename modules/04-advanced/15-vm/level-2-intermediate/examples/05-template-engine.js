/**
 * Example 5: Building a Template Engine with VM
 *
 * This example demonstrates how to build a complete template engine
 * using the VM module for safe expression evaluation and variable
 * substitution.
 *
 * Topics covered:
 * - Template parsing and compilation
 * - Variable substitution
 * - Expression evaluation
 * - Helper functions and filters
 * - Conditional rendering
 * - Loop rendering
 */

const vm = require('vm');

// ============================================================================
// 1. Basic Variable Substitution
// ============================================================================

console.log('=== 1. Basic Variable Substitution ===\n');

/**
 * Simple template engine with {{ variable }} syntax
 */
class SimpleTemplateEngine {
  compile(template) {
    // Replace {{ variable }} with JavaScript template literal syntax
    const code = template.replace(/\{\{(.+?)\}\}/g, (match, expr) => {
      return '${' + expr.trim() + '}';
    });

    // Create a function that returns the template
    const wrapped = `\`${code}\``;
    return new vm.Script(`result = ${wrapped}`);
  }

  render(template, data) {
    const script = this.compile(template);
    const context = vm.createContext({ ...data, result: '' });
    script.runInContext(context);
    return context.result;
  }
}

// Demo simple substitution
const simple = new SimpleTemplateEngine();

const template1 = 'Hello, {{ name }}! You are {{ age }} years old.';
const result1 = simple.render(template1, { name: 'Alice', age: 25 });
console.log('Template:', template1);
console.log('Result:', result1);

const template2 = 'Total: ${{ price * quantity }}';
const result2 = simple.render(template2, { price: 10, quantity: 5 });
console.log('\nTemplate:', template2);
console.log('Result:', result2);
console.log();

// ============================================================================
// 2. Template Engine with Expressions
// ============================================================================

console.log('=== 2. Template Engine with Expressions ===\n');

/**
 * Template engine supporting complex expressions
 */
class ExpressionTemplateEngine {
  constructor() {
    this.cache = new Map();
  }

  compile(template) {
    if (this.cache.has(template)) {
      return this.cache.get(template);
    }

    const code = template.replace(/\{\{(.+?)\}\}/g, (match, expr) => {
      return '${' + expr.trim() + '}';
    });

    const wrapped = `\`${code}\``;
    const script = new vm.Script(`result = ${wrapped}`);

    this.cache.set(template, script);
    return script;
  }

  render(template, data, options = {}) {
    const script = this.compile(template);
    const context = vm.createContext({
      ...data,
      Math,
      JSON,
      String,
      Number,
      Array,
      Object,
      result: ''
    });

    try {
      script.runInContext(context, {
        timeout: options.timeout || 1000
      });
      return context.result;
    } catch (err) {
      throw new Error(`Template render error: ${err.message}`);
    }
  }
}

// Demo expressions
const exprEngine = new ExpressionTemplateEngine();

console.log('Expression examples:\n');

const templates = [
  {
    template: 'Square root of {{ num }}: {{ Math.sqrt(num) }}',
    data: { num: 16 }
  },
  {
    template: 'Uppercase: {{ name.toUpperCase() }}',
    data: { name: 'hello world' }
  },
  {
    template: 'Total: ${{ (price * (1 - discount)).toFixed(2) }}',
    data: { price: 100, discount: 0.2 }
  }
];

for (const { template, data } of templates) {
  console.log('Template:', template);
  console.log('Result:', exprEngine.render(template, data));
  console.log();
}

// ============================================================================
// 3. Template Engine with Conditionals
// ============================================================================

console.log('=== 3. Template Engine with Conditionals ===\n');

/**
 * Template engine with {% if %} syntax
 */
class ConditionalTemplateEngine {
  compile(template) {
    let code = 'let output = "";\n';

    // Parse template
    const tokens = this.tokenize(template);

    for (const token of tokens) {
      if (token.type === 'text') {
        code += `output += ${JSON.stringify(token.value)};\n`;
      } else if (token.type === 'variable') {
        code += `output += (${token.value});\n`;
      } else if (token.type === 'if') {
        code += `if (${token.condition}) {\n`;
      } else if (token.type === 'else') {
        code += `} else {\n`;
      } else if (token.type === 'endif') {
        code += `}\n`;
      }
    }

    code += 'result = output;';
    return new vm.Script(code);
  }

  tokenize(template) {
    const tokens = [];
    let pos = 0;

    while (pos < template.length) {
      // Check for {% if condition %}
      const ifMatch = template.slice(pos).match(/^\{%\s*if\s+(.+?)\s*%\}/);
      if (ifMatch) {
        tokens.push({ type: 'if', condition: ifMatch[1] });
        pos += ifMatch[0].length;
        continue;
      }

      // Check for {% else %}
      const elseMatch = template.slice(pos).match(/^\{%\s*else\s*%\}/);
      if (elseMatch) {
        tokens.push({ type: 'else' });
        pos += elseMatch[0].length;
        continue;
      }

      // Check for {% endif %}
      const endifMatch = template.slice(pos).match(/^\{%\s*endif\s*%\}/);
      if (endifMatch) {
        tokens.push({ type: 'endif' });
        pos += endifMatch[0].length;
        continue;
      }

      // Check for {{ variable }}
      const varMatch = template.slice(pos).match(/^\{\{(.+?)\}\}/);
      if (varMatch) {
        tokens.push({ type: 'variable', value: varMatch[1].trim() });
        pos += varMatch[0].length;
        continue;
      }

      // Regular text
      const nextSpecial = template.slice(pos).search(/\{[{%]/);
      if (nextSpecial === -1) {
        tokens.push({ type: 'text', value: template.slice(pos) });
        break;
      } else {
        tokens.push({ type: 'text', value: template.slice(pos, pos + nextSpecial) });
        pos += nextSpecial;
      }
    }

    return tokens;
  }

  render(template, data) {
    const script = this.compile(template);
    const context = vm.createContext({ ...data, result: '' });
    script.runInContext(context);
    return context.result;
  }
}

// Demo conditionals
const condEngine = new ConditionalTemplateEngine();

const condTemplate = `
Hello, {{ name }}!
{% if age >= 18 %}
You are an adult.
{% else %}
You are a minor.
{% endif %}
Your status: {% if isActive %}Active{% else %}Inactive{% endif %}
`.trim();

console.log('Template with conditionals:\n');
console.log(condTemplate);
console.log('\nResult 1 (adult, active):');
console.log(condEngine.render(condTemplate, { name: 'Alice', age: 25, isActive: true }));
console.log('\nResult 2 (minor, inactive):');
console.log(condEngine.render(condTemplate, { name: 'Bob', age: 15, isActive: false }));
console.log();

// ============================================================================
// 4. Template Engine with Loops
// ============================================================================

console.log('=== 4. Template Engine with Loops ===\n');

/**
 * Template engine with {% for %} syntax
 */
class LoopTemplateEngine {
  compile(template) {
    let code = 'let output = "";\n';
    const tokens = this.tokenize(template);

    for (const token of tokens) {
      if (token.type === 'text') {
        code += `output += ${JSON.stringify(token.value)};\n`;
      } else if (token.type === 'variable') {
        code += `output += (${token.value});\n`;
      } else if (token.type === 'for') {
        code += `for (const ${token.item} of ${token.collection}) {\n`;
      } else if (token.type === 'endfor') {
        code += `}\n`;
      }
    }

    code += 'result = output;';
    return new vm.Script(code);
  }

  tokenize(template) {
    const tokens = [];
    let pos = 0;

    while (pos < template.length) {
      // Check for {% for item in collection %}
      const forMatch = template.slice(pos).match(/^\{%\s*for\s+(\w+)\s+in\s+(.+?)\s*%\}/);
      if (forMatch) {
        tokens.push({
          type: 'for',
          item: forMatch[1],
          collection: forMatch[2]
        });
        pos += forMatch[0].length;
        continue;
      }

      // Check for {% endfor %}
      const endforMatch = template.slice(pos).match(/^\{%\s*endfor\s*%\}/);
      if (endforMatch) {
        tokens.push({ type: 'endfor' });
        pos += endforMatch[0].length;
        continue;
      }

      // Check for {{ variable }}
      const varMatch = template.slice(pos).match(/^\{\{(.+?)\}\}/);
      if (varMatch) {
        tokens.push({ type: 'variable', value: varMatch[1].trim() });
        pos += varMatch[0].length;
        continue;
      }

      // Regular text
      const nextSpecial = template.slice(pos).search(/\{[{%]/);
      if (nextSpecial === -1) {
        tokens.push({ type: 'text', value: template.slice(pos) });
        break;
      } else {
        tokens.push({ type: 'text', value: template.slice(pos, pos + nextSpecial) });
        pos += nextSpecial;
      }
    }

    return tokens;
  }

  render(template, data) {
    const script = this.compile(template);
    const context = vm.createContext({ ...data, result: '' });
    script.runInContext(context);
    return context.result;
  }
}

// Demo loops
const loopEngine = new LoopTemplateEngine();

const loopTemplate = `
Users:
{% for user in users %}
  - {{ user.name }} ({{ user.age }})
{% endfor %}
`.trim();

console.log('Template with loops:\n');
console.log(loopTemplate);
console.log('\nResult:');
console.log(loopEngine.render(loopTemplate, {
  users: [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 30 },
    { name: 'Charlie', age: 35 }
  ]
}));
console.log();

// ============================================================================
// 5. Template Engine with Filters
// ============================================================================

console.log('=== 5. Template Engine with Filters ===\n');

/**
 * Template engine with filter support
 */
class FilterTemplateEngine {
  constructor() {
    this.filters = {
      upper: (str) => String(str).toUpperCase(),
      lower: (str) => String(str).toLowerCase(),
      capitalize: (str) => String(str).charAt(0).toUpperCase() + String(str).slice(1),
      reverse: (str) => String(str).split('').reverse().join(''),
      length: (val) => val.length,
      json: (val) => JSON.stringify(val),
      default: (val, def) => val || def
    };
  }

  registerFilter(name, fn) {
    this.filters[name] = fn;
  }

  compile(template) {
    // Replace {{ variable | filter }} syntax
    const code = template.replace(/\{\{(.+?)\}\}/g, (match, expr) => {
      const parts = expr.split('|').map(s => s.trim());
      let result = parts[0];

      // Apply filters
      for (let i = 1; i < parts.length; i++) {
        const filterMatch = parts[i].match(/^(\w+)(?:\((.+)\))?$/);
        if (filterMatch) {
          const filterName = filterMatch[1];
          const args = filterMatch[2] || '';
          result = `filters.${filterName}(${result}${args ? ', ' + args : ''})`;
        }
      }

      return '${' + result + '}';
    });

    const wrapped = `\`${code}\``;
    return new vm.Script(`result = ${wrapped}`);
  }

  render(template, data) {
    const script = this.compile(template);
    const context = vm.createContext({
      ...data,
      filters: this.filters,
      result: ''
    });
    script.runInContext(context);
    return context.result;
  }
}

// Demo filters
const filterEngine = new FilterTemplateEngine();

// Register custom filter
filterEngine.registerFilter('currency', (val) => {
  return '$' + Number(val).toFixed(2);
});

const filterExamples = [
  {
    template: 'Name: {{ name | upper }}',
    data: { name: 'alice' }
  },
  {
    template: 'Message: {{ message | capitalize }}',
    data: { message: 'hello world' }
  },
  {
    template: 'Price: {{ price | currency }}',
    data: { price: 19.99 }
  },
  {
    template: 'Username: {{ username | default("Guest") }}',
    data: { username: '' }
  }
];

console.log('Filter examples:\n');
for (const { template, data } of filterExamples) {
  console.log('Template:', template);
  console.log('Result:', filterEngine.render(template, data));
  console.log();
}

// ============================================================================
// 6. Complete Template Engine
// ============================================================================

console.log('=== 6. Complete Template Engine ===\n');

/**
 * Full-featured template engine
 */
class TemplateEngine {
  constructor() {
    this.cache = new Map();
    this.filters = {
      upper: (s) => String(s).toUpperCase(),
      lower: (s) => String(s).toLowerCase(),
      capitalize: (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1),
      default: (v, d) => v || d
    };
  }

  registerFilter(name, fn) {
    this.filters[name] = fn;
  }

  compile(template) {
    if (this.cache.has(template)) {
      return this.cache.get(template);
    }

    let code = 'let output = "";\n';
    const tokens = this.tokenize(template);

    for (const token of tokens) {
      switch (token.type) {
        case 'text':
          code += `output += ${JSON.stringify(token.value)};\n`;
          break;
        case 'variable':
          code += `output += String(${this.compileExpression(token.value)});\n`;
          break;
        case 'if':
          code += `if (${token.condition}) {\n`;
          break;
        case 'else':
          code += `} else {\n`;
          break;
        case 'endif':
          code += `}\n`;
          break;
        case 'for':
          code += `for (const ${token.item} of ${token.collection}) {\n`;
          break;
        case 'endfor':
          code += `}\n`;
          break;
      }
    }

    code += 'result = output;';
    const script = new vm.Script(code);
    this.cache.set(template, script);
    return script;
  }

  compileExpression(expr) {
    // Handle filters
    const parts = expr.split('|').map(s => s.trim());
    let result = parts[0];

    for (let i = 1; i < parts.length; i++) {
      const filterMatch = parts[i].match(/^(\w+)(?:\((.+)\))?$/);
      if (filterMatch) {
        const filterName = filterMatch[1];
        const args = filterMatch[2] || '';
        result = `filters.${filterName}(${result}${args ? ', ' + args : ''})`;
      }
    }

    return result;
  }

  tokenize(template) {
    const tokens = [];
    let pos = 0;

    const patterns = [
      { regex: /^\{%\s*if\s+(.+?)\s*%\}/, type: 'if', extract: (m) => ({ condition: m[1] }) },
      { regex: /^\{%\s*else\s*%\}/, type: 'else' },
      { regex: /^\{%\s*endif\s*%\}/, type: 'endif' },
      { regex: /^\{%\s*for\s+(\w+)\s+in\s+(.+?)\s*%\}/, type: 'for', extract: (m) => ({ item: m[1], collection: m[2] }) },
      { regex: /^\{%\s*endfor\s*%\}/, type: 'endfor' },
      { regex: /^\{\{(.+?)\}\}/, type: 'variable', extract: (m) => ({ value: m[1].trim() }) }
    ];

    while (pos < template.length) {
      let matched = false;

      for (const pattern of patterns) {
        const match = template.slice(pos).match(pattern.regex);
        if (match) {
          const token = { type: pattern.type };
          if (pattern.extract) {
            Object.assign(token, pattern.extract(match));
          }
          tokens.push(token);
          pos += match[0].length;
          matched = true;
          break;
        }
      }

      if (!matched) {
        const nextSpecial = template.slice(pos).search(/\{[{%]/);
        if (nextSpecial === -1) {
          tokens.push({ type: 'text', value: template.slice(pos) });
          break;
        } else {
          tokens.push({ type: 'text', value: template.slice(pos, pos + nextSpecial) });
          pos += nextSpecial;
        }
      }
    }

    return tokens;
  }

  render(template, data, options = {}) {
    const script = this.compile(template);
    const context = vm.createContext({
      ...data,
      filters: this.filters,
      Math,
      JSON,
      result: ''
    });

    script.runInContext(context, {
      timeout: options.timeout || 5000
    });

    return context.result;
  }
}

// Demo complete engine
const engine = new TemplateEngine();

const complexTemplate = `
<div class="user-card">
  <h2>{{ name | capitalize }}</h2>
  <p>Age: {{ age }}</p>

  {% if isPremium %}
  <span class="badge">Premium Member</span>
  {% else %}
  <span class="badge">Free Member</span>
  {% endif %}

  <h3>Recent Posts:</h3>
  <ul>
  {% for post in posts %}
    <li>{{ post.title }} ({{ post.likes }} likes)</li>
  {% endfor %}
  </ul>
</div>
`.trim();

const complexData = {
  name: 'alice wonderland',
  age: 28,
  isPremium: true,
  posts: [
    { title: 'My First Post', likes: 42 },
    { title: 'Learning VM Module', likes: 156 },
    { title: 'Template Engines', likes: 89 }
  ]
};

console.log('Complex template example:\n');
console.log(engine.render(complexTemplate, complexData));
console.log();

// ============================================================================
// Key Takeaways
// ============================================================================

console.log('=== Key Takeaways ===\n');
console.log('1. VM enables safe evaluation of template expressions');
console.log('2. Cache compiled templates for better performance');
console.log('3. Tokenization separates parsing from execution');
console.log('4. Filters provide reusable transformation functions');
console.log('5. Support for conditionals and loops enables complex templates');
console.log('6. Always set timeouts for untrusted templates');
console.log();

console.log('Run this example with: node 05-template-engine.js');
