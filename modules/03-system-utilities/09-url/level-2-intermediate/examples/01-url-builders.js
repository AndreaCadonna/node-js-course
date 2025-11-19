/**
 * Level 2 Example 1: URL Builders
 * 
 * Advanced URL construction patterns for building complex URLs programmatically.
 */

console.log('=== URL Builder Patterns ===\n');

class URLBuilder {
  constructor(baseUrl) {
    this.url = new URL(baseUrl);
  }

  setPath(path) {
    this.url.pathname = path;
    return this;
  }

  addParam(key, value) {
    if (value !== null && value !== undefined) {
      this.url.searchParams.set(key, value);
    }
    return this;
  }

  addParams(params) {
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => this.url.searchParams.append(key, v));
      } else if (value !== null && value !== undefined) {
        this.url.searchParams.set(key, value);
      }
    });
    return this;
  }

  build() {
    return this.url.href;
  }
}

// Usage example
const apiUrl = new URLBuilder('https://api.example.com')
  .setPath('/v2/users')
  .addParam('status', 'active')
  .addParam('limit', 20)
  .addParams({ role: 'admin', sort: 'name' })
  .build();

console.log('Built URL:', apiUrl);
console.log('\n✓ Level 2 content structure complete');
