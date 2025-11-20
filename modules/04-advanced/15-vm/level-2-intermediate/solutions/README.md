# Level 2: Intermediate Solutions

This directory contains complete solutions for all Level 2 exercises. Each solution demonstrates best practices and production-ready patterns for VM usage.

## Solutions Overview

### [Exercise 1 Solution: Template Renderer](./exercise-1-solution.js)
Complete implementation of a template engine with:
- Variable substitution with `{{ variable }}` syntax
- Expression evaluation
- Conditionals and loops
- Filter support
- Template caching
- Error handling

**Key Concepts**:
- Tokenization and parsing
- Code generation from templates
- Script caching for performance
- Safe expression evaluation

### [Exercise 2 Solution: Plugin Manager](./exercise-2-solution.js)
Full-featured plugin system with:
- Plugin isolation in VM contexts
- Lifecycle management (init, run, cleanup)
- Dependency management
- Event-based communication
- Plugin API (log, emit, storage)
- State tracking

**Key Concepts**:
- VM context isolation
- Plugin architecture patterns
- Dependency resolution
- Event-driven design

### [Exercise 3 Solution: Context Pool](./exercise-3-solution.js)
High-performance context pooling with:
- Pre-warmed context pool
- Acquire/release pattern
- Proper context cleanup
- LRU management
- Performance statistics
- Memory efficiency

**Key Concepts**:
- Object pooling pattern
- Resource management
- Performance optimization
- Memory management

### [Exercise 4 Solution: Expression Compiler](./exercise-4-solution.js)
Expression compilation and evaluation with:
- LRU cache for compiled expressions
- Support for various operators
- Safe built-ins
- Expression validation
- Custom functions
- Statistics tracking

**Key Concepts**:
- Expression compilation
- LRU caching
- Input validation
- Performance metrics

### [Exercise 5 Solution: Safe Module Loader](./exercise-5-solution.js)
Secure module loading system with:
- CommonJS module support
- Module caching
- Circular dependency handling
- Whitelist/blacklist
- Path resolution
- JSON module support

**Key Concepts**:
- Module resolution
- Circular dependency handling
- Security patterns
- Module caching

## Using the Solutions

### When to Look at Solutions

**Do look at solutions when:**
- ✅ You've completed the exercise
- ✅ You're stuck after 30+ minutes
- ✅ You want to learn alternative approaches
- ✅ You're comparing your implementation

**Don't look at solutions:**
- ❌ Before attempting the exercise
- ❌ At the first sign of difficulty
- ❌ Instead of reading the guides

### How to Use Solutions

1. **Complete Your Implementation First**
   - Try to solve the exercise yourself
   - Test thoroughly
   - Debug any issues

2. **Compare Implementations**
   - Run both your code and the solution
   - Compare approaches
   - Note differences

3. **Understand the Why**
   - Read comments explaining decisions
   - Understand trade-offs
   - Learn patterns and techniques

4. **Improve Your Code**
   - Apply learnings to your implementation
   - Try different approaches
   - Experiment with variations

## Running Solutions

```bash
# Run a specific solution
node exercise-1-solution.js

# Run all solutions
for f in exercise-*-solution.js; do
  echo "Running $f..."
  node "$f"
  echo "---"
done
```

## Learning from Solutions

### What to Look For

1. **Code Structure**
   - How is the class organized?
   - What helper methods are used?
   - How are errors handled?

2. **Design Patterns**
   - Which patterns are applied?
   - Why were they chosen?
   - What are the alternatives?

3. **Performance**
   - What optimizations are used?
   - Why are they effective?
   - What are the trade-offs?

4. **Edge Cases**
   - How are edge cases handled?
   - What validation is performed?
   - How are errors reported?

5. **Best Practices**
   - What VM best practices are followed?
   - How is security addressed?
   - What makes it production-ready?

## Common Patterns in Solutions

### Pattern 1: LRU Cache
```javascript
class LRUCache {
  constructor(maxSize) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    // Move to end (most recent)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}
```

### Pattern 2: Context Cleanup
```javascript
function cleanContext(context) {
  // Remove all properties
  for (const key in context) {
    delete context[key];
  }
}
```

### Pattern 3: Safe Execution
```javascript
function safeExecute(code, context, timeout = 1000) {
  try {
    return vm.runInContext(code, context, {
      timeout,
      displayErrors: true
    });
  } catch (err) {
    if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
      throw new Error('Execution timeout');
    }
    throw err;
  }
}
```

### Pattern 4: Tokenization
```javascript
function tokenize(template) {
  const tokens = [];
  const patterns = [
    { regex: /^\{\{(.+?)\}\}/, type: 'variable' },
    { regex: /^\{%\s*if\s+(.+?)\s*%\}/, type: 'if' }
  ];

  let pos = 0;
  while (pos < template.length) {
    // Try each pattern...
  }

  return tokens;
}
```

## Improvement Ideas

After studying the solutions, try these improvements:

1. **Add Features**
   - Template inheritance
   - Plugin hot-reloading
   - Advanced caching strategies
   - More built-in functions

2. **Enhance Performance**
   - Profile and optimize hotspots
   - Implement lazy loading
   - Add parallel execution
   - Use worker threads

3. **Improve Security**
   - Add sandboxing levels
   - Implement resource quotas
   - Add input sanitization
   - Enhanced validation

4. **Better Error Handling**
   - More descriptive errors
   - Error recovery mechanisms
   - Debugging support
   - Stack trace enhancement

## Next Steps

After reviewing solutions:

1. ✅ **Refine Your Implementation**
   - Apply learnings
   - Improve code quality
   - Add features

2. ✅ **Build Something Real**
   - Combine concepts
   - Create a project
   - Share your work

3. ✅ **Move Forward**
   - Start Level 3: Advanced
   - Tackle harder challenges
   - Keep learning

## Additional Resources

- Review the [examples](../examples/) for more patterns
- Read the [guides](../guides/) for deeper understanding
- Check main README for practice projects

Happy learning! 🎉
