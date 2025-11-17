# Guide: Synchronous vs Asynchronous File Operations

**Reading Time**: 15 minutes
**Difficulty**: Beginner
**Prerequisites**: Basic JavaScript knowledge

---

## Introduction

Understanding the difference between synchronous and asynchronous operations is **the most important concept** in Node.js. Get this right, and everything else will make sense.

### What You'll Learn

- What "sync" and "async" actually mean
- How they affect your program's execution
- When to use each approach
- Common mistakes and how to avoid them

---

## The Restaurant Analogy

Imagine you're running a restaurant:

### Synchronous (One Customer at a Time)

```
Customer 1 arrives → You take order → Cook food → Serve → Take payment
                      ↓ (Everyone else waits)
Customer 2's turn → You take order → Cook food → Serve → Take payment
                      ↓ (Everyone else waits)
Customer 3's turn → ...
```

**Result**: Long wait times, frustrated customers, empty restaurant.

### Asynchronous (Concurrent Service)

```
Customer 1 arrives → Take order → Give to kitchen → Serve others
Customer 2 arrives → Take order → Give to kitchen → Serve others
Customer 3 arrives → Take order → Give to kitchen → Serve others
                      ↓
Kitchen finishes → Serve Customer 1
Kitchen finishes → Serve Customer 2
Kitchen finishes → Serve Customer 3
```

**Result**: Happy customers, full restaurant, better business!

**Node.js works like the async restaurant** - it can handle many operations at once.

---

## Synchronous Operations

### What They Are

Synchronous operations **block** (pause) your program until they finish.

### Example Code

```javascript
const fs = require('fs');

console.log('1. Starting');

// This BLOCKS - program stops here until file is read
const data = fs.readFileSync('file.txt', 'utf8');

console.log('2. File read:', data);
console.log('3. Done');
```

**Output** (always in this order):
```
1. Starting
2. File read: [file contents]
3. Done
```

### What Happens Step-by-Step

```
Time: 0ms    →  console.log('1. Starting')
              →  Output: "1. Starting"

Time: 1ms    →  fs.readFileSync() starts
              →  Program WAITS... ⏸️

Time: 50ms   →  File read from disk
              →  Program WAITS... ⏸️

Time: 100ms  →  fs.readFileSync() finishes
              →  Returns data

Time: 101ms  →  console.log('2. File read:', data)
              →  Output: "2. File read: Hello"

Time: 102ms  →  console.log('3. Done')
              →  Output: "3. Done"
```

**Total Time**: 102ms
**Program Blocked**: 99ms (idle, doing nothing)

### Characteristics

✅ **Pros**:
- Simple to understand
- Code executes in order
- Easy to debug
- No callbacks needed

❌ **Cons**:
- Blocks the entire program
- Freezes the event loop
- Terrible for servers
- Wastes CPU time

---

## Asynchronous Operations

### What They Are

Asynchronous operations **don't block** - they start the operation and continue running other code.

### Example Code

```javascript
const fs = require('fs');

console.log('1. Starting');

// This DOESN'T BLOCK - program continues immediately
fs.readFile('file.txt', 'utf8', (err, data) => {
  console.log('2. File read:', data);
});

console.log('3. Done');
```

**Output** (notice the order!):
```
1. Starting
3. Done
2. File read: [file contents]
```

### What Happens Step-by-Step

```
Time: 0ms    →  console.log('1. Starting')
              →  Output: "1. Starting"

Time: 1ms    →  fs.readFile() starts
              →  Hands off to thread pool
              →  Program CONTINUES ▶️ (doesn't wait)

Time: 2ms    →  console.log('3. Done')
              →  Output: "3. Done"
              →  Main code finished!

Time: 3ms    →  Thread pool working on file read...
Time: 50ms   →  Thread pool working on file read...
Time: 100ms  →  Thread pool: File read complete!
              →  Callback added to event loop queue

Time: 101ms  →  Event loop: Execute callback
              →  console.log('2. File read:', data)
              →  Output: "2. File read: Hello"
```

**Total Time**: 101ms
**Program Blocked**: 0ms (never idle!)

### Characteristics

✅ **Pros**:
- Doesn't block the program
- Can handle multiple operations
- Perfect for servers
- Efficient use of CPU

❌ **Cons**:
- More complex code
- Execution order not obvious
- Requires callbacks/promises
- Harder to debug

---

## Side-by-Side Comparison

### Synchronous

```javascript
console.log('Start');

const file1 = fs.readFileSync('file1.txt');  // Wait 100ms
const file2 = fs.readFileSync('file2.txt');  // Wait 100ms
const file3 = fs.readFileSync('file3.txt');  // Wait 100ms

console.log('Done');
// Total time: 300ms (sequential)
```

### Asynchronous

```javascript
console.log('Start');

fs.readFile('file1.txt', callback1);  // Start, don't wait
fs.readFile('file2.txt', callback2);  // Start, don't wait
fs.readFile('file3.txt', callback3);  // Start, don't wait

console.log('Done');
// Total time: ~100ms (parallel)
// 3x faster!
```

---

## When to Use Each

### Use Synchronous Operations ✅

**1. Application Startup**
```javascript
// Loading config before server starts
const config = JSON.parse(
  fs.readFileSync('config.json', 'utf8')
);

app.listen(config.port); // Only after config is loaded
```

**2. CLI Tools and Scripts**
```javascript
// build.js
const files = fs.readdirSync('src');
files.forEach(file => {
  const content = fs.readFileSync(`src/${file}`);
  // Process file...
});
```

**3. Simple One-Off Scripts**
```javascript
// migrate.js
const oldData = fs.readFileSync('old-format.json');
const newData = transform(oldData);
fs.writeFileSync('new-format.json', newData);
```

