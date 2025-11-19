# util.promisify() Basics

**Reading Time:** 20 minutes
**Difficulty:** Beginner
**Prerequisites:** Understanding of callbacks and Promises

---

## Introduction

One of Node.js's greatest challenges is the transition from callback-based APIs to Promise-based ones. The `util.promisify()` utility is Node.js's official solution for converting callback-style functions into Promise-returning functions, enabling you to use modern async/await syntax with legacy code.

### Why This Matters

Node.js was built on callbacks, but modern JavaScript prefers Promises and async/await. Instead of rewriting every callback function or using third-party libraries, `util.promisify()` provides a standard, reliable way to bridge these two paradigms.

> **Key Insight:** `util.promisify()` is your bridge from callback hell to Promise paradise. It's the official Node.js way to modernize legacy code without breaking changes.

---

## Table of Contents

- [What You'll Learn](#what-youll-learn)
- [Understanding util.promisify()](#understanding-utilpromisify)
- [The Node.js Callback Convention](#the-nodejs-callback-convention)
- [Basic Usage](#basic-usage)
- [When Promisify Works](#when-promisify-works)
- [When Promisify Doesn't Work](#when-promisify-doesnt-work)
- [Custom Promisify Implementations](#custom-promisify-implementations)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)
- [Summary](#summary)

---

## What You'll Learn

By the end of this guide, you'll understand:

1. How `util.promisify()` converts callbacks to Promises
2. The Node.js callback convention and why it matters
3. When `promisify()` works automatically and when it doesn't
4. How to create custom promisified versions
5. Real-world patterns for using promisify effectively
6. Common pitfalls and how to avoid them

---

## Understanding util.promisify()

### What It Does

`util.promisify()` takes a function that follows the Node.js callback convention and returns a new function that returns a Promise.

```javascript
const util = require('util');
const fs = require('fs');

// Old callback style
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Data:', data);
});

// Convert to Promise style
const readFilePromise = util.promisify(fs.readFile);

// Now use with Promises
readFilePromise('file.txt', 'utf8')
  .then(data => console.log('Data:', data))
  .catch(err => console.error('Error:', err));

// Or use with async/await
async function readFile() {
  try {
    const data = await readFilePromise('file.txt', 'utf8');
    console.log('Data:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}
```

### The Transformation

Here's what `promisify()` does internally (simplified):

```javascript
// Before promisify
function oldStyleFunction(arg1, arg2, callback) {
  // Do work...
  if (error) {
    callback(error);
  } else {
    callback(null, result);
  }
}

// After promisify
function newStyleFunction(arg1, arg2) {
  return new Promise((resolve, reject) => {
    oldStyleFunction(arg1, arg2, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}
```

---

## The Node.js Callback Convention

### The Error-First Pattern

For `promisify()` to work, the function MUST follow the Node.js callback convention:

**Rules:**
1. **Last parameter** must be a callback function
2. **First callback argument** must be an error (or null if no error)
3. **Subsequent arguments** are results (if operation succeeds)

```javascript
// ✅ CORRECT - Follows convention
function readData(filename, callback) {
  // ...
  callback(null, data);        // Success: error is null
  // or
  callback(new Error('Failed')); // Failure: error is first
}

// ❌ WRONG - Doesn't follow convention
function readData(filename, callback) {
  callback(data);              // No error parameter
}

function readData(callback, filename) {
  callback(null, data);        // Callback not last parameter
}

function readData(filename, callback) {
  callback(data, error);       // Error not first parameter
}
```

### Why This Convention Exists

**Historical Context:**
- Node.js predates Promises in JavaScript
- Need a consistent way to handle async operations
- Error-first callbacks became the standard

**Benefits:**
- Consistent error handling across all APIs
- Clear distinction between success and failure
- Enables tools like `promisify()` to work automatically

### Visual Comparison

```javascript
// Callback Convention Pattern
┌─────────────────────────────────────┐
│  function(args..., callback)        │
│                     └─────┬─────────┘
│                           │
│              callback(err, result)
│                        │      │
│                        │      └─── Success values
│                        └────────── Error (null if success)
└─────────────────────────────────────┘
```

---

## Basic Usage

### Example 1: Simple File Operations

```javascript
const util = require('util');
const fs = require('fs');

// Promisify common fs functions
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

// Use with async/await
async function processFile() {
  try {
    // Read file
    const data = await readFile('input.txt', 'utf8');

    // Transform data
    const transformed = data.toUpperCase();

    // Write result
    await writeFile('output.txt', transformed);

    // Clean up
    await unlink('temp.txt');

    console.log('Success!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}
```

### Example 2: Crypto Operations

```javascript
const util = require('util');
const crypto = require('crypto');

// Promisify crypto functions
const randomBytes = util.promisify(crypto.randomBytes);
const pbkdf2 = util.promisify(crypto.pbkdf2);

async function generateSecureToken() {
  // Generate random bytes
  const buffer = await randomBytes(32);
  const token = buffer.toString('hex');

  console.log('Token:', token);
  return token;
}

async function hashPassword(password, salt) {
  // Hash password with PBKDF2
  const hash = await pbkdf2(password, salt, 100000, 64, 'sha512');
  return hash.toString('hex');
}
```

### Example 3: DNS Lookups

```javascript
const util = require('util');
const dns = require('dns');

// Promisify DNS functions
const lookup = util.promisify(dns.lookup);
const resolve4 = util.promisify(dns.resolve4);

async function checkDomain(hostname) {
  try {
    // Lookup IP address
    const { address, family } = await lookup(hostname);
    console.log(`${hostname} -> ${address} (IPv${family})`);

    // Resolve all A records
    const addresses = await resolve4(hostname);
    console.log('All A records:', addresses);

  } catch (err) {
    console.error(`DNS lookup failed: ${err.message}`);
  }
}

checkDomain('google.com');
```

---

## When Promisify Works

### ✅ Standard Node.js Core APIs

Most Node.js core modules follow the callback convention:

```javascript
const util = require('util');
const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');
const dns = require('dns');

// All of these work perfectly
const readFile = util.promisify(fs.readFile);
const randomBytes = util.promisify(crypto.randomBytes);
const gzip = util.promisify(zlib.gzip);
const lookup = util.promisify(dns.lookup);
```

### ✅ Custom Functions Following Convention

```javascript
// Your own callback-style function
function fetchUser(userId, callback) {
  database.query('SELECT * FROM users WHERE id = ?', [userId], (err, rows) => {
    if (err) return callback(err);
    if (rows.length === 0) return callback(new Error('User not found'));
    callback(null, rows[0]);
  });
}

// Promisify works perfectly
const fetchUserPromise = util.promisify(fetchUser);

// Use it
const user = await fetchUserPromise(123);
```

### ✅ Third-Party Libraries (Sometimes)

```javascript
// If library follows Node convention
const request = require('request'); // Old library
const requestPromise = util.promisify(request);

// Works if request uses (err, response, body) pattern
const response = await requestPromise('http://example.com');
```

---

## When Promisify Doesn't Work

### ❌ Multiple Callback Invocations

Functions that call the callback multiple times:

```javascript
// ❌ WON'T WORK - Multiple callbacks
function watchFile(filename, callback) {
  fs.watch(filename, (event) => {
    callback(null, event); // Called on every change!
  });
}

// Promisify doesn't work here because:
// - Promise can only resolve once
// - This needs to emit multiple events
```

**Solution:** Use EventEmitter or keep callback style

```javascript
// Better approach for multiple events
const EventEmitter = require('events');

class FileWatcher extends EventEmitter {
  watch(filename) {
    fs.watch(filename, (event) => {
      this.emit('change', event);
    });
  }
}
```

### ❌ Non-Standard Callback Signatures

Functions that don't follow error-first convention:

```javascript
// ❌ WON'T WORK - Success-first callback
function oldLibrary(arg, callback) {
  callback(result, error); // Wrong order!
}

// ❌ WON'T WORK - No error parameter
function simpleCallback(arg, callback) {
  callback(result); // Missing error param
}

// ❌ WON'T WORK - Callback not last parameter
function weirdOrder(callback, arg) {
  callback(null, result);
}
```

### ❌ Callback with Multiple Results

Functions returning multiple success values:

```javascript
// ❌ PARTIAL WORK - Multiple results
function getStats(callback) {
  callback(null, count, average, max);
  //               ^      ^        ^
  //               Only first result is used!
}

const getStatsPromise = util.promisify(getStats);
const result = await getStatsPromise();
// result = count (only first value!)
// average and max are lost!
```

**Solution:** Return an object or use custom promisify

```javascript
// Better: Return object
function getStats(callback) {
  callback(null, { count, average, max });
}

// Or use custom promisify (see next section)
```

### ❌ Functions with Optional Callbacks

Functions where callback is optional:

```javascript
// ❌ PROBLEMATIC - Optional callback
function operation(arg, callback) {
  const result = doWork(arg);

  if (callback) {
    callback(null, result);
  }
  return result; // Also returns synchronously!
}
```

---

## Custom Promisify Implementations

### Using util.promisify.custom

When a function doesn't follow conventions, you can provide a custom promisified version:

```javascript
const util = require('util');

// Function with non-standard signature
function getMultipleValues(callback) {
  // Returns multiple values
  callback(null, 'value1', 'value2', 'value3');
}

// Define custom promisify implementation
getMultipleValues[util.promisify.custom] = function() {
  return new Promise((resolve, reject) => {
    getMultipleValues((err, val1, val2, val3) => {
      if (err) return reject(err);
      // Return object with all values
      resolve({ val1, val2, val3 });
    });
  });
};

// Now promisify works with all values
const getValues = util.promisify(getMultipleValues);
const { val1, val2, val3 } = await getValues();
```

### Real Example: Child Process Exec

```javascript
const util = require('util');
const { exec } = require('child_process');

// exec returns (error, stdout, stderr)
// Default promisify only captures stdout!

// Custom implementation to capture both
exec[util.promisify.custom] = function(command, options) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        return reject(error);
      }
      // Return both stdout and stderr
      resolve({ stdout, stderr });
    });
  });
};

const execPromise = util.promisify(exec);

// Now we can access both
const { stdout, stderr } = await execPromise('ls -la');
console.log('Output:', stdout);
console.log('Errors:', stderr);
```

### Custom Promisify for Libraries

```javascript
// Legacy library with success-first callbacks
function oldLibraryMethod(arg, callback) {
  // callback(result, error) - wrong order!
}

// Create custom promisified wrapper
function promisifyOldLibrary(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (result, error) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  };
}

const modernMethod = promisifyOldLibrary(oldLibraryMethod);
const result = await modernMethod('arg');
```

---

## Real-World Examples

### Example 1: Database Operations

```javascript
const util = require('util');
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'mydb'
});

// Promisify database methods
const query = util.promisify(connection.query).bind(connection);
const connect = util.promisify(connection.connect).bind(connection);
const end = util.promisify(connection.end).bind(connection);

async function getUserOrders(userId) {
  try {
    await connect();

    // Query with promisified method
    const users = await query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    const orders = await query(
      'SELECT * FROM orders WHERE user_id = ?',
      [userId]
    );

    await end();

    return {
      user: users[0],
      orders: orders
    };

  } catch (err) {
    console.error('Database error:', err);
    throw err;
  }
}
```

> **Important:** Notice the `.bind(connection)` - this preserves the correct `this` context for the database methods!

### Example 2: File Processing Pipeline

```javascript
const util = require('util');
const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');

// Promisify all needed functions
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const gzip = util.promisify(zlib.gzip);
const gunzip = util.promisify(zlib.gunzip);

async function compressAndEncrypt(inputFile, outputFile, password) {
  try {
    // Read original file
    console.log('Reading file...');
    const data = await readFile(inputFile);

    // Compress
    console.log('Compressing...');
    const compressed = await gzip(data);

    // Encrypt
    console.log('Encrypting...');
    const cipher = crypto.createCipher('aes-256-cbc', password);
    const encrypted = Buffer.concat([
      cipher.update(compressed),
      cipher.final()
    ]);

    // Write result
    console.log('Writing...');
    await writeFile(outputFile, encrypted);

    console.log('Done!');

  } catch (err) {
    console.error('Processing failed:', err.message);
    throw err;
  }
}

async function decryptAndDecompress(inputFile, outputFile, password) {
  try {
    // Read encrypted file
    const encrypted = await readFile(inputFile);

    // Decrypt
    const decipher = crypto.createDecipher('aes-256-cbc', password);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    // Decompress
    const decompressed = await gunzip(decrypted);

    // Write original data
    await writeFile(outputFile, decompressed);

    console.log('Decrypted and decompressed!');

  } catch (err) {
    console.error('Decryption failed:', err.message);
    throw err;
  }
}
```

### Example 3: Batch Operations

```javascript
const util = require('util');
const fs = require('fs');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

async function processAllFiles(directory, transform) {
  try {
    // Read directory
    const files = await readdir(directory);

    // Process files in parallel
    await Promise.all(
      files.map(async (file) => {
        const filepath = `${directory}/${file}`;

        // Check if it's a file
        const stats = await stat(filepath);
        if (!stats.isFile()) return;

        // Read, transform, write
        const content = await readFile(filepath, 'utf8');
        const transformed = transform(content);
        await writeFile(filepath, transformed);

        console.log(`Processed: ${file}`);
      })
    );

    console.log('All files processed!');

  } catch (err) {
    console.error('Batch processing failed:', err);
    throw err;
  }
}

// Use it
processAllFiles('./docs', (content) => {
  return content.replace(/TODO/g, 'DONE');
});
```

---

## Best Practices

### ✅ DO: Promisify Once, Reuse Everywhere

```javascript
// ✅ Good - Promisify once at module level
const util = require('util');
const fs = require('fs');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Reuse in multiple functions
async function readConfig() {
  return await readFile('config.json', 'utf8');
}

async function saveConfig(data) {
  await writeFile('config.json', data);
}
```

```javascript
// ❌ Bad - Promisifying repeatedly
async function readConfig() {
  return await util.promisify(fs.readFile)('config.json', 'utf8');
}

async function saveConfig(data) {
  await util.promisify(fs.writeFile)('config.json', data);
}
```

### ✅ DO: Use fs.promises for File System Operations

```javascript
// ✅ Better - Use built-in promise API (Node.js 10+)
const fs = require('fs').promises;

async function readConfig() {
  return await fs.readFile('config.json', 'utf8');
}

// No need to promisify!
```

### ✅ DO: Preserve Context with .bind()

```javascript
// ✅ Good - Preserve this context
const query = util.promisify(connection.query).bind(connection);

// ❌ Bad - Loses this context
const query = util.promisify(connection.query);
// Will fail with: "Cannot read property 'query' of undefined"
```

### ✅ DO: Handle Errors Properly

```javascript
// ✅ Good - Proper error handling
async function safeRead(filename) {
  try {
    return await readFile(filename, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    throw err; // Re-throw other errors
  }
}
```

### ❌ DON'T: Promisify Event Emitters

```javascript
// ❌ Bad - Event emitters need multiple callbacks
const promisifiedWatch = util.promisify(fs.watch);
// Won't work as expected!

// ✅ Good - Use events properly
const watcher = fs.watch('file.txt');
watcher.on('change', (event) => {
  console.log('File changed:', event);
});
```

### ❌ DON'T: Mix Callbacks and Promises

```javascript
// ❌ Bad - Inconsistent API
function inconsistent(filename, callback) {
  if (callback) {
    fs.readFile(filename, callback);
  } else {
    return util.promisify(fs.readFile)(filename);
  }
}

// ✅ Good - Choose one style
async function consistent(filename) {
  return await readFile(filename);
}
```

---

## Common Patterns

### Pattern 1: Promisify Entire Module

```javascript
// Create promisified version of entire module
const fs = require('fs');
const util = require('util');

const fsPromises = {
  readFile: util.promisify(fs.readFile),
  writeFile: util.promisify(fs.writeFile),
  unlink: util.promisify(fs.unlink),
  readdir: util.promisify(fs.readdir),
  stat: util.promisify(fs.stat),
  mkdir: util.promisify(fs.mkdir),
  rmdir: util.promisify(fs.rmdir)
};

module.exports = fsPromises;
```

### Pattern 2: Conditional Promisify

```javascript
// Use native promises if available, otherwise promisify
const fs = require('fs');
const util = require('util');

const readFile = fs.promises
  ? fs.promises.readFile
  : util.promisify(fs.readFile);
```

### Pattern 3: Promisify with Timeout

```javascript
function promisifyWithTimeout(fn, timeout = 5000) {
  const promisified = util.promisify(fn);

  return async function(...args) {
    return Promise.race([
      promisified(...args),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  };
}

const readFileWithTimeout = promisifyWithTimeout(fs.readFile, 3000);
```

---

## Summary

### Key Takeaways

1. **`util.promisify()` converts callback functions to Promise-returning functions**
   - Enables async/await with legacy APIs
   - Official Node.js solution for callback-to-Promise conversion

2. **Only works with error-first callbacks**
   - First param: error (null if success)
   - Following params: results
   - Callback must be last parameter

3. **Doesn't work for:**
   - Event emitters (multiple callbacks)
   - Non-standard callback signatures
   - Functions with optional callbacks

4. **Use `util.promisify.custom` for special cases**
   - Handle multiple return values
   - Work with non-standard signatures
   - Add custom behavior

5. **Best practices:**
   - Promisify once, reuse everywhere
   - Use built-in promise APIs when available (fs.promises)
   - Preserve context with `.bind()` when needed
   - Handle errors appropriately

### When to Use util.promisify()

| Use When | Don't Use When |
|----------|----------------|
| Converting Node.js core APIs | Working with event emitters |
| Modernizing callback-based code | Functions already return Promises |
| Need async/await syntax | Non-standard callback signatures |
| Building on legacy libraries | Simple synchronous operations |

### Quick Reference

```javascript
// Basic usage
const util = require('util');
const promisified = util.promisify(callbackFunction);

// With binding
const method = util.promisify(obj.method).bind(obj);

// Custom promisify
fn[util.promisify.custom] = () => {
  return new Promise((resolve, reject) => {
    // Custom implementation
  });
};

// Use promisified function
const result = await promisified(arg1, arg2);
```

---

## Next Steps

- **Practice:** Convert callback-based code to use async/await
- **Explore:** [util.inspect() Basics](./02-inspect-basics.md) - Learn about object inspection
- **Deepen:** Try promisifying functions in your own projects
- **Advanced:** Study the [util.promisify() source code](https://github.com/nodejs/node/blob/master/lib/internal/util.js) to understand implementation details

---

## Related Guides

- [async/await Patterns](../../common/async-patterns.md)
- [Error Handling in Async Code](../../common/error-handling.md)
- [Node.js Core Modules Overview](../../common/core-modules.md)
