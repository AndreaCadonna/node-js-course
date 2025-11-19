/**
 * Level 2 Exercise 5 Solution: URL Manipulation
 */

const querystring = require('querystring');

console.log('=== Level 2 Exercise 5 Solutions ===\n');

// Task 1: Update URL parameters
console.log('Task 1: Update specific parameters');
function updateUrl(url, updates) {
  const [base, query = ''] = url.split('?');
  const current = querystring.parse(query);
  const merged = { ...current, ...updates };
  const newQuery = querystring.stringify(merged);
  return newQuery ? `${base}?${newQuery}` : base;
}

const url = '/search?q=nodejs&page=1&limit=20';
const updated = updateUrl(url, { page: 5, sort: 'date' });
console.log('Original:', url);
console.log('Updated:', updated);
console.log('✓ Task 1 complete\n');

// Task 2: Clean and normalize URL
console.log('Task 2: Clean URL');
function cleanUrl(url) {
  const [base, query = ''] = url.split('?');
  const params = querystring.parse(query);
  
  // Remove empty values
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== '' && v != null)
  );
  
  // Sort keys
  const sorted = Object.keys(cleaned).sort().reduce((acc, key) => {
    acc[key] = cleaned[key];
    return acc;
  }, {});
  
  const newQuery = querystring.stringify(sorted);
  return newQuery ? `${base}?${newQuery}` : base;
}

const dirty = '/page?z=3&a=1&b=&m=2&c=';
const clean = cleanUrl(dirty);
console.log('Dirty:', dirty);
console.log('Clean:', clean);
console.log('✓ Task 2 complete\n');

// Task 3: Build pagination system
console.log('Task 3: Pagination URL generator');
class PaginationBuilder {
  constructor(baseUrl, totalPages) {
    this.baseUrl = baseUrl;
    this.totalPages = totalPages;
  }

  buildPage(page, existingParams = {}) {
    const params = { ...existingParams, page };
    const query = querystring.stringify(params);
    return `${this.baseUrl}?${query}`;
  }

  buildAll(currentPage, existingParams = {}) {
    return {
      first: currentPage > 1 ? this.buildPage(1, existingParams) : null,
      prev: currentPage > 1 ? this.buildPage(currentPage - 1, existingParams) : null,
      current: this.buildPage(currentPage, existingParams),
      next: currentPage < this.totalPages ? this.buildPage(currentPage + 1, existingParams) : null,
      last: currentPage < this.totalPages ? this.buildPage(this.totalPages, existingParams) : null
    };
  }
}

const pager = new PaginationBuilder('/products', 10);
const urls = pager.buildAll(5, { category: 'electronics', sort: 'price' });
console.log('Pagination URLs:', urls);
console.log('✓ Task 3 complete\n');

console.log('=== All Solutions Complete ===');
