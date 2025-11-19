# Level 3 Advanced - Solutions

This directory contains complete, production-quality solutions to all exercises.

## ⚠️ Important Notice

**Try to complete the exercises on your own before looking at solutions!**

The learning comes from struggling with the problems. Use solutions to:
- ✅ Compare your approach after completion
- ✅ Learn alternative patterns
- ✅ Understand best practices
- ✅ Debug if completely stuck

## Solutions Overview

### [Exercise 1 Solution](./exercise-1-solution.js)
**Hardened Sandbox - Complete Implementation**

Full security-hardened sandbox with:
- Null prototype base
- Multi-layer proxy protection
- Comprehensive logging
- Resource monitoring
- Statistics tracking

**Key Learnings:**
- Defense-in-depth implementation
- Proxy handler best practices
- Security event logging patterns

---

### [Exercise 2 Solution](./exercise-2-solution.js)
**Production REPL - Complete Implementation**

Production-grade REPL with:
- Multi-line input detection
- Command history
- Auto-completion
- Built-in commands
- Session persistence

**Key Learnings:**
- Syntax completion detection
- State management patterns
- File-based persistence

---

### [Exercise 3 Solution](./exercise-3-solution.js)
**Resource Monitor - Complete Implementation**

Comprehensive resource monitoring with:
- CPU and memory tracking
- Real-time sampling
- Quota enforcement
- Performance profiling
- Detailed reporting

**Key Learnings:**
- V8 heap monitoring
- Performance measurement
- Statistical analysis

---

### [Exercise 4 Solution](./exercise-4-solution.js)
**Multi-Tenant Executor - Complete Implementation**

Full multi-tenant platform with:
- Complete tenant isolation
- Resource quotas
- Fair scheduling
- Usage tracking
- Billing system

**Key Learnings:**
- Multi-tenant architecture
- Priority-based scheduling
- Usage metering patterns

---

### [Exercise 5 Solution](./exercise-5-solution.js)
**Secure Plugin Runtime - Complete Implementation**

Complete plugin system with:
- Plugin isolation
- Controlled APIs
- Lifecycle management
- Resource limits
- Event system

**Key Learnings:**
- Plugin architecture
- API layer design
- Lifecycle hooks

---

## How to Use Solutions

### 1. After Completing Exercise
```bash
# Compare your solution
diff exercise-1.js solutions/exercise-1-solution.js

# Run the solution
node solutions/exercise-1-solution.js
```

### 2. When Stuck
- Read solution partially
- Understand the approach
- Try implementing yourself
- Compare final result

### 3. Learning from Solutions
- Note patterns used
- Understand trade-offs
- Learn error handling
- See optimization techniques

---

## Key Patterns in Solutions

### Pattern 1: Null Prototype Security
```javascript
// Always start with null prototype
const base = Object.create(null);

// Add only whitelisted properties
const safe = {
  Math: Object.create(Math),
  JSON: Object.create(JSON)
};
Object.assign(base, safe);
```

### Pattern 2: Proxy Protection
```javascript
// Comprehensive proxy handler
const handler = {
  get(target, prop) {
    if (blacklist.has(prop)) {
      throw new Error(`Access denied: ${prop}`);
    }
    return Reflect.get(target, prop);
  },
  set(target, prop, value) {
    if (blacklist.has(prop)) {
      throw new Error(`Mutation denied: ${prop}`);
    }
    return Reflect.set(target, prop, value);
  }
};
```

### Pattern 3: Resource Monitoring
```javascript
// Before/after snapshot pattern
const before = {
  time: performance.now(),
  cpu: process.cpuUsage(),
  memory: v8.getHeapStatistics().used_heap_size
};

// Execute code...

const after = {
  time: performance.now(),
  cpu: process.cpuUsage(before.cpu),
  memory: v8.getHeapStatistics().used_heap_size
};

const usage = {
  wallTime: after.time - before.time,
  cpuTime: (after.cpu.user + after.cpu.system) / 1000,
  memory: after.memory - before.memory
};
```

### Pattern 4: Multi-line Detection
```javascript
// Try to parse, catch incomplete errors
function isComplete(code) {
  try {
    new vm.Script(code);
    return true;
  } catch (err) {
    if (err.message.includes('Unexpected end of input')) {
      return false;
    }
    return true; // Syntax error, treat as complete
  }
}
```

