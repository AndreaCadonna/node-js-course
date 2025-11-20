# File Backup Tool

A production-ready file backup utility for Node.js with recursive copying, integrity verification, and restore capabilities. Built using only Node.js core modules (`fs`, `path`, `buffer`, and `crypto`).

## Features

- **Recursive Backup**: Automatically backs up entire directory trees
- **Integrity Verification**: SHA-256 hash verification for all files
- **Timestamped Backups**: Optional dated backup directories
- **Incremental Backups**: Only backup changed files
- **Restore Functionality**: Restore from any backup with verification
- **Exclusion Patterns**: Exclude files/directories by name or regex
- **Progress Tracking**: Real-time backup progress callbacks
- **Detailed Manifests**: JSON metadata for each backup
- **Preserve Timestamps**: Maintains original file modification times
- **Statistics**: Comprehensive backup metrics and reporting

## Project Structure

```
file-backup-tool/
├── src/
│   ├── backup-tool.js     # Main BackupTool class
│   ├── hasher.js          # File integrity verification
│   └── index.js           # CLI interface
├── tests/
│   └── test-backup-tool.js # Comprehensive test suite
├── examples/
│   └── demo.js            # Interactive demos
└── README.md              # This file
```

## Installation

No installation required! This project uses only Node.js core modules.

```bash
# Clone or download the project
cd file-backup-tool
```

## Quick Start

### Basic Backup

```javascript
const BackupTool = require('./src/backup-tool');

const tool = new BackupTool();
const stats = await tool.backup('/path/to/source', '/path/to/backups');

console.log(`Backed up ${stats.filesBackedUp} files`);
```

### Command Line

```bash
# Backup a directory
node src/index.js backup ./source ./backups

# Restore from backup
node src/index.js restore ./backups/backup-20251120-103045 ./restored

# Verify backup integrity
node src/index.js verify ./backups/backup-20251120-103045
```

## Usage

### Programmatic API

#### Basic Backup

```javascript
const BackupTool = require('./src/backup-tool');

const tool = new BackupTool({
  timestamp: true,      // Add timestamp to backup folder
  verify: true,         // Verify backup integrity
  verbose: true         // Show detailed output
});

const stats = await tool.backup(
  '/path/to/source',
  '/path/to/destination'
);
```

#### Incremental Backup

```javascript
const tool = new BackupTool({
  incremental: true,    // Only backup changed files
  timestamp: true
});

await tool.backup('./documents', './backups');
// First run: backs up all files
// Second run: only backs up new/modified files
```

#### Backup with Exclusions

```javascript
const tool = new BackupTool({
  excludePatterns: [
    'node_modules',         // Exclude by name
    '.git',                 // Exclude directories
    /\.tmp$/,               // Exclude by regex (*.tmp files)
    /\.log$/                // Exclude log files
  ]
});

await tool.backup('./project', './backups');
```

#### Progress Tracking

```javascript
const tool = new BackupTool({
  progressCallback: (data) => {
    console.log(`Backed up: ${data.path}`);
    console.log(`Total: ${data.total} files`);
  }
});

await tool.backup('./source', './backups');
```

#### Restore from Backup

```javascript
const tool = new BackupTool();

const result = await tool.restore(
  './backups/backup-20251120-103045',
  './restored'
);

console.log(`Restored ${result.restored} files`);
```

### Command Line Interface

#### Backup Commands

```bash
# Basic backup
node src/index.js backup /path/to/source /path/to/dest

# Backup with options
node src/index.js backup ./docs ./backups --verbose

# Incremental backup
node src/index.js backup ./source ./backups --incremental

# Backup without timestamp
node src/index.js backup ./source ./backups --no-timestamp

# Exclude patterns
node src/index.js backup ./project ./backups \
  --exclude node_modules \
  --exclude .git \
  --exclude "*.log"
```

#### Restore Commands

```bash
# Restore from backup
node src/index.js restore ./backups/backup-20251120-103045 ./restored

# Restore with verbose output
node src/index.js restore ./backups/backup-20251120-103045 ./restored --verbose
```

#### Verify Commands

