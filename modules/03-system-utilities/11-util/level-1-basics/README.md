# Util - Level 1: Basics

## 🎯 Start Here: Conceptual Understanding First!

**Before diving into code examples**, read these guides to build a solid foundation. Understanding the concepts will make the examples much clearer and help you avoid common mistakes.

### 📖 Essential Guides (50 minutes total)

1. **[Understanding util.promisify()](guides/01-promisify-basics.md)** ⭐ MOST IMPORTANT
   - **Time**: 20 minutes
   - **Why**: This is the most commonly used util function
   - **What you'll learn**: How to modernize callback-based code, when to use promisify, common patterns

2. **[Object Inspection with util.inspect()](guides/02-inspect-basics.md)**
   - **Time**: 15 minutes
   - **What you'll learn**: How to debug complex objects, inspection options, circular reference handling

3. **[String Formatting with util.format()](guides/03-format-basics.md)**
   - **Time**: 15 minutes
   - **What you'll learn**: Printf-style formatting, placeholders, building log messages

### Why Read Guides First?

Without understanding the concepts:
- ❌ Code examples will feel like magic
- ❌ You'll copy code without understanding why it works
- ❌ You'll make mistakes with promisify conventions
- ❌ You won't know when to use which tool

With conceptual understanding:
- ✅ Examples make perfect sense
- ✅ You understand your implementation choices
- ✅ You avoid common pitfalls
- ✅ You're ready for technical interviews
- ✅ You can explain concepts to others

---

## Learning Objectives

By the end of Level 1, you will be able to:

- ✅ Convert callback-based functions to promises using util.promisify()
- ✅ Inspect and debug complex JavaScript objects effectively
- ✅ Format strings using printf-style placeholders
- ✅ Perform basic type checking with util.types
- ✅ Encode and decode text using TextEncoder/TextDecoder
- ✅ Understand when and why to use util functions
- ✅ Handle common edge cases in promise conversion

---

## Topics Covered

### 1. Promise Conversion
- Converting callbacks to promises with util.promisify()
- Understanding Node.js callback conventions
- Error handling in promisified functions
- When promisify works and when it doesn't

### 2. Object Inspection
- Using util.inspect() for debugging
- Controlling inspection depth and formatting
- Handling circular references
- Customizing output with options

### 3. String Formatting
- Printf-style string formatting with util.format()
- Different placeholder types (%s, %d, %j, %o)
- Building log messages and output
- Formatting objects and arrays

### 4. Type Checking
- Using util.types for reliable type checking
- Checking for common types (Date, RegExp, Promise)
- Differences from typeof and instanceof
- When to use util.types vs other methods

### 5. Text Encoding
- Converting strings to bytes with TextEncoder
- Converting bytes to strings with TextDecoder
- Understanding UTF-8 encoding
- Working with Uint8Array

---

## Prerequisites

- Basic JavaScript knowledge (functions, objects, arrays)
- Understanding of callbacks and promises
- Familiarity with async/await syntax
- Node.js installed (v14+)

---

## ⏱️ Time Required

- **With Guides** (Recommended): 2.5-3 hours
  - Guides: 50 minutes
  - Examples: 45 minutes
  - Exercises: 45-60 minutes
  - Review: 20 minutes

- **Without Guides** (Fast Track): 1.5-2 hours
  - Examples: 30 minutes
  - Exercises: 45-60 minutes
  - Review: 15 minutes

---

## 📚 Recommended Learning Flow

```
Step 1: Read Guides (50 min)
   ├─ Understanding util.promisify() (20 min) ⭐
   ├─ Object Inspection (15 min)
   └─ String Formatting (15 min)
        ↓
Step 2: Study Examples (45 min)
   ├─ Read through each example
   ├─ Run the code yourself
   ├─ Modify and experiment
   └─ Understand every line
        ↓
Step 3: Complete Exercises (45 min)
   ├─ Attempt without looking at solutions
   ├─ Stuck? Re-read relevant guide
   ├─ Still stuck? Check solution
   └─ Understand why the solution works
        ↓
Step 4: Verify Understanding
   ├─ Can you explain concepts to someone?
   ├─ Do you understand your code choices?
   └─ Ready for Level 2? ✓
```

---

## Examples Overview

### [01-promisify-basics.js](examples/01-promisify-basics.js)
Convert a simple callback function to a promise. Learn the basic promisify pattern.

### [02-promisify-fs.js](examples/02-promisify-fs.js)
Promisify Node.js fs module functions. Real-world file system operations with promises.

