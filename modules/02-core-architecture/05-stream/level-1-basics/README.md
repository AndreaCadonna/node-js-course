# Level 1: Stream Basics

Master the fundamentals of Node.js streams.

## Overview

This level introduces you to the core concepts of streams in Node.js. You'll learn what streams are, why they matter, and how to use the built-in stream types. By the end of this level, you'll be comfortable reading from and writing to streams, and you'll understand when streams are the right tool for the job.

**Time to complete:** 2-3 hours

---

## Learning Objectives

By completing this level, you will:

- [ ] Understand what streams are and why they're important
- [ ] Identify the four types of streams (Readable, Writable, Duplex, Transform)
- [ ] Read from Readable streams using events
- [ ] Write to Writable streams with proper backpressure handling
- [ ] Use `pipe()` to connect streams together
- [ ] Handle basic stream errors
- [ ] Understand stream events (data, end, finish, error)
- [ ] Work with file streams effectively
- [ ] Compare streams to non-streaming alternatives

---

## Prerequisites

- Basic JavaScript knowledge
- Understanding of callbacks and async operations
- Node.js Module 1: File System (helpful but not required)
- Node.js Module 4: Events (helpful but not required)

---

## Topics Covered

### 1. Introduction to Streams
- What are streams?
- Why use streams vs `readFile()`/`writeFile()`?
- Memory efficiency comparison
- Stream types overview

### 2. Readable Streams
- Creating readable streams
- Listening to `data` events
- Understanding flowing mode
- The `end` event
- Practical examples with files

### 3. Writable Streams
- Creating writable streams
- Writing data with `write()`
- Ending streams with `end()`
- The `finish` event
- Handling write failures

### 4. Piping Streams
- Using `pipe()` to connect streams
- Why piping is better than manual handling
- Chaining multiple streams
- Automatic backpressure management

### 5. Error Handling
- The `error` event
- Why errors don't propagate
- Handling errors in piped streams
- Best practices for error handling

---

## Conceptual Guides

Before diving into examples, read these guides to build solid understanding:

### Essential Reading

1. **[Understanding Streams](./guides/01-understanding-streams.md)** (20 min)
   - What streams are and why they exist
   - Real-world analogies
   - When to use streams

2. **[Readable Streams](./guides/02-readable-streams.md)** (15 min)
   - How readable streams work
   - Reading data chunk by chunk
   - Stream events explained

3. **[Writable Streams](./guides/03-writable-streams.md)** (15 min)
   - How writable streams work
   - Writing data efficiently
   - Backpressure basics

4. **[Piping Streams](./guides/04-piping-streams.md)** (15 min)
   - The pipe() method
   - Stream composition
   - Automatic backpressure handling

5. **[Error Handling](./guides/05-error-handling.md)** (10 min)
   - Common stream errors
   - Proper error handling patterns
   - Debugging stream issues

---

## Learning Path

### Recommended Approach

```
Day 1: Theory
├─ Read guides 1-2 (Understanding + Readable Streams)
├─ Study examples 1-3
├─ Complete exercises 1-2
└─ Review solutions

Day 2: Practice
├─ Read guides 3-4 (Writable + Piping)
├─ Study examples 4-6
├─ Complete exercises 3-4
└─ Review solutions

Day 3: Integration
├─ Read guide 5 (Error Handling)
├─ Study examples 7-8
├─ Complete exercise 5
└─ Build a mini-project
```

### Quick Start (Experienced Developers)

1. Skim guides 1-3
2. Run all examples
3. Complete all exercises
4. Check solutions for alternative approaches

---

## Examples

Practical code examples demonstrating core concepts:

1. **[01-readable-stream.js](./examples/01-readable-stream.js)**
   - Basic readable stream usage
   - Reading file contents chunk by chunk
   - Memory comparison with readFile

2. **[02-writable-stream.js](./examples/02-writable-stream.js)**
   - Basic writable stream usage
   - Writing data to files
   - Understanding the finish event

3. **[03-stream-events.js](./examples/03-stream-events.js)**
   - All major stream events
   - Event sequence and lifecycle
   - Debugging with events

