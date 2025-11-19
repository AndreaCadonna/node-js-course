# Level 1: Path Basics

Master the fundamentals of cross-platform path manipulation in Node.js.

## Learning Objectives

By the end of this level, you will be able to:
- Understand path separators and cross-platform differences
- Use `path.join()` to combine path segments safely
- Use `path.resolve()` to create absolute paths
- Work with `__dirname` and `__filename` for file-relative paths
- Extract path components (basename, dirname, extname)
- Write cross-platform compatible path code

## Overview

The path module is essential for any Node.js application that works with files. Different operating systems use different path formats, and the path module abstracts these differences, allowing you to write code that works everywhere.

---

## Topics Covered

### 1. Path Module Basics
- Importing and using the path module
- Understanding path separators (`/` vs `\`)
- Platform-specific considerations

### 2. Joining Paths
- `path.join()` for combining segments
- Handling relative path components
- Cross-platform compatibility

### 3. Resolving Paths
- `path.resolve()` for absolute paths
- Difference between join and resolve
- Working with current directory

### 4. Path Components
- `path.basename()` - Get filename
- `path.dirname()` - Get directory
- `path.extname()` - Get extension
- When to use each method

### 5. Special Variables
- `__dirname` - Current directory path
- `__filename` - Current file path
- Building file-relative paths

---

## Examples

This level includes 8 comprehensive examples:

1. **[01-path-join.js](./examples/01-path-join.js)**
   - Using `path.join()` to combine path segments
   - Understanding cross-platform compatibility
   - Common join patterns

2. **[02-path-resolve.js](./examples/02-path-resolve.js)**
   - Creating absolute paths with `path.resolve()`
   - Understanding how resolve works
   - Difference from join

3. **[03-dirname-filename.js](./examples/03-dirname-filename.js)**
   - Working with `__dirname` and `__filename`
   - Building paths relative to current file
   - Practical use cases

4. **[04-path-components.js](./examples/04-path-components.js)**
   - Extracting path components
   - Using basename, dirname, extname
   - Practical applications

5. **[05-path-parse.js](./examples/05-path-parse.js)**
   - Parsing paths into objects
   - Understanding path structure
   - Accessing individual components

6. **[06-path-format.js](./examples/06-path-format.js)**
   - Building paths from components
   - Using `path.format()`
   - Changing file extensions

7. **[07-path-separators.js](./examples/07-path-separators.js)**
   - Understanding `path.sep` and `path.delimiter`
   - Platform-specific separators
   - When to use them

8. **[08-cross-platform.js](./examples/08-cross-platform.js)**
   - Writing portable path code
   - Common pitfalls to avoid
   - Best practices

### Running Examples

```bash
# Run any example
node examples/01-path-join.js

# Run all examples
for file in examples/*.js; do
  echo "Running $file"
  node "$file"
  echo "---"
done
```

---

## Exercises

Test your understanding with 5 practical exercises:

1. **[exercise-1.js](./exercises/exercise-1.js)** - Join multiple path segments
2. **[exercise-2.js](./exercises/exercise-2.js)** - Extract filename from a full path
3. **[exercise-3.js](./exercises/exercise-3.js)** - Get file extension
4. **[exercise-4.js](./exercises/exercise-4.js)** - Build absolute paths from relative ones
5. **[exercise-5.js](./exercises/exercise-5.js)** - Create cross-platform file paths

### Exercise Guidelines

1. Read the exercise description in each file
2. Write your solution where indicated
3. Test your solution by running the file
4. Compare with the solution only after attempting

### Checking Solutions

Solutions are available in the `solutions/` directory:

```bash
# After attempting, compare your solution
node solutions/exercise-1-solution.js
```

---

## Conceptual Guides

For deeper understanding, read these guides:

1. **[01-join-vs-resolve.md](./guides/01-join-vs-resolve.md)**
   - Deep dive into path.join() vs path.resolve()
   - When to use each method
   - Common misconceptions

2. **[02-dirname-filename.md](./guides/02-dirname-filename.md)**
   - Understanding __dirname and __filename
   - ES modules vs CommonJS differences
   - Practical patterns

3. **[03-cross-platform-paths.md](./guides/03-cross-platform-paths.md)**
   - Writing portable path code
   - Platform-specific issues
   - Testing across platforms

---

## Key Concepts

### path.join() vs path.resolve()

**path.join()** - Combines path segments:
```javascript
path.join('a', 'b', 'c');
// 'a/b/c' (Unix) or 'a\\b\\c' (Windows)
```

**path.resolve()** - Creates absolute path:
```javascript
path.resolve('a', 'b', 'c');
// '/current/working/dir/a/b/c'
```

### __dirname and __filename

**__dirname** - Directory of current file:
```javascript
console.log(__dirname);
// '/home/user/project/src'
```

**__filename** - Full path of current file:
```javascript
console.log(__filename);
// '/home/user/project/src/app.js'
```

### Path Components

```javascript
const filePath = '/home/user/document.pdf';

path.basename(filePath); // 'document.pdf'
path.dirname(filePath);  // '/home/user'
path.extname(filePath);  // '.pdf'
```

---

## Common Patterns

### Building Config Paths

```javascript
const path = require('path');

// Get config file relative to current file
const configPath = path.join(__dirname, 'config', 'app.json');
```

### Checking File Types

```javascript
function isJavaScriptFile(filename) {
  return path.extname(filename) === '.js';
}
```

### Getting Filename Without Extension

```javascript
const filename = 'document.pdf';
const name = path.basename(filename, path.extname(filename));
// 'document'
```

---

## Best Practices

### ✅ DO

- Use `path.join()` for combining path segments
- Use `path.resolve()` when you need absolute paths
- Use `__dirname` for file-relative paths
- Always use path module methods instead of string manipulation

### ❌ DON'T

- Don't use string concatenation for paths
- Don't hardcode path separators (`/` or `\`)
- Don't assume case sensitivity
- Don't forget about cross-platform differences

---

## Common Mistakes

### Mistake 1: String Concatenation

```javascript
// ❌ Wrong - breaks on Windows
const filePath = dir + '/' + filename;

// ✅ Correct
const filePath = path.join(dir, filename);
```

### Mistake 2: Confusing join and resolve

```javascript
// join - relative path
path.join('dir', 'file.txt');     // 'dir/file.txt'

// resolve - absolute path
path.resolve('dir', 'file.txt');  // '/current/dir/dir/file.txt'
```

### Mistake 3: Hardcoded Separators

```javascript
// ❌ Wrong
const parts = filePath.split('/');

// ✅ Correct
const parts = filePath.split(path.sep);
```

---

## Testing Your Knowledge

After completing this level, you should be able to answer:

1. What's the difference between `path.join()` and `path.resolve()`?
2. When should you use `__dirname` vs `process.cwd()`?
3. How do you extract a filename from a full path?
4. Why is using `/` directly in paths problematic?
5. How do you change a file's extension?

---

## Next Steps

Once you've completed this level:

1. ✅ Complete all exercises
2. ✅ Read all conceptual guides
3. ✅ Understand join vs resolve
4. ✅ Practice with __dirname and __filename
5. ➡️ Move to [Level 2: Intermediate](../level-2-intermediate/README.md)

---

## Time Estimate

- **Examples**: 20-30 minutes
- **Exercises**: 30-45 minutes
- **Guides**: 20-30 minutes
- **Total**: 1-2 hours

---

## Summary

Level 1 covers the essential path module operations you'll use daily:
- Joining and resolving paths
- Extracting path components
- Working with __dirname and __filename
- Writing cross-platform compatible code

These fundamentals are the building blocks for all path manipulation in Node.js. Master them, and you'll be ready for more advanced topics in Level 2!
