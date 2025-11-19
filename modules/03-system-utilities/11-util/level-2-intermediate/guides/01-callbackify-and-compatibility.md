# Callbackify and Backward Compatibility

**Reading Time:** 20 minutes
**Difficulty:** Intermediate
**Prerequisites:** Level 1 Util Basics, Understanding of callbacks and promises

## Introduction

In the real world, APIs evolve. Modern Node.js favors promises and async/await, but millions of lines of existing code still use callbacks. How do you modernize your API without breaking existing applications? This is where `util.callbackify()` and backward compatibility strategies become essential.

**Why This Matters:**
- APIs serve many users with different codebases
- Breaking changes cost your users time and money
- Smooth migrations maintain trust and adoption
- Understanding both paradigms makes you a better developer

## What You'll Learn

By the end of this guide, you'll understand:

- When and why to use `util.callbackify()`
- How to maintain backward compatible APIs
- Strategies for gradual migration
- Best practices for dual API support
- How to communicate API changes effectively

---

## Part 1: Understanding Callbackify

### What is util.callbackify()?

`util.callbackify()` is the reverse of `util.promisify()`. It converts a promise-based function into a callback-based one.

```javascript
const util = require('util');

// Modern async function
async function fetchUser(id) {
  const user = await database.query('SELECT * FROM users WHERE id = ?', [id]);
  return user;
}

// Convert to callback style
const fetchUserCallback = util.callbackify(fetchUser);

// Now works with callbacks
fetchUserCallback(123, (err, user) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('User:', user);
});
```

### How It Works

The conversion follows Node.js callback convention:

| Promise State | Callback Arguments |
|--------------|-------------------|
| Resolved | `(null, result)` |
| Rejected | `(error)` |

```javascript
async function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

const divideCallback = util.callbackify(divide);

// Success case
divideCallback(10, 2, (err, result) => {
  if (err) return console.error(err);
  console.log(result); // 5
});

// Error case
divideCallback(10, 0, (err, result) => {
  if (err) return console.error(err.message); // "Division by zero"
  console.log(result);
});
```

---

## Part 2: When to Use Callbackify

### ✅ Good Use Cases

**1. API Migration**
You're modernizing an API from callbacks to promises, but users need time to migrate:

```javascript
// Internal implementation (modern)
class UserService {
  async getUser(id) {
    return await db.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}

// Public API (backward compatible)
const service = new UserService();

// Modern API
exports.getUser = service.getUser.bind(service);

// Legacy API (for existing users)
exports.getUserCallback = util.callbackify(service.getUser.bind(service));
```

**2. Supporting Legacy Code**
Your library is used by applications that haven't migrated to promises yet:

```javascript
class ConfigLoader {
  async load(path) {
    const content = await fs.promises.readFile(path, 'utf8');
    return JSON.parse(content);
  }

  // Provide callback version for legacy users
  loadCallback = util.callbackify(this.load.bind(this));
}

// Usage
const loader = new ConfigLoader();

// New code
const config = await loader.load('config.json');

// Old code
loader.loadCallback('config.json', (err, config) => {
  if (err) throw err;
  console.log(config);
});
```

### ❌ When NOT to Use Callbackify

**1. New APIs**
Don't support both styles in brand new APIs. Choose one:

```javascript
// ❌ BAD: New API with dual support
class NewService {
  async doThing() { /* ... */ }
  doThingCallback = util.callbackify(this.doThing);
}

// ✅ GOOD: Pick one style
class NewService {
  async doThing() { /* ... */ }
  // That's it. Just promises.
}
```

**2. Performance-Critical Code**
Callbackify adds overhead. If performance is critical, maintain separate implementations:

```javascript
// ❌ BAD: Callbackify in hot path
for (let i = 0; i < 1000000; i++) {
  const cb = util.callbackify(asyncFn);
  cb(data, callback);
}

// ✅ GOOD: Separate implementations
function asyncVersion() { /* promise implementation */ }
function callbackVersion(callback) { /* callback implementation */ }
```

---

## Part 3: Backward Compatibility Strategies

### Strategy 1: Dual Export

Export both versions, mark callback version as legacy:

```javascript
// lib/user-service.js
class UserService {
  async getUser(id) {
    // Modern implementation
    return await db.users.findById(id);
  }
}

const service = new UserService();

module.exports = {
  // Modern API (recommended)
  getUser: service.getUser.bind(service),

  // Legacy API (deprecated)
  getUserCallback: util.deprecate(
    util.callbackify(service.getUser.bind(service)),
    'getUserCallback is deprecated. Use getUser() with promises/async-await.',
    'DEP_USER_001'
  )
};
```