```bash
# Verify backup integrity
node src/index.js verify ./backups/backup-20251120-103045

# Verify with verbose output
node src/index.js verify ./backups/backup-20251120-103045 --verbose
```

## API Reference

### BackupTool Constructor

```javascript
new BackupTool(options)
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timestamp` | boolean | `true` | Add timestamp to backup folder name |
| `verify` | boolean | `true` | Verify backup integrity after completion |
| `incremental` | boolean | `false` | Only backup changed files |
| `excludePatterns` | array | `[]` | File/directory exclusion patterns |
| `progressCallback` | function | `null` | Progress update callback |
| `verbose` | boolean | `false` | Show detailed output |

### Methods

#### backup(sourcePath, destinationPath)

Creates a backup of source to destination.

```javascript
const stats = await tool.backup('/source', '/destination');
```

**Returns:** Statistics object with:
- `filesBackedUp`: Number of files backed up
- `directoriesCreated`: Number of directories created
- `bytesTransferred`: Total bytes transferred
- `filesSkipped`: Number of files skipped
- `errors`: Array of error objects
- `manifest`: Array of backed up file metadata
- `startTime`: Backup start time
- `endTime`: Backup end time

#### restore(backupPath, restorePath)

Restores files from a backup.

```javascript
const result = await tool.restore('/backup', '/restore-to');
```

**Returns:** Object with:
- `restored`: Number of files restored
- `errors`: Array of error objects

#### verifyBackup(sourcePath, backupPath)

Verifies backup integrity by comparing file hashes.

```javascript
const result = await tool.verifyBackup('/source', '/backup');
```

**Returns:** Object with:
- `verified`: Number of verified files
- `failed`: Number of failed verifications

### FileHasher Class

Utility for calculating and verifying file hashes.

```javascript
const FileHasher = require('./src/hasher');

// Calculate file hash
const hash = await FileHasher.calculateHash('/path/to/file');

// Calculate buffer hash
const bufferHash = FileHasher.calculateBufferHash(buffer);

// Verify file integrity
const isValid = await FileHasher.verifyFile('/path/to/file', expectedHash);
```

## Examples

### Example 1: Daily Automated Backup

```javascript
const BackupTool = require('./src/backup-tool');

async function dailyBackup() {
  const tool = new BackupTool({
    timestamp: true,
    verify: true,
    incremental: true,
    excludePatterns: [
      'node_modules',
      '.git',
      'dist',
      'build',
      /\.tmp$/,
      /\.log$/
    ],
    verbose: true
  });

  try {
    const stats = await tool.backup(
      '/home/user/documents',
      '/backup/daily'
    );

    console.log(`✓ Backup successful: ${stats.filesBackedUp} files`);

    // Optional: Send notification
    if (stats.errors.length > 0) {
      console.warn(`⚠ ${stats.errors.length} errors occurred`);
    }

  } catch (error) {
    console.error('Backup failed:', error.message);
    // Optional: Send alert
  }
}

dailyBackup();
```

### Example 2: Project Backup Before Deployment

```javascript
async function preDeploymentBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const tool = new BackupTool({
    timestamp: false, // We're adding our own timestamp
    verify: true,
    excludePatterns: ['node_modules', '.git', '.env']
  });

  const backupPath = `./backups/pre-deployment-${timestamp}`;

  await tool.backup('./project', backupPath);

  console.log(`Pre-deployment backup created: ${backupPath}`);
}
```

### Example 3: Backup with Progress Bar

```javascript
function createProgressBar(total) {
  let current = 0;

  return {
    update: (data) => {
      current = data.total;
      const percent = Math.round((current / total) * 100);
      const bar = '█'.repeat(percent / 2) + '░'.repeat(50 - percent / 2);
      process.stdout.write(`\r[${bar}] ${percent}% (${current}/${total})`);
    },
    complete: () => {
      process.stdout.write('\n');
    }
  };
}

async function backupWithProgress() {
  // First, count files
  // (In real implementation, you'd walk the directory first)
  const estimatedFiles = 100;

  const progress = createProgressBar(estimatedFiles);

  const tool = new BackupTool({
    progressCallback: (data) => progress.update(data)
  });

  await tool.backup('./source', './backups');
  progress.complete();
}
```

