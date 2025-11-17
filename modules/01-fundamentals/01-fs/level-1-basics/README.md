# File System - Level 1: Basics

## 🎯 Start Here: Conceptual Understanding First!

**Before diving into code examples**, read these guides to understand the WHY behind file operations:

### 📖 Essential Guides (50 minutes total)

1. **[Synchronous vs Asynchronous Operations](guides/01-sync-vs-async.md)** ⭐ MOST IMPORTANT
   - **Time**: 15 minutes
   - **Why**: This is the #1 concept beginners struggle with
   - **What you'll learn**: The difference between sync/async, when to use each, common mistakes

2. **[Callbacks vs Promises vs Async/Await](guides/02-callbacks-vs-promises.md)**
   - **Time**: 20 minutes
   - **What you'll learn**: Evolution of async patterns, why async/await is best, how to convert between them

3. **[Error Handling in File Operations](guides/03-error-handling.md)**
   - **Time**: 15 minutes
   - **What you'll learn**: Error codes, try/catch patterns, production-ready error handling

### Why Read Guides First?

Without understanding these concepts:
- ❌ Code examples will be confusing
- ❌ You'll copy code without understanding it
- ❌ You'll make common mistakes
- ❌ Debugging will be frustrating

With conceptual understanding:
- ✅ Examples make perfect sense
- ✅ You understand your choices
- ✅ You avoid pitfalls
- ✅ You're interview-ready

**Recommended**: Read all three guides, then return here for examples and exercises.

---

## Learning Objectives

By the end of this level, you will be able to:

- ✅ Understand the difference between synchronous and asynchronous file operations
- ✅ Read text files using both callbacks and promises
- ✅ Write data to files
- ✅ Check if files exist
- ✅ Handle basic file operation errors
- ✅ Use `fs` vs `fs/promises` appropriately

## Topics Covered

### 1. Introduction to the File System Module
- What is the fs module?
- Why use asynchronous operations?
- Understanding the Node.js event loop impact

### 2. Reading Files
- `fs.readFile()` with callbacks
- `fs.promises.readFile()` with async/await
- Understanding encoding (utf8, binary)
- Common errors and handling

### 3. Writing Files
- `fs.writeFile()` - create or overwrite
- `fs.appendFile()` - add to existing file
- File permissions basics
- Error handling

### 4. File Existence and Basic Operations
- Checking if files exist
- Deleting files with `fs.unlink()`
- Renaming and moving files
- Copying files

### 5. Error Handling Patterns
- Try-catch with async/await
- Error-first callbacks
- Common error codes (ENOENT, EACCES, etc.)

## Prerequisites

- Basic JavaScript knowledge (variables, functions, objects)
- Familiarity with promises and async/await (covered in guides if needed)
- Node.js installed and set up (v18+ recommended)

## ⏱️ Time Required

**With Guides** (Recommended for deep learning):
- **Reading guides**: 50 minutes (one-time investment)
- **Examples**: 45 minutes
- **Exercises**: 45 minutes
- **Total**: ~2.5 hours

