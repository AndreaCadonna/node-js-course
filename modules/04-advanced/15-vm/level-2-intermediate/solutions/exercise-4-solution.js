/**
 * Exercise 4 Solution: Expression Compiler
 */
const vm = require('vm');

class ExpressionCompiler {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxCacheSize = options.maxCacheSize || 100;
    this.timeout = options.timeout || 1000;
    this.stats = { compilations: 0, evaluations: 0, errors: 0, hits: 0, misses: 0, evictions: 0 };
    this.customFunctions = {};
  }

  validate(expression) {
    const dangerous = /require|process|import|eval|Function|__proto__|constructor/gi;
    if (dangerous.test(expression)) {
      throw new Error('Expression contains blocked patterns');
    }
    return true;
  }

  compile(expression) {
    if (this.cache.has(expression)) {
      this.stats.hits++;
      const script = this.cache.get(expression);
      this.cache.delete(expression);
      this.cache.set(expression, script);
      return script;
    }

    this.stats.misses++;
    this.stats.compilations++;
    this.validate(expression);

    const code = `result = (${expression})`;
    const script = new vm.Script(code);

    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }

    this.cache.set(expression, script);
    return script;
  }

  evaluate(script, data = {}, options = {}) {
    this.stats.evaluations++;
    try {
      const context = vm.createContext({
        ...data,
        ...this.customFunctions,
        Math,
        JSON,
        String,
        Number,
        Array,
        Object,
        result: undefined
      });

      script.runInContext(context, {
        timeout: options.timeout || this.timeout
      });

      return context.result;
    } catch (err) {
      this.stats.errors++;
      throw err;
    }
  }

  exec(expression, data = {}) {
    const script = this.compile(expression);
    return this.evaluate(script, data);
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      evictions: this.stats.evictions
    };
  }

  getStats() {
    return {
      compilations: this.stats.compilations,
      evaluations: this.stats.evaluations,
      errors: this.stats.errors
    };
  }

  clearCache() {
    this.cache.clear();
    this.stats = { compilations: 0, evaluations: 0, errors: 0, hits: 0, misses: 0, evictions: 0 };
  }

  addFunction(name, fn) {
    this.customFunctions[name] = fn;
  }
}

module.exports = { ExpressionCompiler };

if (require.main === module) {
  const compiler = new ExpressionCompiler();
  console.log('=== Expression Compiler Solution ===\n');
  console.log('5 + 3 =', compiler.exec('x + y', { x: 5, y: 3 }));
  console.log('10 * 2 =', compiler.exec('x * 2', { x: 10 }));
  console.log('Stats:', compiler.getCacheStats());
  console.log('\n✓ Solution ready!');
}
