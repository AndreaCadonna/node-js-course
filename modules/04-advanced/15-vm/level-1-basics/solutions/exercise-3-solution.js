/**
 * Exercise 3 Solution: Script Cache
 */

const vm = require('vm');

class ScriptCache {
  constructor() {
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  compile(code) {
    if (this.cache.has(code)) {
      this.hits++;
      return this.cache.get(code);
    }

    this.misses++;
    const script = new vm.Script(code);
    this.cache.set(code, script);
    return script;
  }

  execute(code, context = {}) {
    const script = this.compile(code);
    vm.createContext(context);
    return script.runInContext(context);
  }

  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

// Test
const cache = new ScriptCache();

console.log('Script Cache Solution:\n');

console.log('Result 1:', cache.execute('2 + 2'));
console.log('Result 2:', cache.execute('2 + 2'));
console.log('Result 3:', cache.execute('Math.sqrt(16)', { Math }));
console.log('Result 4:', cache.execute('2 + 2'));

console.log('\nCache Statistics:', cache.getStats());
