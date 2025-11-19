# Level 3: Path Advanced

Master production-ready path handling with glob patterns, symbolic links, security hardening, and cross-platform edge cases.

## Learning Objectives

By the end of this level, you will be able to:
- Implement glob pattern matching for path filtering
- Safely resolve and handle symbolic links
- Build comprehensive path traversal attack prevention systems
- Handle complex cross-platform path edge cases
- Create production-grade path validation systems
- Optimize path operations for performance
- Build robust, reusable path utility libraries
- Apply security hardening to all path operations

## Overview

Level 3 represents the pinnacle of path handling in Node.js. You'll learn advanced techniques used in production systems, including glob pattern implementation, symbolic link resolution, comprehensive security hardening, and handling the most complex edge cases across all platforms.

This level is designed for developers building production applications where security, reliability, and performance are critical.

---

## Topics Covered

### 1. Glob Pattern Implementation
- Understanding glob pattern syntax (*, **, ?, [])
- Implementing basic glob matchers
- Handling recursive directory patterns
- Advanced pattern combinations
- Performance considerations

### 2. Symbolic Link Resolution
- Understanding symlinks and hard links
- Safe symlink resolution strategies
- Detecting circular symlinks
- Security implications of symlinks
- Cross-platform symlink handling

### 3. Path Traversal Attack Prevention
- Comprehensive defense strategies
- Multi-layer validation systems
- Detecting advanced attack vectors
- Encoding attack prevention
- Production-grade security patterns

### 4. Cross-Platform Edge Cases
- Platform-specific path behaviors
- Handling maximum path lengths
- Reserved names and characters
- Case sensitivity issues
- Unicode and special characters

### 5. Advanced Path Validation
- Building comprehensive validators
- Whitelist and blacklist strategies
- Performance-optimized validation
- Context-aware path checking
- Error reporting and debugging

### 6. Path Performance Optimization
- Caching strategies
- Batch operations
- Avoiding repeated resolutions
- Memory-efficient path handling
- Profiling and benchmarking

### 7. Production Path Libraries
- Designing reusable path utilities
- API design principles
- Error handling patterns
- Testing strategies
- Documentation approaches

### 8. Production Patterns
- Real-world path handling scenarios
- Integration with frameworks
- Configuration management
- Deployment considerations
- Monitoring and logging

---

## Examples

This level includes 8 comprehensive, production-ready examples:

1. **[01-glob-patterns.js](./examples/01-glob-patterns.js)**
   - Implementing glob pattern matching
   - Supporting wildcards (*, ?, [abc])
   - Recursive patterns (**)
   - Negation and complex patterns

2. **[02-symlink-resolution.js](./examples/02-symlink-resolution.js)**
   - Safe symlink resolution
   - Detecting circular references
   - Following symlink chains
   - Security considerations

3. **[03-path-traversal-prevention.js](./examples/03-path-traversal-prevention.js)**
   - Advanced traversal detection
   - Multi-layer defense systems
   - Encoding attack prevention
   - Real-world attack scenarios

4. **[04-cross-platform-edge-cases.js](./examples/04-cross-platform-edge-cases.js)**
   - Platform-specific behaviors
   - Maximum path length handling
   - Reserved names (CON, NUL, etc.)
   - Unicode and special characters

5. **[05-advanced-validation.js](./examples/05-advanced-validation.js)**
   - Production-grade validators
   - Performance optimization
   - Context-aware validation
   - Comprehensive error reporting

6. **[06-path-performance.js](./examples/06-path-performance.js)**
   - Caching strategies
   - Batch operations
   - Performance benchmarking
   - Memory optimization

7. **[07-path-library.js](./examples/07-path-library.js)**
   - Building a complete path library
   - API design patterns
   - Error handling
   - Testing approaches

8. **[08-production-patterns.js](./examples/08-production-patterns.js)**
   - Real-world scenarios
   - Framework integration
   - Configuration management
   - Best practices

### Running Examples

```bash
# Run any example
node examples/01-glob-patterns.js

# Run all examples
for file in examples/*.js; do
  echo "Running $file"
  node "$file"
  echo "---"
done
```

---

## Exercises

Test your mastery with 5 advanced exercises:

1. **[exercise-1.js](./exercises/exercise-1.js)** - Implement a simple glob pattern matcher
2. **[exercise-2.js](./exercises/exercise-2.js)** - Resolve symbolic links safely
3. **[exercise-3.js](./exercises/exercise-3.js)** - Build a secure file path validator
4. **[exercise-4.js](./exercises/exercise-4.js)** - Create a path traversal detector
5. **[exercise-5.js](./exercises/exercise-5.js)** - Implement a cross-platform path library

### Exercise Guidelines

1. Read the exercise description thoroughly
2. Implement production-ready solutions
3. Consider security implications
4. Handle edge cases comprehensively
5. Test across different scenarios
6. Compare with solutions only after attempting

### Checking Solutions

Solutions are available in the `solutions/` directory:

```bash
# After attempting, compare your solution
node solutions/exercise-1-solution.js
```

---

## Conceptual Guides

For deep understanding, read these comprehensive guides:

