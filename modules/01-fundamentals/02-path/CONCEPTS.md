# Path Module: Core Concepts

This document provides foundational concepts for the Path module that span all three levels (Basics, Intermediate, Advanced).

## Table of Contents
- [What is the Path Module?](#what-is-the-path-module)
- [Why Path Manipulation Matters](#why-path-manipulation-matters)
- [Cross-Platform Path Challenges](#cross-platform-path-challenges)
- [Path Module Architecture](#path-module-architecture)
- [Key Concepts Overview](#key-concepts-overview)
- [Path Security Fundamentals](#path-security-fundamentals)

---

## What is the Path Module?

The `path` module is a Node.js core module that provides utilities for working with file and directory paths. It handles the complexities of different operating systems' path formats and provides a consistent API for path manipulation.

### Core Purpose

The path module exists to:
1. **Normalize** paths across different operating systems
2. **Join** path segments safely
3. **Parse** paths into their components
4. **Resolve** relative paths to absolute paths
5. **Handle** platform-specific path separators

### Import and Usage

```javascript
// CommonJS
const path = require('path');

// ES Modules
import path from 'path';
```

---

## Why Path Manipulation Matters

### 1. Cross-Platform Compatibility

Different operating systems use different path formats:

**Windows:**
```
C:\Users\john\Documents\file.txt
.\relative\path
..\parent\directory
```

**Unix/Linux/macOS:**
```
/home/john/Documents/file.txt
./relative/path
../parent/directory
```

Without proper path handling, your application will fail on different platforms.

### 2. Security

Improper path handling can lead to serious security vulnerabilities:
- **Path Traversal Attacks**: Users accessing files outside intended directories
- **File System Injection**: Malicious paths accessing system files
- **Symlink Exploitation**: Following symbolic links to unintended locations

### 3. Reliability

Manual string manipulation of paths is error-prone:
```javascript
// ❌ Dangerous - won't work on all platforms
const filePath = baseDir + '/' + filename;

// ✅ Safe - works everywhere
const filePath = path.join(baseDir, filename);
```

---

## Cross-Platform Path Challenges

### Path Separators

| Platform | Separator | Example |
|----------|-----------|---------|
| Windows | `\` (backslash) | `C:\Users\john\file.txt` |
| Unix/Linux/macOS | `/` (forward slash) | `/home/john/file.txt` |
| URL | `/` (forward slash) | `https://example.com/path/to/file` |

### Drive Letters (Windows-specific)

Windows uses drive letters; Unix systems don't:
```javascript
// Windows
'C:\\Program Files\\app'
'D:\\data\\files'

// Unix
'/usr/local/bin'
'/home/user/data'
```

### Path Delimiters

For separating multiple paths (like in PATH environment variable):

| Platform | Delimiter |
|----------|-----------|
| Windows | `;` (semicolon) |
| Unix/Linux/macOS | `:` (colon) |

```javascript
console.log(path.delimiter);
// Windows: ';'
// Unix: ':'
```

### Case Sensitivity

| Platform | Case Sensitive? |
|----------|----------------|
| Windows | No (usually) |
| Linux | Yes |
| macOS | No (by default, but can be configured) |

```javascript
// On Windows: same file
'C:\\file.txt' === 'C:\\FILE.TXT'

// On Linux: different files
'/home/file.txt' !== '/home/FILE.TXT'
```

---

## Path Module Architecture

### Two Main APIs

The path module provides two platform-specific implementations:

1. **`path.posix`** - POSIX (Unix/Linux/macOS) paths
2. **`path.win32`** - Windows paths

And one platform-aware API:
3. **`path`** - Uses the current platform's implementation

```javascript
const path = require('path');

// Current platform (auto-detected)
path.join('a', 'b'); // Uses current OS format

// Force POSIX format
path.posix.join('a', 'b'); // Always uses '/'

// Force Windows format
path.win32.join('a', 'b'); // Always uses '\\'
```

### Core Methods

#### Path Construction
- `path.join()` - Join path segments
- `path.resolve()` - Resolve to absolute path
- `path.normalize()` - Normalize a path

#### Path Parsing
- `path.parse()` - Parse path into object
- `path.format()` - Build path from object
- `path.basename()` - Get filename
- `path.dirname()` - Get directory name
- `path.extname()` - Get file extension

#### Path Analysis
- `path.isAbsolute()` - Check if path is absolute
- `path.relative()` - Calculate relative path

#### Path Properties
- `path.sep` - Path separator for current platform
- `path.delimiter` - Path delimiter for current platform

---

## Key Concepts Overview

### 1. Absolute vs Relative Paths

**Absolute Path:**
- Complete path from root directory
- Starts with `/` (Unix) or drive letter (Windows)
- Always unambiguous

```javascript
// Absolute paths
'/home/user/file.txt'      // Unix
'C:\\Users\\user\\file.txt' // Windows
```

**Relative Path:**
- Path relative to current working directory
- May start with `.`, `..`, or a directory name
- Depends on context

```javascript
// Relative paths
'./file.txt'         // Current directory
'../parent/file.txt' // Parent directory
'folder/file.txt'    // Subdirectory
```

### 2. Path Segments

A path is composed of segments separated by separators:

```javascript
'/home/user/documents/file.txt'
// Segments: ['', 'home', 'user', 'documents', 'file.txt']
```

### 3. Special Path Components

- **`.`** (dot) - Current directory
- **`..`** (double dot) - Parent directory
- **`~`** (tilde) - Home directory (shell convention, not handled by path module)

### 4. Path Components

Every path can be broken down into components:

```javascript
const parsed = path.parse('/home/user/file.txt');
// {
//   root: '/',
//   dir: '/home/user',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file'
// }
```

**Components:**
- **root**: Root of the path (`/` or `C:\\`)
- **dir**: Directory path
- **base**: Full filename (name + extension)
- **name**: Filename without extension
- **ext**: File extension (including the dot)

---

## Path Security Fundamentals

### Path Traversal Attacks

Path traversal (also known as directory traversal) is a security vulnerability where an attacker can access files outside the intended directory.

**Attack Example:**
```javascript
// Vulnerable code
const userFile = req.query.file; // User provides: '../../../etc/passwd'
const filePath = path.join('/var/app/uploads', userFile);
// Results in: '/etc/passwd' - accessing system files!
```

**Protection:**
```javascript
// Secure approach
const userFile = path.basename(req.query.file); // Remove path components
const filePath = path.join('/var/app/uploads', userFile);

// Or validate the resolved path
const uploadDir = '/var/app/uploads';
const requestedPath = path.resolve(uploadDir, userFile);

if (!requestedPath.startsWith(uploadDir)) {
  throw new Error('Access denied');
}
```

### Null Byte Injection

Older systems were vulnerable to null byte injection:
```javascript
// Attacker input: 'file.txt\0.jpg'
// System might read up to \0, ignoring extension check
```

**Protection:**
```javascript
function validatePath(userPath) {
  if (userPath.includes('\0')) {
    throw new Error('Invalid path: null bytes not allowed');
  }
  return userPath;
}
```

### Symbolic Link Considerations

Symbolic links can point outside intended directories:
```javascript
// uploads/symlink -> /etc/passwd
// Reading 'uploads/symlink' gives access to /etc/passwd
```

We'll cover symlink security in Level 3.

---

## Path vs URL

### Key Differences

| Aspect | File Paths | URLs |
|--------|-----------|------|
| Module | `path` | `url` |
| Separator | Platform-specific (`/` or `\\`) | Always `/` |
| Encoding | No automatic encoding | URL encoding required |
| Protocol | None | Has protocol (`http:`, `file:`) |

### Converting Between Them

```javascript
const path = require('path');
const { fileURLToPath, pathToFileURL } = require('url');

// Path to URL
const filePath = '/home/user/file.txt';
const fileURL = pathToFileURL(filePath);
// file:///home/user/file.txt

// URL to Path
const url = new URL('file:///home/user/file.txt');
const pathFromURL = fileURLToPath(url);
// /home/user/file.txt
```

---

## Performance Considerations

### Path Operations are Fast

Path operations are string manipulations - they're very fast and don't access the file system:

```javascript
// Fast - no I/O
path.join('a', 'b', 'c');
path.resolve('/home/user');
path.parse('/path/to/file.txt');
```

### When File System is Accessed

The path module itself never accesses the file system. File I/O only happens when you:
- Use `fs` module methods
- Resolve symbolic links with `fs.realpath()`
- Check file existence with `fs.stat()` or `fs.access()`

### Caching Considerations

Since path operations are fast, caching is usually unnecessary:
```javascript
// No need to cache
const filePath = path.join(baseDir, 'file.txt');

// Unless in extremely tight loops
const cached = path.join(baseDir, 'file.txt');
for (let i = 0; i < 1000000; i++) {
  // Use cached instead of recomputing
}
```

---

## Common Patterns

### 1. Building File Paths

```javascript
// ✅ Correct
const filePath = path.join(__dirname, 'data', 'file.txt');

// ❌ Wrong
const filePath = __dirname + '/data/file.txt';
```

### 2. Ensuring Absolute Paths

```javascript
// Make sure path is absolute
const absolutePath = path.resolve(userProvidedPath);
```

### 3. Getting File Extension

```javascript
const ext = path.extname(filename);
if (ext === '.jpg' || ext === '.png') {
  // Handle image
}
```

### 4. Changing File Extension

```javascript
const parsed = path.parse(filePath);
const newPath = path.format({
  ...parsed,
  base: undefined, // Clear base so name + ext is used
  ext: '.json'
});
```

---

## Best Practices

### 1. Always Use path Module

Never manipulate paths with string concatenation:
```javascript
// ❌ Bad
const p = dir + '/' + file;

// ✅ Good
const p = path.join(dir, file);
```

### 2. Use path.join() for Relative Paths

```javascript
// ✅ Joining segments
path.join('dir1', 'dir2', 'file.txt');
```

### 3. Use path.resolve() for Absolute Paths

```javascript
// ✅ Getting absolute path
path.resolve('dir1', 'file.txt');
// Returns absolute path from current directory
```

### 4. Normalize User Input

```javascript
// ✅ Clean up user-provided paths
const safePath = path.normalize(userInput);
```

### 5. Validate Paths Before Use

```javascript
function isPathSafe(basePath, userPath) {
  const resolved = path.resolve(basePath, userPath);
  return resolved.startsWith(basePath);
}
```

---

## What You'll Learn

### Level 1: Basics
- Understanding path separators and cross-platform issues
- Using `path.join()` and `path.resolve()`
- Working with `__dirname` and `__filename`
- Extracting path components (basename, dirname, extname)

### Level 2: Intermediate
- Normalizing paths
- Calculating relative paths between locations
- Handling special paths (`.`, `..`)
- Implementing path validation
- Converting between path formats

### Level 3: Advanced
- Implementing glob pattern matching
- Handling symbolic links securely
- Preventing path traversal attacks
- Managing cross-platform edge cases
- Building robust path utilities

---

## Summary

The path module is essential for:
1. **Cross-platform compatibility** - Write code that works on any OS
2. **Security** - Prevent path traversal and other vulnerabilities
3. **Reliability** - Handle paths correctly without manual string manipulation
4. **Maintainability** - Use standard APIs that other developers understand

Understanding path manipulation is fundamental to any Node.js application that works with the file system, and mastering it will make your applications more robust, secure, and portable.
