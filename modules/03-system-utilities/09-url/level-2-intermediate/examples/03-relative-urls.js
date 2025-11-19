/**
 * Example 3: Relative URL Resolution
 *
 * Demonstrates how to work with relative URLs and understand
 * path resolution rules.
 */

console.log('=== Relative URL Resolution ===\n');

// Example 1: Basic relative URL resolution
console.log('1. Basic Relative URLs');

const base = 'https://example.com/products/electronics/';

const relatives = [
  'phones',
  './phones',
  '../clothing',
  '/api/users',
  '//cdn.example.com/assets'
];

console.log('Base URL:', base);
console.log('\nResolutions:');
relatives.forEach(relative => {
  const resolved = new URL(relative, base);
  console.log(`"${relative}" →`);
  console.log(`  ${resolved.href}`);
});
console.log('');

// Example 2: Understanding path resolution rules
console.log('2. Path Resolution Rules');

const baseUrl = 'https://example.com/a/b/c/page.html';

const testCases = [
  { path: 'file.html', description: 'Relative to current directory' },
  { path: './file.html', description: 'Explicit current directory' },
  { path: '../file.html', description: 'Parent directory' },
  { path: '../../file.html', description: 'Grandparent directory' },
  { path: '/file.html', description: 'Absolute from root' },
  { path: 'd/file.html', description: 'Subdirectory' },
  { path: './d/e/file.html', description: 'Nested subdirectories' }
];

console.log('Base:', baseUrl);
console.log('\nResolutions:');
testCases.forEach(({ path, description }) => {
  const resolved = new URL(path, baseUrl);
  console.log(`${path}`);
  console.log(`  (${description})`);
  console.log(`  → ${resolved.pathname}`);
  console.log('');
});

// Example 3: Resolving with different base contexts
console.log('3. Different Base Contexts');

