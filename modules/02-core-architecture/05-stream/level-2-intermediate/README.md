# Level 2: Stream Intermediate

Master custom streams and advanced streaming patterns.

## Overview

This level takes you beyond using built-in streams to creating your own custom Readable, Writable, and Transform streams. You'll learn how to handle backpressure properly, work with object mode streams, and build complex data processing pipelines. By the end of this level, you'll be able to design and implement production-ready streaming solutions.

**Time to complete:** 3-4 hours

---

## Learning Objectives

By completing this level, you will:

- [ ] Create custom Readable streams from any data source
- [ ] Create custom Writable streams for any destination
- [ ] Implement custom Transform streams for data processing
- [ ] Understand and handle backpressure correctly in all scenarios
- [ ] Work with object mode streams for structured data
- [ ] Use stream utilities (pipeline, finished, Readable.from)
- [ ] Build complex multi-stage data pipelines
- [ ] Debug stream performance and memory issues
- [ ] Understand stream internals and lifecycle
- [ ] Implement streaming protocols and formats

---

## Prerequisites

- Completed Level 1: Stream Basics
- Solid understanding of JavaScript classes
- Experience with async/await and Promises
- Understanding of EventEmitter patterns

---

## Topics Covered

### 1. Custom Readable Streams
- Extending the Readable class
- Implementing the `_read()` method
- Pushing data to consumers
- Signaling end of stream
- Handling backpressure signals
- Reading from databases, APIs, etc.

### 2. Custom Writable Streams
- Extending the Writable class
- Implementing the `_write()` method
- Handling the callback parameter
- Managing internal buffers
- Implementing `_final()` for cleanup
- Writing to databases, APIs, etc.

### 3. Custom Transform Streams
- Extending the Transform class
- Implementing `_transform()` method
- Implementing `_flush()` for final data
- Stateful transformations
- Parsing and formatting data
- Common transform patterns

### 4. Advanced Backpressure
- Understanding the highWaterMark
- Monitoring buffer levels
- Implementing custom backpressure strategies
- Coordinating multiple streams
- Performance tuning

### 5. Object Mode Streams
- What is object mode?
- When to use object mode
- Creating object streams
- JSON processing pipelines
- Database result streaming

### 6. Stream Utilities
- `pipeline()` for robust composition
- `finished()` for cleanup
- `Readable.from()` for easy creation
- `stream.compose()` for reusable pipelines
- Promise-based stream handling

---

## Conceptual Guides

Deep dive into intermediate streaming concepts:

### Essential Reading

1. **[Creating Readable Streams](./guides/01-creating-readable-streams.md)** (25 min)
   - Extending the Readable class
   - The _read() method in detail
   - Push vs pull models
   - Practical examples

2. **[Creating Writable Streams](./guides/02-creating-writable-streams.md)** (25 min)
   - Extending the Writable class
   - The _write() method in detail
   - Callback-based flow control
   - Cleanup with _final()

3. **[Creating Transform Streams](./guides/03-creating-transform-streams.md)** (30 min)
   - Extending the Transform class
   - Stateful vs stateless transforms
   - The _flush() method
   - Common transform patterns

4. **[Understanding Backpressure](./guides/04-understanding-backpressure.md)** (25 min)
   - How backpressure works internally
   - The highWaterMark setting
   - Monitoring and debugging backpressure
   - Performance implications

5. **[Object Mode Streams](./guides/05-object-mode-streams.md)** (20 min)
   - Binary vs object mode
   - When to use object mode
   - Creating object streams
   - Performance considerations

---

## Learning Path

### Recommended Approach

```
Week 1: Custom Streams
├─ Day 1: Read guide 1, study examples 1-2, exercise 1
├─ Day 2: Read guide 2, study examples 3-4, exercise 2
└─ Day 3: Read guide 3, study examples 5-6, exercise 3

Week 2: Advanced Topics
├─ Day 4: Read guide 4, study examples 7-8, exercise 4
└─ Day 5: Read guide 5, complete exercise 5, mini-project
```

### Quick Start (Experienced Developers)

1. Skim all guides
2. Study examples 1, 3, 5, 7
3. Complete exercises 3-5
4. Build a custom streaming library

---

## Examples

Advanced code examples demonstrating custom streams:

1. **[01-custom-readable.js](./examples/01-custom-readable.js)**
   - Creating a custom Readable stream
   - Implementing _read() method
   - Generating data on demand
   - Handling backpressure

2. **[02-readable-from-api.js](./examples/02-readable-from-api.js)**
   - Streaming data from REST API
   - Pagination handling
   - Rate limiting
   - Error handling