1. **[01-glob-patterns.md](./guides/01-glob-patterns.md)**
   - Complete glob pattern reference
   - Implementation strategies
   - Performance considerations
   - Real-world applications

2. **[02-symlinks.md](./guides/02-symlinks.md)**
   - Deep dive into symbolic links
   - Safe resolution strategies
   - Security implications
   - Cross-platform handling

3. **[03-security-advanced.md](./guides/03-security-advanced.md)**
   - Advanced security patterns
   - Attack vector analysis
   - Defense-in-depth strategies
   - Production security checklist

4. **[04-edge-cases.md](./guides/04-edge-cases.md)**
   - Cross-platform edge cases
   - Platform-specific behaviors
   - Handling unusual paths
   - Compatibility strategies

5. **[05-production-patterns.md](./guides/05-production-patterns.md)**
   - Production-ready patterns
   - Real-world scenarios
   - Integration strategies
   - Best practices

6. **[06-performance.md](./guides/06-performance.md)**
   - Performance optimization
   - Caching strategies
   - Benchmarking approaches
   - Memory management

---

## Key Concepts

### Glob Patterns

**Pattern Matching** - Filter paths with wildcards:
```javascript
// * matches any characters except /
'src/*.js'  // Matches: src/app.js, src/index.js

// ** matches any characters including /
'src/**/*.js'  // Matches: src/app.js, src/lib/util.js

// ? matches single character
'file?.txt'  // Matches: file1.txt, fileA.txt

// [...] matches character range
'file[0-9].txt'  // Matches: file0.txt, file9.txt
```

### Symbolic Links

**Safe Resolution** - Handle symlinks securely:
```javascript
const fs = require('fs');
const path = require('path');

function safeResolveSymlink(filepath, baseDir) {
  const realpath = fs.realpathSync(filepath);
  const base = path.resolve(baseDir);

  if (!realpath.startsWith(base + path.sep)) {
    throw new Error('Symlink points outside base directory');
  }

  return realpath;
}
```

### Path Traversal Prevention

**Multi-Layer Defense** - Comprehensive security:
```javascript
function securePath(baseDir, userInput) {
  // Layer 1: Input validation
  if (!userInput || typeof userInput !== 'string') {
    throw new Error('Invalid input');
  }

  // Layer 2: Check for null bytes
  if (userInput.includes('\0')) {
    throw new Error('Null byte detected');
  }

  // Layer 3: Check encoded traversals
  if (/%2e%2e|\.\./.test(userInput)) {
    throw new Error('Traversal pattern detected');
  }

  // Layer 4: Resolve and check boundaries
  const base = path.resolve(baseDir);
  const target = path.resolve(base, userInput);

  if (!target.startsWith(base + path.sep) && target !== base) {
    throw new Error('Path outside boundaries');
  }

  return target;
}
```

### Cross-Platform Edge Cases

**Platform-Specific Handling**:
```javascript
function handlePlatformEdgeCases(filepath) {
  // Windows reserved names
  const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1-9', 'LPT1-9'];
  const basename = path.basename(filepath).toUpperCase();

  if (reserved.some(r => basename.startsWith(r))) {
    throw new Error('Reserved filename');
  }

  // Check maximum path length
  if (process.platform === 'win32' && filepath.length > 260) {
    throw new Error('Path too long for Windows');
  }

  return filepath;
}
```

---

## Production Patterns

### Secure File Access Service

```javascript
class SecureFileService {
  constructor(baseDir) {
    this.baseDir = path.resolve(baseDir);
    this.cache = new Map();
  }

  validatePath(userPath) {
    // Multi-layer validation
    const normalized = path.normalize(userPath);
    const resolved = path.resolve(this.baseDir, normalized);

    if (!resolved.startsWith(this.baseDir + path.sep)) {
      throw new Error('Access denied');
    }

    return resolved;
  }

  async readFile(userPath) {
    const safePath = this.validatePath(userPath);

    // Check symlinks
    const stat = await fs.promises.lstat(safePath);
    if (stat.isSymbolicLink()) {
      const realpath = await fs.promises.realpath(safePath);
      if (!realpath.startsWith(this.baseDir + path.sep)) {
        throw new Error('Symlink outside base directory');
      }
    }

    return fs.promises.readFile(safePath);
  }
}
```

### Glob Pattern Matcher

```javascript
function globMatch(pattern, filepath) {
  // Convert glob to regex
  const regex = pattern
    .replace(/\*\*/g, '§§') // Placeholder for **
    .replace(/\*/g, '[^/]*')
    .replace(/§§/g, '.*')
    .replace(/\?/g, '.')
    .replace(/\[([^\]]+)\]/g, '[$1]');

  return new RegExp('^' + regex + '$').test(filepath);
}
```

### Path Performance Cache

```javascript
class PathCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  resolve(...segments) {
    const key = segments.join('|');

    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const result = path.resolve(...segments);

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, result);
    return result;
  }
}
```

---

## Best Practices

### ✅ DO

- Implement multi-layer security validation
- Cache resolved paths for performance
- Handle symbolic links explicitly
- Test with malicious inputs
- Consider all platform edge cases
- Use glob patterns for flexible filtering
- Build reusable, well-tested utilities
- Log security violations
- Monitor path operation performance
- Document edge cases and limitations

