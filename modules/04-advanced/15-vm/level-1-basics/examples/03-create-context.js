/**
 * 03-create-context.js
 * ====================
 * Creating reusable contexts with vm.createContext() and vm.runInContext()
 *
 * Key Concepts:
 * - Creating persistent contexts
 * - Reusing contexts for multiple executions
 * - Performance benefits of context reuse
 * - State management in contexts
 *
 * Run: node 03-create-context.js
 */

const vm = require('vm');

console.log('='.repeat(70));
console.log('VM.CREATECONTEXT() - REUSABLE CONTEXTS');
console.log('='.repeat(70));

// =============================================================================
// 1. BASIC CONTEXT CREATION
// =============================================================================

console.log('\n1. Creating and Using a Context:');
console.log('-'.repeat(70));

// Step 1: Create a sandbox object
const sandbox = {
  x: 10,
  y: 20,
};

console.log('Original sandbox:', sandbox);

// Step 2: Convert it to a context
vm.createContext(sandbox);
console.log('✓ Sandbox converted to context');

// Step 3: Run code in the context
const result1 = vm.runInContext('x + y', sandbox);
console.log('Result of "x + y":', result1);

// Step 4: Run more code in the same context
vm.runInContext('z = x * y', sandbox);
console.log('After "z = x * y":', sandbox);

console.log('✓ Context persists state between executions');

// =============================================================================
// 2. DIFFERENCE FROM RUNINNEWCONTEXT
// =============================================================================

console.log('\n2. createContext() vs runInNewContext():');
console.log('-'.repeat(70));

// runInNewContext - creates new context each time
console.log('Using runInNewContext (creates new context each time):');
const sandbox1 = { count: 0 };
vm.runInNewContext('count++', sandbox1);
console.log('After first execution:', sandbox1.count); // 1
vm.runInNewContext('count++', sandbox1);
console.log('After second execution:', sandbox1.count); // 2

// createContext - reuses same context
console.log('\nUsing createContext + runInContext (reuses context):');
const sandbox2 = { count: 0 };
vm.createContext(sandbox2);
vm.runInContext('count++', sandbox2);
console.log('After first execution:', sandbox2.count); // 1
vm.runInContext('count++', sandbox2);
console.log('After second execution:', sandbox2.count); // 2

console.log('✓ Both work, but runInContext is more efficient for reuse');

// =============================================================================
// 3. CONTEXT STATE MANAGEMENT
// =============================================================================

console.log('\n3. Managing State Across Executions:');
console.log('-'.repeat(70));

const calculator = {
  console: console,
  result: 0,
};

vm.createContext(calculator);

// Series of calculations
vm.runInContext('result = 10', calculator);
console.log('Step 1 - result = 10:', calculator.result);

vm.runInContext('result = result + 5', calculator);
console.log('Step 2 - result = result + 5:', calculator.result);

vm.runInContext('result = result * 2', calculator);
console.log('Step 3 - result = result * 2:', calculator.result);

vm.runInContext('console.log("Final result:", result)', calculator);

console.log('✓ State persists across all executions');

// =============================================================================
// 4. MULTIPLE INDEPENDENT CONTEXTS
// =============================================================================

console.log('\n4. Multiple Independent Contexts:');
console.log('-'.repeat(70));

// Create two separate contexts
const contextA = { name: 'Context A', value: 100 };
const contextB = { name: 'Context B', value: 200 };

vm.createContext(contextA);
vm.createContext(contextB);

// Run code in both contexts
vm.runInContext('result = value * 2', contextA);
vm.runInContext('result = value * 3', contextB);

console.log('Context A:', contextA);
console.log('Context B:', contextB);
console.log('✓ Contexts are completely independent');

// =============================================================================
// 5. CHECKING IF OBJECT IS A CONTEXT
// =============================================================================

console.log('\n5. Checking if an Object is a Context:');
console.log('-'.repeat(70));

const regularObject = { x: 1 };
const contextObject = { x: 2 };
vm.createContext(contextObject);

console.log('regularObject is context?', vm.isContext(regularObject)); // false
console.log('contextObject is context?', vm.isContext(contextObject)); // true

console.log('✓ Use vm.isContext() to check if object is a context');

// =============================================================================
// 6. PROVIDING FUNCTIONS IN CONTEXT
// =============================================================================

console.log('\n6. Providing Functions in Context:');
console.log('-'.repeat(70));

const sandbox3 = {
  console: console,
  data: [1, 2, 3, 4, 5],

  // Custom function available in context
  sum: function(arr) {
    return arr.reduce((a, b) => a + b, 0);
  },

  // Another custom function
  average: function(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  },
};

vm.createContext(sandbox3);

vm.runInContext(`
  const total = sum(data);
  const avg = average(data);
  console.log('Data:', data);
  console.log('Sum:', total);
  console.log('Average:', avg);
`, sandbox3);

console.log('✓ Can provide custom functions in context');

// =============================================================================
// 7. PRACTICAL EXAMPLE - USER SESSION
// =============================================================================

console.log('\n7. Practical Example - User Session:');
console.log('-'.repeat(70));

class UserSession {
  constructor(username) {
    this.context = {
      username: username,
      variables: {},
      history: [],

      // Helper functions
      set: function(key, value) {
        this.variables[key] = value;
        return value;
      },

      get: function(key) {
        return this.variables[key];
      },

      log: function(message) {
        this.history.push(message);
        console.log(`[${this.username}]:`, message);
      },
    };

    vm.createContext(this.context);
  }

