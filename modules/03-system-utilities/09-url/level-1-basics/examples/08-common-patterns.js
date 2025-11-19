/**
 * Example 8: Common URL Patterns
 *
 * Demonstrates common real-world patterns for working with URLs.
 */

console.log('=== Common URL Patterns ===\n');

// Pattern 1: Building API URLs
console.log('1. Building API URLs');

function buildApiUrl(baseUrl, endpoint, params = {}) {
  const url = new URL(endpoint, baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, value);
      }
    }
  });

  return url.href;
}

const apiUrl1 = buildApiUrl(
  'https://api.example.com',
  '/v1/users',
  {
    role: 'admin',
    status: 'active',
    fields: ['id', 'name', 'email']
  }
);

console.log('API URL:', apiUrl1);
console.log('');

// Pattern 2: Parsing request URLs in HTTP servers
console.log('2. HTTP Server URL Parsing');

function parseRequestUrl(req) {
  // Simulated req object
  const { url, headers } = req;

  try {
    const parsedUrl = new URL(url, `http://${headers.host}`);

    return {
      pathname: parsedUrl.pathname,
      query: Object.fromEntries(parsedUrl.searchParams),
      hash: parsedUrl.hash
    };
  } catch (err) {
    return null;
  }
}

// Simulate request
const request = {
  url: '/api/users?page=1&limit=10#results',
  headers: { host: 'api.example.com' }
};

const parsed = parseRequestUrl(request);
console.log('Parsed request:', parsed);
console.log('');

// Pattern 3: URL normalization
console.log('3. URL Normalization');

function normalizeUrl(urlString) {
  try {
    const url = new URL(urlString);

    // Convert protocol to lowercase
    url.protocol = url.protocol.toLowerCase();

    // Convert hostname to lowercase
    url.hostname = url.hostname.toLowerCase();

    // Remove default ports
    if ((url.protocol === 'http:' && url.port === '80') ||
        (url.protocol === 'https:' && url.port === '443')) {
      url.port = '';
    }

    // Remove trailing slash from pathname
    if (url.pathname !== '/' && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }

    // Sort query parameters alphabetically
    const params = [...url.searchParams.entries()]
      .sort(([a], [b]) => a.localeCompare(b));

    url.search = '';
    params.forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return url.href;
  } catch (err) {
    return null;
  }
}

console.log('Original:', 'HTTPS://EXAMPLE.COM:443/path/?z=3&a=1');
console.log('Normalized:', normalizeUrl('HTTPS://EXAMPLE.COM:443/path/?z=3&a=1'));
console.log('');

// Pattern 4: Safe redirect URL validator
console.log('4. Safe Redirect Validation');

function getSafeRedirectUrl(redirectUrl, allowedDomains) {
  try {
    const url = new URL(redirectUrl);

    // Check protocol
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '/'; // Default safe redirect
    }

    // Check if domain is allowed
    if (allowedDomains.includes(url.hostname)) {
      return url.href;
    }

    return '/'; // Default safe redirect
  } catch (err) {
    return '/'; // Invalid URL - default safe redirect
  }
}

const allowedDomains = ['example.com', 'app.example.com', 'api.example.com'];

console.log('Safe redirect tests:');
console.log('Valid:', getSafeRedirectUrl('https://example.com/page', allowedDomains));
console.log('Valid:', getSafeRedirectUrl('https://app.example.com/dashboard', allowedDomains));
console.log('Invalid (evil domain):', getSafeRedirectUrl('https://evil.com', allowedDomains));
console.log('Invalid (javascript:):', getSafeRedirectUrl('javascript:alert(1)', allowedDomains));
console.log('');

// Pattern 5: Query parameter merger
console.log('5. Merging Query Parameters');

function mergeQueryParams(urlString, newParams) {
  const url = new URL(urlString);

  Object.entries(newParams).forEach(([key, value]) => {
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });

  return url.href;
}

