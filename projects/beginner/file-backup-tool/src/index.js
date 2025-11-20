#!/usr/bin/env node

/**
 * File Backup Tool CLI
 * Command-line interface for backup operations
 */

const BackupTool = require('./backup-tool');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    command: null,
    source: null,
    destination: null,
    noTimestamp: false,
    noVerify: false,
    incremental: false,
    exclude: [],
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;

      case '-v':
      case '--verbose':
        options.verbose = true;
        break;

      case '--no-timestamp':
        options.noTimestamp = true;
        break;

      case '--no-verify':
        options.noVerify = true;
        break;

      case '-i':
      case '--incremental':
        options.incremental = true;
        break;

      case '-e':
      case '--exclude':
        options.exclude.push(args[++i]);
        break;

      case 'backup':
      case 'restore':
      case 'verify':
        if (!options.command) {
          options.command = arg;
        }
        break;

      default:
        if (!arg.startsWith('-')) {
          if (!options.source) {
            options.source = arg;
          } else if (!options.destination) {
            options.destination = arg;
          }
        }
    }
  }

  return options;
}

// Display help message
function showHelp() {
  console.log(`
File Backup Tool - Recursive directory backup with integrity verification

USAGE:
  node index.js <command> <source> <destination> [options]

COMMANDS:
  backup <source> <dest>     Create a backup of source to destination
  restore <backup> <dest>    Restore from backup to destination
  verify <backup>            Verify backup integrity

OPTIONS:
  -h, --help                 Show this help message
  -v, --verbose              Show detailed output
  --no-timestamp             Don't add timestamp to backup directory name
  --no-verify                Skip backup verification
  -i, --incremental          Only backup changed files
  -e, --exclude PATTERN      Exclude files/directories matching pattern

EXAMPLES:
  # Backup a directory
  node index.js backup /path/to/source /path/to/destination

  # Backup with verbose output
  node index.js backup ./documents ./backups --verbose

  # Incremental backup (only changed files)
  node index.js backup ./source ./backups --incremental

  # Backup without timestamp in folder name
  node index.js backup ./source ./backups --no-timestamp

  # Exclude certain files
  node index.js backup ./source ./backups --exclude node_modules --exclude .git

  # Restore from backup
  node index.js restore ./backups/backup-20251120-103045 ./restore-location

  # Verify backup integrity
  node index.js verify ./backups/backup-20251120-103045

FEATURES:
  - Recursive directory copying
  - Progress tracking and statistics
  - Timestamp-based backup naming
  - SHA-256 integrity verification
  - Incremental backup support
  - File exclusion patterns
  - Detailed manifest generation
  - Preserve file timestamps
`);
}

// Progress indicator
class ProgressIndicator {
  constructor(verbose) {
    this.verbose = verbose;
    this.lastUpdate = Date.now();
    this.fileCount = 0;
  }

  update(data) {
    this.fileCount++;

    // Update every 100ms if not verbose
    if (!this.verbose && Date.now() - this.lastUpdate > 100) {
      process.stdout.write(`\rBacking up files... ${this.fileCount} files`);
      this.lastUpdate = Date.now();
    }
  }

  complete() {
    if (!this.verbose) {
      process.stdout.write('\n');
    }
  }
}

