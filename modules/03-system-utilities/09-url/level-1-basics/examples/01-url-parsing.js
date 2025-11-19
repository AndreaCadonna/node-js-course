/**
 * Example 1: URL Parsing
 *
 * Demonstrates how to parse URLs and access their components
 * using the WHATWG URL API.
 */

console.log('=== URL Parsing Examples ===\n');

// Example 1: Parsing a complete URL
console.log('1. Parsing a Complete URL');
const url1 = new URL('https://www.example.com:8080/products/123?category=electronics&sort=price#reviews');

console.log('Full URL:', url1.href);
console.log('Protocol:', url1.protocol);       // 'https:'
console.log('Hostname:', url1.hostname);       // 'www.example.com'
console.log('Port:', url1.port);               // '8080'
console.log('Pathname:', url1.pathname);       // '/products/123'
console.log('Search:', url1.search);           // '?category=electronics&sort=price'
console.log('Hash:', url1.hash);               // '#reviews'
console.log('');

// Example 2: Parsing a simple URL
console.log('2. Parsing a Simple URL');
const url2 = new URL('https://example.com');
console.log('Full URL:', url2.href);
console.log('Pathname:', url2.pathname);       // '/' (default)
console.log('Port:', url2.port);               // '' (empty, uses default 443)
console.log('');

// Example 3: Parsing URLs with different protocols
console.log('3. Different Protocols');
const httpUrl = new URL('http://example.com');
const httpsUrl = new URL('https://example.com');
const ftpUrl = new URL('ftp://files.example.com');

console.log('HTTP protocol:', httpUrl.protocol);    // 'http:'
console.log('HTTPS protocol:', httpsUrl.protocol);  // 'https:'
console.log('FTP protocol:', ftpUrl.protocol);      // 'ftp:'
console.log('');

// Example 4: Parsing with credentials (authentication)
console.log('4. URL with Credentials');
const urlWithAuth = new URL('https://user:password@example.com/admin');
console.log('Username:', urlWithAuth.username);     // 'user'
console.log('Password:', urlWithAuth.password);     // 'password'
console.log('⚠️  Warning: Credentials in URLs are visible in logs!');
console.log('');

// Example 5: Accessing the origin
console.log('5. URL Origin');
const url5 = new URL('https://api.example.com:3000/v1/users');
console.log('Origin:', url5.origin);
// Origin = protocol + hostname + port
// 'https://api.example.com:3000'
console.log('');

// Example 6: Parsing file:// URLs
console.log('6. File URLs');
const fileUrl = new URL('file:///home/user/document.txt');
console.log('Protocol:', fileUrl.protocol);         // 'file:'
console.log('Pathname:', fileUrl.pathname);         // '/home/user/document.txt'
console.log('');

// Example 7: Host vs Hostname
console.log('7. Host vs Hostname');
const url7 = new URL('https://example.com:8080/path');
console.log('Host:', url7.host);                    // 'example.com:8080' (includes port)
console.log('Hostname:', url7.hostname);            // 'example.com' (hostname only)
console.log('Port:', url7.port);                    // '8080'
console.log('');

// Example 8: Default ports are not shown
console.log('8. Default Ports');
const url8a = new URL('https://example.com');       // Port 443 (default)
const url8b = new URL('http://example.com');        // Port 80 (default)
const url8c = new URL('https://example.com:443');   // Explicit default port

console.log('HTTPS default port:', url8a.port);     // '' (empty)
console.log('HTTP default port:', url8b.port);      // '' (empty)
console.log('HTTPS explicit 443:', url8c.port);     // '443'
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Use new URL(urlString) to parse URLs');
console.log('✓ Access components via properties (protocol, hostname, etc.)');
console.log('✓ URL API works with all standard protocols');
console.log('✓ Default ports are not included in the port property');
console.log('✓ Always handle potential errors when parsing user input');
