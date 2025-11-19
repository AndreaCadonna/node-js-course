# Creating Transform Streams

## Introduction

This guide teaches you how to create custom Transform streams by extending the `Transform` class. Transform streams are both readable and writable—they consume data, transform it, and produce modified output. You'll learn how to implement `_transform()` and `_flush()`, manage state, and build powerful data processing pipelines.

By the end, you'll be able to create production-ready Transform streams for parsing, formatting, filtering, and any data transformation you need.

---

## Why Create Custom Transform Streams?

### The Power of Transformation

Transform streams sit in the middle of a pipeline:

```javascript
readable
  .pipe(transform)  // ← Your custom transformation
  .pipe(writable);
```

**Common Use Cases:**
- **Parsing**: CSV → Objects, JSON lines → Objects
- **Formatting**: Objects → JSON, data → XML
- **Filtering**: Remove unwanted data
- **Validation**: Check data and pass/reject
- **Encryption**: Plain text → Encrypted
- **Compression**: Uncompressed → Compressed
- **Aggregation**: Multiple records → Summary

**Built-in transforms are limited:**

```javascript
const zlib = require('zlib');
const crypto = require('crypto');

// Built-in transforms
stream.pipe(zlib.createGzip());
stream.pipe(crypto.createCipher('aes192', 'password'));
```

**Custom transforms let you handle:**
- Application-specific formats
- Business logic transformations
- Stateful processing
- Complex parsing/formatting

---

## The Transform Stream Mental Model

### Duplex Nature

Transform streams are both readable AND writable:

```
Input Side (Writable)          Output Side (Readable)
     ↓                                ↑
┌────────────────────────────────────────┐
│         Transform Stream               │
│                                        │
│   write() → _transform() → push()     │
│                                        │
│   Internal Buffer ← Internal Buffer    │
│                                        │
│   end() → _flush() → push(null)        │
└────────────────────────────────────────┘
```

**Data Flow:**
1. Data written to transform (writable side)
2. `_transform()` processes each chunk
3. Transformed data pushed to output (readable side)
4. On end, `_flush()` emits final data

---

## Basic Implementation

### Minimal Transform Stream

```javascript
const { Transform } = require('stream');

class SimpleTransform extends Transform {
  constructor(options) {
    super(options);
  }

  _transform(chunk, encoding, callback) {
    // Transform the chunk
    const transformed = chunk.toString().toUpperCase();

    // Push transformed data
    this.push(transformed);

    // Signal completion
    callback();
  }
}

// Usage
const transform = new SimpleTransform();

process.stdin
  .pipe(transform)
  .pipe(process.stdout);
```

**Input:** `hello world`
**Output:** `HELLO WORLD`

---

## The _transform() Method

### Method Signature

```javascript
_transform(chunk, encoding, callback)
```

**Parameters:**
1. **chunk**: Input data (Buffer or string)
2. **encoding**: If chunk is string, the encoding
3. **callback**: Function to call when done

**What you do:**
1. Process/transform the chunk
2. Call `this.push()` with transformed data
3. Call `callback()` to signal completion

### Key Differences from _write()

| Aspect | _write() (Writable) | _transform() (Transform) |
|--------|---------------------|--------------------------|
| Purpose | Consume data | Transform data |
| Output | No output | Push to readable side |
| Return | N/A | Can push multiple chunks |

### Pushing Multiple Chunks

```javascript
_transform(chunk, encoding, callback) {
  // Can push multiple times per chunk
  const lines = chunk.toString().split('\n');

  for (const line of lines) {
    if (line.trim()) {
      this.push(line.toUpperCase() + '\n');
    }
  }

  callback();
}
```

### Pushing Nothing

```javascript
_transform(chunk, encoding, callback) {
  // Filter - don't push if not wanted
  if (this.shouldInclude(chunk)) {
    this.push(chunk);
  }
  // Even if not pushing, must call callback
  callback();
}
```

---

