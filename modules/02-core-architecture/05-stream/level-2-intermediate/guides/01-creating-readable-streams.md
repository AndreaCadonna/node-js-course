# Creating Readable Streams

## Introduction

This guide teaches you how to create custom Readable streams by extending the `Readable` class. You'll learn the push/pull model, how to implement the `_read()` method, and how to build streams that can read from any data source—databases, APIs, sensors, or generated data.

By the end, you'll be able to create production-ready custom Readable streams for any use case.

---

## Why Create Custom Readable Streams?

### Built-in Streams Are Limited

Node.js provides built-in readable streams for common sources:

```javascript
const fs = require('fs');
const http = require('http');

// Built-in streams
const fileStream = fs.createReadStream('data.txt');
const httpRequest = http.get('http://api.example.com');
```

But what if you need to stream from:
- A database query with millions of rows
- A REST API with pagination
- Generated data (random numbers, test data)
- A custom protocol or format
- Multiple sources combined

**Answer:** Create your own custom Readable stream.

---

## The Readable Stream Mental Model

### Push vs Pull Model

Understanding how Readable streams work is crucial:

```
┌─────────────────────┐
│   Your Consumer     │
│   (data event)      │
└──────────┬──────────┘
           │ pull (read() is called)
           ↓
┌──────────────────────┐
│  Internal Buffer     │ ← highWaterMark limit
│  [■■■■□□□□□□]       │
└──────────┬───────────┘
           │ push (push() data into buffer)
           ↓
┌──────────────────────┐
│   Your _read()       │ ← You implement this
│   (fetch data)       │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│   Data Source        │
│   (DB, API, etc)     │
└──────────────────────┘
```

**Key Points:**
1. Consumer **pulls** by reading from buffer (automatic)
2. Stream calls your `_read()` when buffer needs filling
3. You **push** data into buffer with `push()`
4. Stream manages the buffer and flow control

---

## Basic Implementation

### Minimal Readable Stream

Here's the simplest custom Readable stream:

```javascript
const { Readable } = require('stream');

class SimpleReadable extends Readable {
  constructor(options) {
    super(options);
    this.counter = 0;
  }

  _read(size) {
    // Called when stream needs data
    // size is a hint, you can ignore it

    if (this.counter < 5) {
      // Push data into the stream
      this.push(`Chunk ${this.counter}\n`);
      this.counter++;
    } else {
      // Signal end of stream
      this.push(null);
    }
  }
}

// Usage
const stream = new SimpleReadable();
stream.on('data', chunk => {
  console.log('Got:', chunk.toString());
});
```

**Output:**
```
Got: Chunk 0
Got: Chunk 1
Got: Chunk 2
Got: Chunk 3
Got: Chunk 4
```

---

## The _read() Method

### When Is _read() Called?

The stream calls `_read()` when:
1. Consumer starts reading (first time)
2. Internal buffer drops below highWaterMark
3. Previously pushed data has been consumed

**Important:** Don't call `_read()` yourself. The stream manages when to call it.

### The size Parameter

```javascript
_read(size) {
  // size = highWaterMark value (default 16KB for binary, 16 for object mode)
  // This is a HINT, not a requirement
  // You can push more or less data
}
```

**Best Practice:** Use `size` as a guide for how much data to fetch, but don't feel constrained by it.

---

## Pushing Data

### The push() Method

```javascript
this.push(chunk);
```

**What push() does:**
1. Adds data to internal buffer
2. Returns `true` if buffer is below highWaterMark
3. Returns `false` if buffer is full (backpressure)

### Important Push Behaviors

#### 1. Signaling End of Stream

```javascript
_read() {
  if (this.hasMoreData()) {
    this.push(this.getData());
  } else {
    this.push(null); // null = no more data
  }
}
```

#### 2. Never Push After null

```javascript
// ❌ WRONG - will cause error
_read() {
  this.push('data');
  this.push(null);
  this.push('more data'); // ERROR!
}

// ✅ CORRECT - track state
constructor() {
  super();
  this.ended = false;
}

_read() {
  if (this.ended) return;

  if (this.hasMoreData()) {
    this.push(this.getData());
  } else {
    this.push(null);
    this.ended = true;
  }
}
```

#### 3. Handle Backpressure

```javascript
_read() {
  // Check return value of push()
  const canContinue = this.push(this.getData());

  if (!canContinue) {
    // Buffer is full, stop pushing
    // _read() will be called again when ready
    return;
  }
}
```

---

## Practical Examples

### Example 1: Number Generator Stream

```javascript
const { Readable } = require('stream');

class NumberStream extends Readable {
  constructor(start, end, options) {
    super(options);
    this.current = start;
    this.end = end;
  }

  _read() {
    if (this.current <= this.end) {
      const data = `${this.current}\n`;
      this.push(data);
      this.current++;
    } else {
      this.push(null); // End stream
    }
  }
}

// Usage
const numbers = new NumberStream(1, 100);
numbers.pipe(process.stdout);
```

### Example 2: Database Row Stream

