/**
 * Level 2 Exercise 4: Nested Objects
 *
 * Practice flattening and unflattening nested objects.
 */

const querystring = require('querystring');

console.log('=== Level 2 Exercise 4: Nested Objects ===\n');

// Task 1: Flatten nested object with dot notation
console.log('Task 1: Flatten with dot notation');
function flattenObject(obj, prefix = '') {
  // TODO: Recursively flatten nested object
  // user.name.first -> 'user.name.first': 'John'
}

// Test Task 1
try {
  const nested = {
    user: {
      name: { first: 'John', last: 'Doe' },
      age: 30
    },
    active: true
  };
  const flat = flattenObject(nested);
  console.log('Should flatten to dot notation keys\n');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 2: Unflatten dot notation object
console.log('Task 2: Unflatten object');
function unflattenObject(flat) {
  // TODO: Convert flat object back to nested
  // 'user.name.first': 'John' -> { user: { name: { first: 'John' }}}
}

// Test Task 2
try {
  const flat = {
    'user.name': 'John',
    'user.age': '30',
    'active': 'true'
  };
  const nested = unflattenObject(flat);
  console.log('Should create nested structure\n');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 3: Complete filter system
console.log('Task 3: Filter stringify/parse');
function stringifyFilters(filters) {
  // TODO: Flatten and stringify filter object
}

function parseFilters(queryStr) {
  // TODO: Parse and unflatten filter string
}

// Test Task 3
try {
  const filters = {
    product: { category: 'electronics', price: { min: 100, max: 1000 }},
    sort: { by: 'price', order: 'asc' }
  };
  const str = stringifyFilters(filters);
  const parsed = parseFilters(str);
  console.log('Should handle complex nested filters\n');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

console.log('Implement the functions and test your solutions!');
