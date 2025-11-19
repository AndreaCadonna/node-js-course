# Creating Writable Streams

## Introduction

This guide teaches you how to create custom Writable streams by extending the `Writable` class. You'll learn how to implement the `_write()` method, handle callbacks properly, manage internal state, and use `_final()` for cleanup.

By the end, you'll be able to create production-ready Writable streams for any destination—databases, APIs, files, or custom protocols.

---

## Why Create Custom Writable Streams?

### Built-in Writables Are Limited

Node.js provides built-in writable streams:

```javascript
const fs = require('fs');
const http = require('http');

// Built-in writable streams
const fileStream = fs.createWriteStream('output.txt');
const httpResponse = http.createServer((req, res) => {
  res.write('data'); // res is writable
});
```

But what if you need to write to:
- A database with batch inserts
- A REST API with rate limiting
- Multiple destinations at once
- A custom protocol or format
- A logging service with formatting

**Answer:** Create your own custom Writable stream.

---

## The Writable Stream Mental Model

### How Data Flows

```
┌─────────────────────┐
│   Data Producer     │
│   (write() calls)   │
└──────────┬──────────┘
           │ write(chunk)
           ↓
┌──────────────────────┐
│  Internal Buffer     │ ← highWaterMark limit
│  [■■■■□□□□□□]       │
└──────────┬───────────┘
           │ drain one by one
           ↓
┌──────────────────────┐
│   Your _write()      │ ← You implement this
│   (process chunk)    │
└──────────┬───────────┘
           │ callback()
           ↓
┌──────────────────────┐
│   Destination        │
│   (DB, API, etc)     │
└──────────────────────┘
```

**Key Points:**
1. Producer **writes** data to stream
2. Stream buffers data internally
3. Stream calls your `_write()` for each chunk
4. You **must** call callback when done
5. Stream manages flow control automatically

---

## Basic Implementation

### Minimal Writable Stream

Here's the simplest custom Writable stream:

```javascript
const { Writable } = require('stream');

class SimpleWritable extends Writable {
  constructor(options) {
    super(options);
    this.chunks = [];
  }

  _write(chunk, encoding, callback) {
    // Process the chunk
    console.log('Received:', chunk.toString());
    this.chunks.push(chunk);

    // MUST call callback when done
    callback();
  }

  _final(callback) {
    // Called when stream ends
    console.log('Total chunks:', this.chunks.length);
    callback();
  }
}

// Usage
const stream = new SimpleWritable();
stream.write('Hello\n');
stream.write('World\n');
stream.end('Goodbye\n');
```

**Output:**
```
Received: Hello
Received: World
Received: Goodbye
Total chunks: 3
```

---

## The _write() Method

### Method Signature

```javascript
_write(chunk, encoding, callback)
```

**Parameters:**
1. **chunk**: The data to write (Buffer or string)
2. **encoding**: If chunk is string, this is the encoding (e.g., 'utf8')
3. **callback**: Function to call when processing is complete

### When Is _write() Called?

The stream calls `_write()`:
1. When producer calls `write()`
2. One chunk at a time (serial, not parallel)
3. Only after previous callback was called
4. Never called after stream ends

**Important:** Don't call `_write()` yourself. The stream manages when to call it.

---

## The Callback Pattern

### Why Callbacks Matter

```javascript
_write(chunk, encoding, callback) {
  // Process the chunk
  this.processChunk(chunk);

  // MUST call callback!
  callback();
}
```

**What happens if you don't call callback:**
- Stream freezes
- No more `_write()` calls
- Backpressure never releases
- Memory leak from buffered data

### Callback Signatures

```javascript
// Success - no error
callback();

// Error - pass error object
callback(new Error('Failed to write'));

// Only these two forms are valid
// Never pass other arguments
```

### Async Operations

```javascript
class AsyncWritable extends Writable {
  // Method 1: async/await
  async _write(chunk, encoding, callback) {
    try {
      await this.saveToDatabase(chunk);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  // Method 2: Promises
  _write(chunk, encoding, callback) {
    this.saveToDatabase(chunk)
      .then(() => callback())
      .catch(err => callback(err));
  }

  // Method 3: Callbacks
  _write(chunk, encoding, callback) {
    this.saveToDatabase(chunk, (err) => {
      callback(err);
    });
  }
}
```

---

## The _final() Method

### Cleanup on Stream End

```javascript
_final(callback) {
  // Called when:
  // 1. stream.end() is called
  // 2. All buffered chunks have been written
  // 3. Before 'finish' event is emitted

  // Use for:
  // - Flushing buffers
  // - Closing connections
  // - Writing footers
  // - Cleanup operations

  callback(); // MUST call when done
}
```

