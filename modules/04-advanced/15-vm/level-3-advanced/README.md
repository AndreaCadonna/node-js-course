# Level 3: VM Advanced

Welcome to Level 3 of the VM module! This level covers advanced production-grade topics including security hardening, VM escape prevention, memory management, production REPL systems, Worker Threads integration, proxy-based protection, resource monitoring, and multi-tenant architectures.

**Estimated Time**: 6-8 hours

---

## Learning Objectives

By the end of this level, you will be able to:

- [ ] Implement comprehensive VM escape prevention strategies
- [ ] Design proxy-based sandbox protection systems
- [ ] Manage memory efficiently and prevent leaks in VM contexts
- [ ] Integrate VM with Worker Threads for true isolation
- [ ] Build production-grade REPL systems with advanced features
- [ ] Monitor and control resource usage in real-time
- [ ] Design and implement multi-tenant code execution platforms
- [ ] Apply complete security hardening patterns
- [ ] Build secure plugin runtime environments
- [ ] Deploy VM-based systems in production environments

---

## Prerequisites

Before starting Level 3, ensure you understand:

- **Level 1 & 2 Concepts**: All fundamentals and intermediate patterns
- **Security Principles**: Sandboxing, isolation, least privilege
- **Worker Threads**: Message passing, thread pools, shared memory
- **Proxies**: Handler traps, invariants, revocable proxies
- **Memory Management**: Heap, garbage collection, memory profiling
- **Production Systems**: Monitoring, logging, error handling
- **Multi-tenancy**: Isolation, resource quotas, fairness

---

## Topics Covered

### Core Concepts
- **VM Escape Prevention**: Understanding and preventing escape techniques
- **Proxy Protection**: Using proxies to control context access
- **Memory Management**: Leak prevention, optimization, monitoring
- **Worker Integration**: Isolating VM execution in separate threads
- **Production REPL**: Building robust interactive execution environments
- **Resource Monitoring**: Real-time tracking and enforcement
- **Multi-tenant Systems**: Safe concurrent code execution
- **Security Hardening**: Defense-in-depth strategies

---

## Conceptual Guides

Work through these guides to build your understanding:

1. **[Security Hardening](./guides/01-security-hardening.md)** ⏱️ 45 min
   - Defense-in-depth strategies
   - Attack surface reduction
   - Secure coding patterns
   - Audit and logging

2. **[Escape Prevention](./guides/02-escape-prevention.md)** ⏱️ 40 min
   - Common escape techniques
   - Prevention strategies
   - Prototype pollution defense
   - Constructor access control

3. **[Memory Management](./guides/03-memory-management.md)** ⏱️ 35 min
   - Memory leak detection
   - Optimization techniques
   - Heap snapshot analysis
   - Resource cleanup patterns

4. **[Production Patterns](./guides/04-production-patterns.md)** ⏱️ 50 min
   - REPL system design
   - Worker Thread integration
   - Error handling strategies
   - Performance optimization

5. **[Multi-tenant Systems](./guides/05-multi-tenant-systems.md)** ⏱️ 45 min
   - Tenant isolation strategies
   - Resource quotas and fairness
   - Scaling patterns
   - Security considerations

---

## Learning Path

### 🎯 Recommended Approach (Complete Learning)

1. **Read the Guides** (4 hours)
   - Work through all 5 conceptual guides
   - Understand security implications
   - Study production patterns

2. **Study the Examples** (1.5 hours)
   - Run each example file
   - Analyze security measures
   - Test edge cases

3. **Complete the Exercises** (3-4 hours)
   - Build production-grade systems
   - Implement all security features
   - Test thoroughly

4. **Review Solutions** (1 hour)
   - Compare implementations
   - Understand trade-offs
   - Apply best practices

### ⚡ Fast Track (Essential Skills)

1. **Read Guides 1, 2, and 4** (90 minutes)
2. **Run Examples 1, 2, 5, 8** (30 minutes)
3. **Complete Exercises 1, 2, 5** (2 hours)
4. **Review Solutions** (30 minutes)

---

## Examples

The following examples demonstrate advanced VM concepts:

### 1. [01-escape-prevention.js](./examples/01-escape-prevention.js)
Comprehensive VM escape prevention techniques including prototype pollution defense, constructor blocking, and Function constructor protection.

### 2. [02-proxy-protection.js](./examples/02-proxy-protection.js)
Proxy-based sandbox protection with fine-grained access control, property interception, and security logging.

