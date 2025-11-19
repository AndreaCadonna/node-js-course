/**
 * Example 5: Integration with URL Module
 *
 * Demonstrates how to use querystring with the url module
 * to parse and build complete URLs.
 */

const querystring = require('querystring');
const url = require('url');

console.log('=== Query String + URL Module Integration ===\n');

// 1. Parsing a complete URL
console.log('1. Parsing complete URL');
const fullUrl = 'https://example.com/search?q=nodejs&category=tutorial&page=2';

// Using legacy url.parse (deprecated but still common)
const parsedUrl = url.parse(fullUrl, true); // true = parse query string
console.log('Full URL:', fullUrl);
console.log('Protocol:', parsedUrl.protocol);
console.log('Host:', parsedUrl.host);
console.log('Pathname:', parsedUrl.pathname);
console.log('Query (parsed):', parsedUrl.query);
console.log('');

// 2. Manual query string extraction
console.log('2. Manual query string extraction');
const fullUrl2 = 'https://shop.com/products?category=electronics&minPrice=100&maxPrice=1000';
const questionIndex = fullUrl2.indexOf('?');

if (questionIndex !== -1) {
  const queryStr = fullUrl2.substring(questionIndex + 1);
  const params = querystring.parse(queryStr);
  console.log('URL:', fullUrl2);
  console.log('Query string:', queryStr);
  console.log('Parsed params:', params);
}
console.log('');

// 3. Building URLs from parts
console.log('3. Building complete URLs');
const baseUrl = 'https://api.example.com/v1/users';
const queryParams = {
  role: 'admin',
  active: true,
  limit: 50
};
const queryStr = querystring.stringify(queryParams);
const completeUrl = `${baseUrl}?${queryStr}`;

console.log('Base URL:', baseUrl);
console.log('Parameters:', queryParams);
console.log('Complete URL:', completeUrl);
console.log('');

// 4. URL constructor (modern approach)
console.log('4. Modern URL constructor');
const baseUrl2 = 'https://example.com/search';
const modernUrl = new URL(baseUrl2);

// Add query parameters
modernUrl.searchParams.append('q', 'nodejs');
modernUrl.searchParams.append('page', '1');
modernUrl.searchParams.append('limit', '20');

console.log('Base:', baseUrl2);
console.log('Final URL:', modernUrl.toString());
console.log('Query string:', modernUrl.search);
console.log('');

// 5. Extracting query from URL object
console.log('5. Extract query from URL object');
const urlObj = new URL('https://example.com/api?name=John&age=30&city=NYC');

// Get query string (without ?)
const queryOnly = urlObj.search.substring(1);
const params = querystring.parse(queryOnly);

console.log('URL:', urlObj.href);
console.log('Search (with ?):', urlObj.search);
console.log('Query string:', queryOnly);
console.log('Parsed:', params);
console.log('');

// 6. Building search URLs
console.log('6. Building search URLs');
function buildSearchUrl(baseUrl, searchTerm, filters = {}) {
  const params = {
    q: searchTerm,
    ...filters
  };
  const queryStr = querystring.stringify(params);
  return `${baseUrl}?${queryStr}`;
}

const search1 = buildSearchUrl('https://example.com/search', 'nodejs tutorial');
const search2 = buildSearchUrl('https://example.com/search', 'javascript', {
  sort: 'date',
  time: 'year'
});

console.log('Simple search:', search1);
console.log('Search with filters:', search2);
console.log('');

// 7. API endpoint builder
console.log('7. API endpoint builder');
class ApiUrlBuilder {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  build(endpoint, params = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    if (Object.keys(params).length === 0) {
      return url;
    }
    return `${url}?${querystring.stringify(params)}`;
  }
}

const api = new ApiUrlBuilder('https://api.example.com/v1');
console.log('Get users:', api.build('/users'));
console.log('Filter users:', api.build('/users', { role: 'admin', active: true }));
console.log('Get user:', api.build('/users/123'));
console.log('Search posts:', api.build('/posts', { q: 'nodejs', limit: 10 }));
console.log('');

