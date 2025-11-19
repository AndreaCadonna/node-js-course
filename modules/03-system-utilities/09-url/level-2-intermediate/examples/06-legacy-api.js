/**
 * Example 6: Legacy URL API vs Modern URL API
 * 
 * Comparing the old url.parse() with the modern URL class.
 */

console.log('=== Legacy vs Modern URL APIs ===\n');

const url = require('url');

const testUrl = 'https://user:pass@example.com:8080/path?key=value#hash';

// Legacy API
console.log('1. Legacy url.parse()');
const legacyParsed = url.parse(testUrl, true);
console.log('Result:', {
  protocol: legacyParsed.protocol,
  host: legacyParsed.host,
  pathname: legacyParsed.pathname,
  query: legacyParsed.query
});
console.log('⚠️  Deprecated - use modern URL instead');
console.log('');

// Modern API
console.log('2. Modern URL class');
const modernUrl = new URL(testUrl);
console.log('Result:', {
  protocol: modernUrl.protocol,
  host: modernUrl.host,
  pathname: modernUrl.pathname,
  searchParams: Object.fromEntries(modernUrl.searchParams)
});
console.log('✓ Recommended approach');
console.log('');

// Comparison table
console.log('3. API Comparison');
console.log('\n| Feature              | Legacy url.parse() | Modern URL       |');
console.log('|----------------------|-------------------|------------------|');
console.log('| Standard             | Node.js specific  | WHATWG Standard  |');
console.log('| Browser support      | No                | Yes              |');
console.log('| Mutable              | No (returns obj)  | Yes (URL object) |');
console.log('| Query parsing        | Manual (qs=true)  | Built-in         |');
console.log('| Validation           | Lenient           | Strict           |');
console.log('| Status               | Deprecated        | Active           |');
console.log('');

// Migration example
console.log('4. Migration Example');
console.log('\n// Old way (deprecated)');
console.log('const url = require("url");');
console.log('const parsed = url.parse(urlString, true);');
console.log('console.log(parsed.query.key);');

console.log('\n// New way (recommended)');
console.log('const parsed = new URL(urlString);');
console.log('console.log(parsed.searchParams.get("key"));');
console.log('');

// Example 5: url.format() vs URL.href
console.log('5. Formatting URLs');

// Legacy format
const legacyFormatted = url.format({
  protocol: 'https',
  hostname: 'example.com',
  pathname: '/path',
  query: { key: 'value' }
});
console.log('Legacy url.format():', legacyFormatted);

// Modern approach
const modernFormatted = new URL('https://example.com/path');
modernFormatted.searchParams.set('key', 'value');
console.log('Modern URL.href:', modernFormatted.href);
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Use the modern URL API for all new code');
console.log('✓ Migrate legacy code when possible');
console.log('✓ URL class is a web standard (works in browsers too)');
console.log('✓ Better validation and error handling');
console.log('✓ More consistent with web standards');