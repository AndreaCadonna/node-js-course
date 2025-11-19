# Level 3 Advanced - Examples

This directory contains 8 comprehensive examples demonstrating advanced VM security, production patterns, and multi-tenant architectures.

## Examples Overview

### [01-escape-prevention.js](./01-escape-prevention.js)
**Preventing VM Escape Techniques**

Comprehensive demonstration of VM escape prevention including:
- Common escape vector identification
- Null prototype contexts
- Constructor blocking
- Prototype pollution prevention
- Multi-layer defense strategies
- Production-ready hardened sandbox

```bash
node 01-escape-prevention.js
```

**Key Concepts:**
- Object.create(null) for prototype removal
- Property blacklisting
- Defensive copying
- Access control layers

---

### [02-proxy-protection.js](./02-proxy-protection.js)
**Proxy-Based Sandbox Protection**

Advanced proxy-based protection mechanisms:
- Fine-grained access control
- Property interception and validation
- Multi-layer proxy defense
- Revocable proxies
- Access control matrix
- Security logging

```bash
node 02-proxy-protection.js
```

**Key Concepts:**
- Proxy handler traps
- Layered security
- Permission systems
- Revocable access

---

### [03-memory-management.js](./03-memory-management.js)
**Advanced Memory Management**

Complete memory management and leak prevention:
- Memory leak detection
- Heap snapshot analysis
- Managed contexts with cleanup
- Context pooling
- Memory profiling
- Resource recycling

```bash
node 03-memory-management.js
```

**Key Concepts:**
- V8 heap statistics
- Memory tracking
- Context lifecycle
- Pool patterns

---

### [04-worker-integration.js](./04-worker-integration.js)
**VM with Worker Threads**

True process isolation using Worker Threads:
- VM execution in workers
- Worker thread pools
- Secure message passing
- Auto-scaling workers
- Production worker management
- Thread safety

```bash
node 04-worker-integration.js
```

**Key Concepts:**
- Worker threads
- Process isolation
- Message validation
- Thread pooling

---

### [05-production-repl.js](./05-production-repl.js)
**Production-Grade REPL System**

Complete REPL implementation:
- Multi-line input support
- Command history
- Auto-completion
- Security features
- Session persistence
- Built-in commands
- Execution logging

```bash
node 05-production-repl.js
```

**Key Concepts:**
- REPL design
- State management
- Input completion
- Command systems

---

### [06-resource-monitoring.js](./06-resource-monitoring.js)
**Resource Usage Monitoring**

Real-time resource tracking and enforcement:
- CPU time monitoring
- Memory usage tracking
- Resource quotas
- Performance profiling
- Violation detection
- Comprehensive metrics

```bash
node 06-resource-monitoring.js
```

**Key Concepts:**
- CPU profiling
- Memory tracking
- Quota systems
- Performance analysis

---

### [07-multi-tenant.js](./07-multi-tenant.js)
**Multi-Tenant Code Execution**

Complete multi-tenant architecture:
- Tenant isolation
- Per-tenant resource quotas
- Fair scheduling
- Usage tracking
- Billing integration
- Production platform

```bash
node 07-multi-tenant.js
```

**Key Concepts:**
- Tenant isolation
- Resource quotas
- Fair scheduling
- Usage billing

---

### [08-security-hardening.js](./08-security-hardening.js)
**Complete Security Patterns**

Production-ready security implementation:
- Secure context builder
- Security audit logging
- Intrusion detection
- Hash-based integrity
- Automatic threat response
- Complete security system

```bash
node 08-security-hardening.js
```

**Key Concepts:**
- Defense in depth
- Audit logging
- Threat detection
- Integrity verification

---

## Running All Examples

To run all examples sequentially:

```bash
for file in 01-*.js 02-*.js 03-*.js 04-*.js 05-*.js 06-*.js 07-*.js 08-*.js; do
  echo "Running $file..."
  node "$file"
  echo ""
done
```

## Example Categories

### Security (Examples 1, 2, 8)
- Escape prevention
- Proxy protection
- Complete hardening

### Performance (Examples 3, 6)
- Memory management
- Resource monitoring

### Architecture (Examples 4, 5, 7)
- Worker integration
- REPL systems
- Multi-tenancy

## Learning Path

**Recommended Order:**

1. **Start with Security**: 01 → 02 → 08
   - Understand threats and defenses
   - Learn protection layers
   - See complete implementation

2. **Performance & Resources**: 03 → 06
   - Memory management
   - Resource monitoring
   - Optimization techniques

3. **Advanced Architecture**: 04 → 07 → 05
   - Worker threads
   - Multi-tenant systems
   - Production REPL

## Key Takeaways

After studying these examples, you should understand:

- ✅ How to prevent VM escape attempts
- ✅ How to use proxies for access control
- ✅ How to manage memory in long-running contexts
- ✅ How to integrate VM with Worker Threads
- ✅ How to build production REPL systems
- ✅ How to monitor and enforce resource limits
- ✅ How to build multi-tenant platforms
- ✅ How to implement defense-in-depth security

## Common Patterns

### Hardened Context Creation
```javascript
const base = Object.create(null);
// Add whitelisted globals
const proxied = new Proxy(base, securityHandler);
const context = vm.createContext(proxied);
```

### Resource Monitoring
```javascript
const before = v8.getHeapStatistics();
const result = vm.runInContext(code, context, { timeout });
const after = v8.getHeapStatistics();
const used = after.used_heap_size - before.used_heap_size;
```

### Worker Isolation
```javascript
const worker = new Worker(workerCode, { eval: true });
worker.postMessage({ code, sandbox });
worker.on('message', (result) => { /* handle */ });
```

### Multi-Tenant Execution
```javascript
const tenant = {
  id,
  context: vm.createContext({ /* isolated */ }),
  quotas: { /* limits */ },
  usage: { /* tracking */ }
};
```

## Next Steps

1. Run each example and study the output
2. Modify examples to test different scenarios
3. Combine patterns from multiple examples
4. Proceed to exercises to build your own implementations
5. Review guides for deeper theoretical understanding

---

**Note**: These examples are production-quality implementations demonstrating best practices for secure, efficient, and scalable VM usage in Node.js.