## The _flush() Method

### Final Data Processing

```javascript
_flush(callback) {
  // Called when:
  // 1. Input stream ends
  // 2. All chunks processed via _transform()
  // 3. Before output stream emits 'end'

  // Use for:
  // - Emitting buffered data
  // - Final calculations
  // - Cleanup operations

  callback(); // MUST call when done
}
```

### Example: Buffering Transform

```javascript
class LineCounter extends Transform {
  constructor(options) {
    super(options);
    this.lineCount = 0;
  }

  _transform(chunk, encoding, callback) {
    // Count lines
    const lines = chunk.toString().split('\n').length - 1;
    this.lineCount += lines;

    // Pass through unchanged
    this.push(chunk);
    callback();
  }

  _flush(callback) {
    // Emit final count
    this.push(`\n--- Total lines: ${this.lineCount} ---\n`);
    callback();
  }
}
```

---

## Practical Examples

### Example 1: CSV to JSON Transform

```javascript
const { Transform } = require('stream');

class CSVToJSON extends Transform {
  constructor(options) {
    super({ ...options, objectMode: true });
    this.headers = null;
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    // Add chunk to buffer
    this.buffer += chunk.toString();

    // Split into lines
    const lines = this.buffer.split('\n');

    // Keep incomplete line in buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      if (!this.headers) {
        // First line is headers
        this.headers = line.split(',').map(h => h.trim());
      } else {
        // Parse data line
        const values = line.split(',').map(v => v.trim());
        const obj = {};

        this.headers.forEach((header, i) => {
          obj[header] = values[i];
        });

        this.push(obj);
      }
    }

    callback();
  }

  _flush(callback) {
    // Process any remaining data
    if (this.buffer.trim() && this.headers) {
      const values = this.buffer.split(',').map(v => v.trim());
      const obj = {};

      this.headers.forEach((header, i) => {
        obj[header] = values[i];
      });

      this.push(obj);
    }

    callback();
  }
}

// Usage
const fs = require('fs');
const parser = new CSVToJSON();

fs.createReadStream('data.csv')
  .pipe(parser)
  .on('data', obj => {
    console.log('Parsed object:', obj);
  });
```

### Example 2: JSON Stringify Transform

```javascript
const { Transform } = require('stream');

class JSONStringify extends Transform {
  constructor(options) {
    super({ ...options, readableObjectMode: false, writableObjectMode: true });
    this.first = true;
  }

  _transform(obj, encoding, callback) {
    try {
      // Add comma before all items except first
      const prefix = this.first ? '' : ',\n';
      this.first = false;

      // Convert object to JSON
      const json = prefix + JSON.stringify(obj, null, 2);

      this.push(json);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    // Close JSON array
    this.push('\n');
    callback();
  }
}

// Usage
const stringify = new JSONStringify();

stringify.write({ id: 1, name: 'Alice' });
stringify.write({ id: 2, name: 'Bob' });
stringify.end();

stringify.pipe(process.stdout);
```

### Example 3: Filter Transform

```javascript
const { Transform } = require('stream');

class FilterTransform extends Transform {
  constructor(predicate, options) {
    super({ ...options, objectMode: true });
    this.predicate = predicate;
    this.filtered = 0;
    this.passed = 0;
  }

  _transform(obj, encoding, callback) {
    if (this.predicate(obj)) {
      this.passed++;
      this.push(obj);
    } else {
      this.filtered++;
    }

    callback();
  }

  _flush(callback) {
    console.error(`Stats: ${this.passed} passed, ${this.filtered} filtered`);
    callback();
  }
}

// Usage: Filter even numbers
const filter = new FilterTransform(n => n % 2 === 0);

[1, 2, 3, 4, 5, 6].forEach(n => filter.write(n));
filter.end();

filter.on('data', n => console.log('Even:', n));
```

### Example 4: Aggregation Transform

