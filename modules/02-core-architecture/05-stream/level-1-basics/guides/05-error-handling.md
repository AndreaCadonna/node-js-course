# Error Handling in Streams

## Introduction

Error handling is one of the most critical aspects of working with streams. Streams can fail in many ways - files might not exist, disks might be full, network connections might drop, or data might be corrupted. This guide will teach you how to handle errors properly, prevent crashes, and build robust streaming applications.

By the end of this guide, you'll understand why stream errors are special, know how to handle errors in different streaming scenarios, and be able to debug stream issues effectively.

---

## Why Stream Errors Are Special

### The Problem with Stream Errors

Streams are **EventEmitters**, and by default, unhandled errors crash your application:

```javascript
const fs = require('fs');

// ❌ This WILL crash your application
const stream = fs.createReadStream('nonexistent.txt');

// When file doesn't exist:
// Error: ENOENT: no such file or directory
// [Crashes process with stack trace]
```

**Why this is dangerous:**
- One unhandled error can crash your entire server
- Errors can occur asynchronously, long after stream creation
- Error handling is not automatic - you must add it explicitly

### Errors Don't Propagate Automatically

```javascript
const fs = require('fs');

// ❌ This only catches write errors!
fs.createReadStream('nonexistent.txt')  // Read error NOT caught
  .pipe(fs.createWriteStream('output.txt'))
  .on('error', err => {
    console.error('Error:', err);  // Won't see read errors!
  });

// ✅ Must handle each stream
const readable = fs.createReadStream('nonexistent.txt');
const writable = fs.createWriteStream('output.txt');

readable.on('error', err => console.error('Read error:', err));
writable.on('error', err => console.error('Write error:', err));

readable.pipe(writable);
```

---

## Common Stream Errors

### File System Errors

**ENOENT - File Not Found**
```javascript
const stream = fs.createReadStream('nonexistent.txt');

stream.on('error', err => {
  console.error('Error:', err.code);  // 'ENOENT'
  console.error('Message:', err.message);
  // Error: ENOENT: no such file or directory, open 'nonexistent.txt'
});
```

**EACCES - Permission Denied**
```javascript
const stream = fs.createWriteStream('/root/protected.txt');

stream.on('error', err => {
  console.error('Error:', err.code);  // 'EACCES'
  // Error: EACCES: permission denied, open '/root/protected.txt'
});
```

**ENOSPC - No Space Left**
```javascript
const stream = fs.createWriteStream('huge-file.dat');

stream.write('x'.repeat(1000000));

stream.on('error', err => {
  console.error('Error:', err.code);  // 'ENOSPC'
  // Error: ENOSPC: no space left on device
});
```

**EISDIR - Is a Directory**
```javascript
const stream = fs.createReadStream('./my-directory');

stream.on('error', err => {
  console.error('Error:', err.code);  // 'EISDIR'
  // Error: EISDIR: illegal operation on a directory
});
```

### Network Errors

**ECONNREFUSED - Connection Refused**
```javascript
const net = require('net');

const socket = net.connect(9999, 'localhost');

socket.on('error', err => {
  console.error('Error:', err.code);  // 'ECONNREFUSED'
  // Error: connect ECONNREFUSED 127.0.0.1:9999
});
```

**ETIMEDOUT - Connection Timeout**
```javascript
const net = require('net');

const socket = net.connect(9999, 'example.com');

socket.on('error', err => {
  console.error('Error:', err.code);  // 'ETIMEDOUT'
  // Error: connect ETIMEDOUT
});
```

**ECONNRESET - Connection Reset**
```javascript
socket.on('error', err => {
  console.error('Error:', err.code);  // 'ECONNRESET'
  // Error: read ECONNRESET
});
```

### Data Errors

**Invalid Data Format**
```javascript
const zlib = require('zlib');
const fs = require('fs');

// Try to decompress non-gzipped file
fs.createReadStream('not-compressed.txt')
  .pipe(zlib.createGunzip())
  .on('error', err => {
    console.error('Error:', err.message);
    // Error: incorrect header check
  })
  .pipe(fs.createWriteStream('output.txt'));
```

---

## Basic Error Handling Patterns

### Pattern 1: Always Add Error Handlers

```javascript
const fs = require('fs');

// ❌ BAD: No error handler (will crash)
const stream = fs.createReadStream('file.txt');

// ✅ GOOD: Error handler present
const stream = fs.createReadStream('file.txt');

stream.on('error', err => {
  console.error('Stream error:', err.message);
  // Handle error gracefully
});
```

