/**
 * Tests for File Organizer
 * Run with: node tests/test-file-organizer.js
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const FileOrganizer = require('../src/file-organizer');

// Test utilities
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
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

async function createTestFiles(testDir, files) {
  for (const file of files) {
    const filePath = path.join(testDir, file);
    await fs.writeFile(filePath, `test content for ${file}`);
  }
}

// Run all tests
async function runTests() {
  const runner = new TestRunner();

  console.log('='.repeat(60));
  console.log('FILE ORGANIZER TESTS');
  console.log('='.repeat(60));
  console.log();

  // Test 1: Initialize FileOrganizer
  await runner.test('Should create FileOrganizer instance', async () => {
    const testDir = await createTestDirectory();
    const organizer = new FileOrganizer(testDir);

    assert(organizer instanceof FileOrganizer, 'Should be instance of FileOrganizer');
    assert(organizer.sourceDir === testDir, 'Should set source directory');

    await cleanupTestDirectory(testDir);
  });

  // Test 2: Validate existing directory
  await runner.test('Should validate existing directory', async () => {
    const testDir = await createTestDirectory();
    const organizer = new FileOrganizer(testDir);

    await organizer.validateDirectory();

    await cleanupTestDirectory(testDir);
  });

  // Test 3: Fail on non-existent directory
  await runner.test('Should fail on non-existent directory', async () => {
    const organizer = new FileOrganizer('/non/existent/path');

    try {
      await organizer.validateDirectory();
      throw new Error('Should have thrown error');
    } catch (error) {
      assert(error.message.includes('does not exist'), 'Should report directory does not exist');
    }
  });

  // Test 4: Scan directory and find files
  await runner.test('Should scan directory and find files', async () => {
    const testDir = await createTestDirectory();
    await createTestFiles(testDir, ['test1.jpg', 'test2.pdf', 'test3.mp3']);

    const organizer = new FileOrganizer(testDir);
    const files = await organizer.scanDirectory();

    assertEqual(files.length, 3, 'Should find 3 files');

    await cleanupTestDirectory(testDir);
  });

  // Test 5: Ignore system files
  await runner.test('Should ignore system files', async () => {
    const testDir = await createTestDirectory();
    await createTestFiles(testDir, ['test.jpg', '.DS_Store', 'Thumbs.db']);

    const organizer = new FileOrganizer(testDir);
    const files = await organizer.scanDirectory();

    assertEqual(files.length, 1, 'Should only find 1 file');
    assertEqual(organizer.stats.filesSkipped, 2, 'Should skip 2 system files');

    await cleanupTestDirectory(testDir);
  });

  // Test 6: Determine file categories correctly
  await runner.test('Should determine file categories correctly', async () => {
    const testDir = await createTestDirectory();
    const organizer = new FileOrganizer(testDir);

    assertEqual(organizer.determineCategory('.jpg'), 'images');
    assertEqual(organizer.determineCategory('.pdf'), 'documents');
    assertEqual(organizer.determineCategory('.mp3'), 'audio');
    assertEqual(organizer.determineCategory('.mp4'), 'videos');
    assertEqual(organizer.determineCategory('.zip'), 'archives');
    assertEqual(organizer.determineCategory('.js'), 'code');

    await cleanupTestDirectory(testDir);
  });

  // Test 7: Return null for unknown extensions
  await runner.test('Should return null for unknown extensions', async () => {
    const testDir = await createTestDirectory();
    const organizer = new FileOrganizer(testDir);

    assertEqual(organizer.determineCategory('.xyz'), null);

    await cleanupTestDirectory(testDir);
  });

  // Test 8: Organize files into categories
  await runner.test('Should organize files into categories', async () => {
    const testDir = await createTestDirectory();
    await createTestFiles(testDir, [
      'photo.jpg',
      'document.pdf',
      'song.mp3',
      'video.mp4'
    ]);

    const organizer = new FileOrganizer(testDir, { verbose: false, createReport: false });
    await organizer.organize();

    // Check that directories were created
    assert(fsSync.existsSync(path.join(testDir, 'Images')), 'Images folder should exist');
    assert(fsSync.existsSync(path.join(testDir, 'Documents')), 'Documents folder should exist');
    assert(fsSync.existsSync(path.join(testDir, 'Audio')), 'Audio folder should exist');
    assert(fsSync.existsSync(path.join(testDir, 'Videos')), 'Videos folder should exist');

    // Check that files were moved
    assert(fsSync.existsSync(path.join(testDir, 'Images', 'photo.jpg')), 'Image should be moved');
    assert(fsSync.existsSync(path.join(testDir, 'Documents', 'document.pdf')), 'Document should be moved');
    assert(fsSync.existsSync(path.join(testDir, 'Audio', 'song.mp3')), 'Audio should be moved');
    assert(fsSync.existsSync(path.join(testDir, 'Videos', 'video.mp4')), 'Video should be moved');

    await cleanupTestDirectory(testDir);
  });

  // Test 9: Dry run should not move files
  await runner.test('Dry run should not move files', async () => {
    const testDir = await createTestDirectory();
    await createTestFiles(testDir, ['test.jpg', 'test.pdf']);

    const organizer = new FileOrganizer(testDir, { dryRun: true, createReport: false });
    const stats = await organizer.organize();

    // Files should still be in root
    assert(fsSync.existsSync(path.join(testDir, 'test.jpg')), 'File should still be in root');
    assert(fsSync.existsSync(path.join(testDir, 'test.pdf')), 'File should still be in root');

    // Stats should be recorded
    assertEqual(stats.filesOrganized, 2, 'Should count 2 files as organized');

    await cleanupTestDirectory(testDir);
  });

  // Test 10: Handle naming conflicts
  await runner.test('Should handle naming conflicts', async () => {
    const testDir = await createTestDirectory();

    // Create images directory with existing file
    await fs.mkdir(path.join(testDir, 'Images'));
    await fs.writeFile(path.join(testDir, 'Images', 'photo.jpg'), 'existing');

    // Create new file with same name
    await fs.writeFile(path.join(testDir, 'photo.jpg'), 'new');

    const organizer = new FileOrganizer(testDir, { createReport: false });
    await organizer.organize();

    // Original should still exist
    assert(fsSync.existsSync(path.join(testDir, 'Images', 'photo.jpg')), 'Original should exist');

    // New file should have suffix
    assert(fsSync.existsSync(path.join(testDir, 'Images', 'photo_1.jpg')), 'Conflicting file should have suffix');

    await cleanupTestDirectory(testDir);
  });

  // Test 11: Generate statistics
  await runner.test('Should generate correct statistics', async () => {
    const testDir = await createTestDirectory();
    await createTestFiles(testDir, [
      'photo1.jpg',
      'photo2.png',
      'doc.pdf',
      'song.mp3'
    ]);

    const organizer = new FileOrganizer(testDir, { createReport: false });
    const stats = await organizer.organize();

    assertEqual(stats.totalFiles, 4, 'Should count 4 total files');
    assertEqual(stats.filesOrganized, 4, 'Should organize 4 files');
    assertEqual(stats.directoriesCreated, 3, 'Should create 3 directories');
    assert(stats.startTime instanceof Date, 'Should have start time');
    assert(stats.endTime instanceof Date, 'Should have end time');

    await cleanupTestDirectory(testDir);
  });

  // Test 12: Generate organization report
  await runner.test('Should generate organization report', async () => {
    const testDir = await createTestDirectory();
    await createTestFiles(testDir, ['test.jpg', 'test.pdf']);

    const organizer = new FileOrganizer(testDir, { createReport: true });
    await organizer.organize();

    const reportPath = path.join(testDir, 'organization-report.txt');
    assert(fsSync.existsSync(reportPath), 'Report file should be created');

    const content = await fs.readFile(reportPath, 'utf8');
    assert(content.includes('FILE ORGANIZATION REPORT'), 'Report should have header');
    assert(content.includes('SUMMARY'), 'Report should have summary');

    await cleanupTestDirectory(testDir);
  });

  // Test 13: Handle files with no extension
  await runner.test('Should handle files with no extension', async () => {
    const testDir = await createTestDirectory();
    await createTestFiles(testDir, ['README', 'LICENSE', 'Makefile']);

    const organizer = new FileOrganizer(testDir, { createReport: false });
    await organizer.organize();

    // Should go to Others folder
    assert(fsSync.existsSync(path.join(testDir, 'Others')), 'Others folder should exist');
    assert(fsSync.existsSync(path.join(testDir, 'Others', 'README')), 'README should be in Others');

    await cleanupTestDirectory(testDir);
  });

  // Test 14: Undo operation
  await runner.test('Should undo organization', async () => {
    const testDir = await createTestDirectory();
    await createTestFiles(testDir, ['photo.jpg', 'doc.pdf']);

    // Organize
    const organizer = new FileOrganizer(testDir, { createReport: false });
    await organizer.organize();

    // Verify files were moved
    assert(fsSync.existsSync(path.join(testDir, 'Images', 'photo.jpg')), 'Image should be in Images folder');

    // Undo
    await organizer.undo();

    // Verify files are back in root
    assert(fsSync.existsSync(path.join(testDir, 'photo.jpg')), 'Image should be back in root');
    assert(fsSync.existsSync(path.join(testDir, 'doc.pdf')), 'Document should be back in root');

    await cleanupTestDirectory(testDir);
  });

  // Test 15: Custom categories
  await runner.test('Should support custom categories', async () => {
    const testDir = await createTestDirectory();
    await createTestFiles(testDir, ['test.custom']);

    const customCategories = {
      myCategory: {
        extensions: ['.custom'],
        folder: 'MyFolder'
      }
    };

    const organizer = new FileOrganizer(testDir, {
      customCategories,
      createReport: false
    });

    await organizer.organize();

    assert(fsSync.existsSync(path.join(testDir, 'MyFolder')), 'Custom folder should exist');
    assert(fsSync.existsSync(path.join(testDir, 'MyFolder', 'test.custom')), 'File should be in custom folder');

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
