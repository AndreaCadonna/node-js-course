# Object Mode Streams

## Introduction

By default, streams work with Buffers and strings (binary data). But often you want to stream JavaScript objects—like database rows, JSON records, or structured data. That's where **object mode** comes in.

This guide explains what object mode is, when to use it, how to create object streams, and the performance considerations you need to know.

---

## What Is Object Mode?

### Binary vs Object Mode

**Binary Mode (default):**
```javascript
const stream = new Readable();

stream.push('Hello');           // String → Buffer
stream.push(Buffer.from([1,2])); // Buffer
// highWaterMark in BYTES (16384 = 16 KB)
```

**Object Mode:**
```javascript
const stream = new Readable({ objectMode: true });

stream.push({ id: 1, name: 'Alice' }); // JavaScript object
stream.push([1, 2, 3]);                 // Array
stream.push(new Date());                // Date
stream.push(null);                      // Still signals end
// highWaterMark in NUMBER OF OBJECTS (16 objects)
```

### Key Differences

| Aspect | Binary Mode | Object Mode |
|--------|-------------|-------------|
| **Data Type** | Buffer/String | Any JavaScript value |
| **highWaterMark** | Bytes (16384) | Objects (16) |
| **Encoding** | Matters | Ignored |
| **Use Case** | Files, network | Database, processing |

---

## Why Use Object Mode?

### Problem: Working with Structured Data

**Without object mode (painful):**

```javascript
// Have to serialize/deserialize manually
const data = { id: 1, name: 'Alice', email: 'alice@example.com' };

// Readable
stream.push(JSON.stringify(data) + '\n'); // Object → String

// Transform
const line = chunk.toString();
const obj = JSON.parse(line); // String → Object

// Writable
const data = JSON.parse(chunk.toString()); // String → Object
```

**With object mode (easy):**

```javascript
// Work with objects directly
const data = { id: 1, name: 'Alice', email: 'alice@example.com' };

// Readable
stream.push(data); // Object directly!

// Transform
const processed = { ...obj, processed: true }; // Work with object
this.push(processed);

// Writable
console.log(obj.name); // Access properties directly
```

### When to Use Object Mode

**Use object mode when:**
- Streaming database rows
- Processing JSON records
- Working with structured data
- Building data processing pipelines
- Transforming between formats

**Don't use object mode when:**
- Reading/writing files (use binary)
- Network I/O (use binary)
- Working with buffers/strings
- Interfacing with non-Node.js systems

---

## Creating Object Mode Streams

### Readable Object Stream

```javascript
const { Readable } = require('stream');

class UserStream extends Readable {
  constructor(users, options) {
    super({ objectMode: true, ...options });
    this.users = users;
    this.index = 0;
  }

  _read() {
    if (this.index < this.users.length) {
      // Push object directly
      this.push(this.users[this.index]);
      this.index++;
    } else {
      // Signal end
      this.push(null);
    }
  }
}

// Usage
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
];

const stream = new UserStream(users);

stream.on('data', (user) => {
  console.log('User:', user); // Receives object directly
});
```

### Writable Object Stream

```javascript
const { Writable } = require('stream');

class UserLogger extends Writable {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.count = 0;
  }

  _write(user, encoding, callback) {
    // Receive object directly
    this.count++;
    console.log(`${this.count}. ${user.name} (ID: ${user.id})`);
    callback();
  }

  _final(callback) {
    console.log(`Logged ${this.count} users`);
    callback();
  }
}

// Usage
const logger = new UserLogger();

logger.write({ id: 1, name: 'Alice' });
logger.write({ id: 2, name: 'Bob' });
logger.end({ id: 3, name: 'Charlie' });
```

### Transform Object Stream

```javascript
const { Transform } = require('stream');

class UserEnricher extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
  }

  _transform(user, encoding, callback) {
    // Receive and send objects
    const enriched = {
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
      timestamp: Date.now()
    };

    this.push(enriched);
    callback();
  }
}

// Usage
const enricher = new UserEnricher();

enricher.write({ id: 1, firstName: 'Alice', lastName: 'Smith' });
enricher.end();

enricher.on('data', (user) => {
  console.log(user);
  // { id: 1, firstName: 'Alice', lastName: 'Smith',
  //   fullName: 'Alice Smith', timestamp: 1234567890 }
});
```

---

## Mixed Mode Streams

### Different Modes on Each Side

Transform streams can have different modes:

