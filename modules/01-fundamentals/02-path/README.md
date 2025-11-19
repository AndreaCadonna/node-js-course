# Module 2: Path

Master cross-platform file path manipulation in Node.js.

## Why This Module Matters

The `path` module is critical for building portable Node.js applications. Whether you're building a CLI tool, a web server, or a desktop application, you'll need to work with file paths. The path module ensures your application works correctly across Windows, macOS, and Linux by handling platform-specific path formats automatically.

**Real-world applications:**
- Building file upload systems
- Creating CLI tools
- Developing build tools and bundlers
- Implementing file-based routing
- Managing application configurations
- Processing log files

---

## What You'll Learn

By completing this module, you'll master:

### Technical Skills
- Path construction and manipulation
- Cross-platform path handling
- Path validation and security
- Glob pattern matching
- Symbolic link management

### Practical Applications
- Build portable file utilities
- Prevent security vulnerabilities
- Handle edge cases confidently
- Write platform-agnostic code
- Create robust path validation

---

## Module Structure

This module is divided into three progressive levels:

### [Level 1: Basics](./level-1-basics/README.md)
**Time**: 1-2 hours

Learn the fundamentals of path manipulation:
- Understanding path separators
- Using `path.join()` vs `path.resolve()`
- Working with `__dirname` and `__filename`
- Extracting path components
- Basic cross-platform compatibility

**You'll be able to:**
- Join path segments safely
- Extract filenames and extensions
- Build absolute paths
- Write cross-platform path code

### [Level 2: Intermediate](./level-2-intermediate/README.md)
**Time**: 2-3 hours

Advanced path manipulation techniques:
- Normalizing paths
- Calculating relative paths
- Handling special path characters
- Path validation
- Format conversion

**You'll be able to:**
- Convert between path formats
- Find relative paths between locations
- Validate user-provided paths
- Handle edge cases
- Build path utilities

### [Level 3: Advanced](./level-3-advanced/README.md)
**Time**: 3-4 hours

Production-ready path handling:
- Glob pattern implementation
- Symbolic link resolution
- Path traversal prevention
- Security hardening
- Cross-platform edge cases

**You'll be able to:**
- Implement pattern matching
- Prevent security vulnerabilities
- Handle symbolic links safely
- Build robust path libraries
- Solve complex path problems

---

## Prerequisites

- **Module 1: File System** (recommended, but not required)
- Basic JavaScript knowledge
- Node.js installed (v14+)
- Understanding of file system concepts

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

**Fast Track** (If you're experienced):
- Skim Level 1
- Focus on Level 2 and 3
- Complete advanced exercises

**Deep Dive** (If you want mastery):
- Read all guides thoroughly
- Complete all exercises
- Build additional projects
- Study the solutions for alternative approaches

---

## Key Concepts

### Path Components

Every path has components you can extract and manipulate:

```javascript
const path = require('path');

const filePath = '/home/user/documents/report.pdf';

console.log(path.dirname(filePath));  // '/home/user/documents'
console.log(path.basename(filePath)); // 'report.pdf'
console.log(path.extname(filePath));  // '.pdf'
```

### Cross-Platform Compatibility

The path module handles platform differences automatically:

```javascript
// Works on all platforms
const filePath = path.join('users', 'john', 'documents', 'file.txt');

// Windows: users\john\documents\file.txt
// Unix: users/john/documents/file.txt
```

### Absolute vs Relative Paths

Understanding the difference is crucial:

```javascript
// Relative path (depends on current directory)
path.join('data', 'file.txt');

// Absolute path (complete path from root)
path.resolve('data', 'file.txt'); // '/current/working/dir/data/file.txt'
```

### Security Considerations

Always validate user-provided paths:

```javascript
// Prevent path traversal
function isPathSafe(basePath, userPath) {
  const resolved = path.resolve(basePath, userPath);
  return resolved.startsWith(path.resolve(basePath));
}
```

---

## Practical Examples

### Example 1: Building File Paths

```javascript
const path = require('path');

// Get current file's directory
console.log(__dirname); // Current directory
console.log(__filename); // Current file

// Build paths relative to current file
const configPath = path.join(__dirname, 'config', 'app.json');
const dataPath = path.join(__dirname, '..', 'data', 'users.db');
```

### Example 2: File Extension Handling

```javascript
const path = require('path');

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
}

console.log(isImageFile('photo.jpg')); // true
console.log(isImageFile('document.pdf')); // false
```

### Example 3: Path Parsing and Formatting

```javascript
const path = require('path');

const filePath = '/home/user/photo.jpg';
const parsed = path.parse(filePath);

console.log(parsed);
// {
//   root: '/',
//   dir: '/home/user',
//   base: 'photo.jpg',
//   ext: '.jpg',
//   name: 'photo'
// }

// Change extension
const newPath = path.format({
  ...parsed,
  base: undefined, // Clear base
  ext: '.png'
});
console.log(newPath); // '/home/user/photo.png'
```

---

## Common Pitfalls

### ❌ String Concatenation

```javascript
// Wrong - breaks on Windows
const filePath = dir + '/' + filename;

// Correct - works everywhere
const filePath = path.join(dir, filename);
```

### ❌ Hardcoded Separators

```javascript
// Wrong - assumes Unix
const parts = filePath.split('/');

// Correct - uses platform separator
const parts = filePath.split(path.sep);
```

### ❌ Not Normalizing User Input

```javascript
// Wrong - vulnerable to path traversal
const filePath = path.join(uploadDir, req.body.filename);

// Correct - validate first
const filename = path.basename(req.body.filename);
const filePath = path.join(uploadDir, filename);
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
- **14 in-depth guides** - Deep understanding of specific topics
- **Level 1**: 3 guides on fundamentals
- **Level 2**: 5 guides on intermediate patterns
- **Level 3**: 6 guides on advanced topics

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
   node examples/01-path-join.js
   ```

4. **Try an exercise**:
   ```bash
   node exercises/exercise-1.js
   ```

### Setting Up

No special setup is required! The path module is built into Node.js.

```javascript
// Just import and start using
const path = require('path');
```

---

## Success Criteria

You'll know you've mastered this module when you can:

- [ ] Explain the difference between `path.join()` and `path.resolve()`
- [ ] Build cross-platform file paths without thinking
- [ ] Extract and manipulate path components confidently
- [ ] Validate user-provided paths for security
- [ ] Handle path edge cases (special characters, symbolic links)
- [ ] Implement glob pattern matching
- [ ] Prevent path traversal vulnerabilities
- [ ] Write portable path utilities that work on any OS

---

## Additional Resources

### Official Documentation
- [Node.js Path Documentation](https://nodejs.org/api/path.html)

### Practice Projects
After completing this module, try building:
1. **File Organizer** - Organize files by extension
2. **Path Validator** - Secure path validation library
3. **Glob Matcher** - Simple glob pattern implementation
4. **Cross-Platform CLI** - Tool that works on any OS

### Related Modules
- **Module 1: File System** - Use paths with file operations
- **Module 11: URL** - Understanding path vs URL
- **Module 12: Child Process** - Pass paths to external commands

---

## Questions or Issues?

- Review the [CONCEPTS.md](./CONCEPTS.md) for foundational understanding
- Check the examples for practical demonstrations
- Study the guides for deep dives into specific topics
- Review solutions after attempting exercises

---

## Let's Begin!

Start your journey with [Level 1: Basics](./level-1-basics/README.md) and build a solid foundation in path manipulation.

Remember: The path module is one of the most frequently used core modules. Master it, and you'll write better, more secure, and more portable Node.js applications!
