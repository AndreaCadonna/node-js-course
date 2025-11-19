/**
 * Exercise 4: Safe Sandbox Builder
 *
 * OBJECTIVE:
 * Create a sandbox builder that provides a controlled environment
 * with only specific built-ins and custom functions.
 *
 * REQUIREMENTS:
 * 1. Builder pattern for configuration
 * 2. Allow specific built-ins (Math, Date, JSON)
 * 3. Add custom functions
 * 4. Execute code in built sandbox
 *
 * LEARNING GOALS:
 * - Design builder pattern
 * - Create safe sandboxes
 * - Provide controlled APIs
 */

const vm = require('vm');

/**
 * TODO 1: Implement SafeSandboxBuilder class
 *
 * Methods needed:
 * - allowMath() - Add Math to sandbox
 * - allowDate() - Add Date to sandbox
 * - allowJSON() - Add JSON to sandbox
 * - addFunction(name, fn) - Add custom function
 * - build() - Create context
 * - execute(code) - Run code in sandbox
 */
class SafeSandboxBuilder {
  constructor() {
    // Your code here
  }

  allowMath() {
    // Your code here
    return this;
  }

  allowDate() {
    // Your code here
    return this;
  }

  allowJSON() {
    // Your code here
    return this;
  }

  addFunction(name, fn) {
    // Your code here
    return this;
  }

  build() {
    // Your code here
    return this;
  }

  execute(code) {
    // Your code here
  }
}

// Test your implementation
const sandbox = new SafeSandboxBuilder();

console.log('Testing Safe Sandbox Builder:\n');

sandbox
  .allowMath()
  .addFunction('double', x => x * 2)
  .addFunction('square', x => x * x)
  .build();

console.log('Math.sqrt(16):', sandbox.execute('Math.sqrt(16)'));
console.log('double(5):', sandbox.execute('double(5)'));
console.log('square(4):', sandbox.execute('square(4)'));