```javascript
const { Transform } = require('stream');

// Read strings, output objects
class JSONParser extends Transform {
  constructor(options) {
    super({
      writableObjectMode: false, // Input: strings/buffers
      readableObjectMode: true,  // Output: objects
      ...options
    });
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          // Input: string → Output: object
          const obj = JSON.parse(line);
          this.push(obj);
        } catch (err) {
          this.emit('error', err);
        }
      }
    }

    callback();
  }

  _flush(callback) {
    if (this.buffer.trim()) {
      try {
        const obj = JSON.parse(this.buffer);
        this.push(obj);
      } catch (err) {
        this.emit('error', err);
      }
    }
    callback();
  }
}

// Read objects, output strings
class JSONStringifier extends Transform {
  constructor(options) {
    super({
      writableObjectMode: true,  // Input: objects
      readableObjectMode: false, // Output: strings/buffers
      ...options
    });
  }

  _transform(obj, encoding, callback) {
    try {
      // Input: object → Output: string
      const json = JSON.stringify(obj) + '\n';
      this.push(json);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

// Usage: String → Object → String pipeline
const fs = require('fs');

fs.createReadStream('input.jsonl')
  .pipe(new JSONParser())          // String → Object
  .pipe(new UserEnricher())        // Object → Object
  .pipe(new JSONStringifier())     // Object → String
  .pipe(fs.createWriteStream('output.jsonl'));
```

---

## Practical Examples

### Example 1: Database Query Stream

```javascript
const { Readable } = require('stream');

class DatabaseQueryStream extends Readable {
  constructor(query, batchSize = 100, options) {
    super({ objectMode: true, ...options });
    this.query = query;
    this.batchSize = batchSize;
    this.offset = 0;
    this.done = false;
  }

  async _read() {
    if (this.done) return;

    try {
      // Simulate database query
      const rows = await this.fetchBatch(this.offset, this.batchSize);

      if (rows.length === 0) {
        this.push(null); // No more data
        this.done = true;
        return;
      }

      // Push each row as an object
      for (const row of rows) {
        if (!this.push(row)) {
          // Backpressure - stop pushing
          break;
        }
      }

      this.offset += rows.length;
    } catch (err) {
      this.destroy(err);
    }
  }

  async fetchBatch(offset, limit) {
    // Simulate: SELECT * FROM users LIMIT limit OFFSET offset
    await new Promise(resolve => setTimeout(resolve, 10));

    const rows = [];
    for (let i = 0; i < limit && offset + i < 1000; i++) {
      rows.push({
        id: offset + i + 1,
        name: `User ${offset + i + 1}`,
        email: `user${offset + i + 1}@example.com`
      });
    }
    return rows;
  }
}

// Usage
const query = 'SELECT * FROM users';
const stream = new DatabaseQueryStream(query);

let count = 0;
stream.on('data', (row) => {
  count++;
  console.log(`${count}. ${row.name} <${row.email}>`);
});

stream.on('end', () => {
  console.log(`Total: ${count} users`);
});
```

### Example 2: CSV to Object Stream

```javascript
const { Transform } = require('stream');

class CSVParser extends Transform {
  constructor(options) {
    super({ ...options, objectMode: true });
    this.headers = null;
    this.buffer = '';
    this.lineNumber = 0;
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      this.lineNumber++;

      if (!line.trim()) continue;

      if (!this.headers) {
        this.headers = this.parseLine(line);
      } else {
        const values = this.parseLine(line);
        const obj = this.createObject(values);
        this.push(obj);
      }
    }

    callback();
  }

  _flush(callback) {
    if (this.buffer.trim() && this.headers) {
      const values = this.parseLine(this.buffer);
      const obj = this.createObject(values);
      this.push(obj);
    }
    callback();
  }

  parseLine(line) {
    // Simple CSV parsing (doesn't handle quoted commas)
    return line.split(',').map(v => v.trim());
  }

  createObject(values) {
    const obj = { _line: this.lineNumber };

    this.headers.forEach((header, i) => {
      obj[header] = values[i] || null;
    });

    return obj;
  }
}

// Usage
const fs = require('fs');

fs.createReadStream('users.csv')
  .pipe(new CSVParser())
  .on('data', (user) => {
    console.log('User object:', user);
  });
```

### Example 3: Object Filter and Map

