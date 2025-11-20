/**
 * SOLUTION 1: Stream Processing Task
 *
 * This solution demonstrates:
 * - Reading files using child processes
 * - Stream transformation and piping
 * - Collecting statistics from streams
 * - Proper error handling
 */

const { spawn } = require('child_process');
const { Transform } = require('stream');
const fs = require('fs');

class LogProcessor {
  constructor() {
    this.stats = {
      ERROR: 0,
      WARNING: 0,
      INFO: 0,
      total: 0
    };
  }

  /**
   * Process a log file and collect statistics
   */
  async processFile(filePath) {
    return new Promise((resolve, reject) => {
      // Reset stats
      this.resetStats();

      // Spawn cat to read the file
      const cat = spawn('cat', [filePath]);

      // Create transform stream to parse and count lines
      const counter = new Transform({
        transform: (chunk, encoding, callback) => {
          const lines = chunk.toString().split('\n');

          lines.forEach(line => {
            if (!line.trim()) return;

            this.stats.total++;

            if (line.includes('ERROR')) {
              this.stats.ERROR++;
            } else if (line.includes('WARNING')) {
              this.stats.WARNING++;
            } else if (line.includes('INFO')) {
              this.stats.INFO++;
            }
          });

          callback();
        }
      });

      // Pipe cat output through counter
      cat.stdout.pipe(counter);

      // Handle errors
      cat.on('error', reject);
      cat.stderr.on('error', reject);
      counter.on('error', reject);

      // Resolve when done
      cat.on('close', (code) => {
        if (code === 0) {
          resolve(this.getStats());
        } else {
          reject(new Error(`cat exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Filter log file by severity
   */
  async filterBySeverity(filePath, severity) {
    return new Promise((resolve, reject) => {
      const cat = spawn('cat', [filePath]);
      const grep = spawn('grep', [severity]);

      // Pipe cat to grep
      cat.stdout.pipe(grep.stdin);

      // Collect matching lines
      const lines = [];
      grep.stdout.on('data', (data) => {
        const matchedLines = data.toString().split('\n').filter(l => l.trim());
        lines.push(...matchedLines);
      });

      // Handle errors
      cat.on('error', reject);
      grep.on('error', (err) => {
        // grep returns exit code 1 when no matches, which is not an error
        if (err.code !== 'EPIPE') {
          reject(err);
        }
      });

      // Resolve when complete
      grep.on('close', (code) => {
        // grep exit code 1 means no matches (not an error)
        if (code === 0 || code === 1) {
          resolve(lines);
        } else {
          reject(new Error(`grep exited with code ${code}`));
        }
      });
    });
  }

  getStats() {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = {
      ERROR: 0,
      WARNING: 0,
      INFO: 0,
      total: 0
    };
  }
}

// Export for use in other files
module.exports = LogProcessor;

// Test if run directly
if (require.main === module) {
  async function demo() {
    console.log('=== Solution 1 Demo ===\n');

    const testLogPath = '/tmp/demo-app.log';
    const testLog = `
2025-01-15T10:00:00 INFO Server started
2025-01-15T10:00:05 ERROR Failed to load config
2025-01-15T10:00:10 WARNING High memory usage
2025-01-15T10:00:15 INFO Request processed
`.trim();

    fs.writeFileSync(testLogPath, testLog);

    const processor = new LogProcessor();

    // Process file
    console.log('Processing log file...');
    const stats = await processor.processFile(testLogPath);
    console.log('Statistics:', stats);

    // Filter by ERROR
    console.log('\nFiltering for ERROR lines:');
    const errors = await processor.filterBySeverity(testLogPath, 'ERROR');
    errors.forEach(line => console.log(`  ${line}`));

    // Cleanup
    fs.unlinkSync(testLogPath);

    console.log('\n=== Demo Complete ===');
  }

  demo().catch(console.error);
}