### Example: Batch Writer

```javascript
class BatchWritable extends Writable {
  constructor(options) {
    super(options);
    this.batch = [];
    this.batchSize = 100;
  }

  _write(chunk, encoding, callback) {
    // Add to batch
    this.batch.push(chunk);

    if (this.batch.length >= this.batchSize) {
      // Flush full batch
      this.flushBatch((err) => {
        callback(err);
      });
    } else {
      // Not full yet, continue
      callback();
    }
  }

  _final(callback) {
    // Flush remaining items
    if (this.batch.length > 0) {
      this.flushBatch(callback);
    } else {
      callback();
    }
  }

  flushBatch(callback) {
    console.log(`Flushing ${this.batch.length} items`);
    // Simulate database write
    setTimeout(() => {
      this.batch = [];
      callback();
    }, 100);
  }
}
```

---

## Practical Examples

### Example 1: Database Writer

```javascript
const { Writable } = require('stream');

class DatabaseWriter extends Writable {
  constructor(tableName, options) {
    super({ objectMode: true, ...options });
    this.tableName = tableName;
    this.batch = [];
    this.batchSize = 50;
  }

  _write(record, encoding, callback) {
    // Add record to batch
    this.batch.push(record);

    if (this.batch.length >= this.batchSize) {
      // Batch full - insert now
      this.insertBatch()
        .then(() => callback())
        .catch(err => callback(err));
    } else {
      // Batch not full - continue
      callback();
    }
  }

  _final(callback) {
    // Insert remaining records
    if (this.batch.length > 0) {
      this.insertBatch()
        .then(() => callback())
        .catch(err => callback(err));
    } else {
      callback();
    }
  }

  async insertBatch() {
    console.log(`Inserting ${this.batch.length} records into ${this.tableName}`);

    // Simulate database insert
    // In real code: await db.insert(this.tableName, this.batch)
    await new Promise(resolve => setTimeout(resolve, 100));

    this.batch = [];
  }
}

// Usage
const writer = new DatabaseWriter('users');
writer.write({ id: 1, name: 'Alice' });
writer.write({ id: 2, name: 'Bob' });
writer.end({ id: 3, name: 'Charlie' });
```

### Example 2: API Writer with Rate Limiting

```javascript
const { Writable } = require('stream');

class APIWriter extends Writable {
  constructor(endpoint, options) {
    super({ objectMode: true, ...options });
    this.endpoint = endpoint;
    this.requestsPerSecond = 10;
    this.interval = 1000 / this.requestsPerSecond;
    this.lastRequest = 0;
  }

  async _write(data, encoding, callback) {
    try {
      // Rate limiting
      await this.rateLimit();

      // Send to API
      await this.sendToAPI(data);

      callback();
    } catch (err) {
      callback(err);
    }
  }

  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.interval) {
      // Wait to maintain rate limit
      const delay = this.interval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequest = Date.now();
  }

  async sendToAPI(data) {
    console.log(`POST ${this.endpoint}:`, data);
    // Simulate API call
    // In real code: await fetch(this.endpoint, { method: 'POST', body: JSON.stringify(data) })
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
```

### Example 3: Multi-Destination Writer

```javascript
const { Writable } = require('stream');

class MultiWriter extends Writable {
  constructor(destinations, options) {
    super(options);
    this.destinations = destinations; // Array of writable streams
  }

  _write(chunk, encoding, callback) {
    let pending = this.destinations.length;
    let error = null;

    // Write to all destinations
    this.destinations.forEach(dest => {
      dest.write(chunk, encoding, (err) => {
        if (err && !error) error = err;

        pending--;
        if (pending === 0) {
          callback(error);
        }
      });
    });
  }

  _final(callback) {
    let pending = this.destinations.length;
    let error = null;

    // End all destinations
    this.destinations.forEach(dest => {
      dest.end((err) => {
        if (err && !error) error = err;

        pending--;
        if (pending === 0) {
          callback(error);
        }
      });
    });
  }
}

// Usage
const fs = require('fs');
const multi = new MultiWriter([
  fs.createWriteStream('output1.txt'),
  fs.createWriteStream('output2.txt'),
  process.stdout
]);

multi.write('Hello from multi-writer\n');
multi.end();
```

---

## Object Mode

### Writing JavaScript Objects

