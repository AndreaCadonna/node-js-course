# Readable Streams

## Introduction

Readable streams are one of the four fundamental stream types in Node.js. They represent a source of data that you can read from incrementally. This guide will teach you how readable streams work internally, how to create and use them, and best practices for working with them effectively.

By the end of this guide, you'll understand the two modes of readable streams, know when to use each mode, and be able to handle readable streams confidently in your applications.

---

## What Are Readable Streams?

### Definition

A **Readable stream** is an abstraction for a source from which data can be consumed. It allows you to read data piece by piece, rather than loading everything into memory at once.

**Common Examples:**
- `fs.createReadStream()` - reading files
- `http.IncomingMessage` - HTTP request bodies
- `process.stdin` - standard input from terminal
- `net.Socket` - network socket (readable side)

### Mental Model

Think of a readable stream like a **water tap with a bucket underneath**:

```
┌──────────────────────┐
│   Data Source        │  ← The tap (file, network, etc.)
│   (File/Network)     │
└──────────┬───────────┘
           │ flows
           ↓
    ┌──────────────┐
    │ Internal     │      ← The bucket (internal buffer)
    │ Buffer       │
    │ [■■■■■□□□□] │      (fills automatically)
    └──────┬───────┘
           │ read
           ↓
    ┌──────────────┐
    │ Your Code    │      ← You (consuming the water)
    └──────────────┘
```

**How it works:**
1. Source produces data
2. Data accumulates in internal buffer
3. You consume data from buffer
4. Buffer refills automatically

---

## The Two Modes of Readable Streams

Readable streams operate in one of two modes: **flowing mode** or **paused mode**. Understanding these modes is crucial to using readable streams correctly.

### Paused Mode (Pull-Based)

In paused mode, **you explicitly request data** from the stream.

**Characteristics:**
- Stream starts in this mode by default
- Data doesn't flow automatically
- You call `stream.read()` to get data
- You control the pace

**When to use:**
- Need fine control over reading pace
- Processing is CPU-intensive
- Need to pause and resume based on logic

```javascript
const fs = require('fs');

const stream = fs.createReadStream('file.txt');

// Paused mode - wait for 'readable' event
stream.on('readable', () => {
  let chunk;

  // Explicitly pull data
  while ((chunk = stream.read()) !== null) {
    console.log('Read chunk:', chunk.length, 'bytes');
    // Process chunk
  }
});

stream.on('end', () => {
  console.log('Done reading');
});
```

### Flowing Mode (Push-Based)

In flowing mode, **data flows automatically** to your handlers.

**Characteristics:**
- Data flows as fast as possible
- Streams automatically push data to you
- Data events fire continuously
- Less control, simpler code

**When to use:**
- Simple data consumption
- Real-time processing
- Piping to another stream

```javascript
const fs = require('fs');

const stream = fs.createReadStream('file.txt');

// Flowing mode - data pushed automatically
stream.on('data', chunk => {
  console.log('Got chunk:', chunk.length, 'bytes');
  // Process chunk immediately
});

stream.on('end', () => {
  console.log('Done reading');
});
```

---

## Switching Between Modes

### How Modes Are Activated

**Switch to Flowing Mode:**
1. Add a `'data'` event handler
2. Call `stream.resume()`
3. Call `stream.pipe(destination)`

**Switch to Paused Mode:**
1. Call `stream.pause()` (if no pipe destinations)
2. Remove all `'data'` handlers and add `'readable'` handler

### Example: Manual Control

```javascript
const fs = require('fs');

const stream = fs.createReadStream('file.txt');

// Start in flowing mode
stream.on('data', chunk => {
  console.log('Chunk:', chunk.length);

  // Pause after each chunk
  stream.pause();

  // Resume after 1 second (simulating slow processing)
  setTimeout(() => {
    console.log('Resuming...');
    stream.resume();
  }, 1000);
});

stream.on('end', () => {
  console.log('Done');
});
```

---

## The 'readable' Event (Paused Mode)

### How It Works

The `'readable'` event fires when there's data available to read from the stream.

**Important Points:**
- Fires when new data is available
- May fire when stream ends (read() returns null)
- Must use `stream.read()` to consume data
- Keep calling `read()` until it returns null

### Pattern: Reading All Available Data

