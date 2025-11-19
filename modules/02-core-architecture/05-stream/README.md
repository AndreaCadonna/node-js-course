# Module 5: Stream

Master efficient data processing with Node.js streams.

## Why This Module Matters

The `stream` module is one of the most powerful and essential features of Node.js. Streams enable you to process data piece by piece, without loading everything into memory at once. This is crucial for building scalable, performant applications that can handle large amounts of data efficiently.

**Real-world applications:**
- Processing large files (GB+ in size)
- Building HTTP servers and clients
- Real-time data processing pipelines
- Video and audio streaming services
- Database query result processing
- Log file analysis and aggregation
- File compression and encryption
- Network protocols and data transfer

---

## What You'll Learn

By completing this module, you'll master:

### Technical Skills
- Understanding all four stream types
- Creating custom streams
- Piping and stream composition
- Backpressure handling
- Stream error management
- Transform stream implementation
- Stream performance optimization

### Practical Applications
- Process files larger than available RAM
- Build efficient data pipelines
- Handle real-time data streams
- Optimize memory usage
- Create robust streaming applications
- Implement stream-based protocols

---

## Module Structure

This module is divided into three progressive levels:

### [Level 1: Basics](./level-1-basics/README.md)
**Time**: 2-3 hours

Learn the fundamentals of streams:
- Understanding what streams are
- The four types of streams (Readable, Writable, Duplex, Transform)
- Reading from and writing to streams
- Piping streams together
- Basic error handling
- Stream events

**You'll be able to:**
- Use built-in Node.js streams
- Read and write files using streams
- Pipe data between streams
- Handle basic stream events
- Understand why streams matter

### [Level 2: Intermediate](./level-2-intermediate/README.md)
**Time**: 3-4 hours

Advanced streaming techniques:
- Creating custom Readable streams
- Creating custom Writable streams
- Understanding backpressure
- Stream modes (flowing vs paused)
- Object mode streams
- Stream utilities and helpers
- Composing complex pipelines

**You'll be able to:**
- Create your own stream classes
- Handle backpressure correctly
- Build data transformation pipelines
- Work with object streams
- Debug stream issues
- Implement streaming protocols

### [Level 3: Advanced](./level-3-advanced/README.md)
**Time**: 4-6 hours

Production-ready streaming patterns:
- Custom Transform stream implementation
- Stream performance optimization
- Memory management and profiling
- Error handling and recovery strategies
- Stream pooling and reuse
- Advanced stream composition
- Testing stream implementations
- Security considerations

**You'll be able to:**
- Build production-grade stream libraries
- Optimize stream performance
- Handle complex error scenarios
- Profile and debug memory issues
- Implement sophisticated transforms
- Design resilient stream architectures
- Write comprehensive stream tests

---

## Prerequisites

- **Module 1: File System** (recommended)
- **Module 4: Events** (highly recommended - streams are EventEmitters)
- Basic JavaScript knowledge
- Understanding of asynchronous programming
- Node.js installed (v14+)

---

## Learning Path

### Recommended Approach

1. **Read** the [CONCEPTS.md](./CONCEPTS.md) file first for foundational understanding
2. **Start** with Level 1 and progress sequentially
3. **Study** the examples in each level
4. **Complete** the exercises before checking solutions
5. **Read** the conceptual guides for deeper understanding
6. **Practice** by building the suggested projects

### Alternative Approaches

