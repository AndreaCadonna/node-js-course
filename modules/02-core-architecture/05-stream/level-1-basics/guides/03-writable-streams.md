# Writable Streams

## Introduction

Writable streams are the counterpart to readable streams. While readable streams let you consume data from a source, writable streams let you send data to a destination. This guide will teach you how writable streams work internally, how to handle backpressure, and best practices for writing data efficiently.

By the end of this guide, you'll understand the write/drain pattern, know how to handle backpressure correctly, and be able to write data to streams safely and efficiently.

---

## What Are Writable Streams?

### Definition

A **Writable stream** is an abstraction for a destination to which data can be written. It allows you to write data piece by piece, and handles buffering internally to prevent overwhelming the destination.

**Common Examples:**
- `fs.createWriteStream()` - writing to files
- `http.ServerResponse` - HTTP responses
- `process.stdout` - console output
- `net.Socket` - network socket (writable side)

### Mental Model

Think of a writable stream like a **funnel with a bottle underneath**:

```
    ┌──────────────┐
    │ Your Code    │      ← You (pouring water)
    └──────┬───────┘
           │ write
           ↓
    ┌──────────────┐
    │ Internal     │      ← The funnel (internal buffer)
    │ Buffer       │
    │ [■■■■■□□□□] │      (drains automatically)
    └──────┬───────┘
           │ flush
           ↓
┌──────────────────────┐
│   Destination        │  ← The bottle (file, network, etc.)
│   (File/Network)     │
└──────────────────────┘
```

**How it works:**
1. You write data to the stream
2. Data accumulates in internal buffer
3. Buffer drains to destination
4. When buffer is full, you're told to wait
5. When buffer empties, you're told to continue

---

## Basic Usage

### Creating a Writable Stream

```javascript
const fs = require('fs');

// Create a writable stream
const stream = fs.createWriteStream('output.txt');

// Write data
stream.write('Hello, ');
stream.write('World!\n');

// Signal you're done writing
stream.end();

// Listen for completion
stream.on('finish', () => {
  console.log('All data written');
});
```

### The write() Method

The `write()` method has a specific signature and return value:

```javascript
const success = stream.write(chunk, encoding, callback);

// chunk: string or Buffer
// encoding: optional, e.g., 'utf8' (if chunk is string)
// callback: optional, called when chunk is flushed
// Returns: true if buffer has space, false if full
```

**Important:** The return value tells you whether to continue writing or wait.

---

## Understanding Backpressure

### What Is Backpressure?

**Backpressure** occurs when you write data faster than the destination can handle it. The internal buffer fills up, and you need to pause writing until it drains.

### Why It Matters

```javascript
// ❌ BAD: Ignoring backpressure
for (let i = 0; i < 1000000; i++) {
  stream.write(`Line ${i}\n`);
  // Writes millions of lines without checking
  // Memory usage skyrockets!
}

// ✅ GOOD: Respecting backpressure
function writeMany(stream, data, callback) {
  let i = 0;

  function write() {
    let ok = true;

    while (i < data.length && ok) {
      ok = stream.write(data[i]);
      i++;
    }

    if (i < data.length) {
      // Buffer full, wait for drain
      stream.once('drain', write);
    } else {
      // All done
      callback();
    }
  }

  write();
}
```

### The Write/Drain Pattern

This is the **most important pattern** for writable streams:

```javascript
const canContinue = stream.write(chunk);

if (!canContinue) {
  // Buffer is full
  console.log('Buffer full, waiting...');

  // Wait for 'drain' event
  stream.once('drain', () => {
    console.log('Buffer drained, continuing...');
    // Continue writing
  });
}
```

---

## The write() Method in Detail

### Return Value

```javascript
const ok = stream.write('some data');

// ok === true:  Buffer has space, safe to write more
// ok === false: Buffer is full, should wait for 'drain'
```

### Complete Signature

