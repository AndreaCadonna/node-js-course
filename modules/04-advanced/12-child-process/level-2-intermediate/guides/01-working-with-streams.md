# Working with Streams

Learn how to effectively work with process streams for input, output, and error handling.

## Table of Contents
- [Introduction](#introduction)
- [Understanding Process Streams](#understanding-process-streams)
- [Reading from Process Streams](#reading-from-process-streams)
- [Writing to Process Streams](#writing-to-process-streams)
- [Piping Between Processes](#piping-between-processes)
- [Stream Transformation](#stream-transformation)
- [Backpressure Management](#backpressure-management)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Introduction

Every child process in Node.js has three standard streams:
- **stdin**: Standard input (writable stream)
- **stdout**: Standard output (readable stream)
- **stderr**: Standard error (readable stream)

Understanding how to work with these streams is crucial for effective process communication.

---

## Understanding Process Streams

### Stream Types

When you spawn a child process, you get access to its streams:

```javascript
const { spawn } = require('child_process');

const child = spawn('command');

// child.stdin  - Writable stream (send data TO process)
// child.stdout - Readable stream (receive data FROM process)
// child.stderr - Readable stream (receive errors FROM process)
```

### Stream Flow

```
Parent Process                    Child Process
--------------                    -------------
     |                                 |
     |---> child.stdin (write) ------> stdin
     |                                 |
     |<--- child.stdout (read) <------ stdout
     |                                 |
     |<--- child.stderr (read) <------ stderr
     |                                 |
```

---

## Reading from Process Streams

### Reading stdout

```javascript
const child = spawn('ls', ['-lh']);

// Method 1: data event
child.stdout.on('data', (data) => {
  console.log(`Output: ${data}`);
});

// Method 2: readable event
child.stdout.on('readable', () => {
  let chunk;
  while ((chunk = child.stdout.read()) !== null) {
    console.log(`Chunk: ${chunk}`);
  }
});

// Method 3: piping to destination
child.stdout.pipe(process.stdout);
```

### Reading stderr Separately

```javascript
const child = spawn('command');

child.stdout.on('data', (data) => {
  console.log(`[OUT] ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`[ERR] ${data}`);
});
```

### Collecting All Output

```javascript
const child = spawn('command');
let output = '';

child.stdout.on('data', (data) => {
  output += data.toString();
});

child.on('close', (code) => {
  console.log('Complete output:', output);
});
```

---

## Writing to Process Streams

### Writing to stdin

```javascript
const grep = spawn('grep', ['pattern']);

// Write data to process
grep.stdin.write('line 1: has pattern\n');
grep.stdin.write('line 2: no match\n');
grep.stdin.write('line 3: pattern here\n');

// Signal end of input
grep.stdin.end();

grep.stdout.on('data', (data) => {
  console.log('Matched:', data.toString());
});
```

### Streaming from File

```javascript
const fs = require('fs');
const child = spawn('wc', ['-l']);

// Pipe file to child process
const fileStream = fs.createReadStream('large-file.txt');
fileStream.pipe(child.stdin);

child.stdout.on('data', (data) => {
  console.log(`Lines: ${data}`);
});
```

### Handling stdin Errors

```javascript
const child = spawn('command');

child.stdin.on('error', (err) => {
  if (err.code === 'EPIPE') {
    console.log('Process closed stdin early');
  } else {
    console.error('stdin error:', err);
  }
});

child.stdin.write('data\n');
child.stdin.end();
```

---

## Piping Between Processes

### Simple Pipe

```javascript
// Unix equivalent: cat file.txt | grep pattern
const cat = spawn('cat', ['file.txt']);
const grep = spawn('grep', ['pattern']);

cat.stdout.pipe(grep.stdin);

grep.stdout.on('data', (data) => {
  console.log(data.toString());
});
```

### Multi-Stage Pipeline

```javascript
// Unix equivalent: cat file | grep pattern | wc -l
const cat = spawn('cat', ['file.txt']);
const grep = spawn('grep', ['ERROR']);
const wc = spawn('wc', ['-l']);

// Build pipeline
cat.stdout.pipe(grep.stdin);
grep.stdout.pipe(wc.stdin);

// Get final output
wc.stdout.on('data', (data) => {
  console.log(`Error count: ${data}`);
});
```

### Bidirectional Piping

```javascript
const child = spawn('bc'); // Calculator

// Write to child
child.stdin.write('5 + 3\n');

// Read from child
child.stdout.on('data', (data) => {
  console.log(`Result: ${data}`);
});

// More calculations
setTimeout(() => {
  child.stdin.write('10 * 7\n');
}, 100);

setTimeout(() => {
  child.stdin.end();
}, 200);
```

---

## Stream Transformation

### Transform Stream Basics

```javascript
const { Transform } = require('stream');

const uppercase = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

const child = spawn('echo', ['hello world']);
child.stdout.pipe(uppercase).pipe(process.stdout);
```

### Complex Transformation

```javascript
const lineCounter = new Transform({
  transform(chunk, encoding, callback) {
    this.lineCount = (this.lineCount || 0) + 1;
    const prefixed = `[Line ${this.lineCount}] ${chunk}`;
    this.push(prefixed);
    callback();
  }
});

const child = spawn('cat', ['file.txt']);
child.stdout.pipe(lineCounter).pipe(process.stdout);
```

### Filtering Transform

```javascript
const filter = new Transform({
  transform(chunk, encoding, callback) {
    const lines = chunk.toString().split('\n');
    const filtered = lines
      .filter(line => line.includes('ERROR'))
      .join('\n');

    if (filtered) {
      this.push(filtered + '\n');
    }
    callback();
  }
});

const child = spawn('tail', ['-f', 'app.log']);
child.stdout.pipe(filter).pipe(process.stdout);
```

---

## Backpressure Management

### Understanding Backpressure

Backpressure occurs when a writable stream can't keep up with the data being written to it. The stream signals this by returning `false` from `write()`.

### Manual Backpressure Handling

```javascript
const child = spawn('slow-processor');
const fs = require('fs');
const readable = fs.createReadStream('large-file.txt');

readable.on('data', (chunk) => {
  const canContinue = child.stdin.write(chunk);

  if (!canContinue) {
    // Pause reading until drain
    readable.pause();
  }
});

child.stdin.on('drain', () => {
  // Resume reading
  readable.resume();
});

readable.on('end', () => {
  child.stdin.end();
});
```

### Automatic Backpressure with pipe()

```javascript
// pipe() handles backpressure automatically
const fs = require('fs');
const child = spawn('processor');

fs.createReadStream('large-file.txt')
  .pipe(child.stdin);

// pipe() will:
// 1. Automatically pause the read stream when write buffer is full
// 2. Resume when the buffer drains
```

### High Water Mark

```javascript
const { Transform } = require('stream');

// Control buffer size with highWaterMark
const transform = new Transform({
  highWaterMark: 64 * 1024, // 64KB buffer
  transform(chunk, encoding, callback) {
    // Process chunk
    this.push(chunk);
    callback();
  }
});

child.stdout.pipe(transform);
```

---

## Error Handling

### Handling All Stream Errors

```javascript
const child = spawn('command');

// Handle process errors
child.on('error', (err) => {
  console.error('Failed to start:', err);
});

// Handle stdout errors
child.stdout.on('error', (err) => {
  console.error('stdout error:', err);
});

// Handle stderr errors
child.stderr.on('error', (err) => {
  console.error('stderr error:', err);
});

// Handle stdin errors
child.stdin.on('error', (err) => {
  if (err.code !== 'EPIPE') {
    console.error('stdin error:', err);
  }
});
```

### Pipeline Error Handling

```javascript
const { pipeline } = require('stream');

const cat = spawn('cat', ['file.txt']);
const grep = spawn('grep', ['pattern']);

pipeline(
  cat.stdout,
  grep.stdin,
  (err) => {
    if (err) {
      console.error('Pipeline failed:', err);
      // Cleanup
      cat.kill();
      grep.kill();
    } else {
      console.log('Pipeline succeeded');
    }
  }
);
```

### Graceful Error Recovery

```javascript
function createResilientPipeline(source, dest) {
  source.on('error', (err) => {
    console.error('Source error:', err);
    source.unpipe(dest);
    dest.end();
  });

  dest.on('error', (err) => {
    console.error('Destination error:', err);
    source.unpipe(dest);
    source.destroy();
  });

  source.pipe(dest);
}
```

---

## Best Practices

### 1. Always Handle Errors

```javascript
// GOOD
child.stdout.on('error', handleError);
child.stderr.on('error', handleError);
child.stdin.on('error', handleError);

// BAD
child.stdout.pipe(destination);
// Missing error handlers = potential crashes
```

### 2. Close Streams Properly

```javascript
// Signal end of input
child.stdin.end();

// Or destroy if needed
child.stdin.destroy();

// Let streams finish before exiting
child.on('close', () => {
  process.exit(0);
});
```

### 3. Use pipe() for Automatic Management

```javascript
// GOOD - automatic backpressure
source.pipe(child.stdin);

// AVOID - manual management is error-prone
source.on('data', (chunk) => {
  child.stdin.write(chunk);
});
```

### 4. Monitor Stream Events

```javascript
child.stdout.on('data', onData);
child.stdout.on('end', onEnd);
child.stdout.on('error', onError);
child.stdout.on('close', onClose);
```

### 5. Handle EPIPE Gracefully

```javascript
child.stdin.on('error', (err) => {
  if (err.code === 'EPIPE') {
    // Process closed stdin early - this is often normal
    console.log('Process finished reading');
  } else {
    throw err;
  }
});
```

### 6. Use Transform Streams for Processing

```javascript
// GOOD - streaming transformation
source.pipe(transformStream).pipe(destination);

// AVOID - buffering everything in memory
let data = '';
source.on('data', (chunk) => { data += chunk; });
source.on('end', () => {
  const transformed = transform(data);
  destination.write(transformed);
});
```

### 7. Set Encoding When Needed

```javascript
// For text data
child.stdout.setEncoding('utf8');
child.stdout.on('data', (str) => {
  // str is already a string, not a Buffer
});
```

---

## Summary

Key takeaways:
- Every child process has stdin, stdout, and stderr streams
- Use `pipe()` for automatic backpressure handling
- Transform streams enable data processing in pipelines
- Always handle stream errors to prevent crashes
- Close streams properly to avoid resource leaks
- Monitor all stream events for robust operation

Understanding streams is essential for building efficient, scalable child process systems!