**Common Pattern**: Sync operations are OK when:
- The application isn't serving requests yet
- It's a short-lived script
- Simplicity is more important than performance

### Use Asynchronous Operations ✅

**1. Web Servers**
```javascript
app.get('/users/:id', async (req, res) => {
  // MUST be async - server needs to handle other requests
  const userData = await fs.promises.readFile(`users/${req.params.id}.json`);
  res.json(JSON.parse(userData));
});
```

**2. Real-Time Applications**
```javascript
// Chat application
socket.on('message', async (msg) => {
  // MUST be async - can't block other users
  await fs.promises.appendFile('chat.log', msg + '\n');
  broadcast(msg);
});
```

**3. Processing Multiple Files**
```javascript
// Process many files concurrently
const files = ['file1.txt', 'file2.txt', 'file3.txt'];

// Async - processes all files in parallel
await Promise.all(
  files.map(file => fs.promises.readFile(file))
);
```

**Golden Rule**: If your code is **serving requests or running continuously**, use async.

---

## Common Mistakes

### Mistake 1: Using Sync in a Server

```javascript
// ❌ TERRIBLE - Freezes server for ALL users
app.get('/data', (req, res) => {
  const data = fs.readFileSync('large-file.txt'); // Blocks 2 seconds
  res.send(data);
});

// While User 1's request is reading the file,
// User 2, 3, 4... all wait. Server is frozen! 🥶
```

**Fix**:
```javascript
// ✅ GOOD - Server remains responsive
app.get('/data', async (req, res) => {
  const data = await fs.promises.readFile('large-file.txt');
  res.send(data);
});

// All users get served concurrently 🎉
```

### Mistake 2: Not Understanding Async Order

```javascript
// ❌ WRONG - Doesn't work as expected
fs.readFile('file.txt', (err, data) => {
  console.log('File data:', data);
});

console.log('Data:', data); // ❌ ERROR - data is undefined!
```

**Why**: The second `console.log` runs BEFORE the callback.

**Fix**:
```javascript
// ✅ CORRECT - Use data inside callback
fs.readFile('file.txt', (err, data) => {
  console.log('File data:', data); // ✅ Works
});

// Or use async/await
const data = await fs.promises.readFile('file.txt');
console.log('Data:', data); // ✅ Works
```

### Mistake 3: Mixing Sync and Async

```javascript
// ❌ CONFUSING - Unpredictable order
const config = fs.readFileSync('config.json');  // Sync
fs.readFile('data.json', (err, data) => {       // Async
  console.log(data);
});
console.log(config);
```

**Fix**: Be consistent:
```javascript
// ✅ GOOD - All async
const config = await fs.promises.readFile('config.json');
const data = await fs.promises.readFile('data.json');
console.log(config);
console.log(data);
```

---

## Real-World Impact

### Example: Processing User Uploads

**Bad Approach (Sync)**:
```javascript
app.post('/upload', (req, res) => {
  // Process upload synchronously
  const data = req.file;
  fs.writeFileSync(`uploads/${data.name}`, data.buffer); // BLOCKS!

  // If upload is 10MB, server freezes for ~500ms
  // 100 concurrent uploads = 50 seconds total 😱

  res.send('Uploaded');
});
```

**Good Approach (Async)**:
```javascript
app.post('/upload', async (req, res) => {
  const data = req.file;
  await fs.promises.writeFile(`uploads/${data.name}`, data.buffer);

  // Server remains responsive
  // 100 concurrent uploads = ~500ms total 🚀

  res.send('Uploaded');
});
```

---

## Quick Decision Tree

```
Are you building a server or long-running app?
├─ YES → Use Async (99% of the time)
└─ NO  → Is this a one-time startup operation?
         ├─ YES → Sync is OK
         └─ NO  → Use Async
```

---

## Testing Your Understanding

### Quiz

**Question 1**: What will this code output?

```javascript
console.log('A');
fs.readFile('file.txt', () => console.log('B'));
console.log('C');
```

<details>
<summary>Click to see answer</summary>

**Answer**: `A C B`

**Explanation**: `readFile` is async, so 'C' prints before the callback runs.
</details>

**Question 2**: Is this code good for a web server?

```javascript
app.get('/users', (req, res) => {
  const users = fs.readFileSync('users.json');
  res.send(users);
});
```

<details>
<summary>Click to see answer</summary>

**Answer**: ❌ No, terrible!

**Reason**: Uses `readFileSync` which blocks the entire server. All other requests wait.

**Fix**:
```javascript
app.get('/users', async (req, res) => {
  const users = await fs.promises.readFile('users.json');
  res.send(users);
});
```
</details>

---

## Summary

### Key Takeaways

1. **Synchronous** = Blocking = Waits = Sequential
2. **Asynchronous** = Non-blocking = Continues = Concurrent
3. **Node.js is single-threaded** → Blocking operations freeze everything
4. **Default to async** in servers and long-running apps
5. **Sync is OK** for startup code and simple scripts
6. **Async is 3x-10x faster** for multiple operations

### The One Rule to Remember

> "If your code is serving requests, use async. Always."

---

## What's Next?

Now that you understand sync vs async, learn about:

1. **[Callbacks vs Promises vs Async/Await](02-callbacks-vs-promises.md)** - Different ways to handle async operations
2. **[Error Handling](03-error-handling.md)** - Handling errors in async code
3. **[Examples](../examples/)** - See these concepts in working code

---

## Further Reading

- [Node.js Event Loop Explained](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
- [Blocking vs Non-Blocking](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/)
- [Understanding the Node.js Event Loop](https://nodejs.dev/learn/the-nodejs-event-loop)

**Pro Tip**: Run the examples in this guide yourself! Change the code, break it, fix it. That's how you truly learn.
