/**
 * File Backup Tool - Recursive directory backup with integrity verification
 * Uses fs, path, and buffer modules
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const FileHasher = require('./hasher');

class BackupTool {
  constructor(options = {}) {
    this.options = {
      timestamp: options.timestamp !== false, // default true
      verify: options.verify !== false, // default true
      incremental: options.incremental || false,
      compress: options.compress || false, // Not implemented yet
      excludePatterns: options.excludePatterns || [],
      progressCallback: options.progressCallback || null,
      verbose: options.verbose || false
    };

    // Statistics tracking
    this.stats = {
      filesBackedUp: 0,
      directoriesCreated: 0,
      bytesTransferred: 0,
      filesSkipped: 0,
      errors: [],
      startTime: null,
      endTime: null,
      manifest: [] // List of backed up files with metadata
    };
  }

  /**
   * Main backup method
   * @param {string} sourcePath - Source file or directory
   * @param {string} destinationPath - Destination directory
   */
  async backup(sourcePath, destinationPath) {
    this.stats.startTime = new Date();

    try {
      // Validate paths
      await this.validatePaths(sourcePath, destinationPath);

      // Prepare destination directory
      const backupDir = await this.prepareBackupDirectory(destinationPath);

      // Perform backup
      await this.backupPath(sourcePath, backupDir, '');

      // Generate manifest
      await this.generateManifest(backupDir);

      // Verify backup if enabled
      if (this.options.verify) {
        await this.verifyBackup(sourcePath, backupDir);
      }

      this.stats.endTime = new Date();
      return this.stats;

    } catch (error) {
      this.stats.errors.push({
        type: 'CRITICAL',
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Validate source and destination paths
   */
  async validatePaths(sourcePath, destinationPath) {
    // Check if source exists
    try {
      await fs.access(sourcePath);
    } catch (error) {
      throw new Error(`Source path does not exist: ${sourcePath}`);
    }

    // Check if destination is valid
    if (!destinationPath) {
      throw new Error('Destination path is required');
    }

    // Prevent backing up to a subdirectory of source
    const resolvedSource = path.resolve(sourcePath);
    const resolvedDest = path.resolve(destinationPath);

    if (resolvedDest.startsWith(resolvedSource)) {
      throw new Error('Destination cannot be inside source directory');
    }
  }

  /**
   * Prepare backup directory with optional timestamp
   */
  async prepareBackupDirectory(destinationPath) {
    let backupDir = destinationPath;

    // Add timestamp if enabled
    if (this.options.timestamp) {
      const timestamp = this.getTimestamp();
      backupDir = path.join(destinationPath, `backup-${timestamp}`);
    }

    // Create backup directory
    await fs.mkdir(backupDir, { recursive: true });

    if (this.options.verbose) {
      console.log(`Created backup directory: ${backupDir}`);
    }

    return backupDir;
  }

  /**
   * Get formatted timestamp for backup naming
   */
  getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  /**
   * Check if path should be excluded
   */
  shouldExclude(filePath) {
    if (this.options.excludePatterns.length === 0) {
      return false;
    }

    const fileName = path.basename(filePath);

    for (const pattern of this.options.excludePatterns) {
      if (typeof pattern === 'string') {
        // Simple string match
        if (fileName === pattern || filePath.includes(pattern)) {
          return true;
        }
      } else if (pattern instanceof RegExp) {
        // Regular expression match
        if (pattern.test(filePath)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Recursively backup a path (file or directory)
   */
  async backupPath(sourcePath, destinationBase, relativePath) {
    // Check if should be excluded
    if (this.shouldExclude(sourcePath)) {
      this.stats.filesSkipped++;
      if (this.options.verbose) {
        console.log(`Skipped (excluded): ${sourcePath}`);
      }
      return;
    }

    try {
      const stats = await fs.stat(sourcePath);

      if (stats.isDirectory()) {
        await this.backupDirectory(sourcePath, destinationBase, relativePath);
      } else if (stats.isFile()) {
        await this.backupFile(sourcePath, destinationBase, relativePath, stats);
      } else {
        // Skip symlinks, special files, etc.
        this.stats.filesSkipped++;
        if (this.options.verbose) {
          console.log(`Skipped (special file): ${sourcePath}`);
        }
      }

    } catch (error) {
      this.stats.errors.push({
        type: 'BACKUP_ERROR',
        path: sourcePath,
        message: error.message
      });

      if (this.options.verbose) {
        console.error(`Error backing up ${sourcePath}: ${error.message}`);
      }
    }
  }

  /**
   * Backup a single file
   */
  async backupFile(sourcePath, destinationBase, relativePath, stats) {
    const fileName = path.basename(sourcePath);
    const destPath = path.join(destinationBase, relativePath, fileName);

    try {
      // Check if incremental backup and file exists
      if (this.options.incremental) {
        try {
          const destStats = await fs.stat(destPath);
          // Skip if destination is newer or same time
          if (destStats.mtime >= stats.mtime) {
            this.stats.filesSkipped++;
            if (this.options.verbose) {
              console.log(`Skipped (unchanged): ${fileName}`);
            }
            return;
          }
        } catch (error) {
          // File doesn't exist, continue with backup
        }
      }

      // Calculate source hash for verification
      const sourceHash = await FileHasher.calculateHash(sourcePath);

      // Copy file
      await fs.copyFile(sourcePath, destPath);

      // Preserve timestamps
      await fs.utimes(destPath, stats.atime, stats.mtime);

      this.stats.filesBackedUp++;
      this.stats.bytesTransferred += stats.size;

      // Add to manifest
      this.stats.manifest.push({
        sourcePath,
        destPath,
        relativePath: path.join(relativePath, fileName),
        size: stats.size,
        mtime: stats.mtime,
        hash: sourceHash
      });

      // Progress callback
      if (this.options.progressCallback) {
        this.options.progressCallback({
          type: 'file',
          path: sourcePath,
          size: stats.size,
          total: this.stats.filesBackedUp
        });
      }

      if (this.options.verbose) {
        console.log(`Backed up: ${sourcePath} (${this.formatSize(stats.size)})`);
      }

    } catch (error) {
      this.stats.errors.push({
        type: 'FILE_BACKUP_ERROR',
        path: sourcePath,
        message: error.message
      });

      if (this.options.verbose) {
        console.error(`Error backing up file ${sourcePath}: ${error.message}`);
      }
    }
  }

  /**
   * Backup a directory recursively
   */
  async backupDirectory(sourcePath, destinationBase, relativePath) {
    const dirName = path.basename(sourcePath);
    const newRelativePath = path.join(relativePath, dirName);
    const destPath = path.join(destinationBase, newRelativePath);

    try {
      // Create destination directory
      await fs.mkdir(destPath, { recursive: true });
      this.stats.directoriesCreated++;

      if (this.options.verbose) {
        console.log(`Created directory: ${newRelativePath}`);
      }

      // Read directory contents
      const entries = await fs.readdir(sourcePath, { withFileTypes: true });

      // Backup each entry
      for (const entry of entries) {
        const entryPath = path.join(sourcePath, entry.name);
        await this.backupPath(entryPath, destinationBase, newRelativePath);
      }

    } catch (error) {
      this.stats.errors.push({
        type: 'DIRECTORY_BACKUP_ERROR',
        path: sourcePath,
        message: error.message
      });

      if (this.options.verbose) {
        console.error(`Error backing up directory ${sourcePath}: ${error.message}`);
      }
    }
  }

  /**
   * Generate backup manifest (metadata file)
   */
  async generateManifest(backupDir) {
    const manifestPath = path.join(backupDir, 'backup-manifest.json');

    const manifest = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      stats: {
        filesBackedUp: this.stats.filesBackedUp,
        directoriesCreated: this.stats.directoriesCreated,
        bytesTransferred: this.stats.bytesTransferred,
        filesSkipped: this.stats.filesSkipped
      },
      options: this.options,
      files: this.stats.manifest
    };

    try {
      await fs.writeFile(
        manifestPath,
        JSON.stringify(manifest, null, 2),
        'utf8'
      );

      if (this.options.verbose) {
        console.log(`Generated manifest: ${manifestPath}`);
      }

    } catch (error) {
      this.stats.errors.push({
        type: 'MANIFEST_ERROR',
        message: error.message
      });
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(sourcePath, backupDir) {
    if (this.options.verbose) {
      console.log('\nVerifying backup integrity...');
    }

    let verified = 0;
    let failed = 0;

    for (const file of this.stats.manifest) {
      try {
        // Check if file exists
        await fs.access(file.destPath);

        // Verify hash
        const destHash = await FileHasher.calculateHash(file.destPath);

        if (destHash === file.hash) {
          verified++;
        } else {
          failed++;
          this.stats.errors.push({
            type: 'VERIFICATION_FAILED',
            path: file.destPath,
            message: 'Hash mismatch'
          });
        }

      } catch (error) {
        failed++;
        this.stats.errors.push({
          type: 'VERIFICATION_ERROR',
          path: file.destPath,
          message: error.message
        });
      }
    }

    if (this.options.verbose) {
      console.log(`Verification complete: ${verified} verified, ${failed} failed`);
    }

    return { verified, failed };
  }

  /**
   * Restore from backup
   */
  async restore(backupDir, restoreDestination) {
    try {
      // Read manifest
      const manifestPath = path.join(backupDir, 'backup-manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);

      if (this.options.verbose) {
        console.log(`Restoring from backup: ${backupDir}`);
        console.log(`Files to restore: ${manifest.files.length}`);
      }

      let restored = 0;
      const errors = [];

      // Restore each file
      for (const file of manifest.files) {
        try {
          const sourceBackup = file.destPath;
          const restorePath = path.join(restoreDestination, file.relativePath);

          // Create directory if needed
          const restoreDir = path.dirname(restorePath);
          await fs.mkdir(restoreDir, { recursive: true });

          // Copy file
          await fs.copyFile(sourceBackup, restorePath);

          // Verify
          const backupHash = await FileHasher.calculateHash(sourceBackup);
          const restoreHash = await FileHasher.calculateHash(restorePath);

          if (backupHash !== restoreHash) {
            throw new Error('Hash verification failed after restore');
          }

          restored++;

          if (this.options.verbose) {
            console.log(`Restored: ${file.relativePath}`);
          }

        } catch (error) {
          errors.push({
            file: file.relativePath,
            error: error.message
          });
        }
      }

      return { restored, errors };

    } catch (error) {
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * Format bytes to human-readable size
   */
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Get backup statistics
   */
  getStats() {
    return {
      ...this.stats,
      duration: this.stats.endTime && this.stats.startTime
        ? this.stats.endTime - this.stats.startTime
        : null,
      formattedSize: this.formatSize(this.stats.bytesTransferred)
    };
  }
}

module.exports = BackupTool;