### Example 4: Scheduled Backup with Rotation

```javascript
const BackupTool = require('./src/backup-tool');
const fs = require('fs').promises;
const path = require('path');

async function rotateBackups(backupDir, keepCount = 7) {
  const entries = await fs.readdir(backupDir, { withFileTypes: true });

  const backups = entries
    .filter(e => e.isDirectory() && e.name.startsWith('backup-'))
    .map(e => ({
      name: e.name,
      path: path.join(backupDir, e.name),
      date: e.name.split('backup-')[1]
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Delete old backups
  for (const backup of backups.slice(keepCount)) {
    await fs.rm(backup.path, { recursive: true });
    console.log(`Deleted old backup: ${backup.name}`);
  }
}

async function scheduledBackup() {
  const tool = new BackupTool({
    timestamp: true,
    verify: true,
    incremental: true,
    excludePatterns: ['node_modules', '.git', /\.tmp$/]
  });

  await tool.backup('/home/user/documents', '/backups');

  // Keep only last 7 backups
  await rotateBackups('/backups', 7);
}
```

## Backup Manifest

Each backup includes a `backup-manifest.json` file with complete metadata:

```json
{
  "version": "1.0",
  "timestamp": "2025-11-20T10:30:45.123Z",
  "stats": {
    "filesBackedUp": 42,
    "directoriesCreated": 8,
    "bytesTransferred": 1048576,
    "filesSkipped": 3
  },
  "options": {
    "timestamp": true,
    "verify": true,
    "incremental": false
  },
  "files": [
    {
      "sourcePath": "/source/file.txt",
      "destPath": "/backup/source/file.txt",
      "relativePath": "source/file.txt",
      "size": 1024,
      "mtime": "2025-11-20T10:00:00.000Z",
      "hash": "5d41402abc4b2a76b9719d911017c592..."
    }
  ]
}
```

## Integrity Verification

The tool uses SHA-256 hashing to verify file integrity:

```javascript
// During backup
const hash = await FileHasher.calculateHash(sourceFile);
// Hash is stored in manifest

// During verification
const currentHash = await FileHasher.calculateHash(backupFile);
const isValid = currentHash === manifestHash;
```

## Running Tests

Comprehensive test suite with 20+ test cases:

```bash
node tests/test-backup-tool.js
```

**Test Coverage:**
- ✓ File hashing and verification
- ✓ Single file backup
- ✓ Recursive directory backup
- ✓ Timestamped backups
- ✓ Statistics tracking
- ✓ Manifest generation
- ✓ Integrity verification
- ✓ File exclusions
- ✓ Incremental backups
- ✓ Restore functionality
- ✓ Timestamp preservation
- ✓ Error handling
- ✓ Edge cases

## Running Demos

Interactive demonstrations:

```bash
node examples/demo.js
```

**Demos include:**
1. Basic backup
2. Incremental backup
3. Backup with exclusions
4. Backup verification
5. Restore from backup
6. Backup manifest
7. Progress tracking
8. Real-world scenario

## Best Practices

### 1. Always Verify Backups

```javascript
const tool = new BackupTool({
  verify: true  // Enable verification
});
```

### 2. Use Incremental Backups for Large Datasets

```javascript
const tool = new BackupTool({
  incremental: true,  // Only backup changed files
  timestamp: true      // Keep separate backup for each run
});
```

### 3. Exclude Unnecessary Files

```javascript
const tool = new BackupTool({
  excludePatterns: [
    'node_modules',
    '.git',
    'dist',
    'build',
    /\.tmp$/,
    /\.log$/,
    /\.cache$/
  ]
});
```

### 4. Implement Backup Rotation

Keep only recent backups to save space:

```javascript
async function rotateBackups(dir, keep = 7) {
  // Keep only last 7 backups
  const backups = await getBackups(dir);
  for (const old of backups.slice(keep)) {
    await fs.rm(old, { recursive: true });
  }
}
```

### 5. Test Restore Regularly

```javascript
// Periodically test that backups can be restored
async function testRestore() {
  const tool = new BackupTool();
  const result = await tool.restore(
    './backups/latest',
    './restore-test'
  );

  if (result.errors.length > 0) {
    console.error('Restore test failed!');
  }
}
```

