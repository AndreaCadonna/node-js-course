# Deprecation Strategies

**Reading Time:** 15 minutes
**Difficulty:** Intermediate
**Prerequisites:** Understanding of semantic versioning, API design basics

## Introduction

Deprecating APIs is an art. Do it poorly, and you anger your users. Do it well, and you maintain trust while evolving your software. This guide teaches you how to deprecate features professionally using `util.deprecate()` and related strategies.

**Why This Matters:**
- All successful software evolves
- Poor deprecation breaks user trust
- Good deprecation maintains adoption
- Professional communication separates good libraries from great ones

## What You'll Learn

- How to use `util.deprecate()` effectively
- Creating helpful deprecation warnings
- Planning deprecation timelines
- Communicating breaking changes
- Tracking deprecated feature usage
- Building migration guides

---

## Part 1: Understanding util.deprecate()

### Basic Usage

`util.deprecate()` wraps a function to emit a deprecation warning on first use:

```javascript
const util = require('util');

function oldAPI(data) {
  return processData(data);
}

const deprecatedAPI = util.deprecate(
  oldAPI,
  'oldAPI() is deprecated. Use newAPI() instead.'
);

// First call shows warning
deprecatedAPI(data); // Shows: DeprecationWarning: oldAPI() is deprecated...

// Subsequent calls don't repeat warning (same process)
deprecatedAPI(data); // No warning
```

### With Deprecation Codes

Use codes for tracking and documentation:

```javascript
const deprecatedFunction = util.deprecate(
  originalFunction,
  'This function is deprecated',
  'DEP0001' // Unique code
);
```

**Benefits of codes:**
- Easy to reference in documentation
- Searchable in codebases
- Trackable in monitoring systems
- Filter specific warnings

---

## Part 2: Anatomy of Good Deprecation Warning

### ❌ Bad Deprecation Message

```javascript
const bad = util.deprecate(fn, 'Deprecated');
```

**Problems:**
- No context
- No alternative
- No timeline
- Not helpful

### ✅ Good Deprecation Message

```javascript
const good = util.deprecate(
  oldMethod,
  '[DEP0001] oldMethod(x, y) is deprecated and will be removed in v3.0.0.\n' +
  '\n' +
  'Reason: The API design was inconsistent with the rest of the library.\n' +
  '\n' +
  'Migration:\n' +
  '  Old: oldMethod(x, y)\n' +
  '  New: newMethod({ x, y })\n' +
  '\n' +
  'Timeline:\n' +
  '  Deprecated: v1.5.0\n' +
  '  Removed: v3.0.0\n' +
  '\n' +
  'See: https://docs.example.com/migration/DEP0001',
  'DEP0001'
);
```

**Includes:**
✅ Deprecation code
✅ What's deprecated
✅ When it'll be removed
✅ Why it's deprecated
✅ How to migrate (with examples)
✅ Timeline
✅ Link to detailed guide

---

## Part 3: Deprecation Timeline Strategy

### The 3-Phase Approach

| Phase | Version | Action | Duration |
|-------|---------|--------|----------|
| 1. Announce | v1.5.0 | Add new API, deprecate old | 6-12 months |
| 2. Warn | v2.0.0 | Keep old API, loud warnings | 6-12 months |
| 3. Remove | v3.0.0 | Remove old API | - |

### Example Timeline

```javascript
// v1.5.0 - Introduce deprecation
class API {
  // New API (recommended)
  async getUser(id) {
    return await db.users.findById(id);
  }

  // Old API (deprecated)
  getUserById = util.deprecate(
    function(id, callback) {
      this.getUser(id)
        .then(user => callback(null, user))
        .catch(err => callback(err));
    }.bind(this),
    '[DEP_API_001] getUserById is deprecated. Use getUser() with async/await.\n' +
    'Will be removed in v3.0.0 (approximately June 2025).',
    'DEP_API_001'
  );
}

// v2.0.0 - Stronger warnings
// Old API still works but warnings are more prominent
// Documentation clearly states removal timeline

// v3.0.0 - Remove old API
// Old API removed from codebase
```

### Semantic Versioning Rules

