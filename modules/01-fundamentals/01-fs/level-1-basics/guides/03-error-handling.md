# Guide: Error Handling in File Operations

**Reading Time**: 15 minutes
**Difficulty**: Beginner to Intermediate
**Prerequisites**: Understanding of [async/await](02-callbacks-vs-promises.md)

---

## Introduction

Errors in file operations are **inevitable**:
- Files might not exist
- Permissions might be denied
- Disk might be full
- Paths might be invalid

**Good developers** anticipate and handle these errors gracefully.

---

## Table of Contents

1. [Why Error Handling Matters](#why-error-handling-matters)
2. [Common File System Errors](#common-file-system-errors)
3. [Error Handling with Async/Await](#error-handling-with-asyncawait)
4. [Error Handling with Promises](#error-handling-with-promises)
5. [Error Handling with Callbacks](#error-handling-with-callbacks)
6. [Best Practices](#best-practices)
7. [Production Patterns](#production-patterns)

---

## Why Error Handling Matters

### The Problem

```javascript
// ❌ NO ERROR HANDLING
async function readUserData(userId) {
  const data = await fs.readFile(`users/${userId}.json`, 'utf8');
  return JSON.parse(data);
}

// What happens if:
// - File doesn't exist? → CRASH 💥
// - Permission denied? → CRASH 💥
// - Invalid JSON? → CRASH 💥
```

### The Solution

```javascript
// ✅ WITH ERROR HANDLING
async function readUserData(userId) {
  try {
    const data = await fs.readFile(`users/${userId}.json`, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Failed to read user ${userId}:`, err.message);
    return null; // Graceful fallback
  }
}

// Now it won't crash! 🎉
```

### Real-World Impact

**Without error handling**:
```
User requests data → File error → Server crashes → All users affected
```

**With error handling**:
```
User requests data → File error → Show error message → Other users unaffected
```

---

## Common File System Errors

### Error Codes (errno)

Node.js file operations return error objects with codes:

| Code | Meaning | Common Cause |
|------|---------|--------------|
| **ENOENT** | No such file or directory | File doesn't exist |
| **EACCES** | Permission denied | Can't read/write file |
| **EEXIST** | File already exists | Creating duplicate file |
| **EISDIR** | Is a directory | Tried to read directory as file |
| **ENOTDIR** | Not a directory | Expected directory, got file |
| **ENOSPC** | No space left on device | Disk is full |
| **EMFILE** | Too many open files | File descriptor limit reached |
| **EPERM** | Operation not permitted | Admin/root required |

### Examples of Each

```javascript
// ENOENT
await fs.readFile('nonexistent.txt');
// Error: ENOENT: no such file or directory

// EACCES
await fs.readFile('/root/secret.txt');
// Error: EACCES: permission denied

// EEXIST
await fs.writeFile('existing.txt', 'data', { flag: 'wx' });
// Error: EEXIST: file already exists

// EISDIR
await fs.readFile('./some-folder/');
// Error: EISDIR: illegal operation on a directory

// ENOSPC
await fs.writeFile('huge-file.txt', veryLargeData);
// Error: ENOSPC: no space left on device
```

---

## Error Handling with Async/Await

### Basic Try/Catch

```javascript
async function readFile() {
  try {
    const data = await fs.readFile('file.txt', 'utf8');
    console.log(data);
  } catch (err) {
    console.error('Error reading file:', err);
  }
}
```

### Checking Specific Error Codes

```javascript
async function readFileWithFallback() {
  try {
    const data = await fs.readFile('config.json', 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('Config file not found, using defaults');
      return { port: 3000, host: 'localhost' };
    }

    // For other errors, rethrow
    throw err;
  }
}
```

### Multiple Operations

```javascript
async function processFiles() {
  try {
    const config = await fs.readFile('config.json', 'utf8');
    const data = await fs.readFile('data.json', 'utf8');

    const result = combine(config, data);

    await fs.writeFile('output.json', result);

    console.log('Success!');
  } catch (err) {
    console.error('Process failed:', err.message);
    // Cleanup if needed
  }
}
```

### Nested Try/Catch (Multiple Error Handlers)

```javascript
async function complexOperation() {
  let tempFile = null;

  try {
    // Read operation
    const data = await fs.readFile('input.txt', 'utf8');

    try {
      // Write operation (separate error handling)
      tempFile = 'temp-' + Date.now() + '.txt';
      await fs.writeFile(tempFile, data);

      // Process...
      const result = process(data);

      await fs.writeFile('output.txt', result);

    } catch (writeErr) {
      console.error('Write error:', writeErr.message);

      // Cleanup temp file
      if (tempFile) {
        await fs.unlink(tempFile).catch(() => {});
      }

      throw writeErr;
    }

  } catch (err) {
    console.error('Operation failed:', err.message);
    return false;
  }

  return true;
}
```

---

## Error Handling with Promises

### Using .catch()

```javascript
fs.readFile('file.txt', 'utf8')
  .then(data => {
    console.log(data);
  })
  .catch(err => {
    console.error('Error:', err);
  });
```

### Chaining with Error Handling

```javascript
fs.readFile('input.txt', 'utf8')
  .then(data => {
    return fs.writeFile('output.txt', data.toUpperCase());
  })
  .then(() => {
    console.log('Success!');
  })
  .catch(err => {
    // Catches errors from ANY step
    console.error('Error:', err.message);
  });
```

### Handling Specific Errors

```javascript
fs.readFile('file.txt', 'utf8')
  .then(data => {
    return JSON.parse(data);
  })
  .catch(err => {
    if (err.code === 'ENOENT') {
      return {}; // Default value
    }
    throw err; // Re-throw other errors
  })
  .then(config => {
    console.log('Config:', config);
  })
  .catch(err => {
    console.error('Fatal error:', err);
  });
```

---

## Error Handling with Callbacks

### Error-First Pattern

```javascript
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error:', err);
    return; // Important: return early!
  }

  // Safe to use data here
  console.log(data);
});
```

### Multiple Operations

```javascript
fs.readFile('file1.txt', 'utf8', (err, data1) => {
  if (err) {
    console.error('Error reading file1:', err);
    return;
  }

  fs.readFile('file2.txt', 'utf8', (err, data2) => {
    if (err) {
      console.error('Error reading file2:', err);
      return;
    }

    console.log('Both files read:', data1, data2);
  });
});
```

---

## Best Practices

### 1. Always Handle Errors

```javascript
// ❌ BAD: No error handling
await fs.readFile('file.txt');

// ✅ GOOD: Error handling
try {
  await fs.readFile('file.txt');
} catch (err) {
  console.error('Error:', err);
}
```

### 2. Provide Context in Error Messages

```javascript
// ❌ BAD: Generic error
catch (err) {
  console.error('Error:', err);
}

// ✅ GOOD: Specific context
catch (err) {
  console.error(`Failed to read config file: ${err.message}`);
  console.error(`File path: ${configPath}`);
}
```

### 3. Don't Swallow Errors Silently

```javascript
// ❌ BAD: Silent failure
try {
  await fs.readFile('file.txt');
} catch (err) {
  // Do nothing - error disappears!
}

// ✅ GOOD: At least log it
try {
  await fs.readFile('file.txt');
} catch (err) {
  console.error('Error:', err);
  // Or throw to caller
}
```

### 4. Use Specific Error Codes

```javascript
// ✅ GOOD: Handle specific cases differently
try {
  await fs.readFile('config.json');
} catch (err) {
  if (err.code === 'ENOENT') {
    // File not found - use defaults
    return defaultConfig;
  } else if (err.code === 'EACCES') {
    // Permission denied - fatal
    throw new Error('Cannot access config file');
  } else {
    // Other errors - log and rethrow
    console.error('Unexpected error:', err);
    throw err;
  }
}
```

### 5. Clean Up Resources

```javascript
// ✅ GOOD: Always cleanup, even on error
let tempFile = null;

try {
  tempFile = await createTempFile();
  await processFile(tempFile);
} catch (err) {
  console.error('Error:', err);
} finally {
  // Always runs, even if error
  if (tempFile) {
    await fs.unlink(tempFile).catch(() => {});
  }
}
```

---

## Production Patterns

### Pattern 1: Retry Logic

```javascript
async function readFileWithRetry(path, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fs.readFile(path, 'utf8');
    } catch (err) {
      lastError = err;
      console.log(`Attempt ${i + 1} failed, retrying...`);
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Pattern 2: Graceful Degradation

```javascript
async function loadConfig() {
  // Try multiple sources, fallback to defaults
  try {
    return JSON.parse(await fs.readFile('config.json', 'utf8'));
  } catch (err) {
    console.warn('Could not load config.json:', err.message);

    try {
      return JSON.parse(await fs.readFile('config.default.json', 'utf8'));
    } catch (err) {
      console.warn('Could not load default config:', err.message);

      // Ultimate fallback
      return {
        port: 3000,
        host: 'localhost'
      };
    }
  }
}
```

### Pattern 3: Error Wrapping

```javascript
class FileOperationError extends Error {
  constructor(operation, path, originalError) {
    super(`${operation} failed for ${path}: ${originalError.message}`);
    this.name = 'FileOperationError';
    this.operation = operation;
    this.path = path;
    this.originalError = originalError;
    this.code = originalError.code;
  }
}

async function safeReadFile(path) {
  try {
    return await fs.readFile(path, 'utf8');
  } catch (err) {
    throw new FileOperationError('read', path, err);
  }
}

// Usage
try {
  const data = await safeReadFile('file.txt');
} catch (err) {
  if (err instanceof FileOperationError) {
    console.error(`File operation error: ${err.message}`);
    console.error(`Error code: ${err.code}`);
  }
}
```

### Pattern 4: Error Logging Service

```javascript
class ErrorLogger {
  static log(context, error) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message,
      code: error.code,
      stack: error.stack
    };

    // Log to file
    fs.appendFile('errors.log', JSON.stringify(errorInfo) + '\n')
      .catch(err => console.error('Failed to log error:', err));

    // Could also send to external service
    // sendToErrorTracking(errorInfo);
  }
}

// Usage
try {
  await fs.readFile('file.txt');
} catch (err) {
  ErrorLogger.log('readFile', err);
  throw err;
}
```

### Pattern 5: Check Before Operation

```javascript
async function safeFileWrite(path, data) {
  try {
    // Check if parent directory exists
    const dir = require('path').dirname(path);
    await fs.access(dir);

    // Check if we have write permission
    await fs.access(dir, fs.constants.W_OK);

    // Perform write
    await fs.writeFile(path, data);

  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Directory doesn't exist: ${dir}`);
    } else if (err.code === 'EACCES') {
      throw new Error(`No write permission for: ${dir}`);
    }
    throw err;
  }
}
```

---

## Common Mistakes

### Mistake 1: Not Returning After Error

```javascript
// ❌ BAD: Code continues after error!
fs.readFile('file.txt', (err, data) => {
  if (err) {
    console.error(err);
    // Missing return!
  }
  console.log(data); // Crashes if err exists
});

