# Debugging with debuglog

**Reading Time:** 10 minutes
**Difficulty:** Intermediate
**Prerequisites:** Understanding of environment variables, Node.js debugging basics

## Introduction

Production debugging is tricky. You need detailed logs to troubleshoot issues, but too much logging kills performance. `util.debuglog()` solves this perfectly: it provides zero-overhead debugging that you can enable on demand without code changes.

**Why This Matters:**
- Debug production issues without redeploying
- Zero performance impact when disabled
- Selective debugging by namespace
- Professional debugging strategy
- Required for many Node.js internal modules

## What You'll Learn

- How util.debuglog() works
- Enabling debug output with NODE_DEBUG
- Creating hierarchical debug namespaces
- Performance characteristics
- Production debugging patterns
- Best practices for conditional logging

---

## Part 1: Understanding util.debuglog()

### Basic Usage

```javascript
const util = require('util');

// Create debug logger
const debugLog = util.debuglog('myapp');

// Use like console.log
debugLog('Application started');
debugLog('User logged in: %s', 'alice');
debugLog('Config: %O', { port: 3000 });
```

**By default, nothing is logged!**

To see output, set NODE_DEBUG environment variable:

```bash
NODE_DEBUG=myapp node app.js
```

Output:
```
MYAPP 12345: Application started
MYAPP 12345: User logged in: alice
MYAPP 12345: Config: { port: 3000 }
```

Format: `NAMESPACE PID: message`

### The .enabled Property

Check if logging is enabled before expensive operations:

```javascript
const debugLog = util.debuglog('myapp');

if (debugLog.enabled) {
  // Only run expensive serialization when needed
  const largeData = JSON.stringify(hugeObject);
  debugLog('Data: %s', largeData);
}
```

**Key Point:** This is how you achieve zero overhead!

---

## Part 2: Hierarchical Namespaces

### Using Colons for Hierarchy

Organize debug output with namespaces:

```javascript
const dbDebug = util.debuglog('myapp:database');
const httpDebug = util.debuglog('myapp:http');
const cacheDebug = util.debuglog('myapp:cache');

dbDebug('Query executed');      // myapp:database
httpDebug('Request received');  // myapp:http
cacheDebug('Cache miss');       // myapp:cache
```

### Selective Enabling

| NODE_DEBUG Value | What Gets Logged |
|-----------------|------------------|
| `myapp` | Only exact `myapp` namespace |
| `myapp:*` | All `myapp` namespaces |
| `myapp:database` | Only database logs |
| `myapp:database,myapp:http` | Database and HTTP logs |
| `*` | Everything (all namespaces) |

```bash
# Enable only database logs
NODE_DEBUG=myapp:database node app.js

# Enable database and HTTP logs
NODE_DEBUG=myapp:database,myapp:http node app.js

# Enable all myapp logs
NODE_DEBUG=myapp:* node app.js

# Enable everything
NODE_DEBUG=* node app.js
```

---

## Part 3: Severity Levels with Namespaces

### Creating Level-Based Loggers

```javascript
class Logger {
  constructor(namespace) {
    this.trace = util.debuglog(`${namespace}:trace`);
    this.debug = util.debuglog(`${namespace}:debug`);
    this.info = util.debuglog(`${namespace}:info`);
    this.warn = util.debuglog(`${namespace}:warn`);
    this.error = util.debuglog(`${namespace}:error`);
  }
}

const logger = new Logger('myapp');

// Use different levels
logger.trace('Entering function');
logger.debug('Processing data: %O', data);
logger.info('Operation completed');
logger.warn('Deprecated API used');
logger.error('Operation failed: %s', err.message);
```

Enable specific levels:

```bash
# Only errors
NODE_DEBUG=myapp:error node app.js

# Errors and warnings
NODE_DEBUG=myapp:error,myapp:warn node app.js

# Everything
NODE_DEBUG=myapp:* node app.js
```

---

## Part 4: Performance Optimization

### ✅ Zero-Overhead Pattern

```javascript
const debugLog = util.debuglog('myapp');

// ✅ GOOD: Check .enabled before expensive operations
function processData(data) {
  if (debugLog.enabled) {
    const serialized = JSON.stringify(data); // Only runs if enabled
    debugLog('Processing: %s', serialized);
  }

  // Main logic runs regardless
  return doProcessing(data);
}
```

### ❌ Common Performance Mistakes

```javascript
// ❌ BAD: Expensive operation always runs
function badLogging(data) {
  const serialized = JSON.stringify(data); // ALWAYS runs!
  debugLog('Processing: %s', serialized);
}

// ❌ BAD: Creating debuglog in hot path
function badPattern() {
  for (let i = 0; i < 1000000; i++) {
    const log = util.debuglog('myapp'); // Created million times!
    log('Iteration: %d', i);
  }
}

// ✅ GOOD: Create once, reuse
const debugLog = util.debuglog('myapp');

function goodPattern() {
  for (let i = 0; i < 1000000; i++) {
    debugLog('Iteration: %d', i);
  }
}
```

