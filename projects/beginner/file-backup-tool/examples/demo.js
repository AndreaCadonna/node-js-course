/**
 * File Backup Tool Demo
 * Demonstrates backup, restore, and verification capabilities
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const BackupTool = require('../src/backup-tool');
const FileHasher = require('../src/hasher');

// Create demo files and directories
async function createDemoData() {
  const demoDir = path.join(__dirname, 'demo-data');

  // Clean up if exists
  if (fsSync.existsSync(demoDir)) {
    await fs.rm(demoDir, { recursive: true, force: true });
  }

  // Create demo directory structure
  await fs.mkdir(demoDir, { recursive: true });

  // Create sample files
  const files = {
    'documents/report.txt': 'This is an important business report.\nGenerated on ' + new Date().toISOString(),
    'documents/presentation.txt': 'Sales presentation for Q4 2025',
    'photos/vacation.txt': 'Vacation photo metadata',
    'photos/family/wedding.txt': 'Wedding photos metadata',
    'photos/family/birthday.txt': 'Birthday celebration photos',
    'projects/code/app.js': 'console.log("Hello, World!");',
    'projects/code/utils.js': 'module.exports = { helper: () => {} };',
    'projects/notes.txt': 'Project notes and ideas',
    'config.txt': 'Application configuration',
    'README.txt': 'Important information about this directory'
  };

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(demoDir, filePath);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content);
  }

  console.log(`Created demo data in ${demoDir}`);
  console.log('Directory structure:');
  console.log('  demo-data/');
  console.log('    ├── documents/');
  console.log('    │   ├── report.txt');
  console.log('    │   └── presentation.txt');
  console.log('    ├── photos/');
  console.log('    │   ├── vacation.txt');
  console.log('    │   └── family/');
  console.log('    │       ├── wedding.txt');
  console.log('    │       └── birthday.txt');
  console.log('    ├── projects/');
  console.log('    │   ├── code/');
  console.log('    │   │   ├── app.js');
  console.log('    │   │   └── utils.js');
  console.log('    │   └── notes.txt');
  console.log('    ├── config.txt');
  console.log('    └── README.txt');
  console.log();

  return demoDir;
}

// Demo 1: Basic backup
async function demo1_basicBackup() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 1: Basic Backup');
  console.log('='.repeat(60) + '\n');

  const demoDir = await createDemoData();
  const backupDir = path.join(__dirname, 'demo-backups');

  const tool = new BackupTool({
    timestamp: true,
    verify: true,
    verbose: true
  });

  console.log('Starting backup...\n');

  const stats = await tool.backup(demoDir, backupDir);

  console.log('\n' + '-'.repeat(60));
  console.log('BACKUP COMPLETE');
  console.log('-'.repeat(60));
  console.log(`Files backed up: ${stats.filesBackedUp}`);
  console.log(`Directories created: ${stats.directoriesCreated}`);
  console.log(`Total size: ${tool.formatSize(stats.bytesTransferred)}`);
  console.log(`Duration: ${stats.endTime - stats.startTime}ms`);
  console.log();
}

// Demo 2: Incremental backup
async function demo2_incrementalBackup() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 2: Incremental Backup');
  console.log('='.repeat(60) + '\n');

  const demoDir = path.join(__dirname, 'demo-data');
  const backupDir = path.join(__dirname, 'demo-backups-incremental');

  // First backup
  console.log('Step 1: Initial full backup\n');

  const tool1 = new BackupTool({
    timestamp: false,
    verify: false,
    incremental: true,
    verbose: false
  });

  const stats1 = await tool1.backup(demoDir, backupDir);
  console.log(`Initial backup: ${stats1.filesBackedUp} files backed up\n`);

  // Modify some files
  console.log('Step 2: Modifying files...\n');

  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

  await fs.writeFile(
    path.join(demoDir, 'documents/report.txt'),
    'Updated report content - ' + new Date().toISOString()
  );

  await fs.writeFile(
    path.join(demoDir, 'new-file.txt'),
    'This is a new file'
  );

  console.log('Modified: documents/report.txt');
  console.log('Created: new-file.txt\n');

  // Second backup (incremental)
  console.log('Step 3: Incremental backup\n');

  const tool2 = new BackupTool({
    timestamp: false,
    verify: false,
    incremental: true,
    verbose: true
  });

  const stats2 = await tool2.backup(demoDir, backupDir);

  console.log('\n' + '-'.repeat(60));
  console.log('INCREMENTAL BACKUP COMPLETE');
  console.log('-'.repeat(60));
  console.log(`Files backed up: ${stats2.filesBackedUp}`);
  console.log(`Files skipped (unchanged): ${stats2.filesSkipped}`);
  console.log();
}

// Demo 3: Backup with exclusions
async function demo3_exclusions() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 3: Backup with Exclusions');
  console.log('='.repeat(60) + '\n');

  const demoDir = path.join(__dirname, 'demo-data');
  const backupDir = path.join(__dirname, 'demo-backups-filtered');

  console.log('Excluding: photos/, *.js files\n');

  const tool = new BackupTool({
    timestamp: false,
    verify: false,
    verbose: true,
    excludePatterns: ['photos', /\.js$/]
  });

  const stats = await tool.backup(demoDir, backupDir);

  console.log('\n' + '-'.repeat(60));
  console.log('FILTERED BACKUP COMPLETE');
  console.log('-'.repeat(60));
  console.log(`Files backed up: ${stats.filesBackedUp}`);
  console.log(`Files skipped: ${stats.filesSkipped}`);
  console.log('\nPhotos and JS files were excluded from backup');
  console.log();
}

// Demo 4: Backup verification
async function demo4_verification() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 4: Backup Verification');
  console.log('='.repeat(60) + '\n');

  const demoDir = path.join(__dirname, 'demo-data');
  const backupDir = path.join(__dirname, 'demo-backups-verify');

  console.log('Creating backup with automatic verification...\n');

  const tool = new BackupTool({
    timestamp: false,
    verify: true,
    verbose: true
  });

  const stats = await tool.backup(demoDir, backupDir);

  console.log('\n' + '-'.repeat(60));
  console.log('VERIFICATION RESULTS');
  console.log('-'.repeat(60));

  if (stats.errors.some(e => e.type === 'VERIFICATION_FAILED')) {
    console.log('⚠ Some files failed verification!');
  } else {
    console.log('✓ All files verified successfully!');
  }

  console.log(`Total errors: ${stats.errors.length}`);
  console.log();

  // Demonstrate manual verification
  console.log('Manual verification example:');
  const sampleFile = stats.manifest[0];
  if (sampleFile) {
    const hash = await FileHasher.calculateHash(sampleFile.destPath);
    const isValid = hash === sampleFile.hash;
    console.log(`File: ${sampleFile.relativePath}`);
    console.log(`Hash: ${hash.substring(0, 16)}...`);
    console.log(`Valid: ${isValid ? '✓' : '✗'}`);
  }
  console.log();
}

// Demo 5: Restore from backup
async function demo5_restore() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 5: Restore from Backup');
  console.log('='.repeat(60) + '\n');

  const demoDir = path.join(__dirname, 'demo-data');
  const backupDir = path.join(__dirname, 'demo-backups-restore');
  const restoreDir = path.join(__dirname, 'demo-restored');

  // Create backup
  console.log('Step 1: Creating backup...\n');

  const tool = new BackupTool({
    timestamp: false,
    verify: false,
    verbose: false
  });

  await tool.backup(demoDir, backupDir);
  console.log('Backup created\n');

  // Simulate data loss
  console.log('Step 2: Simulating data loss...\n');
  console.log('(In real scenario, original data would be lost)\n');

  // Restore
  console.log('Step 3: Restoring from backup...\n');

  const result = await tool.restore(backupDir, restoreDir);

  console.log('-'.repeat(60));
  console.log('RESTORE COMPLETE');
  console.log('-'.repeat(60));
  console.log(`Files restored: ${result.restored}`);
  console.log(`Errors: ${result.errors.length}`);
  console.log();
  console.log(`Data restored to: ${restoreDir}`);
  console.log();
}

// Demo 6: Backup manifest
async function demo6_manifest() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 6: Backup Manifest');
  console.log('='.repeat(60) + '\n');

  const demoDir = path.join(__dirname, 'demo-data');
  const backupDir = path.join(__dirname, 'demo-backups-manifest');

  const tool = new BackupTool({
    timestamp: false,
    verify: false,
    verbose: false
  });

  await tool.backup(demoDir, backupDir);

  // Read and display manifest
  const manifestPath = path.join(backupDir, 'backup-manifest.json');
  const content = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(content);

  console.log('Backup Manifest:');
  console.log('-'.repeat(60));
  console.log(`Version: ${manifest.version}`);
  console.log(`Timestamp: ${manifest.timestamp}`);
  console.log(`Files backed up: ${manifest.stats.filesBackedUp}`);
  console.log(`Total size: ${tool.formatSize(manifest.stats.bytesTransferred)}`);
  console.log();
  console.log('Files in backup:');

  manifest.files.slice(0, 5).forEach((file, index) => {
    console.log(`  ${index + 1}. ${file.relativePath}`);
    console.log(`     Size: ${tool.formatSize(file.size)}`);
    console.log(`     Hash: ${file.hash.substring(0, 16)}...`);
  });

  if (manifest.files.length > 5) {
    console.log(`  ... and ${manifest.files.length - 5} more files`);
  }

  console.log();
}

// Demo 7: Progress tracking
async function demo7_progress() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 7: Progress Tracking');
  console.log('='.repeat(60) + '\n');

  const demoDir = path.join(__dirname, 'demo-data');
  const backupDir = path.join(__dirname, 'demo-backups-progress');

  let lastProgress = 0;

  const tool = new BackupTool({
    timestamp: false,
    verify: false,
    verbose: false,
    progressCallback: (data) => {
      const current = data.total;
      if (current > lastProgress) {
        process.stdout.write(`\rBacking up... ${current} files`);
        lastProgress = current;
      }
    }
  });

  await tool.backup(demoDir, backupDir);

  console.log('\n');
  console.log('-'.repeat(60));
  console.log('BACKUP COMPLETE with progress tracking');
  console.log('-'.repeat(60));
  console.log();
}

// Demo 8: Real-world scenario
async function demo8_realWorld() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 8: Real-World Backup Scenario');
  console.log('='.repeat(60) + '\n');

  console.log('Scenario: Daily backup of project files');
  console.log('Excluding: node_modules, .git, temporary files\n');

  const demoDir = path.join(__dirname, 'demo-data');
  const backupDir = path.join(__dirname, 'daily-backups');

  const tool = new BackupTool({
    timestamp: true,      // Create dated backup folder
    verify: true,         // Verify integrity
    incremental: true,    // Only backup changed files
    verbose: true,        // Show progress
    excludePatterns: [
      'node_modules',
      '.git',
      /\.tmp$/,
      /\.log$/
    ]
  });

  console.log('Starting daily backup...\n');

  const stats = await tool.backup(demoDir, backupDir);

  console.log('\n' + '='.repeat(60));
  console.log('DAILY BACKUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Files backed up: ${stats.filesBackedUp}`);
  console.log(`Files skipped: ${stats.filesSkipped}`);
  console.log(`Total size: ${tool.formatSize(stats.bytesTransferred)}`);
  console.log(`Duration: ${stats.endTime - stats.startTime}ms`);
  console.log(`Errors: ${stats.errors.length}`);
  console.log();

  if (stats.errors.length === 0) {
    console.log('✓ Backup completed successfully!');
  } else {
    console.log('⚠ Backup completed with errors:');
    stats.errors.forEach(err => {
      console.log(`  - ${err.message}`);
    });
  }

  console.log();
}

// Main demo runner
async function runAllDemos() {
  console.log('\n' + '='.repeat(60));
  console.log('FILE BACKUP TOOL - INTERACTIVE DEMOS');
  console.log('='.repeat(60));

  try {
    await demo1_basicBackup();
    await delay(2000);

    await demo2_incrementalBackup();
    await delay(2000);

    await demo3_exclusions();
    await delay(2000);

    await demo4_verification();
    await delay(2000);

    await demo5_restore();
    await delay(2000);

    await demo6_manifest();
    await delay(2000);

    await demo7_progress();
    await delay(2000);

    await demo8_realWorld();

    console.log('\n' + '='.repeat(60));
    console.log('ALL DEMOS COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nGenerated directories:');
    console.log('  - demo-data/           : Sample data');
    console.log('  - demo-backups*/       : Various backup examples');
    console.log('  - demo-restored/       : Restored data example');
    console.log('  - daily-backups/       : Real-world backup example');
    console.log();
    console.log('Key Features Demonstrated:');
    console.log('  ✓ Recursive directory backup');
    console.log('  ✓ Timestamped backups');
    console.log('  ✓ Incremental backups (changed files only)');
    console.log('  ✓ File exclusion patterns');
    console.log('  ✓ SHA-256 integrity verification');
    console.log('  ✓ Backup manifest generation');
    console.log('  ✓ Restore functionality');
    console.log('  ✓ Progress tracking');
    console.log('  ✓ Statistics and reporting');
    console.log();
    console.log('To clean up, run: rm -rf examples/demo-*');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\nDemo failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run demos if executed directly
if (require.main === module) {
  runAllDemos();
}

module.exports = {
  demo1_basicBackup,
  demo2_incrementalBackup,
  demo3_exclusions,
  demo4_verification,
  demo5_restore,
  demo6_manifest,
  demo7_progress,
  demo8_realWorld
};