Follow [SemVer](https://semver.org/):

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Add deprecation warning | Minor (1.0.0 → 1.1.0) | Adding warning is not breaking |
| Remove deprecated feature | Major (1.9.0 → 2.0.0) | Removal is breaking |
| Fix bug in deprecated feature | Patch (1.0.0 → 1.0.1) | Bug fixes always patch |

```javascript
// ✅ Correct versioning
// 1.0.0 - feature exists, no warning
// 1.1.0 - add deprecation warning (minor bump)
// 1.2.0 - other new features
// 2.0.0 - remove feature (major bump)

// ❌ Incorrect versioning
// 1.0.0 - feature exists
// 1.1.0 - remove feature (should be 2.0.0!)
```

---

## Part 4: Deprecation Patterns

### Pattern 1: Function Deprecation

```javascript
// Deprecate entire function
exports.oldFunction = util.deprecate(
  function(data) {
    return processData(data);
  },
  'oldFunction is deprecated. Use newFunction instead.',
  'DEP0001'
);

// New function
exports.newFunction = function(data) {
  return processData(data);
};
```

### Pattern 2: Parameter Deprecation

```javascript
function loadConfig(path, options = {}) {
  // Deprecate specific parameter
  if ('sync' in options) {
    const warn = util.deprecate(
      () => {},
      '[DEP0002] loadConfig option "sync" is deprecated.\n' +
      '  Use "async: false" instead.',
      'DEP0002'
    );
    warn();

    // Convert to new format
    options.async = !options.sync;
    delete options.sync;
  }

  // Continue with new parameter
  return options.async !== false
    ? loadAsync(path)
    : loadSync(path);
}
```

### Pattern 3: Gradual Deprecation Levels

Different severities for different phases:

```javascript
class DeprecationManager {
  constructor() {
    this.levels = {
      INFO: 1,    // Just informational
      WARN: 2,    // Warning, action recommended
      ERROR: 3    // Error in strict mode
    };
  }

  deprecate(fn, options) {
    const {
      message,
      code,
      level = this.levels.WARN,
      removeIn
    } = options;

    if (level === this.levels.ERROR && process.env.STRICT_DEPRECATION) {
      // Throw in strict mode
      return function(...args) {
        throw new Error(`[${code}] ${message}`);
      };
    }

    if (level === this.levels.INFO) {
      // Just log once, don't use official deprecation
      let logged = false;
      return function(...args) {
        if (!logged) {
          console.info(`ℹ️  [${code}] ${message}`);
          logged = true;
        }
        return fn.apply(this, args);
      };
    }

    // Normal deprecation warning
    return util.deprecate(fn, `[${code}] ${message}`, code);
  }
}
```

### Pattern 4: Tracking Usage

Know which deprecations are actually being used:

```javascript
class DeprecationTracker {
  constructor() {
    this.usage = new Map();
  }

  track(code, message) {
    if (!this.usage.has(code)) {
      this.usage.set(code, {
        code,
        message,
        count: 0,
        firstSeen: new Date(),
        lastSeen: null
      });
    }

    const entry = this.usage.get(code);
    entry.count++;
    entry.lastSeen = new Date();
  }

  getReport() {
    const entries = Array.from(this.usage.values());

    return {
      totalDeprecations: entries.length,
      totalCalls: entries.reduce((sum, e) => sum + e.count, 0),
      mostUsed: entries.sort((a, b) => b.count - a.count)[0],
      entries: entries.map(e => ({
        code: e.code,
        count: e.count,
        daysSinceFirst: Math.floor(
          (Date.now() - e.firstSeen) / (1000 * 60 * 60 * 24)
        )
      }))
    };
  }

  getHighPriority(threshold = 10) {
    return Array.from(this.usage.values())
      .filter(e => e.count >= threshold)
      .sort((a, b) => b.count - a.count);
  }
}

// Usage
const tracker = new DeprecationTracker();

exports.oldAPI = util.deprecate(
  function(data) {
    tracker.track('DEP0001', 'oldAPI is deprecated');
    return processData(data);
  },
  'oldAPI is deprecated',
  'DEP0001'
);

// Later, check which deprecations need attention
console.log(tracker.getReport());
console.log('High priority:', tracker.getHighPriority(50));
```

---

## Part 5: Communication Strategy

### Documentation

#### Changelog Entry

```markdown
## [1.5.0] - 2024-01-15

### Deprecated
- `getUserById(id, callback)` - Use `getUser(id)` with async/await instead.
  Will be removed in v3.0.0. [DEP_API_001]
- `loadConfig({ sync: true })` - Use `loadConfig({ async: false })` instead.
  Will be removed in v2.5.0. [DEP_CONFIG_002]

### Added
- `getUser(id)` - New promise-based user fetching method

### Migration Guide
See [MIGRATION.md](./MIGRATION.md) for detailed migration instructions.
```

#### Migration Guide

```markdown
# Migration Guide: v1.x → v2.x

## Deprecations

### DEP_API_001: getUserById()

**Status:** Deprecated in v1.5.0, will be removed in v3.0.0

**Reason:** Moving to promise-based APIs for better async/await support

**Migration:**

```javascript
// Before (v1.x)
api.getUserById(123, (err, user) => {
  if (err) throw err;
  console.log(user);
});

// After (v2.x+)
try {
  const user = await api.getUser(123);
  console.log(user);
} catch (err) {
  throw err;
}
```

**Timeline:**
- v1.5.0 (Jan 2024): Deprecation warning added
- v2.0.0 (July 2024): Warning remains, feature still works
- v3.0.0 (Jan 2025): Feature removed
```

### In-Code Comments

```javascript
/**
 * Get user by ID
 *
 * @param {number} id - User ID
 * @returns {Promise<User>} User object
 *
 * @example
 * const user = await api.getUser(123);
 */
async getUser(id) {
  return await db.users.findById(id);
}

/**
 * Get user by ID (DEPRECATED)
 *
 * @deprecated Since v1.5.0. Use {@link getUser} instead.
 * Will be removed in v3.0.0.
 *
 * @param {number} id - User ID
 * @param {Function} callback - Callback(err, user)
 *
 * @example
 * // ❌ Old way (deprecated)
 * api.getUserById(123, (err, user) => {});
 *
 * // ✅ New way
 * const user = await api.getUser(123);
 */
getUserById(id, callback) {
  // Implementation...
}
```

---

## Part 6: Best Practices

### ✅ DO

**1. Give Adequate Notice**
```javascript
// At least 6-12 months before removal
// Longer for heavily-used features
```

**2. Provide Working Alternatives**
```javascript
// ✅ Good: Alternative exists and works
exports.newMethod = function() { /* works */ };
exports.oldMethod = util.deprecate(oldImpl, 'Use newMethod');

// ❌ Bad: No alternative provided
exports.oldMethod = util.deprecate(oldImpl, 'This is deprecated');
// But no replacement exists!
```

**3. Show Migration Example**
```javascript
// ✅ Good: Shows before/after
const msg = 'oldMethod(x, y) is deprecated.\n' +
            'Before: oldMethod(1, 2)\n' +
            'After:  newMethod({ x: 1, y: 2 })';

// ❌ Bad: Just says it's deprecated
const msg = 'This method is deprecated';
```

**4. Use Deprecation Codes**
```javascript
// ✅ Good: Unique, searchable code
util.deprecate(fn, 'Deprecated', 'DEP0042');

// ❌ Bad: No code
util.deprecate(fn, 'Deprecated');
```

### ❌ DON'T

**1. Remove Without Warning**
```javascript
// ❌ Very bad
// v1.0: method exists
// v2.0: method gone ← Users' apps break!
```

**2. Deprecate Multiple Versions at Once**
```javascript
// ❌ Bad: Too much change at once
// v2.0: Deprecate methods A, B, C, D, E, F...
// Users overwhelmed with warnings

// ✅ Good: Gradual deprecation
// v1.5: Deprecate A, B
// v1.7: Deprecate C, D
// v1.9: Deprecate E, F
```

**3. Change Deprecation Message**
```javascript
// ❌ Bad: Message changes between versions
// v1.5: "oldMethod is deprecated"
// v1.6: "oldMethod will be removed soon"
// v1.7: "Use newMethod instead of oldMethod"
// Users confused by changing guidance

// ✅ Good: Consistent message
// Always: "oldMethod is deprecated. Use newMethod. Removes in v3.0."
```

---

## Part 7: Real-World Example

```javascript
const util = require('util');

/**
 * Complete deprecation system
 */
class ConfigManager {
  constructor() {
    this.config = { server: { port: 3000 } };

    // Tracking
    this.deprecationTracker = new Map();
  }

  // ===== NEW API (v2.0) =====

  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  set(path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, this.config);
    target[last] = value;
  }

  // ===== OLD API (v1.0) - DEPRECATED =====

  /**
   * Get server port [DEPRECATED]
   * @deprecated Since v2.0.0 - Use get('server.port')
   */
  getServerPort = util.deprecate(
    function() {
      this._trackDeprecation('DEP_CONFIG_001');
      return this.get('server.port');
    }.bind(this),
    '[DEP_CONFIG_001] getServerPort() is deprecated.\n' +
    '\n' +
    'Migration:\n' +
    '  Old: config.getServerPort()\n' +
    '  New: config.get("server.port")\n' +
    '\n' +
    'Removal: v3.0.0 (June 2025)\n' +
    'See: https://docs.example.com/migration#DEP_CONFIG_001',
    'DEP_CONFIG_001'
  );

  /**
   * Update server [DEPRECATED]
   * @deprecated Since v2.0.0 - Use set()
   */
  updateServer = util.deprecate(
    function(port, host) {
      this._trackDeprecation('DEP_CONFIG_002');
      if (port) this.set('server.port', port);
      if (host) this.set('server.host', host);
    }.bind(this),
    '[DEP_CONFIG_002] updateServer(port, host) is deprecated.\n' +
    '\n' +
    'Migration:\n' +
    '  Old: config.updateServer(8080, "localhost")\n' +
    '  New: config.set("server.port", 8080)\n' +
    '       config.set("server.host", "localhost")\n' +
    '\n' +
    'Removal: v3.0.0 (June 2025)',
    'DEP_CONFIG_002'
  );

  // ===== TRACKING =====

  _trackDeprecation(code) {
    if (!this.deprecationTracker.has(code)) {
      this.deprecationTracker.set(code, {
        code,
        count: 0,
        firstCall: new Date()
      });
    }

    const entry = this.deprecationTracker.get(code);
    entry.count++;
    entry.lastCall = new Date();
  }

  getDeprecationReport() {
    return Array.from(this.deprecationTracker.values());
  }
}
```

---

## Summary

### Key Takeaways

1. **Use util.deprecate() with clear messages** - Include what, why, when, and how to migrate

2. **Follow semantic versioning** - Add deprecation in minor, remove in major

3. **Give users time** - At least 6-12 months notice before removal

4. **Track usage** - Know which deprecations need attention

5. **Communicate clearly** - Changelog, migration guides, in-code docs

6. **Provide alternatives** - Never deprecate without offering a replacement

### Deprecation Checklist

- [ ] Add new API that replaces old one
- [ ] Wrap old API with util.deprecate()
- [ ] Create unique deprecation code
- [ ] Write helpful deprecation message
- [ ] Document in changelog
- [ ] Create migration guide with examples
- [ ] Plan removal timeline (6-12 months)
- [ ] Track usage of deprecated API
- [ ] Communicate in release notes
- [ ] Remove in next major version

### Quick Reference

```javascript
// Basic deprecation
const deprecated = util.deprecate(fn, message, code);

// Good message template
const message =
  `[${code}] ${feature} is deprecated.\n` +
  `Reason: ${reason}\n` +
  `Migration: ${before} → ${after}\n` +
  `Removal: ${version}\n` +
  `See: ${url}`;

// Track usage
function trackAndDeprecate(code, fn) {
  tracker.track(code);
  return util.deprecate(fn, message, code);
}
```

---

## Next Steps

- Practice: Complete Exercise 2 to build a deprecation system
- Read: [Advanced Inspection Techniques](./03-advanced-inspection-techniques.md)
- Explore: Check Node.js [deprecation list](https://nodejs.org/api/deprecations.html)

## Further Reading

- [Semantic Versioning](https://semver.org/)
- [How to deprecate npm packages](https://docs.npmjs.com/deprecating-and-undeprecating-packages-or-package-versions)
- [Rust Deprecation RFC](https://rust-lang.github.io/rfcs/1270-deprecation.html) - Excellent deprecation strategy
