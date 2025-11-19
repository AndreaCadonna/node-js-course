# Level 2 Solutions

This directory contains complete solutions for all Level 2 exercises.

## How to Use These Solutions

1. **Attempt the exercise first** - Try solving it on your own
2. **Compare your solution** - See how your approach differs
3. **Learn from alternatives** - Solutions often include multiple approaches
4. **Understand the why** - Read comments to understand the reasoning

## Solutions Overview

### Exercise 1: Convert Between Windows and Unix Paths
**File**: `exercise-1-solution.js`

**Key Concepts**:
- Detecting path format (Windows vs Unix)
- Removing/adding drive letters
- Handling UNC paths
- Normalizing separators

**Main Functions**:
```javascript
function windowsToUnix(windowsPath) {
  let result = windowsPath.replace(/^[A-Za-z]:/, '');
  return result.split('\\').join('/');
}

function unixToWindows(unixPath, driveLetter = 'C:') {
  let result = unixPath.split('/').join('\\');
  if (unixPath.startsWith('/')) {
    result = driveLetter + result;
  }
  return result;
}
```

**Learning Points**:
- Windows paths use backslashes and have drive letters
- Unix paths use forward slashes and start with /
- UNC paths (\\\\server\\share) need special handling
- Mixed separators should be normalized

---

### Exercise 2: Find Relative Path Between Two Locations
**File**: `exercise-2-solution.js`

**Key Concepts**:
- Using `path.relative()` correctly
- Creating import-ready paths
- Removing file extensions
- Finding common base directories

**Main Functions**:
```javascript
function createImportPath(fromFile, toFile) {
  const fromDir = path.dirname(path.resolve(fromFile));
  const toResolved = path.resolve(toFile);
  const relative = path.relative(fromDir, toResolved);
  const withoutExt = relative.replace(/\.[^/.]+$/, '');

  if (!withoutExt.startsWith('.')) {
    return './' + withoutExt;
  }
  return withoutExt;
}
```

**Learning Points**:
- `path.relative()` needs absolute paths for consistent results
- Import paths should start with ./ or ../
- File extensions are removed for imports
- Use `path.dirname()` for file paths

---

### Exercise 3: Validate User-Provided File Paths
**File**: `exercise-3-solution.js`

**Key Concepts**:
- Security-first validation
- Multi-layer defense approach
- Path traversal detection
- Comprehensive error reporting

**Main Functions**:
```javascript
function isPathSafe(baseDir, userPath) {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, userPath);
  return target.startsWith(base + path.sep) || target === base;
}

function validatePath(baseDir, userPath, options = {}) {
  const errors = [];

  // Check structure, traversal, length, extensions
  // Return { valid, errors, sanitizedPath }

  return { valid: errors.length === 0, errors, sanitizedPath };
}
```

**Learning Points**:
- Always validate user input paths
- Check for null bytes (\0)
- Detect encoded traversal attempts (%2e%2e)
- Multiple validation layers are essential
- Provide clear error messages

**Security Patterns**:
1. Resolve both base and target paths
2. Check if target starts with base
3. Verify no traversal patterns
4. Validate structure and length
5. Check allowed extensions

---

### Exercise 4: Build a Path Utility Library
**File**: `exercise-4-solution.js`

**Key Concepts**:
- Creating reusable path utilities
- Combining path operations
- Building a utility class
- Method composition

**Main Functions**:
```javascript
function getNameWithoutExt(filepath) {
  const basename = path.basename(filepath);
  const ext = path.extname(basename);
  return basename.slice(0, basename.length - ext.length);
}

function changeExtension(filepath, newExt) {
  const ext = newExt.startsWith('.') ? newExt : '.' + newExt;
  const parsed = path.parse(filepath);
  return path.format({ ...parsed, base: undefined, ext });
}

class PathUtils {
  constructor(basePath) {
    this.basePath = path.resolve(basePath);
  }

  resolve(...segments) {
    return path.resolve(this.basePath, ...segments);
  }

  // More utility methods...
}
```

**Learning Points**:
- Use `path.parse()` and `path.format()` for transformations
- Classes can encapsulate path operations with a base directory
- Utility functions should handle edge cases
- Method composition creates powerful tools

**Utility Patterns**:
- Name manipulation (suffix, extension)
- Path analysis (depth, parents)
- Version and date parsing
- Common base finding

---

### Exercise 5: Handle Special Characters in Paths
**File**: `exercise-5-solution.js`

**Key Concepts**:
- Understanding `.`, `..`, and `~`
- Manual path resolution
- Counting directory traversals
- Safe navigation with limits