```javascript
const { Transform } = require('stream');

class SumTransform extends Transform {
  constructor(options) {
    super({ ...options, objectMode: true });
    this.sum = 0;
    this.count = 0;
  }

  _transform(number, encoding, callback) {
    this.sum += number;
    this.count++;

    // Pass through
    this.push(number);

    callback();
  }

  _flush(callback) {
    // Emit final statistics
    const avg = this.count > 0 ? this.sum / this.count : 0;

    this.push({
      sum: this.sum,
      count: this.count,
      average: avg
    });

    callback();
  }
}
```

---

## Stateful Transforms

### Maintaining State Between Chunks

```javascript
class StatefulParser extends Transform {
  constructor(options) {
    super(options);
    // State persists across _transform() calls
    this.buffer = '';
    this.recordCount = 0;
    this.inBlock = false;
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();

    // Process based on current state
    while (this.buffer.length > 0) {
      if (!this.inBlock) {
        // Look for block start
        const startIdx = this.buffer.indexOf('<START>');
        if (startIdx === -1) break;

        this.buffer = this.buffer.slice(startIdx + 7);
        this.inBlock = true;
      } else {
        // Look for block end
        const endIdx = this.buffer.indexOf('<END>');
        if (endIdx === -1) break;

        const record = this.buffer.slice(0, endIdx);
        this.buffer = this.buffer.slice(endIdx + 5);
        this.inBlock = false;

        this.recordCount++;
        this.push(record);
      }
    }

    callback();
  }

  _flush(callback) {
    // Handle incomplete data
    if (this.buffer.length > 0) {
      console.error('Warning: incomplete data at end');
    }

    console.error(`Processed ${this.recordCount} records`);
    callback();
  }
}
```

---

## Object Mode Combinations

### Different Modes for Input/Output

```javascript
// Write objects, read strings
const transform = new Transform({
  writableObjectMode: true,  // Accept objects
  readableObjectMode: false  // Emit strings/buffers
});

// Write strings, read objects
const transform = new Transform({
  writableObjectMode: false, // Accept strings/buffers
  readableObjectMode: true   // Emit objects
});

// Both sides objects (most common)
const transform = new Transform({
  objectMode: true  // Shorthand for both sides
});
```

### Example: Object to CSV Line

```javascript
class ObjectToCSV extends Transform {
  constructor(fields, options) {
    super({
      writableObjectMode: true,  // Input: objects
      readableObjectMode: false, // Output: strings
      ...options
    });
    this.fields = fields;
    this.headerWritten = false;
  }

  _transform(obj, encoding, callback) {
    if (!this.headerWritten) {
      // Write header
      this.push(this.fields.join(',') + '\n');
      this.headerWritten = true;
    }

    // Write data row
    const values = this.fields.map(field => obj[field] || '');
    this.push(values.join(',') + '\n');

    callback();
  }
}

// Usage
const toCSV = new ObjectToCSV(['id', 'name', 'email']);

toCSV.write({ id: 1, name: 'Alice', email: 'alice@example.com' });
toCSV.write({ id: 2, name: 'Bob', email: 'bob@example.com' });
toCSV.end();

toCSV.pipe(process.stdout);
```

---

## Error Handling

### Handling Errors in _transform()

```javascript
class SafeTransform extends Transform {
  _transform(chunk, encoding, callback) {
    try {
      const data = JSON.parse(chunk);

      // Validate
      if (!this.isValid(data)) {
        throw new Error('Invalid data format');
      }

      // Transform
      const transformed = this.transformData(data);

      this.push(transformed);
      callback();
    } catch (err) {
      // Pass error to callback
      callback(err);
    }
  }

  isValid(data) {
    return data && typeof data === 'object';
  }

  transformData(data) {
    return JSON.stringify(data);
  }
}
```

### Continue on Error