**Fast Track** (If you're experienced with streams):
- Skim Level 1
- Focus on Level 2 and 3
- Complete advanced exercises

**Deep Dive** (If you want complete mastery):
- Read all guides thoroughly
- Complete all exercises
- Build additional projects
- Study the solutions for alternative approaches

---

## Key Concepts

### What Are Streams?

Streams are collections of data that might not be available all at once. Instead of reading an entire file into memory, you can process it piece by piece:

```javascript
const fs = require('fs');

// Bad: Loads entire file into memory
const data = fs.readFileSync('large-file.txt'); // Could be 10GB!

// Good: Processes file chunk by chunk
const stream = fs.createReadStream('large-file.txt');
stream.on('data', chunk => {
  // Process small chunks (default 64KB each)
  console.log(`Received ${chunk.length} bytes`);
});
```

### Four Types of Streams

Node.js has four fundamental stream types:

```javascript
// 1. Readable - Read data from a source
const readable = fs.createReadStream('input.txt');

// 2. Writable - Write data to a destination
const writable = fs.createWriteStream('output.txt');

// 3. Duplex - Both readable and writable
const net = require('net');
const socket = net.connect(port); // Socket is duplex

// 4. Transform - Modify data as it passes through
const zlib = require('zlib');
const gzip = zlib.createGzip(); // Compression transform
```

### Piping Streams

The most elegant way to work with streams is piping:

```javascript
const fs = require('fs');
const zlib = require('zlib');

// Copy and compress a file
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'));
```

### Backpressure

Streams automatically handle backpressure - when a destination can't keep up with the source:

```javascript
const readable = getReadableStream();
const writable = getWritableStream();

readable.on('data', chunk => {
  const canContinue = writable.write(chunk);
  if (!canContinue) {
    // Writable buffer is full - pause reading
    readable.pause();
  }
});

writable.on('drain', () => {
  // Writable buffer is empty - resume reading
  readable.resume();
});

// Or simply use pipe() which handles this automatically!
readable.pipe(writable);
```

---

## Practical Examples

### Example 1: Reading Large Files

```javascript
const fs = require('fs');

// Memory-efficient file processing
const stream = fs.createReadStream('huge-log-file.log');

let lineCount = 0;
let buffer = '';

stream.on('data', chunk => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep incomplete line

  lineCount += lines.length;
  lines.forEach(line => {
    if (line.includes('ERROR')) {
      console.log('Found error:', line);
    }
  });
});

stream.on('end', () => {
  console.log(`Processed ${lineCount} lines`);
});
```

### Example 2: Creating a Transform Stream

```javascript
const { Transform } = require('stream');

// Create a stream that converts text to uppercase
class UppercaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    const uppercase = chunk.toString().toUpperCase();
    this.push(uppercase);
    callback();
  }
}

// Use it in a pipeline
fs.createReadStream('input.txt')
  .pipe(new UppercaseTransform())
  .pipe(fs.createWriteStream('output.txt'));
```

### Example 3: Handling Errors in Pipelines

```javascript
const fs = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream');

// Proper error handling with pipeline
pipeline(
  fs.createReadStream('input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('input.txt.gz'),
  (err) => {
    if (err) {
      console.error('Pipeline failed:', err);
    } else {
      console.log('Pipeline succeeded');
    }
  }
);
```

---

## Common Pitfalls

### ❌ Not Handling Backpressure

```javascript
// Wrong - ignores backpressure
readable.on('data', chunk => {
  writable.write(chunk); // Ignores return value!
});

// Correct - use pipe or handle backpressure
readable.pipe(writable);
```

### ❌ Ignoring Errors

```javascript
// Wrong - unhandled errors crash the app
stream.pipe(destination);

// Correct - handle errors
stream
  .on('error', err => console.error('Stream error:', err))
  .pipe(destination)
  .on('error', err => console.error('Destination error:', err));
```

### ❌ Memory Leaks from Event Listeners

```javascript
// Wrong - listeners not cleaned up
function processStream(stream) {
  stream.on('data', chunk => {
    // Process chunk
  });
}

// Correct - clean up or use pipeline
function processStream(stream) {
  stream.on('data', handleData);
  stream.on('end', () => {
    stream.removeListener('data', handleData);
  });
}
```

---

## Module Contents

### Documentation
- **[CONCEPTS.md](./CONCEPTS.md)** - Foundational concepts for the entire module
- **Level READMEs** - Specific guidance for each level

### Code Examples
- **8 examples per level** (24 total) - Practical demonstrations
- **Fully commented** - Learn from reading the code
- **Runnable** - Execute them to see results

### Exercises
- **5 exercises per level** (15 total) - Practice problems
- **Progressive difficulty** - Build your skills gradually
- **Complete solutions** - Check your work

### Conceptual Guides
- **15 in-depth guides** - Deep understanding of specific topics
- **Level 1**: 5 guides on fundamentals
- **Level 2**: 5 guides on intermediate patterns
- **Level 3**: 5 guides on advanced topics

---

## Getting Started

### Quick Start

1. **Read the concepts**:
   ```bash
   # Read the foundational concepts
   cat CONCEPTS.md
   ```

2. **Start Level 1**:
   ```bash
   cd level-1-basics
   cat README.md
   ```

3. **Run your first example**:
   ```bash
   node examples/01-readable-stream.js
   ```

4. **Try an exercise**:
   ```bash
   node exercises/exercise-1.js
   ```

### Setting Up

No special setup is required! The stream module is built into Node.js.

```javascript
// Just import and start using
const { Readable, Writable, Transform, pipeline } = require('stream');
```

---

## Success Criteria

You'll know you've mastered this module when you can:

- [ ] Explain the four types of streams and when to use each
- [ ] Use streams to process files larger than available memory
- [ ] Create custom Readable, Writable, and Transform streams
- [ ] Understand and handle backpressure correctly
- [ ] Build complex data processing pipelines
- [ ] Handle errors properly in stream pipelines
- [ ] Optimize stream performance for production
- [ ] Debug memory issues in streaming applications
- [ ] Write tests for stream implementations

---

## Why Streams Matter

### Memory Efficiency

```javascript
// Without streams: 1GB file = 1GB memory usage
const data = fs.readFileSync('1gb-file.txt'); // Loads all into memory!

// With streams: 1GB file = ~64KB memory usage
const stream = fs.createReadStream('1gb-file.txt'); // Processes in chunks
```

### Composability

Streams can be combined like UNIX pipes:

```javascript
// Readable → Transform → Transform → Writable
readFile()
  .pipe(parseJSON())
  .pipe(filterData())
  .pipe(formatOutput())
  .pipe(writeFile());
```

### Performance

Streams start outputting data immediately:

```javascript
// HTTP response streaming - user sees data immediately
http.createServer((req, res) => {
  fs.createReadStream('large-page.html')
    .pipe(res); // Streams HTML as it's read
});
```

---

## Additional Resources

### Official Documentation
- [Node.js Stream Documentation](https://nodejs.org/api/stream.html)
- [Stream Handbook](https://github.com/substack/stream-handbook)

### Practice Projects
After completing this module, try building:
1. **File Processor** - Process large log files efficiently
2. **CSV Parser** - Stream-based CSV parser
3. **HTTP Proxy** - Forward requests using streams
4. **Data Pipeline** - Multi-stage data transformation
5. **Real-time Logger** - Streaming log aggregator

### Related Modules
- **Module 1: File System** - Streams for file I/O
- **Module 4: Events** - Streams are EventEmitters
- **Module 7: HTTP** - HTTP requests/responses are streams
- **Module 12: Child Process** - Process stdin/stdout are streams

---

## Questions or Issues?

- Review the [CONCEPTS.md](./CONCEPTS.md) for foundational understanding
- Check the examples for practical demonstrations
- Study the guides for deep dives into specific topics
- Review solutions after attempting exercises

---

## Let's Begin!

Start your journey with [Level 1: Basics](./level-1-basics/README.md) and discover the power of stream-based data processing.

Remember: Streams are the foundation of Node.js's efficiency. Master them, and you'll build applications that can handle massive amounts of data with minimal resources!
