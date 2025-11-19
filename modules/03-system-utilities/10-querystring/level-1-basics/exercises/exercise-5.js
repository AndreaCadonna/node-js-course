/**
 * Exercise 5: Search Functionality
 *
 * Build a complete search query parser and builder.
 */

console.log('=== Exercise 5: Search Functionality ===\n');

const querystring = require('querystring');

// Task 1: Parse search query
console.log('Task 1: Parse search parameters');
function parseSearchQuery(queryStr) {
  // TODO: Parse and return structured object:
  // {
  //   query: string,
  //   page: number (default 1),
  //   limit: number (default 20),
  //   sort: string (default 'relevance'),
  //   filters: array
  // }
}

// Test
try {
  const result = parseSearchQuery('q=nodejs&page=2&limit=50&sort=date&filter=tutorial&filter=free');
  console.log(result);
  console.log('Should have proper types and defaults');
  console.log('');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 2: Build search URL
console.log('Task 2: Build search URL from config');
function buildSearchQuery(config) {
  // TODO: Convert config object to query string
}

// Test
try {
  const url = buildSearchQuery({
    query: 'javascript tutorial',
    page: 1,
    limit: 20,
    sort: 'date',
    filters: ['beginner', 'free']
  });
  console.log(url);
  console.log('');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 3: Update search query
console.log('Task 3: Update existing search URL');
function updateSearchUrl(currentUrl, updates) {
  // TODO: Parse current URL, merge updates, rebuild
}

// Test
try {
  const updated = updateSearchUrl(
    '/search?q=nodejs&page=1',
    { page: 2, limit: 50 }
  );
  console.log(updated);
  console.log('Should preserve q, update page, add limit');
  console.log('');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

console.log('=== Exercise 5 Complete ===');
