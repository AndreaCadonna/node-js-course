/**
 * Example 3: Creating URLs
 *
 * Demonstrates different ways to create URL objects.
 */

console.log('=== Creating URLs ===\n');

// Method 1: From absolute URL string
console.log('1. From Absolute URL');
const url1 = new URL('https://www.example.com/path');
console.log('Created:', url1.href);
console.log('');

// Method 2: From relative URL with base
console.log('2. From Relative URL (with base)');
const url2 = new URL('/api/users', 'https://example.com');
console.log('Path:', '/api/users');
console.log('Base:', 'https://example.com');
console.log('Result:', url2.href);
// 'https://example.com/api/users'
console.log('');

// Method 3: Relative paths
console.log('3. Relative Paths');
const base = 'https://example.com/products/electronics/';

const url3a = new URL('phones', base);
console.log('phones →', url3a.href);
// 'https://example.com/products/electronics/phones'

const url3b = new URL('./phones', base);
console.log('./phones →', url3b.href);
// 'https://example.com/products/electronics/phones'

const url3c = new URL('../clothing', base);
console.log('../clothing →', url3c.href);
// 'https://example.com/products/clothing'

const url3d = new URL('/api', base);
console.log('/api →', url3d.href);
// 'https://example.com/api' (absolute from root)
console.log('');

// Method 4: From request URL (HTTP server context)
console.log('4. From HTTP Request (simulated)');
const reqUrl = '/api/users?page=1';
const reqHost = 'api.example.com';
const url4 = new URL(reqUrl, `https://${reqHost}`);
console.log('Request URL:', reqUrl);
console.log('Host:', reqHost);
console.log('Full URL:', url4.href);
console.log('');

// Method 5: Building URLs programmatically
console.log('5. Building URLs Programmatically');
const url5 = new URL('https://example.com');
url5.pathname = '/api/v2/products';
url5.searchParams.set('category', 'electronics');
url5.searchParams.set('limit', '20');
console.log('Built URL:', url5.href);
// 'https://example.com/api/v2/products?category=electronics&limit=20'
console.log('');

// Method 6: Cloning/copying URLs
console.log('6. Cloning URLs');
const original = new URL('https://example.com/path?key=value');
const clone = new URL(original.href);

// Modify clone
clone.searchParams.set('key', 'newValue');

console.log('Original:', original.href);
console.log('Clone:', clone.href);
console.log('Are they the same object?', original === clone); // false
console.log('');

// Method 7: Different protocols
console.log('7. Different Protocols');
const httpUrl = new URL('http://example.com');
const httpsUrl = new URL('https://example.com');
const ftpUrl = new URL('ftp://files.example.com');
const fileUrl = new URL('file:///home/user/file.txt');
const wsUrl = new URL('ws://websocket.example.com');

console.log('HTTP:', httpUrl.href);
console.log('HTTPS:', httpsUrl.href);
console.log('FTP:', ftpUrl.href);
console.log('File:', fileUrl.href);
console.log('WebSocket:', wsUrl.href);
console.log('');

// Method 8: Error handling
console.log('8. Error Handling');

try {
  // This will throw because there's no base
  const invalidUrl = new URL('/path');
} catch (err) {
  console.log('❌ Error creating URL:', err.message);
}

try {
  // This works with a base
  const validUrl = new URL('/path', 'https://example.com');
  console.log('✓ Valid URL:', validUrl.href);
} catch (err) {
  console.log('Error:', err.message);
}

try {
  // Invalid URL format
  const badUrl = new URL('not a valid url');
} catch (err) {
  console.log('❌ Error with invalid format:', err.message);
}
console.log('');

// Best practices
console.log('=== Best Practices ===');
console.log('');

console.log('✓ Always provide base for relative URLs:');
console.log('  new URL("/path", "https://example.com")');
console.log('');

console.log('✓ Use try-catch for user input:');
console.log('  try {');
console.log('    const url = new URL(userInput);');
console.log('  } catch (err) {');
console.log('    // Handle invalid URL');
console.log('  }');
console.log('');

console.log('✓ Build URLs programmatically instead of string concatenation:');
console.log('  const url = new URL("https://api.com");');
console.log('  url.pathname = "/search";');
console.log('  url.searchParams.set("q", query);');
console.log('');

// Summary
console.log('=== Summary ===');
console.log('Methods to create URLs:');
console.log('1. From absolute URL string');
console.log('2. From relative URL + base');
console.log('3. Using relative path resolution');
console.log('4. From HTTP request components');
console.log('5. Building programmatically');
console.log('6. Cloning existing URLs');
console.log('7. With different protocols');
console.log('8. With proper error handling');