const baseUrl = 'https://example.com/search?q=nodejs&page=1&filter=active';
const merged = mergeQueryParams(baseUrl, {
  page: 2,
  filter: null,  // Remove this param
  sort: 'date'   // Add new param
});

console.log('Original:', baseUrl);
console.log('Merged:', merged);
console.log('');

// Pattern 6: Extract domain from URL
console.log('6. Domain Extraction');

function extractDomain(urlString) {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (err) {
    return null;
  }
}

function extractRootDomain(urlString) {
  try {
    const url = new URL(urlString);
    const parts = url.hostname.split('.');

    // Get last two parts (domain.tld)
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }

    return url.hostname;
  } catch (err) {
    return null;
  }
}

const testDomains = [
  'https://www.example.com/path',
  'https://api.subdomain.example.com/endpoint',
  'https://example.co.uk/page'
];

testDomains.forEach(url => {
  console.log('URL:', url);
  console.log('  Full domain:', extractDomain(url));
  console.log('  Root domain:', extractRootDomain(url));
});
console.log('');

// Pattern 7: Pagination URL builder
console.log('7. Pagination URL Builder');

function buildPaginationUrls(baseUrl, currentPage, totalPages) {
  const url = new URL(baseUrl);

  const pages = {
    first: null,
    previous: null,
    current: null,
    next: null,
    last: null
  };

  // First page
  const firstUrl = new URL(url);
  firstUrl.searchParams.set('page', '1');
  pages.first = firstUrl.href;

  // Previous page
  if (currentPage > 1) {
    const prevUrl = new URL(url);
    prevUrl.searchParams.set('page', String(currentPage - 1));
    pages.previous = prevUrl.href;
  }

  // Current page
  const currentUrl = new URL(url);
  currentUrl.searchParams.set('page', String(currentPage));
  pages.current = currentUrl.href;

  // Next page
  if (currentPage < totalPages) {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set('page', String(currentPage + 1));
    pages.next = nextUrl.href;
  }

  // Last page
  const lastUrl = new URL(url);
  lastUrl.searchParams.set('page', String(totalPages));
  pages.last = lastUrl.href;

  return pages;
}

const pagination = buildPaginationUrls(
  'https://example.com/products?category=electronics',
  3,  // current page
  10  // total pages
);

console.log('Pagination URLs:');
console.log('First:', pagination.first);
console.log('Previous:', pagination.previous);
console.log('Current:', pagination.current);
console.log('Next:', pagination.next);
console.log('Last:', pagination.last);
console.log('');

// Pattern 8: URL shortener mapper
console.log('8. URL Shortener Pattern');

class UrlShortener {
  constructor() {
    this.urls = new Map();
    this.counter = 1000;
  }

  shorten(longUrl) {
    // Validate URL
    try {
      new URL(longUrl);
    } catch (err) {
      throw new Error('Invalid URL');
    }

    // Generate short code
    const shortCode = this.counter.toString(36);
    this.counter++;

    // Store mapping
    this.urls.set(shortCode, longUrl);

    return `https://short.url/${shortCode}`;
  }

  expand(shortUrl) {
    try {
      const url = new URL(shortUrl);
      const shortCode = url.pathname.slice(1);

      return this.urls.get(shortCode) || null;
    } catch (err) {
      return null;
    }
  }
}

const shortener = new UrlShortener();

const long1 = 'https://example.com/very/long/path/to/article?id=12345&category=technology';
const short1 = shortener.shorten(long1);
console.log('Long URL:', long1);
console.log('Short URL:', short1);
console.log('Expanded:', shortener.expand(short1));
console.log('');

// Summary
console.log('=== Summary ===');
console.log('Common URL patterns:');
console.log('✓ API URL building with parameters');
console.log('✓ HTTP request URL parsing');
console.log('✓ URL normalization for comparison');
console.log('✓ Safe redirect validation');
console.log('✓ Query parameter merging');
console.log('✓ Domain extraction');
console.log('✓ Pagination URL generation');
console.log('✓ URL shortening logic');