```javascript
const { Readable } = require('stream');

class DatabaseStream extends Readable {
  constructor(query, options) {
    super({ objectMode: true, ...options });
    this.query = query;
    this.offset = 0;
    this.batchSize = 100;
    this.done = false;
  }

  async _read() {
    if (this.done) return;

    try {
      // Fetch batch of rows
      const rows = await this.fetchRows(this.offset, this.batchSize);

      if (rows.length === 0) {
        // No more data
        this.push(null);
        this.done = true;
        return;
      }

      // Push each row
      for (const row of rows) {
        if (!this.push(row)) {
          // Backpressure - buffer is full
          // Store offset and wait for next _read() call
          break;
        }
      }

      this.offset += rows.length;
    } catch (err) {
      this.destroy(err); // Emit error and destroy stream
    }
  }

  async fetchRows(offset, limit) {
    // Simulate database query
    // In real code, use actual database client
    return [];
  }
}
```

### Example 3: API Pagination Stream

```javascript
const { Readable } = require('stream');
const https = require('https');

class PaginatedAPIStream extends Readable {
  constructor(baseUrl, options) {
    super({ objectMode: true, ...options });
    this.baseUrl = baseUrl;
    this.page = 1;
    this.done = false;
  }

  async _read() {
    if (this.done) return;

    try {
      const data = await this.fetchPage(this.page);

      if (data.results.length === 0) {
        this.push(null); // End stream
        this.done = true;
        return;
      }

      // Push each result
      for (const item of data.results) {
        if (!this.push(item)) {
          // Backpressure
          break;
        }
      }

      this.page++;
    } catch (err) {
      this.destroy(err);
    }
  }

  fetchPage(page) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}?page=${page}`;

      https.get(url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
      }).on('error', reject);
    });
  }
}
```

---

## Async _read()

### Using Async Operations

`_read()` can be synchronous or asynchronous:

```javascript
class AsyncReadable extends Readable {
  // Method 1: async/await
  async _read() {
    try {
      const data = await this.fetchData();
      this.push(data);
    } catch (err) {
      this.destroy(err);
    }
  }

  // Method 2: Promises
  _read() {
    this.fetchData()
      .then(data => this.push(data))
      .catch(err => this.destroy(err));
  }

  // Method 3: Callbacks
  _read() {
    this.fetchData((err, data) => {
      if (err) {
        this.destroy(err);
      } else {
        this.push(data);
      }
    });
  }
}
```

### Important: Don't Block

```javascript
// ❌ WRONG - synchronous loop can overflow stack
_read() {
  while (this.hasData()) {
    this.push(this.getData());
  }
  this.push(null);
}

// ✅ CORRECT - push one chunk per _read() call
_read() {
  if (this.hasData()) {
    this.push(this.getData());
  } else {
    this.push(null);
  }
}
```

---

## Object Mode

### Creating Object Streams

```javascript
const { Readable } = require('stream');

class ObjectStream extends Readable {
  constructor(options) {
    // Enable object mode
    super({ objectMode: true, ...options });
    this.counter = 0;
  }

  _read() {
    if (this.counter < 5) {
      // Push JavaScript objects
      this.push({
        id: this.counter,
        timestamp: Date.now(),
        message: `Item ${this.counter}`
      });
      this.counter++;
    } else {
      this.push(null);
    }
  }
}

// Usage
const stream = new ObjectStream();
stream.on('data', obj => {
  console.log('Got object:', obj);
});
```

**Key Difference:**
- Binary mode: chunks are Buffers or strings
- Object mode: chunks are JavaScript objects
- highWaterMark in object mode = number of objects (not bytes)

---

## Error Handling

### Emitting Errors

```javascript
class SafeReadable extends Readable {
  async _read() {
    try {
      const data = await this.fetchData();

      if (!data) {
        throw new Error('No data available');
      }

      this.push(data);
    } catch (err) {
      // Emit error and destroy stream
      this.destroy(err);
    }
  }
}

// Handle errors
const stream = new SafeReadable();
stream.on('error', err => {
  console.error('Stream error:', err.message);
});
```

### Validation

```javascript
_read() {
  const data = this.getData();

  // Validate before pushing
  if (!this.isValid(data)) {
    this.destroy(new Error('Invalid data'));
    return;
  }

  this.push(data);
}
```

---

## Advanced Patterns

### Pattern 1: Rate Limiting

```javascript
class RateLimitedStream extends Readable {
  constructor(source, ratePerSecond, options) {
    super(options);
    this.source = source;
    this.interval = 1000 / ratePerSecond;
    this.lastRead = 0;
  }

  _read() {
    const now = Date.now();
    const timeSinceLastRead = now - this.lastRead;

    if (timeSinceLastRead < this.interval) {
      // Too soon, wait
      setTimeout(() => this._read(), this.interval - timeSinceLastRead);
      return;
    }

    this.lastRead = now;
    const data = this.source.getData();

    if (data) {
      this.push(data);
    } else {
      this.push(null);
    }
  }
}
```

### Pattern 2: Buffered Reading

```javascript
class BufferedStream extends Readable {
  constructor(source, bufferSize, options) {
    super(options);
    this.source = source;
    this.bufferSize = bufferSize;
    this.buffer = [];
  }

