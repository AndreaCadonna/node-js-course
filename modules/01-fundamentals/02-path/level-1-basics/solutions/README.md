# Level 1 Solutions

This directory contains complete solutions for all Level 1 exercises.

## How to Use These Solutions

1. **Attempt the exercise first** - Try solving it on your own
2. **Compare your solution** - See how your approach differs
3. **Learn from alternatives** - Solutions often include multiple approaches
4. **Understand the why** - Read comments to understand the reasoning

## Solutions Overview

### Exercise 1: Join Multiple Path Segments
**File**: `exercise-1-solution.js`

**Key Concepts**:
- Using `path.join()` with spread operator
- Handling empty arrays
- Filtering invalid segments

**Main Solution**:
```javascript
function joinPathSegments(segments) {
  return path.join(...segments);
}
```

---

### Exercise 2: Extract Filename from Full Path
**File**: `exercise-2-solution.js`

**Key Concepts**:
- Using `path.basename()`
- Extracting filename without extension
- Working with different path formats

**Main Solution**:
```javascript
function getFilename(filepath) {
  return path.basename(filepath);
}
```

**Bonus**: Getting filename without extension using `path.basename(file, ext)`

---

### Exercise 3: Get File Extension
**File**: `exercise-3-solution.js`

**Key Concepts**:
- Using `path.extname()`
- Normalizing extensions to lowercase
- Categorizing files by extension

**Main Solution**:
```javascript
function getFileExtension(filepath) {
  return path.extname(filepath).toLowerCase();
}
```

**Bonus**: File type categorization system

---

### Exercise 4: Build Absolute Paths from Relative Ones
**File**: `exercise-4-solution.js`

**Key Concepts**:
- Using `path.resolve()`
- Checking if path is absolute with `path.isAbsolute()`
- Converting between absolute and relative paths

**Main Solution**:
```javascript
function makeAbsolute(relativePath) {
  return path.resolve(relativePath);
}
```

**Bonus**: Making paths absolute from custom base directory, converting absolute to relative

---

### Exercise 5: Create Cross-Platform File Paths
**File**: `exercise-5-solution.js`

**Key Concepts**:
- Building a utility class for path operations
- Combining multiple path methods
- Path validation and security
- Cross-platform compatibility

**Main Solution**:
```javascript
class PathBuilder {
  constructor(baseDir) {
    this.baseDir = path.resolve(baseDir);
  }

  build(...segments) {
    return path.join(this.baseDir, ...segments);
  }

  // ... other methods
}
```

**Bonus**: Enhanced version with extension changing, suffix adding, and normalization

---

## Common Patterns

### Pattern 1: Spread Operator with path.join()
```javascript
const segments = ['a', 'b', 'c'];
const joined = path.join(...segments);
```

### Pattern 2: Getting Name Without Extension
```javascript
const name = path.basename(filepath, path.extname(filepath));
```

### Pattern 3: Safe Path Resolution
```javascript
const safe = path.resolve(baseDir, userPath);
const isSafe = safe.startsWith(baseDir + path.sep);
```

### Pattern 4: Lowercase Extensions
```javascript
const ext = path.extname(filepath).toLowerCase();
```

## Alternative Approaches

Many exercises can be solved in multiple ways. The solutions show:
- The **simplest** approach (usually the best)
- **Alternative** approaches for learning
- **Enhanced** versions with additional features

## Learning Tips

1. **Understand, don't memorize**: Focus on why each solution works
2. **Try variations**: Modify the solutions and see what happens
3. **Compare approaches**: See which solution style you prefer
4. **Read the docs**: Check Node.js path module documentation for more details

## Running Solutions

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

## Next Steps

After reviewing these solutions:
1. Make sure you understand each concept
2. Try creating your own variations
3. Move on to Level 2 exercises
4. Apply these patterns in real projects

---

Good job completing Level 1! You now have a solid foundation in path manipulation.
