# Piping Streams

## Introduction

Piping is one of the most powerful features of Node.js streams. It allows you to connect a readable stream to a writable stream, automatically handling data flow, backpressure, and errors. This guide will teach you how piping works, when to use it, and how to build complex data pipelines.

By the end of this guide, you'll understand how to use `pipe()` effectively, how to chain multiple streams together, and how piping simplifies stream handling compared to manual data transfer.

---

## What Is Piping?

### Definition

**Piping** connects a readable stream's output to a writable stream's input, automatically managing the data flow between them.

**Conceptual Model:**

```
┌──────────┐                    ┌──────────┐
│ Readable │  ─── pipe() ───>   │ Writable │
│  Stream  │                    │  Stream  │
└──────────┘                    └──────────┘
     ↓                               ↑
  (source)                      (destination)
```

### The UNIX Philosophy

Piping in Node.js is inspired by UNIX pipes:

```bash
# UNIX shell
cat file.txt | grep "error" | wc -l

# Node.js equivalent
readFile('file.txt')
  .pipe(filterErrors())
  .pipe(countLines())
```

**Benefits of this approach:**
- Small, focused components
- Easy to compose and reuse
- Readable, declarative code

---

## Basic pipe() Usage

### Simple File Copy

```javascript
const fs = require('fs');

// Manual approach (don't do this!)
const readable = fs.createReadStream('source.txt');
const writable = fs.createWriteStream('dest.txt');

readable.on('data', chunk => {
  writable.write(chunk);
});

readable.on('end', () => {
  writable.end();
});

// With pipe() - much simpler!
const readable = fs.createReadStream('source.txt');
const writable = fs.createWriteStream('dest.txt');

readable.pipe(writable);

// That's it! Pipe handles everything automatically.
```

### What pipe() Does Automatically

When you call `readable.pipe(writable)`, it:

1. **Listens for 'data' events** on the readable stream
2. **Writes data** to the writable stream
3. **Handles backpressure** - pauses reading when write buffer is full
4. **Resumes reading** when write buffer drains
5. **Calls end()** on writable when readable ends
6. **Returns the destination** for chaining

```javascript
// What pipe() does internally (simplified):
ReadableStream.prototype.pipe = function(dest) {
  this.on('data', chunk => {
    const ok = dest.write(chunk);
    if (!ok) {
      this.pause();  // Backpressure!
    }
  });

  dest.on('drain', () => {
    this.resume();  // Resume reading
  });

  this.on('end', () => {
    dest.end();  // Close destination
  });

  return dest;  // Allow chaining
};
```

---

## Why Use pipe()?

### Manual Approach vs pipe()

**Manual Approach:**

```javascript
const fs = require('fs');

const readable = fs.createReadStream('input.txt');
const writable = fs.createWriteStream('output.txt');

// Must handle all of this manually:

// 1. Transfer data
readable.on('data', chunk => {
  const ok = writable.write(chunk);

  // 2. Handle backpressure
  if (!ok) {
    readable.pause();
  }
});

// 3. Resume on drain
writable.on('drain', () => {
  readable.resume();
});

// 4. End destination
readable.on('end', () => {
  writable.end();
});

// 5. Handle errors
readable.on('error', err => {
  console.error('Read error:', err);
  writable.destroy();
});

writable.on('error', err => {
  console.error('Write error:', err);
  readable.destroy();
});

// That's a lot of boilerplate!
```

**With pipe():**

```javascript
const fs = require('fs');

fs.createReadStream('input.txt')
  .pipe(fs.createWriteStream('output.txt'));

// That's it! Much cleaner.
```

### Benefits of pipe()

1. **Less code** - No manual event handling
2. **Automatic backpressure** - Prevents memory issues
3. **Automatic cleanup** - Handles end() for you
4. **Chainable** - Build complex pipelines easily
5. **More readable** - Declarative, self-documenting code

---

## Chaining Streams

### Basic Chaining

Because `pipe()` returns the destination stream, you can chain multiple pipes:

```javascript
const fs = require('fs');
const zlib = require('zlib');

// Read → Compress → Write
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'));

console.log('Compressing file...');
```

### Multi-Stage Pipelines