// ✅ GOOD: Return early
fs.readFile('file.txt', (err, data) => {
  if (err) {
    console.error(err);
    return; // Stop here
  }
  console.log(data);
});
```

### Mistake 2: Catching Without Rethrowing

```javascript
// ❌ BAD: Swallows error
async function getData() {
  try {
    return await fs.readFile('file.txt');
  } catch (err) {
    console.log('Error occurred');
    // Error is lost! Caller thinks it succeeded
  }
}

// ✅ GOOD: Rethrow or return error indicator
async function getData() {
  try {
    return await fs.readFile('file.txt');
  } catch (err) {
    console.log('Error occurred:', err);
    throw err; // Let caller handle it
  }
}
```

### Mistake 3: Not Awaiting in Try/Catch

```javascript
// ❌ BAD: Forgot await, error not caught!
async function readFile() {
  try {
    const data = fs.readFile('file.txt'); // Missing await!
    console.log(data);
  } catch (err) {
    // Never executes!
    console.error(err);
  }
}

// ✅ GOOD: Await the promise
async function readFile() {
  try {
    const data = await fs.readFile('file.txt');
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
```

---

## Testing Error Handling

### How to Test Error Scenarios

```javascript
const assert = require('assert');

// Test file not found
try {
  await readUserData('nonexistent-user');
  assert.fail('Should have thrown error');
} catch (err) {
  assert.strictEqual(err.code, 'ENOENT');
  console.log('✓ Correctly handles missing file');
}

// Test permission denied
try {
  await fs.readFile('/root/secret.txt');
  assert.fail('Should have thrown error');
} catch (err) {
  assert.strictEqual(err.code, 'EACCES');
  console.log('✓ Correctly handles permission denied');
}
```

---

## Summary

### Key Takeaways

1. **Always handle errors** - File operations can and will fail
2. **Use try/catch** with async/await for clean error handling
3. **Check error.code** for specific error types
4. **Provide context** in error messages
5. **Don't swallow errors** silently
6. **Clean up resources** in finally blocks
7. **Implement retries** for transient errors
8. **Graceful degradation** with fallbacks

### Error Handling Checklist

- [ ] All file operations wrapped in try/catch
- [ ] Error messages include context
- [ ] Specific error codes handled differently
- [ ] Resources cleaned up in finally blocks
- [ ] Errors logged for debugging
- [ ] Graceful fallbacks implemented
- [ ] User sees helpful error messages
- [ ] Application doesn't crash on file errors

---

## Next Steps

- **Practice**: Add error handling to your code
- **Read**: Examples in `../examples/08-error-handling.js`
- **Exercise**: Complete exercises with robust error handling
- **Study**: Look at production codebases for error handling patterns

---

**Remember**: Good error handling is what separates hobbyist code from production code!