### 3. [03-memory-management.js](./examples/03-memory-management.js)
Advanced memory management including leak detection, heap monitoring, automatic cleanup, and memory profiling.

### 4. [04-worker-integration.js](./examples/04-worker-integration.js)
VM integration with Worker Threads for true process isolation, thread pools, and secure message passing.

### 5. [05-production-repl.js](./examples/05-production-repl.js)
Production-grade REPL system with history, multi-line support, autocomplete, and security features.

### 6. [06-resource-monitoring.js](./examples/06-resource-monitoring.js)
Real-time resource monitoring and enforcement including CPU, memory, and execution tracking.

### 7. [07-multi-tenant.js](./examples/07-multi-tenant.js)
Multi-tenant code execution platform with tenant isolation, resource quotas, and fair scheduling.

### 8. [08-security-hardening.js](./examples/08-security-hardening.js)
Complete security hardening patterns combining all defense mechanisms for production deployment.

**Run Examples:**
```bash
cd examples
node 01-escape-prevention.js
node 02-proxy-protection.js
# ... etc
```

---

## Exercises

Apply what you've learned with these hands-on exercises:

### Exercise 1: Hardened Sandbox
**Skills**: Escape prevention, proxy protection, security hardening
**Difficulty**: ⭐⭐⭐ Hard

Build a production-ready hardened sandbox that prevents all common escape techniques and provides comprehensive security.

### Exercise 2: Production REPL
**Skills**: REPL design, Worker Threads, error handling, state management
**Difficulty**: ⭐⭐⭐⭐ Very Hard

Create a production-grade REPL system with history, autocomplete, multi-line editing, and secure execution.

### Exercise 3: Resource Monitor
**Skills**: Memory tracking, CPU monitoring, quota enforcement
**Difficulty**: ⭐⭐⭐ Hard

Implement a comprehensive resource monitoring system with real-time tracking and automatic enforcement.

### Exercise 4: Multi-tenant Executor
**Skills**: Tenant isolation, resource quotas, fair scheduling
**Difficulty**: ⭐⭐⭐⭐ Very Hard

Build a multi-tenant code execution platform that safely runs code from multiple users with resource isolation.

### Exercise 5: Secure Plugin Runtime
**Skills**: Plugin isolation, API design, security hardening
**Difficulty**: ⭐⭐⭐ Hard

Create a secure plugin runtime environment with complete isolation and controlled API access.

**Work on Exercises:**
```bash
cd exercises
node exercise-1.js
node exercise-2.js
# ... etc
```

---

## Solutions

After attempting the exercises, review the solutions:

- [Exercise 1 Solution](./solutions/exercise-1-solution.js) - Hardened Sandbox
- [Exercise 2 Solution](./solutions/exercise-2-solution.js) - Production REPL
- [Exercise 3 Solution](./solutions/exercise-3-solution.js) - Resource Monitor
- [Exercise 4 Solution](./solutions/exercise-4-solution.js) - Multi-tenant Executor
- [Exercise 5 Solution](./solutions/exercise-5-solution.js) - Secure Plugin Runtime

**View Solutions:**
```bash
cd solutions
node exercise-1-solution.js
node exercise-2-solution.js
# ... etc
```

---

## Key Concepts Summary

### VM Escape Prevention

```javascript
const vm = require('vm');

// Prevent prototype pollution and constructor access
function createHardenedContext(sandbox = {}) {
  // Block dangerous constructors
  const context = vm.createContext(Object.create(null));

  // Whitelist safe globals
  context.Math = Math;
  context.JSON = JSON;
  context.console = console;

  // Add user data through proxy
  context.data = new Proxy(sandbox, {
    get(target, prop) {
      if (prop === '__proto__' || prop === 'constructor') {
        return undefined;
      }
      return target[prop];
    },
    set(target, prop, value) {
      if (prop === '__proto__' || prop === 'constructor') {
        throw new Error('Access denied');
      }
      target[prop] = value;
      return true;
    }
  });

  return context;
}
```

### Proxy-Based Protection