function resolveUrl(relative, base) {
  try {
    const resolved = new URL(relative, base);
    return resolved.href;
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

const bases = [
  'https://example.com',
  'https://example.com/',
  'https://example.com/path',
  'https://example.com/path/',
  'https://example.com/path/to/page.html'
];

const relativePath = 'api/users';

console.log(`Resolving "${relativePath}" against different bases:\n`);
bases.forEach(baseUrl => {
  const resolved = resolveUrl(relativePath, baseUrl);
  console.log(`Base: ${baseUrl}`);
  console.log(`  → ${resolved}`);
  console.log('');
});

// Example 4: Protocol-relative URLs
console.log('4. Protocol-Relative URLs');

const protocolRelative = '//cdn.example.com/assets/style.css';

const httpBase = 'http://example.com';
const httpsBase = 'https://example.com';

console.log('Protocol-relative URL:', protocolRelative);
console.log('\nResolved against HTTP base:');
console.log('  ', new URL(protocolRelative, httpBase).href);
console.log('\nResolved against HTTPS base:');
console.log('  ', new URL(protocolRelative, httpsBase).href);
console.log('');

// Example 5: Building navigation URLs
console.log('5. Navigation URL Builder');

class NavigationBuilder {
  constructor(currentUrl) {
    this.url = new URL(currentUrl);
  }

  navigate(path) {
    // Navigate to a new path, preserving query and hash if needed
    const newUrl = new URL(path, this.url.href);
    this.url = newUrl;
    return this;
  }

  back() {
    // Go up one directory level
    const pathname = this.url.pathname;
    const segments = pathname.split('/').filter(s => s);
    segments.pop();
    this.url.pathname = '/' + segments.join('/') + (segments.length ? '/' : '');
    return this;
  }

  toRoot() {
    this.url.pathname = '/';
    return this;
  }

  preserveQuery() {
    // Mark to preserve query parameters
    this._preserveQuery = true;
    return this;
  }

  getUrl() {
    return this.url.href;
  }
}

const nav = new NavigationBuilder('https://example.com/products/electronics/phones');
console.log('Starting at:', nav.getUrl());

nav.navigate('../computers');
console.log('After navigate("../computers"):', nav.getUrl());

nav.back();
console.log('After back():', nav.getUrl());

nav.toRoot();
console.log('After toRoot():', nav.getUrl());
console.log('');

// Example 6: Resolving href attributes
console.log('6. Resolving HTML hrefs');

function resolveHtmlHrefs(htmlSnippet, pageUrl) {
  const baseUrl = new URL(pageUrl);
  const hrefPattern = /href=["']([^"']+)["']/g;
  const resolved = [];

  let match;
  while ((match = hrefPattern.exec(htmlSnippet)) !== null) {
    const href = match[1];
    try {
      const absoluteUrl = new URL(href, baseUrl.href);
      resolved.push({
        original: href,
        resolved: absoluteUrl.href,
        isExternal: absoluteUrl.origin !== baseUrl.origin
      });
    } catch (err) {
      resolved.push({
        original: href,
        resolved: null,
        error: err.message
      });
    }
  }

  return resolved;
}

const html = `
  <a href="/about">About</a>
  <a href="../contact">Contact</a>
  <a href="products/new">New Products</a>
  <a href="https://external.com">External Link</a>
  <a href="javascript:void(0)">Invalid</a>
`;

const currentPage = 'https://example.com/pages/info/';
const resolvedHrefs = resolveHtmlHrefs(html, currentPage);

console.log('Page URL:', currentPage);
console.log('\nResolved hrefs:');
resolvedHrefs.forEach(({ original, resolved, isExternal, error }) => {
  console.log(`"${original}"`);
  if (error) {
    console.log(`  Error: ${error}`);
  } else {
    console.log(`  → ${resolved}`);
    if (isExternal) console.log('  (External link)');
  }
});
console.log('');

// Example 7: Canonical URL resolution
console.log('7. Canonical URL Resolution');

function getCanonicalUrl(currentUrl) {
  const url = new URL(currentUrl);

  // Remove common tracking parameters
  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
  trackingParams.forEach(param => url.searchParams.delete(param));

  // Remove hash
  url.hash = '';

  // Normalize pathname
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  // Sort remaining query parameters
  const params = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
  url.search = '';
  params.forEach(([key, value]) => url.searchParams.append(key, value));

  return url.href;
}

const messyUrls = [
  'https://example.com/page?utm_source=google&id=123',
  'https://example.com/page?id=123&utm_source=google',
  'https://example.com/page/?id=123#section',
  'https://example.com/page?id=123'
];

console.log('Canonical URL resolution:');
messyUrls.forEach(url => {
  const canonical = getCanonicalUrl(url);
  console.log(`${url}`);
  console.log(`  → ${canonical}`);
});
console.log('');

// Example 8: Safe relative URL resolution
console.log('8. Safe Resolution with Validation');

function safeResolveUrl(relative, base, options = {}) {
  const {
    allowedProtocols = ['http:', 'https:'],
    allowedDomains = null,
    maxPathDepth = 10
  } = options;

  try {
    const resolved = new URL(relative, base);

    // Check protocol
    if (!allowedProtocols.includes(resolved.protocol)) {
      return {
        success: false,
        error: 'Protocol not allowed',
        url: null
      };
    }

    // Check domain if whitelist provided
    if (allowedDomains) {
      const baseDomain = new URL(base).hostname;
      if (resolved.hostname !== baseDomain && !allowedDomains.includes(resolved.hostname)) {
        return {
          success: false,
          error: 'Domain not allowed',
          url: null
        };
      }
    }

    // Check path depth
    const pathSegments = resolved.pathname.split('/').filter(s => s);
    if (pathSegments.length > maxPathDepth) {
      return {
        success: false,
        error: 'Path too deep',
        url: null
      };
    }

    return {
      success: true,
      url: resolved.href,
      isExternal: new URL(base).origin !== resolved.origin
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      url: null
    };
  }
}

const safeBase = 'https://example.com/current/page';
const testUrls = [
  '../safe/path',
  '//cdn.example.com/asset',
  'javascript:alert(1)',
  '../../../../../../../etc/passwd',
  'https://external.com/page'
];

console.log('Safe resolution from:', safeBase);
console.log('\nTests:');
testUrls.forEach(url => {
  const result = safeResolveUrl(url, safeBase, {
    allowedDomains: ['cdn.example.com'],
    maxPathDepth: 5
  });
  console.log(`"${url}"`);
  console.log(`  Success: ${result.success}`);
  if (result.success) {
    console.log(`  URL: ${result.url}`);
    if (result.isExternal) console.log('  (External)');
  } else {
    console.log(`  Error: ${result.error}`);
  }
  console.log('');
});

// Summary
console.log('=== Summary ===');
console.log('Relative URL resolution techniques:');
console.log('✓ Basic relative path resolution');
console.log('✓ Understanding ./ and ../ navigation');
console.log('✓ Protocol-relative URLs (//domain.com)');
console.log('✓ Building navigation systems');
console.log('✓ Resolving HTML hrefs');
console.log('✓ Canonical URL generation');
console.log('✓ Safe resolution with validation');
console.log('✓ Different base URL contexts');
