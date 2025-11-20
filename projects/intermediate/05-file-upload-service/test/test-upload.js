#!/usr/bin/env node

/**
 * Test Upload - Command-line tool to test file uploads
 * Usage: node test/test-upload.js <file1> <file2> ...
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

/**
 * Create multipart form data
 */
function createMultipartData(files) {
  const boundary = '----WebKitFormBoundary' + Date.now();
  const parts = [];

  for (const filePath of files) {
    const filename = path.basename(filePath);
    const content = fs.readFileSync(filePath);

    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`
    );

    parts.push(content);
    parts.push('\r\n');
  }

  parts.push(`--${boundary}--\r\n`);

  return {
    boundary,
    data: Buffer.concat(parts.map(p => Buffer.isBuffer(p) ? p : Buffer.from(p)))
  };
}

/**
 * Upload files
 */
async function uploadFiles(files) {
  const multipart = createMultipartData(files);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${multipart.boundary}`,
        'Content-Length': multipart.data.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (err) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);

    req.write(multipart.data);
    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Test Upload - Upload files to the file upload service

Usage:
  node test/test-upload.js <file1> [file2] [file3] ...

Environment Variables:
  PORT    Server port (default: 3000)
  HOST    Server host (default: localhost)

Examples:
  node test/test-upload.js test/sample.txt
  node test/test-upload.js image1.jpg image2.jpg
  PORT=8080 node test/test-upload.js document.pdf
    `);
    return;
  }

  // Validate files
  const files = [];
  for (const filePath of args) {
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      console.error(`Error: Not a file: ${filePath}`);
      process.exit(1);
    }

    files.push(filePath);
  }

  console.log(`Uploading ${files.length} file(s) to ${HOST}:${PORT}...\n`);

  for (const filePath of files) {
    const stats = fs.statSync(filePath);
    console.log(`  ${path.basename(filePath)} (${formatBytes(stats.size)})`);
  }

  console.log('');

  try {
    const startTime = Date.now();
    const response = await uploadFiles(files);
    const duration = (Date.now() - startTime) / 1000;

    console.log('Upload successful!\n');
    console.log(`Duration: ${duration.toFixed(2)}s\n`);

    if (response.files && response.files.length > 0) {
      console.log('Uploaded files:');
      for (const file of response.files) {
        console.log(`  ${file.filename} -> ${file.savedAs}`);
        console.log(`  URL: http://${HOST}:${PORT}${file.path}`);
      }
    }

  } catch (err) {
    console.error('Upload failed:', err.message);
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
