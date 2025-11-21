const { Transform } = require('stream');

/**
 * Log Parser - Parses log entries from stream
 * Supports multiple log formats and custom patterns
 */
class LogParser extends Transform {
  constructor(options = {}) {
    super({ objectMode: true });
    this.patterns = options.patterns || this.getDefaultPatterns();
    this.buffer = '';
  }

  /**
   * Default log format patterns
   */
  getDefaultPatterns() {
    return {
      // Apache/Nginx combined log format
      combined: /^(\S+) (\S+) (\S+) \[([\w:/]+\s[+\-]\d{4})\] "(\S+)\s?(\S+)?\s?(\S+)?" (\d{3}|-) (\d+|-)\s?"?([^"]*)"?\s?"?([^"]*)?"?/,

      // Common application log format
      application: /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:?\d{2})?)\s+\[?(\w+)\]?\s+(.+)/,

      // JSON logs
      json: /^\{.+\}$/,

      // Simple timestamp and message
      simple: /^(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\s+(.+)/
    };
  }

  /**
   * Parse a log line into structured data
   */
  parseLine(line) {
    line = line.trim();
    if (!line) return null;

    // Try JSON format first
    if (this.patterns.json.test(line)) {
      try {
        return JSON.parse(line);
      } catch (e) {
        // Fall through to other patterns
      }
    }

    // Try application log format
    let match = line.match(this.patterns.application);
    if (match) {
      return {
        timestamp: new Date(match[1]),
        level: match[2].toUpperCase(),
        message: match[3],
        raw: line
      };
    }

    // Try combined log format (Apache/Nginx)
    match = line.match(this.patterns.combined);
    if (match) {
      return {
        timestamp: new Date(match[4]),
        ip: match[1],
        method: match[5],
        path: match[6],
        protocol: match[7],
        status: parseInt(match[8]) || 0,
        size: parseInt(match[9]) || 0,
        referrer: match[10],
        userAgent: match[11],
        raw: line
      };
    }

    // Try simple format
    match = line.match(this.patterns.simple);
    if (match) {
      return {
        timestamp: new Date(match[1]),
        message: match[2],
        raw: line
      };
    }

    // Unparseable - return as-is
    return {
      timestamp: new Date(),
      message: line,
      raw: line,
      unparsed: true
    };
  }

  _transform(chunk, encoding, callback) {
    // Add chunk to buffer
    this.buffer += chunk.toString();

    // Split by newlines
    const lines = this.buffer.split('\n');

    // Keep last incomplete line in buffer
    this.buffer = lines.pop();

    // Parse and push complete lines
    for (const line of lines) {
      const parsed = this.parseLine(line);
      if (parsed) {
        this.push(parsed);
      }
    }

    callback();
  }

  _flush(callback) {
    // Process any remaining data in buffer
    if (this.buffer.trim()) {
      const parsed = this.parseLine(this.buffer);
      if (parsed) {
        this.push(parsed);
      }
    }
    callback();
  }
}

module.exports = LogParser;