```javascript
const fs = require('fs');

const stream = fs.createReadStream('data.txt');

stream.on('readable', () => {
  console.log('Readable event fired');

  let chunk;
  // Read all available data
  while ((chunk = stream.read()) !== null) {
    console.log('Read', chunk.length, 'bytes');
    // Process chunk
  }
});

stream.on('end', () => {
  console.log('No more data');
});
```

### Reading Specific Amounts

You can specify how many bytes to read:

```javascript
stream.on('readable', () => {
  // Read exactly 10 bytes
  const chunk = stream.read(10);

  if (chunk !== null) {
    console.log('Read 10 bytes:', chunk);
  }
});
```

---

## The 'data' Event (Flowing Mode)

### How It Works

The `'data'` event fires whenever a chunk of data is available and ready to be consumed.

**Important Points:**
- Fires automatically as data flows
- Chunk size determined by highWaterMark (default 64KB)
- Data flows as fast as source provides it
- Simpler but less control than readable event

### Pattern: Simple Consumption

```javascript
const fs = require('fs');

const stream = fs.createReadStream('file.txt');

let totalBytes = 0;

stream.on('data', chunk => {
  totalBytes += chunk.length;
  console.log('Received chunk:', chunk.length, 'bytes');
  console.log('Total so far:', totalBytes, 'bytes');
});

stream.on('end', () => {
  console.log('Final total:', totalBytes, 'bytes');
});
```

### Pattern: Line-by-Line Processing

```javascript
const fs = require('fs');

const stream = fs.createReadStream('log.txt', { encoding: 'utf8' });

let buffer = '';

stream.on('data', chunk => {
  buffer += chunk;

  // Split on newlines
  const lines = buffer.split('\n');

  // Keep last incomplete line in buffer
  buffer = lines.pop();

  // Process complete lines
  lines.forEach(line => {
    console.log('Line:', line);
  });
});

stream.on('end', () => {
  // Process remaining buffer
  if (buffer) {
    console.log('Last line:', buffer);
  }
});
```

---

## Creating Readable Streams

### Using fs.createReadStream()

The most common way to create a readable stream:

```javascript
const fs = require('fs');

// Basic usage
const stream = fs.createReadStream('input.txt');

// With options
const streamWithOptions = fs.createReadStream('input.txt', {
  encoding: 'utf8',      // Convert buffers to strings
  highWaterMark: 16384,  // Buffer size (16KB instead of default 64KB)
  start: 0,              // Start reading at byte 0
  end: 999               // Stop at byte 999 (read first 1000 bytes)
});
```

### Common Options

```javascript
const options = {
  // Character encoding ('utf8', 'ascii', 'base64', etc.)
  // Leave undefined to get Buffers
  encoding: 'utf8',

  // Internal buffer size (affects chunk size)
  // Default: 64KB (65536 bytes)
  highWaterMark: 64 * 1024,

  // Start reading at this byte position
  start: 0,

  // Stop reading at this byte position
  end: Infinity,

  // File descriptor (if already open)
  fd: null,

  // Auto-close file descriptor when done
  autoClose: true
};

const stream = fs.createReadStream('file.txt', options);
```

---

## Practical Examples

### Example 1: Reading a Large File

```javascript
const fs = require('fs');

// Read a 1GB file efficiently
const stream = fs.createReadStream('large-file.dat');

let chunks = 0;
let bytes = 0;

stream.on('data', chunk => {
  chunks++;
  bytes += chunk.length;

  // Process chunk
  console.log(`Chunk ${chunks}: ${chunk.length} bytes`);
});

stream.on('end', () => {
  console.log(`\nTotal: ${chunks} chunks, ${bytes} bytes`);
  console.log(`Memory used: ~64KB (vs ${bytes} if loaded all at once)`);
});

stream.on('error', err => {
  console.error('Error reading file:', err.message);
});
```

### Example 2: Counting Lines in a File

```javascript
const fs = require('fs');

function countLines(filename, callback) {
  const stream = fs.createReadStream(filename, { encoding: 'utf8' });

  let lineCount = 0;
  let buffer = '';

  stream.on('data', chunk => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line
    lineCount += lines.length;
  });

  stream.on('end', () => {
    if (buffer) lineCount++; // Count last line if exists
    callback(null, lineCount);
  });

  stream.on('error', callback);
}

// Usage
countLines('large-log.txt', (err, count) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Lines:', count);
  }
});
```

### Example 3: Reading File in Chunks with Paused Mode

