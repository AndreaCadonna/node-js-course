# Guide: Path Format Conversion - Cross-Platform Mastery

**Reading Time**: 25 minutes
**Difficulty**: Intermediate
**Prerequisites**: Path basics, platform differences

---

## Introduction

Path format conversion is essential for building **truly cross-platform applications**. Windows and Unix use different path formats, and understanding how to convert between them is critical for portability.

### What You'll Learn

- Windows vs Unix path format differences
- Using `path.posix` and `path.win32`
- Converting between path formats
- Handling edge cases (drive letters, UNC paths)
- Building portable path utilities
- Testing cross-platform code

---

## Table of Contents

1. [Platform Differences](#platform-differences)
2. [path.posix and path.win32](#pathposix-and-pathwin32)
3. [Windows to Unix Conversion](#windows-to-unix-conversion)
4. [Unix to Windows Conversion](#unix-to-windows-conversion)
5. [Drive Letters](#drive-letters)
6. [UNC Paths](#unc-paths)
7. [Building Converters](#building-converters)
8. [Git and URLs](#git-and-urls)
9. [Testing Cross-Platform](#testing-cross-platform)
10. [Best Practices](#best-practices)

---

## Platform Differences

### Unix/Linux/macOS Paths

**Characteristics:**
- **Separator:** Forward slash (`/`)
- **Root:** Single root (`/`)
- **Case sensitivity:** Yes (usually)
- **Absolute paths:** Start with `/`

**Examples:**
```
/home/user/documents/file.txt
/var/www/html/index.html
/usr/local/bin/node
./relative/path/file.txt
```

### Windows Paths

**Characteristics:**
- **Separator:** Backslash (`\`)
- **Root:** Multiple drives (`C:\`, `D:\`, etc.)
- **Case sensitivity:** No
- **Absolute paths:** Start with drive letter

**Examples:**
```
C:\Users\John\Documents\file.txt
D:\Projects\app\src\index.js
\\server\share\folder\file.txt
relative\path\file.txt
```

### Key Differences Table

| Feature | Unix | Windows |
|---------|------|---------|
| Separator | `/` | `\` |
| Root | `/` | `C:\`, `D:\`, etc. |
| Case | Sensitive | Insensitive |
| Absolute | `/path` | `C:\path` |
| Network | N/A | `\\server\share` |
| Home | `~` (shell) | `%USERPROFILE%` |

---

## path.posix and path.win32

### The Standard path Module

**Adapts to current platform:**

```javascript
const path = require('path');

// On Unix:
path.sep === '/';
path.join('a', 'b');  // 'a/b'

// On Windows:
path.sep === '\\';
path.join('a', 'b');  // 'a\\b'
```

### path.posix

**Always uses Unix-style paths:**

```javascript
const path = require('path');

// On ANY platform:
path.posix.sep === '/';
path.posix.join('a', 'b');  // Always 'a/b'
path.posix.normalize('a//b');  // Always 'a/b'
```

**All methods available:**
```javascript
path.posix.join()
path.posix.resolve()
path.posix.normalize()
path.posix.relative()
path.posix.parse()
// ... all path methods
```

### path.win32

**Always uses Windows-style paths:**

```javascript
const path = require('path');

// On ANY platform:
path.win32.sep === '\\';
path.win32.join('a', 'b');  // Always 'a\\b'
path.win32.normalize('a\\\\b');  // Always 'a\\b'
```

**Use case:** Processing Windows paths on Unix, or vice versa.

---

## Windows to Unix Conversion

### Basic Conversion

```javascript
function windowsToUnix(windowsPath) {
  // Replace backslashes with forward slashes
  let result = windowsPath.split('\\').join('/');

  // Remove drive letter
  result = result.replace(/^[A-Za-z]:/, '');

  return result;
}

// Examples:
windowsToUnix('C:\\Users\\John\\file.txt');
// → '/Users/John/file.txt'

windowsToUnix('relative\\path\\file.txt');
// → 'relative/path/file.txt'
```

### Handling Drive Letters

```javascript
function windowsToUnixWithDrive(windowsPath) {
  // Check if has drive letter
  const match = windowsPath.match(/^([A-Za-z]):(.*)/);

  if (match) {
    const drive = match[1].toLowerCase();
    const pathPart = match[2].split('\\').join('/');

    // Option 1: Prefix with /mnt (WSL style)
    return `/mnt/${drive}${pathPart}`;

    // Option 2: Remove entirely
    // return pathPart;
  }

  // No drive letter, just convert separators
  return windowsPath.split('\\').join('/');
}

// Examples:
windowsToUnixWithDrive('C:\\Users\\John');
// → '/mnt/c/Users/John' (WSL style)
```

### Handling UNC Paths

```javascript
function handleUNC(windowsPath) {
  // Check for UNC path (\\server\share\path)
  if (windowsPath.startsWith('\\\\')) {
    // Convert to //server/share/path
    return '//' + windowsPath.substring(2).split('\\').join('/');
  }

  return windowsToUnix(windowsPath);
}

// Examples:
handleUNC('\\\\server\\share\\folder\\file.txt');
// → '//server/share/folder/file.txt'
```

### Complete Converter

```javascript
function windowsToUnixComplete(windowsPath) {
  // Handle UNC paths
  if (windowsPath.startsWith('\\\\')) {
    return '//' + windowsPath.substring(2).split('\\').join('/');
  }

  // Handle drive letters
  let result = windowsPath.replace(/^[A-Za-z]:/, '');

  // Convert separators
  result = result.split('\\').join('/');

  // Normalize
  result = path.posix.normalize(result);

  return result;
}
```

---

## Unix to Windows Conversion

### Basic Conversion

```javascript
function unixToWindows(unixPath, driveLetter = 'C:') {
  // Replace forward slashes with backslashes
  let result = unixPath.split('/').join('\\');

  // Add drive letter if absolute
  if (unixPath.startsWith('/') && !result.startsWith('\\\\')) {
    result = driveLetter + result;
  }

  return result;
}

// Examples:
unixToWindows('/home/user/file.txt');
// → 'C:\home\user\file.txt'

unixToWindows('relative/path/file.txt');
// → 'relative\path\file.txt'
```

### Smart Drive Detection

```javascript
function unixToWindowsSmart(unixPath) {
  // WSL path? (/mnt/c/...)
  const wslMatch = unixPath.match(/^\/mnt\/([a-z])(.*)/);

  if (wslMatch) {
    const drive = wslMatch[1].toUpperCase();
    const pathPart = wslMatch[2].split('/').join('\\');
    return `${drive}:${pathPart}`;
  }

  // Regular conversion
  return unixToWindows(unixPath);
}

// Examples:
unixToWindowsSmart('/mnt/c/Users/John');
// → 'C:\Users\John'

unixToWindowsSmart('/home/user/file.txt');
// → 'C:\home\user\file.txt'
```

### Preserving Network Paths

```javascript
function unixToWindowsNetwork(unixPath) {
  // //server/share → \\server\share
  if (unixPath.startsWith('//')) {
    return '\\\\' + unixPath.substring(2).split('/').join('\\');
  }

  return unixToWindows(unixPath);
}

// Examples:
unixToWindowsNetwork('//server/share/file.txt');
// → '\\\\server\\share\\file.txt'
```

---

## Drive Letters

### Understanding Drive Letters

**Windows specific:**
```
C:       - Current directory on C: drive (relative!)
C:\      - Root of C: drive (absolute)
C:file   - file in current dir of C: (relative)
C:\file  - file at root of C: (absolute)
```

### Parsing Drive Letters

```javascript
function parseDriveLetter(windowsPath) {
  const match = windowsPath.match(/^([A-Za-z]):(.*)$/);

  if (!match) {
    return {
      hasDrive: false,
      drive: null,
      path: windowsPath
    };
  }

  const isAbsolute = match[2].startsWith('\\') || match[2].startsWith('/');

  return {
    hasDrive: true,
    drive: match[1].toUpperCase(),
    path: match[2],
    isAbsolute
  };
}

// Examples:
parseDriveLetter('C:\\Users\\John');
// { hasDrive: true, drive: 'C', path: '\\Users\\John', isAbsolute: true }

parseDriveLetter('C:file.txt');
// { hasDrive: true, drive: 'C', path: 'file.txt', isAbsolute: false }
```

### Cross-Drive Paths

```javascript
function handleCrossDrive(fromPath, toPath) {
  const from = parseDriveLetter(fromPath);
  const to = parseDriveLetter(toPath);

  if (from.drive && to.drive && from.drive !== to.drive) {
    // Different drives - can't create relative path
    return {
      canBeRelative: false,
      reason: 'Different drives',
      from: from.drive,
      to: to.drive
    };
  }

  return { canBeRelative: true };
}
```

---

## UNC Paths

### Understanding UNC Paths

**Universal Naming Convention:**
```
\\server\share\folder\file.txt
```

Components:
- `\\server` - Server name
- `\share` - Share name
- `\folder\file.txt` - Path within share

### Parsing UNC Paths

```javascript
function parseUNC(windowsPath) {
  if (!windowsPath.startsWith('\\\\')) {
    return {
      isUNC: false,
      server: null,
      share: null,
      path: null
    };
  }

  // Remove leading \\
  const withoutPrefix = windowsPath.substring(2);

  // Split into parts
  const parts = withoutPrefix.split('\\');

  return {
    isUNC: true,
    server: parts[0],
    share: parts[1],
    path: parts.slice(2).join('\\'),
    full: windowsPath
  };
}

// Examples:
parseUNC('\\\\server\\share\\folder\\file.txt');
// {
//   isUNC: true,
//   server: 'server',
//   share: 'share',
//   path: 'folder\\file.txt',
//   full: '\\\\server\\share\\folder\\file.txt'
// }
```

### Converting UNC Paths

```javascript
function uncToUnix(uncPath) {
  const parsed = parseUNC(uncPath);

  if (!parsed.isUNC) {
    return windowsToUnix(uncPath);
  }

  // Convert to //server/share/path format
  const unixPath = `//${parsed.server}/${parsed.share}/${parsed.path.split('\\').join('/')}`;

  return path.posix.normalize(unixPath);
}
```

---

## Building Converters

### Universal Converter Class

```javascript
class PathConverter {
  /**
   * Convert any path to Unix format
   */
  static toUnix(inputPath) {
    // Already Unix?
    if (!inputPath.includes('\\')) {
      return path.posix.normalize(inputPath);
    }

    // UNC path?
    if (inputPath.startsWith('\\\\')) {
      return '//' + inputPath.substring(2).split('\\').join('/');
    }

    // Remove drive letter
    let result = inputPath.replace(/^[A-Za-z]:/, '');

    // Convert separators
    result = result.split('\\').join('/');

    return path.posix.normalize(result);
  }

  /**
   * Convert any path to Windows format
   */
  static toWindows(inputPath, defaultDrive = 'C:') {
    // Already Windows?
    if (!inputPath.includes('/')) {
      return path.win32.normalize(inputPath);
    }

    // Network path?
    if (inputPath.startsWith('//')) {
      return '\\\\' + inputPath.substring(2).split('/').join('\\');
    }

    // WSL path?
    const wslMatch = inputPath.match(/^\/mnt\/([a-z])(.*)/);
    if (wslMatch) {
      const drive = wslMatch[1].toUpperCase();
      return `${drive}:${wslMatch[2].split('/').join('\\')}`;
    }

    // Convert separators
    let result = inputPath.split('/').join('\\');

    // Add drive if absolute
    if (inputPath.startsWith('/')) {
      result = defaultDrive + result;
    }

    return path.win32.normalize(result);
  }

  /**
   * Detect path format
   */
  static detectFormat(inputPath) {
    if (/^[A-Za-z]:/.test(inputPath)) return 'windows';
    if (inputPath.startsWith('\\\\')) return 'windows-unc';
    if (inputPath.includes('\\')) return 'windows';
    if (inputPath.startsWith('/')) return 'unix-absolute';
    if (inputPath.includes('/')) return 'unix-relative';
    return 'unknown';
  }

  /**
   * Normalize for current platform
   */
  static normalize(inputPath) {
    const format = this.detectFormat(inputPath);

    if (process.platform === 'win32') {
      return this.toWindows(inputPath);
    } else {
      return this.toUnix(inputPath);
    }
  }

  /**
   * Convert to specific format
   */
  static convert(inputPath, targetFormat) {
    if (targetFormat === 'unix' || targetFormat === 'posix') {
      return this.toUnix(inputPath);
    } else if (targetFormat === 'windows' || targetFormat === 'win32') {
      return this.toWindows(inputPath);
    } else {
      return this.normalize(inputPath);
    }
  }
}

// Usage:
PathConverter.toUnix('C:\\Users\\John\\file.txt');
// → '/Users/John/file.txt'

PathConverter.toWindows('/home/user/file.txt');
// → 'C:\home\user\file.txt'

PathConverter.detectFormat('C:\\Windows');
// → 'windows'

PathConverter.normalize('folder/file.txt');
// → 'folder\file.txt' (on Windows)
// → 'folder/file.txt' (on Unix)
```

---

## Git and URLs

### Git Always Uses Forward Slashes

**Even on Windows:**

```javascript
function toGitPath(anyPath) {
  return PathConverter.toUnix(anyPath);
}

// Examples:
toGitPath('C:\\project\\src\\app.js');
// → '/project/src/app.js'

toGitPath('src/components/Button.tsx');
// → 'src/components/Button.tsx'
```

### URL Paths

**URLs always use forward slashes:**

```javascript
function toURLPath(anyPath) {
  // Convert to Unix format
  let urlPath = PathConverter.toUnix(anyPath);

  // Encode special characters
  const segments = urlPath.split('/');
  const encoded = segments.map(seg =>
    seg ? encodeURIComponent(seg) : seg
  );

  return encoded.join('/');
}

// Examples:
toURLPath('C:\\Users\\John Smith\\file.txt');
// → '/Users/John%20Smith/file.txt'
```

---

## Testing Cross-Platform

### Testing Strategy

```javascript
class CrossPlatformTester {
  static testConversion(input) {
    console.log(`Input: ${input}`);
    console.log(`To Unix: ${PathConverter.toUnix(input)}`);
    console.log(`To Windows: ${PathConverter.toWindows(input)}`);
    console.log(`Format: ${PathConverter.detectFormat(input)}`);
    console.log();
  }

  static testPaths() {
    const paths = [
      'C:\\Users\\John\\file.txt',
      '/home/user/file.txt',
      '\\\\server\\share\\file.txt',
      '/mnt/c/Users/John/file.txt',
      'relative\\path\\file.txt',
      'relative/path/file.txt'
    ];

    paths.forEach(p => this.testConversion(p));
  }
}
```

### Mock Testing

```javascript
function testAsIfWindows(callback) {
  const original = process.platform;

  // Mock Windows
  Object.defineProperty(process, 'platform', {
    value: 'win32',
    writable: true
  });

  try {
    callback();
  } finally {
    // Restore
    Object.defineProperty(process, 'platform', {
      value: original,
      writable: true
    });
  }
}

// Usage:
testAsIfWindows(() => {
  console.log(path.sep);  // → '\\'
});
```

---

## Best Practices

### Practice 1: Use path.posix/win32 Explicitly

```javascript
// ✅ Explicit format:
const unixPath = path.posix.join('a', 'b', 'c');
const winPath = path.win32.join('a', 'b', 'c');

// ❌ Platform-dependent:
const somePath = path.join('a', 'b', 'c');
```

### Practice 2: Store in Consistent Format

```javascript
// ✅ Store in one format internally:
class FileManager {
  constructor() {
    // Always store as Unix internally
    this.files = [];
  }

  addFile(filepath) {
    this.files.push(PathConverter.toUnix(filepath));
  }

  getFile(index, targetFormat = 'current') {
    const unixPath = this.files[index];
    return PathConverter.convert(unixPath, targetFormat);
  }
}
```

### Practice 3: Convert at Boundaries

```javascript
// ✅ Convert at system boundaries:
function readFileFromUser(userInput) {
  // User might provide any format
  const normalized = PathConverter.normalize(userInput);

  // Use normalized path
  return fs.readFileSync(normalized);
}
```

### Practice 4: Test Both Formats

```javascript
// ✅ Test with both formats:
describe('PathConverter', () => {
  const testCases = [
    {
      input: 'C:\\Users\\file.txt',
      expectedUnix: '/Users/file.txt',
      expectedWindows: 'C:\\Users\\file.txt'
    },
    // More test cases...
  ];

  testCases.forEach(({ input, expectedUnix, expectedWindows }) => {
    it(`converts ${input}`, () => {
      expect(PathConverter.toUnix(input)).toBe(expectedUnix);
      expect(PathConverter.toWindows(input)).toBe(expectedWindows);
    });
  });
});
```

---

## Summary

### Key Takeaways

1. **Windows uses `\`, Unix uses `/`**
2. **Use `path.posix` and `path.win32`** for explicit control
3. **Drive letters are Windows-only**
4. **UNC paths are Windows network paths**
5. **Git and URLs always use `/`**
6. **Store paths in consistent format internally**
7. **Convert at system boundaries**

### Quick Reference

```javascript
// Convert to Unix:
PathConverter.toUnix('C:\\path\\file.txt')  // '/path/file.txt'

// Convert to Windows:
PathConverter.toWindows('/path/file.txt')   // 'C:\path\file.txt'

// Explicit format:
path.posix.join('a', 'b')    // Always 'a/b'
path.win32.join('a', 'b')    // Always 'a\\b'

// Detect format:
PathConverter.detectFormat(path)
```

---

## What's Next?

You've completed Level 2! Move on to:

1. **[Level 3: Advanced](../level-3-advanced/README.md)** - Advanced topics
2. **Practice exercises** - Apply what you learned
3. **Build real tools** - Create cross-platform utilities

---

Cross-platform paths don't have to be complicated - just understand the differences!
