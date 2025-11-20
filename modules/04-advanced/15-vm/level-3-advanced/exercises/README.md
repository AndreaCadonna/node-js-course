# Level 3 Advanced - Exercises

This directory contains 5 challenging exercises to test your advanced VM security and architecture knowledge.

## Exercises Overview

### [Exercise 1: Hardened Sandbox](./exercise-1.js) ⭐⭐⭐
**Build a production-ready hardened sandbox**

Create a complete security hardened sandbox with multi-layer defense.

**Time**: 60-90 minutes
**Difficulty**: Hard

**Topics Covered:**
- Null prototype contexts
- Property blacklisting
- Multi-layer proxy protection
- Security audit logging
- Memory limit enforcement
- Execution timeout
- Statistics tracking

**Skills You'll Practice:**
- Defense-in-depth security
- Proxy handler implementation
- Resource monitoring
- Event logging

---

### [Exercise 2: Production REPL](./exercise-2.js) ⭐⭐⭐⭐
**Create a production-grade REPL system**

Build a complete REPL with history, autocomplete, and security features.

**Time**: 90-120 minutes
**Difficulty**: Very Hard

**Topics Covered:**
- Multi-line input detection
- Command history
- Auto-completion
- Built-in commands
- Session persistence
- Security sandboxing
- State management

**Skills You'll Practice:**
- Input parsing
- Syntax completion detection
- History management
- File I/O for sessions
- Command routing

---

### [Exercise 3: Resource Monitor](./exercise-3.js) ⭐⭐⭐
**Implement a comprehensive resource monitoring system**

Build a system to track CPU, memory, and enforce quotas in real-time.

**Time**: 60-75 minutes
**Difficulty**: Hard

**Topics Covered:**
- CPU time tracking
- Memory monitoring
- Resource quotas
- Real-time sampling
- Performance profiling
- Violation detection

**Skills You'll Practice:**
- V8 heap statistics
- Process monitoring
- Performance measurement
- Statistical analysis
- Quota enforcement

---

### [Exercise 4: Multi-Tenant Executor](./exercise-4.js) ⭐⭐⭐⭐
**Build a multi-tenant code execution platform**

Create a complete platform for running code from multiple tenants safely.

**Time**: 90-120 minutes
**Difficulty**: Very Hard

**Topics Covered:**
- Tenant isolation
- Resource quotas
- Fair scheduling
- Usage tracking
- Billing calculation
- Platform management

**Skills You'll Practice:**
- Multi-tenant architecture
- Priority queues
- Resource allocation
- Usage metering
- Cost calculation

---

### [Exercise 5: Secure Plugin Runtime](./exercise-5.js) ⭐⭐⭐
**Create a secure plugin runtime environment**

Build a system to load and execute untrusted plugins with isolation.

**Time**: 75-90 minutes
**Difficulty**: Hard

**Topics Covered:**
- Plugin isolation
- Controlled API exposure
- Lifecycle management
- Inter-plugin communication
- Resource limits
- Event systems

**Skills You'll Practice:**
- Plugin architecture
- API design
- Lifecycle hooks
- Resource management
- Event-driven programming

---

## How to Complete Exercises

### Step 1: Read the Exercise
- Understand the requirements
- Note the methods you need to implement
- Review the test cases

### Step 2: Plan Your Implementation
- Sketch the class structure
- Identify key data structures
- Plan method interactions

### Step 3: Implement Incrementally
- Start with basic structure
- Implement one method at a time
- Test as you go

### Step 4: Run Tests
- Uncomment the test function
- Run `node exercise-N.js`
- Fix any failing tests

### Step 5: Compare with Solution
- After completing, review the solution
- Compare different approaches
- Learn from alternative patterns

---

## Recommended Order

### For Complete Learning:
1. **Exercise 1** (Hardened Sandbox)
   - Foundation for all security concepts

2. **Exercise 3** (Resource Monitor)
   - Essential for resource management

3. **Exercise 5** (Plugin Runtime)
   - Combines security and architecture

4. **Exercise 2** (Production REPL)
   - Complex state management

5. **Exercise 4** (Multi-Tenant Executor)
   - Most comprehensive challenge

