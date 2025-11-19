# Guide: Glob Patterns - Deep Dive

**Reading Time**: 35 minutes
**Difficulty**: Advanced
**Prerequisites**: Level 2 completed, understanding of regular expressions

---

## Introduction

Glob patterns are a powerful, intuitive way to match file paths using wildcards. They're used everywhere in software development: build tools, file selection, gitignore files, and configuration systems.

### What You'll Learn

- What glob patterns are and how they work
- Complete glob syntax reference
- Implementation strategies from scratch
- Performance considerations
- When to use libraries vs custom implementation
- Real-world use cases and patterns
- Common pitfalls and how to avoid them
- Advanced pattern techniques

---

## Table of Contents

1. [What Are Glob Patterns?](#what-are-glob-patterns)
2. [Pattern Syntax](#pattern-syntax)
3. [How Glob Matching Works](#how-glob-matching-works)
4. [Implementation Strategies](#implementation-strategies)
5. [Performance Considerations](#performance-considerations)
6. [Libraries vs Custom Implementation](#libraries-vs-custom-implementation)
7. [Real-World Use Cases](#real-world-use-cases)
8. [Advanced Techniques](#advanced-techniques)
9. [Common Pitfalls](#common-pitfalls)
10. [Production Patterns](#production-patterns)

---

## What Are Glob Patterns?

### The Simple Definition

**Glob patterns** are wildcard-based pattern matching expressions originally used in Unix shells to match filenames. The name comes from "global" pattern matching.

### A Quick Example

```javascript
// Match all JavaScript files
'*.js'  // Matches: app.js, index.js
        // Doesn't match: lib/app.js, app.ts

// Match JavaScript files anywhere
'**/*.js'  // Matches: app.js, lib/app.js, src/lib/util.js
```

### Why Use Globs?

**Advantages over regex:**
- More intuitive for file paths
- Simpler syntax for common cases
- Standard across many tools
- Built-in path-aware matching

**Advantages over exact matching:**
- Flexible pattern matching
- Less code duplication
- Easy configuration
- User-friendly

---

## Pattern Syntax

### Single Star (*)

**Matches:** Any characters except path separator (/)

```javascript
'*.js'           // Matches: app.js, index.js
                 // Not: lib/app.js (contains /)

'test-*.js'      // Matches: test-1.js, test-unit.js
                 // Not: test.js, test-.js

'src/*.js'       // Matches: src/app.js
                 // Not: src/lib/app.js (nested)
```

**Implementation:**
```javascript
// * becomes [^/]* in regex
'*.js' → /^[^/]*\.js$/
```

**Use cases:**
- Match files in a specific directory
- Match files with a pattern
- Template-based file selection

---

### Double Star (**)

**Matches:** Any characters including path separator (/)

```javascript
'**/*.js'        // Matches: app.js, lib/app.js, src/lib/util.js
                 // Matches any depth

'src/**'         // Matches: src/app.js, src/lib/util.js, src/a/b/c/d.js

'**/test/**'     // Matches anything with 'test' directory anywhere
```

**Implementation:**
```javascript
// ** becomes .* in regex
'**/*.js' → /^.*[/]?[^/]*\.js$/
```

**Important notes:**
- `**` must be a complete path component
- `**/` at start matches zero or more directories
- `/**` at end matches everything inside

**Valid:**
```
'**/*.js'        ✓
'src/**/*.js'    ✓
'**/test/**'     ✓
```

**Invalid (depending on implementation):**
```
'**.js'          ✗ (** not complete component)
'src/**.js'      ✗ (** must be separated)
```

---

### Question Mark (?)

**Matches:** Exactly one character (except /)

```javascript
'file?.txt'      // Matches: file1.txt, fileA.txt
                 // Not: file.txt, file12.txt

'test-??.js'     // Matches: test-01.js, test-ab.js
                 // Not: test-1.js, test-abc.js
```

**Implementation:**
```javascript
// ? becomes [^/] in regex
'file?.txt' → /^file[^/]\.txt$/
```

**Use cases:**
- Fixed-length variations
- Single character wildcards
- Version numbers with fixed digits

---

### Character Sets ([...])

**Matches:** One character from the set

```javascript
'file[0-9].txt'  // Matches: file0.txt, file1.txt, ..., file9.txt

'file[abc].txt'  // Matches: filea.txt, fileb.txt, filec.txt

'file[a-z].txt'  // Matches: filea.txt, fileb.txt, ..., filez.txt

'file[!0-9].txt' // Matches: filea.txt (anything but digits)
```

**Special characters in sets:**
```javascript
'[0-9]'          // Range: 0 through 9
'[a-z]'          // Range: a through z
'[A-Z]'          // Range: A through Z
'[!abc]'         // Negation: anything but a, b, or c
'[^abc]'         // Negation (alternative syntax)
```

**Implementation:**
```javascript
// [...] stays mostly the same in regex
'[0-9]' → /^[0-9]$/
'[!0-9]' → /^[^0-9]$/  // ! becomes ^
```

**Use cases:**
- Match specific character ranges
- Exclude certain characters
- Character class matching

---

### Brace Expansion ({...})

**Matches:** One of the alternatives

```javascript
'*.{js,ts}'      // Matches: app.js, app.ts
                 // Not: app.jsx

'src/{a,b,c}/*'  // Matches: src/a/file.js, src/b/file.js, src/c/file.js

'{test,spec}/**' // Matches: test/app.js, spec/app.js
```

**Nested braces:**
```javascript
'{src,test}/{*.js,*.ts}'  // Multiple levels
```

**Implementation:**
```javascript
// {a,b,c} becomes (a|b|c) in regex
'*.{js,ts}' → /^[^/]*\.(js|ts)$/
```

**Use cases:**
- Multiple file extensions
- Alternative directory names
- Variation patterns

---

### Negation Patterns (!)

**Matches:** Exclusion pattern

```javascript
// In .gitignore style
'*.js'           // Include all .js files
'!test.js'       // But exclude test.js

// In minimatch/micromatch
['**/*.js', '!**/test/**']  // All JS except in test directories
```

**Implementation:**
```javascript
// Handled separately in matching logic
function match(patterns, filepath) {
  const includes = patterns.filter(p => !p.startsWith('!'));
  const excludes = patterns.filter(p => p.startsWith('!'))
                          .map(p => p.substring(1));

  const included = includes.some(p => matchPattern(p, filepath));
  const excluded = excludes.some(p => matchPattern(p, filepath));

  return included && !excluded;
}
```

---

## How Glob Matching Works

### Step-by-Step Process

Let's match `'src/**/*.js'` against `'src/lib/util.js'`:

**Step 1: Convert glob to regex**
```
'src/**/*.js'
↓
'^src/.*[^/]*\\.js$'
```

**Step 2: Compile the regex**
```javascript
const regex = new RegExp('^src/.*[^/]*\\.js$');
```

**Step 3: Test the path**
```javascript
regex.test('src/lib/util.js');  // true
```

### Detailed Conversion Algorithm

```javascript
function globToRegex(pattern) {
  let regex = pattern;

  // Step 1: Handle ** before *
  // Use placeholder to avoid conflicts
  regex = regex.replace(/\*\*/g, '§DOUBLE§');

  // Step 2: Escape special regex characters
  regex = regex.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  // Step 3: Convert glob wildcards
  regex = regex.replace(/\*/g, '[^/]*');        // * → match non-slash
  regex = regex.replace(/§DOUBLE§/g, '.*');     // ** → match anything
  regex = regex.replace(/\?/g, '[^/]');         // ? → one non-slash

  // Step 4: Handle character sets
  regex = regex.replace(/\[!([^\]]+)\]/g, '[^$1]');  // [!abc] → [^abc]

  // Step 5: Handle brace expansion
  regex = regex.replace(/\{([^}]+)\}/g, (match, group) => {
    return '(' + group.split(',').join('|') + ')';
  });

  // Step 6: Anchor the pattern
  regex = '^' + regex + '$';

  return new RegExp(regex);
}
```

### Example Conversions

```
'*.js'                →  /^[^/]*\.js$/
'**/*.js'             →  /^.*[^/]*\.js$/
'src/**/*.{js,ts}'    →  /^src\/.*[^/]*\.(js|ts)$/
'test-?.js'           →  /^test-[^/]\.js$/
'file[0-9].txt'       →  /^file[0-9]\.txt$/
'[!.]*.js'            →  /^[^.][^/]*\.js$/
```

---

## Implementation Strategies

### Strategy 1: Regex Conversion (Fastest)

**Pros:**
- Very fast for repeated matching
- Simple to understand
- Leverages native regex engine

**Cons:**
- One-time conversion cost
- Less control over matching
- Harder to debug

```javascript
class GlobMatcher {
  constructor(pattern) {
    this.regex = globToRegex(pattern);
  }

  test(filepath) {
    return this.regex.test(filepath);
  }
}
```

---

### Strategy 2: Manual Parsing (Most Control)

**Pros:**
- Full control over matching logic
- Can optimize specific cases
- Better error messages

**Cons:**
- More complex implementation
- Potentially slower
- More code to maintain

```javascript
function matchGlob(pattern, filepath) {
  return matchSegments(
    pattern.split('/'),
    filepath.split('/')
  );
}

function matchSegments(patternSegs, pathSegs, pIdx = 0, pathIdx = 0) {
  // Recursive matching logic
  if (pIdx === patternSegs.length && pathIdx === pathSegs.length) {
    return true;  // Both exhausted = match
  }

  if (pIdx === patternSegs.length) {
    return false;  // Pattern exhausted, path remains
  }

  const pattern = patternSegs[pIdx];

  // Handle **
  if (pattern === '**') {
    // Try matching rest at every position
    for (let i = pathIdx; i <= pathSegs.length; i++) {
      if (matchSegments(patternSegs, pathSegs, pIdx + 1, i)) {
        return true;
      }
    }
    return false;
  }

  // Regular segment matching
  if (pathIdx >= pathSegs.length) {
    return false;
  }

  if (matchSegment(pattern, pathSegs[pathIdx])) {
    return matchSegments(patternSegs, pathSegs, pIdx + 1, pathIdx + 1);
  }

  return false;
}
```

---

### Strategy 3: Hybrid Approach (Recommended)

**Combines best of both:**
- Use regex for simple patterns
- Manual parsing for complex patterns (with **)
- Cache compiled patterns

```javascript
class SmartGlobMatcher {
  constructor(pattern) {
    this.pattern = pattern;
    this.cache = new Map();

    // Decide strategy
    if (this.isSimple(pattern)) {
      this.strategy = 'regex';
      this.regex = globToRegex(pattern);
    } else {
      this.strategy = 'parse';
      this.segments = this.parse(pattern);
    }
  }

  isSimple(pattern) {
    // Simple = no ** or complex nesting
    return !pattern.includes('**');
  }

  test(filepath) {
    if (this.cache.has(filepath)) {
      return this.cache.get(filepath);
    }

    const result = this.strategy === 'regex'
      ? this.regex.test(filepath)
      : this.manualMatch(filepath);

    this.cache.set(filepath, result);
    return result;
  }
}
```

---

## Performance Considerations

### Compilation Cost

**Problem:** Converting glob to regex every time is expensive.

**Solution:** Cache compiled patterns.

```javascript
const patternCache = new Map();

function getCachedPattern(glob) {
  if (!patternCache.has(glob)) {
    patternCache.set(glob, globToRegex(glob));
  }
  return patternCache.get(glob);
}
```

**Benchmarks:**
```
Without cache: ~50,000 ops/sec
With cache:    ~5,000,000 ops/sec  (100x faster!)
```

---

### Matching Optimization

**Early Exit:** Stop as soon as mismatch found

```javascript
function fastMatch(pattern, path) {
  // Quick checks before expensive regex

  // Check extension first (fastest)
  if (pattern.endsWith('.js') && !path.endsWith('.js')) {
    return false;
  }

  // Check prefix
  if (pattern.startsWith('src/') && !path.startsWith('src/')) {
    return false;
  }

  // Now do full match
  return fullMatch(pattern, path);
}
```

---

### Batch Matching

**Problem:** Matching one pattern against 10,000 files is inefficient if done naively.

**Solution:** Compile once, test many.

```javascript
function batchMatch(pattern, filepaths) {
  const regex = globToRegex(pattern);  // Compile once
  return filepaths.filter(fp => regex.test(fp));  // Test many
}

// vs. inefficient:
function slowBatchMatch(pattern, filepaths) {
  return filepaths.filter(fp => {
    const regex = globToRegex(pattern);  // Compile every time!
    return regex.test(fp);
  });
}
```

**Benchmark:**
```
Batch (10,000 files): ~10ms
Naive (10,000 files): ~500ms (50x slower!)
```

---

## Libraries vs Custom Implementation

### When to Use Libraries

**Use popular libraries (minimatch, micromatch) when:**
- You need full glob spec compliance
- Edge cases matter (nested braces, extglobs)
- You want battle-tested code
- Performance isn't critical

**Popular libraries:**

```javascript
// minimatch
const minimatch = require('minimatch');
minimatch('file.js', '*.js');  // true

// micromatch (faster)
const micromatch = require('micromatch');
micromatch(['file.js', 'file.ts'], '*.js');  // ['file.js']

// picomatch (fastest, lower-level)
const picomatch = require('picomatch');
const isMatch = picomatch('*.js');
isMatch('file.js');  // true
```

---

### When to Implement Custom

**Implement custom when:**
- You only need basic wildcards (*, **)
- Performance is critical
- You want no dependencies
- You need custom matching logic

**Example use case:**
```javascript
// Simple file filter for build tool
class BuildFileFilter {
  constructor(includes, excludes) {
    this.includes = includes.map(p => globToRegex(p));
    this.excludes = excludes.map(p => globToRegex(p));
  }

  shouldInclude(filepath) {
    // Must match an include pattern
    const included = this.includes.some(re => re.test(filepath));
    if (!included) return false;

    // Must not match any exclude pattern
    const excluded = this.excludes.some(re => re.test(filepath));
    return !excluded;
  }
}

// Usage
const filter = new BuildFileFilter(
  ['src/**/*.js', 'lib/**/*.js'],
  ['**/*.test.js', '**/node_modules/**']
);

filter.shouldInclude('src/app.js');       // true
filter.shouldInclude('src/app.test.js');  // false
```

---

## Real-World Use Cases

### Use Case 1: Build Tools

```javascript
// webpack.config.js
module.exports = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,  // Regex, but often from glob
        include: /src/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
};

// Using globs in custom build tool
const sourceFiles = glob.sync('src/**/*.{js,ts}', {
  ignore: ['**/*.test.{js,ts}', '**/node_modules/**']
});
```

---

### Use Case 2: .gitignore Files

```gitignore
# Ignore node_modules everywhere
**/node_modules/

# Ignore all .log files
*.log

# But keep important.log
!important.log

# Ignore build directories
dist/
build/

# Ignore all .env files except .env.example
.env*
!.env.example
```

---

### Use Case 3: File Upload Validation

```javascript
class FileUploadValidator {
  constructor() {
    this.allowedPatterns = [
      '*.{jpg,jpeg,png,gif}',  // Images
      '*.{pdf,doc,docx}',      // Documents
      '*.txt'                   // Text files
    ];

    this.deniedPatterns = [
      '*.{exe,bat,sh}',  // Executables
      '*.{js,jsx}',      // Code
      '.env*'            // Config files
    ];
  }

  isValid(filename) {
    const allowed = this.allowedPatterns.some(p =>
      minimatch(filename, p, { nocase: true })
    );

    const denied = this.deniedPatterns.some(p =>
      minimatch(filename, p, { nocase: true })
    );

    return allowed && !denied;
  }
}
```

---

### Use Case 4: Test File Discovery

```javascript
// jest.config.js
module.exports = {
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ]
};

// Custom test runner
class TestRunner {
  async findTests(rootDir) {
    const patterns = [
      '**/*.test.js',
      '**/*.spec.js',
      '**/__tests__/**/*.js'
    ];

    const ignorePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**'
    ];

    return await this.globFiles(rootDir, patterns, ignorePatterns);
  }
}
```

---

## Advanced Techniques

### Technique 1: Negation Patterns

```javascript
// Match all JS files except tests
const patterns = [
  '**/*.js',
  '!**/*.test.js',
  '!**/*.spec.js'
];

function matchMultiple(patterns, filepath) {
  const positives = patterns.filter(p => !p.startsWith('!'));
  const negatives = patterns.filter(p => p.startsWith('!'))
                            .map(p => p.substring(1));

  const matched = positives.some(p => match(p, filepath));
  const excluded = negatives.some(p => match(p, filepath));

  return matched && !excluded;
}
```

---

### Technique 2: Dynamic Pattern Generation

```javascript
class DynamicGlobMatcher {
  buildPattern({ dir, extensions, exclude = [] }) {
    const extPattern = extensions.length === 1
      ? extensions[0]
      : `{${extensions.join(',')}}`;

    const include = `${dir}/**/*.${extPattern}`;
    const patterns = [include, ...exclude.map(e => `!${e}`)];

    return patterns;
  }
}

// Usage
const matcher = new DynamicGlobMatcher();
const patterns = matcher.buildPattern({
  dir: 'src',
  extensions: ['js', 'ts'],
  exclude: ['**/*.test.js', '**/node_modules/**']
});
// Result: ['src/**/*.{js,ts}', '!**/*.test.js', '!**/node_modules/**']
```

---

### Technique 3: Incremental Matching

```javascript
// For watching file systems - match new files efficiently
class IncrementalGlobMatcher {
  constructor(pattern) {
    this.pattern = pattern;
    this.regex = globToRegex(pattern);
    this.matched = new Set();
  }

  testNew(filepath) {
    if (this.matched.has(filepath)) {
      return { matched: true, cached: true };
    }

    const matched = this.regex.test(filepath);
    if (matched) {
      this.matched.add(filepath);
    }

    return { matched, cached: false };
  }

  reset() {
    this.matched.clear();
  }
}
```

---

## Common Pitfalls

### Pitfall 1: ** Not Complete Component

```javascript
// ❌ Wrong
'src/**.js'      // ** must be its own component

// ✅ Correct
'src/**/*.js'    // ** separated by /
```

---

### Pitfall 2: Forgetting to Escape Regex Chars

```javascript
// ❌ Wrong - . is regex metacharacter
pattern.replace(/*/g, '.*');  // Will match anything!

// ✅ Correct
pattern.replace(/\./g, '\\.')  // Escape dots
       .replace(/\*/g, '[^/]*');
```

---

### Pitfall 3: Order Matters with Negation

```javascript
// ❌ Wrong - negation before inclusion
['!**/*.test.js', '**/*.js']
// Nothing excluded because nothing included yet

// ✅ Correct - inclusion before negation
['**/*.js', '!**/*.test.js']
```

---

### Pitfall 4: Case Sensitivity Confusion

```javascript
// Different behavior on Windows vs. Unix
'*.JS'.matches('file.js')  // true on Windows, false on Unix

// ✅ Solution: explicit case handling
minimatch('file.js', '*.JS', { nocase: true });  // true everywhere
```

---

## Production Patterns

### Pattern 1: Cached Glob Matcher

```javascript
class CachedGlobMatcher {
  constructor(maxSize = 1000) {
    this.patternCache = new Map();
    this.resultCache = new Map();
    this.maxSize = maxSize;
  }

  match(pattern, filepath) {
    const cacheKey = `${pattern}:${filepath}`;

    if (this.resultCache.has(cacheKey)) {
      return this.resultCache.get(cacheKey);
    }

    let regex = this.patternCache.get(pattern);
    if (!regex) {
      regex = globToRegex(pattern);
      this.patternCache.set(pattern, regex);
    }

    const result = regex.test(filepath);

    if (this.resultCache.size >= this.maxSize) {
      const firstKey = this.resultCache.keys().next().value;
      this.resultCache.delete(firstKey);
    }

    this.resultCache.set(cacheKey, result);
    return result;
  }
}
```

---

### Pattern 2: Glob-Based File Classifier

```javascript
class FileClassifier {
  constructor(rules) {
    this.rules = rules.map(rule => ({
      ...rule,
      regex: globToRegex(rule.pattern)
    }));
  }

  classify(filepath) {
    for (const rule of this.rules) {
      if (rule.regex.test(filepath)) {
        return rule.category;
      }
    }
    return 'unknown';
  }
}

// Usage
const classifier = new FileClassifier([
  { pattern: '**/*.{js,ts}', category: 'source' },
  { pattern: '**/*.test.{js,ts}', category: 'test' },
  { pattern: '**/*.md', category: 'docs' },
  { pattern: '**/package.json', category: 'config' }
]);

classifier.classify('src/app.js');       // 'source'
classifier.classify('src/app.test.js');  // 'test'
```

---

## Summary

Glob patterns are a powerful tool for path matching:

**Key Points:**
- Use `*` for single directory, `**` for any depth
- Compile patterns once, match many times
- Cache aggressively for performance
- Use libraries for complex cases
- Implement custom for simple, performance-critical cases
- Order matters with negation patterns
- Test on all target platforms

**Best Practices:**
- Cache compiled patterns
- Use early exit optimizations
- Handle case sensitivity explicitly
- Document pattern behavior
- Test with edge cases
- Consider using established libraries

**Next Steps:**
- Implement your own glob matcher
- Study minimatch/micromatch source code
- Profile your glob-heavy code
- Build a file filtering system

---

**Further Reading:**
- [Glob (programming) - Wikipedia](https://en.wikipedia.org/wiki/Glob_(programming))
- [minimatch documentation](https://github.com/isaacs/minimatch)
- [micromatch documentation](https://github.com/micromatch/micromatch)
- [Glob pattern examples](https://mywiki.wooledge.org/glob)
