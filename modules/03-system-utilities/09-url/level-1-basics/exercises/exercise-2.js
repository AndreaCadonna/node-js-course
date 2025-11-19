/**
 * Exercise 2: Working with Query Parameters
 *
 * Practice manipulating URL query parameters using URLSearchParams.
 */

console.log('=== Exercise 2: Query Parameters ===\n');

// Task 1: Add query parameters to a URL
console.log('Task 1: Add Query Parameters');
/**
 * Add multiple query parameters to a URL
 * @param {string} urlString - Base URL
 * @param {object} params - Object with key-value pairs to add
 * @returns {string} URL with added parameters
 */
function addQueryParams(urlString, params) {
  // TODO: Implement this function
}

// Test
const result1 = addQueryParams('https://api.example.com/users', {
  role: 'admin',
  status: 'active',
  limit: 10
});
console.log('Result:', result1);
console.log('Expected: https://api.example.com/users?role=admin&status=active&limit=10\n');

// Task 2: Update existing query parameters
console.log('Task 2: Update Query Parameters');
/**
 * Update/merge query parameters in a URL
 * @param {string} urlString - URL with existing params
 * @param {object} updates - Parameters to update/add
 * @returns {string} Updated URL
 */
function updateQueryParams(urlString, updates) {
  // TODO: Implement this function
}

// Test
const result2 = updateQueryParams(
  'https://example.com/search?q=old&page=1&limit=10',
  { q: 'new', page: 2, sort: 'date' }
);
console.log('Result:', result2);
console.log('');

// Task 3: Remove query parameters
console.log('Task 3: Remove Query Parameters');
/**
 * Remove specific query parameters from a URL
 * @param {string} urlString - URL with params
 * @param {string[]} paramsToRemove - Array of param names to remove
 * @returns {string} URL without specified params
 */
function removeQueryParams(urlString, paramsToRemove) {
  // TODO: Implement this function
}

// Test
const result3 = removeQueryParams(
  'https://example.com/page?a=1&b=2&c=3&d=4',
  ['b', 'd']
);
console.log('Result:', result3);
console.log('Expected: https://example.com/page?a=1&c=3\n');

// Task 4: Handle array parameters
console.log('Task 4: Handle Array Parameters');
/**
 * Add array values as multiple parameters
 * @param {string} urlString - Base URL
 * @param {object} params - Object that may contain arrays
 * @returns {string} URL with parameters (arrays as multiple values)
 */
function addArrayParams(urlString, params) {
  // TODO: Implement this function
  // Arrays should be appended as multiple values with same key
}

// Test
const result4 = addArrayParams('https://example.com/products', {
  category: 'electronics',
  brand: ['Sony', 'Samsung', 'LG'],
  inStock: true
});
console.log('Result:', result4);
console.log('');

// Task 5: Get all values for a parameter
console.log('Task 5: Get All Parameter Values');
/**
 * Get all values for a query parameter that appears multiple times
 * @param {string} urlString - URL with params
 * @param {string} paramName - Parameter name to get
 * @returns {string[]} Array of all values
 */
function getAllParamValues(urlString, paramName) {
  // TODO: Implement this function
}

// Test
const result5 = getAllParamValues(
  'https://example.com?tag=js&tag=node&tag=web',
  'tag'
);
console.log('Result:', result5);
console.log('Expected: [\'js\', \'node\', \'web\']\n');

console.log('=== Exercise 2 Complete ===');
