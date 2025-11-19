# Guide 1: Advanced Script Patterns

This guide covers advanced patterns for working with compiled VM scripts, including caching strategies, performance optimization, and best practices for production use.

## Table of Contents

1. [Introduction](#introduction)
2. [Why Cache Scripts](#why-cache-scripts)
3. [Caching Strategies](#caching-strategies)
4. [LRU Cache Implementation](#lru-cache-implementation)
5. [Performance Optimization](#performance-optimization)
6. [Memory Management](#memory-management)
7. [Best Practices](#best-practices)
8. [Common Pitfalls](#common-pitfalls)
9. [Summary](#summary)

## Introduction

The VM Script class allows you to compile JavaScript code once and execute it multiple times in different contexts. This separation of compilation and execution is key to building high-performance systems.

### What is a Script?

A Script is a compiled representation of JavaScript code:

```javascript
const vm = require('vm');

// Compile once
const script = new vm.Script('result = x * 2');

// Execute many times
const ctx1 = vm.createContext({ x: 5 });
script.runInContext(ctx1);
console.log(ctx1.result); // 10

const ctx2 = vm.createContext({ x: 10 });
script.runInContext(ctx2);
console.log(ctx2.result); // 20
```

### Key Benefits

1. **Performance**: Compilation happens once, execution is fast
2. **Reusability**: Same script in multiple contexts
3. **Efficiency**: Reduced CPU usage for repeated execution
4. **Scalability**: Better performance under load

## Why Cache Scripts

### Compilation Cost

Compiling JavaScript is expensive. Consider this benchmark:

```javascript
const vm = require('vm');
const { performance } = require('perf_hooks');

const code = 'result = x * 2 + y / 2';

// Without caching - compile every time
let start = performance.now();
for (let i = 0; i < 1000; i++) {
  const script = new vm.Script(code);
  const ctx = vm.createContext({ x: i, y: i * 2 });
  script.runInContext(ctx);
}
console.log('Without cache:', performance.now() - start, 'ms');

// With caching - compile once
start = performance.now();
const cached = new vm.Script(code);
for (let i = 0; i < 1000; i++) {
  const ctx = vm.createContext({ x: i, y: i * 2 });
  cached.runInContext(ctx);
}
console.log('With cache:', performance.now() - start, 'ms');
```

Results typically show 10-50x speedup with caching!

### When to Cache

Cache scripts when:
- ✅ Same code is executed multiple times
- ✅ Performance is critical
- ✅ You have predictable patterns
- ✅ Memory allows for caching

Don't cache when:
- ❌ Code changes frequently
- ❌ Each execution is unique
- ❌ Memory is severely constrained
- ❌ Code is only executed once

## Caching Strategies

### 1. Simple Map Cache

The simplest approach uses a Map:

```javascript
class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  getScript(code) {
    if (!this.cache.has(code)) {
      this.cache.set(code, new vm.Script(code));
    }
    return this.cache.get(code);
  }
}
```

**Pros**: Simple, fast lookups
**Cons**: Unbounded growth, no eviction

### 2. Size-Limited Cache

Add a maximum size:

```javascript
class SizeLimitedCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  getScript(code) {
    if (this.cache.has(code)) {
      return this.cache.get(code);
    }

    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const script = new vm.Script(code);
    this.cache.set(code, script);
    return script;
  }
}
```

**Pros**: Prevents unbounded growth
**Cons**: FIFO eviction may remove hot scripts

### 3. LRU (Least Recently Used) Cache

Better eviction strategy:

```javascript
class LRUCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  getScript(code) {
    if (this.cache.has(code)) {
      // Move to end (most recently used)
      const script = this.cache.get(code);
      this.cache.delete(code);
      this.cache.set(code, script);
      return script;
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const script = new vm.Script(code);
    this.cache.set(code, script);
    return script;
  }
}
```

**Pros**: Keeps frequently-used scripts
**Cons**: Slightly more overhead

## LRU Cache Implementation

### Complete LRU Implementation

```javascript
class LRUScriptCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  compile(code) {
    // Check cache
    if (this.cache.has(code)) {
      this.stats.hits++;
      
      // Move to end (LRU)
      const script = this.cache.get(code);
      this.cache.delete(code);
      this.cache.set(code, script);
      
      return script;
    }

    this.stats.misses++;

    // Evict if needed
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
      this.stats.evictions++;
    }

    // Compile and cache
    const script = new vm.Script(code);
    this.cache.set(code, script);
    
    return script;
  }

  execute(code, context) {
    const script = this.compile(code);
    return script.runInContext(context);
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }
}
```

### Usage Example

```javascript
const cache = new LRUScriptCache(10);

// Execute same code multiple times
for (let i = 0; i < 100; i++) {
  const ctx = vm.createContext({ x: i });
  cache.execute('result = x * 2', ctx);
}

console.log(cache.getStats());
// { hits: 99, misses: 1, evictions: 0, size: 1, hitRate: 0.99 }
```

## Performance Optimization

### Benchmark Your Use Case

Always measure performance:

```javascript
function benchmark(name, fn, iterations = 1000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const duration = performance.now() - start;
  console.log(`${name}: ${duration.toFixed(2)}ms`);
  return duration;
}

// Compare strategies
const code = 'result = x * 2';
const ctx = vm.createContext({ x: 10 });

benchmark('No cache', () => {
  const script = new vm.Script(code);
  script.runInContext(ctx);
});

const cached = new vm.Script(code);
benchmark('With cache', () => {
  cached.runInContext(ctx);
});
```

This guide continues with Memory Management, Best Practices, Common Pitfalls, and Summary sections...

## Summary

**Key Takeaways**:

1. Script compilation is expensive - cache when possible
2. LRU caching balances performance and memory
3. Always measure performance for your use case
4. Implement proper eviction to prevent memory leaks
5. Monitor cache statistics to tune settings
6. Consider cache key design carefully
7. Handle compilation errors gracefully

**Next Steps**:
- Review examples/01-script-reuse.js
- Complete exercise-4.js (Expression Compiler)
- Read Guide 2: Context Manipulation