### Pattern 2: Handle Errors on All Streams

```javascript
const fs = require('fs');

// When piping, handle errors on BOTH streams
const readable = fs.createReadStream('input.txt');
const writable = fs.createWriteStream('output.txt');

// ❌ BAD: Only handling destination
readable.pipe(writable).on('error', err => {
  console.error(err);  // Won't catch read errors!
});

// ✅ GOOD: Handling both
readable.on('error', err => {
  console.error('Read error:', err.message);
});

writable.on('error', err => {
  console.error('Write error:', err.message);
});

readable.pipe(writable);
```

### Pattern 3: Clean Up on Error

```javascript
const fs = require('fs');

const readable = fs.createReadStream('input.txt');
const writable = fs.createWriteStream('output.txt');

function cleanup(err) {
  // Destroy streams
  readable.destroy();
  writable.destroy();

  if (err) {
    console.error('Operation failed:', err.message);

    // Clean up partial output
    fs.unlink('output.txt', () => {
      console.log('Cleaned up partial file');
    });
  }
}

readable.on('error', cleanup);
writable.on('error', cleanup);
writable.on('finish', () => cleanup(null));

readable.pipe(writable);
```

---

## Error Handling in Different Scenarios

### Scenario 1: Reading Files

```javascript
const fs = require('fs');

function readFileSafely(filename, callback) {
  const stream = fs.createReadStream(filename);
  const chunks = [];

  stream.on('data', chunk => {
    chunks.push(chunk);
  });

  stream.on('end', () => {
    const data = Buffer.concat(chunks);
    callback(null, data);
  });

  stream.on('error', err => {
    // Handle specific errors
    if (err.code === 'ENOENT') {
      callback(new Error(`File not found: ${filename}`));
    } else if (err.code === 'EACCES') {
      callback(new Error(`Permission denied: ${filename}`));
    } else if (err.code === 'EISDIR') {
      callback(new Error(`Is a directory: ${filename}`));
    } else {
      callback(err);
    }
  });
}

// Usage
readFileSafely('data.txt', (err, data) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Data:', data.toString());
  }
});
```

### Scenario 2: Writing Files

```javascript
const fs = require('fs');

function writeFileSafely(filename, data, callback) {
  const stream = fs.createWriteStream(filename);

  stream.on('error', err => {
    // Handle specific errors
    if (err.code === 'EACCES') {
      callback(new Error(`Permission denied: ${filename}`));
    } else if (err.code === 'ENOSPC') {
      callback(new Error('Disk full'));
    } else if (err.code === 'EROFS') {
      callback(new Error('Read-only file system'));
    } else {
      callback(err);
    }
  });

  stream.on('finish', () => {
    callback(null);
  });

  // Write data
  stream.write(data);
  stream.end();
}

// Usage
writeFileSafely('output.txt', 'Hello, World!', err => {
  if (err) {
    console.error('Write failed:', err.message);
  } else {
    console.log('Write succeeded');
  }
});
```

### Scenario 3: Piping Streams

```javascript
const fs = require('fs');

function copyFileSafely(source, dest, callback) {
  const readable = fs.createReadStream(source);
  const writable = fs.createWriteStream(dest);

  let errorOccurred = false;

  function handleError(err) {
    if (errorOccurred) return;  // Already handled
    errorOccurred = true;

    // Clean up
    readable.destroy();
    writable.destroy();

    // Remove partial file
    fs.unlink(dest, () => {
      callback(err);
    });
  }

  readable.on('error', handleError);
  writable.on('error', handleError);

  writable.on('finish', () => {
    if (!errorOccurred) {
      callback(null);
    }
  });

  readable.pipe(writable);
}

// Usage
copyFileSafely('source.txt', 'dest.txt', err => {
  if (err) {
    console.error('Copy failed:', err.message);
  } else {
    console.log('Copy succeeded');
  }
});
```

### Scenario 4: Transform Streams

```javascript
const { Transform } = require('stream');
const fs = require('fs');

class SafeUpperCase extends Transform {
  _transform(chunk, encoding, callback) {
    try {
      const uppercased = chunk.toString().toUpperCase();
      this.push(uppercased);
      callback();
    } catch (err) {
      // Transform error
      callback(err);
    }
  }

  _flush(callback) {
    try {
      // Any final processing
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

// Usage with error handling
const readable = fs.createReadStream('input.txt');
const transform = new SafeUpperCase();
const writable = fs.createWriteStream('output.txt');

readable.on('error', err => console.error('Read:', err.message));
transform.on('error', err => console.error('Transform:', err.message));
writable.on('error', err => console.error('Write:', err.message));

readable.pipe(transform).pipe(writable);
```