```javascript
const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');

// Read → Compress → Encrypt → Write
fs.createReadStream('secret.txt')
  .pipe(zlib.createGzip())
  .pipe(crypto.createCipher('aes192', 'password'))
  .pipe(fs.createWriteStream('secret.txt.gz.enc'));

console.log('Compressing and encrypting...');
```

### Why Chaining Works

```javascript
const stream1 = fs.createReadStream('input.txt');
const stream2 = zlib.createGzip();
const stream3 = fs.createWriteStream('output.txt.gz');

// pipe() returns the destination
const returnValue = stream1.pipe(stream2);
console.log(returnValue === stream2);  // true

// So you can chain
stream1.pipe(stream2).pipe(stream3);

// Equivalent to:
stream1.pipe(stream2);
stream2.pipe(stream3);
```

---

## Practical Examples

### Example 1: Copy File

```javascript
const fs = require('fs');

function copyFile(source, destination, callback) {
  const readable = fs.createReadStream(source);
  const writable = fs.createWriteStream(destination);

  readable.pipe(writable);

  writable.on('finish', () => {
    console.log('Copy complete');
    callback(null);
  });

  readable.on('error', callback);
  writable.on('error', callback);
}

// Usage
copyFile('source.txt', 'dest.txt', err => {
  if (err) {
    console.error('Copy failed:', err);
  } else {
    console.log('Success!');
  }
});
```

### Example 2: Compress File

```javascript
const fs = require('fs');
const zlib = require('zlib');

function compressFile(input, output, callback) {
  const readable = fs.createReadStream(input);
  const gzip = zlib.createGzip();
  const writable = fs.createWriteStream(output);

  readable
    .pipe(gzip)
    .pipe(writable)
    .on('finish', callback)
    .on('error', callback);
}

// Usage
compressFile('large.txt', 'large.txt.gz', err => {
  if (err) {
    console.error('Compression failed:', err);
  } else {
    console.log('File compressed!');
  }
});
```

### Example 3: Decompress File

```javascript
const fs = require('fs');
const zlib = require('zlib');

function decompressFile(input, output, callback) {
  fs.createReadStream(input)
    .pipe(zlib.createGunzip())
    .pipe(fs.createWriteStream(output))
    .on('finish', callback)
    .on('error', callback);
}

// Usage
decompressFile('archive.gz', 'archive.txt', err => {
  if (err) {
    console.error('Decompression failed:', err);
  } else {
    console.log('File decompressed!');
  }
});
```

### Example 4: HTTP File Download

```javascript
const fs = require('fs');
const http = require('http');

http.createServer((req, res) => {
  // Stream file to client
  const stream = fs.createReadStream('large-file.pdf');

  // Set headers
  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="file.pdf"'
  });

  // Pipe file to response
  stream.pipe(res);

  // Handle errors
  stream.on('error', err => {
    res.statusCode = 500;
    res.end('Server error');
  });
}).listen(3000);

console.log('Server listening on port 3000');
```

### Example 5: Progress Tracking

```javascript
const fs = require('fs');
const zlib = require('zlib');
const { Transform } = require('stream');

// Custom transform to track progress
class ProgressTracker extends Transform {
  constructor() {
    super();
    this.bytesProcessed = 0;
  }

  _transform(chunk, encoding, callback) {
    this.bytesProcessed += chunk.length;
    console.log(`Processed: ${this.bytesProcessed} bytes`);
    this.push(chunk);
    callback();
  }
}

// Use in pipeline
fs.createReadStream('large.txt')
  .pipe(new ProgressTracker())
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('large.txt.gz'))
  .on('finish', () => console.log('Done!'));
```

---

## Understanding Backpressure in Pipes

### How pipe() Handles Backpressure

```javascript
// When you pipe:
readable.pipe(writable);

// Internally, pipe() does this:
readable.on('data', chunk => {
  const ok = writable.write(chunk);

  if (!ok) {
    // Write buffer full - pause reading
    readable.pause();
    console.log('Backpressure: paused reading');
  }
});

writable.on('drain', () => {
  // Write buffer empty - resume reading
  readable.resume();
  console.log('Backpressure resolved: resumed reading');
});
```