  execute(code) {
    try {
      const result = vm.runInContext(code, this.context);
      return { success: true, result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getState() {
    return {
      username: this.context.username,
      variables: this.context.variables,
      history: this.context.history,
    };
  }
}

// Create user session
const aliceSession = new UserSession('Alice');

console.log('\nAlice\'s session:');
aliceSession.execute('set("age", 25)');
aliceSession.execute('set("city", "New York")');
aliceSession.execute('log("Variables set")');
aliceSession.execute('const info = `${username} is ${get("age")} years old`');
aliceSession.execute('log(info)');

console.log('\nAlice\'s state:');
console.log(JSON.stringify(aliceSession.getState(), null, 2));

// =============================================================================
// 8. PERFORMANCE COMPARISON
// =============================================================================

console.log('\n8. Performance Comparison:');
console.log('-'.repeat(70));

const iterations = 1000;

// Test 1: runInNewContext (creates new context each time)
console.log(`\nExecuting ${iterations} times with runInNewContext:`);
let start = Date.now();
for (let i = 0; i < iterations; i++) {
  vm.runInNewContext('x + y', { x: i, y: i * 2 });
}
let timeNewContext = Date.now() - start;
console.log(`Time: ${timeNewContext}ms`);

// Test 2: createContext + runInContext (reuses context)
console.log(`\nExecuting ${iterations} times with runInContext:`);
const reusableSandbox = { x: 0, y: 0 };
vm.createContext(reusableSandbox);
start = Date.now();
for (let i = 0; i < iterations; i++) {
  reusableSandbox.x = i;
  reusableSandbox.y = i * 2;
  vm.runInContext('x + y', reusableSandbox);
}
let timeReuseContext = Date.now() - start;
console.log(`Time: ${timeReuseContext}ms`);

console.log(`\nSpeedup: ${(timeNewContext / timeReuseContext).toFixed(2)}x faster`);
console.log('✓ Reusing contexts is significantly more efficient');

// =============================================================================
// 9. CONTEXT WITH COMPLEX STATE
// =============================================================================

console.log('\n9. Context with Complex State:');
console.log('-'.repeat(70));

const appContext = {
  console: console,
  state: {
    users: [],
    posts: [],
  },

  addUser: function(name, email) {
    const user = { id: this.state.users.length + 1, name, email };
    this.state.users.push(user);
    return user;
  },

  addPost: function(userId, title, content) {
    const post = {
      id: this.state.posts.length + 1,
      userId,
      title,
      content,
      created: new Date(),
    };
    this.state.posts.push(post);
    return post;
  },

  getUser: function(id) {
    return this.state.users.find(u => u.id === id);
  },
};

vm.createContext(appContext);

// Execute commands
vm.runInContext(`
  const alice = addUser('Alice', 'alice@example.com');
  const bob = addUser('Bob', 'bob@example.com');
  console.log('Users created:', alice.name, 'and', bob.name);

  addPost(alice.id, 'Hello World', 'My first post!');
  addPost(bob.id, 'Learning VM', 'VM module is cool');

  console.log('Total users:', state.users.length);
  console.log('Total posts:', state.posts.length);
`, appContext);

console.log('\nFinal state:');
console.log('Users:', appContext.state.users);
console.log('Posts:', appContext.state.posts.map(p => ({ title: p.title, by: p.userId })));

// =============================================================================
// SUMMARY
// =============================================================================

console.log('\n' + '='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));

console.log(`
Key Takeaways:

1. Creating Contexts:
   ✓ Use vm.createContext(sandbox) to create reusable context
   ✓ Use vm.runInContext(code, context) to execute in context
   ✓ Context persists state between executions
   ✓ Much more efficient for multiple executions

2. Context vs Sandbox:
   - Sandbox: Regular JavaScript object
   - Context: Sandbox converted to execution context
   - Same object, but context has special V8 properties

3. State Management:
   ✓ State persists across executions
   ✓ Can build complex stateful systems
   ✓ Each context is independent
   ✓ Perfect for session management

4. Performance:
   ✓ Reusing contexts is much faster
   ✓ Avoid creating new contexts in loops
   ✓ Create once, use many times
   ✓ 2-5x performance improvement typical

5. Use Cases:
   - User sessions with persistent state
   - REPL environments
   - Plugin systems with state
   - Application sandboxes
   - Template engines with context

6. Best Practices:
   ✓ Create context once, reuse many times
   ✓ Check with vm.isContext() if needed
   ✓ Provide helper functions in context
   ✓ Manage state carefully
   ✓ Clean up when done

7. When to Use:
   - Multiple executions needed: Use createContext + runInContext
   - One-time execution: Use runInNewContext
   - Performance matters: Use createContext + runInContext
`);

console.log('='.repeat(70));

/**
 * PRACTICE EXERCISES
 * ==================
 *
 * 1. Create a context that maintains a shopping cart and provides
 *    methods to add/remove items and calculate total.
 *
 * 2. Build a mini database using a context that can store, retrieve,
 *    and query data across multiple executions.
 *
 * 3. Implement a counter service that increments/decrements and
 *    maintains state in a context.
 *
 * 4. Create a benchmark comparing runInNewContext vs createContext
 *    for 10,000 executions and measure the difference.
 */