### Lazy Computation

Use functions for expensive computations:

```javascript
const debugLog = util.debuglog('myapp');

function logExpensive(messageFn) {
  if (!debugLog.enabled) return;

  // Only compute if enabled
  const message = messageFn();
  debugLog(message);
}

// Usage
logExpensive(() => {
  // This only runs if debugging is enabled
  const stats = calculateExpensiveStats();
  return `Stats: ${JSON.stringify(stats)}`;
});
```

---

## Part 5: Production Patterns

### Pattern 1: Subsystem Loggers

```javascript
class ApplicationLogger {
  constructor(appName) {
    this.db = util.debuglog(`${appName}:db`);
    this.http = util.debuglog(`${appName}:http`);
    this.cache = util.debuglog(`${appName}:cache`);
    this.auth = util.debuglog(`${appName}:auth`);
  }
}

const log = new ApplicationLogger('myapp');

// Different subsystems
log.db('Connection established');
log.http('GET /api/users');
log.cache('Cache hit: user:123');
log.auth('User authenticated: alice');
```

Enable specific subsystems:

```bash
# Debug only database issues
NODE_DEBUG=myapp:db node app.js

# Debug HTTP and auth
NODE_DEBUG=myapp:http,myapp:auth node app.js
```

### Pattern 2: Request-Scoped Logging

```javascript
class HTTPServer {
  constructor() {
    this.logger = util.debuglog('myapp:http');
    this.requestCount = 0;
  }

  async handleRequest(req) {
    const requestId = ++this.requestCount;

    // Create request-specific logger
    const reqLogger = util.debuglog(`myapp:http:req${requestId}`);

    reqLogger('Started: %s %s', req.method, req.url);
    reqLogger('Headers: %O', req.headers);

    const response = await processRequest(req);

    reqLogger('Completed: %d', response.status);

    return response;
  }
}

// Enable all requests or specific one
// NODE_DEBUG=myapp:http:*        (all requests)
// NODE_DEBUG=myapp:http:req123   (specific request)
```

### Pattern 3: Timing Operations

```javascript
const debugLog = util.debuglog('myapp');

class Timer {
  constructor(label) {
    this.label = label;
    this.startTime = null;
  }

  start() {
    if (!debugLog.enabled) return;

    this.startTime = Date.now();
    debugLog('[TIMER] %s: started', this.label);
  }

  end() {
    if (!debugLog.enabled || !this.startTime) return;

    const duration = Date.now() - this.startTime;
    debugLog('[TIMER] %s: %dms', this.label, duration);
  }
}

// Usage
async function queryDatabase(sql) {
  const timer = new Timer('database-query');
  timer.start();

  const result = await db.query(sql);

  timer.end();
  return result;
}
```

---

## Part 6: Comparison with Other Approaches

### debuglog vs console.log

| Feature | debuglog | console.log |
|---------|----------|-------------|
| Performance when disabled | Zero overhead | Always runs |
| Selective enabling | ✅ Via NODE_DEBUG | ❌ Need code changes |
| Production safe | ✅ Yes | ❌ Always outputs |
| Format | Standardized | Custom |
| Per-module control | ✅ Yes | ❌ All or nothing |

### debuglog vs Logging Libraries

| Feature | debuglog | winston/pino |
|---------|----------|--------------|
| Setup | Zero config | Requires setup |
| Dependencies | None | External library |
| Performance | Excellent | Good |
| Features | Basic | Rich |
| Use Case | Development | Production |

**When to use debuglog:**
- Development debugging
- Library development
- Performance-critical code
- Zero dependencies required

**When to use logging library:**
- Production logging to files/services
- Need structured logging
- Complex routing/filtering
- Log aggregation

---

## Part 7: Best Practices

### ✅ DO

**1. Create debuglog once, at module level**

```javascript
// ✅ GOOD: Created once
const debugLog = util.debuglog('myapp');

function myFunction() {
  debugLog('Called');
}
```

**2. Use format specifiers**

```javascript
// ✅ GOOD: Efficient formatting
debugLog('User %s logged in at %d', username, Date.now());
debugLog('Config: %O', config);

// ❌ BAD: String concatenation
debugLog('User ' + username + ' logged in at ' + Date.now());
```

**3. Check .enabled before expensive operations**

```javascript
// ✅ GOOD
if (debugLog.enabled) {
  const expensive = computeStats();
  debugLog('Stats: %O', expensive);
}
```

**4. Use hierarchical namespaces**

```javascript
// ✅ GOOD: Organized
util.debuglog('app:db:query');
util.debuglog('app:db:connection');
util.debuglog('app:http:request');
util.debuglog('app:http:response');
```

### ❌ DON'T

**1. Don't use for user-facing logs**

