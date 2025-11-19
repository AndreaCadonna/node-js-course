/**
 * Example 2: URL Components
 *
 * Demonstrates all URL components and how to access them.
 * Understanding each component is essential for URL manipulation.
 */

console.log('=== URL Components Examples ===\n');

// Example URL with all components
const fullUrl = 'https://user:pass@subdomain.example.com:8080/path/to/page.html?key1=value1&key2=value2#section-3';
const url = new URL(fullUrl);

console.log('Full URL:', fullUrl);
console.log('');

// 1. Protocol (Scheme)
console.log('1. PROTOCOL (Scheme)');
console.log('   url.protocol:', url.protocol);
console.log('   Description: How to access the resource');
console.log('   Common values: http:, https:, ftp:, file:');
console.log('   Note: Always includes the colon (:)');
console.log('');

// 2. Username
console.log('2. USERNAME');
console.log('   url.username:', url.username);
console.log('   Description: Authentication username');
console.log('   Note: Rarely used in modern applications');
console.log('');

// 3. Password
console.log('3. PASSWORD');
console.log('   url.password:', url.password);
console.log('   Description: Authentication password');
console.log('   ⚠️  Security risk: Visible in logs and history');
console.log('');

// 4. Hostname
console.log('4. HOSTNAME');
console.log('   url.hostname:', url.hostname);
console.log('   Description: Domain name or IP address');
console.log('   Examples: example.com, www.example.com, 192.168.1.1');
console.log('');

// 5. Port
console.log('5. PORT');
console.log('   url.port:', url.port);
console.log('   Description: Network port number');
console.log('   Default ports: http=80, https=443, ftp=21');
console.log('   Note: Empty string if using default port');
console.log('');

// 6. Host (Hostname + Port)
console.log('6. HOST');
console.log('   url.host:', url.host);
console.log('   Description: Hostname + port combined');
console.log('   Format: hostname:port');
console.log('');

// 7. Pathname
console.log('7. PATHNAME');
console.log('   url.pathname:', url.pathname);
console.log('   Description: Path to the resource');
console.log('   Always starts with: /');
console.log('   Examples: /, /path, /path/to/file.html');
console.log('');

// 8. Search (Query String)
console.log('8. SEARCH (Query String)');
console.log('   url.search:', url.search);
console.log('   Description: Query parameters');
console.log('   Always starts with: ?');
console.log('   Format: ?key1=value1&key2=value2');
console.log('');

// 9. Hash (Fragment)
console.log('9. HASH (Fragment)');
console.log('   url.hash:', url.hash);
console.log('   Description: Fragment identifier');
console.log('   Always starts with: #');
console.log('   Used for: Page sections, SPA routing');
console.log('');

// 10. Origin
console.log('10. ORIGIN');
console.log('   url.origin:', url.origin);
console.log('   Description: Protocol + hostname + port');
console.log('   Read-only property');
console.log('   Used for: CORS, security checks');
console.log('');

// 11. Href (Complete URL)
console.log('11. HREF (Complete URL)');
console.log('   url.href:', url.href);
console.log('   Description: The complete URL as a string');
console.log('   Same as: url.toString()');
console.log('');

// Visual breakdown
console.log('=== Visual Breakdown ===');
console.log('');
console.log(fullUrl);
console.log('');
console.log('https://   →  protocol');
console.log('user:pass@ →  username:password');
console.log('subdomain.example.com → hostname');
console.log(':8080      →  port');
console.log('/path/to/page.html → pathname');
console.log('?key1=value1&key2=value2 → search');
console.log('#section-3 →  hash');
console.log('');

// Minimal URL
console.log('=== Minimal URL Example ===');
const minimalUrl = new URL('https://example.com');
console.log('URL:', minimalUrl.href);
console.log('Protocol:', minimalUrl.protocol);      // 'https:'
console.log('Hostname:', minimalUrl.hostname);      // 'example.com'
console.log('Port:', minimalUrl.port);              // '' (default)
console.log('Pathname:', minimalUrl.pathname);      // '/'
console.log('Search:', minimalUrl.search);          // ''
console.log('Hash:', minimalUrl.hash);              // ''
console.log('');

// Summary
console.log('=== Summary ===');
console.log('11 main URL components:');
console.log('1. protocol   - How to access (https:)');
console.log('2. username   - Auth username (optional)');
console.log('3. password   - Auth password (optional)');
console.log('4. hostname   - Domain/IP address');
console.log('5. port       - Network port (optional)');
console.log('6. host       - hostname:port combined');
console.log('7. pathname   - Path to resource');
console.log('8. search     - Query parameters');
console.log('9. hash       - Fragment identifier');
console.log('10. origin    - protocol://hostname:port (read-only)');
console.log('11. href      - Complete URL string');
