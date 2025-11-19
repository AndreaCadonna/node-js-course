/**
 * Exercise 4: URL Validation
 *
 * Practice validating URLs with different criteria.
 */

console.log('=== Exercise 4: URL Validation ===\n');

// Task 1: Basic URL validation with error handling
console.log('Task 1: Validate URL with Error Messages');
/**
 * Validate a URL and return result with error message
 * @param {string} urlString - URL to validate
 * @returns {object} { valid: boolean, error: string|null, url: URL|null }
 */
function validateUrl(urlString) {
  // TODO: Implement this function
}

// Test
const testUrls = [
  'https://example.com',
  'not a url',
  '/relative/path',
  'javascript:alert(1)'
];

testUrls.forEach(url => {
  const result = validateUrl(url);
  console.log(`"${url}"`);
  console.log(`  Valid: ${result.valid}`);
  if (!result.valid) {
    console.log(`  Error: ${result.error}`);
  }
  console.log('');
});

// Task 2: Validate HTTP/HTTPS only
console.log('Task 2: HTTP/HTTPS Validation');
/**
 * Check if URL uses HTTP or HTTPS protocol
 * @param {string} urlString - URL to check
 * @returns {boolean} true if http/https, false otherwise
 */
function isHttpUrl(urlString) {
  // TODO: Implement this function
}

// Test
const httpTests = [
  'https://example.com',
  'http://localhost:3000',
  'ftp://files.example.com',
  'javascript:alert(1)'
];

httpTests.forEach(url => {
  console.log(`${url}: ${isHttpUrl(url)}`);
});
console.log('');

// Task 3: Domain whitelist validation
console.log('Task 3: Whitelist Domain Validation');
/**
 * Check if URL hostname is in allowed list
 * @param {string} urlString - URL to check
 * @param {string[]} allowedDomains - Array of allowed hostnames
 * @returns {boolean} true if domain is allowed
 */
function isAllowedDomain(urlString, allowedDomains) {
  // TODO: Implement this function
}

// Test
const allowed = ['example.com', 'api.example.com', 'cdn.example.com'];
const domainTests = [
  'https://example.com/page',
  'https://api.example.com/data',
  'https://evil.com/page',
  'https://subdomain.api.example.com/data'
];

domainTests.forEach(url => {
  const result = isAllowedDomain(url, allowed);
  console.log(`${result ? '✓' : '✗'} ${url}`);
});
console.log('');

// Task 4: Validate required query parameters
console.log('Task 4: Required Parameters Validation');
/**
 * Check if URL has all required query parameters
 * @param {string} urlString - URL to check
 * @param {string[]} requiredParams - Array of required parameter names
 * @returns {object} { valid: boolean, missing: string[] }
 */
function validateRequiredParams(urlString, requiredParams) {
  // TODO: Implement this function
  // Return which parameters are missing
}

// Test
const url = 'https://example.com/search?q=test&page=1';
const result = validateRequiredParams(url, ['q', 'page', 'limit']);
console.log('URL:', url);
console.log('Required: [\'q\', \'page\', \'limit\']');
console.log('Valid:', result.valid);
console.log('Missing:', result.missing);
console.log('');

// Task 5: Comprehensive URL validator
console.log('Task 5: Comprehensive Validator');
/**
 * Validate URL against multiple criteria
 * @param {string} urlString - URL to validate
 * @param {object} options - Validation options
 * @returns {object} Validation result with errors array
 */
function comprehensiveValidate(urlString, options = {}) {
  const {
    requireHttps = false,
    allowedDomains = null,
    maxLength = 2000
  } = options;

  // TODO: Implement this function
  // Return: { valid: boolean, errors: string[] }
  // Check: length, protocol (https if required), domain (if whitelist provided)
}

// Test
const testCases = [
  {
    url: 'https://api.example.com/data',
    options: { requireHttps: true, allowedDomains: ['api.example.com'] }
  },
  {
    url: 'http://example.com',
    options: { requireHttps: true }
  },
  {
    url: 'https://evil.com',
    options: { allowedDomains: ['example.com'] }
  }
];

testCases.forEach(({ url, options }, index) => {
  console.log(`Test ${index + 1}: ${url}`);
  const result = comprehensiveValidate(url, options);
  console.log('  Valid:', result.valid);
  if (!result.valid) {
    console.log('  Errors:', result.errors);
  }
  console.log('');
});

console.log('=== Exercise 4 Complete ===');
