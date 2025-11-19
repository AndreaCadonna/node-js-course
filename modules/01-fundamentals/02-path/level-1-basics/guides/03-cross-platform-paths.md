# Guide: Cross-Platform Path Compatibility

**Reading Time**: 22 minutes
**Difficulty**: Beginner to Intermediate
**Prerequisites**: Basic understanding of path.join() and __dirname

---

## Introduction

**The most frustrating bug**: Your code works perfectly on your Mac, then breaks mysteriously on Windows (or vice versa).

The culprit? **Path separators**.

Writing cross-platform path code isn't just good practice - it's **essential**. Your users don't all use the same operating system, and your code should work everywhere.

### What You'll Learn

- Platform-specific path differences
- How to write portable path code
- Common cross-platform mistakes
- Testing strategies for multiple platforms
- Security considerations
- Best practices and patterns

---

## Table of Contents

1. [The Platform Problem](#the-platform-problem)
2. [Path Separators](#path-separators)
3. [Case Sensitivity](#case-sensitivity)
4. [Drive Letters and UNC Paths](#drive-letters-and-unc-paths)
5. [Path Delimiters](#path-delimiters)
6. [Best Practices](#best-practices)
7. [Common Mistakes](#common-mistakes)
8. [Testing Strategies](#testing-strategies)
9. [Security Considerations](#security-considerations)
10. [Real-World Examples](#real-world-examples)

---

## The Platform Problem

### The Three Major Platforms

**Unix-like** (Linux, macOS):
```javascript
'/home/user/documents/file.txt'
```

**Windows**:
```javascript
'C:\\Users\\user\\documents\\file.txt'
```

**Different separators, different conventions, different rules!**

### The Same Code, Different Results

```javascript
// This code behaves differently on each platform:

const filePath = 'data' + '/' + 'users.json';

// Unix:    'data/users.json' ✅ Works
// Windows: 'data/users.json' ⚠️ Works (usually) but not idiomatic
```

### The Problem with String Concatenation

```javascript
// ❌ WRONG - Platform-specific
const path1 = dir + '/' + file;           // Assumes Unix
const path2 = dir + '\\' + file;          // Assumes Windows
const path3 = dir + '\\\\' + file;        // Escaped Windows

// ✅ CORRECT - Works everywhere
const path = require('path');
const pathCorrect = path.join(dir, file);
```

---

## Path Separators

### The Difference

**Unix-like** (Linux, macOS):
- Uses **forward slash**: `/`
- Example: `/home/user/file.txt`

**Windows**:
- Uses **backslash**: `\`
- Example: `C:\Users\user\file.txt`
- But also accepts `/` in most cases!

### path.sep - Platform Separator

```javascript
const path = require('path');

console.log(path.sep);
// Unix:    '/'
// Windows: '\\'

// Use it to split paths
const parts = filePath.split(path.sep);

// Unix:    '/home/user/file.txt'.split('/')
//          → ['', 'home', 'user', 'file.txt']

// Windows: 'C:\\Users\\file.txt'.split('\\')
//          → ['C:', 'Users', 'file.txt']
```

### Why You Shouldn't Use path.sep

**Surprising fact**: You rarely need `path.sep` directly!

```javascript
// ❌ DON'T DO THIS - Tedious and error-prone
const filePath = 'data' + path.sep + 'users' + path.sep + 'file.json';

// ✅ DO THIS - Simple and correct
const filePath = path.join('data', 'users', 'file.json');
// Automatically uses correct separator!
```

**When to use `path.sep`**:
- Splitting an existing path string
- Displaying paths to users (rare)

**When NOT to use `path.sep`**:
- Building paths (use `path.join()`)
- Comparing paths (use path methods)

### Forward Slash Usually Works on Windows

```javascript
// Surprising: Windows accepts both!
const fs = require('fs');

// These both work on Windows:
fs.readFileSync('C:/Users/file.txt');      // Forward slash
fs.readFileSync('C:\\Users\\file.txt');    // Backslash

// But don't rely on this - use path module!
```

### Backslash Escaping in Strings

```javascript
// In JavaScript strings, \ is an escape character

// ❌ WRONG - Not what you think!
const path = 'C:\Users\new\test.txt';
//             ^       ^    ^
//             |\      |\   \t (tab character!)
//             | \Users \new

// ✅ CORRECT - Escape the backslashes
const path = 'C:\\Users\\new\\test.txt';
//             ^^      ^^   ^^
//             Two backslashes = one literal backslash

// ✅ BETTER - Use path module
const path = path.join('C:', 'Users', 'new', 'test.txt');
// No escaping needed!
```

---

## Case Sensitivity

### The Difference

**Unix-like** (Linux, macOS):
- **Case-sensitive**: `file.txt` ≠ `File.txt` ≠ `FILE.txt`
- These are THREE different files!

**Windows**:
- **Case-insensitive**: `file.txt` = `File.txt` = `FILE.txt`
- These are the SAME file!

### The Problem

```javascript
// Code written on Windows:
fs.writeFileSync('Config.json', data);
fs.readFileSync('config.json'); // ✅ Works on Windows

// Same code on Linux:
fs.writeFileSync('Config.json', data);
fs.readFileSync('config.json'); // ❌ Error: ENOENT (different files!)
```

### Best Practices

**1. Be Consistent**

```javascript
// ✅ DO: Pick a convention and stick to it
'config.json'        // All lowercase
'package.json'       // All lowercase
'README.md'          // Conventional naming

// ❌ DON'T: Mix cases randomly
'Config.json'
'CONFIG.JSON'
'config.JSON'
```

**2. Use Lowercase for Filenames**

```javascript
// ✅ GOOD - Works everywhere
'users.json'
'config.yaml'
'app.js'

// ⚠️ CAREFUL - Might break on case-sensitive systems
'Users.json'
'Config.YAML'
'App.JS'
```

**3. Match Exact Case in Code**

```javascript
// File on disk: MyModule.js

// ❌ WRONG - Might work on Windows, breaks on Linux
const mod = require('./mymodule.js');

// ✅ CORRECT - Match exact case
const mod = require('./MyModule.js');
```

### Testing for Case Issues

```javascript
const fs = require('fs');
const path = require('path');

function caseMatchesFileSystem(filePath) {
  const dirPath = path.dirname(filePath);
  const fileName = path.basename(filePath);

  // List actual files in directory
  const actualFiles = fs.readdirSync(dirPath);

  // Check if exact case match exists
  return actualFiles.includes(fileName);
}

caseMatchesFileSystem('/home/user/config.json');
// → true if 'config.json' exists
// → false if only 'Config.json' exists
```

---

## Drive Letters and UNC Paths

### Windows Drive Letters

```javascript
// Windows has drive letters
'C:\\Users\\user\\file.txt'
'D:\\Data\\documents'
'E:\\Backup'

// Unix doesn't - everything under /
'/home/user/file.txt'
'/mnt/data/documents'
'/media/backup'
```

### Absolute Path Detection

```javascript
const path = require('path');

// Unix
path.isAbsolute('/home/user');    // → true
path.isAbsolute('home/user');     // → false

// Windows
path.isAbsolute('C:\\Users');     // → true
path.isAbsolute('Users');         // → false
path.isAbsolute('/Users');        // → false (no drive letter!)
```

### UNC Paths (Windows Network Paths)

```javascript
// Windows network paths
'\\\\server\\share\\folder\\file.txt'

// In JavaScript (escaped):
'\\\\\\\\server\\\\share\\\\folder\\\\file.txt'

// Better way:
path.join('\\\\server', 'share', 'folder', 'file.txt');
// On Windows: '\\server\share\folder\file.txt'
```

### Cross-Platform Root Detection

```javascript
const path = require('path');

function getRoot(filePath) {
  return path.parse(filePath).root;
}

// Unix
getRoot('/home/user/file.txt');
// → '/'

// Windows
getRoot('C:\\Users\\file.txt');
// → 'C:\\'

getRoot('\\\\server\\share\\file.txt');
// → '\\\\server\\share\\'
```

---

## Path Delimiters

### PATH Environment Variable

Different platforms use different delimiters in environment variables like `PATH`:

**Unix-like**:
```bash
PATH=/usr/bin:/usr/local/bin:/home/user/bin
```
Delimiter: `:` (colon)

**Windows**:
```cmd
PATH=C:\Windows\System32;C:\Users\user\bin;C:\Tools
```
Delimiter: `;` (semicolon)

### path.delimiter

```javascript
const path = require('path');

console.log(path.delimiter);
// Unix:    ':'
// Windows: ';'

// Split PATH variable correctly
const pathDirs = process.env.PATH.split(path.delimiter);

// Unix:    ['/usr/bin', '/usr/local/bin', ...]
// Windows: ['C:\\Windows\\System32', 'C:\\Users\\user\\bin', ...]
```

### Practical Example

```javascript
const path = require('path');

// Add directory to PATH (cross-platform)
function addToPath(newDir) {
  const currentPath = process.env.PATH || '';
  const paths = currentPath.split(path.delimiter);

  // Add if not already present
  if (!paths.includes(newDir)) {
    paths.unshift(newDir); // Add to beginning
  }

  return paths.join(path.delimiter);
}

process.env.PATH = addToPath('/usr/local/custom/bin');
```

---

## Best Practices

### Practice 1: Always Use path Module

```javascript
const path = require('path');

// ❌ WRONG
const file = dir + '/' + name + '.txt';
const file = dir + '\\' + name + '.txt';
const file = `${dir}/${name}.txt`;

// ✅ CORRECT
const file = path.join(dir, name + '.txt');
const file = path.join(dir, `${name}.txt`);
```

### Practice 2: Use path.join() for Combining

```javascript
// ❌ WRONG - Platform-specific
const config = __dirname + '/config/app.json';

// ✅ CORRECT - Works everywhere
const config = path.join(__dirname, 'config', 'app.json');
```

### Practice 3: Use path.resolve() for Absolute Paths

```javascript
// ❌ WRONG - Might be relative
const dbPath = 'data/database.db';

// ✅ CORRECT - Always absolute
const dbPath = path.resolve(__dirname, 'data', 'database.db');
```

### Practice 4: Normalize User Input

```javascript
const path = require('path');

// User provides path (might use wrong separators)
const userPath = 'data\\users\\file.txt'; // Windows style

// ✅ Normalize it
const normalized = path.normalize(userPath);
// Unix:    'data/users/file.txt'
// Windows: 'data\\users\\file.txt'

// ✅ Even better - make absolute and normalize
const safe = path.resolve(userPath);
```

### Practice 5: Use Lowercase Filenames

```javascript
// ✅ GOOD - No case issues
'config.json'
'database.sqlite'
'app.log'

// ⚠️ AVOID - Case-sensitive on Unix
'Config.JSON'
'Database.SQLite'
'App.LOG'
```

### Practice 6: Never Hardcode Separators

```javascript
// ❌ WRONG
if (filePath.includes('/')) { ... }
if (filePath.includes('\\')) { ... }
filePath.split('/');

// ✅ CORRECT
const path = require('path');
filePath.split(path.sep);
path.dirname(filePath);
path.basename(filePath);
```

### Practice 7: Test on Multiple Platforms

```javascript
// Use CI/CD to test on:
// - Linux (Ubuntu)
// - macOS
// - Windows

// GitHub Actions example:
// jobs:
//   test:
//     strategy:
//       matrix:
//         os: [ubuntu-latest, macos-latest, windows-latest]
//     runs-on: ${{ matrix.os }}
```

---

## Common Mistakes

### Mistake 1: String Concatenation

```javascript
// ❌ WRONG - Breaks on Windows
const filePath = dir + '/' + file;

// ✅ CORRECT
const filePath = path.join(dir, file);
```

### Mistake 2: Hardcoded Backslashes

```javascript
// ❌ WRONG - Only works on Windows
const filePath = 'C:\\Users\\data\\file.txt';
fs.readFile(filePath); // Breaks on Unix

// ✅ CORRECT - Use path methods
const filePath = path.join('C:', 'Users', 'data', 'file.txt');
// Or better: use relative paths with __dirname
```

### Mistake 3: Assuming Forward Slash

```javascript
// ❌ WRONG - Assumes Unix separators
const parts = filePath.split('/');

// ✅ CORRECT - Platform-aware
const parts = filePath.split(path.sep);
```

### Mistake 4: Case Assumptions

```javascript
// ❌ WRONG - Assumes case-insensitive
fs.readFile('Config.json');    // File is config.json

// ✅ CORRECT - Match exact case
fs.readFile('config.json');
```

### Mistake 5: Not Normalizing Paths

```javascript
// ❌ WRONG - Mixed separators
const messy = 'data/users\\documents/file.txt';
fs.readFile(messy); // Might work, might not

// ✅ CORRECT - Normalize
const clean = path.normalize(messy);
fs.readFile(clean);
```

### Mistake 6: Comparing Paths as Strings

```javascript
// ❌ WRONG - Different separators, same path
'/home/user/file.txt' === '/home/user/file.txt'    // true
'C:\\Users\\file.txt' === 'C:/Users/file.txt'      // false ⚠️

// ✅ CORRECT - Normalize before comparing
const path1 = path.normalize('C:\\Users\\file.txt');
const path2 = path.normalize('C:/Users/file.txt');
path1 === path2; // true

// ✅ EVEN BETTER - Use path.resolve for absolute comparison
path.resolve('C:\\Users\\file.txt') === path.resolve('C:/Users/file.txt');
```

### Mistake 7: Relative Paths from cwd

```javascript
// ❌ WRONG - Breaks if run from different directory
const config = './config.json';
fs.readFile(config); // Where is '.'?

// ✅ CORRECT - Explicit with __dirname
const config = path.join(__dirname, 'config.json');
fs.readFile(config); // Always finds it
```

---

## Testing Strategies

### Strategy 1: Mock path.sep

```javascript
// test.js
const path = require('path');

describe('Path handling', () => {
  it('should work on Windows', () => {
    // Mock Windows separator
    const originalSep = path.sep;
    path.sep = '\\';

    const result = buildPath('a', 'b', 'c');
    expect(result).toBe('a\\b\\c');

    path.sep = originalSep; // Restore
  });

  it('should work on Unix', () => {
    const originalSep = path.sep;
    path.sep = '/';

    const result = buildPath('a', 'b', 'c');
    expect(result).toBe('a/b/c');

    path.sep = originalSep;
  });
});
```

### Strategy 2: Use path.posix and path.win32

```javascript
const path = require('path');

// Test Unix behavior explicitly
path.posix.join('a', 'b', 'c');
// → 'a/b/c' (always, even on Windows)

// Test Windows behavior explicitly
path.win32.join('a', 'b', 'c');
// → 'a\\b\\c' (always, even on Unix)

// Use in tests:
describe('Cross-platform paths', () => {
  it('handles Unix paths', () => {
    const result = path.posix.join('usr', 'local', 'bin');
    expect(result).toBe('usr/local/bin');
  });

  it('handles Windows paths', () => {
    const result = path.win32.join('C:', 'Users', 'file.txt');
    expect(result).toBe('C:\\Users\\file.txt');
  });
});
```

### Strategy 3: CI/CD Multi-Platform Tests

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [18, 20]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node }}
      - run: npm install
      - run: npm test
```

### Strategy 4: Manual Testing Checklist

```javascript
// Test these scenarios:

// ✅ Run from different directories
cd /home && node /project/app.js
cd /project && node app.js
cd /project/src && node app.js

// ✅ Test with spaces in paths
'/home/user/My Documents/file.txt'

// ✅ Test with special characters
'/home/user/files (backup)/data.txt'

// ✅ Test with different cases
'Config.json' vs 'config.json'

// ✅ Test absolute vs relative
'./file.txt' vs '/absolute/file.txt'
```

---

## Security Considerations

### Path Traversal Attacks

```javascript
// User provides: ../../../../etc/passwd

// ❌ WRONG - Security vulnerability!
const userFile = path.join(uploadDir, userInput);
fs.readFile(userFile); // Can read ANY file!

// ✅ CORRECT - Validate and sanitize
function safeJoin(base, userPath) {
  const fullPath = path.resolve(base, userPath);

  // Ensure path is still within base
  if (!fullPath.startsWith(path.resolve(base))) {
    throw new Error('Invalid path: access denied');
  }

  return fullPath;
}

const userFile = safeJoin(uploadDir, userInput);
fs.readFile(userFile); // Safe!
```

### Null Byte Injection

```javascript
// Attacker provides: 'file.txt\0.jpg'
// (null byte can terminate strings in C)

// ❌ WRONG - Might be vulnerable
const filePath = path.join(uploadDir, userInput);

// ✅ CORRECT - Check for null bytes
function sanitizePath(userPath) {
  if (userPath.includes('\0')) {
    throw new Error('Invalid path: null byte detected');
  }
  return userPath;
}

const filePath = path.join(uploadDir, sanitizePath(userInput));
```

### Symlink Attacks

```javascript
// Attacker creates symlink: uploads/link → /etc/passwd

// ❌ WRONG - Follows symlinks
fs.readFile(path.join('uploads', 'link')); // Reads /etc/passwd!

// ✅ CORRECT - Check for symlinks
const fs = require('fs');

function safeRead(filePath) {
  const stats = fs.lstatSync(filePath); // Don't follow symlinks

  if (stats.isSymbolicLink()) {
    throw new Error('Symbolic links not allowed');
  }

  return fs.readFileSync(filePath);
}
```

### Validate User Input

```javascript
const path = require('path');

function validateUserPath(userPath) {
  // Remove null bytes
  if (userPath.includes('\0')) {
    throw new Error('Invalid path');
  }

  // Normalize
  const normalized = path.normalize(userPath);

  // Check for path traversal
  if (normalized.includes('..')) {
    throw new Error('Path traversal not allowed');
  }

  // Check for absolute paths
  if (path.isAbsolute(normalized)) {
    throw new Error('Absolute paths not allowed');
  }

  return normalized;
}

// Use it:
const safePath = validateUserPath(req.body.filename);
const fullPath = path.join(__dirname, 'uploads', safePath);
```

---

## Real-World Examples

### Example 1: Express File Server

```javascript
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// ✅ CORRECT - Cross-platform static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// ✅ CORRECT - Secure file downloads
app.get('/download/:filename', (req, res) => {
  // Sanitize filename
  const filename = path.basename(req.params.filename);

  // Build safe path
  const filePath = path.join(__dirname, 'files', filename);

  // Verify it's within allowed directory
  const filesDir = path.resolve(__dirname, 'files');
  if (!filePath.startsWith(filesDir)) {
    return res.status(403).send('Access denied');
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.download(filePath);
});
```

### Example 2: Configuration Loader

```javascript
const path = require('path');
const fs = require('fs');

class ConfigLoader {
  constructor() {
    // Support multiple config locations (cross-platform)
    this.searchPaths = [
      path.join(__dirname, 'config.json'),              // Same dir
      path.join(__dirname, '..', 'config', 'app.json'), // Parent/config
      path.join(process.env.HOME || process.env.USERPROFILE, '.myapp', 'config.json'), // User home
      '/etc/myapp/config.json',                         // System (Unix)
      path.join('C:', 'ProgramData', 'myapp', 'config.json') // System (Windows)
    ];
  }

  load() {
    for (const configPath of this.searchPaths) {
      if (fs.existsSync(configPath)) {
        console.log(`Loading config from: ${configPath}`);
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    }

    throw new Error('No config file found');
  }
}
```

### Example 3: Cross-Platform Temporary Files

```javascript
const os = require('os');
const path = require('path');
const fs = require('fs');

function createTempFile(filename) {
  // Get platform-appropriate temp directory
  const tmpDir = os.tmpdir();
  // Unix:    '/tmp'
  // Windows: 'C:\\Users\\user\\AppData\\Local\\Temp'

  const tempPath = path.join(tmpDir, filename);

  fs.writeFileSync(tempPath, '');

  return tempPath;
}

// Use it:
const tempFile = createTempFile('myapp-temp.txt');
console.log(tempFile);
// Unix:    '/tmp/myapp-temp.txt'
// Windows: 'C:\\Users\\user\\AppData\\Local\\Temp\\myapp-temp.txt'
```

### Example 4: Build Tool

```javascript
const path = require('path');
const fs = require('fs');

class Builder {
  constructor(srcDir, outDir) {
    this.srcDir = path.resolve(srcDir);
    this.outDir = path.resolve(outDir);
  }

  build() {
    // Get all source files
    const files = this.getAllFiles(this.srcDir);

    for (const file of files) {
      // Get relative path from src
      const relativePath = path.relative(this.srcDir, file);

      // Build output path (maintains directory structure)
      const outPath = path.join(this.outDir, relativePath);

      // Create output directory if needed
      const outDir = path.dirname(outPath);
      fs.mkdirSync(outDir, { recursive: true });

      // Process file...
      this.processFile(file, outPath);
    }
  }

  getAllFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        this.getAllFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  processFile(inputPath, outputPath) {
    // Transform and write file
    const content = fs.readFileSync(inputPath, 'utf8');
    const transformed = this.transform(content);
    fs.writeFileSync(outputPath, transformed);
  }
}
```

---

## Quick Reference

### Do's and Don'ts

| ❌ DON'T | ✅ DO |
|---------|------|
| `dir + '/' + file` | `path.join(dir, file)` |
| `'C:\\Users\\file'` | `path.join('C:', 'Users', 'file')` |
| `filePath.split('/')` | `filePath.split(path.sep)` |
| `'Config.JSON'` | `'config.json'` |
| `'./data/file.txt'` | `path.join(__dirname, 'data', 'file.txt')` |
| `PATH.split(':')` | `PATH.split(path.delimiter)` |

### Essential Methods

```javascript
const path = require('path');

// Combine paths
path.join('a', 'b', 'c');

// Make absolute
path.resolve('a', 'b', 'c');

// Normalize
path.normalize('a/b/../c');

// Platform separator
path.sep;        // '/' or '\\'
path.delimiter;  // ':' or ';'

// Test on specific platform
path.posix.join('a', 'b');   // Force Unix
path.win32.join('a', 'b');   // Force Windows
```

---

## Summary

### Key Takeaways

1. **Always use the path module** - Never build paths with strings
2. **Different separators** - Unix `/`, Windows `\\`
3. **Case sensitivity** - Unix yes, Windows no
4. **Use lowercase filenames** - Safest for cross-platform
5. **Test on all platforms** - Use CI/CD
6. **Normalize user input** - Security and compatibility
7. **path.join()** is your friend - Use it everywhere
8. **Avoid hardcoding** - No `/` or `\\` in your code

### The Golden Rules

> **Rule 1**: Never concatenate paths with strings
> **Rule 2**: Always use `path.join()` or `path.resolve()`
> **Rule 3**: Normalize and validate user input
> **Rule 4**: Test on multiple platforms
> **Rule 5**: Use lowercase for filenames

---

## What's Next?

- **[Join vs Resolve](01-join-vs-resolve.md)** - Master path methods
- **[__dirname and __filename](02-dirname-filename.md)** - File-relative paths
- **[Examples](../examples/)** - See cross-platform patterns in action

---

## Further Reading

- [Node.js path module docs](https://nodejs.org/api/path.html)
- [Cross-platform Node.js guide](https://shapeshed.com/writing-cross-platform-node/)
- [Path security best practices](https://nodejs.org/en/docs/guides/security/)

**Pro Tip**: The easiest way to ensure cross-platform compatibility? Use the path module for EVERYTHING and test on all platforms with CI/CD. It's that simple!
