/**
 * Level 2 Exercise 5: URL Manipulation
 *
 * Practice advanced URL manipulation techniques.
 */

const querystring = require('querystring');

console.log('=== Level 2 Exercise 5: URL Manipulation ===\n');

// Task 1: Update URL parameters
console.log('Task 1: Update specific parameters');
function updateUrl(url, updates) {
  // TODO: Update specific parameters while preserving others
}

// Test Task 1
try {
  const url = '/search?q=nodejs&page=1&limit=20';
  const updated = updateUrl(url, { page: 5, sort: 'date' });
  console.log('Should preserve q and limit, update page, add sort\n');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 2: Clean and normalize URL
console.log('Task 2: Clean URL');
function cleanUrl(url) {
  // TODO: Remove empty parameters, sort keys alphabetically
}

// Test Task 2
try {
  const dirty = '/page?z=3&a=1&b=&m=2&c=';
  const clean = cleanUrl(dirty);
  console.log('Should remove empty params and sort\n');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 3: Build pagination system
console.log('Task 3: Pagination URL generator');
class PaginationBuilder {
  constructor(baseUrl, totalPages) {
    this.baseUrl = baseUrl;
    this.totalPages = totalPages;
  }

  buildPage(page, existingParams = {}) {
    // TODO: Build URL for specific page
  }

  buildAll(currentPage, existingParams = {}) {
    // TODO: Return object with first, prev, current, next, last URLs
  }
}

// Test Task 3
try {
  const pager = new PaginationBuilder('/products', 10);
  const urls = pager.buildAll(5, { category: 'electronics', sort: 'price' });
  console.log('Should generate all pagination URLs\n');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

console.log('Implement the functions and test your solutions!');
