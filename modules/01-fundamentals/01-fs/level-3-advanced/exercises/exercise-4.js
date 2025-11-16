/**
 * Exercise 4: Automatic Log Rotator
 *
 * DIFFICULTY: ⭐⭐⭐ Advanced
 * TIME: 30-40 minutes
 *
 * OBJECTIVE:
 * Build an automatic log rotation system that manages log files,
 * preventing them from growing too large and consuming disk space.
 *
 * REQUIREMENTS:
 * 1. Rotate logs based on size threshold (e.g., 10MB)
 * 2. Rotate logs based on time (daily, hourly)
 * 3. Keep configurable number of old logs
 * 4. Compress old log files (.gz)
 * 5. Delete oldest logs when max count reached
 * 6. Atomic rotation (no lost log entries)
 * 7. Support for multiple log files
 * 8. Watch mode for automatic rotation
 *
 * ROTATION STRATEGY:
 * app.log           <- Current log (active)
 * app.log.1         <- Previous rotation
 * app.log.2.gz      <- Older, compressed
 * app.log.3.gz
 * ...
 * app.log.10.gz     <- Oldest (will be deleted on next rotation)
 *
 * EXAMPLE USAGE:
 * const rotator = new LogRotator({
 *   logFile: './logs/app.log',
 *   maxSize: 10 * 1024 * 1024, // 10MB
 *   maxFiles: 10,
 *   compress: true,
 *   interval: 'daily' // or 'hourly', 'size-based'
 * });
 *
 * // Manual rotation
 * await rotator.rotate();
 *
 * // Automatic rotation
 * rotator.watch();
 *
 * // Append to log (with automatic rotation)
 * await rotator.append('2024-01-15 Error: Something happened\n');
 *
 * BONUS CHALLENGES:
 * - Add log archiving to separate directory
 * - Support remote log shipping
 * - Implement log aggregation (merge multiple logs)
 * - Add log format validation
 * - Create log statistics (errors per hour, etc.)
 * - Support custom rotation triggers
 * - Implement graceful handling of app restarts
 * - Add log signing for integrity verification
 *
 * HINTS:
 * - Use fs.stat() to check file size
 * - Use fs.rename() for atomic rotation
 * - Use zlib for compression
 * - Use fs.watch() for monitoring
 * - Handle concurrent writes with locking
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);

// TODO: Implement your solution here

/**
 * Log rotator
 */
class LogRotator {
  constructor(options) {
    this.logFile = options.logFile;
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    this.maxFiles = options.maxFiles || 10;
    this.compress = options.compress !== false;
    this.interval = options.interval || 'size-based'; // 'daily', 'hourly', 'size-based'

    this.watcher = null;
    this.intervalTimer = null;
    this.lockFile = this.logFile + '.lock';
  }

  async shouldRotate() {
    // TODO: Check if rotation is needed
    // Based on size or time
  }

  async rotate() {
    // TODO: Perform rotation
    // 1. Acquire lock
    // 2. Check if rotation needed
    // 3. Rotate files (rename .1 → .2, .2 → .3, etc.)
    // 4. Rename current log to .1
    // 5. Create new empty log
    // 6. Compress old logs
    // 7. Delete excess logs
    // 8. Release lock
  }

  async rotateFiles() {
    // TODO: Shift all numbered logs
    // app.log.9 → app.log.10 (then delete if over limit)
    // app.log.8 → app.log.9
    // ...
    // app.log.1 → app.log.2
    // app.log → app.log.1
  }

  async compressLog(logPath) {
    // TODO: Compress log file with gzip
    // Read file, compress, write .gz, delete original
  }

  async deleteOldLogs() {
    // TODO: Delete logs beyond maxFiles
  }

  async append(data) {
    // TODO: Append to log file
    // Check if rotation needed before writing
  }

  watch() {
    // TODO: Start watching for automatic rotation
    // Check size on interval or timer
  }

  stopWatching() {
    // TODO: Stop automatic rotation
  }

  async acquireLock() {
    // TODO: Acquire lock file
  }

  async releaseLock() {
    // TODO: Release lock file
  }

  async getLogFiles() {
    // TODO: Find all rotated log files
    // Return sorted list of { path, number, compressed }
  }
}

/**
 * Log writer with automatic rotation
 */