3. **[03-custom-writable.js](./examples/03-custom-writable.js)**
   - Creating a custom Writable stream
   - Implementing _write() method
   - Batching writes for efficiency
   - Cleanup with _final()

4. **[04-writable-to-database.js](./examples/04-writable-to-database.js)**
   - Writing stream data to database
   - Bulk insert optimization
   - Transaction handling
   - Error recovery

5. **[05-custom-transform.js](./examples/05-custom-transform.js)**
   - Creating Transform streams
   - CSV to JSON transformation
   - Stateful parsing
   - The _flush() method

6. **[06-object-mode-streams.js](./examples/06-object-mode-streams.js)**
   - Object mode enabled streams
   - Processing JavaScript objects
   - JSON parsing pipeline
   - Database query streaming

7. **[07-backpressure-control.js](./examples/07-backpressure-control.js)**
   - Manual backpressure management
   - Monitoring buffer levels
   - Tuning highWaterMark
   - Performance optimization

8. **[08-stream-utilities.js](./examples/08-stream-utilities.js)**
   - Using pipeline() for composition
   - finished() for cleanup
   - Readable.from() helpers
   - Promise-based patterns

---

## Exercises

Challenging exercises to test your skills:

### Exercise 1: Custom Number Generator
**Difficulty:** Medium
**File:** [exercises/exercise-1.js](./exercises/exercise-1.js)

Create a Readable stream that:
- Generates a sequence of numbers
- Supports start, end, and step parameters
- Handles backpressure properly
- Can be paused and resumed
- Emits 'done' event with statistics

**Skills practiced:**
- Extending Readable class
- Implementing _read()
- Managing internal state
- Backpressure handling

---

### Exercise 2: Database Writer Stream
**Difficulty:** Medium
**File:** [exercises/exercise-2.js](./exercises/exercise-2.js)

Create a Writable stream that:
- Accepts data objects
- Batches writes for efficiency
- Commits batches to "database" (file)
- Handles errors with retry logic
- Reports statistics on completion

**Skills practiced:**
- Extending Writable class
- Implementing _write() and _final()
- Batching for performance
- Error handling and recovery

---

### Exercise 3: CSV to JSON Transform
**Difficulty:** Medium
**File:** [exercises/exercise-3.js](./exercises/exercise-3.js)

Create a Transform stream that:
- Parses CSV input line by line
- Outputs JavaScript objects
- Handles headers properly
- Validates data types
- Reports parsing errors

**Skills practiced:**
- Extending Transform class
- Stateful transformation
- Object mode streams
- Data validation

---

### Exercise 4: Rate Limiter Stream
**Difficulty:** Hard
**File:** [exercises/exercise-4.js](./exercises/exercise-4.js)

Create a Transform stream that:
- Limits throughput to N items/second
- Buffers excess data
- Maintains smooth output rate
- Reports queue depth
- Handles backpressure

**Skills practiced:**
- Advanced backpressure
- Time-based buffering
- Performance tuning
- Complex state management

---

### Exercise 5: Multi-Source Stream Merger
**Difficulty:** Hard
**File:** [exercises/exercise-5.js](./exercises/exercise-5.js)

Create a system that:
- Reads from multiple sources
- Merges streams in sorted order
- Handles different data rates
- Propagates errors properly
- Closes when all sources complete

**Skills practiced:**
- Coordinating multiple streams
- Complex backpressure scenarios
- Event coordination
- Production-ready error handling

---

## Solutions

Complete solutions with multiple implementation approaches:

- [Solution 1](./solutions/exercise-1-solution.js) - Number generator stream
- [Solution 2](./solutions/exercise-2-solution.js) - Database writer stream
- [Solution 3](./solutions/exercise-3-solution.js) - CSV to JSON transform
- [Solution 4](./solutions/exercise-4-solution.js) - Rate limiter stream
- [Solution 5](./solutions/exercise-5-solution.js) - Multi-source merger

---

## Key Concepts Summary

### Creating Custom Readable Streams

```javascript
const { Readable } = require('stream');

class MyReadable extends Readable {
  constructor(options) {
    super(options);
    // Initialize state
  }

  _read(size) {
    // Generate or fetch data
    const chunk = this.getNextChunk();

    if (chunk) {
      this.push(chunk); // Send to consumer
    } else {
      this.push(null); // Signal end
    }
  }
}
```

### Creating Custom Writable Streams

```javascript
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    super(options);
    // Initialize state
  }

  _write(chunk, encoding, callback) {
    // Process the chunk
    this.processChunk(chunk)
      .then(() => callback()) // Success
      .catch(err => callback(err)); // Error
  }

  _final(callback) {
    // Cleanup when stream ends
    this.cleanup()
      .then(() => callback())
      .catch(err => callback(err));
  }
}
```