```javascript
const fs = require('fs');

const stream = fs.createReadStream('data.bin');

stream.on('readable', () => {
  let chunk;

  // Read in 1KB chunks
  while ((chunk = stream.read(1024)) !== null) {
    console.log('Processing', chunk.length, 'bytes');

    // Simulate intensive processing
    processData(chunk);
  }
});

stream.on('end', () => {
  console.log('Processing complete');
});

function processData(chunk) {
  // Heavy processing here
  // In paused mode, you control when to read next chunk
}
```

### Example 4: Reading with Backpressure Control

```javascript
const fs = require('fs');

const readable = fs.createReadStream('source.txt');
const writable = fs.createWriteStream('dest.txt');

readable.on('data', chunk => {
  // Write returns false if buffer is full
  const canContinue = writable.write(chunk);

  if (!canContinue) {
    console.log('Destination buffer full, pausing read...');
    readable.pause();
  }
});

// Resume when destination is ready
writable.on('drain', () => {
  console.log('Destination ready, resuming read...');
  readable.resume();
});

readable.on('end', () => {
  writable.end();
});
```

---

## Understanding the Internal Buffer

### How the Buffer Works

Every readable stream has an internal buffer that stores data:

```javascript
const stream = fs.createReadStream('file.txt', {
  highWaterMark: 64 * 1024  // 64KB buffer
});

// Internal state (conceptual):
// {
//   buffer: <Buffer>,      // Holds the data
//   length: 0,             // Current buffer size
//   highWaterMark: 65536   // Max buffer size (64KB)
// }
```

### The highWaterMark Concept

**highWaterMark** determines:
- Internal buffer size
- When to pause reading from source
- Typical chunk size in flowing mode

```javascript
// Small buffer = more chunks, less memory
const smallBuffer = fs.createReadStream('file.txt', {
  highWaterMark: 1024  // 1KB chunks
});

// Large buffer = fewer chunks, more memory
const largeBuffer = fs.createReadStream('file.txt', {
  highWaterMark: 1024 * 1024  // 1MB chunks
});
```

**Trade-offs:**
- **Smaller buffer:** Less memory, more events, more overhead
- **Larger buffer:** More memory, fewer events, less overhead

**Default (64KB) is usually optimal** for most use cases.

---

## Important Events

### Complete Event Reference

```javascript
const stream = fs.createReadStream('file.txt');

// Data is available (flowing mode)
stream.on('data', chunk => {
  console.log('Received:', chunk.length, 'bytes');
});

// Data is available (paused mode)
stream.on('readable', () => {
  let chunk;
  while ((chunk = stream.read()) !== null) {
    console.log('Read:', chunk.length, 'bytes');
  }
});

// Stream has ended (no more data)
stream.on('end', () => {
  console.log('No more data to read');
});

// Stream is closing (file descriptor closing)
stream.on('close', () => {
  console.log('Stream closed');
});

// An error occurred
stream.on('error', err => {
  console.error('Error:', err.message);
});

// Stream has been paused
stream.on('pause', () => {
  console.log('Stream paused');
});

// Stream has been resumed
stream.on('resume', () => {
  console.log('Stream resumed');
});
```

### Event Order

Normal flow:
```
1. readable/data (multiple times)
2. end
3. close
```

With error:
```
1. readable/data (maybe)
2. error
3. close
```

---

## Common Patterns and Best Practices

### Pattern 1: Always Handle Errors

```javascript
const stream = fs.createReadStream('file.txt');

// ❌ BAD: No error handler
stream.on('data', chunk => {
  process(chunk);
});

// ✅ GOOD: Error handler present
stream.on('data', chunk => {
  process(chunk);
});

stream.on('error', err => {
  console.error('Failed to read:', err.message);
  // Handle error appropriately
});
```

### Pattern 2: Don't Mix Modes

```javascript
// ❌ BAD: Mixing readable and data events
stream.on('readable', () => {
  // ...
});
stream.on('data', chunk => {
  // ...
});

// ✅ GOOD: Use one mode consistently
// Option 1: Flowing mode
stream.on('data', chunk => {
  // ...
});

// Option 2: Paused mode
stream.on('readable', () => {
  let chunk;
  while ((chunk = stream.read()) !== null) {
    // ...
  }
});
```

### Pattern 3: Clean Up Resources

```javascript
const stream = fs.createReadStream('file.txt');

// Ensure cleanup happens
function cleanup() {
  stream.destroy();
  console.log('Cleaned up');
}

stream.on('end', cleanup);
stream.on('error', err => {
  console.error('Error:', err);
  cleanup();
});

// Handle process termination
process.on('SIGINT', cleanup);
```

