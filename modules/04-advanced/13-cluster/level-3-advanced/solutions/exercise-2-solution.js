/**
 * Exercise 2: Custom Load Balancer with Multiple Strategies - SOLUTION
 *
 * A production-ready load balancer supporting multiple routing strategies:
 * - Least Connections
 * - Weighted Round Robin
 * - Response Time-based
 * - Consistent Hashing (bonus)
 * - Connection draining (bonus)
 * - Dynamic strategy switching
 * - Health monitoring
 */

const cluster = require('cluster');
const http = require('http');
const crypto = require('crypto');
const os = require('os');
const { URL } = require('url');

const PORT = 8000;
const numCPUs = Math.min(4, os.cpus().length);
const HEALTH_CHECK_INTERVAL = 5000;
const METRICS_WINDOW = 60000; // 1 minute rolling window

// ===== LOAD BALANCING STRATEGIES =====

/**
 * Base class for load balancing strategies
 */
class LoadBalancingStrategy {
  constructor(name) {
    this.name = name;
  }

  selectWorker(workers, workerStats) {
    throw new Error('selectWorker must be implemented by subclass');
  }
}

/**
 * Least Connections Strategy - Route to worker with fewest active connections
 */
class LeastConnectionsStrategy extends LoadBalancingStrategy {
  constructor() {
    super('least-connections');
  }

  selectWorker(workers, workerStats) {
    let minConnections = Infinity;
    let selectedWorker = null;

    for (const [workerId, worker] of workers) {
      const stats = workerStats.get(workerId);

      // Skip unhealthy workers
      if (!stats || !stats.healthy) continue;

      if (stats.activeConnections < minConnections) {
        minConnections = stats.activeConnections;
        selectedWorker = workerId;
      }
    }

    return selectedWorker;
  }
}

/**
 * Weighted Round Robin Strategy - Distribute based on worker weights
 */
class WeightedRoundRobinStrategy extends LoadBalancingStrategy {
  constructor(weights = {}) {
    super('weighted-round-robin');
    this.weights = weights; // workerId -> weight
    this.currentIndex = 0;
    this.currentWeight = 0;
    this.maxWeight = 0;
    this.gcd = 1;
  }

  /**
   * Calculate GCD (Greatest Common Divisor) for weights
   */
  _gcd(a, b) {
    return b === 0 ? a : this._gcd(b, a % b);
  }

  /**
   * Calculate GCD of all weights
   */
  _gcdOfWeights(weights) {
    let result = weights[0];
    for (let i = 1; i < weights.length; i++) {
      result = this._gcd(result, weights[i]);
    }
    return result;
  }

  /**
   * Update weights configuration
   */
  updateWeights(weights) {
    this.weights = weights;
    const weightValues = Object.values(weights);
    this.maxWeight = Math.max(...weightValues);
    this.gcd = this._gcdOfWeights(weightValues);
  }

  selectWorker(workers, workerStats) {
    const workerIds = Array.from(workers.keys()).filter(id => {
      const stats = workerStats.get(id);
      return stats && stats.healthy;
    });

    if (workerIds.length === 0) return null;

    // Ensure all workers have weights
    workerIds.forEach(id => {
      if (!this.weights[id]) {
        this.weights[id] = 1; // Default weight
      }
    });

    // Weighted round robin algorithm (smooth weighted round robin)
    while (true) {
      this.currentIndex = (this.currentIndex + 1) % workerIds.length;

      if (this.currentIndex === 0) {
        this.currentWeight = this.currentWeight - this.gcd;
        if (this.currentWeight <= 0) {
          this.currentWeight = this.maxWeight;
        }
      }

      const workerId = workerIds[this.currentIndex];
      const weight = this.weights[workerId] || 1;

      if (weight >= this.currentWeight) {
        return workerId;
      }
    }
  }
}

/**
 * Response Time Strategy - Route to fastest responding worker
 */
class ResponseTimeStrategy extends LoadBalancingStrategy {
  constructor() {
    super('response-time');
  }

