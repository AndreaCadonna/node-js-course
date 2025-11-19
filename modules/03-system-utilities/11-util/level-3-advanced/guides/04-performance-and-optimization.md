# Guide 4: Performance and Optimization

**Reading time**: 10 minutes

## Introduction

Util functions can be performance bottlenecks if used incorrectly. This guide covers optimization strategies for production environments.

## Performance Costs of Util Functions

### util.inspect() Cost

```javascript
const data = { users: Array(1000).fill({ id: 1, name: 'Test' }) };

console.time('inspect');
util.inspect(data, { depth: 10 });
console.timeEnd('inspect');
// ~50ms for large objects!
```

### util.isDeepStrictEqual() Cost

```javascript
const obj1 = { /* 10,000 properties */ };
const obj2 = { /* 10,000 properties */ };

console.time('deepEqual');
util.isDeepStrictEqual(obj1, obj2);
console.timeEnd('deepEqual');
// O(n) complexity - scales with object size
```

## Optimization Strategy 1: Lazy Evaluation

### The Problem

```javascript
// ❌ Always inspects, even when not needed
function badLog(data) {
  const inspected = util.inspect(data, { depth: 10 });

  if (DEBUG) {
    console.log(inspected);
  }
}
```

### The Solution

```javascript
// ✅ Only inspects when actually logging
function goodLog(data) {
  if (DEBUG) {
    console.log(util.inspect(data, { depth: 10 }));
  }
}
```

### Benchmark

```javascript
// 10,000 calls with DEBUG=false
badLog():  350ms  // Always inspects
goodLog():  2ms   // Never inspects
```

## Optimization Strategy 2: Limit Depth

### The Problem

```javascript
// ❌ Inspects entire depth (expensive!)
util.inspect(deepObject, { depth: null });
```

### The Solution

```javascript
// ✅ Limit depth for better performance
util.inspect(deepObject, { depth: 3 });

// Even better: Different depths for dev vs prod
const depth = process.env.NODE_ENV === 'production' ? 2 : 5;
util.inspect(deepObject, { depth });
```

### Performance Impact

```javascript
const deep = { l1: { l2: { l3: { l4: { l5: { l6: { data: 'here' } } } } } } };

// Benchmark
depth: null  → 15ms
depth: 5     → 8ms
depth: 3     → 3ms
depth: 1     → 1ms
```

## Optimization Strategy 3: Limit Array Length

### The Problem

```javascript
const huge = Array(100000).fill({ data: 'value' });

// ❌ Inspects all 100,000 items!
util.inspect(huge);  // Very slow!
```

### The Solution

```javascript
// ✅ Limit array inspection
util.inspect(huge, { maxArrayLength: 100 });

// Shows: [ item1, item2, ..., item100, ... 99900 more items ]
```

### Performance Impact

```javascript
const arr = Array(10000).fill({ id: 1 });

// Benchmark
no limit       → 450ms
maxArrayLength: 100 → 15ms
maxArrayLength: 10  → 2ms
```

## Optimization Strategy 4: Caching

### When to Cache

Cache when:
- Same object inspected multiple times
- Object doesn't change between calls
- Inspection is expensive

### Implementation

```javascript
class InspectCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  inspect(obj, options = {}) {
    const key = this.createKey(obj, options);

    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const result = util.inspect(obj, options);

    // LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, result);
    return result;
  }

  createKey(obj, options) {
    try {
      return JSON.stringify({ obj, options });
    } catch {
      return String(obj) + JSON.stringify(options);
    }
  }
}

// Benchmark
const cache = new InspectCache();
const testObj = { data: { nested: true } };

// First call: ~5ms
cache.inspect(testObj);

// Subsequent calls: ~0.01ms (500x faster!)
cache.inspect(testObj);
```

## Optimization Strategy 5: Reference Check Before Deep Equal

### Quick Wins

```javascript
function optimizedDeepEqual(a, b) {
  // Quick reference check (very fast!)
  if (a === b) return true;

  // Only do expensive deep check if needed
  return util.isDeepStrictEqual(a, b);
}

// Benchmark
const obj = { large: 'object' };

util.isDeepStrictEqual(obj, obj);     // 0.05ms
optimizedDeepEqual(obj, obj);          // 0.001ms (50x faster!)
```

## Optimization Strategy 6: Reuse Promisified Functions

### The Problem

```javascript
// ❌ Creates new promisified function every time!
async function badPattern() {
  for (let i = 0; i < 1000; i++) {
    const readFile = util.promisify(fs.readFile);  // Created 1000 times!
    await readFile('file.txt');
  }
}
```

### The Solution

```javascript
// ✅ Create once, reuse many times
const readFile = util.promisify(fs.readFile);

async function goodPattern() {
  for (let i = 0; i < 1000; i++) {
    await readFile('file.txt');  // Reused!
  }
}

// Benchmark
badPattern():  250ms
goodPattern(): 180ms  // 28% faster!
```

## Optimization Strategy 7: Avoid Expensive Formatting

