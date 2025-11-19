/**
 * Exercise 3: URL Building and Modification
 *
 * Practice building and modifying URLs programmatically.
 */

console.log('=== Exercise 3: URL Building ===\n');

// Task 1: Build a complete URL from parts
console.log('Task 1: Build URL from Components');
/**
 * Build a URL from individual components
 * @param {object} components - URL components
 * @returns {string} Complete URL
 */
function buildUrl(components) {
  const { protocol, hostname, port, pathname, query, hash } = components;
  // TODO: Implement this function
  // Build URL from: protocol, hostname, port (optional), pathname, query (object), hash (optional)
}

// Test
const result1 = buildUrl({
  protocol: 'https',
  hostname: 'api.example.com',
  port: 8080,
  pathname: '/v1/users',
  query: { page: 1, limit: 10 },
  hash: 'results'
});
console.log('Result:', result1);
console.log('');

// Task 2: Change protocol of a URL
console.log('Task 2: Switch Protocol');
/**
 * Change URL protocol (http <-> https)
 * @param {string} urlString - Original URL
 * @param {string} newProtocol - New protocol ('http' or 'https')
 * @returns {string} URL with new protocol
 */
function changeProtocol(urlString, newProtocol) {
  // TODO: Implement this function
}

// Test
console.log(changeProtocol('http://example.com', 'https'));
console.log(changeProtocol('https://example.com:443/page', 'http'));
console.log('');

// Task 3: Update pathname
console.log('Task 3: Update Pathname');
/**
 * Replace the pathname in a URL
 * @param {string} urlString - Original URL
 * @param {string} newPathname - New pathname
 * @returns {string} URL with new pathname
 */
function updatePathname(urlString, newPathname) {
  // TODO: Implement this function
}

// Test
console.log(updatePathname('https://example.com/old/path', '/new/path'));
console.log('');

// Task 4: Clone and modify URL
console.log('Task 4: Clone and Modify');
/**
 * Clone a URL and apply modifications
 * @param {string} urlString - Original URL
 * @param {object} modifications - Changes to apply
 * @returns {string} New modified URL (original unchanged)
 */
function cloneAndModify(urlString, modifications) {
  // TODO: Implement this function
  // modifications may include: pathname, query (object), hash
}

// Test
const original = 'https://example.com/page?foo=bar';
const modified = cloneAndModify(original, {
  pathname: '/new-page',
  query: { baz: 'qux' },
  hash: 'section'
});
console.log('Original:', original);
console.log('Modified:', modified);
console.log('');

// Task 5: Build pagination URLs
console.log('Task 5: Build Pagination URLs');
/**
 * Build pagination URLs for current, next, and previous pages
 * @param {string} baseUrl - Base URL
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @returns {object} Object with current, next, prev URLs
 */
function buildPaginationUrls(baseUrl, currentPage, totalPages) {
  // TODO: Implement this function
  // Return: { current, next, prev }
  // next and prev should be null if not applicable
}

// Test
const pagination = buildPaginationUrls('https://example.com/products', 2, 5);
console.log('Pagination URLs:', pagination);
console.log('');

console.log('=== Exercise 3 Complete ===');