```javascript
// ❌ BAD: Debug logs for user info
debugLog('Server started on port 3000');

// ✅ GOOD: Use console for user info
console.log('Server started on port 3000');
```

**2. Don't log sensitive data without sanitization**

```javascript
// ❌ BAD: Leaking password
debugLog('Login: %O', { username, password });

// ✅ GOOD: Sanitize first
if (debugLog.enabled) {
  debugLog('Login: %O', { username, password: '[REDACTED]' });
}
```

**3. Don't compute data before checking enabled**

```javascript
// ❌ BAD: Always serializes
const data = JSON.stringify(largeObject);
debugLog('Data: %s', data);

// ✅ GOOD: Only serializes if enabled
if (debugLog.enabled) {
  const data = JSON.stringify(largeObject);
  debugLog('Data: %s', data);
}
```

---

## Part 8: Real-World Example

```javascript
const util = require('util');

/**
 * Production database client with debuglog
 */
class DatabaseClient {
  constructor(config) {
    this.config = config;

    // Create loggers for different aspects
    this.connectionLog = util.debuglog('myapp:db:connection');
    this.queryLog = util.debuglog('myapp:db:query');
    this.poolLog = util.debuglog('myapp:db:pool');

    this.queryCount = 0;
  }

  async connect() {
    this.connectionLog('Connecting to %s:%d', this.config.host, this.config.port);

    // Log config only if debugging (expensive serialization)
    if (this.connectionLog.enabled) {
      const safeConfig = { ...this.config };
      safeConfig.password = '[HIDDEN]';
      this.connectionLog('Config: %O', safeConfig);
    }

    await this._establishConnection();

    this.connectionLog('Connected successfully');
  }

  async query(sql, params = []) {
    const queryId = ++this.queryCount;

    this.queryLog('[%d] Executing: %s', queryId, sql);

    // Log params only if debugging
    if (this.queryLog.enabled && params.length > 0) {
      this.queryLog('[%d] Params: %O', queryId, params);
    }

    const startTime = Date.now();
    const result = await this._executeQuery(sql, params);
    const duration = Date.now() - startTime;

    this.queryLog('[%d] Completed in %dms (%d rows)', queryId, duration, result.rowCount);

    // Pool stats if enabled
    if (this.poolLog.enabled) {
      const poolStats = this._getPoolStats();
      this.poolLog('Pool: %d active, %d idle', poolStats.active, poolStats.idle);
    }

    return result;
  }

  async _establishConnection() {
    // Actual connection logic
  }

  async _executeQuery(sql, params) {
    // Actual query logic
    return { rowCount: 0, rows: [] };
  }

  _getPoolStats() {
    return { active: 2, idle: 3 };
  }
}

// Usage
const db = new DatabaseClient({
  host: 'localhost',
  port: 5432,
  password: 'secret'
});

// Run with: NODE_DEBUG=myapp:db:* node app.js
await db.connect();
await db.query('SELECT * FROM users WHERE id = $1', [123]);
```

---

## Summary

### Key Takeaways

1. **util.debuglog() provides zero-overhead debugging** - No performance impact when disabled, selective enabling with NODE_DEBUG

2. **Check .enabled before expensive operations** - Avoid computing data that won't be logged

3. **Use hierarchical namespaces** - Organize logs by subsystem: `app:db:query`, `app:http:request`

4. **Create debuglog once, reuse everywhere** - Don't create in loops or hot paths

5. **Production-safe by default** - Safe to leave debug calls in production code

6. **Environment-based enabling** - Enable debugging without code changes or redeployment

### Quick Reference

```javascript
// Create logger
const debugLog = util.debuglog('namespace');

// Use with format specifiers
debugLog('Message: %s, Number: %d, Object: %O', str, num, obj);

// Check if enabled
if (debugLog.enabled) {
  // Expensive operation
}

// Enable via environment
// NODE_DEBUG=namespace node app.js
// NODE_DEBUG=namespace:* node app.js
// NODE_DEBUG=ns1,ns2 node app.js
```

### Debugging Checklist

- [ ] Create debuglog at module level (not in functions)
- [ ] Use descriptive namespaces (app:subsystem:feature)
- [ ] Check .enabled before expensive operations
- [ ] Use format specifiers (%s, %d, %O)
- [ ] Sanitize sensitive data before logging
- [ ] Document debugging instructions for users
- [ ] Test with NODE_DEBUG enabled
- [ ] Keep debug calls in production code

---

## Next Steps

- Practice: Complete Exercise 4 to build a debug logging system
- Experiment: Add debuglog to your projects
- Read: Node.js [debuglog documentation](https://nodejs.org/api/util.html#util_util_debuglog_section_callback)

## Further Reading

- [NODE_DEBUG environment variable](https://nodejs.org/api/util.html#util_util_debuglog_section_callback)
- [Node.js debugging guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Debug module](https://www.npmjs.com/package/debug) - Similar concept for libraries
