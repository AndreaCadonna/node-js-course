/**
 * Example 5: Protocol Handling
 *
 * Working with different URL protocols and schemes.
 */

console.log('=== Protocol Handling ===\n');

// Example 1: Common protocols
console.log('1. Common URL Protocols');

const protocols = [
  { url: 'https://example.com', description: 'HTTPS (secure web)' },
  { url: 'http://example.com', description: 'HTTP (web)' },
  { url: 'ftp://files.example.com', description: 'FTP (file transfer)' },
  { url: 'file:///home/user/file.txt', description: 'File (local filesystem)' },
  { url: 'ws://example.com', description: 'WebSocket' },
  { url: 'wss://example.com', description: 'WebSocket Secure' },
  { url: 'mailto:user@example.com', description: 'Email' },
  { url: 'tel:+1234567890', description: 'Telephone' }
];

protocols.forEach(({ url: urlString, description }) => {
  try {
    const url = new URL(urlString);
    console.log(`${url.protocol} - ${description}`);
    console.log(`  Example: ${urlString}`);
  } catch (err) {
    console.log(`${urlString} - Error: ${err.message}`);
  }
});
console.log('');

// Example 2: Protocol validation
console.log('2. Protocol Validation');

function validateProtocol(urlString, allowedProtocols = ['http:', 'https:']) {
  try {
    const url = new URL(urlString);
    return {
      valid: allowedProtocols.includes(url.protocol),
      protocol: url.protocol
    };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

const testUrls = [
  'https://example.com',
  'http://example.com',
  'ftp://example.com',
  'javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>'
];

console.log('Validating protocols (allowing only http/https):');
testUrls.forEach(url => {
  const result = validateProtocol(url);
  console.log(`${result.valid ? '✓' : '✗'} ${url}`);
});
console.log('');

// Example 3: File URLs
console.log('3. Working with File URLs');

const fileUrls = [
  'file:///C:/Users/Documents/file.txt',
  'file:///home/user/documents/file.txt',
  'file://localhost/path/to/file.txt'
];

fileUrls.forEach(fileUrl => {
  const url = new URL(fileUrl);
  console.log('File URL:', fileUrl);
  console.log('  Protocol:', url.protocol);
  console.log('  Pathname:', url.pathname);
  console.log('');
});

// Example 4: Protocol switching
console.log('4. Protocol Switching');

function switchProtocol(urlString, newProtocol) {
  try {
    const url = new URL(urlString);
    url.protocol = newProtocol;
    return url.href;
  } catch (err) {
    return null;
  }
}

const httpUrl = 'http://example.com/page';
const httpsUrl = switchProtocol(httpUrl, 'https:');

console.log('HTTP URL:', httpUrl);
console.log('HTTPS URL:', httpsUrl);
console.log('');

// Example 5: WebSocket URLs
console.log('5. WebSocket URLs');

function convertToWebSocket(httpUrl) {
  const url = new URL(httpUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.href;
}

const webUrls = [
  'https://example.com/socket',
  'http://localhost:3000/socket'
];

console.log('Converting to WebSocket URLs:');
webUrls.forEach(url => {
  const wsUrl = convertToWebSocket(url);
  console.log(`${url} → ${wsUrl}`);
});
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Always validate protocols for security');
console.log('✓ Different protocols have different structures');
console.log('✓ Block dangerous protocols (javascript:, data:)');
console.log('✓ Use https: for production web traffic');
console.log('✓ Know protocol-specific URL patterns');