class RotatingLogger {
  constructor(rotator) {
    this.rotator = rotator;
    this.stream = null;
  }

  async open() {
    // TODO: Open write stream to current log
  }

  async write(message) {
    // TODO: Write to log with automatic rotation check
  }

  async close() {
    // TODO: Close stream
  }
}

/**
 * Time-based rotation scheduler
 */
class RotationScheduler {
  constructor(rotator, interval) {
    this.rotator = rotator;
    this.interval = interval; // 'daily', 'hourly'
    this.timer = null;
  }

  start() {
    // TODO: Schedule rotation based on time
    // Calculate next rotation time
    // Set timer
  }

  stop() {
    // TODO: Clear timer
  }

  getNextRotationTime() {
    // TODO: Calculate next rotation time
    // For 'daily': next midnight
    // For 'hourly': next hour
  }
}

/**
 * Testing and demonstration
 */
async function testRotation() {
  console.log('Log Rotation Test\n');
  console.log('='.repeat(50));

  const testDir = path.join(__dirname, 'test-rotation');
  await fs.mkdir(testDir, { recursive: true });

  const logFile = path.join(testDir, 'app.log');

  try {
    // Test size-based rotation
    console.log('\n1. Size-Based Rotation');
    console.log('-'.repeat(50));

    const rotator = new LogRotator({
      logFile: logFile,
      maxSize: 1024, // 1KB for testing
      maxFiles: 5,
      compress: true
    });

    // Write enough data to trigger rotation
    for (let i = 0; i < 20; i++) {
      await rotator.append(`Log entry ${i}: ${'x'.repeat(100)}\n`);

      if (await rotator.shouldRotate()) {
        console.log(`Rotating at entry ${i}...`);
        await rotator.rotate();
      }
    }

    // List rotated logs
    const logs = await rotator.getLogFiles();
    console.log(`\nRotated logs: ${logs.length}`);
    logs.forEach(log => {
      console.log(`  ${path.basename(log.path)} ${log.compressed ? '(compressed)' : ''}`);
    });

    // Test automatic rotation
    console.log('\n2. Automatic Rotation');
    console.log('-'.repeat(50));

    const logger = new RotatingLogger(rotator);
    await logger.open();

    rotator.watch();
    console.log('Watching for automatic rotation...');

    // Simulate log writes
    for (let i = 0; i < 10; i++) {
      await logger.write(`Auto log ${i}: ${'y'.repeat(150)}\n`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    rotator.stopWatching();
    await logger.close();

    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });
    console.log('\n✓ Test complete');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

// testRotation();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Create test log:
 *    echo "Initial log" > test.log
 *
 * 2. Test manual rotation:
 *    node exercise-4.js --rotate test.log --max-size 1MB --max-files 5
 *
 * 3. Generate large log:
 *    for i in {1..10000}; do
 *      echo "Log entry $i: $(date)" >> test.log
 *    done
 *
 * 4. Test automatic rotation:
 *    node exercise-4.js --watch test.log --max-size 1MB
 *
 * 5. Verify rotation:
 *    ls -lh test.log*
 */

/**
 * COMPRESSION EXAMPLE:
 *
 * async function compressLog(inputPath, outputPath) {
 *   const input = await fs.readFile(inputPath);
 *   const compressed = await gzip(input);
 *   await fs.writeFile(outputPath, compressed);
 *   await fs.unlink(inputPath);
 * }
 */

/**
 * ROTATION EXAMPLE:
 *
 * async function rotateFiles(baseLogPath, maxFiles) {
 *   // Shift existing rotations
 *   for (let i = maxFiles - 1; i >= 1; i--) {
 *     const oldPath = `${baseLogPath}.${i}`;
 *     const newPath = `${baseLogPath}.${i + 1}`;
 *
 *     try {
 *       await fs.rename(oldPath, newPath);
 *     } catch (err) {
 *       // File might not exist yet
 *     }
 *   }
 *
 *   // Rotate current log to .1
 *   await fs.rename(baseLogPath, `${baseLogPath}.1`);
 *
 *   // Create new empty log
 *   await fs.writeFile(baseLogPath, '');
 * }
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - Why is atomic rotation important?
 * - How do you prevent log entry loss during rotation?
 * - What are the benefits of compression?
 * - How do you handle concurrent access to logs?
 * - What are the challenges of time-based rotation?
 */