### [03-inspect-objects.js](examples/03-inspect-objects.js)
Inspect complex objects with nested structures. Control depth and formatting.

### [04-inspect-circular.js](examples/04-inspect-circular.js)
Handle circular references safely. See how util.inspect prevents infinite loops.

### [05-format-strings.js](examples/05-format-strings.js)
Format strings with different placeholder types. Build log messages.

### [06-types-checking.js](examples/06-types-checking.js)
Check types reliably with util.types. Compare with typeof and instanceof.

### [07-text-encoding.js](examples/07-text-encoding.js)
Encode and decode text. Work with binary data representation.

### [08-practical-logging.js](examples/08-practical-logging.js)
Build a practical logging function. Combine multiple util functions.

---

## Exercises Overview

### [exercise-1.js](exercises/exercise-1.js) - ⭐ Easy
Promisify a custom callback function. Practice basic promise conversion.

### [exercise-2.js](exercises/exercise-2.js) - ⭐ Easy
Use util.inspect() to debug an object. Practice inspection options.

### [exercise-3.js](exercises/exercise-3.js) - ⭐⭐ Intermediate
Create a formatted logger. Combine format() and inspection.

### [exercise-4.js](exercises/exercise-4.js) - ⭐⭐ Intermediate
Build a type validator. Use util.types for validation.

### [exercise-5.js](exercises/exercise-5.js) - ⭐⭐⭐ Hard
Migrate a callback-based module to promises. Real-world refactoring scenario.

---

## Getting Started

### Step 1: Review the Guides
Start by reading the three essential guides in the `guides/` directory. These provide the conceptual foundation you need.

### Step 2: Study the Code
Navigate to the `examples/` directory and work through each example:

```bash
cd examples
node 01-promisify-basics.js
```

Read the code, run it, and experiment with modifications.

### Step 3: Complete Exercises
Move to the `exercises/` directory and attempt each exercise:

```bash
cd exercises
node exercise-1.js
```

Try to solve them without looking at solutions first.

### Step 4: Check Solutions
After attempting exercises, review the solutions in `solutions/`:

```bash
cd solutions
node exercise-1-solution.js
```

Compare your approach with the provided solutions.

---

## Key Concepts

### Concept 1: Promise Conversion

```javascript
// ❌ WRONG - Not all functions can be promisified
function wrongCallback(callback) {
  callback(result, error); // Wrong order!
}
const wrong = util.promisify(wrongCallback); // Won't work correctly

// ✅ CORRECT - Node.js callback convention
function correctCallback(arg, callback) {
  if (error) {
    callback(error); // Error first
  } else {
    callback(null, result); // Then result
  }
}
const correct = util.promisify(correctCallback); // Works correctly
```

### Concept 2: Object Inspection Depth

```javascript
// ❌ WRONG - Default depth truncates nested objects
const deep = { a: { b: { c: { d: 'hidden' } } } };
console.log(deep);
// { a: { b: { c: [Object] } } } - 'd' is hidden!

// ✅ CORRECT - Specify depth for deep objects
console.log(util.inspect(deep, { depth: null }));
// { a: { b: { c: { d: 'hidden' } } } } - Everything shown
```

### Concept 3: Format Placeholders

```javascript
// ❌ WRONG - Using wrong placeholder types
util.format('Count: %s', 42); // Works but not semantic
util.format('Name: %d', 'Alice'); // Shows NaN!

// ✅ CORRECT - Use appropriate placeholders
util.format('Count: %d', 42);      // %d for numbers
util.format('Name: %s', 'Alice');  // %s for strings
util.format('Data: %j', obj);      // %j for JSON
util.format('Inspect: %o', obj);   // %o for object inspection
```

---

## Best Practices

### ✅ DO:

- Read the guides before attempting exercises
- Always specify encoding when using TextEncoder/TextDecoder
- Use util.inspect() for debugging complex objects
- Check callback conventions before using promisify
- Use appropriate format placeholders for their types
- Test promisified functions with both success and error cases

### ❌ DON'T:

- Use promisify on functions that don't follow Node.js conventions
- Forget to handle errors in promisified functions
- Use console.log() for deep objects (use util.inspect instead)
- Mix up format placeholder types
- Assume all async functions can be promisified
- Ignore circular reference warnings

---

## Common Errors

### Error 1: Promisify Convention Mismatch

```javascript
// Error: Function doesn't follow callback(error, result) pattern
function customAsync(callback) {
  callback(result); // Missing error parameter!
}

// Solution: Use custom promisify symbol
customAsync[util.promisify.custom] = function() {
  return new Promise((resolve) => {
    customAsync(resolve);
  });
};
```