### Pattern 4: Use Encoding for Text Files

```javascript
// ❌ Less efficient for text
const stream = fs.createReadStream('text.txt');
stream.on('data', buffer => {
  const text = buffer.toString('utf8');
  // ...
});

// ✅ More efficient
const stream = fs.createReadStream('text.txt', { encoding: 'utf8' });
stream.on('data', text => {
  // Already a string
  // ...
});
```

---

## Performance Considerations

### Choosing the Right Buffer Size

```javascript
// For small files (< 1MB): smaller buffer
const smallFile = fs.createReadStream('config.json', {
  highWaterMark: 16 * 1024  // 16KB
});

// For large files (> 100MB): larger buffer
const largeFile = fs.createReadStream('huge-data.bin', {
  highWaterMark: 256 * 1024  // 256KB
});

// For network streams: smaller buffer (faster response)
const networkStream = request('http://example.com/data', {
  highWaterMark: 8 * 1024  // 8KB
});

// Default 64KB is good for most cases
const defaultStream = fs.createReadStream('file.txt');
```

### Memory Usage

```javascript
// Monitor memory usage
const stream = fs.createReadStream('large-file.dat');

let chunks = 0;

stream.on('data', chunk => {
  chunks++;

  if (chunks % 100 === 0) {
    const memUsage = process.memoryUsage();
    console.log(`Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  }
});
```

---

## Common Pitfalls

### Pitfall 1: Forgetting to Handle Errors

```javascript
// ❌ Will crash process on error
const stream = fs.createReadStream('nonexistent.txt');
stream.on('data', chunk => {
  console.log(chunk);
});

// ✅ Handles error gracefully
const stream = fs.createReadStream('nonexistent.txt');
stream.on('data', chunk => {
  console.log(chunk);
});
stream.on('error', err => {
  console.error('Error:', err.message);
});
```

### Pitfall 2: Not Consuming readable Stream

```javascript
// ❌ Stream pauses, stops reading
stream.on('readable', () => {
  console.log('Data available');
  // But not calling stream.read()!
});

// ✅ Actually consume the data
stream.on('readable', () => {
  let chunk;
  while ((chunk = stream.read()) !== null) {
    // Process chunk
  }
});
```

### Pitfall 3: Assuming Chunks Are Complete Units

```javascript
// ❌ Chunk might split in middle of line
stream.on('data', chunk => {
  const lines = chunk.toString().split('\n');
  lines.forEach(processLine);  // Last line might be incomplete!
});

// ✅ Buffer incomplete data
let buffer = '';
stream.on('data', chunk => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();  // Save incomplete line
  lines.forEach(processLine);
});
```

---

## Summary

### Key Takeaways

1. **Two modes:** Flowing (push) and Paused (pull)
2. **Flowing mode:** Simple, automatic, use 'data' event
3. **Paused mode:** More control, use 'readable' event and read()
4. **Always handle errors:** Prevent crashes
5. **Don't mix modes:** Use one approach consistently
6. **highWaterMark:** Controls buffer size and chunk size
7. **Chunks aren't semantic:** May split in middle of line/record

### When to Use Each Mode

**Use Flowing Mode when:**
- Simple data consumption
- Piping to another stream
- Real-time processing
- Don't need fine-grained control

**Use Paused Mode when:**
- Need to control reading pace
- CPU-intensive processing
- Need to coordinate with other streams
- Reading specific byte amounts

### Quick Reference

```javascript
// Flowing mode (automatic)
stream.on('data', chunk => {
  // Process chunk
});

// Paused mode (manual)
stream.on('readable', () => {
  let chunk;
  while ((chunk = stream.read()) !== null) {
    // Process chunk
  }
});

// Control flow
stream.pause();   // Pause flowing mode
stream.resume();  // Resume flowing mode

// Always handle errors
stream.on('error', err => {
  console.error('Error:', err);
});

// Create with options
const stream = fs.createReadStream('file.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024
});
```

---

## Next Steps

Now that you understand readable streams, learn about:
- [Writable Streams](./03-writable-streams.md) - Writing data
- [Piping Streams](./04-piping-streams.md) - Connecting streams
- [Error Handling](./05-error-handling.md) - Robust error handling

Ready to learn about writing data? Continue to the [Writable Streams Guide](./03-writable-streams.md)!
