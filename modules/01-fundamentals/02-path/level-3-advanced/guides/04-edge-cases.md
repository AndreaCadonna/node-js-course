# Guide: Cross-Platform Path Edge Cases

**Reading Time**: 35 minutes
**Difficulty**: Advanced
**Prerequisites**: Understanding of Windows and Unix filesystems

---

## Introduction

Writing cross-platform code that handles paths correctly is surprisingly difficult. Windows and Unix-like systems have fundamentally different path conventions, character restrictions, and behaviors. This guide covers all the edge cases you need to handle for robust cross-platform path handling.

### What You'll Learn

- Platform-specific path behaviors
- Reserved filenames and characters
- Path length limitations
- Case sensitivity differences
- Unicode and special character handling
- Drive letters and UNC paths
- Testing strategies for cross-platform code

---

## Table of Contents

1. [Platform Differences Overview](#platform-differences-overview)
2. [Reserved Filenames](#reserved-filenames)
3. [Path Length Limits](#path-length-limits)
4. [Invalid Characters](#invalid-characters)
5. [Case Sensitivity](#case-sensitivity)
6. [Drive Letters and Roots](#drive-letters-and-roots)
7. [UNC Paths](#unc-paths)
8. [Trailing Characters](#trailing-characters)
9. [Unicode Handling](#unicode-handling)
10. [Testing Strategies](#testing-strategies)

---

## Platform Differences Overview

### Quick Reference Table

| Feature | Windows | Linux | macOS |
|---------|---------|-------|-------|
| Path separator | `\` | `/` | `/` |
| Case sensitive | No* | Yes | No* |
| Max path length | 260 (260)** | 4096 | 1024 |
| Drive letters | Yes (C:) | No | No |
| Reserved names | Yes (CON, PRN, etc.) | No | No |
| Invalid chars | `< > : " | ? *` | `\0` | `\0 :` |
| Trailing dots | Stripped | Allowed | Allowed |
| Trailing spaces | Stripped | Allowed | Allowed |

*Can be case sensitive with specific filesystem options
**Can be extended with \\\\?\\ prefix

---

## Reserved Filenames

### Windows Reserved Names

Windows has **reserved device names** that cannot be used as filenames, even with extensions:

```javascript
const WINDOWS_RESERVED_NAMES = [
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
];
```

**Examples of invalid filenames:**
```javascript
'CON'          // ✗ Invalid
'CON.txt'      // ✗ Invalid (extension doesn't help!)
'con.txt'      // ✗ Invalid (case-insensitive)
'ConFile.txt'  // ✓ Valid (not exact match)
'mycon.txt'    // ✓ Valid (not exact match)
```

**Detection:**
```javascript
function isWindowsReservedName(filename) {
  if (process.platform !== 'win32') {
    return false;
  }

  // Get basename without path
  const basename = path.basename(filename);

  // Get name without extension
  const nameWithoutExt = basename.split('.')[0].toUpperCase();

  return WINDOWS_RESERVED_NAMES.includes(nameWithoutExt);
}

// Test
isWindowsReservedName('CON.txt');      // true
isWindowsReservedName('data/PRN.log'); // true
isWindowsReservedName('config.txt');   // false
```

**Sanitization:**
```javascript
function sanitizeReservedName(filename) {
  const basename = path.basename(filename);
  const dirname = path.dirname(filename);
  const nameWithoutExt = basename.split('.')[0].toUpperCase();

  if (WINDOWS_RESERVED_NAMES.includes(nameWithoutExt)) {
    // Prepend underscore to make it safe
    const safe = '_' + basename;
    return dirname === '.' ? safe : path.join(dirname, safe);
  }

  return filename;
}

// Test
sanitizeReservedName('CON.txt');  // '_CON.txt'
sanitizeReservedName('data.txt'); // 'data.txt'
```

---

## Path Length Limits

### Windows: MAX_PATH Limitation

**Standard limit: 260 characters**

```javascript
const MAX_PATH_WINDOWS = 260;

// Example path that's too long
const longPath = 'C:\\' + 'a\\'.repeat(130) + 'file.txt';
// Length: 263 characters → FAILS on Windows
```

**Components of MAX_PATH:**
- Drive letter: 2 chars (`C:`)
- Path separators: varies
- Directory and filename: rest
- Null terminator: 1 char

**Workaround: Long Path Prefix**

Windows 10 (version 1607+) supports paths longer than 260 characters using the `\\?\` prefix:

```javascript
function enableLongPaths(filepath) {
  if (process.platform !== 'win32') {
    return filepath;
  }

  // Already has prefix
  if (filepath.startsWith('\\\\?\\')) {
    return filepath;
  }

  // Convert to absolute path first
  const absolute = path.resolve(filepath);

  // Add long path prefix
  return '\\\\?\\' + absolute;
}

// Usage
const longPath = enableLongPaths('C:\\very\\long\\path\\...\\file.txt');
// Result: '\\?\C:\very\long\path\...\file.txt'
```

**Important limitations with `\\?\`:**
- Must be absolute path
- Only backslashes allowed (no forward slashes)
- No `.` or `..` components
- Not all APIs support it

---

### Unix: Varying Limits

**Path component (filename) limit: 255 bytes**
```javascript
const MAX_FILENAME_UNIX = 255;

// This works
const filename = 'a'.repeat(255) + '.txt';  // 259 bytes → filename is 259, too long!

// This works
const filename = 'a'.repeat(251) + '.txt';  // 255 bytes → OK
```

**Total path limit: Usually 4096 bytes**
```javascript
const MAX_PATH_UNIX = 4096;

// But varies by filesystem:
// - ext4: 4096
// - XFS: 4096
// - Btrfs: 4096
// - HFS+: 1024 (macOS)
```

**Validation:**
```javascript
function validatePathLength(filepath) {
  const platform = process.platform;

  // Check total path length
  const maxPath = platform === 'win32' ? 260 :
                  platform === 'darwin' ? 1024 : 4096;

  if (filepath.length > maxPath) {
    throw new Error(`Path too long: ${filepath.length} > ${maxPath}`);
  }

  // Check individual component lengths
  const components = filepath.split(path.sep);
  for (const component of components) {
    if (component.length > 255) {
      throw new Error(`Component too long: ${component.length} > 255`);
    }
  }

  return true;
}
```

---

## Invalid Characters

### Windows Invalid Characters

Windows forbids these characters in filenames:
```javascript
const WINDOWS_INVALID_CHARS = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];

// Additionally, ASCII 0-31 are invalid
for (let i = 0; i < 32; i++) {
  // These are invalid too
}
```

**Detection and sanitization:**
```javascript
function sanitizeWindowsPath(filepath) {
  if (process.platform !== 'win32') {
    return filepath;
  }

  let sanitized = filepath;

  // Replace invalid characters with underscores
  sanitized = sanitized.replace(/[<>:"|?*]/g, '_');

  // Remove ASCII 0-31
  sanitized = sanitized.replace(/[\x00-\x1F]/g, '');

  return sanitized;
}

// Test
sanitizeWindowsPath('file<name>.txt');  // 'file_name_.txt'
sanitizeWindowsPath('file|pipe.txt');    // 'file_pipe.txt'
```

---

### Unix Invalid Characters

Unix is much more permissive - only two characters are truly invalid:
```javascript
const UNIX_INVALID_CHARS = ['\0', '/'];

// Everything else is technically allowed, including:
'file:name.txt'    // ✓ Valid on Unix
'file*name.txt'    // ✓ Valid on Unix (but shell glob!)
'file"name".txt'   // ✓ Valid on Unix
```

**Practical consideration:** Even though allowed, avoid shell metacharacters:
```javascript
const SHELL_METACHARACTERS = ['*', '?', '[', ']', '{', '}', '$', '`', '\\', '"', "'"];

function isShellSafe(filename) {
  return !SHELL_METACHARACTERS.some(char => filename.includes(char));
}
```

---

## Case Sensitivity

### Platform Behavior

**Windows:** Case-insensitive (but preserving)
```javascript
// On Windows
fs.writeFileSync('File.txt', 'content');
fs.existsSync('file.txt');  // true
fs.existsSync('FILE.TXT');  // true
fs.existsSync('FiLe.TxT');  // true

// But the original case is preserved
fs.readdirSync('.'); // ['File.txt'] (original case)
```

**Linux:** Case-sensitive
```javascript
// On Linux
fs.writeFileSync('File.txt', 'content1');
fs.writeFileSync('file.txt', 'content2');  // Different file!
fs.writeFileSync('FILE.TXT', 'content3');  // Yet another file!

fs.readdirSync('.'); // ['File.txt', 'file.txt', 'FILE.TXT']
```

**macOS:** Case-insensitive by default (APFS/HFS+)
```javascript
// On macOS (default APFS)
fs.writeFileSync('File.txt', 'content');
fs.existsSync('file.txt');  // true

// But can be case-sensitive with APFS (Case-sensitive) format
```

### Safe Path Comparison

```javascript
function pathEquals(path1, path2) {
  const norm1 = path.normalize(path1);
  const norm2 = path.normalize(path2);

  // On Windows and macOS (default), compare case-insensitively
  if (process.platform === 'win32' || process.platform === 'darwin') {
    return norm1.toLowerCase() === norm2.toLowerCase();
  }

  // On Linux, case-sensitive
  return norm1 === norm2;
}

// Test
pathEquals('File.txt', 'file.txt');
// Windows/macOS: true
// Linux: false
```

---

## Drive Letters and Roots

### Windows Drive Letters

```javascript
// Absolute path with drive letter
'C:\\Users\\John\\file.txt'

// Drive letter with forward slashes (works!)
'C:/Users/John/file.txt'

// Relative to current directory on specific drive
'C:file.txt'  // Relative to current directory on C:

// UNC path (network share)
'\\\\server\\share\\file.txt'
```

**Parsing drive letters:**
```javascript
function parseDriveLetter(filepath) {
  const match = filepath.match(/^([A-Za-z]:)/);
  return match ? match[1] : null;
}

// Test
parseDriveLetter('C:\\file.txt');   // 'C:'
parseDriveLetter('/unix/path');     // null
parseDriveLetter('relative.txt');   // null
```

---

### Unix Root

```javascript
// Absolute path (starts with /)
'/home/user/file.txt'

// Relative path
'relative/path/file.txt'

// Current directory
'./file.txt'

// Parent directory
'../file.txt'
```

---

## UNC Paths

### What Are UNC Paths?

**UNC (Universal Naming Convention)** paths reference network shares on Windows:

```javascript
// Format: \\server\share\path\to\file
'\\\\server\\share\\folder\\file.txt'

// With IP address
'\\\\192.168.1.100\\share\\file.txt'
```

**Detection:**
```javascript
function isUNCPath(filepath) {
  return filepath.startsWith('\\\\') || filepath.startsWith('//');
}

// Test
isUNCPath('\\\\server\\share\\file.txt');  // true
isUNCPath('C:\\local\\file.txt');           // false
```

**Conversion:**
```javascript
function normalizeUNCPath(filepath) {
  if (!isUNCPath(filepath)) {
    return filepath;
  }

  // Ensure double backslash format
  let normalized = filepath.replace(/^\/\//, '\\\\');

  // Normalize separators
  normalized = normalized.replace(/\//g, '\\');

  return normalized;
}
```

---

## Trailing Characters

### Windows: Trailing Dots and Spaces

Windows **automatically strips** trailing dots and spaces from filenames:

```javascript
// On Windows
fs.writeFileSync('file.txt.', 'content');
// Actually creates: 'file.txt' (dot stripped!)

fs.writeFileSync('file.txt ', 'content');
// Actually creates: 'file.txt' (space stripped!)

fs.writeFileSync('file.txt...   ', 'content');
// Actually creates: 'file.txt' (all trailing dots and spaces stripped!)
```

**This can cause security issues:**
```javascript
// Attacker uploads file
const userFilename = 'malicious.exe.txt... ';

// You check extension
if (path.extname(userFilename) === '.txt') {
  // Looks safe!
}

// But Windows creates
'malicious.exe'  // Executable!
```

**Defense:**
```javascript
function stripWindowsTrailing(filename) {
  if (process.platform !== 'win32') {
    return filename;
  }

  // Strip trailing dots and spaces
  return filename.replace(/[. ]+$/, '');
}

// Then validate the stripped version
const safe = stripWindowsTrailing(userFilename);
if (path.extname(safe) === '.txt') {
  // Now it's actually safe
}
```

---

### Unix: Trailing Dots and Spaces Allowed

On Unix, trailing dots and spaces are **valid characters**:

```javascript
// On Unix/Linux
fs.writeFileSync('file.txt.', 'content');    // Creates 'file.txt.'
fs.writeFileSync('file.txt ', 'content');    // Creates 'file.txt '
fs.writeFileSync('file.txt...   ', 'content'); // Creates 'file.txt...   '

// All different files!
fs.readdirSync('.');  // ['file.txt', 'file.txt.', 'file.txt ', 'file.txt...   ']
```

---

## Unicode Handling

### Normalization Forms

Unicode characters can have multiple representations:

```javascript
// Two ways to represent 'é'
const composed = 'e\u0301';     // e + combining acute accent
const precomposed = '\u00e9';   // é as single character

// They look the same
console.log(composed);     // 'é'
console.log(precomposed);  // 'é'

// But they're different!
composed === precomposed;  // false
composed.length;           // 2
precomposed.length;        // 1
```

**Normalization:**
```javascript
function normalizeUnicode(filepath) {
  // NFC (Canonical Composition) is recommended
  return filepath.normalize('NFC');
}

// Now they're equal
normalizeUnicode(composed) === normalizeUnicode(precomposed);  // true
```

---

### Platform-Specific Unicode Behavior

**macOS:** Automatically normalizes to NFD (Decomposed)
```javascript
// On macOS
fs.writeFileSync('café.txt', 'content');
fs.readdirSync('.');
// Returns: 'café.txt' but in NFD form!

// This can cause issues
const filename = 'café.txt';  // NFC
fs.existsSync(filename);      // false on macOS!
fs.existsSync(filename.normalize('NFD'));  // true
```

**Solution:**
```javascript
function platformNormalize(filepath) {
  if (process.platform === 'darwin') {
    return filepath.normalize('NFD');
  }
  return filepath.normalize('NFC');
}
```

---

## Testing Strategies

### Virtual Machine Testing

```javascript
// Test matrix
const testMatrix = [
  { os: 'Windows 10', tests: ['reserved-names', 'long-paths', 'case'] },
  { os: 'Ubuntu 20.04', tests: ['case-sensitive', 'unicode'] },
  { os: 'macOS 12', tests: ['case-insensitive', 'unicode-nfd'] }
];

// Run tests on each platform
for (const config of testMatrix) {
  runTests(config.os, config.tests);
}
```

---

### Mock Platform Testing

```javascript
class PlatformMock {
  constructor(platform) {
    this.platform = platform;
    this.originalPlatform = process.platform;

    // Mock process.platform
    Object.defineProperty(process, 'platform', {
      value: platform,
      writable: true
    });
  }

  restore() {
    Object.defineProperty(process, 'platform', {
      value: this.originalPlatform,
      writable: true
    });
  }
}

// Usage in tests
describe('Cross-platform path handling', () => {
  it('should handle Windows paths', () => {
    const mock = new PlatformMock('win32');

    expect(validatePath('CON.txt')).to.throw();
    expect(validatePath('file<name>.txt')).to.throw();

    mock.restore();
  });

  it('should handle Unix paths', () => {
    const mock = new PlatformMock('linux');

    expect(validatePath('CON.txt')).to.not.throw();
    expect(validatePath('file:name.txt')).to.not.throw();

    mock.restore();
  });
});
```

---

### Comprehensive Test Suite

```javascript
const testCases = {
  windows: {
    reserved: ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT1'],
    invalid: ['file<name>', 'file>name', 'file:name', 'file|name'],
    valid: ['file.txt', 'my-file.txt', 'file_name.txt'],
    longPath: 'C:\\' + 'a\\'.repeat(130) + 'file.txt',
    unicode: ['café.txt', 'файл.txt', '文件.txt']
  },

  unix: {
    reserved: [],  // No reserved names
    invalid: ['file\0name', 'file/name'],
    valid: ['file.txt', 'file:name', 'file*name', 'file<name>'],
    longPath: '/' + 'a/'.repeat(2000) + 'file.txt',
    unicode: ['café.txt', 'файл.txt', '文件.txt']
  }
};

// Run comprehensive tests
function runComprehensiveTests(platform) {
  const cases = testCases[platform];

  describe(`${platform} edge cases`, () => {
    cases.reserved.forEach(name => {
      it(`should reject reserved name: ${name}`, () => {
        expect(() => validatePath(name)).to.throw();
      });
    });

    cases.invalid.forEach(name => {
      it(`should reject invalid chars: ${name}`, () => {
        expect(() => validatePath(name)).to.throw();
      });
    });

    cases.valid.forEach(name => {
      it(`should accept valid name: ${name}`, () => {
        expect(() => validatePath(name)).to.not.throw();
      });
    });
  });
}
```

---

## Summary

**Key Edge Cases:**
- Windows reserved names (CON, PRN, etc.)
- Path length limits (260 on Windows, 4096 on Unix)
- Invalid characters (many on Windows, few on Unix)
- Case sensitivity (Windows/macOS insensitive, Linux sensitive)
- Drive letters (Windows only)
- Trailing dots/spaces (Windows strips, Unix allows)
- Unicode normalization (macOS uses NFD)

**Best Practices:**
- Test on all target platforms
- Normalize Unicode consistently
- Validate path lengths
- Check for reserved names
- Sanitize invalid characters
- Handle case sensitivity explicitly
- Document platform-specific behavior

**Next Steps:**
- Set up cross-platform testing
- Implement platform detection
- Create comprehensive validation
- Test with real filesystems

---

**Further Reading:**
- [Windows Naming Conventions](https://docs.microsoft.com/en-us/windows/win32/fileio/naming-a-file)
- [POSIX Path Conventions](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap04.html)
- [Unicode Normalization](https://unicode.org/reports/tr15/)
