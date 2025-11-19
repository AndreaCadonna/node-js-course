/**
 * Example 8: Reusable URL Utilities
 */

console.log('=== Reusable URL Utilities ===\n');

// URL utility library
const URLUtils = {
  isAbsolute(urlString) {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  },

  addQueryParams(urlString, params) {
    const url = new URL(urlString);
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) url.searchParams.set(k, v);
    });
    return url.href;
  },

  removeQueryParams(urlString, keys) {
    const url = new URL(urlString);
    keys.forEach(key => url.searchParams.delete(key));
    return url.href;
  },

  getOrigin(urlString) {
    try {
      return new URL(urlString).origin;
    } catch {
      return null;
    }
  },

  isSameOrigin(url1, url2) {
    try {
      return new URL(url1).origin === new URL(url2).origin;
    } catch {
      return false;
    }
  }
};

// Examples
console.log('1. Is Absolute:', URLUtils.isAbsolute('https://example.com'));
console.log('2. Add Params:', URLUtils.addQueryParams('https://example.com', { a: 1, b: 2 }));
console.log('3. Get Origin:', URLUtils.getOrigin('https://example.com:8080/path'));
console.log('4. Same Origin:', URLUtils.isSameOrigin(
  'https://example.com/page1',
  'https://example.com/page2'
));

console.log('\n✓ Reusable utilities make URL handling consistent');