---

## Using pipeline() for Better Error Handling

### Why pipeline() Is Better

The `stream.pipeline()` function provides automatic error handling:

```javascript
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Old way: Manual error handling
const r = fs.createReadStream('input.txt');
const g = zlib.createGzip();
const w = fs.createWriteStream('output.gz');

r.on('error', cleanup);
g.on('error', cleanup);
w.on('error', cleanup);
w.on('finish', onSuccess);

r.pipe(g).pipe(w);

// New way: Automatic error handling
pipeline(
  fs.createReadStream('input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('output.gz'),
  (err) => {
    if (err) {
      console.error('Pipeline failed:', err);
    } else {
      console.log('Pipeline succeeded');
    }
  }
);
```

### Benefits of pipeline()

1. **Single error handler** - One callback catches all errors
2. **Automatic cleanup** - Destroys streams on error
3. **Proper propagation** - Errors bubble up correctly
4. **Less boilerplate** - Much cleaner code

### pipeline() Examples

```javascript
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Example 1: File compression
pipeline(
  fs.createReadStream('input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('input.txt.gz'),
  (err) => {
    if (err) {
      console.error('Compression failed:', err.message);

      // Clean up on error
      fs.unlink('input.txt.gz', () => {});
    } else {
      console.log('Compression succeeded');
    }
  }
);

// Example 2: With custom transform
const { Transform } = require('stream');

class LineCounter extends Transform {
  constructor() {
    super();
    this.lines = 0;
  }

  _transform(chunk, encoding, callback) {
    this.lines += chunk.toString().split('\n').length - 1;
    this.push(chunk);
    callback();
  }

  _flush(callback) {
    console.log(`Total lines: ${this.lines}`);
    callback();
  }
}

const counter = new LineCounter();

pipeline(
  fs.createReadStream('input.txt'),
  counter,
  fs.createWriteStream('output.txt'),
  (err) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('Success!');
    }
  }
);

// Example 3: Multiple transforms
pipeline(
  fs.createReadStream('data.txt'),
  zlib.createGzip(),
  fs.createWriteStream('data.txt.gz'),
  (err) => {
    if (err) {
      // This catches errors from ALL three streams
      console.error('Failed at some stage:', err.message);
    } else {
      console.log('All stages succeeded');
    }
  }
);
```

### pipeline() with Promises

```javascript
const { pipeline } = require('stream/promises');
const fs = require('fs');
const zlib = require('zlib');

async function compressFile(input, output) {
  try {
    await pipeline(
      fs.createReadStream(input),
      zlib.createGzip(),
      fs.createWriteStream(output)
    );
    console.log('Compression succeeded');
  } catch (err) {
    console.error('Compression failed:', err.message);

    // Clean up
    try {
      await fs.promises.unlink(output);
    } catch (unlinkErr) {
      // Ignore cleanup errors
    }
  }
}

// Usage
compressFile('input.txt', 'input.txt.gz');
```

---

## Debugging Stream Errors

### Adding Debug Logging

```javascript
const fs = require('fs');

function createDebugStream(filename) {
  const stream = fs.createReadStream(filename);

  // Log all events
  stream.on('open', fd => {
    console.log(`[OPEN] File descriptor: ${fd}`);
  });

  stream.on('ready', () => {
    console.log('[READY] Stream ready to read');
  });

  stream.on('data', chunk => {
    console.log(`[DATA] Received ${chunk.length} bytes`);
  });

  stream.on('end', () => {
    console.log('[END] No more data');
  });

  stream.on('close', () => {
    console.log('[CLOSE] Stream closed');
  });

  stream.on('error', err => {
    console.error('[ERROR]', err.message);
  });

  return stream;
}

// Usage
const stream = createDebugStream('test.txt');
```

### Tracking Stream State

```javascript
const fs = require('fs');

class MonitoredStream {
  constructor(filename) {
    this.stream = fs.createReadStream(filename);
    this.bytesRead = 0;
    this.chunks = 0;
    this.errors = [];

    this.stream.on('data', chunk => {
      this.bytesRead += chunk.length;
      this.chunks++;
    });

    this.stream.on('error', err => {
      this.errors.push(err);
    });

    this.stream.on('end', () => {
      console.log('Stats:', {
        bytesRead: this.bytesRead,
        chunks: this.chunks,
        errors: this.errors.length
      });
    });
  }

  getStream() {
    return this.stream;
  }
}

// Usage
const monitored = new MonitoredStream('large-file.dat');
monitored.getStream().pipe(process.stdout);
```