### For Time-Constrained Learning:
1. **Exercise 1** (Hardened Sandbox) - Essential security
2. **Exercise 3** (Resource Monitor) - Essential monitoring
3. **Exercise 4** (Multi-Tenant Executor) - Real-world application

---

## Tips for Success

### General Tips
- ✅ Read all requirements carefully
- ✅ Start simple, then add complexity
- ✅ Test each method individually
- ✅ Use console.log for debugging
- ✅ Refer to examples for patterns
- ✅ Don't peek at solutions too early!

### Security Tips
- ✅ Always use null prototypes
- ✅ Whitelist instead of blacklist
- ✅ Test all escape vectors
- ✅ Log security events
- ✅ Validate all inputs

### Performance Tips
- ✅ Monitor memory continuously
- ✅ Set reasonable timeouts
- ✅ Use resource pooling
- ✅ Cleanup after execution
- ✅ Profile when needed

### Architecture Tips
- ✅ Separate concerns clearly
- ✅ Use events for decoupling
- ✅ Plan data structures first
- ✅ Handle errors gracefully
- ✅ Document complex logic

---

## Common Challenges

### Challenge 1: Null Prototype Contexts
**Problem**: Properties are still accessible
**Solution**: Use `Object.create(null)` and avoid prototype chain

### Challenge 2: Proxy Protection
**Problem**: Proxy is bypassed
**Solution**: Apply proxy to VM context, not just sandbox object

### Challenge 3: Memory Leaks
**Problem**: Context accumulates data
**Solution**: Periodically recreate context or clear properties

### Challenge 4: Multi-line Detection
**Problem**: Can't detect incomplete input
**Solution**: Try parsing with `new vm.Script()`, catch "Unexpected end"

### Challenge 5: Fair Scheduling
**Problem**: Priority queue implementation
**Solution**: Sort by weighted score (priority × wait time)

---

## Testing Your Solutions

Each exercise includes test cases. To run:

```bash
# Edit the exercise file and implement the class
nano exercise-1.js

# Uncomment the test call at the bottom:
# runTests();

# Run the tests
node exercise-1.js
```

Expected output:
```
Testing Hardened Sandbox

============================================================

✓ Test 1: Safe Operations
  Result: 20

✓ Test 2: Constructor Access Block
  Blocked: Access denied: constructor

...

All tests completed!
```

---

## Getting Help

If you're stuck:

1. **Review the Examples**
   - Look at similar examples
   - See complete implementations

2. **Read the Guides**
   - Understand concepts deeply
   - Learn patterns and best practices

3. **Check Test Cases**
   - Tests show expected behavior
   - Error messages give clues

4. **Break It Down**
   - Implement one method at a time
   - Test each piece independently

5. **Compare with Solution**
   - Only after serious attempt!
   - Learn alternative approaches

---

## Evaluation Criteria

Your solutions will be evaluated on:

### Correctness (40%)
- ✅ All tests pass
- ✅ Edge cases handled
- ✅ No bugs or errors

### Security (25%)
- ✅ All escape vectors blocked
- ✅ Proper input validation
- ✅ Resource limits enforced

### Code Quality (20%)
- ✅ Clean, readable code
- ✅ Proper error handling
- ✅ Good naming conventions

### Performance (15%)
- ✅ Efficient algorithms
- ✅ No memory leaks
- ✅ Proper resource cleanup

---

## Next Steps

After completing exercises:

1. ✅ Review all solutions
2. ✅ Compare different approaches
3. ✅ Study guides for deeper understanding
4. ✅ Try the practice projects
5. ✅ Build your own VM-based project

---

## Additional Practice

Want more practice? Try these extensions:

### Exercise 1 Extensions:
- Add whitelist/blacklist configuration
- Implement rate limiting
- Add memory snapshot diffing

### Exercise 2 Extensions:
- Add syntax highlighting
- Implement code completion
- Add debugger integration

### Exercise 3 Extensions:
- Add CPU profiling
- Implement heap analysis
- Add resource prediction

### Exercise 4 Extensions:
- Add tenant migration
- Implement auto-scaling
- Add load balancing

### Exercise 5 Extensions:
- Add plugin dependencies
- Implement hot reloading
- Add plugin marketplace

---

**Ready to start?** Choose an exercise and begin coding! Remember: the goal is to learn, so take your time and understand each concept thoroughly.

Good luck! 🚀
