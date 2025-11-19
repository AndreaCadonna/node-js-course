/**
 * Exercise 1: URL Parsing and Component Extraction
 *
 * Practice parsing URLs and extracting their components.
 */

console.log('=== Exercise 1: URL Parsing ===\n');

// Task 1: Parse a URL and extract all components
console.log('Task 1: Extract URL Components');
/**
 * Create a function that parses a URL and returns an object with all components
 * @param {string} urlString - The URL to parse
 * @returns {object} Object with url components or null if invalid
 */
function parseUrlComponents(urlString) {
  // TODO: Implement this function
  // Should return: {
  //   protocol, hostname, port, pathname, search, hash, origin, href
  // }
  // Return null if URL is invalid
}

// Test Task 1
const testUrls = [
  'https://www.example.com:8080/products/123?category=electronics&sort=price#reviews',
  'http://localhost:3000/api/users?page=1',
  'https://user:pass@example.com/admin#dashboard'
];

testUrls.forEach((url, index) => {
  console.log(`Test ${index + 1}:`, url);
  const result = parseUrlComponents(url);
  console.log('Result:', result);
  console.log('');
});

// Task 2: Extract query parameters
console.log('Task 2: Extract Query Parameters as Object');
/**
 * Extract all query parameters from a URL as an object
 * @param {string} urlString - The URL to parse
 * @returns {object} Object with query parameters
 */
function extractQueryParams(urlString) {
  // TODO: Implement this function
  // Should convert URL query string to plain object
  // Example: '?a=1&b=2' => { a: '1', b: '2' }
}

// Test Task 2
const queryUrls = [
  'https://example.com/search?q=nodejs&limit=10&page=1',
  'https://example.com/products?category=electronics&minPrice=100&maxPrice=500'
];

queryUrls.forEach((url, index) => {
  console.log(`Test ${index + 1}:`, url);
  const params = extractQueryParams(url);
  console.log('Parameters:', params);
  console.log('');
});

// Task 3: Check if URL uses HTTPS
console.log('Task 3: Check Protocol');
/**
 * Check if a URL uses HTTPS protocol
 * @param {string} urlString - The URL to check
 * @returns {boolean} true if HTTPS, false otherwise
 */
function isHttps(urlString) {
  // TODO: Implement this function
}

// Test Task 3
const protocolTests = [
  'https://example.com',
  'http://example.com',
  'ftp://files.example.com',
  'invalid-url'
];

protocolTests.forEach(url => {
  const result = isHttps(url);
  console.log(`${url} - HTTPS: ${result}`);
});
console.log('');

// Task 4: Get hostname from URL
console.log('Task 4: Extract Hostname');
/**
 * Extract just the hostname from a URL
 * @param {string} urlString - The URL to parse
 * @returns {string|null} The hostname or null if invalid
 */
function getHostname(urlString) {
  // TODO: Implement this function
}

// Test Task 4
const hostnameTests = [
  'https://www.example.com/path',
  'https://api.subdomain.example.com/endpoint',
  'http://localhost:3000',
  'https://192.168.1.1/admin'
];

hostnameTests.forEach(url => {
  const hostname = getHostname(url);
  console.log(`${url}\n  Hostname: ${hostname}\n`);
});

// Task 5: Compare URL origins
console.log('Task 5: Compare Origins');
/**
 * Check if two URLs have the same origin
 * @param {string} url1 - First URL
 * @param {string} url2 - Second URL
 * @returns {boolean} true if same origin, false otherwise
 */
function haveSameOrigin(url1, url2) {
  // TODO: Implement this function
  // Origin = protocol + hostname + port
}

// Test Task 5
const originTests = [
  ['https://example.com/page1', 'https://example.com/page2'],
  ['https://example.com:443/page', 'https://example.com/page'],
  ['http://example.com', 'https://example.com'],
  ['https://example.com', 'https://api.example.com']
];

originTests.forEach(([url1, url2], index) => {
  const same = haveSameOrigin(url1, url2);
  console.log(`Test ${index + 1}:`);
  console.log(`  ${url1}`);
  console.log(`  ${url2}`);
  console.log(`  Same origin: ${same}\n`);
});

console.log('=== Exercise 1 Complete ===');
console.log('Check your solutions against exercise-1-solution.js');