  selectWorker(workers, workerStats) {
    let bestScore = Infinity;
    let selectedWorker = null;

    for (const [workerId, worker] of workers) {
      const stats = workerStats.get(workerId);

      // Skip unhealthy workers
      if (!stats || !stats.healthy) continue;

      // Calculate score based on avg response time and current load
      const avgResponseTime = stats.avgResponseTime || 0;
      const loadFactor = stats.activeConnections / 10; // Normalize
      const score = avgResponseTime * (1 + loadFactor);

      if (score < bestScore) {
        bestScore = score;
        selectedWorker = workerId;
      }
    }

    return selectedWorker;
  }
}

/**
 * Consistent Hashing Strategy - Route based on request hash (bonus)
 * Good for cache affinity
 */
class ConsistentHashingStrategy extends LoadBalancingStrategy {
  constructor() {
    super('consistent-hashing');
    this.ring = new Map(); // hash -> workerId
    this.virtualNodes = 150; // Virtual nodes per worker
  }

  /**
   * Add worker to hash ring
   */
  addWorker(workerId) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this._hash(`${workerId}-${i}`);
      this.ring.set(hash, workerId);
    }
  }

  /**
   * Remove worker from hash ring
   */
  removeWorker(workerId) {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this._hash(`${workerId}-${i}`);
      this.ring.delete(hash);
    }
  }

  /**
   * Hash function
   */
  _hash(key) {
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Find closest worker in hash ring
   */
  selectWorker(workers, workerStats, requestKey = '') {
    if (this.ring.size === 0) {
      // Initialize ring
      for (const workerId of workers.keys()) {
        this.addWorker(workerId);
      }
    }

    const requestHash = this._hash(requestKey);
    const sortedHashes = Array.from(this.ring.keys()).sort();

    // Find the first hash >= requestHash
    for (const hash of sortedHashes) {
      if (hash >= requestHash) {
        const workerId = this.ring.get(hash);
        const stats = workerStats.get(workerId);
        if (stats && stats.healthy) {
          return workerId;
        }
      }
    }

    // Wrap around to first node
    const firstHash = sortedHashes[0];
    return this.ring.get(firstHash);
  }
}

// ===== WORKER HEALTH MONITOR =====

/**
 * Monitor worker health based on multiple metrics
 */
class WorkerHealthMonitor {
  constructor() {
    this.healthScores = new Map(); // workerId -> score (0-100)
    this.healthHistory = new Map(); // workerId -> array of recent scores
    this.historySize = 10;
  }

  /**
   * Update worker health based on metrics
   */
  updateHealth(workerId, metrics) {
    const {
      errorRate = 0,
      avgResponseTime = 0,
      activeConnections = 0,
      cpuUsage = 0,
      memoryUsage = 0
    } = metrics;

    // Calculate health score (0-100)
    let score = 100;

    // Penalize high error rates
    score -= errorRate * 50; // 10% error = -5 points

    // Penalize slow response times
    if (avgResponseTime > 1000) score -= 20;
    else if (avgResponseTime > 500) score -= 10;
    else if (avgResponseTime > 200) score -= 5;

    // Penalize high CPU usage
    if (cpuUsage > 90) score -= 20;
    else if (cpuUsage > 75) score -= 10;

    // Penalize high memory usage
    if (memoryUsage > 90) score -= 20;
    else if (memoryUsage > 75) score -= 10;

    // Ensure score is in valid range
    score = Math.max(0, Math.min(100, score));

    this.healthScores.set(workerId, score);

    // Update history
    if (!this.healthHistory.has(workerId)) {
      this.healthHistory.set(workerId, []);
    }
    const history = this.healthHistory.get(workerId);
    history.push(score);
    if (history.length > this.historySize) {
      history.shift();
    }
  }

  /**
   * Check if worker is healthy (score >= 50)
   */
  isHealthy(workerId) {
    const score = this.getHealthScore(workerId);
    return score >= 50;
  }

  /**
   * Get current health score
   */
  getHealthScore(workerId) {
    return this.healthScores.get(workerId) || 100;
  }

