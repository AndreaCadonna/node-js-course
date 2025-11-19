/**
 * Example 1: Response Compression
 *
 * Demonstrates:
 * - Gzip compression
 * - Detecting client support
 * - Compression for different content types
 */

const http = require('http');
const zlib = require('zlib');

console.log('=== Response Compression Example ===\n');

const largeContent = 'Hello World! '.repeat(1000);

const server = http.createServer((req, res) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const supportsGzip = acceptEncoding.includes('gzip');

  if (supportsGzip) {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Content-Encoding': 'gzip'
    });

    const compressed = zlib.gzipSync(largeContent);
    res.end(compressed);

    console.log('Original size:', largeContent.length);
    console.log('Compressed size:', compressed.length);
    console.log('Compression ratio:', (compressed.length / largeContent.length * 100).toFixed(2) + '%');
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(largeContent);
  }
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/\n');
  console.log('Try:');
  console.log('  curl http://localhost:3000/ | wc -c');
  console.log('  curl --compressed http://localhost:3000/ | wc -c\n');
});
