# Level 3: Advanced File System Operations

Master advanced file system concepts including streams, file descriptors, performance optimization, and production-ready patterns.

## Prerequisites

Before starting Level 3, you should be comfortable with:
- All Level 1 and Level 2 concepts
- Async/await patterns and error handling
- Promise chaining and Promise.all()
- Recursive algorithms
- Event emitters

## Learning Objectives

By the end of this level, you will be able to:

1. **Streams & Performance**
   - Use read/write streams for large files
   - Implement custom transform streams
   - Optimize memory usage with streaming
   - Handle backpressure correctly

2. **Low-Level Operations**
   - Work with file descriptors
   - Use fs.open(), fs.read(), fs.write() for precise control
   - Understand file permissions and modes
   - Implement file locking mechanisms

3. **Advanced Patterns**
   - Build production-ready file watchers
   - Implement atomic file operations
   - Handle symbolic and hard links
   - Create custom file system abstractions

4. **Performance & Optimization**
   - Profile file operations
   - Optimize large-scale file processing
   - Implement caching strategies
   - Handle concurrent file access safely

5. **Production Concerns**
   - Implement robust error recovery
   - Handle edge cases and race conditions
   - Log and monitor file operations
   - Test file system code effectively

## Topics Covered

### 1. Streams for Large Files
- `fs.createReadStream()` and `fs.createWriteStream()`
- Handling backpressure with `pipe()`
- Custom transform streams
- Stream events: data, end, error, drain
- Memory-efficient file processing

### 2. File Descriptors
- Low-level file operations with `fs.open()`
- Reading/writing at specific positions
- File descriptor management and cleanup
- Advanced file modes and flags

### 3. Symbolic and Hard Links
- Creating and managing symlinks
- Following vs not following links
- Link resolution with `fs.realpath()`
- Hard link behavior and use cases

### 4. File Locking
- Implementing exclusive file access
- Lock files for coordination
- Handling concurrent modifications
- Atomic operations with rename

### 5. Performance Optimization
- Batch operations for efficiency
- Parallel processing strategies
- Caching file metadata
- Minimizing syscalls

### 6. Advanced Watching
- Robust file watching patterns
- Handling watch limitations
- Recursive watching strategies
- Debouncing and throttling

### 7. Custom Abstractions
- Building file system wrappers
- Virtual file systems
- Mocking for tests
- Plugin architectures

### 8. Production Patterns
- Graceful degradation
- Retry mechanisms with exponential backoff
- Circuit breakers for file operations
- Health checks and monitoring

## Examples Overview

1. **01-streams-basics.js** - Reading/writing large files with streams
2. **02-transform-streams.js** - Custom stream transformations
3. **03-file-descriptors.js** - Low-level file operations
4. **04-symbolic-links.js** - Working with symlinks and hard links
5. **05-file-locking.js** - Implementing file locks
6. **06-performance-optimization.js** - Optimizing file operations
7. **07-advanced-watching.js** - Production-ready file watchers
8. **08-custom-abstractions.js** - Building file system wrappers

## Exercises

1. **Large File Processor** - Process multi-GB files with streams
2. **File Database** - Build a simple key-value store with file descriptors
3. **Sync Tool** - Create a file synchronization utility
4. **Log Rotator** - Implement automatic log rotation
5. **Virtual FS** - Build an in-memory file system abstraction

## Key Concepts

### Streams vs. Buffer Loading

```javascript
// ✗ BAD: Loads entire file into memory
const data = await fs.readFile('huge-file.txt');

// ✓ GOOD: Streams data in chunks
const stream = fs.createReadStream('huge-file.txt');
stream.on('data', chunk => process(chunk));
```

### Backpressure Handling

```javascript
// ✓ Handle backpressure correctly
const reader = fs.createReadStream('source.txt');
const writer = fs.createWriteStream('dest.txt');

reader.pipe(writer); // Automatically handles backpressure

// Or manually:
reader.on('data', chunk => {
  const canContinue = writer.write(chunk);
  if (!canContinue) {
    reader.pause();
    writer.once('drain', () => reader.resume());
  }
});
```

### File Descriptors