**Without Guides** (Fast track):
- **Examples**: 45 minutes
- **Exercises**: 45 minutes
- **Total**: ~1.5 hours (but you'll miss important concepts)

## 📚 Recommended Learning Flow

```
Step 1: Read Guides (50 min)
   ├─ Sync vs Async (15 min)
   ├─ Callbacks vs Promises (20 min)
   └─ Error Handling (15 min)
        ↓
Step 2: Study Examples (45 min)
   ├─ Read through each example
   ├─ Run the code yourself
   ├─ Modify and experiment
   └─ Understand every line
        ↓
Step 3: Complete Exercises (45 min)
   ├─ Attempt without looking at solutions
   ├─ Get stuck? Re-read relevant guide
   ├─ Still stuck? Check solution
   └─ Understand why solution works
        ↓
Step 4: Verify Understanding
   ├─ Can you explain concepts to someone?
   ├─ Do you understand your code choices?
   └─ Ready for Level 2? ✓
```

## Examples Overview

The `examples/` directory contains:

1. **01-read-file-callback.js** - Reading files with callbacks
2. **02-read-file-promises.js** - Reading files with promises
3. **03-write-file.js** - Writing data to files
4. **04-append-file.js** - Appending to existing files
5. **05-check-exists.js** - Checking file existence
6. **06-delete-file.js** - Deleting files
7. **07-copy-file.js** - Copying files
8. **08-error-handling.js** - Proper error handling

## Exercises Overview

Complete these exercises in order:

1. **Exercise 1**: Read a text file and display its contents
2. **Exercise 2**: Write user input to a file
3. **Exercise 3**: Check if a file exists before reading
4. **Exercise 4**: Copy a file from one location to another
5. **Exercise 5**: Count the number of lines in a text file

Each exercise has:
- Clear instructions in the exercise file
- Test data (if needed)
- Solution in the `solutions/` directory

## Getting Started

### Step 1: Review Examples

Navigate to the examples directory and run each example:

```bash
cd modules/01-fundamentals/01-fs/level-1-basics/examples
node 01-read-file-callback.js
node 02-read-file-promises.js
# ... and so on
```

### Step 2: Study the Code

Open each example in your editor and:
- Read the comments carefully
- Understand what each line does
- Try modifying values to see what happens
- Experiment with the code

### Step 3: Complete Exercises

```bash
cd ../exercises
node exercise-1.js
# Work through each exercise
```

### Step 4: Check Solutions

Only after attempting each exercise:

```bash
cd ../solutions
node exercise-1-solution.js
# Compare with your solution
```

## Key Concepts

### Synchronous vs Asynchronous

```javascript
// ❌ SYNCHRONOUS (blocks the event loop - avoid in production)
const fs = require('fs');
try {
  const data = fs.readFileSync('file.txt', 'utf8');
  console.log(data);
} catch (err) {
  console.error(err);
}

// ✅ ASYNCHRONOUS with callbacks
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});

// ✅ ASYNCHRONOUS with promises (RECOMMENDED)
const fsPromises = require('fs').promises;

async function readFile() {
  try {
    const data = await fsPromises.readFile('file.txt', 'utf8');
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
```

### File Encodings

```javascript
// Text file with UTF-8 encoding
const text = await fs.readFile('file.txt', 'utf8');

// Binary file (images, PDFs, etc.)
const buffer = await fs.readFile('image.png'); // Returns Buffer

// Explicit encoding
const data = await fs.readFile('file.txt', { encoding: 'utf8' });
```

### Error Handling

```javascript
// With async/await (recommended)
async function safeRead(filename) {
  try {
    const data = await fs.readFile(filename, 'utf8');
    return data;
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('File not found');
    } else if (err.code === 'EACCES') {
      console.error('Permission denied');
    } else {
      console.error('Error reading file:', err.message);
    }
    return null;
  }
}
```

## Common Error Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| `ENOENT` | No such file or directory | File doesn't exist |
| `EACCES` | Permission denied | Insufficient permissions |
| `EISDIR` | Is a directory | Tried to read directory as file |
| `EMFILE` | Too many open files | System limit reached |

## Best Practices

### ✅ DO:
- Use asynchronous methods (`fs.promises` or callbacks)
- Always handle errors
- Use `utf8` encoding for text files
- Close file handles when using `fs.open()`
- Validate file paths before operations

### ❌ DON'T:
- Use synchronous methods in production code
- Ignore errors
- Assume files exist without checking
- Hard-code file paths
- Leave file handles open

## Quick Reference

```javascript
const fs = require('fs').promises;

// Read file
const content = await fs.readFile('file.txt', 'utf8');

// Write file (overwrites existing)
await fs.writeFile('file.txt', 'content');

// Append to file
await fs.appendFile('file.txt', 'more content');

// Delete file
await fs.unlink('file.txt');

// Copy file
await fs.copyFile('source.txt', 'dest.txt');

// Rename/Move file
await fs.rename('old.txt', 'new.txt');

// Check if file exists
try {
  await fs.access('file.txt');
  console.log('File exists');
} catch {
  console.log('File does not exist');
}
```

## Practice Tips

1. **Type everything**: Don't copy-paste code
2. **Experiment**: Modify examples to see what happens
3. **Break things**: Try to make code fail to understand errors
4. **Read errors**: Understanding error messages is crucial
5. **Use the REPL**: Test small snippets quickly

## ✅ Testing Your Knowledge

Before moving to Level 2, you should be able to answer:

**Conceptual Questions** (answers in guides):
1. What is the difference between blocking and non-blocking I/O? ([guide](guides/01-sync-vs-async.md))
2. Why does Node.js prefer asynchronous operations? ([guide](guides/01-sync-vs-async.md))
3. When is it OK to use synchronous file operations? ([guide](guides/01-sync-vs-async.md#when-to-use-synchronous))
4. What's the difference between callbacks, promises, and async/await? ([guide](guides/02-callbacks-vs-promises.md))
5. Why is async/await the recommended approach? ([guide](guides/02-callbacks-vs-promises.md#which-should-i-use))
6. What are the common file system error codes and what do they mean? ([guide](guides/03-error-handling.md))

**Practical Questions** (from examples):
1. What's the difference between `fs` and `fs.promises`?
2. What does 'utf8' encoding mean?
3. How do you check if a file exists?
4. How do you properly handle errors with async/await?
5. What's the difference between `writeFile` and `appendFile`?

**Self-Assessment**:
- [ ] Can you explain concepts without looking at notes?
- [ ] Do you understand WHY, not just HOW?
- [ ] Can you debug file operation errors independently?
- [ ] Could you explain these concepts in an interview?

## Exercises Checklist

- [ ] Exercise 1: Read and display file contents
- [ ] Exercise 2: Write user input to file
- [ ] Exercise 3: Check file existence
- [ ] Exercise 4: Copy files
- [ ] Exercise 5: Count lines in file
- [ ] Reviewed all solutions
- [ ] Understood all concepts

## Mini Project: Simple File Manager

After completing the exercises, build a simple CLI tool that:

1. Accepts commands: read, write, append, delete, copy
2. Handles errors gracefully
3. Uses promises (async/await)
4. Validates file paths

Example:
```bash
node file-manager.js read data.txt
node file-manager.js write output.txt "Hello World"
node file-manager.js copy source.txt dest.txt
```

## Next Steps

Once you've completed all exercises and the mini project:

- [ ] Review any challenging concepts
- [ ] Practice the quick reference examples
- [ ] Move to [Level 2: Intermediate](../level-2-intermediate/README.md)

## Need Help?

- Review the examples again
- Check the official [fs documentation](https://nodejs.org/api/fs.html)
- Try the exercises with simpler inputs first
- Look at solutions only after attempting exercises

---

**Ready to code?** Start with the [examples](./examples/) directory!
