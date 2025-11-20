/**
 * System Monitor - Collects system metrics
 *
 * Monitors:
 * - CPU usage (per core and average)
 * - Memory usage (used, free, percentage)
 * - Disk usage (used, free, percentage)
 * - Process information
 * - Network statistics
 */

const os = require('os');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class SystemMonitor extends EventEmitter {
  constructor(options = {}) {
    super();

    this.interval = options.interval || 5000; // Default: 5 seconds
    this.maxHistorySize = options.maxHistorySize || 1000;
    this.historyFile = options.historyFile || path.join(__dirname, '../logs/history.json');

    this.history = [];
    this.isRunning = false;
    this.timer = null;
    this.startTime = Date.now();

    // Previous CPU measurements for calculating usage
    this.previousCPUTimes = null;
  }

  /**
   * Start monitoring
   */
  async start() {
    if (this.isRunning) {
      throw new Error('Monitor is already running');
    }

    console.log('[Monitor] Starting system monitoring...');
    this.isRunning = true;

    // Load history from disk
    await this.loadHistory();

    // Initial collection
    await this.collect();

    // Start periodic collection
    this.timer = setInterval(() => {
      this.collect().catch(err => {
        console.error('[Monitor] Collection error:', err);
        this.emit('error', err);
      });
    }, this.interval);

    this.emit('started');
  }

  /**
   * Stop monitoring
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('[Monitor] Stopping system monitoring...');
    this.isRunning = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Save history to disk
    await this.saveHistory();

    this.emit('stopped');
  }

  /**
   * Collect system metrics
   */
  async collect() {
    const metrics = {
      timestamp: Date.now(),
      uptime: process.uptime(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime()
      },
      cpu: this.getCPUMetrics(),
      memory: this.getMemoryMetrics(),
      process: this.getProcessMetrics()
    };

    // Try to get disk metrics (may fail on some systems)
    try {
      metrics.disk = await this.getDiskMetrics();
    } catch (err) {
      metrics.disk = { error: err.message };
    }

    // Add to history
    this.addToHistory(metrics);

    // Emit metrics event
    this.emit('metrics', metrics);

    return metrics;
  }

  /**
   * Get CPU metrics
   */
  getCPUMetrics() {
    const cpus = os.cpus();
    const currentCPUTimes = cpus.map(cpu => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      return {
        idle: cpu.times.idle,
        total: total
      };
    });

    let cpuUsage = 0;
    const perCore = [];

    // Calculate CPU usage if we have previous measurements
    if (this.previousCPUTimes) {
      let totalIdle = 0;
      let totalTick = 0;

      for (let i = 0; i < currentCPUTimes.length; i++) {
        const current = currentCPUTimes[i];
        const previous = this.previousCPUTimes[i];

        const idleDiff = current.idle - previous.idle;
        const totalDiff = current.total - previous.total;

        const usage = totalDiff > 0 ? 100 - (100 * idleDiff / totalDiff) : 0;
        perCore.push(parseFloat(usage.toFixed(2)));

        totalIdle += idleDiff;
        totalTick += totalDiff;
      }

      cpuUsage = totalTick > 0 ? 100 - (100 * totalIdle / totalTick) : 0;
    }

    this.previousCPUTimes = currentCPUTimes;

    return {
      count: cpus.length,
      model: cpus[0].model,
      speed: cpus[0].speed,
      usage: parseFloat(cpuUsage.toFixed(2)),
      perCore: perCore,
      loadAverage: os.loadavg()
    };
  }

  /**
   * Get memory metrics
   */
  getMemoryMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usedPercentage: parseFloat(((usedMem / totalMem) * 100).toFixed(2)),
      freePercentage: parseFloat(((freeMem / totalMem) * 100).toFixed(2))
    };
  }

  /**
   * Get process metrics
   */
  getProcessMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      pid: process.pid,
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime()
    };
  }

  /**
   * Get disk metrics (basic estimation)
   */
  async getDiskMetrics() {
    // Note: Node.js core doesn't provide native disk usage APIs
    // This is a basic implementation that works on Unix-like systems

    if (os.platform() === 'win32') {
      return { available: false, reason: 'Not supported on Windows' };
    }

    try {
      const homedir = os.homedir();
      const stats = await fs.stat(homedir);

      return {
        available: true,
        path: homedir,
        // Note: Cannot get actual disk usage without child_process or native bindings
        note: 'Full disk metrics require child_process or native modules'
      };
    } catch (err) {
      return { available: false, error: err.message };
    }
  }

  /**
   * Add metrics to history
   */
  addToHistory(metrics) {
    this.history.push(metrics);

    // Trim history if too large
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics() {
    return this.history[this.history.length - 1] || null;
  }

  /**
   * Get metrics history
   */
  getHistory(limit = 100) {
    return this.history.slice(-limit);
  }

  /**
   * Get statistics from history
   */
  getStatistics() {
    if (this.history.length === 0) {
      return null;
    }

    const cpuUsages = this.history.map(m => m.cpu.usage).filter(u => u > 0);
    const memUsages = this.history.map(m => m.memory.usedPercentage);

    return {
      cpu: {
        average: this.calculateAverage(cpuUsages),
        min: Math.min(...cpuUsages),
        max: Math.max(...cpuUsages),
        current: cpuUsages[cpuUsages.length - 1] || 0
      },
      memory: {
        average: this.calculateAverage(memUsages),
        min: Math.min(...memUsages),
        max: Math.max(...memUsages),
        current: memUsages[memUsages.length - 1] || 0
      },
      dataPoints: this.history.length,
      period: {
        start: this.history[0].timestamp,
        end: this.history[this.history.length - 1].timestamp,
        duration: this.history[this.history.length - 1].timestamp - this.history[0].timestamp
      }
    };
  }

  /**
   * Calculate average
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return parseFloat((sum / values.length).toFixed(2));
  }

  /**
   * Save history to disk
   */
  async saveHistory() {
    try {
      const dir = path.dirname(this.historyFile);
      await fs.mkdir(dir, { recursive: true });

      const data = JSON.stringify({
        savedAt: Date.now(),
        history: this.history.slice(-100) // Save last 100 entries
      }, null, 2);

      await fs.writeFile(this.historyFile, data);
      console.log('[Monitor] History saved to', this.historyFile);
    } catch (err) {
      console.error('[Monitor] Failed to save history:', err);
    }
  }

  /**
   * Load history from disk
   */
  async loadHistory() {
    try {
      const data = await fs.readFile(this.historyFile, 'utf8');
      const parsed = JSON.parse(data);

      if (parsed.history && Array.isArray(parsed.history)) {
        this.history = parsed.history;
        console.log(`[Monitor] Loaded ${this.history.length} historical entries`);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('[Monitor] Failed to load history:', err);
      }
    }
  }
}

module.exports = SystemMonitor;