```javascript
// Create protected context with proxy
function createProtectedContext(sandbox) {
  const handler = {
    get(target, prop, receiver) {
      // Log all access
      console.log(`[ACCESS] Reading: ${String(prop)}`);

      // Block dangerous properties
      if (['constructor', '__proto__', 'prototype'].includes(prop)) {
        throw new Error(`Access to ${String(prop)} denied`);
      }

      return Reflect.get(target, prop, receiver);
    },

    set(target, prop, value, receiver) {
      // Log all mutations
      console.log(`[MUTATE] Writing: ${String(prop)}`);

      // Validate property names
      if (typeof prop === 'symbol' || prop.startsWith('_')) {
        throw new Error('Cannot set private properties');
      }

      return Reflect.set(target, prop, value, receiver);
    },

    has(target, prop) {
      // Hide internal properties
      if (prop.startsWith('_')) return false;
      return Reflect.has(target, prop);
    }
  };

  return vm.createContext(new Proxy(sandbox, handler));
}
```

### Worker Thread Integration

```javascript
const { Worker } = require('worker_threads');
const vm = require('vm');

// Execute VM code in isolated worker
class WorkerExecutor {
  constructor(maxWorkers = 4) {
    this.workers = [];
    this.queue = [];
    this.maxWorkers = maxWorkers;
  }

  async execute(code, sandbox = {}, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(`
        const { parentPort } = require('worker_threads');
        const vm = require('vm');

        parentPort.on('message', ({ code, sandbox, timeout }) => {
          try {
            const context = vm.createContext(sandbox);
            const result = vm.runInContext(code, context, { timeout });
            parentPort.postMessage({ success: true, result });
          } catch (error) {
            parentPort.postMessage({ success: false, error: error.message });
          }
        });
      `, { eval: true });

      const timer = setTimeout(() => {
        worker.terminate();
        reject(new Error('Worker timeout'));
      }, timeout);

      worker.on('message', (msg) => {
        clearTimeout(timer);
        worker.terminate();

        if (msg.success) {
          resolve(msg.result);
        } else {
          reject(new Error(msg.error));
        }
      });

      worker.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      worker.postMessage({ code, sandbox, timeout });
    });
  }
}
```

### Memory Management

```javascript
const v8 = require('v8');

// Monitor and enforce memory limits
class MemoryManager {
  constructor(maxMemoryMB = 50) {
    this.maxMemory = maxMemoryMB * 1024 * 1024;
    this.snapshots = [];
  }

  takeSnapshot() {
    const stats = v8.getHeapStatistics();
    return {
      timestamp: Date.now(),
      used: stats.used_heap_size,
      total: stats.total_heap_size,
      limit: stats.heap_size_limit
    };
  }

  checkMemory() {
    const snapshot = this.takeSnapshot();
    if (snapshot.used > this.maxMemory) {
      throw new Error(`Memory limit exceeded: ${(snapshot.used / 1024 / 1024).toFixed(2)}MB`);
    }
    return snapshot;
  }

  executeWithMemoryLimit(code, context) {
    const before = this.takeSnapshot();

    try {
      const result = vm.runInContext(code, context);

      const after = this.takeSnapshot();
      const used = after.used - before.used;

      if (used > this.maxMemory) {
        throw new Error('Memory limit exceeded during execution');
      }

      return result;
    } finally {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }
}
```

### Multi-tenant Execution

```javascript
// Multi-tenant executor with isolation
class MultiTenantExecutor {
  constructor() {
    this.tenants = new Map();
  }

  createTenant(tenantId, quota = {}) {
    const tenant = {
      id: tenantId,
      context: vm.createContext(Object.create(null)),
      quota: {
        maxMemory: quota.maxMemory || 50 * 1024 * 1024,
        maxCPU: quota.maxCPU || 1000,
        maxConcurrent: quota.maxConcurrent || 5
      },
      stats: {
        executions: 0,
        totalTime: 0,
        errors: 0
      },
      active: 0
    };

    this.tenants.set(tenantId, tenant);
    return tenant;
  }

  async execute(tenantId, code, timeout = 5000) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check concurrent execution limit
    if (tenant.active >= tenant.quota.maxConcurrent) {
      throw new Error('Concurrent execution limit reached');
    }

    tenant.active++;
    const startTime = Date.now();

    try {
      const result = vm.runInContext(code, tenant.context, {
        timeout: Math.min(timeout, tenant.quota.maxCPU)
      });

      tenant.stats.executions++;
      tenant.stats.totalTime += Date.now() - startTime;

      return result;
    } catch (error) {
      tenant.stats.errors++;
      throw error;
    } finally {
      tenant.active--;
    }
  }

  getTenantStats(tenantId) {
    const tenant = this.tenants.get(tenantId);
    return tenant ? tenant.stats : null;
  }
}
```

---

## Common Pitfalls

