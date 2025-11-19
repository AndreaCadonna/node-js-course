/**
 * Example 3: URL Encoding and Decoding
 *
 * Demonstrates escape() and unescape() methods for URL encoding.
 */

const querystring = require('querystring');

console.log('=== URL Encoding and Decoding ===\n');

// 1. Basic escape (encode)
console.log('1. Basic escape - encoding special characters');
const plain = 'Hello World!';
const escaped = querystring.escape(plain);
console.log('Original:', plain);
console.log('Escaped:', escaped);
console.log('');

// 2. Email address encoding
console.log('2. Email address encoding');
const email = 'user@example.com';
const escapedEmail = querystring.escape(email);
console.log('Original:', email);
console.log('Escaped:', escapedEmail);
console.log('Notice: @ becomes %40');
console.log('');

// 3. URL encoding
console.log('3. URL as a parameter');
const url = 'https://example.com/page';
const escapedUrl = querystring.escape(url);
console.log('Original:', url);
console.log('Escaped:', escapedUrl);
console.log('Notice: :// becomes %3A%2F%2F');
console.log('');

// 4. Special characters
console.log('4. Special characters');
const specialChars = '!@#$%^&*()+=[]{}|;:\'",.<>?/';
const escapedSpecial = querystring.escape(specialChars);
console.log('Original:', specialChars);
console.log('Escaped:', escapedSpecial);
console.log('');

// 5. Spaces encoding
console.log('5. Spaces are encoded as %20');
const withSpaces = 'Node.js Tutorial for Beginners';
const escapedSpaces = querystring.escape(withSpaces);
console.log('Original:', withSpaces);
console.log('Escaped:', escapedSpaces);
console.log('Note: querystring uses %20 for spaces');
console.log('');

// 6. Ampersands and equals
console.log('6. Ampersands and equals (important!)');
const ampersand = 'Tom & Jerry';
const equals = '2 + 2 = 4';
console.log('Original:', ampersand);
console.log('Escaped:', querystring.escape(ampersand));
console.log('Original:', equals);
console.log('Escaped:', querystring.escape(equals));
console.log('Note: These must be encoded in query strings!');
console.log('');

// 7. Basic unescape (decode)
console.log('7. Basic unescape - decoding');
const encoded = 'Hello%20World!';
const unescaped = querystring.unescape(encoded);
console.log('Encoded:', encoded);
console.log('Unescaped:', unescaped);
console.log('');

// 8. Unescape complex string
console.log('8. Unescape complex string');
const complex = 'name%3DJohn%26age%3D30';
const decoded = querystring.unescape(complex);
console.log('Encoded:', complex);
console.log('Unescaped:', decoded);
console.log('');

// 9. Round-trip encoding
console.log('9. Round-trip encoding and decoding');
const original = 'user@example.com';
const step1 = querystring.escape(original);
const step2 = querystring.unescape(step1);
console.log('Original:', original);
console.log('Escaped:', step1);
console.log('Unescaped:', step2);
console.log('Match:', original === step2);
console.log('');

// 10. Characters that don't need encoding
console.log('10. Characters that don\'t need encoding');
const safe = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~';
const safEncoded = querystring.escape(safe);
console.log('Original:', safe);
console.log('Escaped:', safEncoded);
console.log('Same:', safe === safEncoded);
console.log('Note: Alphanumeric and -_.~ are safe');
console.log('');

// 11. Comparison: Manual vs automatic encoding
console.log('11. Manual vs automatic encoding');
const params = {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello & welcome!'
};

// Manual encoding (not recommended)
const manual = `name=${querystring.escape(params.name)}&email=${querystring.escape(params.email)}&message=${querystring.escape(params.message)}`;
console.log('Manual:', manual);

// Automatic encoding (recommended)
const automatic = querystring.stringify(params);
console.log('Automatic:', automatic);
console.log('Same result:', manual === automatic);
console.log('');

// 12. Why encoding matters
console.log('12. Why encoding matters - Breaking URLs');
const bad = {
  search: 'Tom & Jerry',
  category: 'TV Shows'
};

// Without encoding (WRONG)
const badUrl = `/search?search=${bad.search}&category=${bad.category}`;
console.log('❌ Without encoding:', badUrl);
console.log('   This URL is broken! The & in "Tom & Jerry" breaks parsing');

// With encoding (CORRECT)
const goodUrl = `/search?${querystring.stringify(bad)}`;
console.log('✅ With encoding:', goodUrl);
console.log('   This URL works correctly');
console.log('');

// 13. Real-world: Building search URL
console.log('13. Real-world: Building search URL');
function buildSearchUrl(query) {
  // DON'T manually escape - use stringify!
  const params = { q: query };
  return `/search?${querystring.stringify(params)}`;
}

console.log('Search "node.js":', buildSearchUrl('node.js'));
console.log('Search "C++ & Python":', buildSearchUrl('C++ & Python'));
console.log('Search "user@example.com":', buildSearchUrl('user@example.com'));
console.log('');

// 14. Unicode characters
console.log('14. Unicode characters');
const unicode = '你好世界'; // Hello World in Chinese
const escapedUnicode = querystring.escape(unicode);
console.log('Original:', unicode);
console.log('Escaped:', escapedUnicode);
console.log('Unescaped:', querystring.unescape(escapedUnicode));
console.log('');

// 15. Emoji encoding
console.log('15. Emoji encoding');
const emoji = 'Hello 👋 World 🌍';
const escapedEmoji = querystring.escape(emoji);
console.log('Original:', emoji);
console.log('Escaped:', escapedEmoji);
console.log('Unescaped:', querystring.unescape(escapedEmoji));
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ escape() encodes special characters for URLs');
console.log('✓ unescape() decodes encoded strings');
console.log('✓ Use stringify() instead of manual encoding');
console.log('✓ Alphanumeric and -_.~ don\'t need encoding');
console.log('✓ Always encode user input before adding to URLs');
console.log('✓ Encoding prevents URL parsing errors');