### Visualizing Backpressure

```
Fast Reader, Slow Writer:

Time 0: ┌────────┐ ──fast──> ┌────────┐
        │ Reader │            │ Writer │
        └────────┘            └────────┘
                              Buffer: [■■■■■□□□]

Time 1: ┌────────┐ ──fast──> ┌────────┐
        │ Reader │            │ Writer │
        └────────┘            └────────┘
                              Buffer: [■■■■■■■■] FULL!

Time 2: ┌────────┐   PAUSED   ┌────────┐
        │ Reader │ ────X────> │ Writer │
        └────────┘            └────────┘
                              Buffer: [■■■■■■■■]
                              Draining...

Time 3: ┌────────┐ DRAIN/RESUME ┌────────┐
        │ Reader │ ──fast──>  │ Writer │
        └────────┘            └────────┘
                              Buffer: [■■□□□□□□] Ready!
```

### Example: Observing Backpressure

```javascript
const fs = require('fs');
const { Transform } = require('stream');

// Slow transform to create backpressure
class SlowTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // Simulate slow processing (100ms per chunk)
    setTimeout(() => {
      console.log('Processed chunk:', chunk.length);
      this.push(chunk);
      callback();
    }, 100);
  }
}

const readable = fs.createReadStream('large.txt');
const slow = new SlowTransform();
const writable = fs.createWriteStream('output.txt');

// Monitor pause/resume
readable.on('pause', () => console.log('⏸  Reader PAUSED'));
readable.on('resume', () => console.log('▶️  Reader RESUMED'));

// Pipe through slow transform
readable.pipe(slow).pipe(writable);

// Output will show multiple pause/resume cycles
```

---

## pipe() Return Value and Chaining

### What pipe() Returns

```javascript
const fs = require('fs');
const zlib = require('zlib');

const readable = fs.createReadStream('input.txt');
const gzip = zlib.createGzip();

// pipe() returns the destination
const returnValue = readable.pipe(gzip);
console.log(returnValue === gzip);  // true
```

### Chaining Pattern

```javascript
// Style 1: All on one line
source.pipe(transform1).pipe(transform2).pipe(destination);

// Style 2: One pipe per line (more readable)
source
  .pipe(transform1)
  .pipe(transform2)
  .pipe(destination);

// Style 3: Store intermediates (for event handling)
const step1 = source.pipe(transform1);
const step2 = step1.pipe(transform2);
const final = step2.pipe(destination);

step1.on('error', handleError);
step2.on('error', handleError);
final.on('error', handleError);
```

### Accessing the Final Stream

```javascript
const fs = require('fs');
const zlib = require('zlib');

// The final pipe() returns the last stream
const finalStream = fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('output.gz'));

// Listen to events on final stream
finalStream.on('finish', () => {
  console.log('Pipeline complete');
});

finalStream.on('error', err => {
  console.error('Pipeline error:', err);
});
```

---

## Event Handling with pipe()

### Basic Error Handling

```javascript
const fs = require('fs');

const readable = fs.createReadStream('input.txt');
const writable = fs.createWriteStream('output.txt');

// Must handle errors on BOTH streams
readable.on('error', err => {
  console.error('Read error:', err);
});

writable.on('error', err => {
  console.error('Write error:', err);
});

readable.pipe(writable);
```

### Why Errors Don't Propagate

```javascript
// ❌ This does NOT catch read errors
fs.createReadStream('input.txt')
  .pipe(fs.createWriteStream('output.txt'))
  .on('error', err => {
    // Only catches write errors!
    console.error(err);
  });

// ✅ Must handle each stream
const readable = fs.createReadStream('input.txt');
const writable = fs.createWriteStream('output.txt');

readable.on('error', handleError);
writable.on('error', handleError);

readable.pipe(writable);
```

### Pattern: Comprehensive Error Handling

