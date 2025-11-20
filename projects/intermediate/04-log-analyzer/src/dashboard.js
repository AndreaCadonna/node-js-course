const http = require('http');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

/**
 * Dashboard Server - Web interface for log analysis
 * Provides real-time updates via Server-Sent Events (SSE)
 */
class DashboardServer extends EventEmitter {
  constructor(analyzer, options = {}) {
    super();
    this.analyzer = analyzer;
    this.options = {
      port: options.port || 3000,
      host: options.host || 'localhost',
      publicDir: options.publicDir || path.join(__dirname, '..', 'public')
    };

    this.clients = new Set();
    this.alerts = [];
    this.maxAlerts = 100;

    // Listen to analyzer events
    this.setupAnalyzerListeners();
  }

  /**
   * Setup listeners for analyzer events
   */
  setupAnalyzerListeners() {
    this.analyzer.on('entry', (entry) => {
      this.broadcast('entry', entry);
    });

    this.analyzer.on('stats', (stats) => {
      this.broadcast('stats', stats);
    });

    this.analyzer.on('alert', (alert) => {
      this.alerts.unshift(alert);
      if (this.alerts.length > this.maxAlerts) {
        this.alerts = this.alerts.slice(0, this.maxAlerts);
      }
      this.broadcast('alert', alert);
    });

    this.analyzer.on('complete', (stats) => {
      this.broadcast('complete', stats);
    });

    this.analyzer.on('error', (error) => {
      this.broadcast('error', { message: error.message });
    });
  }

  /**
   * Start the dashboard server
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res);
      });

      this.server.on('error', reject);

      this.server.listen(this.options.port, this.options.host, () => {
        const address = `http://${this.options.host}:${this.options.port}`;
        this.emit('ready', address);
        resolve(address);
      });
    });
  }

  /**
   * Stop the dashboard server
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
          this.emit('stopped');
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
  handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // API endpoints
    if (url.pathname === '/api/stats') {
      this.handleStats(req, res);
    } else if (url.pathname === '/api/alerts') {
      this.handleAlerts(req, res);
    } else if (url.pathname === '/api/events') {
      this.handleEvents(req, res);
    } else if (url.pathname === '/api/reset') {
      this.handleReset(req, res);
    } else {
      // Serve static files
      this.serveStatic(req, res);
    }
  }

  /**
   * Handle stats API endpoint
   */
  handleStats(req, res) {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(this.analyzer.getStats()));
  }

  /**
   * Handle alerts API endpoint
   */
  handleAlerts(req, res) {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(this.alerts));
  }

  /**
   * Handle reset API endpoint
   */
  handleReset(req, res) {
    if (req.method === 'POST') {
      this.analyzer.reset();
      this.alerts = [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } else {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
    }
  }

  /**
   * Handle Server-Sent Events (SSE) connection
   */
  handleEvents(req, res) {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send initial stats
    this.sendEvent(res, 'stats', this.analyzer.getStats());

    // Add to clients
    this.clients.add(res);

    // Remove client on disconnect
    req.on('close', () => {
      this.clients.delete(res);
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
   * Broadcast event to all connected clients
   */
  broadcast(event, data) {
    for (const client of this.clients) {
      try {
        this.sendEvent(client, event, data);
      } catch (err) {
        // Client disconnected
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
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    // Check if file exists
    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      // Determine content type
      const ext = path.extname(filePath);
      const contentType = this.getContentType(ext);

      // Stream file to response
      res.writeHead(200, { 'Content-Type': contentType });
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);

      readStream.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      });
    });
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

module.exports = DashboardServer;
