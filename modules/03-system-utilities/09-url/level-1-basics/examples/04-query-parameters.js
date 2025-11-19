/**
 * Example 4: Working with Query Parameters
 *
 * Demonstrates URLSearchParams API for managing query strings.
 */

console.log('=== Query Parameters Examples ===\n');

// Example 1: Reading query parameters
console.log('1. Reading Query Parameters');
const url1 = new URL('https://example.com/search?q=nodejs&category=tutorials&sort=date');

console.log('Full search string:', url1.search);
console.log('Query "q":', url1.searchParams.get('q'));
console.log('Query "category":', url1.searchParams.get('category'));
console.log('Query "sort":', url1.searchParams.get('sort'));
console.log('Non-existent query:', url1.searchParams.get('page')); // null
console.log('');

// Example 2: Adding query parameters
console.log('2. Adding Query Parameters');
const url2 = new URL('https://api.example.com/products');

url2.searchParams.set('category', 'electronics');
url2.searchParams.set('minPrice', '100');
url2.searchParams.set('maxPrice', '500');

console.log('URL with params:', url2.href);
console.log('');

// Example 3: set() vs append()
console.log('3. set() vs append()');
const url3 = new URL('https://example.com/search');

// set() replaces existing value
url3.searchParams.set('tag', 'javascript');
url3.searchParams.set('tag', 'nodejs');
console.log('After set() twice:');
console.log('  get("tag"):', url3.searchParams.get('tag'));
console.log('  getAll("tag"):', url3.searchParams.getAll('tag'));

// append() adds multiple values
const url4 = new URL('https://example.com/search');
url4.searchParams.append('tag', 'javascript');
url4.searchParams.append('tag', 'nodejs');
url4.searchParams.append('tag', 'backend');
console.log('After append() three times:');
console.log('  get("tag"):', url4.searchParams.get('tag')); // First value
console.log('  getAll("tag"):', url4.searchParams.getAll('tag'));
console.log('  URL:', url4.href);
console.log('');

// Example 4: Checking if parameter exists
console.log('4. Checking Parameter Existence');
const url5 = new URL('https://example.com/page?id=123&draft=true');

console.log('has("id"):', url5.searchParams.has('id'));         // true
console.log('has("draft"):', url5.searchParams.has('draft'));   // true
console.log('has("published"):', url5.searchParams.has('published')); // false
console.log('');

// Example 5: Deleting parameters
console.log('5. Deleting Parameters');
const url6 = new URL('https://example.com/search?q=test&page=1&sort=date&filter=active');

console.log('Before delete:', url6.href);
url6.searchParams.delete('sort');
console.log('After delete("sort"):', url6.href);

url6.searchParams.delete('page');
url6.searchParams.delete('filter');
console.log('After deleting more:', url6.href);
console.log('');

// Example 6: Iterating over parameters
console.log('6. Iterating Over Parameters');
const url7 = new URL('https://example.com/api?name=John&age=30&city=NYC');

console.log('Using for...of loop:');
for (const [key, value] of url7.searchParams) {
  console.log(`  ${key} = ${value}`);
}

console.log('\nUsing forEach:');
url7.searchParams.forEach((value, key) => {
  console.log(`  ${key}: ${value}`);
});

console.log('\nGetting all keys:');
console.log('  Keys:', [...url7.searchParams.keys()]);

console.log('\nGetting all values:');
console.log('  Values:', [...url7.searchParams.values()]);

console.log('\nGetting all entries:');
console.log('  Entries:', [...url7.searchParams.entries()]);
console.log('');

// Example 7: Converting to/from objects
console.log('7. Converting Between Objects and URLSearchParams');

// Object to URLSearchParams
const params = {
  query: 'nodejs',
  limit: 10,
  offset: 0,
  sort: 'relevance'
};

const url8 = new URL('https://api.example.com/search');
Object.entries(params).forEach(([key, value]) => {
  url8.searchParams.set(key, value);
});
console.log('From object:', url8.href);

// URLSearchParams to object
const paramsObject = Object.fromEntries(url8.searchParams);
console.log('To object:', paramsObject);
console.log('');

// Example 8: Special characters and encoding
console.log('8. Special Characters (Automatic Encoding)');
const url9 = new URL('https://example.com/search');

// URLSearchParams handles encoding automatically
url9.searchParams.set('q', 'hello world & special chars!');
url9.searchParams.set('email', 'user@example.com');
url9.searchParams.set('url', 'https://example.com/path?key=value');

console.log('URL with encoded params:', url9.href);
console.log('Decoded "q":', url9.searchParams.get('q'));
console.log('Decoded "email":', url9.searchParams.get('email'));
console.log('Decoded "url":', url9.searchParams.get('url'));
console.log('✓ URLSearchParams automatically handles encoding/decoding!');
console.log('');

// Practical example: Building API query
console.log('=== Practical Example: API Query Builder ===');
function buildApiQuery(endpoint, filters) {
  const url = new URL(endpoint);

  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // Handle arrays by appending multiple values
      value.forEach(v => url.searchParams.append(key, v));
    } else if (value !== null && value !== undefined) {
      // Only add non-null values
      url.searchParams.set(key, value);
    }
  });

  return url.href;
}

const apiUrl = buildApiQuery('https://api.example.com/products', {
  category: 'electronics',
  minPrice: 100,
  maxPrice: 1000,
  brands: ['Sony', 'Samsung', 'LG'],
  inStock: true,
  exclude: null  // This won't be added
});

console.log('Built API URL:');
console.log(apiUrl);
console.log('');

// Summary
console.log('=== Summary ===');
console.log('URLSearchParams methods:');
console.log('✓ get(key)           - Get first value');
console.log('✓ getAll(key)        - Get all values for key');
console.log('✓ set(key, value)    - Set/replace value');
console.log('✓ append(key, value) - Add additional value');
console.log('✓ has(key)           - Check if key exists');
console.log('✓ delete(key)        - Remove parameter');
console.log('✓ keys()             - Get all keys');
console.log('✓ values()           - Get all values');
console.log('✓ entries()          - Get key-value pairs');
console.log('✓ forEach(fn)        - Iterate with callback');
console.log('✓ Automatic encoding/decoding of special characters!');
