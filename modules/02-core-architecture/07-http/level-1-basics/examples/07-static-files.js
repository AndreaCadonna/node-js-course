/**
 * Example 7: Static File Server
 *
 * Demonstrates:
 * - Serving static files
 * - Setting correct Content-Type headers
 * - Streaming files
 * - Handling file not found errors
 * - Security considerations
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('=== Static File Server Example ===\n');

// MIME type mapping
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip'
};

// Create a simple public directory with sample files
const publicDir = path.join(__dirname, 'public');

// Create public directory and sample files if they don't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);

  // Create sample HTML file
  fs.writeFileSync(
    path.join(publicDir, 'index.html'),
    `<!DOCTYPE html>
<html>
<head>
  <title>Static File Server</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Welcome to the Static File Server!</h1>
  <p>This page is served as a static file.</p>
  <script src="script.js"></script>
</body>
</html>`
  );

  // Create sample CSS file
  fs.writeFileSync(
    path.join(publicDir, 'style.css'),
    `body {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
  background-color: #f5f5f5;
}

h1 {
  color: #333;
}`
  );

  // Create sample JavaScript file
  fs.writeFileSync(
    path.join(publicDir, 'script.js'),
    `console.log('Static JavaScript file loaded!');
alert('Hello from static JS!');`
  );

  // Create sample text file
  fs.writeFileSync(
    path.join(publicDir, 'sample.txt'),
    'This is a sample text file served by the static file server.'
  );

  console.log('Created sample files in ./public directory\n');
}

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Parse URL and remove query string
  let filePath = req.url.split('?')[0];

  // Default to index.html for root path
  if (filePath === '/') {
    filePath = '/index.html';
  }

  // Prevent directory traversal attacks
  // Remove any ../ or ..\\ sequences
  filePath = filePath.replace(/\.\./g, '');

  // Build full file path
  const fullPath = path.join(publicDir, filePath);

  // Security check: ensure the resolved path is within publicDir
  if (!fullPath.startsWith(publicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden - Access denied');
    return;
  }

  // Get file extension
  const ext = path.extname(fullPath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  // Check if file exists
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <h1>404 - File Not Found</h1>
        <p>The file <code>${filePath}</code> does not exist.</p>
        <a href="/">Go to home</a>
      `);
      return;
    }

    // Check if it's a directory
    fs.stat(fullPath, (err, stats) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }

      if (stats.isDirectory()) {
        // Try to serve index.html from directory
        const indexPath = path.join(fullPath, 'index.html');
        fs.access(indexPath, fs.constants.F_OK, (err) => {
          if (err) {
            // List directory contents (optional - can be a security risk)
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden - Directory listing not allowed');
          } else {
            serveFile(indexPath, 'text/html', res);
          }
        });
      } else {
        // Serve the file
        serveFile(fullPath, contentType, res);
      }
    });
  });
});

// Helper function to serve files
function serveFile(filePath, contentType, res) {
  // Get file size for Content-Length header
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }

    // Set headers
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });

    // Stream the file to the response
    const readStream = fs.createReadStream(filePath);

    // Handle stream errors
    readStream.on('error', (error) => {
      console.error('Stream error:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
    });

    // Pipe file to response
    readStream.pipe(res);
  });
}

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Static file server running at http://localhost:${PORT}/\n`);
  console.log('Available files:');
  console.log('  http://localhost:3000/');
  console.log('  http://localhost:3000/index.html');
  console.log('  http://localhost:3000/style.css');
  console.log('  http://localhost:3000/script.js');
  console.log('  http://localhost:3000/sample.txt\n');
  console.log('Public directory:', publicDir);
  console.log('');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close(() => process.exit(0));
});

/**
 * Key Concepts:
 *
 * 1. Map file extensions to MIME types
 * 2. Use path.join() to safely build file paths
 * 3. Prevent directory traversal attacks
 * 4. Always check if file exists before serving
 * 5. Stream files for better performance
 * 6. Set appropriate Content-Type header
 * 7. Set Content-Length header for efficiency
 * 8. Use Cache-Control for browser caching
 * 9. Handle errors gracefully
 */
