# Guide 1: Security Hardening

**Reading Time**: ~45 minutes

This guide covers advanced security hardening patterns for VM-based code execution, including defense-in-depth strategies, attack surface reduction, and comprehensive security architectures.

## Table of Contents

1. [Introduction](#introduction)
2. [Security Principles](#security-principles)
3. [Attack Vectors](#attack-vectors)
4. [Defense Strategies](#defense-strategies)
5. [Implementation Patterns](#implementation-patterns)
6. [Security Architecture](#security-architecture)
7. [Monitoring and Auditing](#monitoring-and-auditing)
8. [Best Practices](#best-practices)

---

## Introduction

Security hardening is the process of applying multiple layers of defense to protect against code injection, escape attempts, and resource abuse. This guide presents production-ready patterns for secure VM execution.

### Why Security Hardening Matters

- **Untrusted Code**: Running user code safely
- **Data Protection**: Preventing data exfiltration
- **System Integrity**: Protecting host environment
- **Compliance**: Meeting security requirements

### Reference Implementations

For complete working examples, see:
- `../examples/01-escape-prevention.js` - Escape prevention patterns
- `../examples/02-proxy-protection.js` - Proxy-based security
- `../examples/08-security-hardening.js` - Complete security system

---

## Security Principles

### 1. Defense in Depth

Multiple security layers provide redundancy:

```javascript
// Layer 1: Null Prototype
const base = Object.create(null);

// Layer 2: Whitelist Globals
base.Math = Object.create(Math);
base.JSON = Object.create(JSON);

// Layer 3: Proxy Protection
const handler = {
  get(target, prop) {
    if (blacklist.has(prop)) throw new Error('Blocked');
    return Reflect.get(target, prop);
  }
};
const protected = new Proxy(base, handler);

// Layer 4: VM Context
const context = vm.createContext(protected);
```

### 2. Least Privilege

Provide minimal necessary access:
- Start with no access
- Add only required capabilities
- Use whitelists, not blacklists
- Principle of deny-by-default

### 3. Fail Secure

Errors should not compromise security:
- Catch all exceptions
- Log security events
- Maintain security on failure
- Never expose internals in errors

---

## Attack Vectors

### Constructor Access

**Attack**:
```javascript
this.constructor.constructor('return process')()
```

**Prevention**:
```javascript
// Null prototype removes constructor
const base = Object.create(null);

// Or block in proxy
get(target, prop) {
  if (prop === 'constructor') {
    throw new Error('Access denied');
  }
  return Reflect.get(target, prop);
}
```

### Prototype Pollution

**Attack**:
```javascript
Object.prototype.polluted = true;
__proto__.evil = true;
```

**Prevention**:
```javascript
// Null prototype base
const base = Object.create(null);

// Block in proxy
set(target, prop, value) {
  if (prop === '__proto__' || prop === 'constructor') {
    throw new Error('Prototype pollution blocked');
  }
  return Reflect.set(target, prop, value);
}
```

### Function Constructor

**Attack**:
```javascript
(function(){}).constructor('return process')()
```

**Prevention**:
```javascript
// Remove Function from context
// Block function properties in proxy
// Validate code before execution
```

For comprehensive attack vector analysis and prevention, see:
`../examples/01-escape-prevention.js`

---

## Defense Strategies

### Strategy 1: Null Prototype Base

Remove prototype chain entirely:

```javascript
const base = Object.create(null);
// No inherited properties
// No constructor
// No __proto__
```

**Benefits**:
- Eliminates prototype pollution
- Removes constructor access
- Clean slate for security

### Strategy 2: Global Whitelisting

Allow only safe globals:

```javascript
const safeGlobals = ['Math', 'JSON', 'Date', 'Array', 'Object'];
const base = Object.create(null);

safeGlobals.forEach(name => {
  if (global[name]) {
    // Create clean copy
    const descriptor = Object.getOwnPropertyDescriptors(global[name]);
    base[name] = Object.create(null, descriptor);
    Object.freeze(base[name]);
  }
});
```

### Strategy 3: Proxy-Based Protection

Intercept all property access:

```javascript
const blacklist = new Set([
  'constructor', '__proto__', 'prototype',
  'eval', 'Function', 'process', 'require',
  'global', 'globalThis', 'module', 'Buffer'
]);

const handler = {
  get(target, prop, receiver) {
    if (blacklist.has(prop)) {
      logSecurityEvent('blocked_access', prop);
      throw new Error(`Access to ${prop} denied`);
    }
    return Reflect.get(target, prop, receiver);
  },
  
  set(target, prop, value, receiver) {
    if (blacklist.has(prop)) {
      logSecurityEvent('blocked_mutation', prop);
      throw new Error(`Mutation of ${prop} denied`);
    }
    return Reflect.set(target, prop, value, receiver);
  },
  
  has(target, prop) {
    if (blacklist.has(prop)) return false;
    return Reflect.has(target, prop);
  }
};
```

See `../examples/02-proxy-protection.js` for advanced proxy patterns.

---

## Implementation Patterns

### Complete Security System

```javascript
class SecureExecutor {
  constructor() {
    this.blacklist = new Set([/* dangerous props */]);
    this.whitelist = new Set([/* safe globals */]);
  }

  createSecureContext(sandbox = {}) {
    // 1. Null prototype base
    const base = Object.create(null);
    
    // 2. Add whitelisted globals
    this.whitelist.forEach(name => {
      base[name] = this.createSafeCopy(global[name]);
    });
    
    // 3. Add sandbox data (deep clone)
    Object.assign(base, this.deepClone(sandbox));
    
    // 4. Apply proxy protection
    const protected = new Proxy(base, this.createHandler());
    
    // 5. Create VM context
    return vm.createContext(protected);
  }

  createHandler() {
    return {
      get: (target, prop) => this.handleGet(target, prop),
      set: (target, prop, value) => this.handleSet(target, prop, value),
      has: (target, prop) => this.handleHas(target, prop),
      deleteProperty: (target, prop) => this.handleDelete(target, prop)
    };
  }

  execute(code, sandbox = {}, timeout = 5000) {
    const context = this.createSecureContext(sandbox);
    
    try {
      const result = vm.runInContext(code, context, {
        timeout,
        displayErrors: true
      });
      
      this.logExecution('success', code);
      return { success: true, result };
    } catch (error) {
      this.logExecution('error', code, error);
      return { success: false, error: error.message };
    }
  }
}
```

Complete implementation: `../examples/08-security-hardening.js`

---

## Security Architecture

### Layered Security Model

```
┌─────────────────────────────────┐
│   Application Layer             │
│   - Input validation            │
│   - Rate limiting               │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│   Security Layer                │
│   - Audit logging               │
│   - Threat detection            │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│   Proxy Layer                   │
│   - Access control              │
│   - Property blocking           │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│   VM Layer                      │
│   - Timeout enforcement         │
│   - Resource limits             │
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│   Context Layer                 │
│   - Null prototype              │
│   - Whitelist globals           │
└─────────────────────────────────┘
```

---

## Monitoring and Auditing

### Security Event Logging

```javascript
class SecurityAuditLogger {
  log(level, category, event, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,      // info, warning, critical
      category,   // execution, access, security
      event,      // specific event
      details,    // additional data
      hash: this.calculateHash(/* ... */)
    };
    
    this.logs.push(entry);
    
    if (level === 'critical') {
      this.createAlert(entry);
    }
  }
}
```

### Intrusion Detection

```javascript
class IntrusionDetector {
  analyzeCode(code) {
    const threats = [];
    
    // Pattern matching
    this.patterns.forEach(pattern => {
      if (pattern.regex.test(code)) {
        threats.push({
          type: pattern.name,
          severity: pattern.severity
        });
      }
    });
    
    return {
      safe: threats.length === 0,
      threats
    };
  }
}
```

Complete implementation: `../examples/08-security-hardening.js` (Part 2, 3)

---

## Best Practices

### 1. Always Use Multiple Layers

Never rely on single defense mechanism:
```javascript
// GOOD: Multiple layers
const base = Object.create(null);           // Layer 1
addWhitelistedGlobals(base);               // Layer 2
const protected = new Proxy(base, handler); // Layer 3
const context = vm.createContext(protected);// Layer 4
```

### 2. Log All Security Events

Comprehensive logging enables threat detection:
```javascript
function handleAccess(prop) {
  logger.log('info', 'access', 'property-access', {
    property: prop,
    timestamp: Date.now()
  });
  
  if (isBlocked(prop)) {
    logger.log('critical', 'security', 'blocked-access', {
      property: prop
    });
  }
}
```

### 3. Validate All Inputs

Never trust user input:
```javascript
function validateCode(code) {
  // Check length
  if (code.length > MAX_CODE_LENGTH) {
    throw new Error('Code too long');
  }
  
  // Check patterns
  if (containsDangerousPatterns(code)) {
    throw new Error('Dangerous patterns detected');
  }
  
  // Validate syntax
  try {
    new vm.Script(code);
  } catch (err) {
    throw new Error('Syntax error');
  }
}
```

### 4. Regular Security Audits

Test security regularly:
```javascript
const securityTests = [
  'this.constructor.constructor("return process")()',
  '__proto__.polluted = true',
  'Object.prototype.evil = true',
  'eval("alert(1)")',
  '(function(){}).constructor("return process")()'
];

securityTests.forEach(test => {
  const result = execute(test);
  assert(result.success === false, `Security breach: ${test}`);
});
```

### 5. Keep Dependencies Updated

Security patches are critical:
- Monitor for VM-related vulnerabilities
- Update Node.js regularly
- Review security advisories
- Test after updates

---

## Summary

Security hardening requires:
1. **Multiple Layers**: Defense in depth
2. **Whitelist Approach**: Allow only known-safe
3. **Comprehensive Logging**: Track all events
4. **Regular Testing**: Verify security holds
5. **Continuous Monitoring**: Detect threats

**Next**: Read [Guide 2: Escape Prevention](./02-escape-prevention.md) for deeper dive into specific attack vectors.

**Reference**: See `../examples/08-security-hardening.js` for complete production implementation.