  /**
   * Get health trend (improving, stable, degrading)
   */
  getHealthTrend(workerId) {
    const history = this.healthHistory.get(workerId);
    if (!history || history.length < 3) return 'stable';

    const recent = history.slice(-3);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const oldest = recent[0];
    const newest = recent[recent.length - 1];

    if (newest > oldest + 10) return 'improving';
    if (newest < oldest - 10) return 'degrading';
    return 'stable';
  }
}

// ===== LOAD BALANCER =====

/**
 * Main load balancer with multiple strategies
 */
class LoadBalancer {
  constructor() {
    this.strategies = new Map();
    this.currentStrategy = null;
    this.workers = new Map();
    this.workerStats = new Map();
    this.healthMonitor = new WorkerHealthMonitor();
    this.drainingWorkers = new Set(); // Workers being drained

    // Initialize strategies
    this.strategies.set('least-connections', new LeastConnectionsStrategy());
    this.strategies.set('weighted-round-robin', new WeightedRoundRobinStrategy());
    this.strategies.set('response-time', new ResponseTimeStrategy());
    this.strategies.set('consistent-hashing', new ConsistentHashingStrategy());
  }

  /**
   * Set active strategy
   */
  setStrategy(strategyName) {
    if (!this.strategies.has(strategyName)) {
      throw new Error(`Unknown strategy: ${strategyName}`);
    }
    this.currentStrategy = this.strategies.get(strategyName);
    console.log(`[LoadBalancer] Switched to strategy: ${strategyName}`);
  }

  /**
   * Add worker to pool
   */
  addWorker(workerId, worker) {
    this.workers.set(workerId, worker);
    this.workerStats.set(workerId, {
      activeConnections: 0,
      totalRequests: 0,
      totalErrors: 0,
      responseTimes: [],
      avgResponseTime: 0,
      errorRate: 0,
      healthy: true,
      cpuUsage: 0,
      memoryUsage: 0,
      lastSeen: Date.now()
    });

    // Add to consistent hashing ring if using that strategy
    const chStrategy = this.strategies.get('consistent-hashing');
    if (chStrategy) {
      chStrategy.addWorker(workerId);
    }
  }

  /**
   * Remove worker from pool
   */
  removeWorker(workerId) {
    this.workers.delete(workerId);
    this.workerStats.delete(workerId);
    this.healthMonitor.healthScores.delete(workerId);
    this.healthMonitor.healthHistory.delete(workerId);
    this.drainingWorkers.delete(workerId);

    // Remove from consistent hashing ring
    const chStrategy = this.strategies.get('consistent-hashing');
    if (chStrategy) {
      chStrategy.removeWorker(workerId);
    }
  }

  /**
   * Start draining connections from a worker (graceful removal)
   */
  drainWorker(workerId) {
    console.log(`[LoadBalancer] Draining worker ${workerId}...`);
    this.drainingWorkers.add(workerId);

    // Check periodically if worker can be removed
    const checkInterval = setInterval(() => {
      const stats = this.workerStats.get(workerId);
      if (!stats || stats.activeConnections === 0) {
        clearInterval(checkInterval);
        this.removeWorker(workerId);
        console.log(`[LoadBalancer] Worker ${workerId} drained and removed`);
      }
    }, 1000);
  }

  /**
   * Select worker for request
   */
  selectWorker(requestKey = '') {
    // Filter out draining workers
    const availableWorkers = new Map();
    for (const [id, worker] of this.workers) {
      if (!this.drainingWorkers.has(id)) {
        availableWorkers.set(id, worker);
      }
    }

    if (availableWorkers.size === 0) {
      return null;
    }

    // Use current strategy
    if (this.currentStrategy.name === 'consistent-hashing') {
      return this.currentStrategy.selectWorker(availableWorkers, this.workerStats, requestKey);
    }

    return this.currentStrategy.selectWorker(availableWorkers, this.workerStats);
  }

  /**
   * Record request start
   */
  recordRequestStart(workerId) {
    const stats = this.workerStats.get(workerId);
    if (stats) {
      stats.activeConnections++;
      stats.totalRequests++;
    }
  }

