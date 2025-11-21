#!/usr/bin/env node

/**
 * CMS Server - Main Entry Point
 * Integrates all Node.js core modules for a production-ready CMS
 *
 * Modules used: http, url, querystring, events, stream, util, os, process
 */

const http = require('http');
const url = require('url');
const querystring = require('querystring');
const EventEmitter = require('events');
const { promisify } = require('util');
const os = require('os');
const zlib = require('zlib');
const path = require('path');
const fs = require('fs');

const AuthManager = require('./auth/auth-manager');
const ContentManager = require('./content/content-manager');
const MediaManager = require('./media/media-manager');
const TemplateEngine = require('./templates/template-engine');
const Router = require('./api/router');
const RateLimiter = require('./api/rate-limiter');
const Logger = require('./monitoring/logger');
const Metrics = require('./monitoring/metrics');
const HealthCheck = require('./monitoring/health');
const { gzipContent, shouldCompress } = require('./utils/compression');
const FileCache = require('./utils/cache');

class CMSServer extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.logger = new Logger(config.logPath);
    this.metrics = new Metrics();
    this.health = new HealthCheck();
    this.cache = new FileCache(config.cachePath);
    this.rateLimiter = new RateLimiter();

    // Initialize managers
    this.authManager = new AuthManager(config.storage.users, config.storage.sessions);
    this.contentManager = new ContentManager(config.storage.content);
    this.mediaManager = new MediaManager(config.storage.media);
    this.templateEngine = new TemplateEngine(config.templatesPath);
    this.router = new Router(this);

    this.server = null;
    this.isShuttingDown = false;

    // Setup process handlers
    this.setupProcessHandlers();

    this.logger.info('CMS Server initialized', {
      pid: process.pid,
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch()
    });
  }

  setupProcessHandlers() {
    // Graceful shutdown on SIGTERM/SIGINT
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));

    // Log uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      this.shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection', { reason, promise });
    });

    // Memory monitoring
    setInterval(() => {
      const usage = process.memoryUsage();
      this.metrics.recordMemory(usage);

      if (usage.heapUsed > this.config.maxMemory) {
        this.logger.warn('High memory usage', { heapUsed: usage.heapUsed });
        this.emit('highMemory', usage);
      }
    }, 30000); // Check every 30 seconds
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res).catch(error => {
          this.logger.error('Request handler error', { error: error.message });
          this.sendError(res, 500, 'Internal Server Error');
        });
      });

      this.server.on('error', (error) => {
        this.logger.error('Server error', { error: error.message });
        reject(error);
      });

      this.server.on('clientError', (error, socket) => {
        this.logger.error('Client error', { error: error.message });
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      });

      this.server.listen(this.config.port, this.config.host, () => {
        const address = this.server.address();
        this.logger.info('Server started', {
          host: address.address,
          port: address.port,
          pid: process.pid,
          workerId: process.env.WORKER_ID
        });

        this.emit('started', { host: address.address, port: address.port });
        resolve(address);
      });
    });
  }

  async handleRequest(req, res) {
    const startTime = Date.now();
    const parsedUrl = url.parse(req.url, true);

    // Parse request details
    req.pathname = parsedUrl.pathname;
    req.query = parsedUrl.query;
    req.parsedUrl = parsedUrl;

    // Log request
    this.logger.info('Request', {
      method: req.method,
      url: req.url,
      ip: req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    // Rate limiting
    const clientIp = req.socket.remoteAddress;
    if (!this.rateLimiter.allowRequest(clientIp)) {
      this.logger.warn('Rate limit exceeded', { ip: clientIp });
      return this.sendError(res, 429, 'Too Many Requests');
    }

    // Health check endpoint
    if (req.pathname === '/health') {
      return this.handleHealthCheck(req, res);
    }

    // Metrics endpoint
    if (req.pathname === '/metrics') {
      return this.handleMetrics(req, res);
    }

    try {
      // Route the request
      const handled = await this.router.route(req, res);

      if (!handled) {
        // Serve static files or 404
        await this.serveStatic(req, res);
      }

      // Record metrics
      const duration = Date.now() - startTime;
      this.metrics.recordRequest(req.method, req.pathname, res.statusCode, duration);

      this.logger.info('Response', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration
      });

    } catch (error) {
      this.logger.error('Request error', {
        method: req.method,
        url: req.url,
        error: error.message,
        stack: error.stack
      });

      if (!res.headersSent) {
        this.sendError(res, 500, 'Internal Server Error');
      }
    }
  }

  async serveStatic(req, res) {
    const filePath = path.join(this.config.publicPath, req.pathname);

    // Security: prevent directory traversal
    if (!filePath.startsWith(this.config.publicPath)) {
      return this.sendError(res, 403, 'Forbidden');
    }

    try {
      // Check cache first
      const cached = this.cache.get(filePath);
      if (cached) {
        return this.sendFile(res, cached.data, cached.mimeType, true);
      }

      // Read file
      const stats = await fs.promises.stat(filePath);

      if (!stats.isFile()) {
        return this.sendError(res, 404, 'Not Found');
      }

      const mimeType = this.getMimeType(filePath);
      const fileStream = fs.createReadStream(filePath);

      // Cache small files
      if (stats.size < this.config.maxCacheFileSize) {
        const chunks = [];
        fileStream.on('data', chunk => chunks.push(chunk));
        fileStream.on('end', () => {
          const data = Buffer.concat(chunks);
          this.cache.set(filePath, { data, mimeType });
        });
      }

      // Stream response with compression if applicable
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600'
      });

      if (shouldCompress(mimeType)) {
        const gzip = zlib.createGzip();
        res.setHeader('Content-Encoding', 'gzip');
        fileStream.pipe(gzip).pipe(res);
      } else {
        fileStream.pipe(res);
      }

    } catch (error) {
      if (error.code === 'ENOENT') {
        return this.sendError(res, 404, 'Not Found');
      }
      throw error;
    }
  }

  handleHealthCheck(req, res) {
    const healthStatus = this.health.check({
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      cpu: os.loadavg()
    });

    this.sendJSON(res, healthStatus.healthy ? 200 : 503, healthStatus);
  }

  handleMetrics(req, res) {
    const metrics = this.metrics.getMetrics();
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      processUptime: process.uptime(),
      processMemory: process.memoryUsage(),
      loadAvg: os.loadavg()
    };

    this.sendJSON(res, 200, { ...metrics, system: systemInfo });
  }

  sendJSON(res, statusCode, data) {
    const json = JSON.stringify(data, null, 2);
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(json)
    });
    res.end(json);
  }

  sendFile(res, data, mimeType, cached = false) {
    const headers = {
      'Content-Type': mimeType,
      'Content-Length': data.length
    };

    if (cached) {
      headers['X-Cache'] = 'HIT';
    }

    res.writeHead(200, headers);
    res.end(data);
  }

  sendError(res, statusCode, message) {
    res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
    res.end(message);
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async shutdown(signal) {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    this.logger.info('Shutting down', { signal, pid: process.pid });

    // Stop accepting new connections
    if (this.server) {
      this.server.close(() => {
        this.logger.info('Server closed');
      });
    }

    // Wait for existing requests to complete
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Cleanup
    await this.authManager.cleanup();
    await this.cache.cleanup();
    this.logger.info('Cleanup complete');

    process.exit(0);
  }
}

// Export for cluster manager
module.exports = CMSServer;

// Run directly if not clustered
if (require.main === module) {
  const configPath = path.join(__dirname, '../config/default.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const server = new CMSServer(config);
  server.start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
