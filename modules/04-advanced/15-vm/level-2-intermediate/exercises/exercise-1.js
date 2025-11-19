/**
 * Exercise 1: Template Renderer
 *
 * Build a template renderer that can compile templates with variable
 * substitution and expression evaluation. Should support conditionals,
 * loops, and filters.
 *
 * Difficulty: ⭐⭐ Medium
 * Estimated Time: 45-60 minutes
 *
 * Related Examples:
 * - 05-template-engine.js
 * - 01-script-reuse.js
 *
 * Related Guides:
 * - 04-template-engines.md
 * - 01-script-patterns.md
 */

const vm = require('vm');

/**
 * TASK: Implement a TemplateRenderer class
 *
 * Requirements:
 * 1. Support {{ variable }} syntax for variable substitution
 * 2. Support {{ expression }} for JavaScript expressions
 * 3. Support {% if condition %} ... {% endif %} for conditionals
 * 4. Support {% for item in collection %} ... {% endfor %} for loops
 * 5. Support filters with {{ value | filter }} syntax
 * 6. Cache compiled templates for performance
 * 7. Provide built-in filters: upper, lower, capitalize
 * 8. Handle errors gracefully
 * 9. Set execution timeout (default 1000ms)
 * 10. Allow registering custom filters
 *
 * Example Usage:
 *
 * const renderer = new TemplateRenderer();
 *
 * // Simple substitution
 * renderer.render('Hello, {{ name }}!', { name: 'World' });
 * // => 'Hello, World!'
 *
 * // Expressions
 * renderer.render('Total: ${{ price * quantity }}', { price: 10, quantity: 5 });
 * // => 'Total: $50'
 *
 * // Conditionals
 * renderer.render('{% if age >= 18 %}Adult{% endif %}', { age: 25 });
 * // => 'Adult'
 *
 * // Loops
 * renderer.render('{% for item in items %}{{ item }}{% endfor %}', { items: [1,2,3] });
 * // => '123'
 *
 * // Filters
 * renderer.render('{{ name | upper }}', { name: 'hello' });
 * // => 'HELLO'
 */

class TemplateRenderer {
  constructor(options = {}) {
    // TODO: Initialize the template renderer
    // - Set up template cache
    // - Initialize built-in filters
    // - Store options (timeout, etc.)
  }

  /**
   * Register a custom filter
   * @param {string} name - Filter name
   * @param {function} fn - Filter function
   */
  registerFilter(name, fn) {
    // TODO: Implement filter registration
  }

  /**
   * Compile a template to a VM Script
   * @param {string} template - Template string
   * @returns {vm.Script} Compiled script
   */
  compile(template) {
    // TODO: Implement template compilation
    // Hints:
    // 1. Check cache first
    // 2. Tokenize the template
    // 3. Generate JavaScript code from tokens
    // 4. Compile to vm.Script
    // 5. Cache the result
  }

  /**
   * Tokenize template into parts
   * @param {string} template - Template string
   * @returns {Array} Array of tokens
   */
  tokenize(template) {
    // TODO: Implement tokenization
    // Parse template and return array of tokens like:
    // { type: 'text', value: '...' }
    // { type: 'variable', value: '...' }
    // { type: 'if', condition: '...' }
    // { type: 'for', item: '...', collection: '...' }
  }

  /**
   * Generate JavaScript code from tokens
   * @param {Array} tokens - Array of tokens
   * @returns {string} JavaScript code
   */
  generateCode(tokens) {
    // TODO: Convert tokens to executable JavaScript
    // Should return string like:
    // let output = "";
    // output += "text";
    // output += (variable);
    // if (condition) { ... }
    // for (item of collection) { ... }
    // result = output;
  }

  /**
   * Render a template with data
   * @param {string} template - Template string
   * @param {object} data - Data object
   * @param {object} options - Render options
   * @returns {string} Rendered output
   */
  render(template, data = {}, options = {}) {
    // TODO: Implement rendering
    // 1. Compile template (use cache)
    // 2. Create context with data and filters
    // 3. Execute script in context
    // 4. Return result
    // 5. Handle errors
  }

