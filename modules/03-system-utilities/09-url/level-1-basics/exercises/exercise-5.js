/**
 * Exercise 5: Practical URL Operations
 *
 * Practice real-world URL manipulation scenarios.
 */

console.log('=== Exercise 5: Practical URL Operations ===\n');

// Task 1: Build API URL with filters
console.log('Task 1: API URL Builder');
/**
 * Build an API URL with filtering parameters
 * @param {string} endpoint - API endpoint (e.g., '/users')
 * @param {object} filters - Filter object (may contain null/undefined values)
 * @returns {string} Complete API URL (skip null/undefined values)
 */
function buildApiUrl(baseUrl, endpoint, filters = {}) {
  // TODO: Implement this function
  // Only add parameters that are not null/undefined
}

// Test
const apiUrl = buildApiUrl('https://api.example.com', '/products', {
  category: 'electronics',
  minPrice: 100,
  maxPrice: 500,
  inStock: true,
  discount: null,  // Should not be added
  brand: undefined // Should not be added
});
console.log('Result:', apiUrl);
console.log('');

// Task 2: Parse request URL (like in HTTP server)
console.log('Task 2: Parse HTTP Request URL');
/**
 * Parse a request URL from an HTTP server
 * @param {object} req - Simulated request object { url, headers: { host } }
 * @returns {object} Parsed URL components
 */
function parseRequestUrl(req) {
  // TODO: Implement this function
  // Return: { pathname, query, hash, fullUrl }
  // Note: req.url may be relative (e.g., '/path?query=value')
}

// Test
const request = {
  url: '/api/users?page=1&limit=10#results',
  headers: { host: 'api.example.com' }
};
const parsed = parseRequestUrl(request);
console.log('Request URL:', request.url);
console.log('Host:', request.headers.host);
console.log('Parsed:', parsed);
console.log('');

// Task 3: Safe redirect URL validator
console.log('Task 3: Safe Redirect Validator');
/**
 * Validate a redirect URL for security
 * @param {string} redirectUrl - URL to redirect to
 * @param {string[]} allowedDomains - Allowed domains for redirect
 * @returns {string} Safe redirect URL or default '/'
 */
function getSafeRedirectUrl(redirectUrl, allowedDomains) {
  // TODO: Implement this function
  // Only allow http/https protocols
  // Only allow whitelisted domains
  // Return '/' if validation fails
}

// Test
const allowedDomains = ['example.com', 'app.example.com'];
const redirectTests = [
  'https://example.com/dashboard',
  'https://evil.com/phishing',
  'javascript:alert(1)',
  '/relative/path'
];

redirectTests.forEach(url => {
  const safe = getSafeRedirectUrl(url, allowedDomains);
  console.log(`${url} → ${safe}`);
});
console.log('');

// Task 4: URL normalizer
console.log('Task 4: URL Normalization');
/**
 * Normalize a URL for comparison
 * @param {string} urlString - URL to normalize
 * @returns {string} Normalized URL
 */
function normalizeUrl(urlString) {
  // TODO: Implement this function
  // 1. Lowercase protocol and hostname
  // 2. Remove default ports (80 for http, 443 for https)
  // 3. Remove trailing slash from pathname (except root /)
  // 4. Sort query parameters alphabetically
}

// Test
const urlsToNormalize = [
  'HTTPS://EXAMPLE.COM:443/Path/?z=3&a=1',
  'https://example.com/Path?a=1&z=3',
  'https://example.com:443/Path/?a=1&z=3'
];

console.log('Normalized URLs (should all be the same):');
urlsToNormalize.forEach(url => {
  console.log(normalizeUrl(url));
});
console.log('');

// Task 5: Extract and group query parameters by type
console.log('Task 5: Group Query Parameters');
/**
 * Group query parameters that appear multiple times
 * @param {string} urlString - URL with query params
 * @returns {object} Object with single values and array values separated
 */
function groupQueryParams(urlString) {
  // TODO: Implement this function
  // Return: { single: {}, multiple: {} }
  // single: parameters that appear once
  // multiple: parameters that appear multiple times (as arrays)
}

// Test
const groupUrl = 'https://example.com?id=123&tag=js&tag=node&tag=web&name=test';
const grouped = groupQueryParams(groupUrl);
console.log('URL:', groupUrl);
console.log('Grouped:', grouped);
// Expected:
// {
//   single: { id: '123', name: 'test' },
//   multiple: { tag: ['js', 'node', 'web'] }
// }
console.log('');

console.log('=== Exercise 5 Complete ===');
console.log('Great job! You\'ve completed all Level 1 exercises.');
console.log('Check your solutions against the solution files.');