### 6. Monitor Backup Statistics

```javascript
const stats = await tool.backup('./source', './backups');

if (stats.errors.length > 0) {
  // Send alert
  notifyAdmin(`Backup completed with ${stats.errors.length} errors`);
}

if (stats.filesBackedUp === 0) {
  // Possible issue
  notifyAdmin('Warning: No files backed up');
}
```

## Error Handling

The tool handles errors gracefully and continues operation:

```javascript
const stats = await tool.backup('./source', './backups');

// Check for errors
if (stats.errors.length > 0) {
  console.log('Errors occurred:');
  stats.errors.forEach(error => {
    console.log(`[${error.type}] ${error.message}`);
    if (error.path) {
      console.log(`  Path: ${error.path}`);
    }
  });
}
```

**Error Types:**
- `CRITICAL`: Fatal errors that stop the backup
- `FILE_BACKUP_ERROR`: Error backing up a specific file
- `DIRECTORY_BACKUP_ERROR`: Error backing up a directory
- `VERIFICATION_FAILED`: File verification failed
- `VERIFICATION_ERROR`: Error during verification
- `MANIFEST_ERROR`: Error generating manifest

## Performance Considerations

### Large Files

The tool uses streams for hashing, making it memory-efficient for large files:

```javascript
// Efficiently handles files of any size
const hash = await FileHasher.calculateHash('large-file.bin');
```

### Many Files

For directories with thousands of files, use progress callbacks to monitor:

```javascript
const tool = new BackupTool({
  progressCallback: (data) => {
    if (data.total % 100 === 0) {
      console.log(`Processed ${data.total} files...`);
    }
  }
});
```

### Network/Remote Backups

For backing up to network drives or slow destinations:

```javascript
// Consider disabling verification for network drives
const tool = new BackupTool({
  verify: false,  // Verify separately if needed
  verbose: true    // Monitor progress
});
```

## Troubleshooting

### Backup Fails with Permission Error

```bash
# Check source permissions
ls -la /source/directory

# Check destination permissions
ls -la /backup/directory
```

### Verification Fails

```javascript
// Check specific file
const hash1 = await FileHasher.calculateHash(sourceFile);
const hash2 = await FileHasher.calculateHash(backupFile);

console.log('Source hash:', hash1);
console.log('Backup hash:', hash2);
console.log('Match:', hash1 === hash2);
```

### Out of Disk Space

```javascript
// Check available space before backup
const { statfs } = require('fs');

// Monitor bytes transferred
const tool = new BackupTool({
  progressCallback: (data) => {
    const stats = tool.getStats();
    console.log(`Transferred: ${tool.formatSize(stats.bytesTransferred)}`);
  }
});
```

## Learning Objectives

This project demonstrates:

- **File System Operations**: Recursive directory traversal, copying, reading/writing
- **Path Manipulation**: Working with absolute and relative paths
- **Buffer Usage**: Efficient handling of binary data
- **Crypto Module**: Hash generation for integrity verification
- **Async/Await**: Modern asynchronous programming patterns
- **Error Handling**: Comprehensive error catching and reporting
- **Testing**: Writing test suites for file operations
- **CLI Development**: Building command-line tools

## Advanced Use Cases

### 1. Backup with Compression (Future Enhancement)

```javascript
// Placeholder for future compression feature
const tool = new BackupTool({
  compress: true,  // Compress backup files (not yet implemented)
  compressionLevel: 6
});
```

### 2. Encrypted Backups (Future Enhancement)

```javascript
// Placeholder for future encryption feature
const tool = new BackupTool({
  encrypt: true,   // Encrypt backup files (not yet implemented)
  password: 'secure-password'
});
```

### 3. Remote Backups (Future Enhancement)

```javascript
// Placeholder for future remote backup feature
const tool = new BackupTool({
  remote: {
    type: 's3',  // or 'ftp', 'ssh', etc. (not yet implemented)
    credentials: {...}
  }
});
```

## License

MIT License - Free to use and modify

## Author

Created as part of the Node.js Core Modules Course - Beginner Project 3

---

**Happy Backing Up! 💾**
