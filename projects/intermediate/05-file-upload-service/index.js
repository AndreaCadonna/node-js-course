#!/usr/bin/env node

/**
 * File Upload Service - Main Entry Point
 *
 * Usage:
 *   node index.js
 *   PORT=8080 node index.js
 */

const path = require('path');
const UploadServer = require('./src/server');

// Configuration
const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  uploadDir: path.join(__dirname, 'uploads'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  allowedExtensions: process.env.ALLOWED_EXTENSIONS
    ? process.env.ALLOWED_EXTENSIONS.split(',').map(ext => ext.trim())
    : null // null = all extensions allowed
};

/**
 * Display help message
 */
function showHelp() {
  console.log(`
File Upload Service - HTTP file upload server with progress tracking

Usage:
  node index.js              Start server with default settings
  node index.js --help       Show this help message

Environment Variables:
  PORT                       Server port (default: 3000)
  HOST                       Server host (default: localhost)
  MAX_FILE_SIZE              Maximum file size in bytes (default: 10485760 = 10MB)
  ALLOWED_EXTENSIONS         Comma-separated list of allowed extensions (default: all)

Examples:
  node index.js
  PORT=8080 node index.js
  MAX_FILE_SIZE=52428800 node index.js  # 50MB limit
  ALLOWED_EXTENSIONS=".jpg,.png,.pdf" node index.js

Features:
  - Multipart form data parsing
  - Stream-based file uploads
  - Real-time progress tracking
  - File validation (size, type)
  - Upload limits and quotas
  - Web interface with drag & drop
  - Server-Sent Events for live updates

Once running, open your browser to http://localhost:3000
  `);
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Main application
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  console.log('File Upload Service');
  console.log('===================\n');
  console.log('Configuration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Upload directory: ${config.uploadDir}`);
  console.log(`  Max file size: ${formatBytes(config.maxFileSize)}`);

  if (config.allowedExtensions) {
    console.log(`  Allowed extensions: ${config.allowedExtensions.join(', ')}`);
  } else {
    console.log(`  Allowed extensions: All`);
  }

  console.log('');

  // Create server
  const server = new UploadServer(config);

  // Start server
  try {
    const address = await server.start();
    console.log(`Server started at ${address}`);
    console.log('\nReady to accept uploads!');
    console.log('Press Ctrl+C to stop\n');
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`Error: Port ${config.port} is already in use`);
      console.error('Try using a different port: PORT=8080 node index.js');
    } else {
      console.error('Failed to start server:', err.message);
    }
    process.exit(1);
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\nShutting down...');
    await server.stop();
    console.log('Server stopped. Goodbye!');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
  });
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = UploadServer;
