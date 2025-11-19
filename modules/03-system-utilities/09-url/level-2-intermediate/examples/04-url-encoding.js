/**
 * Example 4: URL Encoding and Decoding
 *
 * Understanding when and how to encode URL components.
 */

console.log('=== URL Encoding and Decoding ===\n');

// Example 1: encodeURI vs encodeURIComponent
console.log('1. Encoding Methods Comparison');

const fullUrl = 'https://example.com/search?q=hello world&lang=en';
const component = 'hello world & special=chars';

console.log('encodeURI (preserves URL structure):');
console.log('  Input:', fullUrl);
console.log('  Output:', encodeURI(fullUrl));

console.log('\nencodeURIComponent (encodes everything):');
console.log('  Input:', component);
console.log('  Output:', encodeURIComponent(component));

console.log('\nWhen to use each:');
console.log('  encodeURI: Full URLs');
console.log('  encodeURIComponent: Query params, path segments');
console.log('');

// Example 2: URLSearchParams automatic encoding
console.log('2. Automatic Encoding with URLSearchParams');

const url = new URL('https://example.com');
const specialStrings = {
  spaces: 'hello world',
  special: 'a+b=c&d',
  unicode: '你好世界',
  symbols: '!@#$%^&*()'
};

Object.entries(specialStrings).forEach(([key, value]) => {
  url.searchParams.set(key, value);
});

console.log('URL (encoded):', url.href);
console.log('\nDecoded values:');
Object.keys(specialStrings).forEach(key => {
  console.log(`  ${key}: "${url.searchParams.get(key)}"`);
});
console.log('');

// Example 3: Reserved characters
console.log('3. Reserved Characters');

const reserved = {
  'semicolon': ';',
  'slash': '/',
  'question': '?',
  'colon': ':',
  'at': '@',
  'equals': '=',
  'ampersand': '&'
};

console.log('Reserved characters in URLs:');
Object.entries(reserved).forEach(([name, char]) => {
  console.log(`  ${name} (${char}): ${encodeURIComponent(char)}`);
});
console.log('');

// Example 4: Double encoding pitfall
console.log('4. Double Encoding (Pitfall)');

const value = 'hello world';
const encoded = encodeURIComponent(value);
const doubleEncoded = encodeURIComponent(encoded);

console.log('Original:', value);
console.log('Encoded once:', encoded);
console.log('Encoded twice (wrong!):', doubleEncoded);
console.log('\nDecoded once:', decodeURIComponent(doubleEncoded));
console.log('Decoded twice:', decodeURIComponent(decodeURIComponent(doubleEncoded)));
console.log('⚠️  Avoid double encoding!');
console.log('');

// Example 5: Encoding in different contexts
console.log('5. Encoding Contexts');

const data = 'hello world?test=value';

console.log('Original:', data);
console.log('\nIn pathname:');
const pathUrl = new URL('https://example.com');
pathUrl.pathname = '/' + data;
console.log('  ', pathUrl.href);

console.log('\nIn query parameter:');
const queryUrl = new URL('https://example.com');
queryUrl.searchParams.set('data', data);
console.log('  ', queryUrl.href);
console.log('');

// Example 6: Decoding scenarios
console.log('6. Decoding');

const encodedUrl = 'https://example.com/search?q=hello%20world&tags=node%2Cjs';
const url2 = new URL(encodedUrl);

console.log('Encoded URL:', encodedUrl);
console.log('\nAutomatic decoding:');
console.log('  q:', url2.searchParams.get('q'));
console.log('  tags:', url2.searchParams.get('tags'));
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Use URLSearchParams for automatic encoding');
console.log('✓ Use encodeURIComponent for manual encoding');
console.log('✓ Avoid double encoding');
console.log('✓ URLSearchParams handles decoding automatically');
console.log('✓ Different contexts need different encoding');