```javascript
// Low-level file operations
const fd = await fs.open('file.txt', 'r+');
try {
  const buffer = Buffer.alloc(1024);
  const { bytesRead } = await fd.read(buffer, 0, 1024, 0);
  await fd.write(buffer, 0, bytesRead, 1024);
} finally {
  await fd.close(); // Always close!
}
```

### Atomic Operations

```javascript
// ✓ Atomic file write with rename
await fs.writeFile('file.tmp', data);
await fs.rename('file.tmp', 'file.txt'); // Atomic on most systems
```

## Performance Tips

1. **Use Streams for Large Files**
   - Files > 100MB should use streams
   - Reduces memory footprint
   - Enables processing during I/O

2. **Batch Operations**
   - Group multiple operations
   - Use Promise.all() for parallel I/O
   - Limit concurrency to avoid overwhelming system

3. **Cache Metadata**
   - Store file stats if reused
   - Reduces fs.stat() calls
   - Clear cache on file changes

4. **Minimize Syscalls**
   - Read larger chunks when appropriate
   - Combine operations where possible
   - Use buffers efficiently

## Common Pitfalls

1. **Not Handling Backpressure**
   ```javascript
   // ✗ BAD: Can cause memory issues
   reader.on('data', chunk => writer.write(chunk));

   // ✓ GOOD: Use pipe() or handle backpressure
   reader.pipe(writer);
   ```

2. **Forgetting to Close File Descriptors**
   ```javascript
   // ✗ BAD: File descriptor leak
   const fd = await fs.open('file.txt', 'r');
   const data = await fd.readFile();

   // ✓ GOOD: Always close
   const fd = await fs.open('file.txt', 'r');
   try {
     const data = await fd.readFile();
   } finally {
     await fd.close();
   }
   ```

3. **Ignoring Race Conditions**
   ```javascript
   // ✗ BAD: Race condition
   const exists = await fs.access('file.txt').then(() => true).catch(() => false);
   if (exists) {
     await fs.unlink('file.txt'); // File might be deleted by now!
   }

   // ✓ GOOD: Just try and handle error
   try {
     await fs.unlink('file.txt');
   } catch (err) {
     if (err.code !== 'ENOENT') throw err;
   }
   ```

## Testing Strategies

1. **Mock the File System**
   - Use libraries like `mock-fs`
   - Don't test actual disk I/O in unit tests
   - Test logic separately from I/O

2. **Integration Tests**
   - Use temporary directories
   - Clean up after tests
   - Test real file operations

3. **Error Injection**
   - Simulate ENOSPC (no space)
   - Test permission errors
   - Verify cleanup on errors

## Real-World Applications

- **Log Processing**: Analyze large log files with streams
- **File Synchronization**: Build Dropbox-like sync tools
- **Build Tools**: Implement file watchers for hot reload
- **Backup Systems**: Create efficient backup utilities
- **Data Migration**: Transform large datasets
- **File Databases**: Build simple persistence layers

## Additional Resources

- [Node.js Streams Documentation](https://nodejs.org/api/stream.html)
- [File System Flags](https://nodejs.org/api/fs.html#file-system-flags)
- [Stream Handbook](https://github.com/substack/stream-handbook)
- [Backpressure Guide](https://nodejs.org/en/docs/guides/backpressuring-in-streams/)

## Progress Checklist

- [ ] Read through all 8 examples
- [ ] Run each example and observe output
- [ ] Complete Exercise 1: Large File Processor
- [ ] Complete Exercise 2: File Database
- [ ] Complete Exercise 3: Sync Tool
- [ ] Complete Exercise 4: Log Rotator
- [ ] Complete Exercise 5: Virtual FS
- [ ] Review solutions and compare approaches
- [ ] Build a small project using advanced fs concepts

## Next Steps

After completing Level 3, you will have mastered the File System module. Consider:

1. Moving to **Module 2: Path** for advanced path manipulation
2. Exploring **Module 5: Stream** for deeper stream knowledge
3. Building a real project that uses all three levels of fs knowledge

---

**Estimated Time**: 8-12 hours for examples and exercises

**Difficulty**: ⭐⭐⭐ Advanced

Ready to master advanced file system operations? Start with `01-streams-basics.js`!