```javascript
const { Writable } = require('stream');

class JSONLWriter extends Writable {
  constructor(filePath, options) {
    super({ objectMode: true, ...options });
    this.file = fs.createWriteStream(filePath);
  }

  _write(obj, encoding, callback) {
    // Convert object to JSON Line format
    const line = JSON.stringify(obj) + '\n';

    this.file.write(line, callback);
  }

  _final(callback) {
    this.file.end(callback);
  }
}

// Usage
const writer = new JSONLWriter('output.jsonl');
writer.write({ id: 1, name: 'Alice' });
writer.write({ id: 2, name: 'Bob' });
writer.end();
```

---

## Error Handling

### Handling Errors in _write()

```javascript
class SafeWritable extends Writable {
  _write(chunk, encoding, callback) {
    try {
      // Validate
      if (!this.isValid(chunk)) {
        throw new Error('Invalid chunk');
      }

      // Process
      this.processChunk(chunk);

      callback(); // Success
    } catch (err) {
      callback(err); // Pass error to callback
    }
  }

  isValid(chunk) {
    return chunk && chunk.length > 0;
  }

  processChunk(chunk) {
    // Process logic
  }
}

// Handle errors
const stream = new SafeWritable();
stream.on('error', err => {
  console.error('Stream error:', err.message);
});

stream.write('valid data');
stream.write(''); // Will cause error
```

### Error Recovery

```javascript
class RetryWriter extends Writable {
  constructor(maxRetries = 3, options) {
    super(options);
    this.maxRetries = maxRetries;
  }

  async _write(chunk, encoding, callback) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await this.writeChunk(chunk);
        callback(); // Success
        return;
      } catch (err) {
        lastError = err;
        console.log(`Attempt ${attempt + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // All retries failed
    callback(lastError);
  }

  async writeChunk(chunk) {
    // Simulated write that might fail
    if (Math.random() < 0.5) {
      throw new Error('Write failed');
    }
  }
}
```

---

## Backpressure Handling

### Understanding write() Return Value

```javascript
const stream = new MyWritable();

const canContinue = stream.write('data');

if (!canContinue) {
  // Buffer is full - backpressure!
  // Should pause producing data

  stream.once('drain', () => {
    // Buffer drained - safe to continue
    console.log('Can write again');
  });
}
```

### Implementing Cork/Uncork

```javascript
class CorkableWriter extends Writable {
  _write(chunk, encoding, callback) {
    // Normal write
    this.processChunk(chunk);
    callback();
  }

  writeMultiple(chunks) {
    // Cork to buffer all writes
    this.cork();

    chunks.forEach(chunk => {
      this.write(chunk);
    });

    // Uncork to flush all at once
    this.uncork();
  }

  processChunk(chunk) {
    console.log('Processing:', chunk.toString());
  }
}
```

---

## Advanced Patterns

### Pattern 1: Stateful Writer

```javascript
class StatefulWriter extends Writable {
  constructor(options) {
    super(options);
    this.lineCount = 0;
    this.byteCount = 0;
    this.headerWritten = false;
  }

  _write(chunk, encoding, callback) {
    // Write header on first write
    if (!this.headerWritten) {
      this.writeHeader();
      this.headerWritten = true;
    }

    // Update statistics
    this.byteCount += chunk.length;
    this.lineCount += chunk.toString().split('\n').length - 1;

    // Process chunk
    this.processChunk(chunk);

    callback();
  }

  _final(callback) {
    // Write footer with statistics
    this.writeFooter();
    callback();
  }

  writeHeader() {
    console.log('=== Begin ===');
  }

  writeFooter() {
    console.log('=== End ===');
    console.log(`Lines: ${this.lineCount}`);
    console.log(`Bytes: ${this.byteCount}`);
  }

  processChunk(chunk) {
    console.log(chunk.toString());
  }
}
```

### Pattern 2: Transform Before Write

```javascript
class TransformWriter extends Writable {
  constructor(transformer, destination, options) {
    super(options);
    this.transformer = transformer;
    this.destination = destination;
  }

  _write(chunk, encoding, callback) {
    // Transform the chunk
    const transformed = this.transformer(chunk);

    // Write transformed data
    this.destination.write(transformed, callback);
  }

  _final(callback) {
    this.destination.end(callback);
  }
}

// Usage: Write uppercase to file
const fs = require('fs');
const upper = new TransformWriter(
  chunk => chunk.toString().toUpperCase(),
  fs.createWriteStream('output.txt')
);

upper.write('hello\n');
upper.end('world\n');
```

### Pattern 3: Conditional Writer

```javascript
class FilterWriter extends Writable {
  constructor(predicate, destination, options) {
    super(options);
    this.predicate = predicate;
    this.destination = destination;
    this.filtered = 0;
  }

