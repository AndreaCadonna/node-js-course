# Level 2: Path Intermediate

Master advanced path manipulation, validation, and security in Node.js.

## Learning Objectives

By the end of this level, you will be able to:
- Normalize paths to clean up redundant separators and relative markers
- Calculate relative paths between any two locations
- Handle special path characters and edge cases (., .., ~)
- Validate and sanitize user-provided paths securely
- Convert between Windows and Unix path formats
- Prevent path traversal attacks
- Build robust path utility libraries
- Handle complex path parsing scenarios

## Overview

Level 2 builds on the fundamentals from Level 1 and introduces critical techniques for handling real-world path challenges. You'll learn how to work with messy paths, validate user input, and write secure code that prevents common vulnerabilities.

---

## Topics Covered

### 1. Path Normalization
- Understanding what normalization does
- Using `path.normalize()` to clean paths
- When normalization matters
- Edge cases and gotchas

### 2. Relative Path Calculation
- Using `path.relative()` to find relationships
- Calculating paths between directories
- Handling same-level vs nested directories
- Working across drive letters (Windows)

### 3. Special Path Characters
- Understanding `.` (current directory)
- Understanding `..` (parent directory)
- Handling `~` (home directory)
- Edge cases with multiple consecutive markers

### 4. Path Validation and Security
- Validating path structure
- Preventing path traversal attacks
- Sanitizing user input
- Checking path boundaries
- Security best practices

### 5. Format Conversion
- Converting Windows paths to Unix format
- Converting Unix paths to Windows format
- Using `path.posix` and `path.win32`
- Cross-platform path handling

---

## Examples

This level includes 8 comprehensive examples:

1. **[01-path-normalize.js](./examples/01-path-normalize.js)**
   - Using `path.normalize()` to clean up messy paths
   - Handling redundant separators and relative markers
   - Understanding when normalization helps

2. **[02-path-relative.js](./examples/02-path-relative.js)**
   - Calculating relative paths with `path.relative()`
   - Finding paths between directories
   - Practical use cases

3. **[03-special-paths.js](./examples/03-special-paths.js)**
   - Working with `.`, `..`, and special characters
   - Understanding edge cases
   - Handling multiple levels of parent navigation

4. **[04-path-validation.js](./examples/04-path-validation.js)**
   - Validating path structure and safety
   - Checking for invalid characters
   - Ensuring paths stay within boundaries

5. **[05-format-conversion.js](./examples/05-format-conversion.js)**
   - Converting between Windows and Unix formats
   - Using `path.posix` and `path.win32`
   - Writing portable conversion utilities

6. **[06-path-security.js](./examples/06-path-security.js)**
   - Preventing path traversal attacks
   - Sanitizing user input
   - Implementing secure path handling
   - Real-world security patterns

7. **[07-path-utilities.js](./examples/07-path-utilities.js)**
   - Building useful path utility functions
   - Combining path operations
   - Creating a reusable toolkit

8. **[08-advanced-parsing.js](./examples/08-advanced-parsing.js)**
   - Complex path parsing scenarios
   - Extracting multiple components
   - Advanced pattern matching
   - Edge case handling

### Running Examples

```bash
# Run any example
node examples/01-path-normalize.js

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

1. **[exercise-1.js](./exercises/exercise-1.js)** - Convert between Windows and Unix paths
2. **[exercise-2.js](./exercises/exercise-2.js)** - Find relative path between two locations
3. **[exercise-3.js](./exercises/exercise-3.js)** - Validate user-provided file paths
4. **[exercise-4.js](./exercises/exercise-4.js)** - Build a path utility library
5. **[exercise-5.js](./exercises/exercise-5.js)** - Handle special characters in paths

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

For deeper understanding, read these comprehensive guides:

1. **[01-normalization.md](./guides/01-normalization.md)**
   - Deep dive into path normalization
   - When and why to normalize
   - Common normalization scenarios
   - Platform-specific behaviors

2. **[02-relative-paths.md](./guides/02-relative-paths.md)**
   - Understanding relative path calculation
   - Algorithm behind `path.relative()`
   - Complex scenarios and edge cases
   - Practical applications

3. **[03-special-characters.md](./guides/03-special-characters.md)**
   - Comprehensive guide to special paths
   - Understanding `.`, `..`, and symbolic references
   - Edge cases and gotchas
   - Platform differences

4. **[04-path-validation.md](./guides/04-path-validation.md)**
   - Secure path validation strategies
   - Preventing path traversal attacks
   - Input sanitization techniques
   - Security best practices
   - Common vulnerabilities

5. **[05-format-conversion.md](./guides/05-format-conversion.md)**
   - Cross-platform path format handling
   - Windows vs Unix path differences
   - Using posix and win32 modules
   - Writing portable code

---

## Key Concepts

### Path Normalization

**path.normalize()** - Cleans up redundant elements:
```javascript
path.normalize('/users//john/./documents/../photos/');
// '/users/john/photos/'
```

### Relative Path Calculation

**path.relative()** - Find path from A to B:
```javascript
path.relative('/data/users', '/data/photos');
// '../photos'
```

### Special Path Characters

```javascript
// Current directory
'./file.txt'  // Same as 'file.txt'

// Parent directory
'../file.txt'  // Go up one level