### ❌ DON'T

- Trust any user-provided paths without validation
- Forget about symbolic link attacks
- Ignore platform-specific behaviors
- Use string operations for pattern matching
- Skip performance testing
- Implement security as an afterthought
- Forget about maximum path lengths
- Ignore Unicode and special characters
- Cache without size limits
- Skip error handling

---

## Common Mistakes

### Mistake 1: Incomplete Symlink Validation

```javascript
// ❌ Wrong - doesn't check symlink target
function readFile(filepath) {
  const resolved = path.resolve(baseDir, filepath);
  return fs.readFileSync(resolved);
}

// ✅ Correct - validates symlink target
async function readFile(filepath) {
  const resolved = path.resolve(baseDir, filepath);
  const stat = await fs.promises.lstat(resolved);

  if (stat.isSymbolicLink()) {
    const realpath = await fs.promises.realpath(resolved);
    if (!realpath.startsWith(baseDir + path.sep)) {
      throw new Error('Symlink attack detected');
    }
  }

  return fs.promises.readFile(resolved);
}
```

### Mistake 2: Naive Glob Implementation

```javascript
// ❌ Wrong - doesn't handle ** correctly
function globMatch(pattern, filepath) {
  return filepath.includes(pattern.replace('*', ''));
}

// ✅ Correct - proper pattern conversion
function globMatch(pattern, filepath) {
  const regex = pattern
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]');
  return new RegExp('^' + regex + '$').test(filepath);
}
```

### Mistake 3: Ignoring Platform Limits

```javascript
// ❌ Wrong - no length checking
function createPath(...segments) {
  return path.join(...segments);
}

// ✅ Correct - validates platform limits
function createPath(...segments) {
  const result = path.join(...segments);

  if (process.platform === 'win32' && result.length > 260) {
    throw new Error('Path exceeds Windows MAX_PATH');
  }

  return result;
}
```

---

## Security Considerations

### Advanced Attack Vectors

1. **Double Encoding**
   ```javascript
   // %252e%252e = %2e%2e = ..
   // Decode twice!
   ```

2. **Unicode Normalization**
   ```javascript
   // Different Unicode representations
   // 'a\u0308' vs '\u00e4'
   ```

3. **Symlink Time-of-Check-Time-of-Use (TOCTOU)**
   ```javascript
   // Attacker changes symlink between check and use
   // Use file descriptors, not paths
   ```

4. **Case Sensitivity Attacks**
   ```javascript
   // Windows: case-insensitive
   // Linux: case-sensitive
   // Normalize case for security checks
   ```

### Defense Checklist

- [ ] Validate all user input paths
- [ ] Check resolved paths against boundaries
- [ ] Validate symlink targets
- [ ] Detect encoded traversal attempts
- [ ] Handle Unicode normalization
- [ ] Check platform-specific limits
- [ ] Use file descriptors for operations
- [ ] Implement rate limiting
- [ ] Log security events
- [ ] Test with attack vectors

---

## Performance Considerations

### Optimization Strategies

1. **Caching**
   - Cache resolved paths
   - Cache validation results
   - LRU eviction strategy

2. **Batch Operations**
   - Validate multiple paths together
   - Batch file system operations
   - Parallel processing

3. **Early Exit**
   - Fail fast on invalid input
   - Short-circuit validation
   - Optimize hot paths

4. **Memory Management**
   - Limit cache sizes
   - Clean up unused entries
   - Monitor memory usage

---

## Testing Your Knowledge

After completing this level, you should be able to answer:

1. How do you implement a basic glob pattern matcher?
2. What are the security risks of symbolic links and how do you mitigate them?
3. How do you build a multi-layer path traversal defense system?
4. What cross-platform edge cases must you handle in production?
5. How do you optimize path operations for performance?
6. What are the components of a production-ready path library?
7. How do you handle circular symbolic link references?
8. What encoding attacks exist for path traversal?

---

## Next Steps

Once you've completed this level:

1. ✅ Complete all exercises
2. ✅ Read all conceptual guides
3. ✅ Understand glob pattern implementation
4. ✅ Master symlink security
5. ✅ Build production-ready validators
6. ✅ Apply learnings to real projects
7. ➡️ Move to Module 3: [Buffer Basics](../../03-buffer/level-1-basics/README.md)

---

## Time Estimate

- **Examples**: 60-90 minutes
- **Exercises**: 90-120 minutes
- **Guides**: 90-120 minutes
- **Total**: 4-6 hours

---

## Summary

Level 3 covers advanced, production-ready path handling:
- Glob pattern implementation and matching
- Secure symbolic link resolution
- Comprehensive path traversal prevention
- Cross-platform edge case handling
- Advanced validation systems
- Performance optimization strategies
- Building production-ready path libraries
- Real-world security patterns

These are the skills that separate basic path handling from production-grade systems. Master them, and you'll be able to build secure, performant, and reliable applications that handle paths correctly across all platforms and scenarios.

You're now ready to apply these advanced techniques in production systems where security, reliability, and performance are critical!
