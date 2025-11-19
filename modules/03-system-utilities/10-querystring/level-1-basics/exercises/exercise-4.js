/**
 * Exercise 4: Building URLs
 *
 * Practice creating URLs with query parameters.
 */

console.log('=== Exercise 4: Building URLs ===\n');

const querystring = require('querystring');

// Task 1: Simple URL builder
console.log('Task 1: Build URL with parameters');
function buildSearchUrl(searchTerm, page = 1) {
  // TODO: Build /search?q=...&page=...
}

// Test
try {
  console.log(buildSearchUrl('nodejs', 2));
  console.log('Expected: /search?q=nodejs&page=2');
  console.log('');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 2: URL builder with optional parameters
console.log('Task 2: Build URL with optional filters');
function buildProductUrl(filters) {
  // TODO: Only include non-empty filters
  // category, minPrice, maxPrice, sort
}

// Test
try {
  console.log(buildProductUrl({ category: 'books', sort: 'price' }));
  console.log(buildProductUrl({}));
  console.log('');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 3: Pagination URL builder
console.log('Task 3: Generate pagination URLs');
function buildPaginationUrl(baseUrl, currentPage, params = {}) {
  // TODO: Build URL preserving params, changing page
}

// Test
try {
  console.log(buildPaginationUrl('/products', 3, { category: 'electronics' }));
  console.log('Expected: /products?category=electronics&page=3');
  console.log('');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

console.log('=== Exercise 4 Complete ===');
