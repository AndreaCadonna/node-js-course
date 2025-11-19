/**
 * Example 8: Production URL Patterns
 */

console.log('=== Production Patterns ===\n');

class ProductionURLHandler {
  constructor(options = {}) {
    this.allowedOrigins = options.allowedOrigins || [];
    this.requireHTTPS = options.requireHTTPS || false;
  }

  validate(urlString) {
    try {
      const url = new URL(urlString);
      
      if (this.requireHTTPS && url.protocol !== 'https:') {
        return { valid: false, error: 'HTTPS required' };
      }
      
      if (this.allowedOrigins.length > 0) {
        if (!this.allowedOrigins.includes(url.origin)) {
          return { valid: false, error: 'Origin not allowed' };
        }
      }
      
      return { valid: true, url: url.href };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  sanitize(urlString) {
    try {
      const url = new URL(urlString);
      const tracking = ['utm_source', 'utm_medium', 'utm_campaign'];
      tracking.forEach(param => url.searchParams.delete(param));
      url.hash = '';
      return url.href;
    } catch {
      return null;
    }
  }
}

const handler = new ProductionURLHandler({
  allowedOrigins: ['https://example.com'],
  requireHTTPS: true
});

console.log('Validation:', handler.validate('https://example.com/page'));
console.log('Sanitized:', handler.sanitize('https://example.com?utm_source=google#ref'));
console.log('✓ Production-ready patterns implemented');
