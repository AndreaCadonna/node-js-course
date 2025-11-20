const EventEmitter = require('events');
const fs = require('fs');
const { pipeline } = require('stream');
const LogParser = require('./parser');

/**
 * Log Analyzer - Real-time log file analysis
 * Provides statistics, pattern matching, and alerting
 */
class LogAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      alertPatterns: options.alertPatterns || [],
      trackMetrics: options.trackMetrics !== false,
      ...options
    };

    this.stats = {
      totalLines: 0,
      errorCount: 0,
      warnCount: 0,
      statusCodes: {},
      methods: {},
      paths: {},
      ips: {},
      levels: {},
      errors: [],
      recentLogs: [],
      startTime: Date.now()
    };

    this.maxRecentLogs = options.maxRecentLogs || 100;
    this.maxErrors = options.maxErrors || 50;
  }

  /**
   * Analyze a log file
   */
  analyzeFile(filePath) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`File not found: ${filePath}`));
      }

      const readStream = fs.createReadStream(filePath, {
        encoding: 'utf8',
        highWaterMark: 64 * 1024 // 64KB chunks
      });

      const parser = new LogParser();

      parser.on('data', (logEntry) => {
        this.processLogEntry(logEntry);
      });

      pipeline(
        readStream,
        parser,
        (err) => {
          if (err) {
            this.emit('error', err);
            reject(err);
          } else {
            this.emit('complete', this.getStats());
            resolve(this.getStats());
          }
        }
      );
    });
  }

  /**
   * Analyze a log stream (for real-time monitoring)
   */
  analyzeStream(stream) {
    const parser = new LogParser();

    parser.on('data', (logEntry) => {
      this.processLogEntry(logEntry);
    });

    return pipeline(
      stream,
      parser,
      (err) => {
        if (err) {
          this.emit('error', err);
        }
      }
    );
  }

  /**
   * Process a single log entry
   */
  processLogEntry(entry) {
    this.stats.totalLines++;

    // Track by level
    if (entry.level) {
      this.stats.levels[entry.level] = (this.stats.levels[entry.level] || 0) + 1;

      if (entry.level === 'ERROR') {
        this.stats.errorCount++;
        this.addError(entry);
      } else if (entry.level === 'WARN') {
        this.stats.warnCount++;
      }
    }

    // Track HTTP metrics
    if (entry.status) {
      const statusKey = Math.floor(entry.status / 100) + 'xx';
      this.stats.statusCodes[statusKey] = (this.stats.statusCodes[statusKey] || 0) + 1;

      if (entry.status >= 400) {
        this.stats.errorCount++;
        this.addError(entry);
      }
    }

    if (entry.method) {
      this.stats.methods[entry.method] = (this.stats.methods[entry.method] || 0) + 1;
    }

    if (entry.path) {
      this.stats.paths[entry.path] = (this.stats.paths[entry.path] || 0) + 1;
    }

    if (entry.ip) {
      this.stats.ips[entry.ip] = (this.stats.ips[entry.ip] || 0) + 1;
    }

    // Check alert patterns
    this.checkAlertPatterns(entry);

    // Add to recent logs
    this.addRecentLog(entry);

    // Emit event for real-time updates
    this.emit('entry', entry);

    // Emit periodic stats updates
    if (this.stats.totalLines % 1000 === 0) {
      this.emit('stats', this.getStats());
    }
  }

  /**
   * Check if entry matches any alert patterns
   */
  checkAlertPatterns(entry) {
    for (const pattern of this.options.alertPatterns) {
      let matches = false;

      if (pattern.level && entry.level === pattern.level) {
        matches = true;
      }

      if (pattern.status && entry.status === pattern.status) {
        matches = true;
      }

      if (pattern.regex) {
        const regex = new RegExp(pattern.regex, 'i');
        if (regex.test(entry.message || entry.raw)) {
          matches = true;
        }
      }

      if (pattern.statusRange) {
        const [min, max] = pattern.statusRange;
        if (entry.status >= min && entry.status <= max) {
          matches = true;
        }
      }

      if (matches) {
        this.emit('alert', {
          pattern: pattern.name || 'Unnamed Alert',
          entry,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Add error to error list
   */
  addError(entry) {
    this.stats.errors.unshift({
      timestamp: entry.timestamp,
      message: entry.message || `${entry.method} ${entry.path} - ${entry.status}`,
      entry
    });

    // Limit error list size
    if (this.stats.errors.length > this.maxErrors) {
      this.stats.errors = this.stats.errors.slice(0, this.maxErrors);
    }
  }

  /**
   * Add log to recent logs list
   */
  addRecentLog(entry) {
    this.stats.recentLogs.unshift(entry);

    if (this.stats.recentLogs.length > this.maxRecentLogs) {
      this.stats.recentLogs = this.stats.recentLogs.slice(0, this.maxRecentLogs);
    }
  }

  /**
   * Get current statistics
   */
  getStats() {
    const duration = (Date.now() - this.stats.startTime) / 1000;

    return {
      ...this.stats,
      duration,
      linesPerSecond: (this.stats.totalLines / duration).toFixed(2),
      errorRate: ((this.stats.errorCount / this.stats.totalLines) * 100).toFixed(2) + '%',
      topPaths: this.getTopItems(this.stats.paths, 10),
      topIps: this.getTopItems(this.stats.ips, 10),
      topMethods: this.getTopItems(this.stats.methods)
    };
  }

  /**
   * Get top N items from object
   */
  getTopItems(obj, limit = 5) {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, value]) => ({ key, value }));
  }

  /**
   * Reset statistics
   */
  reset() {
    this.stats = {
      totalLines: 0,
      errorCount: 0,
      warnCount: 0,
      statusCodes: {},
      methods: {},
      paths: {},
      ips: {},
      levels: {},
      errors: [],
      recentLogs: [],
      startTime: Date.now()
    };
    this.emit('reset');
  }
}

module.exports = LogAnalyzer;