### Strategy 2: Automatic Detection

Detect callback vs promise usage automatically:

```javascript
class SmartAPI {
  getUser(id, callback) {
    // Detect usage style
    if (typeof callback === 'function') {
      // Callback style
      const callbackFn = util.callbackify(this._getUserAsync.bind(this));
      return callbackFn(id, callback);
    }

    // Promise style
    return this._getUserAsync(id);
  }

  async _getUserAsync(id) {
    return await db.users.findById(id);
  }
}

// Usage
const api = new SmartAPI();

// Promise style
const user = await api.getUser(123);

// Callback style
api.getUser(123, (err, user) => {
  if (err) return console.error(err);
  console.log(user);
});
```

### Strategy 3: Separate Packages

For major API changes, publish separate packages:

```
mylib@1.x → callback-based (maintenance mode)
mylib@2.x → promise-based (active development)
```

This gives users full control over migration timing.

---

## Part 4: Migration Best Practices

### ✅ DO:

**1. Provide Clear Migration Paths**
```javascript
// ❌ BAD: Vague deprecation
const oldFn = util.deprecate(fn, 'Deprecated');

// ✅ GOOD: Clear guidance
const oldFn = util.deprecate(
  fn,
  'oldFunction() is deprecated. Migration:\n' +
  '  Old: oldFunction(data, callback)\n' +
  '  New: await newFunction(data)\n' +
  'See: https://docs.example.com/migration'
);
```

**2. Give Users Time**
```javascript
// Timeline example
// v1.5.0 - Deprecate callback API, add promise API
// v2.0.0 - Stop adding features to callback API
// v3.0.0 - Remove callback API (with 1 year notice)
```

**3. Document Migration**
Create migration guides with:
- What's changing
- Why it's changing
- How to migrate (with examples)
- Timeline for removal
- Support channels

**4. Track Usage**
```javascript
class APIWithTracking {
  constructor() {
    this.stats = { callbacks: 0, promises: 0 };
  }

  getData(id, callback) {
    if (typeof callback === 'function') {
      this.stats.callbacks++;
      console.warn('Callback usage detected. Please migrate to promises.');
      return util.callbackify(this._getDataAsync)(id, callback);
    }

    this.stats.promises++;
    return this._getDataAsync(id);
  }

  async _getDataAsync(id) {
    return await db.get(id);
  }

  getUsageStats() {
    const total = this.stats.callbacks + this.stats.promises;
    const callbackPercent = (this.stats.callbacks / total * 100).toFixed(1);

    return {
      ...this.stats,
      callbackPercent: `${callbackPercent}%`
    };
  }
}
```

### ❌ DON'T:

**1. Break Compatibility Suddenly**
```javascript
// ❌ BAD: Remove immediately
// v1.0: has getUser(callback)
// v2.0: removed getUser entirely → Users' apps break!

// ✅ GOOD: Gradual deprecation
// v1.0: getUser(callback)
// v1.5: getUser(callback) deprecated, getUser() added
// v2.0: getUser(callback) still works, shows warnings
// v3.0: getUser(callback) removed
```

**2. Create Callback Version in Hot Path**
```javascript
// ❌ BAD: Creates wrapper every time
function getData(id, callback) {
  if (callback) {
    return util.callbackify(this.getDataAsync)(id, callback);
  }
  return this.getDataAsync(id);
}

// ✅ GOOD: Create once
constructor() {
  this.getDataCallback = util.callbackify(this.getDataAsync.bind(this));
}

function getData(id, callback) {
  if (callback) {
    return this.getDataCallback(id, callback);
  }
  return this.getDataAsync(id);
}
```

**3. Forget Context Binding**
```javascript
// ❌ BAD: Lost context
class Service {
  constructor() {
    this.data = 'important';
    this.getData = util.callbackify(this.getDataAsync);
    // 'this' will be undefined when called!
  }
}

// ✅ GOOD: Bind context
class Service {
  constructor() {
    this.data = 'important';
    this.getData = util.callbackify(this.getDataAsync.bind(this));
  }
}
```

---

## Part 5: Real-World Example

### Complete Migration Strategy

