# Level 3 Solutions

This directory contains complete solutions for all Level 3 (Advanced) exercises.

## How to Use These Solutions

1. **Attempt the exercise first** - Try solving it on your own
2. **Compare your solution** - See how your approach differs
3. **Learn from the implementation** - Study the patterns and techniques
4. **Understand trade-offs** - Each solution includes comments on design decisions

## Solutions Overview

### Exercise 1: Glob Pattern Matcher
**File**: `exercise-1-solution.js`

**Key Concepts**:
- Converting glob syntax to regular expressions
- Handling **, *, ?, and [...] patterns
- Supporting negation patterns
- Performance optimization with caching

**Main Implementation**:
- `globToRegex()` - Converts glob patterns to regex
- `GlobMatcher` class - Reusable pattern matching
- Multi-pattern support with inclusions/exclusions

**Learning Points**:
- Use placeholders to handle ** before * conversion
- Escape special regex characters except glob wildcards
- Cache compiled regex patterns for performance
- Support both case-sensitive and case-insensitive matching

---

### Exercise 2: Symlink Resolution
**File**: `exercise-2-solution.js`

**Key Concepts**:
- Safe symlink resolution with validation
- Circular reference detection
- Maximum depth checking
- Boundary enforcement

**Main Implementation**:
- `SymlinkResolver` class with recursive resolution
- Circular detection using visited Set
- Caching for performance

**Learning Points**:
- Use `fs.lstatSync()` to detect symlinks without following them
- Use `fs.readlinkSync()` to read symlink targets
- Track visited paths to detect circles
- Always validate final resolved path is within bounds

---

### Exercise 3: Secure Path Validator
**File**: `exercise-3-solution.js`

**Key Concepts**:
- Multi-layer security validation
- Encoding attack detection
- Whitelist-based validation
- Comprehensive error reporting

**Main Implementation**:
- `SecurePathValidator` class with layered checks
- Encoding detection for various schemes
- Whitelist and extension validation
- Detailed error messages

**Learning Points**:
- Implement defense in depth with multiple layers
- Check for URL encoding, double encoding, hex, and unicode
- Use whitelist approach when possible
- Provide actionable error messages

---

### Exercise 4: Path Traversal Detector
**File**: `exercise-4-solution.js`

**Key Concepts**:
- Comprehensive traversal detection
- Attack pattern database
- Violation logging
- Security reporting

**Main Implementation**:
- `TraversalDetector` class with threat analysis
- Pattern-based detection system
- Violation logging with context
- Security report generation

**Learning Points**:
- Test against known attack vectors
- Classify threats by severity
- Log all attempts with context (IP, user, timestamp)
- Generate reports for security monitoring

---

### Exercise 5: Cross-Platform Path Library
**File**: `exercise-5-solution.js`

**Key Concepts**:
- Platform-specific path handling
- Maximum path length validation
- Reserved name checking
- Cross-platform normalization

**Main Implementation**:
- `CrossPlatformPathLib` class
- Platform-specific validation
- Path sanitization and conversion
- Comprehensive utilities

**Learning Points**:
- Store platform-specific constants
- Handle case sensitivity appropriately
- Normalize Unicode to NFC
- Test on all target platforms

---

## Common Patterns Across Solutions

### Pattern 1: Defensive Programming
```javascript
// Always validate inputs
function validate(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input');
  }
  // Continue validation...
}
```

### Pattern 2: Layered Security
```javascript
// Multiple independent checks
const checks = [
  checkType,
  checkNullBytes,
  checkEncoding,
  checkTraversal,
  checkBoundaries
];

for (const check of checks) {
  if (!check(input)) {
    throw new SecurityError();
  }
}
```

### Pattern 3: Caching for Performance
```javascript
class CachedResolver {
  constructor() {
    this.cache = new Map();
  }

  resolve(path) {
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }
    const result = this.doResolve(path);
    this.cache.set(path, result);
    return result;
  }
}
```

### Pattern 4: Error Context
```javascript
// Provide detailed error information
throw new Error(JSON.stringify({
  message: 'Validation failed',
  errors: ['Invalid character', 'Path too long'],
  context: { input, timestamp }
}));
```

---

## Key Takeaways

### Security
1. **Never trust user input** - Always validate thoroughly
2. **Multiple layers** - Defense in depth is essential
3. **Test with attacks** - Use real attack patterns for testing
4. **Log violations** - Track all security events

### Performance
1. **Cache aggressively** - Path operations are expensive
2. **Use appropriate data structures** - Map/Set for lookups
3. **Batch when possible** - Process multiple paths together
4. **Profile and measure** - Know your bottlenecks

### Cross-Platform
1. **Test on all platforms** - Behavior varies significantly
2. **Document differences** - Make platform-specific behavior clear
3. **Provide abstractions** - Hide platform details when possible
4. **Handle edge cases** - Reserved names, path limits, etc.

### Code Quality
1. **Clear APIs** - Make usage intuitive
2. **Comprehensive errors** - Help users fix issues
3. **Document thoroughly** - Explain why, not just what
4. **Test extensively** - Cover edge cases and error paths

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

1. **Compare implementations** - How does yours differ?
2. **Understand trade-offs** - Why were certain choices made?
3. **Try variations** - Modify and experiment
4. **Apply to projects** - Use these patterns in real code
5. **Read the guides** - Deeper understanding in conceptual guides

---

## Additional Resources

- [Node.js path module documentation](https://nodejs.org/api/path.html)
- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [Glob pattern specification](https://en.wikipedia.org/wiki/Glob_(programming))

---

Congratulations on completing Level 3! You now have production-ready path handling skills that will serve you well in building secure, reliable applications.
