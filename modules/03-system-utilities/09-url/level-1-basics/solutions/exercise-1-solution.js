/**
 * Exercise 1 Solutions: URL Parsing and Component Extraction
 */

console.log('=== Exercise 1 Solutions ===\n');

// Task 1 Solution
console.log('Task 1: Extract URL Components');
function parseUrlComponents(urlString) {
  try {
    const url = new URL(urlString);
    return {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
      href: url.href
    };
  } catch (err) {
    return null;
  }
}

const testUrls = [
  'https://www.example.com:8080/products/123?category=electronics&sort=price#reviews',
  'http://localhost:3000/api/users?page=1',
  'https://user:pass@example.com/admin#dashboard'
];

testUrls.forEach((url, index) => {
  console.log(`Test ${index + 1}:`, url);
  const result = parseUrlComponents(url);
  console.log('Result:', result);
  console.log('');
});

// Task 2 Solution
console.log('Task 2: Extract Query Parameters as Object');
function extractQueryParams(urlString) {
  try {
    const url = new URL(urlString);
    return Object.fromEntries(url.searchParams);
  } catch (err) {
    return {};
  }
}

const queryUrls = [
  'https://example.com/search?q=nodejs&limit=10&page=1',
  'https://example.com/products?category=electronics&minPrice=100&maxPrice=500'
];

queryUrls.forEach((url, index) => {
  console.log(`Test ${index + 1}:`, url);
  const params = extractQueryParams(url);
  console.log('Parameters:', params);
  console.log('');
});

// Task 3 Solution
console.log('Task 3: Check Protocol');
function isHttps(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

const protocolTests = [
  'https://example.com',
  'http://example.com',
  'ftp://files.example.com',
  'invalid-url'
];

protocolTests.forEach(url => {
  const result = isHttps(url);
  console.log(`${url} - HTTPS: ${result}`);
});
console.log('');

// Task 4 Solution
console.log('Task 4: Extract Hostname');
function getHostname(urlString) {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (err) {
    return null;
  }
}

const hostnameTests = [
  'https://www.example.com/path',
  'https://api.subdomain.example.com/endpoint',
  'http://localhost:3000',
  'https://192.168.1.1/admin'
];

hostnameTests.forEach(url => {
  const hostname = getHostname(url);
  console.log(`${url}\n  Hostname: ${hostname}\n`);
});

// Task 5 Solution
console.log('Task 5: Compare Origins');
function haveSameOrigin(url1, url2) {
  try {
    const urlObj1 = new URL(url1);
    const urlObj2 = new URL(url2);
    return urlObj1.origin === urlObj2.origin;
  } catch (err) {
    return false;
  }
}

const originTests = [
  ['https://example.com/page1', 'https://example.com/page2'],
  ['https://example.com:443/page', 'https://example.com/page'],
  ['http://example.com', 'https://example.com'],
  ['https://example.com', 'https://api.example.com']
];

originTests.forEach(([url1, url2], index) => {
  const same = haveSameOrigin(url1, url2);
  console.log(`Test ${index + 1}:`);
  console.log(`  ${url1}`);
  console.log(`  ${url2}`);
  console.log(`  Same origin: ${same}\n`);
});

console.log('=== All Solutions Demonstrated ===');
