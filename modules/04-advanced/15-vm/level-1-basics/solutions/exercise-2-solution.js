/**
 * Exercise 2 Solution: Context Manager
 */

const vm = require('vm');

class ContextManager {
  constructor() {
    this.contexts = new Map();
  }

  createContext(name, initialData = {}) {
    const context = { ...initialData };
    vm.createContext(context);
    this.contexts.set(name, context);
    return context;
  }

  execute(name, code) {
    if (!this.contexts.has(name)) {
      throw new Error(`Context '${name}' does not exist`);
    }

    const context = this.contexts.get(name);
    try {
      return vm.runInContext(code, context, { timeout: 100 });
    } catch (err) {
      throw new Error(`Execution failed: ${err.message}`);
    }
  }

  getState(name) {
    if (!this.contexts.has(name)) {
      return null;
    }
    return { ...this.contexts.get(name) };
  }

  deleteContext(name) {
    return this.contexts.delete(name);
  }
}

// Test
const manager = new ContextManager();

console.log('Context Manager Solution:\n');

manager.createContext('user1', { name: 'Alice', score: 0 });
manager.createContext('user2', { name: 'Bob', score: 0 });

manager.execute('user1', 'score += 10');
manager.execute('user2', 'score += 20');
manager.execute('user1', 'score += 5');

console.log('User 1 state:', manager.getState('user1'));
console.log('User 2 state:', manager.getState('user2'));