4. **[04-piping.js](./examples/04-piping.js)**
   - Using pipe() to connect streams
   - Copying files with streams
   - Comparing manual vs pipe approach

5. **[05-chaining-pipes.js](./examples/05-chaining-pipes.js)**
   - Multiple transformations
   - Compressing files with gzip
   - Building data pipelines

6. **[06-backpressure.js](./examples/06-backpressure.js)**
   - What is backpressure?
   - Manual backpressure handling
   - Why pipe() is better

7. **[07-error-handling.js](./examples/07-error-handling.js)**
   - Handling stream errors
   - Error propagation issues
   - Proper error handling patterns

8. **[08-transform-stream.js](./examples/08-transform-stream.js)**
   - Using built-in transform streams
   - Compressing and encrypting data
   - Real-world transform examples

---

## Exercises

Test your understanding with practical exercises:

### Exercise 1: Read and Count
**Difficulty:** Easy
**File:** [exercises/exercise-1.js](./exercises/exercise-1.js)

Create a stream that reads a text file and counts:
- Total number of bytes
- Number of chunks received
- Time taken to read

**Skills practiced:**
- Creating readable streams
- Listening to data events
- Measuring stream performance

---

### Exercise 2: Write Log Entries
**Difficulty:** Easy
**File:** [exercises/exercise-2.js](./exercises/exercise-2.js)

Create a writable stream that:
- Accepts log messages
- Formats them with timestamps
- Writes to a log file
- Handles the finish event

**Skills practiced:**
- Creating writable streams
- Writing data with write()
- Using end() properly
- Event handling

---

### Exercise 3: Copy Files with Streams
**Difficulty:** Medium
**File:** [exercises/exercise-3.js](./exercises/exercise-3.js)

Implement a file copy function using streams:
- Copy any file (text or binary)
- Show progress (bytes copied)
- Handle errors properly
- Compare performance with fs.copyFile()

**Skills practiced:**
- Combining readable and writable streams
- Using pipe()
- Error handling
- Progress tracking

---

### Exercise 4: Log File Processor
**Difficulty:** Medium
**File:** [exercises/exercise-4.js](./exercises/exercise-4.js)

Build a log file processor that:
- Reads a log file line by line
- Filters for ERROR entries
- Writes errors to a new file
- Counts total errors found

**Skills practiced:**
- Stream-based line processing
- Data filtering
- Piping streams
- Accumulating results

---

### Exercise 5: Data Pipeline
**Difficulty:** Hard
**File:** [exercises/exercise-5.js](./exercises/exercise-5.js)

Create a data processing pipeline that:
- Reads a CSV file
- Converts to uppercase
- Compresses with gzip
- Writes to output file
- Measures total time

**Skills practiced:**
- Chaining multiple streams
- Using transform streams
- Pipeline composition
- Performance measurement

---

## Solutions

Complete, well-commented solutions for all exercises:

- [Solution 1](./solutions/exercise-1-solution.js) - Read and count
- [Solution 2](./solutions/exercise-2-solution.js) - Write log entries
- [Solution 3](./solutions/exercise-3-solution.js) - Copy files with streams
- [Solution 4](./solutions/exercise-4-solution.js) - Log file processor
- [Solution 5](./solutions/exercise-5-solution.js) - Data pipeline

**Note:** Try to complete exercises before checking solutions!

---

## Key Concepts Summary

### What You Should Know

After completing this level, you should understand:

1. **Streams vs Non-Streams**
   ```javascript
   // ❌ Non-stream: Loads entire file
   const data = fs.readFileSync('big.txt'); // 1GB in memory!

   // ✅ Stream: Processes chunks
   fs.createReadStream('big.txt'); // ~64KB in memory
   ```

2. **The Four Stream Types**
   - Readable: Read data from (fs.createReadStream)
   - Writable: Write data to (fs.createWriteStream)
   - Duplex: Both readable and writable (net.Socket)
   - Transform: Modify data (zlib.createGzip)

3. **Essential Events**
   ```javascript
   // Readable
   readable.on('data', chunk => { }); // Got data
   readable.on('end', () => { });     // No more data

   // Writable
   writable.on('drain', () => { });   // Ready for more
   writable.on('finish', () => { });  // All done

   // Both
   stream.on('error', err => { });    // Something failed
   ```