### ❌ Pitfall 1: Incomplete Escape Prevention

```javascript
// WRONG - Can be escaped via constructor
const context = vm.createContext({
  Math,
  console
});
vm.runInContext('this.constructor.constructor("return process")()', context);
// Returns process object!

// RIGHT - Block constructor access
const safeContext = vm.createContext(Object.create(null));
Object.assign(safeContext, {
  Math: Object.create(Math),
  console: Object.create(console)
});

// Even safer - use proxy
const protectedContext = new Proxy(safeContext, {
  get(target, prop) {
    if (prop === 'constructor' || prop === '__proto__') {
      return undefined;
    }
    return target[prop];
  }
});
```

### ❌ Pitfall 2: Memory Leaks in Long-Running Contexts

```javascript
// WRONG - Context accumulates data
const context = vm.createContext({ results: [] });
for (let i = 0; i < 10000; i++) {
  vm.runInContext('results.push(new Array(1000))', context);
  // Memory keeps growing!
}

// RIGHT - Clear or recreate context periodically
class ContextPool {
  constructor() {
    this.context = vm.createContext({ results: [] });
    this.executionCount = 0;
    this.maxExecutions = 1000;
  }

  execute(code) {
    if (this.executionCount >= this.maxExecutions) {
      this.context = vm.createContext({ results: [] });
      this.executionCount = 0;
    }

    const result = vm.runInContext(code, this.context);
    this.executionCount++;
    return result;
  }
}
```

### ❌ Pitfall 3: Insufficient Worker Thread Isolation

```javascript
// WRONG - Sharing context between workers
const sharedContext = vm.createContext({ data: {} });

function createWorker() {
  return new Worker(`
    const vm = require('vm');
    // Uses same context - NOT isolated!
  `, { eval: true });
}

// RIGHT - Each worker creates its own context
function createIsolatedWorker(code, sandbox) {
  return new Worker(`
    const { parentPort } = require('worker_threads');
    const vm = require('vm');

    parentPort.on('message', ({ code, sandbox }) => {
      const context = vm.createContext(sandbox); // Fresh context per worker
      const result = vm.runInContext(code, context);
      parentPort.postMessage(result);
    });
  `, { eval: true });
}
```

---

## Practice Projects

Build these advanced projects to reinforce your learning:

### Project 1: Serverless Function Platform
Create a serverless function execution platform:
```javascript
const platform = new ServerlessPlatform();

// Deploy function
await platform.deploy('myFunc', `
  module.exports = async (event) => {
    return { statusCode: 200, body: 'Hello ' + event.name };
  };
`);

// Invoke with resource limits
const result = await platform.invoke('myFunc',
  { name: 'World' },
  { memory: '128MB', timeout: 3000 }
);
```

### Project 2: Code Challenge Platform
Build an online coding challenge platform:
```javascript
const platform = new ChallengePlatform();

// Create challenge
platform.addChallenge('sum', {
  description: 'Sum two numbers',
  tests: [
    { input: [1, 2], expected: 3 },
    { input: [5, 7], expected: 12 }
  ]
});

// Submit solution
const result = await platform.submit('sum', `
  function solution(a, b) {
    return a + b;
  }
`);
// { passed: true, score: 100, runtime: '5ms' }
```

### Project 3: Multi-tenant Analytics Engine
Create an analytics engine for multiple tenants:
```javascript
const engine = new AnalyticsEngine();

// Each tenant gets isolated execution
engine.registerTenant('tenant1', {
  queries: {
    userCount: 'data.users.length',
    avgAge: 'data.users.reduce((sum, u) => sum + u.age, 0) / data.users.length'
  }
});

const results = await engine.execute('tenant1', 'userCount', {
  users: [{ age: 25 }, { age: 30 }, { age: 35 }]
});
```

---

## Testing Your Knowledge

Test your understanding with these questions:

1. **Why is Object.create(null) used for hardened contexts?**
   <details>
   <summary>Answer</summary>

   - Removes prototype chain completely
   - No inherited properties like constructor or __proto__
   - Prevents prototype pollution attacks
   - Eliminates common escape vectors
   - Creates truly empty object with no inheritance
   </details>

2. **How do Worker Threads provide better isolation than VM alone?**
   <details>
   <summary>Answer</summary>

   - Separate V8 isolates (different memory spaces)
   - True process-level isolation
   - Cannot access parent process internals
   - Separate event loops
   - Better crash isolation
   </details>