```javascript
const fs = require('fs');
const zlib = require('zlib');

const readable = fs.createReadStream('input.txt');
const gzip = zlib.createGzip();
const writable = fs.createWriteStream('output.gz');

function cleanup(err) {
  // Destroy all streams
  readable.destroy();
  gzip.destroy();
  writable.destroy();

  if (err) {
    console.error('Pipeline failed:', err);
  } else {
    console.log('Pipeline succeeded');
  }
}

// Handle errors on each stream
readable.on('error', cleanup);
gzip.on('error', cleanup);
writable.on('error', cleanup);

// Handle success
writable.on('finish', () => cleanup(null));

// Build pipeline
readable.pipe(gzip).pipe(writable);
```

---

## Advanced: The pipeline() Function

Node.js provides `stream.pipeline()` for better error handling:

### Why pipeline() Is Better

```javascript
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Old way - must handle each error
const r = fs.createReadStream('input.txt');
const g = zlib.createGzip();
const w = fs.createWriteStream('output.gz');

r.on('error', cleanup);
g.on('error', cleanup);
w.on('error', cleanup);
w.on('finish', onSuccess);

r.pipe(g).pipe(w);

// New way - automatic error handling
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

### pipeline() Benefits

1. **Automatic error handling** - Catches errors from all streams
2. **Automatic cleanup** - Destroys streams on error
3. **Single callback** - One place to handle success/failure
4. **Proper propagation** - Errors bubble up correctly

### pipeline() Examples

```javascript
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Example 1: Compress file
pipeline(
  fs.createReadStream('input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('input.txt.gz'),
  err => {
    if (err) {
      console.error('Compression failed:', err);
    } else {
      console.log('Compression succeeded');
    }
  }
);

// Example 2: Decompress file
pipeline(
  fs.createReadStream('archive.gz'),
  zlib.createGunzip(),
  fs.createWriteStream('archive.txt'),
  err => {
    if (err) {
      console.error('Decompression failed:', err);
    } else {
      console.log('Decompression succeeded');
    }
  }
);

// Example 3: With custom transform
const { Transform } = require('stream');

class ToUpperCase extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}

pipeline(
  fs.createReadStream('input.txt'),
  new ToUpperCase(),
  fs.createWriteStream('output.txt'),
  err => {
    if (err) {
      console.error('Pipeline failed:', err);
    } else {
      console.log('Converted to uppercase');
    }
  }
);
```

### pipeline() with Promises

```javascript
const { pipeline } = require('stream/promises');
const fs = require('fs');
const zlib = require('zlib');

// Async/await version
async function compressFile(input, output) {
  try {
    await pipeline(
      fs.createReadStream(input),
      zlib.createGzip(),
      fs.createWriteStream(output)
    );
    console.log('Compression succeeded');
  } catch (err) {
    console.error('Compression failed:', err);
  }
}

// Usage
compressFile('input.txt', 'input.txt.gz');
```

---

## Common Patterns and Best Practices

### Pattern 1: Always Handle Errors

```javascript
// ❌ BAD: No error handling
source.pipe(destination);

// ✅ GOOD: Handle errors on all streams
source.on('error', handleError);
destination.on('error', handleError);
source.pipe(destination);

// ✅ BETTER: Use pipeline()
pipeline(source, destination, handleError);
```

### Pattern 2: Clean Up on Error

```javascript
function safePipe(source, destination, callback) {
  source.on('error', err => {
    source.destroy();
    destination.destroy();
    callback(err);
  });

  destination.on('error', err => {
    source.destroy();
    destination.destroy();
    callback(err);
  });

  destination.on('finish', () => {
    callback(null);
  });

  source.pipe(destination);
}
```

### Pattern 3: Use pipeline() for Complex Chains

```javascript
const { pipeline } = require('stream');

// Instead of manual chaining
const s1 = source.pipe(transform1);
const s2 = s1.pipe(transform2);
const s3 = s2.pipe(destination);

s1.on('error', handleError);
s2.on('error', handleError);
s3.on('error', handleError);

// Use pipeline()
pipeline(
  source,
  transform1,
  transform2,
  destination,
  handleError
);
```

### Pattern 4: Monitor Progress

```javascript
const fs = require('fs');
const { Transform } = require('stream');

class ProgressMonitor extends Transform {
  constructor(total) {
    super();
    this.total = total;
    this.current = 0;
  }