### Pattern 5: Fair Scheduling
```javascript
// Priority-based queue sorting
queue.sort((a, b) => {
  const waitA = Date.now() - a.submitTime;
  const waitB = Date.now() - b.submitTime;
  const scoreA = a.priority * waitA;
  const scoreB = b.priority * waitB;
  return scoreB - scoreA;
});
```

---

## Common Implementation Patterns

### Error Handling
```javascript
try {
  const result = vm.runInContext(code, context, { timeout });
  return { success: true, result };
} catch (error) {
  return {
    success: false,
    error: error.message,
    type: error.code
  };
}
```

### Statistics Tracking
```javascript
class Stats {
  constructor() {
    this.total = 0;
    this.successful = 0;
    this.failed = 0;
    this.totalTime = 0;
  }

  record(success, duration) {
    this.total++;
    if (success) {
      this.successful++;
    } else {
      this.failed++;
    }
    this.totalTime += duration;
  }

  get successRate() {
    return this.total > 0
      ? (this.successful / this.total) * 100
      : 0;
  }

  get avgTime() {
    return this.total > 0
      ? this.totalTime / this.total
      : 0;
  }
}
```

### Cleanup Pattern
```javascript
function cleanup(context) {
  // Clear all non-protected properties
  for (const key in context) {
    if (!protectedKeys.includes(key)) {
      delete context[key];
    }
  }

  // Trigger GC if available
  if (global.gc) {
    global.gc();
  }
}
```

---

## Performance Optimizations

### 1. Context Pooling
Reuse contexts instead of creating new ones:
```javascript
class ContextPool {
  constructor(size) {
    this.pool = Array(size).fill(null).map(() => 
      vm.createContext(createBaseSandbox())
    );
    this.available = [...this.pool];
  }

  acquire() {
    return this.available.pop() || 
           vm.createContext(createBaseSandbox());
  }

  release(context) {
    cleanup(context);
    this.available.push(context);
  }
}
```

### 2. Script Caching
Cache compiled scripts:
```javascript
const scriptCache = new Map();

function getScript(code) {
  if (!scriptCache.has(code)) {
    scriptCache.set(code, new vm.Script(code));
  }
  return scriptCache.get(code);
}
```

### 3. Lazy Initialization
Create resources only when needed:
```javascript
get context() {
  if (!this._context) {
    this._context = this.createContext();
  }
  return this._context;
}
```

---

## Security Best Practices

### 1. Whitelist Approach
```javascript
// GOOD: Whitelist allowed globals
const allowed = ['Math', 'JSON', 'Date'];
const base = Object.create(null);
allowed.forEach(name => {
  base[name] = global[name];
});
```

### 2. Deep Defense
```javascript
// Layer 1: Null prototype
const base = Object.create(null);

// Layer 2: Whitelisted globals
Object.assign(base, safeGlobals);

// Layer 3: Proxy protection
const protected = new Proxy(base, securityHandler);

// Layer 4: VM context
const context = vm.createContext(protected);
```

### 3. Complete Blacklist
```javascript
const dangerous = [
  'constructor', '__proto__', 'prototype',
  'eval', 'Function', 'process', 'require',
  'global', 'globalThis', 'module', 'Buffer'
];
```

---

## Testing Your Understanding

After reviewing solutions, try these challenges:

1. **Modify Exercise 1**
   - Add IP-based rate limiting
   - Implement code signing verification
   - Add execution replay capability

2. **Extend Exercise 2**
   - Add syntax highlighting
   - Implement code completion
   - Add remote REPL support

3. **Enhance Exercise 3**
   - Add heap snapshot diffing
   - Implement leak detection
   - Add performance regression detection

4. **Scale Exercise 4**
   - Add horizontal scaling
   - Implement tenant migration
   - Add load balancing

5. **Improve Exercise 5**
   - Add plugin dependencies
   - Implement hot reloading
   - Add plugin sandboxed storage

---

## Next Steps

After mastering solutions:

1. ✅ Review all implementation patterns
2. ✅ Understand trade-offs made
3. ✅ Study error handling approaches
4. ✅ Learn optimization techniques
5. ✅ Build your own projects
6. ✅ Contribute improvements

---

**Remember**: These solutions represent one approach. There are many valid ways to solve each exercise. The best solution is one that you understand and can maintain!