4. **Piping**
   ```javascript
   // Manual (hard)
   readable.on('data', chunk => writable.write(chunk));

   // Piping (easy)
   readable.pipe(writable);
   ```

---

## Common Pitfalls

### Pitfall 1: Not Handling Errors

```javascript
// ❌ Wrong - error crashes app
stream.pipe(destination);

// ✅ Correct - handle errors
stream
  .on('error', err => console.error('Error:', err))
  .pipe(destination)
  .on('error', err => console.error('Destination error:', err));
```

### Pitfall 2: Ignoring Backpressure

```javascript
// ❌ Wrong - can cause memory issues
readable.on('data', chunk => {
  writable.write(chunk); // Ignoring return value
});

// ✅ Correct - use pipe() or handle backpressure
readable.pipe(writable);
```

### Pitfall 3: Not Closing Streams

```javascript
// ❌ Wrong - stream stays open
writable.write('data');

// ✅ Correct - close when done
writable.write('data');
writable.end();
```

### Pitfall 4: Using Streams for Small Data

```javascript
// ❌ Overkill for small files
const stream = fs.createReadStream('config.json'); // Only 2KB

// ✅ Better for small files
const data = fs.readFileSync('config.json');
```

---

## Practice Projects

Apply what you've learned:

### Project 1: File Statistics Tool
Build a CLI tool that:
- Reads a file using streams
- Counts lines, words, and characters
- Shows progress for large files
- Displays results

### Project 2: Log File Analyzer
Create a program that:
- Streams through log files
- Filters by log level (INFO, WARN, ERROR)
- Outputs filtered logs to new file
- Shows summary statistics

### Project 3: Simple File Server
Build an HTTP server that:
- Streams file contents to clients
- Handles multiple concurrent requests
- Manages errors gracefully
- Shows request statistics

---

## Testing Your Knowledge

### Self-Check Questions

Answer these to verify your understanding:

1. What's the main advantage of streams over `readFile()`?
2. What are the four types of streams?
3. When does the `end` event fire on a readable stream?
4. What does `pipe()` do automatically that manual handling doesn't?
5. Why might `write()` return `false`?
6. How do you properly close a writable stream?
7. What happens if you don't handle stream errors?
8. When should you NOT use streams?

### Practical Check

You've mastered this level if you can:

- [ ] Read a 1GB file without running out of memory
- [ ] Copy any file using streams
- [ ] Explain why `pipe()` is better than manual handling
- [ ] Handle stream errors properly
- [ ] Build a simple stream-based pipeline
- [ ] Debug common stream issues

---

## Performance Insights

### Memory Usage

```javascript
// Non-stream: Memory = File Size
const data = fs.readFileSync('1gb.txt'); // 1GB RAM used

// Stream: Memory ≈ 64KB (default buffer)
const stream = fs.createReadStream('1gb.txt'); // ~64KB RAM used
```

### Speed Comparison

```javascript
// Streams start outputting immediately
// Non-streams wait until complete

// Time to first byte:
// - readFile: ~1000ms (for 1GB file)
// - stream: ~1ms (first chunk immediately)
```

---

## Additional Resources

### Official Documentation
- [Node.js Stream API](https://nodejs.org/api/stream.html)
- [Stream Module Documentation](https://nodejs.org/api/stream.html)

### Related Topics
- Module 1: File System - file streams
- Module 4: Events - streams are EventEmitters
- Module 7: HTTP - request/response streams

### Next Steps
- Complete all exercises
- Build practice projects
- Move to [Level 2: Intermediate](../level-2-intermediate/README.md)

---

## Getting Help

If you're stuck:

1. Review the relevant guide
2. Study the examples
3. Check your code against solutions
4. Review [CONCEPTS.md](../CONCEPTS.md)
5. Practice with smaller examples

---

## Ready to Start?

Begin with the [first guide](./guides/01-understanding-streams.md), then work through the examples and exercises at your own pace.

Remember: Streams are fundamental to Node.js. Take your time to understand them well - it will pay off throughout your Node.js journey!