```javascript
class ResilientTransform extends Transform {
  constructor(options) {
    super(options);
    this.errorCount = 0;
  }

  _transform(chunk, encoding, callback) {
    try {
      const result = this.processChunk(chunk);
      this.push(result);
      callback();
    } catch (err) {
      // Log error but don't fail stream
      this.errorCount++;
      console.error(`Error ${this.errorCount}:`, err.message);

      // Skip this chunk and continue
      callback();
    }
  }

  _flush(callback) {
    if (this.errorCount > 0) {
      console.error(`Total errors: ${this.errorCount}`);
    }
    callback();
  }
}
```

---

## Advanced Patterns

### Pattern 1: Multi-Chunk Transform

```javascript
class ChunkSplitter extends Transform {
  constructor(chunkSize, options) {
    super(options);
    this.chunkSize = chunkSize;
    this.buffer = Buffer.alloc(0);
  }

  _transform(chunk, encoding, callback) {
    // Add to buffer
    this.buffer = Buffer.concat([this.buffer, chunk]);

    // Emit fixed-size chunks
    while (this.buffer.length >= this.chunkSize) {
      const outputChunk = this.buffer.slice(0, this.chunkSize);
      this.buffer = this.buffer.slice(this.chunkSize);
      this.push(outputChunk);
    }

    callback();
  }

  _flush(callback) {
    // Emit remaining data
    if (this.buffer.length > 0) {
      this.push(this.buffer);
    }
    callback();
  }
}
```

### Pattern 2: Async Transform

```javascript
class AsyncTransform extends Transform {
  constructor(asyncProcessor, options) {
    super({ ...options, objectMode: true });
    this.processor = asyncProcessor;
  }

  async _transform(data, encoding, callback) {
    try {
      // Async processing
      const result = await this.processor(data);

      if (result !== null) {
        this.push(result);
      }

      callback();
    } catch (err) {
      callback(err);
    }
  }
}

// Usage: API enrichment
const enricher = new AsyncTransform(async (user) => {
  // Fetch additional data from API
  const details = await fetchUserDetails(user.id);
  return { ...user, ...details };
});
```

### Pattern 3: Batching Transform

```javascript
class BatchTransform extends Transform {
  constructor(batchSize, options) {
    super({ ...options, objectMode: true });
    this.batchSize = batchSize;
    this.batch = [];
  }

  _transform(item, encoding, callback) {
    this.batch.push(item);

    if (this.batch.length >= this.batchSize) {
      // Emit batch
      this.push([...this.batch]);
      this.batch = [];
    }

    callback();
  }

  _flush(callback) {
    // Emit remaining items
    if (this.batch.length > 0) {
      this.push(this.batch);
    }
    callback();
  }
}

// Usage
const batcher = new BatchTransform(3);

[1, 2, 3, 4, 5, 6, 7].forEach(n => batcher.write(n));
batcher.end();

batcher.on('data', batch => {
  console.log('Batch:', batch); // [1,2,3], [4,5,6], [7]
});
```

---

## Performance Optimization

### Minimize Object Creation

```javascript
// ❌ Less efficient - creates new objects
_transform(chunk, encoding, callback) {
  const str = chunk.toString();
  const upper = str.toUpperCase();
  const buffer = Buffer.from(upper);
  this.push(buffer);
  callback();
}

// ✅ More efficient - minimize conversions
_transform(chunk, encoding, callback) {
  // Work with buffers directly when possible
  this.push(chunk);
  callback();
}
```

### Batch Operations

```javascript
class EfficientTransform extends Transform {
  constructor(options) {
    super(options);
    this.buffer = [];
    this.batchSize = 100;
  }

  _transform(item, encoding, callback) {
    this.buffer.push(item);

    if (this.buffer.length >= this.batchSize) {
      // Process batch at once
      const results = this.processBatch(this.buffer);
      results.forEach(r => this.push(r));
      this.buffer = [];
    }

    callback();
  }

  processBatch(items) {
    // More efficient than one-by-one
    return items.map(item => this.transformItem(item));
  }
}
```

---

## Common Pitfalls

