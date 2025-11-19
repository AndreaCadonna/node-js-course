/**
 * Level 2 Exercise 1 Solution: Array Parameter Handling
 */

const querystring = require('querystring');

console.log('=== Level 2 Exercise 1 Solutions ===\n');

// Task 1: Parse repeated keys to array
console.log('Task 1: Ensure array conversion');
function parseToArray(queryStr, key) {
  const params = querystring.parse(queryStr);
  const value = params[key];

  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

console.log(parseToArray('color=red', 'color')); // ['red']
console.log(parseToArray('color=red&color=blue', 'color')); // ['red', 'blue']
console.log(parseToArray('size=large', 'color')); // []
console.log('✓ Task 1 complete\n');

// Task 2: Build query with arrays
console.log('Task 2: Stringify arrays properly');
function buildQueryWithArrays(obj) {
  return querystring.stringify(obj);
}

const data = {
  category: 'electronics',
  brand: ['Apple', 'Samsung', 'Sony'],
  minPrice: 100
};
console.log(buildQueryWithArrays(data));
console.log('✓ Task 2 complete\n');

// Task 3: Convert comma-separated to array
console.log('Task 3: Parse comma-separated values');
function parseCommaSeparated(queryStr, arrayKeys) {
  const params = querystring.parse(queryStr);

  arrayKeys.forEach(key => {
    if (params[key] && typeof params[key] === 'string') {
      params[key] = params[key].split(',').map(v => v.trim());
    }
  });

  return params;
}

console.log(parseCommaSeparated('colors=red,blue,green&size=large', ['colors']));
console.log('✓ Task 3 complete\n');

console.log('=== All Solutions Complete ===');
