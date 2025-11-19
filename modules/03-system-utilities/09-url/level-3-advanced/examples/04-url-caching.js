/**
 * Example 4: URL Caching Strategies
 */

console.log('=== URL Caching ===\n');

class URLCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  parse(urlString) {
    if (this.cache.has(urlString)) {
      return this.cache.get(urlString);
    }
    try {
      const url = new URL(urlString);
      const parsed = { href: url.href, hostname: url.hostname };
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(urlString, parsed);
      return parsed;
    } catch {
      return null;
    }
  }
}

const cache = new URLCache();
console.log('Cached:', cache.parse('https://example.com'));
console.log('✓ Caching improves performance');