  /**
   * Clear template cache
   */
  clearCache() {
    // TODO: Clear the template cache
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getCacheStats() {
    // TODO: Return cache statistics
    // Should include: size, hits, misses, hitRate
  }
}

// ============================================================================
// TEST CASES
// ============================================================================

function runTests() {
  console.log('Testing TemplateRenderer...\n');

  const renderer = new TemplateRenderer();
  let passed = 0;
  let failed = 0;

  function test(name, template, data, expected) {
    try {
      const result = renderer.render(template, data);
      if (result === expected) {
        console.log(`✓ ${name}`);
        passed++;
      } else {
        console.log(`✗ ${name}`);
        console.log(`  Expected: ${expected}`);
        console.log(`  Got: ${result}`);
        failed++;
      }
    } catch (err) {
      console.log(`✗ ${name} - Error: ${err.message}`);
      failed++;
    }
  }

  // Test 1: Simple variable substitution
  test(
    'Simple substitution',
    'Hello, {{ name }}!',
    { name: 'World' },
    'Hello, World!'
  );

  // Test 2: Multiple variables
  test(
    'Multiple variables',
    '{{ greeting }}, {{ name }}!',
    { greeting: 'Hi', name: 'Alice' },
    'Hi, Alice!'
  );

  // Test 3: Expression evaluation
  test(
    'Expression',
    'Total: ${{ price * quantity }}',
    { price: 10, quantity: 5 },
    'Total: $50'
  );

  // Test 4: Conditional (true)
  test(
    'Conditional true',
    '{% if isActive %}Active{% endif %}',
    { isActive: true },
    'Active'
  );

  // Test 5: Conditional (false)
  test(
    'Conditional false',
    '{% if isActive %}Active{% endif %}',
    { isActive: false },
    ''
  );

  // Test 6: Loop
  test(
    'Loop',
    '{% for item in items %}{{ item }}{% endfor %}',
    { items: [1, 2, 3] },
    '123'
  );

  // Test 7: Filter - upper
  test(
    'Filter upper',
    '{{ name | upper }}',
    { name: 'hello' },
    'HELLO'
  );

  // Test 8: Filter - lower
  test(
    'Filter lower',
    '{{ name | lower }}',
    { name: 'WORLD' },
    'world'
  );

  // Test 9: Filter - capitalize
  test(
    'Filter capitalize',
    '{{ name | capitalize }}',
    { name: 'hello world' },
    'Hello world'
  );

  // Test 10: Complex template
  test(
    'Complex template',
    'Name: {{ name | upper }}\n{% if age >= 18 %}Adult{% endif %}\nItems: {% for item in items %}{{ item }}{% endfor %}',
    { name: 'bob', age: 25, items: ['a', 'b', 'c'] },
    'Name: BOB\nAdult\nItems: abc'
  );

  // Test 11: Custom filter
  renderer.registerFilter('double', (n) => n * 2);
  test(
    'Custom filter',
    '{{ value | double }}',
    { value: 5 },
    '10'
  );

  // Test 12: Cache hit
  renderer.render('{{ x }}', { x: 1 });
  renderer.render('{{ x }}', { x: 2 }); // Should hit cache
  const stats = renderer.getCacheStats();
  console.log(stats && stats.hits > 0 ? '✓ Cache working' : '✗ Cache not working');
  if (stats && stats.hits > 0) passed++; else failed++;

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Great job!');
    console.log('\nNext steps:');
    console.log('1. Review the solution to see alternative approaches');
    console.log('2. Try adding more filters or template features');
    console.log('3. Move on to Exercise 2');
  } else {
    console.log('\n💡 Some tests failed. Keep working on it!');
    console.log('Tips:');
    console.log('- Check the related examples for similar implementations');
    console.log('- Make sure tokenization handles all template syntax');
    console.log('- Test each feature individually');
  }
}

// Uncomment to run tests
// runTests();

module.exports = { TemplateRenderer };

/**
 * INSTRUCTIONS:
 *
 * 1. Implement all methods in the TemplateRenderer class
 * 2. Uncomment runTests() at the bottom
 * 3. Run: node exercise-1.js
 * 4. Keep working until all tests pass
 * 5. Compare with solution file when done
 *
 * HINTS:
 * - Look at examples/05-template-engine.js for reference
 * - Use regex to find template syntax: /\{\{(.+?)\}\}/g
 * - Build JavaScript code as a string, then compile with vm.Script
 * - Remember to handle filters in expression compilation
 * - Use Map for template cache (key: template string, value: compiled script)
 *
 * BONUS CHALLENGES:
 * - Add {% else %} support to conditionals
 * - Support nested conditionals and loops
 * - Add more built-in filters (json, length, reverse)
 * - Support filter arguments: {{ value | default('N/A') }}
 * - Add template inheritance or includes
 */