```javascript
// With all parameters
stream.write(
  chunk,      // Data to write (string or Buffer)
  encoding,   // Optional: 'utf8', 'ascii', etc.
  callback    // Optional: called when flushed
);

// Examples
stream.write('Hello');                           // Simple
stream.write('Hello', 'utf8');                   // With encoding
stream.write('Hello', 'utf8', () => {           // With callback
  console.log('Data flushed to destination');
});
stream.write(Buffer.from([1, 2, 3]));           // With Buffer
```

### The Callback Parameter

```javascript
stream.write('chunk 1', err => {
  if (err) {
    console.error('Failed to write chunk 1');
  } else {
    console.log('Chunk 1 flushed');
  }
});

stream.write('chunk 2', err => {
  if (err) {
    console.error('Failed to write chunk 2');
  } else {
    console.log('Chunk 2 flushed');
  }
});

// Callbacks fire in order as data is flushed
```

---

## The end() Method

### Purpose

The `end()` method signals that no more data will be written:

```javascript
stream.end();  // Signal completion
```

### Signatures

```javascript
// 1. Just signal end
stream.end();

// 2. Write final chunk and end
stream.end('Final data');

// 3. Write final chunk with encoding and end
stream.end('Final data', 'utf8');

// 4. Write final chunk and callback when done
stream.end('Final data', () => {
  console.log('Stream ended and flushed');
});

// 5. All parameters
stream.end('Final data', 'utf8', () => {
  console.log('Stream ended and flushed');
});
```

### Example

```javascript
const fs = require('fs');

const stream = fs.createWriteStream('output.txt');

stream.write('Line 1\n');
stream.write('Line 2\n');

// Write final line and close
stream.end('Line 3\n', () => {
  console.log('File written and closed');
});

// This is equivalent to:
// stream.write('Line 3\n');
// stream.end(() => {
//   console.log('File written and closed');
// });
```

---

## Important Events

### The 'drain' Event

Fired when the internal buffer has emptied and it's safe to write more:

```javascript
const ok = stream.write(data);

if (!ok) {
  // Buffer full, wait for drain
  stream.once('drain', () => {
    console.log('Ready for more data');
    // Continue writing
  });
}
```

### The 'finish' Event

Fired when `end()` has been called and all data has been flushed:

```javascript
stream.on('finish', () => {
  console.log('All data written and flushed');
  // Safe to close file, disconnect, etc.
});

stream.write('data 1');
stream.write('data 2');
stream.end('data 3');
// 'finish' fires after all 3 chunks are flushed
```

### The 'error' Event

Fired when a write operation fails:

```javascript
stream.on('error', err => {
  console.error('Write failed:', err.message);
  // Handle error (disk full, permission denied, etc.)
});

stream.write('some data');
```

### The 'close' Event

Fired when the underlying resource is closed:

```javascript
stream.on('close', () => {
  console.log('Stream closed');
  // File descriptor closed, socket disconnected, etc.
});
```

### The 'pipe' Event

Fired when a readable stream pipes into this writable:

```javascript
writable.on('pipe', src => {
  console.log('Something is piping into this writable');
  console.log('Source:', src);
});

readable.pipe(writable);
// 'pipe' event fires
```

### The 'unpipe' Event

Fired when a readable stream unpipes from this writable:

```javascript
writable.on('unpipe', src => {
  console.log('Something stopped piping to this writable');
});

readable.unpipe(writable);
// 'unpipe' event fires
```

---

## Practical Examples

### Example 1: Writing a Large File Safely

```javascript
const fs = require('fs');

function writeMillionLines(filename, callback) {
  const stream = fs.createWriteStream(filename);

  let i = 0;
  const max = 1000000;

  function write() {
    let ok = true;

    // Write as much as we can
    while (i < max && ok) {
      ok = stream.write(`Line ${i}\n`);
      i++;

      if (i % 100000 === 0) {
        console.log(`Written ${i} lines...`);
      }
    }

    if (i < max) {
      // Buffer full, wait for drain
      stream.once('drain', write);
    } else {
      // All done, close stream
      stream.end(() => {
        console.log('Complete!');
        callback();
      });
    }
  }

  // Start writing
  write();
}

// Usage
writeMillionLines('million-lines.txt', () => {
  console.log('File written successfully');
});
```

### Example 2: Writing with Error Handling

