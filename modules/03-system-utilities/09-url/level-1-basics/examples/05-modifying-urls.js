/**
 * Example 5: Modifying URLs
 *
 * Demonstrates how to modify URL components after creation.
 * URL objects are mutable - their properties can be changed.
 */

console.log('=== Modifying URLs ===\n');

// Example 1: Changing the protocol
console.log('1. Changing Protocol');
const url1 = new URL('http://example.com/page');
console.log('Original:', url1.href);

url1.protocol = 'https:';
console.log('After changing protocol:', url1.href);
console.log('Note: Protocol must include the colon (:)');
console.log('');

// Example 2: Changing hostname
console.log('2. Changing Hostname');
const url2 = new URL('https://old-domain.com/api/users');
console.log('Original:', url2.href);

url2.hostname = 'new-domain.com';
console.log('After changing hostname:', url2.href);
console.log('');

// Example 3: Changing port
console.log('3. Changing Port');
const url3 = new URL('https://example.com/api');
console.log('Original:', url3.href);
console.log('Original port:', url3.port || '(default 443)');

url3.port = '8080';
console.log('After setting port 8080:', url3.href);

url3.port = '';
console.log('After clearing port:', url3.href);
console.log('');

// Example 4: Changing pathname
console.log('4. Changing Pathname');
const url4 = new URL('https://api.example.com/v1/users');
console.log('Original:', url4.href);

url4.pathname = '/v2/customers';
console.log('After changing pathname:', url4.href);

// Pathname must start with /
url4.pathname = 'products'; // Automatically adds /
console.log('Setting "products" (no /):', url4.href);
console.log('');

// Example 5: Modifying search/query string
console.log('5. Modifying Query String');
const url5 = new URL('https://example.com/search?old=value');
console.log('Original:', url5.href);

// Method 1: Replace entire search string
url5.search = '?new=value&another=param';
console.log('After setting search:', url5.href);

// Method 2: Using searchParams (better)
url5.searchParams.delete('new');
url5.searchParams.set('query', 'nodejs');
url5.searchParams.set('limit', '10');
console.log('After using searchParams:', url5.href);
console.log('');

// Example 6: Changing hash
console.log('6. Changing Hash');
const url6 = new URL('https://example.com/page#old-section');
console.log('Original:', url6.href);

url6.hash = '#new-section';
console.log('After changing hash:', url6.href);

url6.hash = ''; // Remove hash
console.log('After removing hash:', url6.href);
console.log('');

// Example 7: Building URLs piece by piece
console.log('7. Building URL from Scratch');
const url7 = new URL('https://example.com');
console.log('Starting with:', url7.href);

url7.pathname = '/api/v2/products';
console.log('After pathname:', url7.href);

url7.searchParams.set('category', 'electronics');
console.log('After adding category:', url7.href);

url7.searchParams.set('sort', 'price');
console.log('After adding sort:', url7.href);

url7.searchParams.set('order', 'asc');
console.log('After adding order:', url7.href);

url7.hash = '#results';
console.log('After adding hash:', url7.href);
console.log('');

// Example 8: Chaining modifications
console.log('8. Multiple Modifications');
const url8 = new URL('http://staging.example.com:3000/old-api?debug=true#test');
console.log('Original:', url8.href);

// Make multiple changes
url8.protocol = 'https:';
url8.hostname = 'api.example.com';
url8.port = ''; // Use default port
url8.pathname = '/v3/data';
url8.searchParams.delete('debug');
url8.searchParams.set('format', 'json');
url8.searchParams.set('limit', '100');
url8.hash = '';

console.log('After modifications:', url8.href);
console.log('');

// Practical example: Environment-based URL modification
console.log('=== Practical Example: Environment URLs ===');
function getApiUrl(endpoint, environment = 'production') {
  let baseUrl;

  switch (environment) {
    case 'development':
      baseUrl = 'http://localhost:3000';
      break;
    case 'staging':
      baseUrl = 'https://staging-api.example.com';
      break;
    case 'production':
      baseUrl = 'https://api.example.com';
      break;
    default:
      baseUrl = 'https://api.example.com';
  }

  const url = new URL(endpoint, baseUrl);

  // Add environment-specific params
  if (environment === 'development') {
    url.searchParams.set('debug', 'true');
  }

  return url.href;
}

console.log('Development:', getApiUrl('/users', 'development'));
console.log('Staging:', getApiUrl('/users', 'staging'));
console.log('Production:', getApiUrl('/users', 'production'));
console.log('');

// Practical example: URL parameter updater
console.log('=== Practical Example: Update Query Params ===');
function updateUrlParams(urlString, updates) {
  const url = new URL(urlString);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });

  return url.href;
}

const originalUrl = 'https://example.com/search?q=old&page=1&filter=active';
const updated = updateUrlParams(originalUrl, {
  q: 'new search',
  page: 2,
  filter: null,  // Remove this param
  sort: 'date'   // Add new param
});

console.log('Original:', originalUrl);
console.log('Updated:', updated);
console.log('');

// Summary
console.log('=== Summary ===');
console.log('URL properties are writable:');
console.log('✓ url.protocol   = "https:"');
console.log('✓ url.hostname   = "example.com"');
console.log('✓ url.port       = "8080"');
console.log('✓ url.pathname   = "/path"');
console.log('✓ url.search     = "?key=value"');
console.log('✓ url.hash       = "#section"');
console.log('');
console.log('Best practices:');
console.log('✓ Use searchParams for query manipulation');
console.log('✓ Build URLs programmatically instead of string concatenation');
console.log('✓ Validate URLs after modification');
console.log('✓ Use environment-specific URL building');