// 8. Relative URLs
console.log('8. Building relative URLs');
function buildRelativeUrl(path, params) {
  if (Object.keys(params).length === 0) {
    return path;
  }
  return `${path}?${querystring.stringify(params)}`;
}

console.log(buildRelativeUrl('/products', { category: 'books' }));
console.log(buildRelativeUrl('/search', { q: 'nodejs', page: 1 }));
console.log(buildRelativeUrl('/home', {}));
console.log('');

// 9. Preserving existing query parameters
console.log('9. Preserving and adding query parameters');
function addQueryParams(urlStr, newParams) {
  const urlObj = new URL(urlStr);

  // Parse existing params
  const existing = querystring.parse(urlObj.search.substring(1));

  // Merge with new params
  const merged = { ...existing, ...newParams };

  // Build new URL
  urlObj.search = querystring.stringify(merged);

  return urlObj.toString();
}

const originalUrl = 'https://example.com/page?existing=value&foo=bar';
const updatedUrl = addQueryParams(originalUrl, { new: 'param', page: 2 });

console.log('Original:', originalUrl);
console.log('Updated:', updatedUrl);
console.log('');

// 10. Removing query parameters
console.log('10. Removing specific query parameters');
function removeQueryParams(urlStr, paramsToRemove) {
  const urlObj = new URL(urlStr);
  const existing = querystring.parse(urlObj.search.substring(1));

  // Remove specified params
  paramsToRemove.forEach(param => delete existing[param]);

  // Rebuild URL
  const newQuery = querystring.stringify(existing);
  urlObj.search = newQuery ? `?${newQuery}` : '';

  return urlObj.toString();
}

const urlWithParams = 'https://example.com/page?a=1&b=2&c=3&d=4';
const urlWithoutB = removeQueryParams(urlWithParams, ['b', 'd']);

console.log('Original:', urlWithParams);
console.log('After removing b, d:', urlWithoutB);
console.log('');

// 11. Pagination helper
console.log('11. Pagination URL helper');
function buildPaginationUrls(baseUrl, currentPage, totalPages, params = {}) {
  const buildUrl = (page) => {
    const allParams = { ...params, page };
    return `${baseUrl}?${querystring.stringify(allParams)}`;
  };

  return {
    first: buildUrl(1),
    prev: currentPage > 1 ? buildUrl(currentPage - 1) : null,
    current: buildUrl(currentPage),
    next: currentPage < totalPages ? buildUrl(currentPage + 1) : null,
    last: buildUrl(totalPages)
  };
}

const pagination = buildPaginationUrls('/products', 3, 10, {
  category: 'electronics',
  sort: 'price'
});

console.log('Pagination URLs:', JSON.stringify(pagination, null, 2));
console.log('');

// 12. Real-world: Product filter URL
console.log('12. Real-world: E-commerce product filters');
function buildProductFilterUrl(filters) {
  const params = {};

  if (filters.category) params.category = filters.category;
  if (filters.brand) params.brand = filters.brand;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.sort) params.sort = filters.sort;
  if (filters.inStock !== undefined) params.inStock = filters.inStock;
  if (filters.colors && filters.colors.length > 0) params.color = filters.colors;

  const queryStr = querystring.stringify(params);
  return `/products${queryStr ? '?' + queryStr : ''}`;
}

const filterUrl1 = buildProductFilterUrl({
  category: 'laptops',
  minPrice: 500,
  maxPrice: 2000,
  colors: ['black', 'silver'],
  sort: 'price',
  inStock: true
});

console.log('Filter URL:', filterUrl1);
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Use url.parse() to extract query strings from URLs');
console.log('✓ Combine paths with ? and querystring.stringify()');
console.log('✓ Modern approach: use URL constructor');
console.log('✓ Build helper functions for common URL patterns');
console.log('✓ Merge existing and new parameters carefully');
console.log('✓ Handle empty parameter objects gracefully');
