const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Monitor Server - Web interface for file monitoring
 */
class MonitorServer {
  constructor(monitor, options = {}) {
    this.monitor = monitor;
    this.options = {
      port: options.port || 3000,
      host: options.host || 'localhost',
      publicDir: options.publicDir || path.join(__dirname, '..', 'public'),
      ...options
    };

    this.clients = new Set();
    this.setupMonitorListeners();
  }

  /**
   * Setup monitor event listeners
   */
  setupMonitorListeners() {
    this.monitor.on('change', (change) => {
      this.broadcast('change', change);
    });

    this.monitor.on('watching', (data) => {
      this.broadcast('watching', data);
    });

    this.monitor.on('unwatched', (data) => {
      this.broadcast('unwatched', data);
    });

    this.monitor.on('error', (error) => {
      this.broadcast('error', {
        path: error.path,
        message: error.error?.message || error.message
      });
    });

    this.monitor.on('filter-updated', (options) => {
      this.broadcast('filter-updated', options);
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
        for (const client of this.clients) {
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
      if (url.pathname === '/api/watch' && req.method === 'POST') {
        await this.handleWatch(req, res);
      } else if (url.pathname === '/api/unwatch' && req.method === 'POST') {
        await this.handleUnwatch(req, res);
      } else if (url.pathname === '/api/paths' && req.method === 'GET') {
        await this.handleGetPaths(req, res);
      } else if (url.pathname === '/api/history' && req.method === 'GET') {
        await this.handleGetHistory(req, res);
      } else if (url.pathname === '/api/stats' && req.method === 'GET') {
        await this.handleGetStats(req, res);
      } else if (url.pathname === '/api/filter' && req.method === 'GET') {
        await this.handleGetFilter(req, res);
      } else if (url.pathname === '/api/filter' && req.method === 'POST') {
        await this.handleUpdateFilter(req, res);
      } else if (url.pathname === '/api/events' && req.method === 'GET') {
        await this.handleEvents(req, res);
      } else if (url.pathname === '/api/reset' && req.method === 'POST') {
        await this.handleReset(req, res);
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
   * Handle watch path request
   */
  async handleWatch(req, res) {
    const body = await this.readBody(req);

    try {
      const { path: targetPath } = JSON.parse(body);

      if (!targetPath) {
        this.sendError(res, 400, 'Path is required');
        return;
      }

      this.monitor.watch(targetPath);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, path: targetPath }));
    } catch (err) {
      this.sendError(res, 400, err.message);
    }
  }

  /**
   * Handle unwatch path request
   */
  async handleUnwatch(req, res) {
    const body = await this.readBody(req);

    try {
      const { path: targetPath } = JSON.parse(body);

      if (!targetPath) {
        this.sendError(res, 400, 'Path is required');
        return;
      }

      this.monitor.unwatch(targetPath);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, path: targetPath }));
    } catch (err) {
      this.sendError(res, 400, err.message);
    }
  }

  /**
   * Handle get watched paths request
   */
  async handleGetPaths(req, res) {
    const paths = this.monitor.getWatchedPaths();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(paths));
  }

  /**
   * Handle get history request
   */
  async handleGetHistory(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = parseInt(url.searchParams.get('limit')) || 100;

    const history = this.monitor.getHistory(limit);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(history));
  }

  /**
   * Handle get statistics request
   */
  async handleGetStats(req, res) {
    const stats = this.monitor.getStats();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
  }

  /**
   * Handle get filter request
   */
  async handleGetFilter(req, res) {
    const filter = this.monitor.getFilterOptions();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(filter));
  }

  /**
   * Handle update filter request
   */
  async handleUpdateFilter(req, res) {
    const body = await this.readBody(req);

    try {
      const options = JSON.parse(body);
      this.monitor.updateFilter(options);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      this.sendError(res, 400, err.message);
    }
  }

  /**
   * Handle reset request
   */
  async handleReset(req, res) {
    this.monitor.clearHistory();
    this.monitor.resetStats();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  }

  /**
   * Handle Server-Sent Events
   */
  async handleEvents(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send initial data
    this.sendEvent(res, 'stats', this.monitor.getStats());
    this.sendEvent(res, 'paths', this.monitor.getWatchedPaths());
    this.sendEvent(res, 'filter', this.monitor.getFilterOptions());

    // Add to clients
    this.clients.add(res);

    // Remove client on disconnect
    req.on('close', () => {
      this.clients.delete(res);
    });
  }

  /**
   * Send SSE event
   */
  sendEvent(res, event, data) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  /**
   * Broadcast event to all clients
   */
  broadcast(event, data) {
    for (const client of this.clients) {
      try {
        this.sendEvent(client, event, data);
      } catch (err) {
        this.clients.delete(client);
      }
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
   * Read request body
   */
  readBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', () => {
        resolve(body);
      });

      req.on('error', reject);
    });
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
      '.svg': 'image/svg+xml'
    };
    return types[ext] || 'text/plain';
  }
}

module.exports = MonitorServer;