### Pitfall 1: Not Calling Callback

```javascript
// ❌ WRONG
_transform(chunk, encoding, callback) {
  this.push(chunk.toString().toUpperCase());
  // Forgot callback!
}

// ✅ CORRECT
_transform(chunk, encoding, callback) {
  this.push(chunk.toString().toUpperCase());
  callback();
}
```

### Pitfall 2: Losing Data in Buffer

```javascript
// ❌ WRONG - loses data
_transform(chunk, encoding, callback) {
  const lines = chunk.toString().split('\n');
  lines.forEach(line => this.push(line + '\n'));
  callback();
}
// Problem: Last line might not end with \n

// ✅ CORRECT - buffer incomplete data
_transform(chunk, encoding, callback) {
  this.buffer += chunk.toString();
  const lines = this.buffer.split('\n');
  this.buffer = lines.pop() || ''; // Keep incomplete line

  lines.forEach(line => this.push(line + '\n'));
  callback();
}

_flush(callback) {
  if (this.buffer) {
    this.push(this.buffer + '\n');
  }
  callback();
}
```

### Pitfall 3: Mixing Modes Incorrectly

```javascript
// ❌ WRONG - objectMode conflict
const transform = new Transform({ objectMode: true });

_transform(chunk, encoding, callback) {
  // Chunk is already an object, but treating as buffer
  const str = chunk.toString(); // Error!
  this.push(str);
  callback();
}

// ✅ CORRECT - handle based on mode
const transform = new Transform({ objectMode: true });

_transform(obj, encoding, callback) {
  // obj is a JavaScript object
  const processed = this.processObject(obj);
  this.push(processed);
  callback();
}
```

---

## Testing Transform Streams

### Unit Test Example

```javascript
const { Transform } = require('stream');
const assert = require('assert');

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}

async function testTransform() {
  const transform = new UpperCaseTransform();
  const input = ['hello', 'world'];
  const output = [];

  for (const data of input) {
    transform.write(data);
  }
  transform.end();

  for await (const chunk of transform) {
    output.push(chunk.toString());
  }

  assert.deepEqual(output, ['HELLO', 'WORLD']);
  console.log('✓ Transform test passed');
}

testTransform();
```

---

## Summary

### Key Takeaways

1. **Transform = Readable + Writable** combined
2. **Implement _transform()** to process each chunk
3. **Implement _flush()** for final data/cleanup
4. **Call push()** to emit transformed data
5. **Call callback()** when processing complete
6. **Handle both object and binary modes**
7. **Maintain state** across chunks when needed
8. **Buffer incomplete data** and emit in _flush()

### Implementation Checklist

- [ ] Extend `Transform` class
- [ ] Implement `_transform(chunk, encoding, callback)`
- [ ] Implement `_flush(callback)` if needed
- [ ] Call `push()` for output
- [ ] Call `callback()` when done
- [ ] Handle errors properly
- [ ] Choose correct mode (object/binary)
- [ ] Buffer incomplete data if needed
- [ ] Test with various inputs

### Next Steps

1. Learn [Understanding Backpressure](./04-understanding-backpressure.md)
2. Study the [examples](../examples/05-custom-transform.js)
3. Practice with [exercises](../exercises/exercise-3.js)

---

## Quick Reference

```javascript
const { Transform } = require('stream');

class MyTransform extends Transform {
  constructor(options) {
    super(options);
    // Initialize state
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    try {
      // Transform the chunk
      const transformed = this.processChunk(chunk);

      // Push output
      this.push(transformed);

      // Signal completion
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    try {
      // Emit any buffered data
      if (this.buffer) {
        this.push(this.buffer);
      }

      callback();
    } catch (err) {
      callback(err);
    }
  }
}

// Usage
const transform = new MyTransform();
input.pipe(transform).pipe(output);
```

Ready to understand backpressure? Continue to [Understanding Backpressure](./04-understanding-backpressure.md)!
