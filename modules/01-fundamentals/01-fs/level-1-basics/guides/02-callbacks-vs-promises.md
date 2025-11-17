# Guide: Callbacks vs Promises vs Async/Await

**Reading Time**: 20 minutes
**Difficulty**: Beginner to Intermediate
**Prerequisites**: Understanding of [sync vs async](01-sync-vs-async.md)

---

## Introduction

Node.js has evolved through three generations of handling asynchronous operations:
1. **Callbacks** (2009-2015) - The original Node.js pattern
2. **Promises** (2015-2017) - ES6 introduced promises
3. **Async/Await** (2017-present) - Modern, clean syntax

All three still work, but **async/await is the recommended approach** for new code.

---

## Table of Contents

1. [Callbacks (The Original Way)](#callbacks-the-original-way)
2. [Promises (The Better Way)](#promises-the-better-way)
3. [Async/Await (The Best Way)](#asyncawait-the-best-way)
4. [Comparison](#comparison-table)
5. [Converting Between Them](#converting-between-them)
6. [Common Patterns](#common-patterns)
7. [Which Should I Use?](#which-should-i-use)

---

## Callbacks (The Original Way)

### What Are Callbacks?

A **callback** is a function passed as an argument to another function, to be executed when an async operation completes.

### Basic Example

```javascript
const fs = require('fs');

// The callback is the third argument
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Data:', data);
});
```

### The Error-First Pattern

Node.js callbacks follow the **error-first** pattern:

```javascript
function callback(err, result) {
  // First parameter is ALWAYS error (or null)
  // Second parameter is the result
}
```

**Why?** Forces you to handle errors.

### Callback Hell Problem

When you need to do multiple async operations in sequence:

```javascript
// ❌ THE PYRAMID OF DOOM
fs.readFile('file1.txt', 'utf8', (err1, data1) => {
  if (err1) {
    console.error(err1);
    return;
  }

  fs.readFile('file2.txt', 'utf8', (err2, data2) => {
    if (err2) {
      console.error(err2);
      return;
    }

    fs.readFile('file3.txt', 'utf8', (err3, data3) => {
      if (err3) {
        console.error(err3);
        return;
      }

      // Finally use all the data
      console.log(data1, data2, data3);
    });
  });
});
```

**Problems**:
- Hard to read (indentation grows)
- Error handling repeated
- Difficult to debug
- Hard to modify

### Pros and Cons

✅ **Pros**:
- Simple concept
- Works everywhere
- No new syntax to learn
- Good for single operations

❌ **Cons**:
- Callback hell (deep nesting)
- Error handling is tedious
- Hard to compose
- Can't use with async/await

---

## Promises (The Better Way)

### What Are Promises?

A **Promise** represents a value that will be available in the future.

### States of a Promise

```
Pending → Either → Fulfilled (resolved) ✅
                 ↓
                 → Rejected (error) ❌
```

### Basic Example

```javascript
const fs = require('fs').promises;

// Returns a Promise
const promise = fs.readFile('file.txt', 'utf8');

promise
  .then(data => {
    console.log('Data:', data);
  })
  .catch(err => {
    console.error('Error:', err);
  });
```

### Chaining Promises

Promises solve callback hell through **chaining**:

```javascript
fs.readFile('file1.txt', 'utf8')
  .then(data1 => {
    console.log('File 1:', data1);
    return fs.readFile('file2.txt', 'utf8');
  })
  .then(data2 => {
    console.log('File 2:', data2);
    return fs.readFile('file3.txt', 'utf8');
  })
  .then(data3 => {
    console.log('File 3:', data3);
  })
  .catch(err => {
    // One catch handles all errors!
    console.error('Error:', err);
  });
```

**Much better!** No pyramid, one error handler.

### Parallel Operations with Promise.all()

```javascript
// Execute multiple operations concurrently
Promise.all([
  fs.readFile('file1.txt', 'utf8'),
  fs.readFile('file2.txt', 'utf8'),
  fs.readFile('file3.txt', 'utf8')
])
.then(([data1, data2, data3]) => {
  console.log('All files read:', data1, data2, data3);
})
.catch(err => {
  console.error('At least one failed:', err);
});
```

### Creating Your Own Promises

```javascript
function delay(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('Done!');
    }, ms);
  });
}

delay(1000)
  .then(result => console.log(result)); // After 1 second: "Done!"
```

### Pros and Cons

✅ **Pros**:
- Chainable (no callback hell)
- One error handler for chain
- Composable (Promise.all, Promise.race)
- Better than callbacks

❌ **Cons**:
- Still somewhat verbose
- Can still create `.then()` chains
- Not as readable as sync code
- Need to return promises in chains

---

## Async/Await (The Best Way)

### What Is Async/Await?

**Async/await** is syntactic sugar over promises that makes async code look like sync code.

### Basic Example

```javascript
const fs = require('fs').promises;

async function readMyFile() {
  try {
    const data = await fs.readFile('file.txt', 'utf8');
    console.log('Data:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

readMyFile();
```

**Looks just like synchronous code!** But it's non-blocking.

### The `async` Keyword

```javascript
async function myFunction() {
  // Can use 'await' inside
}

// Also works with arrow functions
const myFunction = async () => {
  // Can use 'await' inside
};
```

**Rules**:
- Add `async` before function definition
- Function automatically returns a Promise
- Can use `await` inside

### The `await` Keyword

```javascript
// Without await (returns Promise)
const promise = fs.readFile('file.txt');
console.log(promise); // Promise { <pending> }

// With await (waits for result)
const data = await fs.readFile('file.txt');
console.log(data); // File contents
```

**Rules**:
- Can only use `await` inside `async` functions
- Pauses function execution until Promise resolves
- Returns the resolved value (or throws error)

### Sequential Operations

```javascript
async function readMultipleFiles() {
  try {
    // Read files one at a time
    const data1 = await fs.readFile('file1.txt', 'utf8');
    console.log('File 1:', data1);

    const data2 = await fs.readFile('file2.txt', 'utf8');
    console.log('File 2:', data2);

    const data3 = await fs.readFile('file3.txt', 'utf8');
    console.log('File 3:', data3);

  } catch (err) {
    console.error('Error:', err);
  }
}
```

**Clean and readable!** No nesting, no `.then()` chains.

### Parallel Operations

```javascript
async function readMultipleFilesParallel() {
  try {
    // Start all reads at once (don't await yet)
    const promise1 = fs.readFile('file1.txt', 'utf8');
    const promise2 = fs.readFile('file2.txt', 'utf8');
    const promise3 = fs.readFile('file3.txt', 'utf8');

    // Now wait for all to finish
    const [data1, data2, data3] = await Promise.all([
      promise1,
      promise2,
      promise3
    ]);

    console.log('All files:', data1, data2, data3);

  } catch (err) {
    console.error('Error:', err);
  }
}
```

**Fast and clean!**

### Error Handling with Try/Catch

```javascript
async function safeFileRead() {
  try {
    const data = await fs.readFile('file.txt', 'utf8');
    return data;
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('File not found, using default');
      return 'default content';
    }
    throw err; // Re-throw other errors
  }
}
```

### Pros and Cons

✅ **Pros**:
- **Most readable** - looks like sync code
- Familiar error handling (try/catch)
- Easy to debug
- Works with all Promise-based APIs
- Industry standard (all modern code uses this)

❌ **Cons**:
- Requires async function context
- Can't use at top level (in CommonJS)*
- Need to understand Promises underneath

*Top-level await is available in ES modules.

---

## Comparison Table

| Feature | Callbacks | Promises | Async/Await |
|---------|-----------|----------|-------------|
| **Readability** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Error Handling** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Nesting** | ❌ Callback hell | ✅ Flat chains | ✅ Completely flat |
| **Debugging** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Composition** | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Browser Support** | ✅ All | ✅ Modern | ✅ Modern |
| **Node.js Support** | ✅ All | ✅ 4.0+ | ✅ 7.6+ |
| **Learning Curve** | Easy | Medium | Easy |
| **When to Use** | Legacy code | Good middle ground | **New code** |

---

## Converting Between Them

### Callback → Promise

Use `util.promisify`:

```javascript
const fs = require('fs');
const { promisify } = require('util');

// Callback version
fs.readFile('file.txt', 'utf8', (err, data) => {
  console.log(data);
});

// Convert to Promise
const readFilePromise = promisify(fs.readFile);
readFilePromise('file.txt', 'utf8')
  .then(data => console.log(data));
```

Or use `fs.promises`:

```javascript
const fs = require('fs').promises;

fs.readFile('file.txt', 'utf8')
  .then(data => console.log(data));
```

### Promise → Async/Await

Just add `async` and `await`:

```javascript
// Promise version
fs.readFile('file.txt', 'utf8')
  .then(data => console.log(data))
  .catch(err => console.error(err));

// Async/Await version
async function readFile() {
  try {
    const data = await fs.readFile('file.txt', 'utf8');
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
```

### Async/Await → Promise

Remove `async/await`, add `.then()`:

```javascript
// Async/Await version
async function getData() {
  const data = await fs.readFile('file.txt', 'utf8');
  return data.toUpperCase();
}

// Promise version
function getData() {
  return fs.readFile('file.txt', 'utf8')
    .then(data => data.toUpperCase());
}
```

---

## Common Patterns

### Pattern 1: Sequential Operations

```javascript
// ❌ Callbacks - Nested
fs.readFile('user.json', (err, userData) => {
  if (err) return console.error(err);

  const userId = JSON.parse(userData).id;

  fs.readFile(`profile-${userId}.json`, (err, profileData) => {
    if (err) return console.error(err);

    console.log(profileData);
  });
});

// ✅ Async/Await - Clean
async function getProfile() {
  const userData = await fs.readFile('user.json', 'utf8');
  const userId = JSON.parse(userData).id;

  const profileData = await fs.readFile(`profile-${userId}.json`, 'utf8');
  console.log(profileData);
}
```

### Pattern 2: Parallel Operations

```javascript
// ❌ Callbacks - Complex coordination
let results = [];
let completed = 0;

files.forEach((file, index) => {
  fs.readFile(file, (err, data) => {
    results[index] = data;
    completed++;

    if (completed === files.length) {
      console.log('All done:', results);
    }
  });
});

// ✅ Async/Await - Simple
const results = await Promise.all(
  files.map(file => fs.readFile(file, 'utf8'))
);
console.log('All done:', results);
```

### Pattern 3: Error Handling

```javascript
// ❌ Callbacks - Repeated checks
fs.readFile('file1.txt', (err1, data1) => {
  if (err1) return handleError(err1);

  fs.readFile('file2.txt', (err2, data2) => {
    if (err2) return handleError(err2);

    console.log(data1, data2);
  });
});

// ✅ Async/Await - One try/catch
try {
  const data1 = await fs.readFile('file1.txt', 'utf8');
  const data2 = await fs.readFile('file2.txt', 'utf8');
  console.log(data1, data2);
} catch (err) {
  handleError(err);
}
```

---

## Which Should I Use?

### Decision Tree

```
Are you writing NEW code?
├─ YES → Use Async/Await ✅
└─ NO  → Is it existing callback code?
         ├─ YES → Keep callbacks or refactor to async/await
         └─ NO  → Is it Promise code?
                  └─ YES → Convert to async/await or keep promises
```

### Recommendations

| Scenario | Use |
|----------|-----|
| **New code** | Async/Await |
| **Working with Promise APIs** | Async/Await |
| **Simple operations** | Async/Await |
| **Complex async flows** | Async/Await |
| **Legacy code maintenance** | Keep existing pattern |
| **Library that only provides callbacks** | Convert with `util.promisify` |

### The Modern Stack

```javascript
// This is the current best practice (2024)
const fs = require('fs').promises;  // Use promises version

async function myFunction() {
  try {
    const data = await fs.readFile('file.txt', 'utf8');
    // Do something with data
    return data;
  } catch (err) {
    console.error('Error:', err);
    throw err;
  }
}
```

---

## Real-World Example

Let's see all three approaches for a real scenario: **Reading a config file, fetching user data, and saving a report**.

### With Callbacks

```javascript
fs.readFile('config.json', 'utf8', (err, configData) => {
  if (err) return console.error('Config error:', err);

  const config = JSON.parse(configData);

  fs.readFile(`users/${config.userId}.json`, 'utf8', (err, userData) => {
    if (err) return console.error('User error:', err);

    const user = JSON.parse(userData);
    const report = generateReport(user);

    fs.writeFile('report.txt', report, (err) => {
      if (err) return console.error('Write error:', err);

      console.log('Report saved!');
    });
  });
});
```

### With Promises

```javascript
fs.readFile('config.json', 'utf8')
  .then(configData => {
    const config = JSON.parse(configData);
    return fs.readFile(`users/${config.userId}.json`, 'utf8');
  })
  .then(userData => {
    const user = JSON.parse(userData);
    const report = generateReport(user);
    return fs.writeFile('report.txt', report);
  })
  .then(() => {
    console.log('Report saved!');
  })
  .catch(err => {
    console.error('Error:', err);
  });
```

### With Async/Await

```javascript
async function createReport() {
  try {
    const configData = await fs.readFile('config.json', 'utf8');
    const config = JSON.parse(configData);

    const userData = await fs.readFile(`users/${config.userId}.json`, 'utf8');
    const user = JSON.parse(userData);

    const report = generateReport(user);
    await fs.writeFile('report.txt', report);

    console.log('Report saved!');
  } catch (err) {
    console.error('Error:', err);
  }
}

createReport();
```

**Winner**: Async/Await - cleanest, most readable, easiest to maintain!

---

## Common Mistakes

### Mistake 1: Forgetting `async` Keyword

```javascript
// ❌ ERROR
function readFile() {
  const data = await fs.readFile('file.txt'); // SyntaxError!
}

// ✅ FIX
async function readFile() {
  const data = await fs.readFile('file.txt');
}
```

### Mistake 2: Not Awaiting Promises

```javascript
// ❌ WRONG
async function readFile() {
  const data = fs.readFile('file.txt'); // Forgot await!
  console.log(data); // Prints Promise { <pending> }
}

// ✅ CORRECT
async function readFile() {
  const data = await fs.readFile('file.txt');
  console.log(data); // Prints file contents
}
```

### Mistake 3: Sequential When You Want Parallel

```javascript
// ❌ SLOW (sequential - 300ms total)
const data1 = await fs.readFile('file1.txt'); // 100ms
const data2 = await fs.readFile('file2.txt'); // 100ms
const data3 = await fs.readFile('file3.txt'); // 100ms

// ✅ FAST (parallel - 100ms total)
const [data1, data2, data3] = await Promise.all([
  fs.readFile('file1.txt'),
  fs.readFile('file2.txt'),
  fs.readFile('file3.txt')
]);
```

---

## Summary

### Evolution of Async in Node.js

```
2009: Callbacks → Hard to maintain
2015: Promises  → Better, chainable
2017: Async/Await → Best, looks like sync code
```

### Key Takeaways

1. **Callbacks**: Legacy, callback hell, error-first pattern
2. **Promises**: Chainable, composable, better error handling
3. **Async/Await**: Modern, readable, best practice
4. **Use async/await** for all new code
5. **Convert callbacks** to promises with `util.promisify`
6. **Parallel operations**: Use `Promise.all()` with await

### What to Use (2024)

```javascript
const fs = require('fs').promises; // ← This

async function myCode() {          // ← And this
  const data = await fs.readFile('file.txt'); // ← And this
}
```

---

## Next Steps

- **Practice**: Convert callback examples to async/await
- **Read**: [Error Handling Guide](03-error-handling.md)
- **Try**: Complete exercises using async/await
- **Build**: A small project using only async/await

---

**Remember**: All three approaches work, but async/await is the future. Learn it well!
