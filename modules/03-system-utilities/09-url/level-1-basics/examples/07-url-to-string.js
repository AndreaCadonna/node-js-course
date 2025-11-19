/**
 * Example 7: URL to String Conversions
 *
 * Demonstrates different ways to convert URL objects to strings
 * and extract specific parts as strings.
 */

console.log('=== URL to String Conversions ===\n');

// Example 1: href property (complete URL)
console.log('1. Using href Property');
const url1 = new URL('https://example.com/path?key=value#section');
console.log('url.href:', url1.href);
console.log('Type:', typeof url1.href);
console.log('');

// Example 2: toString() method
console.log('2. Using toString() Method');
const url2 = new URL('https://example.com/products');
console.log('url.toString():', url2.toString());
console.log('href === toString():', url2.href === url2.toString());
console.log('');

// Example 3: Getting individual parts as strings
console.log('3. Getting Individual Parts');
const url3 = new URL('https://user:pass@example.com:8080/api/v1?page=1#top');

console.log('Protocol:', url3.protocol);      // String: 'https:'
console.log('Username:', url3.username);      // String: 'user'
console.log('Password:', url3.password);      // String: 'pass'
console.log('Hostname:', url3.hostname);      // String: 'example.com'
console.log('Port:', url3.port);              // String: '8080'
console.log('Host:', url3.host);              // String: 'example.com:8080'
console.log('Pathname:', url3.pathname);      // String: '/api/v1'
console.log('Search:', url3.search);          // String: '?page=1'
console.log('Hash:', url3.hash);              // String: '#top'
console.log('Origin:', url3.origin);          // String: 'https://example.com:8080'
console.log('');

// Example 4: URLSearchParams to string
console.log('4. URLSearchParams to String');
const url4 = new URL('https://example.com/search');
url4.searchParams.set('q', 'nodejs');
url4.searchParams.set('category', 'tutorials');
url4.searchParams.set('sort', 'date');

console.log('searchParams.toString():', url4.searchParams.toString());
console.log('search property:', url4.search);
console.log('');

// Example 5: Building path + query string
console.log('5. Path with Query String');
const url5 = new URL('https://api.example.com/users?status=active&role=admin');

const pathWithQuery = url5.pathname + url5.search;
console.log('Pathname + Search:', pathWithQuery);
console.log('Use case: Express.js routes, redirects');
console.log('');

// Example 6: Building relative URLs
console.log('6. Relative URLs');
const url6 = new URL('https://example.com/products/electronics?page=2#details');

// Relative URL (no protocol/host)
const relativeUrl = url6.pathname + url6.search + url6.hash;
console.log('Relative URL:', relativeUrl);

// Just path and query (no hash)
const pathAndQuery = url6.pathname + url6.search;
console.log('Path + Query:', pathAndQuery);

// Just path
const justPath = url6.pathname;
console.log('Just Path:', justPath);
console.log('');

// Example 7: Template literals with URL parts
console.log('7. Using URL Parts in Templates');
const url7 = new URL('https://api.github.com/repos/nodejs/node');

const message = `Fetching from ${url7.hostname} at ${url7.pathname}`;
console.log(message);

const apiCall = `Protocol: ${url7.protocol.replace(':', '')}
Host: ${url7.host}
Endpoint: ${url7.pathname}`;
console.log(apiCall);
console.log('');

// Example 8: JSON serialization
console.log('8. JSON Serialization');
const url8 = new URL('https://example.com/api?key=value');

// URL object can't be directly JSON.stringify'd usefully
console.log('Direct JSON.stringify(url):');
console.log(JSON.stringify(url8)); // Not very useful

// Better: Extract the parts you need
const urlData = {
  href: url8.href,
  protocol: url8.protocol,
  hostname: url8.hostname,
  pathname: url8.pathname,
  params: Object.fromEntries(url8.searchParams)
};

console.log('\nURL as JSON object:');
console.log(JSON.stringify(urlData, null, 2));
console.log('');

// Practical example: URL to object converter
console.log('=== Practical Example: URL to Object ===');

function urlToObject(urlString) {
  const url = new URL(urlString);

  return {
    href: url.href,
    origin: url.origin,
    protocol: url.protocol.replace(':', ''),
    username: url.username || undefined,
    password: url.password || undefined,
    host: url.host,
    hostname: url.hostname,
    port: url.port || undefined,
    pathname: url.pathname,
    search: url.search,
    searchParams: Object.fromEntries(url.searchParams),
    hash: url.hash.replace('#', '') || undefined
  };
}

const complexUrl = 'https://user:pass@api.example.com:8080/v2/products?category=electronics&sort=price#results';
const urlObj = urlToObject(complexUrl);

console.log('URL Object:');
console.log(JSON.stringify(urlObj, null, 2));
console.log('');

// Practical example: URL formatter
console.log('=== Practical Example: URL Formatter ===');

function formatUrl(urlString, options = {}) {
  const {
    showProtocol = true,
    showAuth = false,
    showPort = true,
    showPath = true,
    showQuery = true,
    showHash = true
  } = options;

  const url = new URL(urlString);
  let formatted = '';

  if (showProtocol) {
    formatted += url.protocol + '//';
  }

  if (showAuth && url.username) {
    formatted += url.username;
    if (url.password) {
      formatted += ':' + url.password;
    }
    formatted += '@';
  }

  formatted += url.hostname;

  if (showPort && url.port) {
    formatted += ':' + url.port;
  }

  if (showPath) {
    formatted += url.pathname;
  }

  if (showQuery && url.search) {
    formatted += url.search;
  }

  if (showHash && url.hash) {
    formatted += url.hash;
  }

  return formatted;
}

const testUrl = 'https://user:pass@example.com:8080/path?key=value#section';

console.log('Full URL:', formatUrl(testUrl));
console.log('Without auth:', formatUrl(testUrl, { showAuth: false }));
console.log('Without query:', formatUrl(testUrl, { showQuery: false }));
console.log('Domain only:', formatUrl(testUrl, {
  showProtocol: false,
  showPort: false,
  showPath: false,
  showQuery: false,
  showHash: false
}));
console.log('');

// Summary
console.log('=== Summary ===');
console.log('Converting URL to string:');
console.log('✓ url.href          - Complete URL');
console.log('✓ url.toString()    - Same as href');
console.log('✓ url.pathname      - Path only');
console.log('✓ url.search        - Query string with ?');
console.log('✓ url.hash          - Fragment with #');
console.log('✓ searchParams.toString() - Query without ?');
console.log('');
console.log('Common combinations:');
console.log('✓ pathname + search + hash  - Relative URL');
console.log('✓ pathname + search         - Path with params');
console.log('✓ origin + pathname         - Absolute path');
