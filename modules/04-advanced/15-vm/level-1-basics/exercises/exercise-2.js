/**
 * Exercise 2: Context Manager
 *
 * OBJECTIVE:
 * Build a context manager that can create, store, and reuse
 * contexts for different users or sessions.
 *
 * REQUIREMENTS:
 * 1. Create and store contexts by name
 * 2. Execute code in named contexts
 * 3. Retrieve context state
 * 4. Delete contexts when done
 *
 * LEARNING GOALS:
 * - Use vm.createContext()
 * - Manage multiple contexts
 * - Maintain state across executions
 */

const vm = require('vm');

/**
 * TODO 1: Implement ContextManager class
 *
 * Methods needed:
 * - createContext(name, initialData)
 * - execute(name, code)
 * - getState(name)
 * - deleteContext(name)
 */
class ContextManager {
  constructor() {
    // Your code here
  }

  createContext(name, initialData = {}) {
    // Your code here
  }

  execute(name, code) {
    // Your code here
  }

  getState(name) {
    // Your code here
  }

  deleteContext(name) {
    // Your code here
  }
}

// Test your implementation
const manager = new ContextManager();

console.log('Testing Context Manager:\n');

manager.createContext('user1', { name: 'Alice', score: 0 });
manager.createContext('user2', { name: 'Bob', score: 0 });

manager.execute('user1', 'score += 10');
manager.execute('user2', 'score += 20');
manager.execute('user1', 'score += 5');

console.log('User 1 state:', manager.getState('user1'));
console.log('User 2 state:', manager.getState('user2'));