  _transform(chunk, encoding, callback) {
    this.current += chunk.length;
    const percent = ((this.current / this.total) * 100).toFixed(1);
    console.log(`Progress: ${percent}%`);
    this.push(chunk);
    callback();
  }
}

const fs = require('fs');
const stats = fs.statSync('large-file.dat');
const totalSize = stats.size;

fs.createReadStream('large-file.dat')
  .pipe(new ProgressMonitor(totalSize))
  .pipe(fs.createWriteStream('copy.dat'));
```

---

## Common Pitfalls

### Pitfall 1: Not Handling Errors

```javascript
// ❌ Process crashes on error
fs.createReadStream('nonexistent.txt')
  .pipe(fs.createWriteStream('output.txt'));

// ✅ Handles errors gracefully
const readable = fs.createReadStream('nonexistent.txt');
const writable = fs.createWriteStream('output.txt');

readable.on('error', err => console.error('Read error:', err));
writable.on('error', err => console.error('Write error:', err));

readable.pipe(writable);
```

### Pitfall 2: Assuming Error Propagation

```javascript
// ❌ Only catches destination errors
source
  .pipe(transform)
  .pipe(destination)
  .on('error', err => {
    console.error(err);  // Won't see source/transform errors!
  });

// ✅ Handle each stream
source.on('error', handleError);
transform.on('error', handleError);
destination.on('error', handleError);

source.pipe(transform).pipe(destination);
```

### Pitfall 3: Memory Leaks from Unclosed Streams

```javascript
// ❌ Streams might not close on error
source.pipe(destination);

source.on('error', err => {
  console.error(err);
  // Forgot to destroy streams!
});

// ✅ Clean up properly
source.on('error', err => {
  console.error(err);
  source.destroy();
  destination.destroy();
});
```

### Pitfall 4: Wrong pipe() Return Value Assumption

```javascript
// ❌ Wrong: Returns source
const result = source.pipe(destination);
result === source;  // false!

// ✅ Correct: Returns destination
const result = source.pipe(destination);
result === destination;  // true
```

---

## Summary

### Key Takeaways

1. **pipe() connects streams:** Automatically handles data flow
2. **Automatic backpressure:** Pauses/resumes as needed
3. **Returns destination:** Enables chaining
4. **Errors don't propagate:** Must handle each stream separately
5. **Use pipeline():** Better error handling than pipe()
6. **Always handle errors:** Prevent crashes and leaks
7. **Clean up on error:** Destroy all streams

### When to Use pipe()

**Use pipe() when:**
- Simple point-to-point streaming
- Building data pipelines
- Want automatic backpressure handling
- Code clarity is important

**Don't use pipe() when:**
- Need complex flow control
- Want to process data before passing
- Need to split stream to multiple destinations
- Fine-grained error handling required

### The Essential Patterns

```javascript
// Pattern 1: Simple pipe
source.pipe(destination);

// Pattern 2: Chained pipeline
source
  .pipe(transform1)
  .pipe(transform2)
  .pipe(destination);

// Pattern 3: With error handling
source.on('error', handleError);
destination.on('error', handleError);
source.pipe(destination);

// Pattern 4: Use pipeline() (recommended)
const { pipeline } = require('stream');

pipeline(
  source,
  transform1,
  transform2,
  destination,
  (err) => {
    if (err) console.error('Failed:', err);
    else console.log('Success!');
  }
);
```

### Quick Reference

```javascript
// Create and pipe
const readable = fs.createReadStream('input.txt');
const writable = fs.createWriteStream('output.txt');
readable.pipe(writable);

// Chain multiple
source
  .pipe(transform1)
  .pipe(transform2)
  .pipe(destination);

// Handle completion
writable.on('finish', () => console.log('Done'));

// Handle errors on all streams
readable.on('error', handleError);
writable.on('error', handleError);

// Or use pipeline()
pipeline(readable, writable, err => {
  if (err) console.error(err);
});
```

---

## Next Steps

Now that you understand piping, learn about:
- [Error Handling](./05-error-handling.md) - Robust error handling
- Transform Streams - Creating custom transforms
- Duplex Streams - Two-way communication

Ready to learn about handling errors? Continue to the [Error Handling Guide](./05-error-handling.md)!
