/**
 * Exercise 3 Solution: Context Pool
 */
const vm = require('vm');

class ContextPool {
  constructor(options = {}) {
    this.maxSize = options.size || 10;
    this.available = [];
    this.inUse = new Set();
    this.stats = {
      created: 0,
      hits: 0,
      misses: 0,
      executions: 0
    };
    this.warmUp();
  }

  warmUp() {
    for (let i = 0; i < this.maxSize; i++) {
      this.available.push(this.createContext());
      this.stats.created++;
    }
  }

  createContext() {
    return vm.createContext({ Math, JSON });
  }

  cleanContext(context) {
    for (const key in context) {
      if (key !== 'Math' && key !== 'JSON') {
        delete context[key];
      }
    }
  }

  acquire() {
    if (this.available.length > 0) {
      this.stats.hits++;
      const context = this.available.pop();
      this.inUse.add(context);
      return context;
    }
    this.stats.misses++;
    this.stats.created++;
    const context = this.createContext();
    this.inUse.add(context);
    return context;
  }

  release(context) {
    if (!this.inUse.has(context)) return;
    this.cleanContext(context);
    this.inUse.delete(context);
    if (this.available.length < this.maxSize) {
      this.available.push(context);
    }
  }

  execute(code, data = {}, options = {}) {
    this.stats.executions++;
    const context = this.acquire();
    try {
      Object.assign(context, data);
      return vm.runInContext(code, context, {
        timeout: options.timeout || 1000
      });
    } finally {
      this.release(context);
    }
  }

  executeScript(script, data = {}) {
    const context = this.acquire();
    try {
      Object.assign(context, data);
      return script.runInContext(context);
    } finally {
      this.release(context);
    }
  }

  getStats() {
    return {
      size: this.stats.created,
      available: this.available.length,
      inUse: this.inUse.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      executions: this.stats.executions
    };
  }

  drain() {
    this.available = [];
    this.inUse.clear();
  }

  resize(newSize) {
    this.maxSize = newSize;
    while (this.available.length < newSize) {
      this.available.push(this.createContext());
      this.stats.created++;
    }
  }
}

module.exports = { ContextPool };

if (require.main === module) {
  const pool = new ContextPool({ size: 5 });
  console.log('=== Context Pool Solution ===\n');
  console.log('Result:', pool.execute('x * 2', { x: 21 }));
  console.log('Stats:', pool.getStats());
  console.log('\n✓ Solution ready!');
}