```javascript
const fs = require('fs');

function safeWrite(filename, data, callback) {
  const stream = fs.createWriteStream(filename);

  // Handle errors
  stream.on('error', err => {
    console.error('Write error:', err.message);
    callback(err);
  });

  // Handle completion
  stream.on('finish', () => {
    console.log('Write complete');
    callback(null);
  });

  // Write data
  data.forEach(chunk => {
    stream.write(chunk);
  });

  // Close stream
  stream.end();
}

// Usage
safeWrite('output.txt', ['Line 1\n', 'Line 2\n', 'Line 3\n'], err => {
  if (err) {
    console.error('Failed:', err);
  } else {
    console.log('Success!');
  }
});
```

### Example 3: Manual Backpressure Handling

```javascript
const fs = require('fs');

const readable = fs.createReadStream('source.txt');
const writable = fs.createWriteStream('dest.txt');

readable.on('data', chunk => {
  const ok = writable.write(chunk);

  if (!ok) {
    // Destination buffer full
    console.log('Backpressure detected, pausing read');
    readable.pause();
  }
});

writable.on('drain', () => {
  // Destination buffer emptied
  console.log('Drain complete, resuming read');
  readable.resume();
});

readable.on('end', () => {
  writable.end();
});

readable.on('error', err => {
  console.error('Read error:', err);
  writable.destroy();
});

writable.on('error', err => {
  console.error('Write error:', err);
  readable.destroy();
});
```

### Example 4: Writing JSON Lines

```javascript
const fs = require('fs');

function writeJSONLines(filename, objects, callback) {
  const stream = fs.createWriteStream(filename);

  let i = 0;

  function write() {
    let ok = true;

    while (i < objects.length && ok) {
      const json = JSON.stringify(objects[i]) + '\n';
      ok = stream.write(json);
      i++;
    }

    if (i < objects.length) {
      stream.once('drain', write);
    } else {
      stream.end(callback);
    }
  }

  stream.on('error', callback);
  write();
}

// Usage
const data = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
];

writeJSONLines('data.jsonl', data, err => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('JSON lines written');
  }
});
```

---

## Creating Writable Streams

### Using fs.createWriteStream()

```javascript
const fs = require('fs');

// Basic usage
const stream = fs.createWriteStream('output.txt');

// With options
const streamWithOptions = fs.createWriteStream('output.txt', {
  encoding: 'utf8',      // Default encoding for strings
  flags: 'w',            // Write mode ('w', 'a', 'r+', etc.)
  mode: 0o666,           // File permissions
  highWaterMark: 16384   // Buffer size (16KB)
});
```

### Common Options

```javascript
const options = {
  // Flags for fs.open()
  // 'w': write (truncate), 'a': append, 'wx': exclusive write
  flags: 'w',

  // Default string encoding
  encoding: 'utf8',

  // File mode (permissions)
  mode: 0o666,

  // Internal buffer size
  // Larger = fewer writes, more memory
  highWaterMark: 64 * 1024,  // 64KB default

  // File descriptor (if already open)
  fd: null,

  // Auto-close fd when done
  autoClose: true,

  // Start writing at this position
  start: 0
};

const stream = fs.createWriteStream('file.txt', options);
```

### Flag Values

```javascript
// Common flag values
'w'   // Write (truncate file if exists)
'a'   // Append (write to end of file)
'wx'  // Exclusive write (fails if file exists)
'w+'  // Read and write (truncate)
'a+'  // Read and append
'r+'  // Read and write (file must exist)

// Example: Append mode
const appendStream = fs.createWriteStream('log.txt', {
  flags: 'a'  // Append instead of truncate
});

appendStream.write('New log entry\n');
appendStream.end();
```

---

## Understanding highWaterMark

### What It Controls

The `highWaterMark` option sets the internal buffer size:

```javascript
// Small buffer (8KB)
const smallBuffer = fs.createWriteStream('file.txt', {
  highWaterMark: 8 * 1024
});

// Large buffer (1MB)
const largeBuffer = fs.createWriteStream('file.txt', {
  highWaterMark: 1024 * 1024
});
```