// Command: Backup
async function commandBackup(options) {
  if (!options.source || !options.destination) {
    console.error('Error: Source and destination paths are required');
    console.error('Usage: node index.js backup <source> <destination>');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('FILE BACKUP TOOL');
  console.log('='.repeat(60));
  console.log();
  console.log(`Source: ${path.resolve(options.source)}`);
  console.log(`Destination: ${path.resolve(options.destination)}`);
  console.log();

  if (options.incremental) {
    console.log('Mode: Incremental backup');
  }

  if (options.exclude.length > 0) {
    console.log(`Excluding: ${options.exclude.join(', ')}`);
  }

  console.log();

  const progress = new ProgressIndicator(options.verbose);

  const tool = new BackupTool({
    timestamp: !options.noTimestamp,
    verify: !options.noVerify,
    incremental: options.incremental,
    excludePatterns: options.exclude,
    verbose: options.verbose,
    progressCallback: (data) => progress.update(data)
  });

  try {
    const stats = await tool.backup(options.source, options.destination);

    progress.complete();

    console.log('='.repeat(60));
    console.log('BACKUP COMPLETE');
    console.log('='.repeat(60));
    console.log();
    console.log(`Files backed up: ${stats.filesBackedUp}`);
    console.log(`Directories created: ${stats.directoriesCreated}`);
    console.log(`Files skipped: ${stats.filesSkipped}`);
    console.log(`Total size: ${tool.formatSize(stats.bytesTransferred)}`);
    console.log(`Duration: ${stats.endTime - stats.startTime}ms`);

    if (stats.errors.length > 0) {
      console.log();
      console.log(`Errors: ${stats.errors.length}`);
      stats.errors.forEach(err => {
        console.log(`  - [${err.type}] ${err.message}`);
      });
    }

    console.log();
    console.log('='.repeat(60));

  } catch (error) {
    progress.complete();
    console.error();
    console.error('BACKUP FAILED');
    console.error('='.repeat(60));
    console.error(`Error: ${error.message}`);
    console.error();
    process.exit(1);
  }
}

// Command: Restore
async function commandRestore(options) {
  if (!options.source || !options.destination) {
    console.error('Error: Backup path and destination are required');
    console.error('Usage: node index.js restore <backup-path> <destination>');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('RESTORE FROM BACKUP');
  console.log('='.repeat(60));
  console.log();
  console.log(`Backup: ${path.resolve(options.source)}`);
  console.log(`Restore to: ${path.resolve(options.destination)}`);
  console.log();

  const tool = new BackupTool({
    verbose: options.verbose
  });

  try {
    const result = await tool.restore(options.source, options.destination);

    console.log('='.repeat(60));
    console.log('RESTORE COMPLETE');
    console.log('='.repeat(60));
    console.log();
    console.log(`Files restored: ${result.restored}`);

    if (result.errors.length > 0) {
      console.log(`Errors: ${result.errors.length}`);
      result.errors.forEach(err => {
        console.log(`  - ${err.file}: ${err.error}`);
      });
    }

    console.log();
    console.log('='.repeat(60));

  } catch (error) {
    console.error();
    console.error('RESTORE FAILED');
    console.error('='.repeat(60));
    console.error(`Error: ${error.message}`);
    console.error();
    process.exit(1);
  }
}

// Command: Verify
async function commandVerify(options) {
  if (!options.source) {
    console.error('Error: Backup path is required');
    console.error('Usage: node index.js verify <backup-path>');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('VERIFY BACKUP INTEGRITY');
  console.log('='.repeat(60));
  console.log();
  console.log(`Backup: ${path.resolve(options.source)}`);
  console.log();

  const fs = require('fs').promises;
  const manifestPath = path.join(options.source, 'backup-manifest.json');

  try {
    const FileHasher = require('./hasher');

    // Read manifest
    const manifestContent = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    console.log(`Verifying ${manifest.files.length} files...\n`);

    let verified = 0;
    let failed = 0;

    for (const file of manifest.files) {
      try {
        // Check if file exists
        await fs.access(file.destPath);

        // Verify hash
        const hash = await FileHasher.calculateHash(file.destPath);

        if (hash === file.hash) {
          verified++;
          if (options.verbose) {
            console.log(`✓ ${file.relativePath}`);
          }
        } else {
          failed++;
          console.log(`✗ ${file.relativePath} - Hash mismatch`);
        }

      } catch (error) {
        failed++;
        console.log(`✗ ${file.relativePath} - ${error.message}`);
      }
    }

    console.log();
    console.log('='.repeat(60));
    console.log('VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log();
    console.log(`Verified: ${verified}`);
    console.log(`Failed: ${failed}`);
    console.log();

    if (failed > 0) {
      console.log('⚠ Backup integrity compromised!');
      process.exit(1);
    } else {
      console.log('✓ Backup integrity verified successfully');
    }

    console.log();
    console.log('='.repeat(60));

  } catch (error) {
    console.error();
    console.error('VERIFICATION FAILED');
    console.error('='.repeat(60));
    console.error(`Error: ${error.message}`);
    console.error();
    process.exit(1);
  }
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help || !options.command) {
    showHelp();
    process.exit(0);
  }

  try {
    switch (options.command) {
      case 'backup':
        await commandBackup(options);
        break;

      case 'restore':
        await commandRestore(options);
        break;

      case 'verify':
        await commandVerify(options);
        break;

      default:
        console.error(`Unknown command: ${options.command}`);
        showHelp();
        process.exit(1);
    }

  } catch (error) {
    console.error('\nError:', error.message);

    if (options.verbose) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { parseArgs, showHelp };