3. **What makes a REPL "production-ready"?**
   <details>
   <summary>Answer</summary>

   - Comprehensive error handling
   - Resource limits and timeouts
   - History and state management
   - Security hardening
   - Logging and monitoring
   - Graceful degradation
   - Performance optimization
   </details>

4. **How do you prevent memory leaks in long-running VM contexts?**
   <details>
   <summary>Answer</summary>

   - Periodic context recreation
   - Manual garbage collection triggers
   - Memory monitoring and limits
   - Clear references after use
   - Context pooling with cleanup
   - Heap snapshot analysis
   </details>

5. **What are the key components of multi-tenant isolation?**
   <details>
   <summary>Answer</summary>

   - Separate VM contexts per tenant
   - Resource quotas (CPU, memory, concurrent)
   - Fair scheduling
   - Isolated state
   - Monitoring and enforcement
   - Error isolation
   </details>

---

## Best Practices

### 1. Always Use Defense in Depth
```javascript
// Layer multiple security measures
function createSecureContext(sandbox) {
  // Layer 1: Null prototype
  const base = Object.create(null);

  // Layer 2: Whitelist only safe globals
  base.Math = Object.create(Math);
  base.JSON = Object.create(JSON);

  // Layer 3: Proxy protection
  const protected = new Proxy(base, {
    get(target, prop) {
      if (['constructor', '__proto__', 'prototype'].includes(prop)) {
        throw new Error('Access denied');
      }
      return target[prop];
    }
  });

  // Layer 4: VM context
  return vm.createContext(protected);
}
```

### 2. Monitor All Resource Usage
```javascript
// Comprehensive resource monitoring
class ResourceMonitor {
  async executeWithMonitoring(code, context) {
    const startTime = Date.now();
    const startMemory = v8.getHeapStatistics().used_heap_size;

    try {
      const result = await vm.runInContext(code, context, {
        timeout: 5000
      });

      return {
        result,
        metrics: {
          duration: Date.now() - startTime,
          memory: v8.getHeapStatistics().used_heap_size - startMemory,
          success: true
        }
      };
    } catch (error) {
      return {
        error: error.message,
        metrics: {
          duration: Date.now() - startTime,
          memory: v8.getHeapStatistics().used_heap_size - startMemory,
          success: false
        }
      };
    }
  }
}
```

### 3. Use Worker Threads for Critical Isolation
```javascript
// Critical code should run in workers
class CriticalExecutor {
  async executeInWorker(code, sandbox) {
    const worker = new Worker(`
      const { parentPort } = require('worker_threads');
      const vm = require('vm');

      parentPort.on('message', ({ code, sandbox }) => {
        try {
          const context = vm.createContext(sandbox);
          const result = vm.runInContext(code, context);
          parentPort.postMessage({ success: true, result });
        } catch (error) {
          parentPort.postMessage({ success: false, error: error.message });
        } finally {
          process.exit(0); // Clean exit
        }
      });
    `, { eval: true });

    return new Promise((resolve, reject) => {
      worker.on('message', (msg) => {
        msg.success ? resolve(msg.result) : reject(new Error(msg.error));
      });
      worker.postMessage({ code, sandbox });
    });
  }
}
```

---

## Next Steps

Once you've completed Level 3:

1. ✅ **Master**: Ensure you understand all advanced concepts
2. ✅ **Apply**: Build a production-ready VM-based system
3. ✅ **Deploy**: Deploy and monitor in production
4. ✅ **Optimize**: Performance tune for your use case
5. ➡️ **Explore**: Related modules (Worker Threads, Cluster, Child Process)

---

## Getting Help

If you're stuck:

1. **Review security guides** - Understanding threats is key
2. **Study complete examples** - See all layers working together
3. **Analyze solutions** - Learn production patterns
4. **Test edge cases** - Try to break your implementation
5. **Build projects** - Real-world application solidifies learning

---

## Additional Resources

- [Node.js VM Security Best Practices](https://nodejs.org/api/vm.html#vm_vm_executing_javascript)
- [V8 Isolates and Security](https://v8.dev/docs/embed)
- [Worker Threads Documentation](https://nodejs.org/api/worker_threads.html)
- [Memory Leak Detection in Node.js](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Multi-tenant Architecture Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/overview)

---

**Ready to start?** Begin with [Guide 1: Security Hardening](./guides/01-security-hardening.md) or jump straight to [Example 1](./examples/01-escape-prevention.js)!

Happy learning! 🚀
