# Guide: Path Validation and Security

**Reading Time**: 30 minutes
**Difficulty**: Intermediate
**Prerequisites**: Path basics, normalization, special characters

---

## Introduction

Path validation is **critical for security**. Improper path handling is one of the most common and dangerous vulnerabilities in web applications. This guide covers comprehensive path validation strategies.

### What You'll Learn

- Complete path validation checklist
- Security vulnerability types
- Defense-in-depth strategies
- Platform-specific validation
- Real-world attack patterns
- Building secure validation systems

---

## Table of Contents

1. [Why Validation Matters](#why-validation-matters)
2. [Path Traversal Attacks](#path-traversal-attacks)
3. [Validation Checklist](#validation-checklist)
4. [Structure Validation](#structure-validation)
5. [Security Validation](#security-validation)
6. [Platform-Specific Validation](#platform-specific-validation)
7. [Defense in Depth](#defense-in-depth)
8. [Building a Validator](#building-a-validator)
9. [Common Attack Patterns](#common-attack-patterns)
10. [Best Practices](#best-practices)

---

## Why Validation Matters

### The Danger

**Path traversal** is ranked in OWASP Top 10. A single validation mistake can:
- Expose sensitive files (`/etc/passwd`, database credentials)
- Allow arbitrary file read/write
- Enable remote code execution
- Compromise entire systems

### Real-World Impact

```javascript
// Vulnerable code (DO NOT USE):
app.get('/download', (req, res) => {
  const filename = req.query.file;
  const filepath = path.join(__dirname, 'uploads', filename);
  res.sendFile(filepath);
});

// Attack:
// GET /download?file=../../../etc/passwd
// Result: Server sends /etc/passwd!
```

### The Cost of Failure

- **2019:** Capital One breach (path traversal component)
- **2021:** Multiple CVEs in popular npm packages
- **Ongoing:** Thousands of vulnerable applications

---

## Path Traversal Attacks

### Basic Attack

```javascript
// User input:
'../../../etc/passwd'

// After joining:
'/app/uploads/../../../etc/passwd'

// Resolves to:
'/etc/passwd'  // BREACH!
```

### URL Encoding

```javascript
// Encoded ../:
'%2e%2e%2f%2e%2e%2fetc/passwd'

// Double encoded:
'%252e%252e%252fetc/passwd'

// Mixed encoding:
'..%2f..%2fetc/passwd'
```

### Null Byte Injection

```javascript
// Bypassing extension checks:
'allowed.jpg\0../../etc/passwd'

// Some systems truncate at \0:
'allowed.jpg'  // Passes extension check
'../../etc/passwd'  // Actually accessed
```

### Absolute Path Injection

```javascript
// User provides absolute path:
'/etc/passwd'

// Naive joining:
path.join('/app/uploads', '/etc/passwd')
// → '/etc/passwd'  // BREACH!
```

### Unicode/Special Encoding

```javascript
// Unicode dots:
'\u002e\u002e/etc/passwd'

// Hex encoding:
'\\x2e\\x2e/etc/passwd'

// Alternative representations:
'\u2024\u2024/etc/passwd'
```

---

## Validation Checklist

### Complete Validation Process

```javascript
function validatePath(userPath, baseDir) {
  // 1. Type check
  if (!userPath || typeof userPath !== 'string') {
    return { valid: false, reason: 'Invalid type' };
  }

  // 2. Length check
  if (userPath.length === 0 || userPath.length > 4096) {
    return { valid: false, reason: 'Invalid length' };
  }

  // 3. Null byte check
  if (userPath.includes('\0')) {
    return { valid: false, reason: 'Null byte detected' };
  }

  // 4. Invalid characters (platform-specific)
  if (hasInvalidCharacters(userPath)) {
    return { valid: false, reason: 'Invalid characters' };
  }

  // 5. Encoding check
  if (hasEncodedTraversal(userPath)) {
    return { valid: false, reason: 'Encoded traversal detected' };
  }

  // 6. Normalize
  const normalized = path.normalize(userPath);

  // 7. Check if normalized differs (suspicious)
  if (normalized !== userPath) {
    // May indicate obfuscation attempt
  }

  // 8. Resolve to absolute
  const base = path.resolve(baseDir);
  const target = path.resolve(base, normalized);

  // 9. Boundary check
  if (!target.startsWith(base + path.sep) && target !== base) {
    return { valid: false, reason: 'Outside base directory' };
  }

  // 10. Component check
  const relative = path.relative(base, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { valid: false, reason: 'Invalid relative path' };
  }

  return { valid: true, sanitized: target };
}
```

---

## Structure Validation

### Basic Structure

```javascript
function validateStructure(filepath) {
  const errors = [];

  // Not null/undefined
  if (filepath == null) {
    errors.push('Path is null or undefined');
  }

  // Is string
  if (typeof filepath !== 'string') {
    errors.push('Path must be a string');
  }

  // Not empty
  if (filepath.trim() === '') {
    errors.push('Path is empty');
  }

  // No null bytes
  if (filepath.includes('\0')) {
    errors.push('Path contains null bytes');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Length Validation

```javascript
function validateLength(filepath) {
  const errors = [];

  // Total length (Windows: 260, Unix: 4096 typical)
  const maxLength = process.platform === 'win32' ? 260 : 4096;

  if (filepath.length > maxLength) {
    errors.push(`Path too long: ${filepath.length} (max: ${maxLength})`);
  }

  // Individual component length (255 typical)
  const components = filepath.split(path.sep);
  for (const component of components) {
    if (component.length > 255) {
      errors.push(`Component too long: '${component}' (${component.length} chars)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Character Validation

```javascript
function validateCharacters(filepath) {
  const errors = [];

  // Platform-specific invalid chars
  if (process.platform === 'win32') {
    const windowsInvalid = /[<>:"|?*\x00-\x1F]/;
    if (windowsInvalid.test(filepath)) {
      errors.push('Contains Windows-invalid characters');
    }
  } else {
    // Unix: only null byte is invalid
    if (filepath.includes('\0')) {
      errors.push('Contains null byte');
    }
  }

  // Check for control characters
  if (/[\x00-\x1F]/.test(filepath)) {
    errors.push('Contains control characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Security Validation

### Traversal Detection

```javascript
function detectTraversal(filepath) {
  const patterns = [
    { regex: /\.\./,pattern: 'Direct parent reference (..)' },
    { regex: /%2e%2e/i, pattern: 'URL encoded parent' },
    { regex: /%252e%252e/i, pattern: 'Double encoded parent' },
    { regex: /\u002e\u002e/, pattern: 'Unicode parent' },
    { regex: /\\x2e\\x2e/, pattern: 'Hex encoded parent' },
  ];

  const detected = [];

  for (const { regex, pattern } of patterns) {
    if (regex.test(filepath)) {
      detected.push(pattern);
    }
  }

  return {
    hasTraversal: detected.length > 0,
    patterns: detected
  };
}
```

### Boundary Validation

```javascript
function validateBoundary(filepath, baseDir) {
  // Resolve both to absolute
  const base = path.resolve(baseDir);
  const target = path.resolve(base, filepath);

  // Check if target starts with base
  const isInside = target.startsWith(base + path.sep) || target === base;

  if (!isInside) {
    return {
      valid: false,
      base,
      target,
      reason: 'Path escapes base directory'
    };
  }

  // Additional check: relative path shouldn't start with ..
  const relative = path.relative(base, target);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return {
      valid: false,
      reason: 'Relative path escapes base'
    };
  }

  return {
    valid: true,
    base,
    target,
    relative
  };
}
```

### Absolute Path Prevention

```javascript
function preventAbsolutePath(filepath, allowAbsolute = false) {
  const isAbs = path.isAbsolute(filepath);

  if (isAbs && !allowAbsolute) {
    return {
      valid: false,
      reason: 'Absolute paths not allowed'
    };
  }

  // Check for drive letters (Windows)
  if (/^[A-Za-z]:/.test(filepath)) {
    return {
      valid: false,
      reason: 'Drive letters not allowed'
    };
  }

  // Check for UNC paths (Windows)
  if (filepath.startsWith('\\\\')) {
    return {
      valid: false,
      reason: 'UNC paths not allowed'
    };
  }

  return { valid: true };
}
```

---

## Platform-Specific Validation

### Windows Reserved Names

```javascript
function validateWindowsReserved(filepath) {
  if (process.platform !== 'win32') {
    return { valid: true };
  }

  const reserved = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5',
    'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5',
    'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];

  const basename = path.basename(filepath, path.extname(filepath));

  if (reserved.includes(basename.toUpperCase())) {
    return {
      valid: false,
      reason: `Reserved Windows name: ${basename}`
    };
  }

  return { valid: true };
}
```

### Extension Validation

```javascript
function validateExtension(filepath, allowedExts) {
  if (allowedExts.length === 0) {
    return { valid: true };
  }

  const ext = path.extname(filepath).toLowerCase();

  // Normalize allowed extensions
  const normalized = allowedExts.map(e =>
    e.startsWith('.') ? e.toLowerCase() : '.' + e.toLowerCase()
  );

  if (!normalized.includes(ext)) {
    return {
      valid: false,
      reason: `Extension '${ext}' not allowed`,
      allowed: normalized
    };
  }

  return { valid: true };
}
```

---

## Defense in Depth

### Multiple Layers

```javascript
class SecurePathValidator {
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.options = {
      allowedExtensions: [],
      maxLength: 4096,
      allowAbsolute: false,
      allowHidden: true,
      ...options
    };
  }

  validate(userPath) {
    const errors = [];

    // Layer 1: Structure
    const structure = validateStructure(userPath);
    if (!structure.valid) {
      errors.push(...structure.errors);
      return { valid: false, errors };
    }

    // Layer 2: Length
    const length = validateLength(userPath);
    if (!length.valid) {
      errors.push(...length.errors);
    }

    // Layer 3: Characters
    const chars = validateCharacters(userPath);
    if (!chars.valid) {
      errors.push(...chars.errors);
    }

    // Layer 4: Traversal
    const traversal = detectTraversal(userPath);
    if (traversal.hasTraversal) {
      errors.push(`Traversal detected: ${traversal.patterns.join(', ')}`);
    }

    // Layer 5: Absolute path
    const absolute = preventAbsolutePath(userPath, this.options.allowAbsolute);
    if (!absolute.valid) {
      errors.push(absolute.reason);
    }

    // Layer 6: Normalize and validate boundary
    const normalized = path.normalize(userPath);
    const boundary = validateBoundary(normalized, this.baseDir);

    if (!boundary.valid) {
      errors.push(boundary.reason);
    }

    // Layer 7: Extension
    if (this.options.allowedExtensions.length > 0) {
      const ext = validateExtension(userPath, this.options.allowedExtensions);
      if (!ext.valid) {
        errors.push(ext.reason);
      }
    }

    // Layer 8: Hidden files
    if (!this.options.allowHidden) {
      const basename = path.basename(userPath);
      if (basename.startsWith('.') && basename !== '.' && basename !== '..') {
        errors.push('Hidden files not allowed');
      }
    }

    // Layer 9: Windows reserved
    const reserved = validateWindowsReserved(userPath);
    if (!reserved.valid) {
      errors.push(reserved.reason);
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: boundary.valid ? boundary.target : null
    };
  }
}

// Usage:
const validator = new SecurePathValidator('/app/uploads', {
  allowedExtensions: ['.jpg', '.png', '.pdf'],
  allowHidden: false
});

const result = validator.validate(userInput);
if (!result.valid) {
  throw new Error(`Invalid path: ${result.errors.join(', ')}`);
}

// Safe to use result.sanitized
```

---

## Common Attack Patterns

### Attack 1: Basic Traversal

```javascript
'../../../etc/passwd'
```

**Detection:**
```javascript
if (normalized.includes('..')) {
  // Suspicious
}
```

### Attack 2: Null Byte Injection

```javascript
'safe.jpg\0../../etc/passwd'
```

**Detection:**
```javascript
if (filepath.includes('\0')) {
  throw new Error('Null byte detected');
}
```

### Attack 3: URL Encoding

```javascript
'%2e%2e%2f%2e%2e%2fetc/passwd'
```

**Detection:**
```javascript
// Decode and check
const decoded = decodeURIComponent(filepath);
if (decoded !== filepath && decoded.includes('..')) {
  throw new Error('Encoded traversal');
}
```

### Attack 4: Absolute Path

```javascript
'/etc/passwd'
```

**Detection:**
```javascript
if (path.isAbsolute(userPath)) {
  throw new Error('Absolute paths not allowed');
}
```

### Attack 5: Windows Drive

```javascript
'C:\\Windows\\System32\\config\\sam'
```

**Detection:**
```javascript
if (/^[A-Za-z]:/.test(filepath)) {
  throw new Error('Drive letters not allowed');
}
```

---

## Best Practices

### Practice 1: Validate Early

```javascript
// ✅ Validate immediately
app.post('/upload', (req, res) => {
  const result = validator.validate(req.body.filename);

  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }

  // Continue with validated path
});
```

### Practice 2: Use Whitelist

```javascript
// ✅ Whitelist > Blacklist
const allowedDirs = ['uploads', 'temp', 'cache'];

function isAllowed(filepath) {
  const firstSegment = filepath.split(path.sep)[0];
  return allowedDirs.includes(firstSegment);
}
```

### Practice 3: Log Violations

```javascript
// ✅ Log security violations
function validateAndLog(userPath, userId) {
  const result = validator.validate(userPath);

  if (!result.valid) {
    logger.warn('Path validation failed', {
      userId,
      path: userPath,
      errors: result.errors,
      timestamp: new Date()
    });
  }

  return result;
}
```

### Practice 4: Rate Limit

```javascript
// ✅ Rate limit validation failures
const failureTracker = new Map();

function validateWithRateLimit(userPath, userId) {
  const result = validator.validate(userPath);

  if (!result.valid) {
    const failures = (failureTracker.get(userId) || 0) + 1;
    failureTracker.set(userId, failures);

    if (failures > 5) {
      throw new Error('Too many validation failures');
    }
  }

  return result;
}
```

---

## Summary

### Critical Rules

1. **Never trust user input**
2. **Validate in multiple layers**
3. **Normalize then check boundaries**
4. **Use whitelist over blacklist**
5. **Log security violations**
6. **Test with attack patterns**

### Quick Checklist

```javascript
// Validation checklist:
☐ Type and structure
☐ Length limits
☐ Null bytes
☐ Invalid characters
☐ Encoded traversal
☐ Normalize
☐ Boundary check
☐ Extension validation
☐ Platform-specific rules
☐ Log failures
```

---

## What's Next?

1. **[Format Conversion](05-format-conversion.md)** - Cross-platform paths
2. **[Examples](../examples/)** - See validation in action
3. **[Exercises](../exercises/)** - Practice secure validation

---

Security is not optional. Validate every path, every time!
