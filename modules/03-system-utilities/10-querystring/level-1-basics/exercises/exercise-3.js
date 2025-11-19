/**
 * Exercise 3: Type Conversion
 *
 * Practice converting query string values to proper types.
 */

console.log('=== Exercise 3: Type Conversion ===\n');

const querystring = require('querystring');

// Task 1: Parse and convert to integers
console.log('Task 1: Convert to integers safely');
function parseIntParam(queryStr, key, defaultValue = 0) {
  // TODO: Parse query, get value, convert to int with default
}

// Test
try {
  console.log(parseIntParam('page=5&limit=20', 'page', 1));
  console.log('Expected: 5');
  console.log(parseIntParam('page=abc', 'page', 1));
  console.log('Expected: 1 (default)');
  console.log('');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 2: Parse booleans
console.log('Task 2: Convert to booleans');
function parseBoolParam(queryStr, key, defaultValue = false) {
  // TODO: Parse and convert 'true', '1' to true, else false
}

// Test
try {
  console.log(parseBoolParam('active=true', 'active'));
  console.log('Expected: true');
  console.log(parseBoolParam('active=false', 'active'));
  console.log('Expected: false');
  console.log('');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 3: Create typed parameter parser
console.log('Task 3: Parse all parameters with types');
function parseTypedParams(queryStr) {
  // TODO: Parse and return object with converted types
  // page, limit -> numbers
  // active -> boolean
  // sort -> string
}

// Test
try {
  const result = parseTypedParams('page=2&limit=50&active=true&sort=date');
  console.log(result);
  console.log('All types should be converted correctly');
  console.log('');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

console.log('=== Exercise 3 Complete ===');
