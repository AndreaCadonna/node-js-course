/**
 * Example 5: URL Shortener Implementation
 */

console.log('=== URL Shortener ===\n');

class URLShortener {
  constructor() {
    this.urls = new Map();
    this.counter = 1000;
  }

  shorten(longUrl) {
    new URL(longUrl); // Validate
    const code = (this.counter++).toString(36);
    this.urls.set(code, longUrl);
    return `https://short.url/${code}`;
  }

  expand(shortUrl) {
    const code = new URL(shortUrl).pathname.slice(1);
    return this.urls.get(code) || null;
  }
}

const shortener = new URLShortener();
const short = shortener.shorten('https://example.com/very/long/path');
console.log('Short:', short);
console.log('Expanded:', shortener.expand(short));
console.log('✓ URL shortening implemented');