### Error 2: Inspection Depth Too Shallow

```javascript
// Problem: Can't see nested values
console.log(deepObject); // Shows [Object] for deep values

// Solution: Increase depth or use null for unlimited
console.log(util.inspect(deepObject, { depth: 5 }));
console.log(util.inspect(deepObject, { depth: null }));
```

---

## Quick Reference

```javascript
const util = require('util');
const fs = require('fs');

// Promisify
const readFile = util.promisify(fs.readFile);
await readFile('file.txt', 'utf8');

// Inspect
util.inspect(obj, { depth: null, colors: true });

// Format
util.format('Hello %s, count: %d', name, count);

// Type checking
util.types.isDate(new Date())        // true
util.types.isPromise(Promise.resolve()) // true
util.types.isRegExp(/test/)          // true

// Text encoding
const encoder = new util.TextEncoder();
const bytes = encoder.encode('text');
const decoder = new util.TextDecoder();
const text = decoder.decode(bytes);
```

---

## Practice Tips

1. **Type everything yourself** - Don't copy-paste code
2. **Break things intentionally** - See what errors occur
3. **Read error messages carefully** - They teach you
4. **Experiment with options** - Try different inspect() and format() options
5. **Use Node.js REPL** - Test small snippets quickly
6. **Compare outputs** - See the difference between console.log and util.inspect
7. **Build mini tools** - Create small utilities using what you've learned

---

## ✅ Testing Your Knowledge

Before moving to Level 2, you should be able to answer:

**Conceptual Questions:**

1. What callback convention must functions follow for util.promisify() to work? ([Guide](guides/01-promisify-basics.md))
2. Why is util.inspect() better than console.log() for complex objects? ([Guide](guides/02-inspect-basics.md))
3. What's the difference between %s, %d, %j, and %o placeholders? ([Guide](guides/03-format-basics.md))
4. When should you use util.types over typeof or instanceof?

**Practical Questions:**

1. Can you convert any callback function to a promise? (See [Example 1](examples/01-promisify-basics.js))
2. How do you inspect an object with unlimited depth? (See [Example 3](examples/03-inspect-objects.js))
3. How do you format a log message with multiple values? (See [Example 5](examples/05-format-strings.js))
4. How do you check if a value is a Promise? (See [Example 6](examples/06-types-checking.js))

---

## Self-Assessment Checklist

Before moving to Level 2, you should be comfortable with:

- [ ] Understanding what util.promisify() does
- [ ] Converting simple callback functions to promises
- [ ] Using util.inspect() to debug objects
- [ ] Formatting strings with util.format()
- [ ] Checking types with util.types
- [ ] Encoding/decoding text
- [ ] Handling errors in promisified functions
- [ ] Knowing when promisify won't work

---

## Exercises Checklist

- [ ] Exercise 1: Promisify Custom Function (⭐ Easy)
- [ ] Exercise 2: Object Inspection (⭐ Easy)
- [ ] Exercise 3: Formatted Logger (⭐⭐ Intermediate)
- [ ] Exercise 4: Type Validator (⭐⭐ Intermediate)
- [ ] Exercise 5: Module Migration (⭐⭐⭐ Hard)

---

## Mini Project: Utility Logger

After completing all exercises, try building this mini project:

**Build a comprehensive logging utility that:**
- Formats messages with timestamps
- Inspects objects intelligently
- Supports different log levels (info, warn, error)
- Handles errors gracefully
- Provides clean, readable output

This project will help you integrate multiple util functions into a cohesive tool.

---

## Next Steps

Once you've completed all exercises and feel comfortable with the basics:

1. Review any challenging concepts
2. Try the mini project
3. Experiment with variations
4. Move to **[Level 2: Intermediate](../level-2-intermediate/README.md)**

Level 2 will teach you:
- util.callbackify() for reverse conversion
- util.deprecate() for API deprecation
- Advanced inspection techniques
- util.debuglog() for conditional logging
- More complex real-world scenarios

---

## Need Help?

- Review the [guides](./guides/) for conceptual explanations
- Check [CONCEPTS.md](../CONCEPTS.md) for foundational understanding
- Study the [examples](./examples/) for practical demonstrations
- Compare your solutions with provided [solutions](./solutions/)

---

**Ready to start?** Begin with [Guide 1: Understanding util.promisify()](guides/01-promisify-basics.md)!
