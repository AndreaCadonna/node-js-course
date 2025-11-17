# File System Concepts

This document explains the fundamental concepts you need to understand file system operations in Node.js. Read this before diving into the code examples.

---

## Table of Contents

1. [What is the File System?](#what-is-the-file-system)
2. [Blocking vs Non-Blocking I/O](#blocking-vs-non-blocking-io)
3. [How Node.js Handles File Operations](#how-nodejs-handles-file-operations)
4. [The Event Loop and File I/O](#the-event-loop-and-file-io)
5. [Synchronous vs Asynchronous Operations](#synchronous-vs-asynchronous-operations)
6. [Callbacks, Promises, and Async/Await](#callbacks-promises-and-asyncawait)
7. [File Descriptors](#file-descriptors)
8. [Buffering vs Streaming](#buffering-vs-streaming)
9. [File Encodings](#file-encodings)
10. [File Permissions and Ownership](#file-permissions-and-ownership)
11. [Cross-Platform Considerations](#cross-platform-considerations)

---

## What is the File System?

### Definition

The **file system** is the method and data structure that an operating system uses to store and organize files on a storage device (hard drive, SSD, etc.).

### Why It Matters in Node.js

Node.js applications often need to:
- **Read configuration files** (JSON, YAML, ENV)
- **Write log files** for debugging and monitoring
- **Upload/download files** in web applications
- **Process data files** (CSV, JSON, XML)
- **Cache data** to improve performance
- **Store user data** persistently

### Mental Model

Think of the file system as a **giant filing cabinet**:
- **Directories** are folders/drawers
- **Files** are documents inside folders
- **Paths** are the address to find a specific document
- **Operations** (read, write, delete) are actions you perform on documents

---

## Blocking vs Non-Blocking I/O

### What is I/O?

**I/O** (Input/Output) refers to any operation that reads from or writes to an external source:
- File system (disk)
- Network (HTTP requests, database queries)
- User input (stdin)

### Blocking I/O

**Blocking operations** halt program execution until they complete.

```javascript
// Blocking example
console.log('1. Starting');
const data = fs.readFileSync('file.txt'); // Program STOPS here
console.log('2. File read'); // Only runs after file is read
console.log('3. Done');
```

**Output (sequential)**:
```
1. Starting
2. File read
3. Done
```

**Key characteristic**: Everything happens in order, one at a time.

### Non-Blocking I/O

**Non-blocking operations** start the operation and immediately continue executing the next code.

```javascript
// Non-blocking example
console.log('1. Starting');
fs.readFile('file.txt', (err, data) => {
  console.log('2. File read'); // Runs later when file is ready
});
console.log('3. Done'); // Runs immediately
```

**Output (asynchronous)**:
```
1. Starting
3. Done
2. File read
```

**Key characteristic**: Code continues running while waiting for I/O.

### The Critical Difference

| Aspect | Blocking | Non-Blocking |
|--------|----------|--------------|
| **Execution** | Waits for completion | Continues immediately |
| **CPU** | Idle during I/O | Can do other work |
| **Use Case** | Scripts, CLI tools | Servers, real-time apps |
| **Performance** | Poor for concurrent tasks | Great for concurrent tasks |
| **Complexity** | Simple, sequential | Requires callbacks/promises |

### Why Node.js Prefers Non-Blocking

Node.js is **single-threaded**. If you block the thread:
- The entire application freezes
- No other requests can be handled
- The server becomes unresponsive

**Example of the problem**:
```javascript
// BAD: Blocking web server
app.get('/data', (req, res) => {
  const data = fs.readFileSync('large-file.txt'); // 2 seconds
  res.send(data);
});

// If 100 users request at once:
// User 1: waits 2 seconds
// User 2: waits 4 seconds (2 + 2)
// User 3: waits 6 seconds (4 + 2)
// User 100: waits 200 seconds! 😱
```

```javascript
// GOOD: Non-blocking web server
app.get('/data', async (req, res) => {
  const data = await fs.promises.readFile('large-file.txt');
  res.send(data);
});

// If 100 users request at once:
// All users: wait ~2 seconds (concurrent)
```

---

## How Node.js Handles File Operations

### The Architecture

Node.js file operations work through multiple layers:

```
Your JavaScript Code
        ↓
Node.js fs Module (JavaScript)
        ↓
Node.js Bindings (C++)
        ↓
libuv (Cross-platform I/O library)
        ↓
Thread Pool (for file operations)
        ↓
Operating System
        ↓
Physical Disk
```

### Why This Matters

1. **File operations are NOT truly non-blocking** at the OS level
2. Node.js uses a **thread pool** to make them appear non-blocking
3. The default thread pool has **4 threads**
4. If you have 10 file operations, 6 will queue up

### The Thread Pool

```javascript
// These run in the thread pool
fs.readFile()   // Uses thread pool
fs.writeFile()  // Uses thread pool
fs.stat()       // Uses thread pool
crypto.pbkdf2() // Uses thread pool
```

**Thread pool size** (can be adjusted):
```bash
UV_THREADPOOL_SIZE=8 node app.js
```

**Default**: 4 threads
**Maximum**: 1024 threads
**Recommendation**: Set to number of CPU cores

---

## The Event Loop and File I/O

### How It Works

```
┌───────────────────────────┐
│   Your JavaScript Code     │
└────────────┬──────────────┘
             │
             ↓
┌────────────────────────────┐
│      Event Loop            │
│                            │
│  1. Execute sync code      │
│  2. Process callbacks      │
│  3. Check for I/O          │
│  4. Repeat                 │
└────────────────────────────┘
             ↑
             │
┌────────────┴──────────────┐
│    Thread Pool             │
│  (File I/O happens here)   │
└────────────────────────────┘
```

### Step-by-Step Example

```javascript
console.log('1');

fs.readFile('file.txt', (err, data) => {
  console.log('3');
});

console.log('2');
```

**What happens**:

1. **Event Loop**: Execute `console.log('1')` → Output: `1`
2. **Event Loop**: Call `fs.readFile()` → Delegate to thread pool
3. **Event Loop**: Execute `console.log('2')` → Output: `2`
4. **Thread Pool**: Read file from disk (takes time...)
5. **Thread Pool**: File read complete → Add callback to event loop queue
6. **Event Loop**: Process callback → Execute `console.log('3')` → Output: `3`

**Output**:
```
1
2
3
```

### Key Insight

The event loop is **always running** and checking for:
- Completed I/O operations
- Timers (setTimeout, setInterval)
- Callbacks ready to execute

---

## Synchronous vs Asynchronous Operations

### Node.js Provides Both

Every file operation has **two versions**:

```javascript
// Synchronous (blocking)
const data = fs.readFileSync('file.txt');

// Asynchronous (non-blocking)
fs.readFile('file.txt', (err, data) => {
  // Handle data
});

// Asynchronous with promises
const data = await fs.promises.readFile('file.txt');
```

### When to Use Synchronous

✅ **Good use cases**:
- Application startup/initialization
- Loading config before server starts
- CLI tools and scripts
- Build scripts (Webpack, Gulp)
- One-time operations

```javascript
// Good: Load config at startup
const config = JSON.parse(
  fs.readFileSync('config.json', 'utf8')
);

// Start server after config is loaded
app.listen(config.port);
```

### When to Use Asynchronous

✅ **Good use cases**:
- Web servers handling requests
- Real-time applications
- Processing multiple files
- Any concurrent operations
- Long-running applications

```javascript
// Good: Handle requests asynchronously
app.get('/user/:id', async (req, res) => {
  const userData = await fs.promises.readFile(
    `users/${req.params.id}.json`
  );
  res.json(JSON.parse(userData));
});
```

### The Golden Rule

> **Default to asynchronous. Use synchronous only when you're certain the application is not serving requests.**

---

## Callbacks, Promises, and Async/Await

Node.js has evolved through three async patterns:

### 1. Callbacks (Classic Node.js)

```javascript
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Data:', data);
});
```

**Pros**: Simple, widely supported
**Cons**: Callback hell, error handling complexity

### 2. Promises (ES6)

```javascript
const fsPromises = require('fs').promises;

fsPromises.readFile('file.txt', 'utf8')
  .then(data => {
    console.log('Data:', data);
  })
  .catch(err => {
    console.error('Error:', err);
  });
```

**Pros**: Chainable, better error handling
**Cons**: Still somewhat verbose

### 3. Async/Await (Modern - ES2017)

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
```

**Pros**: Looks synchronous, easy to read, best error handling
**Cons**: Requires async function context

### Recommendation

**Use async/await** for all new code:
- Most readable
- Best error handling with try/catch
- Industry standard
- Works with all promise-based APIs

---

## File Descriptors

### What Are They?

A **file descriptor** (FD) is a low-level reference to an open file.

### Mental Model

Think of a file descriptor as a **bookmark**:
- Opening a file gives you a bookmark (FD)
- You can jump to any page using the bookmark
- You must close the bookmark when done
- Limited number of bookmarks available

### How They Work

```javascript
const fs = require('fs').promises;

// Open file (get file descriptor)
const fd = await fs.open('file.txt', 'r');

try {
  // Use file descriptor for operations
  const buffer = Buffer.alloc(100);
  await fd.read(buffer, 0, 100, 0);

  console.log(buffer.toString());
} finally {
  // ALWAYS close file descriptor
  await fd.close();
}
```

### Why Use File Descriptors?

**Benefits**:
- Random access (read/write at any position)
- Multiple operations on same file
- More control over file operations
- Better performance for repeated access

**Trade-offs**:
- More complex code
- Must manage cleanup
- Can leak if not closed
- Limited number available (ulimit -n)

### File Descriptor Limit

Each process has a limit:
```bash
# Check limit
ulimit -n
# Output: 1024 (typical)
```

If you exceed this, you'll get `EMFILE` (too many open files) error.

---

## Buffering vs Streaming

### The Problem

How do you handle a 1GB file?

### Solution 1: Buffering (Load All at Once)

```javascript
// Loads entire file into memory
const data = await fs.readFile('1gb-file.txt');
// Memory usage: 1GB+
```

**When to use**:
- Small files (< 100MB)
- Need entire file at once
- Simple operations

**Limitations**:
- High memory usage
- Slow for large files
- Can crash with very large files

### Solution 2: Streaming (Load in Chunks)

```javascript
const stream = fs.createReadStream('1gb-file.txt');
stream.on('data', (chunk) => {
  // Process chunk (e.g., 64KB at a time)
  // Memory usage: ~64KB
});
```

**When to use**:
- Large files (> 100MB)
- Real-time processing
- Network transfers
- Memory-constrained environments

**Benefits**:
- Constant low memory
- Start processing immediately
- Handle files larger than RAM

### The Rule of Thumb

```
File < 10MB   → Use fs.readFile()
File < 100MB  → Either works
File > 100MB  → Use streams
File > RAM    → Must use streams
```

---

## File Encodings

### What is Encoding?

**Encoding** is how text characters are stored as bytes.

### Common Encodings

```javascript
// UTF-8 (default for most text)
const text = await fs.readFile('file.txt', 'utf8');

// ASCII (English text only)
const ascii = await fs.readFile('file.txt', 'ascii');

// Base64 (binary data as text)
const base64 = await fs.readFile('image.png', 'base64');

// Binary (raw bytes)
const buffer = await fs.readFile('file.bin'); // Returns Buffer
```

### UTF-8 vs Buffer

```javascript
// Without encoding → Returns Buffer
const buffer = await fs.readFile('file.txt');
console.log(buffer); // <Buffer 48 65 6c 6c 6f>

// With 'utf8' → Returns String
const text = await fs.readFile('file.txt', 'utf8');
console.log(text); // "Hello"
```

### When to Use Each

| Encoding | Use For |
|----------|---------|
| **utf8** | Text files (most common) |
| **ascii** | Simple English text |
| **base64** | Embedding binary in JSON/text |
| **hex** | Debugging binary data |
| **latin1** | Legacy systems |
| **binary** (no encoding) | Images, videos, executables |

---

## File Permissions and Ownership

### Unix Permissions

Files have permissions for three groups:

```
-rw-r--r--  1 user group 1234 Jan 1 12:00 file.txt
 │││ │││ │││
 │││ │││ └── Others: read
 │││ └────── Group: read
 └────────── Owner: read + write
```

### Permission Bits

```javascript
// Octal notation
0o644 // rw-r--r-- (common for files)
0o755 // rwxr-xr-x (common for executables)
0o777 // rwxrwxrwx (everyone can do everything)

// Setting permissions
await fs.chmod('file.txt', 0o644);
```

**Breakdown of 0o644**:
- **6** (110 binary) = read (4) + write (2) = Owner can read/write
- **4** (100 binary) = read (4) = Group can read
- **4** (100 binary) = read (4) = Others can read

### Checking Permissions

```javascript
try {
  await fs.access('file.txt', fs.constants.R_OK);
  console.log('Can read');
} catch {
  console.log('Cannot read');
}
```

---

## Cross-Platform Considerations

### Path Separators

```javascript
// Windows
'C:\\Users\\John\\file.txt'

// Unix/Mac
'/home/john/file.txt'

// Cross-platform (use path module)
const path = require('path');
const filePath = path.join('users', 'john', 'file.txt');
// Windows: users\john\file.txt
// Unix: users/john/file.txt
```

### Line Endings

```javascript
// Windows: \r\n (CRLF)
// Unix/Mac: \n (LF)

// Cross-platform line ending
const os = require('os');
const text = `Line 1${os.EOL}Line 2${os.EOL}Line 3`;
```

### Case Sensitivity

```javascript
// Windows: Case-insensitive
'File.txt' === 'file.txt' // true

// Unix/Mac: Case-sensitive
'File.txt' === 'file.txt' // false
```

**Best practice**: Always use lowercase file names.

### Permissions

- **Windows**: Different permission model (ACLs)
- **Unix/Mac**: Standard rwx permissions
- **Node.js**: Abstracts most differences

---

## Summary

### Key Takeaways

1. **File I/O is slow** → Always use async in servers
2. **Node.js is single-threaded** → Blocking operations freeze everything
3. **Event loop + thread pool** → How Node.js handles file operations
4. **Three async patterns** → Use async/await for new code
5. **Buffering vs streaming** → Streams for large files
6. **Encoding matters** → Specify 'utf8' for text files
7. **Cross-platform** → Use path module for file paths

### Next Steps

Now that you understand the concepts, you're ready to:

1. **Start with Level 1** → Learn basic file operations
2. **Read the guides** → Deeper dives into specific topics
3. **Practice with examples** → See concepts in action
4. **Complete exercises** → Solidify your understanding

---

**Related Guides:**
- [Sync vs Async Operations](level-1-basics/guides/01-sync-vs-async.md)
- [Callbacks vs Promises](level-1-basics/guides/02-callbacks-vs-promises.md)
- [Error Handling](level-1-basics/guides/03-error-handling.md)