### Using Debug Module

```javascript
const debug = require('debug');
const fs = require('fs');

const debugRead = debug('app:read');
const debugWrite = debug('app:write');
const debugError = debug('app:error');

const readable = fs.createReadStream('input.txt');
const writable = fs.createWriteStream('output.txt');

readable.on('data', chunk => {
  debugRead('Read %d bytes', chunk.length);
});

writable.on('drain', () => {
  debugWrite('Buffer drained');
});

readable.on('error', err => {
  debugError('Read error: %s', err.message);
});

writable.on('error', err => {
  debugError('Write error: %s', err.message);
});

readable.pipe(writable);

// Run with: DEBUG=app:* node script.js
```

---

## Advanced Error Handling Patterns

### Pattern 1: Retry Logic

```javascript
const fs = require('fs');

function readWithRetry(filename, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function tryRead() {
      attempts++;
      console.log(`Attempt ${attempts}...`);

      const stream = fs.createReadStream(filename);
      const chunks = [];

      stream.on('data', chunk => chunks.push(chunk));

      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', err => {
        if (attempts < maxRetries) {
          console.log('Retrying...');
          setTimeout(tryRead, 1000 * attempts);  // Exponential backoff
        } else {
          reject(new Error(`Failed after ${maxRetries} attempts: ${err.message}`));
        }
      });
    }

    tryRead();
  });
}

// Usage
readWithRetry('flaky-file.txt', 3)
  .then(data => console.log('Success:', data.toString()))
  .catch(err => console.error('Failed:', err.message));
```

### Pattern 2: Fallback Strategy

```javascript
const fs = require('fs');

function readWithFallback(primaryFile, fallbackFile) {
  return new Promise((resolve, reject) => {
    const primary = fs.createReadStream(primaryFile);
    const chunks = [];

    primary.on('data', chunk => chunks.push(chunk));
    primary.on('end', () => resolve(Buffer.concat(chunks)));

    primary.on('error', primaryErr => {
      console.log('Primary failed, trying fallback...');

      const fallback = fs.createReadStream(fallbackFile);
      const fallbackChunks = [];

      fallback.on('data', chunk => fallbackChunks.push(chunk));
      fallback.on('end', () => resolve(Buffer.concat(fallbackChunks)));

      fallback.on('error', fallbackErr => {
        reject(new Error(
          `Both failed. Primary: ${primaryErr.message}, Fallback: ${fallbackErr.message}`
        ));
      });
    });
  });
}

// Usage
readWithFallback('config.json', 'config.default.json')
  .then(data => console.log('Config:', data.toString()))
  .catch(err => console.error('No config available:', err.message));
```

### Pattern 3: Timeout Handling

```javascript
const fs = require('fs');

function readWithTimeout(filename, timeoutMs) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filename);
    const chunks = [];
    let finished = false;

    // Set timeout
    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        stream.destroy();
        reject(new Error(`Read timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    stream.on('data', chunk => chunks.push(chunk));

    stream.on('end', () => {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        resolve(Buffer.concat(chunks));
      }
    });

    stream.on('error', err => {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}

// Usage
readWithTimeout('large-file.dat', 5000)
  .then(data => console.log('Read complete'))
  .catch(err => console.error('Error:', err.message));
```

### Pattern 4: Circuit Breaker

```javascript
class StreamCircuitBreaker {
  constructor(maxFailures = 3, resetTimeout = 60000) {
    this.failures = 0;
    this.maxFailures = maxFailures;
    this.resetTimeout = resetTimeout;
    this.state = 'CLOSED';  // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = null;
  }

  async execute(streamOperation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await streamOperation();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;

    if (this.failures >= this.maxFailures) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.log(`Circuit breaker OPEN until ${new Date(this.nextAttempt)}`);
    }
  }
}

// Usage
const breaker = new StreamCircuitBreaker(3, 10000);

async function readFileWithCircuitBreaker(filename) {
  try {
    return await breaker.execute(() => {
      return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filename);
        const chunks = [];

        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    });
  } catch (err) {
    console.error('Read failed:', err.message);
    throw err;
  }
}
```

---

## Best Practices Summary

### 1. Always Add Error Handlers

```javascript
// ✅ Every stream needs an error handler
stream.on('error', err => {
  console.error('Error:', err.message);
});
```

### 2. Handle Errors on All Streams in Pipeline

```javascript
// ✅ Use pipeline() for automatic handling
const { pipeline } = require('stream');

