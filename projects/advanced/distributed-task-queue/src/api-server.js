/**
 * API Server
 * HTTP API for task queue management using cluster for scalability
 */

const http = require('http');
const cluster = require('cluster');
const { EventEmitter } = require('events');
const url = require('url');

class APIServer extends EventEmitter {
  constructor(taskQueue, options = {}) {
    super();

    this.taskQueue = taskQueue;
    this.port = options.port || 3000;
    this.host = options.host || '0.0.0.0';
    this.clustered = options.clustered !== false;
    this.numWorkers = options.numWorkers || require('os').cpus().length;

    this.server = null;
    this.connections = new Set();
  }

  /**
   * Start API server
   */
  async start() {
    if (this.clustered && cluster.isPrimary) {
      return this.startCluster();
    } else {
      return this.startServer();
    }
  }

  /**
   * Start clustered server
   */
  async startCluster() {
    console.log(`Primary ${process.pid} is running`);

    // Fork workers
    for (let i = 0; i < this.numWorkers; i++) {
      cluster.fork();
    }

    // Handle worker exit
    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died (${signal || code})`);

      // Restart worker
      setTimeout(() => {
        console.log('Starting a new worker');
        cluster.fork();
      }, 1000);
    });

    // Handle shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());

    this.emit('cluster:started', {
      pid: process.pid,
      workers: this.numWorkers
    });
  }

  /**
   * Start single server instance
   */
  async startServer() {
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res).catch(error => {
        console.error('Request handling error:', error);
        this.sendError(res, 500, 'Internal server error');
      });
    });

    // Track connections for graceful shutdown
    this.server.on('connection', (conn) => {
      this.connections.add(conn);
      conn.on('close', () => {
        this.connections.delete(conn);
      });
    });

    return new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, (error) => {
        if (error) {
          reject(error);
        } else {
          const workerId = cluster.worker ? cluster.worker.id : 'single';
          console.log(`Worker ${process.pid} listening on ${this.host}:${this.port}`);

          this.emit('server:started', {
            pid: process.pid,
            workerId,
            host: this.host,
            port: this.port
          });

          resolve();
        }
      });
    });
  }

  /**
   * Handle HTTP request
   */
  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Route requests
    if (method === 'POST' && pathname === '/tasks') {
      await this.handleAddTask(req, res);
    } else if (method === 'GET' && pathname.startsWith('/tasks/')) {
      await this.handleGetTask(req, res, pathname);
    } else if (method === 'GET' && pathname === '/tasks') {
      await this.handleListTasks(req, res, parsedUrl.query);
    } else if (method === 'DELETE' && pathname.startsWith('/tasks/')) {
      await this.handleDeleteTask(req, res, pathname);
    } else if (method === 'GET' && pathname === '/stats') {
      await this.handleGetStats(req, res);
    } else if (method === 'GET' && pathname === '/health') {
      await this.handleHealthCheck(req, res);
    } else if (method === 'POST' && pathname === '/shutdown') {
      await this.handleShutdown(req, res);
    } else {
      this.sendError(res, 404, 'Not found');
    }
  }

  /**
   * Handle add task
   */
  async handleAddTask(req, res) {
    try {
      const body = await this.parseBody(req);

      if (!body.type) {
        return this.sendError(res, 400, 'Task type is required');
      }

      const task = await this.taskQueue.addTask(body);

      this.sendJSON(res, 201, {
        success: true,
        task: task.toJSON()
      });
    } catch (error) {
      this.sendError(res, 400, error.message);
    }
  }

  /**
   * Handle get task
   */
  async handleGetTask(req, res, pathname) {
    try {
      const taskId = pathname.split('/')[2];
      const task = this.taskQueue.getTask(taskId);

      if (!task) {
        return this.sendError(res, 404, 'Task not found');
      }

      this.sendJSON(res, 200, {
        success: true,
        task: task.toJSON()
      });
    } catch (error) {
      this.sendError(res, 400, error.message);
    }
  }

  /**
   * Handle list tasks
   */
  async handleListTasks(req, res, query) {
    try {
      const status = query.status;
      const limit = parseInt(query.limit) || 100;
      const offset = parseInt(query.offset) || 0;

      const allTasks = Array.from(this.taskQueue.queueManager.tasks.values());

      let filteredTasks = allTasks;
      if (status) {
        filteredTasks = allTasks.filter(task => task.status === status);
      }

      // Sort by creation time (newest first)
      filteredTasks.sort((a, b) => b.createdAt - a.createdAt);

      // Paginate
      const paginatedTasks = filteredTasks.slice(offset, offset + limit);

      this.sendJSON(res, 200, {
        success: true,
        tasks: paginatedTasks.map(task => task.toJSON()),
        total: filteredTasks.length,
        limit,
        offset
      });
    } catch (error) {
      this.sendError(res, 400, error.message);
    }
  }

  /**
   * Handle delete task
   */
  async handleDeleteTask(req, res, pathname) {
    try {
      const taskId = pathname.split('/')[2];
      const task = this.taskQueue.getTask(taskId);

      if (!task) {
        return this.sendError(res, 404, 'Task not found');
      }

      // Only allow deletion of completed/failed tasks
      if (task.status !== 'completed' && task.status !== 'failed') {
        return this.sendError(res, 400, 'Can only delete completed or failed tasks');
      }

      this.taskQueue.queueManager.tasks.delete(taskId);
      this.taskQueue.queueManager.tasksByStatus[task.status].delete(taskId);

      this.sendJSON(res, 200, {
        success: true,
        message: 'Task deleted'
      });
    } catch (error) {
      this.sendError(res, 400, error.message);
    }
  }

  /**
   * Handle get stats
   */
  async handleGetStats(req, res) {
    try {
      const stats = this.taskQueue.getStats();

      this.sendJSON(res, 200, {
        success: true,
        stats: {
          ...stats,
          server: {
            pid: process.pid,
            workerId: cluster.worker ? cluster.worker.id : null,
            uptime: process.uptime(),
            memory: process.memoryUsage()
          }
        }
      });
    } catch (error) {
      this.sendError(res, 500, error.message);
    }
  }

  /**
   * Handle health check
   */
  async handleHealthCheck(req, res) {
    const stats = this.taskQueue.getStats();

    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime(),
      pid: process.pid,
      queue: {
        running: stats.running,
        totalTasks: stats.queue.total,
        pendingTasks: stats.queue.byStatus.pending
      },
      workers: {
        total: stats.workers.poolSize,
        available: stats.workers.availableWorkers,
        busy: stats.workers.busyWorkers
      }
    };

    this.sendJSON(res, 200, health);
  }

  /**
   * Handle shutdown
   */
  async handleShutdown(req, res) {
    this.sendJSON(res, 200, {
      success: true,
      message: 'Shutdown initiated'
    });

    // Delay shutdown to allow response to be sent
    setTimeout(() => {
      this.shutdown();
    }, 100);
  }

  /**
   * Parse request body
   */
  async parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve(parsed);
        } catch (error) {
          reject(new Error('Invalid JSON'));
        }
      });

      req.on('error', reject);
    });
  }

  /**
   * Send JSON response
   */
  sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  /**
   * Send error response
   */
  sendError(res, statusCode, message) {
    this.sendJSON(res, statusCode, {
      success: false,
      error: message
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down API server...');

    if (cluster.isPrimary && this.clustered) {
      // Shutdown all workers
      for (const id in cluster.workers) {
        cluster.workers[id].kill();
      }
      process.exit(0);
    } else {
      // Close server
      if (this.server) {
        // Stop accepting new connections
        this.server.close(() => {
          console.log('Server closed');
        });

        // Close existing connections
        for (const conn of this.connections) {
          conn.destroy();
        }
      }

      // Shutdown task queue
      await this.taskQueue.shutdown({ timeout: 10000 });

      process.exit(0);
    }
  }
}

module.exports = APIServer;