```javascript
const { Transform } = require('stream');

class FilterStream extends Transform {
  constructor(predicate, options) {
    super({ objectMode: true, ...options });
    this.predicate = predicate;
  }

  _transform(obj, encoding, callback) {
    if (this.predicate(obj)) {
      this.push(obj);
    }
    callback();
  }
}

class MapStream extends Transform {
  constructor(mapper, options) {
    super({ objectMode: true, ...options });
    this.mapper = mapper;
  }

  _transform(obj, encoding, callback) {
    try {
      const mapped = this.mapper(obj);
      this.push(mapped);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

// Usage: Filter and map pipeline
const { pipeline } = require('stream');

const users = new UserStream([
  { id: 1, name: 'Alice', age: 25 },
  { id: 2, name: 'Bob', age: 17 },
  { id: 3, name: 'Charlie', age: 30 }
]);

pipeline(
  users,
  new FilterStream(user => user.age >= 18), // Only adults
  new MapStream(user => ({
    name: user.name.toUpperCase(),
    adult: true
  })),
  new UserLogger(),
  (err) => {
    if (err) console.error(err);
  }
);
```

---

## highWaterMark in Object Mode

### Understanding Object Limits

```javascript
// Binary mode - bytes
const binary = new Readable({
  highWaterMark: 16384  // 16 KB of bytes
});

// Object mode - count
const objects = new Readable({
  objectMode: true,
  highWaterMark: 16  // 16 objects
});
```

### Tuning for Objects

```javascript
// Small objects, high throughput
const smallObjects = new Transform({
  objectMode: true,
  highWaterMark: 100  // Buffer 100 objects
});

// Large objects, lower memory
const largeObjects = new Transform({
  objectMode: true,
  highWaterMark: 10  // Buffer only 10 objects
});
```

### Measuring Object Size

```javascript
class SmartObjectStream extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.totalSize = 0;
    this.objectCount = 0;
  }

  _transform(obj, encoding, callback) {
    // Rough size estimation
    const size = JSON.stringify(obj).length;
    this.totalSize += size;
    this.objectCount++;

    this.push(obj);
    callback();
  }

  _flush(callback) {
    const avgSize = this.totalSize / this.objectCount;
    console.log(`Avg object size: ${avgSize.toFixed(0)} bytes`);
    console.log(`Total objects: ${this.objectCount}`);
    callback();
  }
}
```

---

## Performance Considerations

### Memory Usage

**Objects can be large:**

```javascript
// Small object - ~50 bytes
{ id: 1, name: 'Alice' }

// Large object - ~1000 bytes
{
  id: 1,
  name: 'Alice',
  bio: '...',  // Long text
  metadata: { ... },  // Nested data
  tags: [...],  // Arrays
}

// With highWaterMark: 16
// Small objects: ~800 bytes buffered
// Large objects: ~16 KB buffered
```

**Best practice:**

```javascript
// Adjust highWaterMark based on object size
const avgObjectSize = 1000; // bytes
const targetBufferSize = 64 * 1024; // 64 KB
const highWaterMark = Math.floor(targetBufferSize / avgObjectSize);

const stream = new Transform({
  objectMode: true,
  highWaterMark  // ~64 objects
});
```

### Serialization Overhead

**Binary mode is faster:**

```javascript
// Binary: Direct buffer operations
stream.push(buffer); // Fast

// Object mode: V8 garbage collection
stream.push({ id: 1, name: 'Alice' }); // Creates object, GC later
```

**When performance matters:**

```javascript
// Consider buffering objects manually
class BatchProcessor extends Transform {
  constructor(batchSize, options) {
    super({ objectMode: true, ...options });
    this.batch = [];
    this.batchSize = batchSize;
  }

  _transform(obj, encoding, callback) {
    this.batch.push(obj);

    if (this.batch.length >= this.batchSize) {
      // Process batch at once (more efficient)
      this.processBatch(this.batch);
      this.batch = [];
    }

    callback();
  }

  processBatch(batch) {
    // Batch processing reduces per-object overhead
    const results = batch.map(obj => this.processOne(obj));
    results.forEach(r => this.push(r));
  }
}
```

---

## Common Patterns

### Pattern 1: Array to Stream

```javascript
const { Readable } = require('stream');

function arrayToStream(array) {
  return Readable.from(array, { objectMode: true });
}

// Usage
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
];

const stream = arrayToStream(users);
stream.pipe(new UserLogger());
```

### Pattern 2: Stream to Array

```javascript
async function streamToArray(stream) {
  const array = [];

  for await (const item of stream) {
    array.push(item);
  }

  return array;
}

// Usage
const users = await streamToArray(userStream);
console.log(users);
```

### Pattern 3: Async Transformation

```javascript
class AsyncMapStream extends Transform {
  constructor(asyncMapper, options) {
    super({ objectMode: true, ...options });
    this.asyncMapper = asyncMapper;
  }

  async _transform(obj, encoding, callback) {
    try {
      const result = await this.asyncMapper(obj);
      this.push(result);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

// Usage: Enrich with API data
const enricher = new AsyncMapStream(async (user) => {
  const details = await fetchUserDetails(user.id);
  return { ...user, ...details };
});
```