  /**
   * Record request completion
   */
  recordRequestEnd(workerId, duration, success = true) {
    const stats = this.workerStats.get(workerId);
    if (!stats) return;

    stats.activeConnections--;
    stats.responseTimes.push(duration);

    // Keep only recent response times (last 100)
    if (stats.responseTimes.length > 100) {
      stats.responseTimes.shift();
    }

    // Calculate average response time
    stats.avgResponseTime = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length;

    // Update error rate
    if (!success) {
      stats.totalErrors++;
    }
    stats.errorRate = stats.totalErrors / stats.totalRequests;

    // Update health
    this.healthMonitor.updateHealth(workerId, {
      errorRate: stats.errorRate,
      avgResponseTime: stats.avgResponseTime,
      activeConnections: stats.activeConnections,
      cpuUsage: stats.cpuUsage,
      memoryUsage: stats.memoryUsage
    });

    stats.healthy = this.healthMonitor.isHealthy(workerId);
  }

  /**
   * Update worker system metrics
   */
  updateWorkerMetrics(workerId, metrics) {
    const stats = this.workerStats.get(workerId);
    if (stats) {
      stats.cpuUsage = metrics.cpuUsage || 0;
      stats.memoryUsage = metrics.memoryUsage || 0;
      stats.lastSeen = Date.now();
    }
  }

  /**
   * Get load balancer statistics
   */
  getStats() {
    const workerStatsList = [];
    for (const [id, stats] of this.workerStats) {
      workerStatsList.push({
        workerId: id,
        ...stats,
        healthScore: this.healthMonitor.getHealthScore(id),
        healthTrend: this.healthMonitor.getHealthTrend(id),
        draining: this.drainingWorkers.has(id)
      });
    }

    return {
      strategy: this.currentStrategy.name,
      workers: workerStatsList,
      totalWorkers: this.workers.size,
      healthyWorkers: workerStatsList.filter(w => w.healthy).length,
      drainingWorkers: this.drainingWorkers.size
    };
  }
}

// ===== MASTER PROCESS =====