### How It Affects Behavior

```javascript
const stream = fs.createWriteStream('test.txt', {
  highWaterMark: 100  // Very small buffer
});

// Write 1: Returns true (buffer has space)
const ok1 = stream.write('x'.repeat(50));
console.log('Write 1:', ok1);  // true (50 < 100)

// Write 2: Returns false (buffer full)
const ok2 = stream.write('x'.repeat(60));
console.log('Write 2:', ok2);  // false (50+60 > 100)

// Wait for drain
stream.on('drain', () => {
  console.log('Buffer drained, can write more');
});
```

### Choosing the Right Size

```javascript
// For frequent small writes: smaller buffer
const logStream = fs.createWriteStream('app.log', {
  highWaterMark: 8 * 1024  // 8KB
});

// For infrequent large writes: larger buffer
const dataStream = fs.createWriteStream('data.bin', {
  highWaterMark: 256 * 1024  // 256KB
});

// Default (64KB) is good for most cases
const defaultStream = fs.createWriteStream('file.txt');
```

---

## Common Patterns and Best Practices

### Pattern 1: Always Handle Errors

```javascript
// ❌ BAD: No error handler
const stream = fs.createWriteStream('output.txt');
stream.write('data');
stream.end();

// ✅ GOOD: Error handler present
const stream = fs.createWriteStream('output.txt');

stream.on('error', err => {
  console.error('Write failed:', err.message);
  // Handle error (disk full, permissions, etc.)
});

stream.write('data');
stream.end();
```

### Pattern 2: Respect Backpressure

```javascript
// ❌ BAD: Ignoring write() return value
for (let i = 0; i < 1000000; i++) {
  stream.write(`Line ${i}\n`);
  // Memory will grow unbounded!
}

// ✅ GOOD: Checking and waiting
function writeLoop(stream, max, i = 0) {
  let ok = true;

  while (i < max && ok) {
    ok = stream.write(`Line ${i}\n`);
    i++;
  }

  if (i < max) {
    stream.once('drain', () => writeLoop(stream, max, i));
  } else {
    stream.end();
  }
}

writeLoop(stream, 1000000);
```

### Pattern 3: Wait for 'finish' Before Cleanup

```javascript
// ❌ BAD: Not waiting for finish
stream.write('data');
stream.end();
console.log('Done!');  // Wrong! Data might not be flushed yet

// ✅ GOOD: Wait for finish
stream.write('data');
stream.end();

stream.on('finish', () => {
  console.log('Done!');  // Correct! All data flushed
});
```

### Pattern 4: Use end() Callback

```javascript
// Convenient shorthand
stream.write('chunk 1');
stream.write('chunk 2');

stream.end('final chunk', () => {
  console.log('All done!');
});

// Equivalent to:
stream.write('chunk 1');
stream.write('chunk 2');
stream.write('final chunk');
stream.on('finish', () => {
  console.log('All done!');
});
stream.end();
```

---

## Performance Considerations

### Batching Writes

```javascript
// ❌ Less efficient: Many small writes
for (let i = 0; i < 1000; i++) {
  stream.write(`${i}\n`);  // 1000 writes
}

// ✅ More efficient: Batch into larger chunks
const batchSize = 100;
let batch = '';

for (let i = 0; i < 1000; i++) {
  batch += `${i}\n`;

  if (i % batchSize === 0) {
    stream.write(batch);  // 10 writes
    batch = '';
  }
}

if (batch) {
  stream.write(batch);  // Final partial batch
}
```

### Buffer Size Impact

```javascript
// Smaller buffer = more frequent flushes
const small = fs.createWriteStream('test.txt', {
  highWaterMark: 1024  // 1KB
});
// More drain events, less memory, more overhead

// Larger buffer = less frequent flushes
const large = fs.createWriteStream('test.txt', {
  highWaterMark: 1024 * 1024  // 1MB
});
// Fewer drain events, more memory, less overhead
```

---

## Common Pitfalls

### Pitfall 1: Not Calling end()

