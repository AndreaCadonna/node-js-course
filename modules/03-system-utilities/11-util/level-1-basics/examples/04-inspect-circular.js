/**
 * Example 4: Handling Circular References
 *
 * Learn how util.inspect() safely handles circular references, which would
 * cause JSON.stringify() and regular console.log() to fail or hang.
 *
 * Key Concepts:
 * - What circular references are
 * - How util.inspect() detects them
 * - Circular reference notation
 * - Comparing with JSON.stringify()
 */

const util = require('util');

// ===== EXAMPLE 1: Simple Circular Reference =====
console.log('=== Example 1: Simple Circular Reference ===\n');

const person = {
  name: 'Alice',
  age: 30
};

// Create circular reference
person.self = person;  // Points to itself!

console.log('Object with circular reference:');
console.log('person.self === person:', person.self === person);  // true

// Try JSON.stringify - this will fail!
console.log('\nTrying JSON.stringify():');
try {
  JSON.stringify(person);
  console.log('✓ Success (unexpected!)');
} catch (err) {
  console.error('❌ Error:', err.message);
  console.log('   JSON.stringify cannot handle circular references!\n');
}

// util.inspect handles it gracefully
console.log('Using util.inspect():');
console.log(util.inspect(person, { depth: null, colors: true }));
console.log('\n✓ util.inspect shows [Circular *1] notation\n');

// ===== EXAMPLE 2: Nested Circular References =====
console.log('=== Example 2: Nested Circular References ===\n');

const company = {
  name: 'TechCorp',
  employees: []
};

const employee1 = {
  name: 'Bob',
  company: company  // Reference to parent
};

const employee2 = {
  name: 'Charlie',
  company: company  // Reference to parent
};

company.employees.push(employee1, employee2);

console.log('Company with employees (circular references):');
console.log(util.inspect(company, {
  depth: null,
  colors: true,
  compact: false
}));

// ===== EXAMPLE 3: Mutual References =====
console.log('\n=== Example 3: Mutual References ===\n');

const nodeA = { name: 'Node A' };
const nodeB = { name: 'Node B' };

// Create mutual references
nodeA.next = nodeB;
nodeB.prev = nodeA;

console.log('Nodes with mutual references:');
console.log('Node A:');
console.log(util.inspect(nodeA, { depth: 3, colors: true }));

console.log('\nNode B:');
console.log(util.inspect(nodeB, { depth: 3, colors: true }));

// ===== EXAMPLE 4: Linked List =====
console.log('\n=== Example 4: Circular Linked List ===\n');

class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

// Create circular linked list: 1 -> 2 -> 3 -> 1 (circular)
const node1 = new Node(1);
const node2 = new Node(2);
const node3 = new Node(3);

node1.next = node2;
node2.next = node3;
node3.next = node1;  // Circular!

console.log('Circular linked list:');
console.log(util.inspect(node1, {
  depth: null,
  colors: true,
  compact: false
}));

// ===== EXAMPLE 5: Complex Circular Structure =====
console.log('\n=== Example 5: Complex Circular Structure ===\n');

const project = {
  name: 'Project Alpha',
  team: {
    lead: null,
    members: []
  }
};

const lead = {
  name: 'Diana',
  role: 'Lead Developer',
  projects: [project],  // Reference back
  team: project.team    // Reference to parent's team
};

const member1 = {
  name: 'Eve',
  role: 'Developer',
  lead: lead,           // Reference to lead
  projects: [project]   // Reference to project
};

project.team.lead = lead;
project.team.members.push(member1);

console.log('Complex project structure:');
console.log(util.inspect(project, {
  depth: 10,
  colors: true,
  compact: false
}));

// ===== EXAMPLE 6: DOM-Like Tree =====
console.log('\n=== Example 6: DOM-Like Tree Structure ===\n');

class Element {
  constructor(tag) {
    this.tag = tag;
    this.parent = null;
    this.children = [];
  }

  appendChild(child) {
    child.parent = this;  // Circular reference!
    this.children.push(child);
  }
}

const div = new Element('div');
const span1 = new Element('span');
const span2 = new Element('span');

div.appendChild(span1);
div.appendChild(span2);

console.log('DOM-like tree with parent references:');
console.log(util.inspect(div, {
  depth: 5,
  colors: true,
  compact: false
}));

// ===== EXAMPLE 7: Understanding Circular Notation =====
console.log('\n=== Example 7: Understanding Circular Notation ===\n');

const demo = {
  name: 'Demo',
  data: {
    value: 42
  }
};
demo.data.back = demo;  // Circular reference

console.log('Circular notation explanation:');
console.log(util.inspect(demo, { depth: null, colors: false }));

console.log('\nWhat the notation means:');
console.log('- <ref *1>: This object is labeled as reference #1');
console.log('- [Circular *1]: This points back to reference #1');
console.log('- Multiple circular refs get different numbers (*1, *2, etc.)');

// ===== EXAMPLE 8: Practical Use Case - Event System =====
console.log('\n=== Example 8: Event System with Circular References ===\n');

class EventEmitter {
  constructor(name) {
    this.name = name;
    this.listeners = [];
  }

  on(listener) {
    // Listener might reference the emitter (circular!)
    this.listeners.push(listener);
  }
}

const emitter = new EventEmitter('MyEmitter');

const listener = {
  name: 'Listener1',
  emitter: emitter,  // Reference to parent
  handle: function() {
    console.log('Event handled');
  }
};

emitter.on(listener);

console.log('Event emitter with circular listener references:');
console.log(util.inspect(emitter, {
  depth: 5,
  colors: true,
  compact: false,
  showHidden: false
}));

/**
 * Important Notes:
 *
 * 1. What are Circular References?
 *    - An object that references itself directly or indirectly
 *    - Common in trees, graphs, linked lists, event systems
 *    - Can cause infinite loops if not handled properly
 *
 * 2. How util.inspect() Handles Them:
 *    - Tracks objects it has seen before
 *    - Labels first occurrence: <ref *1>
 *    - Shows subsequent references: [Circular *1]
 *    - Different circular refs get different numbers
 *
 * 3. Common Patterns with Circular References:
 *    - Parent-child relationships (DOM, file trees)
 *    - Doubly-linked lists (prev/next pointers)
 *    - Graph structures (nodes referencing each other)
 *    - Event systems (listeners referencing emitters)
 *
 * 4. Why JSON.stringify() Fails:
 *    - JSON spec doesn't support circular references
 *    - Would create infinite JSON if allowed
 *    - Throws "Converting circular structure to JSON" error
 */

/**
 * Try This:
 *
 * 1. Create a binary tree with parent references and inspect it
 * 2. Build a graph with multiple circular paths
 * 3. Create a doubly-linked list and inspect from different nodes
 * 4. Try JSON.stringify with a circular replacer function
 * 5. Inspect the `global` object (lots of circular references!)
 */
