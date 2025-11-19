# Level 2: Intermediate Exercises

These exercises will help you apply the intermediate VM concepts you've learned. Each exercise builds on the concepts from the examples and guides.

## Exercise Overview

### Exercise 1: Template Renderer
**Difficulty**: ⭐⭐ Medium
**Estimated Time**: 45-60 minutes
**Skills**: Template compilation, expression evaluation, VM security

Build a template renderer that can compile templates with variable substitution and expression evaluation. Should support conditionals, loops, and filters.

### Exercise 2: Plugin Manager
**Difficulty**: ⭐⭐⭐ Hard
**Estimated Time**: 60-90 minutes
**Skills**: Plugin loading, isolation, communication, lifecycle

Create a complete plugin manager that can load, isolate, and manage multiple plugins with safe execution, lifecycle management, and inter-plugin communication.

### Exercise 3: Context Pool
**Difficulty**: ⭐⭐ Medium
**Estimated Time**: 45-60 minutes
**Skills**: Resource management, pooling, performance optimization

Implement a context pool that reuses VM contexts for better performance in high-throughput scenarios with proper cleanup and statistics.

### Exercise 4: Expression Compiler
**Difficulty**: ⭐⭐ Medium
**Estimated Time**: 45-60 minutes
**Skills**: Script compilation, caching, evaluation

Build an expression compiler that can compile and cache expressions for fast repeated evaluation with support for various data types and operators.

### Exercise 5: Safe Module Loader
**Difficulty**: ⭐⭐⭐ Hard
**Estimated Time**: 60-90 minutes
**Skills**: Module loading, security, custom require()

Create a safe module loader with whitelist/blacklist support, custom module resolution, and proper caching with circular dependency handling.

## Getting Started

1. **Read the Exercise File**: Each exercise file contains detailed requirements and test cases
2. **Review Related Examples**: Look at the examples that cover similar concepts
3. **Consult the Guides**: The guides provide deeper explanations of the concepts
4. **Write Your Solution**: Implement the required functionality
5. **Test Thoroughly**: Make sure all test cases pass
6. **Compare with Solution**: After completing, check the solution file

## Exercise Files

- [exercise-1.js](./exercise-1.js) - Template Renderer
- [exercise-2.js](./exercise-2.js) - Plugin Manager
- [exercise-3.js](./exercise-3.js) - Context Pool
- [exercise-4.js](./exercise-4.js) - Expression Compiler
- [exercise-5.js](./exercise-5.js) - Safe Module Loader

## Running Exercises

```bash
# Run an exercise
node exercise-1.js

# Run all exercises
for f in exercise-*.js; do
  echo "Running $f..."
  node "$f"
  echo "---"
done
```

## Tips for Success

1. **Start Simple**: Get basic functionality working before adding advanced features
2. **Test Incrementally**: Test each feature as you add it
3. **Handle Errors**: Implement proper error handling
4. **Read Examples**: The examples show similar patterns you can use
5. **Don't Rush**: Take time to understand the problem before coding
6. **Ask Why**: Understand why certain approaches work better
7. **Optimize Later**: Get it working correctly first, then optimize

## Common Challenges

### Challenge 1: Context Isolation
**Problem**: Data leaking between context executions
**Solution**: Properly clear context properties after each use

### Challenge 2: Memory Leaks
**Problem**: Memory growing over time with pooling
**Solution**: Ensure contexts are properly cleaned and limits are enforced

### Challenge 3: Circular Dependencies
**Problem**: Module loader getting stuck with circular requires
**Solution**: Cache modules immediately before loading, check for cycles

### Challenge 4: Performance
**Problem**: Slow execution with many operations
**Solution**: Use caching for scripts and pooling for contexts

### Challenge 5: Security
**Problem**: Sandboxed code escaping or accessing restricted resources
**Solution**: Freeze built-ins, validate input, use timeouts

## Validation Checklist

Before considering an exercise complete, ensure:

- [ ] All provided test cases pass
- [ ] Error handling is implemented
- [ ] Edge cases are handled
- [ ] Code is well-commented
- [ ] Performance is reasonable
- [ ] Memory usage is controlled
- [ ] Security considerations are addressed

## Next Steps

After completing these exercises:

1. Review the [solutions](../solutions/) to see alternative approaches
2. Try extending the exercises with additional features
3. Combine concepts from multiple exercises
4. Build one of the practice projects from the main README
5. Move on to Level 3: Advanced

## Getting Help

If you're stuck:

1. Review the related examples (listed in each exercise file)
2. Read the corresponding guides
3. Check your logic step by step with console.log()
4. Try a simpler version first
5. Look at the solution for hints (but try hard first!)

Good luck! 🚀
