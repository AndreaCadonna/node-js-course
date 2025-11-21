/**
 * Tests for Simple Logger
 * Run with: node tests/test-logger.js
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const Logger = require('../src/logger');

// Test utilities
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  async test(name, fn) {
    try {
      await fn();
      this.passed++;
      console.log(`✓ ${name}`);
    } catch (error) {
      this.failed++;
      console.log(`✗ ${name}`);
      console.log(`  Error: ${error.message}`);
      if (error.stack) {
        console.log(`  ${error.stack.split('\n')[1]}`);
      }
    }
  }

  report() {
    console.log();
    console.log('='.repeat(60));
    console.log(`Tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log('='.repeat(60));
  }
}

// Assertion helpers
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

// Test setup/teardown helpers
async function createTestLogDir() {
  const testDir = path.join(__dirname, 'test-logs');

  // Clean up if exists
  if (fsSync.existsSync(testDir)) {
    await fs.rm(testDir, { recursive: true, force: true });
  }

  await fs.mkdir(testDir, { recursive: true });
  return testDir;
}

async function cleanupTestLogDir(testDir) {
  if (fsSync.existsSync(testDir)) {
    await fs.rm(testDir, { recursive: true, force: true });
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run all tests
async function runTests() {
  const runner = new TestRunner();

  console.log('='.repeat(60));
  console.log('SIMPLE LOGGER TESTS');
  console.log('='.repeat(60));
  console.log();

  // Test 1: Create logger instance
  await runner.test('Should create Logger instance', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false });

    assert(logger instanceof Logger, 'Should be instance of Logger');
    assert(fsSync.existsSync(testDir), 'Log directory should be created');

    await cleanupTestLogDir(testDir);
  });

  // Test 2: Log info message
  await runner.test('Should log info message', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false });

    await logger.info('Test message');

    const logFile = path.join(testDir, 'app.log');
    assert(fsSync.existsSync(logFile), 'Log file should be created');

    const content = await fs.readFile(logFile, 'utf8');
    assert(content.includes('Test message'), 'Log should contain message');
    assert(content.includes('[INFO]'), 'Log should contain INFO level');

    await cleanupTestLogDir(testDir);
  });

  // Test 3: Log different levels
  await runner.test('Should log different levels', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false, level: 'DEBUG' });

    await logger.debug('Debug message');
    await logger.info('Info message');
    await logger.warn('Warning message');
    await logger.error('Error message');
    await logger.fatal('Fatal message');

    const stats = logger.getStats();
    assertEqual(stats.totalLogs, 5, 'Should have 5 total logs');
    assertEqual(stats.logsByLevel.DEBUG, 1, 'Should have 1 debug log');
    assertEqual(stats.logsByLevel.INFO, 1, 'Should have 1 info log');
    assertEqual(stats.logsByLevel.WARN, 1, 'Should have 1 warn log');
    assertEqual(stats.logsByLevel.ERROR, 1, 'Should have 1 error log');
    assertEqual(stats.logsByLevel.FATAL, 1, 'Should have 1 fatal log');

    await cleanupTestLogDir(testDir);
  });

  // Test 4: Respect log level threshold
  await runner.test('Should respect log level threshold', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false, level: 'WARN' });

    await logger.debug('Debug message');
    await logger.info('Info message');
    await logger.warn('Warning message');
    await logger.error('Error message');

    const stats = logger.getStats();
    assertEqual(stats.totalLogs, 2, 'Should only log WARN and ERROR');
    assertEqual(stats.logsByLevel.DEBUG, 0, 'Should not log DEBUG');
    assertEqual(stats.logsByLevel.INFO, 0, 'Should not log INFO');
    assertEqual(stats.logsByLevel.WARN, 1, 'Should log WARN');
    assertEqual(stats.logsByLevel.ERROR, 1, 'Should log ERROR');

    await cleanupTestLogDir(testDir);
  });

  // Test 5: Include timestamps
  await runner.test('Should include timestamps', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false, timestamp: true });

    await logger.info('Test message');

    const logs = await logger.readLogs();
    assert(logs[0].match(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/), 'Should have ISO timestamp');

    await cleanupTestLogDir(testDir);
  });

  // Test 6: Disable timestamps
  await runner.test('Should work without timestamps', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false, timestamp: false });

    await logger.info('Test message');

    const logs = await logger.readLogs();
    assert(!logs[0].match(/\[\d{4}-\d{2}-\d{2}/), 'Should not have timestamp');
    assert(logs[0].includes('[INFO]'), 'Should still have log level');

    await cleanupTestLogDir(testDir);
  });

  // Test 7: Separate error log
  await runner.test('Should create separate error log', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false, separateErrorFile: true });

    await logger.info('Info message');
    await logger.error('Error message');

    const mainLog = path.join(testDir, 'app.log');
    const errorLog = path.join(testDir, 'app.error.log');

    assert(fsSync.existsSync(mainLog), 'Main log should exist');
    assert(fsSync.existsSync(errorLog), 'Error log should exist');

    const errorContent = await fs.readFile(errorLog, 'utf8');
    assert(errorContent.includes('Error message'), 'Error log should contain error');
    assert(!errorContent.includes('Info message'), 'Error log should not contain info');

    await cleanupTestLogDir(testDir);
  });

  // Test 8: Log metadata
  await runner.test('Should include metadata in logs', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false });

    await logger.info('User action', { userId: '123', action: 'login' });

    const logs = await logger.readLogs();
    assert(logs[0].includes('userId=123'), 'Should include userId metadata');
    assert(logs[0].includes('action=login'), 'Should include action metadata');

    await cleanupTestLogDir(testDir);
  });

  // Test 9: Global metadata
  await runner.test('Should support global metadata', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({
      logDir: testDir,
      console: false,
      metadata: { app: 'test-app', version: '1.0.0' }
    });

    await logger.info('Test message');

    const logs = await logger.readLogs();
    assert(logs[0].includes('app=test-app'), 'Should include app metadata');
    assert(logs[0].includes('version=1.0.0'), 'Should include version metadata');

    await cleanupTestLogDir(testDir);
  });

  // Test 10: Child logger
  await runner.test('Should create child logger with additional metadata', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({
      logDir: testDir,
      console: false,
      metadata: { app: 'test-app' }
    });

    const childLogger = logger.child({ module: 'auth' });
    await childLogger.info('Login attempt');

    const logs = await logger.readLogs();
    assert(logs[0].includes('app=test-app'), 'Should include parent metadata');
    assert(logs[0].includes('module=auth'), 'Should include child metadata');

    await cleanupTestLogDir(testDir);
  });

  // Test 11: Read logs
  await runner.test('Should read logs', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false });

    await logger.info('Message 1');
    await logger.info('Message 2');
    await logger.info('Message 3');

    const logs = await logger.readLogs();
    assertEqual(logs.length, 3, 'Should read 3 log entries');

    await cleanupTestLogDir(testDir);
  });

  // Test 12: Read limited number of lines
  await runner.test('Should read limited number of lines', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false });

    for (let i = 1; i <= 10; i++) {
      await logger.info(`Message ${i}`);
    }

    const logs = await logger.readLogs({ lines: 3 });
    assertEqual(logs.length, 3, 'Should read only 3 lines');
    assert(logs[2].includes('Message 10'), 'Should read last 3 lines');

    await cleanupTestLogDir(testDir);
  });

  // Test 13: Filter logs by level
  await runner.test('Should filter logs by level', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false, level: 'DEBUG' });

    await logger.info('Info message');
    await logger.warn('Warning message');
    await logger.error('Error message');

    const errorLogs = await logger.readLogs({ level: 'ERROR' });
    assertEqual(errorLogs.length, 1, 'Should read only error logs');
    assert(errorLogs[0].includes('Error message'), 'Should contain error message');

    await cleanupTestLogDir(testDir);
  });

  // Test 14: Clear logs
  await runner.test('Should clear all logs', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false });

    await logger.info('Message 1');
    await logger.error('Error 1');

    const count = await logger.clearLogs();
    assert(count >= 1, 'Should clear at least 1 file');

    const stats = logger.getStats();
    assertEqual(stats.totalLogs, 0, 'Stats should be reset');

    await cleanupTestLogDir(testDir);
  });

  // Test 15: Log rotation by size
  await runner.test('Should rotate logs by size', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({
      logDir: testDir,
      console: false,
      maxSize: 100, // Very small size to trigger rotation
      maxFiles: 3
    });

    // Write enough logs to trigger rotation
    for (let i = 0; i < 20; i++) {
      await logger.info(`This is a longer message to fill up the log file ${i}`);
    }

    const stats = logger.getStats();
    assert(stats.rotations > 0, 'Should have rotated logs');

    // Check that backup files exist
    const files = await fs.readdir(testDir);
    const backupFiles = files.filter(f => f.match(/\.1\.log$/));
    assert(backupFiles.length > 0, 'Should create backup files');

    await cleanupTestLogDir(testDir);
  });

  // Test 16: Custom log file name
  await runner.test('Should support custom log file name', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({
      logDir: testDir,
      logFile: 'custom.log',
      console: false
    });

    await logger.info('Test message');

    const logFile = path.join(testDir, 'custom.log');
    assert(fsSync.existsSync(logFile), 'Custom log file should exist');

    await cleanupTestLogDir(testDir);
  });

  // Test 17: Statistics tracking
  await runner.test('Should track statistics', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false });

    await logger.info('Message 1');
    await logger.warn('Warning 1');
    await logger.error('Error 1');

    const stats = logger.getStats();
    assertEqual(stats.totalLogs, 3, 'Should track total logs');
    assert(stats.currentLogFile, 'Should have current log file path');

    await cleanupTestLogDir(testDir);
  });

  // Test 18: Handle errors gracefully
  await runner.test('Should handle write errors gracefully', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false });

    // Delete the directory after logger is created to simulate write error
    await fs.rm(testDir, { recursive: true, force: true });

    // Should not throw, should track error
    await logger.info('Test message');

    const stats = logger.getStats();
    assert(stats.errors.length > 0, 'Should track errors');
  });

  // Test 19: Empty log reads
  await runner.test('Should handle empty log file', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({ logDir: testDir, console: false });

    const logs = await logger.readLogs();
    assertEqual(logs.length, 0, 'Should return empty array');

    await cleanupTestLogDir(testDir);
  });

  // Test 20: Daily rotation
  await runner.test('Should support daily rotation naming', async () => {
    const testDir = await createTestLogDir();
    const logger = new Logger({
      logDir: testDir,
      console: false,
      rotateDaily: true
    });

    await logger.info('Test message');

    const files = await fs.readdir(testDir);
    const datePattern = /app-\d{4}-\d{2}-\d{2}\.log/;
    const dailyLog = files.find(f => datePattern.test(f));

    assert(dailyLog, 'Should create date-stamped log file');

    await cleanupTestLogDir(testDir);
  });

  runner.report();
  process.exit(runner.failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
