/**
 * Exercise 5: Simple Static File Server
 *
 * Build a basic static file server that serves files from a directory.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('=== Exercise 5: Static File Server ===\n');

// Public directory path
const PUBLIC_DIR = path.join(__dirname, 'public');

// Task 1: Create a MIME type mapping
/**
 * Create an object that maps file extensions to MIME types
 * Include at least: .html, .css, .js, .json, .txt, .png, .jpg
 */
const mimeTypes = {
  // TODO: Add MIME types
  // '.html': 'text/html',
  // Your code here
};

// Task 2: Create helper function to get MIME type
/**
 * Get MIME type for a file based on its extension
 * @param {string} filePath - Path to file
 * @returns {string} MIME type
 */
function getMimeType(filePath) {
  // TODO: Get file extension and return corresponding MIME type
  // Default to 'application/octet-stream'
  // Your code here
}

// Task 3: Create helper function to serve files
/**
 * Serve a file to the response
 * @param {string} filePath - Path to file
 * @param {ServerResponse} res - Response object
 */
function serveFile(filePath, res) {
  // TODO: Implement file serving
  // Check if file exists
  // Get MIME type
  // Set headers
  // Stream file to response
  // Handle errors
  // Your code here
}

// Task 4: Create the server
const server = http.createServer((req, res) => {
  // TODO: Implement server logic
  // Parse URL
  // Build file path
  // Prevent directory traversal
  // Default to index.html for /
  // Serve file or return 404
  // Your code here

  res.end('TODO: Implement static file server');
});

// Task 5: Create sample files
/**
 * Before starting the server, create a public directory with:
 * - index.html
 * - style.css
 * - script.js
 * - about.html
 */
function createSampleFiles() {
  // TODO: Create public directory
  // TODO: Create sample HTML file
  // TODO: Create sample CSS file
  // TODO: Create sample JS file
  // Your code here
}

// Initialize
// createSampleFiles();

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Static file server running at http://localhost:${PORT}/\n`);
  console.log('Serving files from:', PUBLIC_DIR);
  console.log('');
  console.log('Make sure to create the public directory with sample files first!');
  console.log('');
  console.log('Try:');
  console.log('  http://localhost:3000/');
  console.log('  http://localhost:3000/style.css');
  console.log('  http://localhost:3000/script.js');
});

/**
 * Testing:
 * 1. Implement all functions
 * 2. Uncomment createSampleFiles() and run once to create files
 * 3. Run: node exercise-5.js
 * 4. Visit http://localhost:3000/ in browser
 * 5. Try accessing different files
 *
 * Security Considerations:
 * - Prevent directory traversal (../)
 * - Only serve files from PUBLIC_DIR
 * - Handle non-existent files with 404
 *
 * Bonus Challenges:
 * - Add directory listing
 * - Add caching headers
 * - Add support for byte ranges (partial content)
 */