// Multiple levels up
'../../file.txt'  // Go up two levels
```

### Path Security

```javascript
// Prevent traversal attacks
const safe = path.join(baseDir, userInput);
if (!safe.startsWith(path.resolve(baseDir) + path.sep)) {
  throw new Error('Path traversal detected!');
}
```

---

## Common Patterns

### Normalizing User Input

```javascript
const path = require('path');

function normalizeUserPath(userPath) {
  return path.normalize(userPath);
}
```

### Safe Path Joining

```javascript
function safeJoin(base, userPath) {
  const joined = path.join(base, userPath);
  const resolved = path.resolve(joined);
  const basePath = path.resolve(base);

  if (!resolved.startsWith(basePath + path.sep)) {
    throw new Error('Invalid path');
  }

  return joined;
}
```

### Finding Relative Imports

```javascript
function getImportPath(fromFile, toFile) {
  const fromDir = path.dirname(fromFile);
  const relative = path.relative(fromDir, toFile);

  // Ensure it starts with ./ for relative imports
  if (!relative.startsWith('.')) {
    return './' + relative;
  }

  return relative;
}
```

### Cross-Platform Path Conversion

```javascript
function toUnixPath(windowsPath) {
  return windowsPath.split(path.win32.sep).join(path.posix.sep);
}

function toWindowsPath(unixPath) {
  return unixPath.split(path.posix.sep).join(path.win32.sep);
}
```

---

## Best Practices

### ✅ DO

- Always normalize user input paths
- Validate paths before file operations
- Check for path traversal attempts
- Use `path.relative()` for calculating imports
- Test path code on multiple platforms
- Sanitize paths from external sources
- Use appropriate format conversion when needed

### ❌ DON'T

- Don't trust user input without validation
- Don't assume paths are normalized
- Don't ignore platform differences in validation
- Don't skip security checks for "internal" paths
- Don't use regex for path validation (use path module)
- Don't forget about edge cases (empty paths, root, etc.)

---

## Common Mistakes

### Mistake 1: Forgetting to Normalize

```javascript
// ❌ Wrong - doesn't clean up path
const userPath = 'data//files/../config.json';
fs.readFile(userPath); // Works but messy

// ✅ Correct
const cleanPath = path.normalize(userPath);
fs.readFile(cleanPath);
```

### Mistake 2: Insecure Path Joining

```javascript
// ❌ Wrong - vulnerable to traversal
const filePath = path.join('/app/data', userInput);
// userInput = '../../etc/passwd' → '/etc/passwd' ⚠️

// ✅ Correct - validates result
const filePath = path.join('/app/data', userInput);
if (!filePath.startsWith('/app/data/')) {
  throw new Error('Invalid path');
}
```

### Mistake 3: Incorrect Relative Path Usage

```javascript
// ❌ Wrong - relative to cwd, not file
const relativePath = path.relative('src', 'lib');
// Depends on where you run it!

// ✅ Correct - use absolute paths
const from = path.resolve(__dirname, 'src');
const to = path.resolve(__dirname, 'lib');
const relativePath = path.relative(from, to);
```

### Mistake 4: Platform-Specific Code

```javascript
// ❌ Wrong - assumes Unix paths
const parts = filePath.split('/');

// ✅ Correct - use path.sep
const parts = filePath.split(path.sep);
```

---

## Security Considerations

### Path Traversal Prevention

Path traversal is one of the most common security vulnerabilities:

```javascript
// User input: '../../../../etc/passwd'
// Without validation: Could access any file!

// Safe approach:
function securePath(baseDir, userPath) {
  const normalized = path.normalize(userPath);
  const fullPath = path.resolve(baseDir, normalized);
  const base = path.resolve(baseDir);

  // Ensure result is within base directory
  if (!fullPath.startsWith(base + path.sep)) {
    throw new Error('Path traversal detected');
  }

  return fullPath;
}
```

### Input Validation

Always validate paths from external sources:

```javascript
function isValidPath(userPath) {
  // Check for null bytes
  if (userPath.includes('\0')) return false;

  // Check for suspicious patterns
  const suspicious = ['../', '..\\', '%2e%2e'];
  for (const pattern of suspicious) {
    if (userPath.includes(pattern)) return false;
  }

  // Normalize and check result
  const normalized = path.normalize(userPath);
  if (normalized !== userPath) {
    // Path changed during normalization - suspicious
    return false;
  }

  return true;
}
```

---

## Testing Your Knowledge

After completing this level, you should be able to answer:

1. What does `path.normalize()` do and when should you use it?
2. How do you safely calculate a relative path between two files?
3. What is a path traversal attack and how do you prevent it?
4. How do you convert between Windows and Unix path formats?
5. What special characters need handling in paths and why?
6. How do you validate user input paths securely?

---

## Next Steps

Once you've completed this level:

1. ✅ Complete all exercises
2. ✅ Read all conceptual guides
3. ✅ Understand path security
4. ✅ Practice with validation patterns
5. ➡️ Move to [Level 3: Advanced](../level-3-advanced/README.md)

---

## Time Estimate

- **Examples**: 30-45 minutes
- **Exercises**: 45-60 minutes
- **Guides**: 45-60 minutes
- **Total**: 2-3 hours

---

## Summary

Level 2 covers critical path manipulation techniques for real-world applications:
- Normalizing and cleaning paths
- Calculating relative paths
- Handling special characters and edge cases
- Validating paths securely
- Converting between path formats
- Preventing security vulnerabilities

These skills are essential for building secure, robust applications that handle file paths safely across all platforms. Master them, and you'll be able to handle any path-related challenge confidently!