```javascript
// ❌ Stream never closes
const stream = fs.createWriteStream('output.txt');
stream.write('data');
// Forgot to call stream.end()
// File stays open, 'finish' never fires

// ✅ Always call end()
const stream = fs.createWriteStream('output.txt');
stream.write('data');
stream.end();  // Properly close stream
```

### Pitfall 2: Writing After end()

```javascript
// ❌ Error: write after end
const stream = fs.createWriteStream('output.txt');
stream.write('data 1');
stream.end();
stream.write('data 2');  // Error!

// ✅ Write before end
const stream = fs.createWriteStream('output.txt');
stream.write('data 1');
stream.write('data 2');
stream.end();  // End last
```

### Pitfall 3: Ignoring Backpressure

```javascript
// ❌ Memory leak!
const stream = fs.createWriteStream('output.txt');

for (let i = 0; i < 10000000; i++) {
  stream.write('x'.repeat(1000));
  // Ignoring return value
  // Buffer grows unbounded
}

// ✅ Handle backpressure
function write(stream, data) {
  return new Promise((resolve, reject) => {
    if (!stream.write(data)) {
      stream.once('drain', resolve);
    } else {
      resolve();
    }
  });
}
```

### Pitfall 4: Not Handling Errors

```javascript
// ❌ Process crashes on error
const stream = fs.createWriteStream('/readonly/path/file.txt');
stream.write('data');  // Crashes with EACCES

// ✅ Handle error gracefully
const stream = fs.createWriteStream('/readonly/path/file.txt');

stream.on('error', err => {
  console.error('Cannot write:', err.message);
  // Handle gracefully
});

stream.write('data');
```

---

## Advanced: Promises and Async/Await

### Promisifying Stream Writes

```javascript
function writeAsync(stream, chunk) {
  return new Promise((resolve, reject) => {
    const ok = stream.write(chunk, err => {
      if (err) reject(err);
    });

    if (ok) {
      resolve();
    } else {
      stream.once('drain', resolve);
      stream.once('error', reject);
    }
  });
}

// Usage with async/await
async function writeMany(stream, chunks) {
  for (const chunk of chunks) {
    await writeAsync(stream, chunk);
  }

  return new Promise((resolve, reject) => {
    stream.end(err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Example
(async () => {
  const stream = fs.createWriteStream('output.txt');

  try {
    await writeMany(stream, ['Line 1\n', 'Line 2\n', 'Line 3\n']);
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  }
})();
```

---

## Summary

### Key Takeaways

1. **write() returns boolean:** `true` = continue, `false` = wait for drain
2. **Always handle 'drain' event:** Critical for backpressure handling
3. **Call end() when done:** Signals no more data, triggers 'finish'
4. **Listen for 'finish' event:** Fired when all data flushed
5. **Handle 'error' event:** Prevent crashes, handle disk full, permissions, etc.
6. **Respect backpressure:** Prevents memory leaks and crashes
7. **highWaterMark:** Controls buffer size and when drain fires

### The Essential Pattern

```javascript
function writeWithBackpressure(stream, data) {
  let i = 0;

  function write() {
    let ok = true;

    while (i < data.length && ok) {
      ok = stream.write(data[i]);
      i++;
    }

    if (i < data.length) {
      stream.once('drain', write);
    } else {
      stream.end();
    }
  }

  write();
}
```

### Quick Reference

```javascript
// Create stream
const stream = fs.createWriteStream('file.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024
});

// Write data
const ok = stream.write('data');
if (!ok) {
  stream.once('drain', () => {
    // Continue writing
  });
}

// Finish writing
stream.end('final data', () => {
  console.log('All done!');
});

// Handle events
stream.on('error', err => console.error(err));
stream.on('finish', () => console.log('Flushed'));
stream.on('close', () => console.log('Closed'));
```

---

## Next Steps

Now that you understand writable streams, learn about:
- [Piping Streams](./04-piping-streams.md) - Connecting readable to writable
- [Error Handling](./05-error-handling.md) - Robust error handling
- Transform Streams - Modifying data in transit

Ready to learn about connecting streams? Continue to the [Piping Streams Guide](./04-piping-streams.md)!
