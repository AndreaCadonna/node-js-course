/**
 * Exercise 1: Sticky Sessions with External Session Store - SOLUTION
 *
 * A production-ready sticky session implementation with:
 * - Secure session store with TTL
 * - Cookie-based routing
 * - Session migration on worker failure
 * - Session cleanup
 * - IP fallback routing
 * - Session refresh (sliding expiration)
 * - Session data encryption
 */

const cluster = require('cluster');
const http = require('http');
const crypto = require('crypto');
const os = require('os');
const { URL } = require('url');

const PORT = 8000;
const numCPUs = Math.min(4, os.cpus().length);
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
const ENCRYPTION_KEY = crypto.randomBytes(32); // In production, use env variable
const ENCRYPTION_IV_LENGTH = 16;

// ===== SESSION STORE WITH REDIS-COMPATIBLE INTERFACE =====

/**
 * SessionStore - Production-ready session management with encryption and TTL
 * Redis-compatible interface for easy migration to real Redis
 */
class SessionStore {
  constructor(encryptionKey = null) {
    this.sessions = new Map(); // sessionId -> { data, expiry, workerId }
    this.encryptionKey = encryptionKey;
    this.stats = {
      total: 0,
      active: 0,
      expired: 0,
      created: 0,
      refreshed: 0
    };
  }

  /**
   * Encrypt session data for security
   */
  _encrypt(text) {
    if (!this.encryptionKey) return text;

    const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(JSON.stringify(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt session data
   */
  _decrypt(text) {
    if (!this.encryptionKey) return text;

    try {
      const parts = text.split(':');
      const iv = Buffer.from(parts.shift(), 'hex');
      const encryptedText = parts.join(':');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('[SessionStore] Decryption failed:', error.message);
      return null;
    }
  }

  /**
   * Get session data if exists and not expired
   */
  async get(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check expiration
    if (Date.now() > session.expiry) {
      this.sessions.delete(sessionId);
      this.stats.expired++;
      return null;
    }

    // Decrypt if encryption enabled
    const data = this.encryptionKey ? this._decrypt(session.data) : session.data;
    return {
      data,
      workerId: session.workerId,
      expiry: session.expiry
    };
  }

  /**
   * Set session data with TTL
   */
  async set(sessionId, data, ttl = SESSION_TIMEOUT) {
    const isNew = !this.sessions.has(sessionId);

    // Encrypt if encryption enabled
    const sessionData = this.encryptionKey ? this._encrypt(data) : data;

    this.sessions.set(sessionId, {
      data: sessionData,
      expiry: Date.now() + ttl,
      workerId: data.workerId || null,
      createdAt: isNew ? Date.now() : this.sessions.get(sessionId)?.createdAt
    });

    if (isNew) {
      this.stats.total++;
      this.stats.created++;
    }

    return true;
  }

  /**
   * Delete session
   */
  async delete(sessionId) {
    const existed = this.sessions.delete(sessionId);
    if (existed) {
      this.stats.total--;
    }
    return existed;
  }

  /**
   * Check if session exists and not expired
   */
  async exists(sessionId) {
    const session = await this.get(sessionId);
    return session !== null;
  }

  /**
   * Refresh session expiration (sliding window)
   */
  async refresh(sessionId, ttl = SESSION_TIMEOUT) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return false;
    }

    session.expiry = Date.now() + ttl;
    this.stats.refreshed++;
    return true;
  }

  /**
   * Cleanup expired sessions
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiry) {
        this.sessions.delete(sessionId);
        cleaned++;
        this.stats.expired++;
        this.stats.total--;
      }
    }

    return cleaned;
  }

  /**
   * Get session statistics
   */
  getStats() {
    this.stats.active = this.sessions.size;
    return { ...this.stats };
  }

  /**
   * Get all sessions for a specific worker (for migration)
   */
  getSessionsByWorker(workerId) {
    const workerSessions = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.workerId === workerId) {
        workerSessions.push(sessionId);
      }
    }

    return workerSessions;
  }

  /**
   * Migrate sessions from one worker to another
   */
  async migrateSessions(fromWorkerId, toWorkerId) {
    let migrated = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.workerId === fromWorkerId) {
        session.workerId = toWorkerId;
        migrated++;
      }
    }

    console.log(`[SessionStore] Migrated ${migrated} sessions from worker ${fromWorkerId} to ${toWorkerId}`);
    return migrated;
  }
}

// ===== MASTER PROCESS =====