**Main Functions**:
```javascript
function expandTilde(filepath) {
  if (filepath.startsWith('~/') || filepath === '~') {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

function resolveSpecialChars(filepath) {
  const segments = filepath.split(/[\/\\]/);
  const result = [];

  for (const segment of segments) {
    if (segment === '' || segment === '.') continue;
    else if (segment === '..') result.pop();
    else result.push(segment);
  }

  return result.join('/') || '.';
}

function countTraversals(filepath) {
  const normalized = path.normalize(filepath);
  return normalized.split(path.sep).filter(seg => seg === '..').length;
}
```

**Learning Points**:
- `.` means current directory (usually removed)
- `..` means parent directory (cancels previous segment)
- `~` is shell convention, not Node.js built-in
- Use `os.homedir()` to expand `~`
- Track traversals for security limits

**Special Character Rules**:
1. `.` is typically ignored (current directory)
2. `..` removes previous path segment
3. `~` must be manually expanded
4. Multiple `..` can escape base directory
5. Normalize before counting traversals

---

## Common Patterns Across Solutions

### Pattern 1: Safe Path Resolution
```javascript
function safePath(baseDir, userPath) {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, userPath);

  if (!target.startsWith(base + path.sep) && target !== base) {
    throw new Error('Path outside base directory');
  }

  return target;
}
```

### Pattern 2: Path Transformation
```javascript
function transformPath(filepath, transformations) {
  const parsed = path.parse(filepath);
  return path.format({
    ...parsed,
    ...transformations,
    base: undefined // Let format use name + ext
  });
}
```

### Pattern 3: Segment Processing
```javascript
function processSegments(filepath, processor) {
  const segments = filepath.split(path.sep);
  const result = segments
    .filter(seg => seg) // Remove empty
    .map(processor)
    .filter(seg => seg !== null);
  return result.join(path.sep);
}
```

### Pattern 4: Validation Pipeline
```javascript
function validate(input, validators) {
  const errors = [];

  for (const validator of validators) {
    const result = validator(input);
    if (!result.valid) {
      errors.push(result.error);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

---

## Key Takeaways

### Security
1. **Always validate user input** - Never trust paths from external sources
2. **Use multiple validation layers** - Defense in depth
3. **Resolve before checking** - Use absolute paths for boundary checks
4. **Watch for encoding** - Check for %2e%2e and other encoded patterns

### Path Manipulation
1. **Use built-in methods** - Don't reinvent `path.normalize()`, etc.
2. **Parse and format** - Use `path.parse()` and `path.format()` for transformations
3. **Handle edge cases** - Empty strings, root paths, etc.
4. **Test cross-platform** - Windows and Unix behave differently

### Utilities
1. **Create reusable functions** - Build a toolkit you can use anywhere
2. **Use classes for context** - PathUtils with base directory
3. **Compose methods** - Combine simple operations for complex results
4. **Document thoroughly** - Clear inputs, outputs, and edge cases

### Special Characters
1. **Normalize first** - Clean up paths before processing
2. **Track traversals** - Count `..` for security
3. **Manual expansion** - `~` requires `os.homedir()`
4. **Understand behavior** - `.` and `..` have specific rules

---

## Alternative Approaches

Many exercises have multiple valid solutions. Here are some alternatives:

### String vs Array Processing
```javascript
// String approach
function normalize(path) {
  return path.replace(/\/{2,}/g, '/');
}

// Array approach
function normalize(path) {
  return path.split('/').filter(s => s).join('/');
}
```

### Iterative vs Recursive
```javascript
// Iterative
function getParents(filepath) {
  const parents = [];
  let current = filepath;
  while (current !== path.dirname(current)) {
    current = path.dirname(current);
    parents.push(current);
  }
  return parents;
}

// Recursive
function getParents(filepath) {
  const parent = path.dirname(filepath);
  if (parent === filepath) return [];
  return [parent, ...getParents(parent)];
}
```

---

## Testing Your Solutions

Run the solutions to see expected output:

```bash
# Run a specific solution
node exercise-1-solution.js

# Run all solutions
for file in exercise-*-solution.js; do
  echo "Running $file"
  node "$file"
  echo "---"
done
```

---

## Next Steps

After reviewing these solutions:

1. **Understand each approach** - Don't just copy, understand why it works
2. **Try variations** - Modify solutions and see what happens
3. **Apply to real projects** - Use these patterns in your own code
4. **Read the guides** - Deeper understanding in conceptual guides
5. **Move to Level 3** - Advanced topics await!

---

## Additional Resources

- [Node.js path module documentation](https://nodejs.org/api/path.html)
- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [File system security best practices](https://nodejs.org/en/docs/guides/security/)

---

Great work completing Level 2! You now have strong skills in:
- Path format conversion
- Relative path calculation
- Security validation
- Utility building
- Special character handling

These are production-ready skills that will serve you well in real applications.