if (cluster.isMaster) {
  console.log(`[Master] Starting load balancer with PID ${process.pid}`);
  console.log(`[Master] Forking ${numCPUs} workers...`);

  const loadBalancer = new LoadBalancer();
  loadBalancer.setStrategy('least-connections'); // Default strategy

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    loadBalancer.addWorker(worker.id, worker);
    console.log(`[Master] Worker ${worker.id} started with PID ${worker.process.pid}`);

    // Listen for worker metrics
    worker.on('message', (msg) => {
      if (msg.type === 'metrics') {
        loadBalancer.updateWorkerMetrics(worker.id, msg.data);
      }
    });
  }

  /**
   * Forward request to selected worker
   */
  function forwardRequest(req, res) {
    // Select worker based on current strategy
    const requestKey = req.url; // For consistent hashing
    const workerId = loadBalancer.selectWorker(requestKey);

    if (!workerId) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Service Unavailable: No healthy workers');
      return;
    }

    const worker = loadBalancer.workers.get(workerId);
    const requestId = crypto.randomBytes(16).toString('hex');
    const startTime = Date.now();

    loadBalancer.recordRequestStart(workerId);

    // Listen for response
    const responseHandler = (msg) => {
      if (msg.type === 'response' && msg.requestId === requestId) {
        worker.removeListener('message', responseHandler);

        const duration = Date.now() - startTime;
        loadBalancer.recordRequestEnd(workerId, duration, msg.success);

        res.writeHead(msg.statusCode || 200, {
          'Content-Type': msg.contentType || 'text/plain',
          'X-Worker-ID': workerId,
          'X-LB-Strategy': loadBalancer.currentStrategy.name,
          'X-Response-Time': duration
        });
        res.end(msg.body);
      }
    };

    worker.on('message', responseHandler);

    // Send request to worker
    worker.send({
      type: 'request',
      requestId,
      url: req.url,
      method: req.method,
      headers: req.headers
    });

    // Timeout handling
    setTimeout(() => {
      worker.removeListener('message', responseHandler);
      if (!res.headersSent) {
        const duration = Date.now() - startTime;
        loadBalancer.recordRequestEnd(workerId, duration, false);

        res.writeHead(504, { 'Content-Type': 'text/plain' });
        res.end('Gateway Timeout');
      }
    }, 30000);
  }

  /**
   * Create master HTTP server
   */
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // Load balancer status endpoint
    if (url.pathname === '/lb/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadBalancer.getStats(), null, 2));
      return;
    }

    // Change strategy endpoint
    if (url.pathname === '/lb/strategy' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const { strategy } = JSON.parse(body);
          loadBalancer.setStrategy(strategy);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, strategy }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }

    // Worker details endpoint
    if (url.pathname === '/lb/workers') {
      const stats = loadBalancer.getStats();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats.workers, null, 2));
      return;
    }

    // Metrics endpoint
    if (url.pathname === '/lb/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadBalancer.getStats(), null, 2));
      return;
    }

    // Dashboard endpoint (HTML)
    if (url.pathname === '/lb/dashboard') {
      const stats = loadBalancer.getStats();
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Load Balancer Dashboard</title>
  <meta http-equiv="refresh" content="2">
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    .container { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .worker { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px; }
    .worker.healthy { border-left: 4px solid #4CAF50; }
    .worker.unhealthy { border-left: 4px solid #f44336; }
    .metric { display: inline-block; margin-right: 20px; }
    .metric label { font-weight: bold; color: #666; }
    .metric value { color: #333; }
    .strategy-selector { margin: 20px 0; }
    button { padding: 10px 20px; margin: 5px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Load Balancer Dashboard</h1>

  <div class="container">
    <h2>Current Strategy: ${stats.strategy}</h2>
    <div class="strategy-selector">
      <button onclick="changeStrategy('least-connections')">Least Connections</button>
      <button onclick="changeStrategy('weighted-round-robin')">Weighted Round Robin</button>
      <button onclick="changeStrategy('response-time')">Response Time</button>
      <button onclick="changeStrategy('consistent-hashing')">Consistent Hashing</button>
    </div>
  </div>

  <div class="container">
    <h2>Cluster Overview</h2>
    <div class="metric">
      <label>Total Workers:</label>
      <value>${stats.totalWorkers}</value>
    </div>
    <div class="metric">
      <label>Healthy Workers:</label>
      <value>${stats.healthyWorkers}</value>
    </div>
    <div class="metric">
      <label>Draining Workers:</label>
      <value>${stats.drainingWorkers}</value>
    </div>
  </div>

  <div class="container">
    <h2>Workers</h2>
    ${stats.workers.map(w => `
      <div class="worker ${w.healthy ? 'healthy' : 'unhealthy'}">
        <h3>Worker ${w.workerId} ${w.draining ? '(DRAINING)' : ''}</h3>
        <div class="metric">
          <label>Health Score:</label>
          <value>${w.healthScore.toFixed(1)}</value>
        </div>
        <div class="metric">
          <label>Trend:</label>
          <value>${w.healthTrend}</value>
        </div>
        <div class="metric">
          <label>Active Connections:</label>
          <value>${w.activeConnections}</value>
        </div>
        <div class="metric">
          <label>Total Requests:</label>
          <value>${w.totalRequests}</value>
        </div>
        <div class="metric">
          <label>Avg Response Time:</label>
          <value>${w.avgResponseTime.toFixed(2)}ms</value>
        </div>
        <div class="metric">
          <label>Error Rate:</label>
          <value>${(w.errorRate * 100).toFixed(2)}%</value>
        </div>
      </div>
    `).join('')}
  </div>

  <script>
    function changeStrategy(strategy) {
      fetch('/lb/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy })
      })
      .then(res => res.json())
      .then(data => {
        alert('Strategy changed to: ' + data.strategy);
        location.reload();
      })
      .catch(err => alert('Error: ' + err));
    }
  </script>
</body>
</html>
      `;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }

    // Forward regular requests
    forwardRequest(req, res);
  });

  server.listen(PORT, () => {
    console.log(`[Master] Load balancer listening on port ${PORT}`);
    console.log(`[Master] Dashboard: http://localhost:${PORT}/lb/dashboard`);
  });

  // Handle worker crashes
  cluster.on('exit', (worker, code, signal) => {
    console.log(`[Master] Worker ${worker.id} died (${signal || code}). Restarting...`);

    loadBalancer.removeWorker(worker.id);

    const newWorker = cluster.fork();
    loadBalancer.addWorker(newWorker.id, newWorker);

    newWorker.on('message', (msg) => {
      if (msg.type === 'metrics') {
        loadBalancer.updateWorkerMetrics(newWorker.id, msg.data);
      }
    });

    console.log(`[Master] New worker ${newWorker.id} started with PID ${newWorker.process.pid}`);
  });

  // Periodic health checks
  setInterval(() => {
    const stats = loadBalancer.getStats();
    console.log(`[Master] Strategy: ${stats.strategy}, Healthy: ${stats.healthyWorkers}/${stats.totalWorkers}`);
  }, HEALTH_CHECK_INTERVAL);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Master] SIGTERM received, shutting down...');
    server.close(() => {
      for (const worker of loadBalancer.workers.values()) {
        worker.disconnect();
      }
      process.exit(0);
    });
  });

} else {
  // ===== WORKER PROCESS =====

  console.log(`[Worker ${cluster.worker.id}] Started with PID ${process.pid}`);

  // Handle requests from master
  process.on('message', (msg) => {
    if (msg.type !== 'request') return;

    const { requestId, url, method } = msg;
    const startTime = Date.now();

    // Simulate variable workload
    const processingTime = Math.random() * 200 + 50;

    setTimeout(() => {
      const duration = Date.now() - startTime;

      process.send({
        type: 'response',
        requestId,
        statusCode: 200,
        contentType: 'application/json',
        success: true,
        body: JSON.stringify({
          worker: cluster.worker.id,
          url,
          processingTime: Math.round(processingTime),
          totalTime: duration,
          timestamp: new Date().toISOString()
        }, null, 2)
      });
    }, processingTime);
  });

  // Send periodic metrics
  setInterval(() => {
    const usage = process.cpuUsage();
    const memory = process.memoryUsage();

    process.send({
      type: 'metrics',
      data: {
        cpuUsage: (usage.user + usage.system) / 1000000, // Convert to ms
        memoryUsage: (memory.heapUsed / memory.heapTotal) * 100
      }
    });
  }, 5000);

  process.on('SIGTERM', () => {
    console.log(`[Worker ${cluster.worker.id}] SIGTERM received`);
    process.exit(0);
  });
}