### Template Literals vs util.format

```javascript
const id = 123;
const name = 'Alice';
const data = { complex: 'object' };

// Benchmark
util.format('User %s (%d): %O', name, id, data);  // 0.15ms
`User ${name} (${id}): ${JSON.stringify(data)}`;  // 0.05ms (3x faster!)

// Use template literals for simple cases
// Use util.format only when you need special formatting
```

## Optimization Strategy 8: Conditional Debug Functions

### The Pattern

```javascript
// ❌ Function call overhead even when disabled
const debug = (msg) => {
  if (!DEBUG) return;
  console.log(msg);
};

// Called 100,000 times - still has overhead!
for (let i = 0; i < 100000; i++) {
  debug('message');  // Function call cost even when DEBUG=false
}

// ✅ No-op function when disabled
const debug = DEBUG
  ? (msg) => console.log(msg)
  : () => {};  // Inlined no-op

// Zero overhead when disabled!
for (let i = 0; i < 100000; i++) {
  debug('message');  // No-op is essentially free
}

// Benchmark with DEBUG=false
Method 1 (check inside):  15ms
Method 2 (no-op):         <1ms  // 15x faster!
```

## Optimization Strategy 9: Compact Format for Logs

### The Problem

```javascript
// ❌ Verbose output, slow to generate
util.inspect(obj, { compact: false, breakLength: 80 });
// Output:
// {
//   key: 'value',
//   another: 'value'
// }
```

### The Solution

```javascript
// ✅ Compact output, faster
util.inspect(obj, { compact: true });
// Output: { key: 'value', another: 'value' }

// Benchmark
compact: false  → 12ms
compact: true   → 4ms  // 3x faster!
```

## Optimization Strategy 10: Memory-Aware Inspection

### Track Memory Usage

```javascript
class MemoryAwareLogger {
  inspect(obj) {
    const before = process.memoryUsage().heapUsed;

    const result = util.inspect(obj, {
      depth: 3,
      maxArrayLength: 100
    });

    const after = process.memoryUsage().heapUsed;
    const delta = after - before;

    // Warn if inspection allocates too much memory
    if (delta > 1024 * 1024) {  // 1 MB
      console.warn(`Large inspection: ${(delta / 1024 / 1024).toFixed(2)} MB`);
    }

    return result;
  }
}
```

## Performance Monitoring

### Benchmarking Util Operations

```javascript
class UtilBenchmark {
  static async measure(name, fn, iterations = 1000) {
    // Warmup
    for (let i = 0; i < 10; i++) await fn();

    // Measure
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
      await fn();
    }
    const end = process.hrtime.bigint();

    const duration = Number(end - start) / 1_000_000;  // ms
    const avg = duration / iterations;

    console.log(`${name}:`);
    console.log(`  Total: ${duration.toFixed(2)}ms`);
    console.log(`  Average: ${avg.toFixed(4)}ms`);
    console.log(`  Ops/sec: ${(1000 / avg).toFixed(0)}`);
  }
}

// Usage
await UtilBenchmark.measure('inspect', () => {
  util.inspect(someObject, { depth: 3 });
});
```

## Production Best Practices

### Checklist

```javascript
class ProductionLogger {
  constructor() {
    this.isProd = process.env.NODE_ENV === 'production';
  }

  log(data) {
    // ✅ Different strategies for prod vs dev
    const options = this.isProd
      ? { depth: 2, maxArrayLength: 50, compact: true }
      : { depth: 5, maxArrayLength: 100, colors: true };

    // ✅ Only inspect when actually logging
    if (this.shouldLog()) {
      console.log(util.inspect(data, options));
    }
  }

  shouldLog() {
    // ✅ Different thresholds for prod vs dev
    return !this.isProd || Math.random() < 0.1;  // 10% sampling in prod
  }
}
```

## Quick Reference

### Performance Tiers (from fastest to slowest)

1. **No-op function** - ~0.001ms
2. **Template literals** - ~0.01ms
3. **JSON.stringify** - ~0.05ms
4. **inspect (depth: 1)** - ~0.5ms
5. **inspect (depth: 3)** - ~2ms
6. **inspect (depth: null)** - ~10ms+
7. **deepEqual (small)** - ~0.1ms
8. **deepEqual (large)** - ~100ms+

### Optimization Priorities

1. **Eliminate**: Remove unnecessary calls
2. **Lazy evaluate**: Only run when needed
3. **Limit depth/length**: Reduce work
4. **Cache**: Reuse results
5. **Optimize options**: Use compact, limit arrays

## Summary

- Lazy evaluate - only run when needed
- Limit depth and array length
- Cache repeated inspections
- Reference check before deep equal
- Reuse promisified functions
- Use compact format in production
- No-op functions when disabled
- Monitor memory usage
- Different settings for dev vs prod
- Benchmark to verify optimizations

## Next Steps

- Profile your application
- Implement caching where appropriate
- Add performance monitoring
- Complete the exercises
- Build production utilities