---

## Debugging Object Streams

### Logging Objects

```javascript
class DebugStream extends Transform {
  constructor(label, options) {
    super({ objectMode: true, ...options });
    this.label = label;
    this.count = 0;
  }

  _transform(obj, encoding, callback) {
    this.count++;
    console.log(`[${this.label}] #${this.count}:`, JSON.stringify(obj, null, 2));
    this.push(obj);
    callback();
  }
}

// Usage
pipeline(
  source,
  new DebugStream('After source'),
  transform,
  new DebugStream('After transform'),
  destination,
  callback
);
```

### Validating Objects

```javascript
class ValidateStream extends Transform {
  constructor(schema, options) {
    super({ objectMode: true, ...options });
    this.schema = schema;
    this.errors = 0;
  }

  _transform(obj, encoding, callback) {
    const valid = this.validate(obj);

    if (valid) {
      this.push(obj);
    } else {
      this.errors++;
      console.error('Invalid object:', obj);
    }

    callback();
  }

  validate(obj) {
    // Check required fields
    return this.schema.every(field => obj.hasOwnProperty(field));
  }

  _flush(callback) {
    if (this.errors > 0) {
      console.error(`Validation errors: ${this.errors}`);
    }
    callback();
  }
}

// Usage
const validator = new ValidateStream(['id', 'name', 'email']);
```

---

## Best Practices

### ✅ Do:

1. **Use object mode for structured data**
   ```javascript
   const stream = new Transform({ objectMode: true });
   ```

2. **Adjust highWaterMark for object size**
   ```javascript
   const stream = new Transform({
     objectMode: true,
     highWaterMark: largeObjects ? 10 : 100
   });
   ```

3. **Validate objects early in pipeline**
   ```javascript
   pipeline(source, validator, processor, destination);
   ```

4. **Use mixed modes when needed**
   ```javascript
   new Transform({
     writableObjectMode: true,
     readableObjectMode: false
   });
   ```

### ❌ Don't:

1. **Don't use object mode unnecessarily**
   ```javascript
   // BAD - binary mode would work fine
   const stream = new Transform({ objectMode: true });
   stream.write(Buffer.from('data'));
   ```

2. **Don't ignore object size**
   ```javascript
   // BAD - might buffer huge objects
   const stream = new Transform({
     objectMode: true,
     highWaterMark: 1000  // Could be 100 MB+ in memory!
   });
   ```

3. **Don't modify objects in place**
   ```javascript
   // BAD - mutates original
   _transform(obj, encoding, callback) {
     obj.processed = true;
     this.push(obj);
   }

   // GOOD - create new object
   _transform(obj, encoding, callback) {
     this.push({ ...obj, processed: true });
   }
   ```

---

## Summary

### Key Takeaways

1. **Object mode** streams work with JavaScript objects, not buffers
2. **highWaterMark** in object mode = number of objects, not bytes
3. **Use object mode** for structured data processing
4. **Mixed modes** allow binary → object or object → binary
5. **Consider object size** when setting highWaterMark
6. **Objects create GC pressure** - consider batching

### When to Use Object Mode

```
Use object mode when:
✓ Streaming database rows
✓ Processing JSON/CSV records
✓ Building data pipelines
✓ Transforming structured data

Use binary mode when:
✓ File I/O
✓ Network I/O
✓ Working with buffers
✓ Maximum performance needed
```

### Next Steps

You've completed all Level 2 guides! Now:
1. Study the [examples](../examples/)
2. Complete the [exercises](../exercises/)
3. Build a [practice project](../README.md#practice-projects)

---

## Quick Reference

```javascript
const { Readable, Writable, Transform } = require('stream');

// Readable object stream
class MyReadable extends Readable {
  constructor() {
    super({ objectMode: true });
  }

  _read() {
    this.push({ id: 1, data: 'value' });
    this.push(null);
  }
}

// Writable object stream
class MyWritable extends Writable {
  constructor() {
    super({ objectMode: true });
  }

  _write(obj, encoding, callback) {
    console.log(obj);
    callback();
  }
}

// Transform object stream
class MyTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(obj, encoding, callback) {
    this.push({ ...obj, processed: true });
    callback();
  }
}

// Mixed mode transform
class Parser extends Transform {
  constructor() {
    super({
      writableObjectMode: false,  // Strings in
      readableObjectMode: true    // Objects out
    });
  }

  _transform(chunk, encoding, callback) {
    const obj = JSON.parse(chunk);
    this.push(obj);
    callback();
  }
}
```

Ready to practice? Check out the [examples](../examples/) and [exercises](../exercises/)!
