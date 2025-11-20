/**
 * HTTP Server - Provides API and dashboard
 *
 * Features:
 * - RESTful API for metrics and alerts
 * - Real-time updates with Server-Sent Events
 * - Web dashboard
 * - API authentication
 * - CORS support
 */

const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const querystring = require('querystring');

class MonitorServer {
  constructor(monitor, alertManager, options = {}) {
    this.monitor = monitor;
    this.alertManager = alertManager;

    this.port = options.port || 3000;
    this.apiKey = options.apiKey || this.generateApiKey();
    this.enableAuth = options.enableAuth !== false;

    this.server = null;
    this.sseClients = new Set();

    console.log('[Server] API Key:', this.apiKey);
  }

  /**
   * Start server
   */
  async start() {
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res).catch(err => {
        console.error('[Server] Request error:', err);
        this.sendError(res, 500, 'Internal server error');
      });
    });

    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`[Server] Listening on http://localhost:${this.port}`);
          resolve();
        }
      });
    });
  }

  /**
   * Stop server
   */
  async stop() {
    // Close all SSE connections
    for (const client of this.sseClients) {
      client.end();
    }
    this.sseClients.clear();

    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('[Server] Stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Handle HTTP request
   */
  async handleRequest(req, res) {
    const parsed = url.parse(req.url, true);
    const pathname = parsed.pathname;
    const query = parsed.query;

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Check authentication (except for root and health)
    if (this.enableAuth && pathname !== '/' && pathname !== '/health') {
      const authHeader = req.headers.authorization;
      if (!this.isAuthorized(authHeader)) {
        return this.sendError(res, 401, 'Unauthorized');
      }
    }

    // Route requests
    if (pathname === '/' && req.method === 'GET') {
      return this.serveDashboard(res);
    } else if (pathname === '/health' && req.method === 'GET') {
      return this.sendJSON(res, { status: 'ok', timestamp: Date.now() });
    } else if (pathname === '/api/metrics' && req.method === 'GET') {
      return this.handleGetMetrics(res, query);
    } else if (pathname === '/api/stats' && req.method === 'GET') {
      return this.handleGetStats(res);
    } else if (pathname === '/api/alerts' && req.method === 'GET') {
      return this.handleGetAlerts(res, query);
    } else if (pathname === '/api/events' && req.method === 'GET') {
      return this.handleSSE(req, res);
    } else if (pathname.startsWith('/public/')) {
      return this.serveStatic(pathname, res);
    } else {
      return this.sendError(res, 404, 'Not found');
    }
  }

  /**
   * Check authorization
   */
  isAuthorized(authHeader) {
    if (!authHeader) return false;

    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) return false;

    return match[1] === this.apiKey;
  }

  /**
   * Handle GET /api/metrics
   */
  handleGetMetrics(res, query) {
    const limit = parseInt(query.limit) || 100;
    const history = this.monitor.getHistory(limit);

    return this.sendJSON(res, {
      current: this.monitor.getCurrentMetrics(),
      history: history,
      count: history.length
    });
  }

  /**
   * Handle GET /api/stats
   */
  handleGetStats(res) {
    const stats = this.monitor.getStatistics();
    const alertStats = this.alertManager.getStatistics();

    return this.sendJSON(res, {
      monitoring: stats,
      alerts: alertStats,
      uptime: process.uptime(),
      timestamp: Date.now()
    });
  }

  /**
   * Handle GET /api/alerts
   */
  handleGetAlerts(res, query) {
    const limit = parseInt(query.limit) || 100;
    const history = this.alertManager.getHistory(limit);
    const active = this.alertManager.getActiveAlerts();

    return this.sendJSON(res, {
      active: active,
      history: history,
      count: history.length
    });
  }

  /**
   * Handle Server-Sent Events
   */
  handleSSE(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    this.sseClients.add(res);

    // Send initial data
    this.sendSSEEvent(res, 'connected', { timestamp: Date.now() });

    // Listen for metrics
    const metricsHandler = (metrics) => {
      this.sendSSEEvent(res, 'metrics', metrics);
    };

    // Listen for alerts
    const alertHandler = (alert) => {
      this.sendSSEEvent(res, 'alert', alert);
    };

    this.monitor.on('metrics', metricsHandler);
    this.alertManager.on('alert', alertHandler);

    // Handle client disconnect
    req.on('close', () => {
      this.sseClients.delete(res);
      this.monitor.off('metrics', metricsHandler);
      this.alertManager.off('alert', alertHandler);
    });
  }

  /**
   * Send SSE event
   */
  sendSSEEvent(res, event, data) {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      // Client disconnected
    }
  }

  /**
   * Serve dashboard
   */
  async serveDashboard(res) {
    try {
      const filePath = path.join(__dirname, '../public/index.html');
      const content = await fs.readFile(filePath, 'utf8');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch (err) {
      return this.sendError(res, 500, 'Failed to load dashboard');
    }
  }

  /**
   * Serve static files
   */
  async serveStatic(pathname, res) {
    try {
      const filePath = path.join(__dirname, '..', pathname);

      // Security check
      const normalized = path.normalize(filePath);
      const publicDir = path.join(__dirname, '../public');
      if (!normalized.startsWith(publicDir)) {
        return this.sendError(res, 403, 'Forbidden');
      }

      const content = await fs.readFile(filePath);
      const ext = path.extname(filePath);

      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json'
      };

      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      res.end(content);
    } catch (err) {
      return this.sendError(res, 404, 'File not found');
    }
  }

  /**
   * Send JSON response
   */
  sendJSON(res, data, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  /**
   * Send error response
   */
  sendError(res, status, message) {
    this.sendJSON(res, { error: message }, status);
  }

  /**
   * Generate API key
   */
  generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = MonitorServer;
