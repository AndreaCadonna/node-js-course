# Stream Concepts

This document explains the fundamental concepts behind Node.js streams. Understanding these concepts is essential for mastering stream-based programming.

---

## Table of Contents

1. [What Are Streams?](#what-are-streams)
2. [Why Streams Matter](#why-streams-matter)
3. [The Four Stream Types](#the-four-stream-types)
4. [How Streams Work Internally](#how-streams-work-internally)
5. [Backpressure Explained](#backpressure-explained)
6. [Stream Modes](#stream-modes)
7. [Events and the Stream Lifecycle](#events-and-the-stream-lifecycle)
8. [Piping and Stream Composition](#piping-and-stream-composition)
9. [Object Mode vs Binary Mode](#object-mode-vs-binary-mode)
10. [Error Handling in Streams](#error-handling-in-streams)
11. [Memory Management](#memory-management)
12. [Common Mental Models](#common-mental-models)

---

## What Are Streams?

### Definition

A **stream** is an abstract interface for working with streaming data in Node.js. Streams are collections of data that might not be available all at once and don't have to fit in memory.

### The Core Idea

Think of a stream like water flowing through a pipe:
- You don't need all the water at once
- You process it as it flows
- You can transform it along the way
- Multiple pipes can be connected

### Real-World Analogy

**Without Streams (Loading Everything at Once):**
```
Imagine downloading a movie and only being able to watch it
after the entire 10GB file downloads.
```

**With Streams (Processing Piece by Piece):**
```
Netflix/YouTube style - watch while it downloads.
You only need enough data to keep playing.
```

### Code Comparison

```javascript
// ❌ Without streams - loads entire file into memory
const fs = require('fs');
const data = fs.readFileSync('10gb-file.txt'); // Could crash with large files!
console.log(data.length);

// ✅ With streams - processes chunks one at a time
const stream = fs.createReadStream('10gb-file.txt');
let size = 0;
stream.on('data', chunk => {
  size += chunk.length; // Only holds one chunk at a time
});
stream.on('end', () => console.log(size));
```

---

## Why Streams Matter

### 1. Memory Efficiency

**Problem:** Reading a 10GB file with `fs.readFile()` requires 10GB of RAM.

**Solution:** Streams process data in small chunks (typically 64KB).

```javascript
// Memory usage: ~10GB
const data = fs.readFileSync('10gb-file.txt');

// Memory usage: ~64KB
const stream = fs.createReadStream('10gb-file.txt');
```

### 2. Time Efficiency

Streams start outputting data before all input is received:

```javascript
// Server with readFile - waits for complete file
app.get('/video', (req, res) => {
  fs.readFile('movie.mp4', (err, data) => {
    res.send(data); // User waits for entire file to load
  });
});

// Server with streams - starts immediately
app.get('/video', (req, res) => {
  fs.createReadStream('movie.mp4')
    .pipe(res); // User starts watching immediately
});
```

### 3. Composability

Streams can be combined like UNIX pipes:

```bash
# UNIX pipeline
cat file.txt | grep "error" | wc -l
```

```javascript
// Node.js stream pipeline
readFile('log.txt')
  .pipe(filterErrors())
  .pipe(countLines())
  .pipe(outputResult());
```

### 4. Real-World Impact

- **Netflix**: Streams video to millions without requiring 100GB per user
- **npm**: Streams package downloads while extracting
- **Databases**: Stream query results instead of loading all rows
- **Web Servers**: Stream responses to handle thousands of concurrent requests

---

## The Four Stream Types

Node.js has four fundamental stream types, each inheriting from EventEmitter.

### 1. Readable Streams

**Purpose:** Sources of data you can read from.

**Examples:**
- `fs.createReadStream()` - read files
- `http.IncomingMessage` - HTTP request body
- `process.stdin` - terminal input
- `crypto.createDecipheriv()` - decrypted data

**Key Methods:**
```javascript
const readable = fs.createReadStream('file.txt');

// Method 1: Event-based
readable.on('data', chunk => {
  console.log('Received:', chunk);
});

// Method 2: Manual read
readable.on('readable', () => {
  let chunk;
  while ((chunk = readable.read()) !== null) {
    console.log('Received:', chunk);
  }
});
```

### 2. Writable Streams

**Purpose:** Destinations you can write data to.

**Examples:**
- `fs.createWriteStream()` - write files
- `http.ServerResponse` - HTTP response
- `process.stdout` - terminal output
- `crypto.createCipheriv()` - encrypted data

**Key Methods:**
```javascript
const writable = fs.createWriteStream('output.txt');

const success = writable.write('Hello\n');
if (!success) {
  // Buffer is full - handle backpressure
  writable.once('drain', () => {
    // Buffer is empty - can write more
  });
}

writable.end('Final data'); // Write and close
```

### 3. Duplex Streams

**Purpose:** Both readable and writable (like a phone call - talk and listen).

**Examples:**
- `net.Socket` - TCP socket
- `crypto.createCipheriv()` - can read plaintext, write ciphertext
- `zlib.createGzip()` - can read raw data, write compressed data

**Usage:**
```javascript
const net = require('net');
const socket = net.connect(port, host);

// Can read from socket
socket.on('data', data => {
  console.log('Received:', data);
});

// Can write to socket
socket.write('Hello server!');
```

### 4. Transform Streams

**Purpose:** Duplex streams that modify data as it passes through.

**Examples:**
- `zlib.createGzip()` - compress data
- `crypto.createHash()` - hash data
- Custom transforms - uppercase, JSON parsing, etc.

**Creating Custom Transform:**
```javascript
const { Transform } = require('stream');

class UppercaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}

// Use it
input.pipe(new UppercaseTransform()).pipe(output);
```

---

## How Streams Work Internally

### The Internal Buffer

Every stream has an internal buffer:

```javascript
const readable = fs.createReadStream('file.txt', {
  highWaterMark: 64 * 1024 // 64KB buffer (default)
});
```

**How it works:**
1. Stream reads data from source into internal buffer
2. Buffer fills up to `highWaterMark`
3. Data is emitted to consumers
4. Buffer refills automatically

### Reading Mechanism

```
Source (File) → Internal Buffer → Your Code
              ↑                ↓
              └────────────────┘
           (automatic refill)
```

### Writing Mechanism

```
Your Code → Internal Buffer → Destination (File)
         ↓                 ↑
         └─────────────────┘
        (backpressure signal)
```

---

## Backpressure Explained

### What Is Backpressure?

**Backpressure** occurs when data arrives faster than it can be processed.

### The Problem

```javascript
// Slow writable (1MB/s)
const slow = fs.createWriteStream('output.txt');

// Fast readable (100MB/s)
const fast = fs.createReadStream('huge-file.txt');

// Without backpressure handling:
fast.on('data', chunk => {
  slow.write(chunk); // Keeps writing, buffer grows infinitely!
  // Result: Out of memory crash
});
```

### The Solution

```javascript
// Manual backpressure handling
fast.on('data', chunk => {
  const canContinue = slow.write(chunk);
  if (!canContinue) {
    // Buffer is full - pause reading
    fast.pause();
  }
});

slow.on('drain', () => {
  // Buffer is empty - resume reading
  fast.resume();
});

// Or use pipe() which handles this automatically!
fast.pipe(slow);
```

### How pipe() Handles Backpressure

```javascript
// pipe() automatically:
// 1. Monitors write() return value
// 2. Pauses source when destination is full
// 3. Resumes source when destination is ready
// 4. Propagates errors
// 5. Cleans up listeners

fast.pipe(slow);
```

### Visual Representation

```
Fast Source (100MB/s)
      ↓
  [Buffer 64KB]  ← Full? Pause source
      ↓
Slow Destination (1MB/s)
      ↓
  [Buffer 64KB]  ← Empty? Resume source
```

---

## Stream Modes

Readable streams have two modes that affect how data is consumed.

### Flowing Mode

Data is read automatically and provided via events:

```javascript
const stream = fs.createReadStream('file.txt');

// Enters flowing mode
stream.on('data', chunk => {
  console.log('Got chunk:', chunk.length);
});

// Data flows automatically until end
```

**Triggers for flowing mode:**
- Attaching a `data` event listener
- Calling `stream.resume()`
- Calling `stream.pipe()`

### Paused Mode

Data must be explicitly read:

```javascript
const stream = fs.createReadStream('file.txt');

// Stays in paused mode
stream.on('readable', () => {
  let chunk;
  while ((chunk = stream.read()) !== null) {
    console.log('Read chunk:', chunk.length);
  }
});

// Must call read() to get data
```

**Triggers for paused mode:**
- Calling `stream.pause()`
- Removing all `data` handlers
- Default state on creation

### Switching Between Modes

```javascript
const stream = fs.createReadStream('file.txt');

// Start in flowing mode
stream.on('data', chunk => {
  console.log('Received:', chunk.length);

  // Need to process slowly? Pause!
  stream.pause();

  setTimeout(() => {
    stream.resume(); // Resume after processing
  }, 1000);
});
```

---

## Events and the Stream Lifecycle

### Readable Stream Events

```javascript
const readable = fs.createReadStream('file.txt');

// 1. Stream opens
readable.on('open', () => {
  console.log('Stream opened');
});

// 2. Data is available
readable.on('readable', () => {
  console.log('Data ready to read');
});

// 3. Data chunk received (flowing mode)
readable.on('data', chunk => {
  console.log('Received chunk:', chunk.length);
});

// 4. All data consumed
readable.on('end', () => {
  console.log('No more data');
});

// 5. Stream closed
readable.on('close', () => {
  console.log('Stream closed');
});

// 6. Error occurred
readable.on('error', err => {
  console.error('Stream error:', err);
});
```

### Writable Stream Events

```javascript
const writable = fs.createWriteStream('output.txt');

// 1. Stream ready
writable.on('open', () => {
  console.log('Stream opened');
});

// 2. Buffer drained (can write more)
writable.on('drain', () => {
  console.log('Buffer empty, can write more');
});

// 3. Stream finished
writable.on('finish', () => {
  console.log('All writes complete');
});

// 4. Stream closed
writable.on('close', () => {
  console.log('Stream closed');
});

// 5. Error occurred
writable.on('error', err => {
  console.error('Stream error:', err);
});
```

### Event Sequence Example

```javascript
// Typical sequence for file copy
const readable = fs.createReadStream('input.txt');
const writable = fs.createWriteStream('output.txt');

// Events fire in this order:
// 1. readable 'open'
// 2. writable 'open'
// 3. readable 'data' (multiple times)
// 4. writable 'drain' (if backpressure occurred)
// 5. readable 'end'
// 6. writable 'finish'
// 7. readable 'close'
// 8. writable 'close'

readable.pipe(writable);
```

---

## Piping and Stream Composition

### Basic Piping

```javascript
source.pipe(destination);
```

**What pipe() does:**
1. Listens for `data` events on source
2. Writes data to destination
3. Handles backpressure automatically
4. Propagates errors
5. Cleans up on end

### Chaining Pipes

```javascript
const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');

// Read → Compress → Encrypt → Write
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(crypto.createCipher('aes192', 'password'))
  .pipe(fs.createWriteStream('output.txt.gz.enc'));
```

### Pipeline (Modern Approach)

```javascript
const { pipeline } = require('stream');

// Proper error handling with pipeline
pipeline(
  fs.createReadStream('input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('output.txt.gz'),
  (err) => {
    if (err) {
      console.error('Pipeline failed:', err);
    } else {
      console.log('Pipeline succeeded');
    }
  }
);
```

**Why pipeline() is better:**
- Single error handler for all streams
- Automatic cleanup on error
- Forwards errors properly
- Destroys all streams on failure

---

## Object Mode vs Binary Mode

### Binary Mode (Default)

Streams work with Buffers by default:

```javascript
const readable = fs.createReadStream('file.txt');

readable.on('data', chunk => {
  console.log(chunk); // <Buffer 48 65 6c 6c 6f>
  console.log(chunk.toString()); // "Hello"
});
```

### Object Mode

Streams can work with JavaScript objects:

```javascript
const { Transform } = require('stream');

const objectStream = new Transform({
  objectMode: true,
  transform(obj, encoding, callback) {
    // obj is a JavaScript object, not a Buffer
    console.log('Processing:', obj);
    this.push(obj);
    callback();
  }
});

// Can push any JavaScript value
objectStream.write({ name: 'Alice', age: 30 });
objectStream.write({ name: 'Bob', age: 25 });
```

### When to Use Object Mode

**Use object mode for:**
- JSON parsing/stringifying
- Database result rows
- Processing structured data
- Data transformations

**Use binary mode for:**
- File I/O
- Network protocols
- Compression/encryption
- Binary data processing

---

## Error Handling in Streams

### The Problem

Errors don't propagate automatically:

```javascript
// ❌ Error in source doesn't stop destination
source
  .pipe(transform)
  .pipe(destination);

source.emit('error', new Error('Source failed'));
// transform and destination keep running!
```

### Solution 1: Handle Each Stream

```javascript
source
  .on('error', err => console.error('Source error:', err))
  .pipe(transform)
  .on('error', err => console.error('Transform error:', err))
  .pipe(destination)
  .on('error', err => console.error('Destination error:', err));
```

### Solution 2: Use pipeline()

```javascript
const { pipeline } = require('stream');

pipeline(
  source,
  transform,
  destination,
  (err) => {
    if (err) {
      console.error('Pipeline failed:', err);
      // All streams are destroyed
    }
  }
);
```

### Solution 3: pump (from npm)

```javascript
const pump = require('pump');

pump(source, transform, destination, (err) => {
  if (err) {
    console.error('Pump failed:', err);
  }
});
```

---

## Memory Management

### Buffer Size Control

```javascript
// Small buffer - more CPU, less memory
const stream = fs.createReadStream('file.txt', {
  highWaterMark: 16 * 1024 // 16KB
});

// Large buffer - less CPU, more memory
const stream = fs.createReadStream('file.txt', {
  highWaterMark: 256 * 1024 // 256KB
});
```

### Memory Leaks to Avoid

**Leak 1: Not removing listeners**
```javascript
// ❌ Leak
function process(stream) {
  stream.on('data', chunk => {
    // Process chunk
  });
} // Listener never removed!

// ✅ Fixed
function process(stream) {
  const handler = chunk => {
    // Process chunk
  };
  stream.on('data', handler);
  stream.on('end', () => {
    stream.removeListener('data', handler);
  });
}
```

**Leak 2: Not handling backpressure**
```javascript
// ❌ Leak - buffers grow unbounded
fast.on('data', chunk => {
  slow.write(chunk); // Ignoring return value!
});

// ✅ Fixed - use pipe
fast.pipe(slow);
```

**Leak 3: Not destroying streams**
```javascript
// ❌ Leak - streams stay open
if (error) {
  return; // Streams still open!
}

// ✅ Fixed
if (error) {
  readable.destroy();
  writable.destroy();
  return;
}
```

---

## Common Mental Models

### Model 1: Water Pipes

```
Source (Faucet) → Pipe → Destination (Drain)

- Water flows at a rate
- Pipes have capacity
- Overflow possible if drain is slow
- Can add filters/transformers
```

### Model 2: Assembly Line

```
Raw Material → Station 1 → Station 2 → Station 3 → Final Product

- Each station processes one item at a time
- Items move through sequentially
- Slow station creates backlog
- Stations can transform items
```

### Model 3: Event-Driven Processing

```
Stream emits events → Your code reacts → Stream continues

- `data` event: Here's some data
- `end` event: No more data
- `error` event: Something failed
- `drain` event: Buffer empty, send more
```

---

## Summary

### Key Takeaways

1. **Streams are for efficiency** - process data without loading it all into memory
2. **Four types** - Readable, Writable, Duplex, Transform
3. **Backpressure matters** - handle it or face memory issues
4. **Two modes** - flowing and paused
5. **Events drive behavior** - data, end, error, drain
6. **Piping is powerful** - compose streams like UNIX pipes
7. **Error handling is crucial** - use pipeline() for safety
8. **Memory management** - control buffer sizes and clean up listeners

### When to Use Streams

**Use streams when:**
- Processing large files (>100MB)
- Working with real-time data
- Building data pipelines
- Memory efficiency matters
- You need composability

**Don't use streams when:**
- Data fits easily in memory (<10MB)
- You need random access to data
- Simple operations are sufficient
- Overhead isn't worth the complexity

---

## Next Steps

Now that you understand the concepts, proceed to:
1. [Level 1: Basics](./level-1-basics/README.md) - Start with practical examples
2. Practice with examples and exercises
3. Build your own streaming applications
4. Return to this document when you need conceptual clarity
