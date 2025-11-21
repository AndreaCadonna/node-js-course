/**
 * Simple Logger - A flexible logging utility
 * Features: Multiple log levels, file rotation, timestamps, multiple outputs
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { LOG_LEVELS, RESET_COLOR, ROTATION_DEFAULTS } = require('./log-levels');

class Logger {
  constructor(options = {}) {
    this.options = {
      logDir: options.logDir || './logs',
      logFile: options.logFile || 'app.log',
      level: options.level || 'INFO',
      console: options.console !== false, // default true
      colorize: options.colorize !== false, // default true
      timestamp: options.timestamp !== false, // default true
      maxSize: options.maxSize || ROTATION_DEFAULTS.maxSize,
      maxFiles: options.maxFiles || ROTATION_DEFAULTS.maxFiles,
      rotateDaily: options.rotateDaily || false,
      separateErrorFile: options.separateErrorFile !== false, // default true
      metadata: options.metadata || {} // Additional context to include in logs
    };

    this.currentDate = this.getDateString();
    this.stats = {
      totalLogs: 0,
      logsByLevel: {},
      rotations: 0,
      errors: []
    };

    // Initialize log level counters
    Object.keys(LOG_LEVELS).forEach(level => {
      this.stats.logsByLevel[level] = 0;
    });

    // Ensure log directory exists
    this.initializeLogDirectory();
  }

  /**
   * Initialize log directory
   */
  initializeLogDirectory() {
    try {
      if (!fsSync.existsSync(this.options.logDir)) {
        fsSync.mkdirSync(this.options.logDir, { recursive: true });
      }
    } catch (error) {
      console.error(`Failed to create log directory: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current date as string for daily rotation
   */
  getDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get formatted timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message
   */
  formatMessage(level, message, metadata = {}) {
    const parts = [];

    // Add timestamp
    if (this.options.timestamp) {
      parts.push(`[${this.getTimestamp()}]`);
    }

    // Add log level
    const levelConfig = LOG_LEVELS[level];
    parts.push(levelConfig.label);

    // Add metadata if present
    const combinedMetadata = { ...this.options.metadata, ...metadata };
    if (Object.keys(combinedMetadata).length > 0) {
      const metaStr = Object.entries(combinedMetadata)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');
      parts.push(`[${metaStr}]`);
    }

    // Add message
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * Colorize message for console output
   */
  colorize(level, message) {
    if (!this.options.colorize) {
      return message;
    }

    const levelConfig = LOG_LEVELS[level];
    return `${levelConfig.color}${message}${RESET_COLOR}`;
  }

  /**
   * Get log file path
   */
  getLogFilePath(isErrorLog = false) {
    const baseDir = this.options.logDir;
    let fileName = this.options.logFile;

    // Handle daily rotation
    if (this.options.rotateDaily) {
      const ext = path.extname(fileName);
      const base = path.basename(fileName, ext);
      fileName = `${base}-${this.currentDate}${ext}`;
    }

    // Handle separate error log
    if (isErrorLog && this.options.separateErrorFile) {
      const ext = path.extname(fileName);
      const base = path.basename(fileName, ext);
      fileName = `${base}.error${ext}`;
    }

    return path.join(baseDir, fileName);
  }

  /**
   * Check if log file needs rotation
   */
  async checkRotation(logPath) {
    if (this.options.rotateDaily) {
      const currentDate = this.getDateString();
      if (currentDate !== this.currentDate) {
        this.currentDate = currentDate;
        return true;
      }
    }

    try {
      const stats = await fs.stat(logPath);
      return stats.size >= this.options.maxSize;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false; // File doesn't exist yet
      }
      throw error;
    }
  }

  /**
   * Rotate log file
   */
  async rotateLog(logPath) {
    try {
      // Find existing backup files
      const dir = path.dirname(logPath);
      const baseName = path.basename(logPath);
      const ext = path.extname(baseName);
      const nameWithoutExt = path.basename(baseName, ext);

      // Rotate existing backups
      for (let i = this.options.maxFiles - 1; i >= 1; i--) {
        const oldFile = path.join(dir, `${nameWithoutExt}.${i}${ext}`);
        const newFile = path.join(dir, `${nameWithoutExt}.${i + 1}${ext}`);

        try {
          await fs.access(oldFile);
          if (i + 1 > this.options.maxFiles) {
            // Delete oldest file
            await fs.unlink(oldFile);
          } else {
            // Rename to next number
            await fs.rename(oldFile, newFile);
          }
        } catch (error) {
          // File doesn't exist, skip
        }
      }

      // Rename current log to .1
      const backupFile = path.join(dir, `${nameWithoutExt}.1${ext}`);
      try {
        await fs.access(logPath);
        await fs.rename(logPath, backupFile);
        this.stats.rotations++;
      } catch (error) {
        // Current log doesn't exist, no need to rotate
      }

    } catch (error) {
      this.stats.errors.push({
        timestamp: this.getTimestamp(),
        message: `Log rotation failed: ${error.message}`
      });
    }
  }

  /**
   * Write log to file
   */
  async writeToFile(logPath, message) {
    try {
      // Check if rotation is needed
      if (await this.checkRotation(logPath)) {
        await this.rotateLog(logPath);
      }

      // Append to log file
      await fs.appendFile(logPath, message + '\n', 'utf8');

    } catch (error) {
      this.stats.errors.push({
        timestamp: this.getTimestamp(),
        message: `Failed to write log: ${error.message}`
      });

      // Fallback to console
      console.error(`Logger Error: ${error.message}`);
      console.error(message);
    }
  }

  /**
   * Core logging method
   */
  async log(level, message, metadata = {}) {
    // Check if this level should be logged
    const currentLevel = LOG_LEVELS[this.options.level];
    const messageLevel = LOG_LEVELS[level];

    if (messageLevel.value < currentLevel.value) {
      return; // Skip this log
    }

    // Format message
    const formattedMessage = this.formatMessage(level, message, metadata);

    // Update statistics
    this.stats.totalLogs++;
    this.stats.logsByLevel[level]++;

    // Console output
    if (this.options.console) {
      const coloredMessage = this.colorize(level, formattedMessage);
      if (level === 'ERROR' || level === 'FATAL') {
        console.error(coloredMessage);
      } else {
        console.log(coloredMessage);
      }
    }

    // File output
    const isErrorLog = level === 'ERROR' || level === 'FATAL';
    const logPath = this.getLogFilePath(isErrorLog);
    await this.writeToFile(logPath, formattedMessage);

    // Also write errors to main log
    if (isErrorLog && this.options.separateErrorFile) {
      const mainLogPath = this.getLogFilePath(false);
      await this.writeToFile(mainLogPath, formattedMessage);
    }
  }

  /**
   * Convenience methods for each log level
   */
  async debug(message, metadata) {
    return this.log('DEBUG', message, metadata);
  }

  async info(message, metadata) {
    return this.log('INFO', message, metadata);
  }

  async warn(message, metadata) {
    return this.log('WARN', message, metadata);
  }

  async error(message, metadata) {
    return this.log('ERROR', message, metadata);
  }

  async fatal(message, metadata) {
    return this.log('FATAL', message, metadata);
  }

  /**
   * Get logger statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentLogFile: this.getLogFilePath(),
      currentErrorFile: this.options.separateErrorFile
        ? this.getLogFilePath(true)
        : null
    };
  }

  /**
   * Clear all log files
   */
  async clearLogs() {
    try {
      const files = await fs.readdir(this.options.logDir);

      for (const file of files) {
        const filePath = path.join(this.options.logDir, file);
        await fs.unlink(filePath);
      }

      // Reset statistics
      this.stats.totalLogs = 0;
      this.stats.rotations = 0;
      Object.keys(LOG_LEVELS).forEach(level => {
        this.stats.logsByLevel[level] = 0;
      });

      return files.length;
    } catch (error) {
      throw new Error(`Failed to clear logs: ${error.message}`);
    }
  }

  /**
   * Read log file contents
   */
  async readLogs(options = {}) {
    const {
      lines = null,
      level = null,
      errorLog = false
    } = options;

    const logPath = this.getLogFilePath(errorLog);

    try {
      const content = await fs.readFile(logPath, 'utf8');
      let logLines = content.split('\n').filter(line => line.trim());

      // Filter by level if specified
      if (level) {
        const levelLabel = LOG_LEVELS[level].label;
        logLines = logLines.filter(line => line.includes(levelLabel));
      }

      // Limit number of lines if specified
      if (lines) {
        logLines = logLines.slice(-lines); // Get last N lines
      }

      return logLines;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Create a child logger with additional metadata
   */
  child(metadata) {
    const childOptions = {
      ...this.options,
      metadata: { ...this.options.metadata, ...metadata }
    };

    return new Logger(childOptions);
  }
}

module.exports = Logger;