/**
 * TESTING INSTRUCTIONS:
 * ====================
 *
 * 1. Start the server:
 *    node exercise-2-solution.js
 *
 * 2. View dashboard:
 *    Open http://localhost:8000/lb/dashboard in browser
 *
 * 3. Test different strategies:
 *    curl -X POST http://localhost:8000/lb/strategy -H "Content-Type: application/json" -d '{"strategy":"least-connections"}'
 *    curl -X POST http://localhost:8000/lb/strategy -H "Content-Type: application/json" -d '{"strategy":"weighted-round-robin"}'
 *    curl -X POST http://localhost:8000/lb/strategy -H "Content-Type: application/json" -d '{"strategy":"response-time"}'
 *
 * 4. Generate load:
 *    for i in {1..100}; do curl http://localhost:8000/; done
 *
 * 5. Check metrics:
 *    curl http://localhost:8000/lb/metrics
 *
 * FEATURES IMPLEMENTED:
 * =====================
 *
 * Core Requirements:
 * ✓ Least Connections strategy
 * ✓ Weighted Round Robin strategy
 * ✓ Response Time-based strategy
 * ✓ Dynamic strategy switching
 * ✓ Worker health monitoring
 * ✓ Real-time metrics collection
 * ✓ Load balancer dashboard
 *
 * Bonus Features:
 * ✓ Consistent Hashing strategy
 * ✓ Connection draining
 * ✓ Health scoring and trends
 * ✓ Multiple health factors (CPU, memory, response time, errors)
 * ✓ Auto-recovery from worker failures
 * ✓ Interactive HTML dashboard
 */
