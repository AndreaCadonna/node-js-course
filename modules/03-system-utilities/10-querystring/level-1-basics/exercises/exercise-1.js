/**
 * Exercise 1: Basic Parsing and Stringifying
 *
 * Practice fundamental query string operations.
 */

console.log('=== Exercise 1: Basic Parsing and Stringifying ===\n');

// Task 1: Parse a simple query string
console.log('Task 1: Parse query string to object');
/**
 * Create a function that parses a query string and returns an object
 * Example: 'name=John&age=30' => { name: 'John', age: '30' }
 */
function parseQuery(queryStr) {
  // TODO: Implement this function
  // Hint: Use querystring.parse()
  // Your code here
}

// Test Task 1
try {
  const query1 = 'name=John&age=30&city=NYC';
  const result1 = parseQuery(query1);
  console.log('Input:', query1);
  console.log('Output:', result1);
  console.log('Expected: { name: \'John\', age: \'30\', city: \'NYC\' }');
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Stringify an object to query string
console.log('Task 2: Object to query string');
/**
 * Create a function that converts an object to a query string
 * @param {Object} obj - Object to convert
 * @returns {string} Query string
 */
function stringifyQuery(obj) {
  // TODO: Implement this function
  // Hint: Use querystring.stringify()
  // Your code here
}

// Test Task 2
try {
  const obj2 = { search: 'nodejs', category: 'tutorial', page: 1 };
  const result2 = stringifyQuery(obj2);
  console.log('Input:', obj2);
  console.log('Output:', result2);
  console.log('Expected: "search=nodejs&category=tutorial&page=1"');
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Extract query string from URL
console.log('Task 3: Extract and parse query from full URL');
/**
 * Create a function that extracts the query string from a URL and parses it
 * @param {string} url - Full URL
 * @returns {Object} Parsed query parameters
 */
function extractQueryFromUrl(url) {
  // TODO: Implement this function
  // Hint: Find the '?' and use substring(), then parse
  // Your code here
}

// Test Task 3
try {
  const url3 = 'https://example.com/search?q=nodejs&page=2&limit=20';
  const result3 = extractQueryFromUrl(url3);
  console.log('Input:', url3);
  console.log('Output:', result3);
  console.log('Expected: { q: \'nodejs\', page: \'2\', limit: \'20\' }');
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Build complete URL with query parameters
console.log('Task 4: Build complete URL');
/**
 * Create a function that builds a URL from a base path and parameters
 * @param {string} basePath - Base URL path
 * @param {Object} params - Query parameters
 * @returns {string} Complete URL
 */
function buildUrl(basePath, params) {
  // TODO: Implement this function
  // Hint: Use template literals and stringify()
  // Handle case when params is empty
  // Your code here
}

// Test Task 4
try {
  const result4a = buildUrl('/products', { category: 'electronics', sort: 'price' });
  console.log('With params:', result4a);
  console.log('Expected: "/products?category=electronics&sort=price"');

  const result4b = buildUrl('/home', {});
  console.log('Without params:', result4b);
  console.log('Expected: "/home"');
  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Handle arrays in query strings
console.log('Task 5: Handle duplicate keys (arrays)');
/**
 * Create a function that correctly handles array values in query strings
 * Multiple values for same key should remain as array
 * @param {string} queryStr - Query string to parse
 * @param {string} key - Key to retrieve
 * @returns {Array} Always returns an array
 */
function getQueryArray(queryStr, key) {
  // TODO: Implement this function
  // Parse the query string
  // Get the value for the key
  // If it's not an array, wrap it in array
  // If it's undefined, return empty array
  // Your code here
}

// Test Task 5
try {
  const single = getQueryArray('color=red', 'color');
  console.log('Single value:', single);
  console.log('Expected: [\'red\']');

  const multiple = getQueryArray('color=red&color=blue&color=green', 'color');
  console.log('Multiple values:', multiple);
  console.log('Expected: [\'red\', \'blue\', \'green\']');

  const missing = getQueryArray('size=large', 'color');
  console.log('Missing key:', missing);
  console.log('Expected: []');
  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge
console.log('Bonus Challenge: Clean query parameters');
/**
 * Create a function that removes empty/null/undefined values from params
 * @param {Object} params - Parameters object
 * @returns {string} Clean query string
 */
function buildCleanQuery(params) {
  // TODO: Implement this function
  // Filter out null, undefined, and empty strings
  // Return stringified result
  // Your code here
}

// Test Bonus
try {
  const dirtyParams = {
    name: 'John',
    email: '',
    age: 30,
    phone: null,
    city: undefined,
    active: true
  };

  const clean = buildCleanQuery(dirtyParams);
  console.log('Input:', dirtyParams);
  console.log('Output:', clean);
  console.log('Expected: "name=John&age=30&active=true"');
  console.log('✓ Bonus implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 1 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