```javascript
const util = require('util');

/**
 * Database wrapper with full backward compatibility
 */
class Database {
  constructor(options = {}) {
    this.options = options;
    this.strict = options.strict || false;
    this.trackUsage = options.trackUsage || false;

    if (this.trackUsage) {
      this.usageStats = {
        callbacks: 0,
        promises: 0
      };
    }
  }

  // Modern implementation (internal)
  async _queryAsync(sql, params = []) {
    // Actual database query
    return { rows: [], rowCount: 0 };
  }

  // Public API: Support both styles
  query(sql, params, callback) {
    // Handle optional params
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }

    // Callback style
    if (typeof callback === 'function') {
      // Track usage
      if (this.trackUsage) {
        this.usageStats.callbacks++;
      }

      // Strict mode: Throw error
      if (this.strict) {
        throw new Error(
          'Callback API is disabled in strict mode. ' +
          'Use promises/async-await instead.'
        );
      }

      // Deprecation warning
      const deprecated = util.deprecate(
        util.callbackify(this._queryAsync.bind(this)),
        '[DEP_DB_001] query(sql, params, callback) is deprecated.\n' +
        '  Migration: const result = await db.query(sql, params)\n' +
        '  See: https://docs.example.com/migration#DEP_DB_001',
        'DEP_DB_001'
      );

      return deprecated(sql, params, callback);
    }

    // Promise style
    if (this.trackUsage) {
      this.usageStats.promises++;
    }

    return this._queryAsync(sql, params);
  }

  getMigrationReport() {
    if (!this.trackUsage) {
      return 'Usage tracking not enabled';
    }

    const total = this.usageStats.callbacks + this.usageStats.promises;
    const callbackPercent = total > 0
      ? (this.usageStats.callbacks / total * 100).toFixed(1)
      : 0;

    return {
      stats: this.usageStats,
      callbackPercentage: `${callbackPercent}%`,
      recommendation: callbackPercent > 50
        ? 'High callback usage. Plan migration strategy.'
        : callbackPercent > 0
          ? 'Some callback usage. Continue gradual migration.'
          : 'Fully migrated to promises!'
    };
  }
}

// Usage examples
const db = new Database({ trackUsage: true });

// Modern usage (recommended)
async function modernCode() {
  const result = await db.query('SELECT * FROM users');
  console.log(result);
}

// Legacy usage (deprecated but supported)
function legacyCode() {
  db.query('SELECT * FROM users', (err, result) => {
    if (err) throw err;
    console.log(result);
  });
}

// Strict mode (for new projects)
const strictDb = new Database({ strict: true });
// strictDb.query('SELECT *', callback); // Throws error
```

---

## Summary

### Key Takeaways

1. **util.callbackify() converts promises to callbacks** - Use it for backward compatibility during API migrations, not for new APIs.

2. **Backward compatibility requires planning** - Give users time to migrate, provide clear paths, and track usage.

3. **Dual API support is temporary** - Support both during transition, but plan to remove callback API eventually.

4. **Context matters** - Always use `.bind(this)` when creating callbackified versions to preserve context.

5. **Gradual migration works best** - Deprecate → Warn → Remove over multiple major versions.

### Migration Checklist

- [ ] Implement modern async/await version
- [ ] Create callbackified version for backward compatibility
- [ ] Add deprecation warnings with clear messages
- [ ] Document migration path with examples
- [ ] Track callback vs promise usage
- [ ] Communicate timeline for removal
- [ ] Support both APIs for at least one major version
- [ ] Remove callback API in major version bump

### Quick Reference

```javascript
// Convert promise to callback
const callbackFn = util.callbackify(asyncFn);

// Always bind context
const boundCallback = util.callbackify(obj.method.bind(obj));

// Add deprecation
const deprecated = util.deprecate(
  callbackFn,
  'Use promise version instead',
  'DEP_CODE'
);

// Dual API detection
function dualAPI(...args) {
  const callback = args[args.length - 1];
  if (typeof callback === 'function') {
    return callbackVersion(...args);
  }
  return promiseVersion(...args);
}
```

---

## Next Steps

- Practice: Try Exercise 1 to build a backward compatible API
- Read: [Deprecation Strategies](./02-deprecation-strategies.md) to learn proper API deprecation
- Explore: Check out major libraries' migration strategies (e.g., `request` → `got`)

## Further Reading

- [Node.js API Deprecation](https://nodejs.org/api/deprecations.html)
- [Semantic Versioning](https://semver.org/)
- [Promise Migration Guide](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
