/**
 * Level 2 Exercise 2: URLSearchParams Mastery
 *
 * Practice using the complete URLSearchParams API.
 */

console.log('=== Level 2 Exercise 2: URLSearchParams ===\n');

// Task 1: Build search params with method chaining
console.log('Task 1: Chainable parameter builder');
function buildSearchParams(baseParams) {
  // TODO: Create URLSearchParams, add parameters using set/append
  // Return the URLSearchParams instance
}

// Test Task 1
try {
  const params = buildSearchParams({ q: 'nodejs', page: 1 });
  // Should support: params.append('tag', 'tutorial'); params.set('limit', 20);
  console.log('Create chainable URLSearchParams instance\n');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 2: Convert URLSearchParams to object with arrays
console.log('Task 2: Convert to object preserving arrays');
function searchParamsToObject(params) {
  // TODO: Convert URLSearchParams to object
  // Handle duplicate keys as arrays
}

// Test Task 2
try {
  const params = new URLSearchParams('color=red&color=blue&size=large');
  const obj = searchParamsToObject(params);
  console.log('Should have color as array, size as string\n');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 3: Merge two URLSearchParams
console.log('Task 3: Merge URLSearchParams');
function mergeSearchParams(params1, params2) {
  // TODO: Merge two URLSearchParams instances
  // Return new URLSearchParams with combined parameters
}

// Test Task 3
try {
  const p1 = new URLSearchParams('a=1&b=2');
  const p2 = new URLSearchParams('c=3&d=4');
  const merged = mergeSearchParams(p1, p2);
  console.log('Should contain all parameters from both\n');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

console.log('Implement the functions and test your solutions!');
