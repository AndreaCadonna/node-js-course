/**
 * Level 2 Exercise 4 Solution: Nested Objects
 */

const querystring = require('querystring');

console.log('=== Level 2 Exercise 4 Solutions ===\n');

// Task 1: Flatten nested object with dot notation
console.log('Task 1: Flatten with dot notation');
function flattenObject(obj, prefix = '') {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  
  return result;
}

const nested = {
  user: {
    name: { first: 'John', last: 'Doe' },
    age: 30
  },
  active: true
};
const flat = flattenObject(nested);
console.log('Flattened:', flat);
console.log('✓ Task 1 complete\n');

// Task 2: Unflatten dot notation object
console.log('Task 2: Unflatten object');
function unflattenObject(flat) {
  const result = {};
  
  for (const [key, value] of Object.entries(flat)) {
    const keys = key.split('.');
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }
  
  return result;
}

const flatObj = {
  'user.name': 'John',
  'user.age': '30',
  'active': 'true'
};
const unflat = unflattenObject(flatObj);
console.log('Unflattened:', unflat);
console.log('✓ Task 2 complete\n');

// Task 3: Complete filter system
console.log('Task 3: Filter stringify/parse');
function stringifyFilters(filters) {
  const flat = flattenObject(filters);
  return querystring.stringify(flat);
}

function parseFilters(queryStr) {
  const params = querystring.parse(queryStr);
  return unflattenObject(params);
}

const filters = {
  product: { category: 'electronics', price: { min: 100, max: 1000 }},
  sort: { by: 'price', order: 'asc' }
};
const str = stringifyFilters(filters);
const parsedFilters = parseFilters(str);
console.log('Stringified:', str);
console.log('Parsed back:', parsedFilters);
console.log('✓ Task 3 complete\n');

console.log('=== All Solutions Complete ===');
