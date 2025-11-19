# Level 2: Intermediate Examples

This directory contains 8 comprehensive examples demonstrating intermediate VM concepts including advanced Script class usage, context manipulation, resource control, module loading, template engines, and plugin systems.

## Examples Overview

### [01-script-reuse.js](./01-script-reuse.js)
**Concept**: Advanced Script class reuse patterns
**Topics**: Script compilation, caching strategies, performance optimization
**Lines**: ~300

Demonstrates advanced patterns for reusing Script objects including:
- Script compilation and caching
- LRU cache implementation
- Performance benchmarking
- Memory-efficient script management

### [02-context-inspection.js](./02-context-inspection.js)
**Concept**: Inspecting and manipulating contexts
**Topics**: Context properties, dynamic modification, cloning
**Lines**: ~280

Shows how to programmatically inspect and manipulate VM contexts:
- Reading context properties
- Dynamic property modification
- Context cloning strategies
- Property descriptor manipulation

### [03-resource-limits.js](./03-resource-limits.js)
**Concept**: Memory and CPU limits
**Topics**: Resource monitoring, timeout control, limit enforcement
**Lines**: ~320

Implements various strategies for controlling resource usage:
- Timeout enforcement
- Memory usage monitoring
- CPU time tracking
- Resource limit patterns

### [04-module-loading.js](./04-module-loading.js)
**Concept**: Custom module loading in contexts
**Topics**: Module resolution, custom require(), caching
**Lines**: ~350

Creates a custom module loading system for VM contexts:
- Custom require() implementation
- Module path resolution
- Module caching
- Circular dependency handling

### [05-template-engine.js](./05-template-engine.js)
**Concept**: Building a template engine
**Topics**: Template compilation, expression evaluation, security
**Lines**: ~380

Builds a complete template engine using VM:
- Template parsing and compilation
- Variable substitution
- Expression evaluation
- Helper functions and filters

### [06-plugin-system.js](./06-plugin-system.js)
**Concept**: Plugin architecture with VM
**Topics**: Plugin isolation, lifecycle management, communication
**Lines**: ~400

Designs a plugin system with safe code execution:
- Plugin loading and isolation
- Plugin lifecycle (init, run, cleanup)
- Inter-plugin communication
- Plugin API design

### [07-context-freezing.js](./07-context-freezing.js)
**Concept**: Freezing and sealing contexts
**Topics**: Immutability, security, Object.freeze()
**Lines**: ~260

Demonstrates techniques for creating immutable contexts:
- Object.freeze() and Object.seal()
- Deep freezing strategies
- Security implications
- Performance considerations

### [08-performance-patterns.js](./08-performance-patterns.js)
**Concept**: Optimization patterns
**Topics**: Context pooling, script caching, profiling
**Lines**: ~340

Shows performance optimization techniques:
- Context pooling implementation
- Script cache optimization
- Performance profiling
- Benchmark comparisons

## Running the Examples

You can run any example directly with Node.js:

```bash
# Run a specific example
node 01-script-reuse.js
node 02-context-inspection.js

# Run all examples
for f in *.js; do
  echo "Running $f..."
  node "$f"
  echo "---"
done
```

## Learning Path

For the best learning experience:

1. **Start with 01-script-reuse.js** - Understand script compilation and caching
2. **Move to 02-context-inspection.js** - Learn context manipulation
3. **Study 03-resource-limits.js** - Understand resource control
4. **Explore 04-module-loading.js** - See custom module systems
5. **Examine 05-template-engine.js** - Build practical applications
6. **Review 06-plugin-system.js** - Design extensible systems
7. **Check 07-context-freezing.js** - Apply security patterns
8. **Finish with 08-performance-patterns.js** - Optimize your code

## Modifying Examples

Each example is self-contained and well-commented. Feel free to:

- Modify parameters and see how behavior changes
- Add console.log() statements to trace execution
- Experiment with different input values
- Combine patterns from multiple examples
- Build upon examples for your own projects

## Key Takeaways

After working through these examples, you should understand:

- ✅ How to efficiently cache and reuse compiled scripts
- ✅ How to inspect and manipulate VM contexts
- ✅ How to implement resource limits and monitoring
- ✅ How to create custom module loading systems
- ✅ How to build template engines with VM
- ✅ How to design safe plugin architectures
- ✅ How to secure contexts with freezing techniques
- ✅ How to optimize VM performance

## Next Steps

After completing these examples:

1. Work through the [exercises](../exercises/) to apply what you've learned
2. Read the [guides](../guides/) for deeper conceptual understanding
3. Review the [solutions](../solutions/) for complete implementations
4. Try building one of the practice projects from the main README
