/**
 * Example 2: Basic Query String Stringifying
 *
 * Demonstrates how to convert JavaScript objects into query strings
 * using the querystring.stringify() method.
 */

const querystring = require('querystring');

console.log('=== Basic Query String Stringifying ===\n');

// 1. Simple object to query string
console.log('1. Simple object');
const simple = { name: 'John', age: 30 };
const simpleStr = querystring.stringify(simple);
console.log('Object:', simple);
console.log('Query string:', simpleStr);
console.log('Full URL: /user?' + simpleStr);
console.log('');

// 2. Multiple properties
console.log('2. Multiple properties');
const product = {
  id: '12345',
  name: 'Laptop',
  price: 999,
  inStock: true
};
const productStr = querystring.stringify(product);
console.log('Object:', product);
console.log('Query string:', productStr);
console.log('');

// 3. Strings with spaces (automatic encoding)
console.log('3. Automatic URL encoding');
const withSpaces = {
  name: 'John Doe',
  city: 'New York',
  country: 'United States'
};
const encoded = querystring.stringify(withSpaces);
console.log('Object:', withSpaces);
console.log('Query string:', encoded);
console.log('Notice: Spaces become %20');
console.log('');

// 4. Special characters
console.log('4. Special characters encoding');
const special = {
  email: 'user@example.com',
  message: 'Hello & goodbye!',
  tags: 'nodejs, express, api'
};
const specialStr = querystring.stringify(special);
console.log('Object:', special);
console.log('Query string:', specialStr);
console.log('');

// 5. Arrays (repeated keys)
console.log('5. Arrays become repeated keys');
const colors = {
  size: 'large',
  color: ['red', 'blue', 'green']
};
const colorsStr = querystring.stringify(colors);
console.log('Object:', colors);
console.log('Query string:', colorsStr);
console.log('Notice: color appears multiple times');
console.log('');

// 6. Numbers and booleans
console.log('6. Numbers and booleans');
const mixed = {
  page: 1,
  limit: 20,
  active: true,
  verified: false,
  price: 99.99
};
const mixedStr = querystring.stringify(mixed);
console.log('Object:', mixed);
console.log('Query string:', mixedStr);
console.log('Note: All values converted to strings');
console.log('');

// 7. Null and undefined handling
console.log('7. Null and undefined values');
const nullValues = {
  name: 'John',
  email: null,
  phone: undefined,
  age: 30
};
const nullStr = querystring.stringify(nullValues);
console.log('Object:', nullValues);
console.log('Query string:', nullStr);
console.log('Note: null and undefined become empty strings');
console.log('');

// 8. Empty strings
console.log('8. Empty string values');
const empty = {
  name: 'John',
  email: '',
  notes: ''
};
const emptyStr = querystring.stringify(empty);
console.log('Object:', empty);
console.log('Query string:', emptyStr);
console.log('');

// 9. Building a complete URL
console.log('9. Building complete URLs');
const basePath = '/api/products';
const params = {
  category: 'electronics',
  minPrice: 100,
  maxPrice: 1000,
  sort: 'price'
};
const queryStr = querystring.stringify(params);
const fullUrl = `${basePath}?${queryStr}`;
console.log('Base path:', basePath);
console.log('Parameters:', params);
console.log('Full URL:', fullUrl);
console.log('');

// 10. Real-world: Search URL builder
console.log('10. Real-world: Search URL builder');
function buildSearchUrl(searchTerm, filters = {}) {
  const params = {
    q: searchTerm,
    ...filters
  };
  return `/search?${querystring.stringify(params)}`;
}

const url1 = buildSearchUrl('nodejs tutorial');
console.log('Search "nodejs tutorial":', url1);

const url2 = buildSearchUrl('javascript', { sort: 'date', page: 2 });
console.log('Search "javascript" with filters:', url2);
console.log('');

// 11. Conditional parameters
console.log('11. Conditional parameters (clean URLs)');
function buildProductUrl(filters) {
  const params = {};

  // Only add non-empty values
  if (filters.category) params.category = filters.category;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.sort) params.sort = filters.sort;

  const queryStr = querystring.stringify(params);
  return queryStr ? `/products?${queryStr}` : '/products';
}

const cleanUrl1 = buildProductUrl({ category: 'books', sort: 'price' });
console.log('With filters:', cleanUrl1);

const cleanUrl2 = buildProductUrl({});
console.log('Without filters:', cleanUrl2);
console.log('');

// 12. Round-trip: Parse and stringify
console.log('12. Round-trip conversion');
const original = 'name=John&age=30&city=NYC';
console.log('Original string:', original);

const parsed = querystring.parse(original);
console.log('Parsed object:', parsed);

const stringified = querystring.stringify(parsed);
console.log('Stringified back:', stringified);
console.log('Match:', original === stringified);
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Use stringify() to convert objects to query strings');
console.log('✓ Special characters are automatically encoded');
console.log('✓ Arrays become repeated keys');
console.log('✓ null and undefined become empty strings');
console.log('✓ All values are converted to strings');
console.log('✓ Use template literals to build full URLs');
