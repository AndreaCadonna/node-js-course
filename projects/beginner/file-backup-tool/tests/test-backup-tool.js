/**
 * Tests for File Backup Tool
 * Run with: node tests/test-backup-tool.js
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const BackupTool = require('../src/backup-tool');
const FileHasher = require('../src/hasher');

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
async function createTestDirectory() {
  const testDir = path.join(__dirname, 'test-temp');

  // Clean up if exists
  if (fsSync.existsSync(testDir)) {
    await fs.rm(testDir, { recursive: true, force: true });
  }

  await fs.mkdir(testDir, { recursive: true });
  return testDir;
}

async function cleanupTestDirectory(testDir) {
  if (fsSync.existsSync(testDir)) {
    await fs.rm(testDir, { recursive: true, force: true });
  }
}

async function createTestFiles(baseDir, structure) {
  for (const [filePath, content] of Object.entries(structure)) {
    const fullPath = path.join(baseDir, filePath);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content);
  }
}

// Run all tests
async function runTests() {
  const runner = new TestRunner();

  console.log('='.repeat(60));
  console.log('FILE BACKUP TOOL TESTS');
  console.log('='.repeat(60));
  console.log();

  // Test 1: Create BackupTool instance
  await runner.test('Should create BackupTool instance', async () => {
    const tool = new BackupTool();
    assert(tool instanceof BackupTool, 'Should be instance of BackupTool');
  });

  // Test 2: Calculate file hash
  await runner.test('Should calculate file hash', async () => {
    const testDir = await createTestDirectory();
    const testFile = path.join(testDir, 'test.txt');
    await fs.writeFile(testFile, 'Hello, World!');

    const hash = await FileHasher.calculateHash(testFile);
    assert(hash, 'Should return hash');
    assert(hash.length === 64, 'SHA-256 hash should be 64 characters');

    await cleanupTestDirectory(testDir);
  });

  // Test 3: Verify file integrity
  await runner.test('Should verify file integrity', async () => {
    const testDir = await createTestDirectory();
    const testFile = path.join(testDir, 'test.txt');
    await fs.writeFile(testFile, 'Test content');

    const hash = await FileHasher.calculateHash(testFile);
    const isValid = await FileHasher.verifyFile(testFile, hash);

    assert(isValid, 'File verification should pass');

    await cleanupTestDirectory(testDir);
  });

  // Test 4: Backup a single file
  await runner.test('Should backup a single file', async () => {
    const testDir = await createTestDirectory();
    const sourceFile = path.join(testDir, 'source.txt');
    const destDir = path.join(testDir, 'backup');

    await fs.writeFile(sourceFile, 'Test content');

    const tool = new BackupTool({ timestamp: false, verify: false });
    await tool.backup(sourceFile, destDir);

    const backedUpFile = path.join(destDir, 'source.txt');
    assert(fsSync.existsSync(backedUpFile), 'Backed up file should exist');

    const content = await fs.readFile(backedUpFile, 'utf8');
    assertEqual(content, 'Test content', 'Content should match');

    await cleanupTestDirectory(testDir);
  });

  // Test 5: Backup a directory recursively
  await runner.test('Should backup directory recursively', async () => {
    const testDir = await createTestDirectory();
    const sourceDir = path.join(testDir, 'source');
    const destDir = path.join(testDir, 'backup');

    await createTestFiles(sourceDir, {
      'file1.txt': 'File 1',
      'subdir/file2.txt': 'File 2',
      'subdir/nested/file3.txt': 'File 3'
    });

    const tool = new BackupTool({ timestamp: false, verify: false });
    await tool.backup(sourceDir, destDir);

    // Check all files exist
    assert(fsSync.existsSync(path.join(destDir, 'source/file1.txt')), 'File 1 should exist');
    assert(fsSync.existsSync(path.join(destDir, 'source/subdir/file2.txt')), 'File 2 should exist');
    assert(fsSync.existsSync(path.join(destDir, 'source/subdir/nested/file3.txt')), 'File 3 should exist');

    await cleanupTestDirectory(testDir);
  });

  // Test 6: Create timestamped backup directory
  await runner.test('Should create timestamped backup directory', async () => {
    const testDir = await createTestDirectory();
    const sourceFile = path.join(testDir, 'source.txt');
    const destDir = path.join(testDir, 'backups');

    await fs.writeFile(sourceFile, 'Test');

    const tool = new BackupTool({ timestamp: true, verify: false });
    await tool.backup(sourceFile, destDir);

    const entries = await fs.readdir(destDir);
    const timestampedDir = entries.find(e => e.startsWith('backup-'));

    assert(timestampedDir, 'Should create timestamped directory');
    assert(timestampedDir.match(/backup-\d{8}-\d{6}/), 'Should match timestamp pattern');

    await cleanupTestDirectory(testDir);
  });

  // Test 7: Track statistics
  await runner.test('Should track backup statistics', async () => {
    const testDir = await createTestDirectory();
    const sourceDir = path.join(testDir, 'source');
    const destDir = path.join(testDir, 'backup');

    await createTestFiles(sourceDir, {
      'file1.txt': 'Content 1',
      'file2.txt': 'Content 2',
      'subdir/file3.txt': 'Content 3'
    });

    const tool = new BackupTool({ timestamp: false, verify: false });
    const stats = await tool.backup(sourceDir, destDir);

    assertEqual(stats.filesBackedUp, 3, 'Should backup 3 files');
    assert(stats.directoriesCreated >= 1, 'Should create at least 1 directory');
    assert(stats.bytesTransferred > 0, 'Should transfer bytes');
    assert(stats.startTime, 'Should have start time');
    assert(stats.endTime, 'Should have end time');

    await cleanupTestDirectory(testDir);
  });

  // Test 8: Generate manifest
  await runner.test('Should generate backup manifest', async () => {
    const testDir = await createTestDirectory();
    const sourceFile = path.join(testDir, 'source.txt');
    const destDir = path.join(testDir, 'backup');

    await fs.writeFile(sourceFile, 'Test content');

    const tool = new BackupTool({ timestamp: false, verify: false });
    await tool.backup(sourceFile, destDir);

    const manifestPath = path.join(destDir, 'backup-manifest.json');
    assert(fsSync.existsSync(manifestPath), 'Manifest should exist');

    const content = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(content);

    assert(manifest.version, 'Manifest should have version');
    assert(manifest.timestamp, 'Manifest should have timestamp');
    assert(manifest.files.length === 1, 'Manifest should list files');

    await cleanupTestDirectory(testDir);
  });

  // Test 9: Verify backup integrity
  await runner.test('Should verify backup integrity', async () => {
    const testDir = await createTestDirectory();
    const sourceFile = path.join(testDir, 'source.txt');
    const destDir = path.join(testDir, 'backup');

    await fs.writeFile(sourceFile, 'Test content');

    const tool = new BackupTool({ timestamp: false, verify: true });
    const stats = await tool.backup(sourceFile, destDir);

    // Verification happens automatically
    assertEqual(stats.errors.length, 0, 'Should have no verification errors');

    await cleanupTestDirectory(testDir);
  });

  // Test 10: Exclude patterns
  await runner.test('Should exclude files by pattern', async () => {
    const testDir = await createTestDirectory();
    const sourceDir = path.join(testDir, 'source');
    const destDir = path.join(testDir, 'backup');

    await createTestFiles(sourceDir, {
      'file1.txt': 'Content 1',
      'node_modules/package.json': 'Package',
      '.git/config': 'Git config',
      'include.txt': 'Include this'
    });

    const tool = new BackupTool({
      timestamp: false,
      verify: false,
      excludePatterns: ['node_modules', '.git']
    });

    await tool.backup(sourceDir, destDir);

    // Check excluded files don't exist
    assert(!fsSync.existsSync(path.join(destDir, 'source/node_modules')), 'node_modules should be excluded');
    assert(!fsSync.existsSync(path.join(destDir, 'source/.git')), '.git should be excluded');

    // Check included files exist
    assert(fsSync.existsSync(path.join(destDir, 'source/file1.txt')), 'file1.txt should be included');
    assert(fsSync.existsSync(path.join(destDir, 'source/include.txt')), 'include.txt should be included');

    await cleanupTestDirectory(testDir);
  });

  // Test 11: Incremental backup
  await runner.test('Should perform incremental backup', async () => {
    const testDir = await createTestDirectory();
    const sourceDir = path.join(testDir, 'source');
    const destDir = path.join(testDir, 'backup');

    // Initial backup
    await createTestFiles(sourceDir, {
      'file1.txt': 'Content 1',
      'file2.txt': 'Content 2'
    });

    const tool = new BackupTool({ timestamp: false, verify: false, incremental: true });
    const stats1 = await tool.backup(sourceDir, destDir);

    assertEqual(stats1.filesBackedUp, 2, 'First backup should backup 2 files');

    // Wait a bit and create new file
    await new Promise(resolve => setTimeout(resolve, 100));
    await fs.writeFile(path.join(sourceDir, 'file3.txt'), 'Content 3');

    // Second backup (incremental)
    const tool2 = new BackupTool({ timestamp: false, verify: false, incremental: true });
    const stats2 = await tool2.backup(sourceDir, destDir);

    // Should skip unchanged files
    assert(stats2.filesSkipped > 0, 'Should skip unchanged files');

    await cleanupTestDirectory(testDir);
  });

  // Test 12: Restore from backup
  await runner.test('Should restore from backup', async () => {
    const testDir = await createTestDirectory();
    const sourceDir = path.join(testDir, 'source');
    const backupDir = path.join(testDir, 'backup');
    const restoreDir = path.join(testDir, 'restored');

    await createTestFiles(sourceDir, {
      'file1.txt': 'Content 1',
      'subdir/file2.txt': 'Content 2'
    });

    // Create backup
    const tool = new BackupTool({ timestamp: false, verify: false });
    await tool.backup(sourceDir, backupDir);

    // Restore
    const result = await tool.restore(backupDir, restoreDir);

    assert(result.restored === 2, 'Should restore 2 files');
    assert(fsSync.existsSync(path.join(restoreDir, 'source/file1.txt')), 'File 1 should be restored');
    assert(fsSync.existsSync(path.join(restoreDir, 'source/subdir/file2.txt')), 'File 2 should be restored');

    await cleanupTestDirectory(testDir);
  });

  // Test 13: Preserve file timestamps
  await runner.test('Should preserve file timestamps', async () => {
    const testDir = await createTestDirectory();
    const sourceFile = path.join(testDir, 'source.txt');
    const destDir = path.join(testDir, 'backup');

    await fs.writeFile(sourceFile, 'Test content');

    // Set specific timestamp
    const testTime = new Date('2025-01-01T00:00:00Z');
    await fs.utimes(sourceFile, testTime, testTime);

    const tool = new BackupTool({ timestamp: false, verify: false });
    await tool.backup(sourceFile, destDir);

    const backedUpFile = path.join(destDir, 'source.txt');
    const stats = await fs.stat(backedUpFile);

    assertEqual(
      stats.mtime.toISOString(),
      testTime.toISOString(),
      'Timestamps should be preserved'
    );

    await cleanupTestDirectory(testDir);
  });

  // Test 14: Handle errors gracefully
  await runner.test('Should handle errors gracefully', async () => {
    const tool = new BackupTool({ timestamp: false, verify: false });

    try {
      await tool.backup('/non/existent/path', '/some/destination');
      throw new Error('Should have thrown error');
    } catch (error) {
      assert(error.message.includes('does not exist'), 'Should report path does not exist');
    }
  });

  // Test 15: Prevent backing up to subdirectory
  await runner.test('Should prevent backing up to subdirectory', async () => {
    const testDir = await createTestDirectory();
    const sourceDir = path.join(testDir, 'source');
    const destDir = path.join(sourceDir, 'backup'); // Inside source!

    await fs.mkdir(sourceDir);

    const tool = new BackupTool({ timestamp: false, verify: false });

    try {
      await tool.backup(sourceDir, destDir);
      throw new Error('Should have thrown error');
    } catch (error) {
      assert(
        error.message.includes('cannot be inside source'),
        'Should prevent backup to subdirectory'
      );
    }

    await cleanupTestDirectory(testDir);
  });

  // Test 16: Format file size
  await runner.test('Should format file sizes correctly', async () => {
    const tool = new BackupTool();

    assertEqual(tool.formatSize(500), '500.00 B');
    assertEqual(tool.formatSize(1024), '1.00 KB');
    assertEqual(tool.formatSize(1024 * 1024), '1.00 MB');
    assertEqual(tool.formatSize(1024 * 1024 * 1024), '1.00 GB');
  });

  // Test 17: Calculate buffer hash
  await runner.test('Should calculate buffer hash', async () => {
    const buffer = Buffer.from('Hello, World!');
    const hash = FileHasher.calculateBufferHash(buffer);

    assert(hash, 'Should return hash');
    assert(hash.length === 64, 'SHA-256 hash should be 64 characters');
  });

  // Test 18: Detect hash mismatch
  await runner.test('Should detect hash mismatch', async () => {
    const testDir = await createTestDirectory();
    const testFile = path.join(testDir, 'test.txt');
    await fs.writeFile(testFile, 'Original content');

    const hash = await FileHasher.calculateHash(testFile);

    // Modify file
    await fs.writeFile(testFile, 'Modified content');

    const isValid = await FileHasher.verifyFile(testFile, hash);
    assertEqual(isValid, false, 'Verification should fail for modified file');

    await cleanupTestDirectory(testDir);
  });

  // Test 19: Empty directory backup
  await runner.test('Should handle empty directory', async () => {
    const testDir = await createTestDirectory();
    const sourceDir = path.join(testDir, 'empty');
    const destDir = path.join(testDir, 'backup');

    await fs.mkdir(sourceDir);

    const tool = new BackupTool({ timestamp: false, verify: false });
    const stats = await tool.backup(sourceDir, destDir);

    assertEqual(stats.filesBackedUp, 0, 'Should backup 0 files');
    assert(fsSync.existsSync(path.join(destDir, 'empty')), 'Directory should be created');

    await cleanupTestDirectory(testDir);
  });

  // Test 20: Large file backup
  await runner.test('Should backup large files', async () => {
    const testDir = await createTestDirectory();
    const sourceFile = path.join(testDir, 'large.bin');
    const destDir = path.join(testDir, 'backup');

    // Create a 1MB file
    const largeBuffer = Buffer.alloc(1024 * 1024, 'a');
    await fs.writeFile(sourceFile, largeBuffer);

    const tool = new BackupTool({ timestamp: false, verify: true });
    const stats = await tool.backup(sourceFile, destDir);

    assertEqual(stats.filesBackedUp, 1, 'Should backup 1 file');
    assertEqual(stats.bytesTransferred, 1024 * 1024, 'Should transfer 1MB');
    assertEqual(stats.errors.length, 0, 'Should have no errors');

    await cleanupTestDirectory(testDir);
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
