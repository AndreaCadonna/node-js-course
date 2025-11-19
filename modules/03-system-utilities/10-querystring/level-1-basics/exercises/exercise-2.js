/**
 * Exercise 2: URL Encoding
 *
 * Practice working with special characters and encoding.
 */

console.log('=== Exercise 2: URL Encoding ===\n');

const querystring = require('querystring');

// Task 1: Encode special characters
console.log('Task 1: Encode a string for URL');
function encodeForUrl(str) {
  // TODO: Use querystring.escape()
}

// Test
try {
  console.log(encodeForUrl('Hello World!'));
  console.log('Expected: Hello%20World!');
  console.log('');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 2: Decode URL-encoded string
console.log('Task 2: Decode URL-encoded string');
function decodeFromUrl(str) {
  // TODO: Use querystring.unescape()
}

// Test
try {
  console.log(decodeFromUrl('user%40example.com'));
  console.log('Expected: user@example.com');
  console.log('');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 3: Build URL with special characters
console.log('Task 3: Build safe URL with special characters');
function buildSafeUrl(path, params) {
  // TODO: Use stringify to safely encode params
}

// Test
try {
  const url = buildSafeUrl('/search', {
    q: 'Node.js & Express',
    email: 'user@example.com'
  });
  console.log(url);
  console.log('Should properly encode & and @');
  console.log('');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

console.log('=== Exercise 2 Complete ===');