### Creating Custom Transform Streams

```javascript
const { Transform } = require('stream');

class MyTransform extends Transform {
  constructor(options) {
    super(options);
    // Initialize state
  }

  _transform(chunk, encoding, callback) {
    // Transform the chunk
    const transformed = this.transformChunk(chunk);
    this.push(transformed);
    callback();
  }

  _flush(callback) {
    // Output any buffered data
    const final = this.getFinalData();
    if (final) this.push(final);
    callback();
  }
}
```

---

## Common Pitfalls

### Pitfall 1: Not Calling Callback

```javascript
// ❌ Wrong - callback never called
_write(chunk, encoding, callback) {
  this.processChunk(chunk);
  // Forgot to call callback!
}

// ✅ Correct - always call callback
_write(chunk, encoding, callback) {
  this.processChunk(chunk);
  callback(); // Signal completion
}
```

### Pitfall 2: Pushing After null

```javascript
// ❌ Wrong - push after end
_read() {
  this.push(null); // End stream
  this.push('more data'); // Error!
}

// ✅ Correct - track state
_read() {
  if (this.ended) return;
  if (this.hasMore()) {
    this.push(this.getData());
  } else {
    this.push(null);
    this.ended = true;
  }
}
```

### Pitfall 3: Synchronous _read()

```javascript
// ❌ Wrong - might overflow stack
_read() {
  while (this.hasData()) {
    this.push(this.getData());
  }
  this.push(null);
}

// ✅ Correct - async or limit iterations
_read() {
  const chunk = this.getData();
  if (chunk) {
    this.push(chunk);
  } else {
    this.push(null);
  }
}
```

---

## Practice Projects

Apply your intermediate skills:

### Project 1: Log Aggregator
Build a system that:
- Reads from multiple log files
- Parses log entries
- Filters and transforms
- Writes to centralized store
- Handles rotation

### Project 2: CSV Processor
Create a CSV processing pipeline:
- Custom CSV parser (Transform)
- Data validation
- Type conversion
- Error handling
- Output to JSON/database

### Project 3: API Stream Proxy
Build an HTTP proxy that:
- Streams from upstream API
- Transforms response data
- Implements caching
- Rate limits requests
- Handles errors gracefully

---

## Performance Considerations

### Buffer Size Tuning

```javascript
// Small buffer - lower memory, more CPU
const stream = new MyStream({ highWaterMark: 16 * 1024 });

// Large buffer - higher memory, less CPU
const stream = new MyStream({ highWaterMark: 256 * 1024 });

// Object mode - number of objects
const stream = new MyStream({
  objectMode: true,
  highWaterMark: 16 // 16 objects, not bytes
});
```

### Batching for Efficiency

```javascript
class BatchWritable extends Writable {
  constructor() {
    super({ objectMode: true });
    this.batch = [];
    this.batchSize = 100;
  }

  _write(obj, encoding, callback) {
    this.batch.push(obj);

    if (this.batch.length >= this.batchSize) {
      this.flushBatch(() => callback());
    } else {
      callback();
    }
  }

  _final(callback) {
    this.flushBatch(callback);
  }
}
```

---

## Testing Your Knowledge

### Self-Check Questions

1. When is `_read()` called in a Readable stream?
2. What happens if you don't call the callback in `_write()`?
3. How is `_transform()` different from `_write()`?
4. What does `highWaterMark` control?
5. When should you use object mode?
6. What is the purpose of `_final()`?
7. How do you signal end-of-stream in a Readable?
8. What's the difference between `push()` and `write()`?

### Practical Check

You've mastered this level if you can:

- [ ] Create custom streams for any data source/destination
- [ ] Handle backpressure correctly in custom streams
- [ ] Build multi-stage transformation pipelines
- [ ] Debug stream memory and performance issues
- [ ] Implement production-ready streaming solutions

---

## Additional Resources

### Official Documentation
- [Node.js Stream Implementation](https://nodejs.org/api/stream.html#stream_api_for_stream_implementers)
- [Stream Handbook](https://github.com/substack/stream-handbook)

### Related Topics
- Level 1: Stream Basics (review if needed)
- Level 3: Advanced Streams (next challenge)
- Module 4: Events (EventEmitter patterns)

---

## Next Steps

After completing this level:
1. Review all examples and solutions
2. Build at least one practice project
3. Move to [Level 3: Advanced](../level-3-advanced/README.md)
4. Or apply streams in real projects

---

Ready to create your own streams? Start with the [first guide](./guides/01-creating-readable-streams.md)!
