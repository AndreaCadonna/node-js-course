const http = require('http');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const FileUploader = require('./uploader');
const { MultipartParser } = require('./multipart-parser');

/**
 * File Upload Server
 * HTTP server for handling file uploads with progress tracking
 */
class UploadServer {
  constructor(options = {}) {
    this.options = {
      port: options.port || 3000,
      host: options.host || 'localhost',
      publicDir: options.publicDir || path.join(__dirname, '..', 'public'),
      uploadDir: options.uploadDir || path.join(__dirname, '..', 'uploads'),
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024,
      allowedExtensions: options.allowedExtensions || null,
      ...options
    };

    this.uploader = new FileUploader({
      uploadDir: this.options.uploadDir,
      maxFileSize: this.options.maxFileSize,
      allowedExtensions: this.options.allowedExtensions
    });

    this.clients = new Map();
    this.setupUploaderEvents();
  }

  /**
   * Setup uploader event listeners
   */
  setupUploaderEvents() {
    this.uploader.on('start', (data) => {
      this.broadcast('upload-start', data);
    });

    this.uploader.on('progress', (data) => {
      this.broadcast('upload-progress', data);
    });

    this.uploader.on('complete', (data) => {
      this.broadcast('upload-complete', data);
    });

    this.uploader.on('error', (data) => {
      this.broadcast('upload-error', data);
    });
  }

  /**
   * Start the server
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', reject);

      this.server.listen(this.options.port, this.options.host, () => {
        const address = `http://${this.options.host}:${this.options.port}`;
        resolve(address);
      });
    });
  }

  /**
   * Stop the server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        // Close all SSE connections
        for (const client of this.clients.values()) {
          client.end();
        }
        this.clients.clear();

        this.server.close(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle HTTP requests
   */
  async handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      // API routes
      if (url.pathname === '/api/upload' && req.method === 'POST') {
        await this.handleUpload(req, res);
      } else if (url.pathname === '/api/uploads' && req.method === 'GET') {
        await this.handleGetUploads(req, res);
      } else if (url.pathname.startsWith('/api/uploads/') && req.method === 'DELETE') {
        await this.handleDeleteUpload(req, res, url);
      } else if (url.pathname === '/api/stats' && req.method === 'GET') {
        await this.handleGetStats(req, res);
      } else if (url.pathname === '/api/events' && req.method === 'GET') {
        await this.handleEvents(req, res);
      } else if (url.pathname.startsWith('/uploads/') && req.method === 'GET') {
        await this.handleDownload(req, res, url);
      } else {
        // Serve static files
        this.serveStatic(req, res);
      }
    } catch (err) {
      console.error('Request error:', err);
      this.sendError(res, 500, err.message);
    }
  }

  /**
   * Handle file upload
   */
  async handleUpload(req, res) {
    const contentType = req.headers['content-type'];

    if (!contentType || !contentType.includes('multipart/form-data')) {
      this.sendError(res, 400, 'Content-Type must be multipart/form-data');
      return;
    }

    const boundary = MultipartParser.getBoundary(contentType);
    if (!boundary) {
      this.sendError(res, 400, 'Invalid multipart boundary');
      return;
    }

    const parser = new MultipartParser(boundary);
    const files = [];
    const fields = {};

    parser.on('field', (field) => {
      fields[field.name] = field.value;
    });

    parser.on('file', async (file) => {
      try {
        const upload = await this.uploader.uploadFromBuffer(
          file.filename,
          file.data,
          {
            contentType: file.contentType,
            fieldName: file.name
          }
        );

        files.push({
          fieldName: file.name,
          filename: upload.originalFilename,
          savedAs: upload.safeFilename,
          size: upload.size,
          uploadId: upload.id,
          path: `/uploads/${upload.safeFilename}`
        });
      } catch (err) {
        console.error('Upload error:', err);
      }
    });

    // Collect request data
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      parser.write(buffer);
      parser.end();

      // Send response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        files,
        fields
      }));
    });

    req.on('error', (err) => {
      this.sendError(res, 500, err.message);
    });
  }

  /**
   * Handle get uploads
   */
  async handleGetUploads(req, res) {
    const uploads = this.uploader.getAllUploads();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(uploads));
  }

  /**
   * Handle delete upload
   */
  async handleDeleteUpload(req, res, url) {
    const uploadId = url.pathname.split('/').pop();

    try {
      await this.uploader.deleteUpload(uploadId);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      this.sendError(res, 404, err.message);
    }
  }

  /**
   * Handle get statistics
   */
  async handleGetStats(req, res) {
    const stats = this.uploader.getStats();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
  }

  /**
   * Handle Server-Sent Events
   */
  async handleEvents(req, res) {
    const clientId = Date.now() + Math.random();

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    this.clients.set(clientId, res);

    // Send initial stats
    this.sendEvent(res, 'stats', this.uploader.getStats());

    req.on('close', () => {
      this.clients.delete(clientId);
    });
  }

  /**
   * Handle file download
   */
  async handleDownload(req, res, url) {
    const filename = url.pathname.split('/').pop();
    const filePath = path.join(this.options.uploadDir, filename);

    // Security: prevent directory traversal
    if (!filePath.startsWith(this.options.uploadDir)) {
      this.sendError(res, 403, 'Forbidden');
      return;
    }

    try {
      await fs.promises.access(filePath, fs.constants.R_OK);

      const stat = await fs.promises.stat(filePath);
      const ext = path.extname(filename);

      res.writeHead(200, {
        'Content-Type': this.getContentType(ext),
        'Content-Length': stat.size,
        'Content-Disposition': `inline; filename="${filename}"`
      });

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);

      readStream.on('error', (err) => {
        console.error('Download error:', err);
        res.end();
      });
    } catch (err) {
      this.sendError(res, 404, 'File not found');
    }
  }

  /**
   * Serve static files
   */
  serveStatic(req, res) {
    let filePath = path.join(
      this.options.publicDir,
      req.url === '/' ? 'index.html' : req.url
    );

    // Security: prevent directory traversal
    if (!filePath.startsWith(this.options.publicDir)) {
      this.sendError(res, 403, 'Forbidden');
      return;
    }

    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (err) {
        this.sendError(res, 404, 'Not Found');
        return;
      }

      const ext = path.extname(filePath);
      const contentType = this.getContentType(ext);

      res.writeHead(200, { 'Content-Type': contentType });
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);

      readStream.on('error', (err) => {
        this.sendError(res, 500, 'Internal Server Error');
      });
    });
  }

  /**
   * Send SSE event to client
   */
  sendEvent(res, event, data) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  /**
   * Broadcast event to all clients
   */
  broadcast(event, data) {
    for (const client of this.clients.values()) {
      try {
        this.sendEvent(client, event, data);
      } catch (err) {
        // Client disconnected
      }
    }
  }

  /**
   * Send error response
   */
  sendError(res, status, message) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  }

  /**
   * Get content type for file extension
   */
  getContentType(ext) {
    const types = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain'
    };
    return types[ext] || 'application/octet-stream';
  }
}

module.exports = UploadServer;