if (cluster.isMaster) {
  console.log(`[Master] Starting with PID ${process.pid}`);
  console.log(`[Master] Forking ${numCPUs} workers...`);

  // Initialize session store with encryption
  const sessionStore = new SessionStore(ENCRYPTION_KEY);

  // Track workers
  const workers = new Map();
  const workerStats = new Map();

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    workers.set(worker.id, worker);
    workerStats.set(worker.id, {
      requests: 0,
      activeSessions: 0,
      lastSeen: Date.now()
    });

    console.log(`[Master] Worker ${worker.id} started with PID ${worker.process.pid}`);
  }

  /**
   * Generate secure session ID
   */
  function generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Parse cookies from request headers
   */
  function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });

    return cookies;
  }

  /**
   * Get client IP address (for fallback routing)
   */
  function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
  }

  /**
   * Hash IP address to worker ID (consistent hashing for fallback)
   */
  function hashIPToWorker(ip) {
    const hash = crypto.createHash('md5').update(ip).digest('hex');
    const hashInt = parseInt(hash.substring(0, 8), 16);
    const workerIds = Array.from(workers.keys());
    return workerIds[hashInt % workerIds.length];
  }

  /**
   * Select worker for request (sticky session or IP-based fallback)
   */
  async function selectWorker(req) {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies.sessionId;

    // Try cookie-based routing first
    if (sessionId) {
      const session = await sessionStore.get(sessionId);

      if (session && workers.has(session.workerId)) {
        // Refresh session on activity (sliding expiration)
        await sessionStore.refresh(sessionId);
        console.log(`[Master] Routing to worker ${session.workerId} (sticky session: ${sessionId.substring(0, 8)}...)`);
        return { workerId: session.workerId, sessionId, isNew: false };
      }
    }

    // Fallback to IP-based routing for consistency
    const clientIP = getClientIP(req);
    const workerId = hashIPToWorker(clientIP);
    const newSessionId = generateSessionId();

    // Create new session
    await sessionStore.set(newSessionId, {
      workerId,
      createdAt: Date.now(),
      ip: clientIP
    });

    console.log(`[Master] New session ${newSessionId.substring(0, 8)}... for IP ${clientIP} -> worker ${workerId}`);
    return { workerId, sessionId: newSessionId, isNew: true };
  }

  /**
   * Forward request to worker
   */
  function forwardToWorker(workerId, req, res, sessionId, isNew) {
    const worker = workers.get(workerId);

    if (!worker) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Service Unavailable: No workers available');
      return;
    }

    // Create message channel for this request
    const requestId = crypto.randomBytes(16).toString('hex');

    // Listen for worker response
    const responseHandler = (msg) => {
      if (msg.type === 'response' && msg.requestId === requestId) {
        worker.removeListener('message', responseHandler);

        // Set session cookie
        const cookieValue = `sessionId=${sessionId}; HttpOnly; Max-Age=${SESSION_TIMEOUT / 1000}; Path=/`;

        res.writeHead(msg.statusCode || 200, {
          'Content-Type': msg.contentType || 'text/plain',
          'Set-Cookie': cookieValue,
          'X-Worker-ID': workerId,
          'X-Session-ID': sessionId.substring(0, 8) + '...'
        });
        res.end(msg.body);

        // Update stats
        const stats = workerStats.get(workerId);
        if (stats) {
          stats.requests++;
          stats.lastSeen = Date.now();
        }
      }
    };

    worker.on('message', responseHandler);

    // Send request to worker
    worker.send({
      type: 'request',
      requestId,
      url: req.url,
      method: req.method,
      headers: req.headers,
      sessionId,
      isNew
    });

    // Timeout handling
    setTimeout(() => {
      worker.removeListener('message', responseHandler);
      if (!res.headersSent) {
        res.writeHead(504, { 'Content-Type': 'text/plain' });
        res.end('Gateway Timeout');
      }
    }, 30000); // 30 second timeout
  }

  /**
   * Create master HTTP server
   */
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // Statistics endpoint
    if (url.pathname === '/stats') {
      const stats = sessionStore.getStats();
      const workerList = Array.from(workers.keys()).map(id => ({
        id,
        pid: workers.get(id).process.pid,
        stats: workerStats.get(id)
      }));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        sessions: stats,
        workers: workerList,
        uptime: process.uptime()
      }, null, 2));
      return;
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        workers: workers.size,
        sessions: sessionStore.sessions.size
      }));
      return;
    }

    // Route to worker with sticky session
    try {
      const { workerId, sessionId, isNew } = await selectWorker(req);
      forwardToWorker(workerId, req, res, sessionId, isNew);
    } catch (error) {
      console.error('[Master] Error routing request:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });

  server.listen(PORT, () => {
    console.log(`[Master] Server listening on port ${PORT}`);
    console.log(`[Master] Session encryption: ${ENCRYPTION_KEY ? 'ENABLED' : 'DISABLED'}`);
  });

  // Periodic session cleanup
  setInterval(() => {
    const cleaned = sessionStore.cleanup();
    if (cleaned > 0) {
      console.log(`[Master] Cleaned up ${cleaned} expired sessions`);
    }
  }, CLEANUP_INTERVAL);

  // Handle worker crashes
  cluster.on('exit', (worker, code, signal) => {
    console.log(`[Master] Worker ${worker.id} died (${signal || code}). Restarting...`);

    workers.delete(worker.id);
    workerStats.delete(worker.id);

    // Migrate sessions to another worker
    const remainingWorkers = Array.from(workers.keys());
    if (remainingWorkers.length > 0) {
      const targetWorker = remainingWorkers[0];
      sessionStore.migrateSessions(worker.id, targetWorker);
    }

    // Fork new worker
    const newWorker = cluster.fork();
    workers.set(newWorker.id, newWorker);
    workerStats.set(newWorker.id, {
      requests: 0,
      activeSessions: 0,
      lastSeen: Date.now()
    });

    console.log(`[Master] New worker ${newWorker.id} started with PID ${newWorker.process.pid}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Master] SIGTERM received, shutting down gracefully...');

    server.close(() => {
      console.log('[Master] HTTP server closed');

      // Disconnect all workers
      for (const worker of workers.values()) {
        worker.disconnect();
      }

      console.log('[Master] All workers disconnected. Exiting.');
      process.exit(0);
    });
  });

  // Log periodic statistics
  setInterval(() => {
    const stats = sessionStore.getStats();
    console.log(`[Master] Stats - Active sessions: ${stats.active}, Total created: ${stats.created}, Expired: ${stats.expired}, Refreshed: ${stats.refreshed}`);
  }, 30000); // Every 30 seconds

} else {
  // ===== WORKER PROCESS =====

  console.log(`[Worker ${cluster.worker.id}] Started with PID ${process.pid}`);

  // Worker session data (for demonstration)
  const workerSessions = new Map();

  // Handle requests from master
  process.on('message', (msg) => {
    if (msg.type !== 'request') return;

    const { requestId, url, method, sessionId, isNew } = msg;

    console.log(`[Worker ${cluster.worker.id}] Handling ${method} ${url} (session: ${sessionId.substring(0, 8)}..., new: ${isNew})`);

    // Simulate some processing
    const startTime = Date.now();

    // Get or create session data
    let sessionData = workerSessions.get(sessionId);
    if (!sessionData) {
      sessionData = {
        sessionId,
        workerId: cluster.worker.id,
        requestCount: 0,
        createdAt: Date.now()
      };
      workerSessions.set(sessionId, sessionData);
    }

    sessionData.requestCount++;
    sessionData.lastAccess = Date.now();

    // Simulate variable processing time
    const processingTime = Math.random() * 100 + 50;

    setTimeout(() => {
      const duration = Date.now() - startTime;

      // Send response back to master
      process.send({
        type: 'response',
        requestId,
        statusCode: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: `Response from worker ${cluster.worker.id}`,
          sessionId: sessionId.substring(0, 8) + '...',
          requestNumber: sessionData.requestCount,
          sessionAge: Date.now() - sessionData.createdAt,
          processingTime: Math.round(processingTime),
          duration,
          timestamp: new Date().toISOString()
        }, null, 2)
      });
    }, processingTime);
  });

  // Send periodic health metrics
  setInterval(() => {
    process.send({
      type: 'health',
      workerId: cluster.worker.id,
      metrics: {
        activeSessions: workerSessions.size,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    });
  }, 5000);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log(`[Worker ${cluster.worker.id}] SIGTERM received, shutting down...`);
    process.exit(0);
  });
}

/**
 * TESTING INSTRUCTIONS:
 * ====================
 *
 * 1. Start the server:
 *    node exercise-1-solution.js
 *
 * 2. Test sticky sessions (same cookie goes to same worker):
 *    curl -c cookies.txt -b cookies.txt http://localhost:8000/
 *    curl -b cookies.txt http://localhost:8000/
 *    curl -b cookies.txt http://localhost:8000/
 *
 * 3. View statistics:
 *    curl http://localhost:8000/stats
 *
 * 4. Test session expiration (wait 30 minutes or modify SESSION_TIMEOUT):
 *    # Set SESSION_TIMEOUT to 5000 (5 seconds) and test
 *
 * 5. Test worker failure and session migration:
 *    # In another terminal, find and kill a worker process:
 *    ps aux | grep node
 *    kill -9 <worker-pid>
 *    # Then make requests with the same cookie - should work!
 *
 * 6. Test IP-based fallback:
 *    curl http://localhost:8000/  # No cookie, uses IP
 *
 * 7. Load test with Apache Bench:
 *    ab -n 10000 -c 100 http://localhost:8000/
 *
 * FEATURES IMPLEMENTED:
 * =====================
 *
 * Core Requirements:
 * ✓ Cookie-based sticky sessions
 * ✓ Shared session store with TTL
 * ✓ Session creation, retrieval, and expiration
 * ✓ Session persistence across worker restarts
 * ✓ Session migration when workers die
 * ✓ Session cleanup mechanism
 *
 * Bonus Features:
 * ✓ IP-based fallback routing (consistent hashing)
 * ✓ Session refresh on activity (sliding expiration)
 * ✓ Session data encryption (AES-256-CBC)
 * ✓ Comprehensive session statistics
 * ✓ Redis-compatible interface
 * ✓ Graceful shutdown
 * ✓ Health check endpoint
 *
 * Production Features:
 * ✓ Secure session ID generation
 * ✓ Request timeout handling
 * ✓ Error handling and recovery
 * ✓ Comprehensive logging
 * ✓ Performance monitoring
 * ✓ Worker health tracking
 */