pipeline(
  source,
  transform,
  destination,
  (err) => {
    if (err) console.error('Pipeline error:', err);
  }
);
```

### 3. Clean Up on Error

```javascript
// ✅ Destroy streams and clean up resources
stream.on('error', err => {
  stream.destroy();
  cleanup();
});
```

### 4. Provide Meaningful Error Messages

```javascript
// ✅ Give context about what failed
stream.on('error', err => {
  console.error(`Failed to read ${filename}: ${err.message}`);
});
```

### 5. Don't Ignore Error Codes

```javascript
// ✅ Handle specific error types
stream.on('error', err => {
  switch (err.code) {
    case 'ENOENT':
      console.error('File not found');
      break;
    case 'EACCES':
      console.error('Permission denied');
      break;
    case 'ENOSPC':
      console.error('Disk full');
      break;
    default:
      console.error('Unknown error:', err.message);
  }
});
```

### 6. Log for Debugging

```javascript
// ✅ Log errors with context
stream.on('error', err => {
  console.error('[ERROR]', {
    filename,
    error: err.message,
    code: err.code,
    timestamp: new Date().toISOString()
  });
});
```

---

## Common Pitfalls

### Pitfall 1: No Error Handler

```javascript
// ❌ Will crash on error
const stream = fs.createReadStream('file.txt');

// ✅ Safe
const stream = fs.createReadStream('file.txt');
stream.on('error', err => console.error(err));
```

### Pitfall 2: Forgetting Some Streams

```javascript
// ❌ Only handling last stream
source.pipe(transform).pipe(dest).on('error', handleError);

// ✅ Handle all streams
source.on('error', handleError);
transform.on('error', handleError);
dest.on('error', handleError);
source.pipe(transform).pipe(dest);
```

### Pitfall 3: Not Cleaning Up

```javascript
// ❌ Leaves resources hanging
stream.on('error', err => {
  console.error(err);
  // Stream still open!
});

// ✅ Clean up properly
stream.on('error', err => {
  console.error(err);
  stream.destroy();
});
```

### Pitfall 4: Swallowing Errors

```javascript
// ❌ Silent failure
stream.on('error', err => {
  // Empty handler - error lost!
});

// ✅ At minimum, log it
stream.on('error', err => {
  console.error('Stream error:', err);
});
```

---

## Summary

### Key Takeaways

1. **Always add error handlers** - Unhandled errors crash your app
2. **Errors don't propagate** - Handle each stream separately
3. **Use pipeline()** - Automatic error handling and cleanup
4. **Clean up on error** - Destroy streams, remove partial files
5. **Check error codes** - Handle specific errors appropriately
6. **Log errors** - Include context for debugging
7. **Test error paths** - Don't just test the happy path

### Error Handling Checklist

```javascript
// ✓ Error handler on every stream
stream.on('error', handleError);

// ✓ Cleanup on error
function handleError(err) {
  stream.destroy();
  cleanup();
}

// ✓ Use pipeline() for multiple streams
pipeline(s1, s2, s3, callback);

// ✓ Log errors with context
console.error('Failed:', { file, error: err.message });

// ✓ Handle specific error codes
if (err.code === 'ENOENT') { /* ... */ }

// ✓ Test error scenarios
// Simulate: missing files, full disk, permissions, etc.
```

### Quick Reference

```javascript
const { pipeline } = require('stream');
const fs = require('fs');

// Simple error handling
const stream = fs.createReadStream('file.txt');
stream.on('error', err => {
  console.error('Error:', err.message);
  stream.destroy();
});

// Pipeline with error handling (recommended)
pipeline(
  fs.createReadStream('input.txt'),
  transformStream,
  fs.createWriteStream('output.txt'),
  (err) => {
    if (err) {
      console.error('Pipeline failed:', err.message);
      // Cleanup
    } else {
      console.log('Pipeline succeeded');
    }
  }
);

// Common error codes
switch (err.code) {
  case 'ENOENT': // File not found
  case 'EACCES': // Permission denied
  case 'ENOSPC': // Disk full
  case 'EISDIR': // Is a directory
  case 'ECONNREFUSED': // Connection refused
  case 'ETIMEDOUT': // Timeout
  case 'ECONNRESET': // Connection reset
}
```

---

## Next Steps

Now that you understand error handling in streams, you're ready to:
- Build robust production applications with streams
- Handle edge cases and failure scenarios
- Debug stream issues effectively
- Explore transform streams and advanced patterns

You've completed the fundamental guides for Node.js streams! Continue to Level 2 for more advanced stream topics and patterns.