  _write(chunk, encoding, callback) {
    // Only write if predicate passes
    if (this.predicate(chunk)) {
      this.destination.write(chunk, callback);
    } else {
      this.filtered++;
      callback(); // Skip, but signal completion
    }
  }

  _final(callback) {
    console.log(`Filtered ${this.filtered} chunks`);
    this.destination.end(callback);
  }
}

// Usage: Only write lines containing "ERROR"
const filter = new FilterWriter(
  chunk => chunk.toString().includes('ERROR'),
  process.stdout
);

filter.write('INFO: Starting\n');
filter.write('ERROR: Failed\n');
filter.write('INFO: Done\n');
filter.end();
```

---

## Common Pitfalls

### Pitfall 1: Not Calling Callback

```javascript
// ❌ WRONG - callback never called
class BrokenWriter extends Writable {
  _write(chunk, encoding, callback) {
    this.processChunk(chunk);
    // Forgot to call callback!
  }
}

// Stream will freeze after first write

// ✅ CORRECT - always call callback
class WorkingWriter extends Writable {
  _write(chunk, encoding, callback) {
    this.processChunk(chunk);
    callback(); // Always call it!
  }
}
```

### Pitfall 2: Calling Callback Multiple Times

```javascript
// ❌ WRONG - callback called twice
_write(chunk, encoding, callback) {
  callback(); // First call

  this.processAsync().then(() => {
    callback(); // Second call - ERROR!
  });
}

// ✅ CORRECT - call once
_write(chunk, encoding, callback) {
  this.processAsync()
    .then(() => callback())
    .catch(err => callback(err));
}
```

### Pitfall 3: Synchronous Errors Not Caught

```javascript
// ❌ WRONG - error not passed to callback
_write(chunk, encoding, callback) {
  const data = JSON.parse(chunk); // Might throw
  this.process(data);
  callback();
}

// ✅ CORRECT - catch and pass to callback
_write(chunk, encoding, callback) {
  try {
    const data = JSON.parse(chunk);
    this.process(data);
    callback();
  } catch (err) {
    callback(err);
  }
}
```

---

## Testing Your Writable Stream

### Unit Test Example

```javascript
const { Writable } = require('stream');
const assert = require('assert');

class TestWriter extends Writable {
  constructor() {
    super();
    this.chunks = [];
  }

  _write(chunk, encoding, callback) {
    this.chunks.push(chunk.toString());
    callback();
  }
}

// Test
async function testWriter() {
  const writer = new TestWriter();

  writer.write('a');
  writer.write('b');
  writer.write('c');
  writer.end();

  // Wait for finish
  await new Promise(resolve => writer.on('finish', resolve));

  assert.deepEqual(writer.chunks, ['a', 'b', 'c']);
  console.log('✓ Writer test passed');
}

testWriter();
```

---

## Summary

### Key Takeaways

1. **Extend Writable class** and implement `_write()`
2. **Always call callback** when chunk is processed
3. **Call callback(err)** if error occurs
4. **Implement _final()** for cleanup
5. **Use object mode** for JavaScript objects
6. **Respect backpressure** signals from write() return value
7. **Handle errors** properly in async operations

### Implementation Checklist

When creating a Writable stream:

- [ ] Extend `Writable` class
- [ ] Implement `_write(chunk, encoding, callback)`
- [ ] Always call callback (exactly once)
- [ ] Implement `_final(callback)` for cleanup
- [ ] Handle errors in try/catch
- [ ] Pass errors to callback
- [ ] Use object mode if writing objects
- [ ] Test error conditions
- [ ] Handle backpressure in producer code

### Next Steps

Now that you can create Writable streams:
1. Learn [Creating Transform Streams](./03-creating-transform-streams.md)
2. Study the [examples](../examples/03-custom-writable.js)
3. Practice with [exercises](../exercises/exercise-2.js)

---

## Quick Reference

```javascript
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    super(options);
    // Initialize your state
  }

  _write(chunk, encoding, callback) {
    try {
      // Process the chunk
      this.processChunk(chunk);

      // Signal success
      callback();
    } catch (err) {
      // Signal error
      callback(err);
    }
  }

  _final(callback) {
    try {
      // Cleanup/flush operations
      this.cleanup();

      callback();
    } catch (err) {
      callback(err);
    }
  }
}

// Usage
const stream = new MyWritable();
stream.on('error', err => console.error(err));
stream.on('finish', () => console.log('Done'));

stream.write('data');
stream.end('final data');
```

Ready to create transform streams? Continue to [Creating Transform Streams](./03-creating-transform-streams.md)!
