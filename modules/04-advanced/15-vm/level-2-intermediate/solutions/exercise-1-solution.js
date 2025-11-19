/**
 * Exercise 1 Solution: Template Renderer
 *
 * Complete implementation of a template engine with variable substitution,
 * expressions, conditionals, loops, and filters.
 */

const vm = require('vm');

class TemplateRenderer {
  constructor(options = {}) {
    this.cache = new Map();
    this.timeout = options.timeout || 1000;
    this.stats = { hits: 0, misses: 0 };

    // Built-in filters
    this.filters = {
      upper: (str) => String(str).toUpperCase(),
      lower: (str) => String(str).toLowerCase(),
      capitalize: (str) => {
        const s = String(str);
        return s.charAt(0).toUpperCase() + s.slice(1);
      }
    };
  }

  registerFilter(name, fn) {
    this.filters[name] = fn;
  }

  compile(template) {
    if (this.cache.has(template)) {
      this.stats.hits++;
      return this.cache.get(template);
    }

    this.stats.misses++;
    const tokens = this.tokenize(template);
    const code = this.generateCode(tokens);
    const script = new vm.Script(code);

    this.cache.set(template, script);
    return script;
  }

  tokenize(template) {
    const tokens = [];
    let pos = 0;

    const patterns = [
      {
        regex: /^\{%\s*if\s+(.+?)\s*%\}/,
        type: 'if',
        extract: (m) => ({ condition: m[1] })
      },
      {
        regex: /^\{%\s*endif\s*%\}/,
        type: 'endif'
      },
      {
        regex: /^\{%\s*for\s+(\w+)\s+in\s+(.+?)\s*%\}/,
        type: 'for',
        extract: (m) => ({ item: m[1], collection: m[2] })
      },
      {
        regex: /^\{%\s*endfor\s*%\}/,
        type: 'endfor'
      },
      {
        regex: /^\{\{(.+?)\}\}/,
        type: 'variable',
        extract: (m) => ({ value: m[1].trim() })
      }
    ];

    while (pos < template.length) {
      let matched = false;

      // Try to match a pattern
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

      // If no pattern matched, it's text
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

  generateCode(tokens) {
    let code = 'let output = "";\n';

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
    return code;
  }

  compileExpression(expr) {
    // Handle filters: value | filter
    const parts = expr.split('|').map(s => s.trim());
    let result = parts[0];

    // Apply each filter
    for (let i = 1; i < parts.length; i++) {
      const filterName = parts[i].trim();
      result = `filters.${filterName}(${result})`;
    }

    return result;
  }

  render(template, data = {}, options = {}) {
    try {
      const script = this.compile(template);
      const context = vm.createContext({
        ...data,
        filters: this.filters,
        result: ''
      });

      script.runInContext(context, {
        timeout: options.timeout || this.timeout
      });

      return context.result;
    } catch (err) {
      throw new Error(`Template render error: ${err.message}`);
    }
  }

  clearCache() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }
}

module.exports = { TemplateRenderer };

// Test if run directly
if (require.main === module) {
  const renderer = new TemplateRenderer();

  console.log('=== Template Renderer Solution ===\n');

  console.log('Test 1 - Simple substitution:');
  console.log(renderer.render('Hello, {{ name }}!', { name: 'World' }));

  console.log('\nTest 2 - Expression:');
  console.log(renderer.render('Total: ${{ price * quantity }}', { price: 10, quantity: 5 }));

  console.log('\nTest 3 - Filter:');
  console.log(renderer.render('{{ name | upper }}', { name: 'hello' }));

  console.log('\nTest 4 - Conditional:');
  console.log(renderer.render('{% if age >= 18 %}Adult{% endif %}', { age: 25 }));

  console.log('\nTest 5 - Loop:');
  console.log(renderer.render('{% for item in items %}{{ item }}{% endfor %}', { items: [1, 2, 3] }));

  console.log('\nCache stats:', renderer.getCacheStats());
  console.log('\n✓ Solution ready! All tests should pass.');
}