  async _read() {
    // Fill buffer if empty
    if (this.buffer.length === 0) {
      this.buffer = await this.source.fetch(this.bufferSize);
    }

    if (this.buffer.length === 0) {
      this.push(null);
      return;
    }

    // Push from buffer
    const item = this.buffer.shift();
    this.push(item);
  }
}
```

### Pattern 3: Infinite Stream

```javascript
class InfiniteStream extends Readable {
  constructor(generator, options) {
    super(options);
    this.generator = generator;
  }

  _read() {
    // Never ends - always has data
    const data = this.generator();
    this.push(data);
  }
}

// Usage: Random number generator
const random = new InfiniteStream(() => {
  return `${Math.random()}\n`;
});

// Consumer controls when to stop
let count = 0;
random.on('data', data => {
  console.log(data);
  if (++count >= 10) {
    random.destroy(); // Stop the stream
  }
});
```

---

## Common Pitfalls

### Pitfall 1: Forgetting to End Stream

```javascript
// ❌ WRONG - stream never ends
class BrokenStream extends Readable {
  _read() {
    if (this.hasData()) {
      this.push(this.getData());
    }
    // Forgot to push null when done!
  }
}

// ✅ CORRECT
class WorkingStream extends Readable {
  _read() {
    if (this.hasData()) {
      this.push(this.getData());
    } else {
      this.push(null); // Signal end
    }
  }
}
```

### Pitfall 2: Ignoring Backpressure

```javascript
// ❌ WRONG - ignores backpressure
_read() {
  // Push all data at once
  while (this.hasData()) {
    this.push(this.getData()); // Ignoring return value
  }
}

// ✅ CORRECT - respects backpressure
_read() {
  // Push until buffer is full
  while (this.hasData()) {
    const canContinue = this.push(this.getData());
    if (!canContinue) break; // Buffer full, stop
  }
}
```

### Pitfall 3: Calling _read() Directly

```javascript
// ❌ WRONG - don't call _read()
const stream = new MyStream();
stream._read(); // DON'T DO THIS

// ✅ CORRECT - let stream manage calls
const stream = new MyStream();
stream.on('data', chunk => {
  // Stream calls _read() automatically
});
```

---

## Testing Your Readable Stream

### Unit Test Example

```javascript
const { Readable } = require('stream');
const assert = require('assert');

class TestStream extends Readable {
  constructor(data) {
    super();
    this.data = data;
    this.index = 0;
  }

  _read() {
    if (this.index < this.data.length) {
      this.push(this.data[this.index]);
      this.index++;
    } else {
      this.push(null);
    }
  }
}

// Test
async function testStream() {
  const data = ['a', 'b', 'c'];
  const stream = new TestStream(data);
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  assert.deepEqual(chunks, data);
  console.log('✓ Stream test passed');
}

testStream();
```

---

## Summary

### Key Takeaways

1. **Extend Readable class** and implement `_read()`
2. **Use push()** to add data to the stream
3. **Push null** to signal end of stream
4. **Handle backpressure** by checking push() return value
5. **Use destroy(err)** to emit errors
6. **Object mode** for streaming JavaScript objects
7. **Don't call _read()** yourself - stream manages it

### Implementation Checklist

When creating a Readable stream:

- [ ] Extend `Readable` class
- [ ] Implement `_read(size)` method
- [ ] Initialize state in `constructor()`
- [ ] Call `super(options)` with options
- [ ] Push data with `this.push(chunk)`
- [ ] Signal end with `this.push(null)`
- [ ] Handle errors with `this.destroy(err)`
- [ ] Respect backpressure (check push() return value)
- [ ] Never push after pushing null
- [ ] Use object mode if streaming objects

### Next Steps

Now that you can create Readable streams:
1. Learn [Creating Writable Streams](./02-creating-writable-streams.md)
2. Study the [examples](../examples/01-custom-readable.js)
3. Practice with [exercises](../exercises/exercise-1.js)

---

## Quick Reference

```javascript
const { Readable } = require('stream');

class MyReadable extends Readable {
  constructor(options) {
    super(options);
    // Initialize your state
  }

  _read(size) {
    // Fetch data from your source
    const chunk = this.getNextChunk();

    if (chunk) {
      // Push data into stream
      const canContinue = this.push(chunk);

      if (!canContinue) {
        // Backpressure - buffer full
        // Will be called again when ready
      }
    } else {
      // No more data - end stream
      this.push(null);
    }
  }
}

// Usage
const stream = new MyReadable();
stream.on('data', chunk => console.log(chunk));
stream.on('end', () => console.log('Done'));
stream.on('error', err => console.error(err));
```

Ready to create writable streams? Continue to [Creating Writable Streams](./02-creating-writable-streams.md)!
